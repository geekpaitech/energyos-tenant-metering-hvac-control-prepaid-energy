<template>
  <div class="equipment-power-dashboard">
    <!-- 筛选器 -->
    <div class="filter-container">
      <!-- 统计时间 -->
      <div class="filter-item date-filter">
        <label class="filter-label">{{ $t('equipmentPower.filterStatPeriod') }}</label>
        <el-date-picker v-model="queryParams.dateRange" type="daterange" format="yyyy-MM-dd" value-format="yyyy-MM-dd"
          range-separator="-" :start-placeholder="$t('equipmentPower.phDateStart')" :end-placeholder="$t('equipmentPower.phDateEnd')" :picker-options="pickerOptions"
          class="custom-date-picker" @change="handleDateRangeChange" />
      </div>

      <!-- 租户选择 -->
      <div class="filter-item tenant-filter">
        <label class="filter-label">{{ $t('equipmentPower.filterTenant') }}</label>
        <el-select v-model="queryParams.tenantId" filterable :placeholder="$t('equipmentPower.phTenant')" class="custom-select"
          :loading="tenantLoading" clearable @change="handleTenantChange">

          <el-option v-for="tenant in tenantList" :key="tenant.tenantId" :label="tenantOptionLabel(tenant)"
            :value="tenant.tenantId" />
        </el-select>
      </div>

      <!-- 电表选择 -->
      <div class="filter-item meter-filter">
        <label class="filter-label">{{ $t('equipmentPower.filterMeter') }}</label>
        <el-select ref="meterSelect" v-model="queryParams.meterQuery" filterable :placeholder="$t('equipmentPower.phMeter')"
          class="custom-select" :loading="meterLoading" clearable @change="handleMeterChange">
          <!-- <el-option label="全部" :value="''" /> -->
          <el-option v-for="meter in meterList" :key="meter.serial" :label="meterSelectLabel(meter)"
            :value="meter.serial">
            <span style="float: left">{{ $displayBizHybrid(meter.meterName, 120) }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">{{ meter.serial }}</span>
          </el-option>
        </el-select>
      </div>

      <div class="filter-actions">
        <button class="export-btn" @click="handleExport" :disabled="exportLoading || tableData.length === 0">
          <svg v-if="!exportLoading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span v-if="exportLoading">{{ $t('equipmentPower.exportLoading') }}</span>
          <span v-else>{{ $t('equipmentPower.exportReport') }}</span>
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content" v-loading="loading" :element-loading-text="$t('equipmentPower.loadingText')">
      <!-- 数据表格区域 -->
      <div class="table-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('equipmentPower.sectionTitle') }}</h2>
          <div class="section-tip">
            <i class="el-icon-info"></i>
            <span>{{ $t('equipmentPower.sectionTip') }}</span>
          </div>
        </div>

        <!-- 最大需量统计 -->
        <div class="max-demand-info" v-if="maxDemandInfo">
          <span class="label">{{ $t('equipmentPower.maxDemandLabel') }}</span>
          <span class="value">{{ formatNumber(maxDemandInfo.maxDemand) }} {{ $t('equipmentPower.unitKw') }}</span>
          <span class="label" style="margin-left: 30px;">{{ $t('equipmentPower.collectTimeLabel') }}</span>
          <span class="value">{{ maxDemandInfo.occurTime }}</span>
          <span class="label" style="margin-left: 30px;">{{ $t('equipmentPower.totalFeeLabel') }}</span>
          <span class="value">{{ formatNumber(totalBalance) }} {{ $t('equipmentPower.unitYuan') }}</span>
          <span class="label" style="margin-left: 30px;">{{ $t('equipmentPower.totalElecLabel') }}</span>
          <span class="value">{{ formatNumber(totalUseElec) }} {{ $t('equipmentPower.unitKwh') }}</span>
        </div>

        <!-- 电表用电表格 -->
        <div class="meter-table-wrapper" v-if="tableData.length > 0">
          <el-table ref="dataTable" :data="tableData" border :max-height="600" class="meter-report-table"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
              textAlign: 'center'
            }" :cell-style="{ textAlign: 'center' }">
            <!-- 设备信息（展示合并：编号/名称/序列号/绑定类型/绑定信息，数据字段不变） -->
            <el-table-column :label="$t('equipmentPower.colEquipment')" min-width="260" fixed align="left">
              <template slot-scope="scope">
                <div class="equipment-info-cell is-link" @click="jumpToMeterBySerial(scope.row.serial)">
                  <div class="eq-title">{{ $displayDynamicName(scope.row.meterName, 200) || $t('equipmentPower.dash') }}</div>
                  <div class="eq-meta">{{ $t('equipmentPower.serialPrefix') }} {{ scope.row.serial || $t('equipmentPower.dash') }}</div>
                  <div class="eq-tag-row">
                    <el-tag size="mini" type="primary">{{ getBindTypeLabel(scope.row.bindType) }}</el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('equipmentPower.colBindInfo')" min-width="220" align="left">
              <template slot-scope="scope">
                <div class="bind-inline-cell is-link" @click="jumpToTenantByBind(scope.row)">
                  <span class="bind-id">{{ scope.row.bindId || '--' }}</span>
                  <span class="bind-name">{{ bindNameDisplay(scope.row.bindName) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('equipmentPower.colDate')" width="120" prop="occurDate" />

            <!-- 需量记录 -->
            <el-table-column :label="$t('equipmentPower.colDemandRecord')" width="240" align="left">
              <template slot-scope="scope">
                <div class="merge-metric-cell">
                  <div><span class="metric-label">{{ $t('equipmentPower.metricMaxDemand') }}</span><span class="metric-value">{{ scope.row.maxDemand ? `${formatNumber(scope.row.maxDemand)} ${$t('equipmentPower.unitKwLower')}` : $t('equipmentPower.dash') }}</span></div>
                  <div><span class="metric-label">{{ $t('equipmentPower.metricCollectTime') }}</span><span class="metric-value">{{ scope.row.occurTime || $t('equipmentPower.dash') }}</span></div>
                </div>
              </template>
            </el-table-column>

            <!-- 用能 -->
            <el-table-column :label="$t('equipmentPower.colTotalFee')" width="190" align="left">
              <template slot-scope="scope">
                <div class="merge-metric-cell">
                  <div>
                    <span class="metric-label">{{ $t('equipmentPower.metricTotalFee') }}</span>
                    <span class="metric-value metric-value-highlight">{{ formatNumber(scope.row.balance) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 分时电量 -->
            <el-table-column :label="$t('equipmentPower.colEnergyKwh')" :min-width="energyKwhColMin" align="left">
              <template slot-scope="scope">
                <div class="power-grid-cell">
                  <div class="power-total-row">
                    <span class="tou-pair">
                      <span class="metric-label">{{ $t('equipmentPower.metricTotalElec') }}</span>
                      <span class="metric-value">{{ formatNumber(scope.row.useElec) }}</span>
                    </span>
                  </div>
                  <div class="power-pair-row">
                    <span class="tou-pair"><span class="metric-label">{{ $t('equipmentPower.touSharp') }}:</span><span class="metric-value">{{ formatNumber(scope.row.useElecPeak) }}</span></span>
                    <span class="tou-pair"><span class="metric-label">{{ $t('equipmentPower.touPeak') }}:</span><span class="metric-value">{{ formatNumber(scope.row.useElecTop) }}</span></span>
                  </div>
                  <div class="power-pair-row">
                    <span class="tou-pair"><span class="metric-label">{{ $t('equipmentPower.touFlat') }}:</span><span class="metric-value">{{ formatNumber(scope.row.useElecFlat) }}</span></span>
                    <span class="tou-pair"><span class="metric-label">{{ $t('equipmentPower.touValley') }}:</span><span class="metric-value">{{ formatNumber(scope.row.useElecValley) }}</span></span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 起止读数：同一子列内叠放起始/截止，数据仍来自 startUseDto、stopUseDto -->
            <el-table-column :label="$t('equipmentPower.colStartEnd')" align="center">
              <el-table-column :label="$t('equipmentPower.colTime')" width="168" align="left">
                <template slot-scope="scope">
                  <div class="start-end-stack">
                    <div><span class="se-mark">{{ $t('equipmentPower.seStart') }}</span>{{ scope.row.startUseDto ? scope.row.startUseDto.occurTime : $t('equipmentPower.dash') }}</div>
                    <div><span class="se-mark">{{ $t('equipmentPower.seEnd') }}</span>{{ scope.row.stopUseDto ? scope.row.stopUseDto.occurTime : $t('equipmentPower.dash') }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('equipmentPower.colTotalElecCol')" width="108" align="right">
                <template slot-scope="scope">
                  <div class="start-end-stack is-num">
                    <div><span class="se-mark">{{ $t('equipmentPower.seStart') }}</span>{{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerAll) : $t('equipmentPower.dash') }}</div>
                    <div><span class="se-mark">{{ $t('equipmentPower.seEnd') }}</span>{{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerAll) : $t('equipmentPower.dash') }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('equipmentPower.touSharp')" width="100" align="right">
                <template slot-scope="scope">
                  <div class="start-end-stack is-num">
                    <div><span class="se-mark">{{ $t('equipmentPower.seStart') }}</span>{{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerPeak) : $t('equipmentPower.dash') }}</div>
                    <div><span class="se-mark">{{ $t('equipmentPower.seEnd') }}</span>{{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerPeak) : $t('equipmentPower.dash') }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('equipmentPower.touPeak')" width="100" align="right">
                <template slot-scope="scope">
                  <div class="start-end-stack is-num">
                    <div><span class="se-mark">{{ $t('equipmentPower.seStart') }}</span>{{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerTop) : $t('equipmentPower.dash') }}</div>
                    <div><span class="se-mark">{{ $t('equipmentPower.seEnd') }}</span>{{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerTop) : $t('equipmentPower.dash') }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('equipmentPower.touFlat')" width="100" align="right">
                <template slot-scope="scope">
                  <div class="start-end-stack is-num">
                    <div><span class="se-mark">{{ $t('equipmentPower.seStart') }}</span>{{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerFlat) : $t('equipmentPower.dash') }}</div>
                    <div><span class="se-mark">{{ $t('equipmentPower.seEnd') }}</span>{{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerFlat) : $t('equipmentPower.dash') }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('equipmentPower.touValley')" width="100" align="right">
                <template slot-scope="scope">
                  <div class="start-end-stack is-num">
                    <div><span class="se-mark">{{ $t('equipmentPower.seStart') }}</span>{{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerValley) : $t('equipmentPower.dash') }}</div>
                    <div><span class="se-mark">{{ $t('equipmentPower.seEnd') }}</span>{{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerValley) : $t('equipmentPower.dash') }}</div>
                  </div>
                </template>
              </el-table-column>
            </el-table-column>
          </el-table>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="!loading && tableData.length === 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <p>{{ $t('equipmentPower.emptyNoData') }}</p>
          <span class="empty-tip">{{ $t('equipmentPower.emptySelectMeter') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  getSimpleTenantList,
  getMeterDaySettleList,
  listMeterInfo
} from '@/api/useReport'
import moment from 'moment'
import * as XLSX from 'xlsx'

export default {
  name: 'EquipmentPower',
  data () {
    return {
      queryParams: {
        tenantId: '',
        meterQuery: '',
        dateRange: []
      },
      tenantList: [],
      meterList: [],
      tableData: [],
      tenantLoading: false,
      meterLoading: false,
      loading: false,
      exportLoading: false
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    pickerOptions () {
      const t = (k) => this.$t(`equipmentPower.${k}`)
      return {
        shortcuts: [
          {
            text: t('pickerLast7'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 6)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: t('pickerLast15'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 14)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: t('pickerLast30'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29)
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
          }
        ],
        disabledDate (time) {
          return time.getTime() > Date.now()
        }
      }
    },
    maxDemandInfo () {
      if (!this.tableData || this.tableData.length === 0) return null

      let maxVal = -1
      let maxItem = null

      this.tableData.forEach(item => {
        const val = parseFloat(item.maxDemand)
        if (!isNaN(val) && val > maxVal) {
          maxVal = val
          maxItem = item
        }
      })

      if (maxItem) {
        return {
          maxDemand: maxItem.maxDemand || '--',
          occurTime: maxItem.occurTime || '--'
        }
      }

      return null
    },
    totalBalance () {
      if (!this.tableData || this.tableData.length === 0) return 0
      return this.tableData.reduce((sum, row) => sum + this.formatExportNumber(row.balance), 0)
    },
    totalUseElec () {
      if (!this.tableData || this.tableData.length === 0) return 0
      return this.tableData.reduce((sum, row) => sum + this.formatExportNumber(row.useElec), 0)
    },
    /** 英文分时标签较长，列宽略增避免换行把数字挤断 */
    energyKwhColMin () {
      return this.$i18n.locale === 'en' ? 292 : 200
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
    }
  },
  mounted () {
    this.initPasteListener()
  },
  beforeDestroy () {
    this.removePasteListener()
  },
  methods: {
    tenantOptionLabel (tenant) {
      if (!tenant) return ''
      const n = tenant.name != null && tenant.name !== '' ? String(tenant.name) : ''
      return n ? `${this.$displayBizHybrid(n, 200)}` : String(tenant.tenantId != null ? tenant.tenantId : '')
    },
    meterSelectLabel (meter) {
      if (!meter) return ''
      const mn = this.$displayBizHybrid(meter.meterName || '', 120)
      return `${mn} (${meter.serial || ''})`
    },
    bindNameDisplay (name) {
      if (name == null || name === '' || name === '-') return '--'
      return this.$displayBizHybrid(String(name), 200)
    },

    // ==================== 初始化相关 ====================
    async initializeData () {
      // 保存路由参数
      const routeSerial = this.$route.query.serial
      const routeStartDate = this.$route.query.startDate
      const routeEndDate = this.$route.query.endDate

      if (routeStartDate && routeEndDate) {
        this.queryParams.dateRange = [routeStartDate, routeEndDate]
      } else {
        this.setDefaultDateRange()
      }

      await this.getTenantList()
      if (!this.queryParams.tenantId && this.tenantList && this.tenantList.length > 0) {
        this.queryParams.tenantId = this.tenantList[0].tenantId
      }

      await this.getMeterList()
      if (routeSerial) {
        this.queryParams.meterQuery = routeSerial
      } else if (!this.queryParams.meterQuery && this.meterList && this.meterList.length > 0) {
        this.queryParams.meterQuery = this.meterList[0].serial
      }

      if (
        this.queryParams.dateRange &&
        this.queryParams.dateRange.length === 2 &&
        this.queryParams.meterQuery
      ) {
        await this.fetchData()
      }
    },

    setDefaultDateRange () {
      this.queryParams.dateRange = [
        moment().startOf('month').format('YYYY-MM-DD'),
        moment().format('YYYY-MM-DD')
      ]
    },

    // ==================== 粘贴事件处理 ====================
    initPasteListener () {
      this.$nextTick(() => {
        if (this.$refs.meterSelect && this.$refs.meterSelect.$el) {
          const input = this.$refs.meterSelect.$el.querySelector('input')
          if (input) {
            this.meterInput = input
            input.addEventListener('paste', this.handlePaste)
          }
        }
      })
    },

    removePasteListener () {
      if (this.meterInput) {
        this.meterInput.removeEventListener('paste', this.handlePaste)
      }
    },

    handlePaste (event) {
      event.preventDefault()
      const pastedText = (event.clipboardData || window.clipboardData).getData('text')
      const cleanedText = pastedText.replace(/\s+/g, '')
      this.queryParams.meterQuery = cleanedText

      this.$nextTick(() => {
        if (event.target) {
          event.target.value = cleanedText
          const inputEvent = new Event('input', { bubbles: true })
          event.target.dispatchEvent(inputEvent)
        }
        // 粘贴后自动触发查询
        if (this.queryParams.meterQuery) {
          this.fetchData()
        }
      })
    },

    // ==================== 数据获取 ====================
    async getTenantList () {
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0
        })
        this.tenantList = data || []
      } catch (error) {
        this.$apiError.notify(error, this.$t('equipmentPower.msgTenantListFail'))
        console.error('获取租户列表失败:', error)
      } finally {
        this.tenantLoading = false
      }
    },

    async getMeterList () {
      this.meterLoading = true
      try {
        const params = {
          managerId: this.currentManagerId
        }

        if (this.queryParams.tenantId) {
          params.bindId = this.queryParams.tenantId
          params.bindType = 1
        }

        const { data } = await listMeterInfo(params)
        this.meterList = data || []
      } catch (error) {
        this.$apiError.notify(error, this.$t('equipmentPower.msgMeterListFail'))
        console.error('获取电表列表失败:', error)
      } finally {
        this.meterLoading = false
      }
    },

    async fetchData () {
      // 校验必填项
      if (!this.queryParams.dateRange || this.queryParams.dateRange.length !== 2) {
        this.$message.warning(this.$t('equipmentPower.msgSelectDate'))
        return
      }

      // 必须选择电表
      if (!this.queryParams.meterQuery) {
        this.$message.warning(this.$t('equipmentPower.msgSelectMeter'))
        return
      }

      this.loading = true
      try {
        const params = {
          managerId: this.currentManagerId,
          serial: this.queryParams.meterQuery,
          startDate: this.queryParams.dateRange[0],
          endDate: this.queryParams.dateRange[1]
        }

        const { data } = await getMeterDaySettleList(params)
        this.tableData = data || []

        if (this.tableData.length === 0) {
          this.$message.info(this.$t('equipmentPower.msgNoData'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('equipmentPower.msgFetchFail'))
        console.error('获取数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    // ==================== 筛选器事件处理 ====================
    handleDateRangeChange (val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        // 日期变更时，如果已经选择了电表，则重新查询
        if (this.queryParams.meterQuery) {
          this.fetchData()
        }
      }
    },

    async handleTenantChange () {
      // 租户变更时清空电表选择并重新获取电表列表
      this.queryParams.meterQuery = ''
      this.tableData = []
      await this.getMeterList()
    },

    handleMeterChange () {
      // 电表变更时直接查询
      if (this.queryParams.meterQuery) {
        this.fetchData()
      } else {
        // 清空电表时清空数据
        this.tableData = []
      }
    },

    // ==================== 导出功能 ====================
    handleExport () {
      if (!this.tableData || this.tableData.length === 0) {
        this.$message.warning(this.$t('equipmentPower.msgExportEmpty'))
        return
      }

      this.exportLoading = true

      setTimeout(() => {
        try {
          this.exportToExcel()
          this.$message.success(this.$t('equipmentPower.msgExportOk'))
        } catch (error) {
          console.error('导出失败:', error)
          this.$message.error(`${this.$t('equipmentPower.msgExportFail')}: ${error.message || this.$t('equipmentPower.msgExportRetry')}`)
        } finally {
          this.exportLoading = false
        }
      }, 100)
    },

    exportToExcel () {
      const t = (k) => this.$t(`equipmentPower.${k}`)
      const tenant = this.tenantList.find(t => t.tenantId === this.queryParams.tenantId)
      const tenantName = tenant
        ? (tenant.name ? this.$displayBizHybrid(String(tenant.name), 200) : String(tenant.tenantId))
        : t('tenantAll')

      const meter = this.meterList.find(m => m.serial === this.queryParams.meterQuery)
      const meterName = meter ? this.meterSelectLabel(meter) : this.queryParams.meterQuery

      const filterRow = [
        this.$t('equipmentPower.exportFilterLine', {
          start: this.queryParams.dateRange[0],
          end: this.queryParams.dateRange[1],
          tenant: tenantName,
          meter: meterName
        })
      ]

      const header1 = [
        t('expColMeterId'), t('expColMeterName'), t('expColSerial'), t('expColBindType'), t('expColBindId'), t('expColBindName'), t('expColDate'),
        t('expColTotalFee'), t('expColTotalKwh'), t('expColKwhSharp'), t('expColKwhPeak'), t('expColKwhFlat'), t('expColKwhValley'),
        t('expRowStartRead'), '', '', '', '', '',
        t('expRowStopRead'), '', '', '', '', ''
      ]

      const header2 = [
        '', '', '', '', '', '', '',
        '', '', '', '', '', '',
        t('expSubTime'), t('expSubTotal'), t('expSubSharp'), t('expSubPeak'), t('expSubFlat'), t('expSubValley'),
        t('expSubTime'), t('expSubTotal'), t('expSubSharp'), t('expSubPeak'), t('expSubFlat'), t('expSubValley')
      ]

      const dataRows = this.tableData.map(row => {
        const startDto = row.startUseDto || {}
        const stopDto = row.stopUseDto || {}
        const bindNameCell = row.bindName ? this.$displayBizHybrid(String(row.bindName), 200) : ''

        return [
          row.meterId || '',
          this.$displayDynamicName(row.meterName, 200) || '',
          row.serial || '',
          this.getBindTypeLabel(row.bindType),
          row.bindId || '',
          bindNameCell,
          row.occurDate || '',
          this.formatExportNumber(row.balance),
          this.formatExportNumber(row.useElec),
          this.formatExportNumber(row.useElecPeak),
          this.formatExportNumber(row.useElecTop),
          this.formatExportNumber(row.useElecFlat),
          this.formatExportNumber(row.useElecValley),
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
      })

      const wsData = [
        filterRow,
        [],
        header1,
        header2,
        ...dataRows
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      ws['!cols'] = [
        { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
        { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }
      ]

      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 24 } },
        { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
        { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
        { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
        { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
        { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } },
        { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } },
        { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } },
        { s: { r: 2, c: 7 }, e: { r: 3, c: 7 } },
        { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } },
        { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } },
        { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } },
        { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } },
        { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } },
        { s: { r: 2, c: 13 }, e: { r: 2, c: 18 } },
        { s: { r: 2, c: 19 }, e: { r: 2, c: 24 } }
      ]

      ws['!merges'] = merges

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('equipmentPower.exportSheetName'))

      const fileName = this.generateFileName(this.$t('equipmentPower.exportFilePrefix'))
      XLSX.writeFile(wb, fileName)
    },

    generateFileName (prefix) {
      const now = new Date()
      const timeStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')

      return `${prefix}_${timeStr}.xlsx`
    },

    // ==================== 格式化方法 ====================
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

    formatNumber (num) {
      if (num === undefined || num === null || num === '') {
        return '0.00'
      }
      return Number(num).toFixed(2)
    },

    getBindTypeLabel (bindType) {
      if (bindType === undefined || bindType === null) return '-'
      const map = {
        1: 'bindDedicated',
        2: 'bindPublic',
        3: 'bindFormula',
        4: 'bindAc'
      }
      const key = map[Number(bindType)]
      return key ? this.$t(`equipmentPower.${key}`) : '-'
    },

    jumpToMeterBySerial (serial) {
      if (!serial || serial === '-') {
        this.$message.warning(this.$t('equipmentPower.msgNoSerial'))
        return
      }
      this.$router.push({
        path: '/device/electricity',
        query: {
          serial,
          autoSearch: 'true'
        }
      })
    },

    jumpToTenantByBind (row) {
      const bindType = Number(row && row.bindType)
      const bindId = row && row.bindId

      if (bindType !== 1) {
        this.$message.warning(this.$t('equipmentPower.msgBindNotTenant'))
        return
      }

      if (!bindId || bindId === '-') {
        this.$message.warning(this.$t('equipmentPower.msgNoTenantId'))
        return
      }

      this.$router.push(`/metering/tenant/detail/${bindId}/`)
    }
  }
}
</script>

