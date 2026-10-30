'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {supportsControl}=require('../gui/formatting-capabilities');
const {buildLabel}=require('../lib/render');

test('formatting toolbar stays visible with its commands disabled when no object is selected',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitToMm=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.editing={dpi:203,elements:[]};w.editorSel=-1;w.editorSelection=new Set();w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.sampleData=()=>({});
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  const panel=w.document.querySelector('.text-format-tools');
  assert.ok(panel,'formatting toolbar exists');assert.equal(panel.hidden,false,'formatting toolbar is not hidden without selection');
  assert.ok(panel.querySelectorAll(':disabled').length>0,'unsupported formatting controls remain visible but disabled');
  assert.ok([...panel.querySelectorAll(':disabled')].every(control=>w.getComputedStyle(control).display!=='none'),'all unavailable formatting controls remain visible');
  dom.window.close();
});

test('Auto Fit is available only when the selected object can apply it visibly',()=>{
  assert.equal(supportsControl({type:'text'},'text_auto_fit'),true);
  assert.equal(supportsControl({type:'barcode128',show_text:true},'text_auto_fit'),false);
  assert.equal(supportsControl({type:'barcode128',show_text:false},'text_auto_fit'),false);
  assert.equal(supportsControl({type:'image',barcode_spec:{show_text:true}},'text_auto_fit'),false);
});

test('barcode text formatting remains available while unsupported outline tools stay disabled',()=>{
  const barcode={type:'barcode128',show_text:true};
  assert.equal(supportsControl(barcode,'font_size_pt'),true);
  assert.equal(supportsControl(barcode,'text_align'),true);
  assert.equal(supportsControl(barcode,'text_box_width_mm'),true);
  assert.equal(supportsControl({type:'barcode128',show_text:false},'text_box_width_mm'),true,'barcode width does not depend on human-readable text being enabled');
  assert.equal(supportsControl(barcode,'line_style'),false);
  assert.equal(supportsControl(barcode,'thickness_mm'),false);
});

test('barcode W remains enabled and accepts 40.3 mm when human-readable text is hidden',async()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitToMm=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  const barcode={type:'barcode128',text:'12345678',x_mm:0,y_mm:0,module_width:2,bar_height_mm:12,show_text:false};
  w.editing={dpi:203,elements:[barcode]};w.editorSel=0;w.editorSelection=new Set();w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.sampleData=()=>({});w.barcodeModuleCount=()=>100;w.LabelPreview={computeBoxes:template=>[{w:template.elements[0].module_width*100/(203/25.4),h:12}]};
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  const width=w.document.querySelector('[aria-label="Width"]');
  assert.equal(width.disabled,false,'W is enabled for a barcode with hidden readable text');
  width.focus();width.value='40.3';width.dispatchEvent(new w.Event('input',{bubbles:true}));
  await new Promise(resolve=>w.setTimeout(resolve,0));
  assert.equal(width.disabled,false);assert.equal(width.value,'40.3','the entered W value remains visible while editing');
  assert.ok(barcode.module_width>=1,'the requested width updates the printer module width');
  dom.window.close();
});

