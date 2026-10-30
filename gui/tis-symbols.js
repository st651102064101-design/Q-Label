(function(){
  'use strict';
  const insertPanel=document.getElementById('ribbon-insert');
  if(!insertPanel)return;
  const group=document.createElement('div');
  group.className='ribbon-group tis-ribbon-group';
  const items=document.createElement('div');items.className='ribbon-items';
  const label=document.createElement('div');label.className='ribbon-group-label';label.textContent='Symbols';
  const button=document.createElement('button');button.type='button';button.className='ribbon-command ribbon-has-dropdown';button.title='Insert Symbols';button.setAttribute('aria-label','Insert Symbols');
  button.innerHTML='<svg data-icon="symbols" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="7.5" r="3.25"/><rect x="13.5" y="4.25" width="6.5" height="6.5" rx="1"/><path d="m7.5 13.25 3.5 6.25H4zM16.75 13.5 20 16.75 16.75 20 13.5 16.75z"/></svg><span class="ribbon-caption">Symbols</span><span class="ribbon-dropdown-arrow" aria-hidden="true">▾</span>';
  const menu=document.createElement('div');menu.className='symbols-menu';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Symbols');document.body.append(menu);
  button.addEventListener('click',()=>toggleSymbolsMenu());items.append(button);group.append(items,label);insertPanel.append(group);

  const customCategory='Custom';
  const symbols=Array.from({length:5},(_,i)=>({name:`TIS Mark 0${i+1}`,category:'TIS',src:`assets/TIS/mark0${i+1}.png`}));
  const fontCatalog=[...(window.WordSymbols||[]),...(window.HalalSymbols||[])];
  for(const font of fontCatalog)for(const symbol of font.symbols||[])symbols.push({...symbol,category:font.name});
  const baseSymbols=symbols.slice();
  const categories=[...new Set([...symbols.map(symbol=>symbol.category),customCategory])];

  const recentKey='bratender.recentSymbols.v1';
  let recent=[];
  let customSymbols=[];
  const symbolKey=symbol=>symbol?.id||symbol?.src;
  async function loadCustomSymbols(){try{const stored=await window.zebra.getSettings();customSymbols=(Array.isArray(stored?.customSymbols)?stored.customSymbols:[]).filter(s=>s&&typeof s.id==='string'&&typeof s.name==='string'&&typeof s.src==='string'&&/^data:image\/(?:svg\+xml|png|jpeg|webp);base64,/i.test(s.src)).map(s=>({...s,category:customCategory,imported:true}));}catch{customSymbols=[];}symbols.splice(0,symbols.length,...baseSymbols,...customSymbols);}
  function rememberSymbol(symbol){const key=symbolKey(symbol);recent=[key,...recent.filter(src=>src!==key)].slice(0,16);try{localStorage.setItem(recentKey,JSON.stringify(recent));}catch{}renderRecent();}
  function loadRecent(){try{const stored=JSON.parse(localStorage.getItem(recentKey)||'[]');if(Array.isArray(stored))recent=[...new Set(stored.filter(key=>typeof key==='string'&&symbols.some(s=>symbolKey(s)===key)))].slice(0,16);}catch{recent=[];}}
  function symbolArtwork(symbol,card){const thumb=document.createElement('span');thumb.className='tis-symbol-thumb';const image=document.createElement('img');image.alt='';image.draggable=false;image.src=symbol.src;image.style.filter='grayscale(1)';thumb.append(image);card.append(thumb);}
  function renderRecent(){if(!modal)return;const row=modal.querySelector('.tis-recent-list');if(!row)return;row.replaceChildren();if(!recent.length){const empty=document.createElement('span');empty.className='tis-recent-empty';empty.textContent='Symbols you insert will appear here.';row.append(empty);return;}for(const key of recent){const index=symbols.findIndex(s=>symbolKey(s)===key);if(index<0)continue;const symbol=symbols[index],card=document.createElement('button');card.type='button';card.className='tis-symbol-card tis-recent-card';card.draggable=true;card.dataset.tisSymbolIndex=String(index);card.title=symbol.name;card.setAttribute('aria-label',symbol.name);symbolArtwork(symbol,card);card.onclick=event=>{select(index);if(event.detail<=1)void insertSelected();};card.ondblclick=event=>{event.preventDefault();select(index);};row.append(card);}updateSelection();}

  let modal=null,selected=0,activeCategory='TIS',inserting=false;
  function placeSymbolsMenu(){
    const anchor=button.getBoundingClientRect(),width=menu.offsetWidth||280,height=menu.offsetHeight||240;
    const left=Math.max(8,Math.min(anchor.left,innerWidth-width-8));
    const spaceBelow=innerHeight-anchor.bottom-8,top=spaceBelow>=height||spaceBelow>=anchor.top?anchor.bottom+4:Math.max(8,anchor.top-height-4);
    menu.style.left=left+'px';menu.style.top=Math.min(top,innerHeight-height-8)+'px';
  }
  function closeSymbolsMenu(){menu.hidden=true;}
  async function renderSymbolsMenu(){
    await loadCustomSymbols();loadRecent();
    menu.replaceChildren();
    const heading=document.createElement('strong');heading.textContent='Symbols';menu.append(heading);
    const grid=document.createElement('div');grid.className='symbols-menu-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','TIS symbols');
    for(let index=0;index<Math.min(5,symbols.length);index++){
      const symbol=symbols[index],tile=document.createElement('button');
      tile.type='button';tile.className='symbols-menu-tile tis-symbol-card';tile.draggable=true;tile.dataset.tisSymbolIndex=String(index);
      tile.title=symbol.name;tile.setAttribute('aria-label',symbol.name);symbolArtwork(symbol,tile);
      tile.onclick=()=>{closeSymbolsMenu();void openPicker(index);};
      tile.addEventListener('dragstart',()=>setTimeout(closeSymbolsMenu,0));
      grid.append(tile);
    }
    menu.append(grid);
    if(recent.length){
      const recentLabel=document.createElement('small');recentLabel.textContent='Recently used symbols';menu.append(recentLabel);
      const recentRow=document.createElement('div');recentRow.className='symbols-menu-recent';
      for(const key of recent.slice(0,8)){
        const index=symbols.findIndex(s=>symbolKey(s)===key);if(index<0)continue;
        const symbol=symbols[index],tile=document.createElement('button');
        tile.type='button';tile.className='symbols-menu-tile symbols-menu-recent-tile tis-symbol-card';tile.draggable=true;tile.dataset.tisSymbolIndex=String(index);
        tile.title=symbol.name;tile.setAttribute('aria-label',symbol.name);symbolArtwork(symbol,tile);
        tile.onclick=()=>{closeSymbolsMenu();void openPicker(index);};
        tile.addEventListener('dragstart',()=>setTimeout(closeSymbolsMenu,0));
        recentRow.append(tile);
      }
      if(recentRow.children.length)menu.append(recentRow);
    }
    const more=document.createElement('button');more.type='button';more.className='symbols-menu-more';
    more.setAttribute('aria-label','More Symbols');more.innerHTML='<span>More Symbols…</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    more.onclick=()=>{closeSymbolsMenu();void openPicker();};
    menu.append(more);
  }
  async function openSymbolsMenu(){
    if(!menu.hidden)return;
    await renderSymbolsMenu();menu.hidden=false;placeSymbolsMenu();
  }
  function toggleSymbolsMenu(){
    if(!menu.hidden){closeSymbolsMenu();return;}
    void openSymbolsMenu();
  }
  async function openPicker(initialIndex=0){
    await loadCustomSymbols();loadRecent();
    if(modal){modal.remove();modal=null;}
    selected=Number.isInteger(initialIndex)&&symbols[initialIndex]?initialIndex:0;
    activeCategory=symbols[selected]?.category||activeCategory;
    modal=document.createElement('div');modal.className='tis-picker-backdrop';
    modal.innerHTML='<section class="tis-picker" role="dialog" aria-modal="true" aria-labelledby="tis-picker-title"><header><div class="tis-picker-heading"><h2 id="tis-picker-title">Symbol</h2><div class="tis-picker-filters"><label class="tis-category-label">Subset: <select class="tis-category-select" aria-label="Symbol subset"></select></label><button type="button" class="tis-import">Import symbols</button><small class="tis-import-help">SVG, PNG, JPG or WebP</small><span class="tis-import-status" role="status" aria-live="polite"></span></div></div><button type="button" class="tis-close" aria-label="Close">×</button></header><div class="tis-category-layout"><div class="tis-symbol-grid" role="listbox" aria-label="Symbols"></div></div><section class="tis-recent" aria-labelledby="tis-recent-title"><h3 id="tis-recent-title">Recently used symbols:</h3><div class="tis-recent-list" aria-label="Recently used symbols"></div></section><footer><span></span><div><button type="button" class="tis-cancel">Cancel</button><button type="button" class="tis-insert">Insert</button></div></footer></section>';
    document.body.append(modal);
    window.ModalWindowStack?.openCustom(modal.querySelector('[role="dialog"]'),closePicker);
    const grid=modal.querySelector('.tis-symbol-grid');
    const categorySelect=modal.querySelector('.tis-category-select');
    categories.forEach(category=>{const option=document.createElement('option');option.value=category;option.textContent=category;categorySelect.append(option);});
    activeCategory=categories.includes(activeCategory)?activeCategory:'TIS';categorySelect.value=activeCategory;
    window.SvgSelect?.enhance(categorySelect,{iconFor:(value,text)=>window.SvgSelect.blockIcon(text)});
    const importControls=[modal.querySelector('.tis-import'),modal.querySelector('.tis-import-help'),modal.querySelector('.tis-import-status')];
    const syncImportVisibility=()=>importControls.forEach(control=>{control.hidden=categorySelect.value!==customCategory;});
    syncImportVisibility();
    categorySelect.onchange=()=>{activeCategory=categorySelect.value;selected=-1;syncImportVisibility();renderCards();};
    renderCards();renderRecent();
    modal.querySelector('.tis-import').onclick=()=>void importSymbols();
    modal.querySelector('.tis-close').onclick=closePicker;modal.querySelector('.tis-cancel').onclick=closePicker;modal.querySelector('.tis-insert').onclick=()=>void insertSelected();
    modal.addEventListener('pointerdown',event=>{if(event.target===modal)closePicker();});
    modal.addEventListener('keydown',event=>{if(event.target===modal.querySelector('.tis-category-select')&&event.key!=='Escape')return;if(event.key==='Escape'){event.preventDefault();closePicker();}else if(event.key==='Enter'&&event.target!==modal.querySelector('.tis-category-select')){event.preventDefault();void insertSelected();}else if(event.key==='ArrowRight'||event.key==='ArrowDown'){event.preventDefault();moveSelection(1);}else if(event.key==='ArrowLeft'||event.key==='ArrowUp'){event.preventDefault();moveSelection(-1);}});
    select(selected);modal.querySelector(`[data-tis-symbol-index="${selected}"]`)?.focus();
  }
  function cleanSvg(source){
    if(typeof source!=='string'||source.length>1024*1024)throw new Error('SVG files must be smaller than 1 MB.');
    const parsed=new DOMParser().parseFromString(source,'image/svg+xml'),root=parsed.documentElement;
    if(!root||root.localName!=='svg'||parsed.querySelector('parsererror'))throw new Error('This is not a valid SVG file.');
    root.querySelectorAll('script,foreignObject,iframe,object,embed,image,audio,video,animate,animateMotion,animateTransform,set').forEach(node=>node.remove());
    for(const node of [root,...root.querySelectorAll('*')])for(const attr of [...node.attributes]){
      const name=attr.name.toLowerCase(),value=attr.value.trim();
      if(name.startsWith('on')||name==='src'||(/href$/.test(name)&&value&&!value.startsWith('#'))||(/url\s*\(/i.test(value)&&!/url\(\s*['"]?#[-\w.]+['"]?\s*\)/i.test(value))||/javascript:|vbscript:|file:|https?:/i.test(value))node.removeAttribute(attr.name);
      else if(name==='style'&&/@import|expression\s*\(/i.test(value))node.removeAttribute(attr.name);
    }
    parsed.querySelectorAll('style').forEach(node=>{if(/@import|url\s*\(\s*['"]?(?!#)/i.test(node.textContent||''))node.remove();});
    if(!root.hasAttribute('viewBox')&&!root.hasAttribute('width'))root.setAttribute('width','256');
    if(!root.hasAttribute('viewBox')&&!root.hasAttribute('height'))root.setAttribute('height','256');
    if(!root.hasAttribute('xmlns'))root.setAttribute('xmlns','http://www.w3.org/2000/svg');
    return new XMLSerializer().serializeToString(root);
  }
  function base64Utf8(text){const bytes=new TextEncoder().encode(text);let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}
  async function importSymbols(){
    const status=modal?.querySelector('.tis-import-status'),importButton=modal?.querySelector('.tis-import');if(!status||!importButton)return;
    status.textContent='';importButton.disabled=true;
    try{
      const result=await window.zebra.pickFile('symbol');if(result?.canceled){if(result.error)throw new Error(result.error);return;}
      const imported=[];
      for(const file of result?.files||[]){
        const mime=String(file.mime||'').toLowerCase();if(!['image/svg+xml','image/png','image/jpeg','image/webp'].includes(mime))throw new Error('Choose SVG, PNG, JPG, or WebP symbol files.');
        let src;if(mime==='image/svg+xml'){const raw=atob(file.base64||''),bytes=Uint8Array.from(raw,char=>char.charCodeAt(0)),clean=cleanSvg(new TextDecoder().decode(bytes));src=`data:image/svg+xml;base64,${base64Utf8(clean)}`;}else src=`data:${mime};base64,${file.base64||''}`;
        if(src.length<64)throw new Error(`${file.name||'Symbol'} is empty or invalid.`);
        const name=String(file.name||'Imported symbol').replace(/\.[^.]+$/,'').trim().slice(0,100)||'Imported symbol';
        imported.push({id:`custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`,name,category:customCategory,src,imported:true});
      }
      if(!imported.length){status.textContent='No symbol files were selected.';return;}
      const next=[...customSymbols,...imported],saved=await window.zebra.saveSettings({customSymbols:next});if(saved?.error)throw new Error(saved.error);
      customSymbols=next;symbols.splice(0,symbols.length,...baseSymbols,...customSymbols);activeCategory=customCategory;const categorySelect=modal.querySelector('.tis-category-select');categorySelect.value=customCategory;selected=-1;renderCards();renderRecent();status.textContent=`Imported ${imported.length} symbol${imported.length===1?'':'s'} into ${customCategory}.`;
    }catch(error){status.textContent=error.message||'Could not import symbols.';}finally{if(importButton.isConnected)importButton.disabled=false;}
  }
  function matchingIndices(){return symbols.map((symbol,index)=>({symbol,index})).filter(({symbol})=>symbol.category===activeCategory).map(item=>item.index);}
  function renderCards(){if(!modal)return;const grid=modal.querySelector('.tis-symbol-grid');grid.replaceChildren();const indices=matchingIndices();if(!indices.includes(selected))selected=indices[0]??-1;if(!indices.length){const empty=document.createElement('div');empty.className='tis-symbol-empty';empty.textContent=activeCategory===customCategory?'No custom symbols yet. Choose Import symbols to add SVG, PNG, JPG, or WebP artwork.':'No symbols found';grid.append(empty);updateSelection();return;}let loaded=0;const layout=modal.querySelector('.tis-category-layout');layout.scrollTop=0;const appendBatch=()=>{const batch=indices.slice(loaded,loaded+200);loaded+=batch.length;batch.forEach(index=>{const symbol=symbols[index],card=document.createElement('button');card.type='button';card.className='tis-symbol-card';card.draggable=true;card.dataset.tisSymbolIndex=String(index);card.title='Drag this symbol onto the label to place it';card.setAttribute('aria-label',symbol.name);card.setAttribute('role','option');card.setAttribute('aria-selected',String(index===selected));symbolArtwork(symbol,card);card.onclick=event=>{select(index);if(event.detail<=1)void insertSelected();};card.ondblclick=event=>{event.preventDefault();select(index);};grid.append(card);});updateSelection();};grid._appendSymbols=appendBatch;appendBatch();layout.onscroll=()=>{if(layout.scrollTop+layout.clientHeight>=layout.scrollHeight-100&&loaded<indices.length)appendBatch();};}
  function updateSelection(){if(!modal)return;modal.querySelectorAll('.tis-symbol-card').forEach(card=>{const isSelected=Number(card.dataset.tisSymbolIndex)===selected;card.classList.toggle('selected',isSelected);card.setAttribute('aria-selected',String(isSelected));});const description=modal.querySelector('footer > span');if(description)description.textContent=symbols[selected]?.name||'';const insert=modal.querySelector('.tis-insert');if(insert)insert.disabled=inserting||selected<0;}
  function select(index){selected=index;updateSelection();}
  function moveSelection(step){const indices=matchingIndices();if(!indices.length)return;const current=indices.indexOf(selected),next=current<0?0:(current+step+indices.length)%indices.length;select(indices[next]);const grid=modal.querySelector('.tis-symbol-grid');while(!grid.querySelector(`[data-tis-symbol-index="${selected}"]`))grid._appendSymbols();modal.querySelector(`[data-tis-symbol-index="${selected}"]`)?.focus();}
  function closePicker(){if(modal){window.ModalWindowStack?.closeCustom(modal.querySelector('[role="dialog"]'));modal.remove();modal=null;}button.focus();}
  window.TisSymbolMenu={isOpen:()=>!menu.hidden,open:openSymbolsMenu,close:closeSymbolsMenu,toggle:toggleSymbolsMenu};
  window.TisSymbolPicker={isOpen:()=>!!modal,close:closePicker};
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!button.contains(event.target))closeSymbolsMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSymbolsMenu();},true);
  document.addEventListener('dragstart',event=>{if(event.target.closest?.('.tis-symbol-card')&&modal)modal.classList.add('tis-dragging');});
  document.addEventListener('dragend',()=>{if(modal)modal.classList.remove('tis-dragging');});
  function loadBitmap(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{try{const scale=Math.min(1,1024/Math.max(image.naturalWidth,image.naturalHeight));const width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale));const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);const pixels=ctx.getImageData(0,0,width,height).data;const bytes=new Uint8Array(Math.ceil(width/8)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=(y*width+x)*4;const luminance=pixels[p]*.299+pixels[p+1]*.587+pixels[p+2]*.114;if(luminance<200)bytes[y*Math.ceil(width/8)+(x>>3)]|=0x80>>(x&7);}resolve({width,height,hex:Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('')});}catch(error){reject(error);}};image.onerror=()=>reject(new Error('Could not load TIS symbol'));image.src=src;});}
  async function insertSelected(point=null){
    if(inserting||selected<0||!symbols[selected])return;
    if(typeof editing==='undefined'||!editing||!Array.isArray(editing.elements)){alert('Open a label before inserting a symbol.');return;}
    inserting=true;const symbol=symbols[selected];const insertButton=modal?.querySelector('.tis-insert');if(insertButton)insertButton.disabled=true;
    try{
      const bitmap=await loadBitmap(symbol.src);
      const labelW=Math.max(1,Number(editing.width_mm)||50),labelH=Math.max(1,Number(editing.height_mm)||25);
      let width=Math.min(30,labelW),height=width*bitmap.height/bitmap.width;if(height>labelH){height=labelH;width=height*bitmap.width/bitmap.height;}
      const element={type:'image',transparent_background:true,x_mm:0,y_mm:0,width_mm:width,height_mm:height,bitmap_width:bitmap.width,bitmap_height:bitmap.height,bitmap_hex:bitmap.hex};
      if(typeof editing==='undefined'||!editing)return;
      readEditorIntoDraft();pushSnapshot();
      if(point){const margin=editing.margin_mm||{},bounds=designPaperBounds();element.x_mm=Math.max(bounds.minX,snapVal(point.x-(Number(margin.left)||0)));element.y_mm=Math.max(bounds.minY,snapVal(point.y-(Number(margin.top)||0)));}else placeNewElementAtBottom(element);
      window.ObjectNames?.assign(element,editing.elements);
      editing.elements.push(element);window.noteRecentObjectUsage?.(element);editorSel=editing.elements.length-1;editorSelection=new Set([editorSel]);
      renderEditorElements();updateEditorPreview();touchEditor();void persistEditor();rememberSymbol(symbol);
    }catch(error){console.error('TIS symbol insertion failed:',error);alert('Could not insert this TIS symbol.');if(insertButton)insertButton.disabled=false;}finally{inserting=false;updateSelection();}
  }
  window.insertTisSymbolAt=(index,point)=>{if(!Number.isInteger(index)||!symbols[index])return;select(index);return insertSelected(point);};
  const style=document.createElement('style');style.textContent='.symbols-menu{position:fixed;z-index:4000;box-sizing:border-box;width:min(280px,calc(100vw - 16px));padding:9px;border:1px solid var(--border,#d5dce5);border-radius:10px;background:var(--card,#fff);color:var(--text,#263342);box-shadow:0 8px 24px #0f172a26;max-height:calc(100vh - 16px);overflow-y:auto}.symbols-menu[hidden]{display:none}.symbols-menu>strong{display:block;padding:0 3px 8px;font:600 13px "Segoe UI",sans-serif}.symbols-menu>small{display:block;margin:8px 3px 4px;color:var(--muted,#667085);font:500 11px "Segoe UI",sans-serif}.symbols-menu-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:0 1px 8px}.symbols-menu-recent{display:flex;flex-wrap:wrap;gap:4px;margin:0 1px 8px}.symbols-menu-tile{box-sizing:border-box;display:grid;place-items:center;aspect-ratio:1;min-width:0;padding:4px;border:1px solid var(--border,#d8dee6);border-radius:6px;background:var(--card,#fff);cursor:pointer}.symbols-menu-tile:hover,.symbols-menu-tile:focus-visible{background:#eef2f6;border-color:var(--accent,#16a34a);outline:none}.symbols-menu-recent-tile{width:38px;height:38px;aspect-ratio:auto;padding:3px}.symbols-menu-tile .tis-symbol-thumb{width:min(40px,88%);height:min(40px,88%)}.symbols-menu-recent-tile .tis-symbol-thumb{width:28px;height:28px}.symbols-menu-more{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:36px;margin:2px 0 0;padding:7px 10px;border:1px solid transparent;border-radius:7px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.symbols-menu-more:hover,.symbols-menu-more:focus-visible{background:#eef2f6;border-color:#e1e6ed;outline:none}.symbols-menu-more svg{flex:none;width:16px;height:16px;color:var(--muted,#667085)}.tis-ribbon-group{min-width:78px;max-width:78px;padding:0 5px!important}.tis-ribbon-group .ribbon-items{justify-content:center;min-height:68px}.tis-ribbon-group .ribbon-command{width:68px!important;min-width:68px!important;max-width:68px!important;flex:0 0 68px!important;overflow:hidden;border:1px solid transparent!important;border-radius:5px!important;color:var(--text,#334155)!important}.tis-ribbon-group .ribbon-command:hover,.tis-ribbon-group .ribbon-command:focus-visible{background:color-mix(in srgb,var(--accent) 7%,var(--card))!important}.tis-ribbon-group .ribbon-command svg:not(.ribbon-color-icon){color:inherit!important;stroke:currentColor!important}.tis-ribbon-group .ribbon-caption{display:block;max-width:60px;overflow-wrap:anywhere;white-space:normal;color:inherit!important}.tis-picker-backdrop{position:fixed;inset:0;z-index:10000;background:transparent;pointer-events:none;display:grid;place-items:center;padding:24px}.tis-picker-backdrop.tis-dragging .tis-picker{pointer-events:none!important}.tis-picker{pointer-events:auto;width:min(560px,95vw);max-height:min(480px,90vh);display:flex;flex-direction:column;background:var(--panel,#fff);color:var(--text,#1f2937);border:1px solid var(--border,#d4dbe5);border-radius:12px;box-shadow:0 20px 60px #0004;overflow:visible}.tis-picker header{position:relative;z-index:20;overflow:visible;border-radius:12px 12px 0 0}.tis-category-label,.tis-category-select{position:relative;z-index:21}.tis-category-select option{background:#fff;color:#1f2937}.tis-picker header,.tis-picker footer{flex:none;display:flex;align-items:center;justify-content:space-between;padding:16px 20px}.tis-picker header{border-bottom:1px solid var(--border,#d4dbe5);gap:16px}.tis-picker-heading{flex:1;min-width:0}.tis-picker h2{font-size:18px;margin:0 0 8px}.tis-picker button,.tis-picker select,.tis-picker input{font:inherit;cursor:pointer}.tis-picker-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.tis-import{padding:8px 11px;border:1px solid #16a34a;border-radius:6px;background:#eaf7ef;color:#08783b;font-weight:600}.tis-import:hover{background:#dcf2e4}.tis-import-help{font-size:11px;color:var(--muted,#667085)}.tis-import-status{flex-basis:100%;min-height:15px;color:#08783b;font-size:11px}.tis-category-label{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--muted,#667085)}.tis-category-select{min-width:150px;padding:8px 30px 8px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--panel,#fff);color:var(--text,#1f2937)}.tis-picker .tis-close{font-size:24px;border:0;background:transparent;color:inherit;width:36px;height:36px;align-self:flex-start}.tis-category-layout{min-height:0;max-height:min(250px,55vh);overflow:auto}.tis-symbol-grid{padding:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:0;align-content:start}.tis-symbol-card{position:relative;box-sizing:border-box;display:grid;place-items:center;aspect-ratio:1;min-width:0;overflow:visible;border:1px solid #aeb7c2!important;border-radius:0!important;margin:0 -1px -1px 0;padding:5px;background:#fff!important;color:inherit;text-align:center}.tis-symbol-card:hover{background:#f3f6f8!important}.tis-symbol-card.selected{z-index:1;background:#eaf7ef!important;border-color:#16a34a!important;outline:2px solid #16a34a!important;outline-offset:-2px}.tis-symbol-card:focus-visible{outline:2px solid #16a34a!important;outline-offset:-2px}.tis-symbol-card.selected:after{content:"✓";position:absolute;top:0;right:0;width:16px;height:16px;border-radius:50%;background:#16a34a;color:#fff;display:grid;place-items:center;font-size:11px;line-height:1}.tis-symbol-thumb{box-sizing:border-box;min-width:0;min-height:0;width:min(48px,80%);height:min(48px,80%);overflow:hidden;background:transparent;border-radius:0;display:flex;align-items:center;justify-content:center}.tis-symbol-thumb img{display:block;box-sizing:border-box;max-width:100%!important;max-height:100%!important;width:auto!important;height:auto!important;object-fit:contain;object-position:center}.tis-symbol-name{display:none!important}.tis-symbol-empty{grid-column:1/-1;padding:18px 8px;color:var(--muted,#667085);font-size:13px}.tis-picker footer{border-top:1px solid var(--border,#d4dbe5);font-size:13px}.tis-picker footer button{border:1px solid var(--border,#cbd5e1);border-radius:6px;padding:8px 14px;background:var(--panel,#fff);color:inherit;margin-left:8px}.tis-picker footer .tis-insert{background:#16a34a;border-color:#16a34a;color:white}.tis-picker footer .tis-insert:disabled{opacity:.6;cursor:not-allowed}@media(max-width:600px){.tis-picker-filters{align-items:stretch;flex-direction:column;gap:8px}.tis-category-label{justify-content:space-between}.tis-category-select{width:100%;min-width:0}.tis-symbol-grid{grid-template-columns:repeat(auto-fill,minmax(48px,1fr));padding:10px}.tis-symbol-thumb{width:min(40px,80%);height:min(40px,80%)}}';style.textContent+='.tis-recent{flex:none;padding:10px 12px;border-top:1px solid var(--border,#d4dbe5)}.tis-recent h3{font-size:12px;font-weight:500;margin:0 0 6px}.tis-recent-list{display:flex;overflow-x:auto;gap:0;padding:1px;min-height:38px}.tis-recent-card{flex:0 0 38px;width:38px;height:38px;aspect-ratio:auto;padding:4px}.tis-recent-card .tis-symbol-thumb{width:28px;height:28px}.tis-recent-card.selected:after{width:12px;height:12px;font-size:9px}.tis-recent-empty{align-self:center;font-size:12px;color:var(--muted,#667085)}';document.head.append(style);
  const insertIconStyle=document.createElement('style');insertIconStyle.textContent='.tis-picker .tis-insert>svg{stroke:#fff!important}';document.head.append(insertIconStyle);
})();

