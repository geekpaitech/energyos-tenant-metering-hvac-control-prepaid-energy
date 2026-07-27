/**
 * 月度综合评分 — 考核规则（红框版本）
 * 总得分 = 巡检×25% + 维保×25% + 三关一闭×15% + 安全×20% + 品质×15%
 */

function clampScore (val, decimals = 2) {
  const n = Math.max(0, Math.min(100, Number(val) || 0))
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

/**
 * 巡检 / 维保 / 三关一闭
 * (按时完成率 + 逾期完成率/2 - 未执行率×2) × 100
 */
export function calcTaskScore ({ total, onTime, overdue, unexecuted }) {
  const t = Number(total)
  if (!t || t <= 0) return 0
  const onTimeRate = Number(onTime) / t
  const overdueRate = Number(overdue) / t
  const unexecutedRate = Number(unexecuted) / t
  return clampScore((onTimeRate + overdueRate / 2 - unexecutedRate * 2) * 100)
}

/**
 * 安全 / 品质
 * (问题整改率 - 当月未完成率 - 往期未完成率×2) × 100
 */
export function calcRectificationScore ({
  rectificationRate,
  currentUnfinishedRate,
  previousUnfinishedRate
}) {
  const rect = Number(rectificationRate)
  const cur = Number(currentUnfinishedRate)
  const prev = Number(previousUnfinishedRate)
  return clampScore((rect - cur - prev * 2) * 100)
}

/** 加权综合得分 */
export function calcTotalScore ({ inspection, maintenance, threeClose, safety, quality }) {
  const raw =
    Number(inspection) * 0.25 +
    Number(maintenance) * 0.25 +
    Number(threeClose) * 0.15 +
    Number(safety) * 0.20 +
    Number(quality) * 0.15
  return clampScore(raw, 1)
}

export function formatScoreCell (val) {
  if (val == null || val === '') return '--'
  const n = Number(val)
  if (Number.isNaN(n)) return '--'
  return n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })
}

/** 排名表展示：最多一位小数，减少列宽挤压 */
export function formatScoreRank (val) {
  if (val == null || val === '') return '--'
  const n = Number(val)
  if (Number.isNaN(n)) return '--'
  return n.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 })
}

/** 排名表默认展示行数（不足时补占位行） */
export const MONTHLY_RANK_MIN_ROWS = 5

function emptyScoreCell (label) {
  return { score: '--', tip: `${label}：--` }
}

/** 无数据占位行：排名保留序号，仅项目名与分项为 -- */
export function createPlaceholderRankingRow (rank) {
  return {
    rank,
    name: '--',
    score: '--',
    placeholder: true,
    workOrders: {
      inspection: emptyScoreCell('巡检'),
      maintenance: emptyScoreCell('维保'),
      threeClose: emptyScoreCell('三关一闭')
    },
    rectification: {
      safety: emptyScoreCell('安全'),
      quality: emptyScoreCell('品质')
    }
  }
}

/** 补足至默认行数，避免仅 1 条数据时表格大面积留白 */
export function padMonthlyRankingList (rows, minRows = MONTHLY_RANK_MIN_ROWS) {
  const list = Array.isArray(rows) ? [...rows] : []
  const target = Math.max(minRows, list.length)
  for (let i = list.length; i < target; i += 1) {
    list.push(createPlaceholderRankingRow(i + 1))
  }
  return list
}

function pct (n, total) {
  const t = Number(total)
  if (!t) return '0%'
  return `${((Number(n) / t) * 100).toFixed(1)}%`
}

/** 工单类得分 tooltip（总/按时/逾期/未执行） */
export function workOrderTip (label, counts, score) {
  if (!counts || !counts.total) return `${label}：暂无工单`
  return [
    `${label} ${formatScoreCell(score)}分`,
    `总工单 ${counts.total}`,
    `按时 ${counts.onTime}（${pct(counts.onTime, counts.total)}）`,
    `逾期 ${counts.overdue}（${pct(counts.overdue, counts.total)}）`,
    `未执行 ${counts.unexecuted}（${pct(counts.unexecuted, counts.total)}）`
  ].join('\n')
}

/** 整改类得分 tooltip */
export function rectificationTip (label, rates, score) {
  if (!rates) return `${label}：--`
  const rect = Number(rates.rectificationRate) || 0
  const cur = Number(rates.currentUnfinishedRate) || 0
  const prev = Number(rates.previousUnfinishedRate) || 0
  return [
    `${label} ${formatScoreCell(score)}分`,
    `问题整改率 ${(rect * 100).toFixed(1)}%`,
    `当月未完成率 ${(cur * 100).toFixed(1)}%`,
    `往期未完成率 ${(prev * 100).toFixed(1)}%`
  ].join('\n')
}