test('barcode W=41.2 mm uses fractional module width consistently in preview and printer raster',async()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.ObjectData=require('../gui/object-data');w.Barcode=require('../gui/barcode');w.LabelBitmap=require('../gui/bitmap');
  w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:String(text).length*5})});
  w.mmToUnit=value=>Number(value);w.unitToMm=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;w.editing={dpi:203,width_mm:60,height_mm:40,elements:[{type:'barcode128',text:'12345678',x_mm:1,y_mm:2,module_width:2,bar_height_mm:12,hri_height_mm:3,show_text:true}]};
  w.editorSel=0;w.editorSelection=new Set();w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.sampleData=()=>({});
  w.barcodeModuleCount=elem=>w.Barcode.encode128B(w.ObjectData.resolve(elem,{})).reduce((sum,width)=>sum+width,0);
  w.mmToUnit=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  const barcode=w.editing.elements[0],width=w.document.querySelector('[aria-label="Width"]');
  width.focus();width.value='41.2';width.dispatchEvent(new w.Event('input',{bubbles:true}));
  await new Promise(resolve=>w.setTimeout(resolve,0));
  assert.equal(width.value,'41.2','the requested width stays visible while editing');
  assert.ok(Math.abs(barcode.module_width-41.2*203/25.4/w.barcodeModuleCount(barcode))<1e-9,'module width retains the fractional dot size needed for 41.2 mm');
  const box=w.LabelPreview.computeBoxes(w.editing,{})[0];
  assert.ok(Math.abs(box.w-41.2)<.01,`preview bounds match 41.2 mm (got ${box.w})`);
  const svg=w.LabelPreview.renderPreviewSVG(w.editing,{},null,{},{});
  assert.match(svg,/data-label-element="0"/,'barcode object is rendered in SVG preview');
  assert.match(svg,/width="41\.2\d*"/,'SVG barcode geometry uses the requested physical width');
  const zpl=buildLabel(w.editing,[{}]).toString();
  const graphic=zpl.match(/\^GFA,(\d+),\d+,(\d+),([A-F0-9]+)/);
  assert.ok(graphic,'printer output contains rasterized barcode data');
  const moduleCount=w.barcodeModuleCount(barcode),printedDots=Math.ceil(moduleCount*barcode.module_width-1e-9),stride=Number(graphic[2]);
  assert.equal(stride,Math.ceil(printedDots/8),'printer bitmap stride contains the requested width');
  assert.ok(Math.abs(printedDots-41.2*203/25.4)<=1,'printer raster width is within one physical dot of 41.2 mm');
  dom.window.close();
});

test('line thickness arrow step follows the displayed measurement unit without snapping to minimum',async()=>{
  for(const unit of ['mm','in','dots']){
    const factor=unit==='in'?25.4:unit==='dots'?25.4/600:1;
    const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
    w.measureUnit=()=>unit;w.measureDpi=()=>600;w.mmToUnit=value=>Number(value)/factor;w.unitToMm=value=>Number(value)*factor;w.unitSuffix=()=>unit;
    const line={type:'line',width_mm:20,height_mm:10,thickness_mm:10.16};
    w.editing={dpi:600,elements:[line]};w.editorSel=0;w.editorSelection=new Set();w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.sampleData=()=>({});
    w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
    const thickness=w.document.querySelector('[aria-label="Line thickness"]'),oneDot=w.mmToUnit(25.4/600);
    assert.equal(thickness.disabled,false);assert.equal(Number(thickness.step),oneDot);assert.equal(Number(thickness.min),0);
    const before=Number(line.thickness_mm);thickness.focus();thickness.stepDown();thickness.dispatchEvent(new w.Event('input',{bubbles:true}));
    await new Promise(resolve=>w.setTimeout(resolve,0));
    assert.ok(line.thickness_mm<before,`${unit}: one down-step reduces the line thickness`);
    assert.ok(Math.abs((before-line.thickness_mm)-25.4/600)<1e-8,`${unit}: down-step changes thickness by exactly one printer dot (before=${before}, after=${line.thickness_mm}, field=${thickness.value}, step=${thickness.step})`);
    assert.ok(Number(thickness.value)>Number(thickness.min),`${unit}: value does not jump to the minimum`);
    assert.ok(thickness.value.includes('.')?thickness.value.split('.')[1].length>=Math.min(8,String(oneDot).split('.')[1]?.length||0):!String(oneDot).includes('.'),'display precision retains the step resolution');
    const afterDown=line.thickness_mm;thickness.stepUp();thickness.dispatchEvent(new w.Event('input',{bubbles:true}));await new Promise(resolve=>w.setTimeout(resolve,0));
    assert.ok(Math.abs((line.thickness_mm-afterDown)-25.4/600)<1e-8,`${unit}: up-step changes thickness by exactly one printer dot`);
    thickness.value='0';thickness.dispatchEvent(new w.Event('input',{bubbles:true}));await new Promise(resolve=>w.setTimeout(resolve,0));
    assert.ok(Math.abs(line.thickness_mm-25.4/600)<1e-8,`${unit}: thickness remains above one printer dot`);assert.equal(Number(thickness.value),oneDot,`${unit}: input is clamped to the physical minimum`);
    dom.window.close();
  }
});

