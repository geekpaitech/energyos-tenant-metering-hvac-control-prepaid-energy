import request from '@/utils/request'

// 水表公摊组

// 新增水表公摊组
export function waterShareAdd (data) {
  return request({
    url: '/api/ebc-content/waterShare/add',
    method: 'post',
    data
  })
}

// 列表查询水表公摊组
export function waterShareList (data) {
  return request({
    url: '/api/ebc-content/waterShare/list',
    method: 'post',
    data
  })
}

// 修改水表公摊组
export function waterShareUpdate (data) {
  return request({
    url: '/api/ebc-content/waterShare/update',
    method: 'post',
    data
  })
}

// 删除水表公摊组
export function waterShareDelete (query) {
  return request({
    url: '/api/ebc-content/waterShare/delete',
    method: 'post',
    params: query
  })
}

// 查询水表公摊组详情
export function waterShareGetShareDetail (query) {
  return request({
    url: '/api/ebc-content/waterShare/getShareDetail',
    method: 'post',
    params: query
  })
}

// 获取水表公摊组-租户绑定信息
export function waterShareGetShareTenantBindEdit (query) {
  return request({
    url: '/api/ebc-content/waterShare/getShareTenantBindEdit',
    method: 'post',
    params: query
  })
}

// 水表公摊组-租户绑定/解绑
export function waterShareBindShareTenantdata (query) {
  return request({
    url: '/api/ebc-content/waterShare/bindShareTenant',
    method: 'post',
    params: query
  })
}

// 获取水表公摊组-水表绑定信息
export function waterShareGetShareWaterBindEdit (query) {
  return request({
    url: '/api/ebc-content/waterShare/getShareWaterBindEdit',
    method: 'post',
    params: query
  })
}

// 水表公摊组-水表绑定/解绑
export function waterShareBindShareWater (query) {
  return request({
    url: '/api/ebc-content/waterShare/bindShareWater',
    method: 'post',
    params: query
  })
}

// 获取租户的水表公摊组列表
export function waterShareGetTenantShareList (query) {
  return request({
    url: '/api/ebc-content/waterShare/getTenantShareList',
    method: 'post',
    params: query
  })
}

// 获取租户-水表公摊组绑定信息
export function waterShareGetTenantShareBindEdit (query) {
  return request({
    url: '/api/ebc-content/waterShare/getTenantShareBindEdit',
    method: 'post',
    params: query
  })
}

// 水表公摊组扣款
export function waterShareDeduction (query) {
  return request({
    url: '/api/ebc-content/waterShare/waterShareDeduction',
    method: 'post',
    params: query
  })
}

// 公摊日结列表
export function waterSharePageSettleShare (data) {
  return request({
    url: '/api/ebc-content/waterShare/pageWaterSettleShare',
    method: 'post',
    data
  })
}

// 公摊日结详情
export function waterShareGetSettleShareDetail (query) {
  return request({
    url: '/api/ebc-content/waterShare/getWaterSettleShareDetail',
    method: 'post',
    params: query
  })
}
