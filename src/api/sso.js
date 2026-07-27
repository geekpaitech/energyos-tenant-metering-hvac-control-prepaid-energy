import request from '@/utils/request'

/**
 * SSO 回调换票（本系统 Admin-Token）
 *
 * 约定（与现有 login 保持一致，后端落地后可微调）：
 * - 请求 POST /api/ebc-auth/auth/sso/callback
 * - Body: { channel, code?, ticket?, exchangeToken?, state?, redirectUri? }
 * - 成功: { code: 200, data: "<token字符串>" }  — data 形态同 /auth/login
 *
 * @param {Object} payload
 * @param {string} [payload.code] OAuth2 授权码
 * @param {string} [payload.ticket] CAS / 门户 ticket
 * @param {string} [payload.exchangeToken] 门户一次性 token（对应 URL ?token=）
 * @param {string} [payload.state] 防 CSRF，发起登录时生成
 * @param {string} [payload.redirectUri] 当前回调完整地址（部分 IdP 校验 redirect_uri）
 */
export function ssoExchange (payload) {
  const {
    code = '',
    ticket = '',
    exchangeToken = '',
    state = '',
    redirectUri = ''
  } = payload || {}

  return request({
    url: '/api/ebc-auth/auth/sso/callback',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data: {
      channel: 1,
      code,
      ticket,
      exchangeToken,
      state,
      redirectUri
    }
  })
}
