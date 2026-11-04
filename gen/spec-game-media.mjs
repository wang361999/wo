// 音频 / 字幕 / 视频 / 益智游戏。
// 诚实边界：浏览器静态站不能本地编码 MP3/AAC/MP4，音视频一律导出 WAV / WebM，且重录是实时的（处理时长≈素材时长）；
// 游戏与字幕解析是完整本地实现，不引外部服务。
export const S = {};

const AUDIO_NOTE = '浏览器能解码 MP3/WAV/M4A/FLAC/OGG，但静态页没有本地 MP3/AAC 编码器，所以统一导出无损 WAV。要 MP3 请用桌面工具再转一次。文件只在本机处理，不上传。';
const VIDEO_NOTE = '浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。';

/* 在 process 内部共用的解码/封装片段（生成器只序列化函数体，所以都写在函数里） */
const audioProcessNote = '• 所有处理都在浏览器内存里完成，不上传音源。';

/* ---------- 音频剪辑 ---------- */
S['audio-trim'] = { kind: 'file', titleIn: '音频与时间段', titleOut: '剪辑结果', multiple: false,
  accept: 'audio/*', dropTitle: '拖入一个音频文件', primary: '裁切并导出 WAV', auto: false,
  fields: [{ id: 'start', label: '开始', type: 'number', default: 0, unit: '秒' }, { id: 'end', label: '结束（0=到末尾）', type: 'number', default: 0, unit: '秒' }],
  note: AUDIO_NOTE,
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]);
      const rate = src.sampleRate, ch = src.numberOfChannels;
      const s = Math.max(0, Math.min(v.start, src.duration - 0.01)), e = v.end > 0 ? Math.min(v.end, src.duration) : src.duration;
      if (e <= s) return { error: '结束时间要晚于开始时间' };
      const n = Math.max(1, Math.floor((e - s) * rate)), off = Math.floor(s * rate);
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, n, rate);
      for (let c = 0; c < ch; c++) out.getChannelData(c).set(src.getChannelData(c).slice(off, off + n));
      const wav = audioToWav(out); ac.close();
      return { text: `已裁切 ${L.round(s, 2)}s → ${L.round(e, 2)}s（${L.round(e - s, 2)} 秒，${ch} 声道 / ${rate} Hz）\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '时长', value: L.round(e - s, 2) + ' 秒' }, { label: '采样率', value: rate + ' Hz' }, { label: '声道', value: ch }],
        files: [{ name: 'audio-trim.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '解码失败：' + e.message + '（这个格式浏览器可能不支持）' }; }
  } };

/* ---------- 音频格式转换 ---------- */
S['audio-convert'] = { kind: 'file', titleIn: '音频与输出设置', titleOut: '转换结果', multiple: false,
  accept: 'audio/*', dropTitle: '拖入一个音频文件', primary: '导出 WAV', auto: false,
  fields: [{ id: 'mono', label: '转为单声道', type: 'checkbox', default: false }, { id: 'rate', label: '目标采样率', type: 'select', options: ['保持原样', '22050', '44100', '48000'] }],
  note: AUDIO_NOTE,
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]);
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      let data = Array.from({ length: src.numberOfChannels }, (_, c) => src.getChannelData(c));
      const from = src.sampleRate, to = v.rate === '保持原样' ? from : Number(v.rate);
      const rs = (arr) => { if (from === to) return arr; const n = Math.floor(arr.length * to / from), o = new Float32Array(n); for (let i = 0; i < n; i++) { const p = i * from / to, j = Math.floor(p), t = p - j; o[i] = (arr[j] || 0) * (1 - t) + (arr[j + 1] || 0) * t; } return o; };
      if (v.mono) { const mixed = new Float32Array(Math.max(...data.map((d) => d.length))); data.forEach((d) => d.forEach((x, i) => { mixed[i] += x / data.length; })); data = [rs(mixed)]; } else data = data.map(rs);
      const out = ac.createBuffer(data.length, data[0].length, to);
      data.forEach((d, c) => out.getChannelData(c).set(d));
      const wav = audioToWav(out); ac.close();
      return { text: `已转换：${data.length} 声道 / ${to} Hz / ${L.round(out.duration, 2)} 秒\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '声道', value: data.length }, { label: '采样率', value: to + ' Hz' }, { label: '大小', value: L.humanSize(wav.length) }],
        files: [{ name: 'audio-converted.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '解码失败：' + e.message }; }
  } };

/* ---------- 音频合并 ---------- */
S['audio-merge'] = { kind: 'file', titleIn: '多段音频（按选择顺序）', titleOut: '合并结果', multiple: true,
  accept: 'audio/*', dropTitle: '拖入多个音频文件', primary: '拼接并导出 WAV', auto: false,
  fields: [{ id: 'gap', label: '段间静音', type: 'number', default: 0, unit: '秒' }],
  note: AUDIO_NOTE + ' 采样率不同的段会线性重采样到第一段的采样率。',
  process: async (files, v, ctx) => {
    if (files.length < 2) return { error: '至少选两个音频文件' };
    try {
      const bufs = []; for (const f of files.slice(0, 8)) bufs.push(await decodeAudio(f));
      const rate = bufs[0].sampleRate, ch = Math.min(...bufs.map((b) => b.numberOfChannels));
      const gap = Math.max(0, v.gap) * rate;
      const rs = (arr, from) => { if (from === rate) return arr; const n = Math.floor(arr.length * rate / from), o = new Float32Array(n); for (let i = 0; i < n; i++) { const p = i * from / rate, j = Math.floor(p), t = p - j; o[i] = (arr[j] || 0) * (1 - t) + (arr[j + 1] || 0) * t; } return o; };
      const parts = bufs.map((b) => Array.from({ length: ch }, (_, c) => rs(b.getChannelData(Math.min(c, b.numberOfChannels - 1)), b.sampleRate)));
      const total = parts.reduce((a, p) => a + p[0].length, 0) + gap * (parts.length - 1);
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, total, rate);
      for (let c = 0; c < ch; c++) { const d = out.getChannelData(c); let pos = 0; parts.forEach((p, i) => { d.set(p[c], pos); pos += p[c].length; if (i < parts.length - 1) pos += gap; }); }
      const wav = audioToWav(out); ac.close();
      return { text: `已按选择顺序拼接 ${bufs.length} 段，共 ${L.round(out.duration, 2)} 秒\n段间静音 ${v.gap} 秒\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '段数', value: bufs.length + ' 段' }, { label: '总时长', value: L.round(out.duration, 2) + ' 秒' }, { label: '大小', value: L.humanSize(wav.length) }],
        files: [{ name: 'audio-merged.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '合并失败：' + e.message }; }
  } };

/* ---------- 音频分割 ---------- */
S['audio-split'] = { kind: 'file', titleIn: '音频与切分', titleOut: '分段结果', multiple: false,
  accept: 'audio/*', dropTitle: '拖入一个音频文件', primary: '切分并打包 ZIP', auto: false,
  fields: [{ id: 'way', label: '方式', type: 'select', options: ['按固定时长', '按时间点列表'] }, { id: 'len', label: '每段时长', type: 'number', default: 30, unit: '秒' }, { id: 'points', label: '时间点（逗号分隔，秒）', type: 'text', default: '30,90,150' }],
  note: AUDIO_NOTE + ' 分段用 ZIP 打包下载。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]), rate = src.sampleRate, ch = src.numberOfChannels;
      const total = src.length;
      const cuts = v.way.startsWith('按固定') ? Array.from({ length: Math.ceil(src.duration / Math.max(0.1, v.len)) - 1 }, (_, i) => (i + 1) * v.len) : String(v.points).split(/[,，\s]+/).map(Number).filter((x) => isFinite(x) && x > 0 && x < src.duration).sort((a, b) => a - b);
      const bounds = [0, ...cuts.map((x) => Math.floor(x * rate)), total];
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const entries = [];
      for (let i = 0; i < bounds.length - 1; i++) {
        const a = bounds[i], b = bounds[i + 1], n = b - a; if (n <= 0) continue;
        const o = ac.createBuffer(ch, n, rate);
        for (let c = 0; c < ch; c++) o.getChannelData(c).set(src.getChannelData(c).slice(a, b));
        entries.push({ name: `${String(i + 1).padStart(2, '0')}.wav`, data: audioToWav(o) });
      }
      ac.close();
      return { text: `切成 ${entries.length} 段（${L.round(src.duration, 2)} 秒 / ${rate} Hz）\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '分段', value: entries.length + ' 段' }, { label: '总时长', value: L.round(src.duration, 2) + ' 秒' }],
        files: [{ name: 'audio-split.zip', zip: entries, mime: 'application/zip', label: '下载 ZIP（全部段）' }] };
    } catch (e) { return { error: '切分失败：' + e.message }; }
  } };

