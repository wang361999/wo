// 生活交互 / 文档类：本地存储、计时、canvas 生成、打印排版。全部浏览器本机运行。
export const S = {};

/* 小工具：WebAudio 提示音（在各 render 内部定义，避免依赖顶层 helper） */
const BEEP_NOTE = '提示音用 WebAudio 在本机合成，不加载外部音频。';

/* ---------- To Do ---------- */
S['todo'] = { kind: 'custom', render: (root, K) => {
  const KEY = 'yiyegongju.todo.v1';
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { items = []; }
  const save = () => localStorage.setItem(KEY, JSON.stringify(items));
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>待办清单</h2><span class="hint">只存在这台设备的浏览器里</span></div>
    <div class="t-row"><input class="t-input grow" id="td-text" placeholder="要做什么？回车添加"><select class="t-select" id="td-pri"><option value="普通">普通</option><option value="重要">重要</option><option value="紧急">紧急</option></select><input class="t-input" id="td-due" type="date"><button type="button" class="t-btn primary" id="td-add">添加</button></div>
    <div class="t-chips" style="margin:12px 0"><button type="button" class="t-chip on" data-tdf="全部">全部</button><button type="button" class="t-chip" data-tdf="未完成">未完成</button><button type="button" class="t-chip" data-tdf="已完成">已完成</button><button type="button" class="t-chip" data-tdf="紧急">紧急</button></div>
    <div class="t-refwrap" id="td-list"></div>
    <div class="t-hint" id="td-stat"></div>
  </section></div>`;
  const text = root.querySelector('#td-text'), pri = root.querySelector('#td-pri'), due = root.querySelector('#td-due'), list = root.querySelector('#td-list'), stat = root.querySelector('#td-stat');
  let filter = '全部';
  const draw = () => {
    const now = new Date().toISOString().slice(0, 10);
    const show = items.filter((x) => filter === '全部' || (filter === '未完成' && !x.done) || (filter === '已完成' && x.done) || (filter === '紧急' && x.pri === '紧急'));
    list.innerHTML = show.length ? `<table class="t-table"><thead><tr><th>完成</th><th>事项</th><th>优先级</th><th>截止</th><th></th></tr></thead><tbody>${show.map((x) => `<tr style="${x.done ? 'opacity:.5;text-decoration:line-through' : ''}"><td><input type="checkbox" data-tdcheck="${x.id}" ${x.done ? 'checked' : ''}></td><td>${L.esc(x.text)}</td><td>${L.esc(x.pri)}${x.pri === '紧急' ? ' 🔴' : x.pri === '重要' ? ' 🟠' : ''}</td><td>${L.esc(x.due || '—')}${!x.done && x.due && x.due < now ? ' <b style="color:#a35d5d">已逾期</b>' : ''}</td><td><button type="button" class="t-btn" data-tddel="${x.id}">删</button></td></tr>`).join('')}</tbody></table>` : '<p class="t-hint">还没有事项，上面填一条试试。</p>';
    stat.textContent = `共 ${items.length} 条，已完成 ${items.filter((x) => x.done).length} 条，逾期 ${items.filter((x) => !x.done && x.due && x.due < now).length} 条`;
  };
  const add = () => { const t = text.value.trim(); if (!t) return; items.unshift({ id: Date.now() + Math.random(), text: t, pri: pri.value, due: due.value, done: false }); text.value = ''; due.value = ''; save(); draw(); };
  root.querySelector('#td-add').onclick = add;
  text.onkeydown = (e) => { if (e.key === 'Enter') add(); };
  root.addEventListener('click', (e) => {
    const c = e.target.closest('[data-tdcheck]'); if (c) { const x = items.find((y) => String(y.id) === c.dataset.tdcheck); if (x) { x.done = c.checked; save(); draw(); } return; }
    const d = e.target.closest('[data-tddel]'); if (d) { items = items.filter((y) => String(y.id) !== d.dataset.tddel); save(); draw(); return; }
    const f = e.target.closest('[data-tdf]'); if (f) { root.querySelectorAll('[data-tdf]').forEach((b) => b.classList.toggle('on', b === f)); filter = f.dataset.tdf; draw(); }
  });
  K.setAction('添加待办', add);
  draw();
} };

/* ---------- 便签本 ---------- */
S['notes'] = { kind: 'custom', render: (root, K) => {
  const KEY = 'yiyegongju.notes.v1', COLORS = ['#f6e6b8', '#d9e9d2', '#f2d4cf', '#d7e3f2', '#eadcf2'];
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { items = []; }
  const save = () => localStorage.setItem(KEY, JSON.stringify(items));
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>便签本</h2><span class="hint">点便签直接改，自动保存</span></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="nt-add">＋ 新便签</button><button type="button" class="t-btn" id="nt-copy">复制全部</button></div>
    <div id="nt-wrap" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:14px"></div>
    <p class="t-hint">提示音用 WebAudio 在本机合成，不加载外部音频。</p>
  </section></div>`;
  const wrap = root.querySelector('#nt-wrap');
  const draw = () => {
    wrap.innerHTML = items.length ? items.map((n) => `<div style="background:${n.color};border-radius:6px;padding:12px;min-height:130px;box-shadow:0 2px 8px #0001;position:relative">
      <textarea data-ntext="${n.id}" style="width:100%;height:92px;border:0;background:transparent;resize:none;font:inherit;color:#2f2b26;outline:none">${L.esc(n.text)}</textarea>
      <div style="font-size:11px;opacity:.6">${new Date(n.at).toLocaleString('zh-CN')}</div>
      <button type="button" class="t-btn" data-ncopy="${n.id}" style="position:absolute;top:6px;right:26px;padding:2px 7px">复制</button>
      <button type="button" class="t-btn" data-ndel="${n.id}" style="position:absolute;top:6px;right:4px;padding:2px 7px">×</button>
    </div>`).join('') : '<p class="t-hint">还没有便签，点上面「＋ 新便签」。</p>';
  };
  root.querySelector('#nt-add').onclick = () => { items.unshift({ id: Date.now() + Math.random(), text: '', color: COLORS[items.length % COLORS.length], at: Date.now() }); save(); draw(); wrap.querySelector('textarea')?.focus(); };
  root.querySelector('#nt-copy').onclick = () => K.copy(items.map((n) => n.text).filter(Boolean).join('\n\n---\n\n'));
  root.addEventListener('input', (e) => { const t = e.target.closest('[data-ntext]'); if (t) { const n = items.find((x) => String(x.id) === t.dataset.ntext); if (n) { n.text = t.value; n.at = Date.now(); save(); } } });
  root.addEventListener('click', (e) => {
    const c = e.target.closest('[data-ncopy]'); if (c) { const n = items.find((x) => String(x.id) === c.dataset.ncopy); if (n) K.copy(n.text); return; }
    const d = e.target.closest('[data-ndel]'); if (d) { items = items.filter((x) => String(x.id) !== d.dataset.ndel); save(); draw(); }
  });
  K.setAction('＋ 新便签', () => root.querySelector('#nt-add').click());
  draw();
} };

/* ---------- 计时器（倒计时 / 秒表 / 分段） ---------- */
S['timer'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>计时器</h2><span class="hint">本机运行 · 结束有提示音</span></div>
    <div class="t-chips"><button type="button" class="t-chip on" data-tm="down">倒计时</button><button type="button" class="t-chip" data-tm="up">秒表</button></div>
    <div id="tm-set" class="t-row" style="margin:14px 0"><input class="t-input" id="tm-h" type="number" value="0" min="0" style="width:80px"> 时 <input class="t-input" id="tm-m" type="number" value="5" min="0" style="width:80px"> 分 <input class="t-input" id="tm-s" type="number" value="0" min="0" style="width:80px"> 秒</div>
    <div class="t-out" id="tm-disp" style="font-size:46px;font-weight:700;text-align:center;letter-spacing:2px;font-variant-numeric:tabular-nums">00:05:00</div>
    <div class="t-actions" style="justify-content:center"><button type="button" class="t-btn primary" id="tm-start">开始</button><button type="button" class="t-btn" id="tm-pause">暂停</button><button type="button" class="t-btn" id="tm-lap">计次</button><button type="button" class="t-btn" id="tm-reset">重置</button></div>
    <div class="t-refwrap" id="tm-laps" style="margin-top:12px"></div>
  </section></div>`;
  const disp = root.querySelector('#tm-disp'), laps = root.querySelector('#tm-laps'), setRow = root.querySelector('#tm-set');
  let mode = 'down', tick = null, end = 0, left = 0, elapsed = 0, running = false, lapArr = [], lastLap = 0;
  const beep = () => { try { const AC = window.AudioContext || window.webkitAudioContext, c = new AC(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.setValueAtTime(0.15, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.9); o.start(); o.stop(c.currentTime + 0.9); setTimeout(() => c.close(), 1200); } catch (e) {} };
  const fmtMs = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60, cs = Math.floor((ms % 1000) / 10); return `${L.pad(h)}:${L.pad(m)}:${L.pad(s)}.${L.pad(cs)}`; };
  const show = () => { disp.textContent = mode === 'down' ? fmtMs(left) : fmtMs(elapsed); };
  const totalMs = () => (Number(root.querySelector('#tm-h').value) || 0) * 3600000 + (Number(root.querySelector('#tm-m').value) || 0) * 60000 + (Number(root.querySelector('#tm-s').value) || 0) * 1000;
  const loop = () => { const now = Date.now(); if (mode === 'down') { left = Math.max(0, end - now); if (left <= 0) { stop(); beep(); K.toast('倒计时结束'); } } else elapsed += 100; show(); };
  const start = () => { if (running) return; running = true; if (mode === 'down') { if (left <= 0) left = totalMs(); end = Date.now() + left; } lastLap = elapsed; tick = setInterval(loop, mode === 'down' ? 100 : 100); };
  const stop = () => { running = false; clearInterval(tick); tick = null; };
  const reset = () => { stop(); left = totalMs(); elapsed = 0; lapArr = []; laps.innerHTML = ''; show(); };
  root.querySelector('#tm-start').onclick = start;
  root.querySelector('#tm-pause').onclick = () => { stop(); show(); };
  root.querySelector('#tm-reset').onclick = reset;
  root.querySelector('#tm-lap').onclick = () => { if (mode !== 'up') { K.toast('计次只在秒表模式下用'); return; } lapArr.unshift({ n: lapArr.length + 1, total: elapsed, split: elapsed - lastLap }); lastLap = elapsed; laps.innerHTML = `<table class="t-table"><thead><tr><th>#</th><th>分段</th><th>累计</th></tr></thead><tbody>${lapArr.map((x) => `<tr><td>${x.n}</td><td>${fmtMs(x.split)}</td><td>${fmtMs(x.total)}</td></tr>`).join('')}</tbody></table>`; };
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-tm]'); if (!b) return; root.querySelectorAll('[data-tm]').forEach((x) => x.classList.toggle('on', x === b)); mode = b.dataset.tm; setRow.style.display = mode === 'down' ? '' : 'none'; reset(); });
  K.setAction('开始 / 暂停', () => { if (running) root.querySelector('#tm-pause').click(); else start(); });
  reset();
} };

