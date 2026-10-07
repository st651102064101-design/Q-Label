'use strict';

const el = (id) => document.getElementById(id);
const t = (k, v) => window.I18N.t(k, v);
const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function humanize(name) { const s = String(name).replace(/[_\-.]/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }

let templates = [];        // riepiloghi
let current = null;        // riepilogo selezionato
let rawTemplate = null;    // JSON completo del template selezionato (per anteprima/stampa)
let editing = null;        // bozza in modifica (editor)
let scanFieldName = null;
let settings = {};
let editorSel = null;      // indice elemento selezionato nell'editor
let editorSelection = new Set(); // multi-selection indices in the editor canvas
let elementClipboard = null;
let pendingImageDropMm = null;
let activeInsertPayload = null;
let editorGrid = { show: true, snap: true, step: 0.5 };
let importedRows = null;   // righe importate da CSV (stampa in blocco)
const qrCache = {};        // valore QR -> { size, data } (matrice reale)
let tplFilter = '';        // filtro ricerca template
let history = [];          // storico stampe
let undoStack = [];        // editor: stati precedenti
let redoStack = [];        // editor: stati rifatti
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
  return `${mmToUnit(wMm, u, dpi)}×${mmToUnit(hMm, u, dpi)} ${unitSuffix(u)}`;
}
function updateMeasureLabels() {
  const u = unitSuffix();
  const w = document.querySelector('[data-i18n="ed.width"]');
  const h = document.querySelector('[data-i18n="ed.height"]');
  if (w) w.textContent = t('ed.width') + ' (' + u + ')';
  if (h) h.textContent = t('ed.height') + ' (' + u + ')';
  const step = unitMeta(measureUnit()).step;
  if (el('edW')) el('edW').step = String(step);
  if (el('edH')) el('edH').step = String(step);
}

function fillPh(str, data) {
  if (typeof str !== 'string') return '';
  return str.replace(/\{\{\s*([\w.\-]+)\s*\}\}/g, (_, k) => { const v = (data || {})[k]; return v == null ? '' : String(v); });
}
function qrValuesOf(tpl, data) {
  const vals = [];
  (tpl.elements || []).forEach((e) => { if (e.type === 'qrcode') { const v = fillPh(e.text, data); if (v) vals.push(v); } });
  return vals;
}
function dmValuesOf(tpl, data) {
  const vals = [];
  (tpl.elements || []).forEach((e) => { if (e.type === 'datamatrix') { const v = fillPh(e.text, data); if (v) vals.push(v); } });
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
    if (typeof e.text !== 'string') continue;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(e.text))) {
      if (!seen.has(m[1])) { seen.add(m[1]); found.push(m[1]); }
    }
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
  el('setVerticalOffset').value = settings.printerVerticalOffsets?.[key] ?? 1.2;
  el('setTheme').value = document.body.classList.contains('dark') ? 'dark' : 'light';
  el('setCopies').value = defaultCopies || 1;
  el('setDarkness').value = printDarkness === '' ? '' : printDarkness;
  el('setSpeed').value = printSpeed === '' ? '' : printSpeed;
  el('setGrid').checked = editorGrid.show;
  el('setSnap').checked = editorGrid.snap;
  el('setStep').value = String(editorGrid.step);
  if (el('setUnit')) el('setUnit').value = (settings && settings.unit) || 'mm';
}

