/**
 * Generates the procedural textures the cone needs, so the repo never depends
 * on an asset drop that hasn't happened yet.
 *
 *   public/assets/textures/yarn-fibre-normal.png  tiling fibre/winding normal
 *   public/assets/textures/yarn-fibre-rough.png   matching roughness break-up
 *   public/assets/textures/yarn-matcap.png        Lite-tier cone shading
 *   public/assets/textures/weave-static.png       Lite/Static-tier woven ground
 *
 * Run: node scripts/gen-textures.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// ---------------------------------------------------------------- PNG writer

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

/**
 * Filters one scanline with each of the five PNG filter types and keeps the
 * one with the lowest absolute-sum heuristic. On noisy procedural data this is
 * worth roughly 4x over storing raw scanlines.
 */
function filterScanline(cur, prev, bpp, out, off) {
  const n = cur.length;
  let best = null;
  const cand = Buffer.alloc(n);

  for (let type = 0; type <= 4; type++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v;
      switch (type) {
        case 0: v = cur[i]; break;
        case 1: v = cur[i] - a; break;
        case 2: v = cur[i] - b; break;
        case 3: v = cur[i] - ((a + b) >> 1); break;
        default: v = cur[i] - paeth(a, b, c);
      }
      v &= 0xff;
      cand[i] = v;
      sum += v < 128 ? v : 256 - v;
    }
    if (best === null || sum < best.sum) {
      best = { sum, type, data: Buffer.from(cand) };
    }
  }

  out[off] = best.type;
  best.data.copy(out, off + 1);
}

/** data: Uint8Array of w*h*channels. channels 3 = RGB, 1 = greyscale. */
function encodePNG(w, h, data, channels = 3) {
  const stride = w * channels;
  const raw = Buffer.alloc((stride + 1) * h);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const cur = Buffer.from(data.subarray(y * stride, (y + 1) * stride));
    filterScanline(cur, prev, channels, raw, y * (stride + 1));
    prev = cur;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = channels === 1 ? 0 : 2; // greyscale | truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function write(path, buf) {
  const full = resolve(process.cwd(), path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, buf);
  console.log(`${path}  ${(buf.length / 1024).toFixed(1)} KB`);
}

// ------------------------------------------------------------- tiling noise

function hash2(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + seed * 1274126177;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const smooth = (t) => t * t * (3 - 2 * t);

/** Value noise on a `period`x`period` integer lattice — wraps seamlessly. */
function valueNoise(u, v, period, seed) {
  const x = u * period;
  const y = v * period;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const m = (n) => ((n % period) + period) % period;
  const a = hash2(m(x0), m(y0), seed);
  const b = hash2(m(x0 + 1), m(y0), seed);
  const c = hash2(m(x0), m(y0 + 1), seed);
  const d = hash2(m(x0 + 1), m(y0 + 1), seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(u, v, base, octaves, seed) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(u, v, base * 2 ** o, seed + o * 17);
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

// ------------------------------------------------- fibre / winding normal map

/**
 * The winding angle on a cone package is roughly 18° off horizontal, and a
 * traverse-wound package shows the crossing pass as well — that criss-cross is
 * what makes the surface read as thousands of wraps rather than a striped tube.
 *
 * Wave vectors are chosen as integer cycle counts so the tile is seamless:
 * (-7, 23) gives atan(7/23) = 16.9° with 24 wraps across the tile. Tiled four
 * times around the package that lands at ~96 wraps — fine enough to read as
 * yarn rather than corduroy, coarse enough not to alias into flat grey.
 *
 * The crossing pass is kept weak on purpose. At equal amplitude the two
 * directions interfere into a diamond lattice and the package reads as
 * knitwear; on a real cone the top layer dominates and the pass beneath it
 * only shows as a faint interruption.
 */
function fibreHeight(u, v) {
  const TAU = Math.PI * 2;
  const main = Math.cos(TAU * (-7 * u + 23 * v));
  const cross = Math.cos(TAU * (7 * u + 23 * v));

  // Round the top of each wrap and flatten the valley: yarn is a stack of
  // cylinders, not a sine wave.
  const ridge = (s) => {
    const t = 0.5 + 0.5 * s;
    return Math.pow(t, 0.8);
  };

  const wraps = ridge(main) * 1.0 + ridge(cross) * 0.17;

  // Individual filaments running along the strand, plus loose fuzz.
  const filament = Math.cos(TAU * (69 * u + 21 * v)) * 0.05;
  const fuzz = (fbm(u, v, 72, 3, 7) - 0.5) * 0.20;
  const drift = (fbm(u, v, 5, 2, 91) - 0.5) * 0.12; // slack/tension variation

  return wraps * 0.62 + filament + fuzz + drift;
}

function makeFibreMaps(size = 512) {
  const H = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      H[y * size + x] = fibreHeight(x / size, y / size);
    }
  }

  const normal = new Uint8Array(size * size * 3);
  const rough = new Uint8Array(size * size);
  const at = (x, y) => H[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
  const STRENGTH = 2.6;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * STRENGTH;
      const dy = (at(x, y + 1) - at(x, y - 1)) * STRENGTH;
      // Tangent-space normal: green points up (OpenGL convention, which is
      // what three.js expects).
      let nx = -dx;
      let ny = -dy;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 3;
      normal[i] = Math.round((nx * 0.5 + 0.5) * 255);
      normal[i + 1] = Math.round((-ny * 0.5 + 0.5) * 255);
      normal[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);

      // Valleys between wraps trap light and read rougher; the crown of each
      // wrap is where the sheen lives.
      const h = at(x, y);
      const r = Math.min(1, Math.max(0, 0.80 + h * 0.16));
      rough[y * size + x] = Math.round(r * 255);
    }
  }

  return {
    normal: encodePNG(size, size, normal, 3),
    rough: encodePNG(size, size, rough, 1),
  };
}

