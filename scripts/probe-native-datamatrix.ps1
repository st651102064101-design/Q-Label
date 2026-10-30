param(
 [string]$Source='D:/QLabelNativeLibraryAudit-20261023/library-templates/A4A Label.btw',
 [string]$OutputDirectory='D:/QLabelNativeLibraryFinish-20261026/datamatrix'
)
$ErrorActionPreference='Stop'
$taskOutput=[IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $taskOutput | Out-Null
# Owned conversion-time app and disposable document copies only. No printing.
Add-Type -ReferencedAssemblies @('D:/Programs/Interop.BarTender.dll','System.Xml') -TypeDefinition @'
using System;using System.IO;using System.Text;using System.Xml;using System.Globalization;using System.Runtime.InteropServices;
public static class NativeDataMatrixProbe {
 static void Val(StringBuilder log,string key,object value){log.AppendLine(key+"="+Convert.ToString(value,CultureInfo.InvariantCulture));}
 public static void Run(string source,string root){var app=(BarTender.IBtApplication)new BarTender.ApplicationClass();var log=new StringBuilder();
 try{Val(log,"OwnedProcessId",app.ProcessId);
  foreach(string mode in new[]{"original","width4","width8","width24","width40","cage-short","cage-long","form-cage","form-serial"}){
   BarTender.IBtFormat f=null;BarTender.IBtDesignObject barcode=null;
   try{string copy=Path.Combine(root,mode+".btw");File.Copy(source,copy,true);f=(BarTender.IBtFormat)app.Formats.Open(copy,false,"");f.MeasurementUnits=BarTender.BtUnits.btUnitsMillimeters;f.EnablePrompting=false;
    log.AppendLine("CASE="+mode);Val(log,"Printer",f.Printer);Val(log,"PromptValuesBefore",f.PromptValues);
    barcode=(BarTender.IBtDesignObject)f.Objects.Find("Barcode 1");
    var xml=new XmlDocument();xml.LoadXml(barcode.GetXML(true,true,BarTender.BtUnits.btUnitsMillimeters));
    if(mode.StartsWith("width")){double width=double.Parse(mode.Substring(5),CultureInfo.InvariantCulture);xml.DocumentElement.SetAttribute("AutoSizeTargetBarCodeWidth",width.ToString("F4",CultureInfo.InvariantCulture)+" mm");barcode.SetXML(xml.OuterXml);}
    if(mode=="cage-short")f.SetNamedSubStringValue("CAGE","A");
    if(mode=="cage-long")f.SetNamedSubStringValue("CAGE","ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    if(mode=="form-cage")f.SetPrompt("Text Input Box 1","QZ9R4");
    if(mode=="form-serial")f.SetPrompt("Text Input Box 2","EDIT9876");
    Val(log,"Value",barcode.Value);Val(log,"PromptValuesAfter",f.PromptValues);
    barcode.ExportToFile(Path.Combine(root,mode+"-barcode.png"),"PNG",BarTender.BtColors.btColors32Bit,BarTender.BtResolution.btResolutionPrinter,BarTender.BtSaveOptions.btDoNotSaveChanges);
    f.ExportToFile(Path.Combine(root,mode+"-label.png"),"PNG",BarTender.BtColors.btColors32Bit,BarTender.BtResolution.btResolutionScreen,BarTender.BtSaveOptions.btDoNotSaveChanges);
    File.WriteAllText(Path.Combine(root,mode+"-barcode.xml"),barcode.GetXML(true,true,BarTender.BtUnits.btUnitsMillimeters));
    var objects=new StringBuilder("<Objects>");foreach(object raw in f.Objects){var o=(BarTender.IBtDesignObject)raw;try{objects.AppendLine(o.GetXML(true,true,BarTender.BtUnits.btUnitsMillimeters));}finally{Marshal.ReleaseComObject(o);}}objects.AppendLine("</Objects>");File.WriteAllText(Path.Combine(root,mode+"-objects.xml"),objects.ToString());
   }finally{if(barcode!=null)Marshal.ReleaseComObject(barcode);if(f!=null){f.Close(BarTender.BtSaveOptions.btDoNotSaveChanges);Marshal.ReleaseComObject(f);}}
  }
 }finally{File.WriteAllText(Path.Combine(root,"results.txt"),log.ToString());app.Quit(BarTender.BtSaveOptions.btDoNotSaveChanges);Marshal.ReleaseComObject(app);}
 }
}
'@
[NativeDataMatrixProbe]::Run((Resolve-Path -LiteralPath $Source).Path,$taskOutput)
Get-FileHash -LiteralPath $Source -Algorithm SHA256
Get-ChildItem -LiteralPath $taskOutput -Filter '*-barcode.png' | Select-Object Name,Length
