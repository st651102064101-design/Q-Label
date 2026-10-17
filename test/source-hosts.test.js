'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const Model=require('../gui/source-model');
function fixture(kind,config){const doc=Model.migrate({name:'host-fixture',width_mm:60,height_mm:30,dpi:203,elements:[{type:'text',text:'sample',x_mm:2,y_mm:2,height_mm:4,width_mm:40}]});const id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id]={id,kind,config,dataType:{kind:'text'},transforms:[]};return{doc,id};}
test('server prepares external data before handing bytes to its transport',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-host-'));try{
    const file=path.join(dir,'value.txt');await fs.writeFile(file,'HOST-FILE');const{doc}=fixture('file',{path:file});let sent;
    const result=await require('../lib/server').printJob(()=>doc,{template:'fixture',connection:{type:'ip',ip:'127.0.0.1'}},{send:async bytes=>{sent=bytes;}});
    assert.equal(result.count,1);assert.match(sent.toString(),/HOST-FILE/);await fs.writeFile(file,'CHANGED-FILE');await require('../lib/server').printJob(()=>doc,{template:'fixture',connection:{type:'ip',ip:'127.0.0.1'}},{send:async bytes=>{sent=bytes;}});assert.match(sent.toString(),/CHANGED-FILE/);
  }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
test('source host rolls back unsent serial reservations but never reuses uncertain transport values',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-host-serial-'));try{
    const store=require('../lib/source-serialization').createStore(path.join(dir,'serial.json')),{doc,id}=fixture('embedded',{value:'10'});doc.sourceDefinitions[id].transforms=[{kind:'serialization',start:'10',step:1}];const payload={template:doc,connection:{type:'ip',ip:'127.0.0.1'}};const execute=require('../lib/source-host-job').execute;
    await assert.rejects(()=>execute({...payload,connection:{}},{serialStore:store,send:async()=>assert.fail('invalid connection sent')}),/connection/i);assert.equal((await store.peek(doc.sourceDocumentId,[{id,start:10,step:1,count:1}]))[id],10);
    let sends=0;await assert.rejects(()=>execute(payload,{serialStore:store,beforeSend:async()=>{throw Error('disk full');},send:async()=>{sends++;}}),/disk full/);assert.equal(sends,0);assert.equal((await store.peek(doc.sourceDocumentId,[{id,start:10,step:1,count:1}]))[id],10);
    await assert.rejects(()=>execute(payload,{serialStore:store,send:async()=>{throw Error('transport failed');}}),/unknown/i);assert.equal((await store.peek(doc.sourceDocumentId,[{id,start:10,step:1,count:1}]))[id],11);
    let output;await execute(payload,{serialStore:store,send:async bytes=>{output=bytes;}});assert.match(output.toString(),/11/);assert.equal((await store.peek(doc.sourceDocumentId,[{id,start:10,step:1,count:1}]))[id],12);
  }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});

test('CLI dry-run prepares the same external sources without contacting a printer',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-cli-source-'));try{
    const file=path.join(dir,'value.txt');await fs.writeFile(file,'CLI-EXTERNAL');const{doc}=fixture('file',{path:file}),template=path.join(dir,'label.json');await fs.writeFile(template,JSON.stringify(doc));
    const result=require('node:child_process').spawnSync(process.execPath,['cli.js','print','--template',template,'--dry-run'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',env:{...process.env,QLABEL_STATE_DIR:path.join(dir,'state')},timeout:10000,windowsHide:true});
    assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/CLI-EXTERNAL/);await assert.rejects(()=>fs.access(path.join(dir,'state','source-serialization.json')),/ENOENT/);
  }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});

test('HTTP source jobs preserve settings, refresh files and validate every record before transport',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-http-sources-'));let server;try{
    await fs.writeFile(path.join(dir,'A.txt'),'A');await fs.writeFile(path.join(dir,'B.txt'),'B');const{doc}=fixture('file',{pathMode:'database',pathSource:'filename',defaultPath:dir,encoding:'utf-8'});
    doc.sourceDefinitions.company={id:'company',kind:'global',config:{key:'company'}};doc.elements[0].dataSourceRefs.unshift('company');const sent=[];
    server=require('../lib/server').startServer({port:0,host:'127.0.0.1',resolveTemplate:()=>doc,settings:()=>({dataSourceGlobals:{company:'QL-'}}),serialStore:require('../lib/source-serialization').createStore(path.join(dir,'ledger.json')),defaults:{connection:{type:'ip',ip:'127.0.0.1'}},send:async bytes=>{sent.push(bytes.toString());}});await new Promise(resolve=>server.once('listening',resolve));
    const post=job=>fetch('http://127.0.0.1:'+server.address().port+'/print',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({template:'fixture',...job})});
    let response=await post({rows:[{filename:'A.txt'},{filename:'B.txt'}],copies:2});assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,count:4});assert.match(sent[0],/QL-A/);assert.match(sent[0],/QL-B/);
    await fs.writeFile(path.join(dir,'A.txt'),'A2');response=await post({rows:[{filename:'A.txt'}]});assert.equal(response.status,200);await response.json();assert.match(sent[1],/QL-A2/);
    response=await post({rows:[{filename:'A.txt'},{filename:'missing.txt'}]});assert.equal(response.status,400);assert.match((await response.json()).error,/ENOENT|missing/i);assert.equal(sent.length,2,'no partially prepared record was sent');
  }finally{if(server){server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));}assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
