(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./data-source-engine'));else{const api=factory(root.DataSourceEngine);root.SourcePreview=api.create({collectInputs:async(template,context)=>{const result=await root.zebra.prepareSourceInputs({template,context});if(!result.ok)throw Error(result.error);return result.inputs;},onReady:()=>{root.document.dispatchEvent(new root.Event('source-inputs-ready'));}});}})(typeof globalThis!=='undefined'?globalThis:this,function(Engine){
  'use strict';
  const needsPrepared=template=>(template.elements||[]).some(e=>e.gs1||e.dataSourceRefs&&(e.source_picture||e.barcode_spec||['qrcode','datamatrix'].includes(e.type)))||Object.values(template.sourceDefinitions||{}).some(s=>['file','vbscript','pct'].includes(s.kind)||s.kind==='library'&&s.config?.libraryFile||(s.transforms||[]).some(t=>t.enabled!==false&&['compression','vbscript','serialization'].includes(t.kind)));
  function create({collectInputs,onReady=()=>{}}){
    const cache=new Map();let epoch=0;
    function resolve(template,input={},context={}){
      if(template.dataSourceSchemaVersion!==1||!needsPrepared(template))return Engine.resolve(template,input,context);
      const list=template.database_connections||[template.database_connection].filter(Boolean),database=list.map(connection=>({id:connection.id,fields:connection.fields,row:connection.rows?.[Number(context.recordIndex||0)]}));
      const key=JSON.stringify([template.sourceDefinitions,template.sourceLibraries,database,(template.elements||[]).map(e=>[e.id,e.type,e.dataSourceRefs,e.text,e.source_picture,e.barcode_spec,e.gs1,e.font_family,e.data_prefix,e.data_suffix,e.data_transform,e.enabled]),input,context]);
      let entry=cache.get(key);
      if(!entry){
        entry={now:context.now??Date.now(),inputs:null};cache.set(key,entry);const generation=epoch;
        const snapshot=structuredClone(template);
        entry.promise=Promise.resolve().then(()=>collectInputs(snapshot,{...context,mode:'preview',now:entry.now,inputs:input})).then(inputs=>{
          if(generation!==epoch)return;entry.inputs=inputs;onReady(snapshot);
        },error=>{
          if(generation!==epoch)return;entry.inputs={sourceErrors:Object.fromEntries(Object.keys(template.sourceDefinitions||{}).map(id=>[id,error.message]))};onReady(snapshot);
        });
        if(cache.size>8)cache.delete(cache.keys().next().value);
      }
      return Engine.resolve(template,input,{...context,mode:'preview',now:entry.now,...entry.inputs});
    }
    return {resolve,invalidate(){epoch++;cache.clear();}};
  }
  return {create,needsPrepared};
});
