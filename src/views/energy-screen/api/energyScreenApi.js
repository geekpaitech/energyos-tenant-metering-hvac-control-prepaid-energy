/**
 * 综合能源管理大屏 — 新接口层
 * 4 个新 API + 光伏
 */
import moment from 'moment'
import request from '@/utils/request'
import { GRID_ROOT } from '@/config/services'
import { mapStationToEnergyFlow } from '@/utils/energyFlowMapper'
import { BIZ_TYPE_MAP, NANDU_MANAGER_ID } from '../config'
import { applyEnergyScreenMock } from '../mock/energyScreenMock'

// ── 常量 ────────────────────────────────────────────
const ENERGY_SCREEN_BASE = '/api/ebc-content/energyScreen'
const PHOTOVOLTAIC_SERVICE_URL = GRID_ROOT

const ENERGY_SCREEN_HEADERS = {
  userDeviceType: 'PC',
  'Content-Type': 'application/json'
}

// ── 请求工具 ────────────────────────────────────────
function internalPost (url, { data, params } = {}) {
  return request({
    url,
    method: 'post',
    data,
    params,
    headers: ENERGY_SCREEN_HEADERS,
    skipErrorMessage: true
  })
}

function responseData (result) {
  if (!result || result.status !== 'fulfilled' || !result.value) return null
  const body = result.value
  if (body && String(body.code) === '200') return body.data
  return null
}

// ── 数值工具 ────────────────────────────────────────
function periodLabel (period) {
  switch (period) {
    case 'month': return '本月'
    case 'year': return '本年'
    default: return '今日'
  }
}
function numberOrNull (value) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function firstNumber (...values) {
  for (const value of values) {
    const num = numberOrNull(value)
    if (num !== null) return num
  }
  return null
}

function sumNumbers (values) {
  const numbers = values.map(numberOrNull).filter(v => v !== null)
  return numbers.length ? numbers.reduce((s, v) => s + v, 0) : null
}

function percent (value, total) {
  const current = numberOrNull(value)
  const denominator = numberOrNull(total)
  if (current === null || denominator === null || denominator <= 0) return 0
  return Math.max(0, Math.min(100, Number(((current / denominator) * 100).toFixed(1))))
}

function wholePercentPair (firstValue, secondValue) {
  const first = Math.max(0, numberOrNull(firstValue) || 0)
  const second = Math.max(0, numberOrNull(secondValue) || 0)
  const total = first + second
  if (total <= 0) return [0, 0]
  if (first <= 0) return [0, 100]
  if (second <= 0) return [100, 0]
  const firstPercent = Math.max(1, Math.min(99, Math.round((first / total) * 100)))
  return [firstPercent, 100 - firstPercent]
}

