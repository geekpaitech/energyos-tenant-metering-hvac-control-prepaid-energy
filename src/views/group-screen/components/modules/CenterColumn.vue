<template>
  <div class="col-center">
    <!-- 能耗与经营成本 -->
    <panel-box title="能耗与经营成本" tier="core" highlight class="blk blk-energy">
      <div class="energy-board">
        <section class="energy-zone energy-zone--bars">
          <header class="energy-zone__hd">
            <h4 class="energy-zone__title">分项能耗监测</h4>
            <button type="button" class="energy-zone__drill" @click="openEnergyDrilldown('electricity')">
              查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
            </button>
          </header>
          <div class="energy-zone__bd">
            <button type="button" class="energy-hero" @click="openEnergyDrilldown('electricity')">
              <span class="energy-hero__lbl">总用电量</span>
              <span class="energy-hero__val">{{ electricitySummary.value }}<i>{{ electricitySummary.unit }}</i></span>
            </button>
            <ul class="energy-bars">
              <li
                v-for="(item, i) in energyBreakdown"
                :key="item.name"
                class="energy-bar-row"
                role="button"
                tabindex="0"
                :aria-label="`查看${item.name === '水' ? '用水' : '用电'}明细`"
                @click="openEnergyDrilldown(item.name === '水' ? 'water' : 'electricity')"
                @keydown.enter="openEnergyDrilldown(item.name === '水' ? 'water' : 'electricity')"
                @keydown.space.prevent="openEnergyDrilldown(item.name === '水' ? 'water' : 'electricity')"
              >
                <div class="energy-bar-row__hd">
                  <span class="energy-bar-row__name">
                    <i class="energy-bar-row__dot" :style="{ background: energyColors[i], boxShadow: `0 0 6px ${energyColors[i]}66` }" />
                    {{ item.name }}
                  </span>
                  <span class="energy-bar-row__meta">
                    <span class="energy-bar-row__pct">{{ formatPctDisplay(item.value) }}<template v-if="formatPctDisplay(item.value) !== '--'">%</template></span>
                    <span class="energy-bar-row__num">{{ item.amount }}<i v-if="item.unit" class="energy-bar-row__unit">{{ item.unit }}</i></span>
                  </span>
                </div>
                <div class="energy-bar-row__track">
                  <i
                    class="energy-bar-row__fill"
                    :style="{ width: pctBarWidth(item.value), '--bar-color': energyColors[i] }"
                  />
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section class="energy-zone energy-zone--split">
          <header class="energy-zone__hd">
            <h4 class="energy-zone__title">租户/公区能耗拆分</h4>
            <button type="button" class="energy-zone__drill" @click="openEnergyDrilldown('electricity')">
              查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
            </button>
          </header>
          <div class="energy-zone__bd energy-zone__bd--split">
            <div class="split-stack">
              <div class="split-stack__chart">
                <div ref="tenantPie" class="chart-box" />
              </div>
              <div class="split-stack__legend">
                <button type="button" class="split-leg split-leg--tenant" @click="openEnergyDrilldown('electricity', 0)">
                  <div class="split-leg__row">
                    <span class="split-leg__name">
                      <i class="split-leg__dot" :style="{ background: tenantColors[0] }" />
                      租户能耗
                    </span>
                    <b class="split-leg__pct">{{ formatPctDisplay(tenantPublicRatio.tenant) }}<i v-if="formatPctDisplay(tenantPublicRatio.tenant) !== '--'">%</i></b>
                  </div>
                  <em class="split-leg__val">{{ tenantPublicRatio.tenantKwh }}<small>kWh</small></em>
                </button>
                <button type="button" class="split-leg split-leg--public" @click="openEnergyDrilldown('electricity', 1)">
                  <div class="split-leg__row">
                    <span class="split-leg__name">
                      <i class="split-leg__dot" :style="{ background: tenantColors[1] }" />
                      公区能耗
                    </span>
                    <b class="split-leg__pct">{{ formatPctDisplay(tenantPublicRatio.public) }}<i v-if="formatPctDisplay(tenantPublicRatio.public) !== '--'">%</i></b>
                  </div>
                  <em class="split-leg__val">{{ tenantPublicRatio.publicKwh }}<small>kWh</small></em>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="energy-zone energy-zone--collect">
          <header class="energy-zone__hd">
            <h4 class="energy-zone__title">租户水电收缴</h4>
            <button type="button" class="energy-zone__drill" @click="openCollectionDrilldown">
              查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
            </button>
          </header>
          <div class="energy-zone__bd energy-zone__bd--collect">
            <div class="collect-panel">
              <div class="collect-hero">
                <div class="collect-hero__row">
                  <span class="collect-hero__lbl">收缴率</span>
                  <span class="collect-hero__val">{{ formatPctDisplay(collectionProgress.rate) }}<i v-if="formatPctDisplay(collectionProgress.rate) !== '--'">%</i></span>
                </div>
                <div class="collect-hero__track">
                  <i class="collect-hero__fill" :style="{ width: pctBarWidth(collectionProgress.rate) }" />
                </div>
              </div>
              <div class="collect-money">
                <div class="money-row">
                  <span class="money-row__lbl">应收金额</span>
                  <b>¥{{ collectionProgress.receivable }}</b>
                </div>
                <div class="money-row money-row--ok">
                  <span class="money-row__lbl">已收金额</span>
                  <b>¥{{ collectionProgress.collected }}</b>
                </div>
                <div class="money-row money-row--warn">
                  <span class="money-row__lbl">未收金额</span>
                  <b>¥{{ collectionProgress.uncollected }}</b>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </panel-box>

    <!-- 停车经营管理 -->
    <panel-box title="停车经营管理" tier="secondary" class="blk blk-park">
      <div class="park-inner">
        <div class="park-metrics">
          <div
            v-for="(k, idx) in parkKpis"
            :key="k.l"
            class="park-metric"
            :class="{ 'park-metric--last': idx === 3 }"
          >
            <span class="park-metric__label">{{ k.l }}</span>
            <span class="park-metric__value">
              <em>{{ k.num }}</em>
              <i v-if="k.unit">{{ k.unit }}</i>
            </span>
          </div>
        </div>
        <div class="park-revenue">
          <div class="park-revenue__head">
            <div class="park-revenue__heading">
              <span class="park-revenue__icon" aria-hidden="true">$</span>
              <span class="park-revenue__title">停车收入统计</span>
            </div>
            <button type="button" class="park-revenue__drill" @click="openParkingOrderDetail">
              查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
            </button>
          </div>
          <div class="park-revenue__table">
            <div class="park-table-head">
              <span class="col-lot">停车场</span>
              <span class="col-money col-money--total">总收入</span>
              <span class="col-count">总车位</span>
              <span class="col-money">临停收入</span>
              <span class="col-count">月租车位</span>
              <span class="col-money">月租车续费</span>
            </div>
            <div class="park-table-body">
            <div
              v-for="(row, idx) in parkRevenueRows"
              :key="idx"
              class="park-table-row"
              :class="{ 'park-table-row--empty': row.empty }"
            >
              <div class="col-lot">{{ row.name }}</div>
              <div class="col-money col-money--total">{{ row.total }}</div>
              <div class="col-count">{{ row.totalSpaces }}</div>
              <div class="col-money">{{ row.temp }}</div>
              <div class="col-count">{{ row.monthSpaces }}</div>
              <div class="col-money">{{ row.month }}</div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </panel-box>

    <!-- 工程服务与运维效率 -->
    <panel-box title="工程服务与运维效率" tier="secondary" class="blk blk-eng">
      <div class="eng-board">
        <div class="eng-board__left">
          <section class="eng-pane eng-pane--order">
            <header class="eng-pane__hd">
              <h4 class="eng-pane__title">服务工单</h4>
              <div class="eng-pane__actions">
                <button type="button" class="eng-detail-link" @click="$emit('open-property-detail', 'serviceOrder')">
                  查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
                </button>
              </div>
            </header>
            <div class="eng-pane__bd">
              <div class="eng-order">
                <div class="eng-order__chart">
                  <div ref="orderPie" class="chart-box chart-box--order" />
                </div>
                <ul class="eng-order__list">
                  <li
                    v-for="(t, i) in workOrderTypes"
                    :key="i"
                    class="eng-order__item"
                    :class="{ 'eng-order__item--alt': i % 2 === 1, 'eng-order__item--empty': t.empty }"
                  >
                    <i class="eng-order__dot" :style="{ background: chartColors[i] }" />
                    <span class="eng-order__name" :title="t.name">{{ t.name }}</span>
                    <span class="eng-order__cnt">{{ formatWorkOrderCount(t.count) }}</span>
                    <span class="eng-order__pct">{{ formatWorkOrderPct(t.value) }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <div class="eng-aux">
            <section class="eng-mini eng-mini--maint">
              <header class="eng-mini__hd">
                <h4 class="eng-mini__title">维保计划</h4>
                <button type="button" class="eng-detail-link" @click="$emit('open-property-detail', 'maintenance')">
                  查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
                </button>
              </header>
              <div class="eng-mini__bd">
                <div class="eng-mini-kpis">
                  <div class="eng-mini-kpis__cell">
                    <span>计划</span>
                    <b>{{ maintenancePlan.planned }}</b>
                  </div>
                  <div class="eng-mini-kpis__cell">
                    <span>完成</span>
                    <b class="cyan">{{ maintenancePlan.completed }}</b>
                  </div>
                  <div class="eng-mini-kpis__cell">
                    <span>完成率</span>
                    <b class="green">{{ formatMaintenanceRate(maintenancePlan.rate) }}</b>
                  </div>
                </div>
                <div class="eng-mini-bar">
                  <i :style="{ width: maintenanceProgressWidth }" />
                </div>
              </div>
            </section>

            <section class="eng-mini eng-mini--tenant">
              <header class="eng-mini__hd">
                <h4 class="eng-mini__title">租户服务</h4>
                <button type="button" class="eng-detail-link" @click="$emit('open-property-detail', 'satisfaction')">
                  查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
                </button>
              </header>
              <div class="eng-mini__bd">
                <div class="eng-mini-kpis">
                  <div class="eng-mini-kpis__cell">
                    <span>维修</span>
                    <b>{{ formatMetricCount(tenantService.inquiry) }}</b>
                  </div>
                  <div class="eng-mini-kpis__cell">
                    <span>投诉</span>
                    <b class="red">{{ formatMetricCount(tenantService.complaint) }}</b>
                  </div>
                  <div class="eng-mini-kpis__cell">
                    <span>满意度</span>
                    <b class="green">{{ tenantSatisfactionRate }}<em v-if="tenantSatisfactionRate !== '--'">%</em></b>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section class="eng-pane eng-pane--supplier">
          <header class="eng-pane__hd">
            <h4 class="eng-pane__title">供应商考核</h4>
            <button type="button" class="eng-detail-link" @click="$emit('open-property-detail', 'provider')">
              查看明细 <i class="el-icon-arrow-right" aria-hidden="true" />
            </button>
          </header>
          <div class="eng-pane__bd">
            <div v-if="!suppliers.length" class="eng-supplier-empty">
              <i class="el-icon-document" aria-hidden="true" />
              <span>暂无供应商考核数据</span>
            </div>
            <div
              v-else
              class="eng-supplier-scroll"
              @mouseenter="supplierScrollPaused = true"
              @mouseleave="supplierScrollPaused = false"
            >
              <div
                class="eng-supplier-scroll__viewport"
                :class="{ 'eng-supplier-scroll__viewport--static': !supplierNeedScroll }"
                :style="{ height: supplierViewportH + 'px' }"
              >
                <ul
                  class="eng-supplier eng-supplier--scroll"
                  :class="{ 'no-transition': !supplierScrollTransition }"
                  :style="supplierTrackStyle"
                >
                  <li
                    v-for="(s, idx) in supplierRows"
                    :key="s.id"
                    class="eng-supplier__row"
                    :class="{ 'eng-supplier__row--top': idx === 0 }"
                  >
                    <span class="eng-supplier__name">{{ s.name }}</span>
                    <div class="eng-supplier__score">
                      <span class="eng-supplier__bar"><i :style="{ width: supplierScoreWidth(s.score) }" /></span>
                      <b>{{ s.score }}</b>
                    </div>
                    <span
                      class="eng-supplier__grade"
                      :class="s.grade !== '--' ? s.grade : ''"
                    >{{ s.grade }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </panel-box>
  </div>
</template>

<script>
import PanelBox from '../PanelBox.vue'
import {
  CHART_COLORS, ENERGY_COLORS, TENANT_COLORS,
  darkTooltip, donutWithTotal, buildTenantSplitOption
} from '../../utils/chartTheme'
import { EMPTY_TENANT_SERVICE, mapTenantService } from '../../utils/workOrderManagement'
import { EMPTY_SUPPLIERS, SUPPLIER_PAGE_SIZE } from '../../utils/providerEvaluation'
import {
  queryMaintenanceSummary,
  queryProviderEvaluationDetails
} from '@/api/groupPropertyMingYuan'
import { buildMingYuanQuery } from '../../utils/mingYuanQuery'
import { calcSubItemTce } from '../../utils/energyTce'

const CHART_CENTER = ['50%', '50%']
const WORK_ORDER_ROW_COUNT = 4
const SUPPLIER_VISIBLE = 4
const SUPPLIER_ROW_H = 40
const SUPPLIER_SCROLL_INTERVAL = 3500

const EMPTY_WORK_ORDER_ROW = { name: '--', count: '--', value: '--', pieValue: 0, empty: true }

const EMPTY_MAINTENANCE = {
  planned: '--',
  completed: '--',
  rate: null
}

const EMPTY_ENERGY_BREAKDOWN = [
  { name: '电', value: null, amount: '--', unit: 'kWh' },
  { name: '水', value: null, amount: '--', unit: 'm³' }
]

const EMPTY_ENERGY = {
  energyBreakdown: EMPTY_ENERGY_BREAKDOWN.map(i => ({ ...i })),
  electricitySummary: { value: '--', unit: 'kWh' },
  tenantPublicRatio: { tenant: null, public: null, tenantKwh: '--', publicKwh: '--' }
}

const EMPTY_COLLECTION = { rate: null, receivable: '--', collected: '--', uncollected: '--' }

const EMPTY_PARKING = {
  totalEnterCount: null,
  totalExitCount: null,
  totalVehicleFlow: null,
  totalRevenue: null,
  parkingLotRevenueList: [],
  parkingLotCarTypeList: []
}

export default {
  name: 'CenterColumn',
  components: { PanelBox },
  props: {
    activeScope: { type: String, default: '全部' },
    activeTime: { type: String, default: '本月' },
    /** 父级统一拉取 getEnergyManagement，避免重复请求 */
    energyManagement: { type: Object, default: null },
    /** 驾驶舱专用四管理方租户水电收缴汇总 */
    collectionManagement: { type: Object, default: null },
    /** 父级统一拉取 getParkingManagement */
    parkingManagement: { type: Object, default: null },
    /** 父级统一组合明源工单统计接口（随业态与时间筛选） */
    workOrderManagement: { type: Object, default: null }
  },
  data () {
    return {
      energyBreakdown: EMPTY_ENERGY.energyBreakdown.map(i => ({ ...i })),
      electricitySummary: { ...EMPTY_ENERGY.electricitySummary },
      tenantPublicRatio: { ...EMPTY_ENERGY.tenantPublicRatio },
      collectionProgress: { ...EMPTY_COLLECTION },
      chartColors: CHART_COLORS,
      energyColors: ENERGY_COLORS,
      tenantColors: TENANT_COLORS,
      workOrderTypes: Array.from({ length: WORK_ORDER_ROW_COUNT }, () => ({ ...EMPTY_WORK_ORDER_ROW })),
      workOrderTotal: null,
      workOrderCompletionRate: null,
      maintenancePlan: { ...EMPTY_MAINTENANCE },
      tenantService: { ...EMPTY_TENANT_SERVICE },
      suppliers: [...EMPTY_SUPPLIERS],
      parkingData: { ...EMPTY_PARKING },
      tenantPieChart: null,
      orderPieChart: null,
      charts: [],
      supplierScrollStep: 0,
      supplierScrollPaused: false,
      supplierScrollTransition: true,
      maintenanceRequestId: 0,
      supplierScrollTimer: null
    }
  },
  computed: {
    parkKpis () {
      const d = this.parkingData
      return [
        { l: '总车流量', num: this.formatCount(d.totalVehicleFlow), unit: '辆' },
        { l: '进场车辆', num: this.formatCount(d.totalEnterCount), unit: '辆' },
        { l: '出场车辆', num: this.formatCount(d.totalExitCount), unit: '辆' },
        { l: '停车营收汇总', num: this.formatMoney(d.totalRevenue), unit: '' }
      ]
    },
    parkRevenueRows () {
      const list = (this.parkingData.parkingLotRevenueList || [])
        .slice()
        .sort((a, b) => (this.calcLotTotal(b) || 0) - (this.calcLotTotal(a) || 0))
      const carTypeMap = new Map(
        (this.parkingData.parkingLotCarTypeList || []).map(item => [
          this.normalizeParkingLotName(item.parkingLotName),
          item
        ])
      )
      if (!list.length) {
        return Array.from({ length: 3 }, () => ({
          parkingLotId: '',
          name: '--',
          total: '--',
          totalSpaces: '--',
          temp: '--',
          monthSpaces: '--',
          month: '--',
          empty: true
        }))
      }
      return list.map(item => {
        const carType = carTypeMap.get(this.normalizeParkingLotName(item.parkingLotName))
        return {
          parkingLotId: item.parkingLotId || '',
          name: item.parkingLotName || '--',
          total: this.formatTableMoney(this.calcLotTotal(item)),
          totalSpaces: this.formatCount(this.calcTotalSpaces(carType)),
          temp: this.formatTableMoney(item.tempMoney),
          monthSpaces: this.formatCount(carType ? carType.monthCount : null),
          month: this.formatTableMoney(item.monthRenewMoney)
        }
      })
    },
    maintenanceProgressWidth () {
      const rate = this.maintenancePlan.rate
      if (rate == null || rate === '' || rate === '--') return '0%'
      const n = Number(rate)
      if (Number.isNaN(n)) return '0%'
      return `${Math.min(100, Math.max(0, n))}%`
    },
    tenantSatisfactionRate () {
      const rate = this.tenantService.satisfactionRate
      if (rate != null && rate !== '' && !Number.isNaN(Number(rate))) {
        return this.formatRateTrim(Number(rate))
      }
      return '--'
    },
    supplierRows () {
      return this.suppliers
    },
    supplierNeedScroll () {
      return this.suppliers.length > SUPPLIER_VISIBLE
    },
    supplierVisible () {
      return Math.min(SUPPLIER_VISIBLE, this.supplierRows.length || 1)
    },
    supplierMaxStep () {
      return Math.max(0, this.supplierRows.length - this.supplierVisible)
    },
    supplierViewportH () {
      return SUPPLIER_ROW_H * this.supplierVisible
    },
    supplierTrackStyle () {
      if (!this.supplierNeedScroll) {
        return { transform: 'none', transitionDuration: '0ms' }
      }
      return {
        transform: `translate3d(0, -${this.supplierScrollStep * SUPPLIER_ROW_H}px, 0)`,
        transitionDuration: this.supplierScrollTransition ? '650ms' : '0ms'
      }
    }
  },
  watch: {
    activeScope () {
      this.fetchMaintenanceManagement()
      this.fetchProviderEvaluation()
    },
    activeTime () {
      this.fetchMaintenanceManagement()
      this.fetchProviderEvaluation()
    },
    workOrderManagement: {
      handler (val) {
        if (val) {
          this.applyWorkOrderData(val)
          this.tenantService = mapTenantService(val)
        } else {
          this.resetWorkOrderData()
          this.tenantService = { ...EMPTY_TENANT_SERVICE }
        }
        this.$nextTick(() => this.refreshOrderPie())
      },
      immediate: true
    },
    supplierRows () {
      this.supplierScrollStep = 0
      this.$nextTick(() => this.startSupplierScroll())
    },
    energyManagement: {
      handler (val) {
        if (val) this.applyEnergyData(val)
        else this.resetEnergyData()
        this.$nextTick(() => this.refreshTenantPie())
      },
      immediate: true
    },
    collectionManagement: {
      handler (val) {
        if (val) this.applyCollectionData(val)
        else this.collectionProgress = { ...EMPTY_COLLECTION }
      },
      immediate: true
    },
    parkingManagement: {
      handler (val) {
        if (val) {
          this.parkingData = {
            totalEnterCount: val.totalEnterCount,
            totalExitCount: val.totalExitCount,
            totalVehicleFlow: val.totalVehicleFlow,
            totalRevenue: val.totalRevenue,
            parkingLotRevenueList: Array.isArray(val.parkingLotRevenueList)
              ? val.parkingLotRevenueList
              : [],
            parkingLotCarTypeList: Array.isArray(val.parkingLotCarTypeList)
              ? val.parkingLotCarTypeList
              : []
          }
        } else {
          this.parkingData = { ...EMPTY_PARKING }
        }
      },
      immediate: true
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.initCharts()
      this.fetchMaintenanceManagement()
      this.fetchProviderEvaluation()
      this.$nextTick(() => this.onResize())
      window.addEventListener('resize', this.onResize)
    })
  },
  beforeDestroy () {
    this.stopSupplierScroll()
    window.removeEventListener('resize', this.onResize)
    if (this.tenantPieChart) {
      this.tenantPieChart.dispose()
      this.tenantPieChart = null
    }
    if (this.orderPieChart) {
      this.orderPieChart.dispose()
      this.orderPieChart = null
    }
    this.charts.forEach(c => c.dispose())
  },
  methods: {
    openEnergyDrilldown (resource = 'electricity', tenantType = null) {
      this.$emit('open-energy-detail', { resource, tenantType })
    },
    openCollectionDrilldown () {
      this.$emit('open-collection-detail')
    },
    openParkingOrderDetail () {
      this.$emit('open-parking-order', this.parkRevenueRows)
    },
    formatPctDisplay (val) {
      if (val == null || val === '' || val === '--') return '--'
      const num = Number(val)
      if (Number.isNaN(num)) return '--'
      return num.toLocaleString(undefined, { maximumFractionDigits: 1 })
    },
    pctBarWidth (val) {
      if (val == null || val === '' || val === '--') return '0%'
      const num = Number(val)
      if (Number.isNaN(num)) return '0%'
      return `${Math.min(100, Math.max(0, num))}%`
    },
    formatWorkOrderCount (count) {
      if (count == null || count === '' || count === '--') return '--'
      return `${Number(count).toLocaleString()}单`
    },
    formatWorkOrderPct (value) {
      if (value == null || value === '' || value === '--') return '--'
      return `${value}%`
    },
    formatMaintenanceRate (rate) {
      if (rate == null || rate === '' || rate === '--') return '--'
      return `${rate}%`
    },
    formatRateTrim (value) {
      const n = Math.min(100, Math.max(0, Number(value)))
      if (Number.isNaN(n)) return '--'
      return Number.isInteger(n) ? String(n) : n.toFixed(1)
    },
    supplierScoreWidth (score) {
      if (score == null || score === '' || score === '--') return '0%'
      const n = Number(score)
      if (Number.isNaN(n)) return '0%'
      return `${Math.min(100, Math.max(0, n))}%`
    },
    formatMetricCount (val) {
      if (val == null || val === '') return '--'
      const num = Number(val)
      if (Number.isNaN(num)) return '--'
      return num.toLocaleString()
    },
    formatEnergyNum (val) {
      if (val == null || val === '') return '--'
      const num = Number(val)
      if (Number.isNaN(num)) return '--'
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
    },
    formatMoneyPlain (val) {
      if (val == null || val === '') return '--'
      const num = Number(val)
      if (Number.isNaN(num)) return '--'
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
    },
    calcPct (part, total) {
      if (!total) return 0
      return +((Number(part) / total) * 100).toFixed(1)
    },
    /** 分项能耗：仅电、水两项，占比按电+水折标煤归一 */
    buildEnergyBreakdownEleWater (sub, tceParts) {
      const hasElectricity = sub.electricityValue != null && sub.electricityValue !== '' && Number.isFinite(Number(sub.electricityValue))
      const hasWater = sub.waterValue != null && sub.waterValue !== '' && Number.isFinite(Number(sub.waterValue))
      const hasCompleteSource = hasElectricity && hasWater
      const totalTce = tceParts.electricity + tceParts.water
      const pct = v => (hasCompleteSource && totalTce ? +((v / totalTce) * 100).toFixed(1) : null)
      return [
        {
          name: '电',
          value: pct(tceParts.electricity),
          amount: this.formatEnergyNum(sub.electricityValue),
          unit: 'kWh'
        },
        {
          name: '水',
          value: pct(tceParts.water),
          amount: this.formatEnergyNum(sub.waterValue),
          unit: 'm³'
        }
      ]
    },
    applyEnergyData (data) {
      const sub = data.subItemEnergy || {}
      const tceParts = calcSubItemTce(sub)
      this.electricitySummary = {
        value: this.formatEnergyNum(sub.electricityValue),
        unit: 'kWh'
      }
      this.energyBreakdown = this.buildEnergyBreakdownEleWater(sub, tceParts)

      const share = data.shareEnergy || {}
      const hasTenant = share.tenantValue != null && share.tenantValue !== '' && Number.isFinite(Number(share.tenantValue))
      const hasPublic = share.publicValue != null && share.publicValue !== '' && Number.isFinite(Number(share.publicValue))
      const tenantVal = hasTenant ? Number(share.tenantValue) : null
      const publicVal = hasPublic ? Number(share.publicValue) : null
      const hasCompleteShare = hasTenant && hasPublic
      const shareTotal = tenantVal + publicVal
      this.tenantPublicRatio = {
        tenant: hasCompleteShare ? this.calcPct(tenantVal, shareTotal) : null,
        public: hasCompleteShare ? this.calcPct(publicVal, shareTotal) : null,
        tenantKwh: this.formatEnergyNum(share.tenantValue),
        publicKwh: this.formatEnergyNum(share.publicValue)
      }
    },
    applyCollectionData (data) {
      this.collectionProgress = {
        rate: data.rate,
        receivable: this.formatMoneyPlain(data.receivable),
        collected: this.formatMoneyPlain(data.collected),
        uncollected: this.formatMoneyPlain(data.uncollected)
      }
    },
    resetEnergyData () {
      this.energyBreakdown = EMPTY_ENERGY.energyBreakdown.map(i => ({ ...i }))
      this.electricitySummary = { ...EMPTY_ENERGY.electricitySummary }
      this.tenantPublicRatio = { ...EMPTY_ENERGY.tenantPublicRatio }
    },
    calcLotTotal (item) {
      if (item == null) return null
      if (item.totalMoney != null && item.totalMoney !== '') return item.totalMoney
      if (item.totalRevenue != null && item.totalRevenue !== '') return item.totalRevenue
      const sum = ['tempMoney', 'monthRenewMoney', 'innerRenewMoney', 'storeChargeMoney']
        .reduce((acc, key) => acc + (Number(item[key]) || 0), 0)
      return sum || null
    },
    normalizeParkingLotName (value) {
      return String(value || '').replace(/\s+/g, '')
    },
    calcTotalSpaces (item) {
      if (!item) return null
      const keys = ['groupCount', 'innerCount', 'monthCount', 'storeCount', 'visitCount']
      const hasCount = keys.some(key => item[key] != null && item[key] !== '')
      if (!hasCount) return null
      return keys.reduce((sum, key) => {
        const value = Number(item[key])
        return sum + (Number.isFinite(value) ? value : 0)
      }, 0)
    },
    formatCount (val) {
      if (val == null || val === '') return '--'
      return Number(val).toLocaleString()
    },
    formatMoney (val) {
      if (val == null || val === '') return '--'
      const num = Number(val)
      if (Number.isNaN(num)) return '--'
      return '¥' + num.toLocaleString(undefined, { maximumFractionDigits: 2 })
    },
    formatTableMoney (val) {
      if (val == null || val === '') return '--'
      const num = Number(val)
      if (Number.isNaN(num)) return '--'
      return '¥' + num.toLocaleString(undefined, { maximumFractionDigits: 2 })
    },
    applyWorkOrderData (data) {
      const details = Array.isArray(data?.details) ? data.details.slice(0, WORK_ORDER_ROW_COUNT) : []
      const total = data?.totalCount
      const totalNum = total != null && total !== '' ? Number(total) : null
      this.workOrderTotal = totalNum != null && !Number.isNaN(totalNum) ? totalNum : null
      const completionRate = data?.completionRate
      const completionRateNum = completionRate != null && completionRate !== '' ? Number(completionRate) : null
      this.workOrderCompletionRate = completionRateNum != null && !Number.isNaN(completionRateNum)
        ? completionRateNum
        : null

      const rows = []
      for (let i = 0; i < WORK_ORDER_ROW_COUNT; i++) {
        const item = details[i]
        if (!item) {
          rows.push({ ...EMPTY_WORK_ORDER_ROW })
          continue
        }
        const name = item.categoryName ? String(item.categoryName).trim() : ''
        const countRaw = item.count
        const hasCount = countRaw != null && countRaw !== '' && !Number.isNaN(Number(countRaw))
        const countNum = hasCount ? Number(countRaw) : null
        rows.push({
          name: name || '--',
          count: hasCount ? countNum : '--',
          value: hasCount && this.workOrderTotal
            ? +((countNum / this.workOrderTotal) * 100).toFixed(1)
            : '--',
          pieValue: hasCount ? countNum : 0
        })
      }
      this.workOrderTypes = rows
    },
    resetWorkOrderData () {
      this.workOrderTotal = null
      this.workOrderCompletionRate = null
      this.workOrderTypes = Array.from({ length: WORK_ORDER_ROW_COUNT }, () => ({ ...EMPTY_WORK_ORDER_ROW }))
    },
    applyMaintenanceData (data) {
      this.maintenancePlan = {
        planned: this.formatMetricCount(data?.plannedTasks),
        completed: this.formatMetricCount(data?.completedTasks),
        rate: data?.completionRate != null && data?.completionRate !== ''
          ? this.formatRateTrim(data.completionRate)
          : null
      }
    },
    resetMaintenanceData () {
      this.maintenancePlan = { ...EMPTY_MAINTENANCE }
    },
    async fetchProviderEvaluation () {
      try {
        const dto = buildMingYuanQuery({
          scope: this.activeScope,
          period: this.activeTime,
          pageIndex: 0,
          pageSize: SUPPLIER_PAGE_SIZE
        })
        const page = await queryProviderEvaluationDetails(dto)
        this.suppliers = page.items.map(item => ({
          id: item.id,
          name: item.name,
          score: item.score == null ? '--' : Math.round(item.score),
          grade: item.level ? String(item.level).trim().toUpperCase() : '--'
        }))
      } catch (e) {
        console.error('[group-screen] queryProviderEvaluationDetails failed', e)
        this.suppliers = [...EMPTY_SUPPLIERS]
      }
      this.$nextTick(() => this.startSupplierScroll())
    },
    async fetchMaintenanceManagement () {
      const requestId = ++this.maintenanceRequestId
      try {
        const dto = buildMingYuanQuery({ scope: this.activeScope, period: this.activeTime })
        const data = await queryMaintenanceSummary(dto)
        if (requestId !== this.maintenanceRequestId) return
        this.applyMaintenanceData({
          plannedTasks: data.total,
          completedTasks: data.completed,
          completionRate: data.rate
        })
      } catch (e) {
        if (requestId !== this.maintenanceRequestId) return
        console.error('[group-screen] queryMaintenanceSummary failed', e)
        this.resetMaintenanceData()
      }
    },
    initCharts () {
      this.refreshTenantPie()
      this.refreshOrderPie()
    },
    refreshTenantPie () {
      const option = buildTenantSplitOption(this.tenantPublicRatio.tenant, { center: CHART_CENTER })
      if (this.tenantPieChart) {
        this.tenantPieChart.setOption(option, true)
        return
      }
      this.mkTenantPie(option)
    },
    mkTenantPie (option) {
      const el = this.$refs.tenantPie
      if (!el) return
      const c = this.$echarts.init(el)
      c.setOption(option || buildTenantSplitOption(0, { center: CHART_CENTER }))
      this.tenantPieChart = c
    },
    refreshOrderPie () {
      const pieSlices = this.workOrderTypes
        .map((item, i) => ({ item, colorIndex: i }))
        .filter(({ item }) => item.pieValue > 0)
        .map(({ item, colorIndex }) => ({
          name: item.name,
          value: item.pieValue,
          itemStyle: { color: CHART_COLORS[colorIndex % CHART_COLORS.length] }
        }))
      const centerText = this.workOrderCompletionRate != null
        ? `${this.formatRateTrim(this.workOrderCompletionRate)}%`
        : '--'
      const option = {
        color: CHART_COLORS,
        tooltip: darkTooltip,
        series: donutWithTotal(
          pieSlices,
          centerText,
          '整体完成率',
          {
            center: ['50%', '50%'],
            radius: ['57%', '72%'],
            totalSize: 14,
            subSize: 11,
            subWeight: 600,
            subColor: '#e8f7ff',
            subLineHeight: 14,
            subTextShadowColor: 'rgba(116, 177, 215, 0.72)',
            subTextShadowBlur: 3
          }
        )
      }
      if (this.orderPieChart) {
        this.orderPieChart.setOption(option, true)
        return
      }
      this.mkOrderPie(option)
    },
    mkOrderPie (option) {
      const el = this.$refs.orderPie
      if (!el) return
      const c = this.$echarts.init(el)
      c.setOption(option)
      this.orderPieChart = c
    },
    onResize () {
      this.charts.forEach(c => c.resize())
      if (this.tenantPieChart) this.tenantPieChart.resize()
      if (this.orderPieChart) this.orderPieChart.resize()
    },
    resizeCharts () { this.onResize() },
    startSupplierScroll () {
      this.stopSupplierScroll()
      if (!this.supplierNeedScroll) return
      this.supplierScrollTimer = setInterval(() => this.nextSupplierScroll(), SUPPLIER_SCROLL_INTERVAL)
    },
    stopSupplierScroll () {
      if (this.supplierScrollTimer) {
        clearInterval(this.supplierScrollTimer)
        this.supplierScrollTimer = null
      }
    },
    nextSupplierScroll () {
      if (this.supplierScrollPaused || !this.supplierNeedScroll) return
      if (this.supplierScrollStep >= this.supplierMaxStep) {
        this.supplierScrollTransition = false
        this.supplierScrollStep = 0
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.supplierScrollTransition = true
          })
        })
      } else {
        this.supplierScrollTransition = true
        this.supplierScrollStep += 1
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../../styles/design-system.scss';

.col-center {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
}
.blk { flex: 1; min-height: 0; }
.blk-energy {
  flex: 1.22;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -6px -4px 4px;
    border-radius: 14px;
    background:
      radial-gradient(ellipse 88% 72% at 50% 38%, rgba(109, 193, 192, 0.12) 0%, transparent 72%),
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(98, 168, 208, 0.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  ::v-deep .ds-panel {
    position: relative;
    z-index: 1;
  }

  ::v-deep .ds-panel__body {
    padding: 10px 12px 10px;
  }
}
.blk-park {
  flex: 0.84;

  ::v-deep .ds-panel__body {
    padding: 12px;
  }
}
.blk-eng {
  flex: 0.92;

  ::v-deep .ds-panel__body {
    padding: 12px;
  }
}

.energy-board {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.0fr) minmax(0, 0.95fr);
  gap: 10px;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding-bottom: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.energy-zone {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 8px 10px 10px;
  @include ds-inner-surface;
  border-radius: $ds-card-radius;
  box-sizing: border-box;
  overflow: hidden;

  &__hd {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 0 0 8px;
    padding: 0 0 6px;
    border-bottom: 1px solid rgba(109, 193, 192, 0.14);
  }

  &__title {
    margin: 0;
    @include ds-module-subtitle(15px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__drill {
    flex-shrink: 0;
    padding: 2px 0;
    border: 0;
    background: transparent;
    color: rgba(145, 207, 242, 0.9);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      color: #e8f7ff;
      outline: none;
    }
  }

  &__bd {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
      gap: 4px;
    overflow: hidden;

    &--split {
      flex: 1;
      min-height: 0;
      padding-bottom: 0;
    }

    &--collect {
      gap: 0;
      padding-bottom: 0;
    }
  }

  &--collect {
    .energy-zone__bd--collect {
      flex: 1;
      min-height: 0;
    }
  }

  &--bars .energy-zone__bd {
    .energy-bars {
      flex: 1;
      justify-content: space-evenly;
      gap: 8px;
    }
  }

  &--bars {
    border-color: ds-ice-a(0.2);
  }

  &--split {
    border-color: ds-ice-a(0.2);
  }
}

.eng-detail-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding: 2px 0;
  border: 0;
  background: transparent;
  color: rgba(145, 207, 242, 0.9);
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #e8f7ff;
    outline: none;
  }
}

.eng-pane__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.energy-hero {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px 11px;
  @include ds-subcard(true);
  border-color: rgba(109, 193, 192, 0.2);
  box-shadow:
    $ds-card-shadow,
    inset 0 0 14px rgba(109, 193, 192, 0.05);
  border-style: solid;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(109, 193, 192, 0.48);
    background-color: rgba(20, 54, 86, 0.56);
    outline: none;
  }

  &__lbl {
    @include ds-data-label(12px, rgba(219, 226, 236, 0.86));
    letter-spacing: 0.3px;
  }

  &__val {
    @include ds-data-major(26px, $ds-value-text);
    line-height: 1.1;
    text-shadow:
      0 0 10px rgba(230, 242, 255, 0.22),
      0 0 18px rgba(109, 193, 192, 0.14);

    i {
      font-style: normal;
      font-size: 13px;
      font-weight: 500;
      color: rgba(219, 226, 236, 0.85);
      margin-left: 4px;
    }
  }
}

