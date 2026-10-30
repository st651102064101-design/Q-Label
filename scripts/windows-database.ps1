$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false)
$taskConnection=$null;$taskReader=$null;$taskCommand=$null;$taskQuotes=$null
try {
 Add-Type -AssemblyName System.Data
 $taskInput=[Console]::In.ReadToEnd()|ConvertFrom-Json
 if($taskInput.typeId -notin @('odbc','oledb')){throw 'Unsupported provider'}
 function Get-SqlOdbcDriver($Drivers){
  foreach($Name in @('ODBC Driver 18 for SQL Server','ODBC Driver 17 for SQL Server','ODBC Driver 13 for SQL Server','SQL Server Native Client 11.0','SQL Server')){if($Drivers -contains $Name){return $Name}}
  return ($Drivers | Where-Object { $_ -match 'SQL Server' } | Select-Object -First 1)
 }
 function New-SqlOdbcBuilder($Config,$Drivers){
  $taskBuilder=New-Object System.Data.Odbc.OdbcConnectionStringBuilder
  $taskDriver=[string]$Config.driver
  if(!$taskDriver){$taskDriver=Get-SqlOdbcDriver $Drivers}
  if(!$taskDriver){throw 'No SQL Server ODBC driver'}
  $taskBuilder['Driver']=$taskDriver
  $taskBuilder['Server']=[string]$Config.server
  if($Config.database){$taskBuilder['Database']=[string]$Config.database}
  if($Config.integratedSecurity){$taskBuilder['Trusted_Connection']='yes'}else{
   if($Config.userName){$taskBuilder['UID']=[string]$Config.userName}
   if($Config.password){$taskBuilder['PWD']=[string]$Config.password}
  }
  if($taskDriver -match '18'){$taskBuilder['Encrypt']='yes';$taskBuilder['TrustServerCertificate']='yes'}
  return $taskBuilder
 }
 if($taskInput.operation -eq 'detect'){
  if($taskInput.typeId -eq 'odbc'){
   $taskDrivers=@(Get-OdbcDriver -Platform '64-bit' | ForEach-Object {[string]$_.Name})
   $taskSources=@(Get-OdbcDsn -Platform '64-bit' | ForEach-Object {@{name=[string]$_.Name;type=[string]$_.DsnType;driver=[string]$_.DriverName}})
   $taskServers=@()
   try{
    $taskTable=[System.Data.Sql.SqlDataSourceEnumerator]::Instance.GetDataSources()
    foreach($taskRow in $taskTable.Rows){
     $taskServer=[string]$taskRow['ServerName'];$taskInstance=[string]$taskRow['InstanceName']
     if($taskInstance){$taskServer=$taskServer+'\'+$taskInstance}
     if($taskServer){$taskServers+=@($taskServer)}
    }
   }catch{}
   $taskResult=@{drivers=$taskDrivers;dataSources=$taskSources;servers=($taskServers|Select-Object -Unique)}
  }else{
   $taskEnumerator=[System.Data.OleDb.OleDbEnumerator]::GetRootEnumerator()
   $taskProviders=@()
   try{while($taskEnumerator.Read()){if([int]$taskEnumerator['SOURCES_TYPE'] -eq 1){$taskProviders+=@(@{id=[string]$taskEnumerator['SOURCES_NAME'];name=[string]$taskEnumerator['SOURCES_DESCRIPTION']})}}}finally{$taskEnumerator.Dispose()}
   $taskResult=@{providers=$taskProviders}
  }
 }elseif($taskInput.operation -eq 'servers'){
  $taskDrivers=@(Get-OdbcDriver -Platform '64-bit' | ForEach-Object {[string]$_.Name})
  $taskServers=@()
  try{
   $taskTable=[System.Data.Sql.SqlDataSourceEnumerator]::Instance.GetDataSources()
   foreach($taskRow in $taskTable.Rows){
    $taskServer=[string]$taskRow['ServerName'];$taskInstance=[string]$taskRow['InstanceName']
    if($taskInstance){$taskServer=$taskServer+'\'+$taskInstance}
    if($taskServer){$taskServers+=@($taskServer)}
   }
  }catch{}
  $taskResult=@{drivers=$taskDrivers;servers=($taskServers|Select-Object -Unique)}
 }elseif($taskInput.operation -eq 'databases'){
  $taskConfig=$taskInput.config
  if(!$taskConfig.server){throw 'Missing server'}
  $taskDrivers=@(Get-OdbcDriver -Platform '64-bit' | ForEach-Object {[string]$_.Name})
  $taskBuilder=New-SqlOdbcBuilder @{server=$taskConfig.server;database='master';driver=$taskConfig.driver;integratedSecurity=$taskConfig.integratedSecurity;userName=$taskConfig.userName;password=$taskConfig.password} $taskDrivers
  $taskConnection=New-Object System.Data.Odbc.OdbcConnection
  $taskConnection.ConnectionString=$taskBuilder.ConnectionString;$taskConnection.Open()
  $taskCommand=$taskConnection.CreateCommand();$taskCommand.CommandTimeout=20;$taskCommand.CommandText='SELECT name FROM sys.databases ORDER BY name'
  $taskReader=$taskCommand.ExecuteReader();$taskNames=@()
  while($taskReader.Read()){$taskNames+=@([string]$taskReader.GetValue(0))}
  $taskReader.Dispose();$taskCommand.Dispose();$taskConnection.Dispose();$taskConnection=$null
  $taskResult=@{databases=$taskNames}
 }elseif($taskInput.operation -eq 'read'){
  $taskConfig=$taskInput.config
  if($taskInput.typeId -eq 'odbc'){
   $taskBuilder=New-Object System.Data.Odbc.OdbcConnectionStringBuilder
   if($taskConfig.server){
    $taskDrivers=@(Get-OdbcDriver -Platform '64-bit' | ForEach-Object {[string]$_.Name})
    $taskBuilder=New-SqlOdbcBuilder $taskConfig $taskDrivers
   }elseif($taskConfig.fileDsn){$taskBuilder['FILEDSN']=[string]$taskConfig.fileDsn}else{$taskBuilder['DSN']=[string]$taskConfig.dsn}
   if(!$taskConfig.server){if($taskConfig.userName){$taskBuilder['UID']=[string]$taskConfig.userName};if($taskConfig.password){$taskBuilder['PWD']=[string]$taskConfig.password}}
   $taskConnection=New-Object System.Data.Odbc.OdbcConnection
   $taskQuotes=New-Object System.Data.Odbc.OdbcCommandBuilder
  }else{
   $taskBuilder=New-Object System.Data.OleDb.OleDbConnectionStringBuilder
   if($taskConfig.udl){$taskBuilder['File Name']=[string]$taskConfig.udl}else{
   $taskBuilder.Provider=[string]$taskConfig.provider
   $taskBuilder['Data Source']=[string]$taskConfig.dataSource
   if($taskConfig.database){$taskBuilder['Initial Catalog']=[string]$taskConfig.database}
   if($taskConfig.integratedSecurity){$taskBuilder['Integrated Security']='SSPI'}
   if($taskConfig.userName){$taskBuilder['User ID']=[string]$taskConfig.userName}
   if($taskConfig.password){$taskBuilder['Password']=[string]$taskConfig.password}
   if($taskConfig.provider -match '^Microsoft\.ACE\.'){$taskBuilder['Mode']='Read'}
   }
   $taskConnection=New-Object System.Data.OleDb.OleDbConnection
   $taskQuotes=New-Object System.Data.OleDb.OleDbCommandBuilder
  }
  $taskConnection.ConnectionString=$taskBuilder.ConnectionString;$taskConnection.Open()
  $taskSchema=$taskConnection.GetSchema('Tables');$taskTables=@()
  foreach($taskTable in $taskSchema.Rows){
   if([string]$taskTable.TABLE_TYPE -notin @('TABLE','VIEW')){continue}
   if($taskTables.Count -ge 64){throw 'Too many tables'}
   $taskName=[string]$taskTable.TABLE_NAME;$taskSchemaName=''
   if($taskSchema.Columns.Contains('TABLE_SCHEMA') -and $taskTable.TABLE_SCHEMA -ne [DBNull]::Value){$taskSchemaName=[string]$taskTable.TABLE_SCHEMA}
   $taskIdentifier=$taskQuotes.QuoteIdentifier($taskName,$taskConnection)
   $taskDisplayName=$taskName
   if($taskSchemaName){$taskIdentifier=$taskQuotes.QuoteIdentifier($taskSchemaName,$taskConnection)+'.'+$taskIdentifier;$taskDisplayName=$taskSchemaName+'.'+$taskName}
   $taskCommand=$taskConnection.CreateCommand();$taskCommand.CommandTimeout=20;$taskCommand.CommandText='SELECT * FROM '+$taskIdentifier
   $taskReader=$taskCommand.ExecuteReader();$taskColumns=@();$taskRows=@()
   for($taskIndex=0;$taskIndex -lt $taskReader.FieldCount;$taskIndex++){$taskColumns+=@($taskReader.GetName($taskIndex))}
   while($taskReader.Read()){
    if($taskRows.Count -ge 10000){throw 'Too many records'}
    $taskRow=[ordered]@{}
    for($taskIndex=0;$taskIndex -lt $taskReader.FieldCount;$taskIndex++){
     $taskValue=$taskReader.GetValue($taskIndex)
     if($taskValue -eq [DBNull]::Value){$taskRow[$taskColumns[$taskIndex]]=''}
     elseif($taskValue -is [byte[]]){$taskRow[$taskColumns[$taskIndex]]=[Convert]::ToBase64String($taskValue)}
     elseif($taskValue -is [IFormattable]){$taskRow[$taskColumns[$taskIndex]]=$taskValue.ToString($null,[Globalization.CultureInfo]::InvariantCulture)}
     else{$taskRow[$taskColumns[$taskIndex]]=[string]$taskValue}
    }
    $taskRows+=@($taskRow)
   }
   $taskReader.Dispose();$taskReader=$null;$taskCommand.Dispose();$taskCommand=$null
   $taskTables+=@(@{name=$taskDisplayName;columns=$taskColumns;rows=$taskRows})
  }
  if(!$taskTables.Count){throw 'No tables'}
  $taskResult=@($taskTables)
 }else{throw 'Invalid operation'}
 @{ok=$true;data=$taskResult}|ConvertTo-Json -Depth 12 -Compress
}catch{
 # Never serialize exception text: some drivers include passwords/connection strings.
 @{ok=$false;error='DATABASE_PROVIDER_FAILED'}|ConvertTo-Json -Compress
}finally{
 if($taskReader){$taskReader.Dispose()};if($taskCommand){$taskCommand.Dispose()};if($taskQuotes){$taskQuotes.Dispose()};if($taskConnection){$taskConnection.Dispose()}
}
