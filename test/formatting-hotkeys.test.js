'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

test('Ctrl+B/I/U toggles formatting across every cell of all selected tables',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-home"></div><div id="previewFrame"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  const table=()=>({type:'image',x_mm:0,y_mm:0,width_mm:20,height_mm:10,font_family:'Arial',table_model:{rows:[{},{}],columns:[{},{}],values:[['a','b'],['c','d']],cellStyles:{'0,0':{bold:true}},fontSize:4,fill:'#fff',border:'#000',stroke:.2}});
  w.editing={dpi:203,elements:[table(),table()]};w.editorSel=0;w.editorSelection=new Set([0,1]);
  let snapshots=0,renders=0,draws=0,touches=0,persists=0;w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>snapshots++;w.renderEditorElements=()=>renders++;w.drawEditorCanvas=()=>draws++;w.touchEditor=()=>touches++;w.persistEditor=async()=>persists++;w.sampleData=()=>({});
  w.TableDesign=require('../gui/table-design');w.TableTools={bake:()=>{}};w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
  const apply=key=>{const event=new w.KeyboardEvent('keydown',{key,ctrlKey:true,bubbles:true,cancelable:true});w.document.dispatchEvent(event);assert.equal(event.defaultPrevented,true,'Ctrl+'+key.toUpperCase()+' is handled');};
  const allHave=(key,value)=>w.editing.elements.every(object=>object.table_model.rows.every((_,r)=>object.table_model.columns.every((__,c)=>object.table_model.cellStyles[r+','+c]?.[key]===value)));
  for(const [shortcut,key] of [['b','bold'],['i','italic'],['u','underline']]){apply(shortcut);assert.ok(allHave(key,true),'Ctrl+'+shortcut.toUpperCase()+' applies '+key+' to every cell across both selected tables');apply(shortcut);assert.ok(allHave(key,false),'Ctrl+'+shortcut.toUpperCase()+' clears '+key+' across both selected tables when all are formatted');}
  w.editorSelection=new Set([0]);w.editorSel=0;w.TableCellSelection={keys:['0,1']};const previousDefault=w.editing.elements[0].bold;apply('b');
  assert.equal(w.editing.elements[0].table_model.cellStyles['0,1'].bold,true,'a selected cell can be formatted on its own');assert.equal(w.editing.elements[0].table_model.cellStyles['0,0'].bold,false,'formatting one cell leaves adjacent cells unchanged');assert.equal(w.editing.elements[0].bold,previousDefault,'formatting a partial cell selection does not change the whole table default');
  assert.equal(snapshots,7,'each shortcut action creates one undo snapshot');assert.equal(renders,7);assert.equal(draws,7);assert.equal(touches,7);assert.equal(persists,7);dom.window.close();
});


test('Wrap toolbar toggles every supported object and whole-table cell overrides',async()=>{
 const dom=new JSDOM('<body><div id="ribbon-home"></div><div id="previewFrame"></div>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
 Object.assign(w,{mmToUnit:Number,unitToMm:Number,unitSuffix:()=> 'mm',measureUnit:()=> 'mm',measureDpi:()=>203,editorSel:0,editorSelection:new Set(),readEditorIntoDraft:()=>{},pushSnapshot:()=>{},renderEditorElements:()=>{},drawEditorCanvas:()=>{},touchEditor:()=>{},persistEditor:async()=>{},sampleData:()=>({}),LabelPreview:{computeBoxes:()=>[{w:20,h:10}]},TableDesign:require('../gui/table-design'),TableTools:{bake:()=>{}}});
 const objects=[{type:'text',text:'long text'},...['barcode128','code39','code93','ean13'].map(type=>({type,text:'12345678',show_text:true})),{type:'image',barcode_spec:{show_text:true},barcode_bars:{}},{type:'image',table_model:{rows:[{}],columns:[{},{}],values:[['a','b']],cellStyles:{'0,0':{text_wrap:true},'0,1':{text_wrap:true}},fontSize:4}}];
 w.editing={dpi:203,elements:objects};w.eval(fs.readFileSync(require.resolve('../gui/formatting-capabilities'),'utf8'));w.eval(fs.readFileSync(require.resolve('../gui/formatting-toolbar'),'utf8'));
 for(let i=0;i<objects.length;i++){
  w.editorSel=i;w.document.dispatchEvent(new w.Event('editor-selection-changed'));
  const button=w.document.querySelector('[aria-label="Wrap text within its box or table cell"]');
  // Sync uses the same preview event as the renderer after selection.
  w.document.dispatchEvent(new w.Event('preview-updated'));
  if(objects[i].type!=='text'&&!objects[i].table_model){assert.equal(button.disabled,true,'Barcode Wrap is unavailable');const before=objects[i].text_wrap;button.click();assert.equal(objects[i].text_wrap,before,'disabled Wrap cannot mutate barcode');continue;}
  assert.equal(button.disabled,false,objects[i].type+' supports Wrap');
  const before=button.getAttribute('aria-pressed')==='true';button.click();await new Promise(r=>w.setTimeout(r,0));assert.equal(objects[i].text_wrap,!before);
  button.click();await new Promise(r=>w.setTimeout(r,0));assert.equal(objects[i].text_wrap,before);
  if(objects[i].table_model)for(const cell of Object.values(objects[i].table_model.cellStyles))assert.equal(cell.text_wrap,before,'whole-table toggle updates explicit cell overrides');
 }
 w.editorSel=0;w.editorSelection=new Set([0,1]);w.document.dispatchEvent(new w.Event('preview-updated'));
 const mixed=w.document.querySelector('[aria-label="Wrap text within its box or table cell"]');assert.equal(mixed.disabled,true,'mixed Text/Barcode selection cannot advertise Wrap');const beforeMixed=objects.map(e=>e.text_wrap);mixed.click();assert.deepEqual(objects.map(e=>e.text_wrap),beforeMixed,'disabled mixed selection cannot change any object');assert.equal(mixed.getAttribute('aria-pressed'),'false');
 dom.window.close();
});
