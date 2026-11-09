/* 每日定时复核入口。
   Vercel Cron 的 path 只认纯路径（带 ?query 可能被当成路径字符），所以单独留一个薄入口，
   把请求转成 /api/links?job=verify 再交给主接口。头信息原样透传，
   CRON_SECRET / vercel-cron User-Agent / x-vercel-cron-schedule 都还在。 */
'use strict';

import links from './links.js';

export default {
  async fetch(request) {
    const u = new URL(request.url);
    u.pathname = '/api/links';
    u.search = '?job=verify';
    return links.fetch(new Request(u.toString(), {
      method: 'GET',
      headers: request.headers,
    }));
  },
};
