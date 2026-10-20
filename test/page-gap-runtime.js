'use strict';
const {app}=require('electron');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const appData=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-page-gap-'));
app.setPath('appData',appData);
const timeout=setTimeout(()=>{console.error('Page gap runtime timed out');app.exit(1);},30000);
app.on('browser-window-created',(_event,win)=>{
  const hide=()=>win.hide();win.on('show',hide);
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        hideProjectHome();autoSaveEnabled=false;
        editing={name:'Page gap runtime fixture',width_mm:36,height_mm:27,dpi:203,elements:[{type:'box',label:'Gap test',x_mm:2,y_mm:3,width_mm:10,height_mm:8,fill_color:'#000000',stroke_color:'#000000'}],values:{},page:{enabled:true,width_mm:80,height_mm:60,rows:2,columns:2,left_mm:2,right_mm:2,top_mm:3,bottom_mm:3,gap_x_mm:4,gap_y_mm:5}};
        editorSel=0;editorSelection=new Set([0]);refreshEditorUI();drawEditorCanvas();
        const panel=document.getElementById('ribbon-view'),button=[...panel.querySelectorAll('.ribbon-command')].find(item=>item.title==='Show gap');
        const canvas=()=>document.querySelector('#previewFrame .canvaswrap > svg');
        if(!button||button.disabled||button.getAttribute('aria-pressed')!=='false')throw Error('Show gap does not start enabled and hidden when gaps are configured: '+JSON.stringify({found:!!button,disabled:button?.disabled,pressed:button?.getAttribute('aria-pressed'),page:editing.page,hasGap:PageGap.hasGap(editing.page)}));
        if(canvas().querySelectorAll('[data-label-gap]').length)throw Error('Gap bands are visible before the user enables them');
        const before=JSON.stringify(editing),beforeSize={width:editing.width_mm,height:editing.height_mm},beforeBox=canvas().querySelector('.sel')?.getAttribute('x');
        button.click();
        const shown=canvas(),viewBox=shown.getAttribute('viewBox');
        if(button.getAttribute('aria-pressed')!=='true'||button.title!=='Hide gap')throw Error('Show gap did not update the button state');
        if(shown.querySelectorAll('[data-label-gap]').length!==2||viewBox!=='-2 -3 80 60')throw Error('The editor did not render both configured physical gaps in the sheet preview: '+viewBox);
        if(!shown.querySelector('[data-editor-overlay="0"] .sel')||shown.querySelector('[data-editor-overlay="0"] .sel').getAttribute('x')!==beforeBox)throw Error('Showing gaps changed or removed the label object selection bounds: '+JSON.stringify({beforeBox,afterBox:shown.querySelector('[data-editor-overlay="0"] .sel')?.getAttribute('x'),overlay:!!shown.querySelector('[data-editor-overlay="0"]')}));
        if(JSON.stringify(editing)!==before)throw Error('Showing gaps changed template or print data');
        button.click();
        if(button.getAttribute('aria-pressed')!=='false'||canvas().getAttribute('viewBox')!=='0 0 '+beforeSize.width+' '+beforeSize.height||canvas().querySelectorAll('[data-label-gap]').length)throw Error('Hide gap did not restore the regular single-label editor view: '+JSON.stringify({pressed:button.getAttribute('aria-pressed'),viewBox:canvas().getAttribute('viewBox'),gaps:canvas().querySelectorAll('[data-label-gap]').length}));
        document.getElementById('pageSetupOpen').click();await new Promise(resolve=>setTimeout(resolve,100));document.getElementById('tabLayout').click();await new Promise(resolve=>setTimeout(resolve,100));
        const setupPreview=document.querySelector('#pageSetupDialog .modal-paper-preview');
        if(!setupPreview?.querySelector('[data-layout-gap-dimension="horizontal"] line[marker-start][marker-end]')||!setupPreview?.querySelector('[data-layout-gap-dimension="vertical"] line[marker-start][marker-end]'))throw Error('Page Setup gap measurement arrows changed when editor gap visibility was toggled: '+JSON.stringify({dialog:document.getElementById('pageSetupDialog').open,preview:!!setupPreview,layout:setupPreview?.innerHTML.slice(0,1000),page:editing.page}));
        document.getElementById('setupCancel').click();
        return {initiallyHidden:true,physicalGapBands:2,selectionBoundsPreserved:true,templateDataUnchanged:true,hideRestoresSingleLabel:true,pageSetupArrowsUnaffected:true};
      })()`);
      win.removeListener('show',hide);win.showInactive();await new Promise(resolve=>setTimeout(resolve,100));
      console.log('PASS '+JSON.stringify({...result,appData}));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
