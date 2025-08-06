import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import permission from './modules/permission'
import app from './modules/app'
import manager from './modules/manager'
import tagsView from './modules/tagsView' // 添加 tagsView 模块
import treeSelection from './modules/treeSelection'  // 引入树形选择模块

Vue.use(Vuex)

console.log('Store modules loaded:', { 
  user: !!user, 
  app: !!app, 
  permission: !!permission, 
  manager: !!manager,
  tagsView: !!tagsView  // 添加调试信息
})

const store = new Vuex.Store({
  modules: {
    user,
    app,
    permission,
    manager,
    tagsView, // 注册 tagsView 模块
    treeSelection  
  },
  getters: {
    sidebar: state => state.app.sidebar,
    device: state => state.app.device,
    token: state => state.user.token,
    avatar: state => state.user.avatar,
    name: state => state.user.name,
    roles: state => state.user.roles,
    role: state => state.user.role,
    phone: state => state.user.phone,
    permissions: state => state.user.permissions,
    permission_routes: state => state.permission.routes,
    addRoutes: state => state.permission.addRoutes,
    // 管理方相关 getters
    managerList: state => state.manager.managerList,
    currentManagerId: state => state.manager.currentManagerId,
    currentManager: state => state.manager.currentManager,
    hasMultipleManagers: state => state.manager.hasMultipleManagers,
    shouldShowManagerSwitcher: state => state.manager.shouldShowManagerSwitcher,
    // tagsView 相关 getters
    visitedViews: state => state.tagsView.visitedViews,
    cachedViews: state => state.tagsView.cachedViews,
     // treeSelection 相关 getters - 只获取ID集合
     treeSelectedIds: state => state.treeSelection ? state.treeSelection.selectedIds : [],
     treeSelectedCount: state => state.treeSelection ? state.treeSelection.selectedIds.length : 0,
     hasTreeSelection: state => state.treeSelection ? state.treeSelection.selectedIds.length > 0 : false
  }
})

console.log('Store created:', store)

export default store