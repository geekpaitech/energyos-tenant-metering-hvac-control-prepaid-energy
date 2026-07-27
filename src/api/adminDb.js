/**
 * 管理后台电表 API（与控制台 meter.js 完全隔离，不走权限）
 */
import request from '@/utils/request'

const headers = {
  userDeviceType: 'PC',
  'Content-Type': 'application/json'
}

function post (url, data) {
  return request({ url, method: 'post', headers, data })
}

function postParams (url, params) {
  return request({ url, method: 'post', headers, params })
}

// —— 电表基础 ——
export function meterPageMeterInfoByAdmin (data) {
  return post('/api/ebc-content/meter/pageMeterInfoByAdmin', data)
}

export function meterPageMeterInfo (data) {
  return post('/api/ebc-content/meter/pageMeterInfo', data)
}

export function meterAddMeter (data) {
  return post('/api/ebc-device/meter/addMeter', data)
}

export function meterUpdataeMeterBase (data) {
  return post('/api/ebc-device/meter/updateMeterBase', data)
}

export function meterReadAndRefreshCt (params) {
  return postParams('/api/ebc-device/meter/readAndRefreshCt', params)
}

export function tenantDoMeterSwitchOffOn (params) {
  return postParams('/api/ebc-device/tenant/doMeterSwitchOffOn', params)
}

export function meteChangeMeterManager (data) {
  return post('/api/ebc-device/meter/changeMeterManager', data)
}

export function meterChargeTest (params) {
  return postParams('/api/ebc-device/meter/chargeTest', params)
}

export function meterZeroBalance (params) {
  return postParams('/api/ebc-device/meter/zeroBalance', params)
}

// —— 客服工作台 / 监控详情 ——
export function customerWorkbenchQueryMeterDetail (params) {
  return request({
    url: '/api/ebc-content/customerWorkbench/queryMeterDetail',
    method: 'post',
    headers: { userDeviceType: 'PC' },
    params
  })
}

export function customerWorkbenchQueryMeterLastDetail (params) {
  return request({
    url: '/api/ebc-content/customerWorkbench/queryMeterLastDetail',
    method: 'post',
    headers: { userDeviceType: 'PC' },
    params
  })
}

// —— 电表生命周期 ——
export function meterLiveGetMeterRecordList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterRecordList', params)
}

export function meterLiveGetMeterBindTypeList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterBindTypeList', params)
}

export function meterLiveGetMeterChargeList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterChargeList', params)
}

export function meterLiveGetMeterEnableList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterEnableList', params)
}

export function meterLiveGetMeterLogicPayTypeList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterLogicPayTypeList', params)
}

export function meterLiveGetMeterOnOffLineList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterOnOffLineList', params)
}

export function meterLiveGetMeterPriceModifyList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterPriceModifyList', params)
}

export function meterLiveGetMeterSettleList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterSettleList', params)
}

export function meterLiveGetMeterSwitchList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterSwitchList', params)
}

export function meterLiveGetMeterBindList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterBindList', params)
}

export function meterLiveGetMeterCreateList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterCreateList', params)
}

export function meterLiveGetMeterHeartbeatList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterHeartbeatList', params)
}

export function meterLiveGetMeterCtList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterCtList', params)
}

export function meterLiveGetMeterBalanceOverZoneList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterBalanceOverZoneList', params)
}

export function meterLiveGetMeterPtList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterPtList', params)
}

export function meterLiveGetMeterPriceRepairList (params) {
  return postParams('/api/ebc-content/meterLive/getMeterPriceRepairList', params)
}

// —— 方案 / 短信 / 月租 ——
export function meterPriceList (data) {
  return post('/api/ebc-device/meterPrice/list', data)
}

export function authSendSmsCode (params) {
  return postParams('/api/ebc-auth/auth/sendSmsCode', params)
}

export function tenantMeterMonthRentSelectTenantMeterMonthRent (params) {
  return postParams('/api/ebc-settle/tenantMeterMonthRent/selectTenantMeterMonthRent', params)
}

