(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./source-resolver'));else root.DataSourceEngine=factory(root.SourceResolver);})(typeof globalThis!=='undefined'?globalThis:this,function(SourceResolver){
  'use strict';
  function resolve(template,input={},context={}){
    const data={...(template.values||{}),...input},sources=template.data_sources||{},visiting=new Set(),done=new Set(),now=new Date(context.now||Date.now());
    const format=pattern=>String(pattern).replace(/YYYY|MM|DD|HH|mm|ss/g,t=>({YYYY:now.getFullYear(),MM:String(now.getMonth()+1).padStart(2,'0'),DD:String(now.getDate()).padStart(2,'0'),HH:String(now.getHours()).padStart(2,'0'),mm:String(now.getMinutes()).padStart(2,'0'),ss:String(now.getSeconds()).padStart(2,'0')}[t]));
    const fill=text=>String(text??'').replace(/\{\{\s*([\w.\-]+)\s*\}\}/g,(_,name)=>String(field(name)??''));
    function field(name){
      if(done.has(name))return data[name];if(visiting.has(name))throw Error('Circular data source: '+name);visiting.add(name);
      let source=sources[name],value=data[name]??'';
      if(!source&&/^object\.\d+$/.test(name))source={type:'object',index:Number(name.split('.')[1])};
      if(source){switch(source.type){
        case 'date':value=format(source.format||'YYYY-MM-DD');break;
        case 'time':value=format(source.format||'HH:mm:ss');break;
        case 'serial':value=String(Number(source.start??1)+Number(source.step??1)*Number(context.index||0)).padStart(Number(source.digits||0),'0');break;
        case 'table':{const rows=source.rows||[],row=source.row==='auto'?Number(context.legacyRecordIndex??context.recordIndex??context.index??0):Number(source.row||0);value=rows[row]?.[source.column]??'';if(rows.length&&row>=rows.length)throw Error('Data source '+name+': record '+(row+1)+' is outside the imported table.');break;}
        case 'object':value=fill(template.elements?.[Number(source.index)]?.text||'');break;
        case 'global':value=context.globals?.[source.key||name]??source.value??'';break;
        case 'job':value=({page:Number(context.index||0)+1,total:context.total||1,copies:context.copies||1,printer:context.printer||'',file:context.file||''})[source.key]??'';break;
        case 'entry':value=input[name]??template.values?.[name]??source.value??'';break;
        default:value=fill(source.value??'');
      }
      const transform=source.transform||'none';if(transform==='upper')value=String(value).toUpperCase();if(transform==='lower')value=String(value).toLowerCase();if(transform==='trim')value=String(value).trim();value=String(source.prefix||'')+value+String(source.suffix||'');}
      visiting.delete(name);done.add(name);data[name]=value;return value;
    }
    for(const name of Object.keys(sources))field(name);
    for(const element of template.elements||[]){for(const match of String(element.text||'').matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g))field(match[1]);for(const row of element.table_model?.values||[])for(const cell of row||[])for(const match of String(cell||'').matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g))field(match[1]);}
    if(template.dataSourceSchemaVersion===1){
      if(!SourceResolver)throw Error('Object data source evaluator is unavailable');
      const evaluated=SourceResolver.evaluateDocument(template,{...context,inputs:{...data,...input}});
      for(const [name,value] of Object.entries(evaluated.namedValues||{}))Object.defineProperty(data,name,{value,enumerable:true,writable:true,configurable:true});
      data['$qlabel.sources']=evaluated;
      if(context.mode==='print'&&evaluated.diagnostics.some(d=>d.severity==='error'))throw Error(evaluated.diagnostics.map(d=>d.message).join('\n'));
    }
    return data;
  }
  function usesDatabaseRecords(template){
    const fields=template.database_connection?.fields||{},sources=template.data_sources||{},seen=new Set();
    if(template.dataSourceSchemaVersion===1){const definitions=template.sourceDefinitions||{},visited=new Set();const uses=id=>{if(visited.has(id))return false;visited.add(id);const source=definitions[id];for(const transform of source?.transforms||[]){if(transform.enabled===false||transform.kind!=='offset')continue;if(transform.offsetSource==='database')return true;if(transform.offsetSource==='named'){const named=Object.values(definitions).find(item=>item.name===transform.source);if(named&&uses(named.id))return true;}}if(source?.kind==='database')return true;if(source?.kind==='file'){if(source.config?.pathMode==='database')return true;if(source.config?.pathMode==='named'){const named=Object.values(definitions).find(item=>item.name===source.config.pathSource);return named?uses(named.id):false;}for(const match of String(source.config?.path||'').matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g)){const named=Object.values(definitions).find(item=>item.name===match[1]);if(named&&uses(named.id))return true;}}if(source?.kind==='legacy'&&source.config?.source?.type==='table'&&source.config.source.row==='auto')return true;if(source?.kind==='named')return uses(source.config?.definitionId);if(source?.kind==='object')return(template.elements||[]).find(e=>e.id===source.config?.objectId)?.dataSourceRefs?.some(uses)||false;return false;};if((template.elements||[]).some(e=>e.enabled!==false&&e.dataSourceRefs?.some(uses)))return true;}
    const scan=text=>[...String(text??'').matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g)].some(match=>field(match[1]));
    function field(name){
      if(seen.has(name))return false;seen.add(name);
      const source=sources[name];
      if(Object.hasOwn(fields,name)&&(!source||source.type==='table'&&source.row==='auto'))return true;
      if(source?.type==='object'||/^object\.\d+$/.test(name))return scan(template.elements?.[source?.index??Number(name.split('.')[1])]?.text);
      return source&&['constant','expression'].includes(source.type)?scan(source.value):false;
    }
    return (template.elements||[]).some(element=>element.enabled!==false&&(scan(element.text)||(element.table_model?.values||[]).some(row=>(row||[]).some(scan))));
  }
  return {resolve,usesDatabaseRecords};
});
