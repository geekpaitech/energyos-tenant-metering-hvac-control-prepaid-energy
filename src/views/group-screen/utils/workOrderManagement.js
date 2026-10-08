/** 工单统计接口 → 大屏展示结构 */

export const EMPTY_TENANT_SERVICE = {
  inquiry: '--',
  complaint: '--',
  satisfactionRate: null
}

export const EMPTY_RECTIFICATION_TRACKING = [
  { label: '整改总数', count: '--', type: 'total' },
  { label: '已整改', count: '--', type: 'done' },
  { label: '待整改', count: '--', type: 'pending' }
]

function formatCount (val) {
  if (val == null || val === '') return '--'
  const num = Number(val)
  if (Number.isNaN(num)) return '--'
  return num.toLocaleString()
}

/** 租户服务（维修 / 投诉 / 满意度） */
export function mapTenantService (data) {
  if (!data) return { ...EMPTY_TENANT_SERVICE }
  return {
    inquiry: data.consultationCount != null && data.consultationCount !== ''
      ? Number(data.consultationCount)
      : '--',
    complaint: data.complaintCount != null && data.complaintCount !== ''
      ? Number(data.complaintCount)
      : '--',
    satisfactionRate: data.satisfactionRate != null && data.satisfactionRate !== ''
      ? Number(data.satisfactionRate)
      : null
  }
}

/** 安全/品质/专项整改跟踪三项 */
export function mapRectificationTracking (data) {
  if (!data) return EMPTY_RECTIFICATION_TRACKING.map(i => ({ ...i }))
  return [
    { label: '整改总数', count: formatCount(data.rectificationTotalCount), type: 'total' },
    { label: '已整改', count: formatCount(data.rectifiedCount), type: 'done' },
    { label: '待整改', count: formatCount(data.pendingRectificationCount), type: 'pending' }
  ]
}

/** 顶部 KPI：巡检工单闭环率 */
export function formatWorkOrderCloseRate (val) {
  if (val == null || val === '') return '--'
  const num = Number(val)
  if (Number.isNaN(num)) return '--'
  return num.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

/** 顶部 KPI：安全/品质未整改数 */
export function formatHazardFixCount (val) {
  if (val == null || val === '') return '--'
  const num = Number(val)
  if (Number.isNaN(num)) return '--'
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export function applyWorkOrderKpi (list, data) {
  return list.map(item => {
    if (item.key === 'workOrderRate') {
      return {
        ...item,
        value: formatWorkOrderCloseRate(data ? data.closeRate : null),
        trend: null
      }
    }
    if (item.key === 'hazardFix') {
      return {
        ...item,
        value: formatHazardFixCount(data ? data.overdueRectificationCount : null),
        trend: null
      }
    }
    return item
  })
}
