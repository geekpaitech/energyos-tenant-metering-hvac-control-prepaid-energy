// @/api/share.js
import request from '@/utils/request'

// 公摊组相关服务

// 获取公摊组列表
export function shareList (data) {
  return request({
    url: '/api/ebc-content/share/list',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 分页查询公摊结算记录
export function sharePageSettleShare (data) {
  return request({
    url: '/api/ebc-content/share/pageSettleShare',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询公摊结算详情
export function shareGetSettleShareDetail (params) {
  return request({
    url: '/api/ebc-content/share/getSettleShareDetail',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 新增公摊组
export function shareAdd (data) {
  return request({
    url: '/api/ebc-content/share/add',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改公摊组
export function shareUpdate (data) {
  return request({
    url: '/api/ebc-content/share/update',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 删除公摊组
export function shareDelete (params) {
  return request({
    url: '/api/ebc-content/share/delete',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询公摊组详情
export function shareGetShareDetail (params) {
  return request({
    url: '/api/ebc-content/share/getShareDetail',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取公摊组-租户信息
export function shareGetShareTenantBindEdit (params) {
  return request({
    url: '/api/ebc-content/share/getShareTenantBindEdit',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 公摊组-租户互相绑定
export function shareBindShareTenant (params) {
  return request({
    url: '/api/ebc-content/share/bindShareTenant',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 租户公摊表列表
export function shareGetTenantShareList (params) {
  return request({
    url: '/api/ebc-content/share/getTenantShareList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取租户-公摊组绑定信息
export function getTenantShareBindEdit (params) {
  return request({
    url: '/api/ebc-content/share/getTenantShareBindEdit',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取公摊组-电表绑定信息
export function shareGetShareMeterBindEdit (params) {
  return request({
    url: '/api/ebc-content/share/getShareMeterBindEdit',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 绑定公摊组-电表列表
export function shareBindShareMeter (params) {
  return request({
    url: '/api/ebc-device/share/bindShareMeter',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 电表扣费
export function shareElecShareDeduction (params) {
  return request({
    url: '/api/ebc-content/share/elecShareDeduction',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}
