import { createGroupModel, aggregateSnapshots } from '../energy-map-screen/data'

export const TABS = [
  { id: 'overview', name: '经营总览', icon: 'el-icon-menu', title: '一屏掌握 · 集团全域资产' },
  { id: 'energy', name: '能源与费用', icon: 'el-icon-lightning', title: '能源与费用 · 用能结构与回款进度' },
  { id: 'power', name: '配电运维', icon: 'el-icon-cpu', title: '配电运维 · 风险与闭环效率' },
  { id: 'air', name: '空调运行', icon: 'el-icon-monitor', title: '空调运行 · 能效与舒适度' },
  { id: 'light', name: '照明管理', icon: 'el-icon-sunny', title: '照明管理 · 策略与设备在线' },
  { id: 'parking', name: '停车运营', icon: 'el-icon-truck', title: '停车运营 · 收益与资源利用' },
  { id: 'charge', name: '充电运营', icon: 'el-icon-connection', title: '充电运营 · 收益与设备效能' }
]
export const PERIODS = [{ id: 'month', label: '2026年09月', factor: 1 }, { id: 'last', label: '2026年08月', factor: 0.93 }, { id: 'year', label: '2026年累计', factor: 8.3 }]
// Anchors identify six illustrative building clusters; they are not geographic locations.
const anchors = [[52, 38], [51, 61], [80, 47], [23, 65], [79, 72], [24, 36]]
export function createPortfolio () {
  return createGroupModel().projects.map((p, i) => ({
    ...p,
    anchor: anchors[i],
    ops: {
      rooms: [3, 2, 5, 4, 2, 4][i],
      transformers: [6, 4, 10, 8, 4, 8][i],
      capacity: [8, 5, 14, 12, 5, 10][i],
      load: [0.84, 0.63, 1.48, 1.27, 0.51, 1.09][i],
      health: [96.4, 97.2, 98.1, 96.8, 98.7, 97.4][i],
      closed: [42, 28, 51, 47, 23, 38][i],
      open: [2, 1, 2, 1, 1, 1][i],
      arrears: [8, 4, 12, 9, 3, 7][i],
      cop: [4.72, 4.61, 4.85, 4.58, 4.79, 4.68][i],
      comfort: [98.1, 97.8, 98.6, 97.4, 98.3, 98.2][i],
      lights: [320, 240, 480, 420, 180, 360][i],
      lightOn: [228, 162, 350, 294, 127, 251][i],
      lightFault: [2, 1, 3, 2, 0, 2][i],
      lightCoverage: [94.5, 95.2, 97.1, 94.8, 96.1, 95.7][i],
      spaces: [460, 320, 680, 420, 260, 520][i],
      parkingUsed: [328, 216, 486, 295, 187, 364][i],
      parkingIncome: [96200, 62800, 148600, 78900, 51600, 106800][i],
      plugs: [32, 24, 48, 36, 20, 40][i],
      charging: [12, 8, 19, 14, 7, 15][i],
      chargeFault: [0, 0, 1, 1, 0, 0][i],
      chargeKwh: [28640, 21860, 41280, 32640, 16420, 36780][i],
      chargeIncome: [34368, 26232, 49536, 39168, 19704, 44136][i]
    }
  }))
}
export const num = (v, digits = 0) => Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
export const rate = (a, b) => b ? a / b * 100 : 0
export function aggregatePortfolio (projects, period = 'month') {
  const factor = (PERIODS.find(p => p.id === period) || PERIODS[0]).factor
  const s = aggregateSnapshots(projects.map(p => p.snapshot))
  const sum = key => projects.reduce((n, p) => n + p.ops[key], 0)
  const average = key => projects.length ? sum(key) / projects.length : 0
  const m = { count: projects.length, devices: s.devices.total, online: s.devices.online, offline: s.devices.offline, ac: s.devices.airConditioning.total, acRun: s.devices.airConditioning.running, acStandby: s.devices.airConditioning.standby, acOffline: s.devices.airConditioning.offline, water: Math.round(s.energy.tenantWater * factor), pv: Math.round(s.photovoltaic.generated * factor), self: Math.round(s.photovoltaic.selfUse * factor), exported: Math.round(s.photovoltaic.exported * factor), kwh: Math.round(s.energy.total * factor), tenant: Math.round(s.energy.tenant * factor), fees: Math.round(s.finance.receivable * factor), received: Math.round(s.finance.received * factor), balance: s.finance.balance }
  // Round at project level first so the detail table always adds up to the group KPI.
  ;[['water', 'energy', 'tenantWater'], ['kwh', 'energy', 'total'], ['tenant', 'energy', 'tenant'], ['fees', 'finance', 'receivable'], ['received', 'finance', 'received']].forEach(([key, section, field]) => {
    m[key] = projects.reduce((total, p) => total + Math.round(p.snapshot[section][field] * factor), 0)
  })
  m.grid = m.kwh - m.self
  m.common = m.kwh - m.tenant
  m.outstanding = m.fees - m.received
  m.collection = rate(m.received, m.fees)
  m.selfRate = rate(m.self, m.pv)
  m.greenRate = rate(m.self, m.kwh)
  m.onlineRate = rate(m.online, m.devices)
  ;['rooms', 'transformers', 'capacity', 'load', 'closed', 'open', 'arrears', 'lights', 'lightOn', 'lightFault', 'spaces', 'parkingUsed', 'plugs', 'charging', 'chargeFault'].forEach(key => { m[key] = sum(key) })
  ;['parkingIncome', 'chargeIncome', 'chargeKwh'].forEach(key => { m[key] = projects.reduce((total, p) => total + Math.round(p.ops[key] * factor), 0) })
  ;['health', 'cop', 'comfort', 'lightCoverage'].forEach(key => { m[key] = average(key) })
  m.lightOff = m.lights - m.lightOn - m.lightFault
  m.chargeIdle = m.plugs - m.charging - m.chargeFault
  m.revenue = m.received + m.parkingIncome + m.chargeIncome
  m.risk = m.open
  m.pvPower = projects.some(p => p.hasPv) ? 0.026 : 0
  return m
}
const metric = (label, value, unit, note, tone = '') => ({ label, value, unit, note, tone })
export function kpisFor (tab, m) {
  const n = num; const money = v => n(v / 10000, 2); const energy = v => n(v / 10000, 2)
  const shared = metric('设备在线率', n(m.onlineRate, 1), '%', `${n(m.online)} / ${n(m.devices)} 台在线`, 'mint')
  const configs = {
    overview: [metric('运营实收金额', money(m.revenue), '万元', '能耗费用 · 停车 · 充电'), metric('能耗费用实收率', n(m.collection, 1), '%', '本期实收 / 本期应收', 'mint'), metric('本期综合用电', energy(m.kwh), '万 kWh', '租户与公区合计'), metric('光伏绿电占比', n(m.greenRate, 2), '%', `光伏自用率 ${n(m.selfRate, 1)}%`, 'mint'), shared, metric('待处理风险', n(m.risk), '项', `${m.count} 个项目集中管控`, 'gold')],
    energy: [metric('本期总用电量', energy(m.kwh), '万 kWh', '电网购电 + 光伏自用'), metric('本期租户用水', n(m.water), 'm³', '租户水表汇总'), metric('光伏发电量', n(m.pv), 'kWh', `自用 ${n(m.self)} · 上网 ${n(m.exported)}`, 'mint'), metric('本期应收费用', money(m.fees), '万元', '电费 / 水费'), metric('本期实收费用', money(m.received), '万元', `费用实收率 ${n(m.collection, 1)}%`, 'mint'), metric('本期待收余额', money(m.outstanding), '万元', `${m.arrears} 户待收租户`, 'gold')],
    power: [metric('集中值守配电房', m.rooms, '座', `${m.count} 个项目统一接入`), metric('变压器总量', m.transformers, '台', `${n(m.capacity, 1)} MVA 总容量`), metric('当前运行负荷', n(m.load, 2), 'MW', `负载率 ${n(rate(m.load, m.capacity), 1)}%`), metric('待处理风险', m.risk, '项', '预警到处置', 'gold'), metric('已闭环工单', m.closed, '单', `闭环率 ${n(rate(m.closed, m.closed + m.open), 1)}%`, 'mint'), shared],
    air: [metric('空调内机总量', n(m.ac), '台', `${m.acRun} 台运行中`), metric('综合能效 COP', n(m.cop, 2), '', '演示能效评估'), metric('空调运行率', n(rate(m.acRun, m.ac), 1), '%', '按需运行'), metric('舒适达标率', n(m.comfort, 1), '%', '温湿度达标', 'mint'), metric('本期空调用电', energy(m.tenant * 0.3), '万 kWh', '租户用电的 30%'), metric('离线空调内机', m.acOffline, '台', '等待采集链路排查', 'gold')],
    light: [metric('接入照明回路', n(m.lights), '路', '统一照明管理'), metric('点亮回路', n(m.lightOn), '路', `点亮率 ${n(rate(m.lightOn, m.lights), 1)}%`), metric('关闭回路', n(m.lightOff), '路', '按时段控制'), metric('策略覆盖率', n(m.lightCoverage, 1), '%', '分区 / 感应联动', 'mint'), metric('异常照明回路', m.lightFault, '路', '巡检跟踪', 'gold'), metric('本期照明用电', energy(m.common * 0.18), '万 kWh', '公区用电的 18%')],
    parking: [metric('本期停车收入', money(m.parkingIncome), '万元', '按统计周期汇总'), metric('接入总车位', n(m.spaces), '个', `${m.count} 个项目`), metric('当前在场车辆', n(m.parkingUsed), '辆', `利用率 ${n(rate(m.parkingUsed, m.spaces), 1)}%`), metric('当前剩余车位', n(m.spaces - m.parkingUsed), '个', '当前运行快照', 'mint'), metric('本期通行车次', n(Math.round(m.parkingIncome / 8)), '车次', '模拟通行统计'), metric('车位利用率', n(rate(m.parkingUsed, m.spaces), 1), '%', '在场车辆 / 总车位')],
    charge: [metric('本期充电收入', money(m.chargeIncome), '万元', '按统计周期汇总'), metric('接入充电枪', n(m.plugs), '把', `${m.count} 个项目`), metric('本期充电量', energy(m.chargeKwh), '万 kWh', '计量充电电量'), metric('正在充电', m.charging, '把', `利用率 ${n(rate(m.charging, m.plugs), 1)}%`, 'mint'), metric('空闲充电枪', m.chargeIdle, '把', '可用资源'), metric('异常充电枪', m.chargeFault, '把', '等待排查', 'gold')]
  }
  return configs[tab] || configs.overview
}

