const {app}=require('electron');
const fs=require('fs');
const os=require('os');
const path=require('path');

app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'home-action-icons-')));
app.on('browser-window-created',(_,win)=>win.webContents.once('did-finish-load',async()=>{
  try{
    await new Promise(resolve=>setTimeout(resolve,1800));
    const result=await win.webContents.executeJavaScript(`(()=>{
      window.hideProjectHome();
      const groups=[...document.querySelectorAll('#ribbon-home .ribbon-group')];
      const action=groups.find(group=>group.querySelector('.ribbon-group-label')?.textContent==='Action');
      const print=action?.querySelector('button[aria-label="Print"]');
      if(!print?.querySelector('svg[data-icon="print"]'))throw Error('Home Action group does not contain an SVG Print button');
      const oldPrint=window.openPrintDialog;let printCalls=0;
      window.openPrintDialog=()=>{printCalls++;};print.click();window.openPrintDialog=oldPrint;
      if(printCalls!==1)throw Error('Home Action Print button did not call the existing print dialog');

      editing={name:'Action icon check',width_mm:100,height_mm:80,dpi:203,margin_mm:{left:0,top:0},elements:[{
        type:'image',label:'Table',x_mm:10,y_mm:10,width_mm:50,height_mm:30,
        table_model:{rows:[{mode:'Auto',size:5,weight:100,min:1,max:254}],columns:[{mode:'Auto',size:5,weight:100,min:1,max:254}],values:[['Test']],padding:.5,fontSize:4,stroke:.175,border:'#000000',fill:'#ffffff',borders:'All',errors:{clip:true}}
      }],values:{}};
      editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
      const panel=document.getElementById('ribbon-table');
      if(panel.hidden)throw Error('Table ribbon did not open for the selected table');
      window.TableCellSelection.select({r:0,c:0},{},'cell');
      let size=panel.querySelector('[aria-label="Size (pt)"]');
      const increase=panel.querySelector('[aria-label="Increase font size"]'),decrease=panel.querySelector('[aria-label="Decrease font size"]');
      if(!increase?.querySelector('svg[data-icon="font-size-up"]')||!decrease?.querySelector('svg[data-icon="font-size-down"]'))throw Error('Font size controls are missing their directional SVG icons');
      size.value='12';size.dispatchEvent(new Event('change',{bubbles:true}));
      panel.querySelector('[aria-label="Increase font size"]').click();
      size=panel.querySelector('[aria-label="Size (pt)"]');if(Number(size.value)!==13)throw Error('Increase font size should add exactly one point: '+size.value);
      panel.querySelector('[aria-label="Decrease font size"]').click();
      size=panel.querySelector('[aria-label="Size (pt)"]');if(Number(size.value)!==12)throw Error('Decrease font size should subtract exactly one point: '+size.value);
      return {homeActionGroup:true,printSvg:true,printDialogInvoked:true,fontSizeUpSvg:true,fontSizeDownSvg:true,increasePoint:13,decreasePoint:12};
    })()`);
    console.log(JSON.stringify(result));app.exit(0);
  }catch(error){console.error(error.stack||error);app.exit(1);}
}));
require('../gui/main');
