'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ExcelJS=require('exceljs/dist/exceljs.min.js');
const {JSDOM}=require('jsdom');
const api=require('../lib/database-import');
const {resolve}=require('../gui/data-source-engine');
const {preparePrintJob}=require('../lib/print-job');
const bytes=text=>new TextEncoder().encode(text);
const expected=[{sku:'0001',name:'Tea',price:'12.5'},{sku:'0002',name:'Coffee',price:'20'}];
async function workbook(){const book=new ExcelJS.Workbook();for(const name of ['Products','Second sheet']){const sheet=book.addWorksheet(name);sheet.addRow(['sku','name','price']);expected.forEach(row=>sheet.addRow(Object.values(row)));}return new Uint8Array(await book.xlsx.writeBuffer());}
const samples={text:()=>bytes('sku,name,price\n0001,Tea,12.5\n0002,Coffee,20'),json:()=>bytes(JSON.stringify(expected)),xml:()=>bytes('<products><product><sku>0001</sku><name>Tea</name><price>12.5</price></product><product><sku>0002</sku><name>Coffee</name><price>20</price></product></products>'),excel:workbook};
samples.import=()=>bytes(JSON.stringify({format:'ZebraBarConnection',version:1,connection:{tables:[{name:'Products',columns:['sku','name','price'],rows:expected}]}}));
test('connection snapshot import validates envelope and table schema',async()=>{
 for(const value of [{format:'other',version:1,connection:{tables:[]}}, {format:'ZebraBarConnection',version:2,connection:{tables:[]}}, {format:'ZebraBarConnection',version:1,connection:{tables:[{name:'Products',columns:['sku','sku'],rows:expected}]}}])await assert.rejects(api.importFile('import',bytes(JSON.stringify(value))),/connection|columns/i);
 const tables=await api.importFile('import',await samples.import());assert.equal(tables[0].name,'Products');assert.deepEqual(tables[0].rows,expected);
 await assert.rejects(api.importFile('import',bytes('<DatabaseSetup/>')),/BarTender DatabaseSetup XML is not supported/);
 for(const tables of [
  [{name:'A',columns:['sku'],rows:[{sku:'1',extra:'2'}]}],
  [{name:'A',columns:['constructor'],rows:[{constructor:'1'}]}],
  [{name:'A',columns:['sku'],rows:[{sku:'1'}]},{name:'A',columns:['sku'],rows:[{sku:'2'}]}],
  [{name:'A',columns:['sku'],rows:null}]
 ])await assert.rejects(api.importFile('import',bytes(JSON.stringify({format:'ZebraBarConnection',version:1,connection:{tables}}))));
});
test('connection snapshots retain empty tables with their declared schema',async()=>{
 const value=JSON.parse(new TextDecoder().decode(await samples.import()));
 value.connection.tables.push({name:'Empty',columns:['id','name'],rows:[]});
 const tables=await api.importFile('import',bytes(JSON.stringify(value)));assert.equal(tables.length,2);assert.deepEqual(tables[1],{name:'Empty',columns:['id','name'],rows:[]});
});
samples.builder=()=>bytes('<BtDataSet xmlns="http://tempuri.org/BtDataSet.xsd"><xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="http://tempuri.org/BtDataSet.xsd"><xs:element name="BtDataSet"><xs:complexType><xs:choice><xs:element name="Products"><xs:complexType><xs:sequence>'+['sku','name','price'].map(name=>'<xs:element name="'+name+'" type="xs:string"/>').join('')+'</xs:sequence></xs:complexType></xs:element></xs:choice></xs:complexType></xs:element></xs:schema><_BARTENDER_DatabaseProperties><Name>SchemaVersion</Name><Value>11.2.R0</Value></_BARTENDER_DatabaseProperties>'+expected.map(row=>'<Products>'+Object.entries(row).map(([name,value])=>'<'+name+'>'+value+'</'+name+'>').join('')+'</Products>').join('')+'</BtDataSet>');
for(const type of api.types){
  test('connector row: '+type.name,async()=>{
    if(!type.supported){await assert.rejects(api.importFile(type.id,bytes('anything')),new RegExp(type.description.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.throws(()=>new api.Wizard().select(type.id),/unavailable/);return;}
    const tables=await api.importFile(type.id,await samples[type.id]());
    assert.deepEqual(tables[0].rows,expected);
    const sources=api.createSources(tables[0],tables[0].columns);
    const template={width_mm:60,height_mm:30,dpi:203,elements:[{type:'text',x_mm:1,y_mm:1,height_mm:3,text:'{{sku}} {{name}} {{price}}'},{type:'barcode128',x_mm:1,y_mm:6,bar_height_mm:10,module_width:1,text:'{{sku}}'}],data_sources:sources};
    for(let i=0;i<expected.length;i++)for(const field of tables[0].columns)assert.equal(resolve(template,{}, {index:i})[field],expected[i][field],type.id+' row '+i+' column '+field);
    const connected={...template,database_connection:{fields:Object.fromEntries(tables[0].columns.map(name=>[name,name]))}};
    const print=preparePrintJob({template:api.printTemplate(connected,true),rows:[expected[1],expected[0]],copies:2,connection:{type:'ip',host:'127.0.0.1'}});
    assert.deepEqual(print.dataList.map(row=>row.sku),['0002','0002','0001','0001'],'selected order and copies preserve each database record');
    for(const row of expected)assert.ok(print.zpl.toString().includes(row.sku));
  });
}
test('text tools: delimiters, escaped quotes, multiline cells, no headers, Thai encoding',async()=>{
  assert.deepEqual(api.parseText('sku;note\r\n001;"a; b\r\nnew ""line"""').rows,[{sku:'001',note:'a; b\r\nnew "line"'}]);
  assert.deepEqual(api.parseText('sku\tname\n001\tTea').rows,[{sku:'001',name:'Tea'}]);
  assert.deepEqual(api.parseText('001|Tea\n002|Coffee',{delimiter:'|',headers:false}).rows,[{Field_1:'001',Field_2:'Tea'},{Field_1:'002',Field_2:'Coffee'}]);
  const thai=await api.importFile('text',new Uint8Array([0x6e,0x61,0x6d,0x65,0x0a,0xa1]),{encoding:'windows-874'});assert.equal(thai[0].rows[0].name,'ก');
  assert.equal((await api.importFile('text',bytes('name\nชา')))[0].rows[0].name,'ชา');
  for(const text of ['a,a\n1,2','a,\n1,2','a\n"unclosed','a\n1,2','__proto__\n1'])assert.throws(()=>api.parseText(text));
});
test('XML tools: attributes, nested columns, single record and invalid files',()=>{
  const tables=api.xmlTables('<root><item code="001"><detail><name>Tea &amp; milk</name></detail></item><item code="002"><detail><name>Coffee</name></detail></item></root>');
  assert.equal(tables[0].name,'root.item');assert.equal(tables[0].rows[0]['@code'],'001');assert.equal(tables[0].rows[0]['detail.name'],'Tea & milk');
  assert.equal(api.xmlTables('<product><sku>001</sku></product>')[0].rows[0].sku,'001');
  assert.throws(()=>api.xmlTables('<root><a></root>'),/Invalid XML/);assert.throws(()=>api.xmlTables('<!DOCTYPE root><root/>'),/DTD/);
});
test('Excel tools: worksheet selection and cached formula results',async()=>{
  const tables=await api.importFile('excel',await workbook());const state=new api.Wizard();state.select('excel');state.load(tables,'products.xlsx');state.chooseTable(1);assert.equal(state.tables[state.tableIndex].name,'Second sheet');
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Formula');sheet.addRow(['sku','price']);sheet.addRow(['001',{formula:'2+3',result:5}]);const parsed=await api.importFile('excel',new Uint8Array(await book.xlsx.writeBuffer()));assert.equal(parsed[0].rows[0].price,'5');
  sheet.getCell('B2').value={formula:'2+3'};await assert.rejects(api.importFile('excel',new Uint8Array(await book.xlsx.writeBuffer())),/no saved result/);
});
test('JSON tools: nested values, optional fields, malformed or empty input',async()=>{
  const table=(await api.importFile('json',bytes('[{"code":"001","detail":{"label":"Tea"}},{"code":"002"}]')))[0];assert.deepEqual(table.columns,['code','detail.label']);assert.equal(table.rows[0]['detail.label'],'Tea');
  for(const value of ['[]','[1]','{broken'])await assert.rejects(api.importFile('json',bytes(value)));
  await assert.rejects(api.importFile('text',new Uint8Array(20*1024*1024+1)),/20 MB/);
});
test('wizard navigation and field selection reject incomplete or conflicting setup',()=>{
  const state=new api.Wizard();assert.throws(()=>state.next(),/Select/);state.select('text');state.next();assert.throws(()=>state.next(),/Load/);state.load([{name:'Rows',...api.records(expected)}],'products.csv');state.next();state.columns=['sku'];assert.deepEqual(Object.keys(state.finish({prefix:'product_'})),['product_sku']);assert.throws(()=>state.finish({}, {sku:{}}),/already exists/);state.columns=[];assert.throws(()=>state.finish({}),/at least one/);state.back();assert.equal(state.step,1);state.back();state.back();assert.equal(state.step,0);
});
test('database record navigation updates the selected record and disables boundary controls',()=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body><div id="previewFrame"></div></body></html>',{runScripts:'outside-only'}),w=dom.window;
  w.databasePreviewRecord=0;w.editing={database_connection:{rows:[{sku:'001'},{sku:'002'},{sku:'003'}]},data_sources:{sku:{type:'table',row:'auto',column:'sku'}}};w.getEditingTemplate=()=>w.editing;let draws=0;w.drawEditorCanvas=()=>{draws++;};
  w.eval(fs.readFileSync(path.join(__dirname,'../gui/database-record-navigator.js'),'utf8'));const q=s=>w.document.querySelector('.database-record-navigator '+s),bar=w.document.querySelector('.database-record-navigator');
  w.DatabaseRecordNavigator.sync(w.editing);assert.equal(bar.hidden,false);assert.equal(q('.database-record-count').textContent,'1 of 3');assert.equal(q('button[aria-label="First record"]').disabled,true);
  q('button[aria-label="Next record"]').click();assert.equal(w.databasePreviewRecord,1);assert.equal(q('.database-record-count').textContent,'2 of 3');assert.equal(draws,1);
  q('button[aria-label="Last record"]').click();assert.equal(w.databasePreviewRecord,2);assert.equal(q('.database-record-count').textContent,'3 of 3');assert.equal(q('button[aria-label="Next record"]').disabled,true);
  q('button[aria-label="Previous record"]').click();assert.equal(w.databasePreviewRecord,1);q('button[aria-label="First record"]').click();assert.equal(w.databasePreviewRecord,0);assert.equal(draws,4);
  w.DatabaseRecordNavigator.sync({database_connection:{rows:[{},{},{}]},data_sources:{sku:{type:'table',row:0,column:'sku'}}});assert.equal(bar.hidden,true,'fixed-record fields do not show record navigation');w.DatabaseRecordNavigator.sync({});assert.equal(bar.hidden,true);dom.window.close();
});
function ui(){
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'outside-only'}),w=dom.window;let saved=0;
  w.DatabaseImport=api;w.DatabaseProviderTypes=require('../gui/database-provider-types');w.editing={elements:[],data_sources:{}};w.lastValueNames='';for(const name of ['readEditorIntoDraft','pushSnapshot','touchEditor','renderEditorValues','updateEditorPreview'])w[name]=()=>{};w.persistEditor=async()=>{saved++;};w.DataSourcesUI={render(){}};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.eval(fs.readFileSync(path.join(__dirname,'../gui/database-field-names.js'),'utf8'));
  w.eval(fs.readFileSync(path.join(__dirname,'../gui/database-type-icons.js'),'utf8'));
  w.eval(fs.readFileSync(path.join(__dirname,'../gui/database-setup.js'),'utf8'));
  const q=selector=>w.document.querySelector('#databaseSetupDialog '+selector);
  return {w,q,dom,saved:()=>saved};
}
async function tick(){await new Promise(resolve=>setTimeout(resolve,10));}

