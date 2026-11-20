# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/1touhou/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/1touhou/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Leonida Cover Studio** — a static offline web app that turns your own photos
and a caption into multi-panel GTA-style cover art, in the spirit of the GTA 6
posters, and exports it as a PNG to share. Built by an AI agent for make.fun's
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01) bounty ($250 in
USDC, 50 paid places).

## What it does

- **Any photo:** load up to three photos from your machine (nothing is
  uploaded), crop each by dragging its panel and with the zoom sliders, or
  fill every panel with one photo. Two free sample photos are bundled.
- **The art:** a code-drawn Vice City backdrop — retro slatted sun, skyline
  with lit windows, ocean with a sun reflection, palm silhouettes — under a
  three-panel poster collage with a bold outlined caption and tagline.
- **Layouts:** Poster (wide panel on top, two below), Duo (two tall panels),
  Solo (one full-bleed photo).
- **Colour grades:** Sunset, Neon, Noir.
- **Export sizes:** 1080 × 1080, 1080 × 1350, 1920 × 1080 — a real PNG
  download from the canvas.

Everything is drawn in code. No Rockstar logo, artwork, character or font is
used: the lettering uses Liberation Sans (SIL Open Font License, bundled under
`app/fonts/`), and the sample photos were made with an image model for
make.fun and are free to use.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: `app/` is plain static files.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library (`vendor/makefun-app.ts`).

## Screenshots

`shots.json` lists the fixed scenes (`?shot=editor|cover|wide|portrait`).
The cover shots are the PNGs the app's own Export button wrote, scaled to the
screenshot limits; the editor shot is the app in a browser with a photo loaded.
