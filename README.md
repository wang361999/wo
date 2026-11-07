# 一页工具

纯前端、零依赖的在线工具箱静态站。所有计算与文件处理都在浏览器里完成，**没有文件上传接口、不用登录、不依赖外部 CDN**。站点另有一套匿名访问计数（只记事件类型与工具编号，不采集输入内容），经同源 `/api/stats` 落在 Vercel 连接的免费 Redis 里，用于实时在线人数与工具热度榜，详见「真实统计」。

工具清单与分类参考自 [365工具箱](https://www.toolbox365.cn/) 的公开目录：**286 个工具 / 10 个功能分类，已全部接入**。每个工具都有独立网址 `/tools/<id>/`、一个真实模块 `src/tools/<id>.js`，点开就能跑，没有占位卡片、没有空壳页。

## 跑起来

```bash
node gen/generate.mjs    # 由 gen/spec-*.mjs 生成 src/tools/*.js（改了规格才需要跑）
node build.mjs           # 生成 dist/
```

零依赖，不需要 `npm install`。本地预览随便起个静态服务指向 `dist/` 即可（工具模块用绝对路径 `/t/<id>.js`，必须走 HTTP，不能用 `file://` 直接打开）。

## 实现档位

286 个工具都能打开使用，但实现路径不同。首页角标、工具页说明会如实标注档位：

| 档位 | 数量 | 含义 |
|---|---:|---|
| 纯本地 | 217 | 只用浏览器原生 API（canvas / WebCrypto / WebAudio / MediaRecorder 等）计算，零依赖 |
| 本地库 | 37 | 处理库已随站点打包在 `/vendor/`，首次使用只是加载本地脚本，不联网、不上传文件 |
| 离线精简 | 32 | 内置精简数据集或语料，够日常速查，但不是完整官方数据，边界写在工具里 |

本地处理库共 17 个文件（`pdf-lib`、`pdf.js`、JSZip、SheetJS、KaTeX + 20 个字体、marked、sql.js/wasm、opentype.js、alasql、gif.js、tesseract.js、qrcode、JsBarcode），全部在 `public/vendor/`，构建时递归复制进产物。

## 结构

```
src/data/catalog.mjs      注册表：11 条 CATS（含 all）+ 端分级 + 286 条工具（mode 档位）
src/data/theme.mjs        10 个分类的配色与图标（工具宫格 / 热度榜 / 最近使用共用）
src/templates/layout.mjs  全站布局、品牌头、页脚与移动端底部导航
src/templates/home.mjs    门面（图标宫格 + 实时数据 + 热度榜 + 286 张工具卡片 + 分类静态链接）
src/templates/category.mjs 分类落地页（静态工具清单 + 热度榜）
src/templates/tool.mjs    工具页工作台壳（静态说明、FAQ、同类内链、使用次数）
src/templates/seo.mjs     全站 title / description / JSON-LD 生成
src/static/style.css      图标驱动的工具站主题 + 单套响应式 + 286 个工具共用组件
src/static/app.js         门面交互：搜索、两级筛选、计数联动、/ 快捷键
api/stats.js              同源统计接口（Vercel Function）：自动选数据源、读写与校验
src/static/stats.js       匿名统计：只跟 /api/stats 通信，负责上报、心跳、实时数据与热度榜渲染
src/static/ui.js          底部导航、分享、回顶
src/static/tool.js        工具页加载器：按 data-tool 动态 import 模块
src/static/kit.js         工具运行时：formTool / customTool / 复制下载吸底等 helper
src/static/engines.js     refTool / fileTool / gamePanel + PDF·音频·二维码等公用件
src/static/core.js        零依赖通用函数库（编码、哈希、日期、财务、单位、颜色…）
src/static/data.js        离线精简数据集（词频、古诗词、端口、税率、汇率…）
src/tools/<id>.js         286 个工具模块，统一导出 mount(root)；30 个手写 + 256 个生成
gen/spec-*.mjs            11 份工具规格（S['id'] = {...}），按 kind 编译成模块
gen/generate.mjs          规格编译器：ser() 序列化 spec，写 src/tools/*.js
src/lib/zip.js            原生 JS 手写 ZIP（store + CRC32）
public/vendor/            本地处理库、KaTeX 字体与本地固化的云 SDK 浏览器构建
build.mjs                 读注册表 → 生成 297 个页面 / 资源 / tools-map.js / sitemap / robots / og.png
scripts/seo-check.mjs     构建期产物体检：元信息、canonical、内链、孤岛页、sitemap 一致性
```

## 两级分类

- **第一级**：全部 / 电脑端 / 手机端。工具标 `dev`（`pc` / `mobile` / `both`），切一级时二级计数联动。
- **第二级**：10 个功能分类（导航资源、PDF 工具、图片、音频/视频、文本与开发、中文语言、生活与杂务、财务与计算、CSS 生成器、益智游戏）。

视觉是**图标驱动的工具站**：浅灰底 + 白卡片 + 10 个分类各自的柔和色图标 + 单一稳重蓝（`#2f5bd7`），不是文字目录。首页自上而下是紧凑标题与大搜索框、**实时数据条**（当前在线 / 历史访问 / 独立访客 / 使用人数）、8 格常用工具图标宫格、最近使用、按真实次数排序的热度榜、10 个分类入口，最后才是 286 个工具的筛选索引。工具页有彩色分类图标、本工具使用次数、工作台、热度榜与同类工具图标清单。

**移动端按 App 的信息架构做**：底部固定四栏 TabBar（首页 / 分类 / 榜单 / 搜索）、4 列九宫格快捷入口、2×2 紧凑数据卡、可横滑的热度榜卡片、工具页右下角竖排圆形悬浮操作（首页 / 分享 / 回顶），`viewport-fit=cover` 适配安全区。仍是**一套自适应响应式**，没有电脑端 / 手机端两套 DOM。

286 个工具通过 CSS 变量（`--paper` / `--ink` / `--line` / `--accent`…）跟着换肤，模块本身一行不改。按 `/` 可直接聚焦搜索。

## 加一个工具（三步，壳不用改）

1. `src/data/catalog.mjs`：加一行工具（含 `cat` / `dev` / `icon` / `desc` / `tags`）；
2. 简单工具在任一 `gen/spec-*.mjs` 里写 `S['id'] = {...}`（`kind` 支持 `form` / `custom` / `ref` / `file`），复杂工具直接手写 `src/tools/<id>.js` 导出 `mount(root)`；
3. `node gen/generate.mjs && node build.mjs`：自动生成 `/tools/<id>/` 独立页并加入 sitemap。

`generate.mjs` 和 `build.mjs` 各有一道防线：**注册表里任意一个工具缺少模块就直接报错退出**，杜绝「索引能点、页面空白」。

> 生成器只序列化函数体，不会把 spec 文件里的顶层 helper / 常量带进产物。需要跨函数复用的东西都放在 `src/static/engines.js` 并由 `generate.mjs` 的 HEAD 导入；模板字符串里不要引用 spec 顶层常量，否则浏览器里会 `ReferenceError`。

## 真实统计（匿名计数）

页面上的四个数字与热度榜都来自 Vercel 项目连接的免费数据库，没有写死的假数据：

| 页面显示 | 口径 |
|---|---|
| 当前在线 | 45 秒内有心跳的匿名会话数（心跳每 30 秒一次，页面隐藏时暂停） |
| 历史访问人次 | `visit` 事件累计数（`INCR`） |
| 独立访客 | 访问会话去重（`PFCOUNT`） |
| 工具使用人数 | 用过任意工具的会话去重（`PFCOUNT`） |
| 累计使用次数 / 热度榜 | `use` 事件累计数，按工具 `ZINCRBY` 累加、`ZREVRANGE` 降序 |

- 存储在 **Vercel Marketplace 的 Upstash for Redis 免费层**（资源 `gitd-stats`，区域 `iad1`，每月 50 万条命令）。连接串由 Vercel 以 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 自动注入项目，既不在代码里，也不下发到浏览器。
- 浏览器只跟同源 `/api/stats` 通信（`api/stats.js`，Vercel Function），不加载任何云 SDK，因此没有跨域与 Origin 校验问题。接口按环境变量自动选数据源：Upstash Redis → Neon/Postgres → 已建好的云服务表（兜底）。
- 同一浏览器会话内，访问和「每个工具的使用」各只计一次（`sessionStorage` 去重）；页面每 30 秒刷新一次，切回前台立即刷新。
- 匿名标识是本机 `localStorage` 里的随机 id，没有账号、没有 Cookie 跟踪。上报字段只有事件类型、工具编号、随机会话 id，**不含任何工具输入内容**。
- 读不到统计服务时显示「—」并给出提示，绝不用假数字填充。
- `build.mjs` 会生成 `tools-map.js`，供热度榜把工具 id 映射成名称与分类色。

## 部署（Vercel）

`vercel.json` 已配好 `buildCommand: node build.mjs`、`outputDirectory: dist`、`framework: null`，导入仓库即可，无需手填构建命令。根目录下的 `api/stats.js` 会作为 Vercel Function 一起发布；统计数据库在 Dashboard → Storage 创建并 Connect 到项目即可，环境变量由集成自动注入，不需要手动填。

正式域名写在 `build.mjs` 顶部的 `PRODUCTION_SITE_URL`，当前是 `https://www.gitd.cn`。根域 `gitd.cn` 在 Vercel 上 308 跳到 `www.gitd.cn`，所以全站 canonical、`og:url`、sitemap、robots 与 JSON-LD 统一用 www 这一套，不产生重复 URL。Vercel 构建直接读这个常量，**不需要在 Dashboard 配环境变量**；本地构建默认 `http://localhost:3000`，也可用 `SITE_URL=... node build.mjs` 覆盖。换域名时改常量或设 `SITE_URL`。

`public/` 下放需要直接进产物根目录的自定义文件（目录内有 `.gitkeep` 保证 Git 跟踪；构建会跳过点文件、递归复制子目录）。

## 诚实边界

纯静态站承接不了的能力不做假装支持，边界写在对应工具页里。主要包括：

- **PDF**：标准「打开密码」需要 qpdf，本站用自定义 AES-GCM `.pdfenc` 容器；中文水印/页码因标准字体不支持会回退数字；压缩重渲染会丢文字层。
- **音视频**：浏览器不能本地编码 MP3 / AAC / MP4 / H.264，音频统一导出 WAV，视频 / 录屏 / 音轨提取统一导出 WebM；`MediaRecorder` 重录是实时的，处理时长约等于素材时长。
- **OCR**：主程序本地，语言模型首次使用可能需要联网下载。
- **图片**：证件照 / 抠图是颜色容差处理，不是 AI 人像分割；GIF 拆帧只给首帧。
- **离线数据**：COCA 词频、古诗词、垃圾分类、嘌呤、DNS / NTP、汇率、税率、端口、正则、Git 命令、手机号段等均为内置精简版，不是完整官方语料或实时接口。
- **设备与游戏**：跨设备摄像头串流没有信令服务器，不做假的 WebRTC；汉字笔顺不内置官方笔顺库（田字格描红 + 轨迹回放）；国际象棋开局是近似摆子、不是完整合法走子引擎；魔方教程是 2D 六面展开图 + CFOP 公式速查、不是 3D 模拟器。
- **其它**：加密 ZIP 是自定义 `.enc` 容器而非标准加密 ZIP；Parquet 只读 Footer 元数据；字体工具只做字形检查 / SVG 轮廓，不做完整子集化；Mermaid / Markmap 是轻量实现；保持音调不变的 time-stretch 未内置。

## 数据来源说明

分类结构、工具名称与 `platform` 标记来自参考站公开目录，属事实性索引；卡片描述为改写后的中性功能摘要，未照搬原文案。所有工具的实现均为本站独立编写（canvas / Web API / 原生 JS / 本地打包的开源库），未使用参考站代码或资源。

## SEO

产物共 297 个静态页：1 首页 + 10 分类页 + 286 工具页。每页有独立 title / description / canonical，带 OG 与 Twitter Card；结构化数据全部在 `<head>`：首页 `WebSite`、分类页 `CollectionPage + ItemList + BreadcrumbList`、工具页 `WebApplication + BreadcrumbList`。

- **描述清洗**：注册表里不少 `desc` 是抓取时截断的残句（结尾半个英文词、孤立数字、多余斜杠）。`src/templates/seo.mjs` 的 `cleanDesc()` 先整理成可读中文，再按 10 个分类 × 3 档实现档位拼差异化描述，`fit()` 按预算整段裁剪，不留下半截词。卡片、分类页、相关工具区复用同一份清洗结果。
- **分类落地页**：`/cat/<id>/` 是真实静态页，首页底部有静态分类链接区（筛选按钮爬虫点不了），工具页面包屑与「同类工具」的「查看全部」都指回分类页。「同类工具」按 id 哈希环形取 6 个，不再固定取注册顺序前 3 个，避免两百多个工具收不到内链。
- **工具页静态正文**：除用法外补了「关于这个工具」与 3 条常见问题，内容按工具名、分类、端分级、实现档位变化，缓解 286 页共用一套模板文字的问题。工具模块仍是打开时才动态加载。
- **sitemap / robots**：`sitemap.xml` 只写 `loc`。旧版 287 条 `lastmod` 全用构建当天，等于每次发版都宣称全站改过，不可靠的 lastmod 会被忽略，索性不写；`changefreq` / `priority` 同样被忽略。`robots.txt` 明确放行 `/t/` 与 `/vendor/`，保证爬虫能取到工具模块完成渲染。
- **分享图**：`og.png` 由 `gen/og.mjs` 用 Node 内置 `zlib` 手写 PNG 生成，26×11 = 286 个方块对应 286 个工具，不引图像库、不依赖系统字体。

`scripts/seo-check.mjs` 在每次构建末尾体检真实产物：title / description 缺失、重复或过短，canonical 不自洽，缺 OG / JSON-LD，占位域名残留，内部死链，孤岛页，sitemap 与页面集合不一致 —— 任一项不过就构建失败。也可单独跑 `npm run check:seo`。
