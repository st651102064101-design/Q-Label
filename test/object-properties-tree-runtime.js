'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-tree-runtime-')));
const timeout=setTimeout(()=>{console.error('Properties tree runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        hideProjectHome();autoSaveEnabled=false;
        editing={name:'Tree fixture',width_mm:60,height_mm:40,dpi:203,values:{},elements:[{type:'text',label:'text 1',text:'A',x_mm:5,y_mm:5,width_mm:10,height_mm:4},{type:'text',label:'text 2',text:'B',x_mm:20,y_mm:5,width_mm:10,height_mm:4}]};
        editorSel=0;editorSelection=new Set([0]);refreshEditorUI();drawEditorCanvas();
        if(editing.elements.map(item=>item.label).join('|')!=='object 1|object 2')throw Error('Legacy names did not migrate');
        const caption=document.querySelector('.selection-object-name text')?.textContent;
        openObjectProperties(0);const d=document.getElementById('objectProperties');
        if(d.querySelector('[data-object-root="0"] span').textContent!==caption)throw Error('Canvas and tree names differ');
        const geometry=()=>{const source=d.querySelector('.ose-list button')||d.querySelector('.op-source-summary button'),tool=d.querySelector('[data-object-index="0"][data-property-page="Data Sources"]'),r=source.getBoundingClientRect(),t=tool.getBoundingClientRect();return {x:r.x,y:r.y-t.bottom,w:r.width,h:r.height,branch:getComputedStyle(source,'::before').borderTopStyle,stem:getComputedStyle(source,'::after').borderLeftStyle};};
        const before=geometry();d.querySelector('[data-object-index="0"][data-property-page="Data Sources"]').click();
        const theme=document.getElementById('ose-modern-theme');if(theme&&!theme.sheet)await new Promise((resolve,reject)=>{theme.onload=resolve;theme.onerror=()=>reject(Error('Theme failed'));});
        const during=geometry();d.querySelector('[data-object-index="0"][data-property-page="Font"]').click();const after=geometry();
        for(const state of [before,during,after]){if(state.branch!=='dotted'||state.stem!=='dotted')throw Error('Source branch missing: '+JSON.stringify(state));for(const key of ['x','y','w','h'])if(Math.abs(state[key]-before[key])>1)throw Error('Source tree shifts: '+JSON.stringify({before,during,after}));}
        if(d.querySelectorAll('.op-source-summary').length!==2)throw Error('An object source is hidden after leaving Data Sources');
        d.querySelector('[data-object-root="1"]').click();if(editorSel!==1)throw Error('Tree does not select the actual object');
        if(d.querySelector('[data-action="apply"]'))throw Error('Apply still exists');
        d.querySelector('[data-object-root="1"]').click();const check=d.querySelector('[name="preprinted"]');check.click();
        for(let i=0;i<100&&!editing.elements[1].preprinted;i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(!editing.elements[1].preprinted)throw Error('Checkbox did not update actual object');
        const input=d.querySelector('[name="comments"]');input.value='Immediate settings';input.dispatchEvent(new Event('input',{bubbles:true}));
        for(let i=0;i<100&&editing.elements[1].comments!=='Immediate settings';i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(editing.elements[1].comments!=='Immediate settings'||d.querySelector('[name="comments"]')!==input)throw Error('Live input lost value or focus node');
        const undoBefore=undoStack.length;check.click();for(let i=0;i<100&&editing.elements[1].preprinted;i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(editing.elements[1].preprinted||undoStack.length<=undoBefore)throw Error('Live checkbox did not create undo history');
        d.querySelector('[data-action="cancel"]').click();for(let i=0;i<100&&d.open;i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(d.open||editing.elements[1].comments!=='Immediate settings')throw Error('Close lost valid edits');
        return {before,during,after,namesMatch:true,sourcesVisible:true,selectionWorks:true,liveCheckbox:true,liveInput:true,closeRetains:true};
      })()`);
      console.log('PASS '+JSON.stringify(result));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
