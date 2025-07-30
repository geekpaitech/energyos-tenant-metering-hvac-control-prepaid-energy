// @/api/meter.js
import request from '@/utils/request'

// 分页查询电表信息（管理员）
export function meterPageMeterInfoByAdmin(data) {
  return request({
    url: '/api/ebc-content/meter/pageMeterInfoByAdmin',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 新增电表
export function meterAddMeter(data) {
  return request({
    url: '/api/ebc-device/meter/addMeter',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
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

// 执行电表分合闸操作
export function tenantDoMeterSwitchOffOn(params) {
  return request({
    url: '/api/ebc-device/tenant/doMeterSwitchOffOn',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 转移电表所属管理方
export function meterChangeMeterManager(data) {
  return request({
    url: '/api/ebc-device/meter/changeMeterManager',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询电表最新上报数据
export function meterLatestRecord(params) {
  return request({
    url: '/api/ebc-device/meter/latestRecord',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 修改电表逻辑付费类型
export function meterUpdateLogicPayType(data) {
  return request({
    url: '/api/ebc-device/meter/updateLogicPayType',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}
// 分页查询电表信息（普通用户）
export function meterPageMeterInfo(data) {
  return request({
    url: '/api/ebc-content/meter/pageMeterInfo',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 电表余额归零
export function meterZeroBalance(params) {
  return request({
    url: '/api/ebc-device/meter/zeroBalance',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 修改电表基本信息 - 老项目使用的是 meterUpdataeMeterBase（注意拼写）
export function meterUpdataeMeterBase(data) {
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