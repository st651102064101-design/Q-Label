(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./source-model'),require('./source-types'),require('./source-transforms'));else root.SourceResolver=factory(root.SourceModel,root.SourceTypes,root.SourceTransforms);})(typeof globalThis!=='undefined'?globalThis:this,function(Model,Types,Transforms){
  'use strict';
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  function evaluateDocument(document,context={}){
    const objects=Object.create(null),resolvedDefinitions=Object.create(null),diagnostics=[],definitions=document.sourceDefinitions||{},all=Model.elements(document),byId=new Map(all.map(e=>[e.id,e])),names=new Map(Object.values(definitions).filter(s=>s.name).map(s=>[s.name,s.id])),cache=new Map(),stack=[];
    const input={...(document.values||{}),...(context.inputs||{})},now=new Date(context.now??Date.now());
    function fail(code,message,details={}){throw Object.assign(new Error(message),{code,path:[...stack],...details});}
    function visit(key,fn){if(cache.has(key))return cache.get(key);if(stack.includes(key))fail('cycle','Circular data source: '+[...stack,key].join(' → '),{path:[...stack,key]});stack.push(key);try{const value=fn();cache.set(key,value);return value;}finally{stack.pop();}}
    function field(name){if(names.has(name))return source(names.get(name)).text;return own(input,name)?input[name]:'';}
    const fill=value=>String(value??'').replace(/\{\{\s*([\w.\-]+)\s*\}\}/g,(_,name)=>String(field(name)??''));
    function format(pattern){if(!Number.isFinite(now.getTime()))fail('invalid-clock','Invalid clock value');return String(pattern).replace(/YYYY|MM|DD|HH|mm|ss/g,t=>({YYYY:now.getFullYear(),MM:String(now.getMonth()+1).padStart(2,'0'),DD:String(now.getDate()).padStart(2,'0'),HH:String(now.getHours()).padStart(2,'0'),mm:String(now.getMinutes()).padStart(2,'0'),ss:String(now.getSeconds()).padStart(2,'0')}[t]));}
    function legacy(config,name){
      let value;
      switch(config.type){
        case 'constant':case 'expression':value=fill(config.value);break;
        case 'entry':value=input[name]??config.value??'';break;
        case 'date':value=format(config.format||'YYYY-MM-DD');break;
        case 'time':value=format(config.format||'HH:mm:ss');break;
        case 'serial':value=String(Number(config.start??1)+Number(config.step??1)*Number(context.index||0)).padStart(Number(config.digits||0),'0');break;
        case 'global':value=context.globals?.[config.key||name]??config.value??'';break;
        case 'object':{const target=document.elements?.[Number(config.index)];if(!target)fail('missing-object','Missing legacy object '+config.index);value=object(target.id).text;break;}
        case 'table':{const rows=config.rows||[],index=config.row==='auto'?Number(context.legacyRecordIndex??context.recordIndex??context.index??0):Number(config.row||0);if(rows.length&&(index<0||index>=rows.length))fail('record-bounds','Record is outside the imported table');value=rows[index]?.[config.column]??'';break;}
        case 'job':value=({page:Number(context.index||0)+1,total:context.total||1,copies:context.copies||1,printer:context.printer||'',file:context.file||''})[config.key]??'';break;
        default:fail('unsupported-source','Unsupported legacy source type: '+config.type);
      }
      return transformLegacy(value,config.transform,config.prefix,config.suffix);
    }
    function transformLegacy(value,mode,prefix,suffix){let text=String(value??'');if(mode==='upper')text=text.toUpperCase();if(mode==='lower')text=text.toLowerCase();if(mode==='trim')text=text.trim();return String(prefix||'')+text+String(suffix||'');}
    function source(id,sourceContext={}){return visit('source:'+id+':'+(sourceContext.objectId||''),()=>{
      if(!own(definitions,id))fail('missing-source','Missing source: '+id,{definitionId:id});
      const definition=definitions[id],config=definition.config||{};let value;
      try{
        if(context.sourceErrors?.[id])fail('adapter-error',context.sourceErrors[id]);
        switch(definition.kind){
          case 'embedded':value=config.value??'';break;
          case 'input':value=own(input,config.key)?input[config.key]:'';break;
          case 'legacy':value=legacy(config.source||{},definition.name);break;
          case 'named':value=source(config.definitionId).text;break;
          case 'object':{const target=object(config.objectId);if(config.value&& !['main','human-readable'].includes(config.value))fail('unsupported-object-value','Unsupported object value: '+config.value);value=config.value==='human-readable'?target.hriText??target.text:target.text;break;}
          case 'clock':{
            if(config.printerClock&&context.printerClock!=null)value=context.printerClock;
            else if(config.printerClock&&config.fallback==='omit')return {kind:'text',value:'',text:'',suppressed:true};
            else if(config.printerClock&&config.fallback!=='windows')fail('printer-clock-unavailable','Printer clock is unavailable');
            else value=now.toISOString();break;
          }
          case 'database':{
            if(own(input,config.field))value=input[config.field]??config.defaultValue??'';
            else if(document.database_connection){const connection=document.database_connection,column=connection.fields?.[config.field]??config.field,row=connection.rows?.[Number(context.recordIndex??context.index??0)];if(row&&own(row,column))value=row[column]??config.defaultValue??'';else if(context.mode!=='print'&&config.sampleData!=null)value=config.sampleData;else fail('missing-field','Database field is unavailable: '+config.field);}
            else if(context.mode!=='print'&&config.sampleData!=null)value=config.sampleData;
            else fail('missing-field','Database field is unavailable: '+config.field);break;
          }
          case 'global':if(own(context.globals||{},config.key))value=context.globals[config.key];else fail('missing-global','Global field is unavailable: '+config.key);break;
          case 'library':{
            if(config.libraryFile){if(!own(context.preparedSources||{},id))fail('unprepared-source','Phrase library requires prepared input');value=context.preparedSources[id];break;}
            const library=document.sourceLibraries?.[config.library]??context.libraries?.[config.library],phrase=library?.[config.phrase];value=typeof phrase==='string'?phrase:phrase?.[config.language];if(value==null)fail('missing-phrase','Library phrase/language is unavailable');break;
          }
          case 'job':{
            const values={page:Number(context.index||0)+1,total:context.total||1,copies:context.copies||1,printer:context.printer||'',file:context.file||'',jobId:context.jobId||'',document:document.name||'',application:'Q LABEL',version:context.applicationVersion||'',date:now.toISOString()};
            if(!own(values,config.key))fail('missing-job-field','Unknown print job field: '+config.key);value=values[config.key];break;
          }
          case 'table':{
            const rows=context.tableRows||config.rows||[],index=config.row==='auto'||config.row==null?Number(context.recordIndex??context.index??0):Number(config.row);
            if(!rows[index])fail('record-bounds','Table record is unavailable: '+index);if(!own(rows[index],config.column))fail('missing-field','Table column is unavailable: '+config.column);value=rows[index][config.column]??'';break;
          }
          case 'file':case 'vbscript':case 'pct':{
            if(!own(context.preparedSources||{},id))fail('unprepared-source','Source requires prepared input: '+definition.kind);
            const prepared=context.preparedSources[id];if(prepared?.error)fail('adapter-error',prepared.error);value=prepared;break;
          }
          default:fail('unsupported-source','Source type is not implemented: '+definition.kind);
        }
        const typed=Types.parseAndFormat(value,definition.dataType||{kind:'text'},context);
        const transforms=(definition.transforms||[]).map(transform=>sourceContext.deferSuppression&&transform.kind==='suppression'?{...transform,enabled:false}:transform);
        return Transforms.applyTransforms(typed,transforms,{...context,...sourceContext,getNamedValue:field,typeConfig:definition.dataType,transformInputs:context.preparedTransforms?.[id]});
      }catch(error){error.definitionId??=id;throw error;}
    });}
    function object(id){return visit('object:'+id,()=>{
      const element=byId.get(id);if(!element)fail('missing-object','Missing object: '+id,{objectId:id});
      let parts=[];
      if(Array.isArray(element.dataSourceRefs)){
        const unsuppressed=element.dataSourceRefs.map(id=>source(id,{objectId:element.id,barcode:element.type!=='text',deferSuppression:true}));
        parts=unsuppressed.map((part,index)=>Transforms.applyTransforms(part,(definitions[element.dataSourceRefs[index]].transforms||[]).filter(transform=>transform.kind==='suppression'),{...context,getNamedValue:field,previousText:unsuppressed[index-1]?.text,nextText:unsuppressed[index+1]?.text}));
      }
      const value=Array.isArray(element.dataSourceRefs)?parts.map(part=>part.text).join(''):fill(element.barcode_spec?.text??element.text);
      if(element.data_type==='number'&&value!==''&&!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value))fail('invalid-number','Object data must be numeric',{objectId:id});
      const text=transformLegacy(value,element.data_transform,element.data_prefix,element.data_suffix);
      const result={kind:'text',value:text,text,sourceText:value};
      if(parts.some(part=>part.bytes)){
        if(element.data_transform&&element.data_transform!=='none')fail('unsupported-binary-transform','Apply binary transforms to the individual data sources',{objectId:id});
        const utf8=value=>Array.from(new TextEncoder().encode(String(value||'')));
        result.bytes=[...utf8(element.data_prefix),...parts.flatMap(part=>part.bytes??utf8(part.text)),...utf8(element.data_suffix)];result.kind='binary';result.value=result.bytes;
      }
      if(element.gs1){const gs1=context.gs1Objects?.[element.id];if(!gs1)fail('unprepared-gs1','GS1 data requires prepared input');if(element.data_prefix||element.data_suffix||element.data_transform&&element.data_transform!=='none')fail('invalid-gs1-transform','Apply transforms to individual GS1 sources');Object.assign(result,{text:gs1.data,value:gs1.data,sourceText:gs1.data,hriText:gs1.hri,encodingText:gs1.encodedText,bytes:gs1.bytes});}
      if(context.sourceBitmaps?.[element.id])result.artwork=context.sourceBitmaps[element.id];
      if(context.sourceMatrices?.[element.id])result.matrix=context.sourceMatrices[element.id];
      if(!element.gs1&&parts.some(part=>part.hriText!=null))result.hriText=transformLegacy(parts.map(part=>part.hriText??part.text).join(''),element.data_transform,element.data_prefix,element.data_suffix);
      return result;
    });}
    if(context.requestedSourceIds)for(const id of context.requestedSourceIds){try{resolvedDefinitions[id]=source(id);}catch(error){diagnostics.push({code:error.code||'evaluation-error',message:error.message,definitionId:error.definitionId||id,path:error.path||[],severity:'error'});}}
    else for(const element of context.includeInactive?all:document.elements||[]){if(element.enabled===false||!element.dataSourceRefs&&element.text===undefined&&!element.barcode_spec)continue;try{objects[element.id]=object(element.id);}catch(error){diagnostics.push({code:error.code||'evaluation-error',message:error.message,definitionId:error.definitionId,objectId:element.id,path:error.path||[],severity:'error'});}}
    const namedValues=Object.create(null);
    if(!context.requestedSourceIds)for(const [name,id] of names){try{namedValues[name]=source(id).text;}catch(_){} }
    return {objects,definitions:resolvedDefinitions,namedValues,diagnostics};
  }
  return {evaluateDocument};
});
