'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const Session=require('../gui/source-session'),UI=require('../gui/object-data-sources-ui');
function harness(){const dom=new JSDOM('<form><div id="editor"></div></form>',{url:'http://localhost'}),session=Session.createSession({elements:[{type:'text',text:'A'},{type:'text',text:'B'}]});dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};let changes=0;const root=dom.window.document.querySelector('#editor');const editor=UI.mount(root,{session,objectId:session.draft.elements[0].id,onChange:()=>{changes++;}});return{dom,session,root,editor,get changes(){return changes;}};}
const click=(h,label)=>{const button=[...h.root.querySelectorAll('button')].find(b=>b.title===label||b.textContent===label);assert.ok(button,label);button.click();};
const wizardButton=(wizard,label)=>{const button=[...wizard.querySelectorAll('button')].find(b=>b.textContent===label);assert.ok(button,label);button.click();};

test('Data Type popup has distinct SVG choices and chevron, and Escape cancels only the popup inside a dialog',()=>{
  const h=harness(),doc=h.dom.window.document,dialog=doc.createElement('dialog');
  h.root.before(dialog);dialog.append(h.root);dialog.open=true;
  let shown=0,cancelledDialog=0;h.dom.window.HTMLElement.prototype.showPopover=function(){shown++;};
  dialog.addEventListener('cancel',()=>cancelledDialog++);
  click(h,'Data Type');const toggle=h.root.querySelector('[role="combobox"][aria-label="Data Type"]');
  assert.ok(toggle.querySelector('[data-picker-chevron] path'));assert.equal(toggle.textContent.includes('⌄'),false);
  toggle.click();const menu=h.root.querySelector('[aria-label="Data Types"]'),items=[...menu.querySelectorAll('[role="option"]')];
  assert.equal(shown,1);assert.deepEqual(items.map(e=>e.dataset.value),['text','date','time','number','currency','percentage','fraction','binary','picture']);
  assert.equal(new Set(items.map(e=>e.querySelector('svg path').getAttribute('d'))).size,9);
  const cancel=new h.dom.window.Event('cancel',{cancelable:true});dialog.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented,true);assert.equal(cancelledDialog,0);assert.equal(dialog.open,true);assert.equal(menu.isConnected,false);assert.equal(doc.activeElement,toggle);
  toggle.click();items[0].click();h.editor.dispose();h.dom.window.close();
});
test('source context menu selects the clicked source and shares real toolbar commands',()=>{
  const h=harness();addSource(h);const value=h.root.querySelector('[name="source.value"]');value.value='TAIL';value.dispatchEvent(new h.dom.window.Event('input'));
  const open=index=>{h.root.querySelectorAll('[role="option"]')[index].dispatchEvent(new h.dom.window.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:12,clientY:20}));const menu=h.root.querySelector('[role="menu"]');assert.ok(menu);return menu;};
  let menu=open(0);assert.deepEqual([...menu.querySelectorAll('[role="menuitem"]')].map(b=>b.dataset.action),['New Data Source','Delete','Cut','Copy','Paste','Move Up','Move Down']);
  assert.equal(menu.querySelector('[data-action="Move Up"]').disabled,true);assert.equal(menu.querySelector('[data-action="Move Down"]').disabled,false);
  menu.querySelector('[data-action="Move Down"]').click();assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'TAILA');assert.equal(h.root.querySelector('[role="menu"]'),null);
  menu=open(0);menu.querySelector('[data-action="Copy"]').click();menu=open(1);menu.querySelector('[data-action="Paste"]').click();assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'TAILATAIL');
  menu=open(2);menu.querySelector('[data-action="Delete"]').click();assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'TAILA');
  menu=open(0);h.editor.dispose();assert.equal(h.dom.window.document.querySelector('[role="menu"]'),null);h.dom.window.close();
});
test('source menu supports keyboard opening, navigation and escape without mutating the draft',()=>{
  const h=harness(),list=h.root.querySelector('[role="listbox"]'),before=structuredClone(h.session.draft);
  list.dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'F10',shiftKey:true,bubbles:true,cancelable:true}));
  const menu=h.root.querySelector('[role="menu"]');assert.ok(menu);assert.equal(h.dom.window.document.activeElement.dataset.action,'New Data Source');
  menu.dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));assert.equal(h.dom.window.document.activeElement.dataset.action,'Delete');
  menu.dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(h.root.querySelector('[role="menu"]'),null);assert.deepEqual(h.session.draft,before);assert.equal(h.dom.window.document.activeElement,list);h.dom.window.close();
});
test('advertised source shortcuts execute while the context menu owns keyboard focus',()=>{
  const h=harness();addSource(h);const input=h.root.querySelector('[name="source.value"]');input.value='TAIL';input.dispatchEvent(new h.dom.window.Event('input'));
  const key=(key,ctrlKey=false)=>{h.root.querySelector('[role="menu"]').dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key,ctrlKey,bubbles:true,cancelable:true}));};
  const open=()=>h.root.querySelector('[role="listbox"]').dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'ContextMenu',bubbles:true,cancelable:true}));
  open();key('ArrowUp',true);assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'TAILA');assert.equal(h.root.querySelector('[role="menu"]'),null);
  open();key('C',true);open();key('v',true);assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'TAILTAILA');open();key('Delete');assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'TAILA');h.dom.window.close();
});
test('renderer canvas shortcuts leave source dialog key events to their local commands',()=>{
  const dom=new JSDOM('<dialog open><section class="object-source-editor"><button>Copy</button></section></dialog>',{runScripts:'dangerously'}),w=dom.window;
  w.zebra={onNewShortcut:()=>{}};
  let canvasCalls=0;Object.assign(w,{editing:{elements:[{type:'text'}]},editorSel:0,editorSelection:new Set([0]),elementClipboard:{},copySelectedElement:()=>{canvasCalls++;return true;},pasteElement:()=>canvasCalls++,deleteSelectedElement:()=>canvasCalls++,shortcutKey:e=>e.key.toLowerCase()});
  const source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8'),start=source.indexOf('  const shortcutKey=event=>'),end=source.indexOf('  window.zebra.onPrintShortcut',start);assert.ok(start>=0&&end>start);w.eval(source.slice(start,end));
  let received=0;const button=w.document.querySelector('button');button.addEventListener('keydown',e=>{received++;e.preventDefault();e.stopPropagation();});for(const key of ['x','c','v','Delete'])button.dispatchEvent(new w.KeyboardEvent('keydown',{key,ctrlKey:key!=='Delete',bubbles:true,cancelable:true}));
  assert.equal(canvasCalls,0);assert.equal(received,4);dom.window.close();
});
test('source list arrows select data without reordering and restore focus after rendering',()=>{
  const h=harness();addSource(h);const refs=[...h.session.draft.elements[0].dataSourceRefs];
  const key=value=>h.root.querySelector('[role="listbox"]').dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
  key('Home');assert.equal(h.root.querySelector('[name="source.value"]').value,'A');assert.equal(h.dom.window.document.activeElement.getAttribute('aria-selected'),'true');
  key('ArrowDown');assert.equal(h.root.querySelectorAll('[role="option"]')[1].getAttribute('aria-selected'),'true');key('ArrowDown');assert.equal(h.root.querySelectorAll('[role="option"]')[1].getAttribute('aria-selected'),'true');key('ArrowUp');assert.equal(h.root.querySelectorAll('[role="option"]')[0].getAttribute('aria-selected'),'true');key('End');assert.equal(h.root.querySelectorAll('[role="option"]')[1].getAttribute('aria-selected'),'true');assert.deepEqual(h.session.draft.elements[0].dataSourceRefs,refs);h.dom.window.close();
});
function addSource(h){click(h,'New Data Source');const wizard=h.dom.window.document.querySelector('.source-new-wizard');assert.ok(wizard);wizardButton(wizard,'Next');wizardButton(wizard,'Finish');}
test('new source wizard commits only on Finish and Cancel discards its staged data',()=>{
  const h=harness(),before=structuredClone(h.session.draft);click(h,'New Data Source');let wizard=h.dom.window.document.querySelector('.source-new-wizard');assert.ok(wizard?.open);assert.deepEqual(h.session.draft,before);
  const kind=wizard.querySelector('[name="new.kind"]');assert.equal(UI.sourceKinds.length,12);assert.equal(kind.options.length,11);assert.equal([...kind.options].some(option=>option.value==='named'),false);kind.value='database';kind.dispatchEvent(new h.dom.window.Event('change'));wizardButton(wizard,'Next');
  const field=wizard.querySelector('[name="new.field"]');field.value='SKU';field.dispatchEvent(new h.dom.window.Event('input'));wizardButton(wizard,'Cancel');assert.deepEqual(h.session.draft,before);
  click(h,'New Data Source');wizard=h.dom.window.document.querySelector('.source-new-wizard');wizardButton(wizard,'Next');const value=wizard.querySelector('[name="new.value"]');value.value='TAIL';value.dispatchEvent(new h.dom.window.Event('input'));assert.deepEqual(h.session.draft,before);wizardButton(wizard,'Finish');
  assert.equal(h.session.draft.elements[0].dataSourceRefs.length,2);assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'ATAIL');assert.equal(h.dom.window.document.querySelector('.source-new-wizard'),null);h.dom.window.close();
});
test('new source wizard keeps duplicate-name errors open without changing the source list',()=>{
  const h=harness();h.session.update(d=>{d.sourceDefinitions[d.elements[0].dataSourceRefs[0]].name='Shared';});const before=structuredClone(h.session.draft);click(h,'New Data Source');const wizard=h.dom.window.document.querySelector('.source-new-wizard');assert.ok(wizard);wizardButton(wizard,'Next');const name=wizard.querySelector('[name="new.name"]');name.value='Shared';name.dispatchEvent(new h.dom.window.Event('input'));wizardButton(wizard,'Finish');assert.ok(wizard.open);assert.match(wizard.textContent,/Duplicate source name/);assert.deepEqual(h.session.draft,before);wizardButton(wizard,'Cancel');h.dom.window.close();
});
test('serialization starts from existing data and exposes exact character methods and interval settings',()=>{
  const h=harness();click(h,'Transforms');h.root.querySelector('[aria-label="Enable Serialization"]').click();
  const id=h.session.draft.elements[0].dataSourceRefs[0],config=h.session.draft.sourceDefinitions[id].transforms.find(t=>t.kind==='serialization');
  assert.equal(config.start,undefined);
  h.root.querySelector('[data-transform-kind="serialization"] button').click();
  const method=h.root.querySelector('[name="transform.serialization.method"]');assert.ok(method);method.value='custom';method.dispatchEvent(new h.dom.window.Event('change'));
  assert.equal(h.session.draft.sourceDefinitions[id].transforms[0].method,'auto','configuration remains staged');
  assert.ok(h.root.querySelector('[name="transform.serialization.interval"]'));assert.ok(h.root.querySelector('[name="transform.serialization.trackInterval"]'));
  const start=h.root.querySelector('[name="transform.serialization.start"]');assert.equal(start.type,'text');start.value='0099';start.dispatchEvent(new h.dom.window.Event('input'));start.value='';start.dispatchEvent(new h.dom.window.Event('input'));
  wizardButton(h.root.querySelector('.source-transform-dialog'),'OK');assert.equal(h.session.draft.sourceDefinitions[id].transforms[0].method,'custom');assert.equal(h.session.draft.sourceDefinitions[id].transforms[0].start,undefined);h.dom.window.close();
});
test('source editor edits selected data, adds and reorders multiple real sources',()=>{
  const h=harness(),input=h.root.querySelector('[name="source.value"]');input.value='ONE';input.dispatchEvent(new h.dom.window.Event('input'));
  assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'ONE');
  addSource(h);const next=h.root.querySelector('[name="source.value"]');next.value='TWO';next.dispatchEvent(new h.dom.window.Event('input'));
  assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'ONETWO');click(h,'Move Up');
  assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'TWOONE');assert.ok(h.changes>=4);h.dom.window.close();
});
test('copy paste creates independent source and keyboard shortcuts do not steal text editing',()=>{
  const h=harness();click(h,'Copy');click(h,'Paste');
  const refs=h.session.draft.elements[0].dataSourceRefs;assert.equal(refs.length,2);assert.notEqual(refs[0],refs[1]);
  const input=h.root.querySelector('[name="source.value"]');input.value='B';input.dispatchEvent(new h.dom.window.Event('input'));
  assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'AB');
  input.dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'x',ctrlKey:true,bubbles:true}));assert.equal(h.session.draft.elements[0].dataSourceRefs.length,2);
  h.root.querySelector('[role="listbox"]').dispatchEvent(new h.dom.window.KeyboardEvent('keydown',{key:'x',ctrlKey:true,bubbles:true}));assert.equal(h.session.draft.elements[0].dataSourceRefs.length,1);
  h.dom.window.close();
});
test('three tabs edit source-scoped type and transforms and cancel leaves original untouched',()=>{
  const h=harness();h.session.update(d=>{d.elements[0].type='barcode128';});h.editor.refresh();click(h,'Data Type');const type=h.root.querySelector('[name="type.kind"]');assert.equal(type.options.length,9);type.value='number';type.dispatchEvent(new h.dom.window.Event('change'));
  const id=h.session.draft.elements[0].dataSourceRefs[0];assert.equal(h.session.draft.sourceDefinitions[id].dataType.kind,'number');
  click(h,'Transforms');assert.equal(h.root.querySelectorAll('[data-transform-kind]').length,5);
  click(h,'Data Source');h.session.cancel();assert.throws(()=>h.session.commit(),/closed/);h.dom.window.close();
});
test('Properties saves source edits immediately and Close preserves them',async()=>{
  const dom=new JSDOM('<body></body>',{url:'http://localhost',runScripts:'dangerously'}),w=dom.window;
  Object.assign(w,{structuredClone,editing:{width_mm:60,height_mm:30,dpi:203,elements:[{type:'text',text:'OLD',x_mm:1,y_mm:1,height_mm:3,width_mm:2}]},settings:{},qrCache:{},mmToUnit:Number,unitSuffix:()=> 'mm',measureUnit:()=> 'mm',cancelTextClick:()=>{},readEditorIntoDraft:()=>{},ensureQR:async()=>{},qrValuesOf:()=>[],dmValuesOf:()=>[],pushSnapshot:()=>{},refreshEditorUI:()=>{},touchEditor:()=>{},updateUndoButtons:()=>{},persistEditor:async()=>{},ObjectDataSourcesUI:UI,SourceSession:Session,DataSourceEngine:require('../gui/data-source-engine'),ObjectData:require('../gui/object-data')});
  w.sampleData=doc=>w.DataSourceEngine.resolve(doc,{},{});let lastPreview;
  w.LabelPreview={computeBoxes:()=>[{w:20,h:5}],renderPreviewSVG:(doc,data)=>{lastPreview=w.ObjectData.resolve(doc.elements[0],data);return '<svg></svg>';}};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.eval(fs.readFileSync(require.resolve('../gui/object-properties'),'utf8'));
  const page=()=>[...w.document.querySelectorAll('#objectProperties nav button')].find(b=>b.textContent==='Data Sources').click();
  w.editing.elements[0].type='barcode128';w.openObjectProperties(0);const names=Array.from(w.document.querySelectorAll('#objectProperties nav button'),b=>b.textContent);assert.ok(!names.includes('Data Type'),'no duplicate Data Type navigation');assert.ok(!names.includes('Transforms'),'no duplicate Transforms navigation');page();assert.ok(w.document.querySelector('#objectProperties nav [role="listbox"]'),'source tree belongs under the property navigation');assert.equal(w.document.querySelector('#objectProperties main [role="listbox"]'),null,'no duplicate source list in the data pane');let input=w.document.querySelector('[name="source.value"]');assert.ok(input);input.value='NEW';input.dispatchEvent(new w.Event('input'));
  await new Promise(r=>setImmediate(r));assert.equal(lastPreview,'NEW');assert.equal(w.editing.elements[0].text,'NEW');
  w.document.querySelector('header button[aria-label="Close"]').click();await new Promise(r=>setImmediate(r));assert.equal(w.editing.dataSourceSchemaVersion,1);
  w.openObjectProperties(0);page();input=w.document.querySelector('[name="source.value"]');input.value='SAVED';input.dispatchEvent(new w.Event('input'));
  await new Promise(r=>setImmediate(r));
  assert.equal(w.editing.dataSourceSchemaVersion,1);assert.equal(w.ObjectData.resolve(w.editing.elements[0],w.sampleData(w.editing)),'SAVED');
  dom.window.close();
});
test('GS1 wizard creates AI sources whose actual prepared result contains the required separator',async()=>{
  const h=harness();h.editor.dispose();h.dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};h.dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  UI.mount(h.root,{session:h.session,objectId:h.session.draft.elements[0].id,compileGs1:async({entries,symbology})=>({ok:true,...require('../lib/source-gs1').compileGs1(entries,symbology)})});
  click(h,'GS1 Data Source Wizard');const wizard=h.dom.window.document.querySelector('.source-gs1-wizard');assert.ok(wizard.open);
  const value=wizard.querySelector('[name="gs1.0.value"]');value.value='09506000134352';value.dispatchEvent(new h.dom.window.Event('input'));
  [...wizard.querySelectorAll('button')].find(b=>b.textContent==='Add Application Identifier').click();
  const lot=wizard.querySelector('[name="gs1.1.value"]');lot.value='LOT42';lot.dispatchEvent(new h.dom.window.Event('input'));
  [...wizard.querySelectorAll('button')].find(b=>b.textContent==='Finish').click();await new Promise(resolve=>setImmediate(resolve));
  const doc=h.session.draft;assert.equal(doc.elements[0].gs1.symbology,'gs1-128');assert.equal(doc.elements[0].dataSourceRefs.length,2);
  const snapshot=await require('../lib/source-adapters').collectInputs(doc,{mode:'preview'}),result=require('../gui/source-resolver').evaluateDocument(doc,snapshot);
  assert.deepEqual(result.diagnostics,[]);assert.equal(result.objects[doc.elements[0].id].text,'010950600013435210LOT42');assert.equal(result.objects[doc.elements[0].id].hriText,'(01)09506000134352(10)LOT42');h.dom.window.close();
});
test('text source lists all nine types observed in the installed native dropdown and named paste can share a reference',()=>{
  const h=harness();h.dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};h.dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  click(h,'Data Type');assert.deepEqual(Array.from(h.root.querySelector('[name="type.kind"]').options,option=>option.value),['text','date','time','number','currency','percentage','fraction','binary','picture']);click(h,'Data Source');
  const name=h.root.querySelector('[name="source.name"]');name.value='Shared';name.dispatchEvent(new h.dom.window.Event('input'));click(h,'Copy');click(h,'Paste');
  const choice=h.dom.window.document.querySelector('.ose-modal');assert.ok(choice.open);[...choice.querySelectorAll('button')].find(b=>b.textContent==='Link to Existing Named Source').click();
  const refs=h.session.draft.elements[0].dataSourceRefs;assert.equal(refs.length,2);assert.equal(refs[0],refs[1]);h.dom.window.close();
});
test('phrase library manager changes real localized source data within the Properties transaction',()=>{
  const h=harness();h.dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};h.dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const type=h.root.querySelector('[name="source.kind"]');type.value='library';type.dispatchEvent(new h.dom.window.Event('change'));click(h,'Manage Phrases…');
  const dialog=h.dom.window.document.querySelector('.ose-modal');for(const [key,value]of Object.entries({library:'Messages',phrase:'greeting',language:'th',value:'สวัสดี'})){const input=dialog.querySelector('[name="phrase.'+key+'"]');input.value=value;input.dispatchEvent(new h.dom.window.Event('input'));}
  [...dialog.querySelectorAll('button')].find(b=>b.textContent==='Use Phrase').click();
  assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'สวัสดี');h.session.cancel();h.dom.window.close();
});
test('clock source exposes and saves the unavailable-printer-clock policy',()=>{
  const h=harness(),type=h.root.querySelector('[name="source.kind"]');type.value='clock';type.dispatchEvent(new h.dom.window.Event('change'));
  const policy=h.root.querySelector('[name="source.fallback"]');assert.ok(policy);policy.value='omit';policy.dispatchEvent(new h.dom.window.Event('change'));
  const id=h.session.draft.elements[0].dataSourceRefs[0];assert.equal(h.session.draft.sourceDefinitions[id].config.fallback,'omit');h.dom.window.close();
});
test('external file editor switches actual filename modes and imports a default directory',async()=>{
  const h=harness();h.editor.dispose();UI.mount(h.root,{session:h.session,objectId:h.session.draft.elements[0].id,chooseDirectory:async()=> 'C:/Fixture'});
  const type=h.root.querySelector('[name="source.kind"]');type.value='file';type.dispatchEvent(new h.dom.window.Event('change'));
  const mode=h.root.querySelector('[name="source.pathMode"]');assert.ok(mode);assert.equal(mode.options.length,3);assert.equal(h.root.querySelector('[name="source.reread"]'),null);
  mode.value='database';mode.dispatchEvent(new h.dom.window.Event('change'));assert.equal(h.root.querySelector('[name="source.path"]'),null);assert.ok(h.root.querySelector('[name="source.pathSource"]'));
  click(h,'Select Path…');await new Promise(resolve=>setImmediate(resolve));const id=h.session.draft.elements[0].dataSourceRefs[0];assert.equal(h.session.draft.sourceDefinitions[id].config.defaultPath,'C:/Fixture');h.dom.window.close();
});
test('late file picker results cannot change a different newly selected source',async()=>{
  const h=harness();h.editor.dispose();let finish;UI.mount(h.root,{session:h.session,objectId:h.session.draft.elements[0].id,chooseFile:()=>new Promise(resolve=>{finish=resolve;})});
  const type=h.root.querySelector('[name="source.kind"]');type.value='file';type.dispatchEvent(new h.dom.window.Event('change'));click(h,'Browse…');addSource(h);
  finish('C:/late.txt');await new Promise(resolve=>setImmediate(resolve));
  const doc=h.session.draft;for(const id of doc.elements[0].dataSourceRefs)assert.equal(doc.sourceDefinitions[id].config.path,undefined);h.dom.window.close();
});
test('Offset editor exposes dynamic value sources and hides date units for numeric data',()=>{
  const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];h.session.update(doc=>{doc.sourceDefinitions[id].dataType={kind:'number'};});click(h,'Transforms');h.root.querySelector('[aria-label="Enable Offset"]').click();h.root.querySelector('[data-transform-kind="offset"] button').click();
  const mode=h.root.querySelector('[name="transform.offset.offsetSource"]');assert.ok(mode);assert.equal(mode.options.length,4);mode.value='database';mode.dispatchEvent(new h.dom.window.Event('change'));
  assert.equal(h.root.querySelector('[name="transform.offset.amount"]'),null);assert.equal(h.root.querySelector('[name="transform.offset.unit"]'),null);
  const field=h.root.querySelector('[name="transform.offset.source"]');field.value='quantity';field.dispatchEvent(new h.dom.window.Event('input'));wizardButton(h.root.querySelector('.source-transform-dialog'),'OK');assert.equal(h.session.draft.sourceDefinitions[id].transforms[0].source,'quantity');h.dom.window.close();
});
test('Fraction precision controls change evaluated values and retain a custom denominator option',()=>{
  const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];h.session.update(doc=>{doc.sourceDefinitions[id].config.value='0.333333333';doc.sourceDefinitions[id].dataType={kind:'fraction',denominator:4};});click(h,'Data Type');
  const precision=h.root.querySelector('[name="type.precision"]');assert.ok(precision);precision.value='up-to-3';precision.dispatchEvent(new h.dom.window.Event('change'));
  assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'1/3');assert.equal(h.root.querySelector('[name="type.denominator"]'),null);h.dom.window.close();
});

