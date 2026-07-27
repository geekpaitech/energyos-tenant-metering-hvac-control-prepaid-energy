import store from '@/store'
import Cookies from 'js-cookie'
import { getAiApiUrl } from '@/utils/aiServiceConfig'

/**
 * 发送 AI 聊天消息
 */
export function sendChatMessage (question) {
  // 🔥 获取当前管理方 ID
  const managerId = store.getters['manager/currentManagerId']

  // 🔥 获取 Token
  const token = Cookies.get('Admin-Token') || store.getters.token

  // 🔥 如果没有 managerId 或 token，返回错误
  if (!managerId) {
    return Promise.reject(new Error('未选择管理方，请先选择管理方'))
  }

  if (!token) {
    return Promise.reject(new Error('未登录，请先登录'))
  }

  return new Promise((resolve, reject) => {
    fetch(getAiApiUrl('/api/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Manager-Id': String(managerId), // 🔥 传递管理方 ID
        'X-Token': token // 🔥 传递 Token
      },
      body: JSON.stringify({ question })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        resolve({ data })
      })
      .catch(error => {
        reject(error)
      })
  })
}
