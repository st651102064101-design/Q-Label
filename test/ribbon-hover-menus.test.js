'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('Insert dropdowns ignore hover and clicks close other menus without blocking activation',()=>{
 const buttons=new Map(['insertTextTool','insertPictureTool','insertBarcodeTool'].map(id=>[id,{id,expanded:id==='insertTextTool',contains(t){return t===this},getAttribute(){return String(this.expanded)}}]));
 const menu={hidden:false,contains(){return false}},barcode={hidden:true,contains(){return false}},listeners={};let opened=0;
 const document={getElementById:id=>buttons.get(id),querySelector:s=>s==='.line-menu.tool-menu'?menu:s==='.barcode-menu'?barcode:null,addEventListener:(type,fn)=>listeners[type]=fn};
 const window={ToolMenus:{toggle(){opened++}},LineMenus:{close(){buttons.get('insertTextTool').expanded=false}},openBarcodeMenu(){opened++}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../gui/ribbon-hover-menus.js'),'utf8'),{document,window,setTimeout,clearTimeout});
 listeners.pointerover?.({pointerType:'mouse',target:buttons.get('insertBarcodeTool')});assert.equal(opened,0);assert.equal(buttons.get('insertTextTool').expanded,true);
 let blocked=false;listeners.click({target:buttons.get('insertBarcodeTool'),detail:1,preventDefault(){blocked=true},stopImmediatePropagation(){blocked=true}});assert.equal(buttons.get('insertTextTool').expanded,false);assert.equal(blocked,false);
});
test('moving to a different ribbon button closes open dropdown instantly without opening another',()=>{
 const dom=new (require('jsdom').JSDOM)('<div id="ribbon-insert"><button id="insertTextTool" class="ribbon-command" aria-expanded="true"><span>Text</span></button><button class="ribbon-command" id="rectangle"><span>Rectangle</span></button></div><div class="line-menu tool-menu"><button id="menu-item">Normal</button></div>',{runScripts:'outside-only'}),w=dom.window,d=w.document;let closed=0,opened=0;
 w.ToolMenus={toggle(){opened++;}};w.LineMenus={close(){closed++;d.querySelector('#insertTextTool').setAttribute('aria-expanded','false');}};
 w.eval(fs.readFileSync(path.join(__dirname,'../gui/ribbon-hover-menus.js'),'utf8'));
 const hover=target=>{const e=new w.Event('pointerover',{bubbles:true});Object.defineProperty(e,'pointerType',{value:'mouse'});target.dispatchEvent(e);};
 hover(d.querySelector('#menu-item'));assert.equal(closed,0,'moving into menu retains it');hover(d.querySelector('#insertTextTool span'));assert.equal(closed,0,'own trigger retains it');hover(d.querySelector('#rectangle span'));assert.equal(closed,1,'other command closes in the same event');assert.equal(opened,0,'hover does not open another menu');dom.window.close();
});
