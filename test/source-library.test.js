'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parseDataBuilder}=require('../lib/source-library');
const fixture=fs.readFileSync(path.join(__dirname,'fixtures','native-phrase-library.btdb'),'utf8');
test('vendor-generated plain XML library preserves language values and automatic sole-library selection',()=>{
  const library=parseDataBuilder(fixture,'Shipping phrases');assert.equal(library.phrases.greeting['en-US'],'Hello');assert.equal(library.phrases.greeting['th-TH'],'ก');assert.equal(parseDataBuilder(fixture).phrases.greeting['en-US'],'Hello');
});
test('library XML preserves leading zeros, whitespace, entities and reserved phrase IDs',()=>{
  const library=parseDataBuilder(fixture.replace('<ID>greeting</ID>','<ID>__proto__</ID>').replace('<en-US>Hello</en-US>','<en-US> 007 &amp; 009 </en-US>'));
  assert.equal(Object.hasOwn(library.phrases,'__proto__'),true);assert.equal(library.phrases.__proto__['en-US'],' 007 & 009 ');assert.equal(JSON.parse(JSON.stringify(library)).phrases.__proto__['th-TH'],'ก');
});
test('library XML rejects malformed input, entity declarations, wrong format and non-text libraries',()=>{
  assert.throws(()=>parseDataBuilder('<BtDataSet>'),/invalid/i);assert.throws(()=>parseDataBuilder('<!DOCTYPE x [<!ENTITY e SYSTEM "file:///private">]><BtDataSet/>'),/entities/i);assert.throws(()=>parseDataBuilder('<Other/>'),/BtDataSet/);assert.throws(()=>parseDataBuilder(fixture.replace('<TableUsageType>1</TableUsageType>','<TableUsageType>2</TableUsageType>')),/unavailable/i);assert.throws(()=>parseDataBuilder(fixture,'missing'),/unavailable/i);
});
test('library XML rejects duplicate phrase identities instead of silently replacing a row',()=>{
  const duplicate=fixture.replace('</BtDataSet>','<Shipping_x0020_phrases><ID>greeting</ID><en-US>Other</en-US></Shipping_x0020_phrases></BtDataSet>');assert.throws(()=>parseDataBuilder(duplicate),/duplicate phrase/i);
});
