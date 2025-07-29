import { getManagerListByUser } from '@/api/manager'

const state = {
  managerList: [], // 管理方列表
  currentManagerId: null, // 当前选中的管理方ID
  currentManager: null // 当前选中的管理方信息
}

const mutations = {
  SET_MANAGER_LIST: (state, list) => {
    state.managerList = list
  },
  SET_CURRENT_MANAGER_ID: (state, managerId) => {
    state.currentManagerId = managerId
    // 同时更新localStorage
    if (managerId) {
      localStorage.setItem('selectedManagerId', managerId.toString())
    } else {
      localStorage.removeItem('selectedManagerId')
    }
  },
  SET_CURRENT_MANAGER: (state, manager) => {
    state.currentManager = manager
  }
}

const actions = {
  // 获取管理方列表
  async getManagerList({ commit }) {
    try {
      console.log('获取管理方列表...')
      const response = await getManagerListByUser()
      console.log('管理方列表响应:', response)
      
      if (response.code === 200 && response.data) {
        const managerList = response.data
        commit('SET_MANAGER_LIST', managerList)
        
        // 优先从localStorage恢复之前选择的管理方
        const savedManagerId = localStorage.getItem('selectedManagerId')
        if (savedManagerId) {
          const savedManager = managerList.find(item => item.managerId === parseInt(savedManagerId))
          if (savedManager) {
            commit('SET_CURRENT_MANAGER_ID', savedManager.managerId)
            commit('SET_CURRENT_MANAGER', savedManager)
            console.log('从localStorage恢复管理方:', savedManager)
            return managerList
          }
        }
        
        // 如果localStorage没有或找不到，则设置默认管理方
        const defaultManager = managerList.find(item => item.isDefault === 1)
        if (defaultManager) {
          commit('SET_CURRENT_MANAGER_ID', defaultManager.managerId)
          commit('SET_CURRENT_MANAGER', defaultManager)
          console.log('设置默认管理方:', defaultManager)
        } else if (managerList.length > 0) {
          // 如果没有默认的，选择第一个
          commit('SET_CURRENT_MANAGER_ID', managerList[0].managerId)
          commit('SET_CURRENT_MANAGER', managerList[0])
          console.log('设置第一个管理方为默认:', managerList[0])
        }
        
        return managerList
      } else {
        console.error('获取管理方列表失败:', response.msg)
        return []
      }
    } catch (error) {
      console.error('获取管理方列表异常:', error)
      return []
    }
  },
  
  // 切换管理方
  switchManager({ commit, state }, managerId) {
    console.log('切换管理方到:', managerId)
    
    const manager = state.managerList.find(item => item.managerId === managerId)
    if (manager) {
      commit('SET_CURRENT_MANAGER_ID', managerId)
      commit('SET_CURRENT_MANAGER', manager)
      console.log('管理方切换成功:', manager)
      return manager
    } else {
      console.error('未找到管理方:', managerId)
      return null
    }
  },
  
  // 重置管理方状态
  resetManager({ commit }) {
    commit('SET_MANAGER_LIST', [])
    commit('SET_CURRENT_MANAGER_ID', null)
    commit('SET_CURRENT_MANAGER', null)
    localStorage.removeItem('selectedManagerId')
    console.log('重置管理方状态')
  }
}

const getters = {
  managerList: state => state.managerList,
  currentManagerId: state => state.currentManagerId,
  currentManager: state => state.currentManager,
  hasMultipleManagers: state => state.managerList.length > 1,
  shouldShowManagerSwitcher: state => state.managerList.length > 1
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}