test('new named-source wizard can link the currently selected named definition',()=>{
  const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];h.session.update(doc=>{doc.sourceDefinitions[id].name='Shared';});h.editor.refresh();click(h,'New Data Source');const wizard=h.dom.window.document.querySelector('.source-new-wizard'),kind=wizard.querySelector('[name="new.kind"]');kind.value='named';kind.dispatchEvent(new h.dom.window.Event('change'));wizardButton(wizard,'Next');assert.equal(wizard.querySelector('[name="new.name"]'),null);const target=wizard.querySelector('[name="new.definitionId"]');assert.ok([...target.options].some(option=>option.value===id));assert.equal(target.value,id);wizardButton(wizard,'Finish');assert.equal(h.session.draft.elements[0].dataSourceRefs[1],id);assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'AA');const shared=h.root.querySelector('[name="source.value"]');assert.ok(shared);shared.value='UPDATED';shared.dispatchEvent(new h.dom.window.Event('input'));assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'UPDATEDUPDATED');h.dom.window.close();
});
test('disposing source editor removes its unfinished wizard without changing data',()=>{
  const h=harness(),before=structuredClone(h.session.draft);click(h,'New Data Source');const wizard=h.dom.window.document.querySelector('.source-new-wizard');assert.ok(wizard?.open);h.editor.dispose();assert.equal(h.dom.window.document.querySelector('.source-new-wizard'),null);assert.deepEqual(h.session.draft,before);h.dom.window.close();
});

