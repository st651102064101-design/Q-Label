(function(){
  'use strict';
  const xml=new DOMParser().parseFromString(window.ShapeDefinitionXml,'application/xml');
  const definitions=[...xml.documentElement.children],byName=new Map(definitions.map(n=>[n.localName,n]));
  const children=(n,name)=>[...n.children].filter(c=>c.localName===name);
  const angle=Math.PI/10800000;
  const cache=new Map();
  function paths(name){
    if(cache.has(name))return cache.get(name);
    const node=byName.get(name);if(!node)throw Error('Unknown shape: '+name);
    const v={w:21600,h:21600,l:0,t:0,r:21600,b:21600,hc:10800,vc:10800,ss:21600,ls:21600};
    const value=s=>{if(s in v)return v[s];if(/^[-+]?\d+(\.\d+)?$/.test(s))return Number(s);let m;if((m=/^(w|h|ss)d(\d+)$/.exec(s)))return v[m[1]]/Number(m[2]);if((m=/^(\d*)cd(\d+)$/.exec(s)))return (Number(m[1])||1)*21600000/Number(m[2]);throw Error('Unknown geometry value: '+s);};
    function formula(f){const [op,...args]=f.trim().split(/\s+/),[a,b,c]=args.map(value);switch(op){case 'val':return a;case '*/':return b*a/(c||1);case '+-':return a+b-c;case '+/':return (a+b)/(c||1);case '?:':return a>0?b:c;case 'abs':return Math.abs(a);case 'sqrt':return Math.sqrt(Math.max(0,a));case 'min':return Math.min(a,b);case 'max':return Math.max(a,b);case 'pin':return Math.max(a,Math.min(b,c));case 'mod':return Math.hypot(a,b,c);case 'at2':return Math.atan2(b,a)/angle;case 'sin':return a*Math.sin(b*angle);case 'cos':return a*Math.cos(b*angle);case 'tan':return a*Math.tan(b*angle);case 'cat2':return a*Math.cos(Math.atan2(c,b));case 'sat2':return a*Math.sin(Math.atan2(c,b));default:throw Error('Unknown formula: '+op);}}
    for(const list of [...children(node,'avLst'),...children(node,'gdLst')])for(const gd of list.children)v[gd.getAttribute('name')]=formula(gd.getAttribute('fmla'));
    const result=[];
    for(const list of children(node,'pathLst'))for(const p of list.children){
      let d='',x=0,y=0;const point=n=>[value(n.getAttribute('x')),value(n.getAttribute('y'))];
      for(const cmd of p.children){const pts=[...cmd.children].map(point);switch(cmd.localName){
        case 'moveTo':[x,y]=pts[0];d+=`M${x} ${y} `;break;
        case 'lnTo':[x,y]=pts[0];d+=`L${x} ${y} `;break;
        case 'quadBezTo':d+='Q'+pts.flat().join(' ')+' ';[x,y]=pts[1];break;
        case 'cubicBezTo':d+='C'+pts.flat().join(' ')+' ';[x,y]=pts[2];break;
        case 'close':d+='Z ';break;
        case 'arcTo':{
          const rx=Math.abs(value(cmd.getAttribute('wR'))),ry=Math.abs(value(cmd.getAttribute('hR'))),start=value(cmd.getAttribute('stAng'))*angle,sweep=value(cmd.getAttribute('swAng'))*angle;
          const offset=a=>{const q=Math.atan2(rx*Math.sin(a),ry*Math.cos(a));return [rx*Math.cos(q),ry*Math.sin(q)];};
          const initial=offset(start),cx=x-initial[0],cy=y-initial[1],steps=Math.max(1,Math.ceil(Math.abs(sweep)/Math.PI));
          for(let i=1;i<=steps;i++){const q=offset(start+sweep*i/steps);x=cx+q[0];y=cy+q[1];d+=`A${rx} ${ry} 0 0 ${sweep>=0?1:0} ${x} ${y} `;}break;
        }
      }}
      if(/NaN|Infinity/.test(d))throw Error('Invalid geometry: '+name);
      result.push({d,w:Number(p.getAttribute('w'))||21600,h:Number(p.getAttribute('h'))||21600,fill:p.getAttribute('fill')!=='none',stroke:p.getAttribute('stroke')!=='false'});
    }
    const probe=document.createElementNS('http://www.w3.org/2000/svg','svg');probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none';document.body.append(probe);
    let left=0,top=0,right=21600,bottom=21600;
    for(const p of result){const n=document.createElementNS(probe.namespaceURI,'path');n.setAttribute('d',p.d);probe.append(n);const b=n.getBBox(),sx=21600/p.w,sy=21600/p.h;left=Math.min(left,b.x*sx);top=Math.min(top,b.y*sy);right=Math.max(right,(b.x+b.width)*sx);bottom=Math.max(bottom,(b.y+b.height)*sy);}
    probe.remove();result.bounds={x:left,y:top,w:right-left,h:bottom-top};
    cache.set(name,result);return result;
  }
  function render(e,x=0,y=0){const w=Number(e.width_mm)||20,h=Number(e.height_mm)||15,t=Number(e.thickness_mm)||.3,fill=e.fill_color||'none',stroke=e.stroke_color||'#111111';return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${paths(e.shape_preset).bounds.x} ${paths(e.shape_preset).bounds.y} ${paths(e.shape_preset).bounds.w} ${paths(e.shape_preset).bounds.h}" preserveAspectRatio="none" overflow="visible">`+paths(e.shape_preset).map(p=>`<path d="${p.d}" transform="scale(${21600/p.w} ${21600/p.h})" fill="${p.fill?fill:'none'}" stroke="${p.stroke&&e.line_style!=='erase'?stroke:'none'}" stroke-width="${t*p.w/w}" stroke-linejoin="round"${e.line_style==='dash'?` stroke-dasharray="${t*p.w/w*4} ${t*p.w/w*2}"`:e.line_style==='dot'?` stroke-dasharray="${t*p.w/w} ${t*p.w/w*2}"`:''}/>`).join('')+'</svg>';}
  function bake(e,dpi=203){
    const signature=JSON.stringify([e.shape_preset,e.width_mm,e.height_mm,e.fill_color,e.stroke_color,e.thickness_mm,e.line_style,dpi]);if(e.shape_baked===signature)return;
    const width=Math.max(1,Math.ceil(e.width_mm*dpi/25.4)),height=Math.max(1,Math.ceil(e.height_mm*dpi/25.4)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
    const geometry=paths(e.shape_preset),bounds=geometry.bounds;
    for(const p of geometry){ctx.save();ctx.scale(width/bounds.w,height/bounds.h);ctx.translate(-bounds.x,-bounds.y);ctx.scale(21600/p.w,21600/p.h);ctx.lineJoin='round';ctx.lineWidth=(Number(e.thickness_mm)||.3)*p.w/e.width_mm*bounds.w/21600;ctx.strokeStyle=e.stroke_color||'#111';ctx.fillStyle=e.fill_color==='none'?'#fff':e.fill_color||'#fff';if(e.line_style==='dash')ctx.setLineDash([ctx.lineWidth*4,ctx.lineWidth*2]);if(e.line_style==='dot')ctx.setLineDash([ctx.lineWidth,ctx.lineWidth*2]);const path=new Path2D(p.d);if(p.fill&&e.fill_color&&e.fill_color!=='none')ctx.fill(path);if(p.stroke&&e.line_style!=='erase')ctx.stroke(path);ctx.restore();}
    const pixels=ctx.getImageData(0,0,width,height).data,bytes=new Uint8Array(Math.ceil(width/8)*height);for(let j=0;j<height;j++)for(let i=0;i<width;i++){const q=(j*width+i)*4;if(pixels[q]*.299+pixels[q+1]*.587+pixels[q+2]*.114<200)bytes[j*Math.ceil(width/8)+(i>>3)]|=0x80>>(i&7);}
    Object.assign(e,{bitmap_width:width,bitmap_height:height,bitmap_hex:Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''),shape_baked:signature});
  }
  window.ShapeTools={render,bake,paths,names:[...byName.keys()]};
  function insertShape(name,point=null){
    if(!editing){alert('Open a label first.');return;}
    readEditorIntoDraft();pushSnapshot();
    const e={type:'image',shape_preset:name,width_mm:20,height_mm:15,x_mm:0,y_mm:0,thickness_mm:.3,stroke_color:'#111111',fill_color:'none',transparent_background:true};
    window.ObjectNames?.assign(e,editing.elements);
    bake(e,editing.dpi||203);
    if(point){const margin=editing.margin_mm||{};e.x_mm=snapVal(point.x-(Number(margin.left)||0)-e.width_mm/2);e.y_mm=snapVal(point.y-(Number(margin.top)||0)-e.height_mm/2);}
    else placeNewElementAtBottom(e);
    editing.elements.push(e);window.noteRecentObjectUsage?.(e);editorSel=editing.elements.length-1;editorSelection=new Set([editorSel]);renderEditorElements();drawEditorCanvas();touchEditor();void persistEditor();
  }
  window.insertShapeAt=insertShape;
  const group=name=>/flowChart/.test(name)?'Flowchart':/Callout/.test(name)?'Callouts':/star|ribbon|scroll|wave|seal/i.test(name)?'Stars and Banners':/Arrow/.test(name)?'Block Arrows':/math/.test(name)?'Equation Shapes':/rect/i.test(name)?'Rectangles':/line|Connector/i.test(name)?'Lines':/arc|pie|chord/i.test(name)?'Arcs':'Basic Shapes';
  const host=document.getElementById('ribbon-insert');if(!host)return;
  const groupHost=document.createElement('div');groupHost.className='ribbon-group';groupHost.innerHTML='<div class="ribbon-items"></div><div class="ribbon-group-label">Shapes</div>';host.append(groupHost);const button=document.createElement('button');button.type='button';button.className='ribbon-command ribbon-has-dropdown shape-insert-command';button.title='Insert Shapes';button.setAttribute('aria-label','Insert Shapes');button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="3" width="10" height="10"/><circle cx="16" cy="15" r="6"/></svg><span class="ribbon-caption">Shapes</span><span class="shape-dropdown-arrow" aria-hidden="true">▾</span>';groupHost.querySelector('.ribbon-items').append(button);
  const dialog=document.createElement('dialog');dialog.className='shape-picker';dialog.innerHTML='<header><strong>Shapes</strong><button type="button" aria-label="Close">×</button></header><input type="search" placeholder="Search shapes…" aria-label="Search shapes"><main></main>';document.body.append(dialog);
  let compiled=[];for(const name of byName.keys()){try{paths(name);compiled.push(name);}catch(error){console.error('Shape geometry',name,error);}}
  function show(){const main=dialog.querySelector('main'),search=dialog.querySelector('input').value.toLowerCase();main.replaceChildren();for(const category of ['Lines','Rectangles','Basic Shapes','Block Arrows','Arcs','Equation Shapes','Flowchart','Stars and Banners','Callouts']){const names=compiled.filter(n=>group(n)===category&&n.toLowerCase().includes(search));if(!names.length)continue;const section=document.createElement('section'),h=document.createElement('h3'),grid=document.createElement('div');h.textContent=category;grid.className='shape-grid';section.append(h,grid);for(const name of names){const b=document.createElement('button');b.type='button';b.draggable=true;b.className='shape-preset-choice';b.dataset.shapePreset=name;const label=name.replace(/([a-z])([A-Z0-9])/g,'$1 $2').replace(/^./,s=>s.toUpperCase());b.title='Drag '+label+' onto the label';b.setAttribute('aria-label',label);b.innerHTML='<svg viewBox="-3 -3 26 26">'+render({shape_preset:name,width_mm:20,height_mm:20,thickness_mm:.6},0,0)+'</svg>';b.onclick=()=>{insertShape(name);dialog.close();};b.ondragstart=()=>{setTimeout(()=>dialog.close(),0);};grid.append(b);}main.append(section);}}
  button.onclick=()=>{show();dialog.showModal();};dialog.querySelector('header button').onclick=()=>dialog.close();dialog.querySelector('input').oninput=show;
  const style=document.createElement('style');style.textContent='.shape-insert-command{gap:1px!important}.shape-insert-command .shape-dropdown-arrow{font-size:9px;line-height:9px;margin-top:-2px}.shape-picker{width:550px;max-width:95vw;max-height:85vh;background:var(--card,#fff);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:12px}.shape-picker header{display:flex;justify-content:space-between}.shape-picker input{width:100%;margin:10px 0}.shape-picker main{overflow:auto;max-height:65vh}.shape-picker h3{font-size:13px;margin:10px 0 5px}.shape-grid{display:grid;grid-template-columns:repeat(auto-fill,38px);gap:3px}.shape-grid button{width:38px;height:38px;padding:4px;background:var(--card,#fff);border:1px solid var(--border);border-radius:3px;cursor:grab}.shape-grid button:active{cursor:grabbing}.shape-grid button:hover{background:#dcfce7}.shape-grid svg{width:100%;height:100%}';document.head.append(style);
})();

