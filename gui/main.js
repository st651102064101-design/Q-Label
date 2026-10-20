'use strict';

const { app, BrowserWindow, ipcMain, shell, dialog, clipboard } = require('electron');
const net = require('net');

// Keep the legacy app data name so existing Bratender templates and settings
// remain available after the product rename.
app.setName('Bratender');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { displayVersion } = require('../package.json');
// A second window, or a cache folder another process still holds, makes
// Chromium fail with "Unable to move the cache" (0x5) and "Gpu Cache Creation failed".
app.commandLine.appendSwitch('disk-cache-dir', path.join(os.tmpdir(), 'bratender-disk-cache'));
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
const { execFile } = require('child_process');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const { buildLabel, extractPlaceholders } = require('../lib/render');
const { normalizeTemplate, fitToPrinterPrintableArea, printerLabelTopDots } = require('./print-geometry');
const { sendNetwork, sendWindowsPrinterByName, sendUSBWindows, sendUSBUnix } = require('../lib/print');
const { startServer } = require('../lib/server');

let printServer = null; // istanza del print server HTTP (se attivo)

// --- Cartelle template ---
// I template "di fabbrica" sono in bundle (sola lettura in app impacchettate),
// i template creati/modificati dall'utente vanno in una cartella scrivibile (userData).
function resolveBundledTemplatesDir() {
  const res = process.resourcesPath || '';
  const candidates = [
    path.join(__dirname, '..', 'templates'),
    path.join(res, 'templates'),
    path.join(res, 'app', 'templates'),
    path.join(res, 'app.asar', 'templates'),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch (_) { /* asar */ }
  }
  return candidates[0];
}

const BUNDLED_TEMPLATES_DIR = resolveBundledTemplatesDir();
let USER_TEMPLATES_DIR = null; // impostata a app-ready
let SETTINGS_FILE = null;

function ensureUserDirs() {
  USER_TEMPLATES_DIR = path.join(app.getPath('userData'), 'templates');
  SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');
  try { fs.mkdirSync(USER_TEMPLATES_DIR, { recursive: true }); } catch (_) {}
}

