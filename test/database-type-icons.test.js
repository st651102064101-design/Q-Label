'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {getDatabaseTypes}=require('../lib/database/catalog');
const dir=path.join(__dirname,'../gui/assets/database-types');
function loadIcons(){
 const context={globalThis:{}};context.window=context.globalThis;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../gui/database-type-icons.js'),'utf8'),context);
 return context.globalThis.DatabaseTypeIcons;
}
test('every catalog database type has a BarTender-derived PNG icon asset',()=>{
 const icons=loadIcons();
 for(const type of getDatabaseTypes()){
  const file=icons.files[type.id];
  assert.ok(file,`${type.id} maps to a PNG filename`);
  const full=path.join(dir,file);
  assert.ok(fs.existsSync(full),`${full} exists`);
  const bytes=fs.readFileSync(full);
  assert.equal(bytes[0],0x89);assert.equal(bytes[1],0x50);assert.equal(bytes[2],0x4e);assert.equal(bytes[3],0x47);
  assert.match(icons.src(type.id),new RegExp(`${type.id}\\.png$`));
 }
});
