const {app,BrowserWindow}=require('electron');
const grid=require('../gui/design-grid');

app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:320,height:240,webPreferences:{sandbox:true,contextIsolation:true}});
  try{
    await win.loadURL('about:blank');
    const markup=grid.render({show:true,width:10,height:10,pitch:2,shape:'rounded',radius:3,id:'rounded-runtime-grid'});
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('viewBox','0 0 10 10');svg.setAttribute('width','200');svg.setAttribute('height','200');svg.innerHTML=${JSON.stringify(markup)};
      const image=new Image(),source=new XMLSerializer().serializeToString(svg);image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source);await image.decode();
      const canvas=document.createElement('canvas');canvas.width=200;canvas.height=200;const context=canvas.getContext('2d');context.drawImage(image,0,0,200,200);
      return{outsideCornerAlpha:context.getImageData(1,1,1,1).data[3],insidePaperDotAlpha:context.getImageData(80,80,1,1).data[3]};
    })()`);
    if(result.outsideCornerAlpha!==0)throw new Error('Grid dot escaped the rounded paper corner: '+JSON.stringify(result));
    if(result.insidePaperDotAlpha===0)throw new Error('Grid dot inside the paper disappeared: '+JSON.stringify(result));
    console.log(JSON.stringify({roundedGridClip:'pass',...result}));
    app.exit(0);
  }catch(error){console.error(error.stack||error);app.exit(1);}
});