// --- Impostazioni ---
function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch (_) {
    return {};
  }
}
function saveSettings(obj) {
  try {
    const current = loadSettings();
    const merged = Object.assign({}, current, obj);
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch (e) {
    return { error: e.message };
  }
}

// --- Template ---
function readTemplateFile(dir, file) {
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
}

// Elenco unito: i file in USER_TEMPLATES_DIR hanno precedenza su quelli bundled con lo stesso nome.
function listTemplateFiles() {
  const map = new Map(); // file -> { dir, editable }
  const hiddenFactoryTemplates = new Set(loadSettings().hiddenFactoryTemplates || []);
  try {
    for (const f of fs.readdirSync(BUNDLED_TEMPLATES_DIR)) {
      if (f.endsWith('.json') && !hiddenFactoryTemplates.has(f)) map.set(f, { dir: BUNDLED_TEMPLATES_DIR, editable: false });
    }
  } catch (_) {}
  try {
    for (const f of fs.readdirSync(USER_TEMPLATES_DIR)) {
      if (f.endsWith('.json') && !hiddenFactoryTemplates.has(f)) map.set(f, { dir: USER_TEMPLATES_DIR, editable: true });
    }
  } catch (_) {}
  return map;
}

function templateSummary(file, dir, editable) {
  const t = readTemplateFile(dir, file);
  const elements = (t.elements || []).map((el, i) => ({
    index: i,
    label: el.label || `${el.type}${el.text ? ' — ' + el.text : ''}`,
    type: el.type,
    enabledDefault: el.enabled !== false,
  }));
  const meta = t.field_meta || {};
  const fields = extractPlaceholders(t).map((name) => {
    const m = meta[name] || {};
    return { name, label: m.label || null, type: m.type || 'text', options: m.options || null };
  });
  return {
    file,
    editable,
    name: t.name || file.replace('.json', ''),
    description: t.description || '',
    dpi: t.dpi || 203,
    width_mm: t.width_mm,
    height_mm: t.height_mm,
    tear_off: t.tear_off,
    unit: t.unit || 'mm',
    fields,
    elements,
  };
}

function listTemplates() {
  const out = [];
  for (const [file, info] of listTemplateFiles()) {
    try { out.push(templateSummary(file, info.dir, info.editable)); } catch (_) {}
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// Carica il JSON completo di un template (per l'editor).
function loadTemplateRaw(file) {
  const map = listTemplateFiles();
  const info = map.get(file);
  if (!info) throw new Error('Template not found: ' + file);
  const template = readTemplateFile(info.dir, file);
  template.language = 'zpl';
  return template;
}

// Carica per la stampa (qualunque sia la cartella).
function loadTemplateForPrint(file) {
  return loadTemplateRaw(file);
}

// Salva/crea un template nella cartella utente (scrivibile).
function saveTemplate(file, json) {
  const safe = path.basename(file).replace(/[^\w.\-]/g, '_');
  const name = safe.endsWith('.json') ? safe : safe + '.json';
  const full = path.join(USER_TEMPLATES_DIR, name);
  fs.writeFileSync(full, JSON.stringify(json, null, 2), 'utf8');
  return { ok: true, file: name };
}

function deleteTemplate(file) {
  const name = path.basename(file);
  if (!name.endsWith('.json')) return { ok: false, error: 'Invalid template.' };
  const full = path.join(USER_TEMPLATES_DIR, name);
  const wasCustom = fs.existsSync(full);
  if (wasCustom) { fs.unlinkSync(full); }
  const existsInBundle = (() => { try { return fs.existsSync(path.join(BUNDLED_TEMPLATES_DIR, name)); } catch (_) { return false; } })();
  if (existsInBundle) {
    const hidden = new Set(loadSettings().hiddenFactoryTemplates || []);
    hidden.add(name);
    saveSettings({ hiddenFactoryTemplates: [...hidden] });
  } else if (!wasCustom) return { ok: false, error: 'Template not found.' };
  return { ok: true };
}

function resolveTemplatePath(file) {
  const info = listTemplateFiles().get(path.basename(String(file || '')));
  if (!info) throw new Error('Template not found.');
  return { info, full: path.join(info.dir, path.basename(file)) };
}

function cleanTemplateName(value) {
  const name = String(value || '').trim().replace(/\.json$/i, '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '');
  if (!name || name === '.' || name === '..') throw new Error('Enter a valid project name.');
  return name.slice(0, 100);
}

function duplicateTemplate(file, requestedName) {
  const { full: source } = resolveTemplatePath(file);
  const name = cleanTemplateName(requestedName);
  const targetName = `${name}.json`, target = path.join(USER_TEMPLATES_DIR, targetName);
  if (fs.existsSync(target)) throw new Error('A project with this name already exists.');
  const template = JSON.parse(fs.readFileSync(source, 'utf8'));
  template.name = name;
  fs.writeFileSync(target, JSON.stringify(template, null, 2), 'utf8');
  return { ok: true, file: targetName, name };
}

function renameTemplate(file, requestedName) {
  const { info, full: source } = resolveTemplatePath(file);
  if (!info.editable) throw new Error('Built-in sample projects cannot be renamed.');
  const name = cleanTemplateName(requestedName), targetName = `${name}.json`, target = path.join(USER_TEMPLATES_DIR, targetName);
  if (targetName !== path.basename(source) && fs.existsSync(target)) throw new Error('A project with this name already exists.');
  const template = JSON.parse(fs.readFileSync(source, 'utf8'));
  template.name = name;
  fs.writeFileSync(target, JSON.stringify(template, null, 2), 'utf8');
  if (target !== source) fs.unlinkSync(source);
  return { ok: true, oldFile: path.basename(source), file: targetName, name };
}

function listWindowsPrinters() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve([]);
    execFile(
      'powershell.exe',
      ['-NoProfile', '-Command', 'Get-Printer | Select-Object -ExpandProperty Name'],
      { timeout: 8000, windowsHide: true },
      (err, stdout) => {
        if (err) return resolve([]);
        resolve(stdout.split(/\r?\n/).map((s) => s.trim()).filter((name) => /zebra/i.test(name)));
      }
    );
  });
}

async function doPrint(payload) {
  return printRuntime.print({ ...payload, template: payload.template || loadTemplateForPrint(payload.file) });
}

// --- Finestra ---
function createWindow() {
  const s = loadSettings();
  const b = s.windowBounds || {};
  const win = new BrowserWindow({
    width: b.width || 1200,
    height: b.height || 820,
    x: b.x,
    y: b.y,
    minWidth: 900,
    minHeight: 600,
    title: `ABSS ZebraBar v${displayVersion}`,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && (input.control || input.meta) && (String(input.key).toLowerCase() === 'p' || input.code === 'KeyP')) {
      event.preventDefault();
      win.webContents.send('shortcut-print');
      return;
    }
    if (input.type === 'keyDown' && (
      String(input.key).toLowerCase() === 'f5' ||
      ((input.control || input.meta) && String(input.key).toLowerCase() === 'r')
    )) {
      event.preventDefault();
    }
  });
  if (s.windowMaximized) win.maximize();
  win.loadFile(path.join(__dirname, 'index.html'));

  const persistBounds = () => {
    if (!win.isMaximized()) saveSettings({ windowBounds: win.getBounds() });
    saveSettings({ windowMaximized: win.isMaximized() });
  };
  win.on('resize', persistBounds);
  win.on('move', persistBounds);
}

