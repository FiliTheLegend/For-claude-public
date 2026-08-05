import type { Metadata } from 'next';
import { Section, Shell, WhatsAppCta } from '@/components/dom/ui';
import { generations, company } from '@/data/company';

export const metadata: Metadata = {
  title: 'About us',
  description:
    'Three generations of yarn marketing agents — Shri Kailash Prasad Agarwal in Secunderabad from 1974, Alokkumar Agarwal from 1989, and Ashutosh Agarwal today in Coimbatore.',
  alternates: { canonical: '/about-us/' },
};

export default function AboutUs() {
  return (
    <>
      <Section className="pt-[22vh] pb-[10vh] md:pt-[26vh]">
        <Shell>
          <p className="eyebrow mb-8">Since {company.founded}</p>
          <h1 className="display-xl max-w-[14ch] text-[clamp(42px,6.4vw,92px)] leading-[0.97]">
            Three generations, one trade.
          </h1>
          <p className="measure mt-10 text-[17px] leading-[1.65] text-ink/70">
            The business has moved twice in fifty years and changed hands twice.
            The work has not changed at all: represent the mill, find the buyer,
            stand behind the money.
          </p>
        </Shell>
      </Section>

      <Section className="pb-[16vh]">
        <Shell>
          <ol className="border-t border-[var(--hairline)]">
            {generations.map((g) => (
              <li
                key={g.name}
                className="grid gap-6 border-b border-[var(--hairline)] py-14 md:grid-cols-[200px_1fr] md:gap-14"
              >
                <div>
                  <p className="num text-[13px] text-brass-deep">{g.span}</p>
                  <p className="num mt-2 text-[12px] uppercase tracking-[0.1em] text-ink/65">
                    {g.base}
                  </p>
                </div>
                <div>
                  <h2
                    data-thread="pass-left"
                    className="display-md text-[clamp(24px,2.8vw,36px)] leading-[1.15]"
                  >
                    {g.name}
                    {g.alias && (
                      <span className="text-ink/65"> (alias {g.alias})</span>
                    )}
                  </h2>
                  <p className="num mt-3 text-[12px] uppercase tracking-[0.1em] text-ink/65">
                    {g.origin}
                  </p>
                  <p className="measure mt-6 text-[17px] leading-[1.65] text-ink/75">
                    {g.note}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Shell>
      </Section>

      <Section className="pb-[18vh]">
        <Shell>
          <div className="max-w-[52ch]">
            <h2 className="display-lg text-[clamp(28px,3.6vw,48px)] leading-[1.08]">
              Talk to the third generation.
            </h2>
            <div className="mt-10">
              <WhatsAppCta message="Hello Lotus Syndicate — I read your About page and would like to get in touch.">
                Start a conversation
              </WhatsAppCta>
            </div>
          </div>
        </Shell>
      </Section>
    </>
  );
}
