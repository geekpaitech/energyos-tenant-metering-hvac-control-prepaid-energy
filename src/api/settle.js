import request from '@/utils/request'

// 结算相关服务

// 根据id查询租户每日账单
export function settleGetTenantDailyBill(data) {
  return request({
    url: '/api/ebc-settle/settle/getSettleTenant',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: data
  })
}

// 获取租户账单算账单明细
export function settleListTenantPrivateSettleDetail(query) {
  return request({
    url: '/api/ebc-settle/settle/listTenantPrivateSettleDetail',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: query
  })
}

// 分页查询租户每日账单
export function settlePageTenantDailyBill(data) {
  return request({
    url: '/api/ebc-settle/settle/pageSettleTenant',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 分页查询租户每日账单统计
export function settleTenantSettleStatistics(data) {
  return request({
    url: '/api/ebc-settle/settle/tenantSettleStatistics',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 获取租户实时信息
export function settleGetCurrentData(data) {
  return request({
    url: '/api/ebc-settle/settle/getTenantCurrentUse',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: data
  })
}

// 绑定公摊组-电表列表
export function listTenantPublicSettleDetail(query) {
  return request({
    url: '/api/ebc-settle/settle/listTenantPublicSettleDetail',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: query
  })
}

// 虚拟设备账单详情
export function settleListTenantVirdevSettleDetail(query) {
  return request({
    url: '/api/ebc-settle/settle/listTenantVirdevSettleDetail',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: query
  })
}

// 列表查询租户每日账单
export function settleQuerySettleTenant(query) {
  return request({
    url: '/api/ebc-settle/settle/querySettleTenant',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data: query
  })
}

// 租户账单统计
export function settleSettleTenantStatistics(query) {
  return request({
    url: '/api/ebc-settle/settle/settleTenantStatistics',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data: query
  })
}

// 租户手动结算-执行
export function settleHandSettleDo(query) {
  return request({
    url: '/api/ebc-settle/settle/handSettleDo',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: query
  })
}

// 租户账单统计
export function settleHandSettlePreview(query) {
  return request({
    url: '/api/ebc-settle/settle/handSettlePreview',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: query
  })
}

// 电表服务费详情
export function settleListTenantSettleDetail(query) {
  return request({
    url: '/api/ebc-settle/settle/listTenantSettleDetail',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: query
  })
}