.split-stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100%;
  width: 100%;
  min-height: 0;
  gap: 6px;
}

.split-stack__chart {
  position: relative;
  flex: 0 0 84px;
  min-height: 84px;
  max-height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  &::before {
    content: '';
    position: absolute;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 44%,
      rgba(109, 193, 192, 0.14) 0%,
      rgba(98, 168, 208, 0.06) 42%,
      transparent 68%
    );
    pointer-events: none;
  }

  .chart-box {
    position: relative;
    z-index: 1;
    width: 84px;
    height: 84px;
  }
}

.split-stack__legend {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: auto;
}

/* 信息盒弹性均分剩余空间，内容整体在盒内垂直水平居中：名称+占比 / 数值 */
.split-leg {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: 5px;
  padding: 8px 11px 8px 10px;
  border-radius: 8px;
  background: rgba(18, 52, 86, 0.36);
  border: 1px solid rgba(109, 193, 192, 0.12);
  box-sizing: border-box;
  box-shadow: inset -1px -1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  width: 100%;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(109, 193, 192, 0.46);
    background: rgba(24, 64, 101, 0.48);
    outline: none;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  &__name {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: 12.5px;
    font-weight: 600;
    color: rgba(219, 226, 236, 0.92);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  &__pct {
    flex-shrink: 0;
    font-size: 17px;
    font-weight: 700;
    font-family: $ds-font-num;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    color: $ds-value-text;
    text-shadow: 0 0 8px rgba(109, 193, 192, 0.18);

    i {
      font-style: normal;
      font-size: 11.5px;
      font-weight: 600;
      color: $ds-screen-unit;
      margin-left: 1px;
    }
  }

  &__val {
    width: 100%;
    text-align: right;
    font-style: normal;
    font-size: 11.5px;
    font-weight: 600;
    font-family: $ds-font-num;
    font-variant-numeric: tabular-nums;
    color: rgba(219, 226, 236, 0.92);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;

    small {
      font-size: 11px;
      font-weight: 500;
      color: $ds-screen-unit;
      margin-left: 2px;
    }
  }

  &--tenant {
    background: linear-gradient(155deg, rgba(98, 168, 208, 0.12) 0%, rgba(10, 32, 62, 0.18) 100%);
    border-color: rgba(109, 193, 192, 0.12);

    .split-leg__name {
      color: rgba(220, 236, 252, 0.94);
    }

    .split-leg__val {
      color: #fff;
    }
  }

  &--public {
    .split-leg__name {
      color: $ds-screen-muted;
    }

    .split-leg__val {
      color: $ds-screen-label;
      font-weight: 500;
    }
  }
}

.energy-bars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 0 0 auto;
}

