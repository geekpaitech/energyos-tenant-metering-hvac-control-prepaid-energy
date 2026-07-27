// @/api/meter.js
import request from '@/utils/request'

// 分页查询电表信息（管理员）
export function meterPageMeterInfoByAdmin (data) {
  return request({
    url: '/api/ebc-content/meter/pageMeterInfoByAdmin',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 新增电表
export function meterAddMeter (data) {
  return request({
    url: '/api/ebc-device/meter/addMeter',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改电表基本信息
export function meterUpdateMeterBase (data) {
  return request({
    url: '/api/ebc-device/meter/updateMeterBase',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 执行电表分合闸操作
export function tenantDoMeterSwitchOffOn (params) {
  return request({
    url: '/api/ebc-device/tenant/doMeterSwitchOffOn',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 转移电表所属管理方
export function meterChangeMeterManager (data) {
  return request({
    url: '/api/ebc-device/meter/changeMeterManager',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询电表最新上报数据
export function meterLatestRecord (params) {
  return request({
    url: '/api/ebc-device/meter/latestRecord',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 修改电表逻辑付费类型
export function meterUpdateLogicPayType (data) {
  return request({
    url: '/api/ebc-device/meter/updateLogicPayType',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}
// 分页查询电表信息（普通用户）
export function meterPageMeterInfo (data) {
  return request({
    url: '/api/ebc-content/meter/pageMeterInfo',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 电表余额归零
export function meterZeroBalance (params) {
  return request({
    url: '/api/ebc-device/meter/zeroBalance',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 修改电表基本信息 - 老项目使用的是 meterUpdataeMeterBase（注意拼写）
export function meterUpdataeMeterBase (data) {
  return request({
    url: '/api/ebc-device/meter/updateMeterBase',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 新增：查询电表详情信息
export function queryMeterDetail (serial) {
  return request({
    url: '/api/ebc-content/customerWorkbench/queryMeterDetail',
    method: 'post',
    headers: {
      userDeviceType: 'PC'
    },
    params: {
      serial: serial
    }
  })
}

export function queryMeterLastDetail (serial) {
  return request({
    url: '/api/ebc-content/customerWorkbench/queryMeterLastDetail',
    method: 'post',
    headers: {
      userDeviceType: 'PC'
    },
    params: {
      serial: serial
    }
  })
}

// 新增：查询电表上下线记录（替换设备事件）
export function getMeterOnOffLineList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterOnOffLineList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 新增：查询电表启停记录（替换抄表记录）
export function getMeterEnableList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterEnableList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 新增：查询电表绑定记录
export function getMeterBindList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterBindList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}
// @/api/meter.js - 在现有基础上新增以下接口

// ============ 电表生命周期事件接口 ============

// 查询电表绑定类型修改记录
export function getMeterBindTypeList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterBindTypeList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表充值记录
export function getMeterChargeList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterChargeList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表付费模式修改记录
export function getMeterLogicPayTypeList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterLogicPayTypeList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表调价记录
export function getMeterPriceModifyList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterPriceModifyList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表结算记录
export function getMeterSettleList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterSettleList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表分合闸记录
export function getMeterSwitchList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterSwitchList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表创建记录
export function getMeterCreateList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterCreateList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表CT值变更记录
export function getMeterCtList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterCtList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表余额大于0记录
export function getMeterBalanceOverZoneList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterBalanceOverZoneList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询PT变更报警记录
export function getMeterPtList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterPtList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电价修复记录
export function getMeterPriceRepairList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterPriceRepairList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询电表电力数据上报记录
export function getMeterRecordList (params) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterRecordList',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

export function getSimpleMeterInfo (params) {
  return request({
    url: '/api/ebc-content/meter/getSimpleMeterInfo',
    method: 'post',
    headers: {
      userDeviceType: 'PC'
    },
    params
  })
}

// 获取电表功率列表（Pa/Pb/Pc/P）
export function getMeterPList (params) {
  return request({
    url: '/api/ebc-content/meter/getMeterPList',
    method: 'post',
    headers: {
      userDeviceType: 'PC'
    },
    params
  })
}
