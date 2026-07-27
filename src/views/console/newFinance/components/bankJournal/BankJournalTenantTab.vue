<template>
  <div class="bank-journal-tenant">
    <div class="search-box">
      <el-form class="search-form" @submit.native.prevent>
        <div class="search-main-grid">
          <!-- 时间筛选固定第一位（财务列表规范） -->
          <div class="field-item">
            <el-date-picker
              v-model="queryData.timeRange"
              type="daterange"
              value-format="yyyy-MM-dd"
              range-separator="-"
              :start-placeholder="$t('bankJournalPage.phDateStart')"
              :end-placeholder="$t('bankJournalPage.phDateEnd')"
              size="small"
              style="width: 100%"
              @change="onDateChange"
            />
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.tenantId"
              filterable
              clearable
              :placeholder="$t('bankJournalPage.phTenant')"
              size="small"
              style="width: 100%"
              @change="onSearch"
            >
              <el-option
                v-for="item in tenantOptions"
                :key="item.tenantId"
                :label="String(item.tenantId) + ' - ' + $displayBizHybrid(item.name || '')"
                :value="item.tenantId"
              />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.status"
              clearable
              :placeholder="$t('bankJournalPage.phStatus')"
              size="small"
              style="width: 100%"
              @change="onSearch"
            >
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.bankType"
              clearable
              :placeholder="$t('bankJournalPage.phBankType')"
              size="small"
              style="width: 100%"
              @change="onSearch"
            >
              <el-option v-for="item in bankTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>

          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="onSearch">
              {{ $t('bankJournalPage.btnSearch') }}
            </el-button>
            <el-button size="small" icon="el-icon-refresh" @click="onReset">{{ $t('bankJournalPage.btnReset') }}</el-button>
            <el-button type="success" size="small" icon="el-icon-download" @click="exportCurrentPage">
              {{ $t('bankJournalPage.btnExport') }}
            </el-button>
          </div>
        </div>
      </el-form>
    </div>

    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            {{ $t('bankJournalPage.sectionTenantTitle') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option :label="$t('bankJournalPage.sortDefault')" value="default" />
          </el-select>
        </div>
      </div>

      <div class="list-view">
        <el-table
          :key="'bank-journal-tenant-' + localeKey"
          v-loading="loading"
          :data="tableRows"
          border
          stripe
          class="custom-table light-border-table"
          style="width: 100%"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <el-table-column prop="seqNo" :label="$t('bankJournalPage.colSeqNo')" width="180" show-overflow-tooltip />
          <el-table-column prop="payeeName" :label="$t('bankJournalPage.colPayeeName')" width="200" show-overflow-tooltip />
          <el-table-column prop="bankNumber" :label="$t('bankJournalPage.colBankNumber')" width="200" show-overflow-tooltip />
          <el-table-column :label="$t('bankJournalPage.colAmountYuan')" width="120" align="right">
            <template slot-scope="scope">{{ formatMoney(scope.row.balance) }}</template>
          </el-table-column>
          <el-table-column prop="receivAccount" :label="$t('bankJournalPage.colReceivAccount')" width="200" show-overflow-tooltip />
          <el-table-column prop="receivAccountNum" :label="$t('bankJournalPage.colReceivAccountNum')" width="200" show-overflow-tooltip />
          <el-table-column prop="openingBank" :label="$t('bankJournalPage.colOpeningBank')" width="180" show-overflow-tooltip />
          <el-table-column prop="bankTypeLabel" :label="$t('bankJournalPage.colRecvBank')" width="120" show-overflow-tooltip />
          <el-table-column prop="remark" :label="$t('bankJournalPage.colRemark')" width="160" show-overflow-tooltip />
          <el-table-column prop="tenantId" :label="$t('bankJournalPage.colTenantId')" width="100" />
          <el-table-column :label="$t('bankJournalPage.colTenantName')" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ $displayBizHybrid(scope.row.tenantName || '') || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="$t('bankJournalPage.colTime')" width="170" />
          <el-table-column prop="typeLabel" :label="$t('bankJournalPage.colType')" width="100" />
          <el-table-column :label="$t('bankJournalPage.colStatus')" width="100" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.statusMeta" size="small" :type="scope.row.statusMeta.tag">{{ scope.row.statusMeta.label }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <!-- 670011 仅查看；670012 处理；670013 作废（与对公充值页后台权限配置一致） -->
          <el-table-column :label="$t('bankJournalPage.colAction')" fixed="right" width="140" align="center">
            <template slot-scope="scope">
              <div v-if="scope.row.status === 0" class="operation-cell">
                <el-button
                  v-if="canProcess"
                  type="text"
                  size="mini"
                  class="op-btn primary-btn"
                  @click="onAudit(scope.row)"
                >
                  {{ $t('bankJournalPage.btnProcess') }}
                </el-button>
                <el-button
                  v-if="canVoid"
                  type="text"
                  size="mini"
                  class="op-btn primary-btn"
                  @click="onVoid(scope.row)"
                >
                  {{ $t('bankJournalPage.btnVoid') }}
                </el-button>
                <span v-if="!canProcess && !canVoid" class="text-muted">-</span>
              </div>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container compact-pagination">
          <el-pagination
            :current-page="queryData.current"
            :page-sizes="[15, 30, 60]"
            :page-size="queryData.pageSize"
            :total="queryData.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <JournalAuditDialog :audit-dialog="auditData" :tenant-options="tenantOptions" @search="getTableData" />
    <RefundDialog :refund-dialog="refundDialog" @search="getTableData" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as XLSX from 'xlsx'
import { getSimpleTenantList } from '@/api/publicRecharge'
import { pufaPageRechangeNohandle, pufaUpdateRechangeNohandleStatus } from '@/api/bankEnterpriseDirect'
import JournalAuditDialog from './JournalAuditDialog.vue'
import RefundDialog from './RefundDialog.vue'
import {
  BANK_TYPE_DEFS,
  TYPE_DEFS,
  STATUS_DEFS,
  bankTypeLabel,
  defaultDateRange
} from './bankJournalConstants'

export default {
  name: 'BankJournalTenantTab',
  components: { JournalAuditDialog, RefundDialog },
  data () {
    return {
      loading: false,
      rawList: [],
      sortOrder: 'default',
      tenantOptions: [],
      queryData: this.buildDefaultQuery(),
      auditData: { show: false, data: {} },
      refundDialog: { show: false, data: {} }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    localeKey () {
      return this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'zh-CN'
    },
    bankTypeOptions () {
      return BANK_TYPE_DEFS.map((d) => ({
        value: d.value,
        label: this.$t(`bankJournalPage.${d.labelKey}`)
      }))
    },
    statusOptions () {
      return STATUS_DEFS.map((d) => ({
        value: d.value,
        label: this.$t(`bankJournalPage.${d.labelKey}`)
      }))
    },
    tableRows () {
      void this.localeKey
      return (this.rawList || []).map((row) => this.mapRow(row))
    },
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    /** 银企直连 · 处理（入账审核等） */
    canProcess () {
      return this.hasKztPermission('670012')
    },
    /** 银企直连 · 作废 */
    canVoid () {
      return this.hasKztPermission('670013')
    }
  },
  watch: {
    currentManagerId: {
      immediate: true,
      handler () {
        this.refreshTenantOptions()
        if (this._bankJournalMounted) this.getTableData()
      }
    }
  },
  mounted () {
    this._bankJournalMounted = true
    if (this.$route.query.subAccount) {
      this.queryData.subAccount = this.$route.query.subAccount
    }
    this.getTableData()
  },
  methods: {
    normalizeSelect (v) {
      if (v === null || v === undefined || v === '') return undefined
      return v
    },
    buildDefaultQuery () {
      return {
        tenantId: null,
        status: null,
        bankType: null,
        subAccount: '',
        payeeName: '',
        bankNumber: '',
        timeRange: defaultDateRange(),
        pageSize: 30,
        total: 0,
        current: 1
      }
    },
    formatMoney (v) {
      if (v === null || v === undefined || v === '') return '-'
      return Number(v).toFixed(2)
    },
    onDateChange (val) {
      if (val && val.length === 2 && val[0] && val[1]) this.onSearch()
    },
    async refreshTenantOptions () {
      const mid = this.currentManagerId
      if (!mid) {
        this.tenantOptions = []
        return
      }
      try {
        const res = await getSimpleTenantList({ managerId: mid, tenantStatus: 0 })
        if (res.code === 200) this.tenantOptions = res.data || []
      } catch {
        this.tenantOptions = []
      }
    },
    onSearch () {
      this.queryData.current = 1
      this.getTableData()
    },
    onReset () {
      this.queryData = this.buildDefaultQuery()
      if (this.$route.query.subAccount) this.queryData.subAccount = this.$route.query.subAccount
      this.refreshTenantOptions()
      this.getTableData()
    },
    handleSizeChange (size) {
      this.queryData.pageSize = size
      this.queryData.current = 1
      this.getTableData()
    },
    handleCurrentChange (p) {
      this.queryData.current = p
      this.getTableData()
    },
    mapRow (item) {
      const statusDef = STATUS_DEFS.find((s) => s.value === item.status) || null
      const typeEntry = TYPE_DEFS.find((t) => String(t.value) === String(item.type))
      const statusMeta = statusDef
        ? {
          value: statusDef.value,
          tag: statusDef.tag,
          label: this.$t(`bankJournalPage.${statusDef.labelKey}`)
        }
        : null
      return {
        ...item,
        statusMeta,
        typeLabel: typeEntry ? this.$t(`bankJournalPage.${typeEntry.labelKey}`) : '-',
        bankTypeLabel: bankTypeLabel(item.bankType, (key) => this.$t(key))
      }
    },
    async getTableData () {
      if (!this.queryData.timeRange) this.queryData.timeRange = ['', '']
      this.loading = true
      try {
        const st = this.normalizeSelect(this.queryData.status)
        const bt = this.normalizeSelect(this.queryData.bankType)
        const tid = this.normalizeSelect(this.queryData.tenantId)
        const query = {
          startDate: this.queryData.timeRange[0],
          endDate: this.queryData.timeRange[1],
          type: 0,
          status: st,
          receivAccountNum: this.queryData.subAccount,
          bankNumber: this.queryData.bankNumber,
          bankType: bt,
          managerId: this.currentManagerId || undefined,
          tenantId: tid,
          payeeName: this.queryData.payeeName,
          page: {
            current: this.queryData.current,
            size: this.queryData.pageSize,
            searchCount: true,
            orders: [{ asc: false, column: 'createTime' }]
          }
        }
        const res = await pufaPageRechangeNohandle(query)
        if (res.code === 200 && res.data) {
          const dataList = res.data.dataList || []
          this.queryData.total = res.data.total || 0
          this.rawList = dataList
        }
      } catch (e) {
        this.$message.error(e.msg || this.$t('bankJournalPage.msgLoadFail'))
      } finally {
        this.loading = false
      }
    },
    onAudit (row) {
      this.auditData.data = { ...row }
      this.auditData.show = true
    },
    async onVoid (row) {
      try {
        await this.$confirm(
          this.$t('bankJournalPage.msgConfirmVoid'),
          this.$t('bankJournalPage.confirmTitle'),
          { type: 'warning', confirmButtonText: this.$t('bankJournalPage.confirmOk'), cancelButtonText: this.$t('bankJournalPage.confirmCancel') }
        )
        const res = await pufaUpdateRechangeNohandleStatus({ id: row.id, status: 2 })
        if (res.code === 200) {
          this.$message.success(res.msg || this.$t('bankJournalPage.msgVoidOk'))
          this.getTableData()
        }
      } catch (e) {
        if (e !== 'cancel' && e.msg) this.$message.error(e.msg)
      }
    },
    exportCurrentPage () {
      this.exportRows(this.tableRows, this.$t('bankJournalPage.exportFilePrefixCurrentPage'))
    },
    exportRows (rows, namePrefix) {
      if (!rows.length) {
        this.$message.warning(this.$t('bankJournalPage.msgNoExportData'))
        return
      }
      const headers = [
        this.$t('bankJournalPage.colSeqNo'),
        this.$t('bankJournalPage.colPayeeName'),
        this.$t('bankJournalPage.colBankNumber'),
        this.$t('bankJournalPage.colAmountYuan'),
        this.$t('bankJournalPage.colReceivAccount'),
        this.$t('bankJournalPage.colReceivAccountNum'),
        this.$t('bankJournalPage.colOpeningBank'),
        this.$t('bankJournalPage.colRecvBank'),
        this.$t('bankJournalPage.colRemark'),
        this.$t('bankJournalPage.colTenantId'),
        this.$t('bankJournalPage.colTenantName'),
        this.$t('bankJournalPage.colTime'),
        this.$t('bankJournalPage.colType'),
        this.$t('bankJournalPage.colStatus')
      ]
      const wsData = [
        headers,
        ...rows.map((r) => [
          r.seqNo,
          r.payeeName,
          r.bankNumber,
          r.balance,
          r.receivAccount,
          r.receivAccountNum,
          r.openingBank,
          r.bankTypeLabel,
          r.remark,
          r.tenantId,
          this.$displayBizHybrid(r.tenantName || ''),
          r.createTime,
          r.typeLabel,
          r.statusMeta ? r.statusMeta.label : ''
        ])
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      const sheet = this.$t('bankJournalPage.exportSheetName').slice(0, 31)
      XLSX.utils.book_append_sheet(wb, ws, sheet)
      const timeStr = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
      XLSX.writeFile(wb, `${namePrefix}_${timeStr}.xlsx`)
    }
  }
}
</script>

<style lang="scss" scoped>
.bank-journal-tenant {
  min-width: 0;
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

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;

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
}

.text-muted {
  color: #c0c4cc;
  font-size: 13px;
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

      &:hover {
        color: #4096ff;
      }
      &:active {
        color: #0958d9;
      }
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
