import request from '@/utils/request'

const defaultHeaders = {
  userDeviceType: 'PC',
  'Content-Type': 'application/json'
}

export const DEMO_MANAGER_ID = '1000165'
export function isDemoManager (managerId) {
  return false
}

export function getTenantStatusList (params) {
  return request({
    url: '/api/ebc-content/overview/tenantStatusList',
    method: 'post',
    params,
    headers: defaultHeaders
  })
}

export function getTenantPList (params) {
  return request({
    url: '/api/ebc-content/overview/tenantPList',
    method: 'post',
    params,
    headers: defaultHeaders
  })
}

export function getMeterOverview (params) {
  return request({
    url: '/api/ebc-content/overview/meterOverview',
    method: 'post',
    params,
    headers: defaultHeaders
  })
}

export function getManagerOwingFee (params) {
  return request({
    url: '/api/ebc-content/overview/managerOwingFee',
    method: 'post',
    params,
    headers: defaultHeaders
  })
}

export function getElecStatistics (params) {
  return request({
    url: '/api/ebc-settle/capitalManage/elecStatistics',
    method: 'post',
    params,
    headers: defaultHeaders
  })
}

/** 用电/水概览 type：1-近七天，2-近半年 */
export function getElecWaterOverview (params) {
  return request({
    url: '/api/ebc-settle/capitalManage/elecWaterOverview',
    method: 'post',
    params,
    headers: defaultHeaders
  })
}

export function tenantSettleStatis (data) {
  return request({
    url: '/api/ebc-settle/capitalManage/tenantSettleStatis',
    method: 'post',
    data,
    headers: defaultHeaders
  })
}

export function tenantRetainStatis (params) {
  return request({
    url: '/api/ebc-settle/capitalManage/tenantRetainStatis',
    method: 'post',
    params,
    headers: defaultHeaders
  })
}

export function queryTenantSankey (data) {
  return request({
    url: '/api/ebc-content/useReport/queryTenantSankey',
    method: 'POST',
    headers: defaultHeaders,
    data
  })
}

export function pageAirInfo (data) {
  return request({
    url: '/api/ebc-content/airInfo/pageAir',
    method: 'post',
    headers: defaultHeaders,
    data
  })
}

export function ebvRecordMonthCompare (data) {
  return request({
    url: '/api/ebc-content/ebvRecord/monthCompare',
    method: 'post',
    data,
    headers: defaultHeaders
  })
}

export function getTenantTopStatistics (data) {
  return request({
    url: '/api/ebc-content/tenant/topStatistics',
    method: 'post',
    data,
    headers: defaultHeaders
  })
}

export function queryCwTenantTodayUse (data) {
  return request({
    url: '/api/ebc-content/customerWorkbench/queryCwTenantTodayUse',
    method: 'post',
    data,
    headers: defaultHeaders
  })
}

export function getTenantFeeComposition (data) {
  return request({
    url: '/api/ebc-content/tenant/feeComposition',
    method: 'post',
    data,
    headers: defaultHeaders
  })
}

/** 首页-租户/公区能耗拆分（与经开大屏共用接口，但独立调用） */
export function getDashboardEnergyManagement (data) {
  return request({
    url: '/api/ebc-content/propertyScreen/getEnergyManagement',
    method: 'post',
    data,
    headers: defaultHeaders
  })
}
