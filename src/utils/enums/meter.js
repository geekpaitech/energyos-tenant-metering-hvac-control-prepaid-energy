/**
 * 电表相关枚举定义
 * @/utils/enums/meter.js
 */

// 电表绑定类型
export const MeterBindType = {
    1: { value: 1, label: '专用表' },
    2: { value: 2, label: '公摊表' },
    3: { value: 3, label: '公式表' },
    4: { value: 4, label: '空调表' },
  }
  
  // 电表付费模式
  export const MeterPayType = {
    0: { value: 0, label: '预付费' },
    1: { value: 1, label: '强控' }
  }
  
  // 电表分合闸状态
  export const MeterSwitchStatus = {
    0: { value: 0, label: '分闸' },
    1: { value: 1, label: '合闸' }
  }
  
  // 电表在线状态
  export const MeterOnlineStatus = {
    0: { value: 0, label: '离线', class: 'offline' },
    1: { value: 1, label: '在线', class: 'online' }
  }
  
  // 电表相位
  export const MeterPhase = {
    5: { value: 5, label: '三相一次' },
    6: { value: 6, label: '三相二次' },
    7: { value: 7, label: '单相一次' }
  }
  
  // 电表监测类型
  export const MeterMonitorType = {
    1: { value: 1, label: '一次' },
    2: { value: 2, label: '二次' }
  }
  
  // 获取枚举标签的辅助函数
  export function getEnumLabel(enumObj, value) {
    return enumObj[value]?.label || '-'
  }
  
  // 获取完整枚举对象的辅助函数
  export function getEnumItem(enumObj, value) {
    return enumObj[value] || null
  }