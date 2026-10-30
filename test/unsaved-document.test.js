'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
function harness(overrides={}){
  const state={window:{zebra:{saveTemplateSync(){state.writes++;return{ok:true};}}},document:{getElementById:()=>null},editing:{name:'label',elements:[{text:'CHANGED'}]},rawTemplate:{name:'label',elements:[{text:'SAVED'}]},current:{file:'label.json',editable:true},editorDirty:true,factoryEdited:false,autoSaveEnabled:false,editorSelection:new Set([0]),editorSel:0,editHistoryPersistTimer:null,editHistoryFile:'label.json',editRevisions:[],undoStack:[],redoStack:[],readingForSave:false,autoSavePolicy:{cancel(){}},clearTimeout,console,writes:0,asks:0,persists:0,choice:'cancel',openEditor(value){state.editing=structuredClone(value);},hasUnsavedEditorChanges:()=>!!state.editing&&(state.editorDirty||state.factoryEdited),showUnsavedClosePrompt:async()=>{state.asks++;return state.choice;},persistEditor:async()=>{state.persists++;state.editorDirty=false;},readEditorIntoDraft(){},recordEditRevision(){},persistEditHistory(){},...overrides};
  vm.createContext(state);
  vm.runInContext(source.slice(source.indexOf('window.markNewLabelDraft='),source.indexOf('function showUnsavedClosePrompt(')),state);
  vm.runInContext(source.slice(source.indexOf('window.prepareHotReload='),source.indexOf('async function persistEditor(')),state);
  return state;
}
test('manual Save/Discard/Cancel decisions gate document navigation instead of autosaving',async()=>{
  for(const [choice,allowed]of [['save',true],['discard',true],['cancel',false]]){const h=harness({choice});assert.equal(await h.window.prepareEditorNavigation(),allowed);assert.equal(h.asks,1);assert.equal(h.persists,0);assert.equal(h.writes,0);}
});
test('a dirty minimized window is revealed before the close prompt; clean close stays hidden',()=>{
  const line=source.split('\n').find(line=>line.includes('onWindowCloseRequested?.('));
  for(const dirty of [true,false]){
    const calls=[];let callback;
    const context={window:{zebra:{supportsWindowClosePrompt:true,onWindowCloseRequested:fn=>{callback=fn;},revealWindowForClosePrompt:()=>calls.push('reveal')},ModalWindowStack:{closeTop:()=>false}},hasUnsavedEditorChanges:()=>dirty,showUnsavedClosePrompt:()=>calls.push('prompt'),approveAppWindowClose:()=>calls.push('close'),allowWindowClose:false};
    vm.runInNewContext(line,context);callback();
    assert.deepEqual(calls,dirty?['reveal','prompt']:['close']);
  }
});
test('close prompt reveal restores minimized window and focuses its own sender',()=>{
  const main=fs.readFileSync(require.resolve('../gui/main'),'utf8');
  const block=main.slice(main.indexOf('function revealApplicationWindowForClosePrompt'),main.indexOf("ipcMain.on('reveal-window-for-close-prompt'"));
  const calls=[];const win={isDestroyed:()=>false,isMinimized:()=>true,isVisible:()=>false,flashFrame:flag=>calls.push(['flash',flag]),restore:()=>calls.push('restore'),show:()=>calls.push('show'),focus:()=>calls.push('focus'),moveTop:()=>calls.push('moveTop'),setAlwaysOnTop:(flag,level)=>calls.push(['alwaysOnTop',flag,level])};
  vm.runInNewContext(`${block}revealApplicationWindowForClosePrompt(win);`,{win,process:{platform:'win32'},app:{focus:opts=>calls.push(['appFocus',opts])},setImmediate:fn=>fn()});
  assert.ok(calls.includes('restore')&&calls.includes('focus')&&calls.some(entry=>Array.isArray(entry)&&entry[0]==='alwaysOnTop'&&entry[1]===true));
});
test('unsaved close prompt reveals the application window before showModal',()=>{
  const start=source.indexOf('function showUnsavedClosePrompt('),end=source.indexOf('function approveAppWindowClose(',start);
  const body=source.slice(start,end);
  assert.ok(body.includes('revealWindowForClosePrompt?.()'));
  assert.ok(body.indexOf('revealWindowForClosePrompt')<body.indexOf('dialog.showModal()'));
});
test('new unsaved documents still prompt when Auto Save is enabled; saved documents use the enabled policy',async()=>{
  const draft=harness({current:{file:null,editable:true},autoSaveEnabled:true});await draft.window.prepareEditorNavigation();assert.equal(draft.asks,1);assert.equal(draft.persists,0);
  const saved=harness({autoSaveEnabled:true});assert.equal(await saved.window.prepareEditorNavigation(),true);assert.equal(saved.persists,1);assert.equal(saved.asks,0);
});
test('discard restores the saved baseline, clears dirty state and cannot be written by hot reload',()=>{
  const h=harness();h.window.discardChangesBeforeClose();assert.equal(h.editing.elements[0].text,'SAVED');assert.equal(h.rawTemplate.elements[0].text,'SAVED');assert.equal(h.editorDirty,false);assert.equal(h.window.prepareHotReload(),true);assert.equal(h.writes,0);
});
test('discarding an unsaved draft clears its identity and returns Home without creating a file',()=>{
  let home=0;const h=harness({current:{file:null},rawTemplate:null});h.window.showProjectHome=()=>home++;
  h.window.discardChangesBeforeClose();assert.equal(h.editing,null);assert.equal(h.current,null);assert.equal(h.editorSelection.size,0);assert.equal(h.editHistoryFile,null);assert.equal(home,1);assert.equal(h.writes,0);
});
test('hot reload postpones manual edits and first-save drafts; it never silently saves clean documents',()=>{
  for(const overrides of [{},{editorDirty:false},{current:{file:null},autoSaveEnabled:true}]){const h=harness(overrides);assert.equal(h.window.prepareHotReload(),!h.editorDirty);assert.equal(h.writes,0);}
  const h=harness({autoSaveEnabled:true});assert.equal(h.window.prepareHotReload(),true);assert.equal(h.writes,1);
});

