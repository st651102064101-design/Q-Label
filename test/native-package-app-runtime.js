'use strict';
// Tests the production main/preload/wizard/save/reopen flow with an injected
// contract package. This fixture is not evidence that a library BTW is converted.
const {app,ipcMain}=require('electron');
// Hidden runtime fixtures use the CPU canvas; GPU readbacks can stall while occluded.
app.disableHardwareAcceleration();
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {fixture}=require('./fixtures/native-package-contract');
const loader=require('../lib/btw-native-package');
const source='D:/QLabelNativeLibraryAudit-20261023/library-templates/Accessory Box.btw';
const sourceSha=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const p=fixture();p.source.sha256=sourceSha;p.page={...p.page,enabled:false,unit:'mm',manual_template:false,manual_gap:true,top_mm:0,bottom_mm:0,left_mm:0,right_mm:0,gap_x_mm:0,gap_y_mm:0};p.fonts=[{family:'Contract font inventory',sha256:'f'.repeat(64)}];p.native_forms={enabled:false,promptingEnabled:false,controls:[],behaviorComplete:false};
p.elements.push({id:'native-barcode',type:'image',x_mm:25,y_mm:3,width_mm:20,height_mm:10,dataSourceRefs:['code'],sourceTextSnapshot:'CODE-1',barcode_spec:{bcid:'code128',text:'CODE-1',show_text:false},native_object:{id:'native-barcode',type:'BarCode-Code-128',name:'Original barcode',properties:{},xml:'<BarCode-Code-128 Name="Original barcode"/>'}});
p.sourceDefinitions.code={id:'code',name:'Barcode value',kind:'embedded',config:{value:'CODE-1'},transforms:[],dataType:{kind:'text'}};p.nativeObjectCount=3;
// Exercise the original Accessory Logo binding through the actual prepared-source IPC.
const auditDirectory='D:/QLabelNativeLibraryAudit-20261023/verified-export/'+sourceSha;
const nativeSources=require('../lib/btw-native-data-sources').readNativeDataSources(fs.readFileSync(path.join(auditDirectory,'data-sources.xml'),'utf8'));
const sourceResult=require('../lib/btw-native-source-converter').convertNativeSources('<DataSources>'+nativeSources.sources.map(s=>s.definitionXml).join('')+'</DataSources>');assert.equal(sourceResult.complete,true);
const logo=Object.values(sourceResult.sourceDefinitions).find(s=>s.name==='Logo');assert.ok(logo);p.sourceDefinitions[logo.id]=logo;
const nativeExport=require('../lib/btw-object-package').readNativeObjectExport(fs.readFileSync(path.join(auditDirectory,'objects.xml'),'utf8'));
const originalPicture=nativeExport.objects.find(o=>o.name==='Picture 3');
const originalLogoValue=logo.config.value;
p.elements.push({id:'native-logo',type:'image',x_mm:2.5908,y_mm:2.4511,width_mm:16.5862,height_mm:16.5862,dataSourceRefs:[logo.id],source_picture:{encoding:'base64'},color_image_data:'data:image/png;base64,'+fs.readFileSync(path.join(auditDirectory,originalPicture.pictureFile)).toString('base64'),native_object:{id:'native-logo',type:'Picture',name:'Picture 3',properties:{'@SourceType':'DataSourced','@PictureSource':'Base64'},xml:originalPicture.xml}});p.nativeObjectCount=4;
p.design_active='front';p.designs={front:{elements:structuredClone(p.elements)}};
const originalLoader=loader.loadVerifiedNativePackage;
loader.loadVerifiedNativePackage=bytes=>{
 const actual=crypto.createHash('sha256').update(bytes).digest('hex');
 return actual===sourceSha?loader.validateNativePackage(p,actual):originalLoader(bytes);
};
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-native-package-app-'));app.setPath('appData',profile);
const dataDir=path.join(profile,'Bratender');fs.mkdirSync(dataDir,{recursive:true});fs.writeFileSync(path.join(dataDir,'settings.json'),JSON.stringify({autoSaveEnabled:false,gridShow:false,printer:'Fixture printer'}));
const timeout=setTimeout(()=>{console.error('Native package application runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_,win)=>{
 win.webContents.setBackgroundThrottling(false);
 win.webContents.on('console-message',(_event,level,message)=>{if(level>=2||String(message).startsWith('NATIVE-PHASE:'))console.error('NATIVE RENDERER:',message);});
 win.webContents.on('did-fail-load',(_event,code,message)=>console.error('NATIVE LOAD:',code,message));
 win.webContents.once('did-finish-load',async()=>{try{win.showInactive();
  const result=await win.webContents.executeJavaScript(`(async()=>{
   console.log('NATIVE-PHASE:init');while(appInitializing)await new Promise(r=>setTimeout(r,25));console.log('NATIVE-PHASE:ready');
   const item=${JSON.stringify({name:'Contract fixture',source:'local',relative_path:source,btw_file_name:'Native contract fixture.btw'})};
   console.log('NATIVE-PHASE:ensure');const response=await window.zebra.ensureBarTenderLibraryBtw(item);
   if(response.import_mode!=='verified-native-objects'||response.elements.length!==4)throw Error('Main IPC did not return validated native package');
   window.openTemplateBrowser=async()=>({item});openNewLabelWizard();await new Promise(r=>setTimeout(r,100));nwTemplateLibrary.click();
   for(let i=0;i<200&&!nwLibraryDocument.textContent;i++)await new Promise(r=>setTimeout(r,20));
   window.discardChangesBeforeClose();await document.querySelector('#newLabelWizard form').onsubmit({preventDefault(){}});
   if(!editing?.bartender_library_template?.objects_decomposed)throw Error(nwError.textContent||'Finish lost native objects');
   if(current.file!==null||!getCloseState().dirty)throw Error('Native library Finish must leave an unsaved draft until explicit Save');
   console.log('NATIVE-PHASE:created');setBarcodeEditorValue(editing,0,'EDITED TEXT');setBarcodeEditorValue(editing,2,'EDITED-CODE');editing.elements[1].x_mm=7;await saveEditor(false);console.log('NATIVE-PHASE:saved');
   editing.elements[0].label='DISCARDED LABEL';touchEditor();window.discardChangesBeforeClose();await new Promise(r=>setTimeout(r,120));
   if(editorDirty||factoryEdited||!prepareHotReload())throw Error('Discarded native document was marked dirty again by background encoding');
   const prepared=await window.zebra.prepareSourceInputs({template:editing,context:{mode:'preview'}});if(!prepared.ok)throw Error(prepared.error);const data=window.DataSourceEngine.resolve(editing,{},prepared.inputs),logoArtwork=window.ObjectData.artwork(editing.elements[3],data,true);
   console.log('NATIVE-PHASE:prepared');const logoId=editing.elements[3].id,logoRefs=JSON.stringify(editing.elements[3].dataSourceRefs);
   const originalDecode=Image.prototype.decode;Image.prototype.decode=function(...args){console.log('NATIVE-PHASE:image-decode');return originalDecode.apply(this,args).then(v=>{console.log('NATIVE-PHASE:image-decoded');return v;});};
   const replacement=document.createElement('canvas');replacement.width=2;replacement.height=2;const rc=replacement.getContext('2d');rc.fillStyle='#ff0000';rc.fillRect(0,0,1,2);rc.fillStyle='#0000ff';rc.fillRect(1,0,1,2);
   console.log('NATIVE-PHASE:before-blob');const pixelBytes=Uint8Array.from(atob(replacement.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0)),transfer=new DataTransfer();transfer.items.add(new File([pixelBytes],'replacement-logo.png',{type:'image/png'}));console.log('NATIVE-PHASE:file-ready');pendingImageReplaceIndex=3;pendingImageFormat='image';el('imageFile').files=transfer.files;console.log('NATIVE-PHASE:replace-start');await el('imageFile').onchange();console.log('NATIVE-PHASE:replace-end');
   if(editing.elements.length!==4||editing.elements[3].id!==logoId||JSON.stringify(editing.elements[3].dataSourceRefs)!==logoRefs)throw Error('Replacing picture lost original object/source binding');
   console.log('NATIVE-PHASE:replaced');await saveEditor(false);
   const file=current.file,before=JSON.stringify(editing.elements),sources=JSON.stringify(editing.sourceDefinitions);
   await selectTemplate(file);openEditor(rawTemplate);
      const afterPrepared=await window.zebra.prepareSourceInputs({template:editing,context:{mode:'preview'}});if(!afterPrepared.ok)throw Error(afterPrepared.error);const afterData=window.DataSourceEngine.resolve(editing,{},afterPrepared.inputs),replacedLogoArtwork=window.ObjectData.artwork(editing.elements[3],afterData,true);
   return {file,before,after:JSON.stringify(editing.elements),sources,afterSources:JSON.stringify(editing.sourceDefinitions),template:editing,logoArtwork,replacedLogoArtwork};
  })()`);
  assert.equal(result.before,result.after,'save/reopen must preserve original editable objects');assert.equal(result.sources,result.afterSources,'named source registry must survive');
  const saved=JSON.parse(fs.readFileSync(path.join(dataDir,'templates',result.file),'utf8'));
  assert.equal(saved.elements.length,4);assert.equal(saved.bartender_library_template.native_source_sha256,sourceSha);
  p.sourceDefinitions.named.config.value='EDITED TEXT';p.sourceDefinitions.code.config.value='EDITED-CODE';
  p.elements[1].x_mm=7;p.designs.front.elements[1].x_mm=7;
  p.sourceDefinitions[logo.id].config.value=saved.sourceDefinitions[logo.id].config.value;assert.notEqual(p.sourceDefinitions[logo.id].config.value,originalLogoValue);assert.equal(saved.sourceDefinitions[logo.id].name,'Logo');
  for(const key of ['sourceDefinitions','fonts','page','native_forms'])assert.deepEqual(saved[key],p[key],key);assert.deepEqual(saved.designs.front.elements,saved.elements,'active native design cache follows replacement and move');
  const png=require('pngjs').PNG,actualLogo=png.sync.read(Buffer.from(result.logoArtwork.color_image_data.split(',')[1],'base64')),originalLogo=png.sync.read(Buffer.from(originalLogoValue,'base64'));assert.equal(actualLogo.width,255);assert.equal(actualLogo.height,255);assert.deepEqual(actualLogo.data,originalLogo.data);
  const replacedLogo=png.sync.read(Buffer.from(result.replacedLogoArtwork.color_image_data.split(',')[1],'base64'));assert.equal(replacedLogo.width,2);assert.equal(replacedLogo.height,2);assert.deepEqual([...replacedLogo.data],[255,0,0,255,0,0,255,255,255,0,0,255,0,0,255,255]);assert.deepEqual(saved.elements[3].dataSourceRefs,[logo.id]);assert.equal(saved.elements[3].width_mm,16.5862);
  assert.equal(saved.elements[1].x_mm,7);assert.equal(saved.elements[0].x_mm,2);assert.equal(saved.elements[2].x_mm,25);
  assert.deepEqual(saved.elements.map(e=>e.id),p.elements.map(e=>e.id));assert.deepEqual(saved.elements.map(e=>e.native_object),p.elements.map(e=>e.native_object));
  clearTimeout(timeout);console.log(JSON.stringify({status:'PASS',fixtureOnly:true,productionMain:true,finish:true,objects:4,originalNativeLogo:true,rendererPictureReplacement:true,editedText:true,editedBarcode:true,saved:true,reopened:true}));app.exit(0);
 }catch(error){clearTimeout(timeout);console.error(error.stack||error);app.exit(1);}});
});
require('../gui/main');ipcMain.removeHandler('list-printers');ipcMain.handle('list-printers',()=>['Fixture printer']);ipcMain.removeHandler('get-printer-resolution');ipcMain.handle('get-printer-resolution',()=>({dpi:600,source:'fixture'}));
