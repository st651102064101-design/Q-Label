$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$latest = Get-ChildItem -LiteralPath $root -Directory | Where-Object { $_.Name -match '^dist-abss-v(\d+)$' } | Sort-Object { [int]($_.Name -replace '^dist-abss-v','') } -Descending | Select-Object -First 1
if (-not $latest) { throw 'No packaged ABSS ZebraBar version was found.' }
$exe = Join-Path $latest.FullName 'ABSS ZebraBar-win32-x64\ABSS ZebraBar.exe'
if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { throw "The latest ABSS ZebraBar executable is missing: $exe" }
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'ABSS ZebraBar.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exe
$shortcut.WorkingDirectory = Split-Path -Parent $exe
$shortcut.IconLocation = "$exe,0"
$shortcut.Description = 'Open the latest ABSS ZebraBar build'
$shortcut.Save()
Get-Process -Name 'ABSS ZebraBar' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Start-Process -FilePath $exe -WorkingDirectory (Split-Path -Parent $exe)
Write-Output "Desktop shortcut updated: $shortcutPath"
Write-Output "Opened latest build $($latest.Name)."
