'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
test('shared wizard preview matches reference proportions and uses clipped continuation, not rollers or capsules',t=>{
 const dom=new JSDOM('<svg></svg>',{runScripts:'dangerously'});t.after(()=>dom.window.close());const w=dom.window;
 w.eval(fs.readFileSync(require.resolve('../gui/modal-preview'),'utf8'));
 const svg=w.document.querySelector('svg');
 for(const shape of ['rounded','rectangle','ellipse','circle']){
  w.PaperPreview.renderReferenceRoll(svg,{width_mm:101.6,height_mm:101.6,label_shape:shape,corner_radius_mm:8});
  assert.equal(svg.getAttribute('viewBox'),'0 0 198 270');assert.equal(svg.querySelector(':scope > rect').getAttribute('fill'),'#bfbfbf');
  const cell=svg.querySelector('[data-preview-cell]');assert.ok(cell);assert.equal(cell.getAttribute('data-label-shape'),shape);
  if(shape==='rounded'){assert.equal(Number(cell.getAttribute('width')),154);assert.equal(Number(cell.getAttribute('height')),154);assert.equal(Number(cell.getAttribute('x')),22);assert.equal(Number(cell.getAttribute('y')),58);}
  assert.equal(svg.querySelectorAll('[data-paper-sliver]').length,2);assert.equal(svg.querySelector('[data-paper-roller]'),null);assert.equal(svg.querySelector('[data-gap-label]'),null);assert.equal(svg.querySelector('[data-die-cut-guides]'),null);
  for(const sliver of svg.querySelectorAll('[data-paper-sliver]'))assert.match(sliver.parentElement.getAttribute('clip-path'),/^url/);
 }
 w.PaperPreview.renderReferenceRoll(svg,{width_mm:101.6,height_mm:50.8,label_shape:'rounded',corner_radius_mm:4});
 const cell=svg.querySelector('[data-preview-cell]');assert.equal(Number(cell.getAttribute('width'))/Number(cell.getAttribute('height')),2);
 w.PaperPreview.renderReferenceRoll(svg,{width_mm:50,height_mm:25,label_shape:'rounded',corner_radius_mm:2,page:{enabled:true,width_mm:150,height_mm:50,rows:2,columns:3}});
 assert.equal(svg.querySelectorAll('[data-preview-cell]').length,6,'Items Per Page preserves all configured items');
 w.PaperPreview.renderReferenceRoll(svg,{width_mm:101.6,height_mm:101.6,label_shape:'rounded',corner_radius_mm:8,stock:{liner_left_mm:0,liner_right_mm:0}});
 const baseLabelWidth=Number(svg.querySelector('[data-preview-cell]').getAttribute('width'));
 w.PaperPreview.renderReferenceRoll(svg,{width_mm:101.6,height_mm:101.6,label_shape:'rounded',corner_radius_mm:8,stock:{liner_left_mm:26.67,liner_right_mm:1.27}});
 const withSideEdges=svg.querySelector('[data-preview-cell]');
 assert.ok(Number(withSideEdges.getAttribute('width'))<baseLabelWidth,'Side Edges liner shrinks the label in the fixed preview frame like BarTender');
 assert.ok(Number(svg.querySelector('[data-liner="left"]').getAttribute('width'))>20,'left unused area is visible beside the smaller label');
 w.PaperPreview.renderReferenceRoll(svg,{width_mm:101.6,height_mm:101.6,label_shape:'rounded',corner_radius_mm:8,stock:{liner_left_mm:0,liner_right_mm:26.67}});
 assert.ok(Number(svg.querySelector('[data-preview-cell]').getAttribute('width'))<baseLabelWidth,'right liner also reduces label width in preview');
});

test('side edge preview reflects physical widths symmetrically and uses grey liner',()=>{
 const dom=new JSDOM('<svg></svg>',{runScripts:'dangerously'});const w=dom.window;w.eval(fs.readFileSync(require.resolve('../gui/modal-preview'),'utf8'));const svg=w.document.querySelector('svg');
 for(const width of [50.8,101.6]){w.PaperPreview.renderReferenceRoll(svg,{width_mm:width,height_mm:101.6,label_shape:'rounded',corner_radius_mm:3,stock:{liner_left_mm:26.67,liner_right_mm:26.67}},{sideEdges:true});const a=svg.querySelector('[data-liner="left"]'),b=svg.querySelector('[data-liner="right"]'),face=svg.querySelector('[data-preview-cell]');assert.equal(a.getAttribute('fill'),'#e9e9e9');assert.equal(b.getAttribute('fill'),'#e9e9e9');assert.ok(Math.abs(Number(a.getAttribute('width'))-Number(b.getAttribute('width')))<.00001);assert.ok(Math.abs(Number(a.getAttribute('width'))/Number(face.getAttribute('width'))-26.67/width)<.00001);assert.equal(svg.querySelector('[data-reference-background]').getAttribute('fill'),'url(#'+svg.querySelector('[data-reference-background]').dataset.gradientId+')');}
 assert.equal(svg.querySelector('[data-reference-liner]').getAttribute('fill'),'#e9e9e9','the gap between labels uses grey backing');
 dom.window.close();
});

