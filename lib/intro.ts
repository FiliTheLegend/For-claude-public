'use client';

import { prefersReducedMotion } from './tier';

/**
 * First-load intro. Hard cap 2.2s, skippable on any input, once per session.
 *
 * There is no loading screen and no separate intro scene — this animates the
 * real hero, which is already live behind it. If the cone's textures have not
 * arrived within 1.5s the intro is abandoned and the hero simply appears:
 * holding someone on 4G in front of a white rectangle to protect a flourish is
 * the wrong trade every time.
 */
const CAP_MS = 2200;
const ASSET_DEADLINE_MS = 1500;
const KEY = 'lotus:intro-played';

export const intro = {
  /** 0..1 through the intro. 1 means finished (or skipped). */
  t: 1,
  active: false,
};

let raf = 0;
let started = 0;

function finish() {
  intro.t = 1;
  intro.active = false;
  cancelAnimationFrame(raf);
  document.documentElement.dataset.intro = 'done';
  window.removeEventListener('pointerdown', finish);
  window.removeEventListener('wheel', finish);
  window.removeEventListener('keydown', finish);
  window.removeEventListener('touchstart', finish);
}

/** Called by the scene once the cone's textures are decoded and it can draw. */
export function markAssetsReady() {
  if (!intro.active) return;
  if (performance.now() - started > ASSET_DEADLINE_MS) finish();
}

export function startIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (prefersReducedMotion()) return false;
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, '1');
  } catch {
    // Private mode with storage disabled: play it, it is 2.2 seconds.
  }

  intro.active = true;
  intro.t = 0;
  started = performance.now();
  document.documentElement.dataset.intro = 'running';

  const tick = () => {
    const elapsed = performance.now() - started;
    intro.t = Math.min(1, elapsed / CAP_MS);
    if (intro.t >= 1) {
      finish();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  for (const ev of ['pointerdown', 'wheel', 'keydown', 'touchstart'] as const) {
    window.addEventListener(ev, finish, { once: true, passive: true });
  }

  return true;
}

/**
 * Vertical offset and squash for the cone at the current intro time.
 * Descends from above and settles with one small bounce.
 */
export function introConeOffset(): { drop: number; squash: number } {
  if (!intro.active) return { drop: 0, squash: 1 };
  const t = intro.t;
  // Fall over the first 62%, then a single decaying bounce.
  if (t < 0.62) {
    const k = t / 0.62;
    const fall = 1 - Math.pow(1 - k, 2.2);
    return { drop: (1 - fall) * 1.35, squash: 1 };
  }
  const b = (t - 0.62) / 0.38;
  const bounce = Math.sin(b * Math.PI * 1.5) * Math.exp(-b * 4.5);
  return { drop: Math.max(0, bounce) * 0.11, squash: 1 - bounce * 0.05 };
}
