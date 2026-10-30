(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PageGap=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function distance(value){const number=Number(value);return Number.isFinite(number)&&number>0?number:0;}
  function layout(template){
    if(!template||!(Number(template.width_mm)>0&&Number(template.height_mm)>0))return null;
    const source=template.page?.enabled?template.page:{},stock=template.stock||{};
    const columns=Math.max(1,Math.floor(Number(source.columns)||1)),rows=Math.max(1,Math.floor(Number(source.rows)||1));
    const left=distance(source.left_mm),top=distance(source.top_mm),gapX=distance(source.gap_x_mm),gapY=distance(source.gap_y_mm);
    const contentW=columns*Number(template.width_mm)+(columns-1)*gapX,contentH=rows*Number(template.height_mm)+(rows-1)*gapY;
    const width=distance(source.width_mm)||left+contentW+distance(source.right_mm),height=distance(source.height_mm)||top+contentH+distance(source.bottom_mm);
    const right=Math.max(distance(source.right_mm),width-left-contentW),bottom=Math.max(distance(source.bottom_mm),height-top-contentH);
    const backingLeft=distance(stock.liner_left_mm),backingRight=distance(stock.liner_right_mm),backingTop=distance(stock.liner_top_mm),backingBottom=distance(stock.liner_bottom_mm);
    return {...source,enabled:true,columns,rows,width_mm:width+backingLeft+backingRight,height_mm:height+backingTop+backingBottom,left_mm:left+backingLeft,right_mm:right+backingRight,top_mm:top+backingTop,bottom_mm:bottom+backingBottom,gap_x_mm:gapX,gap_y_mm:gapY};
  }
  function hasGap(page){
    if(!page?.enabled)return false;
    if(distance(page.width_mm)&&distance(page.height_mm))return true;
    const columns=Math.max(1,Math.floor(Number(page.columns)||1)),rows=Math.max(1,Math.floor(Number(page.rows)||1));
    return ['top_mm','bottom_mm','left_mm','right_mm'].some(key=>distance(page[key])>0)||(columns>1&&distance(page.gap_x_mm)>0)||(rows>1&&distance(page.gap_y_mm)>0);
  }
  const TAB_MM=1.27;
  function backing({show=false,page,templateWidth,templateHeight}={}){
    if(!show||!page?.enabled)return '';
    const width=Number(page.width_mm),height=Number(page.height_mm),labelH=Number(templateHeight);
    if(![width,height,labelH].every(value=>Number.isFinite(value)&&value>0))return '';
    const left=distance(page.left_mm),top=distance(page.top_mm),bottom=distance(page.bottom_mm);
    const top0=top>0?-top:-TAB_MM,bottomEnd=bottom>0?height-top:labelH+TAB_MM;
    return `<rect data-paper-backing="true" x="${-left}" y="${top0}" width="${width}" height="${bottomEnd-top0}" fill="#e2e8f0"/>`;
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
      margins.push(`<g data-paper-edge="${side}" data-paper-margin="${side}" data-distance-mm="${value}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e2e8f0" fill-opacity=".8"/><text x="${tx}" y="${ty}"${rotation?` transform="rotate(${rotation} ${tx} ${ty})"`:''} font-family="Segoe UI, sans-serif" font-size="${font}" text-anchor="middle" dominant-baseline="middle" fill="#475569" stroke="#fff" stroke-width=".4" paint-order="stroke">${caption}</text></g>`);
    };
    edge('top',top,-left,-top,width,Math.min(top,height),width/2-left,-top/2);
    edge('bottom',bottom,-left,height-top-Math.min(bottom,height),width,Math.min(bottom,height),width/2-left,height-top-bottom/2);
    edge('left',left,-left,0,Math.min(left,width),Math.max(0,height-top-bottom),-left/2,(height-top-bottom)/2,-90);
    edge('right',right,width-left-Math.min(right,width),0,Math.min(right,width),Math.max(0,height-top-bottom),width-left-right/2,(height-top-bottom)/2,90);
    const zeroEdge=(side,value,x1,y1,x2,y2,tx,ty)=>{if(value)return;const caption=side[0].toUpperCase()+side.slice(1)+' 0 mm';margins.push(`<g data-paper-edge="${side}" data-distance-mm="0" pointer-events="none"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#94a3b8" stroke-width=".2" stroke-dasharray="1 .6"/><text x="${tx}" y="${ty}" font-family="Segoe UI, sans-serif" font-size="${font}" text-anchor="middle" dominant-baseline="middle" fill="#475569" stroke="#fff" stroke-width=".4" paint-order="stroke">${caption}</text></g>`);};
    zeroEdge('left',left,-left,-top,-left,height-top,-left-font*3.2,height/2-top);
    zeroEdge('right',right,width-left,-top,width-left,height-top,width-left+font*3.2,height/2-top);
    const marginMarkup=margins.length?`<g class="editor-paper-margins" pointer-events="none">${margins.join('')}</g>`:'';
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
    const tabBand=(side,value,y)=>{
      if(value)return '';
      const caption=side[0].toUpperCase()+side.slice(1)+' '+TAB_MM+' mm';
      return `<g data-paper-tab="${side}" data-distance-mm="${TAB_MM}"><rect x="0" y="${y}" width="${labelW}" height="${TAB_MM}" fill="#e2e8f0" fill-opacity=".8"/><text x="${labelW/2}" y="${y+TAB_MM/2}" font-family="Segoe UI, sans-serif" font-size="${font}" text-anchor="middle" dominant-baseline="middle" fill="#475569" stroke="#fff" stroke-width=".4" paint-order="stroke">${caption}</text></g>`;
    };
    const tabs=tabBand('top',top,-TAB_MM)+tabBand('bottom',bottom,labelH);
    return marginMarkup+`<g class="editor-label-gaps" pointer-events="none">${tabs}${bands.length?`<g fill="#cbd5e1" fill-opacity=".72" stroke="#94a3b8" stroke-opacity=".65" stroke-width=".12" vector-effect="non-scaling-stroke">${bands.join('')}</g>`:''}</g>`;
  }
  function bindToggle(button,onChange=()=>{},available=()=>true){
    let gapsShown=false;
    const sync=()=>{
      const enabled=!!available();
      const hidden=!gapsShown;
      button.disabled=!enabled;
      button.setAttribute('aria-pressed',String(hidden));
      button.title=enabled?(hidden?'Hide gap':'Show gap'):'No label gap configured';
      button.setAttribute('aria-label',button.title);
      const caption=button.querySelector('.ribbon-caption');
      if(caption)caption.textContent=button.title;
      button.classList.toggle('is-active',hidden);
    };
    button.addEventListener('click',()=>{if(!available())return;gapsShown=!gapsShown;sync();onChange(gapsShown);});
    sync();
    return {get visible(){return gapsShown;},refresh:sync};
  }
  return {layout,hasGap,backing,render,bindToggle};
});
