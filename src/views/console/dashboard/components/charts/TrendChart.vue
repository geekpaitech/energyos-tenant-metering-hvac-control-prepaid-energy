<template>
  <div class="trend-chart" :class="{ 'trend-chart--empty': shouldShowEmpty }">
    <div class="chart-header" style="cursor: pointer;" @click="handleTitleClick">
      <div class="header-left">
        <div class="icon-box">
          <img class="icon-img" :src="require('../../image/hydropower.png')" :alt="$t('dashboard.trend.title')" />
        </div>
        <div class="title-box">
          <h3>{{ $t('dashboard.trend.title') }}</h3>
          <p>{{ trendTitleSub }}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="period-switch" @click.stop>
          <button :class="{ active: datePeriod === 'day' }" @click="setPeriod('day')">{{ $t('dashboard.trend.last7dTab') }}</button>
          <button :class="{ active: datePeriod === 'month' }" @click="setPeriod('month')">{{ $t('dashboard.trend.lastHalfYearTab') }}</button>
        </div>
      </div>
    </div>

    <div
      class="chart-body"
      v-loading="loading && !!currentManagerId"
      :element-loading-text="$t('dashboard.trend.loading')"
      element-loading-spinner="el-icon-loading"
      element-loading-background="rgba(255,255,255,0.82)"
    >
      <!-- v-if 互斥：避免「opacity 隐藏」仍占位 + ECharts 在不可见分支里撑高父级 -->
      <div v-if="!shouldShowEmpty" class="chart-split" key="trend-split">
        <div class="left-pane">
          <div class="stats-bar">
            <div class="sb-elec sb-clickable" @click.stop="handleGoToElecReport">
              <div class="stat-label">{{ elecStatLabel }}</div>
              <div class="stat-value-row">
                <span class="stat-num">{{ summaryElecText }}</span>
                <span
                  v-if="summaryElecDeltaNum !== '--'"
                  class="stat-delta"
                  :class="elecChainDeltaClass"
                >
                  {{ $t('dashboard.trend.chainRatio') }} {{ summaryElecDeltaNum }}
                  <i v-if="elecChainDown || elecChainUp" :class="elecChainDown ? 'el-icon-caret-bottom' : 'el-icon-caret-top'"></i>
                </span>
                <span class="stat-delta muted" v-else>{{ $t('dashboard.trend.chainNone') }}</span>
              </div>
            </div>
            <div class="sb-center sb-clickable" @click.stop="handleGoToElecReport">
              <div class="sub-stat-line">
                <span class="dot" style="background:#FFA07A;"></span>
                <span class="sub-label">{{ $t('dashboard.trend.airElec') }}</span>
                <span class="sub-colon">:</span>
                <span class="sub-val">{{ airElecText }}{{ $t('dashboard.trend.degree') }}</span>
                <span class="sub-pct">{{ airElecPct }}%</span>
              </div>
              <div class="sub-stat-line">
                <span class="dot" style="background:#87CEEB;"></span>
                <span class="sub-label">{{ $t('dashboard.trend.roomElec') }}</span>
                <span class="sub-colon">:</span>
                <span class="sub-val">{{ roomElecText }}{{ $t('dashboard.trend.degree') }}</span>
                <span class="sub-pct">{{ roomElecPct }}%</span>
              </div>
            </div>
            <div class="sb-water sb-clickable" @click.stop="handleGoToWaterReport">
              <div class="stat-label">{{ waterStatLabel }}</div>
              <div class="stat-value-row">
                <span class="stat-num">{{ summaryWaterText }}</span>
                <span
                  v-if="summaryWaterDeltaNum !== '--'"
                  class="stat-delta"
                  :class="waterChainDeltaClass"
                >
                  {{ $t('dashboard.trend.chainRatio') }} {{ summaryWaterDeltaNum }}
                  <i v-if="waterChainDown || waterChainUp" :class="waterChainDown ? 'el-icon-caret-bottom' : 'el-icon-caret-top'"></i>
                </span>
                <span class="stat-delta muted" v-else>{{ $t('dashboard.trend.chainNone') }}</span>
              </div>
            </div>
            <div class="sb-line"></div>
          </div>

          <div class="chart-wrap" style="cursor: pointer;" @click="handleGoToElecReport">
            <div ref="chartRef" class="chart-container"></div>
            <div class="chart-legend">
              <span class="legend-item"><i class="legend-line" style="background:#52c41a;"></i>{{ $t('dashboard.trend.legendElecUsage') }}</span>
              <span class="legend-item"><i class="legend-line" style="background:#2DD4BF;"></i>{{ $t('dashboard.trend.legendWaterUsage') }}</span>
              <span class="legend-item"><i class="legend-bar" style="background:rgba(135,206,235,0.65);"></i>{{ $t('dashboard.trend.legendIndoorFee') }}</span>
              <span class="legend-item"><i class="legend-bar" style="background:rgba(255,160,122,0.65);"></i>{{ $t('dashboard.trend.legendAcFee') }}</span>
              <span class="legend-item"><i class="legend-bar" style="background:rgba(45,212,191,0.26);"></i>{{ $t('dashboard.trend.legendWaterFee') }}</span>
              <span v-if="hasVirtualElec && datePeriod === 'day'" class="legend-item"><i class="legend-bar" style="background:rgba(99,102,241,0.35);"></i>{{ $t('dashboard.trend.legendTodayVirtual') }}</span>
            </div>
          </div>
        </div>

        <div class="right-pane">
          <div class="fee-card" style="cursor: pointer;" @click="handleGoToTenantBill">
            <div class="fee-title">{{ $t('dashboard.trend.feeComposition') }}</div>
            <div class="fee-body">
              <div class="fee-donut">
                <div ref="feeChartRef" class="fee-chart" :style="{ opacity: feeChartVisible ? 1 : 0 }"></div>
                <div v-show="!hasFeeData" class="fee-empty">{{ $t('dashboard.trend.noData') }}</div>
                <div class="fee-center">
                  <div class="fee-center-label">{{ $t('dashboard.trend.totalFeeYuan') }}</div>
                  <div class="fee-center-value">{{ totalFeeText }}</div>
                </div>
              </div>
              <div class="fee-legend">
                <div v-for="item in feeLegend" :key="item.key" class="fee-legend-item">
                  <span class="dot" :style="{ background: item.color }"></span>
                  <span class="name">{{ $t('dashboard.trend.' + item.nameKey) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="fee-card tenant-split-card" style="cursor: pointer;" @click="handleGoToEnergyReport">
            <div class="fee-title">{{ $t('dashboard.trend.tenantSplit') }}</div>
            <div class="fee-body">
              <div class="fee-donut">
                <div ref="tenantChartRef" class="fee-chart" :style="{ opacity: tenantChartVisible ? 1 : 0 }"></div>
                <div v-show="!hasTenantSplitData" class="fee-empty">{{ $t('dashboard.trend.noData') }}</div>
              </div>
              <div v-if="hasTenantSplitData" class="tenant-legend">
                <div class="tenant-legend-item">
                  <span class="dot tenant-dot"></span>
                  <span class="tl-name">{{ $t('dashboard.trend.tenantEnergy') }}</span>
                  <span class="tl-val">{{ tenantKwhText }}</span>
                </div>
                <div class="tenant-legend-item">
                  <span class="dot public-dot"></span>
                  <span class="tl-name">{{ $t('dashboard.trend.publicEnergy') }}</span>
                  <span class="tl-val">{{ publicKwhText }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="chart-empty" key="trend-empty">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" />
        </svg>
        <span>{{ $t('dashboard.trend.noData') }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import moment from 'moment'
import { mapGetters } from 'vuex'
import { getElecStatistics, getElecWaterOverview, getTenantFeeComposition, isDemoManager, queryCwTenantTodayUse, getDashboardEnergyManagement } from '@/api/newDashboard'

/** Number(null)===0，用 isFinite(Number(null)) 会误判「存在今日虚拟」；须先判空 */
function hasValidVirtualElec (usage, fee) {
  return usage != null && fee != null && Number.isFinite(Number(usage)) && Number.isFinite(Number(fee))
}

/** 从环比文案解析小数环比（如 "+132%"→1.32，"-32%"→-0.32），失败返回 NaN */
function parseChainRatioFromText (text) {
  if (text == null || String(text).trim() === '') return NaN
  const m = String(text).match(/(-?\d+\.?\d*)\s*%/)
  if (!m) return NaN
  const num = parseFloat(m[1])
  if (!Number.isFinite(num)) return NaN
  return num / 100
}

export default {
  name: 'TrendChart',
  data () {
    return {
      chart: null,
      loading: false,
      feeChart: null,
      feeDto: null,
      feeChartVisible: true,
      ensureChartTimer: null,
      ensureChartTries: 0,
      ensureFeeChartTimer: null,
      ensureFeeChartTries: 0,
      // 租户/公区能耗拆分
      tenantSplitChart: null,
      tenantEnergyData: null,
      tenantChartVisible: true,
      ensureTenantChartTimer: null,
      ensureTenantChartTries: 0,
      chartData: {
        labels: [],
        elecUsage: [],
        waterUsage: [],
        elecIncome: [],
        airIncome: [],
        waterIncome: [],
        airUsage: [],
        meterUsage: [],
        _virtualElecIndex: null,
        _virtualElecUsage: null,
        _virtualElecFee: null
      },
      datePeriod: 'day',
      /** 用电/水顶部概览（接口 ElecWaterOverviewDto） */
      elecWaterOverview: null
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    hasData () {
      const hasFinite = (arr) => Array.isArray(arr) && arr.some(v => Number.isFinite(Number(v)))
      return hasFinite(this.chartData.elecUsage) ||
        hasFinite(this.chartData.waterUsage) ||
        hasFinite(this.chartData.elecIncome) ||
        hasFinite(this.chartData.waterIncome) ||
        hasValidVirtualElec(this.chartData._virtualElecUsage, this.chartData._virtualElecFee)
    },
    shouldShowEmpty () {
      return !this.loading && !this.hasData
    },
    hasVirtualElec () {
      return hasValidVirtualElec(this.chartData._virtualElecUsage, this.chartData._virtualElecFee)
    },
    summaryElecText () {
      const o = this.elecWaterOverview
      if (o && Number.isFinite(Number(o.sevenDayElecUse))) return Number(o.sevenDayElecUse).toFixed(2)
      return '--'
    },
    summaryWaterText () {
      const o = this.elecWaterOverview
      if (o && Number.isFinite(Number(o.sevenDayWaterUse))) return Number(o.sevenDayWaterUse).toFixed(2)
      return '--'
    },
    summaryElecDeltaNum () {
      const o = this.elecWaterOverview
      if (!o) return '--'
      if (o.sevenDayElecChainRatioText != null && String(o.sevenDayElecChainRatioText).trim() !== '') {
        return String(o.sevenDayElecChainRatioText).trim()
      }
      const r = Number(o.sevenDayElecChainRatio)
      if (!Number.isFinite(r)) return '--'
      const pct = r * 100
      return `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`
    },
    summaryWaterDeltaNum () {
      const o = this.elecWaterOverview
      if (!o) return '--'
      if (o.sevenDayWaterChainRatioText != null && String(o.sevenDayWaterChainRatioText).trim() !== '') {
        return String(o.sevenDayWaterChainRatioText).trim()
      }
      const r = Number(o.sevenDayWaterChainRatio)
      if (!Number.isFinite(r)) return '--'
      const pct = r * 100
      return `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`
    },
    elecChainRatioNumeric () {
      const o = this.elecWaterOverview
      if (!o) return NaN
      const r = Number(o.sevenDayElecChainRatio)
      if (Number.isFinite(r)) return r
      return parseChainRatioFromText(o.sevenDayElecChainRatioText)
    },
    waterChainRatioNumeric () {
      const o = this.elecWaterOverview
      if (!o) return NaN
      const r = Number(o.sevenDayWaterChainRatio)
      if (Number.isFinite(r)) return r
      return parseChainRatioFromText(o.sevenDayWaterChainRatioText)
    },
    elecChainDown () {
      const r = this.elecChainRatioNumeric
      return Number.isFinite(r) && r < 0
    },
    elecChainUp () {
      const r = this.elecChainRatioNumeric
      return Number.isFinite(r) && r > 0
    },
    waterChainDown () {
      const r = this.waterChainRatioNumeric
      return Number.isFinite(r) && r < 0
    },
    waterChainUp () {
      const r = this.waterChainRatioNumeric
      return Number.isFinite(r) && r > 0
    },
    elecChainDeltaClass () {
      if (this.summaryElecDeltaNum === '--') return 'muted'
      if (this.elecChainDown) return 'green'
      if (this.elecChainUp) return 'red'
      return 'muted'
    },
    waterChainDeltaClass () {
      if (this.summaryWaterDeltaNum === '--') return 'muted'
      if (this.waterChainDown) return 'green'
      if (this.waterChainUp) return 'red'
      return 'muted'
    },
    trendTitleSub () {
      return this.datePeriod === 'day' ? this.$t('dashboard.trend.subtitleDay') : this.$t('dashboard.trend.subtitleMonth')
    },
    periodShortLabel () {
      return this.datePeriod === 'day' ? this.$t('dashboard.trend.last7d') : this.$t('dashboard.trend.lastHalfYear')
    },
    elecStatLabel () {
      return this.$t('dashboard.trend.elecKwh', { period: this.periodShortLabel })
    },
    waterStatLabel () {
      return this.$t('dashboard.trend.waterTon', { period: this.periodShortLabel })
    },
    airElecText () {
      const o = this.elecWaterOverview
      if (o && Number.isFinite(Number(o.sevenDayAirUse))) return Number(o.sevenDayAirUse).toFixed(2)
      return '--'
    },
    roomElecText () {
      const o = this.elecWaterOverview
      if (o && Number.isFinite(Number(o.sevenDayMeterUse))) return Number(o.sevenDayMeterUse).toFixed(2)
      return '--'
    },
    airElecPct () {
      const o = this.elecWaterOverview
      if (!o) return '--'
      const air = Number(o.sevenDayAirUse)
      const total = Number(o.sevenDayElecUse)
      if (!Number.isFinite(air) || !Number.isFinite(total) || !total) return '--'
      return Math.round((air / total) * 100)
    },
    roomElecPct () {
      const o = this.elecWaterOverview
      if (!o) return '--'
      const meter = Number(o.sevenDayMeterUse)
      const total = Number(o.sevenDayElecUse)
      if (!Number.isFinite(meter) || !Number.isFinite(total) || !total) return '--'
      return Math.round((meter / total) * 100)
    },
    hasFeeData () {
      if (!this.feeDto) return false
      const v = [
        this.feeDto.elecFee,
        this.feeDto.airFee,
        this.feeDto.waterFee,
        this.feeDto.otherFee
      ].map(x => Number(x)).filter(x => Number.isFinite(x))
      return v.length > 0 && v.some(x => x > 0)
    },
    totalFee () {
      if (!this.feeDto) return null
      const elecFee = Number(this.feeDto.elecFee)
      const airFee = Number(this.feeDto.airFee)
      const waterFee = Number(this.feeDto.waterFee)
      const otherFee = Number(this.feeDto.otherFee)
      const parts = [elecFee, airFee, waterFee, otherFee].map(x => (Number.isFinite(x) ? x : 0))
      return parts.reduce((sum, v) => sum + v, 0)
    },
    totalFeeText () {
      if (this.totalFee === null) return '--'
      return Number(this.totalFee.toFixed(2)).toLocaleString()
    },
    feeLegend () {
      const dto = this.feeDto || {}
      const items = [
        { key: 'elecFee', nameKey: 'feeElec', color: '#0EA5E9', value: dto.elecFee },
        { key: 'airFee', nameKey: 'feeAc', color: '#14B8A6', value: dto.airFee },
        { key: 'waterFee', nameKey: 'feeWater', color: '#93C5FD', value: dto.waterFee },
        { key: 'otherFee', nameKey: 'feeOther', color: '#CBD5E1', value: dto.otherFee }
      ]
      return items.map(it => {
        const n = Number(it.value)
        const valueText = Number.isFinite(n) ? Number(n.toFixed(2)).toLocaleString() : '--'
        return { ...it, valueText }
      })
    },
    // 租户/公区能耗拆分
    tenantEnergyShare () {
      if (!this.tenantEnergyData || !this.tenantEnergyData.shareEnergy) return null
      const s = this.tenantEnergyData.shareEnergy
      const tenant = Number(s.tenantValue)
      const publicVal = Number(s.publicValue)
      if (!Number.isFinite(tenant) || !Number.isFinite(publicVal)) return null
      const total = tenant + publicVal
      if (total <= 0) return null
      let tenantPct
      let publicPct
      if (tenant <= 0) {
        tenantPct = 0
        publicPct = 100
      } else if (publicVal <= 0) {
        tenantPct = 100
        publicPct = 0
      } else {
        tenantPct = Math.max(1, Math.min(99, Math.round((tenant / total) * 100)))
        publicPct = 100 - tenantPct
      }
      return {
        tenantPct,
        publicPct,
        tenantKwh: tenant,
        publicKwh: publicVal
      }
    },
    hasTenantSplitData () {
      return this.tenantEnergyShare !== null
    },
    tenantKwhText () {
      if (!this.tenantEnergyShare) return '--'
      return Number(this.tenantEnergyShare.tenantKwh).toLocaleString() + ' kWh'
    },
    publicKwhText () {
      if (!this.tenantEnergyShare) return '--'
      return Number(this.tenantEnergyShare.publicKwh).toLocaleString() + ' kWh'
    }
  },
  watch: {
    currentManagerId: {
      handler () {
        this.fetchData()
        this.fetchFee()
        this.fetchTenantSplit()
      },
      immediate: true
    },
    shouldShowEmpty (empty) {
      if (empty) this.disposeCharts()
    },
    '$i18n.locale' () {
      this.$nextTick(() => {
        if (this.chart) this.chart.setOption(this.buildOption(), true)
        if (this.feeChart) this.feeChart.setOption(this.buildFeeOption(), true)
      })
    }
  },
  mounted () {
    // 关键修复：不在 mounted 里直接初始化 ECharts
    // 也不使用 ResizeObserver（它会造成 resize 循环撑大）
    // 只监听 window resize，等数据回来后在正确时机初始化
    window.addEventListener('resize', this.handleResize)
    this.fetchData()
    this.fetchFee()
    this.fetchTenantSplit()
  },
  activated () {
    this.$nextTick(() => {
      if (this.chart) this.chart.resize()
      if (this.feeChart) this.feeChart.resize()
      if (this.tenantSplitChart) this.tenantSplitChart.resize()
    })
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.ensureChartTimer) {
      clearTimeout(this.ensureChartTimer)
      this.ensureChartTimer = null
    }
    if (this.ensureFeeChartTimer) {
      clearTimeout(this.ensureFeeChartTimer)
      this.ensureFeeChartTimer = null
    }
    if (this.ensureTenantChartTimer) {
      clearTimeout(this.ensureTenantChartTimer)
      this.ensureTenantChartTimer = null
    }
    this.disposeCharts()
  },
  methods: {
    reportJumpQuery () {
      // 与报表页约定一致：区间 [今日-7天, 今日]（动态）
      const end = moment().format('YYYY-MM-DD')
      const start = moment().subtract(7, 'days').format('YYYY-MM-DD')
      return { startDate: start, endDate: end }
    },
    handleGoToElecReport () {
      this.$router.push({
        path: '/energy/electricity-report',
        query: this.reportJumpQuery()
      })
    },
    handleGoToWaterReport () {
      this.$router.push({
        path: '/energy/water-report',
        query: this.reportJumpQuery()
      })
    },
    handleGoToTenantBill () {
      this.$router.push('/metering/bill/energy-bill-tenant')
    },
    handleGoToEnergyReport () {
      this.$router.push('/energy/electricity-report')
    },
    disposeCharts () {
      if (this.chart) {
        try {
          this.chart.dispose()
        } catch (e) { }
        this.chart = null
      }
      if (this.feeChart) {
        try {
          this.feeChart.dispose()
        } catch (e) { }
        this.feeChart = null
      }
      if (this.tenantSplitChart) {
        try {
          this.tenantSplitChart.dispose()
        } catch (e) { }
        this.tenantSplitChart = null
      }
      this.ensureChartTries = 0
      this.ensureFeeChartTries = 0
      this.ensureTenantChartTries = 0
    },
    makeMockTrend () {
      const now = new Date()
      const addDays = (d) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + d)
      const addMonths = (m) => new Date(now.getFullYear(), now.getMonth() + m, 1)
      // 与 TopOverviewRow 第一个模块“租户今日用电”保持一致的虚拟数据字段
      const todayUseElec = 6452.76
      const todayUseAmount = 34200.82
      if (this.datePeriod === 'day') {
        const labels = Array.from({ length: 7 }).map((_, i) => {
          const d = addDays(-(6 - i))
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${m}/${day}`
        })
        const elecUsage = [182, 196, 205, 188, 212, 226, 219]
        const airUsage = [110, 118, 123, 113, 127, 136, 131]
        const meterUsage = elecUsage.map((v, i) => v - airUsage[i])
        const waterUsage = [92, 88, 95, 90, 97, 101, 98]
        const elecIncome = [580, 608, 637, 588, 665, 686, 672]
        const airIncome = [240, 252, 273, 252, 285, 294, 288]
        const waterIncome = [120, 116, 124, 119, 126, 132, 128]
        return {
          labels: [...labels, this.$t('dashboard.trend.today')],
          elecUsage: [...elecUsage, null],
          waterUsage: [...waterUsage, null],
          elecIncome: [...elecIncome, null],
          airIncome: [...airIncome, null],
          waterIncome: [...waterIncome, null],
          airUsage: [...airUsage, null],
          meterUsage: [...meterUsage, null],
          _elecCurrTotal: elecUsage.reduce((s, v) => s + v, 0),
          _elecPrevTotal: 1380,
          _waterCurrTotal: waterUsage.reduce((s, v) => s + v, 0),
          _waterPrevTotal: 620,
          _virtualElecIndex: labels.length,
          _virtualElecUsage: todayUseElec,
          _virtualElecFee: todayUseAmount
        }
      } else {
        const labels = Array.from({ length: 6 }).map((_, i) => {
          const d = addMonths(-(5 - i))
          const m = moment(d)
          return this.$i18n.locale === 'en' ? m.locale('en').format('MMM') : `${m.month() + 1}月`
        })
        const elecUsage = [5180, 5040, 5360, 5520, 5410, 5680]
        const airUsage = [3108, 3024, 3216, 3312, 3246, 3408]
        const meterUsage = elecUsage.map((v, i) => v - airUsage[i])
        const waterUsage = [2410, 2330, 2460, 2520, 2490, 2580]
        const elecIncome = [14490, 14112, 15008, 15456, 15148, 15904]
        const airIncome = [8510, 8288, 8792, 8944, 8952, 9296]
        const waterIncome = [3600, 3460, 3720, 3860, 3790, 3950]
        return {
          labels,
          elecUsage,
          waterUsage,
          elecIncome,
          airIncome,
          waterIncome,
          airUsage,
          meterUsage,
          _elecCurrTotal: elecUsage.reduce((s, v) => s + v, 0),
          _elecPrevTotal: 30000,
          _waterCurrTotal: waterUsage.reduce((s, v) => s + v, 0),
          _waterPrevTotal: 14000,
          _virtualElecIndex: null,
          _virtualElecUsage: null,
          _virtualElecFee: null
        }
      }
    },

    async setPeriod (p) {
      if (this.datePeriod === p) return
      this.feeChartVisible = false
      this.tenantChartVisible = false
      this.datePeriod = p
      await this.fetchData()
      await this.fetchFee()
      await this.fetchTenantSplit()
      await this.$nextTick()
      setTimeout(() => { this.feeChartVisible = true; this.tenantChartVisible = true }, 50)
    },

    // 关键修复：初始化前检查容器高度，高度不对就不初始化
    ensureChart () {
      if (this.chart) return
      const el = this.$refs.chartRef
      if (!el) return
      // 容器必须有实际高度才能初始化，否则 ECharts 会用错误尺寸撑大容器
      if (el.clientHeight < 10) {
        if (this.ensureChartTimer) clearTimeout(this.ensureChartTimer)
        if (this.ensureChartTries >= 10) return
        this.ensureChartTries += 1
        this.ensureChartTimer = setTimeout(() => {
          this.ensureChartTimer = null
          this.ensureChart()
        }, 120)
        return
      }
      this.ensureChartTries = 0
      this.chart = echarts.init(el)
      this.chart.getZr().on('click', () => this.handleGoToElecReport())
    },

    buildOption () {
      const {
        labels,
        elecUsage,
        waterUsage,
        elecIncome,
        airIncome,
        waterIncome,
        airUsage,
        meterUsage,
        _virtualElecIndex,
        _virtualElecUsage,
        _virtualElecFee
      } = this.chartData

      const virtualUsage = _virtualElecUsage == null ? NaN : Number(_virtualElecUsage)
      const virtualFee = _virtualElecFee == null ? NaN : Number(_virtualElecFee)
      const hasVirtual = hasValidVirtualElec(_virtualElecUsage, _virtualElecFee) && typeof _virtualElecIndex === 'number'
      const virtualIndex = hasVirtual ? _virtualElecIndex : -1

      // 关键：custom 系列可能不参与坐标轴 extent 计算
      // 所以这里确保右侧 yAxis(费用) 的 max 至少覆盖虚拟电费，保证“今日”柱子可见。
      const feeBarValues = [
        ...(Array.isArray(elecIncome) ? elecIncome : []),
        ...(Array.isArray(airIncome) ? airIncome : []),
        ...(Array.isArray(waterIncome) ? waterIncome : [])
      ]
        .map(v => Number(v))
        .filter(v => Number.isFinite(v) && v >= 0)
      const maxFromBars = feeBarValues.length ? Math.max(...feeBarValues) : 0
      const feeMax = hasVirtual ? Math.max(maxFromBars, virtualFee) : maxFromBars
      const feeAxisMax = (Number.isFinite(feeMax) && feeMax > 0) ? Math.ceil(feeMax * 1.15) : undefined

      const t = (k) => this.$t('dashboard.trend.' + k)
      const sn = {
        elecLine: t('seriesElecUsage'),
        waterLine: t('seriesWaterUsage'),
        virtualSer: t('seriesVirtual'),
        indoorBar: t('seriesIndoorFee'),
        acBar: t('seriesAcFee'),
        waterBar: t('seriesWaterFee')
      }
      const axisLabels = Array.isArray(labels) ? [...labels] : []
      if (hasVirtual && virtualIndex >= 0 && virtualIndex < axisLabels.length) {
        axisLabels[virtualIndex] = t('today')
      }

      return {
        color: ['#52c41a', '#2DD4BF'],
        tooltip: {
          trigger: 'axis',
          confine: false,
          appendToBody: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter: (params) => {
            const idx = params[0] && params[0].dataIndex != null ? params[0].dataIndex : -1
            // 仅在真正悬停到“今日”虚拟点时，才显示简化 tooltip
            if (hasVirtual && idx === virtualIndex) {
              const axisValue = (params[0] && params[0].axisValue) ? params[0].axisValue : ''
              const usageText = Number.isFinite(virtualUsage) ? `${virtualUsage.toLocaleString()} kWh` : '--'
              const feeText = Number.isFinite(virtualFee) ? `${virtualFee.toLocaleString()} ${t('yuan')}` : '--'
              return `
                <div style="font-weight:600;margin-bottom:6px;font-size:12px">${axisValue}</div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#6366F1"></span>
                  <span style="color:#64748B;font-size:11px">${t('tooltipKwh')}:</span>
                  <span style="font-weight:500;font-size:11px">${usageText}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:3px;padding-left:12px">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#6366F1"></span>
                  <span style="color:#94A3B8;font-size:10px">${t('tooltipElecFee')}:</span>
                  <span style="font-weight:500;font-size:10px;color:#475569">${feeText}</span>
                </div>
              `
            }

            const airVal = idx >= 0 && airUsage && airUsage[idx] != null ? Number(airUsage[idx] || 0) : null
            const meterVal = idx >= 0 && meterUsage && meterUsage[idx] != null ? Number(meterUsage[idx] || 0) : null
            let html = `<div style="font-weight:600;margin-bottom:4px;font-size:12px">${params[0].axisValue}</div>`
            params.forEach(p => {
              if (!p || p.value == null) return
              const isWater = p.seriesName === sn.waterLine
              const unit = isWater ? 'm³' : (p.seriesName === sn.elecLine || p.seriesName === sn.virtualSer ? 'kWh' : t('yuan'))
              html += `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${p.color}"></span>
                <span style="color:#64748B;font-size:11px">${p.seriesName}:</span>
                <span style="font-weight:500;font-size:11px">${Number(p.value || 0).toLocaleString()} ${unit}</span>
              </div>`
              if (p.seriesName === sn.elecLine) {
                const elecIncomeVal = idx >= 0 && elecIncome && elecIncome[idx] != null ? Number(elecIncome[idx] || 0) : null
                const airIncomeVal = idx >= 0 && airIncome && airIncome[idx] != null ? Number(airIncome[idx] || 0) : null
                const totalElecFee = (elecIncomeVal !== null && airIncomeVal !== null) ? elecIncomeVal + airIncomeVal : null
                if (totalElecFee !== null) {
                  html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px;padding-left:12px">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#52c41a"></span>
                    <span style="color:#94A3B8;font-size:10px">${t('tooltipTotalElecFee')}:</span>
                    <span style="font-weight:500;font-size:10px;color:#475569">${totalElecFee.toLocaleString()} ${t('yuan')}</span>
                  </div>`
                }
                if (airVal !== null) {
                  html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px;padding-left:12px">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#FFA07A"></span>
                    <span style="color:#94A3B8;font-size:10px">${t('tooltipAcUsage')}:</span>
                    <span style="font-weight:500;font-size:10px;color:#475569">${airVal.toLocaleString()} kWh</span>
                  </div>`
                }
                if (meterVal !== null) {
                  html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px;padding-left:12px">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#87CEEB"></span>
                    <span style="color:#94A3B8;font-size:10px">${t('tooltipRoomUsage')}:</span>
                    <span style="font-weight:500;font-size:10px;color:#475569">${meterVal.toLocaleString()} kWh</span>
                  </div>`
                }
              }
            })
            return html
          }
        },
        legend: { show: false },
        grid: { left: 46, right: 42, top: 8, bottom: 22 },
        xAxis: {
          type: 'category',
          data: axisLabels,
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#64748B', fontSize: 11 },
          axisTick: { show: false }
        },
        yAxis: [
          {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#F1F5F9' } },
            axisLabel: { color: '#64748B', fontSize: 10, formatter: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v }
          },
          {
            type: 'value',
            axisLine: { show: false },
            splitLine: { show: false },
            min: 0,
            max: feeAxisMax,
            axisLabel: { color: '#64748B', fontSize: 10 }
          }
        ],
        series: [
          {
            name: sn.elecLine,
            type: 'line',
            yAxisIndex: 0,
            data: elecUsage,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            lineStyle: { width: 2, color: '#52c41a' },
            itemStyle: { color: '#52c41a' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(82, 196, 26, 0.14)' },
                  { offset: 1, color: 'rgba(82, 196, 26, 0)' }
                ]
              }
            }
          },
          {
            name: sn.waterLine,
            type: 'line',
            yAxisIndex: 0,
            data: waterUsage,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            lineStyle: { width: 2, color: '#2DD4BF' },
            itemStyle: { color: '#2DD4BF' }
          },
          // 虚拟柱子（custom 绘制）：避免 bar 分组横向槽位导致的“今日文字与柱子错位”
          {
            name: sn.virtualSer,
            type: 'custom',
            xAxisIndex: 0,
            yAxisIndex: 1,
            coordinateSystem: 'cartesian2d',
            encode: { x: 0, y: 1 },
            renderItem: (params, api) => {
              if (!hasVirtual) return null

              const xIndex = api.value(0)
              const yValue = api.value(1)
              if (!Number.isFinite(xIndex) || !Number.isFinite(yValue)) return null

              // 取 y=0 作为基线
              const top = api.coord([xIndex, yValue])
              const bottom = api.coord([xIndex, 0])

              // 坐标异常时直接不画，避免整块缺失/错位
              if (!top || !bottom || !Number.isFinite(top[0]) || !Number.isFinite(top[1]) || !Number.isFinite(bottom[0]) || !Number.isFinite(bottom[1])) {
                return null
              }
              const x = top[0]
              const yTop = Math.min(top[1], bottom[1])
              const yBottom = Math.max(top[1], bottom[1])

              // 用像素宽度估算当前分类的宽度，并控制柱宽，保证居中对齐分类刻度
              const categoryPixelWidth = api.size([1, 0])[0]
              const barWidth = Math.max(10, Math.min(categoryPixelWidth * 0.18, 26))
              const height = Math.max(2, yBottom - yTop)

              const label1 = `${Number(virtualUsage).toLocaleString()} kWh`
              const label2 = `¥${Number(virtualFee).toLocaleString()}`

              return {
                type: 'group',
                children: [
                  {
                    type: 'rect',
                    shape: {
                      x: x - barWidth / 2,
                      y: yTop,
                      width: barWidth,
                      height
                    },
                    style: {
                      fill: 'rgba(99, 102, 241, 0.35)',
                      stroke: 'rgba(99, 102, 241, 0.75)',
                      lineWidth: 1
                    },
                    z: 20
                  },
                  {
                    type: 'text',
                    style: {
                      text: label1,
                      x: x,
                      y: yTop - 28,
                      fill: '#4F46E5',
                      fontSize: 10,
                      fontWeight: 700,
                      textAlign: 'center',
                      textVerticalAlign: 'middle'
                    }
                  },
                  {
                    type: 'text',
                    style: {
                      text: label2,
                      x: x,
                      y: yTop - 14,
                      fill: '#4F46E5',
                      fontSize: 10,
                      fontWeight: 700,
                      textAlign: 'center',
                      textVerticalAlign: 'middle'
                    }
                  }
                ]
              }
            },
            // 仅在 virtualIndex 对应的分类绘制
            data: hasVirtual ? [[virtualIndex, virtualFee]] : []
          },
          {
            name: sn.indoorBar,
            type: 'bar',
            yAxisIndex: 1,
            stack: 'elecFee',
            data: elecIncome,
            barWidth: '26%',
            barMaxWidth: 22,
            barGap: '15%',
            itemStyle: {
              color: 'rgba(135, 206, 235, 0.65)',
              borderRadius: [2, 2, 0, 0]
            }
          },
          {
            name: sn.acBar,
            type: 'bar',
            yAxisIndex: 1,
            stack: 'elecFee',
            data: airIncome,
            barWidth: '26%',
            barMaxWidth: 22,
            itemStyle: {
              color: 'rgba(255, 160, 122, 0.65)',
              borderRadius: [4, 4, 0, 0]
            }
          },
          {
            name: sn.waterBar,
            type: 'bar',
            yAxisIndex: 1,
            data: waterIncome,
            barWidth: '26%',
            barMaxWidth: 22,
            itemStyle: { color: 'rgba(45, 212, 191, 0.26)', borderRadius: [4, 4, 0, 0] }
          }
        ]
      }
    },

    async fetchData () {
      if (!this.currentManagerId) {
        this.chartData = { labels: [], elecUsage: [], waterUsage: [], elecIncome: [], airIncome: [], waterIncome: [], airUsage: [], meterUsage: [], _virtualElecIndex: null, _virtualElecUsage: null, _virtualElecFee: null }
        this.elecWaterOverview = null
        this.disposeCharts()
        return
      }
      this.loading = true
      try {
        if (isDemoManager(this.currentManagerId)) {
          this.chartData = this.makeMockTrend()
          const cd = this.chartData
          const sumArr = (arr) => (arr || []).filter(v => v != null && Number.isFinite(Number(v))).reduce((s, v) => s + Number(v), 0)
          this.elecWaterOverview = {
            sevenDayElecUse: sumArr(cd.elecUsage),
            sevenDayWaterUse: sumArr(cd.waterUsage),
            sevenDayAirUse: sumArr(cd.airUsage),
            sevenDayMeterUse: sumArr(cd.meterUsage),
            sevenDayElecChainRatio: 0.32,
            sevenDayWaterChainRatio: 0.32
          }
          await this.$nextTick()
          // 关键修复：用 setTimeout 确保 DOM 布局完成后再初始化/更新图表
          setTimeout(() => {
            this.ensureChart()
            if (this.chart) this.chart.setOption(this.buildOption(), true)
          }, 50)
          return
        }

        const type = this.datePeriod === 'day' ? 2 : 3
        const overviewType = this.datePeriod === 'day' ? 1 : 2
        const limit = this.datePeriod === 'day' ? 7 : 6

        const isDayPeriod = this.datePeriod === 'day'
        const [e, w, todayRes, ovRes] = await Promise.all([
          getElecStatistics({ type, useType: 1, managerId: this.currentManagerId }).catch(() => ({})),
          getElecStatistics({ type, useType: 2, managerId: this.currentManagerId }).catch(() => ({})),
          isDayPeriod ? queryCwTenantTodayUse({ managerId: this.currentManagerId }).catch(() => null) : Promise.resolve(null),
          getElecWaterOverview({ managerId: this.currentManagerId, type: overviewType }).catch(() => null)
        ])

        this.elecWaterOverview = ovRes && ovRes.code === 200 && ovRes.data ? ovRes.data : null

        const sort = (arr) => [...(arr || [])].sort((a, b) => new Date(a.date) - new Date(b.date))
        const elec = e && e.code === 200 ? sort(e.data) : []
        const water = w && w.code === 200 ? sort(w.data) : []

        const sliceElec = elec.slice(-limit)
        const sliceWater = water.slice(-limit)
        const prevElec = elec.slice(-(limit * 2), -limit)
        const prevWater = water.slice(-(limit * 2), -limit)
        const base = sliceElec.length >= sliceWater.length ? sliceElec : sliceWater
        const baseLen = base.length

        const todayDto = isDayPeriod && todayRes && todayRes.code === 200 ? (todayRes.data || null) : null
        const todayUseElec = todayDto ? Number(todayDto.useElec) : null
        const todayUseAmount = todayDto ? Number(todayDto.useAmount) : null
        const hasTodayUseElec = Number.isFinite(todayUseElec)
        const hasTodayUseAmount = Number.isFinite(todayUseAmount)
        const showVirtual = isDayPeriod && hasTodayUseElec && hasTodayUseAmount
        const virtualIndex = showVirtual ? baseLen : null

        const padToLen = (arr, len) => {
          const out = Array.isArray(arr) ? [...arr] : []
          while (out.length < len) out.push(null)
          if (out.length > len) out.length = len
          return out
        }

        const fmt = (s) => {
          const d = moment(s)
          if (this.datePeriod === 'month') {
            return this.$i18n.locale === 'en' ? d.clone().locale('en').format('MMM') : `${d.month() + 1}月`
          }
          return d.format('MM/DD')
        }
        const sumArr = (arr, key) => arr.reduce((s, i) => s + Number(i[key] || 0), 0)

        const labels = base.map(i => fmt(i.date))
        const labelsWithVirtual = showVirtual ? [...labels, '今日'] : labels
        this.chartData = {
          labels: labelsWithVirtual,
          elecUsage: showVirtual ? [...padToLen(sliceElec.map(i => +(i.useElec || 0)), baseLen), null] : padToLen(sliceElec.map(i => +(i.useElec || 0)), baseLen),
          waterUsage: showVirtual ? [...padToLen(sliceWater.map(i => +(i.useElec || 0)), baseLen), null] : padToLen(sliceWater.map(i => +(i.useElec || 0)), baseLen),
          elecIncome: showVirtual ? [...padToLen(sliceElec.map(i => +(i.meterBalance || 0)), baseLen), null] : padToLen(sliceElec.map(i => +(i.meterBalance || 0)), baseLen),
          airIncome: showVirtual ? [...padToLen(sliceElec.map(i => +(i.airBalance || 0)), baseLen), null] : padToLen(sliceElec.map(i => +(i.airBalance || 0)), baseLen),
          waterIncome: showVirtual ? [...padToLen(sliceWater.map(i => +(i.balance || 0)), baseLen), null] : padToLen(sliceWater.map(i => +(i.balance || 0)), baseLen),
          airUsage: showVirtual ? [...padToLen(sliceElec.map(i => +(i.airUse || 0)), baseLen), null] : padToLen(sliceElec.map(i => +(i.airUse || 0)), baseLen),
          meterUsage: showVirtual ? [...padToLen(sliceElec.map(i => +(i.meterUseElec || 0)), baseLen), null] : padToLen(sliceElec.map(i => +(i.meterUseElec || 0)), baseLen),
          _elecCurrTotal: sumArr(sliceElec, 'useElec'),
          _elecPrevTotal: prevElec.length ? sumArr(prevElec, 'useElec') : null,
          _waterCurrTotal: sumArr(sliceWater, 'useElec'),
          _waterPrevTotal: prevWater.length ? sumArr(prevWater, 'useElec') : null,
          _virtualElecIndex: virtualIndex,
          _virtualElecUsage: showVirtual ? todayUseElec : null,
          _virtualElecFee: showVirtual ? todayUseAmount : null
        }

        await this.$nextTick()
        // 不能用 shouldShowEmpty：loading 为 true 时它恒为 false，会在空数据时误初始化 ECharts
        if (this.hasData) {
          setTimeout(() => {
            this.ensureChart()
            if (this.chart) {
              this.chart.setOption(this.buildOption(), true)
              requestAnimationFrame(() => this.chart && this.chart.resize())
            }
          }, 50)
        } else if (this.chart) {
          this.chart.clear()
        }
      } catch (e) {
        this.chartData = { labels: [], elecUsage: [], waterUsage: [], elecIncome: [], airIncome: [], waterIncome: [], airUsage: [], meterUsage: [], _virtualElecIndex: null, _virtualElecUsage: null, _virtualElecFee: null }
        this.elecWaterOverview = null
        if (this.chart) this.chart.clear()
      } finally {
        this.loading = false
      }
    },

    handleResize () {
      if (this.shouldShowEmpty) return
      if (!this.chart && this.hasData) {
        this.ensureChart()
      }
      const cap = (el) => {
        if (!el) return null
        const w = el.clientWidth
        const h = el.clientHeight
        if (!Number.isFinite(w) || !Number.isFinite(h) || w < 2 || h < 2) return null
        // 防止异常尺寸撑破布局（切换管理方后偶发极大 clientHeight）
        const maxH = Math.min(h, 1600)
        const maxW = Math.min(w, 2400)
        return { width: maxW, height: maxH }
      }
      const lineBox = cap(this.$refs.chartRef)
      if (this.chart && lineBox) {
        this.chart.resize(lineBox)
      } else if (this.chart) {
        this.chart.resize()
      }
      if (!this.feeChart && this.hasFeeData) {
        this.ensureFeeChart()
      }
      const feeBox = cap(this.$refs.feeChartRef)
      if (this.feeChart && feeBox) {
        this.feeChart.resize(feeBox)
      } else if (this.feeChart) {
        this.feeChart.resize()
      }
      if (!this.tenantSplitChart && this.hasTenantSplitData) {
        this.ensureTenantChart()
      }
      const tenantBox = cap(this.$refs.tenantChartRef)
      if (this.tenantSplitChart && tenantBox) {
        this.tenantSplitChart.resize(tenantBox)
      } else if (this.tenantSplitChart) {
        this.tenantSplitChart.resize()
      }
    },

    ensureFeeChart () {
      if (this.feeChart || !this.$refs.feeChartRef) return
      const el = this.$refs.feeChartRef
      if (el.clientHeight < 10) {
        if (this.ensureFeeChartTimer) clearTimeout(this.ensureFeeChartTimer)
        if (this.ensureFeeChartTries >= 10) return
        this.ensureFeeChartTries += 1
        this.ensureFeeChartTimer = setTimeout(() => {
          this.ensureFeeChartTimer = null
          this.ensureFeeChart()
        }, 120)
        return
      }
      this.ensureFeeChartTries = 0
      this.feeChart = echarts.init(el)
      this.feeChart.getZr().on('click', () => this.handleGoToTenantBill())
    },

    buildFeeOption () {
      const dto = this.feeDto || {}
      const elecFee = Number(dto.elecFee || 0)
      const airFee = Number(dto.airFee || 0)
      const waterFee = Number(dto.waterFee || 0)
      const otherFee = Number(dto.otherFee || 0)
      return {
        tooltip: {
          trigger: 'item',
          confine: false,
          appendToBody: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter: (p) => {
            const v = Number(p.value || 0)
            return `${p.name}: ${v.toLocaleString()}${this.$t('dashboard.trend.yuan')} (${typeof p.percent === 'number' ? p.percent.toFixed(2) : 0}%)`
          }
        },
        series: [
          {
            type: 'pie',
            radius: ['46%', '66%'],
            center: ['58%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 3, borderColor: '#fff', borderWidth: 2 },
            label: {
              show: true,
              position: 'outside',
              formatter: (p) => `${p.name}\n${(typeof p.percent === 'number' ? p.percent.toFixed(0) : 0)}%`,
              color: '#64748B',
              fontSize: 9,
              lineHeight: 13
            },
            labelLine: { show: true, length: 8, length2: 6, lineStyle: { color: '#CBD5E1' } },
            data: [
              { value: elecFee, name: this.$t('dashboard.trend.feeElec'), itemStyle: { color: '#0EA5E9' } },
              { value: airFee, name: this.$t('dashboard.trend.feeAc'), itemStyle: { color: '#14B8A6' } },
              { value: waterFee, name: this.$t('dashboard.trend.feeWater'), itemStyle: { color: '#93C5FD' } },
              { value: otherFee, name: this.$t('dashboard.trend.feeOther'), itemStyle: { color: '#CBD5E1' } }
            ]
          }
        ]
      }
    },

    renderFeeChart () {
      if (!this.hasFeeData) {
        if (this.feeChart) this.feeChart.clear()
        return
      }
      // 关键修复：用 setTimeout 确保 DOM 布局完成后再初始化费用图
      setTimeout(() => {
        if (this.shouldShowEmpty) return
        this.ensureFeeChart()
        if (!this.feeChart) return
        this.feeChart.resize()
        this.feeChart.setOption(this.buildFeeOption(), true)
        requestAnimationFrame(() => this.feeChart && this.feeChart.resize())
      }, 50)
    },

    makeDemoFeeDto () {
      return { elecFee: 23200.11, airFee: 6200.32, waterFee: 1800.21, otherFee: 1200.88 }
    },

    async fetchFee () {
      if (!this.currentManagerId) {
        this.feeDto = null
        return
      }
      if (isDemoManager(this.currentManagerId)) {
        this.feeDto = this.makeDemoFeeDto()
        await this.$nextTick()
        this.renderFeeChart()
        return
      }

      const end = moment().subtract(1, 'day')
      let beginTime
      if (this.datePeriod === 'day') {
        beginTime = end.clone().subtract(6, 'days').format('YYYY-MM-DD')
      } else {
        beginTime = end.clone().subtract(5, 'months').startOf('month').format('YYYY-MM-DD')
      }
      const endTime = end.format('YYYY-MM-DD')

      const res = await getTenantFeeComposition({ managerId: this.currentManagerId, beginTime, endTime }).catch(() => null)
      this.feeDto = (res && res.code === 200) ? (res.data || null) : null
      await this.$nextTick()
      this.renderFeeChart()
    },

    // ─── 租户/公区能耗拆分 ───────────────────────────────────────
    ensureTenantChart () {
      if (this.tenantSplitChart || !this.$refs.tenantChartRef) return
      const el = this.$refs.tenantChartRef
      if (el.clientHeight < 10) {
        if (this.ensureTenantChartTimer) clearTimeout(this.ensureTenantChartTimer)
        if (this.ensureTenantChartTries >= 10) return
        this.ensureTenantChartTries += 1
        this.ensureTenantChartTimer = setTimeout(() => {
          this.ensureTenantChartTimer = null
          this.ensureTenantChart()
        }, 120)
        return
      }
      this.ensureTenantChartTries = 0
      this.tenantSplitChart = echarts.init(el)
    },

    buildTenantSplitOptionLight (share) {
      const t = (k) => this.$t('dashboard.trend.' + k)
      const tenantPct = share.tenantPct
      const tenantKwh = share.tenantKwh
      const tenant = Math.min(100, Math.max(0, Number(tenantPct) || 0))
      const remainder = Math.max(100 - tenant, 0)
      const hasBoth = tenant > 0.5 && remainder > 0.5
      const isFullTenant = remainder <= 0.05
      const isFullPublic = tenant <= 0.05
      const displayPct = tenant >= 99.95 ? '100' : (Number.isInteger(tenant) ? String(tenant) : tenant.toFixed(1))

      const hubGradient = {
        type: 'radial',
        x: 0.5,
        y: 0.46,
        r: 0.78,
        colorStops: [
          { offset: 0, color: 'rgba(14, 165, 233, 0.06)' },
          { offset: 0.5, color: 'rgba(14, 165, 233, 0.03)' },
          { offset: 1, color: 'rgba(255, 255, 255, 0)' }
        ]
      }

      const tenantArcGradient = {
        type: 'linear',
        x: 0,
        y: 0.15,
        x2: 1,
        y2: 0.85,
        colorStops: [
          { offset: 0, color: '#2563EB' },
          { offset: 0.45, color: '#3B82F6' },
          { offset: 0.78, color: '#60A5FA' },
          { offset: 1, color: '#93C5FD' }
        ]
      }

      const publicArcColor = remainder > 0.5
        ? {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(148, 163, 184, 0.35)' },
            { offset: 1, color: 'rgba(203, 213, 225, 0.22)' }
          ]
        }
        : '#E2E8F0'

      const tenantSliceStyle = {
        color: tenantArcGradient,
        borderRadius: hasBoth ? 6 : 0,
        borderWidth: (isFullTenant || isFullPublic) ? 0 : 1,
        shadowBlur: 4,
        shadowColor: 'rgba(37, 99, 235, 0.12)',
        shadowOffsetY: 0
      }

      const publicSliceStyle = {
        color: publicArcColor,
        borderRadius: hasBoth ? 6 : 0,
        borderWidth: (isFullTenant || isFullPublic) ? 0 : 1
      }

      let ringData
      if (isFullTenant) {
        ringData = [{ name: t('tenantEnergy'), value: 1, itemStyle: tenantSliceStyle }]
      } else if (isFullPublic) {
        ringData = [{ name: t('publicEnergy'), value: 1, itemStyle: publicSliceStyle }]
      } else {
        ringData = [
          { name: t('tenantEnergy'), value: tenant, itemStyle: tenantSliceStyle },
          { name: t('publicEnergy'), value: remainder, itemStyle: publicSliceStyle }
        ]
      }

      const centerLabel = {
        show: true,
        position: 'center',
        formatter: `{a|${displayPct}}{b|%}\n{c|${t('tenantLabel')}}`,
        rich: {
          a: {
            fontSize: 16,
            fontWeight: 700,
            color: '#1E293B',
            fontFamily: 'Oxanium, DIN, Roboto, sans-serif',
            lineHeight: 20
          },
          b: {
            fontSize: 9,
            fontWeight: 600,
            color: '#64748B',
            padding: [0, 0, 0, 1]
          },
          c: {
            fontSize: 9,
            color: '#94A3B8',
            padding: [3, 0, 0, 0],
            lineHeight: 12,
            letterSpacing: 0.6
          }
        }
      }

      const decorRing = (radius, borderColor) => ({
        type: 'pie',
        radius,
        center: ['58%', '50%'],
        startAngle: 90,
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        data: [{
          value: 1,
          itemStyle: {
            color: 'transparent',
            borderColor,
            borderWidth: 1
          }
        }]
      })

      return {
        tooltip: {
          trigger: 'item',
          confine: false,
          appendToBody: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter (params) {
            if (!params.name || params.seriesIndex !== 3) return ''
            if (params.name === t('tenantEnergy')) {
              return `${params.name}：${tenant % 1 === 0 ? tenant : tenant.toFixed(1)}%（${Number.isFinite(tenantKwh) ? Number(tenantKwh).toLocaleString() + ' kWh' : ''}）`
            }
            return `${params.name}：${remainder % 1 === 0 ? remainder : remainder.toFixed(1)}%（${Number.isFinite(share.publicKwh) ? Number(share.publicKwh).toLocaleString() + ' kWh' : ''}）`
          }
        },
        series: [
          {
            ...decorRing(['66%', '66.6%'], 'rgba(148, 163, 184, 0.18)'),
            z: 0
          },
          {
            ...decorRing(['42%', '42.6%'], 'rgba(148, 163, 184, 0.1)'),
            z: 0
          },
          {
            type: 'pie',
            radius: ['0%', '33%'],
            center: ['58%', '50%'],
            silent: true,
            z: 1,
            label: { show: false },
            labelLine: { show: false },
            data: [{ value: 1, itemStyle: { color: hubGradient } }]
          },
          {
            type: 'pie',
            radius: ['46%', '66%'],
            center: ['58%', '50%'],
            startAngle: 90,
            clockwise: true,
            z: 2,
            padAngle: hasBoth ? 2.5 : 0,
            label: { show: false },
            labelLine: { show: false },
            itemStyle: (isFullTenant || isFullPublic)
              ? { borderWidth: 0 }
              : {
                borderColor: '#fff',
                borderWidth: 1.5
              },
            data: ringData
          },
          {
            type: 'pie',
            radius: ['0%', '0%'],
            center: ['58%', '50%'],
            silent: true,
            z: 10,
            label: centerLabel,
            labelLine: { show: false },
            data: [{ value: 1, itemStyle: { color: 'transparent' } }]
          }
        ]
      }
    },

    renderTenantChart () {
      if (!this.hasTenantSplitData) {
        if (this.tenantSplitChart) this.tenantSplitChart.clear()
        return
      }
      setTimeout(() => {
        if (this.shouldShowEmpty) return
        this.ensureTenantChart()
        if (!this.tenantSplitChart) return
        this.tenantSplitChart.resize()
        this.tenantSplitChart.setOption(this.buildTenantSplitOptionLight(this.tenantEnergyShare), true)
        requestAnimationFrame(() => this.tenantSplitChart && this.tenantSplitChart.resize())
      }, 50)
    },

    async fetchTenantSplit () {
      if (!this.currentManagerId) {
        this.tenantEnergyData = null
        return
      }
      if (isDemoManager(this.currentManagerId)) {
        this.tenantEnergyData = {
          shareEnergy: { tenantValue: 7160, publicValue: 2840 }
        }
        await this.$nextTick()
        this.renderTenantChart()
        return
      }

      const end = moment().subtract(1, 'day')
      let beginTime
      if (this.datePeriod === 'day') {
        beginTime = end.clone().subtract(6, 'days').format('YYYY-MM-DD')
      } else {
        beginTime = end.clone().subtract(5, 'months').startOf('month').format('YYYY-MM-DD')
      }
      const endTime = end.format('YYYY-MM-DD')
      try {
        const res = await getDashboardEnergyManagement({ managerId: this.currentManagerId, startTime: beginTime + ' 00:00:00', endTime: endTime + ' 23:59:59' }).catch(() => null)
        this.tenantEnergyData = (res && res.code === 200) ? (res.data || null) : null
        await this.$nextTick()
        this.renderTenantChart()
      } catch (e) {
        this.tenantEnergyData = null
      }
    },

    handleTitleClick (e) {
      if (e.target.closest('.period-switch')) return
      this.handleGoToElecReport()
    }
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@500;600;700&display=swap');

