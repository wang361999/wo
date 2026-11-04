/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "Regex Pro",
  "titleOut": "解析与替换",
  "wide": false,
  "fields": [
    {
      "id": "p",
      "label": "表达式",
      "type": "text",
      "default": "(?<user>\\w+)@(?<host>[\\w.]+)"
    },
    {
      "id": "flags",
      "label": "标志",
      "type": "select",
      "options": [
        "g",
        "gi",
        "gim",
        "gimsu"
      ]
    },
    {
      "id": "txt",
      "label": "测试文本",
      "type": "textarea",
      "rows": 6,
      "default": "a@x.com b@y.org"
    },
    {
      "id": "rep",
      "label": "替换模板",
      "type": "text",
      "default": "$<user> ← $<host>"
    }
  ],
  "primary": "复制结果",
  "hintOut": "给出命名组、语法着色与逐段中文解释；替换预览支持 $1 / $<name>。",
  "compute": (v) => {
    let re; try { re = new RegExp(v.p, v.flags); } catch (e) { return { error: e.message }; }
    const tokens = [];
    const p = String(v.p);
    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      const map = { '\\d': '数字', '\\w': '单词字符', '\\s': '空白', '^': '行首锚点', '$': '行尾锚点', '.': '任意字符', '*': '重复 0 次或更多', '+': '重复 1 次或更多', '?': '重复 0 或 1 次 / 惰性', '|': '或', '[': '字符类开始', ']': '字符类结束', '(': '分组开始', ')': '分组结束' };
      let hit = '';
      if (c === '\\' && p[i + 1]) { hit = c + p[i + 1]; i++; }
      else if (p.startsWith('(?<', i)) { const j = p.indexOf('>', i); tokens.push([p.slice(i, j + 1), '命名捕获组']); i = j; continue; }
      else if (p.startsWith('(?=', i) || p.startsWith('(?!', i) || p.startsWith('(?<=', i)) { tokens.push([p.slice(i, i + 4), '零宽断言']); i += 3; continue; }
      else hit = c;
      if (map[hit]) tokens.push([hit, map[hit]]);
    }
    const ms = [...String(v.txt || '').matchAll(re)].slice(0, 100);
    const color = (s) => L.esc(s).replace(/(\\[dwsDSW]|\(\?&lt;\w+&gt;|[.*+?^$()\[\]{}|])/g, '<b style="color:var(--accent)">$1</b>');
    const rep = v.rep ? String(v.txt || '').replace(re, v.rep) : '';
    return { html: `<p class="t-label">语法着色</p><div class="t-out" style="font-size:13px">${color(p)}</div>
      ${tokens.length ? `<p class="t-label" style="margin-top:12px">逐段解释</p><table class="t-table"><tbody>${tokens.map((t) => `<tr><td class="num">${L.esc(t[0])}</td><td>${L.esc(t[1])}</td></tr>`).join('')}</tbody></table>` : ''}
      ${rep ? `<p class="t-label" style="margin-top:12px">替换预览</p><div class="t-out">${L.esc(rep)}</div>` : ''}
      <p class="t-label" style="margin-top:12px">捕获明细</p><table class="t-table"><thead><tr><th>匹配</th><th>命名组</th><th>位置</th></tr></thead><tbody>${ms.map((m) => `<tr><td>${L.esc(m[0])}</td><td>${L.esc(JSON.stringify(m.groups || {}))}</td><td class="num">${m.index}</td></tr>`).join('')}</tbody></table>`,
      copy: ms.map((m) => `${m[0]}\t${JSON.stringify(m.groups || {})}`).join('\n'),
      stats: [{ label: '匹配', value: ms.length }, { label: '语法节点', value: tokens.length }] };
  }
});
