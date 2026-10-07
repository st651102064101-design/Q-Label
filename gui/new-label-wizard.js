'use strict';
// New Label flow observed in ZebraDesigner Essentials: printer, paper, layout,
// dimensions, summary. Draft controls do not change the current document.
(() => {
  const dialog = document.createElement('dialog');
  dialog.id = 'newLabelWizard';
  const number = (id, label, value, min = 0) => `<label>${label}<input id="nw${id}" type="number" min="${min}" step="0.001" value="${value}" required></label>`;
  dialog.innerHTML = `<header><span>New Label Setup Wizard</span><button type="button" aria-label="Close">×</button></header>
    <form><div class="nw-heading"><strong></strong><p></p></div><div class="nw-body"><div class="nw-pages">
    <section><label>Printer<select id="nwPrinter"></select></label><fieldset><legend>Printer settings</legend><label>Resolution<select id="nwDpi"><option>203</option><option>300</option><option>600</option></select></label><label>Printer language<select id="nwLanguage"><option value="zpl">ZPL</option></select></label></fieldset></section>
    <section hidden><label class="nw-radio"><input type="radio" name="nwPaper" value="roll" checked>Print on a roll of labels</label><p class="nw-help">Set the dimensions of the label stock used in your thermal printer.</p><label class="nw-radio"><input type="radio" name="nwPaper" value="sheet">Print on a sheet of paper</label><p class="nw-help">Set the paper size and arrange labels across the page.</p><label class="nw-radio"><input type="radio" name="nwPaper" value="stock">Load settings from a predefined stock</label><select id="nwStock" hidden><option value="51,25">51 × 25 mm</option><option value="63.5,63.5">2.5 × 2.5 in</option><option value="102,51">102 × 51 mm</option><option value="102,152">102 × 152 mm</option></select><fieldset id="nwPaperSize" hidden><legend>Paper size (mm)</legend>${number('PaperW','Width',210,0.1)}${number('PaperH','Height',297,0.1)}</fieldset></section>
    <section hidden><fieldset><legend>Orientation</legend><label class="nw-radio"><input type="radio" name="nwOrientation" value="portrait" checked>▯ Portrait</label><label class="nw-radio"><input type="radio" name="nwOrientation" value="landscape">▭ Landscape</label></fieldset><label class="nw-radio"><input id="nwRotated" type="checkbox">Rotated (180°)</label><fieldset><legend>Preview</legend><div class="nw-layout"><div>▣<br>Screen Layout</div><div>▤<br>Printer Layout</div></div></fieldset></section>
    <section hidden><label>Unit of measure<select id="nwUnit"><option value="mm">mm</option><option value="in">in</option></select></label><fieldset><legend>Label Dimensions</legend>${number('Width','Width',51,0.001)}${number('Height','Height',25,0.001)}</fieldset><fieldset><legend>Margins</legend>${number('Left','Left',0)}${number('Top','Top',0)}${number('Right','Right',0)}${number('Bottom','Bottom',0)}</fieldset><fieldset><legend>Labels Across</legend>${number('Columns','Horizontal count',1,1)}${number('GapX','Horizontal gap',0)}${number('Rows','Vertical count',1,1)}${number('GapY','Vertical gap',0)}</fieldset><label>Processing order<select id="nwOrder"><option value="rows">Horizontally — start at top left</option><option value="columns">Vertically — start at top left</option></select></label><label>Label type<select id="nwMedia"><option value="die-cut">Labels with gaps</option><option value="black-mark">Black mark</option><option value="continuous">Continuous</option></select></label></section>
    <section hidden><label>Label name<input id="nwName" value="new-label" required maxlength="100"></label><dl id="nwSummary"></dl></section>
    <p id="nwError" role="alert"></p></div><aside><svg id="nwPreview" viewBox="0 0 200 300" aria-label="Label layout preview"></svg><small id="nwSize"></small></aside></div>
    <footer><button type="button" id="nwCancel">Cancel</button><button type="button" id="nwBack">&lt; Back</button><button type="button" id="nwNext">Next &gt;</button><button type="submit" id="nwFinish">Finish</button></footer></form>`;
  document.body.append(dialog);
  const style = document.createElement('style');
  style.textContent = `#newLabelWizard{padding:0;width:min(700px,95vw);max-height:92vh;border:1px solid #007eaa;border-radius:6px;background:#fff;color:#222;font:13px 'Segoe UI',sans-serif}#newLabelWizard::backdrop{background:rgba(0,0,0,.4)}#newLabelWizard header{background:#007eaa;color:white;display:flex;justify-content:space-between;align-items:center;padding:5px 12px}#newLabelWizard header span{flex:1;text-align:center}#newLabelWizard header button{border:0;background:none;color:white;font-size:20px;padding:0 4px}#newLabelWizard .nw-heading{background:#f2f2f2;padding:12px 16px;border-bottom:1px solid #ccc}#newLabelWizard p{margin:5px 0;line-height:1.4}#newLabelWizard .nw-body{display:grid;grid-template-columns:1fr 190px;gap:16px;padding:16px;min-height:345px;max-height:60vh;overflow:auto}#newLabelWizard label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0}#newLabelWizard input,#newLabelWizard select{background:white;color:#222;border:1px solid #aaa;border-radius:0;padding:4px;min-width:0;font:inherit}#newLabelWizard input[type=number]{width:95px}#newLabelWizard input[type=radio],#newLabelWizard input[type=checkbox]{width:auto;margin:0;accent-color:#007eaa}#newLabelWizard .nw-radio{justify-content:flex-start}#newLabelWizard .nw-help{color:#777;margin:0 0 18px 22px}#newLabelWizard fieldset{border:0;border-top:1px solid #ccc;padding:6px 0;display:grid;grid-template-columns:1fr 1fr;gap:0 15px;margin:12px 0}#newLabelWizard legend{color:#26728c;padding-right:8px}#newLabelWizard aside{background:#e7e7e7;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:8px}#newLabelWizard svg{width:100%;max-height:290px}#newLabelWizard footer{display:flex;justify-content:flex-end;gap:10px;background:#f0f0f0;border-top:1px solid #ccc;padding:14px}#newLabelWizard footer button{min-width:76px;padding:4px 10px;border:1px solid #aaa;border-radius:0;color:#222;background:#fafafa;font:inherit}#newLabelWizard button:focus-visible{outline:2px solid #007eaa;outline-offset:2px}#newLabelWizard button:disabled{opacity:.4}#newLabelWizard [hidden]{display:none!important}#newLabelWizard .nw-layout{display:flex;justify-content:space-around;grid-column:1/-1;text-align:center;padding:20px;font-size:16px}#newLabelWizard dl{display:grid;grid-template-columns:130px 1fr;gap:12px;margin-top:24px}#newLabelWizard dd{margin:0;font-weight:600}#nwError{color:#b42318}@media(max-width:600px){#newLabelWizard .nw-body{grid-template-columns:1fr}#newLabelWizard aside{display:none}}`;
  document.head.append(style);
  const q = id => dialog.querySelector('#nw' + id);
  const pages = [...dialog.querySelectorAll('section')];
  const headings = [
    ['Select the Printer','Select the printer that will be used to print the label.'],
    ['Set the Page Size','Choose roll labels, a sheet of paper, or a predefined stock.'],
    ['Select the Label Layout','Choose the orientation of your label. The preview shows the printed layout.'],
    ['Specify the Label Dimensions','Set label dimensions, margins, and the number of labels on each page.'],
    ['Summary','Review the settings and press Finish to create the label.']
  ];
  let step = 0, unit = 'mm', busy = false;
  const dimensions = ['Width','Height','Left','Top','Right','Bottom','GapX','GapY'];
  const mode = () => dialog.querySelector('[name=nwPaper]:checked').value;
  const val = id => Number(q(id).value);
  const mm = id => val(id) * (unit === 'in' ? 25.4 : 1);
  function geometry() {
    const width = mm('Width'), height = mm('Height'), rows = val('Rows'), columns = val('Columns');
    return {width,height,rows,columns,paperW:mode()==='sheet'?val('PaperW'):mm('Left')+columns*width+(columns-1)*mm('GapX')+mm('Right'),paperH:mode()==='sheet'?val('PaperH'):mm('Top')+rows*height+(rows-1)*mm('GapY')+mm('Bottom')};
  }
  function validate() {
    for(const id of [...dimensions,'Rows','Columns',...(mode()==='sheet'?['PaperW','PaperH']:[])]) if(!q(id).checkValidity()) { q('Error').textContent='Enter valid dimensions and counts.'; return false; }
    const g=geometry();
    if(!Number.isInteger(g.rows)||!Number.isInteger(g.columns)||g.rows*g.columns>1000) {q('Error').textContent='Use whole-number counts, with no more than 1,000 labels per page.';return false;}
    if(mm('Left')+g.columns*g.width+(g.columns-1)*mm('GapX')+mm('Right')>g.paperW+.001 || mm('Top')+g.rows*g.height+(g.rows-1)*mm('GapY')+mm('Bottom')>g.paperH+.001) {q('Error').textContent='The labels and margins exceed the paper size.';return false;}
    q('Error').textContent='';return true;
  }
  function preview() {
    const g=geometry(); if(!(g.paperW>0&&g.paperH>0))return;
    if(window.PaperPreview){const aside=q('Preview').parentElement;window.PaperPreview.render(aside,{width_mm:g.width,height_mm:g.height,page:{enabled:true,width_mm:g.paperW,height_mm:g.paperH,rows:g.rows,columns:g.columns,left_mm:mm('Left'),top_mm:mm('Top'),gap_x_mm:mm('GapX'),gap_y_mm:mm('GapY')}},unit);aside.querySelector('svg').id='nwPreview';const size=aside.querySelector('small');size.id='nwSize';return;}
    const scale=Math.min(175/g.paperW,250/g.paperH), x=(200-g.paperW*scale)/2, y=(300-g.paperH*scale)/2;
    let svg=`<rect x="${x}" y="${y}" width="${g.paperW*scale}" height="${g.paperH*scale}" fill="white" stroke="#444"/>`;
    for(let row=0;row<Math.min(g.rows,30);row++)for(let col=0;col<Math.min(g.columns,30);col++)svg+=`<rect x="${x+(mm('Left')+col*(g.width+mm('GapX')))*scale}" y="${y+(mm('Top')+row*(g.height+mm('GapY')))*scale}" width="${g.width*scale}" height="${g.height*scale}" fill="none" stroke="#007eaa" stroke-width=".7"/>`;
    q('Preview').innerHTML=svg;q('Size').textContent=`${(g.width/(unit==='in'?25.4:1)).toFixed(3)} × ${(g.height/(unit==='in'?25.4:1)).toFixed(3)} ${unit}`;
  }
  function render() {
    pages.forEach((p,i)=>p.hidden=i!==step);
    dialog.querySelector('.nw-heading strong').textContent=headings[step][0];dialog.querySelector('.nw-heading p').textContent=headings[step][1];
    q('Back').disabled=step===0||busy;q('Next').disabled=step===4||busy;q('Finish').disabled=busy;
    if(step===4){const g=geometry();const rows=[['Printer',q('Printer').value||'Not selected'],['Resolution',q('Dpi').value+' dpi'],['Label dimensions',q('Size').textContent],['Paper dimensions',`${(g.paperW/(unit==='in'?25.4:1)).toFixed(3)} × ${(g.paperH/(unit==='in'?25.4:1)).toFixed(3)} ${unit}`],['Labels across',`${g.columns} × ${g.rows}`]];q('Summary').replaceChildren(...rows.flatMap(([k,v])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;return[dt,dd];}));}
    preview();
  }
  function close(){if(!busy)dialog.close();}
  dialog.querySelector('header button').onclick=close;q('Cancel').onclick=close;
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  q('Back').onclick=()=>{step--;q('Error').textContent='';render();};
  q('Next').onclick=()=>{if(step===3&&!validate())return;step++;render();};
  q('Unit').onchange=()=>{const next=q('Unit').value;for(const id of dimensions)q(id).value=+(val(id)*(unit==='in'?25.4:1)/(next==='in'?25.4:1)).toFixed(6);unit=next;preview();};
  dialog.querySelectorAll('[name=nwPaper]').forEach(r=>r.onchange=()=>{q('Stock').hidden=mode()!=='stock';q('PaperSize').hidden=mode()!=='sheet';preview();});
  q('Stock').onchange=()=>{const [w,h]=q('Stock').value.split(',').map(Number);q('Width').value=w/(unit==='in'?25.4:1);q('Height').value=h/(unit==='in'?25.4:1);preview();};
  dialog.querySelectorAll('[name=nwOrientation]').forEach(r=>r.onchange=()=>{const w=q('Width').value;q('Width').value=q('Height').value;q('Height').value=w;preview();});
  q('Printer').onchange=()=>{const match=q('Printer').value.match(/(203|300|600)\s*dpi/i);if(match)q('Dpi').value=match[1];};
  dialog.addEventListener('input',preview);
  dialog.querySelector('form').onsubmit=async event=>{
    event.preventDefault();if(busy)return;if(!validate()){step=3;render();return;}if(!q('Name').value.trim()){step=4;render();q('Name').focus();return;}
    busy=true;render();try{
      await persistEditor();rememberPrintPage();
      const g=geometry(),tpl=blankTemplate();Object.assign(tpl,{name:q('Name').value.trim(),elements:[],values:{},field_meta:{},unit,dpi:val('Dpi'),language:q('Language').value,width_mm:g.width,height_mm:g.height,print_orientation:q('Rotated').checked?'inverted':'normal',print_order:q('Order').value,stock:{name:mode()==='stock'?q('Stock').selectedOptions[0].textContent:'Custom',type:q('Media').value,liner_left_mm:0,liner_right_mm:0},media_tracking:{'die-cut':'Y','black-mark':'M',continuous:'N'}[q('Media').value],page:{enabled:true,manual_template:true,unit,width_mm:g.paperW,height_mm:g.paperH,rows:g.rows,columns:g.columns,left_mm:mm('Left'),right_mm:mm('Right'),top_mm:mm('Top'),bottom_mm:mm('Bottom'),gap_x_mm:mm('GapX'),gap_y_mm:mm('GapY')}});
      if(q('Printer').value){el('printerSelect').value=q('Printer').value;await window.zebra.saveSettings({printer:q('Printer').value});settings.printer=q('Printer').value;updateConnSummary();}
      current=null;rawTemplate=null;editing=null;openEditor(tpl);dialog.close();window.hideProjectHome?.();
    }catch(error){q('Error').textContent=error.message||String(error);}finally{busy=false;render();}
  };
  window.openNewLabelWizard=()=>{
    if(dialog.open)return;dialog.querySelector('form').reset();step=0;busy=false;unit='mm';q('Unit').value=unit;q('Error').textContent='';q('PaperSize').hidden=true;q('Stock').hidden=true;
    q('Printer').replaceChildren(...[...el('printerSelect').options].map(o=>o.cloneNode(true)));q('Printer').value=el('printerSelect').value;
    q('Dpi').value=String(editing?.dpi||300);q('Printer').onchange();preview();render();dialog.showModal();
  };
})();
