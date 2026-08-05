'use client';

import type Lenis from 'lenis';

/**
 * The live Lenis instance, so things outside the scroll provider can command
 * it. Route transitions need this: calling window.scrollTo while Lenis owns
 * scrolling makes the two fight, and the page lands somewhere neither of them
 * intended.
 */
export const lenisRef: { current: Lenis | null } = { current: null };

/** Jump to the top with no easing — used when a new route commits. */
export function resetScroll() {
  if (lenisRef.current) {
    lenisRef.current.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }
}
