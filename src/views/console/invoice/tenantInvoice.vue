<template>
  <div class="table-page-container tenant-invoice-page">
    <div class="search-box">
      <el-form :model="queryData" ref="searchForm" class="search-form" @submit.native.prevent>
        <div class="search-main-grid">
          <div class="field-item">
            <el-date-picker
              v-model="queryData.timeRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              size="small"
              style="width: 100%"
              @change="handleSearch"
            />
          </div>
          <div class="field-item">
            <el-input
              v-model="queryData.invoiceNo"
              clearable
              placeholder="发票编号"
              size="small"
              @keyup.enter.native="handleSearch"
            />
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.tenantId"
              filterable
              clearable
              placeholder="租户名称/编号"
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="tenant in tenantList"
                :key="tenant.id"
                :label="`${tenant.id}(${tenant.name})`"
                :value="tenant.id"
              >
                <span style="font-size: 12px">{{ tenant.id }}({{ tenant.name }})</span>
              </el-option>
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.status"
              clearable
              placeholder="审核状态"
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="item in invoiceStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">查询</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">重置</el-button>
            <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </el-form>
    </div>

    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            开票申请
          </span>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAddInvoice">
            新增
          </el-button>
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option label="默认排序" value="default" />
          </el-select>
        </div>
      </div>

      <div v-if="selectedData.length > 0" class="selection-toolbar">
        <span class="selection-info">
          已选择 <span class="count">{{ selectedData.length }}</span> 条
        </span>
        <el-button size="mini" @click="handleBatchPass">批量通过</el-button>
        <el-button size="mini" type="danger" plain @click="handleBatchReject">批量拒绝</el-button>
      </div>

      <div class="list-view">
        <el-table
          ref="table"
          v-loading="loading"
          :data="tableData"
          border
          stripe
          size="small"
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
            prop="invoiceNo"
            label="发票编号"
            width="160"
            align="center"
            show-overflow-tooltip
            fixed="left"
          >
            <template slot-scope="scope">
              <el-link type="primary" class="tenant-link" @click="handleDetail(scope.row)">
                {{ scope.row.invoiceNo || '-' }}
              </el-link>
            </template>
          </el-table-column>

          <el-table-column prop="applyDate" label="申请日期" width="120" align="center" show-overflow-tooltip />

          <el-table-column prop="tenantId" label="租户ID" width="120" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="text-primary">{{ scope.row.tenantId || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="tenantName" label="租户名称" min-width="200" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span><i class="el-icon-user" /> {{ scope.row.tenantName || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="invoiceType" label="发票类型" width="120" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.invoiceType === 1" type="primary" size="small" effect="plain">
                增值税普通发票
              </el-tag>
              <el-tag v-else-if="scope.row.invoiceType === 2" type="warning" size="small" effect="plain">
                增值税专用发票
              </el-tag>
              <el-tag v-else-if="scope.row.invoiceType === 3" type="success" size="small" effect="plain">
                电子发票
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="invoiceTitle" label="发票抬头" min-width="180" align="center" show-overflow-tooltip />

          <el-table-column prop="taxNumber" label="税号" width="180" align="center" show-overflow-tooltip />

          <el-table-column prop="amount" label="开票金额" width="120" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="amount-text text-warning">{{ formatMoney(scope.row.amount) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="taxAmount" label="税额" width="100" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="amount-text">{{ formatMoney(scope.row.taxAmount) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="totalAmount" label="价税合计" width="120" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="amount-text text-danger">{{ formatMoney(scope.row.totalAmount) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="billingMethod" label="开票方式" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.billingMethod === 1 ? 'success' : 'info'" size="small">
                {{ scope.row.billingMethod === 1 ? '自动开票' : '手动开票' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="审核状态" width="120" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.status === 0" type="warning" size="small" effect="plain">待审核</el-tag>
              <el-tag v-else-if="scope.row.status === 1" type="success" size="small" effect="plain">已通过</el-tag>
              <el-tag v-else-if="scope.row.status === 2" type="danger" size="small" effect="plain">已拒绝</el-tag>
              <el-tag v-else-if="scope.row.status === 3" type="primary" size="small" effect="plain">已开票</el-tag>
              <el-tag v-else-if="scope.row.status === 4" type="info" size="small" effect="plain">已作废</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="auditor" label="审核人" width="100" align="center" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.auditor || '-' }}</template>
          </el-table-column>

          <el-table-column prop="auditTime" label="审核时间" width="160" align="center" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.auditTime || '-' }}</template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template slot-scope="scope">
              <div class="table-actions-group">
                <template v-if="scope.row.status === 0">
                  <el-button type="text" size="small" class="op-btn primary-btn" @click="handleAudit(scope.row)">
                    审核
                  </el-button>
                  <el-divider direction="vertical" />
                </template>

                <template v-if="scope.row.status === 1">
                  <el-button type="text" size="small" class="op-btn primary-btn" @click="handleIssueInvoice(scope.row)">
                    开票
                  </el-button>
                  <el-divider direction="vertical" />
                </template>

                <template v-if="scope.row.status === 3">
                  <el-button type="text" size="small" class="op-btn primary-btn" @click="handleVoidInvoice(scope.row)">
                    作废
                  </el-button>
                  <el-divider direction="vertical" />
                </template>

                <el-dropdown trigger="click" @command="handleTableCommand($event, scope.row)">
                  <el-button type="text" size="small" class="op-btn primary-btn">
                    更多 <i class="el-icon-arrow-down el-icon--right" />
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="detail" icon="el-icon-view">查看详情</el-dropdown-item>
                    <el-dropdown-item v-if="scope.row.status === 4" command="reissue" icon="el-icon-refresh">
                      重新开票
                    </el-dropdown-item>
                    <el-dropdown-item command="print" icon="el-icon-printer">打印发票</el-dropdown-item>
                    <el-dropdown-item command="download" icon="el-icon-download">下载发票</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
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
import moment from 'moment'
import { mapGetters } from 'vuex'

const invoiceStatusOptions = [
  { value: 0, label: '待审核' },
  { value: 1, label: '已通过' },
  { value: 2, label: '已拒绝' },
  { value: 3, label: '已开票' },
  { value: 4, label: '已作废' }
]

export default {
  name: 'TenantInvoice',
  data () {
    return {
      sortOrder: 'default',
      queryData: {
        invoiceNo: '',
        tenantId: null,
        invoiceType: null,
        status: null,
        billingMethod: null,
        taxNumber: '',
        managerId: '',
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ]
      },
      tableData: [],
      loading: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      selectedData: [],
      invoiceStatusOptions,
      tenantList: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId'])
  },
  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          this.setEmptyData()
        }
      },
      immediate: true
    }
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      if (this.currentManagerId) {
        this.queryData.managerId = this.currentManagerId
      }
      this.setEmptyData()
    },

    getTenantList () {
      this.tenantList = []
    },

    async fetchTableData () {
      this.setEmptyData()
    },

    setEmptyData () {
      this.loading = false
      this.tableData = []
      this.pageData.total = 0
      this.selectedData = []
      if (this.$refs.table) {
        this.$refs.table.clearSelection()
      }
    },

    formatMoney (value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return `¥${parseFloat(value).toFixed(2)}`
    },

    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleReset () {
      this.queryData = {
        invoiceNo: '',
        tenantId: null,
        invoiceType: null,
        status: null,
        billingMethod: null,
        taxNumber: '',
        managerId: this.currentManagerId || '',
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ]
      }
      this.handleSearch()
    },

    handleTableCommand (command, row) {
      switch (command) {
        case 'detail':
          this.handleDetail(row)
          break
        case 'reissue':
          this.handleReissue(row)
          break
        case 'print':
          this.handlePrint(row)
          break
        case 'download':
          this.handleDownload(row)
          break
      }
    },

    handleAddInvoice () {
      this.$message.warning('当前管理方未开通此权限')
    },

    handleExport () {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }

      const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData

      const params = {
        ele: this.$refs.table?.$el,
        name: '开票申请.xlsx',
        data: exportData
      }

      if (this.$store && this.$store.dispatch) {
        this.$store.dispatch('export/export', params)
      } else {
        this.$message.info('导出功能开发中...')
      }
    },

    handleBatchPass () {
      const pendingData = this.selectedData.filter(item => item.status === 0)
      if (pendingData.length === 0) {
        this.$message.warning('所选发票中没有待审核的发票')
        return
      }

      this.$confirm(`确定要批量通过 ${pendingData.length} 条发票申请吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('批量审核通过成功')
        this.fetchTableData()
      }).catch(() => {})
    },

    handleBatchReject () {
      const pendingData = this.selectedData.filter(item => item.status === 0)
      if (pendingData.length === 0) {
        this.$message.warning('所选发票中没有待审核的发票')
        return
      }

      this.$confirm(`确定要批量拒绝 ${pendingData.length} 条发票申请吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('批量拒绝成功')
        this.fetchTableData()
      }).catch(() => {})
    },

    handleAudit (row) {
      this.$confirm('请选择审核操作', '发票审核', {
        distinguishCancelAndClose: true,
        confirmButtonText: '通过',
        cancelButtonText: '拒绝',
        type: 'info'
      }).then(() => {
        this.$message.success('审核通过成功')
        row.status = 1
        row.auditor = '当前用户'
        row.auditTime = moment().format('YYYY-MM-DD HH:mm:ss')
      }).catch(action => {
        if (action === 'cancel') {
          this.$message.error('审核已拒绝')
          row.status = 2
          row.auditor = '当前用户'
          row.auditTime = moment().format('YYYY-MM-DD HH:mm:ss')
        }
      })
    },

    handleIssueInvoice (row) {
      this.$confirm(`确定要为发票编号 ${row.invoiceNo} 开票吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('开票成功')
        row.status = 3
        this.fetchTableData()
      }).catch(() => {})
    },

    handleVoidInvoice (row) {
      this.$confirm(`确定要作废发票编号 ${row.invoiceNo} 吗？此操作不可恢复！`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('发票作废成功')
        row.status = 4
        this.fetchTableData()
      }).catch(() => {})
    },

    handleReissue (row) {
      this.$confirm(`确定要重新开具发票编号 ${row.invoiceNo} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        this.$message.success('重新开票申请已提交')
        row.status = 0
        row.auditor = null
        row.auditTime = null
        this.fetchTableData()
      }).catch(() => {})
    },

    handlePrint (row) {
      this.$message.info(`打印发票 ${row.invoiceNo}...`)
    },

    handleDownload (row) {
      this.$message.success(`开始下载发票 ${row.invoiceNo}`)
    },

    handleDetail (row) {
      this.$message.info(`查看发票 ${row.invoiceNo} 详情`)
    },

    handleSelectionChange (selection) {
      this.selectedData = selection
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
.table-page-container.tenant-invoice-page {
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
    justify-self: start;
    grid-column: 5;
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
  flex-wrap: wrap;
  gap: 8px;

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

  .toolbar-right {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .toolbar-right ::v-deep .el-select .el-input__inner {
    height: 32px;
    line-height: 32px;
    font-size: 13px;
    border-radius: 6px;
    border-color: #e4e7ed;
  }

  ::v-deep .el-button--primary {
    background: #1677ff;
    border-color: #1677ff;
    &:hover {
      background: #4096ff;
      border-color: #4096ff;
    }
  }
}

.selection-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0 8px 10px;
  margin-top: -4px;

  .selection-info {
    font-size: 13px;
    color: #606266;
    .count {
      color: #1677ff;
      font-weight: 600;
    }
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
  font-weight: 500;
  color: #303133;

  &.text-danger {
    color: #f56c6c;
  }

  &.text-warning {
    color: #e6a23c;
  }
}

.text-primary {
  color: #1677ff;
}

.table-actions-group {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;

  .el-divider--vertical {
    height: 12px;
    margin: 0 8px;
  }

  .op-btn.primary-btn {
    color: #1677ff;
    padding: 0;
    font-size: 12px;

    &:hover {
      color: #4096ff;
    }
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