/* ---------- 音量调整 ---------- */
S['audio-volume'] = { kind: 'file', titleIn: '音频与增益', titleOut: '调整结果', multiple: false,
  accept: 'audio/*', dropTitle: '拖入一个音频文件', primary: '导出 WAV', auto: false,
  fields: [{ id: 'db', label: '增益', type: 'number', default: 0, unit: 'dB（+6 约翻倍）' }, { id: 'norm', label: '响度归一化（按 RMS 到 -18 dBFS）', type: 'checkbox', default: false }, { id: 'limit', label: '防爆音限幅', type: 'checkbox', default: true }],
  note: AUDIO_NOTE + ' 归一化是简单的 RMS 目标，不等于广播级 LUFS。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]), ch = src.numberOfChannels, rate = src.sampleRate;
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, src.length, rate);
      let sum = 0, cnt = 0, peakBefore = 0;
      for (let c = 0; c < ch; c++) { const s = src.getChannelData(c); for (let i = 0; i < s.length; i++) { sum += s[i] * s[i]; cnt++; peakBefore = Math.max(peakBefore, Math.abs(s[i])); } }
      const rms = Math.sqrt(sum / Math.max(1, cnt));
      let gain = Math.pow(10, v.db / 20);
      if (v.norm) gain *= Math.pow(10, -18 / 20) / Math.max(1e-5, rms);
      let clipped = 0;
      for (let c = 0; c < ch; c++) { const s = src.getChannelData(c), d = out.getChannelData(c); for (let i = 0; i < s.length; i++) { let x = s[i] * gain; if (v.limit && Math.abs(x) > 0.99) { x = Math.sign(x) * 0.99; clipped++; } d[i] = x; } }
      const wav = audioToWav(out); ac.close();
      return { text: `增益 ${v.db} dB${v.norm ? ' + RMS 归一化' : ''}，原峰值 ${L.round(20 * Math.log10(Math.max(1e-5, peakBefore)), 1)} dBFS\n限幅削到 ${clipped} 个采样点\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '增益', value: v.db + ' dB' }, { label: '原峰值', value: L.round(20 * Math.log10(Math.max(1e-5, peakBefore)), 1) + ' dBFS' }, { label: '限幅点', value: clipped }],
        files: [{ name: 'audio-volume.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '处理失败：' + e.message }; }
  } };

/* ---------- 音频变速（重采样，会变调） ---------- */
S['audio-tempo'] = { kind: 'file', titleIn: '音频与速度', titleOut: '变速结果', multiple: false,
  accept: 'audio/*', dropTitle: '拖入一个音频文件', primary: '导出 WAV', auto: false,
  fields: [{ id: 'speed', label: '速度', type: 'range', min: 25, max: 400, default: 125, unit: '%（100=原速）' }],
  note: AUDIO_NOTE + ' 这里用重采样实现变速，音调会跟着变（快放变尖、慢放变沉）。保持音调不变的 time-stretch 需要相位声码器，静态页未内置，不假装支持。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]), rate = src.sampleRate, ch = src.numberOfChannels, k = 100 / Math.max(1, v.speed);
      const n = Math.floor(src.length * k), AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, n, rate);
      for (let c = 0; c < ch; c++) { const s = src.getChannelData(c), d = out.getChannelData(c); for (let i = 0; i < n; i++) { const p = i / k, j = Math.floor(p), t = p - j; d[i] = (s[j] || 0) * (1 - t) + (s[j + 1] || 0) * t; } }
      const wav = audioToWav(out); ac.close();
      return { text: `速度 ${v.speed}%，时长从 ${L.round(src.duration, 2)}s 变成 ${L.round(out.duration, 2)}s\n注意：音调随速度变化（${v.speed > 100 ? '变尖' : '变沉'}）\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '速度', value: v.speed + '%' }, { label: '新时长', value: L.round(out.duration, 2) + ' 秒' }],
        files: [{ name: 'audio-tempo.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '处理失败：' + e.message }; }
  } };

/* ---------- 音频淡入淡出 ---------- */
S['audio-fade'] = { kind: 'file', titleIn: '音频与淡入淡出', titleOut: '处理结果', multiple: false,
  accept: 'audio/*', dropTitle: '拖入一个音频文件', primary: '导出 WAV', auto: false,
  fields: [{ id: 'fin', label: '淡入', type: 'number', default: 1, unit: '秒' }, { id: 'fout', label: '淡出', type: 'number', default: 1, unit: '秒' }, { id: 'curve', label: '曲线', type: 'select', options: ['线性', '指数（更自然）'] }],
  note: AUDIO_NOTE,
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]), rate = src.sampleRate, ch = src.numberOfChannels;
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, src.length, rate);
      const ni = Math.floor(v.fin * rate), no = Math.floor(v.fout * rate), n = src.length;
      for (let c = 0; c < ch; c++) { const s = src.getChannelData(c), d = out.getChannelData(c); for (let i = 0; i < n; i++) { let g = 1; if (ni > 0 && i < ni) { const p = i / ni; g *= v.curve.startsWith('指数') ? p * p : p; } if (no > 0 && i > n - no) { const p = (n - i) / no; g *= v.curve.startsWith('指数') ? p * p : p; } d[i] = s[i] * g; } }
      const wav = audioToWav(out); ac.close();
      return { text: `淡入 ${v.fin}s / 淡出 ${v.fout}s（${L.esc(v.curve)}曲线），时长不变 ${L.round(src.duration, 2)} 秒\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '淡入', value: v.fin + ' 秒' }, { label: '淡出', value: v.fout + ' 秒' }],
        files: [{ name: 'audio-fade.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '处理失败：' + e.message }; }
  } };

/* ---------- 字幕格式转换 ---------- */
S['subtitle-convert'] = { kind: 'form', titleIn: '字幕与设置', titleOut: '转换结果', wide: true,
  fields: [
    { id: 'src', label: '字幕文本（SRT / VTT / LRC / ASS）', type: 'textarea', rows: 9, default: '1\n00:00:01,000 --> 00:00:03,500\n第一句\n\n2\n00:00:04,000 --> 00:00:06,000\n第二句 带<i>标签</i>' },
    { id: 'to', label: '输出格式', type: 'select', options: ['SRT', 'VTT', 'LRC', 'ASS', '纯文本'] },
    { id: 'shift', label: '整体偏移', type: 'number', default: 0, unit: '秒，可负' },
    { id: 'clean', label: '清理样式标签', type: 'checkbox', default: true }],
  primary: '复制结果',
  actions: [{ label: '下载字幕文件', run: (v, ctx) => { const el = ctx.root.querySelector('[data-out]'); const ext = { SRT: 'srt', VTT: 'vtt', LRC: 'lrc', ASS: 'ass', '纯文本': 'txt' }[v.to]; ctx.download('subtitle.' + ext, el.textContent, 'text/plain;charset=utf-8'); } }],
  hintOut: '用内置解析器读 SRT/VTT 时间轴与 LRC 标签，再按目标格式重写。ASS 只输出基础 Dialogue 行，不还原复杂样式。GBK 乱码请先用「文件编码转换」转成 UTF-8。',
  compute: (v) => {
    const { cues } = L.parseSubtitle(v.src);
    if (!cues.length) return { error: '没解析出字幕条目，检查格式' };
    const T = (s, type) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return type === 'vtt' ? `${L.pad(h)}:${L.pad(m)}:${L.pad(sec)}.${L.pad(ms, 3)}` : `${L.pad(h)}:${L.pad(m)}:${L.pad(sec)},${L.pad(ms, 3)}`; };
    const TA = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60), cs = Math.floor((s % 1) * 100); return `${h}:${L.pad(m)}:${L.pad(sec)}.${L.pad(cs, 2)}`; };
    const clean = (s) => v.clean ? String(s).replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '') : String(s);
    const list = cues.map((c) => ({ start: Math.max(0, c.start + v.shift), end: c.end ? Math.max(0, c.end + v.shift) : c.start + v.shift + 2, text: clean(c.text) }));
    let out = '';
    if (v.to === 'SRT' || v.to === 'VTT') { if (v.to === 'VTT') out = 'WEBVTT\n\n'; out += list.map((c, i) => `${i + 1}\n${T(c.start, v.to.toLowerCase())} --> ${T(c.end, v.to.toLowerCase())}\n${c.text}`).join('\n\n'); }
    else if (v.to === 'LRC') out = list.map((c) => `[${L.pad(Math.floor(c.start / 60))}:${L.pad(Math.floor(c.start % 60))}.${L.pad(Math.round((c.start % 1) * 100), 2)}]${c.text.replace(/\n/g, ' ')}`).join('\n');
    else if (v.to === 'ASS') out = '[Script Info]\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize\nStyle: Default, Sans, 20\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n' + list.map((c) => `Dialogue: 0,${TA(c.start)},${TA(c.end)},Default,,0,0,0,,${c.text.replace(/\n/g, '\\N')}`).join('\n');
    else out = list.map((c) => c.text).join('\n');
    return { text: out, copy: out, stats: [{ label: '条目', value: list.length + ' 条' }, { label: '输出', value: L.esc(v.to) }, { label: '偏移', value: v.shift + ' 秒' }] };
  } };

/* ---------- 字幕转文字稿 ---------- */
S['subtitle-to-text'] = { kind: 'form', titleIn: '字幕与排版', titleOut: '文字稿', wide: true,
  fields: [
    { id: 'src', label: '字幕文本', type: 'textarea', rows: 9, default: '1\n00:00:01,000 --> 00:00:02,000\n大家好，\n\n2\n00:00:02,000 --> 00:00:03,200\n今天我们聊聊工具。\n\n3\n00:00:03,200 --> 00:00:04,000\n今天我们聊聊工具。' },
    { id: 'merge', label: '按标点合并断句', type: 'checkbox', default: true },
    { id: 'dedup', label: '去掉滚动重复', type: 'checkbox', default: true },
    { id: 'stamp', label: '每段保留时间戳', type: 'checkbox', default: false },
    { id: 'gap', label: '合并最大间隔', type: 'number', default: 1.5, unit: '秒' }],
  primary: '复制文字稿', hintOut: '把逐句字幕拼成能读的稿子：断句按标点合并、去掉卡拉OK式滚动重复、可留段落起始时间。纯文本处理，不上传。',
  compute: (v) => {
    const { cues } = L.parseSubtitle(v.src);
    if (!cues.length) return { error: '没解析出字幕条目' };
    let list = cues.map((c) => ({ start: c.start, end: c.end, text: String(c.text).replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim() })).filter((x) => x.text);
    if (v.dedup) { const seen = []; list = list.filter((x) => { if (seen.length && (seen[seen.length - 1].text === x.text || x.text.startsWith(seen[seen.length - 1].text) || seen[seen.length - 1].text.startsWith(x.text))) { seen[seen.length - 1].end = x.end; return false; } seen.push(x); return true; }); }
    let paras = [];
    if (v.merge) {
      let cur = null;
      list.forEach((x) => {
        const joinable = cur && (x.start - cur.end <= v.gap || !/[。！？.!?]$/.test(cur.text));
        if (joinable) { cur.text += (/[，,、；;]$/.test(cur.text) ? '' : '') + x.text; cur.end = x.end; }
        else { if (cur) paras.push(cur); cur = { start: x.start, end: x.end, text: x.text }; }
      });
      if (cur) paras.push(cur);
    } else paras = list;
    const T = (s) => `${L.pad(Math.floor(s / 60))}:${L.pad(Math.floor(s % 60))}`;
    const out = paras.map((p) => (v.stamp ? `[${T(p.start)}] ` : '') + p.text).join('\n\n');
    return { text: out, copy: out, stats: [{ label: '原条目', value: cues.length + ' 条' }, { label: '成段', value: paras.length + ' 段' }, { label: '字数', value: out.replace(/\s/g, '').length + ' 字' }] };
  } };

/* ---------- 字幕时间轴校准 ---------- */
S['subtitle-sync'] = { kind: 'form', titleIn: '两点校准', titleOut: '校准结果', wide: true,
  fields: [
    { id: 'src', label: '字幕文本', type: 'textarea', rows: 8, default: '1\n00:00:10,000 --> 00:00:12,000\n第一句\n\n2\n00:01:00,000 --> 00:01:02,000\n中间\n\n3\n00:02:00,000 --> 00:02:03,000\n最后' },
    { id: 'a0', label: '第一点：字幕里的时间', type: 'number', default: 10, unit: '秒' },
    { id: 'a1', label: '第一点：实际应是', type: 'number', default: 12, unit: '秒' },
    { id: 'b0', label: '第二点：字幕里的时间', type: 'number', default: 120, unit: '秒' },
    { id: 'b1', label: '第二点：实际应是', type: 'number', default: 126, unit: '秒' },
    { id: 'fps', label: '帧率换算（0=不用）', type: 'select', options: ['0', '23.976', '25', '29.97', '30'] },
    { id: 'shift', label: '额外整体偏移', type: 'number', default: 0, unit: '秒' }],
  primary: '复制校准后字幕', hintOut: '字幕越往后越不同步，通常是帧率差（23.976 ↔ 25）。用前后两个点对解出线性变换 新 = (旧 − a0) × 倍率 + a1，再套到全部条目。帧率换算给的是常见比值参考。',
  compute: (v) => {
    const { cues } = L.parseSubtitle(v.src);
    if (!cues.length) return { error: '没解析出字幕条目' };
    const den = v.b0 - v.a0;
    if (Math.abs(den) < 0.001) return { error: '两个校准点的原时间不能相同' };
    const k = (v.b1 - v.a1) / den;
    const f = (x) => Math.max(0, (x - v.a0) * k + v.a1 + v.shift);
    const T = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return `${L.pad(h)}:${L.pad(m)}:${L.pad(sec)},${L.pad(ms, 3)}`; };
    const out = cues.map((c, i) => `${i + 1}\n${T(f(c.start))} --> ${T(f(c.end || c.start + 2))}\n${String(c.text).replace(/<[^>]+>/g, '')}`).join('\n\n');
    const ratio = Number(v.fps) > 0 ? L.round(25 / Number(v.fps), 5) : null;
    const text = [`解出拉伸倍率 k = ${L.round(k, 6)}（${k > 1 ? '字幕偏慢，需要拉长' : k < 1 ? '字幕偏快，需要压缩' : '无拉伸，只有整体偏移'}）`, `变换：新 = (旧 − ${v.a0}) × ${L.round(k, 6)} + ${v.a1} + ${v.shift}`, ratio ? `参考：25fps 与 ${v.fps}fps 的比值约 ${ratio}（可对照你解出的 k）` : '', '', out].filter(Boolean).join('\n');
    return { text, copy: out, stats: [{ label: '倍率 k', value: L.round(k, 5) }, { label: '条目', value: cues.length + ' 条' }],
      preview: `<p class="t-hint">前 3 条对照</p><table class="t-table"><thead><tr><th>#</th><th>原起</th><th>新起</th></tr></thead><tbody>${cues.slice(0, 3).map((c, i) => `<tr><td>${i + 1}</td><td>${T(c.start)}</td><td>${T(f(c.start))}</td></tr>`).join('')}</tbody></table>` };
  } };

