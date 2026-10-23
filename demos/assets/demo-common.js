'use strict';
window.DemoUI = (() => {
  const shapes = {
    scan:'<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M8 9h8M8 13h5"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
    play:'<path d="m8 5 11 7-11 7V5Z"/>',
    pause:'<path d="M8 5v14M16 5v14"/>',
    step:'<path d="m5 5 10 7-10 7V5ZM19 5v14"/>',
    reset:'<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',
    file:'<path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h5"/>',
    code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 4l-4 16"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.2"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    pin:'<path d="M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    terminal:'<path d="m4 7 5 5-5 5M12 17h8"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    git:'<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 7v10M18 7v2c0 3-12 3-12 6"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${shapes[name] || shapes.file}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(el => {el.innerHTML = icon(el.dataset.icon);});
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let toastTimer;
  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => {el.hidden = true;}, 3000);
  }
  function download(name, content, type = 'text/plain;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Đã tạo file tải xuống.');
  }
  async function copy(text) {
    try {await navigator.clipboard.writeText(text); toast('Đã sao chép báo cáo.');}
    catch {
      const input = document.createElement('textarea'); input.value = text;
      input.style.cssText = 'position:fixed;left:-10000px'; document.body.append(input); input.select();
      const ok = document.execCommand('copy'); input.remove();
      toast(ok ? 'Đã sao chép báo cáo.' : 'Trình duyệt chặn sao chép. Bạn có thể tải báo cáo.');
    }
  }
  const dialog = document.getElementById('help-dialog');
  document.querySelectorAll('[data-help]').forEach(el => el.addEventListener('click', event => {event.preventDefault();dialog.showModal();}));
  document.querySelector('[data-close-help]')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => {if (event.target === dialog) {const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();}});
  document.querySelectorAll('[role="tablist"]').forEach(list => list.addEventListener('keydown',event=>{
    const tabs=[...list.querySelectorAll('[role="tab"]')];
    const index=tabs.indexOf(document.activeElement);if(index<0)return;
    let next=index;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=tabs.length-1;
    else return;
    event.preventDefault();tabs[next].click();tabs[next].focus();
  }));
  return {icon,escape,toast,download,copy};
})();
