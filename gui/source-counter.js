(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SourceCounter=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function integer(value){if(typeof value==='number'&&!Number.isSafeInteger(value))throw Error('Serialization requires an exact integer');if(!/^[+-]?\d+$/.test(String(value)))throw Error('Serialization requires an integer step');return BigInt(value);}
  function advance(value,step=1,config={}){
    const text=String(value),delta=integer(step);if(text.length>10000)throw Error('Serialization value is too long');
    let letters=config.letters==='lower'?'abcdefghijklmnopqrstuvwxyz':'ABCDEFGHIJKLMNOPQRSTUVWXYZ';if(config.excludeConfusing)letters=letters.replace(config.letters==='lower'?/l/g:/[IO]/g,'');
    const method=config.method||'auto';let alphabet;
    if(method==='numeric')alphabet='0123456789';else if(method==='alphabetic')alphabet=letters;else if(method==='alphanumeric')alphabet='0123456789'+letters;else if(method==='hex')alphabet='0123456789'+(config.letters==='lower'?'abcdef':'ABCDEF');else if(method==='custom'){alphabet=String(config.sequence||'');if(Array.from(alphabet).length<2||new Set(Array.from(alphabet)).size!==Array.from(alphabet).length)throw Error('Custom sequence must contain unique characters');}else if(method!=='auto')throw Error('Unknown serialization method: '+method);
    const chars=Array.from(text),positions=[];
    for(let i=0;i<chars.length;i++){const set=method==='auto'?/^[0-9]$/.test(chars[i])?'0123456789':letters:alphabet,index=Array.from(set).indexOf(chars[i]);if(index>=0)positions.push({at:i,set:Array.from(set),index});}
    if(!positions.length)throw Error('Serialization value contains no characters from the selected sequence');
    const allNumeric=positions.every(p=>p.set.join('')==='0123456789');
    if(allNumeric){const digits=positions.map(p=>chars[p.at]).join(''),first=positions[0].at,last=positions.at(-1).at,negative=first===1&&chars[0]==='-';
      let number=BigInt((negative?'-':'')+digits)+delta;
      if(config.rollover!=null&&config.rollover!==''){const limit=integer(config.rollover),reset=integer(config.resetValue??config.start??1);if(delta>=0n&&number>limit){if(limit<reset)throw Error('Rollover limit must be at least the reset value');number=reset+(number-reset)%(limit-reset+1n);}}
      const width=Math.max(digits.length,Number(config.digits||0));if(!Number.isInteger(width)||width>10000)throw Error('Invalid serialization digit count');
      const output=(number<0n?-number:number).toString().padStart(width,'0');
      if(positions.length===last-first+1)return chars.slice(0,negative?0:first).join('')+(number<0n?'-':'')+output+chars.slice(last+1).join('');
    }
    let carry=delta;
    for(let i=positions.length-1;i>=0;i--){const p=positions[i],base=BigInt(p.set.length),total=BigInt(p.index)+carry;let digit=total%base;if(digit<0n)digit+=base;carry=(total-digit)/base;chars[p.at]=p.set[Number(digit)];}
    if(carry<0n)throw Error('Serialization is below the first value of the sequence');
    if(carry>0n){const first=positions[0],base=BigInt(first.set.length),bijective=method==='alphabetic'||method==='auto'&&first.set.join('')!=='0123456789';let prefix='';
      while(carry>0n){if(bijective)carry--;prefix=first.set[Number(carry%base)]+prefix;carry/=base;if(prefix.length+chars.length>10000)throw Error('Serialization value is too long');}chars.splice(first.at,0,prefix);
    }
    return chars.join('');
  }
  return {advance,integer};
});
