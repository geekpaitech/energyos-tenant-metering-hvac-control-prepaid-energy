import { GROUP_ENERGY_MANAGERS } from '@/api/groupEnergyOverview'

/** 顶栏业态文案 → 接口 bizType */
export const BIZ_TYPE_MAP = {
  产业园: 1,
  商办: 2,
  公寓: 3
}

export function scopeToBizType (scope) {
  if (scope === '全部') return null
  return BIZ_TYPE_MAP[scope] || BIZ_TYPE_MAP.商办
}

function withBizType (scope) {
  const bizType = scopeToBizType(scope)
  return bizType == null ? {} : { bizType }
}

/** 本月 1 日 00:00:00 ~ 本月最后一天 23:59:59 */
export function getMonthTimeRange () {
  const now = new Date()
  const p = n => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const m = now.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  const month = p(m + 1)
  return {
    startTime: `${y}-${month}-01 00:00:00`,
    endTime: `${y}-${month}-${p(lastDay)} 23:59:59`
  }
}

/** 本日 00:00:00 ~ 23:59:59（停车等按日统计接口） */
export function getTodayTimeRange () {
  const now = new Date()
  const p = n => String(n).padStart(2, '0')
  const d = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
  return {
    startTime: `${d} 00:00:00`,
    endTime: `${d} 23:59:59`
  }
}

/** 当年 1 月 1 日 00:00:00 ~ 当前日期 23:59:59 */
export function getYearTimeRange () {
  const now = new Date()
  const p = n => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const today = `${y}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
  return {
    startTime: `${y}-01-01 00:00:00`,
    endTime: `${today} 23:59:59`
  }
}

/** 顶栏时间筛选文案 → 时间范围（默认本月） */
export function getPeriodTimeRange (period) {
  if (period === '今日') return getTodayTimeRange()
  if (period === '截至当前' || period === '本年') return getYearTimeRange()
  return getMonthTimeRange()
}

/**
 * 物业大屏通用查询参数（随时间筛选，默认本月；暂不传 managerId）
 * @param {{ scope?: string, period?: string }} options
 */
export function buildPropertyScreenDto ({ scope, period } = {}) {
  return {
    ...withBizType(scope),
    ...getPeriodTimeRange(period)
  }
}

/** 停车经营管理：跟随顶栏时间筛选 */
export function buildParkingScreenDto ({ scope, period } = {}) {
  return {
    ...withBizType(scope),
    ...getPeriodTimeRange(period)
  }
}

/** 仓库经营管理：固定按当年年初至今天查询，不受顶栏时间筛选切换影响 */
export function buildWarehouseScreenDto ({ scope } = {}) {
  return {
    ...withBizType(scope),
    ...getYearTimeRange()
  }
}

/** 供应商评价：随时间筛选分页查询（pageIndex 从 0 开始） */
export function buildProviderEvaluationDto ({ period, pageIndex = 0, pageSize = 20 } = {}) {
  return {
    ...getPeriodTimeRange(period),
    pageIndex,
    pageSize
  }
}

/** 管理方 ID → 业态 映射 */
export const MANAGER_BIZ_TYPE_MAP = Object.freeze({
  1000107: '商办', // 南都广场
  1000175: '商办', // 苏旺商务中心
  1000183: '商办', // 塔韵商务广场
  1000178: '产业园' // 经开-机器人产业园
})

export function getManagerBizType (managerId) {
  return MANAGER_BIZ_TYPE_MAP[managerId] || null
}

/**
 * 根据业态 scope 过滤管理方列表（用于详情面板）
 * @param {'全部'|'产业园'|'商办'|'公寓'} scope
 */
export function getManagersByScope (scope) {
  if (scope === '全部') return [...GROUP_ENERGY_MANAGERS]
  if (scope === '公寓') return []
  return GROUP_ENERGY_MANAGERS.filter(
    m => getManagerBizType(m.managerId) === scope
  )
}
