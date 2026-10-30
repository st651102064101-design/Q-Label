(function(root){
  'use strict';
  function handle(event,{editable=false,selectedCells=[],selectedTable=false,toggleCellStyle,formatElement,element={}}={}){
    if(!(event?.ctrlKey||event?.metaKey)||editable)return false;
    const key={b:'bold',i:'italic',u:'underline'}[String(event.key||'').toLowerCase()];
    if(!key)return false;
    if(selectedTable&&selectedCells.length&&typeof toggleCellStyle==='function')toggleCellStyle(key);
    else if(typeof formatElement==='function')formatElement(key,!element[key]);
    else return false;
    event.preventDefault();
    return true;
  }
  const api={handle};
  if(typeof module!=='undefined')module.exports=api;
  root.FormatHotkeys=api;
})(typeof window!=='undefined'?window:globalThis);
