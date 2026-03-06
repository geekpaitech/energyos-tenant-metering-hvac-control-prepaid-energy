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
                  @change="handleSearch"
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
                    <el-option label="普通结算" value="0" />
                    <el-option label="手动扣款" value="1" />
                    <el-option label="系统补单" value="2" />
                    <el-option label="浮动电价" value="3" />
                    <el-option label="分摊结算" value="4" />
                    <!-- <el-option label="设备扣款" value="5" />
                    <el-option label="租户充值" value="10" /> -->
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
                  range-separator="-"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                  :picker-options="pickerOptions"
                  @change="handleSearch"
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
                    导出数据
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
          <el-tooltip
            placement="bottom"
            :disabled="!hasElectricityDetail"
            popper-class="statistics-tooltip"
          >
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
            <div class="stat-item primary">
              <div class="stat-icon electricity">
                <img src="../../../assets/images/electricity.png" alt="">
              </div>
              <div class="stat-content">
                <div class="stat-label">电费</div>
                <div class="stat-value">
                  <span class="currency">¥</span>{{ getElectricityTotal }}
                </div>
              </div>
            </div>
          </el-tooltip>

          <!-- 水费 -->
          <el-tooltip
            placement="bottom"
            :disabled="!hasWaterDetail"
            popper-class="statistics-tooltip"
          >
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
            <div class="stat-item primary">
              <div class="stat-icon water">
                <img src="../../../assets/images/waterate.png" alt="">
              </div>
              <div class="stat-content">
                <div class="stat-label">水费</div>
                <div class="stat-value">
                  <span class="currency">¥</span>{{ getWaterTotal }}
                </div>
              </div>
            </div>
          </el-tooltip>

          <!-- 其他（替代原来的服务费） -->
          <div class="stat-item primary">
            <div class="stat-icon service">
              <i class="el-icon-s-data"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">服务费</div>
              <div class="stat-value">
                <span class="currency">¥</span>{{ getServiceFeeTotal }}
              </div>
            </div>
          </div>

          <!-- 合计 -->
          <div class="stat-item total">
            <div class="stat-icon total-icon">
              <i class="el-icon-s-finance"></i>
            </div>
            <div class="stat-content">
              <div class="stat-label">合计</div>
              <div class="stat-value">
                <span class="currency">¥</span>{{ getTotalAmount }}
              </div>
            </div>
          </div>
        </div>
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
          border
          :data="tableData"
          :max-height="tableMaxHeight"
          stripe
          style="width: 100%"
          class="custom-table light-border-table"
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
            :align="getColumnAlign(col.key)"
            :show-overflow-tooltip="true"
          >
            <template slot-scope="scope">
              <!-- 账单编号 - link形式点击打开详情 -->
              <template v-if="col.key === 'rid'">
                <el-link type="primary" @click="handleDetail(scope.row)">
                  {{ scope.row.rid || "-" }}
                </el-link>
              </template>

              <!-- 租户信息 -->
              <template v-else-if="col.key === 'tenantInfo'">
                <el-link type="primary" @click="handleTenantDetail(scope.row)">
                  <i class="el-icon-user"></i>
                  {{ scope.row.tenantName || "-" }}
                </el-link>
              </template>

              <!-- 费用类型 -->
              <template v-else-if="col.key === 'billType'">
                <el-tag
                  :type="getBillTypeTagType(scope.row.useType)"
                  size="small"
                  effect="plain"
                >
                  {{ getBillTypeLabel(scope.row.useType) }}
                </el-tag>
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

              <!-- 账单金额 - 统一黑色 -->
              <template v-else-if="col.key === 'balance'">
                <span>{{ formatBalance(scope.row.balance) }}</span>
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

              <!-- 抵扣金支付 -->
              <template v-else-if="col.key === 'discountAmt'">
                <span>{{ formatBalance(scope.row.discountAmt) }}</span>
              </template>

              <!-- 现金支付 -->
              <template v-else-if="col.key === 'realAmt'">
                <span>{{ formatBalance(scope.row.realAmt) }}</span>
              </template>

              <!-- 开票状态 -->
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

              <!-- 默认显示 -->
              <template v-else>
                {{ scope.row[col.key] || "-" }}
              </template>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column
            label="操作"
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

        <!-- 分页 -->
        <div class="pagination-container compact-pagination">
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
    </div>

    <!-- 详情抽屉 -->
    <BillDetailDrawer :detailDrawer="detailDrawer" />
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import {
  settlePageTenantDailyBill,
  settleSettleTenantStatistics,
} from "@/api/settle";
import { tenantPageTenant } from "@/api/tenant";
import * as XLSX from "xlsx";
import BillDetailDrawer from "./components/BillDetailDrawer.vue";

