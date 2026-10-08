import request from '@/utils/request'
import store from '@/store'
import Cookies from 'js-cookie'

const BASE = '/api/ebc-content/propertyScreen'

function buildScreenHeaders () {
  const rawToken = Cookies.get('Admin-Token') || store.getters.token || ''
  const authorization = rawToken
    ? (String(rawToken).startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`)
    : ''
  const userId = store.state.user.userId
  const userRole = store.getters.role || (store.getters.roles && store.getters.roles[0]) || ''

  return {
    userDeviceType: 'PC',
    'Content-Type': 'application/json',
    authorization,
    'Authorization-UserId': userId,
    'Authorization-UserRole': userRole
  }
}

/** 大屏接口：失败时由页面降级展示 --，不弹全局 toast；timeout 默认 60s（大屏页面专用，不受全局 10s 限制） */
function postScreen (url, data, timeout = 60000) {
  return request({
    url,
    method: 'post',
    headers: buildScreenHeaders(),
    data,
    skipErrorMessage: true,
    timeout
  })
}

/** 获取停车经营管理统计 */
export function getParkingManagement (data) {
  return postScreen(`${BASE}/getParkingManagement`, data)
}

/** 获取能耗与经营成本统计 */
export function getEnergyManagement (data) {
  return postScreen(`${BASE}/getEnergyManagement`, data)
}

/** 获取单位面积能耗下钻明细 */
export function getUnitAreaEnergyConsumptionDetail (data) {
  return postScreen(`${BASE}/getUnitAreaEnergyConsumptionDetail`, data)
}

function numberOrNull (value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

/** 单位面积能耗项目明细（标准化接口空值，避免组件直接依赖后端字段形态） */
export async function queryUnitAreaEnergyConsumptionDetails (params) {
  const response = await getUnitAreaEnergyConsumptionDetail(params)
  if (!response || Number(response.code) !== 200) {
    throw new Error((response && (response.msg || response.error)) || '单位面积能耗明细请求失败')
  }
  const rows = Array.isArray(response.data) ? response.data : []
  return rows.map((item, index) => ({
    id: item.managerId == null ? `unit-energy-${index}` : item.managerId,
    managerId: item.managerId,
    managerName: item.managerName || '--',
    bizType: numberOrNull(item.bizType),
    coveredArea: numberOrNull(item.coveredArea),
    electricityValue: numberOrNull(item.electricityValue),
    unitAreaEnergyConsumption: numberOrNull(item.unitAreaEnergyConsumption)
  }))
}

/** 获取维保计划统计（本月） */
export function getMaintenanceManagement (data) {
  return postScreen(`${BASE}/getMaintenanceManagement`, data)
}

/** 获取服务工单统计（本月） */
export function getWorkOrderManagement (data) {
  return postScreen(`${BASE}/getWorkOrderManagement`, data)
}

/** 获取月度综合评分排名（本月） */
export function getProjectScoreRankings (data) {
  return postScreen(`${BASE}/getProjectScoreRankings`, data)
}

/** 获取消防实时报警统计（今日） */
export function getFireManagement (data) {
  return postScreen(`${BASE}/getFireManagement`, data)
}

/** 获取仓库经营管理统计（本月） */
export function getWarehouseManagement (data) {
  return postScreen(`${BASE}/getWarehouseManagement`, data)
}

/** 获取供应商评价大屏统计（本月，分页） */
export function getProviderEvaluation (data) {
  return postScreen(`${BASE}/getProviderEvaluation`, data)
}
