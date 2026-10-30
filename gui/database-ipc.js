'use strict';
const path=require('node:path'),{randomUUID}=require('node:crypto');
const {getDatabaseType}=require('../lib/database/catalog');
const {getRetiredDatabaseTypeMessage}=require('../lib/database/retired-types');
const {createProviderRegistry}=require('../lib/database/provider-registry');
const {createProviderSessions}=require('../lib/database/provider-sessions');
const {nativeTypes}=require('./database-provider-types');
function registerDatabaseIpc({ipcMain,dialog,registry}){
 registry||=createProviderRegistry();
 const sessions=createProviderSessions({registry}),approved=new WeakMap();
 const error=(request,code,message)=>({sessionId:request?.sessionId||null,generation:request?.generation??null,ok:false,error:{code,message}});
 const key=(typeId,file)=>typeId+'\0'+path.resolve(file);
 function approve(owner,typeId,file){let paths=approved.get(owner);if(!paths){paths=new Set();approved.set(owner,paths);}paths.add(key(typeId,file));}
 async function snapshot(owner,request){
  const schema=await sessions.schema(owner,request);if(!schema.ok)return schema;
  const tables=[];
  for(const table of schema.data){const result=await sessions.read(owner,{...request,selection:{tableId:table.id}});if(!result.ok)return result;tables.push({id:table.id,name:table.name,columns:result.data.columns,rows:result.data.rows});}
  return {...schema,data:{tables}};
 }
 ipcMain.handle('database-detect',async(_event,typeId)=>registry.detect(typeId));
 ipcMain.handle('database-list-databases',async(_event,request)=>{
  if(!['sqlserver','azure-sql'].includes(request?.typeId))return error(request,'UNSUPPORTED_OPERATION','Database listing is unavailable for this source.');
  try{
   const {listSqlServerCatalog}=require('../lib/database/windows-provider');
   const data=await listSqlServerCatalog(request.config||{});
   return {ok:true,data};
  }catch(err){return error(request,'PROVIDER_ERROR',err?.message||'Could not list databases on this server.');}
 });
 ipcMain.handle('database-pick-connection-file',async(event,typeId)=>{
  if(!nativeTypes.includes(typeId))return error(null,'UNSUPPORTED_OPERATION','This database file selection is unavailable.');
  try{
   const selected=await dialog.showOpenDialog({properties:['openFile'],filters:[typeId!=='oledb'?{name:'ODBC File Data Source',extensions:['dsn']}:{name:'Universal Data Link',extensions:['udl']}]});
   if(selected.canceled||!selected.filePaths?.[0])return {ok:false,canceled:true};
   if(event.sender.isDestroyed?.())return error(null,'CANCELLED','The database window was closed.');
   return {ok:true,filePath:selected.filePaths[0]};
  }catch{return error(null,'PROVIDER_ERROR','Could not select the data source file.');}
 });
 ipcMain.handle('database-pick',async(event,request)=>{
  const type=getDatabaseType(request?.typeId);
  if(!type?.accept)return error(request,'PROVIDER_UNAVAILABLE','This database source is not available for file selection.');
  const status=await registry.detect(type.id);if(!status.available)return error(request,'PROVIDER_UNAVAILABLE',status.reason);
  try{
   const selected=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:type.name,extensions:type.accept.split(',').map(ext=>ext.slice(1))}]});
   if(selected.canceled||!selected.filePaths?.[0])return {ok:false,canceled:true};
   if(event.sender.isDestroyed?.())return error(request,'CANCELLED','The database window was closed.');
   const file=selected.filePaths[0];approve(event.sender,type.id,file);
   const opening={sessionId:randomUUID(),generation:1,typeId:type.id,config:{filePath:file,options:request.options||{}}};
   const opened=await sessions.open(event.sender,opening);if(!opened.ok)return opened;
   const data=await snapshot(event.sender,opening);
   if(!data.ok){await sessions.dispose(event.sender,opening);return data;}
   return {...data,data:{...data.data,fileName:path.basename(file),filePath:file}};
  }catch{return error(request,'PROVIDER_ERROR','Could not open the selected database file.');}
 });
 ipcMain.handle('database-open',async(event,request)=>{
  const retired=getRetiredDatabaseTypeMessage(request?.typeId);if(retired)return error(request,'PROVIDER_UNAVAILABLE',retired);
  const file=request?.config?.filePath;
  if(!nativeTypes.includes(request?.typeId)&&(typeof file!=='string'||!approved.get(event.sender)?.has(key(request.typeId,file))))return error(request,'SOURCE_NOT_SELECTED','Select this database file again to refresh its records.');
  const opened=await sessions.open(event.sender,request);if(!opened.ok)return opened;
  const data=await snapshot(event.sender,request);
  if(!data.ok)await sessions.dispose(event.sender,request);
  return data;
 });
 ipcMain.handle('database-schema',(event,request)=>sessions.schema(event.sender,request));
 ipcMain.handle('database-read',(event,request)=>sessions.read(event.sender,request));
 ipcMain.handle('database-refresh',async(event,request)=>{
  const retired=getRetiredDatabaseTypeMessage(request?.typeId);if(retired)return error(request,'PROVIDER_UNAVAILABLE',retired);
  const refreshed=await sessions.refresh(event.sender,request);if(!refreshed.ok)return refreshed;
  return snapshot(event.sender,request);
 });
 ipcMain.handle('database-dispose',(event,request)=>sessions.dispose(event.sender,request));
 return sessions;
}
module.exports={registerDatabaseIpc};
