'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LotusMark } from './LotusMark';
import { prefersReducedMotion } from '@/lib/tier';
import { resetScroll } from '@/lib/lenisInstance';

/**
 * Page transitions: an indigo sheet wipes up, the lotus holds, the sheet wipes
 * off and the new page is already there.
 *
 * The App Router has no navigation-start event to hook, so internal link
 * clicks are intercepted in the capture phase: play the wipe up, then push.
 * The exit is driven off `usePathname` changing, which only happens once the
 * new route has actually committed — so the sheet never lifts on a page that
 * has not arrived.
 *
 * The canvas is not touched. It lives in the root layout and never unmounts,
 * which is what lets the thread persist across routes without resetting.
 */

const WIPE_MS = 420;
const HOLD_MS = 200;

type Phase = 'idle' | 'entering' | 'covering' | 'holding' | 'revealing';

export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  const pending = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // ---- intercept internal navigations ------------------------------------
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      pending.current = url.pathname + url.search;
      // Mount off-screen first, then transition on the next frame — a sheet
      // that mounts already in place has nothing to animate from.
      setPhase('entering');
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase('covering')));

      clearTimers();
      timers.current.push(
        setTimeout(() => {
          const target = pending.current;
          pending.current = null;
          if (target) router.push(target);
        }, WIPE_MS),
      );
    };

    // Capture phase, so this runs before Next's own link handling.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router, clearTimers]);

  // ---- lift the sheet once the new route has committed --------------------
  useEffect(() => {
    if (phase !== 'covering') return;
    // pathname has changed while the sheet was down: hold, then reveal.
    clearTimers();
    setPhase('holding');
    timers.current.push(
      setTimeout(() => setPhase('revealing'), HOLD_MS),
      setTimeout(() => setPhase('idle'), HOLD_MS + WIPE_MS),
    );
    // Landing mid-page on a fresh route reads as a broken jump. Go through
    // Lenis rather than window.scrollTo, or the two fight over the position.
    resetScroll();
    // `phase` is deliberately not a dependency: this must fire on a pathname
    // change, not every time the phase advances.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // A navigation that never commits (an error, a blocked route) would strand
  // the sheet over the page. Lift it regardless after a generous timeout.
  useEffect(() => {
    if (phase !== 'covering') return;
    const bail = setTimeout(() => setPhase('idle'), 4000);
    return () => clearTimeout(bail);
  }, [phase]);

  if (phase === 'idle') return null;

  // A single upward movement: up from below to cover, then up and away.
  const offset =
    phase === 'entering' ? '101%' : phase === 'revealing' ? '-101%' : '0%';
  const settled = phase === 'covering' || phase === 'holding';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
      // The sheet is inert to assistive tech and to the pointer; it is purely
      // a covering. Live region announcements come from the page itself.
    >
      <div
        className="absolute inset-0 flex items-center justify-center bg-indigo-deep will-change-transform"
        style={{
          transform: `translate3d(0,${offset},0)`,
          transition:
            phase === 'entering'
              ? 'none'
              : `transform ${WIPE_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
        }}
      >
        <LotusMark
          size={46}
          className="text-paper/85"
          strokeWidth={1}
          style={{
            opacity: settled ? 1 : 0,
            transition: `opacity ${HOLD_MS}ms linear`,
          }}
        />
      </div>
    </div>
  );
}
