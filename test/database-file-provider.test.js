'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
test('Oracle detects its ODBC driver and uses only matching DSNs to read and refresh records',async()=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');let reads=0;
 const registry=createProviderRegistry({platform:'win32',inspectWindowsProviders:async()=>({drivers:['Oracle in OraClient19Home1','ODBC Driver 17 for SQL Server'],dataSources:[{name:'Oracle sales',driver:'Oracle in OraClient19Home1'},{name:'SQL sales',driver:'ODBC Driver 17 for SQL Server'}]}),readWindowsDatabase:async(type,config)=>{assert.equal(type,'odbc');assert.equal(config.dsn,'Oracle sales');return [{name:'ORDERS',columns:['ID'],rows:[{ID:String(++reads)}]}];}});
 const status=await registry.detect('oracle');assert.equal(status.available,true);assert.deepEqual(status.dataSources.map(s=>s.name),['Oracle sales']);const handle=await registry.open('oracle',{dsn:'Oracle sales'});assert.equal((await handle.read({})).rows[0].ID,'1');assert.equal((await handle.refresh({})).rows[0].ID,'2');await handle.dispose();
 const missing=createProviderRegistry({platform:'win32',inspectWindowsProviders:async()=>({drivers:['ODBC Driver 17 for SQL Server'],dataSources:[]})});assert.equal((await missing.detect('oracle')).available,false);
});
test('SQL Server and Azure SQL use direct server connections and refresh the selected table',async()=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');let reads=0;
 const registry=createProviderRegistry({platform:'win32',inspectWindowsProviders:async()=>({drivers:['ODBC Driver 17 for SQL Server','Other'],dataSources:[{name:'Sales',driver:'ODBC Driver 17 for SQL Server'}],servers:['localhost']}),readWindowsDatabase:async(type,config)=>{assert.equal(type,'odbc');assert.equal(config.server,'localhost');assert.equal(config.database,'SalesDB');return [{name:'Orders',columns:['id'],rows:[{id:String(++reads)}]}];}});
 for(const id of ['sqlserver','azure-sql']){const status=await registry.detect(id);assert.equal(status.available,true);assert.ok(status.servers?.includes('localhost'));const handle=await registry.open(id,{server:'localhost',database:'SalesDB',driver:'ODBC Driver 17 for SQL Server',integratedSecurity:true});assert.equal((await handle.read({})).rows[0].id,String(reads));assert.equal((await handle.refresh({})).rows[0].id,String(reads));await handle.dispose();}
 const missing=createProviderRegistry({platform:'win32',inspectWindowsProviders:async()=>({drivers:['Other'],dataSources:[]})});assert.equal((await missing.detect('sqlserver')).available,false);
});
test('file provider rereads the selected file, preserves IDs and retains cache on failed refresh',async t=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-db-provider-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
 const file=path.join(directory,'records.csv');await fs.writeFile(file,'id,name\n001,Tea');
 const registry=createProviderRegistry();assert.equal((await registry.detect('text')).available,true);
 assert.equal((await registry.detect('online')).available,false);
 const handle=await registry.open('text',{filePath:file,options:{}});
 const schema=await handle.schema();assert.equal(schema[0].id,'table:Records');
 assert.deepEqual((await handle.read({selection:{tableId:schema[0].id}})).rows,[{id:'001',name:'Tea'}]);
 await fs.writeFile(file,'id,name\n002,Coffee');
 assert.deepEqual((await handle.refresh({selection:{tableId:schema[0].id}})).rows,[{id:'002',name:'Coffee'}]);
 await fs.unlink(file);await assert.rejects(handle.refresh({}));
 assert.deepEqual((await handle.read({})).rows,[{id:'002',name:'Coffee'}]);
 await assert.rejects(handle.read({selection:{tableId:'unknown'}}),/table/i);
 await handle.dispose();await assert.rejects(handle.read({}),/closed/i);
});
test('file sessions refresh correctly when the request generation advances',async t=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');
 const {createProviderSessions}=require('../lib/database/provider-sessions');
 const {EventEmitter}=require('node:events');
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-db-generation-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
 const file=path.join(directory,'records.csv');await fs.writeFile(file,'id\n001');
 const owner=new EventEmitter(),sessions=createProviderSessions({registry:createProviderRegistry()});
 const req={sessionId:'file-session',generation:1,typeId:'text',config:{filePath:file}};
 assert.equal((await sessions.open(owner,req)).ok,true);
 await fs.writeFile(file,'id\n002');const result=await sessions.refresh(owner,{sessionId:req.sessionId,generation:2});
 assert.equal(result.ok,true);assert.deepEqual(result.data.rows,[{id:'002'}]);
 await sessions.dispose(owner,req);
});
test('worksheet identity survives reordering and a missing selected sheet preserves cached data',async t=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');
 const ExcelJS=require('exceljs');const directory=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-db-sheets-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
 const file=path.join(directory,'book.xlsx');
 async function write(names){const book=new ExcelJS.Workbook();for(const name of names){const sheet=book.addWorksheet(name);sheet.addRow(['id']);sheet.addRow([name]);}await book.xlsx.writeFile(file);}
 await write(['First','Second']);const handle=await createProviderRegistry().open('excel',{filePath:file});
 const selected={selection:{tableId:'table:Second'}};assert.equal((await handle.read(selected)).rows[0].id,'Second');
 await write(['Second','First']);assert.equal((await handle.refresh(selected)).rows[0].id,'Second');
 await write(['First']);await assert.rejects(handle.refresh(selected),/table/i);
 assert.equal((await handle.read(selected)).rows[0].id,'Second');await handle.dispose();
});