function moneyText (value) {
  const num = numberOrNull(value)
  return num === null ? '--' : `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function metricText (value, digits, unit) {
  const num = numberOrNull(value)
  return num === null ? '--' : `${num.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${unit}`
}

function energyToKwh (value, unit = 'kWh') {
  const num = numberOrNull(value)
  if (num === null) return null
  const normalized = String(unit || 'kWh').toLowerCase()
  if (normalized === 'mwh') return num * 1000
  if (normalized === 'wh') return num / 1000
  return num
}

function kgToTon (value) {
  const num = numberOrNull(value)
  return num === null ? null : num / 1000
}

// ── 日期工具 ────────────────────────────────────────
function todayEnd () { return moment().format('YYYY-MM-DD') + ' 23:59:59' }
function todayBegin () { return moment().format('YYYY-MM-DD') + ' 00:00:00' }
function monthBegin () { return moment().startOf('month').format('YYYY-MM-DD') + ' 00:00:00' }
function yearBegin () { return moment().startOf('year').format('YYYY-MM-DD') + ' 00:00:00' }

// ── DTO 构建 ────────────────────────────────────────
/**
 * @param {string|null} managerId  管理方ID（集团模式传 null）
 * @param {string}      business   业态 key（all/industrial/office/apartment）
 * @param {string}      period     时间粒度（day/month/year）
 */
function buildDto (managerId, business, period) {
  const bizType = BIZ_TYPE_MAP[business]
  let startTime
  switch (period) {
    case 'month':
      startTime = monthBegin()
      break
    case 'year':
      startTime = yearBegin()
      break
    default:
      startTime = todayBegin()
  }
  const dto = { startTime, endTime: todayEnd() }
  // 仅集团模式下传 bizType，选中管理方后不传
  if (bizType != null && managerId == null) dto.bizType = bizType
  if (managerId != null) {
    dto.managerId = Number(managerId)
    dto.firstPermissionMaId = Number(managerId)
  }
  return dto
}

// ══════════════════════════════════════════════════════
//  新接口
// ══════════════════════════════════════════════════════

/** 1. 能源大屏设备顶部统计 */
function queryDeviceTopStatistics (dto) {
  return internalPost(`${ENERGY_SCREEN_BASE}/getDeviceTopStatistics`, { data: dto })
}

/** 2. 能源大屏用能趋势统计（近7日 + 今日实时） */
function queryEnergyTrend (dto) {
  return internalPost(`${ENERGY_SCREEN_BASE}/getEnergyTrend`, { data: dto })
}

/** 3. 能源大屏费用构成 */
function queryFeeComposition (dto) {
  return internalPost(`${ENERGY_SCREEN_BASE}/getFeeComposition`, { data: dto })
}

/** 4. 租户与公区能耗拆分 */
function queryShareEnergy (dto) {
  return internalPost(`${ENERGY_SCREEN_BASE}/getShareEnergy`, { data: dto })
}

// ══════════════════════════════════════════════════════
//  沿用旧接口
// ══════════════════════════════════════════════════════

/** 光伏电站详情 — day（仅南都 & 集团），跨域请求，不走 request 拦截器 */
function queryPhotovoltaicStation () {
  return fetch(`${PHOTOVOLTAIC_SERVICE_URL}/api/station/detail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).then(res => res.json()).catch(err => {
    console.error('[energy-screen] photovoltaic fetch failed', err)
    return null
  })
}

/** 光伏电站 — month: POST /api/station/month  body: { month, timeZone: 8 } */
function queryPhotovoltaicStationMonth (month) {
  return fetch(`${PHOTOVOLTAIC_SERVICE_URL}/api/station/month`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, timeZone: 8 })
  }).then(res => res.json()).catch(err => {
    console.error('[energy-screen] photovoltaic month fetch failed', err)
    return null
  })
}

/** 光伏电站 — year: POST /api/station/year  body: { year, timeZone: 8 } */
function queryPhotovoltaicStationYear (year) {
  return fetch(`${PHOTOVOLTAIC_SERVICE_URL}/api/station/year`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, timeZone: 8 })
  }).then(res => res.json()).catch(err => {
    console.error('[energy-screen] photovoltaic year fetch failed', err)
    return null
  })
}

// ── 光伏月/年数据聚合 ──────────────────────────────────

function sumField (records, key) {
  if (!Array.isArray(records) || records.length === 0) return 0
  return records.reduce((s, r) => s + (Number(r && r[key]) || 0), 0)
}

/** 带 pec（精度因子）求和的版本，如 energyPec / moneyPec */
function sumFieldWithPec (records, key, pecKey) {
  if (!Array.isArray(records) || records.length === 0) return 0
  return records.reduce((s, r) => {
    const val = Number(r && r[key]) || 0
    const pec = Number(r && r[pecKey]) || 1
    return s + val * pec
  }, 0)
}

/**
 * 将 /api/station/month 返回的逐日记录汇总为伪 station 对象，
 * 供 mapStationToEnergyFlow(…, { period: 'month' }) 读取 monthEnergy 等字段。
 * 注意：锦浪接口的 energy / money 字段需乘以对应的 pec 因子。
 */
function aggregateMonthRecords (records) {
  return {
    monthEnergy: sumFieldWithPec(records, 'energy', 'energyPec'),
    monthEnergyStr: 'MWh',
    homeLoadMonthEnergy: sumFieldWithPec(records, 'homeLoadEnergy', 'energyPec'),
    homeLoadMonthEnergyStr: 'MWh',
    gridPurchasedMonthEnergy: sumFieldWithPec(records, 'gridPurchasedEnergy', 'energyPec'),
    gridPurchasedMonthEnergyStr: 'MWh',
    gridSellMonthEnergy: sumFieldWithPec(records, 'gridSellEnergy', 'energyPec'),
    gridSellMonthEnergyStr: 'MWh',
    monthInCome: sumFieldWithPec(records, 'money', 'moneyPec'),
    monthInComeUnit: '元',
    fullHour: sumField(records, 'fullHour'),
    power: 0,
    familyLoadPower: 0,
    psum: 0,
    batteryPower: 0
  }
}

