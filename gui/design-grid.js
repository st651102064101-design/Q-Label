(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DesignGrid=api;
})(typeof window==='undefined'?globalThis:window,function(){
  function step(value){const n=Number(value);return Number.isFinite(n)&&n>0?Math.max(.05,n):.5;}
  function snap(value,enabled,pitch){return enabled?Math.round(value/step(pitch))*step(pitch):Math.round(value*10)/10;}
  function snapCoordinate(value,pitch,origin){const n=Number(value),base=Number(origin)||0,size=step(pitch);return Number.isFinite(n)?base+Math.round((n-base)/size)*size:n;}
  function snapPoint(point,enabled,pitch,originX=0,originY=0){
    if(!enabled)return{x:point.x,y:point.y};
    return{x:snapCoordinate(point.x,pitch,originX),y:snapCoordinate(point.y,pitch,originY)};
  }
  function snapDelta(position,delta,enabled,pitch,origin=0){
    if(!enabled)return delta;
    const start=Number(position);return snapCoordinate(start+Number(delta),pitch,origin)-start;
  }
  function render({show,width,height,x=0,y=0,pitch=.5,id='editor-dot-grid',shape='rectangle',radius=0}){
    if(!show||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return '';
    const s=step(pitch),r=Math.min(.045,s*.09);
    let clip='',clipAttribute='';
    if(shape==='rounded'){
      const corner=Math.min(width/2,height/2,Math.max(0,Number(radius)||0));
      if(corner>0)clip=`<clipPath id="${id}-clip" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${corner}" ry="${corner}"/></clipPath>`;
    }else if(shape==='ellipse')clip=`<clipPath id="${id}-clip" clipPathUnits="userSpaceOnUse"><ellipse cx="${x+width/2}" cy="${y+height/2}" rx="${width/2}" ry="${height/2}"/></clipPath>`;
    else if(shape==='circle')clip=`<clipPath id="${id}-clip" clipPathUnits="userSpaceOnUse"><circle cx="${x+width/2}" cy="${y+height/2}" r="${Math.min(width,height)/2}"/></clipPath>`;
    if(clip)clipAttribute=` clip-path="url(#${id}-clip)"`;
    return `<defs>${clip}<pattern id="${id}" x="${x-s/2}" y="${y-s/2}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><circle cx="${s/2}" cy="${s/2}" r="${r}" fill="#64748b" opacity=".65"/></pattern></defs><rect data-design-grid="true" x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#${id})"${clipAttribute} pointer-events="none"/>`;
  }
  return {step,snap,snapPoint,snapDelta,render};
});
