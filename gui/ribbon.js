(function () {
  'use strict';
  const bar=document.querySelector('.edbar');
  const original=[...bar.querySelectorAll('button')];
  const command=(title)=>original.find(b=>b.title===title);
  const title=bar.querySelector('.ed-title'),copies=document.getElementById('copies');
  bar.replaceChildren();bar.classList.add('word-ribbon');
  const tabs=document.createElement('div');tabs.className='ribbon-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Ribbon tabs');bar.append(tabs);
  const quick=document.createElement('div');quick.className='ribbon-quick';quick.append(title);bar.append(quick);
  const panels=new Map();
  const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 3h10l4 4v14H5z M8 11h8 M8 15h8 M8 18h5"/></svg>';
  const insertIcons={
    Text:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5h16M12 5v15M8 20h8"/></svg>',
    Rectangle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="5" width="16" height="14"/></svg>',
    Ellipse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="12" rx="8" ry="6"/></svg>',
    Line:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 19 19 5"/><circle cx="5" cy="19" r="1"/><circle cx="19" cy="5" r="1"/></svg>',
    Inverse:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4"><rect x="4" y="5" width="16" height="14"/><path d="M8 10h8M8 14h5" stroke="white"/></svg>',
    Picture:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16"/><circle cx="9" cy="9" r="1.5"/><path d="m5 17 4-4 3 3 2-2 5 5"/></svg>',
    'Code 128':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" d="M4 4v16M8 4v16M11 4v16M15 4v16M20 4v16"/><path d="M6 4v16M13 4v16M17 4v16"/></svg>',
    'Code 39':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="3" d="M4 4v16M10 4v16M16 4v16M20 4v16"/><path d="M7 4v16M13 4v16M18 4v16"/></svg>',
    'Code 93':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="1.5" d="M4 4v16M7 4v16M12 4v16M14 4v16M19 4v16M21 4v16"/><path stroke-width="3" d="M9 4v16M17 4v16"/></svg>',
    'EAN-13':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4v16M6 4v16M9 4v16M11 4v16M13 4v16M16 4v16M18 4v16M20 4v16"/><path stroke-width="2" d="M8 4v16M15 4v16"/></svg>',
    'QR code':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h7v7H4zM6 6v3h3V6zM13 4h7v7h-7zM15 6v3h3V6zM4 13h7v7H4zM6 15v3h3v-3zM14 14h3v3h-3zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/></svg>',
    DataMatrix:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v2H6v14H4zM6 8h2v2H6zM10 8h2v2h-2zM14 8h2v2h-2zM10 12h4v2h-4zM8 14h2v2H8zM14 16h2v2h-2zM18 10h2v10h-2z"/></svg>'
  };
  function tab(name){const b=document.createElement('button');b.className='ribbon-tab';b.textContent=name;b.type='button';b.setAttribute('role','tab');const p=document.createElement('div');p.className='ribbon-panel';p.hidden=true;p.setAttribute('role','tabpanel');p.id='ribbon-'+name.toLowerCase();b.setAttribute('aria-controls',p.id);b.onclick=()=>{panels.forEach((v,k)=>{v.panel.hidden=k!==name;v.button.setAttribute('aria-selected',String(k===name));v.button.tabIndex=k===name?0:-1;});};tabs.append(b);bar.append(p);panels.set(name,{panel:p,button:b});return p;}
  function group(panel,name){const g=document.createElement('div');g.className='ribbon-group';const items=document.createElement('div');items.className='ribbon-items';const label=document.createElement('div');label.className='ribbon-group-label';label.textContent=name;g.append(items,label);panel.append(g);return items;}
  function button(g,label,action,source){const b=source||document.createElement('button');b.type='button';b.classList.add('ribbon-command');b.title=label;b.setAttribute('aria-label',label);if(!source)b.innerHTML=insertIcons[label]||icon;if(action)b.onclick=action;const caption=document.createElement('span');caption.className='ribbon-caption';caption.textContent=label;b.append(caption);g.append(b);return b;}
  function existing(g,id,label){return button(g,label,null,original.find(b=>b.id===id)||document.getElementById(id));}
  function modal(g,label){const b=command(label);if(b)button(g,label,null,b);}
  function selectedButton(g,label,fn){const b=button(g,label,fn);b.dataset.requiresSelection='true';return b;}
  const file=tab('File'),home=tab('Home'),insert=tab('Insert'),layout=tab('Layout'),data=tab('Data'),view=tab('View'),tools=tab('Tools'),help=tab('Help');
  let g=group(file,'Document');button(g,'New',()=>document.getElementById('newTemplateBtn').click());modal(g,'Printers and Templates');existing(g,'importTplBtn','Open / Import');button(g,'Save',()=>persistEditor());existing(g,'duplicateTplBtn','Save as');existing(g,'exportTplBtn','Export template');existing(g,'deleteTplBtn','Delete template');
  g=group(file,'Print');existing(g,'edPrintBtn','Print');const count=document.createElement('label');count.className='ribbon-field';count.textContent='Copies';count.append(copies);g.append(count);modal(g,'Print History');button(g,'Export image',()=>document.getElementById('exportPngBtn').click());
  g=group(home,'Clipboard');selectedButton(g,'Cut',()=>copySelectedElement(true));selectedButton(g,'Copy',()=>copySelectedElement());button(g,'Paste',()=>pasteElement());selectedButton(g,'Duplicate',()=>duplicateSelectedElement());selectedButton(g,'Delete object',()=>deleteSelectedElement());
  g=group(home,'History');existing(g,'undoBtn','Undo');existing(g,'redoBtn','Redo');
  g=group(home,'Object properties');modal(g,'Elements');
  for(const [key,label] of [['x_mm','X (mm)'],['y_mm','Y (mm)'],['width_mm','Width (mm)'],['height_mm','Height (mm)'],['thickness_mm','Line (mm)']]){const l=document.createElement('label');l.className='ribbon-field';l.textContent=label;const input=document.createElement('input');input.type='number';input.step='.1';input.dataset.property=key;input.onchange=()=>{const value=Number(input.value);if(!Number.isFinite(value)||!editing||!editorSelection.size)return;readEditorIntoDraft();pushSnapshot();for(const i of editorSelection)editing.elements[i][key]=value;renderEditorElements();drawEditorCanvas();touchEditor();};l.append(input);g.append(l);}
  g=group(insert,'Text and graphics');for(const [type,label] of [['text','Text'],['box','Rectangle'],['ellipse','Ellipse'],['line','Line'],['inverse','Inverse']])button(g,label,()=>document.querySelector('[data-add="'+type+'"]').click());button(g,'Picture',()=>document.getElementById('addImageBtn').click());
  g=group(insert,'Barcodes');for(const [type,label] of [['barcode128','Code 128'],['code39','Code 39'],['code93','Code 93'],['ean13','EAN-13'],['qrcode','QR code'],['datamatrix','DataMatrix']])button(g,label,()=>document.querySelector('[data-add="'+type+'"]').click());
  g=group(layout,'Page');existing(g,'pageSetupOpen','Page Setup');modal(g,'Label Properties');
  g=group(layout,'Align and distribute');for(const source of document.querySelectorAll('#objectTools button')){const action=source.dataset.objectAction;selectedButton(g,source.title,()=>applyObjectAlignment(action)).innerHTML=source.innerHTML+'<span class="ribbon-caption">'+source.title+'</span>';}
  g=group(layout,'Order');function reorder(front){if(!editing||!editorSelection.size)return;readEditorIntoDraft();pushSnapshot();const selected=editing.elements.filter((_,i)=>editorSelection.has(i)),others=editing.elements.filter((_,i)=>!editorSelection.has(i));editing.elements=front?[...others,...selected]:[...selected,...others];editorSelection=new Set(selected.map((_,i)=>front?others.length+i:i));editorSel=[...editorSelection].at(-1);renderEditorElements();drawEditorCanvas();touchEditor();}selectedButton(g,'Bring to front',()=>reorder(true));selectedButton(g,'Send to back',()=>reorder(false));
  g=group(data,'Label data');modal(g,'Values to Print');modal(g,'List Fields');
  g=group(view,'Zoom');function zoom(factor){setPreviewZoom(previewZoom*factor);}button(g,'Zoom in',()=>zoom(1.2));button(g,'Zoom out',()=>zoom(1/1.2));button(g,'Fit page',()=>{previewZoom=1;previewPan={x:0,y:0};drawEditorCanvas();});
  g=group(view,'Workspace');modal(g,'Preview Settings');
  const gridToggle=button(g,'Show grid',()=>document.getElementById('chkGrid').click());
  gridToggle.setAttribute('aria-pressed','true');
  const syncGrid=()=>{const visible=document.getElementById('chkGrid').checked;gridToggle.setAttribute('aria-pressed',String(visible));gridToggle.title=visible?'Hide grid':'Show grid';gridToggle.querySelector('.ribbon-caption').textContent=visible?'Hide grid':'Show grid';gridToggle.classList.toggle('is-active',visible);};
  document.getElementById('chkGrid').addEventListener('change',syncGrid);syncGrid();
  button(g,'Snap to grid',()=>document.getElementById('chkSnap').click());
  g=group(tools,'Application');button(g,'Print calibration',()=>window.openPrintCalibration?.());button(g,'Settings',()=>document.getElementById('settingsBtn').click());button(g,'Printer connection',()=>document.getElementById('settingsBtn').click());
  g=group(help,'Help');button(g,'Keyboard shortcuts',()=>document.getElementById('helpBtn').click());
  function sync(){const e=editing?.elements?.[editorSel];bar.querySelectorAll('[data-requires-selection]').forEach(b=>b.disabled=!editorSelection.size||(b.title.startsWith('Distribute')&&editorSelection.size<3));bar.querySelectorAll('[data-property]').forEach(input=>{const k=input.dataset.property;input.disabled=!e||!(k in e);if(document.activeElement!==input)input.value=e?.[k]??'';});}
  document.addEventListener('preview-updated',sync);sync();panels.get('Home').button.click();
  tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const list=[...tabs.children],i=list.indexOf(document.activeElement);const next=e.key==='Home'?0:e.key==='End'?list.length-1:(i+(e.key==='ArrowRight'?1:-1)+list.length)%list.length;list[next].click();list[next].focus();});
})();
