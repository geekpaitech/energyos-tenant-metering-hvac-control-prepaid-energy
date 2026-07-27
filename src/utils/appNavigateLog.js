/**
 * 供第三方联调：统一导航 / 外链日志前缀与敏感参数脱敏。
 */

const LOG_PREFIX = '[AppNavigate]'

/**
 * 将 URL 查询参数中的 token 替换为 (redacted)，避免控制台泄露完整凭证。
 * @param {string} url
 * @returns {string}
 */
export function maskTokenInUrl (url) {
  return String(url || '')
    .replace(/([?&#])token=[^&]*/gi, '$1token=(redacted)')
}

/**
 * @param {string} kind 简短分类，如 vue-router | subsystem-iframe | external-window-open
 * @param {Record<string, unknown>} payload
 */
export function logAppNavigate (kind, payload) {
  console.log(LOG_PREFIX, kind, {
    time: new Date().toISOString(),
    ...payload
  })
}
