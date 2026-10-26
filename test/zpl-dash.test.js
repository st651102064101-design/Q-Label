'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildZpl}=require('../lib/zpl');
const build=elements=>Promise.resolve(buildZpl({dpi:203,width_mm:60,height_mm:40,elements},[{}])).then(String);
const bars=zpl=>[...zpl.matchAll(/\^FO(\d+),(\d+)\^GB(\d+),(\d+),(\d+)\^FS/g)].map(m=>m.slice(1).map(Number));

test('dashed horizontal line prints as separated bars covering only the dash lengths',async()=>{
  const zpl=await build([{type:'line',x_mm:5,y_mm:5,width_mm:30,height_mm:0,thickness_mm:.5,line_style:'dash',dash_pattern:2}]);
  const found=bars(zpl);
  assert.ok(found.length>3,'several dash bars');
  for(let i=1;i<found.length;i++)assert.ok(found[i][0]>found[i-1][0]+found[i-1][2],'a gap separates consecutive bars');
  assert.ok(found.every(bar=>bar[1]===found[0][1]),'all bars stay on one row');
});

test('solid and erased lines are unchanged',async()=>{
  const solid=await build([{type:'line',x_mm:5,y_mm:5,width_mm:30,height_mm:0,thickness_mm:.5,line_style:'solid'}]);
  assert.equal(bars(solid).length,1);
  const erased=await build([{type:'line',x_mm:5,y_mm:5,width_mm:30,height_mm:0,thickness_mm:.5,line_style:'erase'}]);
  assert.equal(bars(erased).length,0);
});

test('dashed box prints dashes on all four sides and no solid frame',async()=>{
  const zpl=await build([{type:'box',x_mm:5,y_mm:5,width_mm:20,height_mm:10,thickness_mm:.4,line_style:'dash',dash_pattern:3}]);
  const found=bars(zpl),top=found.filter(b=>b[1]===found[0][1]),left=found.filter(b=>b[0]===found[0][0]);
  assert.ok(top.length>2&&left.length>2);
  assert.ok(!/\^GB\d+,\d+,\d+\^FS/.test(zpl.replace(/\^FO\d+,\d+\^GB\d+,\d+,\d+\^FS/g,'')));
  assert.ok(found.every(b=>b[2]<found.reduce((m,x)=>Math.max(m,x[2]),0)+1));
});
