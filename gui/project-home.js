'use strict';
(() => {
  const home = document.createElement('main');
  home.id = 'projectHome';
  home.hidden = true;
  home.setAttribute('aria-label', 'Projects home');
  home.innerHTML = `<header><div class="ph-brand"><span class="ph-mark" aria-hidden="true"><img src="../build/icon.svg" alt=""></span><span>Q LABEL <small id="phVersion"></small></span></div><button id="phSettings" title="Settings" aria-label="Settings">⚙</button></header><div class="ph-content"><div class="ph-welcome"><span class="ph-eyebrow">LABEL DESIGNER</span><h1>What would you like to create?</h1><p>Choose a recent label project or start with a new one.</p></div><div class="ph-actions"><button id="phNew"><span>＋</span><b>Create a New Label</b><small>Set up a printer and label size</small></button><button id="phOpen"><span>↗</span><b>Open a Label</b><small>Browse for a label template file</small></button></div><section class="ph-recent"><div class="ph-section-title"><h2>Recent projects</h2><div class="ph-view-toggle" role="group" aria-label="Recent projects view"><button type="button" data-home-view="grid" aria-label="Grid view" title="Grid view" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg></button><button type="button" data-home-view="list" aria-label="List view" title="List view" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2M9 5h11M4 12h2M9 12h11M4 19h2M9 19h11"/></svg></button></div><button id="phAll">Browse all labels&nbsp; →</button></div><div class="ph-list-heading" aria-hidden="true"><span>Name</span><span>Last opened</span></div><div id="phRecent" class="ph-grid"></div></section><section class="ph-all" hidden><div class="ph-section-title"><h2>All labels</h2><input id="phSearch" type="search" placeholder="Search labels…"></div><div id="phProjects" class="ph-grid"></div></section><footer><span>Printer</span><b id="phPrinter">No printer selected</b><span class="ph-version-foot" id="phFooterVersion"></span></footer></div>`;
  document.body.append(home);
  const style=document.createElement('style');
  style.textContent=`#projectHome{position:fixed;inset:0;z-index:999;overflow:auto;background:var(--bg,#eef1f5);color:var(--text,#1f2933);font-family:'Segoe UI',Arial,sans-serif}#projectHome[hidden]{display:none}#projectHome>header{height:58px;display:flex;align-items:center;padding:0 28px;background:var(--card,#fff);border-bottom:1px solid var(--border,#d8dee6)}#projectHome .ph-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;flex:1}#projectHome .ph-brand small{font-size:11px;color:var(--muted)}#projectHome .ph-mark{display:flex;align-items:center;justify-content:center;width:24px;height:24px;color:#475467}#projectHome .ph-mark img{display:block;width:24px;height:24px;object-fit:contain}#projectHome header button{border:1px solid var(--border);border-radius:5px;background:var(--card);color:var(--text);width:36px;height:34px;font-size:18px;cursor:pointer}#projectHome .ph-content{max-width:1080px;margin:0 auto;padding:48px 38px 24px}.ph-welcome{margin-bottom:27px}.ph-eyebrow{font-size:11px;letter-spacing:.14em;color:#007eaa;font-weight:700}.ph-welcome h1{font-size:30px;margin:8px 0}.ph-welcome p{margin:0;color:var(--muted)}.ph-actions{display:grid;grid-template-columns:1fr 1fr;gap:16px}.ph-actions button{display:grid;grid-template-columns:50px 1fr;grid-template-rows:auto auto;align-items:center;text-align:left;padding:18px;background:var(--card);color:var(--text);border:1px solid var(--border);border-left:4px solid #1387b6;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px #15283d0d}.ph-actions button:hover,.ph-project:hover{border-color:#1687b5;box-shadow:0 4px 16px #15283d17}.ph-actions button>span{grid-row:span 2;font-size:28px;color:#1687b5}.ph-actions button b{font-size:15px}.ph-actions button small{color:var(--muted);margin-top:5px}.ph-recent,.ph-all{margin-top:34px}.ph-section-title{display:flex;align-items:center;gap:16px;margin-bottom:13px}.ph-section-title h2{font-size:17px;margin:0;flex:1}.ph-section-title button{border:0;background:none;color:#087ca9;font-weight:600;cursor:pointer}.ph-section-title input{padding:8px 10px;border:1px solid var(--border);border-radius:5px;background:var(--card);color:var(--text)}.ph-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px}.ph-project{position:relative;min-height:106px;display:flex;flex-direction:column;align-items:stretch;text-align:left;padding:14px 42px 14px 16px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:6px;cursor:pointer}.ph-project:focus-visible{outline:2px solid #1687b5;outline-offset:2px}.ph-project .ph-fileicon{font-size:23px;color:#1687b5}.ph-project b{margin-top:7px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ph-project small{margin-top:4px;color:var(--muted)}.ph-delete{position:absolute;right:2px;top:2px;width:24px;height:24px;border:1px solid transparent;border-radius:4px;background:transparent;color:#64748b;font-size:17px;cursor:pointer;opacity:.55}.ph-project:hover .ph-delete,.ph-delete:focus-visible{opacity:1}.ph-delete:hover{color:#b42318;background:#fff0f0;border-color:#f2caca}.ph-context{position:fixed;z-index:3000;display:none;min-width:190px;padding:5px;background:var(--card);border:1px solid var(--border);border-radius:4px;box-shadow:0 8px 26px #0003}.ph-context[aria-hidden=false]{display:grid}.ph-context button{border:0;background:transparent;text-align:left;padding:8px 12px;color:var(--text);font-size:13px;cursor:pointer}.ph-context button:hover,.ph-context button:focus{background:#e8f2f8;outline:0}.ph-empty{grid-column:1/-1;padding:25px;border:1px dashed var(--border);border-radius:6px;color:var(--muted);text-align:center}.ph-all[hidden]{display:none}#projectHome footer{display:flex;align-items:center;gap:9px;margin-top:40px;padding:15px 0;border-top:1px solid var(--border);color:var(--muted);font-size:12px}#projectHome footer b{color:var(--text);font-weight:500}.ph-version-foot{margin-left:auto}@media(max-width:650px){#projectHome .ph-content{padding:30px 18px}.ph-actions{grid-template-columns:1fr}.ph-welcome h1{font-size:24px}}body.dark #projectHome{--bg:#0f172a;--card:#1e293b;--text:#e2e8f0;--muted:#94a3b8;--border:#334155}`;
  document.head.append(style);
  style.textContent += '#projectHome>header #phSettings,#projectHome>header #phCalibration{display:none!important}#projectHome .ph-mark,#projectHome .ph-eyebrow,#projectHome .ph-section-title button,#projectHome .ph-project .ph-fileicon{color:#15803d}#projectHome .ph-actions button{border-left-color:#16a34a}#projectHome .ph-actions button>span{color:#15803d}#projectHome .ph-actions button:hover,#projectHome .ph-project:hover{border-color:#16a34a}#projectHome .ph-project:focus-visible{outline-color:#16a34a}#projectHome .ph-project{padding:10px 34px 10px 12px;min-height:106px}#projectHome .ph-thumb{height:62px;display:grid;place-items:center;overflow:hidden;margin:-2px -4px 3px;background:#fff;border:0;border-radius:4px}#projectHome .ph-thumb svg{display:block;width:100%;height:100%;object-fit:contain}#projectHome .ph-thumb .ph-thumb-loading{font-size:11px;color:var(--muted)}#projectHome .ph-fileicon{display:none}';
  style.textContent += '#projectHome .ph-thumb{height:76px;background:#e5e7eb;border:1px solid #cbd5e1}#projectHome .ph-thumb svg{width:80%!important;height:80%!important;max-width:80%;max-height:80%;filter:drop-shadow(0 1px 2px #0005)}';
  style.textContent += '.ph-context{min-width:224px;padding:6px;border-radius:9px}.ph-context button{display:flex;align-items:center;gap:10px;min-height:34px;padding:7px 10px;border-radius:6px}.ph-context button .ph-context-icon{display:grid;place-items:center;flex:0 0 18px;width:18px;height:18px;color:#667085}.ph-context button .ph-context-icon svg{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.ph-context button:hover .ph-context-icon{color:#15803d}.ph-context button.ph-context-danger{color:#b42318}.ph-context button.ph-context-danger .ph-context-icon{color:#b42318}.ph-context button .ph-context-label{flex:1}';
  const q=id=>home.querySelector('#'+id);const previewTimers=new Set(),previewListeners=new Set();

  style.textContent += '#projectHome .ph-list-heading{display:none}#projectHome .ph-recent[data-view=list] .ph-list-heading{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:12px;padding:4px 38px 7px 58px;color:var(--muted,#64748b);font-size:12px}@media(max-width:650px){#projectHome .ph-recent[data-view=list] .ph-list-heading{grid-template-columns:minmax(0,1fr) 85px}}#projectHome .ph-view-toggle{display:flex;gap:2px;padding:2px;border:1px solid var(--border,#d7dee8);border-radius:6px;background:var(--card,#fff)}#projectHome .ph-view-toggle button{display:grid;place-items:center;width:30px;height:28px;padding:5px;border:0;border-radius:4px;color:var(--muted,#64748b)}#projectHome .ph-view-toggle button[aria-pressed=true]{background:#e7f6ec;color:#15803d}#projectHome .ph-view-toggle svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}#projectHome .ph-recent-date{display:none}#projectHome #phRecent[data-view=list]{display:flex;flex-direction:column;gap:0;border-top:1px solid var(--border,#d7dee8)}#projectHome #phRecent[data-view=list] .ph-project{display:grid;grid-template-columns:40px minmax(0,1fr) 150px;grid-template-rows:auto auto;column-gap:12px;align-items:center;min-height:62px;padding:8px 38px 8px 6px;border:0;border-bottom:1px solid var(--border,#d7dee8);border-radius:0;background:transparent;box-shadow:none}#projectHome #phRecent[data-view=list] .ph-project:hover{background:var(--card,#fff)}#projectHome #phRecent[data-view=list] .ph-thumb{grid-row:1 / 3;grid-column:1;width:38px;height:38px;margin:0}#projectHome #phRecent[data-view=list] .ph-project-name{grid-column:2;grid-row:1;margin:0}#projectHome #phRecent[data-view=list] .ph-project small{grid-column:2;grid-row:2;margin:2px 0 0}#projectHome #phRecent[data-view=list] .ph-recent-date{display:block;grid-column:3;grid-row:1 / 3;color:var(--muted,#64748b);font-size:12px}#projectHome #phRecent[data-view=list] .ph-delete{top:calc(50% - 12px)}@media(max-width:650px){#projectHome #phRecent[data-view=list] .ph-project{grid-template-columns:40px minmax(0,1fr) 85px}}';
  function clearPreviewTimers(){for(const timer of previewTimers)clearInterval(timer);previewTimers.clear();for(const listener of previewListeners)document.removeEventListener('source-inputs-ready',listener);previewListeners.clear();}
  const menu=document.createElement('div');menu.className='ph-context';menu.setAttribute('role','menu');menu.setAttribute('aria-hidden','true');document.body.append(menu);let menuTemplate=null;
  const contextIcons={
    'Open':'<path d="M3 12.5 12 4l9 8.5M5 11v9h14v-9M9 20v-6h6v6"/>',
    'Rename':'<path d="m4 16-.8 4.8L8 20l11.8-11.8a2.8 2.8 0 0 0-4-4L4 16ZM14.5 5.5l4 4"/>',
    'Show in folder':'<path d="M3 6h7l2 2h9v11H3zM3 6V4h7l2 2"/><path d="M12 12v5m-2-2 2 2 2-2"/>',
    'Copy path to clipboard':'<rect x="8" y="8" width="12" height="13" rx="1.5"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/>',
    'Open a copy':'<rect x="5" y="3" width="13" height="17" rx="1.5"/><path d="M9 7h5M9 11h5M15 17h6m-3-3v6"/>',
    'Pin in list':'<path d="m9 4 6-1 1 6 4 4-5 1-3 7-2-7-5-2 4-4zM12 14v7"/>',
    'Unpin from list':'<path d="m9 4 6-1 1 6 4 4-5 1-3 7-2-7-5-2 4-4zM4 4l16 16"/>',
    'Remove from list':'<path d="M5 5h14M9 5V3h6v2m2 0-1 16H8L7 5M10 9v8m4-8v8"/>',
    'Delete file':'<path d="M4 4h10l5 5v11H4zM14 4v5h5M8 13l6 5m0-5-6 5"/>'
  };
  function hideMenu(){menu.setAttribute('aria-hidden','true');menu.replaceChildren();menuTemplate=null;}
  async function beginRename(template,card){
    if(!template?.editable||!card)return;
    const label=card.querySelector('.ph-project-name');if(!label)return;
    if(card.querySelector('.ph-project-rename'))return;
    const input=document.createElement('input');input.className='ph-project-rename';input.type='text';input.value=template.name;input.setAttribute('aria-label','Project name');input.autocomplete='off';input.spellcheck=false;
    input.style.cssText='box-sizing:border-box;width:100%;min-width:0;margin-top:7px;padding:2px 4px;border:1px solid #16a34a;border-radius:3px;background:var(--card);color:var(--text);font:700 13px Segoe UI,Arial,sans-serif;outline:0';
    label.replaceWith(input);card.setAttribute('aria-label',`Rename project ${template.name}`);
    requestAnimationFrame(()=>{input.focus();input.setSelectionRange(input.value.length,input.value.length);});
    let finished=false;
    const finish=async commit=>{
      if(finished)return;finished=true;
      const value=input.value.trim();
      if(!commit||!value){render();return;}
      if(value===template.name){render();return;}
      input.disabled=true;
      const result=await window.renameProjectTemplate(template,value);
      if(!result?.ok){window.alert(result?.error||'Could not rename project.');render();return;}
      render();
    };
    input.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'){event.preventDefault();finish(true);}else if(event.key==='Escape'){event.preventDefault();finish(false);}});
    input.addEventListener('keyup',event=>event.stopPropagation());
    input.addEventListener('blur',()=>finish(true));
    input.addEventListener('click',event=>event.stopPropagation());
    input.addEventListener('pointerdown',event=>event.stopPropagation());
  }
  function showMenu(template,event){
    event.preventDefault();menuTemplate=template;menu.replaceChildren();
    const data=window.projectHomeData?.()||{},pinned=(data.pinnedTemplates||[]).includes(template.file);
    const actions=[
      ['Open',async()=>{if(await window.selectProjectTemplate(template.file)!==false)window.hideProjectHome();}],
      ...(template.editable?[['Rename',async()=>{const card=[...home.querySelectorAll('.ph-project')].find(item=>item.dataset.templateFile===template.file);if(card)await beginRename(template,card);}]]:[]),
      ...(template.editable?[['Show in folder',async()=>{const result=await window.revealProjectTemplate(template.file);if(!result?.ok)window.alert(result?.error||'Could not open project folder.');}]]:[]),
      ['Copy path to clipboard',async()=>{const result=await window.copyProjectPath(template.file);if(!result?.ok)window.alert(result?.error||'Could not copy project path.');}],
      ['Open a copy',async()=>{const value=window.prompt('Name for the copy',`${template.name}-copy`);if(value==null||!value.trim())return;const result=await window.duplicateProjectTemplate(template,value);if(!result?.ok)window.alert(result?.error||'Could not copy project.');}],
      [pinned?'Unpin from list':'Pin in list',async()=>window.toggleProjectPin(template.file)],
      ['Remove from list',async()=>{const result=template.editable?await window.removeProjectFromRecent(template.file):await window.deleteProjectTemplate(template);if(!result?.ok)window.alert(result?.error||'Could not remove project.');else render();}],
      ...(template.editable?[['Delete file',async()=>{if(!await window.confirmAction({title:'Delete project?',message:`Delete “${template.name}” permanently?`,confirmLabel:'Delete'}))return;const result=await window.deleteProjectTemplate(template);if(!result?.ok)window.alert(result?.error||'Could not delete project.');else render();}]]:[]),
    ];
    for(const [label,action] of actions){const item=document.createElement('button');item.type='button';item.setAttribute('role','menuitem');if(label==='Delete file')item.classList.add('ph-context-danger');const icon=document.createElement('span');icon.className='ph-context-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24">'+(contextIcons[label]||'<path d="M4 6h16M4 12h16M4 18h16"/>')+'</svg>';const text=document.createElement('span');text.className='ph-context-label';text.textContent=label;item.append(icon,text);item.onclick=async()=>{hideMenu();await action();};menu.append(item);}
    menu.setAttribute('aria-hidden','false');const rect=menu.getBoundingClientRect();menu.style.left=`${Math.max(4,Math.min(event.clientX,innerWidth-rect.width-4))}px`;menu.style.top=`${Math.max(4,Math.min(event.clientY,innerHeight-rect.height-4))}px`;
  }
  document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))hideMenu();});document.addEventListener('keydown',event=>{if(event.key==='Escape')hideMenu();});
  function buttonFor(template){
    const card=document.createElement('article');card.className='ph-project';card.dataset.templateFile=template.file;card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Open project ${template.name}`);
    const thumb=document.createElement('div');thumb.className='ph-thumb';thumb.setAttribute('aria-hidden','true');const loading=document.createElement('span');loading.className='ph-thumb-loading';loading.textContent='Loading preview…';thumb.append(loading);const icon=document.createElement('span');icon.className='ph-fileicon';icon.textContent='▤';const name=document.createElement('b');name.className='ph-project-name';name.textContent=template.name;const meta=document.createElement('small');meta.textContent=`${window.formatProjectSize?window.formatProjectSize(template):`${template.width_mm} × ${template.height_mm} mm`} · ${template.editable?'CUSTOM':'SAMPLE'}`;card.append(thumb,icon,name,meta);
    window.zebra.loadTemplateRaw(template.file).then(source=>{
      if(!card.isConnected||home.hidden||!source||!window.LabelPreview)return;
      const pages=Array.isArray(source.template_pages)&&source.template_pages.length>1?source.template_pages:null;
      const cache={},pending=new Set();let pageIndex=0;
      const renderPage=()=>{
        if(!card.isConnected||home.hidden)return;
        const pageSource=pages?{...source,...(pages[pageIndex]?.design||{})}:source;
        const values=window.sampleData?.(pageSource)||window.DataSourceEngine?.resolve(pageSource,pageSource.values||{})||pageSource.values||{};
        thumb.innerHTML=window.LabelPreview.renderPreviewSVG(pageSource,values,null,cache,{designSheet:true,editorPlaceholders:true});
        const image=thumb.querySelector('svg');if(image){image.removeAttribute('class');image.setAttribute('preserveAspectRatio','xMidYMid meet');image.setAttribute('width','80%');image.setAttribute('height','80%');}
        for(const item of pageSource.elements||[]){
          if(item.enabled===false||!['qrcode','datamatrix'].includes(item.type))continue;
          const value=window.ObjectData?.resolve(item,values)||'';
          const text=value||' ';
          const key=item.type==='datamatrix'?'dm:'+text:text;
          if(cache[key]||pending.has(key))continue;
          const generate=item.type==='qrcode'?window.zebra.qrMatrix:window.zebra.dmImage;if(typeof generate!=='function')continue;
          pending.add(key);
          Promise.resolve().then(()=>generate(text)).then(result=>{
            const valid=item.type==='qrcode'?Number(result?.size)>0&&Array.isArray(result.data)&&result.data.length>=result.size*result.size:!!result;
            if(valid){cache[key]=result;if(card.isConnected&&!home.hidden)renderPage();}
          }).catch(error=>console.warn('Could not prepare project barcode preview:',error)).finally(()=>pending.delete(key));
        }
      };
      renderPage();if(pages&&!home.hidden){const timer=setInterval(()=>{if(!card.isConnected||home.hidden){clearInterval(timer);previewTimers.delete(timer);return;}pageIndex=(pageIndex+1)%pages.length;renderPage();},3000);previewTimers.add(timer);}
      const updateSources=()=>{if(card.isConnected&&!home.hidden)renderPage();};
      document.addEventListener('source-inputs-ready',updateSources);previewListeners.add(updateSources);
    }).catch(()=>{if(card.isConnected)loading.textContent='Preview unavailable';});
    const open=async()=>{if(card.querySelector('.ph-project-rename'))return;if(await window.selectProjectTemplate(template.file)!==false)window.hideProjectHome();};card.onclick=event=>{if(event.target.closest('.ph-delete,.ph-project-rename'))return;open();};card.onkeydown=event=>{if(card.querySelector('.ph-project-rename'))return;if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}};card.oncontextmenu=event=>showMenu(template,event);
    const remove=document.createElement('button');remove.className='ph-delete';remove.type='button';remove.textContent='×';remove.title=template.editable?'Delete project':'Remove sample from list';remove.setAttribute('aria-label',`${remove.title}: ${template.name}`);remove.onclick=async event=>{event.stopPropagation();const action=template.editable?'permanently delete this project file':'remove this sample from the project list';if(!await window.confirmAction({title:template.editable?'Delete project?':'Remove sample?',message:`Are you sure you want to ${action}? ${template.name}`,confirmLabel:template.editable?'Delete':'Remove'}))return;remove.disabled=true;const result=await window.deleteProjectTemplate?.(template);if(!result?.ok){remove.disabled=false;window.alert(result?.error||'Could not remove this project.');}else render();};card.append(remove);return card;
  }
  let recentView;try{recentView=localStorage.getItem('projectHomeView')==='grid'?'grid':'list';}catch{recentView='list';}
  function setRecentView(view){recentView=view==='list'?'list':'grid';q('phRecent').dataset.view=recentView;home.querySelector('.ph-recent').dataset.view=recentView;for(const button of home.querySelectorAll('[data-home-view]'))button.setAttribute('aria-pressed',String(button.dataset.homeView===recentView));try{localStorage.setItem('projectHomeView',recentView);}catch{}}
  for(const button of home.querySelectorAll('[data-home-view]'))button.onclick=()=>setRecentView(button.dataset.homeView);
  function render(){
    const data=window.projectHomeData?.()||{templates:[],lastTemplate:null,printer:''};const all=q('phProjects'),recent=q('phRecent');all.replaceChildren();recent.replaceChildren();
    const pinned=new Set(data.pinnedTemplates||[]),hiddenRecent=new Set(data.hiddenRecentTemplates||[]);
    const matches=[...(data.templates||[])].sort((a,b)=>Number(pinned.has(b.file))-Number(pinned.has(a.file))||a.name.localeCompare(b.name));
    const recentItems=matches.filter(x=>!hiddenRecent.has(x.file)).sort((a,b)=>Number(pinned.has(b.file))-Number(pinned.has(a.file))||Number(b.file===data.lastTemplate)-Number(a.file===data.lastTemplate));
    clearPreviewTimers();for(const t of recentItems){const card=buttonFor(t),record=(data.recentFiles||[]).find(item=>item.file===t.file),date=record?.accessedAt?new Date(record.accessedAt):null,stamp=document.createElement('span');stamp.className='ph-recent-date';stamp.textContent=date&&!Number.isNaN(date.getTime())?date.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'—';stamp.title=date?'Last opened':'No recent open date';card.append(stamp);recent.append(card);}setRecentView(recentView);
    for(const t of matches)all.append(buttonFor(t));
    if(!recentItems.length){const e=document.createElement('div');e.className='ph-empty';e.textContent='No labels yet. Create a new label to get started.';recent.append(e);}
    if(!matches.length){const e=document.createElement('div');e.className='ph-empty';e.textContent='No label projects found.';all.append(e);}
    q('phPrinter').textContent=data.printer||'No printer selected';const version=window.appDisplayVersion||'';q('phVersion').textContent=version;q('phFooterVersion').textContent=version?`Version ${version}`:'';
  }
  window.renderStartupHomeSkeleton=templates=>{
    const skeleton=document.getElementById('startupHomeSkeleton');if(!skeleton)return;
    const list=skeleton.querySelector('.sk-projects');if(!list)return;
    list.replaceChildren();const projects=Array.isArray(templates)?templates:[];
    if(projects.length){for(const template of projects){const card=document.createElement('div');card.className='sk-project';card.setAttribute('aria-hidden','true');list.append(card);}}
    else{const empty=document.createElement('div');empty.className='sk-empty';empty.textContent='No labels yet. Create a new label to get started.';list.append(empty);}
  };
  window.showProjectHome=async()=>{if(window.getCloseState?.().dirty&&!await window.prepareEditorNavigation())return false;home.hidden=false;render();return true;};window.hideProjectHome=()=>{home.hidden=true;clearPreviewTimers();};window.refreshProjectHome=render;
  q('phNew').onclick=()=>window.openNewLabelWizard?.();
  q('phOpen').onclick=()=>document.getElementById('importTplBtn').click();
  q('phAll').onclick=()=>{const panel=home.querySelector('.ph-all');panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'start'});q('phSearch').focus();};
  q('phSearch').oninput=()=>{const text=q('phSearch').value.trim().toLowerCase();for(const card of q('phProjects').children)card.hidden=!card.querySelector('b').textContent.toLowerCase().includes(text);};
  q('phSettings').onclick=()=>{ window.hideProjectHome(); document.getElementById('settingsBtn')?.click(); };
})();
