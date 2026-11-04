import { customTool, toast } from '/kit.js';
export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work">
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">1</span>准备</h2><span class="hint">五轮取平均</span></div>
      <p class="t-hint" style="font-size:13px;line-height:1.8">点下面的大区域开始。背景<b>变绿</b>时立刻点（或按空格），别抢跑。五轮之后给平均、最快和分布。</p>
      <div class="t-actions"><button type="button" class="t-btn primary" id="rtBtn">开始测试</button>
        <button type="button" class="t-btn" id="rtReset">重来</button></div>
      <div class="t-stat-row" id="rtStats" style="margin-top:16px"></div>
    </section>
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">2</span>反应区</h2><span class="hint" id="rtState">未开始</span></div>
      <div id="rtArea" style="height:300px;border-radius:10px;background:#e9e3d7;display:flex;align-items:center;justify-content:center;
        flex-direction:column;gap:8px;color:#5c5952;font-size:17px;font-weight:600;cursor:pointer;user-select:none;transition:background .08s;text-align:center;padding:20px">
        <div id="rtMsg">点这里开始</div><div id="rtSub" style="font-size:12.5px;font-weight:400;opacity:.8">等变绿再点</div>
      </div>
    </section>
  </div>`;
  const area = K.$('#rtArea', root), msg = K.$('#rtMsg', root), sub = K.$('#rtSub', root);
  const stateEl = K.$('#rtState', root), statsEl = K.$('#rtStats', root), btn = K.$('#rtBtn', root);
  let phase = 'idle', timer = null, startAt = 0, times = [], round = 0;

  function paint(bg, color, main, s, st) {
    area.style.background = bg; area.style.color = color;
    msg.textContent = main; sub.textContent = s; stateEl.textContent = st;
  }
  function stats() {
    if (!times.length) { statsEl.innerHTML = ''; return; }
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const best = Math.min(...times);
    let bestEver = Number(localStorage.getItem('rt-best') || 0);
    if (!bestEver || best < bestEver) { bestEver = best; localStorage.setItem('rt-best', String(best)); }
    statsEl.innerHTML = [
      { label: '已完成轮次', value: `${times.length}/5` }, { label: '平均', value: avg + 'ms' },
      { label: '最快', value: best + 'ms' }, { label: '历史最佳', value: bestEver + 'ms' },
    ].map((x) => `<div class="t-stat"><b>${x.value}</b><span>${x.label}</span></div>`).join('');
  }
  function next() {
    if (times.length >= 5) {
      phase = 'done';
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      paint('#eaf2ea', '#3d7a4e', `平均 ${avg} ms`, '点「重来」再测一次 · 成绩只存本机', '完成');
      btn.textContent = '再测一次'; stats(); return;
    }
    phase = 'waiting'; round++;
    paint('#d9a29c', '#fff', '等一下…', `第 ${round} / 5 轮 · 变绿再点`, '等待变绿');
    clearTimeout(timer);
    timer = setTimeout(() => {
      phase = 'green'; startAt = performance.now();
      paint('#3d7a4e', '#fff', '点！', '现在点或按空格', '变绿了');
    }, 1200 + Math.random() * 2800);
  }
  function hit() {
    if (phase === 'done') { reset(); next(); return; }
    if (phase === 'idle') { if (times.length === 0) reset(); next(); return; }
    if (phase === 'waiting') {
      clearTimeout(timer); paint('#b3392c', '#fff', '抢跑了', '等变绿再点，这一轮不算 · 点一下重来', '抢跑');
      phase = 'idle'; return;
    }
    if (phase === 'green') {
      const ms = Math.round(performance.now() - startAt);
      times.push(ms);
      paint('#f1ece1', '#23221f', `${ms} ms`, '点一下进入下一轮', `第 ${round} 轮`);
      phase = 'idle'; stats();
      toast(`${ms} ms`);
    }
  }
  function reset() { clearTimeout(timer); times = []; round = 0; phase = 'idle';
    paint('#e9e3d7', '#5c5952', '点这里开始', '等变绿再点', '未开始');
    btn.textContent = '开始测试'; stats(); }
  area.addEventListener('click', hit);
  btn.addEventListener('click', () => { reset(); next(); });
  K.$('#rtReset', root).addEventListener('click', reset);
  document.addEventListener('keydown', (e) => { if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { e.preventDefault(); hit(); } });
  stats();
  K.setAction('开始 / 下一轮', () => hit());
});
