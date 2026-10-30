(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LabelActionIcons=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const icons={
    'font-size-up':'<path d="M4 19 9 5h2l5 14M6.5 14h7M19 10V4m-3 3 3-3 3 3"/>',
    'font-size-down':'<path d="M4 19 9 5h2l5 14M6.5 14h7M19 4v6m-3-3 3 3 3-3"/>',
    print:'<path d="M7 8V3h10v5M6 17H4a2 2 0 0 1-2-2v-4a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v4a2 2 0 0 1-2 2h-2M6 14h12v7H6zM18 11h.01"/>'
  };
  function render(name){const path=icons[name];if(!path)throw new RangeError('Unknown label action icon: '+name);return '<svg data-icon="'+name+'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';}
  return {render};
});
