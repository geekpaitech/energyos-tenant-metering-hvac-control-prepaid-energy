// @/store/modules/manager.js - 修正后的版本

import Vue from 'vue'
import { getManagerListByUser, setDefaultManagerByUser } from '@/api/manager'

const state = {
  managerList: [], // 企业列表
  currentManagerId: null, // 当前选中的企业ID
  currentManager: null, // 当前选中的企业信息
  /** 接口下发的、需展示空调系统电量(sysElec)等扩展的管理方 ID 列表 */
  airSysElecManagerIds: []
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
  },
  SET_AIR_SYS_ELEC_MANAGER_IDS: (state, ids) => {
    state.airSysElecManagerIds = Array.isArray(ids) ? ids : []
  }
}

const actions = {
  // 拉取「空调系统电量系数」白名单管理方 ID（避免 manager 静态 import api 与 request 引 store 形成环依赖）
  async fetchAirSysElecCoefKeys ({ commit, rootGetters }) {
    const platform = rootGetters['permission/currentPlatform']
    if (platform && platform !== 'console') {
      commit('SET_AIR_SYS_ELEC_MANAGER_IDS', [])
      return
    }
    try {
      const { getAirSysElecCoefKeys } = await import('@/api/settle')
      const res = await getAirSysElecCoefKeys()
      // 约定：{ code: 200, data: number[] | string[] }，如 data: [1000107]
      const raw = res && res.data
      const ids = Array.isArray(raw)
        ? raw.map((x) => String(x).trim()).filter((s) => s.length > 0)
        : []
      commit('SET_AIR_SYS_ELEC_MANAGER_IDS', ids)
    } catch (e) {
      console.warn('[manager] fetchAirSysElecCoefKeys failed', e)
      commit('SET_AIR_SYS_ELEC_MANAGER_IDS', [])
    }
  },

  // 获取企业列表
  async getManagerList ({ commit, dispatch }) {
    try {
      const response = await getManagerListByUser()

      if (response.code === 200 && response.data) {
        const managerList = response.data
        commit('SET_MANAGER_LIST', managerList)

        // 优先从localStorage恢复之前选择的企业
        const savedManagerId = localStorage.getItem('selectedManagerId')
        if (savedManagerId) {
          const savedManager = managerList.find(
            (item) => item.managerId === parseInt(savedManagerId)
          )
          if (savedManager) {
            commit('SET_CURRENT_MANAGER_ID', savedManager.managerId)
            commit('SET_CURRENT_MANAGER', savedManager)

            await dispatch('fetchAirSysElecCoefKeys')
            return managerList
          }
        }

        // 如果localStorage没有或找不到，则设置默认企业
        const defaultManager = managerList.find((item) => item.isDefault === 1)
        if (defaultManager) {
          commit('SET_CURRENT_MANAGER_ID', defaultManager.managerId)
          commit('SET_CURRENT_MANAGER', defaultManager)
        } else if (managerList.length > 0) {
          // 如果没有默认的，选择第一个
          commit('SET_CURRENT_MANAGER_ID', managerList[0].managerId)
          commit('SET_CURRENT_MANAGER', managerList[0])
        }

        await dispatch('fetchAirSysElecCoefKeys')
        return managerList
      } else {
        console.error('获取企业列表失败:', response.msg)
        return []
      }
    } catch (error) {
      console.error('获取企业列表异常:', error)
      return []
    }
  },

  // 切换企业 - 明确这是企业切换，不是平台切换
  async switchManager ({ commit, state, rootGetters }, managerId) {
    // 获取当前平台信息
    const currentPlatform = rootGetters['permission/currentPlatform']

    // 验证这是否为有效的企业切换
    if (currentPlatform !== 'console') {
      console.warn('企业切换只能在控制台平台进行')
      throw new Error('企业切换只能在控制台平台进行')
    }

    const manager = state.managerList.find(
      (item) => item.managerId === managerId
    )
    if (manager) {
      const previousManagerId = state.currentManagerId

      commit('SET_CURRENT_MANAGER_ID', managerId)
      commit('SET_CURRENT_MANAGER', manager)

      // 重要：明确标识这是企业切换事件，不会清空TagsView
      if (Vue.prototype.$bus) {
        Vue.prototype.$bus.$emit('manager-switched', {
          managerId: managerId,
          managerInfo: manager,
          previousManagerId: previousManagerId,
          type: 'manager-switch', // 明确标识这是企业切换
          platform: currentPlatform,
          clearTagsView: false // 明确标识不清空TagsView
        })
      }

      return manager
    } else {
      console.error('未找到企业:', managerId)
      throw new Error('未找到指定的企业')
    }
  },

  // 设置默认管理方
  async setDefaultManager ({ commit, state }, managerId) {
    try {
      await setDefaultManagerByUser({ managerId })
      // 更新本地 managerList 中的 isDefault 标记
      const updatedList = state.managerList.map((item) => ({
        ...item,
        isDefault: item.managerId === managerId ? 1 : 0
      }))
      commit('SET_MANAGER_LIST', updatedList)

      // 如果当前管理方就是新默认管理方，同步更新 currentManager 的 isDefault
      if (state.currentManagerId === managerId && state.currentManager) {
        commit('SET_CURRENT_MANAGER', { ...state.currentManager, isDefault: 1 })
      }

      return { success: true }
    } catch (error) {
      console.error('设置默认管理方失败:', error)
      throw error
    }
  },

  // 重置企业状态（平台切换时调用）
  resetManager ({ commit }) {
    commit('SET_MANAGER_LIST', [])
    commit('SET_CURRENT_MANAGER_ID', null)
    commit('SET_CURRENT_MANAGER', null)
    commit('SET_AIR_SYS_ELEC_MANAGER_IDS', [])
    localStorage.removeItem('selectedManagerId')
    console.log('企业状态已重置')
  }
}

const getters = {
  managerList: (state) => state.managerList,
  currentManagerId: (state) => state.currentManagerId,
  currentManager: (state) => state.currentManager,
  hasMultipleManagers: (state) => state.managerList.length > 1,
  shouldShowManagerSwitcher: (state) => state.managerList.length > 1,

  // 新增：判断是否为有效的企业切换环境
  canSwitchManager: (state, getters, rootState, rootGetters) => {
    const currentPlatform = rootGetters['permission/currentPlatform']
    return currentPlatform === 'console' && state.managerList.length > 1
  },

  /** 当前管理方 ID 是否在「空调系统电量系数」白名单内（用于 sysElec 等扩展展示） */
  airSysElecManagerIds: (state) => state.airSysElecManagerIds,

  /**
   * @returns {(managerId: string|number|null|undefined) => boolean}
   */
  isAirSysElecManager: (state) => (managerId) => {
    const mid = String(managerId ?? '').trim()
    if (!mid) return false
    const ids = state.airSysElecManagerIds || []
    return ids.some((x) => String(x).trim() === mid)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
