/**
 * 将锦浪 stationDetail 快照映射为 PV / GRID / LOAD 三节点能量流模型。
 * 流向图瞬时功率拆解见 computeEnergyFlowDiagram；电量 KPI 见 getPeriodSnapshot / mapStationToEnergyFlow。
 */

function toNumber (value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const EMPTY_FLOW_DIAGRAM = {
  mode: 'pvDirect',
  gridParticipating: false,
  pv: { power: 0, toLoad: 0, toGrid: 0 },
  load: { power: 0, fromPV: 0, fromGrid: 0 },
  grid: { power: 0, toLoad: 0, direction: 0 },
  battery: { power: 0, direction: 0 },
  flows: { pvToLoad: 0, pvToGrid: 0, gridToLoad: 0 },
  arrows: { pvToLoad: false, pvToGrid: false, gridToLoad: false }
}

/** 判定电网是否真实参与能量交换（任一非 0 即启用三节点模型） */
const GRID_PARTICIPATION_FIELDS = [
  'psum',
  'gridPurchasedEnergy',
  'gridSellEnergy',
  'gridPurchasedDayEnergy',
  'gridSellDayEnergy',
  'gridPurchasedTotalEnergy',
  'gridSellTotalEnergy'
]

export function isGridParticipating (data) {
  if (!data) return false
  return GRID_PARTICIPATION_FIELDS.some(key => Math.abs(toNumber(data[key])) > 0)
}

function buildPvDirectFlow (PV_POWER, LOAD_POWER, GRID_POWER, BAT_POWER) {
  const pvToLoad = Math.min(PV_POWER, LOAD_POWER)

  return {
    mode: 'pvDirect',
    gridParticipating: false,
    pv: {
      power: PV_POWER,
      toLoad: pvToLoad,
      toGrid: 0
    },
    load: {
      power: LOAD_POWER,
      fromPV: pvToLoad,
      fromGrid: 0
    },
    grid: {
      power: Math.abs(GRID_POWER),
      toLoad: 0,
      direction: GRID_POWER
    },
    battery: {
      power: Math.abs(BAT_POWER),
      direction: BAT_POWER
    },
    flows: {
      pvToLoad,
      pvToGrid: 0,
      gridToLoad: 0
    },
    arrows: {
      pvToLoad: pvToLoad > 0,
      pvToGrid: false,
      gridToLoad: false
    }
  }
}

function buildThreeNodeFlow (PV_POWER, LOAD_POWER, GRID_POWER, BAT_POWER) {
  const pvToLoad = Math.min(PV_POWER, LOAD_POWER)
  const pvRemain = PV_POWER - pvToLoad
  const gridToLoad = LOAD_POWER > PV_POWER ? LOAD_POWER - PV_POWER : 0
  const pvToGrid = pvRemain > 0 ? pvRemain : 0

  return {
    mode: 'threeNode',
    gridParticipating: true,
    pv: {
      power: PV_POWER,
      toLoad: pvToLoad,
      toGrid: pvToGrid
    },
    load: {
      power: LOAD_POWER,
      fromPV: pvToLoad,
      fromGrid: gridToLoad
    },
    grid: {
      power: Math.abs(GRID_POWER),
      toLoad: gridToLoad,
      direction: GRID_POWER
    },
    battery: {
      power: Math.abs(BAT_POWER),
      direction: BAT_POWER
    },
    flows: {
      pvToLoad,
      pvToGrid,
      gridToLoad
    },
    arrows: {
      pvToLoad: pvToLoad > 0,
      pvToGrid: pvToGrid > 0,
      gridToLoad: gridToLoad > 0
    }
  }
}

/**
 * 能源流向图数据计算（stationDetail / v2）
 *
 * 业务规则：
 * - 电网未参与（psum / 购售电均为 0）→ PV 直供 LOAD，不构造 GRID 流向
 * - 电网已参与 → 启用 PV / GRID / LOAD 三节点拆分
 *
 * ⚠️ 功率字段说明：
 *   power          = 光伏瞬时功率 (kW) —— 锦浪真实数据
 *   familyLoadPower = 家庭负载功率 (kW) —— 锦浪自洽假数据（恒等于 power）
 *   psum            = 电网功率 (kW) —— 锦浪无数据（恒为 0）
 *
 *   EMS 注入后：使用 computeEnergyFlowWithRealLoad() 替代本函数，
 *   LOAD_POWER 替换为 EMS 真实总负载，GRID_POWER = LOAD - PV 推算。
 */
export function computeEnergyFlowDiagram (data) {
  if (!data) return { ...EMPTY_FLOW_DIAGRAM }

  const PV_POWER = toNumber(data.power)
  const LOAD_POWER = toNumber(data.familyLoadPower)
  const GRID_POWER = toNumber(data.psum)
  const BAT_POWER = toNumber(data.batteryPower)

  if (!isGridParticipating(data)) {
    return buildPvDirectFlow(PV_POWER, LOAD_POWER, GRID_POWER, BAT_POWER)
  }

  return buildThreeNodeFlow(PV_POWER, LOAD_POWER, GRID_POWER, BAT_POWER)
}

/**
 * 流向图 SVG 路径显隐
 * 无电网参与时仅展示 PV → LOAD，GRID 路径强制关闭
 */
export function getFlowPathVisibility (flowData) {
  const flow = flowData || EMPTY_FLOW_DIAGRAM
  const { arrows, gridParticipating } = flow

  if (!gridParticipating) {
    return {
      pv: arrows.pvToLoad,
      grid: false,
      load: arrows.pvToLoad
    }
  }

  return {
    pv: arrows.pvToLoad || arrows.pvToGrid,
    grid: arrows.gridToLoad || arrows.pvToGrid,
    load: arrows.pvToLoad || arrows.gridToLoad
  }
}

const PERIOD_FIELD_MAP = {
  day: {
    pvEnergy: 'dayEnergy',
    pvEnergyStr: 'dayEnergyStr',
    loadEnergy: 'homeLoadTodayEnergy',
    loadEnergyStr: 'homeLoadTodayEnergyStr',
    gridImport: 'gridPurchasedDayEnergy',
    gridImportStr: 'gridPurchasedDayEnergyStr',
    gridExport: 'gridSellDayEnergy',
    gridExportStr: 'gridSellDayEnergyStr',
    income: 'dayInCome',
    incomeUnit: 'dayInComeUnit',
    fullHours: 'fullHour',
    fullHoursStr: 'fullHourStr'
  },
  month: {
    pvEnergy: 'monthEnergy',
    pvEnergyStr: 'monthEnergyStr',
    loadEnergy: 'homeLoadMonthEnergy',
    loadEnergyStr: 'homeLoadMonthEnergyStr',
    gridImport: 'gridPurchasedMonthEnergy',
    gridImportStr: 'gridPurchasedMonthEnergyStr',
    gridExport: 'gridSellMonthEnergy',
    gridExportStr: 'gridSellMonthEnergyStr',
    income: 'monthInCome',
    incomeUnit: 'monthInComeUnit',
    fullHours: 'fullHour',
    fullHoursStr: 'fullHourStr'
  },
  year: {
    pvEnergy: 'yearEnergy',
    pvEnergyStr: 'yearEnergyStr',
    loadEnergy: 'homeLoadYearEnergy',
    loadEnergyStr: 'homeLoadYearEnergyStr',
    gridImport: 'gridPurchasedYearEnergy',
    gridImportStr: 'gridPurchasedYearEnergyStr',
    gridExport: 'gridSellYearEnergy',
    gridExportStr: 'gridSellYearEnergyStr',
    income: 'yearInCome',
    incomeUnit: 'yearInComeUnit',
    fullHours: 'fullHour',
    fullHoursStr: 'fullHourStr'
  },
  total: {
    pvEnergy: 'allEnergy',
    pvEnergyStr: 'allEnergyStr',
    loadEnergy: 'homeLoadTotalEnergy',
    loadEnergyStr: 'homeLoadTotalEnergyStr',
    gridImport: 'gridPurchasedTotalEnergy',
    gridImportStr: 'gridPurchasedTotalEnergyStr',
    gridExport: 'gridSellTotalEnergy',
    gridExportStr: 'gridSellTotalEnergyStr',
    income: 'allInCome',
    incomeUnit: 'allInComeUnit',
    fullHours: 'fullHour',
    fullHoursStr: 'fullHourStr'
  }
}

function pickField (station, fieldKey, fallbackKey) {
  if (!station) return 0
  const value = station[fieldKey]
  if (value !== undefined && value !== null && value !== '') return value
  if (fallbackKey) return station[fallbackKey]
  return 0
}

export function getPeriodSnapshot (station, period = 'day') {
  const fields = PERIOD_FIELD_MAP[period] || PERIOD_FIELD_MAP.day
  // Jinlang 字段可能是 MWh 或 kWh，统一归一化为 kWh 内部计算
  const pvEnergyStr = pickField(station, fields.pvEnergyStr, 'dayEnergyStr') || 'kWh'
  const loadEnergyStr = pickField(station, fields.loadEnergyStr, 'homeLoadEnergyStr') || 'kWh'
  const gridImportStr = pickField(station, fields.gridImportStr, 'gridPurchasedDayEnergyStr') || 'kWh'
  const gridExportStr = pickField(station, fields.gridExportStr, 'gridSellDayEnergyStr') || 'kWh'
  const toKwh = (raw, unitStr) => {
    const num = toNumber(raw)
    if (num === 0) return 0
    return String(unitStr || '').toUpperCase() === 'MWH' ? num * 1000 : num
  }
  const normalizeUnit = (unitStr) => {
    return String(unitStr || '').toUpperCase() === 'MWH' ? 'kWh' : (unitStr || 'kWh')
  }
  return {
    pvEnergy: toKwh(pickField(station, fields.pvEnergy), pvEnergyStr),
    pvEnergyStr: normalizeUnit(pvEnergyStr),
    loadEnergy: toKwh(pickField(station, fields.loadEnergy, 'homeLoadEnergy'), loadEnergyStr),
    loadEnergyStr: normalizeUnit(loadEnergyStr),
    gridImport: toKwh(pickField(station, fields.gridImport), gridImportStr),
    gridImportStr: normalizeUnit(gridImportStr),
    gridExport: toKwh(pickField(station, fields.gridExport), gridExportStr),
    gridExportStr: normalizeUnit(gridExportStr),
    income: toNumber(pickField(station, fields.income)),
    incomeUnit: pickField(station, fields.incomeUnit, 'dayInComeUnit') || '元',
    fullHours: toNumber(pickField(station, fields.fullHours)),
    fullHoursStr: pickField(station, fields.fullHoursStr, 'fullHourStr') || 'h'
  }
}

/**
 * @param {Object} stationDetail stationDetail.data
 * @param {{ period?: 'day'|'month'|'year'|'total' }} options
 */
export function mapStationToEnergyFlow (stationDetail, options = {}) {
  const period = options.period || 'day'
  const snapshot = getPeriodSnapshot(stationDetail, period)

  const pvEnergy = snapshot.pvEnergy
  const loadEnergy = snapshot.loadEnergy
  const gridImport = snapshot.gridImport
  const gridExport = snapshot.gridExport

  const pvPower = toNumber(stationDetail && stationDetail.power)
  const loadPower = toNumber(stationDetail && stationDetail.familyLoadPower)
  const gridPower = Math.abs(toNumber(stationDetail && stationDetail.psum))

  const diagram = computeEnergyFlowDiagram(stationDetail)
  const { pvToLoad, pvToGrid, gridToLoad } = diagram.flows

  const selfUseRatio = pvEnergy > 0 ? (Math.min(pvEnergy, loadEnergy) / pvEnergy) * 100 : 0
  const gridSellRatio = pvEnergy > 0 ? (Math.max(pvEnergy - loadEnergy, 0) / pvEnergy) * 100 : 0

  return {
    period,
    snapshot,
    diagram,
    energies: {
      pvEnergy,
      loadEnergy,
      gridImport,
      gridExport
    },
    flows: {
      pvToLoad,
      pvToGrid,
      gridToLoad,
      batteryToLoad: 0,
      pvToBattery: 0,
      batteryToGrid: 0
    },
    powers: {
      pv: pvPower,
      load: loadPower,
      grid: gridPower,
      battery: diagram.battery.power
    },
    ratios: {
      selfUseEnergy: Math.min(pvEnergy, loadEnergy),
      selfUseRatio,
      gridSellEnergy: Math.max(pvEnergy - loadEnergy, 0),
      gridSellRatio
    },
    income: snapshot.income,
    incomeUnit: snapshot.incomeUnit,
    fullHours: snapshot.fullHours,
    fullHoursStr: snapshot.fullHoursStr
  }
}

export function formatPreciseNumber (value) {
  const num = toNumber(value)
  if (!Number.isFinite(num)) return '--'
  const normalized = Number(parseFloat(num.toPrecision(12)))
  if (Number.isInteger(normalized)) {
    return normalized.toLocaleString('zh-CN')
  }
  const str = String(normalized)
  const [intPart, decPart] = str.split('.')
  const intFormatted = Number(intPart).toLocaleString('zh-CN')
  return decPart ? `${intFormatted}.${decPart}` : intFormatted
}

export function formatEnergyWithUnit (value, unit = 'kWh', digits) {
  const num = toNumber(value)
  if (digits != null) {
    return `${num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: digits })}${unit}`
  }
  return `${formatPreciseNumber(num)}${unit}`
}

export function formatPowerWithUnit (value, unit = 'kW', digits = 2) {
  const num = toNumber(value)
  return `${num.toLocaleString('zh-CN', { maximumFractionDigits: digits })}${unit}`
}

export function formatMoney (value, unit = '元', digits = 2) {
  const num = toNumber(value)
  if (num >= 10000 && unit === '元') {
    return `${(num / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 3 })}万元`
  }
  return `${num.toLocaleString('zh-CN', { maximumFractionDigits: digits })}${unit}`
}

export function formatRelativeTime (timestamp) {
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || ts <= 0) return '--'
  const diffMs = Date.now() - ts
  if (diffMs < 0) return '刚刚'
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${Math.max(diffSec, 1)}秒前`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}天前`
}

