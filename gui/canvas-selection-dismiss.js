'use strict';

const keepSelectionSelector=[
  '[data-editor-overlay]','.hit','.handle-hit','.handle','.rotation-hit','.hri-handle-hit',
  '.stroke-width-hit','.table-divider-hit','.table-divider-add','.table-corner-add','.line-controls',
  '[data-line-action]','.line-move-hit','.reset-hit','[data-table-select]',
  '.paper-corner-control','.preview-scrollbar','.preview-scrollbar-corner',
  '#previewZoomControl','button','input','select','textarea','[contenteditable="true"]',
].join(',');

function dismissOnEmptyPreviewPointerDown(event,{hasSelection,clearSelection}={}){
  if(!hasSelection||event?.button!==0||event.shiftKey||event.ctrlKey||event.metaKey)return false;
  if(event.target?.closest?.(keepSelectionSelector))return false;
  clearSelection?.();
  return true;
}

if(typeof module!=='undefined'&&module.exports)module.exports={dismissOnEmptyPreviewPointerDown,keepSelectionSelector};
if(typeof window!=='undefined')window.CanvasSelectionDismiss={dismissOnEmptyPreviewPointerDown};
