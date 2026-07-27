// waterShare.js - 水表公摊组API接口文件
import request from '@/utils/request'

// 水表公摊组相关接口

// 新增水表公摊组
export function waterShareAdd (data) {
  return request({
    url: '/api/ebc-content/waterShare/add',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 列表查询水表公摊组
export function waterShareList (data) {
  return request({
    url: '/api/ebc-content/waterShare/list',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改水表公摊组
export function waterShareUpdate (data) {
  return request({
    url: '/api/ebc-content/waterShare/update',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 删除水表公摊组
export function waterShareDelete (params) {
  return request({
    url: '/api/ebc-content/waterShare/delete',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询水表公摊组详情
export function waterShareGetShareDetail (params) {
  return request({
    url: '/api/ebc-content/waterShare/getShareDetail',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取水表公摊组-租户信息
export function waterShareGetShareTenantBindEdit (params) {
  return request({
    url: '/api/ebc-content/waterShare/getShareTenantBindEdit',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 水表公摊组-租户互相绑定
export function waterShareBindShareTenant (params) {
  return request({
    url: '/api/ebc-content/waterShare/bindShareTenant',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 租户水表公摊表列表
export function waterShareGetTenantShareList (params) {
  return request({
    url: '/api/ebc-content/waterShare/getTenantShareList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取租户-水表公摊组绑定信息
export function waterGetTenantShareBindEdit (params) {
  return request({
    url: '/api/ebc-content/waterShare/getTenantShareBindEdit',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取水表公摊组-水表绑定信息
export function waterShareGetShareMeterBindEdit (params) {
  return request({
    url: '/api/ebc-content/waterShare/getShareMeterBindEdit',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 绑定水表公摊组-水表列表
export function waterShareBindShareMeter (params) {
  return request({
    url: '/api/ebc-device/waterShare/bindShareMeter',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 分页查询水表公摊结算记录
export function waterSharePageSettleShare (data) {
  return request({
    url: '/api/ebc-content/waterShare/pageSettleShare',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询水表公摊结算详情
export function waterShareGetSettleShareDetail (params) {
  return request({
    url: '/api/ebc-content/waterShare/getSettleShareDetail',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 水表公摊组扣费
export function shareWaterShareDeduction (params) {
  return request({
    url: '/api/ebc-content/waterShare/waterShareDeduction',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}
export function waterSharePageWaterSettleShare (data) {
  return request({
    url: '/api/ebc-content/waterShare/pageWaterSettleShare',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 分摊详情接口
export function getShareFeeDetail (params) {
  return request({
    url: '/api/ebc-settle/feeshare/getShareFeeDetail',
    method: 'post',
    headers: {
      userDeviceType: 'PC'
    },
    params
  })
}
