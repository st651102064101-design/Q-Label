'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { cell, edges, dash, setOption, styleTargets, applyCellStyle, applyGalleryStyle, shadeCells, edgeForCellSide, applyBorders, paintEdge, penSettings, resizeDivider, resizeWordLine, autofitLine, contentExtent, lockAspectForResize } = require('../gui/table-design');
const TableAxisOperations = require('../gui/table-axis-operations');

function model(rows = 2, columns = 2) {
  return {
    rows: Array.from({ length: rows }, () => ({})),
    columns: Array.from({ length: columns }, () => ({})),
    values: Array.from({ length: rows }, () => Array(columns).fill('')),
    design: {}, border: '#000000', fill: '#ffffff', stroke: 0.5, borders: 'All',
  };
}

test('all six table-style options affect the expected cells', () => {
  const m = model(3, 3);
  for (const option of ['headerRow', 'totalRow', 'bandedRows', 'firstColumn', 'lastColumn', 'bandedColumns']) setOption(m, option, true);
  assert.equal(cell(m, 0, 1).fill, '#0284c7');
  assert.equal(cell(m, 2, 1).bold, true);
  assert.notEqual(cell(m, 1, 1).fill, '#ffffff');
  assert.equal(cell(m, 1, 0).bold, true);
  assert.equal(cell(m, 1, 2).bold, true);
  assert.equal(m.design.bandedColumns, true);
  setOption(m, 'headerRow', false);
  setOption(m, 'bandedColumns', false);
  assert.equal(cell(m, 0, 1).fill, '#ffffff');
});

test('whole-table formatting targets every cell while a cell selection stays scoped', () => {
  const m=model(2,3);m.cellStyles={'0,1':{fill:'#00ff00',bold:false}};
  const all=styleTargets(m,[],true);
  assert.deepEqual(all,['0,0','0,1','0,2','1,0','1,1','1,2']);
  assert.equal(applyCellStyle(m,all,{fontSize:2.5,bold:true,fontFamily:'Calibri'}),true);
  for(const key of all){assert.equal(m.cellStyles[key].fontSize,2.5);assert.equal(m.cellStyles[key].bold,true);assert.equal(m.cellStyles[key].fontFamily,'Calibri');}
  assert.equal(m.cellStyles['0,1'].fill,'#00ff00','formatting preserves pre-existing style fields');
  assert.deepEqual(styleTargets(m,new Set(['1,2']),true),['1,2'],'a cell selection takes precedence over whole-table targeting');
  assert.deepEqual(styleTargets(m,[],false),[],'an inactive table has no style targets');
  assert.equal(applyCellStyle(m,[],{italic:true}),false,'an empty selection cannot mutate the model');
});

test('moving rows and columns keeps cell and rich-text formatting attached to their content',()=>{
  const m=model(2,2);
  m.values=[['top-left','top-right'],['bottom-left','bottom-right']];
  m.cellStyles={'0,0':{bold:true,fill:'#ff0000'},'1,1':{italic:true,align:'right'}};
  m.cellTextStyles={'0,0':[{start:0,end:3,bold:true,text_color:'#008800'}],'1,1':[{start:0,end:6,italic:true,underline:true}]};
  m.edgeStyles={'v:0:0':{color:'#ff0000'},'h:1:1':{color:'#008800'}};
  assert.equal(TableAxisOperations.apply(m,true,1,'up'),true);
  assert.deepEqual(m.values,[['bottom-left','bottom-right'],['top-left','top-right']]);
  assert.deepEqual(m.cellStyles['0,1'],{italic:true,align:'right'});
  assert.deepEqual(m.cellStyles['1,0'],{bold:true,fill:'#ff0000'});
  assert.deepEqual(m.cellTextStyles['0,1'],[{start:0,end:6,italic:true,underline:true}]);
  assert.deepEqual(m.cellTextStyles['1,0'],[{start:0,end:3,bold:true,text_color:'#008800'}]);
  assert.deepEqual(m.edgeStyles,{'v:0:0':{color:'#ff0000'},'h:1:1':{color:'#008800'}});

  assert.equal(TableAxisOperations.apply(m,false,0,'down'),true);
  assert.deepEqual(m.values,[['bottom-right','bottom-left'],['top-right','top-left']]);
  assert.deepEqual(m.cellStyles['0,0'],{italic:true,align:'right'});
  assert.deepEqual(m.cellStyles['1,1'],{bold:true,fill:'#ff0000'});
  assert.deepEqual(m.cellTextStyles['0,0'],[{start:0,end:6,italic:true,underline:true}]);
  assert.deepEqual(m.cellTextStyles['1,1'],[{start:0,end:3,bold:true,text_color:'#008800'}]);
});

