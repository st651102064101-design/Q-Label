param(
  [Parameter(Mandatory)][string]$ArtifactPath,
  [Parameter(Mandatory)][ValidateRange(1,2147483647)][int]$NativeRva,
  [Parameter(Mandatory)][string]$WorkDirectory,
  [string]$GhidraHome = 'D:/QLabel-agent-work/tools/ghidra-12.1.4/ghidra_12.1.4_PUBLIC',
  [string]$JavaHome = 'D:/QLabel-agent-work/tools/temurin-21/jdk-21.0.12.1+1'
)
$ErrorActionPreference = 'Stop'
if (Test-Path -LiteralPath $WorkDirectory) { throw 'Use a new work directory to preserve earlier evidence.' }
$artifact = (Resolve-Path -LiteralPath $ArtifactPath).Path
$stream = [IO.File]::OpenRead($artifact)
$pe = [Reflection.PortableExecutable.PEReader]::new($stream)
try {
  if ($pe.PEHeaders.CoffHeader.Machine.ToString() -ne 'Amd64') { throw 'This fallback only supports AMD64 PE targets.' }
  $md = [Reflection.Metadata.PEReaderExtensions]::GetMetadataReader($pe)
  $native = @($md.MethodDefinitions | ForEach-Object {
    $method = $md.GetMethodDefinition($_)
    if ($method.RelativeVirtualAddress -eq $NativeRva -and (([int]$method.ImplAttributes -band 3) -eq 1)) {
      [pscustomobject]@{ name = $md.GetString($method.Name); token = ('0x{0:x8}' -f [Reflection.Metadata.Ecma335.MetadataTokens]::GetToken([Reflection.Metadata.EntityHandle]$_)) }
    }
  })
  if (!$native.Count) { throw 'RVA is not a metadata-declared native method.' }
  $section = @($pe.PEHeaders.SectionHeaders | Where-Object {
    $NativeRva -ge $_.VirtualAddress -and $NativeRva -lt ($_.VirtualAddress + $_.SizeOfRawData) -and
    (([int]$_.SectionCharacteristics -band 0x20000000) -ne 0)
  })
  if ($section.Count -ne 1) { throw 'Native RVA must map to one file-backed executable section.' }
  $base = [long]$pe.PEHeaders.PEHeader.ImageBase
  New-Item -ItemType Directory -Path $WorkDirectory | Out-Null
  $sectionPath = Join-Path $WorkDirectory 'native-section.bin'
  $bytes = [byte[]]::new($section[0].SizeOfRawData)
  $stream.Position = $section[0].PointerToRawData
  $stream.ReadExactly($bytes)
  [IO.File]::WriteAllBytes($sectionPath, $bytes)
  $mapping = [ordered]@{
    provider = 'external-ghidra-section-fallback'; artifact = $artifact
    sha256 = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
    sectionSha256 = (Get-FileHash -LiteralPath $sectionPath -Algorithm SHA256).Hash.ToLowerInvariant()
    methods = $native; nativeRva = $NativeRva; imageBase = $base
    section = $section[0].Name; sectionRva = $section[0].VirtualAddress
    fileOffset = $section[0].PointerToRawData; bytes = $bytes.Length
    limitation = 'Only original executable section bytes mapped; imports, globals, other sections and managed bodies are unresolved. Not whole-program parity.'
  }
  $mapping | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $WorkDirectory 'mapping.json')
} finally { $pe.Dispose(); $stream.Dispose() }
$oldJava = $env:JAVA_HOME
try {
  $env:JAVA_HOME = $JavaHome
  $report = Join-Path $WorkDirectory 'native-method.json'
  & (Join-Path $GhidraHome 'support/analyzeHeadless.bat') $WorkDirectory NativeSection `
    -import $sectionPath -loader BinaryLoader -loader-baseAddr ('0x{0:x}' -f ($base + $section[0].VirtualAddress)) `
    -processor x86:LE:64:default -cspec windows -noanalysis -scriptPath $PSScriptRoot `
    -postScript InspectNativeMethod.java ('0x{0:x}' -f ($base + $NativeRva)) $report absolute `
    *> (Join-Path $WorkDirectory 'ghidra.log')
  if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $report)) { throw 'Ghidra did not create a report; inspect ghidra.log.' }
  $result = Get-Content -LiteralPath $report -Raw | ConvertFrom-Json
  if (!$result.decompileCompleted -or !$result.code) { throw 'Native decompilation failed; inspect report.' }
  $result
} finally { $env:JAVA_HOME = $oldJava }
