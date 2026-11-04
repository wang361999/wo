/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "汉字与方式",
  "titleOut": "拼音结果",
  "wide": true,
  "fields": [
    {
      "id": "text",
      "label": "中文",
      "type": "textarea",
      "rows": 5,
      "default": "中国 你好 学习 工具箱"
    },
    {
      "id": "mode",
      "label": "输出方式",
      "type": "select",
      "options": [
        "全拼（空格分隔）",
        "首字母",
        "数字声调（近似）"
      ]
    },
    {
      "id": "sep",
      "label": "分隔符",
      "type": "select",
      "options": [
        "空格",
        "无",
        "连字符 -",
        "逗号"
      ]
    }
  ],
  "primary": "复制拼音",
  "hintOut": "内置约 200 个最常用字的精简拼音表（无声调数据），超出范围的字会原样保留。它够用来给常见词注音，但不是完整拼音库，多音字、声调、生僻字都不覆盖——需要精确注音请用专业库。",
  "compute": (v) => {
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
  }
});
