(function(root){
  'use strict';
  // The display's requestAnimationFrame cadence is the only clock. Pointer
  // bursts replace pending input instead of building a queue of stale positions.
  function create(apply,request=root.requestAnimationFrame.bind(root),cancel=root.cancelAnimationFrame.bind(root)){
    let frame=null,pending=null;
    const sample=event=>{const samples=event.getCoalescedEvents?.(),last=samples?.length?samples[samples.length-1]:event;return {clientX:last.clientX,clientY:last.clientY,shiftKey:!!event.shiftKey,altKey:!!event.altKey};};
    const drain=()=>{frame=null;const latest=pending;pending=null;if(latest)apply(latest);};
    return {
      push(event){pending=sample(event);if(frame===null)frame=request(drain);},
      flush(event){if(frame!==null)cancel(frame);frame=null;if(event)pending=sample(event);drain();},
      cancel(){if(frame!==null)cancel(frame);frame=null;pending=null;}
    };
  }
  const api={create};if(typeof module!=='undefined')module.exports=api;root.FrameInput=api;
})(typeof window!=='undefined'?window:globalThis);
