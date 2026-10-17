'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Model=require('../gui/source-model'),Engine=require('../gui/data-source-engine'),ObjectData=require('../gui/object-data');
const {preparePrintJob}=require('../lib/print-job');
function fixture(){return Model.migrate({name:'sources',dpi:203,width_mm:70,height_mm:40,elements:[{type:'text',text:'42',x_mm:2,y_mm:2,width_mm:2,height_mm:3},{type:'barcode128',text:'42',x_mm:2,y_mm:9,module_width:2,bar_height_mm:10,show_text:false}]});}
test('character template changes printed barcode HRI while preserving the encoded bars',()=>{
  const doc=fixture();doc.elements=doc.elements.slice(1);const barcode=doc.elements[0];barcode.show_text=true;barcode.text='123456';
  const id=barcode.dataSourceRefs[0];doc.sourceDefinitions[id].config.value='123456';
  const before=preparePrintJob({template:doc}).zpl.toString();doc.sourceDefinitions[id].transforms=[{kind:'character-template',pattern:'???-???'}];
  const after=preparePrintJob({template:doc}).zpl.toString();
  assert.equal(after.match(/\^GFA[^\^]+/)[0],before.match(/\^GFA[^\^]+/)[0]);assert.ok(after.includes('^FD123-456^FS'));
});
test('SVG preview uses transformed HRI without changing barcode bars',()=>{
  const fs=require('node:fs'),{JSDOM}=require('jsdom'),dom=new JSDOM('<body></body>',{runScripts:'dangerously'}),w=dom.window;
  w.ObjectData=ObjectData;w.Barcode=require('../gui/barcode');w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:value=>({width:String(value).length*6,actualBoundingBoxAscent:8,actualBoundingBoxDescent:2})});
  w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));const doc=fixture();doc.elements=doc.elements.slice(1);const barcode=doc.elements[0];barcode.show_text=true;
  const id=barcode.dataSourceRefs[0];doc.sourceDefinitions[id].config.value='123456';doc.sourceDefinitions[id].transforms=[{kind:'character-template',pattern:'???-???'}];
  const markup=w.LabelPreview.renderPreviewSVG(doc,Engine.resolve(doc),null,{}),svg=new w.DOMParser().parseFromString(markup,'image/svg+xml');assert.equal(svg.querySelector('[data-barcode-hri] text').textContent,'123-456');dom.window.close();
});
test('source data containing ZPL command characters reaches print without deletion or command injection',()=>{
  const doc=fixture();doc.elements=doc.elements.slice(0,1);const element=doc.elements[0],value='LOT^XA~JS\\01ก';doc.sourceDefinitions[element.dataSourceRefs[0]].config.value=value;
  const zpl=preparePrintJob({template:doc}).zpl.toString(),match=zpl.match(/\^FH\\\^FD([^]*?)\^FS/);assert.ok(match,'special data uses hexadecimal field encoding');
  const bytes=[];for(let index=0;index<match[1].length;index++){if(match[1][index]==='\\'){bytes.push(parseInt(match[1].slice(index+1,index+3),16));index+=2;}else bytes.push(match[1].charCodeAt(index));}
  assert.equal(Buffer.from(bytes).toString('utf8'),value);assert.ok(zpl.includes('^CI28'));assert.equal((zpl.match(/\^XA/g)||[]).length,1);
});
test('pending or failed catalog sources cannot display or print stale saved artwork',()=>{
  const doc=Model.migrate({name:'pending',width_mm:60,height_mm:30,dpi:203,elements:[{type:'image',barcode_spec:{bcid:'code128',text:'OLD'},width_mm:30,height_mm:10,bitmap_width:8,bitmap_height:1,bitmap_hex:'ff'}]}),element=doc.elements[0],id=element.dataSourceRefs[0];
  doc.sourceDefinitions[id].config.value='NEW';const data=Engine.resolve(doc);
  assert.notEqual(ObjectData.artwork(element,data).bitmap_hex,'ff');assert.equal(element.bitmap_hex,'ff');
  assert.throws(()=>preparePrintJob({template:doc}),/artwork|prepared/i);
});
test('native QR and Data Matrix prepare matrices from the original binary bytes',async()=>{
  for(const type of ['qrcode','datamatrix']){
    const doc=Model.migrate({width_mm:50,height_mm:30,dpi:203,elements:[{type,text:'binary',width_mm:20,magnification:5}]}),element=doc.elements[0],id=element.dataSourceRefs[0];
    doc.sourceDefinitions[id]={id,kind:'embedded',config:{value:'00ff1d'},dataType:{kind:'binary',encoding:'hex'}};
    const inputs=await require('../lib/source-adapters').collectInputs(doc,{mode:'preview'}),data=Engine.resolve(doc,{},inputs),matrix=data['$qlabel.sources'].objects[element.id].matrix;
    assert.ok(matrix,type+' provides a prepared matrix');
    if(type==='qrcode'){const expected=require('qrcode').create([{data:Buffer.from([0,255,29]),mode:'byte'}],{errorCorrectionLevel:'M'}).modules;assert.equal(matrix.width,expected.size);assert.deepEqual(matrix.data,Array.from(expected.data));}
    else{const expected=require('bwip-js').raw({bcid:'datamatrix',text:'\x00\xff\x1d',binarytext:true,scale:1,padding:0,paddingwidth:0,paddingheight:0,includetext:false})[0];assert.equal(matrix.width,expected.pixx);assert.deepEqual(matrix.data,Array.from(expected.pixs));}
    const job=await require('../lib/print-job').preparePrintJobAsync({template:doc}),graphic=job.zpl.toString().match(/\^GFA,(\d+),(\d+),(\d+),([0-9A-F]+)/),side=Math.round(20*203/25.4),stride=Math.ceil(side/8),expectedBytes=Buffer.alloc(stride*side);
    for(let y=0;y<side;y++)for(let x=0;x<side;x++){const row=type==='qrcode'?Math.ceil((y+1)*matrix.height/side)-1:Math.floor(y*matrix.height/side),column=type==='qrcode'?Math.ceil((x+1)*matrix.width/side)-1:Math.floor(x*matrix.width/side);if(matrix.data[row*matrix.width+column])expectedBytes[y*stride+(x>>3)]|=0x80>>(x&7);}
    assert.equal(graphic[4],expectedBytes.toString('hex').toUpperCase(),type+' prints the original byte matrix');
    const fs=require('node:fs'),{JSDOM}=require('jsdom'),dom=new JSDOM('<body></body>',{runScripts:'dangerously'}),w=dom.window;w.ObjectData=ObjectData;w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
    const svg=new w.DOMParser().parseFromString('<svg>'+w.LabelPreview.renderElement(element,203,data,{})+'</svg>','image/svg+xml');
    assert.equal(svg.querySelectorAll('rect[fill="#111"]').length,matrix.data.filter(Boolean).length,type+' preview renders the same matrix');
    const canvasBytes=Buffer.alloc(stride*side),ctx={fillStyle:'',fillRect(x,y,width,height){if(this.fillStyle!=='#111')return;for(let row=Math.max(0,y);row<Math.min(side,y+height);row++)for(let column=Math.max(0,x);column<Math.min(side,x+width);column++)canvasBytes[row*stride+(column>>3)]|=0x80>>(column&7);},strokeRect(){throw Error('Prepared matrix must not use a placeholder');}};
    w.HTMLCanvasElement.prototype.getContext=()=>ctx;w.LabelPreview.rasterizeCanvas(doc,data,null,{});assert.deepEqual(canvasBytes,expectedBytes,type+' canvas pixels equal the printed graphic');dom.window.close();
  }
});
test('shared evaluator drives both object preview values and print data with transforms once',()=>{
  const doc=fixture();for(const element of doc.elements){const id=element.dataSourceRefs[0];doc.sourceDefinitions[id].transforms=[{kind:'prefix-suffix',prefix:'LOT-'}];}
  const data=Engine.resolve(doc,{},{});assert.equal(ObjectData.resolve(doc.elements[0],data),'LOT-42');
  assert.equal(ObjectData.resolve(doc.elements[1],JSON.parse(JSON.stringify(data)),true),'LOT-42');
  const job=preparePrintJob({template:doc,connection:{type:'tcp',host:'127.0.0.1'}},{});
  assert.equal(ObjectData.resolve(doc.elements[0],job.dataList[0],true),'LOT-42');
  assert.ok(job.zpl.toString().includes('^FDLOT-42^FS'));
});
test('strict print rejects unresolved versioned data before generating output and preview exposes errors',()=>{
  const doc=fixture(),id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id].kind='file';doc.sourceDefinitions[id].config={path:'unprepared'};
  const data=Engine.resolve(doc,{},{});assert.equal(ObjectData.resolve(doc.elements[0],data),'');
  assert.throws(()=>ObjectData.resolve(doc.elements[0],data,true),/prepared/i);
  assert.throws(()=>preparePrintJob({template:doc,connection:{type:'tcp',host:'127.0.0.1'}},{}),/prepared/i);
});
test('async print preparation reads external source and emits its current text',async()=>{
  const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{preparePrintJobAsync}=require('../lib/print-job');
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-print-')),file=path.join(dir,'data.txt');
  try{await fs.writeFile(file,'EXTERNAL');const doc=fixture();doc.elements=doc.elements.slice(0,1);const id=doc.elements[0].dataSourceRefs[0];doc.sourceDefinitions[id]={id,kind:'file',config:{path:file,encoding:'utf-8'}};
    const job=await preparePrintJobAsync({template:doc,connection:{type:'tcp',host:'127.0.0.1'}},{});assert.ok(job.zpl.toString().includes('^FDEXTERNAL^FS'));
  }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(dir,{recursive:true,force:true});}
});
