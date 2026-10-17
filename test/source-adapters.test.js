'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),zlib=require('node:zlib');
const Model=require('../gui/source-model'),Resolver=require('../gui/source-resolver'),{collectInputs}=require('../lib/source-adapters');
function fixture(kind,config,dataType){const doc=Model.migrate({elements:[{text:'sample'}]}),id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id]={id,kind,config,dataType:dataType||{kind:'text'},transforms:[]};return{doc,id};}
test('prepared snapshots preserve reserved-key source identities and diagnostics as own JSON properties',async()=>{
  const{doc,id}=fixture('pct',{field:'lot'}),source=doc.sourceDefinitions[id];delete doc.sourceDefinitions[id];source.id='__proto__';Object.defineProperty(doc.sourceDefinitions,'__proto__',{value:source,enumerable:true,writable:true,configurable:true});doc.elements[0].dataSourceRefs=['__proto__'];
  const prepared=await collectInputs(doc,{mode:'print',pctFields:{lot:'007'}});assert.equal(Object.hasOwn(prepared.preparedSources,'__proto__'),true);assert.equal(JSON.parse(JSON.stringify(prepared)).preparedSources.__proto__,'007');assert.equal(Resolver.evaluateDocument(doc,prepared).objects[doc.elements[0].id].text,'007');
  const missing=await collectInputs(doc,{mode:'print'});assert.equal(Object.hasOwn(missing.sourceErrors,'__proto__'),true);assert.match(JSON.parse(JSON.stringify(missing)).sourceErrors.__proto__,/no runtime value/i);
});
test('renamed script preparation ignores old names inside comments and ordinary string literals',async()=>{
  const{doc,id}=fixture('vbscript',{code:'Value = NamedSubString("Amount")\n\' NamedSubString("Amount")\nRem NamedSubString("missing")\nValue = Value & "NamedSubString(""Amount"")"'});doc.sourceDefinitions.amount={id:'amount',name:'Amount',kind:'embedded',config:{value:'42'}};const renamed=Model.renameSource(doc,'amount','Quantity');const prepared=await collectInputs(renamed,{mode:'print'});assert.equal(prepared.sourceErrors[id],undefined);assert.equal(prepared.preparedSources[id],'42NamedSubString("Amount")');
});
test('external file rereads actual content at print preparation and exposes missing-file errors',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-file-')),file=path.join(dir,'source.txt');
  try{await fs.writeFile(file,'first ก');const{doc,id}=fixture('file',{path:file,encoding:'utf-8'});
    const first=await collectInputs(doc,{mode:'preview'});assert.equal(first.preparedSources[id],'first ก');
    await fs.writeFile(file,'second');const second=await collectInputs(doc,{mode:'print'});assert.equal(second.preparedSources[id],'second');
    const output=Resolver.evaluateDocument(doc,{...second,mode:'print'});assert.equal(output.objects[doc.elements[0].id].text,'second');
    doc.sourceDefinitions[id].config.path=path.join(dir,'absent.txt');const missing=await collectInputs(doc,{mode:'print'});assert.match(missing.preparedSources[id].error,/file|ENOENT/i);
  }finally{const resolved=path.resolve(dir);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(resolved,{recursive:true,force:true});}
});
test('script source and binary compression run actual adapters and decode independently',async()=>{
  const{doc,id}=fixture('vbscript',{code:'Value = CStr(6 * 7)'});const inputs=await collectInputs(doc,{mode:'preview'});assert.equal(inputs.preparedSources[id],'42');
  doc.sourceDefinitions[id]={id,kind:'embedded',config:{value:'010203ff'},dataType:{kind:'binary',encoding:'hex'},transforms:[{kind:'compression',method:'gzip'}]};
  const compressed=await collectInputs(doc,{mode:'preview'}),result=Resolver.evaluateDocument(doc,{...compressed,requestedSourceIds:[id]});
  assert.deepEqual([...zlib.gunzipSync(Buffer.from(result.definitions[id].bytes))],[1,2,3,255]);
});
test('catalog barcode artwork follows the evaluated source value and differs for different records',async()=>{
  const{doc,id}=fixture('input',{key:'code'});doc.elements[0].type='image';doc.elements[0].barcode_spec={bcid:'code128',text:'old',show_text:false};doc.elements[0].bitmap_hex='stale';
  const first=await collectInputs(doc,{inputs:{code:'111'}}),second=await collectInputs(doc,{inputs:{code:'222'}});
  assert.ok(first.sourceBitmaps[doc.elements[0].id].bitmap_hex.length>0);assert.notEqual(first.sourceBitmaps[doc.elements[0].id].bitmap_hex,second.sourceBitmaps[doc.elements[0].id].bitmap_hex);
  assert.equal(first.sourceBitmaps[doc.elements[0].id].barcode_display_text,'111');assert.equal(doc.elements[0].bitmap_hex,'stale');
});
test('catalog artwork applies character templates only to the human-readable caption',async()=>{
  const{doc,id}=fixture('embedded',{value:'123456'});doc.elements[0].type='image';doc.elements[0].barcode_spec={bcid:'code128',text:'stale',show_text:true};
  const plain=await collectInputs(doc,{mode:'preview'});doc.sourceDefinitions[id].transforms=[{kind:'character-template',pattern:'???-???'}];
  const formatted=await collectInputs(doc,{mode:'preview'}),image=formatted.sourceBitmaps[doc.elements[0].id];
  assert.equal(image.barcode_display_text,'123-456');assert.notEqual(image.bitmap_hex,plain.sourceBitmaps[doc.elements[0].id].bitmap_hex);
});
test('binary catalog data is encoded as original bytes rather than a UTF-8 conversion',async()=>{
  const{doc,id}=fixture('embedded',{value:'00ff1d'});doc.sourceDefinitions[id].dataType={kind:'binary',encoding:'hex'};doc.elements[0].type='image';doc.elements[0].barcode_spec={bcid:'datamatrix',text:'stale',show_text:false};
  const prepared=await collectInputs(doc,{mode:'preview'}),actual=prepared.sourceBitmaps[doc.elements[0].id];
  const bwip=require('bwip-js'),{PNG}=require('pngjs'),png=PNG.sync.read(await bwip.toBuffer({bcid:'datamatrix',text:'\x00\xff\x1d',binarytext:true,scale:3,padding:12,backgroundcolor:'FFFFFF',includetext:false}));
  const stride=Math.ceil(png.width/8),bytes=Buffer.alloc(stride*png.height);for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){const p=(y*png.width+x)*4;if(png.data[p]*.299+png.data[p+1]*.587+png.data[p+2]*.114<200)bytes[y*stride+(x>>3)]|=0x80>>(x&7);}
  assert.equal(actual.bitmap_width,png.width);assert.equal(actual.bitmap_hex,bytes.toString('hex'));
});
test('external filenames can come from database or named sources with a default directory',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-path-'));
  try{await fs.writeFile(path.join(dir,'A.txt'),'FROM DATABASE');await fs.writeFile(path.join(dir,'B.txt'),'FROM NAMED');
    const{doc,id}=fixture('file',{pathMode:'database',pathSource:'filename',defaultPath:dir,encoding:'utf-8'});
    assert.equal(require('../gui/data-source-engine').usesDatabaseRecords(doc),true);
    let prepared=await collectInputs(doc,{mode:'print',inputs:{filename:'A.txt'}});assert.equal(prepared.preparedSources[id],'FROM DATABASE');
    doc.sourceDefinitions.filename={id:'filename',name:'Filename',kind:'embedded',config:{value:'B.txt'}};
    doc.sourceDefinitions[id].config.pathMode='named';doc.sourceDefinitions[id].config.pathSource='Filename';
    prepared=await collectInputs(doc,{mode:'print'});assert.equal(prepared.preparedSources[id],'FROM NAMED');
    doc.sourceDefinitions[id].config.pathMode='database';doc.sourceDefinitions[id].config.pathSource='missing';prepared=await collectInputs(doc,{mode:'print'});assert.match(prepared.sourceErrors[id],/field.*unavailable/i);
  }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
test('source directory picker requests a real folder dialog and preserves cancellation',async()=>{
  const handlers=new Map();let canceled=false;
  require('../lib/source-ipc')({ipcMain:{handle:(name,handler)=>handlers.set(name,handler)},settings:()=>({}),dialog:{showOpenDialog:async options=>{assert.deepEqual(options.properties,['openDirectory']);return{canceled,filePaths:['C:/Fixture']};}}});
  assert.equal(typeof handlers.get('choose-source-directory'),'function');assert.deepEqual(await handlers.get('choose-source-directory')(),{path:'C:/Fixture'});
  canceled=true;assert.deepEqual(await handlers.get('choose-source-directory')(),{canceled:true});
});
test('offsets prepare a named external dependency before evaluating the current source',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-offset-'));
  try{const file=path.join(dir,'offset.txt');await fs.writeFile(file,'3');const{doc,id}=fixture('embedded',{value:'5'});doc.sourceDefinitions[id].dataType={kind:'number',grouping:false};doc.sourceDefinitions[id].transforms=[{kind:'offset',offsetSource:'named',source:'Increment'}];
    doc.sourceDefinitions.increment={id:'increment',name:'Increment',kind:'file',config:{path:file}};
    const inputs=await collectInputs(doc,{mode:'print'}),result=Resolver.evaluateDocument(doc,inputs);assert.deepEqual(result.diagnostics,[]);assert.equal(result.objects[doc.elements[0].id].text,'8');
  }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});

