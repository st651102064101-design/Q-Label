'use strict';
const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'ribbon-availability-')));
app.on('browser-window-created',(_event,win)=>{
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error('RENDERER:',message);});
  win.webContents.once('did-finish-load',async()=>{
    try{
      for(let i=0;i<150;i++){if(await win.webContents.executeJavaScript('!appInitializing'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      if(process.argv.includes('--file-only')){
        const fileState=await win.webContents.executeJavaScript(`(()=>{const tabs=[...document.querySelectorAll('.ribbon-tabs [role="tab"]')],button=tabs.find(item=>item.textContent.trim()==='File'),menu=document.querySelector('.ribbon-file-menu'),prior=tabs.find(item=>item!==button&&item.getAttribute('aria-selected')==='true'),priorPanel=prior&&document.getElementById(prior.getAttribute('aria-controls'));button.click();return {menuOpen:!menu.hidden,filePanelHidden:document.getElementById(button.getAttribute('aria-controls')).hidden,priorSelected:!prior||prior.getAttribute('aria-selected')==='true',priorPanelVisible:!prior||!priorPanel.hidden};})()`);
        if(!fileState.menuOpen||!fileState.filePanelHidden||!fileState.priorSelected||!fileState.priorPanelVisible)throw Error('File dropdown did not preserve the selected ribbon panel: '+JSON.stringify(fileState));
        console.log(JSON.stringify({fileOpensDropdownOnly:true,...fileState}));app.exit(0);return;
      }
      const result=await win.webContents.executeJavaScript(`(async()=>{
        const expected=['File','Home','Insert','Layout','Picture','Data','View','Tools','Help'];
        const tabs=[...document.querySelectorAll('.ribbon-tabs [role="tab"]')];
        let firstItemFocusStyle=null;
        for(const name of expected){
          const tab=tabs.find(item=>item.textContent.trim()===name);
          if(!tab||tab.hidden)throw Error('Ribbon tab missing: '+name);
          if(name==='File'){
            const menu=document.querySelector('.ribbon-file-menu');
            if(!menu||!menu.hidden||!menu.querySelector('[role="menuitem"]'))throw Error('File menu should start closed with commands available');
            const priorTab=tabs.find(item=>item!==tab&&item.getAttribute('aria-selected')==='true'),priorPanel=priorTab&&document.getElementById(priorTab.getAttribute('aria-controls'));
            tab.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));
            if(!menu.hidden)throw Error('Hovering File must not open it');
            tab.click();if(menu.hidden||tab.getAttribute('aria-expanded')!=='true')throw Error('Click opens File');
            if(!document.getElementById(tab.getAttribute('aria-controls')).hidden)throw Error('File click must not display its empty tab panel');
            if(priorTab&&(priorTab.getAttribute('aria-selected')!=='true'||priorPanel.hidden))throw Error('File click must preserve the previously selected ribbon panel');
            tab.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}));await new Promise(resolve=>setTimeout(resolve,150));
            if(menu.hidden)throw Error('File remains open on pointer exit');
            const menuBounds=menu.getBoundingClientRect(),tabBounds=tab.getBoundingClientRect();
            const firstItem=menu.querySelector('[role="menuitem"]'),firstStyle=getComputedStyle(firstItem);firstItemFocusStyle={outline:firstStyle.outline,border:firstStyle.border};
            if(firstStyle.outlineStyle!=='none'&&parseFloat(firstStyle.outlineWidth)>0)throw Error('File menu New item has a focus border: '+firstStyle.outline);
            if(parseFloat(firstStyle.borderWidth)>0)throw Error('File menu New item has a border: '+firstStyle.border);
            if(menuBounds.top<tabBounds.bottom-1)throw Error('File dropdown overlaps the File tab: '+JSON.stringify({menuTop:menuBounds.top,tabBottom:tabBounds.bottom}));
            if(menuBounds.bottom>innerHeight)throw Error('File dropdown extends below the viewport: '+JSON.stringify({menuBottom:menuBounds.bottom,viewportHeight:innerHeight}));
            continue;
          }
          tab.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));
          const panel=document.getElementById(tab.getAttribute('aria-controls'));
          if(!panel)throw Error('Ribbon panel missing: '+name);
          if(!['Home','Insert'].includes(name)&&(panel.hidden||tab.getAttribute('aria-selected')!=='true'))throw Error('Mouse hover should activate ribbon panel: '+name);
          if(['Home','Insert'].includes(name))tab.click();
          if(name==='Home'){
            const insertTab=tabs.find(item=>item.textContent.trim()==='Insert');
            insertTab.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'touch'}));
            if(insertTab.getAttribute('aria-selected')==='true'||tab.getAttribute('aria-selected')!=='true'||panel.hidden)throw Error('Touch compatibility hover should not switch ribbon panels');
            tab.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'pen'}));
            if(tab.getAttribute('aria-selected')!=='true')throw Error('Pen hover should activate a ribbon panel');
          }
          tab.click();
          if(panel.hidden||tab.getAttribute('aria-selected')!=='true')throw Error('Click should continue activating ribbon panel: '+name);
          const disabled=[...panel.querySelectorAll('button:disabled,input:disabled,select:disabled')];
          const hidden=disabled.filter(control=>getComputedStyle(control).display==='none');
          if(hidden.length)throw Error(name+' hides disabled controls: '+hidden.map(control=>control.getAttribute('aria-label')||control.title||control.textContent).join(', '));
          if(name==='Home'){
            const paste=panel.querySelector('[aria-label="Paste"]'),format=panel.querySelector('.text-format-tools');
            if(!paste||paste.hidden||getComputedStyle(paste).display==='none'||!paste.disabled)throw Error('Paste should remain visible and disabled while clipboard is empty');
            if(!format||format.hidden||!format.querySelectorAll(':disabled').length)throw Error('Formatting toolbar should remain visible with unavailable tools disabled when no object is selected');
          }
        }
        const picture=document.getElementById('ribbon-picture');
        const pictureCommands=[...picture.querySelectorAll('[data-picture-command]')];
        if(!pictureCommands.length||!pictureCommands.every(command=>command.disabled))throw Error('Picture commands should be visible and disabled without a selected picture');
        if(pictureCommands.some(command=>getComputedStyle(command).display==='none'))throw Error('Picture tab hides unavailable commands');
        return {tabs:expected,fileHoverOpens:true,fileHoverClickKeepsMenuOpen:true,fileHoverExitCloses:true,fileClickOpensOnlyDropdown:true,priorRibbonPanelRemainsVisible:true,tabMouseHover:true,tabPenHover:true,touchHoverIgnored:true,tabClickStillWorks:true,disabledControlsVisible:true,pasteVisibleAndDisabled:true,formattingVisibleAndDisabled:true,pictureTabVisibleWithoutSelection:true,pictureCommandsDisabled:pictureCommands.length,firstItemFocusStyle};
      })()`);
      console.log(JSON.stringify(result));app.exit(0);
    }catch(error){console.error(error.stack||error);app.exit(1);}
  });
});
require('../gui/main');
