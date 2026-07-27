/**
 * 管理后台水表 API（与控制台 water.js 完全隔离，不走权限）
 */
import request from '@/utils/request'

const headers = {
  userDeviceType: 'PC',
  'Content-Type': 'application/json'
}

function post (url, data) {
  return request({ url, method: 'post', headers, data })
}

function postParams (url, params) {
  return request({ url, method: 'post', headers, params })
}

function postParamsAndBody (url, params, data) {
  return request({ url, method: 'post', headers, params, data })
}

export function adminWaterPageWater (data) {
  return post('/api/ebc-content/water/pageWater', data)
}

export function adminWaterAddMeter (data) {
  return post('/api/ebc-content/water/addMeter', data)
}

export function adminWaterUpdateWater (data) {
  return post('/api/ebc-content/water/updateWater', data)
}

export function adminWaterDeleteMeter (params) {
  return postParams('/api/ebc-content/water/deleteWater', params)
}

export function adminWaterGetWaterById (params) {
  return postParams('/api/ebc-content/water/getWaterById', params)
}

export function adminWaterAddMeterBatch (params, data) {
  return postParamsAndBody('/api/ebc-content/water/addMeterBatch', params, data)
}

export function adminWaterChangeWaterManager (data) {
  return post('/api/ebc-content/water/changeWaterManager', data)
}

export function adminWaterOfflineWaterList () {
  return post('/api/ebc-settle/water/offlineWaterList')
}

export function adminWaterWaterUnregisteredList () {
  return post('/api/ebc-settle/water/waterUnregisteredList')
}

export { adminDbGetManagerListByUser, adminDbGetSimpleTenantList } from '@/api/adminDb'
