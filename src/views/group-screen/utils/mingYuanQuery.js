import { getPeriodTimeRange, getYearTimeRange } from './screenQuery'
import { MINGYUAN_PROJECT_TYPES } from '../config/mingYuanProjects'

function appendText (target, key, value) {
  const text = value == null ? '' : String(value).trim()
  if (text) target[key] = text
}

/**
 * 明源物业接口专用参数构建器。
 * projectType 使用中文业态，不复用其他大屏接口的数字 bizType。
 */
export function buildMingYuanQuery ({
  scope = '全部',
  period = '本月',
  dateRange,
  projectType,
  projectName,
  gdType,
  orderStatus,
  pageIndex,
  pageSize
} = {}) {
  const periodRange = getPeriodTimeRange(period)
  const range = Array.isArray(dateRange) && dateRange.length === 2
    ? { startTime: dateRange[0], endTime: dateRange[1] }
    : periodRange
  const dto = {
    startTime: range.startTime,
    endTime: range.endTime
  }
  const resolvedProjectType = projectType !== undefined
    ? projectType
    : (MINGYUAN_PROJECT_TYPES.includes(scope) ? scope : '')

  appendText(dto, 'projectType', resolvedProjectType)
  appendText(dto, 'projectName', projectName)
  appendText(dto, 'gdType', gdType)
  const normalizedOrderStatus = Number(orderStatus)
  if (Number.isInteger(normalizedOrderStatus) && normalizedOrderStatus >= 1 && normalizedOrderStatus <= 6) {
    dto.orderStatus = normalizedOrderStatus
  }

  if (Number.isInteger(pageIndex) && pageIndex >= 0) dto.pageIndex = pageIndex
  if (Number.isInteger(pageSize) && pageSize > 0) dto.pageSize = pageSize

  return dto
}

/**
 * 明源仓库接口专用参数。
 * 仓库数据固定查询当年 1 月 1 日至今天，不跟随大屏右上角时间切换，
 * 同时保留业态、可选项目名称及详情分页参数。
 */
export function buildMingYuanWarehouseQuery ({
  scope = '全部',
  projectType,
  projectName,
  pageIndex,
  pageSize
} = {}) {
  const dto = { ...getYearTimeRange() }
  const resolvedProjectType = projectType !== undefined
    ? projectType
    : (MINGYUAN_PROJECT_TYPES.includes(scope) ? scope : '')

  appendText(dto, 'projectType', resolvedProjectType)
  appendText(dto, 'projectName', projectName)

  if (Number.isInteger(pageIndex) && pageIndex >= 0) dto.pageIndex = pageIndex
  if (Number.isInteger(pageSize) && pageSize > 0) dto.pageSize = pageSize

  return dto
}
