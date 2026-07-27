<template>
  <div :class="['real-vs-audit-chart', { 'is-compact': compact }]">
    <div v-if="!compact" class="chart-header">
      <div class="header-row">
        <div class="header-left">
          <div class="icon-box">
            <i class="el-icon-search"></i>
          </div>
          <div class="title-box">
            <h3>真实电费 vs 核查联</h3>
            <p>系统计费与上传核查联自动比对</p>
          </div>
        </div>
        <div class="header-right">
          <div class="stat">
            <p class="stat-label">累计差异</p>
            <p :class="['stat-value', totalDiff > 0 ? 'pos' : totalDiff < 0 ? 'neg' : 'zero']">
              {{ totalDiff > 0 ? '+' : '' }}{{ formatFixed(totalDiff, 4) }}万
            </p>
          </div>
          <div class="stat">
            <p class="stat-label">一致率</p>
            <p class="stat-value match">{{ formatFixed(matchRate, 1) }}%</p>
          </div>
          <div class="ai-pill" @click="handleView">查看<i class="el-icon-arrow-right"></i></div>
        </div>
      </div>
    </div>
    <div class="chart-body">
      <div ref="chartRef" class="chart-container" v-show="!shouldShowEmpty"></div>
      <div v-show="shouldShowEmpty" class="chart-empty">
        <div class="empty-card">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 17h8" />
              <path d="M8 13h6" />
            </svg>
          </div>
          <div class="empty-title">暂无数据</div>
          <div class="empty-sub">核查对比暂未生成</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { mapGetters } from 'vuex'
import { ebvRecordMonthCompare, isDemoManager } from '@/api/newDashboard'

