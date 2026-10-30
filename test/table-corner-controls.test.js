'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const controls=require('../gui/table-corner-controls');

function model(rows=2,columns=3){return{rows:Array.from({length:rows},()=>({mode:'Auto'})),columns:Array.from({length:columns},()=>({mode:'Auto'})),values:Array.from({length:rows},(_,r)=>Array.from({length:columns},(_,c)=>`${r}:${c}`))};}

test('table add controls are placed at the upper-right and lower-left corners with labeled SVG plus icons',()=>{
  const dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${controls.render({x:10,y:20,w:30,h:40,index:4,scale:2})}</svg>`),svg=dom.window.document.querySelector('svg'),buttons=[...svg.querySelectorAll('.table-corner-add')];
  assert.equal(buttons.length,2);
  assert.deepEqual(buttons.map(button=>[button.getAttribute('aria-label'),button.dataset.tableAxis,button.dataset.tableIndex,button.getAttribute('transform')]),[['Add column','columns','4','translate(40 20)'],['Add row','rows','4','translate(10 60)']]);
  for(const button of buttons){assert.equal(button.getAttribute('role'),'button');assert.equal(button.querySelectorAll('.table-corner-add-icon path').length,1);assert.equal(button.querySelector('.table-corner-add-icon circle').getAttribute('r'),'12');}
  assert.equal(controls.render({x:0,y:0,w:1,h:1,index:0,locked:true}),'');
});

test('corner click and keyboard activation request exactly the matching row or column and stop canvas propagation',()=>{
  const dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${controls.render({x:0,y:0,w:10,h:10,index:2})}</svg>`),svg=dom.window.document.querySelector('svg'),calls=[];
  controls.bind(svg,(...args)=>calls.push(args));
  const column=svg.querySelector('[data-table-axis="columns"]'),row=svg.querySelector('[data-table-axis="rows"]');
  const click=new dom.window.MouseEvent('click',{bubbles:true,cancelable:true});column.dispatchEvent(click);
  const enter=new dom.window.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:'Enter'});row.dispatchEvent(enter);
  const space=new dom.window.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:' '});row.dispatchEvent(space);
  const unrelated=new dom.window.MouseEvent('click',{bubbles:true,cancelable:true});svg.dispatchEvent(unrelated);
  assert.deepEqual(calls,[[2,'columns'],[2,'rows'],[2,'rows']]);
  assert.equal(click.defaultPrevented,true);assert.equal(enter.defaultPrevented,true);assert.equal(space.defaultPrevented,true);
});

test('hover plus icons and their click targets keep a fixed pixel size across canvas zoom levels',()=>{
  for(const pixelsPerMm of [.5,2,10,20]){
    const scale=1/pixelsPerMm;
    const dom=new JSDOM(`<svg>${controls.render({x:10,y:20,w:30,h:40,index:0,scale})}</svg>`);
    for(const button of dom.window.document.querySelectorAll('.table-corner-add')){
      const sizing=button.querySelector('.table-corner-add-size');
      assert.ok(sizing,'corner icons must apply the provided screen scale');
      assert.equal(sizing.getAttribute('transform'),`scale(${scale})`);
      assert.ok(Math.abs(Number(sizing.querySelector('.table-corner-add-icon circle').getAttribute('r'))*scale*pixelsPerMm-12)<1e-9);
      assert.ok(Math.abs(Number(sizing.querySelector('.table-corner-add-hit').getAttribute('r'))*scale*pixelsPerMm-16)<1e-9);
    }
    dom.window.close();
  }
});

test('appendAxis adds an empty row or column while preserving existing cell data',()=>{
  const rows=model();
  assert.equal(controls.appendAxis(rows,'rows'),2);
  assert.equal(rows.rows.length,3);assert.deepEqual(rows.values[2],['','','']);assert.deepEqual(rows.values[0],['0:0','0:1','0:2']);
  const columns=model();
  assert.equal(controls.appendAxis(columns,'columns'),3);
  assert.equal(columns.columns.length,4);assert.deepEqual(columns.values.map(row=>row[3]),['','']);assert.deepEqual(columns.values[1].slice(0,3),['1:0','1:1','1:2']);
  assert.deepEqual(columns.columns[3],{mode:'Auto',size:5,weight:100,min:.1,max:254,align:'Start',showEmpty:true});
});

test('appendAxis rejects malformed tables, unsupported axes and the 100 row/column limit without mutation',()=>{
  const malformed=model();malformed.values[0].pop();const before=structuredClone(malformed);
  assert.equal(controls.appendAxis(malformed,'rows'),false);assert.deepEqual(malformed,before);
  const unsupported=model();assert.equal(controls.appendAxis(unsupported,'diagonal'),false);assert.deepEqual(unsupported,model());
  const fullRows=model(100,2),rowsBefore=structuredClone(fullRows);assert.equal(controls.appendAxis(fullRows,'rows'),false);assert.deepEqual(fullRows,rowsBefore);
  const fullColumns=model(2,100),columnsBefore=structuredClone(fullColumns);assert.equal(controls.appendAxis(fullColumns,'columns'),false);assert.deepEqual(fullColumns,columnsBefore);
});