test('Line thickness control stays clear of the line-style selector',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitToMm=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.editing={dpi:203,elements:[{type:'line',width_mm:20,height_mm:10,thickness_mm:.3}]};w.editorSel=0;w.editorSelection=new Set();w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.sampleData=()=>({});
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  const thickness=w.document.querySelector('[aria-label="Line thickness"]'),wrapper=thickness.closest('label'),hint=wrapper.querySelector('span');
  assert.ok(wrapper.classList.contains('format-thickness-control'),'the thickness field has a dedicated layout wrapper');
  assert.ok(hint.classList.contains('format-unit-hint'),'the Line unit hint has a layout class');
  assert.equal(w.getComputedStyle(wrapper).flexShrink,'0','the Line unit and input cannot collapse over the preceding selector');
  assert.equal(w.getComputedStyle(wrapper).marginLeft,'8px','the Line control is shifted right from the line-style selector');
  assert.equal(w.getComputedStyle(hint).whiteSpace,'nowrap','the Line hint remains on one line');
  assert.equal(w.getComputedStyle(hint).flexShrink,'0','the Line hint keeps its full width');
  dom.window.close();
});

test('context-menu line-style grid reserves enough room before the Line thickness hint',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div><div id="context-format-test"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitToMm=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.fitPreviewPage=()=>{};w.fitObjects=()=>{};w.zoomRectangle=()=>{};
  w.editing={dpi:203,elements:[{type:'ellipse',width_mm:20,height_mm:10,thickness_mm:.3}]};w.editorSel=0;w.editorSelection=new Set();w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.sampleData=()=>({});
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/object-context-menu'),'utf8'));
  const host=w.document.querySelector('#context-format-test');w.buildContextFormattingTools(host);
  const row=host.querySelector('.ocm-shape-format .text-format-line:has(select[aria-label="Line style"])'),style=w.getComputedStyle(row),selector=row.querySelector('select[aria-label="Line style"]');
  assert.deepEqual([...selector.options].map(option=>[option.value,option.textContent]),[['solid','Solid'],['dot','Dot'],['dash','Dash'],['erase','Erase']],'object context menu exposes the same outline styles as the Ribbon');
  const columns=style.gridTemplateColumns.match(/\d+(?:\.\d+)?px/g).map(value=>parseFloat(value)),selectorWidth=parseFloat(w.getComputedStyle(selector).width),hintClearance=columns[0]+columns[1]+4+4+8-selectorWidth;
  assert.ok(hintClearance>=4,`Line hint must begin at least 4px after the ${selectorWidth}px selector (clearance: ${hintClearance}px)`);
  dom.window.close();
});

test('barcode vertical alignment changes the HRI position in the editor and printed ZPL',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.ObjectData=require('../gui/object-data');w.Barcode=require('../gui/barcode');w.LabelBitmap=require('../gui/bitmap');
  w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:String(text).length*5})});
  w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
  const barcode={type:'barcode128',text:'12345678',x_mm:1,y_mm:2,bar_height_mm:12,module_width:2,hri_height_mm:3,show_text:true};
  w.mmToUnit=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.editing={dpi:203,width_mm:60,height_mm:40,elements:[barcode]};w.editorSel=0;w.editorSelection=new Set();w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.sampleData=()=>({});
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  const control=w.document.querySelector('[aria-label="Vertical alignment"]');assert.equal(control.disabled,false,'barcode HRI can use vertical alignment');
  const editorTextY=()=>{const source=w.LabelPreview.renderPreviewSVG(w.editing,{},null,{},{}),svg=new w.DOMParser().parseFromString(source,'image/svg+xml');const node=[...svg.querySelectorAll('text')].find(text=>text.textContent==='12345678');assert.ok(node,'barcode HRI is rendered in the editor preview');return Number(node.getAttribute('y'));};
  const topY=editorTextY();
  for(const [align,expectedShift] of [['middle',1.5],['bottom',3],['top',0]]){
    control.value=align;control.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(barcode.vertical_align,align,'toolbar selection is saved to the barcode');
    assert.equal(barcode.hri_box_height_mm,6,'alignment reserves a readable text box');
    assert.ok(Math.abs(editorTextY()-(topY+expectedShift))<.02,align+' visibly moves HRI in the preview');
  }
  function printedHriY(align){const template={...w.editing,elements:[{...barcode,vertical_align:align}]};const zpl=buildLabel(template,[{}]).toString();const match=zpl.match(/\^FO\d+,(\d+)\^A0N/);assert.ok(match,'printer job contains a separately positioned human-readable line');return Number(match[1]);}
  const printedTop=printedHriY('top'),printedMiddle=printedHriY('middle'),printedBottom=printedHriY('bottom');
  assert.ok(printedMiddle>printedTop,'printed middle position differs from top');assert.ok(printedBottom>printedMiddle,'printed bottom position differs from middle');
  dom.window.close();
});

