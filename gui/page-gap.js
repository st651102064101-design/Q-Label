(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PageGap=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function distance(value){const number=Number(value);return Number.isFinite(number)&&number>0?number:0;}
  function hasGap(page){
    if(!page?.enabled)return false;
    const columns=Math.max(1,Math.floor(Number(page.columns)||1)),rows=Math.max(1,Math.floor(Number(page.rows)||1));
    return ['top_mm','bottom_mm','left_mm','right_mm'].some(key=>distance(page[key])>0)||(columns>1&&distance(page.gap_x_mm)>0)||(rows>1&&distance(page.gap_y_mm)>0);
  }
  function render({show=false,page,templateWidth,templateHeight}={}){
    if(!show||!page?.enabled)return '';
    const width=Number(page.width_mm),height=Number(page.height_mm),labelW=Number(templateWidth),labelH=Number(templateHeight);
    const left=distance(page.left_mm),top=distance(page.top_mm),right=distance(page.right_mm),bottom=distance(page.bottom_mm),columns=Math.max(1,Math.floor(Number(page.columns)||1)),rows=Math.max(1,Math.floor(Number(page.rows)||1));
    const gapX=Math.max(0,Number(page.gap_x_mm)||0),gapY=Math.max(0,Number(page.gap_y_mm)||0);
    if(![width,height,labelW,labelH].every(value=>Number.isFinite(value)&&value>0))return '';
    const margins=[],font=Math.min(3,Math.max(1.3,Math.min(labelW,labelH)*.045));
    const edge=(side,value,x,y,w,h,tx,ty,rotation=0)=>{
      if(!value||!(w>0&&h>0))return;
      const caption=side[0].toUpperCase()+side.slice(1)+' '+Number(value.toFixed(3))+' mm';
      margins.push(`<g data-paper-margin="${side}" data-distance-mm="${value}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e2e8f0" fill-opacity=".8"/><text x="${tx}" y="${ty}"${rotation?` transform="rotate(${rotation} ${tx} ${ty})"`:''} font-family="Segoe UI, sans-serif" font-size="${font}" text-anchor="middle" dominant-baseline="middle" fill="#475569" stroke="#fff" stroke-width=".4" paint-order="stroke">${caption}</text></g>`);
    };
    edge('top',top,-left,-top,width,Math.min(top,height),width/2-left,-top/2);
    edge('bottom',bottom,-left,height-top-Math.min(bottom,height),width,Math.min(bottom,height),width/2-left,height-top-bottom/2);
    edge('left',left,-left,0,Math.min(left,width),Math.max(0,height-top-bottom),-left/2,(height-top-bottom)/2,-90);
    edge('right',right,width-left-Math.min(right,width),0,Math.min(right,width),Math.max(0,height-top-bottom),width-left-right/2,(height-top-bottom)/2,90);
    const marginMarkup=margins.length?`<g class="editor-paper-margins" pointer-events="none">${margins.join('')}<rect data-paper-margin-boundary="true" x="0" y="0" width="${Math.max(0,width-left-right)}" height="${Math.max(0,height-top-bottom)}" fill="none" stroke="#94a3b8" stroke-width=".15" vector-effect="non-scaling-stroke"/></g>`:'';
    const bands=[];
    if(gapX>0)for(let column=0;column<columns-1;column++){
      const x=labelW+column*(labelW+gapX);
      if(x>=width-left)continue;
      bands.push(`<rect data-label-gap="horizontal" x="${x}" y="${-top}" width="${Math.min(gapX,width-left-x)}" height="${height}"/>`);
    }
    if(gapY>0)for(let row=0;row<rows-1;row++){
      const y=labelH+row*(labelH+gapY);
      if(y>=height-top)continue;
      bands.push(`<rect data-label-gap="vertical" x="${-left}" y="${y}" width="${width}" height="${Math.min(gapY,height-top-y)}"/>`);
    }
    return marginMarkup+(bands.length?`<g class="editor-label-gaps" fill="#cbd5e1" fill-opacity=".72" stroke="#94a3b8" stroke-opacity=".65" stroke-width=".12" vector-effect="non-scaling-stroke" pointer-events="none">${bands.join('')}</g>`:'');
  }
  function bindToggle(button,onChange=()=>{},available=()=>true){
    let visible=false;
    const sync=()=>{
      const enabled=!!available();
      button.disabled=!enabled;
      button.setAttribute('aria-pressed',String(visible));
      button.title=enabled?(visible?'Hide gap':'Show gap'):'No label gap configured';
      button.setAttribute('aria-label',button.title);
      const caption=button.querySelector('.ribbon-caption');
      if(caption)caption.textContent=button.title;
      button.classList.toggle('is-active',visible);
    };
    button.addEventListener('click',()=>{if(!available())return;visible=!visible;sync();onChange(visible);});
    sync();
    return {get visible(){return visible;},refresh:sync};
  }
  return {hasGap,render,bindToggle};
});
