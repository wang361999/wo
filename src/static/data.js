/* 共享离线数据：速查表与精简语料。纯前端内置，不联网也能查。 */
// 记录分隔符兼容两种写法：优先按换行切（绝大多数表用换行分行），
// 没有换行时才按 | 切（字段值里可能出现 |，例如正则速查表里的「或」，不能误切）。
const P = (s) => {
  const t = String(s).trim();
  const rows = t.includes('\n') ? t.split(/\r?\n/) : t.split('|');
  return rows.map((x) => x.trim()).filter(Boolean).map((x) => x.split(',').map((y) => y.trim()));
};

export const D = {};

/* 端口 / 协议 */
D.ports = P(`20,FTP 数据,TCP,文件传输,建议内网
21,FTP 控制,TCP,文件传输,明文口令
22,SSH/SFTP,TCP,远程登录,可公网但务必禁密码登录
23,Telnet,TCP,远程登录,明文 高危
25,SMTP,TCP,发邮件,常被滥用
53,DNS,TCP/UDP,域名解析,UDP 放大攻击面
80,HTTP,TCP,Web 明文,建议仅做跳转
110,POP3,TCP,收邮件,明文
123,NTP,UDP,时间同步,可被放大
143,IMAP,TCP,收邮件,建议 SSL
161,SNMP,UDP,设备监控,勿暴露公网
443,HTTPS,TCP,Web 加密,常规开放
445,SMB,TCP,文件共享,勒索高危 绝不暴露
465,SMTPS,TCP,发邮件 SSL,
587,SMTP Submission,TCP,发邮件,
993,IMAPS,TCP,收邮件 SSL,
995,POP3S,TCP,收邮件 SSL,
1080,SOCKS 代理,TCP,代理,
1194,OpenVPN,UDP,VPN,
1433,SQL Server,TCP,数据库,勿暴露公网
1521,Oracle,TCP,数据库,勿暴露公网
1883,MQTT,TCP,物联网,明文
2049,NFS,TCP/UDP,文件共享,勿暴露
2082/2083,cPanel,TCP,主机面板,
2181,ZooKeeper,TCP,协调服务,勿暴露
2375,Docker API,TCP,容器管理,未鉴权极危
2376,Docker TLS,TCP,容器管理,
3000,Node/Dev,TCP,开发服务,
3306,MySQL,TCP,数据库,勿暴露公网
3389,RDP,TCP,远程桌面,爆破高危
3690,SVN,TCP,版本库,
4369,Erlang EPMD,TCP,集群发现,
5000,Flask/UPnP,TCP,开发服务,
5432,PostgreSQL,TCP,数据库,勿暴露公网
5672,RabbitMQ,TCP,消息队列,
5900,VNC,TCP,远程桌面,勿暴露
6379,Redis,TCP,缓存,未鉴权极危
6443,Kubernetes API,TCP,集群,勿暴露
7001,WebLogic,TCP,应用服务器,
8080,HTTP 备用,TCP,Web,
8081,HTTP 备用,TCP,Web,
8443,HTTPS 备用,TCP,Web,
8888,宝塔/开发,TCP,面板,
9000,Portainer/PHP-FPM,TCP,管理,
9090,Prometheus,TCP,监控,
9092,Kafka,TCP,消息队列,
9200,Elasticsearch,HTTP,搜索,未鉴权极危
11211,Memcached,TCP/UDP,缓存,放大攻击面
15672,RabbitMQ 管理,HTTP,管理台,
27017,MongoDB,TCP,数据库,未鉴权极危`);

D.httpStatus = P(`100,Continue,继续,客户端应继续发送请求
101,Switching Protocols,协议切换,WebSocket 握手成功
102,Processing,处理中,WebDAV
200,OK,成功,最常见
201,Created,已创建,POST 新建资源
202,Accepted,已接受,异步处理中
204,No Content,无内容,DELETE 成功常用
206,Partial Content,部分内容,断点续传/Range
301,Moved Permanently,永久重定向,SEO 权重转移
302,Found,临时重定向,默认重定向
303,See Other,查看其他,POST 后重定向
304,Not Modified,未修改,协商缓存命中
307,Temporary Redirect,临时重定向,保持方法与 body
308,Permanent Redirect,永久重定向,保持方法与 body
400,Bad Request,请求错误,参数格式不对
401,Unauthorized,未认证,需要登录或 Token
403,Forbidden,禁止访问,已认证但无权限
404,Not Found,不存在,路径或资源找不到
405,Method Not Allowed,方法不允许,检查 GET/POST
406,Not Acceptable,不可接受,Accept 协商失败
408,Request Timeout,请求超时,服务端等太久
409,Conflict,冲突,资源状态冲突
410,Gone,已删除,永久移除
413,Payload Too Large,实体过大,调 client_max_body_size
415,Unsupported Media Type,类型不支持,检查 Content-Type
418,I'm a teapot,我是茶壶,彩蛋
422,Unprocessable Entity,语义错误,参数校验失败
429,Too Many Requests,请求过多,触发限流
500,Internal Server Error,服务端错误,查日志
501,Not Implemented,未实现,方法不支持
502,Bad Gateway,网关错误,上游挂了
503,Service Unavailable,服务不可用,过载或维护
504,Gateway Timeout,网关超时,上游响应慢
505,HTTP Version Not Supported,版本不支持,
507,Insufficient Storage,空间不足,WebDAV
508,Loop Detected,检测到循环,WebDAV
511,Network Authentication Required,需网络认证, captive portal`);

D.mime = P(`html,text/html,网页
htm,text/html,网页
css,text/css,样式表
js,text/javascript,JavaScript
mjs,text/javascript,ES 模块
json,application/json,JSON 数据
xml,application/xml,XML
txt,text/plain,纯文本
md,text/markdown,Markdown
csv,text/csv,逗号分隔表
pdf,application/pdf,PDF 文档
png,image/png,PNG 图片
jpg,image/jpeg,JPEG 图片
jpeg,image/jpeg,JPEG 图片
gif,image/gif,GIF 动图
webp,image/webp,WebP 图片
svg,image/svg+xml,矢量图
ico,image/x-icon,图标
avif,image/avif,AVIF 图片
bmp,image/bmp,位图
mp3,audio/mpeg,MP3 音频
wav,audio/wav,WAV 音频
ogg,audio/ogg,OGG 音频
m4a,audio/mp4,AAC 音频
flac,audio/flac,无损音频
mp4,video/mp4,MP4 视频
webm,video/webm,WebM 视频
mov,video/quicktime,QuickTime
avi,video/x-msvideo,AVI
mkv,video/x-matroska,Matroska
zip,application/zip,ZIP 压缩包
gz,application/gzip,Gzip
tar,application/x-tar,TAR
7z,application/x-7z-compressed,7z
rar,application/vnd.rar,RAR
doc,application/msword,Word 旧版
docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,Word
xls,application/vnd.ms-excel,Excel 旧版
xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,Excel
pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,PPT
epub,application/epub+zip,EPUB 电子书
wasm,application/wasm,WebAssembly
woff2,font/woff2,WOFF2 字体
bin,application/octet-stream,二进制流
form,application/x-www-form-urlencoded,表单提交`);

D.dns = P(`阿里 DNS,223.5.5.5,223.6.6.6,2400:3200::1 / 2400:3200:baba::1,https://dns.alidns.com/dns-query
DNSPod / 腾讯,119.29.29.29,182.254.116.116,2402:4e00::,https://doh.pub/dns-query
114DNS,114.114.114.114,114.114.115.115,—,—
百度 DNS,180.76.76.76,—,2400:da00::6666,—
CNNIC,1.2.4.8,210.2.4.8,2001:dc7:1000::1,—
Cloudflare,1.1.1.1,1.0.0.1,2606:4700:4700::1111,https://cloudflare-dns.com/dns-query
Google,8.8.8.8,8.8.4.4,2001:4860:4860::8888,https://dns.google/dns-query
Quad9,9.9.9.9,149.112.112.112,2620:fe::fe,https://dns.quad9.net/dns-query
OpenDNS,208.67.222.222,208.67.220.220,2620:0:ccc::2,https://doh.opendns.com/dns-query`);

