'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

// Driver fixtures name installed ODBC drivers. All connection results below are
// controlled adapters; these cases do not claim a live connection to each DBMS.
const servers=[
 {id:'firebird',name:'Firebird',driver:'Firebird ODBC Driver',aliases:['Firebird/InterBase(r) driver']},
 {id:'db2',name:'IBM DB2',driver:'IBM DB2 ODBC DRIVER - DB2COPY1',aliases:[]},
 {id:'informix',name:'IBM Informix',driver:'IBM INFORMIX ODBC DRIVER',aliases:[]},
 {id:'mysql',name:'MySQL',driver:'MySQL ODBC 8.4 Unicode Driver',aliases:['MySQL ODBC 8.0 ANSI Driver']},
 {id:'mariadb',name:'MariaDB',driver:'MariaDB ODBC 3.2 Driver',aliases:[]},
 {id:'postgresql',name:'PostgreSQL',driver:'PostgreSQL Unicode(x64)',aliases:['PostgreSQL ANSI(x64)']},
 {id:'sap-hana',name:'SAP HANA',driver:'HDBODBC',aliases:['HDBODBC32']}
];
const types=()=>require('../gui/database-provider-types');

test('shared database transport catalog retains SQL Server, Oracle and all seven added DSN types',()=>{
 const api=types();
 for(const id of ['odbc','sqlserver','azure-sql','oracle',...servers.map(server=>server.id)]){
  assert.ok(api.dsnTypes.includes(id),id+' needs DSN transport');
  assert.ok(api.nativeTypes.includes(id),id+' needs native wizard routing');
  assert.equal(api.transport(id),'odbc');
 }
 assert.equal(api.transport('oledb'),'oledb');
 assert.equal(api.transport('text'),null);
 assert.equal(api.transport('unknown'),null);
 assert.equal(new Set(api.dsnTypes).size,api.dsnTypes.length);
 assert.equal(api.matchesDriver('sqlserver','ODBC Driver 18 for SQL Server'),true);
 assert.equal(api.matchesDriver('azure-sql','SQL Server Native Client 11.0'),true);
 assert.equal(api.matchesDriver('oracle','Oracle in OraClient19Home1'),true);
});

test('database transport catalog is usable in the browser without Node integration',()=>{
 const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'outside-only'});
 try{
  dom.window.eval(fs.readFileSync(path.join(__dirname,'../gui/database-provider-types.js'),'utf8'));
  const api=dom.window.DatabaseProviderTypes;assert.ok(api);
  for(const server of servers){assert.equal(api.label(server.id),server.name);assert.equal(api.transport(server.id),'odbc');assert.equal(api.matchesDriver(server.id,server.driver),true);}
 }finally{dom.window.close();}
});

test('parallel database capability discovery shares one ODBC enumeration and retains distinct provider filters',async()=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');let inspections=0;
 const raw={drivers:servers.map(server=>server.driver),dataSources:servers.map(server=>({name:server.name+' Reports',type:'User',driver:server.driver}))};
 const registry=createProviderRegistry({platform:'win32',inspectWindowsProviders:async type=>{assert.equal(type,'odbc');inspections++;await new Promise(resolve=>setTimeout(resolve,10));return raw;}});
 const ids=['odbc',...servers.map(server=>server.id)],statuses=await Promise.all(ids.map(id=>registry.detect(id)));
 assert.equal(inspections,1,'each database choice must share the same pending driver enumeration');
 assert.equal(statuses[0].drivers.length,servers.length);
 for(let index=0;index<servers.length;index++){assert.deepEqual(statuses[index+1].drivers,[servers[index].driver]);assert.deepEqual(statuses[index+1].dataSources.map(source=>source.name),[servers[index].name+' Reports']);}
 await registry.detect('odbc');assert.equal(inspections,1,'recent discovery should be reused');
 assert.equal(raw.drivers.length,servers.length,'filtering cannot narrow the shared raw inventory');
});

test('specific server connectors validate File DSN driver and section before calling Windows',async()=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');
 for(const server of servers){
  let file='[ODBC]\r\nDRIVER={'+server.driver+'}\r\n',reads=0;
  const registry=createProviderRegistry({platform:'win32',inspectWindowsProviders:async()=>({drivers:[server.driver],dataSources:[]}),readFile:async()=>Buffer.from(file),readWindowsDatabase:async()=>{reads++;return [{name:'Orders',columns:['id'],rows:[{id:'001'}]}];}});
  const handle=await registry.open(server.id,{fileDsn:'C:/fixture.dsn'});await handle.dispose();assert.equal(reads,1);
  for(const wrong of ['[ODBC]\nDRIVER=SQL Server\n','[OTHER]\nDRIVER='+server.driver+'\n','[ODBC]\n']){file=wrong;await assert.rejects(registry.open(server.id,{fileDsn:'C:/fixture.dsn'}),/matching.*driver/i);}
  assert.equal(reads,1,'wrong file DSNs never reach Windows');
 }
});

test('ODBC discovery stays shared while a slow Windows enumeration is pending',async()=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');const originalNow=Date.now;let time=0,calls=0,complete;
 try{Date.now=()=>time;const registry=createProviderRegistry({platform:'win32',inspectWindowsProviders:()=>{calls++;return new Promise(resolve=>complete=resolve);}});
 const first=registry.detect('mysql');await Promise.resolve();time=6000;const second=registry.detect('mariadb');await Promise.resolve();assert.equal(calls,1);complete({drivers:['MySQL ODBC 8.4 Unicode Driver','MariaDB ODBC 3.2 Driver'],dataSources:[]});assert.equal((await first).available,true);assert.equal((await second).available,true);
 }finally{Date.now=originalNow;}
});