test('phrase library files reject missing inherited names and oversized data while preserving real entries',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-library-input-'));try{
    const file=path.join(dir,'phrases.json'),{doc,id}=fixture('library',{libraryFile:file,phrase:'toString',language:'en'});
    await fs.writeFile(file,JSON.stringify({phrases:{}}));let inputs=await collectInputs(doc,{mode:'print'});assert.match(inputs.sourceErrors[id],/phrase.*unavailable/i);
    doc.sourceDefinitions[id].config.phrase='greeting';doc.sourceDefinitions[id].config.language='constructor';await fs.writeFile(file,JSON.stringify({phrases:{greeting:{en:'Hello'}}}));inputs=await collectInputs(doc,{mode:'print'});assert.match(inputs.sourceErrors[id],/phrase.*unavailable/i);
    doc.sourceDefinitions[id].config.phrase='__proto__';doc.sourceDefinitions[id].config.language='en';await fs.writeFile(file,'{"phrases":{"__proto__":{"en":"OWN VALUE"}}}');inputs=await collectInputs(doc,{mode:'print'});assert.equal(inputs.preparedSources[id],'OWN VALUE');
    await fs.truncate(file,17*1024*1024);inputs=await collectInputs(doc,{mode:'print'});assert.match(inputs.sourceErrors[id],/library.*exceeds.*16 MB/i);
  }finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:40});}
});
