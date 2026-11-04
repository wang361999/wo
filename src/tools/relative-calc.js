/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "关系链",
  "titleOut": "该怎么叫",
  "fields": [
    {
      "id": "chain",
      "label": "关系链",
      "type": "text",
      "default": "爸爸的妈妈的弟弟",
      "placeholder": "如 爸爸的弟弟 / 妈妈的姐姐的丈夫"
    }
  ],
  "primary": "复制称呼",
  "hintOut": "内置常见组合速查（父系/母系、长幼、配偶）。中文称谓各地差很多，超长链或远房旁系这里可能给不出，会如实提示而不是瞎编。",
  "compute": (v) => {
    const M = {
      '爸爸': '父亲', '妈妈': '母亲', '爸爸的爸爸': '爷爷', '爸爸的妈妈': '奶奶', '妈妈的爸爸': '外公', '妈妈的妈妈': '外婆',
      '爸爸的哥哥': '伯父', '爸爸的弟弟': '叔叔', '爸爸的姐姐': '姑妈', '爸爸的妹妹': '姑姑', '爸爸的哥哥的妻子': '伯母', '爸爸的弟弟的妻子': '婶婶',
      '妈妈的哥哥': '舅舅', '妈妈的弟弟': '舅舅', '妈妈的姐姐': '姨妈', '妈妈的妹妹': '姨妈', '妈妈的哥哥的妻子': '舅妈', '妈妈的弟弟的妻子': '舅妈',
      '姐姐': '姐姐', '妹妹': '妹妹', '哥哥': '哥哥', '弟弟': '弟弟', '丈夫': '丈夫', '妻子': '妻子', '儿子': '儿子', '女儿': '女儿',
      '爸爸的弟弟的儿子': '堂兄弟', '爸爸的弟弟的女儿': '堂姐妹', '爸爸的姐妹的儿子': '表兄弟', '妈妈的兄弟姐妹的儿子': '表兄弟',
      '哥哥的妻子': '嫂子', '弟弟的妻子': '弟媳', '姐姐的丈夫': '姐夫', '妹妹的丈夫': '妹夫', '儿子的妻子': '儿媳', '女儿的丈夫': '女婿',
      '丈夫的爸爸': '公公', '丈夫的妈妈': '婆婆', '妻子的爸爸': '岳父', '妻子的妈妈': '岳母', '丈夫的哥哥': '大伯', '妻子的兄弟': '舅子',
    };
    const s = String(v.chain || '').replace(/\s/g, '');
    if (!s) return { error: '填一条关系链，比如 爸爸的弟弟' };
    let res = M[s];
    if (!res) {
      const parts = s.split('的');
      if (parts.length >= 2) {
        const head = parts.slice(0, 2).join('的');
        if (M[head]) res = M[head] + '一方的' + parts.slice(2).join('的') + '（这层关系超出内置表，只能给到「' + M[head] + '」这一层）';
      }
    }
    const text = res ? [`${s} → ${res}`, '', '提示：同一关系在南北方叫法可能不同（外婆/姥姥、姑妈/姑姑），以家里习惯为准。'] : [`${s}：内置表里没有这条关系链。`, '可以试更短的写法，例如「爸爸的弟弟」「妈妈的姐姐」「丈夫的妈妈」。', '（不瞎编称呼，查不到就直说。）'].join('\n');
    return { text, copy: text, stats: [{ label: '链条层数', value: s.split('的').length + ' 层' }, { label: '结果', value: res ? '已匹配' : '未收录' }],
      preview: `<p class="t-hint">内置 ${Object.keys(M).length} 条常见组合。可点下面任意一条回填：${Object.keys(M).slice(0, 12).map((k) => `<button type="button" class="t-chip" onclick="var i=document.querySelector('#f-chain');if(i){i.value='${L.esc(k)}';i.dispatchEvent(new Event('input',{bubbles:true}))}">${L.esc(k)}</button>`).join('')}</p>` };
  }
});
