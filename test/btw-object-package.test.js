'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readNativeObjectExport}=require('../lib/btw-object-package');
const sample='<NativeObjects Units="mm" Count="1"><Object Index="0" Name="Text 1" Type="btObjectText"><Text Name="Text 1"/><DataSources><EmbeddedDataSource ID="x"><Value>Hello</Value></EmbeddedDataSource></DataSources></Object></NativeObjects>';
test('native collection count refers to wrapper objects rather than source containers',()=>{
 const p=readNativeObjectExport(sample);assert.equal(p.objects.length,1);assert.equal(p.nativeObjectCount,1);
 assert.match(p.objects[0].xml,/<DataSources>/);assert.equal(p.objects[0].name,'Text 1');assert.equal(p.reconstructionComplete,false);
});
test('truncated enumeration and duplicated object indices are rejected',()=>{
 assert.throws(()=>readNativeObjectExport(sample.replace('Count="1"','Count="2"')),/count/i);
 const body=sample.match(/<Object .*<\/Object>/)[0];
 assert.throws(()=>readNativeObjectExport('<NativeObjects Units="mm" Count="2">'+body+body+'</NativeObjects>'),/index/i);
});
test('native per-object export errors remain attached to their object identity',()=>{
 const p=readNativeObjectExport('<NativeObjects Units="mm" Count="1"><Object Index="0" Name="Picture 1" Type="btObjectPicture"><Picture Name="Picture 1"/><ExportError Stage="picture" Message="Unsupported"/></Object></NativeObjects>');
 assert.equal(p.objects.length,1);assert.deepEqual(p.objects[0].exportErrors,[{stage:'picture',message:'Unsupported'}]);assert.doesNotMatch(p.objects[0].xml,/ExportError/);
});
test('unsafe XML and unverified units are rejected',()=>{
 assert.throws(()=>readNativeObjectExport('<!DOCTYPE foo>'+sample),/DTD/i);
 assert.throws(()=>readNativeObjectExport(sample.replace('Units="mm"','Units="in"')),/units/i);
});
test('corpus audit detects a native object whose GetXML omits its payload',t=>{
 const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-native-package-'));
 t.after(()=>{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(root,{recursive:true,force:true});});
 fs.writeFileSync(path.join(root,'inventory.json'),JSON.stringify({records:[{source:'fixture.btw',sha256:'fixture',directory:root,nativeObjectCount:1,status:'exported'}]}));
 fs.writeFileSync(path.join(root,'objects.xml'),'<NativeObjects Units="mm" Count="1"><Object Index="0" Name="RFID 1" Type="btObjectRFID"/></NativeObjects>');
 fs.writeFileSync(path.join(root,'format.xml'),'<Format/>');fs.writeFileSync(path.join(root,'prompt.xml'),'');
 const result=require('../scripts/audit-native-library').audit(root);
 assert.equal(result.nativeObjects,1);assert.equal(result.complete,false);assert.equal(result.diagnostics.NATIVE_EXPORT_OBJECT_COVERAGE,1);
 const report=JSON.parse(fs.readFileSync(path.join(root,'conversion-audit.json'),'utf8'));
 assert.equal(report.templates[0].assets[0].sha256.length,64);assert.equal(report.templates[0].decodedObjectCount,0);
});

test('retains quoted native boolean attributes as valid object XML',()=>{
 const p=readNativeObjectExport('<NativeObjects Units="mm" Count="1"><Object Index="0" Name="Text 1" Type="btObjectText"><Text Name="Text 1" Enabled="true" Hidden="false"/></Object></NativeObjects>');
 assert.match(p.objects[0].xml,/Enabled="true"/);assert.match(p.objects[0].xml,/Hidden="false"/);
 assert.equal(require('fast-xml-parser').XMLValidator.validate(p.objects[0].xml),true);
});

test('corpus audit retains full original source definitions as a hashed conversion asset',t=>{
 const fs=require('node:fs'),path=require('node:path'),os=require('node:os');const root=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-full-sources-'));
 t.after(()=>{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(root,{recursive:true,force:true});});
 fs.writeFileSync(path.join(root,'inventory.json'),JSON.stringify({records:[{source:'fixture.btw',sha256:'fixture',directory:root,nativeObjectCount:1,status:'exported'}]}));
 fs.writeFileSync(path.join(root,'objects.xml'),sample);fs.writeFileSync(path.join(root,'format.xml'),'<Response><Command><GetFormatProperties/></Command></Response>');fs.writeFileSync(path.join(root,'prompt.xml'),'');
 fs.writeFileSync(path.join(root,'data-sources.xml'),'<Response><Command><GetDataSources><DataSource ID="x"><EmbeddedDataSource ID="x"><Value>Hello</Value></EmbeddedDataSource></DataSource></GetDataSources></Command></Response>');
 require('../scripts/audit-native-library').audit(root);const record=JSON.parse(fs.readFileSync(path.join(root,'conversion-audit.json'),'utf8')).templates[0];
 assert.equal(record.nativeSourceDefinitions.sources[0].id,'x');assert.ok(record.assets.some(a=>a.file==='data-sources.xml'&&a.sha256.length===64));assert.equal(record.complete,false);
});

test('corpus audit exposes connected original source definitions and refs for candidate elements',t=>{
 const fs=require('node:fs'),path=require('node:path'),os=require('node:os');const root=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-connected-sources-'));
 t.after(()=>{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(root,{recursive:true,force:true});});
 fs.writeFileSync(path.join(root,'inventory.json'),JSON.stringify({records:[{source:'fixture.btw',sha256:'fixture',directory:root,nativeObjectCount:1,status:'exported'}]}));
 const object='<Text Name="Text 1" Width="20 mm" Height="5 mm" Position.X="0 mm" Position.Y="0 mm" ConditionalPrintType="Always"><DataSources><EmbeddedDataSource ID="s"><Value>00123</Value></EmbeddedDataSource></DataSources></Text>';
 fs.writeFileSync(path.join(root,'objects.xml'),'<NativeObjects Units="mm" Count="1"><Object Index="0" Name="Text 1" Type="btObjectText">'+object+'</Object></NativeObjects>');fs.writeFileSync(path.join(root,'format.xml'),'<Response><Command><GetFormatProperties/></Command></Response>');fs.writeFileSync(path.join(root,'prompt.xml'),'');
 require('../scripts/audit-native-library').audit(root);const record=JSON.parse(fs.readFileSync(path.join(root,'conversion-audit.json'),'utf8')).templates[0];
 assert.equal(record.sourceDefinitions.s.config.value,'00123');assert.deepEqual(record.candidateElements[0].dataSourceRefs,['s']);assert.equal(record.complete,false);
});
