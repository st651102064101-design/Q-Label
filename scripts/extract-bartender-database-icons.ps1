param(
  [string]$SourceDll = 'D:\Programs\Seagull.Data.Configuration.dll',
  [string]$OutDir = (Join-Path $PSScriptRoot '..\gui\assets\database-types')
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
Add-Type -AssemblyName System.Windows.Forms | Out-Null
$asm = [Reflection.Assembly]::LoadFrom($SourceDll)
$stream = $asm.GetManifestResourceStream('Seagull.Data.Configuration.g.resources')
if (-not $stream) { throw 'Missing g.resources stream' }
$readerType = [Type]::GetType('System.Resources.ResourceReader, mscorlib')
$reader = [Activator]::CreateInstance($readerType, $stream)
$enum = $reader.GetEnumerator()
$map = @{
  'text'='TextFileLogo32.png'
  'xml'='XMLLogo32.png'
  'builder'='DataBuilderLogo32.png'
  'excel'='ExcelLogo32.png'
  'online'='ExcelOnlineLogo32.png'
  'access'='AccessLogo32.png'
  'sqlserver'='SqlServerLogo32.png'
  'oracle'='OracleLogo32.png'
  'json'='jsonLogo32.png'
  'firebird'='FirebirdLogo32.png'
  'db2'='IBMLogo32.png'
  'informix'='IBMLogo32.png'
  'google-sheets'='GoogleSheetsLogo32.png'
  'azure-sql'='AzureLogo32.png'
  'mysql'='MySQLLogo32.png'
  'mariadb'='MariaDB32.png'
  'postgresql'='PostgreSQLLogo32.png'
  'quickbooks-online'='QuickBooksOnlineLogo32.png'
  'sap-idoc'='SapGeneric32.png'
  'sap-hana'='SAP_HANA32.png'
  'oledb'='OLEDBLogo32.png'
  'odbc'='ODBCLogo32.png'
  'import'='Import32.png'
}
$byName = @{}
while ($enum.MoveNext()) {
  $key = [string]$enum.Key
  if ($key -notmatch 'resources/images/([^/]+\.png)$') { continue }
  $file = $Matches[1].ToLowerInvariant()
  $value = $enum.Value
  if ($value -is [byte[]]) {
    $byName[$file] = $value
  } elseif ($value -is [IO.Stream]) {
    $ms = New-Object IO.MemoryStream
    $value.CopyTo($ms)
    $byName[$file] = $ms.ToArray()
  }
}
$mapLower = @{}
foreach ($entry in $map.GetEnumerator()) { $mapLower[$entry.Key] = $entry.Value.ToLowerInvariant() }
foreach ($entry in $mapLower.GetEnumerator()) {
  $bytes = $byName[$entry.Value]
  if (-not $bytes) { Write-Warning "Missing $($entry.Value)"; continue }
  $target = Join-Path $OutDir ($entry.Key + '.png')
  [IO.File]::WriteAllBytes($target, $bytes)
  Write-Output "Wrote $target"
}
$reader.Close()
$stream.Close()
