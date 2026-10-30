(function(root){
  'use strict';
  const hoverStyle='.line-controls .rotation-hit.is-tool-hover>circle:first-child,.line-controls .line-move-hit.is-tool-hover>circle:first-child{fill:#e8f7ed;stroke:#16a34a;stroke-width:2}';
  function bindToolHover(root){
    if(!root)return;
    root.querySelectorAll('.rotation-hit:not([data-hover-bound]),.line-move-hit:not([data-hover-bound])').forEach(tool=>{
      tool.dataset.hoverBound='true';
      tool.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen')tool.classList.add('is-tool-hover');});
      tool.addEventListener('pointerleave',()=>tool.classList.remove('is-tool-hover'));
    });
  }
  function render(points,index,pixelsPerMm=1,locked=false,{showEndpoints=true,kind='line',showReset=false,showTools=true}={}){
    const scale=1/Math.max(.01,pixelsPerMm),cx=(points[0].x+points[1].x)/2,top=Math.min(points[0].y,points[1].y),bottom=Math.max(points[0].y,points[1].y);
    const paths={lock:locked?'M6 9V5a4 4 0 0 1 8 0v4M4 9h12v10H4zM10 13v3':'M6 9V5a4 4 0 0 1 8 0M4 9h12v10H4zM10 13v3',duplicate:'M3 3h10v12H3zM7 7h10v12H7zM10 13h4m-2-2v4',delete:'M3 5h14M7 5V2h6v3M5 5l1 14h8l1-14M8 9v6m4-6v6'};
    const labels={lock:(locked?'Unlock ':'Lock ')+kind,duplicate:'Duplicate '+kind,delete:'Delete '+kind};
    const endpoint=showEndpoints?points.map((p,i)=>`<g class="line-endpoint" transform="translate(${p.x} ${p.y}) scale(${scale})"><rect class="line-endpoint-marker" x="-7" y="-7" width="14" height="14" rx="1"/><circle class="line-endpoint-marker" r="5.5"/><circle class="${locked?'line-locked-endpoint':'handle-hit'}" data-handle="${index}" data-anchor="line-${i===0?'start':'end'}" r="12" fill="transparent" style="cursor:crosshair"/></g>`).join(''):'';
    const actions=Object.entries(paths).map(([command,path],i)=>`<g data-line-action="${index}" data-command="${command}" role="button" tabindex="0" aria-label="${labels[command]}" transform="translate(${i*36} 0)" style="cursor:pointer"><title>${labels[command]}</title><rect width="36" height="36" rx="8" fill="transparent"/><path d="${path}" transform="translate(8 8)" fill="none" stroke="${command==='delete'?'#b42318':'#166534'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('');
    const reset=showReset&&!locked?`<g class="reset-hit" data-line-action="${index}" data-command="reset" role="button" tabindex="0" aria-label="Reset to previous" transform="translate(54 0)" style="cursor:pointer"><title>Reset to previous</title><circle r="16" fill="transparent"/><circle r="13" fill="#fff" stroke="#b7dfc4"/><path d="M-6-1a6 6 0 1 1 1 6M-6-6v5h5" fill="none" stroke="#166534" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></g>`:'';
    const tools=locked||!showTools?'':`<g transform="translate(${cx-(showReset?18*scale:0)} ${bottom+38*scale}) scale(${scale})"><g class="rotation-hit" data-rotate="${index}" transform="translate(-18 0)" role="button" aria-label="Rotate ${kind}" style="cursor:grab"><circle r="13" fill="#fff" stroke="#b7dfc4"/><path d="M-5 1a5 5 0 0 1 8-5M3-7v4H-1M5-1a5 5 0 0 1-8 5M-3 7V3H1" fill="none" stroke="#166534" stroke-width="1.2"/></g><g class="line-move-hit" data-line-move="${index}" transform="translate(18 0)" role="button" aria-label="Move ${kind}" style="cursor:move"><circle r="13" fill="#fff" stroke="#b7dfc4"/><path d="M-7 0H7M0-7V7M-4-3l-3 3 3 3M4-3l3 3-3 3M-3-4l3-3 3 3M-3 4l3 3 3-3" fill="none" stroke="#166534" stroke-width="1.2"/></g>${reset}</g>`;
    return `<g class="line-controls">${endpoint}<g transform="translate(${cx-54*scale} ${top-68*scale}) scale(${scale})"><rect width="108" height="36" rx="10" fill="#fff" fill-opacity=".95" stroke="#b7dfc4" stroke-width="1" style="filter:drop-shadow(0 3px 6px #163b2426)"/>${actions}</g>${tools}</g>`;
  }
  const api={render,bindToolHover,hoverStyle};if(typeof module!=='undefined')module.exports=api;root.LineControls=api;
})(typeof window!=='undefined'?window:globalThis);
