'use strict';
const fs=require('node:fs');
const crypto=require('node:crypto');
// mfg.stk v4 uses thousandths of an inch. Quotes inside unquoted names
// (for example .75" Circle) are literal, not CSV quoting delimiters.
function parseLine(line){
  const cells=[];let cell='',quoted=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'&&(quoted||cell==='')){if(quoted&&line[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){cells.push(cell);cell='';}else cell+=c;
  }
  if(quoted)throw Error('Unterminated stock field');cells.push(cell);return cells;
}
function parseStocks(text){
  const lines=text.replace(/^\uFEFF/,'').trimEnd().split(/\r?\n/);
  if(lines.shift()!=='[stock],4')throw Error('Unsupported stock file version');
  const headers=parseLine(lines.shift());
  const rows=lines.filter(Boolean).map((line,index)=>{
    const cells=parseLine(line);if(cells.length<headers.length)throw Error(`Incomplete stock row ${index+3}`);
    const raw=Object.fromEntries(headers.map((key,i)=>[key,cells[i]]));
    const num=key=>{const n=Number(raw[key]);if(!Number.isFinite(n))throw Error(`Invalid ${key} on row ${index+3}`);return n;};
    const mm=key=>Number((num(key)*.0254).toFixed(6));
    const stock={manufacturer:raw.Manufacturer,name:raw.Type,width_mm:mm('Label Width'),height_mm:mm('Label Height'),paper_width_mm:mm('Paper width'),paper_height_mm:mm('Paper height'),columns:num('Label columns'),rows:num('Label rows'),margin_top_mm:mm('Margin top'),margin_left_mm:mm('Margin left'),margin_right_mm:mm('Margin right'),margin_bottom_mm:mm('Margin bottom'),gap_x_mm:mm('Label Gap Horiz'),gap_y_mm:mm('Label Gap Vert'),orientation:num('Orientation'),printer_type:raw['Printer type'],shape:num('Shape'),corners_or_hole:num('Corners or Hole'),border_or_diameter_mm:mm('Border or Diameter'),placeholder_or_border_mm:mm('Placeholder or Border'),manual_label_size:!!num('Manual label size'),manual_label_gap:!!num('Manual label gap')};
    // Automatic gaps fill the remaining page space; zero stored gap is not
    // necessarily zero physical spacing (notably the Circle 2/3/4 up stocks).
    if(!stock.manual_label_gap){
      if(stock.columns>1)stock.gap_x_mm=Math.max(0,(stock.paper_width_mm-stock.margin_left_mm-stock.margin_right_mm-stock.columns*stock.width_mm)/(stock.columns-1));
      if(stock.rows>1)stock.gap_y_mm=Math.max(0,(stock.paper_height_mm-stock.margin_top_mm-stock.margin_bottom_mm-stock.rows*stock.height_mm)/(stock.rows-1));
    }
    return stock;
  });
  return rows;
}
if(require.main===module){
  const source=process.argv[2];if(!source)throw Error('Supply the installed mfg.stk path');
  const bytes=fs.readFileSync(source),rows=parseStocks(new TextDecoder('windows-1252').decode(bytes));
  const target=require('node:path').resolve(__dirname,'../gui/stock-catalog.js');
  const wrapper=fs.readFileSync(target,'utf8').split('})(window, ')[0];
  fs.writeFileSync(target,wrapper+'})(window, '+JSON.stringify(rows)+');\n');
  console.log(JSON.stringify({source,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),categories:new Set(rows.map(x=>x.manufacturer)).size,stocks:rows.length}));
}
module.exports={parseLine,parseStocks};
