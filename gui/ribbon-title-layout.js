'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RibbonTitleLayout=api;
  if(root?.document)api.install(root.document,root);
})(typeof window==='undefined'?globalThis:window,function(){
  function availableWidth(titleLeft,searchLeft,gap=8){
    return Math.max(0,Math.floor(searchLeft-titleLeft-gap));
  }
  function update(document){
    const title=document.querySelector('.ribbon-document-title');
    const search=document.querySelector('.tool-search');
    if(!title||!search)return null;
    const width=availableWidth(title.getBoundingClientRect().left,search.getBoundingClientRect().left);
    title.style.maxWidth=`${width}px`;
    return width;
  }
  function install(document,view){
    const refresh=()=>update(document);
    view.addEventListener('resize',refresh,{passive:true});
    refresh();
    return ()=>view.removeEventListener('resize',refresh);
  }
  return {availableWidth,update,install};
});
