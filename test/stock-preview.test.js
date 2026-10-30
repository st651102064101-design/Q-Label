'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
function fixture(){const dom=new JSDOM('<aside></aside>',{runScripts:'dangerously'});for(const file of ['stock-catalog','stock-apply','stock-preview'])dom.window.eval(fs.readFileSync(require.resolve('../gui/'+file),'utf8'));return dom;}
test('stock preview draws circle and all columns without stretching the template',()=>{
  const dom=fixture(),w=dom.window,target=w.document.querySelector('aside');
  const stock=w.QLabelStockCatalog.getStock('Advanced Labeling','.75" Circle 3 up');
  w.StockPreview.render(target,stock,'in');
  const labels=[...target.querySelectorAll('[data-stock-labels] ellipse')];assert.equal(labels.length,3);
  for(const label of labels)assert.equal(label.getAttribute('rx'),label.getAttribute('ry'));
  assert.equal(target.querySelector('small').textContent,'Template Size: 0.75 × 0.75 in');
  assert.ok(Number(labels[1].getAttribute('cx'))-Number(labels[0].getAttribute('cx'))>2*Number(labels[0].getAttribute('rx')));
  dom.window.close();
});
test('stock preview keeps ADES source dimensions, rounded roll illustration, and removes layout annotations',()=>{
  const dom=fixture(),w=dom.window,target=w.document.querySelector('aside');
  w.StockPreview.render(target,w.QLabelStockCatalog.getStock('ADES AG','040312fo'),'in');
  assert.equal(target.querySelector('small').textContent,'Template Size: 3.149 × 1.574 in');
  assert.ok(Number(target.querySelector('[data-stock-labels] rect').getAttribute('rx'))>0);
  assert.equal(target.querySelectorAll('text').length,0);
  dom.window.close();
});
test('sheet stock preview shows every row and column and changes units without changing geometry',()=>{
  const dom=fixture(),w=dom.window,target=w.document.querySelector('aside');
  const stock=w.QLabelStockCatalog.getStock('Avery Standard','22808 - Print-to-the-Edge Round Labels');
  w.StockPreview.render(target,stock);assert.equal(target.querySelectorAll('[data-stock-labels] ellipse').length,stock.rows*stock.columns);
  const radius=target.querySelector('ellipse').getAttribute('rx');w.StockPreview.render(target,stock,'in');
  assert.equal(target.querySelector('ellipse').getAttribute('rx'),radius);assert.match(target.querySelector('small').textContent,/2.5 × 2.5 in/);
  dom.window.close();
});
test('CD stock preview shows the central hole from the catalog diameter',()=>{
  const dom=fixture(),w=dom.window,target=w.document.querySelector('aside');
  const stock=w.QLabelStockCatalog.getStock('Generic CD','CD/DVD');w.StockPreview.render(target,stock);
  const outer=target.querySelector('[data-stock-labels] ellipse'),hole=target.querySelector('[data-stock-labels] [data-stock-hole]');
  assert.ok(hole);assert.ok(Math.abs(Number(hole.getAttribute('r'))/Number(outer.getAttribute('rx'))-stock.border_or_diameter_mm/stock.width_mm)<1e-9);
  dom.window.close();
});


test('stock selection preview has a blue background',()=>{const dom=fixture(),w=dom.window,target=w.document.querySelector('aside');w.StockPreview.render(target,w.QLabelStockCatalog.getStock('ADES AG','040312fo'),'in');const stops=[...target.querySelectorAll('linearGradient[id$="background"] stop')];assert.deepEqual(stops.map(stop=>stop.getAttribute('stop-color')),['#c7d9ee','#89a6c4']);dom.window.close();});
