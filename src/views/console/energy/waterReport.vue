<template>
  <div class="water-dashboard">
    <!-- 顶部操作栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">用水报表</h1>
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
          type="daterange"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          查询
        </button>
        <button class="reset-btn" @click="handleReset">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M1 4v6h6M23 20v-6h-6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            />
          </svg>
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
          <div class="stat-label">总水费</div>
          <div class="stat-value">¥{{ formatNumber(totalStats.amount) }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">总用水量</div>
          <div class="stat-value">
            {{ formatNumber(totalStats.water) }} <span class="unit">吨</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">日均水费</div>
          <div class="stat-value">¥{{ formatNumber(avgDailyAmount) }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">日均用水量</div>
          <div class="stat-value">
            {{ formatNumber(avgDailyWater) }} <span class="unit">吨</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div
      class="main-content"
      v-loading="loading"
      :element-loading-text="loadingText"
    >
      <!-- 统计表格 -->
      <div class="table-section" v-if="!switchDeviceDetail">
        <div class="section-header">
          <h2 class="section-title">详细数据</h2>
        </div>

        <div class="modern-table" v-if="tableData.length > 0">
          <div class="table-header">
            <div class="table-cell">日期</div>
            <div class="table-cell numeric">水费(元)</div>
            <div class="table-cell numeric">用水量(吨)</div>
            <div class="table-cell numeric">单价(元/吨)</div>
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
                {{ formatNumber(row.useWater) }}
              </div>
              <div class="table-cell numeric">
                {{ calculateUnitPrice(row) }}
              </div>
            </div>
          </div>

          <div class="table-footer">
            <div class="table-cell">合计</div>
            <div class="table-cell numeric amount">
              ¥{{ formatNumber(totalStats.amount) }}
            </div>
            <div class="table-cell numeric">
              {{ formatNumber(totalStats.water) }}
            </div>
            <div class="table-cell numeric">{{ avgUnitPrice }}</div>
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
          <h2 class="section-title">设备用水明细</h2>
        </div>

        <div class="device-detail-table" v-if="deviceDetailData.length > 0">
          <div class="detail-header">
            <div class="header-group date-group">日期汇总</div>
            <div class="header-group device-group">设备信息</div>
            <div class="header-group water-group">用水详情</div>
          </div>

          <div class="detail-subheader">
            <div class="cell">日期</div>
            <div class="cell numeric">水费</div>
            <div class="cell numeric">总用水量</div>
            <div class="cell">设备名称</div>
            <div class="cell">结算方式</div>
            <div class="cell numeric">费用</div>
            <div class="cell numeric">用水量</div>
            <div class="cell numeric">单价</div>
          </div>

          <div class="detail-body">
            <template v-for="(row, index) in deviceDetailData">
              <div :key="index" class="detail-row">
                <div class="cell" v-if="row.col > 0">{{ row.occurDate }}</div>
                <div class="cell numeric amount" v-if="row.col > 0">
                  ¥{{ formatNumber(row.useAmount) }}
                </div>
                <div class="cell numeric" v-if="row.col > 0">
                  {{ formatNumber(row.useWater) }}
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
                  {{ formatNumber(row.deviceUseDtoList.useWater) || "-" }}
                </div>
                <div class="cell numeric">
                  {{ calculateDeviceUnitPrice(row.deviceUseDtoList) }}
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
  queryTenantWaterUseStatis,
} from "@/api/useReport";
import moment from "moment";

export default {
  name: "WaterReport",
  data() {
    return {
      queryParams: {
        dateRange: [],
        tenantIds: [],
      },
      tenantList: [],
      tenantLoading: false,
      loading: false,
      loadingText: "数据加载中...",
      tableData: [],
      deviceDetailData: [],
      switchDeviceDetail: false,
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
          return time.getTime() > Date.now();
        },
      },
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    totalStats() {
      const stats = {
        amount: 0,
        water: 0,
      };

      this.tableData.forEach((item) => {
        stats.amount += Number(item.useAmount) || 0;
        stats.water += Number(item.useWater) || 0;
      });

      return stats;
    },
    avgDailyAmount() {
      if (this.tableData.length === 0) return 0;
      return (this.totalStats.amount / this.tableData.length).toFixed(2);
    },
    avgDailyWater() {
      if (this.tableData.length === 0) return 0;
      return (this.totalStats.water / this.tableData.length).toFixed(2);
    },
    avgUnitPrice() {
      if (this.totalStats.water === 0) return "-";
      return (this.totalStats.amount / this.totalStats.water).toFixed(2);
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
  methods: {
    toggleSelectAll() {
      if (this.tenantLoading || this.tenantList.length === 0) return;

      if (this.isAllSelected) {
        this.queryParams.tenantIds = [];
      } else {
        this.queryParams.tenantIds = this.tenantList.map(
          (item) => item.tenantId
        );
      }
    },
    async initializeData() {
      this.setDefaultDateRange();
      await this.getTenantList();
      if (this.tenantList.length > 0) {
        this.queryParams.tenantIds = this.tenantList.map(
          (item) => item.tenantId
        );
      }
      this.handleSearch();
    },

    setDefaultDateRange() {
      this.queryParams.dateRange = [
        moment().subtract(30, "days").format("YYYY-MM-DD"),
        moment().format("YYYY-MM-DD"),
      ];
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
      const startDate = this.queryParams.dateRange[0];
      const endDate = this.queryParams.dateRange[1];

      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: 0,
        tenantIdList: this.queryParams.tenantIds,
      };

      const { data } = await queryTenantWaterUseStatis(params);

      this.tableData = data || [];
    },

    async getDeviceDetailData() {
      const startDate = this.queryParams.dateRange[0];
      const endDate = this.queryParams.dateRange[1];

      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: 0,
        tenantIdList: this.queryParams.tenantIds,
      };

      const { data } = await queryTenantWaterUseStatis(params);

      const detailData = [];
      if (data && data.length > 0) {
        data.forEach((item) => {
          if (item.deviceUseDtoList && item.deviceUseDtoList.length > 0) {
            item.deviceUseDtoList.forEach((device, index) => {
              detailData.push({
                occurDate: item.occurDate,
                useAmount: item.useAmount,
                useWater: item.useWater,
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

    handleDateRangeChange(val) {
      if (val && val.length === 2) {
        const [start, end] = val;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffDays = Math.floor((endDate - startDate) / (24 * 3600 * 1000));

        if (diffDays > 90) {
          this.$message.warning("最多只能选择3个月的数据");
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

    formatNumber(num) {
      if (!num && num !== 0) return "0.00";
      return Number(num).toFixed(2);
    },

    calculateUnitPrice(row) {
      if (!row.useWater || row.useWater === 0) return "-";
      return (row.useAmount / row.useWater).toFixed(2);
    },

    calculateDeviceUnitPrice(device) {
      if (!device.useWater || device.useWater === 0) return "-";
      return (device.useAmount / device.useWater).toFixed(2);
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
.water-dashboard {
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
}

.dashboard-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
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
  grid-template-columns: 150px repeat(3, 1fr);
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
  grid-template-columns: 150px repeat(3, 1fr);
  border-top: 1px solid #f3f4f6;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }
}

.table-footer {
  display: grid;
  grid-template-columns: 150px repeat(3, 1fr);
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
  grid-template-columns: 150px 150px 150px 200px 100px 100px repeat(2, 1fr);
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
  grid-template-columns: 150px 150px 150px 200px 100px 100px repeat(2, 1fr);
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
@media (max-width: 1280px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .water-dashboard {
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
    grid-template-columns: repeat(4, minmax(100px, 1fr));
    overflow-x: auto;
  }
}
</style>