/**
 * 将 /api/station/year 返回的逐月记录汇总为伪 station 对象，
 * 供 mapStationToEnergyFlow(…, { period: 'year' }) 读取 yearEnergy 等字段。
 * 注意：year 接口的 moneyPec 为 0.0001（单位万元），需应用。
 */
function aggregateYearRecords (records) {
  return {
    yearEnergy: sumFieldWithPec(records, 'energy', 'energyPec'),
    yearEnergyStr: 'MWh',
    homeLoadYearEnergy: sumFieldWithPec(records, 'homeLoadEnergy', 'energyPec'),
    homeLoadYearEnergyStr: 'MWh',
    gridPurchasedYearEnergy: sumFieldWithPec(records, 'gridPurchasedEnergy', 'energyPec'),
    gridPurchasedYearEnergyStr: 'MWh',
    gridSellYearEnergy: sumFieldWithPec(records, 'gridSellEnergy', 'energyPec'),
    gridSellYearEnergyStr: 'MWh',
    yearInCome: sumFieldWithPec(records, 'money', 'moneyPec'),
    yearInComeUnit: '万元',
    fullHour: sumField(records, 'fullHour'),
    power: 0,
    familyLoadPower: 0,
    psum: 0,
    batteryPower: 0
  }
}

// ══════════════════════════════════════════════════════
//  数据归一化
// ══════════════════════════════════════════════════════

function normalizeDeviceSummary (raw) {
  const source = raw || {}
  const meter = firstNumber(source.meterCount)
  const water = firstNumber(source.waterCount)
  const air = firstNumber(source.airCount)
  const meterOffline = firstNumber(source.meterOfflineCount)
  const waterOffline = firstNumber(source.waterOfflineCount)
  const airOffline = firstNumber(source.airOfflineCount)
  const hasData = ['meterCount', 'waterCount', 'airCount'].some(k => numberOrNull(source[k]) !== null)
  const total = hasData ? (meter || 0) + (water || 0) + (air || 0) : null
  const offline = hasData ? (meterOffline || 0) + (waterOffline || 0) + (airOffline || 0) : null
  const online = total === null ? null : Math.max(0, total - offline)
  return { meter, water, air, total, online, offline }
}

function normalizeTrendRecords (raw, period = 'day') {
  const list = Array.isArray(raw) ? raw : []
  const records = list
    .filter(item => item && item.date)
    .sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf())

  const usage = records.map(item => numberOrNull(item.useElec))
  const fee = records.map(item => numberOrNull(item.balance))
  const finiteUsage = usage.filter(v => v !== null)

  let dates
  switch (period) {
    case 'year':
      dates = records.map(item => moment(item.date).format('M月'))
      break
    case 'month':
      dates = records.map(item => moment(item.date).format('DD'))
      break
    default:
      dates = records.map(item => moment(item.date).format('MM/DD'))
  }

  return {
    records,
    dates,
    usage,
    fee,
    total: finiteUsage.length ? finiteUsage.reduce((s, v) => s + v, 0) : null
  }
}

function normalizeWeather (station) {
  const source = station || {}
  const day = source.condTxtD || source.condTxt || ''
  const night = source.condTxtN || ''
  const text = [...new Set([day, night].filter(Boolean))].join('-') || '--'
  const min = source.tmpMin
  const max = source.tmpMax
  const unit = source.tmpUnit || '℃'
  const temperature = (min != null && min !== '' && max != null && max !== '')
    ? `${min}${unit}~${max}${unit}`
    : '--'
  return { text, temperature }
}

// ══════════════════════════════════════════════════════
//  KPI 构建
// ══════════════════════════════════════════════════════

/** 大数值自动缩放：>10000 kWh → MWh，>10000 元 → 万元 */
function autoScale (value, unit, digits) {
  if (value === null || value === undefined) return { value: null, unit, digits }
  const num = Number(value)
  if (!Number.isFinite(num)) return { value: null, unit, digits }
  if (unit === 'kWh' && num >= 10000) {
    return { value: num / 1000, unit: 'MWh', digits: 2 }
  }
  if ((!unit || unit === '元') && num >= 10000) {
    return { value: num / 10000, unit: '万元', digits: 2 }
  }
  return { value: num, unit, digits }
}

