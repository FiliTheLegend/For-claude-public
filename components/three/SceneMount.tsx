'use client';

import dynamic from 'next/dynamic';

/**
 * The whole 3D bundle is code-split and only requested on the client, after
 * the document has painted. Text is on screen and readable before three.js is
 * so much as fetched — which is the difference between a 3D hero being a
 * flourish and being a tax on someone in Kumarapalayam on 4G.
 */
const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), {
  ssr: false,
  loading: () => null,
});

export function SceneMount() {
  return <Scene />;
}
