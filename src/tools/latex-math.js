/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "LaTeX",
  "titleOut": "公式",
  "wide": false,
  "fields": [
    {
      "id": "tex",
      "label": "公式",
      "type": "textarea",
      "rows": 4,
      "default": "\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}"
    },
    {
      "id": "size",
      "label": "字号",
      "type": "select",
      "options": [
        "正常",
        "大",
        "特大"
      ]
    },
    {
      "id": "tpl",
      "label": "插入模板",
      "type": "select",
      "options": [
        "不插入",
        "分式",
        "求和",
        "矩阵",
        "方程组",
        "希腊字母",
        "上下标",
        "根号"
      ]
    }
  ],
  "primary": "复制 LaTeX",
  "hintOut": "KaTeX 本地渲染（库随站点打包，不联网）。点模板可把常用片段插进输入框；右侧可复制 LaTeX。",
  "compute": async (v) => {
    const tpls = { '分式': '\\frac{a}{b}', '求和': '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}', '矩阵': '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', '方程组': '\\begin{cases} x+y=1 \\\\ x-y=3 \\end{cases}', '希腊字母': '\\alpha + \\beta + \\gamma + \\Delta + \\Omega', '上下标': 'x_i^2 + a_{n+1}', '根号': '\\sqrt[3]{x^2 + y^2}' };
    const tex = String(v.tex || '').trim();
    if (!tex) return { text: '' };
    const scale = { '正常': '1', '大': '1.4', '特大': '1.9' }[v.size] || '1';
    try {
      const katex = await vendor('katex');
      const html = katex.renderToString(tex, { throwOnError: false, displayMode: true, output: 'html' });
      return { preview: `<div style="font-size:${scale}em;overflow:auto">${html}</div>`, copy: tex,
        text: v.tpl !== '不插入' ? tpls[v.tpl] : tex, stats: [{ label: '字符', value: tex.length }] };
    } catch (e) { return { error: '渲染失败：' + e.message }; }
  }
});
