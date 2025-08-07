<template>
  <div class="table-page-container">
    <!-- 顶部统计卡片 -->
    <div class="statistics-container" v-if="showStats">
      <el-card class="statistics-card" shadow="never">
        <div class="statistics-wrapper">
          <!-- 可提现金额 -->
          <div class="stat-item primary">
            <div class="stat-icon electricity">
              <i class="el-icon-wallet"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">可提现金额</div>
              <div class="stat-value">
                <span class="currency">￥</span>
                {{ formatMoney(statsData.withdableAmt) }}
              </div>
            </div>
          </div>

          <!-- 当前余额 -->
          <div class="stat-item primary" @click="handleViewBalance" style="cursor: pointer;">
            <div class="stat-icon water">
              <i class="el-icon-coin"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">
                当前余额
                <el-tooltip content="当前平台内累计留存余额，含未成功提现的金额。" placement="top">
                  <i class="el-icon-question" style="font-size: 12px; margin-left: 4px;"></i>
                </el-tooltip>
              </div>
              <div class="stat-value">
                <span class="currency">￥</span>
                {{ formatMoney(statsData.currentAmt) }}
              </div>
            </div>
          </div>

          <!-- 提现中金额 -->
          <div class="stat-item primary">
            <div class="stat-icon service">
              <i class="el-icon-s-promotion"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">提现中金额</div>
              <div class="stat-value">
                <span class="currency">￥</span>
                {{ formatMoney(statsData.withdrawAmt) }}
              </div>
            </div>
          </div>

          <!-- 手续费抵用券 -->
          <div class="stat-item secondary">
            <div class="stat-icon">
              <i class="el-icon-discount"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">手续费抵用券</div>
              <div class="stat-value">
                <span class="currency">￥</span>
                {{ formatMoney(voucherData.voucherAmt || 0) }}
              </div>
            </div>
          </div>

          <!-- 累计结算金额 -->
          <div class="stat-item total">
            <div class="stat-content">
              <div class="stat-label">累计结算</div>
              <div class="stat-value">
                <span class="currency">￥</span>
                {{ formatMoney(summaryData.totalSettleAmt) }}
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-card class="search-card" shadow="never">
        <el-form
          :model="queryData"
          ref="searchForm"
          class="search-form compact-form"
          label-position="left"
        >
          <el-row :gutter="20">
            <!-- 账单日期 -->
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="账单日期" prop="timeRange" class="compact-form-item" label-width="75px">
                <el-date-picker
                  v-model="queryData.timeRange"
                  type="daterange"
                  value-format="yyyy-MM-dd"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  size="small"
                  style="width: 100%"
                  clearable
                />
              </el-form-item>
            </el-col>

            <!-- 状态 -->
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <el-form-item label="状态" prop="status" class="compact-form-item" label-width="50px">
                <el-select
                  v-model="queryData.status"
                  placeholder="请选择"
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in withdrawStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 操作按钮 -->
            <el-col :xs="24" :sm="24" :md="10" :lg="14">
              <div class="form-actions compact-actions">
                <div class="action-left">
                  <el-button
                    type="primary"
                    icon="el-icon-search"
                    size="small"
                    @click="handleSearch"
                  >
                    查询
                  </el-button>
                  <el-button
                    icon="el-icon-refresh-left"
                    size="small"
                    @click="handleReset"
                  >
                    重置
                  </el-button>
                </div>
                <div class="action-right">
                  <el-button
                    v-if="selectedIds.length > 0"
                    type="success"
                    icon="el-icon-download"
                    size="small"
                    @click="handleExport"
                  >
                    导出选中 ({{ selectedIds.length }})
                  </el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>

    <!-- 标签切换区域 -->
    <div class="tab-container">
      <div class="tab-wrapper">
        <div class="tab-list">
          <div
            v-for="(item, index) in tabList"
            :key="index"
            :class="['tab-item', { active: activeTab === index }]"
            @click="handleTabChange(index, item)"
          >
            <span class="tab-title">{{ item.title }}</span>
            <span class="tab-indicator"></span>
          </div>
        </div>
        <div class="tab-actions">
          <el-button
            v-if="showApplyButton"
            type="primary"
            size="small"
            icon="el-icon-s-promotion"
            @click="handleApplyWithdraw"
            :disabled="selectedIds.length === 0"
          >
            申请提现
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-container" style="height:475px">
      <el-card class="table-card" shadow="never">
        <!-- 关键修复：使用统一的表格组件，通过key强制重新渲染 -->
        <el-table
          :key="tableKey"
          :ref="tableRef"
          :max-height="tableMaxHeight"
          v-loading="loading"
          :data="tableData"
          stripe
          style="width: 100%"
          class="custom-table"
          :header-cell-style="tableHeaderStyle"
          @selection-change="handleSelectionChange"
          :row-class-name="tableRowClassName"
          :row-key="getRowKey"
        >
          <!-- 选择列：只在未申请状态显示 -->
          <el-table-column 
            v-if="showSelectionColumn"
            type="selection" 
            width="55" 
            align="center"
            :selectable="checkSelectable"
          />
          
          <!-- 流水号 -->
          <el-table-column prop="id" label="流水号" width="100" align="center" />
          
          <!-- 账单日期 -->
          <el-table-column prop="occurDate" label="账单日期" width="160" align="center" />
          
          <!-- 结算日期：在不同状态下显示位置不同 -->
          <el-table-column 
            v-if="queryData.status === 3 || queryData.status === 4"
            prop="createTime" 
            label="结算日期" 
            width="160" 
            align="center" 
          />
          
          <!-- 提现日期：只在已申请状态显示 -->
          <el-table-column 
            v-if="queryData.status === 3 || queryData.status === 4"
            prop="updateTime" 
            label="提现日期" 
            width="160" 
            align="center"
          >
            <template slot-scope="scope">
              {{ scope.row.updateTime || '-' }}
            </template>
          </el-table-column>
          
          <!-- 结算金额 -->
          <el-table-column 
            prop="withdAmount" 
            label="结算金额" 
            :width="queryData.status === 3 || queryData.status === 4 ? 160 : 120" 
            :align="queryData.status === 3 || queryData.status === 4 ? 'center' : 'right'"
          >
            <template slot-scope="scope">
              <span class="amount-text" v-if="scope.row.withdAmount">
                ￥{{ formatMoney(scope.row.withdAmount) }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <!-- 费率 -->
          <el-table-column 
            prop="tariff" 
            label="费率" 
            :width="queryData.status === 3 || queryData.status === 4 ? 100 : 80" 
            align="center"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.tariff">{{ (scope.row.tariff * 100).toFixed(2) }}%</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <!-- 提现金额 -->
          <el-table-column 
            prop="balance" 
            label="提现金额" 
            :width="queryData.status === 3 || queryData.status === 4 ? 160 : 120" 
            :align="queryData.status === 3 || queryData.status === 4 ? 'center' : 'right'"
          >
            <template slot-scope="scope">
              <span class="amount-text primary" v-if="scope.row.balance">
                ￥{{ formatMoney(scope.row.balance) }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <!-- 银行开户行 -->
          <el-table-column 
            prop="openingBank" 
            label="银行开户行" 
            :width="queryData.status === 3 || queryData.status === 4 ? 200 : 280" 
            show-overflow-tooltip 
          />
          
          <!-- 银行账户：关键修复点 -->
          <el-table-column 
            prop="bankNumber" 
            label="银行账户" 
            :width="queryData.status === 3 || queryData.status === 4 ? 180 : 200" 
            align="center"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.bankNumber || '-' }}</span>
            </template>
          </el-table-column>
          
          <!-- 提现方式：关键修复点 -->
          <el-table-column 
            prop="withdType" 
            label="提现方式" 
            width="100" 
            align="center"
          >
            <template slot-scope="scope">
              <el-tag size="small" :type="scope.row.withdType === 1 ? 'primary' : 'info'">
                {{ getWithdrawTypeLabel(scope.row.withdType) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <!-- 结算日期：只在未申请状态显示 -->
          <el-table-column 
            v-if="!(queryData.status === 3 || queryData.status === 4)"
            prop="createTime" 
            label="结算日期" 
            width="160" 
            align="center" 
          />
          
          <!-- 提现日期：在未申请状态也显示 -->
          <el-table-column 
            v-if="!(queryData.status === 3 || queryData.status === 4)"
            prop="updateTime" 
            label="提现日期" 
            width="160" 
            align="center"
          >
            <template slot-scope="scope">
              {{ scope.row.updateTime || '-' }}
            </template>
          </el-table-column>
          
          <!-- 资金类型：只在未申请状态显示 -->
          <el-table-column 
            v-if="!(queryData.status === 3 || queryData.status === 4)"
            prop="payType" 
            label="资金类型" 
            width="100" 
            align="center"
          >
            <template slot-scope="scope">
              <el-tag size="small" :type="scope.row.payType === 1 ? 'success' : 'warning'">
                {{ getPayTypeLabel(scope.row.payType) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <!-- 状态 -->
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template slot-scope="scope">
              <div class="status-wrapper">
                <span :class="'status-dot status-' + scope.row.status"></span>
                <span>{{ getStatusLabel(scope.row.status) }}</span>
              </div>
            </template>
          </el-table-column>
          
          <!-- 操作 -->
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="handleDetail(scope.row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="tableData.length > 0">
      <el-pagination
        :current-page.sync="pageData.current"
        :page-sizes="[50, 100, 150, 500]"
        :page-size="pageData.size"
        :total="pageData.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 申请提现弹窗 -->
    <ApplyWithdrawDialog
      :visible.sync="applyDialogVisible"
      :data="applyDialogData"
      :voucher-data="voucherData"
      :manager-data="managerData"
      @success="handleApplySuccess"
    />

    <!-- 详情弹窗 -->
    <WithdrawDetailDialog
      :visible.sync="detailDialogVisible"
      :data="detailData"
    />
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import Cookies from 'js-cookie'
import {
  pageWithdrawApply,
  getWithdrawStats,
  getNoApplyRecords,
  getSelectedWithdrawData,
  getWithdrawSummary,
  exportWithdrawDetails,
  getVoucherInfo
} from '@/api/tenantRefund'
import ApplyWithdrawDialog from './components/ApplyWithdrawDialog'
import WithdrawDetailDialog from './components/WithdrawDetailDialog'

export default {
  name: 'TenantRefund',
  components: {
    ApplyWithdrawDialog,
    WithdrawDetailDialog
  },
  data() {
    return {
      // 关键修复：添加表格key用于强制重新渲染
      tableKey: 0,
      
      // 查询参数
      queryData: {
        timeRange: null,
        status: 0,
        billingRole: '',
        withdCostType: ''
      },
      // 统计数据
      statsData: {
        withdableAmt: 0,
        currentAmt: 0,
        withdrawAmt: 0,
        noWithdrawAmt: 0
      },
      // 手续费抵用券
      voucherData: {
        voucherAmt: 0
      },
      // 管理方数据
      managerData: {},
      // 标签列表 - 写死的数据
      tabList: [
        {
          title: '水电费私账',
          billingRole: 1,
          withdCostType: 0
        },
        {
          title: '水电费公账',
          billingRole: 0,
          withdCostType: 0
        }
      ],
      activeTab: 0,
      // 表格数据
      tableData: [],
      loading: false,
      // 分页
      pageData: {
        current: 1,
        size: 50,
        total: 0
      },
      // 选中数据
      selectedIds: [],
      // 不可选择的ID
      noApplyIds: [],
      // 选择索引（水电费连续选择用）
      selectIndex: null,
      // 当前分类不可选数量
      notNum: 0,
      // 汇总数据
      summaryData: {
        totalSettleAmt: 0,
        realSettleAmt: 0,
        totalHandFeeAmt: 0,
        totalWithdAmt: 0
      },
      // 状态选项
      withdrawStatusOptions: [
        { value: 0, label: '未提现' },
        { value: 3, label: '审核中' },
        { value: 4, label: '已提现' }
      ],
      // 修复：提现方式改为数组格式，避免可选链操作符
      withdrawTypeOptions: [
        { value: 0, label: '日结提现' },
        { value: 1, label: '余额提现' }
      ],
      // 修复：资金类型改为数组格式
      payTypeOptions: [
        { value: 0, label: '私账' },
        { value: 1, label: '公账' }
      ],
      // 弹窗
      applyDialogVisible: false,
      applyDialogData: {},
      detailDialogVisible: false,
      detailData: {},
      // 表格高度配置
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 8
      },
      // 表格头部样式
      tableHeaderStyle: {
        background: 'linear-gradient(180deg, #f8f9fc 0%, #f0f2f5 100%)',
        color: '#1f2329',
        fontWeight: '600',
        fontSize: '13px',
        borderBottom: '2px solid #e8e8e8'
      },
      // 是否正在切换状态
      isStatusChanging: false
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    // 是否显示统计卡片
    showStats() {
      return this.queryData.status === 0 || this.queryData.status === ''
    },
    // 是否显示申请按钮
    showApplyButton() {
      return this.queryData.status === 0
    },
    // 关键修复：是否显示选择列
    showSelectionColumn() {
      return !(this.queryData.status === 3 || this.queryData.status === 4)
    },
    // 关键修复：动态表格引用名
    tableRef() {
      return this.queryData.status === 3 || this.queryData.status === 4 ? 'withdrawTable' : 'applyTable'
    },
    // 表格最大高度
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
          this.managerData = this.$store.state.manager && this.$store.state.manager.managerInfo || {}
          this.init()
        }
      },
      immediate: true
    },
    // 监听状态变化，直接调用接口
    'queryData.status'(newVal, oldVal) {
      // 避免初始化时触发
      if (oldVal !== undefined && newVal !== oldVal) {
        this.handleStatusChange()
      }
    }
  },
  methods: {
    // 关键修复：获取行唯一标识
    getRowKey(row) {
      return row.id || Math.random().toString(36).substr(2, 9)
    },

    // 关键修复：强制刷新表格
    forceRefreshTable() {
      this.tableKey += 1
      this.$nextTick(() => {
        // 强制表格重新布局
        if (this.$refs[this.tableRef]) {
          this.$refs[this.tableRef].doLayout()
        }
      })
    },

    // 初始化
    async init() {
      // 从路由获取状态参数
      if (this.$route.query.dash !== undefined) {
        this.queryData.status = Number(this.$route.query.dash)
        if (this.queryData.status === 4) {
          this.queryData.timeRange = [
            moment().format('YYYY-MM') + '-01',
            moment().format('YYYY-MM-DD')
          ]
        }
      }
      
      // 初始化标签数据
      this.initTabs()
      // 加载初始数据
      await this.loadInitialData()
    },

    // 初始化标签
    initTabs() {
      // 使用写死的标签数据，不调用接口
      if (this.tabList.length > 0) {
        // 设置第一个标签为默认选中
        this.queryData.billingRole = this.tabList[0].billingRole
        this.queryData.withdCostType = this.tabList[0].withdCostType
        this.activeTab = 0
      }
    },

    // 加载初始数据
    async loadInitialData() {
      // 并行加载统计数据和抵用券信息
      const promises = []
      
      if (this.showStats) {
        promises.push(this.loadStats())
      }
      promises.push(this.loadVoucher())
      promises.push(this.loadNoApplyRecords())
      
      await Promise.all(promises)
      
      // 最后加载表格数据
      await this.fetchTableData()
    },

    // 关键修复：处理状态切换
    async handleStatusChange() {
      this.isStatusChanging = true
      this.pageData.current = 1
      
      // 清空选择状态
      this.selectedIds = []
      this.selectIndex = null
      
      // 先清空表格数据
      this.tableData = []
      
      // 等待DOM更新
      await this.$nextTick()
      
      // 强制刷新表格
      this.forceRefreshTable()
      
      // 重新加载数据
      await this.fetchTableDataSmooth()
      
      // 如果状态切换影响统计显示，重新加载统计
      if (this.showStats) {
        this.loadStats()
      }
      
      this.isStatusChanging = false
    },

    // 加载统计数据
    async loadStats() {
      if (!this.showStats) return
      
      try {
        const response = await getWithdrawStats({
          managerId: this.currentManagerId
        })
        if (response.code === 200) {
          this.statsData = response.data || {}
        }
      } catch (error) {
        console.error('加载统计失败:', error)
      }
    },

    // 加载手续费抵用券
    async loadVoucher() {
      try {
        const response = await getVoucherInfo({
          managerId: this.currentManagerId,
          voucherType: 0
        })
        if (response.code === 200) {
          console.log('手续费抵用券数据:', response.data)
          this.voucherData = response.data || {}
        }
      } catch (error) {
        console.error('加载抵用券失败:', error)
      }
    },

    // 加载不可选择记录
    async loadNoApplyRecords() {
      try {
        const response = await getNoApplyRecords({
          withdCostType: this.queryData.withdCostType,
          managerId: this.currentManagerId
        })
        if (response.code === 200) {
          this.noApplyIds = response.data || []
        }
      } catch (error) {
        console.error('加载不可选记录失败:', error)
      }
    },

    // 获取表格数据（普通版本）
    async fetchTableData() {
      this.loading = true
      this.tableData = []
      
      try {
        const data = await this.requestTableData()
        if (data) {
          this.tableData = this.formatTableData(data.dataList || [])
          this.pageData.total = data.total || 0
          this.pageData.current = data.current || 1
          
          // 强制刷新表格
          this.forceRefreshTable()
        }
      } catch (error) {
        this.$message.error('获取数据失败')
        console.error('获取数据失败:', error)
      } finally {
        this.loading = false
        this.selectedIds = []
        this.selectIndex = null
        this.resetSummaryData()
      }
    },

    // 获取表格数据（平滑切换版本）
    async fetchTableDataSmooth() {
      this.loading = true
      
      try {
        const data = await this.requestTableData()
        if (data) {
          // 使用 nextTick 确保 DOM 更新平滑
          await this.$nextTick()
          this.tableData = this.formatTableData(data.dataList || [])
          this.pageData.total = data.total || 0
          this.pageData.current = data.current || 1
          
          // 关键修复：数据更新后强制刷新表格
          await this.$nextTick()
          this.forceRefreshTable()
        }
      } catch (error) {
        this.$message.error('获取数据失败')
        console.error('获取数据失败:', error)
        this.tableData = []
      } finally {
        this.loading = false
        this.selectedIds = []
        this.selectIndex = null
        this.resetSummaryData()
      }
    },

    // 请求表格数据（抽取公共逻辑）
    async requestTableData() {
      // 处理日期范围
      let startDate = ''
      let endDate = ''
      if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
        startDate = this.queryData.timeRange[0] || ''
        endDate = this.queryData.timeRange[1] || ''
      }
      
      const params = {
        managerId: this.currentManagerId,
        status: this.queryData.status,
        startDate: startDate,
        endDate: endDate,
        billingRole: this.queryData.billingRole,
        withdCostType: this.queryData.withdCostType,
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

      const response = await pageWithdrawApply(params)
      if (response.code === 200 && response.data) {
        return response.data
      } else {
        this.$message.error(response.msg || '获取数据失败')
        return null
      }
    },

    // 格式化表格数据
    formatTableData(data) {
      let notNum = 0
      const formatted = data.map(item => {
        const isDisabled = this.noApplyIds.includes(item.id)
        if (isDisabled) {
          notNum++
        }
        console.log('原始数据项:', {
          id: item.id,
          bankNumber: item.bankNumber,
          withdType: item.withdType,
          payType: item.payType
        })
        return {
          ...item,
          isDisabled
        }
      })
      this.notNum = notNum
      return formatted
    },

    // 查询
    handleSearch() {
      this.pageData.current = 1
      this.summaryData = {
        totalSettleAmt: 0
      }
      
      // 重新加载所有数据
      this.loading = true
      Promise.all([
        this.showStats && this.loadStats(),
        this.loadNoApplyRecords()
      ].filter(Boolean)).then(() => {
        this.fetchTableData()
      })
    },

    // 重置
    handleReset() {
      this.$refs.searchForm.resetFields()
      this.queryData.timeRange = null
      this.queryData.status = 0
      this.pageData.current = 1
      this.handleSearch()
    },

    // 关键修复：切换标签
    handleTabChange(index, item) {
      if (this.activeTab === index) return
      
      this.activeTab = index
      this.queryData.billingRole = item.billingRole
      this.queryData.withdCostType = item.withdCostType
      this.pageData.current = 1
      
      // 清空数据并强制刷新表格
      this.tableData = []
      this.selectedIds = []
      this.forceRefreshTable()
      
      // 切换标签时重新加载数据
      this.loading = true
      this.loadNoApplyRecords().then(() => {
        this.fetchTableDataSmooth()
      })
    },

    // 选择变化
    async handleSelectionChange(selection) {
      // 水电费类型特殊处理（withdCostType === 0）
      if (this.queryData.withdCostType === 0) {
        await this.handleWaterElectricSelection(selection)
      } else {
        // 其他类型正常处理
        if (selection.length) {
          this.selectedIds = []
          selection.forEach(item => {
            if (!item.isDisabled) {
              this.selectedIds.push(item.id)
            }
          })
          await this.loadSummaryData(this.selectedIds)
        } else {
          this.selectedIds = []
          this.resetSummaryData()
        }
      }
    },

    // 水电费选择处理
    async handleWaterElectricSelection(selection) {
      const validSelection = selection.filter(item => !item.isDisabled)
      const isAll = validSelection.length === this.tableData.length - this.notNum
      
      if (validSelection.length === 0) {
        this.selectedIds = []
        this.selectIndex = null
        this.resetSummaryData()
        return
      }
      
      const query = {
        date: '',
        isAll: false
      }
      
      if (validSelection.length && isAll) {
        // 全选
        query.isAll = true
        await this.getSelectedData(query)
      } else if (validSelection.length === 1) {
        // 单选
        this.tableData.forEach((item, index) => {
          if (item.id === validSelection[0].id) {
            this.selectIndex = index
            query.date = item.createTime
            query.isAll = false
          }
        })
        await this.getSelectedData(query)
      } else {
        // 清空选择
        if (this.$refs[this.tableRef]) {
          this.$refs[this.tableRef].clearSelection()
        }
        this.selectIndex = null
        this.selectedIds = []
        this.resetSummaryData()
      }
    },

    // 获取选择的数据
    async getSelectedData(params) {
      try {
        const response = await getSelectedWithdrawData({
          managerId: this.currentManagerId,
          isAll: params.isAll,
          billingRole: this.queryData.billingRole,
          date: params.date
        })
        
        if (response.code === 200) {
          this.selectedIds = response.data || []
          await this.loadSummaryData(this.selectedIds)
        }
      } catch (error) {
        console.error('获取选择数据失败:', error)
      }
    },

    // 加载汇总数据
    async loadSummaryData(ids) {
      if (!ids || ids.length === 0) return
      
      try {
        const response = await getWithdrawSummary({
          withdApplyIds: ids.join(','),
          managerId: this.currentManagerId,
          auditSumyId: ''
        })
        
        if (response.code === 200) {
          this.summaryData = response.data || {}
        }
      } catch (error) {
        console.error('加载汇总数据失败:', error)
      }
    },

    // 重置汇总数据
    resetSummaryData() {
      this.summaryData = {
        totalSettleAmt: 0,
        realSettleAmt: 0,
        totalHandFeeAmt: 0,
        totalWithdAmt: 0
      }
    },

    // 判断行是否可选
    checkSelectable(row, index) {
      // 不为水电费
      if (this.queryData.withdCostType !== 0) {
        return !row.isDisabled
      }
      
      // 水电费连续选择逻辑
      if (this.selectIndex !== null && this.selectIndex !== undefined) {
        return index <= this.selectIndex && !row.isDisabled
      }
      
      return !row.isDisabled
    },

    // 表格行样式
    tableRowClassName({ row }) {
      return row.isDisabled ? 'disabled-row' : ''
    },

    // 申请提现
    handleApplyWithdraw() {
      if (this.selectedIds.length === 0) {
        this.$message.warning('请选择提现数据')
        return
      }
      
      this.applyDialogData = {
        ...this.summaryData,
        managerId: this.currentManagerId,
        withdApplyIds: this.selectedIds,
        withdCostType: this.queryData.withdCostType,
        status: 3
      }
      this.applyDialogVisible = true
    },

    // 申请成功
    handleApplySuccess() {
      this.selectedIds = []
      this.handleSearch()
    },

    // 导出
    async handleExport() {
      if (this.selectedIds.length === 0) {
        this.$message.warning('请选择要导出的数据')
        return
      }
      
      let isExport = Cookies.get('isExport')
      if (isExport && isExport !== 'detail') {
        this.$message.info('导出数据查询中...')
        return
      }
      
      if (!isExport) {
        try {
          const response = await exportWithdrawDetails({
            managerId: this.currentManagerId,
            withdApplyIds: this.selectedIds.join(','),
            auditSumyId: ''
          })
          
          this.$message.success(response.msg || '导出任务已提交')
          Cookies.set('isExport', 'detail')
          
          setTimeout(() => {
            // 这里可以调用查询导出结果的方法
            Cookies.remove('isExport')
          }, 1000)
        } catch (error) {
          this.$message.error('导出失败')
          console.error('导出失败:', error)
        }
      }
    },

    // 详情
    handleDetail(row) {
      this.detailData = {
        ...row,
        withdCostType: this.queryData.withdCostType
      }
      this.detailDialogVisible = true
    },

    // 查看余额
    handleViewBalance() {
      // 可以跳转到余额详情页面
      // this.$router.push('/balance-detail')
      this.$message.info('查看余额功能开发中')
    },

    // 分页变化
    handleSizeChange(val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableDataSmooth()
    },

    handleCurrentChange(val) {
      this.pageData.current = val
      this.fetchTableDataSmooth()
    },

    // 工具方法
    formatMoney(value) {
      if (!value && value !== 0) return '0.00'
      return Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },

    getStatusLabel(status) {
      const option = this.withdrawStatusOptions.find(item => item.value === status)
      return option ? option.label : '-'
    },

    // 关键修复：修复提现方式标签获取
    getWithdrawTypeLabel(type) {
      // 添加调试日志
      console.log('获取提现方式标签:', type, typeof type)
      
      if (type === null || type === undefined) {
        return '-'
      }
      
      // 确保类型转换正确
      const numType = Number(type)
      if (isNaN(numType)) {
        console.warn('提现方式类型转换失败:', type)
        return '-'
      }
      
      const option = this.withdrawTypeOptions.find(item => item.value === numType)
      const result = option ? option.label : '-'
      
      console.log('提现方式标签结果:', result)
      return result
    },

    // 关键修复：修复资金类型标签获取
    getPayTypeLabel(type) {
      // 添加调试日志
      console.log('获取资金类型标签:', type, typeof type)
      
      if (type === null || type === undefined) {
        return '-'
      }
      
      // 确保类型转换正确
      const numType = Number(type)
      if (isNaN(numType)) {
        console.warn('资金类型转换失败:', type)
        return '-'
      }
      
      const option = this.payTypeOptions.find(item => item.value === numType)
      const result = option ? option.label : '-'
      
      console.log('资金类型标签结果:', result)
      return result
    }
  }
}
</script>
  <style lang="scss" scoped>
@import "@/assets/styles/table-page.scss";

// 标签容器样式
.tab-container {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  
  .tab-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    height: 56px;
    
    .tab-list {
      display: flex;
      align-items: center;
      height: 100%;
      
      .tab-item {
        position: relative;
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0 24px;
        margin-right: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        
        .tab-title {
          font-size: 14px;
          color: #666;
          font-weight: 400;
          transition: all 0.3s ease;
        }
        
        .tab-indicator {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 3px;
          background: #409EFF;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        
        &:hover {
          .tab-title {
            color: #409EFF;
          }
        }
        
        &.active {
          .tab-title {
            color: #409EFF;
            font-weight: 500;
          }
          
          .tab-indicator {
            width: calc(100% - 32px);
          }
        }
      }
    }
    
    .tab-actions {
      display: flex;
      align-items: center;
    }
  }
}

// 金额文本样式
.amount-text {
  font-weight: 500;
  color: #333;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
  
  &.primary {
    color: #F64C4C;
  }
}

// 状态点样式扩展
.status-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
    
    &.status-0 {
      background: #909399;
      box-shadow: 0 0 0 2px rgba(144, 147, 153, 0.2);
    }
    
    &.status-3 {
      background: #E6A23C;
      box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2);
    }
    
    &.status-4 {
      background: #409EFF;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }
}

