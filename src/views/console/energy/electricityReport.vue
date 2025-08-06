<template>
  <div class="electricity-dashboard">
    <!-- 顶部操作栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">用电报表</h1>
        <div class="view-switcher">
          <button
            :class="['view-btn', { active: dateType === 'day' }]"
            @click="switchDateType('day')"
          >
            日统计
          </button>
          <button
            :class="['view-btn', { active: dateType === 'month' }]"
            @click="switchDateType('month')"
          >
            月统计
          </button>
        </div>
      </div>

      <div class="header-right">
        <button
          class="export-btn"
          @click="handleExport"
          v-if="!switchDeviceDetail"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
            />
          </svg>
          导出报表
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-container">
      <div class="filter-item date-filter">
        <label class="filter-label">统计时间</label>
        <el-date-picker
          v-model="queryParams.dateRange"
          :type="datePickerType"
          :format="dateFormat"
          :value-format="dateValueFormat"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :picker-options="pickerOptions"
          class="custom-date-picker"
          @change="handleDateRangeChange"
        />
      </div>

      <div class="filter-item tenant-filter">
        <label class="filter-label">选择租户</label>
        <el-select
          v-model="queryParams.tenantIds"
          multiple
          collapse-tags
          filterable
          placeholder="请选择租户"
          class="custom-select"
          :loading="tenantLoading"
        >
          <el-option
            v-for="tenant in tenantList"
            :key="tenant.tenantId"
            :label="tenant.name"
            :value="tenant.tenantId"
          />
        </el-select>
      </div>

      <div class="filter-actions">
        <button class="search-btn" @click="handleSearch">
          查询
        </button>
        <button class="reset-btn" @click="handleReset">
          重置
        </button>
        <button
        class="reset-btn"
          @click="toggleSelectAll"
          :disabled="tenantLoading || tenantList.length === 0"
        >
          {{ isAllSelected ? "取消全选" : "全选" }}
        </button>

        <div class="detail-switch" v-if="queryParams.tenantIds.length === 1">
          <span class="switch-text">设备明细</span>
          <label class="toggle-switch">
            <input
              type="checkbox"
              v-model="switchDeviceDetail"
              @change="handleSwitchChange"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-cards" v-if="!switchDeviceDetail && tableData.length > 0">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">总电费</div>
          <div class="stat-value">¥{{ formatNumber(totalStats.amount) }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">总电量</div>
          <div class="stat-value">
            {{ formatNumber(totalStats.elec) }} <span class="unit">度</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">峰谷电量比</div>
          <div class="stat-value">{{ peakValleyRatio }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">日均电费</div>
          <div class="stat-value">¥{{ formatNumber(avgDailyAmount) }}</div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div
      class="main-content"
      v-loading="loading"
      :element-loading-text="loadingText"
    >
      <!-- 图表区域 - 新设计 -->
      <div
        class="chart-section"
        v-if="!switchDeviceDetail && chartData.length > 0"
      >
        <div class="chart-container">
          <!-- 图表头部 -->
          <div class="chart-header">
            <h2 class="chart-title">
              {{ dateType === "day" ? "用电趋势分析" : "月度用电趋势" }}
            </h2>
            <div class="chart-date-range">
              {{ formatDateRange }}
            </div>
          </div>

          <!-- 图例和统计信息 -->
          <div class="chart-info">
            <div class="chart-legends">
              <div class="legend-item active" @click="toggleSeries('电费')">
                <span class="legend-dot" style="background: #1890ff"></span>
                <span class="legend-text">电费</span>
              </div>
              <div class="legend-item active" @click="toggleSeries('总电量')">
                <span class="legend-dot" style="background: #52c41a"></span>
                <span class="legend-text">总电量</span>
              </div>
            </div>

            <div class="chart-summary">
              <div class="summary-item">
                <span class="summary-label">总电费</span>
                <span class="summary-value"
                  >¥ {{ formatNumber(totalStats.amount) }}</span
                >
              </div>
              <div class="summary-item">
                <span class="summary-label">总电量</span>
                <span class="summary-value"
                  >{{ formatNumber(totalStats.elec) }} 度</span
                >
              </div>
            </div>
          </div>

          <!-- 图表主体 -->
          <div ref="mainChartContainer" class="main-chart"></div>
        </div>

        <!-- 分时电量监控 -->
        <div class="monitor-container">
          <div class="monitor-header">
            <h3 class="monitor-title">分时电量监控</h3>
          </div>

          <div class="monitor-content">
            <div ref="monitorChartContainer" class="monitor-chart"></div>

            <div class="monitor-stats">
              <div class="monitor-stat-item">
                <span class="stat-icon spike"></span>
                <span class="stat-name">尖电量</span>
                <span class="stat-value">{{
                  formatNumber(totalStats.elecPeak)
                }}</span>
              </div>
              <div class="monitor-stat-item">
                <span class="stat-icon peak"></span>
                <span class="stat-name">峰电量</span>
                <span class="stat-value">{{
                  formatNumber(totalStats.elecTop)
                }}</span>
              </div>
              <div class="monitor-stat-item">
                <span class="stat-icon flat"></span>
                <span class="stat-name">平电量</span>
                <span class="stat-value">{{
                  formatNumber(totalStats.elecFlat)
                }}</span>
              </div>
              <div class="monitor-stat-item">
                <span class="stat-icon valley"></span>
                <span class="stat-name">谷电量</span>
                <span class="stat-value">{{
                  formatNumber(totalStats.elecValley)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计表格 -->
      <div class="table-section" v-if="!switchDeviceDetail">
        <div class="section-header">
          <h2 class="section-title">详细数据</h2>
        </div>

        <div class="modern-table" v-if="tableData.length > 0">
          <div class="table-header">
            <div class="table-cell">日期</div>
            <div class="table-cell numeric">电费(元)</div>
            <div class="table-cell numeric">总电量(度)</div>
            <div class="table-cell numeric">尖电量</div>
            <div class="table-cell numeric">峰电量</div>
            <div class="table-cell numeric">平电量</div>
            <div class="table-cell numeric">谷电量</div>
          </div>

          <div class="table-body">
            <div
              v-for="(row, index) in tableData"
              :key="index"
              class="table-row"
            >
              <div class="table-cell">{{ row.occurDate }}</div>
              <div class="table-cell numeric amount">
                ¥{{ formatNumber(row.useAmount) }}
              </div>
              <div class="table-cell numeric">
                {{ formatNumber(row.useElec) }}
              </div>
              <div class="table-cell numeric">
                {{ formatNumber(row.useElecPeak) }}
              </div>
              <div class="table-cell numeric">
                {{ formatNumber(row.useElecTop) }}
              </div>
              <div class="table-cell numeric">
                {{ formatNumber(row.useElecFlat) }}
              </div>
              <div class="table-cell numeric">
                {{ formatNumber(row.useElecValley) }}
              </div>
            </div>
          </div>

          <div class="table-footer">
            <div class="table-cell">合计</div>
            <div class="table-cell numeric amount">
              ¥{{ formatNumber(totalStats.amount) }}
            </div>
            <div class="table-cell numeric">
              {{ formatNumber(totalStats.elec) }}
            </div>
            <div class="table-cell numeric">
              {{ formatNumber(totalStats.elecPeak) }}
            </div>
            <div class="table-cell numeric">
              {{ formatNumber(totalStats.elecTop) }}
            </div>
            <div class="table-cell numeric">
              {{ formatNumber(totalStats.elecFlat) }}
            </div>
            <div class="table-cell numeric">
              {{ formatNumber(totalStats.elecValley) }}
            </div>
          </div>
        </div>

        <div class="empty-state" v-else-if="!loading">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <p>暂无数据</p>
        </div>
      </div>

      <!-- 设备明细表格 -->
      <div class="table-section" v-if="switchDeviceDetail">
        <div class="section-header">
          <h2 class="section-title">设备用电明细</h2>
        </div>

        <div class="device-detail-table" v-if="deviceDetailData.length > 0">
          <div class="detail-header">
            <div class="header-group date-group">日期汇总</div>
            <div class="header-group device-group">设备信息</div>
            <div class="header-group elec-group">电量详情(度)</div>
          </div>

          <div class="detail-subheader">
            <div class="cell">日期</div>
            <div class="cell numeric">电费</div>
            <div class="cell numeric">总电量</div>
            <div class="cell">设备名称</div>
            <div class="cell">结算方式</div>
            <div class="cell numeric">费用</div>
            <div class="cell numeric">总计</div>
            <div class="cell numeric">尖</div>
            <div class="cell numeric">峰</div>
            <div class="cell numeric">平</div>
            <div class="cell numeric">谷</div>
          </div>

          <div class="detail-body">
            <template v-for="(row, index) in deviceDetailData">
              <div :key="index" class="detail-row">
                <div class="cell" v-if="row.col > 0">{{ row.occurDate }}</div>
                <div class="cell numeric amount" v-if="row.col > 0">
                  ¥{{ formatNumber(row.useAmount) }}
                </div>
                <div class="cell numeric" v-if="row.col > 0">
                  {{ formatNumber(row.useElec) }}
                </div>
                <div class="cell" v-if="row.col === 0"></div>
                <div class="cell" v-if="row.col === 0"></div>
                <div class="cell" v-if="row.col === 0"></div>

                <div class="cell device-name">
                  {{ row.deviceUseDtoList.meterName || "-" }}
                </div>
                <div class="cell">
                  <span
                    v-if="row.deviceUseDtoList.settleWay"
                    :class="[
                      'settle-tag',
                      getSettleWayClass(row.deviceUseDtoList.settleWay),
                    ]"
                  >
                    {{ getSettleWayLabel(row.deviceUseDtoList.settleWay) }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div class="cell numeric amount">
                  ¥{{ formatNumber(row.deviceUseDtoList.useAmount) || "-" }}
                </div>
                <div class="cell numeric">
                  {{ formatNumber(row.deviceUseDtoList.useElec) || "-" }}
                </div>
                <div class="cell numeric">
                  {{ formatNumber(row.deviceUseDtoList.useElecPeak) || "-" }}
                </div>
                <div class="cell numeric">
                  {{ formatNumber(row.deviceUseDtoList.useElecTop) || "-" }}
                </div>
                <div class="cell numeric">
                  {{ formatNumber(row.deviceUseDtoList.useElecFlat) || "-" }}
                </div>
                <div class="cell numeric">
                  {{ formatNumber(row.deviceUseDtoList.useElecValley) || "-" }}
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="empty-state" v-else-if="!loading">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 3v4m8-4v4M3 11h18" />
          </svg>
          <p>暂无设备明细数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import {
  getSimpleTenantList,
  queryTenantUse,
  useReportQueryTenantUseStatis,
} from "@/api/useReport";
import moment from "moment";

export default {
  name: "ElectricityReport",
  data() {
    return {
      dateType: "day",
      queryParams: {
        dateRange: [],
        tenantIds: [],
      },

      handleDateRangeChange(val) {
        if (val && val.length === 2 && this.dateType === "day") {
          const [start, end] = val;
          const startDate = new Date(start);
          const endDate = new Date(end);
          const diffDays = Math.floor(
            (endDate - startDate) / (24 * 3600 * 1000)
          );

          if (diffDays > 90) {
            this.$message.warning("日统计最多只能选择3个月的数据");
            // 自动调整结束日期为开始日期后90天
            const newEndDate = new Date(
              startDate.getTime() + 90 * 24 * 3600 * 1000
            );
            this.queryParams.dateRange = [
              start,
              moment(newEndDate).format("YYYY-MM-DD"),
            ];
          }
        }
      },
      tenantList: [],
      tenantLoading: false,
      loading: false,
      loadingText: "数据加载中...",
      chartData: [],
      tableData: [],
      deviceDetailData: [],
      switchDeviceDetail: false,
      mainChartInstance: null,
      monitorChartInstance: null,
      pickerOptions: {
        shortcuts: [
          {
            text: "最近一周",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "最近一个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "最近三个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit("pick", [start, end]);
            },
          },
        ],
        disabledDate(time) {
          // 禁用今天之后的日期
          if (time.getTime() > Date.now()) {
            return true;
          }
          return false;
        },
        onPick: ({ maxDate, minDate }) => {
          // 限制选择范围不超过3个月
          if (minDate && !maxDate) {
            // 当选择了开始日期，限制结束日期的范围
            this.pickerMinDate = minDate.getTime();
            this.pickerMaxDate = minDate.getTime() + 90 * 24 * 3600 * 1000; // 3个月
          }
          if (maxDate) {
            this.pickerMinDate = null;
            this.pickerMaxDate = null;
          }
        },
      },
      pickerMinDate: null,
      pickerMaxDate: null,
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    datePickerType() {
      return this.dateType === "day" ? "daterange" : "monthrange";
    },
    dateFormat() {
      return this.dateType === "day" ? "yyyy-MM-dd" : "yyyy-MM";
    },
    dateValueFormat() {
      return this.dateType === "day" ? "yyyy-MM-dd" : "yyyy-MM";
    },
    formatDateRange() {
      if (
        !this.queryParams.dateRange ||
        this.queryParams.dateRange.length !== 2
      ) {
        return "";
      }
      const [start, end] = this.queryParams.dateRange;
      if (this.dateType === "day") {
        return `${start} - ${end}`;
      } else {
        return `${start} 至 ${end}`;
      }
    },
    totalStats() {
      const stats = {
        amount: 0,
        elec: 0,
        elecPeak: 0,
        elecTop: 0,
        elecFlat: 0,
        elecValley: 0,
      };

      this.tableData.forEach((item) => {
        stats.amount += Number(item.useAmount) || 0;
        stats.elec += Number(item.useElec) || 0;
        stats.elecPeak += Number(item.useElecPeak) || 0;
        stats.elecTop += Number(item.useElecTop) || 0;
        stats.elecFlat += Number(item.useElecFlat) || 0;
        stats.elecValley += Number(item.useElecValley) || 0;
      });

      return stats;
    },
    peakValleyRatio() {
      const peak = this.totalStats.elecPeak + this.totalStats.elecTop;
      const valley = this.totalStats.elecValley;
      if (valley === 0) return "-";
      return (peak / valley).toFixed(2);
    },
    avgDailyAmount() {
      if (this.tableData.length === 0) return 0;
      return (this.totalStats.amount / this.tableData.length).toFixed(2);
    },
    isAllSelected() {
      return (
        this.tenantList.length > 0 &&
        this.queryParams.tenantIds.length === this.tenantList.length
      );
    },
  },
  watch: {
    currentManagerId: {
      handler(val) {
        if (val) {
          this.initializeData();
        }
      },
      immediate: true,
    },
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
    if (this.mainChartInstance) {
      this.mainChartInstance.dispose();
    }
    if (this.monitorChartInstance) {
      this.monitorChartInstance.dispose();
    }
  },
  methods: {
    async initializeData() {
      this.setDefaultDateRange();
      await this.getTenantList();
      // 默认全选所有租户
      if (this.tenantList.length > 0) {
        this.queryParams.tenantIds = this.tenantList.map(
          (item) => item.tenantId
        );
      }
      this.handleSearch();
    },

    setDefaultDateRange() {
      if (this.dateType === "day") {
        this.queryParams.dateRange = [
          moment().subtract(30, "days").format("YYYY-MM-DD"),
          moment().format("YYYY-MM-DD"),
        ];
      } else {
        this.queryParams.dateRange = [
          moment().subtract(3, "months").format("YYYY-MM"),
          moment().format("YYYY-MM"),
        ];
      }
    },

    async getTenantList() {
      this.tenantLoading = true;
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0,
        });
        this.tenantList = data || [];
      } catch (error) {
        this.$message.error("获取租户列表失败");
        console.error("获取租户列表失败:", error);
      } finally {
        this.tenantLoading = false;
      }
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.queryParams.tenantIds = [];
      } else {
        this.queryParams.tenantIds = this.tenantList.map(
          (item) => item.tenantId
        );
      }
    },

    switchDateType(type) {
      this.dateType = type;
      this.setDefaultDateRange();
      this.handleSearch();
    },

    toggleSeries(seriesName) {
      // 切换图表系列显示/隐藏
      if (this.mainChartInstance) {
        this.mainChartInstance.dispatchAction({
          type: "legendToggleSelect",
          name: seriesName,
        });
      }
    },

    async handleSearch() {
      if (
        !this.queryParams.dateRange ||
        this.queryParams.dateRange.length !== 2
      ) {
        this.$message.warning("请选择统计时间");
        return;
      }

      if (this.queryParams.tenantIds.length === 0) {
        this.$message.warning("请选择租户");
        return;
      }

      this.loading = true;
      try {
        if (this.switchDeviceDetail) {
          await this.getDeviceDetailData();
        } else {
          await this.getStatisticsData();
        }
      } catch (error) {
        this.$message.error("获取数据失败");
        console.error("获取数据失败:", error);
      } finally {
        this.loading = false;
      }
    },

    async getStatisticsData() {
      let startDate = this.queryParams.dateRange[0];
      let endDate = this.queryParams.dateRange[1];

      if (this.dateType === "month" && startDate.length === 7) {
        startDate += "-01";
        endDate += "-01";
      }

      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: this.dateType === "day" ? 1 : 2,
        selectType: 2,
        tenantIdList: this.queryParams.tenantIds,
      };

      const { data } = await useReportQueryTenantUseStatis(params);

      if (this.dateType === "month" && data) {
        data.forEach((item) => {
          if (item.occurDate && item.occurDate.length > 7) {
            item.occurDate = item.occurDate.slice(0, 7);
          }
        });
      }

      this.tableData = data || [];
      this.chartData = data || [];
      this.$nextTick(() => {
        this.initializeMainChart();
        this.initializeMonitorChart();
        this.updateCharts();
      });
    },

    async getDeviceDetailData() {
      let startDate = this.queryParams.dateRange[0];
      let endDate = this.queryParams.dateRange[1];

      if (this.dateType === "month" && startDate.length === 7) {
        startDate += "-01";
        endDate += "-01";
      }

      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: this.dateType === "day" ? 1 : 2,
        selectType: 0,
        tenantIdList: this.queryParams.tenantIds,
      };

      const { data } = await useReportQueryTenantUseStatis(params);

      const detailData = [];
      if (data && data.length > 0) {
        data.forEach((item) => {
          if (item.deviceUseDtoList && item.deviceUseDtoList.length > 0) {
            item.deviceUseDtoList.forEach((device, index) => {
              detailData.push({
                occurDate: item.occurDate,
                useAmount: item.useAmount,
                useElec: item.useElec,
                useElecPeak: item.useElecPeak,
                useElecTop: item.useElecTop,
                useElecFlat: item.useElecFlat,
                useElecValley: item.useElecValley,
                col: index === 0 ? item.deviceUseDtoList.length : 0,
                deviceUseDtoList: device,
              });
            });
          } else {
            detailData.push({
              ...item,
              col: 1,
              deviceUseDtoList: {},
            });
          }
        });
      }

      this.deviceDetailData = detailData;
    },

    handleReset() {
      this.setDefaultDateRange();
      // 重置为全选
      if (this.tenantList.length > 0) {
        this.queryParams.tenantIds = this.tenantList.map(
          (item) => item.tenantId
        );
      }
      this.switchDeviceDetail = false;
      this.handleSearch();
    },

    handleExport() {
      this.$message.info("导出功能开发中...");
    },

    handleSwitchChange(val) {
      if (val && this.queryParams.tenantIds.length !== 1) {
        this.$message.warning("查看设备明细请选择单个租户");
        this.switchDeviceDetail = false;
        return;
      }
      this.handleSearch();
    },

    initializeMainChart() {
      if (!this.$refs.mainChartContainer) return;
      this.mainChartInstance = this.$echarts.init(
        this.$refs.mainChartContainer
      );
    },

    initializeMonitorChart() {
      if (!this.$refs.monitorChartContainer) return;
      this.monitorChartInstance = this.$echarts.init(
        this.$refs.monitorChartContainer
      );
    },

    updateCharts() {
      this.updateMainChart();
      this.updateMonitorChart();
    },

    updateMainChart() {
      if (!this.mainChartInstance || this.chartData.length === 0) return;

      const xAxisData = this.chartData.map((item) => {
        if (this.dateType === "day") {
          return moment(item.occurDate).format("MM-DD");
        }
        return item.occurDate;
      });

      const option = {
        color: ["#1890ff", "#52c41a"],
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#e8e8e8",
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: "#333",
            fontSize: 14,
          },
          axisPointer: {
            type: "cross",
            crossStyle: {
              color: "#999",
            },
          },
          formatter: (params) => {
            let html = `<div style="font-weight: 500; margin-bottom: 8px">${params[0].name}</div>`;
            params.forEach((item) => {
              const unit = item.seriesName === "电费" ? "¥" : "";
              const suffix = item.seriesName === "总电量" ? " 度" : "";
              html += `
                <div style="display: flex; align-items: center; margin-bottom: 4px">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${
                    item.color
                  }; border-radius: 50%; margin-right: 8px"></span>
                  <span style="flex: 1">${item.seriesName}</span>
                  <span style="font-weight: 500">${unit}${this.formatNumber(
                item.value
              )}${suffix}</span>
                </div>
              `;
            });
            return html;
          },
        },
        legend: {
          data: ["电费", "总电量"],
          bottom: 35,
          itemGap: 20,
          textStyle: {
            color: "#666",
          },
        },
        grid: {
          top: 30,
          left: 50,
          right: 50,
          bottom: 75,
          containLabel: true,
        },
        dataZoom: [
          {
            type: "inside",
            start: this.dateType === "day" ? 80 : 0,
            end: 100,
          },
          {
            type: "slider",
            start: this.dateType === "day" ? 80 : 0,
            end: 100,
            height: 8,
            bottom: 5,
            borderColor: "transparent",
            backgroundColor: "#f0f0f0",
            handleSize: 14,
            handleStyle: {
              color: "#fff",
              borderColor: "#d1d1d1",
              borderWidth: 1,
              shadowBlur: 2,
              shadowColor: "rgba(0, 0, 0, 0.1)",
              shadowOffsetX: 1,
              shadowOffsetY: 1,
            },
            moveHandleSize: 3,
            showDetail: false,
            showDataShadow: false,
            brushSelect: false,
            fillerColor: "rgba(24, 144, 255, 0.15)",
            textStyle: {
              fontSize: 0,
            },
          },
        ],
        xAxis: {
          type: "category",
          data: xAxisData,
          boundaryGap: false,
          axisTick: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: "#e8e8e8",
            },
          },
          axisLabel: {
            color: "#666",
            fontSize: 12,
          },
        },
        yAxis: [
          {
            type: "value",
            name: "电费 (元)",
            nameTextStyle: {
              color: "#666",
              padding: [0, 0, 0, 20],
            },
            splitLine: {
              lineStyle: {
                color: "#f0f0f0",
                type: "dashed",
              },
            },
            axisLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              color: "#666",
              fontSize: 12,
              formatter: (value) => {
                if (value >= 10000) {
                  return value / 10000 + "w";
                }
                if (value >= 1000) {
                  return value / 1000 + "k";
                }
                return value;
              },
            },
          },
          {
            type: "value",
            name: "电量 (度)",
            nameTextStyle: {
              color: "#666",
              padding: [0, 20, 0, 0],
            },
            splitLine: {
              show: false,
            },
            axisLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              color: "#666",
              fontSize: 12,
              formatter: (value) => {
                if (value >= 10000) {
                  return value / 10000 + "w";
                }
                if (value >= 1000) {
                  return value / 1000 + "k";
                }
                return value;
              },
            },
          },
        ],
        series: [
          {
            name: "电费",
            type: "line",
            data: this.chartData.map((item) => item.useAmount),
            smooth: true,
            symbol: "none", // 去掉圆点
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              opacity: 0.3,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(24, 144, 255, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(24, 144, 255, 0.05)",
                  },
                ],
              },
            },
          },
          {
            name: "总电量",
            type: "line",
            yAxisIndex: 1,
            data: this.chartData.map((item) => item.useElec),
            smooth: true,
            symbol: "none", // 去掉圆点
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              opacity: 0.3,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(82, 196, 26, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(82, 196, 26, 0.05)",
                  },
                ],
              },
            },
          },
        ],
      };

      this.mainChartInstance.setOption(option);
    },

    updateMonitorChart() {
      if (!this.monitorChartInstance || this.chartData.length === 0) return;

      const xAxisData = this.chartData.map((item) => {
        if (this.dateType === "day") {
          return moment(item.occurDate).format("MM-DD");
        }
        return item.occurDate;
      });

      const option = {
        color: ["#ff6b6b", "#ff922b", "#51cf66", "#339af0"],
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#e8e8e8",
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: "#333",
            fontSize: 14,
          },
          formatter: (params) => {
            let html = `<div style="font-weight: 500; margin-bottom: 8px">${params[0].name}</div>`;
            params.forEach((item) => {
              html += `
                <div style="display: flex; align-items: center; margin-bottom: 4px">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${
                    item.color
                  }; border-radius: 50%; margin-right: 8px"></span>
                  <span style="flex: 1">${item.seriesName}</span>
                  <span style="font-weight: 500">${this.formatNumber(
                    item.value
                  )} 度</span>
                </div>
              `;
            });
            return html;
          },
        },
        legend: {
          show: false, // 隐藏图例，因为右侧已经有统计了
        },
        grid: {
          top: 15,
          left: 45,
          right: 15,
          bottom: 35,
          containLabel: true,
        },
        dataZoom: [
          {
            type: "inside",
            start: this.dateType === "day" ? 70 : 0,
            end: 100,
          },
          {
            type: "slider",
            start: this.dateType === "day" ? 70 : 0,
            end: 100,
            height: 6,
            bottom: 5,
            borderColor: "transparent",
            backgroundColor: "#f0f0f0",
            handleSize: 12,
            handleStyle: {
              color: "#fff",
              borderColor: "#d1d1d1",
              borderWidth: 1,
              shadowBlur: 1,
              shadowColor: "rgba(0, 0, 0, 0.1)",
              shadowOffsetX: 0,
              shadowOffsetY: 1,
            },
            moveHandleSize: 3,
            showDetail: false,
            showDataShadow: false,
            brushSelect: false,
            fillerColor: "rgba(24, 144, 255, 0.15)",
            textStyle: {
              fontSize: 0,
            },
          },
        ],
        xAxis: {
          type: "category",
          data: xAxisData,
          boundaryGap: false,
          axisTick: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: "#e8e8e8",
            },
          },
          axisLabel: {
            color: "#666",
            fontSize: 11,
          },
        },
        yAxis: {
          type: "value",
          splitLine: {
            lineStyle: {
              color: "#f0f0f0",
              type: "dashed",
            },
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: "#666",
            fontSize: 11,
            formatter: (value) => {
              if (value >= 10000) {
                return value / 10000 + "w";
              }
              if (value >= 1000) {
                return value / 1000 + "k";
              }
              return value;
            },
          },
        },
        series: [
          {
            name: "尖电量",
            type: "line",
            data: this.chartData.map((item) => item.useElecPeak),
            smooth: true,
            symbol: "none", // 去掉圆点
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(255, 107, 107, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(255, 107, 107, 0.05)",
                  },
                ],
              },
            },
          },
          {
            name: "峰电量",
            type: "line",
            data: this.chartData.map((item) => item.useElecTop),
            smooth: true,
            symbol: "none", // 去掉圆点
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(255, 146, 43, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(255, 146, 43, 0.05)",
                  },
                ],
              },
            },
          },
          {
            name: "平电量",
            type: "line",
            data: this.chartData.map((item) => item.useElecFlat),
            smooth: true,
            symbol: "none", // 去掉圆点
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(81, 207, 102, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(81, 207, 102, 0.05)",
                  },
                ],
              },
            },
          },
          {
            name: "谷电量",
            type: "line",
            data: this.chartData.map((item) => item.useElecValley),
            smooth: true,
            symbol: "none", // 去掉圆点
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(51, 154, 240, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(51, 154, 240, 0.05)",
                  },
                ],
              },
            },
          },
        ],
      };

      this.monitorChartInstance.setOption(option);
    },

    handleResize() {
      if (this.mainChartInstance) {
        this.mainChartInstance.resize();
      }
      if (this.monitorChartInstance) {
        this.monitorChartInstance.resize();
      }
    },

    formatNumber(num) {
      if (!num && num !== 0) return "0.00";
      return Number(num).toFixed(2);
    },

    getSettleWayLabel(settleWay) {
      const settleWayMap = {
        1: "预付费",
        2: "后付费",
        3: "月结",
      };
      return settleWayMap[settleWay] || "-";
    },

    getSettleWayClass(settleWay) {
      const classMap = {
        1: "prepay",
        2: "postpay",
        3: "monthly",
      };
      return classMap[settleWay] || "";
    },
  },
};
</script>

