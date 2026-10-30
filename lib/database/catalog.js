'use strict';
// Native order is preserved for the source types Q LABEL currently offers.
// Presence in this catalog does not imply that a connection adapter is available.
const rows=[
 ['text','Text File','file','Text files with encoding, delimited or fixed-width fields.','.csv,.tsv,.txt'],
 ['xml','XML File','file','XML records selected from a file or embedded data.','.xml'],
 ['builder','BarTender Data Builder','builder','Data Builder XML databases (schema 11.2.R0). Legacy SQL Server files require conversion.','.btdb'],
 ['excel','Microsoft Excel','workbook','Excel workbooks, worksheets and tables.','.xls,.xlsx'],
 ['access','Microsoft Access','access','Microsoft Access databases using an installed database provider.','.mdb,.accdb'],
 ['sqlserver','Microsoft SQL Server','server','Connect to a Microsoft SQL Server database.'],
 ['oracle','Oracle','server','Connect to an Oracle database.'],
 ['json','JSON','file','JSON master records and fields from a file or embedded data.','.json'],
 ['firebird','Firebird','server','Connect to a Firebird database.'],
 ['db2','IBM DB2','server','Connect to IBM DB2 using an installed provider.'],
 ['informix','IBM Informix','server','Connect to IBM Informix using an installed provider.'],
 ['azure-sql','Microsoft Azure SQL','server','Connect to a Microsoft Azure SQL database.'],
 ['mysql','MySQL','server','Connect to a MySQL database.'],
 ['mariadb','MariaDB','server','Connect to a MariaDB database.'],
 ['postgresql','PostgreSQL','server','Connect to a PostgreSQL database.'],
 ['quickbooks-online','QuickBooks Online','cloud','Read company data from an authorized QuickBooks Online account.'],
 ['sap-idoc','SAP IDoc File','idoc','Read records from a SAP IDoc file.'],
 ['sap-hana','SAP HANA','server','Connect to a SAP HANA database.'],
 ['oledb','OLE DB Connection','oledb','Choose an installed OLE DB provider or a UDL connection file.'],
 ['odbc','ODBC Connection','odbc','Choose a user, system or file data source name.'],
 ['import','Import From File','connection-import','Import records from a Q LABEL connection snapshot. BarTender XML and original connection settings are not imported.','.json']
];
const types=Object.freeze(rows.map(([id,name,flowId,description,accept])=>Object.freeze({id,name,flowId,description,icon:id,...(accept?{accept}:{})})));
function getDatabaseTypes(){return types;}
function getDatabaseType(id){return types.find(type=>type.id===id);}
module.exports={getDatabaseTypes,getDatabaseType};
