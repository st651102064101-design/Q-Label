(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./source-types'));else root.SourceTransforms=factory(root.SourceTypes);})(typeof globalThis!=='undefined'?globalThis:this,function(Types){
  'use strict';
  const kinds=['suppression','filter','compression','offset','range','truncation','length','character-template','search-replace','vbscript','serialization','prefix-suffix'];
  const regexLiteral=text=>String(text).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function wildcardPattern(search,deletion){
    if(!search)throw Error('Wildcard search text cannot be empty');
    if(search==='^')return null;
    let pattern='',stars=false;
    for(let index=0;index<search.length;index++){
      const char=search[index];
      if(char==='\\'){
        stars=false;const escaped=search[++index];if(escaped==null)throw Error('Incomplete wildcard escape');
        if(escaped==='x'){const hex=search.slice(index+1,index+3);if(!/^[0-9a-f]{2}$/i.test(hex))throw Error('Invalid wildcard hexadecimal escape');pattern+=regexLiteral(String.fromCharCode(parseInt(hex,16)));index+=2;}
        else pattern+=regexLiteral(escaped);
      }else if(char==='*'){
        if(index===search.length-1)throw Error('A wildcard search cannot end with an unescaped *');
        pattern+=stars?'\\*':'[^\\r\\n]*';stars=true;
      }else{
        stars=false;
        if(char==='?')pattern+='[^\\r\\n]';
        else if(char==='^'&&index===0)pattern+='^';
        else if(char==='$')pattern+=deletion?'(?:\\r\\n|\\r|\\n|(?![\\s\\S]))':'(?=\\r|(?<!\\r)\\n|(?![\\s\\S]))';
        else pattern+=regexLiteral(char);
      }
    }
    return pattern;
  }
  function searchReplace(text,action){
    const operation=action.operation||'replace',syntax=action.syntax||(action.regex?'regex':'literal'),search=String(action.search??'');
    if(!['replace','delete','insert-before','insert-after'].includes(operation))throw Error('Unknown search operation: '+operation);
    if(!['literal','regex','wildcard'].includes(syntax))throw Error('Unknown search syntax: '+syntax);
    let pattern;if(syntax==='wildcard'){pattern=wildcardPattern(search,operation==='delete');if(pattern==null)return text;}
    else if(syntax==='regex')pattern=search;
    else{if(!search)throw Error('Search text cannot be empty');pattern=regexLiteral(search);}
    const flags=(action.all===false?'':'g')+(action.caseSensitive===false?'i':'')+(syntax==='wildcard'?'m':'')+'u',regex=new RegExp(pattern,flags);
    if(operation==='delete')return text.replace(regex,()=> '');
    const insert=String(action.insert??action.replace??'');
    if(operation==='insert-before')return text.replace(regex,match=>insert+match);
    if(operation==='insert-after')return text.replace(regex,match=>match+insert);
    const replacement=String(action.replace??'');return syntax==='regex'?text.replace(regex,replacement):text.replace(regex,()=>replacement);
  }
  function characterTemplate(value,pattern){
    const input=Array.from(String(value)),format=Array.from(String(pattern));let pos=0,out='';
    for(let i=0;i<format.length;i++){
      let token=format[i],suppress=false;if(token==='~'){suppress=true;token=format[++i];}
      let piece='';
      if(token==='?')piece=input[pos++]||'';
      else if(token==='%'||token==='*'){piece=input.slice(pos).join('');pos=input.length;}
      else if(token==='@'){
        const delimiter=format[++i],end=input.indexOf(delimiter,pos),stop=end<0?input.length:end;
        piece=input.slice(pos,stop).join('');pos=stop;
        if(suppress&&format[i+1]==='~'&&format[i+2]==='?'){pos++;i+=2;}
        else if(!suppress&&format[i+1]==='?'){piece+=input[pos++]||'';i++;}
      }else if(token==='\\'){
        const escaped=format[++i];
        if(escaped==='n')piece='\r';else if(escaped==='t')piece='\t';
        else if(escaped==='x'||escaped==='u'){
          const length=escaped==='x'?2:4,hex=format.slice(i+1,i+1+length).join('');if(hex.length!==length||!/^[0-9a-f]+$/i.test(hex))throw Error('Invalid character-template escape');piece=String.fromCharCode(parseInt(hex,16));i+=length;
        }else if(escaped!=null)piece=escaped;else throw Error('Incomplete character-template escape');
      }else piece=token||'';
      if(!suppress)out+=piece;
    }
    return out;
  }
  function applyTransforms(input,configs=[],context={}){
    let result={...input};
    for(const config of configs){if(config.enabled===false)continue;let text=result.text;
      switch(config.kind){
        case 'prefix-suffix':text=String(config.prefix||'')+text+String(config.suffix||'');break;
        case 'suppression':{
          let suppress=config.when==='always'||config.when==='empty'&&!text||config.when==='previous-empty'&&context.previousText!==undefined&&!context.previousText||config.when==='next-empty'&&context.nextText!==undefined&&!context.nextText;
          if(config.when==='equals'){
            let compared=text;
            if(config.source){if(context.getNamedValue)compared=context.getNamedValue(config.source);else if(Object.prototype.hasOwnProperty.call(context.namedValues||{},config.source))compared=context.namedValues[config.source];else throw Error('Suppression source is unavailable: '+config.source);}
            suppress=String(compared)===String(config.value??'');
          }
          if(suppress)return {...result,value:'',text:'',...(result.hriText!=null?{hriText:''}:{}),...(result.bytes?{bytes:[]}:{}),suppressed:true};break;
        }
        case 'filter':{
          let valid;if(config.mode==='digits')valid=char=>/^[0-9]$/.test(char);else if(config.mode==='letters')valid=char=>/^\p{L}$/u.test(char);else if(config.mode==='alphanumeric')valid=char=>/^[\p{L}\p{N}]$/u.test(char);else if(config.mode==='custom'){const allowed=new Set(Array.from(config.characters||''));valid=char=>allowed.has(char);}else throw Error('Unknown character filter');
          const chars=Array.from(text),filtered=chars.filter(valid);if(filtered.length!==chars.length&&config.removeInvalid===false)throw Error('Data contains invalid characters');text=filtered.join('');
          if(config.case==='upper')text=text.toUpperCase();if(config.case==='lower')text=text.toLowerCase();break;
        }
        case 'truncation':{
          if(config.trim)text=text.trim();if(config.trimStart)text=text.trimStart();if(config.trimEnd)text=text.trimEnd();
          const chars=Array.from(text),start=Number(config.start||0),length=config.length==null?chars.length:Number(config.length);
          if(!Number.isInteger(start)||start<0||!Number.isInteger(length)||length<0)throw Error('Truncation requires nonnegative character counts');text=chars.slice(start,start+length).join('');break;
        }
        case 'length':{
          let chars=Array.from(text);const minimum=Number(config.minimum||0),maximum=config.maximum==null?Infinity:Number(config.maximum);
          if(!Number.isInteger(minimum)||minimum<0||maximum<minimum)throw Error('Invalid character count range');
          if(chars.length<minimum){if(config.pad&&Array.from(config.pad).length===1){const padding=config.pad.repeat(minimum-chars.length);text=config.padSide==='right'?text+padding:padding+text;}else throw Error('Data is below the minimum number of characters');}
          chars=Array.from(text);if(chars.length>maximum){if(config.truncate)text=chars.slice(0,maximum).join('');else throw Error('Data exceeds the maximum number of characters');}break;
        }
        case 'search-replace':{
          for(const action of config.actions||[])text=searchReplace(text,action);break;
        }
        case 'character-template':{
          const formatted=characterTemplate(text,config.pattern||'');if(context.barcode){result.hriText=formatted;continue;}text=formatted;break;
        }
        case 'offset':{
          const mode=config.offsetSource||'constant';if(mode!=='constant'&&!context.getOffsetValue)throw Error('Offset source is unavailable: '+mode);
          const amount=Types.numeric(mode==='constant'?config.amount??0:context.getOffsetValue(mode,config.source),{});
          if(result.kind==='date'||result.kind==='time'){
            const date=new Date(result.value),unit=config.unit||'days';
            const factors={milliseconds:1,seconds:1000,minutes:60000,hours:3600000,days:86400000,weeks:604800000};
            if(unit==='months')date.setUTCMonth(date.getUTCMonth()+amount);else if(unit==='years')date.setUTCFullYear(date.getUTCFullYear()+amount);else if(factors[unit])date.setTime(date.getTime()+amount*factors[unit]);else throw Error('Unknown time offset unit');
            result=Types.parseAndFormat(date,{kind:result.kind,...context.typeConfig},context);continue;
          }
          const value=Types.numeric(result.value,{})+amount;result=Types.parseAndFormat(value,{kind:result.kind==='text'?'number':result.kind,...context.typeConfig},context);continue;
        }
        case 'range':{
          const date=result.kind==='date'||result.kind==='time',number=date?new Date(result.value).getTime():Types.numeric(result.value,{});
          const bound=value=>date?new Date(Types.parseAndFormat(value,{kind:result.kind},context).value).getTime():Types.numeric(value,{});
          const minimum=config.minimum==null?-Infinity:bound(config.minimum),maximum=config.maximum==null?Infinity:bound(config.maximum);
          if(minimum>maximum)throw Error('The minimum range bound exceeds the maximum');
          if(number<minimum||number>maximum)throw Error('Data is outside the allowed range');break;
        }
        case 'serialization':case 'compression':case 'vbscript':{
          const resolved=context.transformInputs?.[config.id||config.kind];if(resolved===undefined)throw Error('Transform requires prepared input: '+config.kind);result={...resolved};continue;
        }
        default:throw Error('Unknown transform: '+config.kind);
      }
      if(result.bytes&&text!==result.text){
        const bytes=Array.from(text,char=>char.codePointAt(0));if(bytes.some(byte=>byte>255))throw Error('Binary transform produced a character outside the byte range');
        result={...result,text,value:bytes,bytes};
      }else result={...result,text,value:text};
    }
    return result;
  }
  return {kinds,applyTransforms,characterTemplate};
});
