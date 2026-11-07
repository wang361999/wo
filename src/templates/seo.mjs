// SEO 元信息：注册表里的功能摘要是抓取来的，常带截断点（半个英文词、结尾斜杠、孤立数字）。
// 这里统一清洗成能读的中文，再按页面类型生成 title / description / 结构化数据，
// 保证 287+ 个页面各有可读且不雷同的元信息，不让残句直接进 <meta>。
import { CAT_MAP, MODE_NAME, DEV_NAME } from '../data/catalog.mjs';

export const SITE_NAME = '一页工具';
export const SITE_TAGLINE = '打开就能用 · 文件不上传';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// JSON-LD 里不能出现裸 </script>，否则会提前闭合脚本块
export const jsonLdSafe = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

/* 分类的差异化文案：title 关键词、description 尾句、分类页导语。
   没有这些，286 个 meta 会退化成同一个模板，容易被判为批量生成的 doorway 页。 */
export const CAT_SEO = {
  nav:     { kw: '在线速查与资料表', line: '常用的开发资料整理成一页，查得到也复制得走。', intro: '镜像源、端口、DNS、HTTP 头、大模型 API……这些每次要用时都得翻一遍的东西，摊到一页里。做成能搜、能点、能复制的速查表，不用来回切标签页。' },
  pdf:     { kw: '免费在线 PDF 工具', line: '不用装软件，PDF 直接在浏览器里处理。', intro: '合并、拆分、转图片、加水印、加页码、压缩、加解密。这些平时要开个软件才能做的琐事，在这里拖进来就能做完，文件从头到尾没离开过你的设备。' },
  image:   { kw: '在线图片处理工具', line: '图片裁剪、转换、压缩都在本地完成，原图不会外传。', intro: '改尺寸、切九宫格、转格式、压缩、取色、生成占位图。图片类操作最怕上传，这里全部交给浏览器 canvas，点完直接下载。' },
  media:   { kw: '在线音视频处理工具', line: '录音、转码与剪辑在浏览器里完成，音频文件不离开设备。', intro: '录音、格式转换、剪辑拼接、频谱与波形查看，还有几个和设备有关的测试小工具。麦克风和文件都只在本机用。' },
  dev:     { kw: '在线文本与开发工具', line: '编码转换、格式化、校验这类零碎活，粘进来就有结果。', intro: '编码解码、JSON 格式化、正则、哈希、时间戳、UUID、命名风格转换。写东西时顺手要用的那一把小刀，不用再去搜一个不知谁的在线站。' },
  chinese: { kw: '在线中文处理工具', line: '汉字、拼音、成语与古籍相关的查询转换，随手就能用。', intro: '生僻字、多音字、成语、诗词、人民币大写、简繁转换、字帖打印。中文语境里那些不好用通用工具解决的零碎需求。' },
  life:    { kw: '在线生活计算工具', line: '日常要算的那点数字，填进去立刻出结果。', intro: '年龄、日期、单位、BMI、时区、倒计时、抽签、单位换算。都是不用动脑但要算一下的事，打开填两个空就行。' },
  finance: { kw: '在线财务计算工具', line: '算清利息、税额、汇率这些数字，输入留在自己设备上。', intro: '个税、房贷、复利、含税价拆分、汇率换算、资产负债。数字比较敏感，所以全部在你自己的浏览器里算，不往任何服务器发。' },
  css:     { kw: '在线 CSS 代码生成器', line: '调好参数即时预览，复制生成的 CSS 就能用。', intro: '渐变、阴影、圆角、边框、动画、字体排版。调滑块看效果，代码实时给，复制粘贴进项目即可，不用记那一堆属性顺序。' },
  puzzle:  { kw: '在线益智小游戏', line: '点开就玩，不需要注册，也不记录成绩。', intro: '反应速度、色觉、听辨、记忆、手眼协调这一类小测试。不排名、不登录、不存数据，就是点开玩两分钟。' },
};
const DEFAULT_SEO = { kw: '免费在线工具', line: '打开就能用，不用注册。', intro: '一组打开就能用的小工具。' };

const MODE_SEO = {
  local:  '纯浏览器本地计算，零依赖。',
  vendor: '处理库已打包在站内，首次使用也不联网。',
  lite:   '内置精简数据集，够日常速查。',
  api:    '实时数据经本站接口取回并缓存，文件不上传。',
};

/* 把 "pip/npm/... 等 33 个工具、清华/阿里/华为/" 这类残句整理成 "A、B、C"。
   只做可读性清洗，不臆造功能：切段、去掉尾部残缺标点、丢掉明显的半截词。 */
export function cleanDesc(raw = '') {
  let s = String(raw).replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*、\s*/g, '、').replace(/\s*，\s*/g, '，').replace(/\s*；\s*/g, '；');
  let parts = s.split(/[、，,；;]/).map((x) => x.trim()).filter(Boolean);
  parts = parts
    .map((p) => p.replace(/[\/|、，,;；\s]+$/g, '').trim())
    .filter((p) => p.length >= 2)
    .filter((p) => !/^[A-Za-z0-9]{1,2}$/.test(p))
    // 结尾的半截英文词，例如 "IPv4/IPv6/DoH/Do"、"GPT-5/Claude/Gemini/DeepSeek/Q"
    .map((p) => {
      const seg = p.split('/');
      if (seg.length > 2 && /^[A-Za-z]{1,2}$/.test(seg[seg.length - 1])) return seg.slice(0, -1).join('/');
      return p;
    });
  const out = parts.slice(0, 5).join('、');
  return out || '常用功能';
}

