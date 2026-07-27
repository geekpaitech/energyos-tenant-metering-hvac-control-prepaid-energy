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
                  :placeholder="`请输入${field.label}`"
                  clearable
                  size="small"
                />
                <!-- 选择框 - 租户选择 -->
                <el-select
                  v-else-if="field.type === 'select' && field.prop === 'tenantName'"
                  v-model="queryData[field.prop]"
                  placeholder="请选择租户"
                  clearable
                  size="small"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="tenant in tenantList"
                    :key="tenant.id"
                    :label="`${tenant.id}(${tenant.name})`"
                    :value="tenant.id"
                  >
                    <span style="font-size: 12px">
                      {{ tenant.id }}({{ tenant.name }})
                    </span>
                  </el-option>
                </el-select>
                <!-- 选择框 - 审核状态 -->
                <el-select
                  v-else-if="field.type === 'select' && field.prop === 'status'"
                  v-model="queryData[field.prop]"
                  placeholder="请选择审核状态"
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in balanceRefundStatus"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <!-- 日期范围选择 -->
                <el-date-picker
                  v-else-if="field.type === 'daterange'"
                  v-model="queryData[field.prop]"
                  type="daterange"
                  value-format="yyyy-MM-dd"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 操作按钮行 -->
          <div class="form-actions compact-actions">
            <div class="action-left">
              <!-- 预留左侧按钮区域 -->
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
              <el-divider
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
          ref="table"
          :max-height="tableMaxHeight"
          v-loading="loading"
          :data="tableData"
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

          <!-- 流水号 -->
          <el-table-column
            prop="rid"
            label="流水号"
            width="180"
            align="center"
            show-overflow-tooltip
          />

          <!-- 申请日期 -->
          <el-table-column
            prop="applyTime"
            label="申请日期"
            width="160"
            align="center"
            show-overflow-tooltip
          />

          <!-- 审核日期 -->
          <el-table-column
            prop="processTime"
            label="审核日期"
            width="160"
            align="center"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              {{ scope.row.processTime || '-' }}
            </template>
          </el-table-column>

          <!-- 租户ID -->
          <el-table-column
            prop="tenantId"
            label="租户ID"
            width="120"
            align="center"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <span class="text-primary">{{ scope.row.tenantId || '-' }}</span>
            </template>
          </el-table-column>

          <!-- 租户名 -->
          <el-table-column
            prop="tenantName"
            label="租户名"
            min-width="150"
            align="center"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <el-link type="primary" @click="handleTenantDetail(scope.row)">
                <i class="el-icon-user"></i>
                {{ scope.row.tenantName || '-' }}
              </el-link>
            </template>
          </el-table-column>

          <!-- 申请金额 -->
          <el-table-column
            prop="applyAmt"
            label="申请金额"
            width="120"
            align="center"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <span class="amount-text">
                {{ formatMoney(scope.row.applyAmt) }}
              </span>
            </template>
          </el-table-column>

          <!-- 实际金额 -->
          <el-table-column
            prop="actualAmt"
            label="实际金额"
            width="120"
            align="center"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <span class="amount-text">
                {{ formatMoney(scope.row.actualAmt) }}
              </span>
            </template>
          </el-table-column>

          <!-- 审核状态 -->
          <el-table-column
            prop="refundStatus"
            label="审核状态"
            width="120"
            align="center"
          >
            <template slot-scope="scope">
              <el-tag
                v-if="scope.row.refundStatus === 0"
                type="warning"
                size="small"
                effect="plain"
              >
                待审核
              </el-tag>
              <el-tag
                v-else-if="scope.row.refundStatus === 1"
                type="success"
                size="small"
                effect="plain"
              >
                已通过
              </el-tag>
              <el-tag
                v-else-if="scope.row.refundStatus === 2"
                type="danger"
                size="small"
                effect="plain"
              >
                已拒绝
              </el-tag>
              <el-tag
                v-else-if="scope.row.refundStatus === 3"
                type="info"
                size="small"
                effect="plain"
              >
                已打款
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column
            label="操作"
            width="150"
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <div class="table-actions-group">
                <el-button
                  v-if="scope.row.refundStatus === 0"
                  type="text"
                  size="small"
                  @click="handleAudit(scope.row)"
                >
                  审核
                </el-button>
                <el-divider
                  v-if="scope.row.refundStatus === 0"
                  direction="vertical"
                ></el-divider>
                <el-button
                  type="text"
                  size="small"
                  @click="handleDetail(scope.row)"
                >
                  详情
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空数据提示 -->
        <div v-if="!loading && tableData.length === 0" class="empty-data">
          <i class="el-icon-data-analysis" style="font-size: 48px; color: #909399;"></i>
          <p style="color: #909399; margin-top: 16px;">暂无数据</p>
        </div>
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
  </div>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'
import { tenantRefundPageRefundRecord } from '@/api/tenantRefund'
import { tenantPageTenant } from '@/api/tenant'

// 审核状态枚举
const balanceRefundStatus = [
  { value: 0, label: '待审核' },
  { value: 1, label: '已通过' },
  { value: 2, label: '已拒绝' },
  { value: 3, label: '已打款' }
]

