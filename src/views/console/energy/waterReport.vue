<template>
  <div class="water-dashboard">
    <!-- 顶部操作栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">{{ $t('waterReport.dashboardTitle') }}</h1>

        <!-- Tab切换 -->
        <div class="tab-switcher">
          <button :class="['tab-btn', { active: reportType === 'statistics' }]" @click="switchReportType('statistics')">
            {{ $t('waterReport.tabStatistics') }}
          </button>
          <button :class="['tab-btn', { active: reportType === 'detail' }]" @click="switchReportType('detail')">
            {{ $t('waterReport.tabDetail') }}
          </button>
        </div>
      </div>

      <div class="header-right">
        <button class="export-btn" @click="handleExport" :disabled="exportLoading">
          <svg v-if="!exportLoading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span v-if="exportLoading">{{ $t('waterReport.exportLoading') }}</span>
          <span v-else>{{ $t('waterReport.exportReport') }}</span>
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-container">
      <div class="filter-item date-filter">
        <label class="filter-label">{{ $t('waterReport.filterStatPeriod') }}</label>
        <el-date-picker v-model="queryParams.dateRange" type="daterange" format="yyyy-MM-dd" value-format="yyyy-MM-dd"
          range-separator="-" :start-placeholder="$t('waterReport.phDateStart')" :end-placeholder="$t('waterReport.phDateEnd')" :picker-options="currentPickerOptions"
          class="custom-date-picker" popper-class="elegant-date-picker" @change="handleDateRangeChange" />
      </div>

      <!-- 租户选择 -->
      <div class="filter-item tenant-filter">
        <label class="filter-label">{{ $t('waterReport.filterTenant') }}</label>
        <!-- 单选 - 租户用水统计 -->
        <el-select v-show="reportType === 'statistics'" v-model="queryParams.tenantId" filterable
          :placeholder="$t('waterReport.phTenant')" class="custom-select" :loading="tenantLoading" @change="handleTenantChange">
          <el-option v-for="tenant in (switchDeviceDetail ? realTenantList : tenantList)" :key="tenant.tenantId"
            :label="tenantOptionLabel(tenant)" :value="tenant.tenantId" />
        </el-select>
        <!-- 多选 - 租户用水明细 -->
        <el-select v-show="reportType === 'detail'" v-model="queryParams.tenantIds" multiple collapse-tags filterable
          :placeholder="$t('waterReport.phTenant')" class="custom-select" :loading="tenantLoading" @change="handleDetailTenantChange">
          <el-option
            v-if="realTenantList.length > 0 && !isAllDetailTenantsSelected"
            :key="TENANT_SELECT_SELECT_ALL"
            :label="$t('waterReport.btnSelectAll')"
            :value="TENANT_SELECT_SELECT_ALL"
            class="tenant-select-action-option"
          />
          <el-option
            v-if="queryParams.tenantIds.length > 0"
            :key="TENANT_SELECT_CLEAR_ALL"
            :label="$t('waterReport.btnDeselectAll')"
            :value="TENANT_SELECT_CLEAR_ALL"
            class="tenant-select-action-option tenant-select-action-option--clear"
          />
          <el-option v-for="tenant in realTenantList" :key="tenant.tenantId" :label="tenantOptionLabel(tenant)"
            :value="tenant.tenantId" />
        </el-select>
      </div>

      <!-- 租户类型 -->
      <div class="filter-item tenant-type-filter">
        <label class="filter-label">{{ $t('waterReport.filterTenantType') }}</label>
        <el-select v-model="queryParams.tenantType" class="custom-select" @change="handleTenantTypeChange">
          <el-option :label="$t('waterReport.tenantType0')" :value="0" />
          <el-option :label="$t('waterReport.tenantType1')" :value="1" />
          <el-option :label="$t('waterReport.tenantType2')" :value="2" />
        </el-select>
      </div>

      <div class="filter-actions">
        <!-- <button class="search-btn" @click="handleSearch">查询</button> -->
        <button class="reset-btn" @click="handleReset">{{ $t('waterReport.btnReset') }}</button>

        <!-- 第一个tab的设备明细 -->
        <el-tooltip v-if="reportType === 'statistics'" effect="dark"
          :content="$t('waterReport.tooltipDeviceDetail')" placement="top"
          :disabled="!!queryParams.tenantId">
          <div class="detail-switch" :class="{ 'is-disabled': realTenantList.length === 0 }">
            <label class="switch-text" for="waterDeviceDetailSwitch">{{ $t('waterReport.deviceDetailSwitch') }}</label>
            <label class="toggle-switch">
              <input
                id="waterDeviceDetailSwitch"
                type="checkbox"
                v-model="switchDeviceDetail"
                @change="handleSwitchChange"
                :disabled="realTenantList.length === 0"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </el-tooltip>
      </div>
    </div>
    <!-- 主内容区 -->
    <div class="main-content" v-loading="loading" :element-loading-text="loadingText">
      <!-- 租户用水统计 - 图表区域 -->
      <div class="chart-section" v-if="reportType === 'statistics' && chartData.length > 0">
        <div class="chart-container-full">
          <div class="chart-header">
            <h2 class="chart-title">{{ $t('waterReport.chartTrendTitle') }}</h2>
            <div class="chart-date-range">{{ formatDateRange }}</div>
          </div>
          <div class="chart-info">
            <div class="chart-legends">
              <div class="legend-item active" @click="toggleSeriesByKey('totalFee')">
                <span class="legend-dot" style="background: #52c41a"></span>
                <span class="legend-text">{{ chartSeriesNames.totalFee }}</span>
              </div>
              <div class="legend-item active" @click="toggleSeriesByKey('totalWater')">
                <span class="legend-dot" style="background: #5b9bd5"></span>
                <span class="legend-text">{{ chartSeriesNames.totalWater }}</span>
              </div>
            </div>
            <div class="chart-summary">
              <div class="summary-item">
                <span class="summary-label">{{ $t('waterReport.summaryTotalFee') }}</span>
                <span class="summary-value">¥{{ formatNumber(totalStats.amount) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">{{ $t('waterReport.summaryTotalWater') }}</span>
                <span class="summary-value">{{ formatNumber(totalStats.water) }} m³</span>
              </div>
            </div>
          </div>
          <div ref="mainChartContainer" class="main-chart"></div>
        </div>
      </div>

      <!-- 租户用水统计 - 详细数据表格区域 -->
      <div class="table-section" v-if="reportType === 'statistics'">
        <div class="section-header">
          <h2 class="section-title">{{ $t('waterReport.detailedData') }}</h2>
        </div>

        <!-- 普通统计表格 -->
        <el-table v-show="!switchDeviceDetail" v-if="tableData.length > 0" ref="statisticsTable" :data="tableData"
          show-summary :summary-method="getStatisticsSummaries" height="70vh" :highlight-current-row="true">
          <el-table-column min-width="140" :label="$t('waterReport.colDate')">
            <template slot-scope="scope">
              {{ scope.row.occurDate ? scope.row.occurDate : $t('waterReport.summaryTotal') }}
            </template>
          </el-table-column>
          <el-table-column min-width="140" :label="$t('waterReport.colWaterFeeYuan')" prop="useAmount" align="right" />
          <el-table-column min-width="140" :label="$t('waterReport.colWaterVolumeM3')" prop="waterUse" align="right" />
        </el-table>

        <!-- 设备明细表格 -->
        <el-table v-show="switchDeviceDetail" v-if="deviceDetailData.length > 0" ref="deviceDetailTable"
          :data="deviceDetailData" :span-method="deviceDetailSpanMethod" :summary-method="getDeviceDetailSummaries"
          show-summary height="70vh" :highlight-current-row="true" style="width: 100%">
          <el-table-column min-width="140" :label="$t('waterReport.colDate')">
            <template slot-scope="scope">{{ scope.row.occurDate }}</template>
          </el-table-column>
          <el-table-column min-width="120" :label="$t('waterReport.colWaterFeeYuan')" prop="useAmount" align="right" />
          <el-table-column min-width="120" :label="$t('waterReport.colWaterVolumeM3')" prop="waterUse" align="right" />
          <el-table-column :label="$t('waterReport.colDevice')" width="160">
            <template slot-scope="scope">{{
              $displayBizHybrid(scope.row.deviceUseDtoList.waterName) || "-"
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('waterReport.colSettleWay')" width="120">
            <template slot-scope="scope">{{
              getSettleWayLabel(scope.row.deviceUseDtoList.settleWay)
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('waterReport.colFee')" width="120" align="right">
            <template slot-scope="scope">{{
              scope.row.deviceUseDtoList.balance !== undefined
                ? scope.row.deviceUseDtoList.balance
                : "-"
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('waterReport.colWaterVolumeM3')" width="120" align="right">
            <template slot-scope="scope">{{
              scope.row.deviceUseDtoList.consumption !== undefined
                ? scope.row.deviceUseDtoList.consumption
                : "-"
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('waterReport.colStartReading')" align="center">
            <el-table-column :label="$t('waterReport.colTime')" width="160">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startTime || "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('waterReport.colCumulativeRead')" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startRead !== undefined
                  ? scope.row.deviceUseDtoList.startRead
                  : "-"
              }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column :label="$t('waterReport.colEndReading')" align="center">
            <el-table-column :label="$t('waterReport.colTime')" width="160">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.endTime || "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('waterReport.colCumulativeRead')" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.endRead !== undefined
                  ? scope.row.deviceUseDtoList.endRead
                  : "-"
              }}</template>
            </el-table-column>
          </el-table-column>
        </el-table>

        <div class="empty-state" v-if="!loading && tableData.length === 0 && !switchDeviceDetail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <p>{{ $t('waterReport.emptyNoData') }}</p>
        </div>
        <div class="empty-state" v-if="!loading && deviceDetailData.length === 0 && switchDeviceDetail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 3v4m8-4v4M3 11h18" />
          </svg>
          <p>{{ $t('waterReport.emptyNoDeviceDetail') }}</p>
        </div>
      </div>

      <!-- 租户用水明细 - 租户列表表格 -->
      <div class="table-section" v-if="reportType === 'detail'">
        <div class="section-header">
          <h2 class="section-title">{{ $t('waterReport.sectionDetailTitle') }}</h2>
        </div>
        <el-table v-if="tenantDetailData.length > 0" :data="tenantDetailData" height="calc(100vh - 400px)"
          :highlight-current-row="true" :row-class-name="tableRowClassName">
          <el-table-column :label="$t('waterReport.colTenantId')" width="120">
            <template slot-scope="scope">{{
              scope.row.tenantId !== -1 ? scope.row.tenantId : $t('waterReport.summaryTotal')
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('waterReport.colTenantName')" min-width="200">
            <template slot-scope="scope">{{
              $displayBizHybrid(scope.row.tenantName) || "-"
            }}</template>
          </el-table-column>
          <!-- <el-table-column label="区域标签" width="180">
            <template slot-scope="scope">
              <div v-if="scope.row.labelNames && scope.row.labelNames.length">
                <div class="label-tags">
                  <span class="label-tag">{{ scope.row.labelNames[0] }}</span>
                </div>
              </div>
              <div v-else>-</div>
            </template>
          </el-table-column> -->
          <el-table-column :label="$t('waterReport.colWaterFeeParen')" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useAmount)
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('waterReport.colWaterVolumeParen')" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.waterUse)
            }}</template>
          </el-table-column>
        </el-table>
        <div class="empty-state" v-else-if="!loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            <path d="M8 14s.5 2 4 2 4-2 4-2" />
          </svg>
          <p>{{ $t('waterReport.emptyNoData') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getSimpleTenantList, queryTenantWaterUseStatis, queryTenantWaterUse } from '@/api/useReport'
import moment from 'moment'
import * as XLSX from 'xlsx'

/** 明细 Tab 多选下拉内「全选 / 取消全选」哨兵值 */
const TENANT_SELECT_CLEAR_ALL = '__CLEAR_ALL__'
const TENANT_SELECT_SELECT_ALL = '__SELECT_ALL__'

export default {
  name: 'WaterReport',
  data () {
    return {
      TENANT_SELECT_CLEAR_ALL,
      TENANT_SELECT_SELECT_ALL,
      reportType: 'statistics',
      queryParams: {
        dateRange: [],
        tenantId: '',
        tenantIds: [],
        tenantType: 0
      },
      tenantList: [],
      tenantLoading: false,
      loading: false,
      exportLoading: false,
      chartData: [],
      tableData: [],
      deviceDetailData: [],
      tenantDetailData: [],
      switchDeviceDetail: false,
      mainChartInstance: null,
      pickerOptions: {
        disabledDate (time) {
          return time.getTime() > Date.now()
        }
      },
      resizeObserver: null
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    currentPickerOptions () {
      const t = (k) => this.$t(`waterReport.${k}`)
      const shortcuts = [
        {
          text: t('pickerYesterday'),
          onClick (picker) {
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24)
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setTime(end.getTime() - 3600 * 1000 * 24)
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerThisWeek'),
          onClick (picker) {
            const now = new Date()
            const dayOfWeek = now.getDay()
            const start = new Date(now)
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
            start.setDate(now.getDate() + diff)
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerLastWeek'),
          onClick (picker) {
            const now = new Date()
            const dayOfWeek = now.getDay()
            const start = new Date(now)
            const diff = dayOfWeek === 0 ? -13 : -6 - dayOfWeek
            start.setDate(now.getDate() + diff)
            start.setHours(0, 0, 0, 0)
            const end = new Date(start)
            end.setDate(start.getDate() + 6)
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerThisMonth'),
          onClick (picker) {
            const start = new Date()
            start.setDate(1)
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerLastMonth'),
          onClick (picker) {
            const start = new Date()
            start.setMonth(start.getMonth() - 1)
            start.setDate(1)
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setDate(0)
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerLast3Months'),
          onClick (picker) {
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            const start = new Date()
            start.setMonth(start.getMonth() - 3)
            start.setHours(0, 0, 0, 0)
            picker.$emit('pick', [start, end])
          }
        }
      ]

      if (this.reportType !== 'statistics') {
        shortcuts.push({
          text: t('pickerLastYear'),
          onClick (picker) {
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            const start = new Date()
            start.setFullYear(start.getFullYear() - 1)
            start.setHours(0, 0, 0, 0)
            picker.$emit('pick', [start, end])
          }
        })
      }

      return {
        shortcuts,
        disabledDate: this.pickerOptions.disabledDate
      }
    },
    formatDateRange () {
      if (!this.queryParams.dateRange || this.queryParams.dateRange.length !== 2) {
        return ''
      }
      const [start, end] = this.queryParams.dateRange
      return `${start} - ${end}`
    },
    totalStats () {
      const stats = { amount: 0, water: 0 }
      this.tableData.forEach(item => {
        stats.amount += Number(item.useAmount) || 0
        stats.water += Number(item.waterUse) || 0
      })
      return stats
    },
    detailTotalStats () {
      const stats = { totalWater: 0, totalAmount: 0 }
      this.tenantDetailData.forEach(item => {
        stats.totalWater += Number(item.waterUse) || 0
        stats.totalAmount += Number(item.useAmount) || 0
      })
      return stats
    },
    avgDailyAmount () {
      if (this.tableData.length === 0) return 0
      return (this.totalStats.amount / this.tableData.length).toFixed(2)
    },
    avgDailyWater () {
      if (this.tableData.length === 0) return 0
      return (this.totalStats.water / this.tableData.length).toFixed(2)
    },
    avgUnitPrice () {
      if (this.detailTotalStats.totalWater === 0) return '0.00'
      return (this.detailTotalStats.totalAmount / this.detailTotalStats.totalWater).toFixed(2)
    },
    realTenantList () {
      return this.tenantList.filter(item => item.tenantId !== '')
    },
    isAllDetailTenantsSelected () {
      return (
        this.realTenantList.length > 0 &&
        this.queryParams.tenantIds.length === this.realTenantList.length
      )
    },
    loadingText () {
      return this.$t('waterReport.loadingText')
    },
    chartSeriesNames () {
      const t = (k) => this.$t(`waterReport.${k}`)
      return {
        totalFee: t('seriesTotalFee'),
        totalWater: t('seriesTotalWater')
      }
    }
  },
  watch: {
    currentManagerId: {
      handler (val) {
        if (val) {
          this.initializeData()
        }
      },
      immediate: true
    },
    '$i18n.locale' () {
      this.$nextTick(() => {
        if (this.mainChartInstance && this.chartData.length) this.updateMainChart()
      })
    }
  },
  mounted () {
    window.addEventListener('resize', this.handleResize)
    this.$nextTick(() => {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.handleResize)
        const mainContent = this.$el.querySelector('.main-content')
        if (mainContent) {
          this.resizeObserver.observe(mainContent)
        }
      }
    })
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.mainChartInstance) {
      this.mainChartInstance.dispose()
    }
  },
  methods: {
    tenantOptionLabel (tenant) {
      if (!tenant || tenant.tenantId === '') return this.$t('waterReport.tenantAll')
      return this.$displayBizHybrid(tenant.name)
    },

    toggleSeriesByKey (key) {
      const name = this.chartSeriesNames[key]
      if (name) this.toggleSeries(name)
    },

    async initializeData () {
      this.setDefaultDateRange()

      // 从 URL 获取参数
      const { tenantId, startDate, endDate, showDetail } = this.$route.query

      // 如果有日期参数，使用传入的日期
      if (startDate && endDate) {
        this.queryParams.dateRange = [startDate, endDate]
      }

      this.queryParams.tenantType = 0
      await this.getTenantList()

      // 如果有租户参数，使用传入的租户ID
      if (tenantId) {
        const targetTenantId = Number(tenantId) || tenantId
        const tenant = this.tenantList.find(t => t.tenantId == targetTenantId)
        if (tenant) {
          this.queryParams.tenantId = tenant.tenantId
          this.clearTenantType()
        } else {
          this.queryParams.tenantId = ''
        }
      } else {
        this.queryParams.tenantId = ''
      }

      // 如果有显示明细参数，打开设备明细
      if (showDetail === '1') {
        this.switchDeviceDetail = true
      }

      // 明细 Tab 默认不预选租户
      this.clearDetailTenants()

      if (this.reportType === 'statistics') {
        this.handleSearch()
      }
    },

    setDefaultDateRange () {
      this.queryParams.dateRange = [
        moment().subtract(30, 'days').format('YYYY-MM-DD'),
        moment().format('YYYY-MM-DD')
      ]
    },

    async getTenantList () {
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0,
          tenantType: this.getTenantListTenantType()
        })
        this.tenantList = [
          { tenantId: '', name: this.$t('waterReport.tenantAll') },
          ...(data || [])
        ]
      } catch (error) {
        this.$apiError.notify(error, this.$t('waterReport.msgTenantListFail'))
        console.error('getTenantList:', error)
      } finally {
        this.tenantLoading = false
      }
    },

    handleDateRangeChange (val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        const [start, end] = val
        const startDate = new Date(start)
        const endDate = new Date(end)
        const diffDays = Math.floor((endDate - startDate) / (24 * 3600 * 1000))

        // 租户用水统计模式(Tab 1)下限制100天
        // 租户用水明细模式(Tab 2)下限制1年(366天)
        const limitDays = this.reportType === 'statistics' ? 100 : 366
        const limitSpanKey = this.reportType === 'statistics' ? 'dateSpan100Days' : 'dateSpan1Year'

        if (diffDays > limitDays) {
          this.$message.warning(
            this.$t('waterReport.msgDateRangeLimit', { span: this.$t(`waterReport.${limitSpanKey}`) })
          )
          const newEndDate = new Date(startDate.getTime() + limitDays * 24 * 3600 * 1000)
          this.queryParams.dateRange = [start, moment(newEndDate).format('YYYY-MM-DD')]
          return
        }
        this.handleSearch()
      }
    },

    switchReportType (type) {
      if (this.reportType === type) return
      this.reportType = type

      this.switchDeviceDetail = false

      // 如果切换回统计模式，且当前选择的时间范围超过100天，则重置为默认时间
      if (type === 'statistics' && this.queryParams.dateRange && this.queryParams.dateRange.length === 2) {
        const [start, end] = this.queryParams.dateRange
        const diffDays = Math.floor((new Date(end) - new Date(start)) / (24 * 3600 * 1000))
        if (diffDays > 100) {
          this.setDefaultDateRange()
        }
      }

      this.tableData = []
      this.chartData = []
      this.deviceDetailData = []
      this.tenantDetailData = []

      if (type === 'detail') {
        this.initDetailTenantQueryMode()
        this.handleSearch()
        return
      }
      this.handleSearch()
    },

    toggleSeries (seriesName) {
      if (this.mainChartInstance) {
        this.mainChartInstance.dispatchAction({
          type: 'legendToggleSelect',
          name: seriesName
        })
      }
    },

    async handleSearch () {
      if (!this.queryParams.dateRange || this.queryParams.dateRange.length !== 2) {
        this.$message.warning(this.$t('waterReport.msgPickPeriod'))
        return
      }

      if (this.reportType === 'statistics') {
        if (this.queryParams.tenantId === null || this.queryParams.tenantId === undefined) {
          this.$message.warning(this.$t('waterReport.msgPickTenant'))
          return
        }
        if (this.queryParams.tenantId === '' && this.realTenantList.length === 0) {
          this.$message.warning(this.$t('waterReport.msgNoTenantData'))
          return
        }
      } else {
        const tenantIdList = this.buildDetailTenantIdList()
        const canQueryWithoutTenantIds =
          this.isDetailQueryByTenantTypeOnly() && this.queryParams.tenantIds.length === 0
        if (tenantIdList.length === 0 && !canQueryWithoutTenantIds) {
          this.$message.warning(this.$t('waterReport.msgPickTenant'))
          return
        }
      }

      this.loading = true
      try {
        if (this.reportType === 'statistics') {
          await this.getStatisticsData()
          if (this.switchDeviceDetail) {
            await this.getDeviceDetailData()
          }
        } else {
          await this.getTenantDetailData()
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('waterReport.msgFetchFail'))
        console.error('handleSearch:', error)
      } finally {
        this.loading = false
      }
    },

    /** 统计 Tab：选具体租户传 tenantIdList；否则仅传 tenantType */
    appendStatisticsTenantParams (params) {
      if (this.queryParams.tenantId) {
        params.tenantIdList = [this.queryParams.tenantId]
      } else if (this.hasTenantTypeFilter()) {
        params.tenantType = this.queryParams.tenantType
      }
    },

    async getStatisticsData () {
      const params = {
        managerId: this.currentManagerId,
        startDate: this.queryParams.dateRange[0],
        endDate: this.queryParams.dateRange[1],
        dataType: 2,
        useType: 0
      }
      this.appendStatisticsTenantParams(params)
      const { data } = await queryTenantWaterUseStatis(params)

      // 原始数据
      const originalData = data || []

      // 图表数据: 保持正序(时间从早到晚,用于图表展示)
      this.chartData = [...originalData].sort((a, b) => {
        return new Date(a.occurDate) - new Date(b.occurDate)
      })

      // 表格数据: 倒序(最新日期在前,用于表格展示)
      this.tableData = [...originalData].sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate)
      })

      this.$nextTick(() => {
        this.initializeMainChart()
        this.updateCharts()
      })
    },

    async getDeviceDetailData () {
      const params = {
        managerId: this.currentManagerId,
        startDate: this.queryParams.dateRange[0],
        endDate: this.queryParams.dateRange[1],
        dataType: 2,
        useType: 0
      }
      this.appendStatisticsTenantParams(params)
      const { data } = await queryTenantWaterUseStatis(params)

      // 先对原始数据按日期倒序排序
      const sortedData = (data || []).sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate)
      })

      const detailArray = []
      if (sortedData && sortedData.length > 0) {
        sortedData.forEach(item => {
          if (item.deviceUseDtoList && item.deviceUseDtoList.length > 0) {
            const baseObj = {
              occurDate: item.occurDate,
              useAmount: item.useAmount,
              waterUse: item.waterUse
            }
            item.deviceUseDtoList.forEach((device, idx) => {
              detailArray.push({
                ...baseObj,
                col: idx === 0 ? item.deviceUseDtoList.length : 0,
                deviceUseDtoList: device
              })
            })
          } else {
            detailArray.push({
              occurDate: item.occurDate,
              useAmount: item.useAmount,
              waterUse: item.waterUse,
              col: 1,
              deviceUseDtoList: {}
            })
          }
        })
      }
      this.deviceDetailData = detailArray
    },

    async getTenantDetailData () {
      const params = {
        managerId: this.currentManagerId,
        startDate: this.queryParams.dateRange[0],
        endDate: this.queryParams.dateRange[1],
        dataType: 1,
        useType: 0
      }
      this.appendDetailTenantParams(params)
      const { data } = await queryTenantWaterUse(params)
      this.tenantDetailData = data || []
    },

    /** 租户类型、租户选择二选一 */
    hasTenantTypeFilter () {
      const t = this.queryParams.tenantType
      return t === 0 || t === 1 || t === 2
    },

    getTenantListTenantType () {
      return this.hasTenantTypeFilter() ? this.queryParams.tenantType : 0
    },

    clearTenantType () {
      this.queryParams.tenantType = null
    },

    resetTenantTypeDefault () {
      this.queryParams.tenantType = 0
    },

    isDetailQueryByTenantTypeOnly () {
      return this.queryParams.tenantIds.length === 0 && this.hasTenantTypeFilter()
    },

    buildDetailTenantIdList () {
      if (this.queryParams.tenantIds.length > 0) {
        return [...this.queryParams.tenantIds]
      }
      return []
    },

    appendDetailTenantParams (params) {
      const tenantIdList = this.buildDetailTenantIdList()
      if (tenantIdList.length > 0) {
        params.tenantIdList = tenantIdList
      } else if (this.hasTenantTypeFilter()) {
        params.tenantType = this.queryParams.tenantType
      }
    },

    initDetailTenantQueryMode () {
      this.clearDetailTenants()
      if (!this.hasTenantTypeFilter()) {
        this.resetTenantTypeDefault()
      }
    },

    selectAllDetailTenants () {
      this.queryParams.tenantIds = this.realTenantList.map(item => item.tenantId)
    },

    clearDetailTenants () {
      this.queryParams.tenantIds = []
    },

    clearDetailTableData () {
      this.tenantDetailData = []
    },

    handleTenantChange (tenantId) {
      if (tenantId) {
        this.clearTenantType()
      } else {
        this.resetTenantTypeDefault()
      }
      this.handleSearch()
    },

    handleDetailTenantChange (val) {
      if (!Array.isArray(val)) return
      if (val.includes(TENANT_SELECT_CLEAR_ALL)) {
        this.clearDetailTenants()
        this.resetTenantTypeDefault()
        this.clearDetailTableData()
        return
      }
      if (val.includes(TENANT_SELECT_SELECT_ALL)) {
        this.selectAllDetailTenants()
        this.clearTenantType()
        this.handleSearch()
        return
      }
      this.queryParams.tenantIds = val.filter(
        (id) => id !== TENANT_SELECT_CLEAR_ALL && id !== TENANT_SELECT_SELECT_ALL
      )
      this.clearTenantType()
      this.handleSearch()
    },

    async handleTenantTypeChange () {
      this.queryParams.tenantId = ''
      this.clearDetailTenants()
      await this.getTenantList()
      this.handleSearch()
    },

    async handleReset () {
      this.setDefaultDateRange()
      this.switchDeviceDetail = false
      this.queryParams.tenantType = 0
      this.queryParams.tenantId = ''
      await this.getTenantList()
      if (this.reportType === 'detail') {
        this.initDetailTenantQueryMode()
        this.handleSearch()
      } else {
        this.clearDetailTenants()
        this.handleSearch()
      }
    },

    handleExport () {
      if (this.reportType === 'statistics') {
        if (!this.switchDeviceDetail && (!this.tableData || this.tableData.length === 0)) {
          this.$message.warning(this.$t('waterReport.msgExportEmpty'))
          return
        }
        if (this.switchDeviceDetail && (!this.deviceDetailData || this.deviceDetailData.length === 0)) {
          this.$message.warning(this.$t('waterReport.msgExportEmptyDevice'))
          return
        }
      } else {
        if (!this.tenantDetailData || this.tenantDetailData.length === 0) {
          this.$message.warning(this.$t('waterReport.msgExportEmpty'))
          return
        }
      }

      this.exportLoading = true

      setTimeout(() => {
        try {
          if (this.reportType === 'statistics') {
            if (this.switchDeviceDetail) {
              this.exportStatisticsDeviceDetail()
            } else {
              this.exportStatisticsNormal()
            }
          } else {
            this.exportDetailNormal()
          }

          this.$message.success(this.$t('waterReport.msgExportOk'))
        } catch (error) {
          console.error('export:', error)
          this.$message.error(
            `${this.$t('waterReport.msgExportFail')}: ${error.message || this.$t('waterReport.msgExportRetry')}`
          )
        } finally {
          this.exportLoading = false
        }
      }, 100)
    },

    exportStatisticsNormal () {
      const tenant = this.tenantList.find(t => t.tenantId === this.queryParams.tenantId)
      const tenantName = tenant ? this.$displayBizHybrid(tenant.name) : this.queryParams.tenantId

      const filterRow = [
        this.$t('waterReport.expFilterTime', {
          start: this.queryParams.dateRange[0],
          end: this.queryParams.dateRange[1]
        }),
        this.$t('waterReport.expFilterTenant', { tenant: tenantName })
      ]

      const headers = [
        this.$t('waterReport.expColDate'),
        this.$t('waterReport.expColWaterFee'),
        this.$t('waterReport.expColWaterVolume')
      ]

      const dataRows = this.tableData.map(row => [
        row.occurDate || '',
        this.formatExportNumber(row.useAmount),
        this.formatExportNumber(row.waterUse)
      ])

      const totalRow = [
        this.$t('waterReport.summaryTotal'),
        this.formatExportNumber(this.totalStats.amount),
        this.formatExportNumber(this.totalStats.water)
      ]

      const wsData = [filterRow, [], headers, ...dataRows, totalRow]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }]

      const wb = XLSX.utils.book_new()
      const sheet = this.$t('waterReport.expSheetStat')
      XLSX.utils.book_append_sheet(wb, ws, sheet)

      const fileName = this.generateFileName(sheet)
      XLSX.writeFile(wb, fileName)
    },

    exportStatisticsDeviceDetail () {
      const tenant = this.tenantList.find(t => t.tenantId === this.queryParams.tenantId)
      const tenantName = tenant ? this.$displayBizHybrid(tenant.name) : this.queryParams.tenantId

      const filterRow = [
        `${this.$t('waterReport.expFilterTime', {
          start: this.queryParams.dateRange[0],
          end: this.queryParams.dateRange[1]
        })}  |  ${this.$t('waterReport.expFilterTenant', { tenant: tenantName })}  |  ${this.$t(
          'waterReport.expFilterDeviceDetail'
        )}`
      ]

      const header1 = [
        this.$t('waterReport.expColDate'),
        this.$t('waterReport.expColWaterFee'),
        this.$t('waterReport.expColWaterVolume'),
        this.$t('waterReport.expColDevice'),
        this.$t('waterReport.expColSettleWay'),
        this.$t('waterReport.expColFee'),
        this.$t('waterReport.expColWaterVolume'),
        this.$t('waterReport.colStartReading'),
        '',
        this.$t('waterReport.colEndReading'),
        ''
      ]

      const header2 = [
        '', '', '',
        '', '', '', '',
        this.$t('waterReport.colTime'),
        this.$t('waterReport.colCumulativeRead'),
        this.$t('waterReport.colTime'),
        this.$t('waterReport.colCumulativeRead')
      ]

      if (!this.deviceDetailData || this.deviceDetailData.length === 0) {
        throw new Error(this.$t('waterReport.errNoDeviceExport'))
      }

      const dateGroups = {}
      this.deviceDetailData.forEach(row => {
        const date = row.occurDate
        if (!dateGroups[date]) {
          dateGroups[date] = {
            summary: {
              occurDate: date,
              useAmount: row.useAmount,
              waterUse: row.waterUse
            },
            devices: []
          }
        }
        if (row.deviceUseDtoList && Object.keys(row.deviceUseDtoList).length > 0) {
          dateGroups[date].devices.push(row.deviceUseDtoList)
        }
      })

      const dataRows = []
      Object.keys(dateGroups).sort().forEach(date => {
        const group = dateGroups[date]
        const deviceCount = group.devices.length

        if (deviceCount === 0) {
          dataRows.push([
            group.summary.occurDate,
            this.formatExportNumber(group.summary.useAmount),
            this.formatExportNumber(group.summary.waterUse),
            '', '', '', '', '', '', '', ''
          ])
        } else {
          group.devices.forEach((device, idx) => {
            if (idx === 0) {
              dataRows.push([
                group.summary.occurDate,
                this.formatExportNumber(group.summary.useAmount),
                this.formatExportNumber(group.summary.waterUse),
                this.$displayBizHybrid(device.waterName) || '',
                this.getSettleWayLabel(device.settleWay) || '',
                this.formatExportNumber(device.balance),
                this.formatExportNumber(device.consumption),
                device.startTime || '',
                this.formatExportNumber(device.startRead),
                device.endTime || '',
                this.formatExportNumber(device.endRead)
              ])
            } else {
              dataRows.push([
                '', '', '',
                this.$displayBizHybrid(device.waterName) || '',
                this.getSettleWayLabel(device.settleWay) || '',
                this.formatExportNumber(device.balance),
                this.formatExportNumber(device.consumption),
                device.startTime || '',
                this.formatExportNumber(device.startRead),
                device.endTime || '',
                this.formatExportNumber(device.endRead)
              ])
            }
          })
        }
      })

      const totalRow = [
        this.$t('waterReport.summaryTotal'),
        this.formatExportNumber(this.totalStats.amount),
        this.formatExportNumber(this.totalStats.water)
      ]
      while (totalRow.length < 11) {
        totalRow.push('')
      }

      const wsData = [filterRow, [], header1, header2, ...dataRows, totalRow]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      ws['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 12 },
        { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 18 }, { wch: 12 },
        { wch: 18 }, { wch: 12 }
      ]

      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
        { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
        { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
        { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
        { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } },
        { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } },
        { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } },
        { s: { r: 2, c: 7 }, e: { r: 2, c: 8 } },
        { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } }
      ]

      let currentRow = 4
      Object.keys(dateGroups).sort().forEach(date => {
        const group = dateGroups[date]
        const deviceCount = group.devices.length

        if (deviceCount > 1) {
          for (let col = 0; col <= 2; col++) {
            merges.push({
              s: { r: currentRow, c: col },
              e: { r: currentRow + deviceCount - 1, c: col }
            })
          }
        }

        currentRow += deviceCount > 0 ? deviceCount : 1
      })

      ws['!merges'] = merges

      const wb = XLSX.utils.book_new()
      const sheet = this.$t('waterReport.expSheetStatDevice')
      XLSX.utils.book_append_sheet(wb, ws, sheet)

      const fileName = this.generateFileName(sheet)
      XLSX.writeFile(wb, fileName)
    },

    exportDetailNormal () {
      const selectedTenants = this.tenantList
        .filter(t => this.queryParams.tenantIds.includes(t.tenantId))
        .map(t => this.$displayBizHybrid(t.name))
        .join(this.$t('waterReport.listSep'))

      const filterRow = [
        this.$t('waterReport.expFilterTime', {
          start: this.queryParams.dateRange[0],
          end: this.queryParams.dateRange[1]
        }),
        this.$t('waterReport.expFilterTenant', {
          tenant: selectedTenants || this.$t('waterReport.tenantAll')
        })
      ]

      const headers = [
        this.$t('waterReport.expColTenantId'),
        this.$t('waterReport.expColTenantName'),
        this.$t('waterReport.expColRegion'),
        this.$t('waterReport.colWaterFeeParen'),
        this.$t('waterReport.colWaterVolumeParen')
      ]

      const dataRows = this.tenantDetailData.map(row => [
        row.tenantId !== -1 ? row.tenantId : this.$t('waterReport.summaryTotal'),
        this.$displayBizHybrid(row.tenantName) || '',
        row.labelNames && row.labelNames.length ? row.labelNames[0] : '',
        this.formatExportNumber(row.useAmount),
        this.formatExportNumber(row.waterUse)
      ])

      const wsData = [filterRow, [], headers, ...dataRows]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      ws['!cols'] = [
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ]

      const wb = XLSX.utils.book_new()
      const sheet = this.$t('waterReport.expSheetDetail')
      XLSX.utils.book_append_sheet(wb, ws, sheet)

      const fileName = this.generateFileName(sheet)
      XLSX.writeFile(wb, fileName)
    },

    generateFileName (prefix) {
      const now = new Date()
      const timeStr =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')

      return `${prefix}_${timeStr}.xlsx`
    },

    formatExportNumber (num) {
      if (num === undefined || num === null || num === '' || num === '-') {
        return 0
      }

      const numValue = typeof num === 'string' ? parseFloat(num) : num

      if (isNaN(numValue)) {
        return 0
      }

      return numValue
    },

    handleSwitchChange () {
      if (this.switchDeviceDetail && !this.queryParams.tenantId) {
        if (this.realTenantList.length > 0) {
          this.queryParams.tenantId = this.realTenantList[0].tenantId
          this.clearTenantType()
          this.$message.info(this.$t('waterReport.msgDeviceAutoTenant'))
        } else {
          this.$message.warning(this.$t('waterReport.msgNoTenantAvailable'))
          this.switchDeviceDetail = false
          return
        }
      }
      this.handleSearch()
    },

    tableRowClassName ({ row }) {
      if (row.tenantId === -1) {
        return 'total-row'
      }
      return ''
    },

    deviceDetailSpanMethod ({ row, columnIndex }) {
      if (columnIndex < 3) {
        return {
          rowspan: row.col,
          colspan: row.col > 0 ? 1 : 0
        }
      }
    },

    getStatisticsSummaries (param) {
      const { columns, data } = param
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = this.$t('waterReport.summaryTotal')
          return
        }
        const values = data.map(item => Number(item[column.property]))
        if (!values.every(value => isNaN(value))) {
          sums[index] = values
            .reduce((prev, curr) => {
              const value = Number(curr)
              if (!isNaN(value)) {
                return prev + curr
              }
              return prev
            }, 0)
            .toFixed(2)
        } else {
          sums[index] = ''
        }
      })
      return sums
    },

    getDeviceDetailSummaries (param) {
      const { columns, data } = param
      const sums = []
      const uniqueData = []
      const dateSet = []
      data.forEach(item => {
        if (dateSet.indexOf(item.occurDate) === -1) {
          uniqueData.push(item)
          dateSet.push(item.occurDate)
        }
      })
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = this.$t('waterReport.summaryTotal')
          return
        }
        const values = uniqueData.map(item => Number(item[column.property]))
        if (!values.every(value => isNaN(value))) {
          sums[index] = values
            .reduce((prev, curr) => {
              const value = Number(curr)
              if (!isNaN(value)) {
                return prev + curr
              }
              return prev
            }, 0)
            .toFixed(2)
        } else {
          sums[index] = ''
        }
      })
      return sums
    },

    initializeMainChart () {
      if (!this.$refs.mainChartContainer) return
      if (this.mainChartInstance) {
        this.mainChartInstance.dispose()
      }
      this.mainChartInstance = this.$echarts.init(this.$refs.mainChartContainer)
    },

    updateCharts () {
      this.updateMainChart()
    },

    updateMainChart () {
      if (!this.mainChartInstance || this.chartData.length === 0) return
      const xAxisData = this.chartData.map(item => moment(item.occurDate).format('MM-DD'))
      const option = {
        color: ['#52c41a', '#5b9bd5'],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e8e8e8',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: { color: '#333', fontSize: 14 },
          axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
          formatter: params => {
            const feeName = this.chartSeriesNames.totalFee
            const unitYuan = this.$t('waterReport.unitYuan')
            let html = `<div style="font-weight: 500; margin-bottom: 8px">${params[0].name}</div>`
            params.forEach(item => {
              const suffix =
                item.seriesName === feeName ? ` ${unitYuan}` : ' m³'
              html += `<div style="display: flex; align-items: center; margin-bottom: 4px">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${item.color
                }; border-radius: 50%; margin-right: 8px"></span>
                <span style="flex: 1">${item.seriesName}</span>
                <span style="font-weight: 500">${this.formatNumber(item.value)}${suffix}</span>
              </div>`
            })
            return html
          }
        },
        legend: {
          data: [this.chartSeriesNames.totalFee, this.chartSeriesNames.totalWater],
          bottom: 35,
          itemGap: 20,
          textStyle: { color: '#666' }
        },
        grid: { top: 30, left: 50, right: 50, bottom: 75, containLabel: true },
        dataZoom: [
          { type: 'inside', start: 0, end: 100 }, // ← 改为 0-100
          {
            type: 'slider',
            start: 0, // ← 改为 0
            end: 100,
            height: 8,
            bottom: 5,
            borderColor: 'transparent',
            backgroundColor: '#f0f0f0',
            handleSize: 14,
            showDetail: false,
            showDataShadow: false,
            fillerColor: 'rgba(24, 144, 255, 0.15)'
          }
        ],
        xAxis: {
          type: 'category',
          data: xAxisData,
          boundaryGap: true,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          axisLabel: { color: '#666', fontSize: 12 }
        },
        yAxis: [
          {
            type: 'value',
            name: this.$t('waterReport.yAxisWaterFee'),
            nameTextStyle: { color: '#666', padding: [0, 0, 0, 20] },
            splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              color: '#666',
              fontSize: 12,
              formatter: v => (v >= 1000 ? v / 1000 + 'k' : v)
            }
          },
          {
            type: 'value',
            name: this.$t('waterReport.yAxisWaterVolume'),
            nameTextStyle: { color: '#666', padding: [0, 20, 0, 0] },
            splitLine: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              color: '#666',
              fontSize: 12,
              formatter: v => (v >= 1000 ? v / 1000 + 'k' : v)
            }
          }
        ],
        series: [
          {
            name: this.chartSeriesNames.totalFee,
            type: 'line',
            data: this.chartData.map(item => item.useAmount),
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.3,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                  { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
                ]
              }
            }
          },
          {
            name: this.chartSeriesNames.totalWater,
            type: 'bar',
            yAxisIndex: 1,
            data: this.chartData.map(item => item.waterUse),
            barMaxWidth: 18,
            itemStyle: {
              color: 'rgba(135, 206, 235, 0.65)',
              borderRadius: [2, 2, 0, 0]
            }
          }
        ]
      }
      this.mainChartInstance.setOption(option)
    },

    handleResize () {
      this.$nextTick(() => {
        if (this.mainChartInstance) this.mainChartInstance.resize()
      })
    },

    formatNumber (num) {
      if (num === undefined || num === null) return '-'
      if (num === 0) return '0.00'
      return Number(num).toFixed(2)
    },

    getSettleWayLabel (settleWay) {
      if (settleWay === undefined || settleWay === null) return ''
      const key = `settleWay${settleWay}`
      return this.$te(`waterReport.${key}`) ? this.$t(`waterReport.${key}`) : ''
    }
  }
}
</script>

