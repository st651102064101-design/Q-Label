(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.StartupErrorUI=api;
})(typeof window==='undefined'?null:window,function(){
  'use strict';

  function show(error,documentRef=document){
    documentRef.querySelector('.workspace-startup-error')?.remove();
    const overlay=documentRef.createElement('section');
    overlay.className='workspace-startup-error';
    overlay.setAttribute('role','alert');
    overlay.setAttribute('aria-labelledby','workspace-startup-error-title');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;box-sizing:border-box;padding:24px;background:rgba(15,23,42,.28);font:14px Segoe UI,sans-serif;color:#202124';

    const card=documentRef.createElement('div');
    card.style.cssText='width:min(560px,100%);max-height:calc(100vh - 48px);box-sizing:border-box;overflow:auto;padding:24px;background:#fff;border:1px solid #d6dbe2;border-radius:10px;box-shadow:0 16px 48px rgba(15,23,42,.22)';
    const heading=documentRef.createElement('h2');
    heading.id='workspace-startup-error-title';
    heading.textContent='The workspace could not finish loading.';
    heading.style.cssText='margin:0 0 12px;font-size:18px';
    const detail=documentRef.createElement('p');
    detail.className='workspace-startup-error-detail';
    detail.textContent=error?.message||String(error);
    detail.style.cssText='margin:0 0 20px;max-height:40vh;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;color:#475467';
    const retry=documentRef.createElement('button');
    retry.type='button';
    retry.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="display:block;flex:0 0 16px;color:#fff"><path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9"/></svg><span>Reload application</span>';
    retry.style.cssText='display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:8px 14px;border:1px solid #16a34a;border-radius:6px;background:#16a34a;color:#fff;font:600 14px Segoe UI,sans-serif;cursor:pointer';
    retry.addEventListener('click',()=>documentRef.defaultView?.location.reload());
    card.append(heading,detail,retry);
    overlay.append(card);
    documentRef.body.append(overlay);
    retry.focus();
    return overlay;
  }

  return {show};
});
