const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'table-cell-zoom-')));
app.on('browser-window-created',(_,win)=>{
  win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    try{
      for(let attempt=0;attempt<150;attempt++){if(await win.webContents.executeJavaScript('!appInitializing'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      const result=await win.webContents.executeJavaScript(`(async()=>{
        window.hideProjectHome();
        const axis=()=>({mode:'Auto',size:5,weight:100,min:1,max:254,align:'Start'});
        editing={name:'Cell zoom check',width_mm:100,height_mm:80,dpi:203,margin_mm:{left:0,top:0},elements:[{type:'image',x_mm:10,y_mm:10,width_mm:50,height_mm:30,table_model:{rows:[axis(),axis()],columns:[axis(),axis()],values:[['Text','B'],['C','D']],fontSize:3,padding:.5,stroke:.175,fill:'#fff',border:'#000',borders:'All',errors:{clip:true}}}],values:{}};
        editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();TableCellSelection.select({r:0,c:0},{});
        [...document.querySelectorAll('#ribbon-table button')].find(button=>button.textContent==='Edit cell').click();
        const input=document.querySelector('.table-cell-editor');if(!input)throw Error('Missing cell editor');
        const wait=()=>new Promise(resolve=>setTimeout(resolve,450));
        const check=()=>{if(!input.isConnected)throw Error('Editor disconnected: '+input.style.cssText);const e=editing.elements[0],svg=liveOverlay(),matrix=svg.getScreenCTM(),point=svg.createSVGPoint();point.x=e.x_mm;point.y=e.y_mm;const screen=point.matrixTransform(matrix),scale=Math.hypot(matrix.a,matrix.b),rect=input.getBoundingClientRect(),width=TableTools.lengths(e.table_model.columns,e.width_mm)[0]*scale,height=TableTools.lengths(e.table_model.rows,e.height_mm)[0]*scale;for(const [label,actual,expected] of [['left',rect.left,screen.x],['top',rect.top,screen.y],['width',rect.width,width],['height',rect.height,height],['font',parseFloat(input.style.fontSize),e.table_model.fontSize*scale]])if(Math.abs(actual-expected)>1)throw Error(label+' differs: '+actual+' vs '+expected);return rect.width;};
        setPreviewZoom(1);await wait();const normal=check();setPreviewZoom(.4);await wait();const small=check();if(small>=normal*.6)throw Error('Editor did not shrink with zoom');setPreviewZoom(1.4);await wait();const large=check();if(large<=normal*1.2)throw Error('Editor did not grow with zoom');
        const oldHeight=editing.elements[0].height_mm;input.value='ข้อความภาษาไทย'.repeat(20);input.dispatchEvent(new Event('input',{bubbles:true}));await wait();check();if(editing.elements[0].height_mm<=oldHeight)throw Error('Typing did not expand the row: '+JSON.stringify({oldHeight,height:editing.elements[0].height_mm,model:editing.elements[0].table_model}));
        input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));if(input.isConnected)throw Error('Escape did not close the editor');if(editing.elements[0].table_model.values[0][0]!=='ข้อความภาษาไทย'.repeat(20))throw Error('Escape lost the text');
        return {zoomOut:true,zoomIn:true,cellPosition:true,fontScale:true,liveRowHeight:true,escapeKeepsText:true};
      })()`);
      console.log(JSON.stringify(result));app.exit(0);
    }catch(error){console.error(error.stack||error);app.exit(1);}
  });
});
require('../gui/main');