test('barcode fill scope can be selected for linear and catalog barcodes only',()=>{
  for(const barcode of [{type:'barcode128',show_text:true},{type:'image',barcode_spec:{show_text:true}}]){
    assert.equal(supportsControl(barcode,'barcode_fill_scope'),true);
  }
  assert.equal(supportsControl({type:'text'},'barcode_fill_scope'),false);
  assert.equal(supportsControl({type:'image'},'barcode_fill_scope'),false);
});

test('formatted text typography renders outline, small caps, width and inverse colors in SVG and printer canvas',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.ObjectData={resolve:element=>element.text};w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:text=>({width:String(text).length*5,actualBoundingBoxAscent:8,actualBoundingBoxDescent:2})});
  w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
  const el={type:'text',text:'Barcode',x_mm:1,y_mm:2,font_family:'Arial',font_size_pt:12,bold:true,italic:true,underline:true,strike:true,text_inverse:true,text_outline:true,text_outline_color:'#ff0000',text_outline_width_pt:1,text_width_percent:125,small_caps:true,script:'super',text_box_width_mm:30};
  const template={width_mm:50,height_mm:30,dpi:203,elements:[el]},markup=w.LabelPreview.renderPreviewSVG(template,{},null,{}),parsed=new w.DOMParser().parseFromString(markup,'image/svg+xml'),text=parsed.querySelector('text');
  assert.equal(text.getAttribute('font-family'),'Arial');assert.equal(text.getAttribute('font-variant'),'small-caps');assert.equal(text.getAttribute('stroke'),'#ff0000');assert.match(text.getAttribute('transform'),/scale\(1\.25 1\)/);assert.equal(text.getAttribute('fill'),'#fff');assert.match(text.getAttribute('text-decoration'),/underline/);assert.match(text.getAttribute('text-decoration'),/line-through/);
  const ops=[],ctx={font:'',fontVariantCaps:'normal',textBaseline:'',textAlign:'',save(){},restore(){},measureText:value=>({width:String(value).length*5}),fillRect(...args){ops.push(['fillRect',this.fillStyle,...args]);},strokeRect(){},fillText(value){ops.push(['fillText',value]);},strokeText(value){ops.push(['strokeText',value,this.strokeStyle]);},setLineDash(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},translate(){},scale(){}};
  w.LabelPreview.drawFormattedTextCanvas(ctx,el,'Barcode',0,0);
  assert.ok(ops.some(op=>op[0]==='fillRect'&&op[1]==='#000'),'inverse mode fills black background for printed barcode text');assert.ok(ops.some(op=>op[0]==='strokeText'&&op[2]==='#ff0000'),'outline is sent to printer raster');assert.ok(ops.some(op=>op[0]==='fillText'&&op[1]==='Barcode'),'filled text is drawn after the outline');assert.equal(ctx.fontVariantCaps,'small-caps');
  dom.window.close();
});

test('supported shape and table border tools remain enabled',()=>{
  const shape={type:'box'},table={type:'image',table_model:{}};
  for(const item of [shape,table]){
    assert.equal(supportsControl(item,'line_style'),true);
    assert.equal(supportsControl(item,'thickness_mm'),true);
  }
  assert.equal(supportsControl({type:'image',shape_preset:'ellipse'},'line_style'),true,'custom shapes expose line style controls');
  assert.equal(supportsControl({type:'image',shape_preset:'ellipse'},'fill_color'),true,'custom shapes expose fill controls');
});

