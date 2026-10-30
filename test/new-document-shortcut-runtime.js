'use strict';
const {app,ipcMain}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-new-shortcut-'));
app.setPath('appData',profile);
const templates=path.join(profile,'Bratender','templates');fs.mkdirSync(templates,{recursive:true});
const fixture=JSON.stringify({name:'Shortcut fixture',width_mm:80,height_mm:50,dpi:203,elements:[
  {type:'text',text:'Original text',x_mm:3,y_mm:3,width_mm:25,height_mm:6,font_size_pt:18},
  {type:'image',label:'Table',x_mm:3,y_mm:15,width_mm:40,height_mm:20,table_model:{rows:[{mode:'Fixed',size:10},{mode:'Fixed',size:10}],columns:[{mode:'Fixed',size:20},{mode:'Fixed',size:20}],values:[['A','B'],['C','D']],padding:.5,fontSize:3,stroke:.175,border:'#000000',fill:'#ffffff',borders:'All',errors:{clip:true}}}
]});
const originalFile=path.join(templates,'Shortcut fixture.json');fs.writeFileSync(originalFile,fixture);
fs.writeFileSync(path.join(profile,'Bratender','settings.json'),JSON.stringify({autoSaveEnabled:false,lastTemplate:'Shortcut fixture.json',printer:'Fixture printer'}));
const timer=setTimeout(()=>{console.error('New shortcut runtime timed out');app.exit(1);},90000);
app.on('browser-window-created',(_,win)=>{
  win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.hide());
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error(message);});
  win.webContents.once('did-finish-load',async()=>{
    const evaluate=source=>win.webContents.executeJavaScript(source);
    try{
      await evaluate(`(async()=>{while(appInitializing)await new Promise(r=>setTimeout(r,25));hideProjectHome();openEditor(await window.zebra.loadTemplateRaw('Shortcut fixture.json'));await new Promise(r=>setTimeout(r,100));
        window.newShortcutChecks={clicks:0,domKeys:0};
        document.getElementById('newTemplateBtn').addEventListener('click',()=>newShortcutChecks.clicks++);
        document.addEventListener('keydown',e=>{if(e.code==='KeyN')newShortcutChecks.domKeys++;},true);
      })()`);
      let checks=0;const check=(ok,message)=>{checks++;assert.ok(ok,message);};
      async function nativeNew(repeat=false){
        win.webContents.focus();
        win.webContents.sendInputEvent({type:'keyDown',keyCode:'N',modifiers:repeat?['control','isAutoRepeat']:['control']});
        win.webContents.sendInputEvent({type:'keyUp',keyCode:'N',modifiers:['control']});
        await evaluate('new Promise(r=>setTimeout(r,100))');
      }
      async function expectOpen(label,action=nativeNew){
        const before=await evaluate('newShortcutChecks.clicks');await action();
        const result=await evaluate(`({open:document.getElementById('newLabelWizard').open,clicks:newShortcutChecks.clicks})`);
        check(result.open,label+': wizard did not open');check(result.clicks===before+1,label+': duplicate/missing New dispatch');
        await evaluate(`document.getElementById('nwCancel').click()`);
        check(!await evaluate(`document.getElementById('newLabelWizard').open`),label+': Cancel did not close');
      }
      await evaluate(`editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();focusTextProperty(0,false);const input=document.getElementById('canvasTextEditor');if(!input||document.activeElement!==input)throw Error('Text editor did not focus');input.value='Edited text before New';input.dispatchEvent(new Event('input',{bubbles:true}));`);
      await expectOpen('canvas text');
      check(await evaluate(`editing.elements[0].text==='Edited text before New'`),'New/Cancel lost text edits');
      await evaluate(`editorSel=1;editorSelection=new Set([1]);drawEditorCanvas();TableTools.editCell(1,0,0);const cell=document.querySelector('.table-cell-editor');if(!cell||document.activeElement!==cell)throw Error('Table cell did not focus');cell.value='Edited cell before New';cell.dispatchEvent(new Event('input',{bubbles:true}));`);
      await expectOpen('table cell');
      check(await evaluate(`editing.elements[1].table_model.values[0][0]==='Edited cell before New'`),'New/Cancel lost table edits');
      await evaluate(`const field=document.getElementById('edName');field.addEventListener('keydown',e=>e.stopImmediatePropagation());field.focus();`);
      await expectOpen('property input');
      check(await evaluate('newShortcutChecks.domKeys===0'),'native Ctrl+N also reached DOM fallback');
      await expectOpen('Thai keyboard fallback',()=>evaluate(`document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'ท',code:'KeyN',ctrlKey:true,bubbles:true,cancelable:true}))`));
      await nativeNew(true);
      check(!await evaluate(`document.getElementById('newLabelWizard').open`),'held key reopened wizard after Cancel');
      await expectOpen('fresh key after repeat');
      await evaluate(`openObjectProperties(0)`);await nativeNew();
      check(await evaluate(`document.getElementById('objectProperties').open&&!document.getElementById('newLabelWizard').open`),'Ctrl+N escaped an active modal');
      await evaluate(`document.getElementById('objectProperties').close();showProjectHome();`);
      await expectOpen('Project Home');
      await expectOpen('Home repeat open/cancel');
      check(fs.readFileSync(originalFile,'utf8')===fixture,'Cancel changed the original document on disk');
      console.log(JSON.stringify({passed:true,checks,nativeMainPreloadRenderer:true,thaiLayoutFallback:true,inlineTextAndTableEditsPreserved:true,profile}));
      clearTimeout(timer);app.exit(0);
    }catch(error){console.error(error.stack||error);clearTimeout(timer);app.exit(1);}
  });
});
require('../gui/main');
ipcMain.removeHandler('list-printers');ipcMain.handle('list-printers',()=>['Fixture printer']);
ipcMain.removeHandler('get-printer-resolution');ipcMain.handle('get-printer-resolution',()=>({dpi:203,source:'fixture'}));
