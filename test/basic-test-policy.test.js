'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {discover,undocumented,legacy,TEST_TIMEOUT_MS}=require('../scripts/run-basic-unit-tests');
test('basic suite timeout accommodates the complete expanded unit inventory',()=>assert.ok(TEST_TIMEOUT_MS>=900000));
test('basic suite discovers every unit file, including new nested suites',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-basic-policy-'));
  t.after(()=>{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(root,{recursive:true,force:true});});
  fs.mkdirSync(path.join(root,'test/nested'),{recursive:true});
  for(const file of ['test/first.test.js','test/new.test.js','test/nested/extra.test.js','test/ui-runtime.js','test/report.json'])fs.writeFileSync(path.join(root,file),'');
  assert.deepEqual(discover(root),['test/first.test.js','test/nested/extra.test.js','test/new.test.js']);
});
test('a new unit test must be added to the markdown inventory',()=>{
  assert.deepEqual(undocumented(['test/old.test.js','test/new.test.js'],'`test/old.test.js`'),['test/new.test.js']);
  assert.deepEqual(undocumented(['test/new.test.js'],'`test/new.test.js`'),[]);
});
test('the actual repository inventory documents every unit and legacy basic suite',()=>{
  const root=path.resolve(__dirname,'..'),document=fs.readFileSync(path.join(root,'UNIT_TEST_BASIC.md'),'utf8');
  assert.deepEqual(undocumented([...discover(root),...legacy],document),[]);
  assert.match(fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'),/UNIT_TEST_BASIC\.md/);
});
