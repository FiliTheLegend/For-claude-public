'use client';

/**
 * Lets a page take the thread off the document route for a stretch.
 *
 * The journey rail needs this. Its content is pinned, so screen position and
 * document position stop agreeing, and the anchor cache — which is built
 * entirely on the assumption that those two differ only by scrollY — cannot
 * describe it. Rather than complicate the anchor system for one page, the page
 * says directly where the thread should be while the pin is active.
 */
export type ThreadOverride = {
  /** Normalised to viewport half-height: -1 bottom, +1 top. */
  y: number;
  /** Where the strand trails back to, normalised to viewport half-width. */
  tailX: number;
  /** 0..1, faded in and out so the handover is not a jump cut. */
  blend: number;
};

export const threadOverride: { current: ThreadOverride | null } = { current: null };

export function setThreadOverride(o: ThreadOverride | null) {
  threadOverride.current = o;
}
