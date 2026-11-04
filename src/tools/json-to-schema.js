/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "样本 JSON",
  "titleOut": "推断的 Schema",
  "fields": [
    {
      "id": "txt",
      "label": "JSON",
      "type": "textarea",
      "rows": 9,
      "default": "{\"name\":\"小明\",\"age\":18,\"tags\":[\"a\",\"b\"],\"addr\":{\"city\":\"北京\"}}"
    },
    {
      "id": "req",
      "label": "required 策略",
      "type": "select",
      "options": [
        "全部字段必填",
        "都不必填"
      ]
    }
  ],
  "primary": "复制 Schema",
  "hintOut": "按样本推断类型；数组取第一个元素作为 items，嵌套对象递归展开。",
  "compute": (v) => {
    let o; try { o = JSON.parse(v.txt); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
    const s = L.inferSchema(o);
    if (v.req === '都不必填') { const strip = (x) => { if (x && typeof x === 'object') { delete x.required; Object.values(x.properties || {}).forEach(strip); if (x.items) strip(x.items); } }; strip(s); }
    s.$schema = 'https://json-schema.org/draft/2020-12/schema';
    return { text: JSON.stringify(s, null, 2), stats: [{ label: '顶层字段', value: Object.keys(s.properties || {}).length }] };
  }
});
