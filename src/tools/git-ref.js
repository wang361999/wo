/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "Git 命令速查",
  "placeholder": "搜 撤销 / rebase / stash / reflog / 强推",
  "columns": [
    {
      "label": "命令"
    },
    {
      "label": "归类"
    },
    {
      "label": "写法"
    },
    {
      "label": "说明"
    }
  ],
  "rows": D.git,
  "filters": [
    {
      "label": "归类",
      "values": [
        "全部",
        "初始化",
        "取远端",
        "暂存",
        "提交",
        "查看",
        "分支",
        "合并",
        "撤销",
        "远端",
        "救命",
        "排查",
        "标签",
        "子模块",
        "工作树",
        "维护",
        "导出",
        "统计",
        "配置"
      ],
      "col": 1
    }
  ],
  "note": "标「危险」的会丢改动，执行前先 git status 看一眼。找回被 reset 掉的提交用 git reflog。"
});
