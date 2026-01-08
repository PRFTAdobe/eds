export default async function decorate(block) {

  const COLORS_URL = 'https://devopsdrops.tech/colorapi/colors.json';
  const PAGE_SIZE = 30;
  const VISIBLE = 5;

  function ensureMarkup() {
    let root = block.querySelector('.paint-room-preview');
    if (!root) {
      root = document.createElement('div');
      root.className = 'paint-room-preview';
      block.appendChild(root);
    }

    let canvas = root.querySelector('#room-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'room-canvas';
      root.appendChild(canvas);
    }

    let controls = root.querySelector('.bm-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'bm-controls';
      controls.innerHTML =
        '<button id="bm-prev">Prev</button><span id="bm-page"></span><button id="bm-next">Next</button>';
      root.appendChild(controls);
    }

    let colors = root.querySelector('#bm-colors');
    if (!colors) {
      colors = document.createElement('div');
      colors.id = 'bm-colors';
      root.appendChild(colors);
    }

    return root;
  }

  const root = ensureMarkup();

  /* ---- FIXED: accept dataset or authored <img data-aue-prop="baseImage"> ---- */
  function findImageFromMarkup(prop) {
    const img = block.querySelector(`img[data-aue-prop="${prop}"]`);
    return img ? img.getAttribute('src') : '';
  }

  const baseImage =
    (block.dataset.baseImage && block.dataset.baseImage.trim()) ||
    (root.dataset.baseImage && root.dataset.baseImage.trim()) ||
    findImageFromMarkup('baseImage') ||
    '';

  const maskImage =
    (block.dataset.maskImage && block.dataset.maskImage.trim()) ||
    (root.dataset.maskImage && root.dataset.maskImage.trim()) ||
    findImageFromMarkup('maskImage') ||
    '';

  if (!baseImage || !maskImage) {
    root.style.minHeight = '160px';
    root.style.padding = '12px';
    root.innerHTML = `
      <div style="border:1px dashed #ddd;padding:12px;border-radius:6px;color:#666;">
        Paint Room Preview: please select/upload <strong>Base Image</strong> and <strong>Mask Image</strong> in the block dialog.
      </div>
    `;
    return;
  }

  const canvas = root.querySelector('#room-canvas');
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) {
    console.error('Canvas 2D not supported.');
    return;
  }

  const prevBtn = root.querySelector('#bm-prev');
  const nextBtn = root.querySelector('#bm-next');
  const pageLabel = root.querySelector('#bm-page');
  const colorsContainer = root.querySelector('#bm-colors');

  root.style.maxWidth = '860px';
  root.style.margin = '12px auto';
  canvas.style.width = '100%';
  canvas.style.display = 'block';
  canvas.style.borderRadius = '6px';
  canvas.style.marginBottom = '12px';
  colorsContainer.style.display = 'flex';
  colorsContainer.style.gap = '10px';
  colorsContainer.style.flexWrap = 'wrap';
  colorsContainer.style.justifyContent = 'center';

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed loading image ${src}`));
      img.src = src;
    });
  }

  let imgBase, imgMask;
  try {
    [imgBase, imgMask] = await Promise.all([
      loadImage(baseImage),
      loadImage(maskImage),
    ]);
  } catch (e) {
    console.error('Failed to load base or mask image:', e);
    root.innerHTML = `<div style="color:#b00">Error loading images for Paint Preview. Check image URLs and CORS.</div>`;
    return;
  }

  canvas.width = imgBase.width;
  canvas.height = imgBase.height;
  ctx.drawImage(imgBase, 0, 0);

  function getMaskData() {
    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    const tctx = temp.getContext('2d');
    tctx.drawImage(imgMask, 0, 0, temp.width, temp.height);
    return tctx.getImageData(0, 0, temp.width, temp.height).data;
  }
  const maskData = getMaskData();

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }
  function blend(base, target, amt) {
    return Math.round(base * (1 - amt) + target * amt);
  }

  function applyPaintHex(hex) {
    const tgt = hexToRgb(hex.startsWith('#') ? hex : `#${hex}`);
    ctx.drawImage(imgBase, 0, 0);
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const maskVal = maskData[i] / 255;
      if (maskVal > 0.03) {
        data[i] = blend(data[i], tgt.r, maskVal);
        data[i + 1] = blend(data[i + 1], tgt.g, maskVal);
        data[i + 2] = blend(data[i + 2], tgt.b, maskVal);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  let page = 1;
  let colors = [];

  async function loadColors(p = 1) {
    try {
      const url = `${COLORS_URL}?page=${p}&pageSize=${PAGE_SIZE}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Colors fetch failed: ${res.status}`);
      const json = await res.json();
      colors = Array.isArray(json.data) ? json.data.slice(0, PAGE_SIZE) : [];
      page = json.page || p;
      return colors;
    } catch (err) {
      console.error('Failed loading colors:', err);
      colors = [];
      return [];
    }
  }

  function renderSwatches() {
    colorsContainer.innerHTML = '';
    pageLabel.textContent = `Page ${page}`;

    const visible = colors.slice(0, VISIBLE);
    if (visible.length === 0) {
      colorsContainer.innerHTML = '<div style="color:#666">No colors available.</div>';
      return;
    }

    visible.forEach((c, idx) => {
      const hex = (c.hex || '').replace('#', '');
      const name = c.name || `Color ${idx + 1}`;
      const sw = document.createElement('button');
      sw.className = 'bm-swatch';
      sw.style.width = '48px';
      sw.style.height = '48px';
      sw.style.borderRadius = '6px';
      sw.style.border = '1px solid #ddd';
      sw.style.cursor = 'pointer';
      sw.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
      sw.style.background = `#${hex}`;
      sw.addEventListener('click', () => applyPaintHex(hex));

      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.fontSize = '12px';
      wrapper.style.color = '#333';
      wrapper.style.minWidth = '64px';
      wrapper.style.gap = '6px';

      const lbl = document.createElement('div');
      lbl.textContent = name;
      lbl.style.maxWidth = '80px';
      lbl.style.overflow = 'hidden';
      lbl.style.textOverflow = 'ellipsis';
      lbl.style.textAlign = 'center';

      wrapper.appendChild(sw);
      wrapper.appendChild(lbl);
      colorsContainer.appendChild(wrapper);
    });
  }

  prevBtn.addEventListener('click', async () => {
    if (page <= 1) return;
    page--;
    await loadColors(page);
    renderSwatches();
  });

  nextBtn.addEventListener('click', async () => {
    page++;
    const loaded = await loadColors(page);
    if (!loaded || loaded.length === 0) {
      page--;
      return;
    }
    renderSwatches();
  });

  await loadColors(page);
  renderSwatches();
  if (colors.length > 0 && colors[0].hex) applyPaintHex(colors[0].hex);
}
