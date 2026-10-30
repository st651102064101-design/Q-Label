'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const stockMode=require('../gui/new-label-stock-mode');

test('new label wizard opens with custom settings and no stock selection',()=>{
  const dom=new JSDOM('<input id="nwStockCustom" type="radio" name="stock" value="custom" checked><input id="nwStockPredefined" type="radio" name="stock" value="predefined"><div id="nwPredefinedStock"><select id="nwStockCategory"><option value=""> </option><option>ADES AG</option></select><select id="nwStockList" size="8"></select></div><div id="nwCustomStock" hidden></div>');
  const d=dom.window.document;
  assert.equal(stockMode.setInitialStockMode(d),true);
  assert.equal(d.getElementById('nwStockPredefined').checked,false);
  assert.equal(d.getElementById('nwStockCustom').checked,true);
  assert.equal(d.getElementById('nwPredefinedStock').hidden,false);
  assert.equal(d.getElementById('nwStockCategory').disabled,true);
  assert.equal(d.getElementById('nwStockList').disabled,true);
  assert.equal(d.getElementById('nwCustomStock').hidden,false);
  dom.window.close();
});