.trend-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  min-height: 0;
}

/* 无数据：不要占满整行网格高度，避免切换管理方后整块被撑成「巨高空白」 */
.trend-chart.trend-chart--empty {
  align-self: flex-start;
  width: 100%;
  height: auto !important;
  max-height: min(360px, 40vh);
  flex: 0 0 auto;
}

.trend-chart--empty .chart-body {
  flex: 1 1 auto;
  min-height: 160px;
  max-height: min(300px, 36vh);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icon-box {
    width: 30px;
    height: 30px;
    background: #E0F2FE;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon-img {
      width: 16px;
      height: 16px;
      object-fit: contain;
      display: block;
    }
  }

  .title-box {
    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }
    p {
      font-size: 11px;
      color: #94A3B8;
      margin: 2px 0 0;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;

    .period-switch {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #F1F5F9;
      border-radius: 10px;
      padding: 2px;

      button {
        border: none;
        background: transparent;
        color: #64748B;
        font-size: 11px;
        font-weight: 500;
        padding: 3px 9px;
        border-radius: 8px;
        cursor: pointer;
        line-height: 16px;
        transition: all 0.15s ease;
        white-space: nowrap;

        &.active {
          color: #fff;
          background: #0284C7;
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(2, 132, 199, 0.3);
        }
      }
    }
  }
}

