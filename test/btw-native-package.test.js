'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {loadVerifiedNativePackage,validateNativePackage}=require('../lib/btw-native-package');
const {fixture,source,sha}=require('./fixtures/native-package-contract');
test('loads only a matching bundled BTW digest and preserves source definitions and original objects',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'native-package-'));try{
  const value=fixture();fs.writeFileSync(path.join(directory,sha+'.json'),JSON.stringify(value));
  assert.deepEqual(loadVerifiedNativePackage(source,{directory}),value);
  assert.equal(loadVerifiedNativePackage(Buffer.from('different source'),{directory}),null);
  const result=loadVerifiedNativePackage(source,{directory});result.sourceDefinitions.named.config.value='changed';
  assert.equal(loadVerifiedNativePackage(source,{directory}).sourceDefinitions.named.config.value,'PN-123');
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('never promotes an incomplete candidate through counts or verification flags',()=>{
 for(const change of [p=>p.complete=false,p=>p.verification.complete=false,p=>p.verification.evidence=[],p=>p.diagnostics=[{severity:'error',code:'NATIVE_TEXT_BOUNDS_UNVERIFIED'}],p=>p.source.sha256='0'.repeat(64),p=>p.nativeObjectCount=1,p=>delete p.elements[0].native_object,p=>p.elements[0].source_format='btw-preview']){
  const p=fixture();change(p);assert.throws(()=>validateNativePackage(p,sha),/native package/i);
 }
});
test('cannot admit original enabled forms through verification flags or a prompt value inventory',()=>{
 for(const change of [p=>p.native_forms={enabled:true,behaviorComplete:true,controls:[]},p=>p.native_document={formatProperties:{Forms:{'@Enabled':'true'}}}]){
  const p=fixture();change(p);assert.throws(()=>validateNativePackage(p,sha),/native.*form/i);
 }
});
test('admits only an explicit editable-object scope that excludes an originally enabled data entry form',()=>{
 const p=fixture();p.verification.scope='editable-objects-without-native-data-entry-form';p.native_forms={enabled:false,original_enabled:true,excluded:true,promptingEnabled:true,controls:[],behaviorComplete:false};p.native_document={formatProperties:{Forms:{'@Enabled':'true'}}};
 assert.deepEqual(validateNativePackage(p,sha),p);
 for(const change of [value=>delete value.verification.scope,value=>value.native_forms.excluded=false,value=>value.native_forms.enabled=true]){const invalid=structuredClone(p);change(invalid);assert.throws(()=>validateNativePackage(invalid,sha),/native.*form/i);}
});
test('rejects broken source references, duplicate IDs, nonfinite geometry and invalid page bounds',()=>{
 for(const change of [p=>p.elements[0].dataSourceRefs=['missing'],p=>p.elements[0].hriSourceRefs=['missing'],p=>p.elements[1].id=p.elements[0].id,p=>p.sourceDefinitions.named.id='wrong',p=>p.elements[0].x_mm=NaN,p=>p.page.width_mm=0,p=>p.elements[0].native_object.xml='',p=>p.label_shape='rounded',p=>p.elements[0].text='unsynchronized snapshot',p=>p.sourceDefinitions.named={id:'named',kind:'object',config:{objectId:'missing'}}]){
  const p=fixture();change(p);assert.throws(()=>validateNativePackage(p,sha),/native package/i);
 }
});
test('validates active pages and side designs without losing named overrides',()=>{
 const p=fixture();p.design_active='front';p.designs={front:{elements:structuredClone(p.elements)},back:{elements:[{...structuredClone(p.elements[1]),id:'back-box',native_object:{...p.elements[1].native_object,id:'back-box'}}]}};p.nativeObjectCount=3;
 p.sourceDefinitions.named.description='Original named override';
 assert.deepEqual(validateNativePackage(p,sha),p);
 p.designs.back.elements[0].dataSourceRefs=['unknown'];assert.throws(()=>validateNativePackage(p,sha),/native package/i);
});
test('rejects missing original picture pixels and barcode definitions instead of admitting blank objects',()=>{
 for(const image of [{type:'image'},{type:'image',color_image_data:'file:///outside.png'},{type:'image',barcode_spec:{}},{type:'image',barcode_spec:{bcid:'unknown-symbol'}},{type:'image',barcode_spec:{bcid:'code128'}},{type:'image',color_image_data:'data:image/png;base64,AA==',source_picture:{encoding:'base64'}},{type:'image',color_image_data:'data:image/png;base64,AA==',source_picture:{encoding:'path'},dataSourceRefs:['named']}]){
  const p=fixture();Object.assign(p.elements[1],image);p.elements[1].native_object.type=image.barcode_spec?'BarCode-Code-128':'Picture';
  assert.throws(()=>validateNativePackage(p,sha),/native package/i);
 }
 const p=fixture();Object.assign(p.elements[1],{type:'image',color_image_data:'data:image/png;base64,AA=='});p.elements[1].native_object.type='Picture';assert.ok(validateNativePackage(p,sha));
});
module.exports={fixture,source,sha};
