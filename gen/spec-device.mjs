// 设备测试 / 中文 / CSS 生成器：全部浏览器本机运行。
// 摄像头、麦克风、陀螺仪等需要浏览器授权（HTTPS 下可用）；无信令服务器的纯静态站做不了 WebRTC P2P 串流，已在对应工具里说明。
export const S = {};

/* ---------- 摄像头测试 ---------- */
S['cam-test'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>摄像头测试</h2><span class="hint">只要视频权限，不开麦克风</span></div>
    <div class="t-row"><button type="button" class="t-btn primary" id="ct-start">开启摄像头</button><button type="button" class="t-btn" id="ct-stop">关闭</button><select class="t-select" id="ct-dev"><option value="">默认摄像头</option></select><select class="t-select" id="ct-res"><option value="ideal">默认分辨率</option><option value="640x480">640×480</option><option value="1280x720">720p</option><option value="1920x1080">1080p</option></select><button type="button" class="t-btn" id="ct-full">全屏</button></div>
    <div style="position:relative;background:#161412;border-radius:8px;margin-top:14px;overflow:hidden"><video id="ct-v" autoplay playsinline muted style="width:100%;max-height:420px;display:block"></video><canvas id="ct-c" width="160" height="90" style="display:none"></canvas></div>
    <div class="t-stat-row" id="ct-stat" style="margin-top:12px"></div>
    <p class="t-hint" id="ct-msg">点「开启摄像头」后浏览器会要一次权限。画面不上传、不录制，关掉页面即释放。</p>
  </section></div>`;
  const v = root.querySelector('#ct-v'), c = root.querySelector('#ct-c'), stat = root.querySelector('#ct-stat'), msg = root.querySelector('#ct-msg'), dev = root.querySelector('#ct-dev'), res = root.querySelector('#ct-res');
  let stream = null, raf = null, frames = 0, t0 = 0;
  const stop = () => { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } cancelAnimationFrame(raf); raf = null; stat.innerHTML = ''; };
  const loop = () => { frames++; const now = performance.now(); if (!t0) t0 = now; const el = (now - t0) / 1000; if (el >= 1) { const fps = frames / el; let dark = null; try { const g = c.getContext('2d'); c.width = 80; c.height = 45; g.drawImage(v, 0, 0, 80, 45); const d = g.getImageData(0, 0, 80, 45).data; let sum = 0; for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3; dark = sum / (d.length / 4); } catch (e) {}
    stat.innerHTML = `<div class="t-stat"><b>${v.videoWidth}×${v.videoHeight}</b><span>实测分辨率</span></div><div class="t-stat"><b>${L.round(fps, 1)}</b><span>帧率 fps</span></div><div class="t-stat"><b>${dark === null ? '—' : L.round(dark, 0)}</b><span>平均亮度</span></div>`;
    if (dark !== null && dark < 8) msg.textContent = '画面几乎全黑：可能被遮挡、镜头盖没开，或驱动给的是黑帧。';
    frames = 0; t0 = now; } raf = requestAnimationFrame(loop); };
  const start = async () => {
    stop();
    if (!navigator.mediaDevices?.getUserMedia) { msg.textContent = '这个浏览器/环境不支持摄像头接口（需 HTTPS 或 localhost）'; return; }
    try {
      const cons = { video: { deviceId: dev.value ? { exact: dev.value } : undefined }, audio: false };
      if (res.value !== 'ideal') { const [w, h] = res.value.split('x').map(Number); cons.video.width = { ideal: w }; cons.video.height = { ideal: h }; }
      stream = await navigator.mediaDevices.getUserMedia(cons);
      v.srcObject = stream; await v.play();
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter((x) => x.kind === 'videoinput');
      dev.innerHTML = '<option value="">默认摄像头</option>' + cams.map((x, i) => `<option value="${L.esc(x.deviceId)}">${L.esc(x.label || '摄像头 ' + (i + 1))}</option>`).join('');
      msg.textContent = '画面已在本机显示。切设备/分辨率后点「开启摄像头」重新应用。';
      t0 = 0; frames = 0; raf = requestAnimationFrame(loop);
    } catch (e) { msg.textContent = '打不开摄像头：' + (e.name || '') + ' ' + (e.message || '') + '。检查权限、是否被别的程序占用。'; }
  };
  root.querySelector('#ct-start').onclick = start;
  root.querySelector('#ct-stop').onclick = () => { stop(); msg.textContent = '已关闭，摄像头已释放。'; };
  root.querySelector('#ct-full').onclick = () => { const box = v.parentElement; if (box.requestFullscreen) box.requestFullscreen(); };
  K.setAction('开启摄像头', start);
} };

/* ---------- 麦克风测试 ---------- */
S['mic-test'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>麦克风测试</h2><span class="hint">实时电平 + 录音回放，不上传</span></div>
    <div class="t-row"><button type="button" class="t-btn primary" id="mc-start">开启麦克风</button><button type="button" class="t-btn" id="mc-stop">关闭</button><select class="t-select" id="mc-dev"><option value="">默认麦克风</option></select><label class="t-check"><input type="checkbox" id="mc-nr" checked>降噪</label><label class="t-check"><input type="checkbox" id="mc-ec" checked>回声消除</label></div>
    <div class="t-row" style="margin:12px 0"><button type="button" class="t-btn" id="mc-rec">● 录音 3 秒</button><audio id="mc-play" controls style="display:none;flex:1"></audio></div>
    <canvas id="mc-cv" width="600" height="140" style="width:100%;background:#161412;border-radius:8px;margin-top:6px"></canvas>
    <div class="t-stat-row" id="mc-stat" style="margin-top:12px"></div>
    <p class="t-hint" id="mc-msg">点「开启麦克风」后浏览器会要一次权限。波形与录音都只在本机内存里，关掉即消失。</p>
  </section></div>`;
  const cv = root.querySelector('#mc-cv'), g = cv.getContext('2d'), stat = root.querySelector('#mc-stat'), msg = root.querySelector('#mc-msg'), dev = root.querySelector('#mc-dev'), nr = root.querySelector('#mc-nr'), ec = root.querySelector('#mc-ec'), play = root.querySelector('#mc-play');
  let stream = null, ctxA = null, analyser = null, raf = null, peak = 0;
  const AC = window.AudioContext || window.webkitAudioContext;
  const stop = () => { cancelAnimationFrame(raf); raf = null; if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } if (ctxA) { ctxA.close(); ctxA = null; } };
  const loop = () => {
    const n = analyser.fftSize, arr = new Uint8Array(n); analyser.getByteTimeDomainData(arr);
    g.fillStyle = '#161412'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = '#7d9a76'; g.lineWidth = 2; g.beginPath();
    let sum = 0;
    for (let i = 0; i < n; i++) { const x = i / n * cv.width, y = cv.height / 2 + (arr[i] - 128) / 128 * cv.height * 0.45; i ? g.lineTo(x, y) : g.moveTo(x, y); sum += Math.pow((arr[i] - 128) / 128, 2); }
    g.stroke();
    const rms = Math.sqrt(sum / n); peak = Math.max(peak, rms);
    stat.innerHTML = `<div class="t-stat"><b>${L.round(rms * 100, 1)}</b><span>当前电平 %</span></div><div class="t-stat"><b>${L.round(peak * 100, 1)}</b><span>峰值 %</span></div><div class="t-stat"><b>${L.round(20 * Math.log10(Math.max(1e-4, rms)), 1)}</b><span>dBFS</span></div>`;
    raf = requestAnimationFrame(loop);
  };
  const start = async () => {
    stop(); if (!navigator.mediaDevices?.getUserMedia) { msg.textContent = '这个环境不支持麦克风接口（需 HTTPS 或 localhost）'; return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: dev.value ? { exact: dev.value } : undefined, noiseSuppression: nr.checked, echoCancellation: ec.checked }, video: false });
      ctxA = new AC(); analyser = ctxA.createAnalyser(); analyser.fftSize = 2048;
      ctxA.createMediaStreamSource(stream).connect(analyser);
      const list = await navigator.mediaDevices.enumerateDevices(), mics = list.filter((x) => x.kind === 'audioinput');
      dev.innerHTML = '<option value="">默认麦克风</option>' + mics.map((x, i) => `<option value="${L.esc(x.deviceId)}">${L.esc(x.label || '麦克风 ' + (i + 1))}</option>`).join('');
      msg.textContent = '对着麦克风说话，看波形跳不跳。录一段回放可以确认声音是否发闷/断续。';
      peak = 0; raf = requestAnimationFrame(loop);
    } catch (e) { msg.textContent = '打不开麦克风：' + (e.name || '') + ' ' + (e.message || ''); }
  };
  root.querySelector('#mc-start').onclick = start;
  root.querySelector('#mc-stop').onclick = () => { stop(); msg.textContent = '已关闭，麦克风已释放。'; };
  root.querySelector('#mc-rec').onclick = async () => {
    if (!stream) { K.toast('先开启麦克风'); return; }
    try { const chunks = [], rec = new MediaRecorder(stream); rec.ondataavailable = (e) => chunks.push(e.data); rec.onstop = () => { const b = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); play.src = URL.createObjectURL(b); play.style.display = ''; msg.textContent = '录音完成，点播放听一下（只存在本机内存里）。'; }; rec.start(); msg.textContent = '录音中… 3 秒'; setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, 3000); }
    catch (e) { msg.textContent = '这个浏览器不支持 MediaRecorder：' + e.message; }
  };
  K.setAction('开启麦克风', start);
} };