/* ---------- 番茄钟 ---------- */
S['pomodoro'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>番茄钟</h2><span class="hint">专注 / 短休 / 长休</span></div>
    <div class="t-row"><label class="t-label">专注 <input class="t-input" id="pm-focus" type="number" value="25" min="1" style="width:80px"> 分</label><label class="t-label">短休 <input class="t-input" id="pm-short" type="number" value="5" min="1" style="width:80px"> 分</label><label class="t-label">长休 <input class="t-input" id="pm-long" type="number" value="15" min="1" style="width:80px"> 分</label><label class="t-label">几轮后长休 <input class="t-input" id="pm-rounds" type="number" value="4" min="1" style="width:80px"></label></div>
    <div class="t-chips" style="margin:14px 0"><button type="button" class="t-chip on" data-pmode="focus">🍅 专注</button><button type="button" class="t-chip" data-pmode="short">☕ 短休</button><button type="button" class="t-chip" data-pmode="long">🌙 长休</button></div>
    <div class="t-out" id="pm-disp" style="font-size:46px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums">25:00</div>
    <div class="t-actions" style="justify-content:center"><button type="button" class="t-btn primary" id="pm-start">开始</button><button type="button" class="t-btn" id="pm-pause">暂停</button><button type="button" class="t-btn" id="pm-skip">跳过</button></div>
    <div class="t-hint" id="pm-stat" style="text-align:center;margin-top:12px">已完成 0 个番茄</div>
  </section></div>`;
  const disp = root.querySelector('#pm-disp'), stat = root.querySelector('#pm-stat');
  let mode = 'focus', left = 0, end = 0, tick = null, running = false, done = 0;
  const mins = () => Number(root.querySelector('#pm-' + (mode === 'focus' ? 'focus' : mode === 'short' ? 'short' : 'long')).value) || 25;
  const show = () => { const s = Math.max(0, Math.ceil(left / 1000)); disp.textContent = `${L.pad(Math.floor(s / 60))}:${L.pad(s % 60)}`; };
  const beep = () => { try { const AC = window.AudioContext || window.webkitAudioContext, c = new AC(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 660; g.gain.setValueAtTime(0.15, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1); o.start(); o.stop(c.currentTime + 1); setTimeout(() => c.close(), 1300); } catch (e) {} };
  const setMode = (m) => { mode = m; root.querySelectorAll('[data-pmode]').forEach((x) => x.classList.toggle('on', x.dataset.pmode === m)); stop(); left = mins() * 60000; show(); };
  const stop = () => { running = false; clearInterval(tick); tick = null; };
  const next = () => { beep(); if (mode === 'focus') { done++; const rounds = Number(root.querySelector('#pm-rounds').value) || 4; setMode(done % rounds === 0 ? 'long' : 'short'); } else setMode('focus'); stat.textContent = `已完成 ${done} 个番茄`; };
  const start = () => { if (running) return; running = true; end = Date.now() + left; tick = setInterval(() => { left = Math.max(0, end - Date.now()); show(); if (left <= 0) { stop(); next(); } }, 250); };
  root.querySelector('#pm-start').onclick = start;
  root.querySelector('#pm-pause').onclick = stop;
  root.querySelector('#pm-skip').onclick = () => { stop(); next(); };
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-pmode]'); if (b) setMode(b.dataset.pmode); });
  ['focus', 'short', 'long'].forEach((m) => root.querySelector('#pm-' + (m === 'focus' ? 'focus' : m)).addEventListener('change', () => { if (mode === m && !running) { left = mins() * 60000; show(); } }));
  K.setAction('开始 / 暂停', () => { if (running) stop(); else start(); });
  setMode('focus');
} };

/* ---------- 提词器 ---------- */
S['teleprompter'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>提词器</h2><span class="hint">自动滚屏 · 可镜像 · 全屏</span></div>
    <textarea class="t-textarea" id="tp-text" rows="6" placeholder="把稿子粘进来">各位好，欢迎来到今天的内容。\n\n这里可以写好几段，滚动速度、字号和镜像都能调。\n\n对着镜头读，视线尽量别左右飘。</textarea>
    <div class="t-row" style="margin:12px 0"><label class="t-label">速度 <input class="t-range" id="tp-speed" type="range" min="10" max="200" value="60"></label><span id="tp-speedv">60</span><label class="t-label">字号 <input class="t-input" id="tp-size" type="number" value="36" style="width:80px"></label><label class="t-check"><input type="checkbox" id="tp-mirror">镜像翻转</label><button type="button" class="t-btn" id="tp-full">全屏</button></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="tp-play">开始滚动</button><button type="button" class="t-btn" id="tp-stop">暂停</button><button type="button" class="t-btn" id="tp-top">回到开头</button></div>
    <div id="tp-stage" style="margin-top:14px;height:320px;overflow:hidden;background:#161412;border-radius:8px;position:relative;color:#f5efe4"><div id="tp-inner" style="padding:60px 30px;line-height:1.8;white-space:pre-wrap;font-size:36px"></div></div>
    <p class="t-hint">镜像翻转用于透过分光玻璃拍摄；全屏按钮让提词器铺满屏幕。滚动全程在本机，不上传稿件。</p>
  </section></div>`;
  const text = root.querySelector('#tp-text'), inner = root.querySelector('#tp-inner'), stage = root.querySelector('#tp-stage'), speed = root.querySelector('#tp-speed'), size = root.querySelector('#tp-size'), mirror = root.querySelector('#tp-mirror');
  let raf = null, last = 0, pos = 0;
  const sync = () => { inner.textContent = text.value; inner.style.fontSize = size.value + 'px'; inner.style.transform = mirror.checked ? 'scaleX(-1)' : ''; root.querySelector('#tp-speedv').textContent = speed.value; };
  const step = (t) => { if (!last) last = t; const dt = t - last; last = t; pos += Number(speed.value) * dt / 1000 * 0.6; const max = Math.max(0, inner.scrollHeight - stage.clientHeight + 120); if (pos > max) pos = max; stage.scrollTop = pos; inner.style.transform = (mirror.checked ? 'scaleX(-1) ' : '') + `translateY(${-pos}px)`; raf = requestAnimationFrame(step); };
  const play = () => { if (raf) return; last = 0; raf = requestAnimationFrame(step); };
  const stop = () => { cancelAnimationFrame(raf); raf = null; };
  [text, size, mirror, speed].forEach((x) => x.addEventListener('input', sync));
  root.querySelector('#tp-play').onclick = play;
  root.querySelector('#tp-stop').onclick = stop;
  root.querySelector('#tp-top').onclick = () => { pos = 0; stage.scrollTop = 0; inner.style.transform = mirror.checked ? 'scaleX(-1)' : ''; };
  root.querySelector('#tp-full').onclick = () => { if (stage.requestFullscreen) stage.requestFullscreen(); else K.toast('这个浏览器不支持全屏'); };
  K.setAction('开始 / 暂停滚动', () => { if (raf) stop(); else play(); });
  sync();
} };

