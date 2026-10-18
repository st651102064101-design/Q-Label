'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const Counter=require('../gui/source-counter');
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const stored=value=>/^-?(?:0|[1-9]\d*)$/.test(String(value))&&Number.isSafeInteger(Number(value))?Number(value):String(value);
function createStore(file){
  const absolute=path.resolve(file),lock=absolute+'.lock';
  async function read(){try{const state=JSON.parse(await fs.readFile(absolute,'utf8'));if(state.version!==1||!state.documents||!state.jobs)throw Error('Invalid serialization ledger');return state;}catch(error){if(error.code==='ENOENT')return{version:1,documents:{},jobs:{}};throw error;}}
  async function transaction(mutator){
    await fs.mkdir(path.dirname(absolute),{recursive:true});let handle;const started=Date.now(),token=crypto.randomUUID();
    while(!handle){try{handle=await fs.open(lock,'wx');await handle.writeFile(JSON.stringify({pid:process.pid,token}));}
      catch(error){if(error.code!=='EEXIST')throw error;
        try{const owner=JSON.parse(await fs.readFile(lock,'utf8'));try{process.kill(owner.pid,0);}catch(probe){if(probe.code==='ESRCH'){await fs.unlink(lock);continue;}}}catch(error){if(error.code==='ENOENT')continue;}
        if(Date.now()-started>30000)throw Error('Another print job is updating serialization state');await new Promise(resolve=>setTimeout(resolve,20));
      }
    }
    let temporary;
    try{const state=await read(),result=mutator(state);temporary=absolute+'.'+token+'.tmp';const output=await fs.open(temporary,'wx');try{await output.writeFile(JSON.stringify(state,null,2));await output.sync();}finally{await output.close();}await fs.rename(temporary,absolute);return result;}
    finally{await handle.close();await fs.unlink(lock).catch(error=>{if(error.code!=='ENOENT')throw error;});if(temporary)await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
  }
  function currentState(state,documentId,config){const document=own(state.documents,documentId)?state.documents[documentId]:{},current=own(document,config.id)?document[config.id]:null;return current&&current.start===String(config.start??1)?current:null;}
  function configValues(state,documentId,configs){return Object.fromEntries(configs.map(config=>[config.id,currentState(state,documentId,config)?.next??config.start??1]));}
  function configPositions(state,documentId,configs){return Object.fromEntries(configs.map(config=>{const current=currentState(state,documentId,config);return[config.id,config.trackInterval&&current?.interval===Number(config.interval||1)?current.position||0:0];}));}
  async function mark(jobId,status,{definitelyNotSent=false}={}){return transaction(state=>{
    const job=own(state.jobs,jobId)?state.jobs[jobId]:null;if(!job)throw Error('Unknown serialized print job: '+jobId);if(job.status==='accepted'&&status!=='accepted')throw Error('An accepted print job cannot release serialization values');
    if(definitelyNotSent&&job.status==='reserved')for(const config of job.configs){const current=state.documents[job.documentId]?.[config.id];if(current?.lastJob===jobId){if(job.previous?.[config.id])state.documents[job.documentId][config.id]=job.previous[config.id];else delete state.documents[job.documentId][config.id];}}
    job.status=status;job.updated=new Date().toISOString();return structuredClone(job);
  });}
  return {
    async peek(documentId,configs){return configValues(await read(),documentId,configs);},
    async peekState(documentId,configs){const state=await read();return{values:configValues(state,documentId,configs),positions:configPositions(state,documentId,configs)};},
    async reserve(documentId,jobId,configs){
      if(!documentId||!jobId)throw Error('Serialization requires document and job identities');
      for(const config of configs){if(!config.id||!Number.isInteger(config.count)||config.count<1)throw Error('Invalid serialization configuration');Counter.advance(config.start??1,0,{method:'numeric',...config});Counter.integer(config.step??1);}
      return transaction(state=>{
        if(own(state.jobs,jobId)){const job=state.jobs[jobId];if(job.documentId!==documentId||JSON.stringify(job.configs)!==JSON.stringify(configs))throw Error('Job identity was reused with different serialization settings');return structuredClone(job);}
        const values=configValues(state,documentId,configs),positions=configPositions(state,documentId,configs),document=own(state.documents,documentId)?state.documents[documentId]:Object.create(null),previous=Object.create(null);
        for(const config of configs){const interval=Number(config.interval||1);if(!Number.isInteger(interval)||interval<1)throw Error('Serialization interval must be positive');previous[config.id]=own(document,config.id)?structuredClone(document[config.id]):null;
          const consumed=positions[config.id]+config.count,increments=config.trackInterval?Math.floor(consumed/interval):Math.ceil(consumed/interval),position=config.trackInterval?consumed%interval:0;
          const next=stored(Counter.advance(values[config.id],Counter.integer(config.step??1)*BigInt(increments),{method:'numeric',...config}));Object.defineProperty(document,config.id,{value:{next,position,interval,start:String(config.start??1),lastJob:jobId},enumerable:true,writable:true,configurable:true});}
        Object.defineProperty(state.documents,documentId,{value:document,enumerable:true,writable:true,configurable:true});const job={documentId,jobId,values,positions,previous,configs:structuredClone(configs),status:'reserved',created:new Date().toISOString(),pid:process.pid};Object.defineProperty(state.jobs,jobId,{value:job,enumerable:true,writable:true,configurable:true});return structuredClone(job);
      });
    },
    markAccepted:jobId=>mark(jobId,'accepted'),markUnknown:jobId=>mark(jobId,'unknown'),markFailed:(jobId,options)=>mark(jobId,'failed',options),
    async getJob(jobId){const jobs=(await read()).jobs;return own(jobs,jobId)?jobs[jobId]:null;}
  };
}
function serialConfigs(document,{copies=1,total=1,records=1}={}){
  const definitions=document.sourceDefinitions||{},used=new Set(),all=require('../gui/source-model').elements(document);
  function visit(id){if(used.has(id))return;used.add(id);const source=definitions[id];if(source?.kind==='named')visit(source.config?.definitionId);if(source?.kind==='legacy')for(const match of String(source.config?.source?.value??'').matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g)){const target=Object.values(definitions).find(item=>item.name===match[1]);if(target)visit(target.id);}if(source?.kind==='object')for(const ref of all.find(e=>e.id===source.config?.objectId)?.dataSourceRefs||[])visit(ref);}
  for(const element of document.elements||[])if(element.enabled!==false)for(const id of element.dataSourceRefs||[])visit(id);
  const result=[];for(const id of used){const source=definitions[id],legacy=source?.kind==='legacy'&&source.config?.source?.type==='serial'?source.config.source:null,config=source?.transforms?.find(t=>t.kind==='serialization'&&t.enabled!==false)||(legacy?{method:'numeric',start:legacy.start??1,step:legacy.step??1,digits:legacy.digits||0,scope:'copy'}:null);if(config)result.push({...config,id,start:config.start??source.config?.value??source.config?.source?.value,step:config.step??1,count:config.scope==='job'?1:config.scope==='record'?records:total});}return result;
}
module.exports={createStore,serialConfigs};
