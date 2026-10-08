/**
 * 「系统电量」相关展示：当前为南都广场等管理方白名单（写死）。
 * 后续若改为接口下发，只需替换 getNanduPlazaSysElecManagerIdsSync / isNanduPlazaSysElecManager 的实现，
 * 调用方（账单详情、空调用电报表等）无需再散落写死 ID。
 */

/** @type {string[]} */
export const NANDU_PLAZA_SYS_ELEC_MANAGER_IDS = ['1000107']

/**
 * 同步获取需展示系统电量扩展字段的管理方 ID 列表（预留改为异步/接口时使用）。
 * @returns {string[]}
 */
export function getNanduPlazaSysElecManagerIdsSync () {
  return NANDU_PLAZA_SYS_ELEC_MANAGER_IDS.map((id) => String(id).trim())
}

/**
 * 当前管理方是否展示「系统电量」类扩展字段（账单空调明细、空调报表等）。
 * @param {string|number|null|undefined} managerId
 * @returns {boolean}
 */
export function isNanduPlazaSysElecManager (managerId) {
  const mid = String(managerId ?? '').trim()
  if (!mid) return false
  return NANDU_PLAZA_SYS_ELEC_MANAGER_IDS.some((id) => String(id).trim() === mid)
}
