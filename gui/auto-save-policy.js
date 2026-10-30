(function(root){
  'use strict';
  function create({save,saveSettings=async()=>{},setTimeoutFn=setTimeout,clearTimeoutFn=clearTimeout,delay=400}={}){
    let enabled=false,timer=null;
    const cancel=()=>{if(timer!==null)clearTimeoutFn(timer);timer=null;};
    const schedule=wait=>{cancel();if(enabled)timer=setTimeoutFn(()=>{timer=null;void save?.();},wait);};
    const controller={
      get enabled(){return enabled;},
      configure(value){enabled=value===true;cancel();return enabled;},
      markDirty(){schedule(delay);},
      scheduleNow(){schedule(0);},
      cancel,
      async setEnabled(value,{dirty=false}={}){const previous=enabled;enabled=!!value;cancel();try{await saveSettings({autoSaveEnabled:enabled});}catch(error){enabled=previous;if(previous&&dirty)schedule(0);throw error;}if(enabled&&dirty)schedule(0);return enabled;},
      bindCheckbox(input,isDirty=()=>false,onError=()=>{},onChange=(value,options)=>controller.setEnabled(value,options)){if(!input)return;input.checked=enabled;input.addEventListener('change',()=>{void onChange(input.checked,{dirty:isDirty()}).catch(error=>{input.checked=enabled;onError(error);});});}
    };
    return controller;
  }
  const api={create};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.AutoSavePolicy=api;
})(typeof window!=='undefined'?window:globalThis);
