import Link from 'next/link';
import type { ReactNode } from 'react';
import { whatsappLink } from '@/data/company';

/** Page sections sit above the canvas. Opaque ones occlude the thread. */
export function Section({
  children,
  id,
  opaque = false,
  behind = false,
  tone = 'paper',
  className = '',
  ...rest
}: {
  children: ReactNode;
  id?: string;
  /** Give the section a background so the thread ducks behind it. */
  opaque?: boolean;
  /** Drop below the canvas so the thread passes in front of the content. */
  behind?: boolean;
  tone?: 'paper' | 'paper-2' | 'indigo';
  className?: string;
} & Record<string, unknown>) {
  const bg =
    tone === 'indigo'
      ? 'bg-indigo-deep text-paper'
      : tone === 'paper-2'
        ? 'bg-paper-2'
        : 'bg-paper';
  return (
    <section
      id={id}
      className={`relative ${behind ? 'z-0' : 'z-[3]'} ${opaque ? bg : ''} ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

export function Shell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1320px] px-6 md:px-10 lg:px-16 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function Rule({ brass = false }: { brass?: boolean }) {
  return <hr className={brass ? 'rule-brass' : 'rule'} />;
}

/**
 * WhatsApp is the primary call to action everywhere on this site. In Indian
 * textile trade it is the channel people actually use; a contact form is
 * theatre. Every instance carries a page-specific prefilled message.
 */
export function WhatsAppCta({
  message,
  children,
  variant = 'solid',
  className = '',
}: {
  message: string;
  children: ReactNode;
  variant?: 'solid' | 'ghost';
  className?: string;
}) {
  const base =
    'inline-flex items-center gap-3 rounded-[3px] px-6 py-4 text-[15px] tracking-[0.01em] transition-colors duration-200';
  const style =
    variant === 'solid'
      ? 'bg-ink text-paper hover:bg-indigo'
      : 'border border-[var(--hairline-strong)] text-ink hover:border-ink';
  return (
    <a
      href={whatsappLink(message)}
      className={`${base} ${style} ${className}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <span aria-hidden="true" className="num text-[12px] opacity-60">
        WHATSAPP
      </span>
    </a>
  );
}

export function TextLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const cls =
    'underline decoration-[var(--hairline-strong)] underline-offset-[5px] hover:decoration-brass transition-colors';
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** A value that has not been confirmed by the client yet. */
export function Unconfirmed({ children }: { children: ReactNode }) {
  return (
    <span className="num text-[11px] uppercase tracking-[0.12em] text-ink/35" title="Not yet confirmed">
      {children}
    </span>
  );
}
