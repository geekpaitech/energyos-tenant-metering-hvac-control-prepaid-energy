const state = {
  airBindType: [
    { value: 1, label: '专用' },
    { value: 2, label: '公摊' }
  ],
  airDeviceType: [
    { value: 1, label: '多联机' }
  ],
  powerStatus: [
    { value: 0, label: '关闭' },
    { value: 1, label: '开启' }
  ],
  operationMode: [
    { value: 0, label: '自动' },
    { value: 1, label: '制热' },
    { value: 2, label: '制冷' },
    { value: 4, label: '送风' },
    { value: 8, label: '除湿' }
  ],
  fanSpeed: [
    { value: 0, label: '自动' },
    { value: 1, label: '低风' },
    { value: 2, label: '中风' },
    { value: 3, label: '高风' }
  ],
  lockPowerStatus: [
    { value: 0, label: '不锁定' },
    { value: 128, label: '关机' },
    { value: 129, label: '开机' }
  ],
  lockOperationMode: [
    { value: 0, label: '不锁定' },
    { value: 129, label: '制热' },
    { value: 130, label: '制冷' },
    { value: 132, label: '送风' },
    { value: 136, label: '除湿' }
  ],
  lockFanSpeed: [
    { value: 0, label: '不锁定' },
    { value: 128, label: '自动' },
    { value: 129, label: '低风' },
    { value: 130, label: '中风' },
    { value: 131, label: '高风' }
  ],
  airlogType: [
    { value: 1, label: '开关' },
    { value: 2, label: '模式' },
    { value: 3, label: '锁定' }
  ],
  taskWeek: [
    { label: '周一', value: '1' },
    { label: '周二', value: '2' },
    { label: '周三', value: '3' },
    { label: '周四', value: '4' },
    { label: '周五', value: '5' },
    { label: '周六', value: '6' },
    { label: '周日', value: '7' }
  ],
  airStatus: {
    0: { label: '在线', class: 'success' },
    1: { label: '离线', class: 'danger' }
  },
  airGatewayChannel: [
    { value: 1, label: '智精灵' },
    { value: 2, label: '飞奕' }
  ],
  airBillingMode: [
    { value: 1, label: '不计费' },
    { value: 2, label: '时长计费' }
  ]
}

export default {
  namespaced: true,
  state
}
