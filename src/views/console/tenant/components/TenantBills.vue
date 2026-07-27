<template>
  <div class="tenant-bills-wrapper">
    <!-- 查询条件 -->
    <div class="search-form">
      <el-form :model="billForm" inline size="small">
        <el-form-item label="日期范围">
          <el-date-picker v-model="billDateRange" type="daterange" range-separator="-" start-placeholder="开始日期"
            end-placeholder="结束日期" format="yyyy-MM-dd" value-format="yyyy-MM-dd"    :picker-options="datePickerOptions"  @change="onQueryChange" />
        </el-form-item>
        <el-form-item label="费用类型">
          <el-select v-model="billForm.useType" placeholder="全部" clearable style="width: 180px" @change="fetchBillData">
            <el-option label="电费" value="2" />
            <el-option label="水费" value="0" />
            <el-option label="服务费" value="7" />
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="支付状态">
          <el-select v-model="billForm.payStatus" placeholder="全部" clearable style="width: 100px">
            <el-option label="全部" value="" />
            <el-option label="未支付" :value="0" />
            <el-option label="已支付" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="提现状态">
          <el-select v-model="billForm.withdrawStatus" placeholder="全部" clearable style="width: 100px">
            <el-option label="全部" value="" />
            <el-option label="未提现" :value="0" />
            <el-option label="已提现" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item> -->
          <!-- <el-button type="primary" @click="fetchBillData">查询</el-button>
          <el-button @click="resetBillForm">重置</el-button> -->
        <!-- </el-form-item> -->
      </el-form>
    </div>

    <!-- 统计卡片区域 -->
    <div class="statistics-container">
      <el-card class="statistics-card" shadow="never">
        <div class="statistics-wrapper">
          <!-- 电费 -->
          <el-tooltip placement="bottom" :disabled="!hasElectricityDetail" popper-class="statistics-tooltip">
            <div slot="content">
              <div class="tooltip-item">
                <span class="tooltip-label">表计电费：</span>
                <span class="tooltip-value">¥{{ formatAmount(statisticsData.表计电费) }}</span>
              </div>
              <div class="tooltip-item">
                <span class="tooltip-label">其他电费：</span>
                <span class="tooltip-value">¥{{ formatAmount(statisticsData.其他电费) }}</span>
              </div>
              <div class="tooltip-divider"></div>
              <div class="tooltip-item tooltip-total">
                <span class="tooltip-label">合计：</span>
                <span class="tooltip-value">¥{{ getElectricityTotal }}</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon electricity">
                <i class="iconfont  icon-dianbiao"></i>
              </div>
              <div class="stat-content">
                <div class="stat-label">电费(元)</div>
                <div class="stat-value">{{ getElectricityTotal }}</div>
              </div>
            </div>
          </el-tooltip>

          <!-- 水费 -->
          <el-tooltip placement="bottom" :disabled="!hasWaterDetail" popper-class="statistics-tooltip">
            <div slot="content">
              <div class="tooltip-item">
                <span class="tooltip-label">表计水费：</span>
                <span class="tooltip-value">¥{{ formatAmount(statisticsData.表计水费) }}</span>
              </div>
              <div class="tooltip-item">
                <span class="tooltip-label">其他水费：</span>
                <span class="tooltip-value">¥{{ formatAmount(statisticsData.其他水费) }}</span>
              </div>
              <div class="tooltip-divider"></div>
              <div class="tooltip-item tooltip-total">
                <span class="tooltip-label">合计：</span>
                <span class="tooltip-value">¥{{ getWaterTotal }}</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon water">
                <i class="iconfont  icon-shuibiao"></i>
              </div>
              <div class="stat-content">
                <div class="stat-label">水费(元)</div>
                <div class="stat-value">{{ getWaterTotal }}</div>
              </div>
            </div>
          </el-tooltip>

          <!-- 服务费 -->
          <div class="stat-item">
            <div class="stat-icon other">
              <i class="el-icon-s-data"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">服务费(元)</div>
              <div class="stat-value">{{ getServiceFeeTotal }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 账单列表 -->
    <div class="table-wrapper">
      <el-table :data="billList"  v-loading="billLoading" border size="small" :height="tableHeight" :header-cell-style="{
  background: '#f5f7fa',
  color: '#606266',
  fontWeight: '600',
}">
        <el-table-column prop="occurDate" label="账单日期" align="center" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="140" />
        <el-table-column prop="useType" label="费用类型" align="center">
          <template slot-scope="scope">
            <span>{{ getBillTypeLabel(scope.row.useType) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="settleWay" label="账单类型" align="center">
          <template slot-scope="scope">
            <el-tag :type="getSettleWayType(scope.row.settleWay)" size="small" effect="plain">
              {{ getSettleWayLabel(scope.row.settleWay) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="账单金额" align="right">
          <template slot-scope="scope">
            <span class="amount-highlight">
              {{ formatBalance(scope.row.balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="payStatus" label="缴费状态" align="center">
          <template slot-scope="scope">
            <div class="status-wrapper">
              <span class="status-dot"
                :style="{ backgroundColor: scope.row.payStatus === 1 ? '#67C23A' : '#909399' }"></span>
              {{ scope.row.payStatus === 1 ? "已缴费" : "未缴费" }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="抵扣金支付(元)" align="right">
          <template slot-scope="scope">
            <span>{{ formatBalance(scope.row.discountAmt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="现金支付(元)" align="right">
          <template slot-scope="scope">
            <span>{{ formatBalance(scope.row.realAmt) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="开票状态" align="center">
          <template slot-scope="scope">
            <div class="status-wrapper">
              <span class="status-dot" :style="{ backgroundColor: getInvoiceStatusColor(scope.row.status) }"></span>
              {{ getInvoiceStatusLabel(scope.row.status) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作">
          <template slot-scope="scope">
            <el-button type="text" size="small" icon="el-icon-view" @click="handleDetail(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination @size-change="handleBillSizeChange" @current-change="handleBillCurrentChange"
        :current-page="billForm.page.current" :page-sizes="[20, 30, 50, 100]" :page-size="billForm.page.size"
        :total="billTotal" layout="total, sizes, prev, pager, next, jumper" small />
    </div>

    <!-- 详情抽屉 - 复用现有组件 -->
    <BillDetailDrawer :detailDrawer="detailDrawer" />
  </div>
</template>

<script>
import { getBillList } from '@/api/tenantDetail'
import { settleSettleTenantStatistics } from '@/api/settle'
import BillDetailDrawer from '@/views/console/bill/components/BillDetailDrawer.vue'

export default {
  name: 'TenantBills',
  components: {
    BillDetailDrawer
  },
  props: {
    tenantId: {
      type: [String, Number],
      required: true
    },
    managerId: {
      type: [String, Number],
      default: ''
    }
  },
  data () {
    return {
      datePickerOptions: {
        shortcuts: [
          {
            text: '最近7天',
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 6)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近15天',
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 14)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近30天',
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '本月',
            onClick (picker) {
              const start = new Date()
              start.setDate(1)
              start.setHours(0, 0, 0, 0)
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '上月',
            onClick (picker) {
              const start = new Date()
              start.setMonth(start.getMonth() - 1)
              start.setDate(1)
              start.setHours(0, 0, 0, 0)
              const end = new Date()
              end.setDate(0)
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          }]
      },
      // 账单相关
      billForm: {
        managerId: '',
        tenantId: '',
        startDate: '',
        endDate: '',
        payStatus: '',
        useType: '',
        withdrawStatus: '',
        settleWay: '',
        page: {
          current: 1,
          size: 20,
          orders: [{ asc: false, column: 'createTime' }]
        }
      },
      billDateRange: [],
      billList: [],
      billTotal: 0,
      billLoading: false,
      tableHeight: 400,
      // 统计数据 - 修改为对象结构
      statisticsData: {
        表计电费: 0,
        其他电费: 0,
        表计水费: 0,
        其他水费: 0,
        服务费: 0
      },
      // 详情抽屉 - 与大页面保持一致的数据结构
      detailDrawer: {
        show: false,
        id: '',
        tenantId: '',
        settleWay: '',
        useType: '',
        floatId: ''
      }
    }
  },
  computed: {
    // 计算电费合计
    getElectricityTotal () {
      const meterElec = parseFloat(this.statisticsData.表计电费) || 0
      const otherElec = parseFloat(this.statisticsData.其他电费) || 0
      return (meterElec + otherElec).toFixed(2)
    },
    // 计算水费合计
    getWaterTotal () {
      const meterWater = parseFloat(this.statisticsData.表计水费) || 0
      const otherWater = parseFloat(this.statisticsData.其他水费) || 0
      return (meterWater + otherWater).toFixed(2)
    },
    // 获取服务费
    getServiceFeeTotal () {
      return this.formatAmount(this.statisticsData.服务费)
    },
    // 判断是否有电费详细信息（用于控制tooltip显示）
    hasElectricityDetail () {
      const meterElec = parseFloat(this.statisticsData.表计电费) || 0
      const otherElec = parseFloat(this.statisticsData.其他电费) || 0
      return meterElec > 0 || otherElec > 0
    },
    // 判断是否有水费详细信息（用于控制tooltip显示）
    hasWaterDetail () {
      const meterWater = parseFloat(this.statisticsData.表计水费) || 0
      const otherWater = parseFloat(this.statisticsData.其他水费) || 0
      return meterWater > 0 || otherWater > 0
    }
  },
  mounted () {
    this.initFormData()
    this.fetchBillData()
    this.fetchStatistics()
    this.calculateTableHeight()
    window.addEventListener('resize', this.calculateTableHeight)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.calculateTableHeight)
  },
  methods: {
    // 初始化表单数据
    initFormData () {
      // 初始化时间范围为最近一个月
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      this.billForm.managerId = this.managerId
      this.billForm.tenantId = Number(this.tenantId)
      this.billForm.endDate = endDate
      this.billForm.startDate = startDate
      this.billDateRange = [startDate, endDate]
    },

    // 计算表格高度
    calculateTableHeight () {
      this.$nextTick(() => {
        const wrapper = this.$el
        if (!wrapper) return

        const searchForm = wrapper.querySelector('.search-form')
        const statistics = wrapper.querySelector('.statistics-container')
        const pagination = wrapper.querySelector('.pagination-wrapper')

        const searchHeight = searchForm ? searchForm.offsetHeight : 0
        const statisticsHeight = statistics ? statistics.offsetHeight : 0
        const paginationHeight = pagination ? pagination.offsetHeight : 0
        const wrapperHeight = wrapper.offsetHeight

        // 预留间距
        const spacing = 60
        this.tableHeight = wrapperHeight - searchHeight - statisticsHeight - paginationHeight - spacing
      })
    },

    // 搜索条件变化 - 重置页码并查询
    onQueryChange () {
      this.billForm.page.current = 1
      this.fetchBillData()
    },

    buildBillQueryParams () {
      const params = {
        managerId: this.billForm.managerId,
        tenantId: String(this.billForm.tenantId),
        rid: '',
        payStatus: this.billForm.payStatus,
        withdrawStatus: this.billForm.withdrawStatus,
        settleWay: this.billForm.settleWay,
        status: '',
        startDate: this.billForm.startDate,
        endDate: this.billForm.endDate,
        page: this.billForm.page
      }
      if (this.billForm.useType !== null && this.billForm.useType !== undefined && this.billForm.useType !== '') {
        params.useType = this.billForm.useType
      }
      return params
    },

    // 获取账单数据
    async fetchBillData () {
      this.billLoading = true
      try {
        // 处理日期范围
        if (this.billDateRange && this.billDateRange.length === 2) {
          this.billForm.startDate = this.billDateRange[0]
          this.billForm.endDate = this.billDateRange[1]
        }

        const billResponse = await getBillList(this.buildBillQueryParams())
        if (billResponse.code === 200) {
          this.billList = billResponse.data.dataList || []
          this.billTotal = billResponse.data.total || 0
        }

        // 同时获取统计数据
        await this.fetchStatistics()
      } catch (error) {
        console.error('获取账单数据失败:', error)
        this.$message.error('获取账单数据失败')
      } finally {
        this.billLoading = false
      }
    },

    // 获取统计数据 - 添加settleWay参数
    async fetchStatistics () {
      try {
        const { page, ...params } = this.buildBillQueryParams()
        const response = await settleSettleTenantStatistics(params)
        if (response.code === 200 && response.data) {
          // 直接使用返回的数据对象
          this.statisticsData = {
            表计电费: response.data.表计电费 || 0,
            其他电费: response.data.其他电费 || 0,
            表计水费: response.data.表计水费 || 0,
            其他水费: response.data.其他水费 || 0,
            服务费: response.data.服务费 || 0
          }
        } else {
          // 重置为默认值
          this.statisticsData = {
            表计电费: 0,
            其他电费: 0,
            表计水费: 0,
            其他水费: 0,
            服务费: 0
          }
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        this.statisticsData = {
          表计电费: 0,
          其他电费: 0,
          表计水费: 0,
          其他水费: 0,
          服务费: 0
        }
      }
    },

    // 格式化金额
    formatAmount (value) {
      if (value === null || value === undefined) return '0.00'
      return parseFloat(value).toFixed(2)
    },

    // 重置账单查询表单
    resetBillForm () {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const endDate = new Date().toISOString().split('T')[0]
      this.billForm.useType = ''
      this.billForm.payStatus = ''
      this.billForm.withdrawStatus = ''
      this.billForm.settleWay = ''
      this.billForm.startDate = startDate
      this.billForm.endDate = endDate
      this.billDateRange = [startDate, endDate]
      this.billForm.page.current = 1

      this.fetchBillData()
    },

    // 账单分页 - 每页数量变化
    handleBillSizeChange (size) {
      this.billForm.page.size = size
      this.billForm.page.current = 1
      this.fetchBillData()
    },

    // 账单分页 - 当前页变化
    handleBillCurrentChange (current) {
      this.billForm.page.current = current
      this.fetchBillData()
    },

    // 查看详情 - 与大页面逻辑保持一致
    handleDetail (row) {
      this.detailDrawer.id = row.rid
      this.detailDrawer.tenantId = row.tenantId
      this.detailDrawer.settleWay = row.settleWay
      this.detailDrawer.useType = row.useType
      this.detailDrawer.floatId = row.floatId
      this.detailDrawer.show = true
      console.log('打开详情抽屉,detailDrawer数据:', this.detailDrawer)
    },

    // 获取费用类型标签
    getBillTypeLabel (useType) {
      const typeMap = {
        0: '水费',
        2: '电费',
        7: '服务费'
      }
      return typeMap[useType] || '服务费'
    },

    // 获取账单类型标签
    getSettleWayLabel (way) {
      const labelMap = {
        0: '普通结算',
        1: '手动扣款',
        2: '系统补单',
        3: '浮动电价',
        4: '分摊结算',
        5: '设备扣款',
        10: '租户充值'
      }
      return labelMap[way] || '-'
    },

    // 获取账单类型标签样式
    getSettleWayType (way) {
      const typeMap = {
        0: 'primary',
        1: 'success',
        2: 'warning',
        3: 'danger',
        4: 'info',
        5: 'info',
        10: 'success'
      }
      return typeMap[way] || ''
    },

    // 获取发票状态标签
    getInvoiceStatusLabel (status) {
      const labelMap = {
        0: '未开票',
        1: '审核中',
        2: '已开票',
        3: '已拒绝'
      }
      return labelMap[status] || '-'
    },

    // 获取发票状态颜色
    getInvoiceStatusColor (status) {
      const colorMap = {
        0: '#909399',
        1: '#E6A23C',
        2: '#67C23A',
        3: '#F56C6C'
      }
      return colorMap[status] || '#909399'
    },

    // 格式化余额
    formatBalance (balance) {
      if (balance === null || balance === undefined) return '0.00'
      return Number(balance).toFixed(2)
    },

    // 获取余额样式类
    getBalanceClass (balance) {
      const num = Number(balance)
      if (num < 0) return 'balance-danger'
      if (num < 100) return 'balance-warning'
      return 'balance-success'
    }
  }
}
</script>

<style lang="scss" scoped>
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$border-color: #dcdfe6;
$border-light: #e4e7ed;

.tenant-bills-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;

  // 查询表单
  .search-form {
    margin-bottom: 20px;
    padding: 16px;
    background: #fafbfc;
    border-radius: 8px;
    border: 1px solid $border-light;
    flex-shrink: 0;

    ::v-deep .el-form--inline .el-form-item {
      margin-right: 16px;
      margin-bottom: 8px;
    }

    ::v-deep .el-form-item__label {
      font-size: 13px;
      color: $text-regular;
      font-weight: 500;
    }
  }

  // 统计卡片区域
  .statistics-container {
    margin-bottom: 20px;
    flex-shrink: 0;

    .statistics-card {
      border-radius: 8px;
      border: 1px solid $border-light;

      ::v-deep .el-card__body {
        padding: 16px;
      }
    }

    .statistics-wrapper {
      display: flex;
      justify-content: space-around;
      align-items: center;
      gap: 24px;

      .stat-item {
        flex: 1;
        display: flex;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
        border-radius: 8px;
        border: 1px solid #e8e8e8;
        transition: all 0.3s ease;
        cursor: pointer;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          margin-right: 16px;
          font-size: 22px;
          border: 1px solid;

          &.electricity {
            background: #E6F0FF;
            color: #409EFF;
            border-color: #B3D8FF;
          }

          &.water {
            background: #F0F9F0;
            color: #67C23A;
            border-color: #C2E7B0;
          }

          &.other {
            background: #FDF6EC;
            color: #E6A23C;
            border-color: #F5DAB1;
          }
        }

        .stat-content {
          flex: 1;

          .stat-label {
            font-size: 13px;
            color: $text-secondary;
            margin-bottom: 4px;
            font-weight: 500;
          }

          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: $text-primary;
          }
        }
      }
    }
  }

  // 表格容器
  .table-wrapper {
  flex: 1;
  min-height: 0;
  margin-bottom: 20px;

  ::v-deep .el-table {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #f0f0f0 !important;  // 改为更浅的边框

    .el-table__header-wrapper {
      th {
        background: #f5f7fa;
        color: $text-regular;
        font-weight: 600;
        font-size: 13px;
        border-right: 1px solid #f0f0f0 !important;   // 添加浅色右边框
        border-bottom: 1px solid #f0f0f0 !important;  // 改为浅色底边框
      }
    }

    .el-table__body {
      tr:hover > td {
        background: #f5f7fa !important;
      }

      td {
        border-right: 1px solid #f5f5f5 !important;   // 添加更浅的右边框
        border-bottom: 1px solid #f5f5f5 !important;  // 改为更浅的底边框
        font-size: 13px;
      }
    }
  }
}

  // 状态样式
  .status-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 6px;
    }
  }

  // 金额高亮样式
  .amount-highlight {
    color: #000;
    font-weight: 400;
  }

  // 余额文字样式（保留但不再使用）
  .balance-success {
    color: $success-color;
    font-weight: 600;
  }

  .balance-warning {
    color: $warning-color;
    font-weight: 600;
  }

  .balance-danger {
    color: $danger-color;
    font-weight: 600;
  }

  // 分页容器
  .pagination-wrapper {
    padding: 16px 0;
    flex-shrink: 0;
    background: white;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    ::v-deep .el-pagination {
      display: flex;
      align-items: center;

      .el-pager li {
        border-radius: 4px;
        margin: 0 2px;
      }

      .el-pagination__total,
      .el-pagination__sizes,
      .el-pagination__jump {
        display: flex;
        align-items: center;
      }
    }
  }
}

// Tooltip 自定义样式（全局）
::v-deep .statistics-tooltip {
  padding: 12px !important;
  background: rgba(0, 0, 0, 0.85) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;

  .tooltip-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
    color: #fff;

    .tooltip-label {
      margin-right: 16px;
      color: rgba(255, 255, 255, 0.8);
    }

    .tooltip-value {
      font-weight: 600;
      color: #fff;
    }

    &.tooltip-total {
      font-size: 14px;
      font-weight: 600;

      .tooltip-label,
      .tooltip-value {
        color: #fff;
      }
    }
  }

  .tooltip-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
    margin: 6px 0;
  }
}
</style>
<style lang="scss">
  // ========== 全局样式：自定义日期选择器 ==========
  .el-picker-panel {
    .el-picker-panel__sidebar {
      width: 115px !important;
      padding: 12px 8px !important;
      background: #fafafa !important;
      border: none !important;
      border-right: 1px solid #e8e8e8 !important;
    }

    .el-picker-panel__shortcut {
      display: block !important;
      width: 100% !important;
      padding: 9px 8px !important;
      margin-bottom: 6px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      color: #606266 !important;
      text-align: center !important;
      line-height: 1.4 !important;
      background: #ffffff !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
      outline: none !important;

      &:hover {
        color: #409eff !important;
        background: #f0f7ff !important;
        box-shadow: 0 2px 6px rgba(64, 158, 255, 0.15) !important;
        transform: translateY(-1px) !important;
        border: none !important;
      }

      &:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 3px rgba(64, 158, 255, 0.1) !important;
      }

      &:last-child {
        margin-bottom: 0 !important;
      }
    }
  }
  </style>
