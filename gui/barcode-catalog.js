(function(){
  'use strict';
  const dialog=document.createElement('dialog');dialog.id='advancedBarcodePicker';
  dialog.innerHTML='<header><div class="bc-heading"><span class="bc-heading-icon" aria-hidden="true">▥</span><div><strong>Choose a barcode</strong><small>Select a type, preview it, then enter your data.</small></div></div><button type="button" aria-label="Close">×</button></header><div class="bc-toolbar"><input class="bc-search" type="search" placeholder="Search barcode types…" aria-label="Search barcodes"><nav aria-label="Barcode categories"></nav></div><section class="bc-workspace"><div class="bc-list-wrap"><div class="bc-list-heading"><strong>Barcode types</strong><span class="bc-count"></span></div><div class="bc-list" role="listbox"></div></div><aside class="bc-detail"><div class="bc-preview"><div class="bc-preview-head"><span>LIVE PREVIEW</span><span class="bc-format"></span></div><div class="bc-preview-image"><img alt="Barcode preview" hidden><span class="bc-preview-status" role="status" aria-live="polite">Choose a barcode to preview.</span></div><strong class="bc-selected-name"></strong><small class="bc-selected-id"></small></div><label class="bc-data-label">Barcode data<textarea rows="3" spellcheck="false"></textarea></label><label class="bc-readable"><input type="checkbox" checked><span><strong>Readable text</strong><small>Print the data below the barcode</small></span></label><small class="bc-hint">GS1 data uses application identifiers, for example (01)09521234543213.</small><p class="bc-error" role="status"></p></aside></section><footer><button type="button" class="bc-cancel">Cancel</button><button type="button" class="bc-insert">Insert barcode</button></footer>';
  document.body.append(dialog);
  const $=s=>dialog.querySelector(s),folders=window.BarcodeCategories.folders;
  let catalog=[],folder='General Purpose',selected=null,encoded=null,generation=0,timer,editIndex=null,busy=false,thumbObserver;const thumbnailCache=new Map();
  const spec=()=>({bcid:selected.bcid,text:$('textarea').value,show_text:$('[type=checkbox]').checked});
  function bindBarcodeDrag(node,getSpec){
    node.draggable=true;node.title='Drag barcode onto the label';
    node._placementPayload=()=>({kind:'catalog-barcode',value:getSpec()});
    node.addEventListener('dragstart',event=>{
      if(editIndex!==null){event.preventDefault();return;}
      const payload={kind:'catalog-barcode',value:getSpec()};
      event.dataTransfer.effectAllowed='copy';
      event.dataTransfer.setData('application/x-bratender-insert',JSON.stringify(payload));
      // Release the modal focus barrier after the browser creates its drag image.
      setTimeout(()=>{if(dialog.open)dialog.close();},0);
    });
  }
  window.insertCatalogBarcodeAt=async(barcodeSpec,point)=>{
    try{
      const result=await window.zebra.barcodeEncode(barcodeSpec);
      if(!result.ok)throw Error(result.error);
      if(!editing)throw Error('Open a label first.');
      const width=result.bitmap_width*25.4/(Number(editing.dpi)||203);
      const added=insertEditorElement('barcode128',point,null,{deferRender:true});
      if(!added)return;
      Object.assign(added,{type:'image',transparent_background:false,width_mm:width,height_mm:width*result.bitmap_height/result.bitmap_width,bitmap_width:result.bitmap_width,bitmap_height:result.bitmap_height,bitmap_hex:result.bitmap_hex,barcode_spec:barcodeSpec});
      window.noteRecentObjectUsage?.(added);renderEditorElements();updateEditorPreview();touchEditor();void persistEditor();
    }catch(error){setEditorStatus('err',error.message);}
  };
  bindBarcodeDrag($('.bc-preview-image'),spec);
  function render(){
    $('.bc-list').replaceChildren();const query=$('.bc-search').value.trim().toLowerCase();
    const items=window.BarcodeCategories.filterCatalog(catalog,folder,query);
    for(const s of items){const button=document.createElement('button');button.type='button';button.className='bc-card';button.role='option';button.setAttribute('aria-selected',String(selected?.bcid===s.bcid));button.title=s.desc;const image=document.createElement('img');image.alt='';image.loading='lazy';image.dataset.bcid=s.bcid;const name=document.createElement('strong');name.textContent=s.desc;const id=document.createElement('small');id.textContent=s.bcid;const text=document.createElement('span');text.className='bc-card-text';text.append(name,id);image.draggable=false;button.append(image,text);bindBarcodeDrag(button,()=>selected?.bcid===s.bcid?spec():{bcid:s.bcid,text:s.text,show_text:$(' [type=checkbox]'.trim()).checked});button.onclick=()=>choose(s);$('.bc-list').append(button);if(thumbObserver)thumbObserver.observe(button);}
    $('.bc-count').textContent=items.length?`${items.length} types`:'';
    if(!items.length){const p=document.createElement('p');p.className='bc-empty';p.textContent='No matching barcode types.';$('.bc-list').append(p);}
    $('nav').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.folder===folder));
  }
  async function thumbnail(button){const s=catalog.find(item=>item.bcid===button.querySelector('img')?.dataset.bcid),image=button.querySelector('img');if(!s||!image)return;let pending=thumbnailCache.get(s.bcid);if(!pending){pending=window.zebra.barcodeEncode({bcid:s.bcid,text:s.text,show_text:false});thumbnailCache.set(s.bcid,pending);}let result;try{result=await pending;}catch{result={ok:false};}if(!button.isConnected)return;if(result.ok)image.src=result.src;else{button.classList.add('bc-no-thumbnail');const note=document.createElement('small');note.className='bc-thumb-note';note.textContent='Preview not available';button.append(note);}}
  function choose(s){selected=s;$('textarea').value=s.text;render();void preview();}
  let lastAppliedSpec='';
  async function preview(){
    const token=++generation,image=$('.bc-preview img'),status=$('.bc-preview-status');encoded=null;$('.bc-insert').disabled=true;$('.bc-error').textContent='';image.hidden=true;image.removeAttribute('src');status.textContent=selected?'Generating preview…':'Choose a barcode to preview.';
    if(!selected)return;$('.bc-selected-name').textContent=selected.desc;$('.bc-selected-id').textContent=selected.bcid;$('.bc-format').textContent=selected.category==='GS1 Formats'?'GS1':'';
    let result;try{result=await window.zebra.barcodeEncode(spec());}catch(error){if(token!==generation||!dialog.open)return;const message=error?.message||'Barcode preview could not be generated.';$('.bc-error').textContent=message;status.textContent='Preview unavailable.';return;}
    if(token!==generation||!dialog.open)return;
    if(!result?.ok){$('.bc-error').textContent=result?.error||'Barcode preview could not be generated.';status.textContent='Preview unavailable.';return;}
    encoded=result;image.onload=()=>{if(token!==generation||!dialog.open)return;image.hidden=false;status.textContent='';};image.onerror=()=>{if(token!==generation||!dialog.open)return;image.hidden=true;status.textContent='Preview unavailable.';$('.bc-error').textContent='Barcode preview image could not be loaded.';};status.textContent='Loading preview…';image.src=result.src;$('.bc-insert').disabled=busy;if(editIndex!==null&&JSON.stringify(spec())!==lastAppliedSpec)await insert(token);
  }
  function schedule(){++generation;encoded=null;$('.bc-insert').disabled=true;clearTimeout(timer);timer=setTimeout(preview,180);}
  async function insert(token=generation){
    if((busy&&editIndex===null)||!encoded||!selected)return;
    if(typeof editing==='undefined'||!editing){$('.bc-error').textContent='Open a label first.';return;}
    busy=true;$('.bc-insert').disabled=true;
    try{
      readEditorIntoDraft();if(editIndex!==null&&!editing.elements[editIndex])throw Error('This object no longer exists.');
      const old=editIndex===null?null:editing.elements[editIndex];
      const dpi=Number(editing.dpi)||203,barcodeSpec=spec();
      // Keep the catalog barcode as a real barcode object: standard barcode
      // sizing, move/resize handles, and label rendering all depend on this.
      const width=old?.width_mm||encoded.bitmap_width*25.4/dpi;
      const element={...old,type:'image',transparent_background:false,width_mm:width,height_mm:width*encoded.bitmap_height/encoded.bitmap_width,bitmap_width:encoded.bitmap_width,bitmap_height:encoded.bitmap_height,bitmap_hex:encoded.bitmap_hex,barcode_spec:barcodeSpec};
      if(old)element.label=old.label;else delete element.label;
      delete element.barcode_bars;
      if(old?.font_family){const bars=await window.zebra.barcodeEncode({...barcodeSpec,show_text:false});if(!bars.ok)throw Error(bars.error);element.barcode_bars={bitmap_width:bars.bitmap_width,bitmap_height:bars.bitmap_height,bitmap_hex:bars.bitmap_hex};}
      if(token!==generation||!dialog.open)return;
      pushSnapshot();if(old)editing.elements[editIndex]=element;else{
        const added=insertEditorElement('barcode128',null,null,{skipHistory:true,deferRender:true});
        if(!added)throw Error('Could not add barcode to the label.');
        const index=editing.elements.length-1;
        Object.assign(added,element);
        placeNewElementAtBottom(added);
        editorSel=index;editorSelection=new Set([index]);
      }
      editorSel=old?editIndex:editing.elements.length-1;editorSelection=new Set([editorSel]);renderEditorElements();updateEditorPreview();touchEditor();void persistEditor();
      lastAppliedSpec=JSON.stringify(barcodeSpec);
      $('.bc-error').textContent=old?'Barcode updated.':'Barcode inserted. Keep its white quiet zone clear.';
    }catch(error){$('.bc-error').textContent=error.message;}finally{busy=false;$('.bc-insert').disabled=!encoded;}
  }
  window.openAdvancedBarcodePicker=async index=>{
    catalog=window.BarcodeCategories.normalizeCatalog(await window.zebra.barcodeCatalog());editIndex=Number.isInteger(index)?index:null;
    const previous=editIndex===null?null:editing?.elements[editIndex]?.barcode_spec;
    selected=catalog.find(s=>s.bcid===previous?.bcid)||catalog.find(s=>s.bcid==='code128');folder=selected?.category||folders[0];
    $('.bc-search').value='';$('textarea').value=previous?.text||selected.text;$('[type=checkbox]').checked=previous?.show_text!==false;
    lastAppliedSpec=JSON.stringify(spec());$('.bc-cancel').textContent=previous?'Close':'Cancel';
    $('.bc-insert').textContent='Insert';$('.bc-insert').hidden=!!previous;$('nav').replaceChildren();
    for(const name of folders){const b=document.createElement('button');b.type='button';b.dataset.folder=name;b.textContent=`📁 ${name}${name==='All Symbologies'?' ('+catalog.length+')':''}`;b.onclick=()=>{folder=name;render();};$('nav').append(b);}
    render();if(!dialog.open)dialog.showModal();void preview();
  };
  thumbObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){thumbObserver.unobserve(entry.target);void thumbnail(entry.target);}}, {root:$('.bc-list'),rootMargin:'80px'});
  const close=async()=>{clearTimeout(timer);if(editIndex!==null&&JSON.stringify(spec())!==lastAppliedSpec)await preview();++generation;dialog.close();};
  $('header button').onclick=$('.bc-cancel').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();void close();});
  $('.bc-search').oninput=render;$('textarea').oninput=schedule;$('[type=checkbox]').onchange=()=>{clearTimeout(timer);void preview();};$('.bc-insert').onclick=()=>void insert();
  const style=document.createElement('style');style.textContent='#advancedBarcodePicker{box-sizing:border-box;width:min(1540px,calc(100vw - 32px));height:min(700px,calc(100vh - 32px));max-width:96vw;max-height:calc(100vh - 32px);padding:0;overflow:hidden;scrollbar-width:none;color:var(--text,#1f2937);background:var(--card,#fff);border:1px solid var(--border,#d7dee8);border-radius:16px;box-shadow:0 24px 70px #0f172a35}#advancedBarcodePicker::-webkit-scrollbar{display:none}#advancedBarcodePicker[open]{display:flex;flex-direction:column}#advancedBarcodePicker::backdrop{background:#10182775;backdrop-filter:blur(3px)}#advancedBarcodePicker header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border,#d7dee8);flex:none}.bc-heading{display:flex;align-items:center;gap:12px}.bc-heading-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:#e8f7ee;color:#11934d;font-size:23px}.bc-heading strong,.bc-heading small{display:block}.bc-heading strong{font-size:16px}.bc-heading small{margin-top:3px;color:var(--muted,#667085);font-size:12px}#advancedBarcodePicker header>button{width:34px;height:34px;border:0;border-radius:8px;background:transparent;color:var(--muted,#667085);font-size:23px;cursor:pointer}.bc-toolbar{padding:14px 22px 12px;border-bottom:1px solid var(--border,#d7dee8);flex:none}.bc-toolbar nav{display:flex;gap:7px;margin-top:11px;overflow:auto;padding:4px 3px 5px;scrollbar-width:none}.bc-toolbar nav::-webkit-scrollbar{display:none}.bc-toolbar nav button{flex:none;padding:7px 11px;border:1px solid var(--border,#d7dee8);border-radius:999px;background:var(--card,#fff);color:var(--muted,#667085);font:12px Segoe UI,sans-serif;cursor:pointer}.bc-toolbar nav button.active{border-color:#16a34a;background:#e8f7ee;color:#08783b}.bc-search{width:100%;height:38px;box-sizing:border-box;padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:9px;background:var(--card,#fff);color:var(--text,#1f2937);font:13px Segoe UI,sans-serif;outline:none}.bc-search:focus,.bc-data-label textarea:focus{border-color:#16a34a;box-shadow:0 0 0 3px #16a34a20}.bc-workspace{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;flex:1;min-height:0;overflow:hidden;padding:18px 22px}.bc-list-wrap{display:flex;flex-direction:column;min-height:0}.bc-list-heading{display:flex;align-items:center;justify-content:space-between;margin:0 1px 10px;font-size:13px}.bc-count{font-size:11px;color:var(--muted,#667085);font-weight:400}.bc-list{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));align-content:start;gap:10px;overflow:auto;padding:1px 5px 8px 1px}.bc-card{display:flex;flex-direction:column;justify-content:space-between;min-width:0;min-height:128px;padding:10px;border:1px solid var(--border,#d7dee8);border-radius:11px;background:var(--card,#fff);color:var(--text,#1f2937);text-align:left;cursor:pointer;transition:border-color .14s,background .14s,transform .14s}.bc-card:hover{border-color:#67c587;background:#fbfefc;transform:translateY(-1px)}.bc-card[aria-selected=true]{border-color:#16a34a;background:#effaf3;box-shadow:0 0 0 2px #16a34a18}.bc-card img{display:block;width:auto;max-width:100%;height:auto;max-height:72px;object-fit:contain;object-position:center;image-rendering:auto;margin:0 auto;padding:3px;box-sizing:content-box}.bc-card.bc-no-thumbnail img{opacity:0}.bc-card-text{display:flex;flex-direction:column;gap:3px;padding-top:8px}.bc-card-text strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:600}.bc-card-text small{font:10px Consolas,monospace;color:var(--muted,#667085)}.bc-empty{grid-column:1/-1;color:var(--muted,#667085);font-size:13px}.bc-detail{display:flex;flex-direction:column;gap:12px;min-height:0;overflow:hidden;padding:0 4px 8px 17px;border-left:1px solid var(--border,#d7dee8)}.bc-preview{display:flex;flex:1 1 auto;flex-direction:column;min-height:150px;padding:13px;border:1px solid var(--border,#d7dee8);border-radius:12px;background:linear-gradient(145deg,#fbfdfc,#f3f8f5);color:#172b20}.bc-preview-head{display:flex;justify-content:space-between;align-items:center;color:#6b7e72;font-size:9px;font-weight:700;letter-spacing:.09em}.bc-format{padding:3px 7px;border-radius:999px;background:#e4f4e9;color:#168044;font-size:9px;letter-spacing:0}.bc-preview-image{display:grid;place-items:center;flex:1;min-height:100px;margin:7px 0}.bc-preview-image img{max-width:100%;max-height:126px;object-fit:contain;image-rendering:pixelated}.bc-preview-image img[hidden]{display:none}.bc-preview-status{color:var(--muted,#667085);font-size:11px;text-align:center}.bc-selected-name{font-size:13px}.bc-selected-id{margin-top:3px;color:#718096;font:10px Consolas,monospace}.bc-data-label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:600}.bc-data-label textarea{width:100%;min-height:76px;box-sizing:border-box;resize:vertical;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:9px;background:var(--card,#fff);color:var(--text,#1f2937);font:13px Consolas,monospace;outline:none}.bc-readable{display:flex;align-items:center;gap:9px;padding:9px 10px;border:1px solid var(--border,#d7dee8);border-radius:9px;cursor:pointer}.bc-readable input{accent-color:#16a34a}.bc-readable span,.bc-readable strong,.bc-readable small{display:block}.bc-readable strong{font-size:11px}.bc-readable small{margin-top:2px;color:var(--muted,#667085);font-size:10px}.bc-hint{color:var(--muted,#667085);font-size:10px;line-height:1.45}.bc-error{min-height:15px;margin:0;color:#b42318;font-size:11px}#advancedBarcodePicker footer{display:flex;justify-content:flex-end;gap:8px;padding:13px 22px;border-top:1px solid var(--border,#d7dee8);flex:none}#advancedBarcodePicker footer button{padding:7px 13px;border:1px solid var(--border,#cbd5e1);border-radius:8px;background:var(--card,#fff);color:var(--text,#1f2937);font:12px Segoe UI,sans-serif;cursor:pointer}#advancedBarcodePicker .bc-insert{border-color:#11934d;background:#11934d;color:#fff}#advancedBarcodePicker button:disabled{opacity:.45;cursor:default}@media(max-height:620px){#advancedBarcodePicker header{padding:8px 16px}.bc-heading-icon{width:32px;height:32px}.bc-toolbar{padding:8px 16px}.bc-toolbar nav{margin-top:6px}.bc-workspace{padding:8px 16px;gap:10px}.bc-detail{gap:6px;padding-left:10px}.bc-preview{min-height:100px;padding:8px}.bc-preview-image{min-height:44px;margin:3px 0}.bc-preview-image img{max-height:64px}.bc-data-label{gap:3px}.bc-data-label textarea{min-height:42px;padding:6px}.bc-readable{padding:5px 8px}.bc-hint{font-size:9px;line-height:1.2}.bc-error{min-height:0}#advancedBarcodePicker footer{padding:7px 16px}}@media(max-width:760px){#advancedBarcodePicker{width:calc(100vw - 24px);height:calc(100vh - 24px);max-height:calc(100vh - 24px)}.bc-workspace{grid-template-columns:minmax(0,1fr) 245px;gap:10px;padding:12px}.bc-detail{padding-left:10px}.bc-list{grid-template-columns:repeat(auto-fill,minmax(145px,1fr))}}@media(max-width:560px){.bc-workspace{grid-template-columns:1fr;overflow:auto}.bc-list-wrap{min-height:230px}.bc-list{max-height:none;overflow:visible}.bc-detail{overflow:visible;padding:14px 0 0;border-left:0;border-top:1px solid var(--border,#d7dee8)}}';document.head.append(style);
})();