/* ---------- 分贝测试 ---------- */
S['decibel'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>分贝测试</h2><span class="hint">麦克风实时声压级（相对值）</span></div>
    <div class="t-row"><button type="button" class="t-btn primary" id="db-start">开始测量</button><button type="button" class="t-btn" id="db-stop">停止</button><label class="t-label">校准偏移 <input class="t-input" id="db-cal" type="number" value="0" style="width:90px"> dB</label></div>
    <div class="t-row" style="align-items:center;justify-content:center;margin:18px 0"><canvas id="db-ring" width="220" height="220"></canvas><canvas id="db-wave" width="420" height="220" style="max-width:100%;background:#161412;border-radius:8px"></canvas></div>
    <div class="t-stat-row" id="db-stat"></div>
    <div class="t-hint" id="db-level">—</div>
    <p class="t-hint">浏览器拿到的是归一化电平，换算出的 dB 是估算值，不同设备麦克风增益差很多。用「校准偏移」对照一个已知声源修一下才准。不能代替专业声级计。</p>
  </section></div>`;
  const ring = root.querySelector('#db-ring'), rg = ring.getContext('2d'), wave = root.querySelector('#db-wave'), wg = wave.getContext('2d'), stat = root.querySelector('#db-stat'), level = root.querySelector('#db-level'), cal = root.querySelector('#db-cal');
  let stream = null, ctxA = null, an = null, raf = null, hist = [], peak = -100, sum = 0, n = 0;
  const AC = window.AudioContext || window.webkitAudioContext;
  const stop = () => { cancelAnimationFrame(raf); raf = null; if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } if (ctxA) { ctxA.close(); ctxA = null; } };
  const loop = () => {
    const a = new Float32Array(an.fftSize); an.getFloatTimeDomainData(a);
    let s = 0; for (const x of a) s += x * x;
    const rms = Math.sqrt(s / a.length), db = 20 * Math.log10(Math.max(1e-5, rms)) + 94 + Number(cal.value || 0);
    const dbc = L.clamp(db, 0, 120); peak = Math.max(peak, dbc); sum += dbc; n++; hist.push(dbc); if (hist.length > 200) hist.shift();
    rg.clearRect(0, 0, 220, 220); const p = Math.min(1, dbc / 120);
    rg.lineWidth = 16; rg.strokeStyle = '#e7e0d4'; rg.beginPath(); rg.arc(110, 110, 86, 0, Math.PI * 2); rg.stroke();
    rg.strokeStyle = dbc > 85 ? '#a35d5d' : dbc > 65 ? '#c98a4b' : '#7d9a76'; rg.beginPath(); rg.arc(110, 110, 86, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); rg.stroke();
    rg.fillStyle = '#2f2b26'; rg.textAlign = 'center'; rg.font = 'bold 38px sans-serif'; rg.fillText(L.round(dbc, 0) + '', 110, 118); rg.font = '13px sans-serif'; rg.fillText('dB', 110, 142);
    wg.fillStyle = '#161412'; wg.fillRect(0, 0, 420, 220); wg.strokeStyle = '#7d9a76'; wg.lineWidth = 2; wg.beginPath();
    hist.forEach((d, i) => { const x = i / 200 * 420, y = 220 - d / 120 * 220; i ? wg.lineTo(x, y) : wg.moveTo(x, y); }); wg.stroke();
    stat.innerHTML = `<div class="t-stat"><b>${L.round(dbc, 1)}</b><span>当前 dB</span></div><div class="t-stat"><b>${L.round(peak, 1)}</b><span>峰值 dB</span></div><div class="t-stat"><b>${L.round(sum / Math.max(1, n), 1)}</b><span>平均 dB</span></div>`;
    level.textContent = dbc < 30 ? '很安静（图书馆量级）' : dbc < 50 ? '安静室内' : dbc < 65 ? '正常交谈' : dbc < 85 ? '嘈杂街道 / 吸尘器' : '很吵，注意听力保护';
    raf = requestAnimationFrame(loop);
  };
  const start = async () => { stop(); if (!navigator.mediaDevices?.getUserMedia) { level.textContent = '这个环境不支持麦克风接口'; return; } try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); ctxA = new AC(); an = ctxA.createAnalyser(); an.fftSize = 2048; ctxA.createMediaStreamSource(stream).connect(an); hist = []; peak = -100; sum = 0; n = 0; raf = requestAnimationFrame(loop); } catch (e) { level.textContent = '打不开麦克风：' + (e.message || e.name); } };
  root.querySelector('#db-start').onclick = start;
  root.querySelector('#db-stop').onclick = () => { stop(); level.textContent = '已停止'; };
  K.setAction('开始 / 停止测量', () => { if (raf) root.querySelector('#db-stop').click(); else start(); });
} };

/* ---------- 听力测试 ---------- */
S['hearing-test'] = { kind: 'custom', render: (root, K) => {
  const FREQS = [125, 250, 500, 1000, 2000, 4000, 6000, 8000, 10000];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>听力测试（9 频段自检）</h2><span class="hint">本机播放纯音 · 仅供参考</span></div>
    <div class="t-row"><select class="t-select" id="ht-ear"><option value="both">双耳</option><option value="left">仅左耳</option><option value="right">仅右耳</option></select><button type="button" class="t-btn primary" id="ht-start">开始测试</button><span class="t-hint" id="ht-prog">戴好耳机，安静环境下做</span></div>
    <div class="t-out" id="ht-freq" style="font-size:32px;font-weight:700;text-align:center;margin:18px 0">准备</div>
    <div class="t-actions" style="justify-content:center"><button type="button" class="t-btn primary" id="ht-play">▶ 播放纯音</button><button type="button" class="t-btn" id="ht-yes">听到了</button><button type="button" class="t-btn" id="ht-no">没听到</button></div>
    <div class="t-refwrap" id="ht-chart" style="margin-top:14px"></div>
    <p class="t-hint">每个频率从较响逐步降到听不见，取最后一次「听到了」作为该频听阈。用耳机、关掉其它声音。这不是医学听力计，结果不能作为诊断依据，高频听不清请去医院耳鼻喉科。</p>
  </section></div>`;
  const prog = root.querySelector('#ht-prog'), freq = root.querySelector('#ht-freq'), chart = root.querySelector('#ht-chart'), ear = root.querySelector('#ht-ear');
  const AC = window.AudioContext || window.webkitAudioContext; let ctxA = null;
  let fi = 0, level = 0, results = [], playing = false;
  const LEVELS = [-10, -20, -30, -40, -50, -60, -70];
  const tone = (hz, db) => { try { if (!ctxA) ctxA = new AC(); const o = ctxA.createOscillator(), g = ctxA.createGain(), p = ctxA.createStereoPanner ? ctxA.createStereoPanner() : null; o.frequency.value = hz; o.type = 'sine'; g.gain.value = Math.pow(10, db / 20); const pan = ear.value === 'left' ? -1 : ear.value === 'right' ? 1 : 0; if (p) { p.pan.value = pan; o.connect(g); g.connect(p); p.connect(ctxA.destination); } else { o.connect(g); g.connect(ctxA.destination); } o.start(); o.stop(ctxA.currentTime + 0.9); } catch (e) {} };
  const show = () => { if (fi >= FREQS.length) { freq.textContent = '测试完成'; draw(); return; } freq.textContent = FREQS[fi] + ' Hz'; prog.textContent = `第 ${fi + 1} / ${FREQS.length} 个频率　·　当前音量 ${LEVELS[level]} dB（相对）`; };
  const draw = () => { chart.innerHTML = results.length ? `<table class="t-table"><thead><tr><th>频率</th><th>听阈（相对 dB）</th><th>示意</th></tr></thead><tbody>${results.map((r) => `<tr><td>${r.f} Hz</td><td>${r.db}</td><td><div style="background:#b4552d;height:10px;width:${L.clamp((-r.db) / 70 * 100, 3, 100)}%"></div></td></tr>`).join('')}</tbody></table>` : ''; };
  root.querySelector('#ht-play').onclick = () => { if (fi >= FREQS.length) return; tone(FREQS[fi], LEVELS[level]); };
  root.querySelector('#ht-yes').onclick = () => { if (fi >= FREQS.length) return; level++; if (level >= LEVELS.length) { results.push({ f: FREQS[fi], db: LEVELS[LEVELS.length - 1] }); fi++; level = 0; } show(); draw(); };
  root.querySelector('#ht-no').onclick = () => { if (fi >= FREQS.length) return; results.push({ f: FREQS[fi], db: level > 0 ? LEVELS[level - 1] : '连最响也没听到' }); fi++; level = 0; show(); draw(); };
  root.querySelector('#ht-start').onclick = () => { fi = 0; level = 0; results = []; chart.innerHTML = ''; show(); K.toast('点「播放纯音」，听到了就点听到了'); };
  K.setAction('播放纯音', () => root.querySelector('#ht-play').click());
  show();
} };

