'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),QRCode=require('qrcode');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-qr-gesture-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:900,height:900,webPreferences:{contextIsolation:true,backgroundThrottling:false}});
  try{
    await win.loadURL('data:text/html,<div id="previewFrame"><svg class="overlay" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="800" height="800"></svg></div>');
    const gui=path.resolve(__dirname,'../gui'),read=name=>fs.readFileSync(path.join(gui,name+'.js'),'utf8');
    for(const name of ['object-data','bitmap','barcode-element','preview','edit-history','gesture-geometry','barcode-hri-resize'])await win.webContents.executeJavaScript(read(name));
    const source=read('renderer'),helpers=source.slice(source.indexOf('function boxFromAnchor('),source.indexOf('// Restituisce',source.indexOf('function boxFromAnchor('))),drag=source.slice(source.indexOf('function startDrag('),source.indexOf('let statusBadgeTimer;'));
    const matrix=QRCode.create(' ',{errorCorrectionLevel:'M'}),cache={' ':{size:matrix.modules.size,data:Array.from(matrix.modules.data)}};
    const stride=Math.ceil(matrix.modules.size/8),bytes=Buffer.alloc(stride*matrix.modules.size);for(let y=0;y<matrix.modules.size;y++)for(let x=0;x<matrix.modules.size;x++)if(matrix.modules.data[y*matrix.modules.size+x])bytes[y*stride+(x>>3)]|=128>>(x&7);
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const qrCache=${JSON.stringify(cache)},el=id=>document.getElementById(id),liveOverlay=()=>el('previewFrame').querySelector('svg');
      let editing,editorSelection,editorSel,undoStack=[],redoStack=[],activeObjectGesture=false,deferredGestureDraw=false,pendingGestureRevision=null,pendingCanvasResizeCaret=null;
      const editorGrid={snap:false},previewPan={x:0,y:0},DesignGrid={},sampleData=()=>({}),designPaperBounds=()=>({x:0,y:0,width:200,height:200,minX:0,minY:0}),selectionVisualBounds=b=>b,fitBarcodeSelectionBounds=b=>b,snapEditorValue=v=>v,clientToMm=(event,svg)=>new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse()),elementHandlesSVG=()=>'',objectOverflowsPaperShape=()=>false,renderEditorElements=()=>{},touchEditor=()=>{},updateUndoButtons=()=>{},flushPendingGestureRevision=()=>{};
      window.FrameInput={create(apply){return{push:apply,flush:event=>{if(event)apply(event);}};}};
      window.ObjectDistanceGuides={bounds:b=>({left:b.x,top:b.y,right:b.x+b.w,bottom:b.y+b.h}),nearest:()=>null,draw:()=>{}};
      window.SvgSelectionHandles={counterScaleResizeControls:(node,transform)=>node.setAttribute('transform',transform),preserveResizeStrokes:()=>{},restoreResizeControlTransforms:()=>{},restoreResizeStrokes:()=>{}};
      window.TransformHistory={remember:()=>{}};
      function drawEditorCanvas(){const svg=liveOverlay(),e=editing.elements[0],b=window.LabelPreview.computeBoxes(editing,{})[0];svg._editorBoxes=[b];svg.innerHTML='<g data-label-element="0">'+window.LabelPreview.renderElement(e,203,{},qrCache,{editorPlaceholders:true})+'</g><g data-editor-overlay="0"><rect class="sel" x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="none"/></g>';}
      ${helpers}
      ${drag}
      const results=[];
      for(const kind of ['qrcode','catalog'])for(const anchor of ['se','nw','e']){
        const item=kind==='qrcode'?{type:'qrcode',text:'',x_mm:25,y_mm:25,width_mm:20}:{type:'image',x_mm:25,y_mm:25,width_mm:20,height_mm:20,bitmap_width:${matrix.modules.size},bitmap_height:${matrix.modules.size},bitmap_hex:'${bytes.toString('hex')}',barcode_spec:{bcid:'qrcode',text:'sample',show_text:false}};
        editing={width_mm:200,height_mm:200,dpi:203,elements:[item]};editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const measure=()=>{const svg=liveOverlay(),a=svg.querySelector('[data-label-element]').getBoundingClientRect(),s=svg.querySelector('.sel').getBoundingClientRect();return {art:{x:a.x,y:a.y,w:a.width,h:a.height},selection:{x:s.x,y:s.y,w:s.width,h:s.height},width:editing.elements[0].width_mm};};
        const svg=liveOverlay(),b=svg._editorBoxes[0],m=svg.getScreenCTM(),p={se:[b.x+b.w,b.y+b.h],nw:[b.x,b.y],e:[b.x+b.w,b.y+b.h/2]}[anchor],d={se:[8,8],nw:[-8,-8],e:[8,0]}[anchor],start=new DOMPoint(...p).matrixTransform(m),end=new DOMPoint(p[0]+d[0],p[1]+d[1]).matrixTransform(m),event=(name,point)=>new PointerEvent(name,{clientX:point.x,clientY:point.y,button:0,buttons:1,pointerId:1});
        startDrag(event('pointerdown',start),0,'resize',anchor);window.dispatchEvent(event('pointermove',end));const live=measure();window.dispatchEvent(event('pointerup',end));const resized=measure();
        const current=liveOverlay(),box=current._editorBoxes[0],ctm=current.getScreenCTM(),from=new DOMPoint(box.x+box.w/2,box.y+box.h/2).matrixTransform(ctm),to=new DOMPoint(box.x+box.w/2+5,box.y+box.h/2+4).matrixTransform(ctm);
        startDrag(event('pointerdown',from),0,'move');window.dispatchEvent(event('pointermove',to));window.dispatchEvent(event('pointerup',to));results.push({kind,anchor,live,resized,moved:measure()});
      }return results;
    })()`);
    for(const item of result){for(const phase of ['live','resized','moved'])for(const key of ['x','y','w','h'])assert.ok(Math.abs(item[phase].art[key]-item[phase].selection[key])<1.5,`${item.anchor} ${phase} ${key}: ${JSON.stringify(item)}`);assert.ok(item.resized.width>20.1);assert.equal(item.moved.width,item.resized.width);}
    console.log('PASS QR browser gesture fixture '+JSON.stringify(result));win.destroy();app.exit(0);
  }catch(error){console.error(error);win.destroy();app.exit(1);}
});
