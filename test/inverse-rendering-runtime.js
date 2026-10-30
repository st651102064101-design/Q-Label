const {app}=require('electron');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');

app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-inverse-')));
const timeout=setTimeout(()=>{console.error('Inverse rendering runtime timed out');app.exit(1);},30000);
app.on('browser-window-created',(_,win)=>win.webContents.once('did-finish-load',async()=>{
  try{
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const began=performance.now();while(!window.LabelPreview||appInitializing){if(performance.now()-began>20000)throw Error('Application startup timed out');await new Promise(resolve=>setTimeout(resolve,25));}
      const template={width_mm:50,height_mm:30,dpi:203,elements:[
        {type:'inverse',x_mm:5,y_mm:4,width_mm:25,height_mm:18},
        {type:'text',text:'A',x_mm:10,y_mm:8,font_family:'Arial',font_size_pt:20,text_box_width_mm:12,text_box_height_mm:10},
        {type:'text',text:'B',x_mm:35,y_mm:8,font_family:'Arial',font_size_pt:20,text_box_width_mm:10,text_box_height_mm:10}
      ]};
      const canvas=await LabelPreview.rasterizeDesignSheetCanvas(template,{},null,{},{}),ctx=canvas.getContext('2d'),dotsPerMm=203/25.4;
      const count=(x,y,w,h,predicate)=>{const left=Math.round(x*dotsPerMm),top=Math.round(y*dotsPerMm),width=Math.round(w*dotsPerMm),height=Math.round(h*dotsPerMm),pixels=ctx.getImageData(left,top,width,height).data;let matches=0;for(let i=0;i<pixels.length;i+=4)if(predicate(pixels[i],pixels[i+1],pixels[i+2]))matches++;return matches;};
      const invertedGlyph=count(10,8,12,10,(r,g,b)=>r>235&&g>235&&b>235),normalGlyph=count(35,8,10,10,(r,g,b)=>r<80&&g<80&&b<80),inverseBackground=count(6,5,1,1,(r,g,b)=>r<80&&g<80&&b<80);
      if(invertedGlyph<20||normalGlyph<20||inverseBackground<10)throw Error('Inverse rendering failed: '+JSON.stringify({invertedGlyph,normalGlyph,inverseBackground}));
      editing={width_mm:50,height_mm:30,dpi:203,margin_mm:{top:2},elements:[{type:'box',x_mm:8,y_mm:6,width_mm:25,height_mm:16,thickness_mm:.3}]};
      const inverse={type:'inverse',x_mm:2,y_mm:1,width_mm:20,height_mm:12};editing.elements.push(inverse);
      const targetBefore=LabelPreview.computeBoxes(editing,{}).find(box=>box.index===0),placed=window.alignInverseToTargetBottom(inverse,0),inverseAfter=LabelPreview.computeBoxes(editing,{}).find(box=>box.index===1);
      if(!placed||Math.abs((inverseAfter.y+inverseAfter.h)-(targetBefore.y+targetBefore.h))>.0001)throw Error('Inverse drop placement did not align its bottom edge: '+JSON.stringify({placed,targetBefore,inverseAfter,inverse}));
      return {invertedGlyph,normalGlyph,inverseBackground,width:canvas.width,height:canvas.height,inverseBottomAligned:true,targetBottom:targetBefore.y+targetBefore.h,inverseBottom:inverseAfter.y+inverseAfter.h};
    })()`);
    fs.mkdirSync(path.join(__dirname,'..','test-results'),{recursive:true});
    fs.writeFileSync(path.join(__dirname,'..','test-results','inverse-rendering-runtime.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result,null,2));clearTimeout(timeout);app.exit(0);
  }catch(error){console.error(error.stack||error);clearTimeout(timeout);app.exit(1);}
}));
require('../gui/main');
