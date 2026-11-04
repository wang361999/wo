/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "简历内容",
  "titleOut": "A4 预览",
  "wide": true,
  "fields": [
    {
      "id": "name",
      "label": "姓名",
      "type": "text",
      "default": "张三"
    },
    {
      "id": "job",
      "label": "求职意向",
      "type": "text",
      "default": "前端工程师"
    },
    {
      "id": "contact",
      "label": "联系方式",
      "type": "text",
      "default": "138-0000-0000 | zhangsan@example.com"
    },
    {
      "id": "summary",
      "label": "个人简介",
      "type": "textarea",
      "rows": 3,
      "default": "5 年前端开发经验，熟悉组件化与工程化，主导过多个从 0 到 1 的项目。"
    },
    {
      "id": "exp",
      "label": "工作经历（每行一段）",
      "type": "textarea",
      "rows": 5,
      "default": "2022-至今　某某科技　前端工程师｜负责设计系统与构建优化，首屏时间下降 40%\n2019-2022　某某网络　Web 开发｜维护千万级 PV 的后台与活动页"
    },
    {
      "id": "edu",
      "label": "教育经历",
      "type": "textarea",
      "rows": 2,
      "default": "2015-2019　某某大学　计算机科学与技术　本科"
    },
    {
      "id": "skill",
      "label": "技能（逗号分隔）",
      "type": "text",
      "default": "JavaScript, TypeScript, React, Node.js, Vite, CSS"
    },
    {
      "id": "theme",
      "label": "配色",
      "type": "select",
      "options": [
        "朱砂",
        "墨蓝",
        "松绿"
      ]
    }
  ],
  "primary": "复制纯文本版",
  "actions": [
    {
      "label": "打印 / 存为 PDF",
      "run": (v, ctx) => {
    const src = ctx.root.querySelector('#rs-paper') || document.querySelector('#rs-paper');
    if (!src) return;
    const clone = src.cloneNode(true); clone.id = 'rs-print-paper';
    clone.style.cssText = 'display:block!important;max-width:none!important;box-shadow:none!important;border-radius:0!important;margin:0!important;padding:20mm 18mm';
    document.body.appendChild(clone);
    const st = document.createElement('style');
    st.textContent = '@media print{body>*{display:none!important}#rs-print-paper{display:block!important}@page{size:A4;margin:0}}';
    document.head.appendChild(st);
    setTimeout(() => { window.print(); setTimeout(() => { clone.remove(); st.remove(); }, 800); }, 60);
  }
    }
  ],
  "hintOut": "预览按 A4 比例排版，「打印 / 存为 PDF」会只打印简历区域（浏览器打印对话框里选「另存为 PDF」）。内容只在本机。",
  "compute": (v) => {
    const E = L.esc, C = { '朱砂': '#b4552d', '墨蓝': '#36536b', '松绿': '#4b6b52' }[v.theme] || '#b4552d';
    const line = (s) => L.nonEmptyLines(s).map((x) => `<div style="margin:3px 0">${E(x)}</div>`).join('');
    const html = `<div id="rs-paper" style="background:#fff;color:#2f2b26;padding:38px 42px;max-width:760px;margin:0 auto;box-shadow:0 2px 14px #0002;font-family:system-ui,'PingFang SC',sans-serif;line-height:1.65">
      <div style="border-bottom:3px solid ${C};padding-bottom:12px"><div style="font-size:30px;font-weight:800">${E(v.name)}</div><div style="color:${C};font-size:16px;margin-top:4px">${E(v.job)}</div><div style="font-size:12px;opacity:.7;margin-top:6px">${E(v.contact)}</div></div>
      <div style="margin-top:18px"><div style="font-weight:700;color:${C};border-left:3px solid ${C};padding-left:8px">个人简介</div><div style="font-size:13px;margin-top:6px">${E(v.summary)}</div></div>
      <div style="margin-top:16px"><div style="font-weight:700;color:${C};border-left:3px solid ${C};padding-left:8px">工作经历</div><div style="font-size:13px;margin-top:6px">${line(v.exp)}</div></div>
      <div style="margin-top:16px"><div style="font-weight:700;color:${C};border-left:3px solid ${C};padding-left:8px">教育经历</div><div style="font-size:13px;margin-top:6px">${line(v.edu)}</div></div>
      <div style="margin-top:16px"><div style="font-weight:700;color:${C};border-left:3px solid ${C};padding-left:8px">技能</div><div style="margin-top:6px">${String(v.skill).split(/[,，]/).filter(Boolean).map((x) => `<span style="display:inline-block;background:${C}18;color:${C};padding:3px 9px;border-radius:12px;font-size:12px;margin:2px 4px 2px 0">${E(x.trim())}</span>`).join('')}</div></div>
    </div>`;
    const plain = [`${v.name}　${v.job}`, v.contact, '', '【个人简介】', v.summary, '', '【工作经历】', v.exp, '', '【教育经历】', v.edu, '', '【技能】', v.skill].join('\n');
    return { html, copy: plain, text: plain, stats: [{ label: '配色', value: L.esc(v.theme) }],
      preview: '' };
  }
});
