// AI 服务配置
// 通过注释切换本地和线上环境

// ------------------------------------------------------------------
// 1. 本地开发环境 (Local Development)
// export const AI_SERVICE_URL = 'http://localhost:8000'

// 2. 线上生产环境 (Production)
export const AI_SERVICE_URL = 'https://ai.example.com'
// ------------------------------------------------------------------

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
