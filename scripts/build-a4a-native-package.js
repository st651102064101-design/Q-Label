'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {readNativeDataSources}=require('../lib/btw-native-data-sources');
const {convertNativeSources}=require('../lib/btw-native-source-converter');
const {readNativeFormatInventory}=require('../lib/btw-native-format-inventory');
const {convertNativeDocument}=require('../lib/btw-native-document');
const {buildNativePackage}=require('../lib/btw-native-package-builder');
const root=path.resolve(__dirname,'..'),fixture=path.join(root,'test/fixtures/native-a4a');
const source=fs.readFileSync(path.join(fixture,'A4A Label.btw'));
const hash=crypto.createHash('sha256').update(source).digest('hex');
const exportXml=fs.readFileSync(path.join(fixture,'objects.xml'),'utf8');
const nativeSources=readNativeDataSources(fs.readFileSync(path.join(fixture,'data-sources.xml'),'utf8'));
const sourceResult=convertNativeSources('<DataSources>'+nativeSources.sources.map(item=>item.definitionXml).join('')+'</DataSources>');
if(!sourceResult.complete)throw Error('A4A original sources are not all convertible: '+JSON.stringify(sourceResult.diagnostics));
const formatResult=readNativeFormatInventory(fs.readFileSync(path.join(fixture,'format.xml'),'utf8'));
const snapshot=JSON.parse(fs.readFileSync(path.join(fixture,'page-snapshot.json'),'utf8'));
snapshot.PromptValuesXml=fs.readFileSync(path.join(fixture,'prompt-values.xml'),'utf8');
const textMetrics={kind:'native-text-metrics',font_name:'Arial',font_size_pt:12,width_mm:23.5458,height_mm:4.7498,line_height_mm:4.7498,em_height:2048,cell_ascent:1854,font_sha256:'b3658eadae55e682b5f69eb64c439c1ecc8f196c0bb8d4756d145d13bc86476a',evidence:['D:/QLabelNativeLibraryAudit-20261023/text-barcode-followup/native-text-emf-results.txt']};
const fonts=[{family:'Arial',sha256:textMetrics.font_sha256,availability:'installed-system-font',evidence:['C:/Windows/Fonts/arial.ttf','D:/QLabelNativeLibraryAudit-20261023/text-barcode-followup/native-text-emf-results.txt']}];
const documentResult=convertNativeDocument(formatResult.formatProperties,snapshot,{fonts,evidence:['test/fixtures/native-a4a/format.xml','test/fixtures/native-a4a/page-snapshot.json','D:/QLabelNativeLibraryAudit-20261023/geometry-followup/page-followup/A4A Label-page.txt','D:/QLabelNativeLibraryFinish-20261027/owned-ui/barcode-anchor-observation.txt'],formsMode:'exclude'});
if(!documentResult.complete)throw Error('A4A document settings are not verified: '+JSON.stringify(documentResult.diagnostics));
const metrics={...textMetrics};
const result=buildNativePackage(source,exportXml,{
 conversionOptions:{
  sourceDefinitions:sourceResult.sourceDefinitions,
  nativeTextMetrics:{'Text 1':metrics,'Text 2':{...metrics,width_mm:28.321},'Text 3':{...metrics,width_mm:7.2898}},
  nativeDataMatrixLayouts:{'Barcode 1':JSON.parse(fs.readFileSync(path.join(fixture,'datamatrix.json'),'utf8'))}
 },
 documentMetadata:{...documentResult.document,name:'A4A Label'},
 verification:{
  complete:true,method:'native-editable-object-package',scope:'editable-objects-without-native-data-entry-form',
  evidence:['D:/Programs/BarTend.exe SHA-256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3','D:/Programs/Interop.BarTender.dll SHA-256 a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515; REA evidence ev_91c113ebf3463a919bdc2c10470997286c92d256acf4729f130082f514e4f9f9 and ev_433ddc7f64a090c9a2106e09b9b891040ddd52052a190ec6368dd60e25ae28db','D:/QLabelNativeLibraryAudit-20261023/verified-export/4c4afa8060191968c5d34f06865a029c4f53c25164e14b094e368040be18b783/objects.xml and data-sources.xml','D:/QLabelNativeLibraryAudit-20261023/geometry-followup/page-followup/A4A Label-page.txt','D:/QLabelNativeLibraryAudit-20261023/text-barcode-followup/native-text-emf-results.txt','D:/QLabelNativeLibraryFinish-20261027/owned-ui/barcode-anchor-observation.txt','test/fixtures/native-a4a/datamatrix.json; independent DataMatrixReader byte decode for original and changed values'],
  limitations:['The original enabled native data-entry form is preserved as metadata but excluded from the editable import; controls, layout, bindings and event lifecycle are not implemented.','Edited DataMatrix values are encoded within the measured fixed object bounds; BarTender native autosize quantization is not emulated.','No physical printer output or full pixel-level native rendering comparison is claimed.']
 }
});
if(!result.complete||!result.package)throw Error('A4A native package was rejected: '+JSON.stringify(result.diagnostics));
const directory=path.join(root,'lib/assets/btw-native-packages');fs.mkdirSync(directory,{recursive:true});
const destination=path.join(directory,hash+'.json');
fs.writeFileSync(destination,JSON.stringify(result.package,null,2)+'\n');
console.log(JSON.stringify({destination,sha256:hash,objects:result.package.nativeObjectCount,bytes:fs.statSync(destination).size}));
