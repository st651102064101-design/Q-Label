$asm = [Reflection.Assembly]::LoadFrom('D:\Programs\Seagull.Data.Configuration.dll')
$stream = $asm.GetManifestResourceStream('Seagull.Data.Configuration.g.resources')
$readerType = [Type]::GetType('System.Resources.ResourceReader, mscorlib')
$reader = [Activator]::CreateInstance($readerType, $stream)
$enum = $reader.GetEnumerator()
while ($enum.MoveNext()) {
  $key = [string]$enum.Key
  if ($key -ne 'resources/images/textfilelogo32.png') { continue }
  $value = $enum.Value
  Write-Output "Key=$key Type=$($value.GetType().FullName)"
  if ($value -is [byte[]]) { Write-Output "Bytes=$($value.Length)"; break }
  if ($value -is [IO.Stream]) {
    $ms = New-Object IO.MemoryStream
    $value.CopyTo($ms)
    Write-Output "StreamBytes=$($ms.Length)"
    break
  }
  $prop = $value.GetType().GetProperty('Stream')
  if ($prop) {
    $inner = $prop.GetValue($value)
    Write-Output "InnerType=$($inner.GetType().FullName)"
  }
  break
}
$reader.Close(); $stream.Close()
