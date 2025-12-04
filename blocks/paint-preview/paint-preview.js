import fetchData from '../../scripts/byom.js';

export default async function decorate(block) {
  const baseSrc = block.dataset.baseImage;
  const maskSrc = block.dataset.maskImage;

  if (!baseSrc || !maskSrc) {
    console.warn("Base or mask image not set");
    return;
  }

  const json = await fetchData('/byom/colors.json');
  const colors = json.data;

  const PAGE_SIZE = 30;
  const VISIBLE = 5;
  let page = 1;

  const canvas = block.querySelector("#room-canvas");
  const ctx = canvas.getContext("2d");

  const imgBase = await loadImage(baseSrc);
  const imgMask = await loadImage(maskSrc);

  canvas.width = imgBase.width;
  canvas.height = imgBase.height;

  ctx.drawImage(imgBase, 0, 0);

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.substring(0,2),16),
      g: parseInt(h.substring(2,4),16),
      b: parseInt(h.substring(4,6),16)
    };
  }

  function recolorWall(hex) {
    const target = hexToRgb(hex);
    const w = canvas.width;
    const h = canvas.height;

    ctx.drawImage(imgBase, 0, 0);
    const baseData = ctx.getImageData(0,0,w,h);
    const maskData = getMaskData();

    for (let i=0;i<baseData.data.length;i+=4){
      const m = maskData[i]/255;
      if(m>0.05){
        baseData.data[i] = blend(baseData.data[i],target.r,m);
        baseData.data[i+1] = blend(baseData.data[i+1],target.g,m);
        baseData.data[i+2] = blend(baseData.data[i+2],target.b,m);
      }
    }
    ctx.putImageData(baseData,0,0);
  }

  function getMaskData() {
    const temp = document.createElement("canvas");
    temp.width = canvas.width;
    temp.height = canvas.height;
    const tctx = temp.getContext("2d");
    tctx.drawImage(imgMask,0,0);
    return tctx.getImageData(0,0,temp.width,temp.height).data;
  }

  function blend(base,target,amt){ return base*(1-amt)+target*amt; }

  const prev = block.querySelector("#bm-prev");
  const next = block.querySelector("#bm-next");
  const colorList = block.querySelector("#bm-colors");
  const pageLabel = block.querySelector("#bm-page");

  function render(){
    colorList.innerHTML="";
    pageLabel.textContent=`Page ${page}`;
    const slice = colors.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).slice(0,VISIBLE);
    slice.forEach(c=>{
      const item=document.createElement("div");
      item.className="bm-color";
      const swatch=document.createElement("div");
      swatch.className = 'bm-swatch';
      swatch.style.background = `#${c.hex}`;
      swatch.addEventListener('click', () => recolorWall(c.hex));
      item.appendChild(swatch);
      const label = document.createElement('span');
      label.textContent = c.name;
      item.appendChild(label);
      colorList.appendChild(item);
    });
  }

  prev.addEventListener('click', () => { if (page > 1) page -= 1; render(); });
  next.addEventListener('click', () => { if ((page * PAGE_SIZE) < colors.length) page += 1; render(); });

  render();
}