test('a changed File DSN is validated again before refreshing server data',async()=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');let file='[ODBC]\nDRIVER=MySQL ODBC 8.4 Unicode Driver',reads=0;
 const registry=createProviderRegistry({platform:'win32',inspectWindowsProviders:async()=>({drivers:['MySQL ODBC 8.4 Unicode Driver'],dataSources:[]}),readFile:async()=>Buffer.from(file),readWindowsDatabase:async()=>{reads++;return [{name:'Orders',columns:['id'],rows:[{id:'001'}]}];}});
 const handle=await registry.open('mysql',{fileDsn:'C:/fixture.dsn'});file='[ODBC]\nDRIVER=SQL Server';await assert.rejects(handle.refresh({}),/matching.*driver/i);assert.equal(reads,1);assert.equal((await handle.read({})).rows[0].id,'001');await handle.dispose();
});

for(const server of servers){
 test(server.name+' driver matching accepts its registered names and excludes other database drivers',()=>{
  const api=types();assert.equal(api.label(server.id),server.name);
  for(const name of [server.driver,...server.aliases])assert.equal(api.matchesDriver(server.id,name),true,name);
  for(const other of servers.filter(other=>other.id!==server.id))assert.equal(api.matchesDriver(server.id,other.driver),false,other.driver+' is not '+server.name);
  for(const name of ['',null,undefined,'ODBC Driver 18 for SQL Server','Oracle in OraClient19Home1','Microsoft Access Driver (*.mdb, *.accdb)','InterBase driver','Unknown database driver'])assert.equal(api.matchesDriver(server.id,name),false,String(name));
 });

 test(server.name+' provider discovers matching DSNs and reads and refreshes the same selected table',async()=>{
  const {createProviderRegistry}=require('../lib/database/provider-registry');let calls=0;
  const dsn=server.name+' Reports';
  const registry=createProviderRegistry({platform:'win32',inspectWindowsProviders:async type=>{
   assert.equal(type,'odbc');
   return {drivers:[server.driver,'Microsoft Access Text Driver (*.txt, *.csv)'],dataSources:[{name:dsn,type:'User',driver:server.driver},{name:'CSV source',type:'System',driver:'Microsoft Access Text Driver (*.txt, *.csv)'}]};
  },readWindowsDatabase:async(type,config)=>{assert.equal(type,'odbc');assert.equal(config.dsn,dsn);return [{name:'Orders',columns:['id'],rows:[{id:String(++calls)}]}];}});
  const status=await registry.detect(server.id);assert.equal(status.available,true);assert.deepEqual(status.drivers,[server.driver]);assert.deepEqual(status.dataSources.map(source=>source.name),[dsn]);
  const handle=await registry.open(server.id,{dsn});
  const schema=await handle.schema();assert.equal(schema[0].name,'Orders');
  const selection={selection:{tableId:schema[0].id}};
  assert.equal((await handle.read(selection)).rows[0].id,'1');
  assert.equal((await handle.refresh(selection)).rows[0].id,'2');
  await handle.dispose();await assert.rejects(handle.read(selection),/closed/i);
 });

 test(server.name+' provider rejects unavailable drivers and a DSN belonging to another DBMS',async()=>{
  const {createProviderRegistry}=require('../lib/database/provider-registry');let reads=0;
  const missing=createProviderRegistry({platform:'win32',inspectWindowsProviders:async()=>({drivers:['Microsoft Access Text Driver (*.txt, *.csv)'],dataSources:[]}),readWindowsDatabase:async()=>{reads++;return [];}});
  assert.equal((await missing.detect(server.id)).available,false);
  await assert.rejects(missing.open(server.id,{dsn:'CSV'}));
  const registry=createProviderRegistry({platform:'win32',inspectWindowsProviders:async()=>({drivers:[server.driver],dataSources:[{name:'CSV',driver:'Microsoft Access Text Driver (*.txt, *.csv)'}]}),readWindowsDatabase:async()=>{reads++;return [];}});
  await assert.rejects(registry.open(server.id,{dsn:'CSV'}),/DSN|data source/i);
  assert.equal(reads,0,'an unrecognized DSN must never reach the driver');
 });

 test(server.name+' DSN form uses its own label and omits secrets from the saved document settings',()=>{
  const {mount}=require('../gui/database-native-flow');const dom=new JSDOM('<main></main>'),document=dom.window.document;
  try{
   const dsn=server.name+' Reports',flow=mount(document.querySelector('main'),{typeId:server.id,availability:{dataSources:[{name:dsn,type:'User'}]}});
   assert.equal(document.querySelector('h2').textContent,server.name);assert.equal(flow.isValid(),false);
   const select=document.querySelector('[name=dsn]');assert.ok(select);select.value=dsn;select.dispatchEvent(new dom.window.Event('change'));
   document.querySelector('[name=password]').value='not-for-document';assert.equal(flow.isValid(),true);
   assert.equal(flow.readConfig().password,'not-for-document');assert.equal(flow.publicConfig().password,undefined);assert.equal(flow.publicConfig().requiresPassword,true);
  }finally{dom.window.close();}
 });
}
