// Cover composition: photo panels over the painted backdrop, bold caption
// lettering, and the colour grade. One function, renderCover, paints a whole
// cover onto any canvas context at any size, so the preview and the export
// are the same drawing.

import { paintBackdrop } from './backdrop.js';

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080 },
  '1080x1350': { w: 1080, h: 1350 },
  '1920x1080': { w: 1920, h: 1080 },
};

// Panel rectangles, as fractions of the cover, per layout and export shape,
// plus the caption band's height fraction. The top strip (above the first
// panel) shows the sky, sun and skyline; the bottom band (below the last
// panel) is the ocean the caption sits on.
// Poster: one wide panel on top, two below. Duo: two tall panels.
// Solo: one panel that fills almost the whole cover.
function panelGeometry(layout, sizeKey) {
  const wide = sizeKey === '1920x1080';
  const tall = sizeKey === '1080x1350';
  if (layout === 'duo') {
    return wide
      ? {
          rects: [
            { x: 0.04, y: 0.13, w: 0.45, h: 0.57 },
            { x: 0.51, y: 0.13, w: 0.45, h: 0.57 },
          ],
          captionY: 0.83,
        }
      : tall
        ? {
            rects: [
              { x: 0.05, y: 0.13, w: 0.43, h: 0.59 },
              { x: 0.52, y: 0.13, w: 0.43, h: 0.59 },
            ],
            captionY: 0.81,
          }
        : {
            rects: [
              { x: 0.05, y: 0.14, w: 0.43, h: 0.62 },
              { x: 0.52, y: 0.14, w: 0.43, h: 0.62 },
            ],
            captionY: 0.87,
          };
  }
  if (layout === 'solo') {
    return wide
      ? { rects: [{ x: 0.04, y: 0.13, w: 0.92, h: 0.57 }], captionY: 0.83 }
      : tall
        ? { rects: [{ x: 0.05, y: 0.13, w: 0.90, h: 0.61 }], captionY: 0.81 }
        : { rects: [{ x: 0.05, y: 0.14, w: 0.90, h: 0.63 }], captionY: 0.87 };
  }
  // Poster.
  if (wide) {
    return {
      rects: [
        { x: 0.04, y: 0.13, w: 0.92, h: 0.35 },
        { x: 0.04, y: 0.52, w: 0.45, h: 0.18 },
        { x: 0.51, y: 0.52, w: 0.45, h: 0.18 },
      ],
      captionY: 0.83,
    };
  }
  if (tall) {
    return {
      rects: [
        { x: 0.05, y: 0.13, w: 0.90, h: 0.33 },
        { x: 0.05, y: 0.49, w: 0.43, h: 0.19 },
        { x: 0.52, y: 0.49, w: 0.43, h: 0.19 },
      ],
      captionY: 0.79,
    };
  }
  return {
    rects: [
      { x: 0.05, y: 0.14, w: 0.90, h: 0.36 },
      { x: 0.05, y: 0.54, w: 0.43, h: 0.24 },
      { x: 0.52, y: 0.54, w: 0.43, h: 0.24 },
    ],
    captionY: 0.87,
  };
}

function panelRects(layout, sizeKey) {
  return panelGeometry(layout, sizeKey).rects;
}

export function layoutPanels(layout, sizeKey) {
  return panelRects(layout, sizeKey);
}

// Cover-fit a photo into a panel, with a pan offset (fractions of the
// overflow, -0.5..0.5) and a zoom multiplier.
function drawPhoto(ctx, img, rect, pan, zoom) {
  const pw = rect.w;
  const ph = rect.h;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const ox = (pw - dw) / 2 + pan.x * Math.max(0, dw - pw);
  const oy = (ph - dh) / 2 + pan.y * Math.max(0, dh - ph);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, pw, ph);
  ctx.clip();
  ctx.drawImage(img, rect.x + ox, rect.y + oy, dw, dh);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `700 ${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `700 ${px}px ${family}`;
  }
  return px;
}

function outlinedText(ctx, text, cx, y, palette, px, family, shadow) {
  ctx.font = `700 ${px}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.shadowColor = shadow ? palette.captionShadow : 'transparent';
  ctx.shadowBlur = px * 0.16;
  ctx.shadowOffsetY = px * 0.05;
  ctx.strokeStyle = palette.captionEdge;
  ctx.lineWidth = Math.max(3, px * 0.10);
  ctx.strokeText(text, cx, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = palette.caption;
  ctx.fillText(text, cx, y);
}

export function renderCover(ctx, w, h, state) {
  const { layout, grade, sizeKey, caption, tagline, photos, pans, zooms, selected } = state;
  const family = '"Liberation Sans", sans-serif';
  const palette = paintBackdrop(ctx, w, h, grade);

  const rects = panelRects(layout, sizeKey);
  const border = Math.max(4, Math.round(w * 0.008));
  rects.forEach((frac, i) => {
    const rect = { x: frac.x * w, y: frac.y * h, w: frac.w * w, h: frac.h * h };
    const img = photos[i];
    if (img) {
      drawPhoto(ctx, img, rect, pans[i], zooms[i]);
    } else {
      // Empty slot: a dark glass panel with a hint, so the cover still reads.
      ctx.fillStyle = 'rgba(10, 4, 20, 0.72)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const px = fitFont(ctx, 'YOUR PHOTO', rect.w * 0.8, Math.round(rect.w * 0.09), family);
      ctx.font = `700 ${px}px ${family}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOUR PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // Poster frame: thick cream border, picked panel gets the pink edge.
    ctx.lineWidth = border;
    ctx.strokeStyle = selected === i ? '#ff2e88' : '#fff6e8';
    ctx.strokeRect(rect.x + border / 2, rect.y + border / 2, rect.w - border, rect.h - border);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = border * 2;
    ctx.shadowOffsetY = border;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + border / 2, rect.y + border / 2, rect.w - border, rect.h - border);
    ctx.restore();
  });

  // Caption band: the words sit on the ocean below the panels, at the
  // height the layout reserves for them.
  const captionText = (caption || '').trim().toUpperCase() || 'VICE CITY NIGHTS';
  const tagText = (tagline || '').trim().toUpperCase();
  const bandY = h * panelGeometry(layout, sizeKey).captionY;
  const maxW = w * 0.92;
  const capPx = fitFont(ctx, captionText, maxW, Math.round(w * 0.085), family);
  outlinedText(ctx, captionText, w / 2, bandY, palette, capPx, family, true);
  if (tagText) {
    const tagPx = fitFont(ctx, tagText, maxW, Math.round(w * 0.032), family);
    ctx.font = `700 ${tagPx}px ${family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = palette.tagline;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = tagPx * 0.2;
    ctx.fillText(tagText, w / 2, bandY + capPx * 0.62 + tagPx);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
}
