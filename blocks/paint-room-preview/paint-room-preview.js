export default async function decorate(block) {
 const wrapper = block.querySelector('.paint-room-preview');
 if (!wrapper) return;

 const canvas = wrapper.querySelector('#room-canvas');
 const ctx = canvas.getContext('2d');

 const colorsContainer = wrapper.querySelector('#bm-colors');
 const prevBtn = wrapper.querySelector('#bm-prev');
 const nextBtn = wrapper.querySelector('#bm-next');
 const pageLabel = wrapper.querySelector('#bm-page');

 const baseImgSrc = wrapper.dataset.baseImage;
 const maskImgSrc = wrapper.dataset.maskImage;

 if (!baseImgSrc || !maskImgSrc) {
  console.warn('Missing base or mask image.');
  return;
 }

 const baseImg = new Image();
 const maskImg = new Image();
 baseImg.crossOrigin = 'anonymous';
 maskImg.crossOrigin = 'anonymous';

 await new Promise((resolve) => {
  let loaded = 0;
  const check = () => { if (++loaded === 2) resolve(); };
  baseImg.onload = check;
  maskImg.onload = check;

  baseImg.src = baseImgSrc;
  maskImg.src = maskImgSrc;
 });

 canvas.width = baseImg.width;
 canvas.height = baseImg.height;

 function repaint(hex) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImg, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `#${hex}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskImg, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
 }

 // Fetch Color API
 let currentPage = 1;
 const pageSize = 30;

 async function loadColors(page) {
  const url = `https://devopsdrops.tech/colorapi/colors.json?page=${page}&pageSize=${pageSize}`;
  const res = await fetch(url);
  if (!res.ok) {
   console.error('Color API error');
   return;
  }

  const json = await res.json();
  renderColors(json.data);
  pageLabel.textContent = `Page ${json.page} of ${json.totalPages}`;
 }

 function renderColors(list) {
  colorsContainer.innerHTML = '';
  list.forEach(c => {
   const swatch = document.createElement('button');
   swatch.textContent = c.name;
   swatch.style.background = `#${c.hex}`;
   swatch.style.color = '#000';
   swatch.style.margin = '4px';
   swatch.style.padding = '8px';
   swatch.addEventListener('click', () => repaint(c.hex));
   colorsContainer.appendChild(swatch);
  });
 }

 prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
   currentPage--;
   loadColors(currentPage);
  }
 });

 nextBtn.addEventListener('click', () => {
  currentPage++;
  loadColors(currentPage);
 });

 // Initial load
 repaint('FFFFFF');
 loadColors(currentPage);
}