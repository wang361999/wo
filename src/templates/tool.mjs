// 工具页：静态正文 + 本机沙箱工作台。交互模块由 /tool.js 挂进 #tool-root。
// 所有 SEO 内容（面包屑、正文、FAQ、同类内链、分类链接）保持完整，只换视觉结构。
import { TOOLS, CATS, CAT_MAP, DEV_NAME, MODE_NAME, MODE_DESC } from '../data/catalog.mjs';
import { svg, esc, SITE_NAME } from './layout.mjs';
import { CAT_SEO, cleanDesc } from './seo.mjs';

const HOWTO = {
  'grid-cut': '拖一张图进来，选切法（九宫格 / 四格 / 横三连…），调好每格尺寸和留白，点打包下载，按编号顺序发就是完整一张。',
  'placeholder': '填宽高、底色和文字，右侧实时出图，可导出 SVG / PNG，也能直接复制 data URI 塞进代码。',
  'color': '在任一格式里输入颜色，其余格式自动同步；下方给配色建议和文字对比度判定。',
  'image-resize': '选一张图，填目标宽高，可勾选一次导出多个常用尺寸，逐个下载。',
  'base64': '在左边输入文本，右边实时出 Base64；把 Base64 粘回左边点解码即可还原。',
  'url-encode': '输入网址或参数，分别看 encodeURIComponent 与 encodeURI 两种结果，可反向解码。',
  'wordcount': '把文本粘进输入框，中文字数、英文词数、标点、行数与预估阅读时间一起出。',
  'text-dedup': '粘一列文本，选按行还是按分隔符，点一下出结果；顺带看频次和集合运算。',
  'case-convert': '输入一个词组或变量名，六种命名风格一次全给，点任一结果即可复制。',
  'uuid-gen': '选数量和格式，生成一批 UUID v4，可复制或下载成 txt。',
  'timestamp': '输入秒或毫秒时间戳看对应日期；也可以选一个日期反推时间戳。',
  'json': '粘一段 JSON，格式化 / 压缩 / 校验即时生效；路径取值填 $.a.b 这种写法。',
  'morse': '输入文字转摩斯电码，或反过来解码；可以试听节奏。',
  'roman': '输入 1–3999 的整数转罗马数字，或粘罗马数字还原，非法写法会直接指出。',
  'html-entities': '输入文本或实体，双向转换，支持命名、十进制、十六进制三种写法。',
  'list-convert': '粘一列内容，选目标格式（逗号 / SQL IN / JS 数组…），可先去重排序。',
  'bmi': '填身高体重，出 BMI 与区间判定，并给出体脂率与基础代谢的估算值。',
  'percent-calc': '选算式，填两个已知数，六种常见百分比问题一次算清。',
  'temp-convert': '输入任一温标，另外两种同时给出，下面附常见温度对照。',
  'password': '选长度和字符种类，生成随机密码；可排除 0/O、1/l 这类易混淆字符。',
  'draw': '一行一个名字或选项，点开始抽签，可一次抽多个、不重复，结果留在历史里。',
  'compound': '填本金、年化、年数，可选每月定投和通胀折算，看终值与曲线。',
  'numcn': '输入金额，转人民币大写，可切简体 / 繁体，附加整数与小数处理说明。',
  'vat-split': '填含税价或不含税价，选税率，税额与另一方向自动算出，闭合到分。',
  'css-gradient': '选线性 / 径向 / 锥形，拖色标、调角度，右侧实时预览，一键复制 CSS。',
  'css-shadow': '叠加多层阴影，调偏移、模糊、扩散与颜色，预览框即时更新，一键复制 CSS。',
  'css-radius': '四个角独立调 x / y 半径，可切对称模式和单位，一键复制 CSS。',
  'reaction-test': '点开始，等背景变绿再点，五轮取平均，抢跑会重来。',
  'ports': '按端口、服务名或用途搜，点行可复制端口号；标红的是公网暴露风险高的服务。',
  'copybook': '输入几个生字，选田字格 / 米字格和格子大小，生成 A4 字帖直接打印。',
};

