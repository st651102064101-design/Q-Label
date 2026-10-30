(function(root){
  'use strict';
  function bounds(box){
    const angle=(Number(box.rotation)||Number(box.rotation_deg)||0)*Math.PI/180;
    const cx=box.rotationCenter?.x??box.x+box.w/2,cy=box.rotationCenter?.y??box.y+box.h/2;
    const points=[[box.x,box.y],[box.x+box.w,box.y],[box.x,box.y+box.h],[box.x+box.w,box.y+box.h]].map(([x,y])=>({x:cx+(x-cx)*Math.cos(angle)-(y-cy)*Math.sin(angle),y:cy+(x-cx)*Math.sin(angle)+(y-cy)*Math.cos(angle)}));
    return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
  }
  function nearest(moving,others,axis){
    const horizontal=axis==='x',lo=horizontal?'left':'top',hi=horizontal?'right':'bottom',crossLo=horizontal?'top':'left',crossHi=horizontal?'bottom':'right';
    const found={};
    for(const other of others){
      const start=Math.max(moving[crossLo],other[crossLo]),end=Math.min(moving[crossHi],other[crossHi]);
      if(end<=start)continue;
      const side=other[hi]<=moving[lo]?'before':other[lo]>=moving[hi]?'after':null;
      if(!side)continue;
      const from=side==='before'?other[hi]:moving[hi],to=side==='before'?moving[lo]:other[lo],distance=to-from;
      if(!found[side]||distance<found[side].distance)found[side]={axis,from,to,cross:(start+end)/2,distance};
    }
    return Object.values(found);
  }
  function draw(group,measurements,scale,format,avoidGuides=[]){
    group.replaceChildren();
    const ns='http://www.w3.org/2000/svg',size=1/Math.max(scale,.001);
    function node(tag,attrs,text){const n=group.ownerDocument.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;group.append(n);return n;}
    for(const m of measurements){
      const horizontal=m.axis==='x',baseX1=horizontal?m.from:m.cross,baseY1=horizontal?m.cross:m.from,baseX2=horizontal?m.to:m.cross,baseY2=horizontal?m.cross:m.to;
      const min=horizontal?Math.min(baseX1,baseX2):Math.min(baseY1,baseY2),max=horizontal?Math.max(baseX1,baseX2):Math.max(baseY1,baseY2),cross=horizontal?baseY1:baseX1;
      const overlapsGuide=avoidGuides.some(guide=>{
        const x1=Number(guide.getAttribute('x1')),x2=Number(guide.getAttribute('x2')),y1=Number(guide.getAttribute('y1')),y2=Number(guide.getAttribute('y2'));
        if(horizontal){return Math.abs(y1-y2)<.001&&Math.abs(y1-cross)<2*size&&Math.max(Math.min(x1,x2),min)<Math.min(Math.max(x1,x2),max);}
        return Math.abs(x1-x2)<.001&&Math.abs(x1-cross)<2*size&&Math.max(Math.min(y1,y2),min)<Math.min(Math.max(y1,y2),max);
      });
      const offset=overlapsGuide?8*size:0,x1=baseX1+(horizontal?0:offset),y1=baseY1+(horizontal?offset:0),x2=baseX2+(horizontal?0:offset),y2=baseY2+(horizontal?offset:0);
      if(offset){
        node('line',{x1:baseX1,y1:baseY1,x2:x1,y2:y1,stroke:'#f04468','stroke-width':1,'vector-effect':'non-scaling-stroke'});
        node('line',{x1:baseX2,y1:baseY2,x2:x2,y2:y2,stroke:'#f04468','stroke-width':1,'vector-effect':'non-scaling-stroke'});
      }
      node('line',{x1,y1,x2,y2,stroke:'#f04468','stroke-width':1,'vector-effect':'non-scaling-stroke'});
      const arrow=Math.min(4*size,m.distance/3),wing=2.5*size;
      for(const [x,y,sign]of [[x1,y1,1],[x2,y2,-1]])node('path',{d:horizontal?`M ${x+sign*arrow} ${y-wing} L ${x} ${y} L ${x+sign*arrow} ${y+wing}`:`M ${x-wing} ${y+sign*arrow} L ${x} ${y} L ${x+wing} ${y+sign*arrow}`,fill:'none',stroke:'#f04468','stroke-width':1,'vector-effect':'non-scaling-stroke'});
      node('text',{x:(x1+x2)/2+(horizontal?0:5*size),y:(y1+y2)/2-(horizontal?5*size:0),'text-anchor':horizontal?'middle':'start','dominant-baseline':'middle','font-size':11*size,'font-family':'Arial, sans-serif',fill:'#c92f50',stroke:'white','stroke-width':3*size,'paint-order':'stroke','stroke-linejoin':'round'},format(m.distance));
    }
  }
  const api={bounds,nearest,draw};if(typeof module!=='undefined')module.exports=api;root.ObjectDistanceGuides=api;
})(typeof window!=='undefined'?window:globalThis);
