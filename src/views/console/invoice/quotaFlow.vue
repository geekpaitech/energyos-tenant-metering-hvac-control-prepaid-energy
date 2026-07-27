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
                <!-- 企业选择 -->
                <el-select
                  v-if="field.type === 'select' && field.prop === 'companyId'"
                  v-model="queryData[field.prop]"
                  placeholder="请选择企业"
                  clearable
                  size="small"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="item in companyList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>

                <!-- 流水类型选择 -->
                <el-select
                  v-else-if="field.type === 'select' && field.prop === 'flowType'"
                  v-model="queryData[field.prop]"
                  placeholder="请选择流水类型"
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in flowTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>

                <!-- 业务类型选择 -->
                <el-select
                  v-else-if="field.type === 'select' && field.prop === 'businessType'"
                  v-model="queryData[field.prop]"
                  placeholder="请选择业务类型"
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in businessTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>

                <!-- 日期范围选择器 -->
                <el-date-picker
                  v-else-if="field.type === 'daterange'"
                  v-model="queryData[field.prop]"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="yyyy-MM-dd"
                  size="small"
                  style="width: 100%"
                />

                <!-- 文本输入框 -->
                <el-input
                  v-else-if="field.type === 'input'"
                  v-model="queryData[field.prop]"
                  :placeholder="field.placeholder || '请输入'"
                  clearable
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
              <el-divider direction="vertical" style="margin: 0 8px"></el-divider>
              <el-dropdown trigger="click" @command="handleCommand">
                <el-button size="small" type="text" style="padding: 7px 12px">
                  更多操作 <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="export" icon="el-icon-download">
                    导出数据
                  </el-dropdown-item>
                  <el-dropdown-item command="statistics" icon="el-icon-data-analysis">
                    统计分析
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
              <!-- 流水号 -->
              <template v-if="col.key === 'flowNo'">
                <span class="text-primary">{{ scope.row.flowNo || "-" }}</span>
              </template>

              <!-- 企业名称 -->
              <template v-else-if="col.key === 'companyName'">
                <el-link type="primary">
                  {{ scope.row.companyName || "-" }}
                </el-link>
              </template>

              <!-- 流水类型 -->
              <template v-else-if="col.key === 'flowTypeLabel'">
                <el-tag
                  :type="getFlowTypeTagType(scope.row.flowType)"
                  size="small"
                  effect="plain"
                >
                  {{ scope.row.flowTypeLabel || "-" }}
                </el-tag>
              </template>

              <!-- 业务类型 -->
              <template v-else-if="col.key === 'businessTypeLabel'">
                <el-tag type="info" size="small" effect="plain">
                  {{ scope.row.businessTypeLabel || "-" }}
                </el-tag>
              </template>

              <!-- 金额类字段 -->
              <template v-else-if="col.type === 'money'">
                <span class="amount-text" :class="getAmountClass(scope.row.flowType)">
                  {{ formatMoney(scope.row[col.key]) }}
                </span>
              </template>

              <!-- 状态字段 -->
              <template v-else-if="col.key === 'status'">
                <el-tag
                  :type="getStatusType(scope.row.status)"
                  size="small"
                  effect="plain"
                >
                  {{ getStatusLabel(scope.row.status) }}
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
            width="120"
            align="center"
            fixed="right"
          >
            <template slot-scope="scope">
              <el-button
                type="text"
                size="small"
                @click="handleView(scope.row)"
              >
                详情
              </el-button>
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

    <!-- 详情抽屉组件 -->
    <el-drawer
      :title="drawerTitle"
      :visible.sync="detailDrawer.show"
      :size="'50%'"
      :before-close="handleDrawerClose"
    >
      <div class="drawer-content" v-if="detailDrawer.data">
        <!-- 发票额度流水详情 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="流水号">
            {{ detailDrawer.data.flowNo }}
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">
            {{ detailDrawer.data.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="企业名称">
            {{ detailDrawer.data.companyName }}
          </el-descriptions-item>
          <el-descriptions-item label="流水类型">
            <el-tag
              :type="getFlowTypeTagType(detailDrawer.data.flowType)"
              size="small"
            >
              {{ detailDrawer.data.flowTypeLabel }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="业务类型">
            {{ detailDrawer.data.businessTypeLabel }}
          </el-descriptions-item>
          <el-descriptions-item label="变动金额">
            <span class="amount-text" :class="getAmountClass(detailDrawer.data.flowType)">
              {{ formatMoney(detailDrawer.data.amount) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="变动前余额">
            {{ formatMoney(detailDrawer.data.beforeBalance) }}
          </el-descriptions-item>
          <el-descriptions-item label="变动后余额">
            {{ formatMoney(detailDrawer.data.afterBalance) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="getStatusType(detailDrawer.data.status)"
              size="small"
            >
              {{ getStatusLabel(detailDrawer.data.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="业务单据号" v-if="detailDrawer.data.businessNo">
            {{ detailDrawer.data.businessNo }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" v-if="detailDrawer.data.remark">
            {{ detailDrawer.data.remark }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script>
// 导入API（需要根据实际情况调整）
// import {
//   getCompanyList,
//   getInvoiceQuotaFlowPage,
//   getInvoiceQuotaFlowDetail,
// } from "@/api/invoice";

import { mapGetters } from 'vuex'
import moment from 'moment'

export default {
  name: 'InvoiceQuotaFlow',
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
        companyId: '',
        flowType: '',
        businessType: '',
        timeRange: [],
        flowNo: ''
      },

      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: 'flowType', label: '流水类型', type: 'select' },
          { prop: 'businessType', label: '业务类型', type: 'select' },
          { prop: 'timeRange', label: '日期范围', type: 'daterange' },
          { prop: 'flowNo', label: '流水号', type: 'input', placeholder: '请输入流水号' }
        ],
        advanced: []
      },

      // 企业列表
      companyList: [],

      // 流水类型选项
      flowTypeOptions: [
        { label: '全部', value: '' },
        { label: '充值', value: 1 },
        { label: '扣费', value: 2 },
        { label: '退款', value: 3 },
        { label: '冻结', value: 4 },
        { label: '解冻', value: 5 }
      ],

      // 业务类型选项
      businessTypeOptions: [
        { label: '全部', value: '' },
        { label: '发票开具', value: 1 },
        { label: '发票作废', value: 2 },
        { label: '发票红冲', value: 3 },
        { label: '手动调整', value: 4 },
        { label: '系统充值', value: 5 }
      ],

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

      // 详情抽屉
      detailDrawer: {
        show: false,
        data: null
      },

      // 状态枚举
      statusMap: {
        0: { label: '处理中', type: 'warning' },
        1: { label: '成功', type: 'success' },
        2: { label: '失败', type: 'danger' }
      },

      // 流水类型标签类型映射
      flowTypeTagMap: {
        1: 'success', // 充值
        2: 'danger', // 扣费
        3: 'warning', // 退款
        4: 'info', // 冻结
        5: 'primary' // 解冻
      },

      // 表格列配置
      tableKey: [
        {
          label: '流水号',
          key: 'flowNo',
          width: '180',
          checked: true,
          disabled: true
        },
        {
          label: '发生时间',
          key: 'createTime',
          width: '160',
          checked: true
        },
        {
          label: '企业名称',
          key: 'companyName',
          minWidth: '200',
          checked: true,
          disabled: true
        },
        {
          label: '流水类型',
          key: 'flowTypeLabel',
          width: '120',
          checked: true
        },
        {
          label: '业务类型',
          key: 'businessTypeLabel',
          width: '120',
          checked: true
        },
        {
          label: '变动金额',
          key: 'amount',
          width: '140',
          checked: true,
          type: 'money'
        },
        {
          label: '变动前余额',
          key: 'beforeBalance',
          width: '140',
          checked: true,
          type: 'money'
        },
        {
          label: '变动后余额',
          key: 'afterBalance',
          width: '140',
          checked: true,
          type: 'money'
        },
        {
          label: '状态',
          key: 'status',
          width: '100',
          checked: true
        },
        {
          label: '备注',
          key: 'remark',
          width: '150',
          checked: true
        }
      ]
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),

    // 显示的列
    displayColumns () {
      return this.tableKey.filter((col) => col.checked !== false)
    },

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
    },

    // 抽屉标题
    drawerTitle () {
      return '发票额度流水详情'
    }
  },

  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.setEmptyData()
        }
      },
      immediate: true
    }
  },

  created () {
    // 初始化日期范围为最近一个月
    this.queryData.timeRange = [
      moment().subtract(1, 'months').format('YYYY-MM-DD'),
      moment().format('YYYY-MM-DD')
    ]

    // 如果路由带有managerId参数
    if (this.$route.query.managerId) {
      console.log('Route managerId:', this.$route.query.managerId)
    }
  },

  methods: {
    // 获取企业列表
    async getCompanyList () {
      try {
        this.companyList = []
      } catch (error) {
        console.error('获取企业列表失败:', error)
        this.$message.error('获取企业列表失败')
        this.companyList = []
      }
    },

    // 获取表格数据
    async fetchTableData () {
      this.setEmptyData()
    },

    setEmptyData () {
      this.loading = false
      this.companyList = []
      this.tableData = []
      this.pageData.total = 0
      this.selectedData = []
    },

    // 格式化金额
    formatMoney (value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return `¥${parseFloat(value).toFixed(2)}`
    },

    // 获取流水类型标签类型
    getFlowTypeTagType (flowType) {
      return this.flowTypeTagMap[flowType] || 'info'
    },

    // 获取金额样式类
    getAmountClass (flowType) {
      if (flowType === 1 || flowType === 3 || flowType === 5) {
        return 'text-success' // 充值、退款、解冻 - 绿色
      } else if (flowType === 2 || flowType === 4) {
        return 'text-danger' // 扣费、冻结 - 红色
      }
      return ''
    },

    // 获取状态标签类型
    getStatusType (status) {
      return this.statusMap[status]?.type || 'info'
    },

    // 获取状态标签文本
    getStatusLabel (status) {
      return this.statusMap[status]?.label || '未知'
    },

    // 查询
    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset () {
      this.queryData = {
        companyId: '',
        flowType: '',
        businessType: '',
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ],
        flowNo: ''
      }
      this.handleSearch()
    },

    // 处理下拉命令
    handleCommand (command) {
      switch (command) {
        case 'export':
          this.handleExport()
          break
        case 'statistics':
          this.handleStatistics()
          break
      }
    },

    // 查看详情
    async handleView (row) {
      try {
        this.detailDrawer.data = row
        this.detailDrawer.show = true

        // 可以在这里调用详情接口获取更多信息
        // const params = {
        //   flowNo: row.flowNo,
        //   managerId: this.currentManagerId,
        // };

        // const response = await getInvoiceQuotaFlowDetail(params);
        // if (response.code === 200 && response.data) {
        //   this.detailDrawer.data = {
        //     ...row,
        //     ...response.data
        //   };
        // }
      } catch (error) {
        console.error('获取详情失败:', error)
        this.$message.error('获取详情失败')
      }
    },

    // 关闭抽屉
    handleDrawerClose (done) {
      this.detailDrawer.show = false
      this.detailDrawer.data = null
      done()
    },

    // 导出数据
    handleExport () {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }

      // 导出功能
      const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData

      // 构建导出数据
      const params = {
        ele: this.$el.querySelector('.el-table'),
        name: '发票额度流水.xlsx',
        data: exportData
      }

      // 调用导出方法
      if (this.$store && this.$store.dispatch) {
        this.$store.dispatch('export/export', params)
      } else {
        this.$message.info('导出功能开发中...')
      }
    },

    // 统计分析
    handleStatistics () {
      this.$message.info('统计分析功能开发中...')
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

  &.text-success {
    color: #67C23A;
  }

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

// 抽屉内容样式
.drawer-content {
  padding: 20px;

  .el-descriptions {
    margin-top: 20px;
  }
}

// 状态标签样式
.el-tag {
  &.el-tag--plain {
    border-width: 1px;
  }
}

// 流水类型标签特殊样式
.el-tag {
  &.el-tag--success.el-tag--plain {
    color: #67C23A;
    border-color: #67C23A;
    background-color: #f0f9ff;
  }

  &.el-tag--danger.el-tag--plain {
    color: #F56C6C;
    border-color: #F56C6C;
    background-color: #fef0f0;
  }
}
</style>
