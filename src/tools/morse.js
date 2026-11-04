import { formTool } from '/kit.js';
const MAP = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.', '-': '-....-', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};
const REV = Object.fromEntries(Object.entries(MAP).map(([k, v]) => [v, k]));
export default formTool({
  fields: [
    { id: 'mode', label: '方向', type: 'chips', options: ['编码', '解码'], default: '编码' },
    { id: 'text', label: '内容', type: 'textarea', rows: 6, placeholder: '编码时输入英文/数字；解码时用空格分隔码元、/ 分隔单词' },
  ],
  titleIn: '文本', titleOut: '摩斯电码', primary: '复制结果',
  sample: { mode: '编码', text: 'SOS HELP' },
  actions: [{ label: '试听', run(v, ctx) {
    const code = ctx.$('[data-out]', ctx.root).textContent.trim();
    if (!code) { ctx.toast('先输入内容'); return; }
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const unit = 0.09; let t = ac.currentTime + 0.05;
      const beep = (dur) => { const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 620; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur + 0.01); t += dur + unit; };
      for (const ch of code.slice(0, 160)) { if (ch === '.') beep(unit); else if (ch === '-') beep(unit * 3); else if (ch === ' ') t += unit * 2; else if (ch === '/') t += unit * 4; }
      setTimeout(() => ac.close(), (t - ac.currentTime + 1) * 1000);
      ctx.toast('播放中');
    } catch (e) { ctx.toast('这个浏览器不支持音频播放'); }
  } }],
  compute(v) {
    const s = String(v.text || '').trim();
    if (!s) return { text: '', copy: '' };
    if (v.mode === '编码') {
      const unknown = [];
      const out = s.toUpperCase().split(/\s+/).map((word) => [...word].map((c) => {
        if (MAP[c]) return MAP[c];
        if (!unknown.includes(c)) unknown.push(c);
        return '';
      }).filter(Boolean).join(' ')).join(' / ');
      return { text: out, copy: out,
        error: unknown.length ? `这些字符没有对应码元，已跳过：${unknown.join(' ')}（摩斯主要支持字母、数字和常用标点）` : '' };
    }
    const out = s.split(/\s*\/\s*/).map((word) => word.trim().split(/\s+/).map((c) => REV[c] || '?').join('')).join(' ');
    return { text: out, copy: out, error: out.includes('?') ? '有码元没认出来，检查是否用空格分隔、/ 分隔单词。' : '' };
  },
});
