/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "文本与模型",
  "titleOut": "Token 估算",
  "fields": [
    {
      "id": "txt",
      "label": "提示词 / 文本",
      "type": "textarea",
      "rows": 8,
      "default": "请用中文解释一下什么是复利，举一个简单的例子。"
    },
    {
      "id": "model",
      "label": "模型",
      "type": "select",
      "options": [
        "GPT 系列（cl100k）",
        "Claude 系列",
        "中文模型（按字数估）",
        "通用粗略估算"
      ]
    },
    {
      "id": "ctx",
      "label": "上下文窗口",
      "type": "number",
      "default": 128000
    },
    {
      "id": "price",
      "label": "每百万 token 单价 ¥",
      "type": "number",
      "default": 7
    }
  ],
  "primary": "复制报告",
  "hintOut": "本地启发式估算：英文按 4 字符≈1 token、中文按 1.5 字≈1 token，标点和空白另计。不是官方分词器，仅供预算参考。",
  "compute": (v) => {
    const t = String(v.txt || '');
    const cn = (t.match(/[\u3400-\u9fff]/g) || []).length;
    const en = t.replace(/[\u3400-\u9fff]/g, '').length;
    const factor = v.model.startsWith('Claude') ? 1.08 : v.model.startsWith('中文') ? 1 : v.model.startsWith('通用') ? 0.95 : 1;
    const est = Math.ceil((cn / 1.5 + en / 4) * factor);
    const ctx = Number(v.ctx) || 128000, price = Number(v.price) || 0;
    const lines = L.lines(t);
    return { text: `估算 token：${est}\n中文字符 ${cn} · 其它字符 ${en} · 行数 ${lines.length}\n上下文占用：${(est / ctx * 100).toFixed(2)}%（窗口 ${L.fmt(ctx, 0)}）\n剩余可用：${L.fmt(Math.max(0, ctx - est), 0)} token\n预估费用：¥${(est / 1e6 * price).toFixed(4)}（输入侧）\n\n分词切片（前 40 片，按词/字）：\n${(t.match(/[a-zA-Z]+|[\u3400-\u9fff]|\d+|[^\s]/g) || []).slice(0, 40).join(' | ')}`,
      stats: [{ label: '估算 token', value: L.fmt(est, 0) }, { label: '占用', value: (est / ctx * 100).toFixed(1) + '%' }, { label: '费用', value: '¥' + (est / 1e6 * price).toFixed(3) }] };
  }
});
