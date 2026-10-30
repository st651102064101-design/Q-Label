'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {resolveProjectPrinter,rememberProjectPrinter}=require('../gui/project-printer-selection');

test('project printer preference is independent for each label project',()=>{
  const settings={printer:'Zebra ZT610 (600 dpi)'};
  rememberProjectPrinter(settings,'labels/a.json','Zebra ZT411 (600 dpi)');
  rememberProjectPrinter(settings,'labels/b.json','Zebra ZT610 (600 dpi)');

  assert.equal(resolveProjectPrinter(settings,'labels/a.json',['Zebra ZT610 (600 dpi)','Zebra ZT411 (600 dpi)']),'Zebra ZT411 (600 dpi)');
  assert.equal(resolveProjectPrinter(settings,'labels/b.json',['Zebra ZT610 (600 dpi)','Zebra ZT411 (600 dpi)']),'Zebra ZT610 (600 dpi)');
  assert.equal(settings.printer,'Zebra ZT610 (600 dpi)','the application fallback remains the last globally selected printer');
});

test('unavailable project printer falls back to the installed application printer',()=>{
  const settings={printer:'Zebra ZT610 (600 dpi)',projectPrinters:{'labels/a.json':'Zebra ZT411 (600 dpi)'}};
  assert.equal(resolveProjectPrinter(settings,'labels/a.json',['Zebra ZT610 (600 dpi)']),'Zebra ZT610 (600 dpi)');
});

test('missing project history uses the installed application printer then first available',()=>{
  assert.equal(resolveProjectPrinter({printer:'Zebra ZT411'},'labels/new.json',['Zebra ZT610','Zebra ZT411']),'Zebra ZT411');
  assert.equal(resolveProjectPrinter({},'labels/new.json',['Zebra ZT610','Zebra ZT411']),'Zebra ZT610');
});

test('opening another label project restores its saved printer selection',async()=>{
  const source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
  const printerStart=source.indexOf('let availablePrinters = null;');
  const printerEnd=source.indexOf('let editorSel = null;',printerStart);
  const selectStart=source.indexOf('async function selectTemplate(file, startup = false) {');
  const selectEnd=source.indexOf('\nfunction setPreviewLoading(',selectStart);
  assert.ok(printerStart>=0&&printerEnd>printerStart&&selectStart>=0&&selectEnd>selectStart,'renderer integration functions are available');
  const dom=new JSDOM('<!doctype html><html><body><select id="printerSelect"><option value="Zebra ZT610">Zebra ZT610</option></select><input id="copies"><div id="editorView" style="display:none"></div><div id="previewFrame"></div></body></html>',{runScripts:'dangerously'});
  const w=dom.window,saves=[];
  w.ProjectPrinterSelection=require('../gui/project-printer-selection');
  w.PrintGeometry={normalizeTemplate:template=>template};
  w.zebra={saveSettings:async value=>saves.push(value),loadTemplateRaw:async file=>({file})};
  w.prepareEditorNavigation=async()=>true;
  w.eval(`
    let settings={printer:'Zebra ZT610',projectPrinters:{'labels/a.json':'Zebra ZT411','labels/b.json':'Zebra ZT610'}};
    let current=null,templates=[{file:'labels/a.json'},{file:'labels/b.json'}],rawTemplate=null,editing=null,importedRows=null,csvRaw=null,defaultCopies=1;
    const el=id=>document.getElementById(id);
    const updateConnSummary=()=>{};
    const setPreviewLoading=()=>{};
    const rememberPrintPage=()=>{};
    const rememberRecentTemplate=()=>{};
    const renderTemplateList=()=>{};
    const getConnection=()=>({});
    const seedTemplateValues=()=>{};
    const applyPrintPage=()=>{};
    ${source.slice(printerStart,printerEnd)}
    availablePrinters=['Zebra ZT610','Zebra ZT411'];
    ${source.slice(selectStart,selectEnd)}
    window.selectProjectTemplate=selectTemplate;
  `);
  await w.selectProjectTemplate('labels/a.json');
  assert.equal(w.document.getElementById('printerSelect').value,'Zebra ZT411');
  await w.selectProjectTemplate('labels/b.json');
  assert.equal(w.document.getElementById('printerSelect').value,'Zebra ZT610');
  assert.ok(saves.some(value=>value.printer==='Zebra ZT411'),'the active project printer becomes the application fallback');
  dom.window.close();
});