/* ---------- 双语字幕合并 ---------- */
S['subtitle-bilingual'] = { kind: 'form', titleIn: '主副两条字幕', titleOut: '合并结果', wide: true,
  fields: [
    { id: 'main', label: '主轨字幕', type: 'textarea', rows: 6, default: '1\n00:00:01,000 --> 00:00:03,000\nHello world\n\n2\n00:00:05,000 --> 00:00:07,000\nSecond line' },
    { id: 'sub', label: '副轨字幕', type: 'textarea', rows: 6, default: '1\n00:00:01,100 --> 00:00:03,100\n你好，世界\n\n2\n00:00:05,200 --> 00:00:07,200\n第二行' },
    { id: 'order', label: '顺序', type: 'select', options: ['主在上 / 副在下', '副在上 / 主在下'] },
    { id: 'sep', label: '分隔', type: 'select', options: ['换行', '斜杠 /', '竖线 |'] },
    { id: 'tol', label: '配对容差', type: 'number', default: 1.5, unit: '秒' }],
  primary: '复制合并字幕', hintOut: '按时间重叠配对，不是按序号硬凑：给主轨每条找时间最接近、偏差在容差内的副轨条目。输出 SRT，可改主副顺序与分隔符。',
  compute: (v) => {
    const A = L.parseSubtitle(v.main).cues, B = L.parseSubtitle(v.sub).cues;
    if (!A.length) return { error: '主轨没解析出条目' };
    const T = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return `${L.pad(h)}:${L.pad(m)}:${L.pad(sec)},${L.pad(ms, 3)}`; };
    const sep = v.sep === '换行' ? '\n' : v.sep.includes('斜杠') ? ' / ' : ' | ';
    const clean = (s) => String(s).replace(/<[^>]+>/g, '').trim();
    let matched = 0;
    const rows = A.map((a) => {
      let best = null, d = Infinity;
      B.forEach((b) => { const overlap = Math.min(a.end || a.start + 2, b.end || b.start + 2) - Math.max(a.start, b.start); const dist = overlap >= 0 ? 0 : Math.abs(b.start - a.start); if (dist < d) { d = dist; best = b; } });
      if (best && d <= v.tol) { matched++; const up = v.order.startsWith('主') ? clean(a.text) : clean(best.text), dn = v.order.startsWith('主') ? clean(best.text) : clean(a.text); return { start: a.start, end: a.end || a.start + 2, text: up + sep + dn }; }
      return { start: a.start, end: a.end || a.start + 2, text: clean(a.text) };
    });
    const out = rows.map((r, i) => `${i + 1}\n${T(r.start)} --> ${T(r.end)}\n${r.text}`).join('\n\n');
    return { text: out, copy: out, stats: [{ label: '主轨', value: A.length + ' 条' }, { label: '副轨', value: B.length + ' 条' }, { label: '成功配对', value: matched + ' 条' }] };
  } };

