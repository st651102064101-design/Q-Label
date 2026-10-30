(function(root){
  'use strict';
  const APP_NAME='Q Label';
  function normalizeDisplayVersion(version){
    const raw=String(version??'').trim().replace(/^v/i,'');
    if(!raw)return '';
    return /^\d+(?:\.\d{1,2})?$/.test(raw)?Number(raw).toFixed(3):raw;
  }
  function windowTitle(version){
    const value=normalizeDisplayVersion(version);
    return value?`${APP_NAME} (${value})`:APP_NAME;
  }
  function apply(version,win=root,doc=win.document){
    const value=normalizeDisplayVersion(version);
    if(!value)return false;
    const label='v'+value;
    win.appDisplayVersion=label;
    const ribbon=doc.getElementById('ribbonVersion');if(ribbon)ribbon.textContent=label;
    const app=doc.getElementById('appVersion');if(app)app.textContent=windowTitle(version);
    const sidebar=doc.getElementById('sidebarVersion');if(sidebar)sidebar.textContent=label;
    doc.title=windowTitle(version);
    return true;
  }
  const api={apply,normalizeDisplayVersion,windowTitle,APP_NAME};
  if(typeof module!=='undefined')module.exports=api;
  root.VersionDisplay=api;
})(typeof window!=='undefined'?window:globalThis);
