'use strict';
const {XMLParser,XMLValidator}=require('fast-xml-parser');
const namespace='http://tempuri.org/BtDataSet.xsd';
const reserved=new Set(['__proto__','prototype','constructor']);
const array=value=>value==null?[]:Array.isArray(value)?value:[value];
const decodeName=value=>String(value).replace(/_x([0-9a-f]{4})_/gi,(_match,hex)=>String.fromCharCode(parseInt(hex,16)));
function parseDataBuilder(text){
 text=String(text).replace(/^\uFEFF/,'');
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('Data Builder DTD and external entities are not supported.');
 if(!/^\s*</.test(text))throw Error('This Data Builder file is not XML. Legacy SQL Server .btdb files are not supported.');
 if(XMLValidator.validate(text)!==true)throw Error('Invalid Data Builder XML file.');
 const tree=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@',parseTagValue:false,parseAttributeValue:false}).parse(text);
 const rootName=Object.keys(tree).find(name=>name==='BtDataSet'||name.endsWith(':BtDataSet'));
 const root=tree[rootName],rootPrefix=rootName?.includes(':')?rootName.split(':')[0]+':':'';
 if(!root||root[rootPrefix?'@xmlns:'+rootPrefix.slice(0,-1):'@xmlns']!==namespace)throw Error('Unsupported Data Builder XML format.');
 const local=(object,name)=>object?.[rootPrefix+name]??object?.[name];
 const properties=array(local(root,'_BARTENDER_DatabaseProperties'));
 const version=properties.find(property=>local(property,'Name')==='SchemaVersion');
 if(!version||local(version,'Value')!=='11.2.R0')throw Error('Unsupported Data Builder schema version. This reader supports 11.2.R0 XML files.');
 const schemaName=Object.keys(root).find(name=>(name.endsWith(':schema')||name==='schema')&&root[name]?.['@targetNamespace']===namespace);
 const schema=root[schemaName],prefix=schemaName?.includes(':')?schemaName.split(':')[0]+':':'';
 const xs=(object,name)=>object?.[prefix+name];
 const definitions=array(xs(xs(xs(xs(schema,'element'),'complexType'),'choice'),'element'));
 const tables=[];
 for(const definition of definitions){
  const encoded=definition['@name'];if(!encoded||decodeName(encoded).startsWith('_BARTENDER_'))continue;
  const name=decodeName(encoded);if(reserved.has(name)||tables.some(table=>table.name===name))throw Error('Data Builder table names must be unique and valid.');
  const fields=array(xs(xs(definition,'complexType'),'sequence')?.[prefix+'element']);
  const columns=fields.map(field=>decodeName(field['@name']||''));
  if(!columns.length||columns.some(column=>!column||reserved.has(column))||new Set(columns).size!==columns.length)throw Error('Data Builder columns have empty, duplicate or reserved names.');
  const input=array(local(root,encoded));if(input.length>10000)throw Error('Import up to 10,000 records per Data Builder table.');
  const rows=input.map(row=>{
   const record={};
   for(let index=0;index<fields.length;index++){
    let value=local(row,fields[index]['@name']);
    if(value==null)value=fields[index]['@default']??'';
    if(value&&typeof value==='object'){
     if(Object.entries(value).some(([key,v])=>key.endsWith(':nil')&&v==='true'))value='';
     else if(Object.keys(value).every(key=>key.startsWith('@')||key==='#text'))value=value['#text']??'';
     else throw Error('Nested Data Builder field values are not supported.');
    }
    record[columns[index]]=String(value);
   }
   return record;
  });
  tables.push({name,columns,rows});if(tables.length>64)throw Error('Import up to 64 Data Builder tables.');
 }
 if(!tables.length)throw Error('No readable Data Builder tables found.');
 return tables;
}
module.exports={parseDataBuilder};
