# 一页工具

零依赖的在线工具箱静态站：**282 个工具的计算与文件处理全在浏览器里完成**，另外 4 个实时数据类工具经本站同源接口取数。**没有文件上传接口、不用登录、不依赖外部 CDN**。站点还有一套匿名计数（只记事件类型与工具编号，不采集输入内容）和一组同源数据接口，落在 Vercel 连接的免费 Redis 上，详见「真实统计」与「边缘工具升级」。

本站收录 **286 个工具 / 10 个功能分类，已全部接入**。每个工具都有独立网址 `/tools/<id>/`、一个真实模块 `src/tools/<id>.js`，点开就能跑，没有占位卡片、没有空壳页。实现边界写在文末「实现与数据说明」。

## 跑起来

```bash
npm run gen              # 由 gen/spec-*.mjs 生成 src/tools/*.js（改了规格才需要跑）
npm run build            # 生成 dist/，末尾自动跑 SEO 体检
npm run check:api        # 4 个同源接口的离线回归测试，不需要网络与凭据
npm run check            # 上面两项一起跑
```

零依赖，不需要 `npm install`。本地预览随便起个静态服务指向 `dist/` 即可（工具模块用绝对路径 `/t/<id>.js`，必须走 HTTP，不能用 `file://` 直接打开）。同源接口是 Vercel Functions，本地静态服务下 `/api/*` 会 404，页面会自动显示「—」，不会用假数字填充；要测接口逻辑跑 `npm run check:api` 就行。

> Windows 注意：`generate.mjs` 动态导入 spec 时必须把绝对路径转成 `file://` URL，否则 Node ESM 会报 `ERR_UNSUPPORTED_ESM_URL_SCHEME`（已修）。仓库加了 `.gitattributes` 统一 `eol=lf`，避免 `core.autocrlf=true` 时重跑一次生成器就在 `git status` 里冒出 256 个换行符假改动。

## 实现档位

286 个工具都能打开使用，但实现路径不同。首页角标、工具页说明会如实标注档位：

| 档位 | 数量 | 含义 |
|---|---:|---|
| 纯本地 | 213 | 只用浏览器原生 API（canvas / WebCrypto / WebAudio / MediaRecorder 等）计算，零依赖 |
| 本地库 | 37 | 处理库已随站点打包在 `/vendor/`，首次使用只是加载本地脚本，不联网、不上传文件 |
| 离线精简 | 32 | 内置精简数据集或语料，够日常速查，但不是完整官方数据，边界写在工具里 |
| 在线数据 | 4 | 经本站同源接口取实时数据，服务端短期缓存；查询词会送到服务端，但不落库、不关联身份 |

本地处理库共 17 个文件（`pdf-lib`、`pdf.js`、JSZip、SheetJS、KaTeX + 20 个字体、marked、sql.js/wasm、opentype.js、alasql、gif.js、tesseract.js、qrcode、JsBarcode），全部在 `public/vendor/`，构建时递归复制进产物。

## 结构

