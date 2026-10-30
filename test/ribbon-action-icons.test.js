'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const icons=require('../gui/label-action-icons');

test('font size up and down actions render distinct accessible SVG-only glyphs',()=>{
  const dom=new JSDOM('<!doctype html><body></body>'),document=dom.window.document;
  const increase=document.createElement('button'),decrease=document.createElement('button');
  increase.setAttribute('aria-label','Increase font size');decrease.setAttribute('aria-label','Decrease font size');
  increase.innerHTML=icons.render('font-size-up');decrease.innerHTML=icons.render('font-size-down');
  const up=increase.querySelector('svg'),down=decrease.querySelector('svg');
  assert.ok(up&&down,'both size controls render SVG elements');
  assert.equal(up.getAttribute('viewBox'),'0 0 24 24');assert.equal(down.getAttribute('viewBox'),'0 0 24 24');
  assert.equal(up.getAttribute('aria-hidden'),'true');assert.equal(down.getAttribute('aria-hidden'),'true');
  assert.notEqual(up.innerHTML,down.innerHTML,'the arrow directions differ');
  assert.equal(increase.getAttribute('aria-label'),'Increase font size');assert.equal(decrease.getAttribute('aria-label'),'Decrease font size');
  assert.equal(increase.textContent,'');assert.equal(decrease.textContent,'','icons do not add visible text beside the input');
  dom.window.close();
});

test('Print action icon is a printer SVG suitable for the Home Action group',()=>{
  const dom=new JSDOM('<!doctype html><body></body>'),button=dom.window.document.createElement('button');
  button.setAttribute('aria-label','Print');button.innerHTML=icons.render('print');
  const svg=button.querySelector('svg');
  assert.ok(svg,'Print has a vector icon');assert.equal(svg.getAttribute('data-icon'),'print');
  assert.equal(svg.getAttribute('viewBox'),'0 0 24 24');assert.equal(svg.getAttribute('aria-hidden'),'true');
  assert.match(svg.querySelector('path')?.getAttribute('d')||'',/M7 8V3h10v5.*M6 14h12v7H6z/,'printer body, paper and output tray are drawn');
  assert.equal(button.textContent,'');dom.window.close();
});
