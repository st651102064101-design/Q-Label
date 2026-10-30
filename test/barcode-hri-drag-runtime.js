const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-hri-drag-')));
setTimeout(()=>{console.error('HRI runtime timed out');app.exit(1);},45000);
app.on('browser-window-created',(_,win)=>{
  win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    try{
      win.hide();
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(r=>setTimeout(r,25));
        hideProjectHome();autoSaveEnabled=false;editorGrid.snap=false;
        window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16);
        window.cancelAnimationFrame=clearTimeout;
        let checks=0;const check=(v,m)=>{checks++;if(!v)throw Error(m);};
        const templates=[];
        for(const type of ['barcode128','code39','code93','ean13']){
          editing={name:'HRI fixture',width_mm:120,height_mm:80,dpi:203,margin_mm:{left:0,top:0},elements:[{type,text:type==='ean13'?'123456789012':'12345678',x_mm:10,y_mm:10,module_width:2,bar_height_mm:12,hri_height_mm:3,hri_align:'center',hri_offset_mm:0}],values:{}};
          editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
          const initial=JSON.stringify(editing.elements[0]);
          for(const [dx,dy,align] of [[-1,2,'left'],[1,1,'right'],[-.5,0,'center'],[0,1,'center']]){
            const overlay=liveOverlay(),hit=overlay.querySelector('.hri-handle-hit');
            check(!!hit,'HRI handle absent '+type);
            check(getComputedStyle(hit).cursor==='move','HRI cursor is not move');
            const svg=hit.ownerSVGElement,matrix=svg.getScreenCTM();
            const start=new DOMPoint(+hit.getAttribute('cx'),+hit.getAttribute('cy')).matrixTransform(matrix);
            const oldOffset=editing.elements[0].hri_offset_mm;
            const barWidth=LabelPreview.computeBoxes(editing,{})[0].w;
            const target=new DOMPoint(+hit.getAttribute('cx')+dx*barWidth,+hit.getAttribute('cy')+dy).matrixTransform(matrix);
            startDrag(new PointerEvent('pointerdown',{clientX:start.x,clientY:start.y,button:0,pointerId:1}),0,'hri','hri');
            const event=name=>new PointerEvent(name,{clientX:target.x,clientY:target.y,button:0,pointerId:1});
            window.dispatchEvent(event('pointermove'));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
            const elem=editing.elements[0];
            check(elem.hri_align===align,'Wrong live alignment '+type+' '+elem.hri_align+' expected '+align);
            check(Math.abs(elem.hri_offset_mm-oldOffset-dy)<.02,'Vertical offset changed incorrectly');
            check(getComputedStyle(liveOverlay().querySelector('.hri-handle-dot')).visibility==='visible','Yellow dot hidden while dragging');
            const text=liveOverlay().querySelector('text[text-anchor="'+({left:'start',center:'middle',right:'end'}[align])+'"]');
            check(!!text,'Live preview HRI anchor incorrect '+align);
            const liveInk=text.getBBox(),liveDot=liveOverlay().querySelector('.hri-handle-dot'),liveSel=liveOverlay().querySelector('[data-editor-overlay="0"] rect.sel');
            check(Math.abs(+liveDot.getAttribute('cx')-(+liveSel.getAttribute('x')+(+liveSel.getAttribute('width'))*({left:0,center:.5,right:1}[align])))<.25,'Live handle not at aligned barcode edge for '+align);
            check(Math.abs(+liveDot.getAttribute('cy')-(+liveSel.getAttribute('y')+12+0.6+elem.hri_offset_mm))<.25,'Live handle not on authored bar/HRI boundary for '+align);
            check(Math.abs((+liveSel.getAttribute('y')+(+liveSel.getAttribute('height')))-(liveInk.y+liveInk.height))<1,'Green frame gap under HRI while dragging '+align);
            window.dispatchEvent(event('pointerup'));await new Promise(r=>setTimeout(r,30));
            check(editing.elements[0].hri_align===align,'Commit lost alignment');
            const dot=liveOverlay().querySelector('.hri-handle-dot'),glyph=liveOverlay().querySelector('[data-barcode-hri="true"] text'),ink=glyph.getBBox(),selForHandle=liveOverlay().querySelector('[data-editor-overlay="0"] rect.sel');
            check(Math.abs(+dot.getAttribute('cx')-(+selForHandle.getAttribute('x')+(+selForHandle.getAttribute('width'))*({left:0,center:.5,right:1}[align])))<.25,'Handle not at aligned barcode edge for '+align);
            check(Math.abs(+dot.getAttribute('cy')-(+selForHandle.getAttribute('y')+12+0.6+elem.hri_offset_mm))<.25,'Handle not on authored bar/HRI boundary for '+align);
            const sel=liveOverlay().querySelector('[data-editor-overlay="0"] rect.sel');
            check(Math.abs((+sel.getAttribute('y')+(+sel.getAttribute('height')))-(ink.y+ink.height))<1,'Green frame gap under HRI after '+align+' drag');
            check(elem.x_mm===10&&elem.y_mm===10&&elem.module_width===2&&elem.bar_height_mm===12,'Dragging HRI changed bars');
            templates.push(structuredClone(editing));
          }
          const after=JSON.stringify(editing.elements[0]);undo();redo();
          check(JSON.stringify(editing.elements[0])===after,'Undo/redo lost HRI state');
          check(after!==initial,'Fixture did not change');
        }
        return {checks,templates};
      })()`);
      const {renderLabelBody}=require('../lib/zpl');
      for(const template of result.templates){
        const letter={left:'L',center:'C',right:'R'}[template.elements[0].hri_align];
        assert.match(renderLabelBody(template,{}),new RegExp('\\^FB[^\\r\\n]*,0,'+letter+',0'));
      }
      console.log(JSON.stringify({checks:result.checks,printAlignmentChecks:result.templates.length,passed:true}));
      app.exit(0);
    }catch(error){console.error(error);app.exit(1);}
  });
});
require('../gui/main');
