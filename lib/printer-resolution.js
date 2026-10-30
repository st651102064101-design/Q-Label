'use strict';

function readDriverResolution(configuration){
  const horizontal=Number(configuration?.HorizontalResolution),vertical=Number(configuration?.VerticalResolution);
  if(!Number.isInteger(horizontal)||!Number.isInteger(vertical)||horizontal<72||vertical<72||horizontal>2400||vertical>2400||horizontal!==vertical){
    return {error:'The printer driver did not report a valid matching resolution.'};
  }
  return {dpi:horizontal};
}

module.exports={readDriverResolution};
