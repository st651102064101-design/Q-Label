'use strict';
const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
const testData=fs.mkdtempSync(path.join(os.tmpdir(),'zebrabar-ui-'));
app.setPath('userData',testData);
fs.mkdirSync(path.join(testData,'templates'));
fs.writeFileSync(path.join(testData,'templates','ui-check.json'),JSON.stringify({name:'UI check',width_mm:51,height_mm:25,dpi:300,elements:[],values:{},stock:{name:'USER',type:'die-cut',liner_left_mm:1.27,liner_right_mm:1.27}}));
fs.writeFileSync(path.join(testData,'settings.json'),JSON.stringify({lastTemplate:'ui-check.json',connType:'ip',navbarMode:'auto-hide'}));
let failed=false;
app.on('browser-window-created',(_event,win)=>{
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=3){failed=true;console.error('RENDERER:',message);}});
  win.webContents.once('did-finish-load',async()=>{
    const run=code=>win.webContents.executeJavaScript(code);
    const check=async(label,code)=>{if(!await run(code))throw Error(label);console.log('PASS '+label);};
    try{
      for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await new Promise(r=>setTimeout(r,100));}
      console.log(await run("JSON.stringify({initializing:appInitializing,editing:!!editing,homeHidden:document.getElementById('projectHome').hidden,message:document.getElementById('previewFrame').innerText})"));
      await check('startup opens home',"!appInitializing && !!editing && !document.getElementById('projectHome').hidden");
      await run("window.hideProjectHome(); window.useObjectTool('qrcode');");
      await check('QR tool creates object and recent entry',"editing.elements.at(-1).type==='qrcode' && document.querySelector('#recentObjectTools [data-add=qrcode]')");
      await run("document.activeElement.blur(); document.getElementById('previewFrame').focus();");
      win.webContents.sendInputEvent({type:'keyDown',keyCode:'Z',modifiers:['control']});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Z',modifiers:['control']});
      await new Promise(r=>setTimeout(r,100));
      await check('Ctrl+Z undoes insertion',"editing.elements.length===0");
      await run("window.useObjectTool('text'); document.activeElement.blur();");
      win.webContents.sendInputEvent({type:'keyDown',keyCode:'X',modifiers:['control']});win.webContents.sendInputEvent({type:'keyUp',keyCode:'X',modifiers:['control']});
      await new Promise(r=>setTimeout(r,100));
      await check('Ctrl+X cuts selected object',"editing.elements.length===0");
      await run("document.querySelector('[aria-controls=ribbon-insert]').click();const dragTool=document.querySelector('#ribbon-insert [data-insert-tool=text]'),transfer=new DataTransfer();dragTool.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));const bounds=document.querySelector('#previewFrame .canvaswrap > svg').getBoundingClientRect();document.getElementById('previewFrame').dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer,clientX:bounds.left+bounds.width*.25,clientY:bounds.top+bounds.height*.3}));");
      await check('dragging Insert tool places one object on paper',"editing.elements.length===1 && editing.elements[0].type==='text' && editing.elements[0].x_mm>5 && editing.elements[0].y_mm>2");
      await run("document.getElementById('insertBarcodeTool').click();[...document.querySelectorAll('.barcode-menu button')].find(b=>b.textContent==='More Barcodes…').click();");
      await check('barcode picker groups supported formats',"document.getElementById('barcodePicker').open && document.querySelectorAll('.barcode-list button').length===6");
      await run("[...document.querySelectorAll('.barcode-list button')].find(b=>b.textContent==='QR Code').click();document.querySelector('#barcodePicker .select').click();");
      await check('barcode picker inserts selected QR',"editing.elements.length===2 && editing.elements.at(-1).type==='qrcode' && document.getElementById('insertBarcodeTool').dataset.insertTool==='qrcode'");
      await run("document.querySelector('[aria-controls=ribbon-insert]').click(); document.querySelector('[aria-controls=ribbon-file]').click();");
      await new Promise(r=>setTimeout(r,150));
      await check('File dropdown keeps the selected ribbon visible',"!document.querySelector('.ribbon-file-menu').hidden && !document.querySelector('#ribbon-insert').hidden && document.body.classList.contains('file-menu-open') && document.querySelector('.edbar').getBoundingClientRect().top===0");
      await run("document.querySelector('.ribbon-file-menu').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));");
      await check('closing File restores Insert without hiding the ribbon',"document.querySelector('[aria-controls=ribbon-insert]').getAttribute('aria-selected')==='true' && !document.querySelector('#ribbon-insert').hidden && document.querySelector('.ribbon-file-menu').hidden && !document.body.classList.contains('file-menu-open')");
      await run("document.getElementById('pageSetupOpen').click(); document.getElementById('stockCategory').value='standard'; document.getElementById('stockCategory').dispatchEvent(new Event('change')); document.getElementById('stockList').value='1'; document.getElementById('stockList').dispatchEvent(new Event('change'));");
      await check('Stock selection applies dimensions',"document.getElementById('pageSetupDialog').open && editing.width_mm===51 && editing.height_mm===25");
      await run("document.getElementById('pageSetupDialog').close(); window.openNewLabelWizard();");
      await check('New wizard opens',"document.getElementById('newLabelWizard').open");
      await run("document.getElementById('newLabelWizard').close(); window.openPrintDialog();");
      await check('Print dialog opens',"document.getElementById('printDialog').open");
      await run("document.getElementById('printDialog').close(); window.showProjectHome();");
      await check('return to home',"!document.getElementById('projectHome').hidden");
      if(failed)throw Error('Renderer logged an error');
      console.log('UI CHECKS PASSED (no print jobs sent)');app.exit(0);
    }catch(error){console.error(error.stack);app.exit(1);}
  });
});
require('../gui/main');