```
src/data/catalog.mjs      注册表：11 条 CATS（含 all）+ 端分级 + 286 条工具（mode 档位）
src/data/theme.mjs        10 个分类的配色与图标（工具宫格 / 热度榜 / 最近使用共用）
src/templates/layout.mjs  全站布局、品牌头、页脚与移动端底部导航
src/templates/home.mjs    门面（图标宫格 + 实时数据 + 我的工具 + 热度榜 + 286 张工具卡片 + 分类静态链接）
src/templates/category.mjs 分类落地页（静态工具清单 + 热度榜）
src/templates/tool.mjs    工具页工作台壳（静态说明、FAQ、同类内链、使用次数、收藏）
src/templates/seo.mjs     全站 title / description / JSON-LD 生成
src/static/style.css      图标驱动的工具站主题 + 单套响应式 + 286 个工具共用组件
src/static/app.js         门面交互：搜索、两级筛选、计数联动、/ 快捷键
server/store.mjs          Vercel Functions 共享层：Redis REST 客户端、同源校验、限流、缓存（不在 api/ 下，不会被当路由）
api/stats.js              匿名计数：GET 只读概览 + 热度榜，POST 上报 / 心跳，带防刷与服务端去重
api/net.js                IP / 域名查询：CDN 边缘地理头 + 公开 IP 库 + DoH 解析，按结果缓存
api/fx.js                 实时汇率：公开牌价 + 6 小时缓存 + 每日快照序列
api/sync.js               跨设备同步：同步码存收藏 / 最近使用，只存工具 id
api/links.js              友情链接：提交申请、抓对方首页验回链、自动上线 / 每日复核 / 撤链自动下架
api/links-verify.js       每日复核的薄入口，转发到 /api/links?job=verify
.github/workflows/        每日定时触发复核接口的 GitHub Actions 工作流
src/static/stats.js       匿名统计前端：上报、心跳、实时数据 / 热度榜渲染、本地清单
src/static/sync.js        跨设备同步前端：生成 / 连接同步码、上传 / 拉取、收藏按钮
src/static/links.js       友链前端：渲染已通过的友链、提交申请、复制回链代码、惰性触发复核
src/static/ui.js          底部导航、分享、回顶
src/static/tool.js        工具页加载器：按 data-tool 动态 import，检测真实交互后派发使用事件
src/static/kit.js         工具运行时：formTool / customTool / 复制下载吸底等 helper
src/static/engines.js     refTool / fileTool / gamePanel + PDF·音频·二维码等公用件
src/static/core.js        零依赖通用函数库（编码、哈希、日期、财务、单位、颜色…）
src/static/data.js        离线精简数据集（词频、古诗词、端口、税率…）
src/tools/<id>.js         286 个工具模块，统一导出 mount(root)；30 个手写 + 256 个生成
gen/spec-*.mjs            11 份工具规格（S['id'] = {...}），按 kind 编译成模块
gen/generate.mjs          规格编译器：ser() 序列化 spec，写 src/tools/*.js
src/lib/zip.js            原生 JS 手写 ZIP（store + CRC32）
public/vendor/            本地处理库与 KaTeX 字体
build.mjs                 读注册表 → 生成 297 个页面 / 资源 / tools-map.js / sitemap / robots / og.png
scripts/seo-check.mjs     构建期产物体检：元信息、canonical、内链、孤岛页、sitemap 一致性
scripts/api-selftest.mjs  6 个同源接口的离线回归测试（内存 Redis + 假上游 + 假对方首页）
```

## 两级分类

- **第一级**：全部 / 电脑端 / 手机端。工具标 `dev`（`pc` / `mobile` / `both`），切一级时二级计数联动。
- **第二级**：10 个功能分类（导航资源、PDF 工具、图片、音频/视频、文本与开发、中文语言、生活与杂务、财务与计算、CSS 生成器、益智游戏）。

视觉是**图标驱动的工具站**：浅灰底 + 白卡片 + 10 个分类各自的柔和色图标 + 单一稳重蓝（`#2f5bd7`），不是文字目录。首页自上而下是紧凑标题与大搜索框、**实时数据条**（当前在线 / 历史访问 / 独立访客 / 使用人数）、8 格常用工具图标宫格、我的工具（收藏 + 最近用过 + 跨设备同步入口）、按真实次数排序的热度榜、10 个分类入口，最后才是 286 个工具的筛选索引。工具页有彩色分类图标、本工具使用次数、收藏按钮、工作台、热度榜与同类工具图标清单。

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
| 当前在线 | 45 秒内有心跳的匿名会话数（`ZCOUNT` 只读；心跳每 30 秒一次，页面隐藏时暂停） |
| 历史访问人次 | `visit` 事件累计数（`INCR`），同一 sid 一天只计一次 |
| 独立访客 | 访问会话去重（`PFCOUNT`） |
| 工具使用人数 | 用过任意工具的会话去重（`PFCOUNT`） |
| 累计使用次数 / 热度榜 | `use` 事件累计数，按工具 `ZINCRBY` 累加、`ZREVRANGE` 降序 |

