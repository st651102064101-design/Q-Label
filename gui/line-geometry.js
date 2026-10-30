(function(root){
  'use strict';
  const number=value=>Number.isFinite(Number(value))?Number(value):0;
  function endpoints(element,box){
    const x=box?box.x:number(element.x_mm),y=box?box.y:number(element.y_mm),w=number(element.width_mm),h=number(element.height_mm),thickness=Math.max(.1,number(element.thickness_mm)||.3);
    const center=box?.rotationCenter||{x:x+(box?box.w:w)/2,y:y+(box?box.h:Math.max(h,thickness))/2},r=number(element.rotation_deg)*Math.PI/180;
    return [{x,y},{x:x+w,y:y+h}].map(point=>{const dx=point.x-center.x,dy=point.y-center.y;return{x:center.x+dx*Math.cos(r)-dy*Math.sin(r),y:center.y+dx*Math.sin(r)+dy*Math.cos(r)};});
  }
  function fromEndpoints(a,b,thickness=.3){
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),half=Math.max(.1,number(thickness)||.3)/2;
    return {x_mm:(a.x+b.x)/2-length/2-Math.sin(angle)*half,y_mm:(a.y+b.y)/2-half+Math.cos(angle)*half,width_mm:length,height_mm:0,rotation_deg:angle*180/Math.PI};
  }
  function dragEndpoint(points,index,pointer,{snap=false,angleStep=45,minLength=.1}={}){
    const result=points.map(point=>({...point})),fixed=result[1-index];let dx=pointer.x-fixed.x,dy=pointer.y-fixed.y,length=Math.hypot(dx,dy);
    if(snap&&length){const step=angleStep*Math.PI/180,angle=Math.round(Math.atan2(dy,dx)/step)*step;dx=Math.cos(angle)*length;dy=Math.sin(angle)*length;}
    if(length<minLength){const old=result[index],angle=Math.atan2(old.y-fixed.y,old.x-fixed.x);dx=Math.cos(angle)*minLength;dy=Math.sin(angle)*minLength;}
    result[index]={x:fixed.x+dx,y:fixed.y+dy};return result;
  }
  const translate=(points,dx,dy)=>points.map(point=>({x:point.x+dx,y:point.y+dy}));
  function rotate(points,degrees){const center={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},r=degrees*Math.PI/180;return points.map(point=>{const dx=point.x-center.x,dy=point.y-center.y;return{x:center.x+dx*Math.cos(r)-dy*Math.sin(r),y:center.y+dx*Math.sin(r)+dy*Math.cos(r)};});}
  const api={endpoints,fromEndpoints,dragEndpoint,translate,rotate};if(typeof module!=='undefined')module.exports=api;root.LineGeometry=api;
})(typeof window!=='undefined'?window:globalThis);
