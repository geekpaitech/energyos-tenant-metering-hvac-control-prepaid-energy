<template>
  <div class="table-page-container">
    <div class="search-box">
      <el-form ref="searchForm" :model="queryData" class="search-form" @submit.native.prevent>
        <div class="search-main-grid">
          <div class="field-item">
            <el-date-picker
              v-model="queryData.timeRange"
              type="daterange"
              value-format="yyyy-MM-dd"
              range-separator="-"
              :start-placeholder="$t('tenantRefundPage.phDateStart')"
              :end-placeholder="$t('tenantRefundPage.phDateEnd')"
              size="small"
              style="width: 100%"
              :picker-options="pickerOptions"
              :default-time="['00:00:00', '23:59:59']"
              popper-class="elegant-date-picker"
              @change="onDateRangeChange"
            />
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.tenantId"
              filterable
              clearable
              :placeholder="$t('tenantRefundPage.phTenant')"
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="tenant in tenantList"
                :key="tenant.id"
                :label="formatTenantSelectLabel(tenant)"
                :value="tenant.id"
              />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.status"
              clearable
              :placeholder="$t('tenantRefundPage.phAuditStatus')"
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="item in balanceRefundStatus"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('tenantRefundPage.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('tenantRefundPage.btnReset') }}</el-button>
            <el-dropdown trigger="hover" @command="handleExportCommand">
              <el-button type="success" size="small" icon="el-icon-download">
                {{ $t('tenantRefundPage.btnExport') }}<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="currentPage">{{ $t('tenantRefundPage.exportCurrentPage') }}</el-dropdown-item>
                <el-dropdown-item command="selected">{{ $t('tenantRefundPage.exportSelected') }}</el-dropdown-item>
                <el-dropdown-item command="all">{{ $t('tenantRefundPage.exportAll') }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </el-form>
    </div>

    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            {{ $t('tenantRefundPage.sectionTitle') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option :label="$t('tenantRefundPage.sortDefault')" value="default" />
          </el-select>
        </div>
      </div>

      <div class="list-view">
      <el-table
        :key="'tenant-refund-' + localeKey"
        v-loading="loading"
        border
        :data="tableData"
        @selection-change="handleSelectionChange"
        row-key="rid"
        stripe
          style="width: 100%"
          class="custom-table light-border-table"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <el-table-column type="selection" width="55" align="center" reserve-selection />
          <el-table-column prop="rid" :label="$t('tenantRefundPage.colRid')" width="180" align="center" show-overflow-tooltip />
          <el-table-column prop="applyTime" :label="$t('tenantRefundPage.colApplyTime')" width="168" align="center" show-overflow-tooltip />
          <el-table-column :label="$t('tenantRefundPage.colTenantName')" min-width="160" show-overflow-tooltip>
            <template slot-scope="scope">
              <el-link
                v-if="scope.row.tenantId"
                type="primary"
                class="tenant-link"
                @click="handleTenantDetail(scope.row)"
              >
                {{ $displayBizHybrid(scope.row.tenantName) || '-' }}
              </el-link>
              <span v-else class="text-muted">{{ $displayBizHybrid(scope.row.tenantName) || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('tenantRefundPage.colBizType')" width="120" align="center">
            <template slot-scope="scope">
              {{ getBizTypeLabel(scope.row.bizType) }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('tenantRefundPage.colRefundType')" width="120" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ formatRefundType(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('tenantRefundPage.colApplyAmt')" width="150" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="amount-text">{{ formatMoneyCell(scope.row.applyAmt) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('tenantRefundPage.colActualAmt')" width="150" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="amount-text">{{ formatMoneyCell(scope.row.actualAmt) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('tenantRefundPage.colAuditStatus')" width="140" align="center">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.refundStatus)" size="small" effect="plain">
                {{ refundStatusLabel(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('tenantRefundPage.colAction')" width="150" fixed="right" align="center">
            <template slot-scope="scope">
              <div class="operation-cell">
                <el-button
                  v-if="canViewDetail"
                  type="text"
                  size="small"
                  class="op-btn primary-btn"
                  :disabled="isDetailDisabled(scope.row)"
                  @click="handleDetail(scope.row)"
                >
                  {{ $t('tenantRefundPage.btnDetail') }}
                </el-button>
                <el-button
                  v-if="canAuditRefund"
                  type="text"
                  size="small"
                  class="op-btn primary-btn"
                  :disabled="isAuditDisabled(scope.row)"
                  @click="handleAudit(scope.row)"
                >
                  {{ $t('tenantRefundPage.btnAudit') }}
                </el-button>
              </div>
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

    <tenant-refund-detail-drawer
      :visible.sync="detailDrawer.visible"
      :loading="detailDrawer.loading"
      :detail-info="detailDrawer.data"
      :refund-status-map="refundStatusMap"
    />
    <tenant-refund-audit-dialog
      :visible.sync="auditDialog.visible"
      :source-data="auditDialog.data"
      :user-phone="userPhone"
      @success="handleAuditSuccess"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import * as XLSX from 'xlsx'

const EXPORT_ALL_LIMIT = 2000
import {
  tenantRefundPageRefundRecord,
  tenantRefundTenantRefundDetails
} from '@/api/tenantRefund'
import { tenantGetById, tenantPageTenant } from '@/api/tenant'
import TenantRefundDetailDrawer from './components/TenantRefundDetailDrawer.vue'
import TenantRefundAuditDialog from './components/TenantRefundAuditDialog.vue'

export default {
  name: 'RefundAudit',
  components: {
    TenantRefundDetailDrawer,
    TenantRefundAuditDialog
  },
  data () {
    return {
      sortOrder: 'default',
      queryData: {
        tenantId: null,
        status: null,
        managerId: '',
        timeRange: []
      },
      tableData: [],
      loading: false,
      selectedData: [],
      exportAllLoading: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      tenantList: [],
      detailDrawer: {
        visible: false,
        loading: false,
        data: {}
      },
      auditDialog: {
        visible: false,
        data: {}
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapState({
      userPhone: state => state.user.phone
    }),
    localeKey () {
      return this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'zh-CN'
    },
    balanceRefundStatus () {
      return [
        { value: 0, label: this.$t('tenantRefundPage.statusVal0') },
        { value: 1, label: this.$t('tenantRefundPage.statusVal1') },
        { value: 2, label: this.$t('tenantRefundPage.statusVal2') },
        { value: 3, label: this.$t('tenantRefundPage.statusVal3') },
        { value: 4, label: this.$t('tenantRefundPage.statusVal4') },
        { value: 5, label: this.$t('tenantRefundPage.statusVal5') },
        { value: 6, label: this.$t('tenantRefundPage.statusVal6') }
      ]
    },
    pickerOptions () {
      const t = (key) => this.$t(`tenantRefundPage.${key}`)
      return {
        shortcuts: [
          {
            text: t('shortcutYesterday'),
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
            text: t('shortcutThisWeek'),
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
            text: t('shortcutLastWeek'),
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
            text: t('shortcutThisMonth'),
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
            text: t('shortcutLastMonth'),
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
            text: t('shortcutLast3Months'),
            onClick (picker) {
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              const start = new Date()
              start.setMonth(start.getMonth() - 3)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: t('shortcutLastYear'),
            onClick (picker) {
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              const start = new Date()
              start.setFullYear(start.getFullYear() - 1)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      }
    },
    kztMenuNos () {
      const list = this.$store.getters.kztMenuNos
      return Array.isArray(list) ? list : []
    },
    hasKztPermission () {
      const allow = new Set(this.kztMenuNos.map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canViewDetail () {
      return this.hasKztPermission('670040')
    },
    canAuditRefund () {
      return this.hasKztPermission('670041')
    },
    refundStatusMap () {
      return this.balanceRefundStatus.reduce((acc, item) => {
        acc[item.value] = item
        return acc
      }, {})
    }
  },
  watch: {
    currentManagerId: {
      immediate: true,
      handler (newVal) {
        if (!newVal) return
        this.queryData.managerId = newVal
        this.setDefaultTimeRange()
        this.getTenantList()
        this.fetchTableData()
      }
    }
  },
  methods: {
    normalizeSelect (v) {
      if (v === null || v === undefined || v === '') return undefined
      return v
    },

    setDefaultTimeRange () {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 1)
      this.queryData.timeRange = [this.formatDate(start), this.formatDate(end)]
    },

    formatDate (d) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },

    onDateRangeChange (val) {
      if (val && val.length === 2 && val[0] && val[1]) this.handleSearch()
    },

    formatMoneyCell (value) {
      if (value === null || value === undefined || value === '') return '-'
      return `¥${Number(value).toFixed(2)}`
    },

    /** 退款类型：接口暂无可靠枚举前统一展示「对公充值」，后续可再接后端字段 */
    formatRefundType () {
      return this.$t('tenantRefundPage.refundTypeCorporate')
    },

    getBizTypeLabel (bizType) {
      const labelMap = {
        1: this.$t('tenantRefundPage.bizElectric'),
        2: this.$t('tenantRefundPage.bizWater')
      }
      return labelMap[Number(bizType)] || '-'
    },

    formatTenantSelectLabel (tenant) {
      if (!tenant) return ''
      const id = tenant.id != null ? String(tenant.id) : ''
      const name = tenant.name != null && tenant.name !== '' ? this.$displayBizHybrid(tenant.name) : ''
      if (!id && !name) return '-'
      return name ? `${id} (${name})` : id
    },

    /** 与操作列禁用逻辑一致：兼容接口 number / string */
    refundStatusNum (row) {
      const raw = row && row.refundStatus
      if (raw === null || raw === undefined || raw === '') return null
      const n = Number(raw)
      return Number.isFinite(n) ? n : null
    },

    refundStatusLabel (row) {
      const n = this.refundStatusNum(row)
      if (n === null) return '-'
      return this.refundStatusMap[n]?.label || '-'
    },

    isDetailDisabled (row) {
      return this.refundStatusNum(row) === 0
    },

    isAuditDisabled (row) {
      return this.refundStatusNum(row) !== 0
    },

    getStatusTagType (status) {
      const n = Number(status)
      const typeMap = {
        0: 'warning',
        1: 'danger',
        2: 'primary',
        3: 'success',
        4: 'warning',
        5: 'danger',
        6: 'info'
      }
      return typeMap[Number.isFinite(n) ? n : NaN] || 'info'
    },

    async getTenantList () {
      try {
        const response = await tenantPageTenant({
          tenantStatus: 0,
          managerId: this.currentManagerId
        })
        if (response.code === 200 && response.data) {
          this.tenantList = response.data.dataList || []
          return
        }
        this.tenantList = []
        this.$message.error(response.msg || this.$t('tenantRefundPage.msgTenantListFail'))
      } catch (error) {
        console.error('获取租户列表失败:', error)
        this.tenantList = []
        this.$apiError.notify(error, this.$t('tenantRefundPage.msgTenantListFail'))
      }
    },

    async fetchTableData () {
      this.loading = true
      try {
        const tenantId = this.normalizeSelect(this.queryData.tenantId)
        const st = this.normalizeSelect(this.queryData.status)
        const response = await tenantRefundPageRefundRecord({
          type: 0,
          startDate: this.queryData.timeRange ? this.queryData.timeRange[0] : '',
          endDate: this.queryData.timeRange ? this.queryData.timeRange[1] : '',
          managerId: this.queryData.managerId,
          tenantId: tenantId === undefined ? undefined : tenantId,
          refundStatus: st === undefined ? '' : st,
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            orders: [{ asc: false, column: 'applyTime' }]
          }
        })
        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
          this.pageData.current = response.data.current || 1
        } else {
          this.tableData = []
          this.$message.error(response.msg || this.$t('tenantRefundPage.msgRefundListFail'))
        }
      } catch (error) {
        console.error('获取退款数据失败:', error)
        this.tableData = []
        this.$apiError.notify(error, this.$t('tenantRefundPage.msgRefundListFail'))
      } finally {
        this.loading = false
      }
    },

    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleReset () {
      this.queryData.tenantId = null
      this.queryData.status = null
      this.queryData.managerId = this.currentManagerId || ''
      this.setDefaultTimeRange()
      this.handleSearch()
    },

    buildXlsx (exportData, isSelected, total) {
      const headers = [
        this.$t('tenantRefundPage.colRid'),
        this.$t('tenantRefundPage.colApplyTime'),
        this.$t('tenantRefundPage.colTenantName'),
        this.$t('tenantRefundPage.colBizType'),
        this.$t('tenantRefundPage.colRefundType'),
        this.$t('tenantRefundPage.colApplyAmt'),
        this.$t('tenantRefundPage.colActualAmt'),
        this.$t('tenantRefundPage.colAuditStatus')
      ]
      const rows = exportData.map((row) => [
        row.rid || '',
        row.applyTime || '',
        this.$displayBizHybrid(row.tenantName) || '',
        this.getBizTypeLabel(row.bizType),
        this.formatRefundType(),
        row.applyAmt != null && row.applyAmt !== '' ? Number(row.applyAmt).toFixed(2) : '',
        row.actualAmt != null && row.actualAmt !== '' ? Number(row.actualAmt).toFixed(2) : '',
        this.refundStatusLabel(row)
      ])
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      const headerRange = XLSX.utils.decode_range(ws['!ref'])
      for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
        const cell = XLSX.utils.encode_cell({ r: 0, c })
        if (ws[cell]) {
          ws[cell].s = { font: { bold: true, color: { rgb: '303133' } }, fill: { fgColor: { rgb: 'F5F7FA' } }, alignment: { horizontal: 'center', vertical: 'center' } }
        }
      }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('tenantRefundPage.exportSheetName'))
      const timeStr = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
      XLSX.writeFile(wb, `${this.$t('tenantRefundPage.filePrefix')}_${timeStr}.xlsx`)
      const exportCount = exportData.length
      let successMsg
      if (isSelected) successMsg = this.$t('tenantRefundPage.msgExportOkSelected', { count: exportCount })
      else if (total != null && total > exportCount) successMsg = this.$t('tenantRefundPage.successExportedLimit', { count: exportCount, total })
      else if (total != null) successMsg = this.$t('tenantRefundPage.successExported', { count: exportCount })
      else successMsg = this.$t('tenantRefundPage.msgExportOk', { count: exportCount })
      this.$message.success(successMsg)
    },
    exportCurrentPage () {
      if (!this.tableData.length) {
        this.$message.warning(this.$t('tenantRefundPage.msgNoDataExport'))
        return
      }
      this.buildXlsx(this.tableData, false, null)
    },
    exportSelected () {
      if (!this.selectedData.length) {
        this.$message.warning(this.$t('tenantRefundPage.warnNoSelectedExport'))
        return
      }
      this.buildXlsx(this.selectedData, true, null)
    },
    async exportAll () {
      if (this.exportAllLoading) return
      this.exportAllLoading = true
      const loading = this.$loading({ lock: true, text: this.$t('tenantRefundPage.exporting') })
      try {
        const { rows, total } = await this.fetchAllForExport()
        if (!rows.length) {
          this.$message.warning(this.$t('tenantRefundPage.msgNoDataExport'))
          return
        }
        this.buildXlsx(rows, false, total)
      } catch (e) {
        console.error(e)
        this.$apiError.notify(e, this.$t('tenantRefundPage.msgExportFail'))
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
    handleSelectionChange (selection) {
      this.selectedData = selection
    },
    async fetchAllForExport () {
      const tenantId = this.normalizeSelect(this.queryData.tenantId)
      const st = this.normalizeSelect(this.queryData.status)
      const response = await tenantRefundPageRefundRecord({
        type: 0,
        startDate: this.queryData.timeRange ? this.queryData.timeRange[0] : '',
        endDate: this.queryData.timeRange ? this.queryData.timeRange[1] : '',
        managerId: this.queryData.managerId,
        tenantId: tenantId === undefined ? undefined : tenantId,
        refundStatus: st === undefined ? '' : st,
        page: { current: 1, size: EXPORT_ALL_LIMIT, orders: [{ asc: false, column: 'applyTime' }] }
      })
      if (response.code !== 200 || !response.data) {
        throw new Error(response.msg || this.$t('tenantRefundPage.msgRefundListFail'))
      }
      return { rows: response.data.dataList || [], total: response.data.total || 0 }
    },

    handleAudit (row) {
      if (!this.canAuditRefund) {
        this.$message.warning(this.$t('tenantRefundPage.msgNoAuditPerm'))
        return
      }
      if (this.isAuditDisabled(row)) return
      this.auditDialog.data = { ...row }
      this.auditDialog.visible = true
    },

    async handleDetail (row) {
      if (!this.canViewDetail) {
        this.$message.warning(this.$t('tenantRefundPage.msgNoViewPerm'))
        return
      }
      if (this.isDetailDisabled(row)) {
        this.$message.warning(this.$t('tenantRefundPage.msgDetailDisabled'))
        return
      }
      this.detailDrawer.visible = true
      this.detailDrawer.loading = true
      try {
        const response = await tenantRefundTenantRefundDetails({
          rid: row.rid
        })
        if (response.code === 200 && response.data) {
          const detailData = {
            ...response.data,
            rid: row.rid
          }
          let tenantAccountData = {}

          if (detailData.tenantId) {
            try {
              const tenantResponse = await tenantGetById({
                id: detailData.tenantId
              })
              if (tenantResponse.code === 200 && tenantResponse.data) {
                tenantAccountData = {
                  meterAccountDto: tenantResponse.data.meterAccountDto,
                  waterAccountDto: tenantResponse.data.waterAccountDto
                }
              }
            } catch (tenantError) {
              console.error('获取租户账户详情失败:', tenantError)
            }
          }

          this.detailDrawer.data = {
            ...detailData,
            ...tenantAccountData
          }
        } else {
          this.detailDrawer.data = { rid: row.rid }
          this.$message.error(response.msg || this.$t('tenantRefundPage.msgDetailFail'))
        }
      } catch (error) {
        console.error('获取退款详情失败:', error)
        this.detailDrawer.data = { rid: row.rid }
        this.$message.error(this.$t('tenantRefundPage.msgDetailFail'))
      } finally {
        this.detailDrawer.loading = false
      }
    },

    handleAuditSuccess () {
      this.auditDialog.visible = false
      this.fetchTableData()
      if (this.detailDrawer.visible && this.auditDialog.data.rid) {
        this.handleDetail(this.auditDialog.data)
      }
    },

    handleTenantDetail (row) {
      if (!row.tenantId) return
      this.$router.push({ path: `/metering/tenant/detail/${row.tenantId}` })
    },

    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

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

  .field-item {
    width: 100%;
    min-width: 0;

    ::v-deep .el-input,
    ::v-deep .el-select {
      width: 100%;
      display: block;
    }

    ::v-deep .el-input__inner,
    ::v-deep .el-select .el-input__inner,
    ::v-deep .el-range-editor.el-input__inner {
      height: 32px;
      line-height: 32px;
      border-radius: 6px;
      border-color: #e4e7ed;
      font-size: 13px;
    }

    ::v-deep .el-range-editor--small.el-input__inner {
      height: 32px;
      line-height: 32px;
    }

    ::v-deep .el-range-separator {
      line-height: 24px;
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
    grid-column: 4 / 6;
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

  .toolbar-left .section-title {
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

  .toolbar-right ::v-deep .el-select .el-input__inner {
    height: 32px;
    line-height: 32px;
    font-size: 13px;
    border-radius: 6px;
    border-color: #e4e7ed;
  }
}

.list-view {
  padding: 0;
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

.tenant-link {
  color: #1677ff !important;
  font-weight: 500;
  &:hover {
    color: #4096ff !important;
  }
}

.amount-text {
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

.text-muted {
  color: #c0c4cc;
}

.operation-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;

  .op-btn {
    padding: 0;
    margin: 0;
    font-size: 12px;
    &.primary-btn {
      color: #1677ff;
      &:hover:not(.is-disabled):not(:disabled) {
        color: #4096ff;
      }
      &:active:not(.is-disabled):not(:disabled) {
        color: #0958d9;
      }
    }
  }

  /* 恢复 Element 禁用态：避免主色样式盖住置灰（与改造前一致的可感知禁用） */
  ::v-deep .el-button--text.is-disabled,
  ::v-deep .el-button--text:disabled {
    color: #c0c4cc !important;
    cursor: not-allowed !important;
  }

  ::v-deep .el-button--text.is-disabled span,
  ::v-deep .el-button--text:disabled span {
    color: #c0c4cc !important;
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

<style lang="scss">
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
    color: #606266 !important;
    text-align: center !important;
    background: #ffffff !important;
    border: none !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    &:hover {
      color: #1677ff !important;
      background: #f0f7ff !important;
    }
    &:last-child {
      margin-bottom: 0 !important;
    }
  }

  .el-picker-panel__body {
    padding-left: 12px !important;
  }

  .el-date-table td {
    &.available:hover {
      color: #1677ff !important;
      background: #f0f7ff !important;
    }
    &.start-date span,
    &.end-date span {
      background: #1677ff !important;
    }
  }

  .el-picker-panel__footer .el-button--primary {
    background: #1677ff !important;
    border-color: #1677ff !important;
    &:hover {
      background: #4096ff !important;
      border-color: #4096ff !important;
    }
  }

  .el-picker-panel__icon-btn:hover {
    color: #1677ff !important;
  }
}
</style>