**「使用」不是「打开页面」。** 工具模块挂载后，用户第一次点按 / 输入 / 改动 / 按键才由 `tool.js` 派发 `op:tool-used`，这时才上报；只看不碰不会进热度榜。打开工具页只记进本地「最近用过」。

防刷与配额（这一版重点修的）：

- 写操作要过三关：**同源校验**（`Origin` / `Referer`）、**IP 固定窗口限流**、**服务端 sid 去重**（`SET NX EX`，visit 一天、use 七天）。初版任何人 `curl` 一下就能把访问量和热度榜刷上去，现在重放同一个 sid 不会重复累加。
- **GET 全程不改统计数据**：在线数用 `ZCOUNT` 而非 `ZREMRANGEBYSCORE + ZCARD`，惰性清理挪到心跳里并加 60 秒闸门。响应带 `s-maxage=10`，前端 GET 不再带 `no-store`，CDN 能合并读请求。
- 接口不再回传环境变量名，代码里没有硬编码凭据，也删掉了永远连不上的 Postgres / 云服务兜底死代码。
- 连续读失败时前端退避 2 分钟，不空转；读不到就显示「—」，绝不用假数字填充。

其余约定：

- 存储在 **Vercel Marketplace 的 Upstash for Redis 免费层**（资源 `gitd-stats`，区域 `iad1`，每月 50 万条命令）。连接串由 Vercel 以 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 自动注入项目，既不在代码里，也不下发到浏览器。
- 浏览器只跟同源 `/api/*` 通信，不加载任何云 SDK，因此没有跨域与 Origin 校验问题。
- 匿名标识是本机 `localStorage` 里的随机 id，没有账号、没有 Cookie 跟踪。上报字段只有事件类型、工具编号、随机会话 id，**不含任何工具输入内容**。
- `build.mjs` 会生成 `tools-map.js`，供热度榜把工具 id 映射成名称与分类色；榜单只显示注册表里存在的工具，刷出来的陌生 id 不会上墙。
- `robots.txt` 明确 `Disallow: /api/`，避免爬虫白耗数据库命令配额。

## 我的工具与跨设备同步

工具页有「☆ 收藏」，首页「我的工具」区把收藏与最近用过并排展示，数据先写 `localStorage`。点「跨设备同步」生成一串 8 位同步码，在另一台设备输入同一串码即可取回；本地清单变化会延迟 1.5 秒自动上传，新设备（本地清单为空）会静默拉取一次。服务端 `api/sync.js` 只存工具 id，校验格式与长度，90 天不更新自动过期。同步码是唯一凭据，不做找回，也不跟匿名统计的 sid 关联。

## 边缘工具升级

注册表里有 15 条 `status: "blocked"` / `tier: 6` 的工具，是当年「纯静态站确实承接不了」而被降级实现的：要么写死一份过期数据，要么让浏览器直连第三方 API。接上 Vercel Function + 免费 Redis 后，其中 4 个可以做成真的：

| 工具 | 以前 | 现在 |
|---|---|---|
| IP 地址查询 | 浏览器依次直连 Cloudflare trace、ipify、ipwho.is，受 CORS 影响，还把访客 IP 交给三个外站 | `/api/net?mode=self` 用 Vercel 自带的边缘地理头 + 公开 IP 库，结果按 IP 缓存 24 小时；批量查也走同源接口 |
| 域名查 IP | 浏览器直连 Cloudflare DoH，三种记录串行走，没有缓存 | `/api/net?mode=host` 服务端并行查 A / AAAA / CNAME，缓存 10 分钟，识别常见 CDN 厂商，导出带真正 UTF-8 BOM 的 CSV |
| 汇率换算 | 10 个写死的 2024 年汇率，页面自称「离线参考值」 | `/api/fx` 取约 160 个币种的真实中间价，6 小时缓存；每日快照存进 Redis，攒够两天画出真实 USD→CNY 走势曲线 |
| 货币价值排行 | 20 个写死数值，标题却叫「实时」 | 用同一份实时牌价算出全部币种的「1 单位折人民币」排行，最强 / 最弱由数据决定 |

