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
                  <!-- 流水类型选项 -->
                  <template v-if="field.prop === 'flowType'">
                    <el-option label="全部" value="" />
                    <el-option label="收入" value="1" />
                    <el-option label="支出" value="2" />
                    <el-option label="转账" value="3" />
                  </template>
                  <!-- 流水状态选项 -->
                  <template v-else-if="field.prop === 'status'">
                    <el-option label="全部" value="" />
                    <el-option label="处理中" value="1" />
                    <el-option label="成功" value="2" />
                    <el-option label="失败" value="3" />
                  </template>
                  <!-- 账户类型选项 -->
                  <template v-else-if="field.prop === 'accountType'">
                    <el-option label="全部" value="" />
                    <el-option label="银行账户" value="1" />
                    <el-option label="支付宝" value="2" />
                    <el-option label="微信支付" value="3" />
                    <el-option label="现金" value="4" />
                  </template>
                </el-select>
                <!-- 日期范围选择器 -->
                <el-date-picker
                  v-else-if="field.type === 'daterange'"
                  v-model="queryData[field.prop]"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  style="width: 100%"
                  format="yyyy-MM-dd"
                  value-format="yyyy-MM-dd"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 高级筛选 - 只在需要时显示 -->
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
                    <!-- 账户类型选项 -->
                    <template v-if="field.prop === 'accountType'">
                      <el-option label="全部" value="" />
                      <el-option label="银行账户" value="1" />
                      <el-option label="支付宝" value="2" />
                      <el-option label="微信支付" value="3" />
                      <el-option label="现金" value="4" />
                    </template>
                  </el-select>
                </el-form-item>
              </el-col>
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
                记录流水
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
          :max-height="tableMaxHeight"
          v-loading="loading"
          :data="tableData"
          stripe
          style="width: 100%"
          class="custom-table"
          @selection-change="handleSelectionChange"
          :header-cell-style="{
            background: 'linear-gradient(180deg, #f8f9fc 0%, #f0f2f5 100%)',
            color: '#1f2329',
            fontWeight: '600',
            fontSize: '13px',
            borderBottom: '2px solid #e8e8e8'
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
              <!-- 流水编号 -->
              <template v-if="col.key === 'flowNo'">
                <el-link type="primary" @click="handleViewDetail(scope.row)">
                  <i class="el-icon-view"></i>
                  {{ scope.row.flowNo || "-" }}
                </el-link>
              </template>

              <!-- 流水类型 -->
              <template v-else-if="col.key === 'flowTypeLabel'">
                <el-tag
                  v-if="scope.row.flowType == 1"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  <i class="el-icon-top flow-type-icon"></i>
                  收入
                </el-tag>
                <el-tag
                  v-else-if="scope.row.flowType == 2"
                  type="danger"
                  size="small"
                  effect="plain"
                >
                  <i class="el-icon-bottom flow-type-icon"></i>
                  支出
                </el-tag>
                <el-tag
                  v-else-if="scope.row.flowType == 3"
                  type="warning"
                  size="small"
                  effect="plain"
                >
                  <i class="el-icon-refresh flow-type-icon"></i>
                  转账
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 金额 -->
              <template v-else-if="col.key === 'amount'">
                <div class="amount-cell">
                  <span v-if="scope.row.flowType == 1" class="amount-positive">
                    <i class="el-icon-plus amount-icon"></i>
                    ¥{{ formatAmount(scope.row.amount) }}
                  </span>
                  <span v-else-if="scope.row.flowType == 2" class="amount-negative">
                    <i class="el-icon-minus amount-icon"></i>
                    ¥{{ formatAmount(scope.row.amount) }}
                  </span>
                  <span v-else>
                    ¥{{ formatAmount(scope.row.amount) }}
                  </span>
                </div>
              </template>

              <!-- 流水状态 -->
              <template v-else-if="col.key === 'statusLabel'">
                <el-tag
                  v-if="scope.row.status == 1"
                  type="warning"
                  size="small"
                >
                  处理中
                </el-tag>
                <el-tag
                  v-else-if="scope.row.status == 2"
                  type="success"
                  size="small"
                >
                  成功
                </el-tag>
                <el-tag
                  v-else-if="scope.row.status == 3"
                  type="danger"
                  size="small"
                >
                  失败
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 账户信息 -->
              <template v-else-if="col.key === 'accountInfo'">
                <el-link 
                  type="primary" 
                  @click="handleAccountClick(scope.row)"
                  class="fund-account-link"
                >
                  <i 
                    :class="getAccountIcon(scope.row.accountType)"
                    style="margin-right: 4px"
                  ></i>
                  {{ getAccountTypeLabel(scope.row.accountType) }}
                  <br>
                  <small style="color: #909399;">{{ scope.row.accountNo || "-" }}</small>
                </el-link>
              </template>

              <!-- 账户类型 -->
              <template v-else-if="col.key === 'accountTypeLabel'">
                <el-tag
                  :type="getAccountTagType(scope.row.accountType)"
                  size="small"
                  effect="plain"
                >
                  {{ getAccountTypeLabel(scope.row.accountType) }}
                </el-tag>
              </template>

              <!-- 余额 -->
              <template v-else-if="col.key === 'balance'">
                <span style="font-weight: bold;">
                  ¥{{ formatAmount(scope.row.balance) }}
                </span>
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
            width="200"
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <div class="table-actions-group">
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-view"
                  @click="handleViewDetail(scope.row)"
                >
                  详情
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
                    <el-dropdown-item 
                      v-if="scope.row.status == 1"
                      command="cancel" 
                      icon="el-icon-close"
                    >
                      取消流水
                    </el-dropdown-item>
                    <el-dropdown-item 
                      command="print" 
                      icon="el-icon-printer"
                    >
                      打印凭证
                    </el-dropdown-item>
                    <el-dropdown-item 
                      command="copy" 
                      icon="el-icon-document-copy"
                      divided
                    >
                      复制流水
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
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
      :title="editForm.id ? '编辑流水' : '新增流水'"
      :visible.sync="dialogVisible"
      width="680px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form
        ref="editForm"
        :model="editForm"
        :rules="rules"
        label-width="110px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="流水类型" prop="flowType">
              <el-select
                v-model="editForm.flowType"
                placeholder="请选择流水类型"
                style="width: 100%"
              >
                <el-option
                  v-for="item in FlowType"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input
                v-model="editForm.amount"
                placeholder="请输入金额"
                type="number"
                step="0.01"
              >
                <template slot="prepend">¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账户类型" prop="accountType">
              <el-select
                v-model="editForm.accountType"
                placeholder="请选择账户类型"
                style="width: 100%"
              >
                <el-option
                  v-for="item in AccountType"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账户号码" prop="accountNo">
              <el-input
                v-model="editForm.accountNo"
                placeholder="请输入账户号码"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="交易对象">
              <el-input
                v-model="editForm.counterparty"
                placeholder="请输入交易对象"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交易时间" prop="transactionTime">
              <el-date-picker
                v-model="editForm.transactionTime"
                type="datetime"
                placeholder="选择交易时间"
                style="width: 100%"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注说明">
              <el-input
                v-model="editForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注说明"
              />
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
import { mapGetters } from "vuex";

