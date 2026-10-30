const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const api=require('../gui/tool-placement');
function source(html){return new JSDOM(html).window.document.body.firstElementChild;}
for(const type of ['code39','barcode128','code93','ean13','text','box','ellipse','line','inverse','qrcode','datamatrix','image','svg']){
  test(type+' supports sidebar and navbar placement',()=>{
    for(const attr of ['data-add','data-insert-tool'])assert.deepEqual(api.payload(source(`<button ${attr}="${type}"></button>`)),{kind:'tool',value:type});
  });
}
test('recent objects retain full object data',()=>{const node=source('<button></button>');node._placementElement={type:'image',bitmap_hex:'ff'};assert.deepEqual(api.payload(node),{kind:'recent-object',value:node._placementElement});});
test('dragging a recent object activates its payload and transfers a copy to the label canvas',()=>{
  const element={type:'shape',shape_preset:'plus',width_mm:12,height_mm:12};
  const transfer={effectAllowed:'',items:{},setData(type,value){this.items[type]=value;},getData(type){return this.items[type]||'';}};
  const payload=api.beginRecentObjectDrag({dataTransfer:transfer},element);
  assert.deepEqual(payload,{kind:'recent-object',value:element});
  assert.equal(transfer.effectAllowed,'copy');
  assert.deepEqual(JSON.parse(transfer.getData('application/x-bratender-insert')),payload);
});
test('recent object drag reaches the production drop handler and produces a selectable visible shape',()=>{
  const dom=new JSDOM('<div id="insertSidebar"><div id="recentObjectTools"><button class="insert-tool" draggable="true"><svg><path/></svg></button></div></div><div id="previewFrame"><div class="canvaswrap"><svg class="overlay"></svg></div></div>',{runScripts:'outside-only'}),w=dom.window,d=w.document;
  const code=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
  w.eval(`var editing={width_mm:100,height_mm:100,dpi:203,elements:[]};var settings={};var activeInsertPayload=null,editorSel=null,editorSelection=new Set();function el(id){return document.getElementById(id)}function readEditorIntoDraft(){}function pushSnapshot(){}function sampleData(){return {}}function snapVal(v){return v}function liveOverlay(){return document.querySelector('svg.overlay')}function clientToMm(e){return {x:e.clientX,y:e.clientY}}function noteRecentObjectUsage(){}function renderEditorElements(){}function touchEditor(){}function drawEditorCanvas(){document.querySelector('svg.overlay').innerHTML=editing.elements.map((e,i)=>'<g data-label-element="'+i+'">'+window.ShapeTools.render(e,e.x_mm,e.y_mm)+'</g>').join('')}`);
  w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:21600,height:21600});
  for(const file of ['shape-definitions','shape-tools'])w.eval(fs.readFileSync(require.resolve('../gui/'+file),'utf8'));
  w.ToolPlacement=api;w.LabelPreview={computeBoxes:()=>[{w:20,h:15}]};w.ObjectNames={assign(){}};
  const svg=d.querySelector('svg.overlay');svg.getBoundingClientRect=()=>({left:0,top:0,right:100,bottom:100});
  const button=d.querySelector('button'),element={type:'image',shape_preset:'plus',width_mm:20,height_mm:15,stroke_color:'#111111',fill_color:'none'};
  button.addEventListener('dragstart',event=>{w.eval('activeInsertPayload=null');w.payload=api.beginRecentObjectDrag(event,element);w.eval('activeInsertPayload=window.payload');});
  const start=code.indexOf("  document.addEventListener('dragstart',event=>{",code.indexOf("const insertPane=el('insertSidebar'),frame=el('previewFrame')"));
  const end=code.indexOf('\n  onConnTypeChange();',start);assert.ok(start>=0&&end>start);
  w.eval(`(()=>{const frame=el('previewFrame');${code.slice(start,end)} })()`);
  const transfer={items:{},setData(k,v){this.items[k]=v},getData(k){return this.items[k]||''}};
  const fire=(node,type,x,y)=>{const event=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(event,{dataTransfer:transfer,clientX:x,clientY:y});node.dispatchEvent(event);return event;};
  fire(button,'dragstart',0,0);assert.equal(fire(svg,'dragover',50,50).defaultPrevented,true,'canvas accepts the drag');
  fire(svg,'drop',50,50);const item=w.eval('editing.elements[0]');assert.equal(w.eval('editing.elements.length'),1);assert.equal(item.shape_preset,'plus');assert.equal(item.x_mm,40);assert.equal(item.y_mm,42.5);assert.equal(w.eval('editorSel'),0);assert.ok(svg.querySelector('[data-label-element="0"] path'),'shape is visible in canvas');
  assert.equal(JSON.parse(JSON.stringify(w.eval('editing'))).elements[0].shape_preset,'plus','shape survives serialized roundtrip');
  dom.window.close();
});
test('symbol, shape, field and object value payloads',()=>{
  for(const [attr,value,kind,expected] of [['tis-symbol-index','2','tis-symbol',2],['shape-preset','star','shape-preset','star'],['source-field','Name','field','Name'],['source-text','','object-value','']])assert.deepEqual(api.payload(source(`<button data-${attr}="${value}"></button>`)),{kind,value:expected});
});
test('catalog specification is obtained at click time',()=>{const node=source('<button></button>');let text='A';node._placementPayload=()=>({kind:'catalog-barcode',value:{bcid:'code128',text}});text='B';assert.equal(api.payload(node).value.text,'B');});
test('non tools are ignored',()=>assert.equal(api.payload(source('<button>File</button>')),null));
test('rectangle ghost remains an outline and original icon is unchanged',()=>{const node=source('<button><svg fill="none" stroke="#123"><rect width="20" height="20"/></svg></button>');const original=node.innerHTML;const ghost=api.ghost(node,node.ownerDocument);assert.equal(ghost.getAttribute('fill'),'none');assert.equal(ghost.getAttribute('stroke'),'#123');assert.equal(node.innerHTML,original);});
test('explicit barcode fills and image previews survive cloning',()=>{const node=source('<button><svg fill="black"><path d="M0 0"/></svg></button>');assert.equal(api.ghost(node,node.ownerDocument).getAttribute('fill'),'black');const image=source('<button><img src="symbol.svg"/></button>');assert.equal(api.ghost(image,image.ownerDocument).getAttribute('src'),'symbol.svg');});
test('field ghost shows one short value word and truncates long values',()=>{
  assert.equal(api.ghostLabel('N'),'N');
  assert.equal(api.ghostLabel('new york'),'new...');
  assert.equal(api.ghostLabel('supercalifragilistic'),'supercalifragili...');
  assert.equal(api.ghostLabel('','Text'),'Text');
});
test('inverse placement aligns its first bottom edge to the object under the drop point',()=>{
  const inverse={type:'inverse',height_mm:12};
  assert.equal(api.alignInverseToBottom(inverse,{y:21.25,h:30.5},2.5),true);
  assert.equal(inverse.y_mm,37.25);
  assert.equal(inverse.y_mm+2.5+inverse.height_mm,51.75);
});
test('inverse bottom alignment ignores other element types and invalid bounds',()=>{
  const text={type:'text',height_mm:4};
  assert.equal(api.alignInverseToBottom(text,{y:10,h:20}),false);
  assert.equal(api.alignInverseToBottom({type:'inverse',height_mm:12},{y:NaN,h:20}),false);
});
function fixture(){
  const dom=new JSDOM('<div id="insertSidebar"><button class="insert-tool" data-add="code39"><svg fill="none"><path/></svg></button></div><div id="previewFrame"><svg></svg></div>',{runScripts:'outside-only'}),w=dom.window;
  w.structuredClone=structuredClone;
  w.ToolPlacement=api;w.requestAnimationFrame=fn=>{w.queued=fn;return 1;};w.cancelAnimationFrame=()=>{w.queued=null;};
  w.eval(`var el=id=>document.getElementById(id);var editing={elements:[]};var activeInsertPayload=null;function pastePointFromEvent(e){return {x:e.clientX,y:e.clientY};}function liveOverlay(){return document.querySelector('#previewFrame svg');}`);
  const code=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');w.eval(code.slice(code.indexOf('let sidebarPlacement='),code.indexOf('let editorGrid =')).replace('let sidebarPlacement=', 'var sidebarPlacement='));
  const defaults=code.slice(code.indexOf('const insertElementDefaults='),code.indexOf('let textClickTimer=')).replace('const insertElementDefaults=','window.insertElementDefaults=');
  w.eval(defaults);
  w.createInsertElementDraft=type=>({...w.insertElementDefaults[type]});
  return {w,doc:w.document,button:w.document.querySelector('button')};
}
test('click arms tool without inserting; pointer follows and Escape cancels',()=>{const {w,doc,button}=fixture();button.focus();button.click();assert.equal(doc.activeElement,doc.body);assert.equal(w.eval('editing.elements.length'),0);assert.equal(w.eval('sidebarPlacement.payload.value'),'code39');doc.dispatchEvent(new w.MouseEvent('pointermove',{clientX:100,clientY:150,bubbles:true}));w.queued();assert.equal(w.eval('placementGhost.style.transform'),'translate(112px,162px)');doc.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(w.eval('sidebarPlacement'),null);assert.equal(w.eval('placementGhost'),null);});
test('select another tool replaces previous ghost and native drag cancels placement',()=>{const {w,doc,button}=fixture();button.click();const first=w.eval('placementGhost');button.dataset.add='box';button.click();assert.equal(first.isConnected,false);assert.equal(w.eval('sidebarPlacement.payload.value'),'box');button.dispatchEvent(new w.Event('dragstart',{bubbles:true}));assert.equal(w.eval('sidebarPlacement'),null);});
function gestureFixture(){
  const f=fixture(),{w,doc}=f;w.DOMPoint=class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}};
  doc.querySelector('#previewFrame svg').getScreenCTM=()=>({inverse(){return this;}});
  w.eval('var qrCache={};var formSize=null;function sampleData(){return {};}function applyElementBox(item,box){Object.assign(item,box);}function renderEditorElements(){formSize={w:editing.elements[0].w,h:editing.elements[0].h};}function drawEditorCanvas(){}function touchEditor(){}');
  w.LineGeometry=require('../gui/line-geometry');w.LabelPreview={computeBoxes:()=>[{index:0,x:0,y:0,w:10,h:10}],renderElement:()=>'<rect width="10" height="10"/>'};
  doc.getElementById('previewFrame').addEventListener('drop',e=>{const payload=JSON.parse(e.dataTransfer.getData());w.eval(payload.value==='line'?'editing.elements.push({...window.insertElementDefaults.line})':payload.value==='inverse'?'editing.elements.push({...window.insertElementDefaults.inverse})':'editing.elements.push({})');w.dropped={x:e.clientX,y:e.clientY};});return f;
}
for(const [name,start,end]of [['forward',[10,20],[40,60]],['reverse',[40,60],[10,20]]])test('drag '+name+' sizes once on release',()=>{
  const {w,doc,button}=gestureFixture();button.click();const frame=doc.getElementById('previewFrame');
  frame.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0,clientX:start[0],clientY:start[1]}));
  assert.equal(w.eval('editing.elements.length'),0);
  w.dispatchEvent(new w.MouseEvent('pointerup',{clientX:end[0],clientY:end[1]}));
  assert.equal(w.eval('editing.elements.length'),1);assert.deepEqual(w.dropped,{x:10,y:20});assert.equal(w.eval('editing.elements[0].w'),30);assert.equal(w.eval('editing.elements[0].h'),40);
  assert.equal(w.eval('formSize.w'),30);assert.equal(w.eval('formSize.h'),40);
  doc.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  w.eval('Object.assign(editing.elements[0],formSize)');
  assert.equal(w.eval('editing.elements[0].w'),30);assert.equal(w.eval('editing.elements[0].h'),40);
});
test('cancel drawing never inserts an object',()=>{const {w,doc,button}=gestureFixture();button.click();doc.getElementById('previewFrame').dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,clientX:10,clientY:20}));w.dispatchEvent(new w.Event('pointercancel'));w.dispatchEvent(new w.MouseEvent('pointerup',{clientX:30,clientY:40}));assert.equal(w.eval('editing.elements.length'),0);});
test('drag-sized inverse keeps its bottom aligned with the object under the initial drop point',()=>{
  const {w,doc,button}=gestureFixture();button.dataset.add='inverse';
  const hit=doc.createElementNS('http://www.w3.org/2000/svg','g');hit.setAttribute('class','hit');hit.dataset.hit='0';doc.querySelector('#previewFrame svg').append(hit);
  w.eval(`editing={width_mm:50,height_mm:30,dpi:203,margin_mm:{top:2},elements:[{type:'box',x_mm:8,y_mm:10,width_mm:25,height_mm:18}]};window.LabelPreview.computeBoxes=template=>template.elements.map((item,index)=>({index,x:(Number(item.x_mm)||0)+(Number(template.margin_mm?.left)||0),y:(Number(item.y_mm)||0)+(Number(template.margin_mm?.top)||0),w:Number(item.width_mm)||20,h:Math.max(Number(item.height_mm)||0,Number(item.thickness_mm)||.3)}));`);
  const renderer=fs.readFileSync(require.resolve('../gui/renderer'),'utf8'),helper=renderer.slice(renderer.indexOf('function alignInverseToTargetBottom('),renderer.indexOf('\nfunction isReplaceablePicture('));assert.ok(helper.startsWith('function alignInverseToTargetBottom('));w.eval(helper);
  button.click();
  const frame=doc.getElementById('previewFrame');hit.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0,clientX:10,clientY:20}));w.dispatchEvent(new w.MouseEvent('pointerup',{clientX:40,clientY:60}));
  const inverse=w.eval('editing.elements[1]'),targetBox=w.LabelPreview.computeBoxes(w.eval('editing'))[0];assert.equal(w.eval('editing.elements.length'),2);assert.equal(inverse.type,'inverse');assert.equal(inverse.y_mm+2+inverse.height_mm,targetBox.y+targetBox.h);
});
test('diagonal line tool drag previews and commits the same slanted endpoints',()=>{
  const {w,doc,button}=gestureFixture(),start={x:10,y:20},end={x:40,y:50};button.dataset.add='line';button.click();const frame=doc.getElementById('previewFrame');
  frame.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0,clientX:start.x,clientY:start.y}));w.dispatchEvent(new w.MouseEvent('pointermove',{clientX:end.x,clientY:end.y}));w.queued();
  const draft=doc.querySelector('#previewFrame svg line');assert.ok(draft,'line tool shows its live line while dragging');assert.deepEqual([Number(draft.getAttribute('x1')),Number(draft.getAttribute('y1')),Number(draft.getAttribute('x2')),Number(draft.getAttribute('y2'))],[start.x,start.y,end.x,end.y]);
  w.dispatchEvent(new w.MouseEvent('pointerup',{clientX:end.x,clientY:end.y}));const item=w.eval('editing.elements[0]');assert.equal(item.type,'line');equalLinePoints(w.LineGeometry.endpoints(item),[start,end]);assert.equal(w.eval('editing.elements.length'),1);
});
function equalLinePoints(actual,expected){for(let i=0;i<2;i++){assert.ok(Math.abs(actual[i].x-expected[i].x)<1e-8,`x${i}: ${actual[i].x} != ${expected[i].x}`);assert.ok(Math.abs(actual[i].y-expected[i].y)<1e-8,`y${i}: ${actual[i].y} != ${expected[i].y}`);}}
