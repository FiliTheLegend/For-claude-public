# Lotus Syndicate

Marketing site for Lotus Syndicate, yarn marketing agents for spinning mills,
Coimbatore. Static export — runs on Vercel and as plain files in a Hostinger
`public_html`.

The site is one shot of yarn unwinding from a cone. A 3D yarn package sits in
the hero, spins in the direction of unwinding as you scroll, pays out a thread
that becomes the vertical spine of every page, and visibly depletes as you
descend. The thread does not break for the whole visit.

---

## Requirements

- Node 20 or newer (developed on 22)
- npm 10 or newer

## Local development

```bash
npm install
npm run dev            # http://localhost:3000
```

There is a design lab at `/lab/cone` for working on the cone in isolation:
sliders for depletion and spin, and query parameters so it can be driven
headlessly (`/lab/cone/?d=0.6&z=2.4&ui=0&rot=0`). It is stripped from the
export at build time and never ships.

## Build

```bash
npm run build          # next build, then postbuild strips /lab from out/
```

Produces a fully static site in `out/`. There is no server component, no API
route and no runtime data fetching.

```bash
npx serve out          # preview the exported site
npm run typecheck
```

## Deploying

**Vercel.** Import the repository. Framework preset: Next.js. Nothing else to
configure — `output: 'export'` is already set and Vercel serves `out/`.

**Hostinger (or any static host).** Run `npm run build`, then upload the
*contents* of `out/` into `public_html/`. `trailingSlash: true` is on, so every
route is a real directory with an `index.html` inside it and no rewrite rules
are needed. Do not upload the `out` folder itself — upload what is inside it.

---

## Generated assets

Two scripts produce assets that live in `public/` and are committed. Re-run
them when the thing they depend on changes.

```bash
npm run textures       # procedural yarn maps — no browser needed
npm run stills         # Static-tier cone still + OG card — needs `npm run dev` up
```

- `scripts/gen-textures.mjs` writes the tiling fibre normal and roughness maps,
  and a plain-weave tile. It contains a small PNG encoder so it has no
  dependencies. Re-run it if you change the winding angle or the fibre look.
- `scripts/gen-still.mjs` screenshots the real scene for the Static tier and
  renders the Open Graph card from the real hero. Re-run it after any change to
  the cone's geometry or lighting, or the still will drift away from the live
  object.

Client-supplied assets drop into `public/assets/` — see `ASSETS.md` for the
manifest and what is still missing.

## Measuring

```bash
npm run build
npx serve out -l 4173
npm run measure -- http://localhost:4173/
```

Reports gzipped transfer by type and per JavaScript file.

Lighthouse, against the same server:

```bash
npx lighthouse http://localhost:4173/ --view
```

To measure the Static tier — no canvas, which is what a low-end device gets —
add `--chrome-flags="--force-prefers-reduced-motion"`. That is the number to
watch on this project: the Full-tier score is dominated by whatever GPU the
machine running the audit has. See `DECISIONS.md` for current results and for
where the payload sits against the brief's budget.

---

## How it is put together

```
app/                 routes; one page per brief slug, plus the design lab
components/three/    the canvas: cone, thread, weave, knot, lighting
components/dom/      site chrome and the DOM-side set pieces
lib/                 scroll store, anchor system, tiering, intro
data/                every fact on the site, typed
scripts/             asset generation and measurement
```

**One canvas.** Fixed, full viewport, `pointer-events: none`, at `z-index: 1`.
DOM sections sit at `z-index: 3` with transparent backgrounds so the thread
shows through; sections that should occlude it get an opaque background, and
`behind` drops a section below the canvas so the thread passes in front.

**Scroll.** Lenis owns scrolling and is the only writer to `lib/scroll.ts`, a
plain mutable singleton. Nothing in the render loop reads `window.scrollY` or
calls `getBoundingClientRect`.

**Anchors.** Elements opt into the thread with `data-thread="<kind>"`:

| kind | behaviour |
|---|---|
| `payoff` | where the paid-out thread first meets the page |
| `pass-left` / `pass-right` | routes down that side of the element |
| `underline` | flattens onto the baseline of a heading, holds, releases |
| `wrap` | one full loop around the element, crossing itself on the way out |
| `split` | forks into two strands, rejoining after |
| `knot` | the footer tie-off |

Rects are read once on mount and on layout change (resize, orientation, fonts
ready, and a `ResizeObserver` on each anchor) and cached in **document**
coordinates. The render loop converts them to screen space with a subtraction.
Resize is debounced at 200ms.

Below 760px the route switches to a compact mode: there is no margin to travel
through at 390px, so the thread becomes a spine down the left edge and keeps
only the stat loops.

**Tiering.** Three tiers, chosen once at boot and downgraded live if the
rolling frame average misses budget over two consecutive 2s windows. Never
upgraded mid-session.

| Tier | Trigger | What runs |
|---|---|---|
| Full | Desktop, ≥4GB, ≥4 cores, WebGL2, fine pointer | Everything |
| Lite | Mobile, coarse pointer, <1024px, low memory/cores | Half-resolution lathe, no real wraps, no fuzz shell, no shadows, DPR 1, 4×3 weave |
| Static | No WebGL2, `prefers-reduced-motion`, or Save-Data | No canvas at all — a still of the cone and a hairline rule |

The tier is decided in `SceneMount`, *before* the dynamic import is rendered,
so the Static tier never downloads the 3D bundle. Deciding it inside `Scene`
looks equivalent and is not — rendering the component is what triggers the
chunk load.

`prefers-reduced-motion: reduce` forces Static and disables Lenis, the
odometers and the journey pin.

**Page transitions.** Internal link clicks are intercepted in the capture
phase: an indigo sheet wipes up, the lotus holds, then the sheet lifts once
`usePathname` reports the new route has committed. Skipped entirely under
reduced motion. The canvas is never touched — it lives in the root layout and
never unmounts, which is what lets the thread persist across routes.

**Stacking.** `<main>` deliberately carries no `z-index`. Giving it one creates
a stacking context that traps every section inside it, so a section asking to
sit *below* the canvas gets stuck above it along with all its siblings.
Sections declare their own layer: `z-[3]` by default, `z-0` via the `behind`
prop where the thread should pass in front (the mills/buyers fork does this).

**Content.** No CMS. Everything is in `data/`, typed. Values the client has not
yet confirmed carry a `TODO: confirm` in the data and render with a visible
"to confirm" marker rather than being quietly asserted.

---

## Accessibility and SEO

- One `<h1>` per page, semantic landmarks, skip link, brass focus rings
- Canvas is `aria-hidden`; nothing in it carries meaning that is not also in
  the DOM
- Fully readable and navigable with JavaScript disabled — the Static tier is
  what the server renders
- Per-page metadata and canonicals, `sitemap.xml`, `robots.txt` (which
  disallows `/lab/`), `LocalBusiness` JSON-LD on the contact page
- Every image has explicit dimensions

## Conventions

- WhatsApp is the primary call to action everywhere, with a context-specific
  prefilled message per page. In Indian textile trade it is the channel people
  actually use.
- Every numeral — count, year, percentage, phone number — is Geist Mono with
  tabular figures.
- Lotus never buys, stocks or owns yarn. Nothing on the site may imply
  otherwise; they are commission agents holding zero inventory, and that
  distinction is the whole business.
