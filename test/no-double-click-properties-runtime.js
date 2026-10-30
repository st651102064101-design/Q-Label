const { app } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

app.setPath('appData', fs.mkdtempSync(path.join(os.tmpdir(), 'no-dblclick-properties-')));
app.on('browser-window-created', (_event, win) => {
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) console.error('RENDERER:', message); });
  win.webContents.once('did-finish-load', async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      const result = await win.webContents.executeJavaScript(`(() => {
        window.hideProjectHome();
        const axis=()=>({mode:'Auto',size:5,weight:100,min:1,max:254});
        editing={name:'Double click properties test',width_mm:80,height_mm:50,dpi:203,margin_mm:{left:0,top:0},elements:[
          {type:'text',text:'Text',x_mm:3,y_mm:3,width_mm:15,height_mm:6,font_size_pt:10},
          {type:'box',x_mm:20,y_mm:3,width_mm:12,height_mm:12,thickness_mm:.3},
          {type:'image',label:'Table',x_mm:3,y_mm:20,width_mm:40,height_mm:20,table_model:{rows:[axis(),axis()],columns:[axis(),axis()],values:[['a','b'],['c','d']],padding:.5,fontSize:3,stroke:.2,border:'#000000',fill:'#ffffff',borders:'All',errors:{clip:true}}}
        ],values:{}};
        editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const frame=document.getElementById('previewFrame');
        const hits=[...frame.querySelectorAll('.hit[data-hit]')];
        if(hits.length<3)throw Error('Expected rendered text, SVG, and table objects');
        for(let i=0;i<3;i++)hits[i].dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true,detail:2,clientX:100+i*5,clientY:100+i*5}));
        if(document.getElementById('objectProperties').open)throw Error('Double-click opened object Properties');
        if(document.getElementById('tableDialog').open)throw Error('Double-click opened Table Properties');
        if(!document.querySelector('.table-cell-editor'))throw Error('Double-click stopped editing the table cell');
        document.querySelector('.table-cell-editor')?.blur();
        window.openObjectProperties(0);
        if(!document.getElementById('objectProperties').open)throw Error('Explicit Properties command no longer opens the dialog');
        document.getElementById('objectProperties').close();
        return {objects:['text','shape','table'],doubleClickOpensProperties:false,tableCellEditing:true,explicitProperties:true};
      })()`);
      console.log(JSON.stringify(result));
      app.exit(0);
    } catch (error) {
      console.error(error.stack || error);
      app.exit(1);
    }
  });
});
require('../gui/main');
