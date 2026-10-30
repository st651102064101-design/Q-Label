'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),net=require('net');
const {query,readProfile,profileMedia,connectionKey,parseMediaModes}=require('../lib/printer-media-profile');
const {preparePrintJob}=require('../lib/print-job');
test('reads printer dots and resolution without feeding or printing',async()=>{
 const commands=[];
 const profile=await readProfile({host:'printer',port:9100},{width_mm:72,gap_y_mm:1.5},async(_h,_p,command)=>{commands.push(command);return command==='~HI'?'\x02ZT411-600dpi,V92.21.39Z,24,8176KB\x03':command.includes('always')?'no':command.includes('media_type')?'gap/notch':'1180';});
 assert.equal(profile.length_dots,1180);assert.equal(profile.dots_per_mm,24);assert.equal(profile.label_height_mm,1180/24);
 assert.ok(!commands.some(c=>c.includes('~JC')||c.includes('^XA')));
 const media=profileMedia(profile);assert.equal(media.height_mm,1180/24);assert.equal(media.width_mm,72);
});
test('rejects overridden or invalid readings instead of remembering guesses',async()=>{
 await assert.rejects(readProfile({host:'p'}, {},async()=> 'yes'),/Calibrate/);
 await assert.rejects(readProfile({host:'p'}, {},async(_h,_p,c)=>c.includes('always')?'no':c.includes('media_type')?'gap/notch':c==='~HI'?'bad':'1180'),/invalid/);
});
test('derives media mode capabilities from printer-reported allcv choices',async()=>{
 const modes=parseMediaModes('media.printmode : tear off, Choices: tear off, peel off, cutter\nother.setting : x, Choices: rewind');
 assert.deepEqual(modes,['T','P','C']);
 const profile=await readProfile({host:'printer',port:9100},{},async(_h,_p,command)=>{
  if(command==='~HI')return '\x02ZT411-300dpi,V92.21.39Z,12,8176KB\x03';
  if(command.includes('always'))return 'no';
  if(command.includes('media_type'))return 'gap/notch';
  if(command.includes('label_length'))return '1180';
  if(command.includes('allcv'))return 'media.printmode : tear off, Choices: tear off, peel off, cutter';
  if(command==='~HS')return '';
  return '';
 });
 assert.deepEqual(profile.capabilities.mediaModes,['T','P','C']);
});
test('remembered profile wins over stale document height, manual mode persists',()=>{
 const connection={type:'printer',printer:'Zebra ZT411 (600 dpi)'},key=connectionKey(connection);
 const template={width_mm:72,height_mm:53.34,dpi:600,elements:[],print_media:{width_mm:72,height_mm:51.5,gap_y_mm:1.5}};
 const settings={printerProfiles:{[key]:{pitch_height_mm:1180/24,length_dots:1180,dots_per_mm:24,tracking:'gap/notch'}}};
 const job=preparePrintJob({template,connection},settings);
 assert.equal(job.template.print_media.height_mm,1180/24);assert.equal(job.template.dpi,609.6);
 assert.ok(!job.zpl.toString().includes('^LL'));
 settings.printerMediaModes={[key]:'manual'};
 assert.equal(preparePrintJob({template,connection},settings).template.print_media.height_mm,51.5);
 assert.equal(connectionKey({type:'ip',ip:'10.0.0.2'}),'ip:10.0.0.2:9100');
});
test('RAW query waits for fragmented quoted responses',async()=>{
 const server=net.createServer(socket=>socket.once('data',()=>{socket.write('"11');setTimeout(()=>socket.end('80"\r\n'),10);}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{assert.equal(await query('127.0.0.1',server.address().port,'! U1 getvar "zpl.label_length"'),'1180');}
 finally{await new Promise(resolve=>server.close(resolve));}
});
