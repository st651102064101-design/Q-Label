'use strict';
const {app,ipcMain}=require('electron');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');

const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-printer-resolution-'));
app.setPath('appData',profile);
let finished=false;
const finish=(error)=>{
  if(finished)return;finished=true;
  if(error)console.error('FAIL '+error.message);else console.log('PASS Windows printer DPI read through renderer IPC');
  app.exit(error?1:0);
};
app.on('will-quit',()=>{try{fs.rmSync(profile,{recursive:true,force:true});}catch{}});
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());
  win.webContents.once('did-finish-load',async()=>{
    try{
      const names=await win.webContents.executeJavaScript('window.zebra.listPrinters()');
      if(!Array.isArray(names)||!names.length)throw Error('No installed printer is available for the Windows driver integration check.');
      const readings=[];
      const driverCandidates=[...names.filter(name=>/\bZebra\b.*\b\d{2,4}\s*dpi\b/i.test(name)),...names.filter(name=>/\b\d{2,4}\s*dpi\b/i.test(name)&&!/^\bZebra\b/i.test(name))];
      for(const name of driverCandidates){
        const result=await win.webContents.executeJavaScript(`window.zebra.getPrinterResolution(${JSON.stringify(name)})`);
        if(Number.isInteger(result?.dpi)){readings.push({name,dpi:result.dpi});break;}
      }
      if(!readings.length)throw Error('No installed printer driver reported a valid matching DPI.');
      console.log(JSON.stringify(readings[0]));
      await win.webContents.executeJavaScript(`(()=>{const printer=document.getElementById('printerSelect');printer.value=${JSON.stringify(readings[0].name)};window.openNewLabelWizard();})()`);
      const printerPicker=await win.webContents.executeJavaScript("(()=>{const list=document.getElementById('nwPrinter');return {size:list?.size,multiple:list?.multiple,count:list?.options.length,selected:list?.value,documentProperties:!!document.getElementById('nwDocumentProperties'),printerProperties:!!document.getElementById('nwPrinterProperties')}})()");
      if(printerPicker.size!==8||printerPicker.multiple||printerPicker.count<1||printerPicker.selected!==readings[0].name||!printerPicker.documentProperties||!printerPicker.printerProperties)throw Error('Printer Selection did not show a selected multi-row printer list and both native settings actions: '+JSON.stringify(printerPicker));
      console.log('PASS Printer Selection shows installed printers in an 8-row list with Document Properties and Printer Properties actions');
      const startingPoint=await win.webContents.executeJavaScript("(()=>({heading:document.querySelector('#newLabelWizard .nw-heading strong').textContent,blank:document.getElementById('nwBlankTemplate').checked,layoutPage:!!document.getElementById('nwLabelLayout')}))()");
      if(startingPoint.heading!=='Starting Point'||!startingPoint.blank||startingPoint.layoutPage)throw Error('New Label Wizard did not open at the expected Starting Point without the removed Label Layout page: '+JSON.stringify(startingPoint));
      await win.webContents.executeJavaScript('document.getElementById(\'nwNext\').click()');
      let wizard;
      for(let i=0;i<40;i++){
        wizard=await win.webContents.executeJavaScript("(()=>{const dialog=document.getElementById('newLabelWizard'),category=document.getElementById('nwStockCategory'),list=document.getElementById('nwStockList');return {open:dialog.open,heading:dialog.querySelector('.nw-heading strong').textContent,customStock:document.getElementById('nwStockCustom').checked,predefinedStock:document.getElementById('nwStockPredefined').checked,customPanelHidden:document.getElementById('nwCustomStock').hidden,predefinedPanelHidden:document.getElementById('nwPredefinedStock').hidden,categoryDisabled:category.disabled,listDisabled:list.disabled,paperModeRemoved:!document.getElementById('nwPaperMode')&&!document.getElementById('nwPaperRoll')&&!document.getElementById('nwPaperSheet'),paperModeTextRemoved:!/Print on a roll of labels|Print on a sheet of paper/i.test(dialog.textContent),resolutionField:!!document.getElementById('nwDpi'),resolutionLabel:/Resolution/i.test(dialog.querySelector('section').textContent),languageField:!!document.getElementById('nwLanguage'),languageLabel:/Printer language/i.test(dialog.querySelector('section').textContent),nextDisabled:document.getElementById('nwNext').disabled,error:document.getElementById('nwError').textContent}})()");
        if(wizard.heading==='Select the Printer'&&!wizard.nextDisabled||wizard.error)break;
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      if(!wizard?.open||wizard.heading!=='Select the Printer'||!wizard.customStock||wizard.predefinedStock||wizard.customPanelHidden||wizard.predefinedPanelHidden||wizard.categoryDisabled!==false||wizard.listDisabled!==false||!wizard.paperModeRemoved||!wizard.paperModeTextRemoved||wizard.resolutionField||wizard.resolutionLabel||wizard.languageField||wizard.languageLabel||wizard.nextDisabled||wizard.error)throw Error('New Label Wizard did not open with custom settings, visible stock controls, removed roll/sheet choices, no language choice, and selected driver DPI: '+JSON.stringify(wizard));
      console.log('PASS New Label Wizard removes roll/sheet, Resolution, and Printer language choices, and accepts driver DPI automatically');
      const stock=await win.webContents.executeJavaScript(`(()=>{document.getElementById('nwNext').click();return {heading:document.querySelector('#newLabelWizard .nw-heading strong')?.textContent,help:document.querySelector('.nw-stock-help')?.textContent,category:document.getElementById('nwStockCategory')?.value,stocks:[...(document.getElementById('nwStockList')?.options||[])].length,listSize:document.getElementById('nwStockList')?.size,categoryDisabled:document.getElementById('nwStockCategory')?.disabled,listDisabled:document.getElementById('nwStockList')?.disabled,previewHidden:document.getElementById('nwPreview')?.parentElement.hidden,step:document.querySelector('.nw-body')?.dataset.step}})()`);
      if(stock.heading!=='Stock Selection'||!stock.help?.match(/size of the page/i)||stock.category||stock.stocks!==0||!stock.categoryDisabled||!stock.listDisabled||!stock.previewHidden||stock.step!=='2')throw Error('Default Stock Selection unexpectedly applied a stock: '+JSON.stringify(stock));
      const stockResult=await win.webContents.executeJavaScript(`(()=>{const predefined=document.getElementById('nwStockPredefined');predefined.click();const category=document.getElementById('nwStockCategory');category.value='ADES AG';category.dispatchEvent(new Event('change',{bubbles:true}));const list=document.getElementById('nwStockList');list.value='49908';list.dispatchEvent(new Event('change',{bubbles:true}));return {category:category.value,name:list.value,width:document.getElementById('nwWidth').value,height:document.getElementById('nwHeight').value}})()`);
      if(stockResult.name!=='49908'||Math.abs(Number(stockResult.width)-89.9922)>0.0001||Math.abs(Number(stockResult.height)-49.9872)>0.0001)throw Error('Selected stock dimensions do not match the source catalog: '+JSON.stringify(stockResult));
      console.log('PASS Stock Selection loads ADES AG 49908 at 89.9922 × 49.9872 mm');
      const items=await win.webContents.executeJavaScript(`(()=>{document.getElementById('nwNext').click();return {heading:document.querySelector('#newLabelWizard .nw-heading strong')?.textContent,single:document.getElementById('nwSingleItem').checked,countsDisabled:document.getElementById('nwItemCounts').disabled,previewHidden:document.getElementById('nwPreview').parentElement.hidden,step:document.querySelector('.nw-body').dataset.step}})()`);
      if(items.heading!=='Items Per Page'||!items.single||!items.countsDisabled||items.previewHidden||items.step!=='3')throw Error('Items Per Page did not show its preview and Single item default: '+JSON.stringify(items));
      const sequence=await win.webContents.executeJavaScript(`(()=>{const next=document.getElementById('nwNext');next.click();const edges=document.querySelector('.nw-heading strong').textContent;next.click();const shape=document.querySelector('.nw-heading strong').textContent;next.click();const templateSize=document.querySelector('.nw-heading strong').textContent;next.click();return {edges,shape,templateSize,summary:document.querySelector('.nw-heading strong').textContent,layoutPage:!!document.querySelector('#nwLabelLayout'),footer:[...document.querySelectorAll('#newLabelWizard footer button')].map(button=>button.id)}})()`);
      if(sequence.edges!=='Side Edges'||sequence.shape!=='Printed Item Shape'||sequence.templateSize!=='Template Size'||sequence.summary!=='Summary'||sequence.layoutPage||sequence.footer.join(',')!=='nwBack,nwNext,nwCancel,nwFinish')throw Error('New Label wizard step order or footer order is incorrect: '+JSON.stringify(sequence));
      console.log('PASS wizard sequence: Items Per Page, Side Edges, Printed Item Shape, Template Size, Summary');
      await win.webContents.executeJavaScript("document.getElementById('newLabelWizard').close()");
      ipcMain.removeHandler('get-printer-resolution');
      const stale=await win.webContents.executeJavaScript(`window.zebra.getPrinterResolution(${JSON.stringify(readings[0].name)})`);
      const expectedDpi=readings[0].name.match(/(\d{2,4})\s*dpi/i)?.[1];
      if(stale?.code!=='APP_RESTART_REQUIRED'||stale.dpi!==(expectedDpi?Number(expectedDpi):undefined)||stale.error!==undefined||!/restart Q LABEL/i.test(stale.notice||''))throw Error('Missing main handler did not produce nominal queue DPI guidance: '+JSON.stringify(stale));
      console.log('PASS stale main process reports nominal queue DPI only when the printer name advertises it');
      finish();
    }catch(error){finish(error);}
  });
});
require('../gui/main');
setTimeout(()=>finish(Error('Timed out waiting for printer driver IPC.')),20000).unref();
