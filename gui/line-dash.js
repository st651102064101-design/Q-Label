(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LineDash=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Dash patterns in multiples of the line width (same table as Border > Dash).
  const DASHES=[[],[1,1],[2,1],[3,1],[5,1],[3,1,1,1],[3,1,1,1,1,1],[1,3],[3,3],[3,1,1,3],[3,1,1,1,1,3],[5,3],[7,3],[7,1],[1,5],[2,2],[3,2],[4,2],[5,2],[6,2],[8,2],[10,2],[2,3],[4,3],[6,3],[8,3],[10,3],[3,2,1,2],[5,2,1,2],[7,2,1,2],[3,2,1,2,1,2],[5,2,1,2,1,2],[7,2,1,2,1,2],[9,3,1,3,1,3]];
  const pattern=el=>{const i=Number(el?.dash_pattern);return Number.isInteger(i)&&i>0&&i<DASHES.length&&el.line_style==='dash'?i:0;};
  /** Dash array in mm for an element; legacy dash/dot styles keep their original values. */
  function dashArray(el){
    const i=pattern(el);
    if(i){const t=Math.max(.1,Number(el.thickness_mm)||.3);return DASHES[i].map(v=>v*t);}
    return el?.line_style==='dash'?[2,1]:el?.line_style==='dot'?[.4,.8]:[];
  }
  function svgAttr(el){const a=dashArray(el);return a.length?` stroke-dasharray="${a.map(v=>+v.toFixed(3)).join(' ')}"`:'';}
  /** Index shown as selected in the dash menu: -1 = erase, 0 = solid. Legacy dot/dash map to nearest presets. */
  function selectedIndex(el){
    if(el?.line_style==='erase')return -1;
    if(pattern(el))return pattern(el);
    return el?.line_style==='dash'?2:el?.line_style==='dot'?7:0;
  }
  /** Fields to assign when the user picks a menu entry. */
  function fieldsFor(index){
    if(index===-1)return {line_style:'erase',dash_pattern:0};
    if(!Number.isInteger(index)||index<=0||index>=DASHES.length)return {line_style:'solid',dash_pattern:0};
    return {line_style:'dash',dash_pattern:index};
  }
  return {DASHES,dashArray,svgAttr,selectedIndex,fieldsFor};
});