test('SQL Server and Azure SQL wizard opens the server connection page and commits records without the password',async()=>{
 for(const type of ['sqlserver','azure-sql']){const {w,q,dom}=ui();w.eval(fs.readFileSync(require.resolve('../gui/database-native-flow'),'utf8'));let request;w.zebra={database:{detect:async id=>({available:id===type,drivers:['ODBC Driver 17 for SQL Server'],servers:['localhost']}),listDatabases:async()=>({ok:true,data:{databases:['SalesDB']}}),open:async value=>{request=value;return {ok:true,data:{tables:[{name:'Orders',columns:['id'],rows:[{id:'001'}]}]}};},dispose:async()=>{}}};w.DatabaseSetupUI.open();await tick();assert.equal(q(`[data-type="${type}"]`).disabled,false);q(`[data-type="${type}"]`).click();await tick();q('.db-next').click();await tick();assert.equal(q('header strong').textContent,'Database Setup Wizard');q('[name=server]').value='localhost';q('[name=server]').dispatchEvent(new w.Event('input',{bubbles:true}));q('[name=database]').value='SalesDB';q('[name=database]').dispatchEvent(new w.Event('input',{bubbles:true}));q('[name=authMode][value=sql]').checked=true;q('[name=authMode][value=sql]').dispatchEvent(new w.Event('change',{bubbles:true}));q('[name=userName]').value='alice';q('[name=userName]').dispatchEvent(new w.Event('input',{bubbles:true}));q('[name=password]').value='private';q('[name=password]').dispatchEvent(new w.Event('input',{bubbles:true}));await tick();q('.db-next').click();await tick();await tick();assert.equal(request.typeId,type);assert.equal(request.config.server,'localhost');assert.equal(request.config.database,'SalesDB');assert.equal(request.config.password,'private');assert.match(q('main').textContent,/Choose fields/);q('.db-finish').click();await tick();assert.equal(w.editing.database_connection.type,type);assert.equal(w.editing.database_connection.rows[0].id,'001');assert.equal(Object.hasOwn(w.editing.database_connection.providerOptions||{},'password'),false);assert.equal(w.editing.database_connection.providerOptions?.requiresPassword,true);dom.window.close();}
 for(const type of ['oracle']){const {w,q,dom}=ui();w.eval(fs.readFileSync(require.resolve('../gui/database-native-flow'),'utf8'));let request;w.zebra={database:{detect:async id=>({available:id===type,dataSources:[{name:'Sales',type:'User'}]}),open:async value=>{request=value;return {ok:true,data:{tables:[{name:'Orders',columns:['id'],rows:[{id:'001'}]}]}};},dispose:async()=>{}}};w.DatabaseSetupUI.open();await tick();q(`[data-type="${type}"]`).click();q('.db-next').click();q('[name=dsn]').value='Sales';q('[name=dsn]').dispatchEvent(new w.Event('change'));q('[name=password]').value='private';q('.db-next').click();await tick();assert.equal(request.config.dsn,'Sales');dom.window.close();}
});

