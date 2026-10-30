'use strict';
const messages=Object.freeze({online:'Excel Online is no longer supported. Choose another data source.'});
function getRetiredDatabaseTypeMessage(id){return messages[id]||null;}
module.exports={getRetiredDatabaseTypeMessage};
