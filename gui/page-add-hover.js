(function(){
 'use strict';
 document.addEventListener('mouseover',event=>{
  const plus=event.target.closest?.('.template-page-add-control > button:first-child');
  if(!plus||plus.contains(event.relatedTarget))return;
  const group=plus.closest('.template-page-add-control');
  document.querySelectorAll('.template-page-menu').forEach(menu=>{menu.hidden=true;});
  group.querySelector('.template-page-add-menu-button')?.setAttribute('aria-expanded','false');
 },true);
})();
