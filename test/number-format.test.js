const {test}=require('node:test'),assert=require('node:assert/strict');
const Types=require('../gui/source-types');
const cases=require('./fixtures/bartender-number-format.json');
test('Number formatting matches 1200 isolated native outputs across locales and all precision/sign/leading-zero modes',()=>{for(const row of cases)assert.equal(Types.parseAndFormat(row.value,row.config).text,row.output,JSON.stringify(row));});
test('Number fixed precision supports 0 through 30 decimal places and exact input digits',()=>{
 assert.equal(Types.parseAndFormat('1.005',{kind:'number',precisionMode:'fixed',decimals:2}).text,'1.01');
 assert.equal(Types.parseAndFormat('1.1234567890123456789012345678',{kind:'number',precisionMode:'fixed',decimals:30,grouping:false}).text,'1.123456789012345678901234567800');
 for(const decimals of [-1,31,1.5])assert.throws(()=>Types.parseAndFormat('1',{kind:'number',decimals}),/decimal/i);
 assert.throws(()=>Types.parseAndFormat('1',{kind:'number',precisionMode:'unknown'}),/precision/i);
 assert.throws(()=>Types.parseAndFormat('1',{kind:'number',negativePattern:5}),/negative/i);
});
test('Number edge cases match 108 native outputs including native digits, zero rounding and precision 30',()=>{for(const row of require('./fixtures/bartender-number-edges.json'))assert.equal(Types.parseAndFormat(row.value,row.config).text,row.output,JSON.stringify(row));});
test('Input locale parses strings without reinterpreting numeric database values',()=>{const config={kind:'number',inputLocale:'de-DE',locale:'en-US',decimals:2};assert.equal(Types.parseAndFormat(1.25,config).text,'1.25');assert.equal(Types.parseAndFormat('1,25',config).text,'1.25');});
