'use strict';
const assert=require('assert');
const net=require('net');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {preparePrintJob,cachePrintJob}=require('../lib/print-job');
const {sendNetwork}=require('../lib/print');
const template={name:'Print-test',dpi:203,width_mm:50,height_mm:30,elements:[{type:'text',x_mm:2,y_mm:2,height_mm:3,text:'{{serial}} / {{name}}'}]};
const payload={template,data:{serial:'1',name:'Alpha'},connection:{type:'ip',ip:'127.0.0.1'},copies:2,serialization:{enabled:true,field:'serial',start:7,step:2,count:3},performance:{variableData:true},offsetX:1,offsetY:0};
async function main(){
  const job=preparePrintJob(payload);assert.strictEqual(job.count,6);assert.deepStrictEqual(job.dataList.map(d=>d.serial),['7','7','9','9','11','11']);
  assert.strictEqual((job.zpl.toString().match(/\^PQ2/g)||[]).length,3);assert.match(job.zpl.toString(),/\^LS-8/);assert.match(job.zpl.toString(),/7 \/ Alpha/);assert.strictEqual(template.elements[0].text,'{{serial}} / {{name}}');
  assert.throws(()=>preparePrintJob({...payload,copies:1.5}),/whole number/);assert.throws(()=>preparePrintJob({...payload,copies:10000}),/10,000/);assert.throws(()=>preparePrintJob({...payload,offsetY:50}),/offset exceeds/);
  const records=preparePrintJob({...payload,serialization:null,copies:1,rows:[{name:'One'},{name:'Two'}]});assert.deepStrictEqual(records.dataList.map(d=>d.name),['One','Two']);
  const graphic=Buffer.from('^XA\n^FO10,10^GFA,1,1,1,FF^FS\n^PQ2\n^XZ');const first=cachePrintJob(graphic,new Map(),{graphics:true,templates:true});assert.match(first.zpl.toString(),/~DGR:ZB/);assert.match(first.zpl.toString(),/\^DFR:ZB/);assert.match(first.zpl.toString(),/\^PQ2/);
  const known=new Map(first.entries.map(e=>[e.name,e]));const second=cachePrintJob(graphic,known,{graphics:true,templates:true});assert(!second.zpl.toString().includes('~DG'));assert(!second.zpl.toString().includes('^DF'));assert.match(second.zpl.toString(),/\^XF/);assert.strictEqual(known.size,2);
  const temporary=cachePrintJob(graphic,new Map(),{staticGraphics:true,staticObjects:true});assert.match(temporary.zpl.toString(),/\^IDR:ZB/);assert.strictEqual(temporary.entries.length,0);
  const handlers=new Map(),sent=[];const output=path.join(os.tmpdir(),'zebrabar-print-test-'+process.pid+'.zpl');const runtime=require('../gui/print-ipc')({ipcMain:{handle:(n,f)=>handlers.set(n,f)},dialog:{showSaveDialog:async()=>({filePath:output,canceled:false})},settings:()=>({}),printerNames:async()=>[],sendNetwork:async(_ip,_port,buffer)=>sent.push(buffer),sendWindowsPrinterByName:async()=>{},sendUSBWindows:async()=>{},sendUSBUnix:async()=>{}});
  const result=await runtime.print(payload);assert.strictEqual(result.count,6);assert.match(sent[0].toString(),/\^PQ2/);const file=await runtime.print({...payload,toFile:true,performance:{graphicCache:true}});assert(file.toFile);assert.strictEqual(sent.length,1);assert(fs.readFileSync(output).equals(job.zpl));fs.unlinkSync(output);
  const prepared=await handlers.get('prepare-print-job')(null,payload);assert(prepared.ok);assert.strictEqual(prepared.count,6);
  const server=net.createServer();const received=new Promise(resolve=>server.once('connection',socket=>{const chunks=[];socket.on('data',b=>chunks.push(b));socket.on('end',()=>resolve(Buffer.concat(chunks)));}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));await sendNetwork('127.0.0.1',server.address().port,job.zpl);assert((await received).equals(job.zpl));await new Promise(resolve=>server.close(resolve));
  console.log('Print job checks passed: serialization, copies, records, offsets, cache lifecycle, file export, IPC preparation and TCP transport.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
