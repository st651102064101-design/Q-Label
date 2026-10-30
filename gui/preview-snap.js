(function(root,factory){
  const api=factory(root.DesignGrid||(typeof require==='function'?require('./design-grid'):null));
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PreviewSnap=api;
})(typeof window==='undefined'?globalThis:window,function(DesignGrid){
  function coordinates(xMm,yMm,enabled,stepMm){
    const snap=value=>DesignGrid.snap(value,enabled,stepMm);
    return {xMm:snap(xMm),yMm:snap(yMm)};
  }
  return {coordinates};
});
