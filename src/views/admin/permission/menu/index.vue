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
        <span>菜单管理</span>
      </div>

      <el-tabs v-model="menuPlace" type="card" @tab-click="handleTabClick">
        <el-tab-pane label="管理后台" name="1" />
        <el-tab-pane label="控制台" name="2" />
      </el-tabs>

      <div class="toolbar">
        <el-button type="success" size="small" @click="openAdd()">新增菜单</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        row-key="no"
        :tree-props="{ children: 'children' }"
        style="width: 100%;"
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="180" />
        <el-table-column prop="no" label="菜单ID" width="140" />
        <el-table-column label="类型" width="120">
          <template slot-scope="scope">
            {{ getMenuTypeLabel(scope.row.menuType) }}
          </template>
        </el-table-column>
        <el-table-column prop="url" label="URL" min-width="200" />
        <el-table-column prop="remark" label="备注" min-width="160" />
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.menuType === 1 || scope.row.menuType === 2"
              type="text"
              size="small"
              @click="openAdd(scope.row)"
            >新增</el-button>
            <el-button type="text" size="small" @click="openEdit(scope.row)">修改</el-button>
            <el-button
              v-if="scope.row.menuType === 3 || scope.row.menuType === 4"
              type="text"
              size="small"
              @click="toggleMenuStatus(scope.row)"
            >{{ scope.row.menuStatus === 2 ? '启用' : '停用' }}</el-button>
            <el-button type="text" size="small" @click="openStatistics(scope.row)">权限统计</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      :visible.sync="editDialog.visible"
      :close-on-click-modal="false"
      :title="editDialog.isEdit ? '修改菜单' : '新增菜单'"
      width="640px"
      @closed="resetEditDialog"
    >
      <el-form ref="menuForm" :model="editDialog.form" :rules="editDialog.rules" label-width="110px">
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="editDialog.form.menuName" clearable placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单ID" prop="no">
          <el-input v-model="editDialog.form.no" :disabled="editDialog.isEdit" clearable placeholder="请输入菜单ID" />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-select v-model="editDialog.form.menuType" clearable placeholder="请选择" style="width: 100%;">
            <el-option v-for="item in menuTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editDialog.form.menuType && editDialog.form.menuType !== 1" label="上级菜单">
          <el-cascader
            v-model="editDialog.parentPath"
            clearable
            filterable
            :options="editDialog.parentOptions"
            :props="{ checkStrictly: true, expandTrigger: 'hover', value: 'no', label: 'menuName', children: 'children' }"
            style="width: 100%;"
            @change="handleParentChange"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch
            v-model="editDialog.form.menuStatus"
            :disabled="editDialog.form.menuType === 1 || editDialog.form.menuType === 2"
            :active-value="1"
            :inactive-value="2"
          />
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="editDialog.form.url" clearable placeholder="请输入URL" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editDialog.form.remark" type="textarea" :rows="3" clearable placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="editDialog.submitting" @click="submitMenu">确定</el-button>
      </span>
    </el-dialog>

    <el-drawer
      :visible.sync="statsDrawer.visible"
      size="60%"
      :with-header="true"
      title="权限统计"
      @open="initStatistics"
      @closed="resetStatistics"
    >
      <div class="drawer-content">
        <el-card shadow="never">
          <div slot="header">已赋权角色&数量</div>
          <div class="stats-row">
            <div class="stats-item">
              <div class="stats-label">总计</div>
              <div class="stats-value">{{ statsDrawer.total }}</div>
            </div>
            <div class="stats-item" v-for="(item, idx) in statsDrawer.roleStats" :key="idx">
              <div class="stats-label">{{ item.role || '-' }}</div>
              <div class="stats-value">{{ item.count }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" style="margin-top: 12px;">
          <div slot="header">已赋权账号</div>
          <el-table v-loading="statsDrawer.loading" :data="statsDrawer.userList" border style="width: 100%;">
            <el-table-column prop="userId" label="用户ID" width="100" />
            <el-table-column prop="name" label="用户名称" min-width="140" />
            <el-table-column prop="phone" label="账号(手机号)" min-width="160" />
            <el-table-column prop="role" label="角色" min-width="140" />
            <el-table-column prop="wxNickname" label="微信昵称" min-width="160" />
          </el-table>
          <div class="pagination-container">
            <el-pagination
              background
              :current-page.sync="statsDrawer.page.current"
              :page-sizes="[15, 50, 100, 200]"
              :page-size.sync="statsDrawer.page.size"
              layout="total, sizes, prev, pager, next, jumper"
              :total="statsDrawer.page.total"
              @size-change="handleStatsSizeChange"
              @current-change="handleStatsCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  adminCreateMenu,
  adminGetMenuStatistics,
  adminGetMenuTree,
  adminGetMenuUser,
  adminMenuEnableDisable,
  adminUpdateMenu
} from '@/api/adminapi'
import { isPermissionTestEnv } from '@/utils/request'

