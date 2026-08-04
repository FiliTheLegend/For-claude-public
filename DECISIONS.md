# Decisions, deviations and open questions

Everything the brief left open, everything I guessed, and everything where I
did something other than what was asked — with the reason.

---

## 1. Deviations from the brief

### The 320KB JavaScript budget is missed. It is not achievable with this stack.

Current gzipped transfer for `/`, measured against the exported site with
`npm run measure`:

| | gzipped |
|---|---|
| three.js | 167 KB |
| React runtime | 53 KB |
| Next runtime | 45 KB |
| @react-three/fiber | 45 KB |
| Site code, routes, prefetches | ~43 KB |
| **Total JavaScript** | **353 KB** |
| Fonts | 267 KB |
| Images, incl. lazy textures | 189 KB |

The budget is 320KB. three.js alone is 167KB and React plus the Next runtime is
about 98KB — 265KB before a single line of this site or any way to put three.js
on screen. The brief specifies Next 15, React, R3F and three; those four
together cannot fit in 320KB.

What I did about it:

- Removed `@react-three/drei` entirely (−19KB). `Environment`, `Lightformer`,
  `ContactShadows` and `useTexture` are now hand-rolled in
  `components/three/env.ts`, `Studio.tsx` and `useTexture.ts`.
- Removed `maath`, `zustand` and `motion` from the manifest. I hand-rolled the
  damping, the scroll store and the DOM reveals, so none were ever imported —
  leaving them in `package.json` would misstate what the site depends on.
- Dropped the Newsreader `latin-ext` subset (−86KB of font). It covers
  Vietnamese and Eastern European glyphs this site has no use for.
- The whole 3D bundle is dynamically imported and requested only after paint,
  so it never blocks text. The DOM is readable before three.js is fetched.

What would actually get under 320KB, none of which I did because each changes
the brief's own stack decisions: drop React on the 3D path and drive the canvas
from vanilla TypeScript (−98KB); or replace three.js with a hand-written WebGL2
renderer for this one scene (−150KB, and several weeks).

`three/src/…` deep imports do not help here: R3F imports from `three`, so the
whole library is pulled in regardless.

**Flag for you:** this is the one hard number in the brief I could not hit.
Tell me which way you want to trade — accept 353KB, or drop React from the
canvas.

### The thread uses 200 nodes, not the specified 120.

At 120 the frame budget was never the problem — the wrap loops were. A viewport
holding four stat loops plus a heading underline has more curvature than 120
nodes can resolve, and the loops rendered as visible decagons. The extra 80
nodes cost 80 `hypot` calls and about 2KB of buffer upload per frame; Line2's
real cost is fragment work proportional to the strand's screen area, which does
not change. Lite stays at 120.

### The weave interlaces properly instead of using alternating z-offsets.

The brief suggested a per-instance z-offset with alternating sign. That puts a
whole weft either in front of or behind *every* warp, which at the ~12% hold
opacity reads as two flat layers rather than as cloth. Each strand now
undulates in z at the crossing pitch with the phase flipped per row, so every
individual crossing goes over or under correctly. It costs one sine in the
vertex shader and the cloth is still two draw calls.

### No HDRI file. The environment is built from geometry.

The brief budgeted 400KB for `hdri/studio-soft.hdr`. The lighting is instead
four emissive panels and a room sphere rendered once through `PMREMGenerator`
at boot. Zero bytes over the wire, and exact control over where the key
highlight lands on the shoulder — which matters more here than a real capture
would. `Studio.tsx` still produces a genuine pre-filtered environment map, so
the cone is lit by an image, not by point lights pretending to be a softbox.

### ContactShadows alone could not work, so there is also a cast shadow.

The brief specified `<ContactShadows>` as the only thing separating the white
cone from the white page. It cannot do that job here: it renders
orthographically straight down, and the cone has a wide flat base sitting
directly on the plane, so the shadow it produces is exactly the footprint and
is entirely hidden underneath the object. The first three passes of this cone
appeared to float for exactly this reason.

There is now a real 45° cast shadow thrown out to the lower right the way the
key light implies, plus a soft radial seam quad where the base meets the paper
(cheaper than drei's version, which re-renders the scene to its own target
every frame). Blur, opacity and resolution are in the spirit of the brief's
numbers; the geometry of the setup is not.

### Lite keeps the physical material rather than a matcap.

The brief specified a matcap for Lite. I built one — it is still in
`gen-textures.mjs` — and on a phone the cone read as a grey plastic bucket. The
environment cubemap renders once at boot and costs nothing per frame, so Lite
now uses the same `MeshPhysicalMaterial` with `sheen` switched off, which is
where the per-fragment cost actually is. Same silhouette, same winding, a
fraction of the cost, and it still looks like yarn.

---

## 2. Things the brief left open, and how I resolved them

### The cone stays on screen for the whole visit.

"As they descend, the cone visibly depletes" is only true if the visitor can
still see it. So the cone moves from its hero position to a small mark in the
top-right corner over the first viewport height and holds there for the rest of
the page. This also keeps the thread's origin honest — you can always see where
the yarn is coming from — and it means the strand genuinely never breaks.

If you would rather the cone left with the hero, the depletion needs somewhere
else to be legible and the thread needs a different origin.

### The thread's head tracks the cone, not a DOM marker.

The brief's anchor system routes the thread through DOM elements, but the
*first* point has to be the payoff on the cone's shoulder, and the cone's screen
position depends on the viewport. Pinning the head to a percentage-positioned
marker made the yarn leave the package sideways at some breakpoints. The head is
now blended from a free fall out of the actual 3D payoff point into the page
route over the first 16 nodes, so it drops out of the cone under gravity at any
viewport with no per-breakpoint marker to keep in sync.

