<template>
    <div class="table-page-container">
      <!-- 搜索区域 -->
      <div class="search-container">
        <el-card class="search-card" shadow="never">
          <el-form
            :model="queryData"
            ref="searchForm"
            class="search-form compact-form"
            label-position="left"
            label-width="80px"
          >
            <!-- 基础筛选 - 动态渲染 -->
            <el-row :gutter="16" class="search-row">
              <el-col
                v-for="field in displayBasicFields"
                :key="field.prop"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
              >
                <el-form-item
                  :label="field.label"
                  :prop="field.prop"
                  class="compact-form-item"
                >
                  <!-- 输入框 -->
                  <el-input
                    v-if="field.type === 'input'"
                    v-model="queryData[field.prop]"
                    placeholder="请输入"
                    clearable
                    size="small"
                  />
                  <!-- 选择框 -->
                  <el-select
                    v-else-if="field.type === 'select'"
                    v-model="queryData[field.prop]"
                    placeholder="请选择"
                    clearable
                    size="small"
                    style="width: 100%"
                  >
                    <!-- 状态选项 -->
                    <template v-if="field.prop === 'status'">
                      <el-option label="全部" value="" />
                      <el-option label="启用" value="1" />
                      <el-option label="禁用" value="0" />
                    </template>
                    <!-- 类型选项 -->
                    <template v-else-if="field.prop === 'type'">
                      <el-option label="全部" value="" />
                      <el-option label="7W" value="7w" />
                      <el-option label="21W" value="21w" />
                    </template>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 高级筛选 - 只在需要时显示 -->
            <el-collapse-transition v-if="needAdvancedSearch">
              <el-row :gutter="16" v-show="showAdvanced" class="search-row">
                <!-- 高级筛选内容为空 -->
              </el-row>
            </el-collapse-transition>

            <!-- 操作按钮行 - 更合理的布局 -->
            <div class="form-actions compact-actions">
              <div class="action-left">
                <el-button
                  type="primary"
                  icon="el-icon-plus"
                  size="small"
                  @click="handleAdd"
                >
                  新增编码
                </el-button>
              </div>
              <div class="action-right">
                <el-button
                  type="primary"
                  icon="el-icon-search"
                  size="small"
                  @click="handleSearch"
                >
                  查询
                </el-button>
                <el-button
                  icon="el-icon-refresh"
                  size="small"
                  @click="handleReset"
                >
                  重置
                </el-button>
                <el-button
                  v-if="needAdvancedSearch"
                  type="text"
                  size="small"
                  @click="showAdvanced = !showAdvanced"
                  style="padding: 7px 8px"
                >
                  <i class="el-icon-s-operation" style="margin-right: 4px"></i>
                  高级筛选
                  <i
                    :class="
                      showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
                    "
                    style="margin-left: 2px"
                  ></i>
                </el-button>
                <el-divider
                  v-if="needAdvancedSearch"
                  direction="vertical"
                  style="margin: 0 8px"
                ></el-divider>
                <el-dropdown trigger="click" @command="handleCommand">
                  <el-button size="small" type="text" style="padding: 7px 12px">
                    更多操作 <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="export" icon="el-icon-download">
                      导出数据
                    </el-dropdown-item>
                    <el-dropdown-item command="import" icon="el-icon-upload2">
                      导入数据
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="batch"
                      icon="el-icon-s-operation"
                      divided
                    >
                      批量操作
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
            </div>
          </el-form>
        </el-card>
      </div>

      <!-- 数据表格区域 -->
      <div class="table-container">
        <div class="table-card" shadow="never">
          <!-- 表格工具栏 -->
          <div class="table-toolbar" v-if="selectedData.length > 0">
            <div class="toolbar-left">
              <span class="selection-info">
                已选择 <span class="count">{{ selectedData.length }}</span> 条数据
              </span>
            </div>
          </div>

          <!-- 数据表格 -->
          <el-table
            v-loading="loading"
            :data="tableData"
            :max-height="tableMaxHeight"
            stripe
            style="width: 100%"
            class="custom-table"
            @selection-change="handleSelectionChange"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <el-table-column type="selection" width="55" align="center" />

            <!-- 按照tableKey配置显示列 -->
            <el-table-column
              v-for="col in displayColumns"
              :key="col.key"
              :prop="col.key"
              :label="col.label"
              :width="col.width"
              :min-width="col.minWidth"
              :align="col.align || 'center'"
              :show-overflow-tooltip="true"
            >
              <template slot-scope="scope">
                <!-- 编码 -->
                <template v-if="col.key === 'code'">
                  <span style="color: #000; font-weight: 500;">
                    {{ scope.row.code || "-" }}
                  </span>
                </template>

                <!-- 状态 -->
                <template v-else-if="col.key === 'statusLabel'">
                  <el-tag
                    :type="scope.row.status == 1 ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ scope.row.status == 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>

                <!-- 类型 -->
                <template v-else-if="col.key === 'typeLabel'">
                  <el-tag
                    :type="scope.row.type === '7w' ? 'primary' : 'warning'"
                    size="small"
                  >
                    {{ scope.row.type === '7w' ? '7W' : '21W' }}
                  </el-tag>
                </template>

                <!-- 默认显示 -->
                <template v-else>
                  {{ scope.row[col.key] || "-" }}
                </template>
              </template>
            </el-table-column>

            <!-- 操作列 -->
            <el-table-column
              label="操作"
              width="210"
              fixed="right"
              align="center"
            >
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  icon="el-icon-edit"
                  @click="handleEdit(scope.row)"
                  style="padding: 1px 2px; font-size: 11px; min-width: auto;"
                >
                  编辑
                </el-button>
                <el-button
                  type="text"
                  size="mini"
                  class="text-danger"
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                  style="padding: 1px 2px; font-size: 11px; min-width: auto;"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
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

      <!-- 编辑弹窗 -->
      <el-dialog
        :title="editForm.id ? '编辑编码' : '新增编码'"
        :visible.sync="dialogVisible"
        width="680px"
        :close-on-click-modal="false"
        class="custom-dialog"
      >
        <el-form
          ref="editForm"
          :model="editForm"
          :rules="rules"
          label-width="100px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="编码" prop="code">
                <el-input
                  v-model="editForm.code"
                  placeholder="请输入编码"
                  :disabled="!!editForm.id"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="类型" prop="type">
                <el-select
                  v-model="editForm.type"
                  placeholder="请选择类型"
                  style="width: 100%"
                >
                  <el-option label="7W" value="7w" />
                  <el-option label="21W" value="21w" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="状态" prop="status">
                <el-radio-group v-model="editForm.status">
                  <el-radio :label="1">启用</el-radio>
                  <el-radio :label="0">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSave">
            {{ submitting ? "保存中..." : "确 定" }}
          </el-button>
        </span>
      </el-dialog>
    </div>
  </template>

