(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ObjectNames=api;
})(typeof window==='undefined'?null:window,function(){
  'use strict';

  const PREFIX='object ';

  function normalize(name){
    return String(name??'').trim().replace(/\s+/g,' ');
  }
  function key(name){
    return normalize(name).toLowerCase();
  }
  function sequential(name){
    return /^object\s+\d+$/i.test(normalize(name));
  }
  function usedKeys(elements,except){
    const seen=new Set();
    (elements||[]).forEach((element,index)=>{
      if(except!=null&&(element===except||index===except))return;
      const value=key(element?.label);
      if(value)seen.add(value);
    });
    return seen;
  }
  function nextName(elements){
    const used=usedKeys(elements);
    let n=1;
    while(used.has(PREFIX+n))n+=1;
    return PREFIX+n;
  }
  function assign(element,occupied){
    if(!element||typeof element!=='object')return '';
    element.label=nextName(occupied);
    return element.label;
  }
  function assignMany(items,occupied){
    const taken=[...(occupied||[])];
    for(const item of items||[]){
      assign(item,taken);
      taken.push(item);
    }
    return items;
  }
  function compactSequential(elements){
    let n=1;
    for(const element of elements||[]){
      if(!element||typeof element!=='object')continue;
      if(sequential(element.label)){
        element.label=PREFIX+n;
        n+=1;
      }
    }
    return elements;
  }
  function conflictMessage(name){
    return `The name '${normalize(name)}' is already in use or reserved.`;
  }
  function firstConflict(elements){
    const seen=new Map();
    for(const element of elements||[]){
      const value=normalize(element?.label);
      if(!value)return {code:'reserved',name:element?.label??'',message:conflictMessage('')};
      const id=key(value);
      if(seen.has(id))return {code:'duplicate',name:value,message:conflictMessage(value)};
      seen.set(id,element);
    }
    return null;
  }
  function validateName(name,elements,except){
    const value=normalize(name);
    if(!value)return {ok:false,code:'reserved',name:name??'',message:conflictMessage('')};
    if(usedKeys(elements,except).has(key(value)))return {ok:false,code:'duplicate',name:value,message:conflictMessage(value)};
    return {ok:true,name:value};
  }
  function showAlert(documentRef,name){
    const d=documentRef||(typeof document==='undefined'?null:document);
    if(!d)return null;
    d.querySelector('.modern-name-alert')?.remove();
    const dialog=d.createElement('dialog');
    dialog.className='modern-name-alert';
    dialog.setAttribute('role','alertdialog');
    dialog.setAttribute('aria-labelledby','modern-name-alert-title');
    dialog.setAttribute('aria-describedby','modern-name-alert-message');
    dialog.style.cssText='width:min(420px,calc(100vw - 36px));padding:0;border:1px solid #e4e7ec;border-radius:16px;background:#fff;color:#1f2937;font:14px Segoe UI,sans-serif;box-shadow:0 24px 60px rgba(15,23,42,.22)';
    dialog.innerHTML='<div style="display:flex;gap:16px;padding:24px 24px 8px"><span aria-hidden="true" style="display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border-radius:50%;background:#fef3f2;color:#d92d20"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg></span><div style="min-width:0"><h2 id="modern-name-alert-title" style="margin:0 0 8px;font-size:18px;font-weight:650">Object name</h2><p id="modern-name-alert-message" style="margin:0;line-height:1.5;color:#475467;overflow-wrap:anywhere"></p></div></div><footer style="display:flex;justify-content:flex-end;padding:16px 20px 20px"><button type="button" data-alert-ok style="min-width:88px;padding:8px 16px;border:1px solid #16a34a;border-radius:8px;background:#16a34a;color:#fff;font:600 14px Segoe UI,sans-serif;cursor:pointer">OK</button></footer>';
    dialog.querySelector('#modern-name-alert-message').textContent=conflictMessage(name);
    const finish=()=>{try{if(dialog.open&&typeof dialog.close==='function')dialog.close();}catch(_){} dialog.remove();};
    dialog.querySelector('[data-alert-ok]').onclick=finish;
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
    d.body.append(dialog);
    if(typeof dialog.showModal==='function')dialog.showModal();
    else dialog.setAttribute('open','');
    dialog.querySelector('[data-alert-ok]').focus();
    return dialog;
  }

  return {PREFIX,normalize,nextName,assign,assignMany,compactSequential,firstConflict,validateName,conflictMessage,showAlert};
});
