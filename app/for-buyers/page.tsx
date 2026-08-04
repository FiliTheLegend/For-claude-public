import type { Metadata } from 'next';
import { Section, Shell, WhatsAppCta, Unconfirmed } from '@/components/dom/ui';
import { contact, territories } from '@/data/company';
import { counts, currentMandates } from '@/data/principals';

export const metadata: Metadata = {
  title: 'For buyers',
  description:
    'Weavers and corporate buyers: tell us the count and the quantity on WhatsApp and we will come back with mills and prices. Coverage across Tamil Nadu, South India and Pan India.',
  alternates: { canonical: '/for-buyers/' },
};

/** Weavers scan. This page is deliberately the shortest on the site. */
export default function ForBuyers() {
  return (
    <>
      <Section className="pt-[20vh] pb-[8vh] md:pt-[24vh]">
        <Shell>
          <p className="eyebrow mb-8">For weavers and corporate buyers</p>
          <h1 className="display-xl max-w-[13ch] text-[clamp(42px,6.4vw,92px)] leading-[0.97]">
            Send the count. We&rsquo;ll send the mills.
          </h1>
          <div className="mt-12">
            <WhatsAppCta message="Hello Lotus Syndicate — I am a buyer. Count: ___ . Quantity: ___ kg. Delivery to: ___ .">
              WhatsApp us the count
            </WhatsAppCta>
          </div>
          <p className="num mt-6 text-[13px] text-ink/50">
            or call{' '}
            <a className="hover:text-ink" href={`tel:${contact.whatsapp}`}>
              {contact.whatsappDisplay}
            </a>
          </p>
        </Shell>
      </Section>

      <Section className="py-[10vh]">
        <Shell>
          <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
            <div>
              <h2
                data-thread="underline"
                className="display-md text-[clamp(24px,2.8vw,36px)] leading-[1.1]"
              >
                What we carry
              </h2>
              <ul className="mt-9 space-y-0">
                {counts.map((c, i) => (
                  <li
                    key={c.count}
                    className={`flex items-baseline gap-5 py-4 text-[19px] ${
                      i === 0 ? '' : 'border-t border-[var(--hairline)]'
                    }`}
                  >
                    <span className="num text-[24px]">{c.count}</span>
                    <span className="text-ink/70">{c.type}</span>
                    {!c.confirmed && <Unconfirmed>to confirm</Unconfirmed>}
                  </li>
                ))}
              </ul>
              <p className="measure mt-8 text-[15px] leading-[1.6] text-ink/55">
                Counts vary with what our principals are running. Ask for a
                count that is not listed — we will tell you which mills have it
                and what the current price is.
              </p>
            </div>

            <div>
              <h2 className="display-md text-[clamp(24px,2.8vw,36px)] leading-[1.1]">
                Mills we market for
              </h2>
              <ul className="mt-9 space-y-0">
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
                        <span className="num text-[12px] uppercase tracking-[0.1em] text-ink/55">
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

      <Section tone="paper-2" opaque className="py-[12vh]">
        <Shell>
          <h2 className="display-md text-[clamp(24px,2.8vw,36px)]">Coverage</h2>
          <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-[18px]">
            {territories.map((t) => (
              <li key={t} className="flex items-baseline gap-3">
                <span aria-hidden="true" className="h-[6px] w-[6px] bg-brass" />
                {t}
              </li>
            ))}
          </ul>
        </Shell>
      </Section>

      <Section className="py-[14vh]">
        <Shell>
          <div className="max-w-[46ch]">
            <h2 className="display-lg text-[clamp(28px,3.6vw,48px)] leading-[1.08]">
              One message is enough.
            </h2>
            <p className="mt-7 text-[17px] leading-[1.65] text-ink/70">
              Count, quantity, delivery town. That is all we need to come back
              to you with a price.
            </p>
            <div className="mt-9">
              <WhatsAppCta message="Hello Lotus Syndicate — I am a buyer. Count: ___ . Quantity: ___ kg. Delivery to: ___ .">
                WhatsApp us the count
              </WhatsAppCta>
            </div>
          </div>
        </Shell>
      </Section>
    </>
  );
}
