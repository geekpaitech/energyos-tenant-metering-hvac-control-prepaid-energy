import axios from 'axios'

import { Message } from 'element-ui'

import store from '@/store'

import Cookies from 'js-cookie'

import { createApiError, getApiErrorMessage, notifyApiError } from '@/utils/apiError'

// 后端 API 根地址（开源版本请替换为实际部署地址，并同步 vue.config.js proxy）

export const API_BACKEND_ROOT = ''

// 创建axios实例

const service = axios.create({

  baseURL: process.env.NODE_ENV === 'development' ? '' : API_BACKEND_ROOT,

  timeout: 10000

})

/** 权限三页用：API 为 iot-test 则视为测试环境 */

export function isPermissionTestEnv () {
  return API_BACKEND_ROOT.toLowerCase().includes('iot-test')
}

// 防止重复处理10002和重复刷新
let isHandlingTokenExpired = false
let hasRefreshed = false

// 大屏免登录路由标识
const BIGSCREEN_ROUTE = '/bigscreen/property-screen'
// 大屏token失效事件名
const BIGSCREEN_TOKEN_EXPIRED_EVENT = 'bigscreen:tokenExpired'

// 判断当前是否在大屏免登录路由
function isOnBigscreenRoute () {
  try {
    return window.location.hash === `#${BIGSCREEN_ROUTE}` ||
           window.location.hash.startsWith(`#${BIGSCREEN_ROUTE}?`)
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

    const token = store.getters.token || Cookies.get('Admin-Token')

    if (token) {
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

      if (!isHandlingTokenExpired) {
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
    isHandlingTokenExpired = false
    // 触发全局事件，通知大屏组件重登
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(BIGSCREEN_TOKEN_EXPIRED_EVENT, { detail: { message } }))
    }
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

export { getApiErrorMessage }

export default service
