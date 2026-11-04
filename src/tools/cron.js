/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "Cron 表达式",
  "titleOut": "解释与下次执行",
  "fields": [
    {
      "id": "e",
      "label": "表达式",
      "type": "text",
      "default": "*/5 9-18 * * 1-5",
      "placeholder": "分 时 日 月 周（5 段）或 秒 分 时 日 月 周（6 段）"
    },
    {
      "id": "n",
      "label": "列几次",
      "type": "number",
      "default": 8
    }
  ],
  "primary": "复制结果",
  "sample": {
    "e": "0 9 * * 1",
    "n": 8
  },
  "hintOut": "支持 * / , - 与星期名缩写；下次执行时间按本机时区推算，最多往后找一年。",
  "compute": (v) => {
    const parts = String(v.e || '').trim().split(/\s+/);
    if (![5, 6].includes(parts.length)) return { error: 'Cron 应为 5 段或 6 段' };
    const six = parts.length === 6;
    const [mi, hr, dm, mo, dw] = six ? parts.slice(1) : parts;
    const ranges = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
    const parse = (s, idx) => {
      const [lo, hi] = ranges[idx]; const set = new Set();
      for (const seg of s.split(',')) {
        const [base, step] = seg.split('/');
        const st = step ? Number(step) : 1;
        let a, b;
        if (base === '*' || base === '?') { a = lo; b = hi; }
        else if (base.includes('-')) { [a, b] = base.split('-').map(Number); }
        else { a = b = Number(base); }
        if ([a, b, st].some((x) => !Number.isFinite(x))) throw new Error(`第 ${idx + 1} 段写错了：${seg}`);
        for (let x = a; x <= b; x += st) set.add(x % (hi + 1) === x ? x : x);
      }
      return set;
    };
    let sets; try { sets = [mi, hr, dm, mo, dw].map(parse); } catch (e) { return { error: e.message }; }
    const has = (set, x) => set.has(x) || (set.size === 1 && [...set][0] === 0 && x === 0);
    const dwSet = new Set([...sets[4]].map((x) => (x === 7 ? 0 : x)));
    const desc = `${[...sets[0]].slice(0, 6).join(',')}${sets[0].size > 6 ? '…' : ''} 分，${[...sets[1]].slice(0, 6).join(',')}${sets[1].size > 6 ? '…' : ''} 时，月 ${[...sets[3]].join(',')}，日 ${[...sets[2]].slice(0, 5).join(',')}${sets[2].size > 5 ? '…' : ''}，周 ${[...dwSet].join(',')}`;
    const next = []; let d = new Date(); d.setSeconds(six ? 0 : 0, 0); d.setMinutes(d.getMinutes() + 1);
    const end = d.getTime() + 366 * 86400000;
    while (d.getTime() < end && next.length < Math.min(50, Number(v.n) || 8)) {
      if (sets[3].has(d.getMonth() + 1) && sets[2].has(d.getDate()) && dwSet.has(d.getDay()) && sets[1].has(d.getHours()) && sets[0].has(d.getMinutes())) {
        next.push(L.fmtDate(d, true) + ' 周' + L.weekdayCN(d)); d = new Date(d.getTime() + 60000);
      } else d = new Date(d.getTime() + 60000);
    }
    return { text: `解读：${desc}\n\n接下来 ${next.length} 次：\n${next.join('\n') || '一年内没有匹配时间'}`,
      stats: [{ label: '段数', value: parts.length }, { label: '下次', value: next[0] ? next[0].slice(5, 16) : '—' }] };
  }
});
