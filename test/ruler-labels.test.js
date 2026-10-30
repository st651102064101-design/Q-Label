const test=require('node:test');
const assert=require('node:assert/strict');
const RulerLabels=require('../gui/ruler-labels');

test('ruler coordinates round tiny negative values to positive zero at displayed precision',()=>{
  assert.equal(RulerLabels.formatCoordinate(-0.001), '0.00','a sub-cent rounding residual must not display as negative zero');
  assert.equal(RulerLabels.formatCoordinate(-0), '0.00','signed zero uses the same zero origin label');
  assert.equal(RulerLabels.formatCoordinate(-0.01), '-0.01','real negative distances remain negative');
  assert.equal(RulerLabels.formatCoordinate(-0.0001,3), '0.000','zero normalization follows requested precision');
});

test('coordinate marker snaps to the green zero tick when the displayed value rounds to zero',()=>{
  assert.equal(RulerLabels.coordinatePosition(99.8,100,-0.004),100,'negative rounded zero aligns its red marker and label to the ruler origin');
  assert.equal(RulerLabels.coordinatePosition(100.2,100,0.004),100,'positive rounded zero also aligns to the origin');
  assert.equal(RulerLabels.coordinatePosition(98,100,-0.02),98,'a displayed nonzero distance retains the actual pointer position');
});

function context(){
  const calls=[];
  const value={fillStyle:'#000',textAlign:'start',textBaseline:'alphabetic',font:'10px sans-serif',
    measureText:text=>({width:String(text).length*6}),
    clearRect:(...args)=>calls.push({type:'clearRect',args}),
    fillRect:(...args)=>calls.push({type:'fillRect',args,fillStyle:value.fillStyle}),
    fillText:(...args)=>calls.push({type:'fillText',args,fillStyle:value.fillStyle,textAlign:value.textAlign,textBaseline:value.textBaseline}),
    save:()=>calls.push({type:'save'}),restore:()=>calls.push({type:'restore'}),
    translate:(...args)=>calls.push({type:'translate',args}),rotate:value=>calls.push({type:'rotate',value})
  };
  return {value,calls};
}

test('horizontal ruler numbers are 50% larger and use the same light background as the ruler',()=>{
  const {value,calls}=context();
  RulerLabels.horizontal(value,{pos:120,label:'12'},4,RulerLabels.THICKNESS);
  const text=calls.find(call=>call.type==='fillText');
  assert.deepEqual(text.args,['12',120,13.75]);
  assert.equal(text.fillStyle,'#16a34a');
  assert.equal(text.textAlign,'center');
  assert.equal(RulerLabels.THICKNESS,19.5);assert.equal(value.font,'600 15px Segoe UI,sans-serif');
  assert.equal(calls.some(call=>call.type==='clearRect'),false,'labels do not punch a dark hole through the ruler');
  assert.deepEqual(calls.filter(call=>call.type==='fillRect'),[{type:'fillRect',args:[112.5,4,15,19.5],fillStyle:RulerLabels.BACKGROUND}]);
});

test('vertical ruler numbers are 50% larger with a matching light background',()=>{
  const {value,calls}=context();
  RulerLabels.vertical(value,{pos:90,label:'8'},RulerLabels.THICKNESS);
  const text=calls.find(call=>call.type==='fillText');
  assert.deepEqual(text.args,['8',0,0]);
  assert.equal(text.fillStyle,'#16a34a');
  assert.equal(text.textAlign,'center');
  assert.equal(text.textBaseline,'middle');
  assert.equal(value.font,'600 15px Segoe UI,sans-serif');
  assert.equal(calls.some(call=>call.type==='clearRect'),false);
  assert.deepEqual(calls.filter(call=>call.type==='fillRect'),[{type:'fillRect',args:[0,85.5,19.5,9],fillStyle:RulerLabels.BACKGROUND}]);
  assert.ok(calls.some(call=>call.type==='rotate'&&call.value===-Math.PI/2));
});

test('off-paper ruler numbers clear tick marks beneath text without painting a background strip',()=>{
  const horizontal=context(),vertical=context();
  RulerLabels.horizontal(horizontal.value,{pos:40,label:'-1',onPaper:false},4,RulerLabels.THICKNESS);
  RulerLabels.vertical(vertical.value,{pos:60,label:'-1',onPaper:false},RulerLabels.THICKNESS);
  for(const {calls} of [horizontal,vertical]){
    const text=calls.find(call=>call.type==='fillText');
    assert.equal(text?.args[0],'-1','the off-paper integer coordinate is still drawn');
    assert.equal(text.fillStyle,'#16a34a','off-paper coordinates keep ruler number styling');
    assert.equal(calls.some(call=>call.type==='fillRect'),false,'transparent workspace remains visible behind off-paper labels');
    assert.deepEqual(calls.filter(call=>call.type==='clearRect').map(call=>call.args),[
      horizontal.calls===calls?[32.5,4,15,RulerLabels.THICKNESS]:[0,52.5,RulerLabels.THICKNESS,15]
    ],'the ruler tick is erased only from behind the coordinate digits');
  }
});

test('off-paper label clearing preserves any part of its text band that overlaps the paper',()=>{
  const horizontal=context(),vertical=context();
  RulerLabels.horizontal(horizontal.value,{pos:4,label:'-1',onPaper:false,paperStart:0,paperEnd:10},4,RulerLabels.THICKNESS);
  RulerLabels.vertical(vertical.value,{pos:4,label:'-1',onPaper:false,paperStart:0,paperEnd:10},RulerLabels.THICKNESS);
  assert.deepEqual(horizontal.calls.filter(call=>call.type==='clearRect').map(call=>call.args),[
    [-3.5,4,3.5,RulerLabels.THICKNESS],[10,4,1.5,RulerLabels.THICKNESS]
  ]);
  assert.deepEqual(vertical.calls.filter(call=>call.type==='clearRect').map(call=>call.args),[
    [0,-3.5,RulerLabels.THICKNESS,3.5],[0,10,RulerLabels.THICKNESS,1.5]
  ]);
});