export default {
  name: 'RefundAudit',
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
        tenantName: '',
        tenantId: '',
        status: '',
        managerId: '',
        timeRange: []
      },
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: 'tenantId', label: '租户ID', type: 'input' },
          { prop: 'tenantName', label: '租户名', type: 'select', filterable: true },
          { prop: 'status', label: '审核状态', type: 'select' },
          { prop: 'timeRange', label: '申请日期', type: 'daterange' }
        ],
        advanced: []
      },
      // 表格数据
      tableData: [],
      // 加载状态
      loading: false,
      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      // 选中的数据
      selectedData: [],
      // 审核状态枚举
      balanceRefundStatus,
      // 租户列表
      tenantList: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    // 显示的基础搜索字段
    displayBasicFields () {
      return this.searchFields.basic
    },
    // 表格最大高度
    tableMaxHeight () {
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
          this.getTenantList()
          this.fetchTableData()
        }
      },
      immediate: true
    }
  },
  created () {
    // 初始化
    this.init()
  },
  methods: {
    // 初始化
    init () {
      // 设置管理方ID
      if (this.currentManagerId) {
        this.queryData.managerId = this.currentManagerId
      }
      // 获取数据
      this.fetchTableData()
    },

    // 获取租户列表
    async getTenantList () {
      try {
        const params = {
          tenantStatus: 0,
          managerId: this.currentManagerId
        }
        const response = await tenantPageTenant(params)

        if (response.code === 200 && response.data) {
          this.tenantList = response.data.dataList || []
        } else {
          this.$message.error(response.msg || '获取租户列表失败')
          this.tenantList = []
        }
      } catch (error) {
        console.error('获取租户列表失败:', error)
        this.$message.error('获取租户列表失败')
        this.tenantList = []
      }
    },

    // 获取表格数据
    async fetchTableData () {
      this.loading = true
      try {
        const params = {
          type: 0,
          endDate: this.queryData.timeRange ? this.queryData.timeRange[1] : '',
          startDate: this.queryData.timeRange ? this.queryData.timeRange[0] : '',
          managerId: this.queryData.managerId,
          tenantId: this.queryData.tenantId || this.queryData.tenantName,
          refundStatus: this.queryData.status,
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            orders: [
              {
                asc: false,
                column: 'applyTime'
              }
            ]
          }
        }

        const response = await tenantRefundPageRefundRecord(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
          this.pageData.current = response.data.current || 1
        } else {
          this.$message.error(response.msg || '获取数据失败')
          this.tableData = []
        }
      } catch (error) {
        this.$message.error('获取退款数据失败')
        console.error('获取退款数据失败:', error)
        this.tableData = []
      } finally {
        this.loading = false
      }
    },

    // 格式化金额
    formatMoney (value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return `¥${parseFloat(value).toFixed(2)}`
    },

    // 查询
    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset () {
      this.queryData = {
        tenantName: '',
        tenantId: '',
        status: '',
        managerId: this.currentManagerId || '',
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ]
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

    // 导出
    handleExport () {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }

      // 导出功能
      const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData

      // 构建导出数据
      const params = {
        ele: this.$refs.table?.$el,
        name: '退费审核.xlsx',
        data: exportData
      }

      // 调用导出方法
      if (this.$store && this.$store.dispatch) {
        this.$store.dispatch('export/export', params)
      } else {
        this.$message.info('导出功能开发中...')
      }
    },

    // 审核
    handleAudit (row) {
      // 检查权限
      if (!this.checkPermission('140031')) {
        this.$message.warning('暂无审核权限')
        return
      }

      // 打开审核弹窗或跳转审核页面
      this.$message.info('审核功能开发中...')

      // 示例：可以使用弹窗或路由跳转
      // this.$router.push({
      //   path: '/refund-audit-detail',
      //   query: { id: row.rid, type: 'audit' }
      // })
    },

    // 详情
    handleDetail (row) {
      // 检查权限
      if (!this.checkPermission('140032')) {
        this.$message.warning('暂无查看详情权限')
        return
      }

      // 打开详情弹窗或跳转详情页面
      this.$message.info('详情功能开发中...')

      // 示例：可以使用弹窗或路由跳转
      // this.$router.push({
      //   path: '/refund-audit-detail',
      //   query: { id: row.rid, type: 'detail' }
      // })
    },

    // 查看租户详情
    handleTenantDetail (row) {
      this.$router.push({
        name: 'TenantDetail', // 使用路由名称
        params: { id: row.tenantId }, // 使用 params 传递动态路由参数
        query: {
          // 可选：传递额外的查询参数
          name: row.name,
          from: 'list'
        }
      })
    },

    // 权限检查（简化版，实际应根据项目权限系统实现）
    checkPermission (permissionId) {
      // 这里应该调用实际的权限检查方法
      // return this.$store.getters['user/hasPermission'](permissionId)
      return true // 暂时返回true，实际项目中需要完善
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

// 自定义样式补充
.amount-text {
  font-weight: 500;
  color: #303133;

  &.text-danger {
    color: #F56C6C;
  }
}

.text-primary {
  color: #409EFF;
}

.empty-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.table-actions-group {
  display: flex;
  align-items: center;
  justify-content: center;

  .el-divider--vertical {
    height: 12px;
    margin: 0 8px;
  }
}
</style>
