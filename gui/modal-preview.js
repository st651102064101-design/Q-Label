'use strict';
(() => {
  let sequence=0;
  function render(target,template,unit='mm',artwork=false,workspace=false){
    if(!template)return;
    const page=template.page?.enabled?template.page:null;
    const w=Number(page?.width_mm||template.width_mm),h=Number(page?.height_mm||template.height_mm);
    if(!(w>0&&h>0)){target.textContent='Enter valid paper dimensions.';return;}
    const scale=Math.min(198/w,240/h),x=(250-w*scale)/2,y=(340-h*scale)/2,id='mp'+(++sequence);
    let labels='';const rows=Math.min(30,Math.max(1,page?.rows||1)),cols=Math.min(30,Math.max(1,page?.columns||1));
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const lx=x+((page?.left_mm||0)+c*(template.width_mm+(page?.gap_x_mm||0)))*scale,ly=y+((page?.top_mm||0)+r*(template.height_mm+(page?.gap_y_mm||0)))*scale;
      labels+=`<rect x="${lx}" y="${ly}" width="${template.width_mm*scale}" height="${template.height_mm*scale}" fill="white" stroke="#222" stroke-width=".8"/>`;
      if(artwork&&window.LabelPreview)labels+=window.LabelPreview.renderPreviewSVG({...template,background:template.print_background?template.background:null},typeof sampleData==='function'?sampleData(template):template.values||{},null,typeof qrCache==='undefined'?{}:qrCache,workspace?{before:typeof gridSVG==='function'?gridSVG(template.width_mm,template.height_mm):''}:{}).replace('<svg ',`<svg x="${lx}" y="${ly}" width="${template.width_mm*scale}" height="${template.height_mm*scale}" `);
    }
    const edge=x+w*scale,bottom=y+h*scale;
    let marks=`M${x-5} ${y-20}V${bottom+20}M${edge+5} ${y-20}V${bottom+20}M${x} ${y-7}H${edge}M${x} ${bottom+7}H${edge}`;
    for(let c=0;c<=cols;c++){const t=x+((page?.left_mm||0)+c*(template.width_mm+(page?.gap_x_mm||0))-(c===cols?(page?.gap_x_mm||0):0))*scale;marks+=`M${t} ${y-20}V${y-5}M${t} ${bottom+5}V${bottom+20}`;}
    const divisor=unit==='in'?25.4:1,fmt=v=>(v/divisor).toFixed(unit==='in'?3:2);
    const left=Number(page?.left_mm)||0,right=Number(page?.right_mm)||0,top=Number(page?.top_mm)||0,bottomMargin=Number(page?.bottom_mm)||0;
    const labelLeft=x+left*scale,labelRight=x+(w-right)*scale,labelTop=y+top*scale,labelBottom=y+(h-bottomMargin)*scale;
    const marginMark=(x1,y1,x2,y2,value,label,horizontal)=>value>0?`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="margin-dimension" marker-start="url(#${id}arrow)" marker-end="url(#${id}arrow)"/><text x="${(x1+x2)/2}" y="${(y1+y2)/2+(horizontal?-2:0)}" class="margin-dimension-label" text-anchor="middle">${label} ${fmt(value)}</text>`:'';
    const dimensions=marginMark(x+w*scale/2,y,x+w*scale/2,labelTop,top,'Top',false)+marginMark(x,y+h*scale/2,labelLeft,y+h*scale/2,left,'Left',true)+marginMark(labelRight,y+h*scale/2,edge,y+h*scale/2,right,'Right',true)+marginMark(x+w*scale/2,labelBottom,x+w*scale/2,bottom,bottomMargin,'Bottom',false);
    target.innerHTML=`<svg viewBox="0 0 250 340" role="img" aria-label="Paper and label layout preview"><defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="#c7daed"/><stop offset="1" stop-color="#87a3be"/></linearGradient><marker id="${id}arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M 8 1 L 1 4 L 8 7" fill="none" stroke="#252a30" stroke-width="1.5"/></marker><filter id="${id}s"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity=".3"/></filter><clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w*scale}" height="${h*scale}"/></clipPath></defs><rect width="250" height="340" fill="url(#${id})"/><rect x="${x}" y="${y}" width="${w*scale}" height="${h*scale}" fill="white" stroke="#333" filter="url(#${id}s)"/><g clip-path="url(#${id}c)">${labels}</g><path d="${marks}" fill="none" stroke="#30363c" stroke-width=".8"/><g class="margin-dimensions">${dimensions}</g></svg><small>Page Size: ${fmt(w)} × ${fmt(h)} ${unit}<br>Template Size: ${fmt(template.width_mm)} × ${fmt(template.height_mm)} ${unit}</small>`;
    if(workspace){
      const svg=target.querySelector('svg'),back=svg.querySelector(':scope > rect');
      back.setAttribute('fill',document.getElementById('previewBackgroundColor')?.value||'#4b5563');
      const fixedNav=document.body.classList.contains('navbar-fixed'),fixedRuler=document.body.classList.contains('ruler-fixed');
      let chrome='';
      if(fixedNav)chrome+='<rect width="250" height="29" fill="white"/><text x="7" y="8" font-size="5" fill="#263547">File    Home    Insert    Layout    Data    View</text><path d="M8 14h7v9H8z M24 16h10v7H24z M44 14v9m-3-3 3 3 3-3 M60 15h8v8h-8z" fill="none" stroke="#263547" stroke-width="1"/>';
      if(fixedRuler){const top=fixedNav?29:0;chrome+=`<rect y="${top}" width="250" height="10" fill="#c8d2de"/><rect y="${top+10}" width="10" height="${330-top}" fill="#c8d2de"/><path d="${Array.from({length:25},(_,i)=>`M${i*10} ${top+10}v-${i%5?3:6}`).join(' ')}" stroke="#526174" stroke-width=".5"/>`;}
      svg.insertAdjacentHTML('beforeend',chrome);
      const note=document.createElement('small');note.textContent=`Navbar: ${fixedNav?'Fixed':'Auto-hide'} · Ruler: ${fixedRuler?'Fixed':'Auto-hide'} · Grid: ${document.getElementById('chkGrid')?.checked?'On':'Off'}`;target.append(note);
    }
  }
  window.PaperPreview={render};
  const style=document.createElement('style');style.textContent='.modal-preview-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;align-items:start}.modal-paper-preview{padding:12px;min-width:0;position:sticky;top:0;text-align:center}.modal-paper-preview>svg{width:100%;height:340px;display:block;border:1px solid #88939e}.modal-paper-preview small{display:block;font-size:11px;line-height:1.8;margin-top:9px;color:var(--text)}.margin-dimension{stroke:#252a30;stroke-width:.85;fill:none}.margin-dimension-label{fill:#252a30;font:5px "Segoe UI",sans-serif;paint-order:stroke;stroke:#c7daed;stroke-width:1.4;stroke-linejoin:round}#pageSetupDialog main{min-width:0}#stockPreview,#stockSizeNote{display:none!important}#newLabelWizard .nw-body{grid-template-columns:minmax(0,1fr) 260px}#newLabelWizard aside{display:block;background:none;padding:0}#newLabelWizard aside svg{max-height:none;height:340px}#newLabelWizard{width:min(850px,96vw)}@media(max-width:650px){.modal-preview-layout{grid-template-columns:minmax(0,1fr) 180px}.modal-paper-preview{padding:6px}.modal-paper-preview>svg{height:250px}#newLabelWizard .nw-body{grid-template-columns:minmax(0,1fr) 180px}#newLabelWizard aside{display:block}}';document.head.append(style);
  function attach(dialog,content,provider,artwork=false){
    if(!content)return;const wrapper=document.createElement('div');wrapper.className='modal-preview-layout';content.before(wrapper);wrapper.append(content);const aside=document.createElement('aside');aside.className='modal-paper-preview';wrapper.append(aside);
    const workspace=dialog.querySelector('header strong')?.textContent==='Preview Settings';
    const update=()=>{if(dialog.open)render(aside,provider(),typeof measureUnit==='function'?measureUnit():'mm',artwork,workspace);};
    new MutationObserver(update).observe(dialog,{attributes:true,attributeFilter:['open']});dialog.addEventListener('input',()=>queueMicrotask(update));dialog.addEventListener('change',()=>queueMicrotask(update));dialog.addEventListener('click',()=>queueMicrotask(update));
    new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});
    document.addEventListener('preview-updated',update);
  }
  window.PaperPreview.attach=attach;
  attach(document.getElementById('pageSetupDialog'),document.querySelector('#pageSetupDialog main'),()=>editing);
  for(const dialog of document.querySelectorAll('.workspace-dialog'))if(!/History/.test(dialog.querySelector('header strong')?.textContent||''))attach(dialog,dialog.querySelector('.dialog-body'),()=>editing,true);
})();
