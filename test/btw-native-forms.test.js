'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readNativePromptValues}=require('../lib/btw-native-forms');
const {readNativeDataEntryForms}=require('../lib/btw-native-forms');
const full=require('node:fs').readFileSync(require('node:path').join(__dirname,'fixtures/native-accessory-data-entry-forms.xml'),'utf8');
const {convertNativeDocument}=require('../lib/btw-native-document');
const {page,format,fonts}=require('./btw-native-document.test');
// Native Accessory Box IBtFormat.PromptValues, owned copied-document probe 2026-10-26.
const original='<Prompts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0" encoding="UTF-16"><Prompt Name="Text Input Box 1"><Value>Product Name</Value></Prompt><Prompt Name="Text Input Box 2"><Value>500346072995</Value></Prompt></Prompts>';
test('retains real native form control names, values and original XML without claiming layout parity',()=>{
 const r=readNativePromptValues(original);assert.deepEqual(r.controls,[{name:'Text Input Box 1',value:'Product Name'},{name:'Text Input Box 2',value:'500346072995'}]);assert.equal(r.nativeXml,original);assert.equal(r.behaviorComplete,false);
 assert.deepEqual(readNativePromptValues('<Prompts version="1.0"><Prompt Name="Empty"><Value/></Prompt></Prompts>').controls,[{name:'Empty',value:''}]);
});
test('accepts native-form XML with ordinary indentation and whitespace between controls',()=>{
 const xml='<Prompts version="1.0">\n  <Prompt Name="First"><Value>A</Value></Prompt>\n  <Prompt Name="Second"><Value>B</Value></Prompt>\n</Prompts>';
 assert.deepEqual(readNativePromptValues(xml).controls,[{name:'First',value:'A'},{name:'Second',value:'B'}]);
});
test('does not silently discard unknown, duplicate or malformed native form controls',()=>{
 for(const xml of [original.replace('Text Input Box 2','Text Input Box 1'),original.replace('<Value>Product Name</Value>','<Value>Product Name</Value><Binding ID="x"/>'),original.replace('Name="Text Input Box 1"','Name="Text Input Box 1" Type="Text"'),'<Prompts><Other/></Prompts>','<Prompts><Prompt><Value>x</Value></Prompt></Prompts>','<!DOCTYPE x [<!ENTITY a "x">]><Prompts/>','<Prompts>'])assert.throws(()=>readNativePromptValues(xml));
 assert.throws(()=>readNativePromptValues(''),/XML/);
});
test('enabled native forms block complete document conversion until their lifecycle is mapped',()=>{
 const f=structuredClone(format);f.Forms={'@Enabled':'true'};
 const r=convertNativeDocument(f,{...page,EnablePrompting:true,PromptValuesXml:original},{fonts,evidence:['native-form-promptvalues-and-setprompt']});
 assert.equal(r.complete,false);assert.ok(r.diagnostics.some(d=>d.code==='NATIVE_DOCUMENT_FORMS_UNMAPPED'));
 assert.deepEqual(r.document.native_forms.controls,readNativePromptValues(original).controls);assert.equal(r.document.native_forms.enabled,true);assert.equal(r.document.native_forms.promptingEnabled,true);
 assert.equal(convertNativeDocument({...f,Forms:{'@Enabled':'false'}},page,{fonts,evidence:['native-disabled-forms']}).complete,true);
});
test('explicitly excluding an enabled native form retains its original metadata and emits a form-free editable document',()=>{
 const f=structuredClone(format);f.Forms={'@Enabled':'true'};
 const r=convertNativeDocument(f,{...page,EnablePrompting:true,PromptValuesXml:original},{fonts,evidence:['native-form-promptvalues-and-setprompt'],formsMode:'exclude'});
 assert.equal(r.complete,true,JSON.stringify(r.diagnostics));assert.equal(r.document.native_forms.enabled,false);assert.equal(r.document.native_forms.original_enabled,true);assert.equal(r.document.native_forms.excluded,true);assert.equal(r.document.native_forms.promptingEnabled,true);
 assert.equal(r.document.native_document.formatProperties.Forms['@Enabled'],'true');assert.deepEqual(r.document.native_forms.controls,[{name:'Text Input Box 1',value:'Product Name'},{name:'Text Input Box 2',value:'500346072995'}]);
});
const formSources={};for(const id of ['{AAE44AF8-BFA7-455E-ABF2-68FE515C1555}','{50232CDE-944A-4154-B014-4D245C599533}'])formSources[id]={id,kind:'embedded',config:{value:id.startsWith('{AAE')?'Product Name':'500346072995'},dataType:{kind:'text'},transforms:[]};
test('full original BTX form retains all eight separate controls, exact layout and source GUID bindings',()=>{
 const r=readNativeDataEntryForms(full,{sourceDefinitions:formSources});assert.equal(r.layoutComplete,true);assert.equal(r.behaviorComplete,false);assert.equal(r.forms.length,1);const f=r.forms[0];assert.equal(f.name,'Form 1');assert.equal(f.title,'Accessory Box');assert.equal(f.width_mm,3.709*25.4);assert.equal(f.height_mm,2.458*25.4);assert.equal(f.controls.length,8);
 const edits=f.controls.filter(c=>c.kind==='edit');assert.deepEqual(edits.map(c=>c.sourceRefs),Object.keys(formSources).map(id=>[id]));assert.equal(edits[0].x_mm,.927*25.4);assert.equal(edits[0].width_mm,1.854*25.4);assert.equal(edits[0].font.family,'Segoe UI');assert.equal(edits[0].font.size_pt,9);assert.equal(edits[0].native.properties['@DefaultValueSource'],'UseSampleData');assert.equal(r.nativeXml,full);
});
test('full form conversion retains unknown controls/properties as blocking diagnostics and never guesses bindings',()=>{
 for(const xml of [full.replace('<EditControl Lines="1"','<EditControl Unmapped="yes" Lines="1"'),full.replace(/EditControl/g,'UnknownControl'),full.replace('DataSourceGuid="{AAE44AF8-BFA7-455E-ABF2-68FE515C1555}"','DataSourceGuid="{missing}"')]){const r=readNativeDataEntryForms(xml,{sourceDefinitions:formSources});assert.equal(r.layoutComplete,false);assert.ok(r.diagnostics.some(d=>d.severity==='error'));assert.equal(r.nativeXml,xml);}
});
module.exports={full,formSources};
