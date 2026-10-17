'use strict';
const {preparePrintJobAsync}=require('./print-job');
function validateConnection(c={},requireType=false){
  const type=c.type||(!requireType?(c.ip?'ip':c.printer?'printer':c.usb?'usb':''):'');
  if(type==='ip'&&String(c.ip||'').trim()){const port=Number(c.port??9100);if(Number.isInteger(port)&&port>0&&port<=65535)return;}
  if(type==='printer'&&String(c.printer||'').trim())return;
  if(type==='usb'&&String(c.usb||'').trim())return;
  throw Error('Specify a valid printer connection before sending a job.');
}
function defaultStore(){const path=require('path'),os=require('os');const base=process.env.QLABEL_STATE_DIR||path.join(process.env.APPDATA||process.env.XDG_CONFIG_HOME||path.join(os.homedir(),'.config'),'Bratender');return require('./source-serialization').createStore(path.join(base,'source-serialization.json'));}
async function prepare(payload,options={}){return preparePrintJobAsync(payload,options.settings||{}, {...options,reserve:false});}
async function execute(payload,options={}){
  validateConnection(payload.connection);if(typeof options.send!=='function')throw Error('A print transport is required.');
  const serialStore=options.serialStore||defaultStore();let reservation,sending=false;
  try{
    const job=await preparePrintJobAsync(payload,options.settings||{},{...options,serialStore,reserve:true});reservation=job.serialReservation;
    if(options.beforeSend)await options.beforeSend(job);
    sending=true;await options.send(job.zpl,payload.connection);if(reservation)await serialStore.markAccepted(reservation.jobId);return job;
  }catch(error){
    if(reservation){if(sending){await serialStore.markUnknown(reservation.jobId);throw Error('Print outcome is unknown for serialized job '+reservation.jobId+'. Reserved values will not be reused. '+error.message);}await serialStore.markFailed(reservation.jobId,{definitelyNotSent:true});}
    throw error;
  }
}
module.exports={prepare,execute,validateConnection,defaultStore};
