'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-tree-runtime-')));
const timeout=setTimeout(()=>{console.error('Properties tree runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        hideProjectHome();autoSaveEnabled=false;
        editing={name:'Tree fixture',width_mm:60,height_mm:40,dpi:203,values:{},elements:[{type:'text',label:'Text 1',text:'A',x_mm:5,y_mm:5,width_mm:10,height_mm:4},{type:'text',label:'Text 2',text:'B',x_mm:20,y_mm:5,width_mm:10,height_mm:4}]};
        editorSel=0;editorSelection=new Set([0]);refreshEditorUI();drawEditorCanvas();
        if(editing.elements.map(item=>item.label).join('|')!=='Text 1|Text 2')throw Error('Objects did not receive their typed sequential names');
        const caption=document.querySelector('.selection-object-name text')?.textContent;
        openObjectProperties(0);const d=document.getElementById('objectProperties');
        if(d.querySelector('[data-object-root="0"] span').textContent!==caption)throw Error('Canvas and tree names differ');
        const geometry=()=>{const source=d.querySelector('.ose-list button')||d.querySelector('.op-source-summary button'),tool=d.querySelector('[data-object-index="0"][data-property-page="Data Sources"]'),r=source.getBoundingClientRect(),t=tool.getBoundingClientRect();return {x:r.x,y:r.y-t.bottom,w:r.width,h:r.height,branch:getComputedStyle(source,'::before').borderTopStyle,stem:getComputedStyle(source,'::after').borderLeftStyle};};
        const connector=()=>{const parent=d.querySelector('[data-object-index="0"][data-property-page="Data Sources"]'),source=d.querySelector('.ose-list button')||d.querySelector('.op-source-summary button'),p=parent.getBoundingClientRect(),s=source.getBoundingClientRect(),pi=parent.querySelector('svg').getBoundingClientRect(),si=source.querySelector('svg').getBoundingClientRect(),trunk=getComputedStyle(parent,'::after'),branch=getComputedStyle(source,'::before'),stem=getComputedStyle(source,'::after');const stemX=s.left+parseFloat(getComputedStyle(source).borderLeftWidth)+parseFloat(stem.left);return {last:parent.dataset.treeLast,outerBorder:getComputedStyle(parent).borderLeftColor,outerHeight:parseFloat(trunk.height),rowHeight:p.height,parentCenter:pi.left+pi.width/2,stemX,stemTop:s.top+parseFloat(getComputedStyle(source).borderTopWidth)+parseFloat(stem.top),parentIconBottom:pi.bottom,branchEnd:s.left+parseFloat(getComputedStyle(source).borderLeftWidth)+parseFloat(branch.left)+parseFloat(branch.width),sourceIconLeft:si.left};};
        const assertConnector=()=>{const c=connector();if(c.last!=='true'||c.outerBorder!=='rgba(0, 0, 0, 0)'||Math.abs(c.outerHeight-c.rowHeight/2)>1||Math.abs(c.stemX-c.parentCenter)>1||Math.abs(c.stemTop-c.parentIconBottom)>1||Math.abs(c.branchEnd-c.sourceIconLeft)>1)throw Error('Tree connector geometry incorrect: '+JSON.stringify(c));return c;};
        const assertRootConnector=()=>{for(const root of d.querySelectorAll('[data-object-root]')){const first=root.nextElementSibling;if(!first?.matches('[data-property-page]'))continue;const r=root.getBoundingClientRect(),i=root.querySelector('svg').getBoundingClientRect(),f=first.getBoundingClientRect(),line=getComputedStyle(root,'::after'),x=r.left+parseFloat(line.left),top=r.top+parseFloat(line.top),bottom=top+parseFloat(line.height);if(line.borderLeftStyle!=='dotted'||x<i.left||x>i.right||Math.abs(top-i.bottom)>1||Math.abs(bottom-f.top)>1||Math.abs(x-f.left)>1)throw Error('Root icon is disconnected: '+JSON.stringify({x,top,bottom,iconBottom:i.bottom,firstTop:f.top,firstLeft:f.left}));}};
        assertRootConnector();const beforeConnector=assertConnector();const before=geometry();d.querySelector('[data-object-index="0"][data-property-page="Data Sources"]').click();
        const theme=document.getElementById('ose-modern-theme');if(theme&&!theme.sheet)await new Promise((resolve,reject)=>{theme.onload=resolve;theme.onerror=()=>reject(Error('Theme failed'));});
        const branch= d.querySelector('.ose-list button'),branchLine=()=>getComputedStyle(branch,'::after').height,finalBranchHeight=branchLine();
        const decoration=document.createElement('span');decoration.setAttribute('aria-hidden','true');branch.after(decoration);
        if(branchLine()!==finalBranchHeight)throw Error('Last source branch extended past its source row when non-source decoration followed it: '+JSON.stringify({before:finalBranchHeight,after:branchLine()}));
        decoration.remove();
        assertRootConnector();const duringConnector=assertConnector();const during=geometry();d.querySelector('[data-object-index="0"][data-property-page="Font"]').click();const after=geometry();const afterConnector=assertConnector();
        for(const state of [before,during,after]){if(state.branch!=='dotted'||state.stem!=='dotted')throw Error('Source branch missing: '+JSON.stringify(state));for(const key of ['x','y','w','h'])if(Math.abs(state[key]-before[key])>1)throw Error('Source tree shifts: '+JSON.stringify({before,during,after}));}
        if(d.querySelectorAll('.op-source-summary').length!==2)throw Error('An object source is hidden after leaving Data Sources');
        if(d.querySelector('footer'))throw Error('Properties still has a bottom action bar');
        if(!d.querySelector('header button[aria-label="Close"]'))throw Error('Header close button is missing');
        d.querySelector('[data-object-root="1"]').click();if(editorSel!==1)throw Error('Tree does not select the actual object');
        if(d.querySelector('[data-action="apply"]'))throw Error('Apply still exists');
        d.querySelector('[data-object-root="1"]').click();const check=d.querySelector('[name="preprinted"]');check.click();
        for(let i=0;i<100&&!editing.elements[1].preprinted;i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(!editing.elements[1].preprinted)throw Error('Checkbox did not update actual object');
        const input=d.querySelector('[name="comments"]');input.value='Immediate settings';input.dispatchEvent(new Event('input',{bubbles:true}));
        for(let i=0;i<100&&editing.elements[1].comments!=='Immediate settings';i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(editing.elements[1].comments!=='Immediate settings'||d.querySelector('[name="comments"]')!==input)throw Error('Live input lost value or focus node');
        const undoBefore=undoStack.length;check.click();for(let i=0;i<100&&editing.elements[1].preprinted;i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(editing.elements[1].preprinted||undoStack.length<=undoBefore)throw Error('Live checkbox did not create undo history');
        d.querySelector('header button[aria-label="Close"]').click();for(let i=0;i<100&&d.open;i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(d.open||editing.elements[1].comments!=='Immediate settings')throw Error('Close lost valid edits');
        openObjectProperties(1);deleteSelectedElement();
        for(let i=0;i<100&&d.querySelectorAll('[data-object-root]').length!==1;i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(d.querySelectorAll('[data-object-root]').length!==1||d.querySelector('[data-object-root="0"] span')?.textContent!=='Text 1')throw Error('Deleted canvas object stayed in the Properties tree');
        d.close();
        editing={name:'Stale inspector fixture',width_mm:60,height_mm:40,dpi:203,elements:[{id:'old-barcode',type:'barcode128',label:'Barcode 1',text:'12345678',x_mm:5,y_mm:5,module_width:2,bar_height_mm:12}]};editorSel=0;editorSelection=new Set([0]);refreshEditorUI();drawEditorCanvas();
        editing.elements[0]={...editing.elements[0],id:'live-barcode',label:'Barcode 2'};
        openObjectProperties(0);
        if(editing.elements[0].label!=='Barcode 2'||d.querySelector('[data-object-root="0"] span')?.textContent!=='Barcode 2')throw Error('Stale inspector overwrote the replacement barcode name');
        return {before,during,after,beforeConnector,duringConnector,afterConnector,finalSourceBranchStopsAtRow:true,namesMatch:true,sourcesVisible:true,selectionWorks:true,liveCheckbox:true,liveInput:true,closeRetains:true,deletedObjectRemovedFromTree:true};
      })()`);
      console.log('PASS '+JSON.stringify(result));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