test('rounded wizard roll and sheet previews share blue background and visible rounded corners',()=>{
 const dom=new JSDOM('<svg id="roll"></svg><svg id="sheet"></svg>',{runScripts:'dangerously'}),w=dom.window;w.eval(fs.readFileSync(require.resolve('../gui/modal-preview'),'utf8'));const t={width_mm:101.6,height_mm:101.6,label_shape:'rounded',corner_radius_mm:3.175};
 w.PaperPreview.renderReferenceRoll(w.document.getElementById('roll'),t,{wizardRounded:true});w.PaperPreview.renderSingleSheet(w.document.getElementById('sheet'),t);
 for(const svg of w.document.querySelectorAll('svg')){const bg=svg.querySelector('[data-reference-background]');assert.ok(bg,'blue backdrop exists');assert.match(bg.getAttribute('fill'),/^url\(#/);const rect=svg.querySelector('[data-preview-cell]');assert.ok(rect,'label face exists');assert.ok(Number(rect.getAttribute('rx'))>=Number(rect.getAttribute('width'))*.1,'rounded corners are clearly visible');}
 t.label_shape='rectangle';w.PaperPreview.renderSingleSheet(w.document.getElementById('sheet'),t);assert.match(w.document.querySelector('#sheet [data-reference-background]').getAttribute('fill'),/^url\(#/);assert.equal(Number(w.document.querySelector('#sheet [data-preview-cell]').getAttribute('rx')),0);dom.window.close();
});


test('wizard previews retain a grey backing and visible continuation around the label',()=>{
 const dom=new JSDOM('<svg id="roll"></svg><svg id="sheet"></svg>',{runScripts:'dangerously'}),w=dom.window;w.eval(fs.readFileSync(require.resolve('../gui/modal-preview'),'utf8'));const t={width_mm:101.6,height_mm:101.6,label_shape:'rounded',corner_radius_mm:3,background_color:'#ff0000',background_picture:'data:image/png;base64,AA=='};
 w.PaperPreview.renderReferenceRoll(w.document.getElementById('roll'),t,{wizardRounded:true,wizardPreview:true});w.PaperPreview.renderSingleSheet(w.document.getElementById('sheet'),t);
 for(const svg of w.document.querySelectorAll('svg')){assert.equal(svg.querySelector('[data-reference-liner]')?.getAttribute('fill'),'#e9e9e9');assert.ok(svg.querySelector('[data-paper-sliver="top"]'));assert.ok(svg.querySelector('[data-paper-sliver="bottom"]'));}
 const sheet=w.document.getElementById('sheet');assert.equal(sheet.querySelector('[data-preview-cell]').getAttribute('fill'),'#ff0000');assert.ok(sheet.querySelector('image[clip-path]'));dom.window.close();
});


test('wizard shape previews use blue backgrounds and finished preview omits gaps',()=>{
 const dom=new JSDOM('<svg id="preview"></svg>',{runScripts:'dangerously'}),w=dom.window;w.eval(fs.readFileSync(require.resolve('../gui/modal-preview'),'utf8'));const svg=w.document.getElementById('preview');
 for(const shape of ['rectangle','rounded','ellipse','circle']){const t={width_mm:101.6,height_mm:101.6,label_shape:shape};w.PaperPreview.renderReferenceRoll(svg,t,{wizardPreview:true});assert.match(svg.querySelector('[data-reference-background]').getAttribute('fill'),/^url\(#/);assert.ok(svg.querySelector('[data-paper-continuation]'));w.PaperPreview.renderSingleSheet(svg,t,{finished:true});assert.match(svg.querySelector('[data-reference-background]').getAttribute('fill'),/^url\(#/);assert.equal(svg.querySelector('[data-paper-continuation]'),null);assert.equal(svg.querySelector('[data-reference-liner]'),null);assert.ok(svg.querySelector('[data-preview-cell]'));}dom.window.close();
});
