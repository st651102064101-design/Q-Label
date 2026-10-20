'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {DEFAULT_FONT_FAMILIES,normalizeFontFamilies,getInstalledFontFamilies}=require('../lib/font-families');

test('font-family normalization trims, deduplicates case-insensitively, and sorts naturally',()=>{
  assert.deepEqual(normalizeFontFamilies([' Font 10 ','Arial','Font 2','ARIAL',' Cambria ','','  ',null]),['Arial','Cambria','Font 2','Font 10']);
});

test('installed Windows font families include every discovered family and retain bundled choices',async()=>{
  let requested=false;
  const families=await getInstalledFontFamilies({platform:'win32',fallbackFamilies:['Arial','Wingdings'],runPowerShell:async()=>{requested=true;return 'Cambria\r\nArial\r\nCustom Display\r\n';}});
  assert.equal(requested,true,'Windows enumerates installed font families');
  assert.deepEqual(families,['Arial','Cambria','Custom Display','Wingdings']);
});

test('font enumeration falls back safely off Windows and after a query failure',async()=>{
  const fallback=['Arial','Wingdings'];
  let queried=false;
  assert.deepEqual(await getInstalledFontFamilies({platform:'linux',fallbackFamilies:fallback,runPowerShell:async()=>{queried=true;return 'Never';}}),fallback);
  assert.equal(queried,false,'non-Windows platforms do not launch Windows font enumeration');
  assert.deepEqual(await getInstalledFontFamilies({platform:'win32',fallbackFamilies:fallback,runPowerShell:async()=>{throw new Error('PowerShell unavailable');}}),fallback);
});

test('formatting font picker loads installed families and previews each option in its own face',async()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitToMm=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.editing={dpi:203,elements:[{type:'text',text:'Sample',font_family:'Cambria',font_size_pt:12}]};w.editorSel=0;w.editorSelection=new Set();w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.sampleData=()=>({});
  w.document.fonts={load:async()=>[]};w.zebra={getInstalledFontFamilies:async()=>['Cambria','Aptos','Arial']};
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  w.eval(fs.readFileSync(require.resolve('../gui/font-family-picker'),'utf8'));
  await new Promise(resolve=>w.setTimeout(resolve,0));
  const picker=w.document.querySelector('.format-font');
  assert.deepEqual([...picker.options].map(option=>option.value),['Aptos','Arial','Arial Unicode MS','Cambria','Cambria Math','Segoe UI Emoji','Segoe UI Historic','Segoe UI Symbol','Symbol','Webdings','Wingdings','Wingdings 2','Wingdings 3']);
  assert.equal(picker.value,'Cambria','the selected object font remains selected after the system list loads');
  for(const option of picker.options)assert.equal(option.style.fontFamily,JSON.stringify(option.value),`${option.value} is previewed in its own font face`);
  assert.equal(picker.style.fontFamily,JSON.stringify('Cambria'),'the closed picker previews the currently selected font');
  dom.window.close();
});