.energy-bar-row {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 7px 9px 8px;
  border-radius: 10px;
  background: rgba(12, 34, 62, 0.34);
  border: 1px solid rgba(109, 193, 192, 0.09);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(109, 193, 192, 0.4);
    background: rgba(20, 54, 86, 0.48);
    outline: none;
  }

  &__hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  &__meta {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-shrink: 1;
    min-width: 0;
    justify-content: flex-end;
  }

  &__num {
    font-size: 12.5px;
    color: $ds-screen-caption;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  &__name {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13.5px;
    color: $ds-screen-label;
    font-weight: 500;
    letter-spacing: 0;
  }

  &__dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  &__pct {
    font-size: 15px;
    font-weight: 700;
    color: rgba(235, 244, 255, 0.95);
    font-variant-numeric: tabular-nums;
  }

  &__track {
    position: relative;
    height: 6px;
    border-radius: 999px;
    background: rgba(4, 20, 48, 0.5);
    box-shadow: inset 0 0 0 1px rgba(108, 142, 172, 0.12);
    overflow: visible;
  }

  &__fill {
    position: relative;
    display: block;
    height: 100%;
    min-width: 6px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(66, 140, 190, 0.45) 0%,
      var(--bar-color, rgba(90, 168, 210, 0.88)) 100%
    );
    opacity: 0.92;

    &::after {
      display: none;
    }
  }

  &__unit {
    font-style: normal;
    margin-left: 2px;
    font-size: 11px;
    color: $ds-screen-unit;
  }
}

