'use client';

import { NoColorSpace, RepeatWrapping, Texture, TextureLoader } from 'three';

/**
 * A Suspense-friendly texture loader, replacing drei's useTexture.
 *
 * That import was one of the last things tying the bundle to
 * @react-three/drei, which costs around 50KB gzipped on a budget that is
 * already tight. This does the one thing the site actually needs: load a
 * couple of data maps once, cache them for the session, and throw the promise
 * so React suspends until they are decoded.
 */
type Entry =
  | { status: 'pending'; promise: Promise<void> }
  | { status: 'done'; texture: Texture }
  | { status: 'error'; error: unknown };

const cache = new Map<string, Entry>();
let loader: TextureLoader | null = null;

function load(url: string): Texture {
  const hit = cache.get(url);
  if (hit?.status === 'done') return hit.texture;
  if (hit?.status === 'error') throw hit.error;
  if (hit?.status === 'pending') throw hit.promise;

  loader ??= new TextureLoader();
  const promise = new Promise<void>((resolve, reject) => {
    loader!.load(
      url,
      (texture) => {
        // Every texture here is a data map — normals, roughness — so none of
        // them may be decoded as sRGB.
        texture.colorSpace = NoColorSpace;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        cache.set(url, { status: 'done', texture });
        resolve();
      },
      undefined,
      (error) => {
        cache.set(url, { status: 'error', error });
        reject(error);
      },
    );
  });

  cache.set(url, { status: 'pending', promise });
  throw promise;
}

/** Suspends until every url is decoded, then returns them in order. */
export function useTextures(urls: readonly string[]): Texture[] {
  return urls.map(load);
}
