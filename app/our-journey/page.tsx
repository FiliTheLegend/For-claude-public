import type { Metadata } from 'next';
import { Section, Shell, WhatsAppCta } from '@/components/dom/ui';
import { JourneyRail } from './JourneyRail';

export const metadata: Metadata = {
  title: 'Our journey',
  description:
    'From Pan Bazaar, Secunderabad in 1974, to Tirupur as M/s. Shri Krishna Agencies, to Coimbatore today — fifty years of yarn marketing in six eras.',
  alternates: { canonical: '/our-journey/' },
};

export default function OurJourney() {
  return (
    <>
      <Section className="pt-[20vh] pb-[10vh] md:pt-[24vh]">
        <Shell>
          <p className="eyebrow mb-8">1974 — present</p>
          <h1 className="display-xl max-w-[13ch] text-[clamp(42px,6.4vw,92px)] leading-[0.97]">
            Secunderabad to Coimbatore.
          </h1>
          <p className="measure mt-10 text-[17px] leading-[1.65] text-ink/70">
            Six eras, two relocations, three generations. The cone travels the
            timeline below.
          </p>
        </Shell>
      </Section>

      <JourneyRail />

      <Section className="py-[16vh]">
        <Shell>
          <div className="max-w-[50ch]">
            <h2 className="display-lg text-[clamp(28px,3.6vw,48px)] leading-[1.08]">
              Fifty years is the argument.
            </h2>
            <p className="mt-8 text-[17px] leading-[1.65] text-ink/70">
              Mills do not hand a territory to an agent on a pitch. They hand it
              over on a record.
            </p>
            <div className="mt-10">
              <WhatsAppCta message="Hello Lotus Syndicate — I read your journey page and would like to discuss a mandate.">
                Discuss a mandate
              </WhatsAppCta>
            </div>
          </div>
        </Shell>
      </Section>
    </>
  );
}
