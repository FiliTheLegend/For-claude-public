/**
 * Screenshot harness. Headless Chromium has no GPU here, so WebGL runs on
 * SwiftShader — fine for judging form, lighting and composition, useless for
 * judging framerate.
 *
 * node scripts/shot.mjs <path> <out.png> [width] [height] [waitMs] [scrollTo]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [, , path = '/', out = 'shot.png', w = '1440', h = '900', wait = '3500', scrollTo = '0'] =
  process.argv;

const browser = await chromium.launch({
  // The image ships a pinned Chromium that does not match this Playwright
  // build's expected revision; point at it rather than downloading one.
  executablePath: '/opt/pw-browsers/chromium',
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--disable-lcd-text',
  ],
});

const page = await browser.newPage({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: 2,
});

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(`http://localhost:4173${path}`, { waitUntil: 'networkidle', timeout: 60000 });

if (+scrollTo > 0) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), +scrollTo);
  await page.waitForTimeout(1200);
}

await page.waitForTimeout(+wait);

const full = resolve(process.cwd(), out);
mkdirSync(dirname(full), { recursive: true });
await page.screenshot({ path: full });

if (errors.length) {
  console.log('--- console errors ---');
  errors.slice(0, 12).forEach((e) => console.log(e));
}
console.log(`wrote ${out}`);
await browser.close();
