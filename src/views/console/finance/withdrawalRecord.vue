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
          <!-- 基础筛选 -->
          <el-row :gutter="16" class="search-row">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="审核日期" prop="timeRange" class="compact-form-item">
                <el-date-picker
                  v-model="queryData.timeRange"
                  type="daterange"
                  value-format="yyyy-MM-dd"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="提现进度" prop="status" class="compact-form-item">
                <el-select
                  v-model="queryData.status"
                  placeholder="请选择"
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="全部" value="" />
                  <el-option
                    v-for="item in WithdSchedule"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 操作按钮行 -->
          <div class="form-actions compact-actions">
            <div class="action-left">
              <el-button
                type="primary"
                icon="el-icon-document"
                size="small"
                @click="handleInvoice"
              >
                手续费开票
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
            </div>
          </div>
        </el-form>
      </el-card>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-container">
      <div class="table-card" shadow="never">
        <!-- 数据表格 -->
        <el-table
          v-loading="loading"
          :data="tableData"
          :max-height="tableMaxHeight"
          stripe
          style="width: 100%"
          class="custom-table"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <!-- 申请日期 -->
          <el-table-column
            prop="createTime"
            label="申请日期"
            width="160"
            align="center"
            show-overflow-tooltip
          />

          <!-- 审核日期 -->
          <el-table-column
            prop="updateTime"
            label="审核日期"
            width="160"
            align="center"
            show-overflow-tooltip
          />

          <!-- 结算金额 -->
          <el-table-column
            prop="settleAmt"
            label="结算金额"
            min-width="120"
            align="center"
          >
            <template slot-scope="scope">
              <span class="amount-text">
                ￥{{ formatAmount(scope.row.settleAmt) }}
              </span>
            </template>
          </el-table-column>

          <!-- 实际结算金额 -->
          <el-table-column
            prop="managerBalance"
            label="实际结算金额"
            min-width="140"
            align="center"
          >
            <template slot-scope="scope">
              <span class="amount-text">
                ￥{{ formatAmount(scope.row.managerBalance) }}
              </span>
            </template>
          </el-table-column>

          <!-- 手续费 -->
          <el-table-column
            label="手续费"
            min-width="120"
            align="center"
          >
            <template slot-scope="scope">
              <span class="amount-text">
                ￥{{ formatHandFee(scope.row) }}
              </span>
            </template>
          </el-table-column>

          <!-- 提现金额 -->
          <el-table-column
            label="提现金额"
            min-width="120"
            align="center"
          >
            <template slot-scope="scope">
              <span class="amount-text highlight">
                ￥{{ formatWithdrawAmount(scope.row) }}
              </span>
            </template>
          </el-table-column>

          <!-- 操作人 -->
          <el-table-column
            prop="userName"
            label="操作人"
            min-width="100"
            align="center"
          >
            <template slot-scope="scope">
              {{ scope.row.userName || "-" }}
            </template>
          </el-table-column>

          <!-- 提现进度 -->
          <el-table-column
            prop="status"
            label="提现进度"
            min-width="120"
            align="center"
          >
            <template slot-scope="scope">
              <el-tag
                v-if="scope.row.status === 1 || scope.row.status === 4"
                type="warning"
                size="small"
                effect="plain"
              >
              审核中
              </el-tag>
              <el-tag
                v-else-if="scope.row.status === 2"
                type="success"
                size="small"
                effect="plain"
              >
              已完成
              </el-tag>
              <el-tag
                v-else-if="scope.row.status === 3 ||scope.row.status === 7"
                type="danger"
                size="small"
                effect="plain"
              >
              已拒绝
              </el-tag>
              <el-tag
                v-else-if="scope.row.status === 5 || scope.row.status === 6"
                type="success"
                size="small"
              >
              待支付
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column
            label="操作"
            width="120"
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <el-button
                type="text"
                size="small"
                icon="el-icon-view"
                @click="handleDetail(scope.row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空数据提示 -->
        <div v-if="!loading && tableData.length === 0" class="empty-data">
          <i class="el-icon-folder-opened"></i>
          <p>暂无数据</p>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="pageData.total > 0">
      <el-pagination
        :current-page="pageData.current"
        :page-sizes="[20, 30, 50, 100]"
        :page-size="pageData.size"
        :total="pageData.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <WithdrawDetail
      v-if="detailDrawer.show"
      :detail-drawer="detailDrawer"
      @close="handleDetailClose"
      @refresh="fetchTableData"
    />
  </div>
