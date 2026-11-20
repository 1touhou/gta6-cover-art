// Fixed scenes for screenshots, driven by the page URL:
//   ?shot=editor   the editor with a sample photo loaded
//   ?shot=cover    the cover alone, square post size
//   ?shot=wide     the cover alone, wide post size
//   ?shot=portrait the cover alone, portrait post size
// Optional: ?photo=boulevard|pier, ?caption=..., ?grade=sunset|neon|noir,
// ?layout=poster|duo|solo. window.__shotReady is set once the scene is
// painted, so a screenshot script can wait on it.

export async function runShot(shot, query, api) {
  const photo = query.get('photo') ?? 'boulevard';
  const caption = query.get('caption') ?? 'VICE CITY NIGHTS';
  const grade = query.get('grade') ?? 'sunset';
  const layout = query.get('layout') ?? 'poster';

  if (shot === 'cover' || shot === 'wide' || shot === 'portrait') {
    document.body.classList.add('shot-cover');
  }
  if (shot === 'wide') api.setSize('1920x1080');
  if (shot === 'portrait') api.setSize('1080x1350');
  if (shot === 'cover') api.setSize('1080x1080');

  api.setGrade(grade);
  api.setLayout(layout);
  api.setCaption(caption);
  // No photo named: show the sample set, so the cover shows both free
  // sample photos (boulevard in the hero panel, pier beside it).
  if (query.has('photo')) await api.loadSample(photo);
  else await api.loadSampleSet();
  await document.fonts.ready;
  api.paint();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
