function formatCount (val) {
  if (val == null || val === '') return '--'
  const n = Number(val)
  if (Number.isNaN(n)) return '--'
  return n.toLocaleString()
}

function getAlarmData (data) {
  return data && data.alarm ? data.alarm : {}
}

function formatPercentParts (val) {
  if (val == null || val === '') return { value: '--', unit: '%' }
  const normalized = String(val).replace('%', '').trim()
  const n = Number(normalized)
  if (Number.isNaN(n)) return { value: '--', unit: '%' }
  return {
    value: n.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    unit: '%'
  }
}

/** 消防待处理警告：按接口真实类别展示火警 / 预警 / 故障。 */
export function mapFireManagementKpiExtra (data) {
  if (!data) {
    return { high: '--', mid: '--', low: '--' }
  }
  const alarm = getAlarmData(data)
  return {
    high: formatCount(alarm.fireNum),
    mid: formatCount(alarm.warnNum),
    low: formatCount(alarm.faultNum)
  }
}

/** 智慧消防三项：设备总数、设备在线率、消防巡检扣分。 */
export function mapFireSafetyMetrics (data) {
  const online = formatPercentParts(data && data.onlineRate)
  return [
    {
      label: '设备总数',
      value: formatCount(data && data.deviceTotal)
    },
    {
      label: '设备在线率',
      value: online.value,
      unit: online.unit,
      accent: true
    },
    {
      label: '巡检扣分',
      value: formatCount(data && data.fireInspection),
      warn: true
    }
  ]
}