/* ---------- 屏幕录制 ---------- */
S['screen-record'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>屏幕录制</h2><span class="hint">getDisplayMedia + MediaRecorder · 本地不上传</span></div>
    <div class="t-row"><label class="t-check"><input type="checkbox" id="sr-audio" checked>录系统声音</label><label class="t-check"><input type="checkbox" id="sr-mic">同时录麦克风</label><select class="t-select" id="sr-q"><option value="2500000">标准 2.5Mbps</option><option value="5000000">高清 5Mbps</option><option value="1200000">省空间 1.2Mbps</option></select><button type="button" class="t-btn primary" id="sr-start">● 开始录制</button><button type="button" class="t-btn" id="sr-stop">■ 停止</button></div>
    <div class="t-out" id="sr-time" style="font-size:30px;text-align:center;font-weight:700;margin:14px 0">00:00</div>
    <video id="sr-view" controls style="width:100%;max-height:340px;background:#161412;border-radius:8px;display:none"></video>
    <div class="t-stat-row" id="sr-stat" style="margin-top:12px"></div>
    <p class="t-hint">用浏览器原生的「共享屏幕」 picker 选窗口/标签页/整屏，录完直接下载 WebM。浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。 Safari 与部分手机浏览器不支持。</p>
  </section></div>`;
  const view = root.querySelector('#sr-view'), time = root.querySelector('#sr-time'), stat = root.querySelector('#sr-stat'), q = root.querySelector('#sr-q'), audio = root.querySelector('#sr-audio'), mic = root.querySelector('#sr-mic');
  let rec = null, chunks = [], stream = null, t0 = 0, tick = null, url = null;
  const stop = () => { if (rec && rec.state !== 'inactive') rec.stop(); clearInterval(tick); tick = null; };
  const start = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) { stat.innerHTML = '<p class="t-hint">这个浏览器不支持屏幕共享或 MediaRecorder（建议桌面版 Chrome / Edge）</p>'; return; }
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: audio.checked });
      if (mic.checked) { try { const m = await navigator.mediaDevices.getUserMedia({ audio: true }); m.getAudioTracks().forEach((t) => stream.addTrack(t)); } catch (e) {} }
      const tracks = stream.getVideoTracks(); if (tracks[0]) tracks[0].onended = stop;
      chunks = []; const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Number(q.value) });
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => { const b = new Blob(chunks, { type: 'video/webm' }); if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(b); view.src = url; view.style.display = ''; stat.innerHTML = `<div class="t-stat"><b>${L.humanSize(b.size)}</b><span>文件大小</span></div><div class="t-stat"><b>${L.round((Date.now() - t0) / 1000, 1)}s</b><span>录制时长</span></div>`; const a = document.createElement('a'); a.href = url; a.download = 'screen-record.webm'; a.textContent = '⬇ 下载录屏 WebM'; a.className = 't-btn primary'; a.style.marginTop = '10px'; stat.appendChild(a); if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } };
      rec.start(1000); t0 = Date.now();
      tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); time.textContent = `${L.pad(Math.floor(s / 60))}:${L.pad(s % 60)}`; }, 500);
      stat.innerHTML = '<p class="t-hint">录制中… 切到要录的窗口，回来点「停止」</p>';
    } catch (e) { stat.innerHTML = `<p class="t-hint">没开始录制：${L.esc(e.name || '')} ${L.esc(e.message || '')}（多半是取消了共享选择）</p>`; }
  };
  root.querySelector('#sr-start').onclick = start;
  root.querySelector('#sr-stop').onclick = stop;
  K.setAction('开始 / 停止录制', () => { if (rec && rec.state === 'recording') stop(); else start(); });
} };

/* ---------- 视频压缩 ---------- */
S['video-compress'] = { kind: 'file', titleIn: '视频与目标', titleOut: '压缩结果', multiple: false,
  accept: 'video/*', dropTitle: '拖入一个视频文件', primary: '开始重录压缩', auto: false,
  fields: [{ id: 'w', label: '目标宽度（0=保持）', type: 'number', default: 720, unit: 'px' }, { id: 'fps', label: '目标帧率', type: 'select', options: ['30', '24', '15', '保持原样'] }, { id: 'br', label: '码率', type: 'select', options: ['800000 低', '1500000 中', '3000000 高'] }],
  note: VIDEO_NOTE + ' 做法是：把视频画到缩小后的 canvas，再用 captureStream + MediaRecorder 实时录一遍，因此能降分辨率/帧率/码率。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个视频文件' };
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return { error: '这个浏览器不支持 canvas.captureStream / MediaRecorder，请用桌面版 Chrome' };
    const f = files[0];
    try {
      const url = URL.createObjectURL(f), vid = document.createElement('video');
      vid.src = url; vid.muted = true; vid.playsInline = true;
      await new Promise((res, rej) => { vid.onloadedmetadata = res; vid.onerror = () => rej(new Error('视频读不出来（这个封装浏览器可能不支持）')); });
      const W = v.w > 0 ? Math.min(v.w, vid.videoWidth) : vid.videoWidth, H = Math.round(W * vid.videoHeight / vid.videoWidth);
      const cv = L.canvasOf(W, H), g = cv.getContext('2d');
      const fps = v.fps === '保持原样' ? 30 : Number(v.fps);
      const stream = cv.captureStream(fps);
      try { const a = vid.captureStream ? vid.captureStream() : null; if (a) a.getAudioTracks().forEach((t) => stream.addTrack(t)); } catch (e) {}
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm';
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Number(String(v.br).split(' ')[0]) });
      const chunks = []; rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      ctx.setBusy('重录中… 需要等视频播完，别切走标签页');
      const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' })); });
      rec.start(500); vid.currentTime = 0; await vid.play();
      const draw = () => { if (!vid.paused && !vid.ended) { g.drawImage(vid, 0, 0, W, H); requestAnimationFrame(draw); } };
      draw();
      await new Promise((res) => { vid.onended = res; });
      rec.stop(); const blob = await done; vid.pause(); URL.revokeObjectURL(url);
      const u8 = new Uint8Array(await blob.arrayBuffer());
      return { text: `重录完成：${W}×${H} / ${fps}fps，输出 ${L.humanSize(u8.length)}（原 ${L.humanSize(f.size)}）\n浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。`,
        stats: [{ label: '分辨率', value: W + '×' + H }, { label: '输出', value: L.humanSize(u8.length) }, { label: '原文件', value: L.humanSize(f.size) }],
        files: [{ name: 'video-compressed.webm', data: u8, mime: 'video/webm', label: '下载 WebM' }] };
    } catch (e) { return { error: '压缩失败：' + e.message }; }
  } };

/* ---------- 视频转 ASCII ---------- */
S['video-to-ascii'] = { kind: 'file', titleIn: '视频与字符画', titleOut: '实时字符动画', multiple: false,
  accept: 'video/*', dropTitle: '拖入一个视频文件', primary: '播放字符动画', auto: false,
  fields: [{ id: 'cols', label: '字符列数', type: 'number', default: 80, unit: '列' }, { id: 'chars', label: '字符集', type: 'select', options: [' .:-=+*#%@', ' .·:●', ' 01', ' ░▒▓█'] }, { id: 'color', label: '彩色模式', type: 'checkbox', default: false }, { id: 'maxFrames', label: '导出帧数上限', type: 'number', default: 60, unit: '帧' }],
  note: '用 video + canvas 逐帧采样亮度转成字符，实时显示并可导出前若干帧为 TXT。纯本地，不上传视频。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个视频文件' };
    const f = files[0];
    try {
      const url = URL.createObjectURL(f), vid = document.createElement('video');
      vid.src = url; vid.muted = true; vid.playsInline = true; vid.loop = true;
      await new Promise((res, rej) => { vid.onloadedmetadata = res; vid.onerror = () => rej(new Error('视频读不出来')); });
      const cols = L.clamp(Math.round(v.cols), 20, 160), rows = Math.max(8, Math.round(cols * vid.videoHeight / vid.videoWidth / 2));
      const cv = L.canvasOf(cols, rows), g = cv.getContext('2d', { willReadFrequently: true });
      const set = String(v.chars), frames = [];
      ctx.setPreview(`<pre id="va-pre" style="font:9px/9px monospace;letter-spacing:0;white-space:pre;background:#161412;color:#f5efe4;padding:10px;overflow:auto;max-height:340px">准备中…</pre>`);
      const pre = ctx.root.querySelector('#va-pre');
      const frame = () => {
        if (vid.readyState >= 2) {
          g.drawImage(vid, 0, 0, cols, rows); const d = g.getImageData(0, 0, cols, rows).data;
          let s = ''; for (let y = 0; y < rows; y++) { for (let x = 0; x < cols; x++) { const i = (y * cols + x) * 4, lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255; s += set[Math.min(set.length - 1, Math.floor(lum * set.length))]; } s += '\n'; }
          if (pre) pre.textContent = s;
          if (frames.length < v.maxFrames) frames.push(s);
        }
        if (!vid.paused && !vid.ended) requestAnimationFrame(frame);
      };
      await vid.play(); frame();
      return { text: `字符动画已开始（${cols}×${rows}）。已缓存 ${frames.length} 帧用于导出，点上方可下载 TXT。\n浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。`,
        stats: [{ label: '网格', value: cols + '×' + rows }, { label: '原分辨率', value: vid.videoWidth + '×' + vid.videoHeight }],
        files: [{ name: 'video-ascii.txt', data: L.utf8(frames.join('\n\n')), mime: 'text/plain', label: '下载字符帧 TXT' }] };
    } catch (e) { return { error: '处理失败：' + e.message }; }
  } };

/* ---------- 视频提取音频 ---------- */
S['video-audio-extract'] = { kind: 'file', titleIn: '视频', titleOut: '提取结果', multiple: false,
  accept: 'video/*', dropTitle: '拖入一个视频文件', primary: '实时录制音轨', auto: false,
  fields: [{ id: 'start', label: '从', type: 'number', default: 0, unit: '秒' }, { id: 'end', label: '到（0=末尾）', type: 'number', default: 0, unit: '秒' }],
  note: VIDEO_NOTE + ' 用 MediaElementSource 把视频声音接到 MediaStreamDestination 再录成 WebM(Opus) 音频；不是直接拆容器、也不是 MP3。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个视频文件' };
    if (!window.MediaRecorder) return { error: '浏览器不支持 MediaRecorder' };
    const f = files[0];
    try {
      const url = URL.createObjectURL(f), vid = document.createElement('video');
      vid.src = url; vid.playsInline = true;
      await new Promise((res, rej) => { vid.onloadedmetadata = res; vid.onerror = () => rej(new Error('视频读不出来')); });
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const dest = ac.createMediaStreamDestination();
      ac.createMediaElementSource(vid).connect(dest);
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const rec = new MediaRecorder(dest.stream, { mimeType: mime });
      const chunks = []; rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      ctx.setBusy('录制音轨中… 需要等视频播完');
      const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks, { type: 'audio/webm' })); });
      if (v.start > 0) vid.currentTime = v.start;
      const stopAt = v.end > 0 ? v.end : vid.duration;
      rec.start(500); await vid.play();
      await new Promise((res) => { const chk = setInterval(() => { if (vid.currentTime >= stopAt || vid.ended) { clearInterval(chk); res(); } }, 200); });
      vid.pause(); rec.stop(); const blob = await done; ac.close(); URL.revokeObjectURL(url);
      const u8 = new Uint8Array(await blob.arrayBuffer());
      return { text: `音轨已录成 WebM(Opus)：${L.humanSize(u8.length)}，区间 ${L.round(v.start, 1)}s → ${L.round(stopAt, 1)}s\n浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。`,
        stats: [{ label: '区间', value: L.round(stopAt - v.start, 1) + ' 秒' }, { label: '输出', value: L.humanSize(u8.length) }],
        files: [{ name: 'video-audio.webm', data: u8, mime: 'audio/webm', label: '下载音频 WebM' }] };
    } catch (e) { return { error: '提取失败：' + e.message }; }
  } };

/* ================= 益智游戏 ================= */

/* ---------- 翻卡配对 ---------- */
S['memory-match'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>翻卡配对</h2><span class="hint">计时 / 步数</span></div>
    <div class="t-row"><select class="t-select" id="mm-size"><option value="3x4">3×4（6 对）</option><option value="4x4">4×4（8 对）</option><option value="4x5">4×5（10 对）</option><option value="6x6">6×6（18 对）</option></select><button type="button" class="t-btn primary" id="mm-new">重新开局</button><span class="t-hint" id="mm-stat"></span></div>
    <div id="mm-grid" style="display:grid;gap:8px;margin:14px 0;max-width:520px"></div>
    <p class="t-hint">翻开两张一样的就配对成功。四档难度只是网格和牌数不同。</p>
  </section></div>`;
  const grid = root.querySelector('#mm-grid'), size = root.querySelector('#mm-size'), stat = root.querySelector('#mm-stat');
  const EMOJI = ['🍎', '🍊', '🍇', '🍉', '🍓', '🍒', '🥝', '🍑', '🥑', '🍍', '🌽', '🥕', '🍄', '🌰', '🍯', '🧀', '🍞', '🥨'];
  let deck = [], open = [], matched = new Set(), moves = 0, t0 = 0, tick = null, lock = false;
  const newGame = () => {
    const [r, c] = size.value.split('x').map(Number), pairs = Math.floor(r * c / 2);
    deck = L.shuffle([...EMOJI.slice(0, pairs), ...EMOJI.slice(0, pairs)].map((e, i) => ({ e, id: i })));
    open = []; matched = new Set(); moves = 0; lock = false; clearInterval(tick); t0 = Date.now();
    grid.style.gridTemplateColumns = `repeat(${c},1fr)`; draw();
    tick = setInterval(() => { stat.textContent = `步数 ${moves}　·　用时 ${Math.floor((Date.now() - t0) / 1000)} 秒　·　配对 ${matched.size / 2}/${pairs}`; }, 500);
    stat.textContent = `步数 0　·　配对 0/${pairs}`;
  };
  const draw = () => { grid.innerHTML = deck.map((d, i) => `<button type="button" class="t-btn" data-mm="${i}" style="height:64px;font-size:28px;${matched.has(i) || open.includes(i) ? 'background:#f3eee6' : 'background:#b4552d;color:transparent'}">${matched.has(i) || open.includes(i) ? d.e : '?'}</button>`).join(''); };
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mm]'); if (!b || lock) return;
    const i = Number(b.dataset.mm); if (matched.has(i) || open.includes(i)) return;
    open.push(i); draw();
    if (open.length === 2) { moves++; lock = true; const [a, c] = open; if (deck[a].e === deck[c].e) { matched.add(a); matched.add(c); open = []; lock = false; draw(); if (matched.size === deck.length) { clearInterval(tick); stat.textContent = `🎉 全部配对！${moves} 步 / ${Math.floor((Date.now() - t0) / 1000)} 秒`; } } else setTimeout(() => { open = []; lock = false; draw(); }, 700); }
  });
  root.querySelector('#mm-new').onclick = newGame; size.onchange = newGame;
  K.setAction('重新开局', newGame); newGame();
} };

