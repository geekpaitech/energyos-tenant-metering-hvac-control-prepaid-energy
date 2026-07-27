/** 管理后台水表 - 下拉选项与枚举展示 */

import {
  WaterBindType,
  WaterChannelType,
  WaterPayType,
  WaterSwitchSupport,
  WaterValveStatus,
  WaterOnlineStatus
} from '@/utils/enums/water'

export function formatBindTypeLabel (v) {
  return WaterBindType[v]?.label || '-'
}

export function formatWaterTypeLabel (v) {
  return WaterChannelType[v]?.label || '-'
}

export function formatLogicPayTypeLabel (v) {
  if (v === 0 || v === '0') return WaterPayType[0].label
  if (v === 1 || v === '1') return WaterPayType[1].label
  return '-'
}

export function formatWithSwitchLabel (v) {
  if (v === true || v === 'true') return WaterSwitchSupport.true.label
  if (v === false || v === 'false') return WaterSwitchSupport.false.label
  return '-'
}

export function formatSwitchStatusLabel (v) {
  if (v === 1 || v === '1') return WaterValveStatus[1].label
  if (v === 0 || v === '0') return WaterValveStatus[0].label
  return '-'
}

export function formatOnlineStatusLabel (v) {
  if (v === 1 || v === '1') return WaterOnlineStatus[1].label
  if (v === 0 || v === '0') return WaterOnlineStatus[0].label
  return '-'
}

export { mapManagerOptions, mapTenantOptions } from '../meter/utils'
