'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('catalog preserves the order of all 21 active database choices and excludes Google Sheets',()=>{
 const {getDatabaseTypes,getDatabaseType}=require('../lib/database/catalog');
 const names=['Text File','XML File','BarTender Data Builder','Microsoft Excel','Microsoft Access','Microsoft SQL Server','Oracle','JSON','Firebird','IBM DB2','IBM Informix','Microsoft Azure SQL','MySQL','MariaDB','PostgreSQL','QuickBooks Online','SAP IDoc File','SAP HANA','OLE DB Connection','ODBC Connection','Import From File'];
 const types=getDatabaseTypes();assert.deepEqual(types.map(t=>t.name),names);assert.equal(new Set(types.map(t=>t.id)).size,21);assert.equal(getDatabaseType('google-sheets'),undefined);
 for(const id of ['text','xml','builder','excel','access','json'])assert.equal(getDatabaseType(id).id,id);
 for(const type of types){assert.ok(type.description);assert.ok(type.flowId);assert.ok(type.icon);assert.ok(Object.isFrozen(type));}
 assert.equal(getDatabaseType('missing'),undefined);assert.ok(Object.isFrozen(types));
 assert.deepEqual(require('../lib/database-import').types.map(type=>type.id),types.map(type=>type.id));
});
