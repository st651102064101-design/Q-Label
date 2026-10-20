param(
  [Parameter(Mandatory)][string]$ArtifactPath,
  [Parameter(Mandatory)][string]$NamePattern,
  [Parameter(Mandatory)][string]$OutputPath,
  [ValidateRange(1,1000)][int]$Limit = 100
)
$ErrorActionPreference = 'Stop'
# Read-only metadata parsing: never Assembly.Load or execute the target.
$artifact = (Resolve-Path -LiteralPath $ArtifactPath).Path
$digest = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
$stream = [IO.File]::OpenRead($artifact)
$pe = [Reflection.PortableExecutable.PEReader]::new($stream)
try {
  $md = [Reflection.Metadata.PEReaderExtensions]::GetMetadataReader($pe)
  $rows = [Collections.Generic.List[object]]::new()
  $matchedCount = 0
  foreach ($typeHandle in $md.TypeDefinitions) {
    $type = $md.GetTypeDefinition($typeHandle)
    $typeName = $md.GetString($type.Name)
    $namespace = $md.GetString($type.Namespace)
    foreach ($methodHandle in $type.GetMethods()) {
      $method = $md.GetMethodDefinition($methodHandle)
      $name = $md.GetString($method.Name)
      if ("$namespace.$typeName::$name" -notmatch $NamePattern) { continue }
      $matchedCount++
      if ($rows.Count -ge $Limit) { continue }
      $codeType = [int]$method.ImplAttributes -band 3
      $rows.Add([ordered]@{
        type = $typeName; namespace = $namespace; method = $name
        token = ('0x{0:x8}' -f [Reflection.Metadata.Ecma335.MetadataTokens]::GetToken([Reflection.Metadata.EntityHandle]$methodHandle))
        rva = $method.RelativeVirtualAddress
        codeType = @('IL','Native','OPTIL','Runtime')[$codeType]
        implementationFlags = [int]$method.ImplAttributes
      })
    }
  }
  $report = [ordered]@{
    provider = 'external-System.Reflection.Metadata'; artifact = $artifact; sha256 = $digest
    moduleId = $md.GetGuid($md.GetModuleDefinition().Mvid).ToString()
    metadataBytes = $pe.GetMetadata().Length
    totalTypes = $md.TypeDefinitions.Count; totalMethods = $md.MethodDefinitions.Count
    pattern = $NamePattern; limit = $Limit; matches = $matchedCount
    truncated = $matchedCount -gt $rows.Count; methods = $rows.ToArray()
    limitations = @('Metadata and native RVA mapping only; no method bodies decompiled.', 'Does not change the REA managed representation budget.')
  }
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding utf8
  [pscustomobject]@{ output = $OutputPath; totalTypes = $report.totalTypes; totalMethods = $report.totalMethods; matches = $matchedCount; returned = $rows.Count }
} finally { $pe.Dispose(); $stream.Dispose() }
