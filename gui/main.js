'use strict';

const { app, BrowserWindow, Menu, ipcMain, shell, dialog, clipboard } = require('electron');
const net = require('net');
const { APP_NAME, applicationWindowTitle, configureApplicationIdentity, pinBrowserWindowTitle } = require('./app-branding');

app.setName(APP_NAME);

// Keep the legacy app data name so existing Bratender templates and settings
// remain available after the product rename.
app.setPath('userData', require('path').join(app.getPath('appData'), 'Bratender'));
const fs = require('fs');
const os = require('os');
const path = require('path');
require('./database-ipc').registerDatabaseIpc({ipcMain,dialog});

const zlib = require('zlib');
const { displayVersion } = require('../package.json');
const displayVersionLabel=Number.isFinite(displayVersion)&&/^\d+(?:\.\d{1,2})?$/.test(String(displayVersion))?displayVersion.toFixed(3):String(displayVersion);
// A second window, or a cache folder another process still holds, makes
// Chromium fail with "Unable to move the cache" (0x5) and "Gpu Cache Creation failed".
app.commandLine.appendSwitch('disk-cache-dir', path.join(os.tmpdir(), 'bratender-disk-cache'));
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
const { execFile } = require('child_process');
const {
  normalizeWindowsPrinterNames,
  buildBarTenderPrinterList,
  resolveWindowsPrinterQueueName,
} = require('../lib/windows-printers');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const { buildLabel, extractPlaceholders } = require('../lib/render');
const { normalizeTemplate, fitToPrinterPrintableArea, printerLabelTopDots } = require('./print-geometry');
const { sendNetwork, sendWindowsPrinterByName, sendUSBWindows, sendUSBUnix } = require('../lib/print');
const { isPrintShortcut } = require('../lib/print-shortcut');
const { isNewDocumentShortcut } = require('../lib/new-document-shortcut');
const { startServer } = require('../lib/server');
const labelDocument = require('../lib/label-document');

let printServer = null; // istanza del print server HTTP (se attivo)
let hotReloadTimer = null;
let hotReloadWindow = null;
let hotReloadBusy = false;
let hotReloadPending = false;
const approvedCloseWindows=new WeakSet();

// Keep the editor window open while local UI files change. The main process
// remains alive; only the renderer is refreshed after a short save debounce.
function watchEditorFiles(win) {
  const guiDir=__dirname,appDir=path.dirname(guiDir),packageFile=path.join(appDir,'package.json');
  const refresh=()=>{
    hotReloadWindow=win;
    clearTimeout(hotReloadTimer);
    hotReloadTimer=setTimeout(async()=>{
      const target=hotReloadWindow;
      if(!target||target.isDestroyed())return;
      if(hotReloadBusy){hotReloadPending=true;return;}
      hotReloadPending=false;
      hotReloadBusy=true;
      try{
        const saved=await target.webContents.executeJavaScript('window.prepareHotReload ? window.prepareHotReload() : true');
        if(saved===false)return;
        try{const next=JSON.parse(fs.readFileSync(packageFile,'utf8'));if(next.displayVersion){const label=Number.isFinite(next.displayVersion)&&/^\d+(?:\.\d{1,2})?$/.test(String(next.displayVersion))?next.displayVersion.toFixed(3):String(next.displayVersion);target.setTitle(applicationWindowTitle(label));}}catch(_){}
        target.webContents.reloadIgnoringCache();
      }catch(error){console.warn('Could not refresh the editor after a file change:',error.message);}
      finally{setTimeout(()=>{hotReloadBusy=false;if(hotReloadPending){hotReloadPending=false;refresh();}},1500);}
    },1000);
  };
  const watchers=[];
  try{watchers.push(fs.watch(guiDir,{recursive:true},(_event,name)=>{const file=String(name||'');if(/\.(?:js|html|css|json|svg|png)$/i.test(file)&&!/(?:^|[\\/])(node_modules|cache)(?:[\\/]|$)/i.test(file))refresh();}));}catch(error){console.warn('Editor file watching is unavailable:',error.message);}
  try{watchers.push(fs.watch(appDir,(_event,name)=>{if(String(name||'').toLowerCase()==='package.json')refresh();}));}catch(_){}
  win.once('closed',()=>{for(const watcher of watchers)watcher.close();if(hotReloadWindow===win){clearTimeout(hotReloadTimer);hotReloadTimer=null;hotReloadWindow=null;}});
}

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
let EDIT_HISTORY_DIR = null;