export default {
  name: 'RealVsAuditChart',
  props: {
    year: {
      type: [String, Number],
      default: ''
    },
    // 供父页面展示“AI建议/统计卡”使用。保持默认不向外抛事件，避免影响既有页面。
    emitMetrics: {
      type: Boolean,
      default: false
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      chart: null,
      loading: false,
      rangeBeginTime: '',
      rangeEndTime: '',
      monthKeys: [],
      months: [],
      systemData: [],
      auditData: [],
      systemDataYuan: [],
      auditDataYuan: [],
      auditUploaded: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    hasData () {
      return (this.months && this.months.length > 0) &&
        (this.systemData && this.systemData.length > 0) &&
        (this.auditData && this.auditData.length > 0)
    },
    // 金额单位：万元（与图表内部一致）
    systemTotal () {
      return (this.systemData || []).reduce((acc, v) => acc + (v == null ? 0 : Number(v || 0)), 0)
    },
    auditTotal () {
      return (this.auditData || []).reduce((acc, v) => acc + (v == null ? 0 : Number(v || 0)), 0)
    },
    systemTotalYuan () {
      return (this.systemDataYuan || []).reduce((acc, v) => acc + (v == null ? 0 : Number(v || 0)), 0)
    },
    auditTotalYuan () {
      return (this.auditDataYuan || []).reduce((acc, v) => acc + (v == null ? 0 : Number(v || 0)), 0)
    },
    // 以“系统成本 - 核查应收”的口径输出：仅统计已上传核查联的月份，避免因缺失数据导致差异被放大
    systemMinusAuditTotal () {
      const s = (this.systemData || []).reduce((acc, v, i) => {
        if (!this.auditUploaded[i]) return acc
        return acc + (v == null ? 0 : Number(v || 0))
      }, 0)
      const a = (this.auditData || []).reduce((acc, v, i) => {
        if (!this.auditUploaded[i]) return acc
        return acc + (v == null ? 0 : Number(v || 0))
      }, 0)
      return s - a
    },
    systemMinusAuditTotalYuan () {
      const s = (this.systemDataYuan || []).reduce((acc, v, i) => {
        if (!this.auditUploaded[i]) return acc
        return acc + (v == null ? 0 : Number(v || 0))
      }, 0)
      const a = (this.auditDataYuan || []).reduce((acc, v, i) => {
        if (!this.auditUploaded[i]) return acc
        return acc + (v == null ? 0 : Number(v || 0))
      }, 0)
      return s - a
    },
    shouldShowEmpty () {
      return !this.loading && !this.hasData
    },
    uploadedAuditCount () {
      return (this.auditUploaded || []).reduce((acc, v) => acc + (v ? 1 : 0), 0)
    },
    expectedMonthCount () {
      return (this.months || []).length
    },
    hasMissingAudit () {
      return this.expectedMonthCount > 0 && this.uploadedAuditCount < this.expectedMonthCount
    },
    missingAuditMonths () {
      return (this.months || []).filter((m, i) => !this.auditUploaded[i])
    },
    diffData () {
      return this.systemData.map((v, i) => {
        if (!this.auditUploaded[i]) return null
        return Number(this.auditData[i] || 0) - Number(v || 0)
      })
    },
    totalDiff () {
      const sum = this.diffData.reduce((acc, v) => acc + (v == null ? 0 : Number(v || 0)), 0)
      return sum
    },
    matchRate () {
      const rates = []
      for (let i = 0; i < this.systemData.length; i++) {
        if (!this.auditUploaded[i]) continue
        const s = Number(this.systemData[i] || 0)
        const a = Number(this.auditData[i] || 0)
        const base = Math.max(Math.abs(s), Math.abs(a))
        if (!base) continue
        const r = 1 - (Math.abs(a - s) / base)
        rates.push(Math.max(0, Math.min(1, r)))
      }
      if (!rates.length) return 0
      const avg = rates.reduce((acc, v) => acc + v, 0) / rates.length
      return this.round(avg * 100, 1)
    }
  },
  watch: {
    year: {
      handler () {
        this.fetchData()
      }
    },
    hasData: {
      handler () {
        this.maybeEmitMetrics()
      },
      immediate: true
    },
    systemData: {
      handler () {
        this.maybeEmitMetrics()
      }
    },
    auditData: {
      handler () {
        this.maybeEmitMetrics()
      }
    },
    matchRate: {
      handler () {
        this.maybeEmitMetrics()
      }
    },
    auditUploaded: {
      handler () {
        this.maybeEmitMetrics()
      }
    },
    months: {
      handler () {
        this.maybeEmitMetrics()
      }
    },
    currentManagerId: {
      handler () {
        this.fetchData()
      },
      immediate: true
    }
  },
  mounted () {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    maybeEmitMetrics () {
      if (!this.emitMetrics) return
      this.$emit('chart-metrics', {
        hasData: this.hasData,
        months: this.months,
        monthKeys: this.monthKeys,
        rangeBeginTime: this.rangeBeginTime,
        rangeEndTime: this.rangeEndTime,
        year: this.year,
        systemTotalWan: this.systemTotal,
        auditTotalWan: this.auditTotal,
        systemTotalYuan: this.systemTotalYuan,
        auditTotalYuan: this.auditTotalYuan,
        // 口径：系统成本 - 核查应收
        diffSystemMinusAuditWan: this.systemMinusAuditTotal,
        diffSystemMinusAuditYuan: this.systemMinusAuditTotalYuan,
        // 口径：核查 - 系统（组件内部用于差异折线的口径）
        totalDiffWan: this.totalDiff,
        matchRate: this.matchRate,
        uploadedAuditCount: this.uploadedAuditCount,
        expectedMonthCount: this.expectedMonthCount,
        hasMissingAudit: this.hasMissingAudit,
        missingAuditMonths: this.missingAuditMonths,
        auditUploaded: this.auditUploaded
      })
    },
    round (v, digits = 2) {
      const n = Number(v || 0)
      const f = Math.pow(10, digits)
      return Math.round((n + Number.EPSILON) * f) / f
    },
    truncateFixed (v, digits = 2) {
      const raw = (v === null || v === undefined) ? '0' : String(v)
      const s0 = raw.trim()
      if (!s0) return digits ? `0.${'0'.repeat(digits)}` : '0'

      const sign = s0[0] === '-' ? '-' : ''
      const s = sign ? s0.slice(1) : s0
      const parts = s.split('.')
      const intPart = (parts[0] || '0') === '' ? '0' : (parts[0] || '0')
      const decRaw = parts.length > 1 ? (parts[1] || '') : ''
      if (!digits) return sign + intPart
      const decPart = decRaw.padEnd(digits, '0').slice(0, digits)
      return sign + intPart + '.' + decPart
    },
    formatFixed (v, digits = 2) {
      return this.truncateFixed(v, digits)
    },
    ensureChart () {
      if (this.chart) return
      const el = this.$refs.chartRef
      if (!el) return
      this.chart = echarts.init(el)
    },
    buildOption () {
      const monthKeys = this.monthKeys
      const auditUploaded = this.auditUploaded
      const fmt = (v) => this.formatFixed(v, 4)
      const compact = !!this.compact
      const option = {
        color: ['#0284C7', '#2DD4BF', '#64748B'],
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter: (params) => {
            const first = params && params.length ? params[0] : null
            const idx = first ? first.dataIndex : 0
            const title = monthKeys[idx] || (first ? first.axisValue : '')
            let html = `<div style="font-weight:600;margin-bottom:4px;font-size:12px">${title}</div>`
            params.forEach(p => {
              const val = (p.value === null || p.value === undefined) ? null : Number(p.value || 0)
              const isUploaded = !!auditUploaded[idx]
              let showVal = ''
              if (p.seriesName === '核查联数据' && !isUploaded) {
                showVal = '未上传'
              } else if (p.seriesName === '差异' && !isUploaded) {
                showVal = '—'
              } else if (val === null) {
                showVal = '—'
              } else if (p.seriesName === '差异') {
                showVal = (val > 0 ? '+' : '') + fmt(val) + '万'
              } else {
                showVal = fmt(val) + '万'
              }
              html += `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${p.color}"></span>
                <span style="color:#64748B;font-size:11px">${p.seriesName}:</span>
                <span style="font-weight:500;font-size:11px">${showVal}</span>
              </div>`
            })
            return html
          }
        },
        legend: {
          data: ['系统计费', '核查联数据', '差异'],
          top: compact ? 6 : 8,
          right: compact ? 6 : 10,
          itemGap: 8,
          textStyle: { color: '#64748B', fontSize: compact ? 9 : 10 },
          itemWidth: compact ? 10 : 12,
          itemHeight: compact ? 5 : 6
        },
        grid: {
          left: 45,
          right: compact ? 44 : 50,
          top: compact ? 34 : 45,
          bottom: compact ? 24 : 30
        },
        xAxis: {
          type: 'category',
          data: this.months,
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#64748B', fontSize: 10 },
          axisTick: { show: false }
        },
        yAxis: [
          {
            type: 'value',
            name: '金额(万)',
            nameTextStyle: { color: '#94A3B8', fontSize: 9 },
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#F1F5F9' } },
            axisLabel: { color: '#64748B', fontSize: 9 }
          },
          {
            type: 'value',
            name: '',
            axisLine: { show: false },
            splitLine: { show: false },
            axisLabel: { color: '#64748B', fontSize: 9, formatter: v => (v > 0 ? '+' : '') + fmt(v) }
          }
        ],
        series: [
          {
            name: '系统计费',
            type: 'bar',
            data: this.systemData,
            itemStyle: { color: '#0284C7', borderRadius: [3, 3, 0, 0] },
            barWidth: compact ? 12 : 14,
            barGap: '10%'
          },
          {
            name: '核查联数据',
            type: 'bar',
            data: this.auditData,
            itemStyle: { color: '#2DD4BF', borderRadius: [3, 3, 0, 0] },
            barWidth: compact ? 12 : 14
          },
          {
            name: '差异',
            type: 'line',
            yAxisIndex: 1,
            data: this.diffData,
            lineStyle: { width: 2, color: '#94A3B8', type: 'dashed' },
            symbol: 'circle',
            symbolSize: 4,
            itemStyle: {
              color: params => {
                if (params.value === null || params.value === undefined) return '#94A3B8'
                return params.value > 0 ? '#E11D48' : '#22C55E'
              }
            },
            label: {
              show: true,
              position: 'top',
              formatter: p => {
                if (p.value === null || p.value === undefined) return ''
                return (p.value > 0 ? '+' : '') + fmt(p.value)
              },
              fontSize: 9,
              color: '#94A3B8'
            }
          }
        ]
      }
      return option
    },
    renderChart () {
      if (this.shouldShowEmpty) {
        if (this.chart) this.chart.clear()
        return
      }
      this.ensureChart()
      if (!this.chart) return
      this.chart.setOption(this.buildOption(), true)
    },
    makeMock () {
      const months = ['1月', '2月', '3月', '4月', '5月', '6月']
      return {
        monthKeys: months.map((m, idx) => `2026-0${idx + 1}`),
        months,
        systemData: [45.2, 38.9, 42.1, 38.5, 41.2, 56.8],
        auditData: [45.8, 39.2, 42.5, 38.8, 41.5, 57.5]
      }
    },
    makeLastSixMonthRange () {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth() - 5, 1)
      const pad2 = (n) => String(n).padStart(2, '0')
      const beginTime = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-01`
      const endTime = `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}`
      return { beginTime, endTime }
    },
    makeYearRange (year) {
      const y = parseInt(year)
      if (!y || Number.isNaN(y)) return this.makeLastSixMonthRange()
      const now = new Date()
      const pad2 = (n) => String(n).padStart(2, '0')
      const beginTime = `${y}-01-01`
      let endDate = null
      if (y === now.getFullYear()) {
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
      } else {
        endDate = new Date(y, 11, 31)
      }
      if (endDate.getFullYear() < y) endDate = new Date(y, 0, 1)
      const endTime = `${y}-${pad2(endDate.getMonth() + 1)}-${pad2(endDate.getDate())}`
      return { beginTime, endTime }
    },
    makeQueryRange () {
      if (this.year !== '' && this.year !== null && this.year !== undefined) {
        const y = String(this.year).trim()
        if (y) return this.makeYearRange(y)
      }
      return this.makeLastSixMonthRange()
    },
    buildMonthKeysBetween (beginTime, endTime) {
      const pad2 = (n) => String(n).padStart(2, '0')
      const parse = (s) => {
        const parts = String(s || '').split('-').map(v => parseInt(v))
        if (!parts.length || !parts[0] || !parts[1]) return null
        return { y: parts[0], m: parts[1] - 1 }
      }
      const b = parse(beginTime)
      const e = parse(endTime)
      if (!b || !e) return []
      const start = new Date(b.y, b.m, 1)
      const end = new Date(e.y, e.m, 1)
      const out = []
      const cur = new Date(start.getFullYear(), start.getMonth(), 1)
      while (cur.getTime() <= end.getTime()) {
        out.push(`${cur.getFullYear()}-${pad2(cur.getMonth() + 1)}`)
        cur.setMonth(cur.getMonth() + 1)
      }
      return out
    },
    makeMockByRange (beginTime, endTime) {
      const monthKeys = this.buildMonthKeysBetween(beginTime, endTime)
      const months = monthKeys.map(k => `${String(k).slice(5).replace(/^0/, '')}月`)
      const base = 35
      const systemDataWan = monthKeys.map((_, i) => base + i * 2.8 + (i % 2 ? 1.1 : 0.6))
      const auditDataWan = monthKeys.map((_, i) => systemDataWan[i] + (i % 3 === 0 ? 0.6 : -0.3))
      const systemDataYuan = systemDataWan.map(v => Number(v || 0) * 10000)
      const auditDataYuan = auditDataWan.map(v => Number(v || 0) * 10000)
      return { monthKeys, months, systemDataWan, auditDataWan, systemDataYuan, auditDataYuan }
    },
    async fetchData () {
      if (!this.currentManagerId) {
        this.monthKeys = []
        this.months = []
        this.systemData = []
        this.auditData = []
        this.systemDataYuan = []
        this.auditDataYuan = []
        this.auditUploaded = []
        this.rangeBeginTime = ''
        this.rangeEndTime = ''
        await this.$nextTick()
        this.renderChart()
        return
      }

      this.loading = true
      try {
        const { beginTime, endTime } = this.makeQueryRange()
        this.rangeBeginTime = beginTime
        this.rangeEndTime = endTime

        if (isDemoManager(this.currentManagerId)) {
          const mock = this.makeMockByRange(beginTime, endTime)
          this.monthKeys = mock.monthKeys
          this.months = mock.months
          this.systemData = mock.systemDataWan
          this.auditData = mock.auditDataWan
          this.systemDataYuan = mock.systemDataYuan
          this.auditDataYuan = mock.auditDataYuan
          this.auditUploaded = mock.auditDataYuan.map(v => Number(v || 0) !== 0)
          return
        }

        const res = await ebvRecordMonthCompare({
          beginTime,
          endTime,
          managerId: this.currentManagerId
        })
        const list = (res && Array.isArray(res.data)) ? res.data : []
        if (!list.length) {
          this.monthKeys = []
          this.months = []
          this.systemData = []
          this.auditData = []
          this.systemDataYuan = []
          this.auditDataYuan = []
          this.auditUploaded = []
          this.rangeBeginTime = beginTime
          this.rangeEndTime = endTime
          return
        }

        const sorted = list
          .map(d => ({
            monthDate: String((d && d.monthDate) || ''),
            systemElecBalance: Number((d && d.systemElecBalance) || 0),
            ebvBalance: Number((d && d.ebvBalance) || 0)
          }))
          .filter(d => d.monthDate)
          .sort((a, b) => a.monthDate.localeCompare(b.monthDate))

        const toWan = (v) => Number(v || 0) / 10000
        this.monthKeys = sorted.map(d => d.monthDate)
        this.months = sorted.map(d => `${String(d.monthDate).slice(5).replace(/^0/, '')}月`)
        this.systemDataYuan = sorted.map(d => Number(d.systemElecBalance || 0))
        this.auditDataYuan = sorted.map(d => Number(d.ebvBalance || 0))
        this.systemData = this.systemDataYuan.map(v => toWan(v))
        this.auditData = this.auditDataYuan.map(v => toWan(v))
        this.auditUploaded = this.auditDataYuan.map(v => Number(v || 0) !== 0)
      } catch (e) {
        this.monthKeys = []
        this.months = []
        this.systemData = []
        this.auditData = []
        this.systemDataYuan = []
        this.auditDataYuan = []
        this.auditUploaded = []
        this.rangeBeginTime = ''
        this.rangeEndTime = ''
      } finally {
        this.loading = false
        await this.$nextTick()
        this.renderChart()
        this.maybeEmitMetrics()
      }
    },
    handleResize () {
      this.chart && this.chart.resize()
    },
    handleView () {
      this.$router.push({ path: '/metering/finance/cost-management' })
    }
  }
}
</script>

<style lang="scss" scoped>
.real-vs-audit-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  padding: 12px 16px;
  border-bottom: 1px solid #F1F5F9;

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
  }

  .icon-box {
    width: 30px;
    height: 30px;
    background: #E0F2FE;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 16px;
      color: #0369A1;
    }
  }

  .title-box {
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

.chart-container {
  flex: 1;
  height: 100%;
  min-height: 0;
  padding: 8px;
}

.real-vs-audit-chart.is-compact .chart-container {
  padding: 0;
}

.chart-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.empty-card {
  width: min(360px, 100%);
  padding: 12px 12px 10px;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px dashed rgba(226, 232, 240, 1);
  text-align: center;
}

.empty-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  background: transparent;
}

.empty-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
}

.empty-sub {
  margin-top: 2px;
  font-size: 10px;
  color: #94A3B8;
}

.stat {
  text-align: right;
}
.stat-label {
  font-size: 9px;
  color: #94A3B8;
  margin: 0;
}
.stat-value {
  font-size: 12px;
  font-weight: 700;
  margin: 2px 0 0;
  font-family: 'JetBrains Mono', monospace;
  color: #0F172A;
}
.stat-value.pos {
  color: #E11D48;
}
.stat-value.neg {
  color: #22C55E;
}
.stat-value.match {
  color: #22C55E;
}
.ai-pill {
  height: 20px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  background: #ECFEFF;
  color: #0E7490;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
</style>
