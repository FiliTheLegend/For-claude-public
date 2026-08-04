# Asset manifest

Drop client-supplied files at these paths. Anything missing renders a labelled
placeholder or falls back to type, so the build never breaks and the gaps stay
visible.

```
public/assets/
  logo/lotus-mark.svg          MISSING — drawn inline, same proportions
  logo/lotus-wordmark.svg      MISSING — set in Newsreader for now
  principals/nahar.png         MISSING — wall renders client names as type
  principals/oswal.png         MISSING
  principals/vardhman.png      MISSING
  principals/trident.png       MISSING
  principals/suryalakshmi.png  MISSING
  principals/suryavanshi.png   MISSING
  principals/telangana.png     MISSING
  people/kp-agarwal.jpg        MISSING — About page is type-only
  people/alok-agarwal.jpg      MISSING
  people/ashutosh-agarwal.jpg  MISSING
  photos/office-*.jpg          MISSING
  photos/mill-*.jpg            MISSING
  photos/yarn-cones-*.jpg      MISSING

  textures/yarn-fibre-normal.png   GENERATED  npm run textures
  textures/yarn-fibre-rough.png    GENERATED  npm run textures
  textures/yarn-matcap.png         GENERATED  (unused — see DECISIONS.md)
  textures/weave-static.png        GENERATED  npm run textures
  photos/cone-still.png            GENERATED  npm run stills
  photos/cone-still.webp           GENERATED  npm run stills
  og/default.png                   GENERATED  npm run stills

  hdri/studio-soft.hdr             NOT NEEDED — lighting is geometry
```

Never hotlink `assets.zyrosite.com` or Unsplash. Ship AVIF and WebP alongside
any photograph, with explicit `width`/`height` on every `<img>`.
