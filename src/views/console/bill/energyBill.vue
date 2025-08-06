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
                  :filterable="field.prop === 'name'"
                >
                  <!-- 费用类型 -->
                  <template v-if="field.prop === 'billType'">
                    <el-option label="全部" value="" />
                    <el-option label="电费" value="0" />
                    <el-option label="水费" value="1" />
                    <el-option label="服务费" value="2" />
                  </template>
                  <!-- 账单类型 -->
                  <template v-else-if="field.prop === 'settleWay'">
                    <el-option label="全部" value="" />
                    <el-option label="日结" value="0" />
                    <el-option label="月结" value="1" />
                    <el-option label="预付费" value="2" />
                    <el-option label="浮动电价" value="3" />
                    <el-option label="设备扣款" value="5" />
                  </template>
                  <!-- 租户名称 -->
                  <template v-else-if="field.prop === 'name'">
                    <el-option
                      v-for="item in tenantList"
                      :key="item.id"
                      :label="item.value"
                      :value="item.id"
                    />
                  </template>
                </el-select>
                <!-- 日期选择器 -->
                <el-date-picker
                  v-else-if="field.type === 'daterange'"
                  v-model="queryData[field.prop]"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
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
                    <!-- 提现状态 -->
                    <template v-if="field.prop === 'withdrawStatus'">
                        <el-option label="全部" value="" />
  <el-option label="已结算" value="0" />
  <el-option label="不可提现" value="1" />
  <el-option label="可提现" value="2" />
  <el-option label="审核中" value="3" />
  <el-option label="已提现" value="4" />
                    </template>
                    <!-- 发票状态 -->
                    <template v-else-if="field.prop === 'status'">
                      <el-option label="全部" value="" />
                      <el-option label="未开票" value="0" />
                      <el-option label="已开票" value="1" />
                      <el-option label="开票中" value="2" />
                    </template>
                    <!-- 缴费状态 -->
                    <template v-else-if="field.prop === 'payStatus'">
                      <el-option label="全部" value="" />
                      <el-option label="未缴费" value="0" />
                      <el-option label="已缴费" value="1" />
                    </template>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-transition>

          <!-- 操作按钮行 - 更合理的布局 -->
          <div class="form-actions compact-actions">
            <div class="action-left">
              <!-- 预留左侧按钮 -->
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
                    导出当前页
                  </el-dropdown-item>
                  <el-dropdown-item command="exportAll" icon="el-icon-download">
                    按筛选导出
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
  <el-card class="statistics-card" shadow="never">
    <div class="statistics-wrapper">
      <!-- 电费 -->
      <div class="stat-item primary">
        <div class="stat-icon electricity">
           <img src="../../../assets/images/electricity.png" alt="">
        </div>
        <div class="stat-content">
          <div class="stat-label">电费</div>
          <div class="stat-value">
            <span class="currency">¥</span>{{ getStatValue("电费") }}
          </div>
        </div>
      </div>

      <!-- 水费 -->
      <div class="stat-item primary">
        <div class="stat-icon water">
          <img src="../../../assets/images/waterate.png" alt="">
        </div>
        <div class="stat-content">
          <div class="stat-label">水费</div>
          <div class="stat-value">
            <span class="currency">¥</span>{{ getStatValue("水费") }}
          </div>
        </div>
      </div>

      <!-- 其他（替代原来的服务费） -->
      <div class="stat-item primary">
        <div class="stat-icon service">
          <i class="el-icon-s-data"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">其他</div>
          <div class="stat-value">
            <span class="currency">¥</span>{{ getStatValue("其他") }}
          </div>
        </div>
      </div>

      <!-- 空调 -->
      <div class="stat-item secondary">
        <div class="stat-icon">
          <i class="el-icon-wind-power"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">空调</div>
          <div class="stat-value">
            <span class="currency">¥</span>{{ getStatValue("空调") }}
          </div>
        </div>
      </div>

      <!-- 光伏 -->
      <div class="stat-item secondary">
        <div class="stat-icon">
          <i class="el-icon-sunny"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">光伏</div>
          <div class="stat-value">
            <span class="currency">¥</span>{{ getStatValue("光伏") }}
          </div>
        </div>
      </div>

      <!-- 照明 -->
      <div class="stat-item secondary">
        <div class="stat-icon">
          <i class="el-icon-light"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">照明</div>
          <div class="stat-value">
            <span class="currency">¥</span>{{ getStatValue("照明") }}
          </div>
        </div>
      </div>

      <!-- 合计 -->
      <div class="stat-item total">
        <div class="stat-content">
          <div class="stat-label">合计</div>
          <div class="stat-value">
            <span class="currency">¥</span>{{ getTotalAmount() }}
          </div>
        </div>
      </div>
    </div>
  </el-card>
