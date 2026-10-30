'use strict';

(function(root){
  function createMiddlePanState(){
    let pointerId=null;
    return {
      begin(event){if(event?.button!==1)return false;pointerId=event.pointerId??0;return true;},
      end(event){if(pointerId===null||event?.pointerId!=null&&event.pointerId!==pointerId)return false;pointerId=null;return true;},
      active(){return pointerId!==null;}
    };
  }
  function wheelAction(event,middlePanActive){
    if(middlePanActive)return 'ignore';
    return event?.ctrlKey?'zoom':'pan';
  }
  function captureZoomAnchor(paperRect,frameRect,point){
    const width=Math.max(1,Number(paperRect?.width)||0),height=Math.max(1,Number(paperRect?.height)||0);
    return {ratioX:(frameRect.left+point.x-paperRect.left)/width,ratioY:(frameRect.top+point.y-paperRect.top)/height,pointX:point.x,pointY:point.y};
  }
  function mapZoomAnchor(anchor,size,margin,scroll={x:0,y:0}){
    return {x:anchor.pointX+scroll.x-margin.marginLeft-anchor.ratioX*size.width,y:anchor.pointY+scroll.y-margin.marginTop-anchor.ratioY*size.height};
  }
  root.PreviewNavigation={createMiddlePanState,wheelAction,captureZoomAnchor,mapZoomAnchor};
})(window);
