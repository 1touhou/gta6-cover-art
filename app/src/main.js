// Leonida Cover Studio: wires the editor controls to the cover painter.
// Photos are read on the person's own machine and never leave it.

import { renderCover, layoutPanels, SIZES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');

const state = {
  layout: 'poster',
  grade: 'sunset',
  sizeKey: '1080x1080',
  caption: 'VICE CITY NIGHTS',
  tagline: 'LEONIDA • 2026',
  photos: [null, null, null],
  pans: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
  zooms: [1, 1, 1],
  selected: 0,
};

function paint() {
  const { w, h } = SIZES[state.sizeKey];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  renderCover(ctx, w, h, state);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  state.photos = [img, img, img];
  state.pans = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  paint();
  return img;
}

async function loadSampleSet() {
  // Boulevard in the hero slot, pier beside it, boulevard again below.
  const [a, b] = await Promise.all([
    loadImage('samples/boulevard.jpg'),
    loadImage('samples/pier.jpg'),
  ]);
  state.photos = [a, b, a];
  // The sample photos are portrait/square; in the wide panels cover-fit
  // crops to their middle band. Pan up so the faces show: the hero panel
  // frames the woman's face, the pier panel the fisherman's, the third
  // panel a little less far up.
  state.pans = [{ x: 0, y: 0.45 }, { x: 0, y: 0.4 }, { x: 0, y: 0.2 }];
  paint();
}

function setStatus(text) {
  $('status').textContent = text;
}

// --- Controls -------------------------------------------------------------

function pickButton(group, id) {
  document.querySelectorAll(`[id^="${group}-"]`).forEach((b) => b.classList.remove('picked'));
  $(id).classList.add('picked');
}

for (const layout of ['poster', 'duo', 'solo']) {
  $(`layout-${layout}`).addEventListener('click', () => {
    state.layout = layout;
    pickButton('layout', `layout-${layout}`);
    paint();
  });
}
for (const grade of ['sunset', 'neon', 'noir']) {
  $(`grade-${grade}`).addEventListener('click', () => {
    state.grade = grade;
    pickButton('grade', `grade-${grade}`);
    paint();
  });
}

$('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  paint();
});
$('tagline').addEventListener('input', (e) => {
  state.tagline = e.target.value;
  paint();
});
$('size').addEventListener('change', (e) => {
  state.sizeKey = e.target.value;
  paint();
});

for (let i = 0; i < 3; i++) {
  $(`photo-${i}`).addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      state.photos[i] = await loadImage(url);
      state.pans[i] = { x: 0, y: 0 };
      state.selected = i;
      paint();
      setStatus(`Photo ${i + 1} loaded.`);
    } catch {
      setStatus(`Photo ${i + 1} could not be read.`);
    }
  });
  $(`zoom-${i}`).addEventListener('input', (e) => {
    state.zooms[i] = Number(e.target.value) / 100;
    paint();
  });
}

$('samples').addEventListener('click', async () => {
  await loadSampleSet();
  setStatus('Sample photos loaded.');
});
$('fill-all').addEventListener('click', () => {
  if (!state.photos[0]) return;
  state.photos = [state.photos[0], state.photos[0], state.photos[0]];
  state.pans = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  paint();
  setStatus('All panels now use photo 1.');
});

// --- Drag to pan, click to pick a panel ------------------------------------

let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}
function panelAt(x, y) {
  const { w, h } = SIZES[state.sizeKey];
  return layoutPanels(state.layout, state.sizeKey).findIndex((f) => (
    x >= f.x * w && x <= (f.x + f.w) * w && y >= f.y * h && y <= (f.y + f.h) * h
  ));
}

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = panelAt(p.x, p.y);
  if (i === -1) return;
  canvas.setPointerCapture(e.pointerId);
  drag = { i, x: p.x, y: p.y, moved: 0, pan: { ...state.pans[i] } };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const { w } = SIZES[state.sizeKey];
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  const rect = layoutPanels(state.layout, state.sizeKey)[drag.i];
  const pw = rect.w * w;
  const clamp = (v) => Math.max(-0.5, Math.min(0.5, v));
  state.pans[drag.i] = {
    x: clamp(drag.pan.x + dx / pw),
    y: clamp(drag.pan.y + dy / pw),
  };
  paint();
});
canvas.addEventListener('pointerup', () => {
  if (drag && drag.moved < 4) {
    state.selected = drag.i;
    paint();
  }
  drag = null;
});

// --- Export ----------------------------------------------------------------

$('export').addEventListener('click', async () => {
  const { w, h } = SIZES[state.sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  await document.fonts.ready;
  renderCover(off.getContext('2d'), w, h, state);
  off.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed.');
      return;
    }
    const name = `leonida-cover-${state.sizeKey}.png`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Exported ${name}.`);
  }, 'image/png');
});

// --- Start -----------------------------------------------------------------

const api = {
  setSize(sizeKey) {
    state.sizeKey = sizeKey;
    const sel = $('size');
    if (sel) sel.value = sizeKey;
  },
  setGrade(grade) {
    state.grade = grade;
    pickButton('grade', `grade-${grade}`);
  },
  setLayout(layout) {
    state.layout = layout;
    pickButton('layout', `layout-${layout}`);
  },
  setCaption(caption) {
    state.caption = caption;
    const input = $('caption');
    if (input) input.value = caption;
  },
  loadSample,
  loadSampleSet,
  paint,
};

async function start() {
  try {
    await document.fonts.load('700 100px "Liberation Sans"');
    await document.fonts.load('400 100px "Liberation Sans"');
  } catch {
    // Fall back to the system sans-serif if the bundled font cannot load.
  }
  const query = new URLSearchParams(window.location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, api);
  } else {
    await loadSampleSet();
    paint();
  }
}

start();
