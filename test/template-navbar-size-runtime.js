'use strict';
const {app}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-navbar-size-')));
let runtimeContents=null;const timeout=setTimeout(async()=>{let stage='window unavailable';try{stage=await runtimeContents?.executeJavaScript('window.__templateRuntimeStage')||stage;}catch{}console.error('Navbar runtime timed out at '+stage);app.exit(1);},45000);
app.on('browser-window-created',(_event,win)=>{
  runtimeContents=win.webContents;
  const hide=()=>win.hide();win.on('show',hide);
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        window.__templateRuntimeStage='initializing';
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        hideProjectHome();autoSaveEnabled=false;
        const front={type:'text',x_mm:3,y_mm:5,width_mm:30,height_mm:5,text:'FRONT PAGE',font_size_pt:12},back={type:'text',x_mm:3,y_mm:5,width_mm:30,height_mm:5,text:'BACK PAGE',font_size_pt:12};
        editing={name:'Navbar test',width_mm:60,height_mm:40,dpi:203,elements:[front],values:{},template_pages:[{name:'Template 1',design:{elements:[front]}},{name:'Template 2',design:{elements:[back]}},{name:'Template 3',design:{elements:[front]}},{name:'Template 4',design:{elements:[back]}}],template_page_active:0};
        drawEditorCanvas();await new Promise(resolve=>setTimeout(resolve,100));
        const bar=document.querySelector('.template-page-bar'),tabs=[...bar.querySelectorAll('[role=tab]')],buttons=[...bar.querySelectorAll('button')];
        if(Math.abs(bar.getBoundingClientRect().height-67.2)>.15)throw Error('Filmstrip does not have its requested thumbnail height');
        if(getComputedStyle(bar).backgroundColor!=='rgba(255, 255, 255, 0.92)')throw Error('Filmstrip should use a light translucent background');
        if(tabs.length!==4||tabs.some(tab=>Math.abs(tab.getBoundingClientRect().width-89.6)>.15||Math.abs(tab.getBoundingClientRect().height-51.2)>.15))throw Error('Template thumbnail cards have incorrect dimensions');
        if(getComputedStyle(document.querySelector('.template-page-tabs')).overflowX!=='hidden'||getComputedStyle(document.querySelector('.template-page-tabs')).scrollbarWidth!=='none')throw Error('Filmstrip created a native scrollbar');
        if(getComputedStyle(document.querySelector('.preview-scrollbar.horizontal')).display!=='none'||getComputedStyle(document.querySelector('.preview-scrollbar-corner')).display!=='none')throw Error('Editor bottom scrollbar remained visible below the filmstrip');
        if(tabs.some(tab=>!tab.querySelector('.template-page-thumbnail svg')))throw Error('A template artwork preview is missing');
        if(tabs.map(tab=>tab.querySelector('.template-page-index')?.textContent).join(',')!=='1,2,3,4')throw Error('Template page numbers are missing');
        if(tabs[0].getAttribute('aria-selected')!=='true'||tabs[0].getAttribute('aria-label')!=='Template 1')throw Error('Active page selection or accessible name is incorrect');
        if(getComputedStyle(tabs[0]).boxShadow!=='none'||getComputedStyle(tabs[0]).borderLeftColor!=='rgb(22, 163, 74)')throw Error('Selected thumbnail must keep its green border without dark outer shadow rings');
        const plusButton=document.querySelector('.template-page-add-control>button:first-child'),addMenuButton=document.querySelector('.template-page-add-menu-button'),addControl=document.querySelector('.template-page-add-control');
        if(Math.abs(plusButton.getBoundingClientRect().width-57.6)>.15||Math.abs(addMenuButton.getBoundingClientRect().width-32)>.15||Math.abs(addControl.getBoundingClientRect().width-91.2)>.15||Math.abs(addControl.getBoundingClientRect().height-51.2)>.15)throw Error('Split add control has incorrect reference proportions');
        const compactWidth=bar.getBoundingClientRect().width;if(compactWidth>650)throw Error('Four-page filmstrip reserves unused horizontal space: '+compactWidth);
        if(document.documentElement.scrollWidth>document.documentElement.clientWidth)throw Error('Filmstrip creates a document-level horizontal scrollbar');
        const hoverTab=tabs[1],ellipsis=hoverTab.querySelector('.template-page-more');
        if(!ellipsis||hoverTab.getAttribute('aria-haspopup')!=='menu')throw Error('Page action ellipsis or its accessible menu relation is missing');
        addMenuButton.dispatchEvent(new MouseEvent('mouseenter'));
        if(document.querySelector('.template-page-menu').hidden||addMenuButton.getAttribute('aria-expanded')!=='true'||editing.template_pages.length!==4)throw Error('Hovering the caret should open its menu without adding a page');
        const addMenu=document.querySelector('.template-page-menu'),dropdownRect=addMenu.getBoundingClientRect(),addRect=addControl.getBoundingClientRect(),addBlank=[...addMenu.querySelectorAll('[role=menuitem]')].find(item=>item.textContent.includes('Add blank page')),duplicateBlank=[...addMenu.querySelectorAll('[role=menuitem]')].find(item=>item.textContent.includes('Duplicate current page'));
        if(!addBlank?.querySelector('svg path,svg rect,svg circle')||!duplicateBlank?.querySelector('svg path,svg rect,svg circle'))throw Error('Add blank page or Duplicate current page is missing its SVG artwork');
        if(dropdownRect.bottom>addRect.top+1||Math.abs(dropdownRect.right-addRect.right)>2)throw Error('Add menu should open above and align with the add control');
        for(let cycle=0;cycle<3;cycle++){
          addMenu.dispatchEvent(new MouseEvent('mouseleave',{relatedTarget:document.body}));
          addMenuButton.click();
          const reopened=addMenu.getBoundingClientRect();
          if(reopened.height<60||reopened.width<220||reopened.bottom>addRect.top+1||Math.abs(reopened.right-addRect.right)>2)throw Error('Reopened dropdown collapsed or moved beside its trigger: '+JSON.stringify(reopened.toJSON()));
          for(const item of addMenu.querySelectorAll('[role=menuitem]')){const itemRect=item.getBoundingClientRect();if(itemRect.top<reopened.top||itemRect.bottom>reopened.bottom)throw Error('Dropdown command was clipped');if(!item.contains(document.elementFromPoint((itemRect.left+itemRect.right)/2,(itemRect.top+itemRect.bottom)/2)))throw Error('Dropdown command is covered or cannot receive pointer input');}
        }
        addMenu.dispatchEvent(new MouseEvent('mouseleave',{relatedTarget:addMenuButton}));addMenuButton.dispatchEvent(new MouseEvent('mouseenter',{relatedTarget:addMenu}));
        if(addMenu.hidden||addMenuButton.getAttribute('aria-expanded')!=='true')throw Error('Moving from the dropdown back to its arrow should keep it open');
        const plus=addControl.querySelector('button:first-child');addMenuButton.dispatchEvent(new MouseEvent('mouseleave',{relatedTarget:plus}));plus.dispatchEvent(new MouseEvent('mouseenter',{relatedTarget:addMenuButton}));
        if(!addMenu.hidden||addMenuButton.getAttribute('aria-expanded')!=='false')throw Error('Moving from the arrow to the + button should close the dropdown immediately');
        addMenuButton.dispatchEvent(new MouseEvent('mouseenter'));if(addMenu.hidden)throw Error('Hovering the caret should reopen the dropdown');
        addMenuButton.dispatchEvent(new MouseEvent('mouseleave',{relatedTarget:document.body}));if(!addMenu.hidden)throw Error('Leaving the caret for outside space should close immediately');
        addMenuButton.dispatchEvent(new MouseEvent('mouseenter'));addMenuButton.dispatchEvent(new MouseEvent('mouseleave',{relatedTarget:addMenu}));addMenu.dispatchEvent(new MouseEvent('mouseenter',{relatedTarget:addMenuButton}));if(addMenu.hidden)throw Error('Moving from the caret into the menu should keep it open');
        addMenu.dispatchEvent(new MouseEvent('mouseleave',{relatedTarget:document.body}));if(!addMenu.hidden||addMenuButton.getAttribute('aria-expanded')!=='false')throw Error('Leaving the menu should close immediately');
        addMenuButton.dispatchEvent(new MouseEvent('mouseenter'));if(addMenu.hidden)throw Error('The add dropdown should reopen after hover exit');
        window.__templateRuntimeStage='opening context menu';
        tabs[0].dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:20,clientY:20}));
        const menu=document.querySelector('.template-page-menu'),duplicate=[...menu.querySelectorAll('[role=menuitem]')].find(item=>item.textContent.includes('Duplicate'));
        const actionMenuRect=menu.getBoundingClientRect(),pageRect=tabs[0].getBoundingClientRect();if(actionMenuRect.bottom>pageRect.top-7)throw Error('Page action menu overlaps the page card or its ellipsis trigger');
        if(actionMenuRect.height<150)throw Error('Page action menu collapsed after switching from the add dropdown');
        if(getComputedStyle(menu).overflowY!=='auto')throw Error('Page action menu should scroll when constrained above its trigger');
        if(!duplicate?.querySelector('kbd')||duplicate.querySelector('kbd').textContent!=='Ctrl+D')throw Error('Duplicate shortcut is not visible in the page menu');
        const shortcutEvent=new KeyboardEvent('keydown',{key:'d',code:'KeyD',ctrlKey:true,bubbles:true,cancelable:true});document.activeElement.dispatchEvent(shortcutEvent);await new Promise(resolve=>setTimeout(resolve,80));
        window.__templateRuntimeStage='after duplicate';
        if(!shortcutEvent.defaultPrevented||editing.template_pages.length!==5)throw Error('Ctrl+D did not duplicate the focused page');
        const pageTab=document.querySelector('.template-page-tabs [role=tab]');const deleteEvent=new KeyboardEvent('keydown',{key:'Delete',code:'Delete',bubbles:true,cancelable:true});pageTab.dispatchEvent(deleteEvent);await new Promise(resolve=>setTimeout(resolve,80));
        window.__templateRuntimeStage='after delete';
        if(!deleteEvent.defaultPrevented||editing.template_pages.length!==4)throw Error('Delete did not remove the focused page');
        const selectedTab=document.querySelector('.template-page-tabs [role=tab][aria-selected="true"]');selectedTab.classList.add('show-page-actions');const more=selectedTab.querySelector('.template-page-more'),moreIcon=more?.querySelector('svg');if(!more||!moreIcon||!selectedTab.classList.contains('show-page-actions'))throw Error('Selected page does not expose its ellipsis action');
        const moreRect=more.getBoundingClientRect(),iconRect=moreIcon.getBoundingClientRect();if(Math.abs((moreRect.left+moreRect.right-iconRect.left-iconRect.right)/2)>.5||Math.abs((moreRect.top+moreRect.bottom-iconRect.top-iconRect.bottom)/2)>.5)throw Error('Ellipsis icon is not centered in its button');
        const rect=bar.getBoundingClientRect();return {height:rect.height,tabs:tabs.length,compactWidth,addButtons:[...document.querySelectorAll('.template-page-add-control button')].map(button=>({text:button.textContent,width:getComputedStyle(button).width})),addMenuHoverOpens:true,addMenuOpensAbove:true,addMenuRightAligned:true,addMenuSvgIcons:true,thumbnailWidth:89.6,thumbnailHeight:51.2,pageNumbers:true,lightBackground:true,hoverEllipsis:true,ellipsisCentered:true,splitAddControl:true,nativeScrollbar:false,editorBottomScrollbarHidden:true,documentHorizontalOverflow:false,svgPreviews:tabs.every(tab=>!!tab.querySelector('.template-page-thumbnail svg')),menuHotkey:'Ctrl+D',keyboardDuplicate:true,keyboardDelete:true,x:rect.x,y:rect.y,width:rect.width};
      })()`);
      if(result.tabs!==4)throw Error('Four template tabs were not rendered');
      win.removeListener('show',hide);win.showInactive();await new Promise(resolve=>setTimeout(resolve,150));
      const shot=await win.webContents.capturePage({x:Math.max(0,Math.floor(result.x)-5),y:Math.floor(result.y)-5,width:Math.ceil(result.width)+10,height:98});
      fs.mkdirSync(path.join(__dirname,'..','test-results'),{recursive:true});fs.writeFileSync(path.join(__dirname,'..','test-results','template-navbar-size.png'),shot.toPNG());
      console.log('PASS '+JSON.stringify(result));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