/** 数据上报时间：优先 dataTimestamp，其次 updateDate */
export function resolveStationReportTimestamp (station) {
  if (!station) return null
  const candidates = [station.dataTimestamp, station.updateDate]
  for (let i = 0; i < candidates.length; i += 1) {
    const ts = Number(candidates[i])
    if (Number.isFinite(ts) && ts > 0) return ts
  }
  return null
}

export function formatDateTime (timestamp) {
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || ts <= 0) return '--'
  const date = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * 将锦浪日运行曲线单条 record 映射为图表点（kW，均为非负展示值）。
 *
 * ⚠️ familyLoadPower 为锦浪自洽假数据（恒等于 power），
 *    EMS 注入后由 mergeEmsLoadIntoDaySlots() 覆盖 load/grid 字段。
 */
function mapDayRuntimeRecordItem (record) {
  const pec = toNumber(record.powerPec) || 0.001
  const pv = toNumber(record.power) * pec
  const loadRaw = toNumber(record.familyLoadPower) || toNumber(record.oneSelf) || toNumber(record.consumeEnergy)
  const load = loadRaw * pec
  const gridSigned = toNumber(record.psum) * pec
  const grid = Math.abs(gridSigned)

  const label = record.timeStr
    ? String(record.timeStr).slice(0, 5)
    : '--'

  return { label, pv, load, grid, gridSigned, power: pv }
}

