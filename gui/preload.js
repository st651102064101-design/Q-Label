'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zebra', {
  listTemplates: () => ipcRenderer.invoke('list-templates'),
  loadTemplateRaw: (file) => ipcRenderer.invoke('load-template-raw', file),
  saveTemplate: (file, json) => ipcRenderer.invoke('save-template', { file, json }),
  saveTemplateSync: (file, json) => ipcRenderer.sendSync('save-template-sync', { file, json }),
  deleteTemplate: (file) => ipcRenderer.invoke('delete-template', file),
  renameTemplate: (file, name) => ipcRenderer.invoke('rename-template', { file, name }),
  duplicateTemplate: (file, name) => ipcRenderer.invoke('duplicate-template', { file, name }),
  revealTemplate: (file) => ipcRenderer.invoke('reveal-template', file),
  copyTemplatePath: (file) => ipcRenderer.invoke('copy-template-path', file),
  listPrinters: () => ipcRenderer.invoke('list-printers'),
  getInstalledFontFamilies: () => ipcRenderer.invoke('get-installed-font-families'),
  pickFile: (kind) => ipcRenderer.invoke('pick-file', kind),
  saveFile: (payload) => ipcRenderer.invoke('save-file', payload),
  savePng: (payload) => ipcRenderer.invoke('save-png', payload),
  renderLabelPng: (payload) => ipcRenderer.invoke('render-label-png', payload),
  testConnection: (connection) => ipcRenderer.invoke('test-connection', connection),
  diagnose: (connection) => ipcRenderer.invoke('diagnose', connection),
  qrMatrix: (text) => ipcRenderer.invoke('qr-matrix', text),
  dmImage: (text) => ipcRenderer.invoke('dm-image', text),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (obj) => ipcRenderer.invoke('save-settings', obj),
  saveSettingsSync: (obj) => ipcRenderer.sendSync('save-settings-sync', obj),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  appVersion: () => ipcRenderer.invoke('app-version'),
  openTemplatesFolder: () => ipcRenderer.invoke('open-templates-folder'),
  serverStart: () => ipcRenderer.invoke('server-start'),
  serverStop: () => ipcRenderer.invoke('server-stop'),
  serverStatus: () => ipcRenderer.invoke('server-status'),
  print: (payload) => ipcRenderer.invoke('print', payload),
  preparePrintJob: (payload) => ipcRenderer.invoke('prepare-print-job', payload),
  prepareSourceInputs: async payload => {try{return await ipcRenderer.invoke('prepare-source-inputs',payload);}catch(error){return {ok:false,error:String(error.message).includes('No handler registered')?'Save your work and restart Q LABEL to enable external data sources.':error.message};}},
  chooseSourceFile: () => ipcRenderer.invoke('choose-source-file'),
  chooseSourceDirectory: () => ipcRenderer.invoke('choose-source-directory'),
  inspectSourceLibrary: path => ipcRenderer.invoke('inspect-source-library',{path}),
  compileSourceGs1: payload => ipcRenderer.invoke('compile-source-gs1',payload),
  printerInfo: (name) => ipcRenderer.invoke('print-printer-info', name),
  printerProperties: (payload) => ipcRenderer.invoke('print-printer-properties', payload),
  printerCache: (payload) => ipcRenderer.invoke('print-cache', payload),
  onPrintShortcut: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('shortcut-print', listener);
    return () => ipcRenderer.removeListener('shortcut-print', listener);
  },
});