const sourceSerialStore = require('../lib/source-serialization').createStore(path.join(app.getPath('userData'),'source-serialization.json'));
const printRuntime = require('./print-ipc')({ ipcMain, dialog, serialStore:sourceSerialStore, settings: loadSettings, printerNames: listWindowsPrinters, sendWindowsPrinterByName, sendNetwork, sendUSBWindows, sendUSBUnix });

require('../lib/source-ipc')({ipcMain,dialog,settings:loadSettings,serialStore:sourceSerialStore});

// --- IPC ---
ipcMain.handle('list-templates', () => listTemplates());
ipcMain.handle('load-template-raw', (_e, file) => loadTemplateRaw(file));
ipcMain.handle('save-template', (_e, { file, json }) => {
  try { return saveTemplate(file, json); }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.on('save-template-sync', (event, { file, json }) => {
  try { event.returnValue = saveTemplate(file, json); }
  catch (e) { event.returnValue = { ok: false, error: e.message }; }
});
ipcMain.handle('delete-template', (_e, file) => {
  try { return deleteTemplate(file); }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('rename-template', (_e, { file, name }) => {
  try { return renameTemplate(file, name); }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('duplicate-template', (_e, { file, name }) => {
  try { return duplicateTemplate(file, name); }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('reveal-template', async (_e, file) => {
  try { const { full } = resolveTemplatePath(file); shell.showItemInFolder(full); return { ok: true, path: full }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('copy-template-path', (_e, file) => {
  try { const { full } = resolveTemplatePath(file); clipboard.writeText(full); return { ok: true, path: full }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('list-printers', () => listWindowsPrinters());
let installedFontFamiliesPromise=null;
ipcMain.handle('get-installed-font-families',()=>{
  installedFontFamiliesPromise ||= require('../lib/font-families').getInstalledFontFamilies();
  return installedFontFamiliesPromise;
});

// Apri un file (CSV o JSON) e restituisci nome + contenuto testuale.
ipcMain.handle('pick-file', async (_e, kind) => {
  const filters = kind === 'xml' ? [{name:'XML',extensions:['xml']}] : kind === 'csv'
    ? [{ name: 'CSV', extensions: ['csv', 'txt'] }]
    : [{ name: 'Template JSON', extensions: ['json'] }];
  const r = await dialog.showOpenDialog({ properties: ['openFile'], filters });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  try {
    const content = fs.readFileSync(r.filePaths[0], 'utf8');
    return { canceled: false, name: path.basename(r.filePaths[0]), content };
  } catch (e) { return { canceled: true, error: e.message }; }
});

// Salva contenuto testuale scegliendo dove (Salva con nome).
ipcMain.handle('save-file', async (_e, { defaultName, content }) => {
  const r = await dialog.showSaveDialog({ defaultPath: defaultName || 'export.json' });
  if (r.canceled || !r.filePath) return { canceled: true };
  try { fs.writeFileSync(r.filePath, content, 'utf8'); return { canceled: false, path: r.filePath }; }
  catch (e) { return { canceled: true, error: e.message }; }
});

ipcMain.handle('save-png', async (_e, { defaultName, dataUrl }) => {
  const r = await dialog.showSaveDialog({
    defaultPath: defaultName || 'label.png',
    filters: [{ name: 'PNG', extensions: ['png'] }],
  });
  if (r.canceled || !r.filePath) return { canceled: true };
  try {
    const b64 = String(dataUrl || '').replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(r.filePath, Buffer.from(b64, 'base64'));
    return { canceled: false, path: r.filePath };
  } catch (e) { return { canceled: true, error: e.message }; }
});

// Rasterizza lo ZPL reale (stesso payload inviato alla stampante) in PNG via Labelary.
ipcMain.handle('render-label-png', async (_e, payload) => {
  try {
    const printSettings=loadSettings();
    const job = require('../lib/print-job').preparePrintJob(payload, printSettings);
    const template = job.template, dpi = Number(template.dpi) || 203;
    const zpl = job.zpl.toString('ascii');
    const dpmm = dpi >= 600 ? 24 : dpi >= 300 ? 12 : 8;
    const wIn = (Number(template.page?.enabled ? template.page.width_mm : template.width_mm) / 25.4).toFixed(3);
    const hIn = (Number(template.page?.enabled ? template.page.height_mm : template.height_mm) / 25.4).toFixed(3);
    const url = `http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${wIn}x${hIn}/0/`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'image/png', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: zpl,
        signal: ctrl.signal,
      });
    } finally { clearTimeout(t); }
    if (!res.ok) throw new Error('Labelary HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true, source: 'zpl', dataUrl: 'data:image/png;base64,' + buf.toString('base64') };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
});

// Test rapido di raggiungibilità della stampante.
ipcMain.handle('test-connection', async (_e, connection) => {
  try {
    if (connection.type === 'ip') {
      await new Promise((resolve, reject) => {
        const sock = new net.Socket();
        sock.setTimeout(4000);
        sock.once('connect', () => { sock.destroy(); resolve(); });
        sock.once('timeout', () => { sock.destroy(); reject(new Error('timeout')); });
        sock.once('error', (err) => reject(err));
        sock.connect(Number(connection.port) || 9100, connection.ip);
      });
      return { ok: true, message: `Printer reachable at ${connection.ip}:${connection.port || 9100}.` };
    }
    if (connection.type === 'printer') {
      const printers = await listWindowsPrinters();
      const found = printers.includes(connection.printer);
      return found
        ? { ok: true, message: `Printer "${connection.printer}" found in Windows.` }
        : { ok: false, error: `Printer "${connection.printer}" not found among installed printers.` };
    }
    return { ok: true, message: 'Manual check for the USB port.' };
  } catch (e) {
    return { ok: false, error: 'Not reachable: ' + e.message };
  }
});

// Matrice QR reale per l'anteprima (0/1 per modulo).
ipcMain.handle('qr-matrix', (_e, text) => {
  try {
    const qr = QRCode.create(String(text || ' '), { errorCorrectionLevel: 'M' });
    return { size: qr.modules.size, data: Array.from(qr.modules.data) };
  } catch (e) {
    return { size: 0, data: [] };
  }
});

// Immagine DataMatrix (PNG dataURL) per l'anteprima.
ipcMain.handle('dm-image', async (_e, text) => {
  try {
    const png = await bwipjs.toBuffer({ bcid: 'datamatrix', text: String(text || ' '), scale: 4, includetext: false });
    return 'data:image/png;base64,' + png.toString('base64');
  } catch (e) { return ''; }
});

// --- Diagnostica ---
function tcpConnect(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const s = new net.Socket(); let done = false;
    const fin = (e) => { if (done) return; done = true; s.destroy(); e ? reject(e) : resolve(); };
    s.setTimeout(timeoutMs);
    s.once('timeout', () => fin(new Error('timeout')));
    s.once('error', fin);
    s.connect(port, host, () => fin());
  });
}
function tcpQuery(host, port, payload, timeoutMs) {
  return new Promise((resolve) => {
    const s = new net.Socket(); let buf = ''; let done = false;
    const fin = () => { if (done) return; done = true; s.destroy(); resolve(buf); };
    s.setTimeout(timeoutMs);
    s.once('timeout', fin);
    s.once('error', fin);
    s.once('end', fin);
    s.connect(port, host, () => s.write(payload));
    s.on('data', (d) => { buf += d.toString('latin1'); if (buf.length > 4096) fin(); });
  });
}
function nonZeroHex(line) { return (line.match(/[0-9a-fA-F]{8}/g) || []).some((t) => /[1-9a-fA-F]/.test(t)); }
function parseHQES(resp) {
  if (!resp || !/ERROR|WARNING|PRINTER STATUS/i.test(resp)) return { ok: true, message: 'Connected. Firmware does not report status (normal on some models).' };
  const lines = resp.split(/\r?\n/);
  const err = lines.find((l) => /ERROR/i.test(l)) || '';
  const warn = lines.find((l) => /WARNING/i.test(l)) || '';
  if (nonZeroHex(err)) return { ok: false, message: 'The printer reports an ERROR (out of media, head open, or paused). Check the printer.' };
  if (nonZeroHex(warn)) return { ok: true, message: 'Connected, with an active warning (e.g. media low or head warm).' };
  return { ok: true, message: 'Connected, no errors reported.' };
}
function getPrinterInfo(name) {
  return new Promise((resolve) => {
    const esc = name.replace(/'/g, "''");
    execFile('powershell.exe', ['-NoProfile', '-Command',
      `$ErrorActionPreference='SilentlyContinue'; $p=Get-Printer -Name '${esc}'; $j=(Get-PrintJob -PrinterName '${esc}' | Measure-Object).Count; Write-Output ($p.PrinterStatus.ToString()+'|'+$p.PortName+'|'+$j)`],
      (err, stdout) => {
        if (err || !stdout) return resolve({});
        const [status, port, jobs] = stdout.trim().split('|');
        resolve({ status, port, jobCount: Number(jobs) || 0 });
      });
  });
}

ipcMain.handle('diagnose', async (_e, connection) => {
  const results = [];
  const add = (ok, label, detail) => results.push({ ok, label, detail });
  try {
    if (connection.type === 'ip') {
      const host = connection.ip; const port = Number(connection.port) || 9100;
      if (!host) { add(false, 'IP address', 'No IP set.'); return { results }; }
      try { await tcpConnect(host, port, 4000); add(true, 'Network reachability', `${host}:${port} reachable.`); }
      catch (e) { add(false, 'Network reachability', `Cannot connect to ${host}:${port}. Make sure the printer is on and the IP is correct (it may have changed).`); return { results }; }
      const resp = await tcpQuery(host, port, '~HQES\r\n', 3000);
      const st = parseHQES(resp);
      add(st.ok, 'Printer status', st.message);
    } else if (connection.type === 'printer') {
      if (process.platform !== 'win32') { add(true, 'Printer', 'Diagnostics by name available only on Windows.'); return { results }; }
      const printers = await listWindowsPrinters();
      const found = printers.includes(connection.printer);
      add(found, 'Printer installed', found ? `"${connection.printer}" present in Windows.` : `"${connection.printer}" not found among installed printers.`);
      if (!found) return { results };
      const info = await getPrinterInfo(connection.printer);
      const statusOk = !info.status || /normal|idle/i.test(info.status);
      add(statusOk, 'Windows status', `Status: ${info.status || '?'} · port: ${info.port || '?'}`);
      add(info.jobCount === 0, 'Print queue', info.jobCount > 0 ? `${info.jobCount} jobs queued: possible block. Clear the queue or restart the spooler.` : 'Queue empty.');
      if (/^lan_|_ip_|tcp|zdesigner/i.test(info.port || '')) {
        add(true, 'Tip', 'Network/virtual port: if jobs stay queued without printing, the printer IP may have changed. Try the "Network (IP)" method with the current address, or set a static IP.');
      }
    } else {
      add(true, 'USB', 'Make sure the printer is on and connected; on Windows that the USB port is the right one.');
    }
  } catch (e) {
    add(false, 'Diagnostics error', e.message);
  }
  return { results };
});

// --- Print server HTTP (avviabile dalla GUI) ---
function connectionFromSettings(s) {
  const type = s.connType || 'printer';
  if (type === 'printer') return { type: 'printer', printer: s.printer };
  if (type === 'ip') return { type: 'ip', ip: s.ip, port: 9100 };
  if (type === 'usb') return { type: 'usb', usb: s.usb };
  return null;
}
function startPrintServer() {
  const s = loadSettings();
  const port = Number(s.serverPort) || 9110;
  const token = s.serverToken || '';
  try {
    printServer = startServer({
      port, host: '127.0.0.1', token: token || undefined,
      serialStore: sourceSerialStore, settings: loadSettings,
      resolveTemplate: (file) => loadTemplateRaw(file),
      listTemplateNames: () => listTemplates().map((t) => t.file.replace(/\.json$/, '')),
      defaults: { connection: connectionFromSettings(s) },
    });
    printServer.on('error', () => {}); // es. porta occupata
    return { ok: true, running: true, port, url: `http://127.0.0.1:${port}` };
  } catch (e) {
    printServer = null;
    return { ok: false, error: e.message };
  }
}
function stopPrintServer() {
  if (printServer) { try { printServer.close(); } catch (_) {} printServer = null; }
  return { ok: true, running: false };
}
ipcMain.handle('server-start', () => startPrintServer());
ipcMain.handle('server-stop', () => stopPrintServer());
ipcMain.handle('server-status', () => {
  const s = loadSettings();
  return { running: !!printServer, port: Number(s.serverPort) || 9110, url: `http://127.0.0.1:${Number(s.serverPort) || 9110}` };
});

ipcMain.handle('get-settings', () => loadSettings());
ipcMain.handle('save-settings', (_e, obj) => saveSettings(obj));
ipcMain.on('save-settings-sync', (event, obj) => { event.returnValue = saveSettings(obj); });
ipcMain.handle('reset-settings', () => {
  try { fs.writeFileSync(SETTINGS_FILE, '{}', 'utf8'); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('app-version', () => displayVersion);
ipcMain.handle('open-templates-folder', async () => {
  try { await shell.openPath(USER_TEMPLATES_DIR); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('print', async (_e, payload) => {
  try { return await doPrint(payload); }
  catch (err) { return { ok: false, error: err.message }; }
});

// Create the renamed desktop shortcut on first launch of the packaged app.
function ensureDesktopShortcut() {
  if (process.platform !== 'win32' || !app.isPackaged) return;
  try {
    const lnk = path.join(app.getPath('desktop'), 'ABSS ZebraBar.lnk');
    if (!fs.existsSync(lnk)) {
      shell.writeShortcutLink(lnk, 'create', {
        target: process.execPath,
        description: 'ABSS ZebraBar — Zebra label designer and printer',
        icon: process.execPath,
        iconIndex: 0,
      });
    }
  } catch (_) { /* ignora se non riesce */ }
}

ipcMain.handle('create-desktop-shortcut', () => {
  if (process.platform !== 'win32') return { ok: false, error: 'Windows only.' };
  try {
    const target = app.isPackaged ? process.execPath : process.execPath; // in dev punta a electron.exe
    const lnk = path.join(app.getPath('desktop'), 'ABSS ZebraBar.lnk');
    shell.writeShortcutLink(lnk, 'create', { target, description: 'ABSS ZebraBar — Zebra label designer and printer', icon: target, iconIndex: 0 });
    saveSettings({ shortcutCreated: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

app.whenReady().then(() => {
  ensureUserDirs();
  createWindow();
  ensureDesktopShortcut();
  if (loadSettings().serverEnabled) startPrintServer();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
