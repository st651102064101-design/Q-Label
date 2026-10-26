(function(root){
  'use strict';
  // Insert-tab dropdown buttons (Text, Picture, Barcode, Table) open the moment the mouse reaches them.
  // Symbols and Shapes open modal dialogs, so they are deliberately not hover-driven.
  const CLOSE_DELAY_MS=250;
  const byId=id=>document.getElementById(id);
  const registry=[
    {name:'text',button:()=>byId('insertTextTool'),menu:()=>document.querySelector('.line-menu.tool-menu'),
      isOpen(){return this.button()?.getAttribute('aria-expanded')==='true';},open(){root.ToolMenus?.toggle('text');},close(){root.LineMenus?.close();}},
    {name:'picture',button:()=>byId('insertPictureTool'),menu:()=>document.querySelector('.line-menu.tool-menu'),
      isOpen(){return this.button()?.getAttribute('aria-expanded')==='true';},open(){root.ToolMenus?.toggle('image');},close(){root.LineMenus?.close();}},
    {name:'barcode',button:()=>byId('insertBarcodeTool'),menu:()=>document.querySelector('.barcode-menu'),
      isOpen(){const m=this.menu();return !!m&&!m.hidden;},open(){root.openBarcodeMenu?.();},close(){const m=this.menu();if(m)m.hidden=true;}},
    {name:'table',button:()=>document.querySelector('#ribbon-insert .table-insert-command'),menu:()=>document.querySelector('.table-menu'),
      isOpen(){const m=this.menu();return !!m&&!m.hidden;},open(){this.button()?.click();},close(){const m=this.menu();if(m)m.hidden=true;}}
  ];
  let timer=null;
  const hitFor=target=>registry.find(entry=>{const button=entry.button(),menu=entry.menu();return !!target&&((button&&button.contains(target))||(menu&&!menu.hidden&&menu.contains(target)));});
  const closeAll=()=>{for(const entry of registry)if(entry.isOpen())entry.close();};

  function onPointerOver(event){
    if(event.pointerType==='touch')return;
    const hit=hitFor(event.target);
    if(hit){
      clearTimeout(timer);timer=null;
      if(!hit.isOpen()){for(const entry of registry)if(entry!==hit&&entry.isOpen())entry.close();hit.open();}
      return;
    }
    if(!registry.some(entry=>entry.isOpen()))return;
    clearTimeout(timer);
    timer=setTimeout(()=>{timer=null;closeAll();},CLOSE_DELAY_MS);
  }
  // A click on a button that hover already opened must not toggle it shut.
  function onClickCapture(event){
    const entry=registry.find(item=>{const button=item.button();return button&&button.contains(event.target);});
    if(entry&&entry.isOpen()&&event.detail>0){event.stopImmediatePropagation();event.preventDefault();}
  }
  if(typeof document!=='undefined'){
    document.addEventListener('pointerover',onPointerOver,true);
    document.addEventListener('click',onClickCapture,true);
  }
  root.RibbonHoverMenus={registry,CLOSE_DELAY_MS};
})(typeof window!=='undefined'?window:globalThis);
