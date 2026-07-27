<template>
  <div class="energy-statistics" v-loading="loading" element-loading-text="数据加载中...">
    <!-- 顶部切换栏 -->
    <div class="stat-header">
      <div class="stat-tabs">
        <div :class="['tab-item', { active: statType === 0 }]" @click="changeStatType(0)">
          用电数据统计
        </div>
        <div :class="['tab-item', { active: statType === 1 }]" @click="changeStatType(1)">
          用水数据统计
        </div>
      </div>
      <div class="header-right">
        <el-date-picker
          v-model="queryParams.dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="yyyy-MM-dd"
          :picker-options="pickerOptions"
          class="custom-date-picker"
          size="small"
          @change="handleDateRangeChange"
        />
        <el-button type="primary" size="small" :loading="exportLoading" @click="handleExport" style="margin-left: 12px">
          <i class="el-icon-download"></i> 导出报表
        </el-button>
      </div>
    </div>

    <!-- 用电统计内容 -->
    <div v-if="statType === 0" class="electricity-content">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="detail-switch">
          <span class="switch-text">设备明细</span>
          <el-switch v-model="switchDeviceDetail" @change="handleSwitchChange" />
        </div>
      </div>

      <!-- 数据统计卡片 - 只在用电且有数据时显示 -->
      <div class="stats-cards" v-if="tableData.length > 0">
        <div class="stat-card">
          <div class="card-header">电费统计</div>
          <div class="card-body">
            <div class="main-stat">
              <div class="value">{{ formatNumber(totalStats.amount) }}</div>
              <div class="label">总电费(元)</div>
            </div>
            <div class="divider">=</div>
            <div class="sub-stats">
              <div class="sub-stat">
                <div class="value">{{ formatNumber(totalStats.meterBalance) }}</div>
                <div class="label">室内电费</div>
              </div>
              <div class="plus">+</div>
              <div class="sub-stat">
                <div class="value">{{ formatNumber(totalStats.airBalance) }}</div>
                <div class="label">空调电费</div>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="card-header">电量统计</div>
          <div class="card-body">
            <div class="main-stat">
              <div class="value">{{ formatNumber(totalStats.elec) }}</div>
              <div class="label">总电量(度)</div>
            </div>
            <div class="divider">=</div>
            <div class="sub-stats">
              <div class="sub-stat">
                <div class="value">{{ formatNumber(totalStats.elecPeak) }}</div>
                <div class="label">尖</div>
              </div>
              <div class="plus">+</div>
              <div class="sub-stat">
                <div class="value">{{ formatNumber(totalStats.elecTop) }}</div>
                <div class="label">峰</div>
              </div>
              <div class="plus">+</div>
              <div class="sub-stat">
                <div class="value">{{ formatNumber(totalStats.elecFlat) }}</div>
                <div class="label">平</div>
              </div>
              <div class="plus">+</div>
              <div class="sub-stat">
                <div class="value">{{ formatNumber(totalStats.elecValley) }}</div>
                <div class="label">谷</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 - 用电 -->
      <div class="chart-wrapper" v-if="chartData.length > 0">
        <div class="chart-header-bar">
          <div class="chart-title-section">
            <h3 class="chart-main-title">用电趋势分析</h3>
            <span class="chart-date-info">{{ formatDateRange }}</span>
          </div>
          <div class="chart-summary-section">
            <div class="summary-item">
              <span class="summary-label">总电费</span>
              <span class="summary-value">¥{{ formatNumber(totalStats.amount) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">室内电量</span>
              <span class="summary-value">{{ formatNumber(totalStats.meterUseElec) }} 度</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">空调电量</span>
              <span class="summary-value">{{ formatNumber(totalStats.airUseElec) }} 度</span>
            </div>
          </div>
        </div>
        <div ref="chartRef" class="chart-box"></div>
      </div>
      <el-empty v-else description="暂无数据" />

      <!-- 详细数据表格 -->
      <div class="table-wrapper">
        <div class="table-header">
          <div class="title">详细数据</div>
          <el-button v-if="tableData.length > 0" size="small" @click="openFullscreen">
            <i class="el-icon-full-screen"></i> 全屏查看
          </el-button>
        </div>

        <el-table
          v-show="!switchDeviceDetail"
          v-if="tableData.length > 0"
          :data="tableData"
          show-summary
          :summary-method="getStatisticsSummaries"
          max-height="500"
        >
          <el-table-column min-width="140" label="日期" prop="occurDate" />
          <el-table-column min-width="140" label="总电费（元）" prop="useAmount" align="right" />
          <el-table-column min-width="140" label="室内电费（元）" prop="meterBalance" align="right" />
          <el-table-column min-width="140" label="空调电费（元）" prop="airBalance" align="right" />
          <el-table-column min-width="140" label="总电量（度）" prop="useElec" align="right" />
          <el-table-column
            v-if="airSysElecColsVisible"
            min-width="140"
            label="系统总电量（度）"
            prop="sysElec"
            align="right"
          />
          <el-table-column min-width="140" label="室内电量（度）" prop="meterUseElec" align="right" />
          <el-table-column min-width="140" label="空调电量（度）" prop="airUseElec" align="right" />
          <el-table-column
            v-if="airSysElecColsVisible"
            min-width="150"
            label="空调系统电量（度）"
            prop="airSysElec"
            align="right"
          />
          <el-table-column min-width="140" label="尖电量（度）" prop="useElecPeak" align="right" />
          <el-table-column min-width="140" label="峰电量（度）" prop="useElecTop" align="right" />
          <el-table-column min-width="140" label="平电量（度）" prop="useElecFlat" align="right" />
          <el-table-column min-width="140" label="谷电量（度）" prop="useElecValley" align="right" />
        </el-table>

        <el-table
          v-show="switchDeviceDetail"
          v-if="deviceDetailData.length > 0"
          :data="deviceDetailData"
          :span-method="deviceDetailSpanMethod"
          :summary-method="getDeviceDetailSummaries"
          show-summary
          max-height="500"
        >
          <el-table-column min-width="140" label="日期" prop="occurDate" />
          <el-table-column min-width="120" label="电费（元）" prop="useAmount" align="right" />
          <el-table-column min-width="120" label="室内电费（元）" prop="meterBalance" align="right" />
          <el-table-column min-width="120" label="空调电费（元）" prop="airBalance" align="right" />
          <el-table-column min-width="120" label="总电量（度）" prop="useElec" align="right" />
          <el-table-column
            v-if="airSysElecColsVisible"
            min-width="120"
            label="系统总电量（度）"
            prop="sysElec"
            align="right"
          />
          <el-table-column min-width="120" label="室内电量（度）" prop="meterUseElec" align="right" />
          <el-table-column min-width="120" label="空调电量（度）" prop="airUseElec" align="right" />
          <el-table-column
            v-if="airSysElecColsVisible"
            min-width="130"
            label="空调系统电量（度）"
            prop="airSysElec"
            align="right"
          />
          <el-table-column min-width="120" label="尖电量（度）" prop="useElecPeak" align="right" />
          <el-table-column min-width="120" label="峰电量（度）" prop="useElecTop" align="right" />
          <el-table-column min-width="120" label="平电量（度）" prop="useElecFlat" align="right" />
          <el-table-column min-width="120" label="谷电量（度）" prop="useElecValley" align="right" />
          <el-table-column label="设备" width="160">
            <template slot-scope="scope">{{ scope.row.deviceUseDtoList.meterName || "-" }}</template>
          </el-table-column>
          <el-table-column label="结算方式" width="120">
            <template slot-scope="scope">{{ getSettleWayLabel(scope.row.deviceUseDtoList.settleWay) }}</template>
          </el-table-column>
          <el-table-column label="费用" width="120" align="right">
            <template slot-scope="scope">{{ scope.row.deviceUseDtoList.useAmount || "-" }}</template>
          </el-table-column>
          <el-table-column label="电量" align="center">
            <el-table-column label="总计" width="100" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.useElec || "-" }}</template>
            </el-table-column>
            <el-table-column label="尖" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.useElecPeak || "-" }}</template>
            </el-table-column>
            <el-table-column label="峰" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.useElecTop || "-" }}</template>
            </el-table-column>
            <el-table-column label="平" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.useElecFlat || "-" }}</template>
            </el-table-column>
            <el-table-column label="谷" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.useElecValley || "-" }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="起始读数" align="center">
            <el-table-column label="时间" width="160">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.startUseDto?.occurTime || "-" }}</template>
            </el-table-column>
            <el-table-column label="总电量" width="100" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.startUseDto?.powerAll || "-" }}</template>
            </el-table-column>
            <el-table-column label="尖" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.startUseDto?.powerPeak || "-" }}</template>
            </el-table-column>
            <el-table-column label="峰" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.startUseDto?.powerTop || "-" }}</template>
            </el-table-column>
            <el-table-column label="平" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.startUseDto?.powerFlat || "-" }}</template>
            </el-table-column>
            <el-table-column label="谷" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.startUseDto?.powerValley || "-" }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="截止读数" align="center">
            <el-table-column label="时间" width="160">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.stopUseDto?.occurTime || "-" }}</template>
            </el-table-column>
            <el-table-column label="总电量" width="100" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.stopUseDto?.powerAll || "-" }}</template>
            </el-table-column>
            <el-table-column label="尖" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.stopUseDto?.powerPeak || "-" }}</template>
            </el-table-column>
            <el-table-column label="峰" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.stopUseDto?.powerTop || "-" }}</template>
            </el-table-column>
            <el-table-column label="平" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.stopUseDto?.powerFlat || "-" }}</template>
            </el-table-column>
            <el-table-column label="谷" width="80" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.stopUseDto?.powerValley || "-" }}</template>
            </el-table-column>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading && tableData.length === 0" description="暂无数据" />
      </div>
    </div>

    <!-- 用水统计内容 -->
    <div v-if="statType === 1" class="water-content">
      <div class="filter-bar">
        <div class="detail-switch">
          <span class="switch-text">设备明细</span>
          <el-switch v-model="switchDeviceDetail" @change="handleSwitchChange" />
        </div>
      </div>

      <!-- 图表区域 - 用水 -->
      <div class="chart-wrapper" v-if="chartData.length > 0">
        <div class="chart-header-bar">
          <div class="chart-title-section">
            <h3 class="chart-main-title">用水趋势分析</h3>
            <span class="chart-date-info">{{ formatDateRange }}</span>
          </div>
          <div class="chart-summary-section">
            <div class="summary-item">
              <span class="summary-label">总水费</span>
              <span class="summary-value">¥{{ formatNumber(totalWaterStats.amount) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">总水量</span>
              <span class="summary-value">{{ formatNumber(totalWaterStats.water) }} m³</span>
            </div>
          </div>
        </div>
        <div ref="chartRef" class="chart-box"></div>
      </div>
      <el-empty v-else description="暂无数据" />

      <div class="table-wrapper">
        <div class="table-header">
          <div class="title">详细数据</div>
        </div>

        <el-table
          v-show="!switchDeviceDetail"
          v-if="tableData.length > 0"
          :data="tableData"
          show-summary
          :summary-method="getStatisticsSummaries"
          height="500px"
        >
          <el-table-column min-width="140" label="日期" prop="occurDate" />
          <el-table-column min-width="140" label="水费（元）" prop="useAmount" align="right" />
          <el-table-column min-width="140" label="水量（m³）" prop="waterUse" align="right" />
        </el-table>

        <el-table
          v-show="switchDeviceDetail"
          v-if="deviceDetailData.length > 0"
          :data="deviceDetailData"
          :span-method="deviceDetailSpanMethod"
          :summary-method="getDeviceDetailSummaries"
          show-summary
          height="500px"
        >
          <el-table-column min-width="140" label="日期" prop="occurDate" />
          <el-table-column min-width="120" label="水费（元）" prop="useAmount" align="right" />
          <el-table-column min-width="120" label="水量（m³）" prop="waterUse" align="right" />
          <el-table-column label="设备" width="160">
            <template slot-scope="scope">{{ scope.row.deviceUseDtoList.waterName || "-" }}</template>
          </el-table-column>
          <el-table-column label="结算方式" width="120">
            <template slot-scope="scope">{{ getSettleWayLabel(scope.row.deviceUseDtoList.settleWay) }}</template>
          </el-table-column>
          <el-table-column label="费用" width="120" align="right">
            <template slot-scope="scope">{{ scope.row.deviceUseDtoList.balance || "-" }}</template>
          </el-table-column>
          <el-table-column label="水量（m³）" width="120" align="right">
            <template slot-scope="scope">{{ scope.row.deviceUseDtoList.consumption || "-" }}</template>
          </el-table-column>
          <el-table-column label="起始读数" align="center">
            <el-table-column label="时间" width="160">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.startTime || "-" }}</template>
            </el-table-column>
            <el-table-column label="累计读数" width="120" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.startRead || "-" }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="截止读数" align="center">
            <el-table-column label="时间" width="160">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.endTime || "-" }}</template>
            </el-table-column>
            <el-table-column label="累计读数" width="120" align="right">
              <template slot-scope="scope">{{ scope.row.deviceUseDtoList.endRead || "-" }}</template>
            </el-table-column>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading && tableData.length === 0" description="暂无数据" />
      </div>
    </div>

    <table-focus-mode
      v-if="statType === 0 && currentManagerId"
      :visible="fullscreenVisible"
      :current-manager-id="currentManagerId"
      :initial-query-params="{ ...queryParams, tenantId }"
      @close="closeFullscreen"
    />
  </div>
