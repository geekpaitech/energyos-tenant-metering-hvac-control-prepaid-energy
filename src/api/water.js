import request from '@/utils/request'

// 水表信息相关接口

// 新增水表
export function waterAddMeter(data) {
  return request({
    url: '/api/ebc-content/water/addMeter',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 删除水表
export function waterDeleteMeter(params) {
  return request({
    url: '/api/ebc-content/water/deleteWater',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 根据id查询
export function waterGetWaterById(params) {
  return request({
    url: '/api/ebc-content/water/getWaterById',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 根据序列号查询
export function waterGetWaterBySerial(params) {
  return request({
    url: '/api/ebc-content/water/getWaterBySerial',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 列表查询水表
export function waterListWater(data) {
  return request({
    url: '/api/ebc-content/water/listWater',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 分页查询
export function waterPageWater(data) {
  return request({
    url: '/api/ebc-content/water/pageWater',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改水表
export function waterUpdateWater(data) {
  return request({
    url: '/api/ebc-content/water/updateWater',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 获取租户-专用表绑定信息
export function waterGetTenantWaterBindEdit(params) {
  return request({
    url: '/api/ebc-content/water/getTenantWaterBindEdit',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 绑定（解绑）租户-专用表
export function waterBindTenantWater(params) {
  return request({
    url: '/api/ebc-content/water/bindTenantWater',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询租户水费日结账单详情
export function waterGetTenantWaterSettleDetail(params) {
  return request({
    url: '/api/ebc-content/water/getTenantWaterSettleDetail',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 开关阀门
export function waterDoWaterSwitch(params) {
  return request({
    url: '/api/ebc-settle/water/doWaterSwitch',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 批量绑定水表
export function waterBatchBindTenantWater(data) {
  return request({
    url: '/api/ebc-content/water/batchBindTenantWater',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 批量导入水表
export function waterAddMeterBatch(params, data) {
  return request({
    url: '/api/ebc-content/water/addMeterBatch',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params,
    data
  })
}

// 水表切换管理方
export function waterChangeWaterManager(data) {
  return request({
    url: '/api/ebc-content/water/changeWaterManager',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 批量查询水表实时数据
export function waterBatchQueryWaterReal(data) {
  return request({
    url: '/api/ebc-settle/water/batchQueryWaterReal',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询离线水表列表
export function waterOfflineWaterList() {
  return request({
    url: '/api/ebc-settle/water/offlineWaterList',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}

// 查询未注册水表列表
export function waterWaterUnregisteredList() {
  return request({
    url: '/api/ebc-settle/water/waterUnregisteredList',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}

// 查询水表开关阀事件
export function waterQueryWaterOnOffRecord(data) {
  return request({
    url: '/api/ebc-content/water/queryWaterOnOffRecord',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询水表抄表记录
export function waterQueryWaterRecord(data) {
  return request({
    url: '/api/ebc-content/water/queryWaterRecord',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 设备用水统计
export function queryWaterUseStatis(data) {
  return request({
    url: '/api/ebc-content/water/queryWaterUseStatis',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}