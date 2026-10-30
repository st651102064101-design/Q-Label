'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const TextRangeFormat=require('../gui/text-range-format');

test('formatting a selection affects only the selected UTF-16 range',()=>{
  const result=TextRangeFormat.apply([],11,3,7,'bold',undefined,true);
  assert.deepEqual(result,[{start:3,end:7,bold:true}]);
});

test('bold, italic, underline, strike and font properties can coexist on overlapping selections',()=>{
  let ranges=TextRangeFormat.apply([],8,2,6,'bold',undefined,true);
  ranges=TextRangeFormat.apply(ranges,8,4,7,'italic',undefined,true);
  ranges=TextRangeFormat.apply(ranges,8,3,5,'underline',undefined,true);
  ranges=TextRangeFormat.apply(ranges,8,2,6,'strike',undefined,true);
  ranges=TextRangeFormat.apply(ranges,8,4,7,'font_size_pt',18,false);
  assert.deepEqual(ranges,[
    {start:2,end:3,bold:true,strike:true},
    {start:3,end:4,bold:true,strike:true,underline:true},
    {start:4,end:5,bold:true,italic:true,strike:true,underline:true,font_size_pt:18},
    {start:5,end:6,bold:true,italic:true,strike:true,font_size_pt:18},
    {start:6,end:7,italic:true,font_size_pt:18}
  ]);
});

test('toggling off stores false to override inherited cell formatting',()=>{
  let ranges=TextRangeFormat.apply([],5,1,4,'bold',undefined,true);
  ranges=TextRangeFormat.apply(ranges,5,2,3,'bold',undefined,true);
  assert.deepEqual(ranges,[{start:1,end:2,bold:true},{start:2,end:3,bold:false},{start:3,end:4,bold:true}]);
  assert.equal(TextRangeFormat.apply([],3,0,2,'unknown',true,true).length,0);
});

test('normalization clamps ranges and merges adjacent identical formatting',()=>{
  assert.deepEqual(TextRangeFormat.normalize([{start:-4,end:2,bold:true},{start:2,end:8,bold:true}],5),[{start:0,end:5,bold:true}]);
});

test('editing text inside and before a formatted range keeps offsets aligned',()=>{
  const original=[{start:2,end:5,bold:true}],inserted=TextRangeFormat.rebase(original,'abcdef','abXcdef');
  assert.deepEqual(inserted,[{start:2,end:6,bold:true}]);
  assert.deepEqual(TextRangeFormat.rebase(inserted,'abXcdef','ZabXcdef'),[{start:3,end:7,bold:true}]);
  assert.deepEqual(TextRangeFormat.rebase(inserted,'abXcdef','abXef'),[{start:2,end:4,bold:true}]);
});

test('clear formatting removes every character style only from the selected interval',()=>{
  const original=[{start:0,end:5,bold:true,italic:true,text_color:'#123456'}];
  assert.deepEqual(TextRangeFormat.clear(original,6,2,4),[
    {start:0,end:2,bold:true,italic:true,text_color:'#123456'},
    {start:4,end:5,bold:true,italic:true,text_color:'#123456'}
  ]);
});
