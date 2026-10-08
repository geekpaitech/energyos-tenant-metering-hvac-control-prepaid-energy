import { mapFireManagementKpiExtra } from './fireManagement'
import { applyWorkOrderKpi } from './workOrderManagement'
import { calculateParkingTurnoverRate } from './screenBenchmark'

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

function formatParkingTurnover (val) {
  if (val == null || val === '') return '--'
  const num = Number(val)
  if (Number.isNaN(num)) return '--'
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * 将 getEnergyManagement 根字段写入 KPI 列表副本
 * @param {Array} list cloneKpiListTemplate()
 * @param {object|null} data
 */
export function applyEnergyManagementKpi (list, data) {
  const fieldMap = {
    energyPerArea: { field: 'unitAreaEnergyConsumption', format: formatKpiEnergyPerArea }
  }
  return list.map(item => {
    const cfg = fieldMap[item.key]
    if (!cfg) return item
    const raw = data ? data[cfg.field] : null
    return { ...item, value: cfg.format(raw), trend: null }
  })
}

export function applyDeviceKpi (list, data) {
  return list.map(item => {
    if (item.key !== 'onlineRate') return item
    return {
      ...item,
      value: formatKpiPercent(data ? data.rate : null),
      trend: null
    }
  })
}

export function applyCollectionKpi (list, data) {
  return list.map(item => {
    if (item.key !== 'collectionRate') return item
    return {
      ...item,
      value: formatKpiPercent(data ? data.rate : null),
      trend: null
    }
  })
}

export function applyParkingKpi (list, data) {
  return list.map(item => {
    if (item.key !== 'parkingTurnover') return item
    return {
      ...item,
      value: formatParkingTurnover(calculateParkingTurnoverRate(data || {})),
      trend: null
    }
  })
}

/** 顶部 KPI：消防接口 → 今日待处理告警（分级） */
export function applyFireManagementKpi (list, data) {
  return list.map(item => {
    if (item.key !== 'alarms') return item
    return { ...item, extra: mapFireManagementKpiExtra(data) }
  })
}

/** 合并写入顶部 KPI（能耗 + 设备 + 收缴 + 停车 + 消防 + 工单） */
export function applyScreenTopKpi (list, { energy, device, collection, parking, fire, workOrder } = {}) {
  // 设备在线率优先取主接口 energy.deviceOnlineRate（已含业态过滤）
  const deviceData = (energy && energy.deviceOnlineRate != null)
    ? { rate: energy.deviceOnlineRate }
    : device
  return applyWorkOrderKpi(
    applyFireManagementKpi(
      applyParkingKpi(
        applyCollectionKpi(
          applyDeviceKpi(applyEnergyManagementKpi(list, energy), deviceData),
          collection
        ),
        parking
      ),
      fire
    ),
    workOrder
  )
}
