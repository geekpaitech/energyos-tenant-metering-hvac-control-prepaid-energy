/** B 端 SSO 页面提示文案 */
export const SSO_USER_MESSAGES = {
  loading: '正在登录，请稍候…',
  titleFailed: '登录失败',
  noEntry: '请从企业门户进入本系统，勿直接访问或收藏本链接。',
  idpDenied: '登录已取消，或当前账号无访问权限。',
  invalidCredential: '单点登录凭证无效或已失效，请确认链接中的 code 完整无误后刷新重试；若仍失败，请重新从统一门户进入。',
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
  if (
    lower.includes('des') ||
    lower.includes('decrypt') ||
    lower.includes('padding') ||
    lower.includes('padded') ||
    lower.includes('bad key') ||
    lower.includes('final block') ||
    lower.includes('invalid code') ||
    lower.includes('code invalid') ||
    text.includes('解密') ||
    text.includes('凭证无效') ||
    text.includes('凭证过期') ||
    text.includes('code无效') ||
    text.includes('code过期')
  ) {
    return SSO_USER_MESSAGES.invalidCredential
  }
  // 后端若已是中文业务文案，直接展示
  if (/[\u4e00-\u9fa5]/.test(text) && !/凭证|ticket|token|code|sso|oauth/i.test(text)) {
    return text
  }
  return SSO_USER_MESSAGES.networkFailed
}

/**
 * 从 SSO 回调 URL 解析 DES 手机号密文及可选的管理方参数。
 */
export function parseSsoCallbackQuery (query = {}) {
  const code =
    query.code ||
    query.authCode ||
    query.authorization_code ||
    ''
  const groupCode = query.groupCode || query.group_code || ''
  const managerId = query.managerId || query.manager_id || ''
  const error = query.error || query.err || ''
  const errorDescription =
    query.error_description ||
    query.errorDescription ||
    query.msg ||
    ''

  // Base64 密文中的 “+” 可能被查询参数解析为空格，密文本身不会包含空格，可安全恢复。
  const codeStr = String(code).trim().replace(/ /g, '+')

  return {
    code: codeStr,
    groupCode: String(groupCode).trim(),
    managerId: String(managerId).trim(),
    error: String(error).trim(),
    errorDescription: String(errorDescription).trim(),
    hasCredential: Boolean(codeStr)
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
 * 清除本地记忆的管理方 ID。
 * SSO 换账号前调用，避免上一个账号的管理方选择残留到新账号。
 */
export function clearSsoManagerId () {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SSO_MANAGER_ID_STORAGE_KEY)
}
