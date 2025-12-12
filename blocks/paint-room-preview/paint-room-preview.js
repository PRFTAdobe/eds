// paint-room-preview.js

import fetchData from '/scripts/byom.js';

export default async function decorate(block) {
 // Block root
 const wrapper = block.querySelector('.paint-room-preview');
 if (!wrapper) return;

 /* ---------------------------------------------------
 * 1. ENSURE CHILD ELEMENTS EXIST
 * --------------------------------------------------- */
 let canvas = wrapper.querySelector('#room-canvas');
 if (!canvas) {
  canvas = document.createElement('canvas');
  canvas.id = 'room-canvas';
  wrapper.prepend(canvas);
 }

 let controls = wrapper.querySelector('.bm-controls');
 if (!controls) {
  controls = document.createElement('div');
  controls.className = 'bm-controls';
  controls.innerHTML = `
   <button id="bm-prev">Prev</button>
   <span id="bm-page"></span>
   <button id="bm-next">Next</button>
  `;
  wrapper.append(controls);
 }

 let colorContainer = wrapper.querySelector('#bm-colors');
 if (!colorContainer) {
  colorContainer = document.createElement('div');
  colorContainer.id = 'bm-colors';
  wrapper.append(colorContainer);
 }

 /* ---------------------------------------------------
 * 2. LOAD BASE + MASK IMAGES (FROM AUTHORING)
 * --------------------------------------------------- */
 const base = wrapper.dataset.baseImage;
 const mask = wrapper.dataset.maskImage;

 if (!base || !mask) {
  console.error('Missing base or mask image on block dataset.');
  return;
 }

 const baseImg = new Image();
 const maskImg = new Image();

 const loadImage = (img, src) =>
  new Promise((resolve, reject) => {
   img.onload = resolve;
   img.onerror = reject;
   img.crossOrigin = 'anonymous';
   img.src = src;
  });

 try {
  await Promise.all([loadImage(baseImg, base), loadImage(maskImg, mask)]);
 } catch (e) {
  console.error('Failed to load preview images:', e);
  return;
 }

 /* ---------------------------------------------------
 * 3. DRAW TO CANVAS
 * --------------------------------------------------- */
 const ctx = canvas.getContext('2d');
 canvas.width = baseImg.width;
 canvas.height = baseImg.height;

 const applyColor = (hex) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. draw base
  ctx.drawImage(baseImg, 0, 0);

  // 2. create tint layer
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `#${hex}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. apply mask
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskImg, 0, 0);

  // 4. restore
  ctx.globalCompositeOperation = 'source-over';
 };

 /* ---------------------------------------------------
 * 4. FETCH COLORS FROM YOUR BYOM WORKER (WITH CORS)
 * --------------------------------------------------- */

 // Example for BYOM local overlay path
 const COLORS_PATH = '/colorapi/colors.json?page=1&pageSize=30';

 let colors = [];
 try {
  const payload = await fetchData(COLORS_PATH);
  colors = payload?.data ?? [];
 } catch (err) {
  console.error('Failed to fetch colors:', err);
 }

 if (!colors.length) {
  colorContainer.textContent = 'No colors available.';
  return;
 }

 /* ---------------------------------------------------
 * 5. RENDER COLOR SWATCHES
 * --------------------------------------------------- */
 colorContainer.innerHTML = '';
 colors.forEach((c) => {
  const sw = document.createElement('div');
  sw.className = 'bm-swatch';
  sw.style.width = '24px';
  sw.style.height = '24px';
  sw.style.border = '1px solid #999';
  sw.style.cursor = 'pointer';
  sw.style.background = `#${c.hex}`;
  sw.title = c.name;

  sw.addEventListener('click', () => applyColor(c.hex));

  colorContainer.append(sw);
 });

 /* ---------------------------------------------------
 * 6. OPTIONAL PAGINATION (STATIC 30 FOR NOW)
 * --------------------------------------------------- */
 const prevBtn = controls.querySelector('#bm-prev');
 const nextBtn = controls.querySelector('#bm-next');
 const pageSpan = controls.querySelector('#bm-page');

 pageSpan.textContent = `1 / 1`;

 prevBtn.disabled = true;
 nextBtn.disabled = true;
}