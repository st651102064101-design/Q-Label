'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{PNG}=require('pngjs');
const {collectInputs}=require('../lib/source-adapters'),Engine=require('../gui/data-source-engine'),ObjectData=require('../gui/object-data'),{create,needsPrepared}=require('../gui/source-preview');
function encoded(pixels,width=2,height=1){const p=new PNG({width,height});p.data.set(pixels);return PNG.sync.write(p).toString('base64');}
function fixture(value){return {dataSourceSchemaVersion:1,sourceDocumentId:'native-picture-test',sourceDefinitions:{logo:{id:'logo',name:'Logo',kind:'embedded',config:{value},dataType:{kind:'text'},transforms:[]}},elements:[{id:'picture',type:'image',x_mm:2,y_mm:3,width_mm:15,height_mm:10,source_picture:{encoding:'base64'},dataSourceRefs:['logo'],bitmap_width:1,bitmap_height:1,bitmap_hex:'FF',color_image_data:'stale'}]};}
test('native Base64 picture follows original shared source changes and keeps each original pixel',async()=>{
 const first=encoded([0,0,0,255,255,255,255,255]),second=encoded([255,255,255,255,0,0,0,255]),doc=fixture(first);
 const a=await collectInputs(doc,{mode:'preview'}),image=a.sourceBitmaps.picture;assert.ok(image,'decoded original source picture must be prepared');assert.equal(a.sourceErrors.logo,undefined);assert.equal(image.bitmap_hex,'80');assert.equal(image.color_image_data,'data:image/png;base64,'+first);assert.equal(image.bitmap_width,2);assert.equal(image.bitmap_height,1);
 const data=Engine.resolve(doc,{},a);assert.equal(ObjectData.artwork(doc.elements[0],data,true).bitmap_hex,'80');
 doc.sourceDefinitions.logo.config.value=second;const b=await collectInputs(doc,{mode:'print'});assert.equal(b.sourceBitmaps.picture.bitmap_hex,'40');assert.equal(b.sourceBitmaps.picture.color_image_data,'data:image/png;base64,'+second);assert.equal(doc.elements[0].bitmap_hex,'FF','source artwork never mutates stored original element');
});
test('invalid native image data blocks output and never displays stale original artwork',async()=>{
 for(const value of ['not base64!','aGVsbG8=','']){const doc=fixture(value),prepared=await collectInputs(doc,{mode:'print'});assert.match(prepared.sourceErrors.logo,/picture|base64|PNG/i);assert.equal(prepared.sourceBitmaps.picture,undefined);assert.throws(()=>Engine.resolve(doc,{}, {...prepared,mode:'print'}),/picture|base64|PNG/i);}
 const doc=fixture('');assert.throws(()=>ObjectData.artwork(doc.elements[0],{},true),/picture.*prepared/i);const hidden=ObjectData.artwork(doc.elements[0],{});assert.equal(hidden.color_image_data,undefined);assert.equal(hidden.bitmap_hex,'00');
});
test('native picture source preview prepares and invalidates cached artwork when shared source changes',async()=>{
 const doc=fixture(encoded([0,0,0,255,255,255,255,255]));assert.equal(needsPrepared(doc),true);
 let calls=0,notify;const ready=[];const preview=create({collectInputs:async(d,c)=>{calls++;return collectInputs(d,c);},onReady:d=>{ready.push(d);notify();}});
 const prepare=()=>new Promise(resolve=>{notify=resolve;preview.resolve(doc);});
 await prepare();let result=preview.resolve(doc);assert.equal(ObjectData.artwork(doc.elements[0],result,true).bitmap_hex,'80');assert.equal(calls,1);
 doc.sourceDefinitions.logo.config.value=encoded([255,255,255,255,0,0,0,255]);await prepare();result=preview.resolve(doc);assert.equal(ObjectData.artwork(doc.elements[0],result,true).bitmap_hex,'40');assert.equal(calls,2);assert.equal(ready.length,2);
});
test('native PNG alpha is preserved for color and composited against white for monochrome print',async()=>{
 const value=encoded([0,0,0,0,0,0,0,255]),doc=fixture(value),prepared=await collectInputs(doc);assert.equal(prepared.sourceBitmaps.picture.bitmap_hex,'40');assert.equal(prepared.sourceBitmaps.picture.color_image_data,'data:image/png;base64,'+value);
});

test('source picture rejects missing source references and unsupported encoding instead of using cached pixels',async()=>{
 const doc=fixture(encoded([0,0,0,255,255,255,255,255]));doc.elements[0].dataSourceRefs=[];
 await assert.rejects(collectInputs(doc,{mode:'print'}),/picture.*source.*reference/i);
 const other=fixture(encoded([0,0,0,255,255,255,255,255]));other.elements[0].source_picture.encoding='filename';
 const prepared=await collectInputs(other,{mode:'print'});assert.match(prepared.sourceErrors.logo,/encoding/i);assert.equal(prepared.sourceBitmaps.picture,undefined);
});
test('native image decoder rejects excessive dimensions before pixel allocation',()=>{
 const {nativePictureArtwork}=require('../lib/native-source-picture');const bytes=Buffer.from(encoded([0,0,0,255,255,255,255,255]),'base64');bytes.writeUInt32BE(1000000,16);
 assert.throws(()=>nativePictureArtwork(bytes.toString('base64'),{encoding:'base64'}),/dimension/i);
 assert.throws(()=>nativePictureArtwork('AB==',{encoding:'base64'}),/Base64/i);
});

test('replacing a native picture updates the original shared embedded source atomically',()=>{
 const Model=require('../gui/source-model'),a=encoded([0,0,0,255,255,255,255,255]),b=encoded([255,255,255,255,0,0,0,255]),doc=fixture(a);
 doc.elements.push({...structuredClone(doc.elements[0]),id:'second-picture'});doc.design_active='front';doc.designs={front:{elements:structuredClone(doc.elements)}};
 const native={id:'logo',original:'kept'};doc.sourceDefinitions.logo.native=native;
 Model.replacePictureSourceInPlace(doc,'picture','data:image/png;base64,'+b);
 assert.equal(doc.sourceDefinitions.logo.config.value,b);assert.deepEqual(doc.elements[0].dataSourceRefs,['logo']);assert.deepEqual(doc.elements[1].dataSourceRefs,['logo']);assert.equal(doc.sourceDefinitions.logo.name,'Logo');assert.deepEqual(doc.sourceDefinitions.logo.native,native);
 const before=JSON.stringify(doc);doc.sourceDefinitions.logo.kind='database';const database=JSON.stringify(doc);assert.throws(()=>Model.replacePictureSourceInPlace(doc,'picture','data:image/png;base64,'+a),/embedded.*source/i);assert.equal(JSON.stringify(doc),database);
 doc.sourceDefinitions.logo.kind='embedded';assert.equal(JSON.stringify(doc),before);assert.throws(()=>Model.replacePictureSourceInPlace(doc,'picture','data:image/jpeg;base64,AA=='),/PNG/i);assert.equal(JSON.stringify(doc),before);
});
