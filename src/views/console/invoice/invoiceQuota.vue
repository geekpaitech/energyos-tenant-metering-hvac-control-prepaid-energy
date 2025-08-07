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
                  <!-- 选择框 - 发票类型 -->
                  <el-select
                    v-else-if="field.type === 'select' && field.prop === 'invoiceType'"
                    v-model="queryData[field.prop]"
                    placeholder="请选择发票类型"
                    clearable
                    size="small"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in invoiceTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
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
                      v-for="item in invoiceStatusOptions"
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
  
            <!-- 高级筛选 -->
            <el-collapse-transition v-if="needAdvancedSearch">
              <el-row :gutter="16" v-show="showAdvanced" class="search-row">
                <el-col
                  v-for="field in displayAdvancedFields"
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
                    <!-- 选择框 - 开票方式 -->
                    <el-select
                      v-else-if="field.type === 'select' && field.prop === 'billingMethod'"
                      v-model="queryData[field.prop]"
                      placeholder="请选择开票方式"
                      clearable
                      size="small"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="item in billingMethodOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-collapse-transition>
  
            <!-- 操作按钮行 -->
            <div class="form-actions compact-actions">
              <div class="action-left">
                <el-button
                  type="primary"
                  icon="el-icon-plus"
                  size="small"
                  @click="handleAddInvoice"
                >
                  新增开票申请
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
                    <el-dropdown-item command="batchAudit" icon="el-icon-s-check">
                      批量审核
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
              <el-button size="mini" @click="handleBatchPass">批量通过</el-button>
              <el-button size="mini" type="danger" plain @click="handleBatchReject">批量拒绝</el-button>
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
            
            <!-- 发票编号 -->
            <el-table-column
              prop="invoiceNo"
              label="发票编号"
              width="160"
              align="center"
              show-overflow-tooltip
              fixed="left"
            >
              <template slot-scope="scope">
                <el-link type="primary" @click="handleDetail(scope.row)">
                  {{ scope.row.invoiceNo || '-' }}
                </el-link>
              </template>
            </el-table-column>
            
            <!-- 申请日期 -->
            <el-table-column
              prop="applyDate"
              label="申请日期"
              width="120"
              align="center"
              show-overflow-tooltip
            />
            
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
            
            <!-- 租户名称 -->
            <el-table-column
              prop="tenantName"
              label="租户名称"
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
            
            <!-- 发票类型 -->
            <el-table-column
              prop="invoiceType"
              label="发票类型"
              width="120"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  v-if="scope.row.invoiceType === 1"
                  type="primary"
                  size="small"
                  effect="plain"
                >
                  增值税普通发票
                </el-tag>
                <el-tag
                  v-else-if="scope.row.invoiceType === 2"
                  type="warning"
                  size="small"
                  effect="plain"
                >
                  增值税专用发票
                </el-tag>
                <el-tag
                  v-else-if="scope.row.invoiceType === 3"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  电子发票
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            
            <!-- 发票抬头 -->
            <el-table-column
              prop="invoiceTitle"
              label="发票抬头"
              min-width="180"
              align="center"
              show-overflow-tooltip
            />
            
            <!-- 税号 -->
            <el-table-column
              prop="taxNumber"
              label="税号"
              width="180"
              align="center"
              show-overflow-tooltip
            />
            
            <!-- 开票金额 -->
            <el-table-column
              prop="amount"
              label="开票金额"
              width="120"
              align="center"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                <span class="amount-text text-warning">
                  {{ formatMoney(scope.row.amount) }}
                </span>
              </template>
            </el-table-column>
            
            <!-- 税额 -->
            <el-table-column
              prop="taxAmount"
              label="税额"
              width="100"
              align="center"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                <span class="amount-text">
                  {{ formatMoney(scope.row.taxAmount) }}
                </span>
              </template>
            </el-table-column>
            
            <!-- 价税合计 -->
            <el-table-column
              prop="totalAmount"
              label="价税合计"
              width="120"
              align="center"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                <span class="amount-text text-danger">
                  {{ formatMoney(scope.row.totalAmount) }}
                </span>
              </template>
            </el-table-column>
            
            <!-- 开票方式 -->
            <el-table-column
              prop="billingMethod"
              label="开票方式"
              width="100"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  :type="scope.row.billingMethod === 1 ? 'success' : 'info'"
                  size="small"
                >
                  {{ scope.row.billingMethod === 1 ? '自动开票' : '手动开票' }}
                </el-tag>
              </template>
            </el-table-column>
            
            <!-- 审核状态 -->
            <el-table-column
              prop="status"
              label="审核状态"
              width="120"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  v-if="scope.row.status === 0"
                  type="warning"
                  size="small"
                  effect="plain"
                >
                  待审核
                </el-tag>
                <el-tag
                  v-else-if="scope.row.status === 1"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  已通过
                </el-tag>
                <el-tag
                  v-else-if="scope.row.status === 2"
                  type="danger"
                  size="small"
                  effect="plain"
                >
                  已拒绝
                </el-tag>
                <el-tag
                  v-else-if="scope.row.status === 3"
                  type="primary"
                  size="small"
                  effect="plain"
                >
                  已开票
                </el-tag>
                <el-tag
                  v-else-if="scope.row.status === 4"
                  type="info"
                  size="small"
                  effect="plain"
                >
                  已作废
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            
            <!-- 审核人 -->
            <el-table-column
              prop="auditor"
              label="审核人"
              width="100"
              align="center"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                {{ scope.row.auditor || '-' }}
              </template>
            </el-table-column>
            
            <!-- 审核时间 -->
            <el-table-column
              prop="auditTime"
              label="审核时间"
              width="160"
              align="center"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                {{ scope.row.auditTime || '-' }}
              </template>
            </el-table-column>
  
            <!-- 操作列 -->
            <el-table-column
              label="操作"
              width="200"
              fixed="right"
              align="center"
            >
              <template slot-scope="scope">
                <div class="table-actions-group">
                  <!-- 待审核状态 -->
                  <template v-if="scope.row.status === 0">
                    <el-button
                      type="text"
                      size="small"
                      @click="handleAudit(scope.row)"
                    >
                      审核
                    </el-button>
                    <el-divider direction="vertical"></el-divider>
                  </template>
                  
                  <!-- 已通过状态 -->
                  <template v-if="scope.row.status === 1">
                    <el-button
                      type="text"
                      size="small"
                      @click="handleIssueInvoice(scope.row)"
                    >
                      开票
                    </el-button>
                    <el-divider direction="vertical"></el-divider>
                  </template>
                  
                  <!-- 已开票状态 -->
                  <template v-if="scope.row.status === 3">
                    <el-button
                      type="text"
                      size="small"
                      @click="handleVoidInvoice(scope.row)"
                    >
                      作废
                    </el-button>
                    <el-divider direction="vertical"></el-divider>
                  </template>
                  
                  <el-dropdown
                    trigger="click"
                    @command="handleTableCommand($event, scope.row)"
                  >
                    <el-button type="text" size="small">
                      更多
                      <i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="detail" icon="el-icon-view">
                        查看详情
                      </el-dropdown-item>
                      <el-dropdown-item 
                        v-if="scope.row.status === 4"
                        command="reissue" 
                        icon="el-icon-refresh"
                      >
                        重新开票
                      </el-dropdown-item>
                      <el-dropdown-item command="print" icon="el-icon-printer">
                        打印发票
                      </el-dropdown-item>
                      <el-dropdown-item command="download" icon="el-icon-download">
                        下载发票
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
    </div>
  </template>
  
  <script>
  import moment from 'moment'
  import { mapGetters } from 'vuex'
  
  // 发票状态枚举
  const invoiceStatusOptions = [
    { value: 0, label: '待审核' },
    { value: 1, label: '已通过' },
    { value: 2, label: '已拒绝' },
    { value: 3, label: '已开票' },
    { value: 4, label: '已作废' }
  ]
  
  // 发票类型枚举
  const invoiceTypeOptions = [
    { value: 1, label: '增值税普通发票' },
    { value: 2, label: '增值税专用发票' },
    { value: 3, label: '电子发票' }
  ]
  
  // 开票方式枚举
  const billingMethodOptions = [
    { value: 1, label: '自动开票' },
    { value: 2, label: '手动开票' }
  ]
  
  export default {
    name: 'InvoiceAudit',
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
          invoiceNo: '',
          tenantId: '',
          invoiceType: '',
          status: '',
          billingMethod: '',
          taxNumber: '',
          managerId: '',
          timeRange: [
            moment().subtract(1, 'months').format('YYYY-MM-DD'),
            moment().format('YYYY-MM-DD')
          ]
        },
        // 搜索字段配置
        searchFields: {
          basic: [
            { prop: 'invoiceNo', label: '发票编号', type: 'input' },
            { prop: 'tenantId', label: '租户', type: 'select', filterable: true },
            { prop: 'invoiceType', label: '发票类型', type: 'select' },
            { prop: 'status', label: '审核状态', type: 'select' },
            { prop: 'timeRange', label: '申请日期', type: 'daterange' }
          ],
          advanced: [
            { prop: 'taxNumber', label: '税号', type: 'input' },
            { prop: 'billingMethod', label: '开票方式', type: 'select' }
          ]
        },
        // 表格数据
        tableData: [],
        // 加载状态
        loading: false,
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
        // 枚举数据
        invoiceStatusOptions,
        invoiceTypeOptions,
        billingMethodOptions,
        // 租户列表（模拟数据）
        tenantList: []
      }
    },
    computed: {
      ...mapGetters('manager', ['currentManagerId']),
      // 判断是否需要显示高级筛选按钮
      needAdvancedSearch() {
        const totalFields = this.searchFields.basic.length + this.searchFields.advanced.length
        return totalFields > 5
      },
      // 显示的基础搜索字段
      displayBasicFields() {
        if (!this.needAdvancedSearch) {
          return [...this.searchFields.basic, ...this.searchFields.advanced]
        }
        return this.searchFields.basic
      },
      // 显示的高级搜索字段
      displayAdvancedFields() {
        return this.searchFields.advanced
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
      },
  
      // 获取租户列表（模拟数据 - 智慧园区）
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
  
      // 获取表格数据（模拟数据）
      async fetchTableData() {
        this.loading = true
        
        // 模拟异步请求
        setTimeout(() => {
          // 生成模拟数据
          const mockData = []
          const statusList = [0, 1, 2, 3, 4]
          const typeList = [1, 2, 3]
          const methodList = [1, 2]
          
          // 根据不同企业类型设置不同的金额范围
          const amountRanges = {
            'PKA001': { min: 50000, max: 500000 },   // 科技公司 - 中大额
            'PKB002': { min: 100000, max: 1000000 }, // 金融公司 - 大额
            'PKC003': { min: 10000, max: 100000 },   // 文化公司 - 中小额
            'PKD001': { min: 80000, max: 800000 },   // 医药研发 - 大额
            'PKE002': { min: 30000, max: 300000 },   // 环保科技 - 中额
            'PKF001': { min: 5000, max: 50000 }      // 餐饮服务 - 小额
          }
          
          for (let i = 1; i <= 50; i++) {
            const tenantIndex = Math.floor(Math.random() * this.tenantList.length)
            const tenant = this.tenantList[tenantIndex] || this.tenantList[0]
            const status = statusList[Math.floor(Math.random() * statusList.length)]
            
            // 根据租户类型获取金额范围
            const range = amountRanges[tenant.id] || { min: 10000, max: 100000 }
            const baseAmount = range.min + Math.random() * (range.max - range.min)
            
            // 计算税额（根据发票类型）
            const invoiceType = typeList[Math.floor(Math.random() * typeList.length)]
            let taxRate = 0.06 // 默认6%税率
            if (invoiceType === 2) {
              taxRate = 0.13 // 专票13%税率
            } else if (invoiceType === 3) {
              taxRate = 0.03 // 电子发票3%税率
            }
            
            const amount = parseFloat(baseAmount.toFixed(2))
            const taxAmount = parseFloat((amount * taxRate).toFixed(2))
            const totalAmount = parseFloat((amount + taxAmount).toFixed(2))
            
            mockData.push({
              id: i,
              invoiceNo: `INV${moment().format('YYYYMM')}${String(i).padStart(4, '0')}`,
              applyDate: moment().subtract(Math.floor(Math.random() * 30), 'days').format('YYYY-MM-DD'),
              tenantId: tenant.id,
              tenantName: tenant.name,
              invoiceType: invoiceType,
              invoiceTitle: tenant.name,
              taxNumber: `91110000${Math.random().toString().substr(2, 9)}`,
              amount: amount,
              taxAmount: taxAmount,
              totalAmount: totalAmount,
              billingMethod: methodList[Math.floor(Math.random() * methodList.length)],
              status: status,
              auditor: status > 0 ? `审核员${Math.floor(Math.random() * 10) + 1}` : null,
              auditTime: status > 0 ? moment().subtract(Math.floor(Math.random() * 20), 'days').format('YYYY-MM-DD HH:mm:ss') : null,
              remark: this.generateRemark(tenant.id, amount)
            })
          }
          
          // 根据查询条件过滤数据
          let filteredData = [...mockData]
          
          // 发票编号过滤
          if (this.queryData.invoiceNo) {
            filteredData = filteredData.filter(item => 
              item.invoiceNo.includes(this.queryData.invoiceNo)
            )
          }
          
          // 租户过滤
          if (this.queryData.tenantId) {
            filteredData = filteredData.filter(item => 
              item.tenantId === this.queryData.tenantId
            )
          }
          
          // 发票类型过滤
          if (this.queryData.invoiceType !== '') {
            filteredData = filteredData.filter(item => 
              item.invoiceType === this.queryData.invoiceType
            )
          }
          
          // 状态过滤
          if (this.queryData.status !== '') {
            filteredData = filteredData.filter(item => 
              item.status === this.queryData.status
            )
          }
          
          // 开票方式过滤
          if (this.queryData.billingMethod !== '') {
            filteredData = filteredData.filter(item => 
              item.billingMethod === this.queryData.billingMethod
            )
          }
          
          // 税号过滤
          if (this.queryData.taxNumber) {
            filteredData = filteredData.filter(item => 
              item.taxNumber.includes(this.queryData.taxNumber)
            )
          }
          
          // 日期范围过滤
          if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
            const [startDate, endDate] = this.queryData.timeRange
            filteredData = filteredData.filter(item => {
              const applyDate = moment(item.applyDate)
              return applyDate.isSameOrAfter(startDate) && applyDate.isSameOrBefore(endDate)
            })
          }
          
          // 分页处理
          this.pageData.total = filteredData.length
          const start = (this.pageData.current - 1) * this.pageData.size
          const end = start + this.pageData.size
          this.tableData = filteredData.slice(start, end)
          
          this.loading = false
        }, 800)
      },
  
      // 生成备注信息
      generateRemark(tenantId, amount) {
        const remarkTemplates = {
          'PKA001': ['软件服务费', '技术开发费', '云服务费', '系统维护费'],
          'PKB002': ['咨询服务费', '金融服务费', '平台使用费', '数据服务费'],
          'PKC003': ['设计服务费', '策划费', '宣传推广费', '版权费'],
          'PKD001': ['研发费用', '检测费', '实验材料费', '技术服务费'],
          'PKE002': ['环保服务费', '节能改造费', '碳排放服务费', '环境监测费'],
          'PKF001': ['餐饮服务费', '物业管理费', '场地租赁费', '水电费']
        }
        
        const templates = remarkTemplates[tenantId] || ['服务费']
        const template = templates[Math.floor(Math.random() * templates.length)]
        const month = moment().subtract(Math.floor(Math.random() * 3), 'months').format('YYYY年MM月')
        
        return `${month}${template}`
      },
  
      // 格式化金额
      formatMoney(value) {
        if (value === null || value === undefined || value === '') {
          return '-'
        }
        return `¥${parseFloat(value).toFixed(2)}`
      },
  
      // 查询
      handleSearch() {
        this.pageData.current = 1
        this.fetchTableData()
      },
  
      // 重置
      handleReset() {
        this.queryData = {
          invoiceNo: '',
          tenantId: '',
          invoiceType: '',
          status: '',
          billingMethod: '',
          taxNumber: '',
          managerId: this.currentManagerId || '',
          timeRange: [
            moment().subtract(1, 'months').format('YYYY-MM-DD'),
            moment().format('YYYY-MM-DD')
          ]
        }
        this.showAdvanced = false
        this.handleSearch()
      },
  
      // 处理下拉命令
      handleCommand(command) {
        switch (command) {
          case 'export':
            this.handleExport()
            break
          case 'batchAudit':
            this.handleBatchAudit()
            break
        }
      },
  
      // 处理表格下拉命令
      handleTableCommand(command, row) {
        switch (command) {
          case 'detail':
            this.handleDetail(row)
            break
          case 'reissue':
            this.handleReissue(row)
            break
          case 'print':
            this.handlePrint(row)
            break
          case 'download':
            this.handleDownload(row)
            break
        }
      },
  
      // 新增开票申请
      handleAddInvoice() {
        this.$message.info('新增开票申请功能开发中...')
        // this.$router.push('/invoice-apply')
      },
  
      // 导出
      handleExport() {
        if (this.tableData.length === 0) {
          this.$message.warning('暂无数据可导出')
          return
        }
        
        const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData
        
        const params = {
          ele: this.$refs.table?.$el,
          name: '发票审核.xlsx',
          data: exportData
        }
        
        if (this.$store && this.$store.dispatch) {
          this.$store.dispatch('export/export', params)
        } else {
          this.$message.info('导出功能开发中...')
        }
      },
  
      // 批量审核
      handleBatchAudit() {
        if (this.selectedData.length === 0) {
          this.$message.warning('请先选择要审核的发票')
          return
        }
        
        const pendingCount = this.selectedData.filter(item => item.status === 0).length
        if (pendingCount === 0) {
          this.$message.warning('所选发票中没有待审核的发票')
          return
        }
        
        this.$message.info(`批量审核 ${pendingCount} 条发票...`)
      },
  
      // 批量通过
      handleBatchPass() {
        const pendingData = this.selectedData.filter(item => item.status === 0)
        if (pendingData.length === 0) {
          this.$message.warning('所选发票中没有待审核的发票')
          return
        }
        
        this.$confirm(`确定要批量通过 ${pendingData.length} 条发票申请吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$message.success('批量审核通过成功')
          this.fetchTableData()
        }).catch(() => {})
      },
  
      // 批量拒绝
      handleBatchReject() {
        const pendingData = this.selectedData.filter(item => item.status === 0)
        if (pendingData.length === 0) {
          this.$message.warning('所选发票中没有待审核的发票')
          return
        }
        
        this.$confirm(`确定要批量拒绝 ${pendingData.length} 条发票申请吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$message.success('批量拒绝成功')
          this.fetchTableData()
        }).catch(() => {})
      },
  
      // 审核
      handleAudit(row) {
        this.$confirm('请选择审核操作', '发票审核', {
          distinguishCancelAndClose: true,
          confirmButtonText: '通过',
          cancelButtonText: '拒绝',
          type: 'info'
        }).then(() => {
          this.$message.success('审核通过成功')
          row.status = 1
          row.auditor = '当前用户'
          row.auditTime = moment().format('YYYY-MM-DD HH:mm:ss')
        }).catch(action => {
          if (action === 'cancel') {
            this.$message.error('审核已拒绝')
            row.status = 2
            row.auditor = '当前用户'
            row.auditTime = moment().format('YYYY-MM-DD HH:mm:ss')
          }
        })
      },
  
      // 开票
      handleIssueInvoice(row) {
        this.$confirm(`确定要为发票编号 ${row.invoiceNo} 开票吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$message.success('开票成功')
          row.status = 3
          this.fetchTableData()
        }).catch(() => {})
      },
  
      // 作废发票
      handleVoidInvoice(row) {
        this.$confirm(`确定要作废发票编号 ${row.invoiceNo} 吗？此操作不可恢复！`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$message.success('发票作废成功')
          row.status = 4
          this.fetchTableData()
        }).catch(() => {})
      },
  
      // 重新开票
      handleReissue(row) {
        this.$confirm(`确定要重新开具发票编号 ${row.invoiceNo} 吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }).then(() => {
          this.$message.success('重新开票申请已提交')
          row.status = 0
          row.auditor = null
          row.auditTime = null
          this.fetchTableData()
        }).catch(() => {})
      },
  
      // 打印发票
      handlePrint(row) {
        this.$message.info(`打印发票 ${row.invoiceNo}...`)
        // window.print() 或其他打印逻辑
      },
  
      // 下载发票
      handleDownload(row) {
        this.$message.success(`开始下载发票 ${row.invoiceNo}`)
        // 实际下载逻辑
      },
  
      // 详情
      handleDetail(row) {
        this.$message.info(`查看发票 ${row.invoiceNo} 详情`)
        // this.$router.push({
        //   path: '/invoice-detail',
        //   query: { id: row.id, invoiceNo: row.invoiceNo }
        // })
      },
  
      // 查看租户详情
      handleTenantDetail(row) {
        this.$router.push({
          path: '/control-tenement-detail',
          query: { 
            id: row.tenantId,
            managerId: row.managerId || this.queryData.managerId
          }
        })
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
  
  // 自定义样式补充
  .amount-text {
    font-weight: 500;
    color: #303133;
    
    &.text-danger {
      color: #F56C6C;
    }
    
    &.text-warning {
      color: #E6A23C;
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