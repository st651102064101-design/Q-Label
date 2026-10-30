'use strict';
const {XMLParser,XMLValidator}=require('fast-xml-parser');
const list=x=>x==null||x===''?[]:[].concat(x);
const value=x=>typeof x==='object'&&x!==null?String(x['#text']??''):String(x??'');
/** Native evaluated source inventory. Values are snapshots, not substitutes for
 * original definitions, transforms, conditions, forms or script event bindings. */
function readNativeFormatInventory(xml){
 if(typeof xml!=='string'||Buffer.byteLength(xml)>128*1024*1024)throw Error('Native format XML must be a bounded string');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Native format XML cannot declare DTD/entities');
 if(XMLValidator.validate(xml)!==true)throw Error('Invalid native format XML');
 const parsed=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@',parseTagValue:false,parseAttributeValue:false,trimValues:false}).parse(xml);
 const formats=[];
 function find(node){if(!node||typeof node!=='object')return;for(const [k,v]of Object.entries(node)){if(k==='Message')for(const m of list(v))if(['Error','Fatal'].includes(m['@Severity']))throw Error('Native error: '+value(m));if(k==='GetFormatProperties')formats.push(...list(v));else find(v);}}
 find(parsed);if(formats.length!==1)throw Error('Exactly one native format inventory required');
 const formatProperties=formats[0],objects=[],names=new Set(),objectListErrors=[];
 for(const [nativeType,raw]of Object.entries(formatProperties.ObjectList||{})){
  if(nativeType.startsWith('@')||nativeType==='#text')continue;
  if(nativeType==='Error'){objectListErrors.push(...list(raw).map(value));continue;}
  for(const item of list(raw)){
   const name=item['@ObjectName'];if(!name||names.has(name))throw Error('Duplicate object name or missing native object identity');names.add(name);
   const indices=new Map();
   const sources=list(item.DataSourceList?.DataSource).map((source,index)=>{
    const nativeIndex=Number(source['@Index']);
    if(!/^\d+$/.test(source['@Index']||'')||!Number.isSafeInteger(nativeIndex))throw Error('Native data source index is missing or invalid');
    const signature=JSON.stringify(source);
    if(indices.has(nativeIndex)&&(!source['@Name']||indices.get(nativeIndex)!==signature))throw Error('Native data source index conflicts with an earlier source');
    indices.set(nativeIndex,signature);
    return {index,nativeIndex,sharedName:source['@Name']||null,nativeKind:source['@Source']||null,nativeDataType:source['@Type']||null,value:value(source.Value),properties:source};
   });
   objects.push({name,nativeType,sources,properties:item,behaviorComplete:false});
  }
 }
 const namedSources=list(formatProperties.NamedDataSources?.DataSource).map(source=>({id:source['@ID']||null,name:source['@Name']||null,value:value(source.Value),properties:source}));
 return {nativeXml:xml,formatProperties,objects,namedSources,objectListErrors,behaviorComplete:false};
}
module.exports={readNativeFormatInventory};
