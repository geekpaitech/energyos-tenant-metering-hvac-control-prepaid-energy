/** 管理后台电表 - 下拉选项与枚举展示（与 /device/electricity 对齐） */

import {
  MeterBindType,
  MeterPayType,
  MeterSwitchStatus,
  MeterOnlineStatus,
  MeterPhase,
  MeterMonitorType
} from '@/utils/enums/meter'

export function formatLogicPayTypeLabel (v) {
  if (v === 0 || v === '0') return MeterPayType[0].label
  if (v === 1 || v === '1') return MeterPayType[1].label
  return '-'
}

export function formatSwitchStatusLabel (v) {
  if (v === 1 || v === '1') return MeterSwitchStatus[1].label
  if (v === 0 || v === '0') return MeterSwitchStatus[0].label
  return '-'
}

export function formatBindTypeLabel (v) {
  return MeterBindType[v]?.label || '-'
}

export function formatOnlineStatusLabel (v) {
  if (v === 1 || v === '1') return MeterOnlineStatus[1].label
  if (v === 0 || v === '0') return MeterOnlineStatus[0].label
  return '-'
}

/** 电表规格：phase 已含「一次/二次」，勿再拼接 monitorType */
export function formatMeterSpecLabel (phase, monitorType) {
  const phaseItem = MeterPhase[Number(phase)]
  if (phaseItem) return phaseItem.label
  const monitorItem = MeterMonitorType[Number(monitorType)]
  return monitorItem?.label || '-'
}

export function mapManagerOptions (list) {
  return (Array.isArray(list) ? list : []).map(item => {
    const id = item.managerId != null ? item.managerId : item.id
    const name = item.managerName || item.name || ''
    return {
      ...item,
      id,
      unite: item.unite || (id != null ? `(${id})${name}` : name)
    }
  }).filter(item => item.id != null)
}

export function mapTenantOptions (list) {
  return (Array.isArray(list) ? list : []).map(item => {
    const id = item.tenantId != null ? item.tenantId : item.id
    const name = item.name || item.tenantName || ''
    return {
      ...item,
      id,
      unite: id != null ? `(${id})${name}` : name
    }
  }).filter(item => item.id != null)
}