</template>

<script>
import * as echarts from 'echarts'
import moment from 'moment'
import { mapGetters } from 'vuex'
import { useReportQueryTenantUseStatis, queryTenantWaterUseStatis } from '@/api/useReport'
import TableFocusMode from '../../energy/components/TableFocusMode.vue'
import * as XLSX from 'xlsx'

export default {
  name: 'EnergyStatistics',
  components: { TableFocusMode },
  props: {
    tenantId: { type: [String, Number], required: true }
  },
  data () {
    return {
      loading: false,
      exportLoading: false,
      statType: 0,
      switchDeviceDetail: false,
      fullscreenVisible: false,
      queryParams: { dateRange: [] },
      tableData: [],
      deviceDetailData: [],
      chartData: [],
      totalStats: {
        amount: 0,
        meterBalance: 0,
        airBalance: 0,
        elec: 0,
        meterUseElec: 0,
        airUseElec: 0,
        elecPeak: 0,
        elecTop: 0,
        elecFlat: 0,
        elecValley: 0,
        sysElec: 0,
        airSysElec: 0
      },
      totalWaterStats: { amount: 0, water: 0 },
      chartInstance: null,
      pickerOptions: {
        shortcuts: [
          {
            text: '昨天',
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
            text: '本周',
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
            text: '上周',
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
            text: '本月',
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
            text: '上月',
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
            text: '近三个月',
            onClick (picker) {
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              const start = new Date()
              start.setMonth(start.getMonth() - 3)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          }
        ],
        disabledDate (time) {
          return time.getTime() > Date.now()
        }
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId', 'isAirSysElecManager']),

    /** 系统总电量 / 空调系统电量列：与用电报表、getAirSysElecCoefKeys 白名单一致 */
    airSysElecColsVisible () {
      return this.isAirSysElecManager(this.currentManagerId)
    },

    formatDateRange () {
      if (this.queryParams.dateRange && this.queryParams.dateRange.length === 2) {
        return `${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}`
      }
      return ''
    }
  },
  watch: {
    tenantId: {
      handler (val) {
        if (val) this.handleSearch()
      },
      immediate: true
    }
  },
  mounted () {
    this.setDefaultDateRange()
    if (this.tenantId) {
      this.handleSearch()
    }
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
    }
  },
  methods: {
    setDefaultDateRange () {
      this.queryParams.dateRange = [moment().subtract(30, 'days').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')]
    },

    changeStatType (type) {
      if (type !== this.statType) {
        this.statType = type
        this.switchDeviceDetail = false

        // 清空所有数据
        this.tableData = []
        this.deviceDetailData = []
        this.chartData = []
        this.totalStats = {
          amount: 0,
          meterBalance: 0,
          airBalance: 0,
          elec: 0,
          meterUseElec: 0,
          airUseElec: 0,
          elecPeak: 0,
          elecTop: 0,
          elecFlat: 0,
          elecValley: 0,
          sysElec: 0,
          airSysElec: 0
        }
        this.totalWaterStats = { amount: 0, water: 0 }

        // 销毁旧图表
        if (this.chartInstance) {
          this.chartInstance.dispose()
          this.chartInstance = null
        }

        // 重新获取数据
        this.handleSearch()
      }
    },

    handleDateRangeChange () {
      this.handleSearch()
    },

    handleSwitchChange () {
      this.deviceDetailData = []
      this.handleSearch()
    },

    async handleSearch () {
      if (!this.tenantId) return
      if (!this.queryParams.dateRange || this.queryParams.dateRange.length !== 2) {
        this.setDefaultDateRange()
      }

      this.loading = true
      try {
        const startDate = this.queryParams.dateRange[0]
        const endDate = this.queryParams.dateRange[1]
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffDays = Math.floor((end - start) / (24 * 3600 * 1000))
        if (diffDays > 100) {
          this.$message.warning('最多只能选择100天的数据')
          this.loading = false
          return
        }

        let res
        if (this.statType === 0) {
          const params = {
            managerId: this.currentManagerId,
            startDate,
            endDate,
            dataType: 2,
            useType: 1,
            selectType: this.switchDeviceDetail ? 0 : 2,
            tenantIdList: [this.tenantId]
          }
          res = await useReportQueryTenantUseStatis(params)
        } else {
          const params = {
            managerId: this.currentManagerId,
            startDate,
            endDate,
            dataType: 2,
            useType: 0,
            tenantIdList: [this.tenantId]
          }
          res = await queryTenantWaterUseStatis(params)
        }

        const data = res.data || []
        this.chartData = [...data].sort((a, b) => new Date(a.occurDate) - new Date(b.occurDate))
        this.tableData = [...data].sort((a, b) => new Date(b.occurDate) - new Date(a.occurDate))

        if (this.switchDeviceDetail) {
          if (this.statType === 0) {
            this.processDeviceDetailData(data)
          } else {
            this.processWaterDeviceDetailData(data)
          }
        }

        if (this.statType === 0) {
          this.calculateElectricityTotals()
        } else {
          this.calculateWaterTotals()
        }

        this.$nextTick(() => {
          if (this.chartData.length > 0) {
            this.initChart()
            this.updateChart()
          }
        })
      } catch (error) {
        console.error('获取能耗数据失败:', error)
        this.$message.error('获取数据失败')
      } finally {
        this.loading = false
      }
    },

    processDeviceDetailData (data) {
      const sortedData = (data || []).sort((a, b) => new Date(b.occurDate) - new Date(a.occurDate))
      const detailArray = []
      if (sortedData && sortedData.length > 0) {
        sortedData.forEach(item => {
          if (item.deviceUseDtoList && item.deviceUseDtoList.length > 0) {
            const baseObj = {
              occurDate: item.occurDate,
              useAmount: item.useAmount,
              meterBalance: item.meterBalance,
              airBalance: item.airBalance,
              useElec: item.useElec,
              meterUseElec: item.meterUseElec,
              airUseElec: item.airUseElec,
              useElecPeak: item.useElecPeak,
              useElecTop: item.useElecTop,
              useElecFlat: item.useElecFlat,
              useElecValley: item.useElecValley,
              sysElec: item.sysElec,
              airSysElec: item.airSysElec
            }
            item.deviceUseDtoList.forEach((device, idx) => {
              detailArray.push({ ...baseObj, col: idx === 0 ? item.deviceUseDtoList.length : 0, deviceUseDtoList: device })
            })
          } else {
            detailArray.push({
              occurDate: item.occurDate,
              useAmount: item.useAmount,
              meterBalance: item.meterBalance,
              airBalance: item.airBalance,
              useElec: item.useElec,
              meterUseElec: item.meterUseElec,
              airUseElec: item.airUseElec,
              useElecPeak: item.useElecPeak,
              useElecTop: item.useElecTop,
              useElecFlat: item.useElecFlat,
              useElecValley: item.useElecValley,
              sysElec: item.sysElec,
              airSysElec: item.airSysElec,
              col: 1,
              deviceUseDtoList: {}
            })
          }
        })
      }
      this.deviceDetailData = detailArray
    },

    processWaterDeviceDetailData (data) {
      const sortedData = (data || []).sort((a, b) => new Date(b.occurDate) - new Date(a.occurDate))
      const detailArray = []
      if (sortedData && sortedData.length > 0) {
        sortedData.forEach(item => {
          if (item.deviceUseDtoList && item.deviceUseDtoList.length > 0) {
            const baseObj = { occurDate: item.occurDate, useAmount: item.useAmount, waterUse: item.waterUse }
            item.deviceUseDtoList.forEach((device, idx) => {
              detailArray.push({ ...baseObj, col: idx === 0 ? item.deviceUseDtoList.length : 0, deviceUseDtoList: device })
            })
          } else {
            detailArray.push({ occurDate: item.occurDate, useAmount: item.useAmount, waterUse: item.waterUse, col: 1, deviceUseDtoList: {} })
          }
        })
      }
      this.deviceDetailData = detailArray
    },

    calculateElectricityTotals () {
      this.totalStats = {
        amount: 0,
        meterBalance: 0,
        airBalance: 0,
        elec: 0,
        meterUseElec: 0,
        airUseElec: 0,
        elecPeak: 0,
        elecTop: 0,
        elecFlat: 0,
        elecValley: 0,
        sysElec: 0,
        airSysElec: 0
      }
      this.tableData.forEach(item => {
        this.totalStats.amount += parseFloat(item.useAmount || 0)
        this.totalStats.meterBalance += parseFloat(item.meterBalance || 0)
        this.totalStats.airBalance += parseFloat(item.airBalance || 0)
        this.totalStats.elec += parseFloat(item.useElec || 0)
        this.totalStats.meterUseElec += parseFloat(item.meterUseElec || 0)
        this.totalStats.airUseElec += parseFloat(item.airUseElec || 0)
        this.totalStats.elecPeak += parseFloat(item.useElecPeak || 0)
        this.totalStats.elecTop += parseFloat(item.useElecTop || 0)
        this.totalStats.elecFlat += parseFloat(item.useElecFlat || 0)
        this.totalStats.elecValley += parseFloat(item.useElecValley || 0)
        this.totalStats.sysElec += parseFloat(item.sysElec || 0)
        this.totalStats.airSysElec += parseFloat(item.airSysElec || 0)
      })
    },

    calculateWaterTotals () {
      this.totalWaterStats = { amount: 0, water: 0 }
      this.tableData.forEach(item => {
        this.totalWaterStats.amount += parseFloat(item.useAmount || 0)
        this.totalWaterStats.water += parseFloat(item.waterUse || 0)
      })
    },

    initChart () {
      if (!this.$refs.chartRef) return
      if (this.chartInstance) {
        this.chartInstance.dispose()
        this.chartInstance = null
      }
      this.chartInstance = echarts.init(this.$refs.chartRef)
    },

    updateChart () {
      if (!this.chartInstance || this.chartData.length === 0) return
      const xAxisData = this.chartData.map(item => moment(item.occurDate).format('MM-DD'))
      let option = {}

      if (this.statType === 0) {
        option = {
          color: ['#52c41a', '#5b9bd5', '#ff9f5a'],
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#e8e8e8',
            borderWidth: 1,
            padding: [12, 16],
            textStyle: { color: '#333', fontSize: 14 },
            axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
            formatter: params => {
              let html = `<div style="font-weight: 500; margin-bottom: 8px">${params[0].name}</div>`
              params.forEach(item => {
                const suffix = item.seriesName === '总电费' ? ' 元' : ' 度'
                html += `<div style="display: flex; align-items: center; margin-bottom: 4px">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${item.color}; border-radius: 50%; margin-right: 8px"></span>
                  <span style="flex: 1">${item.seriesName}</span>
                  <span style="font-weight: 500">${this.formatNumber(item.value)}${suffix}</span>
                </div>`
              })
              return html
            }
          },
          legend: { data: ['总电费', '室内电量', '空调电量'], bottom: 35, itemGap: 20, textStyle: { color: '#666' } },
          grid: { top: 30, left: 50, right: 50, bottom: 75, containLabel: true },
          dataZoom: [
            { type: 'inside', start: 0, end: 100 },
            { type: 'slider', start: 0, end: 100, height: 6, bottom: 5, borderColor: 'transparent', backgroundColor: '#f0f0f0', handleSize: 12, showDetail: false, showDataShadow: false, fillerColor: 'rgba(24, 144, 255, 0.15)' }
          ],
          xAxis: { type: 'category', data: xAxisData, boundaryGap: true, axisTick: { show: false }, axisLine: { lineStyle: { color: '#e8e8e8' } }, axisLabel: { color: '#666', fontSize: 12 } },
          yAxis: [
            {
              type: 'value',
              name: '电费 (元)',
              nameTextStyle: { color: '#666', padding: [0, 0, 0, 20] },
              splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { color: '#666', fontSize: 12, formatter: v => (v >= 1000 ? v / 1000 + 'k' : v) }
            },
            {
              type: 'value',
              name: '电量 (度)',
              nameTextStyle: { color: '#666', padding: [0, 20, 0, 0] },
              splitLine: { show: false },
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { color: '#666', fontSize: 12, formatter: v => (v >= 1000 ? v / 1000 + 'k' : v) }
            }
          ],
          series: [
            {
              name: '总电费',
              type: 'line',
              data: this.chartData.map(item => item.useAmount),
              smooth: true,
              symbol: 'none',
              lineStyle: { width: 2 },
              areaStyle: {
                opacity: 0.3,
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(82, 196, 26, 0.3)' }, { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }] }
              }
            },
            { name: '室内电量', type: 'bar', yAxisIndex: 1, data: this.chartData.map(item => item.meterUseElec), stack: 'usage', barMaxWidth: 18, itemStyle: { color: 'rgba(135, 206, 235, 0.65)', borderRadius: [2, 2, 0, 0] } },
            { name: '空调电量', type: 'bar', yAxisIndex: 1, data: this.chartData.map(item => item.airUseElec), stack: 'usage', barMaxWidth: 18, itemStyle: { color: 'rgba(255, 160, 122, 0.65)', borderRadius: [2, 2, 0, 0] } }
          ]
        }
      } else {
        option = {
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
              let html = `<div style="font-weight: 500; margin-bottom: 8px">${params[0].name}</div>`
              params.forEach(item => {
                const suffix = item.seriesName === '总水费' ? ' 元' : ' m³'
                html += `<div style="display: flex; align-items: center; margin-bottom: 4px">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${item.color}; border-radius: 50%; margin-right: 8px"></span>
                  <span style="flex: 1">${item.seriesName}</span>
                  <span style="font-weight: 500">${this.formatNumber(item.value)}${suffix}</span>
                </div>`
              })
              return html
            }
          },
          legend: { data: ['总水费', '总水量'], bottom: 35, itemGap: 20, textStyle: { color: '#666' } },
          grid: { top: 30, left: 50, right: 50, bottom: 75, containLabel: true },
          dataZoom: [
            { type: 'inside', start: 0, end: 100 },
            { type: 'slider', start: 0, end: 100, height: 8, bottom: 5, borderColor: 'transparent', backgroundColor: '#f0f0f0', handleSize: 14, showDetail: false, showDataShadow: false, fillerColor: 'rgba(24, 144, 255, 0.15)' }
          ],
          xAxis: { type: 'category', data: xAxisData, boundaryGap: true, axisTick: { show: false }, axisLine: { lineStyle: { color: '#e8e8e8' } }, axisLabel: { color: '#666', fontSize: 12 } },
          yAxis: [
            {
              type: 'value',
              name: '水费 (元)',
              nameTextStyle: { color: '#666', padding: [0, 0, 0, 20] },
              splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { color: '#666', fontSize: 12, formatter: v => (v >= 1000 ? v / 1000 + 'k' : v) }
            },
            {
              type: 'value',
              name: '水量 (m³)',
              nameTextStyle: { color: '#666', padding: [0, 20, 0, 0] },
              splitLine: { show: false },
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { color: '#666', fontSize: 12, formatter: v => (v >= 1000 ? v / 1000 + 'k' : v) }
            }
          ],
          series: [
            {
              name: '总水费',
              type: 'line',
              data: this.chartData.map(item => item.useAmount),
              smooth: true,
              symbol: 'none',
              lineStyle: { width: 2 },
              areaStyle: {
                opacity: 0.3,
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(82, 196, 26, 0.3)' }, { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }] }
              }
            },
            { name: '总水量', type: 'bar', yAxisIndex: 1, data: this.chartData.map(item => item.waterUse), barMaxWidth: 18, itemStyle: { color: 'rgba(135, 206, 235, 0.65)', borderRadius: [2, 2, 0, 0] } }
          ]
        }
      }

      this.chartInstance.setOption(option, true)
    },

    handleResize () {
      if (this.chartInstance) {
        this.chartInstance.resize()
      }
    },

    formatNumber (num) {
      if (num === undefined || num === null || num === '') return '0.00'
      return Number(num).toFixed(2)
    },

    getSettleWayLabel (value) {
      const map = { 0: '按表计费', 1: '按单价计费', 2: '固定费用' }
      return map[value] || '-'
    },

    deviceDetailSpanMethod ({ row, columnIndex }) {
      const leadCols = this.airSysElecColsVisible ? 13 : 11
      if (columnIndex < leadCols) {
        return { rowspan: row.col, colspan: row.col > 0 ? 1 : 0 }
      }
    },

    getStatisticsSummaries (param) {
      const { columns } = param
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '总计'
          return
        }
        const values = this.tableData.map(item => Number(item[column.property]))
        if (!values.every(value => isNaN(value))) {
          sums[index] = values.reduce((prev, curr) => {
            const value = Number(curr)
            if (!isNaN(value)) {
              return prev + curr
            } else {
              return prev
            }
          }, 0)
          sums[index] = sums[index].toFixed(2)
        } else {
          sums[index] = '-'
        }
      })
      return sums
    },

    getDeviceDetailSummaries (param) {
      const { columns } = param
      const sums = []
      const uniqueDates = {}
      this.deviceDetailData.forEach(row => {
        if (!uniqueDates[row.occurDate]) {
          uniqueDates[row.occurDate] = row
        }
      })
      const dateRows = Object.values(uniqueDates)
      const leadCols = this.airSysElecColsVisible ? 13 : 11
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '总计'
          return
        }
        if (index < leadCols) {
          const values = dateRows.map(item => Number(item[column.property]))
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr)
              if (!isNaN(value)) {
                return prev + curr
              } else {
                return prev
              }
            }, 0)
            sums[index] = sums[index].toFixed(2)
          } else {
            sums[index] = '-'
          }
        } else {
          sums[index] = '-'
        }
      })
      return sums
    },

    async handleExport () {
      if (!this.tenantId) {
        this.$message.warning('缺少租户ID')
        return
      }
      if (this.statType === 0) {
        if (!this.switchDeviceDetail && (!this.tableData || this.tableData.length === 0)) {
          this.$message.warning('暂无数据可导出')
          return
        }
        if (this.switchDeviceDetail && (!this.deviceDetailData || this.deviceDetailData.length === 0)) {
          this.$message.warning('暂无设备明细数据可导出')
          return
        }
      } else {
        if (!this.tableData || this.tableData.length === 0) {
          this.$message.warning('暂无数据可导出')
          return
        }
      }
      this.exportLoading = true
      setTimeout(() => {
        try {
          if (this.statType === 0) {
            if (this.switchDeviceDetail) {
              this.exportElectricityDeviceDetail()
            } else {
              this.exportElectricityNormal()
            }
          } else {
            if (this.switchDeviceDetail) {
              this.exportWaterDeviceDetail()
            } else {
              this.exportWaterNormal()
            }
          }
          this.$message.success('导出成功！')
        } catch (error) {
          console.error('导出失败:', error)
          this.$message.error(`导出失败: ${error.message || '请重试'}`)
        } finally {
          this.exportLoading = false
        }
      }, 100)
    },

    exportElectricityNormal () {
      const filterRow = [`统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}`, `租户ID: ${this.tenantId}`]
      const headers = [
        '日期', '总电费（元）', '室内电费（元）', '空调电费（元）', '总电量（度）',
        ...(this.airSysElecColsVisible ? ['系统总电量（度）'] : []),
        '室内电量（度）', '空调电量（度）',
        ...(this.airSysElecColsVisible ? ['空调系统电量（度）'] : []),
        '尖电量（度）', '峰电量（度）', '平电量（度）', '谷电量（度）'
      ]
      const dataRows = this.tableData.map(row => {
        const lead = [
          row.occurDate || '',
          this.formatExportNumber(row.useAmount),
          this.formatExportNumber(row.meterBalance),
          this.formatExportNumber(row.airBalance),
          this.formatExportNumber(row.useElec)
        ]
        if (this.airSysElecColsVisible) lead.push(this.formatExportNumber(row.sysElec))
        lead.push(
          this.formatExportNumber(row.meterUseElec),
          this.formatExportNumber(row.airUseElec)
        )
        if (this.airSysElecColsVisible) lead.push(this.formatExportNumber(row.airSysElec))
        lead.push(
          this.formatExportNumber(row.useElecPeak),
          this.formatExportNumber(row.useElecTop),
          this.formatExportNumber(row.useElecFlat),
          this.formatExportNumber(row.useElecValley)
        )
        return lead
      })
      const totalRow = [
        '总计',
        this.formatExportNumber(this.totalStats.amount),
        this.formatExportNumber(this.totalStats.meterBalance),
        this.formatExportNumber(this.totalStats.airBalance),
        this.formatExportNumber(this.totalStats.elec),
        ...(this.airSysElecColsVisible ? [this.formatExportNumber(this.totalStats.sysElec)] : []),
        this.formatExportNumber(this.totalStats.meterUseElec),
        this.formatExportNumber(this.totalStats.airUseElec),
        ...(this.airSysElecColsVisible ? [this.formatExportNumber(this.totalStats.airSysElec)] : []),
        this.formatExportNumber(this.totalStats.elecPeak),
        this.formatExportNumber(this.totalStats.elecTop),
        this.formatExportNumber(this.totalStats.elecFlat),
        this.formatExportNumber(this.totalStats.elecValley)
      ]
      const wsData = [filterRow, [], headers, ...dataRows, totalRow]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const colCount = 11 + (this.airSysElecColsVisible ? 2 : 0)
      ws['!cols'] = Array(colCount).fill({ wch: 15 })
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '租户用电统计')
      const fileName = this.generateFileName('租户用电统计')
      XLSX.writeFile(wb, fileName)
    },

    exportElectricityDeviceDetail () {
      const ext = this.airSysElecColsVisible ? 2 : 0
      const LEAD = 11 + ext
      const LAST_COL = 30 + ext
      const tailPad = () => ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
      const filterRow = [`统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}  |  租户ID: ${this.tenantId}  |  设备明细`]
      const leadHeaders = [
        '日期', '电费（元）', '室内电费（元）', '空调电费（元）', '总电量（度）',
        ...(ext ? ['系统总电量（度）'] : []),
        '室内电量（度）', '空调电量（度）',
        ...(ext ? ['空调系统电量（度）'] : []),
        '尖电量（度）', '峰电量（度）', '平电量（度）', '谷电量（度）'
      ]
      const header1 = [
        ...leadHeaders,
        '设备', '结算方式', '费用', '电量', '', '', '', '',
        '起始读数', '', '', '', '', '',
        '截止读数', '', '', '', '', ''
      ]
      const header2 = [
        ...Array(LEAD).fill(''),
        '', '', '',
        '总计', '尖', '峰', '平', '谷',
        '时间', '总电量', '尖', '峰', '平', '谷',
        '时间', '总电量', '尖', '峰', '平', '谷'
      ]
      if (!this.deviceDetailData || this.deviceDetailData.length === 0) throw new Error('没有可导出的设备明细数据')
      const dateGroups = {}
      this.deviceDetailData.forEach(row => {
        const date = row.occurDate
        if (!dateGroups[date]) {
          dateGroups[date] = {
            summary: {
              occurDate: date,
              useAmount: row.useAmount,
              meterBalance: row.meterBalance,
              airBalance: row.airBalance,
              useElec: row.useElec,
              meterUseElec: row.meterUseElec,
              airUseElec: row.airUseElec,
              sysElec: row.sysElec,
              airSysElec: row.airSysElec,
              useElecPeak: row.useElecPeak,
              useElecTop: row.useElecTop,
              useElecFlat: row.useElecFlat,
              useElecValley: row.useElecValley
            },
            devices: []
          }
        }
        if (row.deviceUseDtoList && Object.keys(row.deviceUseDtoList).length > 0) {
          dateGroups[date].devices.push(row.deviceUseDtoList)
        }
      })
      const summaryStatCells = (s) => {
        const cells = [
          this.formatExportNumber(s.useAmount),
          this.formatExportNumber(s.meterBalance),
          this.formatExportNumber(s.airBalance),
          this.formatExportNumber(s.useElec)
        ]
        if (ext) cells.push(this.formatExportNumber(s.sysElec))
        cells.push(
          this.formatExportNumber(s.meterUseElec),
          this.formatExportNumber(s.airUseElec)
        )
        if (ext) cells.push(this.formatExportNumber(s.airSysElec))
        cells.push(
          this.formatExportNumber(s.useElecPeak),
          this.formatExportNumber(s.useElecTop),
          this.formatExportNumber(s.useElecFlat),
          this.formatExportNumber(s.useElecValley)
        )
        return cells
      }
      const deviceTailCells = (device) => {
        const startDto = device.startUseDto || {}
        const stopDto = device.stopUseDto || {}
        return [
          device.meterName || '',
          this.getSettleWayLabel(device.settleWay) || '',
          this.formatExportNumber(device.useAmount),
          this.formatExportNumber(device.useElec),
          this.formatExportNumber(device.useElecPeak),
          this.formatExportNumber(device.useElecTop),
          this.formatExportNumber(device.useElecFlat),
          this.formatExportNumber(device.useElecValley),
          startDto.occurTime || '',
          this.formatExportNumber(startDto.powerAll),
          this.formatExportNumber(startDto.powerPeak),
          this.formatExportNumber(startDto.powerTop),
          this.formatExportNumber(startDto.powerFlat),
          this.formatExportNumber(startDto.powerValley),
          stopDto.occurTime || '',
          this.formatExportNumber(stopDto.powerAll),
          this.formatExportNumber(stopDto.powerPeak),
          this.formatExportNumber(stopDto.powerTop),
          this.formatExportNumber(stopDto.powerFlat),
          this.formatExportNumber(stopDto.powerValley)
        ]
      }
      const dataRows = []
      Object.keys(dateGroups).sort().forEach(date => {
        const group = dateGroups[date]
        const deviceCount = group.devices.length
        if (deviceCount === 0) {
          dataRows.push([group.summary.occurDate, ...summaryStatCells(group.summary), ...tailPad()])
        } else {
          group.devices.forEach((device, idx) => {
            if (idx === 0) {
              dataRows.push([group.summary.occurDate, ...summaryStatCells(group.summary), ...deviceTailCells(device)])
            } else {
              dataRows.push(['', ...Array(LEAD - 1).fill(''), ...deviceTailCells(device)])
            }
          })
        }
      })
      const totalRow = [
        '总计',
        ...summaryStatCells({
          useAmount: this.totalStats.amount,
          meterBalance: this.totalStats.meterBalance,
          airBalance: this.totalStats.airBalance,
          useElec: this.totalStats.elec,
          meterUseElec: this.totalStats.meterUseElec,
          airUseElec: this.totalStats.airUseElec,
          sysElec: this.totalStats.sysElec,
          airSysElec: this.totalStats.airSysElec,
          useElecPeak: this.totalStats.elecPeak,
          useElecTop: this.totalStats.elecTop,
          useElecFlat: this.totalStats.elecFlat,
          useElecValley: this.totalStats.elecValley
        })
      ]
      while (totalRow.length < LAST_COL + 1) totalRow.push('')
      const wsData = [filterRow, [], header1, header2, ...dataRows, totalRow]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = Array(LAST_COL + 1).fill({ wch: 12 })
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: LAST_COL } },
        ...Array(LEAD).fill(0).map((_, i) => ({ s: { r: 2, c: i }, e: { r: 3, c: i } })),
        { s: { r: 2, c: LEAD }, e: { r: 3, c: LEAD } },
        { s: { r: 2, c: LEAD + 1 }, e: { r: 3, c: LEAD + 1 } },
        { s: { r: 2, c: LEAD + 2 }, e: { r: 3, c: LEAD + 2 } },
        { s: { r: 2, c: LEAD + 3 }, e: { r: 2, c: LEAD + 7 } },
        { s: { r: 2, c: LEAD + 8 }, e: { r: 2, c: LEAD + 13 } },
        { s: { r: 2, c: LEAD + 14 }, e: { r: 2, c: LAST_COL } }
      ]
      let currentRow = 4
      Object.keys(dateGroups).sort().forEach(date => {
        const group = dateGroups[date]
        const deviceCount = group.devices.length
        if (deviceCount > 1) {
          for (let col = 0; col < LEAD; col++) {
            merges.push({ s: { r: currentRow, c: col }, e: { r: currentRow + deviceCount - 1, c: col } })
          }
        }
        currentRow += deviceCount > 0 ? deviceCount : 1
      })
      ws['!merges'] = merges
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '租户用电统计-设备明细')
      const fileName = this.generateFileName('租户用电统计-设备明细')
      XLSX.writeFile(wb, fileName)
    },

    exportWaterNormal () {
      const filterRow = [`统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}`, `租户ID: ${this.tenantId}`]
      const headers = ['日期', '水费（元）', '水量（m³）']
      const dataRows = this.tableData.map(row => [row.occurDate || '', this.formatExportNumber(row.useAmount), this.formatExportNumber(row.waterUse)])
      const totalRow = ['总计', this.formatExportNumber(this.totalWaterStats.amount), this.formatExportNumber(this.totalWaterStats.water)]
      const wsData = [filterRow, [], headers, ...dataRows, totalRow]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '租户用水统计')
      const fileName = this.generateFileName('租户用水统计')
      XLSX.writeFile(wb, fileName)
    },

    exportWaterDeviceDetail () {
      const filterRow = [`统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}  |  租户ID: ${this.tenantId}  |  设备明细`]
      const header1 = ['日期', '水费（元）', '水量（m³）', '设备', '结算方式', '费用', '水量（m³）', '起始读数', '', '截止读数', '']
      const header2 = ['', '', '', '', '', '', '', '时间', '累计读数', '时间', '累计读数']
      if (!this.deviceDetailData || this.deviceDetailData.length === 0) throw new Error('没有可导出的设备明细数据')
      const dateGroups = {}
      this.deviceDetailData.forEach(row => {
        const date = row.occurDate
        if (!dateGroups[date]) {
          dateGroups[date] = { summary: { occurDate: date, useAmount: row.useAmount, waterUse: row.waterUse }, devices: [] }
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
          dataRows.push([group.summary.occurDate, this.formatExportNumber(group.summary.useAmount), this.formatExportNumber(group.summary.waterUse), '', '', '', '', '', '', '', ''])
        } else {
          group.devices.forEach((device, idx) => {
            if (idx === 0) {
              dataRows.push([group.summary.occurDate, this.formatExportNumber(group.summary.useAmount), this.formatExportNumber(group.summary.waterUse), device.waterName || '', this.getSettleWayLabel(device.settleWay) || '', this.formatExportNumber(device.balance), this.formatExportNumber(device.consumption), device.startTime || '', this.formatExportNumber(device.startRead), device.endTime || '', this.formatExportNumber(device.endRead)])
            } else {
              dataRows.push(['', '', '', device.waterName || '', this.getSettleWayLabel(device.settleWay) || '', this.formatExportNumber(device.balance), this.formatExportNumber(device.consumption), device.startTime || '', this.formatExportNumber(device.startRead), device.endTime || '', this.formatExportNumber(device.endRead)])
            }
          })
        }
      })
      const totalRow = ['总计', this.formatExportNumber(this.totalWaterStats.amount), this.formatExportNumber(this.totalWaterStats.water)]
      while (totalRow.length < 11) totalRow.push('')
      const wsData = [filterRow, [], header1, header2, ...dataRows, totalRow]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = Array(11).fill({ wch: 12 })
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
            merges.push({ s: { r: currentRow, c: col }, e: { r: currentRow + deviceCount - 1, c: col } })
          }
        }
        currentRow += deviceCount > 0 ? deviceCount : 1
      })
      ws['!merges'] = merges
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '租户用水统计-设备明细')
      const fileName = this.generateFileName('租户用水统计-设备明细')
      XLSX.writeFile(wb, fileName)
    },

    generateFileName (prefix) {
      const now = new Date()
      const timeStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0')
      return `${prefix}_${timeStr}.xlsx`
    },

    formatExportNumber (num) {
      if (num === undefined || num === null || num === '' || num === '-') return 0
      const numValue = typeof num === 'string' ? parseFloat(num) : num
      if (isNaN(numValue)) return 0
      return numValue
    },

    openFullscreen () {
      this.fullscreenVisible = true
    },

    closeFullscreen () {
      this.fullscreenVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.energy-statistics {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  min-height: 550px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.stat-tabs {
  display: flex;
  gap: 24px;

  .tab-item {
    font-size: 16px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    padding-bottom: 8px;
    position: relative;
    transition: all 0.3s;

    &.active {
      color: #1890ff;
      font-weight: 600;

      &::after {
        content: "";
        position: absolute;
        bottom: -13px;
        left: 0;
        width: 100%;
        height: 2px;
        background: #1890ff;
      }
    }

    &:hover {
      color: #1890ff;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.filter-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.detail-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-text {
  font-size: 14px;
  color: #666;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.card-header {
  background: #fafafa;
  padding: 12px 16px;
  font-weight: 600;
  border-bottom: 1px solid #e8e8e8;
}

.card-body {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.main-stat {
  text-align: center;
}

.main-stat .value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.main-stat .label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.divider {
  font-size: 20px;
  color: #ccc;
  font-weight: bold;
}

.sub-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.sub-stat {
  text-align: center;
  flex: 1;
}

.sub-stat .value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.sub-stat .label {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.plus {
  font-size: 14px;
  color: #ccc;
}

.chart-wrapper {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.chart-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-title-section {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.chart-main-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chart-date-info {
  font-size: 12px;
  color: #999;
}

.chart-summary-section {
  display: flex;
  gap: 32px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.summary-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.chart-box {
  width: 100%;
  height: 500px;
}

.table-wrapper {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header .title {
  font-size: 16px;
  font-weight: 600;
}
</style>