D.ntp = P(`阿里云,ntp.aliyun.com,ntp1.aliyun.com,国内通用
腾讯云,ntp.tencent.com,time.tencent.com,国内低延迟
华为云,ntp.huaweicloud.com,—,国内
国家授时中心,ntp.ntsc.ac.cn,—,中科院
交通大学,ntp.sjtu.edu.cn,—,教育网
Cloudflare,time.cloudflare.com,支持 NTS,全球
Google,time.google.com,leap-smear,全球
Apple,time.apple.com,—,全球
Microsoft,time.windows.com,—,Windows 默认`);

D.mirrors = P(`pip,清华,https://pypi.tuna.tsinghua.edu.cn/simple,pip config set global.index-url
pip,阿里,https://mirrors.aliyun.com/pypi/simple/,备用
npm,淘宝,https://registry.npmmirror.com,npm config set registry
npm,华为,https://repo.huaweicloud.com/repository/npm/,备用
pnpm,淘宝,https://registry.npmmirror.com,同 npm registry
yarn,淘宝,https://registry.npmmirror.com,yarn config set registry
Ubuntu,清华,https://mirrors.tuna.tsinghua.edu.cn/ubuntu/,替换 sources.list
Ubuntu,阿里,https://mirrors.aliyun.com/ubuntu/,备用
Debian,清华,https://mirrors.tuna.tsinghua.edu.cn/debian/,替换 sources.list
CentOS,阿里,https://mirrors.aliyun.com/centos/,已 EOL 请用 vault
Fedora,清华,https://mirrors.tuna.tsinghua.edu.cn/fedora/,替换 repo
Arch,清华,https://mirrors.tuna.tsinghua.edu.cn/archlinux/,mirrorlist 置顶
Docker Hub,中科大,https://docker.mirrors.ustc.edu.cn,daemon.json registry-mirrors
Docker Hub,阿里,https://<你的ID>.mirror.aliyuncs.com,个人加速器
Maven,阿里,https://maven.aliyun.com/repository/public,settings.xml mirror
Gradle,阿里,https://maven.aliyun.com/repository/public,init.gradle
Go,七牛,https://goproxy.cn,GOPROXY
Go,阿里,https://mirrors.aliyun.com/goproxy/,备用
Rust crates,中科大,https://rsproxy.cn,cargo config
RubyGems,清华,https://mirrors.tuna.tsinghua.edu.cn/rubygems/,bundle config
Composer,阿里,https://mirrors.aliyun.com/composer/,composer config
Homebrew,清华,https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git,HOMEBREW_CORE_GIT_REMOTE
Alpine,清华,https://mirrors.tuna.tsinghua.edu.cn/alpine/,/etc/apk/repositories
npm 镜像,华为,https://repo.huaweicloud.com/repository/npm/,备用
PyPI,中科大,https://mirrors.ustc.edu.cn/pypi/web/simple,备用
Conda,清华,https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/,channels
Node 二进制,淘宝,https://npmmirror.com/mirrors/node/,NODE_MIRROR
Electron,淘宝,https://npmmirror.com/mirrors/electron/,ELECTRON_MIRROR
Android SDK,阿里,https://mirrors.aliyun.com/android.googlesource.com/,备用`);

D.httpHeaders = P(`Accept,请求,告诉服务端能接收哪些 MIME,内容协商
Accept-Encoding,请求,可接受的压缩算法 gzip/br/zstd,压缩
Accept-Language,请求,偏好语言与权重,国际化
Authorization,请求,Bearer / Basic 凭证,认证
Cache-Control,通用,缓存策略 max-age/no-store,缓存
Connection,通用,keep-alive / close,连接
Content-Type,通用,body 的 MIME 与字符集,解析
Content-Length,通用,body 字节数,传输
Cookie,请求,带回服务端设置的 Cookie,会话
Host,请求,目标主机名与端口,必需
Origin,请求,发起源 用于 CORS 判定,CORS
Referer,请求,来源页面 URL,统计/防盗链
User-Agent,请求,客户端标识,兼容/统计
If-None-Match,请求,带上 ETag 做条件请求,缓存
If-Modified-Since,请求,带上最后修改时间,缓存
Range,请求,只要字节区间,断点续传
X-Forwarded-For,请求,代理链上的原始 IP,代理
X-Real-IP,请求,反向代理设置的真实 IP,代理
X-Requested-With,请求,标记 Ajax,兼容
Access-Control-Allow-Origin,响应,允许哪些源跨域,CORS
Access-Control-Allow-Credentials,响应,是否允许带凭证,CORS
Access-Control-Allow-Methods,响应,预检允许的方法,CORS
Access-Control-Allow-Headers,响应,预检允许的请求头,CORS
Access-Control-Max-Age,响应,预检结果缓存秒数,CORS
Content-Security-Policy,响应,限制资源加载来源,安全
Content-Disposition,响应,内联还是附件下载,下载
ETag,响应,资源版本指纹,缓存
Last-Modified,响应,最后修改时间,缓存
Location,响应,重定向目标 URL,重定向
Set-Cookie,响应,下发 Cookie 及属性,会话
Strict-Transport-Security,响应,强制 HTTPS (HSTS),安全
X-Content-Type-Options,响应,nosniff 禁止 MIME 嗅探,安全
X-Frame-Options,响应,是否允许被 iframe 嵌套,安全
Referrer-Policy,响应,Referer 泄露策略,隐私
Vary,响应,按哪些请求头区分缓存,缓存
WWW-Authenticate,响应,挑战认证方式,认证
Server,响应,服务端软件标识,信息泄露
Date,响应,报文生成时间,基础
Expires,响应,绝对过期时间,缓存
Content-Encoding,响应,实际使用的压缩算法,压缩
Transfer-Encoding,响应,chunked 分块传输,传输
Upgrade,通用,协议升级 WebSocket,握手
Sec-WebSocket-Key,请求,WebSocket 握手随机值,握手
Permissions-Policy,响应,限制浏览器特性,安全
Cross-Origin-Opener-Policy,响应,隔离跨源窗口,安全
Cross-Origin-Resource-Policy,响应,限制资源被跨源加载,安全`);

D.llm = P(`OpenAI,GPT-5 / o3,https://api.openai.com/v1,OPENAI_API_KEY
OpenAI,GPT-4o,https://api.openai.com/v1,OPENAI_API_KEY
Anthropic,Claude Opus 4,https://api.anthropic.com,ANTHROPIC_API_KEY
Google,Gemini 2.5,https://generativelanguage.googleapis.com,GOOGLE_API_KEY
DeepSeek,DeepSeek-V3 / R1,https://api.deepseek.com,DEEPSEEK_API_KEY
阿里通义,Qwen-Max,https://dashscope.aliyuncs.com/compatible-mode/v1,DASHSCOPE_API_KEY
月之暗面,Kimi,https://api.moonshot.cn/v1,MOONSHOT_API_KEY
智谱,GLM-4,https://open.bigmodel.cn/api/paas/v4,ZHIPU_API_KEY
百度千帆,ERNIE,https://qianfan.baidubce.com/v2,QIANFAN_API_KEY
字节豆包,Doubao,https://ark.cn-beijing.volces.com/api/v3,ARK_API_KEY
腾讯混元,Hunyuan,https://hunyuan.tencentcloudapi.com,TENCENTCLOUD_SECRET
MiniMax,abab,https://api.minimax.chat/v1,MINIMAX_API_KEY
零一万物,Yi,https://api.lingyiwanwu.com/v1,YI_API_KEY
阶跃星辰,Step,https://api.stepfun.com/v1,STEP_API_KEY
Mistral,Mistral Large,https://api.mistral.ai/v1,MISTRAL_API_KEY
Groq,Llama 高速推理,https://api.groq.com/openai/v1,GROQ_API_KEY
Together,Llama / Qwen,https://api.together.xyz/v1,TOGETHER_API_KEY
硅基流动,多模型聚合,https://api.siliconflow.cn/v1,SILICONFLOW_API_KEY
OpenRouter,多模型聚合,https://openrouter.ai/api/v1,OPENROUTER_API_KEY
Ollama,本地模型,http://localhost:11434,无需 Key
xAI,Grok,https://api.x.ai/v1,XAI_API_KEY
Cohere,Command R,https://api.cohere.com/v2,COHERE_API_KEY
Azure OpenAI,GPT-4o,https://<资源名>.openai.azure.com,AZURE_OPENAI_KEY`);

