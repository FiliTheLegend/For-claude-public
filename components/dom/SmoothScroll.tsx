'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { setViewportHeight, writeScroll } from '@/lib/scroll';
import { prefersReducedMotion } from '@/lib/tier';

/**
 * Lenis owns scrolling and is the single writer to the scroll store.
 *
 * It is mounted after hydration and never blocks first paint: until it boots,
 * the page scrolls natively and every word is readable. Under
 * prefers-reduced-motion it never boots at all — we fall back to native
 * scrolling and just mirror window.scrollY into the store on a passive
 * listener, so the Static tier still knows where it is.
 */
export function SmoothScroll() {
  useEffect(() => {
    const limit = () =>
      Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    setViewportHeight(window.innerHeight);
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', onResize, { passive: true });

    if (prefersReducedMotion()) {
      let last = window.scrollY;
      let lastT = performance.now();
      const onScroll = () => {
        const now = performance.now();
        const dt = Math.max(1, now - lastT) / 1000;
        const y = window.scrollY;
        writeScroll(y, (y - last) / dt, limit());
        last = y;
        lastT = now;
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
      };
    }

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // Never hijack the browser's own anchor jumps or keyboard paging.
      autoRaf: false,
    });

    lenis.on('scroll', (e: { scroll: number; velocity: number }) => {
      // Lenis reports velocity in px per frame; the store is px per second.
      writeScroll(e.scroll, e.velocity * 60, limit());
    });

    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
