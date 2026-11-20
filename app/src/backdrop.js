// Vice City backdrop, painted in code on a canvas. Deterministic: the same
// seed always paints the same skyline, so an exported cover is reproducible.
// Palettes: Sunset (warm dusk), Neon (electric night), Noir (grey night).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GRADES = {
  sunset: {
    skyTop: '#2b0a4e', skyMid: '#8e1e63', skyLow: '#ff7a3d',
    sun: '#ffd23d', sunCore: '#fff3b0', sea: '#3d0f4d', seaGlow: '#ff9a3d',
    tower: '#1c0626', window: '#ffd23d', palm: '#16041f',
    caption: '#ffffff', captionEdge: '#1c0626', captionShadow: '#ff2e88',
    tagline: '#ffe9a8',
  },
  neon: {
    skyTop: '#05021a', skyMid: '#3b0f7a', skyLow: '#c62bf0',
    sun: '#2de2e6', sunCore: '#d6fbff', sea: '#0a0633', seaGlow: '#2de2e6',
    tower: '#0d0524', window: '#2de2e6', palm: '#05021a',
    caption: '#eafffb', captionEdge: '#12063d', captionShadow: '#ff2e88',
    tagline: '#8ef5ff',
  },
  noir: {
    skyTop: '#0a0a0f', skyMid: '#3a3a44', skyLow: '#8a8a96',
    sun: '#e8e8ee', sunCore: '#ffffff', sea: '#111118', seaGlow: '#9a9aa8',
    tower: '#08080c', window: '#e8e8ee', palm: '#050507',
    caption: '#ffffff', captionEdge: '#000000', captionShadow: '#000000',
    tagline: '#d5d5de',
  },
};

function skyline(ctx, rand, w, h, palette) {
  // A header skyline: towers rise from the top panel's top edge (base) up
  // into the sky strip, so the silhouette reads above the photo panels.
  // Two rows, the nearer one shorter and in front; windows are lit at random.
  const base = h * 0.13;
  const rows = [
    { min: 0.05, max: 0.10, color: palette.tower },
    { min: 0.03, max: 0.07, color: palette.tower },
  ];
  for (const row of rows) {
    let x = 0;
    ctx.fillStyle = row.color;
    while (x < w) {
      const bw = w * (0.05 + rand() * 0.09);
      const bh = h * (row.min + rand() * (row.max - row.min));
      ctx.fillRect(x, base - bh, bw, bh + h * 0.02);
      // Lit windows on this tower.
      const cols = Math.max(1, Math.floor(bw / (w * 0.02)));
      const floors = Math.max(1, Math.floor(bh / (h * 0.035)));
      for (let c = 0; c < cols; c++) {
        for (let f = 0; f < floors; f++) {
          if (rand() < 0.28) {
            ctx.fillStyle = palette.window;
            ctx.globalAlpha = 0.55 + rand() * 0.45;
            ctx.fillRect(
              x + (bw * (c + 0.25)) / cols,
              base - bh + (bh * (f + 0.25)) / floors,
              bw / cols * 0.5,
              bh / floors * 0.45,
            );
            ctx.globalAlpha = 1;
            ctx.fillStyle = row.color;
          }
        }
      }
      x += bw + w * (0.004 + rand() * 0.012);
    }
  }
}

function palmTree(ctx, x, y, s, lean, palette) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = palette.palm;
  ctx.fillStyle = palette.palm;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  // Trunk: a gentle curve.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -55, 2, -110);
  ctx.stroke();
  // Fronds fanning from the crown.
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + (i * 0.13));
    const len = 52 + ((i * 37) % 23);
    const tipX = Math.cos(a) * len;
    const tipY = -110 + Math.sin(a) * len * 0.55;
    ctx.beginPath();
    ctx.moveTo(2, -110);
    ctx.quadraticCurveTo(tipX * 0.55, -110 + Math.sin(a) * len * 0.28 - 14, tipX, tipY);
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(-4, -104, 5, 0, Math.PI * 2);
  ctx.arc(8, -102, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function retroSun(ctx, cx, cy, r, palette) {
  // Disc with horizontal slats cut out of its lower half, retro-poster style.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, palette.sunCore);
  grad.addColorStop(0.55, palette.sun);
  grad.addColorStop(1, palette.skyLow);
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Slats: sky-coloured bars, widening toward the bottom.
  ctx.fillStyle = palette.skyMid;
  let y = cy + r * 0.08;
  let gap = r * 0.035;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.085;
    gap *= 1.45;
  }
  ctx.restore();
}

export function paintBackdrop(ctx, w, h, gradeName, seed = 20261121) {
  const palette = GRADES[gradeName] ?? GRADES.sunset;
  const rand = mulberry32(seed);

  // Sky: the gradient fills the whole cover, so no band is ever unpainted;
  // the sea below overlays its own gradient.
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.66);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(0.55, palette.skyMid);
  sky.addColorStop(1, palette.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun, rising behind the skyline in the top strip: its arc shows above
  // the photo panels, the rest hides behind them.
  const sunR = Math.min(w, h) * 0.09;
  retroSun(ctx, w * 0.5, h * 0.09, sunR, palette);

  // Skyline silhouettes in front of the sun.
  skyline(ctx, rand, w, h, palette);

  // Ocean band with a shimmering sun reflection. The glow holds for the
  // top of the band, so the caption sits on sunset light, not on black.
  const seaTop = h * 0.78;
  const sea = ctx.createLinearGradient(0, seaTop, 0, h);
  sea.addColorStop(0, palette.seaGlow);
  sea.addColorStop(0.35, palette.skyLow);
  sea.addColorStop(0.7, palette.sea);
  sea.addColorStop(1, '#000000');
  ctx.fillStyle = sea;
  ctx.fillRect(0, seaTop, w, h - seaTop);
  ctx.fillStyle = palette.seaGlow;
  for (let i = 0; i < 26; i++) {
    const yy = seaTop + (h - seaTop) * (i / 26) * (i / 26) + 2;
    const spread = w * (0.03 + (i / 26) * 0.22);
    const segW = spread * (0.3 + rand() * 0.7);
    ctx.globalAlpha = 0.75 - (i / 26) * 0.6;
    ctx.fillRect(w * 0.5 - segW / 2 + (rand() - 0.5) * spread * 0.3, yy, segW, Math.max(2, h * 0.004));
  }
  ctx.globalAlpha = 1;

  // Palm silhouettes framing the scene.
  const ps = w / 1080;
  palmTree(ctx, w * 0.045, h * 0.99, ps * 1.15, -0.10, palette);
  palmTree(ctx, w * 0.955, h * 0.99, ps * 1.0, 0.12, palette);
  palmTree(ctx, w * 0.13, h * 0.99, ps * 0.7, 0.08, palette);

  // Vignette to pull the eye to the middle.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  return palette;
}
