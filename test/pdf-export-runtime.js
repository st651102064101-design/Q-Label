'use strict';
// Electron runtime: the PDF writer produces real PDFs whose pages match the label size and page count.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {renderPdf}=require('../lib/export-pdf');
const RED_PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
const pageCount=pdf=>(Buffer.from(pdf).toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
const svg=label=>'<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" fill="#fff"/><text x="5" y="20" font-size="8">'+label+'</text></svg>';
app.on('window-all-closed',()=>{});// the hidden PDF window closes between renders
const timer=setTimeout(()=>app.exit(1),60000);
app.whenReady().then(async()=>{
  try{
    const tmpDir=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-pdf-'));
    const pdf=await renderPdf({BrowserWindow,tmpDir,dataUrl:RED_PNG,width_mm:100,height_mm:50,copies:3});
    const text=Buffer.from(pdf).toString('latin1');
    assert.ok(text.startsWith('%PDF-'),'starts with a PDF header');
    assert.equal(pageCount(pdf),3,'one PDF page per copy');
    const box=/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(text);
    assert.ok(box,'MediaBox present');
    assert.ok(Math.abs(Number(box[1])-100/25.4*72)<1.5,'width matches 100 mm: '+box[1]);
    assert.ok(Math.abs(Number(box[2])-50/25.4*72)<1.5,'height matches 50 mm: '+box[2]);
    assert.deepEqual(fs.readdirSync(tmpDir),[],'temporary HTML is removed');

    const vector=await renderPdf({BrowserWindow,tmpDir,svgPages:[svg('first'),svg('second')],width_mm:100,height_mm:50});
    assert.equal(pageCount(vector),2,'one PDF page per SVG page');
    await assert.rejects(()=>renderPdf({BrowserWindow,tmpDir,svgPages:['<svg><script>1</script></svg>'],width_mm:10,height_mm:10}),/active content/);
    assert.deepEqual(fs.readdirSync(tmpDir),[],'no temp files after vector or rejected renders');
    console.log('PASS pdf export',JSON.stringify({bytes:pdf.length,pages:3,vectorPages:2,width:box[1],height:box[2]}));
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});
