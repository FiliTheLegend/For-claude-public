'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  FrontSide,
  NormalBlending,
  Mesh,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  type BufferGeometry,
} from 'three';

/**
 * The halo of loose fibre standing off the surface of a yarn package.
 *
 * Without it the cone has a razor-clean silhouette, and a razor-clean
 * silhouette is the single loudest tell that an object is CG — real yarn is
 * furry at the edge and catches light there. Modelling actual fibres is out of
 * the question at this frame budget, so this is one extra shell of the same
 * lathe, pushed out along its normals and made visible only where the surface
 * turns away from the camera.
 *
 * Costs one extra unlit draw of geometry that is already in memory.
 */
const vertex = /* glsl */ `
  #include <common>
  #include <morphtarget_pars_vertex>

  uniform float uWidth;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  varying vec2 vUvF;

  void main() {
    vUvF = uv;

    vec3 objectNormal = normal;
    #include <morphnormal_vertex>

    vec3 transformed = position;
    #include <morphtarget_vertex>

    // Push the shell out along the (morphed) normal so it stands off the
    // surface by a constant world-space amount.
    transformed += objectNormal * uWidth;

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    vNormalV = normalize(normalMatrix * objectNormal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  uniform float uPower;
  uniform float uOpacityScale;
  uniform sampler2D uBreakup;
  uniform vec2 uRepeat;

  varying vec3 vNormalV;
  varying vec3 vViewDir;
  varying vec2 vUvF;

  void main() {
    // Grazing angles only: this is a rim effect, and any fill across the body
    // reads as fog rather than fibre.
    float facing = abs(dot(normalize(vNormalV), normalize(vViewDir)));
    float rim = pow(1.0 - facing, uPower);

    // Break the halo up with the same noise the fibre normal map is cut from,
    // so it looks like stray filaments rather than an even glow.
    float n = texture2D(uBreakup, vUvF * uRepeat).r;
    rim *= mix(0.35, 1.30, n);

    float alpha = rim * uStrength * uOpacityScale;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

type Props = {
  geometry: BufferGeometry;
  /** Noise texture reused to make the halo uneven. */
  breakup: Texture;
  width?: number;
  strength?: number;
  repeat?: [number, number];
  /** Shares the cone's drive state so the halo thins with the package. */
  drive: { depletion: number };
};

export function FuzzShell({
  geometry,
  breakup,
  width = 0.0055,
  strength = 0.32,
  repeat = [4, 1.7],
  drive,
}: Props) {
  const mesh = useRef<Mesh>(null);

  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: UniformsUtils.merge([
        {
          uWidth: { value: width },
          uColor: { value: new Color('#FFFDF6') },
          uStrength: { value: strength },
          uPower: { value: 3.2 },
          uOpacityScale: { value: 1 },
          uBreakup: { value: null },
          uRepeat: { value: { x: repeat[0], y: repeat[1] } },
        },
      ]),
      transparent: true,
      depthWrite: false,
      // Additive was the obvious choice and the wrong one: over paper white it
      // clips instantly into a hard outline, and where it crossed the contact
      // shadow it erased it. Normal blending keeps this as what it actually
      // is — a soft, uneven extension of the cone's own edge.
      blending: NormalBlending,
      side: FrontSide,
    });
    // width/strength/repeat are read once — they are design constants, not
    // animated values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    material.uniforms.uBreakup.value = breakup;
    material.uniforms.uWidth.value = width;
    material.uniforms.uStrength.value = strength;
    material.uniforms.uRepeat.value = { x: repeat[0], y: repeat[1] };
    material.needsUpdate = true;
  }, [material, breakup, width, strength, repeat]);

  useLayoutEffect(() => {
    mesh.current?.updateMorphTargets();
  }, [geometry]);

  useLayoutEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const m = mesh.current;
    if (!m?.morphTargetInfluences) return;
    m.morphTargetInfluences[0] = drive.depletion;
    // A nearly bare cone has little loose fibre left to catch light.
    material.uniforms.uOpacityScale.value = 1 - drive.depletion * 0.55;
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      renderOrder={2}
      frustumCulled={false}
    />
  );
}