const PERMISSION_FORMAL_URL = 'https://iot.example.com/'

export default {
  name: 'AdminPermissionMenu',
  data () {
    return {
      loading: false,
      menuPlace: '1',
      tableData: [],
      menuTypeOptions: [
        { label: '主菜单', value: 1 },
        { label: '子菜单', value: 2 },
        { label: '功能', value: 3 },
        { label: '跳转', value: 4 }
      ],
      editDialog: {
        visible: false,
        isEdit: false,
        submitting: false,
        parentOptions: [],
        parentPath: [],
        menuPathMap: {},
        form: {
          id: '',
          menuPlace: 1,
          menuName: '',
          no: '',
          menuType: '',
          parentId: -1,
          menuStatus: 1,
          url: '',
          remark: ''
        },
        rules: {
          menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
          no: [{ required: true, message: '请输入菜单ID', trigger: 'blur' }],
          menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
        }
      },
      statsDrawer: {
        visible: false,
        loading: false,
        row: null,
        roleStats: [],
        total: 0,
        userList: [],
        page: {
          current: 1,
          size: 15,
          total: 0
        }
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
    this.fetchMenuTree()
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
    async fetchMenuTree () {
      this.loading = true
      try {
        const place = Number(this.menuPlace)
        const res = await adminGetMenuTree({ menuPlace: place })
        const data = res && res.data ? res.data : []
        this.tableData = Array.isArray(data) ? data : []

        const parentOptions = this.cloneTreeForCascader(this.tableData)
        const menuPathMap = {}
        this.buildMenuPathMap(this.tableData, [], menuPathMap)
        this.editDialog.parentOptions = parentOptions
        this.editDialog.menuPathMap = menuPathMap
      } catch (err) {
        this.tableData = []
        this.$apiError.notify(err, '获取菜单失败')
      } finally {
        this.loading = false
      }
    },

    handleTabClick () {
      this.fetchMenuTree()
    },

    getMenuTypeLabel (menuType) {
      const found = this.menuTypeOptions.find(i => i.value === menuType)
      return found ? found.label : '-'
    },

    cloneTreeForCascader (tree) {
      const clone = (nodes) => {
        return (Array.isArray(nodes) ? nodes : []).map(n => {
          const item = {
            id: n.id,
            menuName: n.menuName,
            no: n.no,
            menuType: n.menuType,
            parentId: n.parentId,
            children: n.children ? clone(n.children) : []
          }
          if (!item.children.length) delete item.children
          return item
        })
      }
      return clone(tree)
    },

    buildMenuPathMap (nodes, parentPath, map) {
      (Array.isArray(nodes) ? nodes : []).forEach(node => {
        const path = parentPath.concat(node.no)
        map[node.no] = path
        if (node.children && node.children.length) {
          this.buildMenuPathMap(node.children, path, map)
        }
      })
    },

    openAdd (parentRow) {
      if (this.blockPermissionWrite()) return
      this.editDialog.isEdit = false
      this.editDialog.visible = true
      const place = Number(this.menuPlace)
      this.editDialog.form = {
        id: '',
        menuPlace: place,
        menuName: '',
        no: '',
        menuType: '',
        parentId: -1,
        menuStatus: 1,
        url: '',
        remark: ''
      }
      this.editDialog.parentPath = []

      if (parentRow && parentRow.no) {
        this.editDialog.form.parentId = parentRow.no
        this.editDialog.parentPath = this.editDialog.menuPathMap[parentRow.no] || []
        if (parentRow.menuType === 1) {
          this.editDialog.form.menuType = 2
        } else if (parentRow.menuType === 2) {
          this.editDialog.form.menuType = 3
        }
      }
    },

    openEdit (row) {
      if (this.blockPermissionWrite()) return
      this.editDialog.isEdit = true
      this.editDialog.visible = true
      const place = Number(this.menuPlace)
      this.editDialog.form = {
        id: row.id,
        menuPlace: place,
        menuName: row.menuName,
        no: row.no,
        menuType: row.menuType,
        parentId: row.parentId === undefined ? -1 : row.parentId,
        menuStatus: row.menuStatus === undefined ? 1 : row.menuStatus,
        url: row.url,
        remark: row.remark
      }
      if (this.editDialog.form.parentId !== -1 && this.editDialog.menuPathMap[this.editDialog.form.parentId]) {
        this.editDialog.parentPath = this.editDialog.menuPathMap[this.editDialog.form.parentId]
      } else {
        this.editDialog.parentPath = []
      }
    },

    handleParentChange (val) {
      this.editDialog.form.parentId = val && val.length ? val[val.length - 1] : -1
    },

    resetEditDialog () {
      if (this.$refs.menuForm) {
        this.$refs.menuForm.clearValidate()
      }
      this.editDialog.submitting = false
      this.editDialog.parentPath = []
    },

    submitMenu () {
      if (this.blockPermissionWrite()) return
      const formRef = this.$refs.menuForm
      if (!formRef) return

      formRef.validate(async (valid) => {
        if (!valid) return
        const tip = this.editDialog.isEdit ? '确认修改菜单?' : '确认新增菜单?'
        this.$confirm(tip, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(async () => {
          this.editDialog.submitting = true
          try {
            const payload = { ...this.editDialog.form }
            if (payload.menuType === 1) {
              payload.parentId = -1
              this.editDialog.parentPath = []
            }
            if (this.editDialog.isEdit) {
              await adminUpdateMenu(payload)
              this.$message.success('修改成功')
            } else {
              await adminCreateMenu(payload)
              this.$message.success('新增成功')
            }
            this.editDialog.visible = false
            this.fetchMenuTree()
          } catch (err) {
            this.$apiError.notify(err, '提交失败')
          } finally {
            this.editDialog.submitting = false
          }
        }).catch(() => {})
      })
    },

    toggleMenuStatus (row) {
      if (this.blockPermissionWrite()) return
      const nextStatus = row.menuStatus === 2 ? 1 : 2
      const tip = nextStatus === 1 ? '是否启用该菜单?' : '是否停用该菜单?'
      this.$confirm(tip, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await adminMenuEnableDisable({ id: row.id, menuStatus: nextStatus })
          this.$message.success('操作成功')
          this.fetchMenuTree()
        } catch (err) {
          this.$apiError.notify(err, '操作失败')
        }
      }).catch(() => {})
    },

    openStatistics (row) {
      this.statsDrawer.row = row
      this.statsDrawer.visible = true
    },

    async initStatistics () {
      this.statsDrawer.page.current = 1
      await Promise.all([this.fetchRoleStats(), this.fetchMenuUsers()])
    },

    resetStatistics () {
      this.statsDrawer.loading = false
      this.statsDrawer.row = null
      this.statsDrawer.roleStats = []
      this.statsDrawer.total = 0
      this.statsDrawer.userList = []
      this.statsDrawer.page = { current: 1, size: 15, total: 0 }
    },

    async fetchRoleStats () {
      if (!this.statsDrawer.row) return
      try {
        const res = await adminGetMenuStatistics({ id: this.statsDrawer.row.id })
        const data = res && res.data ? res.data : []
        const list = Array.isArray(data) ? data : []
        const totalItem = list.find(item => item.type === 'total')
        this.statsDrawer.total = totalItem ? Number(totalItem.count || 0) : 0
        this.statsDrawer.roleStats = list.filter(item => item.type !== 'total')
      } catch (err) {
        this.statsDrawer.total = 0
        this.statsDrawer.roleStats = []
      }
    },

    async fetchMenuUsers () {
      if (!this.statsDrawer.row) return
      this.statsDrawer.loading = true
      try {
        const res = await adminGetMenuUser({
          current: this.statsDrawer.page.current,
          size: this.statsDrawer.page.size,
          id: this.statsDrawer.row.id
        })
        const data = res && res.data ? res.data : {}
        this.statsDrawer.userList = Array.isArray(data.dataList) ? data.dataList : []
        this.statsDrawer.page.total = Number(data.total || 0)
      } catch (err) {
        this.statsDrawer.userList = []
        this.statsDrawer.page.total = 0
      } finally {
        this.statsDrawer.loading = false
      }
    },

    handleStatsSizeChange (val) {
      this.statsDrawer.page.size = val
      this.statsDrawer.page.current = 1
      this.fetchMenuUsers()
    },

    handleStatsCurrentChange (val) {
      this.statsDrawer.page.current = val
      this.fetchMenuUsers()
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

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin: 8px 0 12px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.drawer-content {
  padding: 12px;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stats-item {
  min-width: 120px;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.stats-label {
  color: #606266;
  font-size: 12px;
  margin-bottom: 6px;
}

.stats-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
</style>
