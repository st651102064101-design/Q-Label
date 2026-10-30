'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {renderObjectName}=require('../gui/editor-selection-render');

function label(element={},box={x:10,y:20,w:30,h:8},scale=2,type='Text'){
  const dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${renderObjectName(element,box,scale,type)}</svg>`);
  return {dom,node:dom.window.document.querySelector('.selection-object-name')};
}

test('object name is above the top-left of its frame and stays the same pixel size at different zooms',()=>{
  for(const scale of [1,2,8]){
    const {dom,node}=label({},undefined,scale);
    assert.equal(node.querySelector('text').textContent,'Text');
    assert.equal(node.getAttribute('pointer-events'),'none','name does not intercept resize or text clicks');
    assert.equal(node.querySelector('.selection-object-name-anchor').getAttribute('transform'),'translate(10 20)');
    assert.equal(node.querySelector('.selection-object-name-content').getAttribute('transform'),`scale(${1/scale})`);
    assert.ok(Number(node.querySelector('text').getAttribute('y'))<0,'name is above the frame');
    assert.equal(node.querySelector('text').getAttribute('y'),'-3','name baseline sits close to the frame instead of leaving a large visual gap');
    assert.equal(node.querySelector('text').getAttribute('font-size'),'11');
    dom.window.close();
  }
});

test('custom names are plain text, preserve the full name in a title and fall back for empty names',()=>{
  const name='<img onerror="bad()"> & "Name"';
  const custom=label({label:name});
  assert.equal(custom.node.querySelector('text').textContent,name);
  assert.equal(custom.node.querySelector('title').textContent,name);
  assert.equal(custom.node.querySelector('img'),null);
  custom.dom.window.close();
  const empty=label({label:'   '},undefined,2,'Table');
  assert.equal(empty.node.querySelector('text').textContent,'Table');
  empty.dom.window.close();
});

test('long names stay compact and rotation follows the selection frame pivot',()=>{
  const {dom,node}=label({label:'A'.repeat(200),rotation_deg:315},{x:2,y:3,w:20,h:10,rotationCenter:{x:12,y:8}});
  assert.equal(node.getAttribute('transform'),'rotate(315 12 8)');
  assert.ok(node.querySelector('text').textContent.length<=65);
  assert.equal(node.querySelector('title').textContent.length,200);
  dom.window.close();
});
