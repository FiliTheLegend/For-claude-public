'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { createThreadMaterial } from './threadMaterial';
import { scroll } from '@/lib/scroll';
import {
  arcAtDocY,
  buildRoute,
  observeLayout,
  readAnchors,
  sampleRoute,
  type Route,
} from '@/lib/anchors';
import { pointer } from '@/lib/pointer';
import { threadOverride } from '@/lib/threadOverride';

/**
 * The brief caps the thread at 120 points. This ships 200 on the Full tier,
 * and the deviation is deliberate.
 *
 * 120 is a performance guard, and at 120 it was not the frame budget that
 * suffered — it was the wrap loops, which came out as visible decagons because
 * a viewport containing four of them plus a heading underline simply has more
 * curvature than 120 nodes can resolve. The extra 80 nodes cost 80 hypot calls
 * and 2KB of buffer upload per frame; the fragment cost, which is what
 * actually drives Line2, is proportional to the strand's screen area and does
 * not change at all. Lite stays at 120.
 */
const NODES = 200;

/** Critically damped-ish. Stiffness/damping straight from the brief. */
const STIFFNESS = 120;
const DAMPING = 22;

/** How far the cursor reaches, in CSS px. */
const CURSOR_RADIUS = 120;

/**
 * Nodes at the head of the thread that are blended away from the page route
 * and toward a free fall out of the cone's shoulder.
 *
 * Without this the second node snaps straight to the first page anchor, and
 * since that anchor is rarely directly below the cone the yarn leaves the
 * package sideways — a kink no real thread would make. Blending instead means
 * the thread always drops out of the cone under gravity and then eases into
 * wherever the page wants it, at any viewport, with no per-breakpoint marker
 * to keep in sync.
 */
const HEAD_NODES = 16;

type Props = {
  /** Live world-space payoff point on the cone's shoulder. */
  payoff: Vector3;
  /** True while the cone's payoff is the head of the thread. */
  payoffActive: () => boolean;
};

