(function () {
  'use strict';
  const tabs = document.querySelector('.ribbon-tabs');
  if (!tabs) return;
  const host = document.createElement('div');
  host.className = 'tool-search';
  host.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="toolSearchInput" type="search" placeholder="Search tools…" aria-label="Search tools" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="toolSearchResults" autocomplete="off"><kbd>Alt+Q</kbd>';
  // Search is a separate control, outside the tablist keyboard navigation.
  const quickAccess=document.querySelector('.ribbon-quick-access');
  if(!quickAccess)return;
  quickAccess.append(host);
  const input = host.querySelector('input');
  const popup = document.createElement('div');
  popup.className = 'tool-search-popup';
  popup.hidden = true;
  popup.innerHTML = '<div class="tool-search-heading"></div><div id="toolSearchResults" role="listbox" aria-label="Tool search results"></div><div class="tool-search-hint">↑ ↓ Choose · Enter Run · Esc Close</div>';
  document.body.append(popup);
  const list = popup.querySelector('[role=listbox]');
  let results = [], active = -1;
  const aliases = [
    [/text/i, 'label text'], [/barcode|code|ean|matrix/i, 'barcode symbol'],
    [/symbol/i, 'mark certification'], [/picture|image/i, 'graphic photo'],
    [/table/i, 'grid'], [/print/i, 'printer'], [/settings|connection/i, 'preferences printer connect'],
    [/save/i, 'store'], [/open/i, 'load'], [/new/i, 'create'],
    [/cut/i, 'remove selection'], [/copy/i, 'clipboard'], [/paste/i, 'clipboard insert'], [/duplicate/i, 'clone'],
    [/delete/i, 'remove'], [/undo/i, 'history back'], [/redo/i, 'history forward'],
    [/align|distribute/i, 'position arrange'], [/zoom|fit/i, 'scale view'],
    [/grid|snap/i, 'grid alignment'], [/properties/i, 'settings options'],
    [/rectangle/i, 'box'], [/ellipse/i, 'circle oval'], [/line/i, 'stroke'],
    [/data|fields|values/i, 'record column'], [/history/i, 'revision'], [/help|shortcut/i, 'guide keyboard']
  ];
  function commands() {
    const nodes = [...document.querySelectorAll('.ribbon-panel .ribbon-command,.ribbon-file-menu [role=menuitem],#insertSidebar [data-add]')];
    for (const id of ['newTemplateBtn', 'importTplBtn', 'exportTplBtn', 'exportPngBtn', 'settingsBtn', 'helpBtn']) {
      const node = document.getElementById(id);
      if (node) nodes.push(node);
    }
    const seen = new Set();
    return nodes.flatMap(node => {
      const name = (node.querySelector('.fm-label')?.textContent || (node.dataset.add ? node.textContent : '') || node.getAttribute('aria-label') || node.title || node.textContent).trim().replace(/\s*[▾…]+$/, '');
      if (!name || seen.has(name.toLowerCase())) return [];
      seen.add(name.toLowerCase());
      const panel = node.closest('.ribbon-panel');
      const category = panel ? panel.id.replace('ribbon-', '') : node.closest('.ribbon-file-menu') ? 'File' : 'Application';
      const keywords = aliases.filter(([pattern]) => pattern.test(name)).map(([, words]) => words).join(' ');
      return [{name, category, node, text: `${name} ${category} ${keywords}`.toLowerCase(), disabled: node.disabled || node.getAttribute('aria-disabled') === 'true'}];
    });
  }
  function position() {
    const box = host.getBoundingClientRect();
    popup.style.width = Math.min(420, window.innerWidth - 24) + 'px';
    popup.style.left = Math.max(12, Math.min(box.left, window.innerWidth - popup.offsetWidth - 12)) + 'px';
    popup.style.top = box.bottom + 5 + 'px';
    popup.style.maxHeight = Math.max(100, window.innerHeight - box.bottom - 18) + 'px';
  }
  function recent() { try { return JSON.parse(localStorage.getItem('tool-search-recent') || '[]'); } catch { return []; } }
  function render() {
    const query = input.value.trim().toLowerCase();
    const all = commands(), tokens = query.split(/\s+/).filter(Boolean), saved = recent();
    results = query ? all.filter(command => tokens.every(token => command.text.includes(token))).sort((a,b) => Number(b.name.toLowerCase().startsWith(query)) - Number(a.name.toLowerCase().startsWith(query))) : all.filter(command => !command.disabled).sort((a,b) => {
      const rank = name => { const i = saved.indexOf(name); return i < 0 ? 100 + ['Text','Symbols','Print','Page Setup','Settings'].indexOf(name) + (['Text','Symbols','Print','Page Setup','Settings'].includes(name) ? 0 : 100) : i; };
      return rank(a.name) - rank(b.name);
    });
    results = results.slice(0, query ? 30 : 6);
    list.replaceChildren();
    popup.querySelector('.tool-search-heading').textContent = query ? 'Search results' : 'Suggested actions';
    results.forEach((command, index) => {
      const item = document.createElement('div');
      item.className = 'tool-search-result'; item.id = `toolSearchOption${index}`;
      item.setAttribute('role','option'); item.setAttribute('aria-disabled',String(command.disabled));
      const sourceIcon=command.node.querySelector('svg'),icon=sourceIcon?.cloneNode(true);
      if (icon) {
        icon.removeAttribute('id');icon.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
        const computed=getComputedStyle(sourceIcon);
        for(const property of ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','color']){
          const value=computed.getPropertyValue(property);if(value)icon.style.setProperty(property,value);
        }
        icon.setAttribute('focusable','false');item.append(icon);
      }
      const label = document.createElement('span'); label.textContent = command.name;
      const detail = document.createElement('small'); detail.textContent = command.disabled ? (command.node.dataset.requiresSelection ? 'Select an object first' : 'Unavailable right now') : command.category;
      item.append(label,detail); item.addEventListener('pointerdown', event => event.preventDefault());
      item.addEventListener('click', () => run(index)); list.append(item);
    });
    if (!results.length) { const empty=document.createElement('div'); empty.className='tool-search-empty'; empty.textContent='No tools found'; list.append(empty); }
    active = results.findIndex(command => !command.disabled); highlight(); position();
  }
  function highlight() {
    [...list.querySelectorAll('[role=option]')].forEach((item,index) => item.setAttribute('aria-selected',String(index===active)));
    if (active >= 0) { input.setAttribute('aria-activedescendant',`toolSearchOption${active}`); list.children[active]?.scrollIntoView({block:'nearest'}); }
    else input.removeAttribute('aria-activedescendant');
  }
  function open() { popup.hidden=false; input.setAttribute('aria-expanded','true'); document.body.classList.add('tool-search-open','preview-nav-visible'); render(); }
  function close() { popup.hidden=true; input.setAttribute('aria-expanded','false'); input.removeAttribute('aria-activedescendant'); document.body.classList.remove('tool-search-open');if(!document.body.classList.contains('file-menu-open'))document.body.classList.remove('preview-nav-visible'); }
  function run(index) {
    const command=results[index]; if (!command || command.disabled || command.node.disabled) return;
    try { localStorage.setItem('tool-search-recent',JSON.stringify([command.name,...recent().filter(name=>name!==command.name)].slice(0,6))); } catch {}
    close(); input.blur(); input.value='';
    const panel=command.node.closest('.ribbon-panel');
    if (panel) document.querySelector(`[role=tab][aria-controls="${panel.id}"]`)?.click();
    command.node.click();
  }
  input.addEventListener('focus',open); input.addEventListener('input',open);
  input.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key==='Escape') { event.preventDefault(); close(); input.blur(); }
    else if (event.key==='Enter') { event.preventDefault(); run(active); }
    else if (['ArrowDown','ArrowUp'].includes(event.key)) {
      event.preventDefault(); if (popup.hidden) open();
      const enabled=results.map((command,index)=>command.disabled?-1:index).filter(index=>index>=0);
      if (enabled.length) { const current=enabled.indexOf(active); active=enabled[(current+(event.key==='ArrowDown'?1:-1)+enabled.length)%enabled.length]; highlight(); }
    } else if (event.key==='Tab') close();
  });
  document.addEventListener('keydown', event => { const key=String(event.key||'').toLowerCase(),isAltQ=event.altKey&&!event.ctrlKey&&!event.metaKey&&(event.code==='KeyQ'||key==='q');if(isAltQ&&!document.querySelector('dialog[open],.tis-picker-backdrop')){event.preventDefault();event.stopImmediatePropagation();input.focus({preventScroll:true});input.select();open();} },true);
  document.addEventListener('pointerdown',event=>{if(!host.contains(event.target)&&!popup.contains(event.target)){close();if(document.activeElement===input)input.blur();}});
  window.addEventListener('resize',()=>{if(!popup.hidden)position();});
  const style=document.createElement('style');
  style.textContent='.ribbon-quick-access{position:relative}.ribbon-quick-access>.tool-search{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:7px;width:300px;max-width:min(32vw,calc(100% - 420px));box-sizing:border-box;background:var(--card,#fff);border:1px solid var(--border,#cbd5e1);border-radius:5px;padding:3px 9px;margin:0;color:var(--text,#334155);-webkit-app-region:no-drag}.tool-search:focus-within{border-color:#16a34a;box-shadow:0 0 0 1px #16a34a}.tool-search svg{width:16px;height:16px;flex:none}.tool-search input{width:100%;min-width:0;border:0!important;outline:none!important;padding:3px!important;background:transparent!important;color:inherit;font:12px "Segoe UI",sans-serif}.tool-search kbd{white-space:nowrap;font:10px "Segoe UI",sans-serif;color:var(--muted,#64748b)}.tool-search-popup{position:fixed;z-index:10020;background:var(--card,#fff);color:var(--text,#1f2937);border:1px solid var(--border,#cbd5e1);border-radius:6px;box-shadow:0 8px 24px #0003;overflow:auto;padding:5px}.tool-search-popup[hidden]{display:none}.tool-search-heading{padding:8px 10px;font:600 12px "Segoe UI",sans-serif}.tool-search-result{display:flex;gap:10px;align-items:center;padding:10px;border-radius:4px;font:13px "Segoe UI",sans-serif;cursor:pointer}.tool-search-result svg{width:20px;height:20px;flex:none}.tool-search-result span{flex:1}.tool-search-result small{text-transform:capitalize;color:var(--muted,#64748b);font-size:11px}.tool-search-result:hover,.tool-search-result[aria-selected=true]{background:color-mix(in srgb,var(--accent,#16a34a) 12%,var(--card,#fff))}.tool-search-result[aria-disabled=true]{opacity:.5;cursor:default}.tool-search-hint{padding:8px 10px;border-top:1px solid var(--border,#e2e8f0);color:var(--muted,#64748b);font:11px "Segoe UI",sans-serif}.tool-search-empty{padding:16px 10px;font-size:13px}body.tool-search-open .word-ribbon{transform:translateY(0)!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}@media(max-width:700px){.ribbon-quick-access>.tool-search{width:min(300px,calc(100% - 130px));max-width:none;left:58%}.tool-search kbd{display:none}}';
  document.head.append(style);
})();
