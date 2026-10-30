(function(){
  'use strict';
  const paths={
    close:'M5 5l14 14M19 5 5 19',help:'M9 9a3 3 0 1 1 5.7 1.3c-1.2 1.3-2.7 1.7-2.7 3.7M12 18h.01',
    cancel:'M6 6l12 12M18 6 6 18',done:'m5 12 4 4L19 6',save:'M5 3h12l3 3v15H4V3zM8 3v6h8V3M8 21v-7h8v7',
    delete:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',add:'M12 5v14M5 12h14',
    import:'M12 3v12m-5-5 5 5 5-5M4 19h16',export:'M12 15V3m-5 5 5-5 5 5M4 15v5h16v-5',
    settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12l2-1 1-3-1-2 3-2 2 2h3l2-2 3 2-1 3 1 3 2 1-1 4-3 0-2 2v2H9v-2l-2-2-3 0z',
    refresh:'M20 7v5h-5M4 17v-5h5M5 9a7 7 0 0 1 12-2l3 5M4 12l3 5a7 7 0 0 0 12-2',
    copy:'M8 8h12v12H8zM16 8V4H4v12h4',search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M16 16l5 5',
    testPrint:'M6 9V3h12v6M6 18H3v-7h18v7h-3M6 14h12v7H6zM9 17l2 2 4-4',print:'M6 9V3h12v6M6 18H3v-7h18v7h-3M6 14h12v7H6zM17 11h.01',
    preview:'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    open:'M4 12h15m-6-6 6 6-6 6',default:'M5 12h14M12 5v14',
    insertTable:'M3 4h18v16H3zM3 10h18M3 15h18M9 4v16M15 4v16',drawTable:'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
    convertTable:'M3 6h6M3 12h6M3 18h6M12 12h9M18 9l3 3-3 3',databaseTable:'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    excelTable:'M4 3h16v18H4zM4 9h16M4 15h16M10 3v18',quickTables:'M13 3 5 14h6l-1 7 8-11h-6z'
  };
  const tableKeys=[[/^insert table/,'insertTable'],[/^draw table/,'drawTable'],[/^convert text to table/,'convertTable'],[/^create table from database/,'databaseTable'],[/^excel spreadsheet/,'excelTable'],[/^quick tables/,'quickTables']];
  function keyFor(text){const t=text.trim().toLowerCase();const table=tableKeys.find(([pattern])=>pattern.test(t));if(table)return table[1];if(/^(test print|print|preview|×|close|done|ok|finish|apply|save|help|cancel|delete|remove|add|new|import|export|copy|duplicate|search|open|refresh|reset|settings)/.test(t)){if(/^test print/.test(t))return'testPrint';if(/^print/.test(t))return'print';if(/^preview/.test(t))return'preview';if(/^(×|close)/.test(t))return'close';if(/^(done|ok|finish|apply)/.test(t))return'done';if(/^save/.test(t))return'save';if(/^help/.test(t))return'help';if(/^cancel/.test(t))return'cancel';if(/^(delete|remove)/.test(t))return'delete';if(/^(add|new)/.test(t))return'add';if(/^import/.test(t))return'import';if(/^export/.test(t))return'export';if(/^(copy|duplicate)/.test(t))return'copy';if(/^search/.test(t))return'search';if(/^open/.test(t))return'open';if(/^(refresh|reset)/.test(t))return'refresh';if(/^settings/.test(t))return'settings';}return'default';}
  function enhance(button){
    if(button.dataset.qActionStyled||button.closest('[role="tab"],.ribbon-tabs,#objectTools,.insert-tool,.bc-card,.tis-symbol-card,.shape-preset-choice,.color-picker-panel,.line-menu'))return;
    if(button.querySelector('svg')||button.children.length)return;
    const label=button.textContent.trim();if(!label||/^(\+|−|-|×|›|‹|▾|▴|▸|◂)$/.test(label))return;
    button.dataset.qActionStyled='true';button.classList.add('q-action-button');button.setAttribute('aria-label',button.getAttribute('aria-label')||label);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',paths[keyFor(label)]);svg.append(path);
    const span=document.createElement('span');span.textContent=label;button.replaceChildren(svg,span);
  }
  const style=document.createElement('style');style.textContent=`
    dialog button:not(.bc-card):not(.tis-symbol-card):not(.shape-preset-choice),.source-context-menu button,.table-menu button,.workspace-dialog button,.context-menu button{box-sizing:border-box;min-height:34px;padding:6px 11px;border:1px solid var(--border,#d8dee6);border-radius:7px;background:var(--card,#fff);color:var(--text,#1f2933);font:500 12px "Segoe UI",sans-serif;cursor:pointer;transition:background-color .12s,border-color .12s,color .12s,box-shadow .12s}
    .q-action-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap}
    .q-action-button>svg{width:16px;height:16px;flex:none;fill:none;stroke:var(--accent,#16a34a);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
    #printDialog #pdPrint>svg{stroke:var(--accent,#16a34a)!important}
    dialog button:hover,.source-context-menu button:hover,.table-menu button:hover,.workspace-dialog button:hover,.context-menu button:hover{border-color:var(--accent,#16a34a);background:color-mix(in srgb,var(--accent,#16a34a) 8%,var(--card,#fff));color:var(--text,#1f2933)}
    dialog button:focus-visible,.source-context-menu button:focus-visible,.table-menu button:focus-visible,.workspace-dialog button:focus-visible,.context-menu button:focus-visible{outline:2px solid var(--accent,#16a34a);outline-offset:2px}
    dialog button:disabled,.source-context-menu button:disabled,.table-menu button:disabled{opacity:.48;cursor:default}
    dialog button[data-primary],dialog footer button[type="submit"],dialog footer button.primary{border-color:var(--accent,#16a34a);background:var(--accent,#16a34a);color:#fff}
    dialog button[data-primary]>svg,dialog footer button[type="submit"]>svg,dialog footer button.primary>svg{stroke:#fff}
    dialog button[aria-label="Close"],.workspace-dialog header button{width:34px;min-width:34px;padding:6px}
    dialog button[aria-label="Close"]>span,.workspace-dialog header button>span{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
    dialog[open]:has(footer):not(#newLabelWizard){max-height:min(92vh,calc(100vh - 24px));overflow:auto;scrollbar-gutter:stable}
    #newLabelWizard[open]:has(footer){overflow:hidden!important;scrollbar-gutter:auto!important;max-height:none}
    dialog[open]:has(footer) footer{position:sticky;bottom:0;z-index:5;flex:0 0 auto;background:var(--card,#fff);box-shadow:0 -5px 12px color-mix(in srgb,var(--text,#1f2933) 7%,transparent)}
    dialog[open]:has(>form>footer){display:flex;flex-direction:column}
    dialog[open]:has(>form>footer)>form{display:flex;flex:1 1 auto;flex-direction:column;min-height:0}
    dialog[open]:has(>form>footer)>form>.pd-body{flex:1 1 auto;min-height:0;max-height:none;overflow:auto}
  `;document.head.append(style);
  const scan=root=>{if(root.matches?.('button'))enhance(root);root.querySelectorAll?.('button').forEach(enhance);};
  scan(document);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node);}))).observe(document.documentElement,{childList:true,subtree:true});
})();
