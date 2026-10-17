'use strict';
(function(root){
  const folders=['Core & Retail','GS1 Formats','Medical IDs','Medicine IDs','Mail & Routing','Media & Publishing','Other Standards'];
  function categoryFor(bcid){
    if(/pharma|pzn|code32/.test(bcid))return 'Medicine IDs';
    if(/hibc/.test(bcid))return 'Medical IDs';
    if(/post|planet|mail|onecode|kix|identcode|leitcode|daft|maxicode|sscc/.test(bcid))return 'Mail & Routing';
    if(/flattermarken/.test(bcid))return 'Media & Publishing';
    if(/gs1|databar|composite|ean14|itf14/.test(bcid))return 'GS1 Formats';
    if(/ean|upc|code|qr|matrix|pdf|aztec|isbn|issn|ismn|telepen|msi|plessey|codabar/.test(bcid))return 'Core & Retail';
    return 'Other Standards';
  }
  function normalizeCatalog(items){
    return (Array.isArray(items)?items:[]).filter(item=>item&&typeof item==='object').map(item=>{
      const category=categoryFor(String(item.bcid||''));
      return {...item,category,folders:[category]};
    });
  }
  function filterCatalog(items,folder,query=''){
    const needle=String(query||'').trim().toLowerCase();
    return (Array.isArray(items)?items:[]).filter(item=>item&&Array.isArray(item.folders)&&item.folders.includes(folder)&&`${item.desc||''} ${item.bcid||''}`.toLowerCase().includes(needle));
  }
  const api={folders,categoryFor,normalizeCatalog,filterCatalog};
  root.BarcodeCategories=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