### The takeoff point does not sweep a full revolution.

Physically, a side-withdrawn package's payoff point rotates with it. Letting it
do so sends the thread behind the cone twice a second, which reads as a glitch
rather than as physics. The takeoff is aimed broadly at the camera with a small
wobble tied to rotation.

### The journey rail takes direct control of the thread.

Its content is pinned, so screen position and document position stop agreeing,
and the anchor cache — built entirely on the assumption that those differ only
by `scrollY` — cannot describe it. Rather than complicate the anchor system for
one page, `/our-journey` sets a thread override directly
(`lib/threadOverride.ts`) and hands back with a blend at both ends.

### The knot is a trefoil.

"Genuinely tied, not a fake loop" — the curve is the trefoil, which is the
mathematical form of an overhand knot with its ends joined, so the strand really
does pass through its own loop. It tightens the honest way too: the radius
shrinks while the tails lengthen.

The lotus the tail draws afterwards is a DOM SVG stroke, not geometry. A
hairline mark at 44px wants to be a crisp vector, and a Line2 at that size would
be neither crisper nor cheaper. It draws on a scroll-driven `animation-timeline`
with an `@supports` fallback that shows the mark immediately — never a
permanently invisible logo.

### `split` renders as a route fork, not two strands.

The homepage mills/buyers fork sets up the fork geometry in the route data but
currently draws the main strand only. A second Line2 for the two halves is
scaffolded (`Route.fork`) and not wired. Flagging it as incomplete rather than
claiming it.

### Journey rail: 6 eras, ~0.85 viewport heights of scroll each.

The brief did not specify pin length. Below 1024px, and under reduced motion,
there is no pin and the eras stack.

### Font sourcing.

Newsreader is self-hosted from a Google Fonts `woff2` (variable on both `opsz`
and `wght`), latin subset only. Geist Sans and Mono come from the `geist` npm
package, which is `next/font/local` under the hood. No runtime request to
`fonts.googleapis.com` from either.

---

## 3. Content I did not invent, and what still needs confirming

Everything on the site comes from `data/`. Nothing was invented. These need a
decision from the client before publish:

- **Principal date ranges.** The brief said the pairings on the old site are not
  reliably readable, so every mill in `data/principals.ts` has `span: null` and
  `spanConfirmed: false`, and the UI renders "dates to confirm" rather than a
  guess. The nine loose ranges from the old site are preserved unpaired in
  `KNOWN_SPANS` so whoever confirms them has the raw material.
- **Current mandates** (Nahar sole agency for Tamil Nadu, Aneesh Textiles,
  Vankar Spinners, SLPS) are marked `confirmed: false` and render with a "to
  confirm" marker.
- **Counts** (30s and 40s CCW) likewise.
- **Journey eras.** The six eras in `data/journey.ts` are assembled from the
  verified history in the brief. The 2005 relocation date for Coimbatore is
  inferred from "trading as M/s. Shri Krishna Agencies 1989–2005. Later expanded
  and relocated to Coimbatore" — the brief does not give a year for the move
  itself. **Confirm before publish.**
- **The "7 mills" stat** counts the principals list. If there were others, the
  number is wrong.

---

## 4. Assets still missing

Placeholders are in place so nothing breaks and the gaps stay obvious:

- `logo/lotus-mark.svg`, `logo/lotus-wordmark.svg` — currently drawn inline in
  `components/dom/LotusMark.tsx` at the right proportions. Swapping in the real
  files should change nothing else.
- `principals/*.png` — the wall renders client names as type. It reads well; if
  the logos are poor quality, consider keeping it.
- `people/*.jpg` — referenced in `data/company.ts`, not yet rendered anywhere.
  The About page is currently type-only.
- `photos/{office,mill,yarn-cones}-*.jpg` — not used yet.

`textures/yarn-fibre-normal.png` was generated rather than supplied (see
`scripts/gen-textures.mjs`). `photos/cone-still.{png,webp}` and
`og/default.png` are rendered from the real scene.

**AVIF is not generated.** Chromium exposes WebP encoding to canvas but not
AVIF, so `gen-still.mjs` emits PNG and WebP only and `<picture>` offers those
two. Add AVIF in the asset pipeline when there is one.

---

## 5. Not yet done

Honest list of what is not finished:

- **Lighthouse has not been run.** There is no Chrome-with-Lighthouse in this
  environment. The structural work is done — static export, no render-blocking
  JS, explicit image dimensions, semantic markup, JSON-LD — but the 95+ score
  across all categories is unverified, and the JS budget above will cost
  performance points on mobile.
- **The Lite tier's 2D canvas thread** is not built. Lite currently runs the
  same Line2 thread at 120 nodes rather than a flat 2D bezier. It is cheap
  enough that this may be fine, but it is not what the brief asked for and it
  has not been profiled on real hardware.
- **`split` fork** — see above.
- **Real-device performance is unmeasured.** Everything here was rendered
  through SwiftShader in a headless container, which is fine for judging form,
  lighting and composition and useless for judging frame rate. The 60fps
  desktop / 30fps mobile floors are unverified. The frame watchdog and tier
  downgrade are implemented and will catch a slow device, but the thresholds
  want tuning against a real ₹12,000 Android.
- **Route transitions** (indigo sheet wipes up, lotus holds 200ms, wipes off)
  are not built. Navigation is currently a plain Next route change; the thread
  persists because the canvas lives in the root layout and never unmounts.
