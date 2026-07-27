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
              :start-placeholder="$t('energyBillPage.phDateStart')"
              :end-placeholder="$t('energyBillPage.phDateEnd')"
              value-format="yyyy-MM-dd"
              size="small"
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
              :placeholder="$t('energyBillPage.phTenant')"
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
              v-model="queryData.tenantType"
              :placeholder="$t('energyBillPage.phTenantType')"
              size="small"
              style="width: 100%"
              @change="handleTenantTypeChange"
            >
              <el-option :label="$t('energyBillPage.tenantType0')" :value="0" />
              <el-option :label="$t('energyBillPage.tenantType1')" :value="1" />
              <el-option :label="$t('energyBillPage.tenantType2')" :value="2" />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.useType"
              :placeholder="$t('energyBillPage.phBillType')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('energyBillPage.billTypeElectric')" value="2" />
              <el-option :label="$t('energyBillPage.billTypeWater')" value="0" />
              <el-option :label="$t('energyBillPage.billTypeService')" value="7" />
            </el-select>
          </div>
          <div class="search-actions">
            <span
              v-if="hasAdvancedFields"
              class="toggle-advanced"
              @click="showAdvanced = !showAdvanced"
            >
              {{ showAdvanced ? $t('energyBillPage.btnCollapse') : $t('energyBillPage.btnExpand') }}
              <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
            </span>
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('energyBillPage.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('energyBillPage.btnReset') }}</el-button>
            <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">{{ $t('energyBillPage.btnExport') }}</el-button>
          </div>
        </div>

        <div v-if="showAdvanced && hasAdvancedFields" class="search-advanced-grid">
          <div class="field-item advanced-field">
            <el-select
              v-model="queryData.settleWay"
              :placeholder="$t('energyBillPage.phSettleWay')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('energyBillPage.settleWay0')" value="0" />
              <el-option :label="$t('energyBillPage.settleWay1')" value="1" />
              <el-option :label="$t('energyBillPage.settleWay2')" value="2" />
              <el-option :label="$t('energyBillPage.settleWay3')" value="3" />
              <el-option :label="$t('energyBillPage.settleWay4')" value="4" />
              <el-option :label="$t('energyBillPage.settleWay5')" value="5" />
              <el-option :label="$t('energyBillPage.settleWay10')" value="10" />
            </el-select>
          </div>
          <div class="search-actions search-actions-phantom">
            <span class="toggle-advanced">
              {{ showAdvanced ? $t('energyBillPage.btnCollapse') : $t('energyBillPage.btnExpand') }}
              <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
            </span>
            <el-button type="primary" size="small" icon="el-icon-search">{{ $t('energyBillPage.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh">{{ $t('energyBillPage.btnReset') }}</el-button>
            <el-button type="success" size="small" icon="el-icon-download">{{ $t('energyBillPage.btnExport') }}</el-button>
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
                  <span class="tooltip-label">{{ $t('energyBillPage.tooltipMeterElec') }}</span>
                  <span class="tooltip-value">¥{{ formatAmount(statisticsData.表计电费) }}</span>
                </div>
                <div class="tooltip-item">
                  <span class="tooltip-label">{{ $t('energyBillPage.tooltipOtherElec') }}</span>
                  <span class="tooltip-value">¥{{ formatAmount(statisticsData.其他电费) }}</span>
                </div>
                <div class="tooltip-divider"></div>
                <div class="tooltip-item tooltip-total">
                  <span class="tooltip-label">{{ $t('energyBillPage.tooltipTotal') }}</span>
                  <span class="tooltip-value">¥{{ getElectricityTotal }}</span>
                </div>
              </div>
              <div class="stat-item primary">
                <div class="stat-icon electricity">
                  <img :src="require('@/assets/images/electricity.png')" alt="">
                </div>
                <div class="stat-content">
                  <div class="stat-label">{{ $t('energyBillPage.statElectricity') }}</div>
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
                  <span class="tooltip-label">{{ $t('energyBillPage.tooltipMeterWater') }}</span>
                  <span class="tooltip-value">¥{{ formatAmount(statisticsData.表计水费) }}</span>
                </div>
                <div class="tooltip-item">
                  <span class="tooltip-label">{{ $t('energyBillPage.tooltipOtherWater') }}</span>
                  <span class="tooltip-value">¥{{ formatAmount(statisticsData.其他水费) }}</span>
                </div>
                <div class="tooltip-divider"></div>
                <div class="tooltip-item tooltip-total">
                  <span class="tooltip-label">{{ $t('energyBillPage.tooltipTotal') }}</span>
                  <span class="tooltip-value">¥{{ getWaterTotal }}</span>
                </div>
              </div>
              <div class="stat-item primary">
                <div class="stat-icon water">
                  <img :src="require('@/assets/images/waterate.png')" alt="">
                </div>
                <div class="stat-content">
                  <div class="stat-label">{{ $t('energyBillPage.statWater') }}</div>
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
                <div class="stat-label">{{ $t('energyBillPage.statServiceFee') }}</div>
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
                <div class="stat-label">{{ $t('energyBillPage.statGrandTotal') }}</div>
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
            {{ $t('energyBillPage.sectionTitle') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option :label="$t('energyBillPage.sortDefault')" value="default" />
          </el-select>
        </div>
      </div>

      <div class="list-view">
        <div v-if="selectedData.length > 0" class="table-toolbar">
          <span class="selection-info" v-html="$t('energyBillPage.selectedLine', { count: selectedData.length })" />
        </div>

        <el-table
          v-loading="loading"
          border
          :data="tableData"
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
          <el-table-column type="selection" width="55" align="center" />

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

              <template v-else-if="col.key === 'billType'">
                <el-tag
                  :type="getBillTypeTagType(scope.row.useType)"
                  size="small"
                  effect="plain"
                >
                  {{ getBillTypeLabel(scope.row.useType) }}
                </el-tag>
              </template>

              <template v-else-if="col.key === 'settleWay'">
                <el-tag
                  :type="getSettleWayType(scope.row.settleWay)"
                  size="small"
                  effect="plain"
                >
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
                  {{ Number(scope.row.payStatus) === 1 ? $t('energyBillPage.payPaid') : $t('energyBillPage.payUnpaid') }}
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

          <el-table-column :label="$t('energyBillPage.colAction')" width="100" fixed="right" align="center" :resizable="false">
            <template slot-scope="scope">
              <el-button type="text" size="mini" class="op-btn primary-btn" @click="handleDetail(scope.row)">
                {{ $t('energyBillPage.btnDetail') }}
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
import BillDetailDrawer from './components/BillDetailDrawer.vue'

export default {
  name: 'TenantEnergyBillPage',
  components: {
    BillDetailDrawer
  },
  data () {
    return {
      sortOrder: 'default',
      columnDefs: [
        {
          key: 'rid',
          width: '150',
          checked: true
        },
        {
          key: 'occurDate',
          width: '120',
          checked: true
        },
        {
          key: 'createTime',
          width: '160',
          checked: true
        },
        {
          key: 'tenantInfo',
          width: '200',
          checked: true,
          disabled: true
        },
        {
          key: 'billType',
          width: '120',
          checked: true
        },
        {
          key: 'settleWay',
          width: '120',
          checked: true
        },
        {
          key: 'balance',
          width: '120',
          checked: true
        },
        {
          key: 'payStatus',
          width: '100',
          checked: true
        },
        {
          key: 'discountAmt',
          width: '120',
          checked: true
        },
        {
          key: 'realAmt',
          width: '120',
          checked: true
        },
        {
          key: 'status',
          width: '100',
          checked: true
        }
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
        tenantType: 0,
        useType: null,
        payStatus: '',
        withdrawStatus: '',
        settleWay: null,
        status: '',
        managerId: '',
        timeRange: []
      },
      // 租户列表
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
      showAdvanced: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      // 选中的数据
      selectedData: [],
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
    ...mapGetters('treeSelection', ['selectedTenantIds', 'selectedIds']),
    isTenantEnergyBillRoute () {
      return this.$route.path === '/metering/bill/energy-bill-tenant'
    },
    selectedTenantIdList () {
      const tenantIds = Array.isArray(this.selectedTenantIds) ? this.selectedTenantIds : []
      const fallbackIds = Array.isArray(this.selectedIds) ? this.selectedIds : []
      const source = tenantIds.length > 0 ? tenantIds : fallbackIds
      return source
        .map(id => Number(id))
        .filter(id => Number.isFinite(id) && id > 0)
    },
    selectedTenantIdKey () {
      return this.selectedTenantIdList.join(',')
    },
    explicitBillTenantId () {
      const v = this.queryData.tenantId || this.queryData.name
      if (v === '' || v === null || v === undefined) return ''
      return v
    },
    billQueryTenantIdList () {
      if (!this.isTenantEnergyBillRoute) return undefined
      if (this.explicitBillTenantId) return undefined
      const list = this.selectedTenantIdList
      return list.length ? list : undefined
    },
    pickerOptions () {
      return {
        shortcuts: [
          {
            text: this.$t('energyBillPage.shortcut7d'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 6)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: this.$t('energyBillPage.shortcut15d'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 14)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: this.$t('energyBillPage.shortcut30d'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: this.$t('energyBillPage.shortcutThisMonth'),
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
            text: this.$t('energyBillPage.shortcutLastMonth'),
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
        createTime: 'colCreateTime',
        tenantInfo: 'colTenantInfo',
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
        label: this.$t(`energyBillPage.${labelKeyByCol[col.key]}`)
      }))
    },
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
    },
    hasAdvancedFields () {
      return true
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
    },
    selectedTenantIdKey () {
      if (!this.isTenantEnergyBillRoute) return
      this.pageData.current = 1
      this.fetchTableData()
      this.getStatisticsData()
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

    buildBillListFilterBody () {
      let settleWayParam = this.normalizeSelect(this.queryData.settleWay)
      if (!settleWayParam) {
        settleWayParam = '0,1,2,3,4,5,10'
      }
      const tr = this.queryData.timeRange
      const body = {
        managerId: this.queryData.managerId,
        rid: '',
        tenantId: this.explicitBillTenantId || undefined,
        tenantIdList: this.billQueryTenantIdList,
        tenantType: this.queryData.tenantType,
        payStatus: this.queryData.payStatus,
        withdrawStatus: this.queryData.withdrawStatus,
        settleWay: settleWayParam,
        status: this.queryData.status,
        endDate: tr && tr.length > 1 ? tr[1] : '',
        startDate: tr && tr.length > 0 ? tr[0] : ''
      }
      const useType = this.normalizeSelect(this.queryData.useType)
      if (useType !== '') {
        body.useType = useType
      }
      return body
    },

    // 获取列对齐方式
    getColumnAlign (key) {
      // 金额类字段右对齐
      if (['balance', 'discountAmt', 'realAmt'].includes(key)) {
        return 'right'
      }
      // 标签类字段居中
      if (['billType', 'settleWay', 'payStatus', 'status'].includes(key)) {
        return 'center'
      }
      // 其他字段左对齐
      return 'left'
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

    /** 列表与导出共用的查询体（page 可覆盖） */
    buildPageTenantDailyBillParams (pageOverride) {
      const page = pageOverride || {
        size: this.pageData.size,
        current: this.pageData.current,
        searchCount: true,
        orders: [
          { asc: false, column: 'occurDate' },
          { asc: false, column: 'rid' }
        ]
      }
      return {
        ...this.buildBillListFilterBody(),
        page
      }
    },

    /** 导出未勾选时：按当前筛选条件分页拉全量，避免只导出当前页 tableData */
    async fetchAllBillRowsForExport () {
      const chunk = 500
      let current = 1
      const rows = []
      let total = null
      while (true) {
        const params = this.buildPageTenantDailyBillParams({
          size: chunk,
          current,
          searchCount: current === 1,
          orders: [
            { asc: false, column: 'occurDate' },
            { asc: false, column: 'rid' }
          ]
        })
        const response = await settlePageTenantDailyBill(params)
        if (response.code !== 200) {
          this.$message.error(response.msg || this.$t('energyBillPage.msgExportListFail'))
          return []
        }
        const list = response.data.dataList || []
        if (total === null) {
          total = Number(response.data.total) || 0
        }
        rows.push(...list)
        if (rows.length >= total || list.length < chunk) break
        current += 1
        if (current > 500) break
      }
      return rows
    },

    // 获取账单列表数据
    async fetchTableData () {
      this.loading = true
      try {
        const params = this.buildPageTenantDailyBillParams()

        const response = await settlePageTenantDailyBill(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
          this.pageData.current = response.data.current || 1
        } else {
          this.$message.error(response.msg || this.$t('energyBillPage.msgFetchListFail'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('energyBillPage.msgFetchBillFail'))
        console.error('获取账单数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 获取统计数据
    async getStatisticsData () {
      try {
        const params = this.buildBillListFilterBody()
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
          tenantType: this.queryData.tenantType,
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

    async handleTenantTypeChange () {
      this.queryData.name = null
      this.queryData.tenantId = ''
      await this.getTenantList()
      this.handleSearch()
    },

    // 重置
    handleReset () {
      this.showAdvanced = false
      this.queryData = {
        name: null,
        tenantId: '',
        tenantType: 0,
        useType: null,
        payStatus: '',
        withdrawStatus: '',
        settleWay: null,
        status: '',
        managerId: this.currentManagerId || '',
        timeRange: []
      }
      this.getTenantList()
      this.setDefaultTimeRange()
      this.handleSearch()
    },

    /**
     * 金额字段：与接口一致，仅将可解析的标量转为 number；无法解析时留空（不强行写 0 文本）
     */
    coerceBackendNumber (value) {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null
      }
      let s = String(value).trim().replace(/,/g, '')
      s = s.replace(/[\u2212\uFE63\uFF0D]/g, '-')
      if (s === '') return null
      const n = Number(s)
      return Number.isFinite(n) ? n : null
    },

    /** 金额列显式标为数字单元格（t:n）并套会计格式，Excel 中 SUM 可正确汇总 */
    applyExportMoneyCellTypes (ws, displayColumns, rowCount) {
      const moneyKeys = new Set(['balance', 'discountAmt', 'realAmt'])
      const numFmt = '#,##0.00'
      displayColumns.forEach((col, c) => {
        if (!moneyKeys.has(col.key)) return
        for (let r = 1; r <= rowCount; r++) {
          const addr = XLSX.utils.encode_cell({ r, c })
          const cell = ws[addr]
          if (!cell) continue
          const v = cell.v
          if (v === null || v === undefined || v === '') continue
          const n =
            typeof v === 'number'
              ? v
              : Number(
                String(v)
                  .replace(/,/g, '')
                  .replace(/[\u2212\uFE63\uFF0D]/g, '-')
              )
          if (!Number.isFinite(n)) continue
          ws[addr] = { t: 'n', v: n, z: numFmt }
        }
      })
    },

    async handleExport () {
      const isSelectedExport = this.selectedData.length > 0
      if (!isSelectedExport && this.pageData.total === 0) {
        this.$message.warning(this.$t('energyBillPage.msgNoDataExport'))
        return
      }

      let exportData = []
      if (isSelectedExport) {
        exportData = [...this.selectedData]
      } else {
        const loading = this.$loading({
          lock: true,
          text: this.$t('energyBillPage.exportLoading')
        })
        try {
          exportData = await this.fetchAllBillRowsForExport()
        } catch (e) {
          console.error('导出拉取数据失败:', e)
          this.$apiError.notify(e, this.$t('energyBillPage.msgExportListFail'))
          return
        } finally {
          loading.close()
        }
        if (!exportData.length) {
          this.$message.warning(this.$t('energyBillPage.msgNoRowsExport'))
          return
        }
      }

      try {
        const headers = this.displayColumns.map((col) => col.label)
        const data = exportData.map((row) => {
          return this.displayColumns.map((col) => {
            const value = row[col.key]

            switch (col.key) {
              case 'tenantInfo':
                return this.$displayBizHybrid(row.tenantName || '', 200)
              case 'billType':
                return this.getBillTypeLabel(row.useType)
              case 'settleWay':
                return this.getSettleWayLabel(value)
              case 'balance':
              case 'discountAmt':
              case 'realAmt': {
                const n = this.coerceBackendNumber(value)
                return n === null ? '' : n
              }
              case 'payStatus':
                return Number(value) === 1 ? this.$t('energyBillPage.payPaid') : this.$t('energyBillPage.payUnpaid')
              case 'status':
                return this.getInvoiceStatusLabel(value)
              default:
                return value || ''
            }
          })
        })

        const wsData = [headers, ...data]
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        this.applyExportMoneyCellTypes(ws, this.displayColumns, data.length)

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
        XLSX.utils.book_append_sheet(wb, ws, this.$t('energyBillPage.exportSheetName'))

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
        this.$message.success(
          isSelectedExport
            ? this.$t('energyBillPage.msgExportOkSelected', { count: exportCount })
            : this.$t('energyBillPage.msgExportOk', { count: exportCount })
        )
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('energyBillPage.msgExportFail'))
      }
    },

    generateFileName () {
      const prefix = this.$t('energyBillPage.filePrefix')
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
      return key ? this.$t(`energyBillPage.${key}`) : ''
    },

    getBillTypeLabel (type) {
      const map = { 0: 'billTypeUseWater', 2: 'billTypeUseElectric', 7: 'billTypeUseService' }
      const key = map[type] || map[String(type)] || 'billTypeUseService'
      return this.$t(`energyBillPage.${key}`)
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
      const map = {
        0: 'settleWay0',
        1: 'settleWay1',
        2: 'settleWay2',
        3: 'settleWay3',
        4: 'settleWay4',
        5: 'settleWay5',
        10: 'settleWay10'
      }
      const key = map[way] || map[Number(way)]
      return key ? this.$t(`energyBillPage.${key}`) : '-'
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
      const map = {
        0: 'invoice0',
        1: 'invoice1',
        2: 'invoice2',
        3: 'invoice3'
      }
      const key = map[status] || map[Number(status)]
      return key ? this.$t(`energyBillPage.${key}`) : '-'
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

  .search-advanced-grid {
    width: 100%;
    display: grid;
    align-items: center;
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    gap: 10px;
    margin-top: 10px;
    padding-top: 0;
  }

  .search-main-grid > .search-actions {
    grid-column: 5;
  }

  .search-advanced-grid .advanced-field {
    grid-column: 1;
  }

  .search-advanced-grid > .search-actions-phantom {
    grid-column: 5;
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
    justify-self: end;
    line-height: 1;

    ::v-deep .el-button + .el-button {
      margin-left: 0 !important;
    }

    .toggle-advanced {
      font-size: 13px;
      color: #409eff;
      cursor: pointer;
      user-select: none;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      margin: 0 6px 0 8px;
      white-space: nowrap;

      &:hover {
        color: #66b1ff;
      }
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

  .search-actions-phantom {
    visibility: hidden;
    pointer-events: none;
    user-select: none;
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

  /* 合计：与 new-manual-bill 一致（蓝白渐变 + 主色图标 + 金额深灰黑） */
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