/* ---------- 节拍器 ---------- */
S['metronome'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>节拍器</h2><span class="hint">WebAudio 本机合成 · 不加载音频文件</span></div>
    <div class="t-row"><label class="t-label">BPM <input class="t-range" id="mt-bpm" type="range" min="30" max="240" value="120"></label><span id="mt-bpmv" style="font-size:22px;font-weight:700">120</span><select class="t-select" id="mt-beat"><option value="4">4/4</option><option value="3">3/4</option><option value="2">2/4</option><option value="6">6/8</option></select><select class="t-select" id="mt-sound"><option value="wood">木鱼</option><option value="beep">电子</option><option value="click">click</option></select></div>
    <div class="t-actions" style="margin:14px 0"><button type="button" class="t-btn primary" id="mt-start">开始</button><button type="button" class="t-btn" id="mt-stop">停止</button><button type="button" class="t-btn" id="mt-tap">Tap 测速</button></div>
    <div id="mt-dots" style="display:flex;gap:12px;justify-content:center;margin:18px 0"></div>
    <div class="t-hint" id="mt-info">120 BPM = 每拍 500 ms。点 Tap 跟着音乐敲几下可以反推 BPM。</div>
  </section></div>`;
  const bpm = root.querySelector('#mt-bpm'), bpmv = root.querySelector('#mt-bpmv'), beat = root.querySelector('#mt-beat'), sound = root.querySelector('#mt-sound'), dots = root.querySelector('#mt-dots'), info = root.querySelector('#mt-info');
  let timer = null, idx = 0, taps = [];
  const AC = window.AudioContext || window.webkitAudioContext; let ctxA = null;
  const ping = (strong) => { try { if (!ctxA) ctxA = new AC(); const o = ctxA.createOscillator(), g = ctxA.createGain(); o.connect(g); g.connect(ctxA.destination); const f = sound.value === 'wood' ? (strong ? 1000 : 760) : sound.value === 'beep' ? (strong ? 1200 : 900) : (strong ? 2000 : 1500); o.frequency.value = f; g.gain.setValueAtTime(strong ? 0.22 : 0.13, ctxA.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.09); o.start(); o.stop(ctxA.currentTime + 0.1); } catch (e) {} };
  const drawDots = () => { const n = Number(beat.value); dots.innerHTML = Array.from({ length: n }, (_, i) => `<div data-dot="${i}" style="width:34px;height:34px;border-radius:50%;background:${i === idx ? '#b4552d' : '#ddd6cc'};transition:background .1s"></div>`).join(''); };
  const tickFn = () => { ping(idx === 0); drawDots(); idx = (idx + 1) % Number(beat.value); };
  const start = () => { if (timer) return; idx = 0; tickFn(); timer = setInterval(tickFn, 60000 / Number(bpm.value)); };
  const stop = () => { clearInterval(timer); timer = null; drawDots(); };
  bpm.addEventListener('input', () => { bpmv.textContent = bpm.value; info.textContent = `${bpm.value} BPM = 每拍 ${L.round(60000 / Number(bpm.value), 0)} ms。点 Tap 跟着音乐敲几下可以反推 BPM。`; if (timer) { stop(); start(); } });
  beat.addEventListener('change', () => { idx = 0; drawDots(); });
  root.querySelector('#mt-start').onclick = start;
  root.querySelector('#mt-stop').onclick = stop;
  root.querySelector('#mt-tap').onclick = () => { const t = Date.now(); taps = taps.filter((x) => t - x < 3000); taps.push(t); if (taps.length >= 3) { const avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1), v = L.clamp(Math.round(60000 / avg), 30, 240); bpm.value = v; bpm.dispatchEvent(new Event('input')); } };
  K.setAction('开始 / 停止', () => { if (timer) stop(); else start(); });
  drawDots();
} };

/* ---------- 做个决定（转盘） ---------- */
S['decision-wheel'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>做个决定</h2><span class="hint">转一下，交给运气</span></div>
    <div class="t-row" style="align-items:flex-start"><textarea class="t-textarea grow" id="dw-opts" rows="7" placeholder="每行一个选项，可写 名称,权重">吃火锅,1\n吃烤肉,1\n在家做饭,2\n点外卖,1</textarea>
      <div style="min-width:260px;text-align:center"><canvas id="dw-cv" width="260" height="260" style="max-width:100%;border-radius:50%"></canvas><div class="t-hint" id="dw-result" style="margin-top:10px;font-size:16px;font-weight:700">—</div></div></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="dw-spin">转！</button><button type="button" class="t-btn" id="dw-shuffle">打乱顺序</button></div>
    <div class="t-hint">权重越大占的扇面越宽。结果纯随机，不记录也不上传。</div>
  </section></div>`;
  const opts = root.querySelector('#dw-opts'), cv = root.querySelector('#dw-cv'), g = cv.getContext('2d'), res = root.querySelector('#dw-result');
  const COLORS = ['#b4552d', '#c98a4b', '#7d9a76', '#6b8fa8', '#9b7aa0', '#c0a062', '#8c8c8c', '#a35d5d', '#5f8c7a', '#b07b4f'];
  let angle = 0, spinning = false, last = '';
  const parse = () => L.nonEmptyLines(opts.value).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0] || '未命名', w: Math.max(0.01, Number(p[1]) || 1) }; });
  const draw = (list) => {
    const R = 125, cx = 130, cy = 130, total = list.reduce((a, x) => a + x.w, 0);
    g.clearRect(0, 0, 260, 260); let a0 = angle;
    list.forEach((x, i) => { const a1 = a0 + x.w / total * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.fillStyle = COLORS[i % COLORS.length]; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.save(); g.translate(cx, cy); g.rotate((a0 + a1) / 2); g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = 'bold 13px sans-serif'; g.fillText(x.name.slice(0, 8), R - 12, 5); g.restore(); a0 = a1; });
    g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fillStyle = '#2f2b26'; g.fill();
  };
  const spin = () => {
    if (spinning) return; const list = parse(); if (list.length < 2) { K.toast('至少写两个选项'); return; }
    spinning = true; const target = angle + Math.PI * 2 * (4 + Math.random() * 3), dur = 3200, t0 = performance.now(), from = angle;
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const frame = (t) => { const p = Math.min(1, (t - t0) / dur); angle = from + (target - from) * ease(p); draw(list); if (p < 1) requestAnimationFrame(frame); else { spinning = false; const total = list.reduce((a, x) => a + x.w, 0); let a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), acc = 0, hit = list[0]; for (const x of list) { acc += x.w / total * Math.PI * 2; if (a <= acc) { hit = x; break; } } res.textContent = '🎯 ' + hit.name; last = hit.name; } };
    requestAnimationFrame(frame);
  };
  opts.addEventListener('input', () => draw(parse()));
  root.querySelector('#dw-spin').onclick = spin;
  root.querySelector('#dw-shuffle').onclick = () => { const list = parse(); for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } opts.value = list.map((x) => x.name + ',' + x.w).join('\n'); draw(list); };
  K.setAction('转！', spin);
  draw(parse());
} };

/* ---------- 活动分组 ---------- */
S['group-split'] = { kind: 'form', titleIn: '名单与规则', titleOut: '分组结果', wide: true,
  fields: [
    { id: 'names', label: '名单（每行一个，可写 姓名,属性）', type: 'textarea', rows: 8, default: '小明,男\n小红,女\n小刚,男\n小丽,女\n小强,男\n小美,女\n小军,男\n小娜,女' },
    { id: 'way', label: '怎么分', type: 'select', options: ['固定组数', '每组固定人数'] },
    { id: 'n', label: '组数 / 每组人数', type: 'number', default: 3 },
    { id: 'balance', label: '按属性均衡', type: 'checkbox', default: true },
    { id: 'ban', label: '禁止同组（逗号分隔人名）', type: 'text', default: '' }],
  primary: '复制分组', hintOut: '先洗牌再按「属性均衡」轮转分配，尽量让各组人数与属性比例接近。禁止同组的约束会做有限次重试，冲突太多时会如实提示。',
  compute: (v) => {
    const E = L.esc, list = L.nonEmptyLines(v.names).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0] || '未命名', attr: p[1] || '' }; });
    if (list.length < 2) return { error: '名单至少两个人' };
    const k = v.way === '固定组数' ? L.clamp(Math.round(v.n), 1, list.length) : Math.ceil(list.length / L.clamp(Math.round(v.n), 1, list.length));
    const ban = String(v.ban || '').split(/[,，\s]+/).filter(Boolean);
    const ok = (groups) => ban.length < 2 ? true : groups.every((g) => !ban.every((b) => g.some((x) => x.name === b)));
    let groups = [], good = false;
    for (let attempt = 0; attempt < 60 && !good; attempt++) {
      const shuffled = L.shuffle(list);
      groups = Array.from({ length: k }, () => []);
      if (v.balance) { const buckets = {}; shuffled.forEach((x) => { const a = x.attr || '_'; (buckets[a] = buckets[a] || []).push(x); }); let gi = 0; Object.values(buckets).forEach((arr) => arr.forEach((x) => { groups[gi % k].push(x); gi++; })); }
      else shuffled.forEach((x, i) => groups[i % k].push(x));
      good = ok(groups);
    }
    const text = [`${list.length} 人分成 ${groups.length} 组${good ? '' : '（禁止同组约束没能完全满足，已尽量避开）'}`, '', ...groups.map((g, i) => `第 ${i + 1} 组（${g.length} 人）：${g.map((x) => E(x.name)).join('、')}`)].join('\n');
    return { text, copy: text, stats: [{ label: '组数', value: groups.length + ' 组' }, { label: '人数', value: list.length + ' 人' }, { label: '约束', value: good ? '已满足' : '部分满足' }],
      preview: `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">${groups.map((g, i) => `<div style="background:#f3eee6;border-radius:8px;padding:10px"><b>第 ${i + 1} 组 · ${g.length} 人</b><div style="margin-top:6px;font-size:13px">${g.map((x) => E(x.name) + (x.attr ? `<small style="opacity:.6">(${E(x.attr)})</small>` : '')).join('　')}</div></div>`).join('')}</div>` };
  } };

