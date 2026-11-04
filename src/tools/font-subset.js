/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "字体文件",
  "titleOut": "字体信息",
  "accept": ".ttf,.otf,.woff",
  "multiple": false,
  "primary": "分析",
  "auto": false,
  "dropTitle": "拖 TTF / OTF / WOFF 进来",
  "fields": [
    {
      "id": "text",
      "label": "要检查的文字",
      "type": "textarea",
      "rows": 3,
      "default": "一页工具箱 你好世界 ABC 123"
    },
    {
      "id": "size",
      "label": "字形预览字号",
      "type": "number",
      "default": 48
    }
  ],
  "note": "用 opentype.js 解析字体：读取字形数、字族名、检查指定文字是否缺字，并把这些字的轮廓导出成 SVG。真正的字体子集化（重写 glyf/cmap 表）需要 HarfBuzz/fonttools 引擎，静态页里不做假装。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选字体' };
    const opentype = await vendor('opentype');
    let font; try { font = opentype.parse(await f.arrayBuffer()); } catch (e) { return { error: '字体解析失败：' + e.message + '（WOFF2 需先解压缩）' }; }
    const chars = [...new Set(Array.from(String(v.text || '')))].filter((c) => c.trim());
    const missing = chars.filter((c) => !font.charToGlyph(c) || font.charToGlyph(c).index === 0);
    const size = L.clamp(Number(v.size) || 48, 12, 160);
    const svgs = chars.slice(0, 40).map((c) => {
      try { const g = font.charToGlyph(c); const p = g.getPath(0, 0, size); return `<svg viewBox="0 -${size} ${size * 1.2} ${size * 1.4}" width="${size}" height="${size * 1.2}" style="border:1px solid var(--line);border-radius:5px;margin:3px"><path d="${p.toSVG()}" transform="scale(1,-1)" fill="currentColor"/></svg>`; } catch (e) { return ''; }
    }).join('');
    const names = font.names?.fontFamily ? Object.values(font.names.fontFamily)[0] : '未知';
    return { preview: `<div style="display:flex;flex-wrap:wrap">${svgs}</div>`,
      html: `<table class="t-table"><tbody><tr><td>字族</td><td class="num">${L.esc(names)}</td></tr><tr><td>字形数</td><td class="num">${font.numGlyphs}</td></tr><tr><td>单位/EM</td><td class="num">${font.unitsPerEm}</td></tr><tr><td>升部/降部</td><td class="num">${font.ascender} / ${font.descender}</td></tr><tr><td>检查字符</td><td class="num">${chars.length}</td></tr><tr><td>缺字</td><td class="num">${missing.length ? L.esc(missing.join(' ')) : '无'}</td></tr></tbody></table>`,
      copy: `字族 ${names}\n字形数 ${font.numGlyphs}\n缺字 ${missing.join(' ') || '无'}`,
      files: [{ name: '字形预览.svg', data: L.utf8(`<svg xmlns="http://www.w3.org/2000/svg">${svgs}</svg>`), mime: 'image/svg+xml', label: '下载 SVG 字形' }],
      stats: [{ label: '字形', value: font.numGlyphs }, { label: '缺字', value: missing.length }] };
  }
});