/** 由模拟原始工单统计 → 层级展示行 */
export function buildRankingRow (raw) {
  const inspectionScore = calcTaskScore(raw.inspection)
  const maintenanceScore = calcTaskScore(raw.maintenance)
  const threeCloseScore = calcTaskScore(raw.threeClose)
  const safetyScore = calcRectificationScore(raw.safety)
  const qualityScore = calcRectificationScore(raw.quality)
  const totalScore = calcTotalScore({
    inspection: inspectionScore,
    maintenance: maintenanceScore,
    threeClose: threeCloseScore,
    safety: safetyScore,
    quality: qualityScore
  })
  return {
    name: raw.name,
    score: formatScoreRank(totalScore),
    workOrders: {
      inspection: {
        score: formatScoreRank(inspectionScore),
        weight: '25%',
        counts: { ...raw.inspection },
        tip: workOrderTip('巡检', raw.inspection, inspectionScore)
      },
      maintenance: {
        score: formatScoreRank(maintenanceScore),
        weight: '25%',
        counts: { ...raw.maintenance },
        tip: workOrderTip('维保', raw.maintenance, maintenanceScore)
      },
      threeClose: {
        score: formatScoreRank(threeCloseScore),
        weight: '15%',
        counts: { ...raw.threeClose },
        tip: workOrderTip('三关一闭', raw.threeClose, threeCloseScore)
      }
    },
    rectification: {
      safety: {
        score: formatScoreRank(safetyScore),
        weight: '20%',
        rates: { ...raw.safety },
        tip: rectificationTip('安全', raw.safety, safetyScore)
      },
      quality: {
        score: formatScoreRank(qualityScore),
        weight: '15%',
        rates: { ...raw.quality },
        tip: rectificationTip('品质', raw.quality, qualityScore)
      }
    }
  }
}

/** 按综合得分排序并写入排名 */
export function buildMonthlyRanking (rawList) {
  const rows = rawList.map(buildRankingRow)
  rows.sort((a, b) => Number(b.score) - Number(a.score))
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}

function scoreTip (label, val) {
  if (val == null || val === '' || Number.isNaN(Number(val))) {
    return `${label}：--`
  }
  return `${label} ${formatScoreCell(val)}分`
}

function mapScoreCell (val) {
  return {
    score: formatScoreRank(val)
  }
}

/** 接口 getProjectScoreRankings → 排名表展示行 */
export function mapProjectScoreRankingItem (item) {
  if (!item) return null
  const inspection = mapScoreCell(item.inspectionScore)
  const maintenance = mapScoreCell(item.maintenanceScore)
  const threeClose = mapScoreCell(item.threeCloseOneShutScore)
  const safety = mapScoreCell(item.safetyScore)
  const quality = mapScoreCell(item.qualityScore)

  return {
    rank: item.rank != null ? Number(item.rank) : null,
    name: item.projectName ? String(item.projectName).trim() : '--',
    score: formatScoreRank(item.overallScore),
    workOrders: {
      inspection: { ...inspection, tip: scoreTip('巡检', item.inspectionScore) },
      maintenance: { ...maintenance, tip: scoreTip('维保', item.maintenanceScore) },
      threeClose: { ...threeClose, tip: scoreTip('三关一闭', item.threeCloseOneShutScore) }
    },
    rectification: {
      safety: { ...safety, tip: scoreTip('安全', item.safetyScore) },
      quality: { ...quality, tip: scoreTip('品质', item.qualityScore) }
    }
  }
}

/** 接口列表 → 按 rank 升序；无 rank 时按综合分降序补排名 */
export function mapProjectScoreRankings (list) {
  if (!Array.isArray(list)) return padMonthlyRankingList([])
  const rows = list.map(mapProjectScoreRankingItem).filter(Boolean)
  const hasRank = rows.some(r => r.rank != null && !Number.isNaN(r.rank))

  if (hasRank) {
    rows.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999))
    return padMonthlyRankingList(rows)
  }

  rows.sort((a, b) => Number(b.score) - Number(a.score))
  return padMonthlyRankingList(rows.map((r, i) => ({ ...r, rank: i + 1 })))
}
