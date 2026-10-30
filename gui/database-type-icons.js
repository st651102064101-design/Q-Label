(function(root){
  'use strict';
  const base='assets/database-types/';
  const files={
    text:'text.png',xml:'xml.png',builder:'builder.png',excel:'excel.png',access:'access.png',
    sqlserver:'sqlserver.png',oracle:'oracle.png',json:'json.png',firebird:'firebird.png',db2:'db2.png',informix:'informix.png',
    'google-sheets':'google-sheets.png','azure-sql':'azure-sql.png',mysql:'mysql.png',mariadb:'mariadb.png',
    postgresql:'postgresql.png','quickbooks-online':'quickbooks-online.png','sap-idoc':'sap-idoc.png','sap-hana':'sap-hana.png',
    oledb:'oledb.png',odbc:'odbc.png',import:'import.png'
  };
  root.DatabaseTypeIcons={src(id){return base+(files[id]||files.text);},files:Object.freeze({...files})};
})(typeof window!=='undefined'?window:globalThis);
