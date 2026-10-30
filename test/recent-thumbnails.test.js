const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
function fixture(initialSettings={}){
 const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;
 w.document.body.innerHTML='<section class="insert-recent-objects"><div id="recentObjectTools"></div></section>';
 w.el=id=>w.document.getElementById(id);w.settings={recentObjectEntries:[],recentObjectTools:[],...initialSettings};w.savedSettings=[];w.zebra={saveSettings:async value=>w.savedSettings.push(value)};
 const code=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
 w.eval(code.slice(code.indexOf('const recentToolNames='),code.indexOf('window.useObjectTool=')));
 return w;
}

test('right-click blank recent space opens Clear and clears both recent lists without touching label objects',async()=>{
 const w=fixture({recentObjectEntries:[{key:'box',name:'Box',element:{type:'box'}}],recentObjectTools:['text']});
 w.editing={elements:[{type:'text',text:'Keep me'}]};
 w.renderRecentToolButtons();w.renderRecentToolButtons();
 const area=w.document.querySelector('.insert-recent-objects'),grid=w.document.getElementById('recentObjectTools');
 const objectEvent=new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true});grid.querySelector('.insert-tool').dispatchEvent(objectEvent);
 assert.equal(w.document.querySelector('.recent-objects-menu')?.hidden,true,'object right-click does not open the blank-space menu');
 const blankEvent=new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:30,clientY:40});area.dispatchEvent(blankEvent);
 const menu=w.document.querySelector('.recent-objects-menu');assert.ok(menu&&!menu.hidden,'right-click in empty area opens Clear');
 assert.equal(w.document.querySelectorAll('.recent-objects-menu').length,1,'rerender does not duplicate menus');
 assert.equal(blankEvent.defaultPrevented,true);
 menu.querySelector('[role="menuitem"]').click();await Promise.resolve();
 assert.equal(w.settings.recentObjectEntries.length,0);assert.equal(w.settings.recentObjectTools.length,0);
 assert.equal(grid.querySelectorAll('.insert-tool').length,0);assert.ok(grid.querySelector('.source-empty'));
 assert.equal(menu.hidden,true);assert.equal(w.editing.elements[0].text,'Keep me');
 assert.deepEqual(JSON.parse(JSON.stringify(w.savedSettings.at(-1))),{recentObjectEntries:[],recentObjectTools:[]});
 grid.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
 assert.equal(menu.querySelector('button').disabled,true,'Clear is disabled when both lists are empty');
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(menu.hidden,true);
 w.close();
});