test('duplicate and delete row preserve and reindex cell formatting',()=>{
  const m=model(2,2);m.values=[['a','b'],['c','d']];
  m.cellStyles={'0,0':{bold:true},'0,1':{fill:'#ffee00'},'1,0':{italic:true}};
  m.cellTextStyles={'0,0':[{start:0,end:1,underline:true}],'1,0':[{start:0,end:1,text_color:'#123456'}]};
  assert.equal(TableAxisOperations.apply(m,true,0,'duplicate'),true);
  assert.deepEqual(m.values,[['a','b'],['a','b'],['c','d']]);
  assert.deepEqual(m.cellStyles['1,0'],{bold:true});
  assert.deepEqual(m.cellStyles['1,1'],{fill:'#ffee00'});
  assert.deepEqual(m.cellStyles['2,0'],{italic:true});
  assert.deepEqual(m.cellTextStyles['1,0'],[{start:0,end:1,underline:true}]);
  assert.deepEqual(m.cellTextStyles['2,0'],[{start:0,end:1,text_color:'#123456'}]);
  assert.equal(TableAxisOperations.apply(m,true,0,'delete'),true);
  assert.deepEqual(m.values,[['a','b'],['c','d']]);
  assert.deepEqual(m.cellStyles['0,0'],{bold:true});
  assert.deepEqual(m.cellStyles['0,1'],{fill:'#ffee00'});
  assert.deepEqual(m.cellStyles['1,0'],{italic:true});
  assert.deepEqual(m.cellTextStyles['0,0'],[{start:0,end:1,underline:true}]);
  assert.deepEqual(m.cellTextStyles['1,0'],[{start:0,end:1,text_color:'#123456'}]);
});

test('style gallery presets accent and borders and clears cell and edge overrides', () => {
  const m = model();
  m.cellStyles = { '1,1': { fill: '#f00' } };
  m.edgeStyles = { 'h:0:0': null };
  applyGalleryStyle(m, '#16a34a', 'Bands');
  assert.equal(m.design.accent, '#16a34a');
  assert.equal(m.design.headerRow, true);
  assert.equal(m.design.bandedRows, true);
  assert.equal(m.border, '#16a34a');
  assert.equal(m.borders, 'Horizontal');
  assert.deepEqual(m.cellStyles, {});
  assert.deepEqual(m.edgeStyles, {});
  applyGalleryStyle(m, '#000000', 'Grid');
  assert.equal(m.design.bandedRows, false);
  assert.equal(m.borders, 'All');
});

test('shading fills the table or selected cells while preserving other cell formatting', () => {
  const m = model();
  m.cellStyles = { '0,1': { color: '#123456', bold: true } };
  shadeCells(m, [], '#eeeeee');
  assert.equal(m.fill, '#eeeeee');
  shadeCells(m, ['0,1', '1,0'], '#aabbcc');
  assert.deepEqual(m.cellStyles['0,1'], { color: '#123456', bold: true, fill: '#aabbcc' });
  assert.deepEqual(m.cellStyles['1,0'], { fill: '#aabbcc' });
});

test('edge geometry covers every table border mode', () => {
  const m = model(2, 2), ws = [10, 20], hs = [5, 7];
  assert.equal(edges(m, ws, hs).length, 12);
  assert.deepEqual(edges(m, ws, hs).find(e => e.key === 'h:1:1'), { key: 'h:1:1', x1: 10, y1: 5, x2: 30, y2: 5, color: '#000000', width: 0.5, style: 'Solid' });
  for (const [mode, count] of [['None', 0], ['Outside', 8], ['Inside', 4], ['Horizontal', 6], ['Vertical', 6], ['Top', 2], ['Bottom', 2], ['Left', 2], ['Right', 2]]) {
    m.borders = mode;
    assert.equal(edges(m, ws, hs).length, count, `${mode} border count`);
  }
});

test('table line style and width settings reach every rendered edge', () => {
  const m = model(1, 1);
  m.lineStyle = 'Dashed';
  m.stroke = 0.3;
  const rendered = edges(m, [20], [10]);
  assert.equal(rendered.length, 4);
  assert.ok(rendered.every(edge => edge.style === 'Dashed' && edge.width === 0.3));
  assert.deepEqual(dash(rendered[0].style, rendered[0].width), [1.2, 0.6]);
});

