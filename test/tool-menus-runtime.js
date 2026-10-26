'use strict';
// Electron runtime: Text and Picture ribbon dropdowns open, insert supported items and disable unsupported ones.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-tool-menus-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.once('did-finish-load',async()=>{
  try{
    const result=await win.webContents.executeJavaScript(`(async()=>{
      while(appInitializing)await new Promise(r=>setTimeout(r,25));
      hideProjectHome();autoSaveEnabled=false;
      const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
      editing={width_mm:100,height_mm:60,dpi:203,elements:[]};
      editorSel=-1;editorSelection=new Set();refreshEditorUI();drawEditorCanvas();
      const text=document.getElementById('insertTextTool'),picture=document.getElementById('insertPictureTool');
      out.found=!!text&&!!picture;
      text.click();await wait(50);
      let menu=document.querySelector('.tool-menu');
      out.textHeadings=[...menu.querySelectorAll('.line-menu-heading')].map(n=>n.textContent);
      out.tiles=menu.querySelectorAll('.line-menu-grid button').length;
      out.tilesDisabled=[...menu.querySelectorAll('.line-menu-grid button')].every(b=>b.disabled);
      out.disabledNames=[...menu.querySelectorAll('button:disabled')].filter(b=>!b.closest('.line-menu-grid')).map(b=>b.textContent);
      out.noInsertOnOpen=editing.elements.length===0;
      [...menu.querySelectorAll('button')].find(b=>b.textContent==='Normal Wrapped').click();await wait(100);
      out.wrapped={count:editing.elements.length,type:editing.elements[0]?.type,wrap:editing.elements[0]?.text_wrap};
      out.closed=!document.querySelector('.tool-menu');
      text.click();await wait(50);
      [...document.querySelectorAll('.tool-menu button')].find(b=>b.textContent==='Normal').click();await wait(100);
      out.normal={count:editing.elements.length,wrap:editing.elements[1]?.text_wrap};
      picture.click();await wait(50);
      menu=document.querySelector('.tool-menu');
      out.pictureHeadings=[...menu.querySelectorAll('.line-menu-heading')].map(n=>n.textContent);
      out.pictureEnabled=[...menu.querySelectorAll('button:not(:disabled)')].map(b=>b.textContent);
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      menu.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(50);
      out.escapeClosed=!document.querySelector('.tool-menu');
      return JSON.stringify(out);
    })()`);
    const r=JSON.parse(result);
    console.log(result);assert.ok(r.found&&r.noInsertOnOpen,'buttons exist; opening the menu does not insert');
    assert.deepEqual(r.textHeadings,['Basic Text Objects','Transformed Text Objects','Markup Language Containers']);
    assert.equal(r.tiles,16);assert.ok(r.tilesDisabled);
    assert.deepEqual(r.disabledNames,['Word Processor','RTF','HTML','XAML']);
    assert.deepEqual(r.wrapped,{count:1,type:'text',wrap:true});
    assert.ok(r.closed);
    assert.equal(r.normal.count,2);assert.ok(!r.normal.wrap);
    assert.deepEqual(r.pictureHeadings,['Embedded Pictures','External Picture File','Other Picture Sources']);
    assert.deepEqual(r.pictureEnabled,['Insert from File…']);
    assert.ok(r.escapeClosed);
    console.log('PASS text and picture menus',result);
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
