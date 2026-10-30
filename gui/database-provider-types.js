(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DatabaseProviderTypes=factory();})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const definitions=Object.freeze({
  sqlserver:['Microsoft SQL Server',/\bsql server\b/i],
  'azure-sql':['Microsoft Azure SQL',/\bsql server\b/i],
  oracle:['Oracle',/\boracle\b/i],
  firebird:['Firebird',/\bfirebird\b/i],
  db2:['IBM DB2',/\bdb2\b/i],
  informix:['IBM Informix',/\binformix\b/i],
  mysql:['MySQL',/\bmysql\b/i],
  mariadb:['MariaDB',/\bmariadb\b/i],
  postgresql:['PostgreSQL',/\bpostgresql\b/i],
  'sap-hana':['SAP HANA',/\bhdbodbc(?:32)?\b|\b(?:sap\s+)?hana\b/i]
 });
 const dsnTypes=Object.freeze(['odbc',...Object.keys(definitions)]),nativeTypes=Object.freeze(['oledb',...dsnTypes]);
 const label=type=>definitions[type]?.[0]||({odbc:'ODBC Connection',oledb:'OLE DB Connection'}[type])||'';
 const matchesDriver=(type,name)=>typeof name==='string'&&(type==='odbc'?!!name.trim():!!definitions[type]?.[1].test(name));
 const transport=type=>dsnTypes.includes(type)?'odbc':type==='oledb'?'oledb':null;
 return Object.freeze({dsnTypes,nativeTypes,label,matchesDriver,transport});
});
