param([Parameter(Mandatory=$true)][string]$DatabasePath)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false)
try {
  Add-Type -AssemblyName System.Data
  $taskConnection=$null
  foreach($taskProvider in @('Microsoft.ACE.OLEDB.16.0','Microsoft.ACE.OLEDB.12.0')) {
    try { $taskBuilder=New-Object System.Data.OleDb.OleDbConnectionStringBuilder; $taskBuilder.Provider=$taskProvider; $taskBuilder['Data Source']=$DatabasePath;$taskBuilder['Mode']='Read';  $taskConnection=New-Object -TypeName System.Data.OleDb.OleDbConnection -ArgumentList $taskBuilder.ConnectionString; $taskConnection.Open(); break } catch { $taskLastError=$_.Exception.Message; if($taskConnection){$taskConnection.Dispose();$taskConnection=$null} }
  }
  if(!$taskConnection){throw ('Could not open Access database. Install the Microsoft Access Database Engine (64 bit) and verify the database is not password protected. '+$taskLastError)}
  $taskSchema=$taskConnection.GetSchema('Tables')
  $taskTables=@()
  foreach($taskTable in $taskSchema.Rows){
    if($taskTable.TABLE_TYPE -ne 'TABLE'){continue}
    $taskName=[string]$taskTable.TABLE_NAME
    $taskCommand=$taskConnection.CreateCommand();$taskCommand.CommandText='SELECT TOP 10001 * FROM ['+$taskName.Replace(']',']]')+']'
    $taskReader=$taskCommand.ExecuteReader();$taskColumns=@();for($taskIndex=0;$taskIndex -lt $taskReader.FieldCount;$taskIndex++){$taskColumns+=@($taskReader.GetName($taskIndex))}
    $taskRows=@()
    while($taskReader.Read()){
      if($taskRows.Count -ge 10000){throw 'Import up to 10,000 records per table.'}
      $taskRecord=[ordered]@{}
      for($taskIndex=0;$taskIndex -lt $taskReader.FieldCount;$taskIndex++){$taskValue=$taskReader.GetValue($taskIndex);$taskRecord[$taskColumns[$taskIndex]]=if($taskValue -is [DBNull]){''}elseif($taskValue -is [DateTime]){$taskValue.ToString('o')}else{[Convert]::ToString($taskValue,[Globalization.CultureInfo]::InvariantCulture)}}
      $taskRows+=@($taskRecord)
    }
    $taskReader.Close();$taskCommand.Dispose()
    $taskTables+=@(@{name=$taskName;columns=$taskColumns;rows=$taskRows})
  }
  $taskConnection.Close();$taskConnection.Dispose()
  @{ok=$true;tables=$taskTables}|ConvertTo-Json -Depth 20 -Compress
} catch { @{ok=$false;error=$_.Exception.Message}|ConvertTo-Json -Compress;exit 1 }