/* ---------- 记忆卡片 ---------- */
S['flashcard'] = { kind: 'custom', render: (root, K) => {
  const KEY = 'yiyegongju.flashcard.v1';
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>记忆卡片</h2><span class="hint">一行一张：问题 | 答案 | 分组</span></div>
    <textarea class="t-textarea" id="fc-src" rows="5" placeholder="apple | 苹果 | 单词\nHTTP 404 | 资源未找到 | 网络\n光合作用 | 植物把光能转成化学能 | 生物">apple | 苹果 | 单词\nHTTP 404 | 资源未找到 | 网络\n光合作用 | 植物把光能转成化学能 | 生物\nTCP | 传输控制协议 | 网络</textarea>
    <div class="t-row" style="margin:12px 0"><select class="t-select" id="fc-group"><option value="">全部分组</option></select><button type="button" class="t-btn" id="fc-shuffle">洗牌</button><button type="button" class="t-btn" id="fc-reset">重置掌握</button><span class="t-hint" id="fc-prog"></span></div>
    <div id="fc-card" style="min-height:180px;background:#f3eee6;border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;font-size:22px;cursor:pointer;user-select:none"></div>
    <div class="t-actions" style="margin-top:12px;justify-content:center"><button type="button" class="t-btn" id="fc-prev">← 上一张</button><button type="button" class="t-btn primary" id="fc-flip">翻面</button><button type="button" class="t-btn" id="fc-next">下一张 →</button><button type="button" class="t-btn" id="fc-know">✓ 已掌握</button></div>
    <div class="t-hint" style="margin-top:10px" id="fc-back"></div>
  </section></div>`;
  const src = root.querySelector('#fc-src'), card = root.querySelector('#fc-card'), group = root.querySelector('#fc-group'), prog = root.querySelector('#fc-prog'), back = root.querySelector('#fc-back');
  let cards = [], idx = 0, flipped = false, known = {};
  try { known = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { known = {}; }
  const parse = () => L.nonEmptyLines(src.value).map((l, i) => { const p = l.split('|').map((x) => x.trim()); return { id: i, q: p[0] || '?', a: p[1] || '（没写答案）', g: p[2] || '默认' }; });
  const rebuild = () => { cards = parse(); const gs = [...new Set(cards.map((x) => x.g))]; const cur = group.value; group.innerHTML = '<option value="">全部分组</option>' + gs.map((x) => `<option value="${L.esc(x)}">${L.esc(x)}</option>`).join(''); group.value = gs.includes(cur) ? cur : ''; idx = 0; flipped = false; show(); };
  const active = () => group.value ? cards.filter((x) => x.g === group.value) : cards;
  const show = () => { const a = active(); if (!a.length) { card.textContent = '没有卡片，先在上面按「问题 | 答案 | 分组」写几行'; prog.textContent = ''; return; } idx = L.clamp(idx, 0, a.length - 1); const c = a[idx]; card.textContent = flipped ? c.a : c.q; card.style.background = flipped ? '#e6efe3' : '#f3eee6'; prog.textContent = `${idx + 1} / ${a.length}　已掌握 ${a.filter((x) => known[x.g + '|' + x.q]).length} 张`; back.textContent = flipped ? '答案面 · 点卡片也能翻回去' : '问题面 · 点卡片翻开答案'; };
  const flip = () => { flipped = !flipped; show(); };
  src.addEventListener('input', rebuild);
  group.addEventListener('change', () => { idx = 0; flipped = false; show(); });
  card.onclick = flip;
  root.querySelector('#fc-flip').onclick = flip;
  root.querySelector('#fc-prev').onclick = () => { idx--; flipped = false; show(); };
  root.querySelector('#fc-next').onclick = () => { idx++; flipped = false; show(); };
  root.querySelector('#fc-know').onclick = () => { const a = active(); if (!a.length) return; const c = a[idx]; known[c.g + '|' + c.q] = 1; localStorage.setItem(KEY, JSON.stringify(known)); idx++; flipped = false; show(); K.toast('已标记掌握'); };
  root.querySelector('#fc-shuffle').onclick = () => { cards = L.shuffle(cards); idx = 0; flipped = false; show(); };
  root.querySelector('#fc-reset').onclick = () => { known = {}; localStorage.removeItem(KEY); show(); };
  K.setAction('翻面 / 下一张', () => { if (!flipped) flip(); else root.querySelector('#fc-next').click(); });
  rebuild();
} };

/* ---------- 在线刷题 ---------- */
S['quiz'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>在线刷题</h2><span class="hint">粘题库 → 即时判分</span></div>
    <textarea class="t-textarea" id="qz-src" rows="6" placeholder="每行一题：题目 | A.xxx | B.xxx | C.xxx | D.xxx | 答案 | 解析">地球自转一周约多久？ | A.12小时 | B.24小时 | C.30天 | D.365天 | B | 一个太阳日约 24 小时\nHTTP 200 表示？ | A.未找到 | B.成功 | C.重定向 | D.服务端错误 | B | 200 OK\n水的化学式是？ | A.H2O | B.CO2 | C.O2 | D.NaCl | A | 两个氢一个氧</textarea>
    <div class="t-row" style="margin:12px 0"><button type="button" class="t-btn primary" id="qz-start">开始练习</button><button type="button" class="t-btn" id="qz-shuffle">乱序</button><span class="t-hint" id="qz-prog"></span></div>
    <div id="qz-stage"></div>
    <div class="t-refwrap" id="qz-result" style="margin-top:12px"></div>
  </section></div>`;
  const src = root.querySelector('#qz-src'), stage = root.querySelector('#qz-stage'), prog = root.querySelector('#qz-prog'), result = root.querySelector('#qz-result');
  let qs = [], i = 0, right = 0, answered = false;
  const parse = () => L.nonEmptyLines(src.value).map((l) => { const p = l.split('|').map((x) => x.trim()); const opts = p.slice(1, -2).filter(Boolean); const ans = p[p.length - 2]; const exp = p[p.length - 1]; return { q: p[0], opts, ans, exp }; }).filter((x) => x.q && x.opts.length && x.ans);
  const show = () => {
    if (!qs.length) { stage.innerHTML = '<p class="t-hint">题库是空的，或格式不对。每行：题目 | A.xxx | B.xxx | 答案 | 解析</p>'; return; }
    if (i >= qs.length) { stage.innerHTML = `<div class="t-out" style="font-size:20px">🎉 做完了：${right} / ${qs.length}，正确率 ${L.round(right / qs.length * 100, 1)}%</div>`; return; }
    const q = qs[i]; answered = false;
    stage.innerHTML = `<div class="t-hint">第 ${i + 1} / ${qs.length} 题</div><div style="font-size:18px;font-weight:700;margin:10px 0">${L.esc(q.q)}</div><div id="qz-opts">${q.opts.map((o, j) => `<button type="button" class="t-btn" data-qo="${L.esc(o)}" style="display:block;width:100%;text-align:left;margin:6px 0">${L.esc(o)}</button>`).join('')}</div><div id="qz-fb" style="margin-top:10px"></div><button type="button" class="t-btn primary" id="qz-next" style="display:none;margin-top:10px">下一题 →</button>`;
    prog.textContent = `已答 ${i} 题，答对 ${right} 题`;
  };
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qo]'); if (b && !answered) {
      answered = true; const q = qs[i], pick = b.dataset.qo, ok = pick.trim().replace(/^[A-Da-d][.、.]\s*/, '').startsWith(q.ans.replace(/^[A-Da-d][.、.]\s*/, '')) || pick.trim()[0] === q.ans.trim()[0];
      if (ok) right++;
      stage.querySelectorAll('[data-qo]').forEach((x) => { const isAns = x.dataset.qo.trim()[0] === q.ans.trim()[0]; if (isAns) x.style.background = '#cfe3cf'; if (x === b && !ok) x.style.background = '#f2c9bd'; x.disabled = true; });
      stage.querySelector('#qz-fb').innerHTML = `<div style="font-weight:700;color:${ok ? '#4b7a4b' : '#a35d5d'}">${ok ? '✓ 答对了' : '✗ 答错了，正确答案 ' + L.esc(q.ans)}</div><div class="t-hint">${L.esc(q.exp || '（这题没写解析）')}</div>`;
      const nx = stage.querySelector('#qz-next'); nx.style.display = ''; nx.onclick = () => { i++; show(); };
    }
  });
  root.querySelector('#qz-start').onclick = () => { qs = parse(); i = 0; right = 0; result.innerHTML = ''; show(); };
  root.querySelector('#qz-shuffle').onclick = () => { qs = L.shuffle(parse()); i = 0; right = 0; result.innerHTML = ''; show(); K.toast('已乱序'); };
  K.setAction('开始练习', () => root.querySelector('#qz-start').click());
  show();
} };

