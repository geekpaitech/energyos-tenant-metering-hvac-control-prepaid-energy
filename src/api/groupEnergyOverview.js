import request from '@/utils/request'

const CONTENT_BASE = '/api/ebc-content'
const REPORT_HEADERS = {
  userDeviceType: 'PC',
  'Content-Type': 'application/json'
}

export const GROUP_ENERGY_MANAGERS = Object.freeze([
  { managerId: 1000107, name: '南都广场', tone: 'blue', icon: 'el-icon-office-building' },
  { managerId: 1000178, name: '经开-机器人产业园', tone: 'green', icon: 'el-icon-cpu' },
  { managerId: 1000175, name: '苏旺商务中心', tone: 'gold', icon: 'el-icon-school' },
  { managerId: 1000183, name: '塔韵商务广场', tone: 'steel', icon: 'el-icon-office-building' }
])

function post (url, data) {
  return request({
    url,
    method: 'post',
    data,
    headers: REPORT_HEADERS,
    skipErrorMessage: true
  })
}

function pad (value) {
  return String(value).padStart(2, '0')
}

function formatDate (date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * 驾驶舱时间口径：
 * 今日 = 今天；本月 = 当月 1 日至今天；截至当前 = 当年 1 月 1 日至今天。
 */
export function getGroupEnergyDateRange (period, currentDate = new Date()) {
  const endDate = formatDate(currentDate)
  if (period === '今日') {
    return { startDate: endDate, endDate }
  }
  if (period === '截至当前' || period === '本年') {
    return { startDate: `${currentDate.getFullYear()}-01-01`, endDate }
  }
  return {
    startDate: `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-01`,
    endDate
  }
}

function ensureSuccess (response, label) {
  if (!response || String(response.code) !== '200') {
    throw new Error((response && response.msg) || `${label}请求失败`)
  }
  return response.data
}

function numberOrZero (value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function round2 (value) {
  return Number(numberOrZero(value).toFixed(2))
}

function sumRows (rows, field) {
  return (Array.isArray(rows) ? rows : []).reduce(
    (total, row) => total + numberOrZero(row && row[field]),
    0
  )
}

export function queryGroupElectricityHistory ({ managerId, startDate, endDate, tenantType }) {
  return post(`${CONTENT_BASE}/useReport/queryTenantUseStatis`, {
    managerId,
    startDate,
    endDate,
    dataType: 2,
    useType: 1,
    selectType: 2,
    tenantType
  })
}

export function queryGroupWaterHistory ({ managerId, startDate, endDate, tenantType }) {
  return post(`${CONTENT_BASE}/useReport/queryTenantWaterUseStatis`, {
    managerId,
    startDate,
    endDate,
    dataType: 2,
    useType: 0,
    tenantType
  })
}

export function queryGroupTodayElectricity ({ managerId, tenantType }) {
  return post(`${CONTENT_BASE}/customerWorkbench/queryCwTenantTodayUse`, {
    managerId,
    tenantType
  })
}

async function queryElectricityByType (managerId, tenantType, range) {
  const [historyResponse, todayResponse] = await Promise.all([
    queryGroupElectricityHistory({ managerId, tenantType, ...range }),
    queryGroupTodayElectricity({ managerId, tenantType })
  ])
  const history = ensureSuccess(historyResponse, '历史用电')
  const today = ensureSuccess(todayResponse, '今日用电') || {}
  return round2(sumRows(history, 'useElec') + numberOrZero(today.useElec))
}

async function queryWaterByType (managerId, tenantType, range) {
  const response = await queryGroupWaterHistory({ managerId, tenantType, ...range })
  const history = ensureSuccess(response, '用水')
  return round2(sumRows(history, 'waterUse'))
}

/**
 * 单个管理方汇总。总量只由租户与公区两个展示值相加，确保页面公式闭环。
 */
export async function queryManagerEnergyOverview ({ manager, resource, range }) {
  const queryByType = resource === 'water' ? queryWaterByType : queryElectricityByType
  const [tenant, publicArea] = await Promise.all([
    queryByType(manager.managerId, 0, range),
    queryByType(manager.managerId, 1, range)
  ])
  return {
    ...manager,
    tenant,
    publicArea,
    total: round2(tenant + publicArea),
    available: true
  }
}

/**
 * 四个管理方并行查询。单个项目失败不会污染其他项目，也不会被当作 0 参与集团合计。
 */
export async function queryGroupEnergyOverview ({
  period,
  resource = 'electricity',
  managers = GROUP_ENERGY_MANAGERS
}) {
  const range = getGroupEnergyDateRange(period)
  const settled = await Promise.allSettled(
    managers.map(manager => queryManagerEnergyOverview({ manager, resource, range }))
  )
  const projects = settled.map((result, index) => {
    if (result.status === 'fulfilled') return result.value
    return {
      ...managers[index],
      tenant: null,
      publicArea: null,
      total: null,
      available: false,
      error: result.reason && result.reason.message ? result.reason.message : '数据获取失败'
    }
  })
  const complete = projects.every(project => project.available)
  return {
    range,
    projects,
    complete,
    total: complete
      ? round2(projects.reduce((sum, project) => sum + project.total, 0))
      : null
  }
}
