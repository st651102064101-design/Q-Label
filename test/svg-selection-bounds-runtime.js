const { app } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

app.setPath('appData', fs.mkdtempSync(path.join(os.tmpdir(), 'svg-selection-bounds-')));
app.on('browser-window-created', (_event, win) => {
  win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load', async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      const result = await win.webContents.executeJavaScript(`(async() => { try {
        window.hideProjectHome();
        const width=100,height=80,stride=Math.ceil(width/8),bytes=new Uint8Array(stride*height);
        for(let y=10;y<70;y++)for(let x=20;x<80;x++)bytes[y*stride+(x>>3)]|=128>>(x&7);
        editing={name:'SVG bounds test',width_mm:51,height_mm:25,dpi:203,margin_mm:{left:0,top:0},elements:[{
          type:'image',label:'padded-art.svg',source_format:'svg',svg_data:'<svg/>',
          x_mm:5,y_mm:4,width_mm:40,height_mm:32,bitmap_width:width,bitmap_height:height,
          bitmap_hex:Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('')
        }],values:{}};
        editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const rect=document.querySelector('#previewFrame .sel');
        if(!rect)throw Error('Selected SVG frame not rendered');
        const actual=['x','y','width','height'].map(key=>Number(rect.getAttribute(key)));
        const expected=[13,8,24,24];
        if(actual.some((value,index)=>Math.abs(value-expected[index])>.02))throw Error('SVG frame '+actual+' expected '+expected);
        const corners=[...document.querySelectorAll('#previewFrame circle.handle-dot[data-anchor]')];
        const anchors=corners.map(dot=>dot.dataset.anchor).sort();
        if(anchors.join(',')!=='ne,nw,se,sw')throw Error('SVG corner handles '+anchors+' expected all four corners');
        if(corners.some(dot=>getComputedStyle(dot).visibility!=='visible'))throw Error('SVG corner grip markers are not visible');
        editing={name:'Barcode handle test',width_mm:100,height_mm:60,dpi:203,margin_mm:{left:0,top:0},elements:[{type:'barcode128',text:'12345678',x_mm:30,y_mm:15,width_mm:40,height_mm:20,bar_height_mm:14,show_text:true}],values:{}};editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const barcodeMarkers=[...document.querySelectorAll('#previewFrame circle.handle-dot[data-anchor]')],visibleBarcodeAnchors=barcodeMarkers.filter(dot=>getComputedStyle(dot).visibility==='visible').map(dot=>dot.dataset.anchor).sort();
        if(visibleBarcodeAnchors.join(',')!=='ne,nw,se,sw')throw Error('Barcode visible corner markers '+visibleBarcodeAnchors+' expected all four corners');
        let barcode=editing.elements[0];const center=handle=>{const r=handle.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};},drag=(selector,dx,dy)=>{const handle=document.querySelector('#previewFrame [data-editor-overlay="0"] '+selector);if(!handle)throw Error('Missing drag control '+selector);const p=center(handle),hit=document.elementFromPoint(p.x,p.y);if(!hit?.closest(selector)){const hri=document.querySelector('#previewFrame [data-editor-overlay="0"] .hri-handle-hit'),hr=hri.getBoundingClientRect(),hp=center(hri);throw Error('Pointer hit test at '+selector+' returned '+(hit?.outerHTML||hit?.tagName||'nothing')+'; HRI center separation '+Math.hypot(p.x-hp.x,p.y-hp.y)+'px point '+JSON.stringify(p)+' HRI center '+JSON.stringify(hp)+' bounds '+JSON.stringify({x:hr.x,y:hr.y,w:hr.width,h:hr.height}));}const opts={bubbles:true,cancelable:true,button:0,buttons:1,pointerId:21};handle.dispatchEvent(new PointerEvent('pointerdown',{...opts,clientX:p.x,clientY:p.y}));window.dispatchEvent(new PointerEvent('pointermove',{...opts,clientX:p.x+dx,clientY:p.y+dy}));window.dispatchEvent(new PointerEvent('pointerup',{...opts,buttons:0,clientX:p.x+dx,clientY:p.y+dy}));};
        editing={name:'Resize control and stroke thickness',width_mm:100,height_mm:60,dpi:203,margin_mm:{left:0,top:0},elements:[{type:'box',label:'Rectangle',x_mm:20,y_mm:16,width_mm:30,height_mm:18,thickness_mm:.3,stroke_color:'#111',fill_color:'#fff',corner_radius_mm:3}],values:{}};editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const shape=editing.elements[0],shapeArt=()=>document.querySelector('#previewFrame [data-label-element="0"]'),shapeStroke=()=>shapeArt()?.querySelector('rect[stroke]'),shapeControls=()=>document.querySelector('#previewFrame [data-editor-overlay="0"]'),resizeDot=()=>shapeControls()?.querySelector('.handle-dot[data-anchor="ne"]'),shapeToolbar=()=>shapeControls()?.querySelector('.line-controls > g'),bounds=node=>{const r=node.getBoundingClientRect();return{width:r.width,height:r.height};},dotBefore=bounds(resizeDot()),toolbarBefore=bounds(shapeToolbar()),stroke=shapeStroke(),originalStrokeWidth=Number(stroke?.getAttribute('stroke-width'));
        if(!stroke||!resizeDot()||!shapeToolbar())throw Error('Resize stroke/controls fixture is incomplete');
        const shapeHandle=shapeControls().querySelector('.handle-hit[data-anchor="e"]'),shapePoint=center(shapeHandle),shapeOptions={bubbles:true,cancelable:true,button:0,buttons:1,pointerId:25};
        shapeHandle.dispatchEvent(new PointerEvent('pointerdown',{...shapeOptions,clientX:shapePoint.x,clientY:shapePoint.y}));window.dispatchEvent(new PointerEvent('pointermove',{...shapeOptions,clientX:shapePoint.x+70,clientY:shapePoint.y}));await new Promise(resolve=>setTimeout(resolve,140));
        const dotPreview=bounds(resizeDot()),toolbarPreview=bounds(shapeToolbar()),strokePreview=shapeStroke(),shapeSvg=document.querySelector('#previewFrame .canvaswrap > svg'),paperFill=shapeSvg.querySelector('rect[fill="#fff"]'),previewScale=Math.hypot(shapeSvg.getScreenCTM().a,shapeSvg.getScreenCTM().b);
        if(!paperFill||paperFill.getAttribute('clip-path')!=='url(#editor-paper-background-clip)')throw Error('Paper fill/clip is missing during Rectangle resize');
        if(Math.abs(dotPreview.width-dotBefore.width)>1||Math.abs(dotPreview.height-dotBefore.height)>1)throw Error('Corner resize marker stretched during preview: '+JSON.stringify({before:dotBefore,preview:dotPreview}));
        if(Math.abs(toolbarPreview.width-toolbarBefore.width)>2||Math.abs(toolbarPreview.height-toolbarBefore.height)>2)throw Error('Resize toolbar stretched during preview: '+JSON.stringify({before:toolbarBefore,preview:toolbarPreview}));
        if(strokePreview.getAttribute('vector-effect')!=='non-scaling-stroke'||Math.abs(Number(strokePreview.getAttribute('stroke-width'))-originalStrokeWidth)>.02)throw Error('Rectangle stroke thickness scaled with the object during preview: '+JSON.stringify({width:strokePreview.getAttribute('stroke-width'),vectorEffect:strokePreview.getAttribute('vector-effect'),expected:originalStrokeWidth*previewScale}));
        if(!(Number(shape.width_mm)>30))throw Error('Dragging the right resize handle did not widen the rectangle');
        window.dispatchEvent(new PointerEvent('pointerup',{...shapeOptions,buttons:0,clientX:shapePoint.x+70,clientY:shapePoint.y}));
        const committedStroke=shapeStroke();if(Math.abs(Number(committedStroke.getAttribute('stroke-width'))-originalStrokeWidth)>.001||committedStroke.hasAttribute('vector-effect'))throw Error('Resize stroke compensation remained after committing the geometry');
        editing={name:'Barcode handle test',width_mm:100,height_mm:60,dpi:203,margin_mm:{left:0,top:0},elements:[{type:'barcode128',text:'12345678',x_mm:30,y_mm:15,width_mm:40,height_mm:20,bar_height_mm:14,show_text:true}],values:{}};editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();barcode=editing.elements[0];
        const bottomHandle=()=>document.querySelector('#previewFrame [data-editor-overlay="0"] .handle-hit[data-anchor="s"]'),bottomBefore=Number(barcode.bar_height_mm),offsetBeforeBottom=Number(barcode.hri_offset_mm)||0;
        const barcodeArt=()=>document.querySelector('#previewFrame [data-label-element="0"]'),hriText=()=>barcodeArt()?.querySelector('text'),visualMetrics=()=>{const art=barcodeArt(),text=hriText(),bars=[...art.querySelectorAll('path,rect')].filter(node=>!node.hasAttribute('data-barcode-background')&&!node.hasAttribute('data-text-background')&&!node.closest('[data-barcode-hri]')).map(node=>node.getBoundingClientRect()).filter(rect=>rect.width>0&&rect.height>0);if(!text||!bars.length)throw Error('Barcode bars or HRI text are missing from the preview');const ink=text.getBoundingClientRect(),barBottom=Math.max(...bars.map(rect=>rect.bottom));return{hriHeight:ink.height,hriGap:ink.top-barBottom};};
        const originalHriMetrics=visualMetrics(),resizeHandle=bottomHandle(),resizePoint=center(resizeHandle),resizeOptions={bubbles:true,cancelable:true,button:0,buttons:1,pointerId:24};
        resizeHandle.dispatchEvent(new PointerEvent('pointerdown',{...resizeOptions,clientX:resizePoint.x,clientY:resizePoint.y}));window.dispatchEvent(new PointerEvent('pointermove',{...resizeOptions,clientX:resizePoint.x,clientY:resizePoint.y+24}));await new Promise(resolve=>setTimeout(resolve,140));
        const previewHriMetrics=visualMetrics();if(!(Number(barcode.bar_height_mm)>bottomBefore))throw Error('Dragging the white bottom resize handle did not extend the barcode bars: '+JSON.stringify({before:bottomBefore,current:barcode.bar_height_mm,boxHeight:barcode.height_mm,handle:bounds(resizeHandle),point:resizePoint}));if(Math.abs(previewHriMetrics.hriHeight-originalHriMetrics.hriHeight)>1)throw Error('HRI text height changed during Y resize: '+JSON.stringify({before:originalHriMetrics,preview:previewHriMetrics}));if(Math.abs(previewHriMetrics.hriGap-originalHriMetrics.hriGap)>2)throw Error('HRI text did not follow the resized bar bottom during preview: '+JSON.stringify({before:originalHriMetrics,preview:previewHriMetrics}));
        window.dispatchEvent(new PointerEvent('pointerup',{...resizeOptions,buttons:0,clientX:resizePoint.x,clientY:resizePoint.y+24}));const committedHriMetrics=visualMetrics();if(Math.abs(committedHriMetrics.hriHeight-originalHriMetrics.hriHeight)>1)throw Error('HRI text height changed after Y resize commit: '+JSON.stringify({before:originalHriMetrics,committed:committedHriMetrics}));if(Math.abs(committedHriMetrics.hriGap-originalHriMetrics.hriGap)>2)throw Error('HRI text did not follow the resized bar bottom after commit: '+JSON.stringify({before:originalHriMetrics,committed:committedHriMetrics}));if((Number(barcode.hri_offset_mm)||0)!==offsetBeforeBottom)throw Error('Dragging the white bottom resize handle unexpectedly moved the HRI text');if(!bottomHandle())throw Error('White bottom resize handle disappeared after resizing');
        const nwBefore={x:Number(barcode.x_mm),y:Number(barcode.y_mm),width:Number(barcode.width_mm),height:Number(barcode.height_mm)};drag('.handle-hit[data-anchor="nw"]',-20,-14);if(Number(barcode.x_mm)===nwBefore.x&&Number(barcode.y_mm)===nwBefore.y)throw Error('Dragging upper-left corner did not resize barcode');
        const offsetBefore=Number(barcode.hri_offset_mm)||0;let hriFrameVisibleDuringDrag=false;const updateHriControls=window.SvgSelectionHandles.updateHriControls;window.SvgSelectionHandles.updateHriControls=(...args)=>{const frame=updateHriControls(...args);hriFrameVisibleDuringDrag=activeObjectGesture&&!!frame;return frame;};drag('.hri-handle-hit',0,-18);window.SvgSelectionHandles.updateHriControls=updateHriControls;if(!(Number(barcode.hri_offset_mm)<offsetBefore))throw Error('Dragging HRI handle upward did not move the barcode number');if(!hriFrameVisibleDuringDrag)throw Error('Green barcode selection frame disappears during HRI drag');
        const angleBefore=Number(barcode.rotation_deg)||0;drag('.rotation-hit',25,0);if((Number(barcode.rotation_deg)||0)===angleBefore)throw Error('Dragging Rotate control did not rotate barcode');
        const xBefore=Number(barcode.x_mm),yBefore=Number(barcode.y_mm);drag('.line-move-hit',20,18);if(Number(barcode.x_mm)===xBefore&&Number(barcode.y_mm)===yBefore)throw Error('Dragging Move control did not move barcode');
        if(getComputedStyle(document.querySelector('#previewFrame [data-editor-overlay="0"] .hri-handle-dot')).visibility!=='visible')throw Error('Selected barcode yellow HRI handle marker is not visible');
        editing={name:'Barcode free rotation angle label',width_mm:100,height_mm:60,dpi:203,margin_mm:{left:0,top:0},elements:[{type:'barcode128',text:'12345678',x_mm:30,y_mm:24,width_mm:30,height_mm:10,bar_height_mm:10,show_text:false}],values:{}};editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const freeRotationHandle=document.querySelector('#previewFrame [data-editor-overlay="0"] .rotation-hit');if(!freeRotationHandle)throw Error('Free rotation test handle is missing');
        const freeRotationPoint=center(freeRotationHandle),freeRotationOptions={bubbles:true,cancelable:true,button:0,buttons:1,pointerId:23};
        freeRotationHandle.dispatchEvent(new PointerEvent('pointerdown',{...freeRotationOptions,clientX:freeRotationPoint.x,clientY:freeRotationPoint.y}));
        window.dispatchEvent(new PointerEvent('pointermove',{...freeRotationOptions,altKey:true,clientX:freeRotationPoint.x+6,clientY:freeRotationPoint.y}));await new Promise(resolve=>setTimeout(resolve,50));
        const freeAngleLabel=document.querySelector('#previewFrame .rotation-snap-label');if(!freeAngleLabel)throw Error('Rotation angle label is missing during free rotation');
        if(freeAngleLabel.textContent!==String(Math.round(Number(editing.elements[0].rotation_deg)||0))+'°')throw Error('Free rotation angle label '+freeAngleLabel.textContent+' does not match '+editing.elements[0].rotation_deg);
        if(document.querySelector('#previewFrame .rotation-snap-guide'))throw Error('Free rotation unexpectedly displays a snap guide');
        window.dispatchEvent(new PointerEvent('pointerup',{...freeRotationOptions,buttons:0,altKey:true,clientX:freeRotationPoint.x+6,clientY:freeRotationPoint.y}));
        editing={name:'Barcode overflow rotation preview',width_mm:100,height_mm:60,dpi:203,margin_mm:{left:0,top:0},elements:[{type:'barcode128',text:'12345678',x_mm:69,y_mm:24,width_mm:30,height_mm:10,bar_height_mm:10,show_text:false}],values:{}};editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const spill=document.querySelector('#previewFrame [data-overflow-highlight="0"]'),spillShape=document.querySelector('#previewFrame [data-overflow-highlight-shape="0"]'),rotationHandle=document.querySelector('#previewFrame [data-editor-overlay="0"] .rotation-hit');
        if(!spill||!spillShape||!rotationHandle)throw Error('Barcode rotation overflow preview controls are missing');
        if(spill.getAttribute('display')!=='none')throw Error('Barcode starts inside the paper but its overflow highlight is visible: '+JSON.stringify({box:document.querySelector('#previewFrame svg')._editorBoxes?.[0],element:editing.elements[0],path:spillShape.getAttribute('d')}));
        barcode=editing.elements[0];
        const initialSpillPath=spillShape.getAttribute('d'),rotationPoint=center(rotationHandle),rotateOptions={bubbles:true,cancelable:true,button:0,buttons:1,pointerId:22};
        rotationHandle.dispatchEvent(new PointerEvent('pointerdown',{...rotateOptions,clientX:rotationPoint.x,clientY:rotationPoint.y}));
        window.dispatchEvent(new PointerEvent('pointermove',{...rotateOptions,clientX:rotationPoint.x+25,clientY:rotationPoint.y}));await new Promise(resolve=>setTimeout(resolve,50));
        const liveAngleLabel=()=>document.querySelector('#previewFrame .rotation-snap-label');
        if(!liveAngleLabel())throw Error('Rotation angle label is missing during a snapped rotation preview');
        if(liveAngleLabel().textContent!==String(Math.round(Number(barcode.rotation_deg)||0))+'°')throw Error('Live angle label '+liveAngleLabel().textContent+' does not match current angle '+barcode.rotation_deg);
        if(!document.querySelector('#previewFrame .rotation-snap-guide'))throw Error('Existing magnetic angle snap guide is missing');
        const overflowPreview={angle:Number(editing.elements[0].rotation_deg)||0,path:spillShape.getAttribute('d'),display:spill.getAttribute('display')};
        if(Math.abs(overflowPreview.angle)<1)throw Error('Barcode did not rotate during live preview');
        if(overflowPreview.path===initialSpillPath)throw Error('Red barcode highlight path did not follow the live rotation');
        if(overflowPreview.display==='none')throw Error('Red barcode highlight stayed hidden after rotation moved it beyond the paper');
        if(liveAngleLabel().textContent!==String(Math.round(overflowPreview.angle))+'°')throw Error('Live angle label '+liveAngleLabel().textContent+' does not match the current rotation '+overflowPreview.angle);
        window.dispatchEvent(new PointerEvent('pointermove',{...rotateOptions,clientX:rotationPoint.x,clientY:rotationPoint.y}));await new Promise(resolve=>setTimeout(resolve,50));
        if((Number(editing.elements[0].rotation_deg)||0)!==0)throw Error('Returning the rotation pointer to its start should restore the barcode angle');
        if(liveAngleLabel().textContent!=='0°')throw Error('Live angle label did not update to 0° when rotation returned to start');
        if(spill.getAttribute('display')!=='none')throw Error('Red barcode highlight stayed visible after rotation returned inside the paper');
        window.dispatchEvent(new PointerEvent('pointerup',{...rotateOptions,buttons:0,clientX:rotationPoint.x,clientY:rotationPoint.y}));
        const resizeAnchors=[...document.querySelectorAll('#previewFrame .handle-hit[data-anchor]')].map(handle=>handle.dataset.anchor).filter(anchor=>['nw','ne','sw','se'].includes(anchor)).sort();
        if(resizeAnchors.join(',')!=='ne,nw,se,sw')throw Error('SVG corner resize targets '+resizeAnchors+' expected all four corners');
        return {svgSelectionFrame:actual,expected,visibleCornerAnchors:anchors,cornerResizeTargets:resizeAnchors,resizeStrokeAndControls:{dotBefore,dotPreview,toolbarBefore,toolbarPreview,previewStrokeWidth:Number(strokePreview.getAttribute('stroke-width')),committedStrokeWidth:Number(committedStroke.getAttribute('stroke-width'))},barcodeUpperLeftResize:true,barcodeBottomHandleResizesBars:true,barcodeBottomHandlePreservesHriOffset:true,barcodeHriSizeAndGapDuringResize:{before:originalHriMetrics,preview:previewHriMetrics,committed:committedHriMetrics},barcodeHriFrameVisibleDuringDrag:hriFrameVisibleDuringDrag,barcodeHriHandle:true,barcodeRotation:true,barcodeRotationFreeAngleLabel:true,barcodeRotationAngleLabel:true,barcodeRotationSnapGuide:true,barcodeRotationOverflowPreview:overflowPreview,barcodeRotationReturnsInside:true,barcodeMove:true};
      } catch(error) { return {runtimeError:error.stack||String(error)}; }
      })()`);
      if(result.runtimeError)throw new Error(result.runtimeError);
      console.log(JSON.stringify(result));
      app.exit(0);
    } catch (error) {
      console.error(error.stack);
      app.exit(1);
    }
  });
});
require('../gui/main');
