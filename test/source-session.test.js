'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createSession}=require('../gui/source-session');
test('cancel discards edits to shared named definitions without mutating original',()=>{
  const input={data_sources:{lot:{type:'constant',value:'old'}},elements:[{text:'{{lot}}'},{text:'{{lot}}'}]},before=JSON.stringify(input);
  const session=createSession(input),id=session.draft.elements[0].dataSourceRefs[0];
  session.update(d=>{d.sourceDefinitions[id].config.source.value='new';});
  const result=session.evaluate({});assert.deepEqual(Object.values(result.objects).map(o=>o.text),['new','new']);
  session.cancel();assert.equal(JSON.stringify(input),before);assert.throws(()=>session.commit(),/closed/i);
});
test('commit returns one validated document and does not leak mutable session state',()=>{
  const input={elements:[{text:'old'}]},session=createSession(input);
  session.update(d=>{d.sourceDefinitions[d.elements[0].dataSourceRefs[0]].config.value='new';});
  const committed=session.commit();assert.equal(input.elements[0].text,'old');assert.equal(session.revision,1);
  assert.equal(committed.sourceDefinitions[committed.elements[0].dataSourceRefs[0]].config.value,'new');
});
test('late async response cannot replace newer revision or cancelled session',async()=>{
  const session=createSession({elements:[{text:'x'}]});let finish;
  const pending=session.evaluateAsync({},()=>new Promise(resolve=>{finish=resolve;}));
  session.update(()=>{});finish({});assert.equal(await pending,null);
  let finish2;const second=session.evaluateAsync({},()=>new Promise(resolve=>{finish2=resolve;}));session.cancel();finish2({});assert.equal(await second,null);
});
test('asynchronous preview caches prepared data without repeatedly reading files on redraw',async()=>{
  const Model=require('../gui/source-model'),{create}=require('../gui/source-preview'),ObjectData=require('../gui/object-data');
  const doc=Model.migrate({elements:[{text:'sample'}]}),id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id]={id,kind:'file',config:{path:'fixture'}};
  let reads=0,ready=0;const preview=create({collectInputs:async()=>{reads++;return{preparedSources:{[id]:'LOADED'}};},onReady:()=>ready++});
  preview.resolve(doc);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ObjectData.resolve(doc.elements[0],preview.resolve(doc)),'LOADED');assert.equal(reads,1);assert.equal(ready,1);
  preview.resolve(doc);assert.equal(reads,1);preview.invalidate();preview.resolve(doc);await new Promise(resolve=>setImmediate(resolve));assert.equal(reads,2);
});
test('prepared preview invalidates artwork when barcode symbology, options, font or GS1 layout changes',async()=>{
  const Model=require('../gui/source-model'),{create}=require('../gui/source-preview'),doc=Model.migrate({elements:[{type:'image',barcode_spec:{bcid:'code128',text:'123456'},text:'123456'}]});let reads=0;
  const preview=create({collectInputs:async()=>{reads++;return{};}}),settle=()=>new Promise(resolve=>setImmediate(resolve));
  preview.resolve(doc);await settle();assert.equal(reads,1);
  for(const change of [()=>doc.elements[0].barcode_spec.bcid='code39',()=>doc.elements[0].barcode_spec.show_text=false,()=>doc.elements[0].font_family='Arial',()=>doc.elements[0].gs1={symbology:'gs1-128'}]){change();preview.resolve(doc);await settle();}
  assert.equal(reads,5);preview.resolve(doc);await settle();assert.equal(reads,5);
});
