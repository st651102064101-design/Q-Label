'use strict';
// Electron runtime: the Symbol dialog's Unicode-block dropdown shows an SVG before every entry.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-svg-select-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.once('did-finish-load',async()=>{
  try{
    const run=code=>win.webContents.executeJavaScript(code);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
    await run("hideProjectHome();editing={width_mm:100,height_mm:60,dpi:203,elements:[]};refreshEditorUI();drawEditorCanvas();0");
    await run("document.querySelector('[aria-label=\"Insert Symbols\"]').click()");await wait(200);
    const state=JSON.parse(await run(`JSON.stringify({button:!!document.querySelector('.tis-picker .svg-select-button svg.svg-select-icon'),nativeHidden:document.querySelector('.tis-category-select').hidden,label:document.querySelector('.svg-select-button .svg-select-text')?.textContent})`));
    assert.equal(state.button,true,'dropdown button starts with an SVG');assert.equal(state.nativeHidden,true);
    await run("document.querySelector('.svg-select-button').click()");await wait(80);
    const list=JSON.parse(await run(`JSON.stringify({rows:[...document.querySelectorAll('.svg-select-list button')].map(b=>({text:b.querySelector('.svg-select-text').textContent.trim(),svg:!!b.querySelector('svg.svg-select-icon')})),selected:document.querySelector('.svg-select-list [aria-selected=true] .svg-select-text')?.textContent.trim()})`));
    assert.ok(list.rows.length>=15,'many Unicode blocks listed: '+list.rows.length);
    assert.deepEqual(list.rows.filter(r=>!r.svg),[],'every entry has an SVG');
    const target=list.rows.find(r=>r.text!==list.selected&&r.text!==state.label).text;
    await run(`[...document.querySelectorAll('.svg-select-list button')].find(b=>b.querySelector('.svg-select-text').textContent.trim()===${JSON.stringify(target)}).click()`);await wait(150);
    const after=JSON.parse(await run(`JSON.stringify({value:document.querySelector('.tis-category-select').value,label:document.querySelector('.svg-select-button .svg-select-text').textContent,closed:!document.querySelector('.svg-select-list'),cards:document.querySelectorAll('.tis-symbol-card').length})`));
    assert.equal(after.value,target);assert.equal(after.label,target);assert.ok(after.closed);assert.ok(after.cards>0,'cards re-rendered for the chosen block');
    console.log('PASS svg select',JSON.stringify({rows:list.rows.length,cards:after.cards}));
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
