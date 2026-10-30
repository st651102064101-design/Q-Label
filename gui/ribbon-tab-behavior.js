(function(root){
  'use strict';
  function bind(button,activate,{hover=false,click=true}={}){
    if(!button||typeof activate!=='function')throw new TypeError('A ribbon tab button and activation handler are required');
    if(click)button.addEventListener('click',activate);
    if(hover)button.addEventListener('pointerenter',event=>{
      if(event.pointerType==='mouse'||event.pointerType==='pen')activate();
    });
  }
  const shouldHover=()=>false;
  const api={bind,shouldHover};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RibbonTabBehavior=api;
})(typeof globalThis!=='undefined'?globalThis:this);
