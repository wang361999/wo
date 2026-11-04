/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "勾选模板",
  "titleOut": ".gitignore",
  "fields": [
    {
      "id": "common",
      "label": "通用系统 / 编辑器 / 密钥",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "node",
      "label": "Node / 前端",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "python",
      "label": "Python",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "java",
      "label": "Java / Maven / Gradle",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "go",
      "label": "Go",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "web",
      "label": "前端构建产物",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "c",
      "label": "C / C++",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "unity",
      "label": "Unity",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "extra",
      "label": "额外规则（每行一条）",
      "type": "textarea",
      "rows": 3,
      "default": ""
    },
    {
      "id": "dedup",
      "label": "合并去重、去掉空行",
      "type": "checkbox",
      "default": true
    }
  ],
  "primary": "复制 .gitignore",
  "hintOut": "自动合并去重，注释行保留；生成的规则只写进文本框，不会动你的项目。",
  "compute": (v, ctx) => {
    const keys = ['common', 'node', 'python', 'java', 'go', 'web', 'c', 'unity'];
    let lines = [];
    for (const k of keys) if (v[k]) lines.push(...L.lines(L.D.gitignore[k]));
    if (v.extra) lines.push(...L.nonEmptyLines(v.extra));
    if (v.dedup) lines = [...new Set(lines.map((x) => x.trim()).filter(Boolean))];
    const text = lines.join('\n') + '\n';
    return { text, stats: [{ label: '规则', value: lines.filter((x) => x && !x.startsWith('#')).length }, { label: '模板', value: keys.filter((k) => v[k]).length }],
      actions: [{ label: '下载文件', run: (vv, c) => c.download('.gitignore', c.root.querySelector('[data-out]').textContent, 'text/plain;charset=utf-8') }] };
  }
});
