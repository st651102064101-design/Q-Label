'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const timeout=setTimeout(()=>{console.error('Barcode corner pixel test timed out');app.exit(1);},45000);
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true}});await win.loadURL('data:text/html,<html><body></body></html>');
 for(const file of ['object-data.js','barcode.js','barcode-element.js','preview.js'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../gui',file),'utf8'));
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const el={type:'barcode128',x_mm:5,y_mm:5,bar_height_mm:10,module_width:3,show_text:true,text:'12345678',corner_radius_mm:0},t={width_mm:60,height_mm:30,dpi:600,elements:[el]},d=600/25.4;
  const render=async()=>LabelPreview.rasterizeDesignSheetCanvas(t,{},null,{}, {mode:'print',designSheet:false});
  const square=await render();el.corner_radius_mm=4;const rounded=await render();const box=LabelPreview.computeBoxes(t,{})[0],left=Math.ceil(5*d),right=Math.floor((5+box.w)*d)-1,top=Math.ceil(5*d),bottom=Math.floor(15*d)-1;
  const pix=(canvas,x,y)=>[...canvas.getContext('2d').getImageData(x,y,1,1).data].slice(0,3);const points=[[left,top],[right,top],[left,bottom],[right,bottom]];
  const hri=(canvas)=>{const c=canvas.getContext('2d').getImageData(0,Math.ceil(15*d),canvas.width,Math.min(canvas.height-Math.ceil(15*d),Math.ceil(8*d))).data;let n=0;for(let i=0;i<c.length;i+=4)if(c[i]<100&&c[i+1]<100&&c[i+2]<100)n++;return n;};
  return {points:points.map(([x,y])=>({x,y,square:pix(square,x,y),rounded:pix(rounded,x,y)})),hriSquare:hri(square),hriRounded:hri(rounded)};
 })()`);
 for(const p of result.points){assert.ok(p.square[0]<100,'square baseline must have bar ink: '+JSON.stringify(p));assert.ok(p.rounded[0]>200,'rounded barcode corner must remove bar ink: '+JSON.stringify(p));}
 assert.ok(result.hriSquare>0);assert.equal(result.hriRounded,result.hriSquare,'readable text ink is unchanged');console.log('PASS barcode SVG→print raster: four rounded corners, unchanged human-readable text',JSON.stringify(result));clearTimeout(timeout);app.exit(0);
 }catch(e){console.error(e.stack||e);clearTimeout(timeout);app.exit(1);}});
