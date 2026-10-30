(function(root,factory){
  const icons=factory();
  if(typeof module==='object'&&module.exports)module.exports=icons;
  else root.RibbonHelpIcons=icons;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const paths={
    'Keyboard shortcuts':{name:'keyboard-shortcuts',markup:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M6 8h.8M9 8h.8M12 8h.8M15 8h.8M18 8h.8M6 11h.8M9 11h.8M12 11h.8M15 11h.8M18 11h.8M6 14h.8M9 14h.8M12 14h.8M15 14h.8M18 14h.8M8 16.5h8"/>'},
    'About Q LABEL':{name:'about',markup:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".8" fill="currentColor" stroke="none"/>'},
  };
  function apply(button,label,documentRef=button?.ownerDocument){
    const icon=paths[label];if(!button||!icon||!documentRef)return false;
    const svg=documentRef.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('data-icon',icon.name);svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','24');svg.setAttribute('height','24');svg.setAttribute('fill','none');svg.setAttribute('stroke','#52677c');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;flex:0 0 24px;color:#52677c;overflow:visible';
    svg.innerHTML=icon.markup;
    button.querySelector('svg')?.remove();button.insertBefore(svg,button.firstChild);return true;
  }
  return {apply};
});
