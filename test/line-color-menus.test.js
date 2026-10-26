'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const LineDash=require('../gui/line-dash'),Layout=require('../gui/object-layout'),LineMenus=require('../gui/line-menus'),ColorPicker=require('../gui/color-picker'),ToolMenus=require('../gui/tool-menus');

test('dash presets match the Border dash table and scale with line width',()=>{
  assert.deepEqual(LineDash.DASHES,Layout.dashes);
  assert.deepEqual(LineDash.dashArray({line_style:'dash',dash_pattern:3,thickness_mm:.5}),[1.5,.5]);
  assert.deepEqual(LineDash.dashArray({line_style:'dash'}),[2,1]);
  assert.deepEqual(LineDash.dashArray({line_style:'dot'}),[.4,.8]);
  assert.deepEqual(LineDash.dashArray({line_style:'solid',dash_pattern:3}),[]);
  assert.match(LineDash.svgAttr({line_style:'dash',dash_pattern:2,thickness_mm:1}),/stroke-dasharray="2 1"/);
});

test('dash menu selection maps to stored fields and back',()=>{
  assert.deepEqual(LineDash.fieldsFor(0),{line_style:'solid',dash_pattern:0});
  assert.deepEqual(LineDash.fieldsFor(5),{line_style:'dash',dash_pattern:5});
  assert.deepEqual(LineDash.fieldsFor(-1),{line_style:'erase',dash_pattern:0});
  assert.deepEqual(LineDash.fieldsFor(999),{line_style:'solid',dash_pattern:0});
  assert.equal(LineDash.selectedIndex({line_style:'erase'}),-1);
  assert.equal(LineDash.selectedIndex({line_style:'dash',dash_pattern:5}),5);
  assert.equal(LineDash.selectedIndex({line_style:'dash'}),2);
  assert.equal(LineDash.selectedIndex({}),0);
});

test('line width presets convert between pt and mm',()=>{
  assert.equal(LineMenus.PT_PRESETS[0],.5);assert.ok(LineMenus.PT_PRESETS.includes(11));
  assert.equal(LineMenus.ptLabel(1),'1.0 pt');
  assert.ok(Math.abs(LineMenus.ptToMm(72)-25.4)<1e-9);
  assert.ok(Math.abs(LineMenus.mmToPt(LineMenus.ptToMm(3))-3)<1e-9);
});

test('color wheel has 127 unique-position cells and normalised hex output',()=>{
  const cells=ColorPicker.wheelCells();
  assert.equal(cells.length,127);
  assert.equal(cells.find(c=>c.ring===0).color,'#ffffff');
  assert.ok(cells.every(c=>/^#[0-9a-f]{6}$/.test(c.color)));
  assert.equal(ColorPicker.greyCells().length,15);
  assert.equal(ColorPicker.normalise('FF00aa'),'#ff00aa');
  assert.equal(ColorPicker.normalise('none'),null);
  assert.equal(ColorPicker.hslToHex(0,1,.5),'#ff0000');
});

test('library search filters by name and never invents entries',()=>{
  const list=[{name:'Palette Red',hex:'#f00'},{name:'Palette Blue',hex:'#00f'}];
  assert.deepEqual(ColorPicker.filterLibrary(list,'blue').map(i=>i.name),['Palette Blue']);
  assert.equal(ColorPicker.filterLibrary(list,'').length,2);
  assert.deepEqual(ColorPicker.recentColors(),[]);
});

test('Text and Picture menus disable every feature Q LABEL cannot perform',()=>{
  const text=ToolMenus.textSections(),picture=ToolMenus.pictureSections();
  const enabled=sections=>sections.filter(i=>!i.heading&&!i.disabled).map(i=>i.text);
  assert.deepEqual(enabled(text),['Normal','Normal Wrapped','Symbol Font Character']);
  assert.deepEqual(enabled(picture),['Insert from File…']);
  assert.equal(text.filter(i=>i.grid).length,16);
  assert.ok(text.filter(i=>i.grid).every(i=>i.disabled));
  for(const key of ['normal','wrapped','symbol','file'])assert.equal(typeof ToolMenus.actions[key],'function');
});

test('HSV/RGB conversion round-trips for the in-popup custom colour view',()=>{
  assert.deepEqual(ColorPicker.hsvToRgb(0,1,1),[255,0,0]);
  assert.deepEqual(ColorPicker.hsvToRgb(120,1,1),[0,255,0]);
  assert.deepEqual(ColorPicker.hsvToRgb(0,0,1),[255,255,255]);
  for(const rgb of [[12,200,99],[255,0,128],[0,0,0],[255,255,255],[34,34,34]]){
    const [h,s,v]=ColorPicker.rgbToHsv(...rgb);
    assert.deepEqual(ColorPicker.hsvToRgb(h,s,v),rgb);
  }
  assert.equal(ColorPicker.rgbToHex(255,128,0),'#ff8000');
  assert.equal(ColorPicker.rgbToHex(-5,300,'x'),'#00ff00');
});

test('built-in palettes are original, unique, valid and non-empty',()=>{
  assert.deepEqual(ColorPicker.BUILT_IN_NAMES,['Solid Colors','Pastels & Neons','Metallics','Paper','Cotton','Bright Colors']);
  for(const name of ColorPicker.BUILT_IN_NAMES){
    const list=ColorPicker.builtIn(name);
    assert.ok(list.length>=10,name);
    assert.ok(list.every(item=>/^#[0-9a-f]{6}$/.test(item.hex)),name+' hex');
    assert.equal(new Set(list.map(item=>item.name)).size,list.length,name+' unique names');
    assert.ok(!list.some(item=>/pantone/i.test(item.name)),name+' carries no PANTONE names');
  }
});

test('palette icons are SVG, escape their input and sample five colours',()=>{
  assert.match(ColorPicker.swatchSvg('#ff0000'),/^<svg[^>]*><rect[^>]*fill="#ff0000"/);
  assert.ok(!ColorPicker.swatchSvg('"><script>').includes('<script>'));
  const strip=ColorPicker.stripSvg(ColorPicker.builtIn('Solid Colors'));
  assert.equal((strip.match(/<rect x="\d+" y="1" width="6"/g)||[]).length,5);
  assert.ok(ColorPicker.stripSvg([]).startsWith('<svg'));
});