/* ---------- 数独（生成 + 求解 + 交互） ---------- */
S['sudoku'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>数独</h2><span class="hint">唯一解 · 不用猜</span></div>
    <div class="t-row"><select class="t-select" id="sd-lv"><option value="30">简单</option><option value="40" selected>中等</option><option value="50">困难</option><option value="58">专家</option></select><button type="button" class="t-btn primary" id="sd-new">新题</button><button type="button" class="t-btn" id="sd-hint">提示一格</button><button type="button" class="t-btn" id="sd-check">检查</button><span class="t-hint" id="sd-stat"></span></div>
    <div id="sd-grid" style="display:grid;grid-template-columns:repeat(9,1fr);gap:1px;background:#8a8073;border:2px solid #8a8073;width:min(100%,400px);margin:14px auto"></div>
    <div class="t-row" style="justify-content:center"><span class="t-label">选数字：</span>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" class="t-btn" data-sdnum="${n}" style="width:38px;padding:6px 0">${n}</button>`).join('')}<button type="button" class="t-btn" data-sdnum="0">×</button></div>
    <p class="t-hint">先点一个格子，再点下面的数字填入。题目用回溯生成并挖洞，保证唯一解；提示会讲这一格为什么只能填这个数。</p>
  </section></div>`;
  const grid = root.querySelector('#sd-grid'), stat = root.querySelector('#sd-stat'), lv = root.querySelector('#sd-lv');
  let puzzle = [], solution = [], board = [], fixed = new Set(), sel = -1, t0 = 0, tick = null;
  const ok = (b, i, n) => { const r = Math.floor(i / 9), c = i % 9; for (let k = 0; k < 9; k++) { if (b[r * 9 + k] === n || b[k * 9 + c] === n) return false; } const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3; for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) if (b[(br + x) * 9 + bc + y] === n) return false; return true; };
  const solve = (b) => { const i = b.indexOf(0); if (i < 0) return true; for (let n = 1; n <= 9; n++) if (ok(b, i, n)) { b[i] = n; if (solve(b)) return true; b[i] = 0; } return false; };
  const count = (b, lim = 2) => { const i = b.indexOf(0); if (i < 0) return 1; let total = 0; for (let n = 1; n <= 9; n++) if (ok(b, i, n)) { b[i] = n; total += count(b, lim); b[i] = 0; if (total >= lim) break; } return total; };
  const gen = () => {
    const b = Array(81).fill(0); const fill = (p) => { if (p === 81) return true; const nums = L.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]); for (const n of nums) if (ok(b, p, n)) { b[p] = n; if (fill(p + 1)) return true; b[p] = 0; } return false; }; fill(0);
    solution = [...b]; puzzle = [...b];
    const order = L.shuffle(Array.from({ length: 81 }, (_, i) => i)); let removed = 0;
    for (const i of order) { if (removed >= Number(lv.value)) break; const save = puzzle[i]; puzzle[i] = 0; if (count([...puzzle], 2) !== 1) puzzle[i] = save; else removed++; }
    board = [...puzzle]; fixed = new Set(puzzle.map((x, i) => x ? i : -1).filter((i) => i >= 0)); sel = -1;
    clearInterval(tick); t0 = Date.now(); tick = setInterval(() => { stat.textContent = `用时 ${Math.floor((Date.now() - t0) / 1000)} 秒　·　已填 ${board.filter((x, i) => x && !fixed.has(i)).length} 格`; }, 500);
    draw();
  };
  const draw = () => { grid.innerHTML = board.map((n, i) => { const r = Math.floor(i / 9), c = i % 9, bx = Math.floor(c / 3) + Math.floor(r / 3) * 3; const border = c % 3 === 2 && c !== 8 ? 'border-right:2px solid #8a8073;' : ''; const bb = r % 3 === 2 && r !== 8 ? 'border-bottom:2px solid #8a8073;' : ''; return `<button type="button" data-sd="${i}" style="aspect-ratio:1;background:${sel === i ? '#e8d5c4' : fixed.has(i) ? '#f7f3ea' : '#fff'};border:1px solid #ddd6cc;${border}${bb}font-size:18px;font-weight:${fixed.has(i) ? 700 : 400};color:${fixed.has(i) ? '#2f2b26' : '#b4552d'}">${n || ''}</button>`; }).join(''); };
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-sd]'); if (!b) return; sel = Number(b.dataset.sd); draw(); });
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-sdnum]'); if (!b || sel < 0 || fixed.has(sel)) return; const n = Number(b.dataset.sdnum); board[sel] = n; draw(); });
  root.querySelector('#sd-new').onclick = gen; lv.onchange = gen;
  root.querySelector('#sd-hint').onclick = () => { const empties = board.map((x, i) => x ? -1 : i).filter((i) => i >= 0); if (!empties.length) return; const i = empties[0], n = solution[i], r = Math.floor(i / 9) + 1, c = i % 9 + 1; const cand = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => ok(board, i, x)); board[i] = n; sel = i; draw(); stat.textContent = `第 ${r} 行 ${c} 列：这一格候选只有 ${cand.join('、')}，所以填 ${n}`; };
  root.querySelector('#sd-check').onclick = () => { const bad = board.map((x, i) => x && x !== solution[i] ? i : -1).filter((i) => i >= 0); stat.textContent = bad.length ? `有 ${bad.length} 格填错了（已标红）` : board.includes(0) ? '目前填的都对，继续' : '🎉 全部正确！'; if (bad.length) { bad.forEach((i) => { const el = grid.querySelector(`[data-sd="${i}"]`); if (el) el.style.background = '#f2c9bd'; }); } };
  K.setAction('新题', gen); gen();
} };

/* ---------- 数独求解器 ---------- */
S['sudoku-solver'] = { kind: 'form', titleIn: '题面', titleOut: '解答', wide: true,
  fields: [{ id: 'src', label: '9 行，每行 9 个字符（空格/0 = 空）', type: 'textarea', rows: 9, default: '530070000\n600195000\n098000060\n800060003\n400803001\n700020006\n060000280\n000419005\n000080079' }],
  primary: '复制解答', hintOut: '回溯求解，并判定唯一解 / 多解 / 无解。逐步推理给的是「唯一候选 / 唯一位置」两类可解释的理由，不是穷举过程回放。',
  compute: (v) => {
    const rows = L.nonEmptyLines(v.src).slice(0, 9);
    if (rows.length !== 9) return { error: '要正好 9 行' };
    const b = [];
    for (const r of rows) { const cells = Array.from(r.replace(/\s/g, '')).slice(0, 9); if (cells.length !== 9) return { error: '每行要 9 个字符' }; cells.forEach((c) => b.push(/[1-9]/.test(c) ? Number(c) : 0)); }
    const ok = (arr, i, n) => { const r = Math.floor(i / 9), c = i % 9; for (let k = 0; k < 9; k++) if (arr[r * 9 + k] === n || arr[k * 9 + c] === n) return false; const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3; for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) if (arr[(br + x) * 9 + bc + y] === n) return false; return true; };
    let sols = [], steps = [];
    const solve = (arr) => { if (sols.length >= 2) return; const i = arr.indexOf(0); if (i < 0) { sols.push([...arr]); return; } for (let n = 1; n <= 9; n++) if (ok(arr, i, n)) { arr[i] = n; solve(arr); arr[i] = 0; } };
    solve([...b]);
    if (!sols.length) return { error: '无解：检查题面有没有冲突' };
    const s = sols[0], blanks = b.filter((x) => !x).length;
    const explain = [];
    for (let i = 0; i < 81 && explain.length < 6; i++) { if (b[i]) continue; const cand = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => ok(b, i, n)); if (cand.length === 1) explain.push(`第 ${Math.floor(i / 9) + 1} 行 ${i % 9 + 1} 列：唯一候选 ${cand[0]}`); }
    const grid = (arr) => Array.from({ length: 9 }, (_, r) => arr.slice(r * 9, r * 9 + 9).join(' ')).join('\n');
    const text = [`判定：${sols.length >= 2 ? '多解（至少 2 个，题目不唯一）' : '唯一解'}`, `空格 ${blanks} 个，难度粗估 ${blanks < 30 ? '简单' : blanks < 45 ? '中等' : blanks < 55 ? '困难' : '专家'}`, '', '可解释的推理（唯一候选，前 6 条）：', ...(explain.length ? explain : ['（没有单格唯一候选，需要更深的区块排除/试探）']), '', '解答：', grid(s)].join('\n');
    return { text, copy: grid(s), stats: [{ label: '解的个数', value: sols.length >= 2 ? '多解' : '唯一解' }, { label: '空格', value: blanks + ' 格' }],
      preview: `<p class="t-hint">解答（3×3 宫用粗线分隔）</p><div style="display:grid;grid-template-columns:repeat(9,1fr);gap:1px;background:#8a8073;border:2px solid #8a8073;max-width:360px">${s.map((n, i) => `<div style="aspect-ratio:1;background:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;${i % 9 === 2 && i % 9 !== 8 ? 'border-right:2px solid #8a8073;' : ''}${Math.floor(i / 9) % 3 === 2 && Math.floor(i / 9) !== 8 ? 'border-bottom:2px solid #8a8073;' : ''}">${n}</div>`).join('')}</div>` };
  } };

/* ---------- 猩猩测试 ---------- */
S['chimp-test'] = { kind: 'custom', render: (root, K) => {
  const api = gamePanel(root, { title: '猩猩测试（Chimp Test）', hint: '点 1 后方块全遮，凭记忆按序点', html: '<div id="ch-grid" style="display:grid;gap:6px;max-width:420px;margin:0 auto"></div>', actionLabel: '开始 / 下一关',
    onAction: (a) => { next(a); } });
  let level = 4, seq = [], target = 1, showing = true, misses = 0;
  const next = (a) => {
    seq = L.shuffle(Array.from({ length: level }, (_, i) => i + 1));
    const cols = Math.ceil(Math.sqrt(level * 1.4));
    a.stage.querySelector('#ch-grid').style.gridTemplateColumns = `repeat(${cols},1fr)`;
    a.stage.querySelector('#ch-grid').innerHTML = seq.map((n) => `<button type="button" class="t-btn" data-ch="${n}" style="height:56px;font-size:20px">${n}</button>`).join('');
    showing = true; target = 1; a.label('记一下…'); a.say(`第 ${level - 3} 关：记住 1~${level} 的位置`);
    setTimeout(() => { a.stage.querySelectorAll('[data-ch]').forEach((b) => { b.textContent = '■'; b.style.background = '#b4552d'; }); showing = false; a.say('现在按 1 → ' + level + ' 的顺序点'); a.label('重来'); }, 1800 + level * 120);
  };
  api.stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ch]'); if (!b || showing) return;
    const n = Number(b.dataset.ch);
    if (n === target) { b.style.background = '#7d9a76'; b.style.color = '#fff'; target++; if (target > level) { level++; misses = 0; api.setStats([{ label: '当前关卡', value: level - 3 }, { label: '方块数', value: level }]); api.say('✓ 过关！下一关方块更多'); api.label('下一关'); } }
    else { misses++; b.style.background = '#a35d5d'; api.say(`点错了，应该点 ${target}。失误 ${misses} 次，点「开始 / 下一关」重试这一关`); }
  });
  api.setStats([{ label: '起始', value: '4 个' }]);
} };

/* ---------- 视觉记忆 ---------- */
S['visual-memory'] = { kind: 'custom', render: (root, K) => {
  const api = gamePanel(root, { title: '视觉记忆', hint: '白块闪现后凭记忆点出来', html: '<div id="vm-grid" style="display:grid;gap:4px;max-width:420px;margin:0 auto"></div>', actionLabel: '开始 / 下一关', onAction: (a) => { next(a); } });
  let level = 3, targets = new Set(), picked = new Set(), lives = 3, showing = true;
  const next = (a) => {
    const side = Math.min(8, 2 + Math.floor(level / 2)), total = side * side, cnt = level;
    const cells = L.shuffle(Array.from({ length: total }, (_, i) => i)).slice(0, cnt);
    targets = new Set(cells); picked = new Set(); showing = true;
    const g = a.stage.querySelector('#vm-grid'); g.style.gridTemplateColumns = `repeat(${side},1fr)`;
    g.innerHTML = Array.from({ length: total }, (_, i) => `<button type="button" class="t-btn" data-vm="${i}" style="aspect-ratio:1;background:${targets.has(i) ? '#fff' : '#ddd6cc'}"></button>`).join('');
    a.say(`第 ${level - 2} 关：记住 ${cnt} 个白块`); a.label('记一下…');
    setTimeout(() => { a.stage.querySelectorAll('[data-vm]').forEach((b) => { b.style.background = '#ddd6cc'; }); showing = false; a.say('把刚才的白块点出来'); a.label('重来'); }, 1000);
  };
  api.stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vm]'); if (!b || showing) return;
    const i = Number(b.dataset.vm); if (picked.has(i)) return;
    picked.add(i);
    if (targets.has(i)) { b.style.background = '#7d9a76'; if ([...targets].every((t) => picked.has(t))) { level++; api.setStats([{ label: '关卡', value: level - 2 }, { label: '剩余机会', value: lives }]); api.say('✓ 全对，下一关多一个白块'); api.label('下一关'); } }
    else { b.style.background = '#a35d5d'; lives--; api.setStats([{ label: '关卡', value: level - 2 }, { label: '剩余机会', value: lives }]); if (lives <= 0) { api.say('三条命用完了，点「开始 / 下一关」从头再来'); level = 3; lives = 3; } else api.say(`点错了，还剩 ${lives} 次机会`); }
  });
  api.setStats([{ label: '起始', value: '3 个' }]);
} };

/* ---------- 数字记忆 ---------- */
S['number-memory'] = { kind: 'custom', render: (root, K) => {
  const api = gamePanel(root, { title: '数字记忆', hint: '记住数字，位数逐关增加', html: '<div id="nm-show" style="font-size:52px;font-weight:700;text-align:center;letter-spacing:6px;min-height:70px"></div><input class="t-input" id="nm-in" placeholder="把数字打在这里，回车提交" style="font-size:22px;text-align:center;margin-top:10px" disabled>', actionLabel: '开始 / 下一关', onAction: (a) => { next(a); } });
  let level = 1, cur = '', lives = 3;
  const next = (a) => {
    cur = Array.from({ length: level }, () => L.randInt(0, 9)).join('');
    const show = a.stage.querySelector('#nm-show'), inp = a.stage.querySelector('#nm-in');
    show.textContent = cur; inp.value = ''; inp.disabled = true; a.say(`第 ${level} 关：记住这 ${level} 位数`); a.label('记一下…');
    setTimeout(() => { show.textContent = '•'.repeat(level); inp.disabled = false; inp.focus(); a.say('把刚才的数字打出来，回车提交'); a.label('重来'); }, 1000 + level * 500);
  };
  api.stage.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.id !== 'nm-in') return;
    const inp = e.target, val = inp.value.trim(); if (!val) return;
    if (val === cur) { level++; lives = 3; api.setStats([{ label: '关卡', value: level }, { label: '位数', value: level }]); api.say('✓ 对了，下一位数更长'); api.label('下一关'); }
    else { lives--; api.say(`错了，刚才其实是 ${cur}。剩余 ${lives} 次机会`); if (lives <= 0) { level = 1; lives = 3; } }
  });
  api.setStats([{ label: '起始', value: '1 位' }]);
} };

/* ---------- 语言记忆 ---------- */
S['verbal-memory'] = { kind: 'custom', render: (root, K) => {
  const WORDS = '苹果 天空 河水 书本 灯火 山海 春风 石头 云朵 星辰 道路 窗台 咖啡 纸张 铃铛 羽毛 森林 沙漏 雨伞 镜子 钥匙 桥梁 麦田 铅笔 钟声 岛屿 棉花 帆船 陶罐 井水 松树 棋盘 信封 蜡烛 溪流 城墙 甘草 铜锁 竹帘 渔网'.split(' ');
  const api = gamePanel(root, { title: '语言记忆', hint: '判断这个词这局里见过没有', html: '<div id="vb-w" style="font-size:38px;font-weight:700;text-align:center;min-height:60px">准备</div><div style="display:flex;gap:10px;justify-content:center;margin-top:14px"><button type="button" class="t-btn primary" data-vb="seen">见过</button><button type="button" class="t-btn" data-vb="new">没见过</button></div>', actionLabel: '开始一局', onAction: (a) => { start(a); } });
  let seen = new Set(), pool = [], cur = '', curWasOld = false, lives = 3, score = 0;
  const start = (a) => { seen = new Set(); pool = L.shuffle(WORDS); lives = 3; score = 0; curWasOld = false; pick(a); a.setStats([{ label: '得分', value: 0 }, { label: '生命', value: 3 }]); };
  const pick = (a) => {
    const isOld = seen.size > 0 && Math.random() < 0.5;
    curWasOld = isOld;
    cur = isOld ? L.pick([...seen]) : (pool.find((w) => !seen.has(w)) || L.pick(WORDS));
    if (!isOld) seen.add(cur);
    a.stage.querySelector('#vb-w').textContent = cur;
    a.say(`这局已经出现过 ${seen.size} 个词`);
  };
  api.stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vb]'); if (!b || !cur) return;
    const answerOld = b.dataset.vb === 'seen', correct = answerOld === curWasOld;
    if (correct) { score++; api.say('✓ 对了'); } else { lives--; api.say(`✗ 错了，这个词${curWasOld ? '之前出现过' : '是新的'}。剩余 ${lives} 条命`); }
    api.setStats([{ label: '得分', value: score }, { label: '生命', value: lives }]);
    if (lives <= 0) { api.say(`本局结束，得分 ${score}。点「开始一局」重来`); cur = ''; api.stage.querySelector('#vb-w').textContent = '—'; }
    else pick(api);
  });
  api.setStats([{ label: '提示', value: '3 条命' }]);
} };

/* ---------- 符号搜索 ---------- */
S['symbol-search'] = { kind: 'custom', render: (root, K) => {
  const SYM = ['◆', '●', '▲', '■', '★', '✚', '◇', '○', '△', '□', '✦', '⬟', '⬢', '✱', '◈'];
  const api = gamePanel(root, { title: '符号搜索', hint: '左边两个目标，右边五个里有没有出现？（→ 有 / ← 没有）', html: '<div id="ss-row" style="display:flex;gap:20px;justify-content:center;align-items:center;font-size:34px;min-height:80px"></div><div style="display:flex;gap:10px;justify-content:center;margin-top:10px"><button type="button" class="t-btn primary" data-ss="yes">→ 有</button><button type="button" class="t-btn" data-ss="no">← 没有</button></div>', actionLabel: '开始 / 下一题', onAction: (a) => { next(a); } });
  let cur = null, n = 0, right = 0;
  const next = (a) => {
    const tg = L.shuffle(SYM).slice(0, 2), has = Math.random() < 0.6;
    const five = L.shuffle(SYM.filter((s) => !tg.includes(s))).slice(0, 5);
    if (has) five[L.randInt(0, 4)] = L.pick(tg);
    cur = { has: five.some((s) => tg.includes(s)) };
    a.stage.querySelector('#ss-row').innerHTML = `<div style="padding:10px 16px;background:#f3eee6;border-radius:8px">${tg.join(' ')}</div><div style="opacity:.4">｜</div><div style="padding:10px 16px;background:#f3eee6;border-radius:8px">${five.join(' ')}</div>`;
    a.say(`第 ${n + 1} 题：左边两个符号，有没有在右边出现？`); a.label('重出一道');
  };
  api.stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ss]'); if (!b || !cur) return;
    n++; const correct = (b.dataset.ss === 'yes') === cur.has; if (correct) right++;
    api.setStats([{ label: '已答', value: n + ' 题' }, { label: '正确率', value: L.round(right / n * 100, 0) + '%' }]);
    api.say(correct ? '✓ 对了' : `✗ 错了，答案是有`); next(api);
  });
  api.setStats([{ label: '提示', value: '键盘 → / ← 也行' }]);
} };

/* ---------- 手眼协调 ---------- */
S['hand-eye'] = { kind: 'custom', render: (root, K) => {
  const api = gamePanel(root, { title: '手眼协调', hint: '先点停水平球，再点停垂直球，交点到圈里得分', html: '<div id="he-stage" style="position:relative;width:300px;height:300px;margin:0 auto;background:#f7f3ea;border-radius:8px;overflow:hidden"><div id="he-h" style="position:absolute;left:0;top:50%;width:16px;height:16px;border-radius:50%;background:#b4552d;transform:translateY(-50%)"></div><div id="he-v" style="position:absolute;top:0;left:50%;width:16px;height:16px;border-radius:50%;background:#6b8fa8;transform:translateX(-50%)"></div><div id="he-target" style="position:absolute;left:50%;top:50%;width:60px;height:60px;border:2px dashed #7d9a76;border-radius:50%;transform:translate(-50%,-50%)"></div><div id="he-dot" style="position:absolute;width:12px;height:12px;border-radius:50%;background:#2f2b26;display:none;transform:translate(-50%,-50%)"></div></div>', actionLabel: '开始一轮', onAction: (a) => { begin(a); } });
  let phase = 0, hx = 0, vy = 0, raf = null, t = 0, score = 0, rounds = 0;
  const stage = api.stage.querySelector('#he-stage'), bh = api.stage.querySelector('#he-h'), bv = api.stage.querySelector('#he-v'), dot = api.stage.querySelector('#he-dot');
  const loop = () => { t += 0.016; hx = (Math.sin(t * 2.1) * 0.5 + 0.5) * 284; vy = (Math.sin(t * 1.7 + 1) * 0.5 + 0.5) * 284; bh.style.left = hx + 'px'; bv.style.top = vy + 'px'; raf = requestAnimationFrame(loop); };
  const begin = (a) => { phase = 1; t = 0; dot.style.display = 'none'; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); a.say('先点一下停住水平方向那颗红球'); a.label('点停水平球'); };
  stage.addEventListener('click', () => {
    if (phase === 1) { cancelAnimationFrame(raf); phase = 2; api.say(`水平停在 ${L.round(hx, 0)}px。现在点一下停住垂直那颗蓝球`); api.label('点停垂直球'); raf = requestAnimationFrame(loop); return; }
    if (phase === 2) { cancelAnimationFrame(raf); phase = 0; const dx = hx + 8 - 150, dy = vy + 8 - 150, d = Math.hypot(dx, dy); const pts = d < 12 ? 100 : d < 30 ? 60 : d < 60 ? 20 : 0; score += pts; rounds++; dot.style.left = hx + 8 + 'px'; dot.style.top = vy + 8 + 'px'; dot.style.display = 'block'; api.setStats([{ label: '本轮', value: pts + ' 分' }, { label: '累计', value: score + ' 分' }, { label: '轮数', value: rounds }]); api.say(`落点离圆心 ${L.round(d, 0)}px，得 ${pts} 分。${pts >= 60 ? '不错' : '再练提前量'}`); api.label('再来一轮'); }
  });
  api.setStats([{ label: '提示', value: '练的是提前量' }]);
} };

/* ---------- 鼠标练习 ---------- */
S['mouse-trainer'] = { kind: 'custom', render: (root, K) => {
  const api = gamePanel(root, { title: '鼠标练习', hint: '点中出现的目标，看反应与精度', html: '<div id="mt-stage" style="position:relative;height:300px;background:#f7f3ea;border-radius:8px;overflow:hidden"></div>', actionLabel: '开始训练（10 个）', onAction: (a) => { begin(a); } });
  const stage = api.stage.querySelector('#mt-stage');
  let left = 0, times = [], t0 = 0, miss = 0;
  const spawn = (a) => { stage.innerHTML = ''; const d = document.createElement('button'); d.type = 'button'; d.className = 't-btn primary'; d.style.cssText = 'position:absolute;width:38px;height:38px;border-radius:50%;padding:0'; d.style.left = L.randInt(10, 360) + 'px'; d.style.top = L.randInt(10, 250) + 'px'; d.textContent = '●'; d.onclick = (e) => { e.stopPropagation(); times.push(Date.now() - t0); t0 = Date.now(); left--; if (left > 0) spawn(a); else finish(a); }; stage.appendChild(d); };
  const finish = (a) => { stage.innerHTML = ''; const avg = times.reduce((x, y) => x + y, 0) / Math.max(1, times.length); api.setStats([{ label: '平均反应', value: L.round(avg, 0) + ' ms' }, { label: '最快', value: Math.min(...times, 9999) + ' ms' }, { label: '误点', value: miss + ' 次' }]); api.say(`完成 ${times.length} 个目标，平均 ${L.round(avg, 0)} ms`); api.label('再来一轮'); };
  const begin = (a) => { left = 10; times = []; miss = 0; t0 = Date.now(); a.say('点掉出现的圆点，10 个一轮'); a.label('重新开始'); spawn(a); };
  stage.addEventListener('click', () => { if (left > 0) { miss++; api.say(`点空了，误点 ${miss} 次`); } });
  api.setStats([{ label: '目标', value: '10 个' }]);
} };

/* ---------- 键盘指法 ---------- */
S['keyboard-trainer'] = { kind: 'custom', render: (root, K) => {
  const LINES = ['asdf jkl;', 'asdfghjkl;', 'the quick brown fox', '工具箱里有很多好用的小工具', 'practice makes progress'];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>键盘指法</h2><span class="hint">基准键 → 文章 · 实时 WPM</span></div>
    <div class="t-row"><select class="t-select" id="kt-lv"><option value="0">基准键</option><option value="1">全字母</option><option value="2">英文短句</option><option value="3">中文短句</option><option value="4">长句</option></select><button type="button" class="t-btn primary" id="kt-new">换一句</button><span class="t-hint" id="kt-stat"></span></div>
    <div id="kt-target" style="font-size:24px;letter-spacing:3px;line-height:2;background:#f7f3ea;padding:14px;border-radius:8px;margin:14px 0;min-height:70px"></div>
    <input class="t-input" id="kt-in" placeholder="点这里开始，跟着上面打" style="font-size:18px;letter-spacing:2px">
    <div class="t-hint" style="margin-top:10px">左手 asdf、右手 jkl; 是基准键位。中文短句用拼音输入时会受输入法影响，主要练节奏。</div>
  </section></div>`;
  const target = root.querySelector('#kt-target'), inp = root.querySelector('#kt-in'), stat = root.querySelector('#kt-stat'), lv = root.querySelector('#kt-lv');
  let text = '', t0 = 0, done = false;
  const next = () => { text = LINES[Number(lv.value)]; inp.value = ''; inp.focus(); t0 = 0; done = false; draw(); stat.textContent = '准备好就开始打'; };
  const draw = () => { const typed = Array.from(inp.value), src = Array.from(text); target.innerHTML = src.map((c, i) => `<span style="color:${i < typed.length ? (typed[i] === c ? '#4b7a4b' : '#a35d5d') : '#2f2b26'};${i === typed.length ? 'text-decoration:underline' : ''}">${L.esc(c === ' ' ? '·' : c)}</span>`).join(''); };
  inp.addEventListener('input', () => { if (done) return; if (!t0) t0 = Date.now(); draw(); const typed = inp.value; if (typed === text) { done = true; const sec = (Date.now() - t0) / 1000, wpm = (Array.from(text).join('').replace(/\s/g, '').length / 5) / sec * 60; stat.textContent = `✓ 完成：${L.round(sec, 1)} 秒 · 约 ${L.round(wpm, 0)} WPM`; next_auto(); } else { const ok = Array.from(typed).filter((c, i) => c === Array.from(text)[i]).length; stat.textContent = `正确 ${ok} / ${typed.length} 字`; } });
  const next_auto = () => setTimeout(() => { if (done) next(); }, 900);
  root.querySelector('#kt-new').onclick = next; lv.onchange = next;
  K.setAction('换一句', next); next();
} };