D.git = P(`init,初始化,git init,新建仓库
clone,取远端,git clone <url>,拉代码
add,暂存,git add .,全部暂存
add -p,暂存,git add -p,逐块挑选
commit,提交,git commit -m "msg",保存快照
amend,撤销,git commit --amend,改上一条提交
status,查看,git status,看工作区状态
log,查看,git log --oneline --graph,图形化历史
diff,查看,git diff,未暂存改动
diff --staged,查看,git diff --staged,已暂存改动
show,查看,git show <hash>,看某次提交
branch,分支,git branch,列出分支
checkout -b,分支,git checkout -b feat,新建并切分支
switch,分支,git switch main,切换分支
merge,合并,git merge feat,把 feat 合进当前
rebase,合并,git rebase main,变基到 main
rebase -i,合并,git rebase -i HEAD~3,整理最近 3 条
cherry-pick,合并,git cherry-pick <hash>,摘一条提交过来
stash,暂存,git stash,临时收起改动
stash pop,暂存,git stash pop,取回最近一次
reset --soft,撤销,git reset --soft HEAD~1,撤销提交保留暂存
reset --mixed,撤销,git reset HEAD~1,撤销提交保留工作区
reset --hard,撤销,git reset --hard HEAD~1,危险：丢弃改动
revert,撤销,git revert <hash>,新增一条反向提交
restore,撤销,git restore <file>,丢弃工作区改动
restore --staged,撤销,git restore --staged <file>,移出暂存区
clean,撤销,git clean -fd,危险：删除未跟踪文件
reflog,救命,git reflog,找回被 reset 掉的提交
remote -v,远端,git remote -v,查看远端地址
remote add,远端,git remote add origin <url>,添加远端
fetch,远端,git fetch --all,取远端更新不合并
pull,远端,git pull --rebase,拉取并变基
push,远端,git push -u origin main,推送并设上游
push --force-with-lease,远端,git push --force-with-lease,危险：较安全的强推
tag,标签,git tag v1.0.0,打标签
blame,排查,git blame <file>,逐行看谁改的
bisect,排查,git bisect start,二分定位引入 bug 的提交
config,配置,git config --global user.name "x",设置用户名
ls-files,查看,git ls-files,列出被跟踪文件
rm --cached,查看,git rm --cached <file>,仅从索引移除
submodule,子模块,git submodule update --init --recursive,初始化子模块
worktree,工作树,git worktree add ../wt feat,同时检出另一分支
gc,维护,git gc --prune=now,清理对象
archive,导出,git archive --format=zip HEAD,打包当前版本
shortlog,统计,git shortlog -sn,按作者统计提交数`);

D.regexRef = P(`. ,任意字符,不含换行（除非 s 标志）
\\d ,数字,等价于 [0-9]
\\D ,非数字,等价于 [^0-9]
\\w ,单词字符,字母数字下划线；JS 不含中文
\\W ,非单词字符,
\\s ,空白,空格 制表 换行
\\S ,非空白,
[abc] ,字符类,a 或 b 或 c
[^abc] ,否定字符类,除 a b c 之外
[a-z] ,范围,小写字母
^ ,锚点,行/串开头（m 标志下每行）
$ ,锚点,行/串结尾
\\b ,单词边界,零宽
\\B ,非单词边界,零宽
* ,量词,0 次或多次（贪婪）
+ ,量词,1 次或多次
? ,量词,0 或 1 次
{n} ,量词,恰好 n 次
{n,} ,量词,至少 n 次
{n,m} ,量词,n 到 m 次
*? ,量词,惰性版本
(ab) ,捕获组,可用 $1 或 \\1 回引
(?:ab) ,非捕获组,不占组号
(?<name>ab) ,命名捕获,JS 支持 groups.name
a|b ,分支,或
(?=ab) ,正向前瞻,后面必须是 ab 但不消耗
(?!ab) ,负向前瞻,后面不能是 ab
(?<=ab) ,正向后顾,前面必须是 ab
(?<!ab) ,负向后顾,前面不能是 ab
i ,标志,忽略大小写
g ,标志,全局匹配
m ,标志,多行锚点
s ,标志,dotAll 让 . 匹配换行
u ,标志,Unicode 模式
y ,标志,粘连 sticky
\\p{L} ,Unicode 属性,需 u 标志 可匹配中文
1\\d{10} ,常用,中国大陆手机号（宽松）
[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])...,常用,身份证号（宽松）
^https?://\\S+$ ,常用,网址
^[\\w.+-]+@[\\w-]+\\.[\\w.]+$ ,常用,邮箱`);

D.gitignore = {
  common: `# 系统\n.DS_Store\nThumbs.db\ndesktop.ini\n*.swp\n*.swo\n.idea/\n.vscode/\n*.log\n.env\n.env.local\n`,
  node: `# Node\nnode_modules/\nnpm-debug.log*\nyarn-error.log*\npnpm-debug.log*\n.npm\n.yarn/cache\ndist/\nbuild/\ncoverage/\n.next/\n.nuxt/\n.cache/\n`,
  python: `# Python\n__pycache__/\n*.py[cod]\n*.egg-info/\n.venv/\nvenv/\n.pytest_cache/\n.mypy_cache/\n.ruff_cache/\n.ipynb_checkpoints/\n`,
  java: `# Java / Maven / Gradle\ntarget/\nbuild/\n.gradle/\n*.class\n*.jar\n*.war\n`,
  go: `# Go\nbin/\nvendor/\n*.test\n*.out\ncoverage.txt\n`,
  rust: `# Rust\ntarget/\nCargo.lock（库项目可忽略）\n`,
  web: `# 前端产物\ndist/\n.vite/\n.parcel-cache/\n.vercel/\n.netlify/\nstorybook-static/\n`,
  c: `# C/C++\n*.o\n*.obj\n*.a\n*.so\n*.dylib\n*.exe\nCMakeFiles/\ncmake-build-*/\n`,
  unity: `# Unity\n[Ll]ibrary/\n[Tt]emp/\n[Oo]bj/\n[Bb]uild/\nUserSettings/\n`,
};

/* 单位：组 -> [名称, 换算到基准的系数]；基准写在组名后 */
D.units = {
  '长度 (基准 m)': P(`米,1
千米,1000
厘米,0.01
毫米,0.001
微米,0.000001
英寸,0.0254
英尺,0.3048
码,0.9144
英里,1609.344
海里,1852
市尺,0.3333333
市里,500
光年,9.4607304725808e15
天文单位,1.495978707e11`),
  '质量 (基准 kg)': P(`千克,1
克,0.001
毫克,0.000001
吨,1000
磅,0.45359237
盎司,0.028349523125
市斤,0.5
市两,0.05
克拉,0.0002
英石,6.35029318`),
  '面积 (基准 m²)': P(`平方米,1
平方千米,1000000
平方厘米,0.0001
公顷,10000
亩,666.6666667
分,66.66666667
英亩,4046.8564224
平方英尺,0.09290304
平方英里,2589988.110336`),
  '体积 (基准 L)': P(`升,1
毫升,0.001
立方米,1000
立方厘米,0.001
美制加仑,3.785411784
英制加仑,4.54609
美制夸脱,0.946352946
美制品脱,0.473176473
美制杯,0.2365882365
 tablespoon 汤匙,0.0147867648
茶匙,0.0049289216
立方英寸,0.016387064`),
  '压力 (基准 Pa)': P(`帕,1
千帕,1000
兆帕,1000000
巴,100000
毫巴,100
标准大气压,101325
psi,6894.757293
公斤力/平方厘米,98066.5
毫米汞柱,133.3223874
托,133.3223684`),
  '功率 (基准 W)': P(`瓦,1
千瓦,1000
兆瓦,1000000
马力(公制),735.49875
马力(英制),745.699872
英热单位/时,0.29307107
卡/秒,4.184`),
  '能量 (基准 J)': P(`焦,1
千焦,1000
卡,4.184
大卡/千卡,4184
瓦时,3600
千瓦时,3600000
电子伏,1.602176634e-19
英热单位,1055.0558526`),
  '速度 (基准 m/s)': P(`米/秒,1
千米/时,0.2777778
英里/时,0.44704
节,0.5144444
英尺/秒,0.3048
马赫(海平面),340.3`),
  '数据存储 (基准 B)': P(`字节,1
KB,1000
MB,1000000
GB,1000000000
TB,1000000000000
KiB,1024
MiB,1048576
GiB,1073741824
位,0.125`),
  '时间 (基准 s)': P(`秒,1
毫秒,0.001
微秒,0.000001
分钟,60
小时,3600
天,86400
周,604800
年(儒略),31557600`),
  '角度 (基准 °)': P(`度,1
弧度,57.295779513
梯度,0.9
角分,0.016666667
角秒,0.000277778`),
};

