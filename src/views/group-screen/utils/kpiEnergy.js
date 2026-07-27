import { mapFireManagementKpiExtra } from './fireManagement'
import { applyWorkOrderKpi } from './workOrderManagement'

/** 顶部 KPI：能耗接口字段 → 展示值 */
export function formatKpiPercent (val) {
  if (val == null || val === '') return '--'
  const num = Number(val)
  if (Number.isNaN(num)) return '--'
  return num.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

export function formatKpiEnergyPerArea (val) {
  if (val == null || val === '') return '--'
  const num = Number(val)
  if (Number.isNaN(num)) return '--'
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

/**
 * 将 getEnergyManagement 根字段写入 KPI 列表副本
 * @param {Array} list cloneKpiListTemplate()
 * @param {object|null} data
 */
export function applyEnergyManagementKpi (list, data) {
  const fieldMap = {
    onlineRate: { field: 'deviceOnlineRate', format: formatKpiPercent },
    energyPerArea: { field: 'unitAreaEnergyConsumption', format: formatKpiEnergyPerArea },
    collectionRate: { field: 'tenantWaterElecCollectRate', format: formatKpiPercent }
  }
  return list.map(item => {
    const cfg = fieldMap[item.key]
    if (!cfg) return item
    const raw = data ? data[cfg.field] : null
    return { ...item, value: cfg.format(raw), trend: null }
  })
}

/** 顶部 KPI：停车接口 totalRevenue → 停车营收汇总 */
export function formatKpiMoney (val) {
  if (val == null || val === '') return '--'
  const num = Number(val)
  if (Number.isNaN(num)) return '--'
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export function applyParkingKpi (list, data) {
  return list.map(item => {
    if (item.key !== 'parkingRevenue') return item
    const raw = data ? data.totalRevenue : null
    return { ...item, value: formatKpiMoney(raw), trend: null }
  })
}

/** 顶部 KPI：消防接口 → 今日待处理告警（分级） */
export function applyFireManagementKpi (list, data) {
  return list.map(item => {
    if (item.key !== 'alarms') return item
    return { ...item, extra: mapFireManagementKpiExtra(data) }
  })
}

/** 合并写入顶部 KPI（能耗 + 停车 + 消防 + 工单） */
export function applyScreenTopKpi (list, { energy, parking, fire, workOrder } = {}) {
  return applyWorkOrderKpi(
    applyFireManagementKpi(
      applyParkingKpi(applyEnergyManagementKpi(list, energy), parking),
      fire
    ),
    workOrder
  )
}
