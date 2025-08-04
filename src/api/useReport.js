import request from '@/utils/request'

// 获取简单租户列表
export function getSimpleTenantList(data) {
  return request({
    url: '/api/ebc-content/useReport/getSimpleTenantList',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: data
  })
}

// 查询租户月能报表统计
export function queryTenantUse(data) {
  return request({
    url: '/api/ebc-content/useReport/queryTenantUse',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 用能报表统计
export function useReportQueryTenantUseStatis(data) {
  return request({
    url: '/api/ebc-content/useReport/queryTenantUseStatis',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

export function queryTenantWaterUseStatis(data) {
  return request({
    url: '/api/ebc-content/useReport/queryTenantWaterUseStatis',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 用水明细
export function queryTenantWaterUse(data) {
  return request({
    url: '/api/ebc-content/useReport/queryTenantWaterUse',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}
