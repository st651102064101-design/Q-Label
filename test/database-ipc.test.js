'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {EventEmitter}=require('node:events');
test('SQL Server and Azure SQL DSN connections cross the IPC boundary without file approval',async()=>{
 const {registerDatabaseIpc}=require('../gui/database-ipc'),handlers=new Map(),owner=new EventEmitter();owner.isDestroyed=()=>false;
 const registry={detect:async()=>({available:true}),open:async(type,config)=>({schema:async()=>[{id:'table:Orders',name:'Orders',columns:['id']}],read:async()=>({columns:['id'],rows:[{id:type+':'+(config.server||config.dsn)}]}),dispose:async()=>{}})};
 registerDatabaseIpc({ipcMain:{handle:(name,fn)=>handlers.set(name,fn)},dialog:{showOpenDialog:async()=>({canceled:true})},registry});
 for(const typeId of ['sqlserver','azure-sql']){const request={sessionId:typeId,generation:1,typeId,config:{server:'localhost',database:'SalesDB',integratedSecurity:true}};const result=await handlers.get('database-open')({sender:owner},request);assert.equal(result.ok,true);assert.equal(result.data.tables[0].rows[0].id,typeId+':localhost');await handlers.get('database-dispose')({sender:owner},request);}
 const oracleRequest={sessionId:'oracle',generation:1,typeId:'oracle',config:{dsn:'Sales'}};assert.equal((await handlers.get('database-open')({sender:owner},oracleRequest)).ok,true);
});
test('database IPC opens a selected file, refreshes it and rejects unapproved paths and owners',async t=>{
 const {registerDatabaseIpc}=require('../gui/database-ipc');
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-db-ipc-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
 const file=path.join(directory,'records.csv');await fs.writeFile(file,'id\n001');
 const handlers=new Map(),owner=new EventEmitter(),foreign=new EventEmitter();owner.isDestroyed=()=>false;
 registerDatabaseIpc({ipcMain:{handle:(key,fn)=>handlers.set(key,fn)},dialog:{showOpenDialog:async()=>({filePaths:[file]})}});
 const call=(key,args,sender=owner)=>handlers.get('database-'+key)({sender},args);
 const picked=await call('pick',{typeId:'text',options:{}});assert.equal(picked.ok,true);assert.deepEqual(picked.data.tables[0].rows,[{id:'001'}]);
 assert.equal((await call('open',{sessionId:'unapproved',generation:1,typeId:'text',config:{filePath:path.join(directory,'private.csv')}})).error.code,'SOURCE_NOT_SELECTED');
 assert.equal((await call('read',picked,foreign)).error.code,'SESSION_NOT_FOUND');
 await fs.writeFile(file,'id\n002');const refreshed=await call('refresh',{sessionId:picked.sessionId,generation:2});
 assert.equal(refreshed.ok,true);assert.deepEqual(refreshed.data.tables[0].rows,[{id:'002'}]);
 await call('dispose',picked);assert.equal((await call('read',picked)).ok,false);
});
test('cancelled native file selection creates no session or result rows',async()=>{
 const {registerDatabaseIpc}=require('../gui/database-ipc');const handlers=new Map();
 registerDatabaseIpc({ipcMain:{handle:(key,fn)=>handlers.set(key,fn)},dialog:{showOpenDialog:async()=>({canceled:true,filePaths:[]})}});
 assert.deepEqual(await handlers.get('database-pick')({sender:new EventEmitter()},{typeId:'text'}),{ok:false,canceled:true});
});

