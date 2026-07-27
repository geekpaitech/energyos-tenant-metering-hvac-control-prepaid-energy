/** B 端 SSO 页面提示文案 */
export const SSO_USER_MESSAGES = {
  loading: '正在登录，请稍候…',
  titleFailed: '登录失败',
  noEntry: '请从企业门户进入本系统，勿直接访问或收藏本链接。',
  idpDenied: '登录已取消，或当前账号无访问权限。',
  networkFailed: '登录失败，请稍后重试；或使用账号密码登录。',
  loginBtn: '账号密码登录',
  success: '登录成功'
}

/**
 * 将接口/IdP 返回的英文或技术描述转为更易懂的说明（能识别则替换，否则原样或兜底）
 */
export function toUserFriendlySsoError (raw) {
  const text = String(raw || '').trim()
  if (!text) {
    return SSO_USER_MESSAGES.networkFailed
  }
  const lower = text.toLowerCase()
  if (lower.includes('network') || lower.includes('timeout') || text.includes('超时')) {
    return '网络异常，请稍后重试。'
  }
  if (lower.includes('access_denied') || text.includes('拒绝') || text.includes('取消')) {
    return SSO_USER_MESSAGES.idpDenied
  }
  // 后端若已是中文业务文案，直接展示
  if (/[\u4e00-\u9fa5]/.test(text) && !/凭证|ticket|token|code|sso|oauth/i.test(text)) {
    return text
  }
  return SSO_USER_MESSAGES.networkFailed
}

/**
 * 从 SSO 回调 URL 解析凭证（兼容常见 IdP 参数名）
 */
export function parseSsoCallbackQuery (query = {}) {
  const code =
    query.code ||
    query.authCode ||
    query.authorization_code ||
    ''
  const ticket = query.ticket || query.sso_ticket || ''
  // 部分门户用 token / access_token 传一次性票据（非我方最终 Admin-Token）
  const exchangeToken =
    query.token ||
    query.ssoToken ||
    query.exchangeToken ||
    query.access_token ||
    query.accessToken ||
    ''
  const state = query.state || ''
  const error = query.error || query.err || ''
  const errorDescription =
    query.error_description ||
    query.errorDescription ||
    query.msg ||
    ''

  const codeStr = String(code).trim()
  const ticketStr = String(ticket).trim()
  const exchangeStr = String(exchangeToken).trim()

  return {
    code: codeStr,
    ticket: ticketStr,
    exchangeToken: exchangeStr,
    state: String(state).trim(),
    error: String(error).trim(),
    errorDescription: String(errorDescription).trim(),
    hasCredential: Boolean(codeStr || ticketStr || exchangeStr)
  }
}

/**
 * 回调成功后的站内跳转路径（防开放重定向）
 */
export function resolveSafeRedirect (raw) {
  if (raw == null || raw === '') {
    return '/'
  }
  let path = String(raw)
  try {
    path = decodeURIComponent(path)
  } catch (e) {
    path = String(raw)
  }
  path = path.trim()
  if (!path.startsWith('/') || path.startsWith('//')) {
    return '/'
  }
  return path
}

/** 与 store/modules/manager.js 中 selectedManagerId 键一致 */
export const SSO_MANAGER_ID_STORAGE_KEY = 'selectedManagerId'

/**
 * SSO 回调：第三方传入 managerId 时，写入 localStorage，供 getManagerList 优先选中。
 * 未传则不改动，不影响账号密码登录等既有流程。
 */
export function applySsoManagerId (raw) {
  if (raw == null || raw === '') return
  const id = String(raw).trim()
  if (!id) return
  localStorage.setItem(SSO_MANAGER_ID_STORAGE_KEY, id)
}

/**
 * 当前页完整地址，供后端校验 redirect_uri
 */
export function getCurrentCallbackUri () {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.location.href.split('#')[0] + '#/sso/callback'
}
