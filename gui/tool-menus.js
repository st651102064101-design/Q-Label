(function(){
  'use strict';
  // BarTender-style Text and Picture dropdowns. Entries Q LABEL cannot perform yet are shown disabled, never faked.
  const NOT_YET='Not available in Q LABEL yet';
  const item=(text,value,extra={})=>({text,value,...extra});
  const todo=(text,value,extra={})=>item(text,value,{disabled:true,title:NOT_YET,...extra});

  const TRANSFORM_TILES=['Arch up','Arch down','Circle','Button','Wave 1','Wave 2','Slant up','Slant down','Fade right','Fade left','Fade up','Fade down','Inflate','Deflate','Curve up','Curve down'];

  function textSections(){
    return [
      {heading:'Basic Text Objects'},
      item('Normal','normal'),
      item('Normal Wrapped','wrapped'),
      todo('Word Processor','word-processor'),
      item('Symbol Font Character','symbol'),
      {heading:'Transformed Text Objects'},
      ...TRANSFORM_TILES.map(name=>todo('AaBbCc','transform:'+name,{grid:true,title:name+' — '+NOT_YET})),
      {heading:'Markup Language Containers'},
      todo('RTF','rtf'),todo('HTML','html'),todo('XAML','xaml')
    ];
  }
  function pictureSections(){
    return [
      {heading:'Embedded Pictures'},
      item('Insert from File…','file'),
      todo('Insert from Scanner or Camera…','scanner'),
      {heading:'External Picture File'},
      todo('Specify File Name…','external-file'),
      todo('Get File Name from Database Field…','external-field'),
      todo('Get File Name from Data Source','external-source'),
      {heading:'Other Picture Sources'},
      todo('Print-time Image Capture Control','capture'),
      todo('Binary Database Field','binary-field'),
      todo('Encoded Picture Data','encoded')
    ];
  }

  function insertText(wrapped){
    const added=window.insertEditorElement('text');
    if(!added||!wrapped)return added;
    added.text_wrap=true;
    added.text_box_width_mm=Math.max(10,Number(added.text_box_width_mm)||30);
    renderEditorElements();drawEditorCanvas();touchEditor();
    return added;
  }
  const actions={
    normal:()=>insertText(false),
    wrapped:()=>insertText(true),
    symbol:()=>document.querySelector('[aria-label="Insert Symbols"]')?.click(),
    file:()=>window.useObjectTool('image')
  };

  function attach(id,sections){
    const button=document.getElementById(id);
    if(!button||!window.LineMenus)return null;
    button.classList.add('ribbon-has-dropdown');
    button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');
    if(!button.querySelector('.ribbon-dropdown-arrow'))button.insertAdjacentHTML('beforeend','<span class="ribbon-dropdown-arrow" aria-hidden="true">▾</span>');
    return button;
  }
  const menus={text:{id:'insertTextTool',sections:textSections},image:{id:'insertPictureTool',sections:pictureSections}};
  function toggle(type){
    const menu=menus[type],button=menu&&document.getElementById(menu.id);
    if(!button||!window.LineMenus)return window.useObjectTool(type);
    if(button.getAttribute('aria-expanded')==='true'){window.LineMenus.close();return;}
    window.LineMenus.show(button,menu.sections(),{className:'tool-menu',width:210,onPick:value=>actions[value]?.()});
  }
  const api={textSections,pictureSections,TRANSFORM_TILES,attach,actions,toggle};
  if(typeof window!=='undefined'){window.ToolMenus=api;attach('insertTextTool',textSections);attach('insertPictureTool',pictureSections);}
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
