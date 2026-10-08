import { AI_ROOT } from '@/config/services'

// 保留原有调用入口；地址统一在 vue.config.js 配置。
export const AI_SERVICE_URL = AI_ROOT

/**
 * 获取完整的 API 路径
 * @param {string} path - 相对路径，例如 '/api/chat'
 * @returns {string} 完整 URL
 */
export function getAiApiUrl (path) {
  // 确保 path 以 / 开头
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  // 移除 URL 末尾的 / (如果有)
  const baseUrl = AI_SERVICE_URL.endsWith('/') ? AI_SERVICE_URL.slice(0, -1) : AI_SERVICE_URL
  return baseUrl + path
}

export default {
  AI_SERVICE_URL,
  getAiApiUrl
}
