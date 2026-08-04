/**
 * The design lab (/lab/cone) is a working tool, not part of the site. It stays
 * in the repo so the cone can be judged in isolation and the Static-tier still
 * can be re-rendered, but it must not ship: it pulls the whole 3D bundle onto
 * a route with no content on it.
 */
import { rmSync, existsSync } from 'node:fs';

if (existsSync('out/lab')) {
  rmSync('out/lab', { recursive: true, force: true });
  console.log('postbuild: removed out/lab from the export');
}
