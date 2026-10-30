'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadVerifiedNativePackage,validateNativePackage}=require('../lib/btw-native-package');
const fixture=path.join(__dirname,'fixtures/native-a4a');

test('A4A native library package admits four individually editable objects for the exact BTW source',()=>{
 const source=fs.readFileSync(path.join(fixture,'A4A Label.btw'));
 const sha=crypto.createHash('sha256').update(source).digest('hex');
 const result=loadVerifiedNativePackage(source);
 assert.ok(result,'A4A package is bundled for the selected library template');
 assert.equal(result.source.sha256,sha);
 assert.deepEqual(result.elements.map(item=>[item.native_object.name,item.type]),[
  ['Text 1','text'],['Text 2','text'],['Barcode 1','image'],['Text 3','text']
 ]);
 assert.deepEqual(result.elements.map(item=>item.dataSourceRefs.length),[2,2,8,1]);
 assert.equal(result.elements[2].barcode_spec.bcid,'datamatrix');
 assert.equal(result.elements[2].barcode_spec.native_datamatrix.text,JSON.parse(fs.readFileSync(path.join(fixture,'datamatrix.json'),'utf8')).text);
 assert.equal(result.width_mm,76.2);assert.equal(result.height_mm,25.4);
 assert.deepEqual([result.page.columns,result.page.rows],[2,10]);
 assert.deepEqual([result.label_shape,result.corner_radius_mm],['rounded',3.175]);
 assert.deepEqual([result.native_forms.enabled,result.native_forms.original_enabled,result.native_forms.excluded],[false,true,true]);
 assert.equal(result.verification.scope,'editable-objects-without-native-data-entry-form');
 const resolver=require('../gui/source-resolver'),barcodeId=result.elements[2].id,cageId=result.elements[0].dataSourceRefs[1];
 const before=resolver.evaluateDocument(result);assert.equal(before.objects[barcodeId].text,JSON.parse(fs.readFileSync(path.join(fixture,'datamatrix.json'),'utf8')).text);
 const edited=structuredClone(result);edited.sourceDefinitions[cageId].config.value='EDITED-CAGE';
 const after=resolver.evaluateDocument(edited);assert.equal(after.objects[edited.elements[0].id].text,'MFR EDITED-CAGE');
 assert.ok(after.objects[barcodeId].text.includes('MFREDITED-CAGE'),'one source edit updates the original barcode source string');
});

test('A4A package refuses a different source hash and keeps native prompt form excluded',()=>{
 const source=fs.readFileSync(path.join(fixture,'A4A Label.btw'));
 const sha=crypto.createHash('sha256').update(source).digest('hex');
 const value=loadVerifiedNativePackage(source);assert.ok(value);
 assert.throws(()=>validateNativePackage(value,'0'.repeat(64)),/SHA-256 mismatch/i);
 assert.deepEqual(value.native_forms.controls,[{name:'Text Input Box 1',value:'1U2R7'},{name:'Text Input Box 2',value:'MH80312'}]);
 assert.equal(value.native_forms.behaviorComplete,false);
 assert.match(value.native_forms.nativeXml,/Text Input Box 1/);
});
