import Link from 'next/link';
import { LotusMark } from './LotusMark';
import { Shell } from './ui';
import { company, contact } from '@/data/company';

export function Footer() {
  return (
    <footer className="relative z-[3] bg-paper pt-28 pb-14">
      <Shell>
        {/* The thread arrives here, ties off, and draws the mark. */}
        <div
          data-thread="knot"
          className="mx-auto mb-16 flex h-24 w-24 items-center justify-center"
        >
          <LotusMark size={44} className="text-brass" title="Lotus Syndicate" draw />
        </div>

        <hr className="rule" />

        <div className="grid gap-12 pt-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-[24px] leading-snug">
              {company.name}
            </p>
            <p className="measure mt-3 text-[15px] text-ink/60">
              Yarn marketing agents for spinning mills across Tamil Nadu and South
              India since {company.founded}. Commission agents — no inventory held.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-4">Office</p>
            <address className="not-italic text-[15px] leading-relaxed text-ink/70">
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
          </div>

          <div>
            <p className="eyebrow mb-4">Reach us</p>
            <ul className="space-y-2 text-[15px] text-ink/70">
              <li>
                <a className="num hover:text-ink" href={`tel:${contact.whatsapp}`}>
                  {contact.whatsappDisplay}
                </a>
              </li>
              {contact.landlines.map((n) => (
                <li key={n}>
                  <a className="num hover:text-ink" href={`tel:${n.replace(/\s/g, '')}`}>
                    {n}
                  </a>
                </li>
              ))}
              <li>
                <a className="hover:text-ink" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </li>
              <li className="num pt-2 text-[13px] text-ink/45">{contact.hours.display}</li>
            </ul>
          </div>
        </div>

        <hr className="rule mt-14" />

        <div className="flex flex-col gap-4 pt-6 text-[13px] text-ink/45 md:flex-row md:items-center md:justify-between">
          <p className="num">
            © {company.founded}–{new Date().getFullYear()} {company.name}
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2">
            <Link href="/business-concept/" className="hover:text-ink">
              Business concept
            </Link>
            <Link href="/our-journey/" className="hover:text-ink">
              Our journey
            </Link>
            <Link href="/about-us/" className="hover:text-ink">
              About us
            </Link>
            <Link href="/for-buyers/" className="hover:text-ink">
              For buyers
            </Link>
            <Link href="/contact-us/" className="hover:text-ink">
              Contact
            </Link>
          </nav>
        </div>
      </Shell>
    </footer>
  );
}
