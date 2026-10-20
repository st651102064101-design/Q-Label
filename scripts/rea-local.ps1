param([Parameter(ValueFromRemainingArguments = $true)][string[]]$ReaArgs)
$ErrorActionPreference = 'Stop'
# Launch a fresh pinned REA process when the connected MCP has stale environment.
# Uses existing installations only; never installs or modifies the target.
$ghidraPath = 'D:/QLabel-agent-work/tools/ghidra-12.1.4/ghidra_12.1.4_PUBLIC'
$jdkPath = 'D:/QLabel-agent-work/tools/temurin-21/jdk-21.0.12.1+1'
if (!(Test-Path -LiteralPath "$ghidraPath/Ghidra/application.properties")) { throw 'Existing Ghidra installation not found; check the project-local Ghidra path in this launcher.' }
if (!(Test-Path -LiteralPath "$jdkPath/bin/java.exe")) { throw 'Existing JDK not found; check the project-local JDK path in this launcher.' }
$cacheRoots = @('D:/QLabel-agent-work/npm-cache/_npx', "$env:LOCALAPPDATA/npm-cache/_npx")
if ($env:npm_config_cache) { $cacheRoots += "$env:npm_config_cache/_npx" }
$cliPath = $null
foreach ($cacheRoot in $cacheRoots) {
  if (!(Test-Path -LiteralPath $cacheRoot)) { continue }
  foreach ($entry in Get-ChildItem -LiteralPath $cacheRoot -Directory) {
    $packagePath = Join-Path $entry.FullName 'node_modules/rea-agents'
    $manifestPath = Join-Path $packagePath 'package.json'
    if (!(Test-Path -LiteralPath $manifestPath)) { continue }
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($manifest.name -eq 'rea-agents' -and $manifest.version -eq '6.7.0') {
      $candidate = Join-Path $packagePath 'scripts/rea.mjs'
      if (Test-Path -LiteralPath $candidate) { $cliPath = $candidate; break }
    }
  }
  if ($cliPath) { break }
}
if (!$cliPath) { throw 'Pinned REA 6.7.0 is not cached. Use the documented approved installation route.' }
$nodePath = (Get-Command node -CommandType Application | Select-Object -First 1).Source
$previousGhidra = $env:GHIDRA_INSTALL_DIR
$previousJava = $env:JAVA_HOME
try {
  $env:GHIDRA_INSTALL_DIR = $ghidraPath
  $env:JAVA_HOME = $jdkPath
  if (!$ReaArgs) { $ReaArgs = @('--help') }
  & $nodePath $cliPath @ReaArgs
  $reaExitCode = $LASTEXITCODE
} finally {
  $env:GHIDRA_INSTALL_DIR = $previousGhidra
  $env:JAVA_HOME = $previousJava
}
exit $reaExitCode
