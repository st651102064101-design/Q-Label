'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-symbology-')));
const timer=setTimeout(()=>{console.error('Symbology runtime timed out');app.exit(1);},90000);
app.on('browser-window-created',(_event,win)=>{win.on('show',()=>win.hide());win.webContents.once('did-finish-load',async()=>{try{
win.setSize(1200,850);const result=await win.webContents.executeJavaScript(`(async()=>{
 while(appInitializing)await new Promise(r=>setTimeout(r,30));hideProjectHome();autoSaveEnabled=false;
 editing={width_mm:80,height_mm:50,dpi:203,elements:[{type:'barcode128',label:'barcode 1',text:'12345678',module_width:2,bar_height_mm:12,x_mm:3,y_mm:3}]};editorSel=0;editorSelection=new Set([0]);refreshEditorUI();drawEditorCanvas();openObjectProperties(0);const d=document.getElementById('objectProperties');
 for(let i=0;i<100&&d.querySelector('[name="sym.bcid"]').options.length<50;i++)await new Promise(r=>setTimeout(r,30));
 const field=n=>d.querySelector('[name="sym.'+n+'"]');if(!d.classList.contains('op-native-barcode'))throw Error('Native layout missing');if(!field('check_digit').disabled||!field('check_digit').checked||!field('ratio').disabled)throw Error('Code128 forced options differ');
 const count=field('bcid').options.length;field('code_set').value='C';field('code_set').dispatchEvent(new Event('change',{bubbles:true}));
 for(let i=0;i<150&&editing.elements[0].barcode_spec?.code_set!=='C';i++)await new Promise(r=>setTimeout(r,20));
 if(editing.elements[0].barcode_spec?.code_set!=='C'||!editing.elements[0].bitmap_hex)throw Error('Code set did not reach actual bitmap');
 const widthBefore=editing.elements[0].width_mm;field('x').value=20;field('x').dispatchEvent(new Event('change',{bubbles:true}));
 for(let i=0;i<150&&editing.elements[0].width_mm<=widthBefore;i++)await new Promise(r=>setTimeout(r,20));if(!(editing.elements[0].width_mm>widthBefore))throw Error('X dimension did not resize encoded barcode');
 d.querySelector('[data-sym-action="print-method"]').click();let dialog=document.querySelector('.sym-native-dialog');dialog.querySelector('[value="host"]').click();dialog.querySelector('[data-dialog-action="ok"]').click();
 for(let i=0;i<150&&editing.elements[0].barcode_spec.print_method!=='host';i++)await new Promise(r=>setTimeout(r,20));if(editing.elements[0].barcode_spec.print_method!=='host')throw Error('Print method not committed');
 const rect=d.getBoundingClientRect(),nav=d.querySelector('nav').getBoundingClientRect(),main=d.querySelector('main').getBoundingClientRect(),specific=d.querySelector('.sym-specific').getBoundingClientRect(),bottom=d.querySelector('.sym-bottom').getBoundingClientRect();
 if(rect.width>910||Math.abs(nav.width-256)>2||main.width<nav.width*2||getComputedStyle(field('bcid')).borderRadius!=='6px'||bottom.bottom>main.bottom)throw Error('Q LABEL layout geometry failed '+JSON.stringify({rect:rect.toJSON(),nav:nav.toJSON(),main:main.toJSON(),specific:specific.toJSON(),bottom:bottom.toJSON()}));
 return {count,widthBefore,widthAfter:editing.elements[0].width_mm,bitmap:editing.elements[0].bitmap_width,method:editing.elements[0].barcode_spec.print_method,dialogWidth:rect.width,leftWidth:nav.width,rightWidth:main.width};
})()`);
assert.ok(result.count>50);console.log('PASS '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
}catch(e){console.error(e.stack);clearTimeout(timer);app.exit(1);}});});require('../gui/main');
