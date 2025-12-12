export default async function decorate(block) {
  const root = block.querySelector('.paint-room-preview');
  if (!root) return;

  // Read attributes directly from markup
  const baseImage = root.getAttribute('data-base-image');
  const maskImage = root.getAttribute('data-mask-image');

  // Ensure they are present
  if (!baseImage || !maskImage) {
    console.warn('Missing base or mask image attributes.');
  }

  // Worker API URL
  const COLORS_URL = 'https://devopsdrops.tech/colorapi/colors.json?page=1&pageSize=30';

  // Fetch colors
  let colors = [];
  try {
    const res = await fetch(COLORS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    colors = json.data || [];
  } catch (e) {
    console.error('Color load failed:', e);
  }

  // Inject color swatches
  const colorsContainer = root.querySelector('#bm-colors');
  colorsContainer.innerHTML = '';

  colors.forEach((c) => {
    const swatch = document.createElement('button');
    swatch.className = 'bm-color';
    swatch.style.background = `#${c.hex}`;
    swatch.title = c.name;
    swatch.dataset.hex = c.hex;
    colorsContainer.appendChild(swatch);
  });

  // Canvas painter
  const canvas = root.querySelector('#room-canvas');
  const ctx = canvas.getContext('2d');

  const base = new Image();
  const mask = new Image();

  const loadImage = (img, src) => new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });

  try {
    await loadImage(base, baseImage);
    await loadImage(mask, maskImage);
  } catch (e) {
    console.error('Image load error:', e);
    return;
  }

  // Set canvas size to match base image
  canvas.width = base.width;
  canvas.height = base.height;

  const render = (hex) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);

    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0);

    ctx.globalCompositeOperation = 'source-over';
  };

  // Default first color
  if (colors.length > 0) {
    render(`#${colors[0].hex}`);
  }

  // On color click
  colorsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.bm-color');
    if (!btn) return;
    const hex = btn.dataset.hex;
    render(`#${hex}`);
  });

  // Pagination controls (local only)
  let page = 1;
  const pageEl = root.querySelector('#bm-page');
  const prev = root.querySelector('#bm-prev');
  const next = root.querySelector('#bm-next');

  const updatePageUI = () => {
    pageEl.textContent = `Page ${page}`;
  };
  updatePageUI();

  prev.addEventListener('click', () => {
    if (page > 1) {
      page--;
      updatePageUI();
    }
  });

  next.addEventListener('click', () => {
    if (page < 1) return; // only 1 page for now
    page++;
    updatePageUI();
  });
}