test('retired Excel Online source is not offered in the data source picker',()=>{
 const {w,q,dom}=ui();
 try{w.DatabaseSetupUI.open();assert.equal(q('[data-type=online]'),null);assert.equal(q('.db-types').querySelectorAll('button').length,22);}
 finally{dom.window.close();}
});

test('Connect label data navigation keeps directional SVG icons through Next and Back',()=>{
  const {w,q,dom}=ui();w.DatabaseSetupUI.open();
  const next=q('.db-next'),back=q('.db-back');
  assert.ok(next.querySelector('svg[data-icon="arrow-right"]'),'Next has a right arrow SVG');
  assert.ok(back.querySelector('svg[data-icon="arrow-left"]'),'Back has a left arrow SVG instead of a generic add icon');
  assert.equal(next.querySelector('svg').getAttribute('stroke'),'currentColor');
  q('[data-type=text]').click();next.click();assert.equal(back.disabled,false);back.click();
  assert.equal(q('main h2').textContent,'Choose your data source');
  assert.ok(next.querySelector('svg[data-icon="arrow-right"]'));assert.ok(back.querySelector('svg[data-icon="arrow-left"]'));
  dom.window.close();
});
test('real wizard buttons: each source row, Next, Back, file load, column toggles, Finish and Cancel',async()=>{
  const {w,q,dom,saved}=ui();w.DatabaseSetupUI.open();assert.equal(q('.db-next').disabled,true);
  for(const type of api.types)assert.equal(q('[data-type="'+type.id+'"]').disabled,!type.supported);
  q('[data-type=text]').click();q('.db-next').click();q('.db-back').click();assert.ok(q('[data-type=text]'));q('.db-next').click();
  const input=q('input[type=file]');Object.defineProperty(input,'files',{value:[{name:'products.csv',arrayBuffer:async()=>bytes('sku,name\n001,Tea\n002,Coffee').buffer}]});input.dispatchEvent(new w.Event('change'));await tick();assert.equal(q('.db-next').disabled,false);assert.equal(q('tbody').children.length,2);
  q('.db-next').click();const name=q('input[data-column=name]');name.checked=false;name.dispatchEvent(new w.Event('change'));q('[name=prefix]').value='product_';q('.db-finish').click();await tick();assert.equal(saved(),1);assert.deepEqual(Object.keys(w.editing.data_sources),['product_sku']);assert.equal(w.editing.data_sources.product_sku.rows[1].sku,'002');assert.equal(w.editing.database_connection.fields.product_sku,'sku');assert.equal(q('header').parentElement.open,false);
  w.DatabaseSetupUI.open();q('[data-type=json]').click();q('.db-cancel').click();assert.equal(saved(),1);dom.window.close();
});
test('Database Fields use imported column names while retaining source-column mapping',async()=>{
  const {w,q,dom}=ui();w.DatabaseSetupUI.open();q('[data-type=text]').click();q('.db-next').click();const input=q('input[type=file]');Object.defineProperty(input,'files',{value:[{name:'products.csv',arrayBuffer:async()=>bytes('sku,name,price\n001,Tea,12.5').buffer}]});input.dispatchEvent(new w.Event('change'));await tick();q('.db-next').click();q('.db-finish').click();await tick();
  assert.deepEqual(Object.keys(w.editing.data_sources),['sku','name','price']);assert.deepEqual(JSON.parse(JSON.stringify(w.editing.database_connection.fields)),{sku:'sku',name:'name',price:'price'});assert.equal(w.editing.data_sources.sku.rows[0].sku,'001');assert.equal(w.editing.data_sources.name.rows[0].name,'Tea');assert.deepEqual(JSON.parse(JSON.stringify(w.DatabaseFieldNames.sequence(['Field_1','Field_2'],2))),['Field_3','Field_4']);dom.window.close();
});
test('double-clicking a supported source option selects it and advances to file selection',()=>{
  const {w,q,dom}=ui();w.DatabaseSetupUI.open();const text=q('[data-type=text]');
  text.click();assert.equal(q('main h2').textContent,'Choose your data source','single click selects without skipping the confirmation step');assert.equal(text.getAttribute('aria-pressed'),'true');assert.equal(q('.db-next').disabled,false);
  text.dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true,cancelable:true}));assert.equal(q('main h2').textContent,'Load and review records');assert.ok(q('input[type=file]'),'double click opens the next wizard page');
  q('.db-back').click();assert.equal(q('[data-type=online]'),null,'retired sources are not rendered as disabled choices');assert.equal(q('main h2').textContent,'Choose your data source');
  dom.window.close();
});
test('Add connection preserves existing fields and object tokens, Cancel does not add',async()=>{
 const {w,q,dom}=ui();
 async function add(name,value){w.DatabaseSetupUI.open({mode:'add'});q('[data-type=text]').click();q('.db-next').click();const file=q('input[type=file]');Object.defineProperty(file,'files',{value:[{name,arrayBuffer:async()=>bytes('sku\n'+value).buffer}]});file.dispatchEvent(new w.Event('change'));await tick();q('.db-next').click();q('.db-finish').click();await tick();}
 await add('one.csv','001');const first=w.editing.database_connection.id;w.editing.elements=[{type:'text',text:'{{sku}}'}];await add('two.csv','002');
 assert.equal(w.editing.database_connections.length,2);assert.equal(w.editing.elements[0].text,'{{sku}}');assert.equal(w.editing.data_sources.sku.connectionId,first);assert.equal(w.editing.data_sources.sku.rows[0].sku,'001');assert.equal(w.editing.data_sources.sku_2.rows[0].sku,'002');
 const before=JSON.stringify(w.editing);w.DatabaseSetupUI.open({mode:'add'});q('.db-cancel').click();assert.equal(JSON.stringify(w.editing),before);dom.window.close();
});
test('each database source uses native BarTender PNG artwork in the wizard list',()=>{
  const {w,q,dom}=ui();const {getDatabaseTypes}=require('../lib/database/catalog');w.DatabaseSetupUI.open();
  for(const type of getDatabaseTypes()){
    const img=q(`[data-type="${type.id}"] img`);
    assert.ok(img,`${type.id} source has an icon image`);
    assert.equal(img.getAttribute('data-icon'),type.id);
    assert.match(img.getAttribute('src'),new RegExp(`database-types/${type.id}\\.png$`));
    assert.equal(img.width,32);assert.equal(img.height,32);
  }
  dom.window.close();
});
test('wizard preserves existing data sources while importing file-named fields',async()=>{
  const {w,q,dom,saved}=ui();w.editing.data_sources={Field_1:{type:'constant',value:'existing'}};w.DatabaseSetupUI.open();q('[data-type=text]').click();q('.db-next').click();const input=q('input[type=file]');Object.defineProperty(input,'files',{value:[{name:'p.csv',arrayBuffer:async()=>bytes('sku\n001').buffer}]});input.dispatchEvent(new w.Event('change'));await tick();q('.db-next').click();q('.db-finish').click();await tick();assert.equal(saved(),1);assert.equal(w.editing.data_sources.Field_1.value,'existing');assert.equal(w.editing.data_sources.sku.column,'sku');assert.equal(w.editing.database_connection.fields.sku,'sku');dom.window.close();
});
test('the browser bundle imports every enabled database type without Node integration',async()=>{
  const dom=new JSDOM('<!doctype html>',{runScripts:'dangerously'}),w=dom.window;w.TextDecoder=TextDecoder;
  const script=w.document.createElement('script');script.textContent=fs.readFileSync(path.join(__dirname,'../gui/database-import.bundle.js'),'utf8');w.document.body.append(script);
  for(const type of w.DatabaseImport.types.filter(t=>t.supported)){
    const tables=await w.DatabaseImport.importFile(type.id,w.Uint8Array.from(await samples[type.id]()));
    assert.deepEqual(JSON.parse(JSON.stringify(tables[0].rows)),expected,type.name+' works in the renderer');
    assert.equal(typeof w.DatabaseImport.printTemplate,'function');
  }
  dom.window.close();
});
test('Finish restores existing database fields if saving the label fails',async()=>{
  const {w,q,dom}=ui();w.persistEditor=async()=>{throw Error('Disk write failed');};
  w.DatabaseSetupUI.open();q('[data-type=text]').click();q('.db-next').click();const input=q('input[type=file]');Object.defineProperty(input,'files',{value:[{name:'p.csv',arrayBuffer:async()=>bytes('sku\n001').buffer}]});input.dispatchEvent(new w.Event('change'));await tick();q('.db-next').click();q('.db-finish').click();await tick();assert.match(q('.db-error').textContent,/Disk write failed/);assert.deepEqual(Object.keys(w.editing.data_sources),[]);assert.equal(w.editing.database_connection,undefined);assert.equal(q('header').parentElement.open,true);dom.window.close();
});
test('late Access results cannot populate a reopened wizard',async()=>{const {w,q,dom}=ui();let complete;w.zebra={importAccess:()=>new Promise(resolve=>complete=resolve)};w.DatabaseSetupUI.open();q('[data-type=access]').click();q('.db-next').click();[...q('main').querySelectorAll('button')].find(b=>b.textContent.startsWith('Browse Access')).click();q('.db-cancel').click();w.DatabaseSetupUI.open();q('[data-type=text]').click();q('.db-next').click();complete({fileName:'old.accdb',filePath:'old.accdb',tables:[{name:'Old',columns:['old'],rows:[{old:'stale'}]}]});await tick();assert.equal(q('.db-source-results').textContent,'');assert.equal(q('.db-next').disabled,true);dom.window.close();});
test('native file selection loads main-process records and releases its handle',async()=>{const {w,q,dom}=ui();let disposed=0;w.zebra={database:{pick:async()=>({ok:true,sessionId:'picked',generation:1,data:{fileName:'records.csv',filePath:'C:/records.csv',tables:[{name:'Records',columns:['id'],rows:[{id:'001'}]}]}}),dispose:async()=>{disposed++;}}};w.DatabaseSetupUI.open();q('[data-type=text]').click();q('.db-next').click();q('.db-native-browse').click();await tick();assert.match(q('.db-source-results').textContent,/001/);assert.equal(disposed,1);assert.equal(q('.db-next').disabled,false);dom.window.close();});
test('late native picker results after Cancel are discarded and disposed',async()=>{const {w,q,dom}=ui();let resolve,disposed=0;w.zebra={database:{pick:()=>new Promise(r=>resolve=r),dispose:async()=>{disposed++;}}};w.DatabaseSetupUI.open();q('[data-type=text]').click();q('.db-next').click();q('.db-native-browse').click();q('.db-cancel').click();w.DatabaseSetupUI.open();resolve({ok:true,sessionId:'late',generation:1,data:{fileName:'records.csv',filePath:'C:/records.csv',tables:[{name:'Records',columns:['id'],rows:[{id:'stale'}]}]}});await tick();assert.equal(disposed,1);assert.equal(q('main').textContent.includes('stale'),false);dom.window.close();});
test('installed ODBC flow connects from a DSN, advances to fields and never saves a password',async()=>{const {w,q,dom}=ui();w.eval(fs.readFileSync(require.resolve('../gui/database-native-flow'),'utf8'));let request;w.zebra={database:{detect:async type=>({available:type==='odbc',dataSources:[{name:'Reports',type:'User'}]}),open:async value=>{request=value;return {ok:true,sessionId:value.sessionId,generation:value.generation,data:{tables:[{name:'Products',columns:['id'],rows:[{id:'001'}]}]}};},dispose:async()=>{}}};w.DatabaseSetupUI.open();await tick();assert.equal(q('[data-type=odbc]').disabled,false);q('[data-type=odbc]').click();q('.db-next').click();const dsn=q('[name=dsn]');dsn.value='Reports';dsn.dispatchEvent(new w.Event('change'));q('[name=password]').value='private';q('[name=password]').dispatchEvent(new w.Event('input'));q('.db-back').click();q('.db-next').click();assert.equal(q('[name=dsn]').value,'Reports');assert.equal(q('[name=password]').value,'private');q('.db-next').click();await tick();assert.equal(request.config.dsn,'Reports');assert.equal(request.config.password,'private');assert.match(q('main').textContent,/Choose fields/);q('.db-finish').click();await tick();assert.equal(w.editing.database_connection.type,'odbc');assert.equal(w.editing.database_connection.providerOptions.dsn,'Reports');assert.equal(JSON.stringify(w.editing).includes('private'),false);dom.window.close();});
test('failed Finish restores renamed object tokens, source keys and value entries atomically',async()=>{const {w,q,dom}=ui();w.editing={elements:[{type:'text',text:'{{old}}'}],data_sources:{old:{category:'Database Fields',type:'table',column:'sku',rows:[{sku:'previous'}],row:'auto'}},values:{old:'previous'},database_connection:{fields:{old:'sku'},rows:[{sku:'previous'}]}};const before=JSON.stringify(w.editing);w.persistEditor=async()=>{throw Error('Disk full');};w.DatabaseSetupUI.open();q('[data-type=text]').click();q('.db-next').click();const file=q('input[type=file]');Object.defineProperty(file,'files',{value:[{name:'new.csv',arrayBuffer:async()=>bytes('sku\n001').buffer}]});file.dispatchEvent(new w.Event('change'));await tick();q('.db-next').click();q('.db-finish').click();await tick();assert.equal(JSON.stringify(w.editing),before);assert.match(q('.db-error').textContent,/Disk full/);dom.window.close();});