// 禁用行样式
::v-deep .disabled-row {
  background-color: #f5f7fa !important;
  opacity: 0.6;
  
  td {
    color: #999 !important;
  }
}

// 自定义表格样式扩展
.custom-table {
  ::v-deep .el-table__body-wrapper {
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 4px;
      
      &:hover {
        background: #c0c4cc;
      }
    }
    
    &::-webkit-scrollbar-track {
      background: #f5f7fa;
    }
  }
  
  ::v-deep .el-table__fixed-right {
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
  }
  
  // 表格行悬停效果
  ::v-deep .el-table__row {
    &:hover {
      background-color: #f5f7fa !important;
    }
  }
}

// 操作按钮组样式优化
.form-actions {
  &.compact-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    
    .action-left {
      display: flex;
      gap: 8px;
    }
    
    .action-right {
      display: flex;
      gap: 8px;
    }
  }
}

// 分页容器优化
.pagination-container {
  padding: 16px;
  background: #fff;
  display: flex;
  justify-content: flex-end;
  margin-top: -1px;
  border-top: 1px solid #ebeef5;
  
  ::v-deep .el-pagination {
    font-weight: normal;
    
    .el-pager li {
      min-width: 32px;
      height: 32px;
      line-height: 32px;
      border-radius: 4px;
      margin: 0 4px;
      
      &:hover {
        color: #409EFF;
      }
      
      &.active {
        background: #409EFF;
        color: #fff;
        
        &:hover {
          background: #66b1ff;
        }
      }
    }
    
    .el-pagination__sizes {
      .el-input__inner {
        height: 32px;
        border-radius: 4px;
      }
    }
    
    .el-pagination__jump {
      .el-input__inner {
        height: 32px;
        border-radius: 4px;
      }
    }
    
    .btn-prev,
    .btn-next {
      width: 32px;
      height: 32px;
      line-height: 32px;
      border-radius: 4px;
      
      &:hover {
        color: #409EFF;
      }
    }
  }
}

