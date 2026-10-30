(function () {
  'use strict';

  const frame = document.getElementById('previewFrame');
  if (!frame) return;

  const menu = document.createElement('div');
  menu.className = 'object-context-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Object actions');
  menu.hidden = true;
  document.body.append(menu);

  const style = document.createElement('style');
  style.textContent = '.object-context-menu{position:fixed;z-index:2147483646;width:300px;padding:7px;margin:0;background:var(--card,#fff);color:var(--text,#1f2937);border:1px solid var(--border,#d4dbe5);border-radius:10px;box-shadow:0 14px 38px #10182835;font:13px/1.35 "Segoe UI",sans-serif;user-select:none}.object-context-menu[hidden]{display:none!important}.object-context-menu:popover-open{display:block!important}.object-context-menu .ocm-heading{padding:5px 10px 7px;color:var(--muted,#667085);font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}.object-context-menu button{box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:34px;padding:6px 10px;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer}.object-context-menu button:hover,.object-context-menu button:focus-visible{background:color-mix(in srgb,var(--accent,#16a34a) 11%,var(--card,#fff));outline:0}.object-context-menu button:disabled{opacity:.42;cursor:default}.object-context-menu button:disabled:hover{background:transparent}.object-context-menu .ocm-icon{display:grid;place-items:center;width:18px;height:18px;color:var(--muted,#667085);font-size:15px}.object-context-menu .ocm-label{flex:1}.object-context-menu .ocm-shortcut{color:var(--muted,#667085);font-size:11px}.object-context-menu .ocm-divider{height:1px;margin:5px 4px;background:var(--border,#e4e7ec)}.object-context-menu .ocm-danger{color:#b42318}.object-context-menu .ocm-danger .ocm-icon{color:#b42318}.ocm-tabs[hidden],.ocm-tabs button[hidden]{display:none!important}.ocm-tabs{display:flex;gap:3px;padding:3px;border-bottom:1px solid var(--border,#e4e7ec)}.ocm-tabs button{justify-content:center;min-height:30px;padding:5px 12px;color:var(--muted,#667085);font-weight:600}.ocm-tabs button[aria-selected=true]{background:color-mix(in srgb,var(--accent,#16a34a) 10%,var(--card,#fff));color:var(--accent,#15803d)}.ocm-insert-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;max-height:158px;overflow:auto;overscroll-behavior:contain;padding:7px 3px 3px;scrollbar-width:thin;scrollbar-color:#94a3b8 transparent}.ocm-insert-card{display:flex!important;flex-direction:column;justify-content:center;gap:4px!important;min-width:0;height:70px;padding:5px!important;border:1px solid var(--border,#e4e7ec)!important;border-radius:7px!important;text-align:center!important;font-size:11px!important}.ocm-insert-card svg{width:22px;height:22px;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.ocm-insert-card span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ocm-pane[hidden]{display:none!important}@media(max-width:520px){.object-context-menu{width:min(300px,calc(100vw - 16px))}}';
  style.textContent+='.object-context-menu{max-height:calc(100vh - 16px);overflow:auto}.object-context-menu .ocm-icon svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.object-context-menu .ocm-icon svg.ribbon-color-icon,.ocm-insert-card svg.ribbon-color-icon{stroke:none}.object-context-menu .ocm-icon svg.ribbon-color-icon{width:18px;height:18px}.ocm-insert-card svg.ribbon-color-icon{width:22px;height:22px}';document.head.append(style);

  const groups = [
    [['Cut', 'cut', 'Ctrl+X', () => copySelectedElement(true)], ['Copy', 'copy', 'Ctrl+C', () => copySelectedElement()], ['Paste', 'paste', 'Ctrl+V', () => pasteElement(contextPastePoint)], ['Duplicate', 'duplicate', 'Ctrl+D', () => duplicateSelectedElement()]],
    [['Layer', 'layers', '', () => window.LayerManager?.show()]],
    [['Delete', 'delete', 'Del', () => deleteSelectedElement(), 'danger']],
    [['Edit', 'edit', 'Enter', () => editSelected()]],
    [['Properties…', 'properties', 'Alt+Enter', () => {const indices=selectedIndices();if(indices.length)window.openObjectProperties(indices[0]);}]],
    [['Export label image…', 'export-image', '', () => document.getElementById('exportPngBtn')?.click()]],
  ];
  let contextPastePoint=null;
  const labelGroups=[
    [['Paste','paste','Ctrl+V',()=>pasteElement(contextPastePoint)],['Paste Unformatted','paste-text','',()=>{const text=(elementClipboard||[]).filter(e=>e.type==='text').map(e=>e.text||'').join('\n');if(text)insertEditorElement('text',contextPastePoint,text);} ],['Select All','select','Ctrl+A',()=>{editorSelection=new Set(editing.elements.map((_,i)=>i));editorSel=editing.elements.length-1;renderEditorElements();drawEditorCanvas();}]],
    [['Zoom In','zoom-in','',()=>setPreviewZoom(previewZoomTarget*1.2)],['Zoom Out','zoom-out','',()=>setPreviewZoom(previewZoomTarget/1.2)],['Zoom to Rectangle','zoom-rectangle','',zoomRectangle],['Fit Template in Window','fit','',fitPreviewPage],['Fit Template Width in Window','fit-width','',()=>{const svg=frame.querySelector('.canvaswrap>svg');if(svg)setPreviewZoom(previewZoom*(frame.clientWidth-36)/svg.getBoundingClientRect().width);} ],['Fit All Objects in Window','fit-objects','',fitObjects]],
    [['Ruler and Grid Settings…','grid','',()=>document.querySelector('.edbar button[title="Preview Settings"]')?.click()]],
    [['Page Setup…','page','',()=>document.getElementById('pageSetupOpen')?.click()],['Add Template Image…','image','',()=>document.getElementById('backgroundBtn')?.click()]]
  ];
  const icons={"reset":"<path d=\"M4 10a8 8 0 1 1 1 8M4 4v6h6\"/>","remove-background":"<path d=\"m5 14 8-10 8 6-8 10H9l-4-4v-2ZM10 8l8 6M13 20h9\"/><path d=\"M2 3h4M2 7h2M2 21h3\" stroke-dasharray=\"1 2\"/>","paste-text":"<rect x=\"5\" y=\"5\" width=\"14\" height=\"16\" rx=\"1\"/><path d=\"M9 5V3h6v2M8 10h8M12 10v8M10 18h4\"/>","zoom-rectangle":"<rect x=\"2\" y=\"2\" width=\"15\" height=\"15\" stroke-dasharray=\"3 2\"/><circle cx=\"10\" cy=\"10\" r=\"4\"/><path d=\"m13 13 8 8M8 10h4M10 8v4\"/>","cut":"<circle cx=\"6\" cy=\"6\" r=\"3\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><path d=\"m8.2 8.2 12 12M8.2 15.8 20 4\"/>","copy":"<path d=\"M8 7V3h10l3 3v11h-4M18 3v4h3\"/><rect x=\"3\" y=\"8\" width=\"13\" height=\"13\" rx=\"1.5\"/><path d=\"M6 12h7M6 16h7\"/>","duplicate":"<rect x=\"3\" y=\"7\" width=\"13\" height=\"14\" rx=\"1.5\"/><path d=\"M8 7V3h13v14h-5M6 14h7M9.5 10.5v7\"/>","delete":"<path d=\"M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7\"/>","edit":"<path d=\"m4 16-1 5 5-1L21 7l-4-4L4 16ZM14 6l4 4M4 16l4 4\"/>","layers":"<path d=\"m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5\"/>","properties":"<path d=\"M4 5h16M4 12h16M4 19h16\"/><rect x=\"7\" y=\"3\" width=\"4\" height=\"4\" rx=\"1\"/><rect x=\"14\" y=\"10\" width=\"4\" height=\"4\" rx=\"1\"/><rect x=\"6\" y=\"17\" width=\"4\" height=\"4\" rx=\"1\"/>","export-image":"<rect x=\"2\" y=\"3\" width=\"15\" height=\"17\" rx=\"1\"/><circle cx=\"6\" cy=\"7\" r=\"1.5\"/><path d=\"m3 16 4-5 4 4 2-2M13 12h9m-3-3 3 3-3 3\"/>",'fit-width':'<path d="M3 4v16M21 4v16M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3"/>','fit-objects':'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/><rect x="7" y="7" width="6" height="6"/><circle cx="16" cy="16" r="3"/>',paste:'<rect x="6" y="5" width="13" height="16" rx="1"/><path d="M9 5V3h7v2M9 10h7M9 14h7"/>',select:'<rect x="3" y="3" width="18" height="18" stroke-dasharray="3 2"/>',export:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',fit:'<rect x="5" y="3" width="14" height="18"/><path d="M8 8V6h3m5 10v2h-3"/>',grid:'<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',page:'<path d="M5 3h9l5 5v13H5zM14 3v5h5M8 12h8M8 16h8"/>',image:'<rect x="3" y="4" width="18" height="16"/><circle cx="8" cy="9" r="2"/><path d="m3 17 6-5 4 4 4-6 4 7"/>'};
  function fitObjects(){const svg=frame.querySelector('.canvaswrap>svg'),boxes=window.LabelPreview.computeBoxes(editing,sampleData(editing));if(!svg||!boxes.length)return;const view=svg.viewBox.baseVal,rect=svg.getBoundingClientRect();const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y)),w=Math.max(...boxes.map(b=>b.x+b.w))-x,h=Math.max(...boxes.map(b=>b.y+b.h))-y;if(w>0&&h>0)setPreviewZoom(previewZoom*Math.min((frame.clientWidth-36)/(w/view.width*rect.width),(frame.clientHeight-36)/(h/view.height*rect.height)),rect.left+(x+w/2-view.x)/view.width*rect.width,rect.top+(y+h/2-view.y)/view.height*rect.height);}
  function zoomRectangle(){const box=document.createElement('div');box.style.cssText='position:fixed;border:1px solid #16a34a;background:#16a34a22;pointer-events:none;z-index:20001';let start=null;const down=e=>{if(e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();start={x:e.clientX,y:e.clientY};document.body.append(box);};const move=e=>{if(!start)return;box.style.left=Math.min(start.x,e.clientX)+'px';box.style.top=Math.min(start.y,e.clientY)+'px';box.style.width=Math.abs(e.clientX-start.x)+'px';box.style.height=Math.abs(e.clientY-start.y)+'px';};const clean=()=>{frame.removeEventListener('pointerdown',down,true);document.removeEventListener('pointermove',move,true);document.removeEventListener('pointerup',up,true);document.removeEventListener('keydown',escape,true);frame.style.cursor='';box.remove();};const up=e=>{if(!start)return;const w=Math.abs(e.clientX-start.x),h=Math.abs(e.clientY-start.y);if(w>8&&h>8)setPreviewZoom(previewZoom*Math.min((frame.clientWidth-36)/w,(frame.clientHeight-36)/h),(start.x+e.clientX)/2,(start.y+e.clientY)/2);clean();};const escape=e=>{if(e.key==='Escape')clean();};frame.style.cursor='crosshair';frame.addEventListener('pointerdown',down,true);document.addEventListener('pointermove',move,true);document.addEventListener('pointerup',up,true);document.addEventListener('keydown',escape,true);}

  function selectedIndices() {
    return [...new Set(editorSelection.size ? [...editorSelection] : [editorSel])]
      .filter(index => Number.isInteger(index) && index >= 0 && editing?.elements?.[index]);
  }

  const exportImageLabels = new Set(['Export Image…', 'Export label image…']);
  function selectionSupportsExportImage(indices) {
    if (!indices.length) return false;
    return indices.every(index => window.isReplaceablePicture?.(editing.elements[index]));
  }

  function addDivider(host=menu) {
    const divider = document.createElement('div');
    divider.className = 'ocm-divider';
    divider.setAttribute('role', 'separator');
    host.append(divider);
  }

  function menuColorIcon(label){
    const colored=window.RibbonColorIcons?.iconForLabel?.(label)||window.RibbonColorIcons?.LABEL_ICONS?.[label];
    if(!colored)return '';
    const holder=document.createElement('div');holder.innerHTML=colored;const svg=holder.firstElementChild;
    if(!svg)return '';
    svg.classList.add('ribbon-color-icon');
    return svg.outerHTML;
  }
  function addItem([label, icon, shortcut, action, variant], hasSelection, labelMenu=false, host=menu) {
    if(label==='Layer'&&window.LayerManager){window.LayerManager.addMenuItem(host);return true;}
    const item = document.createElement('button');
    item.type = 'button';
    item.setAttribute('role', 'menuitem');
    item.disabled = label === 'Paste' ? !elementClipboard?.length : label==='Paste Unformatted'?!elementClipboard?.some(e=>e.type==='text'):labelMenu?(label==='Select All'||label==='Fit All Objects in Window')&&!editing.elements.length:!hasSelection;
    if(item.disabled)return false;
    if (variant) item.classList.add('ocm-' + variant);
    const glyph = document.createElement('span');
    glyph.className = 'ocm-icon';
    glyph.setAttribute('aria-hidden', 'true');
    const colorIcon=menuColorIcon(label);
    if(!colorIcon){const colors={paste:'#2378bd','paste-text':'#2378bd',select:'#8052be','zoom-in':'#168b61','zoom-out':'#d27619','zoom-rectangle':'#168b61',fit:'#168b61','fit-width':'#168b61','fit-objects':'#168b61',grid:'#8052be',page:'#2975b6',image:'#2975b6',delete:'#dc2626',cut:'#dc2626',copy:'#2975b6',duplicate:'#8052be',layers:'#8052be',edit:'#d27619',properties:'#168b61'};glyph.style.color=colors[icon]||'#3974a8';}
    if(colorIcon)glyph.innerHTML=colorIcon;
    else if(icon==='group')glyph.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="4" width="8" height="8" rx="1"/><rect x="13" y="4" width="8" height="8" rx="1"/><rect x="8" y="13" width="8" height="8" rx="1"/></svg>';else if(icon==='ungroup')glyph.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="4" width="8" height="8" rx="1"/><rect x="13" y="4" width="8" height="8" rx="1"/><path d="M8 13v-1a2 2 0 0 1 2-2h2m2 0h2a2 2 0 0 1 2 2v1m-8 3h4"/></svg>';else if(icon==='arrow-up'||icon==='arrow-down')glyph.innerHTML='<svg viewBox="0 0 24 24"><path d="'+(icon==='arrow-up'?'M12 20V4m-5 5 5-5 5 5':'M12 4v16m-5-5 5 5 5-5')+'"/></svg>';else if(icon==='zoom-in'||icon==='zoom-out')glyph.innerHTML='<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6'+(icon==='zoom-in'?'M10 7v6':'')+'"/></svg>';else if(icons[icon])glyph.innerHTML='<svg viewBox="0 0 24 24">'+icons[icon]+'</svg>';else glyph.textContent = icon;
    const text = document.createElement('span');
    text.className = 'ocm-label';
    text.textContent = label;
    item.append(glyph, text);
    if (shortcut) {
      const key = document.createElement('span');
      key.className = 'ocm-shortcut';
      key.textContent = shortcut;
      item.append(key);
    }
    item.onclick = () => {
      close();
      if (label === 'Paste' && !elementClipboard) return;
      action();
    };
    host.append(item);
    return true;
  }

  const insertTools=[
    ['SVG','svg','M4 4h16v16H4z M6 17l4-5 3 3 2-2 3 4 M8 8h.01',()=>window.useObjectTool('svg')],
    ['Text','text','M4 5h16M12 5v15M8 20h8',()=>window.useObjectTool('text')],
    ['Rectangle','box','M4 5h16v14H4z',()=>window.useObjectTool('box')],
    ['Ellipse','ellipse','M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16',()=>window.useObjectTool('ellipse')],
    ['Line','line','M5 19 19 5 M5 16v3h3m8-14h3v3',()=>window.useObjectTool('line')],
    ['Inverse','inverse','M4 5h16v14H4z M8 10h8m-8 4h5',()=>window.useObjectTool('inverse')],
    ['Picture','image','M3 4h18v16H3z M8 9h.01 M4 17l5-5 4 4 3-3 4 4',()=>window.useObjectTool('image')],
    ['Code 128','barcode128','M4 4v16m3-16v16m2-16v16m5-16v16m2-16v16m4-16v16',()=>window.useObjectTool('barcode128')],
    ['Code 39','code39','M4 4v16m2-16v16m5-16v16m2-16v16m5-16v16m2-16v16',()=>window.useObjectTool('code39')],
    ['Code 93','code93','M4 4v16m4-16v16m3-16v16m2-16v16m4-16v16m3-16v16',()=>window.useObjectTool('code93')],
    ['EAN-13','ean13','M4 4v16m3-16v16m2-16v16m4-16v16m3-16v16m4-16v16',()=>window.useObjectTool('ean13')],
    ['QR Code','qrcode','M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM19 18v3m-5-1h2',()=>window.useObjectTool('qrcode')],
    ['Data Matrix','datamatrix','M3 3h18v18H3zM7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z',()=>window.useObjectTool('datamatrix')]
  ];

  function rememberedToolTab(){const name=window.workspaceToolTab||(typeof settings==='object'&&settings?.workspaceToolTab);return name==='Home'?'Home':'Insert';}
  function rememberToolTab(name){
    const tab=name==='Home'?'Home':'Insert';
    window.workspaceToolTab=tab;
    if(typeof settings==='object'&&settings)settings.workspaceToolTab=tab;
    window.zebra?.saveSettings?.({workspaceToolTab:tab});
  }
  window.rememberToolTab=rememberToolTab;
  function showRibbonTab(name){const tab=[...document.querySelectorAll('.ribbon-tab')].find(button=>button.textContent.trim()===name);tab?.click();}
  function buildInsertCards(grid){
    grid.style.maxHeight='155px';grid.style.boxSizing='border-box';grid.style.gridAutoRows='70px';
    const sourceTools=[...document.querySelectorAll('#ribbon-insert .ribbon-command')].filter(source=>!source.disabled&&!source.hidden&&getComputedStyle(source).display!=='none');
    const sourceFor=key=>sourceTools.find(source=>source.dataset.insertTool===key)||(['barcode128','code39','code93','ean13','qrcode','datamatrix'].includes(key)?sourceTools.find(source=>source.id==='insertBarcodeTool'||source.dataset.insertTool==='barcode128'):null);
    for(const [label,key,path,action] of insertTools){
      if(!sourceFor(key))continue;
      const card=document.createElement('button');card.type='button';card.className='ocm-insert-card';card.title='Insert '+label;card.setAttribute('aria-label','Insert '+label);
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
      const shape=document.createElementNS('http://www.w3.org/2000/svg','path');shape.setAttribute('d',path);svg.append(shape);card.append(svg);
      const caption=document.createElement('span');caption.textContent=label;card.append(caption);
      card.onclick=()=>{close();action();};grid.append(card);
    }
    const known=new Set(insertTools.map(tool=>tool[0]));
    for(const source of sourceTools){
      const label=source.querySelector('.ribbon-caption')?.textContent.trim()||source.getAttribute('aria-label')||source.title;
      if(!label||known.has(label))continue;known.add(label);
      const card=document.createElement('button');card.type='button';card.className='ocm-insert-card';card.title='Insert '+label;card.setAttribute('aria-label',card.title);
      const icon=source.querySelector('svg');if(icon)card.append(icon.cloneNode(true));
      const caption=document.createElement('span');caption.textContent=label;card.append(caption);
      card.onclick=()=>{close();showRibbonTab('Insert');source.click();};grid.append(card);
    }
  }
  function placeMenu(x,y){
    menu.style.maxHeight=`${Math.max(120,window.innerHeight-16)}px`;menu.style.overflowY='auto';
    const maxX=Math.max(8,window.innerWidth-menu.offsetWidth-8),maxY=Math.max(8,window.innerHeight-menu.offsetHeight-8);
    menu.style.left=`${Math.max(8,Math.min(x,maxX))}px`;menu.style.top=`${Math.max(8,Math.min(y,maxY))}px`;
  }

  function buildHomeTools(host,formattingOnly=false){
    const format=document.querySelector('#ribbon-home .text-format-row');
    if(format){
      const copy=format.cloneNode(true);copy.classList.add('ocm-home-format');
      const selectedForFormat=selectedIndices();
      if(selectedForFormat.length&&selectedForFormat.every(index=>['box','ellipse','line'].includes(editing?.elements?.[index]?.type)))copy.classList.add('ocm-shape-format');
      copy.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
      const lines=[...copy.querySelectorAll(':scope > .text-format-line')];
      if(lines.length){const scroll=document.createElement('div');scroll.className='ocm-home-format-scroll';lines.forEach(line=>scroll.append(line));copy.append(scroll);}
      const originals=[...format.querySelectorAll('input,select,button')],copies=[...copy.querySelectorAll('input,select,button')];
      copies.forEach((control,index)=>{const source=originals[index];if(!source)return;if(source.disabled){(control.closest('label')||control).remove();return;}control.disabled=false;if('value' in source)control.value=source.value;
        if(control.tagName==='BUTTON')control.onclick=event=>{event.preventDefault();source.click();control.classList.toggle('format-painter-active',source.classList.contains('format-painter-active'));control.setAttribute('aria-pressed',source.getAttribute('aria-pressed')||String(source.classList.contains('format-painter-active')));control.title=source.title;control.setAttribute('aria-label',source.getAttribute('aria-label')||source.title);};
        else for(const type of ['input','change'])control.addEventListener(type,()=>{source.value=control.value;if(source.type==='checkbox')source.checked=control.checked;source.dispatchEvent(new Event(type,{bubbles:true}));});
      });
      if(!copy.classList.contains('ocm-shape-format')&&copy.querySelector('[aria-label="Font family"]')){
        const scroll=copy.querySelector('.ocm-home-format-scroll'),rows=Array.from({length:3},()=>{const line=document.createElement('div');line.className='text-format-line';return line;});
        const items=[...scroll.querySelectorAll(':scope > .text-format-line > *')];
        for(const item of items){const field=item.matches('input,select,button')?item:item.querySelector('input,select,button'),name=field?.getAttribute('aria-label');
          const row=['Font family','Font size (pt)','Bold','Italic','Underline'].includes(name)?0:field?.tagName==='BUTTON'||field?.type==='color'?1:2;rows[row].append(item);
        }
        scroll.replaceChildren(...rows);copy.classList.add('ocm-three-row-format');
      }
      copy.querySelectorAll('.text-format-line').forEach(line=>{if(!line.children.length)line.remove();});
      if(copy.querySelector('.text-format-line>*'))host.append(copy);
    }
    if(formattingOnly)return;
    const grid=document.createElement('div');grid.className='ocm-insert-grid';grid.setAttribute('aria-label','Home tools');
    const listedInMenu=new Set(['Cut','Copy','Paste','Duplicate','Delete object','Delete','Undo','Redo','Print']);
    for(const source of document.querySelectorAll('#ribbon-home .ribbon-command')){
      const label=source.querySelector('.ribbon-caption')?.textContent.trim()||source.title;if(!label||listedInMenu.has(label)||source.hidden||getComputedStyle(source).display==='none')continue;
      const card=document.createElement('button');card.type='button';card.className='ocm-insert-card';card.title=label;
      card.disabled=source.disabled;
      const icon=source.querySelector('svg');if(icon)card.append(icon.cloneNode(true));const caption=document.createElement('span');caption.textContent=label;card.append(caption);
      card.onclick=()=>{close();source.click();};grid.append(card);
    }if(grid.childElementCount)host.append(grid);
  }
  style.textContent+='.object-context-menu{overflow-x:hidden}.ocm-home-format{display:flex;flex-direction:column;align-items:stretch;gap:3px;width:100%;height:auto;max-height:none;overflow:visible;padding:6px 3px;border-bottom:1px solid var(--border,#d4dbe5);box-sizing:border-box}.ocm-home-format,.ocm-home-format .text-format-row,.ocm-home-format .text-format-line{max-width:none;min-width:0;box-sizing:border-box}.ocm-home-format.text-format-row{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;justify-content:flex-start!important;align-items:stretch!important;flex:0 0 auto;width:100%;min-width:0;height:auto;max-height:none;overflow:visible!important;white-space:normal}.ocm-home-format-scroll{display:flex;flex-direction:column;align-items:flex-start;gap:3px;width:100%;min-width:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;scrollbar-color:#98a2b3 transparent;overscroll-behavior-x:contain}.ocm-home-format-scroll>.text-format-line{display:flex;flex:0 0 32px;flex-wrap:nowrap;align-items:center;gap:5px;width:max-content;min-width:max-content;max-width:none;height:32px;overflow:visible;white-space:nowrap}.ocm-home-format button{flex:0 0 auto;width:auto;min-height:28px;padding:4px}.ocm-home-format label{display:flex;flex:0 0 auto;align-items:center;gap:3px;min-width:max-content}.ocm-home-format input,.ocm-home-format select{flex:0 0 auto;max-width:none;min-width:0}.ocm-home-format .format-font{width:120px!important;max-width:none}.ocm-home-format select[aria-label="Barcode fill area"]{width:112px}.ocm-home-format .unit-number{width:85px}';
  style.textContent+='.ocm-shape-format .ocm-home-format-scroll{overflow:visible}.ocm-shape-format .ocm-home-format-scroll>.text-format-line:has(select[aria-label="Line style"]){display:grid;grid-template-columns:43px 43px 32px minmax(0,1fr);grid-template-rows:30px 30px;align-items:center;gap:4px;width:100%;min-width:0;height:auto;min-height:64px;flex:0 0 auto;white-space:normal;overflow:visible}.ocm-shape-format .ocm-home-format-scroll>.text-format-line:has(select[aria-label="Line style"])>label:has(input[type="color"]){width:32px;min-width:32px;grid-row:1}.ocm-shape-format .ocm-home-format-scroll>.text-format-line:has(select[aria-label="Line style"])>button.format-no-fill{width:28px;min-width:28px;grid-row:1}.ocm-shape-format .ocm-home-format-scroll>.text-format-line:has(select[aria-label="Line style"])>label:has(select[aria-label="Line style"]){grid-row:2;grid-column:1/3;min-width:0}.ocm-shape-format .ocm-home-format-scroll>.text-format-line:has(select[aria-label="Line style"])>label:has(input[aria-label="Line thickness"]){grid-row:2;grid-column:3/5;min-width:0}.ocm-shape-format .ocm-home-format-scroll>.text-format-line:has(select[aria-label="Line style"]) select[aria-label="Line style"]{width:90px;min-width:0}.ocm-shape-format .ocm-home-format-scroll>.text-format-line:has(select[aria-label="Line style"]) input[aria-label="Line thickness"]{width:70px;min-width:0}';

  window.buildContextFormattingTools=host=>buildHomeTools(host,true);
  function open(event) {
    if (!editing) return;
    const resetTransform=window.pauseEditorTransform?.();
    contextPastePoint=window.captureEditorPastePoint?.(event)||null;
    const hit = event.target.closest?.('.hit[data-hit]');
    if (hit) {
      const index = Number(hit.dataset.hit);
      if (!editorSelection.has(index)) selectElement(index);
    }
    const selected = selectedIndices();
    event.preventDefault();
    menu.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'ocm-heading';
    heading.textContent = selected.length > 1 ? `${selected.length} objects selected` : selected.length ? `${String(editing.elements[selected[0]].type || 'Object')} actions` : 'Label actions';
    menu.append(heading);
    if(resetTransform){addItem(['Reset to previous','reset','',resetTransform],true,false,menu);addDivider(menu);}
    const tabs=document.createElement('div');tabs.className='ocm-tabs';tabs.setAttribute('role','tablist');
    const actionsTab=document.createElement('button'),insertTab=document.createElement('button');
    for(const [button,label] of [[actionsTab,'Home'],[insertTab,'Insert']]){button.type='button';button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(label==='Insert'));tabs.append(button);}
    const actionsPane=document.createElement('div');actionsPane.className='ocm-pane';actionsPane.setAttribute('role','tabpanel');
    const insertPane=document.createElement('div');insertPane.className='ocm-pane';insertPane.setAttribute('role','tabpanel');
    const homePane=document.createElement('div');homePane.className='ocm-pane';homePane.hidden=true;homePane.setAttribute('role','tabpanel');buildHomeTools(homePane);
    const insertGrid=document.createElement('div');insertGrid.className='ocm-insert-grid';insertGrid.setAttribute('aria-label','Insert tools');if(!selected.length)buildInsertCards(insertGrid);insertPane.append(insertGrid);menu.append(tabs,homePane,insertPane,actionsPane);
    const insertAvailable=insertGrid.querySelectorAll('.ocm-insert-card:not(:disabled)').length>0;
    const homeAvailable=!!homePane.querySelector('button:not(:disabled),input:not(:disabled),select:not(:disabled)');
    insertTab.hidden=!insertAvailable;actionsTab.hidden=!homeAvailable;tabs.hidden=!homeAvailable||!insertAvailable;
    const activate=(name,persist=true)=>{const inserting=insertAvailable&&(!homeAvailable||name==='Insert'),activeName=inserting?'Insert':'Home';insertPane.hidden=!inserting;homePane.hidden=inserting||!homeAvailable;actionsTab.setAttribute('aria-selected',String(!inserting&&homeAvailable));insertTab.setAttribute('aria-selected',String(inserting));if(persist)rememberToolTab(activeName);showRibbonTab(activeName);placeMenu(event.clientX,event.clientY);};
    actionsTab.onclick=()=>activate('Home');insertTab.onclick=()=>{if(insertAvailable)activate('Insert');};
    const availableGroups=(selected.length?groups:labelGroups).map(group=>group.filter(item=>{
      if(item[0]==='Edit')return selected.length===1&&editing.elements[selected[0]]?.type==='text';
      if(exportImageLabels.has(item[0]))return selectionSupportsExportImage(selected);
      return true;
    })).filter(group=>group.length);
    let hasActionGroup=false;
    availableGroups.forEach(group=>{
      const items=document.createDocumentFragment();
      group.forEach(item=>addItem(item,selected.length>0,!selected.length,items));
      if(items.childNodes.length){if(hasActionGroup)addDivider(actionsPane);actionsPane.append(items);hasActionGroup=true;}
    });
    if(selected.length>1){addDivider(actionsPane);addItem(['Group','group','Ctrl+G',()=>window.groupSelectedElements?.()],true,false,actionsPane);}
    if(selected.some(index=>editing.elements[index]?.group_id)){addItem(['Ungroup','ungroup','',()=>window.groupSelectedElements?.(true)],true,false,actionsPane);}
    if(selected.length===1&&window.isReplaceablePicture?.(editing.elements[selected[0]])&&!editing.elements[selected[0]].placeholder){
      addDivider(actionsPane);
      addItem(['Remove background','remove-background','',()=>window.removeImageBackground(selected[0])],!editing.elements[selected[0]].locked,false,actionsPane);
    }
    activate(rememberedToolTab(),false);
    menu.scrollTop=0;
    placeMenu(event.clientX,event.clientY);
    window.FloatingMenuTopLayer?.show(menu);
    placeMenu(event.clientX,event.clientY);
    // Leave focus where it was; opening the menu must not activate a command button.
  }

  function close() { window.FloatingMenuTopLayer?.hide(menu);window.LayerManager?.closeMenu(); }

  function arrange(toFront) {
    const indices = selectedIndices().sort((a, b) => a - b);
    if (!editing || !indices.length) return;
    readEditorIntoDraft();
    pushSnapshot();
    const selectedSet = new Set(indices);
    const selected = editing.elements.filter((_, index) => selectedSet.has(index));
    const others = editing.elements.filter((_, index) => !selectedSet.has(index));
    editing.elements = toFront ? [...others, ...selected] : [...selected, ...others];
    const first = toFront ? others.length : 0;
    editorSelection = new Set(selected.map((_, offset) => first + offset));
    editorSel = toFront ? editing.elements.length - 1 : selected.length - 1;
    renderEditorElements();
    drawEditorCanvas();
    touchEditor();
  }

  function editSelected() {
    const index = editorSel;
    if (!editing?.elements?.[index]) return;
    if (editing.elements[index].type === 'text') focusTextProperty(index, true);
  }

  frame.addEventListener('contextmenu', open);
  // Listen during capture so canvas handlers cannot stop the outside click before the menu closes.
  document.addEventListener('pointerdown', event => { if (!menu.hidden && !menu.contains(event.target)&&!window.LayerManager?.contains(event.target)) close(); }, true);
  document.addEventListener('keydown', event => {
    if (menu.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const items = [...menu.querySelectorAll('button:not(:disabled)')].filter(button=>button.getClientRects().length);
      const current = items.indexOf(document.activeElement);
      const next=current<0?(event.key==='ArrowDown'?0:items.length-1):(current+(event.key==='ArrowDown'?1:items.length-1))%items.length;
      items[next]?.focus();
    }
  });
  window.addEventListener('resize', close);
  frame.addEventListener('scroll', close, true);
})();
