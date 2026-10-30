'use strict';
const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'ribbon-history-order-')));
app.on('browser-window-created',(_event,win)=>{
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error('RENDERER:',message);});
  win.webContents.once('did-finish-load',async()=>{
    try{
      for(let i=0;i<150;i++){if(await win.webContents.executeJavaScript('!appInitializing'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      const result=await win.webContents.executeJavaScript(`(()=>{
        const home=document.getElementById('ribbon-home'),clipboard=home.querySelector('[data-ribbon-group="clipboard"]'),undo=document.getElementById('undoBtn'),redo=document.getElementById('redoBtn');
        const history=undo?.closest('.ribbon-group');
        if(!clipboard||!history||!redo)throw Error('Clipboard or History group missing');
        if(!undo.disabled||!redo.disabled)throw Error('Undo and Redo should both be disabled when no history exists');
        const undoColor=getComputedStyle(undo).color,redoColor=getComputedStyle(redo).color;
        if(undoColor!=='rgb(148, 163, 184)'||redoColor!=='rgb(148, 163, 184)')throw Error('Unavailable Undo/Redo buttons must both be gray: '+undoColor+', '+redoColor);
        const order=[...home.children].indexOf(history)-[...home.children].indexOf(clipboard);
        if(order!==1)throw Error('History group is not immediately after Clipboard: '+[...home.children].map(node=>node.dataset.ribbonGroup||node.className));
        if(clipboard.querySelector('[aria-label="Delete object"]')==null)throw Error('Delete object is not in Clipboard group');
        const quickUndo=document.querySelector('.ribbon-quick-button[aria-label="Undo (Ctrl+Z)"]');
        const quickRedo=document.querySelector('.ribbon-quick-button[aria-label="Redo (Ctrl+Y)"]');
        if(!quickUndo||!quickRedo)throw Error('Quick access Undo/Redo buttons missing');
        if(!quickUndo.disabled||!quickRedo.disabled)throw Error('Quick access Undo and Redo should be disabled when no history exists');
        quickUndo.disabled=false;quickUndo.focus();quickUndo.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));
        if(document.activeElement===quickUndo)throw Error('Pointer click left the quick access Undo button focused');
        quickUndo.focus();quickUndo.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));
        if(document.activeElement!==quickUndo)throw Error('Keyboard activation removed quick access Undo focus');
        quickUndo.blur();quickUndo.disabled=true;
        return {deleteObjectInClipboard:true,undoRedoImmediatelyAfterClipboard:true,undoRedoDisabledGray:{undoColor,redoColor},quickAccessHistoryDisabled:{undo:quickUndo.disabled,redo:quickRedo.disabled},quickAccessPointerFocusCleared:true,keyboardFocusPreserved:true};
      })()`);
      console.log(JSON.stringify(result));app.exit(0);
    }catch(error){console.error(error.stack||error);app.exit(1);}
  });
});
require('../gui/main');
