'use strict';

/** New labels start with custom dimensions and no selected stock. */
function setInitialStockMode(root){
  const custom=root?.getElementById?.('nwStockCustom'),predefined=root?.getElementById?.('nwStockPredefined');
  const customPanel=root?.getElementById?.('nwCustomStock'),predefinedPanel=root?.getElementById?.('nwPredefinedStock');
  if(!custom||!predefined||!customPanel||!predefinedPanel)return false;
  custom.checked=true;predefined.checked=false;
  customPanel.hidden=false;predefinedPanel.hidden=false;
  const category=root.getElementById('nwStockCategory'),list=root.getElementById('nwStockList');
  if(category)category.disabled=true;
  if(list)list.disabled=true;
  return true;
}

const setDefaultCustom=setInitialStockMode;

if(typeof module!=='undefined'&&module.exports)module.exports={setInitialStockMode,setDefaultCustom};
if(typeof window!=='undefined')window.NewLabelStockMode={setInitialStockMode,setDefaultCustom};
