<template>
  <div class="tenant-turnover-wrapper">
    <!-- 标签页和查询条件在同一行 -->
    <div class="header-wrapper">
      <div class="tabs-wrapper">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'electric' }"
          @click="switchTab('electric')"
        >
          <i class="iconfont icon-dianbiao"></i>
          电费流水
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'water' }"
          @click="switchTab('water')"
        >
          <i class="iconfont icon-shuibiao"></i>
          水费流水
        </div>
      </div>

      <!-- 查询条件 -->
      <div class="search-form">
        <el-form :model="turnoverForm" inline size="small">
          <el-form-item>
            <el-date-picker
              v-model="turnoverDateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              :picker-options="datePickerOptions"
              @change="handleTurnoverDateChange"
            />
          </el-form-item>
          <el-form-item>
            <!-- <el-button type="primary" @click="fetchTurnoverData"
              >查询</el-button
            > -->
            <el-button @click="resetTurnoverForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 流水列表 -->
    <div class="table-wrapper">
      <el-table
        :data="turnoverList"
        v-loading="turnoverLoading"
        border
        size="small"
        :height="tableHeight"
        :header-cell-style="{
          background: '#f5f7fa',
          color: '#606266',
          fontWeight: '600',
        }"
      >
        <el-table-column prop="id" label="流水号" align="center" width="180" />

        <el-table-column
          prop="createTime"
          label="操作时间"
          align="center"
          width="200"
        />

        <el-table-column
          prop="operate"
          label="操作类型"
          align="center"
          width="120"
        >
          <template slot-scope="scope">
            <el-tag
              :type="getOperateTagType(scope.row.operate)"
              size="small"
              effect="plain"
            >
              {{ getOperateLabel(scope.row.operate) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="channel"
          label="交易渠道"
          align="center"
          width="120"
        >
          <template slot-scope="scope">
            <span>{{ getChannelLabel(scope.row.channel) }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="amount"
          label="操作金额(元)"
          align="right"
        >
          <template slot-scope="scope">
            <!-- 你的原始闭环逻辑，完全保留 -->
            <div
              v-if="
                scope.row.operate == 1 ||
                (scope.row.operate == 3 && scope.row.channel == 6)
              "
            >
              {{ scope.row.amount }}
            </div>
            <div v-else>- {{ scope.row.amount }}</div>
          </template>
        </el-table-column>

        <el-table-column
          prop="tenantBalance"
          label="余额(元)"
          align="right"
        >
          <template slot-scope="scope">
            <span>{{ formatBalance(scope.row.tenantBalance) }}</span>
          </template>
        </el-table-column>

        <!-- <el-table-column prop="remark" label="备注" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.remark || "--" }}</span>
          </template>
        </el-table-column> -->

        <el-table-column label="明细" align="center">
          <template slot-scope="scope">
            <el-popover
              placement="left"
              trigger="hover"
              popper-class="detail-popover"
              @show="handleDetailShow(scope.row)"
            >
              <div class="detail-content" v-loading="scope.row.detailLoading">
                <template v-if="scope.row.detailData">
                  <!-- 第一行:标题 -->
                  <div class="detail-header">
                    <div class="header-item">操作金额</div>
                    <div class="header-item">抵扣金子账户</div>
                    <div class="header-item">现金子账户</div>
                  </div>

                  <!-- 遍历所有数据行（包括多条 type=0） -->
                  <template v-for="(item, index) in scope.row.detailData.rows">
                    <!-- 分隔线（第二行开始显示） -->
                    <div
                      v-if="index > 0"
                      :key="'divider-' + index"
                      class="detail-divider"
                    ></div>

                    <!-- 数据行 -->
                    <div :key="'row-' + index" class="detail-section">
                      <!-- 第一行:充值/扣款金额 -->
                      <div class="detail-row">
                        <div class="row-item">
                          <!-- 操作金额：只在第一行显示，后续行显示 -- -->
                          <template v-if="index === 0">
                            <div class="label">
                              {{ getAmountActionLabel(scope.row) }}:
                            </div>
                            <div class="value">
                              {{ formatDetailAmount(scope.row.amount) }}
                            </div>
                          </template>
                          <template v-else>
                            <div class="label">--</div>
                            <div class="value"></div>
                          </template>
                        </div>

                        <div class="row-item">
                          <!-- 抵扣金子账户 -->
                          <div class="label">
                            {{
                              getSubAccountActionLabel(item.deductSubAccount)
                            }}:
                          </div>
                          <div class="value">
                            {{ formatDetailAmount(item.deductSubAccount) }}
                          </div>
                        </div>

                        <div class="row-item">
                          <!-- 现金子账户：只在第一行显示（如果有） -->
                          <template
                            v-if="
                              index === 0 && item.deductCashAccount !== null
                            "
                          >
                            <div class="label">
                              {{
                                getSubAccountActionLabel(
                                  item.deductCashAccount
                                )
                              }}:
                            </div>
                            <div class="value">
                              {{ formatDetailAmount(item.deductCashAccount) }}
                            </div>
                          </template>
                          <template v-else>
                            <div class="label">--</div>
                            <div class="value"></div>
                          </template>
                        </div>
                      </div>

                      <!-- 第二行:剩余 -->
                      <div class="detail-row">
                        <div class="row-item">
                          <!-- 操作金额剩余：只在第一行显示，后续行显示 -- -->
                          <template v-if="index === 0">
                            <div class="label">剩余:</div>
                            <div class="value">
                              {{ formatBalance(scope.row.tenantBalance) }}
                            </div>
                          </template>
                          <template v-else>
                            <div class="label">--</div>
                            <div class="value"></div>
                          </template>
                        </div>

                        <div class="row-item">
                          <!-- 抵扣金剩余 -->
                          <div class="label">剩余:</div>
                          <div class="value">
                            {{ formatBalance(item.remainSubAccount) }}
                          </div>
                        </div>

                        <div class="row-item">
                          <!-- 现金剩余：只在第一行显示（如果有） -->
                          <template
                            v-if="
                              index === 0 && item.remainCashAccount !== null
                            "
                          >
                            <div class="label">剩余:</div>
                            <div class="value">
                              {{ formatBalance(item.remainCashAccount) }}
                            </div>
                          </template>
                          <template v-else>
                            <div class="label">--</div>
                            <div class="value"></div>
                          </template>
                        </div>
                      </div>
                    </div>
                  </template>
                </template>
                <div v-else class="detail-empty">暂无明细数据</div>
              </div>
              <el-button
                slot="reference"
                type="text"
                size="small"
                class="detail-btn"
              >
                查看
              </el-button>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        @size-change="handleTurnoverSizeChange"
        @current-change="handleTurnoverCurrentChange"
        :current-page="turnoverForm.page.current"
        :page-sizes="[20, 30, 50, 100, 300]"
        :page-size="turnoverForm.page.size"
        :total="turnoverTotal"
        layout="total, sizes, prev, pager, next, jumper"
        small
      />
    </div>
  </div>
</template>

<script>
import {
  getTurnoverList,
  selectDiscRealTurnoverList,
} from "@/api/tenantDetail";

export default {
  name: "TenantTurnover",
  props: {
    tenantId: {
      type: [String, Number],
      required: true,
    },
    managerId: {
      type: [String, Number],
      default: "",
    },
  },
  data() {
    return {
      datePickerOptions: {
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
        ]
      },
      activeTab: "electric",
      turnoverForm: {
        managerId: "",
        tenantId: "",
        specialJump: "",
        tenantName: "",
        channelList: [],
        operate: "",
        endDate: "",
        startDate: "",
        tenantIdList: [],
        bizType: 1,
        page: {
          current: 1,
          size: 30,
          orders: [{ asc: false, column: "createTime" }],
        },
      },
      turnoverDateRange: [],
      turnoverList: [],
      turnoverTotal: 0,
      turnoverLoading: false,
      tableHeight: 400,
      detailDataCache: {},
    };
  },
  mounted() {
    this.initFormData();
    this.fetchTurnoverData();
    this.calculateTableHeight();
    window.addEventListener("resize", this.calculateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.calculateTableHeight);
  },
  methods: {
    initFormData() {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      this.turnoverForm.managerId = this.managerId;
      this.turnoverForm.tenantId = Number(this.tenantId);
      this.turnoverForm.endDate = endDate;
      this.turnoverForm.startDate = startDate;
      this.turnoverDateRange = [startDate, endDate];
    },

    switchTab(tab) {
      if (this.activeTab === tab) return;
      this.activeTab = tab;
      this.turnoverForm.bizType = tab === "electric" ? 1 : 2;
      this.turnoverForm.page.current = 1;
      this.detailDataCache = {};
      this.fetchTurnoverData();
    },

    calculateTableHeight() {
      this.$nextTick(() => {
        const wrapper = this.$el;
        if (!wrapper) return;

        const header = wrapper.querySelector(".header-wrapper");
        const pagination = wrapper.querySelector(".pagination-wrapper");

        const headerHeight = header ? header.offsetHeight : 0;
        const paginationHeight = pagination ? pagination.offsetHeight : 0;
        const wrapperHeight = wrapper.offsetHeight;

        const spacing = 40;
        this.tableHeight =
          wrapperHeight - headerHeight - paginationHeight - spacing;
      });
    },

    async fetchTurnoverData() {
      this.turnoverLoading = true;
      try {
        const response = await getTurnoverList(this.turnoverForm);
        if (response.code === 200) {
          this.turnoverList = response.data.dataList || [];
          this.turnoverTotal = response.data.total || 0;
        }
      } catch (error) {
        console.error("获取流水数据失败:", error);
        this.$message.error("获取流水数据失败");
      } finally {
        this.turnoverLoading = false;
      }
    },

    handleTurnoverDateChange(dateRange) {
      if (dateRange && dateRange.length === 2) {
        this.turnoverForm.startDate = dateRange[0];
        this.turnoverForm.endDate = dateRange[1];
      } else {
        this.turnoverForm.startDate = "";
        this.turnoverForm.endDate = "";
      }
      this.turnoverForm.page.current = 1;
      this.fetchTurnoverData();
    },

    async fetchDetailData(row) {
      if (this.detailDataCache[row.id]) {
        return this.detailDataCache[row.id];
      }

      try {
        const params = {
          newOperate: row.operate,
          newChannel: row.channel,
          tenantTurnoverId: row.id,
        };

        const response = await selectDiscRealTurnoverList(params);

        if (
          response.code === 200 &&
          response.data &&
          response.data.length > 0
        ) {
          const deductList = response.data.filter((item) => item.type === 0);
          const cashList = response.data.filter((item) => item.type === 1);

          const rows = [];

          deductList.forEach((deductItem, index) => {
            rows.push({
              deductSubAccount: deductItem.amount,
              remainSubAccount: deductItem.tenantBalance,
              deductCashAccount:
                index === 0 && cashList.length > 0 ? cashList[0].amount : null,
              remainCashAccount:
                index === 0 && cashList.length > 0
                  ? cashList[0].tenantBalance
                  : null,
            });
          });

          if (deductList.length === 0 && cashList.length > 0) {
            rows.push({
              deductSubAccount: null,
              remainSubAccount: null,
              deductCashAccount: cashList[0].amount,
              remainCashAccount: cashList[0].tenantBalance,
            });
          }

          if (rows.length === 0) {
            rows.push({
              deductSubAccount: null,
              remainSubAccount: null,
              deductCashAccount: null,
              remainCashAccount: null,
            });
          }

          const detailData = { rows };
          this.$set(this.detailDataCache, row.id, detailData);
          return detailData;
        }

        const emptyDetailData = {
          rows: [
            {
              deductSubAccount: null,
              remainSubAccount: null,
              deductCashAccount: null,
              remainCashAccount: null,
            },
          ],
        };
        this.$set(this.detailDataCache, row.id, emptyDetailData);
        return emptyDetailData;
      } catch (error) {
        console.error("获取明细数据失败:", error);
        const errorDetailData = {
          rows: [
            {
              deductSubAccount: null,
              remainSubAccount: null,
              deductCashAccount: null,
              remainCashAccount: null,
            },
          ],
        };
        return errorDetailData;
      }
    },

    async handleDetailShow(row) {
      if (row.detailData) {
        return;
      }

      this.$set(row, "detailLoading", true);

      try {
        const detailData = await this.fetchDetailData(row);
        this.$set(row, "detailData", detailData);
      } finally {
        this.$set(row, "detailLoading", false);
      }
    },

    resetTurnoverForm() {
      this.turnoverForm.operate = "";
      this.turnoverForm.channelList = [];
      this.turnoverForm.specialJump = "";
      this.turnoverForm.tenantName = "";

      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      this.turnoverForm.startDate = startDate;
      this.turnoverForm.endDate = endDate;
      this.turnoverDateRange = [startDate, endDate];

      this.turnoverForm.page.current = 1;
      this.detailDataCache = {};

      this.fetchTurnoverData();
    },

    handleTurnoverSizeChange(size) {
      this.turnoverForm.page.size = size;
      this.turnoverForm.page.current = 1;
      this.fetchTurnoverData();
    },

    handleTurnoverCurrentChange(current) {
      this.turnoverForm.page.current = current;
      this.fetchTurnoverData();
    },

    getOperateLabel(operate) {
      const operateMap = {
        1: "充值",
        2: "退款",
        3: "电费",
        4: "水费",
        5: "服务费",
        6: "房屋费",
        7: "物业费",
      };
      return operateMap[operate] || "未知";
    },

    getOperateTagType(operate) {
      const typeMap = {
        1: "success",
        2: "warning",
        3: "danger",
        4: "danger",
        5: "info",
        6: "info",
        7: "info",
      };
      return typeMap[operate] || "";
    },

    // 【核心修复】根据你的外层闭环逻辑判断操作金额的充值/扣款
    // 【核心修复】根据外层显示逻辑判断充值/扣款
    getAmountActionLabel(row) {
      if (row.amount === null || row.amount === undefined) return "操作";

      // 判断外层是否会加负号显示
      const shouldAddMinus = !(
        row.operate == 1 ||
        (row.operate == 3 && row.channel == 6)
      );

      // 获取 amount 的实际值
      const numAmount = parseFloat(row.amount);

      // 计算最终显示的值（考虑外层是否加负号）
      const finalAmount = shouldAddMinus ? -numAmount : numAmount;

      // 根据最终值的正负判断充值/扣款
      return finalAmount >= 0 ? "充值" : "扣款";
    },

    // 根据子账户金额判断充值/扣款标签
    getSubAccountActionLabel(amount) {
      if (amount === null || amount === undefined) return "--";
      const numAmount = parseFloat(amount);
      return numAmount >= 0 ? "充值" : "扣款";
    },

    getChannelLabel(channel) {
      const channelMap = {
        0: "微信充值",
        1: "对公充值",
        2: "手动充值",
        3: "普通结算",
        4: "手动扣款",
        5: "系统补单",
        6: "浮动电价",
        7: "分摊结算",
        8: "余额退款",
        9: "微信退款",
        10: "对公退款",
        11: "设备扣款",
      };
      return channelMap[channel] || "未知";
    },

    formatDetailAmount(amount) {
      if (amount === null || amount === undefined) return "--";
      const numAmount = parseFloat(amount);
      return Math.abs(numAmount).toFixed(2);
    },

    formatBalance(balance) {
      if (balance === null || balance === undefined || balance === "")
        return "--";
      return Number(balance).toFixed(2);
    },
  },
};
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

