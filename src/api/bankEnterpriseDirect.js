import request from '@/utils/request'

/**
 * 银企直连 / 浦发未处理充值流水相关接口
 * 与 anjineng-ui-ebc `src/api/pufa.js`、`src/api/zsyh.js` 路径对齐，统一加 `/api` 前缀
 */

/** 分页查询未处理充值流水（租户充值 type=0，月租充值 type=1） */
export function pufaPageRechangeNohandle (data) {
  return request({
    url: '/api/ebc-settle/pufa/pageRechangeNohandle',
    method: 'post',
    data
  })
}

/** 更新流水状态（作废、确认退款等） */
export function pufaUpdateRechangeNohandleStatus (params) {
  return request({
    url: '/api/ebc-settle/pufa/updateRechangeNohandleStatus',
    method: 'post',
    params
  })
}

/** 租户充值：处理流水，绑定租户 */
export function pufaHandleRechangeStatus (params) {
  return request({
    url: '/api/ebc-settle/pufa/handleRechangeStatus',
    method: 'post',
    params
  })
}

/** 根据汇款户名+账号拉取可匹配租户列表 */
export function pufaBankNumTenantList (params) {
  return request({
    url: '/api/ebc-settle/pufa/bankNumTenantList',
    method: 'post',
    params
  })
}

/** 中国银行交易记录（银企相关能力保留） */
export function zgyhGetTradeRecord (params) {
  return request({
    url: '/api/ebc-settle/zgyh/getTradeRecord',
    method: 'post',
    params
  })
}

/** 发起飞书退款审批 */
export function pufaFeiShuSend (params) {
  return request({
    url: '/api/ebc-settle/pufa/feiShuSend',
    method: 'post',
    params
  })
}

/** 银企直连申请退款 */
export function pufaApplyForRefund (params) {
  return request({
    url: '/api/ebc-settle/pufa/applyForRefund',
    method: 'post',
    params
  })
}

/** 月租充值：处理流水，绑定项目 */
export function zsyhHandleMonthRentRechangeStatus (params) {
  return request({
    url: '/api/ebc-settle/zsyh/handleMonthRentRechangeStatus',
    method: 'post',
    params
  })
}
