'use strict';

(function exposeProjectPrinterSelection(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ProjectPrinterSelection=api;
})(typeof globalThis==='object'?globalThis:this,()=>{
  function resolveProjectPrinter(settings,file,availablePrinters){
    const choices=[settings?.projectPrinters?.[file],settings?.printer].filter(value=>typeof value==='string'&&value.trim());
    const available=Array.isArray(availablePrinters)?availablePrinters:null;
    if(available){
      for(const choice of choices)if(available.includes(choice))return choice;
      return available[0]||'';
    }
    return choices[0]||'';
  }

  function rememberProjectPrinter(settings,file,printer){
    if(!settings||typeof file!=='string'||!file||typeof printer!=='string'||!printer.trim())return settings?.projectPrinters||{};
    settings.projectPrinters={...(settings.projectPrinters||{}),[file]:printer};
    return settings.projectPrinters;
  }

  function applyProjectPrinter(settings,file,select,availablePrinters){
    const printer=resolveProjectPrinter(settings,file,availablePrinters);
    const fill=select?.ownerDocument?.defaultView?.WindowsPrinterList?.fillPrinterSelect;
    if(typeof fill==='function'){fill(select,availablePrinters||[],printer);return select.value||printer;}
    if(printer&&!Array.from(select.options).some(option=>option.value===printer)){
      const option=select.ownerDocument.createElement('option');option.value=printer;option.textContent=printer;select.append(option);
    }
    if(printer)select.value=printer;
    return select.value||printer;
  }

  return{resolveProjectPrinter,rememberProjectPrinter,applyProjectPrinter};
});