/* ─── Body ───────────────────────────────────── */
.chart-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden; /* 关键：阻止子元素撑破容器 */
}

.chart-split {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 10px;
  width: 100%;
  padding: 6px 6px 6px 10px;
}

.left-pane {
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-right: 0;
  overflow: hidden; /* 关键：阻止子元素撑破容器 */
}

.stats-bar {
  --sb-left: 46px;
  --sb-right: 42px;
  --sb-gap: 64px;
  position: relative;
  height: 54px;
  flex-shrink: 0;
  margin-bottom: 3px;
  padding-left: var(--sb-left);
  padding-right: var(--sb-right);
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 1fr) 1px minmax(180px, 1fr);
  column-gap: var(--sb-gap);
  align-items: center;
}

.sb-line {
  grid-column: 3;
  grid-row: 1;
  position: static;
  justify-self: center;
  align-self: center;
  height: 34px;
  width: 1px;
  background: #E2E8F0;
  pointer-events: none;
}

.sb-elec {
  grid-column: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.sb-center {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  justify-self: end;
}

.sb-water {
  grid-column: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 5px;
  min-width: 0;
}

.sb-clickable {
  cursor: pointer;
  border-radius: 8px;
  padding: 4px 6px;
  margin: -4px -6px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(15, 23, 42, 0.04);
  }

  &:active {
    background: rgba(15, 23, 42, 0.07);
  }
}

