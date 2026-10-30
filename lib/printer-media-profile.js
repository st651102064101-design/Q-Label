'use strict';
const net=require('net');
function connectionKey(c){return c.type==='printer'?c.printer:`${c.type}:${c.ip||c.usb||''}:${c.port||9100}`;}
function query(host,port,command,quoted=true){
 return new Promise((resolve,reject)=>{
  const socket=net.connect(Number(port)||9100,host);let data='',done=false,idle;
  const finish=(error)=>{if(done)return;done=true;clearTimeout(idle);clearTimeout(deadline);socket.destroy();error?reject(error):resolve(quoted===true?data.match(/"([^"\r\n]*)"/)?.[1]:data);};
  const deadline=setTimeout(()=>finish(data?null:Error('Printer did not return media information.')),8000);
  socket.on('error',finish);socket.on('connect',()=>socket.write(command+'\r\n'));
  socket.on('data',chunk=>{data+=chunk.toString('latin1');if(quoted===true&&/"[^"\r\n]*"/.test(data))finish();else{clearTimeout(idle);idle=setTimeout(()=>finish(),350);}});
  socket.on('end',()=>data?finish():finish(Error('Printer returned no media information.')));
 });
}
function parseAllValues(report=''){
 const values={};
 for(const line of String(report).split(/\r?\n/)){
  const match=line.match(/^\s*([a-z0-9_.\[\]|-]+)\s*:\s*(.*)$/i);if(!match)continue;
  const name=match[1],raw=match[2].replace(/\s*,\s*Choices:.*$/i,'').trim();
  values[name]=/(password|secret|token|credential|community|private|psk|snmp|\.key|key$)/i.test(name)?'[redacted]':raw;
 }
 return values;
}
function parseMediaModes(report=''){
 const line=String(report).split(/\r?\n/).find(row=>/^\s*media\.printmode\s*:/i.test(row));
 const choices=line?.match(/\bChoices\s*:\s*(.*)$/i)?.[1];
 if(!choices)return null;
 const modes=new Set();
 for(const choice of choices.split(',')){
  const normalized=choice.trim().toLowerCase().replace(/[\s_-]+/g,'');
  const mode=({tearoff:'T',peel:'P',peeloff:'P',cutter:'C',rewind:'R'})[normalized];
  if(mode)modes.add(mode);
 }
 return [...modes];
}
function safeAllValuesReport(report=''){
 return String(report).split(/\r?\n/).map(line=>{
  const match=line.match(/^\s*([a-z0-9_.\[\]|-]+)\s*:/i);
  return match&&/(password|secret|token|credential|community|private|psk|snmp|\.key|key$)/i.test(match[1])?`${match[1]} : [redacted]`:line;
 }).join('\n');
}
function parseHostStatus(raw=''){
 const parts=String(raw).split('\x03').map(s=>s.replace(/[\x02\r\n]/g,'').trim()).filter(Boolean);
 const first=parts[0]?.split(',')||[];
 return {raw:String(raw),paper_out:first[1]??null,paused:first[2]??null,label_length_dots:Number(first[3])||null,strings:parts};
}
async function readProfile(target,previous={},queryFn=query){
 const get=name=>queryFn(target.host,target.port,`! U1 getvar "${name}"`);
 const always=await get('zpl.label_length_always');
 if(always!=='no')throw Error('Calibrate & Remember is required: the printer length is currently overridden.');
 const tracking=await get('ezpl.media_type');
 if(!['gap/notch','mark'].includes(tracking))throw Error('Automatic media detection requires gap or black-mark stock.');
 const dots=Number(await get('zpl.label_length'));
 const identity=await queryFn(target.host,target.port,'~HI',false);
 const resolution=identity.match(/\b(6|8|12|24)\s*\/\s*MM\b/i)||identity.match(/^[\s\x02]*[^,]+,[^,]+,(6|8|12|24),/);
 if(!resolution||!Number.isInteger(dots)||dots<1||dots>32000)throw Error('Printer returned invalid length or resolution.');
 const dotsPerMm=Number(resolution[1]);
 const [allValuesResult,statusResult]=await Promise.allSettled([
  queryFn(target.host,target.port,'! U1 getvar "allcv"',false),
  queryFn(target.host,target.port,'~HS',false)
 ]);
 const allValuesRaw=allValuesResult.status==='fulfilled'?allValuesResult.value:'',statusRaw=statusResult.status==='fulfilled'?statusResult.value:'';
 const reportedValues=parseAllValues(allValuesRaw),status=parseHostStatus(statusRaw),mediaModes=parseMediaModes(allValuesRaw);
 const cleanIdentity=identity.replace(/[\x00-\x1f\x7f]/g,'').trim();
 const reportText=[`~HI\n${cleanIdentity}`,`~HS\n${status.raw.trim()}`,`! U1 getvar "allcv"\n${safeAllValuesReport(allValuesRaw)}`].join('\n\n');
 return {source:'printer',host:target.host,port:target.port||9100,tracking,length_dots:dots,dots_per_mm:dotsPerMm,label_height_mm:dots/dotsPerMm,read_at:new Date().toISOString(),width_mm:previous.width_mm,gap_y_mm:previous.gap_y_mm,reported_at:new Date().toISOString(),reported_values:reportedValues,reported_values_count:Object.keys(reportedValues).length,reported_values_text:reportText,reported_values_error:allValuesResult.status==='rejected'?allValuesResult.reason.message:null,host_status:status,host_status_error:statusResult.status==='rejected'?statusResult.reason.message:null,host_identity:cleanIdentity,...(mediaModes?{capabilities:{mediaModes}}:{})};
}
function profileMedia(profile,base={}){
 const width=Number(base.width_mm||profile.width_mm),gap=Math.max(0,Number(base.gap_y_mm??profile.gap_y_mm)||0);
 // zpl.label_length is the calibrated label length, not a pitch from which
 // another gap must be deducted. Older profiles stored it under pitch_height_mm.
 const height=Number(profile.label_height_mm??profile.length_dots/profile.dots_per_mm);
 if(!(width>0&&height>0))throw Error('Select a stock with a valid width and gap.');
 return {...base,width_mm:width,height_mm:height,gap_y_mm:gap,pitch_height_mm:height+gap,calibrated_label_dots:profile.length_dots,calibrated_dots_per_mm:profile.dots_per_mm,fit:'fill',source:'printer'};
}
module.exports={query,connectionKey,readProfile,profileMedia,parseAllValues,parseMediaModes,parseHostStatus,safeAllValuesReport};
