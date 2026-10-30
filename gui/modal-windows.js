(function () {
  'use strict';
  // Root windows remain floating; nested windows block their visible ancestors.
  let nextFloatingZIndex = 100000;
  const dialogStack = [];
  const topEntry = () => [...dialogStack].reverse().find(entry => !entry.minimized);
  let reportedModalActive = false;
  const reportModalActive = () => {
    const active = !!topEntry();
    if (active === reportedModalActive) return;
    reportedModalActive = active;
    window.zebra?.setModalWindowActive?.(active);
  };
  const focusable = dialog => [...dialog.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && !el.closest('[hidden],[inert]') && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
  const focusDialog = dialog => {
    const target = focusable(dialog)[0] || dialog;
    if (target === dialog && !dialog.hasAttribute('tabindex')) dialog.tabIndex = -1;
    target.focus({preventScroll:true});
  };
  const syncStack = () => {
    for (const entry of dialogStack) {
      const blocked = entry !== topEntry();
      entry.dialog.inert = blocked || entry.minimized || entry.originalInert;
      entry.dialog.classList.toggle('modal-window-minimized', !!entry.minimized);
      entry.dialog.classList.toggle('modal-window-blocked', entry.minimized || entry !== topEntry());
      entry.dialog.classList.remove('modal-window-suspended');
      entry.dialog.style.setProperty('z-index', String(entry.zIndex), 'important');
      if (entry.overlay) {
        entry.overlay.classList.toggle('modal-window-minimized', !!entry.minimized);
        entry.overlay.style.setProperty('z-index', String(entry.zIndex), 'important');
      }
    }
    reportModalActive();
  };
  const removeDockEntry = entry => {
    const button = hiddenWindows.get(entry.dialog);
    button?.remove(); hiddenWindows.delete(entry.dialog);
    entry.hiddenTarget?.classList.remove('modal-window-minimized');
    entry.dialog.classList.remove('modal-window-minimized');
    entry.overlay?.classList.remove('modal-window-minimized');
  };
  const removeDialog = dialog => {
    const index = dialogStack.findIndex(entry => entry.dialog === dialog);
    if (index < 0) return;
    const removed = dialogStack.splice(index);
    for (const entry of removed.reverse()) {
      removeDockEntry(entry);
      entry.minimized = false;
      entry.dialog.inert = entry.originalInert;
      entry.dialog.classList.remove('modal-window-blocked');
      if (entry.overlay) {
        if (entry.overlayZ) entry.overlay.style.setProperty('z-index', entry.overlayZ, entry.overlayPriority);
        else entry.overlay.style.removeProperty('z-index');
      }
      if (entry.dialog !== dialog) {
        if (entry.dismiss) entry.dismiss();
        else if (entry.dialog.open) entry.dialog.close();
      }
    }
    syncStack();
    const opener = removed.at(-1)?.opener;
    const active = topEntry()?.dialog;
    if (opener?.isConnected && !opener.closest('[inert]') && (!active || active.contains(opener))) opener.focus({preventScroll:true});
    else if (active) focusDialog(active);
  };
  function restoreEntry(entry) {
    if (!entry?.minimized) return false;
    entry.minimized = false;
    // Restoring from the dock should activate this window above its former siblings.
    const index = dialogStack.indexOf(entry);
    if (index >= 0 && index !== dialogStack.length - 1) {
      dialogStack.splice(index, 1);
      dialogStack.push(entry);
    }
    entry.hiddenTarget?.classList.remove('modal-window-minimized');
    entry.dialog.classList.remove('modal-window-minimized');
    entry.overlay?.classList.remove('modal-window-minimized');
    removeDockEntry(entry);
    dockSync();
    syncStack();
    const active = topEntry()?.dialog;
    if (active) focusDialog(active);
    return true;
  }
  function minimizeEntry(entry) {
    if (!entry || entry.minimized) return false;
    entry.minimized = true;
    entry.hiddenTarget = entry.overlay || entry.dialog;
    entry.hiddenTarget.classList.add('modal-window-minimized');
    const name = title(entry.dialog);
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = name; button.title = `Restore ${name}`; button.setAttribute('aria-label', `Restore ${name}`);
    button.onclick = () => restoreEntry(entry);
    hiddenWindows.set(entry.dialog, button); dock.append(button); dockSync(); syncStack();
    const active = topEntry()?.dialog;
    if (active) focusDialog(active);
    return true;
  }
  function closeEntry(entry) {
    if (!entry) return false;
    if (entry.dismiss) { entry.dismiss(); removeDialog(entry.dialog); }
    else if (entry.dialog.open) entry.dialog.close();
    return true;
  }
  HTMLDialogElement.prototype.showModal = function () {
    // Reopening an ancestor must not steal focus from its active child.
    const existing = dialogStack.find(entry => entry.dialog === this);
    if (existing) { if (existing.minimized) restoreEntry(existing); else if (topEntry()) focusDialog(topEntry().dialog); return; }
    const entry = {dialog:this, opener:document.activeElement, originalInert:!!this.inert, zIndex:++nextFloatingZIndex};
    this.classList.add('workspace-floating-window');
    if (!this.open) this.show();
    dialogStack.push(entry);
    syncStack();
    focusDialog(this);
  };
  const originalDialogClose = HTMLDialogElement.prototype.close;
  if (originalDialogClose) HTMLDialogElement.prototype.close = function (...args) {
    originalDialogClose.apply(this, args);
    if (!this.open) removeDialog(this);
  };
  document.addEventListener('close', event => {
    if (event.target instanceof HTMLDialogElement && !event.target.open) removeDialog(event.target);
  }, true);
  window.addEventListener('focusin', event => {
    const active = topEntry()?.dialog;
    if (dialogStack.length > 1 && active && !active.contains(event.target)) focusDialog(active);
  }, true);
  window.addEventListener('keydown', event => {
    const active = topEntry()?.dialog;
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation();
      if (active.dispatchEvent(new Event('cancel', {cancelable:true}))) {
        const entry = topEntry();
        if (entry?.dialog === active && entry.dismiss) { entry.dismiss(); removeDialog(active); }
        else if (entry?.dialog === active) active.close();
      }
    } else if (event.key === 'Tab' && dialogStack.length > 1) {
      const items = focusable(active), current = document.activeElement;
      if (!items.length || !active.contains(current) || (event.shiftKey ? current === items[0] : current === items.at(-1))) {
        event.preventDefault();
        if (items.length) (event.shiftKey ? items.at(-1) : items[0]).focus();
        else focusDialog(active);
      }
    } else if (dialogStack.length > 1 && !active.contains(event.target)) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  for (const name of ['pointerdown','click','dblclick','contextmenu']) window.addEventListener(name, event => {
    const active = topEntry()?.dialog;
    if (dialogStack.length > 1 && active && !active.contains(event.target) && !event.target.closest?.('.modal-window-dock')) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.ModalWindowStack = Object.freeze({
    top: () => topEntry()?.dialog || null,
    closeTop: () => closeEntry(topEntry()),
    minimizeTop: () => minimizeEntry(topEntry()),
    hasActive: () => !!topEntry(),
    openCustom: (dialog, dismiss) => {
      if (dialogStack.some(entry => entry.dialog === dialog)) return;
      const overlay = dialog.closest('.tis-picker-backdrop,#settingsModal,#helpModal,[class*="backdrop"],[class*="overlay"]');
      dialogStack.push({dialog, dismiss, overlay, overlayZ:overlay?.style.getPropertyValue('z-index'), overlayPriority:overlay?.style.getPropertyPriority('z-index'), opener:document.activeElement, originalInert:!!dialog.inert, zIndex:++nextFloatingZIndex});
      syncStack(); focusDialog(dialog);
    },
    closeCustom: removeDialog,
    blocksEditorInput: event => dialogStack.length > 1 || !!event?.target?.closest?.('dialog[open],[role="dialog"]')
  });
  const states = new WeakMap();
  const hiddenWindows = new Map();
  const dock = document.createElement('div');
  dock.className = 'modal-window-dock';
  dock.setAttribute('popover', 'manual');
  dock.setAttribute('aria-label', 'Hidden windows');
  document.body.append(dock);
  const style = document.createElement('style');
  style.textContent = `.modal-window-header{padding-right:6px!important;min-height:44px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;cursor:move;touch-action:none}.modal-window-controls{display:flex!important;gap:8px;align-self:center;flex:none;margin-left:auto;margin-right:0!important}.modal-window-controls button{display:grid!important;place-items:center;width:34px!important;height:30px!important;min-width:34px!important;padding:6px!important;margin:0!important;border:0!important;border-radius:4px!important;background:transparent!important;color:inherit!important;cursor:pointer}.modal-window-controls button:focus{outline:0!important;border-color:transparent!important;box-shadow:none!important}.modal-window-controls button:focus-visible{background:#64748b22!important}.modal-window-controls button:disabled{opacity:.35;cursor:not-allowed;background:transparent!important}.modal-window-controls button:not(:disabled):hover{background:#64748b22!important}.modal-window-controls button:last-child:hover{background:#dc2626!important;color:white!important}.modal-window-controls svg{width:16px!important;height:16px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.5!important}.modal-window-original-close{display:none!important}.modal-window-maximized{border-radius:0!important;box-sizing:border-box!important}.modal-window-maximized .dialog-body,.modal-window-maximized .tis-category-layout{max-height:none!important;flex:1;min-height:0;overflow:auto}.modal-window-dock{position:fixed;inset:auto auto 12px 12px;margin:0;padding:6px;max-width:calc(100vw - 24px);display:none;flex-wrap:wrap;gap:6px;background:#f8fafcf2;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 4px 16px #0003;color:#1f2937}.modal-window-dock:popover-open{display:flex}.modal-window-dock button{padding:8px 12px;border:1px solid #cbd5e1;border-radius:5px;background:white;color:inherit;cursor:pointer}`;
  style.textContent += '.modal-window-minimized{display:none!important}';
  style.textContent += '.modal-window-resized .dialog-body,.modal-window-resized .tis-category-layout{max-height:none!important;flex:1;min-height:0;overflow:auto}.modal-window-resized .modal-window-header{flex-shrink:0}#objectProperties{min-width:min(700px,calc(100vw - 24px));min-height:min(560px,calc(100vh - 24px))}';
  style.textContent += '.modal-footer-pinned{display:flex!important;flex-direction:column!important;box-sizing:border-box!important;overflow:hidden!important}.modal-footer-pinned .modal-footer-stack,.modal-footer-pinned .modal-footer-wrapper{display:flex!important;flex:1 1 auto!important;flex-direction:column!important;min-height:0!important;overflow:hidden!important}.modal-footer-pinned .modal-footer-content{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;overscroll-behavior:contain}.modal-footer-pinned footer{position:sticky!important;inset-block-end:0!important;z-index:5!important;flex:0 0 auto!important;margin-block-start:auto!important;background:var(--card,#fff)!important}';
  document.head.append(style);
  style.textContent += 'dialog.workspace-floating-window{position:fixed!important;z-index:1000;inset:0;margin:auto;pointer-events:auto}dialog.workspace-floating-window::backdrop{display:none}dialog:not([open]){display:none!important}.modal-window-blocked{pointer-events:none!important}.workspace-clickthrough-shell{pointer-events:none!important;background:transparent!important;backdrop-filter:none!important}.workspace-clickthrough-shell>[role="dialog"],.workspace-clickthrough-panel{pointer-events:auto!important}';
  function native(window) { return window instanceof HTMLDialogElement; }
  function shell(window) { return native(window) ? window : window.closest('.tis-picker-backdrop,#settingsModal,#helpModal,[class*="backdrop"],[class*="overlay"]') || window; }
  function title(window) { return window.querySelector('header strong,header h2,header h3,header span,h2,h3')?.textContent.trim() || 'Window'; }
  let dockOpen = false;
  function dockSync() {
    if (dock.childElementCount && !dockOpen) {
      if (typeof dock.showPopover === 'function') dock.showPopover(); else dock.style.display = 'flex';
      dockOpen = true;
    } else if (!dock.childElementCount && dockOpen) {
      if (typeof dock.hidePopover === 'function') dock.hidePopover(); else dock.style.display = 'none';
      dockOpen = false;
    }
  }
  function close(window, state) {
    if (state.closeButton?.isConnected) state.closeButton.click();
    else if (native(window)) window.dispatchEvent(new Event('cancel', { cancelable: true })) && window.close();
    else shell(window).remove();
  }
  function pinFooter(window) {
    const footer=[...window.querySelectorAll('footer')].filter(candidate=>candidate.closest('dialog,[role="dialog"]')===window).at(-1);
    if(!footer)return;
    window.classList.add('modal-footer-pinned');
    const stack=footer.parentElement;
    if(stack!==window)stack.classList.add('modal-footer-stack');
    for(let parent=stack;parent&&parent!==window;parent=parent.parentElement)parent.classList.add('modal-footer-wrapper');
    const content=[...stack.children].filter(child=>child!==footer&&!child.matches('header,.modal-window-header,.modal-window-controls')).at(-1);
    content?.classList.add('modal-footer-content');
  }
  function resizeRect(rect, edge, dx, dy, viewportWidth, viewportHeight, minWidth = 500, minHeight = 380) {
    const vw=Math.max(1,viewportWidth),vh=Math.max(1,viewportHeight),minimumWidth=Math.min(vw,Math.max(1,minWidth)),minimumHeight=Math.min(vh,Math.max(1,minHeight));
    const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
    const width=Math.max(1,Number(rect.width)||Number(rect.right)-Number(rect.left)),height=Math.max(1,Number(rect.height)||Number(rect.bottom)-Number(rect.top));
    let left=clamp(rect.left,0,vw-minimumWidth),top=clamp(rect.top,0,vh-minimumHeight),nextWidth=clamp(width,minimumWidth,vw-left),nextHeight=clamp(height,minimumHeight,vh-top);
    if(edge.includes('w')){const right=clamp(rect.right,minimumWidth,vw);nextWidth=clamp(width-dx,minimumWidth,right);left=right-nextWidth;}
    else if(edge.includes('e'))nextWidth=clamp(width+dx,minimumWidth,vw-left);
    if(edge.includes('n')){const bottom=clamp(rect.bottom,minimumHeight,vh);nextHeight=clamp(height-dy,minimumHeight,bottom);top=bottom-nextHeight;}
    else if(edge.includes('s'))nextHeight=clamp(height+dy,minimumHeight,vh-top);
    return {left,top,width:nextWidth,height:nextHeight,minWidth:minimumWidth,minHeight:minimumHeight};
  }
  function minimumSize(panel, rect) {
    let width=500,height=380;
    if(panel.id==='objectProperties'){width=700;height=560;}
    else if(panel.id==='printDialog'){width=560;height=500;}
    else if(panel.closest('#settingsModal')){width=600;height=480;}
    else if(panel.classList.contains('source-character-picker')){width=500;height=520;}
    else if(panel.classList.contains('source-transform-dialog')){width=420;height=300;if(['serialization','truncation'].includes(panel.dataset.kind)){width=480;height=500;}}
    else if(panel.classList.contains('source-name-wizard')){width=360;height=340;}
    else if(panel.classList.contains('source-description-dialog')){width=400;height=340;}
    else {width=Math.min(width,rect.width||width);height=Math.min(height,rect.height||height);}
    return {width:Math.max(width,Number(panel.dataset.minWidth)||0),height:Math.max(height,Number(panel.dataset.minHeight)||0)};
  }
  function attach(window) {
    pinFooter(window);
    if(!native(window)){
      const backdrop=shell(window);
      if(backdrop!==window){backdrop.classList.add('workspace-clickthrough-shell');window.classList.add('workspace-clickthrough-panel');}
    }
    const header = window.querySelector(':scope > header,:scope > .dialog-header,:scope > .modal-header');
    if (states.get(window)?.header === header) return;
    const state = { header, maximized: false, minimized: false, closeButton: header?.querySelector('button[aria-label="Close"],button.close,button.tis-close,button[id$="Close"],button[id$="X"]') || [...(header?.querySelectorAll('button')||[])].find(b => /^(×|close)$/i.test(b.textContent.trim())) };
    states.set(window, state);
    attachResize(window, state);
    if (!header) return;
    header.classList.add('modal-window-header');
    state.closeButton?.classList.add('modal-window-original-close');
    const controls = document.createElement('div'); controls.className = 'modal-window-controls';
    const make = (label, path, action) => {
      const button = document.createElement('button'); button.type = 'button'; button.title = label; button.setAttribute('aria-label', label);
      button.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${path}"/></svg>`;
      button.onclick = event => { event.stopPropagation(); action(); }; controls.append(button); return button;
    };
    if (window.dataset.hideMinimize !== 'true') make('Minimize window', 'M3 11h10', () => minimizeEntry(dialogStack.find(entry => entry.dialog === window)));
    const maximize = window.dataset.fixedSize === 'true' ? null : make('Maximize window', 'M3 3h10v10H3z', () => {
      if (!state.maximized) {
        state.previousStyle = window.style.cssText;
        window.style.setProperty('position', 'fixed', 'important'); window.style.setProperty('inset', '0', 'important');
        for (const key of ['width', 'max-width']) window.style.setProperty(key, '100vw', 'important');
        for (const key of ['height', 'max-height']) window.style.setProperty(key, '100vh', 'important');
        window.style.setProperty('margin', '0', 'important'); window.style.setProperty('transform', 'none', 'important');
      } else window.style.cssText = state.previousStyle;
      syncStack();
      state.maximized = !state.maximized; window.classList.toggle('modal-window-maximized', state.maximized);
      maximize.title = state.maximized ? 'Restore window' : 'Maximize window'; maximize.setAttribute('aria-label', maximize.title);
    });
    make('Close window', 'M4 4l8 8M12 4l-8 8', () => closeEntry(dialogStack.find(entry => entry.dialog === window)));
    header.append(controls);
    header.addEventListener('pointerdown', event => {
      if (event.button !== 0 || state.maximized || event.target.closest('button,input,select,textarea,a,label')) return;
      const rect = window.getBoundingClientRect(); const startX = event.clientX, startY = event.clientY;
      window.style.setProperty('position', 'fixed', 'important'); window.style.setProperty('inset', 'auto', 'important');
      window.style.setProperty('margin', '0', 'important'); window.style.setProperty('transform', 'none', 'important');
      window.style.setProperty('width', rect.width + 'px', 'important'); window.style.setProperty('box-sizing', 'border-box', 'important');
      const move = e => { window.style.left = Math.max(0, Math.min(innerWidth - rect.width, rect.left + e.clientX - startX)) + 'px'; window.style.top = Math.max(0, Math.min(innerHeight - Math.min(rect.height, 48), rect.top + e.clientY - startY)) + 'px'; };
      move(event); header.setPointerCapture(event.pointerId); event.preventDefault();
      const end = () => { header.removeEventListener('pointermove', move); header.removeEventListener('pointerup', end); header.removeEventListener('pointercancel', end); };
      header.addEventListener('pointermove', move); header.addEventListener('pointerup', end); header.addEventListener('pointercancel', end);
    });
  }
  function attachResize(panel, state) {
    if (panel.dataset.fixedSize === 'true') return;
    const edgeAt = event => {
      if (state.maximized) return '';
      const r = panel.getBoundingClientRect(), x = event.clientX, y = event.clientY;
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return '';
      return (y - r.top <= 7 ? 'n' : r.bottom - y <= 7 ? 's' : '') + (x - r.left <= 7 ? 'w' : r.right - x <= 7 ? 'e' : '');
    };
    panel.addEventListener('pointermove', event => {
      if (event.buttons) return;
      const edge = edgeAt(event);
      panel.style.cursor = edge ? edge + '-resize' : '';
      if (edge) event.target.style.cursor = edge + '-resize';
      else if (/resize$/.test(event.target.style?.cursor || '')) event.target.style.cursor = '';
    });
    panel.addEventListener('pointerdown', event => {
      const edge = edgeAt(event);
      if (event.button !== 0 || !edge) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const r = panel.getBoundingClientRect(), sx = event.clientX, sy = event.clientY;
      const minimum=state.minimum||(state.minimum=minimumSize(panel,r)),limits=resizeRect(r,edge,0,0,innerWidth,innerHeight,minimum.width,minimum.height);
      for (const [key, value] of Object.entries({position:'fixed',inset:'auto',margin:'0',transform:'none','box-sizing':'border-box','max-width':'none','max-height':'none','min-width':limits.minWidth+'px','min-height':limits.minHeight+'px',overflow:'auto'})) panel.style.setProperty(key, value, 'important');
      panel.classList.add('modal-window-resized');
      panel.style.setProperty('will-change', 'left,top,width,height', 'important');
      let latest = event, frame = 0;
      const apply = e => {
        const dx = e.clientX - sx, dy = e.clientY - sy;
        const next=resizeRect(r,edge,dx,dy,innerWidth,innerHeight,minimum.width,minimum.height);
        panel.style.setProperty('left', next.left + 'px', 'important'); panel.style.setProperty('top', next.top + 'px', 'important');
        panel.style.setProperty('width', next.width + 'px', 'important'); panel.style.setProperty('height', next.height + 'px', 'important');
      };
      const move = e => { if(e.pointerId!==event.pointerId)return;latest = e; if (!frame) frame = requestAnimationFrame(() => { frame = 0; apply(latest); }); };
      apply(event); panel.setPointerCapture(event.pointerId);
      const end = e => { if(e.pointerId!=null&&e.pointerId!==event.pointerId)return; if (frame) { cancelAnimationFrame(frame); frame = 0; } apply(latest); panel.style.removeProperty('will-change'); panel.ownerDocument.removeEventListener('pointermove', move); panel.ownerDocument.removeEventListener('pointerup', end); panel.ownerDocument.removeEventListener('pointercancel', end); panel.ownerDocument.defaultView.removeEventListener('blur',end);if(panel.hasPointerCapture(event.pointerId))panel.releasePointerCapture(event.pointerId); };
      panel.ownerDocument.addEventListener('pointermove', move); panel.ownerDocument.addEventListener('pointerup', end); panel.ownerDocument.addEventListener('pointercancel', end);panel.ownerDocument.defaultView.addEventListener('blur',end);
    }, true);
  }
  function scan() {
    const stale = dialogStack.find(entry => !entry.dialog.isConnected || (!entry.dismiss && !entry.dialog.open));
    if (stale) removeDialog(stale.dialog);
    syncStack();
    document.querySelectorAll('#settingsModal > div,#helpModal > div').forEach(panel => {
      if(panel.getAttribute('role')!=='dialog')panel.setAttribute('role', 'dialog');
      if(!panel.firstElementChild?.classList.contains('modal-header'))panel.firstElementChild?.classList.add('modal-header');
    });
    document.querySelectorAll('dialog,[role="dialog"]').forEach(attach);
    for (const [window, button] of hiddenWindows) if (!window.isConnected) { button.remove(); hiddenWindows.delete(window); }
    dockSync();
  }
  new MutationObserver(records => {
    if (records.some(record => !record.target.closest?.('#previewFrame'))) scan();
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  window.ModalWindowSizing=Object.freeze({resizeRect});
  scan();
})();
