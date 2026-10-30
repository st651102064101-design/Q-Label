'use strict';
const {XMLParser,XMLBuilder,XMLValidator}=require('fast-xml-parser');
const options={ignoreAttributes:false,attributeNamePrefix:'@',parseTagValue:false,parseAttributeValue:false,trimValues:false,suppressBooleanAttributes:false};
// Conversion-time read command. Native internal schema requires Trusted=true.
function buildNativeDataSourcesRequest(format){
 if(typeof format!=='string'||!format.trim())throw Error('Native format path required');
 return new XMLBuilder(options).build({XMLScript:{'@Version':'2.0','@Trusted':'true',Command:{GetDataSources:{'@Type':'All','@Query':'All',Format:format}}}});
}
function readNativeDataSources(xml){
 if(typeof xml!=='string'||Buffer.byteLength(xml)>128*1024*1024)throw Error('Native source XML must be a bounded string');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Native source XML cannot declare DTD/entities');
 if(XMLValidator.validate(xml)!==true)throw Error('Invalid native source XML');
 const roots=[],parser=new XMLParser(options),builder=new XMLBuilder(options);
 const parsed=parser.parse(xml);
 function visit(node){
  if(!node||typeof node!=='object')return;
  for(const [key,value]of Object.entries(node)){
   if(key==='Message')for(const m of [].concat(value))if(['Error','Fatal'].includes(m?.['@Severity']))throw Error('Native error in source export');
   if(key==='GetDataSources')roots.push(value);else visit(value);
  }
 }
 visit(parsed);if(roots.length!==1)throw Error('Exactly one GetDataSources response required');
 const orderedOptions={...options,preserveOrder:true},orderedRoots=[];
 function orderedVisit(nodes){for(const n of nodes)for(const [k,v]of Object.entries(n))if(k==='GetDataSources')orderedRoots.push(v);else if(Array.isArray(v))orderedVisit(v);}
 orderedVisit(new XMLParser(orderedOptions).parse(xml));
 const wrappers=new Map((orderedRoots[0]||[]).filter(n=>Object.hasOwn(n,'DataSource')).map(n=>[n[':@']?.['@ID'],n]));
 const orderedBuilder=new XMLBuilder(orderedOptions);
 const ids=new Set(),sources=[];
 for(const source of roots[0]?.DataSource==null?[]:[].concat(roots[0].DataSource)){
  const id=source['@ID'];if(!id||ids.has(id))throw Error('Missing or duplicate native source identity');ids.add(id);
  const kinds=Object.keys(source).filter(k=>!k.startsWith('@')&&k!=='#text');
  if(kinds.length!==1||!kinds[0].endsWith('DataSource'))throw Error('Exactly one native source definition required');
  const nativeKind=kinds[0],definition=source[nativeKind];
  if(!definition||typeof definition!=='object'||Array.isArray(definition)||definition['@ID']!==id)throw Error('Native source definition identity mismatch');
  const wrapper=wrappers.get(id);
  sources.push({id,name:source['@Name']||null,nativeKind,definition,xml:orderedBuilder.build([wrapper]),definitionXml:orderedBuilder.build(wrapper.DataSource.filter(n=>Object.hasOwn(n,nativeKind)))});
 }
 return {nativeXml:xml,sources,behaviorComplete:false};
}
// Probe inputs must come from the same disposable document. Never match cached
// values: identical fragments are common and do not establish ownership.
function linkNativeSourceOwners(original,definitions,probe,markers){
 const ids=new Map(definitions.sources.map(s=>[s.id,s])),names=new Map(),markerIds=new Map(),seenIds=new Set();
 for(const s of definitions.sources)if(s.name){if(names.has(s.name))throw Error('Duplicate shared source identity');names.set(s.name,s.id);}
 for(const m of markers){if(!m.marker||!ids.has(m.id)||markerIds.has(m.marker)||seenIds.has(m.id))throw Error('Invalid or duplicate native ownership marker');markerIds.set(m.marker,m.id);seenIds.add(m.id);}
 const probed=new Map(probe.objects.map(o=>[o.name,o]));
 if(probed.size!==probe.objects.length||probed.size!==original.objects.length)throw Error('Native probe object structure changed');
 const links=[],diagnostics=[];
 for(const object of original.objects){
  const p=probed.get(object.name);
  if(!p||p.nativeType!==object.nativeType||p.sources.length!==object.sources.length)throw Error('Native probe source structure changed');
  for(let i=0;i<object.sources.length;i++){
   const s=object.sources[i],changed=p.sources[i];
   if(s.nativeIndex!==changed.nativeIndex||s.nativeKind!==changed.nativeKind||s.sharedName!==changed.sharedName)throw Error('Native probe source structure changed');
   const sourceId=s.sharedName?names.get(s.sharedName):markerIds.get(changed.value);
   if(!sourceId||ids.get(sourceId).nativeKind!==s.nativeKind){diagnostics.push({code:'NATIVE_SOURCE_OWNER_UNRESOLVED',objectName:object.name,position:i,nativeIndex:s.nativeIndex});continue;}
   links.push({objectName:object.name,nativeType:object.nativeType,position:i,nativeIndex:s.nativeIndex,sourceId,evidence:s.sharedName?'native-shared-name':'native-controlled-marker'});
  }
 }
 return {links,diagnostics,behaviorComplete:false};
}
function assembleNativeObjectSources(object,definitions,links){
 const selected=links.filter(l=>l.objectName===object.name),byPosition=new Map(selected.map(l=>[l.position,l]));
 if(selected.length!==object.sources.length||byPosition.size!==selected.length)throw Error('Incomplete or duplicate native source ownership');
 const sources=new Map(definitions.sources.map(s=>[s.id,s])),sourceIds=[],parts=[];
 for(let i=0;i<object.sources.length;i++){
  const link=byPosition.get(i);if(!link)throw Error('Missing native source ownership');
  if(link.nativeIndex!==object.sources[i].nativeIndex)throw Error('Native source index mismatch');
  const source=sources.get(link.sourceId);if(!source?.definitionXml)throw Error('Missing original source definition');
  sourceIds.push(source.id);parts.push(source.definitionXml);
 }
 return {sourceIds,xml:'<DataSources>'+parts.join('')+'</DataSources>'};
}
module.exports={readNativeDataSources,buildNativeDataSourcesRequest,linkNativeSourceOwners,assembleNativeObjectSources};
