(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SourceTypes=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const kinds=['text','date','time','number','currency','percentage','fraction','binary','picture'];
  function numeric(value,config){
    if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Enter a finite number');return value;}
    let text=String(value).trim();
    if(config.inputLocale){const parts=new Intl.NumberFormat(config.inputLocale).formatToParts(12345.6),group=parts.find(p=>p.type==='group')?.value,decimal=parts.find(p=>p.type==='decimal')?.value;if(group)text=text.split(group).join('');if(decimal&&decimal!=='.')text=text.replace(decimal,'.');}
    if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text))throw Error('Enter a valid number');
    const result=Number(text);if(!Number.isFinite(result))throw Error('Enter a finite number');return result;
  }
  function roman(number){
    if(!Number.isInteger(number)||number<0||number>3999)throw Error('Roman numerals require an integer from 0 to 3999');
    if(number===0)return 'N';let result='';for(const [value,letters]of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(number>=value){number-=value;result+=letters;}return result;
  }
  function gcd(a,b){while(b){[a,b]=[b,a%b];}return a;}
  function fraction(number,config){
    const precision={quarters:4,'up-to-3':999,custom:config.denominator??1000};if(config.precision&&!Object.prototype.hasOwnProperty.call(precision,config.precision))throw Error('Unknown fraction precision');
    const denominator=Number(config.precision?precision[config.precision]:config.denominator??1000);if(!Number.isInteger(denominator)||denominator<1||denominator>1000000)throw Error('Fraction denominator must be between 1 and 1000000');
    let numerator=Math.round(Math.abs(number)*denominator),divisor=gcd(numerator,denominator),n=numerator/divisor,d=denominator/divisor;
    const sign=number<0?'-':'';if(d===1)return sign+String(n);
    const whole=config.improper?0:Math.floor(n/d);if(whole)n%=d;
    const symbol=config.composite?({'1/2':'½','1/4':'¼','3/4':'¾','1/3':'⅓','2/3':'⅔','1/8':'⅛','3/8':'⅜','5/8':'⅝','7/8':'⅞'})[n+'/'+d]:null;
    return sign+(whole?whole+(symbol?'':' '):'')+(symbol||n+'/'+d);
  }
  function dateValue(value){
    const result=value instanceof Date?new Date(value):new Date(value);
    if(!Number.isFinite(result.getTime()))throw Error('Enter a valid date or time');
    // Date silently normalizes February 30; source validation must not.
    const match=typeof value==='string'&&value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T| )/);
    if(match){const year=+match[1],month=+match[2],day=+match[3];if(month<1||month>12||day<1||day>new Date(Date.UTC(year,month,0)).getUTCDate())throw Error('Enter a valid date');}
    return result;
  }
  function dateText(date,config,context){
    const locale=config.locale||context.locale||undefined,timeZone=config.timeZone||context.timeZone||undefined;
    if(!config.pattern)return new Intl.DateTimeFormat(locale,{...(config.kind==='time'?{timeStyle:'medium'}:{dateStyle:'short'}),timeZone,calendar:config.calendar}).format(date);
    const numericParts=Object.fromEntries(new Intl.DateTimeFormat('en-US-u-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZone,calendar:config.calendar||'gregory'}).formatToParts(date).map(p=>[p.type,p.value]));
    const name=(field,width)=>new Intl.DateTimeFormat(locale,{[field]:width,timeZone,calendar:config.calendar}).format(date);
    const hour=Number(numericParts.hour),tokens={yyyy:numericParts.year,yy:numericParts.year.slice(-2),MMMM:name('month','long'),MMM:name('month','short'),MM:numericParts.month,M:String(+numericParts.month),dddd:name('weekday','long'),ddd:name('weekday','short'),dd:numericParts.day,d:String(+numericParts.day),HH:numericParts.hour,H:String(hour),hh:String(hour%12||12).padStart(2,'0'),h:String(hour%12||12),mm:numericParts.minute,m:String(+numericParts.minute),ss:numericParts.second,s:String(+numericParts.second),fff:String(date.getUTCMilliseconds()).padStart(3,'0'),tt:hour<12?'AM':'PM'};
    return config.pattern.replace(/'([^']*)'|\\(.)|yyyy|MMMM|dddd|MMM|ddd|fff|yy|MM|dd|HH|hh|mm|ss|tt|M|d|H|h|m|s/g,(_,literal,escaped)=>literal??escaped??tokens[_]);
  }
  function parseAndFormat(value,config={kind:'text'},context={}){
    const kind=config.kind||'text';if(!kinds.includes(kind))throw Error('Unknown data type: '+kind);
    if(kind==='text')return {kind,value:String(value??''),text:String(value??'')};
    if(kind==='binary'){
      let bytes;
      if(Array.isArray(value)||value instanceof Uint8Array)bytes=Array.from(value);
      else if(config.encoding==='hex'){const hex=String(value).replace(/\s/g,'');if(!/^(?:[0-9a-f]{2})*$/i.test(hex))throw Error('Invalid hexadecimal byte sequence');bytes=Array.from(hex.match(/../g)||[],pair=>parseInt(pair,16));}
      else if(config.encoding==='base64'){const text=String(value);if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text))throw Error('Invalid base64 data');bytes=Array.from(atob(text),c=>c.charCodeAt(0));}
      else bytes=Array.from(new TextEncoder().encode(String(value??'')));
      if(bytes.some(b=>!Number.isInteger(b)||b<0||b>255))throw Error('Binary data contains an invalid byte');
      return {kind,value:bytes,bytes,text:bytes.map(b=>String.fromCharCode(b)).join('')};
    }
    if(kind==='picture'){
      if(value?.kind==='picture'&&Array.isArray(value.bytes)){if(value.bytes.some(b=>!Number.isInteger(b)||b<0||b>255))throw Error('Picture contains an invalid byte');return {kind,value:structuredClone(value),bytes:[...value.bytes],text:value.bytes.map(b=>String.fromCharCode(b)).join(''),picture:structuredClone(value)};}
      if(!value||typeof value!=='object'||!value.bitmap_hex||!value.bitmap_width||!value.bitmap_height)throw Error('Picture data requires a decoded image');
      return {kind,value:structuredClone(value),text:'',picture:structuredClone(value)};
    }
    if(kind==='date'||kind==='time'){const date=dateValue(value);return {kind,value:date.toISOString(),text:dateText(date,config,context)};}
    const number=numeric(value,config),decimals=config.decimals==null?undefined:Number(config.decimals);
    if(decimals!=null&&(!Number.isInteger(decimals)||decimals<0||decimals>20))throw Error('Decimal places must be from 0 to 20');
    let text;
    if(kind==='fraction')text=fraction(number,config);
    else if(kind==='number'&&config.notation==='hex'){if(!Number.isSafeInteger(number)||number<0)throw Error('Hexadecimal requires a nonnegative safe integer');text=number.toString(16).padStart(Number(config.minimumLength)||0,'0').toUpperCase();}
    else if(kind==='number'&&config.notation==='roman')text=roman(number);
    else if(kind==='number'&&config.notation==='scientific')text=number.toExponential(decimals??3).replace(/e([+-])(\d+)$/,(_,sign,exponent)=>'E'+sign+exponent.padStart(3,'0'));
    else text=new Intl.NumberFormat(config.locale||context.locale||undefined,{style:kind==='currency'?'currency':kind==='percentage'?'percent':'decimal',currency:kind==='currency'?(config.currency||'USD'):undefined,useGrouping:config.grouping!==false,minimumFractionDigits:decimals,maximumFractionDigits:decimals,numberingSystem:config.nativeNumerals?undefined:'latn'}).format(number);
    if(config.lowercase)text=text.toLowerCase();
    return {kind,value:number,text};
  }
  return {kinds,parseAndFormat,numeric};
});
