// store/modules/treeSelection.js
const state = {
  selectedIds: [],        // 选中的节点ID数组
  selectedNodes: [],      // 选中的完整节点数据
  checkedKeys: [],        // el-tree的选中keys
  halfCheckedKeys: [],    // 半选中的keys
  lastUpdateTime: null    // 最后更新时间
}

const getters = {
  // 获取所有选中的ID
  selectedIds: state => state.selectedIds,
  
  // 获取选中的节点数量
  selectedCount: state => state.selectedIds.length,
  
  // 判断某个ID是否被选中
  isSelected: state => id => state.selectedIds.includes(id),
  
  // 获取选中的节点详情
  selectedNodes: state => state.selectedNodes,
  
  // 获取选中的租户ID（过滤出租户节点）
  selectedTenantIds: state => {
    return state.selectedNodes
      .filter(node => node.tenantId)
      .map(node => node.tenantId)
  },
  
  // 获取选中的层级ID（过滤出层级节点）
  selectedTierIds: state => {
    return state.selectedNodes
      .filter(node => !node.tenantId && node.id)
      .map(node => node.id)
  }
}

const mutations = {
  // 设置选中的ID
  SET_SELECTED_IDS(state, ids) {
    state.selectedIds = ids || []
    state.lastUpdateTime = Date.now()
  },
  
  // 设置选中的节点
  SET_SELECTED_NODES(state, nodes) {
    state.selectedNodes = nodes || []
  },
  
  // 设置选中的keys
  SET_CHECKED_KEYS(state, keys) {
    state.checkedKeys = keys || []
  },
  
  // 设置半选中的keys
  SET_HALF_CHECKED_KEYS(state, keys) {
    state.halfCheckedKeys = keys || []
  },
  
  // 添加单个选中ID
  ADD_SELECTED_ID(state, id) {
    if (!state.selectedIds.includes(id)) {
      state.selectedIds.push(id)
      state.lastUpdateTime = Date.now()
    }
  },
  
  // 移除单个选中ID
  REMOVE_SELECTED_ID(state, id) {
    const index = state.selectedIds.indexOf(id)
    if (index > -1) {
      state.selectedIds.splice(index, 1)
      state.lastUpdateTime = Date.now()
    }
  },
  
  // 清空所有选中
  CLEAR_SELECTION(state) {
    state.selectedIds = []
    state.selectedNodes = []
    state.checkedKeys = []
    state.halfCheckedKeys = []
    state.lastUpdateTime = Date.now()
  }
}

const actions = {
  // 更新树形选择（主要方法）
  updateTreeSelection({ commit }, { ids, nodes, checkedKeys, halfCheckedKeys }) {
    commit('SET_SELECTED_IDS', ids)
    commit('SET_SELECTED_NODES', nodes)
    
    if (checkedKeys !== undefined) {
      commit('SET_CHECKED_KEYS', checkedKeys)
    }
    
    if (halfCheckedKeys !== undefined) {
      commit('SET_HALF_CHECKED_KEYS', halfCheckedKeys)
    }
    
    // 触发全局事件通知
    if (window.app && window.app.$bus) {
      window.app.$bus.$emit('tree-selection-changed', {
        ids,
        nodes,
        checkedKeys,
        halfCheckedKeys,
        timestamp: Date.now()
      })
    }
  },
  
  // 切换单个节点的选中状态
  toggleSelection({ state, commit }, { id, node }) {
    if (state.selectedIds.includes(id)) {
      // 如果已选中，则取消选中
      commit('REMOVE_SELECTED_ID', id)
      
      // 同时更新节点数组
      const nodes = state.selectedNodes.filter(n => n.id !== id)
      commit('SET_SELECTED_NODES', nodes)
    } else {
      // 如果未选中，则添加选中
      commit('ADD_SELECTED_ID', id)
      
      // 同时更新节点数组
      if (node) {
        const nodes = [...state.selectedNodes, node]
        commit('SET_SELECTED_NODES', nodes)
      }
    }
  },
  
  // 批量选中
  batchSelect({ commit }, { ids, nodes }) {
    commit('SET_SELECTED_IDS', ids)
    commit('SET_SELECTED_NODES', nodes)
  },
  
  // 清空选择
  clearSelection({ commit }) {
    commit('CLEAR_SELECTION')
    
    // 触发全局事件
    if (window.app && window.app.$bus) {
      window.app.$bus.$emit('tree-selection-cleared', {
        timestamp: Date.now()
      })
    }
  },
  
  // 从localStorage恢复选择状态
  restoreSelection({ commit }) {
    try {
      const saved = localStorage.getItem('tree-selection-state')
      if (saved) {
        const state = JSON.parse(saved)
        
        // 检查是否过期（24小时）
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          commit('SET_SELECTED_IDS', state.selectedIds || [])
          commit('SET_SELECTED_NODES', state.selectedNodes || [])
          commit('SET_CHECKED_KEYS', state.checkedKeys || [])
          return true
        }
      }
    } catch (error) {
      console.error('恢复树形选择状态失败:', error)
    }
    return false
  },
  
  // 保存选择状态到localStorage
  saveSelection({ state }) {
    try {
      const stateToSave = {
        selectedIds: state.selectedIds,
        selectedNodes: state.selectedNodes,
        checkedKeys: state.checkedKeys,
        timestamp: Date.now()
      }
      localStorage.setItem('tree-selection-state', JSON.stringify(stateToSave))
    } catch (error) {
      console.error('保存树形选择状态失败:', error)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}