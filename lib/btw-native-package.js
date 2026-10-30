'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const SourceModel=require('../gui/source-model');
const DEFAULT_DIRECTORY=path.join(__dirname,'assets','btw-native-packages');
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function validateNativePackage(value,sha256){
 const fail=message=>{throw Error('Invalid native package: '+message);};
 if(!record(value)||value.schemaVersion!==1||value.complete!==true)fail('complete schema version 1 required');
 if(!/^[a-f0-9]{64}$/.test(sha256)||value.source?.sha256!==sha256)fail('source BTW SHA-256 mismatch');
 const proof=value.verification;
 if(!record(proof)||proof.complete!==true||proof.method!=='native-editable-object-package'||!Array.isArray(proof.evidence)||!proof.evidence.length||proof.evidence.some(item=>typeof item!=='string'||!item.trim()))fail('complete native verification evidence required');
 const nativeForms=value.native_forms||{},nativeFormWasEnabled=nativeForms.original_enabled===true||value.native_document?.formatProperties?.Forms?.['@Enabled']==='true',formExcluded=value.verification?.scope==='editable-objects-without-native-data-entry-form'&&nativeForms.enabled===false&&nativeForms.original_enabled===true&&nativeForms.excluded===true;
 if(nativeForms.enabled===true||nativeFormWasEnabled&&!formExcluded||value.verification?.scope==='editable-objects-without-native-data-entry-form'&&!formExcluded)fail('enabled native data entry forms need a supported control and event lifecycle unless the package explicitly excludes the original form');
 if(!Array.isArray(value.diagnostics)||value.diagnostics.some(d=>!record(d)||d.severity==='error'))fail('unresolved conversion diagnostics');
 if(value.dataSourceSchemaVersion!==1||typeof value.sourceDocumentId!=='string'||!value.sourceDocumentId||!record(value.sourceDefinitions))fail('stable source registry required');
 if(!Array.isArray(value.elements)||!record(value.page)||!record(value.fonts)&&!Array.isArray(value.fonts))fail('elements, original page and font inventory required');
 for(const [name,n]of Object.entries({width_mm:value.width_mm,height_mm:value.height_mm,page_width_mm:value.page.width_mm,page_height_mm:value.page.height_mm}))if(!Number.isFinite(n)||n<=0)fail('invalid '+name);
 if(!['rectangle','rounded','ellipse','circle'].includes(value.label_shape))fail('original label shape required');
 if(value.label_shape==='rounded'&&(!Number.isFinite(value.corner_radius_mm)||value.corner_radius_mm<0))fail('explicit rounded corner radius required');
 let all;try{all=SourceModel.elements(value);SourceModel.validate(value);}catch(error){fail(error.message);}
 if(!Number.isInteger(value.nativeObjectCount)||value.nativeObjectCount<1||value.nativeObjectCount!==all.length)fail('native object count mismatch');
 const nativeIds=new Set();
 for(const element of all){
  const native=element.native_object;
  if(!record(native)||typeof native.id!=='string'||!native.id||nativeIds.has(native.id)||typeof native.type!=='string'||!native.type||typeof native.name!=='string'||!record(native.properties)||typeof native.xml!=='string'||!native.xml.trim())fail('original native object identity and properties required');
  nativeIds.add(native.id);
  if(!['text','line','box','ellipse','image'].includes(element.type)||element.source_format==='btw-preview'||element.source_format==='btw-preview-region')fail('unsupported or flattened object');
  if(element.type==='image'){
   if(native.type.startsWith('BarCode-')){
    if(!record(element.barcode_spec)||!require('./barcode-catalog').catalog.some(item=>item.bcid===element.barcode_spec.bcid)||!element.dataSourceRefs?.length)fail('editable barcode definition and source references required');
   }else{
    if(element.source_picture&&(!record(element.source_picture)||element.source_picture.encoding!=='base64'||!element.dataSourceRefs?.length))fail('dynamic picture requires Base64 source references');
    const pixels=typeof element.color_image_data==='string'&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(element.color_image_data);
    const bitmap=Number.isInteger(element.bitmap_width)&&element.bitmap_width>0&&Number.isInteger(element.bitmap_height)&&element.bitmap_height>0&&typeof element.bitmap_hex==='string'&&/^[0-9a-f]+$/i.test(element.bitmap_hex)&&element.bitmap_hex.length===Math.ceil(element.bitmap_width/8)*element.bitmap_height*2;
    if(native.type!=='Picture'||element.barcode_spec||!pixels&&!bitmap)fail('individually exported original picture pixels required');
   }
  }
  for(const key of ['x_mm','y_mm','width_mm','height_mm'])if(!Number.isFinite(element[key])||(key==='width_mm'||key==='height_mm')&&element[key]<0)fail('invalid object '+key);
  for(const key of ['dataSourceRefs','hriSourceRefs'])if(element[key]!==undefined){if(!Array.isArray(element[key])||element[key].some(id=>typeof id!=='string'||!Object.hasOwn(value.sourceDefinitions,id)))fail('unresolved '+key);}
  const snapshot=element.barcode_spec?.text??element.text;
  if(snapshot!==undefined&&element.dataSourceRefs&&element.sourceTextSnapshot!==String(snapshot))fail('source text snapshot must preserve the original source registry');
 }
 const objectIds=new Set(all.map(element=>element.id));
 for(const source of Object.values(value.sourceDefinitions))if(source.kind==='object'&&!objectIds.has(source.config?.objectId))fail('unresolved source object identity');
 // This is a trusted bundled-package admission gate, not a converter or a proof
 // generator. A candidate cannot become verified merely by matching its count.
 return structuredClone(value);
}
function loadVerifiedNativePackage(source,{directory=DEFAULT_DIRECTORY}={}){
 if(!Buffer.isBuffer(source))throw Error('Native package source must be BTW bytes');
 const sha256=crypto.createHash('sha256').update(source).digest('hex'),file=path.join(directory,sha256+'.json');
 if(!fs.existsSync(file))return null;
 if(fs.statSync(file).size>64*1024*1024)throw Error('Invalid native package: size limit exceeded');
 let value;try{value=JSON.parse(fs.readFileSync(file,'utf8'));}catch(error){throw Error('Invalid native package: '+error.message);}
 return validateNativePackage(value,sha256);
}
module.exports={loadVerifiedNativePackage,validateNativePackage};
