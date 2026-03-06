// electricityShare.js - 电表公摊组API接口文件
import request from '@/utils/request'

// ==================== 公摊组基础操作 ====================

// 新增公摊组
export function shareAdd(data) {
  return request({
    url: '/api/ebc-content/share/add',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 列表查询公摊组
export function shareList(data) {
  return request({
    url: '/api/ebc-content/share/list',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改公摊组
export function shareUpdate(data) {
  return request({
    url: '/api/ebc-content/share/update',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 删除公摊组
export function shareDelete(params) {
  return request({
    url: '/api/ebc-content/share/delete',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// ==================== 公摊组详情相关 ====================

// 查询公摊组详情
export function shareGetShareDetail(params) {
  return request({
    url: '/api/ebc-content/share/getShareDetail',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// ==================== 租户绑定相关 ====================

// 获取公摊组-租户绑定信息（用于详情页关联/解绑租户）
export function shareGetShareTenantBindEdit(params) {
  return request({
    url: '/api/ebc-content/share/getShareTenantBindEdit',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 公摊组-租户绑定/解绑操作
export function shareBindShareTenant(params) {
  return request({
    url: '/api/ebc-content/share/bindShareTenant',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取租户-公摊组绑定信息（从租户角度查看）
export function getTenantShareBindEdit(params) {
  return request({
    url: '/api/ebc-content/share/getTenantShareBindEdit',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 租户公摊表列表
export function shareGetTenantShareList(params) {
  return request({
    url: '/api/ebc-content/share/getTenantShareList',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// ==================== 电表绑定相关 ====================

// 获取公摊组-电表绑定信息（用于详情页关联/解绑电表）
export function shareGetShareMeterBindEdit(params) {
  return request({
    url: '/api/ebc-content/share/getShareMeterBindEdit',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 公摊组-电表绑定/解绑操作
export function shareBindShareMeter(params) {
  return request({
    url: '/api/ebc-device/share/bindShareMeter',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// ==================== 结算记录相关 ====================

// 分页查询公摊结算记录
export function sharePageSettleShare(data) {
  return request({
    url: '/api/ebc-content/share/pageSettleShare',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询公摊结算详情
export function shareGetSettleShareDetail(params) {
  return request({
    url: '/api/ebc-content/share/getSettleShareDetail',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// ==================== 扣款相关 ====================

// 电表公摊组扣费
export function shareElecShareDeduction(params) {
  return request({
    url: '/api/ebc-content/share/elecShareDeduction',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// ==================== 电表设置相关 ====================

// 获取电费/服务费方案列表
// priceType: 1-电费方案, 2-服务费方案
export function getMeterPriceList(data) {
  return request({
    url: '/api/ebc-device/meterPrice/list',
    method: 'post',
    data  // 改为 data，不再是 params
  })
}

// 修改电表基本信息
export function meterUpdateMeterBase(data) {
  return request({
    url: '/api/ebc-device/meter/updateMeterBase',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}