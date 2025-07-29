// @/store/modules/tagsView.js - 修复后的版本

const state = {
  visitedViews: [],
  cachedViews: []
}

const mutations = {
  ADD_VISITED_VIEW: (state, view) => {
    if (state.visitedViews.some(v => v.path === view.path)) return
    state.visitedViews.push(
      Object.assign({}, view, {
        title: view.meta.title || 'no-name'
      })
    )
  },

  ADD_CACHED_VIEW: (state, view) => {
    if (state.cachedViews.includes(view.name)) return
    if (!view.meta.noCache) {
      state.cachedViews.push(view.name)
    }
  },

  DEL_VISITED_VIEW: (state, view) => {
    for (const [i, v] of state.visitedViews.entries()) {
      if (v.path === view.path) {
        state.visitedViews.splice(i, 1)
        break
      }
    }
  },

  DEL_CACHED_VIEW: (state, view) => {
    const index = state.cachedViews.indexOf(view.name)
    index > -1 && state.cachedViews.splice(index, 1)
  },

  DEL_OTHERS_VISITED_VIEWS: (state, view) => {
    state.visitedViews = state.visitedViews.filter(v => {
      return v.meta.affix || v.path === view.path
    })
  },

  DEL_OTHERS_CACHED_VIEWS: (state, view) => {
    const index = state.cachedViews.indexOf(view.name)
    if (index > -1) {
      state.cachedViews = state.cachedViews.slice(index, index + 1)
    } else {
      state.cachedViews = []
    }
  },

  DEL_ALL_VISITED_VIEWS: state => {
    // 只保留固定标签
    const affixTags = state.visitedViews.filter(tag => tag.meta.affix)
    state.visitedViews = affixTags
  },

  DEL_ALL_CACHED_VIEWS: state => {
    state.cachedViews = []
  },

  UPDATE_VISITED_VIEW: (state, view) => {
    for (let v of state.visitedViews) {
      if (v.path === view.path) {
        v = Object.assign(v, view)
        break
      }
    }
  },

 // 平台切换时完全清空
CLEAR_ALL_FOR_PLATFORM_SWITCH: state => {
  console.log('CLEAR_ALL_FOR_PLATFORM_SWITCH mutation executed - 完全清空所有TagsView')
  state.visitedViews = []
  state.cachedViews = []
},


// 企业切换时只清空缓存，保留标签页
CLEAR_CACHE_FOR_MANAGER_SWITCH: state => {
  console.log('CLEAR_CACHE_FOR_MANAGER_SWITCH mutation executed - 只清空缓存，保留TagsView')
  state.cachedViews = []
  // visitedViews 保持不变
},

  // 新增：确保首页标签在第一位
  ENSURE_HOME_TAG_FIRST: (state, homeTag) => {
    if (!homeTag) return
    
    // 移除现有的首页标签
    state.visitedViews = state.visitedViews.filter(v => v.path !== homeTag.path)
    
    // 在第一位插入首页标签
    state.visitedViews.unshift({
      ...homeTag,
      meta: { ...homeTag.meta, affix: true }
    })
  },

  DEL_RIGHT_TAGS: (state, view) => {
    const index = state.visitedViews.findIndex(v => v.path === view.path)
    if (index === -1) {
      return
    }
    state.visitedViews = state.visitedViews.filter((item, idx) => {
      if (idx <= index || (item.meta && item.meta.affix)) {
        return true
      }
      const i = state.cachedViews.indexOf(item.name)
      if (i > -1) {
        state.cachedViews.splice(i, 1)
      }
      return false
    })
  },

  DEL_LEFT_TAGS: (state, view) => {
    const index = state.visitedViews.findIndex(v => v.path === view.path)
    if (index === -1) {
      return
    }
    state.visitedViews = state.visitedViews.filter((item, idx) => {
      if (idx >= index || (item.meta && item.meta.affix)) {
        return true
      }
      const i = state.cachedViews.indexOf(item.name)
      if (i > -1) {
        state.cachedViews.splice(i, 1)
      }
      return false
    })
  }
}

