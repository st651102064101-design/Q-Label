$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$antennaRoot=Join-Path $PSScriptRoot '../gui/assets/rfid'
New-Item -ItemType Directory -Force -Path $antennaRoot | Out-Null
$antennaExe='D:/Programs/BarTend.exe'
if((Get-FileHash $antennaExe).Hash.ToLowerInvariant() -ne '0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3'){throw 'Unverified BarTender artifact'}
$antennaSources=@(@{id='generic';name='Generic Transponder';path=$antennaExe;offset=19670336;length=3416})
$antennaSources+=@(Get-ChildItem 'C:/ProgramData/Seagull/BarTender/Stocks/RFID/Antennas/*.ss.emf' | Sort-Object Name | ForEach-Object {@{id=($_.BaseName -replace '\.ss$','' -replace '[^a-zA-Z0-9]+','-').Trim('-').ToLowerInvariant();name=$_.BaseName -replace '\.ss$','';path=$_.FullName;offset=0;length=$_.Length}})
$antennaManifest=@()
foreach($antennaSource in $antennaSources){
 $antennaBytes=[IO.File]::ReadAllBytes($antennaSource.path)
 $antennaPart=[byte[]]$antennaBytes[$antennaSource.offset..($antennaSource.offset+$antennaSource.length-1)]
 $antennaStream=[IO.MemoryStream]::new($antennaPart)
 $antennaMetafile=[Drawing.Imaging.Metafile]::new($antennaStream)
 try{
  $antennaWidth=([BitConverter]::ToInt32($antennaPart,32)-[BitConverter]::ToInt32($antennaPart,24))/100.0
  $antennaHeight=([BitConverter]::ToInt32($antennaPart,36)-[BitConverter]::ToInt32($antennaPart,28))/100.0
  if($antennaWidth -le 0 -or $antennaHeight -le 0){throw 'Invalid EMF physical frame'}
  $antennaScale=768.0/[Math]::Max($antennaWidth,$antennaHeight)
  $antennaBitmap=[Drawing.Bitmap]::new([Math]::Max(1,[int]($antennaWidth*$antennaScale)),[Math]::Max(1,[int]($antennaHeight*$antennaScale)))
  $antennaGraphics=[Drawing.Graphics]::FromImage($antennaBitmap)
  try{$antennaGraphics.Clear([Drawing.Color]::Transparent);$antennaGraphics.SmoothingMode='AntiAlias';$antennaGraphics.DrawImage($antennaMetafile,[Drawing.Rectangle]::new(0,0,$antennaBitmap.Width,$antennaBitmap.Height));$antennaTarget=Join-Path $antennaRoot ($antennaSource.id+'.png');$antennaBitmap.Save($antennaTarget,[Drawing.Imaging.ImageFormat]::Png)}finally{$antennaGraphics.Dispose();$antennaBitmap.Dispose()}
  $antennaHash=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($antennaPart)).ToLowerInvariant()
  $antennaManifest+=@{id=$antennaSource.id;name=$antennaSource.name;src='assets/rfid/'+$antennaSource.id+'.png';width_mm=$antennaWidth;height_mm=$antennaHeight;source_path=$antennaSource.path;source_offset=$antennaSource.offset;source_bytes=$antennaPart.Length;source_sha256=$antennaHash;png_sha256=(Get-FileHash $antennaTarget).Hash.ToLowerInvariant();builtin=$true}
 }finally{$antennaMetafile.Dispose();$antennaStream.Dispose()}
}
$antennaJson=ConvertTo-Json -InputObject @($antennaManifest) -Depth 5
[IO.File]::WriteAllText((Join-Path $antennaRoot 'catalog.json'),$antennaJson)
[IO.File]::WriteAllText((Join-Path $PSScriptRoot '../gui/stock-antenna-catalog.js'),"'use strict';`n(function(root){const catalog="+$antennaJson+";if(typeof module==='object'&&module.exports)module.exports=catalog;else root.StockAntennaCatalog=catalog;})(typeof window==='undefined'?globalThis:window);`n")
Write-Output ('Exported '+$antennaManifest.Count+' source-bound antenna images')
