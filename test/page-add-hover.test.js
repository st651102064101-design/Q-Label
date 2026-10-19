const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
test('moving from page caret onto plus immediately closes menu without adding a page',()=>{
 const dom=new JSDOM('<div class="template-page-add-control"><button id="plus">+</button><button class="template-page-add-menu-button" aria-expanded="true"></button></div><div class="template-page-menu"></div>',{runScripts:'outside-only'}),w=dom.window;
 try{w.eval(fs.readFileSync(require.resolve('../gui/page-add-hover'),'utf8'));const plus=w.document.querySelector('#plus'),caret=w.document.querySelector('.template-page-add-menu-button'),menu=w.document.querySelector('.template-page-menu');let clicks=0;plus.onclick=()=>clicks++;
 plus.dispatchEvent(new w.MouseEvent('mouseover',{bubbles:true,relatedTarget:caret}));assert.equal(menu.hidden,true);assert.equal(caret.getAttribute('aria-expanded'),'false');assert.equal(clicks,0);
 menu.hidden=false;caret.setAttribute('aria-expanded','true');caret.dispatchEvent(new w.MouseEvent('mouseover',{bubbles:true}));assert.equal(menu.hidden,false,'caret retains its own open behavior');plus.click();assert.equal(clicks,1,'plus click remains usable');
 }finally{w.close();}
});
