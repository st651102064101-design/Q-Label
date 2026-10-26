'use strict';
// Electron runtime: BarTender-style color popup applies outline, fill and None to the selected object.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-color-picker-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.once('did-finish-load',async()=>{
  try{
    const result=await win.webContents.executeJavaScript(`(async()=>{
      while(appInitializing)await new Promise(r=>setTimeout(r,25));
      hideProjectHome();autoSaveEnabled=false;
      const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
      editing={width_mm:100,height_mm:60,dpi:203,elements:[{type:'box',x_mm:10,y_mm:10,width_mm:30,height_mm:20,thickness_mm:.3,stroke_color:'#111111',fill_color:'#ffffff'}]};
      editorSel=0;editorSelection=new Set([0]);refreshEditorUI();drawEditorCanvas();
      const stroke=document.querySelector('[aria-label="Outline / line color"],input[type=color][title*="utline"]'),fill=document.querySelector('input[type=color][title*="fill"]');
      out.found=!!stroke&&!!fill;
      const e=()=>editing.elements[0];
      stroke.click();await wait(50);
      let panel=document.querySelector('.color-picker-panel');
      out.hexes=panel?panel.querySelectorAll('.cp-hex').length:0;
      out.tabs=panel?[...panel.querySelectorAll('[role=tab]')].map(t=>t.textContent):[];
      out.gradientDisabled=panel?.querySelector('.cp-link:disabled')?.textContent;
      out.pantoneNote=(()=>{panel.querySelectorAll('[role=tab]')[1].click();return panel.querySelector('.cp-note')?.textContent||''})();
      out.libHidden=panel.querySelector('.cp-pantone select').hidden&&panel.querySelector('.cp-pantone input').hidden;out.noneNoIcon=!document.querySelector('.cp-none svg');panel.querySelectorAll('[role=tab]')[0].click();
      const hex=[...panel.querySelectorAll('.cp-hex')].find(n=>n.dataset.color==='#ff0000')||panel.querySelectorAll('.cp-hex')[20];
      out.picked=hex.dataset.color;hex.dispatchEvent(new MouseEvent('click',{bubbles:true}));await wait(100);
      out.stroke=e().stroke_color;out.closed=!document.querySelector('.color-picker-panel');
      fill.click();await wait(50);
      document.querySelector('.cp-none').click();await wait(100);
      out.fillNone=e().fill_color;
      stroke.click();await wait(50);
      document.querySelector('.cp-none').click();await wait(100);
      out.lineStyleAfterNone=e().line_style;
      out.recent=ColorPicker.recentColors();
      return JSON.stringify(out);
    })()`);
    const r=JSON.parse(result);
    assert.ok(r.found,'color inputs found');
    assert.equal(r.hexes,127+15);
    assert.deepEqual(r.tabs,['STANDARD','PANTONE®']);
    assert.match(r.gradientDisabled,/Gradient/);
    assert.equal(r.stroke,r.picked);assert.ok(r.closed);
    assert.ok(r.libHidden,'empty library chooser is hidden');assert.ok(r.noneNoIcon,'None button is not decorated with an action icon');assert.equal(r.fillNone,'none');
    assert.equal(r.lineStyleAfterNone,'erase');
    assert.ok(r.recent.includes(r.picked));
    console.log('PASS color picker',result);
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
