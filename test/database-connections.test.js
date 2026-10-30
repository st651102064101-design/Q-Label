'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const connections=require('../lib/database/connections');
const engine=require('../gui/database-engine');
const draft=(name,key,value)=>({name,type:'text',tables:[{name:'Records',columns:['id'],rows:[{id:value}]}],tableIndex:0,rows:[{id:value}],fields:{[key]:'id'}});
test('legacy migration preserves field names and is deterministic without mutating the document',()=>{
 const original={elements:[],data_sources:{sku:{type:'table',column:'id',row:'auto',rows:[{id:'001'}]}},database_connection:draft('Products','sku','001')};
 const before=JSON.stringify(original),m=connections.migrate(original);assert.equal(JSON.stringify(original),before);assert.equal(m.database_connections.length,1);assert.equal(m.database_connection.fields.sku,'id');assert.equal(m.data_sources.sku.connectionId,m.database_connection.id);assert.deepEqual(connections.migrate(m),m);
});
test('adding and refreshing a second connection preserves the first connection and bindings',()=>{
 let d=engine.bind({elements:[],data_sources:{}},draft('Products','sku','001'),{columns:['id'],rows:[{id:'001'}]});
 const first=d.database_connection.id,fieldId=d.data_sources.sku.fieldId;
 d=engine.bind(d,draft('Prices','price','20'),{columns:['id'],rows:[{id:'20'}]});
 assert.equal(d.database_connections.length,2);assert.equal(d.data_sources.sku.rows[0].id,'001');assert.equal(d.data_sources.sku.connectionId,first);assert.equal(d.data_sources.sku.fieldId,fieldId);
 const second=d.database_connection.id;d=engine.bind(d,{...d.database_connection,rows:[{id:'30'}]},{columns:['id'],rows:[{id:'30'}]});assert.equal(d.database_connections.length,2);assert.equal(d.database_connection.id,second);assert.equal(d.data_sources.price.rows[0].id,'30');assert.equal(d.data_sources.sku.rows[0].id,'001');
});
test('selection and deletion use IDs and never rebind removed fields to another connection',()=>{
 let d=engine.bind({data_sources:{}},draft('One','one','1'),{columns:['id'],rows:[{id:'1'}]});const id=d.database_connection.id;
 d=engine.bind(d,draft('Two','two','2'),{columns:['id'],rows:[{id:'2'}]});const survivor=d.database_connection.id;
 d=connections.select(d,id);assert.equal(d.database_connection.name,'One');d=connections.remove(d,id);assert.equal(d.database_connection.id,survivor);assert.equal(d.database_connections.length,1);assert.equal(d.data_sources.one.type,'database-missing');assert.equal(d.data_sources.two.rows[0].id,'2');
 const next=engine.bind(d,draft('Three','three','3'),{columns:['id'],rows:[{id:'3'}]});assert.notEqual(next.database_connection.id,id);
});
test('duplicate connection IDs and cross-connection field ownership are rejected atomically',()=>{
 assert.throws(()=>connections.migrate({database_connections:[{id:'same',fields:{}},{id:'same',fields:{}}]}),/duplicate/i);
 const d=engine.bind({data_sources:{}},draft('One','shared','1'),{columns:['id'],rows:[{id:'1'}]}),before=JSON.stringify(d);
 assert.throws(()=>engine.bind(d,draft('Two','shared','2'),{columns:['id'],rows:[{id:'2'}]}),/belongs|owned/i);assert.equal(JSON.stringify(d),before);
});
test('unbinding a field preserves the other connection and stable table IDs after reorder',()=>{
 let d=engine.bind({data_sources:{}},draft('One','one','1'),{columns:['id'],rows:[{id:'1'}]});const tableId=d.data_sources.one.tableId;
 d=engine.bind(d,{...d.database_connection,tables:[{name:'Other',columns:['x'],rows:[]},...d.database_connection.tables],tableIndex:1},{columns:['id'],rows:[{id:'2'}]});assert.equal(d.data_sources.one.tableId,tableId);
 d=connections.unbind(d,'one');assert.equal(d.database_connections.length,1);assert.deepEqual(d.database_connection.fields,{});assert.equal(d.data_sources.one,undefined);
});
test('modern database fields resolve their owner even when another connection is active',()=>{
 const resolver=require('../gui/source-resolver');let d=engine.bind({elements:[{id:'text1',type:'text',dataSourceRefs:['s']}],data_sources:{},dataSourceSchemaVersion:1,sourceDefinitions:{s:{id:'s',kind:'database',config:{field:'one'}}}},draft('One','one','001'),{columns:['id'],rows:[{id:'001'}]});
 const first=d.database_connection.id;d=engine.bind(d,draft('Two','two','002'),{columns:['id'],rows:[{id:'002'}]});assert.equal(resolver.evaluateDocument(d,{mode:'print'}).objects.text1.text,'001');
 const removed=connections.remove(d,first),result=resolver.evaluateDocument(removed,{mode:'print'});assert.ok(result.diagnostics.some(d=>d.code==='missing-field'));assert.notEqual(result.objects.text1?.text,'002');
});
test('deleted legacy bindings report an unavailable database rather than printing a stale value',()=>{
 let d=engine.bind({elements:[{type:'text',text:'{{one}}'}],data_sources:{}},draft('One','one','001'),{columns:['id'],rows:[{id:'001'}]});d=connections.remove(d,d.database_connection.id);assert.throws(()=>require('../gui/data-source-engine').resolve(d,{}, {mode:'print'}),/deleted|unavailable/i);
});
test('print rows retain both connections for record ranges and copies',()=>{
 const importer=require('../lib/database-import'),{preparePrintJob}=require('../lib/print-job');
 let d=engine.bind({name:'Multi',width_mm:50,height_mm:30,dpi:203,elements:[{type:'text',text:'{{one}} {{two}}',x_mm:1,y_mm:1,height_mm:3}],data_sources:{}},draft('One','one','001'),{columns:['id'],rows:[{id:'001'},{id:'002'}]});
 d=engine.bind(d,draft('Two','two','010'),{columns:['id'],rows:[{id:'010'},{id:'020'}]});
 const rows=connections.effectiveRows(d);assert.equal(rows[1].one,'002');assert.equal(rows[1].two,'020');assert.deepEqual(connections.printFields(d),{one:'one',two:'two'});
 const job=preparePrintJob({template:importer.printTemplate(d,true),rows:[rows[1]],copies:2,connection:{type:'ip',host:'127.0.0.1'}});assert.equal(job.dataList.length,2);for(const value of job.dataList){assert.equal(value.one,'002');assert.equal(value.two,'020');}
 const shorter=clone=>JSON.parse(JSON.stringify(clone));const bad=shorter(d);bad.database_connections[0].rows.pop();assert.throws(()=>connections.effectiveRows(bad),/record 2 is unavailable/);
});
test('renaming a database field retains its owner and field ID',()=>{
 let d=engine.bind({data_sources:{}},draft('One','one','1'),{columns:['id'],rows:[{id:'1'}]});const id=d.data_sources.one.fieldId,owner=d.database_connection.id;
 d.data_sources.renamed=d.data_sources.one;delete d.data_sources.one;d=connections.updateBinding(d,'one','renamed','id');assert.equal(d.database_connection.fields.one,undefined);assert.equal(d.database_connection.fields.renamed,'id');assert.equal(d.data_sources.renamed.fieldId,id);assert.equal(d.data_sources.renamed.connectionId,owner);
});
test('deleting an unused connection does not block surviving fields',()=>{
 let d=engine.bind({elements:[{type:'text',text:'{{two}}'}],data_sources:{}},draft('One','one','001'),{columns:['id'],rows:[{id:'001'}]});const first=d.database_connection.id;d=engine.bind(d,draft('Two','two','002'),{columns:['id'],rows:[{id:'002'}]});d=connections.remove(d,first);assert.equal(require('../gui/data-source-engine').resolve(d,{}, {mode:'print'}).two,'002');
});
test('changing a database field to embedded data detaches its owner before refresh',async()=>{
 const {JSDOM}=require('jsdom'),fs=require('node:fs');
 for(const renamed of [false,true]){
  const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'outside-only'}),w=dom.window;
  try{
   w.editing=engine.bind({elements:[{type:'text',text:'{{one}}'}],data_sources:{}},draft('One','one','001'),{columns:['id'],rows:[{id:'001'}]});w.DatabaseImport=require('../lib/database-import');w.DataSourceEngine=require('../gui/data-source-engine');w.settings={};w.editorSelection=new Set();w.lastValueNames='';
   for(const name of ['readEditorIntoDraft','pushSnapshot','touchEditor','renderEditorValues','updateEditorPreview'])w[name]=()=>{};w.persistEditor=async()=>{};
   w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
   w.eval(fs.readFileSync(require.resolve('../gui/data-sources.js'),'utf8'));w.DataSourcesUI.open('Database Fields','one');
   const form=w.document.querySelector('.data-source-dialog form');form.elements.namedItem('category').value='Embedded Data';form.elements.namedItem('category').dispatchEvent(new w.Event('change'));form.elements.namedItem('value').value='Manual';if(renamed)form.elements.namedItem('name').value='manual';form.dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,15));
   assert.equal(w.document.querySelector('.source-error').textContent,'');const key=renamed?'manual':'one';assert.equal(w.editing.data_sources[key].type,'constant');assert.equal(w.editing.database_connection.fields.one,undefined);
   const refreshed=engine.bind(w.editing,w.editing.database_connection,{columns:['id'],rows:[{id:'999'}]});assert.equal(refreshed.data_sources[key].value,'Manual');assert.equal(refreshed.data_sources[key].type,'constant');
  }finally{dom.window.close();}
 }
});
test('versioned legacy database sources use live binding rows and cannot reuse removed snapshots',()=>{
 const Model=require('../gui/source-model'),resolver=require('../gui/source-resolver');let d=engine.bind({elements:[{type:'text',text:'{{one}}'}],data_sources:{}},draft('One','one','001'),{columns:['id'],rows:[{id:'001'}]});d=Model.migrate(d);
 const element=d.elements[0];element.text='';d=engine.bind(d,d.database_connection,{columns:['id'],rows:[{id:'999'}]});assert.equal(resolver.evaluateDocument(d,{mode:'print'}).objects[element.id].text,'999');
 d=connections.remove(d,d.database_connection.id);assert.ok(resolver.evaluateDocument(d,{mode:'print'}).diagnostics.some(item=>item.severity==='error'));
});
