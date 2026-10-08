import request from '@/utils/request'

// ===== 推文发布 publishArticle =====

// 新增推文
export function publishArticleAddPublishArticle (query) {
  return request({
    url: '/api/ebc-content/publishArticle/addPublishArticle',
    method: 'post',
    data: query
  })
}

// 删除推文
export function publishArticleDeletePublishArticle (query) {
  return request({
    url: '/api/ebc-content/publishArticle/deletePublishArticle',
    method: 'post',
    params: query
  })
}

// 分页查询推文
export function publishArticlePagePublishArticle (query) {
  return request({
    url: '/api/ebc-content/publishArticle/pagePublishArticle',
    method: 'post',
    data: query
  })
}

// 修改推文
export function publishArticleUpdatePublishArticle (query) {
  return request({
    url: '/api/ebc-content/publishArticle/updatePublishArticle',
    method: 'post',
    data: query
  })
}

// 修改发布状态
export function publishArticleUpdateShowStatus (query) {
  return request({
    url: '/api/ebc-content/publishArticle/updateShowStatus',
    method: 'post',
    params: query
  })
}

// ===== 消息推送服务 msg =====

// 查询消息类型-名称枚举
export function msgQueryMsgCodeName (query) {
  return request({
    url: '/api/ebc-push/msg/queryMsgCodeName',
    method: 'post',
    params: query
  })
}

// 查询消息配置列表
export function msgListMsgConfig () {
  return request({
    url: '/api/ebc-push/msg/listMsgConfig',
    method: 'post'
  })
}

// 修改消息配置
export function msgUpdateMsgConfig (query) {
  return request({
    url: '/api/ebc-push/msg/updateMsgConfig',
    method: 'post',
    data: query
  })
}

// 查询消息屏蔽账号
export function msgGetMsgFilterUser (query) {
  return request({
    url: '/api/ebc-push/msg/getMsgFilterUser',
    method: 'post',
    params: query
  })
}

// 查询平台所有账户信息
export function msgGetUserList (query) {
  return request({
    url: '/api/ebc-push/msg/getUserList',
    method: 'post',
    params: query
  })
}

// 更新消息屏蔽账号
export function msgUpdateMsgFilterUser (code, query) {
  return request({
    url: `/api/ebc-push/msg/updateMsgFilterUser?code=${code}`,
    method: 'post',
    data: query
  })
}

// 分页查询消息记录
export function msgPageMsg (query) {
  return request({
    url: '/api/ebc-push/msg/pageMsg',
    method: 'post',
    data: query
  })
}

// 分页消息详情
export function msgQueryMsgDetail (query) {
  return request({
    url: '/api/ebc-push/msg/queryMsgDetail',
    method: 'post',
    params: query
  })
}

// 消息推送
export function msgPush (query) {
  return request({
    url: '/api/ebc-push/msg/push',
    method: 'post',
    data: query
  })
}

// 事件处理状态更新
export function msgUpdateDealStatus (query) {
  return request({
    url: '/api/ebc-push/msg/updateDealStatus',
    method: 'post',
    data: query
  })
}

// 查询消息类型数量
export function msgQueryMsgTypeCount (query) {
  return request({
    url: '/api/ebc-push/msg/queryMsgTypeCount',
    method: 'post',
    params: query
  })
}

// 分页查询消息记录（管理方控制台使用）
export function msgPageMsgByManager (query) {
  return request({
    url: '/api/ebc-push/msg/pageMsgByManager',
    method: 'post',
    data: query
  })
}

// 查询消息 code 数量
export function msgQueryMsgCodeCount (query) {
  return request({
    url: '/api/ebc-push/msg/queryMsgCodeCount',
    method: 'post',
    params: query
  })
}

// ===== 消息详情明细 msgDetail =====

// 电表余额大于零明细（code：110）
export function msgDetailBalanceOver0Detail (query) {
  return request({
    url: '/api/ebc-content/msgDetail/balanceOver0Detail',
    method: 'post',
    data: query
  })
}

// 用电量与金额不匹配明细（code：113）
export function msgDetailElecBalanceUnequalDetail (query) {
  return request({
    url: '/api/ebc-content/msgDetail/elecBalanceUnequalDetail',
    method: 'post',
    data: query
  })
}

// 电表结算下发失败明细（code：107）
export function msgDetailMeterSettleChargeFailDetail (query) {
  return request({
    url: '/api/ebc-content/msgDetail/meterSettleChargeFailDetail',
    method: 'post',
    data: query
  })
}

// 电表假失败结算处理明细（code：114）
export function msgDetailMeterSettleFailRepairDetail (query) {
  return request({
    url: '/api/ebc-content/msgDetail/meterSettleFailRepairDetail',
    method: 'post',
    data: query
  })
}

// 电表仅结算平电量检测明细（code：116）
export function msgDetailMeterSettleFlatDetail (query) {
  return request({
    url: '/api/ebc-content/msgDetail/meterSettleFlatDetail',
    method: 'post',
    data: query
  })
}

// 三相功率和不一致明细（code：111）
export function msgDetailSumUnequalDetail (query) {
  return request({
    url: '/api/ebc-content/msgDetail/sumUnequalDetail',
    method: 'post',
    data: query
  })
}

// 公摊组结算异常明细（负金额）（code：140）
export function msgDetailShareSettleErrorDetail (query) {
  return request({
    url: '/api/ebc-content/msgDetail/shareSettleErrorDetail',
    method: 'post',
    data: query
  })
}
