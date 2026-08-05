'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { createThreadMaterial } from './threadMaterial';
import { scroll } from '@/lib/scroll';
import type { Route } from '@/lib/anchors';

/**
 * The `split` anchor: the thread separates into two strands and rejoins.
 *
 * Used at the mills/buyers fork on the home page — one strand runs over each
 * card, so the choice the section is asking the visitor to make is drawn
 * rather than described.
 *
 * The two strands are geometry, not simulation. They are short, they are
 * pinned at both ends by definition, and a spring chain on them would only
 * add lag to something the eye reads as taut. Separation is driven straight
 * off section progress: at 0 both lie exactly on the main strand's line, so
 * the split emerges from the thread instead of appearing beside it.
 */

const POINTS = 64;

export function ThreadFork({ route }: { route: React.RefObject<Route> }) {
  const { viewport, size } = useThree();

  const lines = useMemo(() => {
    const make = () => {
      const geometry = new LineGeometry();
      geometry.setPositions(new Float32Array(POINTS * 3));
      // Slightly finer than the main strand: these are the halves of a strand
      // that has been split, so they should not read as heavier than it.
      const material = createThreadMaterial({ linewidth: 0.0066 });
      const l = new Line2(geometry, material);
      l.computeLineDistances();
      l.frustumCulled = false;
      l.renderOrder = 4;
      l.visible = false;
      return l;
    };
    return [make(), make()];
  }, []);

  useEffect(
    () => () => {
      for (const l of lines) {
        l.geometry.dispose();
        (l.material as { dispose(): void }).dispose();
      }
    },
    [lines],
  );

  useEffect(() => {
    for (const l of lines) {
      const m = l.material as { resolution: { set(x: number, y: number): void } };
      m.resolution.set(size.width, size.height);
    }
  }, [lines, size]);

  const buf = useMemo(
    () => ({ px: new Float32Array(POINTS), py: new Float32Array(POINTS) }),
    [],
  );

  useFrame(() => {
    const fork = route.current?.fork;
    if (!fork) {
      for (const l of lines) l.visible = false;
      return;
    }

    const vh = size.height;
    const worldPerPx = viewport.height / vh;
    const halfW = (size.width * worldPerPx) / 2;
    const halfH = viewport.height / 2;

    const topInView = fork.start - scroll.y;
    const height = fork.end - fork.start;

    const visible = topInView < vh * 1.2 && topInView + height > -vh * 0.3;
    for (const l of lines) l.visible = visible;
    if (!visible) return;

    // Separation tracks the section coming up the viewport, so the strands
    // part as the cards arrive and are fully open by the time they are read.
    const p = Math.min(
      1,
      Math.max(0, 1 - (topInView - vh * 0.18) / (vh * 0.55)),
    );
    const open = p * p * (3 - 2 * p);

    const toX = (px: number) => (px / size.width - 0.5) * 2 * halfW;
    const toY = (docY: number) => (0.5 - (docY - scroll.y) / vh) * 2 * halfH;

    const centreX = toX((fork.left + fork.right) / 2);
    const top = toY(fork.start);
    const bottom = toY(fork.end);

    for (let side = 0; side < 2; side++) {
      const bowX = toX(side === 0 ? fork.left : fork.right);
      const { px, py } = buf;

      for (let i = 0; i < POINTS; i++) {
        const t = i / (POINTS - 1);
        // Pinned at both ends, widest in the middle. sin gives the strand a
        // parted-rope shape rather than a lens.
        const bow = Math.sin(Math.PI * t);
        px[i] = centreX + (bowX - centreX) * bow * open;
        py[i] = top + (bottom - top) * t;
      }

      write(lines[side], px, py);
    }
  });

  return (
    <>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </>
  );
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
