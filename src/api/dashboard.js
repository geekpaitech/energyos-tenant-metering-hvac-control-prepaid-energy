import request from '@/utils/request'

// 获取租户用能排名
export function getTenantMonthUseRank (params) {
  return request({
    url: '/api/ebc-content/overview/tenantMonthUseRank',
    method: 'post',
    params,
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    }
  })
}

// 获取管理方用能列表（趋势数据）
export function getManagerUseList (params) {
  return request({
    url: '/api/ebc-content/overview/managerUseList',
    method: 'post',
    params,
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    }
  })
}

// 查询租户用能详情（对比数据）
export function queryTenantUse (data) {
  return request({
    url: '/api/ebc-content/useReport/queryTenantUse',
    method: 'post',
    data,
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    }
  })
}

// 获取租户状态列表（欠费排名）
export function getTenantStatusList (params) {
  return request({
    url: '/api/ebc-content/overview/tenantStatusList',
    method: 'post',
    params,
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    }
  })
}
export function getTenantPList (params) {
  return request({
    url: '/api/ebc-content/overview/tenantPList',
    method: 'post',
    params,
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    }
  })
}
export function getMeterOverview (params) {
  return request({
    url: '/api/ebc-content/overview/meterOverview',
    method: 'post',
    params,
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    }
  })
}
export function getElecStatistics (params) {
  return request({
    url: '/api/ebc-settle/capitalManage/elecStatistics',
    method: 'post',
    params,
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    }
  })
}
