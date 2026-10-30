'use strict';
(function(root){
 const median=a=>{const b=a.slice().sort((x,y)=>x-y);return b[Math.floor(b.length/2)];};
 const upper=a=>{const b=a.slice().sort((x,y)=>x-y);return b[Math.ceil((b.length-1)*.8)];};
 function solve(a,b){
  a=a.map((row,i)=>[...row,b[i]]);const n=b.length;
  for(let c=0;c<n;c++){let k=c;for(let r=c+1;r<n;r++)if(Math.abs(a[r][c])>Math.abs(a[k][c]))k=r;
   if(Math.abs(a[k][c])<1e-10)throw Error('The photo reference corners are degenerate.');[a[k],a[c]]=[a[c],a[k]];
   const d=a[c][c];for(let j=c;j<=n;j++)a[c][j]/=d;
   for(let r=0;r<n;r++)if(r!==c){const f=a[r][c];for(let j=c;j<=n;j++)a[r][j]-=f*a[c][j];}
  }return a.map(row=>row[n]);
 }
 function homography(from,to){const a=[],b=[];for(let i=0;i<4;i++){const [x,y]=from[i],[u,v]=to[i];a.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);b.push(u,v);}return [...solve(a,b),1];}
 function point(h,x,y){const d=h[6]*x+h[7]*y+h[8];return [(h[0]*x+h[1]*y+h[2])/d,(h[3]*x+h[4]*y+h[5])/d];}
 function mediaSignature(media,profile={}){return [Number(media.width_mm).toFixed(3),Number(media.height_mm).toFixed(3),profile.dots_per_mm||'',profile.length_dots||'',profile.tracking||''].join(':');}
 function grayscale(image){const {width,height,data}=image;if(!(width>200&&height>200&&width*height<=5000000))throw Error('Use a clear photo of one full label (200 pixels or larger).');const gray=new Float32Array(width*height);for(let i=0;i<gray.length;i++)gray[i]=.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2];return gray;}
 function foreground(gray,w,h){
  const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let best=null;
  for(let start=0;start<seen.length;start++){if(seen[start]||gray[start]<145)continue;let head=0,tail=1,count=0,left=w,right=0,top=h,bottom=0;queue[0]=start;seen[start]=1;
   while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);count++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    for(const q of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(q>=0&&!seen[q]&&gray[q]>=145){seen[q]=1;queue[tail++]=q;}
   }if(!best||count>best.count)best={left,right,top,bottom,count};
  }if(!best||best.count<w*h*.12)throw Error('The label could not be separated from the background.');return best;
 }
 function sampler(gray,w,h){return (x,y)=>{if(x<0||y<0||x>=w-1||y>=h-1)return 0;const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,p=iy*w+ix;return gray[p]*(1-fx)*(1-fy)+gray[p+1]*fx*(1-fy)+gray[p+w]*(1-fx)*fy+gray[p+w+1]*fx*fy;};}
 function frameLine(sample,box,axis,side){
  const horizontal=axis==='y',lo=horizontal?box.top:box.left,hi=horizontal?box.bottom:box.right,span=hi-lo;
  const oLo=horizontal?box.left:box.top,oHi=horizontal?box.right:box.bottom,center=(oLo+oHi)/2;
  const start=side==='low'?lo:hi-span*.2,end=side==='low'?lo+span*.2:hi,peaks=[];
  for(let b=Math.ceil(start);b<=end;b++){let best={score:0};for(let slope=-.18;slope<=.18;slope+=.003){let score=0,coverage=0;
    for(let i=0;i<48;i++){const o=oLo+(oHi-oLo)*(.2+.6*i/47),p=b+slope*(o-center),g=d=>horizontal?sample(o,p+d):sample(p+d,o);
     const ink=Math.min(g(-.7),g(0),g(.7)),near=(g(-4)+g(4))/2,contrast=Math.max(0,Math.min(150,near-ink));score+=contrast;if(contrast>20&&near>150)coverage++;
    }score/=48;coverage/=48;if(coverage>.52&&score>best.score)best={score,coverage,m:slope,b:b-slope*center,position:b};
   }if(best.score>25)peaks.push(best);
  }
  peaks.sort((a,b)=>b.score-a.score);const selected=[];for(const p of peaks)if(p.score>=peaks[0].score*.55&&!selected.some(q=>Math.abs(q.position-p.position)<7))selected.push(p);
  if(!selected.length)throw Error('The 3 mm reference frame is not clear on all four sides.');selected.sort((a,b)=>a.position-b.position);return side==='low'?selected[selected.length-1]:selected[0];
 }
 function intersection(horizontal,vertical){const x=(vertical.m*horizontal.b+vertical.b)/(1-vertical.m*horizontal.m);return [x,horizontal.m*x+horizontal.b];}
 function frameCorners(image,gray){const {width:w,height:h}=image,sample=sampler(gray,w,h),box=foreground(gray,w,h);
  const top=frameLine(sample,box,'y','low'),bottom=frameLine(sample,box,'y','high'),left=frameLine(sample,box,'x','low'),right=frameLine(sample,box,'x','high');
  const corners=[intersection(top,left),intersection(top,right),intersection(bottom,right),intersection(bottom,left)];
  if(corners.some(([x,y])=>x<0||x>w||y<0||y>h))throw Error('The detected frame falls outside the photo.');return {corners,box};
 }
 function detectEdge(sample,photoMap,width,height,edge,fraction=[.2,.8]){
  const vertical=edge==='left'||edge==='right',low=edge==='left'||edge==='top',size=vertical?width:height,other=vertical?height:width,expected=low?0:size;
  const values=[];const line=t=>{const v=[];for(let i=0;i<32;i++){const o=other*(fraction[0]+(fraction[1]-fraction[0])*i/31),p=point(photoMap,vertical?t:o,vertical?o:t);v.push(sample(p[0],p[1]));}return median(v);};
  for(let t=expected-5;t<=expected+5;t+=.05){const dir=low?1:-1,inside=upper([.1,.2,.3].map(d=>line(t+dir*d))),outside=upper([.1,.2,.3].map(d=>line(t-dir*d)));
   const farIn=upper([.5,.8,1.1].map(d=>line(t+dir*d))),farOut=upper([.5,.8,1.1].map(d=>line(t-dir*d)));
   const score=outside>140&&farOut>140&&farIn-farOut>8?inside-outside:0;values.push({t,score});
  }values.sort((a,b)=>b.score-a.score);if(values[0].score<12)throw Error(`The sticker ${edge} edge is not distinct from its liner.`);return values[0];
 }
 function analyze(image,reference,options={}){
  const width=Number(reference.width_mm),height=Number(reference.height_mm),inset=Number(reference.inset_mm??3);
  if(!(width>inset*2&&height>inset*2))throw Error('Invalid reference label dimensions.');
  const gray=grayscale(image),sample=sampler(gray,image.width,image.height),detected=options.frameCorners?{corners:options.frameCorners}:frameCorners(image,gray);
  const mmQuad=[[inset,inset],[width-inset,inset],[width-inset,height-inset],[inset,height-inset]],photoMap=homography(mmQuad,detected.corners),bounds={},scores={},spread={};
  for(const edge of ['left','top','right','bottom']){const p=detectEdge(sample,photoMap,width,height,edge);bounds[edge]=p.t;scores[edge]=p.score;
   const slices=[[.2,.4],[.4,.6],[.6,.8]].map(f=>{try{return detectEdge(sample,photoMap,width,height,edge,f).t;}catch(_){return p.t;}});spread[edge]=Math.max(...slices)-Math.min(...slices);
  }
  const uncertainty=Math.max(.25,...Object.values(spread).map(v=>v/2));if(uncertainty>.65)throw Error('The sticker is too curled or its edges are ambiguous. Use a flat photo with all four edges visible.');
  const sx=(bounds.right-bounds.left)/width,sy=(bounds.bottom-bounds.top)/height;if(sx<.85||sx>1.15||sy<.85||sy>1.15)throw Error('The reference frame dimensions do not match this stock.');
  const paperCorners=[[bounds.left,bounds.top],[bounds.right,bounds.top],[bounds.right,bounds.bottom],[bounds.left,bounds.bottom]].map(([x,y])=>point(photoMap,x,y));
  return {offsetX:bounds.left,offsetY:bounds.top,scaleX:sx*100,scaleY:sy*100,reference:{width_mm:width,height_mm:height,inset_mm:inset},bounds,frameCorners:detected.corners,paperCorners,uncertainty_mm:uncertainty,edge_scores:scores,source:'registration-photo',verified:false,created_at:new Date().toISOString()};
 }
 const api={analyze,homography,point,mediaSignature,frameCorners};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PhotoRegistration=api;
})(typeof window!=='undefined'?window:globalThis);