.stats-divider { display: none; }
.stat-block, .stat-elec, .stat-center, .stat-water { display: none; }

.stat-label {
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
  line-height: 1.2;
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: nowrap;
}

.stat-num {
  font-size: 28px;
  font-weight: 900;
  color: #0F172A;
  font-family: 'Oxanium', 'DIN Alternate', 'DIN', 'Barlow', 'JetBrains Mono', 'Roboto Mono', monospace;
  letter-spacing: -0.5px;
  line-height: 1;
}

.stat-delta {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 2px;
  line-height: 1;

  &.red {
    color: #EF4444;
    i { font-size: 11px; }
  }
  &.green {
    color: #22C55E;
    i { font-size: 11px; }
  }
  &.muted {
    color: #94A3B8;
  }
}

.sub-stat-line {
  display: grid;
  grid-template-columns: 12px 64px 10px auto 44px;
  align-items: baseline;
  gap: 0 2px;
  font-size: 13px;
  color: #475569;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    align-self: center;
  }

  .sub-label {
    color: #64748B;
    white-space: nowrap;
    overflow: visible;
  }

  .sub-colon {
    color: #64748B;
    text-align: center;
    font-family: 'Oxanium', 'DIN Alternate', 'DIN', 'Barlow', 'JetBrains Mono', 'Roboto Mono', monospace;
    font-variant-numeric: tabular-nums;
  }

  .sub-val {
    font-weight: 700;
    color: #0F172A;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: 'Oxanium', 'DIN Alternate', 'DIN', 'Barlow', 'JetBrains Mono', 'Roboto Mono', monospace;
    font-variant-numeric: tabular-nums;
  }

  .sub-pct {
    color: #94A3B8;
    font-size: 12px;
    white-space: nowrap;
    justify-self: end;
    font-family: 'Oxanium', 'DIN Alternate', 'DIN', 'Barlow', 'JetBrains Mono', 'Roboto Mono', monospace;
    font-variant-numeric: tabular-nums;
  }
}

