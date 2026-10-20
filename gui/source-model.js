(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SourceModel=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clone=value=>structuredClone(value);
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const defaultId=()=>globalThis.crypto.randomUUID();
  // Active elements are authoritative; stored active-page/side copies are caches.
  function containers(document){
    const result=[],add=page=>{
      result.push(page);
      for(const [side,design] of Object.entries(page.designs||{}))if(side!==(page.design_active||'front'))result.push(design);
    };
    add(document);
    for(const [index,page] of (document.template_pages||[]).entries())if(index!==Number(document.template_page_active||0))add(page.design||{});
    for(const page of document.pages||[])add(page);
    return result;
  }
  function elements(document){return containers(document).flatMap(page=>page.elements||[]);}
  function syncCaches(document){
    function sync(page){const active=page.design_active||'front';if(page.designs?.[active])page.designs[active].elements=clone(page.elements||[]);}
    sync(document);
    for(const page of document.template_pages||[])sync(page.design||{});
    const active=document.template_pages?.[Number(document.template_page_active||0)];
    if(active){active.design||={};for(const key of ['elements','designs','design_active','design_side'])if(document[key]!==undefined)active.design[key]=clone(document[key]);}
    return document;
  }
  function validate(document){
    const definitions=document.sourceDefinitions||{},names=new Set(),objects=new Set();
    for(const [id,source] of Object.entries(definitions)){
      if(source.id!==id)throw Error('Source definition ID does not match registry key: '+id);
      if(source.name){if(names.has(source.name))throw Error('Duplicate source name: '+source.name);names.add(source.name);}
    }
    for(const element of elements(document)){
      if(!element.id||objects.has(element.id))throw Error('Missing or duplicate object ID: '+element.id);objects.add(element.id);
      if(element.dataSourceRefs!==undefined&&!Array.isArray(element.dataSourceRefs))throw Error('Invalid source list: '+element.id);
      for(const id of element.dataSourceRefs||[])if(!own(definitions,id))throw Error('Missing source '+id+' in object '+element.id);
    }
    return document;
  }
  function migrate(input,{newId=defaultId}={}){
    const document=clone(input);
    if(document.dataSourceSchemaVersion===1)return validate(document);
    if(document.dataSourceSchemaVersion!=null)throw Error('Unsupported data source schema: '+document.dataSourceSchemaVersion);
    document.sourceDefinitions||={};const definitions=document.sourceDefinitions,named=new Map(),used=new Set(Object.keys(definitions));
    document.sourceDocumentId||=newId();
    for(const element of elements(document))if(element.id)used.add(element.id);
    function allocate(){for(let n=0;n<1000;n++){const id=newId();if(typeof id==='string'&&id&&!used.has(id)){used.add(id);return id;}}throw Error('Could not allocate a unique ID');}
    function register(source){const id=allocate();Object.defineProperty(definitions,id,{value:{id,...source},enumerable:true,writable:true,configurable:true});return id;}
    for(const [name,source] of Object.entries(document.data_sources||{})){
      // Preserve legacy resolver semantics, including token expansion and transforms.
      named.set(name,register({name,description:source.description||'',kind:'legacy',config:{legacyName:name,source:clone(source)}}));
    }
    const embedded=value=>register({name:'',description:'',kind:'embedded',config:{value},dataType:{kind:'text'},transforms:[]});
    for(const page of document.pages||[])page.id||=allocate();
    for(const page of document.template_pages||[])page.id||=allocate();
    for(const element of elements(document)){
      element.id||=allocate();
      if(element.dataSourceRefs)continue;
      const text=element.barcode_spec?.text??element.text;
      if(text===undefined)continue;
      const value=String(text),refs=[];let offset=0;
      for(const match of value.matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g)){
        if(match.index>offset)refs.push(embedded(value.slice(offset,match.index)));
        if(!named.has(match[1]))named.set(match[1],register({name:match[1],kind:'input',config:{key:match[1]}}));
        refs.push(named.get(match[1]));offset=match.index+match[0].length;
      }
      if(offset<value.length||!refs.length)refs.push(embedded(value.slice(offset)));
      element.dataSourceRefs=refs;
      element.sourceTextSnapshot=value;
    }
    document.dataSourceSchemaVersion=1;
    return validate(syncCaches(document));
  }
  function object(document,id){const found=elements(document).find(item=>item.id===id);if(!found)throw Error('Missing object: '+id);return found;}
  function checkedIndex(index,length,insert=false){if(!Number.isInteger(index)||index<0||index>length-(insert?0:1))throw Error('Source index is out of range');}
  function addSource(input,objectId,definition,index){
    const document=clone(input),element=object(document,objectId);element.dataSourceRefs||=[];
    checkedIndex(index,element.dataSourceRefs.length,true);
    if(!definition?.id)throw Error('Source ID is required');
    if(own(document.sourceDefinitions,definition.id)&&JSON.stringify(document.sourceDefinitions[definition.id])!==JSON.stringify(definition))throw Error('Source ID conflicts with an existing definition');
    Object.defineProperty(document.sourceDefinitions,definition.id,{value:clone(definition),enumerable:true,writable:true,configurable:true});
    element.dataSourceRefs.splice(index,0,definition.id);return validate(syncCaches(document));
  }
  function scriptNamedReferences(code){
    const tokens=[];for(const match of code.matchAll(/'[^\r\n]*|"(?:[^"]|"")*"|\bRem\b[^\r\n]*|[A-Za-z_]\w*|[^\s]/gi)){if(match[0][0]==="'"||/^Rem\b/i.test(match[0]))continue;tokens.push({text:match[0],index:match.index});}
    const references=[];for(let i=0;i<tokens.length-3;i++)if(/^(?:NamedSubString|NamedSubStrings|GetNamedSubStringValue|SetNamedSubStringValue)$/i.test(tokens[i].text)&&tokens[i+1].text==='('){const literal=tokens[i+2];if(literal.text[0]==='"'&&[',',')'].includes(tokens[i+3].text))references.push({...literal,name:literal.text.slice(1,-1).replace(/""/g,'"')});}return references;
  }
  function renameScriptLiteral(code,previous,name){
    const replacements=scriptNamedReferences(code).filter(reference=>reference.name===previous);
    if(replacements.length&&!name)throw Error('Source name is used by dependent scripts');let result=code;for(const literal of replacements.reverse())result=result.slice(0,literal.index)+'"'+name.replace(/"/g,'""')+'"'+result.slice(literal.index+literal.text.length);return result;
  }
  function renameSource(input,definitionId,name){
    const document=clone(input),definitions=document.sourceDefinitions||{};if(!own(definitions,definitionId))throw Error('Missing source: '+definitionId);if(typeof name!=='string')throw Error('Source name must be a string');
    const source=definitions[definitionId],previous=source.name||'',dependencies=[];
    if(previous&&previous!==name)for(const candidate of Object.values(definitions)){
      const config=candidate.config||{};if(candidate.kind==='file'&&config.pathMode==='named'&&config.pathSource===previous)dependencies.push([config,'pathSource',candidate.id]);
      if(candidate.kind==='file'&&typeof config.path==='string')config.path=config.path.replace(/\{\{(\s*)([\w.\-]+)(\s*)\}\}/g,(token,left,key,right)=>{if(key!==previous)return token;if(!name)throw Error('Source name is used by dependent file tokens');if(!/^[\w.\-]+$/.test(name))throw Error('Dependent file tokens require a name containing letters, digits, underscore, dot or hyphen');return '{{'+left+name+right+'}}';});
      if(candidate.kind==='vbscript'&&typeof config.code==='string')config.code=renameScriptLiteral(config.code,previous,name);
      for(const transform of candidate.transforms||[])if(transform.kind==='vbscript'&&typeof transform.code==='string')transform.code=renameScriptLiteral(transform.code,previous,name);
      for(const transform of candidate.transforms||[])if((transform.kind==='offset'&&transform.offsetSource==='named'||transform.kind==='suppression')&&transform.source===previous)dependencies.push([transform,'source',candidate.id]);
    }
    if(!name&&dependencies.length)throw Error('Source name is used by dependent sources: '+[...new Set(dependencies.map(item=>item[2]))].join(', '));
    source.name=name;for(const [config,key]of dependencies)config[key]=name;return validate(syncCaches(document));
  }
  function moveSource(input,objectId,from,to){const document=clone(input),refs=object(document,objectId).dataSourceRefs||[];checkedIndex(from,refs.length);checkedIndex(to,refs.length);refs.splice(to,0,refs.splice(from,1)[0]);return validate(syncCaches(document));}
  function removeSource(input,objectId,index){const document=clone(input),refs=object(document,objectId).dataSourceRefs||[];checkedIndex(index,refs.length);refs.splice(index,1);return validate(syncCaches(document));}
  function copySource(input,definitionId,{linked=false,newId=defaultId}={}){
    const document=clone(input);if(!own(document.sourceDefinitions||{},definitionId))throw Error('Missing source: '+definitionId);
    if(linked)return {document,definitionId};
    const id=newId();if(!id||own(document.sourceDefinitions,id))throw Error('Duplicate source ID: '+id);
    const source={...clone(document.sourceDefinitions[definitionId]),id,name:''};
    Object.defineProperty(document.sourceDefinitions,id,{value:source,enumerable:true,writable:true,configurable:true});
    return {document:validate(document),definitionId:id};
  }
  function cloneObjectSources(document,copies,{newId=defaultId,sourceDocument=document}={}){
    const ids=new Map(),definitions=document.sourceDefinitions||{},originals=sourceDocument.sourceDefinitions||{},cloned=new Map(),crossDocument=sourceDocument.sourceDocumentId!==document.sourceDocumentId;
    const names=new Set(Object.values(definitions).map(source=>source.name).filter(Boolean));
    for(const element of copies)if(element.id){const id=newId();ids.set(element.id,id);element.id=id;}
    function copyDefinition(id){
      const source=originals[id];if(!source)throw Error('Missing source to copy: '+id);if(source.name&&!crossDocument&&own(definitions,id))return id;
      if(cloned.has(id))return cloned.get(id);const copy=clone(source),next=newId();if(own(definitions,next))throw Error('Duplicate source ID');copy.id=next;
      if(copy.name){const base=copy.name;let suffix=1;while(names.has(copy.name))copy.name=base+' ('+suffix+++')';names.add(copy.name);}
      Object.defineProperty(definitions,next,{value:copy,enumerable:true,writable:true,configurable:true});cloned.set(id,next);
      if(copy.kind==='object'&&ids.has(copy.config?.objectId))copy.config.objectId=ids.get(copy.config.objectId);
      if(copy.kind==='named')copy.config.definitionId=copyDefinition(copy.config.definitionId);
      return next;
    }
    for(const element of copies)if(element.dataSourceRefs)element.dataSourceRefs=element.dataSourceRefs.map(copyDefinition);
    return copies;
  }
  function reconcileInPlace(document,{newId=defaultId}={}){
    if(document.dataSourceSchemaVersion!==1)return document;
    const definitions=document.sourceDefinitions,removed=new Set(),removedNames=new Set();
    for(const source of Object.values(definitions))if(source.kind==='legacy'&&source.config?.legacyName&&!own(document.data_sources||{},source.config.legacyName)){removed.add(source.id);removedNames.add(source.config.legacyName);}
    let expanded=true;while(expanded){expanded=false;for(const source of Object.values(definitions))if(source.kind==='named'&&removed.has(source.config?.definitionId)&&!removed.has(source.id)){removed.add(source.id);if(source.name)removedNames.add(source.name);expanded=true;}}
    if(removed.size){
      for(const element of elements(document)){
        if(Array.isArray(element.dataSourceRefs))element.dataSourceRefs=element.dataSourceRefs.filter(id=>!removed.has(id));
        const replace=value=>String(value).replace(/\{\{\s*([\w.\-]+)\s*\}\}/g,(token,name)=>removedNames.has(name)?'':token);
        if(typeof element.text==='string')element.text=replace(element.text);
        if(typeof element.barcode_spec?.text==='string')element.barcode_spec.text=replace(element.barcode_spec.text);
        if(typeof element.sourceTextSnapshot==='string')element.sourceTextSnapshot=replace(element.sourceTextSnapshot);
      }
      for(const id of removed)delete definitions[id];
      for(const name of removedNames)if(document.values)delete document.values[name];
    }
    const named=new Map(Object.values(definitions).filter(s=>s.name).map(s=>[s.name,s.id])),seen=new Set();
    for(const source of Object.values(definitions)){const name=source.kind==='legacy'&&source.config?.legacyName;if(name&&document.data_sources?.[name])source.config.source=document.data_sources[name];}
    function register(source){const id=newId();if(own(definitions,id))throw Error('Duplicate source ID');Object.defineProperty(definitions,id,{value:{...source,id},enumerable:true,writable:true,configurable:true});return id;}
    for(const element of elements(document)){
      if(!element.id)element.id=newId();else if(seen.has(element.id))cloneObjectSources(document,[element],{newId});seen.add(element.id);
      const raw=element.barcode_spec?.text??element.text;if(raw===undefined)continue;const text=String(raw);
      if(element.dataSourceRefs&&element.sourceTextSnapshot===text)continue;
      const refs=[];let offset=0;
      const embedded=value=>register({kind:'embedded',config:{value},dataType:{kind:'text'},transforms:[]});
      for(const match of text.matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g)){
        if(match.index>offset)refs.push(embedded(text.slice(offset,match.index)));
        if(!named.has(match[1])){const name=match[1],legacy=document.data_sources?.[name];named.set(name,register(legacy?{name,kind:'legacy',config:{legacyName:name,source:clone(legacy)}}:{name,kind:'input',config:{key:name}}));}
        refs.push(named.get(match[1]));offset=match.index+match[0].length;
      }
      if(offset<text.length||!refs.length)refs.push(embedded(text.slice(offset)));element.dataSourceRefs=refs;element.sourceTextSnapshot=text;
    }
    return removed.size?syncCaches(document):document;
  }
  return {migrate,validate,elements,containers,syncCaches,addSource,renameSource,scriptNamedReferences,moveSource,removeSource,copySource,reconcileInPlace,cloneObjectSources};
});
