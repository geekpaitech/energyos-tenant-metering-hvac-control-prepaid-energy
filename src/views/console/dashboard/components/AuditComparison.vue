<template>
  <div class="audit-comparison">
    <div class="panel-header">
      <div class="header-left">
        <div class="icon-box">
          <img class="icon-img" src="../image/review.png" alt="核查审计" />
        </div>
        <div class="title-box">
          <div class="title-row">
            <h3>核查差异定位</h3>
            <span v-if="titleTag" class="period-tag">{{ titleTag }}</span>
          </div>
          <p>{{ subTitle }}</p>
        </div>
      </div>
      <!-- <div class="header-right">
        <el-tag size="mini" type="success">已完成</el-tag>
        <div class="ai-pill">查看报告<i class="el-icon-arrow-right"></i></div>
      </div> -->
    </div>

    <div class="panel-body">
      <div class="summary-grid">
        <div class="summary-card">
          <p class="summary-label">账期</p>
          <p class="summary-value">{{ latest.period }}</p>
        </div>
        <div class="summary-card">
          <p class="summary-label">上传</p>
          <p class="summary-value">{{ latest.uploadTimes }}次</p>
          <p class="summary-sub">{{ latest.uploadAt }}</p>
        </div>
        <div class="summary-card">
          <p class="summary-label">总电费</p>
          <p class="summary-value">¥{{ formatNumber(latest.totalAmount) }}</p>
          <p class="summary-sub">系统计费汇总</p>
        </div>
        <div class="summary-card">
          <p class="summary-label">差异</p>
          <p class="summary-value">¥{{ formatNumber(latest.diffAmount) }}</p>
          <p class="summary-sub">{{ latest.diffCount }}条 · {{ formatPercent(diffRate, 2) }}</p>
        </div>
      </div>

      <div class="content-split">
        <div class="left-pane">
          <div class="section-header">
            <p class="section-title">差异趋势</p>
            <p class="section-sub">近6期 · 金额(元)</p>
          </div>

          <div class="trend-main">
            <div class="trend-metric">
              <p class="trend-title">本期差异金额</p>
              <p class="trend-value">¥{{ formatNumber(latest.diffAmount) }}</p>
              <p class="trend-sub">上传文件：{{ latest.fileName }}</p>
            </div>
            <svg class="sparkline" viewBox="0 0 180 44" preserveAspectRatio="none">
              <path class="sparkline-bg" d="M 6 40 L 174 40"></path>
              <path class="sparkline-line" :d="sparkPath"></path>
            </svg>
          </div>
        </div>

        <div class="right-pane">
          <div class="section-header">
            <p class="section-title">分项定位TOP</p>
            <p class="section-sub">按线损率</p>
          </div>

          <div class="hot-list">
            <template v-if="hotspots && hotspots.length">
              <div v-for="hot in hotspots" :key="hot.key" class="hot-item">
                <div class="hot-top">
                  <p class="hot-name">{{ hot.parentName }}</p>
                  <p class="hot-count">{{ formatLossRate(hot.lossRate) }}</p>
                </div>
                <div class="hot-pair">
                  <div class="hot-node">
                    <p class="hot-node-name">{{ hot.parentName }}</p>
                    <p class="hot-node-sub">{{ hot.parentSerial }}</p>
                  </div>
                  <div class="hot-mid">
                    <div :class="['loss-badge', hot.tone]">{{ formatLossRate(hot.lossRate) }}</div>
                    <div class="hot-mid-line"></div>
                  </div>
                  <div class="hot-node">
                    <p class="hot-node-name">{{ hot.childName }}</p>
                    <p class="hot-node-sub">{{ hot.childSerial }}</p>
                  </div>
                </div>
                <p class="hot-sub">{{ hot.path }}</p>
                <div class="hot-bar">
                  <div :class="['hot-bar-inner', hot.tone]" :style="{ width: `${hotWidth(hot.lossRate)}%` }"></div>
                </div>
              </div>
            </template>
            <div v-else class="hot-empty">
              <p class="hot-empty-title">{{ hotspotEmptyTitle }}</p>
              <p class="hot-empty-sub">{{ hotspotEmptySub }}</p>
            </div>
          </div>

          <div class="quick-actions">
            <button class="action-btn primary" @click="goToSubMetering">
              <i class="el-icon-share"></i>
              <span>去分项定位</span>
              <i class="el-icon-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import { getEbvRecordList } from '@/api/ebvRecord'
