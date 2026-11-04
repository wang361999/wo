/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "题面",
  "titleOut": "解答",
  "wide": true,
  "fields": [
    {
      "id": "src",
      "label": "9 行，每行 9 个字符（空格/0 = 空）",
      "type": "textarea",
      "rows": 9,
      "default": "530070000\n600195000\n098000060\n800060003\n400803001\n700020006\n060000280\n000419005\n000080079"
    }
  ],
  "primary": "复制解答",
  "hintOut": "回溯求解，并判定唯一解 / 多解 / 无解。逐步推理给的是「唯一候选 / 唯一位置」两类可解释的理由，不是穷举过程回放。",
  "compute": (v) => {
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
  }
});
