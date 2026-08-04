/**
 * Measures what a visitor actually downloads, against the brief's budgets.
 * Point it at a server for the exported `out/` so it measures the shipped
 * artefact rather than the dev build.
 */
import { chromium } from 'playwright';
import { gzipSync } from 'node:zlib';

const url = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const byType = new Map();
const byUrl = [];
page.on('response', async (r) => {
  try {
    const headers = r.headers();
    const body = await r.body();
    // Budgets in the brief are gzipped, and a plain static file server does
    // not compress — so compress here rather than reporting raw bytes and
    // pretending the number means something.
    const len = gzipSync(body, { level: 9 }).length;
    const ct = (headers['content-type'] ?? '').split(';')[0];
    const key = ct.includes('javascript')
      ? 'js'
      : ct.includes('css')
        ? 'css'
        : ct.includes('font')
          ? 'font'
          : ct.startsWith('image/')
            ? 'image'
            : ct.includes('html')
              ? 'html'
              : 'other';
    byType.set(key, (byType.get(key) ?? 0) + len);
    if (key === 'js') byUrl.push([r.url().split('/').pop(), len]);
  } catch {
    /* redirects and aborted requests have no body */
  }
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(6000);

console.log('--- gzipped transfer ---');
let total = 0;
for (const [k, v] of [...byType].sort((a, b) => b[1] - a[1])) {
  console.log(`${k.padEnd(6)} ${(v / 1024).toFixed(1).padStart(8)} KB`);
  total += v;
}
console.log(`${'TOTAL'.padEnd(6)} ${(total / 1024).toFixed(1).padStart(8)} KB`);
console.log('\n--- javascript, by file ---');
for (const [name, len] of byUrl.sort((a, b) => b[1] - a[1])) {
  console.log(`${(len / 1024).toFixed(1).padStart(8)} KB  ${name}`);
}
await browser.close();