test('Text Transforms matches the nine-item native reference menu in display order',()=>{
 const h=harness();try{click(h,'Transforms');const expected=require('./fixtures/native-text-transform-menu.json').displayKinds;assert.deepEqual([...h.root.querySelectorAll('[data-transform-kind]')].map(row=>row.dataset.transformKind),expected);assert.equal(UI.transformNames.length,12,'all existing transform implementations remain registered');}finally{h.dom.window.close();}
});
test('transform Configure actions use accessible SVG icons and still open the matching editor',()=>{
 const h=harness();try{click(h,'Transforms');const rows=[...h.root.querySelectorAll('[data-transform-kind]')];assert.ok(rows.length>0);for(const row of rows){const button=row.querySelector('button[aria-label^="Configure "]'),icon=button?.querySelector('svg[data-icon="configure"]');assert.ok(icon,`${row.dataset.transformKind} has a Configure SVG`);assert.equal(button.textContent,'',`${row.dataset.transformKind} shows the compact icon instead of repeated text`);assert.equal(button.title,button.getAttribute('aria-label'),`${row.dataset.transformKind} keeps an accessible name and tooltip`);assert.equal(icon.getAttribute('viewBox'),'0 0 20 20');}const first=rows[0],button=first.querySelector('button[aria-label^="Configure "]');button.click();const dialog=h.dom.window.document.querySelector('.source-transform-dialog');assert.ok(dialog?.open,'Configure still opens its editor');assert.equal(dialog.dataset.kind,first.dataset.transformKind,'the SVG action opens the matching transform');}finally{h.dom.window.close();}
});
test('Text preserves configured extension transforms and their evaluator order when rendering the native menu',()=>{
 const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];try{h.session.update(doc=>{doc.sourceDefinitions[id].transforms=[{kind:'prefix-suffix',prefix:'['},{kind:'offset',amount:2,enabled:false},{kind:'compression',method:'gzip',enabled:false}];});const before=structuredClone(h.session.draft.sourceDefinitions[id].transforms);h.editor.refresh();click(h,'Transforms');assert.ok(h.root.querySelector('[data-transform-kind="offset"]'));assert.ok(h.root.querySelector('[data-transform-kind="compression"]'));assert.deepEqual(h.session.draft.sourceDefinitions[id].transforms,before,'viewing the menu must not rewrite processing order or discard old settings');}finally{h.dom.window.close();}
});
test('changing source type to Number and back refreshes the Text native menu',()=>{
 const h=harness();try{click(h,'Data Type');let type=h.root.querySelector('[name="type.kind"]');type.value='number';type.dispatchEvent(new h.dom.window.Event('change'));click(h,'Transforms');assert.ok(h.root.querySelector('[data-transform-kind="offset"]'));click(h,'Data Type');type=h.root.querySelector('[name="type.kind"]');type.value='text';type.dispatchEvent(new h.dom.window.Event('change'));click(h,'Transforms');assert.equal(h.root.querySelectorAll('[data-transform-kind]').length,9);assert.equal(h.root.querySelector('[data-transform-kind="offset"]'),null);}finally{h.dom.window.close();}
});

