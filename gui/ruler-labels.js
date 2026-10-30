(function(root){
  'use strict';
  const THICKNESS=19.5,BACKGROUND='#f3f4f6',FONT='600 15px Segoe UI,sans-serif';
  function paintPaperStrip(context,axis,pageStart,pageLength,viewLength,thickness,stripPosition,axisMinimum=0){
    const start=Math.max(axisMinimum,pageStart),end=Math.min(viewLength,pageStart+pageLength);
    if(end>start){
      context.fillStyle=BACKGROUND;
      if(axis==='horizontal')context.fillRect(start,stripPosition,end-start,thickness);
      else if(axis==='vertical')context.fillRect(stripPosition,start,thickness,end-start);
      else throw new RangeError('Unknown ruler axis: '+axis);
    }
    return {start,end};
  }
  function paintLabelArea(context,entry,thickness){
    const span=context.measureText(entry.label).width+3;
    context.fillStyle=BACKGROUND;
    context.fillRect(0,entry.pos-span/2,thickness,span);
  }
  function clearOffPaperLabelArea(context,entry,thickness,axis,offset=0){
    const span=context.measureText(entry.label).width+3,start=entry.pos-span/2,end=entry.pos+span/2;
    const paperStart=Number(entry.paperStart),paperEnd=Number(entry.paperEnd);
    const ranges=Number.isFinite(paperStart)&&Number.isFinite(paperEnd)
      ?[[start,Math.min(end,paperStart)],[Math.max(start,paperEnd),end]]:[[start,end]];
    for(const [from,to] of ranges){
      if(to<=from)continue;
      if(axis==='horizontal')context.clearRect(from,offset,to-from,thickness);
      else context.clearRect(0,from,thickness,to-from);
    }
  }
  function horizontal(context,entry,top,pad){
    context.font=FONT;
    if(entry.onPaper!==false){
      const span=context.measureText(entry.label).width+3;
      context.fillStyle=BACKGROUND;
      context.fillRect(entry.pos-span/2,top,span,pad);
    }else clearOffPaperLabelArea(context,entry,pad,'horizontal',top);
    context.fillStyle='#16a34a';
    context.textAlign='center';
    context.textBaseline='middle';
    context.fillText(entry.label,entry.pos,top+pad/2);
  }
  function vertical(context,entry,pad){
    context.font=FONT;
    if(entry.onPaper!==false)paintLabelArea(context,entry,pad);
    else clearOffPaperLabelArea(context,entry,pad,'vertical');
    context.save();
    context.fillStyle='#16a34a';
    context.textAlign='center';
    context.textBaseline='middle';
    context.translate(pad/2,entry.pos);
    context.rotate(-Math.PI/2);
    context.fillText(entry.label,0,0);
    context.restore();
  }
  function verticalOrigin(paperTop,frameTop,frameClientTop){return paperTop-frameTop-frameClientTop;}
  function visibleSpan(origin,length,viewLength,minimum=0){
    const start=Math.max(0,minimum,Math.min(viewLength,origin));
    const end=Math.max(start,Math.min(viewLength,origin+length));
    return {start,end};
  }
  function tickStartIndex(origin,visibleStart,visibleEnd,spacing){
    const value=Math.ceil((visibleStart-origin)/spacing),first=value===0?0:value;
    return origin>=visibleStart&&origin<=visibleEnd?Math.min(first,0):first;
  }
  function visibleHeight(frameHeight,paperBottom,viewportHeight,top){
    return Math.max(0,Math.min(Math.max(frameHeight,paperBottom),viewportHeight-top));
  }
  // Pick a scale-only cadence; viewport clipping must never choose its phase.
  function labelInterval(pixelsPerUnit,minPixels=64){
    if(!Number.isFinite(pixelsPerUnit)||pixelsPerUnit<=0||!Number.isFinite(minPixels)||minPixels<=0)throw new RangeError('Ruler scale and label spacing must be positive');
    const target=Math.max(1,minPixels/pixelsPerUnit),power=10**Math.floor(Math.log10(target));
    return [1,2,5,10].map(n=>n*power).find(n=>n>=target);
  }
  function isLabelTick(value,interval){
    if(!Number.isFinite(value)||!Number.isFinite(interval)||interval<=0)return false;
    const index=value/interval;return Math.abs(index-Math.round(index))<1e-7;
  }
  function formatCoordinate(value,decimals=2){const fixed=Number(value).toFixed(decimals);return Number(fixed)===0?(0).toFixed(decimals):fixed;}
  function coordinatePosition(pointer,origin,value,decimals=2){return Number(formatCoordinate(value,decimals))===0?origin:pointer;}
  const api={labelInterval,isLabelTick,horizontal,vertical,verticalOrigin,visibleSpan,tickStartIndex,visibleHeight,formatCoordinate,coordinatePosition,paintPaperStrip,THICKNESS,BACKGROUND,FONT};
  if(typeof module!=='undefined')module.exports=api;
  root.RulerLabels=api;
})(typeof window!=='undefined'?window:globalThis);
