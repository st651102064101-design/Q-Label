'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {createStore}=require('../lib/source-serialization');
test('sidebar serial definitions use exact prepared values, identical copies and the durable counter',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-sidebar-serial-'));
 try{
  const doc=require('../gui/source-model').migrate({name:'sidebar serial',width_mm:60,height_mm:30,dpi:203,elements:[{type:'barcode128',text:'{{serial}}',x_mm:2,y_mm:2,module_width:2,bar_height_mm:10}],data_sources:{serial:{type:'serial',start:1,step:1,digits:4,prefix:'SN-'}}});
  const payload={template:doc,copies:2,serialization:{enabled:true,count:10},connection:{type:'ip',ip:'127.0.0.1'}},store=createStore(path.join(dir,'ledger.json')),prepare=require('../lib/print-job').preparePrintJobAsync,resolve=require('../gui/object-data').resolve;
  const first=await prepare(payload,{}, {serialStore:store});assert.equal(first.count,20);assert.deepEqual(first.dataList.map(d=>resolve(doc.elements[0],d)),Array.from({length:20},(_,i)=>'SN-'+String(Math.floor(i/2)+1).padStart(4,'0')));await assert.rejects(fs.access(path.join(dir,'ledger.json')),/ENOENT/);
  await prepare(payload,{}, {serialStore:store,reserve:true,jobId:'sidebar'});await store.markAccepted('sidebar');const next=await prepare(payload,{}, {serialStore:store});assert.equal(resolve(doc.elements[0],next.dataList[0]),'SN-0011');
 }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
test('source serialization quantity produces ten changing barcode pages and identical copies without consuming preview values',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-serial-pages-'));
  try{
    const doc=require('../gui/source-model').migrate({name:'serial pages',width_mm:60,height_mm:40,dpi:203,elements:[{type:'barcode128',text:'0001',x_mm:2,y_mm:2,module_width:2,bar_height_mm:15}]}),id=doc.elements[0].dataSourceRefs[0];
    doc.sourceDefinitions[id].transforms=[{kind:'serialization',method:'numeric',step:1}];
    const payload={template:doc,copies:2,serialization:{enabled:true,count:10},connection:{type:'ip',ip:'127.0.0.1'}},store=createStore(path.join(dir,'ledger.json'));
    const prepare=require('../lib/print-job').preparePrintJobAsync,resolve=require('../gui/object-data').resolve;
    const job=await prepare(payload,{}, {serialStore:store});
    const expected=Array.from({length:20},(_,i)=>String(Math.floor(i/2)+1).padStart(4,'0'));
    assert.equal(job.count,20);assert.deepEqual(job.dataList.map(data=>resolve(doc.elements[0],data)),expected);
    assert.deepEqual(job.previewIndexes.map((i,page)=>resolve(job.previewTemplates[i].elements[0],job.dataList[page])),expected);
    for(const value of new Set(expected))assert.ok(job.zpl.toString().includes('^FD'+value+'^FS'),value+' encoded');
    await assert.rejects(fs.access(path.join(dir,'ledger.json')),/ENOENT/);
    const again=await prepare(payload,{}, {serialStore:store});assert.deepEqual(again.dataList,job.dataList);
    await prepare(payload,{}, {serialStore:store,reserve:true,jobId:'actual'});await store.markAccepted('actual');
    const next=await prepare(payload,{}, {serialStore:store});assert.equal(resolve(doc.elements[0],next.dataList[0]),'0011');
  }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
test('multi-item source serial reservations account for every generated page',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-multi-serial-'));
 try{
  const doc=require('../gui/source-model').migrate({name:'multi serial',width_mm:60,height_mm:30,dpi:203,elements:[{type:'text',text:'0001',x_mm:2,y_mm:2,height_mm:3}]}),id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id].transforms=[{kind:'serialization',step:1}];
  const payload={template:doc,serialization:{enabled:true,count:1},multiField:'item',multiItems:[{value:'A',qty:3}],connection:{type:'ip',ip:'127.0.0.1'}},store=createStore(path.join(dir,'ledger.json')),prepare=require('../lib/print-job').preparePrintJobAsync,resolve=require('../gui/object-data').resolve;
  const job=await prepare(payload,{}, {serialStore:store,reserve:true,jobId:'multi'});assert.deepEqual(job.dataList.map(d=>resolve(doc.elements[0],d)),['0001','0002','0003']);await store.markAccepted('multi');
  const next=await prepare(payload,{}, {serialStore:store});assert.equal(resolve(doc.elements[0],next.dataList[0]),'0004');
 }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
test('print runtime consumes serials only for real jobs and preserves uncertain transport outcomes',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-serial-')),store=createStore(path.join(dir,'ledger.json'));
  try{const doc=require('../gui/source-model').migrate({name:'serial runtime',width_mm:60,height_mm:30,dpi:203,elements:[{type:'text',text:'0',x_mm:1,y_mm:1,height_mm:3,width_mm:2}]}),id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id].transforms=[{kind:'serialization',start:100,step:1,scope:'copy'}];
    const handlers=new Map();let fail=false,sent=[];const runtime=require('../gui/print-ipc')({ipcMain:{handle:(name,handler)=>handlers.set(name,handler)},dialog:{},settings:()=>({}),saveSettings:()=>{},printerNames:async()=>[],serialStore:store,sendNetwork:async(_host,_port,buffer)=>{if(fail)throw Error('fake disconnect');sent.push(buffer.toString());}});
    const payload={template:doc,copies:2,connection:{type:'ip',ip:'127.0.0.1'}};
    await assert.rejects(runtime.print({...payload,connection:{type:'ip',ip:''}}),error=>{assert.doesNotMatch(error.message,/unknown/i);assert.match(error.message,/connection|address/i);return true;});assert.equal(sent.length,0);assert.equal((await store.peek(doc.sourceDocumentId,[{id,start:100}]))[id],100);
    const preview=await handlers.get('prepare-print-job')(null,payload);assert.equal(preview.ok,true);assert.equal((await store.peek(doc.sourceDocumentId,[{id,start:100}]))[id],100);
    await runtime.print(payload);assert.ok(sent[0].includes('^FD100^FS'));assert.ok(sent[0].includes('^FD101^FS'));assert.equal((await store.peek(doc.sourceDocumentId,[{id,start:100}]))[id],102);
    fail=true;await assert.rejects(runtime.print(payload),/outcome is unknown/);assert.equal((await store.peek(doc.sourceDocumentId,[{id,start:100}]))[id],104);
  }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
test('partial serialization intervals carry over between print jobs exactly as the installed help example',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-serial-')),store=createStore(path.join(dir,'ledger.json'));
  try{const doc=require('../gui/source-model').migrate({name:'interval',width_mm:60,height_mm:30,dpi:203,elements:[{type:'text',text:'1',x_mm:1,y_mm:1,height_mm:3,width_mm:2}]}),id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id].transforms=[{kind:'serialization',start:'1',step:1,scope:'copy',interval:3,trackInterval:true}];
    const {preparePrintJobAsync}=require('../lib/print-job'),ObjectData=require('../gui/object-data'),payload={template:doc,copies:5,connection:{type:'ip',ip:'127.0.0.1'}};
    const first=await preparePrintJobAsync(payload,{}, {serialStore:store,reserve:true,jobId:'first'});assert.deepEqual(first.dataList.map(data=>ObjectData.resolve(doc.elements[0],data)),['1','1','1','2','2']);await store.markAccepted('first');
    const second=await preparePrintJobAsync({...payload,copies:3},{},{serialStore:store,reserve:true,jobId:'second'});assert.deepEqual(second.dataList.map(data=>ObjectData.resolve(doc.elements[0],data)),['2','3','3']);
  }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});

