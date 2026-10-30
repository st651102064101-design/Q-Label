'use strict';
const {app,ipcMain}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-new-project-'));
app.setPath('appData',profile);
const dir=path.join(profile,'Bratender','templates');fs.mkdirSync(dir,{recursive:true});
const original=JSON.stringify({name:'new-label',width_mm:50,height_mm:25,dpi:203,elements:[{type:'text',text:'ORIGINAL',x_mm:2,y_mm:2,height_mm:3,width_mm:3}]});
fs.writeFileSync(path.join(dir,'new-label.json'),original);
fs.writeFileSync(path.join(profile,'Bratender','settings.json'),JSON.stringify({autoSaveEnabled:false,gridShow:true,printer:'Fixture printer',lastTemplate:'new-label.json'}));
setTimeout(()=>{console.error('New project runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_,win)=>{
  win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.hide());
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2||message.startsWith('NEW-PROJECT'))console.log(message);});
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(r=>setTimeout(r,25));
        console.log('NEW-PROJECT: initialized');
        let checks=0;const check=(ok,message)=>{checks++;if(!ok)throw Error(message);};
        check(!autoSaveEnabled,'fixture must disable Auto Save');
        for(let index=1;index<=2;index++){
          const homeNavigation=window.showProjectHome();document.querySelector('[data-close-discard]')?.click();await homeNavigation;await window.openNewLabelWizard();
          const dialog=document.getElementById('newLabelWizard');
          for(let n=0;n<100&&document.getElementById('nwNext').disabled;n++)await new Promise(r=>setTimeout(r,20));
          check(!document.getElementById('nwNext').disabled,'printer fixture is not ready');
          const selectedPrinter=index===1?'Second fixture printer':'Fixture printer';
          const printerField=document.getElementById('nwPrinter');printerField.value=selectedPrinter;printerField.dispatchEvent(new Event('change',{bubbles:true}));
          for(let n=0;n<100&&document.getElementById('nwNext').disabled;n++)await new Promise(r=>setTimeout(r,20));
          check(!document.getElementById('nwNext').disabled,'selected printer DPI is not ready');
          const finish=()=>dialog.querySelector('form').onsubmit({preventDefault(){}});
          // Simulate the previous project's all-object Properties mode.
          const priorEditing=editing;
          if(!editing)editing=blankTemplate();
          const priorElements=editing.elements;
          editing.elements=[{type:'text',label:'Prior text',text:'A',x_mm:0,y_mm:0,width_mm:10,height_mm:4}];
          openObjectProperties(0);
          document.querySelector('#objectProperties [data-tree-view="all"]').click();
          document.querySelector('#objectProperties header button[aria-label="Close"]').click();
          await new Promise(resolve=>setTimeout(resolve,30));
          editing.elements=priorElements;editing=priorEditing;
          console.log('NEW-PROJECT: finishing '+index+' dirty='+hasUnsavedEditorChanges());
          const finishing=Promise.all([finish(),finish()]);
          // Startup migrations can mark this isolated legacy fixture dirty.
          // Exercise the actual navigation prompt rather than bypassing it.
          const discard=document.querySelector('[data-close-discard]');
          if(discard)discard.click();
          await finishing;
          check(!dialog.open,'Finish did not close wizard: '+document.getElementById('nwError').textContent);
          check(current.file===null&&editorDirty,'Finish must leave an unsaved document');
          check((await window.zebra.listTemplates()).filter(t=>/^new-label/.test(t.file)).length===index,'Finish must not create a file');
          await saveEditor(false);
          check(current.file==='new-label ('+index+').json','explicit first Save must allocate a distinct filename '+current.file);
          check(!editorGrid.show&&!document.getElementById('chkGrid').checked,'new projects must start with Show grid off, even after it was previously enabled');
          const newElements=editing.elements;
          editing.elements=[{type:'text',label:'New text',text:'A',x_mm:0,y_mm:0,width_mm:10,height_mm:4},{type:'text',label:'Other text',text:'B',x_mm:0,y_mm:5,width_mm:10,height_mm:4}];
          openObjectProperties(0);
          check(document.querySelector('#objectProperties [data-tree-view="single"]').getAttribute('aria-pressed')==='true','new project must reset Properties to selected-object mode');
          check(document.querySelectorAll('#objectProperties [data-object-root]').length===1,'new project Properties must show one object');
          document.querySelector('#objectProperties header button[aria-label="Close"]').click();
          await new Promise(resolve=>setTimeout(resolve,30));editing.elements=newElements;
          const gapButton=document.querySelector('button[aria-label="Hide gap"],button[aria-label="Show gap"]'),gapBefore=JSON.stringify(editing);
          check(gapButton&&!gapButton.disabled&&gapButton.getAttribute('aria-label')==='Hide gap','new projects start with Hide gap active while gaps are hidden');
          check(!document.querySelector('#previewFrame [data-paper-edge]'),'gaps must stay hidden until Show gap is chosen');
          gapButton.click();
          check(document.querySelectorAll('#previewFrame [data-paper-edge]').length===4,'Show gap must display all four outside paper edges');
          check(JSON.stringify(editing)===gapBefore,'Show gap changed the print layout');
          gapButton.click();
          check(!document.querySelector('#previewFrame [data-paper-edge]'),'Hide gap did not remove the outer guides');
          if(index===1){document.getElementById('chkGrid').checked=true;document.getElementById('chkGrid').dispatchEvent(new Event('change',{bubbles:true}));}
          check(settings.projectPrinters?.[current.file]===selectedPrinter,'the created project did not remember its selected printer');
          check(editing.name==='new-label ('+index+')','wrong editor project name');
          check(document.getElementById('edName').value===editing.name,'editor filename field is stale');
          check((await window.zebra.listTemplates()).filter(t=>/^new-label/.test(t.file)).length===index+1,'Finish did not create exactly one project');
        }
        editing.elements.push({type:'text',text:'NEW CONTENT',x_mm:2,y_mm:2,height_mm:3,width_mm:3});touchEditor();
        await saveEditor(false);
        console.log('NEW-PROJECT: saved');
        check(current.file==='new-label (2).json','Save changed project identity');
        const mainPrinter=document.getElementById('printerSelect');mainPrinter.value='Second fixture printer';mainPrinter.dispatchEvent(new Event('change',{bubbles:true}));
        check(settings.projectPrinters['new-label (2).json']==='Second fixture printer','changing the active printer did not update the current project');
        mainPrinter.value='Fixture printer';mainPrinter.dispatchEvent(new Event('change',{bubbles:true}));
        check(settings.projectPrinters['new-label (2).json']==='Fixture printer',"the current project's printer could not be changed again");
        await saveEditor(false);
        await selectTemplate('new-label.json');check(editing.elements[0].text==='ORIGINAL','original was overwritten');
        await selectTemplate('new-label (1).json');check(document.getElementById('printerSelect').value==='Second fixture printer','reopening project one did not restore its printer');
        await selectTemplate('new-label (2).json');check(document.getElementById('printerSelect').value==='Fixture printer','reopening project two did not restore its printer');
        check(editing.elements[0].text==='NEW CONTENT','new content did not survive reopen');
        window.showProjectHome();
        const names=[...document.querySelectorAll('.ph-project-name')].map(node=>node.textContent);
        check(['new-label','new-label (1)','new-label (2)'].every(name=>names.includes(name)),'Recent projects did not show distinct cards: '+names.join(', '));
        return {checks,files:(await window.zebra.listTemplates()).filter(t=>/^new-label/.test(t.file)).map(t=>t.file)};
      })().catch(error=>{console.error('NEW-PROJECT-ERROR: '+(error.stack||error));throw error;})`);
      assert.equal(fs.readFileSync(path.join(dir,'new-label.json'),'utf8'),original);
      assert.equal(fs.existsSync(path.join(dir,'new-label__2_.json')),false);
      console.log(JSON.stringify({...result,originalBytesUnchanged:true,passed:true}));app.exit(0);
    }catch(error){console.error(error);app.exit(1);}
  });
});
require('../gui/main');
ipcMain.removeHandler('list-printers');ipcMain.handle('list-printers',()=>['Fixture printer','Second fixture printer']);
ipcMain.removeHandler('get-printer-resolution');ipcMain.handle('get-printer-resolution',()=>({dpi:203,source:'fixture'}));