function createKpis ({ todayUse, todayCost, pvEnergy, pvPower, pvIncome, devices, carbon, trees }, period) {
  const label = periodLabel(period)
  const greenRate = percent(pvEnergy, todayUse)
  const onlineRate = percent(devices.online, devices.total)

  const powerScaled = autoScale(todayUse, 'kWh', 2)
  const solarScaled = autoScale(pvEnergy, 'kWh', 1)
  const costScaled = autoScale(todayCost, '', 2)

  return [
    { key: 'power', label: `${label}总用电`, value: powerScaled.value, digits: powerScaled.digits, unit: powerScaled.unit, noteLabel: '', note: '', icon: 'bolt', tone: 'blue' },
    { key: 'solar', label: `${label}光伏发电`, value: solarScaled.value, digits: solarScaled.digits, unit: solarScaled.unit, noteLabel: '当前功率', note: metricText(pvPower, 2, 'kW'), icon: 'solar', tone: 'gold' },
    { key: 'green', label: '绿电占比', value: todayUse === null || pvEnergy === null ? null : greenRate, digits: 1, unit: '%', noteLabel: '绿电用电', note: metricText(pvEnergy, 1, 'kWh'), icon: 'pie', tone: 'green' },
    { key: 'cost', label: `${label}租户电费`, value: costScaled.value, digits: costScaled.digits, prefix: '¥', unit: costScaled.unit, noteLabel: `${label}绿电收益`, note: moneyText(pvIncome), icon: 'yuan', tone: 'violet' },
    { key: 'online', label: '设备在线率', value: devices.total === null ? null : onlineRate, digits: 0, unit: '%', noteLabel: '在线设备', note: devices.total === null ? '--' : `${devices.online.toLocaleString('zh-CN')} / ${devices.total.toLocaleString('zh-CN')}`, icon: 'monitor', tone: 'cyan' },
    { key: 'carbon', label: 'CO₂减排', value: carbon, digits: 2, unit: 't', noteLabel: '等效植树', note: trees === null ? '--' : `${trees.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 棵`, icon: 'leaf', tone: 'green' }
  ]
}

// ══════════════════════════════════════════════════════
//  骨架（渲染占位）
// ══════════════════════════════════════════════════════

export function createEnergyScreenSkeleton () {
  const u = null // unavailable
  return {
    weather: { text: '--', temperature: '--' },
    kpis: createKpis({ todayUse: u, todayCost: u, pvEnergy: u, pvPower: u, pvIncome: u, devices: { total: u, online: u }, carbon: u, trees: u }, 'day'),
    left: {
      trend: { total: u, dates: [], usage: [], fee: [] },
      structure: { total: u, items: [] },
      costs: { total: u, items: [] }
    },
    flow: {
      grid: { title: '电网', icon: 'tower', energy: u, cost: u },
      photovoltaic: { title: '光伏电站', icon: 'solar', energy: u, power: u },
      center: { title: '园区配电中心', purchased: u, generated: u },
      destinations: [
        { key: 'air', title: '空调系统', icon: 'air', usage: u, percent: 0, tone: 'cyan' },
        { key: 'tenant', title: '租户区域', icon: 'building', usage: u, percent: 0, tone: 'teal' },
        { key: 'public', title: '公区照明/动力', icon: 'bulb', usage: u, percent: 0, tone: 'gold' }
      ],
      totalLoad: u,
      realtimePower: u
    },
    right: {
      powerSafety: {
        cells: [
          { key: 'transformerLoad', label: '变压器负载率', value: u, unit: '%', icon: 'load', tone: 'cyan', status: '--', statusTone: 'ok' },
          { key: 'maxTemp', label: '最高测点温度', value: u, unit: '℃', icon: 'peak-temperature', tone: 'gold', status: '--', statusTone: 'ok' },
          { key: 'groundResistance', label: '接地电阻', value: u, unit: 'Ω', icon: 'ground', tone: 'green', status: '--', statusTone: 'ok' },
          { key: 'maxResidual', label: '最大剩余电流', value: u, unit: 'mA', icon: 'residual', tone: 'violet', status: '--', statusTone: 'ok' }
        ]
      },
      alarm: { list: [] }
    },
    footer: {
      environmentPanel: [
        { key: 'temperature', label: '当前温度', value: u, unit: '℃', icon: 'thermometer', tone: 'cyan', status: '--', statusTone: 'ok' },
        { key: 'humidity', label: '当前湿度', value: u, unit: '%', icon: 'drop', tone: 'blue', status: '--', statusTone: 'ok' },
        { key: 'smoke', label: '烟雾报警器', value: u, unit: '', icon: 'smoke', tone: 'gold', status: '--', statusTone: 'ok' },
        { key: 'flood', label: '水浸', value: u, unit: '', icon: 'flood', tone: 'blue', status: '--', statusTone: 'ok' }
      ],
      achievements: [
        { label: 'CO₂减排', value: u, unit: 't', icon: 'co2', tone: 'green' },
        { label: '等效植树', value: u, unit: '棵', icon: 'leaf', tone: 'green' },
        { label: '节约标准煤', value: u, unit: 't', icon: 'coal', tone: 'gold' }
      ],
      environment: [
        { label: '天气', value: '--', unit: '', icon: 'cloud' },
        { label: '温度', value: '--', unit: '', icon: 'thermometer' },
        { label: '湿度', value: u, unit: '%', icon: 'drop' },
        { label: '风速', value: '--', unit: '', icon: 'wind' }
      ]
    }
  }
}

