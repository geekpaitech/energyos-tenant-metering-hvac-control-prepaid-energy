// @/utils/enums/withdraw.js

// 提现进度状态
export const WithdSchedule = [
  {
    label: '集团审核中',
    value: 4
  },
  {
    label: '平台审核中',
    value: 1
  },
  {
    label: '待打款',
    value: 6
  },
  {
    label: '手续费待支付',
    value: 5
  },
  {
    label: '已完成',
    value: 2
  },
  {
    label: '集团已拒绝',
    value: 7
  },
  {
    label: '平台已拒绝',
    value: 3
  }
]

// 提现类型
export const WithdType = [
  { label: '日结提现', value: 0 },
  { label: '余额提现', value: 1 }
]

// 存款类型
export const DepositType = [
  { label: '电费', value: 1 },
  { label: '水费', value: 3 }
]

// 通用获取枚举标签的方法
export function getEnumLabel (enumData, value) {
  if (value === null || value === undefined) return '-'
  const item = enumData.find(e => e.value == value)
  return item ? item.label : '-'
}

// 通用获取枚举项的方法
export function getEnumItem (enumData, value) {
  if (value === null || value === undefined) return null
  return enumData.find(e => e.value == value) || null
}