<style lang="scss" scoped>
.electricity-dashboard {
  min-height: 100vh;
  padding: 16px;
}

// 顶部操作栏
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  .title-icon {
    width: 28px;
    height: 28px;
    color: #3b82f6;
  }
}

.view-switcher {
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
}

.view-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #374151;
  }

  &.active {
    background: white;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
}

// 筛选器
.filter-container {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
  display: flex;
  align-items: flex-end;
  gap: 24px;
}

.filter-item {
  flex: 1;

  &.date-filter {
    max-width: 320px;
  }

  &.tenant-filter {
    max-width: 360px;
  }
}

.filter-label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-btn,
.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: 16px;
    height: 16px;
  }
}

.search-btn {
  background: #3b82f6;
  color: white;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
}

.reset-btn {
  background: #f3f4f6;
  color: #6b7280;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
}

.detail-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 12px;
  border-left: 1px solid #e5e7eb;
}

.switch-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background-color: #3b82f6;

      &:before {
        transform: translateX(20px);
      }
    }
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 12px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
}

// 统计卡片
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;

  .unit {
    font-size: 14px;
    color: #6b7280;
    font-weight: 400;
  }
}

// 主内容区
.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

// 图表区域 - 新设计
.chart-section {
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 0;
  border-bottom: 1px solid #f3f4f6;
}

