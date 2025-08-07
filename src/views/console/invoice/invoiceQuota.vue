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
          label-width="90px"
        >
          <!-- 基础筛选 -->
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
                  v-else-if="field.type === 'select' && field.prop === 'tenantId'"
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
                <!-- 选择框 - 额度状态 -->
                <el-select
                  v-else-if="field.type === 'select' && field.prop === 'quotaStatus'"
                  v-model="queryData[field.prop]"
                  placeholder="请选择额度状态"
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in quotaStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <!-- 日期选择器 -->
                <el-date-picker
                  v-else-if="field.type === 'month'"
                  v-model="queryData[field.prop]"
                  type="month"
                  placeholder="选择月份"
                  value-format="yyyy-MM"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 操作按钮行 -->
          <div class="form-actions compact-actions">
            <div class="action-left">
              <el-button
                type="primary"
                icon="el-icon-plus"
                size="small"
                @click="handleAddQuota"
              >
                新增额度
              </el-button>
              <el-button
                type="warning"
                icon="el-icon-edit"
                size="small"
                @click="handleBatchAdjust"
              >
                批量调整
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
              <el-divider direction="vertical" style="margin: 0 8px"></el-divider>
              <el-dropdown trigger="click" @command="handleCommand">
                <el-button size="small" type="text" style="padding: 7px 12px">
                  更多操作 <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="export" icon="el-icon-download">
                    导出数据
                  </el-dropdown-item>
                  <el-dropdown-item command="import" icon="el-icon-upload2">
                    导入额度
                  </el-dropdown-item>
                  <el-dropdown-item command="history" icon="el-icon-time" divided>
                    查看历史
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
        </el-form>
      </el-card>
    </div>

    <!-- 统计卡片区域 -->
    <div class="statistics-container">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">总额度</span>
              <i class="el-icon-coin stat-icon" style="color: #409EFF;"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value" style="color: #409EFF;">
                {{ formatMoney(statistics.totalQuota) }}
              </div>
              <div class="stat-desc">本月分配总额度</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">已使用</span>
              <i class="el-icon-check stat-icon" style="color: #67C23A;"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value" style="color: #67C23A;">
                {{ formatMoney(statistics.usedQuota) }}
              </div>
              <div class="stat-desc">使用率 {{ statistics.usedRate }}%</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">剩余额度</span>
              <i class="el-icon-wallet stat-icon" style="color: #E6A23C;"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value" style="color: #E6A23C;">
                {{ formatMoney(statistics.remainQuota) }}
              </div>
              <div class="stat-desc">可用额度</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">预警企业</span>
              <i class="el-icon-warning stat-icon" style="color: #F56C6C;"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value" style="color: #F56C6C;">
                {{ statistics.warningCount }}
              </div>
              <div class="stat-desc">额度不足企业数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-container" style="height:430px">
      <div class="table-card" shadow="never">
        <!-- 表格工具栏 -->
        <div class="table-toolbar" v-if="selectedData.length > 0">
          <div class="toolbar-left">
            <span class="selection-info">
              已选择 <span class="count">{{ selectedData.length }}</span> 条数据
            </span>
            <el-button size="mini" type="primary" @click="handleBatchIncrease">批量增加额度</el-button>
            <el-button size="mini" type="warning" @click="handleBatchReset">批量重置</el-button>
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
          
          <!-- 租户ID -->
          <el-table-column
            prop="tenantId"
            label="租户ID"
            width="120"
            align="center"
            show-overflow-tooltip
            fixed="left"
          >
            <template slot-scope="scope">
              <span class="text-primary">{{ scope.row.tenantId || '-' }}</span>
            </template>
          </el-table-column>
          
          <!-- 租户名称 -->
          <el-table-column
            prop="tenantName"
            label="租户名称"
            min-width="180"
            align="center"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <el-link type="primary" @click="handleTenantDetail(scope.row)">
                <i class="el-icon-office-building"></i>
                {{ scope.row.tenantName || '-' }}
              </el-link>
            </template>
          </el-table-column>
          
          <!-- 楼栋位置 -->
          <el-table-column
            prop="location"
            label="楼栋位置"
            width="100"
            align="center"
          >
            <template slot-scope="scope">
              <el-tag size="small" type="info">{{ scope.row.location }}</el-tag>
            </template>
          </el-table-column>
          
          <!-- 月度额度 -->
          <el-table-column
            prop="monthlyQuota"
            label="月度额度"
            width="130"
            align="center"
            sortable
          >
            <template slot-scope="scope">
              <span class="amount-text text-primary">
                {{ formatMoney(scope.row.monthlyQuota) }}
              </span>
            </template>
          </el-table-column>
          
          <!-- 已开票金额 -->
          <el-table-column
            prop="issuedAmount"
            label="已开票金额"
            width="130"
            align="center"
            sortable
          >
            <template slot-scope="scope">
              <span class="amount-text text-success">
                {{ formatMoney(scope.row.issuedAmount) }}
              </span>
            </template>
          </el-table-column>
          
          <!-- 待开票金额 -->
          <el-table-column
            prop="pendingAmount"
            label="待开票金额"
            width="130"
            align="center"
            sortable
          >
            <template slot-scope="scope">
              <span class="amount-text text-warning">
                {{ formatMoney(scope.row.pendingAmount) }}
              </span>
            </template>
          </el-table-column>
          
          <!-- 剩余额度 -->
          <el-table-column
            prop="remainingQuota"
            label="剩余额度"
            width="130"
            align="center"
            sortable
          >
            <template slot-scope="scope">
              <span 
                class="amount-text"
                :class="scope.row.remainingQuota < 10000 ? 'text-danger' : ''"
              >
                {{ formatMoney(scope.row.remainingQuota) }}
              </span>
            </template>
          </el-table-column>
          
          <!-- 使用进度 -->
          <el-table-column
            prop="usageRate"
            label="使用进度"
            width="200"
            align="center"
          >
            <template slot-scope="scope">
              <div class="progress-wrapper">
                <el-progress
                  :percentage="scope.row.usageRate"
                  :color="getProgressColor(scope.row.usageRate)"
                  :stroke-width="6"
                />
                <span class="progress-text">{{ scope.row.usageRate }}%</span>
              </div>
            </template>
          </el-table-column>
          
          <!-- 额度状态 -->
          <el-table-column
            prop="quotaStatus"
            label="额度状态"
            width="120"
            align="center"
          >
            <template slot-scope="scope">
              <el-tag
                v-if="scope.row.quotaStatus === 'normal'"
                type="success"
                size="small"
                effect="plain"
              >
                正常
              </el-tag>
              <el-tag
                v-else-if="scope.row.quotaStatus === 'warning'"
                type="warning"
                size="small"
                effect="plain"
              >
                预警
              </el-tag>
              <el-tag
                v-else-if="scope.row.quotaStatus === 'exhausted'"
                type="danger"
                size="small"
                effect="plain"
              >
                已用尽
              </el-tag>
              <el-tag
                v-else-if="scope.row.quotaStatus === 'frozen'"
                type="info"
                size="small"
                effect="plain"
              >
                已冻结
              </el-tag>
            </template>
          </el-table-column>
          
          <!-- 最后更新时间 -->
          <el-table-column
            prop="updateTime"
            label="最后更新"
            width="160"
            align="center"
            show-overflow-tooltip
          />

          <!-- 操作列 -->
          <el-table-column
            label="操作"
            width="220"
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <div class="table-actions-group">
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-edit"
                  @click="handleEdit(scope.row)"
                >
                  调整
                </el-button>
                <el-divider direction="vertical"></el-divider>
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-view"
                  @click="handleViewDetail(scope.row)"
                >
                  明细
                </el-button>
                <el-divider direction="vertical"></el-divider>
                <el-dropdown
                  trigger="click"
                  @command="handleTableCommand($event, scope.row)"
                >
                  <el-button type="text" size="small">
                    更多
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="history" icon="el-icon-time">
                      历史记录
                    </el-dropdown-item>
                    <el-dropdown-item 
                      command="freeze" 
                      icon="el-icon-lock"
                      v-if="scope.row.quotaStatus !== 'frozen'"
                    >
                      冻结额度
                    </el-dropdown-item>
                    <el-dropdown-item 
                      command="unfreeze" 
                      icon="el-icon-unlock"
                      v-else
                    >
                      解冻额度
                    </el-dropdown-item>
                    <el-dropdown-item command="reset" icon="el-icon-refresh">
                      重置额度
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
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

    <!-- 调整额度弹窗 -->
    <el-dialog
      :title="editForm.id ? '调整发票额度' : '新增发票额度'"
      :visible.sync="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editForm"
        :model="editForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="租户" prop="tenantId">
          <el-select
            v-model="editForm.tenantId"
            placeholder="请选择租户"
            style="width: 100%"
            :disabled="!!editForm.id"
            filterable
          >
            <el-option
              v-for="tenant in tenantList"
              :key="tenant.id"
              :label="`${tenant.id}(${tenant.name})`"
              :value="tenant.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="月度额度" prop="monthlyQuota">
          <el-input-number
            v-model="editForm.monthlyQuota"
            :min="0"
            :max="10000000"
            :step="10000"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="调整原因" prop="reason">
          <el-input
            v-model="editForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSave">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 批量增加额度弹窗 -->
    <el-dialog
      title="批量增加额度"
      :visible.sync="batchIncreaseVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="batchIncreaseForm"
        :model="batchIncreaseForm"
        :rules="batchIncreaseRules"
        label-width="100px"
      >
        <el-form-item label="增加金额" prop="increaseAmount">
          <el-input-number
            v-model="batchIncreaseForm.increaseAmount"
            :min="1"
            :max="1000000"
            :step="1000"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="调整原因" prop="reason">
          <el-input
            v-model="batchIncreaseForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入批量调整原因"
          />
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="batchIncreaseVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleBatchIncreaseSave">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'

