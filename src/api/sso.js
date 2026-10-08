import request from '@/utils/request'

/**
 * SSO 登录：统一认证通过 redirect 带入 DES 手机号密文，后端解密校验后换发本系统 token。
 *
 * - 请求 POST /api/ebc-auth/auth/ssoLogin
 * - Body: { code, groupCode?, managerId? }
 *   - code      必填，DES 加密的手机号密文
 *   - groupCode 选填，管理方（项目）编码，优先级高于 managerId
 *   - managerId 选填，项目 ID（integer）
 * - 成功: { code: 200, data: "<token字符串>" } — data 与 /auth/login 返回一致
 *
 * @param {Object} payload
 * @param {string} payload.code DES 加密的手机号密文
 * @param {string} [payload.groupCode] 管理方（项目）编码
 * @param {string|number} [payload.managerId] 项目 ID
 */
export function ssoExchange (payload) {
  const {
    code = '',
    groupCode = '',
    managerId
  } = payload || {}

  const data = { code }
  if (groupCode) {
    data.groupCode = groupCode
  }

  const numericManagerId = Number(managerId)
  if (Number.isInteger(numericManagerId) && numericManagerId > 0) {
    data.managerId = numericManagerId
  }

  return request({
    url: '/api/ebc-auth/auth/ssoLogin',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data,
    skipAuth: true,
    skipErrorMessage: true
  })
}
