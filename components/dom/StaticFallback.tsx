'use client';

import { useEffect, useState } from 'react';
import { detectTier, getTier, onTierChange } from '@/lib/tier';

/**
 * What the Static tier gets instead of a canvas: one high-quality still of the
 * cone, and a hairline rule where the thread would run.
 *
 * This is what the server renders, so it is also exactly what a visitor with
 * JavaScript disabled sees — the page is complete without a single byte of
 * three.js. It is removed only once a canvas tier has actually been confirmed.
 *
 * The still is a screenshot of the real scene (scripts/gen-still.mjs), not a
 * hand-drawn stand-in, so it cannot drift away from the live cone.
 */
export function StaticFallback() {
  const [mode, setMode] = useState<'unknown' | 'canvas' | 'static'>('unknown');

  useEffect(() => {
    // detectTier is idempotent and cached, so calling it here rather than
    // reading getTier() removes the race with whichever of this component and
    // the canvas mounts first.
    detectTier();
    const sync = () => setMode(getTier() === 'static' ? 'static' : 'canvas');
    sync();
    return onTierChange(sync);
  }, []);

  if (mode === 'canvas') return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1]">
      {/* Where the thread would run. */}
      <span className="absolute inset-y-0 left-[7%] w-px bg-[var(--hairline)] md:left-[62%]" />

      <picture>
        <source srcSet="/assets/photos/cone-still.webp" type="image/webp" />
        <img
          src="/assets/photos/cone-still.png"
          alt=""
          width={1440}
          height={1800}
          decoding="async"
          className="absolute right-[4vw] top-[20vh] h-auto w-[42vw] max-w-[360px] md:right-[9vw] md:top-[16vh]"
        />
      </picture>
    </div>
  );
}