// Legge il pannello, aggiorna variabili + controlli e salva.
function commitSettings() {
  const connection = getConnection();
  const key = connection.printer || `${connection.type}:${connection.ip || connection.usb || ''}`;
  settings.printerVerticalOffsets = settings.printerVerticalOffsets || {};
  settings.printerVerticalOffsets[key] = Math.max(-5, Math.min(5, Number(el('setVerticalOffset').value) || 0));
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
  const job = getPreviewJob();
  if (!job) return;
  const say = (kind, msg) => {
    if (job.editor) setEditorStatus(kind, msg);
    else setStatus(kind, msg);
  };
  let dataUrl = null;
  try {
    const r = await window.zebra.renderLabelPng({
      template: job.template,
      connection: getConnection(),
      data: job.data,
      enabledIndices: job.enabledIndices,
      darkness: printDarkness,
      speed: printSpeed,
    });
    if (r && r.ok) dataUrl = r.dataUrl;
  } catch (_) { /* fallback locale */ }
  if (!dataUrl) {
    const c = window.LabelPreview.rasterizeCanvas(job.template, job.data, job.enabledIndices, qrCache);
    dataUrl = c.toDataURL('image/png');
  }
  const name = (job.template.name || current?.name || 'label') + '.png';
  const saved = await window.zebra.savePng({ defaultName: name, dataUrl });
  if (saved && saved.canceled) return;
  if (saved && saved.path) say('ok', t('dyn.pngSaved', { p: saved.path }));
  else say('err', t('dyn.pngFail', { e: saved?.error || '?' }));
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

async function importTemplate() {
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
      if (res && res.ok) { setStatus('ok', t('dyn.sentCsv', { n: res.count })); recordHistory(payload, res.count); }
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
      recordHistory(payload, res.count);
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
function recordHistory(payload, count) {
  const p = { ...payload };
  if (Array.isArray(p.rows) && p.rows.length > 500) p.rows = p.rows.slice(0, 500);
  history.unshift({ ts: Date.now(), templateName: current ? current.name : payload.file, count, payload: p });
  history = history.slice(0, 15);
  window.zebra.saveSettings({ history });
  renderHistory();
}
function renderHistory() {
  const box = el('historyBox'), listEl = el('historyList');
  if (!history.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  listEl.innerHTML = '';
  history.forEach((h, i) => {
    const d = new Date(h.ts);
    const when = d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const item = document.createElement('div'); item.className = 'hist-item';
    item.innerHTML = `<div class="meta"><b>${h.templateName}</b> — ${h.count} ${t('dyn.labels')}<br><small>${when}</small></div>`;
    const btn = document.createElement('button'); btn.className = 'ghost'; btn.textContent = t('dyn.reprint');
    btn.onclick = () => reprint(i);
    item.appendChild(btn);
    listEl.appendChild(item);
  });
}
async function reprint(i) {
  const h = history[i]; if (!h) return;
  setStatus('info', t('dyn.sending', { n: h.count || '' }));
  const res = await window.zebra.print(h.payload);
  if (res && res.ok) setStatus('ok', t('dyn.reprinted', { n: res.count }));
  else setStatus('err', t('dyn.printErr', { e: res?.error || '?' }));
}

async function selectTemplate(file) {
  setPreviewLoading(true);
  try {
    if (current && current.file !== file && current.editable) { await persistEditor(); }
    if (current && current.file !== file) rememberPrintPage();
    current = templates.find((t) => t.file === file);
    if (!current) return;
    importedRows = null; csvRaw = null;
    rawTemplate = window.PrintGeometry.normalizeTemplate(await window.zebra.loadTemplateRaw(file), getConnection());
    seedTemplateValues(rawTemplate, file);

    renderTemplateList();
    el('copies').value = defaultCopies || 1;
    applyPrintPage(file);
    window.zebra.saveSettings({ lastTemplate: file });
    // Keep a skeleton over the old preview while the selected label is rendered.
    if (el('editorView').style.display !== 'none') { editing = null; openEditor(rawTemplate); }
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
function refreshPageSetup() {
  const p=editing.page || {}; el('pageEnabled').checked=!!p.enabled; const pageUnit=(settings&&settings.unit)||'mm';
  el('pageTemplateManual').checked=p.manual_template !== false;
  for(const [id,key] of Object.entries(pageFields)) el(id).value=mmToUnit(p[key] ?? (key==='width_mm'?editing.width_mm:key==='height_mm'?editing.height_mm:0), pageUnit, editing.dpi);
  el('pageRows').value=p.rows || 1; el('pageCols').value=p.columns || 1;
}
function readPageSetup() {
  const unit=(settings&&settings.unit)||'mm';
  const p={...editing.page,enabled:el('pageEnabled').checked,unit,manual_template:el('pageTemplateManual').checked,rows:Math.max(1,Math.min(100,Math.floor(Number(el('pageRows').value)||1))),columns:Math.max(1,Math.min(100,Math.floor(Number(el('pageCols').value)||1)))};
  for(const [id,key] of Object.entries(pageFields)) p[key]=Math.max(0,unitToMm(el(id).value,unit,editing.dpi));
  editing.page=p;
  if(!p.manual_template){
    const w=(p.width_mm-p.left_mm-p.right_mm-(p.columns-1)*p.gap_x_mm)/p.columns;
    const h=(p.height_mm-p.top_mm-p.bottom_mm-(p.rows-1)*p.gap_y_mm)/p.rows;
    if(w>0&&h>0){editing.width_mm=w;editing.height_mm=h;el('edW').value=mmToUnit(w,unit,editing.dpi);el('edH').value=mmToUnit(h,unit,editing.dpi);}
  }
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
  el('stockLeft').value = editing.stock?.liner_left_mm ?? 1.27;
  el('stockRight').value = editing.stock?.liner_right_mm ?? 1.27;
  editing.language = 'zpl';
  updateMeasureLabels();
  renderEditorElements();   renderFieldMeta();
  lastValueNames = '';
  renderEditorValues();
  updateEditorPreview();
}
function openEditor(raw) {
  editing = JSON.parse(JSON.stringify(raw));
  factoryEdited = false;
  const page = editing.page || {};
  const near = (a, b) => Math.abs(Number(a) - b) < 0.02;
  // Repair the known inches conversion regression from v0.09/v0.10 on the
  // user's 2.5-inch page: 0.07 in margins were persisted as 0.7 in.
  if (editing.name === 'nuovo-modello' && near(editing.width_mm, 63.5) && near(editing.height_mm, 63.5) &&
      near(page.width_mm, 63.5) && near(page.height_mm, 63.5) &&
      ['top_mm', 'bottom_mm', 'left_mm', 'right_mm'].every((key) => near(page[key], 17.78))) {
    editing.width_mm = editing.height_mm = 2.36 * 25.4;
    editing.page = { ...page, enabled: true, unit: 'in', manual_template: true,
      top_mm: 0.07 * 25.4, bottom_mm: 0.07 * 25.4, left_mm: 0.07 * 25.4, right_mm: 0.07 * 25.4,
      gap_x_mm: 0, gap_y_mm: 0 };
    editing.margin_mm = { top: 0, bottom: 0, left: 0, right: 0 };
    editing.__layoutMigratedV012 = true;
  }
  const migratedLayout = editing.__layoutMigratedV012 === true;
  delete editing.__layoutMigratedV012;
  seedTemplateValues(editing, current && current.file);
  editorSel = null; editorSelection.clear(); undoStack = []; redoStack = [];
  el('edName').value = (current && current.file ? current.file.replace('.json', '') : editing.name) || 'nuovo-modello';
  if (el('edTitle')) el('edTitle').textContent = current ? t('dyn.editTitle', { n: (current.name || el('edName').value) }) : t('dyn.newTitle');
  refreshEditorUI();
  if (migratedLayout) touchEditor();
  updateUndoButtons();
  setMode('editor');
}

// --- Undo / Redo dell'editor (snapshot su operazioni strutturali) ---
function pushSnapshot() {
  if (!editing) return;
  undoStack.push(JSON.stringify(editing));
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(editing));
  editing = JSON.parse(undoStack.pop());
  editorSel = null; editorSelection.clear(); refreshEditorUI(); updateUndoButtons();
  touchEditor();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(editing));
  editing = JSON.parse(redoStack.pop());
  editorSel = null; editorSelection.clear(); refreshEditorUI(); updateUndoButtons();
  touchEditor();
}

function duplicateSelectedElement() {
  if (!editing || editorSel == null || !editing.elements?.[editorSel]) return false;
  readEditorIntoDraft();
  const source = editing.elements[editorSel];
  pushSnapshot();
  const copy = JSON.parse(JSON.stringify(source));
  copy.x_mm = (Number(copy.x_mm) || 0) + 1;
  copy.y_mm = (Number(copy.y_mm) || 0) + 1;
  editing.elements.splice(editorSel + 1, 0, copy);
  editorSel += 1;
  editorSelection = new Set([editorSel]);
  refreshEditorUI();
  updateUndoButtons();
  touchEditor();
  return true;
}

function copySelectedElement(cut = false) {
  if (!editing || editorSel == null || !editing.elements?.[editorSel]) return false;
  readEditorIntoDraft();
  elementClipboard = JSON.parse(JSON.stringify(editing.elements[editorSel]));
  if (cut) {
    pushSnapshot();
    editing.elements.splice(editorSel, 1);
    editorSel = null;
    editorSelection.clear();
    refreshEditorUI();
    updateUndoButtons();
    touchEditor();
  }
  return true;
}

function pasteElement() {
  if (!editing || !elementClipboard) return false;
  readEditorIntoDraft();
  pushSnapshot();
  const copy = JSON.parse(JSON.stringify(elementClipboard));
  copy.x_mm = (Number(copy.x_mm) || 0) + 1;
  copy.y_mm = (Number(copy.y_mm) || 0) + 1;
  editing.elements = editing.elements || [];
  editing.elements.push(copy);
  editorSel = editing.elements.length - 1;
  editorSelection = new Set([editorSel]);
  refreshEditorUI();
  updateUndoButtons();
  touchEditor();
  return true;
}

function deleteSelectedElement() {
  if (!editing || editorSel == null || !editing.elements?.[editorSel]) return false;
  readEditorIntoDraft();
  pushSnapshot();
  editing.elements.splice(editorSel, 1);
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
  const u = el('undoBtn'), r = el('redoBtn');
  if (u) u.disabled = undoStack.length === 0;
  if (r) r.disabled = redoStack.length === 0;
}

// Etichette come chiavi i18n (risolte con t() al render).
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
  if (!editing || !editorSelection.size) return;
  readEditorIntoDraft();
  const boxes = window.LabelPreview.computeBoxes(editing, sampleData(editing));
  const selected = [...editorSelection].map(i => boxes.find(b=>b.index===i)).filter(Boolean);
  if (!selected.length) return;
  if (action.startsWith('distribute') && selected.length < 3) return;
  pushSnapshot();
  const anchor = selected.find((box) => box.index === editorSel) || selected[0];
  const setX=(b,x)=>editing.elements[b.index].x_mm=(Number(editing.elements[b.index].x_mm)||0)+(x-b.x);
  const setY=(b,y)=>editing.elements[b.index].y_mm=(Number(editing.elements[b.index].y_mm)||0)+(y-b.y);
  const labelW = Number(editing.width_mm) || 50;
  const labelH = Number(editing.height_mm) || 25;
  if(action==='alignLeft'){const x=selected.length===1?0:Math.min(...selected.map(b=>b.x));selected.forEach(b=>setX(b,x));}
  if(action==='alignCenter'){const x=selected.length===1?labelW/2:anchor.x+anchor.w/2;selected.forEach(b=>setX(b,x-b.w/2));}
  if(action==='alignRight'){const x=selected.length===1?labelW:Math.max(...selected.map(b=>b.x+b.w));selected.forEach(b=>setX(b,x-b.w));}
  if(action==='alignTop'){const y=selected.length===1?0:Math.min(...selected.map(b=>b.y));selected.forEach(b=>setY(b,y));}
  if(action==='alignMiddle'){const y=selected.length===1?labelH/2:anchor.y+anchor.h/2;selected.forEach(b=>setY(b,y-b.h/2));}
  if(action==='alignBottom'){const y=selected.length===1?labelH:Math.max(...selected.map(b=>b.y+b.h));selected.forEach(b=>setY(b,y-b.h));}
  if(action==='distributeHorizontal'){const sorted=[...selected].sort((a,b)=>a.x-b.x),start=sorted[0].x,end=sorted.at(-1).x+sorted.at(-1).w,total=sorted.reduce((s,b)=>s+b.w,0),gap=(end-start-total)/(sorted.length-1);let x=start;for(const b of sorted){setX(b,x);x+=b.w+gap;}}
  if(action==='distributeVertical'){const sorted=[...selected].sort((a,b)=>a.y-b.y),start=sorted[0].y,end=sorted.at(-1).y+sorted.at(-1).h,total=sorted.reduce((s,b)=>s+b.h,0),gap=(end-start-total)/(sorted.length-1);let y=start;for(const b of sorted){setY(b,y);y+=b.h+gap;}}
  refreshObjectTools();renderEditorElements();drawEditorCanvas();touchEditor();updateUndoButtons();
}
window.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-object-action]').forEach(b=>b.addEventListener('click',()=>applyObjectAlignment(b.dataset.objectAction))));

function selectElement(i) {
  editorSel = i;
  editorSelection = i >= 0 ? new Set([i]) : new Set();
  renderEditorElements();
  drawEditorCanvas();
  // porta in vista la riga selezionata
  const row = document.querySelector(`#edElements .elrow[data-index="${i}"]`);
  if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
      row.appendChild(bar);

      const grid = document.createElement('div'); grid.className = 'grid';
      const u = unitSuffix();
      const common = [['x_mm', 'p.x', 'number'], ['y_mm', 'p.y', 'number']];
      const props = common.concat(ELEMENT_PROPS[elem.type] || []);
      props.forEach(([prop, label, kind, span]) => {
        const fld = document.createElement('div'); fld.className = 'fld' + (span === 'full' ? ' full' : '');
        const l = document.createElement('label');
        l.textContent = MM_PROPS.includes(prop) ? `${t(label)} (${u})` : t(label);
        fld.appendChild(l);
        let input;
        if (kind === 'bool') {
          input = document.createElement('select');
          [['true', t('bool.yes')], ['false', t('bool.no')]].forEach(([v, txt]) => { const o = document.createElement('option'); o.value = v; o.textContent = txt; input.appendChild(o); });
          input.value = String(elem[prop] !== false);
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
    liner_left_mm: Math.max(0, Number(el('stockLeft').value) || 0),
    liner_right_mm: Math.max(0, Number(el('stockRight').value) || 0),
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
let persistTimer = null;
let factoryEdited = false;
function touchEditor() {
  if (current && !current.editable) factoryEdited = true;
  editorDirty = true;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => { persistEditor(); }, 400);
}
async function persistEditor() {
  clearTimeout(persistTimer);
  persistTimer = null;
  if (!editorDirty || !editing) return;
  if (current && !current.editable && !factoryEdited) return;
  readingForSave = true;
  readEditorIntoDraft();
  readingForSave = false;
  const name = (el('edName').value || '').trim();
  if (!name) return;
  editing.name = name.replace(/\.json$/, '');
  editorDirty = false;
  const res = await window.zebra.saveTemplate(name, editing);
  if (res && res.ok) {
    await reloadTemplates();
    current = templates.find((tpl) => tpl.file === res.file) || current;
    rawTemplate = JSON.parse(JSON.stringify(editing));
    factoryEdited = false;
    renderTemplateList();
  } else {
    editorDirty = true;
  }
}

function flushAllStateOnExit() {
  try {
    clearTimeout(persistTimer);
    if (editing && el('editorView').style.display !== 'none' &&
        (!current || current.editable || factoryEdited || editorDirty)) {
      readingForSave = true;
      readEditorIntoDraft();
      readingForSave = false;
      const name = (el('edName').value || '').trim();
      if (name) {
        editing.name = name.replace(/\.json$/i, '');
        const result = window.zebra.saveTemplateSync(name, editing);
        if (result?.ok) editorDirty = false;
      }
    }
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
window.addEventListener('beforeunload', flushAllStateOnExit);

function sampleData(tpl) {
  const data = {};
  const values = (tpl && tpl.values) || {};
  placeholderNames(tpl).forEach((name) => {
    if (values[name] != null && String(values[name]) !== '') data[name] = String(values[name]);
    else if ((tpl.field_meta || {})[name] && tpl.field_meta[name].options && tpl.field_meta[name].options[0]) data[name] = tpl.field_meta[name].options[0];
    else data[name] = '';
  });
  return data;
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
  text:{label:'Text',type:'text',x_mm:3,y_mm:3,font:'0',height_mm:3,width_mm:3,text:'{{field}}'},
  barcode128:{label:'Barcode',type:'barcode128',x_mm:3,y_mm:3,bar_height_mm:10,module_width:2,show_text:false,text:'{{campo}}'},
  code39:{label:'Code39',type:'code39',x_mm:3,y_mm:3,bar_height_mm:10,module_width:2,show_text:true,text:'{{campo}}'},
  code93:{label:'Code93',type:'code93',x_mm:3,y_mm:3,bar_height_mm:10,module_width:2,show_text:true,text:'{{campo}}'},
  ean13:{label:'EAN-13',type:'ean13',x_mm:3,y_mm:3,bar_height_mm:12,module_width:2,show_text:true,text:'{{campo}}'},
  qrcode:{label:'QR code',type:'qrcode',x_mm:3,y_mm:3,magnification:4,text:'{{campo}}'},
  datamatrix:{label:'DataMatrix',type:'datamatrix',x_mm:3,y_mm:3,magnification:5,text:'{{campo}}'},
  box:{label:'Rectangle',type:'box',x_mm:2,y_mm:2,width_mm:20,height_mm:12,thickness_mm:0.4},
  ellipse:{label:'Ellipse',type:'ellipse',x_mm:2,y_mm:2,width_mm:20,height_mm:12,thickness_mm:0.4},
  inverse:{label:'Inverse',type:'inverse',x_mm:2,y_mm:2,width_mm:20,height_mm:12},
  line:{label:'Line',type:'line',x_mm:2,y_mm:10,width_mm:20,height_mm:0,thickness_mm:0.4},
};
function insertEditorElement(type,point=null,textValue=null){
  if(!editing||!insertElementDefaults[type])return null;
  readEditorIntoDraft();pushSnapshot();
  const added={...insertElementDefaults[type]};
  if(textValue!==null&&Object.hasOwn(added,'text'))added.text=textValue;
  if(point){
    const margin=editing.margin_mm||{};
    added.x_mm=Math.max(0,snapVal(point.x-(Number(margin.left)||0)));
    added.y_mm=Math.max(0,snapVal(point.y-(Number(margin.top)||0)));
  }else placeNewElementAtBottom(added);
  editing.elements=editing.elements||[];editing.elements.push(added);
  editorSel=editing.elements.length-1;editorSelection=new Set([editorSel]);
  renderEditorElements();updateEditorPreview();touchEditor();
  return added;
}

function renderSidebarDataSources(){
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

function snapVal(v) {
  if (!editorGrid.snap) return Math.round(v * 10) / 10;
  const s = editorGrid.step;
  return Math.round(v / s) * s;
}

function gridSVG(W, H) {
  if (!editorGrid.show) return '';
  let g = '';
  const minor = editorGrid.step >= 1 ? editorGrid.step : 1;
  for (let x = 0; x <= W; x += minor) g += `<line class="gridline${x % 5 === 0 ? ' major' : ''}" x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y = 0; y <= H; y += minor) g += `<line class="gridline${y % 5 === 0 ? ' major' : ''}" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  return g;
}

let previewRulerObserver = null;
let previewZoom = 1;
let previewPan = { x: 0, y: 0 };
let previewWheelBound = false;
function syncPreviewZoomControl(){
  const slider=el('previewZoomSlider'),value=el('previewZoomValue');
  if(slider)slider.value=String(Math.round(previewZoom*100));
  if(value)value.textContent=Math.round(previewZoom*100)+'%';
}
function setPreviewZoom(value,anchorX,anchorY){
  previewZoom=Math.max(.1,Math.min(8,Number(value)||1));
  applyPreviewZoom(anchorX,anchorY);
  syncPreviewZoomControl();
  updatePreviewRuler();
}
el('previewZoomOut')?.addEventListener('click',()=>setPreviewZoom(previewZoom/1.2));
el('previewZoomIn')?.addEventListener('click',()=>setPreviewZoom(previewZoom*1.2));
el('previewZoomSlider')?.addEventListener('input',event=>setPreviewZoom(Number(event.currentTarget.value)/100));
syncPreviewZoomControl();
function sizePreviewCanvas(frame, wrap, svg) {
  const availableW=Math.max(100,frame.clientWidth-36),availableH=Math.max(100,frame.clientHeight-36);
  const aspect=(Number(editing?.width_mm)||50)/(Number(editing?.height_mm)||25);
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
function ensurePreviewScrollbars(frame) {
  if (frame.querySelector('.preview-scrollbar.horizontal')) return;
  frame.querySelectorAll('.preview-scrollbar,.preview-scrollbar-corner').forEach(node=>node.remove());
  frame.dataset.customScrollbars = 'true';
  for (const axis of ['horizontal','vertical']) {
    const track=document.createElement('div'),thumb=document.createElement('div');
    track.className='preview-scrollbar '+axis;track.setAttribute('role','scrollbar');track.setAttribute('aria-label',axis==='horizontal'?'Horizontal preview scroll':'Vertical preview scroll');track.setAttribute('aria-orientation',axis);track.tabIndex=0;
    thumb.className='preview-scrollbar-thumb';track.append(thumb);frame.append(track);
    const read=()=>axis==='horizontal'?previewPan.x:previewPan.y;
    const write=value=>{if(axis==='horizontal')previewPan.x=value;else previewPan.y=value;const wrap=frame.querySelector('.canvaswrap');if(wrap)wrap.style.transform='translate('+previewPan.x+'px, '+previewPan.y+'px)';updatePreviewRuler();};
    const sync=()=>{const extent=axis==='horizontal'?frame.clientWidth:frame.clientHeight,trackExtent=axis==='horizontal'?track.clientWidth:track.clientHeight,thumbExtent=Math.max(24,trackExtent/2),travel=Math.max(1,trackExtent-thumbExtent),value=Math.max(-extent,Math.min(extent,read()));thumb.style[axis==='horizontal'?'width':'height']=thumbExtent+'px';thumb.style.transform=axis==='horizontal'?'translateX('+((value/extent+1)/2*travel)+'px)':'translateY('+((value/extent+1)/2*travel)+'px)';};
    track._syncPreviewScrollbar=sync;
    track.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();const isThumb=event.target===thumb,bounds=track.getBoundingClientRect(),start=axis==='horizontal'?event.clientX:event.clientY,startValue=read(),trackStart=axis==='horizontal'?bounds.left:bounds.top,trackExtent=axis==='horizontal'?track.clientWidth:track.clientHeight,thumbExtent=axis==='horizontal'?thumb.offsetWidth:thumb.offsetHeight,travel=Math.max(1,trackExtent-thumbExtent),extent=axis==='horizontal'?frame.clientWidth:frame.clientHeight,point=start-trackStart;if(!isThumb){const fraction=Math.max(0,Math.min(1,(point-thumbExtent/2)/travel));write((fraction*2-1)*extent);return;}const move=e=>{const current=axis==='horizontal'?e.clientX:e.clientY;write(Math.max(-extent,Math.min(extent,startValue+(current-start)*2*extent/travel)));};const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});window.addEventListener('pointercancel',end,{once:true});});
    track.addEventListener('keydown',event=>{const extent=axis==='horizontal'?frame.clientWidth:frame.clientHeight,step=event.shiftKey?extent*.8:40;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key)){event.preventDefault();let value=read();if(event.key==='Home')value=-extent;else if(event.key==='End')value=extent;else value+=(event.key==='ArrowLeft'||event.key==='ArrowUp'||event.key==='PageUp'?-1:1)*step;write(value);}});
  }
  const corner=document.createElement('div');corner.className='preview-scrollbar-corner';frame.append(corner);
}
function applyPreviewZoom(anchorX,anchorY) {
  const frame=el('previewFrame'),wrap=frame?.querySelector('.canvaswrap'),svg=wrap?.querySelector('svg');if(!frame||!wrap||!svg||!editing)return;
  const pointX=anchorX==null?frame.clientWidth/2:anchorX,pointY=anchorY==null?frame.clientHeight/2:anchorY;
  const oldMarginLeft=parseFloat(wrap.style.marginLeft)||0,oldMarginTop=parseFloat(wrap.style.marginTop)||0;
  const ratioX=(pointX+frame.scrollLeft-oldMarginLeft-previewPan.x)/Math.max(1,wrap.clientWidth);
  const ratioY=(pointY+frame.scrollTop-oldMarginTop-previewPan.y)/Math.max(1,wrap.clientHeight);
  const next=sizePreviewCanvas(frame,wrap,svg);
  previewPan.x=pointX+frame.scrollLeft-next.marginLeft-ratioX*next.width;
  previewPan.y=pointY+frame.scrollTop-next.marginTop-ratioY*next.height;
  clampPreviewPan(frame,next);
  wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;
}
function bindPreviewNavigation(){
  const frame=el('previewFrame');if(!frame||frame.dataset.navigationBound)return;frame.dataset.navigationBound='true';
  if(!document.body.dataset.rulerNavbarObserver){document.body.dataset.rulerNavbarObserver='true';new MutationObserver(()=>requestAnimationFrame(updatePreviewRuler)).observe(document.body,{attributes:true,attributeFilter:['class']});}
  document.querySelector('.edbar')?.addEventListener('transitionend',updatePreviewRuler);
  frame.addEventListener('pointerdown',event=>{
    if(event.button!==1)return;
    event.preventDefault();frame.setPointerCapture(event.pointerId);
    const start={x:event.clientX,y:event.clientY,panX:previewPan.x,panY:previewPan.y};
    frame.style.cursor='grabbing';
    const move=e=>{previewPan.x=start.panX+e.clientX-start.x;previewPan.y=start.panY+e.clientY-start.y;const wrap=frame.querySelector('.canvaswrap');if(wrap)wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;updatePreviewRuler();};
    const end=()=>{frame.removeEventListener('pointermove',move);frame.removeEventListener('pointerup',end);frame.removeEventListener('pointercancel',end);frame.style.cursor='';};
    frame.addEventListener('pointermove',move);frame.addEventListener('pointerup',end);frame.addEventListener('pointercancel',end);
  });
  frame.addEventListener('wheel',event=>{
    if(!frame.querySelector('.canvaswrap'))return;
    const scale=event.deltaMode===1?16:event.deltaMode===2?frame.clientHeight:1;
    const dx=event.deltaX*scale,dy=event.deltaY*scale;
    let panX=dx,panY=dy;
    if(event.ctrlKey){
      event.preventDefault();
      const rect=frame.getBoundingClientRect();
      previewZoom=Math.max(.1,Math.min(8,previewZoom*Math.exp(-(dy||dx)*.0015)));
      applyPreviewZoom(event.clientX-rect.left,event.clientY-rect.top);
      syncPreviewZoomControl();
      updatePreviewRuler();return;
    }
    else if(event.shiftKey){panX=dx||dy;panY=0;}
    // Match a document workspace: the wheel moves the page in the opposite
    // direction, while the page follows a middle-button drag.
    event.preventDefault();
    previewPan.x-=panX;previewPan.y-=panY;
    const wrap=frame.querySelector('.canvaswrap');
    if(wrap)wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;
    updatePreviewRuler();
  },{passive:false});
  frame.addEventListener('scroll',updatePreviewRuler,{passive:true});
  window.addEventListener('resize',()=>{const wrap=frame.querySelector('.canvaswrap'),svg=wrap?.querySelector('svg');if(wrap&&svg){const size=sizePreviewCanvas(frame,wrap,svg);clampPreviewPan(frame,size);wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;updatePreviewRuler();}});
}

function updatePreviewRuler() {
  const frame=el('previewFrame'), svg=frame?.querySelector('.canvaswrap > svg');
  if(!frame||!svg)return;
  ensurePreviewScrollbars(frame);
  const pane=frame.closest('.preview-pane'),nav=document.querySelector('.edbar');
  const navStyle=nav?getComputedStyle(nav):null,navRect=nav?.getBoundingClientRect(),paneRect=pane?.getBoundingClientRect();
  const navVisible=!!navRect&&navStyle?.visibility!=='hidden'&&Number(navStyle?.opacity||0)>0;
  if(pane&&navVisible&&paneRect){pane.style.setProperty('padding-top',`${Math.max(0,navRect.bottom-paneRect.top)}px`,'important');}
  else if(pane)pane.style.setProperty('padding-top','0px','important');
  const paperRect=svg.getBoundingClientRect(),viewportRect=frame.getBoundingClientRect();
  const pageFits=paperRect.left>=viewportRect.left-1&&paperRect.top>=viewportRect.top-1&&paperRect.right<=viewportRect.left+frame.clientWidth-16&&paperRect.bottom<=viewportRect.top+frame.clientHeight-16;
  frame.classList.toggle('preview-page-fits',pageFits);
  frame.querySelectorAll('.preview-scrollbar').forEach(track=>{track.hidden=pageFits;track._syncPreviewScrollbar?.();});
  const rulerFixed=document.body.classList.contains('ruler-fixed');
  let ruler=frame.querySelector('#previewRuler');
  if(!ruler){ruler=document.createElement('canvas');ruler.id='previewRuler';ruler.setAttribute('aria-hidden','true');ruler.style.cssText='position:absolute;z-index:8;pointer-events:none;max-width:none;max-height:none;display:'+(rulerFixed||frame.matches(':hover')?'block':'none')+';';frame.append(ruler);
    if(!frame.dataset.rulerEvents){frame.dataset.rulerEvents='true';frame.addEventListener('pointerenter',()=>{const active=frame.querySelector('#previewRuler');if(active){active.style.display='block';updatePreviewRuler();}});frame.addEventListener('pointerleave',()=>{const active=frame.querySelector('#previewRuler');if(active&&!document.body.classList.contains('ruler-fixed'))active.style.display='none';});}
    if(!previewRulerObserver){previewRulerObserver=new ResizeObserver(()=>{const wrap=frame.querySelector('.canvaswrap'),paper=wrap?.querySelector('svg');if(wrap&&paper)sizePreviewCanvas(frame,wrap,paper);updatePreviewRuler();});previewRulerObserver.observe(frame);}
  }
  if(rulerFixed)ruler.style.display='block';
  else if(!frame.matches(':hover'))ruler.style.display='none';
  if(ruler.style.display==='none')return;
  const sr=svg.getBoundingClientRect(),fr=frame.getBoundingClientRect();if(!sr.width||!sr.height)return;
  const unit=measureUnit(),factor=unit==='in'?25.4:unit==='cm'?10:unit==='mil'?0.0254:unit==='dots'?25.4/(editing?.dpi||203):1;
  const unitName=unit==='dots'?'dot':unit;
  const mmW=Number(editing?.width_mm)||50,mmH=Number(editing?.height_mm)||25;
  // Keep the ruler strip compact while retaining readable measurement labels.
  // The strip was previously made smaller by also shrinking its numbers.
  const dpr=window.devicePixelRatio||1,pad=13,w=frame.clientWidth,h=frame.clientHeight;
  const frameRect=frame.getBoundingClientRect();
  const navCoversFrame=!!navRect&&navVisible&&navRect.bottom>frameRect.top;
  const rulerTop=navCoversFrame?Math.max(0,Math.min(h,navRect.bottom-frameRect.top)):0;
  const horizontalPad=rulerTop+pad,verticalPad=horizontalPad;
  // These coordinates are already relative to the visible viewport; adding
  // scroll offsets again would separate the ruler zero from the paper edge.
  const ox=sr.left-fr.left-frame.clientLeft,oy=sr.top-fr.top-frame.clientTop;
  ruler.style.left='0';ruler.style.top='0';ruler.style.width=w+'px';ruler.style.height=h+'px';
  ruler.style.transform=`translate(${frame.scrollLeft}px,${frame.scrollTop}px)`;
  ruler.width=Math.round(w*dpr);ruler.height=Math.round(h*dpr);
  const c=ruler.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  // Outside the physical page, blend the ruler into the dark workspace.
  // The span over the page uses ZebraDesigner’s light gray ruler treatment.
  c.fillStyle='#4b5563';c.fillRect(0,rulerTop,w,pad);c.fillRect(0,verticalPad,pad,Math.max(0,h-verticalPad));
  c.fillStyle='#e6e6e6';c.fillRect(Math.max(pad,ox),rulerTop,Math.max(0,Math.min(w,ox+sr.width)-Math.max(pad,ox)),pad);
  c.fillRect(0,Math.max(verticalPad,oy),pad,Math.max(0,Math.min(h,oy+sr.height)-Math.max(verticalPad,oy)));
  c.strokeStyle='#526174';c.fillStyle='#e5e7eb';c.lineWidth=0.5;c.font='10px Segoe UI, sans-serif';
  c.beginPath();c.moveTo(pad,horizontalPad);c.lineTo(w,horizontalPad);c.moveTo(pad,verticalPad);c.lineTo(pad,h);c.stroke();
  function axis(length,origin,paperLength,pxPerMm,vertical){
    let major=factor;const series=[1,2,5];let power=Math.pow(10,Math.floor(Math.log10(70/(pxPerMm*factor))));
    major=series.map(n=>n*power).find(n=>n*pxPerMm*factor>=55)||10*power;
    const step=major*factor/10;
    const axisStart=vertical?verticalPad:pad;
    const start=Math.ceil((axisStart-origin)/pxPerMm/step),end=Math.floor((length-origin)/pxPerMm/step);
    for(let i=start;i<=end;i++){
      const pos=origin+i*step*pxPerMm,full=i%10===0,len=full?6:i%5===0?4:2;
      const onPaper=pos>=origin-0.5&&pos<=origin+paperLength+0.5;
      c.strokeStyle=onPaper?'#263547':'#cbd5e1';c.lineWidth=onPaper?(full?0.75:0.5):0.375;
      c.beginPath();if(vertical){c.moveTo(pad,pos);c.lineTo(pad-len,pos);}else{c.moveTo(pos,horizontalPad);c.lineTo(pos,horizontalPad-len);}c.stroke();
      if(full){const value=i*step/factor,label=String(Number(value.toFixed(3)));
        c.fillStyle=onPaper?'#172333':'#e5e7eb';
        if(vertical){c.save();c.translate(9,pos-2);c.rotate(-Math.PI/2);c.fillText(label,0,0);c.restore();}else c.fillText(label,pos+1.5,rulerTop+11);
      }
    }
  }
  axis(w,ox,sr.width,sr.width/mmW,false);axis(h,oy,sr.height,sr.height/mmH,true);
  c.fillStyle='#4b5563';c.fillRect(0,rulerTop,pad,pad);c.fillStyle='#e5e7eb';c.fillText(unitName,1.5,rulerTop+11);

}

function drawEditorCanvas() {
  if (!editing) return;
  drawStockPreview();
  const W = Number(editing.width_mm) || 50, H = Number(editing.height_mm) || 25;
  const data = sampleData(editing);
  const allIdx = (editing.elements || []).map((_, i) => i);
  ensureQR(qrValuesOf(editing, data), drawEditorCanvas, dmValuesOf(editing, data));
  const boxes = window.LabelPreview.computeBoxes(editing, data);

  let interaction = '';
  boxes.forEach((b) => {
    let hits = '', sel = '', handleHits = '';
    const w = Math.max(b.w, b.type === 'text' ? 6 : 2), h = Math.max(b.h, b.type === 'text' ? 4 : 2);
    const element = editing.elements[b.index];
    const angle=Number(element?.rotation_deg)||0,cx=b.x+w/2,cy=b.y+h/2;
    const rotation=angle?` transform="rotate(${angle} ${cx} ${cy})"`:'';
    if (element?.type === 'line') {
      const lineW = Number(element.width_mm) || 0;
      const lineH = Number(element.height_mm) || 0;
      const thickness = Math.max(0.1, Number(element.thickness_mm) || 0.3);
      hits += `<line class="hit" data-hit="${b.index}" x1="${b.x}" y1="${b.y}" x2="${b.x + lineW}" y2="${b.y + lineH}" stroke="transparent" stroke-width="${thickness}" pointer-events="stroke"${rotation}/>`;
    } else {
      hits += `<rect class="hit" data-hit="${b.index}" x="${b.x}" y="${b.y}" width="${w}" height="${h}"${rotation}/>`;
    }
    if (editorSelection.has(b.index) || b.index === editorSel) {
      const selected = element;
      const visual = selectionVisualBounds(b, selected);
      const visualCenterX=visual.x+visual.w/2,visualCenterY=visual.y+visual.h/2;
      const visualRotation=angle?` transform="rotate(${angle} ${visualCenterX} ${visualCenterY})"`:'';
      sel += `<rect class="sel" x="${visual.x}" y="${visual.y}" width="${visual.w}" height="${visual.h}"${visualRotation}/>`;
      handleHits += elementHandlesSVG(visual.x, visual.y, visual.w, visual.h, b.index, selected, visual);
      if (selected?.type === 'text' && !liveElementText(selected).trim()) {
        sel += `<text class="sel-placeholder" x="${(b.x + 0.7).toFixed(2)}" y="${(b.y + h / 2).toFixed(2)}" dominant-baseline="middle">Text</text>`;
      }
    }
    interaction += `<g data-editor-overlay="${b.index}">${hits}${sel}${handleHits}</g>`;
  });

  const frame = el('previewFrame');
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
  const svg = window.LabelPreview.renderPreviewSVG(editorPreview, data, allIdx, qrCache, {
    before: gridSVG(W, H),
    after: interaction,
  });
  frame.innerHTML = `<div class="canvaswrap">${svg}</div>`;
  renderSidebarDataSources();
  ensurePreviewScrollbars(frame);
  const wrap=frame.querySelector('.canvaswrap'),canvas=wrap?.querySelector('svg');
  if(wrap&&canvas){const size=sizePreviewCanvas(frame,wrap,canvas);clampPreviewPan(frame,size);wrap.style.transform=`translate(${previewPan.x}px, ${previewPan.y}px)`;}
  syncPreviewZoomControl();
  el('previewNote').textContent = `${formatSize(W, H, editing.unit, editing.dpi)} · ${editing.dpi || 203} dpi (${t('prev.note.editor')})`;
  refreshObjectTools();
  attachCanvasHandlers();
  bindPreviewNavigation();
  updatePreviewRuler();
}

function selectionVisualBounds(box, element) {
  if (element?.type === 'line') {
    const thickness = Math.max(0.1, Number(element.thickness_mm) || 0.3);
    const x2 = box.x + (Number(element.width_mm) || 0);
    const y2 = box.y + (Number(element.height_mm) || 0);
    const dx=Math.abs(x2-box.x),dy=Math.abs(y2-box.y),length=Math.hypot(dx,dy);
    // The rendered line uses butt caps: stroke width expands perpendicular to
    // its direction, but does not extend past either endpoint.
    const half=thickness/2;
    const padX=length?half*dy/length:half;
    const padY=length?half*dx/length:half;
    return {
      x: Math.min(box.x, x2) - padX,
      y: Math.min(box.y, y2) - padY,
      w: dx + padX*2,
      h: dy + padY*2,
    };
  }
  const x2 = box.x + box.w;
  const y2 = box.y + box.h;
  if (element?.type === 'box' || element?.type === 'ellipse') {
    const thickness = Math.max(0.1, Number(element.thickness_mm) || 0.3);
    return { x: box.x - thickness / 2, y: box.y - thickness / 2, w: box.w + thickness, h: box.h + thickness };
  }
  return { x: box.x, y: box.y, w: box.w, h: box.h };
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
  el('stockSizeNote').textContent = `Label ${w.toFixed(2)} × ${h.toFixed(2)} mm · Total width with liner ${total.toFixed(2)} mm`;
}

function elementHandlesSVG(x, y, w, h, index, element, box) {
  const pts = [
    ['nw', x, y], ['n', x + w / 2, y], ['ne', x + w, y],
    ['e', x + w, y + h / 2], ['se', x + w, y + h],
    ['s', x + w / 2, y + h], ['sw', x, y + h], ['w', x, y + h / 2],
  ];
  const barcode=['barcode128','code39','code93','ean13'].includes(element?.type);
  const dots=pts.map(([a,cx,cy])=>{
    const corner=['nw','ne','se','sw'].includes(a);
    const marker=corner
      ? `<circle class="handle-dot" cx="${cx}" cy="${cy}" r="0.28"/>`
      : `<rect class="handle-dot" x="${(cx-0.23).toFixed(2)}" y="${(cy-0.23).toFixed(2)}" width="0.46" height="0.46"/>`;
    return `${marker}<rect class="handle-hit handle-${a}" data-handle="${index}" data-anchor="${a}" x="${(cx-1.3).toFixed(2)}" y="${(cy-1.3).toFixed(2)}" width="2.6" height="2.6"/>`;
  }).join('');
  const angle=Number(element?.rotation_deg)||0,centerX=x+w/2,centerY=y+h/2;
  const frame=angle?`<g transform="rotate(${angle} ${centerX} ${centerY})">${dots}</g>`:dots;
  const label=elementTypeLabel(element);
  // Keep the object name attached to the selection edge. The old tag could be
  // clipped by the SVG viewBox when an object was near the top and was much
  // larger than Zebra's compact object tag.
  const labelWidth=Math.max(5.5,label.length*.72+1.1),labelY=Math.max(0,y-1.75);
  const tag=`<g class="selection-tag"><rect x="${x}" y="${labelY}" width="${labelWidth}" height="1.6" rx="0.18"/><text x="${x+.5}" y="${labelY+1.15}">${label}</text></g>`;
  const rotateY=y-3.7;
  const rotated=angle?`<g transform="rotate(${angle} ${centerX} ${centerY})">`:'';
  const rotationControl=`${rotated}<path class="rotation-stem" d="M ${centerX} ${y} L ${centerX} ${rotateY}"/><circle class="rotation-dot" cx="${centerX}" cy="${rotateY}" r="0.48"/><circle class="rotation-hit" data-rotate="${index}" cx="${centerX}" cy="${rotateY}" r="1.7"/>${angle?'</g>':''}`;
  if(!barcode||element.show_text===false)return `${frame}${tag}${rotationControl}`;
  const hriGap=0.6,hriHeight=3,barHeight=Number(element.bar_height_mm)||10;
  const offset=Math.max(-hriGap,Number(element.hri_offset_mm)||0),hy=(box?.y||0)+barHeight+hriGap+offset+hriHeight/2;
  return `${frame}${tag}${rotationControl}<circle class="hri-handle-dot" cx="${x+w/2}" cy="${hy}" r="0.23"/><circle class="hri-handle-hit" data-handle="${index}" cx="${x+w/2}" cy="${hy}" r="0.9"/>`;
}

function elementTypeLabel(element) {
  const labels={text:'Text',barcode128:'Barcode',code39:'Barcode',code93:'Barcode',ean13:'Barcode',qrcode:'QR Code',datamatrix:'Data Matrix',image:'Picture',line:'Line',box:'Rectangle',ellipse:'Ellipse',inverse:'Inverse'};
  return labels[element?.type]||'Object';
}

function liveElementText(elem) {
  const data = sampleData(editing);
  return String(elem && elem.text ? elem.text : '').replace(/\{\{\s*([\w.\-]+)\s*\}\}/g, (_, k) => {
    const v = data[k];
    return v === undefined || v === null || v === '' ? '' : String(v);
  });
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
  let x1 = orig.x, y1 = orig.y, x2 = orig.x + orig.w, y2 = orig.y + orig.h;
  if (anchor.indexOf('w') !== -1) x1 = pt.x;
  if (anchor.indexOf('e') !== -1) x2 = pt.x;
  if (anchor.indexOf('n') !== -1) y1 = pt.y;
  if (anchor.indexOf('s') !== -1) y2 = pt.y;
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  return {
    x: snapVal(x),
    y: snapVal(y),
    w: Math.max(1, snapVal(Math.abs(x2 - x1))),
    h: Math.max(1, snapVal(Math.abs(y2 - y1))),
  };
}

function applyElementBox(elem, box, origBox) {
  const dpi = (editing && editing.dpi) || 203;
  elem.x_mm = Math.max(0, box.x - (editing.margin_mm?.left || 0));
  elem.y_mm = Math.max(0, box.y - (editing.margin_mm?.top || 0));
  const dw = Math.abs(box.w - origBox.w) > 0.15;
  const dh = Math.abs(box.h - origBox.h) > 0.15;
  const barcodes = ['barcode128', 'code39', 'code93', 'ean13'];
  if (elem.type === 'text') {
    if (dh) elem.height_mm = Math.max(1, Math.round((box.h / 0.9) * 10) / 10);
    if (dw) {
      const n = Math.max(1, liveElementText(elem).length || 1);
      elem.width_mm = Math.max(1, Math.round((box.w / (n * 0.66)) * 10) / 10);
    }
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
  } else {
    if (dw) elem.width_mm = Math.max(0.3, box.w);
    if (dh) elem.height_mm = Math.max(0, box.h);
  }
}

// Restituisce l'SVG overlay attualmente nel DOM (viene ricreato ad ogni ridisegno).
function liveOverlay() { return el('previewFrame').querySelector('svg.overlay'); }

function clientToMm(evt, svg) {
  if (!svg) return null;
  const m = svg.getScreenCTM();
  if (!m) return null;
  const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
  const p = pt.matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

function attachCanvasHandlers() {
  const svg = liveOverlay();
  if (!svg) return;
  svg.querySelectorAll('.hit').forEach((rect) => {
    rect.addEventListener('pointerdown', (e) => {
      if(e.button!==0)return;
      const index = Number(rect.dataset.hit);
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); e.stopPropagation();
        toggleEditorSelection(index);
        return;
      }
      if (!editorSelection.has(index) || editorSelection.size < 1) selectElement(index);
      startDrag(e, index, 'move');
    });
  });
  svg.querySelectorAll('.handle-hit, .handle').forEach((rect) => {
    rect.addEventListener('pointerdown', (e) => {
      if(e.button!==0)return;
      e.stopPropagation();
      startDrag(e, Number(rect.dataset.handle), 'resize', rect.dataset.anchor);
    });
  });
  svg.querySelectorAll('.hri-handle-hit').forEach((handle) => handle.addEventListener('pointerdown', (e) => {
    if(e.button!==0)return;
    startDrag(e,Number(handle.dataset.handle),'hri','hri');
  }));
  svg.querySelectorAll('.rotation-hit').forEach(handle=>handle.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    startDrag(e,Number(handle.dataset.rotate),'rotate','rotate');
  }));
  svg.addEventListener('pointerdown', (e) => {
    if(e.button!==0)return;
    if (e.target.closest('.hit, .handle-hit, .handle')) return;
    startMarqueeSelection(e, svg);
  });
}

