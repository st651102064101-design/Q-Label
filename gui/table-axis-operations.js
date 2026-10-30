(function(root){
  'use strict';
  const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
  const indexAfter=(value,axisIndex,action)=>{
    if(action==='add'||action==='duplicate')return value>axisIndex?value+1:value;
    if(action==='delete')return value===axisIndex?null:value>axisIndex?value-1:value;
    const destination=axisIndex+(action==='up'?-1:1);
    return value===axisIndex?destination:value===destination?axisIndex:value;
  };
  function remapMap(source,rows,action,axisIndex){
    if(!source)return source;
    const result={};
    for(const [key,value]of Object.entries(source)){
      const [row,column]=key.split(',').map(Number),mapped=indexAfter(rows?row:column,axisIndex,action);
      if(mapped===null)continue;
      result[(rows?mapped:row)+','+(rows?column:mapped)]=clone(value);
    }
    if(action==='duplicate'){
      const destination=axisIndex+1;
      for(const [key,value]of Object.entries(source)){
        const [row,column]=key.split(',').map(Number);
        if((rows?row:column)!==axisIndex)continue;
        result[(rows?destination:row)+','+(rows?column:destination)]=clone(value);
      }
    }
    return result;
  }
  function mapBoundary(value,index,action){
    if(action==='add'||action==='duplicate')return value>index?value+1:value;
    if(action==='delete')return value>index+1?value-1:value;
    if(action==='up'||action==='down'){
      const destination=index+(action==='up'?-1:1);
      return value===index?destination:value===destination+1?index+1:value;
    }
    return value;
  }
  function remapEdges(source,rows,action,index){
    if(!source)return source;
    if(action==='up'||action==='down')return clone(source);
    const result={};
    for(const [key,value]of Object.entries(source)){
      const [axis,rowText,columnText]=key.split(':'),row=Number(rowText),column=Number(columnText);
      if(!Number.isFinite(row)||!Number.isFinite(column)){result[key]=clone(value);continue;}
      const segmentAxis=rows?'v':'h',boundaryAxis=rows?'h':'v';
      let nextRow=row,nextColumn=column;
      if(axis===segmentAxis){const mapped=indexAfter(rows?row:column,index,action);if(mapped===null)continue;if(rows)nextRow=mapped;else nextColumn=mapped;}
      else if(axis===boundaryAxis){if(rows)nextRow=mapBoundary(row,index,action);else nextColumn=mapBoundary(column,index,action);}
      result[axis+':'+nextRow+':'+nextColumn]=clone(value);
    }
    if(action==='duplicate'){
      const segmentAxis=rows?'v':'h',destination=index+1;
      for(const [key,value]of Object.entries(source)){
        const [axis,rowText,columnText]=key.split(':'),row=Number(rowText),column=Number(columnText);
        if(axis!==segmentAxis||(rows?row:column)!==index)continue;
        result[axis+':'+(rows?destination:row)+':'+(rows?column:destination)]=clone(value);
      }
    }
    return result;
  }
  function apply(model,rows,index,action){
    const list=rows?model?.rows:model?.columns,values=model?.values;
    if(!Array.isArray(list)||!Array.isArray(values)||!Number.isInteger(index)||!['add','duplicate','delete','up','down'].includes(action))return false;
    if(action==='delete'&&list.length<=1)return false;
    if(action==='add'&&(index< -1||index>=list.length))return false;
    if(action==='duplicate'&&(index<0||index>=list.length))return false;
    if(action==='up'&&(index<=0||index>=list.length))return false;
    if(action==='down'&&(index<0||index>=list.length-1))return false;
    for(const field of ['cellStyles','cellTextStyles'])model[field]=remapMap(model[field],rows,action,index);
    model.edgeStyles=remapEdges(model.edgeStyles,rows,action,index);
    if(action==='add'||action==='duplicate'){
      const inserted=index+1;
      list.splice(inserted,0,action==='add'?{mode:'Auto',size:5,weight:100,min:.1,max:254,align:'Start',showEmpty:true}:clone(list[index]));
      if(rows)values.splice(inserted,0,action==='add'?Array(model.columns.length).fill(''):[...values[index]]);
      else values.forEach(row=>row.splice(inserted,0,action==='add'?'':row[index]));
      return true;
    }
    if(action==='delete'){
      list.splice(index,1);
      if(rows)values.splice(index,1);else values.forEach(row=>row.splice(index,1));
      return true;
    }
    const destination=index+(action==='up'?-1:1);
    [list[index],list[destination]]=[list[destination],list[index]];
    if(rows)[values[index],values[destination]]=[values[destination],values[index]];
    else values.forEach(row=>[row[index],row[destination]]=[row[destination],row[index]]);
    return true;
  }
  const api={apply};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TableAxisOperations=api;
})(typeof window!=='undefined'?window:globalThis);
