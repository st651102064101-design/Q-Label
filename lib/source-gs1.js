'use strict';
const bwip=require('bwip-js'),patterns=require('../gui/barcode').PATTERNS;
function decodeGs1Code128(widths){
  const codes=[];for(let index=0;index<widths.length-7;index+=6){const code=patterns.indexOf(widths.slice(index,index+6).join(''));if(code<0)throw Error('Invalid Code 128 pattern');codes.push(code);}
  if(![103,104,105].includes(codes[0])||widths.slice(-7).join('')!==patterns[106])throw Error('Invalid GS1 Code 128 framing');
  let checksum=codes[0];for(let index=1;index<codes.length-1;index++)checksum+=codes[index]*index;if(checksum%103!==codes.at(-1))throw Error('Invalid GS1 Code 128 checksum');
  let mode=codes[0]-103,data='',fnc1First=false,shift=false;
  for(let index=1;index<codes.length-1;index++){
    const code=codes[index];if(code===102){if(index===1)fnc1First=true;else data+='\x1d';continue;}
    if(mode===2&&code<=99){data+=String(code).padStart(2,'0');continue;}
    if(code===99){mode=2;continue;}if(code===100){mode=1;continue;}if(code===101){mode=0;continue;}if(code===98){shift=true;continue;}
    if(code>95)throw Error('Unsupported GS1 Code 128 control');const current=shift?1-mode:mode;data+=String.fromCharCode(current===0&&code>=64?code-64:code+32);shift=false;
  }
  if(!fnc1First)throw Error('GS1 requires an initial FNC1');return{data,fnc1First};
}
function compileGs1(entries,symbology='gs1-128'){
  if(!['gs1-128','gs1datamatrix','gs1qrcode'].includes(symbology))throw Error('Unsupported GS1 symbology');
  if(!Array.isArray(entries)||!entries.length)throw Error('Add at least one GS1 Application Identifier');
  const encodedText=entries.map(entry=>{if(!/^\d{2,4}$/.test(String(entry.ai)))throw Error('Invalid Application Identifier');return '('+entry.ai+')'+String(entry.value??'');}).join('');
  const raw=bwip.raw({bcid:'gs1-128',text:encodedText,includetext:true})[0];
  if(symbology!=='gs1-128')bwip.raw({bcid:symbology,text:encodedText});
  const decoded=decodeGs1Code128(raw.sbs);return{...decoded,encodedText,hri:raw.txt?.[0]?.[0]||encodedText,bytes:Array.from(decoded.data,c=>c.charCodeAt(0)),symbology};
}
module.exports={compileGs1};
