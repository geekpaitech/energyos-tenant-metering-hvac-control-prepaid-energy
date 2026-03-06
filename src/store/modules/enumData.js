

const state = {
  // 空调公摊类型
  airBindType: [
    { value: 1, label: '专用' },
    { value: 2, label: '公摊' }
  ],
  
  // 空调设备类型
  airDeviceType: [
    { value: 1, label: '多联机' }
  ],
  
  // 空调开关
  powerStatus: [
    { value: 0, label: '关闭' },
    { value: 1, label: '开启' }
  ],
  
  // 空调模式
  operationMode: [
     { value: 0, label: '自动' },
    { value: 1, label: '制热' },
    { value: 2, label: '制冷' },
    { value: 4, label: '送风' },
    { value: 8, label: '除湿' }
  ],
  
  // 空调风速
  fanSpeed: [
    { value: 0, label: '自动' },
    { value: 1, label: '低风' },
    { value: 2, label: '中风' },
    { value: 3, label: '高风' }
  ],
  
  // 空调开关锁定
  lockPowerStatus: [
    { value: 0, label: '不锁定' },
    { value: 128, label: '关机' },
    { value: 129, label: '开机' }
  ],
  
  // 空调模式锁定
  lockOperationMode: [
    { value: 0, label: '不锁定' },
    { value: 129, label: '制热' },
    { value: 130, label: '制冷' },
    { value: 132, label: '送风' },
    { value: 136, label: '除湿' }
  ],
  
  // 空调风速锁定
  lockFanSpeed: [
    { value: 0, label: '不锁定' },
    { value: 128, label: '自动' },
    { value: 129, label: '低风' },
    { value: 130, label: '中风' },
    { value: 131, label: '高风' }
  ],
  
  // 空调控制历史记录类型
  airlogType: [
    { value: 1, label: '开关' },
    { value: 2, label: '模式' },
    { value: 3, label: '锁定' }
  ],
  
  // 定时周期
  taskWeek: [
    { label: '周一', value: '1' },
    { label: '周二', value: '2' },
    { label: '周三', value: '3' },
    { label: '周四', value: '4' },
    { label: '周五', value: '5' },
    { label: '周六', value: '6' },
    { label: '周日', value: '7' }
  ]
};

const mutations = {};

const actions = {};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};