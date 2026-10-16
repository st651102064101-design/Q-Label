'use strict';

const el = (id) => document.getElementById(id);
const t = (k, v) => window.I18N.t(k, v);
const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function humanize(name) { const s = String(name).replace(/[_\-.]/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }

let templates = [];        // riepiloghi
let current = null;        // riepilogo selezionato
let rawTemplate = null;    // JSON completo del template selezionato (per anteprima/stampa)
let editing = null;        // bozza in modifica (editor)
window.getEditingTemplate = () => editing;
let scanFieldName = null;
let settings = {};
let editorSel = null;      // indice elemento selezionato nell'editor
let editorSelection = new Set(); // multi-selection indices in the editor canvas
let elementClipboard = null;
let lastPastePointMm = null;
let pendingImageDropMm = null;
let pendingImageFormat = 'image';
let pendingImageReplaceIndex = null;
let activeInsertPayload = null;
let sidebarPlacement=null,placementGhost=null,placementFrame=null,placementPointer=null;
function cancelSidebarPlacement(){sidebarPlacement=null;placementGhost?.remove();placementGhost=null;if(placementFrame!==null)cancelAnimationFrame(placementFrame);placementFrame=null;}
function fieldPlacementValue(payload){
  if(payload?.kind==='object-value')return String(payload.value??'');
  if(payload?.kind!=='field')return '';
  const name=String(payload.value||''),data=sampleData(editing);
  if(data&&Object.hasOwn(data,name)&&String(data[name]??'').trim()!=='')return String(data[name]);
  const row=editing?.database_connection?.rows?.[Number(window.databasePreviewRecord)||0];
  if(row&&Object.hasOwn(row,name)&&String(row[name]??'').trim()!=='')return String(row[name]);
  const fields=editing?.database_connection?.fields;
  if(fields&&Object.hasOwn(fields,name)&&String(fields[name]??'').trim()!=='')return String(fields[name]);
  return name;
}
function armSidebarPlacement(source,payload){
  if(!editing)return;
  cancelSidebarPlacement();sidebarPlacement={payload,template:editing};
  placementGhost=document.createElement('div');placementGhost.setAttribute('aria-hidden','true');
  source.blur();
  if(payload.kind==='field'||payload.kind==='object-value'){
    const label=window.ToolPlacement.ghostLabel(fieldPlacementValue(payload),payload.value)||'…';
    placementGhost.className='field-placement-ghost';
    placementGhost.style.cssText='position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;opacity:.92;will-change:transform;box-sizing:border-box;max-width:140px;padding:5px 9px;border:1px solid #16a34a;border-radius:7px;background:#fff;color:#111827;font:600 13px/1.2 "Segoe UI",sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 8px #163b2426;';
    placementGhost.textContent=label;
  }else{
    placementGhost.style.cssText='position:fixed;left:0;top:0;width:39px;height:39px;z-index:2147483647;pointer-events:none;opacity:.75;will-change:transform;';
    const icon=window.ToolPlacement.ghost(source,document);
    if(icon){placementGhost.append(icon);}
    else if(payload.kind==='recent-object'){
      try{const item={...payload.value,x_mm:0,y_mm:0},box=window.LabelPreview.computeBoxes({...editing,elements:[item]},sampleData(editing))[0];placementGhost.innerHTML=window.LabelPreview.renderPreviewSVG({...editing,width_mm:Math.max(1,box?.w||20),height_mm:Math.max(1,box?.h||20),margin_mm:{left:0,top:0},page:{enabled:false},elements:[item]},sampleData(editing),[0],qrCache);placementGhost.querySelector('svg')?.setAttribute('width','36');placementGhost.querySelector('svg')?.setAttribute('height','36');}catch{placementGhost.textContent='+';}
    }else placementGhost.innerHTML='<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18"/><path d="M12 6v12M6 12h12"/></svg>';
  }
  document.body.append(placementGhost);
  if(placementPointer)placementGhost.style.transform=`translate(${placementPointer.x+12}px,${placementPointer.y+12}px)`;
}
document.addEventListener('pointermove',event=>{placementPointer={x:event.clientX,y:event.clientY};if(!sidebarPlacement||placementFrame!==null)return;placementFrame=requestAnimationFrame(()=>{placementFrame=null;if(placementGhost)placementGhost.style.transform=`translate(${placementPointer.x+12}px,${placementPointer.y+12}px)`;});},{passive:true});
document.addEventListener('keydown',event=>{if(sidebarPlacement&&event.key==='Escape'){event.preventDefault();cancelSidebarPlacement();}},true);
document.addEventListener('dragstart',cancelSidebarPlacement,true);
document.addEventListener('click',event=>{
  const source=event.target.closest?.('#insertSidebar .insert-tool,[data-add],[data-insert-tool],.tis-symbol-card,.shape-preset-choice,.bc-card,#insertSidebar .source-item,#addImageBtn');
  const payload=source&&window.ToolPlacement.payload(source);
  if(payload){
    event.preventDefault();event.stopImmediatePropagation();
    armSidebarPlacement(source,payload);
    source.closest('dialog')?.close();
    source.closest('.barcode-menu')?.setAttribute('hidden','');return;
  }
},true);
document.addEventListener('pointerdown',event=>{
  if(!sidebarPlacement||event.button!==0)return;
  if(sidebarPlacement.template!==editing){cancelSidebarPlacement();return;}
  const frame=el('previewFrame'),point=frame?.contains(event.target)?pastePointFromEvent(event):null;
  if(!point)return;
  event.preventDefault();event.stopImmediatePropagation();
  const payload=sidebarPlacement.payload,template=editing,startClient={x:event.clientX,y:event.clientY};
  const svg=liveOverlay(),inverse=svg.getScreenCTM()?.inverse(),ns='http://www.w3.org/2000/svg';
  const ghostImage=placementGhost?.querySelector('svg,img');
  const preview=document.createElementNS(ns,'svg');preview.setAttribute('pointer-events','none');preview.setAttribute('preserveAspectRatio','none');preview.setAttribute('overflow','hidden');
  if(ghostImage?.tagName.toLowerCase()==='svg'){
    preview.setAttribute('viewBox',ghostImage.getAttribute('viewBox')||'0 0 24 24');
    for(const name of ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin'])if(ghostImage.hasAttribute(name))preview.setAttribute(name,ghostImage.getAttribute(name));
    for(const child of ghostImage.childNodes)preview.append(child.cloneNode(true));
  }else if(ghostImage){
    preview.setAttribute('viewBox','0 0 100 100');const image=document.createElementNS(ns,'image');image.setAttribute('href',ghostImage.src);image.setAttribute('width','100');image.setAttribute('height','100');image.setAttribute('preserveAspectRatio','none');preview.append(image);
  }
  preview.setAttribute('width','0');preview.setAttribute('height','0');preview.style.display='none';
  const shapeDraft=payload.kind==='shape-preset'?{shape_preset:payload.value,thickness_mm:.3,fill_color:'none',stroke_color:'#111111'}:payload.kind==='recent-object'&&payload.value.shape_preset?payload.value:null;
  const primitiveDraft=payload.kind==='tool'?createInsertElementDraft(payload.value):payload.kind==='recent-object'?payload.value:null;
  const isLine=primitiveDraft?.type==='line';
  const linePreview=isLine?document.createElementNS(ns,'line'):null;
  if(linePreview){linePreview.setAttribute('stroke',primitiveDraft.stroke_color||'#111');linePreview.setAttribute('stroke-width',primitiveDraft.thickness_mm||.3);linePreview.setAttribute('pointer-events','none');svg.append(linePreview);}
  const naturalBox=payload.kind==='recent-object'?window.LabelPreview.computeBoxes({...editing,elements:[payload.value]},sampleData(editing))[0]:null;
  const aspectRatio=naturalBox?.w&&naturalBox?.h?naturalBox.w/naturalBox.h:shapeDraft?20/15:1;
  preview.style.color='#334155';svg.append(preview);if(placementGhost)placementGhost.style.visibility='hidden';
  const outline=document.createElementNS(ns,'rect');outline.setAttribute('fill','none');outline.setAttribute('stroke','#16a34a');outline.setAttribute('stroke-width','1');outline.setAttribute('vector-effect','non-scaling-stroke');outline.setAttribute('pointer-events','none');svg.append(outline);
  let end=point,latest=event,raf=null;
  const update=()=>{
    raf=null;if(inverse)end=new DOMPoint(latest.clientX,latest.clientY).matrixTransform(inverse);
    if(latest.shiftKey){const dx=end.x-point.x,dy=end.y-point.y;if(isLine){const length=Math.hypot(dx,dy),angle=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4);end={x:point.x+length*Math.cos(angle),y:point.y+length*Math.sin(angle)};}else{const w=Math.max(Math.abs(dx),Math.abs(dy)*aspectRatio);end={x:point.x+(dx<0?-1:1)*w,y:point.y+(dy<0?-1:1)*w/aspectRatio};}}
    const w=Math.abs(end.x-point.x),h=Math.abs(end.y-point.y);
    outline.setAttribute('x',Math.min(point.x,end.x));outline.setAttribute('y',Math.min(point.y,end.y));outline.setAttribute('width',w);outline.setAttribute('height',h);
    for(const attr of ['x','y','width','height'])preview.setAttribute(attr,outline.getAttribute(attr));
    preview.style.display=w>0&&h>0?'':'none';
    if(isLine){preview.style.display='none';outline.style.display='none';linePreview.setAttribute('x1',point.x);linePreview.setAttribute('y1',point.y);linePreview.setAttribute('x2',end.x);linePreview.setAttribute('y2',end.y);return;}
    if(shapeDraft&&w>0&&h>0){preview.setAttribute('viewBox',`0 0 ${w} ${h}`);preview.innerHTML=window.ShapeTools.render({...shapeDraft,width_mm:w,height_mm:h},0,0);}
    else if(primitiveDraft&&w>0&&h>0){
      const draft=structuredClone(primitiveDraft),data=sampleData(editing);
      const original=window.LabelPreview.computeBoxes({...editing,elements:[draft]},data)[0];
      if(original){
        applyElementBox(draft,{x:0,y:0,w:Math.max(.3,w),h:Math.max(.3,h)},original);
        draft.x_mm=0;draft.y_mm=0;
        const box=window.LabelPreview.computeBoxes({...editing,margin_mm:{left:0,top:0},elements:[draft]},data)[0];
        preview.setAttribute('viewBox',`0 0 ${Math.max(.01,box.w)} ${Math.max(.01,box.h)}`);
        preview.setAttribute('width',Math.max(.01,box.w));preview.setAttribute('height',Math.max(.01,box.h));
        preview.removeAttribute('stroke');preview.removeAttribute('stroke-width');
        preview.innerHTML=window.LabelPreview.renderElement(draft,editing.dpi||203,data,qrCache);
      }
    }
  };
  const move=ev=>{latest=ev;if(raf===null)raf=requestAnimationFrame(update);};
  const cleanup=()=>{if(raf!==null)cancelAnimationFrame(raf);outline.remove();preview.remove();linePreview?.remove();window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);document.removeEventListener('keydown',escape,true);document.removeEventListener('keyup',escape,true);};
  const cancel=()=>{cleanup();cancelSidebarPlacement();};
  const escape=ev=>{if(ev.key==='Escape')cancel();else if(ev.key==='Shift'){latest={clientX:latest.clientX,clientY:latest.clientY,shiftKey:ev.type==='keydown'};if(raf===null)raf=requestAnimationFrame(update);}};
  const up=ev=>{
    latest=ev;update();cleanup();cancelSidebarPlacement();if(editing!==template)return;
    const dragged=Math.hypot(ev.clientX-startClient.x,ev.clientY-startClient.y)>4;
    const origin=dragged?{x:Math.min(point.x,end.x),y:Math.min(point.y,end.y)}:point;
    const client=new DOMPoint(origin.x,origin.y).matrixTransform(svg.getScreenCTM());
    const count=editing.elements.length;activeInsertPayload=payload;
    const drop=new Event('drop',{bubbles:true,cancelable:true});Object.assign(drop,{clientX:client.x,clientY:client.y,dataTransfer:{getData:()=>JSON.stringify(payload)}});frame.dispatchEvent(drop);
    if(dragged&&isLine&&editing.elements.length===count+1){const item=editing.elements[count],model=window.LineGeometry.fromEndpoints(point,end,item.thickness_mm);model.x_mm-=Number(editing.margin_mm?.left)||0;model.y_mm-=Number(editing.margin_mm?.top)||0;Object.assign(item,model);renderEditorElements();drawEditorCanvas();touchEditor();return;}
    if(dragged&&editing.elements.length===count+1){const item=editing.elements[count],box=window.LabelPreview.computeBoxes(editing,sampleData(editing)).find(box=>box.index===count);if(box){applyElementBox(item,{x:origin.x,y:origin.y,w:Math.max(.3,Math.abs(end.x-point.x)),h:Math.max(.3,Math.abs(end.y-point.y))},box);renderEditorElements();drawEditorCanvas();touchEditor();}}
  };
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);document.addEventListener('keydown',escape,true);document.addEventListener('keyup',escape,true);
},true);
let editorGrid = { show: true, snap: true, step: 0.5 };
let editorGapVisible = false;
let importedRows = null;   // righe importate da CSV (stampa in blocco)
let databasePreviewRecord = 0;
window.databasePreviewRecord = databasePreviewRecord;
const qrCache = {};        // valore QR -> { size, data } (matrice reale)
let tplFilter = '';        // filtro ricerca template
let history = [];          // storico stampe
let undoStack = [];        // editor: stati precedenti
let redoStack = [];        // editor: stati rifatti
let editRevisions = [];    // persisted editor revisions for the current label
const MAX_EDIT_REVISIONS = 5;
let editHistoryFile = null;
let editHistoryPersistTimer = null;
let defaultCopies = 1;     // copie predefinite (impostazioni)
let printDarkness = '';    // intensità stampa (~SD) globale
let printSpeed = '';       // velocità stampa (^PR) globale
let defaultLanguage = 'zpl'; // linguaggio predefinito per i nuovi modelli
let printInProgress = false;
let appInitializing = true;

const MM_PROPS = ['x_mm', 'y_mm', 'height_mm', 'width_mm', 'bar_height_mm', 'thickness_mm'];
const UNITS = {
  mm: { mm: 1, decimals: 2, step: 0.1, label: 'mm' },
  cm: { mm: 10, decimals: 2, step: 0.01, label: 'cm' },
  in: { mm: 25.4, decimals: 4, step: 0.01, label: 'in' },
  mil: { mm: 0.0254, decimals: 1, step: 1, label: 'mil' },
  pt: { mm: 25.4 / 72, decimals: 1, step: 0.5, label: 'pt' },
  dots: { mm: 0, decimals: 0, step: 1, label: 'dots' },
};

function measureUnit() {
  return (settings && settings.unit) || (editing && editing.unit) || 'mm';
}
function measureDpi() {
  return Number((editing && editing.dpi) || (rawTemplate && rawTemplate.dpi) || 203) || 203;
}
function unitMeta(unit) {
  return UNITS[unit] || UNITS.mm;
}
function mmPerUnit(unit, dpi) {
  if ((unit || measureUnit()) === 'dots') return 25.4 / (dpi || measureDpi());
  return unitMeta(unit || measureUnit()).mm;
}
function mmToUnit(mm, unit, dpi) {
  const n = Number(mm);
  if (!Number.isFinite(n)) return '';
  const u = unit || measureUnit();
  const info = unitMeta(u);
  const v = n / mmPerUnit(u, dpi);
  if (info.decimals === 0) return Math.round(v);
  return parseFloat(v.toFixed(info.decimals));
}
function unitToMm(v, unit, dpi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const u = unit || measureUnit();
  return Math.round(n * mmPerUnit(u, dpi) * 10000) / 10000;
}
function unitSuffix(unit) {
  return unitMeta(unit || measureUnit()).label;
}
function formatSize(wMm, hMm, unit, dpi) {
  const u = unit || 'mm';
  const decimals=u==='in'?3:u==='mil'||u==='dots'?0:2;
  return `${mmToUnit(wMm, u, dpi).toFixed(decimals)} × ${mmToUnit(hMm, u, dpi).toFixed(decimals)} ${unitSuffix(u)}`;
}
function updateMeasureLabels() {
  const u = unitSuffix();
  const w = document.querySelector('[data-i18n="ed.width"]');
  const h = document.querySelector('[data-i18n="ed.height"]');
  if (w) w.textContent = t('ed.width') + ' (' + u + ')';
  if (h) h.textContent = t('ed.height') + ' (' + u + ')';
  const unit=unitMeta(measureUnit()),step=unit.step,dimensionStep=(10**(-unit.decimals)).toFixed(unit.decimals);
  if (el('edW')) el('edW').step = dimensionStep;
  if (el('edH')) el('edH').step = dimensionStep;
  const suffix=unitSuffix();
  for(const id of ['pageTop','pageBottom','pageLeft','pageRight','pageGapX','pageGapY','stockLeft','stockRight','setVerticalOffset']){const input=el(id),label=input?.previousElementSibling;if(label)label.textContent=label.textContent.replace(/\s*\([^)]*\)\s*$/,'')+` (${suffix})`;}
  const gridLabel=document.querySelector('[data-i18n="set.gridStep"]');if(gridLabel)gridLabel.textContent=`Grid step (${suffix})`;
  for(const id of ['setStep','gridStep']){const select=el(id);if(select)for(const option of select.options)option.textContent=`${mmToUnit(Number(option.value),measureUnit(),measureDpi())} ${suffix}`;}
  const offset=el('setVerticalOffset');if(offset){offset.step=String(step);const connection=getConnection(),key=connection.printer||`${connection.type}:${connection.ip||connection.usb||''}`;offset.min=String(mmToUnit(-5,measureUnit(),measureDpi()));offset.max=String(mmToUnit(5,measureUnit(),measureDpi()));if(document.activeElement!==offset)offset.value=String(mmToUnit(settings?.printerVerticalOffsets?.[key]??1.2,measureUnit(),measureDpi()));const help=offset.nextElementSibling;if(help)help.textContent=`Positive moves the print down; negative moves it up. Saved separately for each printer. Default: +${mmToUnit(1.2,measureUnit(),measureDpi())} ${suffix}.`;}
}

function fillPh(str, data) {
  if (typeof str !== 'string') return '';
  return str.replace(/\{\{\s*([\w.\-]+)\s*\}\}/g, (_, k) => { const v = (data || {})[k]; return v == null ? '' : String(v); });
}
function qrValuesOf(tpl, data) {
  const vals = [];
  (tpl.elements || []).forEach((e) => { if (e.type === 'qrcode') { const v = window.ObjectData.resolve(e, data); if (v) vals.push(v); } });
  return vals;
}
function dmValuesOf(tpl, data) {
  const vals = [];
  (tpl.elements || []).forEach((e) => { if (e.type === 'datamatrix') { const v = window.ObjectData.resolve(e, data); if (v) vals.push(v); } });
  return vals;
}
// Recupera QR e DataMatrix mancanti dal processo principale, poi ridisegna.
async function ensureQR(values, rerender, dmValues) {
  let added = false;
  for (const v of values) {
    if (!(v in qrCache)) {
      qrCache[v] = { size: 0 };
      try { const m = await window.zebra.qrMatrix(v); if (m && m.size) { qrCache[v] = m; added = true; } } catch (_) {}
    }
  }
  for (const v of (dmValues || [])) {
    const key = 'dm:' + v;
    if (!(key in qrCache)) {
      qrCache[key] = '';
      try { const url = await window.zebra.dmImage(v); if (url) { qrCache[key] = url; added = true; } } catch (_) {}
    }
  }
  if (added && typeof rerender === 'function') rerender();
}

// Parser CSV semplice: rileva delimitatore (, o ;), gestisce virgolette. Prima riga = intestazioni.
function parseCSV(text) {
  text = text.replace(/^﻿/, ''); // rimuove il BOM aggiunto da Excel
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim().length);
  if (!lines.length) return [];
  const delim = lines[0].split(';').length > lines[0].split(',').length ? ';' : ',';
  const parseLine = (line) => {
    const out = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else { if (c === '"') q = true; else if (c === delim) { out.push(cur); cur = ''; } else cur += c; }
    }
    out.push(cur); return out;
  };
  const headers = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cells = parseLine(l); const o = {};
    headers.forEach((h, i) => { o[h] = (cells[i] ?? '').trim(); });
    return o;
  });
}

/* ============================ STAMPA ============================ */

function pickScanField(fields) {
  const textFields = fields.filter((f) => !f.type || f.type === 'text');
  const priority = textFields.find((f) => /codice|cf|barcode|qr|matricola|seriale|ean/i.test(f.name));
  return (priority || textFields[textFields.length - 1] || null)?.name || null;
}
function fieldLabel(field) { return field.label || humanize(field.name); }

function placeholderNames(tpl) {
  const found = [];
  const seen = new Set();
  const re = /\{\{\s*([\w.\-]+)\s*\}\}/g;
  for (const e of (tpl && tpl.elements) || []) {
    const texts=typeof e.text==='string'?[e.text]:[];
    if(e.table_model)for(const row of e.table_model.values||[])for(const value of row||[])texts.push(String(value??''));
    for(const text of texts){re.lastIndex=0;let m;while((m=re.exec(text))){if(!seen.has(m[1])){seen.add(m[1]);found.push(m[1]);}}}
  }
  return found;
}

function seedTemplateValues(tpl, file) {
  if (!tpl.values || typeof tpl.values !== 'object') tpl.values = {};
  const page = file && (settings.pages || {})[file];
  if (page && page.data) {
    placeholderNames(tpl).forEach((n) => {
      if ((tpl.values[n] == null || tpl.values[n] === '') && page.data[n]) tpl.values[n] = page.data[n];
    });
  }
  return tpl.values;
}

function renderFields(tpl) {
  const container = el('fields');
  container.innerHTML = '';
  scanFieldName = null;
  const values = (rawTemplate && rawTemplate.values) || {};
  const fields = tpl.fields || [];
  const hint = el('printValuesHint');
  if (hint) hint.style.display = fields.length ? 'block' : 'none';
  fields.forEach((field) => {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const label = document.createElement('label');
    label.textContent = fieldLabel(field);
    wrap.appendChild(label);
    const val = document.createElement('div');
    val.className = 'value-ro';
    const v = values[field.name];
    val.textContent = (v != null && String(v) !== '') ? String(v) : '—';
    wrap.appendChild(val);
    container.appendChild(wrap);
  });
}

function renderElementsToggle(tpl) {
  const box = el('elementsBox'); const container = el('elements');
  if (!box || !container) return;
  container.innerHTML = '';
  box.style.display = 'none';
}

function onFieldKeydown(e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const inputs = Array.from(document.querySelectorAll('#fields input[data-field]'));
  const idx = inputs.indexOf(e.target);
  if (idx > -1 && idx < inputs.length - 1) inputs[idx + 1].focus();
  else doPrint();
}

function collectData() {
  const data = {};
  const src = (el('editorView').style.display !== 'none' && editing) ? editing : rawTemplate;
  if (src && src.values) Object.assign(data, src.values);
  document.querySelectorAll('#edValues [data-value-name]').forEach((inp) => {
    data[inp.dataset.valueName] = (inp.value || '').trim();
  });
  return data;
}
function collectMulti() {
  const qtys = Array.from(document.querySelectorAll('#fields .qty[data-multi]'));
  if (qtys.length === 0) return null;
  const field = qtys[0].dataset.multi;
  const items = qtys.map((q) => ({ value: q.dataset.value, qty: Number(q.value) || 0 })).filter((it) => it.qty > 0);
  return { field, items };
}
function collectEnabledIndices() {
  if (el('editorView').style.display !== 'none' && editing) {
    return (editing.elements || []).map((e, i) => (e.enabled === false ? -1 : i)).filter((i) => i >= 0);
  }
  return (rawTemplate?.elements || []).map((_, i) => i);
}
function getConnection() {
  const type = el('connType').value;
  if (type === 'printer') return { type, printer: el('printerSelect').value };
  if (type === 'ip') return { type, ip: el('ipInput').value.trim(), port: 9100 };
  if (type === 'usb') return { type, usb: el('usbInput').value.trim() };
  return { type };
}
function setStatus(kind, msg) { setEditorStatus(kind, msg); }
function applyTheme(t) {
  document.body.classList.toggle('dark', t === 'dark');
  const b = el('themeBtn'); if (b) b.textContent = t === 'dark' ? '☀️' : '🌙';
}

// Applica le impostazioni salvate ai controlli e alle variabili globali.
function applySettings(s) {
  applyTheme(s.theme || 'light');
  defaultCopies = Number(s.defaultCopies) || 1;
  printDarkness = (s.darkness === undefined || s.darkness === null) ? '' : s.darkness;
  printSpeed = (s.speed === undefined || s.speed === null) ? '' : s.speed;
  defaultLanguage = 'zpl';
  editorGrid.show = s.gridShow !== false;
  editorGrid.snap = s.gridSnap !== false;
  editorGrid.step = Number(s.gridStep) || 0.5;
  // sincronizza i controlli inline dell'anteprima
  if (el('chkGrid')) el('chkGrid').checked = editorGrid.show;
  if (el('chkSnap')) el('chkSnap').checked = editorGrid.snap;
  if (el('gridStep')) el('gridStep').value = String(editorGrid.step);
}

// Popola i campi del pannello Impostazioni dai valori correnti.
function fillSettingsModal() {
  const connection = getConnection();
  const key = connection.printer || `${connection.type}:${connection.ip || connection.usb || ''}`;
  el('setVerticalOffset').value = mmToUnit(settings.printerVerticalOffsets?.[key] ?? 1.2, settings.unit||'mm', measureDpi());
  el('setTheme').value = document.body.classList.contains('dark') ? 'dark' : 'light';
  el('setCopies').value = defaultCopies || 1;
  el('setDarkness').value = printDarkness === '' ? '' : printDarkness;
  el('setSpeed').value = printSpeed === '' ? '' : printSpeed;
  el('setGrid').checked = editorGrid.show;
  el('setSnap').checked = editorGrid.snap;
  if(el('setAutoSave'))el('setAutoSave').checked=autoSaveEnabled;
  el('setStep').value = String(editorGrid.step);
  if (el('setUnit')) el('setUnit').value = (settings && settings.unit) || 'mm';
}

// Legge il pannello, aggiorna variabili + controlli e salva.
function commitSettings() {
  const connection = getConnection();
  const key = connection.printer || `${connection.type}:${connection.ip || connection.usb || ''}`;
  settings.printerVerticalOffsets = settings.printerVerticalOffsets || {};
  const previousUnit=settings.unit||'mm';
  settings.printerVerticalOffsets[key] = Math.max(-5, Math.min(5, unitToMm(el('setVerticalOffset').value, previousUnit, measureDpi())));
  const theme = el('setTheme').value;
  applyTheme(theme);
  defaultCopies = Math.max(1, Number(el('setCopies').value) || 1);
  printDarkness = el('setDarkness').value === '' ? '' : Math.max(0, Math.min(30, Number(el('setDarkness').value)));
  printSpeed = el('setSpeed').value === '' ? '' : Math.max(1, Math.min(6, Number(el('setSpeed').value)));
  defaultLanguage = 'zpl';
  editorGrid.show = el('setGrid').checked;
  editorGrid.snap = el('setSnap').checked;
  editorGrid.step = Number(el('setStep').value) || 0.5;
  if (el('chkGrid')) el('chkGrid').checked = editorGrid.show;
  if (el('chkSnap')) el('chkSnap').checked = editorGrid.snap;
  if (el('gridStep')) el('gridStep').value = String(editorGrid.step);
  const unit = (el('setUnit') && UNITS[el('setUnit').value]) ? el('setUnit').value : ((settings && settings.unit) || 'mm');
  settings.unit = unit;
  updateMeasureLabels();
  window.zebra.saveSettings({
    theme, defaultCopies, darkness: printDarkness, speed: printSpeed,
    printerVerticalOffsets: settings.printerVerticalOffsets,
    defaultLanguage: 'zpl', gridShow: editorGrid.show, gridSnap: editorGrid.snap, gridStep: editorGrid.step,
    unit,
  });
  if (el('editorView').style.display !== 'none') {
    if (editing) { editing.unit = unit; if (editing.page) editing.page.unit = unit; refreshEditorUI(); touchEditor(); }
    updateEditorPreview();
  }
}

function rememberPrintPage() {
  if (!current) return;
  rememberPrintPageInMemory();
  window.zebra.saveSettings({ pages: settings.pages });
}
function rememberPrintPageInMemory() {
  if (!current) return;
  const multi = {};
  document.querySelectorAll('#fields .qty[data-multi]').forEach((q) => { multi[q.dataset.value] = q.value; });
  const pages = Object.assign({}, settings.pages || {});
  pages[current.file] = {
    data: collectData(),
    copies: el('copies').value,
    enabled: collectEnabledIndices(),
    multi,
  };
  settings.pages = pages;
}
const rememberPrintPageSoon = debounce(rememberPrintPage, 250);

function applyPrintPage(file) {
  const page = (settings.pages || {})[file];
  if (!page) return;
  if (page.data) {
    Object.keys(page.data).forEach((k) => {
      const node = el('f_' + k);
      if (node) node.value = page.data[k];
    });
  }
  if (page.multi) {
    document.querySelectorAll('#fields .qty[data-multi]').forEach((q) => {
      if (page.multi[q.dataset.value] != null) q.value = page.multi[q.dataset.value];
    });
  }
  if (Array.isArray(page.enabled)) {
    document.querySelectorAll('.elem-cb').forEach((cb) => {
      cb.checked = page.enabled.includes(Number(cb.dataset.index));
    });
  }
  if (page.copies) el('copies').value = page.copies;
}

function getPreviewJob() {
  const inEditor = el('editorView').style.display !== 'none';
  if (inEditor) {
    if (!editing) return null;
    return {
      template: editing,
      data: sampleData(editing),
      enabledIndices: (editing.elements || []).map((_, i) => i),
      editor: true,
    };
  }
  if (!rawTemplate) return null;
  let data = collectData();
  if (importedRows && importedRows.length) data = { ...data, ...importedRows[0] };
  const multi = collectMulti();
  if (multi) {
    const first = multi.items[0];
    data[multi.field] = first ? first.value : (current.fields.find((f) => f.name === multi.field)?.options?.[0] || '');
  }
  return { template: rawTemplate, data, enabledIndices: collectEnabledIndices(), editor: false };
}

function stylePreviewVisual(node) {
  node.classList.add('visual');
  node.style.width = '100%';
  node.style.height = 'auto';
  node.style.imageRendering = 'pixelated';
  return node;
}

function replacePreviewVisual(node) {
  const wrap = el('previewFrame').querySelector('.canvaswrap');
  stylePreviewVisual(node);
  if (wrap) {
    const old = wrap.querySelector('.visual');
    if (old) old.replaceWith(node);
    else wrap.insertBefore(node, wrap.firstChild);
  } else {
    el('previewFrame').innerHTML = '';
    el('previewFrame').appendChild(node);
  }
}

let previewGen = 0;
let printerPreviewTimer = null;
function schedulePrinterPreview() {
  /* Live preview stays local so the label never goes blank while a remote render loads. */
}
async function runPrinterPreview() {
  return;
}

function updatePrintPreview() {
  if (!rawTemplate) return;
  let data = collectData();
  if (importedRows && importedRows.length) {
    data = { ...data, ...importedRows[0] }; // anteprima con la prima riga del CSV
  }
  const multi = collectMulti();
  if (multi) { const first = multi.items[0]; data[multi.field] = first ? first.value : (current.fields.find(f => f.name === multi.field)?.options?.[0] || ''); }
  ensureQR(qrValuesOf(rawTemplate, data), updatePrintPreview, dmValuesOf(rawTemplate, data));
  el('previewFrame').innerHTML = window.LabelPreview.renderPreviewSVG(rawTemplate, data, collectEnabledIndices(), qrCache);
  el('previewNote').textContent = `${formatSize(rawTemplate.width_mm, rawTemplate.height_mm, rawTemplate.unit, rawTemplate.dpi)} · ${rawTemplate.dpi || 203} dpi`;
  rememberPrintPageSoon();
}

async function exportPrintImage() {
  return window.openImageExport();
}
async function testConnection() {
  const box = el('connStatus');
  box.style.color = '#94a3b8';
  box.textContent = t('dyn.testRunning');
  const r = await window.zebra.testConnection(getConnection());
  box.style.color = r.ok ? '#16a34a' : '#dc2626';
  box.textContent = (r.ok ? '✓ ' : '✗ ') + (r.ok ? r.message : (r.error || 'errore'));
}

async function refreshServerStatus() {
}

async function runDiagnostics() {
  const box = el('diagResults');
  box.innerHTML = '<span style="color:var(--muted);font-size:12px;">' + t('dyn.diagRunning') + '</span>';
  const res = await window.zebra.diagnose(getConnection());
  const rows = (res && res.results) || [];
  if (!rows.length) { box.innerHTML = ''; return; }
  box.innerHTML = rows.map((r) =>
    `<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border:1px solid var(--border);border-radius:7px;margin-bottom:6px;background:var(--card);">
      <span style="font-size:14px;">${r.ok ? '✅' : '❌'}</span>
      <div style="font-size:12px;"><b>${r.label}</b><br><span style="color:var(--muted);">${r.detail}</span></div>
    </div>`).join('');
}

async function exportTemplate() {
  let tpl;
  if (el('editorView').style.display !== 'none' && editing) { readEditorIntoDraft(); tpl = editing; }
  else tpl = rawTemplate;
  if (!tpl) return;
  const base = (el('edName') && el('edName').value.trim()) || tpl.name || 'template';
  const r = await window.zebra.saveFile({ defaultName: base + '.json', content: JSON.stringify(tpl, null, 2) });
  if (!r.canceled) setEditorStatus('ok', t('dyn.exported', { p: r.path }));
}

async function exportTemplateSVG() {
  if (el('editorView').style.display !== 'none' && editing) readEditorIntoDraft();
  const tpl = editing || rawTemplate;
  if (!tpl) return;
  const base = (el('edName') && el('edName').value.trim()) || tpl.name || 'template';
  const data = collectData();
  const svg = window.LabelPreview.renderPreviewSVG(tpl, data, collectEnabledIndices(), qrCache, {
    paperPage: !!tpl.page?.enabled,
    designSheet: true,
  });
  const result = await window.zebra.saveFile({ defaultName: `${base}.svg`, content: svg });
  if (!result.canceled) setEditorStatus('ok', t('dyn.exported', { p: result.path }));
}

async function shareExport(format) {
  el('shareExportDialog')?.close();
  if (format === 'json') return exportTemplate();
  if (format === 'svg') return exportTemplateSVG();
  if (format === 'png') return exportPrintImage();
}

async function importTemplate() {
  if(!await window.prepareEditorNavigation())return;
  const r = await window.zebra.pickFile('json');
  if (r.canceled) { if (r.error) setEditorStatus('err', r.error); return; }
  let json;
  try { json = JSON.parse(r.content); } catch (e) { setEditorStatus('err', t('dyn.badJson', { e: e.message })); return; }
  const fileName = json.name || r.name.replace(/\.json$/i, '') || 'importato';
  const res = await window.zebra.saveTemplate(fileName, json);
  if (res && res.ok) {
    await reloadTemplates();
    await selectTemplate(res.file);
    openEditor(json);
    window.hideProjectHome?.();
    setEditorStatus('ok', t('dyn.imported'));
  } else setEditorStatus('err', res?.error || 'Import error.');
}

function livePrintTemplate() {
  if (el('editorView').style.display !== 'none' && editing) {
    readEditorIntoDraft();
    return JSON.parse(JSON.stringify(editing));
  }
  return rawTemplate ? JSON.parse(JSON.stringify(rawTemplate)) : null;
}

function setPrintButtonMessage(button, message) {
  if (!button) return;
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6 M6 17H3V9h18v8h-3 M6 14h12v7H6z M17 12h1"/></svg>';
  const status = document.createElement('span'); status.className = 'toolbar-status'; status.textContent = message; button.append(status);
  button.setAttribute('aria-label',message); button.title=message;
}
async function doPrint() {
  if (printInProgress) return;
  printInProgress = true;
  const button = el('edPrintBtn');
  let buttonResult = 'sent';
  let buttonMessage = 'Sent to printer';
  let buttonError = '';
  if (button) {
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    setPrintButtonMessage(button, 'Preparing print…');
  }
  setStatus('info', 'Preparing print…');
  try {
    // Let Chromium paint the disabled/progress state before IPC or disk work.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (el('editorView').style.display !== 'none') await persistEditor();
    const tpl = livePrintTemplate();
    if (!tpl && !current) throw new Error('Select or create a template before printing.');
    const data = collectData();
    const mult = Number(el('copies').value) || 1;
    const file = (current && current.file) || ((tpl && tpl.name) ? tpl.name + '.json' : '');

    // Stampa in blocco da CSV
    if (importedRows && importedRows.length) {
      const total = importedRows.length * mult;
      setStatus('info', t('dyn.sendingCsv', { n: total }));
      if (button) setPrintButtonMessage(button, 'Printing…');
      const payload = {
        file, template: tpl, data, copies: el('copies').value, connection: getConnection(),
        enabledIndices: collectEnabledIndices(), rows: importedRows,
        darkness: printDarkness, speed: printSpeed,
      };
      const res = await window.zebra.print(payload);
      if (res && res.ok) { setStatus('ok', t('dyn.sentCsv', { n: res.count })); await recordHistory(payload, res.count); }
      else { buttonResult = 'failed'; buttonMessage = 'Print failed — Retry'; buttonError = res?.error || 'Unknown printer error'; setStatus('err', t('dyn.printErr', { e: buttonError })); }
      return;
    }

    const multi = collectMulti();
    if (multi && multi.items.length === 0) { buttonResult = 'failed'; buttonMessage = 'Print failed — Retry'; setStatus('err', t('dyn.tubesMin')); return; }
    const total = multi ? multi.items.reduce((s, it) => s + it.qty, 0) * mult : mult;
    setStatus('info', t('dyn.sending', { n: total }));
    if (button) setPrintButtonMessage(button, 'Printing…');
    const payload = {
      file, template: tpl, data, copies: el('copies').value, connection: getConnection(),
      enabledIndices: collectEnabledIndices(), multiField: multi ? multi.field : null, multiItems: multi ? multi.items : null,
      darkness: printDarkness, speed: printSpeed,
    };
    const res = await window.zebra.print(payload);
    if (res && res.ok) {
      setStatus('ok', t('dyn.sent', { n: res.count }));
      await recordHistory(payload, res.count);
    } else { buttonResult = 'failed'; buttonMessage = 'Print failed — Retry'; buttonError = res?.error || 'Unknown printer error'; setStatus('err', t('dyn.printErr', { e: buttonError })); }
  } catch (error) {
    buttonResult = 'failed';
    buttonMessage = 'Print failed — Retry';
    buttonError = error?.message || String(error);
    setStatus('err', t('dyn.printErr', { e: buttonError }));
  } finally {
    printInProgress = false;
    if (button) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      setPrintButtonMessage(button, buttonMessage);
      button.title = buttonError || (buttonResult === 'sent' ? 'The printer accepted the label.' : 'Click to retry printing.');
      window.setTimeout(() => { if (!printInProgress && button) setPrintButtonMessage(button, t('ed.print')); }, buttonResult === 'sent' ? 1800 : 5000);
    }
  }
}

function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function sampleForField(name) {
  if (/codice|cf|sku|ean|barcode|matricola|seriale|id/i.test(name)) return 'ABC-123456';
  return humanize(name);
}

async function downloadCsvTemplate() {
  if (!current) return;
  const fields = current.fields.map((f) => f.name);
  if (!fields.length) { setStatus('err', t('dyn.csvNoFields')); return; }
  const header = fields.map(csvCell).join(',');
  const sample = fields.map((f) => csvCell(sampleForField(f))).join(',');
  const content = '﻿' + header + '\r\n' + sample + '\r\n'; // BOM per Excel
  const r = await window.zebra.saveFile({ defaultName: current.name + '-esempio.csv', content });
  if (!r.canceled) setStatus('ok', t('dyn.csvSaved', { p: r.path }));
}

let csvRaw = null; // { name, cols, rows } dell'ultimo CSV importato

// Ricostruisce importedRows applicando la mappatura campo→colonna scelta nei menu.
function applyCsvMapping() {
  if (!csvRaw || !current) return;
  const map = {};
  current.fields.forEach((f) => { const s = el('map_' + f.name); if (s) map[f.name] = s.value; });
  importedRows = csvRaw.rows.map((r) => {
    const o = {};
    current.fields.forEach((f) => { const col = map[f.name]; o[f.name] = col ? (r[col] ?? '') : ''; });
    return o;
  });
  updatePrintPreview();
}

async function importCsv() {
  if (!current) return;
  const r = await window.zebra.pickFile('csv');
  if (r.canceled) { if (r.error) setStatus('err', r.error); return; }
  const rows = parseCSV(r.content);
  if (!rows.length) { setStatus('err', t('dyn.csvNoRows')); return; }

  const cols = Object.keys(rows[0]);
  csvRaw = { name: r.name, cols, rows };
  const fields = current.fields;

  const banner = el('csvBanner');
  banner.style.display = 'block';
  const norm = (s) => s.toLowerCase().replace(/[_\-.\s]/g, '');
  const rowsHtml = fields.map((f) => {
    const autoCol = cols.find((c) => norm(c) === norm(f.name)) || '';
    const opts = [`<option value="">${t('dyn.csvEmpty')}</option>`]
      .concat(cols.map((c) => `<option value="${c}"${c === autoCol ? ' selected' : ''}>${c}</option>`))
      .join('');
    return `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
      <span style="min-width:150px;font-weight:600;">${fieldLabel(f)}</span>
      <span style="color:var(--muted);">←</span>
      <select id="map_${f.name}" style="flex:1;">${opts}</select>
    </div>`;
  }).join('');

  banner.innerHTML = t('dyn.csvMap', { n: rows.length, name: r.name }) +
    `<div style="margin:8px 0;">${rowsHtml}</div>` +
    `${t('dyn.csvThenPrint')} <a href="#" id="csvCancel">${t('dyn.csvCancel')}</a>`;
  el('csvCancel').onclick = (e) => { e.preventDefault(); csvRaw = null; importedRows = null; banner.style.display = 'none'; updatePrintPreview(); };
  fields.forEach((f) => { const s = el('map_' + f.name); if (s) s.addEventListener('change', applyCsvMapping); });
  applyCsvMapping();
}

/* ============================ SIDEBAR / TEMPLATE ============================ */

function renderTemplateList() {
  const list = el('tplList'); list.innerHTML = '';
  if (!templates.length) {
    const empty = document.createElement('div');
    empty.className = 'mini';
    empty.textContent = 'No templates. Use + New template to create one.';
    list.appendChild(empty);
    return;
  }
  const q = tplFilter.trim().toLowerCase();
  templates
    .filter((tpl) => !q || tpl.name.toLowerCase().includes(q) || (tpl.description || '').toLowerCase().includes(q))
    .forEach((tpl) => {
      const b = document.createElement('button');
      b.innerHTML = `${tpl.name}<br><span class="tag">${formatSize(tpl.width_mm, tpl.height_mm, tpl.unit, tpl.dpi)} · ${tpl.editable ? t('dyn.custom') : t('dyn.factory')}</span>`;
      if (current && tpl.file === current.file) b.classList.add('active');
      b.onclick = () => selectTemplate(tpl.file);
      list.appendChild(b);
    });
}

/* ---- Storico stampe ---- */
function historyPreviewTemplate(payload) {
  const template = payload?.template;
  if (!template) return null;
  const data = payload.data || {};
  return {
    template: {
      ...template,
      elements: (template.elements || []).map((element) => (
        element.type === 'text' && !(window.ObjectData?.resolve(element, data) || '').trim()
          ? { ...element, text: 'Text' }
          : element
      )),
    },
    data,
    enabled: payload.enabledIndices,
  };
}
function liveHistorySvg(entry) {
  const job = historyPreviewTemplate(entry?.payload);
  if (!job || !window.LabelPreview) return '';
  return window.LabelPreview.renderPreviewSVG(job.template, job.data, job.enabled, qrCache, { paperPage: true, designSheet: true, editorPlaceholders: true });
}
async function captureHistoryPreview(payload) {
  const job = historyPreviewTemplate(payload);
  if (!job || !window.LabelPreview) return '';
  try {
    await ensureQR(qrValuesOf(job.template, job.data), null, dmValuesOf(job.template, job.data));
    const svg = window.LabelPreview.renderPreviewSVG(job.template, job.data, job.enabled, qrCache, { paperPage: true, designSheet: true });
    const paper = job.template.page?.enabled ? job.template.page : job.template;
    const widthMm = Number(paper.width_mm) || 50, heightMm = Number(paper.height_mm) || 25;
    const scale = 720 / Math.max(widthMm, heightMm);
    const width = Math.max(1, Math.round(widthMm * scale)), height = Math.max(1, Math.round(heightMm * scale));
    const url = URL.createObjectURL(new Blob([svg.replace('<svg ', `<svg width="${width}" height="${height}" `)], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('preview')); image.src = url; });
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.82);
    } finally { URL.revokeObjectURL(url); }
  } catch (_) { return ''; }
}
function historyPreviewDialog() {
  let dialog = el('historyPreviewDialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'historyPreviewDialog';
  dialog.className = 'hist-preview-dialog';
  dialog.innerHTML = '<header><strong id="histPreviewTitle"></strong><button type="button" class="hist-preview-close" aria-label="Close">×</button></header><div class="hist-preview-body" id="histPreviewBody"></div><footer><button type="button" class="ghost" id="histPreviewReprint"></button><button type="button" id="histPreviewDone"></button></footer>';
  dialog.querySelector('#histPreviewReprint').textContent = t('dyn.reprint');
  dialog.querySelector('#histPreviewDone').textContent = t('common.close');
  document.body.append(dialog);
  const close = () => dialog.close();
  dialog.querySelector('.hist-preview-close').onclick = close;
  dialog.querySelector('#histPreviewDone').onclick = close;
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  return dialog;
}
async function showHistoryPreview(index) {
  const entry = history[index];
  if (!entry) return;
  if (!entry.preview) {
    const job = historyPreviewTemplate(entry.payload);
    if (job) await ensureQR(qrValuesOf(job.template, job.data), null, dmValuesOf(job.template, job.data));
  }
  const dialog = historyPreviewDialog();
  const when = entry.ts ? new Date(entry.ts).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  dialog.querySelector('#histPreviewTitle').textContent = [entry.templateName || t('dyn.historyPreview'), when].filter(Boolean).join(' · ');
  const body = dialog.querySelector('#histPreviewBody');
  body.replaceChildren();
  if (entry.preview) {
    const image = document.createElement('img');
    image.src = entry.preview;
    image.alt = entry.templateName || t('dyn.historyPreview');
    body.append(image);
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'hist-preview-svg';
    const svg = liveHistorySvg(entry);
    if (svg) wrap.innerHTML = svg;
    else wrap.textContent = t('dyn.historyNoPreview');
    body.append(wrap);
  }
  dialog.querySelector('#histPreviewReprint').onclick = () => { dialog.close(); reprint(index); };
  dialog.showModal();
}
async function recordHistory(payload, count) {
  const stored = { ...payload };
  delete stored.recordTemplates;
  if (Array.isArray(stored.rows) && stored.rows.length > 500) stored.rows = stored.rows.slice(0, 500);
  const entry = { ts: Date.now(), templateName: current ? current.name : (payload.file || 'Label'), count, payload: stored, preview: '' };
  history.unshift(entry);
  history = history.slice(0, 15);
  renderHistory();
  entry.preview = await captureHistoryPreview(stored);
  window.zebra.saveSettings({ history });
  renderHistory();
}
function renderHistory() {
  const box = el('historyBox'), listEl = el('historyList');
  if (!box || !listEl) return;
  box.style.display = 'block';
  listEl.replaceChildren();
  if (!history.length) {
    const empty = document.createElement('p');
    empty.className = 'hist-empty';
    empty.textContent = t('dyn.historyEmpty');
    listEl.append(empty);
    return;
  }
  history.forEach((entry, index) => {
    const when = new Date(entry.ts).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const item = document.createElement('article');
    item.className = 'hist-item' + (entry.preview || entry.payload?.template ? ' has-preview' : '');
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'hist-thumb';
    thumb.title = t('dyn.historyView');
    thumb.setAttribute('aria-label', t('dyn.historyView'));
    if (entry.preview) {
      const image = document.createElement('img');
      image.src = entry.preview;
      image.alt = entry.templateName || t('dyn.historyPreview');
      thumb.append(image);
    } else {
      const svgWrap = document.createElement('div');
      svgWrap.className = 'hist-thumb-svg';
      const svg = liveHistorySvg(entry);
      if (svg) svgWrap.innerHTML = svg;
      else svgWrap.classList.add('is-empty');
      thumb.append(svgWrap);
    }
    thumb.onclick = () => showHistoryPreview(index);
    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('b');
    title.textContent = `${entry.templateName || 'Label'} — ${entry.count} ${t('dyn.labels')}`;
    const time = document.createElement('small');
    time.textContent = when;
    meta.append(title, document.createElement('br'), time);
    const actions = document.createElement('div');
    actions.className = 'hist-actions';
    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'ghost';
    view.textContent = t('dyn.historyView');
    view.onclick = () => showHistoryPreview(index);
    const reprintBtn = document.createElement('button');
    reprintBtn.type = 'button';
    reprintBtn.className = 'ghost';
    reprintBtn.textContent = t('dyn.reprint');
    reprintBtn.onclick = () => reprint(index);
    actions.append(view, reprintBtn);
    item.append(thumb, meta, actions);
    listEl.append(item);
  });
}
async function reprint(i) {
  const h = history[i]; if (!h) return;
  setStatus('info', t('dyn.sending', { n: h.count || '' }));
  const res = await window.zebra.print(h.payload);
  if (res && res.ok) setStatus('ok', t('dyn.reprinted', { n: res.count }));
  else setStatus('err', t('dyn.printErr', { e: res?.error || '?' }));
}
window.PrintHistory = { render: renderHistory, record: recordHistory, show: showHistoryPreview, items: () => history, set(items) { history = Array.isArray(items) ? items : []; renderHistory(); } };

const startupDeadline=Date.now()+15000;
const startupTimeout=Symbol('startup-timeout');
async function startupRequest(label,action,fallback){
  const remaining=Math.max(0,startupDeadline-Date.now());
  if(!remaining){console.warn(`Startup continued without ${label}: startup IPC deadline elapsed.`);return fallback;}
  let timer;
  try{
    const value=await Promise.race([Promise.resolve().then(action),new Promise(resolve=>{timer=setTimeout(()=>resolve(startupTimeout),remaining);})]);
    if(value===startupTimeout){console.warn(`Startup continued without ${label}: IPC did not respond in time.`);return fallback;}
    return value??fallback;
  }catch(error){console.warn(`Startup continued without ${label}:`,error);return fallback;}
  finally{clearTimeout(timer);}
}

function rememberRecentTemplate(file){
  if(!file||!settings)return;
  const recent=Array.isArray(settings.recentTemplateFiles)?settings.recentTemplateFiles:[];
  settings.recentTemplateFiles=[{file,accessedAt:new Date().toISOString()},...recent.map(item=>typeof item==='string'?{file:item,accessedAt:''}:item).filter(item=>item?.file&&item.file!==file)].slice(0,50);
  window.zebra.saveSettings({recentTemplateFiles:settings.recentTemplateFiles}).catch(error=>console.warn('Could not save recent labels:',error));
}

async function selectTemplate(file, startup = false) {
  if(!startup&&current&&current.file!==file&&current.editable&&!await window.prepareEditorNavigation())return false;
  setPreviewLoading(true);
  try {
    if (current && current.file !== file) rememberPrintPage();
    current = templates.find((t) => t.file === file);
    if (!current) return false;
    importedRows = null; csvRaw = null;
    const loaded=startup?await startupRequest(`label ${file}`,()=>window.zebra.loadTemplateRaw(file),null):await window.zebra.loadTemplateRaw(file);
    if(!loaded){if(startup){current=null;openEditor(blankTemplate());}return false;}
    rememberRecentTemplate(file);
    rawTemplate = window.PrintGeometry.normalizeTemplate(loaded, getConnection());
    seedTemplateValues(rawTemplate, file);

    renderTemplateList();
    el('copies').value = defaultCopies || 1;
    applyPrintPage(file);
    window.zebra.saveSettings({ lastTemplate: file });
    // Keep a skeleton over the old preview while the selected label is rendered.
    if (el('editorView').style.display !== 'none') {
      editing = null; openEditor(rawTemplate);
      const savedHistory=await Promise.resolve(window.zebra.loadEditHistory?.(file)).catch(error=>{console.warn('Could not load edit history:',error);return null;});
      if(current?.file===file){restoreEditHistory(savedHistory,file);if(!editRevisions.length)recordEditRevision(editing,'Opened label');}
    }
    return true;
  } finally {
    setPreviewLoading(false);
  }
}

function setPreviewLoading(loading) {
  const frame=el('previewFrame');
  if(!frame)return;
  const active=!!loading||appInitializing;
  if(active)frame.classList.remove('preview-page-fits');
  frame.classList.toggle('preview-loading',active);
  frame.setAttribute('aria-busy',String(active));
}

/* ============================ EDITOR ============================ */

function blankTemplate() {
  return { name: 'new-template', description: '', language: 'zpl', dpi: 300, unit: (settings && settings.unit) || 'mm', width_mm: 51, height_mm: 25, tear_off: 0, margin_mm: {top:0,bottom:0,left:0,right:0},
    field_meta: {}, values: {}, elements: [{ label: 'Text', type: 'text', x_mm: 3, y_mm: 3, font: '0', height_mm: 3, width_mm: 3, text: '{{text}}' }] };
}

const pageFields = {pageW:'width_mm', pageH:'height_mm', pageTop:'top_mm', pageBottom:'bottom_mm', pageLeft:'left_mm', pageRight:'right_mm', pageGapX:'gap_x_mm', pageGapY:'gap_y_mm'};
function refreshPageGapControls(p){
  const rows=Math.max(1,Number(p.rows)||1),cols=Math.max(1,Number(p.columns)||1),manual=!p.manual_template||(p.manual_gap??true);
  for(const id of ['pageGapHeading','pageGapRow','pageGapXField','pageGapYField'])el(id).hidden=false;
  el('pageGapX').disabled=cols<2||!manual;el('pageGapY').disabled=rows<2||!manual;
  if(el('pageGapManual')){el('pageGapManual').checked=manual;el('pageGapManual').disabled=!p.manual_template||(rows<2&&cols<2);el('pageGapManual').title=!p.manual_template?'Gap is entered manually while template size is calculated automatically.':'Calculate the gap automatically or enter it manually.';}
}
function refreshPageSetup() {
  const p=editing.page || {};el('pageEnabled').checked=!!p.enabled; const pageUnit=(settings&&settings.unit)||'mm';
  el('pageTemplateManual').checked=!!p.manual_template;if(el('pageGapManual')){el('pageGapManual').checked=p.manual_gap??true;el('pageGapX').disabled=el('pageGapY').disabled=!el('pageGapManual').checked;}
  const rows=Math.max(1,Number(p.rows)||1),cols=Math.max(1,Number(p.columns)||1);
  refreshPageGapControls(p);
  el('edW').readOnly=!!p.enabled&&!p.manual_template;el('edH').readOnly=!!p.enabled&&!p.manual_template;
  for(const [id,key] of Object.entries(pageFields)){el(id).step='any';el(id).value=mmToUnit(p[key] ?? (key==='width_mm'?editing.width_mm:key==='height_mm'?editing.height_mm:0), pageUnit, editing.dpi);}
  el('pageRows').value=p.rows || 1; el('pageCols').value=p.columns || 1;
  if(p.enabled&&!p.manual_template){const w=(Number(p.width_mm)-Number(p.left_mm||0)-Number(p.right_mm||0)-(cols-1)*Number(p.gap_x_mm||0))/cols,h=(Number(p.height_mm)-Number(p.top_mm||0)-Number(p.bottom_mm||0)-(rows-1)*Number(p.gap_y_mm||0))/rows;if(w>0&&h>0){editing.width_mm=w;editing.height_mm=h;el('edW').value=mmToUnit(w,pageUnit,editing.dpi);el('edH').value=mmToUnit(h,pageUnit,editing.dpi);}}
}
function readPageSetup() {
  const unit=(settings&&settings.unit)||'mm';
  const p={...editing.page,enabled:el('pageEnabled').checked,unit,manual_template:el('pageTemplateManual').checked,manual_gap:el('pageGapManual')?.checked??true,rows:Math.max(1,Math.min(100,Math.floor(Number(el('pageRows').value)||1))),columns:Math.max(1,Math.min(100,Math.floor(Number(el('pageCols').value)||1)))};
  if(!p.manual_template)p.manual_gap=true;
  for(const [id,key] of Object.entries(pageFields)) p[key]=Math.max(0,unitToMm(el(id).value,unit,editing.dpi));
  if(p.enabled&&p.manual_template&&!p.manual_gap){p.gap_x_mm=p.columns>1?Math.max(0,(p.width_mm-p.left_mm-p.right_mm-p.columns*editing.width_mm)/(p.columns-1)):0;p.gap_y_mm=p.rows>1?Math.max(0,(p.height_mm-p.top_mm-p.bottom_mm-p.rows*editing.height_mm)/(p.rows-1)):0;el('pageGapX').value=mmToUnit(p.gap_x_mm,unit,editing.dpi);el('pageGapY').value=mmToUnit(p.gap_y_mm,unit,editing.dpi);}
  if(p.enabled&&(p.width_mm-p.left_mm-p.right_mm-(p.columns-1)*p.gap_x_mm<=0||p.height_mm-p.top_mm-p.bottom_mm-(p.rows-1)*p.gap_y_mm<=0)){setEditorStatus('err','Margins and gaps leave no printable label area.');return false;}
  editing.page=p;
  refreshPageGapControls(p);el('edW').readOnly=!!p.enabled&&!p.manual_template;el('edH').readOnly=!!p.enabled&&!p.manual_template;
  if(p.enabled&&!p.manual_template){
    const w=(p.width_mm-p.left_mm-p.right_mm-(p.columns-1)*p.gap_x_mm)/p.columns;
    const h=(p.height_mm-p.top_mm-p.bottom_mm-(p.rows-1)*p.gap_y_mm)/p.rows;
    if(w>0&&h>0){editing.width_mm=w;editing.height_mm=h;el('edW').value=mmToUnit(w,unit,editing.dpi);el('edH').value=mmToUnit(h,unit,editing.dpi);}
  }
}

function commitLayoutCountsWithUsableGaps(){
  const unit=(settings&&settings.unit)||'mm',rows=Math.max(1,Math.min(100,Math.floor(Number(el('pageRows').value)||1))),columns=Math.max(1,Math.min(100,Math.floor(Number(el('pageCols').value)||1)));
  const p={...editing.page,enabled:el('pageEnabled').checked,unit,manual_template:el('pageTemplateManual').checked,manual_gap:el('pageGapManual')?.checked??true,rows,columns};
  for(const [id,key]of Object.entries(pageFields))if(key!=='gap_x_mm'&&key!=='gap_y_mm')p[key]=Math.max(0,unitToMm(el(id).value,unit,editing.dpi));
  p.gap_x_mm=Math.max(0,Number(editing.page?.gap_x_mm)||0);p.gap_y_mm=Math.max(0,Number(editing.page?.gap_y_mm)||0);
  const printableWidth=p.width_mm-p.left_mm-p.right_mm,printableHeight=p.height_mm-p.top_mm-p.bottom_mm;
  if(!(printableWidth>0&&printableHeight>0))return false;
  if(columns>1&&printableWidth-(columns-1)*p.gap_x_mm<=0)p.gap_x_mm=0;
  if(rows>1&&printableHeight-(rows-1)*p.gap_y_mm<=0)p.gap_y_mm=0;
  editing.page=p;refreshPageGapControls(p);el('edW').readOnly=!!p.enabled&&!p.manual_template;el('edH').readOnly=!!p.enabled&&!p.manual_template;
  if(!p.manual_template){const width=(printableWidth-(columns-1)*p.gap_x_mm)/columns,height=(printableHeight-(rows-1)*p.gap_y_mm)/rows;if(width>0&&height>0){editing.width_mm=width;editing.height_mm=height;el('edW').value=mmToUnit(width,unit,editing.dpi);el('edH').value=mmToUnit(height,unit,editing.dpi);}}
  return true;
}

function refreshEditorUI() {
  editing = window.PrintGeometry.normalizeTemplate(editing, getConnection());
  refreshPageSetup();
  el('printBackground').checked = !!editing.print_background;
  el('backgroundOpacity').value = Math.round((editing.background?.opacity || 0.5) * 100);
  el('edDesc').value = editing.description || '';
  editing.unit = (settings && settings.unit) || 'mm';
  el('edDpi').value = String(editing.dpi || 203); el('edTear').value = editing.tear_off ?? 0;
  el('edDpi').disabled = !!(getConnection().type === 'printer' && window.PrintGeometry.printerDpi(getConnection().printer));
  el('edW').value = mmToUnit(editing.width_mm, editing.unit, editing.dpi);
  el('edH').value = mmToUnit(editing.height_mm, editing.unit, editing.dpi);
  el('stockName').value = editing.stock?.name || 'USER';
  el('stockType').value = editing.stock?.type || ({ N: 'continuous', M: 'black-mark' }[editing.media_tracking] || 'die-cut');
  el('stockLeft').value = mmToUnit(editing.stock?.liner_left_mm ?? 1.27, editing.unit, editing.dpi);
  el('stockRight').value = mmToUnit(editing.stock?.liner_right_mm ?? 1.27, editing.unit, editing.dpi);
  editing.language = 'zpl';
  updateMeasureLabels();
  renderEditorElements();   renderFieldMeta();
  lastValueNames = '';
  renderEditorValues();
  updateEditorPreview();
}
function migrateDatabaseFieldAliases(template) {
  const fields=template.database_connection?.fields||{},sources=template.data_sources||{};
  const imported=Object.entries(fields).filter(([name])=>sources[name]?.category==='Database Fields');
  if(!imported.length)return false;
  const importedNames=new Set(imported.map(([name])=>name)),used=new Set(Object.keys(sources).filter(name=>!importedNames.has(name))),renames={};
  for(const [oldName,column] of imported){
    const base=String(column||'').normalize('NFKC').replace(/[^A-Za-z0-9_.-]/g,'_').replace(/^[^A-Za-z]+/,'field_');
    if(!base)continue;let name=base,suffix=2;while(used.has(name))name=`${base}_${suffix++}`;used.add(name);if(name!==oldName)renames[oldName]=name;
  }
  if(!Object.keys(renames).length)return false;
  const replaceTokens=value=>typeof value==='string'?value.replace(/\{\{\s*([\w.\-]+)\s*\}\}/g,(match,name)=>renames[name]?'{{'+renames[name]+'}}':match):value;
  for(const element of template.elements||[])if(typeof element.text==='string')element.text=replaceTokens(element.text);
  for(const source of Object.values(sources))if(typeof source.value==='string')source.value=replaceTokens(source.value);
  const nextSources={...sources},nextFields={...fields};
  for(const [oldName,newName] of Object.entries(renames)){nextSources[newName]=nextSources[oldName];delete nextSources[oldName];nextFields[newName]=nextFields[oldName];delete nextFields[oldName];if(template.values&&Object.hasOwn(template.values,oldName)){template.values[newName]??=template.values[oldName];delete template.values[oldName];}if(template.field_meta&&Object.hasOwn(template.field_meta,oldName)){template.field_meta[newName]=template.field_meta[oldName];delete template.field_meta[oldName];}}
  template.data_sources=nextSources;template.database_connection.fields=nextFields;return true;
}

function openEditor(raw) {
  editing = JSON.parse(JSON.stringify(raw));
  const migratedDatabaseFields=migrateDatabaseFieldAliases(editing);
  databasePreviewRecord = 0;
  factoryEdited = false;
  const page = editing.page || {};
  const near = (a, b) => Math.abs(Number(a) - b) < 0.02;
  // Repair the known inches conversion regression from v0.09/v0.10 on the
  // user's 2.5-inch page: 0.07 in margins were persisted as 0.7 in.
  if (editing.name === 'nuovo-modello' && near(editing.width_mm, 63.5) && near(editing.height_mm, 63.5) &&
      near(page.width_mm, 63.5) && near(page.height_mm, 63.5) &&
      ['top_mm', 'bottom_mm', 'left_mm', 'right_mm'].every((key) => near(page[key], 17.78))) {
    editing.width_mm = editing.height_mm = 2.36 * 25.4;
    editing.page = { ...page, enabled: true, unit: 'in', manual_template: false,
      top_mm: 0.07 * 25.4, bottom_mm: 0.07 * 25.4, left_mm: 0.07 * 25.4, right_mm: 0.07 * 25.4,
      gap_x_mm: 0, gap_y_mm: 0 };
    editing.margin_mm = { top: 0, bottom: 0, left: 0, right: 0 };
    editing.__layoutMigratedV012 = true;
  }
  const migratedLayout = editing.__layoutMigratedV012 === true;
  delete editing.__layoutMigratedV012;
  seedTemplateValues(editing, current && current.file);
  editorSel = null; editorSelection.clear(); undoStack = []; redoStack = []; editRevisions=[]; editHistoryFile=current?.file||null;
  el('edName').value = (current && current.file ? current.file.replace('.json', '') : editing.name) || 'nuovo-modello';
  if (el('edTitle')) el('edTitle').textContent = current ? t('dyn.editTitle', { n: (current.name || el('edName').value) }) : t('dyn.newTitle');
  refreshEditorUI();
  if (migratedLayout||migratedDatabaseFields) touchEditor();
  updateUndoButtons();
  setMode('editor');
}

// --- Undo / Redo dell'editor (snapshot su operazioni strutturali) ---
function restoreEditHistory(saved,file){
  editHistoryFile=file||current?.file||null;
  const restored=window.EditHistory.restoreStacks(saved);
  editRevisions=restored.revisions.slice(-MAX_EDIT_REVISIONS);
  undoStack=restored.undoStack;
  redoStack=restored.redoStack;
  updateUndoButtons();
}
function persistEditHistory(sync=false){
  if(!editHistoryFile||!window.zebra.saveEditHistory)return;
  clearTimeout(editHistoryPersistTimer);editHistoryPersistTimer=null;
  const write=()=>{
    const payload=window.EditHistory.serializeHistoryPayload(editRevisions,undoStack,redoStack,MAX_EDIT_REVISIONS);
    if(sync){const result=window.zebra.saveEditHistorySync?.(editHistoryFile,payload);if(result&&!result.ok)console.warn('Could not save edit history:',result.error);return;}
    window.zebra.saveEditHistory(editHistoryFile,payload).then(result=>{if(result&&!result.ok)console.warn('Could not save edit history:',result.error);}).catch(error=>console.warn('Could not save edit history:',error));
  };
  if(sync){write();return;}
  // Disk serialization still walks large bitmaps — never do it on the gesture frame.
  editHistoryPersistTimer=setTimeout(()=>{editHistoryPersistTimer=null;write();},activeObjectGesture?240:120);
}
function recordEditRevision(state,label='Edit',options={}){
  editRevisions=window.EditHistory.recordRevision(editRevisions,state,label,MAX_EDIT_REVISIONS,options);
  if(!options.skipPersist)persistEditHistory();
}
function pushSnapshot() {
  if (!editing) return;
  // Capture geometry with shared bitmap string refs. JSON.stringify of large
  // images on the first drag/resize frame was freezing the UI for ~1s.
  const {undoStack:nextUndo,redoStack:nextRedo,snapshot}=window.EditHistory.pushUndoSnapshot(undoStack,redoStack,editing);
  undoStack=nextUndo;redoStack=nextRedo;
  updateUndoButtons();
  // Never bookkeep revisions mid-gesture — fingerprint/persist work hitch the drag.
  if(activeObjectGesture){pendingGestureRevision=snapshot;return;}
  recordEditRevision(snapshot,'Before edit',{reuseState:true});
}
function undo() {
  if (!undoStack.length) return;
  redoStack=redoStack.concat([window.EditHistory.cloneForUndo(editing)]);
  editing = window.EditHistory.reviveUndoEntry(undoStack.pop());
  editorSel = null; editorSelection.clear(); refreshEditorUI(); updateUndoButtons();
  recordEditRevision(editing,'Undo');persistEditHistory();
  touchEditor();
}
function redo() {
  if (!redoStack.length) return;
  undoStack=undoStack.concat([window.EditHistory.cloneForUndo(editing)]);
  editing = window.EditHistory.reviveUndoEntry(redoStack.pop());
  editorSel = null; editorSelection.clear(); refreshEditorUI(); updateUndoButtons();
  recordEditRevision(editing,'Redo');persistEditHistory();
  touchEditor();
}

function openEditHistory(){
  if(!editing)return;
  let dialog=el('editHistoryDialog');
  if(!dialog){
    dialog=document.createElement('dialog');dialog.id='editHistoryDialog';dialog.className='edit-history-dialog';
    dialog.innerHTML='<header><strong>Edit History</strong><button type="button" class="history-close" aria-label="Close">×</button></header><main><nav aria-label="Label revisions"></nav><section class="history-revision-preview"><p class="history-empty">Select a revision to preview.</p></section></main><footer><span class="history-revision-time"></span><div><button type="button" class="history-restore" disabled>Restore this revision</button><button type="button" class="history-done">Done</button></div></footer>';
    document.body.append(dialog);
    const style=document.createElement('style');style.textContent='.edit-history-dialog{box-sizing:border-box;width:min(940px,94vw);height:min(680px,90vh);max-width:94vw;max-height:90vh;padding:0;border:1px solid var(--border,#cbd5e1);border-radius:10px;background:var(--card,#fff);color:var(--text,#1f2937);font:13px Segoe UI,sans-serif}.edit-history-dialog::backdrop{background:#0f172a88;backdrop-filter:blur(2px)}.edit-history-dialog>header,.edit-history-dialog>footer{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border,#d4dbe5)}.edit-history-dialog>header strong{font-size:16px}.edit-history-dialog>header .history-close{display:none}.edit-history-dialog>main{display:grid;grid-template-columns:minmax(210px,280px) minmax(0,1fr);min-height:0;height:calc(100% - 112px)}.edit-history-dialog nav{min-height:0;overflow:auto;border-right:1px solid var(--border,#d4dbe5);padding:8px}.edit-history-dialog nav button{display:block;width:100%;padding:9px 10px;margin:0 0 4px;border:1px solid transparent;border-radius:6px;background:transparent;color:inherit;text-align:left;cursor:pointer}.edit-history-dialog nav button:hover{background:#f1f5f9}.edit-history-dialog nav button[aria-current=true]{background:#ecfdf3;border-color:#86efac}.edit-history-dialog nav small{display:block;margin-top:3px;color:var(--muted,#667085);font-size:11px}.history-revision-preview{min-width:0;min-height:0;overflow:auto;display:flex;align-items:center;justify-content:center;padding:20px;background:#d1d5db}.history-revision-preview svg{display:block;max-width:100%;max-height:100%;width:auto;height:auto;background:white;box-shadow:0 2px 10px #0003}.history-revision-preview .history-empty{color:#667085}.edit-history-dialog>footer{height:56px;border-top:1px solid var(--border,#d4dbe5);border-bottom:0}.edit-history-dialog>footer>div{display:flex;gap:8px}.edit-history-dialog>footer button{padding:7px 12px;border:1px solid var(--border,#cbd5e1);border-radius:5px;background:var(--card,#fff);color:inherit;cursor:pointer}.edit-history-dialog>footer .history-restore{background:#16a34a;border-color:#16a34a;color:white}.edit-history-dialog>footer .history-restore:disabled{opacity:.45;cursor:default}.edit-history-dialog .history-revision-time{color:var(--muted,#667085);font-size:12px}@media(max-width:620px){.edit-history-dialog>main{grid-template-columns:150px minmax(0,1fr)}.history-revision-preview{padding:8px}}';document.head.append(style);
    dialog.querySelector('.history-close').onclick=()=>dialog.close();dialog.querySelector('.history-done').onclick=()=>dialog.close();
  }
  const list=dialog.querySelector('nav'),preview=dialog.querySelector('.history-revision-preview'),restore=dialog.querySelector('.history-restore'),stamp=dialog.querySelector('.history-revision-time');
  const revisions=editRevisions.slice();const currentSnapshot=JSON.parse(JSON.stringify(editing));if(!revisions.length||JSON.stringify(revisions.at(-1).state)!==JSON.stringify(currentSnapshot))revisions.push({id:'current-preview',time:new Date().toISOString(),label:'Current state',state:currentSnapshot,ephemeral:true});
  list.replaceChildren();let selected=-1;
  const selectRevision=index=>{selected=index;[...list.children].forEach((button,i)=>button.setAttribute('aria-current',String(i===index)));const revision=revisions[index];if(!revision)return;stamp.textContent=new Date(revision.time).toLocaleString();restore.disabled=!!revision.ephemeral||JSON.stringify(revision.state)===JSON.stringify(editing);try{const state=revision.state,svg=window.LabelPreview.renderPreviewSVG(state,sampleData(state),null,qrCache,{paperPage:!!state.page?.enabled,designSheet:true});preview.innerHTML=svg;preview.querySelector('svg')?.setAttribute('aria-label',`Preview of revision ${index+1}`);}catch(error){preview.innerHTML='';const message=document.createElement('p');message.className='history-empty';message.textContent='This revision preview could not be rendered.';preview.append(message);console.warn('Could not render edit history preview:',error);}};
  revisions.forEach((revision,index)=>{const button=document.createElement('button');button.type='button';button.dataset.revision=String(index);const title=document.createElement('span');title.textContent=`${index+1}. ${revision.label||'Edit'}`;const date=document.createElement('small');date.textContent=new Date(revision.time).toLocaleString();button.append(title,date);button.onclick=()=>selectRevision(index);list.append(button);});
  restore.onclick=()=>{const revision=revisions[selected];if(!revision||revision.ephemeral)return;pushSnapshot();editing=JSON.parse(JSON.stringify(revision.state));editorSel=null;editorSelection.clear();el('edName').value=editing.name||current?.name||'';refreshEditorUI();renderEditorElements();drawEditorCanvas();recordEditRevision(editing,'Restored revision');updateUndoButtons();dialog.close();touchEditor();setEditorStatus('ok','Revision restored.');};
  if(revisions.length){selectRevision(revisions.length-1);if(!dialog.open)dialog.showModal();}else{preview.innerHTML='<p class="history-empty">No edit history yet. Changes will appear here as you edit this label.</p>';stamp.textContent='';restore.disabled=true;if(!dialog.open)dialog.showModal();}
}
window.openEditHistory=openEditHistory;

function freshGroupIds(elements){const ids=new Map();for(const element of elements||[]){if(!element?.group_id)continue;if(!ids.has(element.group_id))ids.set(element.group_id,`group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`);element.group_id=ids.get(element.group_id);}return elements;}
function groupSelectedElements(ungroup=false){if(!editing)return false;const indices=[...new Set(editorSelection.size?[...editorSelection]:[editorSel])].filter(i=>Number.isInteger(i)&&editing.elements?.[i]);if(ungroup? !indices.some(i=>editing.elements[i].group_id):indices.length<2)return false;readEditorIntoDraft();pushSnapshot();if(ungroup)indices.forEach(i=>delete editing.elements[i].group_id);else{const id=`group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;indices.forEach(i=>editing.elements[i].group_id=id);}editorSelection=new Set(indices);editorSel=indices.at(-1);renderEditorElements();drawEditorCanvas();touchEditor();updateUndoButtons();return true;}
window.groupSelectedElements=groupSelectedElements;

function duplicateSelectedElement() {
  if (!editing) return false;
  const indices=[...new Set(editorSelection.size?[...editorSelection]:[editorSel])]
    .filter(index=>Number.isInteger(index)&&index>=0&&editing.elements?.[index]).sort((a,b)=>a-b);
  if(!indices.length)return false;
  readEditorIntoDraft();
  const copies=freshGroupIds(indices.map(index=>JSON.parse(JSON.stringify(editing.elements[index]))));
  pushSnapshot();
  for(const copy of copies){copy.x_mm=(Number(copy.x_mm)||0)+1;copy.y_mm=(Number(copy.y_mm)||0)+1;}
  const insertion=indices.at(-1)+1;
  editing.elements.splice(insertion,0,...copies);copies.forEach(noteRecentObjectUsage);
  editorSelection=new Set(copies.map((_,offset)=>insertion+offset));
  editorSel=insertion+copies.length-1;
  refreshEditorUI();
  updateUndoButtons();
  touchEditor();
  return true;
}

function selectAllEditorElements() {
  if (!editing?.elements?.length) return false;
  editorSelection = new Set(editing.elements.map((_, index) => index));
  editorSel = editing.elements.length - 1;
  renderEditorElements();
  drawEditorCanvas();
  return true;
}
function copySelectedElement(cut = false) {
  if (!editing) return false;
  const indices=[...editorSelection].filter(i=>Number.isInteger(i)&&editing.elements?.[i]);
  if(!indices.length&&Number.isInteger(editorSel)&&editing.elements?.[editorSel])indices.push(editorSel);
  if(!indices.length)return false;
  readEditorIntoDraft();
  elementClipboard = indices.map(i=>JSON.parse(JSON.stringify(editing.elements[i])));
  document.dispatchEvent(new Event('editor-clipboard-change'));
  if (cut) {
    pushSnapshot();
    const removed=new Set(indices);editing.elements=editing.elements.filter((_,i)=>!removed.has(i));
    editorSel = null;
    editorSelection.clear();
    refreshEditorUI();
    updateUndoButtons();
    touchEditor();
  }
  return true;
}

function pasteElement(point=null) {
  if (!editing || !elementClipboard) return false;
  const paper=designPaperBounds(),requested=point||lastPastePointMm;
  const target=requested&&requested.x>=paper.x&&requested.x<=paper.x+paper.width&&requested.y>=paper.y&&requested.y<=paper.y+paper.height
    ?requested:{x:paper.x+paper.width/2,y:paper.y+paper.height/2};
  readEditorIntoDraft();
  const copies=freshGroupIds((Array.isArray(elementClipboard)?elementClipboard:[elementClipboard]).map(source=>JSON.parse(JSON.stringify(source))));
  const boxes=window.LabelPreview.computeBoxes({...editing,elements:copies},sampleData(editing));
  const left=Math.min(...boxes.map(box=>box.x)),top=Math.min(...boxes.map(box=>box.y)),right=Math.max(...boxes.map(box=>box.x+box.w)),bottom=Math.max(...boxes.map(box=>box.y+box.h));
  const aimX=editorGrid.snap?snapVal(target.x):target.x,aimY=editorGrid.snap?snapVal(target.y):target.y;
  const dx=Math.max(paper.x-left,Math.min(paper.x+paper.width-right,aimX-(left+right)/2));
  const dy=Math.max(paper.y-top,Math.min(paper.y+paper.height-bottom,aimY-(top+bottom)/2));
  for(const copy of copies){copy.x_mm=(Number(copy.x_mm)||0)+dx;copy.y_mm=(Number(copy.y_mm)||0)+dy;}
  pushSnapshot();
  editing.elements = editing.elements || [];
  const first=editing.elements.length;editing.elements.push(...copies);copies.forEach(noteRecentObjectUsage);
  editorSelection=new Set(copies.map((_,i)=>first+i));editorSel=first+copies.length-1;
  refreshEditorUI();
  updateUndoButtons();
  touchEditor();
  return true;
}

function deleteSelectedElement() {
  if (!editing) return false;
  const indices = [...new Set(editorSelection.size ? [...editorSelection] : [editorSel])]
    .filter(index => Number.isInteger(index) && index >= 0 && editing.elements?.[index])
    .sort((a, b) => b - a);
  if (!indices.length) return false;
  readEditorIntoDraft();
  pushSnapshot();
  for (const index of indices) editing.elements.splice(index, 1);
  editorSel = null;
  editorSelection.clear();
  refreshEditorUI();
  updateUndoButtons();
  touchEditor();
  return true;
}

function replaceTemplateText() {
  if (!editing) return;
  const find = prompt('Find in template');
  if (!find) return;
  const replacement = prompt('Replace with', '');
  if (replacement === null) return;
  readEditorIntoDraft();
  const replaceIn = (value) => typeof value === 'string' ? value.split(find).join(replacement) : value;
  let changed = 0;
  pushSnapshot();
  (editing.elements || []).forEach((item) => {
    if (typeof item.text === 'string' && item.text.includes(find)) {
      const next = replaceIn(item.text);
      changed += (item.text.length - item.text.split(find).join('').length) / find.length;
      item.text = next;
    }
    if (typeof item.label === 'string' && item.label.includes(find)) {
      item.label = replaceIn(item.label);
      changed++;
    }
  });
  if (!changed) { undoStack.pop(); updateUndoButtons(); alert('No matches found in template elements.'); return; }
  refreshEditorUI();
  updateUndoButtons();
  touchEditor();
}
function updateUndoButtons() {
  window.HistoryButtonState.updateUndoRedoButtons(
    undoStack,
    redoStack,
    el('undoBtn'),
    el('redoBtn'),
    document.querySelector('.ribbon-quick-button[aria-label="Undo (Ctrl+Z)"]'),
    document.querySelector('.ribbon-quick-button[aria-label="Redo (Ctrl+Y)"]')
  );
}

// Etichette come chiavi i18n (risolte con t() al render).
const ALIGN_OPTS = [['left', 'align.left'], ['center', 'align.center'], ['right', 'align.right']];
const ALIGNABLE = ['text', 'barcode128', 'code39', 'code93', 'ean13'];
const LINEAR_BARCODES = ['barcode128', 'code39', 'code93', 'ean13'];

// Imposta l'allineamento di un elemento dai pulsanti rapidi (con undo).
// Senza box_width_mm, centro/destra si riferiscono all'intera etichetta (x_mm = margine).
function setElementAlign(index, align) {
  readEditorIntoDraft(); pushSnapshot();
  const elem = editing.elements[index];
  if (!elem) return;
  if (align === 'left') delete elem.align; else elem.align = align;
  renderEditorElements(); drawEditorCanvas();
}
const ELEMENT_PROPS = {
  image: [['width_mm', 'p.w', 'number'], ['height_mm', 'p.h', 'number']],
  text: [['text', 'p.text', 'text', 'full'], ['height_mm', 'p.h', 'number'], ['width_mm', 'p.w', 'number'], ['font', 'p.font', 'text']],
  barcode128: [['text', 'p.data', 'text', 'full'], ['bar_height_mm', 'p.barh', 'number'], ['module_width', 'p.module', 'number'], ['show_text', 'p.showtext', 'bool']],
  code39: [['text', 'p.data', 'text', 'full'], ['bar_height_mm', 'p.barh', 'number'], ['module_width', 'p.module', 'number'], ['show_text', 'p.showtext', 'bool']],
  ean13: [['text', 'p.dataDigits', 'text', 'full'], ['bar_height_mm', 'p.barh', 'number'], ['module_width', 'p.module', 'number'], ['show_text', 'p.showtext', 'bool']],
  code93: [['text', 'p.data', 'text', 'full'], ['bar_height_mm', 'p.barh', 'number'], ['module_width', 'p.module', 'number'], ['show_text', 'p.showtext', 'bool']],
  datamatrix: [['text', 'p.data', 'text', 'full'], ['magnification', 'p.dmsize', 'number']],
  qrcode: [['text', 'p.data', 'text', 'full'], ['width_mm', 'p.w', 'number']],
  box: [['width_mm', 'p.w', 'number'], ['height_mm', 'p.h', 'number'], ['thickness_mm', 'p.thick', 'number']],
  ellipse: [['width_mm', 'p.w', 'number'], ['height_mm', 'p.h', 'number'], ['thickness_mm', 'p.thick', 'number']],
  inverse: [['width_mm', 'p.w', 'number'], ['height_mm', 'p.h', 'number']],
  line: [['width_mm', 'p.w', 'number'], ['height_mm', 'p.h', 'number'], ['thickness_mm', 'p.thick', 'number']],
};

function refreshObjectTools() {
  const bar = document.getElementById('objectTools');
  if (!bar) return;
  bar.hidden = editorSelection.size === 0;
  const canDistribute = editorSelection.size >= 3;
  bar.querySelectorAll('[data-object-action^="distribute"]').forEach((button) => {
    button.disabled = !canDistribute;
    const direction = button.dataset.objectAction === 'distributeHorizontal' ? 'horizontally' : 'vertically';
    button.title = canDistribute ? `Distribute ${direction}` : `Select at least 3 objects to distribute ${direction}`;
    button.setAttribute('aria-label', button.title);
  });
}
function applyObjectAlignment(action) {
  const selectedIndices=editorSelection.size?[...editorSelection]:Number.isInteger(editorSel)&&editorSel>=0?[editorSel]:[];
  if (!editing || !selectedIndices.length) return;
  readEditorIntoDraft();
  const boxes = window.LabelPreview.computeBoxes(editing, sampleData(editing));
  const selected = selectedIndices.map(i => boxes.find(b=>b.index===i)).filter(Boolean);
  if (!selected.length) return;
  if (action.startsWith('distribute') && selected.length < 3) return;
  pushSnapshot();
  const anchor = selected.find((box) => box.index === editorSel) || selected[0];
  const setX=(b,x)=>editing.elements[b.index].x_mm=(Number(editing.elements[b.index].x_mm)||0)+(x-b.x);
  const setY=(b,y)=>editing.elements[b.index].y_mm=(Number(editing.elements[b.index].y_mm)||0)+(y-b.y);
  const visual=b=>{const angle=(Number(editing.elements[b.index]?.rotation_deg)||0)*Math.PI/180;if(!angle)return{left:b.x,right:b.x+b.w,top:b.y,bottom:b.y+b.h};const cx=b.x+b.w/2,cy=b.y+b.h/2,c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle)),w=b.w*c+b.h*s,h=b.w*s+b.h*c;return{left:cx-w/2,right:cx+w/2,top:cy-h/2,bottom:cy+h/2};};
  const moveToX=(b,left)=>setX(b,b.x+left-visual(b).left),moveToY=(b,top)=>setY(b,b.y+top-visual(b).top);
  const page=designPaperBounds(),view=liveOverlay()?.viewBox?.baseVal;
  const pageLeft=Number.isFinite(view?.x)?view.x:page.x,pageTop=Number.isFinite(view?.y)?view.y:page.y;
  const pageRight=pageLeft+(Number(view?.width)||page.width),pageBottom=pageTop+(Number(view?.height)||page.height);
  if(action==='alignLeft'){const x=selected.length===1?pageLeft:Math.min(...selected.map(b=>visual(b).left));selected.forEach(b=>moveToX(b,x));}
  if(action==='alignCenter'){const x=selected.length===1?pageLeft+page.width/2:(visual(anchor).left+visual(anchor).right)/2;selected.forEach(b=>moveToX(b,x-(visual(b).right-visual(b).left)/2));}
  if(action==='alignRight'){const x=selected.length===1?pageRight:Math.max(...selected.map(b=>visual(b).right));selected.forEach(b=>moveToX(b,x-(visual(b).right-visual(b).left)));}
  if(action==='alignTop'){const y=selected.length===1?pageTop:Math.min(...selected.map(b=>visual(b).top));selected.forEach(b=>moveToY(b,y));}
  if(action==='alignMiddle'){const y=selected.length===1?pageTop+page.height/2:(visual(anchor).top+visual(anchor).bottom)/2;selected.forEach(b=>moveToY(b,y-(visual(b).bottom-visual(b).top)/2));}
  if(action==='alignBottom'){const y=selected.length===1?pageBottom:Math.max(...selected.map(b=>visual(b).bottom));selected.forEach(b=>moveToY(b,y-(visual(b).bottom-visual(b).top)));}
  if(action==='distributeHorizontal'){const sorted=[...selected].sort((a,b)=>visual(a).left-visual(b).left),start=visual(sorted[0]).left,end=visual(sorted.at(-1)).right,total=sorted.reduce((sum,b)=>sum+visual(b).right-visual(b).left,0),gap=(end-start-total)/(sorted.length-1);let x=start;for(const b of sorted){moveToX(b,x);x+=visual(b).right-visual(b).left+gap;}}
  if(action==='distributeVertical'){const sorted=[...selected].sort((a,b)=>visual(a).top-visual(b).top),start=visual(sorted[0]).top,end=visual(sorted.at(-1)).bottom,total=sorted.reduce((sum,b)=>sum+visual(b).bottom-visual(b).top,0),gap=(end-start-total)/(sorted.length-1);let y=start;for(const b of sorted){moveToY(b,y);y+=visual(b).bottom-visual(b).top+gap;}}
  refreshObjectTools();renderEditorElements();drawEditorCanvas();touchEditor();updateUndoButtons();
}
window.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-object-action]').forEach(b=>b.addEventListener('click',()=>applyObjectAlignment(b.dataset.objectAction))));

function selectElement(i) {
  editorSel = i;
  const groupId=i>=0?editing?.elements?.[i]?.group_id:null;
  editorSelection = i >= 0 ? new Set(groupId?editing.elements.flatMap((element,index)=>element.group_id===groupId?[index]:[]):[i]) : new Set();
  refreshSelectionPresentation({renderInspector:renderEditorElements,updateCanvasSelection,drawCanvas:drawEditorCanvas,allowLightCanvas:editorSelection.size<=1});
  // porta in vista la riga selezionata
  const row = document.querySelector(`#edElements .elrow[data-index="${i}"]`);
  if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function updateCanvasSelection() {
  const svg=liveOverlay(),boxes=svg?._editorBoxes;
  if(!boxes)return false;
  for(const box of boxes){
    const group=svg.querySelector(`[data-editor-overlay="${box.index}"]`),element=editing.elements[box.index];
    if(!group||!element)continue;
    [...group.children].forEach(node=>{if(!node.matches('.hit,.hover-outline'))node.remove();});
    const selected=editorSelection.has(box.index)||box.index===editorSel;
    group.classList.toggle('is-selected',selected);
    if(!selected)continue;
    const visual=selectionVisualBounds(box,element),angle=element.type==='line'?0:Number(element.rotation_deg)||0;
    const pivot=box.rotationCenter||{x:visual.x+visual.w/2,y:visual.y+visual.h/2};
    group.insertAdjacentHTML('beforeend',(element.type==='line'?'':`<rect class="sel" x="${visual.x}" y="${visual.y}" width="${visual.w}" height="${visual.h}"${angle?` transform="rotate(${angle} ${pivot.x} ${pivot.y})"`: ''}/>`)+elementHandlesSVG(visual.x,visual.y,visual.w,visual.h,box.index,element,visual));
    group.querySelectorAll('.handle-hit,.handle,.rotation-hit,.hri-handle-hit,.stroke-width-hit').forEach(handle=>handle.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();event.stopPropagation();
      const mode=handle.matches('.rotation-hit')?'rotate':handle.matches('.hri-handle-hit')?'hri':handle.matches('.stroke-width-hit')?'stroke-width':'resize';
      startDrag(event,box.index,mode,mode==='resize'?handle.dataset.anchor:mode);
    }));
    group.querySelectorAll('.table-divider-hit').forEach(handle=>handle.addEventListener('pointerdown',event=>{if(event.button===0)startTableDividerDrag(event,box.index,handle.dataset.tableAxis,Number(handle.dataset.tableDivider));}));
  }
  bindLineSelectionControls(svg);
  const cornerWrap=svg.closest('.canvaswrap');
  if(cornerWrap){cornerWrap.querySelectorAll('.paper-corner-control').forEach(control=>control.remove());renderPaperCornerControl(cornerWrap,svg);}
  refreshObjectTools();
  document.dispatchEvent(new Event('editor-selection-changed'));
  return true;
}

function renderEditorElements() {
  const c = el('edElements'); c.innerHTML = '';
  (editing.elements || []).forEach((elem, i) => {
    const open = i === editorSel;
    const row = document.createElement('div'); row.className = 'elrow' + (open ? ' open' : ''); row.dataset.index = i;

    // Header (fisarmonica): click per selezionare/espandere
    const head = document.createElement('div'); head.className = 'elhead';
    const caret = document.createElement('span'); caret.textContent = open ? '▾' : '▸'; caret.style.cssText = 'cursor:pointer;color:var(--muted);width:14px;';
    const title = document.createElement('span'); title.style.cssText = 'flex:1;cursor:pointer;font-weight:600;';
    title.innerHTML = `${elem.label || elem.type} <span class="etype">${elem.type}</span>`;
    caret.onclick = title.onclick = () => selectElement(open ? -1 : i);

    const up = document.createElement('button'); up.className = 'qbtn'; up.textContent = '↑'; up.title = 'Su';
    const dn = document.createElement('button'); dn.className = 'qbtn'; dn.textContent = '↓'; dn.title = 'Giù';
    const del = document.createElement('button'); del.className = 'qbtn'; del.textContent = '✕'; del.title = 'Elimina'; del.style.color = 'var(--err)';
    up.onclick = () => { readEditorIntoDraft(); pushSnapshot(); if (i > 0) { [editing.elements[i - 1], editing.elements[i]] = [editing.elements[i], editing.elements[i - 1]]; editorSel = i - 1; editorSelection = new Set([editorSel]); } renderEditorElements(); drawEditorCanvas(); };
    dn.onclick = () => { readEditorIntoDraft(); pushSnapshot(); if (i < editing.elements.length - 1) { [editing.elements[i + 1], editing.elements[i]] = [editing.elements[i], editing.elements[i + 1]]; editorSel = i + 1; editorSelection = new Set([editorSel]); } renderEditorElements(); drawEditorCanvas(); };
    del.onclick = () => { readEditorIntoDraft(); pushSnapshot(); editing.elements.splice(i, 1); editorSel = null; editorSelection.clear(); renderEditorElements(); drawEditorCanvas(); };

    head.append(caret, title, up, dn, del);
    row.appendChild(head);

    if (open) {
      const bar = document.createElement('div'); bar.className = 'elhead'; bar.style.marginTop = '8px';
      const typeSel = document.createElement('select');
      ['text', 'barcode128', 'code39', 'code93', 'ean13', 'datamatrix', 'qrcode', 'box', 'ellipse', 'inverse', 'line', ...(elem.type === 'image' ? ['image'] : [])].forEach((t) => { const o = document.createElement('option'); o.value = t; o.textContent = t; if (t === elem.type) o.selected = true; typeSel.appendChild(o); });
      typeSel.onchange = () => { readEditorIntoDraft(); pushSnapshot(); editing.elements[i].type = typeSel.value; renderEditorElements(); drawEditorCanvas(); };
      const lbl = document.createElement('input'); lbl.type = 'text'; lbl.placeholder = t('dyn.elLabelPh'); lbl.value = elem.label || ''; lbl.dataset.prop = 'label'; lbl.style.flex = '1';
      const en = document.createElement('label'); en.className = 'checkbox'; en.style.margin = '0';
      const enc = document.createElement('input'); enc.type = 'checkbox'; enc.checked = elem.enabled !== false; enc.dataset.prop = 'enabled';
      en.append(enc, document.createTextNode(' ' + t('dyn.elActive')));
      bar.append(typeSel, lbl, en);
      // Pulsanti rapidi di allineamento (testo e barcode lineari).
      if (ALIGNABLE.includes(elem.type)) {
        const seg = document.createElement('div'); seg.className = 'alignseg';
        [['left', '⇤'], ['center', '↔'], ['right', '⇥']].forEach(([a, icon]) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'qbtn' + ((elem.align || 'left') === a ? ' on' : '');
          b.textContent = icon; b.title = t('align.' + a) + (a !== 'left' && !(Number(elem.box_width_mm) > 0) ? ' — ' + t('align.autoHint') : '');
          b.onclick = () => setElementAlign(i, a);
          seg.appendChild(b);
        });
        bar.appendChild(seg);
      }
      row.appendChild(bar);

      const grid = document.createElement('div'); grid.className = 'grid';
      const u = unitSuffix();
      const common = [['x_mm', 'p.x', 'number'], ['y_mm', 'p.y', 'number']];
      const props = common.concat(ELEMENT_PROPS[elem.type] || []);
      props.forEach(([prop, label, kind, span, options]) => {
        const fld = document.createElement('div'); fld.className = 'fld' + (span === 'full' ? ' full' : '');
        const l = document.createElement('label');
        l.textContent = MM_PROPS.includes(prop) ? `${t(label)} (${u})` : t(label);
        fld.appendChild(l);
        let input;
        if (kind === 'bool') {
          input = document.createElement('select');
          [['true', t('bool.yes')], ['false', t('bool.no')]].forEach(([v, txt]) => { const o = document.createElement('option'); o.value = v; o.textContent = txt; input.appendChild(o); });
          input.value = String(elem[prop] !== false);
        } else if (kind === 'select') {
          input = document.createElement('select');
          (options || []).forEach(([v, txt]) => { const o = document.createElement('option'); o.value = v; o.textContent = t(txt); input.appendChild(o); });
          input.value = elem[prop] || (options && options[0] && options[0][0]) || '';
        } else {
          input = document.createElement('input'); input.type = kind === 'number' ? 'number' : 'text';
          if (kind === 'number') input.step = 'any';
          input.value = MM_PROPS.includes(prop) ? mmToUnit(elem[prop], editing.unit, editing.dpi) : (elem[prop] ?? '');
        }
        input.dataset.prop = prop;
        fld.appendChild(input); grid.appendChild(fld);
      });
      row.appendChild(grid);
      const applyFields = () => {
        if (!editing || !editing.elements[i]) return;
        const prev = editing.elements[i];
        editing.elements[i] = { ...prev, ...readElementRow(row, prev.type, editing.unit || measureUnit()) };
        drawEditorCanvas();
        touchEditor();
      };
      row.querySelectorAll('input, select').forEach((inp) => {
        inp.addEventListener('input', debounce(applyFields));
        inp.addEventListener('change', applyFields);
      });
    }
    c.appendChild(row);
  });
  renderEditorValues();
}

function renderFieldMeta() {
  const c = el('edFieldMeta'); c.innerHTML = '';
  const meta = editing.field_meta || {};
  Object.keys(meta).forEach((name) => addFieldMetaRow(name, meta[name]));
}
function addFieldMetaRow(name, m) {
  const c = el('edFieldMeta');
  const row = document.createElement('div'); row.className = 'elrow fm-row';
  row.innerHTML = `
    <div class="grid" style="grid-template-columns:1fr 1fr;">
      <div class="fld"><label>${t('fm.name')}</label><input type="text" class="fm-name" value="${(name || '')}"></div>
      <div class="fld"><label>${t('fm.type')}</label><select class="fm-type">
        <option value="select">${t('fm.typeSelect')}</option>
        <option value="multi-qty">${t('fm.typeMulti')}</option>
      </select></div>
      <div class="fld full"><label>${t('fm.label')}</label><input type="text" class="fm-label" value="${(m && m.label) ? m.label : ''}"></div>
      <div class="fld full"><label>${t('fm.options')}</label><textarea class="fm-options" rows="4">${(m && m.options ? m.options.join('\n') : '')}</textarea></div>
    </div>
    <button type="button" class="qbtn fm-del" title="Remove field" aria-label="Remove field"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7"/></svg></button>`;
  row.querySelector('.fm-type').value = (m && m.type) || 'select';
  row.querySelector('.fm-del').onclick = () => { row.remove(); readEditorIntoDraft(); updateEditorPreview(); };
  row.querySelectorAll('input, select, textarea').forEach((inp) => inp.addEventListener('input', debounce(() => { readEditorIntoDraft(); updateEditorPreview(); })));
  c.appendChild(row);
}

// Legge un singolo elemento dell'editor (riga aperta) in un oggetto template.
function readElementRow(row, prevType, unit) {
  const typeSel = row.querySelector('select');
  const type = typeSel ? typeSel.value : prevType;
  const obj = { type };
  const u = unit || (editing && editing.unit) || measureUnit();
  const dpi = (editing && editing.dpi) || measureDpi();
  row.querySelectorAll('[data-prop]').forEach((inp) => {
    const prop = inp.dataset.prop; const val = inp.value;
    if (prop === 'enabled') { obj.enabled = inp.checked; return; }
    if (prop === 'show_text') { obj.show_text = (val === 'true'); return; }
    if (val === '') return;
    const raw = inp.type === 'number' && Number.isFinite(inp.valueAsNumber) ? inp.valueAsNumber : val;
    if (MM_PROPS.includes(prop)) { obj[prop] = unitToMm(raw, u, dpi); return; }
    const numeric = ['x_mm', 'y_mm', 'height_mm', 'width_mm', 'bar_height_mm', 'module_width', 'magnification', 'thickness_mm'];
    obj[prop] = numeric.includes(prop) ? Number(raw) : val;
  });
  if (obj.enabled === true) delete obj.enabled; // default true: non serve salvarlo
  if (obj.align === 'left') delete obj.align; // default: non serve salvarlo
  return obj;
}

// Legge i controlli dell'editor dentro `editing`.
// NB: con la lista a fisarmonica solo la riga selezionata ha i campi nel DOM;
// le altre restano quelle già presenti in `editing` (anche le posizioni cambiate col trascinamento).
function readEditorIntoDraft() {
  if (!editing) return;
  const openRow = document.querySelector('#edElements .elrow.open');
  if (openRow && editorSel != null && editing.elements[editorSel]) {
    const prev = editing.elements[editorSel];
    editing.elements[editorSel] = { ...prev, ...readElementRow(openRow, prev.type, editing.unit || measureUnit()) };
  }
  const liveTextEditor = document.getElementById('canvasTextEditor');
  const liveTextIndex = Number(liveTextEditor?.dataset.elementIndex);
  if (liveTextEditor && editing.elements[liveTextIndex]?.type === 'text') editing.elements[liveTextIndex].text = liveTextEditor.value;
  const desc = el('edDesc');
  if (desc) editing.description = desc.value.trim();
  const dpiNode = el('edDpi');
  editing.dpi = Number(dpiNode && dpiNode.value) || editing.dpi || 203;
  const u = editing.unit || measureUnit();
  const wNode = el('edW');
  const hNode = el('edH');
  if (wNode) editing.width_mm = unitToMm(wNode.value, u, editing.dpi);
  if (hNode) editing.height_mm = unitToMm(hNode.value, u, editing.dpi);
  readPageSetup();
  // Preserve legacy per-template padding from imported templates. The Page
  // setup controls page margins and no longer edits this legacy field.
  const printBg = el('printBackground');
  if (printBg) editing.print_background = printBg.checked;
  const opacity = el('backgroundOpacity');
  if (editing.background && opacity) editing.background.opacity = Number(opacity.value) / 100;
  const tearNode = el('edTear');
  const tear = tearNode ? tearNode.value : '';
  editing.tear_off = tear === '' ? undefined : Number(tear);
  editing.stock = {
    name: el('stockName').value.trim() || 'USER',
    type: el('stockType').value,
    liner_left_mm: Math.max(0, unitToMm(el('stockLeft').value, u, editing.dpi)),
    liner_right_mm: Math.max(0, unitToMm(el('stockRight').value, u, editing.dpi)),
  };
  editing.media_tracking = { 'die-cut': 'Y', continuous: 'N', 'black-mark': 'M' }[editing.stock.type] || 'Y';
  editing.language = 'zpl';

  // field_meta
  const meta = {};
  document.querySelectorAll('#edFieldMeta .fm-row').forEach((row) => {
    const name = row.querySelector('.fm-name').value.trim();
    if (!name) return;
    const type = row.querySelector('.fm-type').value;
    const label = row.querySelector('.fm-label').value.trim();
    const options = row.querySelector('.fm-options').value.split(/\n/).map((s) => s.trim()).filter(Boolean);
    meta[name] = { type, options };
    if (label) meta[name].label = label;
  });
  editing.field_meta = meta;

  const values = Object.assign({}, editing.values || {});
  document.querySelectorAll('#edValues [data-value-name]').forEach((inp) => {
    values[inp.dataset.valueName] = inp.value;
  });
  editing.values = values;
  editing = window.PrintGeometry.normalizeTemplate(editing, getConnection());
  el('edDpi').value = String(editing.dpi);
  if (!readingForSave) touchEditor();
}

let readingForSave = false;
let editorDirty = false;
let factoryEdited = false;
let autoSaveEnabled = false;
const autoSavePolicy=window.AutoSavePolicy.create({save:()=>persistEditor(false),saveSettings:patch=>window.zebra.saveSettings(patch)});
let allowWindowClose = false;
let closePromptOpen = false;
function touchEditor() {
  if (current && !current.editable) factoryEdited = true;
  editorDirty = true;
  queueMicrotask(()=>document.dispatchEvent(new Event('preview-updated')));
  autoSavePolicy.markDirty();
}
function hasUnsavedEditorChanges() {
  return el('editorView')?.style.display !== 'none' && !!editing && !!(editorDirty || factoryEdited);
}
window.getAutoSaveEnabled=()=>autoSaveEnabled;
window.setAutoSaveEnabled=async enabled=>{autoSaveEnabled=await autoSavePolicy.setEnabled(enabled,{dirty:editorDirty});settings.autoSaveEnabled=autoSaveEnabled;return autoSaveEnabled;};
window.getCloseState=()=>({dirty:hasUnsavedEditorChanges(),name:editing?.name||current?.name||'Untitled label'});
window.saveBeforeClose=async()=>{if(!hasUnsavedEditorChanges())return true;await saveEditor(false);return !hasUnsavedEditorChanges();};
window.discardChangesBeforeClose=()=>{autoSavePolicy.cancel();editorDirty=false;factoryEdited=false;return true;};
window.prepareEditorNavigation=async()=>{
  if(!hasUnsavedEditorChanges())return true;
  if(autoSaveEnabled){await persistEditor(false);return !hasUnsavedEditorChanges();}
  const choice=await showUnsavedClosePrompt({closeWindow:false});
  return choice==='save'||choice==='discard';
};
function showUnsavedClosePrompt({closeWindow=true}={}){
  if(closePromptOpen)return Promise.resolve('cancel');
  closePromptOpen=true;
  return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-labelledby','unsavedCloseTitle');
  dialog.style.cssText='width:min(480px,calc(100vw - 36px));box-sizing:border-box;padding:0;border:1px solid #d6dbe2;border-radius:12px;background:var(--card,#fff);color:var(--text,#202124);box-shadow:0 20px 60px #0004;font:14px "Segoe UI",Arial,sans-serif;';
  dialog.innerHTML='<div style="display:flex;gap:15px;align-items:flex-start;padding:24px 24px 16px"><span aria-hidden="true" style="display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;border-radius:50%;background:#fff7e6;color:#d97706;font-size:24px;font-weight:700">!</span><div><h2 id="unsavedCloseTitle" style="margin:0 0 8px;font-size:18px;font-weight:600">Save your changes?</h2><p class="unsaved-close-name" style="margin:0 0 8px;color:var(--text,#344054);font-weight:600"></p><p style="margin:0;color:var(--muted,#667085);line-height:1.5">If you choose Don’t Save, your changes will be discarded.</p></div></div><div style="display:flex;justify-content:flex-end;gap:9px;padding:14px 20px 18px;border-top:1px solid var(--border,#e4e7ec)"><button type="button" data-close-cancel style="min-width:88px;padding:8px 14px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--card,#fff);color:inherit;cursor:pointer">Cancel</button><button type="button" data-close-discard style="min-width:108px;padding:8px 14px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--card,#fff);color:inherit;cursor:pointer">Don’t Save</button><button type="button" data-close-save style="min-width:88px;padding:8px 14px;border:1px solid var(--accent,#16a34a);border-radius:7px;background:var(--accent,#16a34a);color:#fff;font-weight:600;cursor:pointer">Save</button></div>';
  dialog.querySelector('.unsaved-close-name').textContent=`Want to save your changes to “${editing?.name||current?.name||'Untitled label'}”?`;
  const saveButton=dialog.querySelector('[data-close-save]');saveButton.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 3h14l3 3v15H4zM8 3v6h9V3M8 21v-8h9v8"/></svg><span>Save</span>';saveButton.style.display='inline-flex';saveButton.style.alignItems='center';saveButton.style.justifyContent='center';saveButton.style.gap='7px';saveButton.style.background='#16a34a';saveButton.style.borderColor='#16a34a';
  document.body.append(dialog);
  const finish=choice=>{closePromptOpen=false;dialog.remove();resolve(choice);};
  dialog.querySelector('[data-close-cancel]').onclick=()=>{dialog.close();finish('cancel');};
  dialog.querySelector('[data-close-discard]').onclick=()=>{window.discardChangesBeforeClose();if(closeWindow)allowWindowClose=true;dialog.close();finish('discard');if(closeWindow)approveAppWindowClose();};
  dialog.querySelector('[data-close-save]').onclick=async event=>{const button=event.currentTarget;button.disabled=true;try{const saved=await window.saveBeforeClose();if(saved){if(closeWindow)allowWindowClose=true;dialog.close();finish('save');if(closeWindow)approveAppWindowClose();}else button.disabled=false;}catch(error){button.disabled=false;setEditorStatus('err',error.message||String(error));}};
  dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();finish('cancel');});
  dialog.showModal();dialog.querySelector('[data-close-save]').focus();
  });
}
function approveAppWindowClose(){if(window.zebra.supportsWindowClosePrompt&&window.zebra.approveWindowClose)window.zebra.approveWindowClose();else window.close();}
window.prepareHotReload=()=>{
  if(!editing||!current?.file)return true;
  if(current.editable===false&&!factoryEdited)return true;
  try{
    readingForSave=true;readEditorIntoDraft();readingForSave=false;
    const saved=window.zebra.saveTemplateSync(current.file,editing);
    if(saved?.ok){autoSavePolicy.cancel();editorDirty=false;rawTemplate=JSON.parse(JSON.stringify(editing));editHistoryFile=current.file;recordEditRevision(editing,'Saved');persistEditHistory(true);return true;}
    console.warn('Hot reload postponed because the current label could not be saved:',saved?.error||'save failed');return false;
  }catch(error){readingForSave=false;console.warn('Hot reload postponed because the current label could not be saved:',error);return false;}
};
async function persistEditor(force = autoSaveEnabled) {
  autoSavePolicy.cancel();
  if (!editorDirty || !editing || (!force && !autoSaveEnabled)) return false;
  if (current && !current.editable && !factoryEdited) return;
  readingForSave = true;
  readEditorIntoDraft();
  readingForSave = false;
  const name = (el('edName').value || '').trim();
  if (!name) return false;
  editing.name = name.replace(/\.json$/, '');
  editorDirty = false;
  const res = await window.zebra.saveTemplate(name, editing);
  if (res && res.ok) {
    await reloadTemplates();
    current = templates.find((tpl) => tpl.file === res.file) || current;
    rawTemplate = JSON.parse(JSON.stringify(editing));
    if(editHistoryFile!==res.file){editHistoryFile=res.file;editRevisions=[];undoStack=[];redoStack=[];}
    recordEditRevision(editing, 'Autosaved');
    persistEditHistory();
    factoryEdited = false;
    renderTemplateList();
    return true;
  } else {
    editorDirty = true;
    return false;
  }
}

function flushAllStateOnExit() {
  try {
    autoSavePolicy.cancel();
    clearTimeout(editHistoryPersistTimer);
    if (editing && editorDirty && autoSaveEnabled && el('editorView').style.display !== 'none') {
      readingForSave = true;
      readEditorIntoDraft();
      readingForSave = false;
      const name = (el('edName').value || '').trim();
      if (name) {
        editing.name = name.replace(/\.json$/i, '');
        const result = window.zebra.saveTemplateSync(name, editing);
        if (result?.ok) { editorDirty = false; editHistoryFile = result.file || current?.file || editHistoryFile; recordEditRevision(editing,'Saved on exit'); }
      }
    }
    persistEditHistory(true);
    rememberPrintPageInMemory();
    const persisted = { ...settings };
    persisted.lastTemplate = current?.file || settings.lastTemplate || null;
    persisted.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    persisted.defaultCopies = defaultCopies;
    persisted.darkness = printDarkness;
    persisted.speed = printSpeed;
    persisted.gridShow = editorGrid.show;
    persisted.gridSnap = editorGrid.snap;
    persisted.gridStep = editorGrid.step;
    persisted.unit = (editing && editing.unit) || persisted.unit || 'mm';
    persisted.uiLang = 'en';
    persisted.connType = el('connType')?.value || persisted.connType || 'printer';
    persisted.printer = el('printerSelect')?.value || persisted.printer || '';
    persisted.ip = el('ipInput')?.value?.trim() || persisted.ip || '';
    persisted.usb = el('usbInput')?.value?.trim() || persisted.usb || '';
    persisted.pages = settings.pages || {};
    persisted.history = history;
    window.zebra.saveSettingsSync(persisted);
  } catch (_) {
    // Shutdown should not be blocked if one damaged field cannot be serialized.
  }
}
if(window.zebra.supportsWindowClosePrompt)window.zebra.onWindowCloseRequested?.(()=>{if(hasUnsavedEditorChanges()){showUnsavedClosePrompt();return;}allowWindowClose=true;approveAppWindowClose();});
window.addEventListener('beforeunload',event=>{if(!window.zebra.supportsWindowClosePrompt&&!allowWindowClose&&hasUnsavedEditorChanges()){event.preventDefault();event.returnValue=false;showUnsavedClosePrompt();return;}flushAllStateOnExit();});

function sampleData(tpl) {
  const data = {};
  const values = (tpl && tpl.values) || {};
  placeholderNames(tpl).forEach((name) => {
    if (values[name] != null && String(values[name]) !== '') data[name] = String(values[name]);
    else if ((tpl.field_meta || {})[name] && tpl.field_meta[name].options && tpl.field_meta[name].options[0]) data[name] = tpl.field_meta[name].options[0];
    else data[name] = '';
  });
  try{return window.DataSourceEngine?window.DataSourceEngine.resolve(tpl,data,{globals:settings.dataSourceGlobals,recordIndex:databasePreviewRecord,index:databasePreviewRecord}):data;}catch(error){setEditorStatus('err',error.message);return data;}
}

let lastValueNames = '';
function renderEditorValues() {
  const c = el('edValues');
  if (!c || !editing) return;
  const names = placeholderNames(editing);
  const key = names.join('\0');
  const existing = Array.from(c.querySelectorAll('[data-value-name]')).map((i) => i.dataset.valueName);
  if (key === lastValueNames && existing.join('\0') === key && names.length) return;
  lastValueNames = key;
  if (!editing.values) editing.values = {};
  c.innerHTML = '';
  if (!names.length) {
    const p = document.createElement('p');
    p.className = 'mini';
    p.textContent = t('ed.valuesNone');
    c.appendChild(p);
    return;
  }
  names.forEach((name) => {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const lab = document.createElement('label');
    lab.textContent = humanize(name);
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.dataset.valueName = name;
    input.value = editing.values[name] || '';
    input.addEventListener('input', debounce(() => {
      if (!editing.values) editing.values = {};
      editing.values[name] = input.value;
      touchEditor();
      updateEditorPreview();
    }));
    wrap.append(lab, input);
    c.appendChild(wrap);
  });
}

function updateEditorPreview() { drawEditorCanvas(); }

function placeNewElementAtBottom(elem) {
  if (!editing || !elem) return elem;
  const box = window.LabelPreview.computeBoxes({ ...editing, elements: [elem] }, sampleData(editing))[0];
  const margin = editing.margin_mm || {};
  const left = Number(margin.left) || 0, right = Number(margin.right) || 0;
  const top = Number(margin.top) || 0, bottom = Number(margin.bottom) || 0;
  const usableW = Math.max(1, (Number(editing.width_mm) || 50) - left - right);
  const usableH = Math.max(1, (Number(editing.height_mm) || 25) - top - bottom);
  const w = Math.min(usableW, Math.max(0, Number(box?.w) || 0));
  const h = Math.min(usableH, Math.max(0, Number(box?.h) || 0));
  elem.x_mm = Math.max(0, (usableW - w) / 2);
  elem.y_mm = Math.max(0, usableH - h - Math.min(1, usableH * 0.05));
  return elem;
}

const insertElementDefaults={
  text:{label:'Text',type:'text',x_mm:3,y_mm:3,font:'0',height_mm:4.5,width_mm:4.5,text:'Text'},
  barcode128:{label:'Barcode',type:'barcode128',x_mm:3,y_mm:3,bar_height_mm:10,module_width:2,show_text:false,text:'{{campo}}'},
  code39:{label:'Code 39',type:'code39',x_mm:3,y_mm:3,bar_height_mm:10,module_width:2,show_text:true,text:'{{campo}}'},
  code93:{label:'Code 93',type:'code93',x_mm:3,y_mm:3,bar_height_mm:10,module_width:2,show_text:true,text:'{{campo}}'},
  ean13:{label:'EAN-13',type:'ean13',x_mm:3,y_mm:3,bar_height_mm:12,module_width:2,show_text:true,text:'{{campo}}'},
  qrcode:{label:'QR Code',type:'qrcode',x_mm:3,y_mm:3,magnification:4,text:'{{campo}}'},
  datamatrix:{label:'Data Matrix',type:'datamatrix',x_mm:3,y_mm:3,magnification:5,text:'{{campo}}'},
  box:{label:'Rectangle',type:'box',x_mm:2,y_mm:2,width_mm:20,height_mm:12,thickness_mm:0.3},
  ellipse:{label:'Ellipse',type:'ellipse',x_mm:2,y_mm:2,width_mm:20,height_mm:12,thickness_mm:0.3},
  inverse:{label:'Inverse',type:'inverse',x_mm:2,y_mm:2,width_mm:20,height_mm:12},
  line:{label:'Line',type:'line',x_mm:2,y_mm:10,width_mm:20,height_mm:0,thickness_mm:0.3},
};
let textClickTimer=null,textClickGeneration=0;
function cancelTextClick(){clearTimeout(textClickTimer);textClickGeneration++;}
async function editTextAtInk(index,x,y,token){
 const element=editing?.elements[index],svg=liveOverlay();if(element?.type!=='text'||!svg)return;
 const point=clientToMm({clientX:x,clientY:y},svg),view=svg.viewBox.baseVal;
 try{
 const canvas=await window.LabelPreview.rasterizeDesignSheetCanvas({...editing,background:null,print_border:false},sampleData(editing),[index],qrCache,{paperPage:false,designSheet:true});
 if(token!==textClickGeneration||editing?.elements[index]!==element||document.querySelector('dialog[open]'))return;
 const px=Math.floor((point.x-view.x)/view.width*canvas.width),py=Math.floor((point.y-view.y)/view.height*canvas.height);
 if(px<0||py<0||px>=canvas.width||py>=canvas.height)return;
 const pixel=canvas.getContext('2d').getImageData(px,py,1,1).data;
 if(pixel[0]*.299+pixel[1]*.587+pixel[2]*.114<150&&editorSelection.has(index)){
 const textNode=svg.querySelector('[data-label-element="'+index+'"] text');let char=-1;
 if(textNode){const pt=svg.createSVGPoint();pt.x=x;pt.y=y;try{char=textNode.getCharNumAtPosition(pt.matrixTransform(textNode.getScreenCTM().inverse()));}catch(_){} }
 focusTextProperty(index,false,null,char>=0?char+1:null);
 }
 }catch(error){console.warn('Text hit detection failed',error);}
}
function focusTextProperty(index,selectText=true,initialText=null,caret=null){
  const element=editing?.elements?.[index];if(element?.type!=='text')return;
  document.getElementById('canvasTextEditor')?.blur();
  const originalText=String(editing.elements[index]?.text??'');
  const svg=liveOverlay(),hit=svg?.querySelector('[data-hit="'+index+'"]'),textNodes=[...svg?.querySelectorAll('[data-label-element="'+index+'"] text')||[]],textNode=textNodes[0];
  const textBounds=textNode?.getBoundingClientRect(),hitBounds=hit?.getBoundingClientRect(),bounds=hitBounds?.width?hitBounds:textBounds;if(!bounds)return;
  const input=document.createElement('textarea');input.id='canvasTextEditor';input.dataset.elementIndex=String(index);input.setAttribute('aria-label','Edit text');input.wrap='off';input.rows=1;input.value=initialText===null?String(element.text??''):initialText;
  const textStyle=textNode?getComputedStyle(textNode):null,box=textNode?.getBBox(),textMatrix=textNode?.getScreenCTM();
  const screenScaleX=textMatrix?Math.hypot(textMatrix.a,textMatrix.b):1,screenScaleY=textMatrix?Math.hypot(textMatrix.c,textMatrix.d):1;
  const scaleX=Math.max(.05,screenScaleX/Math.max(.05,screenScaleY)),rotationRad=textMatrix?Math.atan2(textMatrix.b,textMatrix.a):0;
  const fontPx=(parseFloat(textStyle?.fontSize)||18)*screenScaleY;
  // Replace the rendered SVG glyph while editing so the original and editable
  // text can never appear as two separate copies. Anchor the editor to the
  // glyph's screen bounds, not to the much larger selection rectangle.
  for(const node of textNodes)node.style.visibility='hidden';
  input.style.cssText='position:fixed;z-index:100;box-sizing:border-box;min-width:0;min-height:0;background:transparent;color:#111;caret-color:#111;border:0;border-radius:0;outline:none;padding:0;font-family:'+(textStyle?.fontFamily||'Arial,sans-serif')+';font-size:'+fontPx+'px;font-weight:'+(textStyle?.fontWeight||'600')+';line-height:1;white-space:pre;resize:none;overflow:hidden;transform:rotate('+rotationRad+'rad) scaleX('+scaleX+');transform-origin:left top;';
  const initialWidth=Math.max(24,(textBounds.width||bounds.width)/Math.max(.05,screenScaleX));
  const measureCanvas=document.createElement('canvas'),measureContext=measureCanvas.getContext('2d');
  const baselinePoint=svg.createSVGPoint();
  measureContext.font=input.style.fontWeight+' '+input.style.fontSize+' '+input.style.fontFamily;
  const initialMetrics=measureContext.measureText(input.value||'Ag');
  const initialBaseline=svgTextAlphabeticBaseline(textNode);
  baselinePoint.x=initialBaseline.x;baselinePoint.y=initialBaseline.y-(initialMetrics.fontBoundingBoxAscent||fontPx*.8)/Math.max(.05,screenScaleY);
  const screenBaseline=baselinePoint.matrixTransform(textNode.getScreenCTM());
  input.style.left=Math.max(0,screenBaseline.x)+'px';input.style.top=Math.max(0,screenBaseline.y)+'px';input.style.width=initialWidth+'px';input.style.height=Math.max(24,textBounds.height||bounds.height)+'px';
  const fitCaretToGlyph=()=>{
    if(!measureContext)return;
    measureContext.font=input.style.fontWeight+' '+input.style.fontSize+' '+input.style.fontFamily;
    const metrics=measureContext.measureText(input.value||'Ag');
    const ascent=metrics.fontBoundingBoxAscent||fontPx*.8,descent=metrics.fontBoundingBoxDescent||fontPx*.2;
    const lineHeight=ascent+descent;
    input.style.lineHeight=lineHeight+'px';input.style.height=lineHeight+'px';
    const clipTop=Math.max(0,ascent-metrics.actualBoundingBoxAscent),clipBottom=Math.max(0,descent-metrics.actualBoundingBoxDescent);
    input.style.clipPath='inset('+clipTop+'px 0 '+clipBottom+'px 0)';
  };
  fitCaretToGlyph();
  const editorOverlay=svg.querySelector('[data-editor-overlay="'+index+'"]'),selectionRect=editorOverlay?.querySelector('.sel'),hitRect=editorOverlay?.querySelector('.hit[data-hit="'+index+'"]');
  const previewFrame=document.getElementById('previewFrame');
  let livePositionFrame=null,lastLiveTextMatrix='';
  const syncLiveTextPosition=()=>{
    livePositionFrame=null;
    if(!input.isConnected||!textNode?.isConnected)return;
    try{
      const matrix=textNode.getScreenCTM();if(!matrix)return;
      const matrixKey=[matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f].join(',');
      if(matrixKey===lastLiveTextMatrix){livePositionFrame=requestAnimationFrame(syncLiveTextPosition);return;}
      lastLiveTextMatrix=matrixKey;
      const sx=Math.hypot(matrix.a,matrix.b),sy=Math.hypot(matrix.c,matrix.d);if(!(sx>0&&sy>0))return;
      const style=getComputedStyle(textNode),fontSize=(parseFloat(style.fontSize)||18)*sy,scaleX=Math.max(.05,sx/sy),rotation=Math.atan2(matrix.b,matrix.a);
      input.style.fontSize=fontSize+'px';input.style.transform='rotate('+rotation+'rad) scaleX('+scaleX+')';
      measureContext.font=input.style.fontWeight+' '+input.style.fontSize+' '+input.style.fontFamily;
      const metrics=measureContext.measureText(input.value||'Ag'),box=textNode.getBBox(),point=svg.createSVGPoint();
      const glyphBaseline=svgTextAlphabeticBaseline(textNode);
      point.x=glyphBaseline.x;point.y=glyphBaseline.y-(metrics.fontBoundingBoxAscent||fontSize*.8)/sy;
      const screen=point.matrixTransform(matrix);
      input.style.left=Math.max(0,screen.x)+'px';input.style.top=Math.max(0,screen.y)+'px';
      syncLiveTextWidth();
    }catch(error){console.debug('Could not reposition the live text editor:',error);}
    if(input.isConnected&&textNode.isConnected)livePositionFrame=requestAnimationFrame(syncLiveTextPosition);
  };
  const scheduleLiveTextPosition=()=>{if(livePositionFrame===null)livePositionFrame=requestAnimationFrame(syncLiveTextPosition);};
  const syncLiveTextWidth=()=>{
    if(!measureContext)return;
    measureContext.font=input.style.fontWeight+' '+input.style.fontSize+' '+input.style.fontFamily;
    const measured=Math.ceil(measureContext.measureText(input.value||' ').width)+2;
    input.style.width=Math.max(2,measured)+'px';fitCaretToGlyph();
    const textCtm=textNode.getScreenCTM();
    if(textCtm){
      const sy=Math.hypot(textCtm.c,textCtm.d),metrics=measureContext.measureText(input.value||' '),baseline=svgTextAlphabeticBaseline(textNode),point=svg.createSVGPoint();
      const anchor=textNode.getAttribute('text-anchor')||'start',advance=metrics.width/Math.max(.05,sy);
      point.x=(parseFloat(textNode.getAttribute('x'))||0)-(anchor==='middle'?advance/2:anchor==='end'?advance:0);
      point.y=baseline.y-(metrics.fontBoundingBoxAscent||parseFloat(input.style.fontSize)*.8)/Math.max(.05,sy);
      const screen=point.matrixTransform(textCtm);input.style.left=screen.x+'px';input.style.top=screen.y+'px';
    }
    const ctm=svg.getScreenCTM(),screenScale=ctm?Math.hypot(ctm.a,ctm.b):0;
    if(!selectionRect||!(screenScale>0))return;
    const liveInk=textInkBounds(svg,index,input.value||' ');
    const x=liveInk?.x??(Number(selectionRect.getAttribute('x'))||0),y=liveInk?.y??(Number(selectionRect.getAttribute('y'))||0);
    const newWidth=Math.max(.3,liveInk?.w??input.getBoundingClientRect().width/screenScale),h=Math.max(.3,liveInk?.h??(Number(selectionRect.getAttribute('height'))||.3));
    selectionRect.setAttribute('x',x);selectionRect.setAttribute('y',y);selectionRect.setAttribute('width',newWidth);selectionRect.setAttribute('height',h);
    const outline=editorOverlay.querySelector('.hover-outline');if(outline){outline.setAttribute('x',x);outline.setAttribute('y',y);outline.setAttribute('width',newWidth);outline.setAttribute('height',h);}
    if(hitRect){hitRect.setAttribute('x',x);hitRect.setAttribute('y',y);hitRect.setAttribute('width',newWidth);hitRect.setAttribute('height',h);}
    const anchors={nw:[x,y],n:[x+newWidth/2,y],ne:[x+newWidth,y],e:[x+newWidth,y+h/2],se:[x+newWidth,y+h],s:[x+newWidth/2,y+h],sw:[x,y+h],w:[x,y+h/2]};
    editorOverlay.querySelectorAll('.handle-hit').forEach(handle=>{const pt=anchors[handle.dataset.anchor];if(!pt)return;if(handle.hasAttribute('cx')){handle.setAttribute('cx',pt[0]);handle.setAttribute('cy',pt[1]);}else{handle.setAttribute('x',pt[0]-.65);handle.setAttribute('y',pt[1]-.65);}});
    editorOverlay.querySelectorAll('.handle-dot').forEach(dot=>{const pt=anchors[dot.dataset.anchor];if(!pt)return;if(dot.hasAttribute('cx'))dot.setAttribute('cx',pt[0]);else dot.setAttribute('x',pt[0]-Number(dot.getAttribute('width'))/2);if(dot.hasAttribute('cy'))dot.setAttribute('cy',pt[1]);else dot.setAttribute('y',pt[1]-Number(dot.getAttribute('height'))/2);});
    editorOverlay.querySelectorAll('.rotation-hit,.rotation-dot').forEach(handle=>{handle.setAttribute('cx',x+newWidth/2);handle.setAttribute('cy',y-1.85);});
    editorOverlay.querySelectorAll('.rotation-stem').forEach(stem=>stem.setAttribute('d',`M ${x+newWidth/2} ${y} L ${x+newWidth/2} ${y-1.85}`));
    const floating=editorOverlay.querySelector('.line-controls');if(floating){floating.remove();const r=(Number(editing.elements[index].rotation_deg)||0)*Math.PI/180,pivot=liveInk?.rotationCenter||{x:x+newWidth/2,y:y+h/2},corners=[{x,y},{x:x+newWidth,y},{x:x+newWidth,y:y+h},{x,y:y+h}].map(p=>{const dx=p.x-pivot.x,dy=p.y-pivot.y;return{x:pivot.x+dx*Math.cos(r)-dy*Math.sin(r),y:pivot.y+dx*Math.sin(r)+dy*Math.cos(r)};});editorOverlay.insertAdjacentHTML('beforeend',window.LineControls.render([{x:Math.min(...corners.map(p=>p.x)),y:Math.min(...corners.map(p=>p.y))},{x:Math.max(...corners.map(p=>p.x)),y:Math.max(...corners.map(p=>p.y))}],index,screenScale,!!editing.elements[index].locked,{showEndpoints:false,kind:'text',showReset:window.TransformHistory?.has(editing.elements[index],index)}));bindLineSelectionControls(svg);}
    positionSelectionName(editorOverlay,{x,y,w:newWidth,h,rotationCenter:liveInk?.rotationCenter},editing.elements[index]);
  };
  const liveResizeObserver=new ResizeObserver(scheduleLiveTextPosition);liveResizeObserver.observe(previewFrame);liveResizeObserver.observe(svg);
  previewFrame?.addEventListener('wheel',scheduleLiveTextPosition,{passive:true});previewFrame?.addEventListener('scroll',scheduleLiveTextPosition,{passive:true});
  window.addEventListener('scroll',scheduleLiveTextPosition,true);
  const trackLiveTextPan=event=>{if(event.buttons)scheduleLiveTextPosition();};window.addEventListener('pointermove',trackLiveTextPan,{passive:true});
  let textSnapshotTaken=false;
  input.addEventListener('input',()=>{
    if(!editing?.elements[index]||editing.elements[index].type!=='text')return;
    if(!textSnapshotTaken){pushSnapshot();textSnapshotTaken=true;}
    editing.elements[index].text=input.value;
    syncLiveTextWidth();touchEditor();
  });
  const finishOnOutsideClick=event=>{if(!input.contains(event.target))input.blur();};document.addEventListener('pointerdown',finishOnOutsideClick,true);
  // Preserve Chromium's native double-click word selection in the editor.
  input.addEventListener('dblclick',event=>event.stopPropagation());
  input.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();input.blur();const hit=liveOverlay()?.querySelector('.hit[data-hit="'+index+'"]');hit?.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:event.clientX,clientY:event.clientY}));});
  input.addEventListener('click',event=>{event.stopPropagation();if(event.detail>=3){event.preventDefault();input.select();}});
  let cancelled=false;
  input.addEventListener('keydown',event=>{event.stopPropagation();if((event.ctrlKey||event.metaKey)&&(event.code==='KeyA'||event.key.toLowerCase()==='a')){event.preventDefault();input.select();return;}if(event.key==='Escape'){event.preventDefault();cancelled=true;input.blur();}else if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();input.blur();}});
  input.addEventListener('blur',()=>{
    document.removeEventListener('pointerdown',finishOnOutsideClick,true);
    liveResizeObserver.disconnect();previewFrame?.removeEventListener('wheel',scheduleLiveTextPosition);previewFrame?.removeEventListener('scroll',scheduleLiveTextPosition);window.removeEventListener('scroll',scheduleLiveTextPosition,true);window.removeEventListener('pointermove',trackLiveTextPan);if(livePositionFrame!==null)cancelAnimationFrame(livePositionFrame);
    const value=cancelled?originalText:input.value;
    input.remove();for(const node of textNodes)node.style.visibility='';
    if(editing?.elements[index]?.type!=='text')return;
    readEditorIntoDraft();
    if(!cancelled&&!value.trim()){
      if(!textSnapshotTaken)pushSnapshot();
      editing.elements.splice(index,1);
      editorSelection=new Set([...editorSelection].filter(i=>i!==index).map(i=>i>index?i-1:i));
      editorSel=editorSelection.size?[...editorSelection].at(-1):-1;
    }else{
      if(!textSnapshotTaken&&value!==originalText)pushSnapshot();
      editing.elements[index].text=value;
    }
    refreshEditorUI();touchEditor();updateUndoButtons();void persistEditor();
  },{once:true});
  document.body.append(input);syncLiveTextWidth();syncLiveTextPosition();input.focus();if(caret!==null&&initialText===null&&!String(element.text??'').includes('{{')){const at=Math.max(0,Math.min(input.value.length,caret));input.setSelectionRange(at,at);}else if(initialText===null&&selectText)input.select();else input.setSelectionRange(input.value.length,input.value.length);
}
function createInsertElementDraft(type,textValue=null){
  if(!insertElementDefaults[type])return null;
  const added={...insertElementDefaults[type]};
  if(textValue!==null&&Object.hasOwn(added,'text'))added.text=textValue;
  if(['barcode128','code39','code93','ean13'].includes(type)){
    if(textValue===null)added.text=type==='ean13'?'1234567890128':'12345678';
    added.show_text=true;
    added.module_width=Math.max(1,Math.round((Number(editing.dpi)||203)*.254/25.4));
    const box=window.LabelPreview.computeBoxes({...editing,elements:[added]},sampleData(editing))[0];
    added.bar_height_mm=Math.max(4,Math.min(25,(Number(box?.w)||25)*.42));
    added.hri_height_mm=Math.max(1.5,added.bar_height_mm*.28);
    added.font_family='Arial';added.font_size_pt=added.hri_height_mm*72/25.4;
    added.text_align='center';added.hri_align='center';added.text_auto_fit=true;
  }
  return added;
}
function insertEditorElement(type,point=null,textValue=null,options={}){
  if(!editing||!insertElementDefaults[type])return null;
  if(!options.skipHistory){readEditorIntoDraft();pushSnapshot();}
  const added=createInsertElementDraft(type,textValue);
  if(point){
    const margin=editing.margin_mm||{};
    added.x_mm=Math.max(designPaperBounds().minX,snapVal(point.x-(Number(margin.left)||0)));
    added.y_mm=Math.max(designPaperBounds().minY,snapVal(point.y-(Number(margin.top)||0)));
  }else placeNewElementAtBottom(added);
  editing.elements=editing.elements||[];editing.elements.push(added);noteRecentObjectUsage(added);
  editorSel=editing.elements.length-1;editorSelection=new Set([editorSel]);
  if(!options.deferRender){renderEditorElements();updateEditorPreview();touchEditor();}
  if(type==='text')focusTextProperty(editing.elements.length-1,true);
  return added;
}
function isReplaceablePicture(element){
  return element?.type==='image' && !element.shape_preset && !element.barcode_spec && !element.symbol_font && !element.table_model;
}
function importPictureForElement(index){
  if(!isReplaceablePicture(editing?.elements?.[index]))return false;
  pendingImageReplaceIndex=index;
  pendingImageDropMm=null;
  pendingImageFormat=editing.elements[index].source_format==='svg'?'svg':'image';
  const input=el('imageFile');
  input.accept='image/png,image/jpeg,image/bmp,image/webp,image/svg+xml,.svg';
  input.click();
  return true;
}
window.isReplaceablePicture=isReplaceablePicture;
window.importPictureForElement=importPictureForElement;
window.removeImageBackground=index=>{
  if(!isReplaceablePicture(editing?.elements?.[index])||editing.elements[index].locked)return false;
  try{
    readEditorIntoDraft();
    const target=editing.elements[index];
    const updated=window.LabelBitmap.removeBackground(structuredClone(target));
    pushSnapshot();Object.assign(target,updated);
    renderEditorElements();drawEditorCanvas();touchEditor();void persistEditor();
    setEditorStatus('ok','Background removed.');return true;
  }catch(error){setEditorStatus('err',error.message);return false;}
};
function insertPicturePlaceholderAt(point){
  if(!editing||!point)return;
  readEditorIntoDraft();pushSnapshot();
  const margin=editing.margin_mm||{},width=Math.min(30,Math.max(8,(Number(editing.width_mm)||50)*.45)),height=width*.75;
  const maxX=Math.max(0,(Number(editing.width_mm)||50)-width),maxY=Math.max(0,(Number(editing.height_mm)||25)-height);
  const item={type:'image',label:'Picture',placeholder:true,width_mm:width,height_mm:height,
    x_mm:snapVal(Math.max(0,Math.min(maxX,point.x-(Number(margin.left)||0)-width/2))),
    y_mm:snapVal(Math.max(0,Math.min(maxY,point.y-(Number(margin.top)||0)-height/2)))};
  editing.elements.push(item);noteRecentObjectUsage(item);editorSel=editing.elements.length-1;editorSelection=new Set([editorSel]);
  renderEditorElements();drawEditorCanvas();touchEditor();
}

const recentToolNames={text:'Text',barcode128:'Code 128',code39:'Code 39',code93:'Code 93',ean13:'EAN-13',qrcode:'QR Code',datamatrix:'Data Matrix',image:'Picture',box:'Rectangle',ellipse:'Ellipse',line:'Line',inverse:'Inverse'};
const recentToolIcons={text:'<path d="M4 5h16M12 5v15M8 20h8"/>',barcode128:'<path d="M4 4v16M7 4v16M9 4v16M13 4v16M16 4v16M18 4v16M21 4v16"/>',code39:'<path d="M4 4v16M8 4v16M11 4v16M15 4v16M19 4v16M21 4v16"/>',code93:'<path d="M4 4v16M7 4v16M10 4v16M14 4v16M17 4v16M20 4v16"/>',ean13:'<path d="M4 4v16M6 4v16M9 4v16M11 4v16M13 4v16M16 4v16M18 4v16M20 4v16"/>',qrcode:'<path d="M4 4h7v7H4zM6 6v3h3V6zM13 4h7v7h-7zM15 6v3h3V6zM4 13h7v7H4zM6 15v3h3v-3zM14 14h3v3h-3zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>',datamatrix:'<path d="M4 4h16v2H6v14H4zM6 8h2v2H6zM10 8h2v2h-2zM14 8h2v2h-2zM10 12h4v2h-4zM8 14h2v2H8zM14 16h2v2h-2zM18 10h2v10h-2z"/>',image:'<rect x="3" y="3" width="18" height="18"/><circle cx="9" cy="9" r="2"/><path d="m4 18 6-6 3 3 2-2 5 5"/>',box:'<rect x="4" y="5" width="16" height="14"/>',ellipse:'<ellipse cx="12" cy="12" rx="8" ry="6"/>',line:'<path d="m5 19 14-14"/><circle cx="5" cy="19" r="1"/><circle cx="19" cy="5" r="1"/>',inverse:'<rect x="4" y="5" width="16" height="14" fill="currentColor"/><path d="M8 10h8M8 14h5" stroke="white"/>'};
function recentObjectHash(value){let a=2166136261,b=5381;for(let index=0;index<value.length;index++){const code=value.charCodeAt(index);a=Math.imul(a^code,16777619);b=Math.imul(b,33)^code;}return`${value.length}:${(a>>>0).toString(36)}:${(b>>>0).toString(36)}`;}
function recentObjectIdentity(element){
  if(!element||typeof element!=='object')return'';
  if(element.table_model)return'table';
  if(element.shape_preset)return`shape:${element.shape_preset}`;
  if(element.symbol_font)return`symbol:${element.symbol_font_family||element.font_family||''}:${element.symbol_codepoint??element.text??''}`;
  if(element.source_format==='svg'&&element.svg_data)return`svg:${element.label||''}:${recentObjectHash(element.svg_data)}`;
  if(element.type==='image'&&element.bitmap_hex)return`bitmap:${element.bitmap_width}x${element.bitmap_height}:${recentObjectHash(element.bitmap_hex)}`;
  const omit=new Set(['x_mm','y_mm','shape_baked','bitmap_hex','rendered_bitmap','cached_preview']);
  const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).filter(key=>!omit.has(key)).sort().map(key=>[key,stable(value[key])])):value;
  return`${element.type||'object'}:${recentObjectHash(JSON.stringify(stable(element)))}`;
}
function recentObjectBaseName(element){
  const label=String(element?.label||'').trim().replace(/\s*\(\d+\)\s*$/,'');if(label)return label;
  if(element?.table_model)return`Table ${element.table_model.columns?.length||0}×${element.table_model.rows?.length||0}`;
  if(element?.shape_preset)return String(element.shape_preset).replace(/[-_]+/g,' ');
  if(element?.symbol_font){const code=element.symbol_codepoint??element.text??'';return`${element.symbol_font_family||element.font_family||'Symbol'} ${code}`.trim();}
  if(element?.bcid)return`${String(element.bcid).toUpperCase()}${element.text?` · ${String(element.text).slice(0,16)}`:''}`;
  if(element?.source_format==='svg')return`SVG · ${String(element.source_name||element.filename||'Graphic')}`;
  if(element?.type==='image')return`Picture · ${String(element.source_name||element.filename||`${element.bitmap_width||0}×${element.bitmap_height||0}`)}`;
  return recentToolNames[element?.type]||element?.type||'Object';
}
function uniqueRecentObjectNames(entries){
  const counts=new Map();
  for(const entry of entries){const base=recentObjectBaseName(entry.element),count=(counts.get(base)||0)+1;counts.set(base,count);entry.name=count===1?base:`${base} (${count})`;}
  return entries;
}
function normalizeRecentObjectEntries(entries){
  const result=[],seen=new Set(),seenNames=new Set();
  for(const entry of Array.isArray(entries)?entries:[]){if(!entry?.element)continue;const key=recentObjectIdentity(entry.element)||entry.key,name=recentObjectBaseName(entry.element).toLowerCase();if(!key||seen.has(key)||seenNames.has(name))continue;seen.add(key);seenNames.add(name);result.push({...entry,key});if(result.length>=100)break;}
  return uniqueRecentObjectNames(result);
}
function recentObjectThumbnail(element){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const node=(name,attrs={})=>{const item=document.createElementNS(ns,name);for(const [key,value] of Object.entries(attrs))item.setAttribute(key,String(value));return item;};
  if(element?.shape_preset&&window.ShapeTools){
    try{const geometry=window.ShapeTools.paths(element.shape_preset),width=Math.max(.1,Number(element.width_mm)||20),height=Math.max(.1,Number(element.height_mm)||15),scale=Math.min(20/width,20/height),displayW=width*scale,displayH=height*scale;
      const shape=node('svg',{x:(24-displayW)/2,y:(24-displayH)/2,width:displayW,height:displayH,viewBox:`${geometry.bounds.x} ${geometry.bounds.y} ${geometry.bounds.w} ${geometry.bounds.h}`,preserveAspectRatio:'none'}),fill=element.fill_color||'none',stroke=element.stroke_color||'#111111';
      for(const part of geometry){const path=node('path',{d:part.d,transform:`scale(${21600/part.w} ${21600/part.h})`,fill:part.fill?fill:'none',stroke:part.stroke?stroke:'none','stroke-width':Math.max((Number(element.thickness_mm)||.3)*part.w/width,geometry.bounds.w/22*part.w/21600),'stroke-linejoin':'round'});path.style.setProperty('fill',part.fill?fill:'none','important');path.style.setProperty('stroke',part.stroke?stroke:'none','important');shape.append(path);}svg.append(shape);return svg;
    }catch(error){console.warn('Recent shape preview failed:',error);}
  }
  if(!element?.bitmap_hex&&(element?.symbol_font||element?.font_family&&element?.type==='text')){
    const text=node('text',{x:12,y:19,'text-anchor':'middle','dominant-baseline':'alphabetic','font-family':element.font_family||'Arial','font-size':20,fill:element.text_color||'#111111',stroke:'none'});text.textContent=String(element.text||'');svg.append(text);return svg;
  }
  if(element?.source_format==='svg'&&element?.svg_data){
    try{const parsed=new DOMParser().parseFromString(String(element.svg_data),'image/svg+xml'),root=parsed.documentElement,viewBox=String(root.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);if(root.localName==='svg'&&viewBox.length===4&&viewBox.every(Number.isFinite)&&viewBox[2]>0&&viewBox[3]>0){const inline=node('svg',{x:2,y:2,width:20,height:20,viewBox:viewBox.join(' '),preserveAspectRatio:'xMidYMid meet'});for(const child of [...root.children])inline.append(document.importNode(child,true));svg.append(inline);return svg;}}catch(error){console.warn('Recent SVG preview failed:',error);}
  }
  const width=Number(element?.bitmap_width),height=Number(element?.bitmap_height),hex=String(element?.bitmap_hex||'');
  if(Number.isInteger(width)&&width>0&&Number.isInteger(height)&&height>0&&hex.length===Math.ceil(width/8)*height*2&&!/[^0-9a-f]/i.test(hex)){
    const cols=20,rows=20,source=new Uint8Array(width*height),stride=Math.ceil(width/8);for(let y=0;y<height;y++)for(let x=0;x<width;x++)source[y*width+x]=(parseInt(hex.slice((y*stride+(x>>3))*2,(y*stride+(x>>3))*2+2),16)&(128>>(x&7)))?1:0;
    const pathData=[];for(let y=0;y<rows;y++){let run=-1;for(let x=0;x<=cols;x++){let on=false;if(x<cols){const x0=Math.floor(x*width/cols),x1=Math.max(x0+1,Math.ceil((x+1)*width/cols)),y0=Math.floor(y*height/rows),y1=Math.max(y0+1,Math.ceil((y+1)*height/rows));outer:for(let sy=y0;sy<Math.min(y1,height);sy++)for(let sx=x0;sx<Math.min(x1,width);sx++)if(source[sy*width+sx]){on=true;break outer;}}if(on&&run<0)run=x;if((!on||x===cols)&&run>=0){pathData.push(`M${run} ${y}h${x-run}v1h-${x-run}z`);run=-1;}}}
    if(pathData.length){const ratio=width/height,displayW=ratio>=1?20:20*ratio,displayH=ratio>=1?20/ratio:20,offsetX=2+(20-displayW)/2,offsetY=2+(20-displayH)/2,path=node('path',{d:pathData.join(''),transform:`translate(${offsetX} ${offsetY}) scale(${displayW/20} ${displayH/20})`,fill:'#111111',stroke:'none','shape-rendering':'crispEdges'});path.style.setProperty('fill','#111111','important');path.style.setProperty('stroke','none','important');svg.append(path);return svg;}
  }
  svg.innerHTML=recentToolIcons[element?.type]||recentToolIcons.image;return svg;
}
async function clearRecentObjects(){
  const previous={entries:settings.recentObjectEntries,tools:settings.recentObjectTools};
  settings.recentObjectEntries=[];settings.recentObjectTools=[];renderRecentToolButtons();
  const cleared={entries:settings.recentObjectEntries,tools:settings.recentObjectTools};
  try{await window.zebra.saveSettings({recentObjectEntries:[],recentObjectTools:[]});return true;}
  catch(error){
    if(settings.recentObjectEntries===cleared.entries&&settings.recentObjectTools===cleared.tools){settings.recentObjectEntries=previous.entries;settings.recentObjectTools=previous.tools;renderRecentToolButtons();}
    console.warn('Could not clear recent objects:',error);
    if(typeof setEditorStatus==='function')setEditorStatus('err','Could not clear recent objects');
    return false;
  }
}
function bindRecentObjectsClearMenu(grid){
  const area=grid.closest('.insert-recent-objects')||grid;if(area._recentClearMenuBound)return;area._recentClearMenuBound=true;
  const menu=document.createElement('div');menu.className='recent-objects-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Recently Used Objects');menu.hidden=true;
  const button=document.createElement('button');button.type='button';button.setAttribute('role','menuitem');
  button.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Clear</span>';
  menu.append(button);document.body.append(menu);
  if(!document.getElementById('recentObjectsMenuStyle')){const style=document.createElement('style');style.id='recentObjectsMenuStyle';style.textContent='.recent-objects-menu{position:fixed;z-index:6100;min-width:155px;padding:5px;border:1px solid var(--border,#d7dee8);border-radius:8px;background:var(--card,#fff);box-shadow:0 8px 26px #0003}.recent-objects-menu[hidden]{display:none}.recent-objects-menu button{display:flex;align-items:center;gap:9px;width:100%;padding:8px 12px;border:0;border-radius:4px;background:transparent;color:var(--text,#1f2937);font:13px Segoe UI,sans-serif;text-align:left;cursor:pointer}.recent-objects-menu button:hover,.recent-objects-menu button:focus-visible{background:#e7f6ec;outline:none}.recent-objects-menu button:disabled{opacity:.4;cursor:default}';document.head.append(style);}
  const close=()=>{menu.hidden=true;};
  area.addEventListener('contextmenu',event=>{
    close();if(event.target.closest('.insert-tool'))return;
    event.preventDefault();event.stopPropagation();
    button.disabled=!(settings.recentObjectEntries?.length||settings.recentObjectTools?.length);menu.hidden=false;
    menu.style.left=Math.max(4,Math.min(event.clientX,window.innerWidth-(menu.offsetWidth||167)-4))+'px';
    menu.style.top=Math.max(4,Math.min(event.clientY,window.innerHeight-(menu.offsetHeight||44)-4))+'px';
    button.focus({preventScroll:true});
  });
  button.addEventListener('click',()=>{close();void clearRecentObjects();});
  document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  document.addEventListener('scroll',event=>{if(!menu.contains(event.target))close();},true);window.addEventListener('blur',close);
}
function renderRecentToolButtons(){
  const grid=el('recentObjectTools');if(!grid)return;bindRecentObjectsClearMenu(grid);const stored=JSON.stringify(settings.recentObjectEntries||[]);settings.recentObjectEntries=normalizeRecentObjectEntries(settings.recentObjectEntries);if(stored!==JSON.stringify(settings.recentObjectEntries))window.zebra.saveSettings({recentObjectEntries:settings.recentObjectEntries}).catch(error=>console.warn('Could not clean duplicate recent objects:',error));grid.replaceChildren();
  for(const entry of settings.recentObjectEntries||[]){
    const button=document.createElement('button');button.type='button';button.className='insert-tool';button.title='Add '+entry.name;button.draggable=true;
    button.addEventListener('dragstart',event=>{const payload={kind:'recent-object',value:entry.element};event.dataTransfer.setData('application/x-bratender-insert',JSON.stringify(payload));});
    button.append(recentObjectThumbnail(entry.element));const caption=document.createElement('span');caption.className='recent-object-caption';caption.textContent=entry.name;caption.title=entry.name;button.append(caption);
    button._placementElement=entry.element;
    button.onclick=()=>armSidebarPlacement(button,{kind:'recent-object',value:entry.element});grid.append(button);
  }
  const tools=Array.isArray(settings.recentObjectTools)?settings.recentObjectTools:[];
  for(const type of new Set(tools)){if(!recentToolNames[type]||(settings.recentObjectEntries||[]).some(entry=>recentObjectBaseName(entry.element).toLowerCase()===recentToolNames[type].toLowerCase()))continue;const button=document.createElement('button');button.type='button';button.className='insert-tool';button.draggable=true;button.dataset.add=type;button.title=`Add ${recentToolNames[type]} to the label`;button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${recentToolIcons[type]}</svg><span></span>`;button.querySelector('span').textContent=recentToolNames[type];grid.append(button);}
  if(!grid.children.length){const empty=document.createElement('div');empty.className='source-empty';empty.textContent='Objects you use will appear here.';grid.append(empty);}
}
function initializeInsertSidebarResizer(){
  const sidebar=el('insertSidebar'),recent=sidebar?.querySelector('.insert-recent-objects'),sources=sidebar?.querySelector('.insert-data-sources');
  if(!sidebar||!recent||!sources||sidebar.querySelector('.insert-sidebar-resizer'))return;
  const handle=document.createElement('div');handle.className='insert-sidebar-resizer';handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','horizontal');handle.setAttribute('aria-label','Resize Data Sources area');handle.setAttribute('aria-valuemin','20');handle.setAttribute('aria-valuemax','90');handle.tabIndex=0;sidebar.insertBefore(handle,sources);
  let recentRatio=Number(settings.insertSidebarRecentHeightRatio);if(Number.isFinite(recentRatio)&&recentRatio>0){requestAnimationFrame(()=>resizeRecent(recentRatio*sidebar.clientHeight,false));}
  function resizeRecent(requested,persist=true){
    const sidebarHeight=sidebar.clientHeight,footer=sidebar.querySelector('.insert-sidebar-footer'),handleHeight=handle.offsetHeight||7,available=Math.max(180,sidebarHeight-(footer?.offsetHeight||0)-handleHeight);
    const min=Math.min(110,available*.25),sourceMin=110,max=Math.max(min,available-sourceMin),height=Math.max(min,Math.min(max,requested));
    recent.style.flex=`0 0 ${height}px`;sources.style.flex='1 1 0px';recentRatio=height/Math.max(1,sidebarHeight);handle.setAttribute('aria-valuenow',String(Math.round(recentRatio*100)));
    if(persist){settings.insertSidebarRecentHeightRatio=recentRatio;clearTimeout(handle._saveTimer);handle._saveTimer=setTimeout(()=>window.zebra.saveSettings({insertSidebarRecentHeightRatio:recentRatio}),180);}
  }
  handle.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();handle.setPointerCapture(event.pointerId);document.body.classList.add('resizing-insert-sidebar');const move=next=>{const bounds=sidebar.getBoundingClientRect();resizeRecent(next.clientY-bounds.top);};const up=()=>{handle.releasePointerCapture?.(event.pointerId);document.body.classList.remove('resizing-insert-sidebar');handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',up);};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',up);});
  handle.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const current=recent.getBoundingClientRect().height,step=event.shiftKey?48:16,min=110;resizeRecent(event.key==='Home'?min:event.key==='End'?sidebar.clientHeight:current+(event.key==='ArrowDown'?step:-step));});
  window.addEventListener('resize',()=>{if(recentRatio)resizeRecent(recentRatio*sidebar.clientHeight,false);});
}
function noteRecentObjectTool(type){if(!recentToolNames[type])return;settings.recentObjectTools=[type,...(settings.recentObjectTools||[]).filter(item=>item!==type)];renderRecentToolButtons();window.zebra.saveSettings({recentObjectTools:settings.recentObjectTools});}
function noteRecentObjectUsage(element){
  if(!element)return;
  const specific=element.symbol_font||element.shape_preset||element.bcid||element.barcode_bars||element.table_model||element.type==='image';
  if(!specific){noteRecentObjectTool(element.type);return;}
  const copy=JSON.parse(JSON.stringify(element));delete copy.x_mm;delete copy.y_mm;
  const key=recentObjectIdentity(copy),name=recentObjectBaseName(element);
  const entries=normalizeRecentObjectEntries(settings.recentObjectEntries);
  settings.recentObjectEntries=uniqueRecentObjectNames([{key,name,element:copy},...entries.filter(entry=>recentObjectIdentity(entry.element)!==key)].slice(0,100));
  renderRecentToolButtons();window.zebra.saveSettings({recentObjectEntries:settings.recentObjectEntries});
}
window.noteRecentObjectUsage=noteRecentObjectUsage;
window.noteRecentObjectTool=noteRecentObjectTool;
window.useObjectTool=type=>{noteRecentObjectTool(type==='svg'?'image':type);if(type==='image'||type==='svg'){pendingImageDropMm=null;pendingImageFormat=type;el('imageFile').accept=type==='svg'?'image/svg+xml,.svg':'image/png,image/jpeg';el('imageFile').click();return;}insertEditorElement(type);};

function renderSidebarDataSources(){
  if(window.DataSourcesUI){window.DataSourcesUI.render();return;}
  const host=el('sidebarDataFields');if(!host)return;
  const priorOpen=new Map([...host.querySelectorAll('details')].map(details=>[details.dataset.group,details.open]));
  host.replaceChildren();
  const group=(title,open=false)=>{const details=document.createElement('details');details.className='source-group';details.dataset.group=title;details.open=priorOpen.has(title)?priorOpen.get(title):open;const summary=document.createElement('summary');summary.textContent=title;details.append(summary);host.append(details);return details;};
  const embedded=group('Embedded Data',true),fields=editing?placeholderNames(editing):[];
  if(fields.length){for(const name of fields){const item=document.createElement('button');item.type='button';item.className='source-item';item.draggable=true;item.dataset.sourceField=name;item.textContent=humanize(name);item.title='Drag to add this field or drop it on text/barcode to bind it';embedded.append(item);}}
  else{const empty=document.createElement('div');empty.className='source-empty';empty.textContent='No fields in this label';embedded.append(empty);}
  const objectValues=group('Object Values');
  const sources=(editing?.elements||[]).filter(item=>['barcode128','code39','code93','ean13','qrcode','datamatrix'].includes(item.type)&&String(item.text||'').trim());
  if(sources.length){sources.forEach((source,index)=>{const item=document.createElement('button');item.type='button';item.className='source-item';item.draggable=true;item.dataset.sourceText=source.text;item.textContent=source.label||`Barcode ${index+1}`;item.title='Drag this object value onto the label or another text/barcode';objectValues.append(item);});}
  else{const empty=document.createElement('div');empty.className='source-empty';empty.textContent='No objects with data';objectValues.append(empty);}
}

function designPaperBounds(){
  const paper=window.pageSetupCanvasSnapshot||editing,m=paper?.margin_mm||{},x=0,y=0;
  const width=Number(paper?.width_mm)||50,height=Number(paper?.height_mm)||25;
  return {x,y,width,height,minX:x-(Number(m.left)||0),minY:y-(Number(m.top)||0),maxX:x+width,maxY:y+height};
}
function objectOverflowsPaperShape(bounds,paper,shape=editing?.label_shape,radius=editing?.corner_radius_mm??2){
  const right=paper.x+paper.width,bottom=paper.y+paper.height,epsilon=.001;
  if(bounds.left<paper.x-epsilon||bounds.top<paper.y-epsilon||bounds.right>right+epsilon||bounds.bottom>bottom+epsilon)return true;
  const left=Math.max(bounds.left,paper.x),top=Math.max(bounds.top,paper.y),insideRight=Math.min(bounds.right,right),insideBottom=Math.min(bounds.bottom,bottom);
  if(insideRight<=left||insideBottom<=top)return false;
  if(shape==='ellipse'){
    const rx=paper.width/2,ry=paper.height/2,cx=paper.x+rx,cy=paper.y+ry;
    return [[left,top],[insideRight,top],[left,insideBottom],[insideRight,insideBottom]].some(([x,y])=>((x-cx)/rx)**2+((y-cy)/ry)**2>1+epsilon);
  }
  if(shape!=='rounded')return false;
  const r=Math.min(paper.width/2,paper.height/2,Math.max(0,Number(radius)||0));
  if(!r)return false;
  const corners=[
    {x:paper.x,y:paper.y,cx:paper.x+r,cy:paper.y+r,sx:-1,sy:-1},
    {x:right-r,y:paper.y,cx:right-r,cy:paper.y+r,sx:1,sy:-1},
    {x:right-r,y:bottom-r,cx:right-r,cy:bottom-r,sx:1,sy:1},
    {x:paper.x,y:bottom-r,cx:paper.x+r,cy:bottom-r,sx:-1,sy:1}
  ];
  return corners.some(c=>{
    const x0=Math.max(left,c.x),x1=Math.min(insideRight,c.x+r),y0=Math.max(top,c.y),y1=Math.min(insideBottom,c.y+r);
    if(x1<=x0||y1<=y0)return false;
    const x=c.sx<0?x0:x1,y=c.sy<0?y0:y1;
    return (x-c.cx)**2+(y-c.cy)**2>r*r+epsilon;
  });
}
function snapVal(v) {
  return DesignGrid.snap(v, editorGrid.snap, editorGrid.step);
}
function snapEditorValue(value, axis) {
  const paper = designPaperBounds();
  const edges = axis === 'x' ? [paper.x, paper.x + paper.width] : [paper.y, paper.y + paper.height];
  for (const edge of edges) if (Math.abs(value - edge) <= 0.75) return edge;
  return snapVal(value);
}
window.snapEditorValue = snapEditorValue;

function gridSVG(W, H) {
  const paper=designPaperBounds(),x0=paper.x,y0=paper.y;
  return DesignGrid.render({show:editorGrid.show,width:W,height:H,x:x0,y:y0,pitch:editorGrid.step,shape:editing?.label_shape,radius:editing?.corner_radius_mm??2});
}

let paperCornerDragging = false;
function renderPaperCornerControl(wrap, svg) {
  if (!editing || !svg) return;
  if (!document.getElementById('paperCornerControlStyle')) {
    const style = document.createElement('style');
    style.id = 'paperCornerControlStyle';
    style.textContent = '.paper-corner-control{position:absolute;top:-24px;z-index:24;width:26px;height:26px;padding:4px;transform:translate(-50%,-50%);border:0;border-radius:50%;background:#fff;color:#16a34a;box-shadow:0 1px 5px #0003;cursor:ew-resize;touch-action:none;opacity:.75}.paper-corner-control:hover,.paper-corner-control:focus-visible,.paper-corner-control.dragging{opacity:1;outline:2px solid #16a34a;outline-offset:2px}.paper-corner-control>svg{width:18px!important;height:18px!important;display:block}.paper-corner-value{display:none;position:absolute;left:calc(100% + 10px);bottom:calc(50% - 2px);padding:5px 9px;border-radius:7px;background:#fff;color:#344054;box-shadow:0 1px 5px #0003;font:12px Segoe UI,sans-serif;white-space:nowrap;pointer-events:none}.paper-corner-control:hover .paper-corner-value,.paper-corner-control:focus-visible .paper-corner-value,.paper-corner-control.dragging .paper-corner-value{display:block}';
    document.head.append(style);
  }
  const selectedImage=editorSelection.size===1?[...editorSelection][0]:editorSelection.size===0?editorSel:-1;
  const image=editing.elements?.[selectedImage];
  if(window.isReplaceablePicture?.(image)){
    const selection=svg.querySelector(`[data-editor-overlay="${selectedImage}"] .sel`),screen=selection?.getBoundingClientRect(),wrapRect=wrap.getBoundingClientRect();
    if(!screen||!wrapRect.width)return;
    const view=svg.viewBox.baseVal,width=Number(image.width_mm)||view.width,height=Number(image.height_mm)||view.height;
    const maximum=Math.min(width,height)/2,radius=Math.max(0,Math.min(maximum,Number(image.corner_radius_mm)||0));
    const button=document.createElement('button'),cornerControlGap=24;button.type='button';button.className='paper-corner-control'+(paperCornerDragging?' dragging':'');button.style.left=`${screen.left-wrapRect.left-cornerControlGap}px`;button.style.top=`${screen.top-wrapRect.top-cornerControlGap}px`;button.title='Drag left or right to adjust image corner radius · Use arrow keys';button.setAttribute('aria-label','Adjust image corner radius');
    const shownRadius=Number(mmToUnit(radius,measureUnit(),editing.dpi)).toFixed(2),iconRadius=maximum>0?Math.max(0,Math.min(8,radius/maximum*8)):0,tangent=iconRadius*.55228475,curvePath=iconRadius>.05?`M4 15V${4+iconRadius} C4 ${4+iconRadius-tangent} ${4+iconRadius-tangent} 4 ${4+iconRadius} 4 H15`:'M4 15V4H15',marker=4+iconRadius;
    button.innerHTML=`<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${curvePath}"/><circle cx="${marker}" cy="${marker}" r="2" fill="currentColor" stroke="none"/></svg><span class="paper-corner-value">${shownRadius} ${unitSuffix()}</span>`;wrap.append(button);
    const followImageCorner=()=>{
      if(!button.isConnected)return;
      const target=editing?.elements?.[selectedImage],matrix=svg.getScreenCTM();
      if(target&&matrix){const scale=Math.max(.01,Math.hypot(matrix.a,matrix.b)),angle=Number(target.rotation_deg)||0,radians=angle*Math.PI/180,x=(Number(target.x_mm)||0)+(Number(editing.margin_mm?.left)||0),y=(Number(target.y_mm)||0)+(Number(editing.margin_mm?.top)||0),w=Number(target.width_mm)||width,h=Number(target.height_mm)||height,cx=x+w/2,cy=y+h/2,dx=x-cornerControlGap/scale-cx,dy=y-cornerControlGap/scale-cy,point=new DOMPoint(cx+dx*Math.cos(radians)-dy*Math.sin(radians),cy+dx*Math.sin(radians)+dy*Math.cos(radians)).matrixTransform(matrix),bounds=wrap.getBoundingClientRect();button.style.left=(point.x-bounds.left)+'px';button.style.top=(point.y-bounds.top)+'px';button.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;}
      requestAnimationFrame(followImageCorner);
    };followImageCorner();
    const apply=value=>{const target=editing.elements?.[selectedImage];if(!target)return;target.corner_radius_mm=Math.round(Math.max(0,Math.min(maximum,value))*10)/10;drawEditorCanvas();};
    button.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();readEditorIntoDraft();pushSnapshot();const startX=event.clientX,pixelsPerMm=svg.getBoundingClientRect().width/view.width;paperCornerDragging=true;button.classList.add('dragging');const move=pointer=>apply(radius+(pointer.clientX-startX)/pixelsPerMm);const finish=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',finish);paperCornerDragging=false;drawEditorCanvas();touchEditor();};window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);});
    button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();event.stopPropagation();readEditorIntoDraft();pushSnapshot();apply(event.key==='Home'?0:event.key==='End'?maximum:radius+(event.key==='ArrowRight'?.5:-.5));touchEditor();wrap.querySelector('[aria-label="Adjust image corner radius"]')?.focus();});
    return;
  }
  if(image?.type==='box'&&!image.locked){
    const selectedIndex=selectedImage,element=image,width=Number(element.width_mm)||1,height=Number(element.height_mm)||1,maximum=Math.min(width,height)/2,radius=Math.max(0,Math.min(maximum,Number(element.corner_radius_mm)||0)),gap=24;
    const button=document.createElement('button');button.type='button';button.className='paper-corner-control'+(paperCornerDragging?' dragging':'');button.title='Drag to round the corners · Use arrow keys';button.setAttribute('aria-label','Adjust rectangle corner radius');
    const setIcon=value=>{const r=maximum?Math.max(0,Math.min(8,value/maximum*8)):0,t=r*.55228475,path=r>.05?`M4 15V${4+r} C4 ${4+r-t} ${4+r-t} 4 ${4+r} 4 H15`:'M4 15V4H15',marker=4+r;button.innerHTML=`<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/><circle cx="${marker}" cy="${marker}" r="2" fill="currentColor" stroke="none"/></svg><span class="paper-corner-value">${Number(mmToUnit(value,measureUnit(),editing.dpi)).toFixed(2)} ${unitSuffix()}</span>`;};
    setIcon(radius);wrap.append(button);
    const followBoxCorner=()=>{
      if(!button.isConnected)return;
      const matrix=svg.getScreenCTM(),target=editing?.elements?.[selectedIndex];
      if(target&&matrix){const scale=Math.max(.01,Math.hypot(matrix.a,matrix.b)),x=(Number(target.x_mm)||0)+(Number(editing.margin_mm?.left)||0),y=(Number(target.y_mm)||0)+(Number(editing.margin_mm?.top)||0),w=Number(target.width_mm)||width,h=Number(target.height_mm)||height,cx=x+w/2,cy=y+h/2,angle=(Number(target.rotation_deg)||0)*Math.PI/180,dx=x-gap/scale-cx,dy=y-gap/scale-cy,point=new DOMPoint(cx+dx*Math.cos(angle)-dy*Math.sin(angle),cy+dx*Math.sin(angle)+dy*Math.cos(angle)).matrixTransform(matrix),bounds=wrap.getBoundingClientRect();button.style.left=(point.x-bounds.left)+'px';button.style.top=(point.y-bounds.top)+'px';button.style.transform=`translate(-50%,-50%) rotate(${angle*180/Math.PI}deg)`;}
      requestAnimationFrame(followBoxCorner);
    };followBoxCorner();
    const apply=value=>{const target=editing?.elements?.[selectedIndex];if(!target)return;const next=Math.round(Math.max(0,Math.min(maximum,value))*10)/10;target.corner_radius_mm=next;const rect=svg.querySelector(`[data-label-element="${selectedIndex}"] rect`);if(rect){if(next){rect.setAttribute('rx',next);rect.setAttribute('ry',next);}else{rect.removeAttribute('rx');rect.removeAttribute('ry');}}setIcon(next);};
    button.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();readEditorIntoDraft();pushSnapshot();const startX=event.clientX,pixelsPerMm=Math.max(.01,Math.hypot(svg.getScreenCTM()?.a||1,svg.getScreenCTM()?.b||0));paperCornerDragging=true;button.classList.add('dragging');const move=pointer=>apply(radius+(pointer.clientX-startX)/pixelsPerMm);const finish=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',finish);paperCornerDragging=false;drawEditorCanvas();touchEditor();};window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);});
    button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();event.stopPropagation();readEditorIntoDraft();pushSnapshot();apply(event.key==='Home'?0:event.key==='End'?maximum:radius+(event.key==='ArrowRight'?.5:-.5));drawEditorCanvas();touchEditor();});
    return;
  }
  if(editing.label_shape==='ellipse')return;
  const view = svg.viewBox.baseVal;
  const radius = editing.label_shape === 'rounded' ? Number(editing.corner_radius_mm ?? 2) : 0;
  const maximum = Math.min(view.width, view.height, Number(editing.width_mm), Number(editing.height_mm)) / 2;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'paper-corner-control' + (paperCornerDragging ? ' dragging' : '');
  button.style.left = '-24px';
  button.title = 'Drag left or right to adjust corner radius · Use arrow keys';
  button.setAttribute('aria-label', 'Adjust paper corner radius');
  const shownRadius=Number(mmToUnit(radius,measureUnit(),editing.dpi)).toFixed(2);
  const iconRadius=maximum>0?Math.max(0,Math.min(8,radius/maximum*8)):0;
  const tangent=iconRadius*.55228475,curvePath=iconRadius>.05?`M4 15V${4+iconRadius} C4 ${4+iconRadius-tangent} ${4+iconRadius-tangent} 4 ${4+iconRadius} 4 H15`:'M4 15V4H15';
  const marker=4+iconRadius;
  button.innerHTML = `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${curvePath}"/><circle cx="${marker}" cy="${marker}" r="2" fill="currentColor" stroke="none"/></svg><span class="paper-corner-value">${shownRadius} ${unitSuffix()}</span>`;
  wrap.append(button);
  const apply = value => {
    editing.corner_radius_mm = Math.round(Math.max(0, Math.min(maximum, value)) * 10) / 10;
    editing.label_shape = editing.corner_radius_mm > 0 ? 'rounded' : 'rectangle';
    drawEditorCanvas();
  };
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    readEditorIntoDraft(); pushSnapshot();
    const startX = event.clientX, pixelsPerMm = svg.getBoundingClientRect().width / view.width;
    paperCornerDragging = true;
    button.classList.add('dragging');
    const move = pointer => apply(radius + (pointer.clientX - startX) / pixelsPerMm);
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      paperCornerDragging = false;
      drawEditorCanvas(); touchEditor();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  });
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    pushSnapshot();
    apply(event.key === 'Home' ? 0 : event.key === 'End' ? maximum : radius + (event.key === 'ArrowRight' ? .5 : -.5));
    touchEditor();
    wrap.querySelector('.paper-corner-control')?.focus();
  });
}

let previewRulerObserver = null;
let rulerPointer=null,rulerPointerFrame=null;
function updateRulerPointerMarkers(){
  const frame=el('previewFrame'),ruler=frame?.querySelector('#previewRuler'),svg=frame?.querySelector('.canvaswrap > svg');if(!frame||!ruler||!svg)return;
  let marker=document.getElementById('rulerPointerMarkers');
  if(!marker){marker=document.createElement('div');marker.id='rulerPointerMarkers';marker.setAttribute('aria-hidden','true');marker.style.cssText='position:fixed;inset:0;z-index:31;pointer-events:none;';marker.innerHTML='<span data-axis="x"></span><span data-axis="y"></span><span data-value="x"></span><span data-value="y"></span>';document.body.append(marker);for(const n of marker.querySelectorAll('[data-axis]'))n.style.cssText='position:absolute;background:#dc2626;pointer-events:none;';for(const n of marker.querySelectorAll('[data-value]'))n.style.cssText='position:absolute;z-index:1;padding:0 3px;border:1px solid rgba(252,165,165,.82);border-radius:2px;background:rgba(255,255,255,.58);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);color:#dc2626;font:600 15px/21px Segoe UI,sans-serif;white-space:nowrap;pointer-events:none;';}
  const rect=frame.getBoundingClientRect(),top=Number(ruler.dataset.pointerTop)||0,pad=window.RulerLabels.THICKNESS,leftPad=Number(ruler.dataset.pointerLeft)||pad;
  const x=rulerPointer?rulerPointer.x-rect.left-frame.clientLeft:-1,y=rulerPointer?rulerPointer.y-rect.top-frame.clientTop:-1;
  marker.hidden=!rulerPointer||ruler.style.display==='none'||x<leftPad||x>frame.clientWidth||y<top+pad||y>frame.clientHeight;
  if(marker.hidden)return;
  const mx=marker.querySelector('[data-axis=x]'),my=marker.querySelector('[data-axis=y]'),xValue=marker.querySelector('[data-value=x]'),yValue=marker.querySelector('[data-value=y]');
  const showCoordinates=!document.body.classList.contains('ruler-coordinates-hidden');xValue.hidden=yValue.hidden=!showCoordinates;
  const paper=svg.getBoundingClientRect(),view=svg.viewBox.baseVal,unit=measureUnit(),decimals=2;
  const xCoordinate=Number(mmToUnit((rulerPointer.x-paper.left)/(paper.width/view.width),unit,measureDpi())),yCoordinate=Number(mmToUnit((rulerPointer.y-paper.top)/(paper.height/view.height),unit,measureDpi()));
  const format=value=>`${window.RulerLabels.formatCoordinate(value,decimals)} ${unitSuffix(unit)}`;
  const markerX=window.RulerLabels.coordinatePosition(rulerPointer.x,paper.left,xCoordinate,decimals),markerY=window.RulerLabels.coordinatePosition(rulerPointer.y,paper.top,yCoordinate,decimals);
  mx.style.left=(markerX-.5)+'px';mx.style.top=(rect.top+frame.clientTop+top)+'px';mx.style.width='1px';mx.style.height=pad+'px';
  my.style.left=(rect.left+frame.clientLeft+leftPad-pad)+'px';my.style.top=(markerY-.5)+'px';my.style.width=pad+'px';my.style.height='1px';
  xValue.textContent=format(xCoordinate);yValue.textContent=format(yCoordinate);
  xValue.style.left=markerX+'px';xValue.style.top=(rect.top+frame.clientTop+top+pad+1)+'px';xValue.style.transform='translateX(-50%)';
  yValue.style.left=(rect.left+frame.clientLeft+leftPad+3)+'px';yValue.style.top=markerY+'px';yValue.style.transform='translateY(-50%)';
}
document.addEventListener('pointermove',event=>{
  const frame=el('previewFrame');rulerPointer=frame&&(frame.contains(event.target)||event.target.id==='canvasTextEditor')?{x:event.clientX,y:event.clientY}:null;
  if(rulerPointerFrame===null)rulerPointerFrame=requestAnimationFrame(()=>{rulerPointerFrame=null;updateRulerPointerMarkers();});
},{passive:true});

let previewZoom = 1;
let previewZoomTarget=1,previewZoomAnimation=null,previewZoomAnchor=null,previewZoomTime=null;
let previewPan = { x: 0, y: 0 };
const previewMiddlePan=window.PreviewNavigation.createMiddlePanState();
let previewWheelBound = false;
function syncPreviewZoomControl(){
  const slider=el('previewZoomSlider'),value=el('previewZoomValue');
  if(slider)slider.value=String(Math.round(previewZoom*100));
  if(value)value.textContent=Math.round(previewZoom*100)+'%';
}
function setPreviewZoom(value,anchorX,anchorY){
  stopPreviewPan();
  previewZoomTarget=Math.max(.1,Math.min(8,Number(value)||1));
  previewZoomAnchor={x:anchorX,y:anchorY};
  if(previewZoomAnimation!==null)return;
  previewZoomTime=null;
  const animate=time=>{
    const elapsed=previewZoomTime===null?16:Math.min(64,time-previewZoomTime);previewZoomTime=time;
    const remaining=Math.log(previewZoomTarget/previewZoom);
    const done=Math.abs(remaining)<.0002||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    previewZoom=done?previewZoomTarget:previewZoom*Math.exp(remaining*(1-Math.exp(-elapsed/45)));
    applyPreviewZoom(previewZoomAnchor.x,previewZoomAnchor.y);syncPreviewZoomControl();updatePreviewRuler();
    previewZoomAnimation=done?null:requestAnimationFrame(animate);
    if(done)drawEditorCanvas();
  };
  previewZoomAnimation=requestAnimationFrame(animate);
}
function stopPreviewZoom(){const wasAnimating=previewZoomAnimation!==null;if(wasAnimating)cancelAnimationFrame(previewZoomAnimation);previewZoomAnimation=null;previewZoomTarget=previewZoom;if(wasAnimating)requestAnimationFrame(()=>drawEditorCanvas());}
function previewFitZoom(frame, svg){
  if(!frame||!svg)return 1;
  const availableW=Math.max(1,frame.clientWidth-48),availableH=Math.max(1,frame.clientHeight-48);
  const aspect=(Number(svg.viewBox?.baseVal?.width)||1)/(Number(svg.viewBox?.baseVal?.height)||1);
  const baseWidth=Math.min(Math.max(1,frame.clientWidth-36),Math.max(1,frame.clientHeight-36)*aspect);
  const fitWidth=Math.min(availableW,availableH*aspect);
  // Fit Page returns to the same comfortable view shown in the workspace
  // reference. Smaller windows reduce the zoom only as much as needed to fit.
  return Math.max(.1,Math.min(.85,fitWidth/baseWidth));
}
function fitPreviewPage(){
  stopPreviewPan();
  stopPreviewZoom();
  const frame=el('previewFrame'),svg=frame?.querySelector('.canvaswrap > svg');
  previewZoom=previewZoomTarget=previewFitZoom(frame,svg);
  previewPan={x:0,y:0};
  if(frame){frame.scrollLeft=0;frame.scrollTop=0;}
  const wrap=frame?.querySelector('.canvaswrap');
  if(wrap&&svg){sizePreviewCanvas(frame,wrap,svg);wrap.style.transform='translate(0px, 0px)';}
  syncPreviewZoomControl();
  drawEditorCanvas();
  updatePreviewRuler();
}
el('previewFitPage')?.addEventListener('click',fitPreviewPage);
el('previewZoomOut')?.addEventListener('click',()=>setPreviewZoom(previewZoomTarget/1.2));
el('previewZoomIn')?.addEventListener('click',()=>setPreviewZoom(previewZoomTarget*1.2));
el('previewZoomSlider')?.addEventListener('input',event=>setPreviewZoom(Number(event.currentTarget.value)/100));
syncPreviewZoomControl();
function sizePreviewCanvas(frame, wrap, svg) {
  const availableW=Math.max(1,frame.clientWidth-36),availableH=Math.max(1,frame.clientHeight-36);
  const aspect=svg.viewBox.baseVal.width/svg.viewBox.baseVal.height;
  const width=Math.min(availableW,availableH*aspect)*previewZoom,height=width/aspect;
  const marginLeft=Math.max(0,(frame.clientWidth-width)/2),marginTop=Math.max(0,(frame.clientHeight-height)/2);
  wrap.style.width=width+'px';wrap.style.height=height+'px';wrap.style.flex='none';wrap.style.maxWidth='none';
  wrap.style.marginLeft=marginLeft+'px';wrap.style.marginTop=marginTop+'px';
  wrap.style.transformOrigin='0 0';
  wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;
  svg.style.width=width+'px';svg.style.height=height+'px';svg.style.maxWidth='none';svg.style.maxHeight='none';
  return {width,height,marginLeft,marginTop};
}
function clampPreviewPan(frame, size) {
  // The workspace can pan beyond the paper, including negative ruler coordinates.
  if (!Number.isFinite(previewPan.x)) previewPan.x=0;
  if (!Number.isFinite(previewPan.y)) previewPan.y=0;
}
let previewPanAnimation=null,previewPanTarget=null;
function stopPreviewPan(){
  if(previewPanAnimation!==null)cancelAnimationFrame(previewPanAnimation);
  previewPanAnimation=null;previewPanTarget=null;
}
function previewPixelsPerMm(frame,axis){
  const svg=frame.querySelector('.canvaswrap > svg'),rect=svg?.getBoundingClientRect(),vb=svg?.viewBox.baseVal;
  return axis==='horizontal'?(rect?.width/ vb?.width||1):(rect?.height/vb?.height||1);
}
function smoothPreviewPan(frame,x,y){
  previewPanTarget={x,y};if(previewPanAnimation!==null)return;
  const wrap=frame.querySelector('.canvaswrap');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last=null;
  const animate=time=>{
    const dt=last===null?16:Math.min(64,time-last);last=time;
    const fraction=reducedMotion?1:1-Math.exp(-dt/24);
    previewPan.x+=(previewPanTarget.x-previewPan.x)*fraction;previewPan.y+=(previewPanTarget.y-previewPan.y)*fraction;
    const done=Math.hypot(previewPanTarget.x-previewPan.x,previewPanTarget.y-previewPan.y)<.02;
    if(done)previewPan={...previewPanTarget};
    if(wrap)wrap.style.transform=`translate3d(${previewPan.x}px, ${previewPan.y}px, 0)`;
    updatePreviewRuler();
    if(done){previewPanAnimation=null;previewPanTarget=null;}else previewPanAnimation=requestAnimationFrame(animate);
  };
  previewPanAnimation=requestAnimationFrame(animate);
}
function ensurePreviewScrollbars(frame) {
  if(!frame.dataset.scrollbarLayoutBound){
    frame.dataset.scrollbarLayoutBound='true';
    const sidebar=document.getElementById('insertSidebar');
    const refresh=()=>updatePreviewRuler();
    const observer=new ResizeObserver(refresh);observer.observe(frame);if(sidebar)observer.observe(sidebar);
    if(sidebar){
      new MutationObserver(refresh).observe(sidebar,{attributes:true,attributeFilter:['class','style','hidden']});
      let transitionFrame=null;
      const followTransition=()=>{refresh();transitionFrame=requestAnimationFrame(followTransition);};
      sidebar.addEventListener('transitionrun',()=>{if(transitionFrame===null)followTransition();});
      const finishTransition=()=>{if(transitionFrame!==null)cancelAnimationFrame(transitionFrame);transitionFrame=null;refresh();};
      sidebar.addEventListener('transitionend',finishTransition);sidebar.addEventListener('transitioncancel',finishTransition);
    }
  }
  if (frame.querySelector('.preview-scrollbar.horizontal')) return;
  frame.querySelectorAll('.preview-scrollbar,.preview-scrollbar-corner').forEach(node=>node.remove());
  frame.dataset.customScrollbars = 'true';
  for (const axis of ['horizontal','vertical']) {
    const track=document.createElement('div'),thumb=document.createElement('div');
    track.className='preview-scrollbar '+axis;track.setAttribute('role','scrollbar');track.setAttribute('aria-label',axis==='horizontal'?'Horizontal preview scroll':'Vertical preview scroll');track.setAttribute('aria-orientation',axis);track.tabIndex=0;
    thumb.className='preview-scrollbar-thumb';track.append(thumb);frame.append(track);
    const read=()=>axis==='horizontal'?previewPan.x:previewPan.y;
    const write=value=>{const target=previewPanTarget||previewPan;smoothPreviewPan(frame,axis==='horizontal'?value:target.x,axis==='vertical'?value:target.y);};
    const sync=()=>{
      if(axis==='horizontal'){
        const sidebar=document.getElementById('insertSidebar'),rect=sidebar?.getBoundingClientRect(),viewport=frame.getBoundingClientRect(),style=sidebar?getComputedStyle(sidebar):null;
        const visible=rect&&rect.width>0&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&rect.bottom>viewport.top&&rect.top<viewport.bottom;
        const ruler=document.getElementById('previewLeftRuler'),rulerRect=ruler?.getBoundingClientRect(),rulerVisible=rulerRect&&getComputedStyle(ruler).display!=='none';
        const contentLeft=Math.max(visible?rect.right-viewport.left:0,rulerVisible?rulerRect.right-viewport.left:0);
        const inset=Math.max(0,Math.min(frame.clientWidth-17,contentLeft+2));
        track.style.left=inset+'px';
      }
      const extent=Math.max(1,axis==='horizontal'?frame.clientWidth:frame.clientHeight),trackExtent=axis==='horizontal'?track.clientWidth:track.clientHeight;
      const thumbExtent=Math.min(trackExtent,Math.max(24,trackExtent/2)),travel=Math.max(0,trackExtent-thumbExtent),value=Math.max(-extent,Math.min(extent,read()));
      track.style.overflow='hidden';
      thumb.style[axis==='horizontal'?'left':'top']='0px';
      thumb.style[axis==='horizontal'?'width':'height']=thumbExtent+'px';
      thumb.style.transform=axis==='horizontal'?'translateX('+((value/extent+1)/2*travel)+'px)':'translateY('+((value/extent+1)/2*travel)+'px)';
    };
    track._syncPreviewScrollbar=sync;
    track.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();const isThumb=event.target===thumb,bounds=track.getBoundingClientRect(),start=axis==='horizontal'?event.clientX:event.clientY,startValue=read(),trackStart=axis==='horizontal'?bounds.left:bounds.top,trackExtent=axis==='horizontal'?track.clientWidth:track.clientHeight,thumbExtent=axis==='horizontal'?thumb.offsetWidth:thumb.offsetHeight,travel=Math.max(1,trackExtent-thumbExtent),extent=axis==='horizontal'?frame.clientWidth:frame.clientHeight,point=start-trackStart;if(!isThumb){const fraction=Math.max(0,Math.min(1,(point-thumbExtent/2)/travel));write((fraction*2-1)*extent);return;}const move=e=>{const current=axis==='horizontal'?e.clientX:e.clientY;write(Math.max(-extent,Math.min(extent,startValue+(current-start)*2*extent/travel)));};const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});window.addEventListener('pointercancel',end,{once:true});});
    track.addEventListener('keydown',event=>{const extent=axis==='horizontal'?frame.clientWidth:frame.clientHeight,step=previewPixelsPerMm(frame,axis)*(event.shiftKey?.1:1);if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key)){event.preventDefault();let value=previewPanTarget?(axis==='horizontal'?previewPanTarget.x:previewPanTarget.y):read();if(event.key==='Home')value=-extent;else if(event.key==='End')value=extent;else value+=(event.key==='ArrowLeft'||event.key==='ArrowUp'||event.key==='PageUp'?-1:1)*(event.key.startsWith('Page')?extent*.8:step);write(Math.max(-extent,Math.min(extent,value)));}});
  }
  const corner=document.createElement('div');corner.className='preview-scrollbar-corner';frame.append(corner);
}
function applyPreviewZoom(anchorX,anchorY) {
  const frame=el('previewFrame'),wrap=frame?.querySelector('.canvaswrap'),svg=wrap?.querySelector('svg');if(!frame||!wrap||!svg||!editing)return;
  const pointX=anchorX==null?frame.clientWidth/2:anchorX,pointY=anchorY==null?frame.clientHeight/2:anchorY;
  const oldMarginLeft=parseFloat(wrap.style.marginLeft)||0,oldMarginTop=parseFloat(wrap.style.marginTop)||0;
  const paperRect=svg.getBoundingClientRect(),frameRect=frame.getBoundingClientRect();
  const ratioX=(frameRect.left+pointX-paperRect.left)/Math.max(1,paperRect.width);
  const ratioY=(frameRect.top+pointY-paperRect.top)/Math.max(1,paperRect.height);
  const next=sizePreviewCanvas(frame,wrap,svg);
  previewPan.x=pointX+frame.scrollLeft-next.marginLeft-ratioX*next.width;
  previewPan.y=pointY+frame.scrollTop-next.marginTop-ratioY*next.height;
  clampPreviewPan(frame,next);
  wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;
}
function bindPreviewNavigation(){
  const frame=el('previewFrame');if(!frame||frame.dataset.navigationBound)return;frame.dataset.navigationBound='true';
  frame.addEventListener('pointerdown',event=>{
    if(event.button!==0||!editing||!(editorSelection.size||Number.isInteger(editorSel)&&editorSel>=0))return;
    if(event.target.closest?.('.preview-scrollbar,.preview-scrollbar-corner'))return;
    const page=frame.querySelector('.canvaswrap > svg');
    if(page&&(event.target===page||page.contains(event.target)))return;
    cancelTextClick();
    selectElement(-1);
  });
  if(!document.body.dataset.rulerNavbarObserver){document.body.dataset.rulerNavbarObserver='true';new MutationObserver(()=>requestAnimationFrame(updatePreviewRuler)).observe(document.body,{attributes:true,attributeFilter:['class']});}
  document.querySelector('.edbar')?.addEventListener('transitionend',updatePreviewRuler);
  frame.addEventListener('pointerdown',()=>{stopPreviewZoom();stopPreviewPan();},{capture:true});
  frame.addEventListener('pointerdown',event=>{
    if(event.button!==1)return;
    previewMiddlePan.begin(event);
    event.preventDefault();try{frame.setPointerCapture(event.pointerId);}catch{}
    const start={x:event.clientX,y:event.clientY,panX:previewPan.x,panY:previewPan.y};
    frame.style.cursor='grabbing';
    const move=e=>{previewPan.x=start.panX+e.clientX-start.x;previewPan.y=start.panY+e.clientY-start.y;const wrap=frame.querySelector('.canvaswrap');if(wrap)wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;updatePreviewRuler();};
    const end=event=>{previewMiddlePan.end(event);frame.removeEventListener('pointermove',move);frame.removeEventListener('pointerup',end);frame.removeEventListener('pointercancel',end);window.removeEventListener('blur',end);frame.style.cursor='';};
    frame.addEventListener('pointermove',move);frame.addEventListener('pointerup',end);frame.addEventListener('pointercancel',end);
    window.addEventListener('blur',end,{once:true});
  });
  frame.addEventListener('wheel',event=>{
    if(!frame.querySelector('.canvaswrap'))return;
    if(PreviewNavigation.wheelAction(event,previewMiddlePan.active())==='ignore'){event.preventDefault();return;}
    const scale=event.deltaMode===1?16:event.deltaMode===2?frame.clientHeight:1;
    const dx=event.deltaX*scale,dy=event.deltaY*scale;
    let panX=dx,panY=dy;
    if(event.ctrlKey){
      event.preventDefault();
      stopPreviewPan();
      const rect=frame.getBoundingClientRect();
      setPreviewZoom(previewZoomTarget*Math.exp(-(dy||dx)*.0015),event.clientX-rect.left,event.clientY-rect.top);
      return;
    }
    else if(event.shiftKey){panX=dx||dy;panY=0;}
    // Match a document workspace: the wheel moves the page in the opposite
    // direction, while the page follows a middle-button drag.
    event.preventDefault();
    stopPreviewZoom();
    const target=previewPanTarget||previewPan;
    // Coarse mouse wheels move 2 mm per line / 6 mm per standard notch.
    // Pixel-mode trackpads retain their fractional movement.
    if(event.deltaMode===1||event.deltaMode===0&&Math.abs(dy)>=80&&!dx){
      const unit=event.deltaMode===1?2/16:6/100;
      panX*=unit*previewPixelsPerMm(frame,'horizontal');panY*=unit*previewPixelsPerMm(frame,'vertical');
    }else if(event.deltaMode===0){panX*=1.5;panY*=1.5;}
    smoothPreviewPan(frame,target.x-panX,target.y-panY);
  },{passive:false});
  frame.addEventListener('scroll',updatePreviewRuler,{passive:true});
  window.addEventListener('resize',()=>{const wrap=frame.querySelector('.canvaswrap'),svg=wrap?.querySelector('svg');if(wrap&&svg){const size=sizePreviewCanvas(frame,wrap,svg);clampPreviewPan(frame,size);wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;updatePreviewRuler();}});
}

let previewRulerFrame=null;
function updatePreviewRuler(){if(previewRulerFrame!==null)return;previewRulerFrame=requestAnimationFrame(()=>{previewRulerFrame=null;drawPreviewRuler();});}
function syncVisibleNavbarHeight(){const nav=document.querySelector('.edbar');if(!nav)return;const height=Math.max(0,Math.ceil(nav.getBoundingClientRect().height));document.documentElement.style.setProperty('--visible-navbar-height',height+'px');}
const navbarHeightObserver=new ResizeObserver(syncVisibleNavbarHeight),navbarElement=document.querySelector('.edbar');if(navbarElement)navbarHeightObserver.observe(navbarElement);syncVisibleNavbarHeight();window.addEventListener('resize',syncVisibleNavbarHeight);
function drawPreviewRuler() {
  const frame=el('previewFrame'), svg=frame?.querySelector('.canvaswrap > svg');
  if(!frame||!svg)return;
  ensurePreviewScrollbars(frame);
  const nav=document.querySelector('.edbar');
  const navStyle=nav?getComputedStyle(nav):null,navRect=nav?.getBoundingClientRect();
  const navVisible=!!navRect&&navStyle?.visibility!=='hidden'&&Number(navStyle?.opacity||0)>0;
  const paperRect=svg.getBoundingClientRect(),viewportRect=frame.getBoundingClientRect();
  const pageFits=frame.dataset.hasOffPageObjects!=='true'&&paperRect.left>=viewportRect.left-1&&paperRect.top>=viewportRect.top-1&&paperRect.right<=viewportRect.left+frame.clientWidth-16&&paperRect.bottom<=viewportRect.top+frame.clientHeight-16;
  frame.classList.toggle('preview-page-fits',pageFits);
  frame.querySelectorAll('.preview-scrollbar').forEach(track=>{track.hidden=false;track._syncPreviewScrollbar?.();});
  const rulerFixed=document.body.classList.contains('ruler-fixed');
  let ruler=frame.querySelector('#previewRuler');
  if(!ruler){ruler=document.createElement('canvas');ruler.id='previewRuler';ruler.setAttribute('aria-hidden','true');ruler.style.cssText='position:absolute;z-index:8;pointer-events:none;max-width:none;max-height:none;display:'+(rulerFixed||frame.matches(':hover')?'block':'none')+';';frame.append(ruler);
    if(!frame.dataset.rulerEvents){frame.dataset.rulerEvents='true';frame.addEventListener('pointerenter',()=>{const active=frame.querySelector('#previewRuler');if(active){active.style.display='block';const y=document.getElementById('previewLeftRuler');if(y)y.style.display='block';updatePreviewRuler();}});frame.addEventListener('pointerleave',()=>{const active=frame.querySelector('#previewRuler');if(active&&!document.body.classList.contains('ruler-fixed')){active.style.display='none';const y=document.getElementById('previewLeftRuler');if(y)y.style.display='none';}});}
    if(!previewRulerObserver){previewRulerObserver=new ResizeObserver(()=>{const wrap=frame.querySelector('.canvaswrap'),paper=wrap?.querySelector('svg');if(wrap&&paper)sizePreviewCanvas(frame,wrap,paper);updatePreviewRuler();});previewRulerObserver.observe(frame);}
  }
  if(rulerFixed)ruler.style.display='block';
  else if(!frame.matches(':hover'))ruler.style.display='none';
  const leftRuler=document.getElementById('previewLeftRuler');if(leftRuler)leftRuler.style.display=ruler.style.display;
  if(ruler.style.display==='none'){updateRulerPointerMarkers();return;}
  const sr=svg.getBoundingClientRect(),fr=frame.getBoundingClientRect();if(!sr.width||!sr.height)return;
  const unit=measureUnit(),factor=unit==='in'?25.4:unit==='cm'?10:unit==='mil'?0.0254:unit==='dots'?25.4/(editing?.dpi||203):1;
  const unitName=unit==='dots'?'dot':unit;
  const mmW=svg.viewBox.baseVal.width,mmH=svg.viewBox.baseVal.height;
  // Keep the strip and its labels at the same 150% presentation scale.
  const dpr=window.devicePixelRatio||1,pad=window.RulerLabels.THICKNESS,w=frame.clientWidth,h=frame.clientHeight;
  const frameRect=frame.getBoundingClientRect();
  const sidebarRect=el('insertSidebar')?.getBoundingClientRect();
  const rulerInset=sidebarRect?Math.max(0,Math.min(w,sidebarRect.right-frameRect.left)):0;
  const navCoversFrame=!!navRect&&navVisible&&navRect.bottom>frameRect.top;
  const rulerTop=navCoversFrame?Math.max(0,Math.min(h,navRect.bottom-frameRect.top)):0;
  ruler.dataset.pointerTop=String(rulerTop);ruler.dataset.pointerLeft=String(rulerInset+pad);
  const horizontalPad=rulerTop+pad,leftPad=pad,verticalPad=horizontalPad;
  // These coordinates are already relative to the visible viewport; adding
  // scroll offsets again would separate the ruler zero from the paper edge.
  const ox=sr.left-fr.left-frame.clientLeft,oy=window.RulerLabels.verticalOrigin(sr.top,fr.top,frame.clientTop),verticalSpan=window.RulerLabels.visibleSpan(0,h,h,rulerTop);
  ruler.style.left='0';ruler.style.top='0';ruler.style.width=w+'px';ruler.style.height=h+'px';ruler.style.clipPath=`inset(${rulerTop}px 0 ${Math.max(0,h-rulerTop-pad)}px ${rulerInset}px)`;ruler.style.backdropFilter='blur(14px)';ruler.style.webkitBackdropFilter='blur(14px)';
  ruler.style.transform=`translate(${frame.scrollLeft}px,${frame.scrollTop}px)`;
  ruler.width=Math.round(w*dpr);ruler.height=Math.round(h*dpr);
  const c=ruler.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  // The ruler strip is opaque only where it measures the paper. Outside that
  // span the canvas remains transparent and the workspace shows through.
  window.RulerLabels.paintPaperStrip(c,'horizontal',ox,sr.width,w,pad,rulerTop,pad);
  window.RulerLabels.paintPaperStrip(c,'vertical',oy,sr.height,h,leftPad,0,verticalPad);
  c.strokeStyle='#263445';c.fillStyle='#111827';c.lineWidth=0.8;c.font='600 15px Segoe UI, sans-serif';
  c.beginPath();c.moveTo(leftPad,horizontalPad);c.lineTo(w,horizontalPad);c.moveTo(leftPad,verticalPad);c.lineTo(leftPad,h);c.stroke();
  function axis(length,origin,paperLength,pxPerMm,vertical){
    let major=factor;const series=[1,2,5];let power=Math.pow(10,Math.floor(Math.log10(70/(pxPerMm*factor))));
    major=series.map(n=>n*power).find(n=>n*pxPerMm*factor>=55)||10*power;
    const step=major*factor/10;
    const axisStart=vertical?rulerTop:pad;
    const start=window.RulerLabels.tickStartIndex(origin,axisStart,length,pxPerMm*step),end=Math.floor((length-origin)/pxPerMm/step);
    const labels=[];let lastLabelPos=-Infinity;
    for(let i=start;i<=end;i++){
      const value=i*step/factor,isIntegerTick=Math.abs(value-Math.round(value))<1e-6;
      // Draw half as many minor divisions while keeping every whole-unit tick.
      if(i%2!==0&&!isIntegerTick)continue;
      const pos=origin+i*step*pxPerMm,full=i%10===0,len=full?9:i%5===0?6:3;
      const onPaper=pos>=origin-0.5&&pos<=origin+paperLength+0.5;
      c.strokeStyle=onPaper?'#111827':'#344256';c.lineWidth=onPaper?(full?1.1:0.8):0.65;
      c.beginPath();if(vertical){const mid=leftPad/2;c.moveTo(mid-len/2,pos);c.lineTo(mid+len/2,pos);}else{const mid=rulerTop+pad/2;c.moveTo(pos,mid-len/2);c.lineTo(pos,mid+len/2);}c.stroke();
      if(isIntegerTick&&(value===0||pos-lastLabelPos>=64)){labels.push({pos,label:String(Math.round(value)),onPaper,paperStart:origin,paperEnd:origin+paperLength});lastLabelPos=pos;}
    }
    if(vertical){for(const entry of labels){c.save();c.fillStyle='#111827';c.textAlign='center';c.textBaseline='middle';c.translate(leftPad/2,entry.pos);c.rotate(-Math.PI/2);c.fillText(entry.label,0,0);c.restore();}}
    else{c.font='600 15px Segoe UI,sans-serif';for(const entry of labels)window.RulerLabels.horizontal(c,entry,rulerTop,pad);}
  }
  axis(w,ox,sr.width,sr.width/mmW,false);axis(h,oy,sr.height,sr.height/mmH,true);
  c.fillStyle=window.RulerLabels.BACKGROUND;c.fillRect(0,rulerTop,leftPad,pad);c.font='600 10px Segoe UI,sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillStyle='#111827';c.fillText(unitName,1.5,rulerTop+pad/2);
  // Keep the Y ruler outside the scrolling/clipping preview frame. Its fixed
  // position follows the frame edge, so a visible sidebar and frame scrollbars
  // cannot cover it or clip its ticks.
  let yRuler=document.getElementById('previewLeftRuler');
  if(!yRuler){yRuler=document.createElement('canvas');yRuler.id='previewLeftRuler';yRuler.setAttribute('aria-hidden','true');yRuler.style.cssText='position:fixed;z-index:30;width:13px;pointer-events:none;max-width:none;max-height:none;';document.body.append(yRuler);}
  else if(yRuler.parentElement!==document.body)document.body.append(yRuler);
  const yTop=frameRect.top+frame.clientTop,yTopPadding=Math.max(0,rulerTop-frame.clientTop);
  const yRulerHeight=window.RulerLabels.visibleHeight(h,oy+sr.height,window.innerHeight,yTop);
  const yVisibleSpan=window.RulerLabels.visibleSpan(0,yRulerHeight,yRulerHeight,yTopPadding);
  yRuler.style.left=(frameRect.left+rulerInset+frame.clientLeft)+'px';yRuler.style.top=yTop+'px';yRuler.style.display=ruler.style.display;
  yRuler.style.backdropFilter='blur(14px)';yRuler.style.webkitBackdropFilter='blur(14px)';yRuler.style.clipPath=`inset(${yVisibleSpan.start}px 0 ${Math.max(0,yRulerHeight-yVisibleSpan.end)}px 0)`;yRuler.style.width=pad+'px';yRuler.style.height=yRulerHeight+'px';yRuler.width=Math.ceil(pad*dpr);yRuler.height=Math.ceil(yRulerHeight*dpr);
  const yc=yRuler.getContext('2d');yc.setTransform(dpr,0,0,dpr,0,0);yc.clearRect(0,0,pad,yRulerHeight);
  yc.fillStyle=window.RulerLabels.BACKGROUND;yc.fillRect(0,yTopPadding,pad,pad);
  window.RulerLabels.paintPaperStrip(yc,'vertical',oy,sr.height,yRulerHeight,pad,0,yTopPadding);
  const yScale=sr.height/mmH,yFactor=factor,ySeries=[1,2,5];
  const yPower=Math.pow(10,Math.floor(Math.log10(70/(yScale*yFactor))));
  const yMajor=ySeries.map(n=>n*yPower).find(n=>n*yScale*yFactor>=55)||10*yPower,yStep=yMajor*yFactor/10;
  const yStart=window.RulerLabels.tickStartIndex(oy,yTopPadding,yRulerHeight,yScale*yStep),yEnd=Math.floor((yRulerHeight-oy)/yScale/yStep);
  const yLabels=[];let lastYLabelPos=-Infinity;
  for(let i=yStart;i<=yEnd;i++){
    const value=i*yStep/yFactor,isIntegerTick=Math.abs(value-Math.round(value))<1e-6;
    if(i%2!==0&&!isIntegerTick)continue;
    const pos=oy+i*yStep*yScale,full=i%10===0,len=full?9:i%5===0?6:3,onPaper=pos>=oy-.5&&pos<=oy+sr.height+.5;
    yc.strokeStyle=onPaper?'#111827':'#344256';yc.lineWidth=onPaper?(full?1.1:.8):.65;
    const mid=pad/2;yc.beginPath();yc.moveTo(mid-len/2,pos);yc.lineTo(mid+len/2,pos);yc.stroke();
    if(isIntegerTick&&(value===0||pos-lastYLabelPos>=64)){yLabels.push({pos,label:String(Math.round(value)),onPaper,paperStart:oy,paperEnd:oy+sr.height});lastYLabelPos=pos;}
  }
  // Clear the complete rotated-label band so no minor tick or ruler spine
  // shows through any digit. Keep each label centered on its major tick.
  yc.font='600 15px Segoe UI,sans-serif';
  for(const entry of yLabels)window.RulerLabels.vertical(yc,entry,pad);

  updateRulerPointerMarkers();

}

function svgTextAlphabeticBaseline(text) {
  const original=text.getBBox(),probe=text.cloneNode(true);
  probe.removeAttribute('id');probe.style.visibility='hidden';
  probe.style.setProperty('dominant-baseline','alphabetic','important');
  probe.style.setProperty('alignment-baseline','baseline','important');
  text.parentNode.append(probe);
  try{
    const alphabetic=probe.getBBox(),start=text.getStartPositionOfChar(0);
    return {x:start.x,y:(parseFloat(text.getAttribute('y'))||0)+original.y-alphabetic.y};
  }finally{probe.remove();}
}

let textInkMeasureContext=null;
function textInkBounds(svg, index, measuredText = null) {
  const host=svg.querySelector(`g[data-label-element="${index}"]`),texts=[...host?.querySelectorAll('text')||[]];
  if(!texts.length)return null;
  const rotationTransform=host.querySelector('g[transform*="rotate("]')?.getAttribute('transform')||'';
  const rotationMatch=/rotate\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+))?\s*\)/.exec(rotationTransform);
  const translationMatch=/translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(rotationTransform);
  const spin=rotationMatch?[rotationMatch[0],rotationMatch[1],rotationMatch[2]??translationMatch?.[1]??0,rotationMatch[3]??translationMatch?.[2]??0]:null;
  const points=[];let rootMatrix;
  try{
    rootMatrix=svg.getScreenCTM();if(!rootMatrix)return null;
    for(const text of texts){
      const bbox=text.getBBox();
      const screen=text.getScreenCTM();if(!screen)continue;
      const matrix=rootMatrix.inverse().multiply(screen);
      let ink=bbox;
      {
        const style=getComputedStyle(text);if(!textInkMeasureContext)textInkMeasureContext=document.createElement('canvas').getContext('2d');const ctx=textInkMeasureContext;
        if(ctx){
          // SVG geometry uses the label's mm-based user units, while Canvas
          // font sizes and TextMetrics use CSS pixels (96 px per inch).
          // Convert both ways so the ink bounds do not gain side padding.
          const pxPerSvgUnit=96/25.4;
          const fontSize=(Number(text.getAttribute('font-size'))||parseFloat(style.fontSize)/pxPerSvgUnit||9)*pxPerSvgUnit;
          ctx.font=`${style.fontStyle||'normal'} ${style.fontWeight||'400'} ${fontSize}px ${style.fontFamily||'Arial,sans-serif'}`;
          const value=(measuredText!==null&&texts.length===1)?measuredText:text.textContent;
          const liveTextDiffers=measuredText!==null&&texts.length===1&&String(value)!==String(text.textContent);
          const baseline=text.getAttribute('dominant-baseline')||style.dominantBaseline||'alphabetic';
          ctx.textBaseline=({'text-before-edge':'top','text-after-edge':'bottom','central':'middle','mathematical':'alphabetic'})[baseline]||baseline;
          const anchor=text.getAttribute('text-anchor')||'start';ctx.textAlign=anchor==='middle'?'center':anchor==='end'?'right':'left';
          const metrics=ctx.measureText(value||' '),ascent=metrics.actualBoundingBoxAscent,descent=metrics.actualBoundingBoxDescent;
          const x=Number(text.getAttribute('x'))||0,y=Number(text.getAttribute('y'))||0;
          const left=metrics.actualBoundingBoxLeft,right=metrics.actualBoundingBoxRight;
          if(Number.isFinite(ascent)&&Number.isFinite(descent)&&Number.isFinite(left)&&Number.isFinite(right)&&ascent+descent>0&&left+right>0){
            const metricLeft=x-left/pxPerSvgUnit,metricRight=x+right/pxPerSvgUnit;
            // While editing, the hidden SVG still contains the previous text.
            // Do not cap the live bounds to that stale glyph box.
            const inkLeft=liveTextDiffers?metricLeft:Math.max(bbox.x,metricLeft);
            const inkRight=liveTextDiffers?x+right/pxPerSvgUnit:Math.min(bbox.x+bbox.width,metricRight);
            ink={x:inkRight>inkLeft?inkLeft:metricLeft,y:y-ascent/pxPerSvgUnit,width:inkRight>inkLeft?inkRight-inkLeft:(left+right)/pxPerSvgUnit,height:(ascent+descent)/pxPerSvgUnit};
          }
        }
      }
      for(const [x,y] of [[ink.x,ink.y],[ink.x+ink.width,ink.y],[ink.x,ink.y+ink.height],[ink.x+ink.width,ink.y+ink.height]]){const point=svg.createSVGPoint();point.x=x;point.y=y;points.push(point.matrixTransform(matrix));}
    }
  }catch{return null;}
  if(!points.length)return null;
  if(spin){
    const angle=Number(spin[1])*Math.PI/180,cx=Number(spin[2]),cy=Number(spin[3]),cos=Math.cos(angle),sin=Math.sin(angle);
    for(const point of points){const dx=point.x-cx,dy=point.y-cy;point.x=cx+dx*cos+dy*sin;point.y=cy-dx*sin+dy*cos;}
  }
  const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),right=Math.max(...points.map(p=>p.x)),bottom=Math.max(...points.map(p=>p.y));
  // Leave only half a screen pixel for the centered 1px outline stroke so its
  // visible edge meets the rendered glyph without a perceptible gap.
  const pad=.5/Math.max(.001,Math.hypot(rootMatrix.a,rootMatrix.b));
  return{x:left-pad,y:top-pad,w:Math.max(.1,right-left)+2*pad,h:Math.max(.1,bottom-top)+2*pad,rotationCenter:spin?{x:Number(spin[2]),y:Number(spin[3])}:null};
}

function fitBarcodeSelectionBounds(box, element, svg) {
  if(!['barcode128','code39','code93','ean13'].includes(element?.type)||element.show_text===false)return box;
  const ink=textInkBounds(svg,box.index);
  if(!ink)return box;
  const barBottom=box.y+Math.max(.1,Number(element.bar_height_mm)||10);
  const inkBottom=ink.y+ink.h;
  const bottom=Math.max(barBottom,inkBottom);
  svg.querySelectorAll(`[data-label-element="${box.index}"] [data-barcode-background], [data-label-element="${box.index}"] [data-text-background]`).forEach(rect=>{
    const y=Number(rect.getAttribute('y'))||0;
    rect.setAttribute('height',Math.max(0,Math.min(Number(rect.getAttribute('height'))||0,bottom-y)));
  });
  return {...box,h:Math.max(.1,Math.max(barBottom,inkBottom)-box.y),rotationCenter:ink.rotationCenter};
}

function fitTextSelectionBounds(box, element, svg) {
  if(element?.type!=='text')return box;
  const ink=textInkBounds(svg,box.index,liveElementText(element)||' ');
  if(!ink)return box;
  return {...box,...ink,h:Math.max(.1,ink.h),rotationCenter:ink.rotationCenter||box.rotationCenter||{x:box.x+box.w/2,y:box.y+box.h/2}};
}

function databaseFieldsUsedBy(element, template=editing){
  const fields=template?.database_connection?.fields||{},sources=template?.data_sources||{},found=new Set(),seen=new Set();
  const scan=value=>{for(const match of String(value??'').matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g))visit(match[1]);};
  const visit=name=>{if(seen.has(name))return;seen.add(name);const source=sources[name];if(Object.hasOwn(fields,name)&&(!source||source.type==='table'&&source.row==='auto')){found.add(name);return;}if(source?.type==='object'||/^object\.\d+$/.test(name)){const index=source?.index??Number(name.split('.')[1]);scan(template?.elements?.[index]?.text);return;}if(source?.type==='table'&&source.row==='auto'&&source.category==='Database Fields')found.add(name);};
  scan(element?.text);return [...found];
}

let activeObjectGesture = false,deferredGestureDraw=false,pendingGestureRevision=null;
function flushPendingGestureRevision(){
  if(!pendingGestureRevision)return;
  const snapshot=pendingGestureRevision;pendingGestureRevision=null;
  // After pointerup the scene may rebuild; keep revision work off that frame too.
  setTimeout(()=>recordEditRevision(snapshot,'Before edit',{reuseState:true}),0);
}
function drawEditorCanvas() {
  if(window.pageSetupCanvasSnapshot){document.dispatchEvent(new Event('preview-updated'));return;}
  if (activeObjectGesture) {deferredGestureDraw=true;return;}
  deferredGestureDraw=false;
  // Commit and remove the screen editor before replacing its SVG anchor.
  document.getElementById('canvasTextEditor')?.blur();
  if (!editing) return;
  const data = sampleData(editing);
  for(const element of editing.elements||[])if(element.shape_preset&&window.ShapeTools)window.ShapeTools.bake(element,editing.dpi||203);
  for(const element of editing.elements||[]){if(!element.table_model||!window.TableTools)continue;const bw=Number(element.bitmap_width),bh=Number(element.bitmap_height),hex=String(element.bitmap_hex||''),expected=Number.isInteger(bw)&&bw>0&&Number.isInteger(bh)&&bh>0?Math.ceil(bw/8)*bh*2:0,valid=expected>0&&hex.length===expected&&!/[^0-9a-f]/i.test(hex);if(!valid||element.table_baked_size!==element.width_mm+','+element.height_mm)window.TableTools.bake(element,data);}
  const W = Number(editing.width_mm) || 50, H = Number(editing.height_mm) || 25;
  databasePreviewRecord=Number(window.databasePreviewRecord)||0;
  window.DatabaseRecordNavigator?.sync(editing);
  const allIdx = (editing.elements || []).map((_, i) => i);
  ensureQR(qrValuesOf(editing, data), drawEditorCanvas, dmValuesOf(editing, data));
  const frame = el('previewFrame');
  frame.tabIndex=0;
  // Keep empty text objects visible in the editor. The print renderer correctly
  // omits empty values, but hiding them here makes a selected/unselected text
  // object appear to disappear from the canvas.
  const editorPreview = {
    ...editing,
    elements: (editing.elements || []).map(element => (
      element.type === 'text' && !liveElementText(element).trim()
        ? { ...element, text: 'Text' }
        : element
    )),
  };
  // Table layout can grow to fit wrapped cell text during SVG rendering.
  // Resolve that layout first so hover and selection bounds use the exact same
  // dimensions as the table drawn underneath them.
  for (const element of editing.elements || []) {
    if (element?.table_model && window.TableTools?.ensureContentFits?.(element)) {
      window.TableTools.bake?.(element, data);
    }
  }
  const boxes = window.LabelPreview.computeBoxes(editorPreview, data);
  const imageInkBounds=new Map();
  for(const box of boxes){
    const element=editing.elements[box.index];
    // Imported SVGs are rasterized onto a white bitmap for printing. Their
    // viewBox often contains generous whitespace, so use the actual dark-pixel
    // bounds for their editor selection frame just like transparent artwork.
    if(element?.type!=='image'||(element.transparent_background!==true&&!element.table_model&&element.source_format!=='svg')||!Number(element.bitmap_width)||!Number(element.bitmap_height))continue;
    const stride=Math.ceil(element.bitmap_width/8),hex=String(element.bitmap_hex||'');
    let minX=element.bitmap_width,minY=element.bitmap_height,maxX=-1,maxY=-1;
    for(let y=0;y<element.bitmap_height;y++)for(let x=0;x<element.bitmap_width;x++){
      const byte=parseInt(hex.slice((y*stride+(x>>3))*2,(y*stride+(x>>3))*2+2),16)||0;
      if(byte&(128>>(x&7))){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    }
    if(maxX>=minX&&maxY>=minY)imageInkBounds.set(box.index,{x:box.x+box.w*minX/element.bitmap_width,y:box.y+box.h*minY/element.bitmap_height,w:box.w*(maxX-minX+1)/element.bitmap_width,h:box.h*(maxY-minY+1)/element.bitmap_height});
  }
  const showPageGap=editorGapVisible&&!!window.PageGap?.hasGap(editing.page);
  const svg = window.LabelPreview.renderPreviewSVG(editorPreview, data, allIdx, qrCache, {
    paperPage:showPageGap,
    designSheet:true,
    editorPlaceholders:true,
    before:window.PageGap?.render({show:showPageGap,page:editing.page,templateWidth:W,templateHeight:H})||'',
    after: gridSVG(W, H),
  });
  // Preserve the paper container across object edits. Recreating it on every
  // drag frame restarted its size transition from the default full-frame size.
  let paperWrap=frame.querySelector('.canvaswrap');
  if(!paperWrap){frame.replaceChildren();paperWrap=document.createElement('div');paperWrap.className='canvaswrap';frame.append(paperWrap);}
  paperWrap.innerHTML=svg;
  const corner=Math.max(0,Number(editing.corner_radius_mm??2));
  paperWrap.style.borderRadius=editing.label_shape==='rounded'?(100*corner/W)+'% / '+(100*corner/H)+'%':editing.label_shape==='ellipse'?'50%':'0';
  // Keep the paper container and artwork overflow visible so objects can sit
  // outside the paper while remaining editable, as in a label design canvas.
  paperWrap.style.overflow='visible';
  const placed = paperWrap.querySelector('svg');
  if(placed){
    placed.style.overflow='visible';
    // Clip only the paper's white fill to its shape. Label objects and editor
    // handles must remain visible when they extend beyond the paper.
    placed.style.background='transparent';
    const vb=placed.viewBox.baseVal,ns='http://www.w3.org/2000/svg';
    const artwork=document.createElementNS(ns,'g');
    while(placed.firstChild)artwork.appendChild(placed.firstChild);
    const defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath');
    clip.id='editor-paper-background-clip';clip.setAttribute('clipPathUnits','userSpaceOnUse');
    const shape=document.createElementNS(ns,editing.label_shape==='ellipse'?'ellipse':'rect');
    if(editing.label_shape==='ellipse'){
      shape.setAttribute('cx',vb.x+vb.width/2);shape.setAttribute('cy',vb.y+vb.height/2);
      shape.setAttribute('rx',vb.width/2);shape.setAttribute('ry',vb.height/2);
    }else{
      shape.setAttribute('x',vb.x);shape.setAttribute('y',vb.y);shape.setAttribute('width',vb.width);shape.setAttribute('height',vb.height);
      if(editing.label_shape==='rounded'){shape.setAttribute('rx',corner);shape.setAttribute('ry',corner);}
    }
    clip.append(shape);defs.append(clip);
    const paperFill=[...artwork.children].find(node=>node.localName==='rect'&&node.getAttribute('fill')==='#fff');
    if(paperFill)paperFill.setAttribute('clip-path','url(#editor-paper-background-clip)');
    placed.append(defs,artwork);
    frame.dataset.hasOffPageObjects=String(boxes.some(box=>box.x<vb.x-.001||box.y<vb.y-.001||box.x+box.w>vb.x+vb.width+.001||box.y+box.h>vb.y+vb.height+.001));
  }
  if(placed)sizePreviewCanvas(frame,paperWrap,placed);
  if (placed) boxes.forEach(box => {
    const imageInk=imageInkBounds.get(box.index);
    if(imageInk){box.x=imageInk.x;box.y=imageInk.y;box.w=imageInk.w;box.h=imageInk.h;return;}
    const element=editing.elements[box.index];
    if(['barcode128','code39','code93','ean13'].includes(box.type)){
      Object.assign(box,fitBarcodeSelectionBounds(box,element,placed));
      return;
    }
    if (box.type !== 'text') return;
    Object.assign(box,fitTextSelectionBounds(box,element,placed));
  });

  const selectedBoxes=boxes.filter(b=>editorSelection.has(b.index)||b.index===editorSel);
  const multiSelection=selectedBoxes.length>1;
  let interaction = '';
  if(placed){
    const vb=placed.viewBox.baseVal,paperShape=showPageGap?{x:0,y:0,width:W,height:H}:{x:vb.x,y:vb.y,width:vb.width,height:vb.height},selectedForDrag=new Set([...editorSelection,editorSel]),getBounds=b=>window.ObjectDistanceGuides?.bounds({...b,rotation_deg:Number(editing.elements[b.index]?.rotation_deg)||0})||{left:b.x,top:b.y,right:b.x+b.w,bottom:b.y+b.h},highlightBoxes=boxes.filter(b=>selectedForDrag.has(b.index)||objectOverflowsPaperShape(getBounds(b),paperShape));
    if(highlightBoxes.length){
      const left=Math.min(vb.x,...highlightBoxes.map(b=>b.x)),top=Math.min(vb.y,...highlightBoxes.map(b=>b.y)),right=Math.max(vb.x+vb.width,...highlightBoxes.map(b=>b.x+b.w)),bottom=Math.max(vb.y+vb.height,...highlightBoxes.map(b=>b.y+b.h)),pad=Math.max(1,right-left,bottom-top)*4;
      const mx=left-pad,my=top-pad,mw=right-left+2*pad,mh=bottom-top+2*pad;
      let hole;
      if(editing.label_shape==='ellipse')hole=`M${vb.x+vb.width/2} ${vb.y}a${vb.width/2} ${vb.height/2} 0 1 0 ${vb.width} 0a${vb.width/2} ${vb.height/2} 0 1 0 ${-vb.width} 0Z`;
      else if(editing.label_shape==='rounded'){const r=Math.min(vb.width/2,vb.height/2,Math.max(0,Number(editing.corner_radius_mm??2)));hole=`M${vb.x+r} ${vb.y}H${vb.x+vb.width-r}Q${vb.x+vb.width} ${vb.y} ${vb.x+vb.width} ${vb.y+r}V${vb.y+vb.height-r}Q${vb.x+vb.width} ${vb.y+vb.height} ${vb.x+vb.width-r} ${vb.y+vb.height}H${vb.x+r}Q${vb.x} ${vb.y+vb.height} ${vb.x} ${vb.y+vb.height-r}V${vb.y+r}Q${vb.x} ${vb.y} ${vb.x+r} ${vb.y}Z`;}
      else hole=`M${vb.x} ${vb.y}h${vb.width}v${vb.height}h${-vb.width}Z`;
      interaction+=`<defs><mask id="editor-offpage-mask" maskUnits="userSpaceOnUse" x="${mx}" y="${my}" width="${mw}" height="${mh}"><rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="white"/><path d="${hole}" fill="black"/></mask></defs>`;
      for(const b of highlightBoxes){const element=editing.elements[b.index],angle=Number(element?.rotation_deg)||0,outside=objectOverflowsPaperShape(getBounds(b),paperShape);interaction+=`<g data-overflow-highlight="${b.index}"${outside?'':' display="none"'} pointer-events="none"><path data-overflow-highlight-shape="${b.index}" d="${window.SvgSelectionHandles.overflowHighlightPath(b,angle)}" fill="#ef4444" fill-opacity=".24" mask="url(#editor-offpage-mask)"/></g>`;}
    }
  }
  boxes.forEach((b) => {
    let hits = '', sel = '', handleHits = '';
    const w = b.type === 'text' ? Math.max(b.w, 0.3) : Math.max(b.w, 2), h = b.type === 'text' ? Math.max(b.h, 0.3) : Math.max(b.h, 2);
    const element = editing.elements[b.index];
    const angle=Number(element?.rotation_deg)||0;
    const pivot=b.rotationCenter||{x:b.x+w/2,y:b.y+h/2};
    const rotation=angle?` transform="rotate(${angle} ${pivot.x} ${pivot.y})"`:'';
    if (element?.type === 'line') {
      const [start,end]=lineWorldEndpoints(b,element),matrix=placed?.getScreenCTM(),scale=Math.hypot(matrix?.a||1,matrix?.b||0);
      const thickness=Math.max(Number(element.thickness_mm)||.3,10/scale);
      hits += `<line class="hit" data-hit="${b.index}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="transparent" stroke-width="${thickness}" pointer-events="stroke"/>`;
    } else {
      hits += `<rect class="hit" data-hit="${b.index}" x="${b.x}" y="${b.y}" width="${w}" height="${h}"${rotation}/>`;
    }
    if (editorSelection.has(b.index) || b.index === editorSel) {
      const selected = element;
      const visual = selectionVisualBounds(b, selected);
      const visualPivot=b.rotationCenter||{x:visual.x+visual.w/2,y:visual.y+visual.h/2};
      const visualRotation=angle&&element.type!=='line'?` transform="rotate(${angle} ${visualPivot.x} ${visualPivot.y})"`:'';
      if(element.type!=='line')sel += `<rect class="sel" x="${visual.x}" y="${visual.y}" width="${visual.w}" height="${visual.h}"${visualRotation}/>`;
      if(multiSelection)sel += selectionNameSVG(visual,selected);
      if(!multiSelection)handleHits += elementHandlesSVG(visual.x, visual.y, visual.w, visual.h, b.index, selected, visual);
    }
    const hoverBounds=selectionVisualBounds(b,element);
    const hoverPivot=b.rotationCenter||{x:hoverBounds.x+hoverBounds.w/2,y:hoverBounds.y+hoverBounds.h/2};
    const hoverRotation=angle&&element.type!=='line'?` transform="rotate(${angle} ${hoverPivot.x} ${hoverPivot.y})"`:'';
    const hoverOutline=element.type==='line'?'':`<rect class="hover-outline" x="${hoverBounds.x}" y="${hoverBounds.y}" width="${Math.max(.1,hoverBounds.w)}" height="${Math.max(.1,hoverBounds.h)}"${hoverRotation}/>`;
    let hoverTableControls='';
    if(element?.table_model&&!handleHits&&window.TableCornerControls){
      const matrix=placed?.getScreenCTM(),scale=1/Math.max(.01,Math.hypot(matrix?.a||1,matrix?.b||0));
      const controls=window.TableCornerControls.render({x:b.x,y:b.y,w,h,index:b.index,scale,locked:!!(element.locked||element.table_model.locked)});
      const columns=window.TableTools?.lengths(element.table_model.columns,Number(element.width_mm)||w)||[],rows=window.TableTools?.lengths(element.table_model.rows,Number(element.height_mm)||h)||[];
      let lines='',dx=0,dy=0;
      for(let i=0;i<=columns.length;i++){lines+=`<line class="table-divider-hit" data-table-index="${b.index}" data-table-axis="columns" data-table-divider="${i}" x1="${b.x+dx}" y1="${b.y}" x2="${b.x+dx}" y2="${b.y+h}"/>`;dx+=columns[i]||0;}
      for(let i=0;i<=rows.length;i++){lines+=`<line class="table-divider-hit" data-table-index="${b.index}" data-table-axis="rows" data-table-divider="${i}" x1="${b.x}" y1="${b.y+dy}" x2="${b.x+w}" y2="${b.y+dy}"/>`;dy+=rows[i]||0;}
      hoverTableControls=rotation?`<g${rotation}>${lines}${controls}</g>`:lines+controls;
    }
    interaction += `<g data-editor-overlay="${b.index}" class="${sel||handleHits?'is-selected':''}">${hoverOutline}${hits}${sel}${handleHits}${hoverTableControls}</g>`;
  });
  if(multiSelection&&placed){
    const points=selectedBoxes.flatMap(b=>{const v=selectionVisualBounds(b,editing.elements[b.index]),a=(Number(editing.elements[b.index].rotation_deg)||0)*Math.PI/180,c=b.rotationCenter||{x:v.x+v.w/2,y:v.y+v.h/2};return [[v.x,v.y],[v.x+v.w,v.y],[v.x,v.y+v.h],[v.x+v.w,v.y+v.h]].map(([x,y])=>({x:c.x+(x-c.x)*Math.cos(a)-(y-c.y)*Math.sin(a),y:c.y+(x-c.x)*Math.sin(a)+(y-c.y)*Math.cos(a)}));});
    const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),right=Math.max(...points.map(p=>p.x)),bottom=Math.max(...points.map(p=>p.y));
    const matrix=placed.getScreenCTM(),scale=Math.max(.01,Math.hypot(matrix?.a||1,matrix?.b||0));
    interaction+=`<rect class="multi-selection-frame" x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" fill="none" stroke="#16a34a" stroke-width="1" stroke-dasharray="5 4" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
    interaction+=window.LineControls.render([{x:left,y:top},{x:right,y:bottom}],selectedBoxes[0].index,scale,selectedBoxes.every(b=>editing.elements[b.index].locked),{showEndpoints:false,kind:'selection',showTools:false});
  }
  if(placed)placed._editorBoxes=boxes;
  placed?.insertAdjacentHTML('beforeend', interaction);
  if(placed)for(const box of boxes){
    const fields=databaseFieldsUsedBy(editing.elements[box.index]);if(!fields.length)continue;
    const group=placed.querySelector(`[data-editor-overlay="${box.index}"]`);if(!group)continue;
    const x=box.x+box.w+.35,y=box.y-.2,ns='http://www.w3.org/2000/svg',badge=document.createElementNS(ns,'g');
    badge.setAttribute('class','source-origin-badge');badge.setAttribute('transform',`translate(${x} ${y})`);badge.setAttribute('aria-label','Database field: '+fields.join(', '));
    const title=document.createElementNS(ns,'title');title.textContent='Database: '+fields.join(', ');badge.append(title);
    const plate=document.createElementNS(ns,'rect');plate.setAttribute('x','0');plate.setAttribute('y','-1.25');plate.setAttribute('width','2.5');plate.setAttribute('height','2.5');plate.setAttribute('rx','.65');plate.setAttribute('fill','#fff');plate.setAttribute('stroke','#2563eb');plate.setAttribute('stroke-width','.12');badge.append(plate);
    const icon=document.createElementNS(ns,'path');icon.setAttribute('d','M.48-.72c0-.2.35-.34.78-.34s.78.14.78.34-.35.34-.78.34S.48-.52.48-.72Zm0 0v.92c0 .19.35.34.78.34s.78-.15.78-.34v-.92M.48-.25c0 .19.35.34.78.34s.78-.15.78-.34');icon.setAttribute('transform','translate(0 .26)');badge.append(icon);group.append(badge);
  }
  for(const b of boxes){const e=editing.elements[b.index];if(e.table_model?.overflow&&e.table_model.errors.warning){const n=document.createElementNS('http://www.w3.org/2000/svg','text');n.setAttribute('x',b.x);n.setAttribute('y',b.y-1);n.setAttribute('font-size','2');n.setAttribute('fill','#b42318');n.setAttribute('pointer-events','none');n.textContent='Content Does Not Fit';placed?.append(n);}}
  renderSidebarDataSources();
  ensurePreviewScrollbars(frame);
  const wrap=frame.querySelector('.canvaswrap'),canvas=wrap?.querySelector('svg');
  if(wrap&&canvas){const size=sizePreviewCanvas(frame,wrap,canvas);clampPreviewPan(frame,size);wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;}
  syncPreviewZoomControl();
  el('previewNote').textContent = `${formatSize(W, H, editing.unit, editing.dpi)} · ${editing.dpi || 203} dpi (${t('prev.note.editor')})`;
  if(editing.page?.enabled){const p=editing.page,extentW=(Number(p.left_mm)||0)+(Number(p.right_mm)||0)+(Number(p.columns)||1)*editing.width_mm+((Number(p.columns)||1)-1)*(Number(p.gap_x_mm)||0),extentH=(Number(p.top_mm)||0)+(Number(p.bottom_mm)||0)+(Number(p.rows)||1)*editing.height_mm+((Number(p.rows)||1)-1)*(Number(p.gap_y_mm)||0);el('previewNote').textContent+=` · Template ${formatSize(editing.width_mm,editing.height_mm,editing.unit,editing.dpi)}`;if(extentW>Number(p.width_mm)+.01||extentH>Number(p.height_mm)+.01)el('previewNote').textContent+=' · Template layout exceeds paper size. Adjust template size or margins in Layout.';}
  const designName={front:'Front / item template',back:'Back / item template',page:'Page template'}[editing.design_active||'front']||'Front / item template';
  el('previewNote').textContent+=` · ${designName} · Separate front/back: ${editing.separate_sides?'On':'Off'} · Back rotation: ${editing.back_rotate_180?'180°':'Off'} · Page template: ${editing.page_template_enabled?'On':'Off'}`;
  refreshObjectTools();
  attachCanvasHandlers();
  bindPreviewNavigation();
  updatePreviewRuler();
  document.dispatchEvent(new Event('editor-selection-changed'));
  renderPaperCornerControl(paperWrap, placed);
}
window.setEditorGapVisible=visible=>{editorGapVisible=!!visible;drawEditorCanvas();};

function lineWorldEndpoints(box,element){return window.LineGeometry.endpoints(element,box);}
function selectionVisualBounds(box, element) {
  if (element?.type === 'line') {
    const [a,b]=lineWorldEndpoints(box,element),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),half=Math.max(.1,Number(element.thickness_mm)||.3)/2;
    const padX=length?half*Math.abs(dy)/length:half,padY=length?half*Math.abs(dx)/length:half;
    return {x:Math.min(a.x,b.x)-padX,y:Math.min(a.y,b.y)-padY,w:Math.abs(dx)+2*padX,h:Math.abs(dy)+2*padY,linePoints:[a,b]};
  }
  const x2 = box.x + box.w;
  const y2 = box.y + box.h;
  if (element?.type === 'box' || element?.type === 'ellipse') {
    const thickness = Math.max(0.1, Number(element.thickness_mm) || 0.3);
    return { x: box.x - thickness / 2, y: box.y - thickness / 2, w: box.w + thickness, h: box.h + thickness };
  }
  // Table grid strokes are centered on the table bounds. Keep the green
  // selection frame on the outside edge of those strokes so it does not leave
  // a visible gap, especially along the bottom row.
  if (element?.table_model) {
    const thickness = Math.max(0, Number(element.table_model.stroke) || 0);
    const inset = Math.min(thickness / 2, Math.max(0, Math.min(box.w, box.h) / 2));
    return { x: box.x - inset, y: box.y - inset, w: box.w + inset * 2, h: box.h + inset * 2, rotationCenter: box.rotationCenter };
  }
  if(element?.type==='image'&&element.transparent_background===true){const pad=Math.max(.12,Number(element.thickness_mm)||.12);return{x:box.x-pad,y:box.y-pad,w:box.w+pad*2,h:box.h+pad*2,rotationCenter:box.rotationCenter};}
  return { x: box.x, y: box.y, w: box.w, h: box.h, rotationCenter: box.rotationCenter };
}

function drawStockPreview() {
  const w = Math.max(1, Number(editing.width_mm) || 51);
  const h = Math.max(1, Number(editing.height_mm) || 25);
  const left = Math.max(0, Number(editing.stock?.liner_left_mm ?? el('stockLeft').value) || 0);
  const right = Math.max(0, Number(editing.stock?.liner_right_mm ?? el('stockRight').value) || 0);
  const total = w + left + right;
  const gap = 2;
  const type = editing.stock?.type || el('stockType').value;
  const radius = type === 'die-cut' ? 0.8 : 0;
  el('stockPreview').innerHTML = `<svg viewBox="0 0 ${total} ${h + gap * 2}" style="width:100%;max-height:240px;" role="img" aria-label="Label and liner preview"><rect width="${total}" height="${h + gap * 2}" fill="#999" stroke="#555" stroke-width="0.2"/><rect x="${left}" y="${type === 'continuous' ? 0 : gap}" width="${w}" height="${type === 'continuous' ? h + gap * 2 : h}" rx="${radius}" fill="white" stroke="#555" stroke-width="0.2"/>${type === 'black-mark' ? `<rect x="0" y="0" width="${total}" height="1" fill="black"/>` : ''}</svg>`;
  el('stockSizeNote').textContent = `Label ${formatSize(w,h,measureUnit(),editing.dpi)} · Total width with liner ${mmToUnit(total,measureUnit(),editing.dpi)} ${unitSuffix()}`;
}

function resizeCursor(anchor, rotation){
  const local={e:0,se:45,s:90,sw:135,w:180,nw:225,n:270,ne:315}[anchor];
  if(local==null)return 'default';
  const angle=((local+(Number(rotation)||0))%180+180)%180;
  return ['ew-resize','nwse-resize','ns-resize','nesw-resize'][Math.round(angle/45)%4];
}
function selectionNameSVG(box,element){
  const matrix=liveOverlay()?.getScreenCTM(),scale=Math.max(.01,Math.hypot(matrix?.a||1,matrix?.b||0));
  return window.EditorSelectionRender?.renderObjectName(element,box,scale,elementTypeLabel(element))||'';
}
function positionSelectionName(group,box,element){
  const name=group?.querySelector('.selection-object-name');if(!name)return;
  name.querySelector('.selection-object-name-anchor')?.setAttribute('transform',`translate(${box.x} ${box.y})`);
  const angle=element?.type==='line'?0:Number(element?.rotation_deg)||0,pivot=box.rotationCenter||{x:box.x+box.w/2,y:box.y+box.h/2};
  if(angle)name.setAttribute('transform',`rotate(${angle} ${pivot.x} ${pivot.y})`);else name.removeAttribute('transform');
}
function elementHandlesSVG(x, y, w, h, index, element, box) {
  const objectName=selectionNameSVG({...box,x,y,w,h},element);
  if(element?.type==='line'){
    const points=box?.linePoints||lineWorldEndpoints(box||{x,y,w,h},element),matrix=liveOverlay()?.getScreenCTM();
    return objectName+window.LineControls.render(points,index,Math.hypot(matrix?.a||1,matrix?.b||0),!!element.locked,{showReset:window.TransformHistory?.has(element,index)});
  }
  const controlSvg=el('previewFrame')?.querySelector('.canvaswrap > svg'),controlRect=controlSvg?.getBoundingClientRect(),controlView=controlSvg?.viewBox?.baseVal,controlPixelsPerMm=Math.max(.01,Math.min((controlRect?.width||1)/(controlView?.width||1),(controlRect?.height||1)/(controlView?.height||1))),controlScale=1/controlPixelsPerMm;
  const pts = [
    ['nw', x, y], ['n', x + w / 2, y], ['ne', x + w, y],
    ['e', x + w, y + h / 2], ['se', x + w, y + h],
    ['s', x + w / 2, y + h], ['sw', x, y + h], ['w', x, y + h / 2],
  ];
  const barcode=['barcode128','code39','code93','ean13'].includes(element?.type);
  const angle=Number(element?.rotation_deg)||0;
  const dots=pts.map(([a,cx,cy])=>{
    const corner=['nw','ne','se','sw'].includes(a);
    const r=5*controlScale,hit=10*controlScale;
    const marker=corner?`<circle class="handle-dot" data-anchor="${a}" cx="${cx}" cy="${cy}" r="${r}" style="fill:#fff;stroke:#16a34a;stroke-width:${controlScale};visibility:${window.SvgSelectionHandles?.cornerVisibility(element,a)||'hidden'}"/>`: `<rect class="handle-dot" data-anchor="${a}" x="${cx-(a==='n'||a==='s'?7:3)*controlScale}" y="${cy-(a==='n'||a==='s'?3:7)*controlScale}" width="${(a==='n'||a==='s'?14:6)*controlScale}" height="${(a==='n'||a==='s'?6:14)*controlScale}" rx="${3*controlScale}" style="fill:#fff;stroke:#16a34a;stroke-width:${controlScale}"/>`;
    if(element.table_model&&!corner)return '';
    return element.locked?'':marker+`<circle class="handle-hit handle-${a}" data-handle="${index}" data-anchor="${a}" cx="${cx}" cy="${cy}" r="${hit}" style="cursor:${resizeCursor(a,angle)}"/>`;
  }).join('');
  const rotationCenter=box?.rotationCenter||{x:x+w/2,y:y+h/2};
  const tableCornerControls=element?.table_model&&window.TableCornerControls?window.TableCornerControls.render({x,y,w,h,index,scale:controlScale,locked:!!(element.locked||element.table_model.locked)}):'';
  const canAdjustStroke=!element?.locked&&(!element?.table_model||!element.table_model.locked)&&(element?.type==='box'||!!element?.table_model),strokeWidthControl=canAdjustStroke?`<g class="stroke-width-control" transform="translate(${x+w+18*controlScale} ${y+h+18*controlScale}) scale(${controlScale})"><title>Click to increase line thickness; drag left or right to adjust</title><circle class="stroke-width-hit" data-handle="${index}" cx="0" cy="0" r="18" fill="transparent" style="pointer-events:all;cursor:ew-resize"/><circle cx="0" cy="0" r="13" fill="#fff" stroke="#b7dfc4" stroke-width="1.2" pointer-events="none"/>${window.StrokeWidthControl?.renderHoverRing()||''}<path d="M-6-6h12m-3-3 3 3-3 3m-6-6-3 3 3 3M-7 5h14" fill="none" stroke="#166534" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/><path d="M-5 2h10" fill="none" stroke="#166534" stroke-width="3.2" stroke-linecap="round" pointer-events="none"/></g>`:'';
  const strokeWidthEdgeGuide=canAdjustStroke&&window.StrokeWidthControl?window.StrokeWidthControl.renderEdgeGuide({x,y,w,h,scale:controlScale,index}):'';
  const frameContent=dots+tableCornerControls+strokeWidthEdgeGuide+strokeWidthControl;
  const frame=angle?`<g transform="rotate(${angle} ${rotationCenter.x} ${rotationCenter.y})">${frameContent}</g>`:frameContent;
  const radians=angle*Math.PI/180,points=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}].map(point=>{const dx=point.x-rotationCenter.x,dy=point.y-rotationCenter.y;return{x:rotationCenter.x+dx*Math.cos(radians)-dy*Math.sin(radians),y:rotationCenter.y+dx*Math.sin(radians)+dy*Math.cos(radians)};});
  const bounds=[{x:Math.min(...points.map(p=>p.x)),y:Math.min(...points.map(p=>p.y))},{x:Math.max(...points.map(p=>p.x)),y:Math.max(...points.map(p=>p.y))}];
  const floatingContent=window.LineControls.render([{x,y},{x:x+w,y:y+h}],index,1/controlScale,!!element.locked,{showEndpoints:false,kind:elementTypeLabel(element).toLowerCase(),showReset:window.TransformHistory?.has(element,index)});
  const floating=angle?`<g transform="rotate(${angle} ${rotationCenter.x} ${rotationCenter.y})">${floatingContent}</g>`:floatingContent;
  let tableDividers='';
  if(element?.table_model&&!element.table_model.locked&&window.TableTools){
    const model=element.table_model,columnSizes=window.TableTools.lengths(model.columns||[],Number(element.width_mm)||w),rowSizes=window.TableTools.lengths(model.rows||[],Number(element.height_mm)||h),dpi=(editing?.dpi||203)/25.4,pixelWidth=Math.max(1,Math.ceil((Number(element.width_mm)||w)*dpi)),pixelHeight=Math.max(1,Math.ceil((Number(element.height_mm)||h)*dpi)),columnEdges=window.TableTools.rasterEdges(columnSizes,Number(element.width_mm)||w,pixelWidth),rowEdges=window.TableTools.rasterEdges(rowSizes,Number(element.height_mm)||h,pixelHeight),markers=[];
    for(let i=0;i<columnEdges.length;i++){const offset=x+columnEdges[i];markers.push(`<line class="table-divider-hit" data-table-index="${index}" data-table-axis="columns" data-table-divider="${i}" x1="${offset}" y1="${y}" x2="${offset}" y2="${y+h}"/>`);}
    for(let i=0;i<rowEdges.length;i++){const offset=y+rowEdges[i];markers.push(`<line class="table-divider-hit" data-table-index="${index}" data-table-axis="rows" data-table-divider="${i}" x1="${x}" y1="${offset}" x2="${x+w}" y2="${offset}"/>`);}
    if(markers.length)tableDividers=`<g${angle?` transform="rotate(${angle} ${rotationCenter.x} ${rotationCenter.y})"`:''}>${markers.join('')}</g>`;
  }
  if(!barcode||element.show_text===false)return `${objectName}${tableDividers}${frame}${floating}`;
  const hriGap=Math.max(0,Number.isFinite(Number(element.hri_gap_mm))?Number(element.hri_gap_mm):0.6),hriHeight=Number(element.hri_height_mm)||3,barHeight=Number(element.bar_height_mm)||10;
  const offset=Math.max(-hriGap,Number(element.hri_offset_mm)||0),hy=(box?.y||0)+barHeight+hriGap+offset+hriHeight*.36,align=element.hri_align||'center',hx=align==='left'?x:align==='right'?x+w:x+w/2;
  const hriHandle=`<circle class="hri-handle-dot" cx="${hx}" cy="${hy}" r="${5*controlScale}"/><circle class="hri-handle-hit" data-handle="${index}" cx="${hx}" cy="${hy}" r="${4*controlScale}"/>`;
  return `${objectName}${tableDividers}${frame}${floating}${angle?`<g transform="rotate(${angle} ${rotationCenter.x} ${rotationCenter.y})">${hriHandle}</g>`:hriHandle}`;
}

function elementTypeLabel(element) {
  if (element?.table_model) return 'Table';
  if (element?.symbol_font) return 'Symbol';
  if (element?.shape_preset) return element.label||'Shape';
  if (element?.source_format==='svg') return 'SVG';
  const labels={text:'Text',barcode128:'Barcode',code39:'Barcode',code93:'Barcode',ean13:'Barcode',qrcode:'QR Code',datamatrix:'Data Matrix',image:'Picture',line:'Line',box:'Rectangle',ellipse:'Ellipse',inverse:'Inverse'};
  return labels[element?.type]||'Object';
}

function liveElementText(elem) {
  const data = sampleData(editing);
  return window.ObjectData.resolve(elem||{},data);
}

function barcodeModuleCount(elem) {
  const text = liveElementText(elem) || (elem.type === 'ean13' ? '000000000000' : '000');
  const B = window.Barcode;
  if (!B) return Math.max(20, (text.length || 6) * 11);
  if (elem.type === 'ean13') {
    const enc = B.encodeEAN13(text);
    if (enc && enc.bits) return enc.bits.length;
    return (B.encode128B(text) || []).reduce((a, n) => a + n, 0) || 95;
  }
  const widths = elem.type === 'code39' ? B.encode39(text)
    : elem.type === 'code93' ? B.encode93(text)
    : B.encode128B(text);
  return (widths || []).reduce((a, n) => a + n, 0) || 40;
}

function boxFromAnchor(orig, pt, anchor, aspectRatio) {
  if(aspectRatio&&Number.isFinite(aspectRatio)&&aspectRatio>0&&['nw','ne','sw','se'].includes(anchor)){
    const right=anchor.includes('e'),bottom=anchor.includes('s');
    const fixedX=right?orig.x:orig.x+orig.w,fixedY=bottom?orig.y:orig.y+orig.h;
    const wantedW=Math.abs(pt.x-fixedX),wantedH=Math.abs(pt.y-fixedY);
    const scale=Math.max(0.01,wantedW/orig.w,wantedH/orig.h);
    const w=Math.round(orig.w*scale*1000)/1000,h=Math.round(orig.h*scale*1000)/1000;
    return {x:right?fixedX:fixedX-w,y:bottom?fixedY:fixedY-h,w,h};
  }
  if(aspectRatio&&Number.isFinite(aspectRatio)&&aspectRatio>0&&['n','s','e','w'].includes(anchor)){
    const horizontal=anchor==='e'||anchor==='w';
    const scale=horizontal?Math.abs(pt.x-(anchor==='e'?orig.x:orig.x+orig.w))/orig.w:Math.abs(pt.y-(anchor==='s'?orig.y:orig.y+orig.h))/orig.h;
    const w=Math.max(0.01,orig.w*scale),h=Math.max(0.01,orig.h*scale);
    return {x:anchor==='w'?orig.x+orig.w-w:horizontal?orig.x:orig.x+(orig.w-w)/2,y:anchor==='n'?orig.y+orig.h-h:horizontal?orig.y+(orig.h-h)/2:orig.y,w,h};
  }
  let x1 = orig.x, y1 = orig.y, x2 = orig.x + orig.w, y2 = orig.y + orig.h;
  if (anchor.indexOf('w') !== -1) x1 = pt.x;
  if (anchor.indexOf('e') !== -1) x2 = pt.x;
  if (anchor.indexOf('n') !== -1) y1 = pt.y;
  if (anchor.indexOf('s') !== -1) y2 = pt.y;
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  const right = snapEditorValue(Math.max(x1, x2), 'x'), bottom = snapEditorValue(Math.max(y1, y2), 'y');
  const left = snapEditorValue(x, 'x'), top = snapEditorValue(y, 'y');
  return { x: left, y: top, w: Math.max(1, right - left), h: Math.max(1, bottom - top) };
}

function applyElementBox(elem, box, origBox) {
  const dpi = (editing && editing.dpi) || 203;
  elem.x_mm = Math.max(designPaperBounds().minX, box.x - (editing.margin_mm?.left || 0));
  elem.y_mm = Math.max(designPaperBounds().minY, box.y - (editing.margin_mm?.top || 0));
  const dw = Math.abs(box.w - origBox.w) > 0.15;
  const dh = Math.abs(box.h - origBox.h) > 0.15;
  const barcodes = ['barcode128', 'code39', 'code93', 'ean13'];
  if (elem.type === 'text') {
    // Resize font uniformly: object width must never stretch the glyphs.
    const factor=dh?box.h/Math.max(.1,origBox.h):dw?box.w/Math.max(.1,origBox.w):1;
    if(elem.font_family){elem.font_size_pt=Math.max(1,(Number(elem.font_size_pt)||9)*factor);}
    else if(dw||dh)elem.height_mm=Math.max(.3,(origBox.h/.9)*factor);
  } else if (barcodes.includes(elem.type)) {
    if (dh) {
      const extra = elem.show_text === false ? 0 : 3.6;
      elem.bar_height_mm = Math.max(2, Math.round((box.h - extra) * 10) / 10);
    }
    if (dw) {
      const mods = barcodeModuleCount(elem);
      const moduleMm = box.w / Math.max(1, mods);
      elem.module_width = Math.max(0.2, Math.round((moduleMm * dpi / 25.4) * 10) / 10);
    }
  } else if (elem.type === 'qrcode') {
    elem.width_mm = Math.max(1, Math.min(box.w, box.h));
  } else if (elem.type === 'datamatrix') {
    elem.magnification = Math.min(20, Math.max(1, Math.round(Math.min(box.w, box.h) / 4)));
  } else if (elem.table_model && tableResizeBases.has(elem) && window.TableTools?.lengths) {
    const base=tableResizeBases.get(elem),round=value=>Math.round(value*10000)/10000;
    if(dw){const sizes=window.TableTools.lengths(base.columns, base.width),scale=box.w/Math.max(.1,base.width);elem.table_model.columns.forEach((column,i)=>{column.mode='Fixed';column.size=round(Math.max(Number(column.min)||.1,(sizes[i]||0)*scale));});elem.table_model.autoWidth=false;elem.width_mm=Math.max(.3,box.w);}
    if(dh){const sizes=window.TableTools.lengths(base.rows, base.height),scale=box.h/Math.max(.1,base.height);elem.table_model.rows.forEach((row,i)=>{row.mode='Fixed';row.size=round(Math.max(Number(row.min)||.1,(sizes[i]||0)*scale));});elem.table_model.autoHeight=false;elem.height_mm=Math.max(.3,box.h);}
  } else {
    if (dw) elem.width_mm = Math.max(0.3, box.w);
    if (dh) elem.height_mm = Math.max(0, box.h);
  }
}

// Restituisce l'SVG overlay attualmente nel DOM (viene ricreato ad ogni ridisegno).
function liveOverlay() { return el('previewFrame').querySelector('svg.overlay'); }
const tableResizeBases=new WeakMap();

function clientToMm(evt, svg) {
  if (!svg) return null;
  const m = svg.getScreenCTM();
  if (!m) return null;
  const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
  const p = pt.matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

function pastePointFromEvent(event){
  const svg=liveOverlay(),point=clientToMm(event,svg),paper=designPaperBounds();
  if(!point||point.x<paper.x||point.x>paper.x+paper.width||point.y<paper.y||point.y>paper.y+paper.height)return null;
  lastPastePointMm=point;
  return {...point};
}
window.captureEditorPastePoint=pastePointFromEvent;
document.addEventListener('pointermove',event=>{
  if(activeObjectGesture)return;
  if(!editing||!el('previewFrame')?.contains(event.target)){lastPastePointMm=null;return;}
  pastePointFromEvent(event);
});

function bindLineSelectionControls(svg){
  if(!svg)return;
  if(!svg._dividerAddBound){
    svg._dividerAddBound=true;let timer=null,current=null,button=null;
    const clear=()=>{clearTimeout(timer);timer=null;button?.remove();button=null;current=null;};
    svg.addEventListener('pointerover',event=>{
      if(event.target.closest?.('.table-divider-add')){clearTimeout(timer);timer=null;return;}
      if(button?.isConnected){const bounds=button.getBoundingClientRect(),padding=24;if(event.clientX>=bounds.left-padding&&event.clientX<=bounds.right+padding&&event.clientY>=bounds.top-padding&&event.clientY<=bounds.bottom+padding){clearTimeout(timer);timer=null;return;}}
      const line=event.target.closest?.('.table-divider-hit');if(!line)return;clearTimeout(timer);if(current===line&&button?.isConnected)return;clear();current=line;
      const matrix=svg.getScreenCTM(),scale=1/Math.max(.01,Math.hypot(matrix?.a||1,matrix?.b||0)),rows=line.dataset.tableAxis==='rows',x=Number(line.getAttribute('x1'))-(rows?18*scale:0),y=Number(line.getAttribute('y1'))-(rows?0:18*scale);
      button=document.createElementNS('http://www.w3.org/2000/svg','g');button.classList.add('table-divider-add');button.setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);button.setAttribute('role','button');button.setAttribute('tabindex','0');button.setAttribute('aria-label',rows?'Insert row here':'Insert column here');button.style.cursor='pointer';button.innerHTML='<circle r="13" fill="white" stroke="#d7dee8"/><path d="M-5 0H5M0-5V5" stroke="#334155" stroke-width="1.5"/>';
      const bridge=document.createElementNS('http://www.w3.org/2000/svg','rect');bridge.setAttribute('x',rows?0:-12);bridge.setAttribute('y',rows?-12:0);bridge.setAttribute('width',rows?20:24);bridge.setAttribute('height',rows?24:20);bridge.setAttribute('fill','transparent');bridge.setAttribute('pointer-events','all');button.prepend(bridge);
      button.addEventListener('pointerenter',()=>clearTimeout(timer));button.addEventListener('pointermove',()=>clearTimeout(timer));
      const insert=event=>{event.preventDefault();event.stopImmediatePropagation();window.TableTools?.insertAxisFromCanvas(Number(line.dataset.tableIndex),line.dataset.tableAxis,Number(line.dataset.tableDivider));clear();};
      button.addEventListener('pointerdown',event=>{event.preventDefault();event.stopImmediatePropagation();});button.addEventListener('click',insert);button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')insert(event);});line.parentNode.append(button);
    });
    const trackDividerPointer=event=>{
      if(!svg.isConnected){clear();document.removeEventListener('pointermove',trackDividerPointer);return;}
      if(!current||!button?.isConnected)return;
      if(event.target.closest?.('.table-divider-add')||event.target===current){clearTimeout(timer);timer=null;return;}
      const lineBounds=current.getBoundingClientRect(),buttonBounds=button.getBoundingClientRect(),padding=24;
      const inside=event.clientX>=Math.min(lineBounds.left,buttonBounds.left)-padding&&event.clientX<=Math.max(lineBounds.right,buttonBounds.right)+padding&&event.clientY>=Math.min(lineBounds.top,buttonBounds.top)-padding&&event.clientY<=Math.max(lineBounds.bottom,buttonBounds.bottom)+padding;
      if(inside){clearTimeout(timer);timer=null;}else if(timer===null)timer=setTimeout(()=>{timer=null;if(button?.matches(':hover')||current?.matches(':hover'))return;clear();},350);
    };
    document.addEventListener('pointermove',trackDividerPointer,{passive:true});
  }
    if(window.StrokeWidthControl)window.StrokeWidthControl.bindHover(svg);
    if(window.LineControls)window.LineControls.bindToolHover(svg);
    if(!document.getElementById('lineSelectionStyle')){const style=document.createElement('style');style.id='lineSelectionStyle';style.textContent='.line-endpoint rect.line-endpoint-marker{fill:#fff;stroke:#16a34a;stroke-width:3}.line-endpoint circle.line-endpoint-marker{fill:#fff;stroke:#86c99c;stroke-width:1}.line-controls [data-line-action]:hover>rect{fill:#e8f7ed}.line-controls [data-line-action]:focus-visible{outline:none}.line-controls [data-line-action]:focus-visible>rect{stroke:#16a34a;stroke-width:1}'+(window.LineControls?.hoverStyle||'')+'.stroke-width-edge-guide{opacity:0;transition:opacity .12s ease}.is-stroke-width-hover .stroke-width-edge-guide{opacity:1}';document.head.append(style);}
  for(const handle of svg.querySelectorAll('.line-move-hit:not([data-line-bound])')){handle.dataset.lineBound='true';handle.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();startDrag(event,Number(handle.dataset.lineMove),'move');});}
  for(const button of svg.querySelectorAll('[data-line-action]:not([data-line-bound])')){button.dataset.lineBound='true';
    const run=event=>{event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const index=Number(button.dataset.lineAction),element=editing?.elements[index];if(!element)return;
      if(button.dataset.command==='reset'){const entries=window.TransformHistory?.take(element,index)||[];if(!entries.length)return;pushSnapshot();for(const entry of entries){const found=editing.elements.indexOf(entry.element);const at=found>=0?found:Number.isInteger(entry.index)&&editing.elements[entry.index]?entry.index:-1;if(at>=0)editing.elements[at]=structuredClone(entry.before);}if(!editorSelection.has(index)){editorSelection=new Set([index]);editorSel=index;}renderEditorElements();drawEditorCanvas();touchEditor();updateUndoButtons();return;}
      if(!editorSelection.has(index))selectElement(index);
      if(button.dataset.command==='duplicate')duplicateSelectedElement();
      else if(button.dataset.command==='delete')deleteSelectedElement();
      else if(button.dataset.command==='lock'){pushSnapshot();const indices=editorSelection.size>1?[...editorSelection]:[index],locked=!indices.every(i=>editing.elements[i]?.locked);indices.forEach(i=>{if(editing.elements[i])editing.elements[i].locked=locked;});renderEditorElements();drawEditorCanvas();touchEditor();}
    };button.addEventListener('pointerdown',event=>{if(event.button!==0)return;run(event);});button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();});button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')run(event);});
  }
}
function attachCanvasHandlers() {
  const svg = liveOverlay();
  if (!svg) return;
  if(!svg._tableCornerControlsBound&&window.TableCornerControls)svg._tableCornerControlsBound=window.TableCornerControls.bind(svg,(tableIndex,axis)=>window.TableTools?.addAxisFromCanvas?.(tableIndex,axis));
  const resetTextCursor=()=>svg.querySelectorAll('.hit[data-hit]').forEach(hit=>{hit.style.cursor='';});
  let hoverHit=null,hoverEvent=null,hoverRaster=null,hoverRasterIndex=-1,hoverSequence=0;
  const updateInkCursor=(hit,event,canvas,index)=>{
    if(!canvas||!hit||!event||!svg.isConnected)return;
    const point=clientToMm(event,svg),view=svg.viewBox.baseVal;if(!point||!view.width||!view.height)return;
    const px=Math.floor((point.x-view.x)/view.width*canvas.width),py=Math.floor((point.y-view.y)/view.height*canvas.height);
    let onInk=false;if(px>=0&&py>=0&&px<canvas.width&&py<canvas.height){const pixel=canvas.getContext('2d').getImageData(px,py,1,1).data;onInk=pixel[0]*.299+pixel[1]*.587+pixel[2]*.114<150;}
    if(hoverHit===hit&&hoverEvent===event)hit.style.cursor=onInk?'text':'move';
  };
  svg.addEventListener('pointermove',event=>{
    if(activeObjectGesture)return;
    if(event.buttons || svg.classList.contains('is-object-moving'))return;
    const hit=event.target.closest?.('.hit[data-hit]');
    const hoveredIndex=hit?.dataset.hit;
    svg.querySelectorAll('.is-source-hover').forEach(group=>{if(group.dataset.editorOverlay!==hoveredIndex)group.classList.remove('is-source-hover');});
    if(hoveredIndex!==undefined)svg.querySelector(`[data-editor-overlay="${hoveredIndex}"]`)?.classList.add('is-source-hover');
    if(!hit){hoverHit=null;hoverEvent=null;resetTextCursor();return;}
    const index=Number(hit.dataset.hit);if(editing?.elements?.[index]?.type!=='text'){hoverHit=hit;hoverEvent=event;hit.style.cursor='';return;}
    hoverHit=hit;hoverEvent={clientX:event.clientX,clientY:event.clientY};const sampleEvent=hoverEvent;
    if(hoverRasterIndex!==index){hoverRaster=null;hoverRasterIndex=index;const token=++hoverSequence;void window.LabelPreview.rasterizeDesignSheetCanvas({...editing,background:null,print_border:false},sampleData(editing),[index],qrCache,{paperPage:false,designSheet:true}).then(canvas=>{if(token!==hoverSequence||hoverHit!==hit)return;hoverRaster=canvas;updateInkCursor(hit,hoverEvent,canvas,index);}).catch(()=>{if(hoverHit===hit)hit.style.cursor='move';});}
    else if(hoverRaster)updateInkCursor(hit,sampleEvent,hoverRaster,index);
  },{passive:true});
  svg.addEventListener('pointerleave',()=>{hoverHit=null;hoverEvent=null;hoverSequence++;hoverRaster=null;hoverRasterIndex=-1;resetTextCursor();},{passive:true});
  svg.querySelectorAll('.hit').forEach((rect) => {
    rect.addEventListener('pointerdown', (e) => {
      if(e.button!==0)return;
      const focusCanvas=()=>{const frame=el('previewFrame');if(frame){frame.tabIndex=0;frame.focus({preventScroll:true});}};
      const index = Number(rect.dataset.hit);
      if(e.altKey){startAltDuplicateDrag(e,index);queueMicrotask(focusCanvas);return;}
      // The I-beam hover indicates the actual rendered glyph. Turn that click
      // into native text editing rather than starting an object drag.
      if(editing?.elements?.[index]?.type==='text'&&hoverHit===rect&&hoverRaster){
        const point=clientToMm(e,svg),view=svg.viewBox.baseVal;
        const px=point?Math.floor((point.x-view.x)/view.width*hoverRaster.width):-1;
        const py=point?Math.floor((point.y-view.y)/view.height*hoverRaster.height):-1;
        let onInk=false;
        if(px>=0&&py>=0&&px<hoverRaster.width&&py<hoverRaster.height){const pixel=hoverRaster.getContext('2d').getImageData(px,py,1,1).data;onInk=pixel[0]*.299+pixel[1]*.587+pixel[2]*.114<150;}
        if(onInk){
          e.preventDefault();e.stopPropagation();cancelTextClick();
          const textNode=svg.querySelector('[data-label-element="'+index+'"] text');let char=-1;
          if(textNode){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;try{char=textNode.getCharNumAtPosition(pt.matrixTransform(textNode.getScreenCTM().inverse()));}catch(_){}}
          if(!editorSelection.has(index)||editorSelection.size!==1)selectElement(index);
          focusTextProperty(index,false,null,char>=0?char+1:null);
          return;
        }
      }
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        e.preventDefault(); e.stopPropagation();
        const originX=e.clientX, originY=e.clientY;
        let started=false;
        const move=ev=>{
          if(started||Math.hypot(ev.clientX-originX,ev.clientY-originY)<=4)return;
          started=true;
          window.removeEventListener('pointermove',move);
          window.removeEventListener('pointerup',up);
          if(!editorSelection.has(index))selectElement(index);
          startDrag(e,index,'move');
        };
        const up=()=>{
          window.removeEventListener('pointermove',move);
          window.removeEventListener('pointerup',up);
          if(!started)toggleEditorSelection(index);
          queueMicrotask(focusCanvas);
        };
        window.addEventListener('pointermove',move);
        window.addEventListener('pointerup',up);
        return;
      }
      if(editing?.elements?.[index]?.type==='text'){
        e.preventDefault();e.stopPropagation();cancelTextClick();
        const x=e.clientX,y=e.clientY;
        const cleanup=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cleanup);};
        const move=event=>{if(Math.hypot(event.clientX-x,event.clientY-y)<=4)return;cleanup();if(!editorSelection.has(index))selectElement(index);startDrag(e,index,'move');};
        const up=()=>{cleanup();if(!editorSelection.has(index)||editorSelection.size!==1)selectElement(index);focusCanvas();cancelTextClick();void editTextAtInk(index,x,y,textClickGeneration);};
        window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});window.addEventListener('pointercancel',cleanup,{once:true});
        return;
      }
      if(isReplaceablePicture(editing?.elements?.[index])){
        e.preventDefault();e.stopPropagation();cancelTextClick();
        const x=e.clientX,y=e.clientY;
        const alreadySelected=editorSelection.has(index)&&editorSelection.size===1;
        const cleanup=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cleanup);};
        const move=event=>{if(Math.hypot(event.clientX-x,event.clientY-y)<=4)return;cleanup();if(!editorSelection.has(index))selectElement(index);startDrag(e,index,'move');};
        const up=()=>{cleanup();if(!alreadySelected){if(!editorSelection.has(index)||editorSelection.size!==1)selectElement(index);focusCanvas();return;}importPictureForElement(index);focusCanvas();};
        window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});window.addEventListener('pointercancel',cleanup,{once:true});
        return;
      }
      if (!editorSelection.has(index) || editorSelection.size < 1) selectElement(index);
      cancelTextClick();
      startDrag(e, index, 'move');
      queueMicrotask(focusCanvas);
    });
  });
  svg.querySelectorAll('.handle-hit, .handle').forEach((rect) => {
    rect.addEventListener('pointerdown', (e) => {
      if(e.button!==0)return;
      e.stopPropagation();
      startDrag(e, Number(rect.dataset.handle), 'resize', rect.dataset.anchor);
    });
  });
  svg.querySelectorAll('.stroke-width-hit').forEach(handle=>handle.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    event.preventDefault();event.stopPropagation();
    startDrag(event,Number(handle.dataset.handle),'stroke-width','stroke-width');
  }));
  svg.querySelectorAll('.table-divider-hit').forEach(handle=>handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;startTableDividerDrag(e,Number(handle.dataset.tableIndex),handle.dataset.tableAxis,Number(handle.dataset.tableDivider));}));
  svg.querySelectorAll('.hri-handle-hit').forEach((handle) => handle.addEventListener('pointerdown', (e) => {
    if(e.button!==0)return;
    e.preventDefault();e.stopPropagation();
    try{handle.setPointerCapture(e.pointerId);}catch{}
    startDrag(e,Number(handle.dataset.handle),'hri','hri');
  }));
  svg.querySelectorAll('.rotation-hit').forEach(handle=>handle.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    startDrag(e,Number(handle.dataset.rotate),'rotate','rotate');
  }));
  bindLineSelectionControls(svg);
  svg.addEventListener('pointerdown', (e) => {
    if(e.button!==0)return;
    if (e.target.closest('.hit, .handle-hit, .hri-handle-hit, .handle, .stroke-width-hit, .table-corner-add, .line-controls, [data-line-action], .rotation-hit, .line-move-hit, .reset-hit')) return;
    startMarqueeSelection(e, svg);
  });
}

function toggleEditorSelection(index) {
  const next = new Set(editorSelection);
  const groupId=editing?.elements?.[index]?.group_id,members=groupId?editing.elements.flatMap((element,i)=>element.group_id===groupId?[i]:[]):[index];
  if (members.every(i=>next.has(i))) members.forEach(i=>next.delete(i));
  else members.forEach(i=>next.add(i));
  editorSelection = next;
  editorSel = next.has(index) ? index : (next.size ? [...next].at(-1) : -1);
  refreshSelectionPresentation({renderInspector:renderEditorElements,updateCanvasSelection,drawCanvas:drawEditorCanvas,allowLightCanvas:editorSelection.size<=1});
}

function tableLineMode(event){if((event.ctrlKey||event.metaKey)&&event.shiftKey)return 'proportional';if(event.ctrlKey||event.metaKey)return 'equal';if(event.shiftKey)return 'pair';return 'table';}
function applyTableLineResize(element,axis,items,result,original,options={}){
  const geometry=window.TableDividerLive?.applyTableLineGeometry||((el,ax,list,res,orig)=>{const horizontal=ax==='columns',model=el.table_model;if(horizontal)model.autoWidth=false;else model.autoHeight=false;const total=Math.max(1,list.reduce((sum,item)=>sum+Number(item.size),0));if(horizontal){el.width_mm=Math.max(total,orig.width+Number(res.tableDelta||0));el.x_mm=res.edge==='start'?orig.x+(orig.width-el.width_mm):orig.x;el.height_mm=orig.height;el.y_mm=orig.y;}else{el.height_mm=Math.max(total,orig.height+Number(res.tableDelta||0));el.y_mm=res.edge==='start'?orig.y+(orig.height-el.height_mm):orig.y;el.width_mm=orig.width;el.x_mm=orig.x;}return{horizontal};});
  const {horizontal}=geometry(element,axis,items,result,original);
  if(options.live)return;
  if(horizontal)window.TableTools?.fitRowsToContent?.(element);else window.TableTools?.ensureContentFits?.(element);
}
function restoreTableLine(element,items,snapshot,original){items.forEach((item,index)=>Object.assign(item,snapshot[index]));original.rows?.forEach((row,index)=>Object.assign(element.table_model.rows[index],row));element.width_mm=original.width;element.height_mm=original.height;element.x_mm=original.x;element.y_mm=original.y;element.table_model.autoWidth=original.autoWidth;element.table_model.autoHeight=original.autoHeight;}
function tableLineMeasure(element,axis,items,divider){const cell=divider<=0?0:Math.min(items.length-1,divider-1),value=Number(items[cell]?.size)||0,unit=measureUnit();return `${Number(mmToUnit(value,unit,measureDpi())).toFixed(2)} ${unitSuffix(unit)}`;}
const gestureMeasure=window.GestureMeasure.create(document);
function showTableLineMeasure(text){gestureMeasure.show(text);}
function hideTableLineMeasure(){gestureMeasure.hide();}
function paintTableDividerLive(index,element,gestureData){
  const svg=liveOverlay();if(!svg||!element?.table_model)return false;
  const marginX=Number(editing?.margin_mm?.left)||0,marginY=Number(editing?.margin_mm?.top)||0;
  const tableElement={...element,x_mm:(Number(element.x_mm)||0)+marginX,y_mm:(Number(element.y_mm)||0)+marginY};
  const art=svg.querySelector(`[data-label-element="${index}"]`),controls=svg.querySelector(`[data-editor-overlay="${index}"]`);
  const angle=Number(element.rotation_deg)||0,cx=tableElement.x_mm+Number(element.width_mm)/2,cy=tableElement.y_mm+Number(element.height_mm)/2;
  if(art){
    if(!window.LabelPreview.updateTableSVG(art,tableElement,gestureData)){
      const markup=window.LabelPreview.renderElement(tableElement,editing.dpi||203,gestureData,qrCache,{interactive:true});
      art.innerHTML=angle?`<g transform="rotate(${angle} ${cx} ${cy})">${markup}</g>`:markup;art._tableLiveNodes=null;
    }
  }
  const box={index,type:'image',x:tableElement.x_mm,y:tableElement.y_mm,w:Number(element.width_mm)||1,h:Number(element.height_mm)||1,rotationCenter:{x:cx,y:cy}};
  if(Array.isArray(svg._editorBoxes)){const existing=svg._editorBoxes.find(item=>item.index===index);if(existing)Object.assign(existing,box);else svg._editorBoxes.push(box);}
  if(controls){
    const visual=selectionVisualBounds(box,element),sel=controls.querySelector('rect.sel');
    positionSelectionName(controls,visual,element);
    if(sel){
      sel.setAttribute('x',visual.x);sel.setAttribute('y',visual.y);sel.setAttribute('width',visual.w);sel.setAttribute('height',visual.h);
      if(angle)sel.setAttribute('transform',`rotate(${angle} ${cx} ${cy})`);else sel.removeAttribute('transform');
    }
    const model=element.table_model,columnSizes=window.TableTools.lengths(model.columns||[],box.w),rowSizes=window.TableTools.lengths(model.rows||[],box.h);
    const dpi=(editing?.dpi||203)/25.4,pixelWidth=Math.max(1,Math.ceil(box.w*dpi)),pixelHeight=Math.max(1,Math.ceil(box.h*dpi));
    const columnEdges=window.TableTools.rasterEdges(columnSizes,box.w,pixelWidth),rowEdges=window.TableTools.rasterEdges(rowSizes,box.h,pixelHeight);
    controls.querySelectorAll('.table-divider-hit').forEach(line=>{
      const divider=Number(line.dataset.tableDivider),axisName=line.dataset.tableAxis;
      if(axisName==='columns'){const offset=box.x+(columnEdges[divider]??0);line.setAttribute('x1',offset);line.setAttribute('x2',offset);line.setAttribute('y1',box.y);line.setAttribute('y2',box.y+box.h);}
      else{const offset=box.y+(rowEdges[divider]??0);line.setAttribute('y1',offset);line.setAttribute('y2',offset);line.setAttribute('x1',box.x);line.setAttribute('x2',box.x+box.w);}
    });
    const corners=[['nw',visual.x,visual.y],['ne',visual.x+visual.w,visual.y],['se',visual.x+visual.w,visual.y+visual.h],['sw',visual.x,visual.y+visual.h]];
    const dots=[...controls.querySelectorAll('circle.handle-dot')];
    corners.forEach(([anchor,hx,hy],i)=>{
      const hit=controls.querySelector(`.handle-${anchor}`);if(hit){hit.setAttribute('cx',hx);hit.setAttribute('cy',hy);}
      if(dots[i]){dots[i].setAttribute('cx',hx);dots[i].setAttribute('cy',hy);}
    });
  }
  return true;
}
function autofitTableLine(index,axis,divider){const element=editing?.elements?.[index],model=element?.table_model,api=window.TableDesign,tools=window.TableTools;if(!model||model.locked||!api?.autofitLine||!tools?.bake)return;tools.ensureContentFits?.(element);const horizontal=axis==='columns',items=horizontal?model.columns:model.rows,total=horizontal?Number(element.width_mm):Number(element.height_mm),sizes=tools.lengths(items,total);if(divider<0||divider>items.length)return;const cell=divider<=0?0:divider-1,original={x:Number(element.x_mm)||0,y:Number(element.y_mm)||0,width:Number(element.width_mm)||0,height:Number(element.height_mm)||0,autoWidth:!!model.autoWidth,autoHeight:!!model.autoHeight,rows:model.rows.map(row=>({...row}))},snapshot=items.map(item=>({...item}));pushSnapshot();const result=api.autofitLine(items,divider,sizes,api.contentExtent(model,axis,cell));applyTableLineResize(element,axis,items,result,original);try{tools.bake(element);}catch{restoreTableLine(element,items,snapshot,original);}drawEditorCanvas();touchEditor();}
function startTableDividerDrag(event,index,axis,divider){
  const element=editing?.elements?.[index],model=element?.table_model,api=window.TableDesign,tools=window.TableTools;
  if(!model||model.locked||!api?.resizeWordLine||!tools?.lengths)return;
  event.preventDefault();event.stopPropagation();
  if(event.detail>=2){autofitTableLine(index,axis,divider);return;}
  if(!editorSelection.has(index)||editorSelection.size!==1){
    editorSel=index;editorSelection=new Set([index]);renderEditorElements();
    if(!updateCanvasSelection())deferredGestureDraw=true;
    else{refreshObjectTools();document.dispatchEvent(new Event('editor-selection-changed'));}
  }
  const svg=liveOverlay(),start=clientToMm(event,svg);if(!start)return;
  const isColumn=axis==='columns';
  // Refresh content floors once before the gesture; never bake/redraw every frame.
  if(tools.ensureContentFits?.(element)){try{tools.bake(element);}catch{}drawEditorCanvas();window.TableCellSelection?.paint?.();}
  const items=isColumn?model.columns:model.rows,total=isColumn?Number(element.width_mm):Number(element.height_mm),sizes=tools.lengths(items,total);
  if(divider<0||divider>items.length)return;
  const angle=Number(element.rotation_deg)||0,center={x:(Number(element.x_mm)||0)+(editing.margin_mm?.left||0)+Number(element.width_mm)/2,y:(Number(element.y_mm)||0)+(editing.margin_mm?.top||0)+Number(element.height_mm)/2};
  const local=point=>{if(!angle)return point;const r=-angle*Math.PI/180,dx=point.x-center.x,dy=point.y-center.y;return{x:center.x+dx*Math.cos(r)-dy*Math.sin(r),y:center.y+dx*Math.sin(r)+dy*Math.cos(r)};};
  const startAt=local(start),startCoord=isColumn?startAt.x:startAt.y,original={x:Number(element.x_mm)||0,y:Number(element.y_mm)||0,width:Number(element.width_mm)||0,height:Number(element.height_mm)||0,autoWidth:!!model.autoWidth,autoHeight:!!model.autoHeight,rows:model.rows.map(row=>({...row}))},snapshot=items.map(item=>({...item}));
  gestureMeasure.begin(event);
  const beforeGestureSnapshot=window.EditHistory.cloneForGestureUndo(editing,[index]),gestureData=sampleData(editing);
  let changed=false,snapshotTaken=false,raf=null,pending=null,pendingMode=null;
  activeObjectGesture=true;
  svg.classList.add('is-object-moving');
  const paint=(ev,modeEvent=ev)=>{
    const point=clientToMm(ev,liveOverlay());if(!point)return;
    const at=local(point),desired=(isColumn?at.x:at.y)-startCoord;
    if(!changed&&Math.abs(desired)<.05)return;
    restoreTableLine(element,items,snapshot,original);
    const result=api.resizeWordLine(items,divider,desired,sizes,tableLineMode(modeEvent));
    if(Math.abs(result.applied)<1e-9){if(changed){paintTableDividerLive(index,element,gestureData);window.TableCellSelection?.paint?.();}return;}
    if(!snapshotTaken){
      undoStack=undoStack.concat([beforeGestureSnapshot]);
      if(undoStack.length>50)undoStack.shift();
      redoStack=[];snapshotTaken=true;pendingGestureRevision=beforeGestureSnapshot;updateUndoButtons();
    }
    changed=true;
    const liveFrame=window.TableDividerLive?.paintDividerLiveFrame;
    if(liveFrame)liveFrame({paintLive:()=>paintTableDividerLive(index,element,gestureData),paintSelection:()=>window.TableCellSelection?.paint?.()},{element,axis,items,result,original});
    else{applyTableLineResize(element,axis,items,result,original,{live:true});paintTableDividerLive(index,element,gestureData);window.TableCellSelection?.paint?.();}
    showTableLineMeasure(tableLineMeasure(element,axis,items,divider));
  };
  const schedule=()=>{if(raf!==null)return;raf=requestAnimationFrame(()=>{raf=null;const latest=pending,mode=pendingMode||latest;pending=null;pendingMode=null;if(latest)paint(latest,mode);});};
  const move=ev=>{pending=ev;schedule();};
  const cleanup=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);if(raf!==null){cancelAnimationFrame(raf);raf=null;}pending=null;pendingMode=null;hideTableLineMeasure();activeObjectGesture=false;svg.classList.remove('is-object-moving');};
  const up=ev=>{
    if(raf!==null){cancelAnimationFrame(raf);raf=null;}pending=null;pendingMode=null;paint(ev);cleanup();
    if(changed){
      // Content fit + bake once after the gesture — never on every RAF frame.
      if(isColumn)window.TableTools?.fitRowsToContent?.(element);else window.TableTools?.ensureContentFits?.(element);
      try{tools.bake(element);}catch{}
      drawEditorCanvas();window.TableCellSelection?.paint?.();touchEditor();flushPendingGestureRevision();
    }else if(deferredGestureDraw){drawEditorCanvas();window.TableCellSelection?.paint?.();}
  };
  const cancel=()=>{cleanup();if(changed){restoreTableLine(element,items,snapshot,original);pendingGestureRevision=null;try{tools.bake(element);}catch{}drawEditorCanvas();window.TableCellSelection?.paint?.();}else pendingGestureRevision=null;};
  const key=ev=>{if(!['Shift','Control','Meta'].includes(ev.key)||!pending)return;pendingMode=ev;schedule();};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});window.addEventListener('pointercancel',cancel,{once:true});window.addEventListener('keydown',key);window.addEventListener('keyup',key);
}

function startMarqueeSelection(e, svg) {
  e.preventDefault();
  const start = clientToMm(e, svg);
  if (!start) return;
  const additive = e.shiftKey || e.ctrlKey || e.metaKey;
  const base = additive ? new Set(editorSelection) : new Set();
  const marquee = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  marquee.setAttribute('class', 'marquee');
  marquee.setAttribute('pointer-events', 'none');
  svg.appendChild(marquee);
  let last = start;
  const update = (point) => {
    last = point;
    const x = Math.min(start.x, point.x), y = Math.min(start.y, point.y);
    marquee.setAttribute('x', x); marquee.setAttribute('y', y);
    marquee.setAttribute('width', Math.abs(point.x - start.x));
    marquee.setAttribute('height', Math.abs(point.y - start.y));
  };
  const move = (ev) => {
    const pt = clientToMm(ev, svg);
    if (pt) update(pt);
  };
  const up = (ev) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    const end = clientToMm(ev, svg) || last;
    const left = Math.min(start.x, end.x), top = Math.min(start.y, end.y);
    const right = Math.max(start.x, end.x), bottom = Math.max(start.y, end.y);
    const dragged = Math.abs(end.x - start.x) > 0.8 || Math.abs(end.y - start.y) > 0.8;
    let next = base;
    if (dragged) {
      const boxes = window.LabelPreview.computeBoxes(editing, sampleData(editing));
      for (const b of boxes) {
        const w = Math.max(b.w, b.type === 'text' ? 6 : 2);
        const h = Math.max(b.h, b.type === 'text' ? 4 : 2);
        if (b.x <= right && b.x + w >= left && b.y <= bottom && b.y + h >= top) next.add(b.index);
      }
      const groupIds=new Set([...next].map(i=>editing.elements[i]?.group_id).filter(Boolean));
      editing.elements.forEach((element,i)=>{if(groupIds.has(element.group_id))next.add(i);});
    }
    marquee.remove();
    editorSelection = next;
    editorSel = next.size ? [...next].at(-1) : -1;
    refreshSelectionPresentation({renderInspector:renderEditorElements,updateCanvasSelection,drawCanvas:drawEditorCanvas,allowLightCanvas:editorSelection.size<=1});
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function startAltDuplicateDrag(event,index){
  event.preventDefault();event.stopPropagation();
  if(!editorSelection.has(index))selectElement(index);
  const originX=event.clientX,originY=event.clientY;let started=false;
  const cleanup=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);};
  const move=ev=>{
    if(started||Math.hypot(ev.clientX-originX,ev.clientY-originY)<=4)return;
    started=true;cleanup();readEditorIntoDraft();
    const indices=[...editorSelection].filter(i=>Number.isInteger(i)&&editing.elements?.[i]).sort((a,b)=>a-b);
    if(!indices.length||!indices.includes(index))return;
    pushSnapshot();
    const copies=freshGroupIds(indices.map(i=>JSON.parse(JSON.stringify(editing.elements[i])))),first=editing.elements.length;
    editing.elements.push(...copies);editorSelection=new Set(copies.map((_,offset)=>first+offset));editorSel=first+copies.length-1;
    renderEditorElements();drawEditorCanvas();
    startDrag(event,first+indices.indexOf(index),'move',null,ev,true);
  };
  const up=()=>cleanup();
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});window.addEventListener('pointercancel',up,{once:true});
}

function startDrag(e, index, mode, anchor, initialMove=null, hasSnapshot=false) {
  e.preventDefault(); e.stopPropagation();
  const gestureFrame=el('previewFrame'),rotationViewport=mode==='rotate'?{left:gestureFrame.scrollLeft,top:gestureFrame.scrollTop,panX:previewPan.x,panY:previewPan.y}:null;
  // Avoid selectElement()'s full canvas rebuild + smooth scroll on pointerdown.
  if (!editorSelection.has(index)) {
    editorSel=index;
    const groupId=editing?.elements?.[index]?.group_id;
    editorSelection=new Set(groupId?editing.elements.flatMap((element,i)=>element.group_id===groupId?[i]:[]):[index]);
    renderEditorElements();
    if(!updateCanvasSelection())deferredGestureDraw=true;
    else{refreshObjectTools();document.dispatchEvent(new Event('editor-selection-changed'));}
  }
  const indices = mode === 'move' ? [...editorSelection].filter(i=>!editing.elements[i]?.locked) : [index];
  const elems = indices.map((i) => editing.elements[i]).filter(Boolean);
  const elem = editing.elements[index];
  if(elem?.locked)return;
  const transformBefore=new Map(indices.map(i=>[i,window.EditHistory.cloneForUndo(editing.elements[i])]));
  // Gesture undo clones only mutable elements and shares database rows/sources.
  const beforeGestureSnapshot=hasSnapshot?null:window.EditHistory.cloneForGestureUndo(editing,indices);
  const start = clientToMm(e, liveOverlay());
  if (!start || !elem) return;
  if(mode==='stroke-width')gestureMeasure.begin(e);
  let snapshotTaken=hasSnapshot,changed=false;
  const currentSvg=liveOverlay();
  const boxes = currentSvg?._editorBoxes || window.LabelPreview.computeBoxes(editing, sampleData(editing));
  if(currentSvg&&!currentSvg._editorBoxes)for(const box of boxes){
    const element=editing.elements[box.index];
    Object.assign(box,['barcode128','code39','code93','ean13'].includes(element?.type)?fitBarcodeSelectionBounds(box,element,currentSvg):fitTextSelectionBounds(box,element,currentSvg));
  }
  const b = boxes.find((box) => box.index === index);
  const orig = {
    x: b ? b.x : (Number(elem.x_mm) || 0),
    y: b ? b.y : (Number(elem.y_mm) || 0),
    w: Math.max(b ? b.w : 2, 2),
    h: Math.max(b ? b.h : 2, 2),
    elX: Number(elem.x_mm) || 0,
    elY: Number(elem.y_mm) || 0,
    thickness: Math.max(0.1, Number(elem.table_model?.stroke??elem.thickness_mm) || 0.3),
    lineCenterY: (b ? b.y : (Number(elem.y_mm) || 0)) + (Number(elem.height_mm) || 0) / 2,
    rotation: Number(elem.rotation_deg)||0,
    hriOffset: Number(elem.hri_offset_mm)||0,
    hriAlign: elem.hri_align||'center',
    formatFontSize: Number(elem.font_size_pt)||9,
    formatBoxWidth: Number(elem.text_box_width_mm)||0,
    formatBoxHeight: Number(elem.text_box_height_mm)||0,
    textScaleX: Math.max(.05,Number(elem.text_scale_x)||1),
    textScaleY: Math.max(.05,Number(elem.text_scale_y)||1),
    textWidth: Number(elem.width_mm)||3,
    textHeight: Number(elem.height_mm)||3,
  };
  if(mode==='resize'&&elem.table_model&&typeof tableResizeBases!=='undefined')tableResizeBases.set(elem,{columns:structuredClone(elem.table_model.columns),rows:structuredClone(elem.table_model.rows),width:Number(elem.width_mm)||orig.w,height:Number(elem.height_mm)||orig.h});
  const resizeCursorName=mode==='resize'&&typeof resizeCursor==='function'?resizeCursor(anchor,elem.rotation_deg):'';
  if(resizeCursorName)document.body.classList.add('resize-'+resizeCursorName.replace('-resize',''));
  const linePoints=elem.type==='line'&&b?lineWorldEndpoints(b,elem):null;
  const center=linePoints?{x:(linePoints[0].x+linePoints[1].x)/2,y:(linePoints[0].y+linePoints[1].y)/2}:b?.rotationCenter||{x:orig.x+orig.w/2,y:orig.y+orig.h/2};
  let textRotationOrigin=null;
  if(mode==='rotate'&&elem.type==='text'&&b){
    const localX=b.x+b.w/2,localY=b.y+b.h/2,radians=orig.rotation*Math.PI/180,dx=localX-center.x,dy=localY-center.y;
    const worldX=center.x+dx*Math.cos(radians)-dy*Math.sin(radians),worldY=center.y+dx*Math.sin(radians)+dy*Math.cos(radians);
    textRotationOrigin={x:orig.elX+worldX-localX,y:orig.elY+worldY-localY,pivotX:localX-orig.elX-(Number(editing.margin_mm?.left)||0),pivotY:localY-orig.elY-(Number(editing.margin_mm?.top)||0)};
    center.x=worldX;center.y=worldY;
  }
  const lineBaseAngle=linePoints?Math.atan2(linePoints[1].y-linePoints[0].y,linePoints[1].x-linePoints[0].x)*180/Math.PI:orig.rotation;
  const lineResize=elem.type==='line'&&b?{bounds:selectionVisualBounds(b,elem),points:lineWorldEndpoints(b,elem),offsetX:b.x-orig.elX,offsetY:b.y-orig.elY}:null;
  const rotationStart=Math.atan2(start.y-center.y,start.x-center.x)*180/Math.PI;
  const lockAspect=window.TableDesign?.lockAspectForResize?.(elem,anchor)??(elem.type==='image'&&!elem.table_model||(elem.type!=='line'&&elem.type!=='text'&&elem.type!=='image'&&['nw','ne','sw','se'].includes(anchor)));
  let shiftPressed=!!e.shiftKey,lastPointer={x:e.clientX,y:e.clientY};
  let moveAxis=null;
  const objectPoint=point=>{
    if(!['resize','hri','stroke-width'].includes(mode)||!orig.rotation||elem.type==='line')return point;
    const r=-orig.rotation*Math.PI/180,dx=point.x-center.x,dy=point.y-center.y;
    return {x:center.x+dx*Math.cos(r)-dy*Math.sin(r),y:center.y+dx*Math.sin(r)+dy*Math.cos(r)};
  };
  const groupOrig = new Map(indices.map((i) => {
    const item = editing.elements[i];
    return [i, { x: Number(item.x_mm) || 0, y: Number(item.y_mm) || 0 }];
  }));
  const lineMoveOrig=new Map(indices.filter(i=>editing.elements[i]?.type==='line').map(i=>[i,window.LineGeometry.endpoints(editing.elements[i])]));
  const movingBoxes=boxes.filter(box=>indices.includes(box.index));
  const movingBounds=movingBoxes.length?{
    left:Math.min(...movingBoxes.map(box=>box.x)),top:Math.min(...movingBoxes.map(box=>box.y)),
    right:Math.max(...movingBoxes.map(box=>box.x+box.w)),bottom:Math.max(...movingBoxes.map(box=>box.y+box.h)),
  }:null;
  const guides=document.createElementNS('http://www.w3.org/2000/svg','g');
  guides.setAttribute('class','alignment-guides');guides.setAttribute('pointer-events','none');
  const distanceGuides=document.createElementNS('http://www.w3.org/2000/svg','g');
  distanceGuides.setAttribute('class','object-distance-guides');distanceGuides.setAttribute('pointer-events','none');
  let distanceAxis='x',previousDistancePointer=start;
  const dragPaper=designPaperBounds(),staticBoxes=boxes.filter(box=>!indices.includes(box.index));
  const snapXTargets=[{x:dragPaper.x,type:'edge',page:true},{x:dragPaper.x+dragPaper.width/2,type:'center',page:true},{x:dragPaper.x+dragPaper.width,type:'edge',page:true}];
  const snapYTargets=[{y:dragPaper.y,type:'edge',page:true},{y:dragPaper.y+dragPaper.height/2,type:'center',page:true},{y:dragPaper.y+dragPaper.height,type:'edge',page:true}];
  for(const box of staticBoxes){snapXTargets.push({x:box.x,type:'edge'},{x:box.x+box.w/2,type:'center'},{x:box.x+box.w,type:'edge'});snapYTargets.push({y:box.y,type:'edge'},{y:box.y+box.h/2,type:'center'},{y:box.y+box.h,type:'edge'});}
  const staticDistanceBounds=staticBoxes.map(box=>window.ObjectDistanceGuides?.bounds({...box,rotation_deg:Number(editing.elements[box.index]?.rotation_deg)||0}));
  let lastDistanceUpdate=-Infinity;
  const snapMove=(dx,dy)=>{
    if(!movingBounds)return {dx,dy};
    if(Math.hypot(dx,dy)<1e-4){for(const node of guides.children)node.setAttribute('display','none');return {dx:0,dy:0};}
    const paper=dragPaper,W=paper.width,H=paper.height,tolerance=5/Math.max(.01,dragScale);
    const xTargets=snapXTargets,yTargets=snapYTargets;
    const movingX=[movingBounds.left+dx,(movingBounds.left+movingBounds.right)/2+dx,movingBounds.right+dx];
    const movingY=[movingBounds.top+dy,(movingBounds.top+movingBounds.bottom)/2+dy,movingBounds.bottom+dy];
    let bestX=null,bestY=null;
    for(const value of movingX)for(const target of xTargets){const delta=target.x-value;if(Math.abs(delta)<=tolerance&&(!bestX||Math.abs(delta)<Math.abs(bestX.delta)))bestX={delta,target};}
    for(const value of movingY)for(const target of yTargets){const delta=target.y-value;if(Math.abs(delta)<=tolerance&&(!bestY||Math.abs(delta)<Math.abs(bestY.delta)))bestY={delta,target};}
    let snappedX=dx+(bestX?.delta||0),snappedY=dy+(bestY?.delta||0);
    if(editorGrid.snap){
      const alignedX=snappedX,alignedY=snappedY;
      snappedX=DesignGrid.snapDelta(movingBounds.left,alignedX,true,editorGrid.step,dragPaper.x);
      snappedY=DesignGrid.snapDelta(movingBounds.top,alignedY,true,editorGrid.step,dragPaper.y);
      if(bestX&&Math.abs(snappedX-alignedX)>1e-7)bestX=null;
      if(bestY&&Math.abs(snappedY-alignedY)>1e-7)bestY=null;
    }
    const svg=dragSvg;
    for(const node of guides.children)node.setAttribute('display','none');
    const line=(x1,y1,x2,y2,axis,target)=>{let n=guides.querySelector('.'+axis);if(!n){n=document.createElementNS('http://www.w3.org/2000/svg','line');guides.append(n);}n.removeAttribute('display');n.setAttribute('x1',x1);n.setAttribute('y1',y1);n.setAttribute('x2',x2);n.setAttribute('y2',y2);n.setAttribute('class',`alignment-guide ${axis} ${target.type==='center'?'center':''}`);};
    if(bestX){const x=bestX.target.x;line(x,paper.y,x,paper.y+H,'vertical',bestX.target);}
    if(bestY){const y=bestY.target.y;line(paper.x,y,paper.x+W,y,'horizontal',bestY.target);}
    if(guides.parentNode!==svg)svg?.append(guides);
    return {dx:snappedX,dy:snappedY,pinX:!!(bestX&&bestX.target.page&&bestX.target.type==='edge'),pinY:!!(bestY&&bestY.target.page&&bestY.target.type==='edge')};
  };

  let rotationSnap=null,previewBox=null;
  const dragSvg=liveOverlay(),dragInverse=dragSvg?.getScreenCTM()?.inverse();
  const dragMatrix=dragSvg?.getScreenCTM(),dragScale=Math.hypot(dragMatrix?.a||1,dragMatrix?.b||0);
  const dragNodes=new Map(indices.map(i=>{const cellSelection=i===editorSel?dragSvg?.querySelector('.table-cell-selection'):null;return[i,{art:dragSvg?.querySelector(`[data-label-element="${i}"]`),controls:dragSvg?.querySelector(`[data-editor-overlay="${i}"]`),spill:dragSvg?.querySelector(`[data-overflow-highlight="${i}"]`),spillShape:dragSvg?.querySelector(`[data-overflow-highlight-shape="${i}"]`),cellSelection,cellSelectionTransform:cellSelection?.getAttribute('transform')||''}]}));
  const multiDragNodes=editorSelection.size>1?[...dragSvg.querySelectorAll(':scope > .multi-selection-frame,:scope > .line-controls')]:[];
  const gestureData=sampleData(editing),marginX=Number(editing.margin_mm?.left)||0,marginY=Number(editing.margin_mm?.top)||0;
  const gestureNodes=dragNodes.get(index);
  activeObjectGesture=true;
  dragSvg.classList.add('is-object-moving');
  if(mode==='hri')dragSvg.classList.add('is-hri-moving');
  if(!document.getElementById('drag-performance-style')){const style=document.createElement('style');style.id='drag-performance-style';style.textContent='.is-object-moving .line-controls rect{filter:none!important}.is-object-moving .hover-outline{visibility:hidden}';document.head.append(style);}
  const paintTransform=()=>{
    const nodes=gestureNodes;if(!nodes)return;
    if(mode==='stroke-width'){
      if(elem.table_model){const tableElement={...elem,x_mm:(Number(elem.x_mm)||0)+marginX,y_mm:(Number(elem.y_mm)||0)+marginY};window.LabelPreview.updateTableSVG(nodes.art,tableElement,gestureData);}
      else nodes.art?.querySelector('rect')?.setAttribute('stroke-width',Math.max(.1,Number(elem.thickness_mm)||.3));
      return;
    }
    if(mode==='rotate'&&elem.type!=='line'){
      const delta=(Number(elem.rotation_deg)||0)-orig.rotation;
      const transform=`rotate(${delta} ${center.x} ${center.y})`;
      nodes.art?.setAttribute('transform',transform);nodes.controls?.setAttribute('transform',transform);
      if(nodes.spill&&b)window.SvgSelectionHandles?.updateOverflowHighlight(nodes.spill,nodes.spillShape,b,Number(elem.rotation_deg)||0,dragPaper,window.ObjectDistanceGuides?.bounds,objectOverflowsPaperShape);
      return;
    }
    if(elem.type==='line'||mode==='hri'){
      // Tiny vector objects can be updated directly without touching the scene.
      const box=window.LabelPreview.computeBoxes({...editing,elements:[elem]},gestureData)[0];box.index=index;
      nodes.art.innerHTML=window.LabelPreview.renderElement({...elem,x_mm:box.x,y_mm:box.y},editing.dpi||203,gestureData,qrCache,{interactive:true});
      const visual=selectionVisualBounds(box,elem);
      const handles=elementHandlesSVG(visual.x,visual.y,visual.w,visual.h,index,elem,visual);
      if(mode==='hri'&&window.SvgSelectionHandles?.updateHriControls)window.SvgSelectionHandles.updateHriControls(nodes.controls,handles,visual,orig.rotation,b?.rotationCenter);
      else nodes.controls.innerHTML=handles;
      return;
    }
    let target=previewBox||{x:orig.x,y:orig.y,w:orig.w,h:orig.h};
    if(elem.type==='text')target={...target,w:orig.w*elem.text_scale_x/orig.textScaleX,h:orig.h*elem.text_scale_y/orig.textScaleY};
    else if(elem.type==='qrcode')target={...target,w:elem.width_mm,h:elem.width_mm};
    else if(elem.type==='datamatrix')target={...target,w:elem.magnification*4,h:elem.magnification*4};
    else if(['box','ellipse','inverse','image'].includes(elem.type)&&!elem.table_model)target={...target,w:Math.max(.001,Number(elem.width_mm)||0),h:Math.max(.001,Number(elem.height_mm)||0)};
    if(elem.table_model){
      window.TableTools?.ensureContentFits?.(elem);
      target={x:Number(elem.x_mm)+marginX,y:Number(elem.y_mm)+marginY,w:Number(elem.width_mm),h:Number(elem.height_mm)};
      const angle=Number(elem.rotation_deg)||0,cx=target.x+target.w/2,cy=target.y+target.h/2;
      const tableElement={...elem,x_mm:target.x,y_mm:target.y};
      if(!window.LabelPreview.updateTableSVG(nodes.art,tableElement,gestureData)){
        const markup=window.LabelPreview.renderElement(tableElement,editing.dpi||203,gestureData,qrCache,{interactive:true});
        nodes.art.innerHTML=angle?`<g transform="rotate(${angle} ${cx} ${cy})">${markup}</g>`:markup;nodes.art._tableLiveNodes=null;
      }
    }
    const geometry=window.GestureGeometry.resizeMatrix(orig,target,orig.rotation,center),transform=geometry.transform,cx=geometry.rotationCenter.x,cy=geometry.rotationCenter.y;
    // Keep vector shapes on a matrix transform during the gesture. Rebuilding
    // their SVG markup every pointer frame was hitching resize/move.
    if(!elem.table_model)nodes.art?.setAttribute('transform',transform);
    if(mode==='resize'&&!elem.table_model)window.SvgSelectionHandles?.preserveResizeStrokes(nodes.art,dragScale,node=>window.getComputedStyle(node));
    if((['barcode128','code39','code93','ean13'].includes(elem.type)||(elem.type==='image'&&elem.barcode_spec))&&nodes.art){
      // Live resize applies a non-uniform matrix to the whole barcode art.
      // Counter both axes on the HRI group so digits under the bars do not stretch.
      const hriScaleX=Math.max(.001,target.w/orig.w),hriScaleY=Math.max(.001,target.h/orig.h);
      const hri=nodes.art.querySelector('[data-barcode-hri="true"]');
      window.BarcodeHriResize?.preserveSize(hri,hriScaleX,hriScaleY);
    }
    if(nodes.controls){
      const controls=nodes.controls;
      // Keep resize controls anchored to the object while canceling the
      // preview's non-uniform scale from their screen-space shapes.
      const scaleX=Math.max(.01,target.w/orig.w),scaleY=Math.max(.01,target.h/orig.h);
      const inverseScaleX=1/scaleX,inverseScaleY=1/scaleY;
      window.SvgSelectionHandles?.counterScaleResizeControls(controls,transform,scaleX,scaleY);
      const nameContent=controls.querySelector('.selection-object-name-content');
      if(nameContent)nameContent.setAttribute('transform',`${nameContent.getAttribute('data-base-transform')} scale(${inverseScaleX} ${inverseScaleY})`);
    }
    if(nodes.spill&&b){
      const next={...b,...target,rotationCenter:{x:cx,y:cy}};
      window.SvgSelectionHandles?.updateOverflowHighlight(nodes.spill,nodes.spillShape,next,orig.rotation,dragPaper,window.ObjectDistanceGuides?.bounds,objectOverflowsPaperShape);
    }
    if(nodes.cellSelection)nodes.cellSelection.setAttribute('visibility','hidden');
  };
  const applyPointer = (ev) => {
    lastPointer={x:ev.clientX,y:ev.clientY};
    shiftPressed=!!ev.shiftKey;
    if(!changed&&Math.hypot(ev.clientX-e.clientX,ev.clientY-e.clientY)<=1)return;
    if(!snapshotTaken&&beforeGestureSnapshot){
      undoStack=undoStack.concat([beforeGestureSnapshot]);
      if(undoStack.length>50)undoStack.shift();
      redoStack=[];
      snapshotTaken=true;
      pendingGestureRevision=beforeGestureSnapshot;
      updateUndoButtons();
    }
    changed=true;
    let pointer = dragInverse?new DOMPoint(ev.clientX,ev.clientY).matrixTransform(dragInverse):clientToMm(ev, dragSvg);
    if (!pointer) return;
    if(mode==='resize'&&editorGrid.snap)pointer=DesignGrid.snapPoint(pointer,true,editorGrid.step,dragPaper.x,dragPaper.y);
    const pt=objectPoint(pointer);
    if (mode === 'rotate') {
      const angle=Math.atan2(pointer.y-center.y,pointer.x-center.x)*180/Math.PI;
      const normalize=value=>((value%360)+360)%360;
      const desired=normalize(lineBaseAngle+angle-rotationStart),targets=[];
      for(let value=0;value<360;value+=15)targets.push({angle:value,kind:'step'});
      const addEquivalentTargets=(angle,kind)=>{
        const normalized=normalize(angle);
        for(const existing of targets){const delta=((existing.angle-normalized+540)%360)-180;if(Math.abs(delta)<0.01)return;}
        targets.push({angle:normalized,kind});
      };
      (editing.elements||[]).forEach((other,otherIndex)=>{
        if(otherIndex===index)return;
        if(Number.isFinite(Number(other.rotation_deg)))addEquivalentTargets(Number(other.rotation_deg),'object');
        if(other.type==='line')addEquivalentTargets(Math.atan2(Number(other.height_mm)||0,Number(other.width_mm)||0)*180/Math.PI,'object');
      });
      let nearest=null;
      for(const target of targets){const delta=((target.angle-desired+540)%360)-180;if(!nearest||Math.abs(delta)<Math.abs(nearest.delta))nearest={...target,delta};}
      rotationSnap=!ev.altKey&&nearest&&Math.abs(nearest.delta)<=2.5?nearest:null;
      const nextAngle=ev.shiftKey?Math.round(desired/15)*15:rotationSnap?rotationSnap.angle:desired;
      if(lineResize){const points=window.LineGeometry.rotate(lineResize.points,nextAngle-lineBaseAngle),model=window.LineGeometry.fromEndpoints(points[0],points[1],elem.thickness_mm);model.x_mm-=lineResize.offsetX;model.y_mm-=lineResize.offsetY;Object.assign(elem,model);}else{elem.rotation_deg=normalize(nextAngle);elem.x_mm=textRotationOrigin?.x??orig.elX;elem.y_mm=textRotationOrigin?.y??orig.elY;if(textRotationOrigin){elem.rotation_pivot_x_mm=textRotationOrigin.pivotX;elem.rotation_pivot_y_mm=textRotationOrigin.pivotY;}}
    } else if (mode === 'stroke-width') {
      const delta=(pt.x-objectPoint(start).x)*.08,next=Math.max(.1,Math.min(5,Math.round((orig.thickness+delta)*100)/100));
      if(elem.table_model)elem.table_model.stroke=next;else elem.thickness_mm=next;
      showTableLineMeasure(`${Number(mmToUnit(next,measureUnit(),editing?.dpi)).toFixed(2)} ${unitSuffix()}`);
    } else if (mode === 'move') {
      const stepX=pt.x-previousDistancePointer.x,stepY=pt.y-previousDistancePointer.y;
      if(Math.hypot(stepX,stepY)>.01)distanceAxis=Math.abs(stepX)>=Math.abs(stepY)?'x':'y';
      previousDistancePointer=pt;
      let dx = pt.x - start.x, dy = pt.y - start.y, pinX=false, pinY=false;
      if(ev.shiftKey){
        if(!moveAxis&&Math.hypot(dx,dy)>.05)moveAxis=Math.abs(dx)>=Math.abs(dy)?'x':'y';
        if(moveAxis==='x')dy=0;else if(moveAxis==='y')dx=0;
      }else moveAxis=null;
      ({dx,dy,pinX,pinY}=snapMove(dx,dy));
      if(moveAxis==='x'){dy=0;pinY=false;guides.querySelectorAll('.horizontal').forEach(node=>node.remove());}
      if(moveAxis==='y'){dx=0;pinX=false;guides.querySelectorAll('.vertical').forEach(node=>node.remove());}
      for (const i of indices) {
        const item = editing.elements[i], initial = groupOrig.get(i);
        if (!item || !initial) continue;
        if(item.type==='line'){
          const points=window.LineGeometry.translate(lineMoveOrig.get(i),dx,dy),moved=window.LineGeometry.fromEndpoints(points[0],points[1],item.thickness_mm);
          Object.assign(item,moved);
        }else{
          item.x_mm = moveAxis==='y'?initial.x:initial.x+dx;
          item.y_mm = moveAxis==='x'?initial.y:initial.y+dy;
        }
      }
      // Move just the selected SVG groups during the gesture. Rebuilding the
      // whole preview on every frame re-encodes barcodes and makes dragging lag.
      {
        const overlay=dragSvg;
        overlay?.classList.add('is-object-moving');
        if(!document.getElementById('drag-performance-style')){const style=document.createElement('style');style.id='drag-performance-style';style.textContent='.is-object-moving .line-controls rect{filter:none!important}.is-object-moving .hover-outline{visibility:hidden}';document.head.append(style);}
        for(const i of indices){
          const item=editing.elements[i],initial=groupOrig.get(i);
          if(!item||!initial)continue;
          const tx=(Number(item.x_mm)||0)-initial.x,ty=(Number(item.y_mm)||0)-initial.y;
          dragNodes.get(i)?.art?.setAttribute('transform',`translate(${tx} ${ty})`);
          dragNodes.get(i)?.controls?.setAttribute('transform',`translate(${tx} ${ty})`);
          const cellSelection=dragNodes.get(i)?.cellSelection,cellSelectionTransform=dragNodes.get(i)?.cellSelectionTransform;
          if(cellSelection)cellSelection.setAttribute('transform',`translate(${tx} ${ty})${cellSelectionTransform?' '+cellSelectionTransform:''}`);
          const spill=dragNodes.get(i)?.spill;
          if(spill){
            const originalBox=movingBoxes.find(box=>box.index===i),moved=originalBox&&window.ObjectDistanceGuides?.bounds({...originalBox,x:originalBox.x+tx,y:originalBox.y+ty,rotation_deg:Number(item.rotation_deg)||0,rotationCenter:originalBox.rotationCenter?{x:originalBox.rotationCenter.x+tx,y:originalBox.rotationCenter.y+ty}:undefined});
            const x=moved?.left??originalBox?.x+tx,y=moved?.top??originalBox?.y+ty,right=moved?.right??x+(originalBox?.w||0),bottom=moved?.bottom??y+(originalBox?.h||0),paper=designPaperBounds();
            const outside=objectOverflowsPaperShape({left:x,top:y,right,bottom},paper);
            if(originalBox)window.SvgSelectionHandles?.updateOverflowHighlight(spill,dragNodes.get(i)?.spillShape,originalBox,Number(item.rotation_deg)||0,dragPaper,window.ObjectDistanceGuides?.bounds,objectOverflowsPaperShape,tx,ty);
            if(outside)spill.removeAttribute('display');else spill.setAttribute('display','none');
          }
          if(i===indices[0])for(const node of multiDragNodes)node.setAttribute('transform',`translate(${tx} ${ty})`);
        }
        const geometry=window.ObjectDistanceGuides;
        if(overlay&&geometry&&movingBoxes.length&&performance.now()-lastDistanceUpdate>=1000/30){
          lastDistanceUpdate=performance.now();
          const moved=movingBoxes.map(box=>{const item=editing.elements[box.index],initial=groupOrig.get(box.index);return geometry.bounds({...box,rotation_deg:Number(item.rotation_deg)||0,x:box.x+item.x_mm-initial.x,y:box.y+item.y_mm-initial.y,rotationCenter:box.rotationCenter?{x:box.rotationCenter.x+item.x_mm-initial.x,y:box.rotationCenter.y+item.y_mm-initial.y}:undefined});});
          const bounds={left:Math.min(...moved.map(b=>b.left)),right:Math.max(...moved.map(b=>b.right)),top:Math.min(...moved.map(b=>b.top)),bottom:Math.max(...moved.map(b=>b.bottom))};
          geometry.draw(distanceGuides,geometry.nearest(bounds,staticDistanceBounds,distanceAxis),dragScale,value=>`${Number(mmToUnit(value,measureUnit(),measureDpi())).toFixed(2)} ${unitSuffix()}`,[...guides.querySelectorAll('.alignment-guide:not([display="none"])')]);
          overlay.append(distanceGuides);
        }
      }
      return;
    } else if (mode === 'hri') {
      const hriGap=Math.max(0,Number.isFinite(Number(elem.hri_gap_mm))?Number(elem.hri_gap_mm):0.6);
      const localStart=objectPoint(start);
      const position=window.GestureGeometry.hriPosition({width:orig.w,alignment:orig.hriAlign,offset:orig.hriOffset,dx:pt.x-localStart.x,dy:pt.y-localStart.y,gap:hriGap,maxOffset:designPaperBounds().height});
      elem.hri_align=position.alignment;
      elem.hri_offset_mm=position.offset;
    } else if (elem.type === 'line' && mode === 'resize' && !(anchor||'').startsWith('line-') && (anchor || '').match(/[ns]/) && Math.abs(pt.y - start.y) >= Math.abs(pt.x - start.x)) {
      // Top/bottom handles edit stroke width. Cap it so a small drag cannot
      // turn a line into a large filled-looking slab.
      const dy = pt.y - start.y;
      const isTopSide = start.y <= orig.lineCenterY;
      const thicknessDelta = isTopSide ? -dy * 2 : dy * 2;
      elem.thickness_mm = Math.max(0.1, Math.min(5, Math.round((orig.thickness + thicknessDelta) * 100) / 100));
    } else if(elem.type==='line'&&mode==='resize'){
      if(lineResize){
        const points=window.LineGeometry.dragEndpoint(lineResize.points,anchor==='line-start'?0:1,pt,{snap:shiftPressed}),model=window.LineGeometry.fromEndpoints(points[0],points[1],elem.thickness_mm);
        model.x_mm-=lineResize.offsetX;model.y_mm-=lineResize.offsetY;Object.assign(elem,model);
      }
    } else if(elem.type==='text'&&mode==='resize'){
      const a=anchor||'se',ratio=shiftPressed&&['nw','ne','sw','se'].includes(a)?orig.w/orig.h:null,box=boxFromAnchor(orig,pt,a,ratio);
      previewBox=box;
      elem.text_scale_x=Math.max(.05,Math.min(20,orig.textScaleX*box.w/orig.w));
      elem.text_scale_y=Math.max(.05,Math.min(20,orig.textScaleY*box.h/orig.h));
      elem.x_mm=Math.max(designPaperBounds().minX,orig.elX+box.x-orig.x);
      elem.y_mm=Math.max(designPaperBounds().minY,orig.elY+box.y-orig.y);
    } else {
      const ratio=lockAspect&&(elem.type==='image'||shiftPressed)?orig.w/orig.h:null;
      previewBox=boxFromAnchor(orig, pt, anchor || 'se',ratio);
      applyElementBox(elem, previewBox, orig);
    }
    if (mode !== 'move') {
      paintTransform();
      if(mode==='rotate'){
        const svg=liveOverlay();if(!svg)return;
        guides.replaceChildren();guides.setAttribute('class','alignment-guides rotation-snap-guides');
        if(rotationSnap){
          const paper=designPaperBounds(),half=Math.hypot(paper.width,paper.height),radians=rotationSnap.angle*Math.PI/180;
          const dx=Math.cos(radians)*half,dy=Math.sin(radians)*half;
          const line=document.createElementNS('http://www.w3.org/2000/svg','line');
          line.setAttribute('x1',center.x-dx);line.setAttribute('y1',center.y-dy);line.setAttribute('x2',center.x+dx);line.setAttribute('y2',center.y+dy);line.setAttribute('class','rotation-snap-guide');guides.append(line);
        }
        let labelCenter=center;
        const visibleNodes=elem.type==='text'?[...(gestureNodes?.art?.querySelectorAll('text')||[])]:gestureNodes?.art?[gestureNodes.art]:[];
        const visibleBounds=visibleNodes.map(node=>node.getBoundingClientRect()).filter(rect=>rect.width>0&&rect.height>0),screenMatrix=svg.getScreenCTM();
        if(visibleBounds.length&&screenMatrix){const left=Math.min(...visibleBounds.map(rect=>rect.left)),right=Math.max(...visibleBounds.map(rect=>rect.right)),top=Math.min(...visibleBounds.map(rect=>rect.top)),bottom=Math.max(...visibleBounds.map(rect=>rect.bottom));labelCenter=new DOMPoint((left+right)/2,(top+bottom)/2).matrixTransform(screenMatrix.inverse());}
        window.SvgSelectionHandles?.updateRotationAngleLabel(guides,elem.rotation_deg,labelCenter);
        svg.append(guides);
      }
    }
  };
  const frameInput=window.FrameInput.create(applyPointer);
  const move = ev => frameInput.push(ev);
  const up = (ev) => {
    if(ev?.type==='pointerup'&&ev.button!==0)return;
    if(window.pauseEditorTransform===pauseTransform)window.pauseEditorTransform=null;
    frameInput.flush(ev?.type==='pointercancel'?undefined:ev);
    activeObjectGesture=false;
    dragSvg.classList.remove('is-object-moving','is-hri-moving');
    window.SvgSelectionHandles?.restoreResizeControlTransforms(gestureNodes?.controls);
    window.SvgSelectionHandles?.restoreResizeStrokes(gestureNodes?.art);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('keydown',shiftKeyChange,true);
    window.removeEventListener('pointercancel',up);
    window.removeEventListener('keyup',shiftKeyChange,true);
    guides.remove();
    distanceGuides.remove();
    rotationSnap=null;
    if(mode==='stroke-width')hideTableLineMeasure();
    if(typeof tableResizeBases!=='undefined')tableResizeBases.delete(elem);
    document.body.classList.remove('resize-ew','resize-ns','resize-nwse','resize-nesw');
    if(changed){
      if(!hasSnapshot&&['resize','rotate'].includes(mode)){
        const entries=indices.map(i=>({element:editing.elements[i],index:i,before:transformBefore.get(i)}));
        if(entries.length)window.TransformHistory?.remember(entries);
      }
      renderEditorElements();drawEditorCanvas();window.TableCellSelection?.paint();touchEditor();
      if(rotationViewport){previewPan.x=rotationViewport.panX;previewPan.y=rotationViewport.panY;gestureFrame.scrollLeft=rotationViewport.left;gestureFrame.scrollTop=rotationViewport.top;const wrap=gestureFrame.querySelector('.canvaswrap');if(wrap)wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;updatePreviewRuler();}
      flushPendingGestureRevision();
    }else{
      if(mode==='stroke-width'&&ev?.type==='pointerup'){
        const next=Math.min(5,Math.round((orig.thickness+.1)*100)/100);
        if(next>orig.thickness){pushSnapshot();if(elem.table_model)elem.table_model.stroke=next;else elem.thickness_mm=next;renderEditorElements();drawEditorCanvas();window.TableCellSelection?.paint();touchEditor();}
      }
      pendingGestureRevision=null;
      if(deferredGestureDraw)drawEditorCanvas();
    }
  };
  const shiftKeyChange=ev=>{
    if((!lockAspect&&mode!=='move'&&elem.type!=='line')||ev.key!=='Shift')return;
    shiftPressed=ev.type==='keydown';
    move({clientX:lastPointer.x,clientY:lastPointer.y,shiftKey:shiftPressed});
  };
  const pauseTransform=()=>{
    up();
    return ()=>{
      if(!editing)return;
      pushSnapshot();
      for(const [i,before] of transformBefore)if(editing.elements[i]){window.TransformHistory?.clear(editing.elements[i],i);editing.elements[i]=structuredClone(before);}
      editorSelection=new Set(indices);editorSel=index;
      renderEditorElements();drawEditorCanvas();touchEditor();updateUndoButtons();
    };
  };
  window.pauseEditorTransform=pauseTransform;
  if(lockAspect||mode==='move'||elem.type==='line'){window.addEventListener('keydown',shiftKeyChange,true);window.addEventListener('keyup',shiftKeyChange,true);}
  window.addEventListener('pointercancel',up);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  if(initialMove)move(initialMove);
}

let statusBadgeTimer;
function setEditorStatus(kind, msg) {
  const s=el('editorStatus');clearTimeout(statusBadgeTimer);s.replaceChildren();
  s.className=kind;s.hidden=!msg;s.setAttribute('role','status');s.setAttribute('aria-live','polite');
  s.style.cssText='position:fixed;top:64px;right:16px;bottom:auto;left:auto;z-index:10000;display:'+(msg?'flex':'none')+';align-items:flex-start;gap:12px;width:max-content;max-width:min(460px,calc(100vw - 32px));box-sizing:border-box;padding:10px 14px;margin:0;border-radius:8px;font-size:13px;font-weight:500;box-shadow:0 4px 16px #0002;overflow-wrap:anywhere;'+
    (kind==='ok'?'background:#dcfce7;color:#15803d;border:1px solid #86efac;':kind==='err'?'background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;':'background:#eff6ff;color:#1d4ed8;border:1px solid #93c5fd;');
  if(!msg)return;
  const text=document.createElement('span');text.textContent=msg;const close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Dismiss notification');close.style.cssText='border:0;background:transparent;color:inherit;padding:0;cursor:pointer;flex-shrink:0;line-height:1';close.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"/></svg>';const dismiss=()=>{clearTimeout(statusBadgeTimer);s.hidden=true;s.style.display='none';};close.onclick=dismiss;s.append(text,close);statusBadgeTimer=setTimeout(dismiss,kind==='err'?10000:5000);
}

async function saveEditor(asNew) {
  autoSavePolicy.cancel();
  readEditorIntoDraft();
  let name = el('edName').value.trim();
  if (!name) { setEditorStatus('err', t('dyn.nameNeeded')); return; }
  editing.name = name.replace(/\.json$/, '');
  if (asNew && current && (name + '.json') === current.file) name = name + '-copy';
  const res = await window.zebra.saveTemplate(name, editing);
  if (res && res.ok) {
    autoSavePolicy.cancel();editorDirty=false;
    factoryEdited = false;
    await reloadTemplates();
    if(asNew){await selectTemplate(res.file);editHistoryFile=res.file;recordEditRevision(editing,'Saved');persistEditHistory();}
    else{
      current=templates.find(template=>template.file===res.file)||{...current,file:res.file,name:editing.name,editable:true};
      rawTemplate=structuredClone(editing);
      if(editHistoryFile!==res.file){editHistoryFile=res.file;editRevisions=[];undoStack=[];redoStack=[];}
      recordEditRevision(editing,'Saved');persistEditHistory();
      if(settings){settings.lastTemplate=res.file;await window.zebra.saveSettings({lastTemplate:res.file});}
    }
    setEditorStatus('ok', 'Saved successfully.');
  } else setEditorStatus('err', t('dyn.printErr', { e: res?.error || '?' }));
}

async function deleteEditor() {
  if (!current) return;
  if (!window.confirm(`Delete template “${current.name}”?`)) return;
  autoSavePolicy.cancel();
  editorDirty = false;
  factoryEdited = false;
  const res = await window.zebra.deleteTemplate(current.file);
  if (res && res.ok) {
    if (settings.pages) { delete settings.pages[current.file]; window.zebra.saveSettings({ pages: settings.pages }); }
    current = null; rawTemplate = null; editing = null;
    settings.lastTemplate = null;
    await reloadTemplates();
    if (templates[0]) await selectTemplate(templates[0].file);
    else { current = null; rawTemplate = null; editing = null; openEditor(blankTemplate()); }
    window.zebra.saveSettings({ lastTemplate: current?.file || null });
    setMode('print');
  }
  else setEditorStatus('err', res?.error || 'Cannot delete.');
}

/* ============================ MODO / INIT ============================ */

function setMode() {
  el('editorView').style.display = 'block';
  el('previewControls').style.display = 'flex';
  el('previewHint').style.display = 'block';
  if (!editing) openEditor(rawTemplate || blankTemplate());
  else updateEditorPreview();
}

function onConnTypeChange() {
  const type = el('connType').value;
  el('wrapPrinter').style.display = type === 'printer' ? 'block' : 'none';
  el('wrapIp').style.display = type === 'ip' ? 'block' : 'none';
  el('wrapUsb').style.display = type === 'usb' ? 'block' : 'none';
  window.zebra.saveSettings({ connType: type });
  updateConnSummary();
  if (editing) { readEditorIntoDraft(); refreshEditorUI(); touchEditor(); }
}

// Riepilogo compatto della connessione mostrato nella barra laterale.
function updateConnSummary() {
  const box = el('connSummary'); if (!box) return;
  const type = el('connType').value;
  if (type === 'printer') box.textContent = '🖨️ ' + (el('printerSelect').value || t('dyn.noPrinter'));
  else if (type === 'ip') box.textContent = '🌐 ' + (el('ipInput').value || t('dyn.noIp')) + ':9100';
  else box.textContent = '🔌 USB ' + (el('usbInput').value || '(porta?)');
}

async function reloadTemplates(startup = false) {
  templates = startup?await startupRequest('label list',()=>window.zebra.listTemplates(),[]):await window.zebra.listTemplates();
  renderTemplateList();
  window.refreshProjectHome?.();
}

async function init() {
  settings = await startupRequest('settings',()=>window.zebra.getSettings(),{}) || {};
  autoSaveEnabled=autoSavePolicy.configure(settings.autoSaveEnabled);if(autoSaveEnabled&&editorDirty)autoSavePolicy.scheduleNow();
  if(settings.workspaceToolTab==='Home'||settings.workspaceToolTab==='Insert'){
    window.workspaceToolTab=settings.workspaceToolTab;
    [...document.querySelectorAll('.ribbon-tab')].find(button=>button.textContent.trim()===settings.workspaceToolTab)?.click();
  }
  renderRecentToolButtons();
  initializeInsertSidebarResizer();

  // Keep the interface language fixed to English, including migrated settings.
  const uiLang = 'en';
  settings.uiLang = uiLang;
  window.zebra.saveSettings({ uiLang }).catch(error=>console.warn('Could not save startup language setting:',error));
  window.I18N.setLang('en');
  document.documentElement.lang = 'en';
  window.I18N.applyStatic();
  updateMeasureLabels();
  // Do not make opening a label wait for Windows printer enumeration. The
  // spooler can be slow or unavailable while the editor itself is ready.
  const sel = el('printerSelect');
  sel.replaceChildren();
  const choosePrinter=document.createElement('option');choosePrinter.value='';choosePrinter.textContent='Select printer…';choosePrinter.disabled=true;sel.append(choosePrinter);
  if(settings.printer){const savedPrinter=document.createElement('option');savedPrinter.value=settings.printer;savedPrinter.textContent=settings.printer+' (saved)';sel.append(savedPrinter);sel.value=settings.printer;}

  if (settings.connType) el('connType').value = settings.connType;
  if (settings.ip) el('ipInput').value = settings.ip;
  if (settings.usb) el('usbInput').value = settings.usb;
  applySettings(settings);

  // Template
  await reloadTemplates(true);
  const startFile = (settings.lastTemplate && templates.some((t) => t.file === settings.lastTemplate))
    ? settings.lastTemplate
    : (templates.find((t) => /codice-fiscale/i.test(t.file))?.file || templates[0]?.file);
  if (startFile) await selectTemplate(startFile,true); else openEditor(blankTemplate());
  window.projectHomeData = () => ({ templates, lastTemplate: settings.lastTemplate, printer: el('printerSelect').value, pinnedTemplates: settings.pinnedTemplates || [], hiddenRecentTemplates: settings.hiddenRecentTemplates || [], recentFiles:(settings.recentTemplateFiles||[]).map(entry=>{const file=typeof entry==='string'?entry:entry?.file,template=templates.find(item=>item.file===file);return template?{...template,accessedAt:typeof entry==='string'?'':entry.accessedAt}:null;}).filter(Boolean) });
  window.deleteProjectTemplate = async (template) => {
    if (!template?.file) return { ok: false, error: 'Project file is missing.' };
    const result = await window.zebra.deleteTemplate(template.file);
    if (!result?.ok) return result;
    if (settings.lastTemplate === template.file) {
      settings.lastTemplate = null;
      await window.zebra.saveSettings({ lastTemplate: null });
    }
    if (settings.pages?.[template.file]) {
      delete settings.pages[template.file];
      await window.zebra.saveSettings({ pages: settings.pages });
    }
    await reloadTemplates();
    return { ok: true };
  };
  window.renameProjectTemplate = async (template, newName) => {
    const result = await window.zebra.renameTemplate(template.file, newName);
    if (!result?.ok) return result;
    if (current?.file === result.oldFile) current.file = result.file;
    if (editing && editing.name === template.name) editing.name = result.name;
    if (rawTemplate && rawTemplate.name === template.name) rawTemplate.name = result.name;
    if (settings.lastTemplate === result.oldFile) settings.lastTemplate = result.file;
    if (settings.pages?.[result.oldFile]) { settings.pages[result.file] = settings.pages[result.oldFile]; delete settings.pages[result.oldFile]; }
    settings.pinnedTemplates = (settings.pinnedTemplates || []).map(file => file === result.oldFile ? result.file : file);
    settings.hiddenRecentTemplates = (settings.hiddenRecentTemplates || []).map(file => file === result.oldFile ? result.file : file);
    settings.recentTemplateFiles=(settings.recentTemplateFiles||[]).map(entry=>typeof entry==='string'?(entry===result.oldFile?result.file:entry):entry?.file===result.oldFile?{...entry,file:result.file}:entry);
    await window.zebra.saveSettings({ lastTemplate: settings.lastTemplate, pages: settings.pages || {}, pinnedTemplates: settings.pinnedTemplates, hiddenRecentTemplates: settings.hiddenRecentTemplates, recentTemplateFiles:settings.recentTemplateFiles });
    await reloadTemplates(); window.refreshProjectHome?.(); return result;
  };
  window.duplicateProjectTemplate = async (template, name) => { const result = await window.zebra.duplicateTemplate(template.file, name); if(result?.ok){await reloadTemplates();window.refreshProjectHome?.();} return result; };
  window.revealProjectTemplate = file => window.zebra.revealTemplate(file);
  window.copyProjectPath = file => window.zebra.copyTemplatePath(file);
  window.toggleProjectPin = async file => { const pinned=new Set(settings.pinnedTemplates||[]);if(pinned.has(file))pinned.delete(file);else pinned.add(file);settings.pinnedTemplates=[...pinned];await window.zebra.saveSettings({pinnedTemplates:settings.pinnedTemplates});window.refreshProjectHome?.();return {ok:true}; };
  window.removeProjectFromRecent = async file => {const hidden=new Set(settings.hiddenRecentTemplates||[]);hidden.add(file);settings.hiddenRecentTemplates=[...hidden];await window.zebra.saveSettings({hiddenRecentTemplates:settings.hiddenRecentTemplates});window.refreshProjectHome?.();return {ok:true};};
  window.selectProjectTemplate = selectTemplate;
  window.formatProjectSize = (tpl) => formatSize(tpl.width_mm, tpl.height_mm, measureUnit(), tpl.dpi);
  window.showProjectHome?.();

  // Eventi
  el('connType').addEventListener('change', onConnTypeChange);
  el('printerSelect').addEventListener('change', async () => { settings.printer = el('printerSelect').value; await window.zebra.saveSettings({ printer: settings.printer }); updateConnSummary(); if (editing) { readEditorIntoDraft(); refreshEditorUI(); touchEditor(); } });
  el('ipInput').addEventListener('change', () => { window.zebra.saveSettings({ ip: el('ipInput').value.trim() }); updateConnSummary(); });
  el('usbInput').addEventListener('change', () => { window.zebra.saveSettings({ usb: el('usbInput').value.trim() }); updateConnSummary(); });
  void window.zebra.listPrinters().then(printers=>{
    const selected=sel.value;
    for(const name of printers||[]){let option=[...sel.options].find(item=>item.value===name);if(!option){option=document.createElement('option');option.value=name;option.textContent=name;sel.append(option);}else option.textContent=name;}
    sel.value=selected;
    updateConnSummary();
  }).catch(error=>console.warn('Printer list unavailable during startup:',error));

  el('newTemplateBtn').addEventListener('click', () => window.openNewLabelWizard());

  el('duplicateTplBtn').addEventListener('click', () => saveEditor(true));
  el('edPrintBtn').addEventListener('click', () => window.openPrintDialog());
  el('deleteTplBtn').addEventListener('click', deleteEditor);
  el('exportTplBtn').addEventListener('click', exportTemplate);
  el('shareExportBtn').addEventListener('click', () => el('shareExportDialog').showModal());
  el('shareExportCancel').addEventListener('click', () => el('shareExportDialog').close());
  el('shareExportDialog').addEventListener('click', (event) => {
    if (event.target === el('shareExportDialog')) el('shareExportDialog').close();
  });
  el('shareExportDialog').querySelectorAll('[data-share-format]').forEach((button) => {
    button.addEventListener('click', () => { void shareExport(button.dataset.shareFormat); });
  });
  el('exportPngBtn').addEventListener('click', exportPrintImage);
  el('importTplBtn').addEventListener('click', importTemplate);
  el('testConnBtn').addEventListener('click', testConnection);
  el('diagBtn').addEventListener('click', runDiagnostics);
  el('undoBtn').addEventListener('click', undo);
  el('redoBtn').addEventListener('click', redo);

  // Ricerca template
  el('tplSearch').addEventListener('input', () => { tplFilter = el('tplSearch').value; renderTemplateList(); });

  // Tema chiaro/scuro (toggle rapido)
  el('themeBtn').addEventListener('click', () => {
    const nt = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(nt); window.zebra.saveSettings({ theme: nt });
  });

  // Pannello Impostazioni
  const showSettings = (v) => { if (v) fillSettingsModal(); el('settingsModal').style.display = v ? 'flex' : 'none'; };
  el('settingsBtn').addEventListener('click', () => showSettings(true));
  el('openSettingsBtn').addEventListener('click', () => showSettings(true));
  el('settingsClose').addEventListener('click', () => showSettings(false));
  el('settingsModal').addEventListener('click', (e) => { if (e.target === el('settingsModal')) showSettings(false); });
  ['setTheme', 'setCopies', 'setDarkness', 'setSpeed', 'setVerticalOffset', 'setGrid', 'setSnap', 'setStep', 'setUnit']
    .forEach((id) => { if (el(id)) el(id).addEventListener('change', commitSettings); });
  autoSavePolicy.bindCheckbox(el('setAutoSave'),()=>editorDirty,error=>setEditorStatus('err',`Could not save Auto Save setting: ${error.message||error}`),(enabled)=>window.setAutoSaveEnabled(enabled));

  // Generale: apri cartella, ripristina, versione
  el('openFolderBtn').addEventListener('click', () => window.zebra.openTemplatesFolder());
  el('resetSettingsBtn').addEventListener('click', async () => {
    if (!confirm(t('dyn.confirmReset'))) return;
    await window.zebra.resetSettings();
    location.reload();
  });
  const applyDisplayVersion=v=>{if(!v)return;window.VersionDisplay?.apply(v,window,document);document.title='Q LABEL v'+String(v).replace(/^v/i,'');};
  window.zebra.appVersion().then(v=>{
    // Show the IPC version immediately; refresh it from package metadata when available.
    applyDisplayVersion(v);
    window.refreshProjectHome?.();
    fetch(new URL('../package.json',location.href),{cache:'no-store'}).then(response=>response.ok?response.json():null).then(metadata=>{if(metadata?.displayVersion)applyDisplayVersion(metadata.displayVersion);}).catch(()=>{});
  }).catch(()=>{
    fetch(new URL('../package.json',location.href),{cache:'no-store'}).then(response=>response.ok?response.json():null).then(metadata=>{if(metadata?.displayVersion)applyDisplayVersion(metadata.displayVersion);}).catch(()=>{});
  });

  // Esc chiude le finestre
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.key === 'Escape') {
      const modalWasOpen=[el('settingsModal'),el('helpModal')].some(node=>node&&getComputedStyle(node).display!=='none');
      el('settingsModal').style.display = 'none'; el('helpModal').style.display = 'none';
      if(modalWasOpen||e.defaultPrevented||document.querySelector('dialog[open],.tis-picker-backdrop'))return;
      if(e.target?.closest?.('input,textarea,select,[contenteditable="true"],[role="textbox"]'))return;
      if(editing&&(editorSelection.size||Number.isInteger(editorSel)&&editorSel>=0)){
        e.preventDefault();
        editorSel=null;
        editorSelection.clear();
        renderEditorElements();
        drawEditorCanvas();
      }
    }
  });

  // Legenda scorciatoie
  const showHelp = (v) => { el('helpModal').style.display = v ? 'flex' : 'none'; };
  el('helpBtn').addEventListener('click', () => showHelp(true));
  el('helpClose').addEventListener('click', () => showHelp(false));
  el('helpModal').addEventListener('click', (e) => { if (e.target === el('helpModal')) showHelp(false); });

  // Storico stampe
  history = Array.isArray(settings.history) ? settings.history : [];
  renderHistory();

  // App and editor shortcuts. Native text editing shortcuts (Ctrl/Cmd+A/C/X/V)
  // are left to Chromium whenever a text field is focused.
  // Keep editor shortcuts on the capture phase so canvas/SVG controls and
  // ribbon buttons cannot swallow them. Text fields retain their native
  // Ctrl/Cmd+Z and Ctrl/Cmd+X editing behavior.
  const shortcutKey=event=>{const code=String(event.code||'');return /^Key[A-Z]$/.test(code)?code.slice(3).toLowerCase():String(event.key||'').toLowerCase();};
  document.addEventListener('keydown', (e) => {
    const mod=e.ctrlKey||e.metaKey, key=shortcutKey(e);
    const inEditor=!!editing;
    const editable=!!e.target?.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]');
    if(mod&&e.shiftKey&&key==='s'&&inEditor){e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;Promise.resolve(window.saveLabelAs()).catch(error=>window.alert(error.message||String(error)));return;}
    if(!mod||!inEditor||editable)return;
    if(key==='z'){e.preventDefault();e.stopImmediatePropagation();if(e.shiftKey)redo();else undo();}
    else if(key==='y'){e.preventDefault();e.stopImmediatePropagation();redo();}
    else if(key==='x'){e.preventDefault();e.stopImmediatePropagation();copySelectedElement(true);}
    else if(key==='c'){if(copySelectedElement(false)){e.preventDefault();e.stopImmediatePropagation();}}
    else if(key==='g'&&editorSelection.size>1){e.preventDefault();e.stopImmediatePropagation();groupSelectedElements();}
    else if(key==='v'&&elementClipboard){e.preventDefault();e.stopImmediatePropagation();pasteElement();}
    else if(key==='a'){e.preventDefault();e.stopImmediatePropagation();selectAllEditorElements();}
    else if(key==='d'){e.preventDefault();e.stopImmediatePropagation();duplicateSelectedElement();}
  }, true);
  document.addEventListener('keydown', async (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const inEditor = !!editing;
    const target = e.target;
    const textEntry = !!(target && target.closest && target.closest('input, textarea, [contenteditable="true"]'));
    const k = String(e.key || e.code || '').toLowerCase().replace(/^key/,'');

    if(!mod&&!e.altKey&&inEditor&&!textEntry&&editorSelection.size===1&&editing.elements[editorSel]?.type==='text'&&(e.key==='Backspace'||e.key.length===1)){
      e.preventDefault();focusTextProperty(editorSel,true,e.key==='Backspace'?'':e.key);return;
    }
    if (!mod && inEditor && !textEntry && (editorSelection.size || editorSel >= 0) && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault(); deleteSelectedElement(); return;
    }
    if (e.key === 'F12') {
      e.preventDefault(); if (inEditor) await saveEditor(true); return;
    }
    if (!mod) return;

    if (k === 'w') { e.preventDefault(); if (inEditor) await persistEditor(); window.close(); }
    else if (k === 'n') { e.preventDefault(); el('newTemplateBtn').click(); }
    else if (k === 'o') { e.preventDefault(); el('importTplBtn').click(); }
    else if (k === 'p') { e.preventDefault(); if(!e.repeat)window.openPrintDialog(); }
    else if (k === 's') { e.preventDefault(); if (inEditor) await window.saveLabelNow(); }
    else if (k === 'f') { e.preventDefault(); el('tplSearch').focus(); el('tplSearch').select(); }
    else if (k === 'h') { if (inEditor && !textEntry) { e.preventDefault(); replaceTemplateText(); } }
    else if (k === 'z' && e.shiftKey && inEditor && !textEntry) { e.preventDefault(); e.stopPropagation(); redo(); }
    else if (k === 'z' && inEditor && !textEntry) { e.preventDefault(); e.stopPropagation(); undo(); }
    else if (k === 'y' && inEditor && !textEntry) { e.preventDefault(); redo(); }
    else if (k === 'd' && inEditor && !textEntry) { e.preventDefault(); duplicateSelectedElement(); }
    else if (k === 'c' && inEditor && !textEntry) { if (copySelectedElement(false)) e.preventDefault(); }
    else if (k === 'x' && inEditor && !textEntry) { if (copySelectedElement(true)) { e.preventDefault(); e.stopPropagation(); } }
    else if (k === 'v' && inEditor && !textEntry && elementClipboard) { e.preventDefault();e.stopPropagation();pasteElement(); }
  });
  window.zebra.onPrintShortcut?.(() => {
    // The Home screen has no active document; Ctrl+P is only for an open label.
    if(!editing||document.getElementById('projectHome')?.hidden===false||document.getElementById('printDialog')?.open)return;
    window.openPrintDialog?.();
  });
  el('addFieldMetaBtn').addEventListener('click', () => addFieldMetaRow('', { type: 'select', options: [] }));

  // Controlli griglia / snap dell'anteprima interattiva
  el('chkGrid').addEventListener('change', () => { editorGrid.show = el('chkGrid').checked; window.zebra.saveSettings({ gridShow: editorGrid.show }); drawEditorCanvas(); });
  el('chkSnap').addEventListener('change', () => { editorGrid.snap = el('chkSnap').checked; window.zebra.saveSettings({ gridSnap: editorGrid.snap }); drawEditorCanvas(); });
  el('gridStep').addEventListener('change', () => { editorGrid.step = Number(el('gridStep').value)||.5; window.zebra.saveSettings({ gridStep: editorGrid.step }); drawEditorCanvas(); });

  // Proprietà editor → anteprima live
  el('edName').addEventListener('input', () => { if (el('edTitle')) el('edTitle').textContent = t('dyn.editTitle', { n: (el('edName').value || '—') }); });
  ['edName', 'edDesc', 'edW', 'edH', 'edDpi', 'edTear', 'stockName', 'stockType', 'stockLeft', 'stockRight'].forEach((id) =>
    el(id).addEventListener('input', debounce(() => { readEditorIntoDraft(); touchEditor(); updateEditorPreview(); })));
  ['pageEnabled', 'pageW', 'pageH', 'pageRows', 'pageCols', 'pageTop', 'pageBottom', 'pageLeft', 'pageRight', 'pageGapX', 'pageGapY', 'pageTemplateManual']
    .forEach((id) => el(id).addEventListener('input', () => {if(!editing)return;if(el(id).type==='number'&&(el(id).value===''||!el(id).checkValidity()))return;if((id==='pageRows'||id==='pageCols')&&Number(el(id).value)>1)el('pageEnabled').checked=true;if(readPageSetup()===false){if((id==='pageRows'||id==='pageCols')&&commitLayoutCountsWithUsableGaps()){touchEditor();updateEditorPreview();}return;}touchEditor();updateEditorPreview();}));
  el('pagePreset').addEventListener('click', () => {
    readEditorIntoDraft();
    editing.width_mm = 2.36 * 25.4;
    editing.height_mm = 2.36 * 25.4;
    editing.page = { ...(editing.page || {}), enabled: true, unit: settings.unit || 'mm', manual_template: false,
      width_mm: 2.5 * 25.4, height_mm: 2.5 * 25.4, rows: 1, columns: 1,
      top_mm: 0.07 * 25.4, bottom_mm: 0.07 * 25.4, left_mm: 0.07 * 25.4, right_mm: 0.07 * 25.4,
      gap_x_mm: 0, gap_y_mm: 0 };
    refreshEditorUI(); touchEditor(); updateEditorPreview();
  });
  el('pageFit').addEventListener('click', () => {
    readEditorIntoDraft(); const p = editing.page;
    const w = (p.width_mm - p.left_mm - p.right_mm - (p.columns - 1) * p.gap_x_mm) / p.columns;
    const h = (p.height_mm - p.top_mm - p.bottom_mm - (p.rows - 1) * p.gap_y_mm) / p.rows;
    if (w <= 0 || h <= 0) return;
    pushSnapshot(); editing.width_mm = w; editing.height_mm = h; editing.page.manual_template = false;
    refreshEditorUI(); touchEditor(); updateEditorPreview();
  });
  el('copies').addEventListener('input', rememberPrintPageSoon);

  if(el('addImageBtn'))el('addImageBtn').onclick = () => { pendingImageDropMm=null;pendingImageFormat='image';el('imageFile').accept='image/png,image/jpeg,image/svg+xml,.svg';el('imageFile').click(); };
  el('imageFile').onchange = async () => {
    const file = el('imageFile').files[0];
    if (!file || !editing) return;
    try {
      const isSvgFile=pendingImageFormat==='svg'||file.type==='image/svg+xml'||/\.svg$/i.test(file.name||'');
      const svgText=isSvgFile?await file.text():'';
      const url = URL.createObjectURL(file);
      const image = new Image();
      try { image.src = url; await image.decode(); } finally { URL.revokeObjectURL(url); }
      const scale = isSvgFile?1024/Math.max(image.naturalWidth,image.naturalHeight):Math.min(1,1024/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const stride = Math.ceil(canvas.width / 8), bytes = new Uint8Array(stride * canvas.height);
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        const p = (y * canvas.width + x) * 4;
        const black = pixels.data[p] * .299 + pixels.data[p + 1] * .587 + pixels.data[p + 2] * .114 < 128;
        if (black) bytes[y * stride + (x >> 3)] |= 128 >> (x & 7);
      }
      readEditorIntoDraft(); pushSnapshot();
      const width = Math.min(30, editing.width_mm), height = Math.min(editing.height_mm, width * canvas.height / canvas.width);
      const imageElement = { type: 'image', label: file.name, transparent_background:true,text_background:'none', ...(isSvgFile?{source_format:'svg',svg_data:svgText}:{}), x_mm: 0, y_mm: 0,
        width_mm: height * canvas.width / canvas.height, height_mm: height,
        bitmap_width: canvas.width, bitmap_height: canvas.height,
        bitmap_hex: Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase() };
      const replaceIndex=pendingImageReplaceIndex,replaceTarget=isReplaceablePicture(editing.elements?.[replaceIndex])?editing.elements[replaceIndex]:null;
      pendingImageReplaceIndex=null;
      if(replaceTarget){
        const oldW=Number(replaceTarget.width_mm)||imageElement.width_mm,oldH=Number(replaceTarget.height_mm)||imageElement.height_mm,oldRatio=oldW/oldH,nextRatio=imageElement.width_mm/imageElement.height_mm;
        let nextW=oldW,nextH=oldH;
        if(Number.isFinite(oldRatio)&&oldRatio>0&&Number.isFinite(nextRatio)&&nextRatio>0){if(nextRatio>oldRatio)nextH=nextW/nextRatio;else nextW=nextH*nextRatio;}
        Object.assign(replaceTarget,{label:imageElement.label,transparent_background:true,text_background:'none',width_mm:nextW,height_mm:nextH,bitmap_width:imageElement.bitmap_width,bitmap_height:imageElement.bitmap_height,bitmap_hex:imageElement.bitmap_hex});
        delete replaceTarget.placeholder;
        if(isSvgFile){replaceTarget.source_format='svg';replaceTarget.svg_data=svgText;}else{delete replaceTarget.source_format;delete replaceTarget.svg_data;}
        noteRecentObjectUsage(replaceTarget);
        editorSel=replaceIndex;editorSelection=new Set([replaceIndex]);
      }else{
        if(pendingImageDropMm){const margin=editing.margin_mm||{};imageElement.x_mm=snapVal(pendingImageDropMm.x-(Number(margin.left)||0)-imageElement.width_mm/2);imageElement.y_mm=snapVal(pendingImageDropMm.y-(Number(margin.top)||0)-imageElement.height_mm/2);pendingImageDropMm=null;}
        else placeNewElementAtBottom(imageElement);
        editing.elements.push(imageElement);noteRecentObjectUsage(imageElement);
        editorSel = editing.elements.length - 1;
        editorSelection = new Set([editorSel]);
      }
      renderEditorElements(); updateEditorPreview(); touchEditor();
    } catch (error) { setEditorStatus('err', 'Cannot import image: ' + error.message); }
    finally { el('imageFile').value = '';pendingImageFormat='image';pendingImageReplaceIndex=null;el('imageFile').accept='image/png,image/jpeg,image/svg+xml,.svg'; }
  };
  el('backgroundBtn').onclick = () => el('backgroundFile').click();
  el('clearBackgroundBtn').onclick = () => { if (editing) { pushSnapshot();delete editing.background; editing.print_background = false;refreshEditorUI();drawEditorCanvas();touchEditor(); } };
  el('printBackground').onchange = () => { readEditorIntoDraft(); touchEditor(); drawEditorCanvas(); };
  el('backgroundOpacity').oninput = () => { if (editing?.background) { editing.background.opacity = Number(el('backgroundOpacity').value) / 100; drawEditorCanvas(); touchEditor(); } };
  el('backgroundFile').onchange = async () => {
    const file = el('backgroundFile').files[0]; if (!file || !editing) return;
    try {
      const url = URL.createObjectURL(file), image = new Image();
      try { image.src = url; await image.decode(); } finally { URL.revokeObjectURL(url); }
      const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(image.naturalWidth * scale)); c.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height); ctx.drawImage(image,0,0,c.width,c.height);
      const pixels=ctx.getImageData(0,0,c.width,c.height), stride=Math.ceil(c.width/8), bytes=new Uint8Array(stride*c.height);
      for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++){const p=(y*c.width+x)*4;if(pixels.data[p]*.299+pixels.data[p+1]*.587+pixels.data[p+2]*.114<128)bytes[y*stride+(x>>3)]|=128>>(x&7);}
      pushSnapshot(); editing.background={bitmap_width:c.width,bitmap_height:c.height,bitmap_hex:Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase(),opacity:Number(el('backgroundOpacity').value)/100};
      refreshEditorUI(); drawEditorCanvas(); touchEditor();
    } catch(error){setEditorStatus('err','Cannot import background: '+error.message);} finally {el('backgroundFile').value='';}
  };
  document.querySelectorAll('[data-add]').forEach(btn=>{if(!btn.closest('#recentObjectTools'))btn.addEventListener('click',()=>{noteRecentObjectTool(btn.dataset.add);insertEditorElement(btn.dataset.add);});});
  el('addSidebarField').addEventListener('click',()=>{
    window.DataSourcesUI.open('Embedded Data');
  });
  const insertPane=el('insertSidebar'),frame=el('previewFrame');
  insertPane.addEventListener('click',event=>{const source=event.target.closest('#recentObjectTools [data-add]');if(!source)return;event.preventDefault();window.useObjectTool(source.dataset.add);});
  document.addEventListener('dragstart',event=>{
    const catalogPayload=event.dataTransfer.getData('application/x-bratender-insert');
    if(catalogPayload){try{const payload=JSON.parse(catalogPayload);if(payload.kind==='catalog-barcode'||payload.kind==='recent-object'){activeInsertPayload=payload;return;}}catch{}}
    const source=event.target.closest('[data-insert-tool],.tis-symbol-card,.shape-preset-choice,#insertSidebar [data-add],#insertSidebar #addImageBtn,#insertSidebar .source-item');if(!source)return;
    let payload;
    if(source.matches('.tis-symbol-card'))payload={kind:'tis-symbol',value:Number(source.dataset.tisSymbolIndex)};
    else if(source.matches('.shape-preset-choice'))payload={kind:'shape-preset',value:source.dataset.shapePreset};
    else if(source.matches('.source-item'))payload=source.dataset.sourceField?{kind:'field',value:source.dataset.sourceField}:{kind:'object-value',value:source.dataset.sourceText||''};
    else {payload={kind:'tool',value:source.dataset.insertTool||(source.id==='addImageBtn'?'image':source.dataset.add)};}
    activeInsertPayload=payload;event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData('application/x-bratender-insert',JSON.stringify(payload));
    if(payload.kind==='tool'&&payload.value==='image')event.dataTransfer.setData('text/plain','image');
  });
  document.addEventListener('dragend',()=>{activeInsertPayload=null;frame.classList.remove('insert-drop-active');});
  frame.addEventListener('dragover',event=>{if(!activeInsertPayload)return;event.preventDefault();event.dataTransfer.dropEffect='copy';frame.classList.add('insert-drop-active');});
  frame.addEventListener('dragleave',event=>{if(!frame.contains(event.relatedTarget))frame.classList.remove('insert-drop-active');});
  frame.addEventListener('drop',event=>{
    if(!activeInsertPayload)return;event.preventDefault();frame.classList.remove('insert-drop-active');
    let payload=activeInsertPayload;try{payload=JSON.parse(event.dataTransfer.getData('application/x-bratender-insert'))||payload;}catch{}
    activeInsertPayload=null;
    if(payload.kind==='field'&&window.TableTools?.dropFieldAt?.(event,payload))return;
    const svg=frame.querySelector('.canvaswrap > svg'),rect=svg?.getBoundingClientRect();
    if(!rect||event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)return;
    const point=clientToMm(event,liveOverlay());if(!point)return;
    if(payload.kind==='recent-object'){readEditorIntoDraft();pushSnapshot();const item=JSON.parse(JSON.stringify(payload.value)),box=window.LabelPreview.computeBoxes({...editing,elements:[item]},sampleData(editing))[0],margin=editing.margin_mm||{};item.x_mm=snapVal(point.x-(Number(margin.left)||0)-(Number(box?.w)||Number(item.width_mm)||0)/2);item.y_mm=snapVal(point.y-(Number(margin.top)||0)-(Number(box?.h)||Number(item.height_mm)||0)/2);editing.elements.push(item);editorSel=editing.elements.length-1;editorSelection=new Set([editorSel]);noteRecentObjectUsage(item);renderEditorElements();drawEditorCanvas();touchEditor();return;}
    if(payload.kind==='catalog-barcode'){void window.insertCatalogBarcodeAt?.(payload.value,point);return;}
    if(payload.kind==='shape-preset'){window.insertShapeAt?.(payload.value,point);return;}
    if(payload.kind==='tool')noteRecentObjectTool(payload.value);
    if(payload.kind==='tool'&&payload.value==='image'){insertPicturePlaceholderAt(point);return;}
    if(payload.kind==='tool'&&payload.value==='svg'){pendingImageDropMm=point;pendingImageFormat=payload.value;el('imageFile').accept='image/svg+xml,.svg';el('imageFile').click();return;}
    if(payload.kind==='tis-symbol'){window.insertTisSymbolAt?.(payload.value,point);return;}
    const sourceText=payload.kind==='field'?`{{${payload.value}}}`:payload.kind==='object-value'?payload.value:null;
    const hit=event.target.closest('.hit[data-hit]'),targetIndex=hit?Number(hit.dataset.hit):-1,target=editing?.elements?.[targetIndex];
    if(sourceText!==null&&target&&['text','barcode128','code39','code93','ean13','qrcode','datamatrix'].includes(target.type)){
      try{const candidate={...editing,elements:editing.elements.map((element,index)=>index===targetIndex?{...element,text:sourceText}:element)};window.DataSourceEngine?.resolve(candidate,{}, {globals:settings.dataSourceGlobals});}catch(error){setEditorStatus('err',error.message);return;}
      readEditorIntoDraft();pushSnapshot();const bound=editing.elements[targetIndex];bound.text=sourceText;
      if(payload.kind==='field'){editing.values=editing.values||{};editing.values[payload.value]??='';}
      editorSel=targetIndex;editorSelection=new Set([targetIndex]);renderEditorElements();renderEditorValues();updateEditorPreview();touchEditor();return;
    }
    if(payload.kind==='field'){
      editing.values=editing.values||{};editing.values[payload.value]??='';
      insertEditorElement('text',point,sourceText);return;
    }
    if(payload.kind==='object-value'){insertEditorElement('text',point,sourceText);return;}
    if(payload.kind==='tool')insertEditorElement(payload.value,point);
  });

  onConnTypeChange();
  updateConnSummary();
}

setPreviewLoading(true);
function initializeApplication(){init().then(()=>{appInitializing=false;setPreviewLoading(false);document.getElementById("startupHomeSkeleton")?.remove();window.dispatchEvent(new Event('application-ready'));}).catch(error=>{
  appInitializing=false;
  setPreviewLoading(false);
  document.getElementById("startupHomeSkeleton")?.remove();
  console.error('Application startup failed:',error);
  window.StartupErrorUI.show(error,document);
});}
// All workspace scripts must finish building and moving controls before init
// reads them or opens Project Home. IPC responses can arrive before parsing ends.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeApplication,{once:true});else initializeApplication();


window.confirmAction=({title='Confirm',message='',confirmLabel='OK'}={})=>new Promise(resolve=>{
 const previousFocus=document.activeElement,dialog=document.createElement('dialog');dialog.className='modern-confirm-dialog';dialog.style.cssText='width:min(480px,calc(100vw - 36px));box-sizing:border-box;padding:0;border:1px solid var(--border,#d6dbe2);border-radius:12px;background:var(--card,#fff);color:var(--text,#344054);font:13px Segoe UI,sans-serif;box-shadow:0 16px 48px #0f172a33';
 dialog.innerHTML='<div style="display:flex;gap:15px;padding:24px 24px 20px"><span aria-hidden="true" style="display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;border-radius:50%;background:#fff7e6;color:#d97706;font-size:24px;font-weight:700">!</span><div><h2 style="margin:0 0 8px;font-size:18px"></h2><p style="margin:0;line-height:1.5;overflow-wrap:anywhere"></p></div></div><footer style="display:flex;justify-content:flex-end;gap:9px;padding:14px 20px;border-top:1px solid var(--border,#e4e7ec)"><button type="button" data-cancel style="padding:8px 14px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--card,#fff);color:inherit;cursor:pointer">Cancel</button><button type="button" data-confirm style="padding:8px 14px;border:1px solid var(--accent,#16a34a);border-radius:7px;background:var(--accent,#16a34a);color:#fff;font-weight:600;cursor:pointer"></button></footer>';
 dialog.querySelector('h2').textContent=title;dialog.querySelector('p').textContent=message;dialog.querySelector('[data-confirm]').textContent=confirmLabel;const finish=value=>{dialog.close();dialog.remove();previousFocus?.focus?.({preventScroll:true});resolve(value);};dialog.querySelector('[data-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-confirm]').onclick=()=>finish(true);dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-cancel]').focus();
});
