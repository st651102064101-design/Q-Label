'use strict';

const {execFile}=require('node:child_process');

const DEFAULT_FONT_FAMILIES=Object.freeze([
  'Arial','Arial Unicode MS','Cambria','Cambria Math','Segoe UI Emoji','Segoe UI Historic',
  'Segoe UI Symbol','Symbol','Webdings','Wingdings','Wingdings 2','Wingdings 3'
]);
const WINDOWS_FONT_QUERY=[
  '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)',
  'Add-Type -AssemblyName System.Drawing',
  '$fontCollection = New-Object System.Drawing.Text.InstalledFontCollection',
  'try { $fontCollection.Families | ForEach-Object { $_.Name } } finally { $fontCollection.Dispose() }'
].join('; ');
const familyOrder=new Intl.Collator('en',{numeric:true,sensitivity:'base'});

function normalizeFontFamilies(values){
  const unique=new Map();
  for(const value of Array.isArray(values)?values:[]){
    if(typeof value!=='string')continue;
    const family=value.trim();
    if(!family||/[\r\n\u0000-\u001f]/.test(family))continue;
    const key=family.toLocaleLowerCase('en-US');
    if(!unique.has(key))unique.set(key,family);
  }
  return [...unique.values()].sort(familyOrder.compare);
}

function runWindowsFontQuery(execFileImpl=execFile){
  return new Promise((resolve,reject)=>execFileImpl(
    'powershell.exe',
    ['-NoProfile','-NonInteractive','-Command',WINDOWS_FONT_QUERY],
    {windowsHide:true,timeout:15000,maxBuffer:1024*1024,encoding:'utf8'},
    (error,stdout)=>error?reject(error):resolve(stdout)
  ));
}

async function getInstalledFontFamilies({platform=process.platform,runPowerShell=runWindowsFontQuery,fallbackFamilies=DEFAULT_FONT_FAMILIES}={}){
  const fallback=normalizeFontFamilies(fallbackFamilies);
  if(platform!=='win32')return fallback;
  try{
    const discovered=normalizeFontFamilies(String(await runPowerShell()).split(/\r?\n/));
    return discovered.length?normalizeFontFamilies([...fallback,...discovered]):fallback;
  }catch(_){return fallback;}
}

module.exports={DEFAULT_FONT_FAMILIES,getInstalledFontFamilies,normalizeFontFamilies,runWindowsFontQuery};
