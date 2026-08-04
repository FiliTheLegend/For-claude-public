'use client';

/**
 * The DOM-to-3D anchor system.
 *
 * Elements opt in with `data-thread="<kind>"`. On mount and on resize we read
 * every anchor's rect once and store it in *document* coordinates — never
 * viewport coordinates. That distinction is the whole design: document
 * positions are stable under scroll, so the render loop can convert them to
 * screen space with a subtraction instead of calling getBoundingClientRect on
 * twenty elements at 60fps.
 */

export type AnchorKind =
  | 'payoff'
  | 'pass-left'
  | 'pass-right'
  | 'underline'
  | 'wrap'
  | 'split'
  | 'knot';

const KINDS: AnchorKind[] = [
  'payoff',
  'pass-left',
  'pass-right',
  'underline',
  'wrap',
  'split',
  'knot',
];

export type Anchor = {
  kind: AnchorKind;
  /** Document-space box. x/left are viewport-relative-x (page has no h-scroll). */
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** A route waypoint: x in viewport px, y in document px. */
export type Waypoint = {
  x: number;
  y: number;
  /**
   * Length of the *waypoint* span this point was smoothed out of, and how far
   * along it the point sits. Carried through smoothing because sag has to bow
   * across the distance between anchors, not across the sub-millimetre gaps
   * between subdivided samples.
   */
  span?: number;
  t?: number;
  /**
   * Node density multiplier. The thread only gets 120 nodes, and spreading
   * them evenly by arc length spends almost all of them on long straight runs
   * — which leaves a wrap loop with seven nodes and renders it as a heptagon.
   * Curvy runs ask for more.
   */
  w?: number;
};

export type Route = {
  points: Waypoint[];
  /** Cumulative *weighted* arc length. Sampling happens in this space. */
  lengths: number[];
  total: number;
  /** Document y of the split fork, if the page has one. */
  fork: { start: number; end: number; left: number; right: number } | null;
};

const EMPTY_ROUTE: Route = { points: [], lengths: [0], total: 0, fork: null };

export function readAnchors(root: ParentNode = document): Anchor[] {
  const scrollY = window.scrollY;
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-thread]'));
  const out: Anchor[] = [];

  for (const el of els) {
    const kind = el.dataset.thread as AnchorKind;
    if (!KINDS.includes(kind)) continue;
    const r = el.getBoundingClientRect();
    // Skip anything display:none — a zero box would drag the thread to 0,0.
    if (r.width === 0 && r.height === 0) continue;
    out.push({
      kind,
      left: r.left,
      right: r.right,
      top: r.top + scrollY,
      bottom: r.bottom + scrollY,
    });
  }

  out.sort((a, b) => a.top - b.top);
  return out;
}

/** Horizontal clearance between the thread and the element it routes past. */
const GAP = 34;

/**
 * Turns the anchor list into a single continuous polyline down the document.
 *
 * Every anchor kind is just a different little run of waypoints; the spring
 * chain downstream does not know or care which kind produced them, which is
 * what keeps this extensible without touching the simulation.
 */
