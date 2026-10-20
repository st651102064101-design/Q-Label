(function(){
  'use strict';
  const bundled=['Arial','Arial Unicode MS','Cambria','Cambria Math','Segoe UI Symbol','Segoe UI Historic','Segoe UI Emoji','Symbol','Wingdings','Wingdings 2','Wingdings 3','Webdings'];
  const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
  let installedFamilies=[];
  function normalize(values){
    const families=new Map();
    for(const value of values){
      if(typeof value!=='string'||!value.trim())continue;
      const family=value.trim(),key=family.toLocaleLowerCase('en-US');
      if(!families.has(key))families.set(key,family);
    }
    return [...families.values()].sort(collator.compare);
  }
  function enhance(select){
    if(!(select instanceof HTMLSelectElement)||!select.matches('.format-font'))return;
    const selectedIndices=typeof editorSelection!=='undefined'&&editorSelection?.size?[...editorSelection]:typeof editorSel!=='undefined'?[editorSel]:[];
    const selected=select.value||(typeof editing!=='undefined'&&editing?selectedIndices.map(index=>editing.elements[index]).find(Boolean)?.font_family:'');
    const families=normalize([...installedFamilies,...bundled,...[...select.options].map(option=>option.value),selected]);
    const current=new Set([...select.options].map(option=>option.value.toLocaleLowerCase('en-US')));
    if(families.some(family=>!current.has(family.toLocaleLowerCase('en-US')))||select.options.length!==families.length){
      select.replaceChildren(...families.map(family=>{
        const option=document.createElement('option');option.value=family;option.textContent=family;option.style.fontFamily=JSON.stringify(family);return option;
      }));
    }else for(const option of select.options)option.style.fontFamily=JSON.stringify(option.value);
    if(selected&&families.some(family=>family.toLocaleLowerCase('en-US')===selected.toLocaleLowerCase('en-US')))select.value=selected;
    select.style.fontFamily=JSON.stringify(select.value||selected||'Arial');
    if(!select.dataset.fontPreviewBound){
      select.dataset.fontPreviewBound='true';
      select.addEventListener('change',()=>{select.style.fontFamily=JSON.stringify(select.value||'Arial');});
    }
  }
  function scan(root=document){
    if(root.matches?.('.format-font'))enhance(root);
    root.querySelectorAll?.('.format-font').forEach(enhance);
  }
  scan();
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)scan(node);}))).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('editor-selection-changed',()=>scan());
  document.addEventListener('preview-updated',()=>scan());
  Promise.resolve(window.zebra?.getInstalledFontFamilies?.()).then(values=>{
    if(Array.isArray(values))installedFamilies=normalize(values);
    scan();
  }).catch(()=>scan());
})();
