'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PictureColor=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const PNG_DATA_URL=/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
  function dataUrl(canvas){
    if(!canvas||typeof canvas.toDataURL!=='function')throw new Error('Could not capture the original picture as PNG.');
    const value=canvas.toDataURL('image/png');
    if(!PNG_DATA_URL.test(value))throw new Error('Could not capture the original picture as PNG.');
    return value;
  }
  function capture(element,canvas){
    if(!element||typeof element!=='object'||element.type!=='image')throw new Error('Select a picture first.');
    element.color_image_data=dataUrl(canvas);
    return element;
  }
  function markup(element,x,y,width,height){
    const source=String(element?.color_image_data||'');
    const values=[x,y,width,height].map(Number);
    if(!PNG_DATA_URL.test(source)||values.some(value=>!Number.isFinite(value))||values[2]<=0||values[3]<=0)return '';
    return `<image data-color-picture="true" x="${values[0]}" y="${values[1]}" width="${values[2]}" height="${values[3]}" href="${source}" preserveAspectRatio="none"/>`;
  }
  return {dataUrl,capture,markup};
});