</template>

<script>
// 导入API
import {
  capitalPageWithdApplyPassRecord
} from '@/api/withdraw'

// 导入枚举
import {
  WithdSchedule,
  WithdType,
  DepositType,
  getEnumLabel
} from '@/utils/enums/withdraw'

// 导入组件
import WithdrawDetail from './components/WithdrawDetail.vue'

import { mapGetters } from 'vuex'

export default {
  name: 'WithdrawRecord',
  components: {
    WithdrawDetail
  },
  data() {
    return {
      // 表格高度配置
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68,
      },
      // 查询参数
      queryData: {
        timeRange: ['', ''],
        status: ''
      },
      // 表格数据
      tableData: [],
      // 加载状态
      loading: false,
      // 分页数据
      pageData: {
        current: 1,
        size: 20,
        total: 0
      },
      // 详情弹窗
      detailDrawer: {
        show: false,
        id: '',
        managerId: '',
        rid: '',
        data: {}
      },
      // 枚举数据
      WithdSchedule,
      WithdType,
      DepositType
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    // 动态计算表格高度
    tableMaxHeight() {
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    }
  },
  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.fetchTableData()
        }
      },
      immediate: true
    }
  },
  created() {
    // 组件创建时初始化数据
    if (this.currentManagerId) {
      this.fetchTableData()
    }
  },
  mounted() {
    // 如果 created 时没有 managerId，mounted 时再检查一次
    if (!this.tableData.length && this.currentManagerId) {
      this.fetchTableData()
    }
  },
  methods: {
    // 获取表格数据
    async fetchTableData() {
      if (!this.currentManagerId) return
      
      this.loading = true
      try {
        const params = {
          managerId: this.currentManagerId,
          auditStartDate: this.queryData.timeRange[0] || '',
          auditEndDate: this.queryData.timeRange[1] || '',
          statusList: this.queryData.status !== '' ? [this.queryData.status] : [],
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            searchCount: true,
            orders: [
              {
                asc: false,
                column: 'createTime'
              }
            ]
          }
        }

        const response = await capitalPageWithdApplyPassRecord(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || '获取数据失败')
          this.tableData = []
          this.pageData.total = 0
        }
      } catch (error) {
        this.$message.error('获取提现记录失败')
        console.error('获取提现记录失败:', error)
        this.tableData = []
        this.pageData.total = 0
      } finally {
        this.loading = false
      }
    },

    // 格式化金额
    formatAmount(amount) {
      if (amount === null || amount === undefined) return '0.00'
      return parseFloat(amount).toFixed(2)
    },

    // 格式化手续费
    formatHandFee(row) {
      if (row.managerBalance > row.settleAmt) {
        return this.formatAmount(row.handFeeAmt)
      }
      return this.formatAmount(row.managerHandFeeAmt)
    },

    // 格式化提现金额
    formatWithdrawAmount(row) {
      if (row.managerBalance > row.settleAmt) {
        return this.formatAmount(row.withdrawAmt)
      }
      return this.formatAmount(row.finalWithdrawAmt)
    },

    // 查询
    handleSearch() {
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset() {
      this.queryData = {
        timeRange: ['', ''],
        status: ''
      }
      this.handleSearch()
    },

    // 手续费开票
    handleInvoice() {
      this.$router.push({ 
        path: '/expense-monthlyBill', 
        query: { type: 2 }
      })
    },

    // 查看详情
    handleDetail(row) {
      this.detailDrawer = {
        show: true,
        id: row.withdApplyIds,
        managerId: row.managerId,
        rid: row.id,
        data: row
      }
    },

    // 关闭详情
    handleDetailClose() {
      this.detailDrawer.show = false
    },

    // 分页大小变化
    handleSizeChange(val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 当前页变化
    handleCurrentChange(val) {
      this.pageData.current = val
      this.fetchTableData()
    }
  }
}
</script>

<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";

// 自定义样式
.amount-text {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-weight: 500;
  color: #303133;
  
  &.highlight {
    color: #409EFF;
    font-weight: 600;
  }
}

.empty-data {
  padding: 80px 0;
  text-align: center;
  color: #909399;
  
  i {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  p {
    font-size: 14px;
  }
}
</style>