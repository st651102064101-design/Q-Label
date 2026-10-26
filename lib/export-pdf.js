'use strict';
// PDF export: the label raster (PNG) is placed on pages that match the label's physical size.
// Chromium embeds the PNG losslessly, so bars and text keep the printed dot structure.

const MAX_PAGES=500;

function validateSize(width_mm,height_mm){
  const w=Number(width_mm),h=Number(height_mm);
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>2000||h>2000)throw Error('PDF page size is invalid.');
  return {w,h};
}

function validateDataUrl(dataUrl){
  if(typeof dataUrl!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUrl))throw Error('PDF export needs a PNG image.');
  return dataUrl;
}

/** An SVG page produced by the renderer must be plain markup: no scripts, handlers or script URLs. */
function validateSvgPage(svg){
  if(typeof svg!=='string'||!/^<svg[\s>]/.test(svg)||svg.length>40*1024*1024)throw Error('PDF export needs SVG pages.');
  if(/<script|<foreignObject|javascript:|\son[a-z]+\s*=/i.test(svg))throw Error('PDF page contains active content.');
  return svg;
}

/** HTML document with `copies` identical pages (PNG) or one page per SVG string, sized in mm. */
function buildPdfHtml({dataUrl,svgPages,width_mm,height_mm,copies=1}){
  const {w,h}=validateSize(width_mm,height_mm);
  const count=Math.max(1,Math.min(MAX_PAGES,Math.round(Number(copies)||1)));
  let pages;
  if(Array.isArray(svgPages)){
    if(!svgPages.length||svgPages.length>MAX_PAGES)throw Error('PDF page count must be between 1 and '+MAX_PAGES+'.');
    pages=svgPages.map(svg=>'<section>'+validateSvgPage(svg)+'</section>').join('');
  }else{
    const url=validateDataUrl(dataUrl);
    pages=('<section><img alt="" src="'+url+'"></section>').repeat(count);
  }
  return '<!doctype html><html><head><meta charset="utf-8"><style>'
    +`@page{size:${w}mm ${h}mm;margin:0}`
    +'html,body{margin:0;padding:0;background:#fff}'
    +`section{width:${w}mm;height:${h}mm;overflow:hidden;break-after:page;page-break-after:always}`
    +'section:last-child{break-after:auto;page-break-after:auto}'
    +'img,section>svg{display:block;width:100%;height:100%}img{image-rendering:auto}'
    +'</style></head><body>'+pages+'</body></html>';
}

/** Chromium page size option for printToPDF, in inches. */
function pdfOptions({width_mm,height_mm}){
  const {w,h}=validateSize(width_mm,height_mm);
  return {pageSize:{width:w/25.4,height:h/25.4},margins:{marginType:'none'},printBackground:true,preferCSSPageSize:true,landscape:false};
}

const fs=require('fs');
const path=require('path');

/** Load the page HTML in a hidden sandboxed window and return the PDF bytes. BrowserWindow is injected so this module stays testable. */
async function renderPdf({BrowserWindow,tmpDir,dataUrl,svgPages,width_mm,height_mm,copies=1}){
  const html=buildPdfHtml({dataUrl,svgPages,width_mm,height_mm,copies});
  const tmp=path.join(tmpDir,'qlabel-pdf-'+process.pid+'-'+Date.now()+'.html');
  fs.writeFileSync(tmp,html,'utf8');
  const win=new BrowserWindow({show:false,width:800,height:600,webPreferences:{sandbox:true,contextIsolation:true,javascript:false,backgroundThrottling:false}});
  try{
    await win.loadFile(tmp);
    return await win.webContents.printToPDF(pdfOptions({width_mm,height_mm}));
  }finally{
    if(!win.isDestroyed())win.destroy();
    try{fs.unlinkSync(tmp);}catch{/* temp file already removed */}
  }
}

module.exports={renderPdf,buildPdfHtml,validateSvgPage,pdfOptions,validateSize,validateDataUrl,MAX_PAGES};
