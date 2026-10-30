const { app } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

app.setPath('appData', fs.mkdtempSync(path.join(os.tmpdir(), 'table-row-controls-')));
app.on('browser-window-created', (_event, win) => {
  win.on('show', () => win.hide());
  win.webContents.once('did-finish-load', async () => {
    win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) console.error('RENDERER:', message); });
    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      const result = await win.webContents.executeJavaScript(`(() => {
        window.hideProjectHome();
        const row=()=>({mode:'Auto',size:5,weight:100,min:1,max:254});
        editing={name:'Row controls test',width_mm:80,height_mm:40,dpi:203,margin_mm:{left:0,top:0},elements:[{
          type:'image',label:'Table',x_mm:10,y_mm:5,width_mm:50,height_mm:30,
          table_model:{rows:Array.from({length:3},row),columns:Array.from({length:5},row),values:Array.from({length:3},()=>Array(5).fill('')),padding:.5,fontSize:3,stroke:.2,border:'#000000',fill:'#ffffff',borders:'All',errors:{clip:true}}
        }],values:{}};
        editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        window.TableCellSelection.select({r:1,c:2},{},'row');
        const full=[...document.querySelectorAll('.table-cell-selection [data-table-select]')];
        if(full.length!==1||full[0].dataset.tableSelect!=='row'||full[0].dataset.tableAxisIndex!=='1')throw Error('Whole-row selection should expose one row menu: '+full.map(n=>n.dataset.tableSelect));
        const translation=full[0].getAttribute('transform').match(/translate\\(([-0-9.]+) ([-0-9.]+)/);
        const center=Number(translation?.[1]),top=Number(translation?.[2]);
        if(Math.abs(center-35)>.02||!(top<5))throw Error('Whole-row menu is not centered above table: '+center+','+top);
        if(full[0].dataset.tableMenu!=='row'||full[0].getAttribute('aria-label')!=='Row actions')throw Error('Centered ellipsis is not connected to row actions');
        const buttonRect=full[0].getBoundingClientRect();
        full[0].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,clientX:buttonRect.left+buttonRect.width/2,clientY:buttonRect.top+buttonRect.height/2}));
        const menu=document.querySelector('.table-menu[aria-label="Table actions"]');
        if(!menu||menu.hidden||menu.getAttribute('role')!=='menu'||menu.getAttribute('aria-label')!=='Table actions')throw Error('Row actions menu did not open');
        if(!menu.classList.contains('object-context-menu')||!menu.querySelector('.ocm-icon svg'))throw Error('Table actions menu is missing the system context-menu style or icons');
        if(document.querySelector('#ribbon-table details[aria-label="More table tools"]'))throw Error('Removed More tools dropdown is still visible');
        const labels=()=>[...menu.querySelectorAll('button')].map(button=>button.textContent.trim());
        const categories=[...menu.querySelectorAll('.table-menu-group-trigger')].map(button=>button.querySelector('.ocm-label')?.textContent.trim());
        if(!['Lock Table'].every(label=>labels().includes(label))||!['Rows','Columns','Cell','Style','Layer','Table'].every(label=>categories.includes(label)))throw Error('Grouped table actions are missing: '+labels());
        const rowGroup=[...menu.querySelectorAll('.table-menu-group-trigger')].find(button=>button.textContent.includes('Rows'));
        if(!rowGroup)throw Error('Menu is missing Rows submenu');
        rowGroup.dispatchEvent(new PointerEvent('pointerenter'));
        const addRow=rowGroup.parentElement.querySelector('[data-command="New Row Below"]');
        if(!addRow||!rowGroup.parentElement.querySelector('[data-command="Delete Row"]'))throw Error('Rows submenu is missing insertion or contextual Delete Row');
        addRow.click();
        if(menu.hidden!==true||editing.elements[0].table_model.rows.length!==4)throw Error('New Row Below menu action did not update table');
        window.TableCellSelection.select({r:1,c:2},{},'cell');
        const cell=[...document.querySelectorAll('.table-cell-selection [data-table-select]')];
        if(cell.length!==1||cell[0].dataset.tableMenu!=='row'||cell[0].dataset.tableAxisIndex!=='1')throw Error('Single-cell selection should expose one table-header dropdown: '+cell.map(n=>n.dataset.tableSelect));
        const cellTranslation=cell[0].getAttribute('transform').match(/translate\\(([-0-9.]+) ([-0-9.]+)/);
        if(Math.abs(Number(cellTranslation?.[1])-35)>.02||!(Number(cellTranslation?.[2])<5))throw Error('Single-cell dropdown is not at table header: '+cellTranslation);
        const cellRect=cell[0].getBoundingClientRect();
        cell[0].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,clientX:cellRect.left+cellRect.width/2,clientY:cellRect.top+cellRect.height/2}));
        if(menu.hidden)throw Error('Single-cell dropdown did not open');
        const cellRows=[...menu.querySelectorAll('.table-menu-group-trigger')].find(button=>button.textContent.includes('Rows'));
        cellRows.dispatchEvent(new PointerEvent('pointerenter'));
        const cellAddRow=cellRows.parentElement.querySelector('[data-command="New Row Below"]');
        cellAddRow.click();
        if(editing.elements[0].table_model.rows.length!==5)throw Error('Cell dropdown did not act on its selected row');
        window.TableCellSelection.select({r:1,c:2},{},'column');
        const fullColumn=[...document.querySelectorAll('.table-cell-selection [data-table-select]')];
        if(fullColumn.length!==1||fullColumn[0].dataset.tableSelect!=='column'||fullColumn[0].dataset.tableAxisIndex!=='2'||fullColumn[0].dataset.tableMenu!=='column')throw Error('Whole-column selection should expose one column menu: '+fullColumn.map(n=>n.dataset.tableSelect+':'+n.dataset.tableAxisIndex));
        const columnRect=fullColumn[0].getBoundingClientRect();
        fullColumn[0].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,clientX:columnRect.left+columnRect.width/2,clientY:columnRect.top+columnRect.height/2}));
        if(!menu||menu.hidden)throw Error('Column actions menu did not open');
        const wholeColumnMenuOpens=!menu.hidden;
        const tableObject=editing.elements[0];editing.elements.push({type:'text',label:'Behind layer',text:'Behind',x_mm:1,y_mm:1,width_mm:10,height_mm:5},{type:'text',label:'Front layer',text:'Front',x_mm:2,y_mm:2,width_mm:10,height_mm:5});
        const openTableMenu=()=>{const hit=liveOverlay().querySelector('.hit[data-hit="'+editorSel+'"]'),event=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:300,clientY:300});event.tableCell={r:0,c:0};hit.dispatchEvent(event);};
        editorSel=0;editorSelection=new Set([0]);openTableMenu();
        const layer=[...menu.querySelectorAll('.table-menu-group-trigger')].find(button=>button.textContent.includes('Layer'));
        if(!layer)throw Error('Table actions menu is missing Layer submenu');
        layer.dispatchEvent(new PointerEvent('pointerenter'));
        const bringFront=layer.parentElement.querySelector('[data-command="Bring to front"]');
        if(!bringFront||bringFront.disabled||!layer.parentElement.querySelector('[data-command="Send to back"]').disabled)throw Error('Layer submenu does not reflect available z-order actions');
        bringFront.click();
        if(editing.elements.at(-1)?.label!==tableObject.label||editorSel!==2||!editorSelection.has(2))throw Error('Bring to front did not reorder and preserve table selection: '+JSON.stringify({labels:editing.elements.map(element=>element.label),editorSel,selection:[...editorSelection]}));
        openTableMenu();
        const layerAgain=[...menu.querySelectorAll('.table-menu-group-trigger')].find(button=>button.textContent.includes('Layer'));
        layerAgain.dispatchEvent(new PointerEvent('pointerenter'));
        if(!layerAgain.parentElement.querySelector('[data-command="Bring to front"]').disabled||layerAgain.parentElement.querySelector('[data-command="Send to back"]').disabled)throw Error('Layer submenu did not update disabled actions after reorder');
        layerAgain.parentElement.querySelector('[data-command="Send to back"]').click();
        if(editing.elements[0]?.label!==tableObject.label||editorSel!==0||!editorSelection.has(0))throw Error('Send to back did not reorder and preserve table selection');
        undo();
        if(editing.elements.at(-1)?.label!==tableObject.label)throw Error('Undo did not restore the prior table layer');
        redo();
        if(editing.elements[0]?.label!==tableObject.label)throw Error('Redo did not restore the requested table layer');
        return {wholeRow:{count:full.length,centerX:center,y:top},rowMenuOpens:true,groupedSubmenus:['Rows','Columns','Cell','Style','Layer','Table'],newRowBelowRows:editing.elements.find(element=>element.table_model).table_model.rows.length,singleCellControls:cell,wholeColumn:{count:fullColumn.length,axis:fullColumn[0].dataset.tableAxisIndex,menuOpens:wholeColumnMenuOpens},layerBringToFront:true,layerSendToBack:true,layerUndoRedo:true};
      })()`);
      console.log(JSON.stringify(result));
      app.exit(0);
    } catch (error) {
      console.error(error.stack);
      app.exit(1);
    }
  });
});
require('../gui/main');
