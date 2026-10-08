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
              :start-placeholder="$t('floatingPriceTenantPage.phDateStart')"
              :end-placeholder="$t('floatingPriceTenantPage.phDateEnd')"
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
              v-model="queryData.tenantId"
              :placeholder="$t('floatingPriceTenantPage.phTenant')"
              clearable
              filterable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="tenant in tenantList"
                :key="tenant.id"
                :label="String(tenant.id) + ' - ' + $displayBizHybrid(tenant.name || '')"
                :value="tenant.id"
              />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.tenantType"
              :placeholder="$t('floatingPriceTenantPage.phTenantType')"
              size="small"
              style="width: 100%"
              @change="handleTenantTypeChange"
            >
              <el-option :label="$t('floatingPriceTenantPage.tenantType0')" :value="0" />
              <el-option :label="$t('floatingPriceTenantPage.tenantType1')" :value="1" />
              <el-option :label="$t('floatingPriceTenantPage.tenantType2')" :value="2" />
              <el-option :label="$t('floatingPriceTenantPage.tenantType3')" :value="3" />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.payType"
              :placeholder="$t('floatingPriceTenantPage.phPayType')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('floatingPriceTenantPage.optPayPrepaid')" :value="0" />
              <el-option :label="$t('floatingPriceTenantPage.optPayPostpaid')" :value="1" />
            </el-select>
          </div>
          <div class="search-actions">
            <span
              v-if="hasAdvancedFields"
              class="toggle-advanced"
              @click="showAdvanced = !showAdvanced"
            >
              {{ showAdvanced ? $t('floatingPriceTenantPage.btnCollapse') : $t('floatingPriceTenantPage.btnExpand') }}
              <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
            </span>
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('floatingPriceTenantPage.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('floatingPriceTenantPage.btnReset') }}</el-button>
            <el-dropdown trigger="hover" @command="handleExportCommand">
              <el-button type="success" size="small" icon="el-icon-download">
                {{ $t('floatingPriceTenantPage.btnExport') }}<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="currentPage">{{ $t('floatingPriceTenantPage.exportCurrentPage') }}</el-dropdown-item>
                <el-dropdown-item command="selected">{{ $t('floatingPriceTenantPage.exportSelected') }}</el-dropdown-item>
                <el-dropdown-item command="all">{{ $t('floatingPriceTenantPage.exportAll') }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>

        <div v-if="showAdvanced && hasAdvancedFields" class="search-advanced-grid">
          <div class="field-item advanced-field">
            <el-select
              v-model="queryData.arrearsType"
              :placeholder="$t('floatingPriceTenantPage.phArrearsType')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('floatingPriceTenantPage.arrearsType1')" :value="1" />
              <el-option :label="$t('floatingPriceTenantPage.arrearsType2')" :value="2" />
              <el-option :label="$t('floatingPriceTenantPage.arrearsType3')" :value="3" />
              <el-option :label="$t('floatingPriceTenantPage.arrearsType4')" :value="4" />
              <el-option :label="$t('floatingPriceTenantPage.arrearsType5')" :value="5" />
            </el-select>
          </div>
          <div class="search-actions search-actions-phantom">
            <span class="toggle-advanced">
              {{ showAdvanced ? $t('floatingPriceTenantPage.btnCollapse') : $t('floatingPriceTenantPage.btnExpand') }}
              <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
            </span>
            <el-button type="primary" size="small" icon="el-icon-search">{{ $t('floatingPriceTenantPage.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh">{{ $t('floatingPriceTenantPage.btnReset') }}</el-button>
            <el-button type="success" size="small" icon="el-icon-download">{{ $t('floatingPriceTenantPage.btnExport') }}<i class="el-icon-arrow-down el-icon--right" /></el-button>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 租户账单统计：仅两块 KPI（应收 / 实收），不增加第三、第四统计卡 -->
    <div class="statistics-container">
      <div class="statistics-card-wrap" v-loading="kpiLoading">
        <div class="statistics-inner statistics-inner--two">
          <div class="stat-flex-cell">
            <div class="stat-item primary">
              <div class="stat-icon service">
                <i class="el-icon-s-data"></i>
              </div>
              <div class="stat-content">
                <div class="stat-label">{{ $t('floatingPriceTenantPage.kpiBillTotal') }}</div>
                <div class="stat-value">
                  <span class="currency">¥</span>{{ formatKpiMoney(kpiBillTotalAmt) }}
                </div>
              </div>
            </div>
          </div>
          <div class="stat-flex-cell">
            <div class="stat-item primary">
              <div class="stat-icon electricity">
                <img :src="require('@/assets/images/electricity.png')" alt="">
              </div>
              <div class="stat-content">
                <div class="stat-label">{{ $t('floatingPriceTenantPage.kpiPayTotal') }}</div>
                <div class="stat-value">
                  <span class="currency">¥</span>{{ formatKpiMoney(kpiPayTotalAmt) }}
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
            {{ $t('floatingPriceTenantPage.sectionTitle') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option :label="$t('floatingPriceTenantPage.sortDefault')" value="default" />
          </el-select>
        </div>
      </div>

      <div class="list-view">
        <div v-if="selectedData.length > 0" class="table-toolbar">
          <span class="selection-info" v-html="$t('floatingPriceTenantPage.selectedLine', { count: selectedData.length })" />
        </div>

        <el-table
          v-loading="loading"
          border
          :data="tableData"
          row-key="tenantId"
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
            :align="col.align || 'center'"
            :header-align="col.align || 'center'"
            :show-overflow-tooltip="true"
          >
            <template slot-scope="scope">
              <template v-if="col.key === 'tenantId'">
                <span class="rid-text">{{ scope.row.tenantId || '-' }}</span>
              </template>

              <template v-else-if="col.key === 'resourceList'">
                <el-tooltip
                  v-if="resourceCount(scope.row) > 0"
                  :disabled="resourceCount(scope.row) <= 1"
                  :content="resourceTooltipContent(scope.row)"
                  placement="top"
                >
                  <span class="resource-tag">
                    <i class="el-icon-office-building"></i>
                    {{ resourceDisplay(scope.row) }}
                  </span>
                </el-tooltip>
                <span v-else>-</span>
              </template>

              <template v-else-if="col.key === 'tenantName'">
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

              <template v-else-if="col.type === 'money'">
                <span
                  :class="{
                    'amount-text': true,
                    'text-danger': col.key.includes('NoPay'),
                  }"
                >
                  {{ formatMoney(scope.row[col.key]) }}
                </span>
              </template>

              <template v-else>
                {{ scope.row[col.key] || '-' }}
              </template>
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
  </div>
</template>
<script>
// 导入API
import { settleTenantSettleStatistics } from '@/api/settle'
import { tenantSettleStatis } from '@/api/newDashboard'

import { tenantPageTenant } from '@/api/tenant'

import { mapGetters } from 'vuex'
import moment from 'moment'
import * as XLSX from 'xlsx'

// 导出全部单次上限（与电表页一致）
const EXPORT_ALL_LIMIT = 2000

/** 默认日期：本月 1 日～今日（与大屏「本月」电费卡片一致） */
function defaultMonthTimeRange () {
  return [
    moment().startOf('month').format('YYYY-MM-DD'),
    moment().format('YYYY-MM-DD')
  ]
}

export default {
  name: 'TenantFloatingPricePage',
  data () {
    const q = this.$route && this.$route.query
    let timeRange = defaultMonthTimeRange()
    if (q && q.startDate && q.endDate) {
      timeRange = [String(q.startDate), String(q.endDate)]
    }
    return {
      sortOrder: 'default',
      showAdvanced: false,
      pickerOptions: {
        disabledDate (time) {
          return time.getTime() > Date.now()
        }
      },
      // 表格高度配置
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68
      },

      // 查询参数（默认本月；大屏跳转可由路由 query 覆盖）
      queryData: {
        tenantId: null,
        tenantType: 0,
        payType: null,
        arrearsType: null,
        timeRange
      },

      // 本月应收/实收汇总（全量统计接口，与列表分页无关）
      kpiBillTotalAmt: null,
      kpiPayTotalAmt: null,
      kpiLoading: false,

      // 租户列表
      tenantList: [],

      // 表格数据
      tableData: [],

      // 加载状态
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

      // 表格列配置（文案由 computed tableKey 注入）
      columnDefs: [
        {
          key: 'tenantId',
          width: '150',
          checked: true,
          disabled: true
        },
        {
          key: 'resourceList',
          width: '200',
          checked: true,
          disabled: true,
          align: 'left'
        },
        {
          key: 'tenantName',
          minWidth: '200',
          checked: true,
          disabled: true
        },
        {
          key: 'payType',
          width: '100',
          checked: true
        },
        {
          key: 'elecAmt',
          width: '150',
          checked: true,
          type: 'money'
        },
        {
          key: 'elecPayAmt',
          width: '160',
          checked: true,
          type: 'money'
        },
        {
          key: 'elecNoPayAmt',
          width: '160',
          checked: true,
          type: 'money'
        },
        {
          key: 'waterAmt',
          width: '150',
          checked: true,
          type: 'money'
        },
        {
          key: 'waterPayAmt',
          width: '160',
          checked: true,
          type: 'money'
        },
        {
          key: 'waterNoPayAmt',
          width: '160',
          checked: true,
          type: 'money'
        },
        {
          key: 'serviceAmt',
          width: '150',
          checked: true,
          type: 'money'
        },
        {
          key: 'servicePayAmt',
          width: '180',
          checked: true,
          type: 'money'
        },
        {
          key: 'serviceNoPayAmt',
          width: '180',
          checked: true,
          type: 'money'
        }
      ]
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),

    hasAdvancedFields () {
      return true
    },

    tableKey () {
      const labelKeyByCol = {
        tenantId: 'colTenantId',
        resourceList: 'colResourceList',
        tenantName: 'colTenantName',
        payType: 'colPayType',
        elecAmt: 'colElecAmt',
        elecPayAmt: 'colElecPayAmt',
        elecNoPayAmt: 'colElecNoPayAmt',
        waterAmt: 'colWaterAmt',
        waterPayAmt: 'colWaterPayAmt',
        waterNoPayAmt: 'colWaterNoPayAmt',
        serviceAmt: 'colServiceAmt',
        servicePayAmt: 'colServicePayAmt',
        serviceNoPayAmt: 'colServiceNoPayAmt'
      }
      return this.columnDefs.map((col) => ({
        ...col,
        label: this.$t(`floatingPriceTenantPage.${labelKeyByCol[col.key]}`)
      }))
    },

    // 显示的列
    displayColumns () {
      return this.tableKey.filter((col) => col.checked !== false)
    },
    tableMaxHeight () {
      // 始终返回最大高度（9行 + 表头）
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    }
  },

  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.getTenantList()
          this.handleSearch()
        }
      },
      immediate: true
    },
    $route (to) {
      if (to.path !== '/metering/bill/floating-price-tenant') return
      const q = to.query || {}
      if (q.startDate && q.endDate) {
        this.queryData.timeRange = [String(q.startDate), String(q.endDate)]
      } else if (q.fromDashboard === '1') {
        this.queryData.timeRange = defaultMonthTimeRange()
      }
      if (q.id !== undefined) {
        this.queryData.tenantId = q.id ? q.id : null
      }
      this.handleSearch()
    }
  },

  created () {
    if (this.$route.query.id != null && this.$route.query.id !== '') {
      const raw = this.$route.query.id
      const num = Number(raw)
      this.queryData.tenantId = Number.isFinite(num) ? num : raw
    }
  },

  methods: {
    normalizeTenantId (v) {
      if (v === null || v === undefined || v === '') return ''
      return v
    },

    // 资源列表：列表接口返回的 resourceList
    resourceListOf (row) {
      return Array.isArray(row.resourceList) ? row.resourceList : []
    },

    resourceCount (row) {
      return this.resourceListOf(row).length
    },

    // 资源展示文本：单个直接显示资源名，多个显示「首个资源名 等N个资源」
    resourceDisplay (row) {
      const list = this.resourceListOf(row)
      if (!list.length) return ''
      const first = list[0].resourceName || list[0].buildingName || ''
      if (list.length === 1) return first
      return this.$t('floatingPriceTenantPage.resourceMore', {
        name: first,
        count: list.length
      })
    },

    // 多资源时 hover 展示完整列表
    resourceTooltipContent (row) {
      return this.resourceListOf(row)
        .map((r) => r.resourceName || `${r.buildingName || ''}-${r.floorName || ''}`)
        .join('\n')
    },

    // 获取租户列表
    async getTenantList () {
      try {
        const params = {
          tenantStatus: 0,
          managerId: this.currentManagerId,
          tenantType: this.queryData.tenantType,
          page: {
            size: 999,
            current: 1
          }
        }
        const response = await tenantPageTenant(params)

        if (response.code === 200 && response.data.dataList) {
          this.tenantList = response.data.dataList || []
        } else {
          this.$message.error(response.msg || this.$t('floatingPriceTenantPage.msgTenantListFail'))
          this.tenantList = []
        }
      } catch (error) {
        console.error('获取租户列表失败:', error)
        this.$apiError.notify(error, this.$t('floatingPriceTenantPage.msgTenantListFail'))
        this.tenantList = []
      }
    },

    normalizeTenantSettleStatis (res) {
      if (!res || res.code !== 200) {
        return { billTotalAmt: null, payTotalAmt: null }
      }
      const dto = res.data || {}
      const billTotalAmt = Number(dto.billTotalAmt)
      const payTotalAmt = Number(dto.payTotalAmt)
      return {
        billTotalAmt: Number.isFinite(billTotalAmt) ? billTotalAmt : null,
        payTotalAmt: Number.isFinite(payTotalAmt) ? payTotalAmt : null
      }
    },

    async fetchKpiTotals () {
      if (!this.currentManagerId) {
        this.kpiBillTotalAmt = null
        this.kpiPayTotalAmt = null
        return
      }
      const tr = this.queryData.timeRange
      if (!tr || tr.length !== 2) return
      this.kpiLoading = true
      try {
        const res = await tenantSettleStatis({
          managerId: this.currentManagerId,
          tenantId: this.normalizeTenantId(this.queryData.tenantId),
          startDate: tr[0],
          endDate: tr[1],
          tenantStatus: '0',
          tenantType: this.queryData.tenantType,
          payType: this.queryData.payType,
          arrearsType: this.queryData.arrearsType
        }).catch(() => null)
        const dto = this.normalizeTenantSettleStatis(res)
        this.kpiBillTotalAmt = dto.billTotalAmt
        this.kpiPayTotalAmt = dto.payTotalAmt
      } finally {
        this.kpiLoading = false
      }
    },

    formatKpiMoney (value) {
      if (value === null || value === undefined) return '--'
      const n = Number(value)
      if (!Number.isFinite(n)) return '--'
      const loc = this.$i18n.locale === 'en' ? 'en-US' : 'zh-CN'
      return n.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },

    // 获取表格数据
    async fetchTableData () {
      this.loading = true
      try {
        const tenantIdVal = this.normalizeTenantId(this.queryData.tenantId)
        const params = {
          managerId: this.currentManagerId,
          tenantId: tenantIdVal,
          tenantType: this.queryData.tenantType,
          payType: this.queryData.payType,
          arrearsType: this.queryData.arrearsType,
          startDate: this.queryData.timeRange
            ? this.queryData.timeRange[0]
            : '',
          endDate: this.queryData.timeRange ? this.queryData.timeRange[1] : '',
          page: {
            current: this.pageData.current,
            size: this.pageData.size
          }
        }

        const response = await settleTenantSettleStatistics(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || this.$t('floatingPriceTenantPage.msgFetchFail'))
          this.tableData = []
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('floatingPriceTenantPage.msgFetchStatFail'))
        console.error('获取账单统计数据失败:', error)
        this.tableData = []
      } finally {
        this.loading = false
      }
    },

    // 格式化金额
    formatMoney (value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return `¥${parseFloat(value).toFixed(2)}`
    },

    getPayTypeLabel (type) {
      const map = { 0: 'optPayPrepaid', 1: 'optPayPostpaid' }
      const key = map[type] || map[String(type)]
      return key ? this.$t(`floatingPriceTenantPage.${key}`) : '-'
    },

    getPayTypeTagType (type) {
      const typeMap = {
        0: 'success',
        1: 'warning'
      }
      return typeMap[String(type)] || 'info'
    },

    // 查询
    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
      this.fetchKpiTotals()
    },

    async handleTenantTypeChange () {
      this.queryData.tenantId = null
      await this.getTenantList()
      this.handleSearch()
    },

    // 重置
    handleReset () {
      this.showAdvanced = false
      this.queryData = {
        tenantId: null,
        tenantType: 0,
        payType: null,
        arrearsType: null,
        timeRange: defaultMonthTimeRange()
      }
      this.getTenantList()
      this.handleSearch()
    },

    // 导出数据
    handleTenantDetail (row) {
      this.$router.push({
        name: 'TenantDetail', // 使用路由名称
        params: { id: row.tenantId }, // 使用 params 传递动态路由参数
        query: {
          // 可选：传递额外的查询参数
          name: row.name,
          from: 'list'
        }
      })
    },

    // 查看详情
    handleView (row) {
      this.handleTenantDetail(row)
    },

    // 导出数据
    // XLSX 生成（导出本页 / 导出选中 / 导出全部 共用）
    buildXlsx (exportData, isSelected, total) {
      const headers = this.displayColumns.map(col => col.label)
      const data = exportData.map(row => {
        return this.displayColumns.map(col => {
          const value = row[col.key]

          if (col.key === 'tenantName') {
            return this.$displayBizHybrid(row.tenantName || '', 200)
          }

          if (col.key === 'resourceList') {
            return this.resourceListOf(row)
              .map(r => r.resourceName || `${r.buildingName || ''}-${r.floorName || ''}`)
              .join(', ')
          }

          if (col.key === 'payType') {
            return this.getPayTypeLabel(value)
          }

          // 处理金额类型的字段
          if (col.type === 'money') {
            if (value === null || value === undefined || value === '') {
              return '0.00'
            }
            return parseFloat(value).toFixed(2)
          }

          // 处理其他字段
          return value || ''
        })
      })

      // 创建工作表数据
      const wsData = [headers, ...data]

      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // 设置列宽
      const colWidths = this.displayColumns.map(col => {
        if (col.width) {
          return { wch: Math.max(parseInt(col.width) / 8, col.label.length + 2) }
        } else if (col.minWidth) {
          return { wch: Math.max(parseInt(col.minWidth) / 8, col.label.length + 2) }
        }
        return { wch: Math.max(15, col.label.length + 2) }
      })
      ws['!cols'] = colWidths

      // 创建工作簿
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('floatingPriceTenantPage.exportSheetName'))

      // 生成文件名
      const fileName = this.generateFileName()

      // 导出文件（使用原生方法）
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'

      // 触发下载
      document.body.appendChild(link)
      link.click()

      // 清理
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      const exportCount = exportData.length
      let successMsg
      if (isSelected) {
        successMsg = this.$t('floatingPriceTenantPage.msgExportOkSelected', { count: exportCount })
      } else if (total != null && total > exportCount) {
        // 命中数超过 2000 上限：只导出前 2000 条并提示（与电表页一致）
        successMsg = this.$t('floatingPriceTenantPage.successExportedLimit', { count: exportCount, total })
      } else if (total != null) {
        successMsg = this.$t('floatingPriceTenantPage.successExported', { count: exportCount })
      } else {
        successMsg = this.$t('floatingPriceTenantPage.msgExportOk', { count: exportCount })
      }
      this.$message.success(successMsg)
    },

    // 导出本页
    exportCurrentPage () {
      if (this.tableData.length === 0) {
        this.$message.warning(this.$t('floatingPriceTenantPage.msgNoDataExport'))
        return
      }
      this.buildXlsx(this.tableData, false, null)
    },

    // 导出选中
    exportSelected () {
      if (this.selectedData.length === 0) {
        this.$message.warning(this.$t('floatingPriceTenantPage.warnNoSelectedExport'))
        return
      }
      this.buildXlsx(this.selectedData, true, null)
    },

    // 导出全部：按当前查询条件重新拉取，封顶 2000 条
    async exportAll () {
      if (this.exportAllLoading) return
      this.exportAllLoading = true
      const loading = this.$loading({ lock: true, text: this.$t('floatingPriceTenantPage.exporting') })
      try {
        const { rows, total } = await this.fetchAllForExport()
        if (!rows.length) {
          this.$message.warning(this.$t('floatingPriceTenantPage.msgNoDataExport'))
          return
        }
        this.buildXlsx(rows, false, total)
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('floatingPriceTenantPage.msgExportFail'))
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
      const tr = this.queryData.timeRange
      const params = {
        managerId: this.currentManagerId,
        tenantId: this.normalizeTenantId(this.queryData.tenantId),
        tenantType: this.queryData.tenantType,
        payType: this.queryData.payType,
        arrearsType: this.queryData.arrearsType,
        startDate: tr ? tr[0] : '',
        endDate: tr ? tr[1] : '',
        page: {
          current: 1,
          size: EXPORT_ALL_LIMIT
        }
      }
      const response = await settleTenantSettleStatistics(params)
      if (response.code !== 200) {
        this.$message.error(response.msg || this.$t('floatingPriceTenantPage.msgFetchFail'))
        return { rows: [], total: 0 }
      }
      return {
        rows: response.data?.dataList || [],
        total: response.data?.total || 0
      }
    },
    generateFileName () {
      const prefix = this.$t('floatingPriceTenantPage.filePrefix')
      const now = moment()
      const timeStr = now.format('YYYYMMDD_HHmmss')

      // 如果选择了特定租户，包含租户信息
      if (this.queryData.tenantId !== null && this.queryData.tenantId !== undefined && this.queryData.tenantId !== '') {
        const tenant = this.tenantList.find(t => String(t.id) === String(this.queryData.tenantId))
        const rawName = tenant ? String(tenant.name) : String(this.queryData.tenantId)
        const tenantName = this.$displayBizHybrid(rawName, 200)
        return `${prefix}_${tenantName}_${timeStr}.xlsx`
      }

      // 如果选择了时间范围，包含时间信息
      if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
        const startDate = this.queryData.timeRange[0].replace(/-/g, '')
        const endDate = this.queryData.timeRange[1].replace(/-/g, '')
        return `${prefix}_${startDate}-${endDate}_${timeStr}.xlsx`
      }

      return `${prefix}_${timeStr}.xlsx`
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

  .search-main-grid > .search-actions {
    grid-column: 5;
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

  .search-advanced-grid .advanced-field {
    grid-column: 1;
  }

  .search-advanced-grid > .search-actions-phantom {
    grid-column: 5;
  }

  .search-actions-phantom {
    visibility: hidden;
    pointer-events: none;
    user-select: none;
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

/* 租户账单统计：仅 2 个 KPI，等分一行 */
.statistics-container {
  margin-bottom: 16px;
}

.statistics-card-wrap {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.statistics-inner--two {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 16px;

  @media (max-width: 900px) {
    flex-wrap: wrap;
  }
}

.stat-flex-cell {
  flex: 1;
  min-width: 0;
  display: flex;
}

.statistics-inner--two .stat-item {
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
  }
}

.rid-text {
  color: #1677ff;
  font-weight: 500;
}

.tenant-link {
  font-weight: 500;
}

.tenant-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.resource-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 180px;
  padding: 2px 8px;
  font-size: 12px;
  color: #606266;
  background: #f0f2f5;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;

  i {
    color: #909399;
  }
}

.amount-text {
  font-weight: 500;
  color: #303133;

  &.text-danger {
    color: #f56c6c;
  }
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