接口侧统一做了几件事：输入严格校验（IP 格式、域名格式，杜绝把接口变成 SSRF 跳板）、按 IP 限流、按结果缓存、上游失败时返回上一次成功结果并**明确标 `stale`**，不拿旧数据冒充实时。上游都是免费公开源，不需要密钥。前端 4 个工具改完后没有任何 `https://` 外站直连。

顺带修了两个连带问题：这 4 个工具原本被标成「纯本地」，而页面文案又写着「不联网 / 文件不上传」，属于自相矛盾——现在单独有「在线数据」档位，工具页的隐私说明、工作台提示和 FAQ 都按档位切换；另外两个工具的 CSV 导出用的是字面量 `\ufeff` 而非真正的 U+FEFF，Excel 打开会中文乱码，已改成 `String.fromCharCode(0xFEFF)`。

**剩下 11 个仍不假装支持**：证件照 / 抠图 / OCR 需要模型与算力，Vercel Hobby 的函数时长与请求体限制扛不住；古诗词 34 万首、COCA 完整词频、676 条人生指南是语料版权与体积问题，不是加个数据库就能解决；跨设备摄像头串流要低延迟信令，REST Redis 做不了实时交换；英语词汇量测试依赖完整 COCA 分层抽样。这些边界仍写在工具页里。

## 友情链接自动审核

页脚的友链不是手工维护的清单，而是一套双向校验：**对方网站首页必须先放上指向本站的链接，本站才展示对方；对方撤掉链接，本站自动把对方移除**。全程没有人工审核。

| 环节 | 做法 |
|---|---|
| 提交 | 页脚「申请友链」填站名 / 首页地址 / 简介，`POST /api/links` 立刻抓对方首页核验 |
| 自动通过 | 首页 HTML 里有一条**可见**的、指向 `www.gitd.cn`（或 `gitd.cn`）的 `<a>` → 立即上线，前端马上把卡片插进列表 |
| 自动复核 | `vercel.json` 的 Cron 每天 UTC 02:00 触发 `/api/links-verify` → `/api/links?job=verify`；GitHub Actions 每天 UTC 02:17 再兜一次，也可手动重跑 |
| 自动删除 | 连续 **3 次**复核查不到回链 → 从 Redis 删除，页面上同步消失 |
| 待审重试 | 没加回链的申请留 30 天，期间每天自动复查；加好后也可以再提交一次立刻通过 |
| 可追溯 | `GET /api/links?view=audit` 返回最近 40 条上线 / 警告 / 移除 / 过期记录 |

「首页」是硬条件：提交里带的路径、查询、锚点一律丢掉，只抓 `https://对方域名/`，防止用专门做好的内页冒充。检测针对服务端拿到的原始 HTML：HTML 注释、`<script>` / `<style>` / `<template>` 里的链接不算，`display:none`、`hidden`、零字号这类隐藏链接也不算，纯脚本动态插入的链接抓不到（申请面板里已写明）。链接可以是文字或 logo 图片，`http`、带不带 `www`、带任意路径都认。

**为什么是 3 次而不是 1 次**：对方改版、临时 5xx、DNS 抖动都会让单次检测失败，立刻删容易误伤。连续 3 轮都查不到才判定为撤链；网络超时和 5xx 单独标记为临时故障，不累加失败次数，只等下一轮再查。

定时任务是**双保险**：`vercel.json` 里的平台 Cron 每天 UTC 02:00 触发（Hobby 免费层允许每天一次），`.github/workflows/links-verify.yml` 每天 UTC 02:17 再发一次 GET，并且能在 Actions 页手动 `Run workflow` 立即复核——运行记录和失败原因直接可见。两条路都只打 `/api/links-verify`，不接触数据库凭据；接口有 20 小时冷却，重复触发不会重复抓对方网站。

一轮最多并发复核 12 条，超出的由站点页面以 30 分钟节流的方式惰性触发分批补齐；服务端有 2 分钟互斥锁和每条 20 小时冷却，多开页面也不会重复抓对方网站。

安全与边界：