.collect-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.collect-hero {
  flex: 0 0 auto;
  padding: 8px 10px 10px;
  @include ds-subcard(true);
  border-color: rgba(109, 193, 192, 0.14);

  &__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  &__val {
    @include ds-data-major(24px, rgba(244, 250, 255, 0.98));
    text-shadow: none;

    i {
      font-style: normal;
      font-size: 13px;
      font-weight: 600;
      color: $ds-screen-caption;
      margin-left: 1px;
    }
  }

  &__lbl {
    @include ds-data-label(12px, rgba(176, 200, 228, 0.76));
    letter-spacing: 0.2px;
  }

  &__track {
    position: relative;
    height: 5px;
    border-radius: 999px;
    background: rgba(16, 44, 78, 0.45);
    box-shadow: inset 0 0 0 1px rgba(108, 142, 172, 0.12);
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    min-width: 6px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(36, 132, 176, 0.72) 0%,
      rgba(58, 168, 208, 0.88) 100%
    );
  }
}

.collect-money {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
}

.energy-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: grid;
    grid-template-columns: 8px max-content 1fr;
    align-items: center;
    column-gap: 8px;
    font-size: 12px;
    line-height: 1.35;

    i {
      width: 8px;
      height: 8px;
      border-radius: 1px;
    }

    .name {
      color: $ds-label;
      font-weight: 500;
      white-space: nowrap;
      min-width: 2em;
    }

    .vals {
      display: flex;
      align-items: baseline;
      justify-content: flex-end;
      gap: 18px;
      min-width: 0;
    }

    .pct {
      flex-shrink: 0;
      color: #fff;
      font-weight: 700;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .num {
      flex-shrink: 0;
      min-width: 44px;
      color: rgba(245, 250, 255, 0.92);
      font-weight: 500;
      text-align: right;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      font-size: 12px;
    }
  }
}

