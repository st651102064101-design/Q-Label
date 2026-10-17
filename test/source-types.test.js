'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Types=require('../gui/source-types');
test('text preserves zeroes, control characters and Unicode',()=>{
  assert.equal(Types.parseAndFormat('001\x1dก😀',{kind:'text'}).text,'001\x1dก😀');
});
test('numbers support locale, hexadecimal, Roman and scientific notation without silent invalid values',()=>{
  assert.equal(Types.parseAndFormat('1234',{kind:'number',notation:'hex',minimumLength:4}).text,'04D2');
  assert.equal(Types.parseAndFormat('1234',{kind:'number',notation:'roman'}).text,'MCCXXXIV');
  assert.equal(Types.parseAndFormat('0',{kind:'number',notation:'roman'}).text,'N');
  assert.equal(Types.parseAndFormat('1234',{kind:'number',notation:'scientific',decimals:3}).text,'1.234E+003');
  assert.equal(Types.parseAndFormat('1234.5',{kind:'number',locale:'de-DE',decimals:2}).text,'1.234,50');
  assert.throws(()=>Types.parseAndFormat('12x',{kind:'number'}),/number/i);
  assert.throws(()=>Types.parseAndFormat('4000',{kind:'number',notation:'roman'}),/3999/);
});
test('currency percentage and fractions retain numeric values and format specified precision',()=>{
  assert.equal(Types.parseAndFormat('12.5',{kind:'currency',currency:'USD',locale:'en-US',decimals:2}).text,'$12.50');
  assert.equal(Types.parseAndFormat('0.125',{kind:'percentage',locale:'en-US',decimals:1}).text,'12.5%');
  assert.equal(Types.parseAndFormat('1.5',{kind:'fraction',denominator:4}).text,'1 1/2');
  assert.equal(Types.parseAndFormat('1.5',{kind:'fraction',denominator:4,improper:true}).text,'3/2');
});
test('fraction precision retains existing quarter and up-to-three-digit cases',()=>{
  assert.equal(Types.parseAndFormat('0.333333333',{kind:'fraction',precision:'up-to-3'}).text,'1/3');
  assert.equal(Types.parseAndFormat('0.31',{kind:'fraction',precision:'quarters'}).text,'1/4');
  assert.equal(Types.parseAndFormat('1.333333333',{kind:'fraction',precision:'up-to-3',improper:true}).text,'4/3');
  assert.throws(()=>Types.parseAndFormat('1',{kind:'fraction',denominator:0}),/denominator/i);
});
test('fraction explicit precision matches measured installed formatter outputs',()=>{
  const cases=[['up-to-3','0.2','1/5'],['up-to-2','0.125','1/8'],['up-to-1','0.2','1/5'],['quarters','0.5','2/4'],['eighths','0.5','4/8'],['reduced-quarters','0.5','1/2'],['quarters','1.9999','1 4/4'],['up-to-3','1.9999','1 1'],['quarters','-0.125','- 1/4'],['reduced-quarters','-0.125','-']];
  for(const [precision,value,want] of cases)assert.equal(Types.parseAndFormat(value,{kind:'fraction',precision}).text,want,precision+':'+value);
});
test('date and time use explicit timezone and custom pattern and reject invalid dates',()=>{
  const value='2026-10-17T03:04:05Z';
  assert.equal(Types.parseAndFormat(value,{kind:'date',pattern:'yyyy-MM-dd HH:mm:ss',timeZone:'UTC'}).text,'2026-10-17 03:04:05');
  assert.equal(Types.parseAndFormat(value,{kind:'time',pattern:'HH:mm:ss',timeZone:'Asia/Bangkok'}).text,'10:04:05');
  assert.throws(()=>Types.parseAndFormat('not a date',{kind:'date'}),/date/i);
});
test('binary decoding preserves every byte and validates hex/base64 instead of dropping data',()=>{
  const result=Types.parseAndFormat('00ff1d',{kind:'binary',encoding:'hex'});
  assert.deepEqual(result.bytes,[0,255,29]);assert.equal(result.text,'\0ÿ\x1d');
  assert.deepEqual(Types.parseAndFormat('AP8d',{kind:'binary',encoding:'base64'}).bytes,result.bytes);
  assert.throws(()=>Types.parseAndFormat('0ff',{kind:'binary',encoding:'hex'}),/hex/i);
  assert.throws(()=>Types.parseAndFormat('??',{kind:'binary',encoding:'base64'}),/base64/i);
});

const nativeDatePatterns=require('./fixtures/native-date-patterns.json');
test('extended date tokens match actual native formatter outputs across year and leap boundaries',()=>{
  for(const row of nativeDatePatterns)assert.equal(Types.parseAndFormat(row.date+'T00:00:00Z',{kind:'date',locale:'en-US',timeZone:'UTC',pattern:row.pattern}).text,row.output,row.date+' '+row.pattern);
});
test('extended date tokens follow the selected timezone civil date',()=>{
  const row=nativeDatePatterns.find(row=>row.date==='2021-01-03'&&row.pattern==="YYYY-'W'VV-u");
  assert.equal(Types.parseAndFormat('2021-01-04T00:30:00Z',{kind:'date',timeZone:'America/Los_Angeles',pattern:row.pattern}).text,row.output);
  assert.equal(Types.parseAndFormat('2021-01-04T00:30:00Z',{kind:'date',timeZone:'UTC',pattern:row.pattern}).text,'2021-W01-1');
});
