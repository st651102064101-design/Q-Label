'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert'),{PNG}=require('pngjs');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true,nodeIntegration:false}});
 try{
  await win.loadURL('data:text/html,<html><body></body></html>');
  for(const name of ['barcode','object-data','bitmap','preview','image-export'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../gui',name+'.js'),'utf8'));
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const template={width_mm:25.4,height_mm:25.4,dpi:300,elements:[{type:'box',x_mm:5,y_mm:5,width_mm:5,height_mm:5,fill_color:'#ff0000',stroke_color:'#ff0000'},{type:'barcode128',x_mm:1,y_mm:15,module_width:2,bar_height_mm:5,text:'12345678',show_text:false}]};
   const results=[];
   for(const dpi of [150,300,600])for(const transparent of [true,false])for(const colors of ['auto','color','grayscale','mono']){
    const plan=ImageExport.plan(template,[],{dpi,transparent,colors},LabelPreview.computeBoxes(template,{}));
    const canvas=await LabelPreview.rasterizeDesignSheetCanvas(plan.template,{},plan.indices,{}, {designSheet:true,transparentBackground:transparent,exportViewport:plan.viewport,exportDpi:dpi});
    const ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height);ImageExport.convertPixels(pixels.data,colors);ctx.putImageData(pixels,0,0);
    results.push({dpi,transparent,colors,dataUrl:canvas.toDataURL('image/png')});
   }
   const selected=ImageExport.plan(template,[0],{scope:'selected',dpi:300},LabelPreview.computeBoxes(template,{}));
   const crop=await LabelPreview.rasterizeDesignSheetCanvas(selected.template,{},selected.indices,{}, {designSheet:true,transparentBackground:true,exportViewport:selected.viewport,exportDpi:300});
   return {results,crop:{width:crop.width,height:crop.height},barcode:LabelPreview.computeBoxes(template,{}).find(b=>b.index===1)};
  })()`);
  for(const r of result.results){const png=PNG.sync.read(Buffer.from(r.dataUrl.split(',')[1],'base64'));assert.equal(png.width,r.dpi);assert.equal(png.height,r.dpi);assert.equal(png.data[3],r.transparent?0:255);const i=(Math.round(r.dpi*7/25.4)*png.width+Math.round(r.dpi*7/25.4))*4;assert.equal(png.data[i+3],255);if(r.colors==='grayscale')assert.deepEqual(Array.from(png.data.subarray(i,i+3)),[76,76,76]);else if(r.colors==='mono')assert.deepEqual(Array.from(png.data.subarray(i,i+3)),[0,0,0]);else assert.deepEqual(Array.from(png.data.subarray(i,i+3)),[255,0,0]);
   // Verify barcode physical width stays constant at every output resolution.
   const y=Math.round(r.dpi*17/25.4);let last=-1;for(let x=0;x<png.width;x++){const o=(y*png.width+x)*4;if(png.data[o]<128&&png.data[o+3]>127)last=x;}
   assert.ok(Math.abs(last/r.dpi*25.4-(result.barcode.x+result.barcode.w))<.6,'barcode width must not shrink when DPI changes');
  }
  assert.equal(result.crop.width,Math.round(5*300/25.4));assert.equal(result.crop.height,Math.round(5*300/25.4));
  console.log('PASS 24 real Chromium PNG exports: 3 resolutions × 2 backgrounds × 4 color modes, barcode size, selected crop');app.exit(0);
 }catch(error){console.error(error.stack);app.exit(1);}
});