/* ---------- 国际象棋开局（离线精简库） ---------- */
S['chess-openings'] = { kind: 'custom', render: (root, K) => {
  const OPEN = [
    ['意大利开局', '1.e4 e5 2.Nf3 Nc6 3.Bc4', '快速出象瞄 f7，最经典的入门开局'],
    ['西班牙开局（鲁伊·洛佩兹）', '1.e4 e5 2.Nf3 Nc6 3.Bb5', '给 e5 施压，长期局面博弈'],
    ['西西里防御', '1.e4 c5', '不对称局面，黑方最流行的应手'],
    ['法兰西防御', '1.e4 e6 2.d4 d5', '坚固但空间小，兵链是主题'],
    ['卡罗-康防御', '1.e4 c6 2.d4 d5', '比法兰西更稳，象不被困'],
    ['后翼弃兵', '1.d4 d5 2.c4', '白方用 c 兵换中心控制'],
    ['印度防御（王翼）', '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7', '黑方侧翼出象，让出中心再反击'],
    ['英国式开局', '1.c4', '从侧翼争 d5，灵活转调'],
    ['列蒂开局', '1.Nf3 d5 2.c4', '超现代派，先出马不急着占中心'],
    ['斯堪的纳维亚防御', '1.e4 d5', '黑方立刻挑战中心， queen 早出'],
  ];
  const PIECES = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>国际象棋开局速查</h2><span class="hint">10 个常见开局 · 离线精简</span></div>
    <div class="t-row"><select class="t-select" id="co-sel">${OPEN.map((o, i) => `<option value="${i}">${L.esc(o[0])}</option>`).join('')}</select><button type="button" class="t-btn primary" id="co-copy">复制着法</button><button type="button" class="t-btn" id="co-guess">猜下一步</button></div>
    <div class="t-row" style="margin:14px 0;align-items:flex-start"><div id="co-board" style="display:grid;grid-template-columns:repeat(8,1fr);width:min(100%,320px);border:2px solid #8a8073"></div><div style="flex:1;min-width:200px"><div class="t-hint">着法</div><div id="co-moves" style="font-size:17px;line-height:1.9;margin-top:6px"></div><div class="t-hint" id="co-note" style="margin-top:12px"></div></div></div>
    <div class="t-hint" id="co-quiz"></div>
    <p class="t-hint">内置 10 个常见开局与简要思路，做「猜下一步」练习。棋盘是按着法里的目标格<b>近似推断</b>棋子归位（没有做完整的合法走子与吃子判定），不是逐步回放引擎；也不是完整开局百科。</p>
  </section></div>`;
  const board = root.querySelector('#co-board'), moves = root.querySelector('#co-moves'), note = root.querySelector('#co-note'), quiz = root.querySelector('#co-quiz'), sel = root.querySelector('#co-sel');
  const init = () => { const b = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { let p = ''; if (r === 0) p = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'][c]; if (r === 1) p = 'P'; if (r === 6) p = 'p'; if (r === 7) p = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'][c]; b.push(p); } return b; };
  const sq = (s) => { if (!s || s.length < 2) return -1; const c = s.charCodeAt(0) - 97, r = 8 - Number(s[1]); return r * 8 + c; };
  const apply = (b, mv) => { const tokens = mv.replace(/\d+\./g, ' ').trim().split(/\s+/).filter(Boolean); tokens.forEach((t) => { const to = (t.match(/[a-h][1-8]/) || [])[0]; if (!to) return; const i = sq(to); if (i < 0) return; const piece = t[0]; let from = -1; const isWhite = piece === piece.toUpperCase(); const target = isWhite ? piece : piece.toUpperCase(); for (let j = 0; j < 64; j++) if (b[j] === target) { const fc = j % 8, fr = Math.floor(j / 8), tc = i % 8, tr = Math.floor(i / 8); if (piece === 'N' || piece === 'n') { if (Math.abs(fc - tc) + Math.abs(fr - tr) === 3 && fc !== tc && fr !== tr) { from = j; break; } } else if (fc === tc || fr === tr || Math.abs(fc - tc) === Math.abs(fr - tr)) { from = j; break; } } if (from >= 0) { b[i] = b[from]; b[from] = ''; } }); return b; };
  const show = () => { const o = OPEN[Number(sel.value)], b = apply(init(), o[1]); board.innerHTML = b.map((p, i) => { const r = Math.floor(i / 8), c = i % 8; return `<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:22px;background:${(r + c) % 2 ? '#b8a888' : '#f0e6d2'}">${PIECES[p] || ''}</div>`; }).join(''); moves.textContent = o[1]; note.textContent = o[2]; quiz.textContent = ''; };
  sel.onchange = show;
  root.querySelector('#co-copy').onclick = () => K.copy(OPEN[Number(sel.value)][1]);
  root.querySelector('#co-guess').onclick = () => { const o = OPEN[Number(sel.value)], toks = o[1].replace(/\d+\./g, ' ').trim().split(/\s+/).filter(Boolean); if (toks.length < 2) return; const hidden = toks[toks.length - 1], shown = toks.slice(0, -1).join(' '); quiz.innerHTML = `<b>局面：</b>${L.esc(shown)} … 白/黑接下来走的是？<br><button type="button" class="t-btn" id="co-reveal" style="margin-top:8px">看答案</button>`; quiz.querySelector('#co-reveal').onclick = () => { quiz.innerHTML += `<div style="margin-top:8px;color:#b4552d;font-weight:700">答案：${L.esc(hidden)}</div>`; }; };
  K.setAction('换个开局', () => { sel.value = String((Number(sel.value) + 1) % OPEN.length); show(); });
  show();
} };

