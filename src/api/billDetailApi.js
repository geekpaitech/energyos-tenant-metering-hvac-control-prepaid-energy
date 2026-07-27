import request from '@/utils/request'

// ==================== 详情页面专用 API ====================

// 根据id查询租户每日账单基本信息
export function settleGetTenantDailyBill (params) {
  return request({
    url: '/api/ebc-settle/settle/getSettleTenant',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取租户账单专用电表明细
export function settleListTenantPrivateSettleDetail (params) {
  return request({
    url: '/api/ebc-settle/settle/listTenantPrivateSettleDetail',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取租户账单公摊电表明细
export function listTenantPublicSettleDetail (params) {
  return request({
    url: '/api/ebc-settle/settle/listTenantPublicSettleDetail',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取电表服务费详情
export function settleListTenantSettleDetail (params) {
  return request({
    url: '/api/ebc-settle/settle/listTenantSettleDetail',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取租户日结算账单明细（空调专用表）
export function settleListTenantAirPrivateSettleDetail (params) {
  return request({
    url: '/api/ebc-settle/settle/listTenantAirPrivateSettleDetail',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取租户日结算账单明细（空调公摊）
export function settleListTenantAirPublicSettleDetail (params) {
  return request({
    url: '/api/ebc-settle/settle/listTenantAirPublicSettleDetail',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取租户水费结算详情
export function waterGetTenantWaterSettleDetail (params) {
  return request({
    url: '/api/ebc-content/water/getTenantWaterSettleDetail',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 查询浮动电价详情
export function floatQueryFloatDetail (params) {
  return request({
    url: '/api/ebc-settle/float/queryFloatDetail',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}