/* ---------- 简历生成器 ---------- */
S['resume'] = { kind: 'form', titleIn: '简历内容', titleOut: 'A4 预览', wide: true,
  fields: [
    { id: 'name', label: '姓名', type: 'text', default: '张三' },
    { id: 'job', label: '求职意向', type: 'text', default: '前端工程师' },
    { id: 'contact', label: '联系方式', type: 'text', default: '138-0000-0000 | zhangsan@example.com' },
    { id: 'summary', label: '个人简介', type: 'textarea', rows: 3, default: '5 年前端开发经验，熟悉组件化与工程化，主导过多个从 0 到 1 的项目。' },
    { id: 'exp', label: '工作经历（每行一段）', type: 'textarea', rows: 5, default: '2022-至今　某某科技　前端工程师｜负责设计系统与构建优化，首屏时间下降 40%\n2019-2022　某某网络　Web 开发｜维护千万级 PV 的后台与活动页' },
    { id: 'edu', label: '教育经历', type: 'textarea', rows: 2, default: '2015-2019　某某大学　计算机科学与技术　本科' },
    { id: 'skill', label: '技能（逗号分隔）', type: 'text', default: 'JavaScript, TypeScript, React, Node.js, Vite, CSS' },
    { id: 'theme', label: '配色', type: 'select', options: ['朱砂', '墨蓝', '松绿'] }],
  primary: '复制纯文本版',
  actions: [{ label: '打印 / 存为 PDF', run: (v, ctx) => {
    const src = ctx.root.querySelector('#rs-paper') || document.querySelector('#rs-paper');
    if (!src) return;
    const clone = src.cloneNode(true); clone.id = 'rs-print-paper';
    clone.style.cssText = 'display:block!important;max-width:none!important;box-shadow:none!important;border-radius:0!important;margin:0!important;padding:20mm 18mm';
    document.body.appendChild(clone);
    const st = document.createElement('style');
    st.textContent = '@media print{body>*{display:none!important}#rs-print-paper{display:block!important}@page{size:A4;margin:0}}';
    document.head.appendChild(st);
    setTimeout(() => { window.print(); setTimeout(() => { clone.remove(); st.remove(); }, 800); }, 60);
  } }],
  hintOut: '预览按 A4 比例排版，「打印 / 存为 PDF」会只打印简历区域（浏览器打印对话框里选「另存为 PDF」）。内容只在本机。',
  compute: (v) => {
    const E = L.esc, C = { '朱砂': '#b4552d', '墨蓝': '#36536b', '松绿': '#4b6b52' }[v.theme] || '#b4552d';
    const line = (s) => L.nonEmptyLines(s).map((x) => `<div style="margin:3px 0">${E(x)}</div>`).join('');
    const html = `<div id="rs-paper" style="background:#fff;color:#2f2b26;padding:38px 42px;max-width:760px;margin:0 auto;box-shadow:0 2px 14px #0002;font-family:system-ui,'PingFang SC',sans-serif;line-height:1.65">
      <div style="border-bottom:3px solid ${C};padding-bottom:12px"><div style="font-size:30px;font-weight:800">${E(v.name)}</div><div style="color:${C};font-size:16px;margin-top:4px">${E(v.job)}</div><div style="font-size:12px;opacity:.7;margin-top:6px">${E(v.contact)}</div></div>
      <div style="margin-top:18px"><div style="font-weight:700;color:${C};border-left:3px solid ${C};padding-left:8px">个人简介</div><div style="font-size:13px;margin-top:6px">${E(v.summary)}</div></div>
      <div style="margin-top:16px"><div style="font-weight:700;color:${C};border-left:3px solid ${C};padding-left:8px">工作经历</div><div style="font-size:13px;margin-top:6px">${line(v.exp)}</div></div>
      <div style="margin-top:16px"><div style="font-weight:700;color:${C};border-left:3px solid ${C};padding-left:8px">教育经历</div><div style="font-size:13px;margin-top:6px">${line(v.edu)}</div></div>
      <div style="margin-top:16px"><div style="font-weight:700;color:${C};border-left:3px solid ${C};padding-left:8px">技能</div><div style="margin-top:6px">${String(v.skill).split(/[,，]/).filter(Boolean).map((x) => `<span style="display:inline-block;background:${C}18;color:${C};padding:3px 9px;border-radius:12px;font-size:12px;margin:2px 4px 2px 0">${E(x.trim())}</span>`).join('')}</div></div>
    </div>`;
    const plain = [`${v.name}　${v.job}`, v.contact, '', '【个人简介】', v.summary, '', '【工作经历】', v.exp, '', '【教育经历】', v.edu, '', '【技能】', v.skill].join('\n');
    return { html, copy: plain, text: plain, stats: [{ label: '配色', value: L.esc(v.theme) }],
      preview: '' };
  } };