test('outline style offers Solid, Dot, Dash, and Erase and preserves fill through undo, redo, and export',async()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  const outline={type:'ellipse',x_mm:2,y_mm:3,width_mm:20,height_mm:12,fill_color:'#22aa55',stroke_color:'#111111',thickness_mm:.5,line_style:'solid'};
  w.mmToUnit=value=>Number(value);w.unitToMm=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.ObjectData={resolve:element=>element.text};w.TableDesign=require('../gui/table-design');w.editing={dpi:203,width_mm:40,height_mm:30,elements:[outline]};w.editorSel=0;w.editorSelection=new Set();w.readEditorIntoDraft=()=>{};
  const history=require('../gui/edit-history');let undoStack=[],redoStack=[];
  w.pushSnapshot=()=>{const state=history.pushUndoSnapshot(undoStack,redoStack,w.editing);undoStack=state.undoStack;redoStack=state.redoStack;};
  w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.sampleData=()=>({});
  const canvasOps=[],ctx={fillRect(){},fill(){canvasOps.push(['fill']);},save(){},restore(){},beginPath(){},ellipse(){canvasOps.push(['ellipse']);},stroke(){canvasOps.push(['stroke']);},setLineDash(value){canvasOps.push(['dash',value.slice()]);},measureText:value=>({width:String(value).length*5,actualBoundingBoxAscent:8,actualBoundingBoxDescent:2})};
  w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  const style=w.document.querySelector('[aria-label="Line style"]');
  assert.deepEqual([...style.options].map(option=>[option.value,option.textContent]),[['solid','Solid'],['dot','Dot'],['dash','Dash'],['erase','Erase']]);
  const choose=async value=>{style.value=value;style.dispatchEvent(new w.Event('change',{bubbles:true}));await new Promise(resolve=>w.setTimeout(resolve,0));};
  await choose('erase');
  let svg=new w.DOMParser().parseFromString(w.LabelPreview.renderPreviewSVG(w.editing,{},null,{}),'image/svg+xml'),ellipse=svg.querySelector('ellipse');
  assert.equal(outline.line_style,'erase');assert.equal(ellipse.getAttribute('stroke'),'none');assert.equal(ellipse.getAttribute('fill'),'#22aa55','Erase removes only the outline');
  assert.ok(undoStack.length,'changing the outline creates an undo snapshot');
  assert.notEqual(history.revisionFingerprint({elements:[{...outline,line_style:'solid'}]}),history.revisionFingerprint({elements:[{...outline,line_style:'erase'}]}),'revision identity includes outline style');
  const current=history.cloneForUndo(w.editing),before=undoStack.pop();redoStack=[current];w.editing=history.cloneForUndo(before);
  assert.equal(w.editing.elements[0].line_style,'solid','undo restores the previous outline style');
  const redoState=history.cloneForUndo(w.editing);w.editing=history.cloneForUndo(redoStack.pop());undoStack.push(redoState);
  assert.equal(w.editing.elements[0].line_style,'erase','redo restores Erase');
  const erasedCanvas=w.LabelPreview.rasterizeCanvas(w.editing,{},null,{});assert.equal(erasedCanvas.width,320);assert.equal(canvasOps.filter(op=>op[0]==='stroke').length,0,'raster export does not draw an erased outline');
  assert.ok(canvasOps.some(op=>op[0]==='fill'),'raster export retains the ellipse fill');
  assert.doesNotMatch(buildLabel(w.editing,[{}]).toString(),/\^GE/,'printer output does not draw an erased ellipse outline');
  for(const item of [{type:'line',width_mm:12,height_mm:6},{type:'box',width_mm:12,height_mm:6,fill_color:'#22aa55'},{type:'ellipse',width_mm:12,height_mm:6,fill_color:'#22aa55'}]){
    const parsed=new w.DOMParser().parseFromString(w.LabelPreview.renderElement({...item,line_style:'erase'},203,{},{}),'image/svg+xml'),primitive=parsed.querySelector('line,rect,ellipse');
    assert.ok(primitive,`${item.type} is present in SVG output`);assert.equal(primitive.getAttribute('stroke'),'none',`${item.type} hides only its outline`);
  }
  const table={type:'image',x_mm:0,y_mm:0,width_mm:20,height_mm:10,table_model:{rows:[{size:10}],columns:[{size:20}],values:[['cell']],lineStyle:'Erase',stroke:.5,border:'#111111',fill:'#ffffff',fontSize:3,padding:1,borders:'All'}};
  const tableSvg=new w.DOMParser().parseFromString(w.LabelPreview.renderPreviewSVG({dpi:203,width_mm:20,height_mm:10,elements:[table]}, {},null,{}),'image/svg+xml');
  assert.ok(tableSvg.querySelector('rect'),'table cell fill remains rendered when Erase is selected');
  assert.ok([...tableSvg.querySelectorAll('path')].length>0);assert.ok([...tableSvg.querySelectorAll('path')].every(path=>path.getAttribute('stroke')==='none'),'table border paths remain hidden');
  await choose('dot');canvasOps.length=0;w.LabelPreview.rasterizeCanvas(w.editing,{},null,{});
  assert.ok(canvasOps.some(op=>op[0]==='dash'&&op[1].length===2),'Dot uses a dashed canvas stroke');
  svg=new w.DOMParser().parseFromString(w.LabelPreview.renderPreviewSVG(w.editing,{},null,{}),'image/svg+xml');assert.equal(svg.querySelector('ellipse').getAttribute('stroke-dasharray'),'0.4 0.8','SVG export retains the Dot style');
  dom.window.close();
});

