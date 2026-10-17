'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),Counter=require('../gui/source-counter');
test('serialization preserves numeric precision and leading zeroes',()=>{
  assert.equal(Counter.advance('90071992547409931234',1,{method:'numeric'}),'90071992547409931235');
  assert.equal(Counter.advance('LOT0099',1,{method:'numeric'}),'LOT0100');
  assert.equal(Counter.advance('0000',-1,{method:'numeric'}),'-0001');
});
test('automatic character sets follow the installed serialization-method example',()=>{
  assert.equal(Counter.advance('1A1A',1,{method:'auto'}),'1A1B');
  assert.equal(Counter.advance('1A1Z',1,{method:'auto'}),'1A2A');
  assert.equal(Counter.advance('Z',1,{method:'alphabetic'}),'AA');
  assert.equal(Counter.advance('Z',1,{method:'alphanumeric'}),'10');
  assert.equal(Counter.advance('00FF',1,{method:'hex'}),'0100');
});
test('custom sequences validate uniqueness and exclusions are configurable',()=>{
  assert.throws(()=>Counter.advance('2',1,{method:'custom',sequence:'24682'}),/unique|repeat/i);
  assert.equal(Counter.advance('H',1,{method:'alphabetic',excludeConfusing:true}),'J');
  assert.equal(Counter.advance('a',1,{method:'alphabetic',letters:'lower'}),'b');
});
