import { groupScreenOss } from '../image/oss'
import { buildMonthlyRanking } from '../utils/monthlyScore'

export const scopeTabs = ['全部', '产业园', '商办', '公寓']
export const timeTabs = ['今日', '本月', '本年']

/** 深拷贝 KPI 初始模板（接口失败时回退） */
export function cloneKpiListTemplate () {
  return kpiList.map(item => ({
    ...item,
    extra: item.extra ? { ...item.extra } : undefined
  }))
}

export const kpiList = [
  { key: 'onlineRate', label: '项目总设备在线率', value: '--', unit: '%', trend: null, trendLabel: '较昨日', icon: 'device', iconSrc: groupScreenOss.zxl },
  { key: 'alarms', label: '待处理告警', extra: { high: '--', mid: '--', low: '--' }, icon: 'alarm', iconSrc: groupScreenOss.bj },
  { key: 'workOrderRate', label: '工单闭环率', value: '--', unit: '%', trend: null, trendLabel: '较昨日', icon: 'order', iconSrc: groupScreenOss.gd },
  { key: 'energyPerArea', label: '单位面积能耗', value: '--', unit: 'kWh/㎡', trend: null, trendLabel: '较昨日', trendGood: true, icon: 'energy', iconSrc: groupScreenOss.mj },
  { key: 'collectionRate', label: '租户水电收缴率', value: '--', unit: '%', trend: null, trendLabel: '较昨日', icon: 'fee', iconSrc: groupScreenOss.sd },
  { key: 'parkingRevenue', label: '停车营收汇总', prefix: '¥', value: '--', trend: null, trendLabel: '较昨日', icon: 'parking', iconSrc: groupScreenOss.tc },
  { key: 'hazardFix', label: '隐患未整改数', value: '--', trend: null, trendLabel: '较昨日', trendIsCount: true, trendGood: true, icon: 'safe', iconSrc: groupScreenOss.dp }
]

export const fireSafety = {
  title: '智慧消防',
  metrics: [
    { label: '今日告警', value: '34', danger: true, trendUp: true },
    { label: '设备在线率', value: '98.2', unit: '%', accent: true },
    { label: '今日巡检', value: '218', accent: true, trendUp: true }
  ]
}

export const powerSafety = {
  title: '配电运维',
  metrics: [
    { label: '今日告警', value: '17', warn: true, trendUp: true },
    { label: '设备在线率', value: '97.3', unit: '%', accent: true },
    { label: '负载率', value: '73.6', unit: '%', accent: true }
  ]
}

export const videoAi = {
  alertCount: 4,
  handledCount: 3,
  handleRate: 75,
  latestEvent: '人员摔倒'
}

export const warehouseManagement = {
  materialCount: 656,
  categoryCount: 14,
  totalPrice: 9000,
  categories: [
    { name: '五金工具', amount: 3267, pct: 36.3 },
    { name: '电工电料', amount: 2016, pct: 22.4 },
    { name: '清洁用品', amount: 1332, pct: 14.8 },
    { name: '安全标识', amount: 891, pct: 9.9 },
    { name: '管道工具', amount: 702, pct: 7.8 },
    { name: '办公用品', amount: 450, pct: 5.0 },
    { name: '其他', amount: 342, pct: 3.8 }
  ]
}

export const energyBreakdown = [
  { name: '电', value: 63.5, amount: '9,066' },
  { name: '水', value: 22.6, amount: '3,233' },
  { name: '燃气', value: 10.2, amount: '1,457' },
  { name: '其他', value: 3.7, amount: '530' }
]

export const energyTotal = { value: '14,286', unit: 'kWh' }

export const tenantPublicRatio = {
  tenant: 71.6,
  public: 28.4,
  tenantKwh: '10,229',
  publicKwh: '4,057'
}

export const collectionProgress = {
  rate: 81.7,
  receivable: '1,326,480',
  collected: '1,083,734',
  uncollected: '242,746'
}

