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
          label-width="100px"
        >
          <!-- 第一行:筛选条件 -->
          <el-row :gutter="16" class="search-row" type="flex" align="middle">
            <!-- 租户名称/编号 -->
            <el-col :span="6">
              <el-form-item
                label="租户名称/编号"
                prop="tenantId"
                class="compact-form-item"
              >
                <el-select
                  v-model="queryData.tenantId"
                  filterable
                  clearable
                  placeholder="请选择租户"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in tenantList"
                    :key="item.tenantId"
                    :label="`${item.tenantId} - ${item.name}`"
                    :value="item.tenantId"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 操作时间 -->
            <el-col :span="7">
              <el-form-item
                label="操作时间"
                prop="timeRange"
                class="compact-form-item"
              >
                <el-date-picker
                  v-model="queryData.timeRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  value-format="yyyy-MM-dd"
                  size="small"
                  style="width: 100%"
                  :picker-options="pickerOptions"
                  :default-time="['00:00:00', '23:59:59']"
                  popper-class="elegant-date-picker"
                  @change="handleDateChange"
                />
              </el-form-item>
            </el-col>

            <!-- 操作按钮 -->
            <el-col :span="11" style="text-align: right">
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
            </el-col>
          </el-row>

          <!-- 第二行：手动充值按钮 -->
          <el-row :gutter="16" style="margin-top: 12px">
            <el-col :span="24">
              <el-button
                type="primary"
                icon="el-icon-plus"
                size="small"
                @click="handleManualRecharge"
              >
                手动充值
              </el-button>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-container" style="height: 475px">
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
            background: 'linear-gradient(180deg, #f8f9fc 0%, #f0f2f5 100%)',
            color: '#1f2329',
            fontWeight: '600',
            fontSize: '13px',
            borderBottom: '2px solid #e8e8e8',
          }"
        >
          <!-- 流水号 -->
          <el-table-column
            prop="seqNo"
            label="流水号"
            width="200"
            align="center"
            show-overflow-tooltip
          />

          <!-- 操作时间 -->
          <el-table-column
            prop="occurTime"
            label="操作时间"
            width="160"
            align="center"
          />

          <!-- 租户名 -->
          <el-table-column
            prop="tenantName"
            label="租户名"
            min-width="200"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <span class="tenant-name">{{ scope.row.tenantName || "-" }}</span>
            </template>
          </el-table-column>

          <!-- 充值账户 -->
          <el-table-column
            prop="rechargeAccount"
            label="充值账户"
            width="150"
            align="center"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.rechargeAccount || "--" }}</span>
            </template>
          </el-table-column>

          <!-- 充值金额 -->
          <el-table-column
            prop="amount"
            label="充值金额(元)"
            width="130"
            align="center"
          >
            <template slot-scope="scope">
              <span class="amount-text">
                ¥{{ formatMoney(scope.row.amount) }}
              </span>
            </template>
          </el-table-column>

          <!-- 备注 -->
          <el-table-column
            prop="comment"
            label="备注"
            min-width="180"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <span>{{ scope.row.comment || "-" }}</span>
            </template>
          </el-table-column>

          <!-- 操作人 -->
          <el-table-column
            prop="operator"
            label="操作人"
            width="120"
            align="center"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.operator || "-" }}</span>
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
import {
  capitalManagePageTenantRecord,
  getSimpleTenantList,
} from "@/api/publicRecharge";
import { mapGetters } from "vuex";

