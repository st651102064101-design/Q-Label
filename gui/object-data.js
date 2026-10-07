(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ObjectData=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function resolve(element,data={},strict=false){let text=String(element.text??'').replace(/\{\{\s*([\w.\-]+)\s*\}\}/g,(_,name)=>String(data[name]??''));if(element.data_transform==='upper')text=text.toUpperCase();if(element.data_transform==='lower')text=text.toLowerCase();if(element.data_transform==='trim')text=text.trim();if(strict&&element.data_type==='number'&&text!==''&&!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text))throw Error('Object data must be numeric.');return String(element.data_prefix||'')+text+String(element.data_suffix||'');}
  return {resolve};
});