/* ---------- 耳机左右声道测试 ---------- */
S['stereo-test'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>耳机左右声道测试</h2><span class="hint">本机播放 · 判断左右接反 / 相位反接</span></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="st-l">◀ 只放左声道</button><button type="button" class="t-btn primary" id="st-r">只放右声道 ▶</button><button type="button" class="t-btn" id="st-both">双声道</button><button type="button" class="t-btn" id="st-scan">声像扫描 L→R</button><button type="button" class="t-btn" id="st-phase">相位反接检测</button></div>
    <div class="t-out" id="st-msg" style="font-size:18px;text-align:center;margin:18px 0">先戴好耳机，逐个点上面的按钮</div>
    <div class="t-refwrap" id="st-blind" style="margin-top:10px"></div>
    <p class="t-hint">盲测：点「随机播一边」，再选你听到的是左还是右，连做几次看有没有把左右接反。相位反接检测靠两段反相信号对消的现象判断，普通耳机不一定听得出来。</p>
  </section></div>`;
  const msg = root.querySelector('#st-msg'), blind = root.querySelector('#st-blind');
  const AC = window.AudioContext || window.webkitAudioContext; let ctxA = null;
  const play = (pan, dur = 1.1, invert = false) => { try { if (!ctxA) ctxA = new AC(); const o = ctxA.createOscillator(), g = ctxA.createGain(), p = ctxA.createStereoPanner ? ctxA.createStereoPanner() : null; o.type = 'sine'; o.frequency.value = 440; g.gain.value = 0.18; if (p) { p.pan.value = pan; o.connect(g); g.connect(p); p.connect(ctxA.destination); } else { o.connect(g); g.connect(ctxA.destination); } o.start(); o.stop(ctxA.currentTime + dur); } catch (e) {} };
  const noise = (pan, dur = 1.2, inv = false) => { try { if (!ctxA) ctxA = new AC(); const n = Math.floor(ctxA.sampleRate * dur), buf = ctxA.createBuffer(2, n, ctxA.sampleRate); for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (inv && c === 1 ? -1 : 1) * 0.25; } const src = ctxA.createBufferSource(); src.buffer = buf; const p = ctxA.createStereoPanner ? ctxA.createStereoPanner() : null; if (p) { p.pan.value = pan; src.connect(p); p.connect(ctxA.destination); } else src.connect(ctxA.destination); src.start(); } catch (e) {} };
  let current = null, score = 0, total = 0;
  root.querySelector('#st-l').onclick = () => { play(-1); msg.textContent = '现在只有左声道该响。如果右耳响，左右接反了。'; };
  root.querySelector('#st-r').onclick = () => { play(1); msg.textContent = '现在只有右声道该响。'; };
  root.querySelector('#st-both').onclick = () => { play(0); msg.textContent = '两边都该响，且声音在正中间。'; };
  root.querySelector('#st-scan').onclick = () => { let k = 0; const t = setInterval(() => { play(-1 + k * 0.25, 0.22); k++; if (k > 8) clearInterval(t); }, 230); msg.textContent = '声像从左到右扫一遍，听有没有断点或偏一边。'; };
  root.querySelector('#st-phase').onclick = () => { noise(0, 1.5, true); msg.textContent = '反相信号：若感觉声音「散开、定位发虚、低音变少」，可能是相位反接。'; };
  const newBlind = () => { current = Math.random() < 0.5 ? -1 : 1; blind.innerHTML = `<div class="t-row" style="justify-content:center"><button type="button" class="t-btn primary" id="st-play">随机播一边</button><button type="button" class="t-btn" data-stans="-1">我听到左</button><button type="button" class="t-btn" data-stans="1">我听到右</button></div><div class="t-hint" id="st-score" style="text-align:center;margin-top:8px">盲测 ${total} 次，猜对 ${score} 次</div>`; blind.querySelector('#st-play').onclick = () => play(current); blind.querySelectorAll('[data-stans]').forEach((b) => { b.onclick = () => { total++; if (Number(b.dataset.stans) === current) score++; newBlind(); }; }); };
  K.setAction('只放左声道', () => root.querySelector('#st-l').click());
  newBlind();
} };

/* ---------- 屏幕刷新率测试 ---------- */
S['refresh-rate'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>屏幕刷新率测试</h2><span class="hint">打开即测 · 5 秒出结果</span></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="rr-start">开始 5 秒测试</button><button type="button" class="t-btn" id="rr-full">全屏测峰值</button></div>
    <div class="t-stat-row" id="rr-stat" style="margin-top:14px"></div>
    <canvas id="rr-cv" width="600" height="120" style="width:100%;background:#161412;border-radius:8px;margin-top:12px"></canvas>
    <div id="rr-tracks" style="margin-top:14px"><div class="t-hint">三跑道拖影对比（30 / 60 / 原生帧）</div><div style="height:44px;position:relative;background:#f7f3ea;border-radius:6px;overflow:hidden;margin:6px 0"><div class="rr-ball" data-sp="1.6" style="position:absolute;top:8px;width:28px;height:28px;border-radius:50%;background:#b4552d"></div></div><div style="height:44px;position:relative;background:#f7f3ea;border-radius:6px;overflow:hidden;margin:6px 0"><div class="rr-ball" data-sp="3.2" style="position:absolute;top:8px;width:28px;height:28px;border-radius:50%;background:#6b8fa8"></div></div><div style="height:44px;position:relative;background:#f7f3ea;border-radius:6px;overflow:hidden;margin:6px 0"><div class="rr-ball" data-sp="6.4" style="position:absolute;top:8px;width:28px;height:28px;border-radius:50%;background:#7d9a76"></div></div></div>
    <p class="t-hint">用 requestAnimationFrame 的帧间隔统计实际刷新率。浏览器省电模式、多显示器不同 Hz、标签页在后台都会拉低读数，测的时候别切走。</p>
  </section></div>`;
  const cv = root.querySelector('#rr-cv'), g = cv.getContext('2d'), stat = root.querySelector('#rr-stat');
  let raf = null, times = [], running = false;
  const balls = Array.from(root.querySelectorAll('.rr-ball')); let bx = 0;
  const track = () => { bx += 2; if (bx > 620) bx = -30; balls.forEach((b) => { b.style.left = (bx * Number(b.dataset.sp) / 3) % 640 + 'px'; }); if (!running) requestAnimationFrame(track); };
  const frame = (t) => {
    times.push(t);
    if (times.length > 1) {
      const d = times.slice(1).map((x, i) => x - times[i]).filter((x) => x > 0 && x < 500);
      const avg = d.reduce((a, b) => a + b, 0) / Math.max(1, d.length), hz = 1000 / avg;
      const sorted = d.slice().sort((a, b) => a - b), low1 = sorted[Math.floor(sorted.length * 0.01)] || avg;
      const jitter = Math.sqrt(d.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(1, d.length));
      stat.innerHTML = `<div class="t-stat"><b>${L.round(hz, 1)}</b><span>实测 Hz</span></div><div class="t-stat"><b>${L.round(avg, 2)}</b><span>平均帧时 ms</span></div><div class="t-stat"><b>${L.round(jitter, 2)}</b><span>抖动 ms</span></div><div class="t-stat"><b>${L.round(1000 / low1, 1)}</b><span>1% low 等效 Hz</span></div><div class="t-stat"><b>${d.filter((x) => x > avg * 1.5).length}</b><span>掉帧</span></div>`;
      g.fillStyle = '#161412'; g.fillRect(0, 0, 600, 120); g.strokeStyle = '#7d9a76'; g.beginPath();
      d.slice(-200).forEach((x, i, a) => { const px = i / 199 * 600, py = 120 - L.clamp(x / 40 * 120, 0, 120); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
    }
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => { cancelAnimationFrame(raf); times = []; running = true; raf = requestAnimationFrame(frame); setTimeout(() => { running = false; cancelAnimationFrame(raf); requestAnimationFrame(track); stat.innerHTML += '<div class="t-stat"><b>完成</b><span>5 秒采样</span></div>'; }, 5000); };
  root.querySelector('#rr-start').onclick = start;
  root.querySelector('#rr-full').onclick = () => { const el = root.querySelector('#rr-tracks'); if (el.requestFullscreen) el.requestFullscreen(); start(); };
  K.setAction('开始 5 秒测试', start);
  requestAnimationFrame(track);
} };

/* ---------- 手柄测试 ---------- */
S['gamepad-test'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>手柄测试</h2><span class="hint">插上手柄按任意键连接</span></div>
    <div class="t-hint" id="gp-msg">还没检测到手柄。用 USB / 蓝牙连上后按任意一个键。</div>
    <div id="gp-btns" style="display:flex;flex-wrap:wrap;gap:6px;margin:14px 0"></div>
    <div class="t-row"><canvas id="gp-l" width="160" height="160" style="background:#f7f3ea;border-radius:8px"></canvas><canvas id="gp-r" width="160" height="160" style="background:#f7f3ea;border-radius:8px"></canvas><div id="gp-trig" style="flex:1"></div></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="gp-drift">摇杆漂移检测（3 秒）</button></div>
    <div class="t-hint" id="gp-driftout"></div>
  </section></div>`;
  const btns = root.querySelector('#gp-btns'), msg = root.querySelector('#gp-msg'), l = root.querySelector('#gp-l'), r = root.querySelector('#gp-r'), trig = root.querySelector('#gp-trig'), driftout = root.querySelector('#gp-driftout');
  const NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'L3', 'R3', '↑', '↓', '←', '→', 'Home'];
  let raf = null, samples = [[], []], drift = false;
  const stick = (cv, x, y) => { const g = cv.getContext('2d'); g.clearRect(0, 0, 160, 160); g.strokeStyle = '#c9c0b2'; g.beginPath(); g.arc(80, 80, 66, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(80, 14); g.lineTo(80, 146); g.moveTo(14, 80); g.lineTo(146, 80); g.stroke(); g.fillStyle = '#b4552d'; g.beginPath(); g.arc(80 + L.clamp(x, -1, 1) * 60, 80 + L.clamp(y, -1, 1) * 60, 9, 0, Math.PI * 2); g.fill(); };
  const loop = () => {
    const pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean);
    if (!pads.length) { msg.textContent = '还没检测到手柄。用 USB / 蓝牙连上后按任意一个键。'; btns.innerHTML = ''; }
    else {
      const p = pads[0]; msg.textContent = `已连接：${L.esc(p.id)}　${p.buttons.length} 个按键 / ${p.axes.length} 个轴`;
      btns.innerHTML = p.buttons.map((b, i) => `<span class="t-chip ${b.pressed ? 'on' : ''}" style="${b.pressed ? 'background:#b4552d;color:#fff' : ''}">${L.esc(NAMES[i] || 'B' + i)}${b.value > 0 && b.value < 1 ? ' ' + L.round(b.value, 2) : ''}</span>`).join('');
      const ax = p.axes; stick(l, ax[0] || 0, ax[1] || 0); stick(r, ax[2] || 0, ax[3] || 0);
      trig.innerHTML = p.buttons.slice(6, 8).map((b, i) => `<div class="t-label">${i ? 'RT' : 'LT'} ${L.round(b.value * 100, 0)}%</div><div style="background:#e7e0d4;height:14px;border-radius:7px"><div style="background:#b4552d;height:100%;width:${L.round(b.value * 100, 0)}%;border-radius:7px"></div></div>`).join('');
      if (drift) { samples[0].push(Math.hypot(ax[0] || 0, ax[1] || 0)); samples[1].push(Math.hypot(ax[2] || 0, ax[3] || 0)); }
    }
    raf = requestAnimationFrame(loop);
  };
  root.querySelector('#gp-drift').onclick = () => { samples = [[], []]; drift = true; driftout.textContent = '采样中… 手别碰摇杆'; setTimeout(() => { drift = false; const m = samples.map((s) => s.length ? Math.max(...s) : 0); driftout.textContent = `左摇杆最大偏移 ${L.round(m[0], 3)}，右摇杆 ${L.round(m[1], 3)}。${Math.max(...m) > 0.08 ? `建议死区设到 ${L.round(Math.max(...m) * 1.5, 2)} 以上` : '没发现明显漂移'}（静止时偏移应接近 0）`; }, 3000); };
  K.setAction('摇杆漂移检测', () => root.querySelector('#gp-drift').click());
  raf = requestAnimationFrame(loop);
} };

/* ---------- 键盘测试 ---------- */
S['keyboard-test'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>键盘测试</h2><span class="hint">按哪亮哪 · 找失灵键 / 测无冲</span></div>
    <div class="t-row"><select class="t-select" id="kb-layout"><option value="87">87 键</option><option value="104">104 键</option><option value="mac">Mac 布局</option></select><button type="button" class="t-btn" id="kb-reset">重置</button><span class="t-hint" id="kb-stat"></span></div>
    <div id="kb-board" style="display:flex;flex-direction:column;gap:4px;margin:14px 0;font-size:11px"></div>
    <div class="t-hint" id="kb-msg">按住多个键看能同时识别几个（无冲）；快速连点同一个键可以观察有没有连击/抖动。</div>
  </section></div>`;
  const board = root.querySelector('#kb-board'), stat = root.querySelector('#kb-stat'), msg = root.querySelector('#kb-msg'), layout = root.querySelector('#kb-layout');
  const ROWS = ['`1234567890-=', 'qwertyuiop[]\\', "asdfghjkl;'", 'zxcvbnm,./'];
  const KEYS = ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
  let down = new Set(), maxChord = 0, tested = new Set(), lastTime = {}, dbl = 0;
  const draw = () => {
    board.innerHTML = [KEYS, ...ROWS].map((row, ri) => `<div style="display:flex;gap:4px;justify-content:center">${[...row].map((k) => `<span class="t-chip ${down.has(k.toLowerCase()) ? 'on' : ''}" data-kb="${L.esc(k.toLowerCase())}" style="min-width:30px;text-align:center;padding:5px 2px;${tested.has(k.toLowerCase()) ? 'border:1px solid #7d9a76' : ''}">${L.esc(k)}</span>`).join('')}</div>`).join('') + `<div style="display:flex;gap:4px;justify-content:center"><span class="t-chip" data-kb=" " style="min-width:200px;text-align:center;padding:5px">Space</span><span class="t-chip" data-kb="shift" style="padding:5px">Shift</span><span class="t-chip" data-kb="control" style="padding:5px">Ctrl</span><span class="t-chip" data-kb="alt" style="padding:5px">Alt</span><span class="t-chip" data-kb="enter" style="padding:5px">Enter</span></div>`;
    stat.textContent = `同时按下 ${down.size} 键 · 最大 ${maxChord} 键无冲 · 已测 ${tested.size} 键 · 疑似连击 ${dbl} 次`;
  };
  const keyOf = (e) => { let k = e.key.toLowerCase(); if (k === ' ') k = ' '; return k; };
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input,textarea,select')) return;
    const k = keyOf(e); down.add(k); tested.add(k); maxChord = Math.max(maxChord, down.size);
    const now = Date.now(); if (lastTime[k] && now - lastTime[k] < 45) dbl++; lastTime[k] = now;
    msg.textContent = `当前：${L.esc(e.key)}　code=${L.esc(e.code)}　keyCode=${e.keyCode}　${e.repeat ? '（repeat 自动重复）' : ''}`;
    draw(); e.preventDefault();
  });
  document.addEventListener('keyup', (e) => { down.delete(keyOf(e)); draw(); });
  root.querySelector('#kb-reset').onclick = () => { down = new Set(); maxChord = 0; tested = new Set(); dbl = 0; draw(); };
  K.setAction('重置', () => root.querySelector('#kb-reset').click());
  draw();
} };

