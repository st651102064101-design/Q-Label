'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{PNG}=require('pngjs');
const {convertPicture}=require('../lib/source-picture');
test('picture conversion creates valid image bytes with sizing, colors and real pixel data',()=>{
  const png=new PNG({width:2,height:1});png.data.set([255,0,0,255,255,255,255,255]);const input=PNG.sync.write(png);
  const result=convertPicture(input,{kind:'picture',format:'png',colors:'monochrome',sizing:'stretch',width:4,height:2});
  assert.equal(result.kind,'picture');const decoded=PNG.sync.read(Buffer.from(result.bytes));assert.equal(decoded.width,4);assert.equal(decoded.height,2);
  assert.deepEqual([...decoded.data.slice(0,4)],[0,0,0,255]);assert.deepEqual([...decoded.data.slice(-4)],[255,255,255,255]);
});
test('picture decoder rejects invalid data and excessive sizes instead of producing an invalid bitmap',()=>{
  assert.throws(()=>convertPicture(Buffer.from('bad'),{format:'png'}),/image|picture|PNG/i);
  const png=new PNG({width:1,height:1});assert.throws(()=>convertPicture(PNG.sync.write(png),{format:'png',sizing:'stretch',width:100000,height:100000}),/size|dimension/i);
});
