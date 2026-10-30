'use strict';
const {app}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-modal-controls-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());
  win.webContents.once('did-finish-load',async()=>{
    try{
      const setup=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(r=>setTimeout(r,50));
        hideProjectHome();autoSaveEnabled=false;
        editing={width_mm:60,height_mm:40,dpi:203,elements:[{type:'text',text:'Fixture',x_mm:2,y_mm:2,width_mm:20,height_mm:5}]};
        editorSel=0;editorSelection=new Set([0]);refreshEditorUI();openObjectProperties(0);
        const d=document.getElementById('objectProperties'),controls=d.querySelector('.modal-window-controls');
        const geometry=()=>{const b=[...controls.children].map(x=>x.getBoundingClientRect()),header=d.querySelector('header').getBoundingClientRect();return {gaps:[b[1].left-b[0].right,b[2].left-b[1].right],right:header.right-b[2].right};};
        const initial=geometry();controls.children[1].click();const maximized=geometry();controls.children[1].click();const restored=geometry();
        controls.children[0].click();return {initial,maximized,restored,hidden:getComputedStyle(d).display==='none',open:d.open,dock:!!document.querySelector('.modal-window-dock button')};
      })()`);
      for(const state of ['initial','maximized','restored']){assert.deepEqual(setup[state].gaps,[8,8]);assert.equal(setup[state].right,6);}
      assert.equal(setup.hidden,true);assert.equal(setup.open,true);assert.equal(setup.dock,true);
      assert.equal(win.isMinimizable(),true,'main window can still minimize while a child modal is minimized');
      assert.equal(win.isMinimized(),false,'minimizing a modal does not minimize the main window');
      await win.webContents.executeJavaScript(`document.querySelector('.modal-window-dock button').click()`);
      await new Promise(resolve=>setTimeout(resolve,100));
      assert.equal(await win.webContents.executeJavaScript(`getComputedStyle(document.getElementById('objectProperties')).display!=='none'`),true,'dock restores the modal');
      assert.equal(win.isMinimizable(),false,'main window minimize is guarded while a modal is active');
      win.close();
      for(let i=0;i<50&&await win.webContents.executeJavaScript(`document.getElementById('objectProperties')?.open`);i++)await new Promise(resolve=>setTimeout(resolve,20));
      assert.equal(win.isDestroyed(),false,'native X request does not close the main window while a modal is active');
      assert.equal(await win.webContents.executeJavaScript(`!document.getElementById('objectProperties')?.open`),true,'native X request closes the active modal');
      console.log('PASS modal controls and native window close routing '+JSON.stringify({setup,mainMinimizableAfterRestore:win.isMinimizable(),mainSurvivedClose:!win.isDestroyed()}));
      clearTimeout(timer);app.exit(0);
    }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
  });
});
require('../gui/main');