D.shoe = P(`22.5,35,5,3,22.5
23,36,5.5,3.5,23
23.5,37,6,4,23.5
24,38,6.5,5,24
24.5,39,7,5.5,24.5
25,40,7.5,6,25
25.5,41,8,6.5,25.5
26,42,8.5,7,26
26.5,43,9,7.5,26.5
27,44,9.5,8,27
27.5,45,10,9,27.5
28,46,10.5,9.5,28
28.5,47,11,10,28.5
29,48,11.5,11,29`);

D.wind = P(`0,无风,0–0.2,静 烟直上,<0.1
1,软风,0.3–1.5,烟示风向,0.1
2,轻风,1.6–3.3,感觉有风 树叶微响,0.2
3,微风,3.4–5.4,树叶及小枝摇动,0.6
4,和风,5.5–7.9,吹起尘土纸张 小树枝摇动,1
5,清风,8.0–10.7,小树摇摆 水面起波,2
6,强风,10.8–13.8,大树枝摇动 电线呼呼,3
7,疾风,13.9–17.1,全树摇动 迎风步行不便,4
8,大风,17.2–20.7,微枝折毁 步行受阻,5.5
9,烈风,20.8–24.4,屋瓦可能受损,7
10,狂风,24.5–28.4,树木可被拔起,9
11,暴风,28.5–32.6,陆上少见 破坏力大,11.5
12,台风,32.7–36.9,摧毁力极大,14
13,台风,37.0–41.4,,16
14,强台风,41.5–46.1,,18
15,强台风,46.2–50.9,,20
16,超强台风,51.0–56.0,,22
17,超强台风,≥56.1,,25`);

D.assetLevel = P(`A1,1 万,10⁴,起步
A2,10 万,10⁵,
A3,30 万,3×10⁵,
A4,100 万,10⁶,入门百万
A5,300 万,3×10⁶,
A6,1000 万,10⁷,千万
A7,3000 万,3×10⁷,
A8,1 亿,10⁸,小目标
A8.5,3 亿,3×10⁸,
A9,10 亿,10⁹,
A9.5,30 亿,3×10⁹,
A10,100 亿,10¹⁰,`);

/* 嘌呤 mg/100g，常见值，供参考 */
D.purine = P(`鸡胸肉,140,中高,适量
牛肉,110,中,适量
猪瘦肉,130,中高,适量
羊肉,110,中,适量
鸡肝,290,高,少吃
猪肝,275,高,少吃
牛肝,260,高,少吃
沙丁鱼,350,极高,避免
凤尾鱼,360,极高,避免
带鱼,390,极高,避免
鲱鱼,310,极高,避免
虾,160,高,少吃
蟹,150,高,少吃
贝类,200,高,少吃
三文鱼,170,高,适量
鳕鱼,110,中,适量
鸡蛋,3,低,放心
牛奶,1,低,放心
酸奶,3,低,放心
豆腐,55,中,适量
豆浆,30,低,放心
黄豆,190,高,适量
香菇,210,高,少吃
金针菇,60,中,适量
木耳,25,低,放心
菠菜,55,中,适量
西兰花,40,低,放心
白菜,15,低,放心
黄瓜,10,低,放心
番茄,10,低,放心
土豆,15,低,放心
大米,18,低,放心
面粉,20,低,放心
啤酒,80,中高,避免(含酒精)
白酒,2,低,避免(酒精影响代谢)
可乐,5,低,控糖
咖啡,2,低,适量
浓肉汤,300,极高,避免
火锅汤,250,高,避免
鸡精,500,极高,少用
酵母,600,极高,避免`);

/* 垃圾分类（上海四分类口径，常见条目） */
D.garbage = P(`电池,有害垃圾,含重金属 请投红色桶
废灯管,有害垃圾,含汞 轻放避免破碎
过期药品,有害垃圾,连包装一起投
油漆桶,有害垃圾,残留化学品
杀虫剂罐,有害垃圾,勿挤压
水银温度计,有害垃圾,破碎后勿徒手接触
废机油,有害垃圾,送专门回收点
医用口罩,干垃圾,日常使用按干垃圾
创可贴,干垃圾,
纸巾,干垃圾,用过的不可回收
卫生纸,干垃圾,水溶性差不可回收
湿纸巾,干垃圾,
一次性餐具,干垃圾,污染严重的按干垃圾
陶瓷碗,干垃圾,碎瓷包好再投
烟头,干垃圾,
灰土,干垃圾,
大骨头,干垃圾,难腐蚀 归干垃圾
榴莲壳,干垃圾,
椰子壳,干垃圾,
棕榈叶,干垃圾,
口香糖,干垃圾,
头发,干垃圾,
宠物粪便,干垃圾,请带回家冲厕或投干垃圾
猫砂,干垃圾,
尿不湿,干垃圾,
破旧陶瓷,干垃圾,
污染纸张,干垃圾,
保鲜膜,干垃圾,
塑料袋,干垃圾,干净的可投可回收
外卖餐盒,干垃圾,清洗干净后可回收
剩饭剩菜,湿垃圾,
菜叶菜帮,湿垃圾,
果皮,湿垃圾,
茶叶渣,湿垃圾,
咖啡渣,湿垃圾,
鸡蛋壳,湿垃圾,
鱼骨,湿垃圾,小骨归湿垃圾
虾壳,湿垃圾,
蟹壳,湿垃圾,
鸡骨,湿垃圾,
过期食品,湿垃圾,带包装需拆开
面粉,湿垃圾,
宠物饲料,湿垃圾,
花卉绿植,湿垃圾,
中药材渣,湿垃圾,
奶茶,湿垃圾,液体倒掉 珍珠归湿垃圾 杯归干垃圾
报纸,可回收物,
纸箱,可回收物,压扁再投
书本,可回收物,
杂志,可回收物,
塑料瓶,可回收物,清空压扁
玻璃瓶,可回收物,
易拉罐,可回收物,
金属罐头盒,可回收物,
旧衣服,可回收物,干净干燥
床单被套,可回收物,
毛绒玩具,可回收物,
旧书包,可回收物,
皮鞋,可回收物,
牛奶盒,可回收物,清洗剪开晾干
快递纸箱,可回收物,去掉胶带
泡沫塑料,可回收物,
旧家电,可回收物,或交专门回收
旧手机,可回收物,或交专门回收 注意清除数据
废铁,可回收物,
铜线,可回收物,
铝箔,可回收物,干净的可回收
镜子,可回收物,
干净塑料袋,可回收物,
利乐包,可回收物,
光盘,可回收物,
键盘鼠标,可回收物,或交电子废弃物回收点`);

