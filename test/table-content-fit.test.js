const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const TableDesign=require('../gui/table-design');
const fixtures=new Set();
test.afterEach(()=>{for(const dom of fixtures)dom.window.close();fixtures.clear();});

function harness(){
  const dom=new JSDOM(`<!doctype html><body>
    <div class="word-ribbon">
      <div class="ribbon-tabs"></div>
      <div id="ribbon-insert" class="ribbon-panel"></div>
    </div>
    <div id="previewFrame"></div>
  </body>`,{pretendToBeVisual:true});
  const w=dom.window;
  fixtures.add(dom);
  const canvasContext={scale(){},fillRect(){},beginPath(){},rect(){},clip(){},save(){},restore(){},fillText(){},stroke(){},setLineDash(){},moveTo(){},lineTo(){},measureText:text=>({width:Array.from(String(text??'')).length*1.8})};
  w.HTMLCanvasElement.prototype.getContext=()=>canvasContext;
  w.TableDesign=TableDesign;
  w.TableAxisOperations=require('../gui/table-axis-operations');
  w.TextMeasure={
    graphemes:text=>Array.from(String(text??'')),
    width:(_font,text)=>Array.from(String(text??'')).length*1.8,
    context:()=>{
      const canvas=w.document.createElement('canvas');
      const ctx=canvas.getContext('2d')||{
        font:'',
        measureText:text=>({width:Array.from(String(text??'')).length*1.8}),
      };
      if(!ctx.measureText)ctx.measureText=text=>({width:Array.from(String(text??'')).length*1.8});
      return ctx;
    },
  };
  w.editing={dpi:203,elements:[],margin_mm:{left:0,top:0}};
  w.el=id=>w.document.getElementById(id);
  w.measureUnit=()=> 'mm';w.measureDpi=()=>203;w.mmToUnit=value=>value;w.unitToMm=value=>value;w.unitSuffix=()=> 'mm';
  const overlay=w.document.createElementNS('http://www.w3.org/2000/svg','svg');
  let screenMatrix={a:1,b:0,c:0,d:1};overlay.getScreenCTM=()=>screenMatrix;w.setOverlayMatrix=matrix=>{screenMatrix=matrix;};
  overlay.createSVGPoint=()=>({x:0,y:0,matrixTransform(){return this;}});
  overlay._editorBoxes=[];
  w.liveOverlay=()=>overlay;
  w.clientToMm=()=>({x:0,y:0});
  w.sampleData=()=>({});
  w.pushSnapshot=()=>{};
  w.undoStack=[];w.redoStack=[];w.EditHistory=require('../gui/edit-history');w.recordEditRevision=()=>{};
  w.touchEditor=()=>{};
  w.drawEditorCanvas=()=>{};
  w.renderEditorElements=()=>{};
  w.selectElement=()=>{};
  w.updateUndoButtons=()=>{};
  w.readEditorIntoDraft=()=>{};
  w.persistEditor=async()=>{};
  w.setEditorStatus=()=>{};
  w.ObjectData={resolve:(object)=>object.text};
  w.LabelPreview={drawFormattedTextCanvas:()=>{},canvasToGraphicBytes:canvas=>({width:canvas.width,height:canvas.height,hex:'00'})};
  w.LabelActionIcons=require('../gui/label-action-icons');
  const vm=require('node:vm');
  const context=vm.createContext(w);
  context.window=w;
  context.document=w.document;
  context.HTMLElement=w.HTMLElement;
  context.MutationObserver=w.MutationObserver;
  context.Event=w.Event;
  context.Node=w.Node;
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../gui/table-tools.js'),'utf8'),context);
  return w;
}

function axis(size=20,contentMin=20){
  return {mode:'Fixed',size,weight:100,min:.1,max:254,align:'Start',showEmpty:true,contentMin};
}