<style lang="scss" scoped>
.water-dashboard {
  min-height: 100vh;
  padding: 16px;
  background: #f5f7fa;
}

// 顶部操作栏
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tab-switcher {
  display: flex;
  gap: 8px;
  margin: 0 20px;
}

.tab-btn {
  padding: 8px 20px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;

  &:hover {
    color: #1890ff;
    border-color: #1890ff;
  }

  &.active {
    color: #fff;
    background: #1890ff;
    border-color: #1890ff;
  }
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    background: #93c5fd;
    cursor: not-allowed;
    opacity: 0.7;
  }
}

// 筛选器
.filter-container {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
  display: flex;
  align-items: flex-end;
  gap: 24px;
}

.filter-item {
  flex: 1;

  &.date-filter {
    max-width: 320px;
  }

  &.tenant-filter,
  &.tenant-type-filter {
    max-width: 360px;
  }
}

::v-deep .tenant-select-action-option {
  color: #409eff;
  font-weight: 500;

  &.tenant-select-action-option--clear {
    border-bottom: 1px solid #ebeef5;
  }
}

.filter-label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-btn,
.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.search-btn {
  background: #3b82f6;
  color: white;

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }
}

.reset-btn {
  background: #f3f4f6;
  color: #6b7280;

  &:hover:not(:disabled) {
    background: #e5e7eb;
    color: #374151;
  }
}