<style lang="scss" scoped>
.equipment-power-dashboard {
  min-height: 100vh;
  padding: 16px;
  background: #f5f7fa;
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
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 200px;

  &.date-filter {
    max-width: 320px;
  }

  &.tenant-filter,
  &.meter-filter {
    max-width: 360px;
  }
}

.filter-label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;

  .required-mark {
    color: #ef4444;
    margin-left: 2px;
  }
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.export-btn {
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
  background: #10b981;
  color: white;

  svg {
    width: 16px;
    height: 16px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }
}

// 主内容区
.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
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

.section-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;

  i {
    font-size: 14px;
  }
}

.max-demand-info {
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;

  .label {
    font-weight: 400;
    color: #807f7f;
     font-size: 16px;
  }

  .value {
    color: #080808;
    font-weight: 500;
    font-size: 20px;
  }

  .sub-value {
    color: #606266;
    font-size: 14px;
    font-weight: 400;
  }
}

// 电表表格样式
.meter-table-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;

  &::-webkit-scrollbar {
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 5px;
    transition: background 0.2s;

    &:hover {
      background: #999;
    }
  }
}

::v-deep .meter-report-table {
  table-layout: auto;

  .el-table__header-wrapper {
    .el-table__header {
      th {
        background: #f5f7fa !important;
        font-weight: 600;
        font-size: 13px;
        padding: 12px 0;

        &.is-group {
          background: #e8f4fd !important;
          color: #3b82f6;
          font-weight: 700;
        }
      }
    }
  }

  .el-table__fixed,
  .el-table__fixed-right {
    &::before {
      background-color: transparent;
    }

    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .el-table__body {
    td {
      font-size: 13px;
      padding: 10px 0;

      &.is-right {
        .cell {
          text-align: right;
          padding-right: 12px;
        }
      }
    }
  }

  &.el-table--border {
    border-color: #e5e7eb;

    th,
    td {
      border-color: #e5e7eb;
    }
  }

  .el-table__body tr:hover>td {
    background-color: #f5f7fa !important;
  }

  .equipment-info-cell {
    padding: 4px 10px;
    text-align: left;
    line-height: 1.45;

    &.is-link {
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: #f0f7ff;
      }
    }
  }

  .eq-title {
    font-weight: 600;
    color: #303133;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .eq-meta {
    font-size: 12px;
    color: #606266;
    margin-top: 2px;
  }

  .eq-tag-row {
    margin-top: 6px;
  }

  .start-end-stack {
    padding: 2px 6px;
    font-size: 12px;
    line-height: 1.55;
    color: #303133;

    &.is-num {
      font-variant-numeric: tabular-nums;
    }

    > div + div {
      margin-top: 4px;
    }
  }

  .se-mark {
    display: inline-block;
    min-width: 18px;
    margin-right: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #3b82f6;
  }

  .merge-metric-cell {
    padding: 2px 10px;
    font-size: 12px;
    line-height: 1.6;
    text-align: left;

    > div + div {
      margin-top: 4px;
    }
  }

  .bind-inline-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 10px;
    line-height: 1.5;

    &.is-link {
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: #f0f7ff;
      }
    }
  }

  .bind-id,
  .bind-name {
    color: #409eff;
    font-size: 12px;
  }

  .power-grid-cell {
    padding: 2px 10px;
    font-size: 12px;
    line-height: 1.6;
    text-align: left;
  }

  .power-total-row {
    margin-bottom: 4px;
  }

  .power-pair-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: 12px;
    align-items: baseline;
  }

  .power-pair-row + .power-pair-row {
    margin-top: 4px;
  }

  .tou-pair {
    display: inline-flex;
    align-items: baseline;
    flex-wrap: nowrap;
    gap: 4px;
    min-width: 0;
    white-space: nowrap;
  }

  .tou-pair .metric-label {
    flex-shrink: 0;
  }

  .tou-pair .metric-value {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .tou-pair .metric-label + .metric-value {
    margin-left: 4px;
  }

  .power-total-row .tou-pair {
    max-width: 100%;
  }

  .metric-label {
    color: #606266;
  }

  .metric-value {
    color: #303133;
    font-weight: 500;
  }

  .metric-value-highlight {
    color: #f56c6c;
  }
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
    margin: 0 0 8px 0;
  }

  .empty-tip {
    font-size: 12px;
    color: #c1c7d0;
  }
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
}

// ========== 响应式设计 ==========
@media (max-width: 1400px) {
  .filter-container {
    flex-direction: column;
    align-items: stretch;

    .filter-item {
      max-width: 100% !important;
    }

    .filter-actions {
      width: 100%;
      justify-content: flex-start;
      margin-left: 0;
    }
  }
}

@media (max-width: 768px) {
  .equipment-power-dashboard {
    padding: 12px;
  }

  .filter-container {
    padding: 16px;
    gap: 16px;
  }

  .table-section {
    padding: 16px;
  }
}
</style>

<style lang="scss">
// ========== 全局样式：自定义日期选择器 ==========
.el-picker-panel {
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
    }

    &:last-child {
      margin-bottom: 0 !important;
    }
  }
}
</style>
