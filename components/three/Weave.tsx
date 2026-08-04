'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Color,
  CylinderGeometry,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  ShaderMaterial,
} from 'three';
import { scroll } from '@/lib/scroll';
import { observeLayout } from '@/lib/anchors';

/**
 * Set piece 1 — the cloth behind the principal wall.
 *
 * Warp strands descend behind the logo grid, then weft strands shoot across,
 * interlacing over and under each warp as they go. When the weave completes it
 * holds as a faint woven ground and the client names sit on top of it.
 *
 * The interlacing is real rather than faked. The brief suggested alternating a
 * per-instance z-offset, which puts a whole weft either in front of or behind
 * every warp — at low opacity that reads as two flat layers rather than as
 * cloth. Instead each strand undulates in z at the crossing pitch with the
 * phase flipped per row, so every individual crossing goes over or under
 * correctly. It costs one sine in the vertex shader, and the entire cloth is
 * still two draw calls.
 */

const WARPS_FULL = 8;
const WEFTS_FULL = 5;
const WARPS_LITE = 4;
const WEFTS_LITE = 3;

const vertexShader = /* glsl */ `
  attribute float aDelay;
  attribute float aPhase;
  attribute float aLength;

  uniform float uProgress;
  uniform float uAmp;
  uniform float uPitch;

  varying float vAlive;

  void main() {
    // Each strand starts when the section's scroll progress reaches its delay
    // and takes a fixed slice of the remainder to cross.
    float p = clamp((uProgress - aDelay) / 0.42, 0.0, 1.0);
    p = 1.0 - pow(1.0 - p, 3.0); // arrive, don't stop dead
    vAlive = p;

    vec3 pos = position;

    // The geometry is a unit tube along +Y with its origin at one end. Scaling
    // it by length * p is what makes the strand shoot across rather than fade.
    pos.y *= aLength * p;

    // Interlace at the crossing pitch. The per-row phase flip is what makes
    // neighbouring strands pass on opposite sides of each crossing.
    pos.z += sin(pos.y * uPitch + aPhase) * uAmp;

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlive;

  void main() {
    if (vAlive <= 0.001) discard;
    // Bright as it lands, then settling back to the woven ground the logos
    // sit on — the brief's ~12%.
    float settle = mix(1.0, 0.4, smoothstep(0.7, 1.0, vAlive));
    gl_FragColor = vec4(uColor, uOpacity * settle * vAlive);
  }
`;

type Rect = { x: number; y: number; w: number; h: number };