export default {
  name: "EnergyBill",
  components: {
    BillDetailDrawer,
  },
  data() {
    return {
      pickerOptions: {
        shortcuts: [
          {
            text: "最近7天",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 6);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "最近15天",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 14);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "最近30天",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "本月",
            onClick(picker) {
              const start = new Date();
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "上月",
            onClick(picker) {
              const start = new Date();
              start.setMonth(start.getMonth() - 1);
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setDate(0);
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
        ],
        disabledDate(time) {
          return time.getTime() > Date.now();
        },
      },
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68,
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
          { prop: "timeRange", label: "日期范围", type: "daterange" },
        ],
        advanced: [
          // { prop: "tenantId", label: "租户ID", type: "input" },
          // { prop: "withdrawStatus", label: "提现状态", type: "select" },
          // { prop: "status", label: "发票状态", type: "select" },
          // { prop: "payStatus", label: "缴费状态", type: "select" },
        ],
      },
      // 租户列表
      tenantList: [],
      // 表格数据
      tableData: [],
      // 统计数据
      statisticsData: {
        表计电费: 0,
        其他电费: 0,
        表计水费: 0,
        其他水费: 0,
        服务费: 0,
      },
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
      // 表格列配置 - 已移除备注列
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
          label: "创建时间",
          key: "createTime",
          width: "160",
          checked: true,
        },
        {
          label: "租户信息",
          key: "tenantInfo",
          width: "200",
          checked: true,
          disabled: true,
        },
        {
          label: "费用类型",
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
          label: "抵扣金支付(元)",
          key: "discountAmt",
          width: "120",
          checked: true,
        },
        {
          label: "现金支付(元)",
          key: "realAmt",
          width: "120",
          checked: true,
        },
        {
          label: "开票状态",
          key: "status",
          width: "100",
          checked: true,
        },
      ],
      // 详情抽屉
      detailDrawer: {
        show: false,
        id: "",
        tenantId: "",
        settleWay: "",
        useType: "",
        floatId: "",
      },
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

      if (dataLength <= this.tableHeightConfig.maxRows) {
        return (
          this.tableHeightConfig.headerHeight +
          dataLength * this.tableHeightConfig.rowHeight
        );
      }

      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      );
    },
    tableMaxHeight() {
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      );
    },
    // 计算电费合计
    getElectricityTotal() {
      const meterElec = parseFloat(this.statisticsData.表计电费) || 0;
      const otherElec = parseFloat(this.statisticsData.其他电费) || 0;
      return (meterElec + otherElec).toFixed(2);
    },
    // 计算水费合计
    getWaterTotal() {
      const meterWater = parseFloat(this.statisticsData.表计水费) || 0;
      const otherWater = parseFloat(this.statisticsData.其他水费) || 0;
      return (meterWater + otherWater).toFixed(2);
    },
    // 获取服务费
    getServiceFeeTotal() {
      return this.formatAmount(this.statisticsData.服务费);
    },
    // 计算总合计（电费+水费+其他）
    getTotalAmount() {
      const electricity = parseFloat(this.getElectricityTotal) || 0;
      const water = parseFloat(this.getWaterTotal) || 0;
      const service = parseFloat(this.statisticsData.服务费) || 0;
      return (electricity + water + service).toFixed(2);
    },
    // 判断是否有电费详细信息
    hasElectricityDetail() {
      const meterElec = parseFloat(this.statisticsData.表计电费) || 0;
      const otherElec = parseFloat(this.statisticsData.其他电费) || 0;
      return meterElec > 0 || otherElec > 0;
    },
    // 判断是否有水费详细信息
    hasWaterDetail() {
      const meterWater = parseFloat(this.statisticsData.表计水费) || 0;
      const otherWater = parseFloat(this.statisticsData.其他水费) || 0;
      return meterWater > 0 || otherWater > 0;
    },
  },
  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.queryData.managerId = newVal;
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
    if (this.$route.query.id) {
      this.queryData.tenantId = this.$route.query.id;
    }
    if (this.$route.query.managerId) {
      this.queryData.managerId = this.$route.query.managerId;
    } else if (!this.queryData.managerId) {
      this.queryData.managerId = this.currentManagerId || "";
    }

    this.setDefaultTimeRange();
  },
  methods: {
    // 获取列对齐方式
    getColumnAlign(key) {
      // 金额类字段右对齐
      if (["balance", "discountAmt", "realAmt"].includes(key)) {
        return "right";
      }
      // 标签类字段居中
      if (["billType", "settleWay", "payStatus", "status"].includes(key)) {
        return "center";
      }
      // 其他字段左对齐
      return "left";
    },

    // 格式化金额
    formatAmount(amount) {
      if (!amount || amount === 0) return "0.00";
      return parseFloat(amount).toFixed(2);
    },

    // 格式化余额
    formatBalance(balance) {
      if (balance === null || balance === undefined) return "0.00";
      return Number(balance).toFixed(2);
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
        // 处理账单类型参数 - 全部时传逗号分割的所有值
        let settleWayParam = this.queryData.settleWay;
        if (!settleWayParam) {
          // 全部情况传所有值
          settleWayParam = "0,1,2,3,4,5,10";
        }

        const params = {
          managerId: this.queryData.managerId,
          rid: this.queryData.rid,
          tenantId: this.queryData.tenantId || this.queryData.name,
          payStatus: this.queryData.payStatus,
          withdrawStatus: this.queryData.withdrawStatus,
          settleWay: settleWayParam, // 使用处理后的参数
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
        // 处理账单类型参数 - 全部时传逗号分割的所有值
        let settleWayParam = this.queryData.settleWay;
        if (!settleWayParam) {
          // 全部情况传所有值
          settleWayParam = "0,1,2,3,4,5,10";
        }

        const params = {
          managerId: this.queryData.managerId,
          rid: this.queryData.rid,
          tenantId: this.queryData.tenantId || this.queryData.name,
          payStatus: this.queryData.payStatus,
          withdrawStatus: this.queryData.withdrawStatus,
          settleWay: settleWayParam,
          status: this.queryData.status,
          endDate: this.queryData.timeRange ? this.queryData.timeRange[1] : "",
          startDate: this.queryData.timeRange
            ? this.queryData.timeRange[0]
            : "",
        };

        const response = await settleSettleTenantStatistics(params);
        if (response.code === 200 && response.data) {
          // 直接使用返回的数据对象
          this.statisticsData = {
            表计电费: response.data.表计电费 || 0,
            其他电费: response.data.其他电费 || 0,
            表计水费: response.data.表计水费 || 0,
            其他水费: response.data.其他水费 || 0,
            服务费: response.data.服务费 || 0,
          };
        } else {
          // 重置为默认值
          this.statisticsData = {
            表计电费: 0,
            其他电费: 0,
            表计水费: 0,
            其他水费: 0,
            服务费: 0,
          };
        }
      } catch (error) {
        console.error("获取统计数据失败:", error);
        this.statisticsData = {
          表计电费: 0,
          其他电费: 0,
          表计水费: 0,
          其他水费: 0,
          服务费: 0,
        };
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
      }
    },

    handleExport() {
      if (this.tableData.length === 0) {
        this.$message.warning("暂无数据可导出");
        return;
      }

      try {
        const exportData =
          this.selectedData.length > 0 ? this.selectedData : this.tableData;

        const headers = this.displayColumns.map((col) => col.label);
        const data = exportData.map((row) => {
          return this.displayColumns.map((col) => {
            const value = row[col.key];

            switch (col.key) {
              case "tenantInfo":
                return row.tenantName || "";
              case "billType":
                return this.getBillTypeLabel(row.useType);
              case "settleWay":
                return this.getSettleWayLabel(value);
              case "balance":
              case "discountAmt":
              case "realAmt":
                return value ? parseFloat(value).toFixed(2) : "0.00";
              case "payStatus":
                return value == 1 ? "已缴费" : "未缴费";
              case "status":
                return this.getInvoiceStatusLabel(value);
              default:
                return value || "";
            }
          });
        });

        const wsData = [headers, ...data];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        const colWidths = this.displayColumns.map((col) => {
          if (col.width) {
            return {
              wch: Math.max(parseInt(col.width) / 8, col.label.length + 2),
            };
          } else if (col.minWidth) {
            return {
              wch: Math.max(
                parseInt(col.minWidth) / 8,
                col.label.length + 2
              ),
            };
          }
          return { wch: Math.max(15, col.label.length + 2) };
        });
        ws["!cols"] = colWidths;

        const headerRange = XLSX.utils.decode_range(ws["!ref"]);
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!ws[cellAddress]) continue;

          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "1f2329" } },
            fill: { fgColor: { rgb: "F8F9FC" } },
            alignment: { horizontal: "center", vertical: "center" },
          };
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "能耗账单");

        const fileName = this.generateFileName();

        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        const exportCount = exportData.length;
        const isSelectedExport = this.selectedData.length > 0;
        this.$message.success(
          `成功导出${exportCount}条${isSelectedExport ? "选中" : ""}数据！`
        );
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败，请重试");
      }
    },

    generateFileName() {
      const now = new Date();
      const timeStr =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        "_" +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0");

      if (this.queryData.tenantId || this.queryData.name) {
        const tenant = this.tenantList.find(
          (t) => t.id === (this.queryData.tenantId || this.queryData.name)
        );
        const tenantName = tenant
          ? tenant.value
          : this.queryData.tenantId || this.queryData.name;
        return `租户账单_${tenantName}_${timeStr}.xlsx`;
      }

      if (this.queryData.settleWay) {
        const settleWayName = this.getSettleWayLabel(this.queryData.settleWay);
        return `租户账单_${settleWayName}_${timeStr}.xlsx`;
      }

      if (this.queryData.billType) {
        const billTypeName = this.getBillTypeLabel(this.queryData.billType);
        return `租户账单_${billTypeName}_${timeStr}.xlsx`;
      }

      if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
        const startDate = this.queryData.timeRange[0].replace(/-/g, "");
        const endDate = this.queryData.timeRange[1].replace(/-/g, "");
        return `租户账单_${startDate}-${endDate}_${timeStr}.xlsx`;
      }

      return `租户账单_${timeStr}.xlsx`;
    },

    getBillTypeLabel(type) {
      const labelMap = {
        0: "水费",
        2: "电费",
        7: "服务费",
      };
      return labelMap[String(type)] || "服务费";
    },

    // 获取费用类型标签颜色
    getBillTypeTagType(type) {
      const typeMap = {
        0: "primary", // 水费
        2: "success", // 电费
        7: "warning", // 服务费
      };
      return typeMap[String(type)] || "info";
    },

    // 查看详情 - 账单编号点击和详情按钮都触发
    handleDetail(row) {
      console.log("点击详情，row数据：", row);
      this.detailDrawer.id = row.rid;
      this.detailDrawer.tenantId = row.tenantId;
      this.detailDrawer.settleWay = row.settleWay;
      this.detailDrawer.useType = row.useType;
      this.detailDrawer.floatId = row.floatId;
      this.detailDrawer.show = true;
      console.log("打开详情抽屉，detailDrawer数据：", this.detailDrawer);
    },

    // 查看租户详情
    handleTenantDetail(row) {
      this.$router.push({
        name: "TenantDetail",
        params: { id: row.tenantId },
        query: {
          name: row.name,
          from: "list",
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

    // 获取账单类型标签
    getSettleWayLabel(way) {
      const labelMap = {
        0: "普通结算",
        1: "手动扣款",
        2: "系统补单",
        3: "浮动电价",
        4: "分摊结算",
        5: "设备扣款",
        10: "租户充值",
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
        4: "info",
        5: "info",
        10: "success",
      };
      return typeMap[way] || "";
    },

    // 获取发票状态标签
    getInvoiceStatusLabel(status) {
      const labelMap = {
        0: "未开票",
        1: "审核中",
        2: "已开票",
        3: "已拒绝",
      };
      return labelMap[status] || "-";
    },

    // 获取发票状态颜色
    getInvoiceStatusColor(status) {
      const colorMap = {
        0: "#909399",
        1: "#E6A23C",
        2: "#67C23A",
        3: "#F56C6C",
      };
      return colorMap[status] || "#909399";
    },
  },
};
</script>

<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";

$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$border-color: #dcdfe6;
$border-light: #e4e7ed;

// ==================== 弱化表格边框 ====================
.light-border-table {
  ::v-deep {
    border: 1px solid #f0f0f0 !important;

    .el-table__header-wrapper {
      th {
        border-right: 1px solid #f0f0f0 !important;
        border-bottom: 1px solid #f0f0f0 !important;
      }
    }

    td {
      border-right: 1px solid #f5f5f5 !important;
      border-bottom: 1px solid #f5f5f5 !important;
    }

    .el-table__fixed,
    .el-table__fixed-right {
      &::before {
        background-color: transparent !important;
      }
    }

    .el-table__fixed-right-patch {
      border-bottom: 1px solid #f0f0f0 !important;
      background-color: #f5f7fa !important;
    }
  }
}

// ==================== 状态样式 ====================
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

// ==================== 紧凑型分页样式 ====================
.compact-pagination {
  ::v-deep .el-pagination {
    font-size: 12px;

    .el-pagination__total {
      font-size: 12px;
      line-height: 24px;
    }

    .el-pagination__sizes {
      .el-input {
        width: 90px;

        .el-input__inner {
          height: 24px;
          line-height: 24px;
          font-size: 12px;
          padding: 0 8px;
        }
      }
    }

    .btn-prev,
    .btn-next {
      min-width: 24px;
      height: 24px;
      line-height: 24px;
      font-size: 12px;
      padding: 0 6px;
    }

    .el-pager {
      li {
        min-width: 24px;
        height: 24px;
        line-height: 24px;
        font-size: 12px;
        padding: 0 6px;

        &.active {
          font-weight: 600;
        }
      }
    }

    .el-pagination__jump {
      font-size: 12px;
      line-height: 24px;

      .el-input {
        width: 40px;

        .el-input__inner {
          height: 24px;
          line-height: 24px;
          font-size: 12px;
          padding: 0 4px;
        }
      }
    }
  }
}

// ==================== Tooltip 自定义样式（全局）====================
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

// ==================== 统计卡片区域 - 新增合计样式 ====================
.statistics-container {
  .stat-item.total {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    .stat-icon.total-icon {
      background: rgba(255, 255, 255, 0.2);
      
      i {
        color: #fff;
        font-size: 24px;
      }
    }
    
    .stat-content {
      .stat-label {
        color: rgba(255, 255, 255, 0.9);
        font-weight: 600;
      }
      
      .stat-value {
        color: #fff;
        font-weight: 700;
        
        .currency {
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }
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
  