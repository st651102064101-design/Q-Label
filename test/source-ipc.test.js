'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {createStore}=require('../lib/source-serialization');
test('library inspection IPC returns file choices and reports missing files without rejecting IPC',async()=>{
  const handlers=new Map();require('../lib/source-ipc')({ipcMain:{handle:(name,handler)=>handlers.set(name,handler)},settings:()=>({})});const inspect=handlers.get('inspect-source-library');assert.ok(inspect);const result=await inspect(null,{path:path.join(__dirname,'fixtures','native-phrase-library.btdb')});assert.equal(result.ok,true);assert.equal(result.libraries[0].phrases[0].languages[1].value,'ก');const missing=await inspect(null,{path:path.join(__dirname,'fixtures','absent.btdb')});assert.equal(missing.ok,false);assert.match(missing.error,/ENOENT|file/i);
});
test('source IPC preserves picker cancellation and uses settings globals for prepared preview',async()=>{
  const handlers=new Map();let cancelled=true;require('../lib/source-ipc')({ipcMain:{handle:(name,handler)=>handlers.set(name,handler)},dialog:{showOpenDialog:async()=>cancelled?{canceled:true,filePaths:[]}:{canceled:false,filePaths:['C:/fixture/path']}},settings:()=>({dataSourceGlobals:{Lot:'B42'}})});
  assert.deepEqual(await handlers.get('choose-source-file')(),{canceled:true});assert.deepEqual(await handlers.get('choose-source-directory')(),{canceled:true});cancelled=false;assert.deepEqual(await handlers.get('choose-source-file')(),{path:'C:/fixture/path'});assert.deepEqual(await handlers.get('choose-source-directory')(),{path:'C:/fixture/path'});
  const doc=require('../gui/source-model').migrate({elements:[{type:'text',text:'A'},{type:'text',text:'script'}]}),id=doc.elements[0].dataSourceRefs[0],script=doc.elements[1].dataSourceRefs[0];Object.assign(doc.sourceDefinitions[id],{name:'Global',kind:'global',config:{key:'Lot'}});Object.assign(doc.sourceDefinitions[script],{kind:'vbscript',config:{code:'Value = NamedSubString("Global")'}});const response=await handlers.get('prepare-source-inputs')(null,{template:doc});assert.equal(response.ok,true);assert.equal(response.inputs.preparedSources[script],'B42');
});

test('preview serialization discovers an external starting value without consuming it',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-preview-'));
  try{const file=path.join(dir,'value.txt');await fs.writeFile(file,'0099');
    const doc=require('../gui/source-model').migrate({name:'external counter',elements:[{type:'text',text:'0'}]}),id=doc.elements[0].dataSourceRefs[0];
    Object.assign(doc.sourceDefinitions[id],{kind:'file',config:{path:file},transforms:[{kind:'serialization',method:'numeric',step:1}]});
    const handlers=new Map(),store=createStore(path.join(dir,'ledger.json'));
    require('../lib/source-ipc')({ipcMain:{handle:(name,handler)=>handlers.set(name,handler)},settings:()=>({}),serialStore:store});
    const response=await handlers.get('prepare-source-inputs')(null,{template:doc});assert.equal(response.ok,true);
    const result=require('../gui/source-resolver').evaluateDocument(doc,response.inputs);assert.equal(result.objects[doc.elements[0].id].text,'0099');
    await assert.rejects(fs.access(path.join(dir,'ledger.json')));
  }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
