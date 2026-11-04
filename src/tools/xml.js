/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "XML",
  "titleOut": "结果",
  "fields": [
    {
      "id": "txt",
      "label": "XML 文本",
      "type": "textarea",
      "rows": 9,
      "default": "<root><item id=\"1\"><name>小明</name></item><item id=\"2\"><name>小红</name></item></root>"
    },
    {
      "id": "mode",
      "label": "操作",
      "type": "select",
      "options": [
        "格式化",
        "压缩",
        "XPath 查询",
        "树视图"
      ]
    },
    {
      "id": "xp",
      "label": "XPath（查询时填）",
      "type": "text",
      "default": "//item/name"
    }
  ],
  "primary": "复制结果",
  "hintOut": "用浏览器原生 DOMParser / XPath 实现，不引第三方引擎；格式错误会给出行号附近的信息。",
  "compute": (v) => {
    const t = String(v.txt || '').trim(); if (!t) return { text: '' };
    const doc = new DOMParser().parseFromString(t, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return { error: 'XML 解析失败：' + err.textContent.slice(0, 160) };
    if (v.mode === '压缩') return { text: t.replace(/>\s+</g, '><').trim(), stats: [{ label: '压缩后', value: t.replace(/>\s+</g, '><').trim().length }] };
    if (v.mode === 'XPath 查询') {
      let r; try { r = doc.evaluate(v.xp, doc, null, XPathResult.ANY_TYPE, null); } catch (e) { return { error: 'XPath 写错了：' + e.message }; }
      const out = []; let n;
      while ((n = r.iterateNext()) && out.length < 500) out.push(n.nodeType === 2 ? `${n.name}="${n.value}"` : n.textContent.trim());
      return { text: out.length ? out.join('\n') : '没有匹配节点', stats: [{ label: '命中', value: out.length }] };
    }
    const fmt = (node, ind = 0) => {
      const sp = '  '.repeat(ind);
      if (node.nodeType === 3) return node.textContent.trim() ? sp + L.esc(node.textContent.trim()) + '\n' : '';
      if (node.nodeType !== 1) return '';
      const attrs = [...node.attributes].map((a) => ` ${a.name}="${L.esc(a.value)}"`).join('');
      const kids = [...node.childNodes].filter((c) => c.nodeType === 1 || (c.nodeType === 3 && c.textContent.trim()));
      if (!kids.length) return `${sp}<${node.tagName}${attrs}/>\n`;
      const onlyText = kids.length === 1 && kids[0].nodeType === 3;
      const content = onlyText ? L.esc(kids[0].textContent.trim()) : '\n' + kids.map((c) => fmt(c, ind + 1)).join('') + sp;
      return `${sp}<${node.tagName}${attrs}>${content}</${node.tagName}>\n`;
    };
    const pretty = fmt(doc.documentElement);
    if (v.mode === '树视图') {
      const tree = (node, ind = 0) => {
        const sp = '  '.repeat(ind); const attrs = [...(node.attributes || [])].map((a) => ` ${a.name}="${a.value}"`).join('');
        const kids = [...(node.children || [])];
        let s = `${sp}└─ <${node.tagName}${attrs}>\n`;
        for (const k of kids) s += tree(k, ind + 1);
        const txt = (node.textContent || '').trim();
        if (!kids.length && txt) s += `${sp}   ${L.esc(txt)}\n`;
        return s;
      };
      return { text: tree(doc.documentElement), stats: [{ label: '节点', value: doc.getElementsByTagName('*').length }] };
    }
    return { text: pretty.trim(), stats: [{ label: '节点', value: doc.getElementsByTagName('*').length }, { label: '行数', value: pretty.split('\n').length }] };
  }
});
