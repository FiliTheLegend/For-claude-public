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
| Site code, routes, prefetches | ~44 KB |
| **Total JavaScript, Full tier** | **354 KB** |
| **Total JavaScript, Static tier** | **~114 KB** |
| Fonts | 267 KB |
| Images, incl. lazy textures | 189 KB |

The Static tier now comes in comfortably under budget, because it no longer
downloads three.js at all — see "what I did about it" below.

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
- **Gated the 3D import behind tier detection.** This was a real bug, caught by
  reading the Lighthouse waterfall: the tier was being decided *inside* Scene,
  so rendering `<Scene />` triggered the chunk load and a Static-tier visitor
  downloaded 674KB of three.js in order for it to return `null`. Precisely the
  visitor who can least afford it. The decision moved up into `SceneMount`, and
  Static-tier performance went from 70 to 85 with total blocking time falling
  from 400ms to 40ms.
- Made the Static-tier still `loading="lazy"`, so the preload scanner stops
  fetching it on capable devices where it is hidden before first paint.

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

## 5. Verification

Lighthouse 12, run against the exported `out/` over a local static server, with
the pinned Chromium in this container. Reproduce with `npm run build`, serve
`out/`, then `npx lighthouse <url>`.

| Page | Accessibility | Best practices | SEO |
|---|---|---|---|
| `/` | 100 | 100 | 100 |
| `/business-concept/` | 100 | 100 | 100 |
| `/our-journey/` | 100 | 100 | 100 |
| `/about-us/` | 100 | 100 | 100 |
| `/for-buyers/` | 100 | 100 | 100 |
| `/contact-us/` | 100 | 100 | 100 |

Two real accessibility defects were found and fixed rather than argued with:

- Every muted grey below 65% of ink failed AA at 11–13px (the worst was 2.24:1).
  The floor is now 65%, and brass got a second token — `--color-brass-deep`,
  #82673A — for type. The brand brass stays #A8874E for rules and the mark,
  where 3:1 is the bar and it passes.
- The stat row's `<dl>` had `<p>` elements inside its `<div>` wrappers, which
  the spec does not allow. The label is now a real `<dt>`, written first for
  reading order and moved below the numeral with flex `order` — which also
  removes the duplicate announcement the previous `sr-only` `<dt>` caused.

### Performance, and what these numbers are worth

| | Full tier | Static tier |
|---|---|---|
| Score | 51 | 85 |
| First contentful paint | 1.1 s | 1.1 s |
| Speed index | 2.9 s | 1.1 s |
| Largest contentful paint | 5.1 s | 4.3 s |
| Total blocking time | 8,320 ms | 40 ms |
| Cumulative layout shift | **0** | **0** |

**Read the Full-tier score with care.** There is no GPU in this container, so
WebGL runs on SwiftShader and every frame the cone draws is rasterised on the
CPU. That is what the 8.3 s of blocking time is. The Static tier — same page,
same bytes, no canvas — blocks for 40 ms, which is the honest measure of what
the site's own JavaScript costs. On real hardware the Full tier's blocking time
should collapse toward the Static figure; I cannot prove by how much from here.

CLS is 0 on both, which was a stated requirement and is hardware-independent.
FCP at 1.1 s under Lighthouse's simulated Slow 4G comfortably clears the
brief's 1.8 s target.

The 95+ Lighthouse target is met on three of four categories. Performance is
not, and will not be on a page with a 3D hero measured this way.

---

## 6. Not yet done

Honest list of what is not finished:

- **The Lite tier's 2D canvas thread** is not built. Lite currently runs the
  same Line2 thread at 120 nodes rather than a flat 2D bezier. It is cheap
  enough that this may well be fine — the cone dominates the frame cost, not
  the strand — but it is not what the brief asked for and it has not been
  profiled on real hardware.
- **Real-device performance is unmeasured.** Everything here was rendered
  through SwiftShader, which is fine for judging form, lighting and composition
  and useless for judging frame rate. The 60fps desktop / 30fps mobile floors
  are unverified. The frame watchdog and tier downgrade are implemented and
  will catch a slow device, but the thresholds want tuning against a real
  ₹12,000 Android.
- **The intro sequence has not been seen end to end.** It is capped at 2.2 s,
  skips on any input, skips entirely if the textures miss a 1.5 s deadline, and
  runs once per session — all of which makes it awkward to capture in a
  screenshot harness. The logic is straightforward and the caps are hard, but I
  have not watched it play.