// 标签样式增强
::v-deep .el-tag {
  border-radius: 4px;
  
  &.el-tag--small {
    height: 22px;
    line-height: 20px;
    padding: 0 8px;
  }
  
  // 线上/线下提现方式
  &.el-tag--primary {
    background-color: rgba(64, 158, 255, 0.1);
    border-color: rgba(64, 158, 255, 0.2);
    color: #409EFF;
  }
  
  &.el-tag--info {
    background-color: rgba(144, 147, 153, 0.1);
    border-color: rgba(144, 147, 153, 0.2);
    color: #909399;
  }
  
  // 公账/私账类型
  &.el-tag--success {
    background-color: rgba(103, 194, 58, 0.1);
    border-color: rgba(103, 194, 58, 0.2);
    color: #67C23A;
  }
  
  &.el-tag--warning {
    background-color: rgba(230, 162, 60, 0.1);
    border-color: rgba(230, 162, 60, 0.2);
    color: #E6A23C;
  }
}

// 响应式布局优化
@media (max-width: 768px) {
  .tab-container {
    .tab-wrapper {
      flex-direction: column;
      height: auto;
      padding: 12px;
      
      .tab-list {
        width: 100%;
        margin-bottom: 12px;
        
        .tab-item {
          flex: 1;
          justify-content: center;
          padding: 0 12px;
          margin-right: 0;
          height: 40px;
        }
      }
      
      .tab-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  }
  
  .form-actions.compact-actions {
    flex-direction: column;
    
    .action-left,
    .action-right {
      width: 100%;
      justify-content: center;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .tab-container {
    .tab-wrapper {
      .tab-list {
        .tab-item {
          padding: 0 16px;
        }
      }
    }
  }
}

// 动画效果
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-card {
  animation: fadeIn 0.3s ease;
}

// 加载效果优化
::v-deep .el-loading-mask {
  background-color: rgba(255, 255, 255, 0.95);
  
  .el-loading-spinner {
    .circular {
      width: 36px;
      height: 36px;
    }
    
    .el-loading-text {
      color: #409EFF;
      margin-top: 12px;
      font-size: 14px;
    }
  }
}

// 搜索表单样式微调
.search-form {
  ::v-deep .el-form-item {
    margin-bottom: 0;
    
    .el-form-item__label {
      font-size: 13px;
      color: #606266;
    }
  }
  
  ::v-deep .el-date-editor {
    width: 100% !important;
    
    .el-range-separator {
      line-height: 32px;
    }
  }
}

// 空数据样式优化
.empty-data {
  padding: 80px 0;
  text-align: center;
  
  .empty-icon {
    font-size: 64px;
    color: #c0c4cc;
    margin-bottom: 16px;
  }
  
  .empty-text {
    font-size: 14px;
    color: #909399;
  }
}

// 按钮样式增强
::v-deep .el-button {
  border-radius: 4px;
  font-weight: 400;
  
  &--small {
    padding: 7px 15px;
    
    &.is-circle {
      padding: 7px;
    }
  }
  
  &--primary {
    background: #409EFF;
    border-color: #409EFF;
    
    &:hover {
      background: #66b1ff;
      border-color: #66b1ff;
    }
    
    &:active {
      background: #3a8ee6;
      border-color: #3a8ee6;
    }
  }
  
  &--text {
    color: #409EFF;
    padding: 5px 8px;
    
    &:hover {
      color: #66b1ff;
      background: rgba(64, 158, 255, 0.08);
    }
  }
}

// 卡片阴影效果
.search-card,
.table-card {
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}
</style>