.split-metric {
  padding-left: 2px;

  &__hd {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
    font-size: 12px;
    font-weight: 500;
    color: $ds-label;

    i {
      width: 7px;
      height: 7px;
      border-radius: 1px;
      flex-shrink: 0;
    }
  }

  &__pct {
    margin: 0;
    padding-left: 15px;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    line-height: 1.15;
    font-family: $ds-font-num;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
  }

  &__pct-unit {
    font-style: normal;
    font-size: 14px;
    font-weight: 600;
    color: rgba(168, 196, 222, 0.75);
    margin-left: 1px;
  }

  &__sub {
    margin: 5px 0 0;
    padding-left: 15px;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  &__num {
    font-size: 12px;
    font-weight: 500;
    color: #7e9bb7;
    font-family: $ds-font-num;
  }

  &__unit {
    font-style: normal;
    font-size: 11px;
    font-weight: 500;
    color: #7e9bb7;
    margin-left: 4px;
    letter-spacing: 0;
  }

  &--primary {
    .split-metric__hd {
      color: rgba(210, 232, 255, 0.94);
    }

    .split-metric__pct {
      font-size: 26px;
      font-weight: 700;
      color: #fff;
      text-shadow: none;
    }

    .split-metric__pct-unit {
      font-size: 14px;
      color: rgba(200, 220, 240, 0.78);
    }
  }

  &--secondary {
    padding-top: 2px;

    .split-metric__hd {
      color: rgba(168, 200, 232, 0.86);
    }

    .split-metric__pct {
      font-size: 20px;
      font-weight: 500;
      color: #a8c8e6;
      text-shadow: none;
    }

    .split-metric__pct-unit {
      font-size: 12px;
      color: rgba(168, 196, 222, 0.65);
    }

    .split-metric__num {
      color: #8ea8c4;
    }
  }
}

.money-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex: 1 1 0;
  min-height: 0;
  padding: 8px 9px 8px 11px;
  border-radius: 10px;
  background: rgba(12, 34, 62, 0.32);
  border: 1px solid rgba(109, 193, 192, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 1px;
    background: rgba(98, 168, 208, 0.62);
  }

  &__lbl {
    flex-shrink: 0;
    font-size: 14px;
    color: $ds-screen-label;
    font-weight: 500;
  }

  b {
    font-size: 14px;
    font-weight: 700;
    color: rgba(240, 246, 252, 0.96);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60%;
    text-align: right;
  }

  &--ok {
    &::before {
      background: rgba(122, 214, 212, 0.62);
    }
  }

  &--warn {
    &::before {
      background: rgba(212, 168, 106, 0.62);
    }
  }
}