for(const [type,reference]of Object.entries(require('./fixtures/native-transform-menus.json').types))test('native transform capability and display order: '+type,()=>{const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];try{h.session.update(doc=>{doc.sourceDefinitions[id].dataType={kind:type};});h.editor.refresh();click(h,'Transforms');assert.deepEqual([...h.root.querySelectorAll('[data-transform-kind]')].map(row=>row.dataset.transformKind),reference.displayKinds);}finally{h.dom.window.close();}});

test('non-Text menus preserve configured extensions without modifying evaluation order',()=>{const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];try{h.session.update(doc=>{const source=doc.sourceDefinitions[id];source.dataType={kind:'currency'};source.transforms=[{kind:'filter',mode:'digits',enabled:false},{kind:'prefix-suffix',prefix:'X'},{kind:'serialization',start:'1',enabled:false}];});const before=structuredClone(h.session.draft.sourceDefinitions[id]);h.editor.refresh();click(h,'Transforms');assert.deepEqual([...h.root.querySelectorAll('[data-transform-kind]')].map(row=>row.dataset.transformKind),['suppression','offset','range','prefix-suffix','filter','serialization']);assert.deepEqual(h.session.draft.sourceDefinitions[id],before);}finally{h.dom.window.close();}});

for(const type of ['text','number','date'])test('native Print Job Fields limit new transforms to Suppression: '+type,()=>{const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];try{h.session.update(doc=>{const source=doc.sourceDefinitions[id];source.kind='job';source.config={field:'page'};source.dataType={kind:type};});h.editor.refresh();click(h,'Transforms');assert.deepEqual([...h.root.querySelectorAll('[data-transform-kind]')].map(row=>row.dataset.transformKind),['suppression']);}finally{h.dom.window.close();}});

test('Print Job Field legacy extensions remain editable without model mutation',()=>{const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];try{h.session.update(doc=>{const source=doc.sourceDefinitions[id];source.kind='job';source.config={field:'page'};source.transforms=[{kind:'serialization',enabled:false,start:'1'},{kind:'prefix-suffix',prefix:'P'}];});const before=structuredClone(h.session.draft);h.editor.refresh();click(h,'Transforms');assert.deepEqual([...h.root.querySelectorAll('[data-transform-kind]')].map(row=>row.dataset.transformKind),['suppression','serialization','prefix-suffix']);assert.deepEqual(h.session.draft,before);}finally{h.dom.window.close();}});
