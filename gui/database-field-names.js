(function(){
 'use strict';
 function sequence(existing,count){
  const names=Array.isArray(existing)?existing:Object.keys(existing||{}),used=new Set(names.map(name=>String(name).toLowerCase()));
  let highest=0;for(const name of names){const match=/^field[_ ]?(\d+)$/i.exec(String(name));if(match)highest=Math.max(highest,Number(match[1]));}
  const result=[];let number=highest+1;
  while(result.length<count){const key=`Field_${number++}`;if(used.has(key.toLowerCase())||used.has(key.replace('_',' ').toLowerCase()))continue;used.add(key.toLowerCase());result.push(key);}
  return result;
 }
 window.DatabaseFieldNames={sequence,next(existing){return sequence(existing,1)[0];}};
})();
