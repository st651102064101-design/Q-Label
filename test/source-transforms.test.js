'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Transforms=require('../gui/source-transforms');
const run=(text,configs,context={})=>Transforms.applyTransforms({kind:'text',value:text,text},configs,context);
test('truncation supports independent left/right discard and keep counts in Unicode characters',()=>{
  assert.equal(run('  A😀BC  ',[{kind:'truncation',trimStart:true,trimEnd:true,discardLeft:1,discardRight:1}]).text,'😀B');
  assert.equal(run('A😀BC',[{kind:'truncation',keepRight:3}]).text,'😀BC');
  assert.equal(run('A😀BC',[{kind:'truncation',keepLeft:2}]).text,'A😀');
  assert.equal(run('AB',[{kind:'truncation',keepRight:0}]).text,'');
  assert.equal(run('AB',[{kind:'truncation',discardRight:10}]).text,'');
  for(const config of [{discardRight:-1},{keepRight:1.5},{keepLeft:NaN}])assert.throws(()=>run('AB',[{kind:'truncation',...config}]),/nonnegative/);
});
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
test('suppression removes the whole source including subsequent prefix and human-readable output',()=>{
  const result=Transforms.applyTransforms({kind:'text',value:'123',text:'123',hriText:'1-2-3'},[{kind:'suppression',when:'always'},{kind:'prefix-suffix',prefix:'LOT-',suffix:'!'}]);
  assert.equal(result.text,'');assert.equal(result.hriText,'');
});
test('range checking rejects malformed dates and reversed bounds instead of ignoring them',()=>{
  const Types=require('../gui/source-types'),date=Types.parseAndFormat('2026-10-17',{kind:'date',pattern:'yyyy-MM-dd',timeZone:'UTC'});
  assert.throws(()=>Transforms.applyTransforms(date,[{kind:'range',minimum:'bad date'}]),/date/i);
  assert.throws(()=>Transforms.applyTransforms(date,[{kind:'range',maximum:'2026-02-30'}]),/date/i);
  assert.throws(()=>run('7',[{kind:'range',minimum:9,maximum:2}]),/range|bound/i);
});

test('wildcard search follows every installed help line-matching example without consuming CRLF on replacement',()=>{
  const input='Cutter\r\nCutter ABCD\r\nfoo Cutter xyz\r\nxCutter\r\n',replace=search=>run(input,[{kind:'search-replace',actions:[{syntax:'wildcard',search,replace:'[M]'}]}]).text;
  assert.equal(replace('^Cutter$'),'[M]\r\nCutter ABCD\r\nfoo Cutter xyz\r\nxCutter\r\n');
  assert.equal(replace('^Cutter*$'),'[M]\r\n[M]\r\nfoo Cutter xyz\r\nxCutter\r\n');
  assert.equal(replace('^*Cutter*$'),'[M]\r\n[M]\r\n[M]\r\n[M]\r\n');
  assert.equal(replace('^Cutter ???*$'),'Cutter\r\n[M]\r\nfoo Cutter xyz\r\nxCutter\r\n');
  assert.equal(replace('Cutter'),'[M]\r\n[M] ABCD\r\nfoo [M] xyz\r\nx[M]\r\n');
});
test('wildcard escapes, repeated stars, invalid patterns and line endings follow documented search rules',()=>{
  const replace=(text,search,replacement='X')=>run(text,[{kind:'search-replace',actions:[{syntax:'wildcard',search,replace:replacement}]}]).text;
  assert.equal(replace('A\r\nB AxxB','A*B'),'A\r\nB X');assert.equal(replace('a?b axb','a\\?b'),'X axb');assert.equal(replace('A\x1dB','\\x1d'),'AXB');
  assert.equal(replace('aZZ*b aZZb','a**b'),'X aZZb');assert.equal(replace('A\r\nB','$','!'),'A!\r\nB!');assert.equal(replace('unchanged','^'),'unchanged');
  assert.throws(()=>replace('Axx','A*'),/wildcard/i);assert.throws(()=>replace('A','\\xZZ'),/hex|wildcard/i);
});
test('search operations delete complete wildcard lines and insert literal text before or after matches',()=>{
  const apply=(text,action)=>run(text,[{kind:'search-replace',actions:[action]}]).text;
  assert.equal(apply('Cutter\r\nKEEP\r\n',{syntax:'wildcard',operation:'delete',search:'^Cutter$'}),'KEEP\r\n');
  assert.equal(apply('abc abc',{operation:'insert-before',search:'abc',insert:'$&',all:false}),'$&abc abc');
  assert.equal(apply('abc abc',{operation:'insert-after',search:'abc',insert:'!'}),'abc! abc!');
  assert.equal(apply('A1 A2',{syntax:'regex',search:'A(\\d)',replace:'[$1]'}),'[1] [2]');
  assert.throws(()=>apply('a',{syntax:'unsupported',search:'a'}),/syntax/i);
});

test('legacy regex boolean remains compatible with ordered replacement actions',()=>{assert.equal(run('A1',[{kind:'search-replace',actions:[{regex:true,search:'A(\\d)',replace:'B$1'}]}]).text,'B1');});

const nativeFilters=require('./fixtures/native-character-filter.json');
const nativeFilterModes={All:'all',NumericOnly:'digits',CurrencyOnly:'currency',AlphaOnly:'ascii-letters',AlphanumericOnly:'ascii-alphanumeric',HexadecimalOnly:'hex',ISO646Invariant:'iso646'};
for(const group of nativeFilters.modes)test('character filter matches native single-character acceptance: '+group.native,()=>{
  const mode=nativeFilterModes[group.native];assert.equal(group.accepted.length,nativeFilters.inputs.length);
  nativeFilters.inputs.forEach((input,index)=>{
    const config={kind:'filter',mode};const label=group.native+' U+'+Array.from(input,c=>c.codePointAt(0).toString(16)).join('/');
    assert.equal(run(input,[config]).text,group.accepted[index]?input:'',label);
    if(group.accepted[index])assert.equal(run(input,[{...config,removeInvalid:false}]).text,input,label);
    else assert.throws(()=>run(input,[{...config,removeInvalid:false}]),/invalid characters/i,label);
  });
});
test('legacy Unicode filter modes retain their accepted letters and digits',()=>{
  assert.equal(run('éก١A1',[{kind:'filter',mode:'letters'}]).text,'éกA');
  assert.equal(run('éก١A1',[{kind:'filter',mode:'alphanumeric'}]).text,'éก١A1');
  assert.equal(run('éก١A1',[{kind:'filter',mode:'ascii-alphanumeric'}]).text,'A1');
});
