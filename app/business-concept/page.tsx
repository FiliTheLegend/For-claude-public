import type { Metadata } from 'next';
import { Section, Shell, WhatsAppCta, Unconfirmed } from '@/components/dom/ui';
import { mandateTerms, territories, whyMillsStay } from '@/data/company';
import { currentMandates } from '@/data/principals';

export const metadata: Metadata = {
  title: 'Business concept',
  description:
    'How a Lotus Syndicate mandate works: commission 0.5%–2% on ex-mill invoice value, direct billing, bad debts on our account, payment terms set by the spinner.',
  alternates: { canonical: '/business-concept/' },
};

export default function BusinessConcept() {
  return (
    <>
      <Section className="pt-[22vh] pb-[10vh] md:pt-[26vh]">
        <Shell>
          <p className="eyebrow mb-8">For spinning mills</p>
          <h1 className="display-xl max-w-[15ch] text-[clamp(42px,6.4vw,92px)] leading-[0.97]">
            The mandate, in full.
          </h1>
          <p className="measure mt-10 text-[17px] leading-[1.65] text-ink/70">
            We are dedicated yarn marketing agents. A mill hands us a territory
            and a product; we find the buyers, agree the terms, manage the
            paperwork and carry the credit risk. Nothing about that arrangement
            is unusual — but the details below are where mills decide whether to
            work with an agent or not, so here they are without the sales copy.
          </p>
        </Shell>
      </Section>

      <Section className="py-[10vh]">
        <Shell>
          <h2
            data-thread="underline"
            className="display-lg text-[clamp(30px,3.8vw,52px)] leading-[1.06]"
          >
            Terms
          </h2>
          <dl className="mt-14 border-t border-[var(--hairline)]">
            {mandateTerms.map((t) => (
              <div
                key={t.term}
                className="grid gap-3 border-b border-[var(--hairline)] py-8 md:grid-cols-[220px_1fr] md:gap-10"
              >
                <dt className="num text-[12px] uppercase tracking-[0.12em] text-ink/65 md:pt-[6px]">
                  {t.term}
                </dt>
                <dd className="measure text-[18px] leading-[1.6]">{t.detail}</dd>
              </div>
            ))}
          </dl>
        </Shell>
      </Section>

      <Section tone="paper-2" opaque className="py-[14vh]">
        <Shell>
          <div className="grid gap-x-16 gap-y-14 md:grid-cols-2">
            <div>
              <h2
                data-thread="pass-left"
                className="display-md text-[clamp(26px,3.2vw,42px)] leading-[1.1]"
              >
                Why mills stay
              </h2>
              <ul className="mt-10 space-y-0">
                {whyMillsStay.map((w, i) => (
                  <li
                    key={w}
                    className={`flex gap-6 py-5 text-[17px] leading-[1.5] ${
                      i === 0 ? '' : 'border-t border-[var(--hairline)]'
                    }`}
                  >
                    <span className="num text-[12px] text-brass-deep pt-[6px]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="display-md text-[clamp(26px,3.2vw,42px)] leading-[1.1]">
                Territories
              </h2>
              <ul className="mt-10 space-y-0">
                {territories.map((t, i) => (
                  <li
                    key={t}
                    className={`py-5 text-[17px] ${
                      i === 0 ? '' : 'border-t border-[var(--hairline)]'
                    }`}
                  >
                    {t}
                  </li>
                ))}
              </ul>

              <h3 className="display-md mt-16 text-[24px]">Current mandates</h3>
              <p className="mt-3 text-[14px] text-ink/65">
                Client-supplied, being confirmed before publication.
              </p>
              <ul className="mt-6 space-y-0">
                {currentMandates.map((m, i) => (
                  <li
                    key={m.name}
                    className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 ${
                      i === 0 ? '' : 'border-t border-[var(--hairline)]'
                    }`}
                  >
                    <span className="text-[17px]">{m.name}</span>
                    <span className="flex items-baseline gap-4">
                      {m.detail && (
                        <span className="num text-[12px] uppercase tracking-[0.1em] text-ink/65">
                          {m.detail}
                        </span>
                      )}
                      {!m.confirmed && <Unconfirmed>to confirm</Unconfirmed>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Shell>
      </Section>

      <Section className="py-[16vh]">
        <Shell>
          <div className="max-w-[52ch]">
            <h2 className="display-lg text-[clamp(28px,3.6vw,48px)] leading-[1.08]">
              Tell us the territory and the count.
            </h2>
            <p className="mt-8 text-[17px] leading-[1.65] text-ink/70">
              Send the product, the volume and the region you want covered. We
              will tell you honestly whether we are the right agent for it.
            </p>
            <div className="mt-10">
              <WhatsAppCta message="Hello Lotus Syndicate — I represent a spinning mill. I would like to discuss a marketing mandate: product, volume and territory as follows —">
                Discuss a mandate
              </WhatsAppCta>
            </div>
          </div>
        </Shell>
      </Section>
    </>
  );
}