/* ---------- 坏点检测 ---------- */
S['dead-pixel'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>坏点检测</h2><span class="hint">纯色 / 线条 / 网格 · 全屏逐张看</span></div>
    <div class="t-row"><select class="t-select" id="dp-mode"><option value="solid">纯色</option><option value="lines">线条</option><option value="grid">网格</option></select><select class="t-select" id="dp-color"><option value="#000000">黑</option><option value="#ffffff">白</option><option value="#ff0000">红</option><option value="#00ff00">绿</option><option value="#0000ff">蓝</option><option value="#808080">灰</option></select><button type="button" class="t-btn" id="dp-next">下一张 →</button><button type="button" class="t-btn primary" id="dp-full">全屏检测</button><button type="button" class="t-btn" id="dp-report">导出报告</button></div>
    <div id="dp-stage" style="height:300px;border-radius:8px;margin-top:14px;position:relative;overflow:hidden;background:#000"></div>
    <div class="t-hint" id="dp-msg">全屏后逐张切换纯色，亮点/暗点会很明显。点击画面可以标记可疑坐标。</div>
  </section></div>`;
  const stage = root.querySelector('#dp-stage'), mode = root.querySelector('#dp-mode'), color = root.querySelector('#dp-color'), msg = root.querySelector('#dp-msg');
  const COLORS = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#808080']; let ci = 0, marks = [];
  const draw = () => {
    const c = COLORS[ci % COLORS.length]; color.value = c;
    let bg = c;
    if (mode.value === 'lines') bg = `repeating-linear-gradient(0deg,${c} 0,${c} 2px,${c === '#000000' ? '#333' : '#bbb'} 2px,${c === '#000000' ? '#333' : '#bbb'} 4px)`;
    if (mode.value === 'grid') bg = `repeating-linear-gradient(0deg,${c} 0,${c} 19px,#888 20px),repeating-linear-gradient(90deg,${c} 0,${c} 19px,#888 20px)`;
    stage.style.background = bg;
    stage.innerHTML = marks.map((m) => `<div style="position:absolute;left:${m.x}px;top:${m.y}px;width:16px;height:16px;border:2px solid #ff0;border-radius:50%;transform:translate(-50%,-50%)"></div>`).join('');
    msg.textContent = `当前：${({ '#000000': '黑', '#ffffff': '白', '#ff0000': '红', '#00ff00': '绿', '#0000ff': '蓝', '#808080': '灰' })[c]} · ${mode.value === 'solid' ? '纯色' : mode.value === 'lines' ? '线条' : '网格'}　已标记 ${marks.length} 处可疑点`;
  };
  stage.onclick = (e) => { const b = stage.getBoundingClientRect(); marks.push({ x: Math.round(e.clientX - b.left), y: Math.round(e.clientY - b.top), color: COLORS[ci % COLORS.length] }); draw(); };
  root.querySelector('#dp-next').onclick = () => { ci++; draw(); };
  color.onchange = () => { ci = Math.max(0, COLORS.indexOf(color.value)); draw(); };
  mode.onchange = draw;
  root.querySelector('#dp-full').onclick = () => { if (stage.requestFullscreen) stage.requestFullscreen(); };
  root.querySelector('#dp-report').onclick = () => { const txt = ['坏点检测报告', '时间：' + new Date().toLocaleString('zh-CN'), '标记数：' + marks.length, ...marks.map((m, i) => `${i + 1}. (${m.x}, ${m.y}) 在 ${m.color} 底色下`)].join('\n'); K.copy(txt); K.toast('报告已复制，可粘贴保存'); };
  K.setAction('下一张', () => root.querySelector('#dp-next').click());
  draw();
} };

