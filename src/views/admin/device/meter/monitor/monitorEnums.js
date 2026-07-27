import {
  MeterBindType as MeterBindTypeMap,
  MeterPayType as MeterPayTypeMap,
  MeterSwitchStatus as MeterSwitchStatusMap,
  MeterOnlineStatus as MeterOnlineStatusMap,
  MeterPhase as MeterPhaseMap,
  MeterMonitorType as MeterMonitorTypeMap
} from '@/utils/enums/meter'

function toReadMap (list) {
  const map = {}
  ;(list || []).forEach(item => {
    map[item.value] = item
  })
  return map
}

export const MeterBindTypeList = Object.values(MeterBindTypeMap)

export const MeterPayTypeList = Object.values(MeterPayTypeMap).map(item => ({
  ...item,
  class: item.value === 0 ? 'dian-blue' : 'dian-green'
}))

export const MeterSwitchStatusList = Object.values(MeterSwitchStatusMap)

export const MeterOnlineStatusList = Object.values(MeterOnlineStatusMap).map(item => ({
  ...item,
  class: item.value === 1 ? 'dian-green' : 'dian-orange'
}))

export const MeterChargeTypeList = [
  { value: 1, label: '充值' },
  { value: 2, label: '退费' },
  { value: 3, label: '充值测试' },
  { value: 4, label: '余额归零' }
]

export const MeterUseTypeList = [
  { value: 0, label: '停用' },
  { value: 1, label: '启用' }
]

export const MeterPhaseList = Object.values(MeterPhaseMap)

export const MeterMonitorTypeList = Object.values(MeterMonitorTypeMap)

export const MeterPriceSourceList = [
  { value: 0, label: '平台' },
  { value: 1, label: '项目' }
]

export const RoleTypeList = [
  { value: 1, label: '管理员' },
  { value: 2, label: '操作员' }
]

export const MeterBindType = MeterBindTypeList
export const MeterPayType = toReadMap(MeterPayTypeList)
export const MeterSwitchStatus = toReadMap(MeterSwitchStatusList)
export const MeterOnlineStatus = toReadMap(MeterOnlineStatusList)
export const MeterChargeType = MeterChargeTypeList
export const MeterUseType = MeterUseTypeList

export const MeterBindTypeRead = toReadMap(MeterBindTypeList)
export const MeterPhaseRead = toReadMap(MeterPhaseList)
export const MeterMonitorTypeRead = toReadMap(MeterMonitorTypeList)
export const MeterUseTypeRead = toReadMap(MeterUseTypeList)
export const MeterSwitchStatusRead = toReadMap(MeterSwitchStatusList)
export const MeterChargeTypeRead = toReadMap(MeterChargeTypeList)
export const MeterPriceSourceRead = toReadMap(MeterPriceSourceList)
export const RoleTypeRead = toReadMap(RoleTypeList)

export const switchColor = { 0: 'offline', 1: 'online' }
