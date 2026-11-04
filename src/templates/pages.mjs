import { esc } from './util.mjs';
import { layout, breadcrumb, SITE_NAME, SITE_TAGLINE, SITE_URL } from './layout.mjs';

const STAGES = [
  { id: '小学低年级', note: '一年级 · 二年级' },
  { id: '小学高年级', note: '三年级以上' },
  { id: '初中', note: '陆续添加' },
  { id: '高中', note: '陆续添加' },
  { id: '大学', note: '陆续添加' },
];

export function homePage(tools, hanziItems) {
  const cards = (stage) => tools.filter((t) => t.stage === stage).map((t) => `
      <a class="card" href="/tools/${esc(t.slug)}/" data-search="${esc([t.title, t.short, t.grade, ...t.keywords].join(' '))}">
        <span class="g">${esc(t.grade)}</span>
        <div class="t">${esc(t.short)}</div>
        <div class="d">${esc(t.desc)}</div>
      </a>`).join('');

  const stageSections = STAGES.map((s) => {
    const list = tools.filter((t) => t.stage === s.id);
    const body = list.length
      ? `<div class="card-grid">${cards(s.id)}</div>`
      : `<div class="stage-soon">${esc(s.note)}　·　这一批先做小学段，其他学段用同一套骨架逐段添加。</div>`;
    return `<div class="section" id="stage-${esc(s.id)}">
      <h2>${esc(s.id)}</h2><p class="sub">${esc(s.note)}　·　${list.length} 个工具</p>
      ${body}
    </div>`;
  }).join('');

  const hzIndex = hanziItems.map((h) => `<a href="/hanzi/${esc(h.slug)}/" title="${esc(h.c)} · ${h.n} 画 · 部首 ${esc(h.r)}" data-search="${esc([h.c, h.p, h.r, ...h.w].join(' '))}">${esc(h.c)}</a>`).join('');

  const body = `
  <main class="wrap">
    <section class="hero">
      <h1>学生用的工具页，一页解决一个问题</h1>
      <p>口算题、乘法表、田字格、拼音格、笔顺查询、单位换算……打开就能用，结果已经生成好，可以直接打印。不用注册，不用下载。</p>
      <div class="search-box">
        <input type="search" id="site-search" placeholder="搜工具或生字，比如：口算、乘法表、田、笔顺" autocomplete="off" aria-label="站内搜索">
        <div class="search-hint">输入即筛选；按回车打开第一个结果。</div>
      </div>
    </section>

    <div id="tools">${stageSections}</div>

    <section class="section" id="hanzi">
      <h2>一年级常用生字</h2>
      <p class="sub">共 ${hanziItems.length} 字，每个字一个页面：笔画数、笔顺分步、部首、结构、组词</p>
      <div class="hz-index" id="hz-index">${hzIndex}</div>
    </section>

    <section class="section prose" id="about">
      <h2>关于这个站</h2>
      <p>这里的每一页只做一件事：把学生、家长和老师经常要找的那张纸，直接生成出来。题目是随机出的，换一批就是新的一套；字帖、拼音格、对照表都是排好版的，点「打印」就能出 A4 纸。</p>
      <p>页面上的内容会按学段慢慢补齐，从小学低年级开始，一直往上加。所有工具都能免费使用，也不需要留下任何信息。</p>
    </section>
  </main>`;

  return layout({
    title: `${SITE_NAME} · ${SITE_TAGLINE}｜口算题 乘法表 田字格 笔顺 单位换算 可打印`,
    description: '免费生成一年级20以内口算题、100以内加减法、九九乘法表、田字格字帖、四线三格、汉字笔顺部首组词、认识钟表与人民币换算、小学单位换算表。打开即用，A4 直接打印。',
    canonical: '/',
    body,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME,
      description: SITE_TAGLINE, url: `${SITE_URL}/`, inLanguage: 'zh-CN',
      potentialAction: { '@type': 'SearchAction', target: '/?q={search_term_string}', 'query-input': 'required name=search_term_string' },
    },
    scripts: ['/app.js'],
  });
}

export function toolPage(tool, tools, initialResult, controlsHtml) {
  const related = (tool.related || []).map((slug) => tools.find((t) => t.slug === slug)).filter(Boolean);
  const crumb = breadcrumb([
    { name: '首页', href: '/' }, { name: tool.stage, href: `/#stage-${tool.stage}` }, { name: tool.short },
  ]);
  const relatedHtml = related.length ? `<div class="related"><h2>相关的几页</h2><ul class="related-list">${related.map((t) => `<li><a href="/tools/${esc(t.slug)}/">${esc(t.short)}</a></li>`).join('')}</ul></div>` : '';

  const body = `
  <main class="wrap">
    ${crumb}
    <h1 class="page-title">${esc(tool.title)}</h1>
    <p class="page-lede">${esc(tool.desc)}</p>

    <section class="tool-box" id="tool-root" aria-label="工具结果">
      <div class="tool-head"><span class="label">结果 · 已生成，可直接打印</span><button class="btn ghost no-print" data-action="print">打印</button></div>
      <div class="result-slot" id="result-slot">${initialResult}</div>
      <div class="tool-controls no-print">${controlsHtml}</div>
    </section>

    <section class="prose">
      <h2>怎么用这一页</h2>
      <p>上面的结果已经排好版，点「打印 / 存为 PDF」就是一张 A4 练习纸；需要新的一套，点「换一批」。选项（题量、类型、每行几题）改完会自动重新生成。</p>
      <p>答案默认收在结果下方的折叠区里，打印时会单独成页，方便家长或老师核对。如果想让孩子直接看到得数，勾上「题后直接显示答案」即可。</p>
      <p>这一页面向${esc(tool.grade)}，属于「${esc(tool.stage)}」这一段。同段的其它工具放在页面下方，可以顺着点过去。</p>
    </section>
    ${relatedHtml}
  </main>`;

  return layout({
    title: `${tool.title} - ${SITE_NAME}`,
    description: tool.desc,
    canonical: `/tools/${tool.slug}/`,
    body,
    extraHead: `\n  <meta name="keywords" content="${esc(tool.keywords.join(', '))}">`,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.short,
      description: tool.desc, applicationCategory: 'EducationalApplication',
      operatingSystem: '任意浏览器', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
      inLanguage: 'zh-CN',
    },
    scripts: ['/tool-client.mjs'],
  });
}