export function reportFor (tab, m, projects, period, energyView = 'supply') {
  const load = [0.46, 0.42, 0.51, 0.54, 0.49, 0.63, 0.59, 0.57, 0.7, 0.67, 0.72, 0.65, 0.76, 0.73, 0.79, 0.82, 0.75, 0.85, 0.81, 0.87, 0.83]
  const isFee = tab === 'energy' && energyView === 'fees'
  const monthly = isFee || ['parking', 'charge'].includes(tab)
  const configs = {
    energy: isFee ? ['累计费用回款进度', '万元', m.received / 10000, 'collection', '费用实收率', '%', '预充值留存单独列示，不计入费用实收。'] : ['日内供需负荷趋势', 'MW', m.load * 1.2, 'kwh', '本期项目用电', '万 kWh', '电网购电 + 光伏自用 = 项目用电；光伏发电 = 自用 + 余电上网。'],
    power: ['日内配电负荷趋势', 'MW', m.load * 1.2, 'health', '运行健康度', '分', '统一巡视、风险跟踪、现场处置、复核闭环。'],
    air: ['日内空调运行负荷', 'MW', m.load * 0.42, 'cop', '综合能效 COP', '', '结合运行率、能效及舒适达标率，观察空调运行质量。'],
    light: ['日内照明点亮率', '%', 100, 'lightCoverage', '策略覆盖率', '%', '按分区和时段管理照明，跟踪异常回路。'],
    parking: ['本期每日停车收入', '万元', m.parkingIncome / 10000 / (period === 'year' ? 9 : 21), 'parkingIncome', '本期停车收入', '万元', '收入按统计周期汇总；在场车辆与余位为当前运行快照。'],
    charge: ['本期每日充电收入', '万元', m.chargeIncome / 10000 / (period === 'year' ? 9 : 21), 'chargeIncome', '本期充电收入', '万元', '充电收入、充电量与设备使用状态统一展示。']
  }
  const c = configs[tab] || configs.power
  let values = tab === 'light' ? [0.8, 0.82, 0.81, 0.77, 0.6, 0.38, 0.27, 0.2, 0.18, 0.2, 0.25, 0.3, 0.3, 0.27, 0.37, 0.49, 0.65, 0.82, 0.91, 0.88, 0.85] : load
  if (monthly) {
    const length = period === 'year' ? 9 : 22
    values = Array.from({ length }, (_, i) => load[Math.round(i * (load.length - 1) / (length - 1))])
    if (isFee) values = values.map((v, i) => (i + 1) / length)
  } else {
    const original = values
    values = Array.from({ length: 25 }, (_, i) => original[Math.round(i * (original.length - 1) / 24)])
  }
  let series = [{ name: isFee ? '累计实收' : c[0].replace('趋势', ''), values: values.map(v => Number((v * c[2]).toFixed(3))), color: '#63d9c1' }]
  if (['parking', 'charge'].includes(tab)) {
    const amount = tab === 'parking' ? m.parkingIncome : m.chargeIncome
    const weights = values.reduce((sum, v) => sum + v, 0)
    const cents = values.map(v => Math.floor(v / weights * amount))
    cents[cents.length - 1] += amount - cents.reduce((sum, v) => sum + v, 0)
    series[0].values = cents.map(v => v / 10000)
    if (period === 'year') c[0] = c[0].replace('每日', '月度')
  }
  if (tab === 'energy' && !isFee) {
    const solar = values.map((v, i) => Number((i >= 6 && i <= 18 ? Math.max(0, Math.sin((i - 6) / 12 * Math.PI)) * m.pvPower : 0).toFixed(3)))
    series[0].name = '项目负荷'
    series = [...series, { name: '光伏出力', values: solar, color: '#d9bc82' }, { name: '电网供给', values: series[0].values.map((v, i) => Number((v - solar[i]).toFixed(3))), color: '#72b6ef', dashed: true }]
  }
  const ranked = projects.map(p => { const pm = aggregatePortfolio([p], period); const raw = pm[c[3]]; const value = ['kwh', 'parkingIncome', 'chargeIncome'].includes(c[3]) ? raw / 10000 : raw; return { ...p, value } }).sort((a, b) => b.value - a.value)
  return { title: c[0], unit: c[1], rankLabel: c[4], rankUnit: c[5], note: c[6], series, ranked, labels: values.map((v, i) => monthly ? period === 'year' ? `${i + 1}月` : `${String(i + 1).padStart(2, '0')}日` : `${String(i).padStart(2, '0')}:00`) }
}
