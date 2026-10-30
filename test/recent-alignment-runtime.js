const {app,BrowserWindow}=require('electron');
const assert=require('assert');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false});
 try{
  await w.loadFile(require('path').join(__dirname,'../gui/index.html'));
  const results=await w.webContents.executeJavaScript(`(()=>{
   const g=document.getElementById('recentObjectTools');
   document.body.append(g);
   g.style.boxSizing='border-box';
   g.innerHTML=Array.from({length:3},(_,i)=>'<button class="insert-tool"><svg viewBox="0 0 24 24"><path d="M1 1h22"/></svg><span>Object '+i+'</span></button>').join('');
   return [120,148,180].map(width=>{
    g.style.width=width+'px';
    const p=g.getBoundingClientRect(),b=[...g.children].map(x=>x.getBoundingClientRect()),svg=g.querySelector('svg').getBoundingClientRect();
    return {width,left:b[0].left-p.left,firstTop:b[0].top,secondTop:b[1].top,thirdTop:b[2].top,firstRight:b[0].right,secondLeft:b[1].left,secondRight:b[1].right,gridRight:p.right,svgWidth:svg.width,svgHeight:svg.height};
   });
  })()`);
  for(const r of results){
   assert.ok(r.left>=0&&r.left<15,JSON.stringify(r));
   assert.ok(Math.abs(r.firstTop-r.secondTop)<1,JSON.stringify(r));
   assert.ok(r.secondLeft>=r.firstRight&&r.secondRight<=r.gridRight+0.5,JSON.stringify(r));
   assert.ok(r.thirdTop>r.firstTop,JSON.stringify(r));
   assert.equal(r.svgWidth,20,JSON.stringify(r));assert.equal(r.svgHeight,20,JSON.stringify(r));
  }
  console.log('PASS recent two-column layout',JSON.stringify(results));app.exit(0);
 }catch(e){console.error(e);app.exit(1)}
});
setTimeout(()=>app.exit(1),30000);
