'use strict';
const fs=require('fs');
function edit(file,fn){const raw=fs.readFileSync(file,'utf8'),crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');s=fn(s);fs.writeFileSync(file,crlf?s.replace(/\n/g,'\r\n'):s);}
const rep=(s,a,b)=>{if(s.split(a).length!==2)throw Error('count '+s.split(a).length+' '+a.slice(0,80));return s.replace(a,()=>b);};
const NOT_YET='Not available in Q LABEL yet';

const SUBS=`<div class="nw-bg-sub" id="nwBgColorPage" hidden><div class="nw-bg-row"><label for="nwBgColorButton">Background color:</label><button type="button" id="nwBgColorButton" aria-haspopup="dialog"><span class="nw-bg-swatch" id="nwBgColorSwatch"></span><span id="nwBgColorName">None</span><span class="nw-bg-arrow" aria-hidden="true">▾</span></button></div><fieldset class="nw-bg-options" disabled title="${NOT_YET}"><legend>Options</legend><label><input type="checkbox" disabled><span>Preprinted</span></label><label><span>Print when:</span><select disabled><option>Always</option></select></label><label><span>Overhang template:</span><input disabled value="0.0" size="5"><span class="nw-bg-unit">in</span></label></fieldset></div>`+
`<div class="nw-bg-sub" id="nwBgPicturePage" hidden><div class="nw-bg-row"><label for="nwBgPictureSource">Source:</label><select id="nwBgPictureSource"><option value="none">No Picture</option><option value="embedded">Embedded Picture</option><option value="linked" disabled title="${NOT_YET}">Linked Picture</option></select></div><div class="nw-bg-row" id="nwBgPictureFileRow" hidden><label for="nwBgPictureBrowse">Picture:</label><button type="button" id="nwBgPictureBrowse">Browse…</button><span id="nwBgPictureName" class="nw-bg-filename"></span></div><div class="nw-bg-row"><label for="nwBgSizeMethod">Size method:</label><select id="nwBgSizeMethod" disabled><option>Stretch</option></select></div><div class="nw-bg-row"><label for="nwBgRotation">Rotation:</label><select id="nwBgRotation" disabled><option>0°</option><option disabled>90°</option><option disabled>180°</option><option disabled>270°</option></select></div><fieldset class="nw-bg-options" disabled title="${NOT_YET}"><legend>Options</legend><label><input type="checkbox" disabled><span>Preprinted</span></label><label><span>Print when:</span><input disabled></label><label><span>Overhang template:</span><input disabled value="0.0" size="5"><span class="nw-bg-unit">in</span></label></fieldset><div class="nw-bg-buttons"><button type="button" disabled title="${NOT_YET}">Image Processing…</button><button type="button" disabled title="${NOT_YET}">Error Handling…</button><button type="button" disabled title="${NOT_YET}">Apply Image Processing Permanently</button></div></div>`+
`<div class="nw-bg-sub" id="nwBgGuidePage" hidden><p>To make it easier to design your template, you can add a scanned image of a sample printed item and display it as a guide to help you position and size objects. This image does not appear on printed items.</p><fieldset class="nw-bg-source"><legend>Get Image From</legend><button type="button" id="nwBgGuideFile">File…</button><button type="button" disabled title="${NOT_YET}">Scanner or Camera…</button></fieldset><div id="nwBgGuideName" class="nw-bg-filename"></div><div class="nw-bg-row"><label for="nwBgGuideColor">Color:</label><select id="nwBgGuideColor" disabled title="${NOT_YET}"><option>Blue</option></select></div><label class="nw-bg-check"><input type="checkbox" id="nwBgGuideHide" disabled><span>Hide design guide image</span></label><p class="nw-bg-hint">Use this option to temporarily suppress the display of the image.</p><button type="button" id="nwBgGuideRemove" disabled>Remove Design Guide Image</button><p class="nw-bg-hint">Use this option when you are done with the image to reduce memory usage.</p><button type="button" disabled title="${NOT_YET}">Image Processing…</button></div>`;

const CSS=`#newLabelWizard .nw-bg-sub{font:11px Arial,sans-serif;color:#111;padding:10px 4px}#newLabelWizard .nw-bg-sub[hidden]{display:none}#newLabelWizard .nw-bg-row{display:flex;align-items:center;gap:10px;margin:0 0 10px}#newLabelWizard .nw-bg-row>label{min-width:96px}#newLabelWizard .nw-bg-row select{min-width:200px;font:11px Arial,sans-serif}#newLabelWizard #nwBgColorButton{display:inline-flex;align-items:center;gap:8px;min-width:150px;min-height:0;padding:3px 6px;border:1px solid #7a8a99;border-radius:2px;background:#fff;cursor:pointer;font:11px Arial,sans-serif}#newLabelWizard .nw-bg-swatch{width:16px;height:12px;border:1px solid #6b7785;background:linear-gradient(135deg,#fff 45%,#dc2626 46% 54%,#fff 55%)}#newLabelWizard .nw-bg-arrow{margin-left:auto;font-size:10px}#newLabelWizard .nw-bg-options{margin:10px 0;padding:6px 10px;border:0;border-top:1px solid #aaa;color:#777}#newLabelWizard .nw-bg-options label{display:flex;align-items:center;gap:8px;margin:6px 0}#newLabelWizard .nw-bg-buttons{display:flex;flex-wrap:wrap;gap:6px}#newLabelWizard .nw-bg-sub button{min-height:0;padding:4px 12px;font:11px Arial,sans-serif}#newLabelWizard .nw-bg-source{display:flex;gap:8px;padding:8px;margin:0 0 10px;border:1px solid #bbb}#newLabelWizard .nw-bg-filename{margin:0 0 8px;color:#335;word-break:break-all}#newLabelWizard .nw-bg-hint{margin:2px 0 10px 20px;font:11px Arial,sans-serif;color:#333}#newLabelWizard .nw-bg-check{display:flex;align-items:center;gap:6px;margin:6px 0 0}`;

edit('gui/new-label-wizard.js',s=>{
  // 1. sub-pages inside the Template Background section
  s=rep(s,'aria-label="Design guide image" disabled></fieldset></section>','aria-label="Design guide image" disabled></fieldset>'+SUBS.replace(/\$/g,'$$$$')+'</section>');
  // 2. state + helpers before render
  s=rep(s,"  function render() {\n    pages.forEach((p,i)=>p.hidden=i!==step);",
`  // Template Background sub-pages: one per ticked feature, in Color, Picture, Design Guide order.
  const BG_PAGES=[['color','BackgroundColorEnabled','nwBgColorPage','Template Background Color','Select a color for your template background.'],['picture','BackgroundPictureEnabled','nwBgPicturePage','Template Background Picture','Select a picture for your template background.'],['guide','BackgroundGuideEnabled','nwBgGuidePage','Design Guide Image','Select a design guide image to display in the background.']];
  let bgSub=-1,bgColorValue=null,bgGuideName='';
  const activeBgPages=()=>BG_PAGES.filter(page=>q(page[1]).checked);
  const bgPictureEmbedded=()=>q('BgPictureSource').value==='embedded';
  function syncBackgroundPages(){
    const list=activeBgPages(),current=step===7&&bgSub>=0?list[bgSub]:null;
    const main=dialog.querySelector('#nwTemplateBackground>fieldset');if(main)main.hidden=!!current;
    for(const page of BG_PAGES)q(page[2]).hidden=!(current&&current[0]===page[0]);
    q('BgColorName').textContent=bgColorValue||'None';q('BgColorSwatch').style.background=bgColorValue||'';
    q('BgPictureFileRow').hidden=!bgPictureEmbedded();
    q('BgPictureName').textContent=q('BackgroundPicture').files[0]?.name||'';
    q('BgSizeMethod').disabled=!bgPictureEmbedded()||!q('BackgroundPicture').files[0];
    q('BgRotation').disabled=!bgPictureEmbedded()||!q('BackgroundPicture').files[0];
    const hasGuide=!!q('BackgroundGuide').files[0];
    q('BgGuideName').textContent=hasGuide?q('BackgroundGuide').files[0].name:'';
    q('BgGuideHide').disabled=!hasGuide;q('BgGuideRemove').disabled=!hasGuide;
  }
  function render() {
    pages.forEach((p,i)=>p.hidden=i!==step);`);
  // 3. heading override
  s=rep(s,"dialog.querySelector('.nw-heading strong').textContent=headings[step][0];dialog.querySelector('.nw-heading p').textContent=headings[step][1];",
    "{const sub=step===7&&bgSub>=0?activeBgPages()[bgSub]:null;dialog.querySelector('.nw-heading strong').textContent=sub?sub[3]:headings[step][0];dialog.querySelector('.nw-heading p').textContent=sub?sub[4]:headings[step][1];syncBackgroundPages();}");
  // 4. navigation
  s=rep(s,"q('Back').onclick=()=>{step--;q('Error').textContent='';render();};",
    "q('Back').onclick=()=>{if(step===7&&bgSub>=0)bgSub--;else if(step===8){step=7;bgSub=activeBgPages().length-1;}else step--;q('Error').textContent='';render();};");
  s=rep(s,"step++;q('Error').textContent='';render();if(step===2)applyDefaultStockCategory();};",
    "if(step===7&&bgSub<activeBgPages().length-1){bgSub++;q('Error').textContent='';render();return;}step++;if(step===7)bgSub=-1;q('Error').textContent='';render();if(step===2)applyDefaultStockCategory();};");
  s=rep(s,"libraryPageHeightIn=11;step=0;busy=false;","libraryPageHeightIn=11;step=0;bgSub=-1;bgColorValue=null;busy=false;");
  // 5. checkbox behaviour: ticking only enables the page
  s=rep(s,"checkbox.onchange=()=>{input.disabled=!checkbox.checked;if(checkbox.checked)input.click();preview();};optionLabel.addEventListener('click',event=>{if(event.target.closest('span')&&checkbox.checked){event.preventDefault();input.click();}});}",
    "checkbox.onchange=()=>{bgSub=-1;preview();};}");
  // 6. sub-page controls
  s=rep(s,"  q('BackgroundColor').oninput=preview;",
`  q('BackgroundColor').oninput=preview;
  q('BgColorButton').onclick=()=>{
    if(!window.ColorPicker)return;
    window.ColorPicker.open(q('BgColorButton'),{value:bgColorValue||'#ffffff',allowNone:true,onPick:hex=>{bgColorValue=hex;q('BackgroundColor').value=hex;syncBackgroundPages();preview();},onNone:()=>{bgColorValue=null;syncBackgroundPages();preview();}});
  };
  q('BgPictureSource').onchange=()=>{if(!bgPictureEmbedded()){q('BackgroundPicture').value='';backgroundPictureData=null;}syncBackgroundPages();preview();};
  q('BgPictureBrowse').onclick=()=>q('BackgroundPicture').click();
  q('BgGuideFile').onclick=()=>q('BackgroundGuide').click();
  q('BackgroundGuide').onchange=()=>{q('BgGuideHide').checked=false;syncBackgroundPages();};
  q('BgGuideRemove').onclick=()=>{q('BackgroundGuide').value='';q('BgGuideHide').checked=false;syncBackgroundPages();};`);
  // picture onchange should refresh the page
  s=rep(s,"q('BackgroundPicture').onchange=()=>{const file=q('BackgroundPicture').files[0];if(!file){backgroundPictureData=null;preview();return;}","q('BackgroundPicture').onchange=()=>{const file=q('BackgroundPicture').files[0];syncBackgroundPages();if(!file){backgroundPictureData=null;preview();return;}");
  // 7. preview + submit use the new state
  s=rep(s,"background_color:q('BackgroundColorEnabled').checked?q('BackgroundColor').value:'#ffffff',background_picture:q('BackgroundPictureEnabled').checked?backgroundPictureData:null","background_color:q('BackgroundColorEnabled').checked&&bgColorValue?bgColorValue:'#ffffff',background_picture:q('BackgroundPictureEnabled').checked&&bgPictureEmbedded()?backgroundPictureData:null");
  s=rep(s,"if(q('BackgroundColorEnabled').checked){tpl.elements.push({type:'rectangle',name:'Background Color',x_mm:0,y_mm:0,width_mm:g.width,height_mm:g.height,fill:q('BackgroundColor').value,stroke:'none'});}",
    "if(q('BackgroundColorEnabled').checked&&bgColorValue){tpl.elements.push({type:'rectangle',name:'Background Color',x_mm:0,y_mm:0,width_mm:g.width,height_mm:g.height,fill:bgColorValue,stroke:'none'});}");
  s=rep(s,"if(q('BackgroundPictureEnabled').checked&&q('BackgroundPicture').files[0]){","if(q('BackgroundPictureEnabled').checked&&bgPictureEmbedded()&&q('BackgroundPicture').files[0]){");
  s=rep(s,"tpl.design_guide_image=data;}","tpl.design_guide_image=data;tpl.design_guide_hidden=!!q('BgGuideHide').checked;}");
  // css
  s=rep(s,"  function render() {\n    pages.forEach","  style.textContent+="+JSON.stringify(CSS)+";\n  function render() {\n    pages.forEach");
  return s;});

// editor shows the design guide under the objects, never in prints
edit('gui/preview.js',s=>rep(s,"    const elementBoxes = computeBoxes(template, data);\n    (template.elements || []).forEach((el, i) => {",
"    if (extras?.editorPlaceholders && template.design_guide_image && !template.design_guide_hidden && /^data:image\\//.test(template.design_guide_image)) {\n      body += `<image data-design-guide=\"true\" x=\"0\" y=\"0\" width=\"${templateW}\" height=\"${templateH}\" href=\"${esc(template.design_guide_image)}\" preserveAspectRatio=\"none\" opacity=\".5\" style=\"pointer-events:none\"/>`;\n    }\n    const elementBoxes = computeBoxes(template, data);\n    (template.elements || []).forEach((el, i) => {"));
console.log('ok');