test('edge overrides can replace or erase a displayed edge', () => {
  const m = model(1, 1);
  m.borders = 'None';
  m.edgeStyles = { 'h:0:0': { color: '#ff0000', width: 1, style: 'Dashed' }, 'v:0:0': null };
  const output = edges(m, [1], [1]);
  assert.equal(output.length, 1);
  assert.equal(output[0].color, '#ff0000');
  assert.deepEqual(dash(output[0].style, output[0].width), [4, 2]);
  assert.deepEqual(dash('Dotted', 2), [2, 4]);
  assert.deepEqual(dash('Solid', 2), []);
});

test('cell-side mapping returns stable horizontal and vertical edge keys', () => {
  assert.equal(edgeForCellSide(2, 3, 'Top'), 'h:2:3');
  assert.equal(edgeForCellSide(2, 3, 'Bottom'), 'h:3:3');
  assert.equal(edgeForCellSide(2, 3, 'Left'), 'v:2:3');
  assert.equal(edgeForCellSide(2, 3, 'Right'), 'v:2:4');
});

test('border width selection converts points to millimeters and retains color/style', () => {
  assert.deepEqual(penSettings('#123456', 0.25, 'Dotted'), { color: '#123456', width: 0.08819444444444444, style: 'Dotted' });
  assert.ok(Math.abs(penSettings('#000000', 6, 'Solid').width - 2.1166666666666667) < 1e-12);
});

test('yellow table divider resizing transfers size between adjacent columns or rows', () => {
  const axes = [{ mode: 'Auto', weight: 1, min: 5, max: 80 }, { mode: 'Auto', weight: 1, min: 5, max: 80 }, { mode: 'Auto', weight: 1, min: 5, max: 80 }];
  const base = [20, 20, 20];
  assert.equal(resizeDivider(axes, 1, 7, base), 7);
  assert.equal(axes[0].mode, 'Fixed');
  assert.equal(axes[0].size, 27);
  assert.equal(axes[1].size, 13);
  assert.equal(axes[2].mode, 'Auto', 'unrelated rows or columns remain unchanged');
  assert.equal(axes[0].size + axes[1].size, 40, 'total table size stays constant');
  assert.equal(resizeDivider(axes, 1, 100, base), 15, 'divider respects the neighbor minimum');
  assert.equal(axes[0].size, 35);
  assert.equal(axes[1].size, 5);
  assert.equal(resizeDivider(axes, 0, 1, base), 0, 'outer edges are not dividers');
});

test('Word line resizing grows the table unless Shift or Ctrl keeps the width', () => {
  const fresh = () => [{ mode: 'Auto', weight: 1, min: 5, max: 80 }, { mode: 'Auto', weight: 1, min: 5, max: 80 }, { mode: 'Auto', weight: 1, min: 5, max: 80 }];
  const base = [20, 10, 30];
  const normal = fresh();
  assert.equal(resizeWordLine(normal, 1, 4, base, 'table').tableDelta, 4);
  assert.deepEqual(normal.map(item => item.size), [24, 10, 30]);
  assert.equal(normal.every(item => item.mode === 'Fixed'), true);
  const shifted = fresh();
  assert.equal(resizeWordLine(shifted, 1, 4, base, 'pair').tableDelta, 0);
  assert.equal(shifted[0].size, 24);
  assert.equal(shifted[1].size, 6);
  assert.equal(shifted[2].mode, 'Auto');
  const equal = fresh();
  assert.equal(resizeWordLine(equal, 1, 4, base, 'equal').tableDelta, 0);
  assert.deepEqual(equal.map(item => item.size), [24, 18, 18]);
  const proportional = fresh();
  assert.equal(resizeWordLine(proportional, 1, 4, base, 'proportional').tableDelta, 0);
  assert.deepEqual(proportional.map(item => item.size), [24, 9, 27]);
  const right = fresh();
  assert.equal(resizeWordLine(right, 3, 5, base, 'table').tableDelta, 5);
  assert.equal(right[2].size, 35);
  assert.equal(right[0].size, 20);
  const left = fresh();
  const start = resizeWordLine(left, 0, 5, base, 'table');
  assert.equal(start.edge, 'start');
  assert.equal(start.tableDelta, -5);
  assert.equal(left[0].size, 15);
  assert.equal(left[1].size, 10);
});

