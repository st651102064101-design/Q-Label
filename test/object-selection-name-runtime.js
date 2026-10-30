'use strict';
const {app}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-object-name-')));
const timeout=setTimeout(()=>{console.error('Object name runtime timed out');app.exit(1);},90000);
app.on('browser-window-created',(_event,win)=>{
  const hide=()=>win.hide();win.on('show',hide);win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        window.hideProjectHome();autoSaveEnabled=false;
        const axis=()=>({mode:'Fixed',size:8,min:.1,max:100,weight:100,align:'Start'});
        const bitmap={type:'image',x_mm:10,y_mm:10,width_mm:20,height_mm:15,bitmap_width:8,bitmap_height:8,bitmap_hex:'FF818181818181FF'};
        const items=[
          {type:'text',text:'Text',font_family:'Arial',font_size_pt:28,x_mm:12,y_mm:12},
          ...['barcode128','code39','code93','ean13'].map(type=>({type,text:type==='ean13'?'123456789012':'12345',x_mm:10,y_mm:10,module_width:2,bar_height_mm:10,show_text:true})),
          {type:'qrcode',text:'QR',x_mm:10,y_mm:10,width_mm:15},
          {type:'datamatrix',text:'DM',x_mm:10,y_mm:10,magnification:3},
          ...['box','ellipse','inverse','line'].map(type=>({type,x_mm:10,y_mm:10,width_mm:20,height_mm:15,thickness_mm:.3})),
          bitmap,{...bitmap,source_format:'svg'},
          {...bitmap,table_model:{rows:[axis(),axis()],columns:[axis(),axis()],values:[['A','B'],['C','D']],padding:.5,fontSize:3,stroke:.2,border:'#000',fill:'#fff',borders:'All',errors:{clip:true}}},
          {type:'text',symbol_font:'Arial',font_family:'Arial',text:'★',font_size_pt:16,x_mm:10,y_mm:10},
          {...bitmap,shape_preset:'cube',label:'Cube'}
        ];
        const names=[];
        for(const element of items){
          editing={name:'Object names',width_mm:70,height_mm:45,dpi:203,unit:'mm',margin_mm:{left:0,top:0},values:{},elements:[element]};
          editorSel=-1;editorSelection.clear();drawEditorCanvas();
          const svg=liveOverlay();selectElement(0);
          const name=svg.querySelector('.selection-object-name'),text=name?.querySelector('text'),expected=element.label||elementTypeLabel(element);
          if(!name||text.textContent!==expected)throw Error('Missing name for '+element.type+': '+text?.textContent+' expected '+expected);
          if(liveOverlay()!==svg)throw Error('Single selection rebuilt artwork for '+element.type);
          if(getComputedStyle(name).pointerEvents!=='none')throw Error('Name intercepts mouse events');
          const frame=svg.querySelector('.sel'),labelRect=text.getBoundingClientRect();
          if(frame&&element.type!=='inverse'){
            const rect=frame.getBoundingClientRect();
            if(labelRect.bottom>rect.top+1||rect.top-labelRect.bottom>2||Math.abs(labelRect.left-rect.left-4)>2)throw Error('Name is not close above top-left for '+element.type+': '+JSON.stringify({label:{x:labelRect.x,bottom:labelRect.bottom},frame:{x:rect.x,top:rect.top}}));
          }
          names.push(expected);selectElement(-1);
          if(svg.querySelector('.selection-object-name'))throw Error('Name remains after deselection');
        }
        editing.elements=items.slice(0,3);editorSelection=new Set([0,1,2]);editorSel=0;drawEditorCanvas();
        if(liveOverlay().querySelectorAll('.selection-object-name').length!==3)throw Error('Multi-selection does not name every object');
        const artwork=LabelPreview.renderPreviewSVG(editing,sampleData(editing),[0,1,2],qrCache,{});
        if(artwork.includes('selection-object-name'))throw Error('Selection names leaked into artwork');
        editing.elements=[{...items[0],label:'My Text',rotation_deg:315}];editorSelection=new Set([0]);editorSel=0;drawEditorCanvas();
        if(!liveOverlay().querySelector('.selection-object-name').getAttribute('transform')?.startsWith('rotate(315 '))throw Error('Name does not follow rotation');
        editing.elements[0].rotation_deg=0;delete editing.elements[0].label;drawEditorCanvas();
        return {names,multiSelection:3,rotation:true,artworkClean:true};
      })()`);
      win.removeListener('show',hide);win.showInactive();
      await new Promise(resolve=>setTimeout(resolve,250));
      const shot=await win.webContents.capturePage();
      fs.mkdirSync(path.join(__dirname,'..','test-results'),{recursive:true});
      fs.writeFileSync(path.join(__dirname,'..','test-results','object-selection-name.png'),shot.toPNG());
      console.log('PASS '+JSON.stringify(result));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