export function hanziPage(h, allHanzi) {
  const crumb = breadcrumb([
    { name: '首页', href: '/' }, { name: '一年级常用生字', href: '/#hanzi' }, { name: `${h.c} 字` },
  ]);
  const seqHtml = h.seq.map((s, i) => `<li><b>第${i + 1}笔</b>${esc(s)}</li>`).join('');
  const wordsHtml = h.w.map((w) => `<li>${esc(w)}</li>`).join('');
  const sameRadical = allHanzi.filter((x) => x.r === h.r && x.c !== h.c).slice(0, 12);
  const sameRadicalHtml = sameRadical.length
    ? `<div class="related"><h2>同是「${esc(h.r)}」部的字</h2><ul class="related-list">${sameRadical.map((x) => `<li><a href="/hanzi/${esc(x.slug)}/">${esc(x.c)}（${x.n} 画）</a></li>`).join('')}</ul></div>`
    : '';

  const body = `
  <main class="wrap">
    ${crumb}
    <h1 class="page-title">「${esc(h.c)}」字几画？笔顺、部首、组词一次看清</h1>
    <p class="page-lede">${esc(h.c)}，读 ${esc(h.p)}，共 ${h.n} 画，${esc(h.s)}，部首是「${esc(h.r)}」。下面是笔顺分步、常用组词和田字格范字，可打印成字卡。</p>

    <section class="tool-box">
      <div class="tool-head"><span class="label">字卡 · 可打印</span><button class="btn ghost no-print" data-action="print" onclick="window.print()">打印</button></div>
      <div class="result-slot">
        <div class="hz-hero">
          <div class="hz-big"><div class="tian model">${esc(h.c)}</div></div>
          <div class="hz-info">
            <dl class="hz-facts">
              <div class="hz-fact"><dt>读音</dt><dd>${esc(h.p)}</dd></div>
              <div class="hz-fact"><dt>共几画</dt><dd>${h.n} 画</dd></div>
              <div class="hz-fact"><dt>部首</dt><dd>${esc(h.r)}</dd></div>
              <div class="hz-fact"><dt>结构</dt><dd>${esc(h.s)}</dd></div>
            </dl>
            <h3 style="font-family:var(--serif);font-size:17px;margin:16px 0 4px">笔顺（${h.n} 笔，按这个顺序写）</h3>
            <ol class="hz-seq">${seqHtml}</ol>
            <h3 style="font-family:var(--serif);font-size:17px;margin:18px 0 4px">常用组词</h3>
            <ul class="hz-words">${wordsHtml}</ul>
          </div>
        </div>
        ${h.tip ? `<div class="hz-tip"><b>记一记：</b>${esc(h.tip)}</div>` : ''}
      </div>
    </section>

    <section class="prose">
      <h2>写这个字要注意什么</h2>
      <p>「${esc(h.c)}」是${esc(h.s)}，一共 ${h.n} 笔，部首查「${esc(h.r)}」。笔顺按上面的顺序写：${esc(h.seq.join('、'))}。</p>
      <p>刚学写字时，先看清田字格里的位置，再一笔一笔对照笔顺写。可以配合<a href="/tools/tianzige-zitie/">田字格字帖生成器</a>把这个字排成一整行，描红几格再自己写。</p>
      <p>这一页是「一年级常用生字」里的第 ${allHanzi.indexOf(h) + 1} 个字，全套 ${allHanzi.length} 字在<a href="/#hanzi">首页生字表</a>里，也可以从<a href="/tools/hanzi-chaxun/">笔画笔顺查询表</a>按部首筛。</p>
    </section>
    ${sameRadicalHtml}
  </main>`;

  return layout({
    title: `「${h.c}」字几画？${h.c}的笔顺、部首、结构、组词 - ${SITE_NAME}`,
    description: `${h.c}字共${h.n}画，读音${h.p}，部首${h.r}，${h.s}。笔顺：${h.seq.join('、')}。常用组词：${h.w.join('、')}。附田字格范字，可打印成字卡。`,
    canonical: `/hanzi/${h.slug}/`,
    body,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Article', headline: `「${h.c}」字几画？笔顺、部首、组词`,
      description: `${h.c}字共${h.n}画，部首${h.r}，笔顺：${h.seq.join('、')}。`,
      inLanguage: 'zh-CN',
    },
  });
}