/* ---------- 魔方教程（2D 展开图 + CFOP 公式，非 3D 引擎） ---------- */
S['rubik-tutorial'] = { kind: 'custom', render: (root, K) => {
  const ALG = [
    ['底层十字', 'F R U R\' U\' F\'', '先做白色小花，再对齐中心翻下去'],
    ['F2L 第一组', 'U R U\' R\'', '把角块和棱块配对一起塞进槽'],
    ['OLL 点→十字', 'F R U R\' U\' F\'', '顶面只求同色，不管侧面'],
    ['OLL 小鱼', 'R U R\' U R U2 R\'', '经典 Sune，识别鱼头朝向'],
    ['PLL 三棱换(Ua)', 'R U\' R U R U R U\' R\' U\' R2', '顶层棱块循环'],
    ['PLL 三角换(Aa)', 'x R\' U R\' D2 R U\' R\' D2 R2', '顶角循环，x 是整体转体'],
    ['T-perm', 'R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\'', '换两角两棱，最常用的 PLL 之一'],
  ];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>魔方 CFOP 公式速查</h2><span class="hint">2D 六面展开图 · 非 3D 引擎</span></div>
    <div class="t-hint" style="padding:10px;background:#f6efe3;border-radius:8px;margin-bottom:10px">这里给的是<b>公式速查与六面展开图演示</b>，不是 3D 魔方模拟器：没有逐块物理旋转与任意打乱求解。符号 U/D/L/R/F/B 是面转，带 <code>'</code> 是逆时针、带 2 是转两次，x/y/z 是整体转体。</div>
    <div class="t-row"><select class="t-select" id="rb-alg">${ALG.map((a, i) => `<option value="${i}">${L.esc(a[0])}</option>`).join('')}</select><button type="button" class="t-btn primary" id="rb-play">▶ 播放公式</button><button type="button" class="t-btn" id="rb-copy">复制公式</button><button type="button" class="t-btn" id="rb-reset">复位六面</button></div>
    <div id="rb-net" style="display:grid;grid-template-columns:repeat(4,60px);grid-template-rows:repeat(3,60px);gap:3px;justify-content:center;margin:16px 0"></div>
    <div class="t-hint" id="rb-info" style="text-align:center"></div>
    <p class="t-hint">展开图按「上 / 左前右后 / 下」排布，播放公式时会依次高亮当前转动的面，帮你把符号和空间对应起来。想真练手请用实体魔方或 3D 模拟器。</p>
  </section></div>`;
  const net = root.querySelector('#rb-net'), info = root.querySelector('#rb-info'), sel = root.querySelector('#rb-alg');
  const C = ['#b4552d', '#f5efe4', '#7d9a76', '#e8c34a', '#6b8fa8', '#e88a3c'];
  const CELL = { U: { r: 0, c: 1 }, L: { r: 1, c: 0 }, F: { r: 1, c: 1 }, R: { r: 1, c: 2 }, B: { r: 1, c: 3 }, D: { r: 2, c: 1 } };
  let colors = Array.from({ length: 6 }, (_, i) => Array(9).fill(i));
  const draw = (hi) => { net.innerHTML = ''; Object.entries(CELL).forEach(([face, pos]) => { const d = document.createElement('div'); d.style.cssText = `grid-row:${pos.r + 1};grid-column:${pos.c + 1};display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#2f2b26;border-radius:3px;padding:2px;${hi === face ? 'outline:3px solid #b4552d' : ''}`; d.innerHTML = colors[Object.keys(CELL).indexOf(face)].map((x) => `<div style="background:${C[x]};border-radius:2px"></div>`).join(''); d.title = face + ' 面'; net.appendChild(d); }); };
  const rotate = (face) => { const i = Object.keys(CELL).indexOf(face); if (i >= 0) { const a = colors[i]; colors[i] = [a[6], a[3], a[0], a[7], a[4], a[1], a[8], a[5], a[2]]; } };
  sel.onchange = () => { info.textContent = ALG[Number(sel.value)][2]; };
  root.querySelector('#rb-copy').onclick = () => K.copy(ALG[Number(sel.value)][1]);
  root.querySelector('#rb-reset').onclick = () => { colors = Array.from({ length: 6 }, (_, i) => Array(9).fill(i)); draw(); info.textContent = '六面已复位'; };
  root.querySelector('#rb-play').onclick = async () => { const toks = ALG[Number(sel.value)][1].replace(/[xyz2']/g, '').split(/\s+/).filter(Boolean); for (const t of toks) { const f = t[0]; rotate(f); draw(f); info.textContent = `正在转 ${t} 面`; await new Promise((r) => setTimeout(r, 420)); } draw(); info.textContent = '公式播放完毕：' + ALG[Number(sel.value)][2]; };
  K.setAction('▶ 播放公式', () => root.querySelector('#rb-play').click());
  draw(); info.textContent = ALG[0][2];
} };
