/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "雪花 ID",
  "titleOut": "反解结果",
  "fields": [
    {
      "id": "id",
      "label": "ID",
      "type": "text",
      "default": "1759288472991006720"
    },
    {
      "id": "epoch",
      "label": "自定义纪元（毫秒，0 用 Twitter 默认 1288834974657）",
      "type": "text",
      "default": "0"
    },
    {
      "id": "wbits",
      "label": "机器位",
      "type": "number",
      "default": 10
    },
    {
      "id": "sbits",
      "label": "序列位",
      "type": "number",
      "default": 12
    }
  ],
  "primary": "复制结果",
  "hintOut": "按「时间戳 | 机器位 | 序列位」从低位往高位切；不同厂商的纪元与位宽不同，改参数即可对上。",
  "compute": (v) => {
    let id; try { id = BigInt(String(v.id).trim()); } catch (e) { return { error: 'ID 应为十进制整数' }; }
    const W = BigInt(Math.max(0, Number(v.wbits) || 10)), S = BigInt(Math.max(0, Number(v.sbits) || 12));
    const seq = id & ((1n << S) - 1n);
    const worker = (id >> S) & ((1n << W) - 1n);
    const ts = id >> (S + W);
    const ep = Number(v.epoch) || 1288834974657;
    const ms = Number(ts) + ep;
    const date = new Date(ms);
    const bin = id.toString(2).padStart(64, '0');
    return { text: `时间戳段：${ts}（+纪元 ${ep} = ${ms}）\n北京时间：${isNaN(date) ? '超出范围' : date.toLocaleString('zh-CN')}\n工作机器：${worker}\n序列号：${seq}\n\n二进制（64 位）：\n${bin.match(/.{8}/g).join(' ')}`,
      stats: [{ label: '机器', value: String(worker) }, { label: '序列', value: String(seq) }, { label: '年份', value: isNaN(date) ? '—' : date.getFullYear() }] };
  }
});