// —— 管理后台辅助（项目/租户） ——
export function adminDbGetManagerListByUser () {
  return request({
    url: '/api/ebc-content/manager/getManagerListByUser',
    method: 'post'
  })
}

/** managerId 为 RequestParam，须走 query（与 useReport.js 一致） */
export function adminDbGetSimpleTenantList (params) {
  return postParams('/api/ebc-content/useReport/getSimpleTenantList', params || {})
}

export function userBaseInfoByPhone (data) {
  return post('/api/ebc-auth/user/userBaseInfoByPhone', data)
}

// —— 运维-补单工具 ——
export function settleToolsPageSettleManagerRepair (data) {
  return post('/api/ebc-settle/settleTools/pageSettleManagerRepair', data)
}
export function settleToolsDeleteSettleManagerRepair (params) {
  return postParams('/api/ebc-settle/settleTools/deleteSettleManagerRepair', params)
}
export function settleToolsApplyQueryManagerRepair (params, data) {
  return request({
    url: '/api/ebc-settle/settleTools/applyQueryManagerRepair',
    method: 'post',
    headers,
    params,
    data
  })
}
export function settleToolsApplyQueryTenantPrivate (params) {
  return postParams('/api/ebc-settle/settleTools/applyQueryTenantPrivate', params)
}
export function settleToolsQueryTenantPrivate (params) {
  return postParams('/api/ebc-settle/settleTools/queryTenantPrivate', params)
}
export function settleToolsApplyQueryTenantShare (params) {
  return postParams('/api/ebc-settle/settleTools/applyQueryTenantShare', params)
}
export function settleToolsQueryTenantShare (params) {
  return postParams('/api/ebc-settle/settleTools/queryTenantShare', params)
}
export function settleToolsListTenantPrivateMeter (params) {
  return postParams('/api/ebc-settle/settleTools/listTenantPrivateMeter', params)
}
export function settleToolsAddSettleTenantPrivate (data) {
  return post('/api/ebc-settle/settleTools/addSettleTenantPrivate', data)
}
export function settleToolsListShareRelate (params) {
  return postParams('/api/ebc-settle/settleTools/listShareRelate', params)
}
export function settleToolsAddSettleShare (data) {
  return post('/api/ebc-settle/settleTools/addSettleShare', data)
}

// —— 运维-开放权限 ——
export function webauthList (params) {
  return postParams('/api/ebc-openapi/web/authList', params)
}
export function webAddAuth (data) {
  return post('/api/ebc-openapi/web/addAuth', data)
}
export function webUpdateAuth (data) {
  return post('/api/ebc-openapi/web/updateAuth', data)
}
export function webRemoveAuth (params) {
  return postParams('/api/ebc-openapi/web/removeAuth', params)
}
export function webRandom32 (params) {
  return postParams('/api/ebc-openapi/web/random32', params)
}

// —— 运维-交付监测 ——
export function meterMeterRealDataVerify (params) {
  return postParams('/api/ebc-content/meter/meterRealDataVerify', params)
}

// —— 运维-批量补单详情/编辑/补单 ——
export function settleToolsPageSettleMeterRepair (data) {
  return post('/api/ebc-settle/settleTools/pageSettleMeterRepair', data)
}
export function settleToolsGetSettleManagerRepairById (params) {
  return postParams('/api/ebc-settle/settleTools/getSettleManagerRepairById', params)
}
export function settleToolsCalSettleMeterRepair (data) {
  return post('/api/ebc-settle/settleTools/calSettleMeterRepair', data)
}
export function settleToolsUpdateSettleMeterRepair (data) {
  return post('/api/ebc-settle/settleTools/updateSettleMeterRepair', data)
}
export function settleToolsDoSettleManagerRepair (data) {
  return post('/api/ebc-settle/settleTools/doSettleManagerRepair', data)
}
