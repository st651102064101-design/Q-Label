'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {executeScript}=require('../lib/source-vbscript');
test('renamed literal named references still execute in Windows Script Host',async()=>{
  const Model=require('../gui/source-model'),doc=Model.migrate({elements:[{type:'text',text:'ABC'},{type:'text',text:'script'}]}),[id,script]=doc.elements.map(e=>e.dataSourceRefs[0]);doc.sourceDefinitions[id].name='Lot';doc.sourceDefinitions[script].kind='vbscript';doc.sourceDefinitions[script].config={code:'Value = NamedSubString("Lot") & "-" & Format.GetNamedSubStringValue("Lot")'};const renamed=Model.renameSource(doc,id,'Batch');const result=await executeScript({code:renamed.sourceDefinitions[script].config.code,bindings:{Batch:'ABC'}});assert.equal(result.value,'ABC-ABC');
});
test('real VBScript runtime evaluates result, Unicode and named source bridge',async()=>{
  const result=await executeScript({code:'Value = NamedSubString("lot") & "-" & CStr(2 + 3) & "-ก"',bindings:{lot:'ABC'}});
  assert.equal(result.value,'ABC-5-ก');
  const format=await executeScript({code:'Value = Format.NamedSubStrings("lot").Value',bindings:{lot:'42'}});assert.equal(format.value,'42');
});
test('VBScript exposes script errors and terminates long-running scripts',async()=>{
  await assert.rejects(executeScript({code:'Value = ('}),/VBScript|script/i);
  const before=Date.now();await assert.rejects(executeScript({code:'Do\nLoop'},{timeoutMs:200}),/time|abort|killed/i);assert.ok(Date.now()-before<5000);
});
test('VBScript diagnostics preserve the real runtime error description',async()=>{
  await assert.rejects(executeScript({code:'Err.Raise 513, "Source test", "Missing lot number ก"'}),/Missing lot number ก/);
  await assert.rejects(executeScript({code:'Value = NamedSubString("missing")'}),/Unknown named source: missing/);
});
