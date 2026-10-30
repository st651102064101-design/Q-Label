const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'table-ribbon-switch-')));
app.on('browser-window-created',(_,win)=>{
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error('RENDERER:',message);});
  win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    try{
      for(let attempt=0;attempt<150;attempt++){if(await win.webContents.executeJavaScript('!appInitializing'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      const result=await win.webContents.executeJavaScript(`(()=>{
        window.hideProjectHome();
        editing={name:'Ribbon switch check',width_mm:60,height_mm:40,dpi:203,margin_mm:{left:0,top:0},elements:[{type:'image',x_mm:5,y_mm:5,width_mm:30,height_mm:20,table_model:{rows:[{mode:'Auto',size:5,weight:100,min:1,max:254}],columns:[{mode:'Auto',size:5,weight:100,min:1,max:254}],values:[['A']],fontSize:3,padding:.5,stroke:.175,fill:'#fff',border:'#000',borders:'All',errors:{clip:true}}}],values:{}};
        editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const tableTab=[...document.querySelectorAll('.ribbon-tab')].find(button=>button.textContent==='Table'),tablePanel=document.getElementById('ribbon-table');
        if(!tableTab||!tablePanel||tableTab.hidden||tablePanel.hidden)throw Error('Table tools did not open for selected table');
        [...document.querySelectorAll('.ribbon-tab')].find(button=>button.textContent.trim()==='Home').click();
        if(!tablePanel.hidden)throw Error('Table toolbar remained visible after switching to Home');
        if(tableTab.getAttribute('aria-selected')!=='false')throw Error('Table tab remained selected after switching to Home');
        tableTab.click();if(tablePanel.hidden)throw Error('Table toolbar did not return when its tab was selected');
        const layout=[...document.querySelectorAll('.ribbon-tab')].find(button=>button.textContent.trim()==='Layout');layout.click();
        editing.elements.push({type:'text',text:'Text',x_mm:2,y_mm:2},{type:'image',placeholder:true,x_mm:2,y_mm:2,width_mm:10,height_mm:10},structuredClone(editing.elements[0]));
        editorSelection=new Set([0,1,2]);editorSel=1;document.dispatchEvent(new Event('editor-selection-changed'));
        if(layout.getAttribute('aria-selected')!=='true'||!tablePanel.hidden||editorSel!==1)throw Error('Mixed selection changed the tab or primary object');
        editorSelection=new Set([0,3]);editorSel=3;document.dispatchEvent(new Event('editor-selection-changed'));
        if(tablePanel.hidden||tableTab.hidden)throw Error('Table-only multi-selection should open Table');
        editorSelection=new Set([0]);editorSel=0;document.dispatchEvent(new Event('editor-selection-changed'));
        editorSelection=new Set([0,1,2,3]);editorSel=2;document.dispatchEvent(new Event('editor-selection-changed'));
        if(layout.getAttribute('aria-selected')!=='true'||!tablePanel.hidden)throw Error('Mixed select-all did not restore the previous Layout tab');
        return {homeHidesTableToolbar:true,tableTabRestoresToolbar:true,mixedKeepsLayout:true,tableOnlyMultiOpens:true,mixedSelectAllRestoresLayout:true};
      })()`);
      console.log(JSON.stringify(result));app.exit(0);
    }catch(error){console.error(error.stack||error);app.exit(1);}
  });
});
require('../gui/main');