<script>
// 模拟API方法
const mockApi = {
  // 获取编码列表
  getCodeList: (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = []
        for (let i = 1; i <= 20; i++) {
          const type = Math.random() > 0.5 ? '7w' : '21w'
          const status = Math.random() > 0.3 ? 1 : 0

          mockData.push({
            id: i,
            code: `CODE${String(i).padStart(6, '0')}`,
            status: status,
            type: type,
            createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }),
            updateTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
          })
        }
        resolve({
          code: 200,
          data: {
            dataList: mockData,
            total: 300
          }
        })
      }, 500)
    })
  }
}

export default {
  name: 'CodeManagement',
  data () {
    return {
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68
      },
      // 查询参数
      queryData: {
        code: '',
        status: '',
        type: ''
      },
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: 'code', label: '编码', type: 'input' },
          { prop: 'status', label: '状态', type: 'select' },
          { prop: 'type', label: '类型', type: 'select' }
        ],
        advanced: []
      },
      // 表格数据
      tableData: [],
      // 加载状态
      loading: false,
      submitting: false,
      // 是否显示高级筛选
      showAdvanced: false,
      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      // 选中的数据
      selectedData: [],
      // 编辑弹窗
      dialogVisible: false,
      // 编辑表单
      editForm: {
        id: '',
        code: '',
        status: 1,
        type: ''
      },
      // 表单验证规则
      rules: {
        code: [
          { required: true, message: '请输入编码', trigger: 'blur' },
          { min: 3, max: 20, message: '编码长度为3-20个字符', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ],
        type: [
          { required: true, message: '请选择类型', trigger: 'change' }
        ]
      },
      // 表格列配置
      tableKey: [
        {
          label: '编码',
          key: 'code',
          checked: true,
          disabled: true
        },
        {
          label: '状态',
          key: 'statusLabel',
          checked: true
        },
        {
          label: '类型',
          key: 'typeLabel',
          checked: true
        },
        {
          label: '创建时间',
          key: 'createTime',
          checked: true
        },
        {
          label: '更新时间',
          key: 'updateTime',
          checked: true
        }
      ]
    }
  },
  computed: {
    dataLength () {
      return this.tableData.length
    },
    // 计算需要显示的列
    displayColumns () {
      return this.tableKey.filter((col) => col.checked !== false)
    },
    // 判断是否需要显示高级筛选按钮
    needAdvancedSearch () {
      const totalFields =
          this.searchFields.basic.length + this.searchFields.advanced.length
      return totalFields > 5
    },
    // 获取实际显示的基础搜索字段
    displayBasicFields () {
      if (!this.needAdvancedSearch) {
        return [...this.searchFields.basic, ...this.searchFields.advanced]
      }
      return this.searchFields.basic
    },
    // 获取高级搜索字段
    displayAdvancedFields () {
      return this.searchFields.advanced
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
    },
    tableMaxHeight () {
      return (
        this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    }
  },
  mounted () {
    this.fetchTableData()
  },

  methods: {
    // 获取编码列表数据
    async fetchTableData () {
      this.loading = true
      try {
        const params = {
          code: this.queryData.code,
          status: this.queryData.status,
          type: this.queryData.type,
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            orders: [{ asc: false, column: 'createTime' }]
          }
        }

        const response = await mockApi.getCodeList(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || '获取数据失败')
        }
      } catch (error) {
        this.$message.error('获取编码数据失败')
        console.error('获取编码数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 查询
    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset () {
      this.queryData = {
        code: '',
        status: '',
        type: ''
      }
      this.showAdvanced = false
      this.handleSearch()
    },

    // 处理顶部下拉命令
    handleCommand (command) {
      switch (command) {
        case 'export':
          this.handleExport()
          break
        case 'import':
          this.$message.info('导入功能开发中...')
          break
        case 'batch':
          this.$message.info('批量操作功能开发中...')
          break
      }
    },

    // 新增编码
    handleAdd () {
      this.editForm = {
        id: '',
        code: '',
        status: 1,
        type: ''
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },

    // 编辑编码
    handleEdit (row) {
      this.editForm = {
        id: row.id,
        code: row.code,
        status: row.status,
        type: row.type
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },

    // 保存
    async handleSave () {
      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          this.submitting = true
          try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000))

            // 检查编码是否重复（新增时）
            if (!this.editForm.id) {
              const existCode = this.tableData.find(item => item.code === this.editForm.code)
              if (existCode) {
                this.$message.error('编码已存在，请使用其他编码')
                this.submitting = false
                return
              }
            }

            this.$message.success(this.editForm.id ? '修改成功' : '新增成功')
            this.dialogVisible = false
            this.fetchTableData()
          } catch (error) {
            this.$apiError.notify(error, '操作失败')
            console.error('保存失败:', error)
          } finally {
            this.submitting = false
          }
        }
      })
    },

    // 删除编码
    handleDelete (row) {
      this.$confirm(`确定要删除编码"${row.code}"吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟API调用
        setTimeout(() => {
          this.$message.success('删除成功')
          this.fetchTableData()
        }, 300)
      }).catch(() => {
        // 用户取消操作
      })
    },

    // 导出数据
    handleExport () {
      if (this.selectedData.length === 0) {
        this.$message.warning('请先选择要导出的数据')
        return
      }
      this.$message.info('导出功能开发中...')
    },

    // 选择变化
    handleSelectionChange (selection) {
      this.selectedData = selection
    },

    // 分页大小变化
    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 当前页变化
    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    }
  }
}
</script>

  <style lang="scss" scoped>
  // 引入表格页面公共样式
  @import "@/assets/styles/table-page.scss";

  // 额外样式
  .text-danger {
    color: #F56C6C !important;
  }
  </style>
