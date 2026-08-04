import { Color, Vector3 } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/**
 * A LineMaterial patched into twisted yarn.
 *
 * Line2 gives true world-unit thickness that survives perspective, but out of
 * the box it shades as a flat ribbon — a plastic tube at best. Everything
 * needed to do better is already in the world-units fragment path: `delta` is
 * the offset from the strand axis to the shaded pixel, and `norm` is that
 * offset over the line width. From those two we can reconstruct the cylinder's
 * surface normal and light it properly.
 *
 * On top of that:
 *  - a ply pattern travelling along arc length, so the twist reads and the
 *    strand visibly rotates as it pays off;
 *  - Kajiya-Kay specular, where the highlight is a band around the strand
 *    rather than a point on it. That anisotropy along the fibre axis is the
 *    single thing that separates yarn from wire.
 */
export type ThreadMaterial = LineMaterial & {
  userData: {
    uTwist: { value: number };
    uPly: { value: number };
    uShine: { value: number };
    uSpecStrength: { value: number };
    uLightDir: { value: Vector3 };
    uSpecColor: { value: Color };
    uSheenColor: { value: Color };
  };
};

export function createThreadMaterial(opts: {
  color?: string;
  linewidth?: number;
  /** Ply repeats per world unit of strand. */
  twist?: number;
  opacity?: number;
}): ThreadMaterial {
  const mat = new LineMaterial({
    color: new Color(opts.color ?? '#EAE4D9').getHex(),
    linewidth: opts.linewidth ?? 0.006,
    worldUnits: true,
    alphaToCoverage: true,
    transparent: true,
    opacity: opts.opacity ?? 1,
    dashed: false,
  }) as ThreadMaterial;

  // The thread is the spine of the page and must never be swallowed by the
  // object it comes off. The cone's front face sits well in front of the z=0
  // plane the thread lives on, so depth-testing it would bury the first third
  // of the strand inside the package.
  mat.depthTest = false;
  mat.depthWrite = false;

  const uniforms = {
    uTwist: { value: opts.twist ?? 62 },
    uPly: { value: 0.22 },
    uShine: { value: 34 },
    uSpecStrength: { value: 0.5 },
    // View space. The camera is static, so a constant vector matches the key
    // light in Studio without threading a uniform update through every frame.
    uLightDir: { value: new Vector3(-0.48, 0.66, 0.58).normalize() },
    uSpecColor: { value: new Color('#FFFBF2') },
    uSheenColor: { value: new Color('#FFF6E6') },
  };
  mat.userData = uniforms as ThreadMaterial['userData'];

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    // --- vertex: carry arc length through so the ply can travel ------------
    shader.vertexShader = shader.vertexShader
      .replace(
        'void main() {',
        `
        attribute float instanceDistanceStart;
        attribute float instanceDistanceEnd;
        varying float vArc;
        void main() {
          vArc = ( position.y < 0.5 ) ? instanceDistanceStart : instanceDistanceEnd;
        `,
      );

    // --- fragment ---------------------------------------------------------
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `
        uniform float uTwist;
        uniform float uPly;
        uniform float uShine;
        uniform float uSpecStrength;
        uniform vec3 uLightDir;
        uniform vec3 uSpecColor;
        uniform vec3 uSheenColor;
        varying float vArc;
        void main() {
        `,
      )
      .replace(
        'vec4 diffuseColor = vec4( diffuse, alpha );',
        `
        vec3 shaded = diffuse;

        #ifdef WORLD_UNITS

          vec3 tangentV = normalize( worldEnd - worldStart );
          vec3 viewDirV = normalize( -worldPos.xyz );

          // 0 at the core of the strand, 1 at its silhouette.
          float across = clamp( norm * 2.0, 0.0, 1.0 );

          // Rebuild the cylinder normal: the component we can see sideways is
          // 'across' along the offset direction, the rest faces the camera.
          vec3 side = delta - tangentV * dot( delta, tangentV );
          float sideLen = length( side );
          side = sideLen > 1e-6 ? side / sideLen : viewDirV;
          vec3 nrm = normalize( side * across + viewDirV * sqrt( max( 0.0, 1.0 - across * across ) ) );

          vec3 L = normalize( uLightDir );

          // Kajiya-Kay: sin of the angle between tangent and light/view.
          float tl = dot( tangentV, L );
          float tv = dot( tangentV, viewDirV );
          float sinTL = sqrt( max( 0.0, 1.0 - tl * tl ) );
          float sinTV = sqrt( max( 0.0, 1.0 - tv * tv ) );
          float spec = pow( max( 0.0, sinTL * sinTV - tl * tv ), uShine );

          // Wrapped diffuse — a fibre bundle scatters, so nothing goes black.
          float lambert = dot( nrm, L ) * 0.5 + 0.5;

          // The ply, spiralling along the strand. Offsetting the phase by the
          // across-coordinate is what tilts the bands so they read as a helix
          // rather than as stripes.
          float ply = sin( vArc * uTwist + across * 2.4 ) * 0.5 + 0.5;

          shaded *= 0.74 + 0.26 * lambert;
          shaded *= mix( 1.0 - uPly, 1.0 + uPly * 0.6, ply );
          shaded += uSpecColor * spec * uSpecStrength;

          // Loose fibre lights up at the edge of the strand.
          shaded = mix( shaded, uSheenColor, pow( across, 3.0 ) * 0.4 );

        #endif

        vec4 diffuseColor = vec4( shaded, alpha );
        `,
      );
  };

  // Force a fresh program — onBeforeCompile is keyed on this.
  mat.customProgramCacheKey = () => 'lotus-thread-v1';

  return mat;
}