/* ---------- 色盲测试 ---------- */
S['color-blind-test'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>色觉自测（近似伪等色图）</h2><span class="hint">11 题 · 仅供参考</span></div>
    <div class="t-out" id="cb-prog" style="text-align:center">点「开始」出题</div>
    <canvas id="cb-cv" width="300" height="300" style="display:block;margin:14px auto;border-radius:50%"></canvas>
    <div id="cb-opts" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"></div>
    <div class="t-actions" style="justify-content:center"><button type="button" class="t-btn primary" id="cb-start">开始 / 下一题</button></div>
    <div class="t-hint" id="cb-result" style="text-align:center;margin-top:12px"></div>
    <p class="t-hint">这是算法生成的近似图，不是标准石原氏色盲检查图，配色与圆点密度都不规范。红绿色觉倾向只能当提示，不能代替医院检查。</p>
  </section></div>`;
  const cv = root.querySelector('#cb-cv'), g = cv.getContext('2d'), opts = root.querySelector('#cb-opts'), prog = root.querySelector('#cb-prog'), result = root.querySelector('#cb-result');
  const PAIRS = [[['#c96a4b', '#d08a5a', '#b8553c'], ['#5f8c62', '#7aa06a', '#4d7a55']], [['#8a6fa0', '#9b7fb0', '#7a5f90'], ['#c9a24b', '#d4b05d', '#b88f3c']], [['#b4552d', '#c4653d', '#a04a25'], ['#6b8fa8', '#7f9fb5', '#5a7e96']]];
  let i = 0, score = 0, cur = 0;
  const drawPlate = (num, fg, bg) => {
    g.clearRect(0, 0, 300, 300); g.fillStyle = '#eee8dc'; g.fillRect(0, 0, 300, 300);
    for (let k = 0; k < 900; k++) { const x = Math.random() * 300, y = Math.random() * 300, r = 3 + Math.random() * 9; if (Math.hypot(x - 150, y - 150) > 145) continue; g.fillStyle = L.pick(bg); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.save(); g.beginPath(); g.arc(150, 150, 145, 0, Math.PI * 2); g.clip();
    g.fillStyle = L.pick(fg); g.font = 'bold 130px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(num), 150, 155); g.restore();
  };
  const next = () => {
    if (i >= 11) { prog.textContent = '11 题做完'; const wrong = 11 - score; result.innerHTML = `<b>答对 ${score} / 11</b><br>${wrong <= 1 ? '没有明显的红绿色觉分辨倾向' : wrong <= 4 ? '有几题吃力，可能在红绿相近色上分辨偏弱' : '多题偏吃力，建议去正规机构做一次色觉检查'}<br><small>题目是近似生成图，结论仅供参考，不作诊断。</small>`; return; }
    cur = L.randInt(10, 99); const [fg, bg] = L.pick(PAIRS); drawPlate(cur, fg, bg);
    const cand = [cur, (cur + L.randInt(1, 9)) % 100, (cur + L.randInt(10, 25)) % 100, (cur + L.randInt(26, 40)) % 100];
    const set = [...new Set(cand)].slice(0, 4); while (set.length < 4) set.push(L.randInt(0, 99));
    opts.innerHTML = L.shuffle(set).map((x) => `<button type="button" class="t-btn" data-cb="${x}">${x}</button>`).join('');
    prog.textContent = `第 ${i + 1} / 11 题　看清里面的数字，选出它`;
  };
  opts.addEventListener('click', (e) => { const b = e.target.closest('[data-cb]'); if (!b) return; if (Number(b.dataset.cb) === cur) score++; i++; next(); });
  root.querySelector('#cb-start').onclick = () => { i = 0; score = 0; result.innerHTML = ''; next(); };
  K.setAction('开始 / 下一题', () => root.querySelector('#cb-start').click());
} };

/* ---------- 跨设备摄像头：本机预览 + 二维码（如实说明无信令服务器） ---------- */
S['phone-cam'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>摄像头串流（本机预览）</h2><span class="hint">纯静态页没有信令服务器</span></div>
    <div class="t-hint" style="padding:12px;background:#f6efe3;border-radius:8px;margin-bottom:12px"><b>先把边界说清楚：</b>真正的「手机↔手机 / 手机↔PC」P2P 画面直传需要 WebRTC 交换 SDP 要约，中间得有信令服务器转发，或者两台设备在同一浏览器里登录同一个账号。这个站是纯静态页、没有后端，做不到自动串流，也不假装能做到。这里给的是能在本机真实跑起来的部分：摄像头自检、分辨率/帧率、全屏当监视画面，以及一个二维码方便第二台设备各自打开自查。</div>
    <div class="t-row"><button type="button" class="t-btn primary" id="pc-start">开启本机摄像头</button><button type="button" class="t-btn" id="pc-stop">关闭</button><button type="button" class="t-btn" id="pc-full">全屏画面</button><button type="button" class="t-btn" id="pc-qr">生成本页二维码</button></div>
    <div style="position:relative;background:#161412;border-radius:8px;margin-top:14px;overflow:hidden"><video id="pc-v" autoplay playsinline muted style="width:100%;max-height:380px;display:block"></video></div>
    <div class="t-stat-row" id="pc-stat" style="margin-top:12px"></div>
    <div id="pc-qrwrap" style="text-align:center;margin-top:14px"></div>
    <p class="t-hint">想做真串流：自建一个 WebSocket 信令服务（哪怕几十行），或直接用系统自带的「相机共享 / 屏幕镜像」。本页不联网、不上传画面。</p>
  </section></div>`;
  const v = root.querySelector('#pc-v'), stat = root.querySelector('#pc-stat'), qrwrap = root.querySelector('#pc-qrwrap');
  let stream = null, raf = null, t0 = 0, frames = 0;
  const stop = () => { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } cancelAnimationFrame(raf); raf = null; stat.innerHTML = ''; };
  const loop = () => { frames++; const now = performance.now(); if (!t0) t0 = now; if (now - t0 >= 1000) { stat.innerHTML = `<div class="t-stat"><b>${v.videoWidth}×${v.videoHeight}</b><span>分辨率</span></div><div class="t-stat"><b>${L.round(frames / ((now - t0) / 1000), 1)}</b><span>fps</span></div>`; frames = 0; t0 = now; } raf = requestAnimationFrame(loop); };
  const start = async () => { stop(); if (!navigator.mediaDevices?.getUserMedia) { stat.innerHTML = '<p class="t-hint">这个环境不支持摄像头接口（需 HTTPS）</p>'; return; } try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); v.srcObject = stream; await v.play(); t0 = 0; frames = 0; raf = requestAnimationFrame(loop); } catch (e) { stat.innerHTML = `<p class="t-hint">打不开摄像头：${L.esc(e.message || e.name)}</p>`; } };
  root.querySelector('#pc-start').onclick = start;
  root.querySelector('#pc-stop').onclick = () => { stop(); stat.innerHTML = '<p class="t-hint">已关闭，摄像头已释放</p>'; };
  root.querySelector('#pc-full').onclick = () => { if (v.parentElement.requestFullscreen) v.parentElement.requestFullscreen(); };
  root.querySelector('#pc-qr').onclick = async () => { try { const { canvas } = await qrCanvas(location.href, { scale: 6 }); qrwrap.innerHTML = '<p class="t-hint">用另一台设备扫这个码，会打开同一页各自做本机自检：</p>'; qrwrap.appendChild(canvas); canvas.style.border = '8px solid #fff'; canvas.style.borderRadius = '6px'; } catch (e) { qrwrap.innerHTML = `<p class="t-hint">二维码生成失败：${L.esc(e.message)}</p>`; } };
  K.setAction('开启本机摄像头', start);
} };

