import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import Cookies from 'js-cookie'
import { getDocumentTitle } from './i18n'
import { logAppNavigate } from '@/utils/appNavigateLog'

NProgress.configure({ showSpinner: false })

const TokenKey = 'Admin-Token'
function getToken () {
  return Cookies.get(TokenKey)
}

// 白名单路由
const whiteList = ['/login', '/sso/callback', '/404', '/401', '/switching', '/bigscreen/property-screen', '/bigscreen/energy-screen']

router.beforeEach(async (to, from, next) => {
  NProgress.start()

  // 设置页面标题
  document.title = getDocumentTitle(to.meta && to.meta.title)

  // SSO 回调页始终放行，由页面内完成清票、换票、再跳转
  if (to.path === '/sso/callback') {
    next()
    NProgress.done()
    return
  }

  // 大屏免登入口始终放行，由页面内完成自动登录、生成路由、再跳转
  if (to.path === '/bigscreen/property-screen' || to.path === '/bigscreen/energy-screen') {
    next()
    NProgress.done()
    return
  }

  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // 有 token 但无有效首页（如残留 Cookie）时留在登录页，避免误跳 401
      const redirectPath = await getRedirectPath()
      if (redirectPath === '/401') {
        await store.dispatch('user/resetToken')
        next()
        NProgress.done()
        return
      }
      next({ path: redirectPath, replace: true })
      NProgress.done()
      return
    }

    // 检查是否有用户信息和路由
    const hasUserInfo =
      store.getters.name &&
      store.getters.roles &&
      store.getters.roles.length > 0
    const hasRoutes =
      store.getters['permission/routesInitialized'] &&
      store.getters.permission_routes &&
      store.getters.permission_routes.length > 0

    if (hasUserInfo && hasRoutes) {
      // 已有用户信息和路由，直接通过
      const role =
        store.getters.role ||
        store.getters.roles?.[0] ||
        store.state.user.role ||
        (store.state.user.roles && store.state.user.roles[0])
      if (to.path.startsWith('/admin') && role !== 'SYS_ADMIN') {
        next({ path: '/401', replace: true })
        NProgress.done()
        return
      }

      // 根路径无独立页面，重定向到当前平台首页（console 用户此前会命中 */404）
      if (to.path === '/' || to.path === '') {
        const redirectPath = await getRedirectPath()
        next({ path: redirectPath, replace: true })
        NProgress.done()
        return
      }

      next()
    } else {
      try {
        // 获取用户信息（如果还没有）
        let role = store.getters.roles?.[0]
        if (!hasUserInfo) {
          const userInfo = await store.dispatch('user/getUserInfo')
          role = userInfo.role
        }

        if (to.path.startsWith('/admin') && role !== 'SYS_ADMIN') {
          next({ path: '/401', replace: true })
          NProgress.done()
          return
        }

        // 生成路由（如果还没有）
        if (!hasRoutes) {
          // 确定目标平台
          const targetPlatform = await determinePlatform(role)

          // 生成和添加路由
          const accessRoutes = await store.dispatch(
            'permission/generateRoutes',
            {
              role,
              platform: targetPlatform
            }
          )

          if (accessRoutes && accessRoutes.length > 0) {
            // 添加路由
            router.addRoutes(accessRoutes)

            // 处理根路径重定向
            if (to.path === '/' || to.path === '') {
              const redirectPath = await getRedirectPath()
              next({ path: redirectPath, replace: true })
              return
            }

            // 重新导航到目标路由，让新添加的路由生效

            next({ ...to, replace: true })
            return
          } else {
            console.error('没有生成任何路由，跳转401')
            next({ path: '/401', replace: true })
            NProgress.done()
            return
          }
        }

        // 如果用户信息和路由都已存在，直接通过
        next()
      } catch (error) {
        console.error('初始化失败:', error)
        await handleAuthError(error, to.path)
        next({
          path: '/login?redirect=' + encodeURIComponent(to.path),
          replace: true
        })
        NProgress.done()
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next({
        path: '/login?redirect=' + encodeURIComponent(to.path),
        replace: true
      })
      NProgress.done()
    }
  }
})

router.afterEach((to, from) => {
  NProgress.done()
  try {
    logAppNavigate('vue-router', {
      fromFullPath: from.fullPath,
      fromName: from.name,
      toFullPath: to.fullPath,
      toPath: to.path,
      toName: to.name,
      params: { ...to.params },
      query: { ...to.query },
      hash: to.hash || '',
      windowHref: typeof window !== 'undefined' ? window.location.href : ''
    })
  } catch (e) {
    console.warn('[AppNavigate] vue-router log failed', e)
  }
})

// 全局错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  NProgress.done()
})

/**
 * 确定用户应该使用的平台
 */
async function determinePlatform (role) {
  // 首先尝试从localStorage读取上次选择的平台
  const savedPlatform = localStorage.getItem('selectedPlatform')

  // 获取用户可用平台列表
  const {
    getAvailablePlatforms,
    getDefaultPlatform
  } = require('@/utils/routeConfig')
  const availablePlatforms = getAvailablePlatforms(role)

  // 验证保存的平台是否有效
  if (savedPlatform && availablePlatforms.includes(savedPlatform)) {
    return savedPlatform
  }

  // 使用默认平台
  return getDefaultPlatform(role)
}

/**
 * 获取重定向路径
 */
async function getRedirectPath () {
  // 获取当前平台信息
  const currentPlatform = store.getters['permission/currentPlatform']

  // 根据当前平台确定重定向路径
  if (currentPlatform === 'console') {
    return '/metering/dashboard'
  } else if (currentPlatform === 'admin') {
    return '/admin/dashboard'
  }

  // 如果没有明确的平台信息，查找第一个可用路由
  const permissionRoutes = store.getters.permission_routes
  if (permissionRoutes && permissionRoutes.length > 0) {
    const firstAccessiblePath = findFirstAccessibleRoute(permissionRoutes)
    if (firstAccessiblePath) {
      return firstAccessiblePath
    }
  }

  // 默认返回401页面
  return '/401'
}

/**
 * 查找第一个可访问的路由
 */
function findFirstAccessibleRoute (routes) {
  for (const route of routes) {
    // 跳过隐藏的路由
    if (route.hidden) {
      continue
    }

    // 如果路由有重定向，使用重定向路径
    if (route.redirect) {
      return route.redirect
    }

    // 如果路由有子路由，查找第一个可访问的子路由
    if (route.children && route.children.length > 0) {
      for (const child of route.children) {
        if (!child.hidden) {
          // 构建完整路径
          const fullPath =
            route.path === '/'
              ? child.path
              : `${route.path}/${child.path}`.replace(/\/+/g, '/')
          return fullPath
        }
      }
    }

    // 如果是直接可访问的路由
    if (route.component || route.path) {
      return route.path
    }
  }

  return null
}

/**
 * 处理认证错误
 */
async function handleAuthError (error, targetPath) {
  console.error('认证错误:', error)

  // 清理用户状态和路由
  await store.dispatch('user/resetToken')

  Message({
    message: error.message || '登录状态已过期，请重新登录',
    type: 'warning',
    duration: 3000
  })
}

/**
 * 重置路由状态 - 供外部调用
 */
export function resetRouteState () {
  console.log('路由状态已重置')
  // 这里不需要维护全局状态，因为我们通过store来管理路由状态
}
