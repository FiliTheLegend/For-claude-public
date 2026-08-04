import {
  BufferAttribute,
  CatmullRomCurve3,
  LatheGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from 'three';

/**
 * Everything here is in cone-local units where the package height is 1.0.
 * The camera sits at 35° FOV, so these numbers read as a ~280mm cone.
 */
export const CONE = {
  /**
   * Radius of the plastic core at y = 0 and y = 1. The core is much narrower
   * than the package — on a real cone the yarn overhangs it as a wide skirt
   * and the plastic is visible only as a rim at the foot and a nose at the
   * top. Between those two the core is entirely buried, so its exact taper
   * only matters as the floor that depletion collapses onto.
   */
  coreBottom: 0.135,
  coreTop: 0.075,
  /** Vertical extent of the wound mass. */
  massBottom: 0.008,
  massTop: 0.928,
  /** Where real tube strands take over from the normal-mapped lathe. */
  strandBottom: 0.800,
  strandTop: 0.918,
  /**
   * Winding angle off horizontal — the same 18-20° the fibre normal map is
   * cut at, so the real wraps and the mapped ones agree. Turn count is
   * derived from it, never chosen directly.
   */
  strandWindAngle: (20 * Math.PI) / 180,
  strandPasses: 64,
  /** Gauge of an individual wrap. Much finer than the paid-out thread, which
   *  is deliberately drawn heavier so it survives as a page-scale graphic. */
  wrapRadius: 0.0019,
  threadRadius: 0.006,
  /**
   * Fraction of the yarn thickness left at full depletion. Tuned so the
   * widest point goes 0.343 -> 0.19 exactly as specified.
   */
  depletionFloor: 0.28,
} as const;

export const coreRadius = (y: number) =>
  CONE.coreBottom + (CONE.coreTop - CONE.coreBottom) * y;

/**
 * Silhouette of a full package.
 *
 * A cone package is much straighter than instinct suggests: a flat annular
 * base overhanging the plastic rim, a tight round at the base edge, then an
 * almost dead-straight 11° taper carrying about 4mm of belly across the whole
 * height, and finally the shoulder rounding hard over onto the core. Give the
 * taper any more curvature than this and it stops being a cone and starts
 * being a vase.
 */
const SILHOUETTE: [number, number][] = [
  [0.150, 0.008], // underside, at the plastic rim
  [0.258, 0.016],
  [0.320, 0.027],
  [0.3405, 0.048], // base edge, tight round
  [0.3425, 0.075], // widest point
  [0.3211, 0.20],
  [0.2948, 0.34],
  [0.2690, 0.47],
  [0.2431, 0.60],
  [0.2207, 0.71],
  [0.2040, 0.79],
  [0.1915, 0.855], // taper runs straight almost to the top
  [0.1810, 0.884], // shoulder begins, and turns hard
  [0.1580, 0.906],
  [0.1230, 0.921],
  [0.0940, 0.926],
  [coreRadius(CONE.massTop) + 0.001, CONE.massTop],
];

const silhouetteCurve = new CatmullRomCurve3(
  SILHOUETTE.map(([r, y]) => new Vector3(r, y, 0)),
  false,
  'centripetal',
  0.5,
);

/** Cached even sampling of the full silhouette, keyed by point count. */
const sampleCache = new Map<number, { r: number; y: number }[]>();

function sampleSilhouette(count: number) {
  const hit = sampleCache.get(count);
  if (hit) return hit;
  const pts = silhouetteCurve.getSpacedPoints(count - 1).map((p) => ({
    r: p.x,
    y: p.y,
  }));
  sampleCache.set(count, pts);
  return pts;
}

/**
 * Outer radius of the wound mass at height `y` for a given depletion in 0..1.
 * The mass thins onto the core rather than shortening, which is how a
 * side-withdrawn package actually empties.
 */
export function massRadius(r: number, y: number, depletion: number) {
  const core = coreRadius(y);
  const thickness = Math.max(0, r - core);
  return core + thickness * (1 - depletion * (1 - CONE.depletionFloor));
}

export function massProfile(segments: number, depletion: number): Vector2[] {
  return sampleSilhouette(segments).map(
    ({ r, y }) => new Vector2(massRadius(r, y, depletion), y),
  );
}

/**
 * The wound mass. Depletion is a morph target rather than a per-frame
 * position rewrite: uploading 6k vertices every frame is exactly the kind of
 * thing that costs us the 30fps floor on a mid-tier Android.
 */
export function buildMassGeometry(profileSegments: number, radialSegments: number) {
  const full = new LatheGeometry(massProfile(profileSegments, 0), radialSegments);
  const empty = new LatheGeometry(massProfile(profileSegments, 1), radialSegments);

  full.morphAttributes.position = [
    new BufferAttribute(
      (empty.attributes.position.array as Float32Array).slice(),
      3,
    ),
  ];
  full.morphAttributes.normal = [
    new BufferAttribute(
      (empty.attributes.normal.array as Float32Array).slice(),
      3,
    ),
  ];
  full.morphTargetsRelative = false;
  empty.dispose();

  full.computeBoundingSphere();
  return full;
}

/**
 * The plastic core. Two glimpses only: a rolled rim under the skirt of yarn
 * at the foot, and the nose poking out above the shoulder. Everything between
 * is buried, so it is modelled as cheaply as possible.
 */
export function buildCoreGeometry(radialSegments: number) {
  const pts = [
    new Vector2(0, -0.014),
    new Vector2(0.128, -0.014),
    new Vector2(0.141, -0.006), // rolled rim
    new Vector2(0.141, 0.008),
    new Vector2(0.132, 0.02),
    new Vector2(coreRadius(0.5), 0.5),
    new Vector2(coreRadius(0.9), 0.9),
    new Vector2(0.0665, 0.975),
    new Vector2(0.0620, 1.012), // outer wall of the nose
    new Vector2(0.0605, 1.020),
    // A cone is a hollow tube. Turning the lip over and running the wall
    // back down inside shows the bore, and that one detail is the difference
    // between reading as moulded plastic and reading as a bulb.
    new Vector2(0.0470, 1.020),
    new Vector2(0.0455, 1.008),
    new Vector2(0.0480, 0.945),
  ];
  return new LatheGeometry(pts, radialSegments);
}

/**
 * The last few dozen wraps, as real tube geometry.
 *
 * This is one continuous strand doing a traverse wind — up the shoulder, back
 * down, up again — which is both how a cone winder actually lays yarn and the
 * cheapest way to get a convincing criss-cross: a single tube, one draw call,
 * and the crossings fall out of the geometry instead of being faked.
 *
 * The strand ends at the top of the shoulder, which is where the paid-out
 * thread picks up.
 */
function strandPoints(depletion: number, resolution: number): Vector3[] {
  const { strandBottom, strandTop, strandPasses, strandWindAngle } = CONE;
  const pts: Vector3[] = [];
  const height = strandTop - strandBottom;

  /**
   * Wraps stand proud of the lathe at the top of the band and sink into it at
   * the bottom, so the real geometry dissolves into the normal-mapped surface
   * instead of stopping on a visible horizontal seam.
   */
  const liftAt = (y: number) => {
    const t = Math.min(1, Math.max(0, (y - strandBottom) / (height * 0.4)));
    const fade = t * t * (3 - 2 * t);
    return CONE.wrapRadius * (1.25 * fade - 0.8 * (1 - fade));
  };

  /**
   * Turns per traverse follows from the winding angle rather than being
   * picked by eye. Choosing a turn count directly is what produces the
   * classic mistake: many turns across a short band gives a helix angle near
   * zero, and the shoulder reads as a stack of concentric rings instead of a
   * cross-wound package.
   */
  const meanRadius = massRadius(
    silhouetteRadiusAt((strandBottom + strandTop) / 2),
    (strandBottom + strandTop) / 2,
    depletion,
  );
  const circumference = 2 * Math.PI * meanRadius;
  const turnsPerPass = height / (circumference * Math.tan(strandWindAngle));

  for (let i = 0; i <= resolution; i++) {
    const s = i / resolution;
    const pass = Math.min(strandPasses - 1, Math.floor(s * strandPasses));
    const local = s * strandPasses - pass;
    // Even passes climb, odd passes descend. Easing at the turnaround keeps
    // the tube from kinking where the traverse reverses.
    const eased = local * local * (3 - 2 * local);
    const t = pass % 2 === 0 ? eased : 1 - eased;
    const y = strandBottom + height * t;

    const silY = silhouetteRadiusAt(y);
    const r = massRadius(silY, y, depletion) + liftAt(y);
    const a = s * strandPasses * turnsPerPass * Math.PI * 2;
    pts.push(new Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return pts;
}

/** Full-package silhouette radius at an arbitrary height. */
function silhouetteRadiusAt(y: number): number {
  const pts = sampleSilhouette(160);
  if (y <= pts[0].y) return pts[0].r;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].y >= y) {
      const a = pts[i - 1];
      const b = pts[i];
      const k = (y - a.y) / Math.max(1e-6, b.y - a.y);
      return a.r + (b.r - a.r) * k;
    }
  }
  return pts[pts.length - 1].r;
}

