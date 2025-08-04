// @/api/meterPrice.js
import request from '@/utils/request'

// 新增电表方案
export function meterPriceAdd(data) {
  return request({
    url: '/api/ebc-device/meterPrice/add',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 设置方案启用状态
export function meterPriceChangeEnableStatus(params) {
  return request({
    url: '/api/ebc-device/meterPrice/changeEnableStatus',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表方案列表
export function meterPriceList(data) {
  return request({
    url: '/api/ebc-device/meterPrice/list',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改电表方案
export function meterPriceUpdate(data) {
  return request({
    url: '/api/ebc-device/meterPrice/update',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 获取批量绑定电表列表
export function meterPriceQueryPriceMeterEdit(params) {
  return request({
    url: '/api/ebc-device/meterPrice/queryPriceMeterEdit',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 根据id查询电表方案
export function meterPriceQueryById(data) {
  return request({
    url: '/api/ebc-device/meterPrice/queryById',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 批量绑定电表到方案
export function meterPriceBatchBindPriceMeter(data) {
  return request({
    url: '/api/ebc-device/meterPrice/batchBindPriceMeter',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询调价日志（分页）
export function meterPriceLogPageMeterPriceLog(data) {
  return request({
    url: '/api/ebc-content/meterPriceLog/pageMeterPriceLog',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 发送验证码（用于调价验证）
export function authSendSmsCode(params) {
  return request({
    url: '/api/ebc-auth/auth/sendSmsCode',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 调价日志
export function queryPriceLog(data) {
    return request({
      url: '/api/ebc-content/meterPriceLog/pageMeterPriceLog',
      method: 'post',
      headers: {
        'userDeviceType': 'PC',
        'Content-Type': 'application/json'
      },
      data
    })
  }
