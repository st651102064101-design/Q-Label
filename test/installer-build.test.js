'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('NSIS installer custom script creates the application folder after directory selection',()=>{
  const nsh=fs.readFileSync(path.join(__dirname,'../build/installer.nsh'),'utf8');
  assert.match(nsh,/customPageAfterChangeDir/);
  assert.match(nsh,/CreateDirectory "\$INSTDIR"/);
  assert.match(nsh,/CreateDirectory "\$INSTDIR"/);
  assert.doesNotMatch(nsh,/StrContains\.nsh/,'avoid duplicate StrContains include during uninstaller build');
  const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'../package.json'),'utf8'));
  assert.equal(pkg.build.nsis.include,'build/installer.nsh');
  assert.match(pkg.build.win.artifactName,/Q Label Setup \$\{version\}/);
});