for(const scenario of [{name:'runtime PCT fields',kind:'pct',config:{field:'next'},extra:{pctFields:{next:'0099'},copies:2},expected:['0099','0100']},{name:'actual print job copy count',kind:'job',config:{key:'copies'},extra:{copies:3},expected:['3','4','5']}])test('serialization initial snapshot includes '+scenario.name,async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-serial-context-'));try{
    const doc=require('../gui/source-model').migrate({name:'context counter',width_mm:60,height_mm:30,dpi:203,elements:[{type:'text',text:'0',x_mm:1,y_mm:1,height_mm:3,width_mm:30}]}),id=doc.elements[0].dataSourceRefs[0];Object.assign(doc.sourceDefinitions[id],{kind:scenario.kind,config:scenario.config,transforms:[{kind:'serialization',method:'numeric',step:1}]});
    const job=await require('../lib/print-job').preparePrintJobAsync({template:doc,connection:{type:'ip',ip:'127.0.0.1'},...scenario.extra},{},{serialStore:createStore(path.join(dir,'ledger.json'))});
    assert.deepEqual(job.dataList.map(data=>require('../gui/object-data').resolve(doc.elements[0],data)),scenario.expected);await assert.rejects(()=>fs.access(path.join(dir,'ledger.json')),/ENOENT/);
  }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});

test('nested legacy serial sources reserve their dependency before the next job',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-nested-serial-'));try{
 const doc=require('../gui/source-model').migrate({name:'nested',width_mm:60,height_mm:30,dpi:203,elements:[{type:'text',text:'{{Wrapped}}',x_mm:1,y_mm:1,height_mm:3}],data_sources:{Wrapped:{type:'constant',value:'{{Serial1}}'},Serial1:{type:'serial',start:1,step:1,digits:4}}});
 const store=createStore(path.join(dir,'ledger.json')),prepare=require('../lib/print-job').preparePrintJobAsync,resolve=require('../gui/object-data').resolve,payload={template:doc,copies:2,serialization:{enabled:true,count:10},connection:{type:'ip',ip:'127.0.0.1'}};
 const first=await prepare(payload,{}, {serialStore:store,reserve:true,jobId:'nested'});assert.equal(resolve(doc.elements[0],first.dataList[0]),'0001');assert.equal(resolve(doc.elements[0],first.dataList[19]),'0010');await store.markAccepted('nested');
 const next=await prepare(payload,{}, {serialStore:store});assert.equal(resolve(doc.elements[0],next.dataList[0]),'0011');
 }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
