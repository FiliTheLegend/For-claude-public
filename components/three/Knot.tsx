'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { createThreadMaterial } from './threadMaterial';
import { scroll } from '@/lib/scroll';
import { observeLayout } from '@/lib/anchors';

/**
 * Set piece 4 — the knot.
 *
 * The thread arrives at the footer, ties a slow overhand knot and pulls it
 * tight. This is a genuine knot, not a decorative loop: the curve is the
 * trefoil, which is the mathematical form of an overhand knot with its ends
 * joined, so the strand really does pass through its own loop. Tightening is
 * the honest thing too — the knot's radius shrinks while its tails lengthen,
 * exactly as pulling on a real one would do.
 *
 * The lotus that the tail draws afterwards is a DOM SVG stroke, not geometry.
 * A hairline mark at 44px wants to be a crisp vector, and a Line2 at that size
 * would be neither crisper nor cheaper.
 */

const POINTS = 190;

/** How much of the strand at each end is a straight tail rather than knot. */
const TAIL = 0.22;

export function Knot({ lite }: { lite: boolean }) {
  const { viewport, size } = useThree();
  const rect = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const line = useMemo(() => {
    const geometry = new LineGeometry();
    geometry.setPositions(new Float32Array(POINTS * 3));
    const material = createThreadMaterial({ linewidth: 0.0088 });
    const l = new Line2(geometry, material);
    l.computeLineDistances();
    l.frustumCulled = false;
    l.renderOrder = 5;
    l.visible = false;
    return l;
  }, []);

  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as { dispose(): void }).dispose();
    },
    [line],
  );

  useEffect(() => {
    const m = line.material as { resolution: { set(x: number, y: number): void } };
    m.resolution.set(size.width, size.height);
  }, [line, size]);

  useEffect(() => {
    const read = () => {
      const el = document.querySelector<HTMLElement>('[data-thread="knot"]');
      if (!el) {
        rect.current = null;
        return;
      }
      const r = el.getBoundingClientRect();
      rect.current = { x: r.left + r.width / 2, y: r.top + window.scrollY + r.height / 2, w: r.width, h: r.height };
    };
    read();
    const raf = requestAnimationFrame(read);
    const stop = observeLayout(read, 200);
    return () => {
      cancelAnimationFrame(raf);
      stop();
    };
  }, []);

  const buf = useMemo(
    () => ({ px: new Float32Array(POINTS), py: new Float32Array(POINTS) }),
    [],
  );

  useFrame(() => {
    const r = rect.current;
    if (!r) return;

    const vh = size.height;
    const worldPerPx = viewport.height / vh;
    const halfW = (size.width * worldPerPx) / 2;
    const halfH = viewport.height / 2;

    const yInView = r.y - scroll.y;
    // Tie over the last stretch before the knot reaches the middle of the
    // viewport, then hold. Nothing after it — this is the end of the sentence.
    const p = Math.min(1, Math.max(0, 1 - (yInView - vh * 0.22) / (vh * 0.62)));
    const visible = yInView > -vh * 0.5 && yInView < vh * 1.6 && p > 0.001;
    line.visible = visible;
    if (!visible) return;

    const cx = (r.x / size.width - 0.5) * 2 * halfW;
    // Tie above the mark, so the tail comes down into the lotus rather than
    // through it.
    const cy = (0.5 - (yInView - r.h * 1.6) / vh) * 2 * halfH;

    // The knot forms over the first 70% and tightens over the last 30%.
    const form = Math.min(1, p / 0.7);
    const tighten = Math.max(0, (p - 0.7) / 0.3);
    const eased = 1 - Math.pow(1 - form, 3);

    // Scale: starts loose and open, pulls down to a small tied knot.
    const loose = Math.min(halfW, halfH) * 0.26;
    const scale = loose * (1 - 0.34 * tighten);
    const tailLen = (0.75 + 0.7 * tighten) * loose;

    const { px, py } = buf;
    for (let i = 0; i < POINTS; i++) {
      const s = i / (POINTS - 1);

      if (s < TAIL) {
        // Lead-in tail, coming down from the page above.
        const k = s / TAIL;
        px[i] = cx;
        py[i] = cy + tailLen * (1 - k) + scale * 1.1;
        continue;
      }
      if (s > 1 - TAIL) {
        // Lead-out tail, heading down to the lotus.
        const k = (s - (1 - TAIL)) / TAIL;
        px[i] = cx;
        py[i] = cy - scale * 1.1 - tailLen * k;
        continue;
      }

      // Trefoil: a genuine overhand knot. `form` opens it out of a straight
      // line so it visibly ties rather than appearing already tied.
      const t = ((s - TAIL) / (1 - 2 * TAIL)) * Math.PI * 2;
      const kx = Math.sin(t) + 2 * Math.sin(2 * t);
      const ky = Math.cos(t) - 2 * Math.cos(2 * t);
      px[i] = cx + kx * scale * 0.4 * eased;
      py[i] = cy + ky * scale * 0.4 * eased;
    }

    write(line, px, py);
  });

  // Lite still ties the knot: it is the last thing on the site and it is one
  // more Line2 of 190 points, which costs nothing next to the cone.
  void lite;

  return <primitive object={line} />;
}

function write(line: Line2, px: Float32Array, py: Float32Array) {
  const geo = line.geometry;
  const start = geo.getAttribute('instanceStart') as unknown as {
    data: { array: Float32Array; needsUpdate: boolean };
  };
  const dist = geo.getAttribute('instanceDistanceStart') as unknown as {
    data: { array: Float32Array; needsUpdate: boolean };
  } | null;

  const pos = start.data.array;
  const dArr = dist?.data.array;
  let d = 0;

  for (let i = 0; i < POINTS - 1; i++) {
    const o = i * 6;
    pos[o] = px[i];
    pos[o + 1] = py[i];
    pos[o + 2] = 0;
    pos[o + 3] = px[i + 1];
    pos[o + 4] = py[i + 1];
    pos[o + 5] = 0;
    if (dArr) {
      const d0 = d;
      d += Math.hypot(px[i + 1] - px[i], py[i + 1] - py[i]);
      dArr[i * 2] = d0;
      dArr[i * 2 + 1] = d;
    }
  }
  start.data.needsUpdate = true;
  if (dist) dist.data.needsUpdate = true;
}
