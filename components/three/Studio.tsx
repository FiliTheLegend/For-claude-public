'use client';

import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { DoubleSide, NormalBlending, ShaderMaterial } from 'three';
import { buildStudioEnvironment } from './env';

/**
 * Studio product lighting: a pre-filtered environment cubemap built from
 * emissive panels at boot.
 *
 * The brief budgeted 400KB for an HDRI. This costs zero bytes over the wire,
 * renders once, and gives exact control over where the key highlight lands on
 * the shoulder of the cone — which matters more here than any real-world
 * capture would.
 */
export function Studio({ intensity = 1 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  const envMap = useMemo(() => buildStudioEnvironment(gl, intensity), [gl, intensity]);

  useEffect(() => {
    scene.environment = envMap;
    return () => {
      scene.environment = null;
      envMap.dispose();
    };
  }, [scene, envMap]);

  return null;
}

/**
 * The ground shadow, in two parts.
 *
 * A straight-down shadow cannot carry this on its own. The cone has a wide
 * flat base sitting directly on the plane, so a shadow projected vertically is
 * exactly the footprint and is entirely hidden underneath the object — which
 * is why the first three passes of this cone appeared to float. What sells it
 * is a real 45° cast shadow thrown out to the lower right the way the key
 * light implies, plus a tight dark seam where the base meets the paper.
 *
 * The seam is one radial-falloff quad rather than drei's ContactShadows,
 * which re-renders the scene into its own target every frame. At this scale
 * the two are indistinguishable and this one is free.
 */
export function ConeShadows({ lite = false, y = 0 }: { lite?: boolean; y?: number }) {
  const contact = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        // Plain alpha blending. Additive with a negative colour looks like it
        // ought to subtract, but fragment outputs are clamped at zero before
        // blending, so it either does nothing or — depending on the blend
        // factors — paints a solid black disc. Ordinary alpha over ink is what
        // a shadow actually is.
        blending: NormalBlending,
        uniforms: { uStrength: { value: 0.34 } },
        vertexShader: /* glsl */ `
          varying vec2 vXy;
          void main() {
            vXy = position.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uStrength;
          varying vec2 vXy;
          void main() {
            // Elliptical, so the seam follows the ellipse the base makes in
            // perspective rather than a circle.
            float d = length(vec2(vXy.x, vXy.y * 1.45));
            float a = 1.0 - smoothstep(0.20, 0.50, d);
            a = pow(a, 1.6) * uStrength;
            if (a < 0.003) discard;
            gl_FragColor = vec4(0.063, 0.086, 0.110, a);
          }
        `,
      }),
    [],
  );

  useEffect(() => () => contact.dispose(), [contact]);

  return (
    <group position={[0, y, 0]}>
      {!lite && (
        <>
          <directionalLight
            castShadow
            position={[-2.05, 3.5, 1.8]}
            intensity={0.9}
            shadow-mapSize={[1024, 1024]}
            shadow-radius={5}
            shadow-blurSamples={12}
            shadow-bias={-0.0012}
            shadow-normalBias={0.012}
            shadow-camera-left={-1.1}
            shadow-camera-right={1.1}
            shadow-camera-top={1.4}
            shadow-camera-bottom={-0.6}
            shadow-camera-near={0.1}
            shadow-camera-far={8}
          />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.0158, 0]} receiveShadow>
            <planeGeometry args={[5, 5]} />
            <shadowMaterial opacity={0.13} color="#10161C" />
          </mesh>
        </>
      )}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.0148, 0]}
        material={contact}
        renderOrder={1}
      >
        <planeGeometry args={[1.7, 1.7]} />
      </mesh>
    </group>
  );
}