export const parkingStats = {
  enter: '1,124',
  leave: '987',
  onsite: 137,
  revenue: 21480
}

export const workOrderTypes = [
  { name: '报修', value: 44.6, count: 164 },
  { name: '巡检', value: 27.8, count: 102 },
  { name: '服务', value: 18.3, count: 67 },
  { name: '其他', value: 9.3, count: 34 }
]

export const workOrderTotal = 367

export const maintenancePlan = {
  planned: 142,
  completed: 124,
  rate: 87.3
}

export const tenantService = {
  inquiry: 143,
  complaint: 1
}

export const suppliers = [
  { name: '极派信息科技', score: 96, grade: 'A' },
  { name: '明源云', score: 96, grade: 'A' },
  { name: '爱开客', score: 90, grade: 'A' },
  { name: '京苏', score: 90, grade: 'A' }
]

export const benchmarkRows = [
  { metric: '设备在线率', project: '95.4%', industry: '92.8%', rank: '2/5' },
  { metric: '工单闭环率', project: '94.7%', industry: '90.6%', rank: '2/5' },
  { metric: '单位面积能耗', project: '19.6', industry: '22.4', rank: '1/5' },
  { metric: '租户水电收缴率', project: '81.7%', industry: '73.4%', rank: '2/5' },
  { metric: '周转率', project: '--', industry: '--', rank: '--' }
]

/** 雷达图：本项目 vs 行业标杆 */
export const benchmarkRadar = {
  project: [95.4, 94.7, 19.6, 81.7, 97.4],
  industry: [92.8, 90.6, 22.4, 73.4, 96.2]
}

/** 短板预警表格 */
export const shortBoardTable = [
  { metric: '租户水电收缴率', project: '81.7%', industry: '86.8%', gap: '↓ 5.1%', bad: true },
  { metric: '重大隐患整改率', project: '86.4%', industry: '96.8%', gap: '↓ 10.4%', bad: true },
  { metric: '单位面积能耗', project: '19.6', industry: '18.2', gap: '↑ 7.2%', bad: true },
  { metric: '工单闭环率', project: '94.7%', industry: '95.3%', gap: '↓ 0.6%', bad: true }
]

export const shortBoardWarnings = [
  { metric: '租户水电收缴率', gap: '-5.1%', level: 'high' },
  { metric: '重大隐患整改率', gap: '-10.4%', level: 'mid' },
  { metric: '单位面积能耗同比', gap: '+7.2%', level: 'low' }
]

/**
 * 月度综合评分 — 模拟原始统计（按已推送工单）
 * - inspection：巡逻任务（保安/安全/工程/客服等，不含三关一闭）
 * - threeClose：三关一闭巡逻
 * - maintenance：维保巡检
 * - safety：安全问题整改（工单类别含整改/安全类）
 * - quality：品质问题（维修/投诉/咨询/整改工单整改率）
 * 字段：total 总工单、onTime 按时完成、overdue 逾期完成、unexecuted 未执行
 */
