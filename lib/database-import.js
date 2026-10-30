'use strict';
const ExcelJS=require('exceljs/dist/exceljs.min.js');
const XLSX=require('xlsx');
const {XMLParser,XMLValidator}=require('fast-xml-parser');
const {getDatabaseTypes}=require('./database/catalog');
const fileTypes=new Set(['text','xml','excel','json','builder','import']);
const types=getDatabaseTypes().map(type=>({...type,supported:fileTypes.has(type.id)}));
const reserved=new Set(['__proto__','constructor','prototype']);
function fieldName(value){return String(value).normalize('NFKC').replace(/[^A-Za-z0-9_.-]/g,'_').replace(/^[^A-Za-z]+/,'field_');}
function flatten(value,prefix='',out={}){
  for(const [key,item] of Object.entries(value)){
    if(reserved.has(key))throw Error('Reserved field name: '+key);
    const name=prefix?prefix+'.'+key:key;
    if(item&&typeof item==='object'&&!Array.isArray(item))flatten(item,name,out);
    else out[name]=item==null?'':Array.isArray(item)?JSON.stringify(item):String(item);
  }
  return out;
}
function records(rows){
  if(!Array.isArray(rows)||!rows.length)throw Error('No records found.');
  if(rows.length>10000)throw Error('Import up to 10,000 records.');
  if(rows.some(row=>!row||typeof row!=='object'||Array.isArray(row)))throw Error('Each record must be an object with named fields.');
  const result=rows.map(row=>flatten(row));
  const columns=[...new Set(result.flatMap(row=>Object.keys(row)))];
  if(!columns.length||columns.some(name=>!name.trim()))throw Error('Fields need non-empty names.');
  return {rows:result,columns};
}
function parseText(text,{delimiter='auto',headers=true}={}){
  text=String(text).replace(/^\uFEFF/,'');
  if(delimiter==='auto'){
    const first=text.split(/\r?\n/,1)[0];
    const count=sep=>{let n=0,quoted=false;for(let i=0;i<first.length;i++){if(first[i]==='"'){if(quoted&&first[i+1]==='"')i++;else quoted=!quoted;}else if(!quoted&&first[i]===sep)n++;}return n;};
    delimiter=[',',';','\t','|'].sort((a,b)=>count(b)-count(a))[0];
  }
  if(![',',';','\t','|'].includes(delimiter))throw Error('Choose a supported delimiter.');
  const table=[];let row=[],cell='',quoted=false,closed=false;
  const push=()=>{row.push(cell);if(row.some(v=>v.trim()))table.push(row);row=[];cell='';closed=false;};
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
    else if(c==='"'){if(cell||closed)throw Error('Unexpected quote in text file.');quoted=true;}
    else if(c===delimiter){row.push(cell);cell='';closed=false;}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;push();}
    else{if(closed&&!/\s/.test(c))throw Error('Unexpected text after closing quote.');if(!closed)cell+=c;}
  }
  if(quoted)throw Error('Unclosed quote in text file.');
  if(cell||row.length)push();
  if(!table.length)throw Error('No records found.');
  const names=headers?table.shift().map(s=>s.trim()):table[0].map((_,i)=>'Field_'+(i+1));
  if(names.some(s=>!s||reserved.has(s))||new Set(names).size!==names.length)throw Error('Column names must be unique, non-empty and not reserved.');
  return records(table.map((cells,i)=>{if(cells.length>names.length)throw Error('Record '+(i+1)+' contains more values than columns.');return Object.fromEntries(names.map((name,j)=>[name,cells[j]??'']));}));
}
function parseFixedWidth(text,{widths,headers=true}){if(!Array.isArray(widths)||!widths.length||widths.some(n=>!Number.isInteger(n)||n<1))throw Error('Enter positive fixed field widths.');const lines=String(text).replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim()),cells=lines.map(line=>{let pos=0;return widths.map(w=>{const value=line.slice(pos,pos+w).trim();pos+=w;return value;});});if(!cells.length)throw Error('No records found.');const names=headers?cells.shift():widths.map((_,i)=>'Field_'+(i+1));if(names.some(n=>!n||reserved.has(n))||new Set(names).size!==names.length)throw Error('Invalid or duplicate field names.');return records(cells.map(row=>Object.fromEntries(names.map((name,i)=>[name,row[i]]))));}
function decode(bytes,encoding='utf-8'){return new TextDecoder(encoding,{fatal:true}).decode(bytes);}
function expandPackedTabColumn(lines){if(!Array.isArray(lines)||!lines.length||lines.some(row=>row.length>1)||!lines.some(row=>String(row[0]??'').includes('\t')))return lines;return lines.map(row=>String(row[0]??'').split('\t'));}
function xmlTables(text){
  if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('XML DTD and external entities are not supported.');
  const valid=XMLValidator.validate(text);if(valid!==true)throw Error('Invalid XML: '+valid.err.msg);
  const tree=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@',parseTagValue:false,parseAttributeValue:false,ignoreDeclaration:true}).parse(text);
  const tables=[];
  function walk(node,path){
    if(Array.isArray(node)){if(node.every(v=>v&&typeof v==='object'))tables.push({name:path,...records(node)});for(const v of node)if(v&&typeof v==='object')for(const [k,value] of Object.entries(v))if(value&&typeof value==='object')walk(value,path+'.'+k);}
    else if(node&&typeof node==='object'){for(const [k,value]of Object.entries(node))if(value&&typeof value==='object')walk(value,path?path+'.'+k:k);}
  }
  walk(tree,'');
  if(!tables.length){const root=Object.entries(tree).find(([,v])=>v&&typeof v==='object');if(root)tables.push({name:root[0],...records([root[1]])});}
  if(!tables.length)throw Error('No record elements found in XML.');
  return tables;
}
async function importFile(type,bytes,options={}){
  const entry=types.find(t=>t.id===type);if(!entry?.supported)throw Error(entry?.description||'Unsupported database type.');
  if(bytes.byteLength>20*1024*1024)throw Error('Import a file smaller than 20 MB.');
  if(type==='excel'){
    // SheetJS supplies the legacy binary Excel reader; retain ExcelJS for .xlsx fidelity.
    if(bytes[0]===0xD0&&bytes[1]===0xCF){const book=XLSX.read(bytes,{type:'array'}),tables=[];for(const name of book.SheetNames){const sheet=book.Sheets[name];for(const cell of Object.values(sheet))if(cell?.f&&cell.v==null)throw Error('Excel formula has no saved result. Recalculate and save the workbook first.');const lines=expandPackedTabColumn(XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''}));if(lines.length<2)continue;const names=lines.shift().map(v=>String(v).trim());if(names.some(n=>!n||reserved.has(n))||new Set(names).size!==names.length)throw Error('Worksheet '+name+' has invalid or duplicate column names.');tables.push({name,...records(lines.map(values=>Object.fromEntries(names.map((n,i)=>[n,values[i]??'']))))});}if(!tables.length)throw Error('No worksheets with headers and records found.');return tables;}
    const book=new ExcelJS.Workbook();await book.xlsx.load(bytes);
    const cellText=cell=>{if(cell.value&&typeof cell.value==='object'&&('formula'in cell.value||'sharedFormula'in cell.value)){if(cell.value.result==null)throw Error('Excel formula has no saved result. Recalculate and save the workbook first.');return String(cell.value.result);}return cell.text;};
    const tables=[];
    book.eachSheet(sheet=>{if(!sheet.actualRowCount)return;let lines=[];sheet.eachRow(row=>lines.push(Array.from({length:sheet.columnCount},(_,i)=>cellText(row.getCell(i+1)))));lines=expandPackedTabColumn(lines);while(lines[0]?.at(-1)==='')lines[0].pop();const names=lines.shift().map(s=>s.trim());if(!names.length)return;if(names.some(s=>!s||reserved.has(s))||new Set(names).size!==names.length)throw Error('Worksheet '+sheet.name+' has invalid or duplicate column names.');if(lines.length)tables.push({name:sheet.name,...records(lines.map(cells=>Object.fromEntries(names.map((name,i)=>[name,cells[i]??'']))))});});
    if(!tables.length)throw Error('No worksheets with headers and records found.');return tables;
  }
  const text=decode(bytes,options.encoding);
  if(type==='import'){
    if(text.trimStart().startsWith('<'))throw Error('BarTender DatabaseSetup XML is not supported yet. Choose a Q LABEL connection snapshot (.json).');
    const value=JSON.parse(text);
    if(value?.format!=='ZebraBarConnection'||value.version!==1||!Array.isArray(value.connection?.tables)||!value.connection.tables.length)throw Error('Invalid or unsupported connection snapshot.');
    const names=new Set();
    return value.connection.tables.map(table=>{
      if(typeof table?.name!=='string'||!table.name.trim()||reserved.has(table.name)||names.has(table.name))throw Error('Connection tables need unique non-empty names.');
      names.add(table.name);
      if(!Array.isArray(table.columns)||!table.columns.length||table.columns.some(c=>typeof c!=='string'||!c.trim()||reserved.has(c))||new Set(table.columns).size!==table.columns.length)throw Error('Connection columns must be unique, non-empty and not reserved.');
      if(!Array.isArray(table.rows))throw Error('Connection rows must be an array.');
      const parsed=table.rows.length?records(table.rows):{columns:[],rows:[]};
      if(parsed.columns.some(c=>!table.columns.includes(c)))throw Error('Connection rows contain unknown columns.');
      return {name:table.name,columns:[...table.columns],rows:parsed.rows.map(row=>Object.fromEntries(table.columns.map(c=>[c,row[c]??''])))};
    });
  }
  if(type==='builder')return require('./database/databuilder').parseDataBuilder(text);
  if(type==='text')return [{name:'Records',...(options.widths?parseFixedWidth(text,options):parseText(text,options))}];
  if(type==='xml')return xmlTables(text);
  const value=JSON.parse(text);return [{name:'Records',...records(Array.isArray(value)?value:[value])}];
}
function createSources(table,columns,{prefix='',row='auto',fileName=''}={},existing={}){
  if(!columns.length)throw Error('Choose at least one field.');
  const sources={};
  for(const column of columns){
    if(!table.columns.includes(column))throw Error('Unknown column: '+column);
    const name=fieldName(prefix+column);if(!name||reserved.has(name)||Object.hasOwn(existing,name)||Object.hasOwn(sources,name))throw Error('Field name already exists or is invalid: '+name);
    sources[name]={category:'Database Fields',type:'table',rows:table.rows,column,row,fileName};
  }
  return sources;
}
function printTemplate(template,useRecords){
  if(!useRecords||!template.database_connection)return template;
  const fields=Object.assign({},...(template.database_connections||[]).map(c=>c.fields||{}),template.database_connection.fields||{});
  const sources={...template.data_sources};
  for(const name of Object.keys(fields))if(sources[name]?.type==='table'&&sources[name].row==='auto')sources[name]={...sources[name],type:'entry',value:sources[name].rows[0]?.[sources[name].column]??''};
  return {...template,data_sources:sources};
}
class Wizard{
  constructor(){this.step=0;this.type=null;this.tables=[];this.tableIndex=0;this.columns=[];this.fileName='';}
  select(type){if(!types.find(t=>t.id===type)?.supported)throw Error('This database connector is unavailable.');if(this.type!==type){this.tables=[];this.columns=[];}this.type=type;}
  load(tables,name){if(!tables.length)throw Error('No tables found.');this.tables=tables;this.fileName=name;this.chooseTable(0);}
  chooseTable(index){if(!this.tables[index])throw Error('Choose a valid table.');this.tableIndex=index;this.columns=[...this.tables[index].columns];}
  next(){if(this.step===0&&!this.type)throw Error('Select a database type.');if(this.step===1&&!this.tables.length)throw Error('Load a data file first.');if(this.step>=2)throw Error('Already on the last step.');this.step++;}
  back(){this.step=Math.max(0,this.step-1);}
  finish(options,existing){if(this.step!==2)throw Error('Complete the setup steps first.');return createSources(this.tables[this.tableIndex],this.columns,{...options,fileName:this.fileName},existing);}
}
module.exports={types,parseText,parseFixedWidth,records,xmlTables,importFile,createSources,printTemplate,Wizard,connections:require('./database/connections')};
