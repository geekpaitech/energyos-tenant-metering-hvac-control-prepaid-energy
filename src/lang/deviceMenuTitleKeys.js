/**
 * 路由 meta.title / dividerLabel 中的中文 → vue-i18n 键（deviceMenu.*）
 * 仅覆盖控制台自建「设备目录」计量与公摊区块，路由配置仍保留中文 title 不变。
 */
export const DEVICE_MENU_TITLE_KEYS = {
  计量设备: 'deviceMenu.meteringDivider',
  设备公摊组: 'deviceMenu.sharingDivider',
  电表: 'deviceMenu.electricity',
  电表详情: 'deviceMenu.electricityDetail',
  水表: 'deviceMenu.water',
  水表详情: 'deviceMenu.waterDetail',
  空调: 'deviceMenu.hvac',
  空调详情: 'deviceMenu.hvacDetail',
  电表公摊组: 'deviceMenu.electricitySharing',
  电表公摊详情: 'deviceMenu.electricitySharingDetail',
  水表公摊组: 'deviceMenu.waterSharing',
  水表公摊详情: 'deviceMenu.waterSharingDetail',
  空调公摊组: 'deviceMenu.hvacSharing',
  空调公摊详情: 'deviceMenu.hvacSharingDetail'
}
