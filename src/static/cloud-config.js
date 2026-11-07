/* 云服务公开配置：取自环境激活时返回的 publicConfig，允许随前端发布。
   这里没有任何长期密钥或管理凭据；服务端按 publishableKey 与请求来源校验。 */
window.__CLOUD_CONFIG__ = {
  endpoint: 'https://gitd-tools.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_w22bLA8jyiU3DUuPAWT7u3_R1feI6yebetzEaOYBarriGrzwnvMKwK5'
};
