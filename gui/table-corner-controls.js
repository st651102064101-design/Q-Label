(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TableCornerControls=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const MAX_AXIS_COUNT=100;
  function render({x,y,w,h,index,scale=1,locked=false}={}){
    if(locked||![x,y,w,h,index].every(Number.isFinite))return '';
    const screenScale=Number.isFinite(scale)&&scale>0?scale:1;
    const make=(axis,tx,ty,label)=>`<g class="table-corner-add" data-table-axis="${axis}" data-table-index="${index}" transform="translate(${tx} ${ty})" role="button" tabindex="0" aria-label="Add ${axis==='columns'?'column':'row'}"><title>${label}</title><g class="table-corner-add-size" transform="scale(${screenScale})"><circle class="table-corner-add-hit" cx="0" cy="0" r="16"/><g class="table-corner-add-icon"><circle cx="0" cy="0" r="12" fill="#fff" stroke="#16a34a" stroke-opacity=".45"/><path d="M-4 0h8M0-4v8" fill="none" stroke="#15803d" stroke-width="1.7" stroke-linecap="round"/></g></g></g>`;
    return make('columns',x+w,y,'Add column')+make('rows',x,y+h,'Add row');
  }
  function bind(svg,onAdd){
    if(!svg||typeof onAdd!=='function')return ()=>{};
    const activate=event=>{const control=event.target.closest?.('.table-corner-add');if(!control||!svg.contains(control))return;event.preventDefault();event.stopPropagation();const axis=control.dataset.tableAxis;if(axis==='columns'||axis==='rows')onAdd(Number(control.dataset.tableIndex),axis);};
    const keydown=event=>{if(['Enter',' '].includes(event.key))activate(event);};
    svg.addEventListener('click',activate);svg.addEventListener('keydown',keydown);
    return ()=>{svg.removeEventListener('click',activate);svg.removeEventListener('keydown',keydown);};
  }
  function appendAxis(model,axis){
    if(!model||!['rows','columns'].includes(axis))return false;
    const isRow=axis==='rows',items=isRow?model.rows:model.columns,values=model.values,columns=model.columns;
    if(!Array.isArray(items)||!Array.isArray(values)||items.length>=MAX_AXIS_COUNT)return false;
    if(!Array.isArray(columns)||!Array.isArray(model.rows)||values.length!==model.rows.length||values.some(row=>!Array.isArray(row)||row.length!==columns.length))return false;
    const item={mode:'Auto',size:5,weight:100,min:.1,max:254,align:'Start',showEmpty:true};
    if(isRow){items.push(item);values.push(Array(columns.length).fill(''));}else{items.push(item);values.forEach(row=>row.push(''));}
    return items.length-1;
  }
  return {render,bind,appendAxis,MAX_AXIS_COUNT};
});
