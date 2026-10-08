<template>
  <div class="table-page-container">
    <div class="search-box">
      <el-form :model="queryData" ref="searchForm" class="search-form" @submit.native.prevent>
        <div class="search-main-grid">
          <!-- 布局同 device/watermeter -->
          <div class="field-item field-range">
            <el-date-picker
              v-model="queryData.timeRange"
              type="daterange"
              range-separator="-"
              :start-placeholder="$t('wechatRechargePage.phDateStart')"
              :end-placeholder="$t('wechatRechargePage.phDateEnd')"
              value-format="yyyy-MM-dd"
              size="small"
              style="width: 100%"
              :picker-options="pickerOptions"
              :default-time="['00:00:00', '23:59:59']"
              popper-class="elegant-date-picker"
              @change="handleDateChange"
            />
          </div>
          <div class="field-item field-tenant">
            <el-select
              v-model="queryData.tenantId"
              filterable
              clearable
              :placeholder="$t('wechatRechargePage.phTenant')"
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="item in tenantList"
                :key="item.tenantId"
                :label="String(item.tenantId) + ' - ' + $displayBizHybrid(item.name || '')"
                :value="item.tenantId"
              />
            </el-select>
          </div>

          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">
              {{ $t('wechatRechargePage.btnSearch') }}
            </el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('wechatRechargePage.btnReset') }}</el-button>
            <el-dropdown trigger="hover" @command="handleExportCommand">
              <el-button type="success" size="small" icon="el-icon-download">
                {{ $t('wechatRechargePage.btnExport') }}<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="currentPage">{{ $t('wechatRechargePage.exportCurrentPage') }}</el-dropdown-item>
                <el-dropdown-item command="selected">{{ $t('wechatRechargePage.exportSelected') }}</el-dropdown-item>
                <el-dropdown-item command="all">{{ $t('wechatRechargePage.exportAll') }}</el-dropdown-item>
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
            {{ $t('wechatRechargePage.sectionTitle') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option :label="$t('wechatRechargePage.sortDefault')" value="default" />
          </el-select>
        </div>
      </div>

      <div class="list-view">
        <el-table
          :key="'wechat-recharge-' + localeKey"
          v-loading="loading"
          border
          :data="tableData"
          @selection-change="handleSelectionChange"
          row-key="seqNo"
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
          <el-table-column :label="$t('wechatRechargePage.colSeqNo')" width="200" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ scope.row.seqNo || scope.row.rid || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="occurTime" :label="$t('wechatRechargePage.colOccurTime')" width="168" align="center" />
          <el-table-column :label="$t('wechatRechargePage.colTenantName')" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">
              <el-link
                v-if="scope.row.tenantId"
                type="primary"
                class="tenant-link"
                @click="goTenantDetail(scope.row)"
              >
                {{ $displayBizHybrid(scope.row.tenantName || '') || '-' }}
              </el-link>
              <span v-else class="text-muted">{{ $displayBizHybrid(scope.row.tenantName || '') || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('wechatRechargePage.colRechargeAccount')" width="150" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.rechargeAccount || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('wechatRechargePage.colAmount')" width="130" align="center">
            <template slot-scope="scope">
              <span class="amount-text">¥{{ formatMoney(scope.row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('wechatRechargePage.colFeeRate')" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ formatFeeRate(scope.row.feeRate) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('wechatRechargePage.colFee')" width="120" align="center">
            <template slot-scope="scope">
              <span class="fee-text">¥{{ formatMoney(scope.row.fee) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('wechatRechargePage.colStatus')" width="110" align="center">
            <template slot-scope="scope">
              <div class="status-inline">
                <span class="status-dot" :style="{ backgroundColor: getStatusColor(scope.row.status) }" />
                {{ getStatusLabel(scope.row.status) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('wechatRechargePage.colAction')" width="100" align="center" fixed="right">
            <template slot-scope="scope">
              <div class="operation-cell">
                <el-button
                  v-if="canRefund(scope.row)"
                  type="text"
                  size="mini"
                  class="op-btn primary-btn"
                  @click="handleRefund(scope.row)"
                >
                  {{ $t('wechatRechargePage.btnRefund') }}
                </el-button>
                <span v-else class="text-muted">-</span>
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
  </div>
</template>

<script>
import { capitalManagePageTenantRecord, getSimpleTenantList } from '@/api/publicRecharge'
import { mapGetters } from 'vuex'
import * as XLSX from 'xlsx'

const EXPORT_ALL_LIMIT = 2000

export default {
  name: 'WechatRecharge',
  data () {
    return {
      sortOrder: 'default',
      queryData: {
        tenantId: null,
        timeRange: []
      },
      tenantList: [],
      tableData: [],
      loading: false,
      selectedData: [],
      exportAllLoading: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0
      }
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    localeKey () {
      return this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'zh-CN'
    },
    pickerOptions () {
      const t = (key) => this.$t(`wechatRechargePage.${key}`)
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
    statusTableOptions () {
      return [
        { label: this.$t('wechatRechargePage.statusSuccess'), value: 1, color: '#52c41a' },
        { label: this.$t('wechatRechargePage.statusFail'), value: 0, color: '#F56C6C' },
        { label: this.$t('wechatRechargePage.statusRevoked'), value: 2, color: '#909399' }
      ]
    }
  },

  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.fetchTenantList()
          this.setDefaultTimeRange()
          this.fetchTableData()
        }
      },
      immediate: true
    }
  },

  methods: {
    normalizeSelect (v) {
      if (v === null || v === undefined || v === '') return undefined
      return v
    },

    setDefaultTimeRange () {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setTime(startDate.getTime() - 3600 * 1000 * 24 * 30)
      this.queryData.timeRange = [this.formatDate(startDate), this.formatDate(endDate)]
    },

    formatDate (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    formatMoney (amount) {
      if (amount === null || amount === undefined) return '0.00'
      return Number(amount).toFixed(2)
    },

    formatFeeRate (rate) {
      if (rate === null || rate === undefined) return '-'
      return `${(Number(rate) * 100).toFixed(2)}%`
    },

    getStatusLabel (status) {
      const statusObj = this.statusTableOptions.find((s) => s.value === status)
      return statusObj ? statusObj.label : '-'
    },

    getStatusColor (status) {
      const statusObj = this.statusTableOptions.find((s) => s.value === status)
      return statusObj ? statusObj.color : '#909399'
    },

    canRefund (row) {
      return row.status === 1
    },

    goTenantDetail (row) {
      const id = row && row.tenantId
      if (!id) return
      this.$router.push({ path: `/metering/tenant/detail/${id}` })
    },

    handleDateChange (value) {
      if (value && value.length === 2 && value[0] && value[1]) this.handleSearch()
    },

    async fetchTenantList () {
      try {
        const params = { managerId: this.currentManagerId, tenantStatus: 0 }
        const response = await getSimpleTenantList(params)
        if (response.code === 200) this.tenantList = response.data || []
      } catch (error) {
        console.error('获取租户列表失败:', error)
        this.$apiError.notify(error, this.$t('wechatRechargePage.msgTenantListFail'))
      }
    },

    async fetchTableData () {
      this.loading = true
      try {
        const tenantId = this.normalizeSelect(this.queryData.tenantId)
        const params = {
          managerId: this.currentManagerId,
          tenantId: tenantId === undefined ? null : tenantId,
          startDate:
            this.queryData.timeRange && this.queryData.timeRange[0]
              ? `${this.queryData.timeRange[0]} 00:00:00`
              : '',
          endDate:
            this.queryData.timeRange && this.queryData.timeRange[1]
              ? `${this.queryData.timeRange[1]} 23:59:59`
              : '',
          channels: ['WECHAT'],
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            orders: [{ asc: false, column: 'occurTime' }]
          }
        }

        const response = await capitalManagePageTenantRecord(params)
        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || this.$t('wechatRechargePage.msgFetchFail'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('wechatRechargePage.msgFetchRecordFail'))
        console.error('获取充值记录失败:', error)
      } finally {
        this.loading = false
      }
    },

    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleReset () {
      this.queryData = { tenantId: null, timeRange: [] }
      this.setDefaultTimeRange()
      this.handleSearch()
    },

    buildXlsx (exportData, isSelected, total) {
      const headers = [
        this.$t('wechatRechargePage.colSeqNo'),
        this.$t('wechatRechargePage.colOccurTime'),
        this.$t('wechatRechargePage.colTenantName'),
        this.$t('wechatRechargePage.colRechargeAccount'),
        this.$t('wechatRechargePage.colAmount'),
        this.$t('wechatRechargePage.colFeeRate'),
        this.$t('wechatRechargePage.colFee'),
        this.$t('wechatRechargePage.colStatus')
      ]
      const rows = exportData.map((row) => [
        row.seqNo || row.rid || '',
        row.occurTime || '',
        this.$displayBizHybrid(row.tenantName || ''),
        row.rechargeAccount || '',
        row.amount != null ? Number(row.amount).toFixed(2) : '',
        this.formatFeeRate(row.feeRate),
        row.fee != null ? Number(row.fee).toFixed(2) : '',
        this.getStatusLabel(row.status)
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
      const sheetName = this.$t('wechatRechargePage.exportSheetName').slice(0, 31)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      const timeStr = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
      const filePrefix = this.$t('wechatRechargePage.filePrefix')
      XLSX.writeFile(wb, `${filePrefix}_${timeStr}.xlsx`)
      const exportCount = exportData.length
      let successMsg
      if (isSelected) successMsg = this.$t('wechatRechargePage.msgExportOkSelected', { count: exportCount })
      else if (total != null && total > exportCount) successMsg = this.$t('wechatRechargePage.successExportedLimit', { count: exportCount, total })
      else if (total != null) successMsg = this.$t('wechatRechargePage.successExported', { count: exportCount })
      else successMsg = this.$t('wechatRechargePage.msgExportOk', { count: exportCount })
      this.$message.success(successMsg)
    },
    exportCurrentPage () {
      if (!this.tableData.length) {
        this.$message.warning(this.$t('wechatRechargePage.msgNoDataExport'))
        return
      }
      this.buildXlsx(this.tableData, false, null)
    },
    exportSelected () {
      if (!this.selectedData.length) {
        this.$message.warning(this.$t('wechatRechargePage.warnNoSelectedExport'))
        return
      }
      this.buildXlsx(this.selectedData, true, null)
    },
    async exportAll () {
      if (this.exportAllLoading) return
      this.exportAllLoading = true
      const loading = this.$loading({ lock: true, text: this.$t('wechatRechargePage.exporting') })
      try {
        const { rows, total } = await this.fetchAllForExport()
        if (!rows.length) {
          this.$message.warning(this.$t('wechatRechargePage.msgNoDataExport'))
          return
        }
        this.buildXlsx(rows, false, total)
      } catch (e) {
        console.error(e)
        this.$apiError.notify(e, this.$t('wechatRechargePage.msgExportFail'))
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
      const params = {
        managerId: this.currentManagerId,
        tenantId: tenantId === undefined ? null : tenantId,
        startDate: this.queryData.timeRange && this.queryData.timeRange[0] ? `${this.queryData.timeRange[0]} 00:00:00` : '',
        endDate: this.queryData.timeRange && this.queryData.timeRange[1] ? `${this.queryData.timeRange[1]} 23:59:59` : '',
        channels: ['WECHAT'],
        page: { current: 1, size: EXPORT_ALL_LIMIT, orders: [{ asc: false, column: 'occurTime' }] }
      }
      const response = await capitalManagePageTenantRecord(params)
      if (response.code !== 200 || !response.data) {
        throw new Error(response.msg || this.$t('wechatRechargePage.msgFetchFail'))
      }
      return { rows: response.data.dataList || [], total: response.data.total || 0 }
    },

    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    },

    async handleRefund () {
      this.$message.info(this.$t('wechatRechargePage.msgRefundDev'))
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
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px;
  }

  .field-range {
    grid-column: 1;
  }

  .field-tenant {
    grid-column: 2;
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
    justify-self: start;
    grid-column: 3;
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

.fee-text {
  color: #374151;
  font-weight: 500;
  font-size: 13px;
}

.status-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.operation-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  .op-btn {
    padding: 0;
    margin: 0;
    font-size: 12px;
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
}

.text-muted {
  color: #c0c4cc;
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
    &.today span {
      color: #1677ff !important;
    }
  }

  .el-picker-panel__footer {
    padding: 10px 12px !important;
    background: #fafafa !important;
    border-top: 1px solid #e8e8e8 !important;
    .el-button--primary {
      background: #1677ff !important;
      border-color: #1677ff !important;
      &:hover {
        background: #4096ff !important;
        border-color: #4096ff !important;
      }
    }
  }

  .el-picker-panel__icon-btn:hover {
    color: #1677ff !important;
  }
}
</style>
