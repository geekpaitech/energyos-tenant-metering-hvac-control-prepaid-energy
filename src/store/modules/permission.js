import { constantRoutes } from '@/router'
import { resetRouter } from '@/router'
import { getRoutesByPlatform, getAvailablePlatforms, getDefaultPlatform } from '@/utils/routeConfig'

const state = {
  routes: [],
  addRoutes: [],
  currentPlatform: '', // 当前平台
  availablePlatforms: [] // 可用平台列表
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  },
  RESET_ROUTES: (state) => {
    state.addRoutes = []
    state.routes = constantRoutes
  },
  SET_CURRENT_PLATFORM: (state, platform) => {
    state.currentPlatform = platform
  },
  SET_AVAILABLE_PLATFORMS: (state, platforms) => {
    state.availablePlatforms = platforms
  }
}

const actions = {
  // 生成路由 - 支持指定平台
  generateRoutes({ commit, state }, { role, platform = null }) {
    return new Promise((resolve) => {
      console.log('开始生成路由，用户角色:', role, '指定平台:', platform)
      
      if (!role) {
        console.warn('角色为空，返回空路由')
        const emptyRoutes = [
          { path: '*', redirect: '/404', hidden: true }
        ]
        commit('SET_ROUTES', emptyRoutes)
        resolve(emptyRoutes)
        return
      }
      
      // 获取用户可用的平台列表
      const availablePlatforms = getAvailablePlatforms(role)
      commit('SET_AVAILABLE_PLATFORMS', availablePlatforms)
      
      if (availablePlatforms.length === 0) {
        console.warn('用户无任何平台权限')
        const noPermissionRoutes = [
          { path: '*', redirect: '/401', hidden: true }
        ]
        commit('SET_ROUTES', noPermissionRoutes)
        resolve(noPermissionRoutes)
        return
      }
      
      // 确定要使用的平台
      let targetPlatform = platform
      if (!targetPlatform || !availablePlatforms.includes(targetPlatform)) {
        // 如果没有指定平台或指定的平台无权限，使用默认平台
        targetPlatform = getDefaultPlatform(role)
      }
      
      if (!targetPlatform) {
        console.warn('无法确定目标平台')
        const noPermissionRoutes = [
          { path: '*', redirect: '/401', hidden: true }
        ]
        commit('SET_ROUTES', noPermissionRoutes)
        resolve(noPermissionRoutes)
        return
      }
      
      // 设置当前平台
      commit('SET_CURRENT_PLATFORM', targetPlatform)
      
      // 保存平台选择到localStorage
      localStorage.setItem('selectedPlatform', targetPlatform)
      
      // 根据平台获取路由配置
      const accessedRoutes = getRoutesByPlatform(targetPlatform, role)
      console.log('生成的路由:', accessedRoutes)
      
      if (!accessedRoutes || accessedRoutes.length === 0) {
        console.warn('没有生成任何路由')
        const noPermissionRoutes = [
          { path: '*', redirect: '/401', hidden: true }
        ]
        commit('SET_ROUTES', noPermissionRoutes)
        resolve(noPermissionRoutes)
        return
      }
      
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  },
  
// 切换平台
switchPlatform({ commit, rootGetters, rootState, dispatch }, platform) {
  return new Promise(async (resolve, reject) => {
    console.log('切换平台到:', platform)
    
    // 更安全的角色获取方式
    let role = null
    
    if (rootState.user && rootState.user.role) {
      role = rootState.user.role
    } else if (rootState.user && rootState.user.roles && rootState.user.roles.length > 0) {
      role = rootState.user.roles[0]
    } else if (rootGetters.role) {
      role = rootGetters.role
    } else if (rootGetters.roles && rootGetters.roles.length > 0) {
      role = rootGetters.roles[0]
    }
    
    console.log('获取到的用户角色:', role)
    
    if (!role) {
      console.error('无法获取用户角色')
      reject(new Error('无法获取用户角色，请重新登录'))
      return
    }
    
    // 检查平台权限
    const availablePlatforms = getAvailablePlatforms(role)
    if (!availablePlatforms.includes(platform)) {
      console.error('用户无权限访问该平台:', platform)
      reject(new Error('无权限访问该平台'))
      return
    }
    
    try {
      // 重置当前路由
      await dispatch('resetRoutes')
      
      // 等待重置完成
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // 生成新平台的路由
      const routes = await dispatch('generateRoutes', { role, platform })
      
      // 一次性添加所有路由（包括通配符）
      if (routes && routes.length > 0) {
        const { default: router } = await import('@/router')
        router.addRoutes(routes)
        console.log('已添加所有路由:', routes.length)
      }
      
      console.log('平台切换成功，新路由:', routes)
      resolve(routes)
    } catch (error) {
      console.error('平台切换失败:', error)
      reject(error)
    }
  })
},
  
  // 重置路由
  // 重置路由
resetRoutes({ commit }) {
  return new Promise(resolve => {
    console.log('重置权限路由')
    commit('RESET_ROUTES')
    commit('SET_CURRENT_PLATFORM', '')
    commit('SET_AVAILABLE_PLATFORMS', [])
    
    // 重置路由器
    resetRouter()
    
    // 等待重置完成
    setTimeout(() => {
      resolve()
    }, 50)
  })
},
}

const getters = {
  currentPlatform: state => state.currentPlatform,
  availablePlatforms: state => state.availablePlatforms,
  canSwitchPlatform: state => state.availablePlatforms.length > 1
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}