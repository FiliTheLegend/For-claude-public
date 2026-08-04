'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTextures } from './useTexture';
import { FuzzShell } from './FuzzShell';
import { markAssetsReady } from '@/lib/intro';
import {
  Group,
  Mesh,
  Vector3,
  type MeshPhysicalMaterial,
} from 'three';
import {
  CONE,
  buildCoreGeometry,
  buildMassGeometry,
  buildStrandGeometry,
  payoffPoint,
} from './cone-geometry';

/** Mutable drive state, written by the scene each frame. No React re-renders. */
export type ConeDrive = {
  /** Radians. Accumulated, never wrapped — the material reads it via rotation. */
  rotation: number;
  /** 0 = full package, 1 = nearly bare core. */
  depletion: number;
  /** Local angle at which the thread leaves the shoulder. */
  payoffAngle: number;
};

export const createConeDrive = (): ConeDrive => ({
  rotation: 0,
  depletion: 0,
  payoffAngle: 0,
});

type Props = {
  drive: ConeDrive;
  lite?: boolean;
  /** Called each frame with the payoff point in world space. */
  onPayoff?: (p: Vector3) => void;
};

const TEXTURES = [
  '/assets/textures/yarn-fibre-normal.png',
  '/assets/textures/yarn-fibre-rough.png',
];

export function YarnCone({ drive, lite = false, onPayoff }: Props) {
  const group = useRef<Group>(null);
  const mass = useRef<Mesh>(null);
  const strand = useRef<Mesh>(null);
  const [normalMap, roughnessMap] = useTextures(TEXTURES);

  const geo = useMemo(
    () => ({
      mass: buildMassGeometry(lite ? 34 : 68, lite ? 40 : 96),
      core: buildCoreGeometry(lite ? 32 : 64),
      strand: lite ? null : buildStrandGeometry(1600, 5),
    }),
    [lite],
  );

  useEffect(() => {
    return () => {
      geo.mass.dispose();
      geo.core.dispose();
      geo.strand?.dispose();
    };
  }, [geo]);

  // Mesh.updateMorphTargets() only runs in the constructor, and R3F builds the
  // mesh before assigning geometry — so without this the influence arrays are
  // never allocated and the first depth pass throws.
  useLayoutEffect(() => {
    mass.current?.updateMorphTargets();
    strand.current?.updateMorphTargets();
  }, [geo]);

  useEffect(() => {
    for (const t of [normalMap, roughnessMap]) {
      t.anisotropy = lite ? 2 : 8;
      t.needsUpdate = true;
    }
    // Repeats are chosen so one texture tile is close to square in world
    // units, which keeps the baked 18° winding angle reading as 18° on the
    // surface instead of being sheared by the UV aspect.
    normalMap.repeat.set(4, 1.7);
    roughnessMap.repeat.set(4, 1.7);
  }, [normalMap, roughnessMap, lite]);

  // useTexture suspends, so reaching this point means the maps are decoded
  // and the cone can actually draw.
  useEffect(() => markAssetsReady(), []);

  const payoff = useMemo(() => new Vector3(), []);

  useFrame(() => {
    if (group.current) group.current.rotation.y = drive.rotation;

    const d = drive.depletion;
    if (mass.current?.morphTargetInfluences) mass.current.morphTargetInfluences[0] = d;
    if (strand.current?.morphTargetInfluences) {
      strand.current.morphTargetInfluences[0] = d;
      // The real wraps are the outermost layers, so they are the first thing
      // to go. They also have to be gone before the shoulder flattens out —
      // once the package is thin the band degenerates into grazing arcs that
      // read as artefacts rather than yarn.
      const m = strand.current.material as MeshPhysicalMaterial;
      m.opacity = Math.max(0, 1 - Math.max(0, d - 0.12) / 0.28);
      strand.current.visible = m.opacity > 0.01;
    }

    if (onPayoff && group.current) {
      payoffPoint(d, drive.payoffAngle - drive.rotation, payoff);
      onPayoff(group.current.localToWorld(payoff));
    }
  });

  return (
    <group ref={group}>
      {/* Wound mass */}
      <mesh ref={mass} geometry={geo.mass} castShadow receiveShadow>
        {/* Sheen is the expensive term in MeshPhysicalMaterial, so Lite drops
            it and leans on the normal map instead — same silhouette, same
            winding, a fraction of the fragment cost. */}
        <meshPhysicalMaterial
          color="#FBFAF8"
          roughness={0.86}
          metalness={0}
          sheen={lite ? 0 : 1}
          sheenRoughness={0.32}
          sheenColor="#FFF6E6"
          clearcoat={0}
          normalMap={normalMap}
          normalScale={[lite ? 0.6 : 0.72, lite ? 0.6 : 0.72] as unknown as never}
          roughnessMap={roughnessMap}
          envMapIntensity={lite ? 1.05 : 0.9}
        />
      </mesh>

      {/* Loose fibre standing off the surface */}
      {!lite && (
        <FuzzShell geometry={geo.mass} breakup={roughnessMap} drive={drive} />
      )}

      {/* Real wraps at the payoff shoulder */}
      {geo.strand && (
        <mesh ref={strand} geometry={geo.strand} castShadow>
          <meshPhysicalMaterial
            color="#FCFBF9"
            roughness={0.82}
            metalness={0}
            sheen={1}
            sheenRoughness={0.28}
            sheenColor="#FFF6E6"
            envMapIntensity={1.0}
            transparent
          />
        </mesh>
      )}

      {/* Plastic core. Barely visible at foot and tip — that glimpse of a
          second material is what stops the whole thing reading as one blob. */}
      <mesh geometry={geo.core} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#E8E6E1"
          roughness={0.38}
          metalness={0}
          clearcoat={0.5}
          clearcoatRoughness={0.35}
          sheen={0}
          envMapIntensity={1.1}
        />
      </mesh>
    </group>
  );
}

export { CONE };
