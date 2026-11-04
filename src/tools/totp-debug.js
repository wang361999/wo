/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "调试参数",
  "titleOut": "出码结果",
  "fields": [
    {
      "id": "key",
      "label": "Base32 密钥",
      "type": "text",
      "default": "JBSWY3DPEHPK3PXP"
    },
    {
      "id": "mode",
      "label": "模式",
      "type": "select",
      "options": [
        "TOTP（当前时间）",
        "TOTP（指定时间戳）",
        "HOTP（计数器）"
      ]
    },
    {
      "id": "ts",
      "label": "时间戳（秒）/ HOTP 计数器",
      "type": "text",
      "default": "1700000000"
    },
    {
      "id": "step",
      "label": "时间窗（秒）",
      "type": "number",
      "default": 30
    },
    {
      "id": "digits",
      "label": "位数",
      "type": "number",
      "default": 6
    },
    {
      "id": "code",
      "label": "反查：某个验证码属于第几个时间窗（可选）",
      "type": "text",
      "default": ""
    }
  ],
  "primary": "复制结果",
  "hintOut": "可指定时间戳出码、模拟时钟偏移、切 HOTP 计数器；反查会在前后若干个时间窗里找匹配的码。",
  "compute": async (v) => {
    let k; try { k = b32(v.key); } catch (e) { return { error: e.message }; }
    const digits = L.clamp(Number(v.digits) || 6, 4, 10), step = L.clamp(Number(v.step) || 30, 1, 3600);
    const at = v.mode === 'TOTP（当前时间）' ? Date.now() : (Number(v.ts) || 0) * 1000;
    let code, counter;
    if (v.mode === 'HOTP（计数器）') { counter = Number(v.ts) || 0; code = await hotp(k, counter, digits); }
    else { const r = await totpNow(k, step, digits, at); code = r.code; counter = r.c; }
    let reverse = '';
    if (v.code) { const hits = []; for (let c = counter - 60; c <= counter + 60; c++) if (await hotp(k, c, digits) === String(v.code).trim()) hits.push(c); reverse = `反查「${v.code}」：命中时间窗 ${hits.slice(0, 12).join(', ') || '前后 120 个窗口内没有'} （当前窗 ${counter}）`; }
    return { text: `验证码：${code}\n计数器 / 时间窗：${counter}\n时间：${new Date(at).toLocaleString('zh-CN')}\n参数：SHA-1 / ${step}s / ${digits} 位\n${reverse}`,
      stats: [{ label: '当前码', value: code }, { label: '时间窗', value: counter }] };
  }
});
