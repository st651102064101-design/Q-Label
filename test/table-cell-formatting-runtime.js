const {app}=require('electron');
const fs=require('fs');
const os=require('os');
const path=require('path');

app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'table-cell-formatting-')));
app.on('browser-window-created',(_,window)=>{
  window.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error(message);});
  window.webContents.once('did-finish-load',async()=>{
    try{
      await new Promise(resolve=>setTimeout(resolve,1800));
      const result=await window.webContents.executeJavaScript(`(()=>{
        let checks=0;const assert=(condition,message)=>{checks++;if(!condition)throw new Error(message);};
        window.hideProjectHome();
        editing={name:'Cell formatting',width_mm:80,height_mm:50,dpi:203,margin_mm:{left:0,top:0},elements:[{type:'image',label:'Table',x_mm:5,y_mm:5,width_mm:60,height_mm:30,table_model:{rows:Array.from({length:2},()=>({mode:'Auto',size:5,weight:100,min:1,max:254,align:'Start'})),columns:Array.from({length:3},()=>({mode:'Auto',size:5,weight:100,min:1,max:254,align:'Start'})),values:[['A','B','C'],['D','E','F']],padding:.5,fontSize:3,stroke:.175,border:'#000000',fill:'#ffffff',borders:'All',errors:{clip:true}}}],values:{}};
        editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const panel=document.getElementById('ribbon-table'),model=()=>editing.elements[0].table_model,button=name=>panel.querySelector('button[aria-label="'+name+'"]'),field=name=>panel.querySelector('[aria-label="'+name+'"]');
        assert(field('Align').value==='left'&&field('Vertical').value==='top','Default alignment controls were blank before selecting a cell');assert(!field('Align').disabled&&!field('Vertical').disabled,'Selecting a table object should enable whole-table alignment');
        TableCellSelection.select({r:0,c:0},{});
        assert(field('Align').value==='left'&&field('Vertical').value==='top','Default Start alignment did not resolve to left/top');
        const alignmentPositions=()=>{const svg=window.LabelPreview.renderElement(editing.elements[0],203,editing.values||{},{}),match=svg.match(/<text x="([^"]+)" y="([^"]+)"[^>]*text-anchor="([^"]+)"[^>]*>A<\\/text>/);assert(!!match,'Aligned cell text was missing from rendered table SVG: '+svg.slice(0,1200));return {x:Number(match[1]),y:Number(match[2]),anchor:match[3]};};
        const horizontal=[];for(const [value,anchor]of [['left','start'],['center','middle'],['right','end']]){const control=field('Align');control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));assert(model().cellStyles['0,0']?.align===value,'Selecting '+value+' did not update the selected cell model');const position=alignmentPositions();assert(position.anchor===anchor,'Selecting '+value+' did not change rendered text anchor: '+JSON.stringify(position));horizontal.push(position.x);}
        assert(horizontal[0]<horizontal[1]&&horizontal[1]<horizontal[2],'Left, center, and right produced no distinct rendered positions: '+JSON.stringify(horizontal));
        const vertical=[];for(const [value]of [['top'],['middle'],['bottom']]){const control=field('Vertical');control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));assert(model().cellStyles['0,0']?.verticalAlign===value,'Selecting '+value+' did not update the selected cell model');vertical.push(alignmentPositions().y);}
        assert(vertical[0]<vertical[1]&&vertical[1]<vertical[2],'Top, middle, and bottom produced no distinct rendered positions: '+JSON.stringify(vertical));
        TableCellSelection.select({r:0,c:0},{});button('Italic').click();
        assert(model().cellStyles['0,0']?.italic===true,'Italic was not applied to the selected cell');
        assert(!model().cellStyles['0,1']?.italic,'Italic changed an unselected cell');
        TableCellSelection.select({r:1,c:0},{});TableCellSelection.select({r:1,c:1},{ctrlKey:true});
        button('Strikethrough').click();
        assert(model().cellStyles['1,0']?.strike===true&&model().cellStyles['1,1']?.strike===true,'Strikethrough did not apply to every selected cell');
        assert(!model().cellStyles['1,2']?.strike&&!model().cellStyles['0,0']?.strike,'Strikethrough changed an unselected cell');
        button('Underline').click();button('Bold').click();
        assert(['1,0','1,1'].every(key=>model().cellStyles[key]?.underline===true&&model().cellStyles[key]?.bold===true),'Bold or underline missed a selected cell');
        field('Font').value='Calibri';field('Font').dispatchEvent(new Event('change',{bubbles:true}));
        field('Size (pt)').value='15';field('Size (pt)').dispatchEvent(new Event('change',{bubbles:true}));
        field('Text color').value='#ff0000';field('Text color').dispatchEvent(new Event('change',{bubbles:true}));
        field('Cell fill').value='#00ff00';field('Cell fill').dispatchEvent(new Event('change',{bubbles:true}));
        assert(['1,0','1,1'].every(key=>model().cellStyles[key]?.fontFamily==='Calibri'&&Math.abs(model().cellStyles[key]?.fontSize-15*25.4/72)<.001&&model().cellStyles[key]?.color==='#ff0000'&&model().cellStyles[key]?.fill==='#00ff00'),'Font, size, color, or fill missed selected cells');
        field('Align').value='right';field('Align').dispatchEvent(new Event('change',{bubbles:true}));
        assert(model().cellStyles['1,0']?.align==='right'&&model().cellStyles['1,1']?.align==='right','Alignment did not apply to all selected cells');
        const multiAlignSvg=window.LabelPreview.renderElement(editing.elements[0],203,editing.values||{},{});assert((multiAlignSvg.match(/text-anchor="end"/g)||[]).length>=2,'Selected multi-cell right alignment did not render for every selected cell');
        field('Vertical').value='bottom';field('Vertical').dispatchEvent(new Event('change',{bubbles:true}));
        assert(model().cellStyles['1,0']?.verticalAlign==='bottom'&&model().cellStyles['1,1']?.verticalAlign==='bottom','Vertical alignment missed selected cells');
        assert(!model().cellStyles['1,2']?.align&&model().columns.every(column=>column.align==='Start'),'Alignment changed unselected cells or column defaults');
        document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:0,clientY:0}));
        assert(TableCellSelection.keys.length===0&&!liveOverlay().querySelector('.table-cell-selection rect'),'Clicking outside the table did not clear cell selection and outline');
        assert(!field('Align').disabled&&!button('Strikethrough').disabled,'Selecting the table should enable formatting for the whole table');
        field('Font').value='Calibri';field('Font').dispatchEvent(new Event('change',{bubbles:true}));
        field('Size (pt)').value='15';field('Size (pt)').dispatchEvent(new Event('change',{bubbles:true}));
        button('Bold').click();button('Italic').click();button('Underline').click();button('Strikethrough').click();
        field('Text color').value='#123456';field('Text color').dispatchEvent(new Event('change',{bubbles:true}));
        field('Cell fill').value='#abcdef';field('Cell fill').dispatchEvent(new Event('change',{bubbles:true}));
        field('Align').value='center';field('Align').dispatchEvent(new Event('change',{bubbles:true}));
        field('Vertical').value='middle';field('Vertical').dispatchEvent(new Event('change',{bubbles:true}));
        const allCells=Array.from({length:model().rows.length},(_,r)=>Array.from({length:model().columns.length},(_,c)=>r+','+c)).flat();
        assert(allCells.every(key=>{const style=model().cellStyles[key];return style?.fontFamily==='Calibri'&&Math.abs(style.fontSize-15*25.4/72)<.001&&style.bold&&style.italic&&style.underline&&style.strike&&style.color==='#123456'&&style.fill==='#abcdef'&&style.align==='center'&&style.verticalAlign==='middle';}),'Whole-table formatting did not update every cell: '+JSON.stringify(model().cellStyles));
        const second=structuredClone(editing.elements[0]);second.label='Second table';editing.elements.push(second);model().cellStyles['0,0'].bold=false;delete model().cellStyles['0,0'].italic;delete model().cellStyles['0,0'].underline;delete second.table_model.cellStyles['1,2'].bold;delete second.table_model.cellStyles['1,2'].italic;delete second.table_model.cellStyles['1,2'].underline;editorSelection=new Set([0,1]);editorSel=0;drawEditorCanvas();
        const pressShortcut=key=>{const event=new KeyboardEvent('keydown',{key,ctrlKey:true,bubbles:true,cancelable:true});document.dispatchEvent(event);assert(event.defaultPrevented,'Ctrl+'+key.toUpperCase()+' was not handled for selected tables');};
        const everyTableCell=(key,value)=>editing.elements.slice(0,2).every(object=>allCells.every(id=>object.table_model.cellStyles[id]?.[key]===value));
        for(const [shortcut,key]of [['b','bold'],['i','italic'],['u','underline']]){pressShortcut(shortcut);assert(everyTableCell(key,true),'Ctrl+'+shortcut.toUpperCase()+' missed cells across selected tables: '+JSON.stringify(editing.elements.slice(0,2).map(object=>object.table_model.cellStyles)));pressShortcut(shortcut);assert(everyTableCell(key,false),'Ctrl+'+shortcut.toUpperCase()+' did not clear formatting from all selected table cells');}
        return {checks,multiTableShortcuts:true,shortcutToggleOff:true,singleCell:true,multiCell:true,wholeTableFormatting:true,unselectedCellsUntouched:true,horizontalPositions:horizontal,verticalPositions:vertical};
      })()`);
      console.log(JSON.stringify(result));
      app.exit(0);
    }catch(error){console.error(error);app.exit(1);}
  });
});
require('../gui/main');
