// @/store/modules/tagsView.js - 完整修复版本
const state = {
  visitedViews: [],
  cachedViews: []
}

const mutations = {
  ADD_VISITED_VIEW: (state, view) => {
    if (state.visitedViews.some(v => v.path === view.path)) return
    
    // 如果是首页标签，添加到第一位
    if (view.meta && view.meta.affix && isHomeRoute(view.path)) {
      state.visitedViews.unshift(
        Object.assign({}, view, {
          title: view.meta.title || 'no-name'
        })
      )
    } else {
      state.visitedViews.push(
        Object.assign({}, view, {
          title: view.meta.title || 'no-name'
        })
      )
    }
  },

  // 新增：添加访问视图到第一位（确保首页在第一位）
  ADD_VISITED_VIEW_TO_FIRST: (state, view) => {
    // 移除可能存在的重复项
    const existingIndex = state.visitedViews.findIndex(v => v.path === view.path);
    if (existingIndex > -1) {
      state.visitedViews.splice(existingIndex, 1);
    }
    
    // 添加到第一位
    state.visitedViews.unshift(Object.assign({}, view, {
      title: view.meta && view.meta.title || 'no-name'
    }));
    
    console.log('TagsView Store: 添加视图到第一位:', view.path);
  },

  // 新增：移动访问视图到第一位
  MOVE_VISITED_VIEW_TO_FIRST: (state, view) => {
    const existingIndex = state.visitedViews.findIndex(v => v.path === view.path);
    
    if (existingIndex > 0) {
      // 移除原位置的项
      const [movedView] = state.visitedViews.splice(existingIndex, 1);
      // 添加到第一位
      state.visitedViews.unshift(movedView);
      
      console.log('TagsView Store: 移动视图到第一位:', view.path);
    }
  },

  // 新增：确保首页标签在第一位
  ENSURE_HOME_TAG_FIRST: (state, homeTag) => {
    const homeIndex = state.visitedViews.findIndex(v => isHomeRoute(v.path));
    
    if (homeIndex === -1) {
      // 首页标签不存在，添加到第一位
      state.visitedViews.unshift(Object.assign({}, homeTag, {
        title: homeTag.meta && homeTag.meta.title || '首页',
        meta: { ...homeTag.meta, affix: true }
      }));
      console.log('TagsView Store: 添加首页标签到第一位');
    } else if (homeIndex !== 0) {
      // 首页标签存在但不在第一位，移动到第一位
      const [homeView] = state.visitedViews.splice(homeIndex, 1);
      state.visitedViews.unshift(homeView);
      console.log('TagsView Store: 移动首页标签到第一位');
    }
  },

  ADD_CACHED_VIEW: (state, view) => {
    if (state.cachedViews.includes(view.name)) return
    if (!view.meta.noCache) {
      state.cachedViews.push(view.name)
    }
  },

  DEL_VISITED_VIEW: (state, view) => {
    // 防止删除首页标签
    if (view.meta && view.meta.affix && isHomeRoute(view.path)) {
      console.warn('TagsView Store: 不能删除首页标签');
      return;
    }
    
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
    
    // 确保首页标签在第一位
    ensureHomeTagFirstInState(state);
  },

  DEL_OTHERS_CACHED_VIEWS: (state, view) => {
    const index = state.cachedViews.indexOf(view.name)
    if (index > -1) {
      state.cachedViews = state.cachedViews.slice(index, index + 1)
    } else {
      state.cachedViews = []
    }
  },

  // 清空所有访问的视图 - 保留固定标签
  DEL_ALL_VISITED_VIEWS: state => {
    console.log('TagsView Store: DEL_ALL_VISITED_VIEWS - 清空前:', state.visitedViews.length);
    // keep affix tags
    const affixTags = state.visitedViews.filter(tag => tag.meta && tag.meta.affix)
    state.visitedViews = affixTags
    
    // 确保首页标签在第一位
    ensureHomeTagFirstInState(state);
    
    console.log('TagsView Store: DEL_ALL_VISITED_VIEWS - 清空后:', state.visitedViews.length);
  },
  
  // 清空所有缓存的视图
  DEL_ALL_CACHED_VIEWS: state => {
    console.log('TagsView Store: DEL_ALL_CACHED_VIEWS - 清空前:', state.cachedViews.length);
    state.cachedViews = []
    console.log('TagsView Store: DEL_ALL_CACHED_VIEWS - 清空后:', state.cachedViews.length);
  },

  // 强制清空所有数据（包括固定标签）- 只在平台切换时使用
  FORCE_CLEAR_ALL: state => {
    console.log('TagsView Store: FORCE_CLEAR_ALL - 强制清空所有数据');
    state.visitedViews = []
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

  DEL_RIGHT_VIEWS: (state, view) => {
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
    
    // 确保首页标签在第一位
    ensureHomeTagFirstInState(state);
  },

  DEL_LEFT_VIEWS: (state, view) => {
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
    
    // 确保首页标签在第一位
    ensureHomeTagFirstInState(state);
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

  // 新增：添加访问视图到第一位（确保首页在第一位）
  addVisitedViewToFirst({ commit, state }, view) {
    return new Promise(resolve => {
      // 检查视图是否已存在
      const existingIndex = state.visitedViews.findIndex(v => v.path === view.path);
      
      if (existingIndex === -1) {
        // 视图不存在，添加到第一位
        commit('ADD_VISITED_VIEW_TO_FIRST', view);
      } else if (existingIndex !== 0) {
        // 视图存在但不在第一位，移动到第一位
        commit('MOVE_VISITED_VIEW_TO_FIRST', view);
      }
      
      resolve(state.visitedViews);
    });
  },

  // 新增：移动标签到第一位
  moveTagToFirst({ commit, state }, view) {
    return new Promise(resolve => {
      commit('MOVE_VISITED_VIEW_TO_FIRST', view);
      resolve(state.visitedViews);
    });
  },

  // 新增：确保首页标签在第一位
  ensureHomeTagFirst({ commit, state, rootGetters }) {
    return new Promise(resolve => {
      // 获取当前平台的首页信息
      const currentPlatform = rootGetters['permission/currentPlatform'];
      const homeTag = getCurrentPlatformHomeTag(currentPlatform);
      
      if (homeTag) {
        commit('ENSURE_HOME_TAG_FIRST', homeTag);
      }
      
      resolve(state.visitedViews);
    });
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
      resolve([...state.visitedViews])
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
      resolve([...state.visitedViews])
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
      resolve([...state.visitedViews])
    })
  },

  // 修改：平台切换专用的清空action - 完全清空后重新添加首页
  clearAllForPlatformSwitch({ commit, state, rootGetters }) {
    return new Promise(resolve => {
      console.log('TagsView Store: 平台切换专用清空');
      
      // 完全清空
      commit('FORCE_CLEAR_ALL');
      
      // 平台切换后重新添加当前平台的首页标签
      setTimeout(() => {
        const currentPlatform = rootGetters['permission/currentPlatform'];
        const homeTag = getCurrentPlatformHomeTag(currentPlatform);
        
        if (homeTag) {
          commit('ADD_VISITED_VIEW_TO_FIRST', homeTag);
          console.log('TagsView Store: 平台切换后重新添加首页标签:', homeTag.path);
        }
        
        resolve({
          visitedViews: [...state.visitedViews],
          cachedViews: [...state.cachedViews]
        });
      }, 50);
    });
  },

  // 新增：企业切换专用 - 只清空缓存，保留TagsView
  clearCacheForManagerSwitch({ commit, state }) {
    return new Promise(resolve => {
      console.log('TagsView Store: 企业切换专用 - 只清空缓存');
      
      // 只清空缓存，不清空visitedViews
      commit('DEL_ALL_CACHED_VIEWS');
      
      // 确保首页标签在第一位
      const homeIndex = state.visitedViews.findIndex(v => isHomeRoute(v.path));
      if (homeIndex > 0) {
        const [homeView] = state.visitedViews.splice(homeIndex, 1);
        state.visitedViews.unshift(homeView);
      }
      
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      });
    });
  },

  updateVisitedView({ commit }, view) {
    commit('UPDATE_VISITED_VIEW', view)
  },

  delRightTags({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_RIGHT_VIEWS', view)
      resolve([...state.visitedViews])
    })
  },
  
  delLeftTags({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_LEFT_VIEWS', view)
      resolve([...state.visitedViews])
    })
  }
}

