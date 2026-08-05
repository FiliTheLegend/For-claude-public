import { Section, Shell, Unconfirmed } from './ui';
import { principals } from '@/data/principals';

/**
 * Set piece 1: the weave. The main thread splits into warps behind this grid
 * and the wefts interlace across it as the section scrolls. The DOM here is
 * just the client names — the cloth is built in the canvas underneath, which
 * is why this section is transparent rather than opaque.
 */
export function PrincipalWall() {
  return (
    <Section id="principals" className="py-[16vh]">
      <Shell>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2
            data-thread="underline"
            className="display-lg max-w-[18ch] text-[clamp(32px,4.2vw,58px)] leading-[1.05]"
          >
            Mills we have represented
          </h2>
          <p className="measure text-[15px] leading-[1.6] text-ink/65 md:max-w-[34ch]">
            Some of these mandates ran for over a decade. Dates are being
            confirmed with the mills before they are published.
          </p>
        </div>

        <div
          id="principal-weave"
          data-weave
          className="mt-16 grid grid-cols-2 gap-px bg-[var(--hairline)] md:grid-cols-4"
        >
          {principals.map((p) => (
            <div
              key={p.slug}
              className="flex min-h-[168px] flex-col justify-between bg-paper/80 p-7"
            >
              <p className="text-[17px] leading-[1.35]">{p.name}</p>
              <div className="mt-6">
                {p.note && (
                  <p className="num text-[11px] uppercase tracking-[0.12em] text-ink/65">
                    {p.note}
                  </p>
                )}
                {p.span && p.spanConfirmed ? (
                  <p className="num mt-1 text-[13px] text-brass-deep">{p.span}</p>
                ) : (
                  <p className="mt-1">
                    <Unconfirmed>dates to confirm</Unconfirmed>
                  </p>
                )}
              </div>
            </div>
          ))}
          {/* Keeps the 4-column grid square at seven items. */}
          <div className="hidden bg-paper/80 md:block" aria-hidden="true" />
        </div>
      </Shell>
    </Section>
  );
}