/* ---------- 纸张模板 ---------- */
S['paper'] = { kind: 'custom', render: (root, K) => {
  const T = {
    '横线笔记': 'repeating-linear-gradient(#fff 0,#fff 27px,#c9d6e5 28px,#fff 29px)',
    '方格坐标': 'repeating-linear-gradient(0deg,#fff 0,#fff 19px,#d9e2ea 20px),repeating-linear-gradient(90deg,#fff 0,#fff 19px,#d9e2ea 20px)',
    '点阵': 'radial-gradient(#c4cfd9 1px,transparent 1.2px) 0 0/20px 20px',
    '米字格': 'repeating-linear-gradient(0deg,#e7cfc0 0 1px,transparent 1px 80px),repeating-linear-gradient(90deg,#e7cfc0 0 1px,transparent 1px 80px)',
    '康奈尔笔记': 'linear-gradient(90deg,transparent 0 28%,#d9c3b0 28% 28.4%,transparent 28.4%),linear-gradient(0deg,transparent 0 72%,#d9c3b0 72% 72.4%,transparent 72.4%),repeating-linear-gradient(#fff 0,#fff 27px,#c9d6e5 28px,#fff 29px)',
    '五线谱': 'repeating-linear-gradient(#fff 0,#fff 11px,#8a95a0 12px,#fff 13px,#fff 23px,#8a95a0 24px,#fff 25px,#fff 35px,#8a95a0 36px,#fff 37px,#fff 47px,#8a95a0 48px,#fff 49px,#fff 59px,#8a95a0 60px,#fff 61px,#fff 85px,#fff 86px)',
    '日程表': 'repeating-linear-gradient(0deg,#fff 0,#fff 59px,#c9d6e5 60px),repeating-linear-gradient(90deg,#fff 0,#fff 149px,#c9d6e5 150px)',
    '空白 A4': 'none',
  };
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>纸张模板</h2><span class="hint">选模板 → 打印或存 PDF</span></div>
    <div class="t-row"><select class="t-select" id="pp-tpl">${Object.keys(T).map((k) => `<option value="${L.esc(k)}">${L.esc(k)}</option>`).join('')}</select><select class="t-select" id="pp-size"><option value="A4">A4</option><option value="A5">A5</option></select><button type="button" class="t-btn primary" id="pp-print">打印 / 存为 PDF</button></div>
    <div id="pp-paper" style="background:#fff;margin:16px auto;width:100%;max-width:700px;aspect-ratio:210/297;box-shadow:0 2px 14px #0002;border-radius:2px"></div>
    <p class="t-hint">模板是纯 CSS 画的，打印时按比例铺满纸张。米字格 / 五线谱适合练字和记谱；想写内容可以打印后手写，或截图再标注。</p>
  </section></div>`;
  const tpl = root.querySelector('#pp-tpl'), paper = root.querySelector('#pp-paper'), size = root.querySelector('#pp-size');
  const draw = () => { paper.style.background = T[tpl.value]; paper.style.backgroundSize = 'auto'; paper.style.maxWidth = size.value === 'A5' ? '500px' : '700px'; };
  tpl.onchange = draw; size.onchange = draw;
  root.querySelector('#pp-print').onclick = () => {
    const src = root.querySelector('#pp-paper');
    const clone = src.cloneNode(true); clone.id = 'pp-print-paper';
    clone.style.cssText = 'background:' + src.style.background + ';background-size:auto;display:block!important;position:static!important;width:100%!important;height:100vh!important;max-width:none!important;aspect-ratio:auto!important;box-shadow:none!important;print-color-adjust:exact;-webkit-print-color-adjust:exact';
    document.body.appendChild(clone);
    const st = document.createElement('style');
    st.textContent = '@media print{body>*{display:none!important}#pp-print-paper{display:block!important}@page{size:A4;margin:0}}';
    document.head.appendChild(st);
    setTimeout(() => { window.print(); setTimeout(() => { clone.remove(); st.remove(); }, 800); }, 60);
  };
  K.setAction('打印 / 存为 PDF', () => root.querySelector('#pp-print').click());
  draw();
} };

/* ---------- 身份证打印 ---------- */
S['id-card-print'] = { kind: 'file', titleIn: '身份证正反面', titleOut: 'A4 排版', multiple: true,
  accept: 'image/*', dropTitle: '拖入身份证正面 / 反面照片（或粘贴）', primary: '生成排版', auto: false,
  fields: [{ id: 'scale', label: '缩放', type: 'range', min: 50, max: 120, default: 100, unit: '%' }],
  note: '按身份证实物 85.6 × 54 mm 比例，正反面上下排在 A4 中央，带裁切虚线。图片只在本机处理，不上传。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先放入 1–2 张照片' };
    const W = 1240, H = 1754, cw = 856 * v.scale / 100, ch = 540 * v.scale / 100;
    const cv = L.canvasOf(W, H), g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#bbb'; g.setLineDash([8, 6]); g.lineWidth = 1;
    const places = [{ x: (W - cw) / 2, y: H / 2 - ch - 40 }, { x: (W - cw) / 2, y: H / 2 + 40 }];
    for (let i = 0; i < Math.min(2, files.length); i++) {
      try {
        const im = await L.imageFromFile(files[i]);
        g.setLineDash([]); g.fillStyle = '#f7f4ef'; g.fillRect(places[i].x - 6, places[i].y - 6, cw + 12, ch + 12);
        const r = Math.min(cw / im.naturalWidth, ch / im.naturalHeight);
        const dw = im.naturalWidth * r, dh = im.naturalHeight * r;
        g.drawImage(im, places[i].x + (cw - dw) / 2, places[i].y + (ch - dh) / 2, dw, dh);
        g.strokeStyle = '#c4bcb0'; g.lineWidth = 2; g.strokeRect(places[i].x, places[i].y, cw, ch);
        g.setLineDash([8, 6]);
      } catch (e) { return { error: '第 ' + (i + 1) + ' 张图读不出来：' + e.message }; }
    }
    g.setLineDash([]); g.fillStyle = '#888'; g.font = '20px sans-serif'; g.textAlign = 'center';
    g.fillText('沿虚线裁切 · 正反面可背对背塑封', W / 2, H - 60);
    const u8 = await L.canvasU8(cv, 'image/png');
    const url = URL.createObjectURL(new Blob([u8], { type: 'image/png' }));
    return { text: `已按身份证比例把 ${Math.min(2, files.length)} 张图排到 A4（${W}×${H}px，约 300DPI）。下载 PNG 后按 100% 比例打印，或直接在浏览器里打印。`,
      preview: `<img src="${url}" style="max-height:420px;border:1px solid #ddd">`,
      stats: [{ label: '文件数', value: Math.min(2, files.length) + ' 张' }, { label: '画布', value: W + '×' + H }],
      files: [{ name: '身份证-A4排版.png', data: u8, mime: 'image/png', label: '下载 PNG' }] };
  } };

/* ---------- 寻宠启事 ---------- */
S['pet-missing-poster'] = { kind: 'file', titleIn: '照片与信息', titleOut: '寻宠海报', multiple: false,
  accept: 'image/*', dropTitle: '拖入宠物照片（或粘贴）', primary: '生成海报', auto: false,
  fields: [
    { id: 'name', label: '宠物名字', type: 'text', default: '豆豆' },
    { id: 'kind', label: '种类 / 特征', type: 'text', default: '橘猫，胸前有白毛，戴蓝色项圈' },
    { id: 'place', label: '走失地点与时间', type: 'text', default: '6 月 20 日晚，XX 小区南门附近' },
    { id: 'reward', label: '酬金', type: 'text', default: '当面酬谢 2000 元' },
    { id: 'phone', label: '联系电话', type: 'text', default: '13800000000' },
    { id: 'mask', label: '电话脱敏', type: 'checkbox', default: true }],
  note: '生成 A4 竖版 PNG，可直接打印。电话默认中间四位打码，避免被骚扰电话爬走；照片只在本机处理。',
  process: async (files, v, ctx) => {
    const W = 1240, H = 1754, cv = L.canvasOf(W, H), g = cv.getContext('2d');
    g.fillStyle = '#fbf7ef'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#b4552d'; g.fillRect(0, 0, W, 190);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 88px sans-serif'; g.fillText('寻 宠 启 事', W / 2, 130);
    let ph = String(v.phone || '').trim();
    if (v.mask && ph.length >= 7) ph = ph.slice(0, 3) + '****' + ph.slice(-4);
    if (files.length) {
      try { const im = await L.imageFromFile(files[0]); const box = 900, x = (W - box) / 2, y = 240;
        g.fillStyle = '#fff'; g.fillRect(x - 10, y - 10, box + 20, box + 20);
        const r = Math.min(box / im.naturalWidth, box / im.naturalHeight), dw = im.naturalWidth * r, dh = im.naturalHeight * r;
        g.drawImage(im, x + (box - dw) / 2, y + (box - dh) / 2, dw, dh); g.strokeStyle = '#ded5c8'; g.strokeRect(x, y, box, box);
      } catch (e) { return { error: '照片读不出来：' + e.message }; }
    } else { g.fillStyle = '#e9e1d4'; g.fillRect(170, 240, 900, 900); g.fillStyle = '#a49a8c'; g.font = '30px sans-serif'; g.fillText('（没放照片，这里留白可手贴）', W / 2, 700); }
    g.fillStyle = '#2f2b26'; g.textAlign = 'left'; g.font = 'bold 48px sans-serif';
    const lines = [`名字：${v.name}`, `特征：${v.kind}`, `走失：${v.place}`, `酬谢：${v.reward}`, `联系：${ph}`];
    lines.forEach((l, i) => { g.font = i === 0 ? 'bold 52px sans-serif' : '38px sans-serif'; g.fillText(l.slice(0, 22), 110, 1240 + i * 82); });
    g.fillStyle = '#b4552d'; g.font = 'bold 44px sans-serif'; g.fillText('看到请立刻联系，万分感谢！', 110, 1680);
    const u8 = await L.canvasU8(cv, 'image/png'), url = URL.createObjectURL(new Blob([u8], { type: 'image/png' }));
    return { text: `海报已生成（A4 竖版 ${W}×${H}px）。电话${v.mask ? '已脱敏为 ' + ph : '未脱敏'}。`, preview: `<img src="${url}" style="max-height:420px;border:1px solid #ddd">`,
      stats: [{ label: '尺寸', value: 'A4 竖版' }, { label: '电话', value: ph }], files: [{ name: '寻宠启事.png', data: u8, mime: 'image/png', label: '下载 PNG' }] };
  } };

/* ---------- 便签墙 ---------- */
S['sticky-board'] = { kind: 'custom', render: (root, K) => {
  const KEY = 'yiyegongju.sticky.v1';
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>便签墙</h2><span class="hint">拖动 · 旋转 · 本地保存</span></div>
    <div class="t-row"><select class="t-select" id="sb-theme"><option value="软木板">软木板</option><option value="暗棕扑克">暗棕扑克</option><option value="工坊洞洞板">工坊洞洞板</option></select><button type="button" class="t-btn primary" id="sb-add">＋ 便签</button><button type="button" class="t-btn" id="sb-full">全屏专注</button><button type="button" class="t-btn" id="sb-clear">清空</button></div>
    <div id="sb-board" style="position:relative;height:460px;border-radius:8px;overflow:hidden;margin-top:14px;background:#c8a878"></div>
    <p class="t-hint">按住便签拖动，双击编辑文字；拖动右下角的小三角缩放，右键旋转。内容存在本机浏览器里。</p>
  </section></div>`;
  const board = root.querySelector('#sb-board'), theme = root.querySelector('#sb-theme');
  const BG = { '软木板': '#c8a878', '暗棕扑克': '#3c5140', '工坊洞洞板': '#a8a49c repeating-radial-gradient(#8d8981 2px,transparent 3px) 0 0/24px 24px' };
  let notes = []; try { notes = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { notes = [] }
  const save = () => localStorage.setItem(KEY, JSON.stringify(notes));
  const COLORS = ['#f6e6b8', '#d9e9d2', '#f2d4cf', '#d7e3f2', '#eadcf2'];
  const draw = () => {
    board.style.background = theme.value === '工坊洞洞板' ? 'radial-gradient(#8d8981 2px,#a8a49c 3px) 0 0/24px 24px' : BG[theme.value];
    board.innerHTML = notes.map((n) => `<div data-sb="${n.id}" style="position:absolute;left:${n.x}px;top:${n.y}px;transform:rotate(${n.rot}deg) scale(${n.s});transform-origin:top left;width:150px;min-height:120px;background:${n.color};padding:12px;border-radius:3px;box-shadow:0 4px 12px #0003;cursor:grab;font-size:14px;line-height:1.5"><div data-sbtext="${n.id}" style="min-height:88px;white-space:pre-wrap">${L.esc(n.text)}</div><div style="position:absolute;right:2px;bottom:1px;cursor:nwse-resize;opacity:.5" data-sbres="${n.id}">◢</div></div>`).join('');
  };
  let drag = null;
  board.addEventListener('pointerdown', (e) => {
    const res = e.target.closest('[data-sbres]'), card = e.target.closest('[data-sb]'); if (!card) return;
    const n = notes.find((x) => String(x.id) === card.dataset.sb); if (!n) return;
    drag = { n, x0: e.clientX, y0: e.clientY, nx: n.x, ny: n.y, ns: n.s, mode: res ? 'size' : 'move' };
    card.setPointerCapture(e.pointerId);
  });
  board.addEventListener('pointermove', (e) => { if (!drag) return; const dx = (e.clientX - drag.x0), dy = (e.clientY - drag.y0); if (drag.mode === 'size') drag.n.s = L.clamp(drag.ns + dx / 300, 0.6, 1.8); else { drag.n.x = L.clamp(drag.nx + dx, 0, board.clientWidth - 60); drag.n.y = L.clamp(drag.ny + dy, 0, board.clientHeight - 40); } drag.n.rot = drag.n.rot; draw(); });
  board.addEventListener('pointerup', () => { if (drag) { save(); drag = null; } });
  board.addEventListener('dblclick', (e) => { const c = e.target.closest('[data-sb]'); if (!c) return; const n = notes.find((x) => String(x.id) === c.dataset.sb); if (!n) return; const t = prompt('便签内容：', n.text); if (t !== null) { n.text = t; save(); draw(); } });
  board.addEventListener('contextmenu', (e) => { const c = e.target.closest('[data-sb]'); if (!c) return; e.preventDefault(); const n = notes.find((x) => String(x.id) === c.dataset.sb); n.rot = (n.rot || 0) + 8; save(); draw(); });
  root.querySelector('#sb-add').onclick = () => { notes.push({ id: Date.now() + Math.random(), text: '新便签', color: COLORS[notes.length % COLORS.length], x: 30 + (notes.length * 30) % 400, y: 30 + (notes.length * 25) % 280, rot: (notes.length % 5 - 2) * 3, s: 1 }); save(); draw(); };
  root.querySelector('#sb-clear').onclick = () => { notes = []; save(); draw(); };
  root.querySelector('#sb-full').onclick = () => { if (board.requestFullscreen) board.requestFullscreen(); };
  theme.onchange = draw;
  K.setAction('＋ 便签', () => root.querySelector('#sb-add').click());
  if (!notes.length) { notes.push({ id: 1, text: '双击我改文字\n拖我可以移动', color: COLORS[0], x: 60, y: 50, rot: -3, s: 1 }); notes.push({ id: 2, text: '右键旋转\n右下角 ◢ 缩放', color: COLORS[2], x: 260, y: 120, rot: 4, s: 1 }); save(); }
  draw();
} };

/* ---------- 手持弹幕 ---------- */
S['handheld-banner'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>手持弹幕</h2><span class="hint">横屏滚动大字 · 防熄屏</span></div>
    <div class="t-row"><input class="t-input grow" id="hb-text" value="欢迎回家！"><input class="t-input" id="hb-color" type="color" value="#ff3b6b" style="width:60px;height:40px;padding:3px"><input class="t-input" id="hb-bg" type="color" value="#101014" style="width:60px;height:40px;padding:3px"></div>
    <div class="t-row" style="margin:12px 0"><label class="t-label">字号 <input class="t-range" id="hb-size" type="range" min="40" max="200" value="110"></label><label class="t-label">速度 <input class="t-range" id="hb-speed" type="range" min="20" max="300" value="120"></label><label class="t-check"><input type="checkbox" id="hb-mirror">镜像</label><button type="button" class="t-btn" id="hb-full">全屏</button></div>
    <div id="hb-stage" style="height:240px;border-radius:8px;overflow:hidden;position:relative;background:#101014;display:flex;align-items:center"><div id="hb-inner" style="white-space:nowrap;font-weight:900;font-size:110px;color:#ff3b6b;will-change:transform;padding-left:100%"></div></div>
    <div class="t-actions" style="margin-top:12px"><button type="button" class="t-btn primary" id="hb-play">开始滚动</button><button type="button" class="t-btn" id="hb-stop">暂停</button></div>
    <p class="t-hint">全屏后会尝试申请「屏幕常亮」（Wake Lock），部分浏览器不支持。镜像用于自拍时让字反向，别人看才是正的。</p>
  </section></div>`;
  const text = root.querySelector('#hb-text'), inner = root.querySelector('#hb-inner'), stage = root.querySelector('#hb-stage'), size = root.querySelector('#hb-size'), speed = root.querySelector('#hb-speed'), color = root.querySelector('#hb-color'), bg = root.querySelector('#hb-bg'), mirror = root.querySelector('#hb-mirror');
  let raf = null, x = 0, last = 0, wake = null;
  const sync = () => { inner.textContent = text.value; inner.style.fontSize = size.value + 'px'; inner.style.color = color.value; stage.style.background = bg.value; inner.style.transform = `scaleX(${mirror.checked ? -1 : 1}) translateX(${-x}px)`; };
  const frame = (t) => { if (!last) last = t; x += Number(speed.value) * (t - last) / 1000; last = t; if (x > inner.scrollWidth + stage.clientWidth) x = 0; inner.style.transform = `scaleX(${mirror.checked ? -1 : 1}) translateX(${-x}px)`; raf = requestAnimationFrame(frame); };
  const play = async () => { if (raf) return; last = 0; raf = requestAnimationFrame(frame); try { if ('wakeLock' in navigator) wake = await navigator.wakeLock.request('screen'); } catch (e) {} };
  const stop = () => { cancelAnimationFrame(raf); raf = null; if (wake) { wake.release(); wake = null; } };
  [text, size, color, bg, mirror].forEach((e) => e.addEventListener('input', sync));
  root.querySelector('#hb-play').onclick = play;
  root.querySelector('#hb-stop').onclick = stop;
  root.querySelector('#hb-full').onclick = async () => { try { await stage.requestFullscreen(); } catch (e) { K.toast('全屏没被允许'); } };
  K.setAction('开始 / 暂停', () => { if (raf) stop(); else play(); });
  sync();
} };

/* ---------- 在线尺子 ---------- */
S['ruler'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>在线尺子</h2><span class="hint">CSS 像素按 96 DPI 估算，建议先校准</span></div>
    <div class="t-row"><button type="button" class="t-btn" id="ru-dir">横 / 竖切换</button><label class="t-label">刻度 <select class="t-select" id="ru-unit"><option value="cm">厘米 cm</option><option value="in">英寸 inch</option></select></label><label class="t-label">校准：银行卡宽 85.6mm = <input class="t-input" id="ru-cal" type="number" value="323" style="width:90px"> px</label></div>
    <div id="ru-stage" style="margin-top:14px;overflow:auto;background:#f7f3ea;border:1px solid #ddd;border-radius:6px"></div>
    <p class="t-hint">屏幕的 CSS 像素和物理毫米不是一回事。拿一张银行卡（宽 85.6mm）贴在屏幕上，量出它占多少像素填进「校准」，刻度才准。手机浏览器缩放会影响结果。</p>
  </section></div>`;
  const stage = root.querySelector('#ru-stage'), unit = root.querySelector('#ru-unit'), cal = root.querySelector('#ru-cal');
  let vertical = false;
  const draw = () => {
    const ppmm = Number(cal.value) / 85.6, pxc = unit.value === 'cm' ? ppmm * 10 : ppmm * 25.4;
    const len = vertical ? 1400 : 1600, thick = vertical ? 90 : 74;
    stage.style.height = vertical ? '420px' : (thick + 16) + 'px';
    const cv = L.canvasOf(vertical ? thick : len, vertical ? len : thick), g = cv.getContext('2d');
    g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = '#8a8073'; g.fillStyle = '#3a352e'; g.font = '11px monospace'; g.lineWidth = 1;
    const minor = pxc / 10;
    for (let i = 0; i * minor < (vertical ? cv.height : cv.width); i++) {
      const p = Math.round(i * minor) + 0.5, big = i % 10 === 0, mid = i % 5 === 0;
      const h = big ? (vertical ? 34 : 34) : mid ? 22 : 12;
      g.beginPath();
      if (vertical) { g.moveTo(0, p); g.lineTo(h, p); } else { g.moveTo(p, 0); g.lineTo(p, h); }
      g.stroke();
      if (big && i > 0) { const label = String(i / 10); g.save(); if (vertical) { g.translate(40, p + 4); } else { g.translate(p + 3, 48); } g.fillText(label, 0, 0); g.restore(); }
    }
    stage.innerHTML = ''; cv.style.display = 'block'; cv.style.maxWidth = vertical ? '90px' : 'none'; stage.appendChild(cv);
  };
  unit.onchange = draw; cal.oninput = draw;
  root.querySelector('#ru-dir').onclick = () => { vertical = !vertical; draw(); };
  K.setAction('横 / 竖切换', () => root.querySelector('#ru-dir').click());
  draw();
} };