test('failed recent Clear persistence restores the visible recent entries',async()=>{
 const w=fixture({recentObjectEntries:[],recentObjectTools:['text']});w.renderRecentToolButtons();
 w.zebra.saveSettings=async()=>{throw Error('fixture write failure');};w.console.warn=()=>{};
 assert.equal(await w.clearRecentObjects(),false);
 assert.equal(w.settings.recentObjectTools[0],'text');assert.equal(w.document.querySelectorAll('.insert-tool').length,1);
 w.close();
});
test('Screenshot bitmap creates visible filled artwork',()=>{const w=fixture(),svg=w.recentObjectThumbnail({type:'image',bitmap_width:8,bitmap_height:2,bitmap_hex:'ff81'});assert.equal(svg.getAttribute('viewBox'),'0 0 24 24');const path=svg.querySelector('path');assert.ok(path.getAttribute('d').length);assert.equal(path.style.getPropertyValue('fill'),'rgb(17, 17, 17)');assert.equal(path.style.getPropertyPriority('fill'),'important');});
test('recent picture identity distinguishes color images with the same monochrome print bitmap',()=>{
 const w=fixture();
 const picture=color=>({type:'image',label:'Picture',bitmap_width:1,bitmap_height:1,bitmap_hex:'80',color_image_data:`data:image/png;base64,${color}`});
 w.noteRecentObjectUsage(picture('RED='));w.noteRecentObjectUsage(picture('BLUE'));
 assert.equal(w.settings.recentObjectEntries.length,2,'different original colors remain separately reusable');
 assert.notEqual(w.settings.recentObjectEntries[0].key,w.settings.recentObjectEntries[1].key);
 assert.equal(w.settings.recentObjectEntries[0].element.color_image_data,'data:image/png;base64,BLUE');
 w.close();
});
test('Electrical symbol uses saved bitmap rather than missing font glyph',()=>{const w=fixture(),svg=w.recentObjectThumbnail({type:'text',symbol_font:true,font_family:'Unavailable Electrical',text:'',bitmap_width:8,bitmap_height:1,bitmap_hex:'7e'});assert.ok(svg.querySelector('path'));assert.equal(svg.querySelector('text'),null);});
test('inline SVG retains outer thumbnail viewport and artwork',()=>{const w=fixture(),svg=w.recentObjectThumbnail({type:'image',source_format:'svg',svg_data:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><path d="M0 0L100 50"/></svg>'});assert.equal(svg.getAttribute('viewBox'),'0 0 24 24');assert.equal(svg.querySelector('svg').getAttribute('viewBox'),'0 0 100 50');assert.ok(svg.querySelector('path'));});
for(const name of ['accentCallout1','bentConnector4','quadArrow'])test(name+' preserves visible strokes at thumbnail size',()=>{const w=fixture();const parts=[{d:'M0 0L21600 21600',w:21600,h:21600,fill:false,stroke:true}];parts.bounds={x:0,y:0,w:21600,h:21600};w.ShapeTools={paths:()=>parts};const svg=w.recentObjectThumbnail({shape_preset:name,width_mm:1000,height_mm:500,thickness_mm:.01});const path=svg.querySelector('path');assert.ok(Number(path.getAttribute('stroke-width'))>=21600/22-.00001);assert.equal(path.style.getPropertyValue('stroke'),'rgb(17, 17, 17)');assert.equal(path.style.getPropertyPriority('stroke'),'important');});
test('invalid or empty bitmap provides a visible fallback icon',()=>{const w=fixture();for(const bitmap_hex of ['bad','00']){const svg=w.recentObjectThumbnail({type:'image',bitmap_width:8,bitmap_height:1,bitmap_hex});assert.ok(svg.querySelector('rect'));}});
test('recent table identity stays singular across different row, column, and cell sizes',()=>{
 const table=(columns,rows,label='Table 1')=>({type:'image',label,width_mm:columns.reduce((sum,size)=>sum+size,0),height_mm:rows.reduce((sum,size)=>sum+size,0),table_model:{columns:columns.map(size=>({mode:'Fixed',size})),rows:rows.map(size=>({mode:'Fixed',size})),values:rows.map((_,r)=>columns.map((_,c)=>`${r},${c}`))}});
 const older=table([10,20],[5,15]),newer=table([7,11,23,9],[4,8,12,16,20],'Table 1 (2)');
 const w=fixture({recentObjectEntries:[{key:'old-table-b',name:'Table 1 (2)',element:newer},{key:'old-table-a',name:'Table 1',element:older}]});
 w.renderRecentToolButtons();
 assert.equal(w.settings.recentObjectEntries.length,1);
 assert.equal(w.settings.recentObjectEntries[0].key,'table');
 assert.equal(w.settings.recentObjectEntries[0].element.table_model.columns.length,4,'the newest table remains the sole reusable table preset');
 assert.equal(w.document.querySelectorAll('#recentObjectTools .insert-tool').length,1);
 assert.equal(w.savedSettings.length,1,'legacy duplicate entries are persisted as one table entry');
});
test('using another differently sized table replaces the single recent table entry instead of adding a duplicate',()=>{
 const first={type:'image',label:'Table 1',table_model:{columns:[{mode:'Fixed',size:8},{mode:'Fixed',size:17}],rows:[{mode:'Fixed',size:6},{mode:'Fixed',size:11}],values:[['a','b'],['c','d']]}};
 const next={type:'image',label:'Table 1',table_model:{columns:[{mode:'Fixed',size:31},{mode:'Fixed',size:9},{mode:'Fixed',size:22}],rows:[{mode:'Fixed',size:27}],values:[['x','y','z']]}};
 const w=fixture({recentObjectEntries:[{key:'old',name:'Table 1',element:first}]});
 w.renderRecentToolButtons();w.noteRecentObjectUsage(next);
 assert.equal(w.settings.recentObjectEntries.length,1);
 assert.equal(w.settings.recentObjectEntries[0].element.table_model.columns.length,3);
 assert.equal(w.settings.recentObjectEntries[0].element.table_model.rows.length,1);
 assert.equal(w.document.querySelectorAll('#recentObjectTools .insert-tool').length,1);
});

test('recent object grid uses fixed columns aligned to the left',()=>{
 const html=fs.readFileSync(require.resolve('../gui/index.html'),'utf8');
 const css=html.match(/\.insert-tool-grid\{([^}]*)\}/)[1];
 assert.match(css,/grid-template-columns\s*:\s*repeat\(auto-fill,\s*70px\)/);
 assert.match(css,/justify-content\s*:\s*start/);
});
