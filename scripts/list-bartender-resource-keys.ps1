$asm = [Reflection.Assembly]::LoadFrom('D:\Programs\Seagull.Data.Configuration.dll')
$stream = $asm.GetManifestResourceStream('Seagull.Data.Configuration.g.resources')
$readerType = [Type]::GetType('System.Resources.ResourceReader, mscorlib')
$reader = [Activator]::CreateInstance($readerType, $stream)
$enum = $reader.GetEnumerator()
while ($enum.MoveNext()) {
  $key = [string]$enum.Key
  if ($key -match 'Images/') { Write-Output $key }
}
$reader.Close(); $stream.Close()
