'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function fixture(open){
 const {createProviderSessions}=require('../lib/database/provider-sessions');
 const owner=new EventEmitter();owner.isDestroyed=()=>false;
 const resource={schema:async()=>[{name:'Records',columns:['id']}],read:async()=>({rows:[{id:'1'}],columns:['id']}),refresh:async()=>({rows:[{id:'2'}],columns:['id']}),dispose:async()=>{resource.closed=(resource.closed||0)+1;}};
 const registry={detect:async id=>({available:id==='text',capabilities:['schema','read','refresh']}),open:open|| (async()=>resource)};
 return {owner,resource,sessions:createProviderSessions({registry})};
}
const request=(generation=1)=>({sessionId:'fixture-session',generation,typeId:'text',config:{}});
test('provider sessions deliver real results only to their owner and dispose once',async()=>{
 const {owner,resource,sessions}=fixture();
 assert.equal((await sessions.open(owner,request())).ok,true);
 assert.deepEqual((await sessions.schema(owner,request())).data,[{name:'Records',columns:['id']}]);
 assert.deepEqual((await sessions.read(owner,request())).data.rows,[{id:'1'}]);
 assert.deepEqual((await sessions.refresh(owner,request(2))).data.rows,[{id:'2'}]);
 const foreign=new EventEmitter();
 assert.equal((await sessions.read(foreign,request(2))).error.code,'SESSION_NOT_FOUND');
 assert.equal((await sessions.dispose(foreign,request(2))).error.code,'SESSION_NOT_FOUND');
 assert.equal(resource.closed,undefined);
 await sessions.dispose(owner,request(2));await sessions.dispose(owner,request(2));assert.equal(resource.closed,1);
 assert.equal(owner.listenerCount('destroyed'),0);
});
test('closing owner during open aborts work and disposes a late resource',async()=>{
 const wait=deferred();let signal;
 const f=fixture(async(_type,_config,context)=>{signal=context.signal;return wait.promise;});
 const opening=f.sessions.open(f.owner,request());await Promise.resolve();await Promise.resolve();
 f.owner.emit('destroyed');wait.resolve(f.resource);
 assert.equal((await opening).error.code,'CANCELLED');assert.equal(signal.aborted,true);assert.equal(f.resource.closed,1);
 assert.equal((await f.sessions.read(f.owner,request())).error.code,'SESSION_NOT_FOUND');
});
test('new generations cancel pending operations and suppress superseded results',async()=>{
 const f=fixture(),slow=deferred();let readSignal;
 f.resource.read=async(_request,context)=>{readSignal=context.signal;return slow.promise;};
 await f.sessions.open(f.owner,request());
 const reading=f.sessions.read(f.owner,request());await Promise.resolve();
 const refreshing=f.sessions.refresh(f.owner,request(2));
 assert.equal((await refreshing).ok,true);assert.equal(readSignal.aborted,true);
 slow.resolve({rows:[{id:'old'}]});assert.equal((await reading).error.code,'CANCELLED');
 assert.equal((await f.sessions.read(f.owner,request(1))).error.code,'STALE_REQUEST');
 await f.sessions.dispose(f.owner,request(2));
});
test('duplicate IDs cannot replace a live connection and input is validated before provider access',async()=>{
 const f=fixture();await f.sessions.open(f.owner,request());
 assert.equal((await f.sessions.open(f.owner,request(2))).error.code,'SESSION_EXISTS');
 for(const bad of [{},{sessionId:'a',generation:-1},{sessionId:'a',generation:1.5},{sessionId:'a',generation:1,typeId:'text',config:[]}])assert.equal((await f.sessions.open(f.owner,bad)).error.code,'INVALID_REQUEST');
 assert.equal((await f.sessions.open(f.owner,{...request(),sessionId:'other',typeId:'unknown'})).error.code,'PROVIDER_UNAVAILABLE');
 await f.sessions.dispose(f.owner,request());
});
test('untrusted provider errors cannot expose passwords or connection strings',async()=>{
 const f=fixture(async()=>{throw Error('Password=private;Token=secret;Data Source=C:/private/data');});
 const result=await f.sessions.open(f.owner,request());
 assert.equal(result.ok,false);assert.equal(result.error.code,'PROVIDER_ERROR');
 assert.doesNotMatch(JSON.stringify(result),/private|secret|Password|Token|Data Source/);
 assert.equal(f.owner.listenerCount('destroyed'),0);
});
