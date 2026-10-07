(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DataSourceEngine=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
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
        case 'table':{const rows=source.rows||[],row=source.row==='auto'?Number(context.recordIndex??context.index??0):Number(source.row||0);value=rows[row]?.[source.column]??'';if(rows.length&&row>=rows.length)throw Error('Data source '+name+': record '+(row+1)+' is outside the imported table.');break;}
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
    for(const element of template.elements||[])for(const match of String(element.text||'').matchAll(/\{\{\s*([\w.\-]+)\s*\}\}/g))field(match[1]);
    return data;
  }
  return {resolve};
});
