'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { detectTier } from '@/lib/tier';

/**
 * The gate in front of the 3D bundle.
 *
 * The tier has to be decided *here*, before the dynamic import is rendered.
 * Deciding it inside Scene looks equivalent and is not: rendering <Scene />
 * triggers the chunk load, so a Static-tier visitor — no WebGL2, reduced
 * motion, or Save-Data on — was downloading 674KB of three.js in order for it
 * to return null. That is precisely the visitor who can least afford it.
 *
 * Everything below is code-split and only requested on the client, after the
 * document has painted, so text is on screen and readable before three.js is
 * so much as fetched.
 */
const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), {
  ssr: false,
  loading: () => null,
});

export function SceneMount() {
  const [canvas, setCanvas] = useState(false);

  useEffect(() => {
    setCanvas(detectTier() !== 'static');
  }, []);

  if (!canvas) return null;
  return <Scene />;
}