// 辅助函数：判断是否为首页路由
function isHomeRoute(path) {
  const homeRoutes = [
    '/dashboard',
    '/console/dashboard', 
    '/admin/dashboard',
    '/',
    '/home'
  ];
  return homeRoutes.includes(path);
}

// 辅助函数：获取当前平台的首页标签
function getCurrentPlatformHomeTag(currentPlatform) {
  switch (currentPlatform) {
    case "console":
      return {
        path: "/console/dashboard",
        fullPath: "/console/dashboard",
        name: "ConsoleDashboard",
        meta: { title: "控制台", affix: true },
      };
    case "admin":
      return {
        path: "/admin/dashboard",
        fullPath: "/admin/dashboard", 
        name: "AdminDashboard",
        meta: { title: "管理后台首页", affix: true },
      };
    default:
      return {
        path: "/dashboard",
        fullPath: "/dashboard",
        name: "Dashboard", 
        meta: { title: "首页", affix: true },
      };
  }
}

// 辅助函数：确保首页标签在第一位（在state中直接操作）
function ensureHomeTagFirstInState(state) {
  const homeIndex = state.visitedViews.findIndex(v => 
    v.meta && v.meta.affix && isHomeRoute(v.path)
  );
  
  if (homeIndex > 0) {
    // 移动首页标签到第一位
    const [homeView] = state.visitedViews.splice(homeIndex, 1);
    state.visitedViews.unshift(homeView);
    console.log('TagsView Store: 自动调整首页标签到第一位');
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}