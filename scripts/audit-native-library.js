'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {readNativeObjectExport}=require('../lib/btw-object-package');
const {convertNativeObjects}=require('../lib/btw-native-object-converter');
const {readNativeFormatInventory}=require('../lib/btw-native-format-inventory');
const {readNativeDataSources}=require('../lib/btw-native-data-sources');
function audit(directory){
 const inventory=JSON.parse(fs.readFileSync(path.join(directory,'inventory.json'),'utf8').replace(/^\uFEFF/,''));
 const report={templates:[],nativeObjects:0,types:{},diagnostics:{},complete:false};
 for(const row of inventory.records){
  if(row.status!=='exported'){report.templates.push({source:row.source,status:'export-failed',error:row.error});continue;}
  const xml=fs.readFileSync(path.join(row.directory,'objects.xml'),'utf8'),envelope=readNativeObjectExport(xml);
  if(envelope.nativeObjectCount!==row.nativeObjectCount)throw Error('Manifest count mismatch: '+row.source);
  const converted=convertNativeObjects('<Objects>'+envelope.objects.map(o=>o.xml).join('')+'</Objects>',{units:'mm'});
  const record={source:row.source,sha256:row.sha256,nativeObjectCount:envelope.nativeObjectCount,decodedObjectCount:converted.objects.length,convertedCandidateCount:converted.elements.length,complete:converted.complete,diagnostics:converted.diagnostics};
  record.sourceDefinitions=converted.sourceDefinitions;
  record.candidateElements=converted.elements;
  if(converted.objects.length!==envelope.nativeObjectCount){record.complete=false;record.diagnostics.push({severity:'error',code:'NATIVE_EXPORT_OBJECT_COVERAGE',message:'GetXML object payload count differs from the native collection; wrappers preserve original identities.'});}
  for(const object of envelope.objects)for(const error of object.exportErrors){record.complete=false;record.diagnostics.push({severity:'error',code:'NATIVE_OBJECT_EXPORT_FAILED',objectName:object.name,...error});}
  try{
   const format=readNativeFormatInventory(fs.readFileSync(path.join(row.directory,'format.xml'),'utf8'));
   record.formatSources=format.objects.map(o=>({name:o.name,nativeType:o.nativeType,sources:o.sources}));
   record.objectListErrors=format.objectListErrors;
  }catch(error){record.complete=false;record.diagnostics.push({severity:'error',code:'NATIVE_FORMAT_INVENTORY_FAILED',message:error.message});}
  const sourcesFile=path.join(row.directory,'data-sources.xml');
  try{record.nativeSourceDefinitions=readNativeDataSources(fs.readFileSync(sourcesFile,'utf8'));}
  catch(error){record.complete=false;record.diagnostics.push({severity:'error',code:'NATIVE_SOURCE_DEFINITIONS_FAILED',message:error.message});}
  for(const obj of envelope.objects){report.nativeObjects++;report.types[obj.nativeType]=(report.types[obj.nativeType]||0)+1;}
  for(const d of record.diagnostics)report.diagnostics[d.code]=(report.diagnostics[d.code]||0)+1;
  record.assets=[];
  for(const name of ['objects.xml','format.xml','prompt.xml',...(fs.existsSync(sourcesFile)?['data-sources.xml']:[]),...envelope.objects.map(o=>o.pictureFile).filter(Boolean)]){
   const data=fs.readFileSync(path.join(row.directory,name));record.assets.push({file:name,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
  }
  report.templates.push(record);
 }
 report.complete=report.templates.length>0&&report.templates.every(t=>t.complete===true);
 fs.writeFileSync(path.join(directory,'conversion-audit.json'),JSON.stringify(report,null,2)+'\n');
 return {templates:report.templates.length,nativeObjects:report.nativeObjects,complete:report.complete,types:report.types,diagnostics:report.diagnostics};
}
module.exports={audit};
if(require.main===module){if(!process.argv[2])throw Error('Usage: node scripts/audit-native-library.js <export directory>');console.log(JSON.stringify(audit(path.resolve(process.argv[2])),null,2));}