function ensureUserDirs() {
  USER_TEMPLATES_DIR = path.join(app.getPath('userData'), 'templates');
  SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');
  EDIT_HISTORY_DIR = path.join(app.getPath('userData'), 'edit-history');
  try { fs.mkdirSync(USER_TEMPLATES_DIR, { recursive: true }); } catch (_) {}
  try { fs.mkdirSync(EDIT_HISTORY_DIR, { recursive: true }); } catch (_) {}
}

function editHistoryPath(file) {
  const name=path.basename(String(file||''));
  if(!name||name==='.'||name==='..'||!name.toLowerCase().endsWith('.json'))throw new Error('Invalid label history key.');
  return path.join(EDIT_HISTORY_DIR,name+'.gz');
}
function loadEditHistory(file) {
  try { const value=JSON.parse(zlib.gunzipSync(fs.readFileSync(editHistoryPath(file))).toString('utf8'));return {revisions:Array.isArray(value.revisions)?value.revisions.slice(-100):[],undoStack:Array.isArray(value.undoStack)?value.undoStack.slice(-50):[],redoStack:Array.isArray(value.redoStack)?value.redoStack.slice(-50):[]}; }
  catch (_) { return {revisions:[],undoStack:[],redoStack:[]}; }
}
function saveEditHistory(file,value) {
  const target=editHistoryPath(file),payload={revisions:Array.isArray(value?.revisions)?value.revisions.slice(-100):[],undoStack:Array.isArray(value?.undoStack)?value.undoStack.slice(-50):[],redoStack:Array.isArray(value?.redoStack)?value.redoStack.slice(-50):[]};
  fs.mkdirSync(EDIT_HISTORY_DIR,{recursive:true});const temporary=target+'.tmp';fs.writeFileSync(temporary,zlib.gzipSync(Buffer.from(JSON.stringify(payload)),{level:6}));fs.renameSync(temporary,target);return {ok:true};
}

// --- Impostazioni ---
function loadSettings() {
  try {
    return require('../lib/measured-media').correctSettings(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')));
  } catch (_) {
    return {};
  }
}
function saveSettings(obj) {
  try {
    const current = loadSettings();
    const merged = require('../lib/measured-media').correctSettings(Object.assign({}, current, obj));
    // Preserve learned profiles when an older renderer saves other preferences.
    merged.printerProfiles={...current.printerProfiles,...obj.printerProfiles};
    for(const [key,profile] of Object.entries(current.printerProfiles||{})){
      if(Date.parse(profile.read_at)>Date.parse(merged.printerProfiles[key]?.read_at||0))merged.printerProfiles[key]=profile;
    }
    merged.printerMediaModes={...current.printerMediaModes,...obj.printerMediaModes};
    merged.printRegistrations={...current.printRegistrations};
    for(const [printer,profiles] of Object.entries(obj.printRegistrations||{})){
      merged.printRegistrations[printer]={...current.printRegistrations?.[printer],...profiles};
      for(const [signature,profile] of Object.entries(current.printRegistrations?.[printer]||{}))if(Date.parse(profile.created_at)>Date.parse(merged.printRegistrations[printer][signature]?.created_at||0))merged.printRegistrations[printer][signature]=profile;
    }
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
  const template = restoreLegacyLibraryArtwork(readTemplateFile(info.dir, file));
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
  const requested=path.basename(file),existing=requested.endsWith('.json')?requested:requested+'.json';
  // Existing project identities may contain spaces, Unicode and numbered suffixes.
  const name = fs.existsSync(path.join(USER_TEMPLATES_DIR,existing))?existing:(safe.endsWith('.json') ? safe : safe + '.json');
  const full = path.join(USER_TEMPLATES_DIR, name);
  fs.writeFileSync(full, JSON.stringify(json, null, 2), 'utf8');
  return { ok: true, file: name };
}

function createTemplate(json) {
  const base=cleanTemplateName(json?.name||'new-label'),reserved=new Set();
  for(const dir of [BUNDLED_TEMPLATES_DIR,USER_TEMPLATES_DIR]){
    if(!fs.existsSync(dir))continue;
    for(const file of fs.readdirSync(dir)){
      if(!/\.json$/i.test(file))continue;
      reserved.add(file.replace(/\.json$/i,'').toLowerCase());
      try{const template=readTemplateFile(dir,file);if(template.name)reserved.add(String(template.name).trim().toLowerCase());}catch(_){}
    }
  }
  for(let suffix=0;;suffix++){
    const name=suffix?`${base} (${suffix})`:base;
    if(reserved.has(name.toLowerCase()))continue;
    const file=name+'.json';
    try{
      fs.writeFileSync(path.join(USER_TEMPLATES_DIR,file),JSON.stringify({...json,name},null,2),{encoding:'utf8',flag:'wx'});
      return {ok:true,file,name};
    }catch(error){if(error.code!=='EEXIST')throw error;}
  }
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
    const script =
      "$default=(Get-CimInstance Win32_Printer -Filter \"Default=$true\" | Select-Object -First 1 -ExpandProperty Name); " +
      '$names=@(Get-Printer | Select-Object -ExpandProperty Name); ' +
      '@{ default=$default; names=$names } | ConvertTo-Json -Compress';
    execFile('powershell.exe', ['-NoProfile', '-Command', script], { timeout: 8000, windowsHide: true }, (err, stdout) => {
      if (err) return resolve([]);
      try {
        const payload = JSON.parse(String(stdout || '').trim() || '{}');
        const installed = normalizeWindowsPrinterNames((payload.names || []).join('\n'));
        resolve(buildBarTenderPrinterList(installed, payload.default));
      } catch {
        resolve([]);
      }
    });
  });
}

