'use strict';
// Electron runtime: BarTender-style dash and line-width menus change the selected object.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-line-menus-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.once('did-finish-load',async()=>{
  try{
    const result=await win.webContents.executeJavaScript(`(async()=>{
      while(appInitializing)await new Promise(r=>setTimeout(r,25));
      hideProjectHome();autoSaveEnabled=false;
      const out={};
      editing={width_mm:100,height_mm:60,dpi:203,elements:[{type:'box',x_mm:10,y_mm:10,width_mm:30,height_mm:20,thickness_mm:.3,stroke_color:'#111111',fill_color:'none'}]};
      editorSel=0;editorSelection=new Set([0]);refreshEditorUI();drawEditorCanvas();
      const wait=ms=>new Promise(r=>setTimeout(r,ms));
      const dash=document.querySelector('.line-dash-picker'),arrow=document.querySelector('.line-width-arrow');
      out.exists=!!dash&&!!arrow;out.enabled=!dash.disabled&&!arrow.disabled;
      dash.click();await wait(50);
      const menu=document.querySelector('.line-dash-menu');
      out.dashOptions=menu?menu.querySelectorAll('button').length:0;
      menu.querySelector('button[data-value="3"]').click();await wait(100);
      const e=()=>editing.elements[0];
      out.afterDash={style:e().line_style,pattern:e().dash_pattern};
      out.svgDash=/stroke-dasharray/.test(document.getElementById('previewFrame').innerHTML);
      out.menuClosed=!document.querySelector('.line-menu');
      arrow.click();await wait(50);
      out.widthOptions=document.querySelectorAll('.line-width-menu button').length;
      document.querySelector('.line-width-menu button[data-value="2"]').click();await wait(100);
      out.afterWidth=e().thickness_mm;
      dash.click();await wait(50);
      document.querySelector('.line-dash-menu button[data-value="-1"]').click();await wait(100);
      out.erase=e().line_style;
      dash.click();await wait(50);
      document.querySelector('.line-dash-menu button[data-value="0"]').click();await wait(100);
      out.solid={style:e().line_style,pattern:e().dash_pattern};
      const compound=document.querySelector('.line-compound-picker');out.compoundEnabled=!compound.disabled;
      const rectsBefore=document.getElementById('previewFrame').querySelectorAll('rect[stroke-width]').length;
      compound.click();await wait(50);
      out.compoundOptions=document.querySelectorAll('.line-compound-menu button').length;
      document.querySelector('.line-compound-menu button[data-value="double"]').click();await wait(100);
      out.compound=e().compound;
      out.compoundRects=document.getElementById('previewFrame').querySelectorAll('rect[stroke-width]').length-rectsBefore;
      
      return JSON.stringify(out);
    })()`);
    const r=JSON.parse(result);
    assert.ok(r.exists&&r.enabled,'menus exist and are enabled for a box');
    assert.equal(r.dashOptions,35);
    assert.deepEqual(r.afterDash,{style:'dash',pattern:3});
    assert.ok(r.svgDash&&r.menuClosed);
    assert.equal(r.widthOptions,18);
    assert.ok(Math.abs(r.afterWidth-2*25.4/72)<1e-6,'2.0 pt = '+r.afterWidth);
    assert.equal(r.erase,'erase');
    assert.deepEqual(r.solid,{style:'solid',pattern:0});
    assert.ok(r.compoundEnabled);assert.equal(r.compoundOptions,7);assert.equal(r.compound,'double');assert.ok(r.compoundRects>=1,'double line adds a second stroke: '+r.compoundRects);
    console.log('PASS line dash and width menus',result);
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
