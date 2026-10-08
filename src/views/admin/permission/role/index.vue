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
        <span>角色管理</span>
      </div>

      <el-form :inline="true" size="small" class="query-form" @submit.native.prevent>
        <el-form-item label="角色名称">
          <el-input v-model="query.roleName" clearable placeholder="角色名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="openAdd">新增角色</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="tableData"
        element-loading-text="正在加载数据..."
        border
        fit
        highlight-current-row
        row-key="role"
        style="width: 100%;"
        class="data-table"
      >
        <el-table-column prop="roleName" label="角色名称" width="140" show-overflow-tooltip />
        <el-table-column label="关联账号" min-width="280" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.userCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center" class-name="action-column">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button type="text" size="small" @click="openEdit(scope.row)">修改</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

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
      :title="editDialog.isEdit ? '配置角色权限' : '新增角色'"
      :width="editDialog.isEdit ? '960px' : '600px'"
      custom-class="role-dialog"
      @open="initEditDialog"
      @closed="resetEditDialog"
    >
      <el-form ref="roleForm" :model="editDialog.form" :rules="editDialog.rules" :label-width="editDialog.isEdit ? '80px' : '100px'">
        <template v-if="editDialog.isEdit">
          <!-- 配置权限态的头部信息展示区 -->
          <div class="role-info-header">
            <div class="info-item">
              <span class="info-label">角色名称：</span>
              <span class="info-value highlight">{{ editDialog.form.roleName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">角色类型：</span>
              <span class="info-value">{{ getRoleTypeLabel(editDialog.form.roleType) }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <!-- 新增角色态的表单录入区 -->
          <el-form-item label="角色名称" prop="roleName">
            <el-input v-model="editDialog.form.roleName" placeholder="请输入角色名称" />
          </el-form-item>
          <el-form-item label="角色类型" prop="roleType">
            <el-input v-model="editDialog.form.roleType" placeholder="请输入角色编码 (如: MANAGER)" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="editDialog.form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
          </el-form-item>
        </template>

        <template v-if="editDialog.isEdit">
          <div class="class-tabbar">
          <div :class="editDialog.selectType === 1 ? 'class-onbar' : 'class-bar'" @click="changeBar(1)">管理后台</div>
          <div :class="editDialog.selectType === 2 ? 'class-onbar' : 'class-bar'" @click="changeBar(2)">控制台</div>
        </div>

        <div v-show="editDialog.selectType === 1" class="tree-panel">
          <div class="tree-head">
            <div class="head-action" @click="toggleSelectAll(1)">全选/清空</div>
            <div class="head-action" @click="toggleExpandAll(1)">
              <span v-if="editDialog.htTreeExpanded">收起</span>
              <span v-else>展开</span>
              <i :class="editDialog.htTreeExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
            </div>
          </div>
          <el-input v-model="editDialog.htFilter" size="small" clearable placeholder="筛选菜单" class="tree-filter" />
          <el-tree
            :key="editDialog.htTreeRenderKey"
            ref="htTree"
            v-loading="editDialog.treeLoading"
            :data="editDialog.htTreeData"
            show-checkbox
            node-key="id"
            :default-checked-keys="editDialog.htDefaultKeys"
            :default-expand-all="false"
            :props="{ children: 'children', label: 'menuName' }"
            :filter-node-method="filterTreeNode"
          />
        </div>

        <div v-show="editDialog.selectType === 2" class="tree-panel">
          <div class="tree-head">
            <div class="head-action" @click="toggleSelectAll(2)">全选/清空</div>
            <div class="head-action" @click="toggleExpandAll(2)">
              <span v-if="editDialog.kztTreeExpanded">收起</span>
              <span v-else>展开</span>
              <i :class="editDialog.kztTreeExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
            </div>
          </div>
          <el-input v-model="editDialog.kztFilter" size="small" clearable placeholder="筛选菜单" class="tree-filter" />
          <el-tree
            :key="editDialog.kztTreeRenderKey"
            ref="kztTree"
            v-loading="editDialog.treeLoading"
            :data="editDialog.kztTreeData"
            show-checkbox
            node-key="id"
            :default-checked-keys="editDialog.kztDefaultKeys"
            :default-expand-all="false"
            :props="{ children: 'children', label: 'menuName' }"
            :filter-node-method="filterTreeNode"
          />
        </div>
        </template>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="editDialog.submitting" @click="submitRole">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  adminAddAllMenuRole,
  adminAddRole,
  adminGetMenuRoleListByRole,
  adminGetMenuTree,
  adminGetRolePage
} from '@/api/adminapi'
import { isPermissionTestEnv } from '@/utils/request'

import { PERMISSION_FORMAL_URL } from '@/config/services'

export default {
  name: 'AdminPermissionRole',
  data () {
    return {
      loading: false,
      tableData: [],
      query: {
        roleName: '',
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
        { label: '测试', value: 'TESTER' }
      ],
      editDialog: {
        visible: false,
        isEdit: false,
        submitting: false,
        treeLoading: false,
        selectType: 1,
        htDefaultKeys: [],
        kztDefaultKeys: [],
        htTreeRenderKey: 0,
        kztTreeRenderKey: 0,
        htTreeExpanded: false,
        kztTreeExpanded: false,
        htTreeData: [],
        kztTreeData: [],
        htNodeMap: {},
        kztNodeMap: {},
        htFilter: '',
        kztFilter: '',
        form: {
          role: '',
          roleName: '',
          roleType: '',
          remark: ''
        },
        rules: {
          roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
          roleType: [{ required: true, message: '请输入角色类型', trigger: 'blur' }]
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
  watch: {
    'editDialog.htFilter' (val) {
      if (this.$refs.htTree) this.$refs.htTree.filter(val)
    },
    'editDialog.kztFilter' (val) {
      if (this.$refs.kztTree) this.$refs.kztTree.filter(val)
    }
  },
  created () {
    this.fetchRoleList()
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

    async fetchRoleList () {
      this.loading = true
      try {
        const payload = {
          roleName: this.query.roleName,
          withCount: true,
          page: {
            size: this.query.size,
            current: this.query.current
          }
        }
        const res = await adminGetRolePage(payload)
        const data = res && res.data ? res.data : {}
        const list = data.dataList || data.list || []
        const normalized = (Array.isArray(list) ? list : []).map(item => ({
          ...item,
          role: item.role || item.roleType
        }))
        this.tableData = normalized
        this.query.total = Number(data.total || 0)
        this.query.current = Number(data.current || this.query.current)
      } catch (err) {
        this.tableData = []
        this.$apiError.notify(err, '获取角色列表失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch () {
      this.query.current = 1
      this.fetchRoleList()
    },

    handleReset () {
      this.query.roleName = ''
      this.query.current = 1
      this.fetchRoleList()
    },

    handleSizeChange (val) {
      this.query.size = val
      this.query.current = 1
      this.fetchRoleList()
    },

    handleCurrentChange (val) {
      this.query.current = val
      this.fetchRoleList()
    },

    openAdd () {
      if (this.blockPermissionWrite()) return
      this.editDialog.isEdit = false
      this.editDialog.visible = true
      this.editDialog.selectType = 1
      this.editDialog.htDefaultKeys = []
      this.editDialog.kztDefaultKeys = []
      this.editDialog.htTreeExpanded = false
      this.editDialog.kztTreeExpanded = false
      this.editDialog.form = {
        role: '',
        roleName: '',
        roleType: '',
        remark: ''
      }
    },

    openEdit (row) {
      if (this.blockPermissionWrite()) return
      this.editDialog.isEdit = true
      this.editDialog.visible = true
      this.editDialog.selectType = 1
      this.editDialog.htDefaultKeys = []
      this.editDialog.kztDefaultKeys = []
      this.editDialog.htTreeExpanded = false
      this.editDialog.kztTreeExpanded = false
      this.editDialog.form = {
        role: row.role,
        roleName: row.roleName,
        roleType: row.roleType,
        remark: row.remark
      }
    },

    async initEditDialog () {
      if (this.editDialog.isEdit) {
        await this.loadTrees()
        if (this.editDialog.form.role) {
          await this.loadRoleMenus(this.editDialog.form.role)
        }
      }
    },

    resetEditDialog () {
      if (this.$refs.roleForm) {
        this.$refs.roleForm.clearValidate()
      }
      this.editDialog.submitting = false
      this.editDialog.treeLoading = false
      this.editDialog.selectType = 1
      this.editDialog.htDefaultKeys = []
      this.editDialog.kztDefaultKeys = []
      this.editDialog.htTreeRenderKey = 0
      this.editDialog.kztTreeRenderKey = 0
      this.editDialog.htTreeExpanded = false
      this.editDialog.kztTreeExpanded = false
      this.editDialog.htTreeData = []
      this.editDialog.kztTreeData = []
      this.editDialog.htNodeMap = {}
      this.editDialog.kztNodeMap = {}
      this.editDialog.htFilter = ''
      this.editDialog.kztFilter = ''
    },

    filterTreeNode (value, data) {
      if (!value) return true
      return String(data.menuName || '').includes(value)
    },

    changeBar (type) {
      this.editDialog.selectType = type
      this.$nextTick(() => {
        if (type === 1 && this.$refs.htTree) this.$refs.htTree.filter(this.editDialog.htFilter)
        if (type === 2 && this.$refs.kztTree) this.$refs.kztTree.filter(this.editDialog.kztFilter)
      })
    },

    async loadTrees () {
      this.editDialog.treeLoading = true
      try {
        const [htRes, kztRes] = await Promise.all([
          adminGetMenuTree({ menuPlace: 1 }),
          adminGetMenuTree({ menuPlace: 2 })
        ])
        const htTree = htRes && htRes.data ? htRes.data : []
        const kztTree = kztRes && kztRes.data ? kztRes.data : []
        this.editDialog.htTreeData = Array.isArray(htTree) ? htTree : []
        this.editDialog.kztTreeData = Array.isArray(kztTree) ? kztTree : []

        const htNodeMap = {}
        const kztNodeMap = {}
        this.buildNodeMap(this.editDialog.htTreeData, htNodeMap)
        this.buildNodeMap(this.editDialog.kztTreeData, kztNodeMap)
        this.editDialog.htNodeMap = htNodeMap
        this.editDialog.kztNodeMap = kztNodeMap
      } catch (err) {
        this.editDialog.htTreeData = []
        this.editDialog.kztTreeData = []
        this.editDialog.htNodeMap = {}
        this.editDialog.kztNodeMap = {}
        this.$apiError.notify(err, '加载菜单树失败')
      } finally {
        this.editDialog.treeLoading = false
      }
    },

    buildNodeMap (nodes, map) {
      (Array.isArray(nodes) ? nodes : []).forEach(node => {
        if (!node || node.id === undefined || node.id === null) return
        map[node.id] = node
        map[String(node.id)] = node
        if (node.children && node.children.length) this.buildNodeMap(node.children, map)
      })
    },

    async loadRoleMenus (role) {
      try {
        const res = await adminGetMenuRoleListByRole({ role })
        const data = res && res.data ? res.data : {}
        const htMenuRoleList = Array.isArray(data.htMenuRoleList) ? data.htMenuRoleList : []
        const kztMenuRoleList = Array.isArray(data.kztMenuRoleList) ? data.kztMenuRoleList : []

        const normalizeLeafKeys = (rawKeys, nodeMap) => {
          return (rawKeys || []).map(k => {
            const node = nodeMap && (nodeMap[k] || nodeMap[String(k)])
            if (node && (!node.children || node.children.length === 0)) {
              return node.id
            }
            return null
          }).filter(v => v !== null && v !== undefined)
        }

        const htRaw = htMenuRoleList.map(item => item.menuId).filter(v => v !== undefined && v !== null)
        const kztRaw = kztMenuRoleList.map(item => item.menuId).filter(v => v !== undefined && v !== null)

        const htKeys = normalizeLeafKeys(htRaw, this.editDialog.htNodeMap)
        const kztKeys = normalizeLeafKeys(kztRaw, this.editDialog.kztNodeMap)

        this.editDialog.htDefaultKeys = htKeys
        this.editDialog.kztDefaultKeys = kztKeys
        this.editDialog.htTreeRenderKey += 1
        this.editDialog.kztTreeRenderKey += 1
        this.$nextTick(() => {
          if (this.$refs.htTree) this.$refs.htTree.setCheckedKeys(htKeys)
          if (this.$refs.kztTree) this.$refs.kztTree.setCheckedKeys(kztKeys)
        })
      } catch (err) {
        this.$apiError.notify(err, '加载角色权限失败')
      }
    },

    collectAllNodeKeys (nodes) {
      const keys = []
      const walk = (arr) => {
        (Array.isArray(arr) ? arr : []).forEach(n => {
          if (n && n.id !== undefined && n.id !== null) keys.push(n.id)
          if (n && n.children && n.children.length) walk(n.children)
        })
      }
      walk(nodes)
      return keys
    },

    toggleSelectAll (type) {
      if (this.blockPermissionWrite()) return
      const isHt = type === 1
      const treeRef = isHt ? this.$refs.htTree : this.$refs.kztTree
      if (!treeRef) return
      const data = isHt ? this.editDialog.htTreeData : this.editDialog.kztTreeData
      const allKeys = this.collectAllNodeKeys(data)
      const checked = treeRef.getCheckedKeys()
      const shouldClear = checked && checked.length > 0
      treeRef.setCheckedKeys(shouldClear ? [] : allKeys)
    },

    setExpandedForAll (treeRef, nodes, expanded) {
      if (!treeRef) return
      const walk = (arr) => {
        (Array.isArray(arr) ? arr : []).forEach(n => {
          const key = n && n.id !== undefined ? n.id : null
          if (key !== null) {
            const node = treeRef.getNode(key)
            if (node) node.expanded = expanded
          }
          if (n && n.children && n.children.length) walk(n.children)
        })
      }
      walk(nodes)
    },

    toggleExpandAll (type) {
      const isHt = type === 1
      const treeRef = isHt ? this.$refs.htTree : this.$refs.kztTree
      const data = isHt ? this.editDialog.htTreeData : this.editDialog.kztTreeData
      const next = isHt ? !this.editDialog.htTreeExpanded : !this.editDialog.kztTreeExpanded
      this.setExpandedForAll(treeRef, data, next)
      if (isHt) this.editDialog.htTreeExpanded = next
      else this.editDialog.kztTreeExpanded = next
    },

    submitRole () {
      if (this.blockPermissionWrite()) return
      const formRef = this.$refs.roleForm
      if (!formRef) return
      formRef.validate(async (valid) => {
        if (!valid) return
        const tip = this.editDialog.isEdit ? '确认修改该角色权限?' : '确认新增该角色?'
        this.$confirm(tip, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(async () => {
          this.editDialog.submitting = true
          try {
            if (!this.editDialog.isEdit) {
              await adminAddRole({
                roleName: this.editDialog.form.roleName,
                roleType: this.editDialog.form.roleType,
                remark: this.editDialog.form.remark
              })
              this.$message.success('新增角色成功')
            } else {
              const role = this.editDialog.form.role
              const ht = this.collectTreeSelection(this.$refs.htTree, this.editDialog.htNodeMap, 1)
              const kzt = this.collectTreeSelection(this.$refs.kztTree, this.editDialog.kztNodeMap, 2)

              await adminAddAllMenuRole({
                role,
                htMenuRoleList: ht,
                kztMenuRoleList: kzt
              })
              this.$message.success('权限配置成功')
            }
            this.editDialog.visible = false
            this.fetchRoleList()
          } catch (err) {
            this.$apiError.notify(err, '提交失败')
          } finally {
            this.editDialog.submitting = false
          }
        }).catch(() => {})
      })
    },

    collectTreeSelection (treeRef, nodeMap, menuPlace) {
      if (!treeRef) return []
      const checked = treeRef.getCheckedKeys()
      const half = treeRef.getHalfCheckedKeys ? treeRef.getHalfCheckedKeys() : []
      const union = Array.from(new Set([...(checked || []), ...(half || [])]))
      return union.map(id => {
        const node = nodeMap && nodeMap[id] ? nodeMap[id] : {}
        return {
          menuId: id,
          menuNo: node.no,
          menuPlace,
          menuStatus: node.menuStatus === undefined ? 1 : node.menuStatus
        }
      })
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

.query-form {
  margin-bottom: 12px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.tree-panel {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
}

.tree-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.tree-filter {
  margin-bottom: 10px;
}

.class-tabbar {
  display: flex;
  gap: 18px;
  margin: 6px 0 12px;
  border-bottom: 1px solid #ebeef5;
}

.class-bar {
  padding: 10px 2px;
  color: #606266;
  cursor: pointer;
}

.class-onbar {
  padding: 10px 2px;
  color: #409eff;
  cursor: pointer;
  border-bottom: 2px solid #409eff;
}

.tree-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.head-action {
  color: #409eff;
  cursor: pointer;
  user-select: none;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.data-table >>> .el-table {
  table-layout: auto;
}

.data-table >>> .action-column .cell {
  overflow: visible !important;
}

.role-dialog :deep(.el-dialog__body) {
  padding: 20px 24px 10px;
}

.role-info-header {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  padding: 16px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
}

.info-item {
  margin-right: 40px;
  font-size: 14px;
}

.info-item:last-child {
  margin-right: 0;
}

.info-label {
  color: #909399;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

.info-value.highlight {
  color: #409eff;
  font-size: 15px;
}
</style>