function readWindowsPrinterResolution(name) {
  if(process.platform!=='win32')return Promise.resolve({error:'Windows printer driver resolution is unavailable on this platform.'});
  const printerName=resolveWindowsPrinterQueueName(String(name||'').trim());
  if(!printerName)return Promise.resolve({error:'Select a printer to read its driver resolution.'});
  const encodedName=Buffer.from(printerName,'utf8').toString('base64');
  const script=`$name=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedName}')); $configuration=Get-CimInstance -ClassName Win32_PrinterConfiguration | Where-Object { $_.Name -eq $name } | Select-Object -First 1; if($null -eq $configuration){exit 2}; $configuration | Select-Object HorizontalResolution,VerticalResolution | ConvertTo-Json -Compress`;
  return new Promise(resolve=>execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{timeout:8000,windowsHide:true},(error,stdout)=>{
    if(error||!stdout?.trim())return resolve({error:'Could not read the selected printer driver resolution.'});
    try{return resolve(require('../lib/printer-resolution').readDriverResolution(JSON.parse(stdout.trim())));}
    catch{return resolve({error:'Could not read the selected printer driver resolution.'});}
  }));
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
    title: applicationWindowTitle(displayVersionLabel),
    ...(process.platform === 'win32' ? {
      titleBarStyle: 'hidden',
      titleBarOverlay: { color: '#ffffff', symbolColor: '#334155', height: 38 },
    } : {}),
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  Menu.setApplicationMenu(null);
  win.setMenuBarVisibility(false);
  pinBrowserWindowTitle(win, applicationWindowTitle(displayVersionLabel));
  win.webContents.on('before-input-event', (event, input) => {
    if (isNewDocumentShortcut(input)) {
      // Consume the native event so the renderer fallback cannot open twice.
      event.preventDefault();
      if (!input.isAutoRepeat) win.webContents.send('shortcut-new');
      return;
    }
    if (isPrintShortcut(input)) {
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
  watchEditorFiles(win);

  let closeRequestPending=false;
  const notifyCloseRequest=()=>{if(win.isDestroyed()||win.webContents.isCrashed())return;closeRequestPending=false;win.webContents.send('window-close-requested');};
  win.on('close',event=>{if(approvedCloseWindows.has(win)){approvedCloseWindows.delete(win);return;}event.preventDefault();closeRequestPending=true;if(!win.webContents.isLoadingMainFrame())notifyCloseRequest();});
  win.webContents.on('did-finish-load',()=>{if(closeRequestPending)notifyCloseRequest();});

  const persistBounds = () => {
    if (!win.isMaximized()) saveSettings({ windowBounds: win.getBounds() });
    saveSettings({ windowMaximized: win.isMaximized() });
  };
  win.on('resize', persistBounds);
  win.on('move', persistBounds);
}

const sourceSerialStore = require('../lib/source-serialization').createStore(path.join(app.getPath('userData'),'source-serialization.json'));
const printRuntime = require('./print-ipc')({ ipcMain, dialog, serialStore:sourceSerialStore, settings: loadSettings, saveSettings, printerNames: listWindowsPrinters, sendWindowsPrinterByName, sendNetwork, sendUSBWindows, sendUSBUnix, recordJob:job=>{const dir=path.join(app.getPath('userData'),'print-diagnostics');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'last-print.zpl'),job.zpl);fs.writeFileSync(path.join(dir,'last-wire.zpl'),job.wire);fs.writeFileSync(path.join(dir,'last-print.json'),JSON.stringify({time:new Date().toISOString(),connection:job.connection,count:job.count,labels:job.labels,templates:job.templates},null,2));} });