// 流水类型枚举
const FlowType = [
  { value: 1, label: "收入" },
  { value: 2, label: "支出" },
  { value: 3, label: "转账" },
];

// 流水状态枚举
const FlowStatus = [
  { value: 1, label: "处理中" },
  { value: 2, label: "成功" },
  { value: 3, label: "失败" },
];

// 账户类型枚举
const AccountType = [
  { value: 1, label: "银行账户" },
  { value: 2, label: "支付宝" },
  { value: 3, label: "微信支付" },
  { value: 4, label: "现金" },
];

export default {
  name: "FundFlowManagement",
  data() {
    return {
      tableHeightConfig: {
        headerHeight: 48, // 表头高度
        rowHeight: 47, // 每行高度
        minHeight: 200, // 最小高度
        maxRows: 10, // 最大显示行数（超过9行显示滚动条）
        paginationHeight: 68, // 分页高度
      },
      // 查询参数
      queryData: {
        flowNo: "",
        flowType: "",
        status: "",
        accountType: "",
        counterparty: "",
        dateRange: [],
        accountNo: "",
        amountMin: "",
        amountMax: "",
        managerId: "",
      },
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: "flowNo", label: "流水编号", type: "input" },
          { prop: "flowType", label: "流水类型", type: "select" },
          { prop: "status", label: "流水状态", type: "select" },
          { prop: "dateRange", label: "交易时间", type: "daterange" },
        ],
        advanced: [
          { prop: "accountType", label: "账户类型", type: "select" },
          { prop: "counterparty", label: "交易对象", type: "input" },
          { prop: "amountMin", label: "最小金额", type: "input" },
          { prop: "amountMax", label: "最大金额", type: "input" },
        ],
      },
      // 表格数据
      tableData: [],
      // 模拟数据
      mockData: [
  
      ],
      // 加载状态
      loading: false,
      submitting: false,
      // 是否显示高级筛选
      showAdvanced: false,
      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0,
      },
      // 选中的数据
      selectedData: [],
      // 编辑弹窗
      dialogVisible: false,
      // 编辑表单
      editForm: {
        id: "",
        flowType: "",
        amount: "",
        accountType: "",
        accountNo: "",
        counterparty: "",
        transactionTime: "",
        remark: "",
        managerId: "",
      },
      // 表单验证规则
      rules: {
        flowType: [
          { required: true, message: "请选择流水类型", trigger: "change" },
        ],
        amount: [
          { required: true, message: "请输入金额", trigger: "blur" },
        ],
        accountType: [
          { required: true, message: "请选择账户类型", trigger: "change" },
        ],
        accountNo: [
          { required: true, message: "请输入账户号码", trigger: "blur" },
        ],
        transactionTime: [
          { required: true, message: "请选择交易时间", trigger: "change" },
        ],
      },
      // 枚举数据
      FlowType,
      FlowStatus,
      AccountType,
      // 表格列配置
      tableKey: [
        {
          label: "流水编号",
          key: "flowNo",
          width: "160",
          checked: true,
          disabled: true,
        },
        {
          label: "流水类型",
          key: "flowTypeLabel",
          width: "120",
          checked: true,
        },
        {
          label: "金额",
          key: "amount",
          width: "150",
          checked: true,
          disabled: true,
        },
        {
          label: "账户信息",
          key: "accountInfo",
          width: "200",
          checked: true,
        },
        {
          label: "交易对象",
          key: "counterparty",
          width: "150",
          checked: true,
        },
        {
          label: "流水状态",
          key: "statusLabel",
          width: "120",
          checked: true,
        },
        {
          label: "交易时间",
          key: "transactionTime",
          width: "180",
          checked: true,
        },
        {
          label: "余额",
          key: "balance",
          width: "150",
          checked: true,
        },
        {
          label: "备注",
          key: "remark",
          width: "200",
        },
        {
          label: "创建时间",
          key: "createTime",
          width: "180",
        },
      ],
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    treeSelectedIds() {
      const ids = this.$store.state.treeSelection?.selectedIds || [];
      console.log("实时获取树形选中ID:", ids);
      return ids;
    },
    hasTreeSelection() {
      return this.treeSelectedIds.length > 0;
    },
    // 计算需要显示的列
    displayColumns() {
      return this.tableKey.filter((col) => col.checked !== false);
    },
    dataLength() {
      return this.tableData.length;
    },
    // 判断是否需要显示高级筛选按钮
    needAdvancedSearch() {
      // 当总搜索字段数量大于4个时显示高级筛选
      const totalFields =
        this.searchFields.basic.length + this.searchFields.advanced.length;
      return totalFields > 4;
    },
    // 获取实际显示的基础搜索字段
    displayBasicFields() {
      // 如果不需要高级筛选，显示所有字段
      if (!this.needAdvancedSearch) {
        return [...this.searchFields.basic, ...this.searchFields.advanced];
      }
      // 否则只显示基础字段
      return this.searchFields.basic;
    },
    // 获取高级搜索字段
    displayAdvancedFields() {
      return this.searchFields.advanced;
    },
    tableMaxHeight() {
      // 始终返回最大高度（9行 + 表头）
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      );
    },
  },
  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.queryData.managerId = newVal;
          this.fetchTableData();
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.fetchTableData();
  },
  methods: {
    // 获取流水列表数据
    async fetchTableData() {
      this.loading = true;
      try {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 使用模拟数据
        let filteredData = [...this.mockData];
        
        // 应用筛选条件
        if (this.queryData.flowNo) {
          filteredData = filteredData.filter(item => 
            item.flowNo.includes(this.queryData.flowNo.trim())
          );
        }
        if (this.queryData.flowType) {
          filteredData = filteredData.filter(item => 
            item.flowType == this.queryData.flowType
          );
        }
        if (this.queryData.status) {
          filteredData = filteredData.filter(item => 
            item.status == this.queryData.status
          );
        }
        if (this.queryData.accountType) {
          filteredData = filteredData.filter(item => 
            item.accountType == this.queryData.accountType
          );
        }
        if (this.queryData.counterparty) {
          filteredData = filteredData.filter(item => 
            item.counterparty.includes(this.queryData.counterparty.trim())
          );
        }
        if (this.queryData.amountMin) {
          filteredData = filteredData.filter(item => 
            item.amount >= parseFloat(this.queryData.amountMin)
          );
        }
        if (this.queryData.amountMax) {
          filteredData = filteredData.filter(item => 
            item.amount <= parseFloat(this.queryData.amountMax)
          );
        }
        if (this.queryData.dateRange && this.queryData.dateRange.length === 2) {
          const startDate = this.queryData.dateRange[0];
          const endDate = this.queryData.dateRange[1];
          filteredData = filteredData.filter(item => {
            const itemDate = item.transactionTime.split(' ')[0];
            return itemDate >= startDate && itemDate <= endDate;
          });
        }
        
        // 分页处理
        const start = (this.pageData.current - 1) * this.pageData.size;
        const end = start + this.pageData.size;
        this.tableData = this.formatTableData(filteredData.slice(start, end));
        this.pageData.total = filteredData.length;
      } catch (error) {
        this.$message.error("获取资金流水数据失败");
        console.error("获取资金流水数据失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 格式化表格数据
    formatTableData(data) {
      return data.map((item) => {
        const flowTypeLabel = this.getFlowTypeLabel(item.flowType);
        const statusLabel = this.getStatusLabel(item.status);
        const accountTypeLabel = this.getAccountTypeLabel(item.accountType);

        return {
          ...item,
          flowTypeLabel,
          statusLabel,
          accountTypeLabel,
        };
      });
    },

    // 获取流水类型标签
    getFlowTypeLabel(value) {
      const item = this.FlowType.find((i) => i.value == value);
      return item ? item.label : "-";
    },

    // 获取状态标签
    getStatusLabel(value) {
      const item = this.FlowStatus.find((i) => i.value == value);
      return item ? item.label : "-";
    },

    // 获取账户类型标签
    getAccountTypeLabel(value) {
      const item = this.AccountType.find((i) => i.value == value);
      return item ? item.label : "-";
    },

    // 获取账户图标
    getAccountIcon(value) {
      const iconMap = {
        1: "el-icon-bank-card",
        2: "el-icon-mobile",
        3: "el-icon-chat-dot-round",
        4: "el-icon-wallet",
      };
      return iconMap[value] || "el-icon-wallet";
    },

    // 获取账户标签类型
    getAccountTagType(value) {
      const typeMap = {
        1: "primary",
        2: "success",
        3: "warning",
        4: "info",
      };
      return typeMap[value] || "info";
    },

    // 格式化金额
    formatAmount(amount) {
      if (!amount) return "0.00";
      return parseFloat(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    // 查询 - 修改这个方法来支持树形选择参数
    handleSearch() {
      this.pageData.current = 1;
      this.fetchTableData();
    },

    // 新增方法：带树形选择参数的数据获取
    async fetchTableDataWithTreeSelection() {
      // 直接调用fetchTableData，因为我们使用模拟数据
      this.fetchTableData();
    },

    // 重置
    handleReset() {
      this.queryData = {
        flowNo: "",
        flowType: "",
        status: "",
        accountType: "",
        counterparty: "",
        dateRange: [],
        accountNo: "",
        amountMin: "",
        amountMax: "",
        managerId: "",
      };
      this.showAdvanced = false;
      this.handleSearch();
    },

    // 处理顶部下拉命令
    handleCommand(command) {
      switch (command) {
        case "export":
          this.handleExport();
          break;
        case "import":
          this.$message.info("导入功能开发中...");
          break;
        case "batch":
          this.$message.info("批量操作功能开发中...");
          break;
      }
    },

    // 处理表格下拉命令
    handleTableCommand(command, row) {
      switch (command) {
        case "cancel":
          this.handleCancel(row);
          break;
        case "print":
          this.handlePrint(row);
          break;
        case "copy":
          this.handleCopy(row);
          break;
      }
    },

    // 新增流水
    handleAdd() {
      this.editForm = {
        id: "",
        flowType: "",
        amount: "",
        accountType: "",
        accountNo: "",
        counterparty: "",
        transactionTime: "",
        remark: "",
        managerId: "",
      };
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate();
      });
    },

    // 查看详情
    handleViewDetail(row) {
      this.$alert(`
        <div style="text-align: left;">
          <p><strong>流水编号：</strong>${row.flowNo}</p>
          <p><strong>流水类型：</strong>${this.getFlowTypeLabel(row.flowType)}</p>
          <p><strong>金额：</strong>¥${this.formatAmount(row.amount)}</p>
          <p><strong>账户：</strong>${this.getAccountTypeLabel(row.accountType)} (${row.accountNo})</p>
          <p><strong>交易对象：</strong>${row.counterparty}</p>
          <p><strong>状态：</strong>${this.getStatusLabel(row.status)}</p>
          <p><strong>交易时间：</strong>${row.transactionTime}</p>
          <p><strong>余额：</strong>¥${this.formatAmount(row.balance)}</p>
          <p><strong>备注：</strong>${row.remark || '-'}</p>
        </div>
      `, '流水详情', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      });
    },

    // 账户点击
    handleAccountClick(row) {
      this.$message.info(`查看账户详情: ${this.getAccountTypeLabel(row.accountType)} (${row.accountNo})`);
    },

    // 取消流水
    async handleCancel(row) {
      if (row.status !== 1) {
        this.$message.warning("只能取消处理中的流水");
        return;
      }

      try {
        await this.$confirm(
          `确定要取消流水"${row.flowNo}"吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 更新模拟数据中的状态
        const index = this.mockData.findIndex(item => item.id === row.id);
        if (index !== -1) {
          this.mockData[index].status = 3; // 设置为失败状态
        }

        this.$message.success("流水取消成功");
        this.fetchTableData();
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("取消流水失败");
          console.error("取消失败:", error);
        }
      }
    },

    // 打印凭证
    handlePrint(row) {
      // 模拟打印流水凭证
      const printContent = `
        资金流水凭证
        ================
        流水编号：${row.flowNo}
        流水类型：${this.getFlowTypeLabel(row.flowType)}
        金额：¥${this.formatAmount(row.amount)}
        账户：${this.getAccountTypeLabel(row.accountType)} (${row.accountNo})
        交易对象：${row.counterparty}
        状态：${this.getStatusLabel(row.status)}
        交易时间：${row.transactionTime}
        余额：¥${this.formatAmount(row.balance)}
        备注：${row.remark || '-'}
        ================
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>流水凭证</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    },

    // 复制流水
    handleCopy(row) {
      this.editForm = {
        id: "",
        flowType: row.flowType,
        amount: row.amount,
        accountType: row.accountType,
        accountNo: row.accountNo,
        counterparty: row.counterparty,
        transactionTime: "",
        remark: `复制自 ${row.flowNo}`,
        managerId: row.managerId,
      };
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate();
      });
    },

    // 保存
    async handleSave() {
      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          this.submitting = true;
          try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (this.editForm.id) {
              // 编辑 - 更新模拟数据
              const index = this.mockData.findIndex(item => item.id === this.editForm.id);
              if (index !== -1) {
                this.mockData[index] = {
                  ...this.mockData[index],
                  ...this.editForm,
                };
              }
            } else {
              // 新增 - 添加到模拟数据
              const newFlow = {
                ...this.editForm,
                id: Date.now().toString(),
                flowNo: `FL${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(this.mockData.length + 1).padStart(4, '0')}`,
                status: 1, // 默认处理中
                balance: 10000.00, // 模拟余额
                createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
              };
              this.mockData.unshift(newFlow);
            }

            this.$message.success(this.editForm.id ? "修改成功" : "新增成功");
            this.dialogVisible = false;
            this.fetchTableData();
          } catch (error) {
            this.$message.error("操作失败");
            console.error("保存失败:", error);
          } finally {
            this.submitting = false;
          }
        }
      });
    },

    // 导出数据
    handleExport() {
      if (this.selectedData.length === 0) {
        this.$message.warning("请先选择要导出的数据");
        return;
      }
      this.$message.info("导出功能开发中...");
    },

    // 选择变化
    handleSelectionChange(selection) {
      this.selectedData = selection;
    },

    // 分页大小变化
    handleSizeChange(val) {
      this.pageData.size = val;
      this.pageData.current = 1;
      // 分页变化时不传递树形选择参数，使用普通的 fetchTableData
      this.fetchTableData();
    },

    // 当前页变化
    handleCurrentChange(val) {
      this.pageData.current = val;
      // 分页变化时不传递树形选择参数，使用普通的 fetchTableData
      this.fetchTableData();
    },
  },
};
</script>

<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";

// 资金流水特有样式
.amount-positive {
  color: #67c23a;
  font-weight: bold;
}

.amount-negative {
  color: #f56c6c;
  font-weight: bold;
}

.amount-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.amount-icon {
  font-size: 12px;
}

.flow-type-icon {
  margin-right: 4px;
}

.fund-account-link {
  cursor: pointer;
  color: #409eff;
  
  &:hover {
    text-decoration: underline;
  }
}

.table-actions-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-pending {
  color: #e6a23c;
}

.status-success {
  color: #67c23a;
}

.status-failed {
  color: #f56c6c;
}

.text-muted {
  color: #909399;
}
</style>