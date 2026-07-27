import request from '@/utils/request'

// 租户退款相关接口

// 分页查询提现申请列表
export function pageWithdrawApply (data) {
  return request({
    url: '/api/ebc-settle/capitalManage/pageWithdApply',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 获取提现汇总统计
export function getWithdrawStats (params) {
  return request({
    url: '/api/ebc-settle/financialOver/withdableAmtStats',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取提现分类标签
export function getWithdrawTabs (params) {
  return request({
    url: '/api/ebc-settle/housingContract/isAllShow',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取不可选择记录
export function getNoApplyRecords (params) {
  return request({
    url: '/api/ebc-settle/capitalManage/withdNoApplyRecord',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取选择的提现数据
export function getSelectedWithdrawData (data) {
  return request({
    url: '/api/ebc-settle/capitalManage/selectWithdApply',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 获取提现汇总信息
export function getWithdrawSummary (data) {
  return request({
    url: '/api/ebc-content/capital/withdAuditSumy',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 申请提现
export function applyWithdraw (data) {
  return request({
    url: '/api/ebc-settle/capitalManage/managerWithdApply',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 导出提现明细
export function exportWithdrawDetails (data) {
  return request({
    url: '/api/ebc-content/capital/exportWithdApplyDetails',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询导出结果
export function queryExportResult (params) {
  return request({
    url: '/api/ebc-content/capital/queryWithdApplyResult',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 获取手续费抵用券
export function getVoucherInfo (params) {
  return request({
    url: '/api/ebc-settle/voucher/selectVoucher',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 判断是否可提现
export function checkCanWithdraw (params) {
  return request({
    url: '/api/ebc-content/manager/judgeIsWithd',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 租户退款相关接口

// 租户申请退款
export function tenantRefundApplyTenantRefund (data) {
  return request({
    url: '/api/ebc-settle/tenantRefund/applyTenantRefund',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 财务审核退款打款申请
export function tenantRefundFinanceProcessRefund (data) {
  return request({
    url: '/api/ebc-settle/tenantRefund/financeProcessRefund',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 财务审核租户退款申请
export function tenantRefundFinanceAuditRefund (data) {
  return request({
    url: '/api/ebc-settle/tenantRefund/financeAuditRefund',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 管理方申请租户退款
export function tenantRefundManagerApplyTenantRefund (data) {
  return request({
    url: '/api/ebc-settle/tenantRefund/managerApplyTenantRefund',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 管理方审核租户退款申请
export function tenantRefundManagerProcessRefund (data) {
  return request({
    url: '/api/ebc-settle/tenantRefund/managerProcessRefund',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 分页查询退款申请记录
export function tenantRefundPageRefundRecord (data) {
  return request({
    url: '/api/ebc-settle/tenantRefund/pageTenantRefund',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 退款详情
export function tenantRefundTenantRefundDetails (params) {
  return request({
    url: '/api/ebc-settle/tenantRefund/tenantRefundDetails',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 飞书发送
export function tenantRefundFeiShuSend (params) {
  return request({
    url: '/api/ebc-settle/tenantRefund/feiShuSend',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}