/* 古诗词精选（离线精简版） */
D.poetry = P(`静夜思,李白,唐,床前明月光，疑是地上霜。举头望明月，低头思故乡。
春晓,孟浩然,唐,春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。
登鹳雀楼,王之涣,唐,白日依山尽，黄河入海流。欲穷千里目，更上一层楼。
相思,王维,唐,红豆生南国，春来发几枝。愿君多采撷，此物最相思。
鹿柴,王维,唐,空山不见人，但闻人语响。返景入深林，复照青苔上。
竹里馆,王维,唐,独坐幽篁里，弹琴复长啸。深林人不知，明月来相照。
送元二使安西,王维,唐,渭城朝雨浥轻尘，客舍青青柳色新。劝君更尽一杯酒，西出阳关无故人。
九月九日忆山东兄弟,王维,唐,独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。
使至塞上,王维,唐,大漠孤烟直，长河落日圆。萧关逢候骑，都护在燕然。
山居秋暝,王维,唐,空山新雨后，天气晚来秋。明月松间照，清泉石上流。
望庐山瀑布,李白,唐,日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。
早发白帝城,李白,唐,朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。
赠汪伦,李白,唐,李白乘舟将欲行，忽闻岸上踏歌声。桃花潭水深千尺，不及汪伦送我情。
黄鹤楼送孟浩然之广陵,李白,唐,故人西辞黄鹤楼，烟花三月下扬州。孤帆远影碧空尽，唯见长江天际流。
独坐敬亭山,李白,唐,众鸟高飞尽，孤云独去闲。相看两不厌，只有敬亭山。
将进酒(节选),李白,唐,君不见黄河之水天上来，奔流到海不复回。人生得意须尽欢，莫使金樽空对月。
行路难(节选),李白,唐,长风破浪会有时，直挂云帆济沧海。
蜀道难(节选),李白,唐,蜀道之难，难于上青天！
春夜喜雨,杜甫,唐,好雨知时节，当春乃发生。随风潜入夜，润物细无声。
望岳,杜甫,唐,会当凌绝顶，一览众山小。
绝句,杜甫,唐,两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。
春望,杜甫,唐,国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。
茅屋为秋风所破歌(节选),杜甫,唐,安得广厦千万间，大庇天下寒士俱欢颜。
登高,杜甫,唐,无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。
江南逢李龟年,杜甫,唐,正是江南好风景，落花时节又逢君。
赋得古原草送别,白居易,唐,离离原上草，一岁一枯荣。野火烧不尽，春风吹又生。
忆江南,白居易,唐,日出江花红胜火，春来江水绿如蓝。能不忆江南？
钱塘湖春行,白居易,唐,乱花渐欲迷人眼，浅草才能没马蹄。最爱湖东行不足，绿杨阴里白沙堤。
琵琶行(节选),白居易,唐,同是天涯沦落人，相逢何必曾相识。
长恨歌(节选),白居易,唐,在天愿作比翼鸟，在地愿为连理枝。天长地久有时尽，此恨绵绵无绝期。
悯农,李绅,唐,锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。
江雪,柳宗元,唐,千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。
回乡偶书,贺知章,唐,少小离家老大回，乡音无改鬓毛衰。儿童相见不相识，笑问客从何处来。
咏柳,贺知章,唐,不知细叶谁裁出，二月春风似剪刀。
凉州词,王之涣,唐,黄河远上白云间，一片孤城万仞山。羌笛何须怨杨柳，春风不度玉门关。
出塞,王昌龄,唐,秦时明月汉时关，万里长征人未还。但使龙城飞将在，不教胡马度阴山。
芙蓉楼送辛渐,王昌龄,唐,洛阳亲友如相问，一片冰心在玉壶。
枫桥夜泊,张继,唐,月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。
滁州西涧,韦应物,唐,独怜幽草涧边生，上有黄鹂深树鸣。春潮带雨晚来急，野渡无人舟自横。
游子吟,孟郊,唐,慈母手中线，游子身上衣。临行密密缝，意恐迟迟归。谁言寸草心，报得三春晖。
登科后,孟郊,唐,春风得意马蹄疾，一日看尽长安花。
乌衣巷,刘禹锡,唐,旧时王谢堂前燕，飞入寻常百姓家。
望洞庭,刘禹锡,唐,湖光秋月两相和，潭面无风镜未磨。遥望洞庭山水翠，白银盘里一青螺。
竹枝词,刘禹锡,唐,东边日出西边雨，道是无晴却有晴。
酬乐天扬州初逢席上见赠,刘禹锡,唐,沉舟侧畔千帆过，病树前头万木春。
清明,杜牧,唐,清明时节雨纷纷，路上行人欲断魂。借问酒家何处有，牧童遥指杏花村。
山行,杜牧,唐,停车坐爱枫林晚，霜叶红于二月花。
江南春,杜牧,唐,南朝四百八十寺，多少楼台烟雨中。
泊秦淮,杜牧,唐,商女不知亡国恨，隔江犹唱后庭花。
夜雨寄北,李商隐,唐,何当共剪西窗烛，却话巴山夜雨时。
无题,李商隐,唐,春蚕到死丝方尽，蜡炬成灰泪始干。
锦瑟,李商隐,唐,此情可待成追忆，只是当时已惘然。
登乐游原,李商隐,唐,夕阳无限好，只是近黄昏。
题西林壁,苏轼,宋,横看成岭侧成峰，远近高低各不同。不识庐山真面目，只缘身在此山中。
饮湖上初晴后雨,苏轼,宋,欲把西湖比西子，淡妆浓抹总相宜。
水调歌头(节选),苏轼,宋,但愿人长久，千里共婵娟。
念奴娇·赤壁怀古(节选),苏轼,宋,大江东去，浪淘尽，千古风流人物。
江城子(节选),苏轼,宋,十年生死两茫茫，不思量，自难忘。
惠崇春江晚景,苏轼,宋,竹外桃花三两枝，春江水暖鸭先知。
示儿,陆游,宋,死去元知万事空，但悲不见九州同。王师北定中原日，家祭无忘告乃翁。
书愤,陆游,宋,出师一表真名世，千载谁堪伯仲间。
游山西村,陆游,宋,山重水复疑无路，柳暗花明又一村。
晓出净慈寺送林子方,杨万里,宋,接天莲叶无穷碧，映日荷花别样红。
小池,杨万里,宋,小荷才露尖尖角，早有蜻蜓立上头。
春日,朱熹,宋,等闲识得东风面，万紫千红总是春。
观书有感,朱熹,宋,问渠那得清如许？为有源头活水来。
元日,王安石,宋,千门万户曈曈日，总把新桃换旧符。
泊船瓜洲,王安石,宋,春风又绿江南岸，明月何时照我还。
登飞来峰,王安石,宋,不畏浮云遮望眼，自缘身在最高层。
夏日绝句,李清照,宋,生当作人杰，死亦为鬼雄。至今思项羽，不肯过江东。
如梦令,李清照,宋,知否，知否？应是绿肥红瘦。
声声慢(节选),李清照,宋,寻寻觅觅，冷冷清清，凄凄惨惨戚戚。
破阵子(节选),辛弃疾,宋,醉里挑灯看剑，梦回吹角连营。
青玉案·元夕(节选),辛弃疾,宋,众里寻他千百度，蓦然回首，那人却在，灯火阑珊处。
丑奴儿,辛弃疾,宋,少年不识愁滋味，爱上层楼。而今识尽愁滋味，欲说还休。
过零丁洋,文天祥,宋,人生自古谁无死？留取丹心照汗青。
天净沙·秋思,马致远,元,枯藤老树昏鸦，小桥流水人家，古道西风瘦马。夕阳西下，断肠人在天涯。
山坡羊·潼关怀古,张养浩,元,兴，百姓苦；亡，百姓苦。
己亥杂诗,龚自珍,清,落红不是无情物，化作春泥更护花。
竹石,郑燮,清,咬定青山不放松，立根原在破岩中。千磨万击还坚劲，任尔东西南北风。
木兰诗(节选),佚名,南北朝,朔气传金柝，寒光照铁衣。将军百战死，壮士十年归。
敕勒歌,佚名,南北朝,天苍苍，野茫茫，风吹草低见牛羊。
蒹葭(节选),佚名,先秦,蒹葭苍苍，白露为霜。所谓伊人，在水一方。
关雎(节选),佚名,先秦,关关雎鸠，在河之洲。窈窕淑女，君子好逑。
饮酒,陶渊明,晋,采菊东篱下，悠然见南山。
归园田居,陶渊明,晋,久在樊笼里，复得返自然。`);

