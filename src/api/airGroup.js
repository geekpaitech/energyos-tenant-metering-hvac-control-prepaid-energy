import request from '@/utils/request';

// 空调公摊组

// 新增空调公摊组
export function airShareAdd(data) {
  return request({
    url: '/api/ebc-content/airShare/add',
    method: 'post',
    data
  });
}

// 列表查询空调公摊组
export function airShareList(data) {
  return request({
    url: '/api/ebc-content/airShare/list',
    method: 'post',
    data
  });
}

// 修改空调公摊组
export function airShareUpdate(data) {
  return request({
    url: '/api/ebc-content/airShare/update',
    method: 'post',
    data
  });
}

// 删除空调公摊组
export function airShareDelete(query) {
  return request({
    url: '/api/ebc-content/airShare/delete',
    method: 'post',
    params: query
  });
}

// 查询空调公摊组详情
export function airShareGetDetail(query) {
  return request({
    url: '/api/ebc-content/airShare/getAirShareDetail',
    method: 'post',
    params: query
  });
}

// 获取空调公摊组-租户绑定信息
export function airShareGetTenantBindEdit(query) {
  return request({
    url: '/api/ebc-content/airShare/getAirShareTenantBindEdit',
    method: 'post',
    params: query
  });
}

// 空调公摊组-租户绑定/解绑
export function airShareBindTenant(query) {
  return request({
    url: '/api/ebc-content/airShare/bindShareTenant',
    method: 'post',
    params: query
  });
}

// 获取空调公摊组-空调绑定信息
export function airShareGetAirBindEdit(query) {
  return request({
    url: '/api/ebc-content/airShare/getShareAirBindEdit',
    method: 'post',
    params: query
  });
}

// 空调公摊组-空调绑定/解绑
export function airShareBindAir(query) {
  return request({
    url: '/api/ebc-content/airShare/bindShareAir',
    method: 'post',
    params: query
  });
}

// 获取租户的空调公摊组列表
export function airShareGetTenantShareList(query) {
  return request({
    url: '/api/ebc-content/airShare/getTenantAirShareList',
    method: 'post',
    params: query
  });
}

// 获取租户-空调公摊组绑定信息
export function airShareGetTenantShareBindEdit(query) {
  return request({
    url: '/api/ebc-content/airShare/getTenantShareBindEdit',
    method: 'post',
    params: query
  });
}