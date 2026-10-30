'use strict';
const {getDatabaseType}=require('./catalog');
const {getRetiredDatabaseTypeMessage}=require('./retired-types');
const idValid=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id);
const failure=(request,code,message)=>({sessionId:idValid(request?.sessionId)?request.sessionId:null,generation:Number.isSafeInteger(request?.generation)?request.generation:null,ok:false,error:{code,message}});
const success=(request,data)=>({sessionId:request.sessionId,generation:request.generation,ok:true,data});
function createProviderSessions({registry}){
 const owners=new WeakMap();
 function stateFor(owner){
  let state=owners.get(owner);
  if(!state){state={entries:new Map(),closed:new Set(),listening:false,dead:false};owners.set(owner,state);}
  return state;
 }
 const valid=request=>request&&idValid(request.sessionId)&&Number.isSafeInteger(request.generation)&&request.generation>=0;
 function prune(owner,state){if(!state.entries.size&&state.listening){owner.removeListener('destroyed',state.onDestroyed);state.listening=false;}}
 async function disposeResource(entry){if(entry.resource&&!entry.resourceDisposed){entry.resourceDisposed=true;try{await entry.resource.dispose?.();}catch{/* Closing cannot expose provider diagnostics or keep the session live. */}}}
 async function closeEntry(owner,state,entry){
  if(!entry.closed){entry.closed=true;entry.controller.abort();state.entries.delete(entry.id);state.closed.add(entry.id);if(state.closed.size>128)state.closed.delete(state.closed.values().next().value);prune(owner,state);}
  await disposeResource(entry);
 }
 function listen(owner,state){
  if(state.listening)return;
  state.onDestroyed=()=>{state.dead=true;for(const entry of [...state.entries.values()])void closeEntry(owner,state,entry);};
  owner.once('destroyed',state.onDestroyed);state.listening=true;
 }
 function isCurrent(state,entry,generation){return !entry.closed&&!state.dead&&state.entries.get(entry.id)===entry&&entry.generation===generation;}
 const cancelled=request=>failure(request,'CANCELLED','This database request was cancelled.');
 const invalid=request=>failure(request,'INVALID_REQUEST','The database request is invalid.');
 async function open(owner,request){
  if(!valid(request)||!getDatabaseType(request.typeId)||!request.config||typeof request.config!=='object'||Array.isArray(request.config)){
   if(valid(request)&&request.typeId&&!getDatabaseType(request.typeId))return failure(request,'PROVIDER_UNAVAILABLE',getRetiredDatabaseTypeMessage(request.typeId)||'This database provider is unavailable.');
   return invalid(request);
  }
  const state=stateFor(owner);
  if(state.dead||owner.isDestroyed?.())return cancelled(request);
  if(state.entries.has(request.sessionId))return failure(request,'SESSION_EXISTS','This database session is already open.');
  if(state.entries.size>=64)return failure(request,'SESSION_LIMIT','Close an existing database connection first.');
  const entry={id:request.sessionId,generation:request.generation,controller:new AbortController(),closed:false,resource:null,resourceDisposed:false};
  state.entries.set(entry.id,entry);state.closed.delete(entry.id);listen(owner,state);
  try{
   const availability=await registry.detect(request.typeId);
   if(!isCurrent(state,entry,request.generation))return cancelled(request);
   if(!availability.available){await closeEntry(owner,state,entry);return failure(request,'PROVIDER_UNAVAILABLE',availability.reason||'This database provider is unavailable.');}
   entry.resource=await registry.open(request.typeId,request.config,{signal:entry.controller.signal,owner});
   if(!isCurrent(state,entry,request.generation)){await disposeResource(entry);return cancelled(request);}
   return success(request,{capabilities:availability.capabilities||[]});
  }catch{
   const stale=!isCurrent(state,entry,request.generation);await closeEntry(owner,state,entry);
   return stale?cancelled(request):failure(request,'PROVIDER_ERROR','Could not open the database connection. Check the source and connection settings.');
  }
 }
 async function run(owner,request,operation){
  if(!valid(request))return invalid(request);
  const state=owners.get(owner),entry=state?.entries.get(request.sessionId);
  if(!entry)return failure(request,'SESSION_NOT_FOUND','This database session is not open.');
  if(request.generation<entry.generation)return failure(request,'STALE_REQUEST','This database request has been superseded.');
  if(!entry.resource)return failure(request,'SESSION_BUSY','The database connection is still opening.');
  if(request.generation>entry.generation){entry.controller.abort();entry.controller=new AbortController();entry.generation=request.generation;}
  if(typeof entry.resource[operation]!=='function')return failure(request,'UNSUPPORTED_OPERATION','This database operation is unavailable.');
  try{
   const data=await entry.resource[operation](request,{signal:entry.controller.signal});
   return isCurrent(state,entry,request.generation)?success(request,data):cancelled(request);
  }catch{
   return isCurrent(state,entry,request.generation)?failure(request,'PROVIDER_ERROR','Could not read the database. Check the source and connection settings.'):cancelled(request);
  }
 }
 async function dispose(owner,request){
  if(!request||!idValid(request.sessionId))return invalid(request);
  const state=owners.get(owner),entry=state?.entries.get(request.sessionId);
  if(!entry)return state?.closed.has(request.sessionId)?success(request,{closed:true}):failure(request,'SESSION_NOT_FOUND','This database session is not open.');
  await closeEntry(owner,state,entry);return success(request,{closed:true});
 }
 return Object.freeze({open,schema:(owner,r)=>run(owner,r,'schema'),read:(owner,r)=>run(owner,r,'read'),refresh:(owner,r)=>run(owner,r,'refresh'),dispose});
}
module.exports={createProviderSessions};
