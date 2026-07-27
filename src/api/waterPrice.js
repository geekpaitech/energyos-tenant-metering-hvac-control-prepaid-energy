import request from '@/utils/request'

// 水表价格方案相关接口

// 新增价格方案
export function waterPriceAddPrice (data) {
  return request({
    url: '/api/ebc-content/waterPrice/addPrice',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 设置方案启动状态
export function waterPriceChangeEnableStatus (params) {
  return request({
    url: '/api/ebc-content/waterPrice/changeEnableStatus',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 列表查询价格方案
export function waterPriceListPrice (data) {
  return request({
    url: '/api/ebc-content/waterPrice/listPrice',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改价格方案
export function waterPriceUpdatePrice (data) {
  return request({
    url: '/api/ebc-content/waterPrice/updatePrice',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 批量绑定价格方案
export function waterPriceBatchBindWater (data) {
  return request({
    url: '/api/ebc-content/waterPrice/batchBindWater',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 获取批量绑定信息
export function waterPriceQueryWaterPriceBind (params) {
  return request({
    url: '/api/ebc-content/waterPrice/queryWaterPriceBind',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

export function waterQueryWaterRecord (data) {
  return request({
    url: '/api/ebc-content/water/queryWaterRecord',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}
