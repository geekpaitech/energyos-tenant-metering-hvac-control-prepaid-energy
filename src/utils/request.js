import axios from 'axios'

import { Message } from 'element-ui'

import store from '@/store'

import Cookies from 'js-cookie'

import { createApiError, getApiErrorMessage, notifyApiError } from '@/utils/apiError'

import { BACKEND_ROOT, API_BASE_URL, REQUEST_TIMEOUT } from '@/config/services'

// 保留已有导出，地址统一在 vue.config.js 配置。
export const API_BACKEND_ROOT = BACKEND_ROOT

// 创建axios实例

const service = axios.create({

  baseURL: API_BASE_URL,

  timeout: REQUEST_TIMEOUT

})

/** 权限三页用：API 为 iot-test 则视为测试环境 */

export function isPermissionTestEnv () {
  return API_BACKEND_ROOT.toLowerCase().includes('iot-test')
}

// 防止重复处理10002和重复刷新
let isHandlingTokenExpired = false
let hasRefreshed = false
let bigscreenTokenExpiredReleaseTimer = null

// 大屏免登录路由标识
const BIGSCREEN_ROUTES = ['/bigscreen/property-screen', '/bigscreen/energy-screen']
// 大屏token失效事件名
const BIGSCREEN_TOKEN_EXPIRED_EVENT = 'bigscreen:tokenExpired'

// 判断当前是否在大屏免登录路由
function isOnBigscreenRoute () {
  try {
    const hashPath = window.location.hash
      .replace(/^#/, '')
      .split('?')[0]
      .replace(/\/+$/, '')
    return BIGSCREEN_ROUTES.includes(hashPath)
  } catch (e) {
    return false
  }
}

// 请求拦截器

service.interceptors.request.use(

  (config) => {
    config.headers['Content-Type'] = 'application/json'

    config.headers.userDeviceType = 'PC'

    // 兼容首屏初始化时vuex token尚未回填，回退读取cookie

    // Cookie 在同源标签页之间共享，应作为跨标签页的最新 token 来源
    const token = Cookies.get('Admin-Token') || store.getters.token
    const skipAuth = !!config.skipAuth

    // 记录请求发出时使用的 token，用于识别新会话建立后才返回的旧请求
    config.__authToken = skipAuth ? '' : (token || '')

    if (token && !skipAuth) {
      config.headers['X-Token'] = token

      config.headers.Authorization = token
    }

    return config
  },

  (error) => {
    return Promise.reject(error)
  }

)

// 响应拦截器

service.interceptors.response.use(

  (response) => {
    const res = response.data

    if (res.code === 200) {
      return res
    } else if (res.code === 10002) {
      console.error('token过期:', res.msg)

      console.error('当前URL:', window.location.href)

      const requestToken = response.config && response.config.__authToken
      const currentToken = Cookies.get('Admin-Token') || store.getters.token || ''
      const isStaleTokenResponse = !!(
        requestToken &&
        currentToken &&
        requestToken !== currentToken
      )
      const skipTokenExpiredHandling = !!(
        response.config && response.config.skipTokenExpiredHandling
      )

      if (isStaleTokenResponse) {
        console.log('忽略旧token请求的迟到失效响应')
      } else if (!skipTokenExpiredHandling && !isHandlingTokenExpired) {
        isHandlingTokenExpired = true

        handleTokenExpiredSimple(res.msg || '您已在其他地方登录')
      }

      return Promise.reject(createApiError(res, res.msg || 'token过期'))
    } else {
      console.error('接口业务错误:', res.code, res.msg || 'Error')

      const err = createApiError(res)

      notifyApiError(err, '操作失败', response.config)

      return Promise.reject(err)
    }
  },

  (error) => {
    let message = '请求失败'

    if (error.response) {
      message = `请求失败: ${error.response.status}`
    } else if (error.request) {
      message = '网络错误，请检查网络连接'
    } else {
      message = error.message || '未知错误'
    }

    console.error('错误详情:', message)

    const err = new Error(message)

    notifyApiError(err, message, error.config)

    return Promise.reject(err)
  }

)

// 终极简单处理：跳首页 + 无痕刷新一次（大屏路由例外）
function handleTokenExpiredSimple (message) {
  console.log('=== 终极简单处理：跳首页+刷新 ===')

  // 如果在大屏免登录路由，触发事件让大屏组件自动重登，不要跳首页
  if (isOnBigscreenRoute()) {
    console.log('=== 大屏路由token失效，触发自动重登 ===')
    // 触发全局事件，通知大屏组件重登
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(BIGSCREEN_TOKEN_EXPIRED_EVENT, { detail: { message } }))
    }
    // 给页面恢复逻辑一个去重窗口，防止并行接口形成重登风暴
    clearTimeout(bigscreenTokenExpiredReleaseTimer)
    bigscreenTokenExpiredReleaseTimer = setTimeout(() => {
      isHandlingTokenExpired = false
    }, 1200)
    return
  }

  Message({
    message: message + '，正在重新加载...',
    type: 'warning',
    duration: 1500
  })

  quickCleanup()

  setTimeout(() => {
    jumpToHomeAndRefresh()
  }, 500)
}

// 快速清理必要缓存

function quickCleanup () {
  try {
    const TokenKey = 'Admin-Token'

    Cookies.remove(TokenKey)

    localStorage.removeItem('selectedPlatform')

    if (store.commit) {
      store.commit('user/SET_TOKEN', '')

      store.commit('user/SET_USER_INFO_LOADED', false)
    }
  } catch (error) {
    console.error('清理缓存出错:', error)
  }
}

// 跳转首页并无痕刷新一次

function jumpToHomeAndRefresh () {
  try {
    isHandlingTokenExpired = false

    window.location.hash = '/'

    const refreshFlag = 'token_expired_refreshed'

    const alreadyRefreshed = sessionStorage.getItem(refreshFlag)

    if (!alreadyRefreshed && !hasRefreshed) {
      hasRefreshed = true

      sessionStorage.setItem(refreshFlag, 'true')

      setTimeout(() => {
        window.location.reload()
      }, 200)
    }
  } catch (error) {
    console.error('跳转和刷新失败:', error)

    window.location.reload()
  }
}

// 页面加载时清理刷新标记

window.addEventListener('load', () => {
  setTimeout(() => {
    const refreshFlag = 'token_expired_refreshed'

    if (sessionStorage.getItem(refreshFlag)) {
      sessionStorage.removeItem(refreshFlag)
    }
  }, 3000)
})

// 大屏建立新会话后立即释放拦截器锁，后续新 token 异常仍可被及时感知
window.addEventListener('bigscreen:authRecovered', () => {
  clearTimeout(bigscreenTokenExpiredReleaseTimer)
  isHandlingTokenExpired = false
})

export { getApiErrorMessage }

export default service
