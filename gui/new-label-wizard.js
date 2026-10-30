'use strict';
// New Label flow observed in ZebraDesigner Essentials: printer, paper, layout,
// dimensions, summary. Draft controls do not change the current document.
(() => {
  const dialog = document.createElement('dialog');
  dialog.id = 'newLabelWizard';
  dialog.dataset.fixedSize = 'true';
  dialog.dataset.hideMinimize = 'true';
  const number = (id, label, value, min = 0) => `<label>${label}<input id="nw${id}" type="number" min="${min}" step="${id==='Rows'||id==='Columns'?'1':'any'}" value="${value}" required></label>`;
  dialog.innerHTML = `<header><span class="nw-window-title"><img class="nw-brand-icon" src="assets/branding/abss-mark.svg" alt="ABSS">New Document Wizard</span><button type="button" aria-label="Close">×</button></header>
    <form><div class="nw-heading"><img class="nw-heading-art" src="assets/branding/new-document-banner.svg" alt="" aria-hidden="true"><div class="nw-heading-copy"><strong></strong><p></p></div></div><div class="nw-body"><div class="nw-pages">
    <section id="nwStartingPoint" class="nw-starting-point"><p class="nw-start-help">You can start from a blank template, or a pre-designed template from a library of several common standards.</p><fieldset><legend>Starting Point:</legend><label><input type="radio" id="nwBlankTemplate" name="nwStartingPoint" value="blank" checked>Blank template</label><label class="nw-radio nw-library-choice"><input type="radio" id="nwTemplateLibrary" name="nwStartingPoint" value="library">Select template from library</label></fieldset><p class="nw-library-notice">Template library requires active maintenance or subscription.<br>Active until 01/02/2027</p><button id="nwSelectTemplate" type="button" disabled>Select…</button><p id="nwLibraryDocument" class="nw-library-document" hidden></p><label id="nwDataEntryWrap" class="nw-radio nw-data-entry" hidden><input type="checkbox" id="nwDataEntryForm">Enable data entry form</label></section>
    <section id="nwPrinterSelection"><label for="nwPrinter">Printer</label><div class="nw-printer-picker"><select id="nwPrinter" size="8" aria-label="Printer"></select><div class="nw-printer-actions"><button type="button" id="nwDocumentProperties">Document Properties…</button><button type="button" id="nwPrinterProperties">Printer Properties…</button></div></div></section>
    <section id="nwStockSelection" class="nw-stock-selection" hidden><p class="nw-stock-help">A stock specifies the size of the page, and the size, number, and position of the items on the page. You may select a predefined stock or specify your own custom settings.</p><div class="nw-stock-mode"><label class="nw-radio"><input type="radio" id="nwStockCustom" name="nwStockMode" value="custom" checked>Specify custom settings</label><label class="nw-radio"><input type="radio" id="nwStockPredefined" name="nwStockMode" value="predefined">Use a predefined stock</label></div><div id="nwPredefinedStock" class="nw-stock-fields"><label><span>Category:</span><select id="nwStockCategory" disabled></select></label><label><span>Stock name:</span><select id="nwStockList" size="8" aria-label="Stock name" disabled></select></label></div><div id="nwCustomStock"></div><input type="hidden" id="nwPaperW" value="210"><input type="hidden" id="nwPaperH" value="297"></section>
    <section id="nwItemsPerPage" class="nw-items-page" hidden><p class="nw-items-help">Most media has only a single item (label, card, tag, etc.) per page of stock. Some media, however, are more complex and have multiple items on a page.</p><div class="nw-item-modes"><label class="nw-radio"><input type="radio" id="nwSingleItem" name="nwItemsMode" value="single" checked>Single item per page</label><label class="nw-radio"><input type="radio" id="nwMultipleItems" name="nwItemsMode" value="multiple">Multiple columns and/or rows of items per page</label></div><fieldset id="nwItemCounts" disabled><label>Rows<input id="nwRows" type="number" min="1" max="1000" step="1" value="1" required></label><label>Columns<input id="nwColumns" type="number" min="1" max="1000" step="1" value="1" required></label></fieldset></section>
    <div id="nwDimensionsBackend" hidden aria-hidden="true"><label class="nw-visually-hidden">Unit of measure<select id="nwUnit"><option value="in">in</option><option value="mm">mm</option></select></label><fieldset><legend>Margins</legend>${number('Left','Left',0)}${number('Top','Top',0)}${number('Right','Right',0)}${number('Bottom','Bottom',0)}</fieldset><fieldset><legend>Spacing</legend>${number('GapX','Horizontal gap',0)}${number('GapY','Vertical gap',0)}</fieldset><label>Processing order<select id="nwOrder"><option value="rows">Horizontally — start at top left</option><option value="columns">Vertically — start at top left</option></select></label><label>Label type<select id="nwMedia"><option value="die-cut">Labels with gaps</option><option value="black-mark">Black mark</option><option value="continuous">Continuous</option></select></label></div>
    <section id="nwSideEdges" class="nw-side-edges" hidden><p>Does your stock have a small amount of unused material between the edge of the item and the edge of the page?</p><div class="nw-edge-choice"><label class="nw-radio"><input type="radio" id="nwSideEdgesYes" name="nwSideEdges" value="yes" checked>Yes, it does have some unused material on the sides</label><label class="nw-radio"><input type="radio" id="nwSideEdgesNo" name="nwSideEdges" value="no">No, it does not</label></div><fieldset id="nwEdgeWidths"><legend>Width of Unused Area:</legend><label class="nw-edge-row"><span class="nw-edge-text"><span class="nw-u">L</span>eft:</span><input id="nwEdgeLeft" type="number" min="0" step="any" value="0.05" required><span class="nw-edge-unit">in</span></label><label class="nw-edge-row"><span class="nw-edge-text"><span class="nw-u">R</span>ight:</span><input id="nwEdgeRight" type="number" min="0" step="any" value="0.05" required><span class="nw-edge-unit">in</span></label></fieldset></section>
    <section id="nwPrintedItemShape" class="nw-printed-item-shape" hidden><div class="nw-shape-options"><label><svg viewBox="0 0 36 30" aria-hidden="true"><rect x="2" y="2" width="32" height="26" fill="#fff" stroke="#333"/></svg><input type="radio" id="nwPrintedShapeRectangle" name="nwPrintedItemShape" value="rectangle"><span>Rectangle</span></label><label><svg viewBox="0 0 36 30" aria-hidden="true"><rect x="2" y="2" width="32" height="26" rx="7" fill="#fff" stroke="#333"/></svg><input type="radio" id="nwPrintedShapeRounded" name="nwPrintedItemShape" value="rounded" checked><span>Rounded rectangle</span></label><label><svg viewBox="0 0 36 30" aria-hidden="true"><ellipse cx="18" cy="15" rx="16" ry="13" fill="#fff" stroke="#333"/></svg><input type="radio" id="nwPrintedShapeEllipse" name="nwPrintedItemShape" value="ellipse"><span>Ellipse</span></label><label><svg viewBox="0 0 36 30" aria-hidden="true"><circle cx="18" cy="15" r="13" fill="#fff" stroke="#333"/></svg><input type="radio" id="nwPrintedShapeCircle" name="nwPrintedItemShape" value="circle"><span>Circle</span></label></div></section>
    <section id="nwTemplateSize" class="nw-template-size" hidden><label class="nw-template-preset"><span>Template size</span><select id="nwTemplateSizePreset" aria-label="Template size"><option value="user">User Defined Size</option><option value="2x4">2 x 4</option><option value="4x4" selected>4 x 4</option><option value="4x6">4 x 6</option></select></label><div class="nw-template-dims"><label class="nw-template-dim"><span class="nw-template-dim-label">Width:</span><input id="nwWidth" type="number" min="0.1" step="any" value="4" required></label><label class="nw-template-dim"><span class="nw-template-dim-label">Height:</span><input id="nwHeight" type="number" min="0.1" step="any" value="4" required></label></div><p class="nw-template-note">Note: Do not include any of the unused area surrounding the item.</p><fieldset class="nw-template-orientation"><legend>Orientation</legend><div class="nw-orientation-body"><div class="nw-orientation-radios"><label class="nw-radio"><input type="radio" id="nwOrientPortrait" name="nwTemplateOrientation" value="portrait" checked>Portrait</label><label class="nw-radio"><input type="radio" id="nwOrientLandscape" name="nwTemplateOrientation" value="landscape">Landscape</label><label class="nw-radio"><input type="radio" id="nwOrientPortrait180" name="nwTemplateOrientation" value="portrait180">Portrait 180</label><label class="nw-radio"><input type="radio" id="nwOrientLandscape180" name="nwTemplateOrientation" value="landscape180">Landscape 180</label></div><svg class="nw-orientation-printer" viewBox="0 0 88 76" aria-hidden="true" focusable="false"><rect x="8" y="44" width="72" height="24" rx="2" fill="#d9dee5" stroke="#5c6773"/><rect x="14" y="12" width="60" height="34" rx="3" fill="#eef2f7" stroke="#5c6773"/><rect x="20" y="18" width="48" height="22" rx="1" fill="#fff" stroke="#333"/><path d="M26 24h36M26 29h28" stroke="#333" stroke-width="1.2"/><rect x="34" y="48" width="20" height="10" fill="#fff" stroke="#333"/><path d="M44 48v-6" stroke="#333"/></svg></div></fieldset><fieldset class="nw-template-effects"><legend>Effects</legend><label class="nw-radio"><input type="checkbox" id="nwMirrorImage">Mirror image</label><label class="nw-radio"><input type="checkbox" id="nwNegative">Negative</label></fieldset></section>
    <section id="nwTemplateBackground" class="nw-template-background" hidden><fieldset><legend>Background Features</legend><label><input id="nwBackgroundColorEnabled" type="checkbox"><span>Color</span></label><p>Allows you to fill the background with a solid color, gradient, or pattern.</p><input id="nwBackgroundColor" type="color" value="#ffffff" aria-label="Background color" disabled><label><input id="nwBackgroundPictureEnabled" type="checkbox"><span>Picture</span></label><p>Allows you to fill the background with a picture.</p><input id="nwBackgroundPicture" type="file" accept="image/*" aria-label="Background picture" disabled><label><input id="nwBackgroundGuideEnabled" type="checkbox"><span>Design Guide Image</span></label><p>To make it easier to design your template, you can add a scanned image of a sample printed item and display it as a guide to help you position and size objects.</p><input id="nwBackgroundGuide" type="file" accept="image/*" aria-label="Design guide image" disabled></fieldset><div class="nw-bg-sub" id="nwBgColorPage" hidden><div class="nw-bg-row"><label for="nwBgColorButton">Background color:</label><button type="button" id="nwBgColorButton" aria-haspopup="dialog"><span class="nw-bg-swatch" id="nwBgColorSwatch"></span><span id="nwBgColorName">None</span><span class="nw-bg-arrow" aria-hidden="true">▾</span></button></div><fieldset class="nw-bg-options" disabled title="Not available in Q LABEL yet"><legend>Options</legend><label><input type="checkbox" disabled><span>Preprinted</span></label><label><span>Print when:</span><select disabled><option>Always</option></select></label><label><span>Overhang template:</span><input disabled value="0.0" size="5"><span class="nw-bg-unit">in</span></label></fieldset></div><div class="nw-bg-sub" id="nwBgPicturePage" hidden><div class="nw-bg-row"><label for="nwBgPictureSource">Source:</label><select id="nwBgPictureSource"><option value="none">No Picture</option><option value="embedded">Embedded Picture</option><option value="linked" disabled title="Not available in Q LABEL yet">Linked Picture</option></select></div><div class="nw-bg-row" id="nwBgPictureFileRow" hidden><label for="nwBgPictureBrowse">Picture:</label><button type="button" id="nwBgPictureBrowse">Browse…</button><span id="nwBgPictureName" class="nw-bg-filename"></span></div><div class="nw-bg-row"><label for="nwBgSizeMethod">Size method:</label><select id="nwBgSizeMethod" disabled><option>Stretch</option></select></div><div class="nw-bg-row"><label for="nwBgRotation">Rotation:</label><select id="nwBgRotation" disabled><option>0°</option><option disabled>90°</option><option disabled>180°</option><option disabled>270°</option></select></div><fieldset class="nw-bg-options" disabled title="Not available in Q LABEL yet"><legend>Options</legend><label><input type="checkbox" disabled><span>Preprinted</span></label><label><span>Print when:</span><input disabled></label><label><span>Overhang template:</span><input disabled value="0.0" size="5"><span class="nw-bg-unit">in</span></label></fieldset><div class="nw-bg-buttons"><button type="button" disabled title="Not available in Q LABEL yet">Image Processing…</button><button type="button" disabled title="Not available in Q LABEL yet">Error Handling…</button><button type="button" disabled title="Not available in Q LABEL yet">Apply Image Processing Permanently</button></div></div><div class="nw-bg-sub" id="nwBgGuidePage" hidden><p>To make it easier to design your template, you can add a scanned image of a sample printed item and display it as a guide to help you position and size objects. This image does not appear on printed items.</p><fieldset class="nw-bg-source"><legend>Get Image From</legend><button type="button" id="nwBgGuideFile">File…</button><button type="button" disabled title="Not available in Q LABEL yet">Scanner or Camera…</button></fieldset><div id="nwBgGuideName" class="nw-bg-filename"></div><div class="nw-bg-row"><label for="nwBgGuideColor">Color:</label><select id="nwBgGuideColor" disabled title="Not available in Q LABEL yet"><option>Blue</option></select></div><label class="nw-bg-check"><input type="checkbox" id="nwBgGuideHide" disabled><span>Hide design guide image</span></label><p class="nw-bg-hint">Use this option to temporarily suppress the display of the image.</p><button type="button" id="nwBgGuideRemove" disabled>Remove Design Guide Image</button><p class="nw-bg-hint">Use this option when you are done with the image to reduce memory usage.</p><button type="button" disabled title="Not available in Q LABEL yet">Image Processing…</button></div></section>
    <section id="nwFinishedPage" class="nw-finished-page" hidden><p>When you press Finish, a new document will be created using the settings that you specified.</p><p>Preview:</p><div class="nw-finished-review"><div>Starting Document:</div><div id="nwFinishedStarting"></div><div>Printer:</div><div id="nwFinishedPrinter"></div><div>Template Size:</div><div id="nwFinishedSize"></div></div><input id="nwName" value="new-label" required maxlength="100" hidden></section>
    <p id="nwError" role="alert"></p><p id="nwDriverNotice" role="status" hidden></p></div><aside><svg id="nwPreview" viewBox="0 0 200 300" aria-label="Label layout preview"></svg><div id="nwStartingPreview" class="nw-starting-preview" aria-label="Selected template preview" hidden><div class="nw-start-preview-label"><img id="nwStartingPreviewImage" alt="" hidden><div class="nw-start-preview-fallback">Preview unavailable</div></div></div><small id="nwSize"></small></aside></div>
    <footer><button type="button" id="nwBack"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m10 3-5 5 5 5M5 8h8"/></svg>Back</button><button type="button" id="nwNext">Next<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m6 3 5 5-5 5m5-5H3"/></svg></button><button type="button" id="nwCancel"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 4 8 8m0-8-8 8"/></svg>Cancel</button><button type="submit" id="nwFinish"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3 8 3.2 3.2L13 4.5"/></svg>Finish</button></footer></form>`;
  document.body.append(dialog);
  const printerArt=dialog.querySelector('svg.nw-orientation-printer');
  function updatePrinterArt(){
    const angle={portrait:0,landscape:90,portrait180:180,landscape180:270}[dialog.querySelector('[name=nwTemplateOrientation]:checked')?.value]||0;
    const mirror=dialog.querySelector('#nwMirrorImage')?.checked?-1:1,negative=!!dialog.querySelector('#nwNegative')?.checked;
    printerArt.setAttribute('viewBox','0 0 198 204');
    printerArt.innerHTML=`<image href="assets/branding/wizard-zebra-printer.png" width="198" height="204"/><rect x="103" y="119" width="61" height="75" fill="${negative?'#111':'#fff'}"/><g transform="translate(133.5 156.5) rotate(${angle}) scale(${mirror} 1)" fill="${negative?'#fff':'#111'}"><text x="0" y="-13" text-anchor="middle" font-size="16" font-weight="bold">ABC</text><path d="M-22 0v18m4-18v18m4-18v18m5-18v18m3-18v18m6-18v18m4-18v18m5-18v18m3-18v18m5-18v18m4-18v18" stroke="${negative?'#fff':'#111'}" stroke-width="2"/></g>`;
    printerArt.dataset.orientation=String(angle);printerArt.dataset.mirror=String(mirror<0);printerArt.dataset.negative=String(negative);
  }
  updatePrinterArt();
  const style = document.createElement('style');
  style.textContent = `#newLabelWizard{box-sizing:border-box;display:flex;flex-direction:column;padding:0;width:min(604px,calc(100vw - 24px))!important;height:min(466px,calc(100vh - 24px))!important;min-width:0;min-height:0;max-height:none;resize:none!important;overflow:hidden;border:1px solid #15803d;border-radius:6px;background:#fff;color:#222;font:13px 'Segoe UI',sans-serif}#newLabelWizard::backdrop{background:rgba(0,0,0,.4)}#newLabelWizard header{flex:0 0 auto;background:#16a34a;color:white;display:flex;justify-content:space-between;align-items:center;padding:5px 12px 5px 4px}#newLabelWizard header span{flex:1;text-align:center}#newLabelWizard header button{border:0;background:none;color:white;font-size:20px;padding:0 4px}#newLabelWizard form{display:flex;flex:1;min-height:0;flex-direction:column}#newLabelWizard .nw-heading{flex:0 0 auto;background:#f2f2f2;padding:12px 16px;border-bottom:1px solid #ccc}#newLabelWizard p{margin:5px 0;line-height:1.4}#newLabelWizard .nw-body{box-sizing:border-box;display:grid;min-width:0;flex:1;min-height:0;grid-template-columns:minmax(0,1fr) 180px;gap:12px;padding:12px 16px 10px;max-height:none;overflow:hidden}#newLabelWizard .nw-pages{min-width:0;overflow:hidden}#newLabelWizard label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0}#newLabelWizard input,#newLabelWizard select{background:white;color:#222;border:1px solid #aaa;border-radius:0;padding:4px;min-width:0;font:inherit}#newLabelWizard input[type=number]{width:95px}#newLabelWizard input[type=radio],#newLabelWizard input[type=checkbox]{width:auto;margin:0;accent-color:#007eaa}#newLabelWizard .nw-radio{justify-content:flex-start}#newLabelWizard .nw-help{color:#777;margin:0 0 12px 22px}#newLabelWizard fieldset{border:0;border-top:1px solid #ccc;padding:4px 0;display:grid;grid-template-columns:1fr 1fr;gap:0 10px;margin:6px 0}#newLabelWizard legend{color:#26728c;padding-right:8px}#newLabelWizard aside{background:#e7e7e7;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:6px;min-width:0;overflow:hidden}#newLabelWizard aside>svg{width:100%;max-width:168px;max-height:220px;object-fit:contain}#newLabelWizard footer{box-sizing:border-box;flex:0 0 auto;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 16px}#newLabelWizard footer button{box-sizing:border-box;display:inline-flex;flex:1 1 140px;align-items:center;justify-content:center;gap:7px;min-width:0;max-width:100%;min-height:36px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:8px;color:#334155;background:#fff;font:500 12px 'Segoe UI',sans-serif;white-space:nowrap;cursor:pointer}#newLabelWizard footer button>span{min-width:0;overflow-wrap:anywhere;text-align:center}#newLabelWizard footer button:hover:not(:disabled){border-color:#16a34a;background:#f0fdf4}#newLabelWizard #nwFinish:not(:disabled){border-color:#16a34a;background:#16a34a;color:white}#newLabelWizard #nwFinish:not(:disabled)>svg{stroke:white}#newLabelWizard button:focus-visible{outline:2px solid #007eaa;outline-offset:2px}#newLabelWizard button:disabled{opacity:.45;cursor:not-allowed}#newLabelWizard [hidden]{display:none!important}#newLabelWizard .nw-layout{display:flex;justify-content:space-around;grid-column:1/-1;text-align:center;padding:10px;font-size:14px}#newLabelWizard dl{display:grid;grid-template-columns:100px minmax(0,1fr);gap:7px;margin-top:10px}#newLabelWizard dd{margin:0;font-weight:600}#nwError{color:#b42318}#nwDriverNotice{color:#475467}@media(max-width:600px){#newLabelWizard .nw-body{grid-template-columns:1fr}#newLabelWizard aside{display:none}}`;
  style.textContent += '#newLabelWizard #nwStockList{display:block;box-sizing:border-box;width:210px;height:120px;padding:3px;border:1px solid #9aa5b1;border-radius:0;background:#fff}#newLabelWizard #nwStockList option{padding:1px 3px}#newLabelWizard .nw-stock-selection,#newLabelWizard .nw-items-page{align-self:start;min-width:0;max-width:560px}#newLabelWizard .nw-stock-help,#newLabelWizard .nw-items-help{max-width:430px;margin:0 0 12px;color:#111827;line-height:1.3}#newLabelWizard .nw-stock-mode,#newLabelWizard .nw-item-modes{display:grid;gap:5px;margin:0 0 8px 12px}#newLabelWizard .nw-stock-mode .nw-radio,#newLabelWizard .nw-item-modes .nw-radio{justify-content:flex-start;min-height:18px;margin:0;padding:0;border:0;border-radius:0;background:transparent;color:#111827}#newLabelWizard .nw-stock-mode .nw-radio:has(input:checked),#newLabelWizard .nw-item-modes .nw-radio:has(input:checked){border:0;background:transparent}#newLabelWizard .nw-stock-fields{display:grid;grid-template-columns:88px 210px;align-items:start;gap:5px 8px;margin-left:34px}#newLabelWizard .nw-stock-fields label{display:contents;margin:0;color:#334155;font-weight:400}#newLabelWizard .nw-stock-fields label>span{align-self:center;color:#6b7280}#newLabelWizard .nw-stock-fields select:not([size]){box-sizing:border-box;width:210px;height:24px;border:1px solid #9aa5b1;border-radius:0;padding:2px 5px}#newLabelWizard .nw-stock-fields select[size]{font-weight:400}#newLabelWizard .nw-stock-fields select:disabled{color:#7b8490;background:#f3f4f6}#newLabelWizard #nwCustomStock{margin:0}#newLabelWizard .nw-items-page fieldset{display:grid;grid-template-columns:150px 150px;width:300px;margin:0 0 0 24px;padding:0;border:0}#newLabelWizard .nw-items-page fieldset label{display:grid;grid-template-columns:52px 64px;align-items:center;margin:2px 0;color:#6b7280}#newLabelWizard .nw-items-page input[type=number]{box-sizing:border-box;width:58px;height:22px;padding:2px 5px}#newLabelWizard .nw-items-page fieldset:disabled input{color:#858b94;background:#f3f4f6}#newLabelWizard .nw-printer-picker{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,178px);gap:14px;align-items:start;padding-right:12px;box-sizing:border-box}#newLabelWizard #nwPrinter{box-sizing:border-box;width:100%;height:164px;padding:3px}#newLabelWizard .nw-printer-actions{display:grid;gap:10px;padding-top:2px;box-sizing:border-box;width:100%;max-width:178px}#newLabelWizard .nw-printer-actions button{min-height:30px;background:#fff;border:1px solid #aaa;border-radius:3px;color:#222;font:inherit;cursor:pointer}#newLabelWizard .nw-printer-actions button:hover:not(:disabled){background:#f3f8fc;border-color:#718096}#newLabelWizard .nw-printer-actions button:disabled{opacity:.5;cursor:default}@media(max-width:600px){#newLabelWizard .nw-printer-picker{grid-template-columns:1fr}#newLabelWizard .nw-printer-actions{grid-template-columns:1fr 1fr}#newLabelWizard .nw-stock-fields{grid-template-columns:80px minmax(0,1fr)}#newLabelWizard #nwStockList,#newLabelWizard .nw-stock-fields select:not([size]){width:100%}}';
  style.textContent += '#newLabelWizard>header,#newLabelWizard>form{box-sizing:border-box!important;width:100%!important;margin:0!important;padding:0!important}#newLabelWizard .nw-body,#newLabelWizard .nw-body>aside{margin-right:0!important;padding-right:0!important}#newLabelWizard>form>footer{box-sizing:border-box!important;margin:0!important;padding:8px 16px 10px!important;justify-content:flex-end}';
  style.textContent += '#newLabelWizard[open],#newLabelWizard[open]:has(footer),#newLabelWizard[open]:has(>form>footer){overflow:hidden!important;scrollbar-gutter:auto!important;scrollbar-width:none!important}#newLabelWizard[open]::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}#newLabelWizard>header.modal-window-header{box-sizing:border-box!important;position:relative;z-index:1;margin:-1px -1px 0!important;width:calc(100% + 2px)!important;height:32px!important;min-height:32px!important;max-height:32px!important;padding:0 0 0 4px!important;border:0!important;border-radius:6px 6px 0 0!important;background:#16a34a!important;overflow:hidden;cursor:default}#newLabelWizard header .nw-window-title{flex:1;min-width:0;color:#fff}#newLabelWizard header.modal-window-original-close{display:none!important}#newLabelWizard header .modal-window-controls{margin:0!important;padding:0!important;gap:0!important;height:100%!important;align-self:stretch!important}#newLabelWizard header .modal-window-controls button{width:40px!important;min-width:40px!important;height:100%!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#fff!important}#newLabelWizard header .modal-window-controls button:last-child{border-top-right-radius:6px!important}#newLabelWizard header .modal-window-controls button:last-child:hover{background:#15803d!important;color:#fff!important}#newLabelWizard header .modal-window-controls svg{stroke:#fff!important}';
  document.head.append(style);
  style.textContent+='#newLabelWizard .nw-window-title{display:flex;align-items:center;justify-content:flex-start;text-align:left;gap:8px}#newLabelWizard .nw-brand-icon{box-sizing:border-box;width:30px;height:24px;padding:0;background:transparent;border-radius:0;object-fit:contain}#newLabelWizard>form>.nw-heading{position:relative;isolation:isolate;box-sizing:border-box;flex:0 0 auto;width:100%!important;min-height:74px;margin:0!important;padding:10px 0 11px 14px!important;overflow:hidden;background:#fff;border-bottom:1px solid #bcc4cd}#newLabelWizard .nw-heading-art{position:absolute;z-index:0;inset:0;width:100%!important;height:100%!important;max-width:none;margin:0;padding:0;border:0;object-fit:cover;object-position:right center;pointer-events:none;display:block}#newLabelWizard .nw-heading-copy{position:relative;z-index:1;max-width:min(100% - 180px,52%);padding-right:12px}#newLabelWizard .nw-heading-copy strong{display:block;color:#172b3a;font-weight:700}#newLabelWizard .nw-heading-copy p{color:#334155;font-size:12px;line-height:1.35;margin:5px 0 0}@media(max-width:600px){#newLabelWizard .nw-heading-copy{max-width:calc(100% - 120px)}#newLabelWizard .nw-heading-art{object-fit:cover;object-position:right center}}';
  style.textContent+='#newLabelWizard:has(#nwStockPredefined:checked) .nw-body[data-step="1"]{grid-template-columns:minmax(0,1fr) 180px;gap:12px}#newLabelWizard:has(#nwStockPredefined:checked) .nw-body[data-step="1"] aside{display:flex;background:transparent;padding:0;justify-content:flex-start}#newLabelWizard:has(#nwStockPredefined:checked) .nw-body[data-step="1"] aside>svg{display:block;width:100%;height:auto;max-height:220px;border:1px solid #a3adb7}#newLabelWizard:has(#nwStockPredefined:checked) .nw-stock-help{max-width:340px}@media(max-width:650px){#newLabelWizard:has(#nwStockPredefined:checked) .nw-body[data-step="1"]{grid-template-columns:1fr}#newLabelWizard:has(#nwStockPredefined:checked) .nw-body[data-step="1"] aside{width:180px;justify-self:center}}';
  style.textContent+='#newLabelWizard .nw-body:is([data-step="1"],[data-step="2"]){grid-template-columns:minmax(0,1fr) 180px;align-items:start;gap:12px}#newLabelWizard .nw-body:is([data-step="1"],[data-step="2"]) aside{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;align-self:stretch}#newLabelWizard .nw-body:is([data-step="1"],[data-step="2"]) aside>svg{display:block;width:100%;max-width:168px;height:auto;max-height:220px;object-fit:contain}#newLabelWizard .nw-body:is([data-step="1"],[data-step="2"]) aside>small{display:block;margin-top:5px;text-align:center;font-size:11px;color:#334155}@media(max-width:650px){#newLabelWizard .nw-body:is([data-step="1"],[data-step="2"]){grid-template-columns:1fr}#newLabelWizard .nw-body:is([data-step="1"],[data-step="2"]) aside{display:flex;width:min(180px,100%);justify-self:center}}';
  style.textContent+='#newLabelWizard .nw-body:is([data-step="1"],[data-step="2"],[data-step="3"]){padding-right:16px!important}#newLabelWizard .nw-body[data-step="3"]{grid-template-columns:minmax(0,1fr) 180px;align-items:start;gap:12px}#newLabelWizard .nw-body[data-step="3"] aside{align-items:center;justify-content:flex-start;padding-right:0!important}#newLabelWizard .nw-body[data-step="3"] aside>svg{align-self:center;transform:none}#newLabelWizard .nw-body[data-step="3"] aside>small{box-sizing:border-box;display:block;align-self:center;width:100%;max-width:168px;margin-top:5px;text-align:center;font-size:11px;color:#334155;transform:none}#newLabelWizard .nw-items-page fieldset{grid-template-columns:150px 150px}#newLabelWizard .nw-items-page fieldset label{grid-template-columns:64px 64px}';
  style.textContent+='#newLabelWizard .nw-body>aside>svg{height:220px!important;max-height:220px!important;max-width:168px;object-fit:contain}';
  style.textContent+='#newLabelWizard .nw-starting-point{align-self:start;padding:0 20px;color:#111827}#newLabelWizard .nw-starting-point>.nw-start-help{margin:0 0 18px;line-height:1.35}#newLabelWizard .nw-starting-point fieldset{display:block;margin:0 0 8px;padding:0;border:0}#newLabelWizard .nw-starting-point fieldset legend{margin:0 0 12px;color:#111827}#newLabelWizard .nw-starting-point fieldset label{justify-content:flex-start;gap:4px;margin:7px 16px}#newLabelWizard .nw-starting-point input[type=radio]{accent-color:#007eaa}#newLabelWizard .nw-library-notice{margin:8px 24px 12px!important;font-size:12px;line-height:1.8}#newLabelWizard #nwSelectTemplate{margin-left:24px;padding:3px 9px;border:1px solid #cbd5e1;border-radius:3px;background:#fff;color:#334155;font:12px inherit;cursor:pointer}#newLabelWizard #nwSelectTemplate:disabled{opacity:.55;cursor:default;color:#94a3b8;background:#f8fafc}#newLabelWizard .nw-library-document{margin:10px 24px 6px;font-weight:600;color:#111827}#newLabelWizard .nw-data-entry{margin:4px 24px 8px!important;justify-content:flex-start}#newLabelWizard #nwDataEntryUnsupported{margin:0 24px 8px!important;color:#667085;font-size:12px}#newLabelWizard .nw-library-preview-img{width:100%;max-width:168px;max-height:220px;object-fit:contain;background:#fff;border:1px solid #cbd5e1}';
  style.textContent+='#newLabelWizard .nw-body[data-step="1"]{grid-template-columns:minmax(0,1fr)}#newLabelWizard footer{gap:6px}#newLabelWizard footer button{flex:0 0 86px;width:86px;min-height:30px;padding:4px 6px;gap:5px;border-radius:6px}#newLabelWizard footer button>svg{display:block;flex:0 0 14px;width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}@media(max-width:420px){#newLabelWizard footer button{flex:1 1 calc(50% - 6px);width:auto}}';
  const q = id => dialog.querySelector('#nw' + id);
  if(!q('DataEntryUnsupported')){const notice=document.createElement('p');notice.id='nwDataEntryUnsupported';notice.setAttribute('role','status');notice.textContent='The native data-entry form is unavailable for this template; its editable label objects are still included.';notice.hidden=true;q('DataEntryWrap').after(notice);}
  // Keep the category scrollbar inside our dialog rather than the OS popup,
  // whose overlay scrollbar may remain invisible on Windows.
  let categoryPopup=null;
  const closeCategoryPopup=()=>{categoryPopup?.remove();categoryPopup=null;q('StockCategory').setAttribute('aria-expanded','false');};
  const openCategoryPopup=()=>{
    const category=q('StockCategory');if(category.disabled||categoryPopup)return;
    const rect=category.getBoundingClientRect(),list=document.createElement('select');
    list.className='nw-category-popup';list.size=12;list.setAttribute('aria-label','Category');
    list.replaceChildren(...[...category.options].map(option=>option.cloneNode(true)));list.value=category.value;
    const height=Math.min(260,Math.max(80,innerHeight-24));
    list.style.cssText=`position:fixed;z-index:2147483647;left:${rect.left}px;top:${Math.max(8,Math.min(rect.bottom,innerHeight-height-8))}px;width:${rect.width}px;height:${height}px;box-sizing:border-box;overflow-y:scroll;scrollbar-width:auto;scrollbar-color:#64748b #e2e8f0;border:1px solid #16a34a;border-radius:4px;background:#fff;color:#172b3a;font:13px 'Segoe UI',sans-serif;padding:2px;box-shadow:0 4px 12px #0003;`;
    const commit=()=>{category.value=list.value;category.dispatchEvent(new Event('change',{bubbles:true}));closeCategoryPopup();category.focus();};
    list.addEventListener('click',event=>{if(event.target.tagName==='OPTION')commit();});
    list.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeCategoryPopup();category.focus();}else if(event.key==='Enter'){event.preventDefault();commit();}});
    list.addEventListener('blur',closeCategoryPopup);categoryPopup=list;dialog.append(list);category.setAttribute('aria-expanded','true');list.focus();
    list.options[list.selectedIndex]?.scrollIntoView({block:'nearest'});
  };
  q('StockCategory').addEventListener('pointerdown',event=>{if(event.button!==0||q('StockCategory').disabled)return;event.preventDefault();categoryPopup?closeCategoryPopup():openCategoryPopup();});
  q('StockCategory').addEventListener('keydown',event=>{if([' ','Enter','ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();openCategoryPopup();}});
  dialog.addEventListener('close',closeCategoryPopup);dialog.addEventListener('cancel',closeCategoryPopup);
  window.addEventListener('resize',closeCategoryPopup);
  style.textContent+='#newLabelWizard .nw-category-popup::-webkit-scrollbar{display:block;width:14px}#newLabelWizard .nw-category-popup::-webkit-scrollbar-track{background:#e2e8f0}#newLabelWizard .nw-category-popup::-webkit-scrollbar-thumb{background:#64748b;border:3px solid #e2e8f0;border-radius:8px}';
  style.textContent+='#newLabelWizard .nw-pages{container-type:inline-size}@container(max-width:403px){#newLabelWizard .nw-printer-picker{grid-template-columns:minmax(0,1fr)}#newLabelWizard .nw-printer-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}@container(max-width:300px){#newLabelWizard .nw-printer-actions{grid-template-columns:minmax(0,1fr)}}';
  const pages = [...dialog.querySelectorAll('.nw-body>.nw-pages>section')];
  const headings = [
    ['Starting Point','Select the starting point for the new document.'],
    ['Select the Printer','Select the printer that will be used to print the label.'],
    ['Stock Selection','A stock specifies the page size, and the size, number, and position of the items on the page.'],
    ['Items Per Page','Specify whether the media contains one or more items.'],
    ['Side Edges','Specify the characteristics of the sides of your media.'],
    ['Printed Item Shape','Specify the shape of your items.'],
    ['Template Size','Specify the size of your item.'],
    ['Template Background','Select a picture or color for your background.'],
    ['Finished!','']
  ];
  const DEFAULT_SIDE_EDGE_MM=0.05*25.4,DEFAULT_TEMPLATE_SIZE_IN=4,DEFAULT_TEMPLATE_SIZE_PRESET='4x4',TEMPLATE_DIM_MIN=.1,TEMPLATE_DIM_STEP=.1,TEMPLATE_DIM_IDS=['Width','Height'],TEMPLATE_SIZE_PRESETS=[{value:'user',label:'User Defined Size'},{value:'2x4',label:'2 x 4',widthIn:2,heightIn:4},{value:'4x4',label:'4 x 4',widthIn:4,heightIn:4},{value:'4x6',label:'4 x 6',widthIn:4,heightIn:6}];
  let step = 0, unit = 'in', busy = false, selectedPrinterDpi = null, printerResolutionRequest = 0, selectedStock = null, selectedLibraryTemplate = null, libraryPageWidthIn = 8.5, libraryPageHeightIn = 11, sideEdgesEnabled = true, edgeLeftMm = DEFAULT_SIDE_EDGE_MM, edgeRightMm = DEFAULT_SIDE_EDGE_MM, printedItemShape='rounded', templatePageOrientation='normal', wizardPrinterSyncTicket = 0, wizardPrinterSyncStep = -1, backgroundPictureData = null;
  const templateOrientationUiToPage={portrait:'normal',landscape:'landscape',portrait180:'inverted',landscape180:'landscape-inverted'};
  const templateOrientationPageToUi=Object.fromEntries(Object.entries(templateOrientationUiToPage).map(([ui,page])=>[page,ui]));
  function selectedTemplateOrientationUi(){return dialog.querySelector('[name=nwTemplateOrientation]:checked')?.value||templateOrientationPageToUi[templatePageOrientation]||'portrait';}
  function applyTemplateOrientationSwap(nextPageOrientation){
    const landscape=nextPageOrientation.startsWith('landscape'),w=val('Width'),h=val('Height');
    if((landscape&&w<h)||(!landscape&&w>h)){q('Width').value=h;q('Height').value=w;formatTemplateDimInput('Width');formatTemplateDimInput('Height');}
  }
  function roundTemplateDim(displayValue){const n=Number(displayValue);if(!Number.isFinite(n))return TEMPLATE_DIM_MIN;return Math.max(TEMPLATE_DIM_MIN,+(Math.round(n/TEMPLATE_DIM_STEP)*TEMPLATE_DIM_STEP).toFixed(1));}
  function formatTemplateDimInput(id){const input=q(id);if(!input)return;input.value=String(roundTemplateDim(val(id)));}
  function nudgeTemplateDim(id,direction){const input=q(id);if(!input)return;input.value=String(roundTemplateDim(val(id)+direction*TEMPLATE_DIM_STEP));input.dispatchEvent(new Event('input',{bubbles:true}));}
  function syncTemplateDimStepMode(){const exact=usesPredefinedStock();for(const id of TEMPLATE_DIM_IDS){const input=q(id),precise=exact||(id==='Width'&&sideWidthDerived);input.min=String(TEMPLATE_DIM_MIN);input.step=precise?'any':'0.1';if(!precise)formatTemplateDimInput(id);}}
  function syncTemplateSizeUnits(){const label=unit==='in'?'in':'mm';for(const id of TEMPLATE_DIM_IDS){const suffix=q(id)?.closest('.unit-number')?.querySelector('.unit-suffix');if(suffix)suffix.textContent=label;}}
  function applyTemplateSizePreset(value){const preset=TEMPLATE_SIZE_PRESETS.find(entry=>entry.value===value)||TEMPLATE_SIZE_PRESETS[0];q('TemplateSizePreset').value=preset.value;if(preset.value==='user')return;sideWidthDerived=false;const factor=unit==='in'?25.4:1;q('Width').value=String(roundTemplateDim(preset.widthIn*25.4/factor));q('Height').value=String(roundTemplateDim(preset.heightIn*25.4/factor));syncTemplateDimStepMode();preview();}
  function syncTemplateSizePresetFromDims(){const widthMm=mm('Width'),heightMm=mm('Height');const match=TEMPLATE_SIZE_PRESETS.find(preset=>preset.value!=='user'&&Math.abs(widthMm-preset.widthIn*25.4)<0.05&&Math.abs(heightMm-preset.heightIn*25.4)<0.05);q('TemplateSizePreset').value=match?.value||'user';}
  function syncTemplateOrientationUi(){const ui=templateOrientationPageToUi[templatePageOrientation]||'portrait';const radio=dialog.querySelector(`[name=nwTemplateOrientation][value="${ui}"]`);if(radio)radio.checked=true;updatePrinterArt();}
  function commitTemplateOrientationFromUi(){
    const next=templateOrientationUiToPage[selectedTemplateOrientationUi()]||'normal';
    if(next!==templatePageOrientation){applyTemplateOrientationSwap(next);templatePageOrientation=next;}
  }
  function syncWizardPrintersFromApp() {
    const main = el('printerSelect');
    const wizard = q('Printer');
    if (!main || !wizard) return;
    const previous = wizard.value;
    const names = [...main.options].map((option) => option.value).filter((value) => String(value || '').trim());
    const fill = window.WindowsPrinterList?.fillPrinterSelect;
    const selected = previous || main.value;
    if (fill && names.length) fill(wizard, names, selected);
    else if (names.length) {
      wizard.replaceChildren(
        ...names.map((name) => {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          return option;
        }),
      );
      wizard.value = names.includes(selected) ? selected : names[0];
    }
  }
  async function ensureWizardPrinterList() {
    syncWizardPrintersFromApp();
    try {
      const printers = await window.zebra.listPrinters();
      if (!Array.isArray(printers) || !printers.length) return;
      const fill = window.WindowsPrinterList?.fillPrinterSelect;
      if (!fill) return;
      fill(q('Printer'), printers, q('Printer').value || el('printerSelect')?.value);
    } catch (_) {
      /* keep the last synced list */
    }
  }
  function requestWizardPrinterSync() {
    const ticket = ++wizardPrinterSyncTicket;
    void ensureWizardPrinterList().then(() => {
      if (ticket !== wizardPrinterSyncTicket) return;
      updatePrinterActions();
      if (step === 1) render();
    });
  }
  function nominalDpiFromPrinterName(name) {
    const match = String(name || '').match(/\b(\d{2,4})\s*dpi\b/i);
    const dpi = match ? Number(match[1]) : null;
    return Number.isInteger(dpi) && dpi >= 72 && dpi <= 2400 ? dpi : null;
  }
  const usesLibraryStartingPoint = () => q('TemplateLibrary').checked;
  function ensureStartingPreview(){
    let preview=q('StartingPreview');
    if(preview)return preview;
    preview=document.createElement('div');preview.id='nwStartingPreview';preview.className='nw-starting-preview';preview.setAttribute('aria-label','Selected template preview');preview.hidden=true;
    preview.innerHTML='<div class="nw-start-preview-label"><img id="nwStartingPreviewImage" alt="" hidden><div class="nw-start-preview-fallback">Preview unavailable</div></div>';
    const aside=q('Preview')?.parentElement,size=q('Size');if(aside)aside.insertBefore(preview,size||null);
    return preview;
  }
  function clearLibrarySelection(){
    selectedLibraryTemplate=null;
    q('LibraryDocument').hidden=true;
    q('DataEntryWrap').hidden=true;
    q('DataEntryForm').checked=false;
    q('DataEntryForm').disabled=false;
    q('DataEntryUnsupported').hidden=true;
    const preview=q('StartingPreview'),image=q('StartingPreviewImage');
    if(preview)preview.hidden=true;
    if(image){image.hidden=true;image.removeAttribute('src');}
  }
  async function applyLibraryTemplate(item){
    if(!item)return;
    clearLibrarySelection();
    busy=true;render();
    try{
      let resolved=item;
      if(window.zebra?.ensureBarTenderLibraryBtw){
        const file=await window.zebra.ensureBarTenderLibraryBtw(item);
        if(file?.ok){
          const nativePackage=file.import_mode==='verified-native-objects'&&file.native_package?.complete===true&&file.native_package?.verification?.complete===true?file.native_package:null;
          if(!file.artwork&&!nativePackage)throw new Error(file.conversion_error||'Editable native conversion is not verified for this template.');
          resolved={...item,relative_path:file.path,resolved_path:file.path,imported_artwork:file.artwork,imported_native_package:nativePackage,conversion_error:file.conversion_error,objects_decomposed:!!nativePackage};
          const meta=file.metadata;
          if(meta?.width_mm&&meta?.height_mm){
            resolved.width_in=meta.width_in;
            resolved.height_in=meta.height_in;
          }
          if(meta?.page_width_in&&meta?.page_height_in){
            libraryPageWidthIn=meta.page_width_in;
            libraryPageHeightIn=meta.page_height_in;
          }
        }else throw new Error(file?.error||'Could not prepare the selected library template.');
      }
      selectedLibraryTemplate=resolved;
      selectedStock=null;
      q('StockCustom').checked=true;
      q('StockPredefined').checked=false;
      q('StockCategory').disabled=true;
      q('StockList').disabled=true;
      for(const id of ['Left','Top','Right','Bottom','GapX','GapY'])q(id).value=0;
      edgeLeftMm=edgeRightMm=DEFAULT_SIDE_EDGE_MM;
      sideEdgesEnabled=true;
      q('SideEdgesYes').checked=true;
      q('SideEdgesNo').checked=false;
      renderSideEdges();
      const widthIn=resolved.width_in,heightIn=resolved.height_in;
      if(widthIn>0&&heightIn>0){
        const factor=unit==='in'?25.4:1;
        q('Width').value=+(widthIn*25.4/factor).toFixed(unit==='in'?6:4);
        q('Height').value=+(heightIn*25.4/factor).toFixed(unit==='in'?6:4);
        q('PaperW').value=+(libraryPageWidthIn*25.4/factor).toFixed(unit==='in'?6:4);
        q('PaperH').value=+(libraryPageHeightIn*25.4/factor).toFixed(unit==='in'?6:4);
      }
      const docName=resolved.btw_file_name||`${resolved.name}.btw`;
      q('Name').value=docName.replace(/\.btw$/i,'');
      q('LibraryDocument').textContent=`Document: ${docName}${resolved.imported_native_package?' — Editable native objects':' — Preview only; editable conversion pending'}`;
      q('LibraryDocument').hidden=false;
      q('DataEntryWrap').hidden=false;
      const excludedForm=resolved.imported_native_package?.native_forms?.excluded===true;
      q('DataEntryForm').disabled=excludedForm;
      q('DataEntryForm').checked=false;
      q('DataEntryUnsupported').hidden=!excludedForm;
      q('Error').textContent='';
    }catch(error){q('Error').textContent=error?.message||'Could not prepare the selected library template.';}
    finally{busy=false;render();}
  }
  async function openLibraryPicker(){
    try{
      const result=await window.openTemplateBrowser?.();
      if(result?.item)await applyLibraryTemplate(result.item);
      else if(usesLibraryStartingPoint()&&!selectedLibraryTemplate)q('BlankTemplate').click();
    }catch(error){q('Error').textContent=error?.message||'Could not open the template library.';}
  }
  function syncStartingPointUi(){
    const library=usesLibraryStartingPoint();
    q('SelectTemplate').disabled=!library;
    if(!library)clearLibrarySelection();
    render();
  }
  const dimensions = ['Width','Height','Left','Top','Right','Bottom','GapX','GapY'];
  const mode = () => q('StockPredefined').checked&&selectedStock&&/page|sheet/i.test(selectedStock.printer_type||'')?'sheet':'roll';
  const usesPredefinedStock = () => q('StockPredefined').checked&&!!selectedStock;
  const multipleItems = () => q('MultipleItems').checked;
  const syncItemCounts = () => {q('ItemCounts').disabled=!multipleItems();};
  const val = id => Number(q(id).value);
  const mm = id => val(id) * (unit === 'in' ? 25.4 : 1);
  const sideEdgeMm = side => sideEdgesEnabled ? (side === 'left' ? mm('EdgeLeft') : mm('EdgeRight')) : 0;
  // Hold the physical media width while editing its unused side areas.
  let sideMediaWidthMm=null,sideMediaColumns=1,sideWidthDerived=false,ellipseDefaultAdjusted=false;
  function captureSideMediaWidth(){sideMediaColumns=multipleItems()?Math.max(1,Math.floor(val('Columns'))):1;sideMediaWidthMm=mm('Width')*sideMediaColumns+sideEdgeMm('left')+sideEdgeMm('right');}
  function sideEdgeWidth(){
    if(sideMediaWidthMm===null)return null;
    if(sideEdgesEnabled&&(!q('EdgeLeft').checkValidity()||!q('EdgeRight').checkValidity())){q('Error').textContent='Enter valid side edges.';return NaN;}
    const width=(sideMediaWidthMm-sideEdgeMm('left')-sideEdgeMm('right'))/sideMediaColumns;
    if(!Number.isFinite(width)||width<(unit==='in'?2.54:.1)){q('Error').textContent='Side edges leave insufficient template width. Reduce Left or Right.';return NaN;}
    return width;
  }
  function updateSideTemplateWidth(){
    const width=sideEdgeWidth();if(width===null)return true;if(!Number.isFinite(width))return false;
    const displayWidth=+(width/(unit==='in'?25.4:1)).toFixed(6);
    q('Width').value=String(displayWidth);sideWidthDerived=Math.abs(displayWidth/TEMPLATE_DIM_STEP-Math.round(displayWidth/TEMPLATE_DIM_STEP))>1e-6;q('Width').step=usesPredefinedStock()||sideWidthDerived?'any':'0.1';
    syncTemplateSizePresetFromDims();q('Error').textContent='';return true;
  }
  const formatLength = value => `${(value/(unit==='in'?25.4:1)).toFixed(unit==='in'?3:2)} ${unit}`;
  function formatSummaryPrinter(name,dpi){
    const trimmed=String(name||'').trim();
    if(!trimmed)return 'Not selected';
    const base=trimmed.replace(/\s*\(\d+\s*dpi\)\s*/gi,' ').replace(/\s+/g,' ').trim();
    const resolved=Number.isInteger(dpi)&&dpi>=72?dpi:null;
    const nominal=trimmed.match(/\((\d+)\s*dpi\)/i);
    const shown=resolved??(nominal?Number(nominal[1]):null);
    return shown?`${base||trimmed} (${shown} dpi)`:base||trimmed;
  }
  function renderSideEdges(){
    q('EdgeWidths').disabled=!sideEdgesEnabled;
    const factor=unit==='in'?25.4:1,unitLabel=unit==='in'?'in':'mm';
    q('EdgeLeft').value=sideEdgesEnabled?+(edgeLeftMm/factor).toFixed(6):0;
    q('EdgeRight').value=sideEdgesEnabled?+(edgeRightMm/factor).toFixed(6):0;
    dialog.querySelectorAll('.nw-edge-unit').forEach(node=>{node.textContent=unitLabel;});
  }
  function tuneWizardPreviewPane(aside){
    if(!aside||![3,4,5,6,7].includes(step))return;
    const svg=aside.querySelector('svg');if(!svg)return;
    if(window.PaperPreview?.renderReferenceRoll){const g=geometry(),base=window.StockApply?.resolveLabelShapeFromStock(currentCatalogStock())||{};const shape=printedItemShape;window.PaperPreview.renderReferenceRoll(svg,{width_mm:g.width,height_mm:g.height,label_shape:shape,corner_radius_mm:shape==='rounded'?Math.min(8,base.corner_radius_mm||Math.min(g.width,g.height)*.03125):0,stock:{liner_left_mm:sideEdgeMm('left'),liner_right_mm:sideEdgeMm('right')},page:{enabled:true,width_mm:g.paperW,height_mm:g.paperH,rows:g.rows,columns:g.columns,left_mm:mm('Left'),top_mm:mm('Top'),gap_x_mm:mm('GapX'),gap_y_mm:mm('GapY')}},{sideEdges:step===4,wizardRounded:shape==='rounded',wizardPreview:true});}

  }
  style.textContent+='#newLabelWizard .nw-body:is([data-step="3"],[data-step="4"],[data-step="5"],[data-step="6"],[data-step="7"]){grid-template-columns:minmax(0,1fr) 198px;gap:12px;padding-right:16px!important;overflow:hidden!important;padding-top:8px;padding-bottom:8px;align-items:start}#newLabelWizard .nw-body:is([data-step="3"],[data-step="4"],[data-step="5"],[data-step="6"],[data-step="7"]) aside{width:198px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;align-self:start;height:auto;padding:0!important;background:transparent!important;border:0!important;overflow:visible}#newLabelWizard .nw-body:is([data-step="3"],[data-step="4"],[data-step="5"],[data-step="6"],[data-step="7"]) aside>svg{box-sizing:border-box;flex:0 0 270px;width:198px!important;height:270px!important;max-width:198px!important;max-height:270px!important;transform:none!important;overflow:hidden;border:1px solid #777;background:#bfbfbf}#newLabelWizard .nw-body:is([data-step="5"],[data-step="6"],[data-step="7"]) aside>svg{border-color:#aaa;background:#bfbfbf}#newLabelWizard .nw-body:is([data-step="3"],[data-step="4"],[data-step="5"],[data-step="6"],[data-step="7"]) aside>small{box-sizing:border-box;display:block;flex:0 0 auto;width:198px;max-width:198px;margin-top:8px;padding:0;text-align:center;font:11px/1.3 Arial,sans-serif;color:#172b3a;background:transparent}';
  style.textContent+='#newLabelWizard .nw-side-edges{align-self:start;min-width:0;max-width:420px;padding:0;color:#172b3a;font-size:13px}#newLabelWizard .nw-side-edges>p{max-width:400px;margin:0 0 16px;line-height:1.45;color:#172b3a}#newLabelWizard .nw-edge-choice{display:grid;gap:6px;margin:0 0 16px 2px}#newLabelWizard .nw-edge-choice .nw-radio{justify-content:flex-start;margin:0;padding:0;border:0;background:transparent;color:#172b3a;gap:6px}#newLabelWizard #nwEdgeWidths{display:block;margin:0;padding:12px 0 0;border:0;border-top:1px solid #bcc4cd;grid-template-columns:1fr}#newLabelWizard #nwEdgeWidths legend{padding:0 6px 0 0;color:#26728c;font-weight:400}#newLabelWizard .nw-edge-row{display:grid;grid-template-columns:64px 56px 24px;align-items:center;gap:6px;margin:8px 0 8px 8px;color:#334155}#newLabelWizard .nw-edge-text{justify-self:end;text-align:right;color:#334155}#newLabelWizard .nw-u{text-decoration:underline}#newLabelWizard .nw-edge-row input{box-sizing:border-box;width:56px;height:22px;padding:2px 4px;border:1px solid #9aa5b1;border-radius:0;text-align:right}#newLabelWizard .nw-edge-unit{color:#334155;font-size:12px}#newLabelWizard #nwEdgeWidths:disabled .nw-edge-row input{color:#7b8490;background:#f3f4f6}';
  style.textContent+='#newLabelWizard .nw-printed-item-shape{align-self:start;margin:16px 0 0 8px;padding:0}#newLabelWizard .nw-shape-options{display:grid;gap:4px}#newLabelWizard .nw-shape-options label{display:grid;grid-template-columns:36px 18px minmax(0,1fr);justify-content:start;align-items:center;gap:4px;margin:0;min-height:30px;cursor:pointer}#newLabelWizard .nw-shape-options input{margin:0;accent-color:#0078d4}#newLabelWizard .nw-shape-options svg{display:block;width:36px;height:30px}#newLabelWizard .nw-shape-options span{font-size:13px;color:#172b3a}';
  style.textContent+='#newLabelWizard .nw-body[data-step="6"] .nw-template-size{align-self:start;margin:16px 0 0 8px;padding:0}';
  style.textContent+='#newLabelWizard .nw-template-size{align-self:start;min-width:0;max-width:420px;padding:0;color:#172b3a;font-size:13px}#newLabelWizard .nw-template-preset{display:grid;grid-template-columns:88px minmax(0,1fr);align-items:center;gap:8px;margin:0 0 10px;color:#334155}#newLabelWizard .nw-template-preset select{box-sizing:border-box;width:100%;max-width:220px;height:22px;padding:2px 5px;border:1px solid #9aa5b1;border-radius:0}#newLabelWizard .nw-template-dims{display:grid;gap:6px;margin:0 0 8px 2px}#newLabelWizard .nw-template-dim{display:grid;grid-template-columns:52px 130px;align-items:center;gap:6px;margin:0;color:#334155}#newLabelWizard .nw-template-dim-label{justify-self:end;text-align:right}#newLabelWizard .nw-template-dim .unit-number{width:130px;flex:0 0 130px;border-radius:0;border-color:#9aa5b1}#newLabelWizard .nw-template-dim input{box-sizing:border-box;height:22px;padding:2px 4px;text-align:right}#newLabelWizard .nw-template-note{max-width:400px;margin:0 0 12px;line-height:1.45;color:#172b3a;font-size:12px}#newLabelWizard .nw-template-orientation,#newLabelWizard .nw-template-effects{display:block;margin:0 0 10px;padding:10px 8px 8px;border:1px solid #bcc4cd;grid-template-columns:1fr}#newLabelWizard .nw-template-orientation legend,#newLabelWizard .nw-template-effects legend{padding:0 6px 0 0;color:#26728c;font-weight:400}#newLabelWizard .nw-orientation-body{display:grid;grid-template-columns:minmax(0,1fr) 88px;align-items:center;gap:8px}#newLabelWizard .nw-orientation-radios{display:grid;gap:5px;margin:0 0 0 2px}#newLabelWizard .nw-orientation-radios .nw-radio,#newLabelWizard .nw-template-effects .nw-radio{justify-content:flex-start;margin:0;padding:0;border:0;background:transparent;color:#172b3a;gap:6px}#newLabelWizard .nw-template-effects .nw-radio{margin:2px 0 2px 2px}#newLabelWizard .nw-orientation-printer{display:block;width:88px;height:76px;cursor:pointer}#newLabelWizard .nw-summary-page{align-self:start;min-width:0;max-width:420px;padding:0;color:#172b3a;font-size:13px}#newLabelWizard .nw-summary-name{display:grid;grid-template-columns:88px minmax(0,1fr);align-items:center;gap:8px;margin:0 0 12px;color:#334155;font-weight:400}#newLabelWizard .nw-summary-name input{box-sizing:border-box;width:100%;max-width:220px;height:22px;padding:2px 6px;border:1px solid #9aa5b1;border-radius:0}#newLabelWizard .nw-summary-page dl{grid-template-columns:132px minmax(0,1fr);gap:4px 10px;margin:0}#newLabelWizard .nw-summary-page dt{margin:0;color:#334155;font-weight:400}#newLabelWizard .nw-summary-page dd{margin:0;color:#172b3a;font-weight:600}#newLabelWizard .nw-summary-page dd[data-summary-jump]{cursor:pointer;text-decoration:underline;text-decoration-color:#94a3b8}#newLabelWizard .nw-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}';
  const formatSize = (width,height) => {
    const w=width/(unit==='in'?25.4:1),h=height/(unit==='in'?25.4:1);
    const format=value=>Number(value.toFixed(3)).toString();
    return `${format(w)} x ${format(h)} ${unit}`;
  };
  function geometry() {
    const width = mm('Width'), height = mm('Height'), rows = multipleItems()?val('Rows'):1, columns = multipleItems()?val('Columns'):1;
    return {width,height,rows,columns,paperW:mode()==='sheet'||usesPredefinedStock()?val('PaperW'):mm('Left')+columns*width+(columns-1)*mm('GapX')+mm('Right'),paperH:mode()==='sheet'||usesPredefinedStock()?val('PaperH'):mm('Top')+rows*height+(rows-1)*mm('GapY')+mm('Bottom')};
  }
  function currentCatalogStock(){
    if(!usesPredefinedStock())return null;
    const g=geometry();
    return {...selectedStock,width_mm:g.width,height_mm:g.height,paper_width_mm:g.paperW,paper_height_mm:g.paperH,
      rows:g.rows,columns:g.columns,margin_left_mm:mm('Left'),margin_right_mm:mm('Right'),
      margin_top_mm:mm('Top'),margin_bottom_mm:mm('Bottom'),gap_x_mm:mm('GapX'),gap_y_mm:mm('GapY'),
      liner_left_mm:sideEdgeMm('left'),liner_right_mm:sideEdgeMm('right'),orientation:0};
  }
  function applyStock(stock){
    if(!stock)return;selectedStock=stock;printedItemShape=window.StockApply?.resolveLabelShapeFromStock(stock)?.label_shape||'rounded';const shapeRadio=q('PrintedShape'+(printedItemShape==='ellipse'?'Ellipse':printedItemShape==='rounded'?'Rounded':'Rectangle'));if(shapeRadio)shapeRadio.checked=true;const factor=unit==='in'?25.4:1;
    for(const [id,value] of [['Width',stock.width_mm],['Height',stock.height_mm],['Left',stock.margin_left_mm],['Top',stock.margin_top_mm],['Right',stock.margin_right_mm],['Bottom',stock.margin_bottom_mm],['GapX',stock.gap_x_mm],['GapY',stock.gap_y_mm],['PaperW',stock.paper_width_mm],['PaperH',stock.paper_height_mm],['Columns',stock.columns],['Rows',stock.rows]])if(Number.isFinite(Number(value)))q(id).value=Number(value)/(['PaperW','PaperH','Columns','Rows'].includes(id)?1:factor);
    q('TemplateSizePreset').value='user';
    q(stock.columns>1||stock.rows>1?'MultipleItems':'SingleItem').checked=true;syncItemCounts();
    edgeLeftMm=Math.max(0,Number(stock.liner_left_mm)||0);edgeRightMm=Math.max(0,Number(stock.liner_right_mm)||0);sideEdgesEnabled=edgeLeftMm>0||edgeRightMm>0;q('SideEdgesYes').checked=sideEdgesEnabled;q('SideEdgesNo').checked=!sideEdgesEnabled;renderSideEdges();
    preview();
  }
  function stockDisplayName(name){return window.StockCatalogUi?.formatStockDisplayName?.(name)??name;}
  function wizardPrinterName(){return window.WindowsPrinterList?.resolveWindowsPrinterQueueName?.(q('Printer').value)||q('Printer').value;}
  function defaultStockCategory(){return window.StockCatalogUi?.defaultStockCategoryForPrinter?.(wizardPrinterName(),window.QLabelStockCatalog)||'';}
  function applyDefaultStockCategory(selectFirst=true){
    if(!q('StockPredefined').checked)return;
    const pick=defaultStockCategory();if(!pick)return;
    if(q('StockCategory').value!==pick){q('StockCategory').value=pick;renderStockList(selectFirst);}
    else if(selectFirst)renderStockList(false);
  }
  function resetCustomStockDimensions(){
    sideMediaWidthMm=null;sideWidthDerived=false;ellipseDefaultAdjusted=false;
    const factor=unit==='in'?25.4:1;
    for(const [id,value] of [['Width',DEFAULT_TEMPLATE_SIZE_IN*25.4],['Height',DEFAULT_TEMPLATE_SIZE_IN*25.4],['Left',0],['Top',0],['Right',0],['Bottom',0],['GapX',0],['GapY',0],['PaperW',210],['PaperH',297],['Columns',1],['Rows',1]]){
      if(TEMPLATE_DIM_IDS.includes(id))q(id).value=unit==='in'?String(DEFAULT_TEMPLATE_SIZE_IN):String(roundTemplateDim(value/factor));
      else q(id).value=Number(value)/(['PaperW','PaperH','Columns','Rows'].includes(id)?1:factor);
    }
    syncTemplateDimStepMode();
    q('TemplateSizePreset').value=DEFAULT_TEMPLATE_SIZE_PRESET;
    q('SingleItem').checked=true;syncItemCounts();
  }
  function renderStockList(selectFirst=true){
    const category=q('StockCategory').value,list=q('StockList'),stocks=window.QLabelStockCatalog?.getStocks(category)||[];
    list.replaceChildren(...stocks.map(stock=>{const option=document.createElement('option');option.value=stock.name;option.textContent=stockDisplayName(stock.name);return option;}));
    if(stocks.length){const previous=stocks.indexOf(selectedStock);list.selectedIndex=!selectFirst&&previous>=0?previous:0;applyStock(stocks[list.selectedIndex]);}
    else{selectedStock=null;const option=document.createElement('option');option.textContent='No predefined stocks available';option.disabled=true;list.append(option);}
  }
  function populateStockCategories(){
    const category=q('StockCategory'),list=q('StockList'),all=(window.QLabelStockCatalog?.getManufacturers()||[]).filter(name=>String(name).trim()!==''),names=window.StockCatalogUi?.sortManufacturersForPrinter?.(all,q('Printer').value)||all;category.replaceChildren(...names.map(name=>{const option=document.createElement('option');option.value=name;option.textContent=name;return option;}));
    category.disabled=!q('StockPredefined').checked;list.disabled=!q('StockPredefined').checked;
    if(q('StockPredefined').checked)applyDefaultStockCategory();
    else{category.value='';list.replaceChildren();selectedStock=null;}
  }
  function validate() {
    for(const id of [...dimensions,...(multipleItems()?['Rows','Columns']:[]),...(mode()==='sheet'?['PaperW','PaperH']:[]),...(sideEdgesEnabled?['EdgeLeft','EdgeRight']:[])]) if(!q(id).checkValidity()) { q('Error').textContent='Enter valid dimensions and counts.'; return false; }
    if(step===4&&!updateSideTemplateWidth())return false;
    const g=geometry();
    if(!Number.isInteger(g.rows)||!Number.isInteger(g.columns)||g.rows*g.columns>1000) {q('Error').textContent='Use whole-number counts, with no more than 1,000 labels per page.';return false;}
    if(mm('Left')+g.columns*g.width+(g.columns-1)*mm('GapX')+mm('Right')>g.paperW+.001 || mm('Top')+g.rows*g.height+(g.rows-1)*mm('GapY')+mm('Bottom')>g.paperH+.001) {q('Error').textContent='The labels and margins exceed the paper size.';return false;}
    q('Error').textContent='';return true;
  }
  function renderLibraryStartingPreview(){
    const item=selectedLibraryTemplate;
    const preview=ensureStartingPreview(),image=q('StartingPreviewImage');
    preview.hidden=false;
    const source=item?.imported_artwork?.png_data_url||item?.thumbnail_url;
    const art=item?.imported_artwork;
    preview.querySelector('.nw-start-preview-label').style.aspectRatio=art?.bitmap_width&&art?.bitmap_height?`${art.bitmap_width} / ${art.bitmap_height}`:`${item?.width_in||3} / ${item?.height_in||1}`;
    image.hidden=!source;
    image.onerror=()=>{image.hidden=true;};
    if(source){
      image.src=source.replace('https://bartender-template-s3-storage-gateway.s3.us-west-2.amazonaws.com/TemplateImages/','https://bartender-images-cdn.bartendercloud.com/TemplateImages/');
    }else image.removeAttribute('src');
    const w=item?.width_in,h=item?.height_in;
    const pageLabel=`Page Size: ${Number(libraryPageWidthIn).toString()} x ${Number(libraryPageHeightIn).toString()} in`;
    const sizeLabel=w&&h?`Template Size: ${Number(w).toString()} x ${Number(h).toString()} in`:'';
    q('Size').innerHTML=[pageLabel,sizeLabel].filter(Boolean).join('<br>');
  }
  function preview() {
    if(step===0)return;
    if(step===7||step===8){const g=geometry(),svg=q('Preview');window.PaperPreview?.renderSingleSheet(svg,{width_mm:g.width,height_mm:g.height,label_shape:printedItemShape,corner_radius_mm:Math.min(8,Math.min(g.width,g.height)*.03125),background_color:q('BackgroundColorEnabled').checked&&bgColorValue?bgColorValue:'#ffffff',background_picture:q('BackgroundPictureEnabled').checked&&bgPictureEmbedded()?backgroundPictureData:null,stock:{liner_left_mm:sideEdgeMm('left'),liner_right_mm:sideEdgeMm('right')}},{finished:true});q('Size').textContent=`Template Size: ${formatSize(g.width,g.height)}`;return;}
    const g=geometry(); if(!(g.paperW>0&&g.paperH>0))return;
    if(usesPredefinedStock()&&selectedStock&&window.StockPreview&&![3,4,5,6,7].includes(step)){const aside=q('Preview').parentElement;window.StockPreview.render(aside,currentCatalogStock(),unit);const svg=aside.querySelector('svg');if(svg)svg.id='nwPreview';const size=aside.querySelector('small');if(size){size.id='nwSize';size.textContent=`Template Size: ${formatSize(g.width,g.height)}`;}return;}
    if(window.PaperPreview&&(step===3||step===4||step===5||step===6||step===7||!usesPredefinedStock()||!selectedStock)){const aside=q('Preview').parentElement,base=window.StockApply?.resolveLabelShapeFromStock(currentCatalogStock())||{label_shape:'rectangle',corner_radius_mm:0},shapeUsesPrinted=step===5||step===6||step===7,shape=shapeUsesPrinted?printedItemShape:base.label_shape,defaultRadius=base.corner_radius_mm||Math.min(g.width,g.height)*.03125,template={width_mm:g.width,height_mm:g.height,...base,label_shape:shape,corner_radius_mm:shape==='rounded'?(shapeUsesPrinted?Math.min(8,defaultRadius):defaultRadius):0,mirror:!!q('MirrorImage')?.checked,negative:!!q('Negative')?.checked,print_orientation:templatePageOrientation.includes('inverted')?'inverted':'normal',stock:{liner_left_mm:sideEdgeMm('left'),liner_right_mm:sideEdgeMm('right')},page:{enabled:true,width_mm:g.paperW,height_mm:g.paperH,rows:g.rows,columns:g.columns,left_mm:mm('Left'),top_mm:mm('Top'),gap_x_mm:mm('GapX'),gap_y_mm:mm('GapY')}};const printerLayout=false,section=step===5||step===6||step===7?'Printed Item Shape':'Stock';window.PaperPreview.render(aside,template,unit,false,printerLayout,section);aside.querySelector('svg').id='nwPreview';if([3,4,5,6,7].includes(step))tuneWizardPreviewPane(aside);const size=aside.querySelector('small');size.id='nwSize';size.textContent=`Template Size: ${formatSize(g.width,g.height)}`;return;}
    const scale=Math.min(175/g.paperW,250/g.paperH), x=(200-g.paperW*scale)/2, y=(300-g.paperH*scale)/2;
    let svg=`<rect x="${x}" y="${y}" width="${g.paperW*scale}" height="${g.paperH*scale}" fill="white" stroke="#444"/>`;
    for(let row=0;row<Math.min(g.rows,30);row++)for(let col=0;col<Math.min(g.columns,30);col++)svg+=`<rect x="${x+(mm('Left')+col*(g.width+mm('GapX')))*scale}" y="${y+(mm('Top')+row*(g.height+mm('GapY')))*scale}" width="${g.width*scale}" height="${g.height*scale}" fill="none" stroke="#007eaa" stroke-width=".7"/>`;
    q('Preview').innerHTML=svg;q('Size').textContent=`Template Size: ${formatSize(g.width,g.height)}`;
  }
  style.textContent+="#newLabelWizard .nw-body[data-preview=hidden]{grid-template-columns:minmax(0,1fr)!important;}";
  style.textContent+='#newLabelWizard .nw-body[data-step="0"][data-preview="visible"]{grid-template-columns:minmax(0,1fr) 198px!important;gap:12px}#newLabelWizard .nw-body[data-step="0"][data-preview="visible"] .nw-pages{min-width:0;max-width:none}#newLabelWizard .nw-body[data-step="0"][data-preview="visible"] aside{box-sizing:border-box;align-self:start;justify-content:flex-start;gap:4px;padding:0;background:transparent;overflow:hidden}#newLabelWizard .nw-body[data-step="0"][data-preview="visible"] #nwPreview{display:none}#newLabelWizard .nw-starting-preview{box-sizing:border-box;display:flex;flex:0 0 270px;width:100%;height:270px;align-items:center;justify-content:center;padding:8px;background:#737373;overflow:hidden}#newLabelWizard .nw-start-preview-label{position:relative;box-sizing:border-box;display:flex;align-items:center;width:100%;aspect-ratio:3/1;max-height:100%;border-radius:10px;background:#fff;overflow:hidden}#newLabelWizard .nw-start-preview-label img{display:block;width:100%;height:100%;object-fit:contain}#newLabelWizard .nw-start-preview-label img[hidden]{display:none}#newLabelWizard .nw-start-preview-fallback{box-sizing:border-box;display:grid;grid-template-columns:1fr auto;align-items:center;gap:5px 8px;width:100%;padding:8px 10px;color:#17212b;font:11px Arial,sans-serif}#newLabelWizard #nwStartingPreviewImage:not([hidden])+.nw-start-preview-fallback{display:none}#newLabelWizard .nw-body[data-step="0"][data-preview="visible"] aside>small{box-sizing:border-box;width:100%;padding:0 4px;color:#111827;text-align:center;line-height:1.35}';
  style.textContent+='#newLabelWizard:has(.nw-body[data-step="0"])>form>.nw-heading{min-height:60px;height:60px;padding:8px 0 8px 10px!important}#newLabelWizard:has(.nw-body[data-step="0"]) .nw-heading-copy p{font:11px Arial,sans-serif;margin-top:2px}#newLabelWizard .nw-body[data-step="0"]{padding:12px 20px 6px 14px!important;overflow:hidden!important;align-items:start}#newLabelWizard .nw-body[data-step="0"] .nw-pages{overflow:hidden!important}#newLabelWizard .nw-starting-point{padding:0;font:11px Arial,sans-serif}#newLabelWizard .nw-starting-point>.nw-start-help{max-width:330px;margin:0 0 28px;line-height:1.2}#newLabelWizard .nw-starting-point fieldset{margin:0 0 8px}#newLabelWizard .nw-starting-point fieldset legend{margin:0 0 8px}#newLabelWizard .nw-starting-point fieldset label{margin:7px 18px}#newLabelWizard .nw-library-notice{margin:8px 34px 10px!important;font:11px/20px Arial,sans-serif;white-space:nowrap}#newLabelWizard #nwSelectTemplate{margin-left:18px;padding:3px 9px;font:11px Arial,sans-serif;min-height:22px}#newLabelWizard #nwSelectTemplate>svg{display:none!important}#newLabelWizard .nw-library-document{margin:6px 32px;font:11px Arial,sans-serif}#newLabelWizard .nw-data-entry{margin:8px 40px!important;gap:3px}#newLabelWizard .nw-starting-preview{padding:0;background:#6e6e6e}#newLabelWizard .nw-start-preview-label{border-radius:0;background:transparent}#newLabelWizard .nw-start-preview-fallback{display:block;text-align:center;color:white;background:transparent}#newLabelWizard .nw-body[data-step="0"] aside>small{font:11px/18px Arial,sans-serif!important}';
  style.textContent+='#newLabelWizard .nw-body:is([data-step="3"],[data-step="4"],[data-step="5"],[data-step="6"]) aside>svg{background:#bfbfbf!important;border:1px solid #aaa!important}';
  style.textContent+='#newLabelWizard .nw-body[data-step="3"] aside>svg{transform:none!important}';
  style.textContent+='#newLabelWizard .nw-body[data-step="6"] .nw-template-size{margin-top:0;font-size:12px}#newLabelWizard .nw-body[data-step="6"] .nw-template-preset{margin-bottom:5px}#newLabelWizard .nw-body[data-step="6"] .nw-template-dims{gap:3px;margin-bottom:4px}#newLabelWizard .nw-body[data-step="6"] .nw-template-note{margin:3px 0 6px;line-height:1.2}#newLabelWizard .nw-body[data-step="6"] .nw-template-orientation,#newLabelWizard .nw-body[data-step="6"] .nw-template-effects{padding:4px 8px;margin-bottom:4px}#newLabelWizard .nw-body[data-step="6"] .nw-template-effects{display:grid;grid-template-columns:1fr 1fr}';
  style.textContent+='#newLabelWizard .nw-body:is([data-step="7"],[data-step="8"]){grid-template-columns:minmax(0,1fr) 198px;gap:12px;overflow:hidden!important;align-items:start;padding-top:8px;padding-bottom:8px}#newLabelWizard .nw-body:is([data-step="7"],[data-step="8"]) .nw-pages{overflow:hidden!important;min-height:0}#newLabelWizard .nw-body:is([data-step="7"],[data-step="8"]) aside{background:transparent;padding:0;align-self:start;overflow:hidden}#newLabelWizard .nw-orientation-printer{object-fit:contain;background:transparent}#newLabelWizard .nw-template-background{font:12px Arial,sans-serif}#newLabelWizard .nw-template-background fieldset{display:block;border-top:1px solid #aaa}#newLabelWizard .nw-template-background label{justify-content:flex-start;gap:5px;margin:6px 0 0}#newLabelWizard .nw-template-background p{margin:1px 0 5px 22px;font-size:11px}#newLabelWizard .nw-template-background input[type=file]{display:none!important}#newLabelWizard .nw-template-background input[type=color]{display:none!important}#newLabelWizard .nw-template-background label span{cursor:pointer}#newLabelWizard .nw-finished-page{font:12px Arial,sans-serif;line-height:1.35}#newLabelWizard .nw-finished-page>p:first-child{margin:0 0 10px}#newLabelWizard .nw-finished-page>p:nth-of-type(2){margin:0 0 6px}#newLabelWizard .nw-finished-review{box-sizing:border-box;display:grid;grid-template-columns:135px 1fr;align-content:start;gap:3px 10px;border:1px solid #aaa;padding:8px;background:white}';
  style.textContent+='#newLabelWizard .nw-body{background:#f1f1f1}#newLabelWizard .nw-template-background{font:11px Arial,sans-serif;color:#111}#newLabelWizard .nw-template-background fieldset{margin:7px 0 0;padding:0;border:0;border-top:1px solid #aaa}#newLabelWizard .nw-template-background legend{padding:0 6px 0 0;color:#111}#newLabelWizard .nw-template-background label{margin:5px 0 0 8px;gap:4px}#newLabelWizard .nw-template-background p{max-width:335px;margin:0 0 4px 28px;font:11px/1.25 Arial,sans-serif}#newLabelWizard .nw-template-background input[type=color],#newLabelWizard .nw-template-background input[type=file]{display:none!important}';
  // Template Background sub-pages: one per ticked feature, in Color, Picture, Design Guide order.
  const BG_PAGES=[['color','BackgroundColorEnabled','BgColorPage','Template Background Color','Select a color for your template background.'],['picture','BackgroundPictureEnabled','BgPicturePage','Template Background Picture','Select a picture for your template background.'],['guide','BackgroundGuideEnabled','BgGuidePage','Design Guide Image','Select a design guide image to display in the background.']];
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
  style.textContent+="#newLabelWizard .nw-bg-sub{font:11px Arial,sans-serif;color:#111;padding:10px 4px}#newLabelWizard .nw-bg-sub[hidden]{display:none}#newLabelWizard .nw-bg-row{display:flex;align-items:center;gap:10px;margin:0 0 10px}#newLabelWizard .nw-bg-row>label{min-width:96px}#newLabelWizard .nw-bg-row select{min-width:200px;font:11px Arial,sans-serif}#newLabelWizard #nwBgColorButton{display:inline-flex;align-items:center;gap:8px;min-width:150px;min-height:0;padding:3px 6px;border:1px solid #7a8a99;border-radius:2px;background:#fff;cursor:pointer;font:11px Arial,sans-serif}#newLabelWizard .nw-bg-swatch{width:16px;height:12px;border:1px solid #6b7785;background:linear-gradient(135deg,#fff 45%,#dc2626 46% 54%,#fff 55%)}#newLabelWizard .nw-bg-arrow{margin-left:auto;font-size:10px}#newLabelWizard .nw-bg-options{margin:10px 0;padding:6px 10px;border:0;border-top:1px solid #aaa;color:#777}#newLabelWizard .nw-bg-options label{display:flex;align-items:center;gap:8px;margin:6px 0}#newLabelWizard .nw-bg-buttons{display:flex;flex-wrap:wrap;gap:6px}#newLabelWizard .nw-bg-sub button{min-height:0;padding:4px 12px;font:11px Arial,sans-serif}#newLabelWizard .nw-bg-source{display:flex;gap:8px;padding:8px;margin:0 0 10px;border:1px solid #bbb}#newLabelWizard .nw-bg-filename{margin:0 0 8px;color:#335;word-break:break-all}#newLabelWizard .nw-bg-hint{margin:2px 0 10px 20px;font:11px Arial,sans-serif;color:#333}#newLabelWizard .nw-bg-check{display:flex;align-items:center;gap:6px;margin:6px 0 0}";
  style.textContent+='#newLabelWizard:has(.nw-body[data-step="8"])>form>.nw-heading{min-height:60px;height:60px;padding:8px 0 8px 10px!important}#newLabelWizard .nw-body[data-step="8"]{padding-right:16px!important;scrollbar-width:none}#newLabelWizard .nw-body[data-step="8"]::-webkit-scrollbar{display:none;width:0;height:0}#newLabelWizard .nw-body:is([data-step="7"],[data-step="8"]) aside{width:198px;display:flex;flex:0 0 auto;flex-direction:column;align-items:center;max-height:100%}#newLabelWizard .nw-body:is([data-step="7"],[data-step="8"]) aside>svg{box-sizing:border-box;display:block;flex:0 0 270px;width:198px!important;height:270px!important;max-width:198px!important;max-height:270px!important;background:transparent!important;border:1px solid #aaa!important;overflow:hidden}#newLabelWizard .nw-body:is([data-step="7"],[data-step="8"]) aside>small{display:block;width:198px;text-align:center;margin-top:8px;padding:0;font:11px/1.25 Arial,sans-serif}';
  function render() {
    pages.forEach((p,i)=>p.hidden=i!==step);
    const body=dialog.querySelector('.nw-body');body.dataset.step=String(step);
    {const sub=step===7&&bgSub>=0?activeBgPages()[bgSub]:null;dialog.querySelector('.nw-heading strong').textContent=sub?sub[3]:headings[step][0];dialog.querySelector('.nw-heading p').textContent=sub?sub[4]:headings[step][1];syncBackgroundPages();}
    const libraryBlocked=step===0&&usesLibraryStartingPoint()&&!selectedLibraryTemplate;
    q('Back').disabled=step===0||busy;q('Next').disabled=step===8||busy||libraryBlocked||(step===1&&!selectedPrinterDpi);q('Finish').disabled=busy||libraryBlocked||step===4||step===6||step===7;
    const previewHidden=step===0?!selectedLibraryTemplate:(step<2||(step===2&&!usesPredefinedStock()));
    q('Preview').parentElement.hidden=previewHidden;body.dataset.preview=previewHidden?'hidden':'visible';
    ensureStartingPreview().hidden=step!==0||!selectedLibraryTemplate;
    if(step===0&&selectedLibraryTemplate)renderLibraryStartingPreview();
    syncTemplateSizeUnits();
    if(step===8){const g=geometry();q('FinishedStarting').textContent=selectedLibraryTemplate?selectedLibraryTemplate.name:'Blank';q('FinishedPrinter').textContent=q('Printer').value;q('FinishedSize').textContent=formatSize(g.width,g.height);}
    syncTemplateDimStepMode();
    if(step===1){
      if(wizardPrinterSyncStep!==1){
        wizardPrinterSyncStep=1;
        syncWizardPrintersFromApp();
        requestWizardPrinterSync();
      }
      updatePrinterActions();
    }else wizardPrinterSyncStep=-1;
    preview();
  }
  function close(){if(!busy)dialog.close();}
  dialog.querySelector('header button').onclick=close;q('Cancel').onclick=close;
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  q('Back').onclick=()=>{if(step===7&&bgSub>=0)bgSub--;else if(step===8){step=7;bgSub=activeBgPages().length-1;}else step--;if(step===4)captureSideMediaWidth();q('Error').textContent='';render();};
  async function openPrinterDialog(preferences){
    const name=q('Printer').value;if(!name)return;
    const button=q(preferences?'DocumentProperties':'PrinterProperties');button.disabled=true;
    try{const result=await window.zebra.printerProperties({name,preferences});if(result?.ok===false)q('Error').textContent=result.error||'Could not open printer settings.';}
    catch(error){q('Error').textContent=error?.message||'Could not open printer settings.';}
    finally{button.disabled=false;}
  }
  q('DocumentProperties').onclick=()=>openPrinterDialog(true);
  q('PrinterProperties').onclick=()=>openPrinterDialog(false);
  dialog.querySelectorAll('[name=nwStartingPoint]').forEach(r=>r.addEventListener('change',()=>{
    if(r.value==='library'&&r.checked){q('SelectTemplate').disabled=false;void openLibraryPicker();}
    else if(r.value==='blank'&&r.checked){q('SelectTemplate').disabled=true;clearLibrarySelection();q('StockPredefined').checked=false;q('StockCustom').checked=true;selectedStock=null;q('StockCategory').value='';q('StockList').replaceChildren();q('StockCategory').disabled=true;q('StockList').disabled=true;render();}
    else syncStartingPointUi();
  }));
  q('SelectTemplate').onclick=()=>{if(usesLibraryStartingPoint())void openLibraryPicker();};
  const advanceWizardNext=()=>{if(step===1&&!selectedPrinterDpi){q('Error').textContent='Select a printer with a published DPI value to continue.';return;}if(step===2&&q('StockPredefined').checked&&!selectedStock){q('Error').textContent='Select a predefined stock or choose custom settings.';return;}if(step===3&&multipleItems()&&(!q('Rows').checkValidity()||!q('Columns').checkValidity()||val('Rows')*val('Columns')>1000)){q('Error').textContent='Enter valid whole-number row and column counts, up to 1,000 items per page.';return;}if(step===4&&!validate())return;if(step===6){commitTemplateOrientationFromUi();if(!validate())return;}if(step===7&&bgSub<activeBgPages().length-1){bgSub++;q('Error').textContent='';render();return;}step++;if(step===4)captureSideMediaWidth();if(step===7)bgSub=-1;q('Error').textContent='';render();if(step===2)applyDefaultStockCategory();};
  q('Next').onclick=advanceWizardNext;
  async function advanceFromListDoubleClick(list,clickEvent,onSelected){
    if(busy||!list||list.disabled)return;
    const option=clickEvent?.target?.tagName==='OPTION'?clickEvent.target:null;
    if(option?.value)list.value=option.value;
    if(onSelected)onSelected();
    else if(typeof list.onchange==='function')await list.onchange.call(list,new Event('change',{bubbles:true}));
    else list.dispatchEvent(new Event('change',{bubbles:true}));
    if(!q('Next').disabled)advanceWizardNext();
  }
  q('Printer').addEventListener('dblclick',e=>{if(step!==1)return;void advanceFromListDoubleClick(q('Printer'),e);});
  q('StockList').addEventListener('dblclick',e=>{if(step!==2||!q('StockPredefined').checked)return;void advanceFromListDoubleClick(q('StockList'),e,()=>{const stocks=window.QLabelStockCatalog?.getStocks(q('StockCategory').value)||[];applyStock(stocks[q('StockList').selectedIndex]);});});
  q('Unit').onchange=()=>{const next=q('Unit').value;for(const id of dimensions)q(id).value=+(val(id)*(unit==='in'?25.4:1)/(next==='in'?25.4:1)).toFixed(6);unit=next;renderSideEdges();syncTemplateSizeUnits();syncTemplateDimStepMode();preview();};
  dialog.querySelectorAll('[name=nwTemplateOrientation]').forEach(r=>r.addEventListener('change',()=>{commitTemplateOrientationFromUi();updatePrinterArt();preview();}));
  dialog.querySelector('.nw-orientation-printer')?.addEventListener('dblclick',()=>{if(step!==6||q('Next').disabled)return;advanceWizardNext();});
  for(const id of ['MirrorImage','Negative'])q(id)?.addEventListener('change',()=>{updatePrinterArt();preview();});
  function refreshSideEdges(){const valid=updateSideTemplateWidth();if(step===4){q('Next').disabled=!valid||busy;q('Preview').style.visibility=valid?'':'hidden';}if(valid)preview();}
  dialog.querySelectorAll('[name=nwSideEdges]').forEach(r=>r.onchange=()=>{const enabled=q('SideEdgesYes').checked;if(enabled&&!sideEdgesEnabled&&!edgeLeftMm&&!edgeRightMm)edgeLeftMm=edgeRightMm=DEFAULT_SIDE_EDGE_MM;sideEdgesEnabled=enabled;renderSideEdges();refreshSideEdges();});
  for(const id of ['EdgeLeft','EdgeRight'])q(id).addEventListener('input',()=>{if(id==='EdgeLeft')edgeLeftMm=mm(id);else edgeRightMm=mm(id);refreshSideEdges();});
  q('StockCategory').onchange=()=>renderStockList();
  q('StockList').onchange=()=>applyStock(window.QLabelStockCatalog?.getStocks(q('StockCategory').value)[q('StockList').selectedIndex]);
  dialog.querySelectorAll('[name=nwStockMode]').forEach(r=>r.onchange=()=>{
    const predefined=q('StockPredefined').checked;q('PredefinedStock').hidden=false;q('CustomStock').hidden=false;q('StockCategory').disabled=!predefined;q('StockList').disabled=!predefined;
    if(predefined)applyDefaultStockCategory(false);
    else{selectedStock=null;q('StockCategory').value='';q('StockList').replaceChildren();edgeLeftMm=edgeRightMm=DEFAULT_SIDE_EDGE_MM;sideEdgesEnabled=true;q('SideEdgesYes').checked=true;q('SideEdgesNo').checked=false;renderSideEdges();resetCustomStockDimensions();}
    q('Error').textContent='';preview();render();
  });
  dialog.querySelectorAll('[name=nwItemsMode]').forEach(r=>r.onchange=syncItemCounts);
  q('Printer').onchange=async()=>{
    const request=++printerResolutionRequest,name=q('Printer').value;
    q('Error').textContent='';q('DriverNotice').textContent='';q('DriverNotice').hidden=true;
    const nominal=nominalDpiFromPrinterName(name);
    if(!name)selectedPrinterDpi=null;
    else if(nominal)selectedPrinterDpi=nominal;
    if(!name){render();return;}
    try{
      const result=await window.zebra.getPrinterResolution(name);if(request!==printerResolutionRequest)return;
      const dpi=Number(result?.dpi);
      if(result?.code==='APP_RESTART_REQUIRED'){
        if(Number.isInteger(dpi)&&dpi>=72&&dpi<=2400)selectedPrinterDpi=dpi;
        q('DriverNotice').textContent=result.notice||'Save your label and restart Q LABEL to load printer driver support.';q('DriverNotice').hidden=false;
      }
      else if(Number.isInteger(dpi)&&dpi>=72&&dpi<=2400){selectedPrinterDpi=dpi;}
      else{
        selectedPrinterDpi=nominalDpiFromPrinterName(name);
        q('Error').textContent=result?.error||'The printer driver did not report a valid resolution.';
      }
    }catch(error){
      if(request!==printerResolutionRequest)return;
      selectedPrinterDpi=nominalDpiFromPrinterName(name);
      q('Error').textContent=error?.message||'Could not read the selected printer driver resolution.';
    }
    applyDefaultStockCategory(false);render();
  };
  const updatePrinterActions=()=>{const disabled=!String(q('Printer').value||'').trim()||busy;for(const id of ['DocumentProperties','PrinterProperties'])q(id).disabled=disabled;};
  q('Printer').addEventListener('change',updatePrinterActions);updatePrinterActions();
  q('TemplateSizePreset').onchange=()=>applyTemplateSizePreset(q('TemplateSizePreset').value);
  for(const [check,control] of [['BackgroundColorEnabled','BackgroundColor'],['BackgroundPictureEnabled','BackgroundPicture'],['BackgroundGuideEnabled','BackgroundGuide']]){const checkbox=q(check),input=q(control),optionLabel=checkbox.closest('label');checkbox.onchange=()=>{bgSub=-1;preview();};}
  q('BackgroundColor').oninput=preview;
  q('BgColorButton').onclick=()=>{
    if(!window.ColorPicker)return;
    window.ColorPicker.open(q('BgColorButton'),{value:bgColorValue||'#ffffff',allowNone:true,onPick:hex=>{bgColorValue=hex;q('BackgroundColor').value=hex;syncBackgroundPages();preview();},onNone:()=>{bgColorValue=null;syncBackgroundPages();preview();}});
  };
  q('BgPictureSource').onchange=()=>{if(!bgPictureEmbedded()){q('BackgroundPicture').value='';backgroundPictureData=null;}syncBackgroundPages();preview();};
  q('BgPictureBrowse').onclick=()=>q('BackgroundPicture').click();
  q('BgGuideFile').onclick=()=>q('BackgroundGuide').click();
  q('BackgroundGuide').onchange=()=>{q('BgGuideHide').checked=false;syncBackgroundPages();};
  q('BgGuideRemove').onclick=()=>{q('BackgroundGuide').value='';q('BgGuideHide').checked=false;syncBackgroundPages();};
  q('BackgroundPicture').onchange=()=>{const file=q('BackgroundPicture').files[0];syncBackgroundPages();if(!file){backgroundPictureData=null;preview();return;}const reader=new FileReader();reader.onload=()=>{backgroundPictureData=String(reader.result||'');preview();};reader.readAsDataURL(file);};
  for(const id of TEMPLATE_DIM_IDS){const input=q(id);input.addEventListener('change',()=>{formatTemplateDimInput(id);syncTemplateSizePresetFromDims();});input.addEventListener('keydown',event=>{if(event.key==='ArrowUp'){event.preventDefault();nudgeTemplateDim(id,1);}else if(event.key==='ArrowDown'){event.preventDefault();nudgeTemplateDim(id,-1);}});input.addEventListener('input',()=>syncTemplateSizePresetFromDims());}
  dialog.addEventListener('input',()=>{if(step===4&&q('Next').disabled)return;preview();});
  dialog.querySelectorAll('[name=nwPrintedItemShape]').forEach(r=>r.addEventListener('change',()=>{if(!r.checked)return;const width=mm('Width'),height=mm('Height');if(ellipseDefaultAdjusted&&r.value!=='ellipse'){if(Math.abs(width-104.14)<.001){q('Width').value=unit==='in'?'4':String(101.6);if(sideMediaWidthMm!==null)sideMediaWidthMm-=2.54*sideMediaColumns;}ellipseDefaultAdjusted=false;}else if(r.value==='ellipse'&&!usesPredefinedStock()&&Math.abs(width-101.6)<.001&&Math.abs(height-101.6)<.001){q('Width').value=unit==='in'?'4.1':String(104.14);if(sideMediaWidthMm!==null)sideMediaWidthMm+=2.54*sideMediaColumns;ellipseDefaultAdjusted=true;}syncTemplateSizePresetFromDims();printedItemShape=r.value;preview();render();}));
  dialog.querySelector('form').onsubmit=async event=>{
    event.preventDefault();if(busy)return;if(step>=4&&!Number.isFinite(sideEdgeWidth())){step=4;render();refreshSideEdges();return;}if(selectedLibraryTemplate?.imported_native_package?.native_forms?.excluded===true&&q('DataEntryForm').checked){q('Error').textContent='This template’s native data-entry form is unavailable. Clear the option to continue with editable label objects.';return;}commitTemplateOrientationFromUi();if(!selectedPrinterDpi){step=0;render();q('Error').textContent='Could not read a valid resolution from the selected printer driver.';return;}if(!validate()){step=6;render();q('Error').textContent='Enter valid dimensions and counts.';return;}if(!q('Name').value.trim())q('Name').value='new-label';
    busy=true;render();try{
      if(!await window.prepareEditorNavigation())return;rememberPrintPage();
      const g=geometry(),tpl=blankTemplate(),shapeLabel=printedItemShape==='rounded'?'rounded':printedItemShape;Object.assign(tpl,{name:q('Name').value.trim(),elements:[],values:{},field_meta:{},unit,dpi:selectedPrinterDpi,language:'zpl',width_mm:g.width,height_mm:g.height,label_shape:shapeLabel,corner_radius_mm:printedItemShape==='rounded'?Math.min(g.width,g.height)*.03125:0,page_orientation:templatePageOrientation,print_orientation:templatePageOrientation.includes('inverted')?'inverted':'normal',mirror:!!q('MirrorImage').checked,negative:!!q('Negative').checked,print_order:q('Order').value,...(selectedLibraryTemplate?{bartender_library_template:{name:selectedLibraryTemplate.name,industry:selectedLibraryTemplate.industry,path:selectedLibraryTemplate.resolved_path||selectedLibraryTemplate.relative_path,btw_url:selectedLibraryTemplate.btw_url,thumbnail_url:selectedLibraryTemplate.thumbnail_url,source:selectedLibraryTemplate.source||'cloud',data_entry_form:!!q('DataEntryForm').checked}}:{}),stock:{...(selectedStock?{name:selectedStock.name,manufacturer:selectedStock.manufacturer}:{}),type:q('Media').value,liner_left_mm:sideEdgeMm('left'),liner_right_mm:sideEdgeMm('right')},media_tracking:{'die-cut':'Y','black-mark':'M','continuous':'N'}[q('Media').value],page:{enabled:true,manual_template:false,unit,width_mm:g.paperW,height_mm:g.paperH,rows:g.rows,columns:g.columns,left_mm:mm('Left'),right_mm:mm('Right'),top_mm:mm('Top'),bottom_mm:mm('Bottom'),gap_x_mm:mm('GapX'),gap_y_mm:mm('GapY')}});
      if(q('BackgroundColorEnabled').checked&&bgColorValue){tpl.elements.push({type:'rectangle',name:'Background Color',x_mm:0,y_mm:0,width_mm:g.width,height_mm:g.height,fill:bgColorValue,stroke:'none'});}
      if(q('BackgroundPictureEnabled').checked&&bgPictureEmbedded()&&q('BackgroundPicture').files[0]){const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(q('BackgroundPicture').files[0]);});tpl.elements.push({type:'image',name:'Background Picture',x_mm:0,y_mm:0,width_mm:g.width,height_mm:g.height,color_image_data:data});}
      if(q('BackgroundGuideEnabled').checked&&q('BackgroundGuide').files[0]){const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(q('BackgroundGuide').files[0]);});tpl.design_guide_image=data;tpl.design_guide_hidden=!!q('BgGuideHide').checked;}
      if(usesPredefinedStock()&&window.StockApply){
        window.StockApply.applyCatalogStockToTemplate(tpl,currentCatalogStock());
        tpl.page.manual_template=true;
        const stockShape=window.StockApply.resolveLabelShapeFromStock(currentCatalogStock());tpl.label_shape=shapeLabel;tpl.corner_radius_mm=printedItemShape==='rounded'?(stockShape.corner_radius_mm||Math.min(g.width,g.height)*.03125):0;
      }
      if(selectedLibraryTemplate){
        const nativePackage=selectedLibraryTemplate.imported_native_package;
        if(!nativePackage)throw new Error(selectedLibraryTemplate.conversion_error||'Editable native conversion is not verified for this template. Preview only; Finish cannot create an editable document.');
        for(const key of ['native_document','native_forms','print_order','elements','sourceDefinitions','dataSourceSchemaVersion','sourceDocumentId','values','field_meta','page','fonts','width_mm','height_mm','label_shape','corner_radius_mm','template_pages','template_page_active','designs','design_active','design_side','pages','page_orientation','print_orientation','mirror','negative','stock','media_tracking'])if(nativePackage[key]!==undefined)tpl[key]=structuredClone(nativePackage[key]);
        tpl.bartender_library_template.artwork_imported=false;
        tpl.bartender_library_template.objects_decomposed=true;
        tpl.bartender_library_template.native_source_sha256=nativePackage.source.sha256;
        tpl.bartender_library_template.native_verification=structuredClone(nativePackage.verification);
      }
      if(q('Printer').value){el('printerSelect').value=q('Printer').value;await window.zebra.saveSettings({printer:q('Printer').value});settings.printer=q('Printer').value;updateConnSummary();}
      current={name:tpl.name,file:null,editable:true};rawTemplate=null;editing=null;window.resetNewProjectView?.();openEditor(tpl);window.markNewLabelDraft?.();
      dialog.close();window.hideProjectHome?.();
    }catch(error){q('Error').textContent=error.message||String(error);}finally{busy=false;render();}
  };
  const openWizard=()=>{
    if(dialog.open)return;sideMediaWidthMm=null;ellipseDefaultAdjusted=false;printerResolutionRequest++;selectedPrinterDpi=null;dialog.querySelector('form').reset();window.NewLabelStockMode.setInitialStockMode(dialog);selectedStock=null;clearLibrarySelection();libraryPageWidthIn=8.5;libraryPageHeightIn=11;step=0;bgSub=-1;bgColorValue=null;busy=false;unit='in';sideEdgesEnabled=true;edgeLeftMm=edgeRightMm=DEFAULT_SIDE_EDGE_MM;printedItemShape='rounded';templatePageOrientation='normal';q('PrintedShapeRounded').checked=true;q('OrientPortrait').checked=true;q('MirrorImage').checked=false;q('Negative').checked=false;q('SideEdgesYes').checked=true;q('SideEdgesNo').checked=false;q('Unit').value=unit;resetCustomStockDimensions();syncTemplateOrientationUi();syncTemplateSizeUnits();renderSideEdges();q('Error').textContent='';q('DriverNotice').textContent='';q('DriverNotice').hidden=true;
    wizardPrinterSyncStep=-1;wizardPrinterSyncTicket++;
    syncWizardPrintersFromApp();requestWizardPrinterSync();
    populateStockCategories();syncStartingPointUi();q('Printer').onchange();preview();render();dialog.showModal();
  };
  window.openNewLabelWizard=()=>{
    if(dialog.open)return;
    if(window.getCloseState?.().dirty)return window.prepareEditorNavigation().then(allowed=>{if(allowed)openWizard();});
    return openWizard();
  };
})();
