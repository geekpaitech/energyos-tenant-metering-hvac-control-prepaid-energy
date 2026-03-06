import request from '@/utils/request'

// ============ 对公充值相关接口 ============

/**
 * 分页查询租户充值记录（对公充值）
 */
export function capitalManagePageTenantRecord(query) {
  return request({
    url: '/api/ebc-settle/capitalManage/pageTenantRecord',
    method: 'post',
    data: query
  })
}

/**
 * 对公充值
 */
export function payPublicTransfers(query) {
  return request({
    url: '/api/ebc-settle/pay/publicTransfers',
    method: 'post',
    data: query
  })
}

/**
 * 根据ID查询项目详情
 */
export function getManagerById(query) {
  return request({
    url: '/api/ebc-content/manager/getManagerById',
    method: 'post',
    params: query
  })
}

/**
 * 获取简单租户列表（正确的接口）
 */
export function getSimpleTenantList(query) {
  return request({
    url: '/api/ebc-content/useReport/getSimpleTenantList',
    method: 'post',
    params: query
  })
}