.detail-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 12px;
  border-left: 1px solid #e5e7eb;
}

.switch-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

.detail-switch.is-disabled .switch-text {
  cursor: not-allowed;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked+.toggle-slider {
      background-color: #3b82f6;

      &:before {
        transform: translateX(20px);
      }
    }

    &:disabled+.toggle-slider {
      background-color: #e5e7eb;
      cursor: not-allowed;

      &:before {
        background-color: #d1d5db;
      }
    }
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 12px;

  &:before {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
}

// 统计卡片
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;

  .unit {
    font-size: 14px;
    color: #6b7280;
    font-weight: 400;
  }
}

// 主内容区
.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

// 图表区域
.chart-section {
  padding: 0;
  border-bottom: 1px solid #f3f4f6;
}

.chart-container-full {
  padding: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.chart-date-range {
  font-size: 13px;
  color: #999;
}

.chart-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-legends {
  display: flex;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  cursor: pointer;

  &.active {
    color: #333;
    font-weight: 500;
  }
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-text {
  user-select: none;
}

.chart-summary {
  display: flex;
  gap: 40px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-label {
  font-size: 13px;
  color: #999;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.main-chart {
  height: 450px;
  width: 100%;
}

// 表格区域
.table-section {
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

// 空状态
.empty-state {
  padding: 80px 0;
  text-align: center;

  svg {
    width: 64px;
    height: 64px;
    color: #e5e7eb;
    margin-bottom: 16px;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }
}

/* 标签样式 */
.label-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.label-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 2px;
  font-size: 12px;
  color: #666;
}

// Element UI 样式覆盖
::v-deep .custom-date-picker {
  width: 100%;

  .el-input__inner {
    height: 40px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;

    &:hover {
      border-color: #d1d5db;
    }

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

::v-deep .custom-select {
  width: 100%;

  .el-input__inner {
    height: 40px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;

    &:hover {
      border-color: #d1d5db;
    }

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  .el-tag {
    background: #eff6ff;
    color: #3b82f6;
    border: none;
  }
}

/* Element UI 表格样式覆盖 */
::v-deep .el-table {
  .total-row {
    position: sticky;
    bottom: 0;
    background: #fafafa;
    font-weight: 600;
    z-index: 2;

    td {
      background: #fafafa !important;
    }
  }

  th {
    background: #fafafa;
    color: #333;
    font-weight: 600;
  }

  .cell {
    padding: 0 12px;
  }
}

// 响应式设计
@media (max-width: 1280px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .water-dashboard {
    padding: 12px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
  }

  .tab-switcher {
    margin: 0;
  }

  .filter-container {
    flex-direction: column;
    gap: 16px;
  }

  .filter-item {
    max-width: 100% !important;
  }

  .filter-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>

<style lang="scss">
// 全局样式：自定义日期选择器
.elegant-date-picker {
  .el-picker-panel__sidebar {
    width: 115px !important;
    padding: 12px 8px !important;
    background: #fafafa !important;
    border: none !important;
    border-right: 1px solid #e8e8e8 !important;
  }

  .el-picker-panel__shortcut {
    display: block !important;
    width: 100% !important;
    padding: 9px 8px !important;
    margin-bottom: 6px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #606266 !important;
    text-align: center !important;
    line-height: 1.4 !important;
    background: #ffffff !important;
    border: none !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    outline: none !important;

    &:hover {
      color: #409eff !important;
      background: #f0f7ff !important;
      box-shadow: 0 2px 6px rgba(64, 158, 255, 0.15) !important;
      transform: translateY(-1px) !important;
      border: none !important;
    }

    &:active {
      transform: translateY(0) !important;
      box-shadow: 0 1px 3px rgba(64, 158, 255, 0.1) !important;
      border: none !important;
    }

    &:focus {
      border: none !important;
      outline: none !important;
    }

    &:last-child {
      margin-bottom: 0 !important;
    }
  }

  .el-picker-panel__body {
    padding-left: 12px !important;
  }

  .el-picker-panel__shortcut,
  button.el-picker-panel__shortcut {
    border: none !important;
    border-top: none !important;
    border-right: none !important;
    border-bottom: none !important;
    border-left: none !important;
    box-sizing: border-box !important;
  }

  .el-date-table {
    td {
      padding: 5px 0 !important;

      &.available:hover {
        color: #409eff !important;
        background: #f0f7ff !important;
        border-radius: 4px !important;
      }

      &.in-range {
        background: #f5f9ff !important;
      }

      &.start-date,
      &.end-date {
        span {
          background: #409eff !important;
          color: #ffffff !important;
          border-radius: 4px !important;
        }
      }

      &.today span {
        color: #409eff !important;
        font-weight: 600 !important;
        position: relative !important;

        &::after {
          content: '' !important;
          position: absolute !important;
          bottom: 2px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 4px !important;
          height: 4px !important;
          background: #409eff !important;
          border-radius: 50% !important;
        }
      }

      &.today.start-date span,
      &.today.end-date span {
        color: #ffffff !important;

        &::after {
          background: #ffffff !important;
        }
      }
    }
  }

  .el-picker-panel__footer {
    padding: 10px 12px !important;
    background: #fafafa !important;
    border-top: 1px solid #e8e8e8 !important;

    .el-button {
      border-radius: 4px !important;
      font-weight: 500 !important;
      padding: 7px 15px !important;
      transition: all 0.2s !important;

      &.el-button--text {
        &:hover {
          background: #f0f7ff !important;
          color: #409eff !important;
        }
      }

      &.el-button--primary {
        background: #409eff !important;

        &:hover {
          background: #66b1ff !important;
        }
      }
    }
  }

  .el-picker-panel__icon-btn {
    color: #606266 !important;
    transition: all 0.2s !important;

    &:hover {
      color: #409eff !important;
    }
  }
}
</style>
