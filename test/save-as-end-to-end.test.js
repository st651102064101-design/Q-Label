'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {EventEmitter}=require('node:events');
const { createRequire } = require('node:module');
const { JSDOM } = require('jsdom');
const guiDir = path.resolve(__dirname, '../gui');
const read = file => fs.readFileSync(path.join(guiDir, file), 'utf8');
const productionRequire = createRequire(path.join(guiDir, 'main.js'));
const plain = value => JSON.parse(JSON.stringify(value));
const fixture = () => ({
  name: 'Original', width_mm: 75, height_mm: 53, dpi: 203,
  elements: [{ type: 'text', text: 'ข้อความต้นฉบับ', x_mm: 3, y_mm: 4 }, { type: 'barcode128', text: '12345678', x_mm: 10, y_mm: 10 }],
  page: { rows: 2, columns: 3, top_mm: 1 },
  background: { bitmap_hex: 'FFFF', opacity: 0.5 },
  field_meta: { product: { type: 'select', options: ['สินค้า ก', 'สินค้า ข'] } },
});

function harness(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bratender-save-as-'));
  assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
  const appData = path.join(root, 'app-data');
  const userData = path.join(appData, 'Bratender');
  const appPaths = new Map([['appData', appData]]);
  const handlers = new Map();
  const calls = { dialog: [], ipc: [], stages: [], alerts: [], status: [], normalSave: 0 };
  const rendererEvents=new EventEmitter();
  const filePath = path.join(root, options.filename || 'My Copy.json');
  const electron = {
    app: { setName() {}, setPath: (name,value)=>appPaths.set(name,value), commandLine: { appendSwitch() {} }, getPath: name => appPaths.get(name), whenReady: () => ({ then() {} }), on() {} },
    ipcMain: { handle: (channel, fn) => handlers.set(channel, fn), on() {} },
    dialog: { showSaveDialog: async args => {
      calls.dialog.push(plain(args));
      if (options.dialogError) throw new Error(options.dialogError);
      return options.dialog ? options.dialog(args) : { canceled: false, filePath };
    } },
    BrowserWindow: {}, Menu: {}, shell: {}, clipboard: {},
  };
  const fileSystem = new Proxy(fs, { get(target, key) {
    if (key !== 'writeFileSync') return target[key];
    return (file, ...args) => {
      if (options.writeError?.(String(file))) throw new Error('EACCES: write denied');
      return target.writeFileSync(file, ...args);
    };
  } });
  const mainContext = vm.createContext({
    require: name => name === 'electron' ? electron : name === 'fs' ? fileSystem : productionRequire(name),
    __dirname: guiDir, console, process, Buffer, setTimeout, clearTimeout, URL,
  });
  // Register the production IPC handlers without starting windows or printers.
  vm.runInContext(read('main.js'), mainContext, { filename: 'gui/main.js' });
  vm.runInContext('ensureUserDirs()', mainContext);
  const userTemplates = path.join(userData, 'templates');
  const originalPath = path.join(userTemplates, 'Original.json');
  const originalBytes = JSON.stringify(fixture(), null, 2);
  fs.writeFileSync(originalPath, originalBytes, 'utf8');
  const markup = options.realEditorFunctions ? read('index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '') : '<!doctype html><input id="name"><textarea></textarea><select><option>value</option></select><div contenteditable="true"></div><button>Save</button>';
  const dom = new JSDOM(markup, { runScripts: 'dangerously' });
  t.after(() => { dom.window.close(); fs.rmSync(root, { recursive: true, force: true }); });
  const w = dom.window;
  w.structuredClone = structuredClone;
  w.editing = options.noEditor ? null : fixture();
  w.alert = message => calls.alerts.push(String(message));
  vm.runInNewContext(read('preload.js'), { require: name => {
    assert.equal(name, 'electron');
    return {
      contextBridge: { exposeInMainWorld: (name, api) => { w[name] = api; } },
      ipcRenderer: { on:rendererEvents.on.bind(rendererEvents),removeListener:rendererEvents.removeListener.bind(rendererEvents),sendSync: () => false, invoke: async (channel, payload) => {
        calls.ipc.push(channel);
        assert.ok(handlers.has(channel), `Production IPC handler exists: ${channel}`);
        const result = await handlers.get(channel)({}, payload === undefined ? undefined : structuredClone(payload));
        return structuredClone(result);
      } },
    };
  } }, { filename: 'gui/preload.js' });
  if (options.realEditorFunctions) {
    const input = w.document.createElement('input'); input.id = 'name'; w.document.body.append(input);
  }
  w.document.getElementById('name').value = 'ค่าล่าสุด UTF-8 ✓';
  w.readEditorIntoDraft = () => {
    calls.stages.push('read');
    if (options.readError) throw new Error(options.readError);
    w.editing.elements[0].text = w.document.getElementById('name').value;
  };
  w.reloadTemplates = async () => {
    calls.stages.push('reload');
    if (options.reloadError) throw new Error(options.reloadError);
    w.templates = await w.zebra.listTemplates();
  };
  w.selectTemplate = async file => {
    calls.stages.push('select');
    if (options.selectError) throw new Error(options.selectError);
    w.editing = await w.zebra.loadTemplateRaw(file);
    w.selectedFile = file;
  };
  w.setEditorStatus = (...args) => { calls.stages.push('status'); calls.status.push(args); };
  w.saveLabelNow = async () => { calls.normalSave++; };
  w.eval(read('save-as-flow.js'));
  const ribbon = read('ribbon.js');
  const start = ribbon.indexOf('  async function saveAs()');
  const end = ribbon.indexOf('  window.saveLabelNow=', start);
  assert.ok(start >= 0 && end > start);
  w.eval(ribbon.slice(start, end));
  const productionSaveAs = w.saveLabelAs;
  let pending;
  w.saveLabelAs = () => { pending = productionSaveAs(); return pending; };
  const renderer = read('renderer.js');
  const keysStart = renderer.indexOf('  const shortcutKey=');
  const keysEnd = renderer.indexOf('  window.zebra.onPrintShortcut', keysStart);
  assert.ok(keysStart >= 0 && keysEnd > keysStart);
  w.eval(renderer.slice(keysStart, keysEnd));
  if (options.realEditorFunctions) installRealEditorFunctions(w, calls, renderer);
  const dispatch = (args = {}) => {
    pending = null;
    const event = new w.KeyboardEvent('keydown', { key: 'S', code: 'KeyS', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true, ...args });
    (args.target || w.document.getElementById('name')).dispatchEvent(event);
    return event;
  };
  const complete = async () => {
    let result, error;
    try { result = await pending; } catch (e) { error = e; }
    await new Promise(resolve => setImmediate(resolve));
    return { result, error };
  };
  return { w, calls, root, filePath, userTemplates, originalPath, originalBytes, dispatch, complete,
    press: async args => { const event = dispatch(args); return { event, ...await complete() }; },
    readJson: file => JSON.parse(fs.readFileSync(file, 'utf8')),
    assertOriginal: () => assert.equal(fs.readFileSync(originalPath, 'utf8'), originalBytes),
  };
}

function installRealEditorFunctions(w, calls, renderer) {
  w.el = id => w.document.getElementById(id);
  w.settings = { unit: 'mm' }; w.editorSel = null; w.readingForSave = true;
  w.measureUnit = () => 'mm'; w.unitToMm = value => Number(value);
  w.getConnection = () => ({ type: 'ip' });
  w.PrintGeometry = productionRequire('./print-geometry');
  w.EditHistory = productionRequire('./edit-history');
  w.ProjectPrinterSelection = productionRequire('./project-printer-selection');
  w.availablePrinters = null; w.updateConnSummary = () => {};
  const printerStart = renderer.indexOf('function applyProjectPrinter(');
  w.eval(renderer.slice(printerStart, renderer.indexOf('window.rememberProjectPrinter=', printerStart)));
  w.rememberRecentTemplate = () => {};
  const start = renderer.indexOf('const pageFields =');
  w.eval(renderer.slice(start, renderer.indexOf('function refreshEditorUI()', start)));
  const readStart = renderer.indexOf('function readEditorIntoDraft()');
  w.eval(renderer.slice(readStart, renderer.indexOf('let readingForSave', readStart)));
  const reloadStart = renderer.indexOf('async function reloadTemplates(');
  w.eval(renderer.slice(reloadStart, renderer.indexOf('async function init()', reloadStart)));
  const selectStart = renderer.indexOf('async function selectTemplate(');
  w.eval(renderer.slice(selectStart, renderer.indexOf('function setPreviewLoading(', selectStart)));
  w.eval('var editRevisions=[],undoStack=[],redoStack=[],editHistoryFile=null,MAX_EDIT_REVISIONS=5;function updateUndoButtons(){};window.recordEditRevision=()=>{}');
  const restoreStart = renderer.indexOf('function restoreEditHistory(');
  w.eval(renderer.slice(restoreStart, renderer.indexOf('function persistEditHistory(', restoreStart)));
  w.current = null; w.templates = []; w.defaultCopies = 1;
  w.setPreviewLoading = w.seedTemplateValues = w.renderTemplateList = w.applyPrintPage = () => {};
  w.openEditor = raw => { w.editing = structuredClone(raw); };
  w.el('editorView').style.display = '';
  for (const [id, value] of Object.entries({ edDesc: ' latest description ', edDpi: 300, edW: 75, edH: 53, edTear: 12, stockName: 'Test stock', stockType: 'black-mark', stockLeft: 2, stockRight: 3, backgroundOpacity: 75, pageW: 75, pageH: 53, pageRows: 2, pageCols: 3, pageTop: 1, pageBottom: 1, pageLeft: 1, pageRight: 1, pageGapX: 0, pageGapY: 0 })) w.el(id).value = String(value);
  w.el('pageEnabled').checked = false; w.el('printBackground').checked = true;
  w.el('edFieldMeta').innerHTML = '<div class="fm-row"><input class="fm-name" value="product"><input class="fm-type" value="select"><input class="fm-label" value="ชื่อสินค้า"><textarea class="fm-options">สินค้า ก\nสินค้า ข</textarea></div>';
  const live = w.document.createElement('textarea'); live.id = 'canvasTextEditor'; live.dataset.elementIndex = '0'; live.value = 'ข้อความล่าสุดจาก canvas ✓'; w.document.body.append(live);
  const actualRead = w.readEditorIntoDraft, actualReload = w.reloadTemplates, actualSelect = w.selectTemplate;
  w.readEditorIntoDraft = () => { calls.stages.push('read'); return actualRead(); };
  w.reloadTemplates = async () => { calls.stages.push('reload'); return actualReload(); };
  w.selectTemplate = async file => { calls.stages.push('select'); await actualSelect(file); w.selectedFile = w.current.file; };
}

test('New creates distinct numbered project files and later Save keeps the selected filename',async t=>{
  const h=harness(t),original={...fixture(),name:'new-label'};
  const originalFile=path.join(h.userTemplates,'new-label.json');
  fs.writeFileSync(originalFile,JSON.stringify(original));
  const before=fs.readFileSync(originalFile,'utf8');
  const created=await Promise.all([h.w.zebra.createTemplate({...fixture(),name:'new-label'}),h.w.zebra.createTemplate({...fixture(),name:'new-label'})]);
  assert.deepEqual(created.map(result=>result.file),['new-label (1).json','new-label (2).json']);
  assert.deepEqual(created.map(result=>result.name),['new-label (1)','new-label (2)']);
  assert.equal(fs.readFileSync(originalFile,'utf8'),before);
  const first=h.readJson(path.join(h.userTemplates,created[0].file));
  first.elements[0].text='Edited new project';
  const saved=await h.w.zebra.saveTemplate(created[0].file,first);
  assert.equal(saved.file,created[0].file);
  assert.equal(h.readJson(path.join(h.userTemplates,saved.file)).elements[0].text,'Edited new project');
  assert.equal(fs.existsSync(path.join(h.userTemplates,'new-label__1_.json')),false);
  assert.equal(fs.readFileSync(originalFile,'utf8'),before);
  assert.equal(h.readJson(path.join(h.userTemplates,created[1].file)).elements[0].text,fixture().elements[0].text);
});

test('New reserves existing display names and case-insensitive filenames, including unreadable files',async t=>{
  const h=harness(t);
  fs.writeFileSync(path.join(h.userTemplates,'imported.json'),JSON.stringify({...fixture(),name:'NEW-LABEL'}));
  fs.writeFileSync(path.join(h.userTemplates,'NEW-LABEL (1).json'),'broken original');
  const result=await h.w.zebra.createTemplate({...fixture(),name:'new-label'});
  assert.equal(result.file,'new-label (2).json');
  assert.equal(fs.readFileSync(path.join(h.userTemplates,'NEW-LABEL (1).json'),'utf8'),'broken original');
});

test('New propagates write failure without changing existing projects',async t=>{
  const h=harness(t,{writeError:file=>path.basename(file)==='new-label.json'});
  const result=await h.w.zebra.createTemplate({...fixture(),name:'new-label'});
  assert.equal(result.ok,false);assert.match(result.error,/EACCES/);h.assertOriginal();
});

test('actual renderer readEditorIntoDraft, reloadTemplates and selectTemplate save current controls and load the saved copy', async t => {
  const h = harness(t, { realEditorFunctions: true });
  const { error } = await h.press(); assert.equal(error, undefined);
  assert.deepEqual(h.calls.alerts, []);
  assert.deepEqual(h.calls.ipc, ['save-file', 'save-template', 'list-templates', 'load-template-raw', 'save-settings', 'load-edit-history']);
  const saved = h.readJson(path.join(h.userTemplates, h.w.selectedFile));
  assert.equal(saved.description, 'latest description'); assert.equal(saved.dpi, 300);
  assert.equal(saved.width_mm, 75); assert.equal(saved.height_mm, 53);
  assert.equal(saved.tear_off, 12); assert.equal(saved.media_tracking, 'M');
  assert.equal(saved.stock.name, 'Test stock'); assert.equal(saved.stock.liner_left_mm, 2);
  assert.equal(saved.stock.liner_right_mm, 3); assert.equal(saved.background.opacity, 0.75);
  assert.equal(saved.print_background, true);
  assert.equal(saved.elements[0].text, 'ข้อความล่าสุดจาก canvas ✓');
  assert.deepEqual(saved.field_meta.product.options, ['สินค้า ก', 'สินค้า ข']);
  assert.equal(saved.field_meta.product.label, 'ชื่อสินค้า');
  assert.deepEqual(plain(h.w.editing), saved);
  assert.equal(h.w.current.file, 'My_Copy.json');
  assert.equal(h.w.templates.some(template => template.file === 'My_Copy.json'), true);
  h.assertOriginal();
});

test('start to end: shortcut → ribbon → preload → dialog IPC → UTF-8 file → library → reload → select → status', async t => {
  const h = harness(t);
  const { event, result, error } = await h.press();
  assert.equal(error, undefined);
  assert.equal(event.defaultPrevented, true);
  assert.equal(h.calls.dialog.length, 1);
  assert.equal(h.calls.dialog[0].defaultPath, 'Original-copy.qlabel');
  assert.equal(h.calls.dialog[0].filters?.[0]?.extensions?.[0], 'qlabel');
  assert.deepEqual(h.calls.ipc, ['save-file', 'save-template', 'list-templates', 'load-template-raw']);
  assert.deepEqual(h.calls.stages, ['read', 'reload', 'select', 'status']);
  assert.equal(result.path, h.filePath);
  assert.equal(h.w.selectedFile, 'My_Copy.json');
  const exported = h.readJson(h.filePath);
  const library = h.readJson(path.join(h.userTemplates, 'My_Copy.json'));
  assert.equal(library.name, 'My Copy');
  assert.equal(library.elements[0].text, h.w.document.getElementById('name').value);
  for (const key of ['elements', 'page', 'background', 'field_meta', 'width_mm', 'height_mm', 'dpi']) assert.deepEqual(exported[key], library[key]);
  assert.deepEqual(plain(h.w.editing.elements), library.elements);
  assert.ok(h.w.templates.some(template => template.file === h.w.selectedFile && template.name === 'My Copy'));
  assert.deepEqual(h.calls.status, [['ok', 'Saved successfully: ' + h.filePath]]);
  assert.deepEqual(h.calls.alerts, []); h.assertOriginal();
});

for (const target of ['input', 'textarea', 'select', '[contenteditable]', 'button', 'body']) {
  test(`Ctrl+Shift+S saves once while focused on ${target}, even if it stops bubbling`, async t => {
    const h = harness(t); const element = h.w.document.querySelector(target);
    element.addEventListener('keydown', event => event.stopPropagation());
    await h.press({ target: element });
    assert.equal(h.calls.dialog.length, 1);
    assert.equal(h.calls.ipc.filter(channel => channel === 'save-template').length, 1);
    assert.equal(h.w.editing.name, 'My Copy');
  });
}
for (const [label, keys] of [
  ['Cmd+Shift+S', { ctrlKey: false, metaKey: true }], ['lowercase s', { key: 's' }],
  ['Thai keyboard uses physical KeyS', { key: 'ฆ' }], ['missing code uses key fallback', { key: 'S', code: '' }],
]) test(`${label} opens Save As`, async t => {
  const h = harness(t); await h.press(keys);
  assert.equal(h.calls.dialog.length, 1); assert.equal(h.w.selectedFile, 'My_Copy.json');
});
for (const [label, keys] of [
  ['Ctrl+S uses normal Save', { shiftKey: false }], ['Shift+S without Ctrl/Cmd', { ctrlKey: false }],
  ['plain S', { ctrlKey: false, shiftKey: false }], ['different key', { key: 'Q', code: 'KeyQ' }],
]) test(`${label} does not open Save As`, async t => {
  const h = harness(t); await h.press(keys);
  assert.equal(h.calls.dialog.length, 0);
  assert.equal(h.calls.normalSave, label.startsWith('Ctrl+S') ? 1 : 0); h.assertOriginal();
});
for (const target of ['input','textarea','select','[contenteditable="true"]']) test(`Ctrl+S uses the physical key while editing ${target}`,async t=>{
  const h=harness(t),element=h.w.document.querySelector(target);
  element.addEventListener('keydown',event=>event.stopPropagation());
  const {event}=await h.press({target:element,key:'ฆ',code:'KeyS',shiftKey:false});
  assert.equal(event.defaultPrevented,true);assert.equal(h.calls.normalSave,1);assert.equal(h.calls.dialog.length,0);
});
test('save notification is outside the hidden editor content',()=>{
  const dom=new JSDOM(read('index.html'));const status=dom.window.document.getElementById('editorStatus');
  assert.ok(status);assert.equal(status.closest('#editorView'),null,'toast is not inside the hidden editor content');dom.window.close();
});
test('no document: shortcut and direct Save As do not read, write, or open a dialog', async t => {
  const h = harness(t, { noEditor: true }); await h.press(); await h.w.saveLabelAs();
  assert.deepEqual(h.calls.ipc, []); assert.deepEqual(h.calls.stages, []);
  assert.equal(h.calls.dialog.length, 0); h.assertOriginal();
});
for (const [label, response] of [
  ['Cancel', { canceled: true }], ['empty path', { canceled: false, filePath: '' }], ['missing path', { canceled: false }],
]) test(`${label}: preserves editor and stops before library/reload/select`, async t => {
  const h = harness(t, { dialog: async () => response }); const original = h.w.editing;
  const { result, error } = await h.press();
  assert.equal(error, undefined); assert.equal(result.canceled, true); assert.equal(h.w.editing, original);
  assert.deepEqual(h.calls.ipc, ['save-file']); assert.deepEqual(h.calls.stages, ['read']);
  assert.deepEqual(h.calls.alerts, []); assert.deepEqual(h.calls.status, []);
  assert.equal(fs.existsSync(h.filePath), false); h.assertOriginal();
});
for (const filename of ['Thai ฉลาก.json', 'Copy.JSON', 'copy.with.dots.json']) test(`${filename}: saved file and library copy can be read back`, async t => {
  const h = harness(t, { filename }); const { error } = await h.press(); assert.equal(error, undefined);
  assert.equal(h.w.editing.name, filename.replace(/\.json$/i, ''));
  assert.ok(fs.existsSync(path.join(h.userTemplates, h.w.selectedFile)));
  assert.equal(h.readJson(h.filePath).elements[0].text, h.w.editing.elements[0].text);
});
test('unnamed document proposes label-copy.qlabel', async t => {
  const h = harness(t); h.w.editing.name = ''; await h.press(); assert.equal(h.calls.dialog[0].defaultPath, 'label-copy.qlabel');
});
test('awaits chooser and saves an immutable snapshot of nested editor data', async t => {
  let resolveDialog; const waiting = new Promise(resolve => { resolveDialog = resolve; });
  const h = harness(t, { dialog: () => waiting }); h.dispatch();
  assert.deepEqual(h.calls.ipc, ['save-file']); assert.deepEqual(h.calls.stages, ['read']);
  assert.equal(fs.existsSync(h.filePath), false);
  const snapshot = plain(h.w.editing);
  h.w.editing.elements[0].text = 'changed while chooser is open'; h.w.editing.field_meta.product.options.push('another option');
  resolveDialog({ canceled: false, filePath: h.filePath });
  const { error } = await h.complete(); assert.equal(error, undefined);
  assert.deepEqual(h.readJson(h.filePath), snapshot);
  assert.deepEqual(plain(h.w.editing.elements), snapshot.elements);
  assert.deepEqual(plain(h.w.editing.field_meta), snapshot.field_meta); h.assertOriginal();
});
for (const [stage, options, expected, ipc, stages] of [
  ['read editor', { readError: 'Cannot read editor' }, 'Cannot read editor', [], ['read']],
  ['dialog', { dialogError: 'Dialog unavailable' }, 'Dialog unavailable', ['save-file'], ['read']],
  ['export write', { writeError: file => path.basename(file) === 'My Copy.json' }, 'EACCES: write denied', ['save-file'], ['read']],
  ['library write', { writeError: file => path.basename(file) === 'My_Copy.json' }, 'EACCES: write denied', ['save-file', 'save-template'], ['read']],
  ['reload', { reloadError: 'Cannot reload library' }, 'Cannot reload library', ['save-file', 'save-template'], ['read', 'reload']],
  ['select', { selectError: 'Cannot load copy' }, 'Cannot load copy', ['save-file', 'save-template', 'list-templates'], ['read', 'reload', 'select']],
]) test(`${stage} failure: shows error, stops following stages, preserves original, never reports success`, async t => {
  const h = harness(t, options); const original = h.w.editing; await h.press();
  assert.deepEqual(h.calls.alerts, [expected]); assert.deepEqual(h.calls.status, []);
  assert.deepEqual(h.calls.ipc, ipc); assert.deepEqual(h.calls.stages, stages);
  assert.equal(h.w.editing, original); h.assertOriginal();
});
test('invalid save response without path stops before library creation', async t => {
  const h = harness(t); h.w.zebra.saveFile = async () => ({ canceled: false }); await h.press();
  assert.deepEqual(h.calls.alerts, ['The save dialog did not return a file path']);
  assert.deepEqual(h.calls.ipc, []); assert.deepEqual(h.calls.status, []); h.assertOriginal();
});
test('library failure without message uses readable fallback', async t => {
  const h = harness(t); h.w.zebra.saveTemplate = async () => ({ ok: false }); await h.press();
  assert.deepEqual(h.calls.alerts, ['Could not save label']); assert.deepEqual(h.calls.status, []); h.assertOriginal();
});
test('a failed dialog can be retried successfully', async t => {
  let attempt = 0; const h = harness(t, { dialog: async () => {
    if (++attempt === 1) throw new Error('Temporary dialog failure'); return { canceled: false, filePath: h.filePath };
  } });
  await h.press(); assert.deepEqual(h.calls.alerts, ['Temporary dialog failure']); await h.press();
  assert.equal(h.w.selectedFile, 'My_Copy.json'); assert.equal(h.calls.dialog.length, 2);
  assert.equal(h.calls.status.length, 1); h.assertOriginal();
});

test('pressing Save As again while the chooser is open shares one save operation', async t => {
  let resolveDialog;
  const waiting = new Promise(resolve => { resolveDialog = resolve; });
  const h = harness(t, { dialog: () => waiting });
  h.dispatch(); h.dispatch();
  const dialogCount = h.calls.dialog.length;
  resolveDialog({ canceled: false, filePath: h.filePath });
  await h.complete();
  assert.equal(dialogCount, 1);
  assert.equal(h.calls.ipc.filter(channel => channel === 'save-template').length, 1);
  assert.equal(h.calls.status.length, 1);
});

test('holding the shortcut does not open more dialogs; a fresh keypress still works', async t => {
  const h = harness(t);
  await h.press();
  await h.press({ repeat: true });
  assert.equal(h.calls.dialog.length, 1);
  await h.press();
  assert.equal(h.calls.dialog.length, 2);
  assert.equal(h.calls.status.length, 2);
});

test('canceling releases the save operation so the next attempt succeeds', async t => {
  let attempt = 0;
  const h = harness(t, { dialog: async () => ++attempt === 1 ? { canceled: true } : { canceled: false, filePath: h.filePath } });
  await h.press();
  assert.equal(h.calls.status.length, 0);
  await h.press();
  assert.equal(h.calls.dialog.length, 2);
  assert.equal(h.calls.status.length, 1);
  assert.equal(h.w.selectedFile, 'My_Copy.json');
});
