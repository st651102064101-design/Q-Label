'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Model=require('../gui/source-model'),Resolver=require('../gui/source-resolver');
const migrate=input=>{let n=0;return Model.migrate(input,{newId:()=>`s${++n}`});};
test('concatenation applies legacy whole-object transforms exactly once',()=>{
  const doc=migrate({data_sources:{lot:{type:'constant',value:'42'}},elements:[{text:'LOT-{{lot}}',data_prefix:'[',data_suffix:']'}]});
  const result=Resolver.evaluateDocument(doc,{});
  assert.deepEqual(result.diagnostics,[]);assert.equal(result.objects[doc.elements[0].id].text,'[LOT-42]');
});
test('object references resolve evaluated values and report a cycle path without crashing other objects',()=>{
  const doc=migrate({elements:[{text:'a'},{text:'b'},{text:'unrelated'}]});
  const [a,b,c]=doc.elements,[ar]=a.dataSourceRefs,[br]=b.dataSourceRefs;
  Object.assign(doc.sourceDefinitions[ar],{kind:'object',config:{objectId:b.id}});
  let result=Resolver.evaluateDocument(doc,{});assert.equal(result.objects[a.id].text,'b');
  Object.assign(doc.sourceDefinitions[br],{kind:'object',config:{objectId:a.id}});
  result=Resolver.evaluateDocument(doc,{});assert.equal(result.objects[c.id].text,'unrelated');
  assert.ok(result.diagnostics.some(d=>d.code==='cycle'&&d.path.includes(`object:${a.id}`)&&d.path.includes(`object:${b.id}`)));
});
test('input data overrides defaults and serial preview does not mutate document',()=>{
  const doc=migrate({values:{value:'default'},data_sources:{serial:{type:'serial',start:7,step:2,digits:3}},elements:[{text:'{{value}}/{{serial}}'}]});
  const before=JSON.stringify(doc),result=Resolver.evaluateDocument(doc,{inputs:{value:'record'},index:2});
  assert.equal(result.objects[doc.elements[0].id].text,'record/011');assert.equal(JSON.stringify(doc),before);
});
test('unsupported sources and missing object references yield actionable diagnostics',()=>{
  const doc=migrate({data_sources:{future:{type:'unknown'}},elements:[{text:'{{future}}'},{text:'x'}]});
  const id=doc.elements[1].dataSourceRefs[0];doc.sourceDefinitions[id]={id,kind:'object',config:{objectId:'missing'}};
  const result=Resolver.evaluateDocument(doc,{});
  assert.ok(result.diagnostics.some(d=>d.code==='unsupported-source'));
  assert.ok(result.diagnostics.some(d=>d.code==='missing-object'&&d.definitionId===id));
});
test('per-source data types and transforms compose before concatenation',()=>{
  const doc=migrate({elements:[{text:'1234'}]}),id=doc.elements[0].dataSourceRefs[0];
  doc.sourceDefinitions[id].dataType={kind:'number',notation:'hex',minimumLength:4};
  doc.sourceDefinitions[id].transforms=[{kind:'prefix-suffix',prefix:'0x'}];
  const result=Resolver.evaluateDocument(doc,{});assert.deepEqual(result.diagnostics,[]);assert.equal(result.objects[doc.elements[0].id].text,'0x04D2');
});
test('context sources use frozen clock, selected record, named snapshot and metadata',()=>{
  const doc=migrate({elements:[{text:''}]}),element=doc.elements[0];element.dataSourceRefs=[];
  const entries=[['clock',{},{kind:'date',pattern:'yyyy-MM-dd',timeZone:'UTC'}],['database',{field:'code'},null],['library',{library:'phrases',phrase:'hello',language:'th'},null],['global',{key:'company'},null],['job',{key:'printer'},null],['file',{path:'fixture'},null],['table',{column:'cell',row:'auto'},null],['pct',{field:'placeholder'},null],['vbscript',{code:'Value = "script"'},null]];
  entries.forEach(([kind,config,dataType],i)=>{const id='context-'+i;element.dataSourceRefs.push(id);doc.sourceDefinitions[id]={id,kind,config,dataType:dataType||{kind:'text'}};});
  const context={now:Date.parse('2026-10-17T00:00:00Z'),inputs:{code:'DB'},libraries:{phrases:{hello:{th:'สวัสดี'}}},globals:{company:'Q'},printer:'Zebra',tableRows:[{cell:'TABLE'}],preparedSources:{'context-5':'FILE','context-7':'PCT','context-8':'SCRIPT'}};
  const result=Resolver.evaluateDocument(doc,context);assert.deepEqual(result.diagnostics,[]);assert.equal(result.objects[element.id].text,'2026-10-17DBสวัสดีQZebraFILETABLEPCTSCRIPT');
});
test('missing prepared external data prevents object evaluation rather than printing the sample silently',()=>{
  const doc=migrate({elements:[{text:'x'}]}),id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id]={id,kind:'file',config:{path:'missing'}};
  const result=Resolver.evaluateDocument(doc,{mode:'print'});assert.ok(result.diagnostics.some(d=>d.code==='unprepared-source'));assert.equal(result.objects[doc.elements[0].id],undefined);
});
test('printer clock follows explicit Windows-clock, omit and abort fallback policies',()=>{
  const doc=migrate({elements:[{text:'clock'}]}),element=doc.elements[0],id=element.dataSourceRefs[0];
  doc.sourceDefinitions[id]={id,kind:'clock',config:{printerClock:true,fallback:'windows'},dataType:{kind:'date',pattern:'yyyy-MM-dd',timeZone:'UTC'}};
  const context={mode:'print',now:'2026-10-17T10:00:00Z'};
  assert.equal(Resolver.evaluateDocument(doc,context).objects[element.id].text,'2026-10-17');
  assert.equal(Resolver.evaluateDocument(doc,{...context,printerClock:'2026-10-18T00:00:00Z'}).objects[element.id].text,'2026-10-18');
  doc.sourceDefinitions[id].config.fallback='omit';assert.equal(Resolver.evaluateDocument(doc,context).objects[element.id].text,'');
  doc.sourceDefinitions[id].config.fallback='abort';assert.ok(Resolver.evaluateDocument(doc,context).diagnostics.some(d=>d.code==='printer-clock-unavailable'));
});
