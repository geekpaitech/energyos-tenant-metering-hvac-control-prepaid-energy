import moment from 'moment'
import request from '@/utils/request'
import { GROUP_ENERGY_MANAGERS } from './groupEnergyOverview'

const CONTENT_BASE = '/api/ebc-content'
const REPORT_HEADERS = {
  userDeviceType: 'PC',
  'Content-Type': 'application/json'
}

function post (url, data) {
  return request({
    url,
    method: 'post',
    data,
    headers: REPORT_HEADERS,
    skipErrorMessage: true
  })
}

function ensureSuccess (response) {
  if (!response || String(response.code) !== '200') {
    throw new Error((response && response.msg) || '设备统计请求失败')
  }
  return response.data || {}
}

function requiredCount (value, field) {
  if (value == null || value === '' || typeof value === 'boolean') {
    throw new Error(`设备统计缺少字段：${field}`)
  }
  const number = Number(value)
  if (!Number.isFinite(number)) {
    throw new Error(`设备统计字段异常：${field}`)
  }
  return Math.max(0, Math.round(number))
}

function optionalCount (value) {
  if (value == null || value === '' || typeof value === 'boolean') return null
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : null
}

function round1 (value) {
  return Number(Number(value).toFixed(1))
}

function createMetric (key, label, icon, total, offline, abnormalOffline = null) {
  const normalOffline = abnormalOffline != null && abnormalOffline <= offline
    ? offline - abnormalOffline
    : null
  return {
    key,
    label,
    icon,
    total,
    offline,
    abnormalOffline,
    normalOffline,
    online: Math.max(0, total - offline)
  }
}

export function queryManagerDeviceOverview ({ manager, date }) {
  return post(`${CONTENT_BASE}/tenant/topStatistics`, {
    managerId: manager.managerId,
    beginTime: date,
    endTime: date
  }).then(response => {
    const data = ensureSuccess(response)
    const devices = [
      createMetric(
        'electricity',
        '电表台数（台）',
        'iconfont icon-dianbiao5',
        requiredCount(data.meterCount, 'meterCount'),
        requiredCount(data.meterOfflineCount, 'meterOfflineCount'),
        optionalCount(data.meterAbnormalOfflineCount)
      ),
      createMetric(
        'water',
        '水表台数（台）',
        'iconfont icon-shuibiaoguohu-',
        requiredCount(data.waterCount, 'waterCount'),
        requiredCount(data.waterOfflineCount, 'waterOfflineCount')
      ),
      createMetric(
        'air',
        '空调内机（台）',
        'iconfont icon-kongtiao1',
        requiredCount(data.airCount, 'airCount'),
        requiredCount(data.airOfflineCount, 'airOfflineCount')
      )
    ]
    const total = devices.reduce((sum, item) => sum + item.total, 0)
    const offline = devices.reduce((sum, item) => sum + item.offline, 0)
    const online = Math.max(0, total - offline)

    return {
      ...manager,
      devices,
      total,
      offline,
      online,
      rate: total > 0 ? round1(online / total * 100) : 0,
      available: true
    }
  })
}

/**
 * 集团驾驶舱专用设备概览：与系统首页保持相同的前三类设备及统计口径。
 */
export async function queryGroupDeviceOverview ({
  managers = GROUP_ENERGY_MANAGERS,
  date = moment().subtract(1, 'day').format('YYYY-MM-DD')
} = {}) {
  const settled = await Promise.allSettled(
    managers.map(manager => queryManagerDeviceOverview({ manager, date }))
  )
  const projects = settled.map((result, index) => {
    if (result.status === 'fulfilled') return result.value
    return {
      ...managers[index],
      devices: [],
      total: null,
      offline: null,
      online: null,
      rate: null,
      available: false,
      error: result.reason && result.reason.message
        ? result.reason.message
        : '数据获取失败'
    }
  })
  const complete = projects.every(project => project.available)

  if (!complete) {
    return {
      date,
      projects,
      complete,
      total: null,
      offline: null,
      online: null,
      rate: null
    }
  }

  const total = projects.reduce((sum, project) => sum + project.total, 0)
  const offline = projects.reduce((sum, project) => sum + project.offline, 0)
  const online = Math.max(0, total - offline)
  return {
    date,
    projects,
    complete,
    total,
    offline,
    online,
    rate: total > 0 ? round1(online / total * 100) : 0
  }
}
