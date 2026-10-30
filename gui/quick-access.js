(function(root){
  'use strict';
  function syncHistoryButtons(container,canUndo,canRedo){
    if(!container)return;
    for(const [label,available] of [['Undo (Ctrl+Z)',canUndo],['Redo (Ctrl+Y)',canRedo]]){
      const button=container.querySelector(`[aria-label="${label}"]`);
      if(button){button.disabled=!available;button.setAttribute('aria-disabled',String(!available));}
    }
  }
  function bindButtonAction(button,action){
    button.addEventListener('click',event=>{
      action(event);
      if(event.detail>0)button.blur();
    });
  }
  const api={syncHistoryButtons,bindButtonAction};
  if(typeof module!=='undefined')module.exports=api;
  root.RibbonQuickAccess=api;
})(typeof window!=='undefined'?window:globalThis);
