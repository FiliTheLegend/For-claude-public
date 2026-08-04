'use client';

/**
 * Pass-1 isolation rig for the cone. Not linked from anywhere and excluded
 * from the sitemap; it exists so the object can be judged on its own before
 * any page is built around it, and so the Static-tier still can be rendered
 * from the real scene rather than faked in an image editor.
 */
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ConeShadows, Studio } from '@/components/three/Studio';
import { YarnCone, createConeDrive } from '@/components/three/YarnCone';

function Rig({
  depletion,
  spin,
  autoRotate,
}: {
  depletion: number;
  spin: number;
  autoRotate: boolean;
}) {
  const drive = useMemo(() => createConeDrive(), []);
  useFrame((_, dt) => {
    drive.depletion = depletion;
    if (autoRotate) drive.rotation += spin * Math.min(dt, 0.05);
    drive.payoffAngle = 0.5;
  });
  return (
    <group position={[0, -0.5, 0]}>
      <YarnCone drive={drive} />
      <ConeShadows />
    </group>
  );
}

export function ConeLab() {
  const [depletion, setDepletion] = useState(0);
  const [spin, setSpin] = useState(0.35);
  const [autoRotate, setAutoRotate] = useState(true);

  const [dolly, setDolly] = useState(3.15);
  const [chrome, setChrome] = useState(true);

  // Query params so the screenshot harness can drive the rig headlessly
  // (?d=0.6&z=1.9&ui=0) instead of poking at DOM sliders.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has('d')) setDepletion(Number(q.get('d')));
    if (q.has('z')) setDolly(Number(q.get('z')));
    if (q.has('spin')) setSpin(Number(q.get('spin')));
    if (q.get('ui') === '0') setChrome(false);
    if (q.get('rot') === '0') setAutoRotate(false);
  }, []);

  return (
    <main style={{ height: '100dvh', width: '100%', position: 'relative', background: '#fff' }}>
      <Canvas
        camera={{ fov: 35, position: [0, 0.28, dolly], near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        shadows="soft"
      >
        <Suspense fallback={null}>
          <Studio />
          <Rig depletion={depletion} spin={spin} autoRotate={autoRotate} />
        </Suspense>
      </Canvas>

      <div
        style={{
          position: 'absolute',
          left: 20,
          bottom: 20,
          display: 'grid',
          gap: 8,
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: 11,
          color: '#10161C',
          background: 'rgba(255,255,255,.8)',
          padding: 12,
          border: '1px solid rgba(16,22,28,.12)',
        }}
        data-lab-ui
        hidden={!chrome}
      >
        <label>
          depletion {depletion.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={depletion}
            onChange={(e) => setDepletion(+e.target.value)}
            style={{ display: 'block', width: 180 }}
          />
        </label>
        <label>
          spin {spin.toFixed(2)}
          <input
            type="range"
            min={0}
            max={6}
            step={0.05}
            value={spin}
            onChange={(e) => setSpin(+e.target.value)}
            style={{ display: 'block', width: 180 }}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(e) => setAutoRotate(e.target.checked)}
          />{' '}
          auto-rotate
        </label>
      </div>
    </main>
  );
}
