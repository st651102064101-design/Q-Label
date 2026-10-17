'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Transforms=require('../gui/source-transforms');
const run=(text,configs,context={})=>Transforms.applyTransforms({kind:'text',value:text,text},configs,context);
test('character templates match installed help examples including consumption and escaped controls',()=>{
  const input='5980395957';
  for(const [pattern,expected] of [['(???)???-????','(598)039-5957'],['Code%','Code5980395957'],['@7','598039595'],['@3?','59803'],['????~??????','598095957'],['~@9%','980395957'],['~@3~?%','95957'],['?????\\n?????','59803\r95957'],['\\x3E%','>5980395957'],['%\\u00B6','5980395957¶']])assert.equal(Transforms.characterTemplate(input,pattern),expected,pattern);
});
test('barcode character template changes human-readable text without changing encoded value',()=>{
  const result=run('123456',[{kind:'character-template',pattern:'???-???'}],{barcode:true});
  assert.equal(result.text,'123456');assert.equal(result.hriText,'123-456');
});
test('ordered replace actions preserve Unicode and prefix/suffix applies once',()=>{
  const result=run(' A😀12 ',[{kind:'truncation',trim:true},{kind:'search-replace',actions:[{search:'A',replace:'B'},{search:'B',replace:'C'}]},{kind:'prefix-suffix',prefix:'[',suffix:']'}]);
  assert.equal(result.text,'[C😀12]');
  assert.equal(run('aaa',[{kind:'search-replace',actions:[{search:'a',replace:'$&!',all:true}]}]).text,'$&!$&!$&!');
});
test('range and character counts reject invalid inputs with no silent data loss',()=>{
  assert.throws(()=>run('123',[{kind:'length',minimum:4}]),/minimum/i);
  assert.throws(()=>run('abc',[{kind:'range',minimum:0,maximum:9}]),/number/i);
  assert.throws(()=>run('10',[{kind:'range',minimum:0,maximum:9}]),/range/i);
  assert.equal(run('7',[{kind:'length',minimum:3,pad:'0',padSide:'left'}]).text,'007');
  assert.equal(run('a😀b',[{kind:'truncation',start:1,length:1}]).text,'😀');
});
test('filter and suppression enforce explicit rules and conditions',()=>{
  assert.equal(run('a1b2',[{kind:'filter',mode:'digits',removeInvalid:true}]).text,'12');
  assert.throws(()=>run('a1',[{kind:'filter',mode:'digits',removeInvalid:false}]),/characters/i);
  assert.equal(run('value',[{kind:'suppression',when:'previous-empty'}],{previousText:''}).text,'');
  assert.equal(run('value',[{kind:'suppression',when:'previous-empty'}],{previousText:'x'}).text,'value');
});
test('character filter removes unwanted characters by default as documented by BarTender',()=>{
  assert.equal(run('AB-12 34',[{kind:'filter',mode:'digits'}]).text,'1234');
  assert.equal(run('abc DEF 12',[{kind:'filter',mode:'letters',case:'upper'}]).text,'ABCDEF');
});
