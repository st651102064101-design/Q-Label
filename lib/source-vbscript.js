'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{execFile}=require('node:child_process');
const literal=value=>'"'+String(value??'').replace(/"/g,'""').replace(/\r/g,'" & vbCr & "').replace(/\n/g,'" & vbLf & "')+'"';
async function executeScript({code='',event='',bindings={},fields={},value='',documentName=''}, {signal,timeoutMs=3000}={}){
  if(process.platform!=='win32')throw Error('VBScript requires Windows Script Host');
  if(typeof code!=='string'||code.length>100000)throw Error('Script exceeds the supported size');
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'qlabel-source-script-')),scriptFile=path.join(directory,'source.vbs'),output=path.join(directory,'result.txt'),errorFile=path.join(directory,'error.txt');
  const prelude=`Option Explicit
Class QlValue
  Public Value
End Class
Class QlBag
  Public Items
  Public Default Property Get Item(key)
    If Not Items.Exists(key) Then Err.Raise 5, "Q LABEL", "Unknown named source: " & key
    Set Item = Items(key)
  End Property
End Class
Class QlFormat
  Public Sources
  Public Name
  Public Property Get NamedSubStrings(key)
    Set NamedSubStrings = Sources(key)
  End Property
  Public Function GetNamedSubStringValue(key)
    GetNamedSubStringValue = Sources(key).Value
  End Function
  Public Sub SetNamedSubStringValue(key, text)
    Sources(key).Value = text
  End Sub
End Class
Dim qlNamed, qlFields, qlItem, qlBagObject, Format, Value, qlFileSystem, qlResult, qlErrorNumber, qlErrorDescription, qlErrorSource
Set qlNamed = CreateObject("Scripting.Dictionary")
qlNamed.CompareMode = 0
Set qlFields = CreateObject("Scripting.Dictionary")
${Object.entries(bindings).map(([key,val])=>`Set qlItem = New QlValue\nqlItem.Value = ${literal(val)}\nqlNamed.Add ${literal(key)}, qlItem`).join('\n')}
${Object.entries(fields).map(([key,val])=>`qlFields.Add ${literal(key)}, ${literal(val)}`).join('\n')}
Set qlBagObject = New QlBag
Set qlBagObject.Items = qlNamed
Set Format = New QlFormat
Set Format.Sources = qlBagObject
Format.Name = ${literal(documentName)}
Function NamedSubString(key)
  If Not qlNamed.Exists(key) Then Err.Raise 5, "Q LABEL", "Unknown named source: " & key
  NamedSubString = qlNamed(key).Value
End Function
Function Field(key)
  If Not qlFields.Exists(key) Then Err.Raise 5, "Q LABEL", "Unknown database field: " & key
  Field = qlFields(key)
End Function
Value = ${literal(value)}
`;
  const eventCall=event&&/^[A-Za-z][A-Za-z0-9_]*$/.test(event)&&new RegExp('(?:Sub|Function)\\s+'+event+'\\b','i').test(code)?'\nCall '+event+'\n':'';
  const wrapper=prelude+`\nOn Error Resume Next
ExecuteGlobal ${literal(code+eventCall)}
qlErrorNumber = Err.Number
qlErrorDescription = Err.Description
qlErrorSource = Err.Source
On Error GoTo 0
Set qlFileSystem = CreateObject("Scripting.FileSystemObject")
If qlErrorNumber <> 0 Then
  Set qlResult = qlFileSystem.CreateTextFile(${literal(errorFile)}, True, True)
  qlResult.Write CStr(qlErrorNumber) & ": " & qlErrorSource & ": " & qlErrorDescription
  qlResult.Close
  WScript.Quit 0
End If
Set qlResult = qlFileSystem.CreateTextFile(${literal(output)}, True, True)
qlResult.Write CStr(Value)
qlResult.Close
`;
  try{
    await fs.writeFile(scriptFile,Buffer.from('\ufeff'+wrapper,'utf16le'));
    const messages=await new Promise((resolve,reject)=>execFile(path.join(process.env.SystemRoot||'C:/Windows','System32','cscript.exe'),['//Nologo','//U',scriptFile],{windowsHide:true,encoding:'buffer',timeout:timeoutMs,maxBuffer:512*1024,signal},(error,stdout,stderr)=>{
      const message=Buffer.concat([stderr||Buffer.alloc(0),stdout||Buffer.alloc(0)]).toString('utf16le').trim();
      if(error)reject(Error(error.killed?'VBScript timed out':message||'VBScript failed: '+error.message));else resolve(message);
    }));
    const diagnostic=await fs.readFile(errorFile).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
    if(diagnostic)throw Error('VBScript: '+diagnostic.toString('utf16le').replace(/^\ufeff/,''));
    const content=await fs.readFile(output).catch(()=>{throw Error('VBScript did not return a value: '+messages);});return {value:content.toString('utf16le').replace(/^\ufeff/,''),diagnostics:[]};
  }finally{
    const resolved=path.resolve(directory),tempRoot=path.resolve(os.tmpdir())+path.sep;
    if(resolved.startsWith(tempRoot)&&path.basename(resolved).startsWith('qlabel-source-script-'))await fs.rm(resolved,{recursive:true,force:true});
  }
}
module.exports={executeScript};
