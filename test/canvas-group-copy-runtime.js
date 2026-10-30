'use strict';
const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'canvas-group-copy-')));
app.on('browser-window-created',(_event,win)=>{
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error('RENDERER:',message);});
  win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    try{
      for(let i=0;i<150;i++){if(await win.webContents.executeJavaScript('!appInitializing'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      const result=await win.webContents.executeJavaScript(`(()=>{
        window.hideProjectHome();
        editing={name:'Canvas group copy',width_mm:60,height_mm:40,dpi:203,margin_mm:{left:0,top:0},elements:[
          {type:'box',x_mm:5,y_mm:5,width_mm:12,height_mm:8,thickness_mm:.3},
          {type:'text',text:'Grouped text',x_mm:20,y_mm:5,width_mm:18,height_mm:6,font_size_pt:10},
          {type:'ellipse',x_mm:5,y_mm:20,width_mm:8,height_mm:8,thickness_mm:.3}
        ],values:{}};
        editorSelection=new Set([0,1]);editorSel=1;drawEditorCanvas();
        const hit=liveOverlay().querySelector('.hit[data-hit="0"]');hit.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:130,clientY:130}));
        const menu=document.querySelector('[aria-label="Object actions"]'),buttons=()=>[...menu.querySelectorAll('button')];
        const group=buttons().find(button=>button.querySelector('.ocm-label')?.textContent==='Group');if(!group)throw Error('Canvas context menu does not show Group for multi-selection');group.click();
        const originalGroup=editing.elements[0].group_id;if(!originalGroup||editing.elements[1].group_id!==originalGroup)throw Error('Group command did not assign a shared group id');
        selectElement(-1);selectElement(0);if(editorSelection.size!==2||!editorSelection.has(1))throw Error('Click-select did not reselect the whole group');
        hit.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:140,clientY:140}));
        const copy=buttons().find(button=>button.querySelector('.ocm-label')?.textContent==='Copy');if(!copy)throw Error('Copy command missing from canvas context menu');copy.click();
        if(!Array.isArray(elementClipboard)||elementClipboard.length!==2||elementClipboard[0].group_id!==originalGroup||elementClipboard[1].group_id!==originalGroup)throw Error('Copy did not copy all grouped objects together');
        pasteElement({x:35,y:25});const pasted=[...editorSelection].map(i=>editing.elements[i]);
        if(pasted.length!==2||!pasted[0].group_id||pasted[0].group_id!==pasted[1].group_id||pasted[0].group_id===originalGroup)throw Error('Paste did not create a separate copy of the group');
        selectElement([...editorSelection][0]);if(editorSelection.size!==2)throw Error('Selecting a pasted group member did not select both copies');
        const ungroup=groupSelectedElements(true);if(!ungroup||editing.elements[[...editorSelection][0]].group_id)throw Error('Ungroup did not clear the pasted group');
        editorSelection=new Set([0,1]);editorSel=1;const shortcut=new KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:'g',code:'KeyG',ctrlKey:true});document.dispatchEvent(shortcut);if(!shortcut.defaultPrevented||editing.elements[0].group_id!==editing.elements[1].group_id)throw Error('Ctrl+G did not group selected objects');
        return {canvasGroupCommand:true,clickSelectsGroup:true,canvasCopyCopiesMembers:true,pasteKeepsIndependentGroup:true,ungroup:true,ctrlG:true};
      })()`);
      console.log(JSON.stringify(result));app.exit(0);
    }catch(error){console.error(error.stack||error);app.exit(1);}
  });
});
require('../gui/main');