// ══════════════════════════════════════════════════════
//  主数据聚合
// ══════════════════════════════════════════════════════

/**
 * 聚合综合能源大屏全部真实数据。
 * @param {string|null} managerId  管理方ID（集团模式传 null）
 * @param {object}      opts       { business, period }
 */
export async function getEnergyScreenOverview (managerId, opts = {}) {
  const { business = 'all', period = 'day' } = opts
  const dto = buildDto(managerId, business, period)

  // 光伏：集团模式（含南都）或当前管理方为南都时才请求
  const isPhotovoltaicAvailable = !managerId || String(managerId) === NANDU_MANAGER_ID

  // 始终取 day 电站详情，用于实时功率（月/年无功率字段）
  const dayStationPromise = isPhotovoltaicAvailable ? queryPhotovoltaicStation() : Promise.resolve(null)

  // 月/年单独取 energy 数据，day 时复用 dayStationPromise
  let energyPromise
  if (isPhotovoltaicAvailable && (period === 'month' || period === 'year')) {
    energyPromise = period === 'month'
      ? queryPhotovoltaicStationMonth(moment().format('YYYY-MM'))
      : queryPhotovoltaicStationYear(moment().format('YYYY'))
  } else {
    energyPromise = Promise.resolve(null)
  }

  const results = await Promise.allSettled([
    queryEnergyTrend(dto),
    queryShareEnergy(dto),
    queryFeeComposition(dto),
    queryDeviceTopStatistics(dto),
    dayStationPromise, // [4] day 实时功率
    energyPromise // [5] month/year energy 聚合（day 时为 null）
  ])

  // ── 结果提取 ──
  const trendRaw = responseData(results[0])
  const shareRaw = responseData(results[1])
  const feeRaw = responseData(results[2])
  const deviceRaw = responseData(results[3])

  // day 电站详情（含实时功率、天气、环保等）
  const hasDayStation = isPhotovoltaicAvailable && results[4].status === 'fulfilled' && !!results[4].value
  const dayStationRaw = hasDayStation ? results[4].value : null
  const dayStation = dayStationRaw && dayStationRaw.data ? (dayStationRaw.data.data || dayStationRaw.data) : dayStationRaw

  // 月/年 energy 聚合（day 时直接用 dayStation）
  const hasEnergyStation = isPhotovoltaicAvailable && results[5].status === 'fulfilled' && !!results[5].value
  const energyStationRaw = hasEnergyStation ? results[5].value : null

  let station
  if (period === 'month' || period === 'year') {
    if (hasEnergyStation) {
      const records = energyStationRaw && energyStationRaw.data ? (energyStationRaw.data.data || []) : []
      station = period === 'month' ? aggregateMonthRecords(records) : aggregateYearRecords(records)
    }
  } else {
    station = dayStation
  }
  const hasStation = period === 'day' ? hasDayStation : hasEnergyStation

  // ── 趋势 ──
  const trend = normalizeTrendRecords(trendRaw, period)

  // ── 能耗拆分 ──
  const share = shareRaw || {}
  const tenantValue = firstNumber(share.tenantValue)
  const tenantAirValue = firstNumber(share.tenantAirValue)
  const publicValue = firstNumber(share.publicValue)
  const publicAirValue = firstNumber(share.publicAirValue)

  // 总能耗 = 租户普通 + 租户空调 + 公区普通 + 公区空调
  const totalLoad = sumNumbers([tenantValue, tenantAirValue, publicValue, publicAirValue])
  // 公区能耗 = 公区普通 + 公区空调
  const publicTotal = sumNumbers([publicValue, publicAirValue])
  // 租户能耗 = 租户普通 + 租户空调
  const tenantTotal = sumNumbers([tenantValue, tenantAirValue])
  // 空调系统 = 租户空调 + 公区空调
  const airTotal = sumNumbers([tenantAirValue, publicAirValue])

  // ── 费用构成 ──
  const fee = feeRaw || {}
  const feeValues = {
    air: firstNumber(fee.airFee),
    electricity: firstNumber(fee.elecFee),
    water: firstNumber(fee.waterFee),
    other: firstNumber(fee.otherFee)
  }
  const feeTotal = sumNumbers(Object.values(feeValues))
  const todayCost = feeTotal // 今日租户电费

  // ── 设备统计 ──
  const devices = normalizeDeviceSummary(deviceRaw)

  // ── 光伏 & 环保 ──
  // energy 流向：按 period 取对应接口的聚合数据
  const stationFlow = hasStation ? mapStationToEnergyFlow(station, { period }) : null
  const pvEnergy = stationFlow ? energyToKwh(stationFlow.energies.pvEnergy, stationFlow.snapshot.pvEnergyStr) : null
  const pvIncome = stationFlow ? firstNumber(stationFlow.income) : null

  // 实时功率：始终取 day 电站详情（月/年聚合数据无功率字段）
  const dayStationFlow = hasDayStation ? mapStationToEnergyFlow(dayStation, { period: 'day' }) : null
  const pvPower = dayStationFlow ? firstNumber(dayStationFlow.powers.pv) : null
  const realtimePower = dayStationFlow ? firstNumber(dayStationFlow.powers.load, dayStationFlow.powers.pv) : null

  // 光伏站负荷 / 购电数据，作为后端 shareEnergy 接口的回退
  const stationLoadEnergy = stationFlow ? energyToKwh(stationFlow.energies.loadEnergy, stationFlow.snapshot.loadEnergyStr) : null
  const stationGridImport = stationFlow ? energyToKwh(stationFlow.energies.gridImport, stationFlow.snapshot.gridImportStr) : null

  // 总用电：优先后端能耗拆分接口，月/年无数据时回退光伏站负荷
  const todayUse = totalLoad !== null ? totalLoad : stationLoadEnergy

  // 购电 = 总能耗 - 光伏发电（叠加光伏站记录的电网购电量）
  const gridEnergy = todayUse === null
    ? null
    : (pvEnergy === null ? todayUse : Math.max(0, todayUse - pvEnergy + (stationGridImport || 0)))

  // 天气 / 环保：始终取 day 电站数据（月/年聚合无这些字段）
  const carbon = hasDayStation ? kgToTon(dayStation.powerStationAvoidedCo2) : null
  const coal = hasDayStation ? kgToTon(dayStation.powerStationAvoidedTce) : null
  const trees = hasDayStation ? numberOrNull(dayStation.powerStationNumTree) : null
  const weather = normalizeWeather(dayStation)
  const wind = hasDayStation
    ? [dayStation.windDir, dayStation.windSpd != null && dayStation.windSpd !== '' ? `${dayStation.windSpd}${dayStation.windSpdUnit || 'm/s'}` : ''].filter(Boolean).join(' ')
    : ''

  // ── 分项能耗结构（近7日：公区 vs 租户） ──
  const structureItems = [
    { name: '租户能耗', value: tenantTotal, color: '#087cff' },
    { name: '公区能耗', value: publicTotal, color: '#6c9bc8' }
  ].filter(item => item.value !== null)
  const structureTotal = sumNumbers(structureItems.map(item => item.value))
  const [tenantPct, publicPct] = wholePercentPair(tenantTotal, publicTotal)
  structureItems.forEach(item => { item.percent = item.name === '租户能耗' ? tenantPct : publicPct })

  // ── 费用构成 ──
  const costItems = [
    { name: '空调费', value: feeValues.air, color: '#1182ff' },
    { name: '电费', value: feeValues.electricity, color: '#1796dd' },
    { name: '水费', value: feeValues.water, color: '#42d0ad' },
    { name: '其他', value: feeValues.other, color: '#9278ff' }
  ]
  costItems.forEach(item => { item.percent = percent(item.value, feeTotal) })

  // ── 能源流向 ──
  const destinationTotal = sumNumbers([airTotal, tenantValue, publicValue])
  const overview = {
    weather,
    kpis: createKpis({ todayUse, todayCost, pvEnergy, pvPower, pvIncome, devices, carbon, trees }, period),
    left: {
      trend: { total: trend.total, dates: trend.dates, usage: trend.usage, fee: trend.fee },
      structure: { total: structureTotal, items: structureItems },
      costs: { total: feeTotal, items: costItems }
    },
    flow: {
      grid: { title: '电网', icon: 'tower', energy: gridEnergy, cost: todayCost },
      photovoltaic: { title: '光伏电站', icon: 'solar', energy: pvEnergy, power: pvPower },
      center: { title: '园区配电中心', purchased: gridEnergy, generated: pvEnergy },
      destinations: [
        { key: 'air', title: '空调系统', icon: 'air', usage: airTotal, percent: percent(airTotal, destinationTotal), tone: 'cyan' },
        { key: 'tenant', title: '租户区域', icon: 'building', usage: tenantValue, percent: percent(tenantValue, destinationTotal), tone: 'teal' },
        { key: 'public', title: '公区照明/动力', icon: 'bulb', usage: publicValue, percent: percent(publicValue, destinationTotal), tone: 'gold' }
      ],
      totalLoad: todayUse,
      realtimePower
    },
    right: {
      powerSafety: {
        cells: [
          { key: 'transformerLoad', label: '变压器负载率', value: null, unit: '%', icon: 'load', tone: 'cyan', status: '--', statusTone: 'ok' },
          { key: 'maxTemp', label: '最高测点温度', value: null, unit: '℃', icon: 'peak-temperature', tone: 'gold', status: '--', statusTone: 'ok' },
          { key: 'groundResistance', label: '接地电阻', value: null, unit: 'Ω', icon: 'ground', tone: 'green', status: '--', statusTone: 'ok' },
          { key: 'maxResidual', label: '最大剩余电流', value: null, unit: 'mA', icon: 'residual', tone: 'violet', status: '--', statusTone: 'ok' }
        ]
      },
      alarm: { list: [] }
    },
    footer: {
      environmentPanel: [
        { key: 'temperature', label: '当前温度', value: null, unit: '℃', icon: 'thermometer', tone: 'cyan', status: '--', statusTone: 'ok' },
        { key: 'humidity', label: '当前湿度', value: null, unit: '%', icon: 'drop', tone: 'blue', status: '--', statusTone: 'ok' },
        { key: 'smoke', label: '烟雾报警器', value: null, unit: '', icon: 'smoke', tone: 'gold', status: '--', statusTone: 'ok' },
        { key: 'flood', label: '水浸', value: null, unit: '', icon: 'flood', tone: 'blue', status: '--', statusTone: 'ok' }
      ],
      achievements: [
        { label: 'CO₂减排', value: carbon, unit: 't', icon: 'co2', tone: 'green' },
        { label: '等效植树', value: trees, unit: hasDayStation ? (dayStation.powerStationNumTreeUnit || '棵') : '棵', icon: 'leaf', tone: 'green' },
        { label: '节约标准煤', value: coal, unit: 't', icon: 'coal', tone: 'gold' }
      ],
      environment: [
        { label: '天气', value: weather.text, unit: '', icon: 'cloud' },
        { label: '温度', value: weather.temperature, unit: '', icon: 'thermometer' },
        { label: '湿度', value: hasDayStation ? numberOrNull(dayStation.hum) : null, unit: '%', icon: 'drop' },
        { label: '风速', value: wind || '--', unit: '', icon: 'wind' }
      ]
    }
  }
  return applyEnergyScreenMock(overview, { managerId, business })
}

// 保留管理方查询接口引用（旧接口）
export { queryPhotovoltaicStation }
