import {
  BackSide,
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  type Texture,
  type WebGLRenderer,
} from 'three';

/**
 * The studio environment, built by hand instead of with drei's <Environment>.
 *
 * Two reasons. The brief budgeted 400KB for an HDRI and this costs zero bytes
 * over the wire — the lighting is geometry, rendered once to a cubemap at
 * boot. And dropping the last drei import takes roughly 50KB gzipped off a
 * bundle that has a hard budget on it and an audience on 4G.
 *
 * What it produces is a pre-filtered PMREM cubemap, exactly what
 * MeshPhysicalMaterial wants for `envMap`, so the cone is lit by a real image
 * rather than by point lights pretending to be a softbox.
 */

type Panel = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  intensity: number;
};

/**
 * Studio product setup. Key upper-left at 45°, a narrow top strip to catch the
 * winding ridges along the shoulder, a warm fill from behind and below for the
 * translucent fibre edge, and a low right kicker so the shadow side does not
 * go dead. No coloured lights beyond a warm/cool bias.
 */
const PANELS: Panel[] = [
  {
    // Key. Kept physically small and close rather than large and enveloping:
    // a huge source wraps around the cone and flattens it.
    position: [-2.05, 3.5, 1.8],
    rotation: [0, -Math.PI / 4, 0],
    scale: [2.6, 3.4, 1],
    color: '#ffffff',
    intensity: 11,
  },
  {
    position: [-0.5, 3.4, 0.5],
    rotation: [Math.PI / 2, 0, 0],
    scale: [0.8, 2.6, 1],
    color: '#fffaf0',
    intensity: 3.2,
  },
  {
    position: [1.7, -0.8, -2.8],
    rotation: [0, Math.PI * 0.82, 0],
    scale: [3.4, 2.6, 1],
    color: '#fff2df',
    intensity: 1.5,
  },
  {
    position: [3.2, 1.0, 0.9],
    rotation: [0, Math.PI / 2.4, 0],
    scale: [2.4, 3.0, 1],
    color: '#f2f5ff',
    intensity: 0.7,
  },
];

/**
 * The room the cone stands in. Deliberately well below paper white — this grey
 * is what the shadow side falls to, and without it there is no modelling at
 * all, just a flat white cutout.
 */
const ROOM = '#9aa1a9';

export function buildStudioEnvironment(
  renderer: WebGLRenderer,
  intensity = 1,
): Texture {
  const scene = new Scene();
  const disposables: { dispose(): void }[] = [];

  const roomGeo = new SphereGeometry(1, 24, 24);
  const roomMat = new MeshBasicMaterial({ color: new Color(ROOM), side: BackSide });
  const room = new Mesh(roomGeo, roomMat);
  room.scale.setScalar(40);
  scene.add(room);
  disposables.push(roomGeo, roomMat);

  const panelGeo = new BoxGeometry(1, 1, 0.02);
  disposables.push(panelGeo);

  for (const p of PANELS) {
    const mat = new MeshBasicMaterial({
      // Emissive light panels must not be tone-mapped on the way into the
      // cubemap; the tone map belongs at the end of the pipeline, not twice.
      color: new Color(p.color).multiplyScalar(p.intensity * intensity),
      toneMapped: false,
    });
    const mesh = new Mesh(panelGeo, mat);
    mesh.position.set(...p.position);
    mesh.rotation.set(...p.rotation);
    mesh.scale.set(...p.scale);
    scene.add(mesh);
    disposables.push(mat);
  }

  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(scene, 0, 0.1, 100);
  const texture = target.texture;

  pmrem.dispose();
  for (const d of disposables) d.dispose();
  scene.clear();

  // The render target itself is kept alive by the returned texture; callers
  // dispose the texture when the scene tears down.
  return texture;
}
