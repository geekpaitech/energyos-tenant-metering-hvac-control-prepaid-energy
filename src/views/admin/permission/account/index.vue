<template>
  <div class="app-container">
    <el-alert
      v-if="isTestPermissionEnv"
      class="perm-env-tip"
      type="warning"
      :closable="false"
      show-icon
    >
      <template slot="title">
        当前为测试环境：本页「新增、修改、绑定、删除」等操作不可在此执行，查询可正常使用。
        <a :href="permissionFormalUrl" target="_blank" rel="noopener" class="perm-env-link">前往正式环境</a>
      </template>
    </el-alert>
    <el-card>
      <div slot="header" class="card-header">
        <span>账号管理</span>
      </div>

      <el-form :inline="true" size="small" class="query-form" @submit.native.prevent>
        <el-form-item label="账号">
          <el-input v-model="query.phone" clearable placeholder="手机号" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="query.name" clearable placeholder="用户名" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="query.role" clearable placeholder="角色" style="width: 160px;">
            <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="openAdd">添加账号</el-button>
        </el-form-item>
      </el-form>

      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="tableData"
          border
          fit
          highlight-current-row
          row-key="id"
          style="width: 100%;"
          class="data-table"
        >
          <el-table-column prop="id" label="用户ID" show-overflow-tooltip />
          <el-table-column prop="name" label="用户名称" show-overflow-tooltip />
          <el-table-column prop="phone" label="账号（手机号）" show-overflow-tooltip />
          <el-table-column prop="roleType" label="角色" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ getRoleTypeLabel(scope.row.roleType || scope.row.role) }}
            </template>
          </el-table-column>
          <el-table-column label="已绑定管理方" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openBindManager(scope.row)">
                {{ getBoundManagerCount(scope.row.id) }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="已绑定租户" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openBindTenant(scope.row)">
                {{ getBoundTenantCount(scope.row.phone) }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="left" fixed="right" width="350" class-name="action-column" label-class-name="action-column">
            <template slot-scope="scope">
              <div class="action-buttons">
                <el-button type="text" size="small" @click="openEdit(scope.row)">修改</el-button>
                <el-button type="text" size="small" @click="openBindManager(scope.row)">关联管理方</el-button>
                <el-button type="text" size="small" @click="openBindTenant(scope.row)">关联租户</el-button>
                <el-button type="text" size="small" @click="handleResetPassword(scope.row)">重置密码</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination
          background
          :current-page.sync="query.current"
          :page-sizes="[15, 30, 100]"
          :page-size.sync="query.size"
          layout="total, sizes, prev, pager, next, jumper"
          :total="query.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      :visible.sync="editDialog.visible"
      :close-on-click-modal="false"
      :title="editDialog.isAdd ? '添加账号' : '修改账号'"
      width="520px"
      @closed="resetEditDialog"
    >
      <el-form ref="editForm" :model="editDialog.form" :rules="editDialog.rules" label-width="110px">
        <el-form-item v-if="editDialog.isAdd" label="账号(手机号)" prop="phone">
          <el-input v-model="editDialog.form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item v-else label="用户名称" prop="name">
          <el-input v-model="editDialog.form.name" placeholder="请输入用户名称" />
        </el-form-item>
        <el-form-item label="用户角色" prop="role">
          <el-select v-model="editDialog.form.role" clearable placeholder="请选择角色" style="width: 100%;">
            <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="editDialog.submitting" @click="submitEdit">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="bindManagerDialog.visible"
      :close-on-click-modal="false"
      title="关联/解绑管理方"
      width="980px"
      custom-class="bind-transfer-dialog"
      @open="initBindManagerDialog"
      @closed="resetBindManagerDialog"
    >
      <div class="transfer-wrapper">
        <el-transfer
          v-model="bindManagerDialog.selected"
          filterable
          :disabled="isTestPermissionEnv"
          :titles="['未绑定管理方', '已绑定管理方']"
          :data="bindManagerDialog.options"
          :props="{ key: 'key', label: 'label' }"
          @change="handleManagerTransferChange"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="bindManagerDialog.visible = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="bindTenantDialog.visible"
      :close-on-click-modal="false"
      title="关联/解绑租户"
      width="980px"
      custom-class="bind-transfer-dialog"
      @open="initBindTenantDialog"
      @closed="resetBindTenantDialog"
    >
      <div class="transfer-wrapper">
        <el-transfer
          v-model="bindTenantDialog.selected"
          filterable
          :disabled="isTestPermissionEnv"
          :titles="['未绑定租户', '已绑定租户']"
          :data="bindTenantDialog.options"
          :props="{ key: 'key', label: 'label' }"
          @change="handleTenantTransferChange"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="bindTenantDialog.visible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  adminAddManagerUser,
  adminAddUser,
  adminManagerGetUserManagerBatchList,
  adminRemoveManagerUser,
  adminResetPassword,
  adminTenantBindUserToTenant,
  adminTenantGetPhoneTenantBatchList,
  adminTenantGetPhoneTenantList,
  adminTenantList,
  adminTenantUnbindUserToTenant,
  adminUserPageUserInfo,
  adminUserUpdateUserInfo,
  adminGetUserManagerList
} from '@/api/adminapi'
import { isPermissionTestEnv } from '@/utils/request'

import { PERMISSION_FORMAL_URL } from '@/config/services'

export default {
  name: 'AdminPermissionAccount',
  data () {
    return {
      loading: false,
      tableData: [],
      boundManagersByUserId: {},
      boundTenantsByPhone: {},
      query: {
        phone: '',
        name: '',
        role: '',
        current: 1,
        size: 15,
        total: 0
      },
      roleOptions: [
        { label: '系统管理员', value: 'SYS_ADMIN' },
        { label: '超级管理员', value: 'SUPER_MANAGER' },
        { label: '系统财务', value: 'SYS_FINANCE' },
        { label: '管理方', value: 'MANAGER' },
        { label: '管理方二级权限', value: 'MANAGER_FINANCE' },
        { label: '管理方试用', value: 'MANAGER_TRIAL' },
        { label: '施工调试', value: 'CONSTRUCT_DEBUG' },
        { label: '商务', value: 'BUSINESS' },
        { label: '运维管理员', value: 'MA_ADMIN' },
        { label: '测试', value: 'TESTER' },
        { label: '访客', value: 'VISITOR' }
      ],
      editDialog: {
        visible: false,
        isAdd: true,
        submitting: false,
        form: {
          id: '',
          phone: '',
          name: '',
          role: ''
        },
        rules: {
          phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
          name: [{ required: true, message: '请输入用户名称', trigger: 'blur' }],
          role: [{ required: true, message: '请选择角色', trigger: 'change' }]
        }
      },
      bindManagerDialog: {
        visible: false,
        userId: '',
        phone: '',
        options: [],
        selected: [],
        submitting: false
      },
      bindTenantDialog: {
        visible: false,
        phone: '',
        options: [],
        selected: [],
        submitting: false
      }
    }
  },
  computed: {
    isTestPermissionEnv () {
      return isPermissionTestEnv()
    },
    permissionFormalUrl () {
      return PERMISSION_FORMAL_URL
    }
  },
  created () {
    this.fetchTableData()
  },
  methods: {
    blockPermissionWrite () {
      if (!isPermissionTestEnv()) return false
      this.$message({
        type: 'warning',
        duration: 6000,
        dangerouslyUseHTMLString: true,
        message:
          '该操作仅正式环境可用（如新增、修改、绑定、删除），请前往：' +
          `<a href="${PERMISSION_FORMAL_URL}" target="_blank" rel="noopener" ` +
          'style="color:#409EFF;text-decoration:underline;">正式环境</a>'
      })
      return true
    },
    getRoleTypeLabel (value) {
      const found = this.roleOptions.find(i => i.value === value)
      return found ? found.label : (value || '-')
    },
    async fetchTableData () {
      this.loading = true
      try {
        const payload = {
          name: this.query.name,
          role: this.query.role,
          phone: this.query.phone,
          id: '',
          page: {
            size: this.query.size,
            current: this.query.current
          }
        }

        const res = await adminUserPageUserInfo(payload)
        const data = res && res.data ? res.data : {}
        const list = data.dataList || data.list || []

        this.tableData = Array.isArray(list) ? list : []
        this.query.total = Number(data.total || 0)
        this.query.current = Number(data.current || this.query.current)

        const userIds = this.tableData.map(item => item.id).filter(v => v !== undefined && v !== null)
        const phones = this.tableData.map(item => item.phone).filter(v => v)

        await Promise.all([
          this.fetchBoundManagersBatch(userIds),
          this.fetchBoundTenantsBatch(phones)
        ])
      } catch (err) {
        this.$apiError.notify(err, '获取账号列表失败')
      } finally {
        this.loading = false
      }
    },

    async fetchBoundManagersBatch (userIds) {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        this.boundManagersByUserId = {}
        return
      }
      try {
        const res = await adminManagerGetUserManagerBatchList({ userIdList: userIds })
        const data = res && res.data ? res.data : {}
        this.boundManagersByUserId = data || {}
      } catch (err) {
        this.boundManagersByUserId = {}
      }
    },

    async fetchBoundTenantsBatch (phones) {
      if (!Array.isArray(phones) || phones.length === 0) {
        this.boundTenantsByPhone = {}
        return
      }
      try {
        const res = await adminTenantGetPhoneTenantBatchList({ phoneList: phones })
        const data = res && res.data ? res.data : {}
        this.boundTenantsByPhone = data || {}
      } catch (err) {
        this.boundTenantsByPhone = {}
      }
    },

    getBoundManagerCount (userId) {
      const list = this.boundManagersByUserId && this.boundManagersByUserId[userId]
      return Array.isArray(list) ? list.length : 0
    },

    getBoundTenantCount (phone) {
      const list = this.boundTenantsByPhone && this.boundTenantsByPhone[phone]
      return Array.isArray(list) ? list.length : 0
    },

    handleSearch () {
      this.query.current = 1
      this.fetchTableData()
    },

    handleReset () {
      this.query.phone = ''
      this.query.name = ''
      this.query.role = ''
      this.query.current = 1
      this.fetchTableData()
    },

    handleSizeChange (val) {
      this.query.size = val
      this.query.current = 1
      this.fetchTableData()
    },

    handleCurrentChange (val) {
      this.query.current = val
      this.fetchTableData()
    },

    openAdd () {
      if (this.blockPermissionWrite()) return
      this.editDialog.isAdd = true
      this.editDialog.visible = true
      this.editDialog.form = {
        id: '',
        phone: '',
        name: '',
        role: ''
      }
    },

    openEdit (row) {
      if (this.blockPermissionWrite()) return
      this.editDialog.isAdd = false
      this.editDialog.visible = true
      this.editDialog.form = {
        id: row.id,
        phone: row.phone,
        name: row.name,
        role: row.roleType || row.role || ''
      }
    },

    resetEditDialog () {
      if (this.$refs.editForm) {
        this.$refs.editForm.clearValidate()
      }
      this.editDialog.submitting = false
    },

    submitEdit () {
      if (this.blockPermissionWrite()) return
      const formRef = this.$refs.editForm
      if (!formRef) return

      formRef.validate(async (valid) => {
        if (!valid) return
        this.editDialog.submitting = true
        try {
          if (this.editDialog.isAdd) {
            await adminAddUser({
              phone: this.editDialog.form.phone,
              role: this.editDialog.form.role
            })
            this.$message.success('添加成功')
          } else {
            await adminUserUpdateUserInfo({
              id: this.editDialog.form.id,
              name: this.editDialog.form.name,
              role: this.editDialog.form.role
            })
            this.$message.success('修改成功')
          }
          this.editDialog.visible = false
          this.fetchTableData()
        } catch (err) {
          this.$apiError.notify(err, '提交失败')
        } finally {
          this.editDialog.submitting = false
        }
      })
    },

    handleResetPassword (row) {
      if (this.blockPermissionWrite()) return
      this.$confirm('确认重置该用户密码?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await adminResetPassword(row.id)
          this.$message.success('重置成功')
        } catch (err) {
          this.$apiError.notify(err, '重置失败')
        }
      }).catch(() => {})
    },

    openBindManager (row) {
      if (this.blockPermissionWrite()) return
      this.bindManagerDialog.userId = row.id
      this.bindManagerDialog.phone = row.phone
      this.bindManagerDialog.visible = true
    },

    async initBindManagerDialog () {
      try {
        const list = await this.$store.dispatch('manager/getManagerList')
        const managerList = Array.isArray(list) ? list : []
        const options = (Array.isArray(managerList) ? managerList : []).map(item => ({
          key: item.managerId,
          label: `${item.managerName || ''}(${item.managerId})`
        }))
        this.bindManagerDialog.options = options

        const res = await adminGetUserManagerList({ userId: this.bindManagerDialog.userId })
        const data = res && res.data ? res.data : []
        const selected = (Array.isArray(data) ? data : []).map(item => item.id || item.managerId).filter(v => v !== undefined && v !== null)
        this.bindManagerDialog.selected = selected
      } catch (err) {
        this.bindManagerDialog.options = []
        this.bindManagerDialog.selected = []
        this.$apiError.notify(err, '加载管理方失败')
      }
    },

    resetBindManagerDialog () {
      this.bindManagerDialog.userId = ''
      this.bindManagerDialog.phone = ''
      this.bindManagerDialog.options = []
      this.bindManagerDialog.selected = []
      this.bindManagerDialog.submitting = false
    },

    async handleManagerTransferChange (newTargetKeys, direction, movedKeys) {
      if (this.blockPermissionWrite()) return
      if (!movedKeys || movedKeys.length === 0) return
      if (this.bindManagerDialog.submitting) return
      this.bindManagerDialog.submitting = true
      try {
        const phone = this.bindManagerDialog.phone
        if (direction === 'right') {
          for (const managerId of movedKeys) {
            await adminAddManagerUser({ managerId, phone })
          }
          this.$message.success('绑定成功')
        } else if (direction === 'left') {
          for (const managerId of movedKeys) {
            await adminRemoveManagerUser({ managerId, phone })
          }
          this.$message.success('解绑成功')
        }
        await this.fetchBoundManagersBatch([this.bindManagerDialog.userId])
      } catch (err) {
        this.$apiError.notify(err, '操作失败')
        try {
          const res = await adminGetUserManagerList({ userId: this.bindManagerDialog.userId })
          const data = res && res.data ? res.data : []
          this.bindManagerDialog.selected = (Array.isArray(data) ? data : []).map(item => item.id || item.managerId).filter(v => v !== undefined && v !== null)
        } catch (e) {}
      } finally {
        this.bindManagerDialog.submitting = false
      }
    },

    openBindTenant (row) {
      if (this.blockPermissionWrite()) return
      this.bindTenantDialog.phone = row.phone
      this.bindTenantDialog.visible = true
    },

    async initBindTenantDialog () {
      try {
        const resTenants = await adminTenantList({ managerId: '', tenantStatus: 0 })
        const tenants = resTenants && resTenants.data ? resTenants.data : []
        this.bindTenantDialog.options = (Array.isArray(tenants) ? tenants : []).map(item => ({
          key: item.tenantId,
          label: `${item.tenantName || ''}(${item.tenantId})`
        }))

        const resBound = await adminTenantGetPhoneTenantList({ phone: this.bindTenantDialog.phone })
        const bound = resBound && resBound.data ? resBound.data : []
        this.bindTenantDialog.selected = (Array.isArray(bound) ? bound : []).map(item => item.tenantId || item.id).filter(v => v !== undefined && v !== null)
      } catch (err) {
        this.bindTenantDialog.options = []
        this.bindTenantDialog.selected = []
        this.$apiError.notify(err, '加载租户失败')
      }
    },

    resetBindTenantDialog () {
      this.bindTenantDialog.phone = ''
      this.bindTenantDialog.options = []
      this.bindTenantDialog.selected = []
      this.bindTenantDialog.submitting = false
    },

    async handleTenantTransferChange (newTargetKeys, direction, movedKeys) {
      if (this.blockPermissionWrite()) return
      if (!movedKeys || movedKeys.length === 0) return
      if (this.bindTenantDialog.submitting) return
      this.bindTenantDialog.submitting = true
      try {
        const phone = this.bindTenantDialog.phone
        if (direction === 'right') {
          for (const tenantId of movedKeys) {
            await adminTenantBindUserToTenant({ tenantId, phone })
          }
          this.$message.success('绑定成功')
        } else if (direction === 'left') {
          for (const tenantId of movedKeys) {
            await adminTenantUnbindUserToTenant({ tenantId, phone })
          }
          this.$message.success('解绑成功')
        }
        await this.fetchBoundTenantsBatch([phone])
      } catch (err) {
        this.$apiError.notify(err, '操作失败')
        try {
          const resBound = await adminTenantGetPhoneTenantList({ phone: this.bindTenantDialog.phone })
          const bound = resBound && resBound.data ? resBound.data : []
          this.bindTenantDialog.selected = (Array.isArray(bound) ? bound : []).map(item => item.tenantId || item.id).filter(v => v !== undefined && v !== null)
        } catch (e) {}
      } finally {
        this.bindTenantDialog.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.perm-env-tip {
  margin-bottom: 12px;
}

.perm-env-tip ::v-deep .perm-env-link {
  color: #409eff !important;
  font-weight: 600;
  text-decoration: underline;
}

.query-form {
  margin-bottom: 12px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  table-layout: auto;
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
}

.action-buttons :deep(.el-button) {
  flex: 0 0 auto;
  white-space: nowrap;
}

.action-buttons :deep(.el-button--text) {
  padding: 0;
}

.action-buttons :deep(.el-button--text span) {
  font-size: 12px;
}

.data-table :deep(.action-column .cell) {
  white-space: nowrap;
}

.table-wrapper :deep(.el-table__header-wrapper table),
.table-wrapper :deep(.el-table__body-wrapper table) {
  min-width: 1200px;
}

:deep(.bind-transfer-dialog) .el-dialog__body {
  padding: 20px 24px;
}

.transfer-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.transfer-wrapper :deep(.el-transfer) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.transfer-wrapper :deep(.el-transfer-panel) {
  width: 42%;
}

.transfer-wrapper :deep(.el-transfer-panel__body) {
  height: 400px;
}

.transfer-wrapper :deep(.el-transfer-panel__filter) {
  margin: 10px;
}

.transfer-wrapper :deep(.el-transfer-panel__list) {
  height: 330px;
  overflow-y: auto;
}

.transfer-wrapper :deep(.el-transfer__buttons) {
  padding: 0 20px;
}
</style>
