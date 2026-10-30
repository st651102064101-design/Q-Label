(function(root){
  'use strict';
  function resizeMatrix(original,target,angle=0,pivot={x:original.x+original.w/2,y:original.y+original.h/2}){
    const sx=Math.max(.001,target.w/original.w),sy=Math.max(.001,target.h/original.h),r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
    const x=target.x+(pivot.x-original.x)*sx,y=target.y+(pivot.y-original.y)*sy;
    const a=c*c*sx+s*s*sy,b=s*c*(sx-sy),d=s*s*sx+c*c*sy,e=x-a*pivot.x-b*pivot.y,f=y-b*pivot.x-d*pivot.y;
    return {a,b,c:b,d,e,f,rotationCenter:{x,y},transform:`matrix(${a} ${b} ${b} ${d} ${e} ${f})`};
  }
  function hriPosition({width,alignment='center',offset=0,dx=0,dy=0,gap=.6,maxOffset=Infinity}){
    const anchor=alignment==='left'?0:alignment==='right'?1:.5;
    const position=anchor+dx/Math.max(.001,Number(width)||.001);
    return {alignment:position<.25?'left':position>.75?'right':'center',offset:Math.max(-gap,Math.min(maxOffset,offset+dy))};
  }
  const api={resizeMatrix,hriPosition};if(typeof module!=='undefined')module.exports=api;root.GestureGeometry=api;
})(typeof window!=='undefined'?window:globalThis);
