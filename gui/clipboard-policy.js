(function(root){
  'use strict';
  const doc=root.document;
  if(!doc)return;
  const userTextTarget=target=>target?.closest?.('input,textarea,[contenteditable="true"],[contenteditable=""]');
  for(const type of ['copy','cut'])doc.addEventListener(type,event=>{
    if(userTextTarget(event.target))return;
    event.preventDefault();
  },true);
})(typeof window==='undefined'?globalThis:window);
