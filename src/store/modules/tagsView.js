// @/store/modules/tagsView.js - 支持详情页的完整版本

const state = {
  visitedViews: [],
  cachedViews: []
}

const mutations = {
  ADD_VISITED_VIEW: (state, view) => {
    if (state.visitedViews.some((v) => v.path === view.path)) return

    // 修复：确保title正确获取
    const title =
      view.title ||
      (view.meta && view.meta.title) ||
      view.name ||
      view.path.split('/').pop() ||
      'no-name'

    state.visitedViews.push(
      Object.assign({}, view, {
        title: title
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
    state.visitedViews = state.visitedViews.filter((v) => {
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

  DEL_ALL_VISITED_VIEWS: (state) => {
    // 只保留固定标签
    const affixTags = state.visitedViews.filter((tag) => tag.meta.affix)
    state.visitedViews = affixTags
  },

  DEL_ALL_CACHED_VIEWS: (state) => {
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
  CLEAR_ALL_FOR_PLATFORM_SWITCH: (state) => {
    state.visitedViews = []
    state.cachedViews = []
  },

  // 企业切换时只清空缓存，保留标签页
  CLEAR_CACHE_FOR_MANAGER_SWITCH: (state) => {
    state.cachedViews = []
    // visitedViews 保持不变
  },

  // 🔥 新增：清除所有详情页标签
  CLEAR_DETAIL_TAGS: (state) => {
    state.visitedViews = state.visitedViews.filter((view) => {
      const isDetail = view.path.includes('/detail/') || view.path.endsWith('/detail')

      // 如果是详情页，同时移除缓存
      if (isDetail && view.name) {
        const cacheIndex = state.cachedViews.indexOf(view.name)
        if (cacheIndex > -1) {
          state.cachedViews.splice(cacheIndex, 1)
        }
      }

      // 保留非详情页
      return !isDetail
    })
  },

  // 修复：确保首页标签在第一位且title正确
  ENSURE_HOME_TAG_FIRST: (state, homeTag) => {
    if (!homeTag) return

    // 移除现有的首页标签
    state.visitedViews = state.visitedViews.filter(
      (v) => v.path !== homeTag.path
    )

    // 确保title正确设置
    const title =
      homeTag.title ||
      (homeTag.meta && homeTag.meta.title) ||
      homeTag.name ||
      '看板'

    const finalHomeTag = {
      ...homeTag,
      title: title, // 确保title在顶层
      meta: {
        ...homeTag.meta,
        affix: true,
        title: title // 同时确保meta.title也正确
      }
    }

    // 在第一位插入首页标签
    state.visitedViews.unshift(finalHomeTag)
  },

  DEL_RIGHT_TAGS: (state, view) => {
    const index = state.visitedViews.findIndex((v) => v.path === view.path)
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
    const index = state.visitedViews.findIndex((v) => v.path === view.path)
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
  addView ({ dispatch }, view) {
    dispatch('addVisitedView', view)
    dispatch('addCachedView', view)
  },

  addVisitedView ({ commit }, view) {
    commit('ADD_VISITED_VIEW', view)
  },

  addCachedView ({ commit }, view) {
    commit('ADD_CACHED_VIEW', view)
  },

  delView ({ dispatch, state }, view) {
    return new Promise((resolve) => {
      dispatch('delVisitedView', view)
      dispatch('delCachedView', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  delVisitedView ({ commit, state }, view) {
    return new Promise((resolve) => {
      commit('DEL_VISITED_VIEW', view)
      resolve([...state.visitedViews])
    })
  },

  delCachedView ({ commit, state }, view) {
    return new Promise((resolve) => {
      commit('DEL_CACHED_VIEW', view)
      resolve([...state.cachedViews])
    })
  },

  delOthersViews ({ dispatch, state }, view) {
    return new Promise((resolve) => {
      dispatch('delOthersVisitedViews', view)
      dispatch('delOthersCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  delOthersVisitedViews ({ commit, state }, view) {
    return new Promise((resolve) => {
      commit('DEL_OTHERS_VISITED_VIEWS', view)
      resolve([...state.visitedViews])
    })
  },

  delOthersCachedViews ({ commit, state }, view) {
    return new Promise((resolve) => {
      commit('DEL_OTHERS_CACHED_VIEWS', view)
      resolve([...state.cachedViews])
    })
  },

  delAllViews ({ dispatch, state }, view) {
    return new Promise((resolve) => {
      dispatch('delAllVisitedViews', view)
      dispatch('delAllCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  delAllVisitedViews ({ commit, state }) {
    return new Promise((resolve) => {
      commit('DEL_ALL_VISITED_VIEWS')
      resolve([...state.visitedViews])
    })
  },

  delAllCachedViews ({ commit, state }) {
    return new Promise((resolve) => {
      commit('DEL_ALL_CACHED_VIEWS')
      resolve([...state.cachedViews])
    })
  },

  updateVisitedView ({ commit }, view) {
    commit('UPDATE_VISITED_VIEW', view)
  },

  // 平台切换时完全清空TagsView（管理系统 ↔ 控制台）
  clearAllForPlatformSwitch ({ commit, state }) {
    return new Promise((resolve) => {
      // 执行完全清空
      commit('CLEAR_ALL_FOR_PLATFORM_SWITCH')

      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  // 🔥 修改：企业切换时清空缓存并关闭详情页标签（控制台内企业切换）
  clearCacheForManagerSwitch ({ commit, state }) {
    return new Promise((resolve) => {
      // 清空缓存
      commit('CLEAR_CACHE_FOR_MANAGER_SWITCH')

      // 🔥 关闭所有详情页标签
      commit('CLEAR_DETAIL_TAGS')

      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  // 🔥 新增：单独清除详情页标签的action（可选，供其他地方调用）
  clearDetailTags ({ commit, state }) {
    return new Promise((resolve) => {
      commit('CLEAR_DETAIL_TAGS')
      resolve([...state.visitedViews])
    })
  },

  // 修复：确保首页标签始终在第一位且title正确显示
  ensureHomeTagFirst ({ commit, state, rootGetters }) {
    return new Promise((resolve) => {
      // 获取当前平台
      const currentPlatform = rootGetters['permission/currentPlatform']

      // 根据平台确定首页路径和信息
      let homeTagInfo = null
      switch (currentPlatform) {
        case 'console':
          homeTagInfo = {
            fullPath: '/metering/dashboard',
            path: '/metering/dashboard',
            name: 'MeteringDashboard',
            title: '数据看板',
            meta: {
              title: '数据看板',
              affix: true,
              icon: 'el-icon-data-analysis'
            },
            query: {},
            params: {}
          }
          break
        case 'admin':
          homeTagInfo = {
            fullPath: '/admin/dashboard',
            path: '/admin/dashboard',
            name: 'AdminDashboard',
            title: '管理后台大屏', // 修复：使用与路由配置一致的title
            meta: {
              title: '管理后台大屏', // 修复：保持一致
              affix: true,
              icon: 'el-icon-data-board'
            },
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
        commit('ENSURE_HOME_TAG_FIRST', homeTagInfo)

        // 验证设置结果
        const firstTag = state.visitedViews[0]
        if (firstTag) {
          // console.log("✅ 首页标签已确保在第一位:", firstTag.title);
        }
      }

      resolve([...state.visitedViews])
    })
  },

  delRightTags ({ commit, state }, view) {
    return new Promise((resolve) => {
      commit('DEL_RIGHT_TAGS', view)
      resolve([...state.visitedViews])
    })
  },

  delLeftTags ({ commit, state }, view) {
    return new Promise((resolve) => {
      commit('DEL_LEFT_TAGS', view)
      resolve([...state.visitedViews])
    })
  },

  // 初始化固定标签（首页等）
  initAffixTags ({ commit, state }, routes) {
    return new Promise((resolve) => {
      resolve([...state.visitedViews])
    })
  }
}

const getters = {
  visitedViews: (state) => state.visitedViews,
  cachedViews: (state) => state.cachedViews
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