/* COCA 高频词（离线精简版：约 500 词，按常用度降序，用于词频查询与难度分析） */
D.coca = (`the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were has had been did does said says made went got came saw took went` +
  ` man men woman women child children people thing things world life hand part place case week company system program question work government number point group problem fact head book word water room mother father area money story month lot right study eye job business issue side kind night small large high low long short old young good bad big little great important public private local national international social political economic general special common major possible able available clear sure free open full whole real human personal single simple similar different certain various likely recent past future present early late strong weak easy hard fast slow heavy light hot cold warm cool clean dirty rich poor happy sad true false` +
  ` begin start stop end keep hold put set turn move run walk talk speak ask answer tell show hear listen read write learn teach understand remember forget find lose win try help use make take give get go come see look watch wait stay leave arrive return follow lead pass change continue add open close break build create develop grow increase reduce improve produce provide include consider suggest decide plan manage control check test measure compare explain describe report discuss agree allow require need mean matter happen seem appear remain become feel seem` +
  ` school college university student teacher class course research science technology computer internet data information knowledge experience skill idea reason result effect purpose method process project activity service product market customer price cost value quality level standard type form size amount degree rate speed energy power force material structure surface area space position direction distance edge center` +
  ` city town village country state nation community family friend neighbor person member team audience customer client patient student worker manager leader officer doctor lawyer artist writer scientist engineer farmer driver player reader speaker listener` +
  ` morning afternoon evening night today tomorrow yesterday week weekend month season spring summer autumn winter year century moment minute hour second date period age history culture tradition religion language literature art music film movie theater museum library hospital office factory shop restaurant hotel airport station park garden street road bridge river mountain sea ocean lake island forest field farm sky sun moon star wind rain snow cloud weather fire air earth stone wood metal glass plastic paper` +
  ` food meal breakfast lunch dinner bread rice noodle meat fish egg milk cheese fruit vegetable apple banana orange potato tomato coffee tea water juice beer wine sugar salt oil soup cake` +
  ` body heart brain face eye ear nose mouth tooth tongue arm leg foot finger blood bone skin muscle health disease pain medicine doctor nurse hospital treatment exercise sleep rest` +
  ` love hate fear hope trust care worry surprise anger joy pride shame envy pity patience courage confidence curiosity attention interest memory dream imagination belief opinion attitude habit behavior relationship communication conversation argument discussion agreement decision promise secret joke game play sport music song dance picture painting photograph image color shape line` +
  ` phone television radio newspaper magazine article message letter email document file page chapter title sentence phrase paragraph note list table chart map diagram model sample example rule law policy plan goal task duty responsibility right freedom justice peace war safety danger risk chance opportunity success failure effort progress achievement award prize gift benefit advantage disadvantage` +
  ` sometimes always never often usually rarely already still yet again once twice almost quite very really rather simply exactly probably perhaps maybe indeed however therefore although though unless until while since before after during through across between among around behind beyond against without within upon above below near far` +
  ` according despite regarding concerning including except besides moreover furthermore nevertheless otherwise instead likewise consequently additionally generally particularly especially specifically basically essentially ultimately eventually immediately recently currently eventually` +
  ` accept achieve acquire adapt admit adopt affect afford agree allow announce apologize appear apply appreciate approach argue arrange arrive ask assist attach attempt attend attract avoid` +
  ` balance bear beat become beg behave believe bend benefit bind blame boil borrow bother break breathe bring broadcast build burn burst bury buy` +
  ` calculate call calm cancel care carry catch cause celebrate challenge charge chase chat check choose claim clean clear climb close collect combine comment commit communicate compare complain complete concentrate concern confirm connect consider consist contain continue contribute control convince cook copy correct count cover create cross cry cut` +
  ` damage dance dare deal debate decide declare decline decorate defend define delay deliver demand deny depend describe design desire destroy develop die dig disagree disappear discover discuss dislike dismiss display distinguish divide divorce do draw dream dress drink drive drop dry` +
  ` earn eat edit educate elect eliminate embrace emerge employ empty encourage end enjoy ensure enter equip escape establish estimate evaluate examine exchange excite excuse exercise exist expand expect experience explain explore express extend` +
  ` face fail fall fasten fear feed feel fetch fight fill film find finish fit fix flash float flow fly focus fold follow forbid force forget forgive form found freeze frighten` +
  ` gain gather generate get give glance glow go grab graduate greet grow guard guess guide` +
  ` handle hang happen hate have head hear heat help hide hire hit hold hope host hug hunt hurry hurt` +
  ` identify ignore imagine impress improve include increase indicate influence inform insist install introduce invent invest invite involve` +
  ` join joke judge jump keep kick kill kiss kneel knock know` +
  ` label lack land last laugh launch lay lead leak lean learn leave lend let lie lift light limit link listen live load locate lock long look lose love` +
  ` maintain make manage mark marry match matter mean measure meet melt mention mind miss mix model modify monitor move murder` +
  ` name need neglect negotiate nod note notice obey observe obtain occur offer open operate order organize overcome owe own` +
  ` pack paint park participate pass pause pay perform permit persuade pick place plan plant play please point pollute possess post pour practice praise pray predict prefer prepare present preserve press pretend prevent print produce promise promote protect prove provide publish pull punish push put` +
  ` qualify question quit quote race raise range rank reach read realize receive recognize recommend record recover reduce refer reflect refuse regard regret reinforce reject relax release rely remain remember remind remove repair repeat replace reply report represent request require rescue resist respect respond rest restore restrict retain retire return reveal review reward ride ring rise risk roll rub ruin rule run rush` +
  ` sacrifice sail satisfy save say scatter search seat see seek seem seize select sell send separate serve set settle shake share shave shelter shift shine shoot shout show shrink shut sigh sign signal sing sink sit sketch sleep slide slip slow smell smile smoke snap solve sort sound speak speed spell spend spill spin split spoil spread spring stand stare start state stay steal step stick stir stop store stretch strike struggle study stuff submit succeed suffer suggest suit supply support suppose survive suspect swallow swear sweep swim swing switch` +
  ` take talk tap taste teach tear tell tend terminate test thank think threaten throw tick tie tighten touch tour trace track trade train transfer transform translate trap travel treat tremble trick trip trust try turn twist type` +
  ` understand undertake unite update upload urge use utilize vanish vary verify visit vote wait wake wander warn wash waste watch wave wear weigh welcome whisper whistle win wipe wish withdraw wonder work worry wrap write yell yield` +
  ` abandon abolish absorb abstract accelerate accommodate accompany accomplish accumulate accuse acknowledge acquaint acquire adapt adequate adjust administer admire advocate aggregate alleviate allocate alter amplify analyze anticipate apparatus apparent approve approximate arbitrary articulate ascend aspire assemble assert assess assign assume attain attribute authorize autonomous` +
  ` bias bind boost breach brief cascade cease certify clarify classify collaborate commute compile complement comply conceive confine conform consent conserve consolidate constrain construct consult consume contemplate contradict contribute convey coordinate correlate credible crucial` +
  ` deduce deem deficient delegate deliberate denote depict derive designate detach determine deviate devise differentiate diminish discrete disperse displace disrupt distort diverge dominate` +
  ` elaborate elevate eliminate embed emphasize enact endorse enhance entail equate erect essential establish estimate evoke evolve exceed exclude exempt exert exhaust expand explicit exploit extract` +
  ` facilitate feasible fluctuate formulate foster facilitate fragment fundamental generate genuine gradient hierarchy hypothesis identical implement implicit impose incentive incorporate induce inevitable infer inherent initiate innovate insert integrate intervene intrinsic invoke isolate` +
  ` justify latent legitimate leverage linear manipulate marginal mediate mitigate modify momentum negligible normative notion novel` +
  ` obscure offset optimal orient overlap paradigm paradox parameter partition perceive persist perspective phase phenomenon plausible portray precede precise predominant premise prescribe prevalent prior probe proceed prohibit project proliferate prompt propagate proportion prospect provoke` +
  ` quantify radical random rationale reciprocate reconcile refine regime reinforce render replicate represent repression resilient resolve respective restore restrain retain reveal revert rigorous robust` +
  ` scenario scrutiny sequence simulate simultaneous sophisticated spatial specify spectrum stabilize stationary stringent subsequent substantive sufficient superimpose sustain symbols synthesis` +
  ` tangible tentative terminate threshold transcend transition transmit trigger trivial` +
  ` underlying uniform utilize valid variable verify viable vigorous virtual` +
  ` warrant whereas yield`).split(/\s+/).filter(Boolean);

