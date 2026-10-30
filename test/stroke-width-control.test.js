'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const control=require('../gui/stroke-width-control');

test('stroke-width button shows its green outer ring only while hovered',()=>{
  const dom=new JSDOM(`<svg><g data-editor-overlay="0"><g class="stroke-width-control"><circle class="stroke-width-hit"/>${control.renderHoverRing()}</g></g></svg>`),svg=dom.window.document.querySelector('svg'),hit=svg.querySelector('.stroke-width-hit'),ring=svg.querySelector('.stroke-width-hover-ring');
  control.bindHover(svg);
  assert.equal(ring.getAttribute('visibility'),'hidden');
  hit.dispatchEvent(new dom.window.Event('pointerover',{bubbles:true}));
  assert.equal(ring.getAttribute('visibility'),'visible');
  assert.equal(ring.getAttribute('stroke'),'#16a34a');
  assert.equal(ring.getAttribute('r'),'17');
  hit.dispatchEvent(new dom.window.Event('pointerout',{bubbles:true}));
  assert.equal(ring.getAttribute('visibility'),'hidden');
  hit.dispatchEvent(new dom.window.Event('pointerover',{bubbles:true}));
  svg.dispatchEvent(new dom.window.Event('pointerdown',{bubbles:true}));
  assert.equal(ring.getAttribute('visibility'),'hidden','returning to canvas clears the ring');
  dom.window.close();
});

test('stroke-width hover highlights the object border without a connector to its SVG tool',()=>{
  const dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg"><g data-editor-overlay="3">${control.renderEdgeGuide({x:10,y:20,w:30,h:40,scale:.5,index:3})}<g class="stroke-width-control"><circle class="stroke-width-hit"/></g></g></svg>`),svg=dom.window.document.querySelector('svg'),group=svg.querySelector('[data-editor-overlay]'),guide=group.querySelector('.stroke-width-edge-guide');
  assert.equal(guide.getAttribute('x'),'10');assert.equal(guide.getAttribute('y'),'20');assert.equal(guide.getAttribute('width'),'30');assert.equal(guide.getAttribute('height'),'40');assert.equal(guide.getAttribute('stroke-width'),'0.5');
  assert.equal(group.querySelector('.stroke-width-guide'),null,'no diagonal line connects the border to the tool');
  control.bindHover(svg);
  group.querySelector('.stroke-width-hit').dispatchEvent(new dom.window.Event('pointerover',{bubbles:true}));
  assert.equal(group.classList.contains('is-stroke-width-hover'),true,'hover state reveals the border guide');
  group.querySelector('.stroke-width-hit').dispatchEvent(new dom.window.Event('pointerout',{bubbles:true,relatedTarget:svg}));
  assert.equal(group.classList.contains('is-stroke-width-hover'),false,'leaving the tool hides the border guide');
});

test('stroke-width hover binding is idempotent and clears when the pointer returns to the canvas',()=>{
  const dom=new JSDOM('<svg><g data-editor-overlay="1"><g class="stroke-width-control"><circle/></g></g><g data-editor-overlay="2"/></svg>'),svg=dom.window.document.querySelector('svg'),groups=svg.querySelectorAll('[data-editor-overlay]');
  control.bindHover(svg);control.bindHover(svg);
  groups[0].querySelector('circle').dispatchEvent(new dom.window.Event('pointerover',{bubbles:true}));
  assert.equal(groups[0].classList.contains('is-stroke-width-hover'),true);
  groups[1].dispatchEvent(new dom.window.Event('pointerdown',{bubbles:true}));
  assert.equal(groups[0].classList.contains('is-stroke-width-hover'),false);
});
