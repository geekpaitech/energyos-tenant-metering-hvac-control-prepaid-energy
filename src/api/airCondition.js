// @/api/airCondition.js
import request from '@/utils/request'

// ============ 空调信息管理接口 ============

// 分页查询空调
export function airInfoPageAir (query) {
  return request({
    url: '/api/ebc-content/airInfo/pageAir',
    method: 'post',
    data: query
  })
}

// 控制空调
export function airInfoControlAir (query) {
  return request({
    url: '/api/ebc-content/airInfo/controlAir',
    method: 'post',
    data: query
  })
}

// 获取空调
export function airInfoBatchBindAirInfo (query) {
  return request({
    url: '/api/ebc-content/airInfo/batchBindAirInfo',
    method: 'post',
    params: query
  })
}

// 批量锁定空调
export function airInfoBathcLockAir (query) {
  return request({
    url: '/api/ebc-content/airInfo/bathcLockAir',
    method: 'post',
    data: query
  })
}

// 批量控制空调
export function airInfoBatchBindAir (query) {
  return request({
    url: '/api/ebc-content/airInfo/batchBindAir',
    method: 'post',
    data: query
  })
}

// 空调绑定（解绑）租户-专用
export function airInfoBindTenantAir (query) {
  return request({
    url: '/api/ebc-content/airInfo/bindTenantAir',
    method: 'post',
    params: query
  })
}

// 创建空调
export function airInfoCreateAir (query) {
  return request({
    url: '/api/ebc-content/airInfo/createAir',
    method: 'post',
    data: query
  })
}

// 删除空调
export function airInfoDelete (query) {
  return request({
    url: '/api/ebc-content/airInfo/delete',
    method: 'post',
    params: query
  })
}

// 获取租户-空调绑定信息
export function airInfoGetTenantAirBindEdit (query) {
  return request({
    url: '/api/ebc-content/airInfo/getTenantAirBindEdit',
    method: 'post',
    params: query
  })
}

// 锁定空调
export function airInfoLockAir (query) {
  return request({
    url: '/api/ebc-content/airInfo/lockAir',
    method: 'post',
    data: query
  })
}

// 修改空调
export function airInfoUpdateAir (query) {
  return request({
    url: '/api/ebc-content/airInfo/updateAir',
    method: 'post',
    data: query
  })
}

// 批量设置计费方式
export function airInfoUpdateBillingMode (query) {
  return request({
    url: '/api/ebc-content/airInfo/updateBillingMode',
    method: 'post',
    data: query
  })
}

// 根据id查询空调
export function airInfoGetAirById (query) {
  return request({
    url: '/api/ebc-content/airInfo/getAirById',
    method: 'post',
    params: query
  })
}

// 查询空调设备用能统计
export function airInfoQueryAirUseStatis (query) {
  return request({
    url: '/api/ebc-content/airInfo/queryAirUseStatis',
    method: 'post',
    data: query
  })
}

// 查询空调设备列表
export function airInfoListAirInfo (query) {
  return request({
    url: '/api/ebc-content/airInfo/listAirInfo',
    method: 'post',
    params: query
  })
}

// 分页查询空调面板逐日累计用量
export function airInfoPageAirAccumulateUse (query) {
  return request({
    url: '/api/ebc-content/airInfo/pageAirAccumulateUse',
    method: 'post',
    data: query
  })
}

// ============ 空调控制日志接口 ============

// 分页查询空调控制日志
export function airControlLogPageAirGateWay (query) {
  return request({
    url: '/api/ebc-content/airControlLog/pageAirGateWay',
    method: 'post',
    data: query
  })
}

// ============ 空调网关接口 ============

// 创建空调网关
export function airGatewayCreateAirGateway (query) {
  return request({
    url: '/api/ebc-content/airGateway/createAirGateway',
    method: 'post',
    data: query
  })
}

// 删除空调网关
export function airGatewayDelete (query) {
  return request({
    url: '/api/ebc-content/airGateway/delete',
    method: 'post',
    params: query
  })
}

// 查询网关列表
export function airGatewayListAirGateWay (query) {
  return request({
    url: '/api/ebc-content/airGateway/listAirGateWay',
    method: 'post',
    params: query
  })
}

// 分页查询空调网关 外机
export function pageAirGateWay (data) {
  return request({
    url: '/api/ebc-content/airGateway/pageAirGateWay',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改空调网关
export function airGatewayUpdateAirGateway (query) {
  return request({
    url: '/api/ebc-content/airGateway/updateAirGateway',
    method: 'post',
    data: query
  })
}

// 批量绑定空调网关计费方案
export function airGatewayBatchBindPriceAirGateway (query) {
  return request({
    url: '/api/ebc-content/airGateway/batchBindPriceAirGateway',
    method: 'post',
    data: query
  })
}

// ============ 空调定时任务接口 ============

// 分页查询空调定时
export function airScheduledTaskPageAirScheduledTask (query) {
  return request({
    url: '/api/ebc-content/airScheduledTask/pageAirScheduledTask',
    method: 'post',
    data: query
  })
}

// 创建空调定时
export function airScheduledTaskAddAirScheduledTasks (query) {
  return request({
    url: '/api/ebc-content/airScheduledTask/addAirScheduledTasks',
    method: 'post',
    data: query
  })
}

// 删除空调定时
export function airScheduledTaskDelete (query) {
  return request({
    url: '/api/ebc-content/airScheduledTask/delete',
    method: 'post',
    params: query
  })
}

// 根据id查询空调定时
export function airScheduledTaskGetAirScheduledTaskById (query) {
  return request({
    url: '/api/ebc-content/airScheduledTask/getAirScheduledTaskById',
    method: 'post',
    params: query
  })
}

// 查询空调列表
export function airScheduledTaskListAirInfoByIds (query) {
  return request({
    url: '/api/ebc-content/airScheduledTask/listAirInfoByIds',
    method: 'post',
    params: query
  })
}

// 任务开关控制
export function airScheduledTaskUpdateEnabled (query) {
  return request({
    url: '/api/ebc-content/airScheduledTask/updateEnabled',
    method: 'post',
    params: query
  })
}

// 修改空调定时
export function airScheduledTaskEditAirScheduledTasks (query) {
  return request({
    url: '/api/ebc-content/airScheduledTask/editAirScheduledTasks',
    method: 'post',
    data: query
  })
}
// 查询空调电表
export function listAirMeterInfo (query) {
  return request({
    url: '/api/ebc-content/meter/listAirMeterInfo',
    method: 'post',
    params: query
  })
}