/* 停车：顶部紧凑 KPI 条 + 下方完整表格 */
.park-inner {
  display: grid;
  grid-template-columns: minmax(0, 0.34fr) minmax(0, 0.66fr);
  height: 100%;
  min-height: 0;
  gap: 10px;
}

.park-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  padding: 10px;
  gap: 10px;
  @include ds-subcard();
  background: linear-gradient(180deg, rgba(18, 52, 86, 0.56) 0%, rgba(8, 28, 52, 0.68) 100%);
}

.park-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60px;
  padding: 8px 6px;
  background: rgba(12, 34, 62, 0.32);
  border: 1px solid rgba(109, 193, 192, 0.08);
  border-radius: 10px;

  &--last {
    background: linear-gradient(180deg, rgba(26, 66, 102, 0.58) 0%, rgba(10, 34, 62, 0.72) 100%);
    border-color: rgba(109, 193, 192, 0.14);
  }

  &__label {
    @include ds-data-label(12px, rgba(176, 200, 228, 0.74));
    margin-bottom: 6px;
    white-space: nowrap;
  }

  &__value {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 3px;
    line-height: 1;
    min-height: 24px;

    em {
      font-style: normal;
      @include ds-data-mid(21px, rgba(248, 251, 255, 0.98));
      text-shadow: none;
    }

    i {
      font-style: normal;
      font-size: 12px;
      color: $ds-screen-unit;
      font-weight: 500;
      transform: translateY(2px);
    }
  }
}