test('live line color dragging coalesces SVG preview per frame without rebuilding or persisting',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"><div class="canvaswrap"><svg><g data-label-element="0"><line stroke="#111111"/></g></svg></div></div></body>',{runScripts:'dangerously',url:'http://localhost',pretendToBeVisual:true}),w=dom.window;
  let frameId=0;const frames=new Map();w.requestAnimationFrame=callback=>{frames.set(++frameId,callback);return frameId;};w.cancelAnimationFrame=id=>frames.delete(id);
  const line={type:'line',x_mm:1,y_mm:1,width_mm:10,height_mm:0,stroke_color:'#111111'};w.editing={dpi:203,elements:[line]};w.editorSel=0;w.editorSelection=new Set();w.mmToUnit=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;let snapshots=0,draws=0,renders=0,persists=0,touches=0;
  w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>snapshots++;w.renderEditorElements=()=>renders++;w.drawEditorCanvas=()=>draws++;w.touchEditor=()=>touches++;w.persistEditor=async()=>persists++;w.sampleData=()=>({});
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  const color=w.document.querySelector('input[type="color"]');assert.ok(color,'line stroke color control is present');
  for(const value of ['#d00000','#e00000','#cc1122']){color.value=value;color.dispatchEvent(new w.Event('input',{bubbles:true}));}
  assert.equal(line.stroke_color,'#cc1122','model tracks the latest color while dragging');assert.equal(snapshots,1,'one undo snapshot is captured for the entire drag');assert.equal(renders,0,'live drag skips full element rendering');assert.equal(draws,0,'live drag skips full canvas redraw');assert.equal(persists,0,'live drag does not persist each picker event');assert.equal(frames.size,1,'multiple input events queue a single frame');
  const [id,paint]=frames.entries().next().value;frames.delete(id);paint();assert.equal(w.document.querySelector('line').getAttribute('stroke'),'#cc1122','the frame preview applies the newest color directly to the line SVG');assert.equal(touches,1,'dirty state is updated once with the visual frame');dom.window.close();
});

test('removed Format Painter is not added to the formatting toolbar',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"><svg><rect class="hit" data-hit="1"/><rect class="hit" data-hit="2"/><rect class="hit" data-hit="3"/></svg></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.editing={elements:[{type:'text',text:'Source',font_family:'Arial',font_size_pt:18,bold:true,text_color:'#168040'},{type:'image'},{type:'text',text:'Target'}]};w.editorSel=0;w.editorSelection=new Set([0]);w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.setEditorStatus=(_status,text)=>{w.status=text;};w.sampleData=()=>({});
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  assert.equal(w.document.querySelector('.text-format-tools button[aria-label="Format painter"]'),null,'the removed painter control is absent');
  assert.equal(w.document.getElementById('previewFrame').classList.contains('format-painter-mode'),false,'the preview does not enter the removed painter mode');dom.window.close();
});

