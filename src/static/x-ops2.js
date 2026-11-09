/* 第二批工具的编码、随机与颜色算子。全部用浏览器原生能力实现，不引外部库。 */
import { esc, clean, lines, outTable, L } from '/x-core.js';

const sel = (id, label, options, def) => ({ id, label, type: 'select', options, default: def ?? options[0] });
const num = (id, label, def, unit = '') => ({ id, label, unit, type: 'number', default: def, step: 'any' });
const txt = (id, label, ph, def = '') => ({ id, label, type: 'text', default: def, placeholder: ph });
const area = (id, label, ph, def = '', rows = 5) => ({ id, label, type: 'textarea', rows, default: def, placeholder: ph });
const chk = (id, label, def = false) => ({ id, label, type: 'checkbox', default: def });
const ok = (text, extra = {}) => ({ text, copy: text, stats: [{ label: '字符数', value: String(String(text).length) }], ...extra });
const enc = new TextEncoder(), dec = new TextDecoder();
const hex = (b) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
const unhex = (s) => { const t = String(s).replace(/[^0-9a-fA-F]/g, ''); if (t.length % 2) throw new Error('十六进制长度必须为偶数'); return Uint8Array.from(t.match(/.{2}/g), (x) => parseInt(x, 16)); };
const b64 = (b) => L.bytesToB64(b);
const unb64 = (s) => L.b64ToBytes(String(s).trim());
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