D.lifeGuide = P(`健康,把体检报告拍照存档，明年直接对比,花钱少,证据强
健康,每天走 6000 步比办健身卡更容易坚持,不花钱,证据强
健康,固定起床时间比固定睡觉时间更有效,不花钱,证据中
健康,牙线比换更贵的牙刷划算,花钱少,证据强
健康,防晒是性价比最高的护肤,花钱少,证据强
健康,买一个好枕头，睡眠改善立竿见影,花钱中,证据中
健康,把药盒放在水杯旁边，忘记吃药的概率会降,不花钱,经验
健康,久坐每小时站起来两分钟,不花钱,证据强
健康,学会看营养成分表，比看广告有用,不花钱,证据强
效率,每天开工前先写下今天唯一必须完成的一件事,不花钱,经验
效率,把两分钟内能做完的事立刻做掉,不花钱,经验
效率,同一类事情攒到一起批量处理,不花钱,证据中
效率,关闭绝大多数 App 通知,不花钱,证据中
效率,给常用操作设快捷键或快捷指令,不花钱,经验
效率,开会前先发一页纸的材料,不花钱,经验
效率,复杂任务先做五分钟，比等状态来更靠谱,不花钱,证据中
效率,每周留一小时清空收件箱和待办,不花钱,经验
效率,用清单代替记忆，别相信自己的脑子,不花钱,证据强
效率,写下来"今天不做什么"和"要做什么"一样重要,不花钱,经验
金钱,先存再花，工资到账当天自动转走一部分,不花钱,证据强
金钱,记账连续记三个月，比任何理财课都管用,不花钱,证据中
金钱,先还清利率最高的那笔债,不花钱,证据强
金钱,买之前先等 48 小时,不花钱,经验
金钱,把年费订阅列成一张表，逐条问还用不用,不花钱,经验
金钱,算清每小时到手工资再决定要不要为省几块钱花一小时,不花钱,经验
金钱,大件先查二手，能省一大截,花钱少,经验
金钱, emergency fund 留够 6 个月固定支出,花钱多,证据强
金钱,别为了满减买不需要的东西,不花钱,经验
金钱,指数基金定投胜过频繁操作,花钱多,证据中
关系,重要的话当面说或打电话，别只发文字,不花钱,经验
关系,记住对方提过的小事，比送贵礼物更打动人,不花钱,经验
关系,定期约固定的人吃饭，关系才不会断,花钱中,经验
关系,道歉要具体说错在哪，不要只说"抱歉",不花钱,证据中
关系,少给建议多问一句"你想让我听着还是帮着想办法",不花钱,经验
关系,把感谢说出口，别默认对方知道,不花钱,证据中
关系,家庭里把"谁负责什么"写清楚，能省掉一半争执,不花钱,经验
学习,想学什么先找一个能做出来的小项目,不花钱,证据中
学习,看完立刻用自己的话复述一遍,不花钱,证据强
学习,把错题和卡住的地方单独记一本,不花钱,证据强
学习,教别人一遍，比自己再看三遍牢,不花钱,证据强
学习,碎片时间用来复习，整块时间用来学新的,不花钱,证据中
学习,先读目录和结论，再决定要不要细读,不花钱,经验
学习,给学过的东西设一周后、一月后两次回顾,不花钱,证据强
生活,把常用的东西放在伸手就能拿到的位置,不花钱,经验
生活,出门前固定检查"手机钥匙钱包"三件套,不花钱,经验
生活,给家里每样东西定一个固定位置,不花钱,经验
生活,拍下冰箱内容再逛超市,不花钱,经验
生活,把说明书和保修卡收进同一个文件袋,不花钱,经验
生活,买一把好用的剪刀和一把好刀,花钱少,经验
生活,定期清理手机相册，别等存储爆了才动手,不花钱,经验
生活,留一套干净衣服专门给"临时出门"用,不花钱,经验
工作,重要沟通结束后发一条文字确认,不花钱,经验
工作,汇报先说结论再说过程,不花钱,证据中
工作,把重复劳动写成模板或脚本,不花钱,证据强
工作,接任务时先确认"做完长什么样",不花钱,证据中
工作,别在没有截止日期的事情上耗一整天,不花钱,经验
工作,每周记录自己做成了什么，年底不用临时编,不花钱,经验
心理,情绪上头时先睡一觉再回复,不花钱,证据中
心理,把"我必须"换成"我选择"，压力会小一点,不花钱,证据中
心理,写三件今天还行的小事，比硬想大道理管用,不花钱,证据中
心理,跟别人比的时候把时间尺度拉到五年,不花钱,经验
心理,允许自己有做不完的事，清单本来就不是为了清空,不花钱,经验
安全,重要账号开两步验证,不花钱,证据强
安全,密码用管理器，别到处复用,不花钱,证据强
安全,家里备一个烟雾报警器和一个灭火器,花钱少,证据强
安全,给手机和电脑开自动备份,不花钱,证据强
安全,出门拍一下燃气灶和门锁,不花钱,经验
安全,把紧急联系人写进手机锁屏信息,不花钱,证据强`);

D.emoji = P(`😀,笑脸,开心
😃,笑脸,高兴
😄,笑脸,大笑
😁,露齿笑,得意
😆,眯眼笑,大笑
😅,苦笑,汗
🤣,笑倒,爆笑
😂,笑哭,笑哭
🙂,微笑,微笑
🙃,倒脸,无语
😉,眨眼,暗示
😊,害羞,温柔
😇,天使,乖
🥰,爱心,爱
😍,花痴,喜欢
🤩,星星眼,惊艳
😘,飞吻,亲
😗,亲吻,亲
😚,闭眼亲,亲
😋,馋,好吃
😛,吐舌,调皮
🤪,疯脸,搞怪
🤨,挑眉,质疑
🧐,单片眼镜,审视
🤓,书呆,学霸
😎,墨镜,酷
🥳,派对,庆祝
😏,坏笑,得意
😒,不屑,无语
😞,失落,难过
😔,低头,失落
😟,担心,不安
😕,困惑,疑惑
🙁,皱眉,不高兴
😣,忍耐,纠结
😖,抓狂,难受
😫,疲惫,累
😩,哀嚎,累
🥺,委屈,求求
😢,流泪,哭
😭,大哭,爆哭
😤,生气,哼
😠,生气,怒
😡,暴怒,火大
🤯,炸头,震惊
😳,脸红,尴尬
🥵,热,热
🥶,冷,冷
😱,尖叫,吓
😨,害怕,怕
😰,冷汗,焦虑
😥,叹气,失落
😓,汗,累
🤗,拥抱,抱抱
🤔,思考,想
🤭,捂嘴,偷笑
🤫,嘘,安静
🤥,说谎,骗
😶,无语,沉默
😐,面无表情,平淡
😑,白眼,无语
😬,尬笑,尴尬
🙄,翻白眼,不耐
😯,惊讶,哦
😦,惊,啊
😧,痛苦,惊
😮,张嘴,哇
😲,震惊,惊
🥱,打哈欠,困
😴,睡着,睡
🤤,流口水,馋
😪,困,想睡
😵,晕,晕
🤐,拉链嘴,闭嘴
🥴,醉,晕乎
🤢,想吐,恶心
🤮,呕吐,吐
🤧,打喷嚏,感冒
😷,口罩,生病
🤒,发烧,病
🤕,受伤,包扎
👍,赞,好
👎,踩,不好
👏,鼓掌,棒
🙌,举手,欢呼
👋,挥手,你好
🤝,握手,合作
🙏,合十,谢谢
💪,肌肉,加油
✌️,胜利,耶
🤞,祈愿,好运
🤟,爱你,手势
🤘,摇滚,手势
👌,OK,可以
🤌,捏,意大利手势
🤏,一点点,少
👈,左指,方向
👉,右指,方向
👆,上指,方向
👇,下指,方向
☝️,一指,强调
✋,手掌,停
🤚,手背,停
🖐️,张手,五
🖖,瓦肯礼,手势
✊,拳头,加油
👊,碰拳,打
🤛,左拳,碰拳
🤜,右拳,碰拳
💯,满分,一百
❤️,红心,爱
🧡,橙心,爱
💛,黄心,爱
💚,绿心,爱
💙,蓝心,爱
💜,紫心,爱
🖤,黑心,暗
🤍,白心,纯
💔,心碎,难过
💖,闪亮心,喜欢
💝,礼物心,送礼
🔥,火,热 火
✨,闪,亮
⭐,星,星
🌟,星星,闪耀
💫,眩晕,闪
⚡,闪电,快
☀️,太阳,晴
🌈,彩虹,彩虹
☁️,云,阴
❄️,雪花,冷
☔,雨伞,雨
💧,水滴,水
🌊,浪,海
🎉,彩带,庆祝
🎊,彩球,庆祝
🎁,礼物,礼物
🎈,气球,生日
🎂,蛋糕,生日
🍰,蛋糕,甜点
☕,咖啡,咖啡
🍵,茶,茶
🍺,啤酒,酒
🍻,干杯,碰杯
🍜,面,拉面
🍚,米饭,饭
🍎,苹果,水果
🍌,香蕉,水果
🐶,狗,动物
🐱,猫,动物
🐼,熊猫,动物
🦊,狐狸,动物
🐻,熊,动物
🐰,兔,动物
🦁,狮子,动物
🐯,虎,动物
🐮,牛,动物
🐷,猪,动物
🐸,青蛙,动物
🐵,猴,动物
🐔,鸡,动物
🐧,企鹅,动物
🐦,鸟,动物
🦋,蝴蝶,昆虫
🌸,樱花,花
🌻,向日葵,花
🌹,玫瑰,花
🌲,树,树
🍀,四叶草,幸运
🌍,地球,地球
🚗,汽车,车
🚌,公交,车
🚕,出租,车
🚲,自行车,车
✈️,飞机,出行
🚀,火箭,发射
🚂,火车,交通
⛵,帆船,船
🏠,房子,家
🏢,办公楼,公司
🏫,学校,学校
🏥,医院,医院
⏰,闹钟,时间
⏳,沙漏,等待
📅,日历,日期
📌,图钉,置顶
📎,回形针,附件
✏️,铅笔,写
📝,备忘录,记录
📖,书,读书
📚,书堆,书
💻,笔记本,电脑
🖥️,显示器,电脑
⌨️,键盘,输入
🖱️,鼠标,点击
📱,手机,手机
📷,相机,拍照
🎧,耳机,听
🎵,音符,音乐
🎶,音符,音乐
🎤,麦克风,唱
🎬,场记板,电影
🎮,手柄,游戏
🎯,靶心,目标
🏆,奖杯,冠军
🥇,金牌,第一
💡,灯泡,点子
🔍,放大镜,搜索
🔒,锁,安全
🔑,钥匙,密钥
🔔,铃,提醒
📣,喇叭,公告
💬,对话,消息
💭,想,思考
✅,勾,完成
❌,叉,错误
⚠️,警告,注意
❓,问号,疑问
❗,感叹号,重要
➕,加,加
➖,减,减
✔️,对勾,对
♻️,回收,循环
🔗,链接,链接
📈,涨,上涨
📉,跌,下跌
💰,钱袋,钱
💳,信用卡,支付
🧮,算盘,计算
🧭,指南针,方向
🧩,拼图,拼图
🀄,麻将,中文`);

