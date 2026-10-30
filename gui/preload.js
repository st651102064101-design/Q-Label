'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const supportsWindowClosePrompt=ipcRenderer.sendSync('window-close-handler-status')===true;

contextBridge.exposeInMainWorld('zebra', {
  listTemplates: () => ipcRenderer.invoke('list-templates'),
  loadTemplateRaw: (file) => ipcRenderer.invoke('load-template-raw', file),
  loadEditHistory: (file) => ipcRenderer.invoke('load-edit-history', file),
  saveEditHistory: (file, history) => ipcRenderer.invoke('save-edit-history', { file, history }),
  saveEditHistorySync: (file, history) => ipcRenderer.sendSync('save-edit-history-sync', { file, history }),
  saveTemplate: (file, json) => ipcRenderer.invoke('save-template', { file, json }),
  createTemplate: async json => {
    try{return await ipcRenderer.invoke('create-template',json);}
    catch(error){
      if(String(error?.message||error).includes("No handler registered for 'create-template'"))return {ok:false,error:'Save your work and restart Q LABEL once to enable safe creation of new projects.'};
      throw error;
    }
  },
  saveTemplateSync: (file, json) => ipcRenderer.sendSync('save-template-sync', { file, json }),
  deleteTemplate: (file) => ipcRenderer.invoke('delete-template', file),
  renameTemplate: (file, name) => ipcRenderer.invoke('rename-template', { file, name }),
  duplicateTemplate: (file, name) => ipcRenderer.invoke('duplicate-template', { file, name }),
  revealTemplate: (file) => ipcRenderer.invoke('reveal-template', file),
  copyTemplatePath: (file) => ipcRenderer.invoke('copy-template-path', file),
  listPrinters: () => ipcRenderer.invoke('list-printers'),
  printerPaperSources: name => ipcRenderer.invoke('printer-paper-sources',name),
  openBarTenderTemplateCloud: () => ipcRenderer.invoke('open-bartender-template-cloud'),
  ensureBarTenderLibraryBtw: (item) => ipcRenderer.invoke('ensure-bartender-library-btw', item),
  getInstalledFontFamilies: () => ipcRenderer.invoke('get-installed-font-families'),
  getPrinterResolution: async name => {
    try{return await ipcRenderer.invoke('get-printer-resolution',name);}
    catch(error){
      // Renderer hot reload cannot install handlers in an already-running main process.
      if(String(error?.message||error).includes("No handler registered for 'get-printer-resolution'")){
        const match=String(name||'').match(/\b(\d{2,4})\s*dpi\b/i),dpi=match?Number(match[1]):null;
        return{code:'APP_RESTART_REQUIRED',...(Number.isInteger(dpi)&&dpi>=72&&dpi<=2400?{dpi,source:'printer-name-fallback'}:{}),notice:dpi?`Using the selected printer queue's nominal resolution (${dpi} dpi). Save your label and restart Q LABEL to read its exact driver resolution.`:'Save your label and restart Q LABEL once to load printer driver support.'};
      }
      throw error;
    }
  },
  pickFile: (kind) => ipcRenderer.invoke('pick-file', kind),
  saveFile: (payload) => ipcRenderer.invoke('save-file', payload),
  savePng: (payload) => ipcRenderer.invoke('save-png', payload),
  savePdf: (payload) => ipcRenderer.invoke('save-pdf', payload),
  copyImage: (payload) => ipcRenderer.invoke('copy-image', payload),
  importAccess: () => ipcRenderer.invoke('import-access'),
  reloadAccess: (file) => ipcRenderer.invoke('reload-access', file),
  database: {
    detect: typeId => ipcRenderer.invoke('database-detect', typeId),
    listDatabases: request => ipcRenderer.invoke('database-list-databases', request),
    pick: request => ipcRenderer.invoke('database-pick', request),
    pickConnectionFile: typeId => ipcRenderer.invoke('database-pick-connection-file', typeId),
    open: request => ipcRenderer.invoke('database-open', request),
    schema: request => ipcRenderer.invoke('database-schema', request),
    read: request => ipcRenderer.invoke('database-read', request),
    refresh: request => ipcRenderer.invoke('database-refresh', request),
    dispose: request => ipcRenderer.invoke('database-dispose', request)
  },
  renderLabelPng: (payload) => ipcRenderer.invoke('render-label-png', payload),
  testConnection: (connection) => ipcRenderer.invoke('test-connection', connection),
  diagnose: (connection) => ipcRenderer.invoke('diagnose', connection),
  qrMatrix: (text) => ipcRenderer.invoke('qr-matrix', text),
  dmImage: (text) => ipcRenderer.invoke('dm-image', text),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (obj) => ipcRenderer.invoke('save-settings', obj),
  rememberPrintRegistration: (payload) => ipcRenderer.invoke('remember-print-registration', payload),
  printRegistrationTest: (payload) => ipcRenderer.invoke('print-registration-test', payload),
  saveSettingsSync: (obj) => ipcRenderer.sendSync('save-settings-sync', obj),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  barcodeCatalog:()=>ipcRenderer.invoke('barcode-catalog'),
  barcodeEncode:spec=>ipcRenderer.invoke('barcode-encode',spec),
  appVersion: () => ipcRenderer.invoke('app-version'),
  supportsWindowClosePrompt,
  approveWindowClose: () => ipcRenderer.send('approve-window-close'),
  revealWindowForClosePrompt: () => ipcRenderer.send('reveal-window-for-close-prompt'),
  setModalWindowActive: active => ipcRenderer.send('modal-window-active', active === true),
  onWindowCloseRequested: (callback) => {
    const listener=()=>callback();
    ipcRenderer.on('window-close-requested',listener);
    return ()=>ipcRenderer.removeListener('window-close-requested',listener);
  },
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
  printerMediaProfile: (payload) => ipcRenderer.invoke('printer-media-profile', payload),
  printerInfo: (name) => ipcRenderer.invoke('print-printer-info', name),
  printerProperties: (payload) => ipcRenderer.invoke('print-printer-properties', payload),
  printerCache: (payload) => ipcRenderer.invoke('print-cache', payload),
  onNewShortcut: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('shortcut-new', listener);
    return () => ipcRenderer.removeListener('shortcut-new', listener);
  },
  onPrintShortcut: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('shortcut-print', listener);
    return () => ipcRenderer.removeListener('shortcut-print', listener);
  },
});