.tenant-turnover-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;

  .header-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    flex-shrink: 0;
    background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);

    .tabs-wrapper {
      display: flex;
      gap: 8px;

      .tab-item {
        padding: 10px 24px;
        cursor: pointer;
        font-size: 14px;
        color: $text-regular;
        background: #ffffff;
        border: 1px solid $border-light;
        border-radius: 6px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 6px;

        i {
          font-size: 16px;
        }

        &:hover {
          color: $primary-color;
          border-color: $primary-color;
          background: #ecf5ff;
        }

        &.active {
          background: $primary-color;
          color: #fff;
          font-weight: 500;
          border-color: $primary-color;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
        }
      }
    }

    .search-form {
      ::v-deep .el-form--inline .el-form-item {
        margin-right: 12px;
        margin-bottom: 0;
      }
    }
  }

  .table-wrapper {
    flex: 1;
    min-height: 0;
    margin-bottom: 20px;

    ::v-deep .el-table {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #f0f0f0 !important;

      th,
      td {
        border-color: #f0f0f0 !important;
      }

      .el-table__header-wrapper th {
        background: #f5f7fa;
        color: $text-regular;
        font-weight: 600;
        font-size: 13px;
      }

      .el-table__body {
        tr:hover > td {
          background: #f5f7fa !important;
        }

        td {
          font-size: 13px;
          color: $text-regular;
        }
      }
    }
  }

  .detail-btn {
    color: $primary-color;
    font-size: 13px;
    padding: 0;

    &:hover {
      color: #66b1ff;
    }
  }

  .pagination-wrapper {
    padding: 16px 20px;
    flex-shrink: 0;
    background: white;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid $border-light;

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
</style>

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

.tenant-turnover-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;

  // 顶部区域:标签页和搜索表单在同一行
  .header-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    flex-shrink: 0;
    background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);

    .tabs-wrapper {
      display: flex;
      gap: 8px;

      .tab-item {
        padding: 10px 24px;
        cursor: pointer;
        font-size: 14px;
        color: $text-regular;
        background: #ffffff;
        border: 1px solid $border-light;
        border-radius: 6px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 6px;

        i {
          font-size: 16px;
        }

        &:hover {
          color: $primary-color;
          border-color: $primary-color;
          background: #ecf5ff;
        }

        &.active {
          background: $primary-color;
          color: #fff;
          font-weight: 500;
          border-color: $primary-color;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
        }
      }
    }

    .search-form {
      ::v-deep .el-form--inline .el-form-item {
        margin-right: 12px;
        margin-bottom: 0;
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
      border: 1px solid #f0f0f0 !important;

      th,
      td {
        border-color: #f0f0f0 !important;
      }

      .el-table__header-wrapper th {
        background: #f5f7fa;
        color: $text-regular;
        font-weight: 600;
        font-size: 13px;
      }

      .el-table__body {
        tr:hover > td {
          background: #f5f7fa !important;
        }

        td {
          font-size: 13px;
          color: $text-regular;
        }
      }
    }
  }

  // 查看按钮
  .detail-btn {
    color: $primary-color;
    font-size: 13px;
    padding: 0;

    &:hover {
      color: #66b1ff;
    }
  }

  // 分页容器
  .pagination-wrapper {
    padding: 16px 20px;
    flex-shrink: 0;
    background: white;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid $border-light;

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
</style>

<style lang="scss">
// Popover浮层样式 - 必须是全局样式
.detail-popover {
  background: rgba(48, 49, 51, 0.95) !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 16px 20px !important;
  min-width: 480px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;

  .popper__arrow {
    display: none !important;
  }

  .detail-content {
    // 标题行
    .detail-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .header-item {
        flex: 1;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        font-weight: 500;
      }
    }

    // 数据部分容器
    .detail-section {
      margin-bottom: 0;
    }

    // 分隔线
    .detail-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 12px 0;
    }

    // 数据行
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 8px; // 保持一致的间距
      }

      .row-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;

        .label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .value {
          font-size: 14px;
          color: #fff;
          font-weight: 500;
        }
      }
    }

    // 空状态
    .detail-empty {
      text-align: center;
      padding: 20px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 13px;
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