/* ---------- 汉字转拼音 ---------- */
S['hanzi-pinyin'] = { kind: 'form', titleIn: '汉字与方式', titleOut: '拼音结果', wide: true,
  fields: [
    { id: 'text', label: '中文', type: 'textarea', rows: 5, default: '中国 你好 学习 工具箱' },
    { id: 'mode', label: '输出方式', type: 'select', options: ['全拼（空格分隔）', '首字母', '数字声调（近似）'] },
    { id: 'sep', label: '分隔符', type: 'select', options: ['空格', '无', '连字符 -', '逗号'] }],
  primary: '复制拼音', hintOut: '内置约 200 个最常用字的精简拼音表（无声调数据），超出范围的字会原样保留。它够用来给常见词注音，但不是完整拼音库，多音字、声调、生僻字都不覆盖——需要精确注音请用专业库。',
  compute: (v) => {
    const mode = v.mode.startsWith('首') ? 'first' : v.mode.startsWith('数字') ? 'num' : 'tone';
    const sep = v.sep === '无' ? '' : v.sep.startsWith('连') ? '-' : v.sep === '逗号' ? ',' : ' ';
    const chars = Array.from(String(v.text));
    const py = chars.map((c) => { const p = L.pinyin(c, mode); return p; });
    let out = mode === 'first' ? py.join('') : py.join(sep || ' ');
    if (sep && mode !== 'first') out = py.join(sep);
    const covered = chars.filter((c) => /[\u3400-\u9fff]/.test(c) && L.pinyin(c, 'tone') !== c).length;
    const total = chars.filter((c) => /[\u3400-\u9fff]/.test(c)).length;
    const text = [`原文：${v.text}`, `拼音：${out}`, `覆盖：${covered} / ${total} 个汉字（其余原样保留）`, covered < total ? '未覆盖的字：' + chars.filter((c) => /[\u3400-\u9fff]/.test(c) && L.pinyin(c, 'tone') === c).join('') : ''].filter(Boolean).join('\n');
    return { text, copy: out, stats: [{ label: '汉字数', value: total + ' 个' }, { label: '已覆盖', value: covered + ' 个' }, { label: '方式', value: L.esc(v.mode.slice(0, 4)) }],
      preview: `<p class="t-hint">逐字对照</p><table class="t-table"><thead><tr><th>字</th><th>拼音</th></tr></thead><tbody>${chars.filter((c) => c.trim()).map((c) => `<tr><td>${L.esc(c)}</td><td>${L.esc(L.pinyin(c, mode))}</td></tr>`).join('')}</tbody></table>` };
  } };

