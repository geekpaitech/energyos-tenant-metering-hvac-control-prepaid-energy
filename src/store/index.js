import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import permission from './modules/permission'
import app from './modules/app'
import manager from './modules/manager'
import tagsView from './modules/tagsView'
import treeSelection from './modules/treeSelection'
import enumData from './modules/enumData' // ✅ 添加这一行
import adminAirEnum from './modules/adminAirEnum'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    user,
    app,
    permission,
    manager,
    tagsView,
    treeSelection,
    enumData, // ✅ 注册模块
    adminAirEnum
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
    permission_routes: state => state.permission.routes,
    permissions: state => state.user.permissions,
    kztMenuNos: state => state.permission.kztMenuNos,
    isInitPassword: state => state.user.isInitPassword,
    userInfoLoaded: state => state.user.userInfoLoaded,
    addRoutes: state => state.permission.addRoutes,
    routesInitialized: state => state.permission.routesInitialized,
    managerList: state => state.manager.managerList,
    currentManagerId: state => state.manager.currentManagerId,
    currentManager: state => state.manager.currentManager,
    hasMultipleManagers: state => state.manager.hasMultipleManagers,
    shouldShowManagerSwitcher: state => state.manager.shouldShowManagerSwitcher,
    visitedViews: state => state.tagsView.visitedViews,
    cachedViews: state => state.tagsView.cachedViews,
    treeSelectedIds: state => state.treeSelection ? state.treeSelection.selectedIds : [],
    treeSelectedCount: state => state.treeSelection ? state.treeSelection.selectedIds.length : 0,
    hasTreeSelection: state => state.treeSelection ? state.treeSelection.selectedIds.length > 0 : false
  }
})

export default store
