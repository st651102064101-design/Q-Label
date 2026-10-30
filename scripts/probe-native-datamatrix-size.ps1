param([string]$OutputDirectory='D:/QLabelNativeLibraryFinish-20261026/datamatrix-size')
$ErrorActionPreference='Stop'
New-Item -ItemType Directory -Path $OutputDirectory -Force|Out-Null
Add-Type -ReferencedAssemblies @('D:/Programs/Interop.BarTender.dll','System.Xml') -TypeDefinition @'
using System;using System.IO;using System.Xml;using System.Text;using System.Globalization;using System.Runtime.InteropServices;
public static class NativeDMSizeProbe {
 public static void Run(string root){var app=(BarTender.IBtApplication)new BarTender.ApplicationClass();BarTender.IBtFormat f=null;BarTender.IBtDesignObject o=null;var csv=new StringBuilder("mode,input_mm,target_mm,width_mm,height_mm,index,mils,x_mm\r\n");
 try{var copy=Path.Combine(root,"size-input.btw");File.Copy("D:/QLabelNativeLibraryAudit-20261023/library-templates/A4A Label.btw",copy,true);f=(BarTender.IBtFormat)app.Formats.Open(copy,false,"");f.MeasurementUnits=BarTender.BtUnits.btUnitsMillimeters;f.EnablePrompting=false;o=(BarTender.IBtDesignObject)f.Objects.Find("Barcode 1");string original=o.GetXML(true,true,BarTender.BtUnits.btUnitsMillimeters);
 foreach(string mode in new[]{"original","serial-long","cage-long"})for(int i=0;i<=636;i++){
  double target=1+i*.25;var xml=new XmlDocument();xml.LoadXml(original);xml.DocumentElement.SetAttribute("AutoSizeTargetBarCodeWidth",target.ToString("F4",CultureInfo.InvariantCulture)+" mm");o.SetXML(xml.OuterXml);
  if(mode=="serial-long")f.SetNamedSubStringValue("SER","EDIT9876");
  if(mode=="cage-long")f.SetNamedSubStringValue("CAGE","ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
  o.ExportToFile(Path.Combine(root,"last-sample.png"),"PNG",BarTender.BtColors.btColors32Bit,BarTender.BtResolution.btResolutionScreen,BarTender.BtSaveOptions.btDoNotSaveChanges);
  xml.LoadXml(o.GetXML(true,true,BarTender.BtUnits.btUnitsMillimeters));var el=xml.DocumentElement;var x=(XmlElement)el.SelectSingleNode("XDimension");
  csv.AppendLine(mode+","+target.ToString("R",CultureInfo.InvariantCulture)+","+el.GetAttribute("AutoSizeTargetBarCodeWidth").Replace(" mm","")+","+el.GetAttribute("Width").Replace(" mm","")+","+el.GetAttribute("Height").Replace(" mm","")+","+x.GetAttribute("Index")+","+x.GetAttribute("Mils")+","+x.GetAttribute("Millimeters"));
 }
 }finally{File.WriteAllText(Path.Combine(root,"native-size-table.csv"),csv.ToString());if(o!=null)Marshal.ReleaseComObject(o);if(f!=null){f.Close(BarTender.BtSaveOptions.btDoNotSaveChanges);Marshal.ReleaseComObject(f);}app.Quit(BarTender.BtSaveOptions.btDoNotSaveChanges);Marshal.ReleaseComObject(app);}
 }
}
'@
[NativeDMSizeProbe]::Run([IO.Path]::GetFullPath($OutputDirectory))
Get-Item -LiteralPath (Join-Path $OutputDirectory 'native-size-table.csv') | Select-Object FullName,Length
