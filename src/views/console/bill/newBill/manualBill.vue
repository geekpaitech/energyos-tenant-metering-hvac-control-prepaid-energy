<template>
  <div class="table-page-container">
    <div class="search-box">
      <el-form
        :model="queryData"
        ref="searchForm"
        class="search-form"
        @submit.native.prevent
        @keyup.enter.native="handleSearch"
      >
        <div class="search-main-grid">
          <div class="field-item">
            <el-date-picker
              v-model="queryData.timeRange"
              type="daterange"
              range-separator="-"
              :start-placeholder="$t('manualBillPage.phDateStart')"
              :end-placeholder="$t('manualBillPage.phDateEnd')"
              size="small"
              value-format="yyyy-MM-dd"
              clearable
              style="width: 100%"
              :picker-options="pickerOptions"
              @change="handleSearch"
              @clear="handleSearch"
            />
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.name"
              :placeholder="$t('manualBillPage.phTenant')"
              clearable
              filterable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="item in tenantList"
                :key="item.id"
                :label="String(item.id) + ' - ' + $displayBizHybrid(item.value || '')"
                :value="item.id"
              />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.useType"
              :placeholder="$t('manualBillPage.phBillType')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('manualBillPage.billTypeElectric')" value="2" />
              <el-option :label="$t('manualBillPage.billTypeWater')" value="0" />
              <el-option :label="$t('manualBillPage.billTypeService')" value="7" />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.settleWay"
              :placeholder="$t('manualBillPage.phSettleWay')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('manualBillPage.settleWay1')" value="1" />
            </el-select>
          </div>
          <div class="field-item pay-type-field">
            <el-select
              v-model="queryData.payType"
              :placeholder="$t('manualBillPage.phPayType')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('manualBillPage.optPayPrepaid')" :value="0" />
              <el-option :label="$t('manualBillPage.optPayPostpaid')" :value="1" />
            </el-select>
          </div>
          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('manualBillPage.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('manualBillPage.btnReset') }}</el-button>
            <el-dropdown trigger="hover" @command="handleExportCommand">
              <el-button type="success" size="small" icon="el-icon-download">
                {{ $t('manualBillPage.btnExport') }}<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="currentPage">{{ $t('manualBillPage.exportCurrentPage') }}</el-dropdown-item>
                <el-dropdown-item command="selected">{{ $t('manualBillPage.exportSelected') }}</el-dropdown-item>
                <el-dropdown-item command="all">{{ $t('manualBillPage.exportAll') }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </el-form>
    </div>

    <div class="statistics-container">
      <div class="statistics-card-wrap">
        <div class="statistics-inner">
          <div class="stat-flex-cell">
            <el-tooltip placement="bottom" :disabled="!hasElectricityDetail" popper-class="statistics-tooltip">
              <div slot="content">
                <div class="tooltip-item">
                  <span class="tooltip-label">{{ $t('manualBillPage.tooltipMeterElec') }}</span>
                  <span class="tooltip-value">¥{{ formatAmount(statisticsData.表计电费) }}</span>
                </div>
                <div class="tooltip-item">
                  <span class="tooltip-label">{{ $t('manualBillPage.tooltipOtherElec') }}</span>
                  <span class="tooltip-value">¥{{ formatAmount(statisticsData.其他电费) }}</span>
                </div>
                <div class="tooltip-divider"></div>
                <div class="tooltip-item tooltip-total">
                  <span class="tooltip-label">{{ $t('manualBillPage.tooltipTotal') }}</span>
                  <span class="tooltip-value">¥{{ getElectricityTotal }}</span>
                </div>
              </div>
              <div class="stat-item primary">
                <div class="stat-icon electricity">
                  <img :src="require('@/assets/images/electricity.png')" alt="">
                </div>
                <div class="stat-content">
                  <div class="stat-label">{{ $t('manualBillPage.statOtherElectricity') }}</div>
                  <div class="stat-value">
                    <span class="currency">¥</span>{{ getElectricityTotal }}
                  </div>
                </div>
              </div>
            </el-tooltip>
          </div>
          <div class="stat-flex-cell">
            <el-tooltip placement="bottom" :disabled="!hasWaterDetail" popper-class="statistics-tooltip">
              <div slot="content">
                <div class="tooltip-item">
                  <span class="tooltip-label">{{ $t('manualBillPage.tooltipMeterWater') }}</span>
                  <span class="tooltip-value">¥{{ formatAmount(statisticsData.表计水费) }}</span>
                </div>
                <div class="tooltip-item">
                  <span class="tooltip-label">{{ $t('manualBillPage.tooltipOtherWater') }}</span>
                  <span class="tooltip-value">¥{{ formatAmount(statisticsData.其他水费) }}</span>
                </div>
                <div class="tooltip-divider"></div>
                <div class="tooltip-item tooltip-total">
                  <span class="tooltip-label">{{ $t('manualBillPage.tooltipTotal') }}</span>
                  <span class="tooltip-value">¥{{ getWaterTotal }}</span>
                </div>
              </div>
              <div class="stat-item primary">
                <div class="stat-icon water">
                  <img :src="require('@/assets/images/waterate.png')" alt="">
                </div>
                <div class="stat-content">
                  <div class="stat-label">{{ $t('manualBillPage.statOtherWater') }}</div>
                  <div class="stat-value">
                    <span class="currency">¥</span>{{ getWaterTotal }}
                  </div>
                </div>
              </div>
            </el-tooltip>
          </div>
          <div class="stat-flex-cell">
            <div class="stat-item primary">
              <div class="stat-icon service">
                <i class="el-icon-s-data"></i>
              </div>
              <div class="stat-content">
                <div class="stat-label">{{ $t('manualBillPage.statServiceFee') }}</div>
                <div class="stat-value">
                  <span class="currency">¥</span>{{ getServiceFeeTotal }}
                </div>
              </div>
            </div>
          </div>
          <div class="stat-flex-cell">
            <div class="stat-item total">
              <div class="stat-icon total-icon">
                <i class="el-icon-s-finance"></i>
              </div>
              <div class="stat-content">
                <div class="stat-label">{{ $t('manualBillPage.statGrandTotal') }}</div>
                <div class="stat-value">
                  <span class="currency">¥</span>{{ getTotalAmount }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            {{ $t('manualBillPage.sectionTitle') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option :label="$t('manualBillPage.sortDefault')" value="default" />
          </el-select>
        </div>
      </div>

      <div class="list-view">
        <div v-if="selectedData.length > 0" class="table-toolbar">
          <span class="selection-info" v-html="$t('manualBillPage.selectedLine', { count: selectedData.length })" />
        </div>

        <el-table
          v-loading="loading"
          border
          :data="tableData"
          row-key="rid"
          :max-height="tableMaxHeight"
          stripe
          style="width: 100%"
          class="custom-table light-border-table"
          @selection-change="handleSelectionChange"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <el-table-column type="selection" width="55" align="center" reserve-selection />

          <el-table-column
            v-for="col in displayColumns"
            :key="col.key"
            :prop="col.key"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :align="getColumnAlign(col.key)"
            :header-align="getColumnAlign(col.key)"
            :show-overflow-tooltip="true"
          >
            <template slot-scope="scope">
              <template v-if="col.key === 'rid'">
                <el-link type="primary" class="rid-link" @click="handleDetail(scope.row)">
                  {{ scope.row.rid || '-' }}
                </el-link>
              </template>

              <template v-else-if="col.key === 'tenantInfo'">
                <el-link
                  type="primary"
                  class="tenant-link"
                  :title="$displayBizHybrid(scope.row.tenantName || '', 200)"
                  @click="handleTenantDetail(scope.row)"
                >
                  <i class="el-icon-user"></i>
                  {{ $displayBizHybrid(scope.row.tenantName || '') || '-' }}
                </el-link>
              </template>

              <template v-else-if="col.key === 'payType'">
                <el-tag :type="getPayTypeTagType(scope.row.payType)" size="small" effect="plain">
                  {{ getPayTypeLabel(scope.row.payType) }}
                </el-tag>
              </template>

              <template v-else-if="col.key === 'billType'">
                <el-tag :type="getBillTypeTagType(scope.row.useType)" size="small" effect="plain">
                  {{ getBillTypeLabel(scope.row.useType) }}
                </el-tag>
              </template>

              <template v-else-if="col.key === 'settleWay'">
                <el-tag :type="getSettleWayType(scope.row.settleWay)" size="small" effect="plain">
                  {{ getSettleWayLabel(scope.row.settleWay) }}
                </el-tag>
              </template>

              <template v-else-if="col.key === 'balance'">
                <span>{{ formatBalance(scope.row.balance) }}</span>
              </template>

              <template v-else-if="col.key === 'payStatus'">
                <div class="status-wrapper">
                  <span
                    class="status-dot"
                    :class="Number(scope.row.payStatus) === 1 ? 'online' : 'offline'"
                  />
                  {{ Number(scope.row.payStatus) === 1 ? $t('manualBillPage.payPaid') : $t('manualBillPage.payUnpaid') }}
                </div>
              </template>

              <template v-else-if="col.key === 'discountAmt'">
                <span>{{ formatBalance(scope.row.discountAmt) }}</span>
              </template>

              <template v-else-if="col.key === 'realAmt'">
                <span>{{ formatBalance(scope.row.realAmt) }}</span>
              </template>

              <template v-else-if="col.key === 'status'">
                <div class="status-wrapper">
                  <span
                    class="status-dot"
                    :style="{ backgroundColor: getInvoiceStatusColor(scope.row.status) }"
                  />
                  {{ getInvoiceStatusLabel(scope.row.status) }}
                </div>
              </template>

              <template v-else>
                {{ scope.row[col.key] || '-' }}
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('manualBillPage.colDetail')" width="100" fixed="right" align="center" :resizable="false">
            <template slot-scope="scope">
              <el-button type="text" size="mini" class="op-btn primary-btn" @click="handleDetail(scope.row)">
                {{ $t('manualBillPage.btnDetail') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container compact-pagination">
          <el-pagination
            :current-page="pageData.current"
            :page-sizes="[15, 30, 60, 100]"
            :page-size="pageData.size"
            :total="pageData.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <BillDetailDrawer :detailDrawer="detailDrawer" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  settlePageTenantDailyBill,
  settleSettleTenantStatistics
} from '@/api/settle'
import { tenantPageTenant } from '@/api/tenant'
import * as XLSX from 'xlsx'
import BillDetailDrawer from '../components/BillDetailDrawer.vue'

// 导出全部单次上限（与电表页一致）
const EXPORT_ALL_LIMIT = 2000

export default {
  name: 'ManualBillPage',
  components: {
    BillDetailDrawer
  },
  data () {
    return {
      sortOrder: 'default',
      columnDefs: [
        { key: 'rid', width: '150', checked: true },
        { key: 'occurDate', width: '120', checked: true },
        { key: 'createTime', width: '160', checked: true },
        { key: 'tenantInfo', width: '200', checked: true, disabled: true },
        { key: 'payType', width: '100', checked: true },
        { key: 'billType', width: '120', checked: true },
        { key: 'settleWay', width: '120', checked: true },
        { key: 'balance', width: '120', checked: true },
        { key: 'payStatus', width: '100', checked: true },
        { key: 'discountAmt', width: '130', checked: true },
        { key: 'realAmt', width: '120', checked: true },
        { key: 'status', width: '100', checked: true }
      ],
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68
      },
      queryData: {
        name: null,
        tenantId: '',
        useType: null,
        payType: null,
        payStatus: '',
        withdrawStatus: '',
        settleWay: null,
        status: '',
        managerId: '',
        timeRange: []
      },
      tenantList: [],
      // 表格数据
      tableData: [],
      // 统计数据
      statisticsData: {
        表计电费: 0,
        其他电费: 0,
        表计水费: 0,
        其他水费: 0,
        服务费: 0
      },
      loading: false,
      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      // 选中的数据
      selectedData: [],
      // 导出全部遮罩防重
      exportAllLoading: false,
      // 详情抽屉
      detailDrawer: {
        show: false,
        id: '',
        tenantId: '',
        settleWay: '',
        useType: '',
        floatId: ''
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    pickerOptions () {
      return {
        shortcuts: [
          {
            text: this.$t('manualBillPage.shortcut7d'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 6)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: this.$t('manualBillPage.shortcut15d'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 14)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: this.$t('manualBillPage.shortcut30d'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: this.$t('manualBillPage.shortcutThisMonth'),
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
            text: this.$t('manualBillPage.shortcutLastMonth'),
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
    tableKey () {
      const labelKeyByCol = {
        rid: 'colRid',
        occurDate: 'colOccurDate',
        createTime: 'colCreateDate',
        tenantInfo: 'colTenantInfo',
        payType: 'colPayType',
        billType: 'colBillType',
        settleWay: 'colSettleWay',
        balance: 'colBalance',
        payStatus: 'colPayStatus',
        discountAmt: 'colDiscountAmt',
        realAmt: 'colRealAmt',
        status: 'colStatus'
      }
      return this.columnDefs.map((col) => ({
        ...col,
        label: this.$t(`manualBillPage.${labelKeyByCol[col.key]}`)
      }))
    },
    // 计算需要显示的列
    displayColumns () {
      return this.tableKey.filter((col) => col.checked !== false)
    },
    tableMaxHeight () {
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    },
    // 计算电费合计
    getElectricityTotal () {
      const meterElec = parseFloat(this.statisticsData.表计电费) || 0
      const otherElec = parseFloat(this.statisticsData.其他电费) || 0
      return (meterElec + otherElec).toFixed(2)
    },
    // 计算水费合计
    getWaterTotal () {
      const meterWater = parseFloat(this.statisticsData.表计水费) || 0
      const otherWater = parseFloat(this.statisticsData.其他水费) || 0
      return (meterWater + otherWater).toFixed(2)
    },
    // 获取服务费
    getServiceFeeTotal () {
      return this.formatAmount(this.statisticsData.服务费)
    },
    // 计算总合计（电费+水费+其他）
    getTotalAmount () {
      const electricity = parseFloat(this.getElectricityTotal) || 0
      const water = parseFloat(this.getWaterTotal) || 0
      const service = parseFloat(this.statisticsData.服务费) || 0
      return (electricity + water + service).toFixed(2)
    },
    // 判断是否有电费详细信息
    hasElectricityDetail () {
      const meterElec = parseFloat(this.statisticsData.表计电费) || 0
      const otherElec = parseFloat(this.statisticsData.其他电费) || 0
      return meterElec > 0 || otherElec > 0
    },
    // 判断是否有水费详细信息
    hasWaterDetail () {
      const meterWater = parseFloat(this.statisticsData.表计水费) || 0
      const otherWater = parseFloat(this.statisticsData.其他水费) || 0
      return meterWater > 0 || otherWater > 0
    }
  },
  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          this.setDefaultTimeRange()
          this.fetchTableData()
          this.getStatisticsData()
          this.getTenantList()
        }
      },
      immediate: true
    }
  },
  created () {
    if (this.$route.query.id != null && this.$route.query.id !== '') {
      const raw = this.$route.query.id
      const num = Number(raw)
      const idVal = Number.isFinite(num) ? num : raw
      this.queryData.tenantId = idVal
      this.queryData.name = idVal
    }
    if (this.$route.query.managerId) {
      this.queryData.managerId = this.$route.query.managerId
    } else if (!this.queryData.managerId) {
      this.queryData.managerId = this.currentManagerId || ''
    }

    this.setDefaultTimeRange()
  },
  methods: {
    normalizeSelect (v) {
      if (v === null || v === undefined) return ''
      return v
    },

    getColumnAlign (key) {
      if (['balance', 'discountAmt', 'realAmt'].includes(key)) {
        return 'right'
      }
      if (['billType', 'settleWay', 'payStatus', 'status', 'payType'].includes(key)) {
        return 'center'
      }
      return 'left'
    },

    buildListFilterParams () {
      const normalizeSelect = this.normalizeSelect
      let settleWayParam = normalizeSelect(this.queryData.settleWay)
      if (!settleWayParam) {
        settleWayParam = '1'
      }
      const tenantIdVal = this.queryData.tenantId || this.queryData.name
      const tr = this.queryData.timeRange
      const body = {
        managerId: this.queryData.managerId,
        rid: '',
        tenantId: tenantIdVal === null || tenantIdVal === undefined ? '' : tenantIdVal,
        payType: this.queryData.payType,
        payStatus: this.queryData.payStatus,
        withdrawStatus: this.queryData.withdrawStatus,
        settleWay: settleWayParam,
        status: this.queryData.status,
        endDate: tr && tr.length > 1 ? tr[1] : '',
        startDate: tr && tr.length > 0 ? tr[0] : ''
      }
      const useType = normalizeSelect(this.queryData.useType)
      if (useType !== '') {
        body.useType = useType
      }
      return body
    },

    // 格式化金额
    formatAmount (amount) {
      if (!amount || amount === 0) return '0.00'
      return parseFloat(amount).toFixed(2)
    },

    // 格式化余额
    formatBalance (balance) {
      if (balance === null || balance === undefined) return '0.00'
      return Number(balance).toFixed(2)
    },

    // 设置默认时间范围
    setDefaultTimeRange () {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)

      this.queryData.timeRange = [
        this.formatDate(startDate),
        this.formatDate(endDate)
      ]
    },

    // 格式化日期
    formatDate (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    async fetchTableData () {
      this.loading = true
      try {
        const base = this.buildListFilterParams()
        const params = {
          ...base,
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            searchCount: true,
            orders: [
              { asc: false, column: 'occurDate' },
              { asc: false, column: 'rid' }
            ]
          }
        }

        const response = await settlePageTenantDailyBill(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
          this.pageData.current = response.data.current || 1
        } else {
          this.$message.error(response.msg || this.$t('manualBillPage.msgFetchListFail'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('manualBillPage.msgFetchBillFail'))
        console.error('获取账单数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    async getStatisticsData () {
      try {
        const params = this.buildListFilterParams()
        const response = await settleSettleTenantStatistics(params)
        if (response.code === 200 && response.data) {
          // 直接使用返回的数据对象
          this.statisticsData = {
            表计电费: response.data.表计电费 || 0,
            其他电费: response.data.其他电费 || 0,
            表计水费: response.data.表计水费 || 0,
            其他水费: response.data.其他水费 || 0,
            服务费: response.data.服务费 || 0
          }
        } else {
          // 重置为默认值
          this.statisticsData = {
            表计电费: 0,
            其他电费: 0,
            表计水费: 0,
            其他水费: 0,
            服务费: 0
          }
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        this.statisticsData = {
          表计电费: 0,
          其他电费: 0,
          表计水费: 0,
          其他水费: 0,
          服务费: 0
        }
      }
    },

    // 获取租户列表
    async getTenantList () {
      try {
        const params = {
          managerId: this.queryData.managerId,
          page: {
            size: 999,
            current: 1
          }
        }
        const response = await tenantPageTenant(params)
        if (response.code === 200 && response.data) {
          this.tenantList = (response.data.dataList || []).map((item) => ({
            id: item.id,
            value: item.name
          }))
        }
      } catch (error) {
        console.error('获取租户列表失败:', error)
      }
    },

    // 查询
    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
      this.getStatisticsData()
    },

    handleReset () {
      this.queryData = {
        name: null,
        tenantId: '',
        useType: null,
        payType: null,
        payStatus: '',
        withdrawStatus: '',
        settleWay: null,
        status: '',
        managerId: this.currentManagerId || '',
        timeRange: []
      }
      this.setDefaultTimeRange()
      this.handleSearch()
    },

    // XLSX 生成（导出本页 / 导出选中 / 导出全部 共用）
    buildXlsx (exportData, isSelected, total) {
      const headers = this.displayColumns.map((col) => col.label)
      const data = exportData.map((row) => {
        return this.displayColumns.map((col) => {
          const value = row[col.key]

          switch (col.key) {
            case 'tenantInfo':
              return this.$displayBizHybrid(row.tenantName || '', 200)
            case 'billType':
              return this.getBillTypeLabel(row.useType)
            case 'payType':
              return this.getPayTypeLabel(value)
            case 'settleWay':
              return this.getSettleWayLabel(value)
            case 'balance':
            case 'discountAmt':
            case 'realAmt':
              return value ? parseFloat(value).toFixed(2) : '0.00'
            case 'payStatus':
              return Number(value) === 1 ? this.$t('manualBillPage.payPaid') : this.$t('manualBillPage.payUnpaid')
            case 'status':
              return this.getInvoiceStatusLabel(value)
            default:
              return value || ''
          }
        })
      })

      const wsData = [headers, ...data]
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      const colWidths = this.displayColumns.map((col) => {
        if (col.width) {
          return {
            wch: Math.max(parseInt(col.width) / 8, col.label.length + 2)
          }
        } else if (col.minWidth) {
          return {
            wch: Math.max(
              parseInt(col.minWidth) / 8,
              col.label.length + 2
            )
          }
        }
        return { wch: Math.max(15, col.label.length + 2) }
      })
      ws['!cols'] = colWidths

      const headerRange = XLSX.utils.decode_range(ws['!ref'])
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!ws[cellAddress]) continue

        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: '1f2329' } },
          fill: { fgColor: { rgb: 'F8F9FC' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('manualBillPage.exportSheetName'))

      const fileName = this.generateFileName()

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'

      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      const exportCount = exportData.length
      let successMsg
      if (isSelected) {
        successMsg = this.$t('manualBillPage.msgExportOkSelected', { count: exportCount })
      } else if (total != null && total > exportCount) {
        // 命中数超过 2000 上限：只导出前 2000 条并提示（与电表页一致）
        successMsg = this.$t('manualBillPage.successExportedLimit', { count: exportCount, total })
      } else if (total != null) {
        successMsg = this.$t('manualBillPage.successExported', { count: exportCount })
      } else {
        successMsg = this.$t('manualBillPage.msgExportOk', { count: exportCount })
      }
      this.$message.success(successMsg)
    },

    // 导出本页
    exportCurrentPage () {
      if (this.tableData.length === 0) {
        this.$message.warning(this.$t('manualBillPage.msgNoDataExport'))
        return
      }
      this.buildXlsx(this.tableData, false, null)
    },

    // 导出选中
    exportSelected () {
      if (this.selectedData.length === 0) {
        this.$message.warning(this.$t('manualBillPage.warnNoSelectedExport'))
        return
      }
      this.buildXlsx(this.selectedData, true, null)
    },

    // 导出全部：按当前查询条件重新拉取，封顶 2000 条
    async exportAll () {
      if (this.exportAllLoading) return
      this.exportAllLoading = true
      const loading = this.$loading({ lock: true, text: this.$t('manualBillPage.exporting') })
      try {
        const { rows, total } = await this.fetchAllForExport()
        if (!rows.length) {
          this.$message.warning(this.$t('manualBillPage.msgNoDataExport'))
          return
        }
        this.buildXlsx(rows, false, total)
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('manualBillPage.msgExportFail'))
      } finally {
        loading.close()
        this.exportAllLoading = false
      }
    },

    handleExportCommand (command) {
      if (command === 'currentPage') this.exportCurrentPage()
      else if (command === 'selected') this.exportSelected()
      else if (command === 'all') this.exportAll()
    },

    // 按查询条件拉取全部（封顶 EXPORT_ALL_LIMIT）
    async fetchAllForExport () {
      const base = this.buildListFilterParams()
      const params = {
        ...base,
        page: {
          size: EXPORT_ALL_LIMIT,
          current: 1,
          searchCount: true,
          orders: [
            { asc: false, column: 'occurDate' },
            { asc: false, column: 'rid' }
          ]
        }
      }
      const response = await settlePageTenantDailyBill(params)
      if (response.code !== 200) {
        this.$message.error(response.msg || this.$t('manualBillPage.msgFetchListFail'))
        return { rows: [], total: 0 }
      }
      return {
        rows: response.data?.dataList || [],
        total: response.data?.total || 0
      }
    },

    generateFileName () {
      const prefix = this.$t('manualBillPage.filePrefix')
      const now = new Date()
      const timeStr =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')

      const tenantKey = this.queryData.tenantId || this.queryData.name
      if (tenantKey !== null && tenantKey !== undefined && tenantKey !== '') {
        const tenant = this.tenantList.find((t) => t.id === tenantKey)
        const rawTenantLabel = tenant ? String(tenant.value) : String(tenantKey)
        const tenantName = this.$displayBizHybrid(rawTenantLabel, 200)
        return `${prefix}_${tenantName}_${timeStr}.xlsx`
      }

      if (this.queryData.settleWay !== null && this.queryData.settleWay !== undefined && this.queryData.settleWay !== '') {
        const settleWayName = this.getSettleWayLabel(this.queryData.settleWay)
        return `${prefix}_${settleWayName}_${timeStr}.xlsx`
      }

      if (this.queryData.useType !== null && this.queryData.useType !== undefined && this.queryData.useType !== '') {
        const useTypeName = this.getBillTypeQueryLabel(this.queryData.useType)
        return `${prefix}_${useTypeName}_${timeStr}.xlsx`
      }

      if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
        const startDate = this.queryData.timeRange[0].replace(/-/g, '')
        const endDate = this.queryData.timeRange[1].replace(/-/g, '')
        return `${prefix}_${startDate}-${endDate}_${timeStr}.xlsx`
      }

      return `${prefix}_${timeStr}.xlsx`
    },

    /** 搜索条件「费用类型」与接口 useType 编码（与 el-option value 一致） */
    getBillTypeQueryLabel (val) {
      const map = { 0: 'billTypeUseWater', 2: 'billTypeUseElectric', 7: 'billTypeUseService' }
      const key = map[val] || map[String(val)]
      return key ? this.$t(`manualBillPage.${key}`) : ''
    },

    getBillTypeLabel (type) {
      const labelMap = {
        0: this.$t('manualBillPage.billTypeUseWater'),
        2: this.$t('manualBillPage.billTypeUseElectric'),
        7: this.$t('manualBillPage.billTypeUseService')
      }
      return labelMap[String(type)] || this.$t('manualBillPage.billTypeUseService')
    },

    // 获取费用类型标签颜色
    getBillTypeTagType (type) {
      const typeMap = {
        0: 'primary', // 水费
        2: 'success', // 电费
        7: 'warning' // 服务费
      }
      return typeMap[String(type)] || 'info'
    },

    getPayTypeLabel (type) {
      const map = { 0: 'optPayPrepaid', 1: 'optPayPostpaid' }
      const key = map[type] || map[String(type)]
      return key ? this.$t(`manualBillPage.${key}`) : '-'
    },

    getPayTypeTagType (type) {
      const typeMap = {
        0: 'success',
        1: 'warning'
      }
      return typeMap[String(type)] || 'info'
    },

    handleDetail (row) {
      this.detailDrawer.id = row.rid
      this.detailDrawer.tenantId = row.tenantId
      this.detailDrawer.settleWay = row.settleWay
      this.detailDrawer.useType = row.useType
      this.detailDrawer.floatId = row.floatId
      this.detailDrawer.show = true
    },

    // 查看租户详情
    handleTenantDetail (row) {
      this.$router.push({
        name: 'TenantDetail',
        params: { id: row.tenantId },
        query: {
          name: row.name,
          from: 'list'
        }
      })
    },

    // 选择变化
    handleSelectionChange (selection) {
      this.selectedData = selection
    },

    // 分页大小变化
    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 当前页变化
    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    },

    // 获取账单类型标签
    getSettleWayLabel (way) {
      const key = String(way)
      const labelMap = {
        1: this.$t('manualBillPage.settleWay1')
      }
      return labelMap[key] || '-'
    },

    // 获取账单类型标签样式
    getSettleWayType (way) {
      const typeMap = {
        0: 'primary',
        1: 'success',
        2: 'warning',
        3: 'danger',
        4: 'info',
        5: 'info',
        10: 'success'
      }
      return typeMap[way] || ''
    },

    // 获取发票状态标签
    getInvoiceStatusLabel (status) {
      const key = String(status)
      const labelMap = {
        0: this.$t('manualBillPage.invoice0'),
        1: this.$t('manualBillPage.invoice1'),
        2: this.$t('manualBillPage.invoice2'),
        3: this.$t('manualBillPage.invoice3')
      }
      return labelMap[key] || '-'
    },

    // 获取发票状态颜色
    getInvoiceStatusColor (status) {
      const colorMap = {
        0: '#909399',
        1: '#E6A23C',
        2: '#67C23A',
        3: '#F56C6C'
      }
      return colorMap[status] || '#909399'
    }
  }
}
</script>

<style lang="scss" scoped>
.table-page-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.search-box {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.search-form {
  margin: 0;

  .search-main-grid {
    width: 100%;
    display: grid;
    align-items: center;
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    gap: 10px;
  }

  .search-main-grid .pay-type-field {
    grid-column: 1;
    grid-row: 2;
  }

  .search-main-grid > .search-actions {
    grid-column: 5;
    grid-row: 1;
  }

  .field-item {
    width: 100%;
    min-width: 0;

    ::v-deep .el-input,
    ::v-deep .el-select,
    ::v-deep .el-date-editor {
      width: 100%;
      display: block;
    }

    ::v-deep .el-input__inner,
    ::v-deep .el-select .el-input__inner {
      height: 32px;
      line-height: 32px;
      border-radius: 6px;
      border-color: #e4e7ed;
      font-size: 13px;

      &::placeholder {
        color: #c0c4cc;
      }
    }

    ::v-deep .el-range-editor.el-input__inner {
      height: 32px;
      min-height: 32px;
      line-height: normal;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      flex-wrap: nowrap;
      border-radius: 6px;
      border-color: #e4e7ed;
      font-size: 13px;
      padding: 0 10px;
      vertical-align: middle;
    }

    ::v-deep .el-range-editor .el-range-input {
      height: 30px;
      line-height: 30px;
      font-size: 13px;
      background: transparent;
    }

    ::v-deep .el-range-editor .el-range-separator {
      line-height: 1;
      height: auto;
      width: auto;
      padding: 0 4px;
      margin: 0;
      flex-shrink: 0;
      align-self: center;
      color: #606266;
    }

    ::v-deep .el-range-editor .el-range__close-icon,
    ::v-deep .el-range-editor .el-range__icon {
      line-height: 32px;
      flex-shrink: 0;
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
    justify-self: start;
    line-height: 1;

    ::v-deep .el-button + .el-button {
      margin-left: 0 !important;
    }

    ::v-deep .el-button {
      height: 32px;
      padding: 0 14px;
      font-size: 13px;
      border-radius: 6px;
    }

    ::v-deep .el-button--primary {
      background: #1677ff;
      border-color: #1677ff;

      &:hover {
        background: #4096ff;
        border-color: #4096ff;
      }
    }

    ::v-deep .el-button--success {
      background: #52c41a;
      border-color: #52c41a;

      &:hover {
        background: #73d13d;
        border-color: #73d13d;
      }
    }
  }
}

.statistics-container {
  margin-bottom: 16px;
}

.statistics-card-wrap {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.statistics-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 16px;

  @media (max-width: 1200px) {
    flex-wrap: wrap;
  }
}

.stat-flex-cell {
  flex: 1;
  min-width: 0;
  display: flex;

  ::v-deep .el-tooltip {
    flex: 1;
    min-width: 0;
    display: flex;
  }
}

.statistics-inner .stat-item {
  flex: 1;
  min-width: 0;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  background: #fafbfc;
  transition: box-shadow 0.2s;

  &.primary:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);

    img {
      width: 26px;
      height: 26px;
      object-fit: contain;
      display: block;
    }

    i {
      font-size: 20px;
      color: #fff;
    }

    &.electricity {
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
    }

    &.water {
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
    }

    &.service {
      background: linear-gradient(135deg, #f59e0b, #fcd34d);
    }
  }

  .stat-content {
    min-width: 0;

    .stat-label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #111827;

      .currency {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-right: 2px;
      }
    }
  }

  &.total {
    flex: 1.15;
    border: 1px solid rgba(22, 119, 255, 0.2);
    background: linear-gradient(135deg, #fbfdff 0%, #f0f7ff 50%, #e8f4ff 100%);
    box-shadow: 0 1px 2px rgba(22, 119, 255, 0.06);

    .stat-icon.total-icon {
      background: rgba(22, 119, 255, 0.12);
      box-shadow: none;

      i {
        color: #1677ff;
        font-size: 22px;
      }
    }

    .stat-content {
      .stat-label {
        color: #64748b;
        font-weight: 600;
      }

      .stat-value {
        color: #111827;

        .currency {
          color: #111827;
          font-weight: 700;
        }
      }
    }

    &:hover {
      border-color: rgba(22, 119, 255, 0.32);
      box-shadow: 0 4px 16px rgba(22, 119, 255, 0.12);
    }
  }
}

.content-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  flex: 1;
  padding: 16px 16px 10px;
}

.content-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 8px;

  .toolbar-left {
    .section-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #111827;

      .title-bar {
        width: 3px;
        height: 16px;
        background: #1677ff;
        border-radius: 2px;
        flex-shrink: 0;
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 16px;

    ::v-deep .el-select .el-input__inner {
      height: 32px;
      line-height: 32px;
      font-size: 13px;
      border-radius: 6px;
      border-color: #e4e7ed;
    }
  }
}

.list-view {
  padding: 0;

  .table-toolbar {
    padding: 10px 0;

    .selection-info {
      font-size: 13px;
      color: #606266;

      .count {
        color: #1677ff;
        font-weight: 600;
      }
    }
  }
}

.light-border-table {
  margin-top: 8px;

  ::v-deep {
    border: 1px solid #f0f0f0 !important;

    .el-table__header-wrapper th {
      border-right: 1px solid #f0f0f0 !important;
      border-bottom: 1px solid #f0f0f0 !important;
    }

    td {
      border-right: 1px solid #f5f5f5 !important;
      border-bottom: 1px solid #f5f5f5 !important;
    }

    .el-table__body tr.el-table__row--striped > td {
      background: #fcfdff !important;
    }

    .el-table--enable-row-hover .el-table__body tr:hover > td {
      background: #f2f8ff !important;
    }

    .el-table__fixed-right-patch {
      border-bottom: 1px solid #f0f0f0 !important;
      background-color: #f5f7fa !important;
    }
  }
}

.status-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;

  &.online {
    background: #52c41a;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
  }

  &.offline {
    background: #d9d9d9;
  }
}

.op-btn {
  padding: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1;

  &.primary-btn {
    color: #1677ff;

    &:hover {
      color: #4096ff;
    }

    &:active {
      color: #0958d9;
    }
  }
}

.rid-link,
.tenant-link {
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 14px 0 4px;

  &.compact-pagination {
    ::v-deep .el-pagination {
      display: flex !important;
      align-items: center !important;
      font-size: 12px;

      span,
      button,
      .el-pager li,
      .el-pagination__total,
      .el-pagination__jump,
      .el-pagination__sizes,
      .el-pagination__sizes .el-input,
      .el-pagination__sizes .el-input__inner,
      .btn-prev,
      .btn-next {
        vertical-align: middle;
        display: inline-flex !important;
        align-items: center !important;
      }

      .el-pagination__total {
        font-size: 12px;
      }

      .el-pagination__sizes .el-input {
        width: 88px !important;
        min-width: 0 !important;

        .el-input__inner {
          height: 24px;
          font-size: 12px;
          padding: 0 8px;
          box-sizing: border-box;
        }
      }

      .btn-prev,
      .btn-next {
        min-width: 24px;
        height: 24px;
        font-size: 12px;
        padding: 0 6px;
      }

      .el-pager li {
        min-width: 24px;
        height: 24px;
        font-size: 12px;
        padding: 0 6px;
      }

      .el-pagination__jump {
        font-size: 12px;

        .el-input .el-input__inner {
          height: 24px;
          font-size: 12px;
          padding: 0 4px;
        }
      }
    }
  }
}
</style>
<style lang="scss">
.statistics-tooltip {
  padding: 12px !important;
  background: rgba(0, 0, 0, 0.85) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;

  .tooltip-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
    color: #fff;

    .tooltip-label {
      margin-right: 16px;
      color: rgba(255, 255, 255, 0.8);
    }

    .tooltip-value {
      font-weight: 600;
      color: #fff;
    }

    &.tooltip-total {
      font-size: 14px;
      font-weight: 600;

      .tooltip-label,
      .tooltip-value {
        color: #fff;
      }
    }
  }

  .tooltip-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
    margin: 6px 0;
  }
}

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
      color: #1677ff !important;
      background: #f0f7ff !important;
      box-shadow: 0 2px 6px rgba(22, 119, 255, 0.15) !important;
      transform: translateY(-1px) !important;
      border: none !important;
    }

    &:active {
      transform: translateY(0) !important;
      box-shadow: 0 1px 3px rgba(22, 119, 255, 0.1) !important;
    }

    &:last-child {
      margin-bottom: 0 !important;
    }
  }
}
</style>
