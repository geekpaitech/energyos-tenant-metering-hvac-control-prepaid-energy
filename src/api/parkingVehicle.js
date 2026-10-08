/**
 * 停车车辆进出场统计 API
 * POST /api/parking/daily-vehicle-count
 *
 * 后端在 https://grid.geekpartytech.com，内部做 ai2park 鉴权、查询、增强后返回
 */

import { GRID_ROOT } from '@/config/services'

const PARKING_SERVICE_URL = GRID_ROOT

function getApiUrl (path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${PARKING_SERVICE_URL.replace(/\/$/, '')}${normalizedPath}`
}

function isSuccess (body) {
  if (!body || typeof body !== 'object') return false
  return String(body.code) === '0'
}

function parkingRequest (path, { body = {} } = {}) {
  return fetch(getApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
    .then(async response => {
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.msg || `HTTP ${response.status}`)
      }
      if (!isSuccess(data)) {
        throw new Error(data.msg || '请求失败')
      }
      return data.data || []
    })
}

/**
 * 查询每日车辆进出场统计
 * @param {Object} params - { fromDate: 'YYYY-MM-DD', toDate: 'YYYY-MM-DD' }
 * @returns {Promise<Array<{parkingLotId, parkingLotName, totalCount, enterCount, exitCount}>>}
 */
export function fetchDailyVehicleCount ({ fromDate, toDate } = {}) {
  if (!fromDate || !toDate) {
    return Promise.reject(new Error('fromDate 和 toDate 均为必填'))
  }
  return parkingRequest('/api/parking/daily-vehicle-count', {
    body: { fromDate, toDate }
  })
}
