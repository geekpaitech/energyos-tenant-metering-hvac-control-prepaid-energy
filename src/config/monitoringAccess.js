// 监测模块菜单可见性配置（与「其他智能设备」白名单独立，便于分别维护）
// 仅当当前管理方 ID 在白名单中时，显示「监测」顶级菜单及其子菜单。
// 子项是否出现仍受后台菜单权限（menuNo）控制。

export const MONITORING_ACCESS_CONFIG = {
  enabled: true,
  managerIdWhitelist: ['1000165', '1000107', '1000178']
}

export function canAccessMonitoringMenus (managerId) {
  if (!MONITORING_ACCESS_CONFIG.enabled) return true
  const id = String(managerId || '').trim()
  if (!id) return false
  return MONITORING_ACCESS_CONFIG.managerIdWhitelist.includes(id)
}

/** 监测子页（与 routeConfig 中 path 一致，均为绝对路径） */
export const MONITORING_MENU_PATHS = new Set([
  '/power-analysis/energy-overview',
  '/energy-analysis/loss-analysis',
  '/equipment-manage/item-topology',
  '/data-query/electric-params'
])

export const MONITORING_DIVIDER_PATH = 'divider-power-room-monitoring'

export const MONITORING_ROOT_PATH = '/ym/monitoring'
