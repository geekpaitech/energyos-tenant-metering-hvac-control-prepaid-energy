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

/** 本年 1月1日 00:00:00 ~ 12月31日 23:59:59 */
export function getYearTimeRange () {
  const now = new Date()
  const y = now.getFullYear()
  return {
    startTime: `${y}-01-01 00:00:00`,
    endTime: `${y}-12-31 23:59:59`
  }
}

/** 顶栏时间筛选文案 → 时间范围（默认本月） */
export function getPeriodTimeRange (period) {
  if (period === '今日') return getTodayTimeRange()
  if (period === '本年') return getYearTimeRange()
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

/** 仓库经营管理：固定按本月查询，不受顶栏时间筛选切换影响 */
export function buildWarehouseScreenDto ({ scope } = {}) {
  return {
    ...withBizType(scope),
    ...getMonthTimeRange()
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
