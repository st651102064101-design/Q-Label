'use strict';
// Electron runtime: every ribbon command carries a full-colour SVG and keeps its data-icon identity.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-ribbon-icons-')));
const timer=setTimeout(()=>app.exit(1),60000);
const shotDir=process.env.RIBBON_SHOTS||'';
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.once('did-finish-load',async()=>{
  try{
    const run=code=>win.webContents.executeJavaScript(code);
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await new Promise(r=>setTimeout(r,100));}
    await run("hideProjectHome();editing={width_mm:100,height_mm:60,dpi:203,elements:[{type:'box',x_mm:5,y_mm:5,width_mm:20,height_mm:10}]};editorSel=0;editorSelection=new Set([0]);refreshEditorUI();drawEditorCanvas();0");
    await new Promise(r=>setTimeout(r,300));
    const result=JSON.parse(await run(`JSON.stringify([...document.querySelectorAll('.ribbon-command')].filter(b=>b.closest('.ribbon-panel,[role=tabpanel]')).map(b=>{const svg=b.querySelector('svg');return {label:b.getAttribute('aria-label')||b.title,hasSvg:!!svg,colours:new Set((svg?.outerHTML||'').match(/#[0-9a-fA-F]{6}/g)||[]).size,dataIcon:svg?.dataset?.icon||null};}))`));
    const keepAsIs=['Keyboard shortcuts','About Q LABEL'];// Help icons keep their tested glyph markup
    const mono=result.filter(r=>!keepAsIs.includes(r.label)&&(!r.hasSvg||r.colours<2));
    if(mono.length)console.log('MONO',JSON.stringify(mono));assert.deepEqual(mono.map(r=>r.label),[],'ribbon commands without a colour SVG');
    const icons=Object.fromEntries(result.map(r=>[r.label,r.dataIcon]));
    for(const [label,icon] of Object.entries({'Align left':'align-left','Show rulers':'show-rulers','Keyboard shortcuts':'keyboard-shortcuts'}))if(icons[label]!==undefined)assert.equal(icons[label],icon,label+' keeps data-icon');
    if(shotDir){
      for(const tab of ['Home','Insert','Layout','Picture','Data','View','Tools']){
        await run("[...document.querySelectorAll('.ribbon-tabs [role=tab]')].find(t=>t.textContent.trim()==='"+tab+"')?.click();0");
        await new Promise(r=>setTimeout(r,250));
        const rect=JSON.parse(await run("JSON.stringify((()=>{const b=document.querySelector('.ribbon-tabs').getBoundingClientRect(),p=document.querySelector('.ribbon-panel:not([hidden])')?.getBoundingClientRect()||b;return {x:0,y:Math.max(0,b.top),width:innerWidth,height:Math.ceil(p.bottom-b.top)+4};})())"));
        const image=await win.webContents.capturePage(rect);
        fs.writeFileSync(path.join(shotDir,'ribbon-'+tab+'.png'),image.toPNG());
      }
    }
    console.log('PASS ribbon colour icons',result.length,'commands');
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
