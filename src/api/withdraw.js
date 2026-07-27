// @/api/withdraw.js
import request from '@/utils/request'

// 分页查询审核申报记录
export function capitalPageWithdApplyPassRecord (data) {
  return request({
    url: '/api/ebc-settle/capitalManage/pageWithdApplyPassRecord',
    method: 'post',
    data
  })
}

// 分页查询审核申报记录详情
export function capitalSelectWithdApplyList (params) {
  return request({
    url: '/api/ebc-settle/capitalManage/selectWithdApplyList',
    method: 'post',
    params
  })
}

// 提现汇总
export function capitalWithdAuditSumy (data) {
  return request({
    url: '/api/ebc-content/capital/withdAuditSumy',
    method: 'post',
    data
  })
}

// 费用统计
export function capitalWithdCostStatistics (params) {
  return request({
    url: '/api/ebc-settle/capital/withdCostStatistics',
    method: 'post',
    params
  })
}

// 导出提现申请记录详情
export function capitalExportWithdApplyDetails (data) {
  return request({
    url: '/api/ebc-settle/capital/exportWithdApplyDetails',
    method: 'post',
    data
  })
}

// 查询导出执行结果：导出提现申请记录详情
export function capitalQueryWithdApplyResult (params) {
  return request({
    url: '/api/ebc-settle/capital/queryWithdApplyResult',
    method: 'post',
    params
  })
}

// 提现审核统计导出
export function capitalExportWithdApplyUnified (data) {
  return request({
    url: '/api/ebc-settle/capital/exportWithdApplyUnified',
    method: 'post',
    data
  })
}

// 查询执行结果：导出提现申请租户统一记录
export function capitalQueryWithdApplyUnifiedResult (params) {
  return request({
    url: '/api/ebc-settle/capital/queryWithdApplyUnifiedResult',
    method: 'post',
    params
  })
}

// 提现余额
export function capitalManagerWithdFundDetails (params) {
  return request({
    url: '/api/ebc-settle/capital/managerWithdFundDetails',
    method: 'post',
    params
  })
}

// 获取管理方信息（临时放在这里，实际应该在manager.js中）
export function getManagerById (params) {
  return request({
    url: '/api/ebc-settle/manager/getManagerById',
    method: 'post',
    params
  })
}
