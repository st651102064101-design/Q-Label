'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),zlib=require('node:zlib');
const Model=require('../gui/source-model'),Resolver=require('../gui/source-resolver'),{collectInputs}=require('../lib/source-adapters');
function fixture(kind,config,dataType){const doc=Model.migrate({elements:[{text:'sample'}]}),id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id]={id,kind,config,dataType:dataType||{kind:'text'},transforms:[]};return{doc,id};}
test('native Data Builder plain-XML phrase library resolves actual vendor-generated rows and languages',async()=>{
  const{doc,id}=fixture('library',{libraryFile:path.join(__dirname,'fixtures','native-phrase-library.btdb'),library:'Shipping phrases',phrase:'greeting',language:'en-US'});let prepared=await collectInputs(doc,{mode:'print'});assert.equal(prepared.sourceErrors[id],undefined);assert.equal(prepared.preparedSources[id],'Hello');doc.sourceDefinitions[id].config.language='th-TH';prepared=await collectInputs(doc,{mode:'print'});assert.equal(prepared.preparedSources[id],'ก');doc.sourceDefinitions[id].config.library='Missing';prepared=await collectInputs(doc,{mode:'print'});assert.match(prepared.sourceErrors[id],/library.*unavailable/i);
});
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
test('native UPC source artwork keeps the original bar anchor while outside digits expand the raster',async()=>{
  const{doc,id}=fixture('embedded',{value:'500346072995'}),element=doc.elements[0];
  Object.assign(element,{type:'image',x_mm:27.051,y_mm:31.7373,width_mm:45.72,height_mm:11.3538,native_barcode_layout:{reference_point:'Center',bar_width_mm:45.72,bar_height_mm:11.3538,hri_source_mode:'encoded'}});
  const font=await fs.readFile(path.join(path.dirname(path.dirname(require.resolve('bwip-js'))),'fonts/Inconsolata.otf'));
  element.barcode_spec={bcid:'upca',text:'old',show_text:true,bar_height_mm:11.3538,native_upca:{profile:'UniGDI-12.1',target_width_mm:48.26,minimum_x_mils:5,maximum_x_mils:500},native_hri:{font_name:'Inconsolata',font_sha256:require('node:crypto').createHash('sha256').update(font).digest('hex'),font_data_base64:font.toString('base64'),font_size_pt:8}};
  const original=structuredClone(element),encoded=await require('../lib/barcode-catalog').encode({...element.barcode_spec,text:'500346072995'}),prepared=await collectInputs(doc,{mode:'print'});
  const ObjectData=require('../gui/object-data'),resolved=require('../gui/data-source-engine').resolve(doc,{},prepared),image=ObjectData.artwork(element,resolved,true);
  assert.equal(prepared.sourceErrors[id],undefined);
  assert.equal(image.x_mm,element.x_mm-encoded.native_artwork_bounds.bar_origin_x_mm);
  assert.equal(image.y_mm,element.y_mm-encoded.native_artwork_bounds.bar_origin_y_mm);
  assert.equal(image.width_mm,encoded.physical_width_mm);assert.equal(image.height_mm,encoded.physical_height_mm);
  const placed=ObjectData.artwork({...element,x_mm:element.x_mm+10,y_mm:element.y_mm+20},resolved,true);
  assert.ok(Math.abs(placed.x_mm-image.x_mm-10)<1e-10,'page/print origin must survive artwork preparation');assert.ok(Math.abs(placed.y_mm-image.y_mm-20)<1e-10);
  const{JSDOM}=require('jsdom'),dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;
  try{
    w.ObjectData=ObjectData;w.LabelBitmap=require('../gui/bitmap');
    w.eval(await fs.readFile(require.resolve('../gui/barcode-element'),'utf8'));w.eval(await fs.readFile(require.resolve('../gui/preview'),'utf8'));
    const box=w.LabelPreview.computeBoxes(doc,resolved)[0];
    for(const[key,want]of Object.entries({x:image.x_mm,y:image.y_mm,w:image.width_mm,h:image.height_mm}))assert.ok(Math.abs(box[key]-want)<1e-9,'native selection '+key+' must include the complete prepared artwork');
    const svg=new w.DOMParser().parseFromString('<svg>'+w.LabelPreview.renderElement(element,203,resolved,{})+'</svg>','image/svg+xml'),background=svg.querySelector('[data-barcode-background]');
    assert.equal(Number(background.getAttribute('x')),image.x_mm);assert.equal(Number(background.getAttribute('y')),image.y_mm);
    assert.ok(Math.abs(Number(background.getAttribute('height'))-Math.round(image.height_mm*203/25.4)*25.4/203)<1e-9);
  }finally{dom.window.close();}
  assert.equal(image.barcode_display_text,'500346072995');assert.deepEqual(element,original);
  Object.assign(doc,{name:'Native UPC origin fixture',width_mm:100,height_mm:80,dpi:203,page:{enabled:true,width_mm:230,height_mm:180,rows:2,columns:2,left_mm:6,right_mm:0,top_mm:5,bottom_mm:0,gap_x_mm:1,gap_y_mm:2}});
  const job=await require('../lib/print-job').preparePrintJobAsync({template:doc}),origins=[...job.zpl.toString().matchAll(/\^FO(\d+),(\d+)\^GFA/g)].map(m=>[Number(m[1]),Number(m[2])]);
  const dots=value=>Math.round(value*203/25.4);
  assert.deepEqual(origins,[[dots(image.x_mm+6),dots(image.y_mm+5)],[dots(image.x_mm+107),dots(image.y_mm+5)],[dots(image.x_mm+6),dots(image.y_mm+87)],[dots(image.x_mm+107),dots(image.y_mm+87)]],'all four printed cells retain their individual origins');
  doc.sourceDefinitions[id].config.value='1234567890';const changed=await collectInputs(doc,{mode:'print'});
  assert.equal(changed.sourceBitmaps[element.id].barcode_display_text,'012345678905');assert.notEqual(changed.sourceBitmaps[element.id].bitmap_hex,image.bitmap_hex);
  doc.sourceDefinitions[id].config.value='123456789019';const invalid=await collectInputs(doc,{mode:'print'});
  assert.match(invalid.sourceErrors[id],/check digit/i);assert.equal(invalid.sourceBitmaps[element.id],undefined);
});
test('native A4A DataMatrix source redraws editable values inside its verified measured object bounds',async()=>{
 const native=JSON.parse(await fs.readFile(path.join(__dirname,'fixtures/native-a4a/datamatrix.json'),'utf8'));
 const{doc,id}=fixture('embedded',{value:native.text}),element=doc.elements[0];
 Object.assign(element,{type:'image',x_mm:39.2684,y_mm:3.81,width_mm:native.width_mm,height_mm:native.height_mm,barcode_spec:{bcid:'datamatrix',native_datamatrix:native,auto_fit_width:false,show_text:false},dataSourceRefs:[id]});
 const original=await collectInputs(doc,{mode:'preview'}),first=original.sourceBitmaps[element.id];
 assert.equal(first.width_mm,native.width_mm);assert.equal(first.height_mm,native.height_mm);assert.equal(first.native_original_modules,true);
 doc.sourceDefinitions[id].config.value=native.text.replace('1U2R7','QZ9R4');
 const edited=await collectInputs(doc,{mode:'preview'}),next=edited.sourceBitmaps[element.id];
 assert.equal(next.width_mm,native.width_mm);assert.equal(next.height_mm,native.height_mm);assert.equal(next.native_original_modules,false);assert.notEqual(next.bitmap_hex,first.bitmap_hex);assert.equal(next.barcode_display_text,doc.sourceDefinitions[id].config.value);
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
