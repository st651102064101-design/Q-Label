const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'table-corner-controls-')));
app.on('browser-window-created',(_,window)=>{window.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error('RENDERER:',message);});window.webContents.once('did-finish-load',async()=>{
  try{
    await new Promise(resolve=>setTimeout(resolve,2200));
    const result=await window.webContents.executeJavaScript(`(()=>{
      window.hideProjectHome();
      const table={type:'image',label:'Corner controls',x_mm:10,y_mm:10,width_mm:50,height_mm:30,table_model:{rows:Array.from({length:2},()=>({mode:'Auto',size:5,weight:100,min:.1,max:254})),columns:Array.from({length:2},()=>({mode:'Auto',size:5,weight:100,min:.1,max:254})),values:[['A','B'],['C','D']],padding:.5,fontSize:3,stroke:.175,border:'#000000',fill:'#ffffff',borders:'All',errors:{clip:true}}};
      TableTools.bake(table);editing={name:'Isolated table controls',width_mm:100,height_mm:80,dpi:203,margin_mm:{left:0,top:0},elements:[table],values:{}};editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
      const controls=()=>liveOverlay().querySelectorAll('.table-corner-add'),dots=()=>liveOverlay().querySelectorAll('.handle-dot');
      const plusSizes=[];
      for(const zoom of [.5,1,2,4]){
        previewZoom=zoom;drawEditorCanvas();
        const group=liveOverlay().querySelector('[data-editor-overlay="0"]');group.classList.add('is-source-hover');
        const icon=group.querySelector('.table-corner-add-icon circle').getBoundingClientRect(),hit=group.querySelector('.table-corner-add-hit').getBoundingClientRect();
        if(Math.abs(icon.width-24)>.2||Math.abs(icon.height-24)>.2||Math.abs(hit.width-32)>.2)throw Error('Oversized corner + at zoom '+zoom+': '+JSON.stringify({icon:icon.width,hit:hit.width}));
        plusSizes.push({zoom,iconWidth:icon.width,hitWidth:hit.width});
      }
      previewZoom=1;drawEditorCanvas();
      const overlay=liveOverlay().querySelector('[data-editor-overlay="0"]'),strokeTool=overlay?.querySelector('.stroke-width-control'),edgeGuide=overlay?.querySelector('.stroke-width-edge-guide');
      if(!strokeTool||!edgeGuide)throw Error('Table border thickness control or edge guide was not rendered');
      if(overlay.classList.contains('is-stroke-width-hover'))throw Error('The green border guide should be hidden before hover');
      strokeTool.dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));
      if(!overlay.classList.contains('is-stroke-width-hover'))throw Error('Hovering the border thickness control did not show the edge guide');
      strokeTool.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,relatedTarget:liveOverlay()}));
      if(overlay.classList.contains('is-stroke-width-hover'))throw Error('Leaving the border thickness control did not hide the edge guide');
      if(overlay.querySelector('.stroke-width-guide'))throw Error('A diagonal connector still joins the border and SVG control');
      if(liveOverlay().querySelector('.handle-dot[data-anchor="ne"]')||liveOverlay().querySelector('.handle-dot[data-anchor="sw"]'))throw Error('The upper-right and lower-left round handles are still visible');
      if(dots().length!==2)throw Error('The remaining corner resize handles should stay visible');
      let buttons=[...controls()];if(buttons.length!==2)throw Error('Two table add controls were not rendered');
      const icon=buttons[0].querySelector('.table-corner-add-icon');if(getComputedStyle(icon).opacity!=='0')throw Error('Plus icon should be hidden until hover');
      const addCalls=[],originalAddAxis=TableTools.addAxisFromCanvas;TableTools.addAxisFromCanvas=(...args)=>{addCalls.push(args);return originalAddAxis(...args);};
      const beforeColumn=table.table_model.columns.length;buttons.find(control=>control.dataset.tableAxis==='columns').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
      let current=editing.elements[0];if(current.table_model.columns.length!==beforeColumn+1||current.table_model.values.some(row=>row.length!==beforeColumn+1||row.at(-1)!==''))throw Error('Clicking upper-right did not immediately add an empty column');
      buttons=[...controls()];const beforeRow=current.table_model.rows.length;buttons.find(control=>control.dataset.tableAxis==='rows').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
      current=editing.elements[0];if(current.table_model.rows.length!==beforeRow+1||current.table_model.values.at(-1).length!==current.table_model.columns.length||current.table_model.values.at(-1).some(value=>value!==''))throw Error('Clicking lower-left did not immediately add an empty row');
      return {plusSizes,strokeWidthHoverShowsEdgeGuide:true,strokeWidthGuideHidesAfterHover:true,noDiagonalStrokeConnector:true,hiddenResizeHandles:true,remainingCornerHandles:dots().length,iconHiddenBeforeHover:true,addedColumn:current.table_model.columns.length===beforeColumn+1,addedRow:current.table_model.rows.length===beforeRow+1,axisActions:addCalls};
    })()`);
    console.log(JSON.stringify(result,null,2));fs.writeFileSync(path.join(__dirname,'table-corner-controls-runtime-result.json'),JSON.stringify(result,null,2));app.exit(0);
  }catch(error){console.error(error);app.exit(1);}
});});
require('../gui/main');