function clip(s, max = 118) {
  const chars = [...s];
  if (chars.length <= max) return s;
  const a = chars.slice(0, max);
  const cut = Math.max(a.lastIndexOf('。'), a.lastIndexOf('，'), a.lastIndexOf('、'));
  const out = cut > max * 0.6 ? a.slice(0, cut + 1).join('') : a.join('');
  return out.replace(/[、，]$/, '') + '…';
}

/* 按预算裁功能点，优先整段丢弃，绝不留下 "Pretty/Re"、"导出 Parq" 这种半截词。
   注册表里有几条 desc 接近 60 字，硬裁会把英文词切一半，比截断更难看。 */
function fit(s, max) {
  if ([...s].length <= max) return s;
  const parts = s.split('、');
  const kept = [];
  for (const p of parts) {
    const next = kept.length ? `${kept.join('、')}、${p}` : p;
    if ([...next].length > max) break;
    kept.push(p);
  }
  if (kept.length) return kept.join('、');
  let a = [...s].slice(0, max).join('');
  a = a.replace(/[\/、，：:][^\/、，：:]{0,3}$/, '');
  a = a.replace(/(?<=[\/\s])[A-Za-z]{1,4}$/, '');
  return a.replace(/[\/、，：:\s]+$/, '') || s.slice(0, max);
}

const catSEO = (id) => CAT_SEO[id] || DEFAULT_SEO;

export function homeMeta(siteUrl) {
  return {
    title: `${SITE_NAME} - 286 个免费在线小工具，打开就能用、文件不上传`,
    desc: '286 个免费在线工具，覆盖 PDF、图片、音视频、文本开发、中文、生活计算、财务、CSS 与益智游戏 10 类。全部在浏览器本地运行，文件不上传、无需登录、不依赖外部 CDN。',
    canonical: `${siteUrl}/`,
  };
}

export function categoryMeta(cat, tools, siteUrl) {
  const seo = catSEO(cat.id);
  const names = tools.slice(0, 5).map((t) => t.name).join('、');
  return {
    title: `${cat.name} - ${tools.length} 个免费在线工具 | ${SITE_NAME}`,
    // intro 是给分类页正文用的，meta 另写短句，别把长导语截一半塞进 description
    desc: clip(`${cat.name}：${names}等 ${tools.length} 个工具，在线免费使用。${seo.line}全部在浏览器本地运行，文件不上传、无需登录，打开即用。`, 118),
    canonical: `${siteUrl}/cat/${cat.id}/`,
  };
}

export function toolMeta(t, siteUrl) {
  const seo = catSEO(t.cat);
  const tail = `${seo.line}${MODE_SEO[t.mode] || ''}文件不上传、无需登录，打开即用。`;
  const head = `${t.name}：`;
  const budget = Math.max(24, 116 - [...head].length - [...tail].length);
  return {
    title: `${t.name} - ${seo.kw} | ${SITE_NAME}`,
    desc: `${head}${fit(cleanDesc(t.desc), budget)}。${tail}`,
    canonical: `${siteUrl}/tools/${t.id}/`,
  };
}

export function homeJsonLd(siteUrl, desc) {
  return {
    '@context': 'https://schema.org', '@type': 'WebSite',
    name: SITE_NAME, description: desc, url: `${siteUrl}/`, inLanguage: 'zh-CN',
  };
}

export function categoryJsonLd(cat, tools, siteUrl, desc) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', name: `${cat.name} - ${SITE_NAME}`,
        description: desc, url: `${siteUrl}/cat/${cat.id}/`, inLanguage: 'zh-CN',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${siteUrl}/` },
        mainEntity: {
          '@type': 'ItemList', numberOfItems: tools.length,
          itemListElement: tools.map((t, i) => ({
            '@type': 'ListItem', position: i + 1, name: t.name, url: `${siteUrl}/tools/${t.id}/`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: cat.name, item: `${siteUrl}/cat/${cat.id}/` },
        ],
      },
    ],
  };
}

export function toolJsonLd(t, siteUrl, desc) {
  const cat = CAT_MAP[t.cat] || { name: '其它' };
  const url = `${siteUrl}/tools/${t.id}/`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication', name: t.name, description: desc, url,
        applicationCategory: 'UtilitiesApplication', operatingSystem: '任何支持 JavaScript 的现代浏览器',
        browserRequirements: '需要启用 JavaScript', inLanguage: 'zh-CN',
        isAccessibleForFree: true, featureList: cleanDesc(t.desc),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: cat.name, item: `${siteUrl}/cat/${cat.id}/` },
          { '@type': 'ListItem', position: 3, name: t.name, item: url },
        ],
      },
    ],
  };
}

export { MODE_NAME, DEV_NAME };
