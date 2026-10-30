'use strict';
const clone=value=>JSON.parse(JSON.stringify(value));
const valid=id=>typeof id==='string'&&id.length>0&&!['__proto__','constructor','prototype'].includes(id);
function assignSchema(connection){
 connection.fields||={};connection.fieldIds||={};connection.tableIds||={};
 const used=new Set(Object.values(connection.fieldIds));let n=Number(connection.fieldSequence)||0;
 for(const name of Object.keys(connection.fields)){if(!valid(connection.fieldIds[name])){let id;do{id=connection.id+':field-'+(++n);}while(used.has(id));connection.fieldIds[name]=id;used.add(id);}}
 connection.fieldSequence=n;
 const tableIds=new Set(Object.values(connection.tableIds));let t=Number(connection.tableSequence)||0;
 for(const table of connection.tables||[]){if(!Object.hasOwn(connection.tableIds,table.name)){let id;do{id=connection.id+':table-'+(++t);}while(tableIds.has(id));Object.defineProperty(connection.tableIds,table.name,{value:id,writable:true,enumerable:true,configurable:true});tableIds.add(id);}}
 connection.tableSequence=t;return connection;
}
function migrate(document){
 const copy=clone(document),list=copy.database_connections||[];if(!Array.isArray(list))throw Error('Invalid database connection collection.');
 let sequence=Number(copy.database_connection_sequence)||0;const ids=new Set();
 for(const c of list){if(!valid(c.id)||ids.has(c.id))throw Error('Invalid or duplicate database connection ID.');ids.add(c.id);}
 const next=()=>{let id;do{id='connection-'+(++sequence);}while(ids.has(id));ids.add(id);return id;};
 if(!list.length&&copy.database_connection){const c=copy.database_connection;if(!valid(c.id))c.id=next();else ids.add(c.id);list.push(c);}
 const owners=new Map();copy.data_sources||={};
 for(const c of list){assignSchema(c);for(const name of Object.keys(c.fields)){
  if(owners.has(name))throw Error('Database field is owned by another connection: '+name);owners.set(name,c.id);
  const source=copy.data_sources[name];if(source&&source.type!=='database-missing'){source.connectionId=c.id;source.fieldId=c.fieldIds[name];source.tableId=c.tableIds[c.tables?.[c.tableIndex||0]?.name];}
 }}
 copy.database_connections=list;copy.database_connection_sequence=sequence;
 const requested=copy.database_connection?.id||copy.active_database_connection_id;
 const active=list.find(c=>c.id===requested)||list[0];
 if(active){copy.active_database_connection_id=active.id;copy.database_connection=clone(active);}else{delete copy.database_connection;delete copy.active_database_connection_id;}
 return copy;
}
function select(document,id){const copy=migrate(document),c=copy.database_connections.find(c=>c.id===id);if(!c)throw Error('Database connection no longer exists.');copy.active_database_connection_id=id;copy.database_connection=clone(c);return copy;}
function commit(document,draft,result){
 const copy=migrate(document),list=copy.database_connections;let connection=clone(draft),previous;
 if(connection.id){previous=list.find(c=>c.id===connection.id);if(!previous)throw Error('Database connection no longer exists.');}
 else{const ids=new Set(list.map(c=>c.id));do{connection.id='connection-'+(++copy.database_connection_sequence);}while(ids.has(connection.id));}
 connection.fieldIds={...(previous?.fieldIds||{}),...(connection.fieldIds||{})};connection.tableIds={...(previous?.tableIds||{}),...(connection.tableIds||{})};connection.fieldSequence=Math.max(previous?.fieldSequence||0,connection.fieldSequence||0);connection.tableSequence=Math.max(previous?.tableSequence||0,connection.tableSequence||0);
 connection.fields={...connection.fields};
 for(const name of Object.keys(connection.fields)){
  if(list.some(c=>c.id!==connection.id&&Object.hasOwn(c.fields||{},name)))throw Error('Database field belongs to another connection: '+name);
  if(!result.columns.includes(connection.fields[name]))delete connection.fields[name];
 }
 assignSchema(connection);connection.rows=clone(result.rows);
 for(const name of Object.keys(previous?.fields||{}))if(!Object.hasOwn(connection.fields,name)){delete copy.data_sources[name];if(copy.values)delete copy.values[name];}
 for(const [name,column]of Object.entries(connection.fields)){const source=copy.data_sources[name]||{};copy.data_sources[name]={...source,category:'Database Fields',type:'table',column,row:source.row??'auto',rows:clone(result.rows),fileName:connection.fileName,connectionId:connection.id,fieldId:connection.fieldIds[name],tableId:connection.tableIds[connection.tables?.[connection.tableIndex||0]?.name]};delete copy.data_sources[name].missingReason;}
 const index=list.findIndex(c=>c.id===connection.id);if(index<0)list.push(connection);else list[index]=connection;
 copy.active_database_connection_id=connection.id;copy.database_connection=clone(connection);return copy;
}
function remove(document,id){
 const copy=migrate(document),removed=copy.database_connections.find(c=>c.id===id);if(!removed)throw Error('Database connection no longer exists.');
 copy.database_connections=copy.database_connections.filter(c=>c.id!==id);
 for(const name of Object.keys(removed.fields||{})){copy.data_sources[name]={...copy.data_sources[name],category:'Database Fields',type:'database-missing',connectionId:id,rows:[],missingReason:'The database connection was deleted.'};if(copy.values)delete copy.values[name];}
 if(copy.database_connection?.id===id){delete copy.database_connection;delete copy.active_database_connection_id;}
 return migrate(copy);
}
function unbind(document,name){const copy=migrate(document);for(const c of copy.database_connections)delete c.fields[name];delete copy.data_sources[name];if(copy.values)delete copy.values[name];return selectOrEmpty(copy);}
function selectOrEmpty(copy){const active=copy.database_connections.find(c=>c.id===copy.active_database_connection_id);if(active)copy.database_connection=clone(active);return copy;}
function effectiveRows(document){
 if(!document.database_connections?.length)return document.database_connection?.rows||[];
 const active=document.database_connection||document.database_connections.find(c=>c.id===document.active_database_connection_id)||document.database_connections[0];
 return (active.rows||[]).map((row,index)=>{
  const values={...row};for(const c of document.database_connections)for(const [name,column]of Object.entries(c.fields||{})){
   const source=document.data_sources?.[name],at=source?.row==='auto'||source?.row==null?index:Number(source.row||0),record=c.rows?.[at];
   if(!record)throw Error('Database '+(c.name||c.id)+': record '+(at+1)+' is unavailable. Select a fixed record or matching data.');values[name]=record[column]??'';
  }return values;
 });
}
function printFields(document){return document.database_connections?.length?Object.fromEntries(document.database_connections.flatMap(c=>Object.keys(c.fields||{}).map(name=>[name,name]))):document.database_connection?.fields||{};}
function updateBinding(document,oldName,name,column){
 const copy=migrate(document),owner=copy.database_connections.find(c=>Object.hasOwn(c.fields||{},oldName));if(!owner)return copy;
 if(name!==oldName&&copy.database_connections.some(c=>Object.hasOwn(c.fields||{},name)))throw Error('Database field belongs to another binding: '+name);
 const id=owner.fieldIds[oldName];delete owner.fields[oldName];delete owner.fieldIds[oldName];owner.fields[name]=column;owner.fieldIds[name]=id;
 if(copy.data_sources[name])Object.assign(copy.data_sources[name],{connectionId:owner.id,fieldId:id,tableId:owner.tableIds[owner.tables?.[owner.tableIndex||0]?.name]});
 return selectOrEmpty(copy);
}
module.exports={migrate,select,commit,remove,unbind,effectiveRows,printFields,updateBinding};
