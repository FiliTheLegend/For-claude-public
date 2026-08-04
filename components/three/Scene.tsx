'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { ConeShadows, Studio } from './Studio';
import { YarnCone, createConeDrive } from './YarnCone';
import { Thread } from './Thread';
import { Weave } from './Weave';
import { Knot } from './Knot';
import { scroll, decaySpeed } from '@/lib/scroll';
import { createFrameWatchdog, detectTier, onTierChange, type Tier } from '@/lib/tier';
import { watchPointer } from '@/lib/pointer';
import { coneStage } from '@/lib/coneStage';
import { introConeOffset, startIntro } from '@/lib/intro';

/** Viewport heights over which the cone moves from hero to its parked mark. */
const PARK_OVER = 0.9;

/** Rotation momentum decay after scrolling stops, in seconds. */
const SPIN_DECAY = 0.24;

/** Cone extents in local units, for placing it against viewport edges. */
const CONE_HALF_WIDTH = 0.343;
const CONE_HEIGHT = 1.07;

function ConeGroup({ lite }: { lite: boolean }) {
  const group = useRef<Group>(null);
  const { viewport, size } = useThree();
  const drive = useMemo(() => createConeDrive(), []);
  const payoff = useMemo(() => new Vector3(), []);
  const watchdog = useMemo(() => createFrameWatchdog(), []);
  const spin = useRef(0);
  const shadows = useRef<Group>(null);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    watchdog(rawDt);
    decaySpeed(dt);

    // RPM follows scroll velocity but carries momentum, so the package coasts
    // to a stop instead of freezing the instant the wheel does. The constant
    // idle term is the direction of unwinding.
    const drivenRpm = -(scroll.velocity / 900) - 0.22;
    spin.current += (drivenRpm - spin.current) * (1 - Math.exp(-dt / SPIN_DECAY));
    drive.rotation += spin.current * dt * 2.4;

    drive.depletion = Math.min(1, Math.max(0, scroll.progress * 1.06));
    // Aim the takeoff broadly at the camera and let it wobble with rotation.
    // Letting it sweep a full revolution would send the thread behind the
    // package twice a second, which reads as a glitch rather than as physics.
    drive.payoffAngle = 0.62 + Math.sin(drive.rotation * 0.5) * 0.22;

    const g = group.current;
    if (!g) return;

    const halfH = viewport.height / 2;
    const halfW = (size.width * (viewport.height / size.height)) / 2;
    const stage = coneStage.override;

    if (shadows.current) shadows.current.visible = !stage;

    if (stage) {
      // A page is driving the cone directly — the journey rail does this.
      g.position.set(stage.x * halfW, stage.y * halfH, 0);
      g.scale.setScalar(stage.scale);
      g.rotation.z = stage.tilt;
      return;
    }

    const vhScrolled = scroll.vh > 1 ? scroll.y / scroll.vh : 0;
    const t = Math.min(1, Math.max(0, vhScrolled / PARK_OVER));
    const e = t * t * (3 - 2 * t);

    // Narrow viewports get a smaller cone and a smaller hero offset — at 390px
    // the half-width is a third of what it is at 1440, so any position
    // expressed as a fixed world offset lands somewhere completely different.
    const narrow = size.width < 900;
    const heroScale = narrow ? 0.62 : 1;
    const parkScale = heroScale * (narrow ? 0.34 : 0.4);

    const heroX = (narrow ? 0.34 : 0.30) * halfW;
    const heroY = -0.56 * halfH;

    // Park it into the top corner by measuring the cone, not by guessing an
    // offset: half its width in from the edge, its full height down from the
    // top, plus a margin.
    const parkX = halfW - CONE_HALF_WIDTH * parkScale - 0.055;
    const parkY = halfH - CONE_HEIGHT * parkScale - 0.075;

    const scale = heroScale + (parkScale - heroScale) * e;
    // First load only: the cone descends into frame and settles.
    const { drop, squash } = introConeOffset();
    g.position.set(
      heroX + (parkX - heroX) * e,
      heroY + (parkY - heroY) * e + drop * halfH,
      0,
    );
    g.scale.set(scale / squash, scale * squash, scale / squash);
    g.rotation.z = 0;
  });

  return (
    <>
      <group ref={group}>
        <YarnCone drive={drive} lite={lite} onPayoff={(p) => payoff.copy(p)} />
        {/* No ground shadow while a page is flying the cone along a rail —
            it is not standing on anything, and a cast shadow with no surface
            to land on reads as a stray smudge beside the object. */}
        <group ref={shadows}>
          <ConeShadows lite={lite} />
        </group>
      </group>
      <Thread payoff={payoff} payoffActive={() => true} />
    </>
  );
}

export function Scene() {
  const [tier, setTier] = useState<Tier | null>(null);

  useEffect(() => {
    // Deliberately after paint: DOM content is readable before WebGL is even
    // asked for, and the Static tier never mounts a canvas at all.
    const t = detectTier();
    setTier(t);
    if (t !== 'static') startIntro();
    const off = onTierChange(setTier);
    const stopPointer = watchPointer();
    return () => {
      off();
      stopPointer();
    };
  }, []);

  if (!tier || tier === 'static') return null;
  const lite = tier === 'lite';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{ contain: 'strict' }}
    >
      <Canvas
        camera={{ fov: 35, position: [0, 0, 3.2], near: 0.1, far: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={lite ? 1 : [1, 2]}
        shadows={lite ? false : 'soft'}
      >
        <Suspense fallback={null}>
          {/* Lite keeps the same environment. It renders once to a cubemap at
              boot and costs nothing per frame, and it is the difference
              between the cone reading as yarn and reading as a grey plastic
              bucket — which is what a matcap fallback looked like on a
              phone. */}
          <Studio intensity={lite ? 0.95 : 1} />
          <ConeGroup lite={lite} />
          <Weave lite={lite} />
          <Knot lite={lite} />
        </Suspense>
      </Canvas>
    </div>
  );
}
