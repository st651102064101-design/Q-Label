(function(root){
  'use strict';
  function create(measure,limit=4096){
    const widths=new Map(),segments=new Map(),segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
    const store=(map,key,value)=>{if(map.size>=limit)map.clear();map.set(key,value);return value;};
    return {
      width(font,text){text=String(text);const key=font+'\0'+text;return widths.has(key)?widths.get(key):store(widths,key,measure(font,text));},
      graphemes(text){text=String(text);return segments.has(text)?segments.get(text):store(segments,text,segmenter?[...segmenter.segment(text)].map(part=>part.segment):Array.from(text));},
      clear(){widths.clear();segments.clear();}
    };
  }
  let ctx;
  const context=()=>ctx||(ctx=document.createElement('canvas').getContext('2d'));
  const api=create((font,text)=>{const c=context();if(c.font!==font)c.font=font;return c.measureText(text).width;});api.context=context;api.create=create;
  if(typeof document!=='undefined')document.fonts?.addEventListener('loadingdone',()=>api.clear());
  if(typeof module!=='undefined')module.exports={create};root.TextMeasure=api;
})(typeof window!=='undefined'?window:globalThis);