// --- IPC ---
ipcMain.handle('list-templates', () => listTemplates());
ipcMain.handle('load-template-raw', async (_e, file) => {
  let template=loadTemplateRaw(file);
  const library=template.bartender_library_template;
  if(library?.btw_url&&!library.artwork_imported&&Array.isArray(template.elements)&&!template.elements.length){
    try{
      const prepared=await ensureLibraryBtwFile({...library,relative_path:library.path},app.getPath('userData'));
      if(prepared.ok)template=restoreLegacyLibraryArtwork({...template,bartender_library_template:{...library,path:prepared.path}});
    }catch{/* Opening an existing project remains possible when its old source is unavailable. */}
  }
  return template;
});
ipcMain.handle('load-edit-history', (_e,file) => loadEditHistory(file));
ipcMain.handle('save-edit-history', (_e,{file,history}) => { try{return saveEditHistory(file,history);}catch(error){return {ok:false,error:error.message};} });
ipcMain.on('save-edit-history-sync', (event,{file,history}) => { try{event.returnValue=saveEditHistory(file,history);}catch(error){event.returnValue={ok:false,error:error.message};} });
function prepareNativeLibraryDocument(json){
  if(json?.bartender_library_template?.native_source_sha256){
    const model=require('./source-model');
    model.validate(json);model.syncCaches(json);
  }
  return json;
}
ipcMain.handle('save-template', (_e, { file, json }) => {
  try { return saveTemplate(file, prepareNativeLibraryDocument(json)); }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('create-template', (_e,json) => {
  try{return createTemplate(prepareNativeLibraryDocument(json));}catch(error){return {ok:false,error:error.message};}
});
ipcMain.on('save-template-sync', (event, { file, json }) => {
  try { event.returnValue = saveTemplate(file, prepareNativeLibraryDocument(json)); }
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
const BARTENDER_TEMPLATE_CLOUD_URL = 'https://templatebrowser.bartendercloud.com/bttemplatebrowser/';
let bartenderTemplateCloudWindow = null;
ipcMain.handle('open-bartender-template-cloud', () => {
  if (bartenderTemplateCloudWindow && !bartenderTemplateCloudWindow.isDestroyed()) {
    bartenderTemplateCloudWindow.focus();
    return { ok: true, mode: 'cloud' };
  }
  const parent = BrowserWindow.getFocusedWindow();
  bartenderTemplateCloudWindow = new BrowserWindow({
    width: 1000,
    height: 760,
    title: 'Template Browser',
    parent: parent ?? undefined,
    modal: false,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  bartenderTemplateCloudWindow.loadURL(BARTENDER_TEMPLATE_CLOUD_URL);
  bartenderTemplateCloudWindow.on('closed', () => {
    bartenderTemplateCloudWindow = null;
  });
  return { ok: true, mode: 'cloud' };
});
const { ensureLibraryBtwFile } = require('../lib/bartender-library-files');
const { readBtwMetadata } = require('../lib/btw-metadata');
const { extractBtwPreview, restoreLegacyLibraryArtwork } = require('../lib/btw-preview');
const { loadVerifiedNativePackage } = require('../lib/btw-native-package');
ipcMain.handle('ensure-bartender-library-btw', async (_event, item) => {
  try {
    const file = await ensureLibraryBtwFile(item, app.getPath('userData'));
    if (!file.ok) return file;
    const bytes=fs.readFileSync(file.path),nativePackage=loadVerifiedNativePackage(bytes);
    const metadata = readBtwMetadata(file.path);
    const artwork = extractBtwPreview(bytes, metadata);
    if(nativePackage)return {...file,metadata:{...metadata,width_mm:nativePackage.width_mm,height_mm:nativePackage.height_mm,width_in:nativePackage.width_mm/25.4,height_in:nativePackage.height_mm/25.4,page_width_in:nativePackage.page.width_mm/25.4,page_height_in:nativePackage.page.height_mm/25.4},artwork,native_package:nativePackage,import_mode:'verified-native-objects',elements:nativePackage.elements,objects_decomposed:true};
    if (!artwork) return { ok:false, error:'This BTW template has no supported artwork preview. It cannot be opened as an empty label.' };
    // The embedded preview is a raster. Guessing editable text/barcode regions
    // from it changes the label artwork, so retain the complete image.
    return { ...file, metadata, artwork, elements: null, objects_decomposed: false,import_mode:'preview-only',conversion_error:'Editable native conversion is not verified for this template. Preview only; Finish cannot create an editable document.' };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
ipcMain.handle('list-printers', () => listWindowsPrinters());
ipcMain.handle('printer-paper-sources', (_event,printerName) => require('../lib/printer-paper-sources').readPaperSources(printerName));
ipcMain.handle('get-printer-resolution', (_e, name) => readWindowsPrinterResolution(name));
let installedFontFamiliesPromise=null;
ipcMain.handle('get-installed-font-families',()=>{
  installedFontFamiliesPromise ||= require('../lib/font-families').getInstalledFontFamilies();
  return installedFontFamiliesPromise;
});

// Apri un file (CSV o JSON) e restituisci nome + contenuto testuale.
ipcMain.handle('pick-file', async (_e, kind) => {
  const symbolImport=kind==='symbol';
  const filters = symbolImport ? [{name:'Symbol artwork',extensions:['svg','png','jpg','jpeg','webp']}] : kind === 'xml' ? [{name:'XML',extensions:['xml']}] : kind === 'csv'
    ? [{ name: 'CSV', extensions: ['csv', 'txt'] }]
    : [{ name: 'Template JSON', extensions: ['json'] }];
  const r = await dialog.showOpenDialog({ properties: symbolImport?['openFile','multiSelections']:['openFile'], filters });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  try {
    if(symbolImport){
      if(r.filePaths.length>50)return {canceled:true,error:'Import up to 50 symbols at a time.'};
      const allowed=new Set(['.svg','.png','.jpg','.jpeg','.webp']);
      const files=r.filePaths.map(file=>{
        if(!allowed.has(path.extname(file).toLowerCase()))throw new Error('Choose SVG, PNG, JPG, or WebP symbol files.');
        const data=fs.readFileSync(file);if(data.length>5*1024*1024)throw new Error(`${path.basename(file)} is larger than 5 MB.`);
        const ext=path.extname(file).toLowerCase(),mime=ext==='.svg'?'image/svg+xml':ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg';
        return {name:path.basename(file),mime,base64:data.toString('base64')};
      });
      return {canceled:false,files};
    }
    const content = fs.readFileSync(r.filePaths[0], 'utf8');
    return { canceled: false, name: path.basename(r.filePaths[0]), content };
  } catch (e) { return { canceled: true, error: e.message }; }
});

// Salva contenuto testuale scegliendo dove (Salva con nome).
ipcMain.handle('save-file', async (_e, payload = {}) => {
  const { defaultName, content } = payload;
  const dialogOptions = labelDocument.isLabelDocumentSave(payload)
    ? labelDocument.labelDocumentSaveDialogOptions({ defaultName })
    : { defaultPath: defaultName || 'export.json' };
  const r = await dialog.showSaveDialog(dialogOptions);
  if (r.canceled || !r.filePath) return { canceled: true };
  const filePath = labelDocument.isLabelDocumentSave(payload)
    ? labelDocument.normalizeSavedLabelDocumentPath(r.filePath)
    : r.filePath;
  try { fs.writeFileSync(filePath, content, 'utf8'); return { canceled: false, path: filePath }; }
  catch (e) { return { canceled: true, error: e.message }; }
});

ipcMain.handle('save-png', async (_e, { defaultName, dataUrl, dpi=203 }) => {
  const r = await dialog.showSaveDialog({
    defaultPath: defaultName || 'label.png',
    filters: [{ name: 'PNG', extensions: ['png'] }],
  });
  if (r.canceled || !r.filePath) return { canceled: true };
  try {
    fs.writeFileSync(r.filePath, require('../lib/export-png').encodeExportPng(dataUrl,dpi));
    return { canceled: false, path: r.filePath };
  } catch (e) { return { canceled: true, error: e.message }; }
});

// Render the label image onto exact-size pages and save it as a PDF (hidden, sandboxed window).
function renderLabelPdf(options) {
  return require('../lib/export-pdf').renderPdf({ BrowserWindow, tmpDir: app.getPath('temp'), ...options });
}

ipcMain.handle('save-pdf', async (_e, { defaultName, dataUrl, svgPages, width_mm, height_mm, copies = 1 }) => {
  try {
    const r = await dialog.showSaveDialog({ defaultPath: defaultName || 'label.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (r.canceled || !r.filePath) return { canceled: true };
    const pdf = await renderLabelPdf({ dataUrl, svgPages, width_mm, height_mm, copies });
    fs.writeFileSync(r.filePath, pdf);
    return { canceled: false, path: r.filePath };
  } catch (e) { return { canceled: true, error: e.message }; }
});

ipcMain.handle('copy-image', async (_e, {dataUrl}) => {
  try {
    const image=require('electron').nativeImage.createFromDataURL(dataUrl);
    if(image.isEmpty())throw Error('Could not decode exported image.');
    clipboard.writeImage(image);
    return {ok:true};
  } catch(error){return {error:error.message};}
});

ipcMain.handle('import-access',async()=>{const selected=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'Microsoft Access',extensions:['mdb','accdb']}]});if(selected.canceled||!selected.filePaths[0])return {canceled:true};try{return {ok:true,fileName:path.basename(selected.filePaths[0]),filePath:selected.filePaths[0],tables:await require('../lib/access-database').readAccess(selected.filePaths[0])};}catch(error){return {error:error.message};}});
ipcMain.handle('reload-access',async(_event,file)=>{try{return {ok:true,tables:await require('../lib/access-database').readAccess(file)};}catch(error){return {error:error.message};}});


// Rasterizza lo ZPL reale (stesso payload inviato alla stampante) in PNG via Labelary.
ipcMain.handle('render-label-png', async (_e, payload) => {
  try {
    const printSettings=loadSettings();
    const job = await require('../lib/print-job').preparePrintJobAsync(payload, printSettings);
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

ipcMain.handle('barcode-catalog',()=>require('../lib/barcode-catalog').catalog);
ipcMain.handle('barcode-encode',async(_event,spec)=>{try{return {ok:true,...await require('../lib/barcode-catalog').encode(spec)};}catch(error){return {ok:false,error:error.message};}});
require('../lib/source-ipc')({ipcMain,dialog,settings:loadSettings,serialStore:sourceSerialStore});

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
ipcMain.handle('remember-print-registration', (_e, {connection,template,dataUrl}) => {
  try {
    if(typeof dataUrl!=='string'||dataUrl.length>16000000||!dataUrl.startsWith('data:image/png;base64,'))throw Error('Choose a PNG registration photo smaller than 10 MB.');
    const bytes=Buffer.from(dataUrl.slice('data:image/png;base64,'.length),'base64');
    if(bytes.length<24||bytes.readUInt32BE(16)*bytes.readUInt32BE(20)>5000000)throw Error('The registration image is too large.');
    const saved=loadSettings(),profiles=require('../lib/printer-media-profile'),key=profiles.connectionKey(connection),profile=saved.printerProfiles?.[key];
    if(!profile||saved.printerMediaModes?.[key]==='manual')throw Error('Read this printer in Automatic size mode before remembering photo alignment.');
    const base=template?.print_media||saved.printerMedia?.[key]||{width_mm:template?.width_mm,gap_y_mm:template?.stock?.gap_mm};
    const media=profiles.profileMedia(profile,base),photo=require('pngjs').PNG.sync.read(bytes),registration=require('./photo-registration').analyze(photo,media);
    if(registration.offsetX<0||registration.scaleY>100.1)throw Error('The detected sticker extends outside the calibrated print area. Reposition or recalibrate the media before saving.');
    const signature=require('./photo-registration').mediaSignature(media,profile),dir=path.join(app.getPath('userData'),'print-registration');fs.mkdirSync(dir,{recursive:true});
    const hash=require('crypto').createHash('sha256').update(bytes).digest('hex').slice(0,20),photoPath=path.join(dir,hash+'.png');fs.writeFileSync(photoPath,bytes);
    Object.assign(registration,{enabled:true,printer_key:key,media_signature:signature,photo_path:photoPath,dots_per_mm:profile.dots_per_mm,length_dots:profile.length_dots,tracking:profile.tracking});
    const reportPath=path.join(dir,hash+'.json');fs.writeFileSync(reportPath,JSON.stringify(registration,null,2));
    const printRegistrations={...saved.printRegistrations,[key]:{...saved.printRegistrations?.[key],[signature]:registration}},result=saveSettings({printRegistrations});
    if(result.error)throw Error(result.error);return {ok:true,registration,printRegistrations};
  } catch(error) {return {ok:false,error:error.message};}
});
ipcMain.on('save-settings-sync', (event, obj) => { event.returnValue = saveSettings(obj); });
ipcMain.handle('reset-settings', () => {
  try { fs.writeFileSync(SETTINGS_FILE, '{}', 'utf8'); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('app-version', () => displayVersionLabel);
ipcMain.on('window-close-handler-status',event=>{event.returnValue=true;});
ipcMain.on('approve-window-close',event=>{const win=BrowserWindow.fromWebContents(event.sender);if(!win||win.isDestroyed())return;approvedCloseWindows.add(win);win.close();});
function revealApplicationWindowForClosePrompt(win){
  if(!win||win.isDestroyed())return;
  if(win.isMinimized()){win.flashFrame(true);win.restore();}
  if(!win.isVisible())win.show();
  win.show();
  if(typeof win.moveTop==='function')win.moveTop();
  win.focus();
  try{app.focus({steal:true});}catch(_){}
  if(process.platform==='win32'||process.platform==='linux'){
    win.setAlwaysOnTop(true,'pop-up-menu');
    setImmediate(()=>{if(!win.isDestroyed())win.setAlwaysOnTop(false);});
  }
}
ipcMain.on('reveal-window-for-close-prompt',event=>{revealApplicationWindowForClosePrompt(BrowserWindow.fromWebContents(event.sender));});
ipcMain.on('modal-window-active',(event,active)=>{const win=BrowserWindow.fromWebContents(event.sender);if(!win||win.isDestroyed())return;win.setMinimizable(active!==true);});
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
    const lnk = path.join(app.getPath('desktop'), 'Q LABEL.lnk');
    if (!fs.existsSync(lnk)) {
      shell.writeShortcutLink(lnk, 'create', {
        target: process.execPath,
        description: 'Q LABEL — Zebra label designer and printer',
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
    const lnk = path.join(app.getPath('desktop'), 'Q LABEL.lnk');
    shell.writeShortcutLink(lnk, 'create', { target, description: 'Q LABEL — Zebra label designer and printer', icon: target, iconIndex: 0 });
    saveSettings({ shortcutCreated: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

app.whenReady().then(() => {
  configureApplicationIdentity(app, { packaged: app.isPackaged });
  ensureUserDirs();
  if (process.platform === 'win32') {
    const registration = require('../lib/windows-qlabel-association').registerWindowsQlabelDocumentType({ appName: APP_NAME });
    if (!registration.ok && !registration.skipped) console.warn('Could not register .qlabel file type:', registration.error);
  }
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
