function formatCount (val) {
  if (val == null || val === '') return '--'
  const n = Number(val)
  if (Number.isNaN(n)) return '--'
  return n.toLocaleString()
}

/** getFireManagement → KPI「今日待处理告警（分级）」extra（火警红 / 预警橙 / 故障黄） */
export function mapFireManagementKpiExtra (data) {
  if (!data) {
    return { high: '--', mid: '--', low: '--' }
  }
  return {
    high: formatCount(data.fireAlarmCount),
    mid: formatCount(data.preAlarmCount),
    low: formatCount(data.failureCount)
  }
}
