(function(root){
  'use strict';
  function reorder(elements,selected,action){
    const chosen=new Set(selected.filter(i=>Number.isInteger(i)&&i>=0&&i<elements.length)),order=elements.map((_,i)=>i);
    if(action==='front')order.sort((a,b)=>Number(chosen.has(a))-Number(chosen.has(b)));
    else if(action==='back')order.sort((a,b)=>Number(chosen.has(b))-Number(chosen.has(a)));
    else if(action==='forward'){for(let i=order.length-2;i>=0;i--)if(chosen.has(order[i])&&!chosen.has(order[i+1]))[order[i],order[i+1]]=[order[i+1],order[i]];}
    else if(action==='backward'){for(let i=1;i<order.length;i++)if(chosen.has(order[i])&&!chosen.has(order[i-1]))[order[i],order[i-1]]=[order[i-1],order[i]];}
    return {elements:order.map(i=>elements[i]),selection:order.flatMap((i,at)=>chosen.has(i)?[at]:[]),changed:order.some((i,at)=>i!==at)};
  }
  function move(elements,from,to){const result=elements.slice();if(from<0||from>=result.length||to<0||to>=result.length)return result;const [item]=result.splice(from,1);result.splice(to,0,item);return result;}
  const api={reorder,move};if(typeof module!=='undefined')module.exports=api;root.LayerOrder=api;
})(typeof window!=='undefined'?window:globalThis);
