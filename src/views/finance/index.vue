<template>
    <div class="app-container">
      <el-card>
        <!-- 操作按钮 -->
        <div class="filter-container">
          <el-button
            class="filter-item"
            type="primary"
            icon="el-icon-plus"
            @click="handleCreate"
          >
            添加菜单
          </el-button>
          <el-button
            class="filter-item"
            type="info"
            @click="toggleExpand"
          >
            {{ isExpanded ? '折叠' : '展开' }}
          </el-button>
        </div>

        <!-- 树形表格 -->
        <el-table
          v-loading="listLoading"
          :data="list"
          element-loading-text="Loading"
          border
          fit
          highlight-current-row
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          :default-expand-all="isExpanded"
        >
          <el-table-column label="菜单名称" width="200">
            <template slot-scope="scope">
              <i :class="scope.row.icon" style="margin-right: 5px;"></i>
              {{ scope.row.menuName }}
            </template>
          </el-table-column>
          <el-table-column label="排序" width="80" align="center">
            <template slot-scope="scope">
              {{ scope.row.orderNum }}
            </template>
          </el-table-column>
          <el-table-column label="权限标识" width="150" align="center">
            <template slot-scope="scope">
              {{ scope.row.perms || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="组件路径" align="center">
            <template slot-scope="scope">
              {{ scope.row.component || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.visible === 1 ? 'success' : 'danger'">
                {{ scope.row.visible === 1 ? '显示' : '隐藏' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180" align="center">
            <template slot-scope="scope">
              {{ scope.row.createTime }}
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button type="primary" size="mini" @click="handleUpdate(scope.row)">
                编辑
              </el-button>
              <el-button type="success" size="mini" @click="handleAdd(scope.row)">
                新增
              </el-button>
              <el-button
                size="mini"
                type="danger"
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 添加/编辑对话框 -->
      <el-dialog :title="dialogTitle" :visible.sync="dialogFormVisible" width="600px">
        <el-form
          ref="dataForm"
          :rules="rules"
          :model="temp"
          label-position="left"
          label-width="100px"
          style="width: 90%; margin-left:50px;"
        >
          <el-row>
            <el-col :span="24">
              <el-form-item label="上级菜单">
                <el-cascader
                  v-model="temp.parentId"
                  :options="menuOptions"
                  :props="{ value: 'id', label: 'menuName', children: 'children', checkStrictly: true }"
                  clearable
                  style="width: 100%"
                  placeholder="选择上级菜单"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="菜单类型" prop="menuType">
                <el-radio-group v-model="temp.menuType">
                  <el-radio label="M">目录</el-radio>
                  <el-radio label="C">菜单</el-radio>
                  <el-radio label="F">按钮</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="菜单图标">
                <el-input v-model="temp.icon" placeholder="请选择图标" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="菜单名称" prop="menuName">
                <el-input v-model="temp.menuName" placeholder="请输入菜单名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示排序" prop="orderNum">
                <el-input-number v-model="temp.orderNum" controls-position="right" :min="0" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="路由地址">
                <el-input v-model="temp.path" placeholder="请输入路由地址" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="组件路径">
                <el-input v-model="temp.component" placeholder="请输入组件路径" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="权限标识">
                <el-input v-model="temp.perms" placeholder="请输入权限标识" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="菜单状态">
                <el-radio-group v-model="temp.visible">
                  <el-radio :label="1">显示</el-radio>
                  <el-radio :label="0">隐藏</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogFormVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
            确认
          </el-button>
        </div>
      </el-dialog>
    </div>
  </template>

<script>
export default {
  name: 'Finance',
  data () {
    return {
      list: [],
      listLoading: true,
      isExpanded: true,
      temp: {
        id: undefined,
        menuName: '',
        parentId: 0,
        orderNum: 0,
        path: '',
        component: '',
        menuType: 'C',
        visible: 1,
        icon: '',
        perms: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      menuOptions: [],
      rules: {
        menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
        orderNum: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
        path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }]
      }
    }
  },
  computed: {
    dialogTitle () {
      return this.dialogStatus === 'create' ? '添加菜单' : '编辑菜单'
    }
  },
  created () {
    this.getList()
  },
  methods: {
    getList () {
      this.listLoading = true
      // 模拟树形数据
      setTimeout(() => {
        this.list = [
          {
            id: 1,
            menuName: '系统管理',
            parentId: 0,
            orderNum: 1,
            path: '/system',
            component: 'Layout',
            menuType: 'M',
            visible: 1,
            icon: 'el-icon-setting',
            perms: '',
            createTime: '2024-01-15 10:30:00',
            children: [
              {
                id: 100,
                menuName: '用户管理',
                parentId: 1,
                orderNum: 1,
                path: 'user',
                component: 'system/user/index',
                menuType: 'C',
                visible: 1,
                icon: 'el-icon-user',
                perms: 'system:user:list',
                createTime: '2024-01-15 10:30:00'
              },
              {
                id: 101,
                menuName: '角色管理',
                parentId: 1,
                orderNum: 2,
                path: 'role',
                component: 'system/role/index',
                menuType: 'C',
                visible: 1,
                icon: 'el-icon-s-custom',
                perms: 'system:role:list',
                createTime: '2024-01-15 10:30:00'
              },
              {
                id: 102,
                menuName: '菜单管理',
                parentId: 1,
                orderNum: 3,
                path: 'menu',
                component: 'system/menu/index',
                menuType: 'C',
                visible: 1,
                icon: 'el-icon-menu',
                perms: 'system:menu:list',
                createTime: '2024-01-15 10:30:00'
              }
            ]
          },
          {
            id: 2,
            menuName: '数据大屏',
            parentId: 0,
            orderNum: 2,
            path: '/dashboard',
            component: 'Layout',
            menuType: 'C',
            visible: 1,
            icon: 'el-icon-data-analysis',
            perms: 'dashboard:view',
            createTime: '2024-01-15 10:30:00'
          }
        ]
        this.menuOptions = this.buildMenuTree(this.list)
        this.listLoading = false
      }, 500)
    },
    buildMenuTree (data) {
      return data.map(item => ({
        id: item.id,
        menuName: item.menuName,
        children: item.children ? this.buildMenuTree(item.children) : []
      }))
    },
    toggleExpand () {
      this.isExpanded = !this.isExpanded
    },
    resetTemp () {
      this.temp = {
        id: undefined,
        menuName: '',
        parentId: 0,
        orderNum: 0,
        path: '',
        component: '',
        menuType: 'C',
        visible: 1,
        icon: '',
        perms: ''
      }
    },
    handleCreate () {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    },
    handleAdd (row) {
      this.resetTemp()
      this.temp.parentId = row.id
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    },
    createData () {
      this.$refs.dataForm.validate((valid) => {
        if (valid) {
          this.$message({
            message: '创建成功',
            type: 'success'
          })
          this.dialogFormVisible = false
          this.getList()
        }
      })
    },
    handleUpdate (row) {
      this.temp = Object.assign({}, row)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    },
    updateData () {
      this.$refs.dataForm.validate((valid) => {
        if (valid) {
          this.$message({
            message: '更新成功',
            type: 'success'
          })
          this.dialogFormVisible = false
          this.getList()
        }
      })
    },
    handleDelete (row) {
      this.$confirm('此操作将永久删除该菜单, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message({
          type: 'success',
          message: '删除成功!'
        })
        this.getList()
      })
    }
  }
}
</script>

  <style scoped>
  .filter-container {
    padding-bottom: 20px;
  }

  .filter-item {
    margin-right: 10px;
  }
  </style>
