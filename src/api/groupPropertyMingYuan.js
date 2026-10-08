import request from '@/utils/request'
import store from '@/store'
import Cookies from 'js-cookie'

const BASE = '/api/ebc-content/propertyScreen/mingYuan'

function buildHeaders () {
  const rawToken = Cookies.get('Admin-Token') || store.getters.token || ''
  const authorization = rawToken
    ? (String(rawToken).startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`)
    : ''

  return {
    userDeviceType: 'PC',
    'Content-Type': 'application/json',
    authorization,
    'Authorization-UserId': store.state.user.userId,
    'Authorization-UserRole': store.getters.role || (store.getters.roles && store.getters.roles[0]) || ''
  }
}

function postMingYuan (path, data) {
  return request({
    url: `${BASE}/${path}`,
    method: 'post',
    headers: buildHeaders(),
    data,
    skipErrorMessage: true,
    timeout: 60000
  })
}

export const getInspectionOrderClosedLoopRate = data => postMingYuan('getInspectionOrderClosedLoopRate', data)
export const getInspectionOrderClosedLoopRateDetail = data => postMingYuan('getInspectionOrderClosedLoopRateDetail', data)
export const getMaintenancePlanCompletionRate = data => postMingYuan('getMaintenancePlanCompletionRate', data)
export const getMaintenanceTaskDetail = data => postMingYuan('getMaintenanceTaskDetail', data)
export const getMaterialCategoryValueRatio = data => postMingYuan('getMaterialCategoryValueRatio', data)
export const getMaterialTotalInfo = data => postMingYuan('getMaterialTotalInfo', data)
export const getProjectMaterialValueDetail = data => postMingYuan('getProjectMaterialValueDetail', data)
export const getProjectMonthlyScoreRank = data => postMingYuan('getProjectMonthlyScoreRank', data)
export const getProviderEvaluation = data => postMingYuan('getProviderEvaluation', data)
export const getServiceWorkOrderCompletionRate = data => postMingYuan('getServiceWorkOrderCompletionRate', data)
export const getServiceWorkOrderDetail = data => postMingYuan('getServiceWorkOrderDetail', data)
export const getServiceWorkOrderPendingRectificationDetail = data => postMingYuan('getServiceWorkOrderPendingRectificationDetail', data)
export const getServiceWorkOrderRectificationTrace = data => postMingYuan('getServiceWorkOrderRectificationTrace', data)
export const getServiceWorkOrderSatisfactionDetail = data => postMingYuan('getServiceWorkOrderSatisfactionDetail', data)
export const getServiceWorkOrderTypeTotal = data => postMingYuan('getServiceWorkOrderTypeTotal', data)
export const getTenantServiceSatisfactionRate = data => postMingYuan('getTenantServiceSatisfactionRate', data)
export const getUnrectifiedHazardCount = data => postMingYuan('getUnrectifiedHazardCount', data)
export const getUnrectifiedHazardDetail = data => postMingYuan('getUnrectifiedHazardDetail', data)
export const getVideoAiRiskControl = data => postMingYuan('getVideoAiRiskControl', data)
export const getVideoAiRiskControlWorkOrderDetail = data => postMingYuan('getVideoAiRiskControlWorkOrderDetail', data)

function unwrap (response, message = '明源物业数据请求失败') {
  if (!response || Number(response.code) !== 200) {
    throw new Error((response && (response.msg || response.error)) || message)
  }
  return response.data || {}
}

function numberOrNull (value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function valueOr (value, fallback) {
  return value == null ? fallback : value
}

function mapPage (data, mapper) {
  const items = Array.isArray(data.items) ? data.items.map(mapper).filter(Boolean) : []
  return {
    total: valueOr(numberOrNull(data.total), 0),
    pageIndex: valueOr(numberOrNull(data.pageIndex), 0),
    pageSize: valueOr(numberOrNull(data.pageSize), 10),
    pages: valueOr(numberOrNull(data.pages), 0),
    items
  }
}

export async function queryProviderEvaluationDetails (params) {
  const data = unwrap(await getProviderEvaluation(params), '供应商评价请求失败')
  return mapPage(data, (item, index) => ({
    id: item.providerEvaluationGUID || item.providerGUID || `provider-${index}`,
    providerId: item.providerGUID || '',
    name: item.providerName || '--',
    type: item.providerTypeNames || '--',
    score: numberOrNull(item.totalScore),
    level: item.level || '--',
    evaluationTime: item.evalTime || ''
  }))
}

export async function queryInspectionClosureSummary (params) {
  const data = unwrap(await getInspectionOrderClosedLoopRate(params), '巡检工单闭环率请求失败')
  return { totalRate: numberOrNull(data.totalRate) }
}

export async function queryInspectionClosureDetails (params) {
  const data = unwrap(await getInspectionOrderClosedLoopRateDetail(params), '巡检工单闭环明细请求失败')
  return mapPage(data, item => ({
    id: item.id,
    taskGuid: item.taskGUID || '',
    projectGuid: item.projGUID || '',
    projectName: item.projName || '--',
    projectRate: numberOrNull(item.projectClosureRate),
    threeClose: [numberOrNull(item.threeCloseCompletedTaskCount), numberOrNull(item.threeCloseTotalTaskCount)],
    securityPatrol: [numberOrNull(item.securityPatrolCompletedTaskCount), numberOrNull(item.securityPatrolTotalTaskCount)],
    cleaningPatrol: [numberOrNull(item.cleaningPatrolCompletedTaskCount), numberOrNull(item.cleaningPatrolTotalTaskCount)],
    engineeringPatrol: [numberOrNull(item.engineeringPatrolCompletedTaskCount), numberOrNull(item.engineeringPatrolTotalTaskCount)],
    safetyPatrol: [numberOrNull(item.safetyPatrolCompletedTaskCount), numberOrNull(item.safetyPatrolTotalTaskCount)],
    equipmentMaintenance: [numberOrNull(item.equipmentMaintenanceCompletedTaskCount), numberOrNull(item.equipmentMaintenanceTotalTaskCount)],
    equipmentInspection: [numberOrNull(item.equipmentInspectionCompletedTaskCount), numberOrNull(item.equipmentInspectionTotalTaskCount)]
  }))
}

export async function queryHazardSummary (params) {
  const data = unwrap(await getUnrectifiedHazardCount(params), '隐患未整改数请求失败')
  return { total: numberOrNull(data.total) }
}

export async function queryHazardDetails (params) {
  const data = unwrap(await getUnrectifiedHazardDetail(params), '隐患未整改明细请求失败')
  return mapPage(data, item => ({
    id: item.id,
    projectName: item.projName || '--',
    content: item.taskContent || '--',
    acceptUserName: item.acceptUserName || '--',
    responsibleUserName: item.responsibleUserName || '--',
    deadline: item.taskTimeLimit || '',
    result: item.result || '--'
  }))
}

export async function queryWarehouseSummary (params) {
  const data = unwrap(await getMaterialTotalInfo(params), '物料总量请求失败')
  return {
    categoryCount: numberOrNull(data.wllbsum),
    materialCount: numberOrNull(data.wlsum),
    totalValue: numberOrNull(data.kczjzsum)
  }
}

export async function queryVideoAiRiskControl (params) {
  const data = unwrap(await getVideoAiRiskControl(params), '视频AI风控请求失败')
  return {
    alertCount: numberOrNull(data.alarmCount),
    handledCount: numberOrNull(data.disposedCount),
    handleRate: numberOrNull(data.disposalRate),
    // 外层大屏轮播仅展示前 5 张。
    alarmPhotos: Array.isArray(data.alarmPhotos)
      ? data.alarmPhotos.map(url => String(url || '').trim()).filter(Boolean).slice(0, 5)
      : []
  }
}

export async function queryVideoAiRiskControlWorkOrderDetails (params) {
  const data = unwrap(await getVideoAiRiskControlWorkOrderDetail(params), '视频AI风控工单明细请求失败')
  return mapPage(data, (item, index) => ({
    id: item.workOrderGuid || item.workOrderCode || `video-ai-order-${index}`,
    guid: item.workOrderGuid || '',
    code: item.workOrderCode || '--',
    projectName: item.projName || '--',
    category: item.workOrderCategory || '--',
    content: item.taskContent || '--',
    acceptUserName: item.acceptUserName || '--',
    responsibleUserName: item.responsibleUserName || '--',
    deadline: item.taskTimeLimit || '',
    orderStatus: numberOrNull(item.orderStatus != null ? item.orderStatus : item.orderStatuse),
    alarmPicUrl: item.alarmPicUrl ? String(item.alarmPicUrl).trim() : ''
  }))
}

export async function queryWarehouseProjectDetails (params) {
  const data = unwrap(await getProjectMaterialValueDetail(params), '项目物料价值明细请求失败')
  return mapPage(data, item => ({
    id: item.id,
    projectName: item.projName || '--',
    inventoryQty: numberOrNull(item.inventoryQty),
    totalPrice: numberOrNull(item.totalPrice)
  }))
}

export async function queryWarehouseCategoryRatios (params) {
  const data = unwrap(await getMaterialCategoryValueRatio(params), '物料类别价值占比请求失败')
  return (Array.isArray(data.items) ? data.items : []).map((item, index) => ({
    id: `${item.lb || 'category'}-${index}`,
    name: item.lb || '--',
    percentage: numberOrNull(item.zb),
    amount: numberOrNull(item.je)
  }))
}

export async function queryServiceWorkOrderSummary (params) {
  const data = unwrap(await getServiceWorkOrderCompletionRate(params), '服务工单完成率请求失败')
  return {
    total: numberOrNull(data.gdTotal),
    completed: numberOrNull(data.wcTotal),
    rate: numberOrNull(data.wcRate)
  }
}

export async function queryServiceWorkOrderDetails (params) {
  const data = unwrap(await getServiceWorkOrderDetail(params), '服务工单明细请求失败')
  return mapPage(data, item => ({
    id: item.id,
    projectName: item.projName || '--',
    total: numberOrNull(item.gdTotal),
    completed: numberOrNull(item.wcTotal),
    rate: numberOrNull(item.wcRate)
  }))
}

export async function queryServiceWorkOrderCategories (params) {
  const data = unwrap(await getServiceWorkOrderTypeTotal(params), '服务工单类别统计请求失败')
  return (Array.isArray(data.items) ? data.items : []).map((item, index) => ({
    id: `${item.typeName || 'category'}-${index}`,
    name: item.typeName || '--',
    total: numberOrNull(item.gdTotal)
  }))
}

export async function queryMaintenanceSummary (params) {
  const data = unwrap(await getMaintenancePlanCompletionRate(params), '维保计划完成率请求失败')
  return {
    total: numberOrNull(data.jhTotal),
    completed: numberOrNull(data.wcTotal),
    rate: numberOrNull(data.wcRate)
  }
}

export async function queryMaintenanceDetails (params) {
  const data = unwrap(await getMaintenanceTaskDetail(params), '维保任务明细请求失败')
  return mapPage(data, item => ({
    id: item.id,
    projectName: item.projName || '--',
    total: numberOrNull(item.jhTotal),
    completed: numberOrNull(item.wcTotal),
    rate: numberOrNull(item.wcRate)
  }))
}

export async function queryTenantServiceSummary (params) {
  const data = unwrap(await getTenantServiceSatisfactionRate(params), '租户服务满意度请求失败')
  return {
    consultationTotal: numberOrNull(data.zxgdTotal),
    complaintTotal: numberOrNull(data.tsgdTotal),
    satisfactionRate: numberOrNull(data.mydRate)
  }
}

export async function querySatisfactionDetails (params) {
  const data = unwrap(await getServiceWorkOrderSatisfactionDetail(params), '满意度评价明细请求失败')
  return mapPage(data, item => ({
    id: item.id,
    projectName: item.projName || '--',
    category: item.workOrderCategory || '--',
    content: item.taskContent || '--',
    acceptUserName: item.acceptUserName || '--',
    responsibleUserName: item.responsibleUserName || '--',
    starLevel: item.starLevel == null ? '' : String(item.starLevel).trim()
  }))
}

export async function queryRectificationSummary (params) {
  const data = unwrap(await getServiceWorkOrderRectificationTrace(params), '整改跟踪请求失败')
  return {
    total: numberOrNull(data.zgTotal),
    completed: numberOrNull(data.yzgTotal),
    pending: numberOrNull(data.dzgTotal),
    recordTotal: numberOrNull(data.total)
  }
}

export async function queryPendingRectificationDetails (params) {
  const data = unwrap(await getServiceWorkOrderPendingRectificationDetail(params), '待整改清单请求失败')
  return mapPage(data, item => ({
    id: item.id,
    projectName: item.projName || '--',
    content: item.taskContent || '--',
    acceptUserName: item.acceptUserName || '--',
    responsibleUserName: item.responsibleUserName || '--',
    status: item.zgStatus || '--'
  }))
}

export async function queryMonthlyScoreRankings (params) {
  const data = unwrap(await getProjectMonthlyScoreRank(params), '月度综合评分请求失败')
  if (data.errCode != null && Number(data.errCode) !== 0) {
    throw new Error(data.errMsg || '月度综合评分请求失败')
  }
  return (Array.isArray(data.items) ? data.items : []).map(item => ({
    businessUnitGuid: item.buGuid || '',
    projectGuid: item.projectGuid || '',
    projectName: item.projectName || '--',
    maintenanceScore: numberOrNull(item.maintenanceScore),
    patrolScore: numberOrNull(item.patrolScore),
    qualityScore: numberOrNull(item.qualityScore),
    safetyScore: numberOrNull(item.safetyScore),
    threeCloseScore: numberOrNull(item.threeCloseScore),
    totalScore: numberOrNull(item.totalScore)
  }))
}

function reflect (promise) {
  return promise.then(value => ({ value }), error => ({ error }))
}

/** 仓库主屏由物料汇总和类别占比两个接口共同组成。 */
export async function queryWarehouseOverview (params) {
  const [summaryResult, categoriesResult] = await Promise.all([
    reflect(queryWarehouseSummary(params)),
    reflect(queryWarehouseCategoryRatios(params))
  ])
  if (summaryResult.error && categoriesResult.error) throw summaryResult.error

  const summary = summaryResult.value || {}
  const categories = categoriesResult.value || []
  return {
    materialCount: valueOr(summary.materialCount, null),
    categoryCount: valueOr(summary.categoryCount, null),
    totalPrice: valueOr(summary.totalValue, null),
    categories: categories.map(item => ({
      name: item.name,
      amount: item.amount,
      pct: valueOr(item.percentage, null)
    }))
  }
}

/** 工单相关主屏由六个明源统计接口共同组成，单接口失败时其余真实数据仍可展示。 */
export async function queryWorkOrderOverview (params) {
  const results = await Promise.all([
    reflect(queryInspectionClosureSummary(params)),
    reflect(queryServiceWorkOrderSummary(params)),
    reflect(queryServiceWorkOrderCategories(params)),
    reflect(queryTenantServiceSummary(params)),
    reflect(queryRectificationSummary(params)),
    reflect(queryHazardSummary(params))
  ])
  if (results.every(result => result.error)) throw results[0].error

  const inspection = results[0].value || {}
  const service = results[1].value || {}
  const categories = results[2].value || []
  const tenant = results[3].value || {}
  const rectification = results[4].value || {}
  const hazard = results[5].value || {}

  return {
    closeRate: valueOr(inspection.totalRate, null),
    totalCount: valueOr(service.total, null),
    completedCount: valueOr(service.completed, null),
    completionRate: valueOr(service.rate, null),
    details: categories.map(item => ({ categoryName: item.name, count: item.total })),
    consultationCount: valueOr(tenant.consultationTotal, null),
    complaintCount: valueOr(tenant.complaintTotal, null),
    satisfactionRate: valueOr(tenant.satisfactionRate, null),
    pendingRectificationCount: valueOr(rectification.pending, null),
    rectificationTotalCount: valueOr(rectification.total, null),
    rectifiedCount: valueOr(rectification.completed, null),
    overdueRectificationCount: valueOr(hazard.total, null)
  }
}
