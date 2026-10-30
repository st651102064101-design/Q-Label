const {app,screen}=require('electron'),fs=require('fs'),os=require('os'),path=require('path');
const root=process.env.QLABEL_PERF_ROOT||path.resolve(__dirname,'..'),baseline=!!process.env.QLABEL_PERF_BASELINE;
const isolated=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-gesture-'));app.setPath('appData',isolated);
const timeout=setTimeout(()=>{console.error('Gesture benchmark timed out');app.exit(1);},90000);
app.on('browser-window-created',(_,win)=>{
  win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    try{
      await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const start=performance.now();const wait=()=>{if(!appInitializing)resolve();else if(performance.now()-start>20000)reject(Error('Startup timed out'));else setTimeout(wait,50);};wait();})`);
      win.showInactive();
      const display=screen.getDisplayMatching(win.getBounds());
      const result=await win.webContents.executeJavaScript(`(async()=>{
        window.hideProjectHome();autoSaveEnabled=false;editorGrid.snap=false;
        const nativeFrame=requestAnimationFrame.bind(window),nativeCancel=cancelAnimationFrame.bind(window);
        const percentile=(list,p)=>[...list].sort((a,b)=>a-b)[Math.min(list.length-1,Math.floor(list.length*p))]||0;
        const axis=()=>({mode:'Fixed',size:8,min:.1,max:254,weight:100,align:'Start'});
        const scene=()=>({name:'Gesture benchmark',width_mm:150,height_mm:100,dpi:203,unit:'mm',margin_mm:{left:0,top:0},values:{},elements:[
          {type:'box',x_mm:8,y_mm:8,width_mm:18,height_mm:12,thickness_mm:.3},
          {type:'text',text:'Text resize',font_family:'Arial',font_size_pt:14,x_mm:8,y_mm:28,text_scale_x:1,text_scale_y:1},
          {type:'image',x_mm:45,y_mm:8,width_mm:32,height_mm:24,table_model:{rows:Array.from({length:3},axis),columns:Array.from({length:4},axis),values:[['2','Text','Thai ทดสอบ',''],['Long content wraps','1','',''],['','','','']],padding:.5,fontSize:3,stroke:.175,border:'#000',fill:'#fff',borders:'All',errors:{clip:true}}},
          {type:'image',x_mm:90,y_mm:8,width_mm:16,height_mm:16,bitmap_width:8,bitmap_height:8,bitmap_hex:'FF818181818181FF'},
          ...Array.from({length:26},(_,i)=>({type:'box',x_mm:5+i%8*17,y_mm:55+Math.floor(i/8)*11,width_mm:10,height_mm:8,thickness_mm:.3}))]});
        const results=[];
        for(const [name,index,mode] of [['move',0,'move'],['text-move',1,'move'],['table-move',2,'move'],['box-resize',0,'resize'],['text-resize',1,'resize'],['table-resize',2,'resize'],['image-resize',3,'resize']]){
          editing=scene();current=null;editorSelection=new Set([index]);editorSel=index;drawEditorCanvas();
          const svg=liveOverlay(),rect=svg.querySelector('[data-hit="'+index+'"]').getBoundingClientRect(),x=mode==='move'?rect.left+rect.width/2:rect.right,y=mode==='move'?rect.top+rect.height/2:rect.bottom;
          const originalDraw=drawEditorCanvas,originalBake=TableTools.bake;let rebuilds=0,bakes=0,callbackMs=[];
          drawEditorCanvas=(...args)=>{rebuilds++;return originalDraw(...args);};TableTools.bake=(...args)=>{bakes++;return originalBake(...args);};
          window.requestAnimationFrame=callback=>nativeFrame(t=>{const began=performance.now();callback(t);callbackMs.push(performance.now()-began);});
          startDrag(new PointerEvent('pointerdown',{clientX:x,clientY:y,button:0,pointerId:1}),index,mode,'se');
          const intervals=[];let last=null;
          for(let frame=0;frame<180;frame++){
            const t=await new Promise(nativeFrame);if(last!==null&&frame>30)intervals.push(t-last);last=t;
            for(let burst=0;burst<8;burst++)liveOverlay().querySelector('[data-hit="'+index+'"]').dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x+20+Math.sin(frame/15)*15+burst*.1,clientY:y+10+Math.cos(frame/17)*8,buttons:1,pointerId:1}));
          }
          await new Promise(nativeFrame);
          const during={rebuilds,bakes,scenePreserved:liveOverlay()===svg,unrelatedNodePreserved:liveOverlay()?.querySelector('[data-label-element="10"]')===svg.querySelector('[data-label-element="10"]')};
          if(${baseline?'false':'true'}&&index===2&&mode==='resize'){
            const object=editing.elements[index],expected=document.createElementNS('http://www.w3.org/2000/svg','svg');expected.innerHTML=LabelPreview.renderElement(object,editing.dpi,sampleData(editing),qrCache,{interactive:true});
            const signature=node=>[...node.querySelectorAll('rect,text,path,svg')].map(n=>({tag:n.localName,text:n.localName==='text'?n.textContent:undefined,attrs:['x','y','width','height','viewBox','d','font-size','text-anchor'].map(key=>n.getAttribute(key))}));
            if(JSON.stringify(signature(svg.querySelector('[data-label-element="2"]')))!==JSON.stringify(signature(expected)))throw Error('Incremental table layout differs from a complete render');
            during.tableGeometryMatchesFullRender=true;
          }
          window.dispatchEvent(new PointerEvent('pointerup',{clientX:x+35,clientY:y+25,button:0,pointerId:1}));
          window.requestAnimationFrame=nativeFrame;drawEditorCanvas=originalDraw;TableTools.bake=originalBake;
          results.push({name,...during,medianMs:percentile(intervals,.5),p95Ms:percentile(intervals,.95),averageHz:1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length),frameWorkP95Ms:percentile(callbackMs,.95),maxFrameWorkMs:Math.max(...callbackMs),finalWidth:editing.elements[index].width_mm,finalX:editing.elements[index].x_mm});
          if(${baseline?'false':'true'}&&(!during.scenePreserved||during.rebuilds!==0||during.bakes!==0))throw Error(name+': scene rebuild/rasterization during gesture '+JSON.stringify(during));
          if(${baseline?'false':'true'}){
            if(activeObjectGesture)throw Error('Gesture stays active after pointerup');
            if(mode==='resize'&&index===0&&editing.elements[index].width_mm<=19.5)throw Error('Resize did not flush the pointerup position');
            if(index===2&&editing.elements[index].table_baked_size!==editing.elements[index].width_mm+','+editing.elements[index].height_mm)throw Error('Table raster was not committed on pointerup');
          }
        }
        if(${baseline?'false':'true'}){
          editing=scene();editorSelection=new Set([0]);editorSel=0;drawEditorCanvas();const svg=liveOverlay(),rect=svg.querySelector('[data-hit="0"]').getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
          const initial={x:editing.elements[0].x_mm,y:editing.elements[0].y_mm};startDrag(new PointerEvent('pointerdown',{clientX:x,clientY:y,button:0}),0,'move');window.dispatchEvent(new PointerEvent('pointermove',{clientX:x+100,clientY:y+80}));await new Promise(nativeFrame);window.dispatchEvent(new PointerEvent('pointerup',{clientX:x,clientY:y,button:0}));
          if(Math.abs(editing.elements[0].x_mm-initial.x)>.01||Math.abs(editing.elements[0].y_mm-initial.y)>.01)throw Error('Returning the pointer to its origin left a stale transform '+JSON.stringify({initial,actual:editing.elements[0],rect:{x,y}}));
        }
        if(${baseline?'false':'true'}){
          const snapScene=()=>({name:'Snap gesture',width_mm:100,height_mm:80,dpi:203,unit:'mm',margin_mm:{left:0,top:0},values:{},elements:[{type:'ellipse',x_mm:8.13,y_mm:8.17,width_mm:18,height_mm:12,thickness_mm:.3}]});
          const gesture=(enabled,mode)=>{
            editing=snapScene();editorGrid.snap=enabled;editorGrid.step=.5;editorSelection=new Set([0]);editorSel=0;drawEditorCanvas();
            const svg=liveOverlay(),box=svg._editorBoxes.find(item=>item.index===0),matrix=svg.getScreenCTM(),toClient=(px,py)=>new DOMPoint(px,py).matrixTransform(matrix),start=mode==='move'?{x:box.x+box.w/2,y:box.y+box.h/2}:{x:box.x+box.w,y:box.y+box.h},from=toClient(start.x,start.y),end=toClient(start.x+.23,start.y+.23);
            startDrag(new PointerEvent('pointerdown',{clientX:from.x,clientY:from.y,button:0,pointerId:9}),0,mode,mode==='resize'?'se':null);
            window.dispatchEvent(new PointerEvent('pointermove',{clientX:end.x,clientY:end.y,buttons:1,pointerId:9}));
            window.dispatchEvent(new PointerEvent('pointerup',{clientX:end.x,clientY:end.y,button:0,pointerId:9}));
            return {element:{...editing.elements[0]},box:LabelPreview.computeBoxes(editing,sampleData(editing))[0]};
          };
          const movedOn=gesture(true,'move'),movedOff=gesture(false,'move');
          if(Math.abs(movedOn.element.x_mm-8.5)>.03||Math.abs(movedOn.element.y_mm-8.5)>.03)throw Error('Snap-on move did not align the object to the half-millimeter grid '+JSON.stringify(movedOn));
          if(Math.abs(movedOff.element.x_mm-8.36)>.03||Math.abs(movedOff.element.y_mm-8.40)>.03)throw Error('Snap-off move was not free '+JSON.stringify(movedOff));
          const resizedOn=gesture(true,'resize'),resizedOff=gesture(false,'resize');
          if(Math.abs((resizedOn.box.x+resizedOn.box.w)-26.5)>.03||Math.abs((resizedOn.box.y+resizedOn.box.h)-20.5)>.03)throw Error('Snap-on resize did not place the dragged corner on the half-millimeter grid '+JSON.stringify(resizedOn));
          if(Math.abs((resizedOff.box.x+resizedOff.box.w)-26.4)>.03||Math.abs((resizedOff.box.y+resizedOff.box.h)-20.4)>.03)throw Error('Snap-off resize did not retain the existing 0.1 mm precision without applying the configured grid '+JSON.stringify(resizedOff));
          editorGrid.snap=false;
        }
        return results;
      })()`);
      const report={baseline,display:{id:display.id,frequency:display.displayFrequency,scaleFactor:display.scaleFactor},results:result};
      if(!baseline&&display.displayFrequency>0){const budget=1000/display.displayFrequency;for(const sample of result){if(sample.medianMs>budget*1.15||sample.averageHz<display.displayFrequency*.95||sample.frameWorkP95Ms>budget)throw Error(sample.name+': missed display frame budget '+JSON.stringify(sample));}}
      const destination=path.join(__dirname,baseline?'object-gesture-baseline.json':'object-gesture-result.json');fs.writeFileSync(destination,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require(path.join(root,'gui','main'));
