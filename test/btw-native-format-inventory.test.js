'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readNativeFormatInventory}=require('../lib/btw-native-format-inventory');
const wrap=x=>'<Response><Command><GetFormatProperties>'+x+'</GetFormatProperties></Command></Response>';
test('recovers ordered markup source fragments without inventing source definitions',()=>{
 const x=readNativeFormatInventory(wrap('<ObjectList><RichText ObjectName="HTML TEST Ingredients"><DataSourceList><DataSource Source="EmbeddedDataSource" Type="Text" Index="0"><Value>&lt;html&gt;&lt;head&gt;</Value></DataSource><DataSource Source="EmbeddedDataSource" Type="Number" Name="NDF_FONT_SIZE" Index="1"><Value>006</Value></DataSource></DataSourceList></RichText></ObjectList>'));
 assert.equal(x.objects.length,1);assert.equal(x.objects[0].sources[0].value,'<html><head>');assert.equal(x.objects[0].sources[1].value,'006');assert.equal(x.objects[0].sources[1].sharedName,'NDF_FONT_SIZE');assert.equal(x.behaviorComplete,false);
});
test('retains complete format, database and form metadata alongside named identities',()=>{
 const xml=wrap('<DatabaseSetup><RecordSet Name="CSV_DATA"/></DatabaseSetup><Forms><Form Name="Input"/></Forms><NamedDataSources><DataSource ID="{a}" Name="GTIN"><Value>00123</Value></DataSource></NamedDataSources><ObjectList/>');
 const x=readNativeFormatInventory(xml);assert.equal(x.nativeXml,xml);assert.equal(x.namedSources[0].id,'{a}');assert.equal(x.namedSources[0].value,'00123');assert.ok(x.formatProperties.DatabaseSetup);assert.ok(x.formatProperties.Forms);
});
test('native shared sources repeat their original index while preserving concatenation position',()=>{
 const s='<DataSource Source="EmbeddedDataSource" Type="Text" Name="DUNS" Index="0"><Value>754779911</Value></DataSource>';
 const x=readNativeFormatInventory(wrap('<ObjectList><Barcode ObjectName="Barcode 1"><DataSourceList>'+s+'<DataSource Source="EmbeddedDataSource" Type="Text" Index="1"><Value>GS</Value></DataSource>'+s+'</DataSourceList></Barcode></ObjectList>'));
 assert.deepEqual(x.objects[0].sources.map(s=>s.nativeIndex),[0,1,0]);assert.deepEqual(x.objects[0].sources.map(s=>s.index),[0,1,2]);
});
test('ambiguous object names, duplicate indices and native errors cannot pass inventory validation',()=>{
 assert.throws(()=>readNativeFormatInventory(wrap('<ObjectList><Text ObjectName="same"/><Text ObjectName="same"/></ObjectList>')),/Duplicate object/);
 assert.throws(()=>readNativeFormatInventory(wrap('<ObjectList><Text ObjectName="t"><DataSourceList><DataSource Index="0"><Value>A</Value></DataSource><DataSource Index="0"><Value>B</Value></DataSource></DataSourceList></Text></ObjectList>')),/index/i);
 assert.throws(()=>readNativeFormatInventory('<Response><Message Severity="Error">Missing format</Message></Response>'),/native error/i);
 assert.throws(()=>readNativeFormatInventory('<!DOCTYPE x>'+wrap('')),/DTD/);
});
