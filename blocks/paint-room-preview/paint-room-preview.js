import { fetchFromApi } from '../../scripts/aem.js';

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

    let nav = root.querySelector('.bm-nav');
    if (!nav) {
      nav = document.createElement('div');
      nav.className = 'bm-nav';
      nav.innerHTML = `
        <button id="bm-prev">Prev</button>
        <div id="bm-colors"></div>
        <button id="bm-next">Next</button>
      `;
      root.appendChild(nav);
    }
    return root;
  }

  const root = ensureMarkup();

  function findImageFromMarkup(prop) {
    const img = block.querySelector(`img[data-aue-prop="${prop}"]`);
    return img ? img.getAttribute('src') : '';
  }

  const baseImage =
    (block.dataset.baseImage?.trim()) ||
    (root.dataset.baseImage?.trim()) ||
    findImageFromMarkup('baseImage') ||
    '';

  const maskImage =
    (block.dataset.maskImage?.trim()) ||
    (root.dataset.maskImage?.trim()) ||
    findImageFromMarkup('maskImage') ||
    '';

  const shadingImage =
    (block.dataset.shadingImage?.trim()) ||
    (root.dataset.shadingImage?.trim()) ||
    findImageFromMarkup('shadingImage') || '';

  if (!baseImage || !maskImage || !shadingImage) {
    root.innerHTML = `
      <div style="border:1px dashed #ddd;padding:12px;border-radius:6px;color:#666;">
        Paint Room Preview requires Base Image, Mask Image, and Shading Image.
      </div>`;
    return;
  }

  const canvas = root.querySelector('#room-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prevBtn = root.querySelector('#bm-prev');
  const nextBtn = root.querySelector('#bm-next');
  const colorsContainer = root.querySelector('#bm-colors');

  canvas.style.width = '100%';
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

  let imgBase, imgMask, imgShade;
  try {
    [imgBase, imgMask, imgShade] = await Promise.all([
      loadImage(baseImage),
      loadImage(maskImage),
      loadImage(shadingImage),
    ]);

    block.querySelectorAll('img[data-aue-prop]').forEach(img => {
      const wrap = img.closest('picture,div') || img;
      wrap.style.display = 'none';
    });

  } catch (e) {
    console.error(e);
    root.innerHTML = `<div style="color:#b00">Error loading images.</div>`;
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

  function getShadeData() {
    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    const tctx = temp.getContext('2d');
    tctx.drawImage(imgShade, 0, 0, temp.width, temp.height);
    return tctx.getImageData(0, 0, temp.width, temp.height).data;
  }
  const shadeData = getShadeData();

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

    // Step 1: reset base
    ctx.drawImage(imgBase, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Step 2: apply flat paint using alpha mask
    for (let i = 0; i < data.length; i += 4) {
      const maskVal = maskData[i] / 255;
      if (maskVal > 0.03) {
        data[i]     = blend(data[i],     tgt.r, maskVal);
        data[i + 1] = blend(data[i + 1], tgt.g, maskVal);
        data[i + 2] = blend(data[i + 2], tgt.b, maskVal);
      }
    }

    // Step 3: multiply wall shading (lighting pass)
    for (let i = 0; i < data.length; i += 4) {
      const maskVal = maskData[i] / 255;
      if (maskVal > 0.03) {
        const shade = shadeData[i] / 255; // grayscale
        data[i]     = Math.round(data[i]     * shade);
        data[i + 1] = Math.round(data[i + 1] * shade);
        data[i + 2] = Math.round(data[i + 2] * shade);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  let apiPage = 1;
  let pageIndex = 0;
  let colors = [];

  async function loadApiPage(p = 1) {
    try {
      const json = await fetchFromApi(COLORS_URL, {
        page: p,
        pageSize: PAGE_SIZE,
      });
      colors = Array.isArray(json.data) ? json.data : [];
      apiPage = json.page || p;
      pageIndex = 0;
    } catch (e) {
      console.error(e);
      colors = [];
    }
  }

  function renderSwatches() {
    colorsContainer.innerHTML = '';
    const start = pageIndex * VISIBLE;
    const slice = colors.slice(start, start + VISIBLE);

    if (slice.length === 0) {
      colorsContainer.innerHTML = `<div>No colors</div>`;
      return;
    }

    slice.forEach((c, idx) => {
      const hex = (c.hex || '').replace('#', '');
      const name = c.name || `Color ${idx+1}`;
      const sw = document.createElement('button');
      sw.style.width = '48px';
      sw.style.height = '48px';
      sw.style.borderRadius = '6px';
      sw.style.border = '1px solid #ddd';
      sw.style.background = `#${hex}`;
      sw.addEventListener('click', () => applyPaintHex(hex));

      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = 'center';
      wrap.style.fontSize = '12px';
      wrap.style.color = '#333';
      wrap.style.minWidth = '64px';
      wrap.style.gap = '4px';

      const lbl = document.createElement('div');
      lbl.textContent = name;
      lbl.style.maxWidth = '72px';
      lbl.style.textOverflow = 'ellipsis';
      lbl.style.overflow = 'hidden';

      wrap.appendChild(sw);
      wrap.appendChild(lbl);
      colorsContainer.appendChild(wrap);
    });
  }

  if (pageIndex < 1) {
      prevBtn.disabled = true;
  }

  prevBtn.addEventListener('click', async () => {
    const maxIndex = Math.floor((colors.length - 1) / VISIBLE);
        
    if (pageIndex > 0) {
      pageIndex--;
      renderSwatches();
      if (pageIndex < 1) {
        prevBtn.disabled = true;
      }
      if (pageIndex < maxIndex) {
        nextBtn.disabled = false;
      }
      return;
    }
    if (apiPage > 1) {
      await loadApiPage(apiPage - 1);
      pageIndex = Math.floor((colors.length - 1) / VISIBLE);
      renderSwatches();
    }
  });

  nextBtn.addEventListener('click', async () => {
    const maxIndex = Math.floor((colors.length - 1) / VISIBLE);
  
    if (pageIndex < maxIndex) {
      pageIndex++;
      if (pageIndex >= 1) {
        prevBtn.disabled = false;
      }
      renderSwatches();
      if (pageIndex === (maxIndex - 1)) {
        nextBtn.disabled = true;
      }
      return;
    }
    await loadApiPage(apiPage + 1);
    if (colors.length > 0) renderSwatches();
  });

  await loadApiPage(apiPage);
  renderSwatches();
  if (colors.length > 0 && colors[0].hex) applyPaintHex(colors[0].hex);
}
