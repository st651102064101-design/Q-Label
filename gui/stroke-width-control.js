(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.StrokeWidthControl=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function renderHoverRing(){
    return '<circle class="stroke-width-hover-ring" cx="0" cy="0" r="17" fill="none" stroke="#16a34a" stroke-width="2" visibility="hidden" pointer-events="none"/>';
  }

  function setHover(group,active){
    if(!group)return;
    group.classList.toggle('is-stroke-width-hover',active);
    group.querySelectorAll('.stroke-width-hover-ring').forEach(ring=>ring.setAttribute('visibility',active?'visible':'hidden'));
  }

  function renderEdgeGuide({x,y,w,h,scale=1,index}){
    return `<rect class="stroke-width-edge-guide" data-stroke-guide="${index}" x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#16a34a" stroke-width="${scale}" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
  }

  function bindHover(svg){
    if(!svg||svg._strokeWidthHoverBound)return;
    svg._strokeWidthHoverBound=true;
    svg.addEventListener('pointerover',event=>{
      const control=event.target.closest?.('.stroke-width-control');
      if(control)setHover(control.closest('[data-editor-overlay]'),true);
    });
    svg.addEventListener('pointerout',event=>{
      const control=event.target.closest?.('.stroke-width-control');
      if(!control||control.contains(event.relatedTarget))return;
      setHover(control.closest('[data-editor-overlay]'),false);
    });
    svg.addEventListener('pointerdown',event=>{
      if(!event.target.closest?.('.stroke-width-control'))svg.querySelectorAll('.is-stroke-width-hover').forEach(group=>setHover(group,false));
    });
  }

  return {renderEdgeGuide,renderHoverRing,bindHover};
});
