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
  const esc=text=>String(text).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  /** Colour swatch icon (SVG) for list rows. */
  const swatchSvg=hex=>'<svg class="cp-icon cp-swatch-svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="1" y="1" width="14" height="14" rx="2" fill="'+esc(hex)+'" stroke="#6b7785" stroke-width="1"/></svg>';
  /** Five-colour strip sampled evenly from a palette, used as that palette's icon. */
  function stripSvg(list){
    const picks=list.length?Array.from({length:5},(_,i)=>list[Math.min(list.length-1,Math.floor(i*list.length/5))].hex):[];
    return '<svg class="cp-icon cp-strip" viewBox="0 0 30 16" width="30" height="16" aria-hidden="true">'+picks.map((hex,i)=>'<rect x="'+(i*6)+'" y="1" width="6" height="14" fill="'+esc(hex)+'"/>').join('')+'<rect x=".5" y="1" width="29" height="14" rx="2" fill="none" stroke="#6b7785"/></svg>';
  }
  const ICONS={
    standard:'<svg class="cp-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#ffc94a" stroke="#fff" stroke-width="1.4"/><polygon points="12,7 16,9.5 16,14.5 12,17 8,14.5 8,9.5" fill="#e0457b"/></svg>',
    palettes:'<svg class="cp-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.4-2.1-.6-1.2.1-2.4 1.5-2.4H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" fill="#fff" stroke="#fff" stroke-width="1"/><circle cx="7.5" cy="11" r="1.6" fill="#e0457b"/><circle cx="10.5" cy="7" r="1.6" fill="#ffc94a"/><circle cx="15.5" cy="7.5" r="1.6" fill="#2fae66"/></svg>',
    none:'<svg class="cp-icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect x="2.5" y="2.5" width="15" height="15" rx="2" fill="#fff" stroke="#475569" stroke-width="1.4"/><path d="M5 15 15 5" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>',
    more:'<svg class="cp-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#fff" stroke="#6b7785"/><path d="M12 12 12 3a9 9 0 0 1 7.8 4.5z" fill="#e0457b"/><path d="M12 12 19.8 7.5A9 9 0 0 1 16.5 19.8z" fill="#ffc94a"/><path d="M12 12 16.5 19.8A9 9 0 0 1 4.2 16.5z" fill="#2fae66"/><path d="M12 12 4.2 16.5A9 9 0 0 1 12 3z" fill="#2f8fd6"/></svg>',
    gradient:'<svg class="cp-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><defs><linearGradient id="cpg" x1="0" x2="1"><stop offset="0" stop-color="#2f8fd6"/><stop offset="1" stop-color="#e0457b"/></linearGradient></defs><rect x="3" y="5" width="18" height="14" rx="2" fill="url(#cpg)" stroke="#6b7785"/></svg>',
    search:'<svg class="cp-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="#6b7785" stroke-width="2"/><path d="m15 15 6 6" stroke="#6b7785" stroke-width="2" stroke-linecap="round"/></svg>'
  };
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
  // Original Q LABEL palettes (generated here, not copied from any colour-matching system).
  const HUES=[['Red',0],['Orange',28],['Yellow',52],['Lime',85],['Green',130],['Teal',172],['Cyan',190],['Blue',220],['Indigo',250],['Violet',275],['Magenta',310],['Pink',335]];
  const generated=(tones)=>HUES.flatMap(([name,hue])=>tones.map(([label,sat,light])=>({name:name+(label?' '+label:''),hex:hslToHex(hue,sat,light)})));
  const FIXED={
    'Metallics':[['Gold','#d4af37'],['Pale Gold','#e6c97a'],['Silver','#c0c0c0'],['Platinum','#e5e4e2'],['Bronze','#cd7f32'],['Copper','#b87333'],['Rose Gold','#d9a38f'],['Steel','#8a96a3'],['Gunmetal','#53575c'],['Brass','#b5a642']],
    'Paper':[['Bright White','#ffffff'],['Natural White','#f6f2e8'],['Cream','#f3ead2'],['Ivory','#fffff0'],['Kraft','#c8a679'],['Light Kraft','#d9bf96'],['Recycled Grey','#b9b6ad'],['Newsprint','#e4e0d4'],['Parchment','#efe3c2'],['Blush','#f3dcd4']],
    'Cotton':[['Natural','#ece4d3'],['Oatmeal','#d8cfba'],['Sand','#c9b896'],['Stone','#a8a08f'],['Charcoal','#4a4a48'],['Denim','#4a6a8a'],['Indigo Dye','#2f3f6b'],['Sage','#9aa98b'],['Terracotta','#b9694c'],['Rose','#d4a5a0']]
  };
  const BUILT_IN={
    'Solid Colors':()=>generated([['Light',.75,.7],['',.8,.5],['Dark',.8,.3]]),
    'Pastels & Neons':()=>[...generated([['Pastel',.7,.85]]),...generated([['Neon',1,.55]])],
    'Metallics':()=>FIXED['Metallics'].map(([name,hex])=>({name,hex})),
    'Paper':()=>FIXED['Paper'].map(([name,hex])=>({name,hex})),
    'Cotton':()=>FIXED['Cotton'].map(([name,hex])=>({name,hex})),
    'Bright Colors':()=>generated([['',1,.5]])
  };
  const builtInCache={};
  const builtIn=name=>builtInCache[name]||(builtInCache[name]=BUILT_IN[name]());
  function libraries(){
    const extra=root.ColorLibraries&&typeof root.ColorLibraries==='object'?root.ColorLibraries:{};
    const built=Object.fromEntries(Object.keys(BUILT_IN).map(name=>[name,builtIn(name)]));
    return {...built,'CSS Named Colors':cssNamedColors(),...extra};
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
    const none=doc.createElement('button');none.type='button';none.className='cp-none';none.innerHTML=ICONS.none+'<span>'+esc(opts.noneLabel||'None')+'</span>';
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
    const more=doc.createElement('button');more.type='button';more.className='cp-link';more.innerHTML=ICONS.more+'<span>More colors…</span>';
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
    const gradient=doc.createElement('button');gradient.type='button';gradient.className='cp-link';gradient.innerHTML=ICONS.gradient+'<span>Gradient, Pattern, or Texture...</span>';gradient.disabled=true;gradient.title='Not supported in Q LABEL yet';
    standard.append(more,gradient);

    const pantone=doc.createElement('div');pantone.className='cp-pantone';pantone.hidden=true;
    const search=doc.createElement('input');search.type='search';search.placeholder='Search for color';search.setAttribute('aria-label','Search for color');
    const searchWrap=doc.createElement('label');searchWrap.className='cp-search';searchWrap.insertAdjacentHTML('afterbegin',ICONS.search);searchWrap.append(search);
    const list=doc.createElement('div');list.className='cp-list';list.setAttribute('role','listbox');
    const names=Object.keys(libraries());
    let currentLib=names[0]||'';
    const libButton=doc.createElement('button');libButton.type='button';libButton.className='cp-lib';libButton.setAttribute('aria-label','Color library');libButton.setAttribute('aria-haspopup','listbox');libButton.setAttribute('aria-expanded','false');
    const libMenu=doc.createElement('div');libMenu.className='cp-libmenu';libMenu.setAttribute('role','listbox');libMenu.hidden=true;
    // Without palettes the library chooser and search have nothing to act on.
    searchWrap.hidden=libButton.hidden=!names.length;list.classList.toggle('cp-empty',!names.length);
    const drawLibButton=()=>{libButton.innerHTML=(currentLib?stripSvg(libraries()[currentLib]||[]):'')+'<span class="cp-lib-name">'+esc(currentLib)+'</span><span class="cp-lib-arrow" aria-hidden="true">▾</span>';};
    const drawList=()=>{
      list.replaceChildren();
      if(!names.length){const note=doc.createElement('p');note.className='cp-note';note.textContent='No color palettes are available.';list.append(note);return;}
      for(const item of filterLibrary(libraries()[currentLib]||[],search.value)){
        const b=doc.createElement('button');b.type='button';b.setAttribute('role','option');b.title=item.name+' '+item.hex;
        b.innerHTML=swatchSvg(item.hex)+'<span>'+esc(item.name)+'</span>';b.onclick=()=>pick(item.hex);list.append(b);
      }
    };
    const chooseLib=name=>{currentLib=name;libMenu.hidden=true;libButton.setAttribute('aria-expanded','false');drawLibButton();drawList();};
    for(const name of names){const o=doc.createElement('button');o.type='button';o.setAttribute('role','option');o.dataset.library=name;o.innerHTML=stripSvg(libraries()[name]||[])+'<span>'+esc(name)+'</span>';o.onclick=()=>chooseLib(name);libMenu.append(o);}
    libButton.onclick=()=>{libMenu.hidden=!libMenu.hidden;libButton.setAttribute('aria-expanded',String(!libMenu.hidden));for(const o of libMenu.children)o.setAttribute('aria-selected',String(o.dataset.library===currentLib));};
    search.oninput=drawList;drawLibButton();drawList();
    pantone.append(searchWrap,libButton,libMenu,list);
    body.append(standard,custom,pantone);

    const select=name=>{standard.hidden=name!=='standard';custom.hidden=true;pantone.hidden=name!=='pantone';for(const [key,button] of Object.entries(tabButtons))button.setAttribute('aria-selected',String(key===name));};
    for(const [key,label] of tabNames){const b=doc.createElement('button');b.type='button';b.setAttribute('role','tab');b.innerHTML=ICONS[key==='pantone'?'palettes':'standard']+'<span>'+esc(label)+'</span>';b.onclick=()=>select(key);tabButtons[key]=b;tabs.append(b);}
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
  +'.cp-tabs{display:flex;background:#0b84b8}.cp-tabs button{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 8px;border:0;background:transparent;color:#fff;font:700 13px "Segoe UI",sans-serif;cursor:pointer}.cp-tabs button[aria-selected=true]{background:#4aa6c9}'
  +'.cp-top{display:flex;align-items:center;gap:8px;padding:8px}.color-picker-panel button.cp-none{min-height:0;padding:5px 18px;border:1px solid #2f8fd6;border-radius:3px;background:#d8ecfb;color:#1b2430;cursor:pointer;display:inline-flex;align-items:center;gap:6px}.color-picker-panel button{box-shadow:none}.cp-pantone select:focus,.cp-pantone input:focus{outline:1px solid #2f8fd6;border-color:#2f8fd6}.cp-none[hidden],.cp-eyedropper[hidden]{display:none}'
  +'.cp-recent{display:flex;gap:4px;flex:1}.cp-swatch{display:inline-block;width:14px;height:14px;border:1px solid #6b7785;padding:0;cursor:pointer;flex:none}'
  +'.cp-eyedropper{margin-left:auto;border:1px solid var(--border,#b8c2cc);background:var(--card,#fff);color:inherit;padding:3px;cursor:pointer}'
  +'.cp-body{padding:0 8px 8px}.cp-standard[hidden],.cp-pantone[hidden],.cp-custom[hidden]{display:none}.cp-sv{display:block;width:236px;height:130px;cursor:crosshair;touch-action:none}.cp-hue{width:236px;margin:8px 0}.cp-rgb{display:flex;gap:6px}.cp-rgb label{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px}.cp-rgb input{width:60px;box-sizing:border-box;padding:4px;text-align:center}.cp-hexrow{display:flex;align-items:center;gap:8px;margin:8px 0}.cp-preview{width:28px;height:28px;border:1px solid #6b7785;border-radius:50%}.cp-hex-input{flex:1;padding:4px;box-sizing:border-box}.cp-buttons{display:flex;justify-content:flex-end;gap:8px}.cp-buttons button{padding:5px 18px;border:1px solid var(--border,#b8c2cc);background:var(--card,#fff);color:inherit;cursor:pointer}.cp-buttons .cp-ok{background:#2f8fd6;border-color:#2f8fd6;color:#fff}'
  +'.cp-hex{stroke:transparent;stroke-width:1;cursor:pointer}.cp-hex:hover,.cp-hex:focus-visible{stroke:#0a64c8;stroke-width:2;outline:0}'
  +'.cp-link{display:flex;align-items:center;gap:6px;margin:4px 0 0;padding:2px;border:0;background:transparent;color:#1a3cc8;font:12px "Segoe UI",sans-serif;cursor:pointer;text-align:left}.cp-link:disabled{color:#8a96a3;cursor:default}'
  +'.cp-pantone{position:relative}.cp-pantone input{box-sizing:border-box;width:100%;padding:5px;border:0;outline:0;background:transparent;color:inherit}.cp-pantone input:focus{outline:0}.cp-search{display:flex;align-items:center;gap:6px;margin-bottom:6px;padding:0 6px;border:1px solid var(--border,#b8c2cc)}.cp-search:focus-within{border-color:#2f8fd6}.color-picker-panel .cp-lib{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;margin-bottom:6px;padding:5px 8px;min-height:0;border:1px solid var(--border,#b8c2cc);border-radius:3px;background:var(--card,#fff);color:inherit;cursor:pointer;text-align:left}.cp-lib-name{flex:1}.cp-lib-arrow{font-size:10px}.cp-libmenu{position:absolute;left:0;right:0;top:66px;z-index:4;max-height:240px;overflow:auto;border:1px solid #2f8fd6;background:var(--card,#fff);box-shadow:0 6px 16px #0003}.cp-libmenu[hidden]{display:none}.color-picker-panel .cp-libmenu button{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;min-height:0;padding:5px 8px;border:0;border-radius:0;background:transparent;color:inherit;cursor:pointer;text-align:left}.cp-libmenu button:hover,.cp-libmenu button[aria-selected=true]{background:#2f8fd6;color:#fff}.cp-icon{flex:none;vertical-align:middle}'
  +'.cp-list{height:250px;overflow:auto;border:1px solid var(--border,#b8c2cc)}.cp-list button{display:flex;align-items:center;gap:8px;width:100%;padding:5px 6px;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.cp-list button:hover{background:#e8ecef}.cp-pantone select:focus,.cp-pantone input:focus{outline:0}.cp-list.cp-empty{height:auto;min-height:60px}.cp-note{margin:10px;color:#667}';
  if(typeof document!=='undefined'){const style=document.createElement('style');style.textContent=css;document.head.append(style);}
  return {swatchSvg,stripSvg,BUILT_IN_NAMES:Object.keys(BUILT_IN),builtIn,hsvToRgb,rgbToHsv,rgbToHex,hslToHex,wheelCells,greyCells,normalise,recentColors,rememberColor,filterLibrary,open,close};
});
