(function(root){
  'use strict';
  const keys=new Set(['bold','italic','underline','strike','font_family','font_size_pt','text_color','text_background','text_inverse']);
  function normalize(ranges,textLength){
    const points=new Map();
    for(const range of Array.isArray(ranges)?ranges:[]){
      const start=Math.max(0,Math.min(textLength,Math.trunc(Number(range.start)||0))),end=Math.max(start,Math.min(textLength,Math.trunc(Number(range.end)||0)));
      if(end<=start)continue;
      for(const key of keys)if(Object.prototype.hasOwnProperty.call(range,key)){const list=points.get(key)||[];list.push({start,end,value:range[key]});points.set(key,list);}
    }
    const boundaries=new Set([0,textLength]);for(const list of points.values())for(const item of list){boundaries.add(item.start);boundaries.add(item.end);}
    const sorted=[...boundaries].sort((a,b)=>a-b),result=[];
    for(let i=0;i<sorted.length-1;i++){const start=sorted[i],end=sorted[i+1],part={start,end};for(const [key,list]of points){const match=[...list].reverse().find(item=>item.start<=start&&item.end>=end);if(match)part[key]=match.value;}if(Object.keys(part).length>2){const prev=result.at(-1),partKeys=Object.keys(part),prevKeys=prev?Object.keys(prev):[];if(prev&&prev.end===start&&prevKeys.length===partKeys.length&&partKeys.every(key=>key==='start'||key==='end'||prev[key]===part[key]))prev.end=end;else result.push(part);}}
    return result;
  }
  function apply(ranges,textLength,start,end,key,value,toggle=false){
    if(!keys.has(key))return normalize(ranges,textLength);
    start=Math.max(0,Math.min(textLength,Math.trunc(Number(start)||0)));end=Math.max(start,Math.min(textLength,Math.trunc(Number(end)||0)));if(end<=start)return normalize(ranges,textLength);
    const current=normalize(ranges,textLength),covered=[];for(let i=start;i<end;i++){const range=current.find(item=>item.start<=i&&item.end>i);covered.push(range?.[key]);}
    const nextValue=toggle?!(covered.length&&covered.every(item=>!!item)):value,boundaries=new Set([start,end]);for(const range of current){boundaries.add(range.start);boundaries.add(range.end);}const sorted=[...boundaries].sort((a,b)=>a-b),result=[];
    for(let i=0;i<sorted.length-1;i++){const a=sorted[i],b=sorted[i+1];if(b<=a)continue;const existing=current.find(item=>item.start<=a&&item.end>=b),part={start:a,end:b};if(existing)for(const k of keys)if(Object.hasOwn(existing,k))part[k]=existing[k];if(a>=start&&b<=end){if(nextValue===undefined||nextValue===null||nextValue==='')delete part[key];else part[key]=nextValue;}if(Object.keys(part).length>2)result.push(part);}
    return normalize(result,textLength);
  }
  function clear(ranges,textLength,start,end){start=Math.max(0,Math.min(textLength,Math.trunc(Number(start)||0)));end=Math.max(start,Math.min(textLength,Math.trunc(Number(end)||0)));const current=normalize(ranges,textLength),boundaries=new Set([start,end]);for(const range of current){boundaries.add(range.start);boundaries.add(range.end);}const sorted=[...boundaries].sort((a,b)=>a-b),result=[];for(let i=0;i<sorted.length-1;i++){const a=sorted[i],b=sorted[i+1],existing=current.find(item=>item.start<=a&&item.end>=b);if(!existing)continue;const part={start:a,end:b};if(a<start||b>end)for(const key of keys)if(Object.hasOwn(existing,key))part[key]=existing[key];if(Object.keys(part).length>2)result.push(part);}return normalize(result,textLength);}
  function rebase(ranges,previous,next){previous=String(previous??'');next=String(next??'');let prefix=0;while(prefix<previous.length&&prefix<next.length&&previous[prefix]===next[prefix])prefix++;let suffix=0;while(suffix<previous.length-prefix&&suffix<next.length-prefix&&previous[previous.length-1-suffix]===next[next.length-1-suffix])suffix++;const oldEnd=previous.length-suffix,newEnd=next.length-suffix,delta=next.length-previous.length;if(!delta&&oldEnd===prefix)return normalize(ranges,next.length);const mapped=[];for(const range of normalize(ranges,previous.length)){let start=range.start,end=range.end;if(oldEnd===prefix){if(end<prefix){}else if(start>prefix){start+=delta;end+=delta;}else if(start<=prefix&&prefix<=end)end+=delta;}else{const map=(position,edge)=>position<=prefix?position:position>=oldEnd?position+delta:edge==='start'?prefix:newEnd;start=map(start,'start');end=map(end,'end');}if(end>start)mapped.push({...range,start,end});}return normalize(mapped,next.length);}
  const api={normalize,apply,clear,rebase,keys:[...keys]};if(typeof module!=='undefined')module.exports=api;root.TextRangeFormat=api;
})(typeof window!=='undefined'?window:globalThis);
