'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {EventEmitter}=require('node:events');

test('retired Excel Online source is excluded from catalog and icons',()=>{
 const {getDatabaseTypes,getDatabaseType}=require('../lib/database/catalog');
 const {getRetiredDatabaseTypeMessage}=require('../lib/database/retired-types');
 const types=getDatabaseTypes();
 assert.equal(types.length,22);
 assert.equal(types.some(type=>type.id==='online'||type.name==='Excel Online'),false);
 assert.equal(getDatabaseType('online'),undefined);
 assert.match(getRetiredDatabaseTypeMessage('online'),/no longer supported/i);
 const window={};vm.runInNewContext(fs.readFileSync(require.resolve('../gui/database-type-icons'),'utf8'),{window});
 assert.equal(Object.hasOwn(window.DatabaseTypeIcons.files,'online'),false);
});

test('retired Excel Online cannot be detected or opened as a database provider',async()=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');
 const registry=createProviderRegistry();
 const status=await registry.detect('online');
 assert.equal(status.available,false);
 assert.match(status.reason,/Excel Online is no longer supported/i);
 await assert.rejects(registry.open('online',{itemId:'old-book'}),/Excel Online is no longer supported/i);
});

test('legacy Excel Online sessions fail clearly without opening a provider',async()=>{
 const {createProviderRegistry}=require('../lib/database/provider-registry');
 const {createProviderSessions}=require('../lib/database/provider-sessions');
 const sessions=createProviderSessions({registry:createProviderRegistry()});
 const result=await sessions.open(new EventEmitter(),{sessionId:'legacy-online',generation:1,typeId:'online',config:{itemId:'old-book'}});
 assert.equal(result.error.code,'PROVIDER_UNAVAILABLE');
 assert.match(result.error.message,/Excel Online is no longer supported/i);
});

test('Excel Online sign-in IPC is removed and legacy open requests are rejected',async()=>{
 const {registerDatabaseIpc}=require('../gui/database-ipc');
 const handlers=new Map(),owner=new EventEmitter();owner.isDestroyed=()=>false;
 registerDatabaseIpc({ipcMain:{handle:(name,handler)=>handlers.set(name,handler)},dialog:{}});
 assert.equal(handlers.has('database-online'),false);
 const result=await handlers.get('database-open')({sender:owner},{sessionId:'legacy-online',generation:1,typeId:'online',config:{itemId:'old-book'}});
 assert.equal(result.error.code,'PROVIDER_UNAVAILABLE');
 assert.match(result.error.message,/Excel Online is no longer supported/i);
 const refreshed=await handlers.get('database-refresh')({sender:owner},{sessionId:'legacy-online',generation:2,typeId:'online',config:{itemId:'old-book'}});
 assert.equal(refreshed.error.code,'PROVIDER_UNAVAILABLE');
 assert.match(refreshed.error.message,/Excel Online is no longer supported/i);
});

test('preload no longer exposes a Microsoft online sign-in bridge',()=>{
 let api;
 const context={
  contextBridge:{exposeInMainWorld:(_name,value)=>{api=value;}},
  ipcRenderer:{sendSync:()=>true,invoke:async()=>({ok:true})}
 };
 vm.runInNewContext(fs.readFileSync(require.resolve('../gui/preload'),'utf8'),{require:()=>context});
 assert.equal(Object.hasOwn(api.database,'online'),false);
 assert.equal(typeof api.database.open,'function');
});