export function buildRoute(anchors: Anchor[], vw: number, docHeight: number): Route {
  if (!anchors.length) return EMPTY_ROUTE;

  /**
   * Below this width there is no margin to route through: the text column is
   * the viewport. So the thread stops trying to travel around content and
   * becomes what it can honestly be at 390px — a spine down the left edge,
   * with the stat loops kept because they are small enough to survive.
   */
  const compact = vw < 760;
  const rail = compact ? 22 : 0;

  const pts: Waypoint[] = [];
  const push = (x: number, y: number, w = 1) => {
    const cx = Math.min(vw - 12, Math.max(12, x));
    const last = pts[pts.length - 1];
    // Collapse near-duplicates; they add arc-length noise and nothing else.
    if (last && Math.abs(last.x - cx) < 0.5 && Math.abs(last.y - y) < 0.5) return;
    pts.push({ x: cx, y, w });
  };

  let fork: Route['fork'] = null;

  for (const a of anchors) {
    const cx = (a.left + a.right) / 2;

    switch (a.kind) {
      case 'payoff':
        push(cx, a.top);
        break;

      case 'pass-left':
        push(compact ? rail : a.left - GAP, a.top);
        push(compact ? rail : a.left - GAP, a.bottom);
        break;

      case 'pass-right':
        push(compact ? rail : a.right + GAP, a.top);
        push(compact ? rail : a.right + GAP, a.bottom);
        break;

      case 'underline': {
        // Lead in down the left margin first. Without it the descent from the
        // previous anchor is a straight line to the baseline, and that line
        // runs diagonally through the heading it is supposed to underline.
        const y = a.bottom + 9;
        if (compact) {
          // No room to draw a rule under a heading that already fills the
          // column — just hold the rail past it.
          push(rail, a.top);
          push(rail, a.bottom);
          break;
        }
        push(a.left - GAP, a.top + 12);
        push(a.left - 26, y - 18, 3.5);
        push(a.left - 2, y, 4);
        push(a.right + 2, y, 1.6);
        push(a.right + 26, y + 18, 3.5);
        break;
      }

      case 'wrap': {
        // A real loop, not a rounded rectangle. Tracing the element's box —
        // even with the corners smoothed — reads as a border; yarn thrown
        // around a numeral makes an oval. It also runs slightly past a full
        // turn so the strand crosses itself on the way out, which is what
        // actually happens when you loop a thread around something.
        const cy = (a.top + a.bottom) / 2;
        const rx = (a.right - a.left) / 2 + 18;
        const ry = (a.bottom - a.top) / 2 + 15;
        const W = 6;
        const STEPS = 18;

        // Enter at the top, go round one and a quarter turns, leave from the
        // right. Overshooting to the *right* rather than back over the top is
        // what keeps the exit strand hugging the edge of the loop instead of
        // cutting a chord straight through the middle of it.
        push(cx, a.top - 30);
        for (let k = 0; k <= STEPS; k++) {
          const ang = -Math.PI / 2 + (k / STEPS) * Math.PI * 2.5;
          push(cx + Math.cos(ang) * rx, cy + Math.sin(ang) * ry, W);
        }
        push(cx + rx * 0.5, a.bottom + 18, 2);
        push(cx, a.bottom + 34);
        break;
      }

      case 'split':
        // The main strand runs the centre; the fork is drawn as a second
        // geometry so both halves can carry the same material.
        fork = compact
          ? null
          : { start: a.top, end: a.bottom, left: a.left + 40, right: a.right - 40 };
        push(compact ? rail : cx, a.top - 10);
        push(compact ? rail : cx, a.bottom + 10);
        break;

      case 'knot':
        push(cx, a.top);
        break;
    }
  }

  // Run the thread off the bottom of the document so it never visibly ends.
  const last = pts[pts.length - 1];
  if (last && last.y < docHeight) push(last.x, docHeight + 200);

  const smooth = smoothPolyline(pts);

  const lengths: number[] = [0];
  for (let i = 1; i < smooth.length; i++) {
    const geometric = Math.hypot(
      smooth[i].x - smooth[i - 1].x,
      smooth[i].y - smooth[i - 1].y,
    );
    lengths.push(lengths[i - 1] + geometric * (smooth[i - 1].w ?? 1));
  }

  return { points: smooth, lengths, total: lengths[lengths.length - 1] || 0, fork };
}

/**
 * Rounds the waypoint polyline off with a centripetal Catmull-Rom pass.
 *
 * Without this the thread is a technical drawing: it hits every anchor at a
 * hard corner, and no amount of spring lag hides that, because the springs
 * converge onto the corner rather than cutting it. Centripetal (alpha = 0.5)
 * rather than uniform parameterisation matters specifically at the `wrap`
 * loops, where uniform weighting cusps and self-intersects.
 */