// 额度状态枚举
const quotaStatusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'warning', label: '预警' },
  { value: 'exhausted', label: '已用尽' },
  { value: 'frozen', label: '已冻结' }
]

export default {
  name: 'InvoiceQuota',
  data() {
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
        tenantId: '',
        tenantName: '',
        quotaStatus: '',
        month: moment().format('YYYY-MM'),
        managerId: ''
      },
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: 'tenantId', label: '租户', type: 'select', filterable: true },
          { prop: 'tenantName', label: '租户名称', type: 'input' },
          { prop: 'quotaStatus', label: '额度状态', type: 'select' },
          { prop: 'month', label: '月份', type: 'month' }
        ]
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
      // 枚举数据
      quotaStatusOptions,
      // 租户列表
      tenantList: [],
      // 统计数据
      statistics: {
        totalQuota: 0,
        usedQuota: 0,
        remainQuota: 0,
        usedRate: 0,
        warningCount: 0
      },
      // 编辑弹窗
      dialogVisible: false,
      editForm: {
        id: '',
        tenantId: '',
        monthlyQuota: 0,
        reason: ''
      },
      // 批量增加额度弹窗
      batchIncreaseVisible: false,
      batchIncreaseForm: {
        increaseAmount: 0,
        reason: ''
      },
      // 表单验证规则
      rules: {
        tenantId: [
          { required: true, message: '请选择租户', trigger: 'change' }
        ],
        monthlyQuota: [
          { required: true, message: '请输入月度额度', trigger: 'blur' }
        ],
        reason: [
          { required: true, message: '请输入调整原因', trigger: 'blur' }
        ]
      },
      // 批量增加额度验证规则
      batchIncreaseRules: {
        increaseAmount: [
          { required: true, message: '请输入增加金额', trigger: 'blur' }
        ],
        reason: [
          { required: true, message: '请输入调整原因', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    // 显示的基础搜索字段
    displayBasicFields() {
      return this.searchFields.basic
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
          this.queryData.managerId = newVal
          this.getTenantList()
          this.fetchTableData()
          this.fetchStatistics()
        }
      },
      immediate: true
    }
  },
  created() {
    this.init()
  },
  methods: {
    // 初始化
    init() {
      if (this.currentManagerId) {
        this.queryData.managerId = this.currentManagerId
      }
      this.fetchTableData()
      this.fetchStatistics()
    },

    // 获取租户列表
    getTenantList() {
      // 模拟智慧园区租户数据
      this.tenantList = [
        { id: 'PKA001', name: '智云科技有限公司' },
        { id: 'PKB002', name: '金融科技服务有限公司' },
        { id: 'PKC003', name: '文化传播有限公司' },
        { id: 'PKD001', name: '生物医药研发中心' },
        { id: 'PKE002', name: '绿色环保科技有限公司' },
        { id: 'PKF001', name: '园区餐饮管理有限公司' }
      ]
    },

    // 获取统计数据
    fetchStatistics() {
      // 模拟统计数据
      this.statistics = {
        totalQuota: 5680000,
        usedQuota: 3852000,
        remainQuota: 1828000,
        usedRate: 67.8,
        warningCount: 2
      }
    },

    // 获取表格数据
    async fetchTableData() {
      this.loading = true
      
      setTimeout(() => {
        // 生成模拟数据
        const mockData = []
        
        // 企业额度配置
        const quotaConfig = {
          'PKA001': { monthly: 800000, issued: 520000, pending: 80000, location: 'A栋' },
          'PKB002': { monthly: 1500000, issued: 1200000, pending: 250000, location: 'B栋' },
          'PKC003': { monthly: 300000, issued: 180000, pending: 30000, location: 'C栋' },
          'PKD001': { monthly: 1200000, issued: 850000, pending: 200000, location: 'D栋' },
          'PKE002': { monthly: 600000, issued: 400000, pending: 50000, location: 'E栋' },
          'PKF001': { monthly: 150000, issued: 120000, pending: 20000, location: 'F栋' }
        }
        
        this.tenantList.forEach((tenant, index) => {
          const config = quotaConfig[tenant.id]
          const remaining = config.monthly - config.issued - config.pending
          const usageRate = Math.round((config.issued / config.monthly) * 100)
          
          // 判断额度状态
          let quotaStatus = 'normal'
          if (remaining <= 0) {
            quotaStatus = 'exhausted'
          } else if (remaining < config.monthly * 0.2) {
            quotaStatus = 'warning'
          }
          
          mockData.push({
            id: index + 1,
            tenantId: tenant.id,
            tenantName: tenant.name,
            location: config.location,
            monthlyQuota: config.monthly,
            issuedAmount: config.issued,
            pendingAmount: config.pending,
            remainingQuota: remaining,
            usageRate: usageRate,
            quotaStatus: quotaStatus,
            updateTime: moment().subtract(Math.floor(Math.random() * 7), 'days').format('YYYY-MM-DD HH:mm:ss')
          })
        })
        
        // 根据查询条件过滤
        let filteredData = [...mockData]
        
        if (this.queryData.tenantId) {
          filteredData = filteredData.filter(item => 
            item.tenantId === this.queryData.tenantId
          )
        }
        
        if (this.queryData.tenantName) {
          filteredData = filteredData.filter(item => 
            item.tenantName.includes(this.queryData.tenantName)
          )
        }
        
        if (this.queryData.quotaStatus) {
          filteredData = filteredData.filter(item => 
            item.quotaStatus === this.queryData.quotaStatus
          )
        }
        
        // 分页处理
        this.pageData.total = filteredData.length
        const start = (this.pageData.current - 1) * this.pageData.size
        const end = start + this.pageData.size
        this.tableData = filteredData.slice(start, end)
        
        this.loading = false
      }, 500)
    },

    // 格式化金额
    formatMoney(value) {
      if (value === null || value === undefined || value === '') {
        return '¥0.00'
      }
      return `¥${parseFloat(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },

    // 获取进度条颜色
    getProgressColor(percentage) {
      if (percentage < 60) return '#67C23A'
      if (percentage < 80) return '#E6A23C'
      return '#F56C6C'
    },

    // 查询
    handleSearch() {
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset() {
      this.queryData = {
        tenantId: '',
        tenantName: '',
        quotaStatus: '',
        month: moment().format('YYYY-MM'),
        managerId: this.currentManagerId || ''
      }
      this.handleSearch()
    },

    // 处理下拉命令
    handleCommand(command) {
      switch (command) {
        case 'export':
          this.handleExport()
          break
        case 'import':
          this.$message.info('导入功能开发中...')
          break
        case 'history':
          this.$message.info('历史记录功能开发中...')
          break
      }
    },

    // 处理表格下拉命令
    handleTableCommand(command, row) {
      switch (command) {
        case 'history':
          this.handleHistory(row)
          break
        case 'freeze':
          this.handleFreeze(row)
          break
        case 'unfreeze':
          this.handleUnfreeze(row)
          break
        case 'reset':
          this.handleResetQuota(row)
          break
      }
    },

    // 新增额度
    handleAddQuota() {
      this.editForm = {
        id: '',
        tenantId: '',
        monthlyQuota: 0,
        reason: ''
      }
      this.dialogVisible = true
    },

    // 批量调整
    handleBatchAdjust() {
      if (this.selectedData.length === 0) {
        this.$message.warning('请先选择要调整的额度记录')
        return
      }
      this.$message.info('批量调整功能开发中...')
    },

    // 批量增加额度
    handleBatchIncrease() {
      if (this.selectedData.length === 0) {
        this.$message.warning('请先选择要增加额度的记录')
        return
      }
      
      this.batchIncreaseForm = {
        increaseAmount: 0,
        reason: ''
      }
      this.batchIncreaseVisible = true
    },

    // 批量重置
    handleBatchReset() {
      if (this.selectedData.length === 0) {
        this.$message.warning('请先选择要重置的额度记录')
        return
      }
      
      this.$confirm(`确定要重置所选 ${this.selectedData.length} 条额度记录吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('批量重置成功')
        this.fetchTableData()
        this.fetchStatistics()
      }).catch(() => {})
    },

    // 批量增加额度保存
    handleBatchIncreaseSave() {
      this.$refs.batchIncreaseForm.validate((valid) => {
        if (valid) {
          this.$confirm(`确定为所选 ${this.selectedData.length} 条记录增加 ${this.formatMoney(this.batchIncreaseForm.increaseAmount)} 额度吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }).then(() => {
            // 模拟保存操作
            this.selectedData.forEach(item => {
              item.monthlyQuota += this.batchIncreaseForm.increaseAmount
              item.remainingQuota += this.batchIncreaseForm.increaseAmount
              item.updateTime = moment().format('YYYY-MM-DD HH:mm:ss')
            })
            
            this.batchIncreaseVisible = false
            this.$message.success('批量增加额度成功')
            this.fetchTableData()
            this.fetchStatistics()
          }).catch(() => {})
        }
      })
    },

    // 编辑额度
    handleEdit(row) {
      this.editForm = {
        id: row.id,
        tenantId: row.tenantId,
        monthlyQuota: row.monthlyQuota,
        reason: ''
      }
      this.dialogVisible = true
    },

    // 保存编辑
    handleSave() {
      this.$refs.editForm.validate((valid) => {
        if (valid) {
          const action = this.editForm.id ? '调整' : '新增'
          this.$confirm(`确定要${action}该额度记录吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }).then(() => {
            this.dialogVisible = false
            this.$message.success(`${action}额度成功`)
            this.fetchTableData()
            this.fetchStatistics()
          }).catch(() => {})
        }
      })
    },

    // 查看明细
    handleViewDetail(row) {
      this.$message.info(`查看 ${row.tenantName} 的额度使用明细`)
      // 可以跳转到详情页面
      // this.$router.push({
      //   path: '/invoice-quota-detail',
      //   query: { tenantId: row.tenantId, month: this.queryData.month }
      // })
    },

    // 查看租户详情
    handleTenantDetail(row) {
      this.$message.info(`查看 ${row.tenantName} 的租户详情`)
      // this.$router.push({
      //   path: '/tenant-detail',
      //   query: { id: row.tenantId }
      // })
    },

    // 查看历史记录
    handleHistory(row) {
      this.$message.info(`查看 ${row.tenantName} 的额度调整历史`)
    },

    // 冻结额度
    handleFreeze(row) {
      this.$confirm(`确定要冻结 ${row.tenantName} 的发票额度吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        row.quotaStatus = 'frozen'
        this.$message.success('额度冻结成功')
        this.fetchTableData()
      }).catch(() => {})
    },

    // 解冻额度
    handleUnfreeze(row) {
      this.$confirm(`确定要解冻 ${row.tenantName} 的发票额度吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        // 重新计算状态
        const remaining = row.remainingQuota
        if (remaining <= 0) {
          row.quotaStatus = 'exhausted'
        } else if (remaining < row.monthlyQuota * 0.2) {
          row.quotaStatus = 'warning'
        } else {
          row.quotaStatus = 'normal'
        }
        this.$message.success('额度解冻成功')
        this.fetchTableData()
      }).catch(() => {})
    },

    // 重置额度
    handleResetQuota(row) {
      this.$confirm(`确定要重置 ${row.tenantName} 的发票额度吗？此操作将清空已使用记录！`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        row.issuedAmount = 0
        row.pendingAmount = 0
        row.remainingQuota = row.monthlyQuota
        row.usageRate = 0
        row.quotaStatus = 'normal'
        row.updateTime = moment().format('YYYY-MM-DD HH:mm:ss')
        this.$message.success('额度重置成功')
        this.fetchTableData()
        this.fetchStatistics()
      }).catch(() => {})
    },

    // 导出数据
    handleExport() {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }
      
      const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData
      
      const params = {
        ele: this.$refs.table?.$el,
        name: '发票额度管理.xlsx',
        data: exportData
      }
      
      if (this.$store && this.$store.dispatch) {
        this.$store.dispatch('export/export', params)
      } else {
        this.$message.info('导出功能开发中...')
      }
    },

    // 选择变化
    handleSelectionChange(selection) {
      this.selectedData = selection
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

// 统计卡片样式
.statistics-container {
  margin-bottom: 16px;
  
  .stat-card {
    background: #fff;
    border-radius: 6px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }
    
    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      
      .stat-title {
        font-size: 14px;
        color: #606266;
        font-weight: 500;
      }
      
      .stat-icon {
        font-size: 24px;
      }
    }
    
    .stat-content {
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 8px;
        line-height: 1;
      }
      
      .stat-desc {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

// 金额文字样式
.amount-text {
  font-weight: 500;
  color: #303133;
  
  &.text-primary {
    color: #409EFF;
  }
  
  &.text-success {
    color: #67C23A;
  }
  
  &.text-warning {
    color: #E6A23C;
  }
  
  &.text-danger {
    color: #F56C6C;
  }
}

// 进度条样式
.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .el-progress {
    flex: 1;
  }
  
  .progress-text {
    font-size: 12px;
    color: #606266;
    min-width: 35px;
  }
}

// 其他样式
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