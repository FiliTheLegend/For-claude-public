'use client';

import { useEffect, useRef, useState } from 'react';
import { eras } from '@/data/journey';
import { setConeStage } from '@/lib/coneStage';
import { setThreadOverride } from '@/lib/threadOverride';
import { prefersReducedMotion } from '@/lib/tier';

/**
 * Set piece 2 — the journey rail.
 *
 * Vertical scroll becomes horizontal travel through six eras while the section
 * is pinned, and the cone walks the timeline left to right, spinning as it
 * goes. The thread is the axis it travels along.
 *
 * Below 1024px there is no pin and no horizontal travel: the eras stack and
 * scroll normally. Pinning on a phone fights the browser's own scroll
 * handling, and there is no horizontal room for the payoff anyway.
 */

const PIN_VH_PER_ERA = 0.85;

export function JourneyRail() {
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const decide = () =>
      setEnabled(window.innerWidth >= 1024 && !prefersReducedMotion());
    decide();
    window.addEventListener('resize', decide, { passive: true });
    return () => window.removeEventListener('resize', decide);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setConeStage(null);
      setThreadOverride(null);
      return;
    }

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = pin.current;
      const tr = track.current;
      if (!el || !tr) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const travel = Math.max(1, rect.height - vh);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));

      // Horizontal travel. The track is wider than the viewport by exactly the
      // amount we scroll it, so the last era lands flush against the right
      // edge rather than halfway off it.
      const overflow = Math.max(0, tr.scrollWidth - window.innerWidth);
      tr.style.transform = `translate3d(${-overflow * progress}px,0,0)`;

      // Fade the pin in and out at the ends so the cone hands back to its
      // parked position instead of teleporting.
      const blend =
        rect.top > 0
          ? 0
          : rect.bottom < vh
            ? Math.max(0, rect.bottom / vh)
            : 1;

      if (blend <= 0.001) {
        setConeStage(null);
        setThreadOverride(null);
        return;
      }

      // The cone walks the rail: left edge to right edge, low in the frame.
      const railY = -0.34;
      const x = -0.78 + 1.56 * progress;
      setConeStage({ x, y: railY - 0.34, scale: 0.34, tilt: 0 });
      setThreadOverride({ y: railY, tailX: -1.15, blend });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      setConeStage(null);
      setThreadOverride(null);
    };
  }, [enabled]);

  if (!enabled) return <StackedEras />;

  return (
    <div
      ref={pin}
      style={{ height: `${100 + eras.length * PIN_VH_PER_ERA * 100}vh` }}
      className="relative z-[3]"
      data-thread="pass-left"
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <div className="flex h-full items-center">
          <div
            ref={track}
            className="flex will-change-transform"
            style={{ paddingInline: 'max(6vw, 64px)' }}
          >
            {eras.map((era, i) => (
              <article
                key={era.years + era.title}
                className="w-[min(46vw,520px)] shrink-0 pr-[6vw]"
                style={{
                  // Three depths of parallax, expressed as vertical offset —
                  // the further back a card is, the less it rises.
                  transform: `translateY(${era.depth * 3.2 - 3.2}rem)`,
                  opacity: era.depth === 2 ? 0.62 : era.depth === 1 ? 0.84 : 1,
                }}
              >
                <p className="num text-[13px] tracking-[0.06em] text-brass">{era.years}</p>
                <p className="num mt-2 text-[11px] uppercase tracking-[0.14em] text-ink/40">
                  {era.place}
                </p>
                <h2
                  className={`display-md mt-7 leading-[1.1] ${
                    era.depth === 0
                      ? 'text-[clamp(28px,3.2vw,44px)]'
                      : 'text-[clamp(24px,2.6vw,34px)]'
                  }`}
                >
                  {era.title}
                </h2>
                <p className="measure mt-5 text-[17px] leading-[1.65] text-ink/70">
                  {era.body}
                </p>
                <p className="num mt-8 text-[11px] uppercase tracking-[0.14em] text-ink/25">
                  {String(i + 1).padStart(2, '0')} / {String(eras.length).padStart(2, '0')}
                </p>
              </article>
            ))}
          </div>
        </div>

        <p className="num absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.16em] text-ink/30">
          Scroll
        </p>
      </div>
    </div>
  );
}

/** Vertical fallback below 1024px and under reduced motion. */
function StackedEras() {
  return (
    <div className="relative z-[3]">
      <ol className="mx-auto w-full max-w-[1320px] border-t border-[var(--hairline)] px-6 md:px-10 lg:px-16">
        {eras.map((era) => (
          <li
            key={era.years + era.title}
            className="grid gap-5 border-b border-[var(--hairline)] py-12 md:grid-cols-[180px_1fr] md:gap-12"
          >
            <div>
              <p className="num text-[13px] text-brass">{era.years}</p>
              <p className="num mt-2 text-[11px] uppercase tracking-[0.14em] text-ink/40">
                {era.place}
              </p>
            </div>
            <div>
              <h2
                data-thread="pass-left"
                className="display-md text-[clamp(24px,3vw,34px)] leading-[1.15]"
              >
                {era.title}
              </h2>
              <p className="measure mt-4 text-[17px] leading-[1.65] text-ink/70">{era.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