- 抓对方首页前做域名白名单校验，并**逐跳手动跟随重定向**、每跳重新校验，挡住用 301 把请求引到 `169.254.169.254` 这类内网地址；IP、私有网段、非标准端口、本站自身一律拒绝。
- 写操作要求同源，按 IP（8 次/小时）与全站（40 次/天）双重限流；同一域名只留一条记录，已上线的站 20 小时内重复提交直接复用结果，不当免费网页探测器；站名 / 简介做粗粒度敏感词过滤；最多 60 条。
- 不配任何环境变量就能跑：定时任务带 `vercel-cron/1.0` UA 与 `x-vercel-cron-schedule` 头，本站页面的惰性复核走同源校验。要更严可以加 `CRON_SECRET`：Vercel Cron 会自动带上 `Authorization: Bearer …`，GitHub Actions 则在仓库 Secrets 里配同名变量，接口随即强制校验。
- 抓不到也要如实说：只解析静态 HTML、不执行 JS，SPA 站点或屏蔽境外 IP / 自定义 UA 的站点可能一直检测不到；自动审核只能判断「有没有回链」，判断不了对方内容质量。

## 部署（Vercel）

`vercel.json` 已配好 `buildCommand: node build.mjs`、`outputDirectory: dist`、`framework: null` 和一条每日 Cron，导入仓库即可，无需手填构建命令。每日复核由平台 Cron 与 `.github/workflows/links-verify.yml` 双触发，不需要额外配置。`api/` 下的 6 个文件会各自发布成 Vercel Function（`stats` / `net` / `fx` / `sync` / `links` / `links-verify`），共享代码在 `server/store.mjs`——故意放在 `api/` 目录外，避免被当成一个可访问的路由。数据库在 Dashboard → Storage 创建并 Connect 到项目即可，环境变量由集成自动注入，不需要手动填；`CRON_SECRET` 是可选的加固项，不配也能跑。

发版前建议跑 `npm run check`：它会先用内存版 Redis、假上游和假对方首页把 6 个接口完整跑一遍（65 项断言，含回链检测与撤链自动下架），再构建并跑 SEO 体检。接口测试不需要网络、不需要凭据，也不会碰线上数据。

`build.mjs` 末尾还有一道「生产域名视角」补扫：本地 canonical 是 localhost，SEO 体检会跳过占位域名检查，页面里写了 `example.com` / `xxx.vercel.app` 时本地全绿、上了 Vercel 才 297 页全红。补扫把这类问题直接挡在本地构建阶段；要完整复现生产构建，可跑 `SITE_URL=https://www.gitd.cn node build.mjs`。

正式域名写在 `build.mjs` 顶部的 `PRODUCTION_SITE_URL`，当前是 `https://www.gitd.cn`。根域 `gitd.cn` 在 Vercel 上 308 跳到 `www.gitd.cn`，所以全站 canonical、`og:url`、sitemap、robots 与 JSON-LD 统一用 www 这一套，不产生重复 URL。Vercel 构建直接读这个常量，**不需要在 Dashboard 配环境变量**；本地构建默认 `http://localhost:3000`，也可用 `SITE_URL=... node build.mjs` 覆盖。换域名时改常量或设 `SITE_URL`。

`public/` 下放需要直接进产物根目录的自定义文件（目录内有 `.gitkeep` 保证 Git 跟踪；构建会跳过点文件、递归复制子目录）。

## 诚实边界

纯静态站承接不了的能力不做假装支持，边界写在对应工具页里。主要包括：

