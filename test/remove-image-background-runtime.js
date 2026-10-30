'use strict';
const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
const testData=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-remove-bg-'));
app.setPath('userData',testData);
fs.mkdirSync(path.join(testData,'templates'));
fs.writeFileSync(path.join(testData,'templates','background-check.json'),JSON.stringify({name:'Background check',width_mm:30,height_mm:30,dpi:203,elements:[],values:{}}));
fs.writeFileSync(path.join(testData,'settings.json'),JSON.stringify({lastTemplate:'background-check.json',connType:'ip'}));
app.on('browser-window-created',(_event,win)=>{
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error(message);});
  win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    const run=code=>win.webContents.executeJavaScript(code.includes('await ')?`(async()=>{${code}})()`:code);
    const check=async(label,code)=>{if(!await run(code))throw Error(label);console.log('PASS '+label);};
    try{
      for(let i=0;i<150;i++){if(await run('!appInitializing'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      await run(`window.hideProjectHome();
        editing.elements=[{type:'image',label:'Logo on white',x_mm:0,y_mm:0,width_mm:30,height_mm:30,bitmap_width:8,bitmap_height:8,bitmap_hex:'0101010100000000',text_background:'#ffffff'}];
        editorSelection=new Set([0]);editorSel=0;drawEditorCanvas();
        window.pictureTab=document.querySelector('.ribbon-tab[aria-controls="ribbon-picture"]');
        window.bgPixels=async()=>{const cv=await LabelPreview.rasterizeDesignSheetCanvas({width_mm:30,height_mm:30,dpi:203,margin_mm:{},page:{enabled:false},elements:[editing.elements[0]]},{},[0],qrCache,{transparentBackground:true});const rgba=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let ink=0,clear=0;for(let i=0;i<rgba.length;i+=4){if(rgba[i+3]===0)clear++;else if(rgba[i+3]>127&&rgba[i]<128&&rgba[i+1]<128&&rgba[i+2]<128)ink++;}return{ink,clear,cornerAlpha:rgba[3],png:cv.toDataURL('image/png')};};
        window.beforeBg=await bgPixels();`);
      await check('Home clipboard group follows text and object formatting', `(()=>{const host=document.querySelector('#ribbon-home'),clipboard=host?.querySelector('[data-ribbon-group="clipboard"]'),format=host?.querySelector('.text-format-tools');return !!clipboard&&!!format&&!!(format.compareDocumentPosition(clipboard)&Node.DOCUMENT_POSITION_FOLLOWING)})()`);
      await check('selecting an image reveals its contextual Picture ribbon', 'pictureTab&&!pictureTab.hidden&&pictureTab.getAttribute("aria-selected")==="true"&&document.querySelectorAll("#ribbon-picture [data-picture-command]").length>=6');
      await run(`document.getElementById('previewFrame').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:100,clientY:150}));
        window.removeBgButton=[...document.querySelectorAll('.object-context-menu button')].find(button=>button.querySelector('.ocm-label')?.textContent==='Remove background');`);
      await check('image menu exposes Remove background', '!!window.removeBgButton');
      await run('window.removeBgButton.click();window.afterBg=await bgPixels();');
      console.log(await run('JSON.stringify({before:{ink:beforeBg.ink,clear:beforeBg.clear,alpha:beforeBg.cornerAlpha},after:{ink:afterBg.ink,clear:afterBg.clear,alpha:afterBg.cornerAlpha},element:editing.elements[0],status:document.getElementById("editorStatus").textContent})'));
      await check('rendered white background becomes alpha zero', 'beforeBg.cornerAlpha===255&&beforeBg.clear===0&&afterBg.cornerAlpha===0&&afterBg.clear>0');
      await check('all black logo pixels remain unchanged', 'beforeBg.ink>0&&afterBg.ink===beforeBg.ink');
      await check('canvas no longer paints an image background rectangle', '!liveOverlay().querySelector("[data-label-element] [data-barcode-background]")');
      await run('await persistEditor();window.savedBg=await window.zebra.loadTemplateRaw(current.file);');
      await check('transparency is saved in the label', 'savedBg.elements[0].transparent_background===true&&savedBg.elements[0].text_background==="none"');
      await check('selected picture displays its corner radius control', "[...document.querySelectorAll('.paper-corner-control')].some(button=>button.getAttribute('aria-label')==='Adjust image corner radius')");
      await run(`window.beforeRound=await bgPixels();document.querySelector('.paper-corner-control[aria-label="Adjust image corner radius"]').dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));window.afterRound=await bgPixels();window.roundedSvg=LabelPreview.renderPreviewSVG(editing,{},[0],qrCache,{transparentBackground:true});`);
      await check('corner control rounds selected picture in canvas and SVG', 'editing.elements[0].corner_radius_mm>0&&afterRound.ink<beforeRound.ink&&roundedSvg.includes("image-corner-clip-0")');
      await run('window.beforeFlip=await bgPixels();editing.elements[0].flip_x=true;window.afterFlip=await bgPixels();');
      await check('flip command changes the rendered picture', 'beforeFlip.png!==afterFlip.png');
      await run('editing.elements[0].transparent_background=false;editing.elements[0].text_background="#fff";openObjectProperties(0);');
      await check('picture editor exposes Remove background', '!!document.querySelector("#objectProperties [data-remove-background]")');
      await run('document.querySelector("#objectProperties [data-remove-background]").click();');
      await check('editor preview shows transparent artwork on checkerboard', '!document.querySelector(".op-preview [data-barcode-background]")&&document.querySelector(".op-preview").style.background.includes("conic-gradient")');
      const result=await run('({before:beforeBg.png,after:afterBg.png})');
      const output=path.join(__dirname,'..','test-results');fs.mkdirSync(output,{recursive:true});
      for(const [name,png]of Object.entries(result))fs.writeFileSync(path.join(output,'remove-bg-'+name+'.png'),Buffer.from(png.split(',')[1],'base64'));
      console.log('REMOVE BACKGROUND CHECKS PASSED');app.exit(0);
    }catch(error){console.error(error.stack);app.exit(1);}
  });
});
require('../gui/main');
