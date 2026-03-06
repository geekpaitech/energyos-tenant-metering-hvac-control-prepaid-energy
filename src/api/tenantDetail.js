import request from '@/utils/request'

/**
 * 获取租户专用电表列表
 */
export function getTenantElectricMeters(data) {
  return request({
    url: '/api/ebc-content/meter/pageMeterInfo',
    method: 'post',
    data,
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 获取租户电表绑定编辑数据
 */
export function getTenantMeterBindEdit(params) {
  return request({
    url: '/api/ebc-content/meter/getTenantMeterBindEdit',
    method: 'post',
    params
  })
}

/**
 * 绑定/解绑租户电表
 */
export function bindTenantMeter(params) {
  return request({
    url: '/api/ebc-device/meter/bindTenantMeter',
    method: 'post',
    params
  })
}

/**
 * 获取租户电表公摊组列表
 */
export function getTenantElectricGroups(params) {
  return request({
    url: '/api/ebc-content/share/getTenantShareList',
    method: 'post',
    params
  })
}

/**
 * 获取租户公摊组绑定编辑数据
 */
export function getTenantShareBindEdit(params) {
  return request({
    url: '/api/ebc-content/share/getTenantShareBindEdit',
    method: 'post',
    params
  })
}

/**
 * 绑定/解绑租户公摊组
 */
export function bindShareTenant(params) {
  return request({
    url: '/api/ebc-content/share/bindShareTenant',
    method: 'post',
    params
  })
}

/**
 * 获取租户专用水表列表
 */
export function getTenantWaterMeters(params) {
  return request({
    url: '/api/ebc-content/water/getTenantWaterBindEdit',
    method: 'post',
    params
  })
}

/**
 * 获取租户水表绑定编辑数据
 */
export function getTenantWaterBindEdit(params) {
  return request({
    url: '/api/ebc-content/water/getTenantWaterBindEdit',
    method: 'post',
    params
  })
}

/**
 * 绑定/解绑租户水表
 */
export function bindTenantWater(params) {
  return request({
    url: '/api/ebc-content/water/bindTenantWater',
    method: 'post',
    params
  })
}

/**
 * 获取租户水表公摊组列表
 */
export function getTenantWaterGroups(params) {
  return request({
    url: '/api/ebc-content/waterShare/getTenantShareList',
    method: 'post',
    params
  })
}

/**
 * 获取租户水表公摊组绑定编辑数据
 */
export function getTenantWaterShareBindEdit(params) {
  return request({
    url: '/api/ebc-content/waterShare/getTenantShareBindEdit',
    method: 'post',
    params
  })
}

/**
 * 绑定/解绑租户水表公摊组
 */
export function bindWaterShareTenant(params) {
  return request({
    url: '/api/ebc-content/waterShare/bindShareTenant',
    method: 'post',
    params
  })
}

// ==================== 空调相关接口 ====================

/**
 * 获取租户专用空调列表
 * @param {Object} data - { bindId, bindType: 1, managerId, page }
 */
export function getTenantAirConditioners(data) {
  return request({
    url: '/api/ebc-content/airInfo/pageAir',
    method: 'post',
    data,
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 获取租户空调绑定编辑数据
 * @param {Object} params - { managerId, tenantId }
 */
export function getTenantAirBindEdit(params) {
  return request({
    url: '/api/ebc-content/airInfo/getTenantAirBindEdit',
    method: 'post',
    params
  })
}

/**
 * 绑定/解绑租户空调
 * @param {Object} params - { airId, tenantId, type: 'bind'/'unbind' }
 */
export function bindTenantAir(params) {
  return request({
    url: '/api/ebc-content/airInfo/bindTenantAir',
    method: 'post',
    params
  })
}

/**
 * 获取租户空调公摊组列表
 * @param {Object} params - { tenantId }
 */
export function getTenantAirShareGroups(params) {
  return request({
    url: '/api/ebc-content/airShare/getTenantAirShareList',
    method: 'post',
    params
  })
}

/**
 * 获取租户空调公摊组绑定编辑数据
 * @param {Object} params - { managerId, tenantId }
 */
export function getTenantAirShareBindEdit(params) {
  return request({
    url: '/api/ebc-content/airShare/getTenantShareBindEdit',
    method: 'post',
    params
  })
}

/**
 * 绑定/解绑租户空调公摊组
 * @param {Object} params - { tenantId, managerId, type, area, shareType, shareId }
 */
export function bindAirShareTenant(params) {
  return request({
    url: '/api/ebc-content/airShare/bindShareTenant',
    method: 'post',
    params
  })
}

// ==================== 账单相关接口 ====================

/**
 * 获取账单列表
 */
export function getBillList(data) {
  return request({
    url: '/api/ebc-settle/settle/pageSettleTenant',
    method: 'post',
    data,
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 获取账单统计
 */
export function getBillStatistics(data) {
  return request({
    url: '/api/ebc-settle/settle/settleTenantStatisti',
    method: 'post',
    data,
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 获取流水列表
 */
export function getTurnoverList(data) {
  return request({
    url: '/api/ebc-settle/capitalManage/pageTenantTurnover',
    method: 'post',
    data,
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}

// ==================== 数据统计相关接口 ====================

/**
 * 获取租户电表用量统计列表
 * @param {Object} data - { tenantId, useType(2:日/3:月), startDate, endDate }
 */
export function getTenantEachMeterUseList(data) {
  return request({
    url: '/api/ebc-content/tenant/getTenantEachMeterUseList',
    method: 'post',
    data,
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 获取租户水表用量统计列表
 * @param {Object} data - { tenantId, useType(0:日/5:月), startDate, endDate }
 */
export function getTenantEachWaterUseList(data) {
  return request({
    url: '/api/ebc-content/tenant/getTenantEachWaterUseList',
    method: 'post',
    data,
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}
/**
 * 获取资金流水查看
 * @param {Object} data - { tenantId, useType(0:日/5:月), startDate, endDate }
 */
export function selectDiscRealTurnoverList(params) {
  return request({
    url: '/api/ebc-content/disc_real_turnover/selectDiscRealTurnoverList',
    method: 'post',
    params
  })
}