function toggleEditorSelection(index) {
  const next = new Set(editorSelection);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  editorSelection = next;
  editorSel = next.has(index) ? index : (next.size ? [...next].at(-1) : -1);
  renderEditorElements();
  drawEditorCanvas();
}

function startMarqueeSelection(e, svg) {
  e.preventDefault();
  const start = clientToMm(e, svg);
  if (!start) return;
  const additive = e.ctrlKey || e.metaKey;
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
    }
    marquee.remove();
    editorSelection = next;
    editorSel = next.size ? [...next].at(-1) : -1;
    renderEditorElements();
    drawEditorCanvas();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function startDrag(e, index, mode, anchor) {
  e.preventDefault(); e.stopPropagation();
  if (!editorSelection.has(index)) selectElement(index);
  const indices = mode === 'move' ? [...editorSelection] : [index];
  const elems = indices.map((i) => editing.elements[i]).filter(Boolean);
  const elem = editing.elements[index];
  const start = clientToMm(e, liveOverlay());
  if (!start || !elem) return;
  pushSnapshot();
  const boxes = window.LabelPreview.computeBoxes(editing, sampleData(editing));
  const b = boxes.find((box) => box.index === index);
  const orig = {
    x: b ? b.x : (Number(elem.x_mm) || 0),
    y: b ? b.y : (Number(elem.y_mm) || 0),
    w: Math.max(b ? b.w : 2, 2),
    h: Math.max(b ? b.h : 2, 2),
    elX: Number(elem.x_mm) || 0,
    elY: Number(elem.y_mm) || 0,
    thickness: Math.max(0.1, Number(elem.thickness_mm) || 0.3),
    lineCenterY: (b ? b.y : (Number(elem.y_mm) || 0)) + (Number(elem.height_mm) || 0) / 2,
    hriOffset: Number(elem.hri_offset_mm) || 0,
    rotation: Number(elem.rotation_deg)||0,
  };
  const center={x:orig.x+orig.w/2,y:orig.y+orig.h/2};
  const rotationStart=Math.atan2(start.y-center.y,start.x-center.x)*180/Math.PI;
  const lockAspect=elem.type==='image'&&['nw','ne','sw','se'].includes(anchor);
  let shiftPressed=!!e.shiftKey,lastPointer={x:e.clientX,y:e.clientY};
  const objectPoint=point=>{
    if(mode!=='resize'||!orig.rotation)return point;
    const r=-orig.rotation*Math.PI/180,dx=point.x-center.x,dy=point.y-center.y;
    return {x:center.x+dx*Math.cos(r)-dy*Math.sin(r),y:center.y+dx*Math.sin(r)+dy*Math.cos(r)};
  };
  const groupOrig = new Map(indices.map((i) => {
    const item = editing.elements[i];
    return [i, { x: Number(item.x_mm) || 0, y: Number(item.y_mm) || 0 }];
  }));

  let raf = null;
  const move = (ev) => {
    lastPointer={x:ev.clientX,y:ev.clientY};
    shiftPressed=!!ev.shiftKey;
    const pointer = clientToMm(ev, liveOverlay());
    if (!pointer) return;
    const pt=objectPoint(pointer);
    if (mode === 'rotate') {
      const angle=Math.atan2(pointer.y-center.y,pointer.x-center.x)*180/Math.PI;
      elem.rotation_deg=Math.round((((orig.rotation+angle-rotationStart)%360)+360)%360);
    } else if (mode === 'move') {
      const dx = pt.x - start.x, dy = pt.y - start.y;
      for (const i of indices) {
        const item = editing.elements[i], initial = groupOrig.get(i);
        if (!item || !initial) continue;
        item.x_mm = Math.max(0, snapVal(initial.x + dx));
        item.y_mm = Math.max(0, snapVal(initial.y + dy));
      }
      // Move just the selected SVG groups during the gesture. Rebuilding the
      // whole preview on every frame re-encodes barcodes and makes dragging lag.
      if(!raf)raf=requestAnimationFrame(()=>{
        raf=null;
        const overlay=liveOverlay();
        for(const i of indices){
          const item=editing.elements[i],initial=groupOrig.get(i);
          if(!item||!initial)continue;
          const tx=(Number(item.x_mm)||0)-initial.x,ty=(Number(item.y_mm)||0)-initial.y;
          overlay?.querySelector(`[data-label-element="${i}"]`)?.setAttribute('transform',`translate(${tx} ${ty})`);
          overlay?.querySelector(`[data-editor-overlay="${i}"]`)?.setAttribute('transform',`translate(${tx} ${ty})`);
        }
      });
      return;
    } else if (mode === 'hri') {
      elem.hri_offset_mm=Math.max(-0.6,Math.min(50,Math.round((orig.hriOffset+pt.y-start.y)*100)/100));
    } else if (elem.type === 'line' && (anchor || '').match(/[ns]/) && Math.abs(pt.y - start.y) >= Math.abs(pt.x - start.x)) {
      // A line's vertical resize handles control stroke thickness, not its endpoint y coordinates.
      const dy = pt.y - start.y;
      // Thin-line handle hit areas overlap, so determine the dragged side from the pointer position.
      const isTopSide = start.y <= orig.lineCenterY;
      const thicknessDelta = isTopSide ? -dy * 2 : dy * 2;
      elem.thickness_mm = Math.max(0.1, Math.round((orig.thickness + thicknessDelta) * 100) / 100);
    } else {
      const ratio=lockAspect&&shiftPressed?orig.w/orig.h:null;
      applyElementBox(elem, boxFromAnchor(orig, pt, anchor || 'se',ratio), orig);
    }
    if (!raf) raf = requestAnimationFrame(() => { raf = null; drawEditorCanvas(); });
  };
  const up = (ev) => {
    if(mode==='move'&&ev)move(ev);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('keydown',shiftKeyChange,true);
    window.removeEventListener('keyup',shiftKeyChange,true);
    if(raf){cancelAnimationFrame(raf);raf=null;}
    renderEditorElements();
    drawEditorCanvas();
    touchEditor();
  };
  const shiftKeyChange=ev=>{
    if(!lockAspect||ev.key!=='Shift')return;
    shiftPressed=ev.type==='keydown';
    move({clientX:lastPointer.x,clientY:lastPointer.y,shiftKey:shiftPressed});
  };
  if(lockAspect){window.addEventListener('keydown',shiftKeyChange,true);window.addEventListener('keyup',shiftKeyChange,true);}
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function setEditorStatus(kind, msg) {
  const s = el('editorStatus'); s.className = kind; s.textContent = msg;
  s.style.cssText = 'margin-top:12px;padding:10px 12px;border-radius:7px;font-weight:500;' +
    (kind === 'ok' ? 'background:#dcfce7;color:#16a34a;' : kind === 'err' ? 'background:#fee2e2;color:#dc2626;' : 'background:#f1f1f1;color:#171717;');
}

async function saveEditor(asNew) {
  readEditorIntoDraft();
  let name = el('edName').value.trim();
  if (!name) { setEditorStatus('err', t('dyn.nameNeeded')); return; }
  editing.name = name.replace(/\.json$/, '');
  if (asNew && current && (name + '.json') === current.file) name = name + '-copy';
  const res = await window.zebra.saveTemplate(name, editing);
  if (res && res.ok) {
    factoryEdited = false;
    setEditorStatus('ok', t('dyn.saved'));
    await reloadTemplates();
    await selectTemplate(res.file);
  } else setEditorStatus('err', t('dyn.printErr', { e: res?.error || '?' }));
}

async function deleteEditor() {
  if (!current) return;
  if (!window.confirm(`Delete template “${current.name}”?`)) return;
  clearTimeout(persistTimer);
  persistTimer = null;
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

async function reloadTemplates() {
  templates = await window.zebra.listTemplates();
  renderTemplateList();
  window.refreshProjectHome?.();
}

async function init() {
  settings = await window.zebra.getSettings() || {};

  // Keep the interface language fixed to English, including migrated settings.
  const uiLang = 'en';
  settings.uiLang = uiLang;
  window.zebra.saveSettings({ uiLang });
  window.I18N.setLang('en');
  document.documentElement.lang = 'en';
  window.I18N.applyStatic();
  updateMeasureLabels();
  // Stampanti
  const printers = await window.zebra.listPrinters();
  const sel = el('printerSelect');
  printers.forEach((n) => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
  const zebra = printers.find((n) => /zebra|zd410/i.test(n));
  if (settings.printer && printers.includes(settings.printer)) sel.value = settings.printer;
  else if (zebra) sel.value = zebra;

  if (settings.connType) el('connType').value = settings.connType;
  if (settings.ip) el('ipInput').value = settings.ip;
  if (settings.usb) el('usbInput').value = settings.usb;
  applySettings(settings);

  // Template
  await reloadTemplates();
  const startFile = (settings.lastTemplate && templates.some((t) => t.file === settings.lastTemplate))
    ? settings.lastTemplate
    : (templates.find((t) => /codice-fiscale/i.test(t.file))?.file || templates[0]?.file);
  if (startFile) await selectTemplate(startFile); else openEditor(blankTemplate());
  window.projectHomeData = () => ({ templates, lastTemplate: settings.lastTemplate, printer: el('printerSelect').value, pinnedTemplates: settings.pinnedTemplates || [], hiddenRecentTemplates: settings.hiddenRecentTemplates || [] });
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
    await window.zebra.saveSettings({ lastTemplate: settings.lastTemplate, pages: settings.pages || {}, pinnedTemplates: settings.pinnedTemplates, hiddenRecentTemplates: settings.hiddenRecentTemplates });
    await reloadTemplates(); window.refreshProjectHome?.(); return result;
  };
  window.duplicateProjectTemplate = async (template, name) => { const result = await window.zebra.duplicateTemplate(template.file, name); if(result?.ok){await reloadTemplates();window.refreshProjectHome?.();} return result; };
  window.revealProjectTemplate = file => window.zebra.revealTemplate(file);
  window.copyProjectPath = file => window.zebra.copyTemplatePath(file);
  window.toggleProjectPin = async file => { const pinned=new Set(settings.pinnedTemplates||[]);if(pinned.has(file))pinned.delete(file);else pinned.add(file);settings.pinnedTemplates=[...pinned];await window.zebra.saveSettings({pinnedTemplates:settings.pinnedTemplates});window.refreshProjectHome?.();return {ok:true}; };
  window.removeProjectFromRecent = async file => {const hidden=new Set(settings.hiddenRecentTemplates||[]);hidden.add(file);settings.hiddenRecentTemplates=[...hidden];await window.zebra.saveSettings({hiddenRecentTemplates:settings.hiddenRecentTemplates});window.refreshProjectHome?.();return {ok:true};};
  window.selectProjectTemplate = selectTemplate;
  window.formatProjectSize = (tpl) => formatSize(tpl.width_mm, tpl.height_mm, tpl.unit, tpl.dpi);
  window.showProjectHome?.();

  // Eventi
  el('connType').addEventListener('change', onConnTypeChange);
  el('printerSelect').addEventListener('change', () => { window.zebra.saveSettings({ printer: el('printerSelect').value }); updateConnSummary(); if (editing) { readEditorIntoDraft(); refreshEditorUI(); touchEditor(); } });
  el('ipInput').addEventListener('change', () => { window.zebra.saveSettings({ ip: el('ipInput').value.trim() }); updateConnSummary(); });
  el('usbInput').addEventListener('change', () => { window.zebra.saveSettings({ usb: el('usbInput').value.trim() }); updateConnSummary(); });

  el('newTemplateBtn').addEventListener('click', () => window.openNewLabelWizard());

  el('duplicateTplBtn').addEventListener('click', () => saveEditor(true));
  el('edPrintBtn').addEventListener('click', () => window.openPrintDialog());
  el('deleteTplBtn').addEventListener('click', deleteEditor);
  el('exportTplBtn').addEventListener('click', exportTemplate);
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

  // Generale: apri cartella, ripristina, versione
  el('openFolderBtn').addEventListener('click', () => window.zebra.openTemplatesFolder());
  el('resetSettingsBtn').addEventListener('click', async () => {
    if (!confirm(t('dyn.confirmReset'))) return;
    await window.zebra.resetSettings();
    location.reload();
  });
  window.zebra.appVersion().then((v) => {
    window.appDisplayVersion = 'v' + v;
    const e = el('appVersion'); if (e) e.textContent = 'ABSS ZebraBar v' + v;
    const badge = el('sidebarVersion'); if (badge) badge.textContent = 'v' + v;
    window.refreshProjectHome?.();
    document.title = 'ABSS ZebraBar v' + v;
  }).catch(() => {});

  // Esc chiude le finestre
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.key === 'Escape') { el('settingsModal').style.display = 'none'; el('helpModal').style.display = 'none'; }
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
  document.addEventListener('keydown', (e) => {
    const mod=e.ctrlKey||e.metaKey, key=String(e.key||'').toLowerCase();
    const inEditor=el('editorView').style.display!=='none';
    const editable=!!e.target?.closest?.('input, textarea, [contenteditable="true"]');
    if(!mod||!inEditor||editable||(key!=='z'&&key!=='x'))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(key==='z'){if(e.shiftKey)redo();else undo();}
    else copySelectedElement(true);
  }, true);
  document.addEventListener('keydown', async (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const inEditor = el('editorView').style.display !== 'none';
    const target = e.target;
    const textEntry = !!(target && target.closest && target.closest('input, textarea, [contenteditable="true"]'));
    const k = String(e.key || '').toLowerCase();

    if (!mod && inEditor && !textEntry && editorSel != null && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault(); deleteSelectedElement(); return;
    }
    if (e.key === 'F12') {
      e.preventDefault(); if (inEditor) await saveEditor(true); return;
    }
    if (!mod) return;

    if (k === 'w') { e.preventDefault(); if (inEditor) await persistEditor(); window.close(); }
    else if (k === 'n') { e.preventDefault(); el('newTemplateBtn').click(); }
    else if (k === 'o') { e.preventDefault(); el('importTplBtn').click(); }
    else if (k === 'p') { e.preventDefault(); window.openPrintDialog(); }
    else if (k === 's' && e.shiftKey) { e.preventDefault(); if (inEditor) await saveEditor(true); }
    else if (k === 's') { e.preventDefault(); if (inEditor) { touchEditor(); await persistEditor(); } }
    else if (k === 'f') { e.preventDefault(); el('tplSearch').focus(); el('tplSearch').select(); }
    else if (k === 'h') { if (inEditor && !textEntry) { e.preventDefault(); replaceTemplateText(); } }
    else if (k === 'z' && e.shiftKey && inEditor && !textEntry) { e.preventDefault(); e.stopPropagation(); redo(); }
    else if (k === 'z' && inEditor && !textEntry) { e.preventDefault(); e.stopPropagation(); undo(); }
    else if (k === 'y' && inEditor && !textEntry) { e.preventDefault(); redo(); }
    else if (k === 'd' && inEditor && !textEntry) { e.preventDefault(); duplicateSelectedElement(); }
    else if (k === 'c' && inEditor && !textEntry) { if (copySelectedElement(false)) e.preventDefault(); }
    else if (k === 'x' && inEditor && !textEntry) { if (copySelectedElement(true)) { e.preventDefault(); e.stopPropagation(); } }
    else if (k === 'v' && inEditor && !textEntry) { if (pasteElement()) e.preventDefault(); }
  });
  window.zebra.onPrintShortcut?.(() => window.openPrintDialog?.());
  el('addFieldMetaBtn').addEventListener('click', () => addFieldMetaRow('', { type: 'select', options: [] }));

  // Controlli griglia / snap dell'anteprima interattiva
  el('chkGrid').addEventListener('change', () => { editorGrid.show = el('chkGrid').checked; window.zebra.saveSettings({ gridShow: editorGrid.show }); drawEditorCanvas(); });
  el('chkSnap').addEventListener('change', () => { editorGrid.snap = el('chkSnap').checked; window.zebra.saveSettings({ gridSnap: editorGrid.snap }); });
  el('gridStep').addEventListener('change', () => { editorGrid.step = Number(el('gridStep').value); window.zebra.saveSettings({ gridStep: editorGrid.step }); drawEditorCanvas(); });

  // Proprietà editor → anteprima live
  el('edName').addEventListener('input', () => { if (el('edTitle')) el('edTitle').textContent = t('dyn.editTitle', { n: (el('edName').value || '—') }); });
  ['edName', 'edDesc', 'edW', 'edH', 'edDpi', 'edTear', 'stockName', 'stockType', 'stockLeft', 'stockRight'].forEach((id) =>
    el(id).addEventListener('input', debounce(() => { readEditorIntoDraft(); touchEditor(); updateEditorPreview(); })));
  ['pageEnabled', 'pageW', 'pageH', 'pageRows', 'pageCols', 'pageTop', 'pageBottom', 'pageLeft', 'pageRight', 'pageGapX', 'pageGapY', 'pageTemplateManual']
    .forEach((id) => el(id).addEventListener('input', debounce(() => { readEditorIntoDraft(); refreshPageSetup(); touchEditor(); updateEditorPreview(); })));
  el('pagePreset').addEventListener('click', () => {
    readEditorIntoDraft();
    editing.width_mm = 2.36 * 25.4;
    editing.height_mm = 2.36 * 25.4;
    editing.page = { ...(editing.page || {}), enabled: true, unit: settings.unit || 'mm', manual_template: true,
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
    pushSnapshot(); editing.width_mm = w; editing.height_mm = h; editing.page.manual_template = true;
    refreshEditorUI(); touchEditor(); updateEditorPreview();
  });
  el('copies').addEventListener('input', rememberPrintPageSoon);

  el('addImageBtn').onclick = () => { pendingImageDropMm=null;el('imageFile').click(); };
  el('imageFile').onchange = async () => {
    const file = el('imageFile').files[0];
    if (!file || !editing) return;
    try {
      const url = URL.createObjectURL(file);
      const image = new Image();
      try { image.src = url; await image.decode(); } finally { URL.revokeObjectURL(url); }
      const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
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
      const imageElement = { type: 'image', label: file.name, x_mm: 0, y_mm: 0,
        width_mm: height * canvas.width / canvas.height, height_mm: height,
        bitmap_width: canvas.width, bitmap_height: canvas.height,
        bitmap_hex: Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase() };
      if(pendingImageDropMm){const margin=editing.margin_mm||{};imageElement.x_mm=Math.max(0,snapVal(pendingImageDropMm.x-(Number(margin.left)||0)));imageElement.y_mm=Math.max(0,snapVal(pendingImageDropMm.y-(Number(margin.top)||0)));pendingImageDropMm=null;}
      else placeNewElementAtBottom(imageElement);
      editing.elements.push(imageElement);
      editorSel = editing.elements.length - 1;
      editorSelection = new Set([editorSel]);
      renderEditorElements(); updateEditorPreview(); touchEditor();
    } catch (error) { setEditorStatus('err', 'Cannot import image: ' + error.message); }
    finally { el('imageFile').value = ''; }
  };
  el('backgroundBtn').onclick = () => el('backgroundFile').click();
  el('clearBackgroundBtn').onclick = () => { if (editing) { delete editing.background; editing.print_background = false; pushSnapshot(); refreshEditorUI(); touchEditor(); } };
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
  document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>insertEditorElement(btn.dataset.add)));
  el('addSidebarField').addEventListener('click',()=>{
    const raw=prompt('New data field name (letters, numbers, underscore, dot or hyphen)');
    if(raw==null)return;
    const name=raw.trim();
    if(!/^[\w.\-]+$/.test(name)){setEditorStatus('err','Use letters, numbers, underscore, dot or hyphen in a field name.');return;}
    if(placeholderNames(editing).includes(name)){setEditorStatus('err','That data field already exists in this label.');return;}
    if(!editing.values)editing.values={};editing.values[name]='';insertEditorElement('text',null,`{{${name}}}`);
  });
  const insertPane=el('insertSidebar'),frame=el('previewFrame');
  insertPane.addEventListener('dragstart',event=>{
    const source=event.target.closest('[data-add],#addImageBtn,.source-item');if(!source)return;
    let payload;
    if(source.matches('.source-item'))payload=source.dataset.sourceField?{kind:'field',value:source.dataset.sourceField}:{kind:'object-value',value:source.dataset.sourceText||''};
    else payload={kind:'tool',value:source.id==='addImageBtn'?'image':source.dataset.add};
    activeInsertPayload=payload;event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData('application/x-bratender-insert',JSON.stringify(payload));
    if(payload.kind==='tool'&&payload.value==='image')event.dataTransfer.setData('text/plain','image');
  });
  insertPane.addEventListener('dragend',()=>{activeInsertPayload=null;frame.classList.remove('insert-drop-active');});
  frame.addEventListener('dragover',event=>{if(!activeInsertPayload)return;event.preventDefault();event.dataTransfer.dropEffect='copy';frame.classList.add('insert-drop-active');});
  frame.addEventListener('dragleave',event=>{if(!frame.contains(event.relatedTarget))frame.classList.remove('insert-drop-active');});
  frame.addEventListener('drop',event=>{
    if(!activeInsertPayload)return;event.preventDefault();frame.classList.remove('insert-drop-active');
    let payload=activeInsertPayload;try{payload=JSON.parse(event.dataTransfer.getData('application/x-bratender-insert'))||payload;}catch{}
    activeInsertPayload=null;
    const svg=frame.querySelector('.canvaswrap > svg'),rect=svg?.getBoundingClientRect();
    if(!rect||event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)return;
    const point=clientToMm(event,liveOverlay());if(!point)return;
    if(payload.kind==='tool'&&payload.value==='image'){pendingImageDropMm=point;el('imageFile').click();return;}
    const sourceText=payload.kind==='field'?`{{${payload.value}}}`:payload.kind==='object-value'?payload.value:null;
    const hit=event.target.closest('.hit[data-hit]'),targetIndex=hit?Number(hit.dataset.hit):-1,target=editing?.elements?.[targetIndex];
    if(sourceText!==null&&target&&['text','barcode128','code39','code93','ean13','qrcode','datamatrix'].includes(target.type)){
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
init().then(()=>{appInitializing=false;setPreviewLoading(false);document.getElementById("startupHomeSkeleton")?.remove();}).catch(error=>{
  appInitializing=false;
  setPreviewLoading(false);
  document.getElementById("startupHomeSkeleton")?.remove();
  console.error('Application startup failed:',error);
  const frame=el('previewFrame');
  if(frame)frame.setAttribute('aria-label','Preview failed to load');
});