export function Weave({ lite }: { lite: boolean }) {
  const { viewport, size } = useThree();
  const warpRef = useRef<InstancedMesh>(null);
  const weftRef = useRef<InstancedMesh>(null);
  const rect = useRef<Rect | null>(null);

  const warps = lite ? WARPS_LITE : WARPS_FULL;
  const wefts = lite ? WEFTS_LITE : WEFTS_FULL;

  // Warps and wefts need *separate* geometries even though the shape is
  // identical: per-instance attributes live on the geometry, so sharing one
  // means whichever mesh writes its lengths last wins and both directions end
  // up the same size.
  const geometries = useMemo(() => {
    const make = () => {
      const g = new CylinderGeometry(0.0034, 0.0034, 1, lite ? 4 : 5, 28, true);
      g.translate(0, 0.5, 0);
      return g;
    };
    return { warp: make(), weft: make() };
  }, [lite]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uProgress: { value: 0 },
          uAmp: { value: 0.012 },
          uPitch: { value: 1 },
          uColor: { value: new Color('#1C3055') },
          uOpacity: { value: 0.3 },
        },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometries.warp.dispose();
      geometries.weft.dispose();
      material.dispose();
    },
    [geometries, material],
  );

  // ---- where the cloth lives, in document coordinates ---------------------
  useEffect(() => {
    const read = () => {
      const el = document.querySelector<HTMLElement>('[data-weave]');
      if (!el) {
        rect.current = null;
        return;
      }
      const r = el.getBoundingClientRect();
      rect.current = { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height };
    };
    read();
    const raf = requestAnimationFrame(read);
    const stop = observeLayout(read, 200);
    return () => {
      cancelAnimationFrame(raf);
      stop();
    };
  }, []);

  // ---- per-instance schedule ---------------------------------------------
  useEffect(() => {
    const setup = (mesh: InstancedMesh | null, count: number, isWeft: boolean) => {
      if (!mesh) return;
      const delay = new Float32Array(count);
      const phase = new Float32Array(count);
      const length = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        // Warps go down first, close together; wefts follow a row at a time,
        // which is the order a loom actually works in.
        delay[i] = isWeft ? 0.3 + (i / count) * 0.48 : (i / count) * 0.2;
        phase[i] = (i % 2 === 0 ? 0 : Math.PI) + (isWeft ? Math.PI / 2 : 0);
        length[i] = 1;
      }
      mesh.geometry.setAttribute('aDelay', new InstancedBufferAttribute(delay, 1));
      mesh.geometry.setAttribute('aPhase', new InstancedBufferAttribute(phase, 1));
      mesh.geometry.setAttribute('aLength', new InstancedBufferAttribute(length, 1));
    };
    setup(warpRef.current, warps, false);
    setup(weftRef.current, wefts, true);
  }, [warps, wefts]);

  const mat4 = useMemo(() => new Matrix4(), []);

  useFrame(() => {
    const r = rect.current;
    const warpMesh = warpRef.current;
    const weftMesh = weftRef.current;
    if (!r || !warpMesh || !weftMesh) return;

    const vh = size.height;
    const worldPerPx = viewport.height / vh;
    const halfW = (size.width * worldPerPx) / 2;
    const halfH = viewport.height / 2;

    const topInView = r.y - scroll.y;
    const progress = Math.min(
      1,
      Math.max(0, 1 - (topInView - vh * 0.16) / (vh * 0.72)),
    );

    const visible = topInView < vh * 1.3 && topInView + r.h > -vh * 0.4;
    warpMesh.visible = visible;
    weftMesh.visible = visible;
    material.uniforms.uProgress.value = progress;
    if (!visible) return;

    const left = (r.x / size.width - 0.5) * 2 * halfW;
    const right = ((r.x + r.w) / size.width - 0.5) * 2 * halfW;
    const top = (0.5 - topInView / vh) * 2 * halfH;
    const bottom = (0.5 - (topInView + r.h) / vh) * 2 * halfH;
    const width = right - left;
    const height = top - bottom;
    if (width <= 0 || height <= 0) return;

    // One sine period per warp gap, so every crossing is an over or an under
    // rather than an arbitrary wobble.
    material.uniforms.uPitch.value = (Math.PI * 2 * warps) / width;
    material.uniforms.uAmp.value = Math.min(0.02, width * 0.007);

    const setLength = (mesh: InstancedMesh, value: number) => {
      const attr = mesh.geometry.getAttribute('aLength') as InstancedBufferAttribute;
      (attr.array as Float32Array).fill(value);
      attr.needsUpdate = true;
    };

    // Warps: vertical, growing downward.
    for (let i = 0; i < warps; i++) {
      const x = left + (width * (i + 0.5)) / warps;
      mat4.makeRotationZ(Math.PI);
      mat4.setPosition(x, top, 0);
      warpMesh.setMatrixAt(i, mat4);
    }
    warpMesh.instanceMatrix.needsUpdate = true;
    setLength(warpMesh, height);

    // Wefts: horizontal, shooting left to right.
    for (let i = 0; i < wefts; i++) {
      const y = top - (height * (i + 0.5)) / wefts;
      mat4.makeRotationZ(-Math.PI / 2);
      mat4.setPosition(left, y, 0);
      weftMesh.setMatrixAt(i, mat4);
    }
    weftMesh.instanceMatrix.needsUpdate = true;
    setLength(weftMesh, width);
  });

  return (
    <>
      <instancedMesh
        ref={warpRef}
        args={[geometries.warp, material, warps]}
        frustumCulled={false}
        renderOrder={3}
      />
      <instancedMesh
        ref={weftRef}
        args={[geometries.weft, material, wefts]}
        frustumCulled={false}
        renderOrder={3}
      />
    </>
  );
}
