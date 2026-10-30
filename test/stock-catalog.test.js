'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function catalog(){
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../gui/stock-catalog'),'utf8'),context);
  return context.window.QLabelStockCatalog;
}

test('BarTender stock catalog exposes manufacturers and the ADES AG sizes shown in the reference',()=>{
  const stocks=catalog();
  assert.equal(stocks.getManufacturers().length,54);
  assert.ok(stocks.getManufacturers().includes('ADES AG'));
  const item=stocks.getStock('ADES AG','49908');
  const expected={
    manufacturer:'ADES AG',name:'49908',width_mm:89.9922,height_mm:49.9872,
    paper_width_mm:93.98,paper_height_mm:49.9872,columns:1,rows:1,
    margin_top_mm:0,margin_left_mm:1.9812,margin_right_mm:1.9812,margin_bottom_mm:0,
    gap_x_mm:0,gap_y_mm:0,orientation:0,printer_type:'Roll'
  };
  for(const [key,value] of Object.entries(expected))assert.equal(item[key],value,key);
  assert.ok(stocks.getStocks('ADES AG').some(item=>item.name==='45891'));
});

test('catalog preserves circle geometry and all installed stock records',()=>{
  const stocks=catalog(),all=stocks.getManufacturers().flatMap(name=>stocks.getStocks(name));
  assert.equal(all.length,7350);
  const circle=stocks.getStock('Advanced Labeling','.75" Circle');
  assert.equal(circle.shape,1);
  assert.equal(circle.width_mm,19.05);
  const multi=stocks.getStock('Advanced Labeling','.75" Circle 2 up');
  assert.ok(Math.abs(multi.gap_x_mm-6.35)<.0001,'1.875 inch page minus two .75 inch labels and .125 inch margins leaves .25 inch gap');
  const names=stocks.getStocks('Advanced Labeling').slice(0,7).map(x=>x.name);
  assert.deepEqual(Array.from(names),['.75" Circle','.75" Circle 2 up','.75" Circle 3 up','.75" Circle 4 up','1" Circle','1" Circle 2 up','1" Circle 3 up']);
});

test('stock parser retains literal quotes, quoted commas, and extra version fields',()=>{
  const {parseLine}=require('../scripts/import-bartender-stocks');
  assert.deepEqual(parseLine('Advanced Labeling,.75" Circle,1,750'),['Advanced Labeling','.75" Circle','1','750']);
  assert.deepEqual(parseLine('Vendor,"Label, special",0,1'),['Vendor','Label, special','0','1']);
  assert.throws(()=>parseLine('Vendor,"unterminated'),/Unterminated/);
});