/* ---------- 汉字笔顺（描红手写板，不假装内置官方笔顺库） ---------- */
S['hanzi-stroke'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>汉字笔顺 · 描红练习</h2><span class="hint">手写轨迹 + 回放</span></div>
    <div class="t-hint" style="padding:10px;background:#f6efe3;border-radius:8px;margin-bottom:12px">这个工具<b>不内置官方笔顺数据</b>（那需要逐字笔画库）。它做的是真实的另一半：田字格里给出浅灰范字，你用鼠标/手指在上面写，记录每一笔轨迹，可逐笔回放、撤销、清除。标准笔顺请对着字帖或教材，这里负责让你练手写和对照。</div>
    <div class="t-row"><input class="t-input" id="hs-char" value="永" maxlength="1" style="width:70px;font-size:24px;text-align:center"><button type="button" class="t-btn" id="hs-undo">↶ 撤销一笔</button><button type="button" class="t-btn" id="hs-replay">▶ 逐笔回放</button><button type="button" class="t-btn" id="hs-clear">清空</button><button type="button" class="t-btn" id="hs-png">导出 PNG</button></div>
    <canvas id="hs-cv" width="360" height="360" style="display:block;margin:14px auto;background:#fff;border:2px solid #b4552d;border-radius:6px;touch-action:none;cursor:crosshair;max-width:100%"></canvas>
    <div class="t-hint" id="hs-info" style="text-align:center">已写 0 笔</div>
  </section></div>`;
  const cv = root.querySelector('#hs-cv'), g = cv.getContext('2d'), char = root.querySelector('#hs-char'), info = root.querySelector('#hs-info');
  let strokes = [], cur = null, drawing = false;
  const grid = () => {
    g.clearRect(0, 0, 360, 360); g.strokeStyle = '#e2c9b8'; g.lineWidth = 1; g.setLineDash([6, 5]);
    g.beginPath(); g.moveTo(180, 0); g.lineTo(180, 360); g.moveTo(0, 180); g.lineTo(360, 180); g.moveTo(0, 0); g.lineTo(360, 360); g.moveTo(360, 0); g.lineTo(0, 360); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#b4552d'; g.lineWidth = 2; g.strokeRect(1, 1, 358, 358);
    g.fillStyle = '#e8e2d8'; g.font = '260px KaiTi, STKaiti, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(char.value || '永', 180, 188);
    g.strokeStyle = '#2f2b26'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
    strokes.forEach((s) => { if (s.length < 2) return; g.beginPath(); g.moveTo(s[0].x, s[0].y); s.slice(1).forEach((p) => g.lineTo(p.x, p.y)); g.stroke(); });
    info.textContent = `已写 ${strokes.length} 笔　·　范字「${L.esc(char.value || '永')}」`;
  };
  const pos = (e) => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * 360 / b.width, y: (e.clientY - b.top) * 360 / b.height }; };
  cv.addEventListener('pointerdown', (e) => { drawing = true; cur = [pos(e)]; strokes.push(cur); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drawing) return; cur.push(pos(e)); grid(); });
  cv.addEventListener('pointerup', () => { drawing = false; grid(); });
  char.addEventListener('input', grid);
  root.querySelector('#hs-undo').onclick = () => { strokes.pop(); grid(); };
  root.querySelector('#hs-clear').onclick = () => { strokes = []; grid(); };
  root.querySelector('#hs-replay').onclick = async () => { const saved = strokes; strokes = []; grid(); for (const s of saved) { for (let i = 1; i <= s.length; i++) { strokes = [s.slice(0, i)]; grid(); await new Promise((r) => setTimeout(r, 12)); } } strokes = saved; grid(); };
  root.querySelector('#hs-png').onclick = () => K.canvasDownload(cv, '描红-' + (char.value || '字') + '.png');
  K.setAction('逐笔回放', () => root.querySelector('#hs-replay').click());
  grid();
} };

/* ---------- 五笔查询（离线精简表） ---------- */
S['wubi'] = { kind: 'form', titleIn: '查什么', titleOut: '结果', wide: true,
  fields: [
    { id: 'text', label: '汉字 / 编码', type: 'textarea', rows: 4, default: '中国 人民 工具箱' },
    { id: 'dir', label: '方向', type: 'select', options: ['汉字 → 编码', '编码 → 汉字'] },
    { id: 'ver', label: '版本', type: 'select', options: ['86 版', '98 版（仅列有差异的）'] }],
  primary: '复制结果', hintOut: '内置约 80 个常用字的 86 版精简编码表，够体验正反查与整段批量，不是完整五笔字库。98 版只标注少量差异，未收录的会如实显示「未收录」。',
  compute: (v) => {
    const M86 = { '一': 'GGLL', '二': 'FGG', '三': 'DGGG', '十': 'FGH', '人': 'W', '大': 'DDDD', '小': 'IHTY', '中': 'KHK', '国': 'LGYI', '工': 'A', '具': 'HWU', '箱': 'TSHF', '民': 'NAV', '日': 'JJJJ', '月': 'EEEE', '水': 'IIII', '火': 'OOOO', '山': 'MMMM', '木': 'SSSS', '金': 'QQQQ', '土': 'FFFF', '上': 'H', '下': 'GHI', '天': 'GDI', '地': 'FBN', '我': 'TRNT', '你': 'WQIY', '他': 'WBN', '们': 'WUN', '的': 'RQYY', '了': 'BNH', '是': 'JGHU', '不': 'GII', '有': 'DEF', '在': 'DHFD', '和': 'TKG', '学': 'IPBF', '生': 'TGD', '文': 'YYGY', '字': 'PBF', '语': 'YGKG', '数': 'OVTY', '书': 'NNHY', '笔': 'TTFN', '电': 'JNV', '话': 'YTDG', '手': 'RTGH', '机': 'SMN', '网': 'MQQI', '站': 'UHKG', '页': 'DMU', '图': 'LTUI', '片': 'THGN', '音': 'UJF', '乐': 'QII', '爱': 'EPDC', '好': 'VBG', '美': 'UGDU', '家': 'PEU', '门': 'UYHN', '路': 'KHTK', '车': 'LGNH', '吃': 'KTNN', '喝': 'KJQN', '看': 'RHF', '听': 'KRH', '说': 'YUKQ', '读': 'YFND', '写': 'PGNG', '开': 'GAK', '关': 'UDU', '来': 'GOI', '去': 'FCU', '多': 'QQU', '少': 'ITR', '高': 'YMKF', '新': 'USRH', '旧': 'HJG', '白': 'RRRR', '黑': 'LFOU', '红': 'XAG', '绿': 'XVIY', '蓝': 'AJTL', '黄': 'AMWU', '春': 'DWJF', '夏': 'DHTU', '秋': 'TOY', '冬': 'TUU', '风': 'MQI', '雨': 'FGHY', '雪': 'FVF', '云': 'FCU', '花': 'AWXB', '草': 'AJJ', '树': 'SCFY', '鸟': 'QYNG', '鱼': 'QGIF', '马': 'CNNG', '牛': 'RHK', '羊': 'UDJ', '猫': 'QTAL', '狗': 'QTQK' };
    const M98 = { '我': 'TRNY', '你': 'WQIY', '不': 'DHI', '是': 'JGHH', '的': 'RQYY', '有': 'DHE', '在': 'DHFD' };
    const M = v.ver.startsWith('98') ? { ...M86, ...M98 } : M86;
    const rev = Object.fromEntries(Object.entries(M).map(([k, x]) => [x, k]));
    const chars = Array.from(String(v.text)).filter((c) => c.trim());
    let out, miss = [];
    if (v.dir.startsWith('编码')) out = L.nonEmptyLines(v.text).map((l) => { const code = l.trim().toUpperCase(); const hit = Object.entries(M).filter(([k, x]) => x.startsWith(code) || x === code).map(([k]) => k); return hit.length ? `${code} → ${hit.join(' ')}` : `${code} → 未收录`; }).join('\n');
    else { out = chars.map((c) => M[c] || c).join(' '); miss = chars.filter((c) => /[\u3400-\u9fff]/.test(c) && !M[c]); }
    const text = [`${L.esc(v.dir)}（${L.esc(v.ver)}，内置 ${Object.keys(M).length} 字）`, '', out, miss.length ? '\n未收录：' + miss.join('') : ''].join('\n');
    const rows = Object.entries(M).slice(0, 60).map(([k, x]) => `<tr><td>${L.esc(k)}</td><td>${L.esc(x)}</td></tr>`).join('');
    return { text, copy: out, stats: [{ label: '表内字数', value: Object.keys(M).length + ' 字' }, { label: '方向', value: L.esc(v.dir.slice(0, 2)) }],
      preview: `<p class="t-hint">内置表前 60 条（汉字 / 编码）</p><table class="t-table"><thead><tr><th>字</th><th>86 编码</th></tr></thead><tbody>${rows}</tbody></table>` };
  } };

/* ---------- 简繁转换 ---------- */
S['zh-convert'] = { kind: 'form', titleIn: '文本与方向', titleOut: '转换结果', wide: true,
  fields: [
    { id: 'text', label: '文本', type: 'textarea', rows: 6, default: '简体中文转繁体，工具箱里有好多实用的小工具。' },
    { id: 'dir', label: '方向', type: 'select', options: ['简体 → 繁体', '繁体 → 简体'] }],
  primary: '复制结果', hintOut: '用内置简繁单字对照表逐字转换，覆盖常见字。它是「一对一字表」，做不了「一简对多繁」（如 发→發/髮、里→裡/裏）的按词判断，也不区分台湾/香港字形标准。出版、正式文书请人工校对。',
  compute: (v) => {
    const out = L.zhConv(v.text, v.dir.startsWith('简') ? 's2t' : 't2s');
    const chars = Array.from(String(v.text)), changed = chars.filter((c, i) => c !== Array.from(out)[i]).length;
    const text = [`${L.esc(v.dir)}`, '', out, '', `共 ${chars.length} 字，转换了 ${changed} 字`].join('\n');
    return { text, copy: out, stats: [{ label: '总字数', value: chars.length + ' 字' }, { label: '已转换', value: changed + ' 字' }],
      preview: `<p class="t-hint">逐字对照（前 40 字）</p><table class="t-table"><thead><tr><th>原</th><th>转</th></tr></thead><tbody>${chars.slice(0, 40).map((c, i) => `<tr><td>${L.esc(c)}</td><td>${L.esc(Array.from(out)[i] || '')}</td></tr>`).join('')}</tbody></table>` };
  } };

/* ---------- CSS 缓动曲线 ---------- */
S['css-bezier'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>cubic-bezier 缓动曲线</h2><span class="hint">拖控制点 · 动画预览 · 复制 CSS</span></div>
    <div class="t-row"><select class="t-select" id="bz-preset"><option value="">自定义</option><option value="0.25,0.1,0.25,1">ease</option><option value="0,0,1,1">linear</option><option value="0.42,0,1,1">ease-in</option><option value="0,0,0.58,1">ease-out</option><option value="0.42,0,0.58,1">ease-in-out</option><option value="0.4,0,0.2,1">Material 标准</option><option value="0.34,1.56,0.64,1">回弹</option><option value="0.68,-0.55,0.27,1.55">强回弹</option></select><input class="t-input grow" id="bz-val" value="0.25,0.1,0.25,1"><button type="button" class="t-btn primary" id="bz-copy">复制 CSS</button><button type="button" class="t-btn" id="bz-play">▶ 播动画</button></div>
    <div class="t-row" style="margin-top:14px;align-items:flex-start"><svg id="bz-svg" width="260" height="260" viewBox="0 0 260 260" style="background:#f7f3ea;border-radius:8px;flex:none"><line x1="30" y1="230" x2="230" y2="230" stroke="#c9c0b2"/><line x1="30" y1="230" x2="30" y2="30" stroke="#c9c0b2"/><path id="bz-path" d="" fill="none" stroke="#b4552d" stroke-width="3"/><line id="bz-l1" stroke="#6b8fa8" stroke-width="1"/><line id="bz-l2" stroke="#6b8fa8" stroke-width="1"/><circle id="bz-p1" r="9" fill="#b4552d" style="cursor:grab"/><circle id="bz-p2" r="9" fill="#b4552d" style="cursor:grab"/></svg>
      <div style="flex:1;min-width:200px"><div class="t-hint">动画预览</div><div style="height:120px;background:#f7f3ea;border-radius:8px;position:relative;overflow:hidden;margin-top:6px"><div id="bz-ball" style="position:absolute;top:44px;left:10px;width:36px;height:36px;border-radius:50%;background:#b4552d"></div></div><div class="t-hint" id="bz-note" style="margin-top:10px"></div></div></div>
    <p class="t-hint">横轴时间、纵轴进度，两个控制点可以拖出画布外（回弹效果需要 y &lt; 0 或 &gt; 1）。</p>
  </section></div>`;
  const svg = root.querySelector('#bz-svg'), p1 = root.querySelector('#bz-p1'), p2 = root.querySelector('#bz-p2'), path = root.querySelector('#bz-path'), l1 = root.querySelector('#bz-l1'), l2 = root.querySelector('#bz-l2'), val = root.querySelector('#bz-val'), preset = root.querySelector('#bz-preset'), ball = root.querySelector('#bz-ball'), note = root.querySelector('#bz-note');
  let xy = [0.25, 0.1, 0.25, 1], drag = null;
  const X = (t) => 30 + t * 200, Y = (v) => 230 - v * 200;
  const draw = () => {
    const [x1, y1, x2, y2] = xy;
    p1.setAttribute('cx', X(x1)); p1.setAttribute('cy', Y(y1)); p2.setAttribute('cx', X(x2)); p2.setAttribute('cy', Y(y2));
    path.setAttribute('d', `M30,230 C${X(x1)},${Y(y1)} ${X(x2)},${Y(y2)} 230,30`);
    l1.setAttribute('x1', 30); l1.setAttribute('y1', 230); l1.setAttribute('x2', X(x1)); l1.setAttribute('y2', Y(y1));
    l2.setAttribute('x1', 230); l2.setAttribute('y1', 30); l2.setAttribute('x2', X(x2)); l2.setAttribute('y2', Y(y2));
    val.value = xy.map((n) => L.round(n, 2)).join(',');
    note.textContent = `transition: all .6s cubic-bezier(${val.value});`;
    ball.style.transition = 'none'; ball.style.left = '10px';
  };
  const parseVal = () => { const a = String(val.value).split(',').map((x) => Number(x.trim())); if (a.length === 4 && a.every((x) => isFinite(x))) { xy = a; preset.value = ''; draw(); } };
  val.addEventListener('input', parseVal);
  preset.onchange = () => { if (preset.value) { xy = preset.value.split(',').map(Number); draw(); } };
  const down = (e, which) => { drag = which; e.preventDefault(); };
  p1.addEventListener('pointerdown', (e) => down(e, 1)); p2.addEventListener('pointerdown', (e) => down(e, 2));
  svg.addEventListener('pointermove', (e) => { if (!drag) return; const b = svg.getBoundingClientRect(), x = (e.clientX - b.left) * 260 / b.width, y = (e.clientY - b.top) * 260 / b.height; if (drag === 1) { xy[0] = L.clamp((x - 30) / 200, 0, 1); xy[1] = L.round((230 - y) / 200, 2); } else { xy[2] = L.clamp((x - 30) / 200, 0, 1); xy[3] = L.round((230 - y) / 200, 2); } preset.value = ''; draw(); });
  svg.addEventListener('pointerup', () => { drag = null; });
  root.querySelector('#bz-copy').onclick = () => K.copy(`transition: all .6s cubic-bezier(${val.value});`);
  root.querySelector('#bz-play').onclick = () => { ball.style.transition = 'none'; ball.style.left = '10px'; requestAnimationFrame(() => { ball.style.transition = `left .9s cubic-bezier(${val.value})`; ball.style.left = 'calc(100% - 46px)'; }); };
  K.setAction('▶ 播动画', () => root.querySelector('#bz-play').click());
  draw();
} };

