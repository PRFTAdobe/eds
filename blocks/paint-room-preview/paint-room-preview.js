document.addEventListener('DOMContentLoaded', async () => {
 const block = document.querySelector('.paint-room-preview');
 if (!block) return;

 const baseImageUrl = block.dataset.baseImage;
 const maskImageUrl = block.dataset.maskImage;

 const canvas = document.getElementById('room-canvas');
 const ctx = canvas.getContext('2d');

 const prevBtn = document.getElementById('bm-prev');
 const nextBtn = document.getElementById('bm-next');
 const pageLabel = document.getElementById('bm-page');
 const colorsContainer = document.getElementById('bm-colors');

 let page = 1;
 const pageSize = 30;
 let totalPages = 1;
 let colors = [];

 async function fetchColors() {
  const url = `https://devopsdrops.tech/colorapi/colors.json?page=${page}&pageSize=${pageSize}`;
  const res = await fetch(url);
  const json = await res.json();

  colors = json.data || [];
  totalPages = json.totalPages || 1;
  pageLabel.textContent = `Page ${page} of ${totalPages}`;

  renderColors();
 }

 function renderColors() {
  colorsContainer.innerHTML = '';

  colors.forEach((color) => {
   const swatch = document.createElement('div');
   swatch.style.width = '32px';
   swatch.style.height = '32px';
   swatch.style.borderRadius = '50%';
   swatch.style.cursor = 'pointer';
   swatch.style.border = '1px solid #ddd';
   swatch.style.display = 'inline-block';
   swatch.style.margin = '4px';
   swatch.style.backgroundColor = `#${color.hex}`;

   swatch.addEventListener('click', () => applyColor(`#${color.hex}`));

   colorsContainer.appendChild(swatch);
  });
 }

 async function loadImage(url) {
  return new Promise((resolve) => {
   const img = new Image();
   img.crossOrigin = 'anonymous';
   img.onload = () => resolve(img);
   img.src = url;
  });
 }

 async function initCanvas() {
  if (!baseImageUrl || !maskImageUrl) return;

  const baseImg = await loadImage(baseImageUrl);
  const maskImg = await loadImage(maskImageUrl);

  canvas.width = baseImg.width;
  canvas.height = baseImg.height;

  ctx.drawImage(baseImg, 0, 0);

  canvas.dataset.mask = maskImg.src;
  canvas.dataset.base = baseImg.src;
 }

 async function applyColor(color) {
  const baseImg = await loadImage(canvas.dataset.base);
  const maskImg = await loadImage(canvas.dataset.mask);

  canvas.width = baseImg.width;
  canvas.height = baseImg.height;

  ctx.drawImage(baseImg, 0, 0);

  const temp = document.createElement('canvas');
  temp.width = maskImg.width;
  temp.height = maskImg.height;
  const tctx = temp.getContext('2d');

  tctx.drawImage(maskImg, 0, 0);

  tctx.globalCompositeOperation = 'source-in';
  tctx.fillStyle = color;
  tctx.fillRect(0, 0, temp.width, temp.height);

  ctx.drawImage(temp, 0, 0);
 }

 prevBtn.addEventListener('click', () => {
  if (page > 1) {
   page -= 1;
   fetchColors();
  }
 });

 nextBtn.addEventListener('click', () => {
  if (page < totalPages) {
   page += 1;
   fetchColors();
  }
 });

 await initCanvas();
 await fetchColors();
});