/* 关键：chart-wrap 和 chart-container 都必须 overflow: hidden */
.chart-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-container {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.chart-legend {
  flex-shrink: 0;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-left: 38px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #64748B;
  white-space: nowrap;
}

.legend-line {
  display: inline-block;
  width: 18px;
  height: 2px;
  border-radius: 1px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: inherit;
  }
}

.legend-bar {
  display: inline-block;
  width: 12px;
  height: 10px;
  border-radius: 2px 2px 0 0;
}

.right-pane {
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0;
}

.fee-card {
  flex: 1 1 50%;
  min-width: 0;
  min-height: 0;
  padding: 2px 4px 2px 6px;
  display: flex;
  flex-direction: column;
}

.fee-card.tenant-split-card {
  padding-left: 2px;
  padding-right: 6px;
}

.fee-title {
  font-size: 12px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 3px;
  flex-shrink: 0;
}

.fee-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  overflow: hidden;
}

.fee-donut {
  position: relative;
  flex: 1 1 auto;
  min-height: 110px;
}

.fee-chart,
.fee-empty {
  width: 100%;
  height: 100%;
}

.fee-chart {
  transition: opacity 0.25s ease;
}

.fee-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  font-size: 11px;
  user-select: none;
}

.fee-center {
  position: absolute;
  inset: 0;
  padding-left: 16%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  gap: 2px;
}

