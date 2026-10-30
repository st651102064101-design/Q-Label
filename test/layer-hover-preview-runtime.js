'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-layer-preview-')));
const timeout=setTimeout(()=>{console.error('Layer preview runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_event,win)=>{win.webContents.once('did-finish-load',async()=>{try{
  const result=await win.webContents.executeJavaScript(`(async()=>{
    while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
    hideProjectHome();autoSaveEnabled=false;
    editing={name:'Layer preview fixture',width_mm:60,height_mm:40,dpi:203,elements:[
      {type:'box',label:'A',x_mm:5,y_mm:5,width_mm:20,height_mm:20,fill:'#ff0000'},
      {type:'box',label:'B',x_mm:10,y_mm:10,width_mm:20,height_mm:20,fill:'#00ff00'},
      {type:'box',label:'C',x_mm:15,y_mm:15,width_mm:20,height_mm:20,fill:'#0000ff'},
      {type:'box',label:'D',x_mm:20,y_mm:20,width_mm:20,height_mm:20,fill:'#111111'}]};
    editorSel=1;editorSelection=new Set([1]);drawEditorCanvas();
    const before=JSON.stringify(editing),host=document.createElement('div');document.body.append(host);window.LayerManager.addMenuItem(host);
    host.querySelector('button').dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));
    const menu=document.querySelector('.ql-layer-submenu'),buttons=[...menu.querySelectorAll('button')].slice(0,4);
    const expected=[['A','C','D','B'],['A','C','B','D'],['B','A','C','D'],['B','A','C','D']];
    for(let i=0;i<4;i++){
      buttons[i].dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));
      const preview=document.querySelector('[data-layer-preview]');if(!preview)throw Error('preview missing '+i);
      if(preview.querySelectorAll('[data-label-element]').length!==4)throw Error('preview artwork missing '+i);
      if(JSON.stringify(editing)!==before)throw Error('hover changed document '+i);
      const order=window.LayerOrder.reorder(editing.elements,[1],['front','forward','backward','back'][i]).elements.map(e=>e.label);
      if(JSON.stringify(order)!==JSON.stringify(expected[i]))throw Error('unexpected order '+i);
      const expectedSvg=document.createElement('template');expectedSvg.innerHTML=window.LabelPreview.renderPreviewSVG({...editing,elements:window.LayerOrder.reorder(editing.elements,[1],['front','forward','backward','back'][i]).elements},sampleData(editing),[0,1,2,3],qrCache,{designSheet:true,editorPlaceholders:true});
      const actualArtwork=[...preview.querySelectorAll('[data-label-element]')].map(n=>n.innerHTML),expectedArtwork=[...expectedSvg.content.querySelectorAll('[data-label-element]')].map(n=>n.innerHTML);
      if(JSON.stringify(actualArtwork)!==JSON.stringify(expectedArtwork))throw Error('preview stacking differs from actual reorder '+i);
      buttons[i].dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}));
      if(document.querySelector('[data-layer-preview]'))throw Error('preview not restored '+i);
    }
    buttons[0].dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));buttons[0].click();
    if(document.querySelector('[data-layer-preview]')||editing.elements.map(e=>e.label).join(',')!=='A,C,D,B')throw Error('click did not commit correct order');
    return 'PASS layer hover previews, restore and commit';
  })()`);
  console.log(result);clearTimeout(timeout);app.exit(0);
}catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}});});
require('../gui/main.js');
