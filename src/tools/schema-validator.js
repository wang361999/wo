/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "Schema + 数据",
  "titleOut": "校验结果",
  "fields": [
    {
      "id": "schema",
      "label": "JSON Schema",
      "type": "textarea",
      "rows": 7,
      "default": "{\"type\":\"object\",\"required\":[\"name\",\"age\"],\"properties\":{\"name\":{\"type\":\"string\"},\"age\":{\"type\":\"integer\",\"minimum\":0}}}"
    },
    {
      "id": "data",
      "label": "待校验 JSON",
      "type": "textarea",
      "rows": 6,
      "default": "{\"name\":\"小明\",\"age\":-3}"
    }
  ],
  "primary": "复制报告",
  "hintOut": "本地实现 type / required / minimum / maximum / minLength / maxLength / pattern / enum / items 常用关键字，覆盖 Draft 7 常见用法；不是完整 ajv。",
  "compute": (v) => {
    let s, d; try { s = JSON.parse(v.schema); d = JSON.parse(v.data); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
    const errs = [];
    const go = (x, val, path) => {
      if (!x || typeof x !== 'object') return;
      if (x.$ref) return;
      if (x.type) {
        const t = Array.isArray(val) ? 'array' : val === null ? 'null' : typeof val;
        const ok = x.type === 'integer' ? Number.isInteger(val) : x.type === 'number' ? t === 'number' : t === x.type;
        if (!ok) { errs.push(`${path || '$'} 类型应为 ${x.type}，实际 ${t}`); return; }
      }
      if (x.enum && !x.enum.includes(val)) errs.push(`${path} 不在允许值内`);
      if (typeof val === 'string') {
        if (x.minLength != null && val.length < x.minLength) errs.push(`${path} 少于 ${x.minLength} 字符`);
        if (x.maxLength != null && val.length > x.maxLength) errs.push(`${path} 超过 ${x.maxLength} 字符`);
        if (x.pattern && !new RegExp(x.pattern).test(val)) errs.push(`${path} 不匹配 ${x.pattern}`);
      }
      if (typeof val === 'number') {
        if (x.minimum != null && val < x.minimum) errs.push(`${path} 小于最小值 ${x.minimum}`);
        if (x.maximum != null && val > x.maximum) errs.push(`${path} 大于最大值 ${x.maximum}`);
      }
      if (Array.isArray(val) && x.items) val.forEach((y, i) => go(x.items, y, `${path}[${i}]`));
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        (x.required || []).forEach((k) => { if (!(k in val)) errs.push(`${path}.${k} 缺失（必填）`); });
        Object.entries(x.properties || {}).forEach(([k, y]) => { if (k in val) go(y, val[k], `${path}.${k}`); });
      }
    };
    go(s, d, '$');
    return { text: errs.length ? errs.join('\n') : '✓ 校验通过', stats: [{ label: '错误', value: errs.length }, { label: '结论', value: errs.length ? '不通过' : '通过' }] };
  }
});
