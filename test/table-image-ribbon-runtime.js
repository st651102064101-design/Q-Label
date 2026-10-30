'use strict';
const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'table-image-ribbon-')));
app.on('browser-window-created',(_event,win)=>{
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error('RENDERER:',message);});
  win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    try{
      for(let i=0;i<150;i++){if(await win.webContents.executeJavaScript('!appInitializing'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      const result=await win.webContents.executeJavaScript(`(()=>{
        window.hideProjectHome();
        const axis=()=>({mode:'Auto',size:8,weight:100,min:1,max:254});
        editing={name:'Table to picture ribbon',width_mm:70,height_mm:50,dpi:203,margin_mm:{left:0,top:0},elements:[
          {type:'image',label:'Table',x_mm:5,y_mm:5,width_mm:30,height_mm:20,table_model:{rows:[axis()],columns:[axis(),axis()],values:[['A','B']],fontSize:3,padding:.5,stroke:.2,border:'#000000',fill:'#ffffff',borders:'All',errors:{clip:true}}},
          {type:'image',label:'Picture',placeholder:true,x_mm:40,y_mm:5,width_mm:20,height_mm:20}
        ],values:{}};
        const tabs=[...document.querySelectorAll('.ribbon-tab')],panels=[...document.querySelectorAll('.ribbon-panel')];
        tabs.forEach(tab=>tab.setAttribute('aria-selected','false'));panels.forEach(panel=>panel.hidden=true);
        editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const tableTab=tabs.find(tab=>tab.textContent.trim()==='Table'),homeTab=tabs.find(tab=>tab.textContent.trim()==='Home'),pictureTab=tabs.find(tab=>tab.textContent.trim()==='Picture'),fileMenu=document.querySelector('.ribbon-file-menu');
        if(!tableTab||tableTab.getAttribute('aria-selected')!=='true')throw Error('Table tab did not activate');
        editorSel=-1;editorSelection.clear();drawEditorCanvas();
        if(homeTab.getAttribute('aria-selected')!=='true'||!fileMenu.hidden)throw Error('Clearing a table selection should return Home without opening File');
        editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        editorSel=1;editorSelection=new Set([1]);drawEditorCanvas();
        if(pictureTab.getAttribute('aria-selected')!=='true'||document.getElementById('ribbon-picture').hidden)throw Error('Selecting picture after table did not preserve Picture navbar');
        if(!tableTab.hidden||!document.getElementById('ribbon-table').hidden)throw Error('Table navbar remained visible after selecting picture');
        if(!fileMenu.hidden||document.querySelector('.ribbon-tab[aria-expanded="true"]'))throw Error('Selecting picture unexpectedly opened File dropdown');
        return {emptyPreviousTabFallsBackToHome:true,pictureNavbarRestoredAfterTable:true,fileDropdownStaysClosed:true};
      })()`);
      console.log(JSON.stringify(result));app.exit(0);
    }catch(error){console.error(error.stack||error);app.exit(1);}
  });
});
require('../gui/main');
