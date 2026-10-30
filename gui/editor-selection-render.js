'use strict';

/** Refresh selection presentation without rebuilding the rendered artwork. */
function refreshSelectionPresentation({renderInspector, syncInspector, updateCanvasSelection, drawCanvas, allowLightCanvas=true}){
  const sync = syncInspector ?? renderInspector;
  if(allowLightCanvas&&updateCanvasSelection?.()){
    sync?.();
    return 'selection-only';
  }
  renderInspector?.();
  drawCanvas?.();
  return 'full-canvas';
}

function renderObjectName(element,box,pixelsPerMm=1,fallbackName='Object'){
  const name=String(element?.label||'').trim()||fallbackName;
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const shortName=Array.from(name).length>64?Array.from(name).slice(0,64).join('')+'…':name;
  const scale=1/Math.max(.01,Number(pixelsPerMm)||1),angle=element?.type==='line'?0:Number(element?.rotation_deg)||0;
  const pivot=box.rotationCenter||{x:box.x+box.w/2,y:box.y+box.h/2};
  return `<g class="selection-object-name" pointer-events="none" aria-label="${escape(name)}"${angle?` transform="rotate(${angle} ${pivot.x} ${pivot.y})"`:''}><g class="selection-object-name-anchor" transform="translate(${box.x} ${box.y})"><g class="selection-object-name-content" transform="scale(${scale})" data-base-transform="scale(${scale})"><title>${escape(name)}</title><text x="4" y="-3" font-family="Segoe UI, sans-serif" font-size="11" font-weight="600" fill="#15803d" stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke fill">${escape(shortName)}</text></g></g></g>`;
}

if(typeof module!=='undefined'&&module.exports)module.exports={refreshSelectionPresentation,renderObjectName};
if(typeof window!=='undefined')window.EditorSelectionRender={refreshSelectionPresentation,renderObjectName};