export default {
  name: "ManualRecharge",
  data() {
    return {
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 9,
        paginationHeight: 68,
      },

      // ========== 查询相关 ==========
      queryData: {
        tenantId: "",
        timeRange: [],
      },

      // 日期选择器快捷选项
      pickerOptions: {
        shortcuts: [
          {
            text: "昨天",
            onClick(picker) {
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setTime(end.getTime() - 3600 * 1000 * 24);
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "本周",
            onClick(picker) {
              const now = new Date();
              const dayOfWeek = now.getDay();
              const start = new Date(now);
              const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
              start.setDate(now.getDate() + diff);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "上周",
            onClick(picker) {
              const now = new Date();
              const dayOfWeek = now.getDay();
              const start = new Date(now);
              const diff = dayOfWeek === 0 ? -13 : -6 - dayOfWeek;
              start.setDate(now.getDate() + diff);
              start.setHours(0, 0, 0, 0);
              const end = new Date(start);
              end.setDate(start.getDate() + 6);
              end.setHours(23, 59, 59, 999);
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
          {
            text: "近三个月",
            onClick(picker) {
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              const start = new Date();
              start.setMonth(start.getMonth() - 3);
              start.setHours(0, 0, 0, 0);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "近一年",
            onClick(picker) {
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              const start = new Date();
              start.setFullYear(start.getFullYear() - 1);
              start.setHours(0, 0, 0, 0);
              picker.$emit("pick", [start, end]);
            },
          },
        ],
      },

      // 租户列表
      tenantList: [],

      // ========== 表格相关 ==========
      tableData: [],
      loading: false,

      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0,
      },
    };
  },

  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    tableMaxHeight() {
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
          this.fetchTenantList();
          this.setDefaultTimeRange();
          this.fetchTableData();
        }
      },
      immediate: true,
    },
  },

  methods: {
    // ==================== 工具方法 ====================

    // 设置默认时间范围（最近30天）
    setDefaultTimeRange() {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setTime(startDate.getTime() - 3600 * 1000 * 24 * 30);

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

    // 格式化金额
    formatMoney(amount) {
      if (amount === null || amount === undefined) return "0.00";
      return Number(amount).toFixed(2);
    },

    // ==================== 查询相关方法 ====================

    // 日期变化时自动触发查询
    handleDateChange(value) {
      if (value && value.length === 2 && value[0] && value[1]) {
        this.handleSearch();
      }
    },

    // 获取租户列表
    async fetchTenantList() {
      try {
        const params = {
          managerId: this.currentManagerId,
          tenantStatus: 0,
        };

        const response = await getSimpleTenantList(params);
        if (response.code === 200) {
          this.tenantList = response.data || [];
        }
      } catch (error) {
        console.error("获取租户列表失败:", error);
        this.$message.error("获取租户列表失败");
      }
    },

    // 获取表格数据
    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          managerId: this.currentManagerId,
          tenantId: this.queryData.tenantId || null,
          startDate:
            this.queryData.timeRange && this.queryData.timeRange[0]
              ? `${this.queryData.timeRange[0]} 00:00:00`
              : "",
          endDate:
            this.queryData.timeRange && this.queryData.timeRange[1]
              ? `${this.queryData.timeRange[1]} 23:59:59`
              : "",
          channels: ["PRIVATE_TO_PRIVATE"], // ⭐ 手动充值渠道
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            orders: [{ asc: false, column: "occurTime" }],
          },
        };

        const response = await capitalManagePageTenantRecord(params);

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || [];
          this.pageData.total = response.data.total || 0;
        } else {
          this.$message.error(response.msg || "获取数据失败");
        }
      } catch (error) {
        this.$message.error("获取充值记录失败");
        console.error("获取充值记录失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 查询
    handleSearch() {
      this.pageData.current = 1;
      this.fetchTableData();
    },

    // 重置
    handleReset() {
      this.queryData = {
        tenantId: "",
        timeRange: [],
      };
      this.setDefaultTimeRange();
      this.handleSearch();
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

    // ==================== 手动充值相关方法 ====================

    // 手动充值
    handleManualRecharge() {
      this.$message.info("功能暂未开放");
    },
  },
};
</script>

<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";

.amount-text {
  color: #67c23a;
  font-weight: 600;
  font-size: 14px;
}

.tenant-name {
  color: #303133;
  font-weight: 500;
}
</style>

<style lang="scss">
// ========== 全局样式：自定义日期选择器（简洁层次版）==========
.elegant-date-picker {
  // 快捷选项容器
  .el-picker-panel__sidebar {
    width: 115px !important;
    padding: 12px 8px !important;
    background: #fafafa !important;
    border: none !important;
    border-right: 1px solid #e8e8e8 !important;
  }

  // 快捷选项按钮 - 简洁层次感
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

    // 悬停效果 - 微妙的层次感
    &:hover {
      color: #409eff !important;
      background: #f0f7ff !important;
      box-shadow: 0 2px 6px rgba(64, 158, 255, 0.15) !important;
      transform: translateY(-1px) !important;
      border: none !important;
    }

    // 激活效果
    &:active {
      transform: translateY(0) !important;
      box-shadow: 0 1px 3px rgba(64, 158, 255, 0.1) !important;
      border: none !important;
    }

    // 获得焦点时
    &:focus {
      border: none !important;
      outline: none !important;
    }

    // 最后一个按钮
    &:last-child {
      margin-bottom: 0 !important;
    }
  }

  // 日历主体
  .el-picker-panel__body {
    padding-left: 12px !important;
  }

  // ⭐ 强制去除所有可能的边框
  .el-picker-panel__shortcut,
  button.el-picker-panel__shortcut {
    border: none !important;
    border-top: none !important;
    border-right: none !important;
    border-bottom: none !important;
    border-left: none !important;
    box-sizing: border-box !important;
  }

  // 日期表格优化
  .el-date-table {
    td {
      padding: 5px 0 !important;

      &.available:hover {
        color: #409eff !important;
        background: #f0f7ff !important;
        border-radius: 4px !important;
      }

      &.in-range {
        background: #f5f9ff !important;
      }

      &.start-date,
      &.end-date {
        span {
          background: #409eff !important;
          color: #ffffff !important;
          border-radius: 4px !important;
        }
      }

      &.today span {
        color: #409eff !important;
        font-weight: 600 !important;
        position: relative !important;

        &::after {
          content: "" !important;
          position: absolute !important;
          bottom: 2px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 4px !important;
          height: 4px !important;
          background: #409eff !important;
          border-radius: 50% !important;
        }
      }

      // ⭐ 修复：当今天是开始或结束日期时，保持白色文字
      &.today.start-date span,
      &.today.end-date span {
        color: #ffffff !important;
        
        &::after {
          background: #ffffff !important;
        }
      }
    }
  }

  // 月份选择器
  .el-month-table td {
    &.current:not(.disabled) .cell {
      color: #409eff !important;
      font-weight: 600 !important;
    }

    .cell:hover {
      color: #409eff !important;
      background: #f0f7ff !important;
      border-radius: 4px !important;
    }
  }

  // 年份选择器
  .el-year-table td {
    &.current:not(.disabled) .cell {
      color: #409eff !important;
      font-weight: 600 !important;
    }

    .cell:hover {
      color: #409eff !important;
      background: #f0f7ff !important;
      border-radius: 4px !important;
    }
  }

  // 底部按钮区域
  .el-picker-panel__footer {
    padding: 10px 12px !important;
    background: #fafafa !important;
    border-top: 1px solid #e8e8e8 !important;

    .el-button {
      border-radius: 4px !important;
      font-weight: 500 !important;
      padding: 7px 15px !important;
      transition: all 0.2s !important;

      &.el-button--text {
        &:hover {
          background: #f0f7ff !important;
          color: #409eff !important;
        }
      }

      &.el-button--primary {
        background: #409eff !important;

        &:hover {
          background: #66b1ff !important;
        }
      }
    }
  }

  // 头部按钮优化
  .el-picker-panel__icon-btn {
    color: #606266 !important;
    transition: all 0.2s !important;

    &:hover {
      color: #409eff !important;
    }
  }
}
</style>