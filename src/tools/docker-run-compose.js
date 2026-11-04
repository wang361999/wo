/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "docker run 命令",
  "titleOut": "compose.yml",
  "fields": [
    {
      "id": "cmd",
      "label": "命令",
      "type": "textarea",
      "rows": 6,
      "default": "docker run -d --name web -p 8080:80 -v ./data:/app/data -e TZ=Asia/Shanghai --restart unless-stopped nginx:latest"
    },
    {
      "id": "dir",
      "label": "方向",
      "type": "select",
      "options": [
        "run → compose",
        "compose → run"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "解析 -p / -v / -e / --name / --restart / --network / 镜像与命令参数，反向也能拼回一条 docker run。",
  "compute": (v) => {
    const t = String(v.cmd || '').trim();
    if (v.dir === 'run → compose') {
      const tok = t.replace(/^docker\s+run\s+/, '').match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
      const get = (flag) => { const out = []; for (let i = 0; i < tok.length; i++) if (tok[i] === flag && tok[i + 1]) out.push(tok[++i].replace(/^["']|["']$/g, '')); return out; };
      const name = get('--name')[0] || 'app';
      const ports = get('-p').concat(get('--publish'));
      const vols = get('-v').concat(get('--volume'));
      const envs = get('-e').concat(get('--env'));
      const restart = get('--restart')[0] || '';
      const net = get('--network')[0] || '';
      const labels = get('-l').concat(get('--label'));
      const flags = tok.filter((x) => x.startsWith('-'));
      const image = tok.filter((x, i) => !x.startsWith('-') && !(i > 0 && flags.includes(tok[i - 1]))).pop() || 'image:latest';
      const y = [`services:`, `  ${name}:`, `    image: ${image}`,
        ports.length ? `    ports:\n${ports.map((p) => `      - "${p}"`).join('\n')}` : '',
        vols.length ? `    volumes:\n${vols.map((p) => `      - ${p}`).join('\n')}` : '',
        envs.length ? `    environment:\n${envs.map((e) => { const i = e.indexOf('='); return i > 0 ? `      ${e.slice(0, i)}: "${e.slice(i + 1)}"` : `      - ${e}`; }).join('\n')}` : '',
        net ? `    networks:\n      - ${net}` : '', restart ? `    restart: ${restart}` : '',
        labels.length ? `    labels:\n${labels.map((l) => `      - "${l}"`).join('\n')}` : '',
        tok.includes('-d') || tok.includes('--detach') ? '' : ''].filter(Boolean).join('\n');
      return { text: y, stats: [{ label: '端口', value: ports.length }, { label: '卷', value: vols.length }, { label: '环境变量', value: envs.length }] };
    }
    const lines = L.lines(t); let svc = '', img = '', ports = [], envs = [], vols = [], restart = '';
    for (const l of lines) {
      const s = l.trim();
      if (/^[\w-]+:$/.test(s) && l.startsWith('  ') && !l.startsWith('    ')) svc = s.slice(0, -1);
      if (/^image:/.test(s)) img = s.slice(6).trim();
      if (/^restart:/.test(s)) restart = s.slice(8).trim();
      const p = s.match(/^-\s*"?([\d.]+:\d+:\d+|\d+:\d+)"?$/); if (p && ports.length >= 0) ports.push(p[1]);
      const e = s.match(/^-\s*"?(\w+=[^"]+)"?$/); if (e) envs.push(e[1]);
      const vo = s.match(/^-\s*([\w./\-]+:[\w./\-]+)$/); if (vo) vols.push(vo[1]);
    }
    const cmd = ['docker run -d', svc ? `--name ${svc}` : '', ...ports.map((p) => `-p ${p}`), ...vols.map((x) => `-v ${x}`), ...envs.map((x) => `-e ${x}`), restart ? `--restart ${restart}` : '', img].filter(Boolean).join(' ');
    return { text: cmd, stats: [{ label: '服务', value: svc || '—' }, { label: '镜像', value: img || '—' }] };
  }
});
