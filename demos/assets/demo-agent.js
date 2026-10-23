'use strict';
(() => {
  const {cases,spec,pocInitial,pocRepaired,staticOutput} = DemoData;
  const {icon,toast,download} = DemoUI;
  const $ = id => document.getElementById(id);
  let index=0, calls=0, tests=0, playing=false, complete=false, initialized=false;
  let timer=null, ticker=null, startedAt=0, elapsed=0, tab='poc', artifact='', logs=[], finalState='idle';
  const caseKey = ()=>$('agent-case').value;
  const limit = ()=>Number($('agent-budget').value);
  const events = [
    {stage:0,flow:'static',run(){
      log('command','[DEMO] Đọc ngữ cảnh tĩnh của ' + cases[caseKey()].file);
      log('info','withdraw(uint256) → cập nhật balanceOf, totalSupply, totalAssets → asset.transfer');
      log('info','Thông tin cấu trúc mẫu; chưa xác nhận lỗ hổng.');
    }},
    {stage:1,flow:'llm',llm:true,run(){
      log('command','[LLM mẫu · 1] Kiểm tra biên số nguyên khi rút tài sản.');
      log('info',caseKey()==='buggy' ? 'Giả thuyết: floor(1 × 100 / 200) = 0 shares. Cần kiểm tra trong harness.' : 'Code có làm tròn lên. Thử cùng điều kiện để kiểm tra lỗi mục tiêu còn tái hiện không.');
    }},
    {stage:2,flow:'llm',llm:true,run(){
      artifact=pocInitial;$('poc-version').textContent='ỨNG VIÊN v1';renderArtifact();
      log('command','[LLM mẫu · 2] Đề xuất PoC nạp 2 assets rồi rút 1 asset.');
      log('info','Harness bắt đầu 198 assets / 99 shares; Alice có 2 assets, chưa có shares.');
    }},
    {stage:3,flow:'test',run(){
      tests++;log('command','$ forge test --match-test test_withdrawRounding  [log mẫu]');
      log('error','[FAIL mẫu] ERC20InsufficientAllowance trong deposit(2).');
      log('warning','Lỗi setup: chưa approve token. Không phải bằng chứng exploit.');
      $('poc-version').textContent='v1 · LỖI SETUP';
    }},
    {stage:3,flow:'llm',llm:true,run(){
      artifact=pocRepaired;$('poc-version').textContent='ỨNG VIÊN v2';renderArtifact();
      log('command','[LLM mẫu · 3] Thêm approve trong PoC; giữ nguyên contract và verifier.');
      log('info','Sau setup: 200 assets / 100 shares; Alice giữ 1 share.');
    }},
    {stage:4,flow:'test',run(){
      tests++;log('command','$ forge test --match-test test_withdrawRounding  [log mẫu]');
      if(caseKey()==='buggy') {
        log('success','[PASS mẫu] Alice nhận 1 asset; số shares không giảm (1 → 1).');
        log('warning','Test do Agent đề xuất PASS. Cần verifier kiểm tra độc lập.');
      } else {
        log('warning','[FAIL mẫu] Assertion shares không đổi không đúng: 1 → 0.');
        log('info','1 asset đã rút, 1 share bị đốt. Chưa thấy vi phạm mục tiêu.');
      }
    }},
    {stage:5,flow:'verify',run(){
      tests++;log('command','[Verifier mẫu] Replay ứng viên trong harness sạch, quyền hạn cố định.');
      markCheck('policy',true);markCheck('actor',true);markCheck('replay',true);
      if(caseKey()==='buggy') {markCheck('impact',true);log('success','Oracle mẫu: tài sản rút > 0 nhưng cổ phần bị đốt = 0.');}
      else {markCheck('impact',false);log('warning','Oracle mẫu: không có vi phạm; cổ phần đã đốt = 1.');}
      $('verifier-title').textContent='Đang đối chiếu';$('verifier-description').textContent='Đã xét actor, quyền và kết quả replay mẫu.';
      $('verifier-badge').textContent='CHECKING';
    }},
    {stage:5,flow:'verify',run(){
      tests++;
      if(caseKey()==='buggy') {
        markCheck('patched',true);
        log('success','[Đối chứng mẫu] Cùng đầu vào trên bản sửa: đốt 1 share; không còn vi phạm mục tiêu.');
      } else {
        log('info','[Đối chứng mẫu] Test hành vi rút bình thường hợp lệ; chưa có lỗi mục tiêu để xác nhận.');
      }
    }},
    {stage:5,flow:'verify',run(){finish(caseKey()==='buggy'?'validated':'rejected');}}
  ];
  function log(level,text) {
    const seconds=startedAt ? (performance.now()-startedAt)/1000 : 0;
    const time=seconds.toFixed(1).padStart(4,'0')+'s';
    logs.push({simulation:true,time,level,text});
    const line=document.createElement('div');line.className='terminal-line '+level;
    const stamp=document.createElement('span');stamp.className='terminal-time';stamp.textContent=time;
    const message=document.createElement('span');message.className='terminal-text';message.textContent=text;
    line.append(stamp,message);$('agent-terminal').append(line);$('agent-terminal').scrollTop=$('agent-terminal').scrollHeight;
  }
  function markCheck(name,passed) {
    const el=document.querySelector(`[data-check="${name}"]`);
    el.classList.remove('pass','fail');el.classList.add(passed?'pass':'fail');
    el.querySelector('.check-symbol').textContent=passed?'✓':'!';
  }
  function setStage(current,done=false) {
    document.querySelectorAll('[data-stage]').forEach(el=>{
      const n=Number(el.dataset.stage);el.classList.toggle('done',done||n<current);el.classList.toggle('current',!done&&n===current);
      el.querySelector('.stage-status').textContent=done||n<current?'xong':n===current?'đang xem':'chờ';
    });
    $('stage-count').textContent=String(done?6:current+1).padStart(2,'0')+' / 06';
  }
  function updateMetrics() {
    $('agent-calls').textContent=String(calls);$('test-calls').textContent=String(tests);
    $('agent-limit').textContent=String(limit());
  }
  function renderArtifact() {
    document.querySelectorAll('[data-agent-tab]').forEach(el=>{
      const selected=el.dataset.agentTab===tab;el.setAttribute('aria-selected',String(selected));el.tabIndex=selected?0:-1;
    });
    $('agent-artifact').setAttribute('aria-labelledby',`agent-tab-${tab}`);
    $('agent-artifact').textContent=tab==='poc' ? artifact||'// PoC sẽ xuất hiện ở bước sinh kịch bản.\n// Các đoạn mã trong demo đã được rút gọn.' : tab==='static' ? staticOutput : spec+'\n\nSetup PoC mẫu: harness bắt đầu 198 assets / 99 shares; Alice có 2 assets. Sau approve và deposit(2), trạng thái là 200 assets / 100 shares, Alice giữ 1 share.\n\nCác đoạn PoC là trích đoạn, không phải project Foundry đầy đủ.\nGiới hạn: không sửa contract, không sửa verifier, không cấp thêm tài sản ngoài setup.';
  }
  function controls() {
    const run=$('run-agent');
    run.innerHTML=icon(playing?'pause':'play')+(playing?'Tạm dừng':complete?'Chạy lại':initialized?'Tiếp tục':'Chạy Agent mẫu');
    $('step-agent').disabled=complete;
    $('export-run').disabled=!initialized;
    $('agent-case').disabled=initialized&&!complete;
    $('agent-budget').disabled=initialized&&!complete;
  }
  function initialize() {
    if(initialized)return;
    initialized=true;startedAt=performance.now();finalState='running';
    $('agent-terminal').replaceChildren();$('agent-status').textContent='Đang quan sát';
    $('agent-status-sub').textContent='kịch bản '+(caseKey()==='buggy'?'bản lỗi':'bản sửa');
    $('session-badge').textContent='SIMULATION';
    log('warning','MÔ PHỎNG: không thực thi LLM, Slither hoặc Foundry.');
    ticker=setInterval(()=>{$('elapsed-time').textContent=((performance.now()-startedAt)/1000).toFixed(1)+'s';},200);
    controls();
  }
  function advance() {
    if(complete)return;
    initialize();
    const event=events[index];
    if(event.llm && calls>=limit()) {finish('budget_exhausted');return;}
    setStage(event.stage);
    document.querySelectorAll('[data-flow]').forEach(el=>el.classList.toggle('active',el.dataset.flow===event.flow));
    if(event.llm)calls++;
    event.run();index++;updateMetrics();
    if(!complete) {
      $('agent-status').textContent=playing?'Đang mô phỏng':'Từng bước';
      $('agent-status-sub').textContent=`sự kiện ${index} / ${events.length}`;
    }
    controls();
  }
  function schedule() {
    timer=setTimeout(()=>{advance();if(playing&&!complete)schedule();},680);
  }
  function pause() {
    playing=false;clearTimeout(timer);
    if(!complete&&initialized){$('agent-status').textContent='Tạm dừng';$('session-badge').textContent='PAUSED';}
    controls();
  }
  function start() {
    if(playing){pause();return;}
    if(complete)reset();
    playing=true;initialize();$('session-badge').textContent='SIMULATION';
    advance();if(!complete)schedule();controls();
  }
  function finish(state) {
    complete=true;playing=false;finalState=state;clearTimeout(timer);clearInterval(ticker);
    elapsed=(performance.now()-startedAt)/1000;$('elapsed-time').textContent=elapsed.toFixed(1)+'s';
    $('run-outcome').hidden=false;$('run-outcome').className='run-outcome'+(state==='validated'?'':' warning');
    $('agent-status').textContent=state==='budget_exhausted'?'Hết ngân sách':'Hoàn tất mẫu';
    $('agent-status-sub').textContent=state==='budget_exhausted'?'dừng trước bước sửa PoC':'đã xét kịch bản đã chọn';
    if(state==='validated') {
      log('success','[Kết luận mẫu] VALIDATED — vi phạm mục tiêu được minh họa trong harness.');
      $('agent-verdict').textContent='Hợp lệ · mẫu';$('session-badge').textContent='DONE';
      $('verifier-badge').textContent='VALIDATED · MẪU';$('verifier-badge').className='badge green';
      $('verifier-status').classList.add('validated');$('verifier-title').textContent='Kịch bản mẫu được chấp nhận';
      $('verifier-description').textContent='1 asset rút · 0 shares đốt ở bản lỗi.';
      $('outcome-title').textContent='Một finding, có bằng chứng minh họa.';
      $('outcome-description').textContent='PoC ban đầu lỗi setup; Agent sửa approve rồi gửi ứng viên đến verifier. Cùng tình huống không tạo vi phạm ở bản sửa. Đây là kịch bản soạn sẵn, không phải kết quả test thực.';
      setStage(5,true);
    } else if(state==='rejected') {
      log('warning','[Kết luận mẫu] REJECTED — ứng viên không chứng minh lỗi mục tiêu trên bản đã sửa.');
      $('agent-verdict').textContent='Không tái hiện';$('session-badge').textContent='DONE';
      $('verifier-badge').textContent='REJECTED · MẪU';$('verifier-badge').className='badge amber';
      $('verifier-title').textContent='Không xác nhận finding mục tiêu';$('verifier-description').textContent='1 asset rút · 1 share đã đốt.';
      $('outcome-title').textContent='Không tái hiện lỗi mục tiêu.';
      $('outcome-description').textContent='Kịch bản nhận định rút tài sản mà không đốt cổ phần bị bác bỏ trên bản sửa. Không suy ra toàn bộ contract an toàn; chỉ kiểm tra tình huống trong mẫu.';
      setStage(5,true);
    } else {
      log('warning','[STOP mẫu] Đã dùng 2/2 lượt LLM. Chưa đủ ngân sách sửa PoC.');
      $('agent-verdict').textContent='Chưa xác nhận';$('session-badge').textContent='BUDGET LIMIT';
      $('verifier-badge').textContent='NOT REACHED';$('verifier-badge').className='badge amber';
      $('verifier-title').textContent='Chưa nhận ứng viên hợp lệ';$('verifier-description').textContent='Phiên dừng sau lỗi setup, trước khi sửa.';
      $('outcome-title').textContent='Dừng có kiểm soát khi hết ngân sách.';
      $('outcome-description').textContent='Chưa xác nhận không đồng nghĩa nhận định sai hoặc contract an toàn. Thử lại với ngân sách 4 lượt để xem phần còn lại của kịch bản.';
      document.querySelector('[data-stage="3"] .stage-status').textContent='bị dừng';
    }
    controls();updateMetrics();
  }
  function reset() {
    clearTimeout(timer);clearInterval(ticker);
    index=0;calls=0;tests=0;playing=false;complete=false;initialized=false;
    startedAt=0;elapsed=0;logs=[];artifact='';finalState='idle';
    $('agent-terminal').innerHTML='<div class="terminal-empty">$ scope agent --case vault-rounding<br><br>Chọn “Chạy Agent mẫu” hoặc “Từng bước”.<br>Thử ngân sách 2 lượt để xem cách hệ thống dừng.</div>';
    $('agent-status').textContent='Sẵn sàng';$('agent-status-sub').textContent='chưa bắt đầu kịch bản';
    $('agent-verdict').textContent='Chưa xác nhận';$('session-badge').textContent='IDLE';
    $('poc-version').textContent='CHƯA SINH';$('elapsed-time').textContent='0.0s';
    $('run-outcome').hidden=true;$('verifier-badge').textContent='WAITING';$('verifier-badge').className='badge neutral';
    $('verifier-status').classList.remove('validated');$('verifier-title').textContent='Chờ ứng viên cuối';
    $('verifier-description').textContent='PASS của test chưa đủ để kết luận.';
    document.querySelectorAll('[data-check]').forEach(el=>{el.classList.remove('pass','fail');el.querySelector('.check-symbol').textContent='';});
    document.querySelectorAll('[data-stage]').forEach(el=>{el.classList.remove('current','done');el.querySelector('.stage-status').textContent='chờ';});
    document.querySelectorAll('[data-flow]').forEach(el=>el.classList.remove('active'));
    $('stage-count').textContent='00 / 06';updateMetrics();renderArtifact();controls();
  }
  $('run-agent').addEventListener('click',start);
  $('step-agent').addEventListener('click',()=>{if(playing)pause();advance();});
  $('reset-agent').addEventListener('click',()=>{reset();toast('Đã đặt lại phiên mẫu.');});
  $('agent-case').addEventListener('change',reset);$('agent-budget').addEventListener('change',reset);
  document.querySelectorAll('[data-agent-tab]').forEach(el=>el.addEventListener('click',()=>{tab=el.dataset.agentTab;renderArtifact();}));
  $('export-run').addEventListener('click',()=>{
    const payload={simulation:true,executed_tools:[],note:'Kịch bản dựng sẵn; không có LLM hoặc Foundry thực thi.',case:caseKey(),snapshot:cases[caseKey()].file,budget:limit(),mock_llm_calls:calls,mock_test_runs:tests,status:complete?finalState:playing?'playing':'paused',observed_seconds:complete?elapsed:(performance.now()-startedAt)/1000,poc_excerpt:artifact,logs};
    download('scope-agent-demo.json',JSON.stringify(payload,null,2),'application/json;charset=utf-8');
  });
  renderArtifact();controls();
})();
