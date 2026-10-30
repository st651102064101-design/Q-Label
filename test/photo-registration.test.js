'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const photo=require('../gui/photo-registration'),{preparePrintJob}=require('../lib/print-job'),{edgeReferenceZpl}=require('../lib/print-calibration');
const reference={width_mm:72,height_mm:1187/24},bounds={left:.2,top:2.4,right:69.35,bottom:50.91};
function syntheticPhoto(){
 const width=640,height=480,data=new Uint8ClampedArray(width*height*4),mmQuad=[[3,3],[69,3],[69,reference.height_mm-3],[3,reference.height_mm-3]],quad=[[95,78],[505,68],[526,384],[73,397]],inverse=photo.homography(quad,mmQuad);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const [u,v]=photo.point(inverse,x,y),inside=u>=bounds.left&&u<=bounds.right&&v>=bounds.top&&v<=bounds.bottom,liner=u>=bounds.left-1.5&&u<=bounds.right+1.5&&v>=bounds.top-1.5&&v<=bounds.bottom+1.5;
  let gray=inside?240:liner?202:38;
  if(inside)for(let n=0;n<4;n++)if(u>=n&&u<=72-n&&v>=n&&v<=reference.height_mm-n&&(Math.abs(u-n)<.16||Math.abs(u-(72-n))<.16||Math.abs(v-n)<.16||Math.abs(v-(reference.height_mm-n))<.16))gray=55;
  const p=(y*width+x)*4;data[p]=data[p+1]=data[p+2]=gray;data[p+3]=255;
 }return {width,height,data};
}
test('detects perspective reference and die-cut sticker, excluding its liner and dark frame lines',()=>{
 const result=photo.analyze(syntheticPhoto(),reference);
 for(const edge of Object.keys(bounds))assert.ok(Math.abs(result.bounds[edge]-bounds[edge])<.35,`${edge}: ${result.bounds[edge]} vs ${bounds[edge]}`);
 assert.ok(Math.abs(result.scaleX-(bounds.right-bounds.left)/72*100)<.8);
 assert.ok(result.offsetY>2&&result.offsetY<2.8);assert.equal(result.verified,false);
});
test('rejects a blank or unsuitable photo instead of saving guessed calibration',()=>{
 const image={width:300,height:300,data:new Uint8ClampedArray(300*300*4).fill(240)};
 assert.throws(()=>photo.analyze(image,reference),/frame|label|sticker/);
});
function fixture(){
 const printer='Zebra ZT411 (600 dpi)',connection={type:'printer',printer},profile={dots_per_mm:24,length_dots:1187,label_height_mm:1187/24,tracking:'gap/notch',width_mm:72},media={...reference,fit:'fill'};
 const w=1728,h=1187,stride=216,bytes=Buffer.alloc(stride*h);for(const y of [0,h-1])for(const x of [0,w-1])bytes[y*stride+(x>>3)]|=128>>(x&7);
 const template={...reference,dpi:609.6,print_media:media,elements:[{type:'image',x_mm:0,y_mm:0,...reference,bitmap_width:w,bitmap_height:h,bitmap_hex:bytes.toString('hex')}]},signature=photo.mediaSignature(media,profile);
 const alignment={offsetX:.2,offsetY:2.4,scaleX:96.0416666667,scaleY:98.0791912384,enabled:true,verified:false,uncertainty_mm:.25};
 return {connection,template,profile,signature,alignment,settings:{printerProfiles:{[printer]:profile},printRegistrations:{[printer]:{[signature]:alignment}}}};
}
test('wire bitmap compensates all four edges while expected physical preview retains the complete design',()=>{
 const f=fixture(),job=preparePrintJob({template:f.template,connection:f.connection,copies:1},f.settings),z=job.zpl.toString();
 assert.match(z,/\^LT29\b/);assert.match(z,/\^FO5,0\^GFA/);assert.match(z,/\^PW1728\b/);assert.ok(!z.includes('^LL'));assert.equal((z.match(/\^XA/g)||[]).length,1);assert.equal(job.count,1);
 const m=z.match(/\^GFA,(\d+),(\d+),(\d+),([A-F0-9]+)/),stride=Number(m[3]),bytes=Buffer.from(m[4],'hex'),h=Number(m[1])/stride;
 assert.equal(h,1164);assert.equal(stride,208);assert.ok(bytes[0]&128);assert.ok(bytes[(h-1)*stride+207]&16); // Last authored pixel survives resizing.
 assert.equal(job.calibration.scaleX,100);assert.equal(job.calibration.scaleY,100);assert.equal(job.offsetY,0);assert.equal(job.previewTemplates[0].width_mm,72);assert.equal(job.registration,f.alignment);
 const rightMm=(5+1660)/24,bottomMm=(29*2+h)/24;assert.ok(Math.abs(rightMm-bounds.right)<1/24);assert.ok(Math.abs(bottomMm-bounds.bottom)<1/24);
});
test('alignment is scoped to a printer, resolution and calibrated stock; stale settings cannot silently apply',()=>{
 const f=fixture();assert.equal(preparePrintJob({template:f.template,connection:{type:'printer',printer:'Other'}},f.settings).registration,null);
 f.profile.length_dots=1100;f.profile.label_height_mm=1100/24;assert.throws(()=>preparePrintJob({template:f.template,connection:f.connection},f.settings),/size has changed/);
 f.settings.printerMediaModes={[f.connection.printer]:'manual'};assert.doesNotThrow(()=>preparePrintJob({template:f.template,connection:f.connection},f.settings));
});
test('oversize photo compensation is rejected before it can cross the calibrated feed length',()=>{const f=fixture();f.alignment.scaleY=105;assert.throws(()=>preparePrintJob({template:f.template,connection:f.connection},f.settings),/feed length/);});
test('manual adjustments cannot move an aligned edge pixel off the sticker or into another label',()=>{const f=fixture();assert.throws(()=>preparePrintJob({template:f.template,connection:f.connection,offsetY:2},f.settings),/sticker edges|feed length/);assert.throws(()=>preparePrintJob({template:f.template,connection:f.connection,offsetX:1},f.settings),/sticker edges/);});
test('data preparation allows authored overflowing logos before full-page raster fitting',()=>{const f=fixture(),source={...f.template,width_mm:74.93,height_mm:53.34,elements:[{...f.template.elements[0],x_mm:57.2,y_mm:33,width_mm:17.7,height_mm:22.5},{type:'text',x_mm:30,y_mm:30,height_mm:3,text:'Text'}]};assert.doesNotThrow(()=>preparePrintJob({template:source,connection:f.connection},f.settings));const data={};assert.doesNotThrow(()=>preparePrintJob({template:source,connection:f.connection,recordTemplates:[{data,template:f.template}]},f.settings));});
test('edge test is a separate single-label job with sensor feed length unchanged',()=>{const z=edgeReferenceZpl(reference,24).toString();assert.match(z,/\^PW1728/);assert.match(z,/\^FO72,72\^GB1584,1043,2/);assert.equal((z.match(/\^PQ1/g)||[]).length,1);assert.equal((z.match(/\^XA/g)||[]).length,1);assert.ok(!z.includes('^LL'));});
test('alignment dialog is English and opening it never sends a print',()=>{
 const {JSDOM}=require('jsdom'),dom=new JSDOM('<body/>',{runScripts:'outside-only'}),w=dom.window,f=fixture();let sent=0;
 Object.assign(w,{settings:f.settings,editing:f.template,getConnection:()=>f.connection,PhotoRegistration:photo,zebra:{printRegistrationTest:async()=>{sent++;return{ok:true}},saveSettingsSync:()=>({})}});w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.eval(fs.readFileSync(require.resolve('../gui/print-calibration'),'utf8'));w.openPrintCalibration();assert.equal(sent,0);assert.match(w.document.querySelector('#pcAlignment').textContent,/Saved photo correction/);assert.ok(!/[\u0e00-\u0e7f]/.test(w.document.body.textContent));dom.window.close();
});
const geometry=require('../gui/print-geometry');
test('invisible text box overflow does not shrink the nominal page',()=>{
 const template={width_mm:72,height_mm:49.46},viewport={x:0,y:0,w:72,h:50.2};
 const data=new Uint8ClampedArray(72*502*4).fill(255);
 data.set([0,0,0,255],(490*72+71)*4);
 assert.deepEqual(geometry.rasterInkViewport(template,viewport,{width:72,height:502,data}),{x:-0,y:-0,w:72,h:49.46});
 data.set([0,0,0,255],(501*72+71)*4);
 assert.equal(geometry.rasterInkViewport(template,viewport,{width:72,height:502,data}).h,50.2);
});

