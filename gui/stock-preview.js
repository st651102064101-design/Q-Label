'use strict';
(function(root){
  let sequence=0;
  function render(target,stock,unit='mm'){
    const w=stock.paper_width_mm,h=stock.paper_height_mm;
    if(!(w>0&&h>0))return;
    target.classList.add('nw-stock-preview');
    const roll=stock.printer_type==='Roll',scale=Math.min(166/w,roll?148/h:236/h),pw=w*scale,ph=h*scale,x=(200-pw)/2,y=(270-ph)/2;
    const id='stockPreview'+(++sequence);
    const cornerMm=root.StockApply?.stockVisualCornerRadiusMm?.(stock)??0;
    const cell=(row,col)=>{
      const lx=x+(stock.margin_left_mm+col*(stock.width_mm+stock.gap_x_mm))*scale,ly=y+(stock.margin_top_mm+row*(stock.height_mm+stock.gap_y_mm))*scale,lw=stock.width_mm*scale,lh=stock.height_mm*scale;
      const rx=Math.min(lw/2,lh/2,Math.max(0,cornerMm*scale));
      const hole=stock.shape===1&&stock.corners_or_hole===1&&stock.border_or_diameter_mm>0?`<circle data-stock-hole="true" cx="${lx+lw/2}" cy="${ly+lh/2}" r="${stock.border_or_diameter_mm*scale/2}" fill="#fafafa" stroke="#111" stroke-width=".8"/>`:'';
      return stock.shape===1?`<ellipse data-stock-label="true" cx="${lx+lw/2}" cy="${ly+lh/2}" rx="${lw/2}" ry="${lh/2}" fill="white" stroke="#111" stroke-width=".8"/>${hole}`:`<rect data-stock-label="true" data-label-shape="${rx>0?'rounded':'rectangle'}" x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="${rx}" fill="white" stroke="#111" stroke-width=".8"/>`;
    };
    let cells='';for(let row=0;row<stock.rows;row++)for(let col=0;col<stock.columns;col++)cells+=cell(row,col);
    const continuation=roll?`<g clip-path="url(#${id}clip)" opacity=".65"><g transform="translate(0 ${-ph-5})">${cells}</g><g transform="translate(0 ${ph+5})">${cells}</g></g><rect x="${x}" y="${y-20}" width="${pw}" height="20" fill="url(#${id}fadeTop)"/><rect x="${x}" y="${y+ph}" width="${pw}" height="20" fill="url(#${id}fadeBottom)"/>`:'';
    const previousSvg=target.querySelector('#nwPreview'),previousSize=target.querySelector('#nwSize'),preserved=[...target.children].filter(node=>node!==previousSvg&&node!==previousSize),shell=document.createElement('div');shell.innerHTML=`<svg id="nwPreview" viewBox="0 0 200 270" role="img" aria-label="Stock layout preview"><defs><linearGradient id="${id}background" x2="0" y2="1"><stop stop-color="#c7d9ee"/><stop offset="1" stop-color="#89a6c4"/></linearGradient><clipPath id="${id}clip"><rect x="${x}" y="${y-20}" width="${pw}" height="${ph+40}"/></clipPath><linearGradient id="${id}fadeTop" x2="0" y2="1"><stop stop-color="#c8c8c8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="${id}fadeBottom" x2="0" y2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#7a7a7a"/></linearGradient></defs><rect width="200" height="270" fill="url(#${id}background)"/><rect x="${x}" y="${roll?y-20:y}" width="${pw}" height="${roll?ph+40:ph}" fill="#fafafa" stroke="#777" stroke-width=".5"/>${continuation}<g data-stock-labels="true">${cells}</g></svg><small id="nwSize"></small>`;target.replaceChildren(shell.querySelector('svg'),...preserved,shell.querySelector('small'));
    const divisor=unit==='in'?25.4:1,fmt=n=>Number((n/divisor).toFixed(3)).toString();
    target.querySelector('small').textContent=`Template Size: ${fmt(stock.width_mm)} × ${fmt(stock.height_mm)} ${unit}`;
  }
  root.StockPreview={render};
})(typeof window==='undefined'?globalThis:window);
