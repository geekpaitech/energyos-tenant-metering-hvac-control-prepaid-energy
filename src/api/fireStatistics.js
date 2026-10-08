import { GRID_ROOT } from '@/config/services'

const FIRE_STATISTICS_URL = `${GRID_ROOT}/api/fire/statistics`

/** 经开资管消防系统概览统计 */
export async function getFireStatistics () {
  const response = await fetch(FIRE_STATISTICS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dwbh: 'sz8020'
    })
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.msg || `消防统计请求失败（HTTP ${response.status}）`)
  }
  return body
}