// ------------------------------------------------------------------- matcap

/** Soft white-fabric matcap for the Lite tier, which ships no environment. */
function makeMatcap(size = 256) {
  const out = new Uint8Array(size * size * 3);
  const key = { x: -0.42, y: 0.55, z: 0.72 };
  const fill = { x: 0.35, y: -0.30, z: 0.60 };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / (size - 1)) * 2 - 1;
      const v = 1 - (y / (size - 1)) * 2;
      const r2 = u * u + v * v;
      const i = (y * size + x) * 3;
      if (r2 > 1) {
        out[i] = out[i + 1] = out[i + 2] = 255;
        continue;
      }
      const nz = Math.sqrt(1 - r2);
      const nKey = Math.max(0, u * key.x + v * key.y + nz * key.z);
      const nFill = Math.max(0, u * fill.x + v * fill.y + nz * fill.z);

      // Wrapped diffuse — fabric scatters, so terminator is soft.
      const diff = Math.pow(nKey * 0.5 + 0.5, 1.6) * 0.72 + nFill * 0.16;
      // Sheen: fabric goes bright at grazing angles, the inverse of plastic.
      const sheen = Math.pow(1 - nz, 3.4) * 0.42;
      const amb = 0.30;

      const lum = Math.min(1, amb + diff + sheen);
      // Warm the rim, cool the core — that is what sells wool as wool.
      const warm = sheen * 0.9;
      out[i] = Math.round(Math.min(1, lum * 0.985 + warm * 0.05) * 255);
      out[i + 1] = Math.round(Math.min(1, lum * 0.975 + warm * 0.03) * 255);
      out[i + 2] = Math.round(Math.min(1, lum * 0.955) * 255);
    }
  }
  return encodePNG(size, size, out);
}

// -------------------------------------------------------------- woven ground

/** Plain-weave tile used where the live weave set piece is too expensive. */
function makeWeave(size = 256, warps = 16) {
  const out = new Uint8Array(size * size * 3);
  const cell = size / warps;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const fx = (x % cell) / cell;
      const fy = (y % cell) / cell;
      // Alternate which strand is on top, cell by cell — plain weave.
      const warpOnTop = (cx + cy) % 2 === 0;
      const across = warpOnTop ? fx : fy;
      // Rounded cross-section of the strand that is on top.
      const shade = Math.sin(Math.PI * across);
      const lum = 0.90 + 0.10 * Math.pow(shade, 0.8);
      const i = (y * size + x) * 3;
      const g = Math.round(Math.min(1, lum) * 255);
      out[i] = g;
      out[i + 1] = g;
      out[i + 2] = Math.round(Math.min(255, g * 0.995));
    }
  }
  return encodePNG(size, size, out);
}

// ---------------------------------------------------------------------- main

const maps = makeFibreMaps(256);
write('public/assets/textures/yarn-fibre-normal.png', maps.normal);
write('public/assets/textures/yarn-fibre-rough.png', maps.rough);
write('public/assets/textures/yarn-matcap.png', makeMatcap(256));
write('public/assets/textures/weave-static.png', makeWeave(256, 16));
