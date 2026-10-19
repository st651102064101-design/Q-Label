'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const legacy=['test/data-sources.js','test/print-job.js','test/smoke.js'];
const TEST_TIMEOUT_MS=900000;
function discover(root){
  const result=[];
  const walk=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())walk(file);else if(entry.isFile()&&entry.name.endsWith('.test.js'))result.push(path.relative(root,file).split(path.sep).join('/'));}};
  walk(path.join(root,'test'));return result.sort();
}
function undocumented(files,document){return files.filter(file=>!document.includes('`'+file+'`'));}
function main(){
  const root=path.resolve(__dirname,'..'),files=discover(root),document=fs.readFileSync(path.join(root,'UNIT_TEST_BASIC.md'),'utf8'),missing=undocumented([...files,...legacy],document);
  const stages=[],logs=[],version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).displayVersion;
  const commands=[{name:'all-unit-tests',args:['--test','--test-concurrency=1','--test-reporter=tap',...files]},...legacy.map(file=>({name:file,args:[file]}))];
  for(const command of commands){
    const start=Date.now();console.log('\nRunning '+command.name);
    const result=spawnSync(process.execPath,command.args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,timeout:TEST_TIMEOUT_MS,windowsHide:true});
    const output=(result.stdout||'')+(result.stderr||'');process.stdout.write(output);logs.push('COMMAND: node '+command.args.join(' ')+'\n'+output+(result.error?'\n'+result.error.stack:'')+'\n');
    const counts={};for(const [,key,value]of output.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\s*$/gm))counts[key]=Number(value);
    stages.push({name:command.name,args:command.args,exitCode:result.status,signal:result.signal,error:result.error?.message,durationMs:Date.now()-start,counts,passed:result.status===0&&!result.error});
  }
  const report={timestamp:new Date().toISOString(),version,command:'npm run test:basic',unitFiles:files,legacyFiles:legacy,undocumentedFiles:missing,stages,passedAllStages:files.length>0&&missing.length===0&&stages.every(stage=>stage.passed)};
  fs.writeFileSync(path.join(root,'test/basic-unit-result.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(root,'test/basic-unit-output.log'),logs.join('\n'));
  if(missing.length)console.error('Unit test files missing from UNIT_TEST_BASIC.md: '+missing.join(', '));
  console.log('\nBasic suite: '+(report.passedAllStages?'PASS':'FAIL')+'. Report: test/basic-unit-result.json');
  process.exitCode=report.passedAllStages?0:1;
}
module.exports={discover,undocumented,legacy,TEST_TIMEOUT_MS};if(require.main===module)main();
