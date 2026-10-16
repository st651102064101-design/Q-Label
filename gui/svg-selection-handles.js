(function(root,factory){
  'use strict';

  const resizeControlSnapshots=new WeakMap(),resizeStrokeSnapshots=new WeakMap();

  function controlCenter(node){
    if(node.hasAttribute('cx')||node.hasAttribute('cy'))return{x:Number(node.getAttribute('cx'))||0,y:Number(node.getAttribute('cy'))||0};
    const x=Number(node.getAttribute('x'))||0,y=Number(node.getAttribute('y'))||0;
    return{x:x+(Number(node.getAttribute('width'))||0)/2,y:y+(Number(node.getAttribute('height'))||0)/2};
  }

  function counterScaleResizeControls(controls,transform,scaleX,scaleY){
    if(!controls)return null;
    let snapshot=resizeControlSnapshots.get(controls);
    if(!snapshot){snapshot={transform:controls.getAttribute('transform'),children:new Map()};resizeControlSnapshots.set(controls,snapshot);}
    controls.setAttribute('transform',transform);
    const inverseX=1/Math.max(.01,Number(scaleX)||1),inverseY=1/Math.max(.01,Number(scaleY)||1);
    const scaleNode=(node,cx,cy)=>{
      if(!snapshot.children.has(node))snapshot.children.set(node,node.getAttribute('transform'));
      const base=snapshot.children.get(node)||'';
      node.setAttribute('transform',`${base} translate(${cx} ${cy}) scale(${inverseX} ${inverseY}) translate(${-cx} ${-cy})`.trim());
    };
    controls.querySelectorAll('.handle-dot,.handle-hit,.rotation-dot,.rotation-stem,.hri-handle-dot,.hri-handle-hit,.table-divider-dot').forEach(node=>{
      const center=controlCenter(node);scaleNode(node,center.x,center.y);
    });
    const groups=[...controls.querySelectorAll('.stroke-width-control,.table-corner-add')];
    controls.querySelectorAll('.line-controls > g:not(.line-endpoint)').forEach(node=>groups.push(node));
    for(const group of new Set(groups)){
      const box=group.getBBox?.();if(!box)continue;
      const cx=box.x+box.width/2,cy=box.y+box.height/2;
      if(!snapshot.children.has(group))snapshot.children.set(group,group.getAttribute('transform'));
      const base=snapshot.children.get(group)||'';
      group.setAttribute('transform',`${base} translate(${cx} ${cy}) scale(${inverseX} ${inverseY}) translate(${-cx} ${-cy})`.trim());
    }
    return {inverseScaleX:inverseX,inverseScaleY:inverseY};
  }

  function restoreResizeControlTransforms(controls){
    const snapshot=controls&&resizeControlSnapshots.get(controls);if(!snapshot)return false;
    if(snapshot.transform===null)controls.removeAttribute('transform');else controls.setAttribute('transform',snapshot.transform);
    for(const [node,transform] of snapshot.children){if(transform===null)node.removeAttribute('transform');else node.setAttribute('transform',transform);}
    resizeControlSnapshots.delete(controls);return true;
  }

  function preserveResizeStrokes(art,_screenScale,getStyle){
    if(!art)return 0;
    let snapshot=resizeStrokeSnapshots.get(art);
    if(!snapshot){snapshot=new Map();resizeStrokeSnapshots.set(art,snapshot);}
    const nodes=[art,...art.querySelectorAll('*')];let changed=0;
    for(const node of nodes){
      const style=typeof getStyle==='function'?getStyle(node):null,stroke=node.getAttribute('stroke')||style?.stroke||'',widthText=node.getAttribute('stroke-width')||style?.strokeWidth||'',width=Number.parseFloat(widthText);
      if(!stroke||stroke==='none'||stroke==='transparent'||!(width>0))continue;
      if(!snapshot.has(node))snapshot.set(node,{strokeWidth:node.getAttribute('stroke-width'),vectorEffect:node.getAttribute('vector-effect'),styleWidth:node.style?.getPropertyValue('stroke-width')||'',styleVectorEffect:node.style?.getPropertyValue('vector-effect')||''});
      const saved=snapshot.get(node);
      node.setAttribute('vector-effect','non-scaling-stroke');
      // The vector effect removes the artwork transform from stroke scaling.
      // Multiplying this authored SVG width by the screen CTM therefore makes
      // the stroke enormous during a zoomed resize and can cover the canvas.
      if(saved.styleVectorEffect)node.style.setProperty('vector-effect','non-scaling-stroke');
      changed++;
    }
    return changed;
  }

  function restoreResizeStrokes(art){
    const snapshot=art&&resizeStrokeSnapshots.get(art);if(!snapshot)return false;
    for(const [node,saved] of snapshot){
      if(saved.strokeWidth===null)node.removeAttribute('stroke-width');else node.setAttribute('stroke-width',saved.strokeWidth);
      if(saved.vectorEffect===null)node.removeAttribute('vector-effect');else node.setAttribute('vector-effect',saved.vectorEffect);
      if(node.style){if(saved.styleWidth)node.style.setProperty('stroke-width',saved.styleWidth);else node.style.removeProperty('stroke-width');if(saved.styleVectorEffect)node.style.setProperty('vector-effect',saved.styleVectorEffect);else node.style.removeProperty('vector-effect');}
    }
    resizeStrokeSnapshots.delete(art);return true;
  }
  const api=factory({counterScaleResizeControls,restoreResizeControlTransforms,preserveResizeStrokes,restoreResizeStrokes});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SvgSelectionHandles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(resizeHelpers){
  'use strict';
  const {counterScaleResizeControls,restoreResizeControlTransforms,preserveResizeStrokes,restoreResizeStrokes}=resizeHelpers;

  function cornerVisibility(element,anchor){
    return ['nw','ne','sw','se'].includes(anchor)?'visible':'hidden';
  }

  function updateRotationAngleLabel(group,angle,position){
    if(!group||!position)return null;
    let label=group.querySelector('.rotation-snap-label');
    if(!label){label=group.ownerDocument.createElementNS('http://www.w3.org/2000/svg','text');label.setAttribute('text-anchor','middle');label.setAttribute('dominant-baseline','middle');label.setAttribute('class','rotation-snap-label');group.append(label);}
    const degrees=Math.round(Number(angle)||0);
    label.setAttribute('x',position.x);label.setAttribute('y',position.y);label.textContent=`${degrees}°`;
    return label;
  }

  function updateHriControls(controls,markup,visual,rotation=0,rotationCenter){
    if(!controls||!visual)return null;
    const angle=Number(rotation)||0,center=rotationCenter||{x:visual.x+visual.w/2,y:visual.y+visual.h/2};
    const transform=angle?` transform="rotate(${angle} ${center.x} ${center.y})"`:'';
    controls.innerHTML=`<rect class="sel" x="${visual.x}" y="${visual.y}" width="${visual.w}" height="${visual.h}"${transform}/>`+markup;
    return controls.querySelector('.sel');
  }

  function overflowHighlightPath(box,angle=0,dx=0,dy=0){
    const cx=(box.rotationCenter?.x??box.x+box.w/2)+dx,cy=(box.rotationCenter?.y??box.y+box.h/2)+dy,radians=Number(angle||0)*Math.PI/180,cos=Math.cos(radians),sin=Math.sin(radians);
    return [[box.x,box.y],[box.x+box.w,box.y],[box.x+box.w,box.y+box.h],[box.x,box.y+box.h]].map(([x,y],i)=>{const px=x+dx-cx,py=y+dy-cy;return`${i?'L':'M'}${cx+px*cos-py*sin} ${cy+px*sin+py*cos}`;}).join(' ')+' Z';
  }

  function updateOverflowHighlight(group,shape,box,angle,paper,boundsFor,overflows,dx=0,dy=0){
    if(!group||!shape||!box||!paper)return null;
    shape.setAttribute('d',overflowHighlightPath(box,angle,dx,dy));
    const rotatedBox={...box,x:box.x+dx,y:box.y+dy,rotation_deg:Number(angle)||0,rotationCenter:box.rotationCenter?{x:box.rotationCenter.x+dx,y:box.rotationCenter.y+dy}:undefined};
    const bounds=typeof boundsFor==='function'?boundsFor(rotatedBox):null;
    const outside=!!bounds&&typeof overflows==='function'&&overflows(bounds,paper);
    if(outside)group.removeAttribute('display');else group.setAttribute('display','none');
    return outside;
  }

  return {cornerVisibility,counterScaleResizeControls,restoreResizeControlTransforms,preserveResizeStrokes,restoreResizeStrokes,updateHriControls,overflowHighlightPath,updateOverflowHighlight,updateRotationAngleLabel};
});
