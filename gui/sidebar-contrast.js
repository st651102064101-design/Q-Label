(function () {
  const sidebar = document.getElementById('insertSidebar');
  const frame = document.getElementById('previewFrame');
  if (!sidebar || !frame) return;
  const grip=document.createElement('div');
  grip.setAttribute('role','separator');grip.setAttribute('aria-label','Resize tools sidebar');grip.setAttribute('aria-orientation','vertical');grip.tabIndex=0;
  grip.style.cssText='position:absolute;right:0;top:0;bottom:0;width:8px;z-index:20;cursor:ew-resize;touch-action:none;background:transparent';
  sidebar.append(grip);
  const setWidth=value=>{const max=Math.max(150,Math.min(400,window.innerWidth-320)),width=Math.max(150,Math.min(max,Number(value)||164));sidebar.style.width=width+'px';sidebar.style.minWidth=width+'px';sidebar.style.flexBasis=width+'px';grip.setAttribute('aria-valuenow',String(Math.round(width)));return width;};
  try{setWidth(localStorage.getItem('qlabel-sidebar-width'));}catch{setWidth(164);}
  grip.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();const start=event.clientX,width=sidebar.getBoundingClientRect().width;document.body.classList.add('resize-ew');grip.setPointerCapture(event.pointerId);const move=e=>setWidth(width+e.clientX-start),finish=()=>{document.body.classList.remove('resize-ew');grip.removeEventListener('pointermove',move);try{localStorage.setItem('qlabel-sidebar-width',String(sidebar.getBoundingClientRect().width));}catch{}};grip.addEventListener('pointermove',move);grip.addEventListener('pointerup',finish,{once:true});grip.addEventListener('pointercancel',finish,{once:true});});
  grip.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const width=setWidth(sidebar.getBoundingClientRect().width+(event.key==='ArrowRight'?10:-10));try{localStorage.setItem('qlabel-sidebar-width',String(width));}catch{}});
  window.addEventListener('resize',()=>setWidth(sidebar.getBoundingClientRect().width));
  const iconColors=document.createElement('style');
  iconColors.textContent=`
    #insertSidebar .insert-tool[data-add] > svg { color:#334155; }
    #insertSidebar .insert-tool[data-add="picture"] > svg { color:#2874b9; }
    #insertSidebar .insert-tool[data-add="text"] > svg { color:#2563a6; }
    #insertSidebar .insert-tool[data-add="rectangle"] > svg,
    #insertSidebar .insert-tool[data-add="ellipse"] > svg,
    #insertSidebar .insert-tool[data-add="line"] > svg { color:#7c3aed; }
    #insertSidebar .insert-tool[data-add="barcode"] > svg,
    #insertSidebar .insert-tool[data-add="qrcode"] > svg,
    #insertSidebar .insert-tool[data-add="datamatrix"] > svg { color:#111827; }
    #insertSidebar .source-group[data-group] summary svg { color:#3974a8; stroke:currentColor; }
    #insertSidebar .source-group[data-group="Database Fields"] summary svg,
    #insertSidebar .source-group[data-group="Table Data Fields"] summary svg { color:#138b62; }
    #insertSidebar .source-group[data-group="Time"] summary svg,
    #insertSidebar .source-group[data-group="Date"] summary svg { color:#d27715; }
    #insertSidebar .source-group[data-group="Serial Number"] summary svg { color:#7956bf; }
    #insertSidebar .source-group[data-group="Data Entry Fields"] summary svg { color:#c26b22; }
    #insertSidebar .source-group[data-group="Named Data Sources"] summary svg { color:#ad5491; }
    #insertSidebar .source-group[data-group="Libraries"] summary svg { color:#a87921; }
    #insertSidebar .source-group[data-group="Global Data Fields"] summary svg { color:#168e98; }
    #insertSidebar .source-group[data-group="Object Values"] summary svg { color:#7355b6; }
    #insertSidebar .source-group[data-group="Print Job Fields"] summary svg { color:#2972a5; }
    #insertSidebar .source-group[data-group="External File"] summary svg { color:#b56e24; }
    #insertSidebar .source-group[data-group="Script / Expressions"] summary svg { color:#b15862; }
  `;
  document.head.append(iconColors);
  let raster, pixels, paper, timer, generation = 0, updateFrame = 0;
  function update() {
    if (updateFrame) return;
    updateFrame = requestAnimationFrame(() => {
      updateFrame = 0;
      updateNow();
    });
  }
  function updateNow() {
    const bounds = paper?.getBoundingClientRect();
    const width = raster?.width || 0, height = raster?.height || 0;
    sidebar.querySelectorAll('.insert-tool,.insert-sidebar-title,.source-group summary,.source-item,.source-empty').forEach(item => {
      const rect = item.getBoundingClientRect();
      let light = 0, count = 0;
      for (const fx of [.25, .5, .75]) for (const fy of [.35, .65]) {
        const x = rect.left + rect.width * fx, y = rect.top + rect.height * fy;
        let luminance = .28;
        if (bounds && x >= bounds.left && x < bounds.right && y >= bounds.top && y < bounds.bottom) {
          luminance = 1;
          if (pixels && width && height && bounds.width && bounds.height) {
            const px = Math.min(width - 1, Math.floor((x - bounds.left) / bounds.width * width));
            const py = Math.min(height - 1, Math.floor((y - bounds.top) / bounds.height * height));
            const offset = (py * width + px) * 4;
            luminance = (.2126*pixels[offset]+.7152*pixels[offset+1]+.0722*pixels[offset+2])/255;
          }
        }
        light += luminance; count++;
      }
      const ink = light/count > .55 ? '#111827' : '#ffffff';
      if (item.style.getPropertyValue('--sidebar-ink') !== ink) item.style.setProperty('--sidebar-ink', ink);
    });
  }
  function render() {
    if (frame.querySelector('svg.is-object-moving')) return;
    const id = ++generation;
    paper = frame.querySelector('.canvaswrap svg');
    raster = null; pixels = null; update();
    if (!paper) return;
    const copy = paper.cloneNode(true), box = paper.viewBox.baseVal;
    const width = 700, height = Math.max(1, Math.min(1400, Math.round(width*box.height/box.width)));
    copy.setAttribute('width', width); copy.setAttribute('height', height);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], {type:'image/svg+xml'}));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (id !== generation) return;
      raster = document.createElement('canvas'); raster.width=width; raster.height=height;
      const ctx=raster.getContext('2d'); ctx.fillStyle='white'; ctx.fillRect(0,0,width,height); ctx.drawImage(img,0,0,width,height);
      pixels = ctx.getImageData(0, 0, width, height).data;
      update();
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src=url;
  }
  const schedule = () => { clearTimeout(timer); if (frame.querySelector('svg.is-object-moving')) return; timer=setTimeout(render,80); };
  new MutationObserver(schedule).observe(frame,{childList:true,subtree:true,attributes:true,attributeFilter:['viewBox','transform','x','y','width','height']});
  frame.addEventListener('scroll', update); sidebar.addEventListener('scroll', update);
  new ResizeObserver(schedule).observe(frame);
  new MutationObserver(update).observe(sidebar,{childList:true,subtree:true});
  render();
})();