test('double-clicking a Word table line fits that column to its text', () => {
  const items = [{ mode: 'Auto', weight: 1, min: 1, max: 80 }, { mode: 'Auto', weight: 1, min: 1, max: 80 }];
  const model = { padding: .5, fontSize: 3, values: [['Hello', ''], ['Hi', '']] };
  assert.equal(contentExtent(model, 'columns', 0), 10);
  const result = autofitLine(items, 1, [20, 20], contentExtent(model, 'columns', 0));
  assert.equal(result.tableDelta, -10);
  assert.equal(items[0].size, 10);
  assert.equal(items[1].size, 20);
});

test('table corner resizing does not lock aspect ratio but pictures still do', () => {
  assert.equal(lockAspectForResize({ type: 'image', table_model: {} }, 'se'), false);
  assert.equal(lockAspectForResize({ type: 'image' }, 'se'), true);
  assert.equal(lockAspectForResize({ type: 'box' }, 'se'), true);
  assert.equal(lockAspectForResize({ type: 'box' }, 'e'), false);
});

test('Apply Borders supports table-wide choices and selected-cell perimeter/interior', () => {
  const m = model(), pen = { color: '#123456', width: 0.75, style: 'Dotted' };
  applyBorders(m, [], 'None', pen);
  assert.equal(m.borders, 'None');
  assert.equal(m.border, pen.color);
  assert.equal(m.stroke, pen.width);
  assert.equal(m.lineStyle, pen.style);
  assert.deepEqual(m.edgeStyles, {});
  applyBorders(m, ['0,0', '0,1'], 'Outside', pen);
  assert.deepEqual(Object.keys(m.edgeStyles).sort(), ['h:0:0', 'h:0:1', 'h:1:0', 'h:1:1', 'v:0:0', 'v:0:1', 'v:0:2'].sort());
  assert.equal(m.edgeStyles['v:0:1'], null, 'shared interior edge is removed for Outside');
  applyBorders(m, ['0,0', '0,1'], 'Inside', pen);
  assert.equal(m.edgeStyles['v:0:1'], pen);
  assert.equal(m.edgeStyles['h:0:0'], null, 'outer edge is removed for Inside');
  applyBorders(m, ['0,0'], 'None', pen);
  for (const key of ['h:0:0', 'h:1:0', 'v:0:0', 'v:0:1']) assert.equal(m.edgeStyles[key], null);
});

test('Apply Borders applies orientation and named sides to selected cells', () => {
  const m = model(), pen = { color: '#111111', width: 1, style: 'Solid' };
  applyBorders(m, ['0,0'], 'Horizontal', pen);
  assert.equal(m.edgeStyles['h:0:0'], pen);
  assert.equal(m.edgeStyles['h:1:0'], pen);
  assert.equal(m.edgeStyles['v:0:0'], null);
  applyBorders(m, ['0,0'], 'Right', pen);
  assert.equal(m.edgeStyles['v:0:1'], pen);
});

test('Border Painter writes pen settings and Eraser removes that same edge', () => {
  const m = model(), pen = { color: '#00aa00', width: 1.25, style: 'Dashed' };
  const edge = edgeForCellSide(1, 0, 'Bottom');
  paintEdge(m, edge, pen);
  assert.equal(edges(m, [1, 1], [1, 1]).find(e => e.key === edge).color, '#00aa00');
  paintEdge(m, edge, pen, true);
  assert.equal(m.edgeStyles[edge], null);
  assert.equal(edges(m, [1, 1], [1, 1]).some(e => e.key === edge), false);
});

test('table border controls update the actual model on change without Apply Borders',()=>{
 const {JSDOM}=require('jsdom'),fs=require('node:fs'),dom=new JSDOM('<dialog><header></header><main></main></dialog>',{runScripts:'dangerously'}),w=dom.window,m=model();let changes=0;
 w.eval(fs.readFileSync(require.resolve('../gui/table-design'),'utf8'));const d=w.document.querySelector('dialog');w.TableDesign.mount(d,{table_model:m},fn=>{fn();changes++;});assert.equal(d.querySelector('[data-apply-borders]'),null);
 const borders=d.querySelector('[data-borders]');borders.value='Outside';borders.dispatchEvent(new w.Event('change'));assert.equal(m.borders,'Outside');assert.equal(changes,1);
 const color=d.querySelector('[data-pen]');color.value='#ff0000';color.dispatchEvent(new w.Event('change'));assert.equal(m.border,'#ff0000');assert.equal(changes,2);dom.window.close();
});
