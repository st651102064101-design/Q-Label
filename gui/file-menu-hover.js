(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FileMenuHover=api;
})(globalThis,function(){
  'use strict';
  function bind(button,open,clearPendingClose){
    button.addEventListener('click',open);
    return()=>button.removeEventListener('click',open);
  }
  return {bind};
});