/* 同类工具按 id 哈希错开起点环形取 6 个，避免后两百多个工具收不到内链。 */
function relatedTools(t, n = 6) {
  const same = TOOLS.filter((x) => x.cat === t.cat && x.id !== t.id);
  const pool = same.length ? same : TOOLS.filter((x) => x.id !== t.id);
  const seed = [...t.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const start = seed % pool.length;
  return Array.from({ length: Math.min(n, pool.length) }, (_, i) => pool[(start + i) % pool.length]);
}

const DEV_PROSE = {
  pc: '这个工具按电脑前的用法设计，屏幕大一点、要拖文件慢慢调参数时更顺手。手机上也能打开，只是操作区会窄一些。',
  mobile: '这个工具按随手用的场景设计，粘进来、点一下、把结果发出去。电脑上打开一样能用。',
  both: '电脑端和手机端各有一套布局，同一个工具在两边都能直接打开，不用切换账号，也不用重填一遍。',
};

export function toolHTML(t) {
  const cat = CAT_MAP[t.cat] || { name: '其它', icon: '🔧' };
  const seo = CAT_SEO[t.cat] || { line: '打开就能用，不用注册。' };
  const feat = cleanDesc(t.desc);
  const related = relatedTools(t);
  const how = HOWTO[t.id] || `${feat}。在上方填入内容或拖入文件，调整参数后结果会实时更新，最后复制、下载或打印。`;
  const idx = String(TOOLS.findIndex((x) => x.id === t.id) + 1).padStart(3, '0');
  const others = CATS.filter((c) => c.id !== 'all' && c.id !== t.cat).slice(0, 4)
    .map((c) => `<a href="/cat/${c.id}/">${esc(c.name)}</a>`).join('');

  return `
<nav class="crumb"><a href="/">索引</a><span class="sep">/</span>
  <a href="/cat/${t.cat}/">${esc(cat.name)}</a><span class="sep">/</span><span>${esc(t.name)}</span></nav>

<header class="tool-head">
  <div class="th-kicker"><span>TOOL / ${idx}</span><span class="th-rule"></span><span>${esc(cat.name)} · ${DEV_NAME[t.dev]}端</span></div>
  <h1><span class="h-emoji" aria-hidden="true">${esc(t.icon)}</span>${esc(t.name)}</h1>
  <p>${esc(feat)}。${esc(seo.line)}</p>
  <div class="th-tags">
    <span class="pill">${svg('i-shield')}本地处理 · 不上传</span>
    <span class="dev-mark ${t.dev}">${DEV_NAME[t.dev]}</span>
    <span class="badge m-${t.mode === 'local' ? 'local' : t.mode === 'vendor' ? 'vendor' : 'lite'}">${MODE_NAME[t.mode]}</span>
  </div>
</header>

<section class="workbench" aria-label="${esc(t.name)} 工具区">
  <div class="wb-bar"><span class="wb-dots"><i></i><i></i><i></i></span>
    <span class="wb-title">LOCAL SANDBOX / 本机沙箱 · ${esc(t.id)}</span>
    <span class="wb-status"><i class="live"></i>READY</span></div>
  <div class="wb-body">
    <div class="shell-note">${svg('i-info')}
      <p><b>这个页面只做一件事。</b>所有计算与渲染都在你的浏览器里完成，图片和文本不会离开设备；关掉页面数据就没了，不需要登录，也没有上传接口。</p>
      <p class="mode-line"><b>实现档位 · ${MODE_NAME[t.mode]}</b>：${MODE_DESC[t.mode]}</p>
    </div>
    <div id="tool-root" class="tool-root" data-tool="${t.id}">
      <div class="tool-loading">正在载入工具模块…</div>
    </div>
  </div>
</section>

<div class="below">
  <section class="tool-prose">
    <div class="sec-head"><span class="sec-no">01</span><h2>怎么用</h2></div>
    <ol class="steps">
      <li><b>放内容进来</b><span>选文件、粘贴，或直接在上方的输入框里填写。</span></li>
      <li><b>调几个参数</b><span>按需要选一下，结果实时更新，不用点「生成」。</span></li>
      <li><b>拿走结果</b><span>复制、下载或打印，然后关掉页面就行。</span></li>
    </ol>
    <p class="howto">${esc(how)}</p>

    <div class="sec-head"><span class="sec-no">02</span><h2>关于${esc(t.name)}</h2></div>
    <p>${esc(t.name)}属于${esc(cat.name)}，做的是${esc(feat)}这一类事。${esc(seo.line)}页面是静态生成的，工具模块在打开时才加载，加载完就只跟你的浏览器打交道。</p>
    <p>${esc(DEV_PROSE[t.dev] || DEV_PROSE.both)}实现上属于「${MODE_NAME[t.mode]}」：${esc(MODE_DESC[t.mode])}</p>

    <div class="sec-head"><span class="sec-no">03</span><h2>常见问题</h2></div>
    <dl class="faq">
      <dt>${esc(t.name)}会把我的文件上传到服务器吗？</dt>
      <dd>不会。${esc(SITE_NAME)}是纯前端静态站，没有上传接口，也没有存你输入的地方。图片、文本、音频都只在当前标签页里被读取和处理，刷新或关掉就没了。</dd>
      <dt>手机上能用${esc(t.name)}吗？</dt>
      <dd>${esc(DEV_PROSE[t.dev] || DEV_PROSE.both)}另外这个工具标的是「${DEV_NAME[t.dev]}」。</dd>
      <dt>要注册、要付费、有次数限制吗？</dt>
      <dd>都不用。全站 ${TOOLS.length} 个工具免费开放，没有账号系统、不设次数、不弹登录。唯一的成本是你自己浏览器的算力。</dd>
    </dl>

    <p class="fineprint">${esc(t.tags.join(' · '))}　|　分类：<a href="/cat/${t.cat}/">${esc(cat.name)}</a>　|　适用：${DEV_NAME[t.dev]}端　|　${MODE_NAME[t.mode]} · ${esc(MODE_DESC[t.mode])}</p>
  </section>

  <aside class="side-col">
    <section class="related"><div class="sec-head"><span class="sec-no">↗</span><h2>同类工具</h2></div>
      <div class="related-grid">${related.map((r, i) =>
        `<a class="mini" href="/tools/${r.id}/"><span class="mi-no">${String(i + 1).padStart(2, '0')}</span>
           <span class="mi-txt"><b>${esc(r.name)}</b><span class="md">${esc(cleanDesc(r.desc))}</span></span>
           <span class="mi-arw">${svg('i-arw')}</span></a>`
      ).join('')}</div>
      <p class="related-more"><a href="/cat/${t.cat}/">查看${esc(cat.name)}全部工具 →</a></p>
    </section>
    <section class="cat-jump"><h2>换个分类</h2><nav class="cat-jump-links" aria-label="其它分类">${others}</nav></section>
  </aside>
</div>
`;
}
