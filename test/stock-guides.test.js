'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const guides=require('../gui/stock-guides');
test('antenna catalogue contains twelve original distinct source-bound images',()=>{
 assert.equal(guides.catalog.length,12);assert.equal(new Set(guides.catalog.map(x=>x.id)).size,12);
 for(const item of guides.catalog){assert.match(item.source_sha256,/^[a-f0-9]{64}$/);assert.ok(item.width_mm>0&&item.height_mm>0);assert.match(item.src,/^assets\/rfid\/.+\.png$/);}
});
test('packaged antenna PNGs match the retained manifest hashes and physical source frames',()=>{
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{PNG}=require('pngjs');
 for(const item of guides.catalog){const bytes=fs.readFileSync(path.join(__dirname,'../gui',item.src));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.png_sha256);const png=PNG.sync.read(bytes),scale=768/Math.max(item.width_mm,item.height_mm);assert.ok(Math.abs(png.width-item.width_mm*scale)<=1,item.id+' width');assert.ok(Math.abs(png.height-item.height_mm*scale)<=1,item.id+' height');}
});
test('nine anchors and independent origin offsets position antenna without mutating settings',()=>{
 for(const [anchor,ax,ay] of [['top-left',0,0],['top-center',.5,0],['top-right',1,0],['center-left',0,.5],['center',.5,.5],['center-right',1,.5],['bottom-left',0,1],['bottom-center',.5,1],['bottom-right',1,1]]){
  const s={method:'manual',width_mm:20,height_mm:10,anchor,origin_x:'right',origin_y:'bottom',x_mm:-2,y_mm:-3};const before=JSON.stringify(s),b=guides.antennaBox(s,100,60);
  assert.equal(b.x,98-20*ax);assert.equal(b.y,57-10*ay);assert.equal(JSON.stringify(s),before);
 }
 const fit=guides.antennaBox({method:'fit',angle:90},100,60);assert.equal(fit.width,100);assert.equal(fit.height,60);
});
test('RFID guides hide, rotate, mirror-independent artwork and reject unsafe custom images',()=>{
 assert.equal(guides.render({stock:{}},100,60), '');
 const stock={rfid_antenna:{enabled:true,image_id:'generic',method:'manual',width_mm:20,height_mm:10,angle:90}};
 assert.match(guides.render({stock},100,60),/data-rfid-antenna/);assert.match(guides.render({stock},100,60),/rotate\(90/);
 assert.throws(()=>guides.addImage([], {name:'bad',src:'javascript:alert(1)',width_mm:10,height_mm:10}),/image/i);
 const added=guides.addImage([],{name:'Custom',src:'data:image/png;base64,aGVsbG8=',width_mm:10,height_mm:4});assert.equal(added.length,1);assert.equal(guides.removeImage(added,added[0].id).length,0);
 assert.throws(()=>guides.removeImage(guides.catalog,'generic'),/built-in/i);
});
test('magnetic guides respect side, edge, offset, thickness and print-preview inclusion',()=>{
 const t={stock:{magnetic_stripe:{display:'front',color:'#112233',edge:'right',offset_mm:2,thickness_mm:8,show_print_preview:false}}};
 assert.match(guides.render(t,100,60),/x="90"/);assert.match(guides.render(t,100,60),/#112233/);
 assert.equal(guides.render(t,100,60,{context:'print-preview'}),'');
 t.stock.magnetic_stripe.show_print_preview=true;assert.match(guides.render(t,100,60,{context:'print-preview'}),/data-magnetic-stripe/);
 assert.equal(guides.render(t,100,60,{side:'back'}),'');t.stock.magnetic_stripe.display='none';assert.equal(guides.render(t,100,60),'');
});
test('sheet print-preview guides repeat in real margin and gap positions without encoding or artwork',()=>{
 const t={width_mm:40,height_mm:30,elements:[],stock:{magnetic_stripe:{display:'front',edge:'top',thickness_mm:4,show_print_preview:true}},page:{enabled:true,rows:2,columns:2,left_mm:3,top_mm:5,gap_x_mm:2,gap_y_mm:1}};
 const markup=guides.printPreview(t);assert.equal((markup.match(/data-magnetic-stripe/g)||[]).length,4);assert.match(markup,/x="45" y="36"/);assert.doesNotMatch(markup,/data-rfid-antenna/);
 const clone=JSON.stringify(t);guides.printPreview(t);assert.equal(JSON.stringify(t),clone);t.stock.magnetic_stripe.show_print_preview=false;assert.equal(guides.printPreview(t),'');
});
test('stock guide metadata never becomes physical label ink or encoder commands',()=>{
 const {buildZpl}=require('../lib/zpl'),base={width_mm:40,height_mm:30,dpi:203,elements:[]};
 const decorated={...base,stock:{rfid_antenna:{enabled:true,image_id:'generic'},magnetic_stripe:{display:'front',thickness_mm:4,show_print_preview:true}}};assert.deepEqual(buildZpl(decorated,[{}]),buildZpl(base,[{}]));
});