.chart-container {
  padding: 24px;
  border-right: 1px solid #f0f0f0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.chart-date-range {
  font-size: 13px;
  color: #999;
}

.chart-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-legends {
  display: flex;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  cursor: pointer;

  &.active {
    color: #333;
    font-weight: 500;
  }
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-text {
  user-select: none;
}

.chart-summary {
  display: flex;
  gap: 40px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-label {
  font-size: 13px;
  color: #999;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.main-chart {
  height: 450px;
  width: 100%;
}

// 负荷资源实时监控
.monitor-container {
  padding: 24px;
  background: #fafafa;
}

.monitor-header {
  margin-bottom: 20px;
}

.monitor-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.monitor-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.monitor-chart {
  height: 280px;
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.monitor-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.monitor-stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.stat-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.spike {
    background: #ff6b6b;
  }

  &.peak {
    background: #ff922b;
  }

  &.flat {
    background: #51cf66;
  }

  &.valley {
    background: #339af0;
  }
}

.stat-name {
  flex: 1;
  font-size: 13px;
  color: #666;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

// 表格区域
.table-section {
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.modern-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 150px repeat(6, 1fr);
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.table-body {
  max-height: 500px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 150px repeat(6, 1fr);
  border-top: 1px solid #f3f4f6;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }
}

.table-footer {
  display: grid;
  grid-template-columns: 150px repeat(6, 1fr);
  background: #f3f4f6;
  font-weight: 600;
  color: #1a1a1a;
  border-top: 2px solid #e5e7eb;
}

.table-cell {
  padding: 16px;
  display: flex;
  align-items: center;

  &.numeric {
    justify-content: flex-end;
  }

  &.amount {
    color: #dc2626;
    font-weight: 600;
  }
}

// 设备明细表格
.device-detail-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.detail-header {
  display: grid;
  grid-template-columns: 450px 400px 1fr;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.header-group {
  padding: 12px 16px;
  text-align: center;

  &.date-group {
    border-right: 1px solid #e5e7eb;
  }

  &.device-group {
    border-right: 1px solid #e5e7eb;
  }
}

.detail-subheader {
  display: grid;
  grid-template-columns: 150px 150px 150px 200px 100px 100px repeat(5, 1fr);
  background: #f3f4f6;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.detail-body {
  max-height: 500px;
  overflow-y: auto;
}

.detail-row {
  display: grid;
  grid-template-columns: 150px 150px 150px 200px 100px 100px repeat(5, 1fr);
  border-top: 1px solid #f3f4f6;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }
}

.cell {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  font-size: 14px;

  &.numeric {
    justify-content: flex-end;
  }

  &.amount {
    color: #dc2626;
    font-weight: 600;
  }

  &.device-name {
    color: #374151;
    font-weight: 500;
  }
}

.settle-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.prepay {
    background: #d1fae5;
    color: #065f46;
  }

  &.postpay {
    background: #fed7aa;
    color: #92400e;
  }

  &.monthly {
    background: #dbeafe;
    color: #1e40af;
  }
}

// 空状态
.empty-state {
  padding: 80px 0;
  text-align: center;

  svg {
    width: 64px;
    height: 64px;
    color: #e5e7eb;
    margin-bottom: 16px;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }
}

// Element UI 样式覆盖
::v-deep .custom-date-picker {
  width: 100%;

  .el-input__inner {
    height: 40px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;

    &:hover {
      border-color: #d1d5db;
    }

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

::v-deep .custom-select {
  width: 100%;

  .el-input__inner {
    height: 40px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;

    &:hover {
      border-color: #d1d5db;
    }

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  .el-tag {
    background: #eff6ff;
    color: #3b82f6;
    border: none;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .chart-section {
    grid-template-columns: 1fr;
  }

  .chart-container {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
}

@media (max-width: 1280px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .electricity-dashboard {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
  }

  .filter-container {
    flex-direction: column;
    gap: 16px;
  }

  .filter-item {
    max-width: 100% !important;
  }

  .filter-actions {
    width: 100%;
    justify-content: space-between;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row,
  .table-footer {
    grid-template-columns: repeat(7, minmax(100px, 1fr));
    overflow-x: auto;
  }

  .chart-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .chart-summary {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
