'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {PNG}=require('pngjs');
const {extractBtwPreview,restoreLegacyLibraryArtwork}=require('../lib/btw-preview');
function fixture(){
 const png=new PNG({width:120,height:100});
 for(let y=0;y<100;y++)for(let x=0;x<120;x++){const p=(y*120+x)*4,c=y>=30&&y<70?255:110;png.data.set([c,c,c,255],p);}
 for(let y=40;y<50;y++)for(let x=20;x<30;x++)png.data.set([0,0,0,255],(y*120+x)*4);
 return Buffer.concat([Buffer.from('BarTender Format File\r\n'),PNG.sync.write(png)]);
}
test('BTW artwork comes from its embedded preview, crops the grey surround, and retains ink',()=>{
 const art=extractBtwPreview(fixture(),{width_in:3,height_in:1});
 assert.equal(art.bitmap_width,120);assert.equal(art.bitmap_height,40);assert.match(art.png_data_url,/^data:image\/png;base64,/);
 assert.ok(/[^0]/.test(art.bitmap_hex));assert.equal(art.source,'btw-embedded-preview');
 const image=PNG.sync.read(Buffer.from(art.png_data_url.split(',')[1],'base64'));assert.equal(image.data[(10*120+20)*4],0);
});
test('missing, damaged, or wrong-aspect BTW artwork never creates a blank import',()=>{
 assert.equal(extractBtwPreview(Buffer.from('no preview'),{}),null);
 assert.equal(extractBtwPreview(fixture().subarray(0,80),{}),null);
 assert.equal(extractBtwPreview(fixture(),{width_in:1,height_in:3}),null);
});
test('old empty library labels recover artwork without replacing existing or deliberately cleared imports',()=>{
 const legacy={name:'A4A Label',width_mm:76.2,height_mm:25.4,elements:[],bartender_library_template:{path:'fixture.btw'}};
 const restored=restoreLegacyLibraryArtwork(legacy,()=>fixture());
 assert.equal(restored.elements.length,1);assert.equal(restored.bartender_library_template.artwork_imported,true);assert.equal(legacy.elements.length,0);
 const edited={...restored,elements:[]};assert.equal(restoreLegacyLibraryArtwork(edited,()=>{throw Error('must not read');}),edited);
 const custom={...legacy,elements:[{type:'text',text:'User edits'}]};assert.equal(restoreLegacyLibraryArtwork(custom,()=>fixture()),custom);
});
test('old guessed-only library elements recover the original artwork without replacing user edits',()=>{
 const guessed={name:'A4A Label',width_mm:76.2,height_mm:25.4,elements:[{type:'text',text:'Text 1',source_format:'btw-library-decomposed'}],bartender_library_template:{path:'fixture.btw',artwork_imported:true,objects_decomposed:true}};
 const restored=restoreLegacyLibraryArtwork(guessed,()=>fixture());
 assert.equal(restored.elements.length,1);
 assert.equal(restored.elements[0].type,'image');
 assert.equal(restored.bartender_library_template.objects_decomposed,false);
 const userEdited={...guessed,elements:[...guessed.elements,{type:'text',text:'Custom label'}]};
 assert.equal(restoreLegacyLibraryArtwork(userEdited,()=>fixture()),userEdited);
});
