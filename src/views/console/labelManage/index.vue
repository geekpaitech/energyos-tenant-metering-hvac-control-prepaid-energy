<template>
  <div class="table-page-container">
    <template v-if="canView">
      <div class="search-box">
        <el-form class="search-form" @submit.native.prevent @keyup.enter.native="handleSearch">
          <div class="search-main-grid">
            <div class="field-item">
              <el-input
                v-model="queryKeyword"
                :placeholder="$t('labelManagePage.phKeyword')"
                clearable
                size="small"
                maxlength="50"
                style="width: 100%"
              />
            </div>
            <div class="search-actions">
              <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('labelManagePage.btnSearch') }}</el-button>
              <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">{{ $t('labelManagePage.btnReset') }}</el-button>
              <el-button type="success" size="small" icon="el-icon-refresh" @click="fetchLabels">{{ $t('labelManagePage.btnRefresh') }}</el-button>
            </div>
          </div>
        </el-form>
      </div>

      <div class="content-box">
        <div class="content-toolbar">
          <div class="toolbar-left">
            <span class="section-title">
              <span class="title-bar" />
              {{ $t('labelManagePage.sectionTitle') }}
            </span>
          </div>
          <div class="toolbar-right">
            <el-button
              v-if="canAdd"
              type="primary"
              size="small"
              icon="el-icon-plus"
              @click="openAdd"
            >
              {{ $t('labelManagePage.btnAddLabel') }}
            </el-button>
            <el-select v-model="sortOrder" size="small" style="width: 100px">
              <el-option :label="$t('labelManagePage.sortDefault')" value="default" />
            </el-select>
          </div>
        </div>

        <div class="list-view">
          <el-table
            :data="filteredLabelData"
            v-loading="loading"
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
            <el-table-column prop="id" :label="$t('labelManagePage.colId')" width="90" align="center" />
            <el-table-column prop="name" :label="$t('labelManagePage.colName')" min-width="140" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ $displayBizHybrid(scope.row.name || '') || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" :label="$t('labelManagePage.colCreateTime')" min-width="160" />
            <el-table-column prop="updateTime" :label="$t('labelManagePage.colUpdateTime')" min-width="160">
              <template slot-scope="scope">
                {{ scope.row.updateTime || '-' }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('labelManagePage.colAction')" width="260" align="center" fixed="right" :resizable="false">
              <template slot-scope="scope">
                <div class="operation-cell">
                  <el-button
                    v-if="canEdit"
                    type="text"
                    size="mini"
                    class="op-btn primary-btn"
                    @click="openEdit(scope.row)"
                  >
                    {{ $t('labelManagePage.btnEdit') }}
                  </el-button>
                  <el-button
                    v-if="canBatchBind"
                    type="text"
                    size="mini"
                    class="op-btn primary-btn"
                    @click="openBatchBind(scope.row)"
                  >
                    {{ $t('labelManagePage.btnBatchBind') }}
                  </el-button>
                  <el-button
                    v-if="canDelete"
                    type="text"
                    size="mini"
                    class="op-btn danger-btn"
                    @click="handleDelete(scope.row)"
                  >
                    {{ $t('labelManagePage.btnDelete') }}
                  </el-button>
                  <span v-if="!canEdit && !canBatchBind && !canDelete" class="text-muted">-</span>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && filteredLabelData.length === 0" :description="$t('labelManagePage.emptyNoData')" class="list-empty" />
        </div>
      </div>

      <el-dialog :title="editForm.id ? $t('labelManagePage.dialogEdit') : $t('labelManagePage.dialogAdd')" :visible.sync="editVisible" width="420px">
        <el-form ref="editFormRef" :model="editForm" :rules="editRules" :label-width="formLabelWidth" size="small">
          <el-form-item :label="$t('labelManagePage.formLabelName')" prop="name">
            <el-input v-model="editForm.name" :placeholder="$t('labelManagePage.phNameInput')" maxlength="50" show-word-limit />
          </el-form-item>
        </el-form>
        <div slot="footer">
          <el-button size="small" @click="editVisible = false">{{ $t('labelManagePage.btnCancel') }}</el-button>
          <el-button size="small" type="primary" :loading="saving" @click="submitEdit">
            {{ $t('labelManagePage.btnConfirm') }}
          </el-button>
        </div>
      </el-dialog>

      <el-dialog :title="$t('labelManagePage.dialogBindTitle')" :visible.sync="bindVisible" width="680px">
        <div class="bind-header">
          <div class="bind-title">
            {{ $t('labelManagePage.bindCurrentLabel') }}
            <el-tag size="mini" effect="plain">{{ $displayBizHybrid(currentLabel.name || '') || '-' }}</el-tag>
          </div>
          <div class="bind-actions">
            <el-button size="mini" @click="selectAllTenants">{{ $t('labelManagePage.btnSelectAll') }}</el-button>
            <el-button size="mini" @click="clearTenants">{{ $t('labelManagePage.btnClear') }}</el-button>
          </div>
        </div>

        <el-table
          ref="tenantTable"
          v-loading="tenantsLoading"
          :data="tenantOptions"
          border
          stripe
          style="width: 100%"
          height="420"
          @selection-change="handleTenantSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column :label="$t('labelManagePage.colTenantId')" width="110">
            <template slot-scope="scope">
              {{ scope.row.id || scope.row.tenantId || scope.row.tenantID || scope.row.tenant_id || '-' }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('labelManagePage.colTenantName')" min-width="180" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ $displayBizHybrid((scope.row.name || scope.row.tenantName || scope.row.tenant_name || '')) || '-' }}
            </template>
          </el-table-column>
        </el-table>

        <div slot="footer">
          <el-button size="small" @click="bindVisible = false">{{ $t('labelManagePage.btnCancel') }}</el-button>
          <el-button
            size="small"
            type="primary"
            :loading="binding"
            :disabled="binding"
            @click.stop="submitBatchBind"
          >
            {{ $t('labelManagePage.btnConfirmBind') }}
          </el-button>
        </div>
      </el-dialog>
    </template>
    <el-empty v-else :description="$t('labelManagePage.emptyNoPermission')" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { tenantList, labelBatchBindTenant } from '@/api/tenant'
import { fetchLabelList, addLabel, updateLabel, deleteLabel } from '@/api/labelManage'

export default {
  name: 'LabelManagePage',
  data () {
    return {
      sortOrder: 'default',
      queryKeyword: '',
      loading: false,
      labelData: [],

      editVisible: false,
      saving: false,
      editForm: {
        id: '',
        name: ''
      },

      bindVisible: false,
      tenantsLoading: false,
      binding: false,
      tenantOptions: [],
      selectedTenantRows: [],
      currentLabel: {},
      bindSubmitSeq: 0
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canView () {
      return this.hasKztPermission('660043')
    },
    canAdd () {
      return this.hasKztPermission('660040')
    },
    canEdit () {
      return this.hasKztPermission('660041')
    },
    canDelete () {
      return this.hasKztPermission('660042')
    },
    canBatchBind () {
      return this.canAdd
    },
    formLabelWidth () {
      return this.$i18n.locale === 'en' ? '120px' : '90px'
    },
    editRules () {
      return {
        name: [{ required: true, message: this.$t('labelManagePage.ruleNameRequired'), trigger: 'blur' }]
      }
    },
    /** 列表接口无名称筛选参数，前端按关键词过滤展示 */
    filteredLabelData () {
      const kw = (this.queryKeyword || '').trim().toLowerCase()
      if (!kw) return this.labelData
      return this.labelData.filter((r) => (r.name || '').toLowerCase().includes(kw))
    }
  },
  watch: {
    currentManagerId: {
      handler (val) {
        if (val) this.fetchLabels()
      },
      immediate: true
    }
  },
  methods: {
    handleSearch () {
      this.fetchLabels()
    },

    handleReset () {
      this.queryKeyword = ''
      this.fetchLabels()
    },

    async fetchLabels () {
      if (!this.currentManagerId) return
      if (!this.canView) return
      this.loading = true
      try {
        const res = await fetchLabelList({ managerId: this.currentManagerId, type: 1 })
        if (res.code === 200) {
          this.labelData = res.data || []
        } else {
          this.$message.error(res.msg || this.$t('labelManagePage.msgQueryFail'))
        }
      } catch (e) {
        this.$apiError.notify(e, this.$t('labelManagePage.msgQueryFail'))
      } finally {
        this.loading = false
      }
    },

    openAdd () {
      if (!this.canAdd) {
        this.$message.warning(this.$t('labelManagePage.msgNoAddPerm'))
        return
      }
      this.editForm = { id: '', name: '' }
      this.editVisible = true
      this.$nextTick(() => this.$refs.editFormRef && this.$refs.editFormRef.clearValidate())
    },

    openEdit (row) {
      if (!this.canEdit) {
        this.$message.warning(this.$t('labelManagePage.msgNoEditPerm'))
        return
      }
      this.editForm = { id: row.id, name: row.name }
      this.editVisible = true
      this.$nextTick(() => this.$refs.editFormRef && this.$refs.editFormRef.clearValidate())
    },

    submitEdit () {
      if (!this.currentManagerId) return
      this.$refs.editFormRef.validate(async (valid) => {
        if (!valid) return
        this.saving = true
        try {
          const payload = {
            id: this.editForm.id || '',
            managerId: this.currentManagerId,
            type: 1,
            name: this.editForm.name
          }

          const res = this.editForm.id ? await updateLabel(payload) : await addLabel(payload)

          if (res.code === 200) {
            this.$message.success(this.$t('labelManagePage.msgSaveOk'))
            this.editVisible = false
            this.fetchLabels()
          } else {
            this.$message.error(res.msg || this.$t('labelManagePage.msgSaveFail'))
          }
        } catch (e) {
          this.$apiError.notify(e, this.$t('labelManagePage.msgSaveFail'))
        } finally {
          this.saving = false
        }
      })
    },

    handleDelete (row) {
      if (!this.canDelete) {
        this.$message.warning(this.$t('labelManagePage.msgNoDeletePerm'))
        return
      }
      this.$confirm(
        this.$t('labelManagePage.confirmDelete', { name: this.$displayBizHybrid(row.name || '', 200) }),
        this.$t('labelManagePage.titleTip'),
        { type: 'warning' }
      )
        .then(async () => {
          try {
            const res = await deleteLabel({ id: row.id })
            if (res.code === 200) {
              this.$message.success(this.$t('labelManagePage.msgDeleteOk'))
              this.fetchLabels()
            } else {
              this.$message.error(res.msg || this.$t('labelManagePage.msgDeleteFail'))
            }
          } catch (e) {
            this.$apiError.notify(e, this.$t('labelManagePage.msgDeleteFail'))
          }
        })
        .catch(() => {})
    },

    async openBatchBind (row) {
      if (!this.canBatchBind) {
        this.$message.warning(this.$t('labelManagePage.msgNoAddPerm'))
        return
      }
      if (!this.currentManagerId) return
      this.currentLabel = row || {}
      this.bindVisible = true
      this.selectedTenantRows = []
      this.bindSubmitSeq = 0
      await this.fetchTenants()
    },

    async fetchTenants () {
      this.tenantsLoading = true
      try {
        const res = await tenantList({ managerId: this.currentManagerId, tenantStatus: 0 })
        if (res.code === 200) {
          const raw = res.data
          let list = []
          if (Array.isArray(raw)) {
            list = raw
          } else if (raw && Array.isArray(raw.data)) {
            list = raw.data
          } else if (raw && Array.isArray(raw.dataList)) {
            list = raw.dataList
          }

          this.tenantOptions = list.map((item) => {
            const id = item.id || item.tenantId || item.tenantID || item.tenant_id
            const name = item.name || item.tenantName || item.tenant_name
            return { ...item, id, name }
          })
        } else {
          this.tenantOptions = []
          this.$message.error(res.msg || this.$t('labelManagePage.msgTenantQueryFail'))
        }
      } catch (e) {
        this.tenantOptions = []
        this.$apiError.notify(e, this.$t('labelManagePage.msgTenantQueryFail'))
      } finally {
        this.tenantsLoading = false
      }
    },

    handleTenantSelectionChange (rows) {
      this.selectedTenantRows = rows || []
    },

    selectAllTenants () {
      const table = this.$refs.tenantTable
      if (!table) return
      table.clearSelection()
      this.tenantOptions.forEach((row) => {
        table.toggleRowSelection(row, true)
      })
    },

    clearTenants () {
      const table = this.$refs.tenantTable
      if (table) table.clearSelection()
      this.selectedTenantRows = []
    },

    async submitBatchBind () {
      if (this.binding) return
      if (!this.currentManagerId) return
      if (!this.currentLabel.id) return
      const tenantIdList = (this.selectedTenantRows || []).map((t) => t.id).filter(Boolean)
      if (tenantIdList.length === 0) {
        this.$message.warning(this.$t('labelManagePage.msgBindSelectTenant'))
        return
      }

      this.binding = true
      const submitSeq = ++this.bindSubmitSeq
      try {
        const res = await labelBatchBindTenant({
          labelId: String(this.currentLabel.id),
          tenantIdList
        })
        if (submitSeq !== this.bindSubmitSeq) return
        if (res.code === 200) {
          this.$message.success(res.msg || this.$t('labelManagePage.msgBindOk'))
          this.bindVisible = false
        } else {
          this.$message.error(res.msg || this.$t('labelManagePage.msgBindFail'))
        }
      } catch (e) {
        this.$apiError.notify(e, this.$t('labelManagePage.msgBindFail'))
      } finally {
        this.binding = false
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .field-item {
    flex: 0 0 auto;
    width: 240px;
    max-width: 100%;
    min-width: 0;

    ::v-deep .el-input {
      width: 100%;
      display: block;
    }

    ::v-deep .el-input__inner {
      height: 32px;
      line-height: 32px;
      border-radius: 6px;
      border-color: #e4e7ed;
      font-size: 13px;

      &::placeholder {
        color: #c0c4cc;
      }
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
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
  gap: 10px;

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
    gap: 12px;

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
}

.list-view {
  padding: 0;
}

.list-empty {
  padding: 32px 0;
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

.operation-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;

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

    &.danger-btn {
      color: #f56c6c;

      &:hover {
        color: #f78989;
      }
    }
  }
}

.text-muted {
  color: #c0c4cc;
  font-size: 13px;
}

.bind-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
</style>
