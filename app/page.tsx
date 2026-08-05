import type { Metadata } from 'next';
import Link from 'next/link';
import { Section, Shell, WhatsAppCta, Unconfirmed } from '@/components/dom/ui';
import { StatRow } from '@/components/dom/StatRow';
import { PrincipalWall } from '@/components/dom/PrincipalWall';
import { company, mandateTerms, territories } from '@/data/company';

export const metadata: Metadata = {
  title: 'Lotus Syndicate — Yarn marketing agents, Coimbatore',
  description:
    'Dedicated yarn marketing agents for spinning mills across Tamil Nadu and South India since 1974. Commission 0.5%–2% on ex-mill invoice value, direct billing, bad debts on our account.',
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <Section className="relative pt-[26vh] pb-[18vh] md:pt-[30vh]">
        {/* The thread's head tracks the cone itself, so it stays attached at
            every breakpoint. This marker only tells it where to fall *to*:
            low and roughly under the cone, so the strand drops rather than
            cutting a diagonal across the headline on its way to the first
            anchor further down the page. Presentational, hidden from AT. */}
        <div
          data-thread="payoff"
          aria-hidden="true"
          className="pointer-events-none absolute right-[26%] top-[94%] h-px w-px"
        />
        <Shell>
          <div className="max-w-[60%] md:max-w-[52%]">
            <p className="eyebrow mb-8">
              Yarn marketing agents · {company.city}
            </p>
            <h1 className="intro-rise display-xl text-[clamp(46px,7.4vw,104px)] leading-[0.94]">
              Fifty years.
              <br />
              One length
              <br />
              of yarn.
            </h1>
            <p className="measure mt-10 text-[17px] leading-[1.65] text-ink/70">
              Since <span className="num">1974</span> we have marketed yarn for spinning
              mills — Secunderabad, then Tirupur, now {company.city}. Three generations,
              one job: get the mill&rsquo;s yarn sold, at the right price, to buyers who
              pay.
            </p>
            <div className="mt-11 flex flex-wrap items-center gap-4">
              <WhatsAppCta message="Hello Lotus Syndicate — I represent a spinning mill and would like to discuss a marketing mandate.">
                Talk to us about a mandate
              </WhatsAppCta>
              <Link
                href="/business-concept/"
                className="text-[15px] underline decoration-[var(--hairline-strong)] underline-offset-[6px] hover:decoration-brass"
              >
                How the mandate works
              </Link>
            </div>
          </div>
        </Shell>
      </Section>

      {/* ------------------------------------------------------- the model */}
      <Section className="py-[14vh]">
        <Shell>
          <h2
            data-thread="underline"
            className="display-lg max-w-[16ch] text-[clamp(32px,4.2vw,58px)] leading-[1.05]"
          >
            We are agents, not traders.
          </h2>

          <div className="mt-16 grid gap-x-16 gap-y-12 md:grid-cols-2">
            <p className="measure text-[17px] leading-[1.7] text-ink/75">
              Lotus Syndicate holds no yarn. We buy nothing, stock nothing and own
              nothing. The spinner invoices the end buyer directly; we find the buyer,
              agree the terms, manage the process and carry the risk on the money. That
              distinction is the entire business.
            </p>
            <dl className="space-y-0">
              {mandateTerms.map((t, i) => (
                <div
                  key={t.term}
                  className={`grid grid-cols-[128px_1fr] gap-6 py-5 ${
                    i === 0 ? '' : 'border-t border-[var(--hairline)]'
                  }`}
                >
                  <dt className="num text-[12px] uppercase tracking-[0.1em] text-ink/65 pt-[3px]">
                    {t.term}
                  </dt>
                  <dd className="text-[16px] leading-[1.6] text-ink/80">{t.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Shell>
      </Section>

      {/* ------------------------------------------------------------ stats */}
      <StatRow />

      {/* -------------------------------------------------- principal wall */}
      <PrincipalWall />

      {/* ------------------------------------------------------ territories */}
      <Section tone="paper-2" opaque className="py-[14vh]">
        <Shell>
          <div className="grid gap-x-16 gap-y-12 md:grid-cols-[0.9fr_1.1fr]">
            <h2
              data-thread="pass-left"
              className="display-md text-[clamp(28px,3.4vw,44px)] leading-[1.1]"
            >
              Where we sell
            </h2>
            <ul className="space-y-0">
              {territories.map((t, i) => (
                <li
                  key={t}
                  className={`flex items-baseline gap-6 py-5 text-[19px] ${
                    i === 0 ? '' : 'border-t border-[var(--hairline)]'
                  }`}
                >
                  <span className="num text-[12px] text-brass-deep">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Shell>
      </Section>

      {/* ------------------------------------------------------------- fork
          `behind` drops this section below the canvas so the two forked
          strands lie *over* the cards. Everywhere else the thread ducks behind
          opaque content; here it must not, because the whole point of the
          split is that one strand runs across each choice. */}
      <Section behind className="py-[16vh]">
        <Shell>
          <p className="eyebrow mb-12">Two ways in</p>
          <div data-thread="split" className="grid gap-px bg-[var(--hairline)] md:grid-cols-2">
            <Link
              href="/business-concept/"
              className="group bg-paper p-10 transition-colors hover:bg-paper-2 md:p-14"
            >
              <p className="num text-[12px] uppercase tracking-[0.12em] text-brass-deep">
                For spinning mills
              </p>
              <h3 className="display-md mt-5 text-[clamp(26px,2.8vw,38px)] leading-[1.12]">
                Hand us the mandate
              </h3>
              <p className="measure mt-5 text-[16px] leading-[1.65] text-ink/70">
                Commission <span className="num">0.5–2%</span> on ex-mill invoice value.
                Direct billing. Bad debts on our account. Terms set by you.
              </p>
              <span className="mt-8 inline-block text-[15px] underline decoration-[var(--hairline-strong)] underline-offset-[6px] group-hover:decoration-brass">
                Read the business concept
              </span>
            </Link>

            <Link
              href="/for-buyers/"
              className="group bg-paper p-10 transition-colors hover:bg-paper-2 md:p-14"
            >
              <p className="num text-[12px] uppercase tracking-[0.12em] text-brass-deep">
                For weavers and buyers
              </p>
              <h3 className="display-md mt-5 text-[clamp(26px,2.8vw,38px)] leading-[1.12]">
                Tell us your count
              </h3>
              <p className="measure mt-5 text-[16px] leading-[1.65] text-ink/70">
                Counts actively marketed include <span className="num">30s</span> and{' '}
                <span className="num">40s</span> CCW{' '}
                <Unconfirmed>unconfirmed</Unconfirmed>. Send the count and quantity on
                WhatsApp and we will come back with mills and prices.
              </p>
              <span className="mt-8 inline-block text-[15px] underline decoration-[var(--hairline-strong)] underline-offset-[6px] group-hover:decoration-brass">
                What we carry
              </span>
            </Link>
          </div>
        </Shell>
      </Section>
    </>
  );
}