/**
 * 将锦浪日运行曲线接口 records 映射为趋势图数据点。
 */
export function mapDayRuntimeRecords (records) {
  if (!Array.isArray(records) || records.length === 0) return []
  return records.map(mapDayRuntimeRecordItem)
}

function formatDayTimelineLabel (totalMinutes) {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function toDayChartValue (value) {
  const num = toNumber(value)
  return num > 0 ? num : null
}

/**
 * 补齐为完整 24 小时时间轴（默认 5 分钟粒度 = 288 点）。
 * 无功率时段为 null（不绘制线段）；末段无数据（当日未结束）同样为 null。
 */
export function mapDayRuntimeRecordsToFullDay (records, { stepMinutes = 5, trimAfterLast = true } = {}) {
  const slotCount = (24 * 60) / stepMinutes
  const slots = Array.from({ length: slotCount }, (_, index) => ({
    label: formatDayTimelineLabel(index * stepMinutes),
    pv: null,
    load: null,
    grid: null,
    gridSigned: null,
    power: null
  }))

  const labelToIndex = new Map(slots.map((slot, index) => [slot.label, index]))
  let lastIdx = -1

  if (Array.isArray(records)) {
    records.forEach(record => {
      const label = record.timeStr ? String(record.timeStr).slice(0, 5) : ''
      const idx = labelToIndex.get(label)
      if (idx === undefined) return
      const item = mapDayRuntimeRecordItem(record)
      slots[idx] = {
        label: slots[idx].label,
        pv: toDayChartValue(item.pv),
        load: toDayChartValue(item.load),
        grid: toDayChartValue(item.grid),
        gridSigned: item.gridSigned,
        power: toDayChartValue(item.power)
      }
      lastIdx = Math.max(lastIdx, idx)
    })
  }

  if (trimAfterLast && lastIdx >= 0) {
    for (let i = lastIdx + 1; i < slots.length; i += 1) {
      slots[i].pv = null
      slots[i].load = null
      slots[i].grid = null
      slots[i].gridSigned = null
      slots[i].power = null
    }
  }

  return slots
}

/** 日视图 X 轴刻度：02:00–22:00 每隔 2 小时，共 11 个 */
export function shouldShowDayChartHourLabel (label) {
  const [hour, minute] = String(label).split(':').map(Number)
  return minute === 0 && hour >= 2 && hour <= 22 && hour % 2 === 0
}

/** 将接口 energy 字段（MWh + energyPec）转为 kWh */
function mapRuntimeEnergyToKwh (value, pec, unit = 'MWh') {
  const amount = toNumber(value) * (toNumber(pec) || 0.001)
  if (String(unit).toUpperCase() === 'MWH') return amount * 1000
  if (String(unit).toUpperCase() === 'KWH') return amount
  return amount * 1000
}

function mapMonthRuntimeRecordItem (record) {
  const energyUnit = record.energyStr || 'MWh'
  const energyPec = record.energyPec || '0.001'
  const generation = mapRuntimeEnergyToKwh(record.energy, energyPec, energyUnit)
  const load = mapRuntimeEnergyToKwh(record.homeLoadEnergy || record.oneSelf, energyPec, energyUnit)
  const buy = mapRuntimeEnergyToKwh(record.gridPurchasedEnergy, energyPec, energyUnit)
  const sell = mapRuntimeEnergyToKwh(record.gridSellEnergy, energyPec, energyUnit)
  const income = toNumber(record.money) * (toNumber(record.moneyPec) || 1)
  const hours = toNumber(record.fullHour)
  const dayLabel = record.dateStr ? String(record.dateStr).slice(-2) : '--'

  return {
    label: dayLabel,
    generation: toRuntimeChartValue(generation),
    sell: toRuntimeChartValue(sell),
    buy: toRuntimeChartValue(buy),
    load: toRuntimeChartValue(load),
    hours: toRuntimeChartValue(hours),
    income: toRuntimeChartValue(income)
  }
}

/**
 * 将锦浪月运行接口 records 映射为月趋势图数据点（单位 kWh / 元 / h）。
 */
export function mapMonthRuntimeRecords (records) {
  if (!Array.isArray(records) || records.length === 0) return []
  return records.map(mapMonthRuntimeRecordItem)
}

/**
 * 补齐为整月 1–30（或 31）日，无数据日期为 null。
 */
export function mapMonthRuntimeRecordsToFullMonth (records, { daysInMonth = 30 } = {}) {
  const slots = Array.from({ length: daysInMonth }, (_, index) => ({
    label: String(index + 1).padStart(2, '0'),
    generation: null,
    sell: null,
    buy: null,
    load: null,
    hours: null,
    income: null
  }))

  if (!Array.isArray(records)) return slots

  records.forEach(record => {
    const day = record.dateStr ? Number(String(record.dateStr).slice(-2)) : NaN
    if (!Number.isFinite(day) || day < 1 || day > daysInMonth) return
    slots[day - 1] = { label: slots[day - 1].label, ...mapMonthRuntimeRecordItem(record) }
  })

  return slots
}

function mapYearRuntimeRecordItem (record) {
  const energyUnit = record.energyStr || 'MWh'
  const energyPec = record.energyPec || '0.001'
  const generation = mapRuntimeEnergyToKwh(record.energy, energyPec, energyUnit)
  const load = mapRuntimeEnergyToKwh(record.homeLoadEnergy || record.oneSelf, energyPec, energyUnit)
  const buy = mapRuntimeEnergyToKwh(record.gridPurchasedEnergy, energyPec, energyUnit)
  const sell = mapRuntimeEnergyToKwh(record.gridSellEnergy, energyPec, energyUnit)
  const income = toNumber(record.money) * (toNumber(record.moneyPec) || 1)
  const hours = toNumber(record.fullHour)
  const monthLabel = record.dateStr ? String(record.dateStr).slice(-2) : '--'

  return {
    label: monthLabel,
    generation: toRuntimeChartValue(generation),
    sell: toRuntimeChartValue(sell),
    buy: toRuntimeChartValue(buy),
    load: toRuntimeChartValue(load),
    hours: toRuntimeChartValue(hours),
    income: toRuntimeChartValue(income)
  }
}

/**
 * 补齐为整年 1–12 月，无数据月份为 null。
 */
export function mapYearRuntimeRecordsToFullYear (records, { monthsInYear = 12 } = {}) {
  const slots = Array.from({ length: monthsInYear }, (_, index) => ({
    label: String(index + 1).padStart(2, '0'),
    generation: null,
    sell: null,
    buy: null,
    load: null,
    hours: null,
    income: null
  }))

  if (!Array.isArray(records)) return slots

  records.forEach(record => {
    const month = record.dateStr ? Number(String(record.dateStr).slice(-2)) : NaN
    if (!Number.isFinite(month) || month < 1 || month > monthsInYear) return
    slots[month - 1] = { label: slots[month - 1].label, ...mapYearRuntimeRecordItem(record) }
  })

  return slots
}

/** 从月运行 records 中匹配指定日（YYYY-MM-DD）的单日记录 */
export function findMonthRecordByDay (records, dayKey) {
  if (!Array.isArray(records) || !dayKey) return null
  const normalizedDay = String(dayKey).slice(0, 10)
  const daySuffix = normalizedDay.slice(-2)
  return records.find(record => {
    if (!record || record.dateStr == null || record.dateStr === '') return false
    const dateStr = String(record.dateStr)
    if (dateStr === normalizedDay) return true
    if (dateStr.length >= 10) return dateStr.slice(0, 10) === normalizedDay
    return dateStr === daySuffix || dateStr.endsWith(`-${daySuffix}`)
  }) || null
}

/** 单日 record 是否有可展示的业务数据 */
export function hasRuntimeDayRecordData (record) {
  if (!record) return false
  const energyUnit = record.energyStr || 'MWh'
  const energyPec = record.energyPec || '0.001'
  const pvEnergyKwh = mapRuntimeEnergyToKwh(record.energy, energyPec, energyUnit)
  if (pvEnergyKwh > 0) return true
  if (toNumber(record.fullHour) > 0) return true
  if (toNumber(record.money) * (toNumber(record.moneyPec) || 1) > 0) return true
  return false
}

/** 汇总结果是否有可展示数据 */
export function hasRuntimeSummaryData (summary) {
  if (!summary) return false
  return summary.pvEnergyKwh > 0 || summary.income > 0 || summary.fullHours > 0
}

/** 单日 record 汇总（结构与 summarizeMonthRuntimeRecords 一致，供日 KPI 使用） */
export function summarizeDayRuntimeRecord (record) {
  if (!record) return null
  return summarizeMonthRuntimeRecords([record])
}

/**
 * 汇总月/年运行 records，供 KPI 与环形图使用（单位内部为 kWh / 元 / h）。
 */
export function summarizeMonthRuntimeRecords (records) {
  const totals = {
    pvEnergyKwh: 0,
    loadEnergyKwh: 0,
    gridImportKwh: 0,
    gridExportKwh: 0,
    selfUseEnergyKwh: 0,
    income: 0,
    fullHours: 0
  }

  if (!Array.isArray(records)) return { ...totals, selfUseRatio: 0, gridSellRatio: 0, gridSellEnergyKwh: 0 }

  records.forEach(record => {
    const energyUnit = record.energyStr || 'MWh'
    const energyPec = record.energyPec || '0.001'
    totals.pvEnergyKwh += mapRuntimeEnergyToKwh(record.energy, energyPec, energyUnit)
    totals.loadEnergyKwh += mapRuntimeEnergyToKwh(record.homeLoadEnergy || record.oneSelf, energyPec, energyUnit)
    totals.gridImportKwh += mapRuntimeEnergyToKwh(record.gridPurchasedEnergy, energyPec, energyUnit)
    totals.gridExportKwh += mapRuntimeEnergyToKwh(record.gridSellEnergy, energyPec, energyUnit)
    totals.selfUseEnergyKwh += mapRuntimeEnergyToKwh(record.oneSelf, energyPec, energyUnit)
    totals.income += toNumber(record.money) * (toNumber(record.moneyPec) || 1)
    totals.fullHours += toNumber(record.fullHour)
  })

  const selfUseEnergyKwh = Math.min(totals.pvEnergyKwh, totals.selfUseEnergyKwh || totals.loadEnergyKwh)
  const gridSellEnergyKwh = Math.max(totals.pvEnergyKwh - totals.loadEnergyKwh, 0)
  const selfUseRatio = totals.pvEnergyKwh > 0 ? (selfUseEnergyKwh / totals.pvEnergyKwh) * 100 : 0
  const gridSellRatio = totals.pvEnergyKwh > 0 ? (gridSellEnergyKwh / totals.pvEnergyKwh) * 100 : 0

  return {
    ...totals,
    selfUseEnergyKwh,
    gridSellEnergyKwh,
    selfUseRatio,
    gridSellRatio
  }
}

/** @deprecated 别名，与 summarizeMonthRuntimeRecords 相同 */
export const summarizeYearRuntimeRecords = summarizeMonthRuntimeRecords

/** 按 kWh 数值自动选用 MWh / kWh 展示（保留接口精度，不截断小数） */
export function formatRuntimeEnergyValue (kwh) {
  const num = toNumber(kwh)
  if (num >= 1000) {
    return { value: num / 1000, unit: 'MWh' }
  }
  return { value: num, unit: 'kWh' }
}

/** 按接口 record 原始字段展示电量：value * energyPec + energyStr */
export function formatRecordEnergyAmount (record, field = 'energy') {
  if (!record) return '--'
  const raw = record[field]
  if (raw == null || raw === '') return '--'
  const unit = record.energyStr || 'MWh'
  const pecNum = toNumber(record.energyPec) || 0.001
  const amount = toNumber(raw) * pecNum
  const unitUpper = String(unit).toUpperCase()
  if (unitUpper === 'MWH') return formatEnergyWithUnit(amount, 'MWh')
  if (unitUpper === 'KWH') return formatEnergyWithUnit(amount, 'kWh')
  return formatEnergyWithUnit(amount * 1000, 'kWh')
}

/** 月/年组合图：无数据时不绘制 */
export function isRuntimeChartValue (value) {
  if (value === null || value === undefined || value === '-') return false
  const num = toNumber(value)
  return Number.isFinite(num) && num > 0
}

/** 转为 ECharts 可绘制数值，无数据返回 null */
export function toRuntimeChartValue (value) {
  return isRuntimeChartValue(value) ? toNumber(value) : null
}

/** 月/年图表：该指标是否存在有效数据点 */
export function hasRuntimeChartMetric (chartData, key) {
  if (!Array.isArray(chartData)) return false
  return chartData.some(row => isRuntimeChartValue(row && row[key]))
}

/** 负载是否与发电不同（相同则月视图只画发电柱，对齐设计稿） */
export function hasDistinctLoadMetric (chartData) {
  if (!Array.isArray(chartData)) return false
  return chartData.some(row => {
    if (!isRuntimeChartValue(row && row.load)) return false
    if (!isRuntimeChartValue(row && row.generation)) return true
    return toRuntimeChartValue(row.load) !== toRuntimeChartValue(row.generation)
  })
}

/** 月/年图表 Y 轴刻度（kWh / 元 / h） */
export function getRuntimeComboYAxisRange (chartData) {
  const pickMax = key => Math.max(...(chartData || []).map(row => toNumber(row && row[key])), 0)
  const maxKwh = Math.max(pickMax('generation'), pickMax('sell'), pickMax('buy'), pickMax('load'))
  const maxIncome = pickMax('income')
  const maxHours = pickMax('hours')
  const ceilStep = (value, step) => (value <= 0 ? step : Math.ceil(value / step) * step)

  return {
    kwh: { max: ceilStep(maxKwh * 1.08, maxKwh > 1000 ? 75 : 50) || 300 },
    income: { max: ceilStep(maxIncome * 1.08, 50) || 100 },
    hours: { max: ceilStep(maxHours * 1.08, 1) || 5 }
  }
}

/**
 * 解析「逆变器在线/总数」，对齐锦浪原平台 stationList 列展示逻辑。
 */
export function resolveInverterOnlineStatus (station, inverterStatusVo) {
  const total = toNumber(station && station.inverterCount)
  if (inverterStatusVo) {
    const statusTotal = toNumber(inverterStatusVo.all)
    const statusOnline = toNumber(inverterStatusVo.normal)
    if (statusTotal > 0) {
      return {
        online: statusOnline,
        total: statusTotal,
        text: `${statusOnline}/${statusTotal}`,
        source: 'inverterStatusVo'
      }
    }
  }

  let online = toNumber(station && station.inverterOnlineCount)
  const stationState = toNumber(station && station.state)
  const hasGeneration = toNumber(station && station.power) > 0 || toNumber(station && station.dayEnergy) > 0

  if (online <= 0 && total > 0 && stationState === 1 && hasGeneration) {
    online = total
  }

  online = Math.min(Math.max(online, 0), total || online)

  return {
    online,
    total,
    text: total > 0 ? `${online}/${total}` : '--',
    source: online === toNumber(station && station.inverterOnlineCount) ? 'inverterOnlineCount' : 'fallback'
  }
}

// ------------------------------------------------------------------
// EMS 总负载融合层
// 用本地电表真实总负载替换锦浪自洽假数据（familyLoadPower == power）
// 买电 = 总负载 - 光伏，推算得出
// ------------------------------------------------------------------

/**
 * 与 computeEnergyFlowDiagram 一致，但 LOAD_POWER 使用外部真实总负载
 * @param {Object} data - stationDetail
 * @param {number} realLoadPower - EMS 真实总负载功率 (kW)
 */
export function computeEnergyFlowWithRealLoad (data, realLoadPower) {
  if (!data) return { ...EMPTY_FLOW_DIAGRAM }

  const PV_POWER = toNumber(data.power)
  const LOAD_POWER = realLoadPower
  const GRID_POWER = LOAD_POWER - PV_POWER // 正值=买电，负值=卖电
  const BAT_POWER = toNumber(data.batteryPower)

  // 有真实总负载时始终启用三节点
  const hasLoad = LOAD_POWER > 0
  const gridActive = Math.abs(GRID_POWER) > 0.01

  if (!hasLoad || !gridActive) {
    return buildPvDirectFlow(PV_POWER, LOAD_POWER, GRID_POWER, BAT_POWER)
  }
  return buildThreeNodeFlow(PV_POWER, LOAD_POWER, GRID_POWER, BAT_POWER)
}

/**
 * 将 EMS 小时级负载功率合并到锦浪 5 分钟粒度日曲线中
 * @param {Array} jinlangSlots - mapDayRuntimeRecordsToFullDay 结果
 * @param {(number|null)[]} emsLoadSlots - EMS 负载时隙
 * @returns {Array} 合并后的 slots，load 字段替换为 EMS 真实值，grid 重新推算
 */
export function mergeEmsLoadIntoDaySlots (jinlangSlots, emsLoadSlots) {
  if (!Array.isArray(jinlangSlots)) return []
  const merged = jinlangSlots.map((slot, idx) => {
    const emsLoad = emsLoadSlots && idx < emsLoadSlots.length ? emsLoadSlots[idx] : null
    const pvVal = slot.pv != null ? slot.pv : slot.power
    const pvNum = toNumber(pvVal)
    const hasEmsLoad = emsLoad != null && Number.isFinite(Number(emsLoad))
    const loadNum = hasEmsLoad ? Number(emsLoad) : 0
    // 日折线展示口径：电网 = 光伏 - 负载
    // 负值=买电（零轴下方），正值=卖电（零轴上方）
    const gridSigned = hasEmsLoad ? pvNum - loadNum : null
    const grid = gridSigned == null ? null : Math.abs(gridSigned)

    return {
      label: slot.label,
      pv: pvNum > 0 ? pvNum : null,
      load: hasEmsLoad ? loadNum : null,
      grid: grid != null && grid > 0.01 ? grid : null,
      gridSigned,
      power: pvNum > 0 ? pvNum : null
    }
  })
  return merged
}

/**
 * 将功率参数映射为日曲线的五分钟时隙。
 * 每台设备取自然五分钟时隙内最大 p，再跨设备求和。
 *
 * @param {Array<{ clientId?: string, ts: string, p: number }>} records
 * @param {{ stepMinutes?: number, completedBefore?: Date|string|number }} options
 * @returns {(number|null)[]}
 */
export function mapPowerParamToDaySlots (
  records,
  { stepMinutes = 5, completedBefore = null } = {}
) {
  const slotCount = (24 * 60) / stepMinutes
  const slots = new Array(slotCount).fill(null)
  const slotDeviceMax = Array.from({ length: slotCount }, () => new Map())
  if (!Array.isArray(records) || records.length === 0) return slots

  const bucketMs = stepMinutes * 60 * 1000
  const completedBeforeMs = completedBefore == null
    ? null
    : new Date(completedBefore).getTime()

  records.forEach((record, recordIndex) => {
    if (!record || !record.ts) return
    const timePart = String(record.ts).split(' ')[1]
    if (!timePart) return
    const parts = timePart.split(':')
    const h = Number(parts[0])
    const m = Number(parts[1])
    const s = Number(parts[2] || 0)
    if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) return

    // 按 [00:00:00, 00:04:59] 这样的自然时间区间向下分桶
    const totalSeconds = h * 3600 + m * 60 + s
    const slotIdx = Math.floor(totalSeconds / (stepMinutes * 60))
    if (slotIdx < 0 || slotIdx >= slotCount) return

    if (Number.isFinite(completedBeforeMs)) {
      const timestamp = new Date(String(record.ts).replace(' ', 'T')).getTime()
      if (!Number.isFinite(timestamp)) return
      const bucketStart = Math.floor(timestamp / bucketMs) * bucketMs
      if (bucketStart + bucketMs > completedBeforeMs) return
    }

    const p = Number(record.p)
    if (Number.isFinite(p) && p >= 0) {
      // 缺少 clientId 时无法判断设备覆盖，只保留为独立记录参与功率汇总
      const deviceKey = record.clientId == null || record.clientId === ''
        ? `__record_${recordIndex}`
        : String(record.clientId)
      const currentMax = slotDeviceMax[slotIdx].get(deviceKey)
      if (currentMax == null || p > currentMax) {
        slotDeviceMax[slotIdx].set(deviceKey, p)
      }
    }
  })

  for (let i = 0; i < slotCount; i++) {
    const deviceMax = slotDeviceMax[i]
    if (deviceMax.size === 0) continue
    slots[i] = Array.from(deviceMax.values()).reduce((sum, p) => sum + p, 0)
  }

  return slots
}

