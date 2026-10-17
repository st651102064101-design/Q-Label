'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{encodeMatrix}=require('../lib/source-matrix');
test('QR binary matrices retain the original bytes without UTF-8 conversion',()=>{
  const actual=encodeMatrix('qrcode',{bytes:[0,255,29]}),expected=require('qrcode').create([{data:Buffer.from([0,255,29]),mode:'byte'}],{errorCorrectionLevel:'M'}).modules;
  assert.equal(actual.width,expected.size);assert.equal(actual.height,expected.size);assert.deepEqual(actual.data,Array.from(expected.data));
  assert.notDeepEqual(actual.data,encodeMatrix('qrcode',{text:'\0ÿ\x1d'}).data);
});
test('Data Matrix binary input uses exact single-byte data and validates bytes',()=>{
  const actual=encodeMatrix('datamatrix',{bytes:[0,255,29]}),expected=require('bwip-js').raw({bcid:'datamatrix',text:'\0ÿ\x1d',binarytext:true,scale:1,padding:0,paddingwidth:0,paddingheight:0,includetext:false})[0];
  assert.equal(actual.width,expected.pixx);assert.equal(actual.height,expected.pixy);assert.deepEqual(actual.data,Array.from(expected.pixs));
  assert.throws(()=>encodeMatrix('qrcode',{bytes:[256]}),/invalid byte/);assert.throws(()=>encodeMatrix('other',{text:'x'}),/unsupported/i);
});
