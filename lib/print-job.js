'use strict';
const crypto = require('crypto');
const { calibrateZpl, normalizeCalibration } = require('./print-calibration');
const { buildLabel } = require('./render');
const { printableElement } = require('./zpl');
const { normalizeTemplate, fitToPrinterPrintableArea, printerLabelTopDots } = require('../gui/print-geometry');

function integer(value, fallback, min, max, name) {
  const n = value == null || value === '' ? fallback : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${name} must be a whole number from ${min} to ${max}.`);
  return n;
}
function preparePrintJob(payload, settings = {}) {
  if (!payload.template || !Array.isArray(payload.template.elements)) throw new Error('Select or create a label before printing.');
  const connection = payload.connection || {};
  const normalized = normalizeTemplate(payload.template, connection);
  const dpi = normalized.dpi || 203;
  const calibration = normalizeCalibration(settings.printCalibration);
  const offsetX = Number(payload.offsetX || 0) + calibration.offsetX, offsetY = Number(payload.offsetY || 0) + calibration.offsetY;
  if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) throw new Error('Enter valid print offsets.');
  const labelTop = printerLabelTopDots(connection, dpi, settings) + Math.round(offsetY * dpi / 25.4 / (dpi === 600 ? 2 : 1));
  if (Math.abs(labelTop) > 120) throw new Error('The vertical offset exceeds the printer’s ±120 step limit.');
  const actualOffsetYmm=labelTop*25.4/dpi*(dpi===600?2:1);
  const fitForJob=source=>normalizeTemplate(source,connection);
  const template = fitForJob(payload.template);
  const copies = integer(payload.copies, 1, 1, 10000, 'Copies');
  const records = Array.isArray(payload.rows) && payload.rows.length ? payload.rows : [payload.data || {}];
  const serial = payload.serialization;
  const serialCount = serial?.enabled ? integer(serial.count, 1, 1, 10000, 'Serialized labels') : 1;
  if (serial?.enabled && (!serial.field || !Number.isFinite(Number(serial.start)) || !Number.isFinite(Number(serial.step)))) throw new Error('Select a serial field and enter a valid start and increment.');
  const dataList = [];
  const total = payload.multiField && Array.isArray(payload.multiItems)
    ? records.length * payload.multiItems.reduce((sum, item) => sum + integer(item.qty, 0, 0, 10000, 'Quantity'), 0) * copies
    : records.length * serialCount * copies;
  if (total > 10000) throw new Error('A print job may contain no more than 10,000 pages.');
  for (const row of records) {
    if (payload.multiField && Array.isArray(payload.multiItems)) {
      for (const item of payload.multiItems) for (let n = 0; n < integer(item.qty, 0, 0, 10000, 'Quantity') * copies; n++) dataList.push({ ...payload.data, ...row, [payload.multiField]: item.value });
    } else {
      for (let s = 0; s < serialCount; s++) {
        const data = { ...payload.data, ...row };
        if (serial?.enabled) data[serial.field] = String(Number(serial.start) + s * Number(serial.step));
        for (let n = 0; n < copies; n++) dataList.push(data);
      }
    }
    if (dataList.length > 10000) throw new Error('A print job may contain no more than 10,000 pages.');
  }
  if (!dataList.length) throw new Error('There are no selected records to print.');
  const opts = { enabledIndices: payload.enabledIndices, darkness: payload.darkness, speed: payload.speed,
    labelTopDots: labelTop, labelShiftDots: -Math.round(offsetX * dpi / 25.4), optimizeCopies: payload.performance?.variableData !== false };
  const signature=data=>JSON.stringify(Object.keys(data).sort().map(k=>[k,data[k]]));
  if (Array.isArray(payload.recordTemplates)) {
    const graphics = new Map(payload.recordTemplates.map(item => [signature(item.data), fitForJob(item.template)]));
    opts.templateForData=data=>graphics.get(signature(data))||template;
  }
  const zpl = calibrateZpl(buildLabel(template, dataList, opts), calibration);
  const previewTemplates = [];
  const previewIndexes = [], seen = new Map();
  for (const data of dataList) {
    const sig=signature(data);let index=seen.get(sig);
    if(index==null){const t=opts.templateForData?opts.templateForData(data):template;const preview={...t,elements:t.elements.map((e,i)=>e.enabled===false||Array.isArray(opts.enabledIndices)&&!opts.enabledIndices.includes(i)?e:printableElement(e,t,data,0,0))};index=previewTemplates.length;previewTemplates.push(preview);seen.set(sig,index);}
    previewIndexes.push(index);
  }
  return { calibration, template, dataList, previewTemplates, previewIndexes, zpl, count: dataList.length, labels: dataList.length * (template.page?.enabled ? template.page.rows * template.page.columns : 1), offsetX, offsetY:labelTop*25.4/dpi*(dpi===600?2:1) };
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
module.exports={preparePrintJob,cachePrintJob};
