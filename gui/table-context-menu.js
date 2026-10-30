'use strict';

const CATEGORY_BY_LABEL = new Map([
  ['Copy', 'Table'], ['Paste', 'Table'], ['Duplicate', 'Table'], ['Delete Table', 'Table'], ['Lock Table', 'Table'], ['Unlock Table', 'Table'], ['Position', 'Table'],
  ['Fit Row to Content', 'Rows'], ['Move Row Up', 'Rows'], ['Move Row Down', 'Rows'], ['New Row Above', 'Rows'], ['New Row Below', 'Rows'], ['Duplicate Row', 'Rows'], ['Delete Row', 'Rows'],
  ['Fit Column to Content', 'Columns'], ['Move Column Left', 'Columns'], ['Move Column Right', 'Columns'], ['New Column to the Left', 'Columns'], ['New Column to the Right', 'Columns'], ['Duplicate Column', 'Columns'], ['Delete Column', 'Columns'],
  ['Bring to front', 'Layer'], ['Bring forward', 'Layer'], ['Send backward', 'Layer'], ['Send to back', 'Layer'],
  ['Edit Cell', 'Cell'],
  ['Copy style', 'Style'], ['Paste style', 'Style'],
]);

function buildTableContextMenu(menu, commands, options = {}) {
  const doc = menu.ownerDocument;
  if (!doc.getElementById('table-context-submenu-style')) {
    const style = doc.createElement('style'); style.id = 'table-context-submenu-style';
    style.textContent = '.table-menu-group{position:static}.table-menu-group-trigger{box-sizing:border-box;display:flex!important;align-items:center;width:100%;min-height:35px;margin:0;padding:7px 10px;border:0;border-radius:4px;background:transparent;color:inherit;text-align:left;cursor:pointer}.table-menu-group-trigger:hover,.table-menu-group-trigger:focus-visible{background:#eaf6ef;color:#15803d;outline:none}.table-menu-group-trigger .ocm-label{flex:1}.table-menu-chevron{font-size:19px;line-height:1;color:#16803c}.table-menu-submenu{position:fixed;z-index:4001;box-sizing:border-box;width:230px;max-height:calc(100vh - 16px);overflow-y:auto;padding:5px;background:var(--card,#fff);color:var(--text,#263342);border:1px solid var(--border,#d5dce5);border-radius:8px;box-shadow:0 8px 24px #0f172a26}.table-menu-submenu[hidden]{display:none!important}.table-menu-submenu button{box-sizing:border-box;display:flex;align-items:center;width:100%;min-height:35px;margin:0;padding:7px 9px;border:0;border-radius:4px;background:transparent;color:inherit;text-align:left;cursor:pointer}.table-menu-submenu button:hover,.table-menu-submenu button:focus-visible{background:#eaf6ef;color:#15803d;outline:none}.table-menu-submenu button:disabled{color:#aab0b8;cursor:default}.table-menu-submenu .ocm-icon{display:grid;place-items:center;width:18px;height:18px;margin-right:10px;color:#16a34a}.table-menu-submenu .ocm-label{flex:1}';
    doc.head?.append(style);
  }
  const groups = new Map();
  const direct = [];
  for (const command of commands) {
    const category = CATEGORY_BY_LABEL.get(command[0]);
    if (!category) direct.push(command);
    else {
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(command);
    }
  }
  menu.replaceChildren();
  doc.defaultView?.buildContextFormattingTools?.(menu);
  const makeCommand = ([label, action]) => {
    const button = doc.createElement('button');
    button.type = 'button'; button.setAttribute('role', 'menuitem'); button.dataset.command = label;
    button.disabled = options.isDisabled?.(label) === true;
    button.innerHTML = `<span class="ocm-icon">${options.icon?.(label) || ''}</span><span class="ocm-label"></span>`;
    const names={'New Column to the Right':'Add 1 column','New Row Below':'Add 1 row','Delete Column':'Delete 1 column','Delete Row':'Delete 1 row','Position':'Position properties…'};
    button.querySelector('.ocm-label').textContent = names[label]||label;
    const shortcut=({'Copy':'Ctrl+C','Copy style':'Ctrl+Alt+C','Paste':'Ctrl+V','Duplicate':'Ctrl+D'})[label];
    if(shortcut){const badge=doc.createElement('span');badge.className='ocm-shortcut';badge.textContent=shortcut;button.append(badge);}
    button.addEventListener('click', () => options.onCommand?.(label, action));
    return button;
  };
  const directOrder=['Paste','Copy','Duplicate','Delete Table','Delete Column','Delete Row','New Column to the Right','New Row Below','Fit Row to Content','Fit Column to Content','Move Row Up','Move Column Left','Copy style','Paste style','Edit Cell','Position','Lock Table','Unlock Table'];
  for(const label of directOrder){const command=direct.find(item=>item[0]===label);if(command)menu.append(makeCommand(command));}
  for (const category of ['Rows','Columns','Cell','Style','Layer','Table']) {
    const items = groups.get(category);
    if (!items) continue;
    const wrapper = doc.createElement('div'); wrapper.className = 'table-menu-group';
    const trigger = doc.createElement('button'); trigger.type = 'button'; trigger.className = 'table-menu-group-trigger';
    trigger.setAttribute('role', 'menuitem'); trigger.setAttribute('aria-haspopup', 'menu'); trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = `<span class="ocm-icon" aria-hidden="true">${options.categoryIcon?.(category) || ''}</span><span class="ocm-label"></span><span class="table-menu-chevron" aria-hidden="true">›</span>`;
    trigger.querySelector('.ocm-label').textContent = category;
    trigger.querySelector('.ocm-icon').innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 3v18M8 6h12v5H8zM8 14h8v5H8z"/></svg>';
    const submenu = doc.createElement('div'); submenu.className = 'table-menu-submenu'; submenu.setAttribute('role', 'menu'); submenu.setAttribute('aria-label', `${category} actions`); submenu.hidden = true;
    for (const command of items) submenu.append(makeCommand(command));
    let closeTimer=null;
    const close = () => { clearTimeout(closeTimer); submenu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    const open = () => {
      clearTimeout(closeTimer);
      submenu.hidden = false; trigger.setAttribute('aria-expanded', 'true');
      const anchor = trigger.getBoundingClientRect();
      const viewportWidth = doc.defaultView?.innerWidth || 1024, viewportHeight = doc.defaultView?.innerHeight || 768;
      const box = submenu.getBoundingClientRect();
      const width = box.width || 220, height = box.height || Math.min(items.length * 35 + 12, viewportHeight - 16);
      const gap=10;
      const right = anchor.right + gap + width <= viewportWidth - 8;
      submenu.style.left = `${right ? anchor.right + gap : Math.max(8, anchor.left - width - gap)}px`;
      submenu.style.top = `${Math.max(8, Math.min(anchor.top, viewportHeight - height - 8))}px`;
    };
    trigger.addEventListener('pointerenter', open);
    trigger.addEventListener('focus', open);
    wrapper.addEventListener('pointerleave', close);
    submenu.addEventListener('pointerenter', () => clearTimeout(closeTimer));
    wrapper.addEventListener('focusout', event => { if (!wrapper.contains(event.relatedTarget)) close(); });
    wrapper.append(trigger, submenu); menu.append(wrapper);
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { buildTableContextMenu };
if (typeof window !== 'undefined') window.TableContextMenu = { buildTableContextMenu };
