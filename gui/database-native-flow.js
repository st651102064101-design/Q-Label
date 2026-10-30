(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./database-provider-types'));else root.DatabaseNativeFlow=factory(root.DatabaseProviderTypes);})(typeof window==='undefined'?globalThis:window,function(providerTypes){
 'use strict';
 const sqlDirectTypes=new Set(['sqlserver','azure-sql']);
 function pickSqlDriver(drivers=[]){
  const preferred=['ODBC Driver 18 for SQL Server','ODBC Driver 17 for SQL Server','ODBC Driver 13 for SQL Server','SQL Server Native Client 11.0','SQL Server'];
  for(const name of preferred)if(drivers.includes(name))return name;
  return drivers.find(name=>/sql server/i.test(name))||'';
 }
 function mountSqlServerDirect(host,{typeId,availability={},initial={},onChange=()=>{},listDatabases}={}){
  const document=host.ownerDocument,form=document.createElement('section'),fields={};form.className='db-native-form db-native-sqlserver';host.append(form);
  const heading=document.createElement('h2');heading.textContent=typeId==='azure-sql'?'Microsoft Azure SQL Database':'Microsoft SQL Server Database';form.append(heading);
  const driver=pickSqlDriver(availability.drivers||[]);
  function field(labelText,name,type='text'){
   const label=document.createElement('label'),caption=document.createElement('span'),control=document.createElement('input');caption.textContent=labelText;control.name=name;control.type=type;
   if(type==='password')control.autocomplete='new-password';
   control.oninput=control.onchange=()=>{sync();onChange();};fields[name]=control;label.append(caption,control);return label;
  }
  const connFieldset=document.createElement('fieldset');connFieldset.className='db-sql-section';connFieldset.append(Object.assign(document.createElement('legend'),{textContent:'Enter connection information:'}));
  const serverLabel=field('Server:','server');serverLabel.querySelector('input').setAttribute('list','db-sql-server-list');
  const serverList=document.createElement('datalist');serverList.id='db-sql-server-list';
  for(const server of availability.servers||[]){const option=document.createElement('option');option.value=server;serverList.append(option);}
  connFieldset.append(serverLabel,serverList);form.append(connFieldset);
  const authFieldset=document.createElement('fieldset');authFieldset.className='db-sql-section';authFieldset.append(Object.assign(document.createElement('legend'),{textContent:'Choose an authentication mode:'}));
  const authWindows=document.createElement('input');authWindows.type='radio';authWindows.name='authMode';authWindows.value='windows';
  const authSql=document.createElement('input');authSql.type='radio';authSql.name='authMode';authSql.value='sql';
  for(const [input,title]of [[authWindows,'Use current credentials (Windows Authentication)'],[authSql,'Specify user name and password (Database Authentication)']]){const label=document.createElement('label');input.onchange=()=>{sync();onChange();void refreshDatabases();};label.append(input,document.createTextNode(' '+title));authFieldset.append(label);}
  authFieldset.append(field('User Name:','userName'),field('Password:','password','password'));
  const credFieldset=document.createElement('div');credFieldset.className='db-sql-credential-store';
  const credStore=document.createElement('input');credStore.type='radio';credStore.name='credentialMode';credStore.value='store';
  const credPrompt=document.createElement('input');credPrompt.type='radio';credPrompt.name='credentialMode';credPrompt.value='prompt';
  for(const [input,title]of [[credStore,'Store the credentials with the document'],[credPrompt,'Prompt for the credentials when connecting to the database']]){const label=document.createElement('label');input.onchange=()=>{sync();onChange();};label.append(input,document.createTextNode(' '+title));credFieldset.append(label);}
  authFieldset.append(credFieldset);form.append(authFieldset);
  const dbFieldset=document.createElement('fieldset');dbFieldset.className='db-sql-section';dbFieldset.append(Object.assign(document.createElement('legend'),{textContent:'Select or enter a database name:'}));
  const dbLabel=document.createElement('label'),dbCaption=document.createElement('span'),dbInput=document.createElement('input');dbCaption.textContent='Database:';dbInput.name='database';dbInput.setAttribute('list','db-sql-database-list');dbInput.oninput=dbInput.onchange=()=>{sync();onChange();};fields.database=dbInput;
  const dbList=document.createElement('datalist');dbList.id='db-sql-database-list';dbLabel.append(dbCaption,dbInput,dbList);dbFieldset.append(dbLabel);form.append(dbFieldset);
  fields.server=serverLabel.querySelector('input');fields.userName=authFieldset.querySelector('[name=userName]');fields.password=authFieldset.querySelector('[name=password]');
  fields.authMode=authWindows;fields.authModeSql=authSql;fields.credentialStore=credStore;fields.credentialPrompt=credPrompt;
  authWindows.checked=initial.integratedSecurity!==false&&!initial.userName;authSql.checked=!authWindows.checked;credStore.checked=initial.promptCredentials!==true;credPrompt.checked=!!initial.promptCredentials;
  fields.server.value=initial.server||'';fields.userName.value=initial.userName||'';fields.password.value=initial.password||'';
  let refreshToken=0;
  async function refreshDatabases(){
   if(!listDatabases||!fields.server.value.trim())return;
   const token=++refreshToken;dbInput.disabled=true;
   try{
    const partial=readConfig();partial.driver=driver;partial.database='master';
    const result=await listDatabases(partial);
    if(token!==refreshToken||!form.isConnected)return;
    const selected=fields.database.value;dbList.replaceChildren();
    for(const name of result?.databases||[]){const option=document.createElement('option');option.value=name;dbList.append(option);}
    if(!selected&&initial.database)fields.database.value=initial.database;
   }finally{if(token===refreshToken)dbInput.disabled=false;}
  }
  fields.server.addEventListener('change',()=>void refreshDatabases());
  function readConfig(){
   const integrated=authWindows.checked;
   const activeDriver=pickSqlDriver(availability.drivers||[])||driver;
   const config={server:fields.server.value.trim(),database:fields.database.value.trim(),driver:activeDriver,integratedSecurity:integrated,storeCredentials:credStore.checked,promptCredentials:credPrompt.checked};
   if(!integrated){config.userName=fields.userName.value.trim();config.password=fields.password.value;}
   return config;
  }
  function publicConfig(){
   const config=readConfig(),saved={server:config.server,database:config.database,driver:config.driver,integratedSecurity:config.integratedSecurity,storeCredentials:config.storeCredentials,promptCredentials:config.promptCredentials};
   if(config.promptCredentials){saved.promptCredentials=true;}else if(!config.integratedSecurity&&config.userName){saved.userName=config.userName;if(config.password)saved.requiresPassword=true;}
   return saved;
  }
  function isValid(){const config=readConfig();if(!config.server||!config.database||!config.driver)return false;if(!config.integratedSecurity&&!config.userName.trim())return false;return true;}
  function sync(){
   const integrated=authWindows.checked;
   fields.userName.disabled=integrated;fields.password.disabled=integrated;
   credStore.disabled=integrated;credPrompt.disabled=integrated;
  }
  sync();void refreshDatabases();
  return {readConfig,publicConfig,isValid,refreshDatabases};
 }
 function mount(host,{typeId,availability={},initial={},onChange=()=>{},pickFile,listDatabases}={}){
  if(sqlDirectTypes.has(typeId))return mountSqlServerDirect(host,{typeId,availability,initial,onChange,listDatabases});
  const document=host.ownerDocument,form=document.createElement('section'),fields={},dsnType=providerTypes.dsnTypes.includes(typeId);form.className='db-native-form';host.append(form);
  const heading=document.createElement('h2');heading.textContent=dsnType?providerTypes.label(typeId):'OLE DB Provider';form.append(heading);
  function input(name,title,type='text'){
   const label=document.createElement('label'),caption=document.createElement('span'),control=document.createElement('input');caption.textContent=title;control.name=name;control.type=type;
   if(type==='checkbox')control.checked=!!initial[name];else control.value=initial[name]||'';
   if(type==='password')control.autocomplete='new-password';
   control.oninput=control.onchange=()=>{sync();onChange();};fields[name]=control;label.append(caption,control);form.append(label);return control;
  }
  function list(name,title,rows){
   const label=document.createElement('label'),caption=document.createElement('span'),control=document.createElement('select');caption.textContent=title;control.name=name;control.size=7;
   for(const row of rows){const option=document.createElement('option');option.value=row.id;option.textContent=row.name;control.append(option);}
   control.value=initial[name]||'';control.onchange=()=>{sync();onChange();};fields[name]=control;label.append(caption,control);form.append(label);return control;
  }
  let fileMode,dsnMode,browse;
  if(dsnType){
   if(typeId!=='odbc'){const help=document.createElement('p');help.textContent=`Choose a Windows ODBC data source configured for ${providerTypes.label(typeId)}. A File DSN can also be used.`;form.append(help);}
   const modes=document.createElement('div');modes.className='db-native-modes';
   for(const [value,title]of [['dsn','User or system data source'],['file','File data source']]){
    const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='native-dsn-mode';radio.value=value;radio.checked=value===(initial.fileDsn?'file':'dsn');radio.onchange=()=>{sync();onChange();};label.append(radio,document.createTextNode(title));modes.append(label);if(value==='file')fileMode=radio;else dsnMode=radio;
   }
   form.append(modes);
   list('dsn','Name / Type',(availability.dataSources||[]).map(source=>({id:source.name,name:source.name+' ('+source.type+')'})));
   input('fileDsn','File data source');browse=document.createElement('button');browse.type='button';browse.textContent='Browse…';browse.dataset.nativeBrowse='';
   browse.onclick=async()=>{const result=await pickFile?.();if(result?.ok&&form.isConnected){fields.fileDsn.value=result.filePath;sync();onChange();}};form.append(browse);
  }else{
   list('provider','Provider',[...(availability.providers||[]).map(provider=>({id:provider.id,name:provider.name||provider.id})),{id:'__udl__',name:'Universal Data Link (UDL) File'}]);
   input('dataSource','Data source');input('database','Database');input('integratedSecurity','Use Windows authentication','checkbox');
   browse=document.createElement('button');browse.type='button';browse.textContent='Browse UDL file…';browse.dataset.nativeBrowse='';
   browse.onclick=async()=>{const result=await pickFile?.();if(result?.ok&&form.isConnected){fields.dataSource.value=result.filePath;sync();onChange();}};form.append(browse);
  }
  input('userName','User name');input('password','Password','password');
  function sync(){
   if(dsnType){fields.dsn.disabled=!!fileMode.checked;fields.fileDsn.disabled=!fileMode.checked;browse.disabled=!fileMode.checked||!pickFile;}
   const udl=typeId==='oledb'&&fields.provider.value==='__udl__';
   if(typeId==='oledb'){browse.disabled=!udl||!pickFile;fields.database.disabled=udl;fields.integratedSecurity.disabled=udl;}
   const integrated=!!fields.integratedSecurity?.checked||udl;fields.userName.disabled=integrated;fields.password.disabled=integrated;
  }
  function readConfig(){
   if(typeId==='oledb'&&fields.provider.value==='__udl__')return {udl:fields.dataSource.value};
   const config={};
   for(const [name,control]of Object.entries(fields)){if(control.disabled)continue;config[name]=control.type==='checkbox'?control.checked:control.value;}
   return config;
  }
  function publicConfig(){const config=readConfig();if(config.password)config.requiresPassword=true;delete config.password;return config;}
  function isValid(){const config=readConfig();return dsnType?!!(config.dsn||config.fileDsn?.trim()):!!(config.udl?.trim()||(config.provider&&config.dataSource?.trim()));}
  sync();return {readConfig,publicConfig,isValid};
 }
 return {mount};
});
