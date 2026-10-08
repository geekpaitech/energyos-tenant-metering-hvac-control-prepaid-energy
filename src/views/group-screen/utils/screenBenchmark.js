/**
 * 多项目 KPI 对标 & 短板预警 — 基于已对接大屏接口
 * 率类指标行业基准为 100%（理想值）；能耗与停车暂无行业标准，展示 --
 */

/** 行业基准（率类对标理想值 100%；null 表示暂无行业标准） */
export const INDUSTRY_BASELINE = {
  deviceOnlineRate: 100,
  maintenanceCompletionRate: 100,
  unitAreaEnergy: null,
  tenantCollectRate: 100,
  parkingRevenue: null
}

/** 总车位数 */
export const TOTAL_PARKING_SPACES = 1780

const BENCHMARK_PEER_COUNT = 5

function num (val) {
  if (val == null || val === '') return null
  const n = Number(val)
  return Number.isNaN(n) ? null : n
}

function fmtPct (val, digits = 1) {
  const n = num(val)
  if (n == null) return '--'
  return `${n.toLocaleString(undefined, { maximumFractionDigits: digits })}%`
}

function fmtNum (val, digits = 1) {
  const n = num(val)
  if (n == null) return '--'
  return n.toLocaleString(undefined, { maximumFractionDigits: digits })
}

/** 统计区间出场车辆数 ÷ 总车位数，返回平均每个车位的周转次数。 */
export function calculateParkingTurnoverRate (parking = {}) {
  const exitCount = num(parking.totalExitCount)
  if (exitCount == null || TOTAL_PARKING_SPACES <= 0) return null
  return exitCount / TOTAL_PARKING_SPACES
}

/** 越高越好 → 1/5；越低越好（能耗）反向 */
function simRank (projectVal, industryVal, higherIsBetter = true) {
  const p = num(projectVal)
  const b = num(industryVal)
  if (p == null || b == null || b === 0) return '--'
  const ratio = higherIsBetter ? p / b : b / p
  let slot = 5
  if (ratio >= 1.05) slot = 1
  else if (ratio >= 1.0) slot = 2
  else if (ratio >= 0.95) slot = 3
  else if (ratio >= 0.9) slot = 4
  return `${slot}/${BENCHMARK_PEER_COUNT}`
}

/**
 * @param {{ energy?: object, device?: object, collection?: object, parking?: object, maintenance?: object }} sources
 */
export function buildBenchmarkRows (sources = {}) {
  const energy = sources.energy || {}
  const device = sources.device || {}
  const collection = sources.collection || {}
  const parking = sources.parking || {}
  const maintenance = sources.maintenance || {}

  const deviceOnline = device.complete ? num(device.rate) : null
  const unitArea = num(energy.unitAreaEnergyConsumption)
  const collectRate = num(collection.rate)
  const maintRate = num(maintenance.completionRate)
  const turnoverRate = calculateParkingTurnoverRate(parking)

  const rows = [
    {
      metric: '设备在线率',
      projectRaw: deviceOnline,
      industryRaw: INDUSTRY_BASELINE.deviceOnlineRate,
      project: fmtPct(deviceOnline),
      industry: fmtPct(INDUSTRY_BASELINE.deviceOnlineRate),
      rank: simRank(deviceOnline, INDUSTRY_BASELINE.deviceOnlineRate, true),
      higherIsBetter: true
    },
    {
      metric: '维保完成率',
      projectRaw: maintRate,
      industryRaw: INDUSTRY_BASELINE.maintenanceCompletionRate,
      project: fmtPct(maintRate),
      industry: fmtPct(INDUSTRY_BASELINE.maintenanceCompletionRate),
      rank: simRank(maintRate, INDUSTRY_BASELINE.maintenanceCompletionRate, true),
      higherIsBetter: true
    },
    {
      metric: '单位面积能耗',
      projectRaw: unitArea,
      industryRaw: INDUSTRY_BASELINE.unitAreaEnergy,
      project: fmtNum(unitArea),
      industry: fmtNum(INDUSTRY_BASELINE.unitAreaEnergy),
      rank: simRank(unitArea, INDUSTRY_BASELINE.unitAreaEnergy, false),
      higherIsBetter: false
    },
    {
      metric: '租户水电收缴率',
      projectRaw: collectRate,
      industryRaw: INDUSTRY_BASELINE.tenantCollectRate,
      project: fmtPct(collectRate),
      industry: fmtPct(INDUSTRY_BASELINE.tenantCollectRate),
      rank: simRank(collectRate, INDUSTRY_BASELINE.tenantCollectRate, true),
      higherIsBetter: true
    },
    {
      metric: '车位周转率',
      projectRaw: turnoverRate,
      industryRaw: null,
      project: turnoverRate != null ? turnoverRate.toFixed(2) : '--',
      industry: '--',
      rank: '--',
      unit: '次/车位',
      higherIsBetter: true
    }
  ]

  return rows
    .map(r => {
      const gap = calcGap(r.projectRaw, r.industryRaw, r.higherIsBetter)
      let gapClass = 'gap-zero'
      if (gap != null) {
        if (gap > 0.05) gapClass = 'gap-good'
        else if (gap < -0.05) gapClass = 'gap-bad'
      }
      const isShort = gap != null && gap < 0
      return {
        metric: r.metric,
        project: r.project,
        industry: r.industry,
        rank: r.rank,
        unit: r.unit,
        gap: gap == null ? null : gap,
        gapClass,
        isShort,
        rowClass: isShort ? 'is-short' : '',
        _higherIsBetter: r.higherIsBetter
      }
    })
    // 按差距绝对值升序（差距越小排名越前），无基准的排最后
    .sort((a, b) => {
      if (a.gap == null && b.gap == null) return 0
      if (a.gap == null) return 1
      if (b.gap == null) return -1
      return Math.abs(a.gap) - Math.abs(b.gap)
    })
}

function calcGap (projectVal, industryVal, higherIsBetter) {
  const p = num(projectVal)
  const b = num(industryVal)
  if (p == null || b == null) return null
  if (higherIsBetter) return p - b
  return b - p // 能耗：行业 - 项目，正数表示项目更优
}

/**
 * 从对标行中提取短板（劣于行业基准的指标，最多 3 条）
 */
export function buildShortBoardWarnings (benchmarkRows) {
  const items = (benchmarkRows || [])
    .map(row => {
      const gap = row._gap
      if (gap == null || gap >= 0) return null
      const absGap = Math.abs(gap)
      const isPctMetric = String(row.project).includes('%') || row.metric.includes('率')
      const gapText = isPctMetric
        ? `${gap > 0 ? '+' : ''}${gap.toFixed(1)}%`
        : `${gap > 0 ? '+' : ''}${gap.toFixed(1)}`

      let level = 'low'
      if (absGap >= 8) level = 'high'
      else if (absGap >= 4) level = 'mid'

      let baseText = '均低'
      if (row.metric.includes('能耗')) baseText = '超标'
      else if (row.metric.includes('收缴')) baseText = '偏低'

      const current = row.metric.includes('能耗') && !String(row.project).includes('%')
        ? row.project
        : row.project

      return {
        metric: row.metric.includes('能耗') ? '单位面积能耗' : row.metric,
        level,
        current,
        baseText,
        gap: gapText,
        gapClass: row.metric.includes('整改') ? 'gap-cyan' : 'gap-bad',
        _sort: absGap
      }
    })
    .filter(Boolean)
    .sort((a, b) => b._sort - a._sort)
    .slice(0, 5)
    .map(({ _sort, ...rest }) => rest)

  return items
}
