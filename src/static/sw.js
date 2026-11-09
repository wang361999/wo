/* 一页工具 · 离线缓存
   原则：① 只缓存静态资源，/api/ 下的统计、汇率、IP、友链等实时请求一律不碰；
        ② 不预缓存 586 个页面，访问过的页面才进缓存，避免装一次下载整站；
        ③ 导航请求网络优先，断网时回退到缓存页，再回退到离线卷。
   改版后把 VERSION 递增一次，旧缓存会在 activate 时清掉。 */
const VERSION = 'gitd-v1';
const CACHE = 'gitd-' + VERSION;
const OFFLINE = '/offline.html';

/* 首次安装时缓存的最小集合：保证断网也能打开首页、有样式、有工具骨架。 */
const CORE = [
  '/', '/style.css', '/favicon.svg', '/manifest.webmanifest',
  '/icon-192.png', '/icon-512.png', OFFLINE,
  '/tools-map.js', '/app.js', '/ui.js', '/tool.js', '/kit.js', '/stats.js', '/sync.js', '/links.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 单个资源 404 不该让整个安装失败
    await Promise.all(CORE.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('gitd-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return;

  // 页面：网络优先，成功就顺手存一份；断网时先找这个页面，再退回离线卷。
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (e) {
        return (await cache.match(req))
          || (await cache.match(OFFLINE))
          || new Response('离线', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  // 静态资源：缓存优先，同时后台更新，下次打开就是新版。
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    const net = fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);
    if (hit) return hit;
    return (await net) || new Response('', { status: 504 });
  })());
});
