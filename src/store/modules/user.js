import Cookies from 'js-cookie'
import { login, logout, getUserInfo } from '@/api/user'
import { ssoExchange } from '@/api/sso'

const TokenKey = 'Admin-Token'

function getToken () {
  return Cookies.get(TokenKey)
}

function setToken (token) {
  return Cookies.set(TokenKey, token)
}

function removeToken () {
  return Cookies.remove(TokenKey)
}

const state = {
  token: getToken(),
  name: '',
  avatar: '',
  introduction: '',
  roles: [],
  permissions: [],
  role: '', // 主要角色字段
  phone: '', // 电话字段
  userId: '', // 用户ID字段
  userInfoLoaded: false, // 用户信息是否已加载
  isInitPassword: null // 是否初始密码：0-是，1-否，null-未知
}

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_INTRODUCTION: (state, introduction) => {
    state.introduction = introduction
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  SET_PERMISSIONS: (state, permissions) => {
    state.permissions = permissions
  },
  SET_ROLE: (state, role) => {
    state.role = role
  },
  SET_PHONE: (state, phone) => {
    state.phone = phone
  },
  SET_USER_ID: (state, userId) => {
    state.userId = userId
  },
  SET_IS_INIT_PASSWORD: (state, isInitPassword) => {
    state.isInitPassword = isInitPassword
  },
  SET_USER_INFO_LOADED: (state, loaded) => {
    state.userInfoLoaded = loaded
  },
  RESET_USER_STATE: (state) => {
    state.token = ''
    state.name = ''
    state.avatar = ''
    state.introduction = ''
    state.roles = []
    state.permissions = []
    state.role = ''
    state.phone = ''
    state.userId = '' // 重置用户ID
    state.isInitPassword = null
    state.userInfoLoaded = false
  }
}

const actions = {
  // 用户登录
  login ({ commit }, userInfo) {
    const { username, password } = userInfo
    const loginData = {
      username: username.trim(),
      password: password
    }

    return new Promise((resolve, reject) => {
      login(loginData)
        .then((response) => {
          if (response.code === 200) {
            const { data } = response
            commit('SET_TOKEN', data)
            setToken(data)
            resolve(response)
          } else {
            reject(new Error(response.msg || '登录失败'))
          }
        })
        .catch((error) => {
          console.error('登录失败:', error)
          reject(error)
        })
    })
  },

  // SSO 回调换票登录（凭证由统一认证 redirect 带入）
  ssoLogin ({ commit }, payload) {
    return new Promise((resolve, reject) => {
      ssoExchange(payload)
        .then((response) => {
          if (response.code === 200) {
            const { data } = response
            commit('SET_TOKEN', data)
            setToken(data)
            resolve(response)
          } else {
            reject(new Error(response.msg || '登录失败，请稍后重试'))
          }
        })
        .catch((error) => {
          console.error('SSO 换票失败:', error)
          reject(error)
        })
    })
  },

  // 获取用户信息
  getUserInfo ({ commit, state }) {
    return new Promise((resolve, reject) => {
      // 首次加载时可能出现cookie已有token但vuex状态尚未同步的情况
      const currentToken = state.token || getToken()
      if (currentToken && currentToken !== state.token) {
        commit('SET_TOKEN', currentToken)
      }

      // 如果用户信息已经加载，直接返回
      if (state.userInfoLoaded && state.role) {
        resolve({ role: state.role, name: state.name, phone: state.phone })
        return
      }

      if (!currentToken) {
        reject(new Error('登录状态缺失，请重新登录'))
        return
      }

      getUserInfo(currentToken)
        .then((response) => {
          const { data } = response
          if (!data) {
            reject(new Error('验证失败，请重新登录'))
            return
          }

          const { role, name, phone, id, isInitPassword } = data

          // 设置用户信息
          commit('SET_ROLE', role)
          commit('SET_NAME', name || phone || '用户')
          commit('SET_PHONE', phone)
          commit('SET_USER_ID', id)
          commit('SET_IS_INIT_PASSWORD', isInitPassword)

          // 根据角色设置roles数组（兼容原有权限系统）
          const roles = [role]
          commit('SET_ROLES', roles)

          // 设置默认头像和介绍
          commit(
            'SET_AVATAR',
            'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
          )
          commit('SET_INTRODUCTION', `我是${name || phone || '用户'}`)

          // 设置基础权限
          const permissions = ['*:*:*'] // 基础权限，具体权限通过菜单权限控制
          commit('SET_PERMISSIONS', permissions)

          // 标记用户信息已加载
          commit('SET_USER_INFO_LOADED', true)

          resolve(data)
        })
        .catch((error) => {
          console.error('获取用户信息失败:', error)
          // 清理可能的无效状态
          commit('SET_USER_INFO_LOADED', false)
          reject(error)
        })
    })
  },

  // 用户退出
  logout ({ commit, dispatch }) {
    return new Promise((resolve, reject) => {
      // 调用退出API
      logout()
        .then(async () => {
          await performLogoutCleanup(commit, dispatch)
          resolve()
          // 强制刷新页面以确保所有状态（特别是路由）被完全重置
          // window.location.reload();
        })
        .catch(async (error) => {
          console.error('退出API调用失败:', error)
          // 即使API调用失败，也要清除本地状态
          await performLogoutCleanup(commit, dispatch)
          // 不reject，让退出流程继续
          resolve()
        })
    })
  },

  // 删除token
  resetToken ({ commit, dispatch }) {
    return new Promise(async (resolve) => {
      await performLogoutCleanup(commit, dispatch)
      resolve()
    })
  }
}

/**
 * 执行退出清理操作
 */
async function performLogoutCleanup (commit, dispatch) {
  // 清除用户状态
  commit('RESET_USER_STATE')
  removeToken()
  // 清除初始密码提示标记
  sessionStorage.removeItem('hasShownInitPasswordPrompt')

  try {
    // 重置权限路由
    await dispatch('permission/resetRoutes', null, { root: true })
  } catch (routeError) {
    console.warn('重置权限路由失败:', routeError)
  }
}

const getters = {
  token: (state) => state.token,
  name: (state) => state.name,
  avatar: (state) => state.avatar,
  introduction: (state) => state.introduction,
  roles: (state) => state.roles,
  permissions: (state) => state.permissions,
  role: (state) => state.role,
  phone: (state) => state.phone,
  userId: (state) => state.userId,
  isInitPassword: (state) => state.isInitPassword,
  userInfoLoaded: (state) => state.userInfoLoaded
}

const userModule = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

export default userModule
