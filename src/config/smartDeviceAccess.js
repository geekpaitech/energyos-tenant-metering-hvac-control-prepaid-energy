// 其他智能设备菜单可见性配置
// 仅当当前管理方 ID 在白名单中时，显示“其他智能设备”分组及其子菜单。

export const SMART_DEVICE_ACCESS_CONFIG = {
  enabled: true,
  managerIdWhitelist: []
}

export function canAccessSmartDeviceMenus (managerId) {
  if (!SMART_DEVICE_ACCESS_CONFIG.enabled) return true
  const id = String(managerId || '').trim()
  if (!id) return false
  return SMART_DEVICE_ACCESS_CONFIG.managerIdWhitelist.includes(id)
}

export const SMART_DEVICE_MENU_PATHS = new Set([
  '/device/lightingControl',
  '/project/airConditioningSubsystem',
  '/project/senSorSystem',
  '/project/waterSupplyAndDrainageSubsystem',
  '/device/historicalData'
])

export const SMART_DEVICE_DIVIDER_PATH = 'divider-smart-devices'