export const monthlyRankingRaw = [
  {
    name: '苏旺商务中心',
    mom: '↑2',
    inspection: { total: 200, onTime: 180, overdue: 5, unexecuted: 15 },
    maintenance: { total: 150, onTime: 100, overdue: 30, unexecuted: 20 },
    threeClose: { total: 100, onTime: 70, overdue: 20, unexecuted: 10 },
    safety: { rectificationRate: 0.88, currentUnfinishedRate: 0.06, previousUnfinishedRate: 0.04 },
    quality: { rectificationRate: 0.90, currentUnfinishedRate: 0.05, previousUnfinishedRate: 0.03 }
  },
  {
    name: '塔韵商务广场',
    mom: '↑1',
    inspection: { total: 210, onTime: 186, overdue: 10, unexecuted: 14 },
    maintenance: { total: 155, onTime: 118, overdue: 25, unexecuted: 12 },
    threeClose: { total: 105, onTime: 78, overdue: 15, unexecuted: 12 },
    safety: { rectificationRate: 0.90, currentUnfinishedRate: 0.05, previousUnfinishedRate: 0.03 },
    quality: { rectificationRate: 0.91, currentUnfinishedRate: 0.04, previousUnfinishedRate: 0.03 }
  },
  {
    name: '南都电商产业园',
    mom: '—',
    inspection: { total: 220, onTime: 198, overdue: 8, unexecuted: 10 },
    maintenance: { total: 160, onTime: 128, overdue: 22, unexecuted: 10 },
    threeClose: { total: 110, onTime: 82, overdue: 18, unexecuted: 10 },
    safety: { rectificationRate: 0.92, currentUnfinishedRate: 0.04, previousUnfinishedRate: 0.02 },
    quality: { rectificationRate: 0.94, currentUnfinishedRate: 0.03, previousUnfinishedRate: 0.02 }
  },
  {
    name: '石湖金陵购物中心',
    mom: '↓1',
    inspection: { total: 195, onTime: 170, overdue: 12, unexecuted: 13 },
    maintenance: { total: 148, onTime: 102, overdue: 28, unexecuted: 18 },
    threeClose: { total: 98, onTime: 68, overdue: 18, unexecuted: 12 },
    safety: { rectificationRate: 0.86, currentUnfinishedRate: 0.07, previousUnfinishedRate: 0.05 },
    quality: { rectificationRate: 0.88, currentUnfinishedRate: 0.06, previousUnfinishedRate: 0.04 }
  },
  {
    name: '吴郡睦邻坊',
    mom: '↑1',
    inspection: { total: 188, onTime: 162, overdue: 14, unexecuted: 16 },
    maintenance: { total: 142, onTime: 96, overdue: 30, unexecuted: 22 },
    threeClose: { total: 96, onTime: 64, overdue: 20, unexecuted: 20 },
    safety: { rectificationRate: 0.84, currentUnfinishedRate: 0.08, previousUnfinishedRate: 0.05 },
    quality: { rectificationRate: 0.86, currentUnfinishedRate: 0.07, previousUnfinishedRate: 0.05 }
  },
  {
    name: '吴淞江新邻荟',
    mom: '↓2',
    inspection: { total: 180, onTime: 150, overdue: 18, unexecuted: 22 },
    maintenance: { total: 138, onTime: 90, overdue: 32, unexecuted: 20 },
    threeClose: { total: 92, onTime: 58, overdue: 22, unexecuted: 18 },
    safety: { rectificationRate: 0.82, currentUnfinishedRate: 0.09, previousUnfinishedRate: 0.06 },
    quality: { rectificationRate: 0.84, currentUnfinishedRate: 0.08, previousUnfinishedRate: 0.06 }
  },
  {
    name: '南溪江商务中心',
    mom: '↓1',
    inspection: { total: 165, onTime: 128, overdue: 22, unexecuted: 25 },
    maintenance: { total: 130, onTime: 82, overdue: 35, unexecuted: 23 },
    threeClose: { total: 88, onTime: 50, overdue: 24, unexecuted: 18 },
    safety: { rectificationRate: 0.78, currentUnfinishedRate: 0.10, previousUnfinishedRate: 0.08 },
    quality: { rectificationRate: 0.80, currentUnfinishedRate: 0.09, previousUnfinishedRate: 0.07 }
  }
]

/** 展示用排名（按算法计算后排序） */
export const monthlyRanking = buildMonthlyRanking(monthlyRankingRaw)

export const rectificationTracking = [
  { label: '待整改', count: 29, type: 'pending' },
  { label: '整改中', count: 16, type: 'progress' },
  { label: '已整改', count: 58, type: 'done' },
  { label: '未整改', count: 5, type: 'overdue' }
]

/** 整改跟踪环形图 */
export const rectificationStats = {
  rate: 87.3,
  total: 108,
  completed: 58,
  inProgress: 16,
  notStarted: 29
}
