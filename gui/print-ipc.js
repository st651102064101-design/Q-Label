'use strict';
const { execFile } = require('child_process');
const fs = require('fs');
const {preparePrintJobAsync,cachePrintJob}=require('../lib/print-job');
module.exports=function createPrintRuntime({ipcMain,dialog,settings,printerNames,sendWindowsPrinterByName,sendNetwork,sendUSBWindows,sendUSBUnix,queryPrinter,serialStore}){
  const caches=new Map();let sending=false;
  const key=c=>JSON.stringify([c.type,c.printer||c.ip||c.usb||'',c.port||9100]);
  const runPS=command=>new Promise((resolve,reject)=>execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{windowsHide:true,timeout:12000},(err,out,stderr)=>err?reject(new Error(stderr?.trim()||err.message)):resolve(out.trim())));
  const escaped=value=>String(value||'').replace(/'/g,"''");
  async function send(connection,buffer){
    if(connection.type==='printer'){
      if(!connection.printer)throw Error('Select a printer.');
      let rawTarget;
      // Prefer RAW TCP for an IP printer. This bypasses a Windows queue that
      // may be in Error with stale jobs while the Zebra itself is reachable.
      try {
        const raw=await (queryPrinter||runPS)(`$p=Get-Printer -Name '${escaped(connection.printer)}' -ErrorAction Stop; $port=Get-PrinterPort -Name $p.PortName -ErrorAction Stop; [pscustomobject]@{host=$port.PrinterHostAddress;port=$port.PortNumber}|ConvertTo-Json -Compress`);
        const info=JSON.parse(raw); const host=String(info.host||'').trim();
        if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host))rawTarget={host,port:Number(info.port)||9100};
      } catch (_) { /* Port discovery failed; use the Windows RAW queue. */ }
      if(rawTarget){await sendNetwork(rawTarget.host,rawTarget.port,buffer,8000);return;}
      // A RAW submission can reach the printer before Windows reports a
      // spooler/cleanup error. Retrying an ambiguous result may print the same
      // job twice, so require an explicit user retry instead.
      try { await sendWindowsPrinterByName(connection.printer,buffer); }
      catch (error) { throw new Error(`Unable to send data to the printer: ${error.message}`); }
    }
    else if(connection.type==='ip'){if(!connection.ip)throw Error('Enter a printer IP address.');await sendNetwork(connection.ip,Number(connection.port)||9100,buffer);}
    else if(connection.type==='usb'){if(!connection.usb)throw Error('Enter a USB port.');await (process.platform==='win32'?sendUSBWindows:sendUSBUnix)(connection.usb,buffer);}
    else throw Error('Select a valid printer connection.');
  }
  async function clearCache(connection){await send(connection,Buffer.from('^XA^IDR:ZB*.GRF^FS^IDR:ZB*.ZPL^FS^XZ','ascii'));caches.delete(key(connection));return{ok:true};}
  function expired(cache,policy){if(!cache)return false;const intervals={daily:86400000,weekly:604800000,monthly:2592000000};return intervals[policy]&&Date.now()-cache.created>=intervals[policy];}
  async function print(payload){
    if(sending)throw Error('A print job is already being sent.');sending=true;
    let serialReservation=null,bytesSent=false;
    try{
      if(!payload.toFile)require('../lib/source-host-job').validateConnection(payload.connection,true);
      const job=await preparePrintJobAsync(payload,settings(),{serialStore,reserve:true});serialReservation=job.serialReservation;const c=payload.connection||{};
      if(payload.toFile){const result=await dialog.showSaveDialog({defaultPath:(job.template.name||'label')+'.zpl',filters:[{name:'Zebra printer commands',extensions:['zpl']}]});if(result.canceled){if(serialReservation)await serialStore.markFailed(serialReservation.jobId,{definitelyNotSent:true});serialReservation=null;return{ok:false,canceled:true};}fs.writeFileSync(result.filePath,job.zpl);if(serialReservation)await serialStore.markAccepted(serialReservation.jobId);serialReservation=null;return{ok:true,count:job.count,labels:job.labels,path:result.filePath,toFile:true};}
      if(payload.cancelJobs){if(c.type==='printer')await runPS(`$ErrorActionPreference='Stop'; Get-PrintJob -PrinterName '${escaped(c.printer)}' | Remove-PrintJob`);await send(c,Buffer.from('~JA','ascii'));}
      const cacheKey=key(c),perf=payload.performance||{};let cache=caches.get(cacheKey);
      if(expired(cache,perf.flushPolicy)){await clearCache(c);cache=null;}
      if((perf.graphicCache||perf.templateCache)&&perf.flushPolicy==='session'&&!cache?.flushed){await clearCache(c);cache={created:Date.now(),entries:new Map(),flushed:true};}
      if(!cache)cache={created:Date.now(),entries:new Map()};caches.set(cacheKey,cache);
      const encoded=cachePrintJob(job.zpl,cache.entries,{graphics:!!perf.graphicCache,templates:!!perf.templateCache,staticGraphics:!!perf.staticGraphics,staticObjects:!!perf.staticObjects});
      bytesSent=true;try{await send(c,encoded.zpl);}catch(error){caches.delete(cacheKey);throw error;}
      for(const entry of encoded.entries)cache.entries.set(entry.name,{name:entry.name,type:entry.type,bytes:entry.bytes});
      if(serialReservation)await serialStore.markAccepted(serialReservation.jobId);serialReservation=null;
      return{ok:true,count:job.count,labels:job.labels,bytes:encoded.zpl.length};
    }catch(error){if(serialReservation){if(bytesSent){await serialStore.markUnknown(serialReservation.jobId);throw Error('Print outcome is unknown for serialized job '+serialReservation.jobId+'. Reserved values will not be reused. '+error.message);}await serialStore.markFailed(serialReservation.jobId,{definitelyNotSent:true});}throw error;}finally{sending=false;}
  }
  ipcMain.handle('prepare-print-job',async(_e,payload)=>{try{const j=await preparePrintJobAsync(payload,settings(),{serialStore});return{ok:true,calibration:j.calibration,template:j.template,dataList:j.dataList,previewTemplates:j.previewTemplates,previewIndexes:j.previewIndexes,count:j.count,labels:j.labels,bytes:j.zpl.length,zpl:j.zpl.toString('ascii'),offsetX:j.offsetX,offsetY:j.offsetY};}catch(e){return{ok:false,error:e.message};}});
  ipcMain.handle('print-printer-info',async(_e,name)=>{try{const out=await runPS(`$ErrorActionPreference='Stop'; $taskPrinter=Get-Printer -Name '${escaped(name)}'; $taskJobs=@(Get-PrintJob -PrinterName '${escaped(name)}'); [pscustomobject]@{status=$taskPrinter.PrinterStatus.ToString();driver=$taskPrinter.DriverName;port=$taskPrinter.PortName;location=$taskPrinter.Location;comment=$taskPrinter.Comment;jobs=$taskJobs.Count}|ConvertTo-Json -Compress`);return{ok:true,...JSON.parse(out)};}catch(e){return{ok:false,error:e.message};}});
  ipcMain.handle('print-printer-properties',async(_e,{name,preferences})=>{if(!(await printerNames()).includes(name))return{ok:false,error:'Printer not installed.'};return new Promise(resolve=>{const child=execFile('rundll32.exe',['printui.dll,PrintUIEntry',preferences?'/e':'/p','/n',name],{windowsHide:false});child.once('spawn',()=>resolve({ok:true}));child.once('error',e=>resolve({ok:false,error:e.message}));});});
  ipcMain.handle('print-cache',async(_e,{connection,action,names})=>{try{
    if(action==='flush')return await clearCache(connection);
    const cache=caches.get(key(connection));
    if(action==='delete'){
      const selected=(names||[]).filter(name=>/^R:ZB[0-9A-F]{6}\.(GRF|ZPL)$/.test(name)&&cache?.entries.has(name));
      // Re-upload dependent formats after deleting graphics.
      if(selected.some(name=>name.endsWith('.GRF')))for(const e of cache.entries.values())if(e.type==='Format'&&!selected.includes(e.name))selected.push(e.name);
      if(selected.length){await send(connection,Buffer.from('^XA'+selected.map(name=>`^ID${name}^FS`).join('')+'^XZ','ascii'));for(const name of selected)cache.entries.delete(name);}
    }
    return{ok:true,entries:[...(cache?.entries.values()||[])]};
  }catch(e){return{ok:false,error:e.message};}});
  return{print};
};
