'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
test('Oracle DSN flow validates selection and excludes passwords from saved configuration',()=>{const {mount}=require('../gui/database-native-flow'),dom=new JSDOM('<main></main>'),d=dom.window.document;const flow=mount(d.querySelector('main'),{typeId:'oracle',availability:{dataSources:[{name:'Oracle sales',type:'User'}]}});assert.match(d.querySelector('h2').textContent,/Oracle/);assert.equal(flow.isValid(),false);d.querySelector('[name=dsn]').value='Oracle sales';d.querySelector('[name=password]').value='secret';assert.equal(flow.isValid(),true);assert.equal(flow.publicConfig().password,undefined);assert.equal(flow.publicConfig().requiresPassword,true);dom.window.close();});
test('SQL Server and Azure SQL use the BarTender-style server page without persisting passwords',async()=>{
 const {mount}=require('../gui/database-native-flow');
 for(const typeId of ['sqlserver','azure-sql']){
  const dom=new JSDOM('<main></main>'),d=dom.window.document;
  const flow=mount(d.querySelector('main'),{typeId,availability:{drivers:['ODBC Driver 17 for SQL Server'],servers:['localhost']},listDatabases:async()=>({databases:['master','SalesDB']})});
  assert.match(d.querySelector('h2').textContent,/SQL/i);
  assert.equal(d.querySelector('[name=dsn]'),null,'SQL Server no longer uses the ODBC DSN list on this page');
  const main=d.querySelector('main');
  assert.match(main.textContent,/Windows Authentication/i);
  assert.match(main.textContent,/Store the credentials with the document/i);
  assert.equal(flow.isValid(),false);
  d.querySelector('[name=server]').value='localhost';
  await flow.refreshDatabases();
  await new Promise(r=>setTimeout(r,0));
  d.querySelector('[name=database]').value='SalesDB';
  d.querySelector('[name=authMode][value=sql]').checked=true;
  d.querySelector('[name=authMode][value=sql]').dispatchEvent(new dom.window.Event('change'));
  d.querySelector('[name=userName]').value='alice';
  d.querySelector('[name=password]').value='secret';
  assert.equal(flow.isValid(),true);
  assert.equal(flow.publicConfig().password,undefined);
  assert.equal(flow.publicConfig().server,'localhost');
  assert.equal(flow.publicConfig().database,'SalesDB');
  dom.window.close();
 }
});
test('ODBC flow switches between real DSN choices and File DSN and excludes the password from saved config',async()=>{
 const {mount}=require('../gui/database-native-flow');const dom=new JSDOM('<main></main>'),d=dom.window.document;let changes=0;
 const flow=mount(d.querySelector('main'),{typeId:'odbc',availability:{dataSources:[{name:'Reports',type:'User'}]},onChange:()=>changes++,pickFile:async()=>({ok:true,filePath:'C:/reports.dsn'})});
 assert.equal(flow.isValid(),false);const sources=d.querySelector('[name=dsn]');sources.value='Reports';sources.dispatchEvent(new dom.window.Event('change'));assert.equal(flow.isValid(),true);
 d.querySelector('[name=password]').value='private';assert.equal(flow.readConfig().password,'private');assert.equal(flow.publicConfig().password,undefined);
 const fileMode=d.querySelector('[value=file]');fileMode.checked=true;fileMode.dispatchEvent(new dom.window.Event('change'));assert.equal(flow.isValid(),false);assert.equal(sources.disabled,true);
 d.querySelector('[data-native-browse]').click();await new Promise(r=>setTimeout(r,0));assert.equal(flow.isValid(),true);assert.equal(flow.readConfig().fileDsn,'C:/reports.dsn');assert.equal(flow.readConfig().dsn,undefined);assert.ok(changes>=2);dom.window.close();
});
test('OLE DB flow requires a provider and data source, and integrated security disables credential fields',()=>{
 const {mount}=require('../gui/database-native-flow');const dom=new JSDOM('<main></main>'),d=dom.window.document;
 const flow=mount(d.querySelector('main'),{typeId:'oledb',availability:{providers:[{id:'Microsoft.ACE.OLEDB.16.0',name:'Access provider'}]}});
 assert.equal(flow.isValid(),false);d.querySelector('[name=provider]').value='Microsoft.ACE.OLEDB.16.0';d.querySelector('[name=dataSource]').value='C:/data.accdb';assert.equal(flow.isValid(),true);
 d.querySelector('[name=integratedSecurity]').checked=true;d.querySelector('[name=integratedSecurity]').dispatchEvent(new dom.window.Event('change'));
 assert.equal(d.querySelector('[name=password]').disabled,true);assert.equal(flow.publicConfig().integratedSecurity,true);dom.window.close();
});
test('OLE DB UDL selection uses the file path without serializing credentials',async()=>{
 const {mount}=require('../gui/database-native-flow');const dom=new JSDOM('<main></main>'),d=dom.window.document;
 const flow=mount(d.querySelector('main'),{typeId:'oledb',availability:{providers:[]},pickFile:async()=>({ok:true,filePath:'C:/connection.udl'})});
 const select=d.querySelector('[name=provider]');select.value='__udl__';select.dispatchEvent(new dom.window.Event('change'));
 d.querySelector('[data-native-browse]').click();await new Promise(r=>setTimeout(r,0));
 assert.equal(flow.isValid(),true);assert.deepEqual(flow.publicConfig(),{udl:'C:/connection.udl'});assert.equal(d.querySelector('[name=password]').disabled,true);dom.window.close();
});
