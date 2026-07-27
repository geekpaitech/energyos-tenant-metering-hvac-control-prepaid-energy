// @/api/tenant.js
import request from '@/utils/request'

// 租户分页查询
export function tenantPageTenant (data) {
  return request({
    url: '/api/ebc-content/tenant/page',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 新增租户
export function tenantAdd (data) {
  return request({
    url: '/api/ebc-content/tenant/add',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改租户
export function tenantUpdate (data) {
  return request({
    url: '/api/ebc-content/tenant/update',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 根据ID查询租户详情
export function tenantGetById (params) {
  return request({
    url: '/api/ebc-content/tenant/getById',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 租户列表查询（不分页）
export function tenantList (data) {
  return request({
    url: '/api/ebc-content/tenant/list',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 注销租户
export function tenantCancel (params) {
  return request({
    url: '/api/ebc-content/tenant/cancel',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}
// 查询租户专用设备数量
export function queryTenantDeviceCount (params) {
  return request({
    url: '/api/ebc-content/meter/queryTenantDeviceCount',
    method: 'POST',
    headers: {
      userDeviceType: 'PC'
    },
    params
  })
}

export function labelBatchBindTenant (data) {
  return request({
    url: '/api/ebc-content/tenant/labelBatchBindTenant',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}
