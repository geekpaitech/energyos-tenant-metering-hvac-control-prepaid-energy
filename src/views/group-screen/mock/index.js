import { groupScreenOss } from '../image/oss'

export const scopeTabs = ['全部', '产业园', '商办', '公寓']
export const timeTabs = ['今日', '本月', '截至当前']

/** 深拷贝 KPI 初始模板（接口失败时回退） */
export function cloneKpiListTemplate () {
  return kpiList.map(item => ({
    ...item,
    extra: item.extra ? { ...item.extra } : undefined
  }))
}

export const kpiList = [
  { key: 'onlineRate', label: '项目总设备在线率', value: '--', unit: '%', trend: null, trendLabel: '较昨日', icon: 'device', iconSrc: groupScreenOss.zxl },
  { key: 'alarms', label: '消防警告', extra: { high: '--', mid: '--', low: '--' }, icon: 'alarm', iconSrc: groupScreenOss.bj },
  { key: 'workOrderRate', label: '巡检工单闭环率', value: '--', unit: '%', trend: null, trendLabel: '较昨日', icon: 'order', iconSrc: groupScreenOss.gd },
  { key: 'energyPerArea', label: '单位面积能耗', value: '--', unit: 'kWh/㎡', trend: null, trendLabel: '较昨日', trendGood: true, icon: 'energy', iconSrc: groupScreenOss.mj },
  { key: 'collectionRate', label: '租户水电收缴率', value: '--', unit: '%', trend: null, trendLabel: '较昨日', icon: 'fee', iconSrc: groupScreenOss.sd },
  { key: 'parkingTurnover', label: '车位周转率', value: '--', unit: '次/车位', trend: null, trendLabel: '较昨日', icon: 'parking', iconSrc: groupScreenOss.tc },
  { key: 'hazardFix', label: '安全/品质未整改数', value: '--', trend: null, trendLabel: '较昨日', trendIsCount: true, trendGood: true, icon: 'safe', iconSrc: groupScreenOss.dp }
]

export const powerSafety = {
  title: '配电运维',
  metrics: [
    { label: '今日告警', value: '--' },
    { label: '设备在线率', value: '--' },
    { label: '负载率', value: '--' }
  ]
}
