import type { Metadata } from 'next';
import { Section, Shell, WhatsAppCta } from '@/components/dom/ui';
import { company, contact } from '@/data/company';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'WhatsApp +91 98431 99963, three landlines, and our Coimbatore office on Maruthamalai Road. Open 8:30 AM – 6:30 PM, Monday to Saturday.',
  alternates: { canonical: '/contact-us/' },
};

/** LocalBusiness JSON-LD, per the quality floor. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: company.name,
  description:
    'Yarn marketing agents for spinning mills across Tamil Nadu and South India since 1974.',
  url: 'https://lotussyndicate.com/',
  telephone: contact.whatsapp,
  email: contact.email,
  foundingDate: String(company.founded),
  address: {
    '@type': 'PostalAddress',
    streetAddress: `${contact.address.line1}, ${contact.address.line2}`,
    addressLocality: contact.address.city,
    postalCode: contact.address.postcode,
    addressRegion: contact.address.state,
    addressCountry: 'IN',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: contact.hours.days,
      opens: contact.hours.opens,
      closes: contact.hours.closes,
    },
  ],
};

export default function ContactUs() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, developer-authored object — no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Section className="pt-[20vh] pb-[8vh] md:pt-[24vh]">
        <Shell>
          <p className="eyebrow mb-8">Coimbatore</p>
          <h1 className="display-xl max-w-[12ch] text-[clamp(42px,6.4vw,92px)] leading-[0.97]">
            WhatsApp is fastest.
          </h1>
          <div className="mt-12">
            <WhatsAppCta message="Hello Lotus Syndicate —">Message us</WhatsAppCta>
          </div>
        </Shell>
      </Section>

      <Section className="py-[10vh]">
        <Shell>
          <div className="grid gap-x-16 gap-y-14 border-t border-[var(--hairline)] pt-14 md:grid-cols-3">
            <div>
              <h2
                data-thread="pass-left"
                className="num text-[12px] uppercase tracking-[0.12em] text-ink/45"
              >
                Phone
              </h2>
              <ul className="mt-6 space-y-3 text-[19px]">
                <li>
                  <a className="num hover:text-brass" href={`tel:${contact.whatsapp}`}>
                    {contact.whatsappDisplay}
                  </a>
                  <span className="num ml-3 text-[11px] uppercase tracking-[0.1em] text-ink/40">
                    mobile / whatsapp
                  </span>
                </li>
                {contact.landlines.map((n) => (
                  <li key={n}>
                    <a className="num hover:text-brass" href={`tel:${n.replace(/\s/g, '')}`}>
                      {n}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="num mt-7 text-[13px] text-ink/50">{contact.hours.display}</p>
            </div>

            <div>
              <h2 className="num text-[12px] uppercase tracking-[0.12em] text-ink/45">
                Email
              </h2>
              <p className="mt-6 text-[19px]">
                <a className="hover:text-brass" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </p>
            </div>

            <div>
              <h2 className="num text-[12px] uppercase tracking-[0.12em] text-ink/45">
                Office
              </h2>
              <address className="mt-6 not-italic text-[17px] leading-[1.6]">
                {contact.address.line1}
                <br />
                {contact.address.line2}
                <br />
                {contact.address.line3}
                <br />
                <span className="num">
                  {contact.address.city} {contact.address.postcode}
                </span>
                <br />
                {contact.address.state}
              </address>
              <p className="mt-6">
                <a
                  className="text-[15px] underline decoration-[var(--hairline-strong)] underline-offset-[6px] hover:decoration-brass"
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Maps
                </a>
              </p>
            </div>
          </div>
        </Shell>
      </Section>

      <Section className="pb-[16vh]">
        <Shell>
          {/* A static map link rather than an embedded iframe: an embed is a
              third-party script, a cookie banner and about 900KB, none of
              which a visitor on 4G asked for. */}
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-[var(--hairline)] p-10 transition-colors hover:border-ink/25 md:p-16"
          >
            <p className="num text-[12px] uppercase tracking-[0.12em] text-brass">
              Maruthamalai Road
            </p>
            <p className="display-md mt-4 text-[clamp(24px,3vw,40px)] leading-[1.1]">
              Bharathiyar University Post,
              <br />
              Coimbatore <span className="num">641046</span>
            </p>
            <span className="mt-8 inline-block text-[15px] underline decoration-[var(--hairline-strong)] underline-offset-[6px] group-hover:decoration-brass">
              Get directions
            </span>
          </a>
        </Shell>
      </Section>
    </>
  );
}

const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${contact.address.line1}, ${contact.address.line2}, ${contact.address.city} ${contact.address.postcode}, ${contact.address.state}, India`,
)}`;
