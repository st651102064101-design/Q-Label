(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.ColorPicker=api;})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const RECENT_KEY='qlabel.recentColors',RECENT_MAX=6,RADIUS=6;

  function hslToHex(h,s,l){
    const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))));};
    return '#'+[f(0),f(8),f(4)].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  /** Hexagonal wheel (127 cells) of axial coordinates; the centre is white, the rim fully saturated. */
  function wheelCells(){
    const cells=[];
    for(let r=-RADIUS;r<=RADIUS;r++)for(let q=-RADIUS;q<=RADIUS;q++){
      const ring=Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));if(ring>RADIUS)continue;
      const x=Math.sqrt(3)*(q+r/2),y=1.5*r;
      let color='#ffffff';
      if(ring>0){
        const hue=(Math.atan2(y,x)*180/Math.PI+90+360)%360;
        color=hslToHex(hue,1,.95-.45*(ring/RADIUS));
      }
      cells.push({q,r,x,y,ring,color});
    }
    return cells;
  }
  function greyCells(){const out=[];for(let i=0;i<15;i++){const v=Math.round(240-i*(240/14));out.push('#'+[v,v,v].map(n=>n.toString(16).padStart(2,'0')).join(''));}return out;}
  function hsvToRgb(h,sat,val){const f=n=>{const k=(n+h/60)%6;return val-val*sat*Math.max(0,Math.min(k,4-k,1));};return [f(5),f(3),f(1)].map(v=>Math.round(v*255));}
  function rgbToHsv(r,g,b){const mx=Math.max(r,g,b)/255,mn=Math.min(r,g,b)/255,d=mx-mn,R=r/255,G=g/255,B=b/255;let h=0;if(d){h=mx===R?((G-B)/d)%6:mx===G?(B-R)/d+2:(R-G)/d+4;h=(h*60+360)%360;}return [h,mx?d/mx:0,mx];}
  const rgbToHex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(Number(v)||0))).toString(16).padStart(2,'0')).join('');
  const normalise=value=>{const m=/^#?([0-9a-f]{6})$/i.exec(String(value||'').trim());return m?'#'+m[1].toLowerCase():null;};

  function recentColors(){try{return JSON.parse(root.localStorage?.getItem(RECENT_KEY)||'[]').map(normalise).filter(Boolean).slice(0,RECENT_MAX);}catch{return [];}}
  function rememberColor(hex){
    const color=normalise(hex);if(!color)return recentColors();
    const next=[color,...recentColors().filter(item=>item!==color)].slice(0,RECENT_MAX);
    try{root.localStorage?.setItem(RECENT_KEY,JSON.stringify(next));}catch{}
    return next;
  }

  // Open palettes only: PANTONE data is licensed and is not bundled. Extra libraries may be supplied as root.ColorLibraries.
  const CSS_NAMES='aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(' ');
  const toTitle=name=>name.replace(/(^|\s)\S/g,c=>c.toUpperCase());
  let cssLibrary=null;
  function cssNamedColors(){
    if(cssLibrary)return cssLibrary;
    if(typeof document==='undefined')return [];
    const ctx=document.createElement('canvas').getContext('2d');if(!ctx)return [];
    const list=[],seen=new Set();
    for(const name of CSS_NAMES){ctx.fillStyle='#000';ctx.fillStyle=name;const hex=normalise(ctx.fillStyle);if(hex&&!seen.has(hex)){seen.add(hex);list.push({name:toTitle(name),hex});}}
    return cssLibrary=list;
  }
  function libraries(){
    const extra=root.ColorLibraries&&typeof root.ColorLibraries==='object'?root.ColorLibraries:{};
    return {'CSS Named Colors':cssNamedColors(),...extra};
  }
  function filterLibrary(list,query){const q=String(query||'').trim().toLowerCase();return q?list.filter(item=>item.name.toLowerCase().includes(q)):list;}

  let current=null;
  function close(){if(!current)return;const {panel,off,anchor}=current;current=null;off();panel.remove();anchor?.setAttribute('aria-expanded','false');}

  /**
   * opts: {value, allowNone, noneLabel, onPick(hex), onNone()}
   * A pick is final (the panel closes) so callers can treat each as one undoable edit.
   */
  function open(anchor,opts={}){
    close();
    const doc=anchor.ownerDocument,panel=doc.createElement('div');
    panel.className='color-picker-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Color picker');
    const finish=fn=>{close();fn();};
    const pick=hex=>{const color=normalise(hex);if(!color)return;rememberColor(color);finish(()=>opts.onPick?.(color));};

    const tabs=doc.createElement('div');tabs.className='cp-tabs';tabs.setAttribute('role','tablist');
    const tabNames=[['standard','STANDARD'],['pantone','PALETTES']],tabButtons={};
    const top=doc.createElement('div');top.className='cp-top';
    const none=doc.createElement('button');none.type='button';none.className='cp-none';none.textContent=opts.noneLabel||'None';
    none.hidden=opts.allowNone===false;none.onclick=()=>finish(()=>opts.onNone?.());
    const recent=doc.createElement('div');recent.className='cp-recent';
    recent.replaceChildren(...recentColors().slice(0,3).map(color=>{const b=doc.createElement('button');b.type='button';b.className='cp-swatch';b.style.background=color;b.title=color;b.setAttribute('aria-label','Recent color '+color);b.onclick=()=>pick(color);return b;}));
    const eye=doc.createElement('button');eye.type='button';eye.className='cp-eyedropper';eye.title='Pick color from screen';eye.setAttribute('aria-label','Pick color from screen');
    eye.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 4 6 6M4 20l1-4 9-9 3 3-9 9-4 1Z"/></svg>';
    eye.hidden=typeof root.EyeDropper!=='function';
    eye.onclick=async()=>{try{const result=await new root.EyeDropper().open();pick(result.sRGBHex);}catch{/* cancelled */}};
    top.append(none,recent,eye);

    const body=doc.createElement('div');body.className='cp-body';
    const standard=doc.createElement('div');standard.className='cp-standard';
    const cell=21,cells=wheelCells(),halfW=Math.sqrt(3)*RADIUS*cell+cell,halfH=1.5*RADIUS*cell+cell,svgNS='http://www.w3.org/2000/svg';
    const svg=doc.createElementNS(svgNS,'svg');svg.setAttribute('viewBox',`${-halfW} ${-halfH} ${halfW*2} ${halfH*2}`);svg.setAttribute('width','236');svg.setAttribute('height',String(Math.round(236*halfH/halfW)));svg.setAttribute('role','group');svg.setAttribute('aria-label','Standard colors');
    const hexPoints=(cx,cy,r)=>[0,1,2,3,4,5].map(i=>{const a=Math.PI/180*(60*i-30);return (cx+r*Math.cos(a)).toFixed(2)+','+(cy+r*Math.sin(a)).toFixed(2);}).join(' ');
    const makeHex=(target,cx,cy,r,color,label)=>{
      const p=doc.createElementNS(svgNS,'polygon');p.setAttribute('points',hexPoints(cx,cy,r));p.setAttribute('fill',color);p.setAttribute('class','cp-hex');
      p.setAttribute('role','button');p.setAttribute('tabindex','0');p.setAttribute('aria-label',label+' '+color);p.dataset.color=color;
      p.addEventListener('click',()=>pick(color));
      p.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();pick(color);}});
      target.append(p);return p;
    };
    const selected=normalise(opts.value);
    for(const c of cells)makeHex(svg,c.x*cell,c.y*cell,cell*.97,c.color,'Color');
    standard.append(svg);
    const gsvg=doc.createElementNS(svgNS,'svg');gsvg.setAttribute('viewBox','0 0 230 56');gsvg.setAttribute('width','230');gsvg.setAttribute('height','56');gsvg.setAttribute('role','group');gsvg.setAttribute('aria-label','Grays');
    greyCells().forEach((color,i)=>{const row=i<8?0:1,col=row?i-8:i;makeHex(gsvg,row?30+col*28:16+col*28,row?38:14,14,color,'Gray');});
    standard.append(gsvg);
    const more=doc.createElement('button');more.type='button';more.className='cp-link';more.textContent='More colors…';
    const custom=doc.createElement('div');custom.className='cp-custom';custom.hidden=true;
    {
      const start=normalise(opts.value)||'#ff0000';
      let [h,sat,val]=rgbToHsv(parseInt(start.slice(1,3),16),parseInt(start.slice(3,5),16),parseInt(start.slice(5,7),16));
      const area=doc.createElement('canvas');area.className='cp-sv';area.width=236;area.height=130;area.setAttribute('aria-label','Saturation and brightness');
      const hue=doc.createElement('input');hue.type='range';hue.min='0';hue.max='359';hue.className='cp-hue';hue.setAttribute('aria-label','Hue');
      const row=doc.createElement('div');row.className='cp-rgb';
      const preview=doc.createElement('span');preview.className='cp-preview';
      const mk=(label)=>{const l=doc.createElement('label');const i=doc.createElement('input');i.type='number';i.min='0';i.max='255';i.setAttribute('aria-label',label);l.append(i,label);row.append(l);return i;};
      const rIn=mk('R'),gIn=mk('G'),bIn=mk('B');
      const hexIn=doc.createElement('input');hexIn.type='text';hexIn.className='cp-hex-input';hexIn.maxLength=7;hexIn.setAttribute('aria-label','Hex color');
      const ok=doc.createElement('button');ok.type='button';ok.className='cp-ok';ok.textContent='OK';
      const back=doc.createElement('button');back.type='button';back.className='cp-back';back.textContent='Back';
      const buttons=doc.createElement('div');buttons.className='cp-buttons';buttons.append(back,ok);
      const current=()=>hsvToRgb(h,sat,val);
      const paintArea=()=>{
        const ctx=area.getContext('2d');if(!ctx)return;
        const w=area.width,hh=area.height,base=hsvToRgb(h,1,1);
        ctx.fillStyle='rgb('+base.join(',')+')';ctx.fillRect(0,0,w,hh);
        const white=ctx.createLinearGradient(0,0,w,0);white.addColorStop(0,'#fff');white.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=white;ctx.fillRect(0,0,w,hh);
        const black=ctx.createLinearGradient(0,0,0,hh);black.addColorStop(0,'rgba(0,0,0,0)');black.addColorStop(1,'#000');ctx.fillStyle=black;ctx.fillRect(0,0,w,hh);
        const x=sat*w,y=(1-val)*hh;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x,y,7.5,0,Math.PI*2);ctx.strokeStyle='#0008';ctx.lineWidth=1;ctx.stroke();
      };
      const refresh=(skip)=>{
        const [r,g,bl]=current();preview.style.background=rgbToHex(r,g,bl);hue.value=String(Math.round(h)%360);paintArea();
        if(skip!=='rgb'){rIn.value=r;gIn.value=g;bIn.value=bl;}if(skip!=='hex')hexIn.value=rgbToHex(r,g,bl);
      };
      const fromArea=event=>{const rect=area.getBoundingClientRect();sat=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));val=1-Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));refresh();};
      area.addEventListener('pointerdown',event=>{area.setPointerCapture?.(event.pointerId);fromArea(event);const move=e=>fromArea(e),up=()=>{area.removeEventListener('pointermove',move);area.removeEventListener('pointerup',up);};area.addEventListener('pointermove',move);area.addEventListener('pointerup',up);});
      hue.addEventListener('input',()=>{h=Number(hue.value);refresh();});
      const fromRgb=()=>{const clamp=i=>Math.max(0,Math.min(255,Math.round(Number(i.value)||0)));[h,sat,val]=rgbToHsv(clamp(rIn),clamp(gIn),clamp(bIn));if(sat===0)h=Number(hue.value)||0;refresh('rgb');};
      for(const i of [rIn,gIn,bIn])i.addEventListener('input',fromRgb);
      hexIn.addEventListener('input',()=>{const hex=normalise(hexIn.value);if(!hex)return;[h,sat,val]=rgbToHsv(parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16));refresh('hex');});
      ok.onclick=()=>{const [r,g,bl]=current();pick(rgbToHex(r,g,bl));};
      back.onclick=()=>{custom.hidden=true;standard.hidden=false;};
      const hexRow=doc.createElement('div');hexRow.className='cp-hexrow';hexRow.append(preview,hexIn);
      custom.append(area,hue,row,hexRow,buttons);
      more.onclick=()=>{standard.hidden=true;custom.hidden=false;refresh();rIn.focus();};
    }
    const gradient=doc.createElement('button');gradient.type='button';gradient.className='cp-link';gradient.textContent='Gradient, Pattern, or Texture...';gradient.disabled=true;gradient.title='Not supported in Q LABEL yet';
    standard.append(more,gradient);

    const pantone=doc.createElement('div');pantone.className='cp-pantone';pantone.hidden=true;
    const search=doc.createElement('input');search.type='search';search.placeholder='Search for color';search.setAttribute('aria-label','Search for color');
    const lib=doc.createElement('select');lib.setAttribute('aria-label','Color library');
    const list=doc.createElement('div');list.className='cp-list';list.setAttribute('role','listbox');
    const names=Object.keys(libraries());
    // Without installed data the library chooser and search have nothing to act on.
    search.hidden=lib.hidden=!names.length;list.classList.toggle('cp-empty',!names.length);
    for(const name of names){const o=doc.createElement('option');o.value=name;o.textContent=name;lib.append(o);}
    const drawList=()=>{
      list.replaceChildren();
      if(!names.length){const note=doc.createElement('p');note.className='cp-note';note.textContent='No color palettes are available.';list.append(note);return;}
      for(const item of filterLibrary(libraries()[lib.value]||[],search.value)){
        const b=doc.createElement('button');b.type='button';b.setAttribute('role','option');b.title=item.name;
        const sw=doc.createElement('span');sw.className='cp-swatch';sw.style.background=item.hex;
        b.append(sw,item.name);b.onclick=()=>pick(item.hex);list.append(b);
      }
    };
    search.oninput=drawList;lib.onchange=drawList;drawList();
    pantone.append(search,lib,list);
    body.append(standard,custom,pantone);

    const select=name=>{standard.hidden=name!=='standard';custom.hidden=true;pantone.hidden=name!=='pantone';for(const [key,button] of Object.entries(tabButtons))button.setAttribute('aria-selected',String(key===name));};
    for(const [key,label] of tabNames){const b=doc.createElement('button');b.type='button';b.setAttribute('role','tab');b.textContent=label;b.onclick=()=>select(key);tabButtons[key]=b;tabs.append(b);}
    select('standard');
    panel.append(tabs,top,body);

    const rect=anchor.getBoundingClientRect();
    panel.style.left=Math.max(4,Math.min(rect.left,doc.defaultView.innerWidth-300))+'px';
    panel.style.top=Math.max(4,Math.min(rect.bottom+2,doc.defaultView.innerHeight-470))+'px';
    const down=event=>{if(!panel.contains(event.target)&&!anchor.contains(event.target))close();};
    const key=event=>{if(event.key==='Escape'){event.preventDefault();close();anchor.focus?.();}};
    doc.addEventListener('pointerdown',down,true);doc.addEventListener('keydown',key,true);
    const off=()=>{doc.removeEventListener('pointerdown',down,true);doc.removeEventListener('keydown',key,true);};
    doc.body.append(panel);
    if(root.FloatingMenuTopLayer)root.FloatingMenuTopLayer.show(panel);
    const fit=()=>{const height=panel.offsetHeight||470;panel.style.top=Math.max(4,Math.min(rect.bottom+2,doc.defaultView.innerHeight-height-4))+'px';};
    fit();
    anchor.setAttribute('aria-expanded','true');
    current={panel,off,anchor};
    return panel;
  }

  const css='.color-picker-panel{inset:auto;margin:0;position:fixed;z-index:3300;width:268px;border:1px solid var(--border,#b8c2cc);background:var(--card,#fff);color:var(--text,#111);box-shadow:0 8px 24px #0004;font:12px "Segoe UI",sans-serif}'
  +'.color-picker-panel[hidden]{display:none}'
  +'.cp-tabs{display:flex;background:#0b84b8}.cp-tabs button{flex:1;padding:9px 8px;border:0;background:transparent;color:#fff;font:700 13px "Segoe UI",sans-serif;cursor:pointer}.cp-tabs button[aria-selected=true]{background:#4aa6c9}'
  +'.cp-top{display:flex;align-items:center;gap:8px;padding:8px}.color-picker-panel button.cp-none{min-height:0;padding:5px 18px;border:1px solid #2f8fd6;border-radius:3px;background:#d8ecfb;color:#1b2430;cursor:pointer;display:inline-block}.color-picker-panel button{box-shadow:none}.cp-pantone select:focus,.cp-pantone input:focus{outline:1px solid #2f8fd6;border-color:#2f8fd6}.cp-none[hidden],.cp-eyedropper[hidden]{display:none}'
  +'.cp-recent{display:flex;gap:4px;flex:1}.cp-swatch{display:inline-block;width:14px;height:14px;border:1px solid #6b7785;padding:0;cursor:pointer;flex:none}'
  +'.cp-eyedropper{margin-left:auto;border:1px solid var(--border,#b8c2cc);background:var(--card,#fff);color:inherit;padding:3px;cursor:pointer}'
  +'.cp-body{padding:0 8px 8px}.cp-standard[hidden],.cp-pantone[hidden],.cp-custom[hidden]{display:none}.cp-sv{display:block;width:236px;height:130px;cursor:crosshair;touch-action:none}.cp-hue{width:236px;margin:8px 0}.cp-rgb{display:flex;gap:6px}.cp-rgb label{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px}.cp-rgb input{width:60px;box-sizing:border-box;padding:4px;text-align:center}.cp-hexrow{display:flex;align-items:center;gap:8px;margin:8px 0}.cp-preview{width:28px;height:28px;border:1px solid #6b7785;border-radius:50%}.cp-hex-input{flex:1;padding:4px;box-sizing:border-box}.cp-buttons{display:flex;justify-content:flex-end;gap:8px}.cp-buttons button{padding:5px 18px;border:1px solid var(--border,#b8c2cc);background:var(--card,#fff);color:inherit;cursor:pointer}.cp-buttons .cp-ok{background:#2f8fd6;border-color:#2f8fd6;color:#fff}'
  +'.cp-hex{stroke:transparent;stroke-width:1;cursor:pointer}.cp-hex:hover,.cp-hex:focus-visible{stroke:#0a64c8;stroke-width:2;outline:0}'
  +'.cp-link{display:block;margin:4px 0 0;padding:2px;border:0;background:transparent;color:#1a3cc8;font:12px "Segoe UI",sans-serif;cursor:pointer;text-align:left}.cp-link:disabled{color:#8a96a3;cursor:default}'
  +'.cp-pantone input,.cp-pantone select{box-sizing:border-box;width:100%;margin-bottom:6px;padding:5px;border:1px solid var(--border,#b8c2cc)}'
  +'.cp-list{height:250px;overflow:auto;border:1px solid var(--border,#b8c2cc)}.cp-list button{display:flex;align-items:center;gap:8px;width:100%;padding:5px 6px;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.cp-list button:hover{background:#e8ecef}.cp-list.cp-empty{height:auto;min-height:60px}.cp-note{margin:10px;color:#667}';
  if(typeof document!=='undefined'){const style=document.createElement('style');style.textContent=css;document.head.append(style);}
  return {hsvToRgb,rgbToHsv,rgbToHex,hslToHex,wheelCells,greyCells,normalise,recentColors,rememberColor,filterLibrary,open,close};
});
