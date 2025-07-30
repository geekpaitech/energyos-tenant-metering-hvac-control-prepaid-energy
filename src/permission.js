import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import Cookies from 'js-cookie'

NProgress.configure({ showSpinner: false })

const TokenKey = 'Admin-Token'
function getToken () {
  return Cookies.get(TokenKey)
}

// 白名单路由
const whiteList = ['/login', '/404', '/401']

router.beforeEach(async (to, from, next) => {
  NProgress.start()

  // 设置页面标题
  document.title = to.meta && to.meta.title ? `${to.meta.title} - 园区智慧物联` : '园区智慧物联'

  const hasToken = getToken()
  console.log('=== 路由守卫 ===')
  console.log('从:', from.path, '到:', to.path)
  console.log('Token:', hasToken)

  if (hasToken) {
    if (to.path === '/login') {
      console.log('已登录，需要跳转到首页')
      // 先检查是否有权限路由，如果有就跳转到第一个可访问的路由
      const permissionRoutes = store.getters.permission_routes
      if (permissionRoutes && permissionRoutes.length > 0) {
        const redirectPath = findFirstAccessibleRoute(permissionRoutes)
        if (redirectPath) {
          next({ path: redirectPath, replace: true })
        } else {
          next({ path: '/401', replace: true })
        }
      } else {
        // 如果没有权限路由，先获取用户信息
        next({ path: '/', replace: true })
      }
      NProgress.done()
      return
    }

    // 检查用户信息和角色
    const hasGetUserInfo = store.getters.name && store.getters.roles && store.getters.roles.length > 0
    console.log('是否有用户信息和角色:', hasGetUserInfo)
    console.log('当前角色:', store.getters.roles)
    console.log('已有路由数量:', store.getters.permission_routes?.length || 0)
    console.log('当前平台:', store.getters['permission/currentPlatform'])

    if (hasGetUserInfo && store.getters.permission_routes?.length > 0) {
      console.log('有用户信息且已生成路由，直接通过')
      next()
    } else {
      try {
        console.log('获取用户信息中...')
        // 获取用户信息
        const { role } = await store.dispatch('user/getUserInfo')
        console.log('获取用户信息成功，角色:', role)

        // 确定要使用的平台
        let targetPlatform = null
        
        // 首先尝试从localStorage读取上次选择的平台
        const savedPlatform = localStorage.getItem('selectedPlatform')
        console.log('localStorage中保存的平台:', savedPlatform)
        
        // 获取用户可用平台列表
        const { getAvailablePlatforms } = require('@/utils/routeConfig')
        const availablePlatforms = getAvailablePlatforms(role)
        console.log('用户可用平台:', availablePlatforms)
        
        // 验证保存的平台是否有效
        if (savedPlatform && availablePlatforms.includes(savedPlatform)) {
          targetPlatform = savedPlatform
        } else {
          // 使用默认平台
          const { getDefaultPlatform } = require('@/utils/routeConfig')
          targetPlatform = getDefaultPlatform(role)
        }
        
        console.log('将要使用的平台:', targetPlatform)

        // 根据角色和平台生成可访问的路由映射
        const accessRoutes = await store.dispatch('permission/generateRoutes', { 
          role, 
          platform: targetPlatform 
        })
        console.log('生成的权限路由:', accessRoutes)

        // 动态添加可访问路由
        if (accessRoutes && accessRoutes.length > 0) {
          // 使用 router.addRoutes 添加路由
          router.addRoutes(accessRoutes)
          console.log('已添加动态路由')
          console.log('动态路由数量:', accessRoutes.length)
          console.log('所有动态路由:', accessRoutes)
          
          // 如果访问根路径，重定向到对应平台的首页
          if (to.path === '/') {
            console.log('处理根路径重定向')
            
            // 根据当前平台确定重定向路径
            let redirectPath = null
            if (targetPlatform === 'console') {
              redirectPath = '/console/dashboard'
            } else if (targetPlatform === 'admin') {
              redirectPath = '/admin/dashboard'
            }
            
            if (redirectPath) {
              console.log('重定向到平台首页:', redirectPath)
              next({ path: redirectPath, replace: true })
              return
            }
            
            // 如果没有明确的重定向路径，查找第一个可用路由
            const firstAccessiblePath = findFirstAccessibleRoute(accessRoutes)
            if (firstAccessiblePath) {
              console.log('重定向到第一个可用路由:', firstAccessiblePath)
              next({ path: firstAccessiblePath, replace: true })
            } else {
              console.log('没有找到任何可用路由')
              next({ path: '/401', replace: true })
            }
            return
          }
          
          // 确保路由已经添加完成后再进行导航
          // 使用 replace: true 避免在历史记录中留下记录
          next({ ...to, replace: true })
        } else {
          console.log('没有生成任何路由，用户无任何权限')
          next({ path: '/401', replace: true }) // 跳转到无权限页面而不是404
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 清理状态
        await store.dispatch('user/resetToken')
        await store.dispatch('permission/resetRoutes')
        Message({
          message: '登录状态已过期，请重新登录',
          type: 'warning',
          duration: 3000
        })
        next({ path: `/login?redirect=${encodeURIComponent(to.path)}`, replace: true })
        NProgress.done()
      }
    }
  } else {
    console.log('无Token')
    if (whiteList.indexOf(to.path) !== -1) {
      console.log('在白名单中，直接通过')
      next()
    } else {
      console.log('不在白名单，跳转登录页')
      next({ path: `/login?redirect=${encodeURIComponent(to.path)}`, replace: true })
      NProgress.done()
    }
  }
  console.log('===============')
})

router.afterEach((to) => {
  NProgress.done()
  
  // 如果路由没有匹配到任何组件，跳转到404
  if (to.matched.length === 0 && to.path !== '/404' && to.path !== '/login') {
    console.log('路由未匹配，跳转到404:', to.path)
    router.replace('/404')
  }
})

// 全局错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  NProgress.done()
})

// 查找第一个可访问的路由
function findFirstAccessibleRoute(routes) {
  for (const route of routes) {
    // 只跳过隐藏的路由，不跳过根路径
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
          const fullPath = route.path === '/' ? child.path : `${route.path}/${child.path}`.replace(/\/+/g, '/')
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
// 添加路由切换的额外处理
// 添加路由切换的额外处理
router.beforeResolve((to, from, next) => {
  // 如果路由匹配失败，延迟重试
  if (to.matched.length === 0 && to.path !== '/404' && to.path !== '/login' && to.path !== '/switching') {
    console.log('路由匹配失败，延迟重试:', to.path)
    
    // 增加重试次数和时间间隔
    let retryCount = 0
    const maxRetries = 3
    
    const retryMatch = () => {
      retryCount++
      const matched = router.resolve(to.path)
      
      if (matched.route.matched.length > 0) {
        console.log('重试成功，匹配到路由:', to.path)
        next({ ...to, replace: true })
      } else if (retryCount < maxRetries) {
        console.log(`重试 ${retryCount}/${maxRetries}:`, to.path)
        setTimeout(retryMatch, 200) // 增加到200ms
      } else {
        console.log('重试失败，跳转到404:', to.path)
        next('/404')
      }
    }
    
    setTimeout(retryMatch, 200) // 首次延迟200ms
  } else {
    next()
  }
})