const {app,screen}=require('electron'),fs=require('fs'),os=require('os'),path=require('path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-drag-'));app.setPath('appData',dir);
app.on('browser-window-created',(_,win)=>{win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{try{await new Promise(r=>setTimeout(r,2200));win.show();win.focus();console.log('DISPLAY',JSON.stringify(screen.getDisplayMatching(win.getBounds())));const result=await win.webContents.executeJavaScript(`(async()=>{
window.hideProjectHome();editing={name:'Performance',width_mm:150,height_mm:100,dpi:203,margin_mm:{left:0,top:0},elements:Array.from({length:30},(_,i)=>({type:'box',x_mm:5+(i%6)*20,y_mm:5+Math.floor(i/6)*15,width_mm:10,height_mm:8,thickness_mm:.3})),values:{}};editorGrid.snap=false;editorSelection=new Set([0]);editorSel=0;drawEditorCanvas();
const rect=liveOverlay().querySelector('[data-hit="0"]').getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
const original=drawEditorCanvas;let rebuilds=0;drawEditorCanvas=(...args)=>{rebuilds++;return original(...args)};
startDrag(new PointerEvent('pointerdown',{clientX:x,clientY:y,button:0,pointerId:1}),0,'move');
const intervals=[],work=[];let last=null;for(let i=0;i<300;i++){const t=await new Promise(requestAnimationFrame);if(last!==null&&i>30)intervals.push(t-last);last=t;const began=performance.now();window.dispatchEvent(new PointerEvent('pointermove',{clientX:x+Math.sin(i/25)*100,clientY:y+Math.cos(i/31)*70,buttons:1,pointerId:1}));work.push(performance.now()-began);}
await new Promise(requestAnimationFrame);const during=rebuilds;window.dispatchEvent(new PointerEvent('pointerup',{clientX:x+40,clientY:y+30,button:0,pointerId:1}));drawEditorCanvas=original;
const sorted=intervals.sort((a,b)=>a-b);return {frames:intervals.length,medianMs:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.floor(sorted.length*.95)],averageHz:1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length),maxDispatchMs:Math.max(...work),rebuildsDuringDrag:during,finalX:editing.elements[0].x_mm};})()`);console.log('RESULT',JSON.stringify(result));fs.writeFileSync(path.join(__dirname,'drag-performance-result.json'),JSON.stringify(result,null,2));app.exit(result.rebuildsDuringDrag===0&&result.medianMs<8.6?0:1);}catch(e){console.error(e);app.exit(1);}});});try {
  for (const dependency of ['../lib/printer-media-profile','../gui/print-ipc']) require(dependency);
  require('../gui/main');
} catch (error) {
  console.error('Performance test startup failed:', error.stack);
  app.exit(1);
}

