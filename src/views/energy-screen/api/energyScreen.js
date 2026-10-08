import moment from 'moment'
import request from '@/utils/request'
import { GRID_ROOT } from '@/config/services'
import { mapStationToEnergyFlow } from '@/utils/energyFlowMapper'

const CONTENT_BASE = '/api/ebc-content'
const SETTLE_BASE = '/api/ebc-settle/capitalManage'
const PHOTOVOLTAIC_SERVICE_URL = GRID_ROOT
const NANDU_MANAGER_ID = '1000107'

const ENERGY_SCREEN_HEADERS = {
  userDeviceType: 'PC',
  'Content-Type': 'application/json'
}

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

/** 当前用户的管理方列表。复制自 manager/getManagerListByUser。 */
export function queryEnergyScreenManagers () {
  return internalPost(`${CONTENT_BASE}/manager/getManagerListByUser`)
}

/** 今日总用量与费用。复制自计量看板 queryCwTenantTodayUse。 */
export function queryTodayEnergyUsage (managerId) {
  return internalPost(`${CONTENT_BASE}/customerWorkbench/queryCwTenantTodayUse`, {
    data: { managerId }
  })
}

/** 近7日用电趋势。复制自计量看板 getElecStatistics。 */
export function querySevenDayElectricity (managerId) {
  return internalPost(`${SETTLE_BASE}/elecStatistics`, {
    params: { type: 2, useType: 1, managerId }
  })
}

/** 近7日用电分类概览。复制自计量看板 getElecWaterOverview。 */
export function querySevenDayEnergyOverview (managerId) {
  return internalPost(`${SETTLE_BASE}/elecWaterOverview`, {
    params: { managerId, type: 1 }
  })
}

/** 指定日期范围费用构成。复制自计量看板 getTenantFeeComposition。 */
export function queryEnergyFeeComposition (managerId, beginTime, endTime) {
  return internalPost(`${CONTENT_BASE}/tenant/feeComposition`, {
    data: { managerId, beginTime, endTime }
  })
}

/** 指定日期范围租户/公区能耗。复制自计量看板 getDashboardEnergyManagement。 */
export function queryEnergyAllocation (managerId, beginTime, endTime) {
  return internalPost(`${CONTENT_BASE}/propertyScreen/getEnergyManagement`, {
    data: {
      managerId,
      startTime: `${beginTime} 00:00:00`,
      endTime: `${endTime} 23:59:59`
    }
  })
}

/** 电表、水表、空调设备统计。复制自计量看板 getTenantTopStatistics。 */
export function queryDeviceSummary (managerId, date) {
  return internalPost(`${CONTENT_BASE}/tenant/topStatistics`, {
    data: { managerId, beginTime: date, endTime: date }
  })
}

function isPhotovoltaicSuccess (body) {
  if (!body || typeof body !== 'object') return false
  return body.success !== false && (body.code == null || String(body.code) === '0')
}

function peelPhotovoltaicPayload (value) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return value
  if (isPhotovoltaicSuccess(value) && value.data != null) return peelPhotovoltaicPayload(value.data)
  return value
}

