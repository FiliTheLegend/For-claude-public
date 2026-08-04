/**
 * Plain module singleton holding scroll state.
 *
 * Nothing in the render loop is allowed to touch `window.scrollY` — Lenis
 * writes here once per rAF and `useFrame` reads these fields. Keeping it a
 * mutable object (not React state) means zero re-renders per scroll tick.
 */
export type ScrollState = {
  /** Smoothed scroll offset in px. */
  y: number;
  /** px per second, signed. Positive = scrolling down. */
  velocity: number;
  /** 0..1 across the whole document. */
  progress: number;
  /** Total scrollable height in px. */
  limit: number;
  /** Viewport height in px, mirrored here so the loop never reads layout. */
  vh: number;
  /** Normalised, smoothed |velocity| in 0..1. Drives cone RPM and thread tautness. */
  speed: number;
};

export const scroll: ScrollState = {
  y: 0,
  velocity: 0,
  progress: 0,
  limit: 1,
  vh: 1,
  speed: 0,
};

/** Velocity above which the thread is considered fully taut. */
const SPEED_REF = 2200;

export function writeScroll(y: number, velocity: number, limit: number) {
  scroll.y = y;
  scroll.velocity = velocity;
  scroll.limit = Math.max(1, limit);
  scroll.progress = Math.min(1, Math.max(0, y / scroll.limit));
}

/** Called once per frame from the R3F loop to decay `speed` smoothly. */
export function decaySpeed(dt: number) {
  const target = Math.min(1, Math.abs(scroll.velocity) / SPEED_REF);
  // Rise fast, fall slow — a whip should snap taut and relax gently.
  const k = target > scroll.speed ? 12 : 2.6;
  scroll.speed += (target - scroll.speed) * (1 - Math.exp(-k * dt));
}

export function setViewportHeight(vh: number) {
  scroll.vh = vh;
}
