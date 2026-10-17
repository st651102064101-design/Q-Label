'use strict';
module.exports=function registerSourceIpc({ipcMain,dialog,settings,serialStore}){
  ipcMain.handle('inspect-source-library',async(_event,{path})=>{try{return{ok:true,...await require('./source-library').inspectLibraryFile(path)};}catch(error){return{ok:false,error:error.message};}});
  ipcMain.handle('prepare-source-inputs',async(_event,{template,context={}})=>{
    try{
      const current=settings(),configs=require('./source-serialization').serialConfigs(template),{collectInputs}=require('./source-adapters');
      const previewContext={...context,mode:'preview',globals:current.dataSourceGlobals,libraries:current.dataSourceLibraries},fileCache=new Map();
      if(configs.some(config=>config.start==null)){
        const initial=await collectInputs(template,previewContext,{fileCache});
        for(const config of configs)if(config.start==null){
          if(initial.serializationStarts[config.id]==null)throw Error(initial.sourceErrors[config.id]||'Unable to determine the initial serialization value');
          config.start=initial.serializationStarts[config.id];
        }
      }
      const state=serialStore&&configs.length?await serialStore.peekState(template.sourceDocumentId||template.name,configs):{values:{},positions:{}};
      const inputs=await collectInputs(template,previewContext,{fileCache,serialValues:state.values,serialPositions:state.positions});return{ok:true,inputs};
    }
    catch(error){return{ok:false,error:error.message};}
  });
  ipcMain.handle('choose-source-file',async()=>{const selected=await dialog.showOpenDialog({properties:['openFile'],title:'Select an external data file'});return selected.canceled?{canceled:true}:{path:selected.filePaths[0]};});
  ipcMain.handle('choose-source-directory',async()=>{const selected=await dialog.showOpenDialog({properties:['openDirectory'],title:'Select the default data directory'});return selected.canceled?{canceled:true}:{path:selected.filePaths[0]};});
  ipcMain.handle('compile-source-gs1',async(_event,{entries,symbology})=>{try{return{ok:true,...require('./source-gs1').compileGs1(entries,symbology)};}catch(error){return{ok:false,error:error.message};}});
};