test('vertical ruler zero stays aligned to the paper top after frame borders and scrolling',()=>{
  const frameTop=100,frameClientTop=2,paperTop=42;
  const rulerTop=frameTop+frameClientTop;
  const origin=RulerLabels.verticalOrigin(paperTop,frameTop,frameClientTop);
  assert.equal(rulerTop+origin,paperTop,'the zero tick is drawn at the paper top in viewport coordinates');
});

test('vertical ruler visible span is clipped to the visible paper height',()=>{
  assert.deepEqual(RulerLabels.visibleSpan(80,300,600),{start:80,end:380},'ruler starts and ends exactly with a fully visible paper');
  assert.deepEqual(RulerLabels.visibleSpan(-20,120,600),{start:0,end:100},'a paper clipped by the viewport ruler starts at the viewport edge');
  assert.deepEqual(RulerLabels.visibleSpan(80,300,200),{start:80,end:200},'a paper extending below the viewport is clipped at the viewport edge');
  assert.deepEqual(RulerLabels.visibleSpan(80,300,600,100),{start:100,end:380},'a navbar overlay may hide the paper top without extending the ruler above it');
  assert.deepEqual(RulerLabels.visibleSpan(0,600,600,100),{start:100,end:600},'the ruler itself spans all visible space below a navbar even beyond paper');
});

test('visible ruler ticks include the zero origin and extend to the visible paper edge',()=>{
  assert.equal(RulerLabels.tickStartIndex(100,82,720,20),0,'start ticks at the true visible ruler edge rather than after its padding');
  assert.equal(RulerLabels.tickStartIndex(100,101,720,20),1,'a zero tick above the visible area is not forced into the range');
  assert.equal(RulerLabels.tickStartIndex(-20,0,720,20),1,'do not add a zero tick that is above the visible ruler');
  assert.deepEqual(RulerLabels.visibleSpan(0,720,720,82),{start:82,end:720},'the fixed strip covers through the paper bottom after the navbar');
  assert.equal(RulerLabels.visibleHeight(610,636,729,82),636,'extend to the paper bottom when it passes the frame');
  assert.equal(RulerLabels.visibleHeight(700,636,729,82),647,'clip a frame taller than the remaining viewport');
});

test('ruler background is painted only across the measured paper span',()=>{
  const horizontal=context(),vertical=context();
  const h=RulerLabels.paintPaperStrip(horizontal.value,'horizontal',80,120,400,19.5,24,19.5);
  const v=RulerLabels.paintPaperStrip(vertical.value,'vertical',100,150,400,19.5,0,40);
  assert.deepEqual(h,{start:80,end:200});
  assert.deepEqual(horizontal.calls.filter(call=>call.type==='fillRect'),[
    {type:'fillRect',args:[80,24,120,19.5],fillStyle:RulerLabels.BACKGROUND}
  ],'horizontal area outside paper remains transparent');
  assert.deepEqual(v,{start:100,end:250});
  assert.deepEqual(vertical.calls.filter(call=>call.type==='fillRect'),[
    {type:'fillRect',args:[0,100,19.5,150],fillStyle:RulerLabels.BACKGROUND}
  ],'vertical area outside paper remains transparent');
});

test('paper ruler background is clipped to visible paper bounds',()=>{
  const {value,calls}=context();
  const span=RulerLabels.paintPaperStrip(value,'horizontal',-20,90,60,19.5,12,19.5);
  assert.deepEqual(span,{start:19.5,end:60});
  assert.deepEqual(calls.filter(call=>call.type==='fillRect'),[
    {type:'fillRect',args:[19.5,12,40.5,19.5],fillStyle:RulerLabels.BACKGROUND}
  ]);
});

test('ruler label intervals are fixed to the zero coordinate, independent of viewport phase',()=>{
 for(const pixelsPerUnit of [.3,3,6.5,11,40,100,600]){const interval=RulerLabels.labelInterval(pixelsPerUnit);assert.ok(interval>=1);assert.ok(interval*pixelsPerUnit>=64-1e-9);assert.equal(RulerLabels.isLabelTick(0,interval),true);assert.equal(RulerLabels.isLabelTick(-interval,interval),true);assert.equal(RulerLabels.isLabelTick(interval,interval),true);assert.equal(RulerLabels.isLabelTick(interval/2,interval),false);
 const labels=origin=>{const result=[];for(let i=Math.ceil((20-origin)/pixelsPerUnit);i<=Math.floor((1000-origin)/pixelsPerUnit);i++)if(RulerLabels.isLabelTick(i,interval))result.push(i);return result;};const a=labels(400),b=labels(417),lo=Math.max(a[0],b[0]),hi=Math.min(a.at(-1),b.at(-1));assert.deepEqual(a.filter(v=>v>=lo&&v<=hi),b.filter(v=>v>=lo&&v<=hi));}
 assert.equal(RulerLabels.labelInterval(11),10);assert.equal(RulerLabels.isLabelTick(9.999999999999998,10),true);assert.equal(RulerLabels.isLabelTick(-30,10),true);assert.equal(RulerLabels.isLabelTick(-31,10),false);
});
