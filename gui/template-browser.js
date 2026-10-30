'use strict';
(() => {
  const PAGE_SIZE = 50;
  const CLOUD_URL = 'https://templatebrowser.bartendercloud.com/bttemplatebrowser/';
  let dialog;
  let onPick = null;
  let page = 0;
  let query = '';
  let filters = [];
  let activeFilterCategory = 'Standards and Technology';
  let filterCatalog = null;
  const icon = path => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="${path}"/></svg>`;
  const filtersApi = () => window.QLabelTemplateBrowserFilters;

  function catalog() {
    return window.QLabelTemplateLibraryCatalog || { templates: [], count: 0, page_size: PAGE_SIZE };
  }

  function filteredTemplates() {
    const available = catalog().templates || [];
    const cloud = available.filter(item=>item.source==='cloud'||item.cloud_name);
    const all = (cloud.length?cloud:available).slice().sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base',numeric:false}));
    const q = query.trim().toLowerCase();
    return all.filter((item) => {
      const haystack = `${item.name} ${item.description} ${item.industry || ''} ${item.tags || ''}`.toLowerCase();
      for (const category of ['Standards and Technology','Industries','Shapes and Orientation']) {
        const selected = filters.filter(filter => filter.category === category);
        if (!selected.length) continue;
        if (!selected.some(filter => {
          if (category === 'Industries') return (item.industry || '').toLowerCase() === filter.value.toLowerCase();
          if (category === 'Standards and Technology') return haystack.includes(filter.value.toLowerCase());
          const width = Number(item.width_in), height = Number(item.height_in);
          if (filter.value === 'Horizontal') return width > height;
          if (filter.value === 'Vertical') return height > width;
          if (filter.value === 'Square') return width > 0 && height > 0 && Math.abs(width - height) < 0.01;
          return /ellipse|oval|circle|round/.test(haystack);
        })) return false;
      }
      if (!q) return true;
      const hay = `${item.name} ${item.description} ${item.industry} ${item.sizes || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'templateBrowserDialog';
    dialog.className = 'template-browser-dialog';
    dialog.innerHTML = `<form method="dialog"><header class="tb-header"><div><strong>Template Manager</strong><p>Manage your templates</p></div><button type="button" class="tb-close" aria-label="Close">×</button></header><div class="tb-toolbar"><button type="button" id="tbAddFilter">Add Filter</button><div class="tb-search"><input id="tbSearch" type="search" placeholder="Search" aria-label="Search templates"><span aria-hidden="true">⌕</span></div></div><div id="tbFilterChips" class="tb-chips" hidden></div><main id="tbGrid" class="tb-grid"></main><footer class="tb-footer"><div class="tb-pager"><button type="button" id="tbPrev" aria-label="Previous page">‹</button><div id="tbPages" class="tb-pages"></div><button type="button" id="tbNext" aria-label="Next page">›</button></div><p id="tbStatus"></p></footer></form>`;
    document.body.append(dialog);
    const style = document.createElement('style');
    style.textContent = `#templateBrowserDialog.template-browser-dialog{border:1px solid #15803d;border-radius:4px;padding:0;width:min(980px,calc(100vw - 24px));height:min(720px,calc(100vh - 24px));overflow:hidden;color:#0f172a;font:13px 'Segoe UI',sans-serif}#templateBrowserDialog.template-browser-dialog[open]{overflow:hidden!important;scrollbar-gutter:auto!important;max-height:none}#templateBrowserDialog::-webkit-scrollbar{display:none}#templateBrowserDialog::backdrop{background:rgba(15,23,42,.45)}#templateBrowserDialog form{display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;margin:0}#templateBrowserDialog .tb-header{display:flex;justify-content:space-between;align-items:flex-start;padding:18px 20px;background:linear-gradient(90deg,#15803d,#16a34a);color:#fff}#templateBrowserDialog .tb-header strong{font-size:22px;font-weight:600}#templateBrowserDialog .tb-header p{margin:4px 0 0;font-size:13px;opacity:.95}#templateBrowserDialog .tb-close{border:0;background:transparent;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0 4px}#templateBrowserDialog .tb-toolbar{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #dcfce7;background:#fff}#templateBrowserDialog #tbAddFilter{padding:6px 12px;border:1px solid #16a34a;border-radius:4px;background:#fff;color:#15803d;cursor:pointer}#templateBrowserDialog .tb-search{flex:1;display:flex;align-items:center;gap:8px;border:1px solid #cbd5e1;border-radius:4px;padding:4px 10px}#templateBrowserDialog .tb-search input{flex:1;border:0;outline:0;font:inherit}#templateBrowserDialog .tb-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0}#templateBrowserDialog .tb-chips button{padding:2px 8px;border:1px solid #94a3b8;border-radius:999px;background:#fff;font:inherit;cursor:pointer}#templateBrowserDialog .tb-grid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;padding:16px;background:#f1f5f9}#templateBrowserDialog .tb-card{display:flex;flex-direction:column;border:1px solid #cbd5e1;border-radius:2px;background:#fff;cursor:pointer;text-align:left;padding:0;overflow:hidden}#templateBrowserDialog .tb-card:hover{outline:2px solid #16a34a;outline-offset:-2px}#templateBrowserDialog .tb-thumb{aspect-ratio:4/3;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:4px}#templateBrowserDialog .tb-thumb img{width:100%;height:100%;object-fit:contain;display:block}#templateBrowserDialog .tb-thumb-fallback{color:#64748b;font-size:11px;padding:8px;text-align:center}#templateBrowserDialog .tb-card-body{padding:10px 10px 12px;display:flex;flex-direction:column;gap:6px;min-height:120px}#templateBrowserDialog .tb-card-body strong{color:#15803d;font-size:15px;line-height:1.2}#templateBrowserDialog .tb-card-body small{color:#334155;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}#templateBrowserDialog .tb-size{color:#475569;font-size:12px}#templateBrowserDialog .tb-tag{margin-top:auto;display:inline-flex;align-items:center;gap:6px;color:#15803d;font-size:12px;font-weight:600}#templateBrowserDialog .tb-footer{padding:10px 16px;border-top:1px solid #e2e8f0;background:#fff;display:flex;flex-direction:column;gap:8px}#templateBrowserDialog .tb-pager{display:flex;align-items:center;gap:8px;justify-content:center}#templateBrowserDialog .tb-pages{display:flex;gap:4px;flex-wrap:wrap;justify-content:center}#templateBrowserDialog .tb-pages button{min-width:28px;height:28px;border:1px solid #cbd5e1;background:#fff;border-radius:2px;cursor:pointer;font:inherit}#templateBrowserDialog .tb-pages button[aria-current=page]{background:#16a34a;border-color:#16a34a;color:#fff}#templateBrowserDialog #tbStatus{margin:0;text-align:center;color:#64748b;font-size:12px}`;
    style.textContent += `#templateBrowserDialog .tb-header{background:linear-gradient(90deg,#15803d,#16a34a)!important}#templateBrowserDialog .tb-header p{color:#fff}#templateBrowserDialog #tbAddFilter{color:#15803d;border-color:#16a34a}#templateBrowserDialog #tbFilterToggle,.tb-industry-icon{color:#15803d}#templateBrowserDialog .tb-card:hover{outline-color:#16a34a}#templateBrowserDialog .tb-card-body strong,#templateBrowserDialog .tb-tag{color:#15803d}#templateBrowserDialog .tb-pages button[aria-current=page]{background:#16a34a;border-color:#16a34a}#templateBrowserDialog button:focus-visible{outline:2px solid #16a34a;outline-offset:2px}`;
    document.head.append(style);
    const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='template-browser.css';document.head.append(sheet);
    dialog.querySelector('.tb-search span').innerHTML=icon('M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6');
    const toggle=document.createElement('button');toggle.type='button';toggle.id='tbFilterToggle';toggle.setAttribute('aria-label','Show filters');toggle.innerHTML=icon('M3 6h18M7 12h10M10 18h4');toggle.onclick=()=>{ void openFilterMenu(); };dialog.querySelector('.tb-toolbar').append(toggle);

    dialog.querySelector('.tb-close').onclick = () => dialog.close('cancel');
    dialog.querySelector('#tbSearch').oninput = (event) => {
      query = event.target.value;
      page = 0;
      renderGrid();
    };
    dialog.querySelector('#tbPrev').onclick = () => {
      page = Math.max(0, page - 1);
      renderGrid();
    };
    dialog.querySelector('#tbNext').onclick = () => {
      page += 1;
      renderGrid();
    };
    dialog.querySelector('#tbAddFilter').onclick = () => { void openFilterMenu(); };
    dialog.addEventListener('close', () => {
      onPick = null;
    });
    return dialog;
  }

  function closeFilterMenu(panel) {
    panel?.remove();
    dialog.querySelector('#tbAddFilter')?.focus();
  }

  async function openFilterMenu() {
    if (dialog.querySelector('.tb-filter-backdrop')) return;
    const panel = document.createElement('div');
    panel.className = 'tb-filter-backdrop';
    panel.innerHTML = '<section class="tb-filter-dialog" role="region" aria-labelledby="tbFilterTitle"><header class="tb-filter-title"><strong id="tbFilterTitle">Add a filter</strong><button type="button" class="tb-filter-close" aria-label="Close">×</button></header><div class="tb-filter-layout"><nav class="tb-filter-tabs" role="tablist" aria-label="Filter categories"></nav><main class="tb-filter-content"><h2></h2><p></p><div class="tb-filter-options"></div></main></div></section>';
    dialog.append(panel);
    panel.querySelector('.tb-filter-close').onclick = () => closeFilterMenu(panel);
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeFilterMenu(panel);
      }
    });
    const nav = panel.querySelector('.tb-filter-tabs');
    const api = filtersApi();
    try {
      filterCatalog = await api.loadCategories();
    } catch (error) {
      panel.querySelector('.tb-filter-content').innerHTML = `<p role="alert">Could not load filter icons. ${error?.message || error}</p>`;
      panel.querySelector('.tb-filter-close').focus();
      return;
    }
    for (const name of api.FILTER_CATEGORY_ORDER) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.dataset.filterCategory = name;
      tab.innerHTML = `<img class="tb-filter-tab-icon" alt="" src="${api.filterCategoryIconUrl(name)}"><span>${name}</span>`;
      tab.onclick = () => {
        activeFilterCategory = name;
        renderFilterOptions(panel);
      };
      nav.append(tab);
    }
    renderFilterOptions(panel);
    panel.querySelector('.tb-filter-close').focus();
  }

  function renderFilterOptions(panel) {
    const api = filtersApi();
    panel.querySelectorAll('[role=tab]').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.filterCategory === activeFilterCategory)));
    const category = filterCatalog?.[activeFilterCategory];
    const title = panel.querySelector('h2');
    const description = panel.querySelector('p');
    const grid = panel.querySelector('.tb-filter-options');
    title.textContent = category?.CategoryName || activeFilterCategory;
    description.textContent = category?.CategoryDesc || '';
    const items = Array.isArray(category?.FilterItems) ? category.FilterItems : [];
    grid.replaceChildren(...items.map((item) => {
      const value = item.Name;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tb-filter-option';
      button.dataset.filterValue = value;
      button.title = item.Tip || value;
      button.setAttribute('aria-pressed', String(filters.some((filter) => filter.category === activeFilterCategory && filter.value === value)));
      const tile = document.createElement('span');
      tile.className = 'tb-filter-option-icon';
      tile.style.background = item.Background || '#ffffff';
      const image = document.createElement('img');
      image.alt = '';
      image.src = api.filterItemIconUrl(item.Icon);
      image.className = 'tb-filter-option-image';
      tile.append(image);
      const label = document.createElement('span');
      label.textContent = value;
      button.append(tile, label);
      button.onclick = () => {
        const index = filters.findIndex((filter) => filter.category === activeFilterCategory && filter.value === value);
        if (index >= 0) filters.splice(index, 1);
        else filters.push({ category: activeFilterCategory, value });
        button.setAttribute('aria-pressed', String(index < 0));
        renderChips();
      };
      return button;
    }));
  }

  function renderChips() {
    const chips = dialog.querySelector('#tbFilterChips');
    chips.hidden = !filters.length;
    chips.replaceChildren(
      ...filters.map((filter) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = `${filter.value} ×`;
        b.onclick = () => {
          filters = filters.filter((f) => f !== filter);
          renderChips();
          page = 0;
          renderGrid();
        };
        return b;
      }),
    );
    page = 0;
    renderGrid();
  }

  function formatSize(item) {
    if (item.sizes) return item.sizes.replace(/"/g, '"');
    if (item.width_in && item.height_in) return `${item.width_in}" x ${item.height_in}"`;
    return '';
  }

  function chooseTemplate(item) {
    if (!onPick) return;
    const pick = onPick;
    onPick = null;
    pick({ ...item, source: item.source || 'cloud' });
    dialog.close('ok');
  }

  function renderGrid() {
    const list = filteredTemplates();
    const size = catalog().page_size || PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    page = Math.min(page, totalPages - 1);
    const slice = list.slice(page * size, page * size + size);
    const grid = dialog.querySelector('#tbGrid');
    grid.scrollTop=0;
    grid.replaceChildren(
      ...slice.map((item) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tb-card';
        btn.dataset.id = item.id;
        btn.innerHTML = `<div class="tb-thumb"></div><div class="tb-card-body"><strong></strong><small></small><span class="tb-size"></span><span class="tb-tag"></span></div>`;
        const thumb = btn.querySelector('.tb-thumb');
        if (item.thumbnail_url) {
          const img = document.createElement('img');
          img.alt = '';
          img.loading = 'lazy';
          img.src = item.thumbnail_url.replace('https://bartender-template-s3-storage-gateway.s3.us-west-2.amazonaws.com/TemplateImages/','https://bartender-images-cdn.bartendercloud.com/TemplateImages/');
          img.onerror = () => {
            thumb.replaceChildren();
            const fallback = document.createElement('span');
            fallback.className = 'tb-thumb-fallback';
            fallback.textContent = 'Label preview';
            thumb.append(fallback);
          };
          thumb.append(img);
        } else {
          const fallback = document.createElement('span');
          fallback.className = 'tb-thumb-fallback';
          fallback.textContent = 'Label preview';
          thumb.append(fallback);
        }
        btn.querySelector('strong').textContent = item.name;
        btn.querySelector('small').textContent = item.description;
        btn.querySelector('.tb-size').textContent = formatSize(item);
        const tag=btn.querySelector('.tb-tag');tag.dataset.industry=item.industry;
        const badge=document.createElement('span');badge.className='tb-industry-icon';badge.innerHTML=icon(item.industry==='Automotive'?'M3 15v-5l3-5h12l3 5v5M3 10h18M6 15v3m12-3v3M6 12h2m8 0h2':item.industry==='Retail'?'M5 7h14v14H5zM9 8V5a3 3 0 0 1 6 0v3M8 12h8v6H8z':'m12 2 3 6 6 1-4 4 1 7-6-3-6 3 1-7-4-4 6-1z');tag.append(badge,document.createTextNode(item.industry));
        btn.onclick = () => chooseTemplate(item);
        return btn;
      }),
    );
    const pages = dialog.querySelector('#tbPages');
    pages.replaceChildren();
    const visible=new Set([0,totalPages-1]);for(let i=Math.max(0,page-2);i<=Math.min(totalPages-1,Math.max(4,page+2));i++)visible.add(i);
    let previous=-1;
    for (const i of [...visible].sort((a,b)=>a-b)) {
      if(i>previous+1){const gap=document.createElement('span');gap.textContent='…';pages.append(gap);}previous=i;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = String(i + 1);
      if (i === page) b.setAttribute('aria-current', 'page');
      b.onclick = () => {
        page = i;
        renderGrid();
      };
      pages.append(b);
    }
    dialog.querySelector('#tbPrev').disabled = page <= 0;
    dialog.querySelector('#tbNext').disabled = page >= totalPages - 1;
    const from = list.length ? page * size + 1 : 0;
    const to = Math.min(list.length, (page + 1) * size);
    dialog.querySelector('#tbStatus').textContent = `${from} - ${to}, of ${list.length} templates found`;
  }

  function openLocalBrowser(pick) {
    onPick = pick;
    page = 0;
    query = '';
    filters = [];
    const d = ensureDialog();
    document.querySelector('.tb-filter-backdrop')?.remove();
    d.querySelector('#tbSearch').value = '';
    d.querySelector('#tbFilterChips').hidden = true;
    renderGrid();
    d.showModal();
  }

  function openTemplateBrowser(pick) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (payload) => {
        if (settled) return;
        settled = true;
        resolve(payload);
      };
      const d = ensureDialog();
      openLocalBrowser((item) => {
        pick?.(item);
        finish({ mode: 'local', item });
      });
      d.addEventListener('close', () => finish({ mode: 'cancel', item: null }), { once: true });
    });
  }

  window.openTemplateBrowser = openTemplateBrowser;
})();
