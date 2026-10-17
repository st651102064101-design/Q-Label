'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),zlib=require('node:zlib');
const Model=require('../gui/source-model'),Resolver=require('../gui/source-resolver'),Types=require('../gui/source-types'),{executeScript}=require('./source-vbscript');
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
async function collectInputs(document,context={}, {signal,fileCache=new Map(),serialValues={},serialPositions={}}={}){
  const preparedSources=Object.create(null),preparedTransforms=Object.create(null),sourceErrors=Object.create(null),sourceBitmaps=Object.create(null),sourceMatrices=Object.create(null),gs1Objects=Object.create(null),serializationStarts=Object.create(null),definitions=document.sourceDefinitions||{},names=new Map(Object.values(definitions).filter(s=>s.name).map(s=>[s.name,s.id])),objects=new Map(Model.elements(document).map(e=>[e.id,e])),done=new Set(),loading=new Set();
  const result=()=>({preparedSources,preparedTransforms,sourceErrors,sourceBitmaps,sourceMatrices,gs1Objects,serializationStarts});
  function check(){if(signal?.aborted)throw Error('Source preparation was cancelled');}
  function evaluate(id,before){
    const definition=definitions[id],template=before==null?document:{...document,sourceDefinitions:{...definitions,[id]:{...definition,transforms:(definition.transforms||[]).slice(0,before)}}};
    const evaluated=Resolver.evaluateDocument(template,{...context,...result(),requestedSourceIds:[id]});
    if(evaluated.diagnostics.length)throw Error(evaluated.diagnostics.map(d=>d.message).join('\n'));return evaluated.definitions[id];
  }
  async function named(name){if(names.has(name)){const id=names.get(name);await load(id);return evaluate(id).text;}if(own(context.inputs||{},name))return context.inputs[name];if(own(document.values||{},name))return document.values[name];throw Error('Missing named input: '+name);}
  async function fill(value){let text=String(value??'');for(const match of [...text.matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g)])text=text.replace(match[0],String(await named(match[1])));return text;}
  async function load(id){
    check();if(done.has(id))return;if(loading.has(id))throw Error('Circular source adapter dependency: '+[...loading,id].join(' → '));
    const definition=definitions[id];if(!definition)throw Error('Missing source: '+id);loading.add(id);
    const config=definition.config||{};
    try{
      if(definition.kind==='named')await load(config.definitionId);
      if(definition.kind==='object'){const target=objects.get(config.objectId);if(!target)throw Error('Missing object: '+config.objectId);for(const dependency of target.dataSourceRefs||[])await load(dependency);prepareGs1(target);}
      if(definition.kind==='legacy')for(const match of String(config.source?.value??'').matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g))await named(match[1]);
      if(definition.kind==='file'){
        let file;
        if(config.pathMode==='named')file=String(await named(config.pathSource));
        else if(config.pathMode==='database'){
          const connection=document.database_connection,field=config.pathSource,column=connection?.fields?.[field]??field,row=connection?.rows?.[Number(context.recordIndex??context.index??0)];
          if(own(context.inputs||{},field))file=String(context.inputs[field]??'');else if(row&&own(row,column))file=String(row[column]??'');else throw Error('Database filename field is unavailable: '+field);
        }else if(!config.pathMode||config.pathMode==='literal')file=await fill(config.path);
        else throw Error('Unknown external filename mode: '+config.pathMode);
        if(!file)throw Error('Choose an external file');if(config.defaultPath&&!path.isAbsolute(file)&&path.dirname(file)==='.')file=path.join(await fill(config.defaultPath),file);
        const absolute=path.resolve(file);let buffer=fileCache.get(absolute);
        if(!buffer){const stat=await fs.stat(absolute);if(!stat.isFile())throw Error('External source must be a file');if(stat.size>16*1024*1024)throw Error('External file exceeds 16 MB');buffer=await fs.readFile(absolute,{signal});fileCache.set(absolute,buffer);}
        if(definition.dataType?.kind==='picture'){let nativeImage;try{nativeImage=require('electron').nativeImage;}catch(_){}preparedSources[id]=require('./source-picture').convertPicture(buffer,definition.dataType,nativeImage);}
        else if(config.encoding==='binary'||definition.dataType?.kind==='binary')preparedSources[id]=Array.from(buffer);
        else preparedSources[id]=new TextDecoder(config.encoding||'utf-8',{fatal:true}).decode(buffer);
      }
      if(definition.kind==='vbscript'){
        const bindings={};for(const reference of Model.scriptNamedReferences(String(config.code||'')))Object.defineProperty(bindings,reference.name,{value:await named(reference.name),enumerable:true,configurable:true});
        preparedSources[id]=(await executeScript({code:config.code,event:config.event,bindings,fields:context.inputs,documentName:document.name},{signal,timeoutMs:config.timeoutMs||3000})).value;
      }
      if(definition.kind==='pct'){
        if(own(context.pctFields||{},config.field))preparedSources[id]=context.pctFields[config.field];
        else if(context.exportTemplate)preparedSources[id]=config.placeholder||'{{'+config.field+'}}';
        else if(context.mode!=='print')preparedSources[id]=config.sampleData??'';
        else throw Error('Printer code template field has no runtime value: '+config.field);
      }
      if(definition.kind==='library'&&config.libraryFile){
        const file=path.resolve(config.libraryFile);let bytes=fileCache.get(file);
        if(!bytes){const stat=await fs.stat(file);if(!stat.isFile())throw Error('Library source must be a file');if(stat.size>16*1024*1024)throw Error('Library file exceeds 16 MB');bytes=await fs.readFile(file,{signal});if(bytes.length>16*1024*1024)throw Error('Library file exceeds 16 MB');fileCache.set(file,bytes);}
        const text=bytes.toString('utf8').replace(/^\ufeff/,''),library=text.trimStart().startsWith('<')?require('./source-library').parseDataBuilder(text,config.library):JSON.parse(text);if(!library||typeof library!=='object')throw Error('Library file must contain a phrase object');
        const phrases=own(library,'phrases')?library.phrases:library,phrase=phrases&&typeof phrases==='object'&&own(phrases,config.phrase)?phrases[config.phrase]:undefined;
        const value=typeof phrase==='string'?phrase:phrase&&typeof phrase==='object'&&own(phrase,config.language)?phrase[config.language]:undefined;
        if(value==null||typeof value==='object'||typeof value==='function')throw Error('Phrase/language is unavailable in the library');preparedSources[id]=value;
      }
      const transforms=definition.transforms||[];
      for(const transform of transforms)if(transform.enabled!==false&&transform.kind==='offset'&&transform.offsetSource==='named')await named(transform.source);
      for(let index=0;index<transforms.length;index++){
        const transform=transforms[index];if(transform.enabled===false||!['compression','vbscript','serialization'].includes(transform.kind))continue;
        const value=evaluate(id,index);let output;
        if(transform.kind==='compression'){
          if(!value.bytes)throw Error('Compression requires Binary or Picture data');
          const bytes=Array.from(transform.method==='gzip'?zlib.gzipSync(Buffer.from(value.bytes)):zlib.deflateRawSync(Buffer.from(value.bytes)));
          output=Types.parseAndFormat(bytes,{kind:'binary'});
        }
        if(transform.kind==='vbscript'){
          const bindings={};for(const reference of Model.scriptNamedReferences(String(transform.code||'')))Object.defineProperty(bindings,reference.name,{value:await named(reference.name),enumerable:true,configurable:true});
          const script=await executeScript({code:transform.code,value:value.text,bindings,fields:context.inputs,documentName:document.name},{signal,timeoutMs:transform.timeoutMs||3000});output=Types.parseAndFormat(script.value,definition.dataType||{kind:'text'},context);
        }
        if(transform.kind==='serialization'){
          const Counter=require('../gui/source-counter'),base=serialValues[id]??transform.start??value.value??1,offset=transform.scope==='job'?0:transform.scope==='record'?Number(context.recordIndex||0):Number(context.index||0),interval=Number(transform.interval||1);
          serializationStarts[id]=transform.start??value.value??1;
          if(!Number.isInteger(interval)||interval<1)throw Error('Serialization interval must be a positive integer');
          const serialized=Counter.advance(base,Counter.integer(transform.step??1)*BigInt(Math.floor((Number(serialPositions[id]||0)+offset)/interval)),transform);
          output=Types.parseAndFormat(serialized,definition.dataType||{kind:'text'},context);
        }
        preparedTransforms[id]||=Object.create(null);preparedTransforms[id][transform.id||transform.kind]=output;
      }
      done.add(id);
    }catch(error){sourceErrors[id]=error.message;preparedSources[id]={error:error.message};done.add(id);}
    finally{loading.delete(id);}
  }
  function prepareGs1(element){if(!element.gs1||gs1Objects[element.id])return;
    const entries=(element.dataSourceRefs||[]).map(id=>({ai:definitions[id].gs1AI,value:evaluate(id).text}));
    gs1Objects[element.id]=require('./source-gs1').compileGs1(entries,element.gs1.symbology||'gs1-128');
  }
  for(const element of document.elements||[])if(element.enabled!==false)for(const id of element.dataSourceRefs||[])await load(id);
  for(const element of document.elements||[])if(element.enabled!==false&&element.gs1)try{prepareGs1(element);}catch(error){for(const id of element.dataSourceRefs||[])sourceErrors[id]=error.message;}
  const evaluated=Resolver.evaluateDocument(document,{...context,...result()});
  for(const element of document.elements||[])if(element.enabled!==false&&element.dataSourceRefs&&['qrcode','datamatrix'].includes(element.type)){
    const value=evaluated.objects[element.id];if(!value)continue;
    try{sourceMatrices[element.id]=require('./source-matrix').encodeMatrix(element.type,value);}catch(error){for(const id of element.dataSourceRefs)sourceErrors[id]=error.message;}
  }
  for(const element of document.elements||[])if(element.enabled!==false&&element.barcode_spec&&element.dataSourceRefs){
    const value=evaluated.objects[element.id]?.encodingText??evaluated.objects[element.id]?.text;if(value===undefined)continue;
    try{const hri=evaluated.objects[element.id]?.hriText,bytes=element.gs1?undefined:evaluated.objects[element.id]?.bytes,encoded=await require('./barcode-catalog').encode({...element.barcode_spec,text:value,bytes,hri_text:hri,show_text:!element.font_family&&element.barcode_spec.show_text!==false});
      sourceBitmaps[element.id]={bitmap_width:encoded.bitmap_width,bitmap_height:encoded.bitmap_height,bitmap_hex:encoded.bitmap_hex,barcode_display_text:hri??value};
      if(element.font_family&&element.barcode_spec.show_text!==false){const bars=await require('./barcode-catalog').encode({...element.barcode_spec,text:value,bytes,show_text:false});sourceBitmaps[element.id].barcode_bars={bitmap_width:bars.bitmap_width,bitmap_height:bars.bitmap_height,bitmap_hex:bars.bitmap_hex};}
    }catch(error){for(const id of element.dataSourceRefs)sourceErrors[id]=error.message;}
  }
  check();return result();
}
module.exports={collectInputs};
