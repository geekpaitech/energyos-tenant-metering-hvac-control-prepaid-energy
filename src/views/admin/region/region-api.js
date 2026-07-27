import request from '@/utils/request'
import { getFloorProfile } from './floors'

/** 项目级默认参数 */
export const REGION_DEFAULTS = {
  projectId: '',
  subsystemId: 4,
  deviceType: 6
}

const USE_MOCK = process.env.VUE_APP_REGION_USE_MOCK !== 'false'

const API_PLACEMENT_LIST = '/api/ebc-device/devicePoint/listByAddress'
const API_DEVICE_GROUP = '/api/ebc-device/device/listDeviceInfoGroup'
const API_ADDRESS_LIST = '/api/ebc-content/address/listAddress'

function fetchPlacements (addressId, params) {
  return request({
    url: API_PLACEMENT_LIST,
    method: 'post',
    data: {
      projectId: REGION_DEFAULTS.projectId,
      assoAddressId: addressId,
      assoSubsystemId: REGION_DEFAULTS.subsystemId,
      deviceType: REGION_DEFAULTS.deviceType,
      ...params
    }
  })
}

function fetchDeviceGroups (addressId, params) {
  return request({
    url: API_DEVICE_GROUP,
    method: 'post',
    data: {
      projectId: REGION_DEFAULTS.projectId,
      addressId,
      subsystemId: REGION_DEFAULTS.subsystemId,
      deviceType: REGION_DEFAULTS.deviceType,
      ...params
    }
  })
}

function fetchAddressList (params) {
  return request({
    url: API_ADDRESS_LIST,
    method: 'post',
    data: {
      projectId: REGION_DEFAULTS.projectId,
      ...params
    }
  })
}

/**
 * 按楼层加载落位数据（addressId 与 floors/index 中该层配置一致）
 * @param {string} floorKey 如 '10F'、'9F'
 */
export async function loadRegionPageData (floorKey = '10F') {
  const floor = getFloorProfile(floorKey)
  if (!floor) {
    throw new Error(`[region] 未注册楼层: ${floorKey}`)
  }

  if (floor.displayOnly) {
    return {
      placements: [],
      deviceGroups: [],
      address: {
        id: floor.addressId || '',
        name: floor.label,
        display: floor.label
      },
      floorKey: floor.key
    }
  }

  const addressId = floor.addressId
  const mockBundle = floor.mock

  if (USE_MOCK && mockBundle) {
    return {
      placements: mockBundle.placements,
      deviceGroups: mockBundle.deviceGroups,
      address: mockBundle.address,
      floorKey: floor.key
    }
  }

  try {
    const [placementRes, deviceRes, addressRes] = await Promise.all([
      fetchPlacements(addressId),
      fetchDeviceGroups(addressId),
      fetchAddressList()
    ])

    const placements = (placementRes && placementRes.data) || []
    const deviceGroups = (deviceRes && deviceRes.data) || []
    const addressList = (addressRes && addressRes.data) || []
    const fallbackAddress = (mockBundle && mockBundle.address) || {
      id: addressId || '',
      name: floor.label,
      display: floor.label
    }
    const address = addressList.find(a => a.id === addressId) || addressList[0] || fallbackAddress

    return { placements, deviceGroups, address, floorKey: floor.key }
  } catch (e) {
    console.warn(`[region] ${floorKey} 接口失败，回退 mock`, e)
    if (!mockBundle) throw e
    return {
      placements: mockBundle.placements,
      deviceGroups: mockBundle.deviceGroups,
      address: mockBundle.address,
      floorKey: floor.key
    }
  }
}