/** 光伏电站详情。复制自 /energy/photovoltaic 的 fetchStationDetail。 */
export function queryPhotovoltaicStation () {
  return fetch(`${PHOTOVOLTAIC_SERVICE_URL}/api/station/detail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(async response => {
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.msg || `HTTP ${response.status}`)
    if (!isPhotovoltaicSuccess(body)) throw new Error(body.msg || '光伏电站请求失败')
    const payload = peelPhotovoltaicPayload(body.data)
    if (payload && payload.stationDetail && typeof payload.stationDetail === 'object') return payload.stationDetail
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null
  })
}

function responseData (result) {
  if (!result || result.status !== 'fulfilled') return null
  const response = result.value
  return response && String(response.code) === '200' ? response.data : null
}

function numberOrNull (value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function firstNumber (...values) {
  for (const value of values) {
    const number = numberOrNull(value)
    if (number !== null) return number
  }
  return null
}

function sumNumbers (values) {
  const numbers = values.map(numberOrNull).filter(value => value !== null)
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) : null
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
  const number = numberOrNull(value)
  return number === null
    ? '--'
    : `¥${number.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function metricText (value, digits, unit) {
  const number = numberOrNull(value)
  return number === null ? '--' : `${number.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${unit}`
}

function energyToKwh (value, unit = 'kWh') {
  const number = numberOrNull(value)
  if (number === null) return null
  const normalized = String(unit || 'kWh').toLowerCase()
  if (normalized === 'mwh') return number * 1000
  if (normalized === 'wh') return number / 1000
  return number
}

function kgToTon (value) {
  const number = numberOrNull(value)
  return number === null ? null : number / 1000
}

function normalizeTrendRecords (raw) {
  const list = Array.isArray(raw) ? raw : []
  const records = list
    .filter(item => item && item.date)
    .sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf())
  const selected = records.slice(-7)
  const usage = selected.map(item => numberOrNull(item.useElec))
  const finiteUsage = usage.filter(value => value !== null)
  const fee = selected.map(item => {
    const electricityFee = firstNumber(item.meterBalance)
    const airFee = firstNumber(item.airBalance)
    return firstNumber(
      sumNumbers([electricityFee, airFee]),
      item.balance,
      item.useAmount,
      item.useFee
    )
  })

  return {
    records: selected,
    dates: selected.map(item => moment(item.date).format('MM/DD')),
    usage,
    fee,
    total: finiteUsage.length ? finiteUsage.reduce((sum, value) => sum + value, 0) : null
  }
}

function normalizeDeviceSummary (raw) {
  const source = raw || {}
  const tenant = firstNumber(source.tenantCount)
  const meter = firstNumber(source.meterCount)
  const water = firstNumber(source.waterCount)
  const air = firstNumber(source.airCount)
  const other = firstNumber(source.otherDeviceCount, source.otherCount, source.smartDeviceCount)
  const meterOffline = firstNumber(source.meterOfflineCount)
  const waterOffline = firstNumber(source.waterOfflineCount)
  const airOffline = firstNumber(source.airOfflineCount)
  const hasData = ['meterCount', 'waterCount', 'airCount'].some(key => numberOrNull(source[key]) !== null)
  const total = hasData ? (meter || 0) + (water || 0) + (air || 0) : null
  const offline = hasData ? (meterOffline || 0) + (waterOffline || 0) + (airOffline || 0) : null
  const online = total === null ? null : Math.max(0, total - offline)
  return { tenant, meter, water, air, other, total, online, offline }
}

function normalizeWeather (station) {
  const source = station || {}
  const day = source.condTxtD || source.condTxt || ''
  const night = source.condTxtN || ''
  const text = [day, night].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index).join('-') || '--'
  const unit = source.tmpUnit || '℃'
  const min = source.tmpMin
  const max = source.tmpMax
  const temperature = min !== null && min !== undefined && min !== '' && max !== null && max !== undefined && max !== ''
    ? `${min}${unit}~${max}${unit}`
    : '--'
  return { text, temperature }
}

function createKpis ({ todayUse, todayCost, pvEnergy, pvPower, pvIncome, devices, carbon, trees }) {
  const greenRate = percent(pvEnergy, todayUse)
  const onlineRate = percent(devices.online, devices.total)
  return [
    { key: 'power', label: '今日总用电', value: todayUse, digits: 2, unit: 'kWh', noteLabel: '实时功率', note: '--', icon: 'bolt', tone: 'blue' },
    { key: 'solar', label: '今日光伏发电', value: pvEnergy, digits: 1, unit: 'kWh', noteLabel: '当前功率', note: metricText(pvPower, 2, 'kW'), icon: 'solar', tone: 'gold' },
    { key: 'green', label: '绿电占比', value: todayUse === null || pvEnergy === null ? null : greenRate, digits: 1, unit: '%', noteLabel: '绿电用电', note: metricText(pvEnergy, 1, 'kWh'), icon: 'pie', tone: 'green' },
    { key: 'cost', label: '今日租户电费', value: todayCost, digits: 2, prefix: '¥', unit: '', noteLabel: '今日绿电收益', note: moneyText(pvIncome), icon: 'yuan', tone: 'violet' },
    { key: 'online', label: '设备在线率', value: devices.total === null ? null : onlineRate, digits: 0, unit: '%', noteLabel: '在线设备', note: devices.total === null ? '--' : `${devices.online.toLocaleString('zh-CN')} / ${devices.total.toLocaleString('zh-CN')}`, icon: 'monitor', tone: 'cyan' },
    { key: 'carbon', label: 'CO₂减排', value: carbon, digits: 2, unit: 't', noteLabel: '等效植树', note: trees === null ? '--' : `${trees.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 棵`, icon: 'leaf', tone: 'green' }
  ]
}

/** 仅提供组件渲染所需的空结构，不包含任何演示数值。 */
export function createEnergyScreenSkeleton () {
  const unavailable = null
  return {
    weather: { text: '--', temperature: '--' },
    kpis: createKpis({ todayUse: unavailable, todayCost: unavailable, pvEnergy: unavailable, pvPower: unavailable, pvIncome: unavailable, devices: { total: null, online: null }, carbon: unavailable, trees: unavailable }),
    left: {
      trend: { total: null, dates: [], usage: [], fee: [] },
      structure: { total: null, items: [] },
      costs: { total: null, items: [] }
    },
    flow: {
      grid: { title: '电网', icon: 'tower', energy: null, cost: null },
      photovoltaic: { title: '光伏电站', icon: 'solar', energy: null, power: null },
      center: { title: '园区配电中心', purchased: null, generated: null },
      destinations: [
        { key: 'air', title: '空调系统', icon: 'air', usage: null, percent: 0, tone: 'cyan' },
        { key: 'tenant', title: '租户区域', icon: 'building', usage: null, percent: 0, tone: 'teal' },
        { key: 'public', title: '公区照明/动力', icon: 'bulb', usage: null, percent: 0, tone: 'gold' }
      ],
      totalLoad: null,
      realtimePower: null
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
      alarm: {
        list: []
      }
    },
    footer: {
      environmentPanel: [
        { key: 'temperature', label: '当前温度', value: null, unit: '℃', icon: 'thermometer', tone: 'cyan', status: '--', statusTone: 'ok' },
        { key: 'humidity', label: '当前湿度', value: null, unit: '%', icon: 'drop', tone: 'blue', status: '--', statusTone: 'ok' },
        { key: 'smoke', label: '烟雾报警器', value: null, unit: '', icon: 'smoke', tone: 'gold', status: '--', statusTone: 'ok' },
        { key: 'flood', label: '水浸', value: null, unit: '', icon: 'flood', tone: 'blue', status: '--', statusTone: 'ok' }
      ],
      achievements: [
        { label: 'CO₂减排', value: null, unit: 't', icon: 'co2', tone: 'green' },
        { label: '等效植树', value: null, unit: '棵', icon: 'leaf', tone: 'green' },
        { label: '节约标准煤', value: null, unit: 't', icon: 'coal', tone: 'gold' }
      ],
      environment: [
        { label: '天气', value: '--', unit: '', icon: 'cloud' },
        { label: '温度', value: '--', unit: '', icon: 'thermometer' },
        { label: '湿度', value: null, unit: '%', icon: 'drop' },
        { label: '风速', value: '--', unit: '', icon: 'wind' }
      ]
    }
  }
}

/** 聚合综合能源大屏全部真实数据；任一接口失败时仅对应指标显示 --。 */
export async function getEnergyScreenOverview (managerId) {
  const isNanduManager = String(managerId) === NANDU_MANAGER_ID
  const today = moment().format('YYYY-MM-DD')
  const sevenDayEnd = moment().subtract(1, 'day')
  const sevenDayEndDate = sevenDayEnd.format('YYYY-MM-DD')
  const sevenDayBegin = sevenDayEnd.clone().subtract(6, 'days').format('YYYY-MM-DD')
  const internalRequests = managerId
    ? [
      queryTodayEnergyUsage(managerId),
      querySevenDayElectricity(managerId),
      querySevenDayEnergyOverview(managerId),
      queryEnergyFeeComposition(managerId, sevenDayBegin, sevenDayEndDate),
      queryEnergyAllocation(managerId, sevenDayBegin, sevenDayEndDate),
      queryEnergyAllocation(managerId, today, today),
      queryDeviceSummary(managerId, today)
    ]
    : Array.from({ length: 7 }, () => Promise.resolve(null))
  const results = await Promise.allSettled([
    ...internalRequests,
    isNanduManager ? queryPhotovoltaicStation() : Promise.resolve(null)
  ])

  const todayDto = responseData(results[0]) || {}
  const trendRaw = responseData(results[1])
  const overviewDto = responseData(results[2]) || {}
  const feeDto = responseData(results[3]) || {}
  const sevenDayAllocationDto = responseData(results[4]) || {}
  const todayAllocationDto = responseData(results[5]) || {}
  const deviceDto = responseData(results[6]) || {}
  const hasStation = isNanduManager && results[7].status === 'fulfilled' && !!results[7].value
  const station = hasStation ? results[7].value : null

  const trend = normalizeTrendRecords(trendRaw)
  const todayUse = firstNumber(todayDto.useElec)
  const feeValues = {
    air: firstNumber(feeDto.airFee),
    electricity: firstNumber(feeDto.elecFee),
    water: firstNumber(feeDto.waterFee),
    other: firstNumber(feeDto.otherFee)
  }
  const feeTotal = sumNumbers(Object.values(feeValues))
  const todayCost = firstNumber(todayDto.useAmount)

  const sevenDayShare = sevenDayAllocationDto.shareEnergy || {}
  const sevenDayTenantUse = firstNumber(sevenDayShare.tenantValue)
  const sevenDayPublicUse = firstNumber(sevenDayShare.publicValue)
  const todayShare = todayAllocationDto.shareEnergy || {}
  const tenantUse = firstNumber(todayShare.tenantValue)
  const publicUse = firstNumber(todayShare.publicValue)

  const stationFlow = hasStation ? mapStationToEnergyFlow(station, { period: 'day' }) : null
  const pvEnergy = stationFlow ? energyToKwh(stationFlow.energies.pvEnergy, stationFlow.snapshot.pvEnergyStr) : null
  const explicitGrid = hasStation ? numberOrNull(station.gridPurchasedDayEnergy) : null
  const gridEnergy = explicitGrid === null
    ? (todayUse === null || pvEnergy === null ? null : Math.max(0, todayUse - pvEnergy))
    : energyToKwh(explicitGrid, station.gridPurchasedDayEnergyStr)
  const pvPower = stationFlow ? firstNumber(stationFlow.powers.pv) : null
  const realtimePower = stationFlow ? firstNumber(stationFlow.powers.load, stationFlow.powers.pv) : null
  const pvIncome = stationFlow ? firstNumber(stationFlow.income) : null

  const devices = normalizeDeviceSummary(deviceDto)
  const carbon = hasStation ? kgToTon(station.powerStationAvoidedCo2) : null
  const coal = hasStation ? kgToTon(station.powerStationAvoidedTce) : null
  const trees = hasStation ? numberOrNull(station.powerStationNumTree) : null
  const weather = normalizeWeather(station)

  const structureItems = [
    { name: '租户能耗', value: sevenDayTenantUse, color: '#087cff' },
    { name: '公区能耗', value: sevenDayPublicUse, color: '#6c9bc8' }
  ].filter(item => item.value !== null)
  const structureTotal = sumNumbers(structureItems.map(item => item.value))
  const [tenantPercent, publicPercent] = wholePercentPair(sevenDayTenantUse, sevenDayPublicUse)
  structureItems.forEach(item => { item.percent = item.name === '租户能耗' ? tenantPercent : publicPercent })

  const costItems = [
    { name: '空调费', value: feeValues.air, color: '#1182ff' },
    { name: '电费', value: feeValues.electricity, color: '#1796dd' },
    { name: '水费', value: feeValues.water, color: '#42d0ad' },
    { name: '其他', value: feeValues.other, color: '#9278ff' }
  ]
  costItems.forEach(item => { item.percent = percent(item.value, feeTotal) })

  const airUse = null
  const destinationValues = [tenantUse, publicUse]
  const destinationTotal = sumNumbers(destinationValues)
  const wind = hasStation
    ? [station.windDir, station.windSpd != null && station.windSpd !== '' ? `${station.windSpd}${station.windSpdUnit || 'm/s'}` : ''].filter(Boolean).join(' ')
    : ''

  return {
    weather,
    kpis: createKpis({ todayUse, todayCost, pvEnergy, pvPower, pvIncome, devices, carbon, trees }),
    left: {
      trend: { total: firstNumber(trend.total, overviewDto.sevenDayElecUse), dates: trend.dates, usage: trend.usage, fee: trend.fee },
      structure: { total: structureTotal, items: structureItems },
      costs: { total: feeTotal, items: costItems }
    },
    flow: {
      grid: { title: '电网', icon: 'tower', energy: gridEnergy, cost: todayCost },
      photovoltaic: { title: '光伏电站', icon: 'solar', energy: pvEnergy, power: pvPower },
      center: { title: '园区配电中心', purchased: gridEnergy, generated: pvEnergy },
      destinations: [
        { key: 'air', title: '空调系统', icon: 'air', usage: airUse, percent: 0, tone: 'cyan' },
        { key: 'tenant', title: '租户区域', icon: 'building', usage: tenantUse, percent: percent(tenantUse, destinationTotal), tone: 'teal' },
        { key: 'public', title: '公区照明/动力', icon: 'bulb', usage: publicUse, percent: percent(publicUse, destinationTotal), tone: 'gold' }
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
      alarm: {
        list: []
      }
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
        { label: '等效植树', value: trees, unit: hasStation ? (station.powerStationNumTreeUnit || '棵') : '棵', icon: 'leaf', tone: 'green' },
        { label: '节约标准煤', value: coal, unit: 't', icon: 'coal', tone: 'gold' }
      ],
      environment: [
        { label: '天气', value: weather.text, unit: '', icon: 'cloud' },
        { label: '温度', value: weather.temperature, unit: '', icon: 'thermometer' },
        { label: '湿度', value: hasStation ? numberOrNull(station.hum) : null, unit: '%', icon: 'drop' },
        { label: '风速', value: wind || '--', unit: '', icon: 'wind' }
      ]
    }
  }
}
