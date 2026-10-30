param(
 [Parameter(Mandatory=$true)][string]$SourceDirectory,
 [Parameter(Mandatory=$true)][string]$OutputDirectory,
 [string]$InteropPath='D:/Programs/Interop.BarTender.dll',
 [int]$Limit=0,
 [switch]$Resume
)
$ErrorActionPreference='Stop'
# Conversion-time tooling only. Never edit originals or attach to a user's instance.
$sourceRoot=(Resolve-Path -LiteralPath $SourceDirectory).Path
$outputRoot=[IO.Path]::GetFullPath($OutputDirectory)
if($sourceRoot.TrimEnd('\','/') -eq $outputRoot.TrimEnd('\','/')){throw 'Output must be separate from original templates'}
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
Add-Type -ReferencedAssemblies $InteropPath -TypeDefinition @'
using System; using System.IO; using System.Text; using System.Runtime.InteropServices;
public static class QLabelObjectExport {
 static BarTender.IBtApplication app;
 public static void Shutdown(){if(app!=null){try{app.Quit(BarTender.BtSaveOptions.btDoNotSaveChanges);}finally{Marshal.ReleaseComObject(app);app=null;}}}
 public static int Export(string copy,string output){
  if(app==null)app=(BarTender.IBtApplication)new BarTender.ApplicationClass();
  BarTender.IBtFormat format=null;
  try{
   format=(BarTender.IBtFormat)app.Formats.Open(copy,false,"");
   int expected=format.Objects.Count,index=0;
   var xml=new StringBuilder();xml.Append("<NativeObjects Units=\"mm\" Count=\"").Append(expected).AppendLine("\">");
   foreach(object raw in format.Objects){
    var obj=(BarTender.IBtDesignObject)raw;
    try{
     xml.Append("<Object Index=\"").Append(index).Append("\" Name=\"").Append(System.Security.SecurityElement.Escape(obj.Name)).Append("\" Type=\"").Append(obj.Type).AppendLine("\">");
     try{xml.AppendLine(obj.GetXML(true,true,BarTender.BtUnits.btUnitsMillimeters));}
     catch(Exception error){xml.Append("<ExportError Stage=\"xml\" Message=\"").Append(System.Security.SecurityElement.Escape(error.Message)).AppendLine("\"/>");}
     if(obj.Type==BarTender.BtObjectType.btObjectPicture){
      string asset="picture-"+index+".png";
      try{
       obj.ExportToFile(Path.Combine(output,asset),"PNG",BarTender.BtColors.btColors32Bit,BarTender.BtResolution.btResolutionPrinter,BarTender.BtSaveOptions.btDoNotSaveChanges);
       xml.Append("<ExportedPicture File=\"").Append(asset).AppendLine("\"/>");
      }catch(Exception error){xml.Append("<ExportError Stage=\"picture\" Message=\"").Append(System.Security.SecurityElement.Escape(error.Message)).AppendLine("\"/>");}
     }
     xml.AppendLine("</Object>");index++;
    }finally{Marshal.ReleaseComObject(obj);}
   }
   xml.AppendLine("</NativeObjects>");
   if(index!=expected)throw new Exception("Native object enumeration count mismatch");
   File.WriteAllText(Path.Combine(output,"objects.xml"),xml.ToString());
   BarTender.Messages messages;
   string request="<XMLScript Version=\"2.0\"><Command><GetFormatProperties IncludeObjectDataSources=\"*\"><Format>"+System.Security.SecurityElement.Escape(copy)+"</Format></GetFormatProperties></Command></XMLScript>";
   File.WriteAllText(Path.Combine(output,"format.xml"),app.XMLScript(request,BarTender.BtXMLSourceType.btXMLScriptString,out messages));
   string objectRequest="<XMLScript Version=\"2.0\"><Command><GetAllObjects Query=\"All\"><Format>"+System.Security.SecurityElement.Escape(copy)+"</Format></GetAllObjects></Command></XMLScript>";
   File.WriteAllText(Path.Combine(output,"objects-btxml.xml"),app.XMLScript(objectRequest,BarTender.BtXMLSourceType.btXMLScriptString,out messages));
   string sourceRequest="<XMLScript Version=\"2.0\" Trusted=\"true\"><Command><GetDataSources Type=\"All\" Query=\"All\"><Format>"+System.Security.SecurityElement.Escape(copy)+"</Format></GetDataSources></Command></XMLScript>";
   File.WriteAllText(Path.Combine(output,"data-sources.xml"),app.XMLScript(sourceRequest,BarTender.BtXMLSourceType.btXMLScriptString,out messages));
   File.WriteAllText(Path.Combine(output,"prompt.xml"),format.ExportPromptToXML(""));
   return expected;
  }finally{if(format!=null){try{format.Close(BarTender.BtSaveOptions.btDoNotSaveChanges);}finally{Marshal.ReleaseComObject(format);}}}
 }
}
'@
$files=@(Get-ChildItem -LiteralPath $sourceRoot -Filter '*.btw' -File | Sort-Object Name)
if($Limit -gt 0){$files=@($files | Select-Object -First $Limit)}
$rows=@();$index=0
if($Resume -and (Test-Path -LiteralPath (Join-Path $outputRoot 'inventory.json'))){
 $prior=Get-Content -LiteralPath (Join-Path $outputRoot 'inventory.json') -Raw | ConvertFrom-Json
 $identity=(Get-FileHash -LiteralPath $InteropPath -Algorithm SHA256).Hash.ToLowerInvariant()
 if($prior.interopSha256 -ne $identity){throw 'Cannot resume an export from a different native Interop build'}
 $rows=@($prior.records)
}
try{
 foreach($file in $files){
  $index++;$sha=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  if($Resume -and @($rows | Where-Object {$_.sha256 -eq $sha -and $_.status -eq 'exported'}).Count -gt 0){continue}
  $rows=@($rows | Where-Object {$_.source -ne $file.FullName})
  $dir=Join-Path $outputRoot $sha
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $copy=Join-Path $dir 'conversion-input.btw'
  Copy-Item -LiteralPath $file.FullName -Destination $copy
  try{
   $count=[QLabelObjectExport]::Export($copy,$dir)
   $formatXml=[xml][IO.File]::ReadAllText((Join-Path $dir 'format.xml'))
   if($formatXml.SelectNodes("//*[@Severity='Error' or @Severity='Fatal']").Count -gt 0){throw 'Native format export reported errors; inspect format.xml'}
   $rows+=@{source=$file.FullName;sha256=$sha;directory=$dir;nativeObjectCount=$count;status='exported';reconstructionComplete=$false}
  }catch{$rows+=@{source=$file.FullName;sha256=$sha;directory=$dir;status='failed';error=$_.Exception.Message;reconstructionComplete=$false}}
  $report=@{interopPath=$InteropPath;interopSha256=(Get-FileHash -LiteralPath $InteropPath -Algorithm SHA256).Hash.ToLowerInvariant();records=$rows}
  $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $outputRoot 'inventory.json') -Encoding UTF8
  Write-Output ('Exported '+$index+'/'+$files.Count+' '+$file.Name)
 }
}finally{[QLabelObjectExport]::Shutdown()}
