import request from '@/utils/request'

// 查询管理方层级集合
export function tierSelectTenantTierList(params) {
  return request({
    url: '/api/ebc-settle/tier/selectTenantTierList',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 未绑定的租户集合
export function tierNoBindTenantlist(params) {
  return request({
    url: '/api/ebc-content/tenant/noBindTenantlist',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 新增层级
export function tierAddTenantTier(data) {
  return request({
    url: '/api/ebc-settle/tier/addTenantTier',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 绑定租户
export function tierBindTenantTier(data) {
  return request({
    url: '/api/ebc-settle/tier/bindTenantTier',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 解绑租户
export function tierUnbundleTenantTier(data) {
  return request({
    url: '/api/ebc-settle/tier/unbundleTenantTier',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改层级
export function tierUpdateTenantTier(data) {
  return request({
    url: '/api/ebc-settle/tier/updateTenantTier',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 删除层级
export function tierDeleteTenantTier(params) {
  return request({
    url: '/api/ebc-settle/tier/deleteTenantTier',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取以下子集
export function tierGetTenantTierListById(params) {
  return request({
    url: '/api/ebc-settle/tier/getTenantTierListById',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取下一级层级
export function tierGetNextLevel(params) {
  return request({
    url: '/api/ebc-settle/tier/getNextLevel',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取选中层级下的所有租户id集合
export function tierGetTenantIdListByTierId(params) {
  return request({
    url: '/api/ebc-settle/tier/getTenantIdListByTierId',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}