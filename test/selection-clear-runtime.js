'use strict';

const {app}=require('electron');
const fs=require('fs');
const os=require('os');
const path=require('path');

app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-selection-clear-')));
const timeout=setTimeout(()=>{console.error('Selection-clear runtime timed out');app.exit(1);},45000);
app.on('browser-window-created',(_,win)=>{
  win.webContents.once('did-finish-load',async()=>{
    try{
      await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const start=performance.now();const poll=()=>{if(!appInitializing)resolve();else if(performance.now()-start>20000)reject(Error('Startup timed out'));else setTimeout(poll,50);};poll();})`);
      win.showInactive();
      const result=await win.webContents.executeJavaScript(`(()=>{
        hideProjectHome();autoSaveEnabled=false;
        editing={name:'Selection dismissal fixture',width_mm:60,height_mm:40,dpi:203,unit:'mm',elements:[{type:'image',x_mm:8,y_mm:8,width_mm:12,height_mm:10,bitmap_width:8,bitmap_height:8,bitmap_hex:'FF818181818181FF'},{type:'barcode128',label:'Barcode 2',text:'12345',x_mm:30,y_mm:8,bar_height_mm:10,module_width:1,hri_height_mm:3}]};
        const frame=document.getElementById('previewFrame');
        const select=()=>{editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();};
        const dispatch=(target,options={})=>target.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:61,...options}));
        select();
        const page=liveOverlay();if(!page||!page.querySelector('.hit'))throw Error('Fixture did not render a selectable object');
        dispatch(page,{clientX:page.getBoundingClientRect().right-8,clientY:page.getBoundingClientRect().bottom-8});
        const immediateBlank={selection:[...editorSelection],primary:editorSel,toolsHidden:document.getElementById('objectTools').hidden,selectedFrames:page.querySelectorAll('[data-editor-overlay].is-selected').length,floatingTools:page.querySelectorAll('.line-controls').length};
        if(editorSelection.size||editorSel!==-1||!document.getElementById('objectTools').hidden||page.querySelector('[data-editor-overlay].is-selected')||page.querySelector('.line-controls'))throw Error('Blank canvas pointerdown did not clear selection and its tools immediately '+JSON.stringify(immediateBlank));
        window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,pointerId:61,clientX:page.getBoundingClientRect().right-8,clientY:page.getBoundingClientRect().bottom-8}));
        select();
        const hit=liveOverlay().querySelector('.hit[data-hit="0"]'),rect=hit.getBoundingClientRect();
        dispatch(hit,{clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2});
        window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,pointerId:61,clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2}));
        const objectClick={selection:[...editorSelection],primary:editorSel,toolsHidden:document.getElementById('objectTools').hidden};
        if(editorSelection.size!==1||editorSel!==0||document.getElementById('objectTools').hidden)throw Error('Clicking object incorrectly cleared selection '+JSON.stringify(objectClick));
        select();
        const next=liveOverlay().querySelector('.hit[data-hit="1"]'),nextRect=next.getBoundingClientRect(),nextX=nextRect.left+nextRect.width/2,nextY=nextRect.top+Math.min(2,nextRect.height/4);
        dispatch(next,{clientX:nextX,clientY:nextY});
        const switched={primary:editorSel,oldSelected:!!liveOverlay().querySelector('[data-editor-overlay="0"].is-selected'),oldChrome:!!liveOverlay().querySelector('[data-editor-overlay="0"] .sel,[data-editor-overlay="0"] .line-controls'),newSelected:!!liveOverlay().querySelector('[data-editor-overlay="1"].is-selected')};
        if(editorSel!==1||switched.oldSelected||switched.oldChrome||!switched.newSelected)throw Error('Switching objects left old selection chrome '+JSON.stringify(switched));
        window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,pointerId:61,clientX:nextX,clientY:nextY}));
        const currentFrame=document.getElementById('previewFrame');
        dispatch(currentFrame);
        const outsideFrame={selection:[...editorSelection],primary:editorSel,toolsHidden:document.getElementById('objectTools').hidden};
        if(editorSelection.size||editorSel!==-1||!document.getElementById('objectTools').hidden)throw Error('Blank workspace click did not dismiss selection '+JSON.stringify(outsideFrame));
        select();dispatch(liveOverlay(),{shiftKey:true});
        window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,pointerId:61,shiftKey:true}));
        const additive={selection:[...editorSelection],primary:editorSel};
        if(editorSelection.size!==1||editorSel!==0)throw Error('Shift marquee lost the existing selection '+JSON.stringify(additive));
        return{immediateBlank,objectClick,switched,outsideFrame,additive};
      })()`);
      console.log('PASS selection clear runtime '+JSON.stringify(result));
      clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