</div>
    <!-- 数据表格区域 -->
    <div class="table-container" style="height: 475px;">
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
            background: 'linear-gradient(180deg, #f8f9fc 0%, #f0f2f5 100%)',
            color: '#1f2329',
            fontWeight: '600',
            fontSize: '13px',
            borderBottom: '2px solid #e8e8e8',
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
              <!-- 账单编号 -->
              <template v-if="col.key === 'rid'">
                <el-link type="primary">
                  {{ scope.row.rid || "-" }}
                </el-link>
              </template>

              <!-- 租户名称 -->
              <template v-else-if="col.key === 'tenantName'">
                <el-link type="primary" @click="handleTenantDetail(scope.row)">
                  <i class="el-icon-user"></i>
                  {{ scope.row.tenantName || "-" }}
                </el-link>
              </template>

              <!-- 费用类型 -->
              <template v-else-if="col.key === 'billType'">
                <div class="type-with-icon">
                  --
                </div>
              </template>

              <!-- 账单类型 -->
              <template v-else-if="col.key === 'settleWay'">
                <el-tag
                  :type="getSettleWayType(scope.row.settleWay)"
                  size="small"
                  effect="plain"
                >
                  {{ getSettleWayLabel(scope.row.settleWay) }}
                </el-tag>
              </template>

              <!-- 账单金额 -->
              <template v-else-if="col.key === 'balance'">
                <span class="amount-text">￥{{ scope.row.balance || 0 }}</span>
              </template>

              <!-- 缴费状态 -->
              <template v-else-if="col.key === 'payStatus'">
                <div class="status-wrapper">
                  <span
                    class="status-dot"
                    :style="{
                      backgroundColor:
                        scope.row.payStatus == 1 ? '#67C23A' : '#909399',
                    }"
                  ></span>
                  {{ scope.row.payStatus == 1 ? "已缴费" : "未缴费" }}
                </div>
              </template>

              <!-- 提现状态 -->
              <template v-else-if="col.key === 'withdrawStatus'">
                <template v-if="scope.row.payStatus == 1">
                  <div class="status-wrapper">
                    <span
                      class="status-dot"
                      :style="{
                        backgroundColor: getWithdrawStatusColor(
                          scope.row.withdrawStatus
                        ),
                      }"
                    ></span>
                    {{ getWithdrawStatusLabel(scope.row.withdrawStatus) }}
                  </div>
                </template>
                <span v-else>-</span>
              </template>

              <!-- 发票状态 -->
              <template v-else-if="col.key === 'status'">
                <div class="status-wrapper">
                  <span
                    class="status-dot"
                    :style="{
                      backgroundColor: getInvoiceStatusColor(scope.row.status),
                    }"
                  ></span>
                  {{ getInvoiceStatusLabel(scope.row.status) }}
                </div>
              </template>

              <!-- 备注 -->
              <template v-else-if="col.key === 'remark'">
                <el-tooltip
                  v-if="scope.row.remark"
                  class="item"
                  effect="dark"
                  :content="scope.row.remark"
                  placement="top"
                >
                  <div class="ellipsis" style="max-width: 200px">
                    {{ scope.row.remark }}
                  </div>
                </el-tooltip>
                <span v-else>-</span>
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
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <div class="table-actions-group">
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-view"
                  @click="handleDetail(scope.row)"
                >
                  详情
                </el-button>
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
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import {
  settlePageTenantDailyBill,
  settleSettleTenantStatistics,
} from "@/api/settle";
import { tenantPageTenant } from "@/api/tenant";

