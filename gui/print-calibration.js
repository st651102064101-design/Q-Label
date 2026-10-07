'use strict';
(() => {
  const dialog=document.createElement('dialog');dialog.id='printCalibrationDialog';
  dialog.innerHTML=`<header><strong>Print calibration / ปรับเทียบงานพิมพ์</strong><button type="button" aria-label="Close">×</button></header><main><p>ปรับเฉพาะงานที่ส่งพิมพ์ ใช้กับทุกโปรเจ็ค โดยไม่เปลี่ยนขนาดกระดาษ ระยะห่าง หรือแบบงาน</p><label>ขยับซ้าย / ขวา (mm)<input data-key="offsetX" type="number" min="-100" max="100" step="0.001"></label><small>ลบ = ซ้าย · บวก = ขวา</small><label>ขยับบน / ล่าง (mm)<input data-key="offsetY" type="number" min="-100" max="100" step="0.001"></label><small>ลบ = ขึ้น · บวก = ลง (ช่วงแนวตั้งขึ้นกับข้อจำกัดเครื่องพิมพ์)</small><label>ขยาย / ย่อแนวนอน (%)<input data-key="scaleX" type="number" min="10" max="200" step="0.001"></label><label>ขยาย / ย่อแนวตั้ง (%)<input data-key="scaleY" type="number" min="10" max="200" step="0.001"></label><label><input id="pcLink" type="checkbox" checked>ปรับสเกลสองแกนพร้อมกัน</label><p>100% = ขนาดเดิม · ย่อ/ขยายจากมุมซ้ายบน · ค่าระยะละเอียดถึง 0.001 mm และสเกล 0.001% (งานพิมพ์จริงปัดตามจุดพิมพ์ของเครื่อง)</p><p>ค่าจะบันทึกอัตโนมัติและใช้กับงานพิมพ์และ Print Preview ครั้งถัดไปทันที</p><output id="pcStatus" role="status"></output></main><footer><button id="pcReset" type="button">คืนค่า 0 mm / 100%</button><button id="pcClose" type="button">Close</button></footer>`;
  document.body.append(dialog);
  const style=document.createElement('style');style.textContent=`#printCalibrationDialog{width:min(540px,92vw);max-height:90vh;padding:0;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);font:13px 'Segoe UI',sans-serif}#printCalibrationDialog::backdrop{background:#0006}#printCalibrationDialog header,#printCalibrationDialog footer{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border)}#printCalibrationDialog main{padding:12px 20px;overflow:auto;max-height:70vh}#printCalibrationDialog label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px}#printCalibrationDialog input[type=number]{width:145px;padding:8px;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:3px}#printCalibrationDialog small,#printCalibrationDialog p{color:var(--muted);line-height:1.5}#printCalibrationDialog button{padding:6px 12px;border:1px solid var(--border);border-radius:3px;background:var(--card);color:var(--text);cursor:pointer}#printCalibrationDialog footer{border-top:1px solid var(--border);border-bottom:0}`;document.head.append(style);
  const defaults={offsetX:0,offsetY:0,scaleX:100,scaleY:100};let value={...defaults};
  const inputs=[...dialog.querySelectorAll('[data-key]')],status=dialog.querySelector('output');
  function render(){for(const input of inputs)input.value=value[input.dataset.key];}
  function save(){settings.printCalibration={...value};const result=window.zebra.saveSettingsSync({printCalibration:{...value}});status.textContent=result?.error?`บันทึกไม่สำเร็จ: ${result.error}`:'บันทึกแล้ว · ใช้กับงานพิมพ์ถัดไป';}
  for(const input of inputs)input.addEventListener('input',()=>{
    if(input.value===''||!input.checkValidity()){status.textContent='กรอกตัวเลขในช่วงที่กำหนด';return;}
    const key=input.dataset.key;value[key]=Number(input.value);
    if(key.startsWith('scale')&&dialog.querySelector('#pcLink').checked){const other=key==='scaleX'?'scaleY':'scaleX';value[other]=value[key];inputs.find(i=>i.dataset.key===other).value=value[other];}
    save();
  });
  dialog.querySelector('#pcReset').onclick=()=>{value={...defaults};render();save();};
  dialog.querySelector('header button').onclick=dialog.querySelector('#pcClose').onclick=()=>dialog.close();
  window.openPrintCalibration=()=>{value={...defaults,...settings.printCalibration};render();status.textContent='';if(!dialog.open)dialog.showModal();};
  const homeHeader=document.querySelector('#projectHome>header');
  if(homeHeader){const b=document.createElement('button');b.textContent='Print calibration';b.title='ปรับเทียบงานพิมพ์';b.style.cssText='width:auto;font-size:12px;margin-right:10px';b.onclick=window.openPrintCalibration;homeHeader.insertBefore(b,homeHeader.lastElementChild);}
})();