function tableElement(overrides={}){
  return {
    type:'image',
    width_mm:45,
    height_mm:40,
    table_model:{
      rows:[axis(20,20),axis(20,20)],
      columns:[axis(15,.1),axis(15,.1),axis(15,.1)],
      values:[['1ดดดดดไดได','fwafwaf',''],['','','']],
      autoWidth:false,
      autoHeight:false,
      padding:.5,
      fontSize:3,
      stroke:.2,
      border:'#000',
      fill:'#fff',
      borders:'All',
      locked:false,
      errors:{clip:true},
      cellStyles:{},
      ...overrides.table_model,
    },
    ...overrides,
  };
}

test('applyTableOuterSize keeps the drawn width and height on fixed axes',()=>{
  const w=harness(),element=tableElement({width_mm:70,height_mm:30});
  w.TableTools.applyTableOuterSize(element,70,30);
  assert.equal(element.width_mm,70);
  assert.equal(element.height_mm,30);
  assert.equal(element.table_model.autoWidth,false);
  assert.equal(element.table_model.autoHeight,false);
  assert.ok(element.table_model.columns.every(axis=>axis.mode==='Fixed'&&Math.abs(axis.size-70/3)<.01));
  assert.ok(element.table_model.rows.every(axis=>axis.mode==='Fixed'&&Math.abs(axis.size-15)<.01));
  w.TableTools.ensureContentFits(element);
  assert.equal(element.width_mm,70);
  assert.equal(element.height_mm,30);
});

test('ensureContentFits lowers a stuck row contentMin so the row can shrink to the text',()=>{
  const w=harness(),element=tableElement();
  assert.equal(element.table_model.rows[0].contentMin,20);
  const changed=w.TableTools.ensureContentFits(element);
  assert.equal(changed,true);
  const floor=element.table_model.rows[0].contentMin;
  assert.ok(floor<8,`contentMin should drop near the text height, got ${floor}`);
  assert.ok(floor>=3.5,`contentMin must still cover one line of text, got ${floor}`);
  // A second pass must be able to keep the lower floor (no ratchet).
  element.table_model.rows[0].contentMin=18;
  w.TableTools.ensureContentFits(element);
  assert.ok(element.table_model.rows[0].contentMin<8);
});

test('Word row resize can shrink a tall text row down to the content floor',()=>{
  const w=harness(),element=tableElement();
  w.TableTools.ensureContentFits(element);
  const floor=element.table_model.rows[0].contentMin;
  element.table_model.rows[0].mode='Fixed';
  element.table_model.rows[0].size=20;
  element.table_model.rows[1].mode='Fixed';
  element.table_model.rows[1].size=20;
  element.height_mm=40;
  const sizes=w.TableTools.lengths(element.table_model.rows,element.height_mm);
  const result=TableDesign.resizeWordLine(element.table_model.rows,1,floor-sizes[0],sizes,'table');
  assert.ok(result.applied<0,`expected a shrink, got ${result.applied}`);
  assert.ok(Math.abs(element.table_model.rows[0].size-floor)<.05,`row size ${element.table_model.rows[0].size} should reach floor ${floor}`);
  assert.ok(element.table_model.rows[0].size<sizes[0]);
});

test('editing a table cell to shorter or empty text immediately shrinks its row and table',()=>{
  const w=harness(),element=tableElement();
  element.table_model.values[0][0]='one\ntwo\nthree\nfour';
  element.table_model.rows[0].size=20;
  element.table_model.rows[0].contentMin=20;
  element.table_model.rows[1].size=20;
  element.table_model.rows[1].contentMin=.1;
  element.height_mm=40;

  element.table_model.values[0][0]='';
  assert.equal(w.TableTools.fitEditedRow(element,0),true);
  const empty=element.table_model.rows[0].size;
  assert.ok(empty<20,`clearing content should reduce row from 20mm, got ${empty}`);
  assert.ok(Math.abs(element.height_mm-(empty+20))<.01,'table height should release the removed row height');
  assert.equal(element.table_model.rows[1].size,20,'the adjacent fixed row keeps its size');

  element.table_model.values[0][0]='one';
  assert.equal(w.TableTools.fitEditedRow(element,0),false,'one line fits in the empty cell minimum');
  assert.ok(Math.abs(element.table_model.rows[0].contentMin-empty)<.01,'the content minimum is updated to the smaller row height');
});

