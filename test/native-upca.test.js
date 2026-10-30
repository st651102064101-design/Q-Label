'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {nativeUpcaSize,nativeUpcaData}=require('../lib/btw-native-upca');
test('native UniGDI UPC sizing matches all 637 controlled native target sizes',()=>{
 const rows=fs.readFileSync(path.join(__dirname,'fixtures/native-upca-size-table.csv'),'utf8').trim().split(/\r?\n/).slice(1);
 assert.equal(rows.length,637);for(const line of rows){const [target,index,mils,mm,density]=line.split(',').map(Number);const r=nativeUpcaSize({target_width_mm:target,minimum_x_mils:5,maximum_x_mils:500});assert.equal(r.index,index,'target '+target);assert.ok(Math.abs(r.nominal_x_mils-mils)<.006);assert.ok(Math.abs(12/r.bar_width_mm*25.4-density)<.0011);assert.ok(Math.abs(r.effective_x_mm*95-r.bar_width_mm)<1e-10);}
 const r=nativeUpcaSize({target_width_mm:48.26,minimum_x_mils:5,maximum_x_mils:500});assert.equal(r.index,4);assert.ok(Math.abs(r.bar_width_mm-45.72)<1e-10);
});
test('native UPC source profile pads the observed 10 digit input and validates original GTIN check digits',()=>{
 assert.equal(nativeUpcaData('1234567890'),'01234567890');assert.equal(nativeUpcaData('12345678901'),'12345678901');assert.equal(nativeUpcaData('123456789012'),'123456789012');assert.throws(()=>nativeUpcaData('123456789019'),/check digit/i);assert.throws(()=>nativeUpcaData('1234567890123'),/GTIN-12/i);assert.throws(()=>nativeUpcaData('12345a7890'),/digits/i);
});
test('native sizing refuses unproven bounds, invalid widths and unsupported profile settings',()=>{
 for(const target of [0,Infinity,NaN,161])assert.throws(()=>nativeUpcaSize({target_width_mm:target,minimum_x_mils:5,maximum_x_mils:500}),/width/i);
 assert.throws(()=>nativeUpcaSize({target_width_mm:48.26,minimum_x_mils:8,maximum_x_mils:500}),/bounds/i);
});