/* 常见食材密度 g/ml，用于杯/勺换算 */
D.cooking = P(`水,1
牛奶,1.03
食用油,0.92
蜂蜜,1.42
白砂糖(细),0.85
面粉(中筋),0.53
米粉,0.6
玉米淀粉,0.5
可可粉,0.42
盐(细),1.2
黄油,0.91
糖粉,0.56
燕麦片,0.35
大米(生),0.85
酱油,1.15
醋,1.01
番茄酱,1.1
花生酱,1.05
酸奶,1.05
鸡蛋(去壳),1.03
奶油,0.95`);

/* 静态汇率参考（相对 CNY，离线参考值，页面会提示非实时） */
D.currency = P(`CNY,人民币,1,中国
USD,美元,7.12,美国
EUR,欧元,7.72,欧元区
JPY,日元,0.047,日本
GBP,英镑,9.15,英国
HKD,港元,0.915,中国香港
TWD,新台币,0.221,中国台湾
KRW,韩元,0.0052,韩国
SGD,新加坡元,5.38,新加坡
AUD,澳元,4.72,澳大利亚
CAD,加元,5.19,加拿大
CHF,瑞士法郎,8.12,瑞士
THB,泰铢,0.205,泰国
VND,越南盾,0.00028,越南
MYR,马来西亚林吉特,1.61,马来西亚
RUB,俄罗斯卢布,0.078,俄罗斯
INR,印度卢比,0.085,印度
BRL,巴西雷亚尔,1.28,巴西
MXN,墨西哥比索,0.38,墨西哥
NZD,新西兰元,4.31,新西兰
SEK,瑞典克朗,0.68,瑞典
NOK,挪威克朗,0.65,挪威
DKK,丹麦克朗,1.03,丹麦
PLN,波兰兹罗提,1.8,波兰
TRY,土耳其里拉,0.21,土耳其
AED,阿联酋迪拉姆,1.94,阿联酋
SAR,沙特里亚尔,1.9,沙特
ZAR,南非兰特,0.39,南非
IDR,印尼盾,0.00044,印尼
PHP,菲律宾比索,0.124,菲律宾
MOP,澳门元,0.888,中国澳门`);

/* 海外物价标尺：城市 -> 汉堡/咖啡/地铁/出租车（折人民币） */
D.travelPrice = P(`东京,42,28,12,32
大阪,38,25,11,30
首尔,40,30,9,26
新加坡,48,32,11,35
曼谷,30,22,7,16
清迈,22,16,4,12
吉隆坡,28,20,6,15
河内,20,15,4,11
胡志明市,22,16,5,12
巴厘岛,30,22,5,14
巴黎,68,32,16,48
伦敦,72,35,22,55
柏林,58,28,16,42
罗马,55,24,12,40
阿姆斯特丹,65,32,18,48
苏黎世,88,42,22,68
纽约,75,35,20,50
洛杉矶,68,34,18,46
旧金山,78,38,22,55
温哥华,62,30,16,42
悉尼,62,30,18,45
墨尔本,58,28,17,42
迪拜,65,38,12,30
伊斯坦布尔,32,18,5,16
莫斯科,35,22,6,18
开罗,22,14,3,10
里斯本,45,20,11,26
巴塞罗那,50,24,13,32
布拉格,38,20,8,22
布达佩斯,32,17,7,18`);

/* 手机号段 -> 运营商 */
D.phoneOp = { '13': '中国移动/联通/电信', '14': '中国移动/联通/电信', '15': '中国移动/联通/电信', '16': '中国移动/联通/电信', '17': '中国移动/联通/电信', '18': '中国移动/联通/电信', '19': '中国移动/联通/电信' };
D.idRegion = P(`11,北京
12,天津
13,河北
14,山西
15,内蒙古
21,辽宁
22,吉林
23,黑龙江
31,上海
32,江苏
33,浙江
34,安徽
35,福建
36,江西
37,山东
41,河南
42,湖北
43,湖南
44,广东
45,广西
46,海南
50,重庆
51,四川
52,贵州
53,云南
54,西藏
61,陕西
62,甘肃
63,青海
64,宁夏
65,新疆
71,台湾
81,香港
82,澳门
91,国外`);

D.tax = P(`0,36000,3,0
36000,144000,10,2520
144000,300000,20,16920
300000,420000,25,31920
420000,660000,30,52920
660000,960000,35,85920
960000,Infinity,45,181920`);

/* 派生表：给速查引擎直接用 */
D.httpRef = [
  ...D.httpStatus.map((r) => ['状态码', r[0], r[1], r[2], r[3]]),
  ...D.mime.map((r) => ['MIME', r[0], r[1], r[2], '']),
];
D.cocaRows = D.coca.map((w, i) => [i + 1, w,
  i < 500 ? '核心高频' : i < 1200 ? '中学/高考' : i < 2000 ? '四六级/雅思' : '进阶/学术']);
D.asciiRows = Array.from({ length: 128 }, (_, i) => {
  const printable = i >= 32 && i < 127;
  const names = { 0: 'NUL 空', 9: 'TAB 制表', 10: 'LF 换行', 13: 'CR 回车', 27: 'ESC 退出', 32: 'SPACE 空格', 127: 'DEL 删除' };
  return [i, i.toString(16).toUpperCase().padStart(2, '0'), i.toString(8).padStart(3, '0'), i.toString(2).padStart(8, '0'), printable ? String.fromCharCode(i) : (names[i] || `控制字符 ${i}`), printable ? '可打印' : '控制字符'];
});
D.unitsKeys = Object.keys(D.units);
D.emojiRows = D.emoji;
D.lifeGuideRows = D.lifeGuide;
D.poetryRows = D.poetry;
D.currencyRows = D.currency;
D.phoneRegionRows = D.idRegion;
D.cookingRows = D.cooking;

D.ancient = P(`秦,尺,23.1,cm
汉,尺,23.1,cm
三国,尺,24.2,cm
晋,尺,24.5,cm
南北朝,尺,24.5,cm
隋,尺,29.6,cm
唐,尺,30.3,cm
宋,尺,31.2,cm
元,尺,31.2,cm
明,尺,32,cm
清,尺,32,cm
唐,里,531,m
宋,里,559,m
明,里,576,m
清,里,576,m
汉,斤,258,g
唐,斤,596,g
宋,斤,634,g
明,斤,596,g
清,斤,596,g
汉,升,0.2,L
唐,升,0.6,L
宋,升,0.66,L
明,升,1.07,L
清,升,1.035,L`);
