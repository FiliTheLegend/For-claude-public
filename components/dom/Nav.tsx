'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LotusWordmark } from './LotusMark';
import { contact } from '@/data/company';

const LINKS = [
  { href: '/business-concept/', label: 'Business concept' },
  { href: '/our-journey/', label: 'Our journey' },
  { href: '/about-us/', label: 'About us' },
  { href: '/for-buyers/', label: 'For buyers' },
  { href: '/contact-us/', label: 'Contact' },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-[20]">
      <div className="bg-paper/85 backdrop-blur-[2px]">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-5 md:px-10 lg:px-16">
          <Link href="/" aria-label="Lotus Syndicate, home">
            <LotusWordmark />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-[14px] transition-colors ${
                    active ? 'text-ink' : 'text-ink/65 hover:text-ink'
                  }`}
                >
                  {l.label}
                  {active && <span className="mt-1 block h-px bg-brass" aria-hidden="true" />}
                </Link>
              );
            })}
            <a
              href={`tel:${contact.landlines[0].replace(/\s/g, '')}`}
              className="num text-[13px] text-ink/70 hover:text-ink"
            >
              {contact.landlines[0]}
            </a>
          </nav>

          <button
            type="button"
            className="lg:hidden text-[13px] tracking-[0.1em] uppercase"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
        <hr className="rule" />
      </div>

      {open && (
        <div id="mobile-nav" className="bg-paper h-[100dvh] lg:hidden">
          <nav aria-label="Primary" className="flex flex-col px-6 pt-6">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border-b border-[var(--hairline)] py-5 font-display text-[26px]"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={`tel:${contact.whatsapp}`}
              className="num py-6 text-[15px] text-ink/70"
            >
              {contact.whatsappDisplay}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
