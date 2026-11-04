/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "高性价比人生指南（离线精简版）",
  "placeholder": "搜 健康 / 存钱 / 睡眠 / 效率 / 备份",
  "columns": [
    {
      "label": "主题"
    },
    {
      "label": "建议"
    },
    {
      "label": "成本"
    },
    {
      "label": "依据"
    }
  ],
  "rows": D.lifeGuideRows,
  "filters": [
    {
      "label": "主题",
      "values": [
        "全部",
        "健康",
        "效率",
        "金钱",
        "关系",
        "学习",
        "生活",
        "工作",
        "心理",
        "安全"
      ],
      "col": 0
    }
  ],
  "note": "内置 70 余条通用建议，可搜索、可整表复制。原本 676 条 + 34 节出处需要外部语料，这里只保留了最容易立刻照做的部分。"
});
