export default async function decorate(block) {
  const root = block.querySelector('.paint-room-preview');
  if (!root) return;

  const baseImage = root.dataset.baseImage;
  const maskImage = root.dataset.maskImage;

  const canvas = root.querySelector('#room-canvas');
  const ctx = canvas.getContext('2d');

  const colorsContainer = root.querySelector('#bm-colors');
  const prevBtn = root.querySelector('#bm-prev');
  const nextBtn = root.querySelector('#bm-next');
  const pageLabel = root.querySelector('#bm-page');

  let page = 1;
  const pageSize = 30;

  async function loadColors() {
    const url = `https://devopsdrops.tech/colorapi/colors.json?page=${page}&pageSize=${pageSize}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }});

    if (!res.ok) {
      console.error('Color API failed:', res.status);
      return { data: [] };
    }

    return await res.json();
  }

  async function renderColors() {
    const json = await loadColors();
    colorsContainer.innerHTML = '';

    (json.data || []).forEach(({ name, hex }) => {
      const swatch = document.createElement('div');
      swatch.className = 'bm-swatch';
      swatch.style.width = '30px';
      swatch.style.height = '30px';
      swatch.style.cursor = 'pointer';
      swatch.style.border = '1px solid #ccc';
      swatch.style.background = `#${hex}`;
      swatch.title = name;

      swatch.addEventListener('click', () => applyPaint(`#${hex}`));
      colorsContainer.appendChild(swatch);
    });

    pageLabel.textContent = `Page ${page}`;
  }

  async function drawBaseAndMask() {
    const base = new Image();
    const mask = new Image();

    base.crossOrigin = 'anonymous';
    mask.crossOrigin = 'anonymous';

    base.src = baseImage;
    mask.src = maskImage;

    await Promise.all([
      base.decode().catch(() => {}),
      mask.decode().catch(() => {}),
    ]);

    canvas.width = base.width;
    canvas.height = base.height;

    ctx.drawImage(base, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  function applyPaint(color) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const base = new Image();
    const mask = new Image();

    base.src = baseImage;
    mask.src = maskImage;

    Promise.all([
      base.decode().catch(() => {}),
      mask.decode().catch(() => {}),
    ]).then(() => {
      ctx.drawImage(base, 0, 0);

      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);

      ctx.globalCompositeOperation = 'source-over';
    });
  }

  prevBtn.addEventListener('click', () => {
    if (page > 1) {
      page--;
      renderColors();
    }
  });

  nextBtn.addEventListener('click', () => {
    page++;
    renderColors();
  });

  await drawBaseAndMask();
  await renderColors();
}