/**
 * 合并同一统计周期的数值快照。
 * 固定历史时隙采用单调补全：迟到数据可以把聚合值补高，但局部查询不能用较小值覆盖完整快照。
 *
 * @param {(number|null)[]} currentSlots
 * @param {(number|null)[]} incomingSlots
 * @returns {(number|null)[]}
 */
export function mergeMonotonicSlotValues (currentSlots, incomingSlots) {
  const current = Array.isArray(currentSlots) ? currentSlots : []
  const incoming = Array.isArray(incomingSlots) ? incomingSlots : []
  const slotCount = Math.max(current.length, incoming.length)

  return Array.from({ length: slotCount }, (_, index) => {
    const currentValue = Number(current[index])
    const incomingValue = Number(incoming[index])
    const hasCurrent = current[index] != null && Number.isFinite(currentValue)
    const hasIncoming = incoming[index] != null && Number.isFinite(incomingValue)

    if (!hasIncoming) return hasCurrent ? currentValue : null
    if (!hasCurrent) return incomingValue
    return Math.max(currentValue, incomingValue)
  })
}

/**
 * 从功率参数记录中提取最新自然时隙的总负载功率。
 * 口径与日折线一致：每台设备取该五分钟内最大 p，再跨设备求和。
 * 不额外要求设备数齐全；传入 completedBefore 时仅采用在该时刻前已结束的时隙。
 *
 * @param {Array<{ clientId?: string, ts: string, p: number }>} records
 * @param {{ stepMinutes?: number, completedBefore?: Date|string|number }} options
 * @returns {{ power: number, time: string, deviceCount: number, slotIndex: number }|null}
 */
