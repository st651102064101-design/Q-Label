'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const pageGap=require('../gui/page-gap');

test('one column enables the gap control for paper margins and draws all four physical edge distances',()=>{
  const page={enabled:true,width_mm:53.56,height_mm:38.56,columns:1,rows:1,left_mm:1.78,right_mm:1.78,top_mm:1.78,bottom_mm:1.78,gap_x_mm:0,gap_y_mm:0};
  const before=JSON.stringify(page);
  assert.equal(pageGap.hasGap(page),true,'paper margins are visible spacing even without inter-label gaps');
  const dom=new JSDOM(`<svg>${pageGap.render({show:true,page,templateWidth:50,templateHeight:35})}</svg>`),doc=dom.window.document;
  const marks=[...doc.querySelectorAll('[data-paper-margin]')];
  assert.deepEqual(marks.map(mark=>mark.getAttribute('data-paper-margin')),['top','bottom','left','right']);
  assert.deepEqual(marks.map(mark=>mark.getAttribute('data-distance-mm')),['1.78','1.78','1.78','1.78']);
  assert.deepEqual(marks.map(mark=>mark.querySelector('text').textContent),['Top 1.78 mm','Bottom 1.78 mm','Left 1.78 mm','Right 1.78 mm']);
  assert.equal(doc.querySelectorAll('[data-label-gap]').length,0,'single-label margins do not invent extra columns');
  assert.equal(doc.querySelector('.editor-paper-margins').getAttribute('pointer-events'),'none');
  assert.equal(JSON.stringify(page),before,'showing margins does not alter print/layout data');
  dom.window.close();
});

test('margin-only toggle is usable and drawing ignores zero, negative and invalid margins',()=>{
  const page={enabled:true,width_mm:40,height_mm:30,columns:1,rows:1,left_mm:2,right_mm:0,top_mm:-1,bottom_mm:'bad'};
  const dom=new JSDOM('<button><span class="ribbon-caption"></span></button>'),button=dom.window.document.querySelector('button');
  const toggle=pageGap.bindToggle(button,()=>{},()=>pageGap.hasGap(page));
  assert.equal(button.disabled,false);button.click();assert.equal(toggle.visible,true);
  const doc=new JSDOM(`<svg>${pageGap.render({show:true,page,templateWidth:38,templateHeight:30})}</svg>`).window.document;
  assert.equal(doc.querySelectorAll('[data-paper-margin]').length,1);
  const band=doc.querySelector('[data-paper-margin="left"] rect');
  assert.equal(band.getAttribute('x'),'-2');assert.equal(band.getAttribute('width'),'2');
  assert.equal(pageGap.hasGap({...page,enabled:false}),false);
  assert.equal(pageGap.hasGap({...page,left_mm:0}),false);
  dom.window.close();doc.defaultView.close();
});

test('gap overlay stays hidden by default and renders each configured inter-label gap when shown',()=>{
  const page={enabled:true,width_mm:80,height_mm:60,left_mm:2,right_mm:2,top_mm:3,bottom_mm:3,columns:2,rows:2,gap_x_mm:4,gap_y_mm:5};
  assert.equal(pageGap.render({page,templateWidth:36,templateHeight:27}), '','gap artwork is omitted by default');
  const doc=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${pageGap.render({show:true,page,templateWidth:36,templateHeight:27})}</svg>`).window.document;
  const marks=[...doc.querySelectorAll('[data-label-gap]')];
  assert.equal(marks.length,2,'one band is rendered for each configured axis');
  assert.deepEqual(marks.map(mark=>[mark.getAttribute('x'),mark.getAttribute('y'),mark.getAttribute('width'),mark.getAttribute('height')]),[
    ['36','-3','4','60'],['-2','27','80','5'],
  ],'gap bands use physical page/template dimensions and include paper margins');
  assert.equal(doc.querySelector('.editor-label-gaps').getAttribute('pointer-events'),'none','visual gap bands do not intercept editor input');
});

test('gap toggle starts hidden and updates its accessible state and display label on each click',()=>{
  const dom=new JSDOM('<button><span class="ribbon-caption"></span></button>'),button=dom.window.document.querySelector('button'),changes=[];
  let page={enabled:true,columns:2,rows:1,gap_x_mm:3};
  const toggle=pageGap.bindToggle(button,visible=>changes.push(visible),()=>pageGap.hasGap(page));
  assert.equal(button.disabled,false,'the control is enabled when a physical label gap exists');
  assert.equal(button.getAttribute('aria-pressed'),'false');
  assert.equal(button.title,'Show gap');
  assert.equal(button.getAttribute('aria-label'),'Show gap');
  assert.equal(button.querySelector('.ribbon-caption').textContent,'Show gap');
  button.click();
  assert.equal(toggle.visible,true);
  assert.equal(button.getAttribute('aria-pressed'),'true');
  assert.equal(button.title,'Hide gap');
  assert.equal(button.getAttribute('aria-label'),'Hide gap');
  assert.equal(button.querySelector('.ribbon-caption').textContent,'Hide gap');
  button.click();
  assert.equal(button.getAttribute('aria-pressed'),'false');
  assert.deepEqual(changes,[true,false]);
  page={enabled:true,columns:1,rows:1,gap_x_mm:0};toggle.refresh();
  assert.equal(button.disabled,true,'the control is disabled when the layout has no inter-label gap');
  assert.equal(button.title,'No label gap configured');
  dom.window.close();
});