/* ---------- 数字量角器 ---------- */
S['protractor'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>数字量角器</h2><span class="hint">陀螺仪测倾角 · 也能手动拖</span></div>
    <div class="t-row"><button type="button" class="t-btn primary" id="pr-gyro">开启陀螺仪</button><button type="button" class="t-btn" id="pr-zero">归零</button><button type="button" class="t-btn" id="pr-lock">锁定读数</button><button type="button" class="t-btn" id="pr-ab">记为 A → B 差角</button></div>
    <div class="t-out" id="pr-val" style="font-size:40px;font-weight:700;text-align:center;margin:14px 0">0.0°</div>
    <div class="t-hint" id="pr-msg" style="text-align:center">没开陀螺仪时，可以直接拖下面的圆盘量角（A→B 差角）。</div>
    <canvas id="pr-cv" width="320" height="180" style="display:block;margin:10px auto;touch-action:none;background:#f7f3ea;border-radius:8px"></canvas>
    <p class="t-hint">陀螺仪需要设备支持并在 HTTPS 下授权；手机贴着屋顶斜面 / 墙面读数更稳。屋顶坡度 = tan(倾角) × 100%。仅供参考，精密测量请用实物量角器。</p>
  </section></div>`;
  const cv = root.querySelector('#pr-cv'), g = cv.getContext('2d'), val = root.querySelector('#pr-val'), msg = root.querySelector('#pr-msg');
  let deg = 0, zero = 0, locked = false, A = null, gyro = false;
  const draw = () => {
    g.clearRect(0, 0, 320, 180); const cx = 160, cy = 160, R = 130;
    g.strokeStyle = '#b9b0a2'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, Math.PI, 0); g.stroke();
    for (let a = 0; a <= 180; a += 10) { const r = a * Math.PI / 180, x1 = cx - Math.cos(r) * R, y1 = cy - Math.sin(r) * R, x2 = cx - Math.cos(r) * (R - (a % 30 === 0 ? 16 : 8)), y2 = cy - Math.sin(r) * (R - (a % 30 === 0 ? 16 : 8)); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    const r = deg * Math.PI / 180; g.strokeStyle = '#b4552d'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - Math.cos(r) * R, cy - Math.sin(r) * R); g.stroke();
    g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fillStyle = '#b4552d'; g.fill();
  };
  const set = (d) => { if (locked) return; deg = L.clamp(d, 0, 180); val.textContent = L.round(deg - zero, 1) + '°'; draw(); };
  const pos = (e) => { const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * 320 / b.width - 160, y = (e.clientY - b.top) * 180 / b.height - 160; return (Math.atan2(-y, -x) * 180 / Math.PI + 180) % 180; };
  let dragging = false;
  cv.addEventListener('pointerdown', (e) => { dragging = true; set(pos(e)); });
  cv.addEventListener('pointermove', (e) => { if (dragging) set(pos(e)); });
  cv.addEventListener('pointerup', () => { dragging = false; });
  root.querySelector('#pr-zero').onclick = () => { zero = deg; val.textContent = '0.0°'; msg.textContent = '已把当前角度设为零位'; };
  root.querySelector('#pr-lock').onclick = () => { locked = !locked; msg.textContent = locked ? '读数已锁定，再点一次解锁' : '已解锁'; };
  root.querySelector('#pr-ab').onclick = () => { if (A === null) { A = deg; msg.textContent = `已记 A = ${L.round(A, 1)}°，再摆一次点这里出差角`; } else { msg.textContent = `A → B 差角 = ${L.round(Math.abs(deg - A), 1)}°`; A = null; } };
  root.querySelector('#pr-gyro').onclick = async () => {
    if (gyro) return;
    const DO = window.DeviceOrientationEvent;
    if (!DO) { msg.textContent = '这个设备/浏览器没有陀螺仪接口，用拖圆盘的方式量角吧'; return; }
    try { if (typeof DO.requestPermission === 'function') { const p = await DO.requestPermission(); if (p !== 'granted') { msg.textContent = '陀螺仪权限没给，改用手动拖动'; return; } } } catch (e) { msg.textContent = '陀螺仪授权失败，改用手动拖动'; return; }
    gyro = true; msg.textContent = '陀螺仪已开启，把手机贴住要测的面（beta 为相对水平面的倾角）';
    window.addEventListener('deviceorientation', (e) => { if (e.beta == null) return; const tilt = Math.abs(Number(e.beta) || 0); set(L.clamp(tilt > 90 ? 180 - tilt : tilt, 0, 180)); });
  };
  K.setAction('开启陀螺仪', () => root.querySelector('#pr-gyro').click());
  draw();
} };

/* ---------- 英语词汇量测试 ---------- */
S['vocab-test'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>英语词汇量测试</h2><span class="hint">基于内置 COCA 词频精简表</span></div>
    <div class="t-out" id="vb-word" style="font-size:34px;font-weight:700;text-align:center;margin:18px 0">准备开始</div>
    <div class="t-hint" id="vb-prog" style="text-align:center"></div>
    <div class="t-actions" style="justify-content:center;margin:18px 0"><button type="button" class="t-btn primary" id="vb-know">认识</button><button type="button" class="t-btn" id="vb-no">不认识</button><button type="button" class="t-btn" id="vb-start">重新测试</button></div>
    <div class="t-refwrap" id="vb-result"></div>
    <p class="t-hint">按 COCA 词频分层抽 40 词，混入少量生造词做「乱猜校正」，估算词汇量区间。这是粗略自测，不是标准化考试，也非完整 COCA 语料。</p>
  </section></div>`;
  const wordEl = root.querySelector('#vb-word'), prog = root.querySelector('#vb-prog'), result = root.querySelector('#vb-result');
  const pool = Array.isArray(D.coca) ? D.coca : [];
  let qs = [], i = 0, yes = 0, fakeHit = 0;
  const start = () => {
    if (pool.length < 40) { wordEl.textContent = '词表不足'; prog.textContent = '内置离线词表太小，无法完成分层抽样'; return; }
    const picks = [];
    for (let band = 0; band < 8; band++) { const seg = pool.slice(Math.floor(band * pool.length / 8), Math.floor((band + 1) * pool.length / 8)); for (let j = 0; j < 4; j++) picks.push({ w: L.pick(seg), real: true, rank: Math.floor(band * pool.length / 8) + 1 }); }
    const fake = ['flinder', 'quarmon', 'delipher', 'brondle', 'tavist', 'glumper', 'sorrint', 'vallish'];
    fake.forEach((w) => picks.push({ w, real: false, rank: 0 }));
    qs = L.shuffle(picks); i = 0; yes = 0; fakeHit = 0; result.innerHTML = ''; show();
  };
  const show = () => { if (i >= qs.length) return finish(); wordEl.textContent = qs[i].w; prog.textContent = `第 ${i + 1} / ${qs.length} 题　·　认识 ${yes} 个`; };
  const ans = (know) => { if (!qs.length) return; const q = qs[i]; if (know && q.real) yes++; if (know && !q.real) fakeHit++; i++; show(); };
  const finish = () => {
    const totalReal = qs.filter((x) => x.real).length;
    const raw = yes / Math.max(1, totalReal), adj = Math.max(0, raw - fakeHit / 8 * 0.5);
    const est = Math.round(adj * Math.min(pool.length, 20000) / 100) * 100, lo = Math.max(0, Math.round(est * 0.8 / 100) * 100), hi = Math.round(est * 1.2 / 100) * 100;
    wordEl.textContent = '测试完成';
    prog.textContent = `认识 ${yes} / ${totalReal} 个真词，误认 ${fakeHit} / 8 个生造词`;
    const anchor = est < 3000 ? '中学/高考量级' : est < 6000 ? '四六级量级' : est < 10000 ? '雅思托福量级' : '进阶/学术量级';
    result.innerHTML = `<div class="t-stat-row"><div class="t-stat"><b>${L.fmt(est, 0)}</b><span>估算词汇量</span></div><div class="t-stat"><b>${L.fmt(lo, 0)}–${L.fmt(hi, 0)}</b><span>参考区间</span></div><div class="t-stat"><b>${anchor}</b><span>大致锚点</span></div></div><p class="t-hint">校正：把误认生造词的比例折半扣掉。样本只有 40 词、词表是离线精简版，波动很大，别拿这个数字较真。</p>`;
  };
  root.querySelector('#vb-know').onclick = () => ans(true);
  root.querySelector('#vb-no').onclick = () => ans(false);
  root.querySelector('#vb-start').onclick = start;
  K.setAction('认识 / 下一词', () => ans(true));
  start();
} };

