'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PageSetupCapabilities=api;
})(typeof window!=='undefined'?window:globalThis,()=>{
  const modes=['T','P','C','R'];
  const labels={T:'Tear-off',P:'Peel-off',C:'Cutter',R:'Rewind'};
  function connectionKey(connection={}){
    if(connection.type==='printer')return connection.printer||'';
    return `${connection.type||''}:${connection.ip||connection.usb||''}:${connection.port||9100}`;
  }
  function resolveMediaModes(connection,profiles={}){
    const profile=profiles?.[connectionKey(connection)];
    const confirmed=profile?.capabilities?.mediaModes;
    return Object.fromEntries(modes.map(mode=>{
      if(mode==='T')return[mode,{state:'supported',reason:'Tear-off is supported by the Q LABEL ZPL output path.'}];
      if(!Array.isArray(confirmed))return[mode,{state:'unknown',reason:`${labels[mode]} is disabled because the selected printer profile does not confirm support.`}];
      if(confirmed.includes(mode))return[mode,{state:'supported',reason:`${labels[mode]} is confirmed by the selected printer profile.`}];
      return[mode,{state:'unsupported',reason:`${labels[mode]} is not supported by the selected printer profile.`}];
    }));
  }
  return{connectionKey,resolveMediaModes};
});