.park-revenue {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 10px 12px 12px;
  min-height: 0;
  @include ds-subcard();

  &__title {
    @include ds-screen-subtitle(13px, 600);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(109, 193, 192, 0.08);
    flex-shrink: 0;
  }

  &__heading {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
  }

  &__drill {
    flex-shrink: 0;
    padding: 2px 0;
    border: 0;
    background: transparent;
    color: rgba(145, 207, 242, 0.9);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      color: #e8f7ff;
      outline: none;
    }
  }

  &__icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    font-family: $ds-font-num;
    line-height: 1;
    color: $ds-cyan-bright;
    background: rgba(109, 193, 192, 0.08);
    box-shadow: none;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(210, 232, 255, 0.96);
    letter-spacing: 0;
  }

  &__table {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

.park-table-head,
.park-table-row {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) repeat(5, minmax(0, 0.9fr));
  align-items: center;
  gap: 8px;
  min-width: 0;

  .col-lot {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-money,
  .col-count {
    min-width: 0;
    font-family: $ds-font-num;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.park-table-head {
  padding: 0 6px 6px;
  border-bottom: 1px solid rgba(109, 193, 192, 0.08);

  span {
    font-size: 12.5px;
    font-weight: 600;
    color: rgba(186, 207, 232, 0.96);
    white-space: nowrap;
  }

  .col-money--total {
    color: rgba(132, 222, 220, 0.96);
  }
}

.park-table-row {
  min-height: 0;
  padding: 9px 6px;
  border-radius: 10px;
  background: rgba(8, 32, 60, 0.2);
  border: 1px solid rgba(109, 193, 192, 0.055);

  .col-lot {
    font-size: 12.5px;
    font-weight: 600;
    color: rgba(220, 236, 252, 0.96);
  }

  .col-money {
    font-size: 13px;
    font-weight: 700;
    color: rgba(236, 245, 255, 0.98);
    text-align: center;
  }

  .col-count {
    font-size: 13px;
    font-weight: 700;
    color: rgba(224, 237, 248, 0.94);
    text-align: center;
  }

  .col-money--total {
    color: $ds-cyan-bright;
  }

  &--empty {
    opacity: 0.22;
  }
}

.park-table-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-auto-rows: auto;
  gap: 6px;
}

/* 工程服务：左（工单主区 + 底部小模块）| 右（供应商主区） */
.eng-board {
  display: grid;
  grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr);
  gap: 10px;
  height: 100%;
  min-height: 0;

  &__left {
    display: grid;
    grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr);
    gap: 8px;
    min-width: 0;
    min-height: 0;
    padding-right: 0;
    border-right: none;
  }
}

