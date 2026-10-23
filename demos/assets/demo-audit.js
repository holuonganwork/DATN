'use strict';
(() => {
  const {cases,spec,sources} = DemoData;
  const {icon,escape:esc,toast,download,copy} = DemoUI;
  const $ = id => document.getElementById(id);
  const input = $('audit-code');
  let mode = 'A1', tab = 'finding', running = false, report, generation = 0;
  const descriptions = {
    A0:'Một prompt trực tiếp. Bản mẫu minh họa một nhận định cần bổ sung điều kiện và bằng chứng.',
    A1:'Xem vai trò, dòng tài sản, tình huống biên và bằng chứng theo checklist.',
    A2:'Thêm ba thẻ tri thức mẫu về làm tròn. Không phải kết quả truy xuất dữ liệu Solodit thực.'
  };
  const section = (heading, text) => `<div class="finding-section"><h3>${heading}</h3><p>${text}</p></div>`;
  function refreshLines() {
    const count = input.value.split('\n').length;
    $('line-numbers').textContent = Array.from({length:count},(_,i)=>i+1).join('\n');
    $('code-lines').textContent = `${count} dòng`;
  }
  function loadCase() {
    const data = cases[$('audit-case').value];
    input.value = data.code; $('code-filename').textContent = data.file;
    input.scrollTop = 0; input.scrollLeft = 0; refreshLines();
    $('input-note').textContent = 'Bạn có thể chỉnh code để tham khảo. Mã khác kịch bản mẫu cần backend LLM để phân tích thật.';
  }
  function invalidate() {
    report = {kind:'pending',caseKey:$('audit-case').value,mode,review:null}; renderReport();
  }
  function setButtons(enabled) {
    $('export-report').disabled = !enabled; $('copy-report').disabled = !enabled;
    document.querySelectorAll('[data-review]').forEach(el => {el.disabled = !enabled || report.kind !== 'buggy';});
  }
  function renderReport() {
    const kind = report.kind, isBug = kind === 'buggy', isFixed = kind === 'fixed';
    const data = cases[report.caseKey];
    $('finding-count').textContent = isBug ? '01' : isFixed ? '00' : '—';
    $('finding-key').textContent = isBug ? 'M-01' : isFixed ? 'ĐỐI CHỨNG' : kind === 'custom' ? 'NGOÀI KỊCH BẢN' : 'CHỜ CHẠY';
    $('report-title').textContent = isBug ? report.mode === 'A0' ? 'Khả năng làm tròn sai khi rút' : 'Rút tài sản nhưng không đốt cổ phần' : isFixed ? 'Chưa ghi nhận lỗi mục tiêu' : kind === 'custom' ? 'Chưa phân tích mã đã chỉnh sửa' : 'Cấu hình đã thay đổi';
    $('finding-location').textContent = kind === 'custom' ? 'Mã do bạn cung cấp' : `${data.file}:${data.lines}`;
    const badge = $('finding-severity');
    badge.className = `badge ${isBug ? 'amber' : isFixed ? 'green' : 'neutral'}`;
    badge.textContent = isBug ? 'MEDIUM · GIẢ ĐỊNH' : isFixed ? 'LỖI MỤC TIÊU ĐÃ SỬA' : 'CHƯA CÓ KẾT LUẬN';
    $('report-mode').textContent = kind === 'pending' ? 'CHỜ CHẠY' : `MẪU ${report.mode}`;
    $('verification-label').textContent = 'Chưa thực thi';
    $('review-label').textContent = report.review ? `Nhận xét: ${report.review}` : 'Nhận xét của người rà soát';
    document.querySelectorAll('[data-review]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.review === report.review)));
    setButtons(kind !== 'pending');
    document.querySelectorAll('[data-audit-step]').forEach(el=> {el.classList.toggle('done',kind !== 'pending');el.classList.remove('active');});
    renderTab();
  }
  function renderTab() {
    document.querySelectorAll('[data-audit-tab]').forEach(el => {
      const active = el.dataset.auditTab === tab; el.setAttribute('aria-selected',String(active)); el.tabIndex = active ? 0 : -1;
    });
    $('finding-content').setAttribute('aria-labelledby', `tab-${tab}`);
    if (report.kind === 'pending') {
      $('finding-content').innerHTML = section('Chờ xem kịch bản', 'Nhấn <strong>Chạy phân tích mẫu</strong> để xem báo cáo tương ứng với code và phương pháp bạn vừa chọn.'); return;
    }
    if (report.kind === 'custom') {
      $('finding-content').innerHTML = section('Prototype chưa có backend LLM', 'Mã đã thay đổi hoặc đến từ file của bạn. Demo không suy luận trên mã tùy ý, vì vậy không thể báo có lỗi hay không có lỗi.') + '<div class="callout warning">Bạn có thể tiếp tục đọc code, tải ghi chú hoặc khôi phục mẫu để tham khảo luồng sản phẩm.</div>'; return;
    }
    if (tab === 'sources') {
      $('finding-content').innerHTML = report.mode === 'A2' ? '<p>Ba thẻ kiến thức viết riêng cho demo. Đây không phải finding từ một báo cáo audit thật.</p>' + sources.map(s=>`<article class="source-card"><div class="source-id">${s.id} · THẺ MẪU</div><h3>${s.title}</h3><p>${s.text}</p></article>`).join('') : section('Truy xuất đang tắt', 'Cấu hình này không sử dụng thẻ tham khảo. Chọn <strong>A2 · Thêm tri thức</strong> rồi chạy lại để xem cách hiển thị nguồn.'); return;
    }
    if (report.kind === 'fixed') {
      if (tab === 'evidence') $('finding-content').innerHTML = section('Cùng một đầu vào', 'Với 1 tài sản rút và tỷ lệ 200 assets / 100 shares, phép chia làm tròn lên yêu cầu đốt 1 share.') + '<div class="formula">n = 1 × 100 = 100\nshares = floor(100 / 200) + 1 = 1</div>' + section('Giới hạn', 'Đây là phép tính minh họa lỗi mục tiêu, chưa phải kết quả chạy compiler hoặc test.');
      else if (tab === 'fix') $('finding-content').innerHTML = section('Vẫn cần kiểm tra', 'Đối chiếu quyền truy cập, chuyển token, cập nhật trạng thái và các hành vi hợp lệ trong dự án đầy đủ. Bản sửa ở đây chỉ thay đổi hướng làm tròn.') + '<div class="callout">Không tìm thấy lại lỗi mục tiêu không đồng nghĩa hợp đồng hết mọi lỗi.</div>';
      else $('finding-content').innerHTML = section('Quan sát trong mẫu', 'Phiên bản này cộng thêm một cổ phần khi phép chia còn dư. Tình huống rút dương nhưng đốt 0 cổ phần đã bị chặn trong mô hình đã nêu.') + section('Trạng thái kết luận', 'Chỉ ghi nhận khác biệt của bản sửa đối với lỗi mục tiêu. Chưa có phân tích LLM hoặc kiểm thử thực được thực hiện trong trình duyệt.') + '<div class="callout">00 finding mẫu ≠ chứng nhận an toàn.</div>';
      return;
    }
    if (tab === 'evidence') {
      $('finding-content').innerHTML = section('Tình huống biên', 'Alice có 1 share. Vault đang giữ 200 đơn vị tài sản, tổng cung 100 shares. Alice gọi <span class="inline-code">withdraw(1)</span>.') + '<div class="formula">shares = floor(1 × 100 / 200) = 0\nassets chuyển cho Alice = 1\nshares bị đốt = 0</div><table class="comparison-table"><caption class="tiny muted" style="text-align:left;padding-bottom:5px">So sánh sau một lần rút, từ cùng trạng thái ban đầu</caption><thead><tr><th>Đại lượng</th><th>Bản lỗi</th><th>Bản sửa</th></tr></thead><tbody><tr><td>Tài sản đã rút</td><td>1</td><td>1</td></tr><tr><td>Cổ phần bị đốt</td><td>0</td><td>1</td></tr><tr><td>Cổ phần Alice còn lại</td><td>1</td><td>0</td></tr></tbody></table>' + '<div class="callout">Bằng chứng là phép tính trên mô hình mẫu; chưa chạy test. Tác động kinh tế còn phụ thuộc đơn vị token, giới hạn và chi phí giao dịch.</div>';
    } else if (tab === 'fix') {
      $('finding-content').innerHTML = section('Làm tròn lên số cổ phần phải đốt', 'Với mô hình không phí này, lượng tài sản rút dương không được quy đổi thành 0 cổ phần. Công thức mẫu:') + '<div class="formula">uint256 n = assets * totalSupply;\nuint256 shares = n / totalAssets;\nif (n % totalAssets != 0) shares += 1;</div>' + section('Kiểm tra bản sửa', 'Cần test biên số nhỏ, trường hợp chia hết, thiếu cổ phần và hành vi rút hợp lệ. Trong dự án thật cần xử lý cả miền giá trị, phép nhân và giả định totalAssets > 0.') + '<div class="callout warning">Khuyến nghị chưa phải bản vá đã được build hoặc kiểm chứng. Chọn snapshot đã sửa để xem đối chứng mẫu.</div>';
    } else if (report.mode === 'A0') {
      $('finding-content').innerHTML = section('Nhận định mẫu từ prompt trực tiếp', 'Phép chia số nguyên trong hàm withdraw có thể làm tròn số cổ phần xuống, gây sai lệch giữa tài sản chuyển đi và cổ phần bị đốt.') + section('Cần làm rõ thêm', 'Phải nêu trạng thái cụ thể, lượng tài sản rút, vai trò người gọi và phép tính chứng minh. Nhận định chung chưa đủ để coi là finding đã xác nhận.') + '<div class="callout warning">Sự khác biệt A0/A1 ở đây được soạn để minh họa giao diện, không khẳng định model thực sẽ cho kết quả như vậy.</div>';
    } else {
      $('finding-content').innerHTML = section('Nguyên nhân gốc', 'Phép chia tại dòng 14 làm tròn xuống. Khi <span class="inline-code">assets × totalSupply &lt; totalAssets</span>, số cổ phần cần đốt bằng 0 nhưng lệnh chuyển tài sản vẫn được thực hiện.') + section('Điều kiện cần', 'Token mẫu có 0 decimals, vault có tài sản và tổng cung dương, không có mức rút tối thiểu bổ sung; giao dịch chuyển token thành công.') + section('Tác động dự kiến', 'Người gọi nhận tài sản mà chưa giảm quyền sở hữu cổ phần tương ứng. Chưa định lượng mức thiệt hại kinh tế ngoài mô hình mẫu.') + '<div class="callout"><strong>Cần người rà soát xác nhận.</strong> Mức MEDIUM là giả định của demo, không phải nhãn severity từ auditor.' + (report.mode === 'A2' ? '<br>Đã kèm 3 thẻ tri thức mẫu. Xem tab cuối để đối chiếu.' : '') + '</div>';
    }
  }
  async function run() {
    if (running) return;
    running = true; const currentGeneration = ++generation;
    $('audit-loading').hidden = false; $('audit-result').hidden = true;
    $('run-audit').disabled = true; input.disabled = true; $('audit-case').disabled = true;
    $('restore-code').disabled = true; $('upload-code').disabled = true;
    document.querySelectorAll('[data-mode]').forEach(el=>el.disabled=true); setButtons(false);
    const stages = ['Đang đọc ngữ cảnh mẫu…','Đang hiển thị bước phân tích…','Đang lập báo cáo mẫu…'];
    for (let i=0;i<3;i++) {
      $('loading-label').textContent = stages[i];
      document.querySelectorAll('[data-audit-step]').forEach((el,j)=>{el.classList.toggle('done',j<i);el.classList.toggle('active',j===i);});
      await new Promise(resolve=>setTimeout(resolve,550));
      if (generation !== currentGeneration) return;
    }
    const key = $('audit-case').value;
    const same = input.value.replace(/\r\n/g,'\n').trim() === cases[key].code.trim();
    report = {kind:same?key:'custom',caseKey:key,mode,review:null};
    $('audit-loading').hidden = true; $('audit-result').hidden = false;
    running = false; $('run-audit').disabled = false; input.disabled = false;
    $('audit-case').disabled = false; $('restore-code').disabled = false; $('upload-code').disabled = false;
    document.querySelectorAll('[data-mode]').forEach(el=>el.disabled=false);
    renderReport(); toast(same?'Đã hiển thị báo cáo mẫu.':'Mã ngoài kịch bản: chưa có kết luận phân tích.');
  }
  function markdown() {
    const key = report.caseKey, isBug = report.kind === 'buggy';
    return `# SCOPE — Báo cáo tham khảo\n\n> DEMO MÔ PHỎNG. Không chạy LLM, Solidity hoặc Foundry.\n\n- Cấu hình mẫu: ${report.mode}\n- Snapshot tham chiếu: ${cases[key].file}\n- Trạng thái: ${report.kind}\n- Nhận xét người rà soát: ${report.review || 'Chưa nhận xét'}\n\n## Ngữ cảnh\n\n${spec}\n\n## Kết luận mẫu\n\n${isBug ? 'M-01: Rút tài sản nhưng không đốt cổ phần.\n\nNguyên nhân: phép chia nguyên làm tròn xuống tại dòng 14. Với assets=1, totalSupply=100, totalAssets=200, shares=0 nhưng 1 asset vẫn chuyển đi.\n\nKhuyến nghị: làm tròn lên số cổ phần phải đốt, kiểm tra biên và hành vi hợp lệ.\n\nSeverity MEDIUM chỉ là giả định; chưa đo tác động kinh tế. Chưa thực thi test.' : report.kind === 'fixed' ? 'Trong kịch bản đã sửa, 1 tài sản rút yêu cầu đốt 1 cổ phần. Chỉ đối chứng lỗi mục tiêu; không chứng nhận toàn bộ contract an toàn.' : 'Chưa phân tích mã tùy ý. Prototype cần backend LLM để đưa ra nhận định.'}\n\n## Nguồn\n\n${report.mode === 'A2' ? sources.map(s=>`- ${s.id}: ${s.title} (thẻ kiến thức tự soạn cho demo)`).join('\n') : 'Không sử dụng truy xuất trong cấu hình này.'}\n`;
  }
  input.addEventListener('input',()=>{refreshLines();invalidate();});
  input.addEventListener('scroll',()=>{$('line-numbers').scrollTop=input.scrollTop;});
  $('audit-case').addEventListener('change',()=>{loadCase();invalidate();});
  $('restore-code').addEventListener('click',()=>{loadCase();invalidate();toast('Đã khôi phục code của snapshot đang chọn.');});
  document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{
    mode=el.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));
    $('mode-description').textContent=descriptions[mode];invalidate();
  }));
  document.querySelectorAll('[data-audit-tab]').forEach(el=>el.addEventListener('click',()=>{tab=el.dataset.auditTab;renderTab();}));
  document.querySelectorAll('[data-review]').forEach(el=>el.addEventListener('click',()=>{report.review=report.review===el.dataset.review?null:el.dataset.review;renderReport();toast('Đã ghi nhận trong phiên xem này.');}));
  $('run-audit').addEventListener('click',run);
  $('export-report').addEventListener('click',()=>download('scope-audit-demo.md',markdown(),'text/markdown;charset=utf-8'));
  $('copy-report').addEventListener('click',()=>copy(markdown()));
  $('upload-code').addEventListener('change',async event=>{
    const file=event.target.files[0]; if(!file)return;
    if(file.size>100000){toast('Demo chỉ mở file tối đa 100 KB.');event.target.value='';return;}
    try {
      const text = await file.text();
      if(running)return;
      input.value=text;$('code-filename').textContent=file.name;refreshLines();invalidate();
      $('input-note').textContent='File được đọc tại máy, chưa gửi đi và chưa được phân tích. Chạy mẫu để xem thông báo ngoài kịch bản.';
      toast('Đã mở file trên máy. Không có dữ liệu được gửi đi.');
    } catch {toast('Không đọc được file. Bạn có thể dán code vào khung.');}
    event.target.value='';
  });
  loadCase();$('business-spec').textContent=spec;
  report={kind:'buggy',caseKey:'buggy',mode:'A1',review:null};renderReport();
})();