export function resolveLatestPowerParamLoad (
  records,
  { stepMinutes = 5, completedBefore = null } = {}
) {
  if (!Array.isArray(records) || records.length === 0) return null

  const safeStepMinutes = Number(stepMinutes)
  if (!Number.isFinite(safeStepMinutes) || safeStepMinutes <= 0) return null

  const bucketMs = safeStepMinutes * 60 * 1000
  const bucketDeviceMax = new Map()
  const completedBeforeMs = completedBefore == null
    ? null
    : new Date(completedBefore).getTime()

  records.forEach((record, recordIndex) => {
    if (!record || !record.ts) return

    const timestamp = new Date(String(record.ts).replace(' ', 'T')).getTime()
    const p = Number(record.p)
    if (!Number.isFinite(timestamp) || !Number.isFinite(p) || p < 0) return

    const deviceId = record.clientId == null || record.clientId === ''
      ? `__record_${recordIndex}`
      : String(record.clientId)
    const bucketStart = Math.floor(timestamp / bucketMs) * bucketMs
    const deviceMax = bucketDeviceMax.get(bucketStart) || new Map()
    const currentMax = deviceMax.get(deviceId)
    if (currentMax == null || p > currentMax) {
      deviceMax.set(deviceId, p)
    }
    bucketDeviceMax.set(bucketStart, deviceMax)
  })

  const bucketStarts = Array.from(bucketDeviceMax.keys())
    .filter(bucketStart =>
      !Number.isFinite(completedBeforeMs) ||
      bucketStart + bucketMs <= completedBeforeMs
    )
  if (bucketStarts.length === 0) return null

  const latestBucketStart = Math.max(...bucketStarts)
  const latestDeviceMax = bucketDeviceMax.get(latestBucketStart)
  const power = Array.from(latestDeviceMax.values()).reduce((sum, value) => sum + value, 0)
  const bucketDate = new Date(latestBucketStart)
  const pad = value => String(value).padStart(2, '0')
  const time = `${bucketDate.getFullYear()}-${pad(bucketDate.getMonth() + 1)}-${pad(bucketDate.getDate())} ${pad(bucketDate.getHours())}:${pad(bucketDate.getMinutes())}:00`

  return {
    power,
    time,
    deviceCount: latestDeviceMax.size,
    slotIndex: Math.floor(
      (bucketDate.getHours() * 60 + bucketDate.getMinutes()) / safeStepMinutes
    )
  }
}

