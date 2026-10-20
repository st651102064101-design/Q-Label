'use strict';
const {app}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-ruler-')));
const timeout=setTimeout(()=>{console.error('Ruler runtime timed out');app.exit(1);},45000);
app.on('browser-window-created',(_event,win)=>{
  const hide=()=>win.hide();win.on('show',hide);
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        hideProjectHome();autoSaveEnabled=false;document.body.classList.add('ruler-fixed');Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:2});
        editing={name:'Ruler check',width_mm:100,height_mm:80,dpi:203,unit:'in',margin_mm:{left:0,top:0},elements:[],values:{}};drawEditorCanvas();
        const samples=[],verticalLabels=[],originalH=RulerLabels.horizontal,originalV=RulerLabels.vertical,dpr=devicePixelRatio||1;
        const check=(context,x,y,axis)=>{
          const pixel=[...context.getImageData(Math.floor(x*dpr),Math.floor(y*dpr),1,1).data];
          if(pixel.join(',')!=='243,244,246,255')throw Error(axis+' label exposes dark/transparent background: '+pixel);
          if(!context.font.includes('15px'))throw Error(axis+' labels were not enlarged');
          samples.push({axis,pixel,font:context.font});
        };
        const checkOutsideNumber=(context,entry,axis,top,pad)=>{
          const span=context.measureText(entry.label).width+6,left=axis==='x'?Math.max(0,entry.pos-span/2):0,right=axis==='x'?Math.min(context.canvas.clientWidth||context.canvas.width/dpr,entry.pos+span/2):pad;
          const y=axis==='x'?top:Math.max(0,entry.pos-span/2),bottom=axis==='x'?top+pad:Math.min(context.canvas.height/dpr,entry.pos+span/2);
          const pixels=context.getImageData(Math.floor(left*dpr),Math.floor(y*dpr),Math.max(1,Math.ceil((right-left)*dpr)),Math.max(1,Math.ceil((bottom-y)*dpr))).data;
          let green=false;for(let i=0;i<pixels.length;i+=4)if(pixels[i+1]>80&&pixels[i+1]>pixels[i]*1.35&&pixels[i+1]>pixels[i+2]*1.15){green=true;break;}
          if(!green)throw Error(axis+' off-paper integer label was not painted: '+entry.label);
          if(axis==='y')for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>40&&pixels[i]<100&&pixels[i+1]<100&&pixels[i+2]<100)throw Error(axis+' off-paper coordinate '+entry.label+' has a dark tick crossing its digits');
          samples.push({axis,offPaper:true,label:entry.label});
        };
        RulerLabels.horizontal=(context,entry,top,pad)=>{originalH(context,entry,top,pad);if(entry.onPaper===false)checkOutsideNumber(context,entry,'x',top,pad);else check(context,entry.pos,top+1,'x');};
        RulerLabels.vertical=(context,entry,pad)=>{verticalLabels.push(entry.label);originalV(context,entry,pad);if(entry.onPaper===false)checkOutsideNumber(context,entry,'y',0,pad);else check(context,1,entry.pos,'y');};
        drawPreviewRuler();
        const frameForZero=document.getElementById('previewFrame');
        const runtimeWrap=frameForZero.querySelector('.canvaswrap'),savedRulerTransform=runtimeWrap.style.transform,initialFrame=frameForZero.getBoundingClientRect(),initialSvg=runtimeWrap.querySelector('svg').getBoundingClientRect(),visibleOriginTop=Math.max(0,(Number(document.getElementById('previewRuler').dataset.pointerTop)||0)-frameForZero.clientTop),initialOrigin=RulerLabels.verticalOrigin(initialSvg.top,initialFrame.top,frameForZero.clientTop);
        if(initialOrigin<visibleOriginTop)runtimeWrap.style.transform='translate(0px, '+(visibleOriginTop-initialOrigin+5)+'px)';drawPreviewRuler();
        for(const unit of ['in','mm','dots']){settings.unit=unit;editing.unit=unit;drawPreviewRuler();}
        runtimeWrap.style.transform=savedRulerTransform;drawPreviewRuler();
        RulerLabels.horizontal=originalH;RulerLabels.vertical=originalV;
        if(!samples.some(sample=>sample.axis==='x')||!samples.some(sample=>sample.axis==='y'))throw Error('Both ruler axes must have labels');
        const ruler=document.getElementById('previewRuler'),leftRuler=document.getElementById('previewLeftRuler'),frame=document.getElementById('previewFrame'),svg=frame.querySelector('.canvaswrap > svg'),fr=frame.getBoundingClientRect(),sr=svg.getBoundingClientRect(),pad=RulerLabels.THICKNESS,w=frame.clientWidth,h=frame.clientHeight,rulerTop=Number(ruler.dataset.pointerTop)||0,ox=sr.left-fr.left-frame.clientLeft,oy=RulerLabels.verticalOrigin(sr.top,fr.top,frame.clientTop);
        const leftHeight=parseFloat(leftRuler.style.height),leftTop=Math.max(0,rulerTop-frame.clientTop),expectedSpan=RulerLabels.visibleSpan(0,leftHeight,leftHeight,leftTop),clipValues=(leftRuler.style.clipPath.match(/[0-9.]+/g)||[]).map(Number);
        if(!verticalLabels.includes('0'))throw Error('Vertical ruler must display its zero label at the visible paper origin: '+JSON.stringify({verticalLabels,origin:oy,frameHeight:h,rulerTop,paperHeight:sr.height,leftHeight}));
        if(clipValues.length<3||Math.abs(clipValues[0]-expectedSpan.start)>.5||Math.abs(clipValues[2]-(leftHeight-expectedSpan.end))>.5)throw Error('Vertical ruler does not span the visible viewport below the navbar: '+leftRuler.style.clipPath);
        if(Math.abs(leftRuler.getBoundingClientRect().height-parseFloat(leftRuler.style.height))>.5)throw Error('Vertical ruler CSS height must match its clipped drawing height independently from device pixel ratio');
        const alpha=(canvas,x,y)=>canvas.getContext('2d').getImageData(Math.floor(x*dpr),Math.floor(y*dpr),1,1).data[3];
        const paperLeft=Math.max(pad,ox),paperRight=Math.min(w,ox+sr.width),outsideX=paperRight<w-8?paperRight+5:paperLeft>pad+8?paperLeft-5:null;
        if(outsideX===null||alpha(ruler,outsideX,rulerTop+pad-1)!==0)throw Error('Horizontal ruler outside the paper is not transparent');
        if(alpha(ruler,(paperLeft+paperRight)/2,rulerTop+pad-1)!==255)throw Error('Horizontal ruler over the paper lost its background');
        const pageTop=Math.max(rulerTop+pad,oy),pageBottom=Math.min(h,oy+sr.height),outsideY=pageBottom<h-8?pageBottom+5:pageTop>rulerTop+pad+8?pageTop-5:null;
        if(outsideY===null||alpha(leftRuler,pad-1,outsideY)!==0)throw Error('Vertical ruler outside the paper is not transparent');
        if(alpha(leftRuler,1,(pageTop+pageBottom)/2)!==255)throw Error('Vertical ruler over the paper lost its background');
        const wrap=frame.querySelector('.canvaswrap'),savedTransform=wrap.style.transform,outsideLabels=[];
        RulerLabels.vertical=(context,entry,thickness)=>{originalV(context,entry,thickness);if(entry.onPaper===false)outsideLabels.push(entry);};
        const outsideUnit=measureUnit(),outsideFactor=outsideUnit==='dots'?25.4/editing.dpi:outsideUnit==='in'?25.4:outsideUnit==='cm'?10:outsideUnit==='mil'?.0254:1,outsideScale=sr.height/svg.viewBox.baseVal.height*outsideFactor,outsideInterval=RulerLabels.labelInterval(outsideScale)*outsideScale,outsideShift=Math.max(180,rulerTop-oy+2*outsideInterval);wrap.style.transform='translate(0px, '+outsideShift+'px)';drawPreviewRuler();wrap.style.transform=savedTransform;drawPreviewRuler();RulerLabels.vertical=originalV;
        if(!outsideLabels.length)throw Error('Vertical ruler did not draw integer labels outside measured paper when viewport space was available');
        const originalFrameHeight=frame.style.height,originalFrameFlex=frame.style.flex;frame.style.flex='none';frame.style.height=Math.max(200,h-100)+'px';drawPreviewRuler();
        const reducedHeight=frame.clientHeight,reducedSvg=svg.getBoundingClientRect(),reducedOy=RulerLabels.verticalOrigin(reducedSvg.top,frame.getBoundingClientRect().top,frame.clientTop),push=Math.max(0,reducedHeight-(reducedOy+reducedSvg.height)+30);
        wrap.style.transform='translate(0px, '+push+'px)';drawPreviewRuler();
        const shiftedSvg=svg.getBoundingClientRect(),yTop=frame.getBoundingClientRect().top+frame.clientTop,paperBottom=shiftedSvg.bottom-yTop,expectedHeight=RulerLabels.visibleHeight(reducedHeight,paperBottom,window.innerHeight,yTop),actualHeight=parseFloat(leftRuler.style.height);
        if(Math.abs(actualHeight-expectedHeight)>.5||actualHeight<=reducedHeight)throw Error('Vertical ruler must extend to the visible paper bottom when the page continues below the frame: '+JSON.stringify({actualHeight,expectedHeight,reducedHeight,paperBottom}));
        wrap.style.transform=savedTransform;frame.style.height=originalFrameHeight;frame.style.flex=originalFrameFlex;drawPreviewRuler();
        const thickness=parseFloat(document.getElementById('previewLeftRuler').style.width);
        if(thickness!==19.5)throw Error('Ruler strip was not enlarged by 50%');
        return {thickness,fontSize:15,samples:samples.length,axes:['x','y'],units:['in','mm','dots'],paperBackground:true,outsidePaperTransparent:true,verticalRulerFillsViewport:true,zeroLabel:true,extendsToVisiblePaperBottom:true,outsidePaperNumbers:outsideLabels.length,visibleSpan:expectedSpan};
      })()`);
      win.removeListener('show',hide);win.showInactive();await new Promise(resolve=>setTimeout(resolve,200));
      const shot=await win.webContents.capturePage();fs.mkdirSync(path.join(__dirname,'..','test-results'),{recursive:true});fs.writeFileSync(path.join(__dirname,'..','test-results','ruler-appearance.png'),shot.toPNG());
      console.log('PASS '+JSON.stringify(result));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
