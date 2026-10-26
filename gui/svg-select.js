(function(root){
  'use strict';
  // Upgrades a native <select> into a list whose rows start with an SVG icon.
  // The native select stays in the DOM (hidden) as the value holder, so existing code keeps working.
  const PALETTE=['#2f6fd6','#16a34a','#f59e0b','#dc2626','#7c3aed','#0d9488','#e0457b','#475569'];
  const hash=text=>[...String(text)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
  const esc=text=>String(text).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

  /** Rounded colour badge with a sample glyph; used when a list has no bespoke icon. */
  function badgeIcon(glyph,seed){
    const colour=PALETTE[hash(seed||glyph)%PALETTE.length];
    const text=String(glyph||'?').slice(0,2),size=text.length>1?9:12;
    return '<svg class="svg-select-icon" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><rect x="1" y="1" width="18" height="18" rx="4" fill="'+colour+'"/><text x="10" y="14" text-anchor="middle" font-size="'+size+'" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#fff">'+esc(text)+'</text></svg>';
  }

  // Sample glyph for each Unicode block name used by the Symbol dialog.
  const BLOCK_GLYPHS={
    'TIS':'ก','Basic Latin':'A','Latin-1 Supplement':'é','Latin Extended-A':'ā','Latin Extended-B':'ƀ','Latin Extended Additional':'ạ','IPA Extensions':'ə','Spacing Modifier Letters':'ʰ','Combining Diacritical Marks':'◌́','Greek and Coptic':'Ω','Cyrillic':'Ж','Hebrew':'א','Arabic':'ع','Thai':'ก','General Punctuation':'¶','Superscripts and Subscripts':'x²','Currency Symbols':'€','Combining Diacritical Marks for Symbols':'◌⃗','Letterlike Symbols':'™','Number Forms':'⅔','Arrows':'→','Mathematical Operators':'∑','Miscellaneous Technical':'⌘','Technical Symbols':'⌘','Control Pictures':'␣','Optical Character Recognition':'⑆','Enclosed Alphanumerics':'①','Enclosed Characters':'①','Box Drawing':'┼','Block Elements':'█','Geometric Shapes':'▲','Miscellaneous Symbols':'☀','Dingbats':'✂','Braille Patterns':'⠿','Variation Selectors':'VS','Private Use Area':'PU','Halfwidth and Fullwidth Forms':'Ａ','Specials':'�','Custom':'★','Imported':'★'
  };
  const blockIcon=name=>badgeIcon(BLOCK_GLYPHS[name]||String(name).trim().slice(0,1).toUpperCase()||'?',name);

  let openList=null;
  function closeList(){
    if(!openList)return;
    const {list,button,off}=openList;openList=null;off();list.remove();button.setAttribute('aria-expanded','false');
  }

  /**
   * enhance(select,{iconFor(value,text)->svg string}) returns {button,refresh,destroy}.
   */
  function enhance(select,options={}){
    if(!select||select.dataset.svgSelect==='1')return null;
    select.dataset.svgSelect='1';
    const doc=select.ownerDocument,iconFor=options.iconFor||((value,text)=>badgeIcon(String(text).slice(0,1).toUpperCase(),text));
    const button=doc.createElement('button');
    button.type='button';button.className='svg-select-button';
    button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
    const label=select.getAttribute('aria-label');if(label)button.setAttribute('aria-label',label);
    select.hidden=true;select.after(button);
    const current=()=>select.options[select.selectedIndex]||null;
    const refresh=()=>{const option=current();button.innerHTML=(option?iconFor(option.value,option.textContent):'')+'<span class="svg-select-text">'+esc(option?option.textContent:'')+'</span><span class="svg-select-arrow" aria-hidden="true">▾</span>';button.disabled=select.disabled;};
    // Programmatic `select.value = x` must repaint the button.
    const descriptor=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
    Object.defineProperty(select,'value',{configurable:true,get(){return descriptor.get.call(this);},set(v){descriptor.set.call(this,v);refresh();}});
    select.addEventListener('change',refresh);
    const openMenu=()=>{
      closeList();
      const list=doc.createElement('div');list.className='svg-select-list';list.setAttribute('role','listbox');
      const rect=button.getBoundingClientRect(),view=doc.defaultView;
      const choose=option=>{closeList();if(select.value!==option.value){descriptor.set.call(select,option.value);refresh();select.dispatchEvent(new view.Event('change',{bubbles:true}));}button.focus();};
      for(const option of select.options){
        const row=doc.createElement('button');row.type='button';row.setAttribute('role','option');row.dataset.value=option.value;
        row.setAttribute('aria-selected',String(option===current()));row.disabled=option.disabled;
        row.innerHTML=iconFor(option.value,option.textContent)+'<span class="svg-select-text">'+esc(option.textContent)+'</span>';
        row.onclick=()=>choose(option);list.append(row);
      }
      const height=Math.min(300,list.children.length*30+4);
      list.style.cssText='left:'+Math.max(4,rect.left)+'px;top:'+Math.max(4,Math.min(rect.bottom+1,view.innerHeight-height-8))+'px;min-width:'+rect.width+'px;max-height:'+height+'px';
      list.onkeydown=event=>{
        const rows=[...list.querySelectorAll('button:not(:disabled)')],i=rows.indexOf(doc.activeElement);
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeList();button.focus();}
        else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();rows[event.key==='Home'?0:event.key==='End'?rows.length-1:(i+(event.key==='ArrowUp'?-1:1)+rows.length)%rows.length]?.focus();}
      };
      const down=event=>{if(!list.contains(event.target)&&!button.contains(event.target))closeList();};
      doc.addEventListener('pointerdown',down,true);
      const host=select.closest('dialog,[role=dialog]')||doc.body;
      host.append(list);
      button.setAttribute('aria-expanded','true');
      openList={list,button,off:()=>doc.removeEventListener('pointerdown',down,true)};
      const selected=list.querySelector('[aria-selected=true]');(selected||list.querySelector('button:not(:disabled)'))?.focus();selected?.scrollIntoView({block:'nearest'});
    };
    button.onclick=()=>{if(openList&&openList.button===button)closeList();else openMenu();};
    refresh();
    return {button,refresh,destroy(){closeList();button.remove();select.hidden=false;delete select.dataset.svgSelect;}};
  }

  const css='.svg-select-button{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;min-height:34px;padding:4px 10px;border:1px solid var(--border,#b8c2cc);border-radius:6px;background:var(--card,#fff);color:inherit;font:inherit;text-align:left;cursor:pointer}'
    +'.svg-select-button:focus-visible{outline:2px solid #16a34a;outline-offset:1px}.svg-select-button:disabled{opacity:.5;cursor:default}'
    +'.svg-select-text{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.svg-select-arrow{font-size:11px}.svg-select-icon{flex:none}'
    +'.svg-select-list{position:fixed;z-index:3400;overflow:auto;box-sizing:border-box;padding:2px;border:1px solid #2f8fd6;background:var(--card,#fff);color:var(--text,#111);box-shadow:0 8px 20px #0003}'
    +'.svg-select-list button{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;min-height:28px;padding:3px 8px;border:0;border-radius:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}'
    +'.svg-select-list button:hover:not(:disabled),.svg-select-list button:focus-visible,.svg-select-list button[aria-selected=true]{background:#2f8fd6;color:#fff;outline:0}.svg-select-list button:disabled{opacity:.45;cursor:default}';
  if(typeof document!=='undefined'){const style=document.createElement('style');style.textContent=css;document.head.append(style);}
  const api={enhance,badgeIcon,blockIcon,BLOCK_GLYPHS,closeList};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SvgSelect=api;
})(typeof window!=='undefined'?window:globalThis);
