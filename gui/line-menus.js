(function(root){
  'use strict';
  const PT_PRESETS=[0.5,1,2,3,4,5,6,7,8,9,10,11,12,14,16,18,20,24];
  const ptLabel=pt=>pt.toFixed(1)+' pt';
  const mmToPt=mm=>mm*72/25.4,ptToMm=pt=>pt*25.4/72;
  let open=null;

  function close(){
    if(!open)return;
    const {menu,anchor,off}=open;open=null;
    off();menu.remove();anchor.setAttribute('aria-expanded','false');
  }

  /** Floating list under `anchor`. items: [{html|text,value,title,selected}]. */
  function show(anchor,items,{className='',onPick,width}={}){
    close();
    const doc=anchor.ownerDocument,menu=doc.createElement('div');
    menu.className='line-menu '+className;menu.setAttribute('role','listbox');
    const rect=anchor.getBoundingClientRect();
    menu.style.left=Math.max(4,Math.min(rect.left,doc.defaultView.innerWidth-(width||200)-8))+'px';
    menu.style.top=Math.min(rect.bottom+1,doc.defaultView.innerHeight-290)+'px';
    if(width)menu.style.minWidth=width+'px';
    let grid=null;
    for(const item of items){
      if(item.heading){grid=null;const h=doc.createElement('div');h.className='line-menu-heading';h.textContent=item.heading;menu.append(h);continue;}
      const b=doc.createElement('button');b.type='button';b.setAttribute('role','option');
      if(item.disabled){b.disabled=true;b.setAttribute('aria-disabled','true');}
      b.dataset.value=String(item.value);b.setAttribute('aria-selected',String(!!item.selected));
      if(item.title)b.title=item.title;
      if(item.html)b.innerHTML=item.html;else b.textContent=item.text;
      b.onclick=()=>{close();onPick(item.value);};
      if(item.grid){if(!grid){grid=doc.createElement('div');grid.className='line-menu-grid';menu.append(grid);}grid.append(b);}else{grid=null;menu.append(b);}
    }
    menu.onkeydown=event=>{
      const list=[...menu.querySelectorAll('button:not(:disabled)')],i=list.indexOf(doc.activeElement);
      if(event.key==='Escape'){event.preventDefault();close();anchor.focus();}
      else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();
        list[event.key==='Home'?0:event.key==='End'?list.length-1:(i+(event.key==='ArrowUp'?-1:1)+list.length)%list.length]?.focus();
      }
    };
    const down=event=>{if(!menu.contains(event.target)&&!anchor.contains(event.target))close();};
    doc.addEventListener('pointerdown',down,true);
    const off=()=>doc.removeEventListener('pointerdown',down,true);
    doc.body.append(menu);
    if(root.FloatingMenuTopLayer)root.FloatingMenuTopLayer.show(menu);
    anchor.setAttribute('aria-expanded','true');
    open={menu,anchor,off};
    (menu.querySelector('[aria-selected=true]')||menu.querySelector('button:not(:disabled)'))?.focus({preventScroll:false});
    menu.querySelector('[aria-selected=true]')?.scrollIntoView({block:'nearest'});
    return menu;
  }

  function dashSvg(array,erase){
    if(erase)return '<svg viewBox="0 0 120 12" width="120" height="12" aria-hidden="true"><path d="M4 6H116" stroke="#9aa4ad" stroke-width="1" stroke-dasharray="1 2"/></svg><span class="line-menu-caption">No line</span>';
    const scale=3.2,dash=array.length?` stroke-dasharray="${array.map(v=>v*scale).join(' ')}"`:'';
    return `<svg viewBox="0 0 120 12" width="120" height="12" aria-hidden="true"><path d="M2 6H118" fill="none" stroke="currentColor" stroke-width="${scale}"${dash}/></svg>`;
  }

  /** Dash/style picker. getIndex(): current menu index, onPick(index). */
  function dashPicker(dashes,getIndex,onPick){
    const doc=document,button=doc.createElement('button');
    button.type='button';button.className='line-dash-picker';
    button.setAttribute('aria-label','Line dash style');button.title='Dash Style\nSpecifies the line dash style of the selected object(s).';
    button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
    const refresh=()=>{const i=getIndex();button.innerHTML=dashSvg(i>0?dashes[i]:[],i===-1)+'<span class="line-menu-arrow" aria-hidden="true">▾</span>';};
    button.onclick=()=>{
      if(open?.anchor===button){close();return;}
      const current=getIndex();
      show(button,[...dashes.map((array,i)=>({value:i,html:dashSvg(array,false),title:i===0?'Solid':'Dash '+i,selected:i===current})),{value:-1,html:dashSvg([],true),title:'Erase (no line)',selected:current===-1}],{className:'line-dash-menu',width:150,onPick:value=>{onPick(value);refresh();}});
    };
    refresh();
    return {button,refresh};
  }

  /** Line-width presets in pt. getMm(): current width, onPick(mm). */
  function widthPicker(anchor,getMm,onPick,minMm=0){
    const button=anchor.ownerDocument.createElement('button');
    button.type='button';button.className='line-width-arrow';
    button.setAttribute('aria-label','Line width presets');button.title='Line width presets';
    button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
    button.textContent='▾';
    button.onclick=()=>{
      if(open?.anchor===button){close();return;}
      const current=Math.round(mmToPt(getMm())*10)/10;
      show(button,PT_PRESETS.map(pt=>({value:pt,text:ptLabel(pt),selected:Math.abs(pt-current)<.05})),{className:'line-width-menu',width:84,onPick:pt=>onPick(Math.max(minMm,ptToMm(pt)))});
    };
    return button;
  }

  function compoundSvg(profile){
    const unit=1.6,total=profile.reduce((a,v)=>a+v,0)*unit;let cursor=-total/2;
    return '<svg viewBox="0 0 120 12" width="120" height="12" aria-hidden="true">'+profile.map((ratio,index)=>{const y=6+cursor+ratio*unit/2;cursor+=ratio*unit;return index%2?'':'<path d="M2 '+y+'H118" fill="none" stroke="currentColor" stroke-width="'+ratio*unit+'"/>';}).join('')+'</svg>';
  }

  /** Compound-line picker. compounds: {key:[profile]}; getKey(): current key, onPick(key). */
  function compoundPicker(compounds,getKey,onPick){
    const doc=document,button=doc.createElement('button');
    button.type='button';button.className='line-dash-picker line-compound-picker';
    button.setAttribute('aria-label','Line style (compound)');button.title='Compound Style\nSpecifies the line compound style of the selected object(s).';
    button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
    const refresh=()=>{button.innerHTML=compoundSvg(compounds[getKey()]||[1])+'<span class="line-menu-arrow" aria-hidden="true">▾</span>';};
    button.onclick=()=>{
      if(open?.anchor===button){close();return;}
      const current=getKey();
      show(button,Object.entries(compounds).map(([key,profile])=>({value:key,html:compoundSvg(profile),title:key,selected:key===current})),{className:'line-compound-menu',width:150,onPick:key=>{onPick(key);refresh();}});
    };
    refresh();
    return {button,refresh};
  }

  const css=`.line-menu{inset:auto;margin:0;position:fixed;z-index:3200;max-height:270px;overflow:auto;padding:2px;border:1px solid var(--border,#b8c2cc);background:var(--card,#fff);color:var(--text,#111);box-shadow:0 6px 20px #0003}
.line-menu[hidden]{display:none}
.line-menu button{display:flex;align-items:center;gap:8px;width:100%;padding:4px 6px;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;font:12px "Segoe UI",sans-serif}
.line-menu-heading{padding:5px 8px;background:#e1e5ea;color:#1b2430;font:700 12px "Segoe UI",sans-serif}.line-menu-grid{display:grid;grid-template-columns:repeat(4,1fr)}.line-menu button:disabled{opacity:.5;cursor:default}.line-menu button:disabled:hover{background:transparent}.line-menu button:hover:not(:disabled),.line-menu button:focus-visible{background:#e8ecef;outline:0}
.line-menu button[aria-selected=true]{background:#0a64c8;color:#fff}
.line-menu .line-menu-caption{font-size:11px}
.line-dash-picker,.line-width-arrow{display:inline-flex;align-items:center;gap:4px;height:22px;border:1px solid var(--border,#b8c2cc);background:var(--card,#fff);color:inherit;cursor:pointer;padding:0 4px}
.line-dash-picker:disabled,.line-width-arrow:disabled{opacity:.45;cursor:default}
.line-dash-picker svg{width:44px;height:12px}.line-compound-picker svg{width:44px}.line-menu-arrow{font-size:10px}`;
  if(typeof document!=='undefined'){const style=document.createElement('style');style.textContent=css;document.head.append(style);}
  root.LineMenus={PT_PRESETS,ptLabel,mmToPt,ptToMm,dashPicker,widthPicker,compoundPicker,close,show};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.LineMenus;
})(typeof window!=='undefined'?window:globalThis);