import { ebvRecordMonthCompare } from '@/api/newDashboard'
import { getTree } from '@/api/newSubMetering'

export default {
  name: 'AuditComparison',
  data () {
    return {
      subTitle: '差异不可避免 · 依赖分项计量树定位',
      activeMonthKey: '',
      latest: {
        period: '-',
        uploadTimes: 0,
        uploadAt: '-',
        fileName: '-',
        diffCount: 0,
        totalAmount: 0,
        diffAmount: 0
      },
      trendMonths: [],
      trendDiffAmounts: [],
      hotspots: [],
      auditMonthKeys: [],
      subMeteringState: 'idle'
    }
  },
  watch: {
    currentManagerId: {
      handler () {
        this.fetchCore()
      },
      immediate: true
    }
  },
  mounted () {
    if (this.currentManagerId) this.fetchCore()
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    titleTag () {
      const period = String(this.activeMonthKey || this.latest?.period || '')
      if (!period || period === '-') return ''
      const lastMonth = moment().subtract(1, 'month').format('YYYY-MM')
      return period === lastMonth ? '上月' : '历史'
    },
    hotspotEmptyTitle () {
      return this.subMeteringState === 'not_built' ? '缺省未构建' : '未有线损'
    },
    hotspotEmptySub () {
      return this.subMeteringState === 'not_built'
        ? '请先在分项计量里构建拓扑树'
        : '当前账期暂无线损异常段'
    },
    diffRate () {
      const total = Number(this.latest?.totalAmount || 0)
      const diff = Number(this.latest?.diffAmount || 0)
      if (!total || Number.isNaN(total) || Number.isNaN(diff)) return 0
      return diff / total
    },
    sparkPath () {
      const values = Array.isArray(this.trendDiffAmounts) ? this.trendDiffAmounts.map(v => Number(v || 0)) : []
      const width = 180
      const height = 44
      const padding = 6

      if (values.length < 2) return ''
      const min = Math.min(...values)
      const max = Math.max(...values)
      const range = max - min || 1

      const stepX = (width - padding * 2) / (values.length - 1)
      const points = values.map((v, idx) => {
        const x = padding + idx * stepX
        const y = height - padding - ((v - min) / range) * (height - padding * 2)
        return { x, y }
      })

      return points.reduce((d, p, idx) => (idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${d} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`), '')
    }
  },
  methods: {
    async mountedFetch () {
      await this.fetchCore()
    },
    async fetchCore () {
      if (!this.currentManagerId) return
      const audit = await this.fetchAuditRecords()
      const month = audit && audit.month ? audit.month : null
      this.auditMonthKeys = (audit && Array.isArray(audit.monthKeys)) ? audit.monthKeys : []
      const defaultMonth = moment().subtract(1, 'month').format('YYYY-MM')
      const activeMonth = month || defaultMonth
      this.activeMonthKey = activeMonth

      this.latest.period = activeMonth
      this.subTitle = month
        ? `${activeMonth} 账期 · 核查差异定位`
        : `${activeMonth} 账期 · 未上传电费核查联`

      if (audit && audit.latestRecord) {
        this.latest.uploadTimes = Number(audit.uploadTimes || 1)
        this.latest.uploadAt = audit.latestRecord.createTime || '-'
        this.latest.fileName = audit.latestRecord.fileName || '-'
      } else {
        this.latest.uploadTimes = 0
        this.latest.uploadAt = '-'
        this.latest.fileName = '-'
      }

      await Promise.all([
        this.fetchMonthCompare(activeMonth),
        this.fetchHotspots(activeMonth)
      ])
    },
    async fetchAuditRecords () {
      try {
        const res = await getEbvRecordList({
          managerId: this.currentManagerId,
          beginTime: moment().subtract(2, 'year').startOf('year').format('YYYY-MM-DD'),
          endTime: moment().endOf('day').format('YYYY-MM-DD')
        })
        const list = (res && Array.isArray(res.data)) ? res.data : []
        if (!list.length) return null
        const norm = list.map(r => {
          const d = String(r.startDate || r.occurDate || r.createTime || '')
          const m = moment(d)
          return m.isValid() ? { key: m.format('YYYY-MM'), rec: r, time: m.valueOf() } : null
        }).filter(Boolean)
        if (!norm.length) return null
        const monthKeys = Array.from(new Set(norm.map(x => x.key))).sort((a, b) => b.localeCompare(a))
        const lastMonth = moment().subtract(1, 'month').format('YYYY-MM')
        const month = monthKeys.includes(lastMonth) ? lastMonth : monthKeys[0]
        const inMonth = norm.filter(x => x.key === month).sort((a, b) => (b.time || 0) - (a.time || 0))
        const latestRecord = inMonth.length ? inMonth[0].rec : null
        return {
          month,
          monthKeys,
          latestRecord,
          uploadTimes: inMonth.length || 1
        }
      } catch (e) {
        return null
      }
    },
    isAuditUploaded (monthKey) {
      if (!monthKey) return false
      const keys = Array.isArray(this.auditMonthKeys) ? this.auditMonthKeys : []
      return keys.includes(monthKey)
    },
    async fetchMonthCompare (targetMonth) {
      try {
        const beginTime = moment().subtract(5, 'month').startOf('month').format('YYYY-MM-DD')
        const endTime = moment().endOf('month').format('YYYY-MM-DD')
        const res = await ebvRecordMonthCompare({
          managerId: this.currentManagerId,
          beginTime,
          endTime
        })
        const list = (res && Array.isArray(res.data)) ? res.data : []
        const sorted = list
          .map(d => ({
            monthDate: String(d && d.monthDate || ''),
            systemElecBalance: Number(d && d.systemElecBalance || 0),
            ebvBalance: Number(d && d.ebvBalance || 0)
          }))
          .filter(d => d.monthDate)
          .sort((a, b) => a.monthDate.localeCompare(b.monthDate))
        this.trendMonths = sorted.map(d => d.monthDate)
        this.trendDiffAmounts = sorted.map(d => (this.isAuditUploaded(d.monthDate) ? Number(d.systemElecBalance - d.ebvBalance) : 0))

        const pickKey = targetMonth || moment().subtract(1, 'month').format('YYYY-MM')
        const pick = sorted.find(d => d.monthDate === pickKey) || (sorted.length ? sorted[sorted.length - 1] : null)
        if (pick) {
          this.latest.totalAmount = Math.round(Number(pick.systemElecBalance || 0))
          this.latest.diffAmount = this.isAuditUploaded(pick.monthDate)
            ? Math.round(Number(pick.systemElecBalance - pick.ebvBalance || 0))
            : 0
        } else {
          this.latest.totalAmount = 0
          this.latest.diffAmount = 0
        }
      } catch (e) {
        this.trendMonths = []
        this.trendDiffAmounts = []
      }
    },
    async fetchHotspots (targetMonth) {
      try {
        this.subMeteringState = 'idle'
        const m = moment(targetMonth + '-01')
        const startDate = m.startOf('month').format('YYYY-MM-DD')
        const endDate = m.endOf('month').format('YYYY-MM-DD')
        const res = await getTree({
          managerId: this.currentManagerId,
          startDate,
          endDate
        })
        const roots = (res && Array.isArray(res.data)) ? res.data : []
        if (!roots.length) {
          this.hotspots = []
          this.subMeteringState = 'not_built'
          return
        }
        const collected = []
        const pickMeter = (node) => {
          if (!node || !Array.isArray(node.meters) || !node.meters.length) return null
          const m = node.meters[0]
          if (!m) return null
          return {
            meterId: m.meterId,
            meterName: m.meterName || '未命名',
            serial: m.serial || '-'
          }
        }
        const findFirstChildWithMeter = (node) => {
          const queue = Array.isArray(node && node.children) ? [...node.children] : []
          while (queue.length) {
            const cur = queue.shift()
            const meter = pickMeter(cur)
            if (meter) return { node: cur, meter }
            const ch = Array.isArray(cur && cur.children) ? cur.children : []
            ch.forEach(c => queue.push(c))
          }
          return null
        }
        const walk = (node, pathArr) => {
          if (!node) return
          const nodeLabel = node.name ? String(node.name) : ''
          const nextPath = nodeLabel ? [...pathArr, nodeLabel] : pathArr
          const lossRate = node.lossRate != null ? parseFloat(node.lossRate) : null
          if (lossRate != null && !Number.isNaN(lossRate) && lossRate > 20) {
            const parentMeter = pickMeter(node)
            const childPick = findFirstChildWithMeter(node)
            if (parentMeter && childPick && childPick.meter) {
              const energy = node.totalEnergy != null ? Number(node.totalEnergy) : 0
              collected.push({
                key: `${String(node.id)}-${String(childPick.node.id)}`,
                parentName: parentMeter.meterName,
                parentSerial: parentMeter.serial,
                childName: childPick.meter.meterName,
                childSerial: childPick.meter.serial,
                lossRate,
                energy,
                path: nextPath.join(' / '),
                tone: lossRate >= 50 ? 'danger' : 'warn'
              })
            }
          }
          const children = Array.isArray(node.children) ? node.children : []
          children.forEach(ch => walk(ch, nextPath))
        }
        roots.forEach(r => walk(r, []))
        collected.sort((a, b) => {
          if (b.lossRate !== a.lossRate) return b.lossRate - a.lossRate
          return Number(b.energy || 0) - Number(a.energy || 0)
        })
        this.hotspots = collected.slice(0, 2)
        this.subMeteringState = this.hotspots.length ? 'has_loss' : 'no_loss'
      } catch (e) {
        this.hotspots = []
        this.subMeteringState = 'no_loss'
      }
    },
    goToSubMetering () {
      this.$router.push({ path: '/power-analysis/energy-overview' })
    },
    formatNumber (value, digits = 0) {
      if (value === null || value === undefined || value === '') return '-'
      const num = Number(value)
      if (Number.isNaN(num)) return '-'
      return num.toLocaleString('zh-CN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      })
    },
    formatPercent (value, digits = 0) {
      const num = Number(value)
      if (Number.isNaN(num)) return '-'
      return `${(num * 100).toFixed(digits)}%`
    },
    formatLossRate (value) {
      const num = Number(value)
      if (Number.isNaN(num)) return '-'
      return `${num.toFixed(2)}%`
    },
    hotWidth (count) {
      const items = Array.isArray(this.hotspots) ? this.hotspots : []
      const max = Math.max(...items.map(i => Number(i.lossRate || 0)), 0) || 1
      const val = Number(count || 0)
      if (Number.isNaN(val)) return 0
      return Math.max(6, Math.round((val / max) * 100))
    }
  }
}
</script>

<style lang="scss" scoped>
.audit-comparison {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F1F5F9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .icon-box {
    width: 30px;
    height: 30px;
    background: #EEF2F7;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(226, 232, 240, 0.9);

    .icon-img {
      width: 18px;
      height: 18px;
      object-fit: contain;
      display: block;
    }
  }

  .title-box {
    .title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .period-tag {
      height: 18px;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: #F8FAFC;
      border: 1px solid rgba(226, 232, 240, 0.9);
      color: #64748B;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }

    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    p {
      font-size: 10px;
      color: #94A3B8;
      margin: 2px 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
}

.ai-pill {
  height: 20px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  background: #E0F2FE;
  color: #0369A1;
  font-size: 10px;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.summary-card {
  border-radius: 12px;
  padding: 10px 10px 9px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #FFFFFF;
  min-width: 0;
}

.summary-label {
  font-size: 9px;
  color: #64748B;
  margin: 0;
}

.summary-value {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 900;
  color: #0F172A;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-sub {
  margin: 2px 0 0;
  font-size: 9px;
  color: #94A3B8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'JetBrains Mono', monospace;
}

.content-split {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 10px;
}

.left-pane,
.right-pane {
  min-height: 0;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.section-title {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  color: #0F172A;
}

.section-sub {
  margin: 0;
  font-size: 9px;
  color: #94A3B8;
  white-space: nowrap;
}

.trend-main {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.trend-metric {
  min-width: 0;
}

.trend-title {
  margin: 0;
  font-size: 9px;
  color: #64748B;
}

.trend-value {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 900;
  color: #0F172A;
  font-family: 'JetBrains Mono', monospace;
}

.trend-sub {
  margin: 4px 0 0;
  font-size: 9px;
  color: #94A3B8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sparkline {
  width: 180px;
  height: 44px;
  flex-shrink: 0;
}

.sparkline-bg {
  stroke: #E2E8F0;
  stroke-width: 1;
  fill: none;
}

.sparkline-line {
  stroke: #0284C7;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.months-row {
  flex: none;
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.month-chip {
  height: 22px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: #64748B;
  font-size: 9px;
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hot-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.hot-empty {
  height: 100%;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px dashed rgba(226, 232, 240, 0.9);
  background: #F8FAFC;
  padding: 16px;
}

.hot-empty-title {
  margin: 0;
  font-size: 12px;
  color: #0F172A;
  font-weight: 900;
}

.hot-empty-sub {
  margin: 6px 0 0;
  font-size: 9px;
  color: #94A3B8;
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
}

.hot-item + .hot-item {
  margin-top: 10px;
}

.hot-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.hot-name {
  margin: 0;
  font-size: 10px;
  color: #334155;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hot-count {
  margin: 0;
  font-size: 10px;
  color: #64748B;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 900;
  flex-shrink: 0;
}

.hot-pair {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 76px 1fr;
  gap: 8px;
  align-items: center;
}

.hot-node {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #FFFFFF;
  padding: 10px 10px 9px;
  min-width: 0;
}

.hot-node-name {
  margin: 0;
  font-size: 10px;
  color: #0F172A;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hot-node-sub {
  margin: 4px 0 0;
  font-size: 9px;
  color: #94A3B8;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hot-mid {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hot-mid-line {
  position: absolute;
  left: 10px;
  right: 10px;
  height: 2px;
  background: rgba(226, 232, 240, 0.9);
  border-radius: 999px;
}

.loss-badge {
  position: relative;
  z-index: 1;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 900;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #F8FAFC;
  color: #334155;
  white-space: nowrap;
}

.loss-badge.warn {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.10);
  color: #B45309;
}

.loss-badge.danger {
  border-color: rgba(185, 28, 28, 0.35);
  background: rgba(185, 28, 28, 0.10);
  color: #B91C1C;
}

.hot-sub {
  margin: 4px 0 0;
  font-size: 9px;
  color: #94A3B8;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hot-bar {
  height: 8px;
  border-radius: 999px;
  background: #F1F5F9;
  overflow: hidden;
  margin-top: 6px;
}

.hot-bar-inner {
  height: 100%;
  border-radius: 999px;
  width: 0;
  transition: width 0.2s ease;
}

.hot-bar-inner.warn { background: rgba(245, 158, 11, 0.75); }
.hot-bar-inner.danger { background: rgba(185, 28, 28, 0.75); }
.hot-bar-inner.info { background: rgba(2, 132, 199, 0.65); }

.quick-actions {
  flex: none;
  display: grid;
  grid-template-columns: 1fr;
  margin-top: 10px;
}

.action-btn {
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #FFFFFF;
  color: #0F172A;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  padding: 0 10px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.action-btn:hover {
  border-color: rgba(148, 163, 184, 0.65);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.action-btn.primary {
  border-color: #409EFF;
  background: #FFFFFF;
  color: #409EFF;
  box-shadow: none;
}

.action-btn.primary:hover {
  border-color: #66B1FF;
  background: #ECF5FF;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}
</style>
