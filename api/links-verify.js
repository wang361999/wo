/* 每日定时复核入口。
   定时任务只打这个纯路径，这里把请求转成 /api/links?job=verify 再交给主接口，
   避免在调度配置里写查询串。头信息原样透传，
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
