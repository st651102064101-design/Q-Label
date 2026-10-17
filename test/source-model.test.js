'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Model=require('../gui/source-model');
const ids=()=>{let n=0;return ()=>`id-${++n}`;};
test('renaming a source preserves named file and transform dependencies without changing unrelated fields',()=>{
  const Resolver=require('../gui/source-resolver');const doc=Model.migrate({elements:[{type:'text',text:'2'},{type:'text',text:'10'},{type:'text',text:'KEEP'},{type:'text',text:'file'},{type:'text',text:'database'}]},{newId:ids()});const refs=doc.elements.map(e=>e.dataSourceRefs[0]);doc.sourceDefinitions[refs[0]].name='Amount';doc.sourceDefinitions[refs[1]].dataType={kind:'number'};doc.sourceDefinitions[refs[1]].transforms=[{kind:'offset',offsetSource:'named',source:'Amount'}];doc.sourceDefinitions[refs[2]].transforms=[{kind:'suppression',when:'equals',source:'Amount',value:'2'}];doc.sourceDefinitions[refs[3]].kind='file';doc.sourceDefinitions[refs[3]].config={pathMode:'named',pathSource:'Amount'};doc.sourceDefinitions[refs[4]].kind='database';doc.sourceDefinitions[refs[4]].config={field:'Amount',sampleData:'untouched'};const before=JSON.stringify(doc);
  const next=Model.renameSource(doc,refs[0],'Quantity');assert.equal(JSON.stringify(doc),before);assert.equal(next.sourceDefinitions[refs[3]].config.pathSource,'Quantity');assert.equal(next.sourceDefinitions[refs[4]].config.field,'Amount');const result=Resolver.evaluateDocument(next);assert.equal(result.objects[doc.elements[1].id].text,'12');assert.equal(result.objects[doc.elements[2].id].text,'');assert.equal(result.namedValues.Quantity,'2');assert.equal(result.namedValues.Amount,undefined);assert.deepEqual(next.elements.map(e=>e.dataSourceRefs),doc.elements.map(e=>e.dataSourceRefs));
});
test('removing a name used by explicit dependencies is rejected atomically',()=>{
  const doc=Model.migrate({elements:[{type:'text',text:'2'},{type:'text',text:'10'}]},{newId:ids()}),id=doc.elements[0].dataSourceRefs[0],other=doc.elements[1].dataSourceRefs[0];doc.sourceDefinitions[id].name='Amount';doc.sourceDefinitions[other].transforms=[{kind:'offset',offsetSource:'named',source:'Amount'}];const before=JSON.stringify(doc);assert.throws(()=>Model.renameSource(doc,id,''),/used|depend/i);assert.equal(JSON.stringify(doc),before);doc.sourceDefinitions[other].transforms=[];assert.equal(Model.renameSource(doc,id,'').sourceDefinitions[id].name,'');
});
test('source rename follows literal script calls and file tokens without rewriting comments or arbitrary strings',()=>{
  const doc=Model.migrate({elements:[{type:'text',text:'2'},{type:'text',text:'script'},{type:'text',text:'file'}]},{newId:ids()}),[id,script,file]=doc.elements.map(e=>e.dataSourceRefs[0]);doc.sourceDefinitions[id].name='Amount';doc.sourceDefinitions[script].kind='vbscript';doc.sourceDefinitions[script].config={code:'Value = NamedSubString("Amount") & Format.NamedSubStrings("Amount").Value\n\' NamedSubString("Amount")\nValue = Value & "Amount"'};doc.sourceDefinitions[file].kind='file';doc.sourceDefinitions[file].config={path:'C:/labels/{{ Amount }}.txt'};
  const next=Model.renameSource(doc,id,'Quantity');assert.equal(next.sourceDefinitions[script].config.code,'Value = NamedSubString("Quantity") & Format.NamedSubStrings("Quantity").Value\n\' NamedSubString("Amount")\nValue = Value & "Amount"');assert.equal(next.sourceDefinitions[file].config.path,'C:/labels/{{ Quantity }}.txt');assert.throws(()=>Model.renameSource(doc,id,''),/used|depend/i);
});
test('Duplicate assigns new source identities before rendering or insertion',()=>{
  const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
  const doc=Model.migrate({elements:[{type:'text',text:'original',x_mm:0,y_mm:0}]}),original=structuredClone(doc.elements[0]);
  const context={editing:doc,editorSelection:new Set([0]),editorSel:0,window:{SourceModel:Model},freshGroupIds:v=>v,readEditorIntoDraft(){},pushSnapshot(){},noteRecentObjectUsage(){},refreshEditorUI(){assert.notEqual(doc.elements[1].id,original.id);},updateUndoButtons(){},touchEditor(){}};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function duplicateSelectedElement()'),source.indexOf('function selectAllEditorElements()')),context);context.duplicateSelectedElement();
  assert.equal(doc.elements[0].id,original.id);assert.notEqual(doc.elements[1].dataSourceRefs[0],original.dataSourceRefs[0]);
});
test('migration preserves literal/token order and shared references without mutating the input',()=>{
  const input={name:'label',data_sources:{lot:{type:'constant',value:'123'}},elements:[{type:'text',text:'A{{lot}}B',data_prefix:'[',data_suffix:']'},{type:'barcode128',text:'{{lot}}'}]};
  const before=JSON.stringify(input),doc=Model.migrate(input,{newId:ids()});
  assert.equal(JSON.stringify(input),before);assert.equal(doc.dataSourceSchemaVersion,1);
  const refs=doc.elements[0].dataSourceRefs;
  assert.equal(refs.length,3);assert.equal(refs[1],doc.elements[1].dataSourceRefs[0]);
  assert.equal(doc.sourceDefinitions[refs[0]].config.value,'A');
  assert.equal(doc.sourceDefinitions[refs[2]].config.value,'B');
  assert.equal(doc.elements[0].data_prefix,'[');
  assert.deepEqual(Model.migrate(doc,{newId:ids()}),doc);
});
test('migration preserves catalog input and unknown metadata through JSON round trip',()=>{
  const input={custom:{keep:true},elements:[{type:'image',barcode_spec:{text:'12345678',bcid:'code128'},bitmap_hex:'abcd',custom:'retained'}]};
  const doc=Model.migrate(input,{newId:ids()}),el=doc.elements[0];
  assert.equal(doc.sourceDefinitions[el.dataSourceRefs[0]].config.value,'12345678');
  assert.equal(el.bitmap_hex,'abcd');assert.equal(el.custom,'retained');
  assert.deepEqual(JSON.parse(JSON.stringify(doc)),doc);
});
test('source operations copy or link explicitly, reorder, and keep definitions used elsewhere',()=>{
  const newId=ids();let doc=Model.migrate({elements:[{type:'text',text:'A'},{type:'text',text:'B'}]},{newId});
  const a=doc.elements[0],b=doc.elements[1],id=a.dataSourceRefs[0];
  const linked=Model.copySource(doc,id,{linked:true,newId});assert.equal(linked.definitionId,id);
  const copy=Model.copySource(doc,id,{linked:false,newId});assert.notEqual(copy.definitionId,id);doc=copy.document;
  doc=Model.addSource(doc,b.id,doc.sourceDefinitions[id],1);
  assert.equal(doc.elements[1].dataSourceRefs[1],id);
  doc=Model.moveSource(doc,b.id,1,0);assert.equal(doc.elements[1].dataSourceRefs[0],id);
  const before=doc;assert.throws(()=>Model.moveSource(doc,b.id,0,2),/index/i);assert.deepEqual(doc,before);
  doc=Model.removeSource(doc,a.id,0);assert.ok(doc.sourceDefinitions[id]);
  assert.deepEqual(doc.elements[0].dataSourceRefs,[]);
});
test('validation rejects duplicate IDs, dangling references, and duplicate named definitions',()=>{
  assert.throws(()=>Model.migrate({elements:[{id:'same',text:'a'},{id:'same',text:'b'}]},{newId:ids()}),/duplicate.*object/i);
  const doc=Model.migrate({elements:[{text:'x'}]},{newId:ids()});
  doc.elements[0].dataSourceRefs=['missing'];assert.throws(()=>Model.validate(doc),/missing/i);
  doc.elements[0].dataSourceRefs=[];
  doc.sourceDefinitions={a:{id:'a',name:'Lot',kind:'embedded',config:{value:'a'}},b:{id:'b',name:'Lot',kind:'embedded',config:{value:'b'}}};
  assert.throws(()=>Model.validate(doc),/name/i);
});
test('stable object identities span pages and migration preserves unknown named sources',()=>{
  const doc=Model.migrate({data_sources:{future:{type:'future-kind',value:'x'}},elements:[{text:'first'}],pages:[{elements:[{text:'second'}]}]},{newId:ids()});
  assert.notEqual(doc.elements[0].id,doc.pages[0].elements[0].id);
  assert.ok(doc.pages[0].id);
  const source=Object.values(doc.sourceDefinitions).find(s=>s.name==='future');
  assert.equal(source.kind,'legacy');assert.equal(source.config.source.type,'future-kind');
});
test('active template and side caches retain identical IDs while inactive pages get distinct IDs',()=>{
  const doc=Model.migrate({elements:[{text:'active'}],design_active:'front',designs:{front:{elements:[{text:'stale'}]},back:{elements:[{text:'back'}]}},template_pages:[{design:{elements:[{text:'stale page'}]}},{design:{elements:[{text:'other page'}]}}],template_page_active:0},{newId:ids()});
  assert.deepEqual(doc.elements,doc.designs.front.elements);
  assert.deepEqual(doc.elements,doc.template_pages[0].design.elements);
  assert.equal(new Set(Model.elements(doc).map(e=>e.id)).size,3);
  assert.deepEqual(Model.migrate(doc),doc);
});
test('direct text editing rebuilds that source list while new objects and copies receive independent identities',()=>{
  const newId=ids(),doc=Model.migrate({elements:[{text:'old'}]},{newId});
  doc.elements[0].text='edited';Model.reconcileInPlace(doc,{newId});
  assert.equal(doc.sourceDefinitions[doc.elements[0].dataSourceRefs[0]].config.value,'edited');
  const copy=structuredClone(doc.elements[0]);Model.cloneObjectSources(doc,[copy],{newId});doc.elements.push(copy,{text:'new'});Model.reconcileInPlace(doc,{newId});
  assert.equal(new Set(doc.elements.map(e=>e.id)).size,3);assert.notEqual(doc.elements[0].dataSourceRefs[0],copy.dataSourceRefs[0]);
  assert.doesNotThrow(()=>Model.validate(doc));
});
test('copying an object follows unnamed named-reference dependencies and retains deliberately shared names',()=>{
  const newId=ids(),doc=Model.migrate({elements:[{text:'A'},{text:'B'}]},{newId}),first=doc.elements[0],second=doc.elements[1];
  const a=first.dataSourceRefs[0],b=second.dataSourceRefs[0];
  doc.sourceDefinitions[a]={id:a,kind:'named',config:{definitionId:b}};
  const copy=structuredClone(first);Model.cloneObjectSources(doc,[copy],{newId});
  const linked=doc.sourceDefinitions[copy.dataSourceRefs[0]].config.definitionId;
  assert.notEqual(linked,b);assert.equal(doc.sourceDefinitions[linked].config.value,'B');
  doc.sourceDefinitions[b].name='Shared';const sharedCopy=structuredClone(first);Model.cloneObjectSources(doc,[sharedCopy],{newId});
  assert.equal(doc.sourceDefinitions[sharedCopy.dataSourceRefs[0]].config.definitionId,b);
});
test('clipboard snapshot imports data into another project without overwriting colliding source IDs or names',()=>{
  const source=Model.migrate({elements:[{text:'COPIED'}]},{newId:ids()}),target=Model.migrate({elements:[{text:'EXISTING'}]},{newId:ids()});
  target.sourceDocumentId='different-project';
  const id=source.elements[0].dataSourceRefs[0];source.sourceDefinitions[id].name='Lot';target.sourceDefinitions[id].name='Lot';
  const copies=structuredClone(source.elements);Model.cloneObjectSources(target,copies,{sourceDocument:source});
  assert.notEqual(copies[0].dataSourceRefs[0],id);const imported=target.sourceDefinitions[copies[0].dataSourceRefs[0]];
  assert.equal(imported.config.value,'COPIED');assert.equal(imported.name,'Lot (1)');assert.equal(target.sourceDefinitions[id].config.value,'EXISTING');
  target.elements.push(...copies);assert.doesNotThrow(()=>Model.validate(target));
});
test('renderer Copy/Paste preserves copied source values after changing projects',()=>{
  const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8'),original=Model.migrate({elements:[{type:'text',text:'COPIED',x_mm:1,y_mm:1}]}),target=Model.migrate({elements:[{type:'text',text:'TARGET'}]});
  const context={structuredClone,editing:original,editorSelection:new Set([0]),editorSel:0,elementClipboard:null,elementClipboardSources:null,window:{SourceModel:Model,LabelPreview:{computeBoxes:()=>[{x:1,y:1,w:2,h:2}]}},document:{dispatchEvent(){}},Event:class{},lastPastePointMm:null,editorGrid:{snap:false},freshGroupIds:v=>v,designPaperBounds:()=>({x:0,y:0,width:60,height:30}),sampleData:()=>({}),readEditorIntoDraft(){},pushSnapshot(){},noteRecentObjectUsage(){},refreshEditorUI(){},updateUndoButtons(){},touchEditor(){}};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function copySelectedElement('),source.indexOf('function deleteSelectedElement()')),context);
  context.copySelectedElement();context.editing=target;context.pasteElement();
  const pasted=target.elements[1],definition=target.sourceDefinitions[pasted.dataSourceRefs[0]];assert.ok(definition);assert.equal(definition.config.value,'COPIED');assert.notEqual(pasted.id,original.elements[0].id);
});
