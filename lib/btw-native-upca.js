'use strict';
// Installed native UPC-A/UniGDI profile, minimum=5mil, maximum=500mil.
// Scope: 637 independent target widths, 1..160mm in 0.25mm increments.
// Other native outputs/profiles require their own mapping, never this fallback.
function nativeUpcaSize(profile){
 const width=profile?.target_width_mm;
 if(!Number.isFinite(width)||width<1||width>160)throw Error('Native UPC target width is outside the verified 1–160 mm range');
 if(profile.minimum_x_mils!==5||profile.maximum_x_mils!==500)throw Error('Native UPC X-dimension bounds are not verified');
 const index=Math.max(0,Math.floor((width/25.4*300-160)/95));
 const barWidth=(95*index+160)/300*25.4;
 return {index,nominal_x_mils:5+index*10/3,bar_width_mm:barWidth,effective_x_mm:barWidth/95};
}
function nativeUpcaData(value){
 if(typeof value!=='string'||!/^\d+$/.test(value))throw Error('Native UPC data must contain ASCII digits');
 if(value.length<10||value.length>12)throw Error('Native UPC data is not GTIN-12 compliant');
 if(value.length===10)return '0'+value;
 if(value.length===12){
  let sum=0;for(let i=0;i<11;i++)sum+=Number(value[i])*(i%2?1:3);
  if((10-sum%10)%10!==Number(value[11]))throw Error('Native UPC check digit supplied by the input data is incorrect');
 }
 return value;
}
module.exports={nativeUpcaSize,nativeUpcaData};
