// @/api/parking.js — 停车/租户车辆（独立模块）
import request from '@/utils/request'

const BASE = '/api/ebc-content/tenantVehicle'

/** 分页查询车辆 */
export function tenantVehiclePage (data) {
  return request({
    url: `${BASE}/page`,
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

/** 添加车辆 */
export function tenantVehicleCreate (data) {
  return request({
    url: `${BASE}/create`,
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

/** 修改车辆 */
export function tenantVehicleUpdate (data) {
  return request({
    url: `${BASE}/update`,
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

/** 删除车辆 */
export function tenantVehicleDelete (params) {
  return request({
    url: `${BASE}/delete`,
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}