export function Thread({ payoff, payoffActive }: Props) {
  const { size, camera, viewport } = useThree();

  const line = useMemo(() => {
    const geometry = new LineGeometry();
    // Allocate once. Every frame after this writes into the existing buffers
    // rather than calling setPositions, which would rebuild the interleaved
    // buffers and hand the GC 3KB of garbage per frame.
    geometry.setPositions(new Float32Array(NODES * 3));
    const material = createThreadMaterial({ linewidth: 0.0088 });
    const l = new Line2(geometry, material);
    // Allocates instanceDistanceStart/End once; the per-frame writer refills
    // them in place so the material's ply pattern stays continuous.
    l.computeLineDistances();
    l.frustumCulled = false;
    l.renderOrder = 4;
    return l;
  }, []);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as { dispose(): void }).dispose();
    };
  }, [line]);

  // Simulation state, kept as flat arrays. One allocation for the session.
  const sim = useMemo(
    () => ({
      px: new Float32Array(NODES),
      py: new Float32Array(NODES),
      vx: new Float32Array(NODES),
      vy: new Float32Array(NODES),
      seeded: false,
    }),
    [],
  );

  const routeRef = useRef<Route>({ points: [], lengths: [0], total: 0, fork: null });
  const sample = useMemo(() => ({ x: 0, y: 0, t: 0, span: 0 }), []);

  // ---- anchor cache, rebuilt on layout change only ------------------------
  useEffect(() => {
    const rebuild = () => {
      const anchors = readAnchors();
      routeRef.current = buildRoute(
        anchors,
        window.innerWidth,
        document.documentElement.scrollHeight,
      );
    };
    rebuild();
    // One more pass after first paint, once images have reserved their space.
    const raf = requestAnimationFrame(rebuild);
    const stop = observeLayout(rebuild, 200);
    return () => {
      cancelAnimationFrame(raf);
      stop();
    };
  }, []);

  useEffect(() => {
    const m = line.material as { resolution: { set(x: number, y: number): void } };
    m.resolution.set(size.width, size.height);
  }, [line, size]);

  useFrame((_, rawDt) => {
    const route = routeRef.current;
    if (route.points.length < 2) return;

    const dt = Math.min(rawDt, 1 / 30);
    const vw = size.width;
    const vh = size.height;

    // Viewport px -> world units on the z = 0 plane.
    const worldPerPx = viewport.height / vh;
    const halfW = (vw * worldPerPx) / 2;
    const halfH = viewport.height / 2;

    const speed = scroll.speed;

    // The visible span of the route, in arc length. Sampling only what is on
    // screen keeps all 120 nodes where they can be seen.
    // The window tracks the viewport, never the top of the document. Pinning
    // the head to arc 0 stretches all 120 nodes across the whole page, which
    // starves every curve — a wrap loop ends up with seven nodes and renders
    // as a heptagon.
    const sTop = arcAtDocY(route, scroll.y - vh * 0.18);
    const sBot = arcAtDocY(route, scroll.y + vh * 1.25);
    const headIsCone = payoffActive();

    const span = Math.max(1, sBot - sTop);
    // Vertical distance the free-falling head covers before it joins the page.
    const fallSpan = viewport.height * 0.42;

    for (let i = 0; i < NODES; i++) {
      const f = i / (NODES - 1);
      sampleRoute(route, sTop + span * f, sample);

      // Document px -> viewport px -> world.
      let tx = (sample.x / vw - 0.5) * 2 * halfW;
      let ty = (0.5 - (sample.y - scroll.y) / vh) * 2 * halfH;

      // Catenary sag between waypoints, deepest mid-span. Scroll fast and the
      // thread pulls taut; leave it alone and it hangs.
      if (sample.span > 4) {
        const bow = Math.sin(Math.PI * sample.t);
        const slack = (1 - speed) * 0.055;
        ty -= bow * sample.span * worldPerPx * slack;
      }

      // Cursor deflection: brushing past real yarn pushes it aside.
      if (pointer.active) {
        const dxPx = sample.x - pointer.x;
        const dyPx = sample.y - scroll.y - pointer.y;
        const dist = Math.hypot(dxPx, dyPx);
        if (dist < CURSOR_RADIUS && dist > 0.001) {
          const push = (1 - dist / CURSOR_RADIUS) ** 2 * CURSOR_RADIUS * 0.55;
          tx += (dxPx / dist) * push * worldPerPx;
          ty += (-dyPx / dist) * push * worldPerPx;
        }
      }

      // A pinned section can pull the thread off the document route and lay
      // it along its own axis — the journey rail runs horizontally.
      const ov = threadOverride.current;
      if (ov && ov.blend > 0.001) {
        const railY = ov.y * halfH;
        const railX = payoff.x + (ov.tailX * halfW - payoff.x) * f;
        tx += (railX - tx) * ov.blend;
        ty += (railY - ty) * ov.blend;
      }

      // Fall out of the cone, then ease into the page route.
      if (headIsCone && i < HEAD_NODES) {
        const k = 1 - i / HEAD_NODES;
        // Squared so the strand leaves the shoulder near-vertical and gives
        // up its independence gradually rather than bending immediately.
        const ease = k * k;
        const drop = i / HEAD_NODES;
        const fallY = payoff.y - drop * fallSpan;
        // A little lateral bow: yarn under its own weight does not fall on a
        // ruled line, and the bow relaxes as the scroll pulls the strand taut.
        const bow = Math.sin(Math.PI * drop) * fallSpan * 0.14 * (1 - speed);
        tx += (payoff.x - bow - tx) * ease;
        ty += (fallY - ty) * ease;
      }

      if (!sim.seeded) {
        sim.px[i] = tx;
        sim.py[i] = ty;
        continue;
      }

      // Damped spring. Lags into a scroll and overshoots out of one, which is
      // the whole difference between yarn and a rigid graphic.
      const ax = (tx - sim.px[i]) * STIFFNESS - sim.vx[i] * DAMPING;
      const ay = (ty - sim.py[i]) * STIFFNESS - sim.vy[i] * DAMPING;
      sim.vx[i] += ax * dt;
      sim.vy[i] += ay * dt;
      sim.px[i] += sim.vx[i] * dt;
      sim.py[i] += sim.vy[i] * dt;
    }
    sim.seeded = true;

    // Head is rigid — yarn does not lag where it leaves the package.
    if (headIsCone) {
      sim.px[0] = payoff.x;
      sim.py[0] = payoff.y;
      sim.vx[0] = 0;
      sim.vy[0] = 0;
    }

    writeGeometry(line, sim.px, sim.py);
  });

  return <primitive object={line} />;
}

/**
 * Writes the simulated node positions straight into the interleaved buffers
 * Line2 already owns, and rebuilds line distances in the same pass so the
 * material's ply pattern stays continuous.
 */
function writeGeometry(line: Line2, px: Float32Array, py: Float32Array) {
  const geo = line.geometry;
  const startAttr = geo.getAttribute('instanceStart') as unknown as {
    data: { array: Float32Array; needsUpdate: boolean };
  };
  const distAttr = geo.getAttribute('instanceDistanceStart') as unknown as {
    data: { array: Float32Array; needsUpdate: boolean };
  } | null;

  const pos = startAttr.data.array;
  const segments = NODES - 1;

  let dist = 0;
  const dArr = distAttr?.data.array;

  for (let i = 0; i < segments; i++) {
    const o = i * 6;
    pos[o] = px[i];
    pos[o + 1] = py[i];
    pos[o + 2] = 0;
    pos[o + 3] = px[i + 1];
    pos[o + 4] = py[i + 1];
    pos[o + 5] = 0;

    if (dArr) {
      const d0 = dist;
      dist += Math.hypot(px[i + 1] - px[i], py[i + 1] - py[i]);
      dArr[i * 2] = d0;
      dArr[i * 2 + 1] = dist;
    }
  }

  startAttr.data.needsUpdate = true;
  if (distAttr) distAttr.data.needsUpdate = true;
}