function nativeHydrationHarness(){
  const h=harness(),pending=[];
  Object.assign(h,{migrateDatabaseFieldAliases:()=>false,seedTemplateValues(){},el:()=>({value:'',textContent:''}),t:()=>'',refreshEditorUI(){h.renders++;},updateUndoButtons(){},setMode(){},drawEditorCanvas(){},touchEditor(){h.touches++;h.editorDirty=true;},encodeLibraryDecomposedBarcodes:()=>new Promise(resolve=>pending.push(resolve)),renders:0,touches:0});
  vm.runInContext(source.slice(source.indexOf('function openEditor('),source.indexOf('// --- Undo / Redo')),h);
  return{h,pending,native:{name:'native',elements:[],bartender_library_template:{objects_decomposed:true}}};
}

test('discarded native documents stay clean when asynchronous barcode hydration completes',async()=>{
  const {h,pending,native}=nativeHydrationHarness();h.rawTemplate=native;
  h.window.discardChangesBeforeClose();assert.equal(pending.length,1);pending.shift()();await Promise.resolve();await Promise.resolve();
  assert.equal(h.editorDirty,false);assert.equal(h.touches,0);assert.equal(h.window.prepareHotReload(),true);assert.equal(h.writes,0);
});

test('background barcode hydration from a previous document cannot mark its replacement dirty',async()=>{
  const {h,pending,native}=nativeHydrationHarness();h.openEditor(native);h.openEditor({name:'replacement',elements:[]});const renders=h.renders;
  pending.shift()();await Promise.resolve();await Promise.resolve();
  assert.equal(h.editing.name,'replacement');assert.equal(h.editorDirty,false);assert.equal(h.touches,0);assert.equal(h.renders,renders);
});
