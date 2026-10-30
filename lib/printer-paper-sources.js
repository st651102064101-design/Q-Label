'use strict';
const {execFile}=require('node:child_process');
function readPaperSources(printerName){
  const name=String(printerName||'').trim();
  if(!name)return Promise.reject(new Error('Select a printer first.'));
  if(process.platform!=='win32')return Promise.reject(new Error('Printer paper sources require Windows.'));
  const script="Add-Type -AssemblyName System.Drawing; $s=New-Object System.Drawing.Printing.PrinterSettings; $s.PrinterName=[Environment]::GetEnvironmentVariable('QLABEL_SOURCE_PRINTER'); if(-not $s.IsValid){throw 'The selected printer is not available.'}; $items=@($s.PaperSources | ForEach-Object { [pscustomobject]@{name=$_.SourceName;id=$_.RawKind} }); ConvertTo-Json -InputObject $items -Compress";
  return new Promise((resolve,reject)=>execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:12000,env:{...process.env,QLABEL_SOURCE_PRINTER:name}},(error,stdout,stderr)=>{
    if(error)return reject(new Error(String(stderr||error.message).trim()));
    try{const rows=JSON.parse(stdout.replace(/^\uFEFF/,'').trim()||'[]');resolve((Array.isArray(rows)?rows:[rows]).filter(row=>Number.isInteger(row.id)&&typeof row.name==='string').map(row=>({id:row.id,name:row.name.trim()})));}catch(error){reject(new Error('Could not read printer paper sources: '+error.message));}
  }));
}
module.exports={readPaperSources};
