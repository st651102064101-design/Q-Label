'use strict';
const {XMLParser,XMLValidator}=require('fast-xml-parser');
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const list=value=>value==null?[]:Array.isArray(value)?value:[value];
const xmlName=value=>value.replace(/_x([0-9a-f]{4})_/gi,(_,code)=>String.fromCharCode(parseInt(code,16)));
const tableName=value=>typeof value==='string'&&value.startsWith('[')&&value.endsWith(']')?value.slice(1,-1).replace(/\]\]/g,']'):value;
function dataBuilderDocument(text){
  if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>16*1024*1024)throw Error('Library file exceeds 16 MB');
  if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('Library XML declarations with entities are unsupported');
  if(XMLValidator.validate(text)!==true)throw Error('Library XML is invalid');
  const root=new XMLParser({ignoreAttributes:false,parseTagValue:false,trimValues:false,processEntities:true}).parse(text).BtDataSet;
  if(!root||typeof root!=='object')throw Error('Library XML must contain a BtDataSet');
  const tables=list(root._BARTENDER_TableProperties).filter(item=>item&&['1','3'].includes(String(item.TableUsageType))).map(item=>tableName(item.TableName));
  return{root,tables};
}
function libraryFromDocument({root,tables},library){
  const selected=library|| (tables.length===1?tables[0]:'');if(!tables.includes(selected))throw Error('Library is unavailable in the Data Builder file: '+selected);
  const key=Object.keys(root).find(name=>!name.startsWith('_BARTENDER_')&&xmlName(name)===selected),phrases=Object.create(null);
  if(key==null)return{phrases};
  for(const row of list(root[key])){
    if(!row||typeof row!=='object'||typeof row.ID!=='string')throw Error('Library phrase row has no ID');if(own(phrases,row.ID))throw Error('Library contains a duplicate phrase ID: '+row.ID);
    const languages=Object.create(null);for(const [column,value]of Object.entries(row)){if(['ID','Category','Tags','Comments','#text'].includes(column)||column.startsWith('@_'))continue;if(typeof value==='string')Object.defineProperty(languages,xmlName(column),{value,enumerable:true});}
    Object.defineProperty(phrases,row.ID,{value:languages,enumerable:true});
  }
  return{phrases};
}
function parseDataBuilder(text,library){return libraryFromDocument(dataBuilderDocument(text),library);}
async function inspectLibraryFile(file){
  const fs=require('node:fs/promises'),path=require('node:path'),stat=await fs.stat(file);if(!stat.isFile())throw Error('Library source must be a file');if(stat.size>16*1024*1024)throw Error('Library file exceeds 16 MB');const bytes=await fs.readFile(file);if(bytes.length>16*1024*1024)throw Error('Library file exceeds 16 MB');const text=bytes.toString('utf8').replace(/^\ufeff/,''),libraries=[];
  if(text.trimStart().startsWith('<')){const document=dataBuilderDocument(text);for(const name of document.tables)libraries.push({name,...libraryFromDocument(document,name)});}
  else{const parsed=JSON.parse(text),phrases=parsed&&own(parsed,'phrases')?parsed.phrases:parsed;if(!phrases||typeof phrases!=='object'||Array.isArray(phrases))throw Error('Library file must contain phrase entries');libraries.push({name:path.basename(file,path.extname(file)),phrases});}
  return{libraries:libraries.map(library=>({name:library.name,phrases:Object.entries(library.phrases).map(([id,values])=>({id,languages:typeof values==='string'?[{name:'',value:values}]:values&&typeof values==='object'?Object.entries(values).filter(([,value])=>typeof value==='string').map(([name,value])=>({name,value})):[]}))}))};
}
module.exports={parseDataBuilder,inspectLibraryFile};
