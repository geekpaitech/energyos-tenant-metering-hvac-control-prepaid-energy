<template>
  <div class="page-container">
    <!-- 主内容卡片 -->
    <div class="main-card">
      <!-- 搜索区域 -->
      <div class="search-section">
        <div class="search-row">
          <div class="search-item">
            <label class="search-label">用户名</label>
            <el-input
              v-model="listQuery.username"
              placeholder="输入用户名搜索"
              @keyup.enter.native="handleFilter"
              clearable
              class="search-input"
            />
          </div>

          <div class="search-item">
            <label class="search-label">状态</label>
            <el-select
              v-model="listQuery.status"
              placeholder="选择状态"
              clearable
              class="search-select"
            >
              <el-option label="正常" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </div>

          <div class="search-item">
            <el-button class="search-btn" @click="handleFilter">
              <i class="el-icon-search" /> 搜索
            </el-button>
          </div>

          <div class="search-item search-add-btn">
            <el-button class="add-btn" @click="handleCreate">
              <i class="el-icon-plus" /> 新建用户
            </el-button>
          </div>
        </div>
      </div>

      <!-- 表格容器 -->
      <div class="table-container">
        <el-table
          v-loading="listLoading"
          :data="list"
          element-loading-text="正在加载数据..."
          border
          fit
          highlight-current-row
          class="data-table"
        >
          <el-table-column label="ID" width="80" align="center" fixed="left">
            <template slot-scope="scope">
              <span class="user-id">#{{ scope.row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column label="用户名" min-width="120" align="left">
            <template slot-scope="scope">
              <div class="user-info">
                <span class="username">{{ scope.row.username }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="昵称" min-width="130" align="left">
            <template slot-scope="scope">
              <span class="nickname">{{ scope.row.nickname }}</span>
            </template>
          </el-table-column>

          <el-table-column label="邮箱" min-width="200" align="left">
            <template slot-scope="scope">
              <span class="email">{{ scope.row.email }}</span>
            </template>
          </el-table-column>

          <el-table-column label="手机号" min-width="130" align="center">
            <template slot-scope="scope">
              <span class="phone">{{ scope.row.phone }}</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="scope">
              <span :class="['status-badge', scope.row.status === 1 ? 'status-active' : 'status-disabled']">
                <span class="status-dot"></span>
                {{ scope.row.status === 1 ? '正常' : '禁用' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" min-width="150" align="center">
            <template slot-scope="scope">
              <span class="create-time">{{ scope.row.createTime }}</span>
            </template>
          </el-table-column>

          <!-- 自适应操作列 - 关键改进 -->
          <el-table-column label="操作" min-width="200" align="center" fixed="right" class-name="action-column">
            <template slot-scope="scope">
              <div class="action-buttons">
                <el-button
                  class="action-btn edit-btn"
                  size="small"
                  @click="handleUpdate(scope.row)"
                  :disabled="scope.row.status === 0"
                >
                  <i class="el-icon-edit"></i>
                  <span class="btn-text">编辑</span>
                </el-button>
                <el-button
                  v-if="scope.row.status !== 0"
                  class="action-btn delete-btn"
                  size="small"
                  @click="handleDelete(scope.row)"
                >
                  <i class="el-icon-delete"></i>
                  <span class="btn-text">删除</span>
                </el-button>
                <el-button
                  v-else
                  class="action-btn restore-btn"
                  size="small"
                  @click="handleRestore(scope.row)"
                >
                  <i class="el-icon-refresh"></i>
                  <span class="btn-text">恢复</span>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-show="total > 0"
            :current-page="listQuery.page"
            :page-sizes="[10, 20, 30, 50]"
            :page-size="listQuery.limit"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新建用户' : '编辑用户'"
      :visible.sync="dialogFormVisible"
      width="500px"
      :close-on-click-modal="false"
      class="user-dialog"
    >
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="80px"
        class="dialog-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="temp.username"
            placeholder="请输入用户名"
            :disabled="dialogStatus === 'update'"
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="temp.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="temp.email" placeholder="请输入邮箱地址" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="temp.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="temp.status" placeholder="请选择状态" style="width: 100%;">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false" class="cancel-btn">取消</el-button>
        <el-button
          type="primary"
          class="confirm-btn"
          @click="dialogStatus === 'create' ? createData() : updateData()"
        >
          {{ dialogStatus === 'create' ? '创建' : '保存' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'UserManagement',
  data () {
    return {
      list: [],
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 10,
        username: undefined,
        status: undefined
      },
      temp: {
        id: undefined,
        username: '',
        nickname: '',
        email: '',
        phone: '',
        status: 1
      },
      dialogFormVisible: false,
      dialogStatus: '',
      rules: {
        username: [{ required: true, message: '用户名是必填的', trigger: 'blur' }],
        nickname: [{ required: true, message: '昵称是必填的', trigger: 'blur' }],
        email: [
          { required: true, message: '邮箱是必填的', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '手机号是必填的', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ]
      }
    }
  },
  created () {
    this.getList()
  },
  methods: {
    getList () {
      this.listLoading = true
      // 模拟数据
      setTimeout(() => {
        this.list = [
          {
            id: 1,
            username: 'admin',
            nickname: '超级管理员',
            email: 'admin@yongzhen.com',
            phone: '13800138000',
            status: 1,
            createTime: '2024-01-15 10:30'
          },
          {
            id: 2,
            username: 'editor',
            nickname: '编辑员',
            email: 'editor@yongzhen.com',
            phone: '13800138001',
            status: 1,
            createTime: '2024-01-15 11:30'
          },
          {
            id: 3,
            username: 'user001',
            nickname: '李小明',
            email: 'lixiaoming@yongzhen.com',
            phone: '13800138002',
            status: 0,
            createTime: '2024-01-15 12:30'
          },
          {
            id: 4,
            username: 'user002',
            nickname: '张美丽',
            email: 'zhangmeili@yongzhen.com',
            phone: '13800138003',
            status: 1,
            createTime: '2024-01-16 09:15'
          },
          {
            id: 5,
            username: 'manager',
            nickname: '部门经理',
            email: 'manager@yongzhen.com',
            phone: '13800138004',
            status: 1,
            createTime: '2024-01-16 14:20'
          }
        ]
        this.total = 5
        this.listLoading = false
      }, 600)
    },
    handleFilter () {
      this.listQuery.page = 1
      this.getList()
    },
    resetTemp () {
      this.temp = {
        id: undefined,
        username: '',
        nickname: '',
        email: '',
        phone: '',
        status: 1
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
    createData () {
      this.$refs.dataForm.validate((valid) => {
        if (valid) {
          this.$message({
            message: '用户创建成功！',
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
            message: '用户信息更新成功！',
            type: 'success'
          })
          this.dialogFormVisible = false
          this.getList()
        }
      })
    },
    handleDelete (row) {
      this.$confirm('此操作将永久删除该用户，是否继续？', '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message({
          type: 'success',
          message: '删除成功！'
        })
        this.getList()
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    handleRestore (row) {
      this.$confirm('确定要恢复该用户吗？', '恢复确认', {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        this.$message({
          type: 'success',
          message: '用户已恢复！'
        })
        this.getList()
      })
    },
    handleSizeChange (val) {
      this.listQuery.limit = val
      this.getList()
    },
    handleCurrentChange (val) {
      this.listQuery.page = val
      this.getList()
    }
  }
}
</script>

<style scoped>
/* 修复间距的全局容器样式 */
.page-container {
  min-height: 100vh;
  background: var(--main-bg);
  padding: 12px 8px 12px 0; /* 关键修复：减少左边距 */
  position: relative;
  transition: all 0.3s ease;
}

/* 主容器卡片 */
.main-card {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 16px var(--button-shadow);
  border: 1px solid var(--border-color);
  padding: 20px; /* 减少内边距 */
  position: relative;
  transition: all 0.3s ease;
  margin-left: 8px; /* 添加小左边距 */
}

/* 搜索区域 */
.search-section {
  background: var(--search-bg);
  padding: 16px; /* 减少内边距 */
  border-radius: 10px;
  margin-bottom: 16px; /* 减少下边距 */
  border: 1px solid var(--border-secondary);
  transition: all 0.3s ease;
}

.search-row {
  display: flex;
  align-items: flex-end;
  gap: 16px; /* 减少间距 */
  flex-wrap: wrap;
}

.search-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-add-btn {
  margin-left: auto;
}

.search-label {
  font-size: var(--label-font-size);
  color: var(--text-primary);
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* 输入框样式 */
.search-input {
  width: var(--search-input-width);
}

.search-select {
  width: 140px;
}

/* 按钮样式 */
.search-btn {
  background: var(--primary-gradient);
  border: none;
  border-radius: 8px;
  color: white;
  padding: var(--button-padding);
  font-size: var(--button-font-size);
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px var(--button-shadow);
  height: var(--input-height);
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--button-shadow);
  color: white;
}

.add-btn {
  background: var(--secondary-color);
  border: none;
  border-radius: 8px;
  color: white;
  padding: var(--button-padding);
  font-size: var(--button-font-size);
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px var(--button-shadow);
  height: var(--input-height);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn:hover {
  background: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--button-shadow);
  color: white;
}

/* 表格样式 */
.table-container {
  background: var(--card-bg);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px var(--button-shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.data-table >>> .el-table {
  background: transparent;
  border: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: var(--table-font-size);
  color: var(--text-primary);
  table-layout: auto; /* 关键：允许表格自动调整 */
}

.data-table >>> .el-table__header-wrapper {
  background: var(--search-bg);
}

.data-table >>> .el-table__header th {
  background: transparent;
  color: var(--text-primary);
  font-weight: 600;
  font-size: var(--table-font-size);
  padding: var(--table-cell-padding);
  border-bottom: 1px solid var(--border-secondary);
}

.data-table >>> .el-table__body tr {
  transition: all 0.2s ease;
}

.data-table >>> .el-table__body tr:hover {
  background: var(--hover-bg);
}

.data-table >>> .el-table__body td {
  color: var(--text-primary);
  font-size: var(--table-font-size);
  padding: var(--table-cell-padding);
  border-bottom: 1px solid var(--border-color);
}

/* 操作列特殊样式 */
.data-table >>> .action-column {
  position: relative;
}

.data-table >>> .action-column .cell {
  padding: 8px 12px !important; /* 给操作按钮更多内边距 */
  overflow: visible !important; /* 允许内容溢出 */
}

/* 表格内容样式 */
.user-id {
  font-weight: 600;
  color: var(--primary-color);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--table-font-size);
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--table-font-size);
}

.nickname, .email, .phone {
  color: var(--text-secondary);
  font-size: var(--table-font-size);
  word-break: break-all; /* 长邮箱自动换行 */
}

.create-time {
  color: var(--text-muted);
  font-size: calc(var(--table-font-size) - 1px);
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap; /* 时间不换行 */
}

/* 状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: calc(var(--table-font-size) - 1px);
  font-weight: 500;
  gap: 6px;
  min-width: 60px;
  justify-content: center;
  white-space: nowrap;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  display: inline-block;
}

.status-active {
  background: #f0f9f0;
  color: #2d5a2d;
  border: 1px solid #d4edda;
}

.status-active .status-dot {
  background: #28a745;
}

.status-disabled {
  background: #f8f8f8;
  color: #6c757d;
  border: 1px solid #e9ecef;
}

.status-disabled .status-dot {
  background: #6c757d;
}

/* 完全自适应的操作按钮 - 关键修复 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;
  min-width: 180px; /* 确保最小宽度 */
}

.action-btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: calc(var(--button-font-size) - 1px);
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  white-space: nowrap;
  flex-shrink: 0;

  /* 固定尺寸防止挤压 */
  padding: 5px 10px;
  min-width: 56px;
  height: 28px;
}

/* 按钮颜色样式 */
.edit-btn {
  background: var(--primary-gradient);
  border: none;
  color: white;
  box-shadow: 0 1px 3px var(--button-shadow);
}

.edit-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  color: white;
}

.edit-btn:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.delete-btn {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border: none;
  color: white;
  box-shadow: 0 1px 3px rgba(220, 53, 69, 0.2);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
  transform: translateY(-1px);
  color: white;
}

.restore-btn {
  background: var(--secondary-color);
  border: none;
  color: white;
  box-shadow: 0 1px 3px var(--button-shadow);
}

.restore-btn:hover {
  background: var(--primary-color);
  transform: translateY(-1px);
  color: white;
}

/* 响应式按钮 */
@media (max-width: 1400px) {
  .action-btn .btn-text {
    display: none; /* 小屏幕隐藏文字 */
  }

  .action-btn {
    min-width: 32px;
    padding: 5px 8px;
  }

  .action-buttons {
    min-width: 120px;
    gap: 6px;
  }
}

@media (max-width: 1200px) {
  .action-buttons {
    min-width: 100px;
    gap: 4px;
  }

  .action-btn {
    min-width: 28px;
    padding: 4px 6px;
    font-size: 12px;
  }
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px; /* 减少上边距 */
  padding: 16px;
}

.pagination-container >>> .el-pagination {
  color: var(--text-primary);
}

.pagination-container >>> .el-pagination .el-pager li {
  background: var(--card-bg);
  border: 1px solid var(--border-secondary);
  color: var(--text-secondary);
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.2s ease;
}

.pagination-container >>> .el-pagination .el-pager li:hover {
  background: var(--hover-bg);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.pagination-container >>> .el-pagination .el-pager li.active {
  background: var(--primary-gradient);
  color: white;
  border-color: var(--primary-color);
}

/* 对话框样式 */
.user-dialog >>> .el-dialog {
  border-radius: 12px;
  background: var(--card-bg);
  box-shadow: 0 8px 32px var(--button-shadow);
  border: 1px solid var(--border-color);
}

.user-dialog >>> .el-dialog__header {
  background: var(--search-bg);
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-secondary);
}

.user-dialog >>> .el-dialog__title {
  color: var(--text-primary);
  font-size: var(--title-font-size);
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.user-dialog >>> .el-dialog__body {
  padding: 24px;
}

.dialog-form >>> .el-form-item__label {
  color: var(--text-primary);
  font-weight: 500;
  font-size: var(--label-font-size);
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn {
  background: var(--hover-bg);
  border: 1px solid var(--border-secondary);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: var(--button-padding);
  font-weight: 500;
  font-size: var(--button-font-size);
}

.cancel-btn:hover {
  background: var(--search-bg);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.confirm-btn {
  background: var(--primary-gradient);
  border: none;
  border-radius: 8px;
  padding: var(--button-padding);
  font-weight: 500;
  font-size: var(--button-font-size);
  box-shadow: 0 1px 4px var(--button-shadow);
}

.confirm-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--button-shadow);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .page-container {
    padding: 8px 4px; /* 移动端减少内边距 */
  }

  .main-card {
    margin-left: 4px;
    padding: 16px;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-item {
    width: 100%;
  }

  .search-input,
  .search-select {
    width: 100%;
  }

  .table-container {
    overflow-x: auto;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
    min-width: 80px;
  }

  .action-btn .btn-text {
    display: inline; /* 移动端显示文字 */
  }

  .action-btn {
    width: 100%;
    min-width: auto;
  }
}
</style>
