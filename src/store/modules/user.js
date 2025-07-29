import Cookies from 'js-cookie'
import { login, logout, getUserInfo } from '@/api/user'

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
  role: '', // 添加role字段
  phone: '' // 添加phone字段
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
  }
}

const actions = {
  // 用户登录
  login ({ commit }, userInfo) {
    console.log('执行登录action:', userInfo)
    
    const { username, password } = userInfo
    const loginData = {
      username: username.trim(),
      password: password
    }
    
    return new Promise((resolve, reject) => {
      login(loginData).then(response => {
        const { data, msg } = response
        commit('SET_TOKEN', data)
        setToken(data)
        console.log('登录成功，token:', data)
        console.log('登录消息:', msg)
        resolve(response)
      }).catch(error => {
        console.log('登录失败:', error)
        reject(error)
      })
    })
  },

  // 获取用户信息
  getUserInfo ({ commit, state }) {
    return new Promise((resolve, reject) => {
      getUserInfo(state.token).then(response => {
        const { data } = response

        if (!data) {
          reject(new Error('验证失败，请重新登录'))
        }

        const { role, name, phone } = data

        // 设置用户信息
        commit('SET_ROLE', role)
        commit('SET_NAME', name || phone || '用户')
        commit('SET_PHONE', phone)
        
        // 根据角色设置roles数组（兼容原有权限系统）
        const roles = [role] 
        commit('SET_ROLES', roles)
        
        // 设置默认头像
        commit('SET_AVATAR', 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif')
        commit('SET_INTRODUCTION', `我是${name || phone || '用户'}`)
        
        // 设置基础权限
        const permissions = ['*:*:*'] // 基础权限，具体权限通过菜单权限控制
        commit('SET_PERMISSIONS', permissions)

        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // 用户退出
  logout ({ commit }) {
    return new Promise((resolve, reject) => {
      logout().then(() => {
        commit('SET_TOKEN', '')
        commit('SET_NAME', '')
        commit('SET_AVATAR', '')
        commit('SET_INTRODUCTION', '')
        commit('SET_ROLES', [])
        commit('SET_PERMISSIONS', [])
        commit('SET_ROLE', '')
        commit('SET_PHONE', '')
        removeToken()
        
        // 重置路由 - 这里很重要！
        this.dispatch('permission/resetRoutes', null, { root: true })
        
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // 删除token
  resetToken ({ commit }) {
    return new Promise(resolve => {
      console.log('重置token')
      commit('SET_TOKEN', '')
      commit('SET_NAME', '')
      commit('SET_AVATAR', '')
      commit('SET_INTRODUCTION', '')
      commit('SET_ROLES', [])
      commit('SET_PERMISSIONS', [])
      commit('SET_ROLE', '')
      commit('SET_PHONE', '')
      removeToken()
      
      // 重置路由
      this.dispatch('permission/resetRoutes', null, { root: true })
      
      resolve()
    })
  }
}

const userModule = {
  namespaced: true,
  state,
  mutations,
  actions
}

export default userModule