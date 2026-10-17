'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {compileGs1}=require('../lib/source-gs1');
test('GS1 encodes actual FNC1-separated AI data and exposes independent human-readable representation',()=>{
  const entries=[{ai:'01',value:'09506000134352'},{ai:'10',value:'LOT42'},{ai:'21',value:'ABC'}],result=compileGs1(entries,'gs1-128');
  assert.equal(result.data,'010950600013435210LOT42\x1d21ABC');
  assert.equal(result.hri,'(01)09506000134352(10)LOT42(21)ABC');assert.deepEqual(result.bytes,Array.from(result.data,c=>c.charCodeAt(0)));assert.equal(result.fnc1First,true);
});
test('GS1 validation rejects invalid check digits, unknown AIs and invalid dates',()=>{
  assert.throws(()=>compileGs1([{ai:'01',value:'09506000134353'}]),/check|invalid|digit/i);
  assert.throws(()=>compileGs1([{ai:'9999',value:'x'}]),/AI|identifier|unknown|invalid/i);
  assert.throws(()=>compileGs1([{ai:'17',value:'261399'}]),/date|month|invalid/i);
});