.eng-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;

  &--order {
    min-height: 0;
    padding: 0;
    @include ds-subcard(true);
    background: linear-gradient(180deg, rgba(18, 52, 86, 0.58) 0%, rgba(8, 28, 52, 0.7) 100%);
    padding: 8px 10px;
  }

  &--supplier {
    height: 100%;
    padding: 8px 10px;
    @include ds-subcard(true);
    background: linear-gradient(180deg, rgba(14, 42, 74, 0.54) 0%, rgba(8, 28, 52, 0.68) 100%);
  }

  &__hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 0 0 auto;
    min-height: 22px;
    padding-bottom: 6px;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(109, 193, 192, 0.08);
  }

  &__title {
    margin: 0;
    @include ds-module-subtitle(15px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__bd {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
  }
}

.eng-aux {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 16px;
  align-self: flex-start;
}

.eng-mini {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  min-width: 0;
  padding: 7px 10px;
  @include ds-subcard();
  box-sizing: border-box;
  background: rgba(12, 34, 62, 0.3);

  &__hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    margin-bottom: 3px;
  }

  &__title {
    margin: 0;
    @include ds-module-subtitle(14px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__bd {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 6px;
    min-width: 0;
  }
}

.eng-mini-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  min-width: 0;

  &__cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 5px 4px;
    text-align: center;
    min-width: 0;
    border-radius: 8px;
    background: rgba(12, 40, 72, 0.12);
    border: 1px solid rgba(109, 193, 192, 0.055);

    span {
      font-size: 12px;
      color: rgba(190, 214, 240, 0.92);
      white-space: nowrap;
    }

    b {
      font-size: 17px;
      font-weight: 700;
      color: rgba(248, 252, 255, 0.96);
      font-family: $ds-font-num;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;

      em {
        font-style: normal;
        font-size: 12px;
        margin-left: 1px;
        color: rgba(152, 188, 228, 0.82);
      }

      &.cyan { color: $ds-cyan-bright; }
      &.green { color: $ds-green; }
      &.red { color: $ds-red; }
    }
  }
}

.eng-mini-bar {
  height: 4px;
  border-radius: 999px;
  background: rgba(16, 44, 78, 0.55);
  box-shadow: inset 0 0 0 1px rgba(108, 142, 172, 0.14);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    min-width: 4px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(98, 168, 208, 0.72), $ds-cyan-bright);
  }
}

.eng-order {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 3px;
  align-items: center;
  flex: 1;
  min-height: 0;
  height: 100%;

  &__chart {
    width: 76px;
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .chart-box--order {
    width: 76px;
    height: 76px;
    min-width: 76px;
    min-height: 76px;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 4px;
    min-width: 0;
    flex: 1;
    min-height: 0;
  }

  &__item {
    display: grid;
    grid-template-columns: 7px minmax(42px, 1fr) auto auto;
    align-items: center;
    gap: 4px;
    padding: 3px 0;
    border-radius: 0;
    font-size: 13px;
    line-height: 1.2;

    & + & {
      border-top: 1px solid rgba(108, 142, 172, 0.08);
    }

    &--alt {
      background: transparent;
    }

    &--empty {
      opacity: 0.22;
    }
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  &__name {
    color: $ds-label;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  &__cnt {
    color: rgba(248, 252, 255, 0.96);
    font-weight: 600;
    font-family: $ds-font-num;
    white-space: nowrap;
    font-size: 13px;
  }

  &__pct {
    color: $ds-cyan-bright;
    font-weight: 600;
    font-family: $ds-font-num;
    min-width: 30px;
    text-align: right;
    white-space: nowrap;
    font-size: 13px;
  }
}

.eng-supplier-scroll {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;

  &__viewport {
    overflow: hidden;

    &--static {
      height: auto !important;
    }
  }
}

.eng-supplier-empty {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: rgba(168, 192, 220, 0.48);
  font-size: 12px;

  i {
    font-size: 22px;
    color: rgba(122, 184, 214, 0.42);
  }
}

.eng-supplier {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0;
  flex: 1;
  min-height: 0;
  height: 100%;

  &--scroll {
    height: auto;
    will-change: transform;
    transition: transform 650ms ease;

    &.no-transition {
      transition: none;
    }
  }

  &__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr) auto;
    align-items: center;
    gap: 10px;
    height: 40px;
    padding: 0 2px;
    box-sizing: border-box;
    border-radius: 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(109, 193, 192, 0.08);
    flex: 0 0 auto;
    min-height: 0;

    &:last-child {
      border-bottom: none;
    }

    &--top {
      background: rgba(98, 168, 208, 0.04);

      .eng-supplier__name {
        color: rgba(210, 230, 248, 0.92);
      }
    }

  }

  &__name {
    font-size: 13.5px;
    color: rgba(190, 214, 240, 0.92);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__score {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    b {
      font-size: 13.5px;
      font-weight: 600;
      color: rgba(210, 228, 248, 0.92);
      font-family: $ds-font-num;
      min-width: 24px;
      text-align: right;
      flex-shrink: 0;
    }
  }

  &__bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: rgba(8, 28, 52, 0.66);
    overflow: hidden;
    min-width: 0;

    i {
      display: block;
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, rgba(82, 145, 182, 0.32), rgba(122, 214, 212, 0.46));
    }
  }

  &__grade {
    min-width: 24px;
    height: 22px;
    padding: 0 9px;
    border-radius: 11px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;

    &.A { background: rgba(185, 176, 124, 0.2); color: #e4c369; }
    &.B { background: rgba(90, 138, 184, 0.18); color: #9ac3ea; }
    &.C { background: rgba(106, 122, 136, 0.2); color: #b3c0cc; }
  }
}
</style>
