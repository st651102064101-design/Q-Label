'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const native=()=>fs.readFileSync(require.resolve('./fixtures/databuilder/native-text.btdb'),'utf8');
test('Data Builder parser reads a file saved by native DataBuilder without importing system metadata',async()=>{
 const {parseDataBuilder}=require('../lib/database/databuilder');const tables=parseDataBuilder(native());
 assert.deepEqual(tables,[{name:'Data Table 1',columns:['ID','Field1'],rows:[{ID:'0',Field1:'001 Tea'}]}]);
 assert.equal(JSON.stringify(tables).includes('_BARTENDER_'),false);assert.equal(JSON.stringify(tables).includes('FileSystemFileName'),false);
 assert.deepEqual(await require('../lib/database-import').importFile('builder',new TextEncoder().encode(native())),tables);
});
test('Data Builder schema provides columns for empty tables and defaults for omitted cells',()=>{
 const {parseDataBuilder}=require('../lib/database/databuilder');
 const xml=native().replace('<Field1>001 Tea</Field1>','').replace('name="Field1" type="xs:string" minOccurs="0"','name="Field1" type="xs:string" minOccurs="0" default="default text"');
 assert.equal(parseDataBuilder(xml)[0].rows[0].Field1,'default text');
 const empty=native().replace(/  <Data_x0020_Table_x0020_1>[\s\S]*?<\/Data_x0020_Table_x0020_1>\r?\n/,'');
 assert.deepEqual(parseDataBuilder(empty)[0].columns,['ID','Field1']);assert.deepEqual(parseDataBuilder(empty)[0].rows,[]);
});
test('Data Builder XML preserves encoded column names and treats xsi:nil as an empty cell',()=>{
 const {parseDataBuilder}=require('../lib/database/databuilder');
 const xml=native().replaceAll('name="Field1"','name="Item_x0020_Name"').replace('<Field1>001 Tea</Field1>','<Item_x0020_Name xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:nil="true"/>');
 assert.deepEqual(parseDataBuilder(xml)[0].columns,['ID','Item Name']);assert.equal(parseDataBuilder(xml)[0].rows[0]['Item Name'],'');
});
test('unsupported Data Builder versions, legacy SQL files, DTDs and reserved names fail explicitly',()=>{
 const {parseDataBuilder}=require('../lib/database/databuilder');
 assert.throws(()=>parseDataBuilder(native().replace('11.2.R0','99.0.R0')),/version/i);
 assert.throws(()=>parseDataBuilder('\u0001legacy SQL Server bytes'),/XML|legacy|format/i);
 assert.throws(()=>parseDataBuilder('<!DOCTYPE BtDataSet [<!ENTITY x "secret">]>'+native()),/DTD|entities/i);
 assert.throws(()=>parseDataBuilder(native().replaceAll('Field1','constructor')),/reserved|column/i);
});