/**
 * 当前日尚未结束的五分钟桶只保留“正在上报”状态，不绘制任何功率曲线。
 *
 * @param {Array} slots - 日曲线时隙
 * @param {{ date: string, now?: Date|string|number, stepMinutes?: number }} options
 * @returns {Array}
 */
export function markCurrentDaySlotCollecting (
  slots,
  { date, now = new Date(), stepMinutes = 5 } = {}
) {
  if (!Array.isArray(slots) || slots.length === 0 || !date) return slots

  const current = new Date(now)
  if (!Number.isFinite(current.getTime())) return slots
  const pad = value => String(value).padStart(2, '0')
  const currentDate = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`
  if (date !== currentDate) return slots

  const slotIndex = Math.floor(
    (current.getHours() * 60 + current.getMinutes()) / stepMinutes
  )
  if (slotIndex < 0 || slotIndex >= slots.length) return slots

  const nextSlots = slots.slice()
  nextSlots[slotIndex] = {
    ...(nextSlots[slotIndex] || {}),
    label: `${pad(Math.floor(slotIndex * stepMinutes / 60))}:${pad((slotIndex * stepMinutes) % 60)}`,
    pv: null,
    power: null,
    load: null,
    grid: null,
    gridSigned: null,
    isCollecting: true
  }
  return nextSlots
}

/**
 * 判断是否有 EMS 真实负载数据注入
 */
export function hasRealLoadData (loadPower) {
  return Number.isFinite(loadPower) && loadPower > 0
}
