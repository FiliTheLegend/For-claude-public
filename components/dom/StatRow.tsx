'use client';

import { useEffect, useRef, useState } from 'react';
import { Section, Shell } from './ui';
import { stats } from '@/data/company';

/**
 * Set piece 3: the thread loops once around each numeral while it odometers
 * up. The loop is the `wrap` anchor; the count is here.
 */
export function StatRow() {
  return (
    <Section className="py-[12vh]">
      <Shell>
        <hr className="rule" />
        <dl className="grid grid-cols-2 gap-y-14 py-16 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-start gap-3">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span
                  data-thread="wrap"
                  className="num inline-block text-[clamp(38px,4.6vw,64px)] leading-none tracking-[-0.03em]"
                >
                  <Odometer value={s.value} />
                  {s.suffix}
                </span>
              </dd>
              <p className="text-[15px] text-ink/70">{s.label}</p>
              <p className="num text-[11px] uppercase tracking-[0.12em] text-ink/35">
                {s.note}
              </p>
            </div>
          ))}
        </dl>
        <hr className="rule" />
      </Shell>
    </Section>
  );
}

const DURATION = 1100;

function Odometer({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setShown(value);
      return;
    }

    // Start from a plausible number rather than zero: a year counting up from
    // 0 looks like a bug. The start also has to carry the *same digit count*
    // as the end — tabular figures keep digits equal width, but not the number
    // of them, and a numeral that grows from one glyph to three drags the
    // thread's wrap anchor along with it.
    const digits = String(value).length;
    const from = value > 1900 ? value - 60 : digits > 1 ? 10 ** (digits - 1) : 0;
    setShown(from);

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();

        const t0 = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / DURATION);
          const e = 1 - Math.pow(1 - t, 3);
          setShown(Math.round(from + (value - from) * e));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return <span ref={ref}>{shown}</span>;
}