/* ---------- CSS 剪切路径 ---------- */
S['css-clip-path'] = { kind: 'custom', render: (root, K) => {
  const PRESETS = {
    '矩形 inset': 'inset(10% 10% 10% 10% round 20px)', '圆形': 'circle(45% at 50% 50%)', '椭圆': 'ellipse(40% 30% at 50% 50%)',
    '三角形': 'polygon(50% 0%, 0% 100%, 100% 100%)', '五角星': 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    '箭头': 'polygon(0% 30%, 60% 30%, 60% 0%, 100% 50%, 60% 100%, 60% 70%, 0% 70%)',
    '对话气泡': 'polygon(0% 0%, 100% 0%, 100% 75%, 25% 75%, 12% 100%, 10% 75%, 0% 75%)',
    '菱形': 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', '六边形': 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    '斜切': 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
  };
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>CSS 剪切路径</h2><span class="hint">预设 + 自定义 polygon · 实时预览</span></div>
    <div class="t-row"><select class="t-select" id="cp-preset">${Object.keys(PRESETS).map((k) => `<option value="${L.esc(k)}">${L.esc(k)}</option>`).join('')}</select><button type="button" class="t-btn primary" id="cp-copy">复制 CSS</button></div>
    <div class="t-row" style="margin:12px 0"><input class="t-input grow" id="cp-val" value="${L.esc(PRESETS['五角星'])}"><label class="t-check"><input type="checkbox" id="cp-dots" checked>显示顶点</label></div>
    <div style="display:flex;justify-content:center;background:#f7f3ea;border-radius:8px;padding:20px;overflow:hidden"><div id="cp-shape" style="width:280px;height:280px;background:linear-gradient(135deg,#b4552d,#c98a4b);position:relative"></div></div>
    <div class="t-hint" style="margin-top:10px">在预览框里点一下可以给 polygon 追加一个顶点（按百分比记录）；改上面的输入框也能直接写任意 clip-path。</div>
  </section></div>`;
  const preset = root.querySelector('#cp-preset'), val = root.querySelector('#cp-val'), shape = root.querySelector('#cp-shape'), dots = root.querySelector('#cp-dots');
  const draw = () => { shape.style.clipPath = val.value; shape.innerHTML = ''; if (dots.checked && val.value.startsWith('polygon')) { const pts = val.value.replace(/^polygon\(|\)$/g, '').split(',').map((s) => s.trim().split(/\s+/).map((x) => parseFloat(x))); pts.forEach((p, i) => { if (!isFinite(p[0]) || !isFinite(p[1])) return; const d = document.createElement('div'); d.style.cssText = `position:absolute;left:${p[0]}%;top:${p[1]}%;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #2f2b26;transform:translate(-50%,-50%);font-size:9px;text-align:center;line-height:9px`; d.textContent = i; shape.appendChild(d); }); } };
  preset.onchange = () => { val.value = PRESETS[preset.value]; draw(); };
  val.addEventListener('input', () => { preset.value = ''; draw(); });
  dots.onchange = draw;
  shape.addEventListener('click', (e) => { if (!val.value.startsWith('polygon')) { K.toast('先选一个 polygon 预设才能加顶点'); return; } const b = shape.getBoundingClientRect(), x = L.round((e.clientX - b.left) / b.width * 100, 1), y = L.round((e.clientY - b.top) / b.height * 100, 1); const inner = val.value.replace(/^polygon\(|\)$/g, ''); val.value = `polygon(${inner}, ${x}% ${y}%)`; preset.value = ''; draw(); });
  root.querySelector('#cp-copy').onclick = () => K.copy(`clip-path: ${val.value};`);
  K.setAction('复制 CSS', () => root.querySelector('#cp-copy').click());
  draw();
} };

/* ---------- Flexbox / Grid ---------- */
S['css-flexbox'] = { kind: 'custom', render: (root, K) => {
  const SEL = (id, label, opts) => `<label class="t-label">${label} <select class="t-select" data-css="${id}">${opts.map((o) => `<option value="${o}">${o}</option>`).join('')}</select></label>`;
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>Flexbox / Grid 可视化</h2><span class="hint">调属性 → 实时预览 → 复制 CSS</span></div>
    <div class="t-row"><select class="t-select" id="fx-kind"><option value="flex">Flexbox</option><option value="grid">Grid</option></select><button type="button" class="t-btn primary" id="fx-copy">复制 CSS</button><button type="button" class="t-btn" id="fx-n">＋ 一个子项</button><button type="button" class="t-btn" id="fx-preset">常用预设</button></div>
    <div class="t-row" style="flex-wrap:wrap;margin:12px 0" id="fx-controls">
      ${SEL('flex-direction', '方向', ['row', 'row-reverse', 'column', 'column-reverse'])}
      ${SEL('justify-content', '主轴', ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'])}
      ${SEL('align-items', '交叉轴', ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'])}
      ${SEL('flex-wrap', '换行', ['nowrap', 'wrap', 'wrap-reverse'])}
      ${SEL('gap', '间距', ['0', '8px', '16px', '24px'])}
      ${SEL('grid-template-columns', '列', ['repeat(3, 1fr)', 'repeat(2, 1fr)', 'repeat(4, 1fr)', '1fr 2fr', 'auto auto auto'])}
    </div>
    <div id="fx-preview" style="min-height:220px;background:#f7f3ea;border-radius:8px;padding:14px;display:flex;gap:8px"></div>
    <pre class="t-out" id="fx-code" style="margin-top:12px;white-space:pre-wrap;font-size:12px"></pre>
  </section></div>`;
  const kind = root.querySelector('#fx-kind'), preview = root.querySelector('#fx-preview'), code = root.querySelector('#fx-code'), controls = root.querySelector('#fx-controls');
  let n = 4;
  const vals = () => { const v = { display: kind.value }; controls.querySelectorAll('[data-css]').forEach((s) => { v[s.dataset.css] = s.value; }); return v; };
  const draw = () => {
    const v = vals();
    const used = kind.value === 'grid' ? { display: 'grid', 'grid-template-columns': v['grid-template-columns'], gap: v.gap, 'align-items': v['align-items'] } : { display: 'flex', 'flex-direction': v['flex-direction'], 'justify-content': v['justify-content'], 'align-items': v['align-items'], 'flex-wrap': v['flex-wrap'], gap: v.gap };
    Object.entries(used).forEach(([k, x]) => { preview.style[k] = x; });
    preview.innerHTML = Array.from({ length: n }, (_, i) => `<div style="background:${['#b4552d', '#c98a4b', '#7d9a76', '#6b8fa8', '#9b7aa0', '#c0a062'][i % 6]};color:#fff;border-radius:6px;padding:14px 18px;font-weight:700;min-width:60px;text-align:center">${i + 1}</div>`).join('');
    code.textContent = '.container {\n' + Object.entries(used).map(([k, x]) => `  ${k}: ${x};`).join('\n') + '\n}';
    controls.querySelectorAll('[data-css]').forEach((s) => { const isGrid = s.dataset.css === 'grid-template-columns'; s.parentElement.style.opacity = (kind.value === 'grid' ? isGrid || ['gap', 'align-items'].includes(s.dataset.css) : !isGrid) ? '1' : '.4'; });
  };
  controls.addEventListener('change', draw);
  kind.onchange = draw;
  root.querySelector('#fx-n').onclick = () => { n = Math.min(12, n + 1); draw(); };
  root.querySelector('#fx-preset').onclick = () => { const p = [['居中三列', 'grid', 'repeat(3, 1fr)', '16px'], ['两端对齐', 'flex', '', '8px'], ['纵向堆叠', 'flex', '', '8px']][Math.floor(Math.random() * 3)]; kind.value = p[1]; controls.querySelector('[data-css="gap"]').value = p[3]; if (p[2]) controls.querySelector('[data-css="grid-template-columns"]').value = p[2]; if (p[0] === '两端对齐') controls.querySelector('[data-css="justify-content"]').value = 'space-between'; if (p[0] === '纵向堆叠') controls.querySelector('[data-css="flex-direction"]').value = 'column'; draw(); K.toast('已套用：' + p[0]); };
  root.querySelector('#fx-copy').onclick = () => K.copy(code.textContent);
  K.setAction('复制 CSS', () => root.querySelector('#fx-copy').click());
  draw();
} };