test('table cell typing updates its value without baking or rebuilding the canvas per character',()=>{
  const w=harness(),element=tableElement();w.editing.elements=[element];w.editorSel=0;w.editorSelection=new Set([0]);
  let bakes=0,renders=0,draws=0;
  w.LabelPreview.canvasToGraphicBytes=canvas=>{bakes++;return{width:canvas.width,height:canvas.height,hex:'00'};};
  w.renderEditorElements=()=>{renders++;};w.drawEditorCanvas=()=>{draws++;};
  w.TableTools.editCell(0,0,0);
  const editor=w.document.querySelector('.table-cell-editor');assert.ok(editor,'editing a table cell should create its textarea');
  // Opening the editor bakes once to hide the original cell text underneath it.
  // Measure typing work separately from that required initialization.
  const opening={bakes,renders,draws};
  for(const value of ['a','ab','abc','abcd','abcde']){editor.value=value;editor.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(element.table_model.values[0][0],value,'each input event should immediately update the live table model');}
  assert.equal(bakes-opening.bakes,0,'typing should not rasterize the entire table per character');
  assert.equal(renders-opening.renders,0,'typing should not rebuild the object list per character');
  assert.equal(draws-opening.draws,0,'typing should not redraw the full canvas per character');
  editor.blur();
  assert.equal(bakes-opening.bakes,1,'the table should bake once when editing is committed');
  assert.equal(renders-opening.renders,1,'the object list should rebuild once when editing is committed');
  assert.equal(draws-opening.draws,1,'the canvas should redraw once when editing is committed');
  assert.equal(w.undoStack.length,1,'the original table state should be captured once for undo');
});

test('double-click cell editor input event shrinks the row and table when selected multiline text is deleted',()=>{
  const w=harness(),element=tableElement();
  element.table_model.values[0][0]='line one\nline two\nline three\nline four';
  element.table_model.rows[0].size=20;element.table_model.rows[0].contentMin=20;
  element.table_model.rows[1].size=20;element.table_model.rows[1].contentMin=.1;
  element.height_mm=40;w.editing.elements=[element];w.editorSel=0;w.editorSelection=new Set([0]);
  const hit=w.document.createElement('div');hit.dataset.hit='0';w.el('previewFrame').append(hit);
  hit.dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true,cancelable:true}));
  const editor=w.document.querySelector('.table-cell-editor');
  assert.ok(editor,'editing the table cell should open its textarea');
  assert.equal(w.getComputedStyle(editor).borderRadius,'0px','the green cell editing outline should have square corners');
  editor.value='';editor.dispatchEvent(new w.Event('input',{bubbles:true}));

  assert.equal(element.table_model.values[0][0],'','input event should commit the cleared cell value');
  assert.ok(element.table_model.rows[0].size<20,`the edited row should shrink, got ${element.table_model.rows[0].size}mm`);
  assert.ok(element.height_mm<40,`the table should shrink with its row, got ${element.height_mm}mm`);
  assert.equal(element.table_model.rows[1].size,20,'unrelated fixed row should keep its height');
  editor.blur();
});

