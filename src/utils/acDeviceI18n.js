import { displayBizHybrid } from '@/utils/localeDisplayText'

/**
 * 空调设备页枚举：按数值映射到 deviceConditioning.* 文案键，
 * 避免接口/store 仍带中文 label 时在英文界面显示中文。
 */
const ENUM_KEYS = {
  airDeviceType: { 1: 'enumVrf' },
  airBindType: { 1: 'enumDedicated', 2: 'enumPublic' },
  powerStatus: { 0: 'enumPowerOff', 1: 'enumPowerOn' },
  operationMode: {
    0: 'enumModeAuto',
    1: 'enumModeHeat',
    2: 'enumModeCool',
    4: 'enumModeFan',
    8: 'enumModeDry'
  },
  fanSpeed: {
    0: 'enumFanAuto',
    1: 'enumFanLow',
    2: 'enumFanMid',
    3: 'enumFanHigh'
  },
  lockPowerStatus: {
    0: 'enumLockNone',
    128: 'enumLockPowerOff',
    129: 'enumLockPowerOn'
  },
  lockOperationMode: {
    0: 'enumLockNone',
    128: 'enumModeAuto',
    129: 'enumModeHeat',
    130: 'enumModeCool',
    132: 'enumModeFan',
    136: 'enumModeDry'
  },
  lockFanSpeed: {
    0: 'enumLockNone',
    128: 'enumFanAuto',
    129: 'enumFanLow',
    130: 'enumFanMid',
    131: 'enumFanHigh'
  },
  airlogType: {
    1: 'enumLogSwitch',
    2: 'enumLogMode',
    3: 'enumLogLock'
  }
}

function pickEnumKey (row, value) {
  if (!row || value === undefined || value === null) return null
  if (Object.prototype.hasOwnProperty.call(row, value)) return row[value]
  const n = Number(value)
  if (!Number.isNaN(n) && Object.prototype.hasOwnProperty.call(row, n)) return row[n]
  return null
}

export function translateAcEnum (vm, enumName, value) {
  const map = ENUM_KEYS[enumName]
  const key = pickEnumKey(map, value)
  if (key) return vm.$t(`deviceConditioning.${key}`)
  const list = (vm.enums && vm.enums[enumName]) || []
  const item = list.find((e) => e.value == value)
  if (!item || item.label == null || item.label === '') return '-'
  const locale = vm.$i18n && vm.$i18n.locale ? vm.$i18n.locale : 'zh-CN'
  if (locale === 'en') {
    if (typeof vm.$displayBizHybrid === 'function') {
      return vm.$displayBizHybrid(item.label, 48)
    }
    return displayBizHybrid(item.label, locale, 48)
  }
  return item.label
}

/** 详情抽屉：与列表 formatAirData 对齐的展示字段（纯函数，避免组件 methods/HMR 异常） */
export function applyAcDeviceDrawerI18n (vm, raw) {
  if (!raw || typeof raw !== 'object') return {}
  const o = { ...raw }
  const locale = vm.$i18n && vm.$i18n.locale ? vm.$i18n.locale : 'zh-CN'

  if (o.type != null && o.type !== '') o.typeLabel = translateAcEnum(vm, 'airDeviceType', o.type)
  if (o.operationMode != null && o.operationMode !== '') {
    o.operationModeLabel = translateAcEnum(vm, 'operationMode', o.operationMode)
  }
  if (o.fanSpeed != null && o.fanSpeed !== '') {
    o.fanSpeedLabel = translateAcEnum(vm, 'fanSpeed', o.fanSpeed)
  }
  if (o.bindType == 2) {
    o.bindData = o.bindId || ''
  } else if (o.bindType == 1) {
    o.bindData = o.tenantName
      ? `${o.bindId || ''}(${displayBizHybrid(o.tenantName, locale, 200)})`
      : (o.bindId || '')
  } else {
    o.bindData = ''
  }

  o.isLock = !!(
    o.lockFanSpeed ||
    o.lockOperationMode ||
    o.lockPowerStatus ||
    o.minTemperature ||
    o.maxTemperature
  )

  return o
}
