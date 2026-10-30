'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readNativeDataSources,buildNativeDataSourcesRequest}=require('../lib/btw-native-data-sources');
const xml='<Response><Command><GetDataSources><DataSource ID="{a}" Name="Header"><EmbeddedDataSource ID="{a}" Enabled="true"><Value>&lt;html&gt;</Value><Transforms><ScriptEventCode><OnAutoSelectedEvent Encoding="Base64">VmFsdWUgPSAiMCINCg==</OnAutoSelectedEvent></ScriptEventCode></Transforms></EmbeddedDataSource></DataSource><DataSource ID="{b}"><ScriptDataSource ID="{b}"><Expression>Value = 1</Expression></ScriptDataSource></DataSource></GetDataSources></Command></Response>';
test('retains original IDs, HTML and encoded lifecycle scripts without evaluating or guessing owners',()=>{
 const r=readNativeDataSources(xml);assert.equal(r.sources.length,2);assert.equal(r.sources[0].id,'{a}');assert.equal(r.sources[0].name,'Header');assert.equal(r.sources[0].definition.Value,'<html>');assert.equal(r.sources[0].definition['@Enabled'],'true');assert.match(r.sources[0].xml,/VmFsdWUgPSAiMCINCg==/);assert.equal(r.sources[1].nativeKind,'ScriptDataSource');assert.equal(r.behaviorComplete,false);assert.equal(r.nativeXml,xml);assert.equal(r.sources[0].owner,undefined);
});
test('rejects native errors, conflicting source identities and incomplete response envelopes',()=>{
 assert.throws(()=>readNativeDataSources(xml.replace('ID="{b}"','ID="{a}"')),/duplicate/i);
 assert.throws(()=>readNativeDataSources(xml.replace('<Response>','<Response><Message Severity="Error">No</Message>')),/native error/i);
 assert.throws(()=>readNativeDataSources('<Response/>'),/one.*GetDataSources/i);
 assert.throws(()=>readNativeDataSources(xml.replace('<EmbeddedDataSource ID="{a}"','<EmbeddedDataSource ID="{wrong}"')),/identity/i);
 assert.throws(()=>readNativeDataSources('<!DOCTYPE foo>'+xml),/DTD/i);
});
test('builds escaped read-only internal source export command with explicit Trusted boolean',()=>{
 const request=buildNativeDataSourcesRequest('D:/copy/a&b.btw');assert.match(request,/Trusted="true"/);assert.match(request,/<GetDataSources Type="All" Query="All">/);assert.match(request,/a&amp;b.btw/);assert.equal(require('fast-xml-parser').XMLValidator.validate(request),true);assert.doesNotMatch(request,/UpdateDataSource|Print|Save/);
});

test('native exporter writes the full source definition command and output asset',()=>{
 const script=require('node:fs').readFileSync(require('node:path').join(__dirname,'../scripts/export-bartender-objects.ps1'),'utf8');
 assert.ok(script.includes('Trusted=\\"true\\"'));assert.ok(script.includes('GetDataSources Type=\\"All\\" Query=\\"All\\"'));assert.ok(script.includes('"data-sources.xml"'));
});

test('links sources only by native shared identity or exact controlled marker at the same object position',()=>{
 const {linkNativeSourceOwners}=require('../lib/btw-native-data-sources');
 const definitions=readNativeDataSources(xml);
 const original={objects:[{name:'Rich Text 1',nativeType:'RichText',sources:[{index:0,nativeIndex:0,nativeKind:'EmbeddedDataSource',sharedName:'Header'},{index:1,nativeIndex:1,nativeKind:'ScriptDataSource',sharedName:null}]}]};
 const probe=structuredClone(original);probe.objects[0].sources[1].value='MARKER_B';
 const r=linkNativeSourceOwners(original,definitions,probe,[{id:'{b}',marker:'MARKER_B'}]);assert.equal(r.links.length,2);assert.equal(r.links[1].sourceId,'{b}');assert.equal(r.links[1].position,1);assert.equal(r.diagnostics.length,0);assert.equal(r.behaviorComplete,false);
 probe.objects[0].sources[1].value='same cached sample';const missing=linkNativeSourceOwners(original,definitions,probe,[{id:'{b}',marker:'MARKER_B'}]);assert.equal(missing.links.length,1);assert.equal(missing.diagnostics[0].code,'NATIVE_SOURCE_OWNER_UNRESOLVED');
 probe.objects[0].sources.pop();assert.throws(()=>linkNativeSourceOwners(original,definitions,probe,[]),/structure/i);
 assert.throws(()=>linkNativeSourceOwners(original,definitions,original,[{id:'{a}',marker:'M'},{id:'{b}',marker:'M'}]),/marker/i);
});


test('retains interleaved repeated transform order in standalone definition XML',()=>{
 const value='<Response><Command><GetDataSources><DataSource ID="x"><EmbeddedDataSource ID="x"><Transforms><A>first</A><B>second</B><A>third</A></Transforms><Value>v</Value></EmbeddedDataSource></DataSource></GetDataSources></Command></Response>';
 const source=readNativeDataSources(value).sources[0];assert.match(source.definitionXml,/<A>first<\/A><B>second<\/B><A>third<\/A>/);assert.match(source.xml,/<A>first<\/A><B>second<\/B><A>third<\/A>/);
});

test('assembles original ordered object source XML without snapshots and rejects missing ownership',()=>{
 const {assembleNativeObjectSources}=require('../lib/btw-native-data-sources');
 const defs=readNativeDataSources(xml);
 const object={name:'Text 1',sources:[{nativeIndex:0},{nativeIndex:1},{nativeIndex:0}]};
 const links=[{objectName:'Text 1',position:0,nativeIndex:0,sourceId:'{a}'},{objectName:'Text 1',position:1,nativeIndex:1,sourceId:'{b}'},{objectName:'Text 1',position:2,nativeIndex:0,sourceId:'{a}'}];
 const result=assembleNativeObjectSources(object,defs,links);
 assert.deepEqual(result.sourceIds,['{a}','{b}','{a}']);assert.equal((result.xml.match(/<EmbeddedDataSource/g)||[]).length,2);assert.match(result.xml,/VmFsdWUgPSAiMCINCg==/);
 assert.throws(()=>assembleNativeObjectSources(object,defs,links.slice(0,2)),/ownership/i);
 assert.throws(()=>assembleNativeObjectSources(object,defs,[...links,links[0]]),/ownership/i);
 assert.throws(()=>assembleNativeObjectSources(object,defs,links.map((l,i)=>i===1?{...l,nativeIndex:9}:l)),/index/i);
});
