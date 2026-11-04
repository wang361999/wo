/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "权限",
  "titleOut": "互转结果",
  "fields": [
    {
      "id": "num",
      "label": "数字形式（如 755）",
      "type": "text",
      "default": "755"
    },
    {
      "id": "sym",
      "label": "符号形式（如 rwxr-xr-x / u+x,go-w）",
      "type": "text",
      "default": ""
    }
  ],
  "primary": "复制数字权限",
  "hintOut": "支持 3 位或 4 位（含 setuid/setgid/sticky），也可写 chmod 符号修改式，实时互转。",
  "compute": (v) => {
    const bits = ['r', 'w', 'x'];
    const symOf = (n) => [6, 3, 0].map((s) => bits.map((b, i) => (n >> (s + (2 - i))) & 1 ? b : '-').join('')).join('');
    let n;
    if (v.sym && /^[rwx-]{9}$/.test(v.sym.trim())) {
      n = 0; const s = v.sym.trim();
      for (let i = 0; i < 9; i++) if (s[i] !== '-') n |= 1 << (8 - i);
    } else {
      const t = String(v.num || '').trim();
      if (!/^[0-7]{3,4}$/.test(t)) return { error: '填 3 位或 4 位八进制，或 9 位符号形式' };
      n = parseInt(t, 8);
    }
    const special = (n >> 9) & 7;
    const sym = symOf(n & 0o777);
    const sp = special & 4 ? sym.slice(0, 2) + (sym[2] === 'x' ? 's' : 'S') + sym.slice(3) : sym;
    const sp2 = special & 2 ? sp.slice(3, 5) + (sp[5] === 'x' ? 's' : 'S') + sp.slice(6) : sp;
    const sp3 = special & 1 ? sp2.slice(6, 8) + (sp2[8] === 'x' ? 't' : 'T') + sp2.slice(9) : sp2;
    const oct = (n & 0o777).toString(8).padStart(3, '0');
    return { text: `数字：${special ? (special.toString(8)) : ''}${oct}\n符号：${sp3}\n\n所有者：${sym.slice(0, 3)}　组：${sym.slice(3, 6)}　其它：${sym.slice(6, 9)}\nsetuid=${!!(special & 4)} setgid=${!!(special & 2)} sticky=${!!(special & 1)}\n\n命令：chmod ${oct} 文件名`,
      stats: [{ label: '数字', value: oct }, { label: '符号', value: sym }] };
  }
});