- **PDF**：标准「打开密码」需要 qpdf，本站用自定义 AES-GCM `.pdfenc` 容器；中文水印/页码因标准字体不支持会回退数字；压缩重渲染会丢文字层。
- **音视频**：浏览器不能本地编码 MP3 / AAC / MP4 / H.264，音频统一导出 WAV，视频 / 录屏 / 音轨提取统一导出 WebM；`MediaRecorder` 重录是实时的，处理时长约等于素材时长。
- **OCR**：主程序本地，语言模型首次使用可能需要联网下载。
- **图片**：证件照 / 抠图是颜色容差处理，不是 AI 人像分割；GIF 拆帧只给首帧。
- **离线数据**：COCA 词频、古诗词、垃圾分类、嘌呤、DNS / NTP、税率、端口、正则、Git 命令、手机号段等均为内置精简版，不是完整官方语料或实时接口。IP 查询、域名解析、汇率换算与货币排行这 4 个已经升级成「在线数据」档，见上一节。
- **设备与游戏**：跨设备摄像头串流没有信令服务器，不做假的 WebRTC；汉字笔顺不内置官方笔顺库（田字格描红 + 轨迹回放）；国际象棋开局是近似摆子、不是完整合法走子引擎；魔方教程是 2D 六面展开图 + CFOP 公式速查、不是 3D 模拟器。
- **其它**：加密 ZIP 是自定义 `.enc` 容器而非标准加密 ZIP；Parquet 只读 Footer 元数据；字体工具只做字形检查 / SVG 轮廓，不做完整子集化；Mermaid / Markmap 是轻量实现；保持音调不变的 time-stretch 未内置。
- **友链检测**：只解析对方首页的原始 HTML，不执行 JS、不渲染 DOM；隐藏链接、注释 / 脚本里的链接一律不算，SPA 与屏蔽境外访问的站点可能检测不到。详见「友情链接自动审核」。

## 实现与数据说明

- 计算与渲染基于浏览器原生能力（canvas / WebCrypto / WebAudio / MediaRecorder 等）与原生 JS；处理复杂格式时加载随站点本地打包的开源库（见「本地处理库」），这些库一并放进产物，不联网、不调外部 CDN。
- 实时汇率、IP 归属地、DNS 解析等外部事实数据来自各自的公开数据源，经本站同源接口取回并短期缓存；上游不可用时明确标注，不拿旧数据冒充实时。
- 站内离线精简数据集（词频、端口、税率、古诗词等）用于速查，边界写在对应工具页里。

## SEO

产物共 297 个静态页：1 首页 + 10 分类页 + 286 工具页。每页有独立 title / description / canonical，带 OG 与 Twitter Card；结构化数据全部在 `<head>`：首页 `WebSite`、分类页 `CollectionPage + ItemList + BreadcrumbList`、工具页 `WebApplication + BreadcrumbList`。

- **描述清洗**：注册表里有些 `desc` 是早期录入留下的残句（结尾半个英文词、孤立数字、多余斜杠）。`src/templates/seo.mjs` 的 `cleanDesc()` 先整理成可读中文，再按 10 个分类 × 4 档实现档位拼差异化描述，`fit()` 按预算整段裁剪，不留下半截词。卡片、分类页、相关工具区复用同一份清洗结果。
- **分类落地页**：`/cat/<id>/` 是真实静态页，首页底部有静态分类链接区（筛选按钮爬虫点不了），工具页面包屑与「同类工具」的「查看全部」都指回分类页。「同类工具」按 id 哈希环形取 6 个，不再固定取注册顺序前 3 个，避免两百多个工具收不到内链。
- **工具页静态正文**：除用法外补了「关于这个工具」与 3 条常见问题，内容按工具名、分类、端分级、实现档位变化，缓解 286 页共用一套模板文字的问题。工具模块仍是打开时才动态加载。
- **sitemap / robots**：`sitemap.xml` 只写 `loc`。旧版 287 条 `lastmod` 全用构建当天，等于每次发版都宣称全站改过，不可靠的 lastmod 会被忽略，索性不写；`changefreq` / `priority` 同样被忽略。`robots.txt` 明确放行 `/t/` 与 `/vendor/`（保证爬虫能取到工具模块完成渲染），同时 `Disallow: /api/` 避免数据接口被爬。
- **分享图**：`og.png` 由 `gen/og.mjs` 用 Node 内置 `zlib` 手写 PNG 生成，26×11 = 286 个方块对应 286 个工具，不引图像库、不依赖系统字体。

`scripts/seo-check.mjs` 在每次构建末尾体检真实产物：title / description 缺失、重复或过短，canonical 不自洽，缺 OG / JSON-LD，占位域名残留，内部死链，孤岛页，sitemap 与页面集合不一致 —— 任一项不过就构建失败。也可单独跑 `npm run check:seo`。
