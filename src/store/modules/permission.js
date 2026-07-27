import { constantRoutes, resetRouter } from '@/router'

import { getMenuRoleList } from '@/api/permission'

import {
  getRoutesByPlatform,
  getAvailablePlatforms,
  getDefaultPlatform
} from '@/utils/routeConfig'

const state = {
  routes: [],
  addRoutes: [],
  currentPlatform: '', // 当前平台
  availablePlatforms: [], // 可用平台列表
  routesInitialized: false, // 路由是否已初始化
  kztMenuNos: [] // 控制台菜单/按钮权限(menuNo)
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
    state.routesInitialized = true
  },
  RESET_ROUTES: (state) => {
    state.addRoutes = []
    state.routes = constantRoutes
    state.routesInitialized = false
    state.currentPlatform = ''
    state.availablePlatforms = []
    state.kztMenuNos = []
  },
  SET_CURRENT_PLATFORM: (state, platform) => {
    state.currentPlatform = platform
  },
  SET_AVAILABLE_PLATFORMS: (state, platforms) => {
    state.availablePlatforms = platforms
  },
  SET_ROUTES_INITIALIZED: (state, initialized) => {
    state.routesInitialized = initialized
  },
  SET_KZT_MENU_NOS: (state, menuNos) => {
    state.kztMenuNos = Array.isArray(menuNos) ? menuNos : []
  }
}

const actions = {
  // 生成路由 - 支持指定平台
  generateRoutes ({ commit, state }, { role, platform = null }) {
    return new Promise(async (resolve, reject) => {
      if (!role) {
        console.warn('角色为空，返回空路由')
        const emptyRoutes = [{ path: '*', redirect: '/404', hidden: true }]
        commit('SET_ROUTES', emptyRoutes)
        resolve(emptyRoutes)
        return
      }

      try {
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

        let routeOptions
        if (targetPlatform === 'console') {
          try {
            const res = await getMenuRoleList(role)
            const list =
              res?.data?.data?.kztMenuRoleList ||
              res?.data?.kztMenuRoleList ||
              []

            const menuNos = Array.isArray(list)
              ? list
                .filter((item) => {
                  const status = item?.menuStatus
                  return status === undefined || status === null || status === 1 || status === '1'
                })
                .map((item) => String(item.menuNo))
                .filter((v) => v && v !== 'undefined' && v !== 'null')
              : []

            commit('SET_KZT_MENU_NOS', menuNos)
            if (menuNos.length > 0) {
              routeOptions = { menuNos }
            }
          } catch (e) {
            console.warn('获取控制台菜单权限失败，回退到默认配置:', e)
            commit('SET_KZT_MENU_NOS', [])
          }
        } else {
          commit('SET_KZT_MENU_NOS', [])
        }

        // 根据平台获取路由配置
        const accessedRoutes = getRoutesByPlatform(
          targetPlatform,
          role,
          routeOptions
        )

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
      } catch (error) {
        console.error('生成路由时发生错误:', error)
        const errorRoutes = [{ path: '*', redirect: '/500', hidden: true }]
        commit('SET_ROUTES', errorRoutes)
        reject(error)
      }
    })
  },

  // 切换平台
  switchPlatform ({ commit, rootGetters, rootState, dispatch }, platform) {
    return new Promise(async (resolve, reject) => {
      try {
        // 获取用户角色
        let role = null

        if (rootState.user && rootState.user.role) {
          role = rootState.user.role
        } else if (
          rootState.user &&
          rootState.user.roles &&
          rootState.user.roles.length > 0
        ) {
          role = rootState.user.roles[0]
        } else if (rootGetters.role) {
          role = rootGetters.role
        } else if (rootGetters.roles && rootGetters.roles.length > 0) {
          role = rootGetters.roles[0]
        }

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

        // 重置当前路由状态
        await dispatch('resetRoutes')

        // 等待重置完成
        await new Promise((resolve) => setTimeout(resolve, 100))

        // 生成新平台的路由
        const routes = await dispatch('generateRoutes', { role, platform })

        // 添加路由到路由器
        if (routes && routes.length > 0) {
          const { default: router } = await import('@/router')
          router.addRoutes(routes)
        }

        resolve(routes)
      } catch (error) {
        console.error('平台切换失败:', error)
        reject(error)
      }
    })
  },

  // 重置路由
  resetRoutes ({ commit }) {
    return new Promise((resolve) => {
      try {
        // 重置状态
        commit('RESET_ROUTES')

        // 重置路由器
        resetRouter()

        // 等待重置完全生效
        setTimeout(() => {
          resolve()
        }, 50)
      } catch (error) {
        console.error('重置路由时发生错误:', error)
        // 即使发生错误也要resolve，避免阻塞流程
        resolve()
      }
    })
  }
}

const getters = {
  permission_routes: (state) => state.routes,
  addRoutes: (state) => state.addRoutes,
  currentPlatform: (state) => state.currentPlatform,
  availablePlatforms: (state) => state.availablePlatforms,
  canSwitchPlatform: (state) => state.availablePlatforms.length > 1,
  routesInitialized: (state) => state.routesInitialized,
  kztMenuNos: (state) => state.kztMenuNos
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
