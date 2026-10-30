'use strict';
const crypto = require('crypto');
const { calibrateZpl, normalizeCalibration } = require('./print-calibration');
const { buildLabel } = require('./render');
const { printableElement } = require('./zpl');
const ObjectPropertyValues=require('../gui/object-property-values');
const {resolve:resolveDataSources}=require('../gui/data-source-engine');
const { normalizeTemplate, fitToPrinterPrintableArea, printerLabelTopDots } = require('../gui/print-geometry');

function integer(value, fallback, min, max, name) {
  const n = value == null || value === '' ? fallback : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${name} must be a whole number from ${min} to ${max}.`);
  return n;
}
function preparePrintJob(payload, settings = {}, preparation = {}) {
  if (!payload.template || !Array.isArray(payload.template.elements)) throw new Error('Select or create a label before printing.');
  const connection = payload.connection || {};
  const profileKey=require('./printer-media-profile').connectionKey(connection),profile=settings.printerProfiles?.[profileKey];
  const automatic=profile&&settings.printerMediaModes?.[profileKey]!=='manual';
  const printConnection=automatic?{...connection,resolution_dpi:Math.round(profile.dots_per_mm*25.4*1000)/1000}:connection;
  const normalized = normalizeTemplate(payload.template, printConnection);
  const dpi = normalized.dpi || 203;
  const calibration = normalizeCalibration(settings.printCalibration);
  const offsetX = Number(payload.offsetX || 0) + calibration.offsetX, offsetY = Number(payload.offsetY || 0) + calibration.offsetY;
  if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) throw new Error('Enter valid print offsets.');
  let labelTop = printerLabelTopDots(connection, dpi, settings);
  if(Math.abs(labelTop)>120)throw Error('Printer feed offset exceeds ±120 steps. Adjust the printer feed setting.');
  const paperHeight=normalized.page?.enabled?normalized.page.height_mm:normalized.height_mm;
  if(Math.abs(offsetY)>=paperHeight)throw Error(`Vertical offset ${offsetY} mm exceeds the ${paperHeight} mm label height. Enter a smaller offset in mm (for example 0.85 for 0.85 mm).`);
  const actualOffsetYmm=offsetY+labelTop*25.4/dpi*(dpi>=600?2:1);
  const fitForJob=source=>{
    let media=require('./measured-media').correctMedia(source.print_media||settings.printerMedia?.[profileKey],connection.printer);
    if(profile&&settings.printerMediaModes?.[profileKey]!=='manual')media=require('./printer-media-profile').profileMedia(profile,media||{width_mm:source.width_mm,gap_y_mm:source.stock?.gap_mm||0});
    const result=normalizeTemplate({...source,print_media:media},printConnection);
    if(automatic)result.media_tracking=profile.tracking==='mark'?'M':'Y';
    return result;
  };
  const template = fitForJob(payload.template);
  const mediaMode=template.print_mode||'T';
  const modeCapability=require('../gui/page-setup-capabilities').resolveMediaModes(connection,settings.printerProfiles||{})[mediaMode];
  if(modeCapability?.state!=='supported')template.print_mode='T';
  const registrationKey=require('../gui/photo-registration').mediaSignature(template.print_media||{width_mm:template.width_mm,height_mm:template.height_mm},automatic?profile:{});
  const registration=settings.printRegistrations?.[profileKey]?.[registrationKey];
  if(automatic&&!registration&&Object.values(settings.printRegistrations?.[profileKey]||{}).some(r=>r.enabled!==false))throw Error('The detected label size has changed. Remember a photo alignment for this stock, or switch to Manual size mode.');
  const alignment=registration?.enabled!==false&&registration?normalizeCalibration(registration):normalizeCalibration();
  // Photo alignment reverses the measured printer-to-sticker mapping. Preview
  // shows expected physical output, so it retains the authored geometry.
  if(registration&&registration.enabled!==false){
    if(template.print_orientation==='inverted'||template.mirror)throw Error('Photo alignment currently requires normal orientation without mirroring.');
    if(alignment.offsetX<0)throw Error('The sticker extends past the printhead origin. Reposition the media before applying photo alignment.');
    // A refinement from an actual printed design keeps its observed feed
    // setting fixed. Apply its residual shift in native raster coordinates.
    const feed=registration.label_top_dots;
    if(feed!=null&&(!Number.isInteger(feed)||Math.abs(feed)>120))throw Error('Invalid saved alignment label-top setting.');
    labelTop+=feed!=null?feed:Math.round(alignment.offsetY*dpi/25.4/(dpi>=600?2:1));
    if(Math.abs(labelTop)>120)throw Error('Photo alignment exceeds the printer label-top range.');
    const registeredHeight=Number(template.print_media?.height_mm||template.height_mm);
    if(registeredHeight*alignment.scaleY/100>registeredHeight+.05)throw Error('Photo alignment would exceed the calibrated feed length. Recalibrate the printer before using this photo.');
  }
  const wireCalibration={...calibration,scaleX:calibration.scaleX*alignment.scaleX/100,scaleY:calibration.scaleY*alignment.scaleY/100};
  const copies = integer(payload.copies, 1, 1, 10000, 'Copies');
  const records = Array.isArray(payload.rows) && payload.rows.length ? payload.rows : [payload.data || {}];
  const serial = payload.serialization;
  const sourceSerial = serial?.enabled && !serial.field && require('../gui/data-source-engine').hasSerialization(template);
  const serialCount = serial?.enabled ? integer(serial.count, 1, 1, 10000, 'Serialized labels') : 1;
  if (serial?.enabled && !sourceSerial && (!serial.field || !Number.isFinite(Number(serial.start)) || !Number.isFinite(Number(serial.step)))) throw new Error('Select a serial field and enter a valid start and increment.');
  const dataList = [],dataContexts=[];
  const appendData=(data,recordIndex,copyIndex,serialIndex)=>{dataList.push(data);dataContexts.push({recordIndex,copyIndex,...(sourceSerial?{serialIndex}: {})});};
  const total = payload.multiField && Array.isArray(payload.multiItems)
    ? records.length * payload.multiItems.reduce((sum, item) => sum + integer(item.qty, 0, 0, 10000, 'Quantity'), 0) * copies
    : records.length * serialCount * copies;
  if (total > 10000) throw new Error('A print job may contain no more than 10,000 pages.');
  for (const [recordIndex,row] of records.entries()) {
    if (payload.multiField && Array.isArray(payload.multiItems)) {
      for (const item of payload.multiItems) for (let n = 0; n < integer(item.qty, 0, 0, 10000, 'Quantity') * copies; n++) appendData({ ...payload.data, ...row, [payload.multiField]: item.value },recordIndex,n%copies);
    } else {
      for (let s = 0; s < serialCount; s++) {
        const data = { ...payload.data, ...row };
        if (serial?.enabled && !sourceSerial) data[serial.field] = String(Number(serial.start) + s * Number(serial.step));
        for (let n = 0; n < copies; n++) appendData(data,recordIndex,n,recordIndex*serialCount+s);
      }
    }
    if (dataList.length > 10000) throw new Error('A print job may contain no more than 10,000 pages.');
  }
  if (!dataList.length) throw new Error('There are no selected records to print.');
  const timestamp=Number(payload.now??Date.now());
  if(!Number.isFinite(timestamp))throw new Error('Print job time must be a valid timestamp.');
  if(preparation.planOnly)return {template,dataList,dataContexts,timestamp,copies,records:records.length,serialTotal:sourceSerial&&!(payload.multiField&&Array.isArray(payload.multiItems))?records.length*serialCount:dataList.length};
  dataList.forEach((data,index)=>{dataList[index]=resolveDataSources(template,data,{mode:'print',index,serialIndex:dataContexts[index].serialIndex,...(template.dataSourceSchemaVersion===1?{...dataContexts[index],legacyRecordIndex:index}:{}),total:dataList.length,copies,now:timestamp,printer:connection.printer||connection.host||'',file:payload.file||'',globals:settings.dataSourceGlobals,preparedSources:payload.sourceInputs,preparedTransforms:payload.sourceTransformInputs,libraries:settings.dataSourceLibraries,...payload.sourceSnapshots?.[index]});});
  const opts = { enabledIndices: payload.enabledIndices, darkness: payload.darkness, speed: payload.speed,
    labelTopDots: labelTop, labelShiftDots: -Math.round(offsetX * alignment.scaleX/100 * dpi / 25.4), optimizeCopies: payload.performance?.variableData !== false };
  const signature=data=>JSON.stringify(Object.keys(data).sort().map(k=>[k,data[k]]));
  if (Array.isArray(payload.recordTemplates)) {
    const graphics = new Map(payload.recordTemplates.map(item => [signature(item.data), fitForJob(item.template)]));
    opts.templateForData=data=>{const graphic=graphics.get(signature(data));if(!graphic)throw Error('Print image does not match the current record. Prepare the print preview again.');return graphic;};
  }
  const rasterShift=registration?.enabled!==false&&registration?Number(registration.raster_offset_y_mm||0):0;
  if(!Number.isFinite(rasterShift)||rasterShift<0)throw Error('Invalid saved alignment raster offset.');
  const zpl = calibrateZpl(buildLabel(template, dataList, opts), wireCalibration, Math.round((offsetY*alignment.scaleY/100+rasterShift)*dpi/25.4),Math.round(alignment.offsetX*dpi/25.4));
  const fullGraphic=Array.isArray(payload.recordTemplates)||template.elements.length===1&&template.elements[0].type==='image'&&template.elements[0].bitmap_hex;
  if(registration&&registration.enabled!==false&&fullGraphic)require('./print-calibration').validateRegisteredRaster(zpl,registration,{dotsPerMm:dpi/25.4,labelTopMm:labelTop*25.4/dpi*(dpi>=600?2:1),shiftXMm:offsetX*alignment.scaleX/100,widthMm:Number(template.print_media?.width_mm||template.width_mm),heightMm:Number(template.print_media?.height_mm||template.height_mm)});
  // Negative ZPL field origins are invalid; firmware can reuse/default an
  // origin and stack unrelated objects. Never send a silently corrupt layout.
  for (const match of zpl.toString('ascii').matchAll(/\^(?:FO|FT)(-?\d+),(-?\d+)/g)) {
    if (Number(match[1]) < 0 || Number(match[2]) < 0) {
      throw new Error('Print position is outside the paper. Reset Print Calibration offsets to 0 mm and scale to 100%, or move the object inside the paper.');
    }
  }
  const previewTemplates = [];
  const previewIndexes = [], seen = new Map();
  for (const data of dataList) {
    const sig=signature(data);let index=seen.get(sig);
    if(index==null){const t=opts.templateForData?opts.templateForData(data):template;const preview={...t,elements:t.elements.map((e,i)=>!ObjectPropertyValues.shouldPrintObject(e,{mode:'print',values:data})?{...e,enabled:false}:e.enabled===false||Array.isArray(opts.enabledIndices)&&!opts.enabledIndices.includes(i)?e:printableElement(e,t,data,0,0))};index=previewTemplates.length;previewTemplates.push(preview);seen.set(sig,index);}
    previewIndexes.push(index);
  }
  return { calibration, registration:registration&&registration.enabled!==false?registration:null, registrationKey, template, dataList, previewTemplates, previewIndexes, zpl, count: dataList.length, labels: dataList.length * (template.page?.enabled ? template.page.rows * template.page.columns : 1), offsetX, offsetY:actualOffsetYmm };
}

// Downloads belong to ZebraBar's ZB namespace in volatile printer RAM.
// Preview/file export always retain inline graphics and complete formats.
function cachePrintJob(zpl, known = new Map(), options = {}) {
  const downloads = new Map(), used = new Map();
  const nameFor = (body, ext) => 'R:ZB' + crypto.createHash('sha256').update(body).digest('hex').slice(0, 6).toUpperCase() + '.' + ext;
  let text = zpl.toString('ascii');
  if (options.graphics || options.staticGraphics) {
    text = text.replace(/\^GFA,(\d+),(\d+),(\d+),([0-9A-F]+)\^FS/g, (match,total,usedBytes,stride,hex) => {
      const name=nameFor(stride+':'+hex,'GRF');
      const entry={name,type:'Graphic',bytes:Number(total),download:`~DG${name},${total},${stride},${hex}\n`};
      used.set(name,entry);if(!options.graphics||!known.has(name))downloads.set(name,entry);
      return `^XG${name},1,1^FS`;
    });
  }
  if (options.templates || options.staticObjects) {
    text=text.replace(/\^XA\s*([\s\S]*?)\^XZ/g,(match,body)=>{
      const quantity=(body.match(/\^PQ[^\r\n]+/)||['^PQ1'])[0];
      const format=body.replace(/\^PQ[^\r\n]+/g,'');
      const name=nameFor(format,'ZPL');const entry={name,type:'Format',bytes:Buffer.byteLength(format),download:`^XA\n^DF${name}^FS\n${format}\n^XZ\n`};
      used.set(name,entry);if(!options.templates||!known.has(name))downloads.set(name,entry);
      return `^XA\n^XF${name}^FS\n${quantity}\n^XZ`;
    });
  }
  const transient=[...used.values()].filter(e=>e.type==='Graphic'?!options.graphics:!options.templates);
  const cleanup=transient.length?`\n^XA${transient.map(e=>`^ID${e.name}^FS`).join('')}^XZ`:'';
  return { zpl:Buffer.from([...downloads.values()].map(e=>e.download).join('')+text+cleanup,'ascii'),entries:[...used.values()].filter(e=>e.type==='Graphic'?options.graphics:options.templates) };
}
async function preparePrintJobAsync(payload,settings={},options={}){
  if(payload.template?.dataSourceSchemaVersion!==1)return preparePrintJob(payload,settings);
  const plan=preparePrintJob(payload,settings,{planOnly:true}),fileCache=new Map(),configs=require('./source-serialization').serialConfigs(plan.template,{total:plan.serialTotal,records:plan.records,copies:plan.copies}),documentId=plan.template.sourceDocumentId||payload.file||plan.template.name;
  let serialValues=options.serialValues||{},serialPositions=options.serialPositions||{},reservation;
  const sourceContext=index=>({mode:'print',inputs:plan.dataList[index],index,...plan.dataContexts[index],legacyRecordIndex:index,copies:plan.copies,total:plan.dataList.length,now:plan.timestamp,printer:payload.connection?.printer||payload.connection?.host||'',file:payload.file||'',globals:settings.dataSourceGlobals,libraries:settings.dataSourceLibraries,pctFields:payload.pctFields});
  if(configs.some(config=>config.start==null)){
    const initial=await require('./source-adapters').collectInputs(plan.template,sourceContext(0),{fileCache});
    for(const config of configs)if(config.start==null){if(initial.serializationStarts[config.id]==null)throw Error(initial.sourceErrors[config.id]||'Unable to determine the initial serialization value');config.start=initial.serializationStarts[config.id];}
  }
  if(options.serialStore&&configs.length){const state=await options.serialStore.peekState(documentId,configs);serialValues=state.values;serialPositions=state.positions;}
  async function compile(){const sourceSnapshots=[];
    for(let index=0;index<plan.dataList.length;index++)sourceSnapshots.push(await require('./source-adapters').collectInputs(plan.template,sourceContext(index),{...options,fileCache,serialValues,serialPositions}));
    return preparePrintJob({...payload,now:plan.timestamp,sourceSnapshots},settings);
  }
  let job=await compile();
  if(options.reserve&&options.serialStore&&configs.length){
    reservation=await options.serialStore.reserve(documentId,options.jobId||crypto.randomUUID(),configs);
    if(reservation.status!=='reserved')throw Error('This serialized print job has already been completed: '+reservation.jobId);
    if(JSON.stringify(reservation.values)!==JSON.stringify(serialValues)||JSON.stringify(reservation.positions)!==JSON.stringify(serialPositions)){serialValues=reservation.values;serialPositions=reservation.positions;try{job=await compile();}catch(error){await options.serialStore.markFailed(reservation.jobId,{definitelyNotSent:true});throw error;}}
    job.serialReservation=reservation;
  }
  return job;
}
module.exports={preparePrintJob,preparePrintJobAsync,cachePrintJob};