test('Full barcode fill extends behind the bars and remains available when readable text is hidden',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.ObjectData=require('../gui/object-data');w.Barcode=require('../gui/barcode');w.LabelBitmap=require('../gui/bitmap');w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:String(text).length*5})});
  w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
  const template={width_mm:60,height_mm:40,dpi:203,elements:[{type:'barcode128',x_mm:3,y_mm:2,width_mm:50,bar_height_mm:18,module_width:2,text:'12345678',show_text:true,text_background:'#e51515',barcode_fill_scope:'text'}]};
  w.editing=template;w.editorSel=0;w.editorSelection=new Set([0]);w.sampleData=()=>({});w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.setEditorStatus=()=>{};
  w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  const getBackground=()=>{const svg=new w.DOMParser().parseFromString(w.LabelPreview.renderPreviewSVG(template,{},null,{}),'image/svg+xml');return svg.querySelector('[data-barcode-background]');};
  let bg=getBackground();assert.equal(bg.getAttribute('data-fill-scope'),'text');assert.ok(Number(bg.getAttribute('y'))>2);
  const scope=w.document.querySelector('[aria-label="Barcode fill area"]');scope.value='all';scope.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(template.elements[0].barcode_fill_scope,'all','the toolbar stores the selected full-barcode scope');
  bg=getBackground();assert.equal(bg.getAttribute('data-fill-scope'),'all');assert.equal(Number(bg.getAttribute('y')),2);assert.ok(Number(bg.getAttribute('height'))>18);assert.equal(bg.getAttribute('fill'),'#e51515');
  template.elements[0].show_text=false;bg=getBackground();assert.equal(bg.getAttribute('data-fill-scope'),'all');assert.equal(Number(bg.getAttribute('y')),2);assert.equal(Number(bg.getAttribute('height')),18);
  template.elements[0].show_text=true;template.elements[0].barcode_fill_scope='text';bg=getBackground();assert.equal(bg.getAttribute('data-fill-scope'),'text');assert.ok(Number(bg.getAttribute('y'))>2);dom.window.close();
});

test('Full barcode fill appears immediately when a color is picked from No fill',async()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"><div class="canvaswrap"></div></div></body>',{runScripts:'dangerously',url:'http://localhost',pretendToBeVisual:true}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.ObjectData=require('../gui/object-data');w.Barcode=require('../gui/barcode');w.LabelBitmap=require('../gui/bitmap');w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:String(text).length*5})});
  const template={width_mm:60,height_mm:40,dpi:203,elements:[{type:'barcode128',x_mm:3,y_mm:2,bar_height_mm:18,module_width:2,text:'12345678',show_text:true,barcode_fill_scope:'all',text_background:'none'}]};w.editing=template;w.editorSel=0;w.editorSelection=new Set();w.sampleData=()=>({});w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{};w.renderEditorElements=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};
  w.drawEditorCanvas=()=>{w.document.querySelector('.canvaswrap').innerHTML=w.LabelPreview.renderPreviewSVG(template,{},null,{});};
  w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));w.drawEditorCanvas();
  assert.equal(w.document.querySelector('[data-barcode-background]'),null,'No fill has no full-barcode background element initially');
  const color=w.document.querySelectorAll('input[type="color"]')[1],noColor=w.document.querySelector('.format-no-color-indicator'),clear=w.document.querySelector('.format-no-fill');
  assert.ok(noColor&&!noColor.hidden&&noColor.querySelector('svg'),'No fill is shown with an SVG transparent-color mark on the swatch');assert.ok(clear.querySelector('svg'),'the No fill action has a matching SVG icon');assert.equal(clear.getAttribute('aria-label'),'No fill / transparent');
  color.value='#ca9b9b';color.dispatchEvent(new w.Event('input',{bubbles:true}));
  await new Promise(resolve=>w.setTimeout(resolve,40));
  const bg=w.document.querySelector('[data-barcode-background][data-fill-scope="all"]');assert.ok(noColor.hidden,'the no-color mark disappears after choosing a color');assert.ok(bg,'choosing a color creates a full barcode background while the picker is open');assert.equal(bg.getAttribute('fill'),'#ca9b9b');assert.equal(Number(bg.getAttribute('y')),2);assert.ok(Number(bg.getAttribute('height'))>18,'fill includes the bars and human-readable text');
  clear.click();await new Promise(resolve=>w.setTimeout(resolve,0));assert.equal(template.elements[0].text_background,'none','No fill restores transparent barcode fill');assert.equal(noColor.hidden,false,'the transparent-color SVG mark returns after selecting No fill');
  dom.window.close();
});

 test('Wrap only supports text and table, never barcode or non-text artwork',()=>{
 for(const type of ['barcode128','code39','code93','ean13','qrcode','datamatrix','image','box','ellipse','line','inverse'])assert.equal(supportsControl({type,show_text:true},'text_wrap'),false,type);
 assert.equal(supportsControl({type:'image',barcode_spec:{show_text:true}},'text_wrap'),false);assert.equal(supportsControl({type:'text'},'text_wrap'),true);assert.equal(supportsControl({type:'image',table_model:{}},'text_wrap'),true);
 });
