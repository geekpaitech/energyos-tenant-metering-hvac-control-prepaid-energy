/**
 * 综合能源管理大屏 — 公共配置
 */

/** 大屏下拉仅展示这五个管理方 */
export const ENERGY_SCREEN_MANAGER_IDS = [
  '1000107', // 南都广场
  '1000171', // 吴淞江新邻荟
  '1000175', // 苏旺商务中心广场
  '1000178', // 经开-机器人产业园
  '1000183', // 塔韵商务广场
  '1000198' // OPC人工智能产业园
]

/**
 * 管理方 → 业态 映射
 */
export const MANAGER_TO_BUSINESS = {
  '1000107': 'office',     // 南都广场 → 商办
  '1000183': 'office',     // 塔韵商务广场 → 商办
  '1000171': 'office',     // 吴淞江新邻荟 → 商办
  '1000175': 'office',     // 苏旺商务中心广场 → 商办
  '1000178': 'industrial', // 经开-机器人产业园 → 产业园
  '1000198': 'industrial'  // OPC人工智能产业园 → 产业园
}

/** 业态 → bizType 数值映射（接口入参），all 不传 */
export const BIZ_TYPE_MAP = {
  industrial: 1, // 产业园
  office: 2,     // 商办
  apartment: 3   // 公寓
}

/** 集团默认文案 */
export const GROUP_FALLBACK = '经开资管'

/** 南都广场 ID（光伏专属） */
export const NANDU_MANAGER_ID = '1000107'

/**
 * 光伏收益及配套演示数据的可见场景：
 * 1. 集团模式下「全部」
 * 2. 集团模式下「商办」
 * 3. 南都广场
 */
export function isPhotovoltaicReturnAvailable (managerId, business) {
  if (String(managerId) === NANDU_MANAGER_ID) return true
  return managerId == null && (business === 'all' || business === 'office')
}

/**
 * 光伏投资收益基础参数。
 * 收益数据由光伏动态收益分析模块读取上一个完整自然月的账单统计后推导。
 */
export const PHOTOVOLTAIC_RETURN_MODEL = Object.freeze({
  investmentYuan: 760000,
  monthlyGenerationKwh: 44801.94,
  capacityKwp: 330.86
})
