(function(root){
  'use strict';
  // Close competing menus on click without intercepting activation.
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
      isOpen(){const m=this.menu();return !!m&&!m.hidden;},open(){this.button()?.click();},close(){const m=this.menu();if(m)m.hidden=true;}},
    {name:'symbols',clickOnly:true,button:()=>document.querySelector('.tis-ribbon-group [aria-label="Insert Symbols"]'),menu:()=>document.querySelector('.symbols-menu'),
      isOpen(){const m=this.menu();return !!m&&!m.hidden;},open(){root.TisSymbolMenu?.open?.();},close(){root.TisSymbolMenu?.close?.();}}
  ];
  function onClickCapture(event){
    const entry=registry.find(item=>{const button=item.button();return button&&button.contains(event.target);});
    if(!entry)return;
    for(const other of registry)if(other!==entry&&other.isOpen())other.close();
  }
  function onPointerOver(event){
    if(event.pointerType==='touch')return;
    const button=event.target?.closest?.('.ribbon-command, .ribbon-tab');
    if(!button)return;
    for(const entry of registry)if(entry.isOpen()&&!entry.button()?.contains(button)&&!entry.menu()?.contains(button))entry.close();
  }
  if(typeof document!=='undefined'){document.addEventListener('click',onClickCapture,true);document.addEventListener('pointerover',onPointerOver,true);}
  root.RibbonHoverMenus={registry,CLOSE_DELAY_MS};
})(typeof window!=='undefined'?window:globalThis);
