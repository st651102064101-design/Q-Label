'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-named-source-')));
const timer=setTimeout(()=>app.exit(1),45000);
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,webPreferences:{nodeIntegration:true,contextIsolation:false}});
 win.webContents.on('console-message',(_event,_level,message)=>console.log('renderer: '+message));
 await win.loadURL('data:text/html,<body><div id="editor"></div>');
 const result=await win.webContents.executeJavaScript(`(()=>{try{
 globalThis.crypto.randomUUID=require('node:crypto').randomUUID;
 const Session=require(${JSON.stringify(path.resolve('gui/source-session.js'))}),UI=require(${JSON.stringify(path.resolve('gui/object-data-sources-ui.js'))});
 const session=Session.createSession({elements:[{type:'text',text:'A'},{type:'text',text:'B'}]});const id=session.draft.elements[1].dataSourceRefs[0];session.update(doc=>{doc.sourceDefinitions[id].name='Test2';doc.sourceDefinitions.clock={id:'clock',name:'Test1',kind:'clock',config:{}};doc.pages=[{elements:[{id:'clock-owner',type:'text',text:'',dataSourceRefs:['clock']}]}];doc.sourceDefinitions.stale={id:'stale',name:'object.0',kind:'input',config:{key:'object.0'}};});
 const editor=UI.mount(document.getElementById('editor'),{session,objectId:session.draft.elements[0].id});document.querySelector('[aria-label="Change Data Source Name…"]').click();const wizard=document.querySelector('.source-name-wizard'),options=[...wizard.querySelectorAll('.ose-named-source-options [role="option"]')];
 if(session.draft.sourceDefinitions.stale)throw Error('Stale definition survived');
 if(options.length!==2||options.some(b=>!b.disabled))throw Error('Invalid disabled named list');
 wizard.querySelector('[value="link"]').click();for(const button of options){const svg=button.querySelector('svg'),rect=svg.getBoundingClientRect();if(button.disabled||rect.width!==16||rect.height!==16||!svg.querySelector('path').getAttribute('d'))throw Error('SVG geometry / enabled state');}
 options[1].click();[...wizard.querySelectorAll('button')].find(b=>b.textContent==='OK').click();if(session.draft.elements[0].dataSourceRefs[0]!=='clock'||document.querySelector('.source-name-wizard'))throw Error('Link did not commit');editor.dispose();return {svgSize:16,choices:2,linked:'clock'};}catch(error){return {error:error.stack};}
 })()`);
 if(result.error)throw Error(result.error);
 console.log('PASS named-source list runtime '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
 }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});
