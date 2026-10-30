'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {buildNativePackage}=require('../lib/btw-native-package-builder');
const source=Buffer.from('builder contract fixture');
const metadata={width_mm:50,height_mm:25,label_shape:'rectangle',page:{width_mm:50,height_mm:25,rows:1,columns:1},fonts:[],print_order:'rows',native_document:{evidence:['contract-original-document']}};
const verification={complete:true,method:'native-editable-object-package',evidence:['contract fixture only']};
const box='<Box Name="Original Box" Width="10 mm" Height="5 mm" Position.X="2 mm" Position.Y="3 mm" ReferencePoint="TopLeft" ConditionalPrintType="Always" Thickness="0.2 mm"><Color RGB="00000000"/><FillStyle Mode="None"/></Box>';
const envelope=(payload,count=1)=>`<NativeObjects Units="mm" Count="${count}"><Object Index="0" Name="Original Box" Type="btObjectBox">${payload}</Object></NativeObjects>`;
test('assembles a package only from a complete mapped native envelope and explicit document proof',()=>{
 const r=buildNativePackage(source,envelope(box),{documentMetadata:metadata,verification});
 assert.equal(r.complete,true);assert.equal(r.package.nativeObjectCount,1);assert.equal(r.package.elements[0].native_object.name,'Original Box');assert.deepEqual(r.package.sourceDefinitions,{});assert.deepEqual(r.package.page,metadata.page);assert.deepEqual(r.package.native_document,metadata.native_document);assert.equal(r.package.print_order,'rows');
});
test('retains incomplete candidates but never emits a package from unresolved or failed exports',()=>{
 for(const payload of [box.replace(' Thickness="0.2 mm"',''),box+'<ExportError Stage="picture" Message="Failed"/>']){
  const r=buildNativePackage(source,envelope(payload),{documentMetadata:metadata,verification});assert.equal(r.complete,false);assert.equal(r.package,null);assert.ok(r.diagnostics.length);
 }
});
test('metadata and count flags cannot override candidate completeness and missing verification',()=>{
 assert.throws(()=>buildNativePackage(source,envelope(box),{documentMetadata:{...metadata,elements:[],nativeObjectCount:0,complete:true}}),/verification/i);
 const r=buildNativePackage(source,envelope(box),{documentMetadata:{...metadata,elements:[],nativeObjectCount:0},verification});assert.equal(r.package.elements.length,1);assert.equal(r.package.nativeObjectCount,1);
 assert.throws(()=>buildNativePackage(source,envelope(box,2),{documentMetadata:metadata,verification}),/count/i);
});
test('retains the explicit original form inventory in package metadata',()=>{
 const native_forms={enabled:false,promptingEnabled:false,controls:[],behaviorComplete:false};
 const r=buildNativePackage(source,envelope(box),{documentMetadata:{...metadata,native_forms},verification});
 assert.deepEqual(r.package.native_forms,native_forms);
});
test('A4A package builder binds the native DataMatrix layout profile to the source hash and keeps all four objects separate',()=>{
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),fixture=path.join(__dirname,'fixtures/native-a4a');
 const source=fs.readFileSync(path.join(fixture,'A4A Label.btw')),sha=crypto.createHash('sha256').update(source).digest('hex');
 const objects=fs.readFileSync(path.join(fixture,'objects.xml'),'utf8'),nativeDataMatrixLayouts={'Barcode 1':JSON.parse(fs.readFileSync(path.join(fixture,'datamatrix.json'),'utf8'))};
 const metrics={kind:'native-text-metrics',font_name:'Arial',font_size_pt:12,width_mm:23.5458,height_mm:4.7498,line_height_mm:4.7498,em_height:2048,cell_ascent:1854,font_sha256:'b3658eadae55e682b5f69eb64c439c1ecc8f196c0bb8d4756d145d13bc86476a',evidence:['D:/QLabelNativeLibraryAudit-20261023/text-barcode-followup/native-text-emf-results.txt']};
 const conversionOptions={nativeTextMetrics:{'Text 1':metrics,'Text 2':{...metrics,width_mm:28.321},'Text 3':{...metrics,width_mm:7.2898}},nativeDataMatrixLayouts};
 const result=buildNativePackage(source,objects,{conversionOptions,documentMetadata:metadata,verification});
 assert.deepEqual(result.conversion.elements.map(e=>e.native_object.name),['Text 1','Text 2','Barcode 1','Text 3']);
 assert.equal(result.conversion.elements[2].width_mm,15.8242);assert.equal(result.conversion.elements[2].height_mm,15.8242);
 assert.ok(!result.diagnostics.some(d=>d.code==='NATIVE_PACKAGE_OBJECT_COVERAGE'));
 assert.equal(result.complete,true,JSON.stringify(result.diagnostics));assert.equal(result.package.nativeObjectCount,4);assert.equal(result.package.source.sha256,sha);
});
