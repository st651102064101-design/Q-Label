'use strict';
const crypto=require('node:crypto');
const {readNativeObjectExport}=require('./btw-object-package');
const {convertNativeObjects}=require('./btw-native-object-converter');
const {validateNativePackage}=require('./btw-native-package');
/** Offline assembly only. It cannot repair diagnostics or generate proof. */
function buildNativePackage(source,exportXml,{conversionOptions={},documentMetadata={},verification}={}){
 if(!Buffer.isBuffer(source))throw Error('Native package source must be BTW bytes');
 const sha256=crypto.createHash('sha256').update(source).digest('hex');
 const envelope=readNativeObjectExport(exportXml);
 const conversion=convertNativeObjects('<Objects>'+envelope.objects.map(object=>object.xml).join('')+'</Objects>',{...conversionOptions,sourceSha256:sha256,units:'mm'});
 const diagnostics=[...conversion.diagnostics];
 if(conversion.objects.length!==envelope.nativeObjectCount||conversion.elements.length!==envelope.nativeObjectCount)diagnostics.push({severity:'error',code:'NATIVE_PACKAGE_OBJECT_COVERAGE',message:'Every native wrapper must have one original editable object.'});
 for(const object of envelope.objects)for(const error of object.exportErrors)diagnostics.push({severity:'error',code:'NATIVE_OBJECT_EXPORT_FAILED',objectName:object.name,...error});
 const result={complete:false,package:null,conversion,diagnostics};
 if(!conversion.complete||diagnostics.some(d=>d.severity==='error'))return result;
 const value={schemaVersion:1,complete:true,source:{sha256},verification,nativeObjectCount:envelope.nativeObjectCount,elements:conversion.elements,sourceDefinitions:conversion.sourceDefinitions,dataSourceSchemaVersion:1,sourceDocumentId:'btw-'+sha256,diagnostics,nativeXml:conversion.nativeXml,nativeExportXml:exportXml};
 for(const key of ['native_document','native_forms','print_order','name','width_mm','height_mm','label_shape','corner_radius_mm','page','fonts','values','field_meta','template_pages','template_page_active','designs','design_active','design_side','pages','page_orientation','print_orientation','mirror','negative','stock','media_tracking'])if(documentMetadata[key]!==undefined)value[key]=structuredClone(documentMetadata[key]);
 result.package=validateNativePackage(value,sha256);result.complete=true;return result;
}
module.exports={buildNativePackage};

