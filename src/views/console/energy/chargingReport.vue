<template>
  <div class="air-report-dashboard">
    <!-- 筛选器 -->
    <div class="filter-container">
      <div class="filter-item date-filter">
        <label class="filter-label">{{ $t('chargingReport.filterStatPeriod') }}</label>
        <el-date-picker
          v-model="queryParams.dateRange"
          type="daterange"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
          range-separator="-"
          :start-placeholder="$t('chargingReport.phDateStart')"
          :end-placeholder="$t('chargingReport.phDateEnd')"
          :picker-options="pickerOptions"
          class="custom-date-picker"
          @change="handleDateRangeChange"
        />
      </div>

      <!-- 租户选择 -->
      <div class="filter-item tenant-filter">
        <label class="filter-label">{{ $t('chargingReport.filterTenant') }}</label>
        <el-select
          v-model="queryParams.tenantId"
          filterable
          :placeholder="$t('chargingReport.phTenant')"
          class="custom-select"
          :loading="tenantLoading"
          clearable
          @change="handleTenantChange"
        >
          <el-option
            v-for="tenant in tenantList"
            :key="tenant.tenantId"
            :label="tenantOptionLabel(tenant)"
            :value="tenant.tenantId"
          />
        </el-select>
      </div>

      <!-- 空调选择 -->
      <div class="filter-item air-filter">
        <label class="filter-label">{{ $t('chargingReport.filterAir') }}</label>
        <el-select
          v-model="queryParams.airId"
          filterable
          :placeholder="$t('chargingReport.phAir')"
          class="custom-select"
          :loading="airLoading"
          clearable
          @change="handleAirChange"
        >
          <el-option
            v-for="air in airList"
            :key="air.airId"
            :label="airOptionLabel(air)"
            :value="air.airId"
          />
        </el-select>
      </div>

      <div class="filter-actions">
        <el-dropdown trigger="hover" @command="handleExportCommand">
          <button
            class="export-btn"
            type="button"
            :disabled="exportLoading || tableData.length === 0"
          >
            <svg
              v-if="!exportLoading"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            <span v-if="exportLoading">{{ $t('chargingReport.exportLoading') }}</span>
            <span v-else>{{ $t('chargingReport.exportReport') }}</span>
            <i class="el-icon-arrow-down" />
          </button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="currentPage">{{ $t('chargingReport.exportCurrentPage') }}</el-dropdown-item>
            <el-dropdown-item command="all">{{ $t('chargingReport.exportAll') }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <!-- 主内容区 -->
    <div
      class="main-content"
      v-loading="loading"
      :element-loading-text="$t('chargingReport.loadingText')"
    >
      <!-- 数据表格区域 -->
      <div class="table-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('chargingReport.sectionTitle') }}</h2>
          <div class="section-tip">
            <i class="el-icon-info"></i>
            <span>{{ $t('chargingReport.sectionTip') }}</span>
          </div>
        </div>

        <!-- 空调用电表格 - 横向日期展示 -->
        <div class="air-table-wrapper" v-if="tableData.length > 0">
          <el-table
            :data="tableData"
            border
            :max-height="600"
            class="air-report-table"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
              textAlign: 'center',
            }"
            :cell-style="{ textAlign: 'center' }"
            :span-method="objectSpanMethod"
          >
            <!-- 固定列 -->
            <el-table-column
              :label="$t('chargingReport.colOutdoor')"
              prop="gateWay"
              width="150"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                {{ $displayBizHybrid(scope.row.gateWay, 200) }}
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('chargingReport.colMeter')"
              prop="serial"
              width="150"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                <el-link
                  type="primary"
                  :underline="false"
                  @click="handleMeterJump(scope.row)"
                >
                  {{ scope.row.serial }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('chargingReport.colMeterTotalKwh')"
              prop="meterUseElec"
              width="120"
              show-overflow-tooltip
            />
            <el-table-column
              :label="$t('chargingReport.colAirName')"
              prop="airName"
              width="150"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                <el-link
                  type="primary"
                  :underline="false"
                  @click="handleAirJump(scope.row)"
                >
                  {{ $displayDynamicName(scope.row.airName, 200) }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('chargingReport.colBindInfo')"
              prop="tenantName"
              width="150"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                <el-link
                  type="primary"
                  :underline="false"
                  @click="handleTenantJump(scope.row)"
                >
                  {{ bindNameDisplay(scope.row.tenantName) }}
                </el-link>
              </template>
            </el-table-column>

            <!-- 汇总列组 -->
            <el-table-column :label="$t('chargingReport.summaryGroup')" align="center">
              <el-table-column :label="$t('chargingReport.colTotalTime')" min-width="120" align="right">
                <template slot-scope="scope">
                  <span style="color: #f56c6c">
                    {{ formatTime(scope.row.totalTime) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('chargingReport.colTotalKwh')" min-width="120" align="right">
                <template slot-scope="scope">
                  <span style="color: #f56c6c">
                    {{ formatNumber(scope.row.useElec) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                v-if="nanduSysElecEnabled"
                :label="$t('chargingReport.colTotalSysKwh')"
                min-width="130"
                align="right"
              >
                <template slot-scope="scope">
                  <span style="color: #f56c6c">
                    {{ formatNumber(scope.row.sysElec) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('chargingReport.colTotalFee')" min-width="120" align="right">
                <template slot-scope="scope">
                  <span style="color: #f56c6c">
                    {{ formatNumber(scope.row.balance) }}
                  </span>
                </template>
              </el-table-column>
            </el-table-column>

            <!-- 动态日期列组 - 循环渲染每一天 -->
            <el-table-column
              v-for="date in dateColumns"
              :key="date.value"
              :label="date.label"
              align="center"
            >
              <el-table-column
                :label="dateSubColLabel(date, 'time')"
                min-width="110"
                align="right"
              >
                <template slot-scope="scope">
                  {{ getDateValue(scope.row, date.value, "time") }}
                </template>
              </el-table-column>
              <el-table-column
                :label="dateSubColLabel(date, 'elec')"
                min-width="110"
                align="right"
              >
                <template slot-scope="scope">
                  {{ getDateValue(scope.row, date.value, "elec") }}
                </template>
              </el-table-column>
              <el-table-column
                v-if="nanduSysElecEnabled"
                min-width="132"
                header-align="center"
                align="right"
              >
                <template slot="header">
                  <div class="sys-elec-col-head">
                    <span class="sys-elec-col-head__date">{{ date.label }}</span>
                    <span class="sys-elec-col-head__label">{{ $t('chargingReport.sysElecSubHead') }}</span>
                  </div>
                </template>
                <template slot-scope="scope">
                  {{ getDateValue(scope.row, date.value, "sysElec") }}
                </template>
              </el-table-column>
              <el-table-column
                :label="dateSubColLabel(date, 'fee')"
                min-width="110"
                align="right"
              >
                <template slot-scope="scope">
                  {{ getDateValue(scope.row, date.value, "balance") }}
                </template>
              </el-table-column>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-container" v-if="tableData.length > 0">
          <el-pagination
            :current-page="pageData.current"
            :page-sizes="[10, 20, 50, 100, 500]"
            :page-size="pageData.size"
            :total="pageData.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="!loading && tableData.length === 0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <p>{{ $t('chargingReport.emptyNoData') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { listAirUse } from '@/api/airReport'
import { getSimpleTenantList } from '@/api/useReport'
import moment from 'moment'
import * as XLSX from 'xlsx'

// 导出全部的单次上限（与后端分页参数对应）
const EXPORT_ALL_LIMIT = 2000

export default {
  name: 'AirReport',
  data () {
    return {
      queryParams: {
        dateRange: [],
        tenantId: '',
        airId: ''
      },
      tenantList: [],
      airList: [],
      tenantLoading: false,
      airLoading: false,
      loading: false,
      exportLoading: false,
      tableData: [],
      dateColumns: [],
      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      spanArr: [] // 合并单元格数组
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId', 'isAirSysElecManager']),
    /** 是否展示系统总电量 / 分日 sysElec（由 getAirSysElecCoefKeys 白名单决定） */
    nanduSysElecEnabled () {
      return this.isAirSysElecManager(this.currentManagerId)
    },
    pickerOptions () {
      const t = (k) => this.$t(`chargingReport.${k}`)
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
    }
  },
  watch: {
    currentManagerId: {
      async handler (val, oldVal) {
        if (!val) return
        // 切换管理方：清空租户/空调筛选与表格，避免沿用上一管理方的 ID（仍保留日期范围）
        const switched =
          oldVal !== undefined &&
          oldVal !== null &&
          String(oldVal) !== '' &&
          String(oldVal) !== String(val)
        if (switched) {
          this.queryParams.tenantId = ''
          this.queryParams.airId = ''
          this.tableData = []
          this.dateColumns = []
          this.spanArr = []
          this.pageData.current = 1
          this.pageData.total = 0
        }
        await this.initializeData()
      },
      immediate: true
    }
  },
  methods: {
    tenantOptionLabel (tenant) {
      if (!tenant) return ''
      const n = tenant.name != null && tenant.name !== '' ? String(tenant.name) : ''
      return n ? `${this.$displayBizHybrid(n, 200)}` : String(tenant.tenantId != null ? tenant.tenantId : '')
    },
    airOptionLabel (air) {
      if (!air) return ''
      const n = air.airName != null && air.airName !== '' ? String(air.airName) : ''
      return n ? `${this.$displayDynamicName(n, 200)}` : String(air.airId != null ? air.airId : '')
    },
    bindNameDisplay (name) {
      if (name == null || name === '' || name === '-') return '-'
      return this.$displayBizHybrid(String(name), 200)
    },
    dateSubColLabel (date, kind) {
      const lab = date.shortLabel || date.label || ''
      const suf =
        kind === 'time'
          ? this.$t('chargingReport.suffixDuration')
          : kind === 'elec'
            ? this.$t('chargingReport.suffixElec')
            : kind === 'sysElec'
              ? this.$t('chargingReport.suffixSysElec')
              : this.$t('chargingReport.suffixFee')
      return `${lab}${suf}`
    },

    async initializeData () {
      // 从路由获取参数
      const { tenantId, airId, startDate, endDate, deviceName } = this.$route.query

      if (startDate && endDate) {
        this.queryParams.dateRange = [startDate, endDate]
      } else {
        this.setDefaultDateRange()
      }

      // 获取租户列表
      await this.getTenantList()

      if (tenantId) {
        const targetTenantId = Number(tenantId) || tenantId
        const tenant = this.tenantList.find((t) => t.tenantId == targetTenantId)
        if (tenant) this.queryParams.tenantId = tenant.tenantId
      } else if (!this.queryParams.tenantId && this.tenantList && this.tenantList.length > 0) {
        this.queryParams.tenantId = this.tenantList[0].tenantId
      }

      // 获取空调列表
      await this.getAirList()

      if (airId) {
        const targetAirId = Number(airId) || airId
        const air = this.airList.find((a) => a.airId == targetAirId)
        if (air) {
          this.queryParams.airId = air.airId
        }
      } else if (deviceName) {
        // 如果没有airId但有deviceName，尝试通过名称匹配
        const air = this.airList.find((a) => a.airName == deviceName)
        if (air) {
          this.queryParams.airId = air.airId
        }
      } else if (!this.queryParams.airId && this.airList && this.airList.length > 0) {
        this.queryParams.airId = this.airList[0].airId
      }

      // 查询数据
      this.fetchData()
    },

    setDefaultDateRange () {
      this.queryParams.dateRange = [
        moment().startOf('month').format('YYYY-MM-DD'),
        moment().format('YYYY-MM-DD')
      ]
    },

    async getTenantList () {
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0
        })
        this.tenantList = data || []
      } catch (error) {
        this.$apiError.notify(error, this.$t('chargingReport.msgTenantListFail'))
        console.error('获取租户列表失败:', error)
      } finally {
        this.tenantLoading = false
      }
    },

    async getAirList () {
      this.airLoading = true
      try {
        // ⭐ 添加日期范围检查
        if (
          !this.queryParams.dateRange ||
          this.queryParams.dateRange.length !== 2
        ) {
          this.airList = []
          return
        }

        const params = {
          managerId: this.currentManagerId,
          beginTime: this.queryParams.dateRange[0],
          endTime: this.queryParams.dateRange[1],
          page: {
            current: 1,
            size: 200
          }
        }

        if (this.queryParams.tenantId) {
          params.tenantId = this.queryParams.tenantId
        }

        const { data } = await listAirUse(params)

        if (data && data.dataList) {
          const airMap = new Map()
          data.dataList.forEach((item) => {
            if (item.airId && item.airName) {
              airMap.set(item.airId, {
                airId: item.airId,
                airName: item.airName
              })
            }
          })
          this.airList = Array.from(airMap.values())
        } else {
          this.airList = []
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('chargingReport.msgAirListFail'))
        console.error('获取空调列表失败:', error)
      } finally {
        this.airLoading = false
      }
    },

    handleDateRangeChange (val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        const [start, end] = val
        const startDate = new Date(start)
        const endDate = new Date(end)
        const diffDays = Math.floor((endDate - startDate) / (24 * 3600 * 1000))

        // 限制最多选择31天
        if (diffDays > 30) {
          this.$message.warning(this.$t('chargingReport.msgDateMax31'))
          const newEndDate = new Date(
            startDate.getTime() + 30 * 24 * 3600 * 1000
          )
          this.queryParams.dateRange = [
            start,
            moment(newEndDate).format('YYYY-MM-DD')
          ]
          return
        }

        // 日期变更时重新获取空调列表和数据
        this.getAirList()
        this.fetchData()
      }
    },

    async handleTenantChange () {
      // 租户变更时清空空调选择并重新获取空调列表和数据
      this.queryParams.airId = ''
      await this.getAirList()
      this.fetchData()
    },

    handleAirChange () {
      // 空调变更时直接查询
      this.fetchData()
    },

    buildQueryParams (size, current) {
      const params = {
        managerId: this.currentManagerId,
        beginTime: this.queryParams.dateRange[0],
        endTime: this.queryParams.dateRange[1],
        page: {
          current,
          size
        }
      }
      if (this.queryParams.tenantId) {
        params.tenantId = this.queryParams.tenantId
      }
      if (this.queryParams.airId) {
        params.airId = this.queryParams.airId
      }
      return params
    },

    async fetchData () {
      if (
        !this.queryParams.dateRange ||
        this.queryParams.dateRange.length !== 2
      ) {
        return
      }

      this.loading = true
      try {
        const params = this.buildQueryParams(this.pageData.size, this.pageData.current)

        const { data } = await listAirUse(params)

        if (data && data.dataList) {
          this.processTableData(data.dataList)
          this.pageData.total = data.total || 0
        } else {
          this.tableData = []
          this.dateColumns = []
          this.pageData.total = 0
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('chargingReport.msgFetchFail'))
        console.error('获取数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 处理表格数据
    buildTableRows (dataList) {
      return dataList.map((item) => {
        // 创建日期数据映射
        const dateDataMap = {}
        if (item.settleAirDateDtoList && item.settleAirDateDtoList.length > 0) {
          item.settleAirDateDtoList.forEach((dateItem) => {
            dateDataMap[dateItem.date] = {
              totalTime: dateItem.totalTime || 0,
              useElec: dateItem.useElec || 0,
              balance: dateItem.balance || 0,
              sysElec: dateItem.sysElec != null && dateItem.sysElec !== '' ? Number(dateItem.sysElec) : null
            }
          })
        }

        return {
          gatewayId: item.gatewayId,
          gateWay: item.gateWay || '-',
          serial: item.serial || '-',
          meterUseElec: item.meterUseElec || 0,
          tenantName: item.tenantName,
          tenantId: item.tenantId,
          bindType: item.bindType,
          airId: item.airId,
          airName: item.airName || '-',
          totalTime: item.totalTime || 0,
          useElec: item.useElec || 0,
          sysElec: item.sysElec != null && item.sysElec !== '' ? Number(item.sysElec) : null,
          balance: item.balance || 0,
          dateDataMap
        }
      })
    },

    processTableData (dataList) {
      // 生成日期列
      this.generateDateColumns()

      // 处理表格数据
      this.tableData = this.buildTableRows(dataList)

      this.calculateSpanData()
    },

    calculateSpanData () {
      this.spanArr = []
      let contactDot = 0
      this.tableData.forEach((item, index) => {
        if (index === 0) {
          this.spanArr.push(1)
          contactDot = 0
        } else {
          if (
            item.gatewayId &&
            this.tableData[index - 1].gatewayId &&
            item.gatewayId === this.tableData[index - 1].gatewayId
          ) {
            this.spanArr[contactDot] += 1
            this.spanArr.push(0)
          } else {
            this.spanArr.push(1)
            contactDot = index
          }
        }
      })
    },

    objectSpanMethod ({ row, column, rowIndex, columnIndex }) {
      if (columnIndex === 0 || columnIndex === 1 || columnIndex === 2) {
        const _row = this.spanArr[rowIndex]
        const _col = _row > 0 ? 1 : 0
        return {
          rowspan: _row,
          colspan: _col
        }
      }
    },

    handleMeterJump (row) {
      if (!row.serial) return
      this.$router.push({
        path: '/device/electricity',
        query: {
          serial: row.serial,
          autoSearch: 'true'
        }
      })
    },

    handleAirJump (row) {
      if (!row.airId) return
      this.$router.push({
        path: '/device/conditioning',
        query: {
          deviceName: row.airName
        }
      })
    },

    handleTenantJump (row) {
      if (!row.tenantId) return

      if (row.bindType === 2) {
        this.$router.push({
          path: '/metering/fee/electricitySharing/detail',
          query: {
            id: row.tenantId
          }
        })
      } else {
        this.$router.push({
          path: '/metering/tenant/detail/' + row.tenantId
        })
      }
    },

    // 生成日期列配置
    generateDateColumns () {
      if (
        !this.queryParams.dateRange ||
        this.queryParams.dateRange.length !== 2
      ) {
        this.dateColumns = []
        return
      }

      const [start, end] = this.queryParams.dateRange
      const startDate = moment(start)
      const endDate = moment(end)
      const columns = []

      const current = startDate.clone()
      while (current.isSameOrBefore(endDate)) {
        columns.push({
          value: current.format('YYYY-MM-DD'),
          label: current.format('MM/DD'),
          shortLabel: current.format('MM/DD')
        })
        current.add(1, 'day')
      }

      this.dateColumns = columns
    },

    // 获取指定日期的数据
    getDateValue (row, date, type) {
      // 如果没有该日期的数据,返回0
      if (!row.dateDataMap || !row.dateDataMap[date]) {
        return type === 'time' ? `0.00${this.$t('chargingReport.unitHours')}` : '0.00'
      }

      const dateData = row.dateDataMap[date]

      switch (type) {
        case 'time':
          return this.formatTime(dateData.totalTime)
        case 'elec':
          return this.formatNumber(dateData.useElec)
        case 'sysElec':
          return this.formatNumber(dateData.sysElec)
        case 'balance':
          return this.formatNumber(dateData.balance)
        default:
          return '0.00'
      }
    },

    // ==================== 导出功能 ====================
    handleExportCommand (command) {
      if (command === 'currentPage') this.exportCurrentPage()
      else if (command === 'all') this.exportAll()
    },

    exportCurrentPage () {
      if (this.exportLoading) return
      if (!this.tableData || this.tableData.length === 0) {
        this.$message.warning(this.$t('chargingReport.msgExportEmpty'))
        return
      }

      this.exportLoading = true
      try {
        this.exportAirReport(this.tableData)
        this.$message.success(this.$t('chargingReport.msgExportOk'))
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error(`${this.$t('chargingReport.msgExportFail')}: ${error.message || this.$t('chargingReport.msgExportRetry')}`)
      } finally {
        this.exportLoading = false
      }
    },

    async exportAll () {
      if (this.exportLoading) return
      if (
        !this.queryParams.dateRange ||
        this.queryParams.dateRange.length !== 2
      ) {
        this.$message.warning(this.$t('chargingReport.msgExportEmpty'))
        return
      }

      this.exportLoading = true
      const loading = this.$loading({
        lock: true,
        text: this.$t('chargingReport.exportLoading'),
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.3)'
      })
      try {
        // 与查询保持一致的分页方式：循环拉取，每次请求都携带租户/空调筛选，
        // 避免单次超大 size 触发后端分页上限导致筛选条件丢失。
        const pageSize = Math.min(500, EXPORT_ALL_LIMIT)
        const allList = []
        let total = 0
        let current = 1
        while (allList.length < EXPORT_ALL_LIMIT) {
          const params = this.buildQueryParams(pageSize, current)
          const { data } = await listAirUse(params)
          const list = data && data.dataList ? data.dataList : []
          if (current === 1) total = data && data.total ? data.total : 0
          if (list.length === 0) break
          allList.push(...list)
          if (list.length < pageSize) break
          current += 1
        }

        const rawList = allList.slice(0, EXPORT_ALL_LIMIT)
        if (rawList.length === 0) {
          this.$message.warning(this.$t('chargingReport.msgExportEmpty'))
          return
        }

        this.generateDateColumns()
        const rows = this.buildTableRows(rawList)
        this.exportAirReport(rows)

        if (total > EXPORT_ALL_LIMIT) {
          this.$message.success(this.$t('chargingReport.msgExportLimit', { total, count: rows.length }))
        } else {
          this.$message.success(this.$t('chargingReport.msgExportOk'))
        }
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error(`${this.$t('chargingReport.msgExportFail')}: ${error.message || this.$t('chargingReport.msgExportRetry')}`)
      } finally {
        loading.close()
        this.exportLoading = false
      }
    },

    exportAirReport (rows = this.tableData) {
      const t = (k) => this.$t(`chargingReport.${k}`)
      const sys = this.nanduSysElecEnabled
      const summarySpan = sys ? 4 : 3
      const dateSpan = sys ? 4 : 3

      const tenant = this.tenantList.find(
        (x) => x.tenantId === this.queryParams.tenantId
      )
      const tenantName = tenant
        ? (tenant.name ? this.$displayBizHybrid(String(tenant.name), 200) : String(tenant.tenantId))
        : t('tenantAll')

      const air = this.airList.find((a) => a.airId === this.queryParams.airId)
      const airName = air
        ? (air.airName ? this.$displayDynamicName(String(air.airName), 200) : String(air.airId))
        : t('airAll')

      const filterRow = [
        this.$t('chargingReport.exportFilterLine', {
          start: this.queryParams.dateRange[0],
          end: this.queryParams.dateRange[1],
          tenant: tenantName,
          air: airName
        })
      ]

      const header1 = [
        t('expColOutdoor'),
        t('expColMeter'),
        t('expColMeterTotal'),
        t('expColAirName'),
        t('expColBind'),
        t('expSummary'),
        ...Array.from({ length: summarySpan - 1 }, () => ''),
        ...this.dateColumns.flatMap((date) => [
          date.label,
          ...Array.from({ length: dateSpan - 1 }, () => '')
        ])
      ]

      const summaryHeader2 = sys
        ? [t('expTotalTime'), t('expTotalKwh'), t('expTotalSysKwh'), t('expTotalFee')]
        : [t('expTotalTime'), t('expTotalKwh'), t('expTotalFee')]

      const header2 = [
        '',
        '',
        '',
        '',
        '',
        ...summaryHeader2,
        ...this.dateColumns.flatMap((date) => {
          const parts = [
            this.dateSubColLabel(date, 'time'),
            this.dateSubColLabel(date, 'elec')
          ]
          if (sys) parts.push(this.dateSubColLabel(date, 'sysElec'))
          parts.push(this.dateSubColLabel(date, 'fee'))
          return parts
        })
      ]

      const dataRows = rows.map((row) => {
        const baseData = [
          this.$displayBizHybrid(row.gateWay || '', 200),
          row.serial,
          this.formatExportNumber(row.meterUseElec),
          this.$displayDynamicName(row.airName || '', 200),
          row.tenantName ? this.$displayBizHybrid(String(row.tenantName), 200) : '-',
          this.formatTime(row.totalTime),
          this.formatExportNumber(row.useElec),
          ...(sys ? [this.formatExportNumber(row.sysElec)] : []),
          this.formatExportNumber(row.balance)
        ]

        const dateData = this.dateColumns.flatMap((date) => {
          if (!row.dateDataMap || !row.dateDataMap[date.value]) {
            return Array.from({ length: dateSpan }, () => '')
          }
          const data = row.dateDataMap[date.value]
          const parts = [
            this.formatTime(data.totalTime),
            this.formatExportNumber(data.useElec)
          ]
          if (sys) parts.push(this.formatExportNumber(data.sysElec))
          parts.push(this.formatExportNumber(data.balance))
          return parts
        })

        return [...baseData, ...dateData]
      })

      const wsData = [filterRow, [], header1, header2, ...dataRows]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      const colWidths = [
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        ...Array.from({ length: summarySpan }, () => ({ wch: 14 })),
        ...this.dateColumns.flatMap(() =>
          Array.from({ length: dateSpan }, () => ({ wch: 12 }))
        )
      ]
      ws['!cols'] = colWidths

      const firstDateCol = 5 + summarySpan
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: header1.length - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
        { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
        { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
        { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
        { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } },
        { s: { r: 2, c: 5 }, e: { r: 2, c: 5 + summarySpan - 1 } }
      ]

      this.dateColumns.forEach((date, index) => {
        const startCol = firstDateCol + index * dateSpan
        merges.push({
          s: { r: 2, c: startCol },
          e: { r: 2, c: startCol + dateSpan - 1 }
        })
      })

      ws['!merges'] = merges

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('chargingReport.exportSheetName'))

      const fileName = this.generateFileName(this.$t('chargingReport.exportFilePrefix'))
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

    // ==================== 格式化方法 ====================
    formatNumber (num) {
      if (num === undefined || num === null || num === '') {
        return '0.00'
      }
      return Number(num).toFixed(2)
    },

    // 格式化时长（秒 -> 小时）
    formatTime (seconds) {
      if (seconds === undefined || seconds === null || seconds === '') {
        return `0.00${this.$t('chargingReport.unitHours')}`
      }
      const hours = (seconds / 3600).toFixed(2)
      return `${hours}${this.$t('chargingReport.unitHours')}`
    },

    // 分页大小变化
    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchData()
    },

    // 当前页变化
    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchData()
    }
  }
}
</script>

<style lang="scss" scoped>
.air-report-dashboard {
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
  &.air-filter {
    max-width: 360px;
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

// 空调表格样式
.air-table-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;

  // 优化滚动性能
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;

  // 横向滚动条样式
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

::v-deep .air-report-table {
  // 表格性能优化
  table-layout: auto;

  .el-table__header-wrapper {
    .el-table__header {
      th {
        background: #f5f7fa !important;
        font-weight: 600;
        font-size: 13px;
        padding: 12px 0;

        // 日期列组特殊样式
        &.is-group {
          background: #e8f4fd !important;
          color: #3b82f6;
          font-weight: 700;
        }

        // 系统电量子列表头：两行垂直居中，与表头其它列同色
        .sys-elec-col-head {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          width: 100%;
          margin: 0 auto;
          line-height: 1.3;
          color: #606266;

          &__date {
            font-weight: 700;
            font-size: 13px;
            white-space: nowrap;
          }

          &__label {
            font-weight: 600;
            font-size: 12px;
            white-space: nowrap;
          }
        }
      }
    }
  }

  // 固定列阴影优化
  .el-table__fixed,
  .el-table__fixed-right {
    &::before {
      background-color: transparent;
    }

    // 添加固定列右侧阴影
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  // 单元格样式
  .el-table__body {
    td {
      font-size: 13px;
      padding: 10px 0;

      // 数值右对齐
      &.is-right {
        .cell {
          text-align: right;
          padding-right: 12px;
        }
      }
    }
  }

  // 边框样式
  &.el-table--border {
    border-color: #e5e7eb;

    th,
    td {
      border-color: #e5e7eb;
    }
  }

  // 行悬停效果
  .el-table__body tr:hover > td {
    background-color: #f5f7fa !important;
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
    margin: 0;
  }
}

// 分页容器
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0 0;
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
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
  .air-report-dashboard {
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