.fee-center-label {
  font-size: 10px;
  color: #64748B;
  font-weight: 600;
}

.fee-center-value {
  font-size: 15px;
  font-weight: 900;
  color: #0F172A;
  font-family: 'Oxanium', 'DIN Alternate', 'DIN', 'Barlow', 'JetBrains Mono', 'Roboto Mono', monospace;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

.fee-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px 6px;
  padding: 0 2px 2px;
  flex-shrink: 0;
}

.fee-legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    flex-shrink: 0;
  }

  .name {
    font-size: 10px;
    color: #64748B;
    white-space: nowrap;
  }
}

.tenant-legend {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 2px 1px;
  flex-shrink: 0;
}

.tenant-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    flex-shrink: 0;
  }

  .tenant-dot {
    background: #3B82F6;
  }

  .public-dot {
    background: #94A3B8;
  }

  .tl-name {
    font-size: 10px;
    color: #64748B;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tl-val {
    font-size: 10px;
    font-weight: 600;
    color: #1E293B;
    white-space: nowrap;
    margin-left: auto;
  }
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #94A3B8;
  background: rgba(248, 250, 252, 0.7);
  border: 1px dashed rgba(226, 232, 240, 1);
  border-radius: 10px;

  svg { opacity: 0.9; }
  span { font-size: 12px; font-weight: 600; letter-spacing: 0.2px; }
}

/* 必须写在通用 .chart-empty 之后，否则 position:absolute 会覆盖无数据紧凑布局 */
.trend-chart--empty .chart-empty {
  position: relative;
  inset: auto;
  width: 100%;
  min-height: 120px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1366px) {
  .chart-split {
    grid-template-columns: 1fr;
  }
}
</style>
