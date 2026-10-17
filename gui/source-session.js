(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./source-model'),require('./source-resolver'));else root.SourceSession=factory(root.SourceModel,root.SourceResolver);})(typeof globalThis!=='undefined'?globalThis:this,function(Model,Resolver){
  'use strict';
  function createSession(document){
    let draft=Model.migrate(document),revision=0,closed=false,request=0;
    const ensure=()=>{if(closed)throw Error('Source session is closed');};
    return {
      get draft(){return structuredClone(draft);},get revision(){return revision;},
      update(mutator){ensure();const next=structuredClone(draft);mutator(next);Model.validate(next);draft=Model.syncCaches(next);revision++;},
      evaluate(context){ensure();return Resolver.evaluateDocument(draft,{...context,revision});},
      async evaluateAsync(context,collectInputs){
        ensure();const token=++request,startRevision=revision,snapshot=structuredClone(draft);
        try{const prepared=await collectInputs(snapshot,{...context,revision:startRevision});if(closed||revision!==startRevision||token!==request)return null;return Resolver.evaluateDocument(snapshot,{...context,...prepared,inputs:{...context.inputs,...prepared?.inputs},revision:startRevision});}
        catch(error){if(closed||revision!==startRevision||token!==request)return null;throw error;}
      },
      commit(){ensure();Model.validate(draft);closed=true;return structuredClone(draft);},
      cancel(){closed=true;request++;}
    };
  }
  return {createSession};
});