/* ---------- 打字测速 ---------- */
S['typing-speed'] = { kind: 'custom', render: (root, K) => {
  const TEXTS = [
    '春天来得慢，窗外的树先是抽出一点嫩芽，然后忽然就绿成了一片。',
    '所谓效率，不是把每一分钟都填满，而是知道哪些事根本不必做。',
    '他沿着河走，水声盖过了脚步，也盖过了心里那些反复念叨的话。',
    '工具的意义在于，让复杂的事情变简单，而不是让简单的事情变复杂。',
  ];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>打字测速</h2><span class="hint">中文语料 · 计时/计篇双模式</span></div>
    <div class="t-row"><select class="t-select" id="ty-mode"><option value="time">计时模式（60 秒）</option><option value="text">计篇模式（打完一段）</option></select><button type="button" class="t-btn primary" id="ty-start">开始</button><span class="t-hint" id="ty-stat"></span></div>
    <div id="ty-target" style="font-size:19px;line-height:2;letter-spacing:1px;background:#f7f3ea;padding:14px;border-radius:8px;margin:14px 0;min-height:80px"></div>
    <textarea class="t-textarea" id="ty-input" rows="3" placeholder="点开始后在这里跟着打" disabled></textarea>
    <div class="t-stat-row" id="ty-result" style="margin-top:14px"></div>
    <p class="t-hint">按「正确字数 ÷ 分钟」算速度，错字不计入。计时模式到点自动停，计篇模式打完整段自动停。</p>
  </section></div>`;
  const target = root.querySelector('#ty-target'), input = root.querySelector('#ty-input'), stat = root.querySelector('#ty-stat'), result = root.querySelector('#ty-result'), mode = root.querySelector('#ty-mode');
  let text = TEXTS[0], t0 = 0, timer = null, running = false;
  const render = (typed) => { const arr = Array.from(text); target.innerHTML = Array.from(typed + '\u200b').map((c, i) => { if (c === '\u200b') return ''; const ok = c === arr[i]; return `<span style="color:${ok ? '#4b7a4b' : '#a35d5d'};${i === Array.from(typed).length - 1 ? 'text-decoration:underline' : ''}">${L.esc(c === ' ' ? '·' : c)}</span>`; }).join('') + arr.slice(Array.from(typed).length).map((c) => `<span style="opacity:.45">${L.esc(c)}</span>`).join(''); };
  const stop = () => { clearInterval(timer); timer = null; running = false; input.disabled = true; const sec = Math.max(1, (Date.now() - t0) / 1000), typed = input.value; const arr = Array.from(text), t = Array.from(typed); let ok = 0; t.forEach((c, i) => { if (c === arr[i]) ok++; }); const cpm = ok / sec * 60, acc = t.length ? ok / t.length * 100 : 0; result.innerHTML = `<div class="t-stat"><b>${L.round(cpm, 0)}</b><span>字/分钟</span></div><div class="t-stat"><b>${L.round(acc, 1)}%</b><span>正确率</span></div><div class="t-stat"><b>${L.round(sec, 1)}s</b><span>用时</span></div><div class="t-stat"><b>${ok}</b><span>正确字数</span></div>`; stat.textContent = '已结束，点开始再来一次'; };
  const start = () => { text = L.pick(TEXTS); input.value = ''; input.disabled = false; input.focus(); running = true; t0 = Date.now(); result.innerHTML = ''; render(''); clearInterval(timer); if (mode.value === 'time') timer = setInterval(() => { const left = Math.max(0, 60 - (Date.now() - t0) / 1000); stat.textContent = `剩余 ${L.round(left, 0)} 秒`; if (left <= 0) stop(); }, 200); else stat.textContent = '计篇模式：打完这一整段自动结束'; };
  input.addEventListener('input', () => { if (!running) return; render(input.value); if (mode.value === 'text' && input.value.length >= Array.from(text).length) stop(); });
  root.querySelector('#ty-start').onclick = start;
  K.setAction('开始测速', start);
  render('');
} };
