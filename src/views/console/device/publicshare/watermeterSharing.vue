<template>
  <div class="table-page-container">
    <div class="search-box">
      <el-form :model="queryData" ref="searchForm" class="search-form" @submit.native.prevent>
        <div class="search-main-grid">
          <div class="field-item">
            <el-input
              v-model="queryData.id"
              :placeholder="$t('watermeterSharing.phGroupId')"
              clearable
              size="small"
              @clear="handleSearch"
              @keyup.enter.native="handleSearch"
            />
          </div>
          <div class="field-item">
            <el-input
              v-model="queryData.name"
              :placeholder="$t('watermeterSharing.phGroupName')"
              clearable
              size="small"
              @clear="handleSearch"
              @keyup.enter.native="handleSearch"
            />
          </div>
          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('watermeterSharing.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('watermeterSharing.btnReset') }}</el-button>
            <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">{{ $t('watermeterSharing.btnExport') }}</el-button>
          </div>
        </div>
      </el-form>
    </div>

    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            {{ $t('watermeterSharing.listTitle') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-button v-if="canAdd" type="primary" size="small" icon="el-icon-plus" @click="handleAdd">{{ $t('watermeterSharing.btnAdd') }}</el-button>
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option :label="$t('watermeterSharing.sortDefault')" value="default" />
          </el-select>
        </div>
      </div>

      <div class="list-view">
        <!-- 数据表格 -->
        <el-table
          :height="dataLength > 9 ? dynamicTableHeight : null"
          v-loading="loading"
          :data="tableData"
          stripe
          style="width: 100%"
          class="custom-table light-border-table"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <el-table-column
            prop="id"
            :label="$t('watermeterSharing.colId')"
            width="150"
            align="center"
            show-overflow-tooltip
          />
          <el-table-column
            prop="name"
            :label="$t('watermeterSharing.colName')"
            min-width="200"
            align="center"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              {{ $displayDynamicName(scope.row.name, 200) }}
            </template>
          </el-table-column>
          <!-- 操作列 -->
          <el-table-column
            v-if="canAnyOperation"
            :label="$t('watermeterSharing.colActions')"
            width="280"
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <div class="table-actions-group">
                <el-button
                  v-if="canView"
                  type="text"
                  size="small"
                  @click="handleDetail(scope.row)"
                >
                  {{ $t('watermeterSharing.opDetail') }}
                </el-button>
                <el-button
                  v-if="canDelete"
                  type="text"
                  size="small"
                  @click="handleDelete(scope.row)"
                >
                  {{ $t('watermeterSharing.opDelete') }}
                </el-button>
                <el-button
                  v-if="canDebit"
                  type="text"
                  size="small"
                  @click="handleDebit(scope.row)"
                >
                  {{ $t('watermeterSharing.opDebit') }}
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空数据展示 -->
        <div v-if="!loading && tableData.length === 0" class="empty-data">
          <el-empty :description="$t('watermeterSharing.emptyDesc')"></el-empty>
        </div>
      </div>
    </div>

    <!-- 新增/修改弹窗 -->
    <el-dialog
      :title="editDialog.isEdit ? $t('watermeterSharing.dialogEditTitle') : $t('watermeterSharing.dialogAddTitle')"
      :visible.sync="editDialog.visible"
      width="450px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form
        ref="editForm"
        :model="editDialog"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item :label="$t('watermeterSharing.formName')" prop="name">
          <el-input
            v-model="editDialog.name"
            :placeholder="$t('watermeterSharing.phFormName')"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialog.visible = false">{{ $t('watermeterSharing.btnCancel') }}</el-button>
        <el-button
          v-if="canAdd"
          type="primary"
          :loading="submitting"
          @click="handleEditSubmit"
        >
          {{ submitting ? $t('watermeterSharing.btnSubmitting') : $t('watermeterSharing.btnConfirm') }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 手动扣款弹窗 -->
    <el-dialog
      :title="$t('watermeterSharing.debitTitle')"
      :visible.sync="debitDialog.visible"
      width="500px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form
        ref="debitForm"
        :model="debitForm"
        :rules="debitRules"
        label-width="100px"
      >
        <el-form-item :label="$t('watermeterSharing.debitFormName')">
          <div class="info-text">{{ $displayDynamicName(debitDialog.name, 200) }}</div>
        </el-form-item>
        <el-form-item :label="$t('watermeterSharing.debitFormId')">
          <div class="info-text">{{ debitDialog.id }}</div>
        </el-form-item>
        <el-form-item :label="$t('watermeterSharing.debitFormAmount')" prop="balance">
          <el-input
            v-model="debitForm.balance"
            :placeholder="$t('watermeterSharing.phAmount')"
            @input="handleAmountInput"
          >
            <template slot="append">{{ $t('watermeterSharing.yuanSuffix') }}</template>
          </el-input>
        </el-form-item>
        <el-form-item :label="$t('watermeterSharing.debitFormRemark')" prop="remark">
          <el-input
            v-model="debitForm.remark"
            type="textarea"
            :rows="3"
            :placeholder="$t('watermeterSharing.phRemark')"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleDebitCancel">{{ $t('watermeterSharing.debitBtnCancel') }}</el-button>
        <el-button
          v-if="canDebit"
          type="primary"
          :loading="debitSubmitting"
          @click="handleDebitSubmit"
        >
          {{ debitSubmitting ? $t('watermeterSharing.debitSubmitting') : $t('watermeterSharing.debitConfirm') }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
// 使用正确的API文件和函数名
import {
  waterShareList,
  waterShareAdd,
  waterShareUpdate,
  waterShareDelete,
  waterShareDeduction
} from '@/api/waterGroup'
import * as XLSX from 'xlsx'

export default {
  name: 'WatermeterSharing',
  data () {
    return {
      // 表格高度配置
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68
      },
      // 查询参数
      queryData: {
        id: '',
        name: '',
        managerId: ''
      },
      sortOrder: 'default',
      // 表格数据
      tableData: [],
      // 加载状态
      loading: false,
      submitting: false,
      debitSubmitting: false,
      // 编辑弹窗
      editDialog: {
        visible: false,
        isEdit: false,
        id: '',
        name: ''
      },
      // 扣款弹窗
      debitDialog: {
        visible: false,
        name: '',
        id: ''
      },
      // 扣款表单
      debitForm: {
        balance: '',
        remark: ''
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canAdd () {
      return this.hasKztPermission('630050')
    },
    canDebit () {
      return this.hasKztPermission('630051')
    },
    canView () {
      return this.hasKztPermission('630052')
    },
    canDelete () {
      return this.hasKztPermission('630053')
    },
    canAnyOperation () {
      return this.canView || this.canDelete || this.canDebit
    },
    editRules () {
      return {
        name: [
          { required: true, message: this.$t('watermeterSharing.ruleNameRequired'), trigger: 'blur' },
          { min: 1, max: 50, message: this.$t('watermeterSharing.ruleNameLen'), trigger: 'blur' }
        ]
      }
    },
    debitRules () {
      return {
        balance: [
          { required: true, message: this.$t('watermeterSharing.ruleAmountRequired'), trigger: 'blur' },
          { validator: this.validateAmount, trigger: 'blur' }
        ]
      }
    },
    dataLength () {
      return this.tableData.length
    },
    // 动态计算表格高度
    dynamicTableHeight () {
      const dataLength = this.tableData.length

      if (dataLength === 0) {
        return this.tableHeightConfig.minHeight
      }

      if (dataLength <= this.tableHeightConfig.maxRows) {
        return (
          this.tableHeightConfig.headerHeight +
          dataLength * this.tableHeightConfig.rowHeight
        )
      }

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
          this.queryData.managerId = newVal
          this.fetchTableData()
        }
      },
      immediate: true
    }
  },
  methods: {
    // 获取表格数据
    async fetchTableData () {
      this.loading = true
      try {
        const params = {
          id: this.queryData.id || undefined,
          name: this.queryData.name || undefined,
          managerId: this.queryData.managerId
        }

        const response = await waterShareList(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data || []
        } else {
          this.$message.error(response.msg || this.$t('watermeterSharing.msgFetchFail'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('watermeterSharing.msgFetchListFail'))
        console.error('获取水表公摊组数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    // 查询
    handleSearch () {
      this.fetchTableData()
    },
    // 重置
    handleReset () {
      this.queryData = {
        id: '',
        name: '',
        managerId: this.currentManagerId || ''
      }
      this.handleSearch()
    },
    // 处理下拉命令
    handleCommand (command) {
      switch (command) {
        case 'export':
          this.handleExport()
          break
      }
    },
    // 导出数据
    handleExport () {
      if (!this.canView) {
        this.$message.warning(this.$t('watermeterSharing.msgNoViewPermission'))
        return
      }
      if (this.tableData.length === 0) {
        this.$message.warning(this.$t('watermeterSharing.msgExportEmpty'))
        return
      }
      try {
        const headers = [
          this.$t('watermeterSharing.colId'),
          this.$t('watermeterSharing.colName')
        ]
        const data = this.tableData.map((item) => [
          item.id || '',
          this.$displayDynamicName(item.name, 200) || ''
        ])
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
        ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length * 2, 15) }))
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, this.$t('watermeterSharing.exportSheetName'))
        const now = new Date()
        const timeStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0')
        const fileName = `${this.$t('watermeterSharing.exportFilePrefix')}${timeStr}.xlsx`
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        this.$message.success(this.$t('watermeterSharing.msgExportOk', { count: this.tableData.length }))
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('watermeterSharing.msgExportFail'))
      }
    },
    // 新增
    handleAdd () {
      if (!this.canAdd) {
        this.$message.warning(this.$t('watermeterSharing.msgNoAddPermission'))
        return
      }
      this.editDialog = {
        visible: true,
        isEdit: false,
        id: '',
        name: ''
      }
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },
    // 详情
    handleDetail (row) {
      if (!this.canView) {
        this.$message.warning(this.$t('watermeterSharing.msgNoViewPermission'))
        return
      }
      this.$router.push({
        path: '/metering/fee/watermeterSharing/detail',
        query: { id: row.id }
      })
    },
    // 删除
    async handleDelete (row) {
      if (!this.canDelete) {
        this.$message.warning(this.$t('watermeterSharing.msgNoDeletePermission'))
        return
      }
      try {
        await this.$confirm(
          this.$t('watermeterSharing.confirmDeleteMsg'),
          this.$t('watermeterSharing.confirmDeleteTitle'),
          {
            confirmButtonText: this.$t('watermeterSharing.confirmOk'),
            cancelButtonText: this.$t('watermeterSharing.confirmCancel'),
            type: 'warning'
          }
        )

        const response = await waterShareDelete({ id: row.id })

        if (response.code === 200) {
          this.$message.success(response.msg || this.$t('watermeterSharing.msgDeleteOk'))
          this.fetchTableData()
        } else {
          this.$message.error(response.msg || this.$t('watermeterSharing.msgDeleteFail'))
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(this.$t('watermeterSharing.msgDeleteFail'))
          console.error('删除失败:', error)
        }
      }
    },
    // 手动扣款
    handleDebit (row) {
      if (!this.canDebit) {
        this.$message.warning(this.$t('watermeterSharing.msgNoDebitPermission'))
        return
      }
      this.debitDialog = {
        visible: true,
        name: row.name,
        id: row.id
      }
      this.debitForm = {
        balance: '',
        remark: ''
      }
      this.$nextTick(() => {
        this.$refs.debitForm && this.$refs.debitForm.clearValidate()
      })
    },
    // 提交编辑
    async handleEditSubmit () {
      if (!this.canAdd) {
        this.$message.warning(this.$t('watermeterSharing.msgNoAddPermission'))
        return
      }
      this.$refs.editForm.validate(async (valid) => {
        if (!valid) return

        const isEdit = this.editDialog.isEdit
        const confirmMsg = isEdit ? this.$t('watermeterSharing.confirmGroupEdit') : this.$t('watermeterSharing.confirmGroupAdd')

        try {
          await this.$confirm(confirmMsg, this.$t('watermeterSharing.confirmGroupTitle'), {
            confirmButtonText: this.$t('watermeterSharing.confirmOk'),
            cancelButtonText: this.$t('watermeterSharing.confirmCancel'),
            type: 'warning'
          })

          this.submitting = true

          const params = {
            managerId: this.queryData.managerId,
            name: this.editDialog.name
          }

          let response
          if (this.editDialog.isEdit) {
            params.id = this.editDialog.id
            response = await waterShareUpdate(params)
          } else {
            response = await waterShareAdd(params)
          }

          if (response.code === 200) {
            this.$message.success(response.msg || (isEdit ? this.$t('watermeterSharing.msgEditOk') : this.$t('watermeterSharing.msgAddOk')))
            this.editDialog.visible = false
            this.fetchTableData()
          } else {
            this.$message.error(response.msg || (isEdit ? this.$t('watermeterSharing.msgEditFail') : this.$t('watermeterSharing.msgAddFail')))
          }
        } catch (error) {
          if (error !== 'cancel') {
            this.$message.error(isEdit ? this.$t('watermeterSharing.msgEditFail') : this.$t('watermeterSharing.msgAddFail'))
            console.error('操作失败:', error)
          }
        } finally {
          this.submitting = false
        }
      })
    },
    // 取消扣款
    handleDebitCancel () {
      this.debitDialog.visible = false
      this.debitForm = {
        balance: '',
        remark: ''
      }
    },
    // 提交扣款
    async handleDebitSubmit () {
      if (!this.canDebit) {
        this.$message.warning(this.$t('watermeterSharing.msgNoDebitPermission'))
        return
      }
      this.$refs.debitForm.validate(async (valid) => {
        if (!valid) return

        try {
          await this.$confirm(this.$t('watermeterSharing.confirmDebitMsg'), this.$t('watermeterSharing.confirmDebitTitle'), {
            confirmButtonText: this.$t('watermeterSharing.confirmOk'),
            cancelButtonText: this.$t('watermeterSharing.confirmCancel'),
            type: 'warning'
          })

          this.debitSubmitting = true

          const params = {
            balance: this.debitForm.balance,
            shareId: this.debitDialog.id,
            remark: this.debitForm.remark
          }

          const response = await waterShareDeduction(params)

          if (response.code === 200) {
            this.$message.success(response.msg || this.$t('watermeterSharing.msgDebitOk'))
            this.handleDebitCancel()
            this.fetchTableData()
          } else {
            this.$message.error(response.msg || this.$t('watermeterSharing.msgDebitFail'))
          }
        } catch (error) {
          if (error !== 'cancel') {
            this.$message.error(this.$t('watermeterSharing.msgDebitFail'))
            console.error('扣款失败:', error)
          }
        } finally {
          this.debitSubmitting = false
        }
      })
    },
    // 处理金额输入
    handleAmountInput (val) {
      const reg = /^\d*\.?\d{0,2}$/
      if (!reg.test(val)) {
        this.$nextTick(() => {
          this.debitForm.balance = val.match(/^\d*\.?\d{0,2}/)[0] || ''
        })
      }
    },
    // 验证金额
    validateAmount (rule, value, callback) {
      if (!value) {
        callback(new Error(this.$t('watermeterSharing.ruleAmountRequired')))
      } else if (isNaN(value)) {
        callback(new Error(this.$t('watermeterSharing.ruleAmountInvalid')))
      } else if (parseFloat(value) <= 0) {
        callback(new Error(this.$t('watermeterSharing.ruleAmountPositive')))
      } else if (parseFloat(value) > 999999.99) {
        callback(new Error(this.$t('watermeterSharing.ruleAmountMax')))
      } else {
        callback()
      }
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
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
    grid-column: 3 / 6;
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
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.title-bar {
  width: 3px;
  height: 16px;
  background: #1677ff;
  border-radius: 2px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;

  ::v-deep .el-button--primary {
    background: #1677ff;
    border-color: #1677ff;
    height: 32px;
    padding: 0 14px;
    font-size: 13px;
    border-radius: 6px;

    &:hover {
      background: #4096ff;
      border-color: #4096ff;
    }
  }

  ::v-deep .el-select .el-input__inner {
    height: 32px;
    line-height: 32px;
    font-size: 13px;
    border-radius: 6px;
    border-color: #e4e7ed;
  }
}

.light-border-table {
  margin-top: 8px;
}

.list-view ::v-deep .el-table {
  border: 1px solid #f0f0f0 !important;
}

.list-view ::v-deep .el-table__header-wrapper th {
  border-right: 1px solid #f0f0f0 !important;
  border-bottom: 1px solid #f0f0f0 !important;
}

.list-view ::v-deep .el-table td {
  border-right: 1px solid #f5f5f5 !important;
  border-bottom: 1px solid #f5f5f5 !important;
}

.list-view ::v-deep .el-table__body tr.el-table__row--striped > td {
  background: #fcfdff !important;
}

.list-view ::v-deep .el-table--enable-row-hover .el-table__body tr:hover > td {
  background: #f2f8ff !important;
}

.table-actions-group .el-button--text {
  color: #1677ff;
}

.table-actions-group .el-button--text:hover {
  color: #4096ff;
}

.table-actions-group {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  gap: 10px;
}

.table-actions-group ::v-deep .el-button {
  padding: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1;
}

.table-actions-group ::v-deep .el-divider--vertical {
  margin: 0;
  height: 14px;
}
</style>
