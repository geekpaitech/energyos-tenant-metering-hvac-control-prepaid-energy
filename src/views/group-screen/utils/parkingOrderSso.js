import { PARKING_OAUTH_URL } from '@/config/services'

const AI2PARK_OAUTH_URL = PARKING_OAUTH_URL
const AI2PARK_PLATFORM_NAME = '极派信息科技'
const AI2PARK_ORDER_REDIRECT = 'park-finance_order'

/**
 * 与停车子系统保持相同口径：优先使用管理方配置的 parkingLotId，
 * 未配置时兼容回退 managerId。
 */
export function resolveParkingLotId ({ currentManagerId, managerList = [] } = {}) {
  if (currentManagerId == null || currentManagerId === '') return ''
  const manager = (Array.isArray(managerList) ? managerList : []).find(
    item => String(item.managerId) === String(currentManagerId)
  )
  const parkingLotId = manager && manager.parkingLotId
  if (parkingLotId != null && String(parkingLotId).trim() !== '') {
    return String(parkingLotId).trim()
  }
  return String(currentManagerId).trim()
}

export function buildParkingOrderSsoUrl ({ token, parkId, nonce = Date.now(), redirect } = {}) {
  const normalizedToken = String(token || '').trim()
  const normalizedParkId = String(parkId || '').trim()
  if (!normalizedToken || !normalizedParkId) return ''

  const query = new URLSearchParams({
    token: normalizedToken,
    platformName: AI2PARK_PLATFORM_NAME,
    parkId: normalizedParkId,
    _r: String(nonce),
    redirect: redirect || AI2PARK_ORDER_REDIRECT
  })
  return `${AI2PARK_OAUTH_URL}?${query.toString()}`
}