/* ---------- 编码 / 校验 ---------- */
export const CODEC = {
  binary: {
    dirs: ['文本转二进制', '二进制转文本'], placeholder: '中文也按 UTF-8 处理', sample: { src: 'Hi 一页' },
    run: (v) => {
      if (v.dir.startsWith('文本')) {
        const b = enc.encode(String(v.src));
        return ok(Array.from(b, (x) => x.toString(2).padStart(8, '0')).join(' '), { stats: [{ label: '字节数', value: String(b.length) }] });
      }
      const bits = String(v.src).replace(/[^01]/g, '');
      if (!bits.length || bits.length % 8) return { error: '0/1 的位数必须是 8 的倍数' };
      const b = Uint8Array.from(bits.match(/.{8}/g), (x) => parseInt(x, 2));
      return ok(dec.decode(b), { stats: [{ label: '字节数', value: String(b.length) }] });
    },
  },
  asciicode: {
    dirs: ['文本转 ASCII 码', 'ASCII 码转文本'], placeholder: '中文按 Unicode 码点输出', sample: { src: 'Hello' },
    fields: () => [txt('sep', '分隔符', '默认空格', ' ')],
    run: (v) => {
      const sep = v.sep || ' ';
      if (v.dir.startsWith('文本')) return ok([...String(v.src)].map((c) => c.codePointAt(0)).join(sep));
      const a = String(v.src).split(/[\s,，、]+/).filter(Boolean).map(Number);
      if (a.some((x) => !Number.isInteger(x) || x < 0 || x > 0x10ffff)) return { error: '码点需在 0 到 1114111 之间' };
      return ok(a.map((x) => String.fromCodePoint(x)).join(''));
    },
  },
  u2a: {
    dirs: ['文本转 Unicode 转义', 'Unicode 转义转文本'], placeholder: '支持 \\u4e00 与 U+4E00 写法', sample: { src: '一页工具' },
    run: (v) => {
      if (v.dir.startsWith('文本')) return ok([...String(v.src)].map((c) => {
        const n = c.codePointAt(0);
        return n > 0xffff ? `\\u${n.toString(16).padStart(6, '0')}` : `\\u${n.toString(16).padStart(4, '0')}`;
      }).join(''));
      return ok(String(v.src).replace(/\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4,6})|U\+([0-9a-f]{4,6})|&#x([0-9a-f]+);/gi,
        (m, a, b, c, d) => { const n = parseInt(a || b || c || d, 16); return n > 0x10ffff ? m : String.fromCodePoint(n); }));
    },
  },
  escape: {
    dirs: ['Escape 编码', 'Unescape 解码'], placeholder: '经典 escape / %uXXXX 编码', sample: { src: '一页工具 abc' },
    run: (v) => {
      if (v.dir.startsWith('Escape')) {
        const s = [...String(v.src)].map((c) => {
          const n = c.codePointAt(0);
          if (/^[A-Za-z0-9@*_+\-./]$/.test(c)) return c;
          return n > 255 ? `%u${n.toString(16).toUpperCase().padStart(4, '0')}` : `%${n.toString(16).toUpperCase().padStart(2, '0')}`;
        }).join('');
        return ok(s);
      }
      const s = String(v.src).replace(/%u([0-9a-f]{4})/gi, (m, x) => String.fromCharCode(parseInt(x, 16)))
        .replace(/%([0-9a-f]{2})/gi, (m, x) => String.fromCharCode(parseInt(x, 16)));
      const bytes = Uint8Array.from([...s].map((c) => c.charCodeAt(0) & 255));
      let text = s;
      try { text = dec.decode(bytes); } catch (e) {}
      return ok(text);
    },
  },
  punycode: {
    dirs: ['中文域名转 Punycode', 'Punycode 转中文'], placeholder: '例如 一页工具.cn', sample: { src: '一页工具.cn' },
    run: (v) => {
      if (v.dir.startsWith('中文')) {
        const s = clean(v.src).replace(/^https?:\/\//, '').split('/')[0];
        try {
          const u = new URL('http://' + s);
          return ok(`${u.hostname}\n\n完整域名：${u.host}`);
        } catch (e) { return { error: '不是合法域名：' + s }; }
      }
      const s = clean(v.src).replace(/^https?:\/\//, '').split('/')[0];
      try { return ok(decodeURIComponent(s.split('.').map((x) => x.startsWith('xn--') ? punyDecode(x.slice(4)) : x).join('.'))); }
      catch (e) { return { error: '解码失败：' + e.message }; }
    },
  },
  fullwidth: {
    dirs: ['半角转全角', '全角转半角'], placeholder: '英文数字与标点', sample: { src: 'Hello, 123!' },
    run: (v) => {
      const toFull = v.dir.startsWith('半角');
      return ok([...String(v.src)].map((c) => {
        const n = c.charCodeAt(0);
        if (n === 0x20) return toFull ? '\u3000' : ' ';
        if (n >= 0x21 && n <= 0x7e) return toFull ? String.fromCharCode(n + 0xfee0) : c;
        if (!toFull && n >= 0xff01 && n <= 0xff5e) return String.fromCharCode(n - 0xfee0);
        return c;
      }).join(''));
    },
  },
  utf8bytes: {
    dirs: ['文本转 UTF8 字节', 'UTF8 字节转文本'], placeholder: '输出十六进制字节', sample: { src: '一页工具' },
    fields: () => [txt('sep', '字节分隔符', '默认空格', ' ')],
    run: (v) => {
      if (v.dir.startsWith('文本')) {
        const b = enc.encode(String(v.src));
        return ok(Array.from(b, (x) => x.toString(16).toUpperCase().padStart(2, '0')).join(v.sep || ' '),
          { stats: [{ label: '字节数', value: String(b.length) }] });
      }
      const b = unhex(String(v.src));
      return ok(dec.decode(b), { stats: [{ label: '字节数', value: String(b.length) }] });
    },
  },
  gzip: {
    dirs: ['Gzip 压缩（输出 Base64）', 'Gzip 解压（输入 Base64）'], placeholder: '压缩结果用 Base64 表示，方便复制', sample: { src: '一页工具：打开就能用，文件不上传。' },
    run: async (v) => {
      if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') return { error: '当前浏览器不支持压缩流，请用较新版本的 Chrome / Edge / Safari' };
      try {
        if (v.dir.startsWith('Gzip 压缩')) {
          const cs = new CompressionStream('gzip');
          const stream = new Blob([enc.encode(String(v.src))]).stream().pipeThrough(cs);
          const buf = await new Response(stream).arrayBuffer();
          const src = enc.encode(String(v.src)).length, out = buf.byteLength;
          return ok(b64(buf), { stats: [{ label: '原始字节', value: String(src) }, { label: '压缩后', value: String(out) }, { label: '压缩率', value: (100 - out / src * 100).toFixed(1) + '%' }] });
        }
        const ds = new DecompressionStream('gzip');
        const stream = new Blob([unb64(v.src)]).stream().pipeThrough(ds);
        return ok(dec.decode(await new Response(stream).arrayBuffer()));
      } catch (e) { return { error: '处理失败：' + e.message }; }
    },
  },
  rc4: {
    dirs: ['加密', '解密'], placeholder: '加密结果用十六进制表示', sample: { src: '一页工具' },
    fields: () => [txt('key', '密钥', '必填', 'my-secret')],
    run: (v) => {
      const key = String(v.key);
      if (!key) return { error: '请填密钥' };
      const S = Array.from({ length: 256 }, (_, i) => i);
      const kb = enc.encode(key);
      let j = 0;
      for (let i = 0; i < 256; i++) { j = (j + S[i] + kb[i % kb.length]) & 255; [S[i], S[j]] = [S[j], S[i]]; }
      const data = v.dir === '加密' ? enc.encode(String(v.src)) : unhex(v.src);
      const out = new Uint8Array(data.length);
      let a = 0, b = 0;
      for (let i = 0; i < data.length; i++) {
        a = (a + 1) & 255; b = (b + S[a]) & 255;
        [S[a], S[b]] = [S[b], S[a]];
        out[i] = data[i] ^ S[(S[a] + S[b]) & 255];
      }
      return ok(v.dir === '加密' ? hex(out) : dec.decode(out));
    },
  },
  hide: {
    dirs: ['把密文藏进载体', '从载体读出密文'], placeholder: '载体文字', sample: { src: '今天天气不错，适合出去走走。' },
    fields: () => [txt('secret', '密文', '仅藏入时用', 'hello')],
    run: (v) => {
      const ZERO = ['\u200b', '\u200c'];
      if (v.dir.startsWith('把')) {
        const bits = [...enc.encode(String(v.secret))].map((x) => x.toString(2).padStart(8, '0')).join('');
        const s = [...bits].map((b) => ZERO[+b]).join('');
        const carrier = String(v.src);
        const pos = Math.min(carrier.length, Math.floor(carrier.length / 2));
        const out = carrier.slice(0, pos) + s + carrier.slice(pos);
        return ok(out, { stats: [{ label: '密文字节', value: String(enc.encode(String(v.secret)).length) }, { label: '零宽字符', value: String(bits.length) }] });
      }
      const bits = [...String(v.src)].filter((c) => ZERO.includes(c)).map((c) => ZERO.indexOf(c)).join('');
      if (bits.length < 8) return { error: '载体里没有读到零宽字符' };
      const n = Math.floor(bits.length / 8);
      const b = Uint8Array.from(Array.from({ length: n }, (_, i) => parseInt(bits.slice(i * 8, i * 8 + 8), 2)));
      return ok(dec.decode(b));
    },
  },
  emailprotect: {
    dirs: ['邮箱转字符实体', '字符实体还原'], placeholder: '邮箱地址或整段文本', sample: { src: 'hello@example.org' },
    run: (v) => v.dir.startsWith('邮箱')
      ? ok([...String(v.src)].map((c) => `&#${c.codePointAt(0)};`).join(''))
      : ok(String(v.src).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))),
  },
  jspack: {
    dirs: ['打包为字符码', '还原源码'], placeholder: 'JS 代码', sample: { src: 'console.log("hi")' },
    run: (v) => {
      if (v.dir.startsWith('打包')) {
        const codes = [...enc.encode(String(v.src))].map((x) => x).join(',');
        return ok(`eval(new TextDecoder().decode(new Uint8Array([${codes}])));`);
      }
      const m = String(v.src).match(/\[([\d,\s]+)\]/);
      if (!m) return { error: '找不到字符码数组' };
      return ok(dec.decode(Uint8Array.from(m[1].split(',').map((x) => Number(x.trim())))));
    },
  },
  crc32: {
    dirs: ['文本 CRC32', '十六进制数据 CRC32'], placeholder: '文本或十六进制字节', sample: { src: '123456789' },
    run: (v) => {
      const b = v.dir.startsWith('文本') ? enc.encode(String(v.src)) : unhex(v.src);
      const c = L.crc32(b) >>> 0;
      return ok(`CRC32：${c.toString(16).toUpperCase().padStart(8, '0')}\n十进制：${c}\n字节数：${b.length}`,
        { stats: [{ label: 'CRC32', value: c.toString(16).toUpperCase().padStart(8, '0') }] });
    },
  },
  hmac: {
    dirs: ['计算 HMAC'], placeholder: '要签名的文本', sample: { src: 'hello world' },
    fields: () => [txt('key', '密钥', '必填', 'secret'), sel('algo', '算法', ['SHA-256', 'SHA-1', 'SHA-512'])],
    run: async (v) => {
      if (!v.key) return { error: '请填密钥' };
      const algo = String(v.algo).replace('-', '-');
      const k = await crypto.subtle.importKey('raw', enc.encode(String(v.key)), { name: 'HMAC', hash: algo }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', k, enc.encode(String(v.src)));
      return ok(`HMAC-${algo}：${hex(sig)}\nBase64：${b64(sig)}`, { stats: [{ label: '摘要长度', value: String(sig.byteLength * 2) + ' 位十六进制' }] });
    },
  },
  base24: {
    dirs: ['编码', '解码'], placeholder: '用 24 个汉字做替换表', sample: { src: '一页工具' },
    run: (v) => {
      const CHARS = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏';
      if (v.dir === '编码') {
        const b = enc.encode(String(v.src));
        const s = [...b].map((x) => CHARS[x >> 4] + CHARS[x & 15]).join('');
        return ok(s);
      }
      const s = String(v.src).trim();
      if (s.length % 2) return { error: '编码长度必须是偶数' };
      const b = [];
      for (let i = 0; i < s.length; i += 2) {
        const a = CHARS.indexOf(s[i]), c = CHARS.indexOf(s[i + 1]);
        if (a < 0 || c < 0) return { error: `第 ${i + 1} 个字符不在替换表里` };
        b.push((a << 4) | c);
      }
      return ok(dec.decode(new Uint8Array(b)));
    },
  },
  htmlentity: {
    dirs: ['文本转 HTML 实体', 'HTML 实体还原'], placeholder: '文本或含实体的 HTML', sample: { src: '<div title="一页">工具</div>' },
    fields: () => [sel('mode', '转义范围', ['全部特殊字符', '仅 5 个基础字符'])],
    run: (v) => {
      if (v.dir.startsWith('文本')) {
        if (v.mode.startsWith('全部')) return ok([...String(v.src)].map((c) => /[&<>"']/.test(c) ? `&#${c.codePointAt(0)};` : c.codePointAt(0) > 127 ? `&#${c.codePointAt(0)};` : c).join(''));
        return ok(String(v.src).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
      }
      return ok(String(v.src).replace(/&#x([0-9a-f]+);/gi, (m, x) => String.fromCodePoint(parseInt(x, 16)))
        .replace(/&#(\d+);/g, (m, x) => String.fromCodePoint(Number(x)))
        .replace(/&(amp|lt|gt|quot|apos|nbsp|copy|reg);/gi, (m, x) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®' }[x.toLowerCase()])));
    },
  },
  bcc: {
    dirs: ['文本 BCC', '十六进制数据 BCC'], placeholder: '文本或十六进制字节', sample: { src: '01 03 00 00 00 01' },
    run: (v) => {
      const b = v.dir.startsWith('文本') ? enc.encode(String(v.src)) : unhex(v.src);
      let x = 0; for (const c of b) x ^= c;
      return ok(`BCC（异或校验）：${x.toString(16).toUpperCase().padStart(2, '0')}\n十进制：${x}\n字节数：${b.length}`,
        { stats: [{ label: 'BCC', value: x.toString(16).toUpperCase().padStart(2, '0') }] });
    },
  },
  lrc: {
    dirs: ['文本 LRC', '十六进制数据 LRC'], placeholder: '文本或十六进制字节', sample: { src: '01 03 00 00 00 01' },
    run: (v) => {
      const b = v.dir.startsWith('文本') ? enc.encode(String(v.src)) : unhex(v.src);
      let sum = 0; for (const c of b) sum = (sum + c) & 255;
      const x = ((-sum) & 255);
      return ok(`LRC：${x.toString(16).toUpperCase().padStart(2, '0')}\n累加和：${sum.toString(16).toUpperCase().padStart(2, '0')}\n校验：(累加和 + LRC) mod 256 = 0`,
        { stats: [{ label: 'LRC', value: x.toString(16).toUpperCase().padStart(2, '0') }] });
    },
  },
};

/* Punycode 解码（RFC 3492 的解码部分） */
function punyDecode(input) {
  const base = 36, tmin = 1, tmax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128;
  let n = initialN, i = 0, bias = initialBias, output = [];
  const basic = input.lastIndexOf('-');
  if (basic > 0) output.push(...[...input.slice(0, basic)].map((c) => c.codePointAt(0)));
  let index = basic > 0 ? basic + 1 : 0;
  const adapt = (delta, numpoints, firsttime) => {
    delta = firsttime ? Math.floor(delta / damp) : Math.floor(delta / 2);
    delta += Math.floor(delta / numpoints);
    let k = 0;
    while (delta > Math.floor(((base - tmin) * tmax) / 2)) { delta = Math.floor(delta / (base - tmin)); k += base; }
    return k + Math.floor(((base - tmin + 1) * delta) / (delta + skew));
  };
  while (index < input.length) {
    const oldi = i; let w = 1, k = base;
    for (;;) {
      if (index >= input.length) throw new Error('编码被截断');
      const c = input[index++], digit = c >= '0' && c <= '9' ? c.charCodeAt(0) - 22 : c >= 'A' && c <= 'Z' ? c.charCodeAt(0) - 65 : c >= 'a' && c <= 'z' ? c.charCodeAt(0) - 97 : base;
      if (digit >= base) throw new Error('含非法字符');
      i += digit * w;
      const t = k <= bias ? tmin : k >= bias + tmax ? tmax : k - bias;
      if (digit < t) break;
      w *= base - t; k += base;
    }
    const numpoints = output.length + 1;
    bias = adapt(i - oldi, numpoints, oldi === 0);
    n += Math.floor(i / numpoints);
    i %= numpoints;
    output.splice(i, 0, n);
    i++;
  }
  return String.fromCodePoint(...output);
}

/* ---------- 随机与生成 ---------- */
const pickN = (arr, n) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = L.randInt(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n).sort((x, y) => x - y); };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const two = (n) => String(n).padStart(2, '0');

export const RAND = {
  mac: {
    titleIn: '生成设置', fields: () => [txt('prefix', '前三个字节', '留空随机，例如 02:00:0A', ''), sel('sep', '分隔符', [':', '-', '无'])],
    sample: { n: 3 },
    run: (v) => {
      const n = Math.max(1, Math.min(200, Math.floor(Number(v.n) || 1)));
      const p = clean(v.prefix).replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 6);
      const out = [];
      for (let k = 0; k < n; k++) {
        const b = [];
        for (let i = 0; i < 6; i++) b.push(i < 3 && p.length === 6 ? p.slice(i * 2, i * 2 + 2) : L.randBytes(1)[0].toString(16).toUpperCase().padStart(2, '0'));
        if (b.length === 6 && p.length !== 6) b[0] = (parseInt(b[0], 16) & 0xfe | 0x02).toString(16).toUpperCase().padStart(2, '0');
        out.push(b.join(v.sep === '无' ? '' : v.sep));
      }
      return ok(out.join('\n'), { stats: [{ label: '生成数量', value: String(n) }] });
    },
  },
  number: {
    titleIn: '生成设置', fields: () => [num('lo', '最小值', 1), num('hi', '最大值', 100), chk('uniq', '不重复', false), sel('kind', '类型', ['整数', '两位小数'])],
    sample: { n: 5 },
    run: (v) => {
      const n = Math.max(1, Math.min(1000, Math.floor(Number(v.n) || 1)));
      const lo = Number(v.lo), hi = Number(v.hi);
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return { error: '最大值要大于最小值' };
      if (v.uniq && v.kind === '整数' && hi - lo + 1 < n) return { error: '区间内的整数不够生成这么多不重复值' };
      const out = new Set();
      let guard = 0;
      while (out.size < n && guard++ < n * 50) {
        const x = v.kind === '整数' ? L.randInt(Math.ceil(lo), Math.floor(hi)) : (lo + Math.random() * (hi - lo)).toFixed(2);
        out.add(x);
      }
      const a = [...out];
      return ok(a.join('\n'), { stats: [{ label: '生成数量', value: String(a.length) }, { label: '合计', value: String(a.reduce((x, y) => x + Number(y), 0).toFixed(2)) }] });
    },
  },
  names: {
    titleIn: '生成设置', fields: () => [sel('sex', '偏向', ['混合', '偏男性', '偏女性']), num('len', '名字字数', 2, '字')],
    sample: { n: 8 },
    run: (v) => {
      const XING = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤';
      const M = '伟强磊军洋勇艳杰娟涛明超秀霞平刚桂英建华文辉力俊峰建华宇轩浩然子墨梓睿思远宇航俊熙嘉豪', F = '芳娜秀英敏静丽娟艳燕霞玲桂英洁琳婷雪梅倩颖悦欣妍汐若曦诗涵梦瑶雨萱佳怡';
      const n = Math.max(1, Math.min(200, Math.floor(Number(v.n) || 1))), len = clamp(Math.floor(Number(v.len) || 2), 1, 2);
      const out = [];
      for (let i = 0; i < n; i++) {
        const male = v.sex === '偏男性' ? true : v.sex === '偏女性' ? false : Math.random() > 0.5;
        const pool = male ? M : F;
        let given = '';
        for (let k = 0; k < len; k++) given += L.pick([...pool]);
        out.push(L.pick([...XING]) + given);
      }
      return ok(out.join('\n'), { stats: [{ label: '生成数量', value: String(n) }] });
    },
  },
  ancientnames: {
    titleIn: '生成设置', fields: () => [sel('style', '风格', ['清雅', '侠气', '书卷'])],
    sample: { n: 8 },
    run: (v) => {
      const X = ['沈', '谢', '顾', '萧', '苏', '温', '裴', '陆', '柳', '晏', '容', '云', '慕', '江', '洛', '楚', '宋', '叶'];
      const A = { 清雅: ['清', '疏', '微', '澜', '知', '泠', '霁', '棠', '初', '晚', '砚', '汀'], 侠气: ['执', '惊', '寒', '朔', '峥', '啸', '凌', '归', '烬', '戈'], 书卷: ['砚', '墨', '简', '辞', '书', '章', '言', '徽', '卿', '儒'] };
      const B = ['舟', '白', '尘', '遥', '之', '言', '川', '庭', '鹤', '山', '月', '洲', '行', '南', '棠', '影', '竹', '然'];
      const n = Math.max(1, Math.min(200, Math.floor(Number(v.n) || 1))), a = A[v.style] || A['清雅'];
      const out = [];
      for (let i = 0; i < n; i++) out.push(L.pick(X) + L.pick(a) + (Math.random() > 0.4 ? L.pick(B) : ''));
      return ok(out.join('\n') + '\n\n字库是精简的意象用字，重名不做校验。', { stats: [{ label: '生成数量', value: String(n) }] });
    },
  },
  ssq: {
    titleIn: '机选注数', fields: () => [], sample: { n: 5 },
    run: (v) => lottery(v, '双色球', [[1, 33, 6, '红球'], [1, 16, 1, '蓝球']]),
  },
  dlt: {
    titleIn: '机选注数', fields: () => [], sample: { n: 5 },
    run: (v) => lottery(v, '大乐透', [[1, 35, 5, '前区'], [1, 12, 2, '后区']]),
  },
  qlc: {
    titleIn: '机选注数', fields: () => [], sample: { n: 5 },
    run: (v) => lottery(v, '七乐彩', [[1, 30, 7, '基本号'], [1, 30, 1, '特别号']]),
  },
  '22x5': {
    titleIn: '机选注数', fields: () => [], sample: { n: 5 },
    run: (v) => lottery(v, '22 选 5', [[1, 22, 5, '号码']]),
  },
  coin: {
    titleIn: '抛掷次数', fields: () => [], sample: { n: 10 },
    run: (v) => {
      const n = Math.max(1, Math.min(1000, Math.floor(Number(v.n) || 1)));
      let h = 0; const seq = [];
      for (let i = 0; i < n; i++) { const x = Math.random() > 0.5; if (x) h++; seq.push(x ? '正' : '反'); }
      return ok(seq.join(' ') + `\n\n正面 ${h} 次，反面 ${n - h} 次`,
        { stats: [{ label: '正面', value: String(h) }, { label: '反面', value: String(n - h) }] });
    },
  },
  dice: {
    titleIn: '投掷设置', fields: () => [num('sides', '骰子面数', 6, '面')], sample: { n: 3 },
    run: (v) => {
      const n = Math.max(1, Math.min(100, Math.floor(Number(v.n) || 1))), s = Math.max(2, Math.min(100, Math.floor(Number(v.sides) || 6)));
      const a = Array.from({ length: n }, () => L.randInt(1, s));
      return ok(`点数：${a.join(' + ')}\n合计：${a.reduce((x, y) => x + y, 0)}`,
        { stats: [{ label: '合计', value: String(a.reduce((x, y) => x + y, 0)) }, { label: '骰子数', value: String(n) }] });
    },
  },
  eat: {
    titleIn: '候选清单（一行一个）', fields: () => [area('src', '候选', '一行一个', '米饭\n面条\n火锅\n麻辣烫\n饺子\n烤肉\n寿司\n沙拉', 6)], sample: { n: 1 },
    run: (v) => choose(v, '今天吃'),
  },
  do: {
    titleIn: '候选清单（一行一个）', fields: () => [area('src', '候选', '一行一个', '出门散步\n看一集纪录片\n整理书桌\n给朋友发消息\n读二十页书\n早睡', 6)], sample: { n: 1 },
    run: (v) => choose(v, '那就'),
  },
  goupi: {
    titleIn: '生成设置', fields: () => [num('para', '段落数', 3, '段')], sample: { n: 1 },
    run: (v) => {
      const subj = ['这个问题', '从某种意义上说', '在当前语境下', '不可忽视的是', '换个角度看', '众所周知', '就整体而言', '进一步来说'];
      const verb = ['折射出', '呼应了', '构成了', '指向了', '重塑了', '重新定义了', '反映了', '延展了'];
      const obj = ['内在的逻辑张力', '一种微妙的不确定性', '系统性的自我指涉', '叙事与经验的缝隙', '被忽略的日常性', '结构与能动之间的平衡', '某种未完成的状态'];
      const tail = ['这需要我们保持开放而审慎的态度。', '答案或许并不重要，提问本身已经说明了什么。', '因此，任何简单的结论都值得再想一想。', '在这个意义上，过程比结果更接近事实。', '而这，恰恰是它有意思的地方。', '最终我们仍要回到具体的经验里去。'];
      const paras = Math.max(1, Math.min(10, Math.floor(Number(v.para) || 3)));
      const out = [];
      for (let p = 0; p < paras; p++) {
        let s = '';
        for (let i = 0; i < 5; i++) s += L.pick(subj) + L.pick(verb) + L.pick(obj) + '，';
        out.push(s + L.pick(tail));
      }
      return ok(out.join('\n\n') + '\n\n随机拼装，纯属娱乐，没有实际信息量。', { stats: [{ label: '段落数', value: String(paras) }] });
    },
  },
  caihong: {
    titleIn: '生成设置', fields: () => [], sample: { n: 5 },
    run: (v) => {
      const A = ['你', '阁下', '这位朋友', '你这个人啊'], B = ['一出现', '随口一句话', '光是坐在那里', '做事的样子', '认真起来的时候'];
      const C = ['连空气都变得有条理了', '排队的太阳都要多看你两眼', '整个房间的分辨率都提高了', '让人忍不住想把今天记下来', '连背景音乐都自动配好了'];
      const n = Math.max(1, Math.min(100, Math.floor(Number(v.n) || 1)));
      return ok(Array.from({ length: n }, () => L.pick(A) + L.pick(B) + '，' + L.pick(C) + '。').join('\n'));
    },
  },
};

function choose(v, prefix) {
  const a = lines(v.src).map((x) => x.trim()).filter(Boolean);
  if (!a.length) return { error: '候选清单是空的' };
  const n = Math.max(1, Math.min(a.length, Math.floor(Number(v.n) || 1)));
  const r = L.shuffle(a).slice(0, n);
  return ok(`${prefix}${r.join('、')}！`, { stats: [{ label: '候选数', value: String(a.length) }] });
}
function lottery(v, name, groups) {
  const n = Math.max(1, Math.min(100, Math.floor(Number(v.n) || 1)));
  const out = [];
  for (let k = 0; k < n; k++) {
    let used = new Set();
    const parts = groups.map(([a, b, cnt, label]) => {
      const pool = range(a, b).filter((x) => !used.has(x));
      const r = pickN(pool, cnt); r.forEach((x) => used.add(x));
      return label + ' ' + r.map(two).join(' ');
    });
    out.push(`第 ${two(k + 1)} 注　${parts.join('　|　')}`);
  }
  return ok(`${name} 机选 ${n} 注\n\n${out.join('\n')}\n\n随机选号，不预测开奖结果。`,
    { stats: [{ label: '注数', value: String(n) }] });
}

/* ---------- 颜色 ---------- */
const hex2rgb = (s) => {
  let t = String(s).trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(t)) t = [...t].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(t)) throw new Error('请填 6 位十六进制色值，例如 #2f5bd7');
  return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)];
};
const rgb2hex = (r, g, b) => '#' + [r, g, b].map((x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');
const rgb2hsv = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return [Math.round((h + 360) % 360), Math.round(max ? d / max * 100 : 0), Math.round(max * 100)];
};
const hsv2rgb = ([h, s, v]) => {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; v = clamp(v, 0, 100) / 100;
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return t.map((q) => Math.round((q + m) * 255));
};
const rgb2cmyk = ([r, g, b]) => {
  const R = r / 255, G = g / 255, B = b / 255, k = 1 - Math.max(R, G, B);
  if (k >= 1) return [0, 0, 0, 100];
  return [[(1 - R - k) / (1 - k) * 100], [(1 - G - k) / (1 - k) * 100], [(1 - B - k) / (1 - k) * 100], [k * 100]]
    .map((x) => Math.round(x[0]));
};
const cmyk2rgb = ([c, m, y, k]) => [c, m, y].map((x) => Math.round(255 * (1 - clamp(x, 0, 100) / 100) * (1 - clamp(k, 0, 100) / 100)));
const swatch = (color, label = '') => `<div style="width:100%;height:76px;border-radius:8px;border:1px solid #e3e8f0;background:${esc(color)};display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.55);font-size:12px">${esc(label)}</div>`;
const rgbLab = ([r, g, b]) => {
  const f = (x) => { x /= 255; return x > 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92; };
  const R = f(r), G = f(g), B = f(b);
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const g2 = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return [116 * g2(Y) - 16, 500 * (g2(X) - g2(Y)), 200 * (g2(Y) - g2(Z))];
};
const colorFields = () => [
  { id: 'a', label: '颜色 A', type: 'color', default: '#2f5bd7' },
  { id: 'b', label: '颜色 B', type: 'color', default: '#e0453b' },
];
const twoColor = (fn) => ({ fields: colorFields(), run: (v) => fn(hex2rgb(v.a), hex2rgb(v.b), v.a, v.b) });

/* 通用双向换算：把两组字段摆在一起，按方向读其中一组 */
const cvt = (la, lb, fields, ab, ba) => ({
  fields: [sel('dir', '方向', [la + ' → ' + lb, lb + ' → ' + la]), ...fields],
  run: (v) => {
    try { return v.dir.startsWith(la) ? ab(v) : ba(v); }
    catch (e) { return { error: e.message || String(e) }; }
  },
});
const HEXF = txt('hex', 'HEX 色值', '#2f5bd7', '#2f5bd7');
const RGBF = [num('r', 'R', 47, '0–255'), num('g', 'G', 91, '0–255'), num('b', 'B', 215, '0–255')];
const HSVF = [num('h', 'H 色相', 222, '0–360'), num('s', 'S 饱和度', 78, '%'), num('vv', 'V 明度', 84, '%')];
const CMYKF = [num('c', 'C 青', 78, '%'), num('m', 'M 品红', 58, '%'), num('y', 'Y 黄', 0, '%'), num('k', 'K 黑', 16, '%')];
const readRGB = (v) => [Number(v.r), Number(v.g), Number(v.b)];
const readHSV = (v) => [Number(v.h), Number(v.s), Number(v.vv)];
const readCMYK = (v) => [Number(v.c), Number(v.m), Number(v.y), Number(v.k)];
const fmtArr = (a) => a.map((x, i) => Number.isInteger(x) ? x : Number(x.toFixed(1))).join(', ');
const res = (label, value, color) => ({ text: label + '：' + value, copy: value,
  preview: swatch(color, value), stats: [{ label: label, value: String(value).slice(0, 18) }] });

export const COLOR = {
  mix: {
    fields: [...colorFields(), num('w', '颜色 A 权重', 50, '%')],
    run: (v) => {
      const a = hex2rgb(v.a), b = hex2rgb(v.b), w = clamp(Number(v.w) / 100, 0, 1);
      const c = rgb2hex(...a.map((x, i) => x * w + b[i] * (1 - w)));
      return res('混合结果', c, c);
    },
  },
  mid: twoColor((a, b) => {
    const c = rgb2hex(...a.map((x, i) => (x + b[i]) / 2));
    return res('中间色', c, c);
  }),
  delta: twoColor((a, b, ha, hb) => {
    const A = rgbLab(a), B = rgbLab(b);
    const e = Math.sqrt(A.reduce((s, x, i) => s + (x - B[i]) ** 2, 0));
    const score = Math.max(0, 100 - e).toFixed(1);
    const verdict = e < 1 ? '肉眼几乎无法区分' : e < 2 ? '非常接近' : e < 10 ? '比较接近' : e < 25 ? '有明显差异' : '差异很大';
    return {
      text: `颜色 A：${ha}\n颜色 B：${hb}\nCIE76 色差 ΔE：${e.toFixed(2)}\n匹配度（参考）：${score}%\n判定：${verdict}\n\nΔE 是 Lab 空间的欧氏距离，只作近似参考。`,
      copy: e.toFixed(2),
      preview: `<div style="display:flex;gap:8px;width:100%">${swatch(ha, 'A')}${swatch(hb, 'B')}</div>`,
      stats: [{ label: 'ΔE', value: e.toFixed(2) }, { label: '匹配度', value: score + '%' }],
    };
  }),
  inverse: {
    fields: [colorFields()[0]],
    run: (v) => {
      const a = hex2rgb(v.a);
      const [h, s, val] = rgb2hsv(a);
      const comp = rgb2hex(...hsv2rgb([(h + 180) % 360, s, val]));
      const inv = rgb2hex(...a.map((x) => 255 - x));
      return {
        text: `原色：${v.a}\n色相环补色：${comp}\nRGB 反相色：${inv}`,
        copy: comp,
        preview: `<div style="display:flex;gap:8px;width:100%">${swatch(v.a, '原色')}${swatch(comp, '补色')}${swatch(inv, '反相')}</div>`,
        stats: [{ label: '补色', value: comp }, { label: '反相', value: inv }],
      };
    },
  },
  hexhsv: cvt('HEX', 'HSV', [HEXF, ...HSVF],
    (v) => { const a = rgb2hsv(hex2rgb(v.hex)); return res('HSV', `hsv(${fmtArr(a)})`, v.hex); },
    (v) => { const c = rgb2hex(...hsv2rgb(readHSV(v))); return res('HEX', c, c); }),
  hexrgb: cvt('HEX', 'RGB', [HEXF, ...RGBF],
    (v) => { const a = hex2rgb(v.hex); return res('RGB', `rgb(${fmtArr(a)})`, v.hex); },
    (v) => { const c = rgb2hex(...readRGB(v)); return res('HEX', c, c); }),
  rgbcmyk: cvt('RGB', 'CMYK', [...RGBF, ...CMYKF],
    (v) => { const a = rgb2cmyk(readRGB(v)); return res('CMYK', `cmyk(${fmtArr(a)})`, rgb2hex(...readRGB(v))); },
    (v) => { const c = rgb2hex(...cmyk2rgb(readCMYK(v))); return res('RGB / HEX', `${readCMYK(v).length ? fmtArr(cmyk2rgb(readCMYK(v))) : ''} / ${c}`, c); }),
  hsvcmyk: cvt('HSV', 'CMYK', [...HSVF, ...CMYKF],
    (v) => { const a = rgb2cmyk(hsv2rgb(readHSV(v))); return res('CMYK', `cmyk(${fmtArr(a)})`, rgb2hex(...hsv2rgb(readHSV(v)))); },
    (v) => { const a = rgb2hsv(cmyk2rgb(readCMYK(v))); return res('HSV', `hsv(${fmtArr(a)})`, rgb2hex(...hsv2rgb(a))); }),
  cmykhex: cvt('CMYK', 'HEX', [...CMYKF, HEXF],
    (v) => { const c = rgb2hex(...cmyk2rgb(readCMYK(v))); return res('HEX', c, c); },
    (v) => { const a = rgb2cmyk(hex2rgb(v.hex)); return res('CMYK', `cmyk(${fmtArr(a)})`, v.hex); }),
  rgbhsv: cvt('RGB', 'HSV', [...RGBF, ...HSVF],
    (v) => { const a = rgb2hsv(readRGB(v)); return res('HSV', `hsv(${fmtArr(a)})`, rgb2hex(...readRGB(v))); },
    (v) => { const a = hsv2rgb(readHSV(v)); const c = rgb2hex(...a); return res('RGB / HEX', `${fmtArr(a)} / ${c}`, c); }),
};
