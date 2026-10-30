'use strict';
const {spawn}=require('node:child_process'),path=require('node:path');
const validText=value=>typeof value==='string'&&value.length>0&&value.length<=4096&&!value.includes('\0');
function run(payload,{signal}={}){
 if(process.platform!=='win32')return Promise.reject(Error('This database provider requires Windows.'));
 if(signal?.aborted)return Promise.reject(Error('Database request cancelled.'));
 return new Promise((resolve,reject)=>{
  const child=spawn(path.join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'../../scripts/windows-database.ps1')],{windowsHide:true,stdio:['pipe','pipe','pipe']});
  let output='',bytes=0,settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);if(error)reject(error);else resolve(value);};
  const abort=()=>{child.kill();finish(Error('Database request cancelled.'));};
  const timer=setTimeout(()=>{child.kill();finish(Error('Database request timed out.'));},60000);
  signal?.addEventListener('abort',abort,{once:true});
  child.on('error',()=>finish(Error('Could not start the Windows database provider.')));
  child.stdin.on('error',()=>{});
  child.stderr.on('data',()=>{}); // Driver diagnostics may contain credentials.
  child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{bytes+=Buffer.byteLength(chunk);if(bytes>32*1024*1024){child.kill();finish(Error('Database results exceed the supported size.'));}else output+=chunk;});
  child.on('close',()=>{if(settled)return;try{const result=JSON.parse(output.trim().replace(/^\uFEFF/,''));if(!result.ok)throw Error();finish(null,result.data);}catch{finish(Error('Could not connect to or read this database. Check its driver and connection settings.'));}});
  // Configuration is sent over stdin, never through the process command line.
  child.stdin.end(JSON.stringify(payload));
 });
}
async function inspectWindowsProviders(typeId,options){
 if(!['odbc','oledb'].includes(typeId))throw Error('Unknown Windows database provider.');
 return run({operation:'detect',typeId},options);
}
async function queryWindowsDatabase(payload,options){
 return run(payload,options);
}
async function readWindowsDatabase(typeId,config,options){
 if(!['odbc','oledb'].includes(typeId))throw Error('Unknown Windows database provider.');
 if(!config||typeof config!=='object'||Array.isArray(config))throw Error('Database connection settings are invalid.');
 if(typeId==='odbc'&&validText(config.server)){
  if(!validText(config.database))throw Error('Select or enter a database name.');
  if(!config.integratedSecurity&&!validText(config.userName))throw Error('Enter a database user name.');
 }else if(typeId==='odbc'&&!validText(config.dsn)&&!validText(config.fileDsn))throw Error('Select a DSN or File DSN.');
 if(typeId==='oledb'&&!config.udl&&(!validText(config.provider)||!/^[A-Za-z0-9_.-]{1,180}$/.test(config.provider)))throw Error('Choose an installed OLE DB provider.');
 if(typeId==='oledb'&&!config.udl&&!validText(config.dataSource))throw Error('Enter a database data source.');
 if(config.udl&&(!validText(config.udl)||!config.udl.toLowerCase().endsWith('.udl')))throw Error('Choose a UDL connection file.');
 for(const field of ['dsn','fileDsn','udl','provider','dataSource','database','server','driver','userName','password'])if(config[field]!=null&&(typeof config[field]!=='string'||config[field].length>4096||config[field].includes('\0')))throw Error('Database connection settings are invalid.');
 return run({operation:'read',typeId,config},options);
}
async function listSqlServerCatalog(config,options){
 if(!validText(config?.server))throw Error('Enter a server name.');
 return queryWindowsDatabase({operation:'databases',typeId:'odbc',config},options);
}
module.exports={inspectWindowsProviders,readWindowsDatabase,listSqlServerCatalog,queryWindowsDatabase};
