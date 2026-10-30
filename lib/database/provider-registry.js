'use strict';
const fs=require('node:fs/promises');
const {getDatabaseType}=require('./catalog');
const {getRetiredDatabaseTypeMessage}=require('./retired-types');
const providerTypes=require('../../gui/database-provider-types');
const fileTypes=new Set(['text','xml','json','excel','builder','import']);
function createProviderRegistry({readFile=fs.readFile,readAccess,platform=process.platform,inspectWindowsProviders,readWindowsDatabase}={}){
 const nativeTypes=new Set(providerTypes.nativeTypes);
 const nativeStatus=new Map();
 const discoveries=new Map();
 function discover(type){
  const cached=discoveries.get(type);if(cached&&(cached.pending||Date.now()-cached.time<5000))return cached.promise;
  const entry={pending:true,time:0,promise:null};
  entry.promise=Promise.resolve().then(()=>(inspectWindowsProviders||require('./windows-provider').inspectWindowsProviders)(type)).finally(()=>{entry.pending=false;entry.time=Date.now();});
  discoveries.set(type,entry);return entry.promise;
 }
 async function detect(typeId){
  const retired=getRetiredDatabaseTypeMessage(typeId);if(retired)return {available:false,reason:retired,capabilities:[]};
  if(!getDatabaseType(typeId))return {available:false,reason:'Unknown database type.',capabilities:[]};
  if(nativeTypes.has(typeId)&&platform==='win32'){
   const cached=nativeStatus.get(typeId);if(cached&&Date.now()-cached.time<5000)return cached.status;
   try{
    const providerType=providerTypes.transport(typeId);
    let details=await discover(providerType);
    if(providerType==='odbc')details={...details,drivers:(details.drivers||[]).filter(name=>providerTypes.matchesDriver(typeId,name)),dataSources:(details.dataSources||[]).filter(source=>providerTypes.matchesDriver(typeId,source.driver))};
    const available=providerType==='odbc'?details.drivers.length>0:details.providers.length>0;
    const status={available,reason:available?'':`Install a compatible 64-bit ${providerTypes.label(typeId)} driver and configure a data source in Windows.`,capabilities:available?['schema','read','refresh']:[],...details};
    nativeStatus.set(typeId,{time:Date.now(),status});return status;
   }catch{return {available:false,reason:'Could not enumerate installed Windows database providers.',capabilities:[]};}
  }
  const available=fileTypes.has(typeId)||(typeId==='access'&&platform==='win32');
  return {available,reason:available?'':typeId==='access'?'Access requires Windows and an installed Access Database Engine.':'This database connector is not available yet.',capabilities:available?['schema','read','refresh']:[]};
 }
 async function open(typeId,config,{signal,owner}={}){
  const availability=await detect(typeId);if(!availability.available)throw Error(availability.reason||'Database provider is unavailable.');
  if(!config||(!nativeTypes.has(typeId)&&(typeof config.filePath!=='string'||!config.filePath||config.filePath.includes('\0'))))throw Error('Choose a database file.');
  const filePath=config.filePath,options=structuredClone(config.options||{}),nativeConfig=nativeTypes.has(typeId)?structuredClone(config):null;let tables,closed=false;
  async function validateConfig(context){if(providerTypes.transport(typeId)==='odbc'&&typeId!=='odbc'){
   if(config.server){
    if(!['sqlserver','azure-sql'].includes(typeId)||!availability.drivers.includes(config.driver))throw Error('Choose a compatible installed database driver.');
   }else if(config.fileDsn){
    const bytes=await readFile(config.fileDsn,{signal:context?.signal});if(bytes.length>65536)throw Error('The File DSN is too large.');
    const text=bytes[0]===255&&bytes[1]===254?Buffer.from(bytes).subarray(2).toString('utf16le'):Buffer.from(bytes).toString('utf8');
    let section='',driver='';for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){const group=line.trim().match(/^\[([^\]]+)\]$/);if(group){section=group[1].toLowerCase();continue;}if(section==='odbc'){const field=line.match(/^\s*driver\s*=\s*(.*?)\s*$/i);if(field)driver=field[1].replace(/^\{(.*)\}$/,'$1');}}
    if(!providerTypes.matchesDriver(typeId,driver)||!availability.drivers.some(name=>name.toLowerCase()===driver.toLowerCase()))throw Error('Choose a File DSN using the matching installed database driver.');
   }else if(!availability.dataSources.some(source=>source.name===config.dsn))throw Error('Choose a matching database DSN.');
  }}
  const check=context=>{if(closed)throw Error('Database connection is closed.');if(context?.signal?.aborted)throw Error('Database request cancelled.');};
  async function load(context){
   check(context);
   await validateConfig(context);check(context);
   const result=nativeTypes.has(typeId)?await (readWindowsDatabase||require('./windows-provider').readWindowsDatabase)(providerTypes.transport(typeId),nativeConfig,context):typeId==='access'?await (readAccess||require('../access-database').readAccess)(filePath):await require('../database-import').importFile(typeId,new Uint8Array(await readFile(filePath,{signal:context?.signal})),options);
   check(context);
   if(!result.length||new Set(result.map(table=>table.name)).size!==result.length)throw Error('Database tables need unique names.');
   return result;
  }
  tables=await load({signal});
  const tableId=table=>`table:${encodeURIComponent(table.name)}`;
  function read(request={},context,source=tables){
   check(context);const id=request.selection?.tableId;
   const index=id==null?0:source.findIndex(table=>tableId(table)===id);
   const table=source[index];if(!table)throw Error('Choose a valid table.');
   return structuredClone({tableId:tableId(table),name:table.name,columns:table.columns,rows:table.rows});
  }
  return {
   async schema(_request,context){check(context);return tables.map(table=>({id:tableId(table),name:table.name,columns:[...table.columns]}));},
   async read(request,context){return read(request,context);},
   async refresh(request,context){const next=await load(context),result=read(request,context,next);tables=next;return result;},
   async dispose(){closed=true;tables=null;if(nativeConfig)for(const key of Object.keys(nativeConfig))delete nativeConfig[key];}
  };
 }
 return Object.freeze({detect,open});
}
module.exports={createProviderRegistry};
