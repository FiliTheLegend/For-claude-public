/**
 * Renders the Static-tier cone still from the real scene.
 *
 * The Static tier ships no canvas at all, so it needs a picture of the cone.
 * That picture is a screenshot of the actual lab rig rather than something
 * drawn by hand, which means it cannot drift away from what everyone else
 * sees when the geometry or the lighting changes — re-run this after either.
 *
 * Requires `npm run dev` to be up.
 *
 *   node scripts/gen-still.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'public/assets/photos';
const W = 720;
const H = 900;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
  ],
});

const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
});

await page.goto(`http://localhost:3000/lab/cone/?ui=0&rot=0&d=0&z=2.9`, {
  waitUntil: 'networkidle',
  timeout: 60000,
});
await page.waitForTimeout(6000);

mkdirSync(OUT, { recursive: true });
const png = await page.screenshot({ type: 'png' });
writeFileSync(`${OUT}/cone-still.png`, png);
console.log(`cone-still.png  ${(png.length / 1024).toFixed(1)} KB`);

// Re-encode through the browser's own encoders. Chromium ships WebP; AVIF
// encoding is not exposed to canvas, so that one is left to the asset drop.
const b64 = png.toString('base64');
const webp = await page.evaluate(async (data) => {
  const img = new Image();
  img.src = `data:image/png;base64,${data}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0);
  return c.toDataURL('image/webp', 0.86).split(',')[1];
}, b64);

const webpBuf = Buffer.from(webp, 'base64');
writeFileSync(`${OUT}/cone-still.webp`, webpBuf);
console.log(`cone-still.webp ${(webpBuf.length / 1024).toFixed(1)} KB`);

// ---- Open Graph card, rendered from the real hero ------------------------
const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await og.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
await og.waitForTimeout(6000);
mkdirSync('public/assets/og', { recursive: true });
const ogPng = await og.screenshot({ type: 'png' });
writeFileSync('public/assets/og/default.png', ogPng);
console.log(`og/default.png  ${(ogPng.length / 1024).toFixed(1)} KB`);

await browser.close();
