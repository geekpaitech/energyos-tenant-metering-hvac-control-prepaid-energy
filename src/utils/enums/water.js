/**
 * 水表相关枚举（管理后台）
 */

export const WaterBindType = {
  1: { value: 1, label: '专用表' },
  2: { value: 2, label: '公摊表' },
  3: { value: 3, label: '公式表' }
}

export const WaterChannelType = {
  YYWL_YY: { value: 'YYWL_YY', label: '云翼物联-埃美柯' },
  ZHWL_NS: { value: 'ZHWL_NS', label: '智慧物联-南硕' }
}

export const WaterPayType = {
  0: { value: 0, label: '预付费' },
  1: { value: 1, label: '强控' }
}

export const WaterSwitchSupport = {
  true: { value: true, label: '支持' },
  false: { value: false, label: '不支持' }
}

export const WaterValveStatus = {
  0: { value: 0, label: '关阀' },
  1: { value: 1, label: '开阀' }
}

export const WaterOnlineStatus = {
  0: { value: 0, label: '离线' },
  1: { value: 1, label: '在线' }
}

export const WaterAbnormalType = {
  1: { value: 1, label: '水表离线' },
  2: { value: 2, label: '水表未注册' }
}
