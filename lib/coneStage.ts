'use client';

/**
 * Lets a page take direct control of where the cone sits, overriding the
 * default hero-then-park behaviour. The journey rail uses it to walk the cone
 * along the timeline.
 *
 * Coordinates are normalised to the viewport half-extents: x and y in -1..1,
 * so a page can position the cone without knowing the camera setup.
 */
export type ConeStage = {
  x: number;
  y: number;
  scale: number;
  tilt: number;
};

export const coneStage: { override: ConeStage | null } = { override: null };

export function setConeStage(s: ConeStage | null) {
  coneStage.override = s;
}
