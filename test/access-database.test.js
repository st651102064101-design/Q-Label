const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFile}=require('node:child_process');
const {readAccess}=require('../lib/access-database');
test('Access connector reads an actual generated Access database using installed ACE',{skip:process.platform!=='win32',timeout:60000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zebrabar-access-')),file=path.join(dir,'sample.accdb'),script=path.join(dir,'create.ps1');
 fs.writeFileSync(script,`param([string]$DatabasePath)
$ErrorActionPreference='Stop'
$taskCatalog=New-Object -ComObject ADOX.Catalog
$taskCatalog.Create('Provider=Microsoft.ACE.OLEDB.16.0;Data Source='+$DatabasePath)
$taskDatabase=$taskCatalog.ActiveConnection
$taskDatabase.Execute('CREATE TABLE Products (sku VARCHAR(10), product VARCHAR(40), price INTEGER)')|Out-Null
$taskDatabase.Execute("INSERT INTO Products VALUES ('001','Tea',10)")|Out-Null
$taskDatabase.Execute("INSERT INTO Products VALUES ('002','Coffee',20)")|Out-Null
$taskDatabase.Close()
[Runtime.InteropServices.Marshal]::FinalReleaseComObject($taskCatalog)|Out-Null
`);
 try{await new Promise((resolve,reject)=>execFile(path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',script,'-DatabasePath',file],{windowsHide:true,timeout:20000},(error,out,stderr)=>error?reject(Error(stderr)):resolve()));const tables=await readAccess(file);assert.equal(tables.length,1);assert.equal(tables[0].name,'Products');assert.equal(tables[0].rows[0].sku,'001');assert.equal(tables[0].rows[1].product,'Coffee');assert.equal(tables[0].rows[1].price,'20');}finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});}
});
test('Access connector rejects unsupported files and missing database',async()=>{await assert.rejects(readAccess('not-a-database.txt'),/mdb/);if(process.platform==='win32')await assert.rejects(readAccess(path.join(os.tmpdir(),'zebrabar-does-not-exist.accdb')));});