function smoothPolyline(pts: Waypoint[], perSpan = 9): Waypoint[] {
  if (pts.length < 3) return pts;

  const out: Waypoint[] = [];
  const at = (i: number) => pts[Math.min(pts.length - 1, Math.max(0, i))];

  const tj = (t: number, a: Waypoint, b: Waypoint) =>
    t + Math.pow(Math.hypot(b.x - a.x, b.y - a.y), 0.5);

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);

    const t0 = 0;
    const t1 = tj(t0, p0, p1);
    const t2 = tj(t1, p1, p2);
    const t3 = tj(t2, p2, p3);

    // Coincident control points would divide by zero; fall back to the raw
    // segment, which is what a zero-length span should look like anyway.
    if (t1 === t0 || t2 === t1 || t3 === t2) {
      out.push({ ...p1, span: 0, t: 0, w: p1.w ?? 1 });
      continue;
    }

    const spanLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    for (let s = 0; s < perSpan; s++) {
      const t = t1 + ((t2 - t1) * s) / perSpan;
      const a1x = ((t1 - t) / (t1 - t0)) * p0.x + ((t - t0) / (t1 - t0)) * p1.x;
      const a1y = ((t1 - t) / (t1 - t0)) * p0.y + ((t - t0) / (t1 - t0)) * p1.y;
      const a2x = ((t2 - t) / (t2 - t1)) * p1.x + ((t - t1) / (t2 - t1)) * p2.x;
      const a2y = ((t2 - t) / (t2 - t1)) * p1.y + ((t - t1) / (t2 - t1)) * p2.y;
      const a3x = ((t3 - t) / (t3 - t2)) * p2.x + ((t - t2) / (t3 - t2)) * p3.x;
      const a3y = ((t3 - t) / (t3 - t2)) * p2.y + ((t - t2) / (t3 - t2)) * p3.y;

      const b1x = ((t2 - t) / (t2 - t0)) * a1x + ((t - t0) / (t2 - t0)) * a2x;
      const b1y = ((t2 - t) / (t2 - t0)) * a1y + ((t - t0) / (t2 - t0)) * a2y;
      const b2x = ((t3 - t) / (t3 - t1)) * a2x + ((t - t1) / (t3 - t1)) * a3x;
      const b2y = ((t3 - t) / (t3 - t1)) * a2y + ((t - t1) / (t3 - t1)) * a3y;

      out.push({
        x: ((t2 - t) / (t2 - t1)) * b1x + ((t - t1) / (t2 - t1)) * b2x,
        y: ((t2 - t) / (t2 - t1)) * b1y + ((t - t1) / (t2 - t1)) * b2y,
        span: spanLen,
        t: s / perSpan,
        w: p1.w ?? 1,
      });
    }
  }

  out.push({ ...pts[pts.length - 1], span: 0, t: 1, w: pts[pts.length - 1].w ?? 1 });
  return out;
}

/**
 * Sample the route at a given arc length, and report how far through its
 * current straight segment the sample fell — the sag term needs that so the
 * bow is deepest mid-span and zero at the waypoints.
 */
export function sampleRoute(
  route: Route,
  s: number,
  out: { x: number; y: number; t: number; span: number },
) {
  const { points, lengths } = route;
  if (points.length === 0) {
    out.x = 0;
    out.y = 0;
    out.t = 0;
    out.span = 0;
    return out;
  }
  if (points.length === 1 || s <= 0) {
    out.x = points[0].x;
    out.y = points[0].y;
    out.t = points[0].t ?? 0;
    out.span = points[0].span ?? 0;
    return out;
  }

  const clamped = Math.min(s, route.total);

  // Binary search the cumulative-length table.
  let lo = 0;
  let hi = lengths.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (lengths[mid] <= clamped) lo = mid;
    else hi = mid;
  }

  const a = points[lo];
  const b = points[hi];
  const segment = lengths[hi] - lengths[lo];
  const k = segment > 1e-6 ? (clamped - lengths[lo]) / segment : 0;

  out.x = a.x + (b.x - a.x) * k;
  out.y = a.y + (b.y - a.y) * k;
  out.t = a.t ?? 0;
  out.span = a.span ?? 0;
  return out;
}

/** Weighted arc length at which the route crosses a document y, searching down. */
export function arcAtDocY(route: Route, y: number): number {
  const { points, lengths } = route;
  if (points.length < 2) return 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].y >= y) {
      const a = points[i - 1];
      const b = points[i];
      const k = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
      return lengths[i - 1] + (lengths[i] - lengths[i - 1]) * Math.min(1, Math.max(0, k));
    }
  }
  return route.total;
}

/** Debounced observer over layout changes that invalidate the anchor cache. */
export function observeLayout(cb: () => void, delay = 200) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const fire = () => {
    clearTimeout(t);
    t = setTimeout(cb, delay);
  };
  window.addEventListener('resize', fire, { passive: true });
  window.addEventListener('orientationchange', fire, { passive: true });

  const ro = new ResizeObserver(fire);
  ro.observe(document.documentElement);
  // Watch each anchor too: a numeral odometering from "0" to "50+" changes
  // its own box without changing the page's, so nothing else would fire.
  document.querySelectorAll('[data-thread]').forEach((el) => ro.observe(el));

  // Fonts land after first paint and move every heading on the page.
  if ('fonts' in document) {
    (document as Document & { fonts: FontFaceSet }).fonts.ready.then(cb).catch(() => {});
  }

  return () => {
    clearTimeout(t);
    window.removeEventListener('resize', fire);
    window.removeEventListener('orientationchange', fire);
    ro.disconnect();
  };
}
