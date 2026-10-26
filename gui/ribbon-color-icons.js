(function(root){
  'use strict';
  // Full-colour ribbon icons (24x24). One palette so every tab reads as a single set.
  const C={blue:'#2f6fd6',sky:'#cfe1fb',green:'#16a34a',mint:'#c9f0d8',orange:'#f59e0b',amber:'#fde7b0',red:'#dc2626',rose:'#fcd5d5',grey:'#64748b',mist:'#e2e8f0',paper:'#ffffff',ink:'#334155',purple:'#7c3aed',lilac:'#e4d9fc',teal:'#0d9488',aqua:'#c8f1ee',gold:'#facc15'};
  const S=(inner)=>'<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" aria-hidden="true" focusable="false">'+inner+'</svg>';
  const line=(d,color=C.ink,w=1.6)=>`<path d="${d}" stroke="${color}" stroke-width="${w}"/>`;
  const box=(x,y,w,h,fill,stroke=C.ink,r=1.5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
  const page=(x=5,y=3,w=14,h=18)=>`<path d="M${x} ${y}h${w-4}l4 4v${h-4}a1 1 0 0 1-1 1H${x+1}a1 1 0 0 1-1-1z" fill="${C.paper}" stroke="${C.grey}"/>`;
  const picture=(x=3,y=5,w=18,h=14)=>box(x,y,w,h,C.sky,C.blue,2)+`<circle cx="${x+5}" cy="${y+4.5}" r="1.9" fill="${C.gold}" stroke="${C.orange}" stroke-width="1"/><path d="M${x+1} ${y+h-1.5}l5-5 3.5 3.5 2.5-2.5 5 4.5z" fill="${C.green}" stroke="${C.green}" stroke-width=".8"/>`;
  const arrowCurve=(flip)=>`<g transform="${flip?'translate(24 0) scale(-1 1)':''}"><path d="M9 7 4.5 11.5 9 16" stroke="${C.blue}" stroke-width="2"/><path d="M5 11.5h8.5a5 5 0 0 1 0 10" stroke="${C.blue}" stroke-width="2" transform="translate(0 -4.5)"/></g>`;
  const align=(bars,axis,fill)=>{const items=bars.map(([a,b,c])=>axis==='v'?box(a,b,c,3,fill,C.blue,.8):box(b,a,3,c,fill,C.blue,.8)).join('');return items;};
  const alignIcon=(guide,bars)=>S(line(guide,C.red,1.6)+bars);
  const bars=(kind,fill=C.sky)=>{
    const h=(y,w,x)=>box(x,y,w,4,fill,C.blue,.8),v=(x,h2,y)=>box(x,y,4,h2,fill,C.blue,.8);
    return ({
      left:alignIcon('M3.5 3v18',h(6,13,5)+h(14,8,5)),
      hcenter:alignIcon('M12 3v18',h(6,14,5)+h(14,8,8)),
      right:alignIcon('M20.5 3v18',h(6,13,6)+h(14,8,11)),
      top:alignIcon('M3 3.5h18',v(6,13,5)+v(14,8,5)),
      vcenter:alignIcon('M3 12h18',v(6,14,5)+v(14,8,8)),
      bottom:alignIcon('M3 20.5h18',v(6,13,6)+v(14,8,11))
    })[kind];
  };
  const LABEL_ICONS={
    'Print':S(`<path d="M7 9V3.5h10V9" fill="${C.paper}" stroke="${C.grey}"/>${box(3,9,18,8,C.mist,C.grey,2)}<path d="M7 14h10v7H7z" fill="${C.paper}" stroke="${C.grey}"/><circle cx="17.5" cy="11.5" r="1" fill="${C.green}" stroke="none"/><path d="M9 17h6M9 19h4" stroke="${C.blue}"/>`),
    'Cut':S(`<path d="m8 5 8.5 10.5M16 5 7.5 15.5" stroke="${C.grey}" stroke-width="1.8"/><circle cx="7" cy="18" r="2.6" fill="${C.rose}" stroke="${C.red}" stroke-width="1.6"/><circle cx="17" cy="18" r="2.6" fill="${C.rose}" stroke="${C.red}" stroke-width="1.6"/>`),
    'Copy':S(box(8,8,12,13,C.sky,C.blue,2)+box(4,3,12,13,C.paper,C.blue,2)+line('M7 8h6M7 11h6',C.blue,1.2)),
    'Paste':S(box(4,5,16,16,C.amber,C.orange,2)+box(8,2.5,8,4,C.mist,C.grey,1.5)+box(8,10,11,10,C.paper,C.grey,1.5)+line('M10.5 13.5h6M10.5 16.5h4',C.blue,1.2)),
    'Duplicate':S(box(3,7,12,12,C.sky,C.blue,2)+box(9,3,12,12,C.paper,C.blue,2)+`<circle cx="17.5" cy="17.5" r="4.5" fill="${C.mint}" stroke="${C.green}"/>`+line('M17.5 15.2v4.6M15.2 17.5h4.6',C.green,1.8)),
    'Delete object':S(`<path d="M5 7h14M9 7V4.5h6V7" stroke="${C.red}" stroke-width="1.8"/><path d="M6.5 7l1 13h9l1-13z" fill="${C.rose}" stroke="${C.red}"/><path d="M10 10.5v6M14 10.5v6" stroke="${C.red}"/>`),
    'Delete picture':S(picture(2,4,16,13)+`<circle cx="17.5" cy="17.5" r="5" fill="${C.rose}" stroke="${C.red}"/>`+line('m15.3 15.3 4.4 4.4m0-4.4-4.4 4.4',C.red,1.8)),
    'Undo':S(`<path d="M9 6 4 10.5 9 15" stroke="${C.orange}" stroke-width="2.2"/><path d="M4.5 10.5h9.5a5.5 5.5 0 0 1 0 11H10" stroke="${C.blue}" stroke-width="2"/>`),
    'Redo':S(`<path d="m15 6 5 4.5-5 4.5" stroke="${C.orange}" stroke-width="2.2"/><path d="M19.5 10.5H10a5.5 5.5 0 0 0 0 11h4" stroke="${C.blue}" stroke-width="2"/>`),
    'SVG':S(box(3,3,18,18,C.lilac,C.purple,3)+`<path d="M6.5 16.5c2.5-9 8-9 11-9" stroke="${C.purple}" stroke-width="1.8"/><circle cx="6.5" cy="16.5" r="1.6" fill="${C.paper}" stroke="${C.purple}"/><circle cx="17.5" cy="7.5" r="1.6" fill="${C.paper}" stroke="${C.purple}"/>`),
    'Text':S(box(3,3,18,18,C.sky,C.blue,3)+line('M7 8V6.5h10V8M12 6.5v11M10 17.5h4',C.blue,2)),
    'Rectangle':S(box(3.5,6,17,12,C.amber,C.orange,2)),
    'Ellipse':S(`<ellipse cx="12" cy="12" rx="9" ry="6.5" fill="${C.aqua}" stroke="${C.teal}"/>`),
    'Line':S(line('M4.5 19.5 19.5 4.5',C.ink,2)+`<circle cx="4.5" cy="19.5" r="2" fill="${C.sky}" stroke="${C.blue}"/><circle cx="19.5" cy="4.5" r="2" fill="${C.sky}" stroke="${C.blue}"/>`),
    'Inverse':S(box(3,5,18,14,C.ink,C.ink,2)+`<path d="M8 15v-6l4 6v-6M15 9v6" stroke="${C.paper}" stroke-width="1.6"/>`),
    'Picture':S(picture()),
    'Insert Barcode':S(box(3,4,18,16,C.paper,C.grey,2)+`<path d="M6 7.5v7M8 7.5v7M11 7.5v7M13 7.5v7M15 7.5v7M18 7.5v7" stroke="${C.ink}" stroke-width="1.3"/><path d="M6 17.5h12" stroke="${C.blue}" stroke-width="1.6"/>`),
    'Insert Symbols':S(`<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.8 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z" fill="${C.gold}" stroke="${C.orange}"/>`),
    'Insert Table':S(box(3,4,18,16,C.paper,C.blue,2)+`<path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3H3z" fill="${C.sky}" stroke="${C.blue}"/>`+line('M3 14.5h18M9.5 9v11M15.5 9v11',C.blue,1.2)),
    'Insert Shapes':S(`<path d="M7 3.5 12.5 12H1.5z" transform="translate(1.5 0)" fill="${C.amber}" stroke="${C.orange}"/><circle cx="16.5" cy="8" r="4" fill="${C.mint}" stroke="${C.green}"/>`+box(5,13.5,9,7,C.sky,C.blue,1.5)+`<path d="m17.5 14 3 3-3 3-3-3z" fill="${C.lilac}" stroke="${C.purple}"/>`),
    'Page Setup':S(page(5,2.5,13,19)+`<path d="M8 8h7M8 11h7" stroke="${C.blue}"/><circle cx="17" cy="17" r="4.2" fill="${C.amber}" stroke="${C.orange}"/><circle cx="17" cy="17" r="1.3" fill="${C.paper}" stroke="${C.orange}" stroke-width="1"/>`),
    'Label Properties':S(`<path d="M3.5 6.5a2 2 0 0 1 2-2h8.4l6.6 7.5-6.6 7.5H5.5a2 2 0 0 1-2-2z" fill="${C.mint}" stroke="${C.green}"/><circle cx="8" cy="9" r="1.5" fill="${C.paper}" stroke="${C.green}" stroke-width="1"/>`+line('M8 13h6M8 16h4',C.green,1.3)),
    'Align left':bars('left'),'Align horizontal center':bars('hcenter'),'Align right':bars('right'),'Align top':bars('top'),'Align vertical center':bars('vcenter'),'Align bottom':bars('bottom'),
    'Align center':bars('hcenter'),'Align middle':bars('vcenter'),
    'Distribute horizontally':S(line('M3.5 3v18M20.5 3v18',C.red,1.6)+box(9.5,6,5,12,C.sky,C.blue,1)+line('M5 12h3M16 12h3',C.orange,1.4)),
    'Distribute vertically':S(line('M3 3.5h18M3 20.5h18',C.red,1.6)+box(6,9.5,12,5,C.sky,C.blue,1)+line('M12 5v3M12 16v3',C.orange,1.4)),
    'Bring to front':S(box(3,3,12,12,C.sky,C.blue,2)+box(9,9,12,12,C.amber,C.orange,2)+line('M15 12.5V17m-2-2 2-2 2 2',C.orange,1.4)),
    'Send to back':S(box(9,9,12,12,C.sky,C.blue,2)+box(3,3,12,12,C.amber,C.orange,2)+line('M9 11.5V7m-2 2 2 2 2-2',C.orange,1.4)),
    'Lock picture':S(picture(2,8,17,12)+`<rect x="13" y="2.5" width="9" height="7" rx="1.5" fill="${C.gold}" stroke="${C.orange}"/><path d="M15 2.5v-1a2.5 2.5 0 0 1 5 0v1" transform="translate(0 0)" stroke="${C.orange}"/>`),
    'Replace picture':S(picture(2,8,14,11)+`<path d="M13 4h7l-2.2-2.2M20 4l-2.2 2.2M20 8h-7l2.2 2.2M13 8l2.2-2.2" transform="translate(0 0)" stroke="${C.green}" stroke-width="1.6"/>`),
    'Remove background':S(picture(2,5,14,11)+`<path d="m13 21 8-8 2 2-5 6z" fill="${C.rose}" stroke="${C.red}"/><path d="M13 21h5" stroke="${C.red}"/>`),
    'Transparent background':S(box(3,3,18,18,C.paper,C.grey,2)+`<path d="M3 3h6v6H3zM15 3h6v6h-6zM9 9h6v6H9zM3 15h6v6H3zM15 15h6v6h-6z" fill="${C.mist}" stroke="none"/>`+box(3,3,18,18,'none',C.grey,2)),
    'Rotate left':S(`<path d="M5 12a7 7 0 1 0 2.2-5.1" stroke="${C.blue}" stroke-width="2"/><path d="M4 4v5h5" stroke="${C.orange}" stroke-width="2.2"/>`),
    'Rotate right':S(`<path d="M19 12a7 7 0 1 1-2.2-5.1" stroke="${C.blue}" stroke-width="2"/><path d="M20 4v5h-5" stroke="${C.orange}" stroke-width="2.2"/>`),
    'Flip horizontal':S(line('M12 2.5v19',C.red,1.6)+`<path d="M10 6 3 18h7z" fill="${C.sky}" stroke="${C.blue}"/><path d="M14 6l7 12h-7z" fill="${C.amber}" stroke="${C.orange}"/>`),
    'Flip vertical':S(line('M2.5 12h19',C.red,1.6)+`<path d="M6 10 18 10 12 3z" fill="${C.sky}" stroke="${C.blue}"/><path d="M6 14h12l-6 7z" fill="${C.amber}" stroke="${C.orange}"/>`),
    'Connect database':S(`<ellipse cx="12" cy="6" rx="7.5" ry="3" fill="${C.sky}" stroke="${C.blue}"/><path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" fill="${C.sky}" stroke="${C.blue}"/><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" stroke="${C.blue}"/>`),
    'Values to Print':S(box(3,3,18,18,C.paper,C.grey,2)+line('M6.5 8.5l1.5 1.5 2.5-3M13 8.5h5M6.5 14.5l1.5 1.5 2.5-3M13 14.5h5',C.green,1.6)),
    'List Fields':S(box(3,3,18,18,C.paper,C.blue,2)+`<circle cx="7.5" cy="8" r="1.2" fill="${C.blue}" stroke="none"/><circle cx="7.5" cy="12" r="1.2" fill="${C.orange}" stroke="none"/><circle cx="7.5" cy="16" r="1.2" fill="${C.green}" stroke="none"/>`+line('M11 8h7M11 12h7M11 16h7',C.grey,1.4)),
    'Zoom in':S(`<circle cx="10.5" cy="10.5" r="6.5" fill="${C.sky}" stroke="${C.blue}" stroke-width="1.8"/><path d="m15.5 15.5 5.5 5.5" stroke="${C.ink}" stroke-width="2.2"/>`+line('M10.5 7.5v6M7.5 10.5h6',C.green,1.8)),
    'Zoom out':S(`<circle cx="10.5" cy="10.5" r="6.5" fill="${C.sky}" stroke="${C.blue}" stroke-width="1.8"/><path d="m15.5 15.5 5.5 5.5" stroke="${C.ink}" stroke-width="2.2"/>`+line('M7.5 10.5h6',C.red,1.8)),
    'Fit page':S(box(7,6,10,12,C.paper,C.grey,1)+line('M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5',C.blue,2)),
    'Preview Settings':S(`<path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12z" fill="${C.sky}" stroke="${C.blue}"/><circle cx="12" cy="12" r="3.2" fill="${C.paper}" stroke="${C.blue}"/><circle cx="12" cy="12" r="1.3" fill="${C.ink}" stroke="none"/>`),
    'Show grid':S(box(3,3,18,18,C.paper,C.blue,2)+line('M9 3v18M15 3v18M3 9h18M3 15h18',C.blue,1.1)+`<circle cx="9" cy="9" r="1.2" fill="${C.orange}" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="${C.orange}" stroke="none"/>`),
    'Show gap':S(box(2.5,4,7.5,16,C.mint,C.green,1.5)+box(14,4,7.5,16,C.mint,C.green,1.5)+line('M10.5 12h3M11.5 10.5 10.2 12l1.3 1.5M12.5 10.5l1.3 1.5-1.3 1.5',C.orange,1.2)),
    'Snap to grid':S(`<path d="M5 3v8a7 7 0 0 0 14 0V3h-4v8a3 3 0 0 1-6 0V3z" fill="${C.rose}" stroke="${C.red}"/><path d="M5 3h4M15 3h4" stroke="${C.grey}" stroke-width="2.2"/><path d="M3 20h18M7 17v3M12 17v3M17 17v3" stroke="${C.blue}" stroke-width="1.2"/>`),
    'Print calibration':S(box(3,9,18,8,C.mist,C.grey,2)+`<path d="M7 9V4h10v5" fill="${C.paper}" stroke="${C.grey}"/>`+box(6,14,12,6,C.paper,C.blue,1)+line('M8 14v2M10 14v3M12 14v2M14 14v3M16 14v2',C.blue,1.1)),
    'Settings':S(`<path d="M10.5 3h3l.6 2.4 1.9.8 2.1-1.3 2.1 2.1-1.3 2.1.8 1.9 2.4.6v3l-2.4.6-.8 1.9 1.3 2.1-2.1 2.1-2.1-1.3-1.9.8-.6 2.4h-3l-.6-2.4-1.9-.8-2.1 1.3-2.1-2.1 1.3-2.1-.8-1.9L3 13.5v-3l2.4-.6.8-1.9L4.9 5.9 7 3.8l2.1 1.3 1.9-.8z" fill="${C.mist}" stroke="${C.grey}" transform="translate(-.5 .5) scale(.96)"/><circle cx="12" cy="12" r="3.3" fill="${C.sky}" stroke="${C.blue}"/>`),
    'Printer connection':S(box(2.5,10,12,8,C.mist,C.grey,2)+`<path d="M5 10V5.5h7V10" fill="${C.paper}" stroke="${C.grey}"/>`+`<path d="M15 14h2.5a2.5 2.5 0 0 0 0-5H15M20 14.5h1.5" stroke="${C.green}" stroke-width="1.8"/><circle cx="9" cy="14" r="1" fill="${C.green}" stroke="none"/>`)
  };
  const cleanKey=text=>String(text||'').trim();
  function apply(host){
    const scope=host||document;
    let n=0;
    for(const button of scope.querySelectorAll('.ribbon-command')){
      const label=cleanKey(button.getAttribute('aria-label')||button.title||'');
      const svg=LABEL_ICONS[label];
      const existing=button.querySelector('svg');
      if(!svg||existing?.classList.contains('ribbon-color-icon'))continue;
      if(existing&&new Set(existing.outerHTML.match(/#[0-9a-f]{3,6}/gi)||[]).size>=3)continue;
      const dataIcon=existing?.dataset?.icon;
      const holder=document.createElement('div');holder.innerHTML=svg;const next=holder.firstElementChild;
      if(dataIcon)next.dataset.icon=dataIcon;
      next.classList.add('ribbon-color-icon');
      if(existing)existing.replaceWith(next);else button.prepend(next);
      n++;
    }
    return n;
  }
  const css='.ribbon-command svg.ribbon-color-icon{stroke:none}.ribbon-command:disabled svg.ribbon-color-icon,.ribbon-command.unavailable-tool svg.ribbon-color-icon{filter:grayscale(1);opacity:.45}';
  const api={LABEL_ICONS,PALETTE:C,apply};
  if(typeof document!=='undefined'){
    const style=document.createElement('style');style.textContent=css;document.head.append(style);
    const run=()=>apply(document);
    run();
    new MutationObserver(()=>run()).observe(document.body||document.documentElement,{childList:true,subtree:true});
    root.RibbonColorIcons=api;
  }
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
