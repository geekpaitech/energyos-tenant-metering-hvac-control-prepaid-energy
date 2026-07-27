import { Message } from 'element-ui'

/** 拦截器已弹过后标记，避免页面 catch 重复 toast */
export const API_ERROR_NOTIFIED = '__apiErrorNotified'

const DEFAULT_FALLBACK = '操作失败'

/**
 * 从 API 异常中取出可展示文案。
 * 兼容业务 reject(createApiError) 与网络层 reject(Error)。
 */
export function getApiErrorMessage (err, fallback = DEFAULT_FALLBACK) {
  if (err == null) return fallback
  if (typeof err === 'string') {
    const text = err.trim()
    return text || fallback
  }
  const msg = err.msg || err.message
  if (msg != null && String(msg).trim()) {
    return String(msg).trim()
  }
  return fallback
}

/**
 * 将后端 { code, msg, data } 转为 Error，message 即为后端 msg，便于 catch 里读 error.message。
 */
export function createApiError (res, fallback = DEFAULT_FALLBACK) {
  const msg = getApiErrorMessage(res, fallback)
  const err = new Error(msg)
  if (res && typeof res === 'object') {
    err.code = res.code
    err.msg = res.msg
    err.data = res.data
  }
  return err
}

function shouldSkipErrorMessage (config) {
  return !!(config && config.skipErrorMessage)
}

/** 短时间相同文案只弹一次（避免并行请求重复 toast） */
let lastNotifyKey = ''
let lastNotifyAt = 0
const NOTIFY_DEDUPE_MS = 2500

function shouldDedupeNotify (text) {
  const now = Date.now()
  if (text === lastNotifyKey && now - lastNotifyAt < NOTIFY_DEDUPE_MS) {
    return true
  }
  lastNotifyKey = text
  lastNotifyAt = now
  return false
}

/**
 * 业务/网络错误统一弹窗（拦截器与页面共用，带去重）。
 */
export function notifyApiError (err, fallback = DEFAULT_FALLBACK, config) {
  if (err && err[API_ERROR_NOTIFIED]) return
  if (shouldSkipErrorMessage(config)) return
  const text = getApiErrorMessage(err, fallback)
  if (shouldDedupeNotify(text)) return
  Message.error(text)
  if (err && typeof err === 'object') {
    err[API_ERROR_NOTIFIED] = true
  }
}