export default {
  name: "EnergyBill",
  data() {
    return {
      tableHeightConfig: {
        headerHeight: 48, // 表头高度
        rowHeight: 47, // 每行高度
        minHeight: 200, // 最小高度
        maxRows: 9, // 最大显示行数（超过9行显示滚动条）
        paginationHeight: 68, // 分页高度
      },
      // 查询参数
      queryData: {
        rid: "",
        name: "",
        tenantId: "",
        billType: "",
        payStatus: "",
        withdrawStatus: "",
        settleWay: "",
        status: "",
        managerId: "",
        timeRange: [],
      },
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: "rid", label: "账单编号", type: "input" },
          { prop: "billType", label: "费用类型", type: "select" },
          { prop: "settleWay", label: "账单类型", type: "select" },
          { prop: "timeRange", label: "日期", type: "daterange" },
        ],
        advanced: [
          { prop: "tenantId", label: "租户ID", type: "input" },
          { prop: "withdrawStatus", label: "提现状态", type: "select" },
          { prop: "status", label: "发票状态", type: "select" },
          { prop: "payStatus", label: "缴费状态", type: "select" },
        ],
      },
      // 租户列表
      tenantList: [],
      // 表格数据
      tableData: [],
      // 统计数据
      limitData: [],
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
      // 表格列配置
      tableKey: [
        {
          label: "账单编号",
          key: "rid",
          width: "150",
          checked: true,
        },
        {
          label: "账单日期",
          key: "occurDate",
          width: "120",
          checked: true,
        },
        {
          label: "租户名",
          key: "tenantName",
          width: "200",
          checked: true,
          disabled: true,
        },
        {
          label: "租户ID",
          key: "tenantId",
          width: "120",
          checked: true,
        },
        {
          label: "类型",
          key: "billType",
          width: "120",
          checked: true,
        },
        {
          label: "账单类型",
          key: "settleWay",
          width: "120",
          checked: true,
        },
        {
          label: "账单金额",
          key: "balance",
          width: "120",
          checked: true,
        },
        {
          label: "缴费状态",
          key: "payStatus",
          width: "100",
          checked: true,
        },
        {
          label: "提现状态",
          key: "withdrawStatus",
          width: "100",
          checked: true,
        },
        {
          label: "发票状态",
          key: "status",
          width: "100",
          checked: true,
        },
        {
          label: "备注内容",
          key: "remark",
          minWidth: "150",
          checked: true,
        },
      ],
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    // 计算需要显示的列
    displayColumns() {
      return this.tableKey.filter((col) => col.checked !== false);
    },
    dataLength() {
      return this.tableData.length;
    },
    // 判断是否需要显示高级筛选按钮
    needAdvancedSearch() {
      const totalFields =
        this.searchFields.basic.length + this.searchFields.advanced.length;
      return totalFields > 4;
    },
    // 获取实际显示的基础搜索字段
    displayBasicFields() {
      if (!this.needAdvancedSearch) {
        return [...this.searchFields.basic, ...this.searchFields.advanced];
      }
      return this.searchFields.basic;
    },
    // 获取高级搜索字段
    displayAdvancedFields() {
      return this.searchFields.advanced;
    },
    dynamicTableHeight() {
      const dataLength = this.tableData.length;

      if (dataLength === 0) {
        return this.tableHeightConfig.minHeight;
      }

      // 数据 <= 9条：显示实际行数高度
      if (dataLength <= this.tableHeightConfig.maxRows) {
        return (
          this.tableHeightConfig.headerHeight +
          dataLength * this.tableHeightConfig.rowHeight
        );
      }

      // 数据 > 9条：固定显示9行高度 + 内部滚动
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      );
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
          // 设置默认时间范围
          this.setDefaultTimeRange();
          this.fetchTableData();
          this.getStatisticsData();
          this.getTenantList();
        }
      },
      immediate: true,
    },
  },
  created() {
    // 从路由获取参数
    if (this.$route.query.id) {
      this.queryData.tenantId = this.$route.query.id;
    }
    if (this.$route.query.managerId) {
      this.queryData.managerId = this.$route.query.managerId;
    } else if (!this.queryData.managerId) {
      this.queryData.managerId = this.currentManagerId || "";
    }

    // 设置默认时间范围
    this.setDefaultTimeRange();
  },
  methods: {
  // 修改 getStatValue 方法
  getStatValue(type) {
  // 确保 limitData 是数组
  if (!Array.isArray(this.limitData)) {
    return "0.00";
  }
  
  const stat = this.limitData.find((item) => item.channel === type);
  if (stat) {
    return this.formatAmount(stat.totalAmt);
  }
  
  // 对于没有数据的设备类型（空调、光伏、照明），显示 "0.00"
  const deviceTypes = ["空调", "光伏", "照明"];
  if (deviceTypes.includes(type)) {
    return "0.00";
  }
  
  return "0.00";
},

// 修改 getTotalAmount 方法 - 计算所有实际返回数据的总和
getTotalAmount() {
  let total = 0;
  // 确保 limitData 是数组且有数据
  if (Array.isArray(this.limitData) && this.limitData.length > 0) {
    total = this.limitData.reduce((sum, item) => {
      return sum + (parseFloat(item.totalAmt) || 0);
    }, 0);
  }
  return this.formatAmount(total);
},

    // 格式化金额
    formatAmount(amount) {
      if (!amount || amount === 0) return "0.00";
      return parseFloat(amount).toFixed(2);
    },
    // 设置默认时间范围
    setDefaultTimeRange() {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      this.queryData.timeRange = [
        this.formatDate(startDate),
        this.formatDate(endDate),
      ];
    },

    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    // 获取账单列表数据
    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          managerId: this.queryData.managerId,
          rid: this.queryData.rid,
          tenantId: this.queryData.tenantId || this.queryData.name,
          payStatus: this.queryData.payStatus,
          withdrawStatus: this.queryData.withdrawStatus,
          settleWay: this.queryData.settleWay,
          billType: this.queryData.billType,
          status: this.queryData.status,
          endDate: this.queryData.timeRange ? this.queryData.timeRange[1] : "",
          startDate: this.queryData.timeRange
            ? this.queryData.timeRange[0]
            : "",
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            searchCount: true,
            orders: [
              {
                asc: false,
                column: "occurDate",
              },
              {
                asc: false,
                column: "rid",
              },
            ],
          },
        };

        const response = await settlePageTenantDailyBill(params);

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || [];
          this.pageData.total = response.data.total || 0;
          this.pageData.current = response.data.current || 1;
        } else {
          this.$message.error(response.msg || "获取数据失败");
        }
      } catch (error) {
        this.$message.error("获取账单数据失败");
        console.error("获取账单数据失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 获取统计数据
    async getStatisticsData() {
  try {
    const params = {
      managerId: this.queryData.managerId,
      rid: this.queryData.rid,
      tenantId: this.queryData.tenantId || this.queryData.name,
      payStatus: this.queryData.payStatus,
      withdrawStatus: this.queryData.withdrawStatus,
      status: this.queryData.status,
      endDate: this.queryData.timeRange ? this.queryData.timeRange[1] : "",
      startDate: this.queryData.timeRange ? this.queryData.timeRange[0] : "",
    };

    const response = await settleSettleTenantStatistics(params);
    if (response.code === 200 && response.data) {
      // 确保赋值的是数组
      this.limitData = Array.isArray(response.data) ? response.data : [];
    } else {
      // 如果响应异常，设置为空数组
      this.limitData = [];
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
    // 出错时设置为空数组
    this.limitData = [];
  }
},

    // 获取租户列表
    async getTenantList() {
      try {
        const params = {
          managerId: this.queryData.managerId,
          page: {
            size: 999,
            current: 1,
          },
        };
        const response = await tenantPageTenant(params);
        if (response.code === 200 && response.data) {
          this.tenantList = (response.data.dataList || []).map((item) => ({
            id: item.id,
            value: item.name,
          }));
        }
      } catch (error) {
        console.error("获取租户列表失败:", error);
      }
    },

    // 查询
    handleSearch() {
      this.pageData.current = 1;
      this.fetchTableData();
      this.getStatisticsData();
    },

    // 重置
    handleReset() {
      this.queryData = {
        rid: "",
        name: "",
        tenantId: "",
        billType: "",
        payStatus: "",
        withdrawStatus: "",
        settleWay: "",
        status: "",
        managerId: this.currentManagerId || "",
        timeRange: [],
      };
      this.setDefaultTimeRange();
      this.showAdvanced = false;
      this.handleSearch();
    },

    // 处理顶部下拉命令
    handleCommand(command) {
      switch (command) {
        case "export":
          this.handleExport();
          break;
        case "exportAll":
          this.handleExportAll();
          break;
      }
    },

    // 导出当前页
    handleExport() {
      if (this.tableData.length === 0) {
        this.$message.warning("暂无数据可导出");
        return;
      }
      this.$message.info("导出功能开发中...");
    },

    // 按筛选条件导出所有
    async handleExportAll() {
      this.$message.info("导出功能开发中...");
    },

    // 查看详情
    handleDetail(row) {
      // 根据不同类型跳转不同详情
      if (row.settleWay == 3 && row.floatId) {
        // 浮动电价详情
        this.$message.info("浮动电价详情功能开发中...");
      } else if (row.settleWay == 0 && row.useType == 0) {
        // 水费日结详情
        this.$message.info("水费日结详情功能开发中...");
      } else if (row.settleWay == 5) {
        // 设备扣款详情
        this.$message.info("设备扣款详情功能开发中...");
      } else {
        // 普通电费详情
        this.$message.info("电费详情功能开发中...");
      }
    },

    // 查看租户详情
    handleTenantDetail(row) {
      this.$router.push({
        path: "/tenant-detail",
        query: {
          id: row.tenantId,
          managerId: row.managerId,
        },
      });
    },

    // 选择变化
    handleSelectionChange(selection) {
      this.selectedData = selection;
    },

    // 分页大小变化
    handleSizeChange(val) {
      this.pageData.size = val;
      this.pageData.current = 1;
      this.fetchTableData();
    },

    // 当前页变化
    handleCurrentChange(val) {
      this.pageData.current = val;
      this.fetchTableData();
    },

    // 格式化金额
    formatAmount(amount) {
      if (!amount || amount === 0) return "0.00";
      return parseFloat(amount).toFixed(2);
    },


    // 获取账单类型标签
    getSettleWayLabel(way) {
      const labelMap = {
        0: "日结",
        1: "月结",
        2: "预付费",
        3: "浮动电价",
        5: "设备扣款",
      };
      return labelMap[way] || "-";
    },

    // 获取账单类型标签样式
    getSettleWayType(way) {
      const typeMap = {
        0: "primary",
        1: "success",
        2: "warning",
        3: "danger",
        5: "info",
      };
      return typeMap[way] || "";
    },

    // 获取提现状态标签
    getWithdrawStatusLabel(status) {
  const typeStr = String(status);
  const labelMap = {
    "0": "已结算",
    "1": "不可提现",
    "2": "可提现",
    "3": "审核中",
    "4": "已提现"
  };
  return labelMap[typeStr] || "-";
},

    // 获取提现状态颜色
    getWithdrawStatusColor(status) {
  const typeStr = String(status);
  const colorMap = {
    "0": "#67C23A", // 已结算 - 绿色
    "1": "#909399", // 不可提现 - 灰色
    "2": "#409EFF", // 可提现 - 蓝色
    "3": "#E6A23C", // 审核中 - 橙色
    "4": "#67C23A"  // 已提现 - 绿色
  };
  return colorMap[typeStr] || "#909399";
},

    // 获取发票状态标签
    getInvoiceStatusLabel(status) {
      const labelMap = {
        0: "未开票",
        1: "审核中",
        2: "已开票",
        3:'已拒绝'
      };
      return labelMap[status] || "-";
    },

    // 获取发票状态颜色
    getInvoiceStatusColor(status) {
      const colorMap = {
        0: "#909399",
        1: "#67C23A",
        2: "#E6A23C",
      };
      return colorMap[status] || "#909399";
    },
  },
};
</script>
<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";
</style>