export function buildStrandGeometry(
  tubularSegments: number,
  radialSegments: number,
): TubeGeometry {
  const make = (depletion: number) =>
    new TubeGeometry(
      new CatmullRomCurve3(strandPoints(depletion, tubularSegments), false, 'centripetal', 0.5),
      tubularSegments,
      CONE.wrapRadius,
      radialSegments,
      false,
    );

  const full = make(0);
  const empty = make(1);
  full.morphAttributes.position = [
    new BufferAttribute((empty.attributes.position.array as Float32Array).slice(), 3),
  ];
  full.morphAttributes.normal = [
    new BufferAttribute((empty.attributes.normal.array as Float32Array).slice(), 3),
  ];
  empty.dispose();
  return full;
}

/**
 * Where the paid-out thread leaves the package, in cone-local space, for a
 * given depletion. `angle` lets the caller aim the takeoff at the camera
 * rather than letting it sweep behind the cone every rotation.
 */
export function payoffPoint(depletion: number, angle: number, out = new Vector3()) {
  const y = CONE.strandTop;
  const r = massRadius(silhouetteRadiusAt(y), y, depletion) + CONE.wrapRadius * 1.2;
  return out.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
}

export function disposeGeometry(g: BufferGeometry | null | undefined) {
  g?.dispose();
}
