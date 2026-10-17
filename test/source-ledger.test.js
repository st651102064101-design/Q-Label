'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {createStore}=require('../lib/source-serialization');
test('serial reservations persist, never overlap, and preview does not consume state',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-serial-')),file=path.join(dir,'ledger.json'),config={id:'serial',start:100,step:1,count:3};
  try{const store=createStore(file);assert.deepEqual(await store.peek('document',[config]),{serial:100});await assert.rejects(fs.access(file));
    const [a,b]=await Promise.all([store.reserve('document','job-a',[config]),store.reserve('document','job-b',[config])]);
    assert.equal(new Set([a.values.serial,b.values.serial]).size,2);assert.deepEqual([a.values.serial,b.values.serial].sort((x,y)=>x-y),[100,103]);
    assert.deepEqual((await store.reserve('document','job-a',[config])).values,a.values);
    await store.markAccepted('job-a');await store.markUnknown('job-b');assert.equal((await createStore(file).peek('document',[config])).serial,106);
    assert.equal((await store.getJob('job-b')).status,'unknown');
    const before=await fs.readFile(file,'utf8');await store.peek('document',[config]);assert.equal(await fs.readFile(file,'utf8'),before);
  }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
test('definitely-unsent latest reservation can release values while uncertain jobs cannot reuse them',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-serial-')),file=path.join(dir,'ledger.json');
  try{const store=createStore(file),config=[{id:'s',start:1,step:2,count:2}];await store.reserve('doc','bad',config);await store.markFailed('bad',{definitelyNotSent:true});assert.equal((await store.peek('doc',config)).s,1);
    await store.reserve('doc','unknown',config);await store.markUnknown('unknown');assert.equal((await store.peek('doc',config)).s,5);
  }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});

test('rollback preserves accepted counter state for every valid source identity including __proto__',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-ledger-id-'));try{
    const store=createStore(path.join(dir,'ledger.json')),config=[{id:'__proto__',start:1,step:1,count:1}];await store.reserve('doc','accepted',config);await store.markAccepted('accepted');assert.equal((await store.peek('doc',config))['__proto__'],2);await store.reserve('doc','unsent',config);await store.markFailed('unsent',{definitelyNotSent:true});assert.equal((await store.peek('doc',config))['__proto__'],2);
  }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