const actions = {
  addView({ dispatch }, view) {
    dispatch('addVisitedView', view)
    dispatch('addCachedView', view)
  },

  addVisitedView({ commit }, view) {
    commit('ADD_VISITED_VIEW', view)
  },

  addCachedView({ commit }, view) {
    commit('ADD_CACHED_VIEW', view)
  },

  delView({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delVisitedView', view)
      dispatch('delCachedView', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  delVisitedView({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_VISITED_VIEW', view)
      resolve([...state.visitedViews])
    })
  },

  delCachedView({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_CACHED_VIEW', view)
      resolve([...state.cachedViews])
    })
  },

  delOthersViews({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delOthersVisitedViews', view)
      dispatch('delOthersCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  delOthersVisitedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_OTHERS_VISITED_VIEWS', view)
      resolve([...state.visitedViews])
    })
  },

  delOthersCachedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_OTHERS_CACHED_VIEWS', view)
      resolve([...state.cachedViews])
    })
  },

  delAllViews({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delAllVisitedViews', view)
      dispatch('delAllCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  delAllVisitedViews({ commit, state }) {
    return new Promise(resolve => {
      commit('DEL_ALL_VISITED_VIEWS')
      resolve([...state.visitedViews])
    })
  },

  delAllCachedViews({ commit, state }) {
    return new Promise(resolve => {
      commit('DEL_ALL_CACHED_VIEWS')
      resolve([...state.cachedViews])
    })
  },

  updateVisitedView({ commit }, view) {
    commit('UPDATE_VISITED_VIEW', view)
  },

  // 新增：平台切换时完全清空TagsView（管理系统 ↔ 控制台）
  clearAllForPlatformSwitch({ commit, state, rootGetters }) {
    return new Promise(resolve => {
      console.log('=== TagsView Store: 平台切换完全清空开始 ===')
      console.log('清空前 - visitedViews:', state.visitedViews.length)
      console.log('清空前 - cachedViews:', state.cachedViews.length)
      
      // 执行完全清空
      commit('CLEAR_ALL_FOR_PLATFORM_SWITCH')
      
      console.log('清空后 - visitedViews:', state.visitedViews.length)
      console.log('清空后 - cachedViews:', state.cachedViews.length)
      console.log('=== TagsView Store: 平台切换完全清空完成 ===')
      
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  // 新增：企业切换时只清空缓存，保留TagsView标签页（控制台内企业切换）
  clearCacheForManagerSwitch({ commit, state }) {
    return new Promise(resolve => {
      console.log('=== TagsView Store: 企业切换清空缓存开始 ===')
      console.log('清空缓存前 - visitedViews:', state.visitedViews.length, '(保留)')
      console.log('清空缓存前 - cachedViews:', state.cachedViews.length, '(清空)')
      
      // 只清空缓存，保留visitedViews
      commit('CLEAR_CACHE_FOR_MANAGER_SWITCH')
      
      console.log('清空缓存后 - visitedViews:', state.visitedViews.length, '(已保留)')
      console.log('清空缓存后 - cachedViews:', state.cachedViews.length, '(已清空)')
      console.log('=== TagsView Store: 企业切换清空缓存完成 ===')
      
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  // 新增：确保首页标签始终在第一位
  ensureHomeTagFirst({ commit, state, rootGetters }) {
    return new Promise(resolve => {
      console.log('=== TagsView Store: 确保首页标签在第一位 ===')
      
      // 获取当前平台
      const currentPlatform = rootGetters['permission/currentPlatform']
      console.log('当前平台:', currentPlatform)
      
      // 根据平台确定首页路径和信息
      let homeTagInfo = null
      switch (currentPlatform) {
        case 'console':
          homeTagInfo = {
            fullPath: '/console/dashboard',
            path: '/console/dashboard',
            name: 'ConsoleDashboard',
            meta: { title: '首页', affix: true, icon: 'el-icon-data-analysis' },
            query: {},
            params: {}
          }
          break
        case 'admin':
          homeTagInfo = {
            fullPath: '/admin/dashboard',
            path: '/admin/dashboard',
            name: 'AdminDashboard',
            meta: { title: '管理后台大屏', affix: true, icon: 'el-icon-data-board' },
            query: {},
            params: {}
          }
          break
        default:
          console.warn('未知平台，无法确定首页标签')
          resolve([...state.visitedViews])
          return
      }
      
      if (homeTagInfo) {
        console.log('设置首页标签:', homeTagInfo.path)
        commit('ENSURE_HOME_TAG_FIRST', homeTagInfo)
        console.log('首页标签已设置在第一位')
      }
      
      console.log('=== TagsView Store: 首页标签位置确保完成 ===')
      resolve([...state.visitedViews])
    })
  },

  delRightTags({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_RIGHT_TAGS', view)
      resolve([...state.visitedViews])
    })
  },

  delLeftTags({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_LEFT_TAGS', view)
      resolve([...state.visitedViews])
    })
  },

  // 新增：初始化固定标签（首页等）
  initAffixTags({ commit, state }, routes) {
    return new Promise(resolve => {
      console.log('=== TagsView Store: 初始化固定标签 ===')
      
      // 这里可以根据routes参数添加固定标签的逻辑
      // 当前先确保首页标签的存在
      
      console.log('固定标签初始化完成')
      resolve([...state.visitedViews])
    })
  }
}

const getters = {
  visitedViews: state => state.visitedViews,
  cachedViews: state => state.cachedViews
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}