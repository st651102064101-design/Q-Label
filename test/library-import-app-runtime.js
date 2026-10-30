'use strict';
const {app,ipcMain}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-library-app-'));app.setPath('appData',profile);
const source='C:/ProgramData/Seagull/PrintStation/wwwroot/Templates/Military/MIL-STD-130/A4A Label.btw';
const dataDir=path.join(profile,'Bratender');fs.mkdirSync(dataDir,{recursive:true});fs.writeFileSync(path.join(dataDir,'settings.json'),JSON.stringify({autoSaveEnabled:false,gridShow:false,printer:'Fixture printer'}));
fs.mkdirSync(path.join(dataDir,'templates'),{recursive:true});fs.writeFileSync(path.join(dataDir,'templates','legacy-a4a.json'),JSON.stringify({name:'Legacy A4A',width_mm:76.2,height_mm:25.4,dpi:600,label_shape:'rounded',elements:[],bartender_library_template:{name:'A4A Label',btw_url:'https://bartender-template-s3-storage-gateway.s3.us-west-2.amazonaws.com/Production/A4A+Label.btw',source:'cloud'}}));
const timeout=setTimeout(()=>{console.error('Library import application runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_,win)=>{
 win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);
 win.webContents.on('console-message',(_e,level,message)=>{if(level>=2||message.startsWith('LIBRARY:'))console.log(message);});
 win.webContents.once('did-finish-load',async()=>{
  try{
   const result=await win.webContents.executeJavaScript(`(async()=>{
    while(appInitializing)await new Promise(r=>setTimeout(r,25));
    console.log('LIBRARY: initialized');
    await selectTemplate('legacy-a4a.json');if(!rawTemplate.elements?.length)throw Error('Legacy empty library project was not recovered');window.discardChangesBeforeClose();
    window.openTemplateBrowser=async()=>({item:${JSON.stringify({name:'A4A Label',source:'cloud',btw_url:'https://bartender-template-s3-storage-gateway.s3.us-west-2.amazonaws.com/Production/A4A+Label.btw',width_in:3,height_in:1,btw_file_name:'A4A Label.btw'})}});
    openNewLabelWizard();await new Promise(r=>setTimeout(r,50));document.getElementById('nwTemplateLibrary').click();
    for(let i=0;i<200&&!document.getElementById('nwLibraryDocument').textContent;i++)await new Promise(r=>setTimeout(r,20));
    if(!document.getElementById('nwLibraryDocument').textContent)throw Error(document.getElementById('nwError').textContent);
    console.log('LIBRARY: artwork selected');
    window.discardChangesBeforeClose();
    await document.querySelector('#newLabelWizard form').onsubmit({preventDefault(){}});
    console.log('LIBRARY: created');
    if(!editing?.elements?.length)throw Error(document.getElementById('nwError').textContent||'Imported artwork missing');
    const decomposed=!!editing.bartender_library_template?.objects_decomposed;
    if(decomposed||editing.elements.length!==1||editing.elements[0].type!=='image')throw Error('Library artwork should remain one faithful image');
    const file=current.file,snapshot=JSON.stringify(editing.elements);await selectTemplate(file);openEditor(rawTemplate);
    console.log('LIBRARY: reopened');
    if(JSON.stringify(editing.elements)!==snapshot)throw Error('Reopening lost imported objects');
    await new Promise(r=>setTimeout(r,150));
    return{file,elements:editing.elements.length,decomposed,width:editing.width_mm,height:editing.height_mm,renderedPng:LabelPreview.rasterizeCanvas(editing,{},null,{}).toDataURL('image/png')};
   })()`);
   assert.equal(result.elements,1,JSON.stringify(result));assert.equal(result.decomposed,false);assert.ok(Math.abs(result.width-76.2)<1e-6);assert.ok(Math.abs(result.height-25.4)<1e-6);
   const saved=JSON.parse(fs.readFileSync(path.join(dataDir,'templates',result.file),'utf8'));assert.equal(saved.elements.length,1);
   const out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'library-a4a-editor-artwork.png'),Buffer.from(result.renderedPng.split(',')[1],'base64'));delete result.renderedPng;
   clearTimeout(timeout);console.log(JSON.stringify({status:'PASS',...result,reopened:true,saved:true,legacyRecovered:true}));app.exit(0);
  }catch(e){clearTimeout(timeout);console.error(e.stack||e);app.exit(1);}
 });
});
require('../gui/main');
ipcMain.removeHandler('list-printers');ipcMain.handle('list-printers',()=>['Fixture printer']);
ipcMain.removeHandler('get-printer-resolution');ipcMain.handle('get-printer-resolution',()=>({dpi:600,source:'fixture'}));


