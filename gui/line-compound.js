(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LineCompound=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Compound line profiles in relative units: odd entries are strokes, even entries gaps (same table as Border > Line).
  const COMPOUNDS={single:[1],double:[1,1,1],'thin-thick':[1,1,2],'thick-thin':[2,1,1],'thin-thick-thin':[1,1,2,1,1],triple:[1,1,1,1,1],'thick-thin-thick':[2,1,1,1,2]};
  const KEYS=Object.keys(COMPOUNDS);
  const keyOf=el=>Object.hasOwn(COMPOUNDS,el?.compound)?el.compound:'single';
  const isCompound=el=>keyOf(el)!=='single';
  /** Stroke bands across the line: `from` is the distance from the outer edge; strokes plus gaps add up to the line thickness. */
  function stripes(el){
    const profile=COMPOUNDS[keyOf(el)],total=Math.max(.1,Number(el?.thickness_mm)||.3),unit=total/profile.reduce((a,v)=>a+v,0);
    const out=[];let cursor=0;
    profile.forEach((ratio,index)=>{if(index%2===0)out.push({from:cursor,width:ratio*unit});cursor+=ratio*unit;});
    return out;
  }
  return {COMPOUNDS,KEYS,keyOf,isCompound,stripes};
});
