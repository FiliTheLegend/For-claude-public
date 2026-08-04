'use client';

/**
 * Three render tiers. Chosen once at boot, downgraded live if frames drop.
 * Never upgraded mid-session — thrashing between tiers reads worse than
 * being stuck on the lower one.
 */
export type Tier = 'full' | 'lite' | 'static';

type Listener = (t: Tier) => void;

let current: Tier = 'static';
let decided = false;
const listeners = new Set<Listener>();

function hasWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'static';
  if (decided) return current;
  decided = true;

  if (prefersReducedMotion() || !hasWebGL2()) {
    current = 'static';
    return current;
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  if (nav.connection?.saveData) {
    current = 'static';
    return current;
  }

  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 1024;

  if (memory < 4 || cores < 4 || coarse || narrow) {
    current = 'lite';
  } else {
    current = 'full';
  }
  return current;
}

export function getTier(): Tier {
  return current;
}

/** Downgrade only. Returns true if the tier actually changed. */
export function downgrade(to: Tier): boolean {
  const rank: Record<Tier, number> = { static: 0, lite: 1, full: 2 };
  if (rank[to] >= rank[current]) return false;
  current = to;
  listeners.forEach((l) => l(current));
  return true;
}

export function onTierChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Rolling frame-time watchdog. Feed it dt from `useFrame`; if the average
 * frame time over a 2s window exceeds the tier's budget, drop a tier.
 */
export function createFrameWatchdog() {
  let acc = 0;
  let frames = 0;
  let window_ = 0;
  let strikes = 0;

  return function sample(dt: number) {
    // Ignore tab-restore spikes.
    if (dt > 0.5) return;
    acc += dt;
    frames += 1;
    window_ += dt;
    if (window_ < 2) return;

    const avg = acc / Math.max(1, frames);
    acc = 0;
    frames = 0;
    window_ = 0;

    const budget = current === 'full' ? 1 / 42 : 1 / 24;
    if (avg > budget) {
      strikes += 1;
      // Two consecutive bad windows before acting, so one hitch is forgiven.
      if (strikes >= 2) {
        strikes = 0;
        downgrade(current === 'full' ? 'lite' : 'static');
      }
    } else {
      strikes = 0;
    }
  };
}