test('table cell editor height follows vertical SVG scale instead of horizontal scale',()=>{
  const w=harness(),element=tableElement();w.editing.elements=[element];w.editorSel=0;w.editorSelection=new Set([0]);w.setOverlayMatrix({a:5,b:0,c:0,d:2});
  w.TableTools.editCell(0,1,0);
  const editor=w.document.querySelector('.table-cell-editor');
  assert.ok(editor,'editing a table cell should create its textarea');
  assert.equal(editor.style.width,'75px','column width should follow horizontal viewport scale');
  assert.equal(editor.style.height,'40px','row height should follow vertical viewport scale');
  assert.equal(editor.style.maxHeight,'40px','textarea content must not expand beyond the cell');
  assert.equal(editor.style.getPropertyPriority('max-height'),'important');
  editor.blur();
});

test('active table cell selection geometry follows resized row and column dimensions',()=>{
  const w=harness(),element=tableElement();w.editing.elements=[element];w.editorSel=0;w.editorSelection=new Set([0]);
  w.TableCellSelection.select({r:0,c:0},{});
  const selection=()=>w.liveOverlay().querySelector('.table-cell-selection rect');
  const initial=selection();assert.ok(initial,'selecting a cell should draw its green active outline');
  const initialWidth=Number(initial.getAttribute('width')),initialHeight=Number(initial.getAttribute('height'));

  element.table_model.columns[0].size=25;element.width_mm=55;
  element.table_model.rows[0].size=25;element.height_mm=45;
  w.TableCellSelection.paint();

  const resized=selection();assert.ok(resized,'repainting should retain the active cell outline');
  assert.ok(Number(resized.getAttribute('width'))>initialWidth+9,'active outline should grow with the resized column');
  assert.ok(Number(resized.getAttribute('height'))>initialHeight+4,'active outline should grow with the resized row');
});

test('clicking outside a table deactivates its selected cell and closes the cell editor',()=>{
  const w=harness(),element=tableElement();w.editing.elements=[element];w.editorSel=0;w.editorSelection=new Set([0]);
  const frame=w.document.querySelector('#previewFrame'),hit=w.document.createElement('div'),outside=w.document.createElement('div');hit.dataset.hit='0';frame.append(hit,outside);
  w.TableCellSelection.select({r:0,c:0},{});assert.deepEqual(Array.from(w.TableCellSelection.keys),['0,0'],'the cell is active before clicking elsewhere');assert.ok(w.liveOverlay().querySelector('.table-cell-selection'),'the active cell outline is visible');
  const toolbar=w.document.querySelector('#ribbon-table'),toolbarPointer=new w.Event('pointerdown',{bubbles:true,cancelable:true});Object.defineProperty(toolbarPointer,'button',{value:0});toolbar.dispatchEvent(toolbarPointer);assert.deepEqual(Array.from(w.TableCellSelection.keys),['0,0'],'table toolbar actions retain the active cell selection');
  hit.dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true,cancelable:true,button:0}));assert.ok(w.document.querySelector('.table-cell-editor'),'double-clicking the cell opens its editor');
  const pointer=new w.Event('pointerdown',{bubbles:true,cancelable:true});Object.defineProperty(pointer,'button',{value:0});outside.dispatchEvent(pointer);
  assert.deepEqual(Array.from(w.TableCellSelection.keys),[],'outside pointerdown clears the active cell selection');assert.equal(w.liveOverlay().querySelectorAll('.table-cell-selection rect').length,0,'outside pointerdown removes the green active outline');assert.equal(w.document.querySelector('.table-cell-editor'),null,'outside pointerdown closes the cell editor');
});

test('row contentExtent matches tight single-line text height for autofit',()=>{
  const model={padding:.5,fontSize:3,values:[['1ดดดดดไดได','fwafwaf'],['','']]};
  const extent=TableDesign.contentExtent(model,'rows',0);
  assert.ok(Math.abs(extent-(3+1))<.001,`single-line extent should be font+2*pad, got ${extent}`);
  const wrapped={padding:.5,fontSize:3,values:[['one\ntwo','x'],['','']]};
  const multi=TableDesign.contentExtent(wrapped,'rows',0);
  assert.ok(Math.abs(multi-(3*(1+1.2)+1))<.001,`two-line extent got ${multi}`);
});
