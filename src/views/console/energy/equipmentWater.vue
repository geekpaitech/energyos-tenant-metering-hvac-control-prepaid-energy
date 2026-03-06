<template>
  <div class="equipment-water-dashboard">
    <!-- 筛选器 -->
    <div class="filter-container">
      <!-- 统计时间 -->
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

      <!-- 水表选择 -->
      <div class="filter-item water-filter">
        <label class="filter-label">选择水表</label>
        <el-select
          ref="waterSelect"
          v-model="queryParams.waterId"
          filterable
          placeholder="请选择水表"
          class="custom-select"
          :loading="waterLoading"
          clearable
          @change="handleWaterChange"
        >
          <el-option
            v-for="water in waterList"
            :key="water.waterId"
            :label="`${water.waterName} (${water.serial})`"
            :value="water.waterId"
          >
            <span style="float: left">{{ water.waterName }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">{{
              water.serial
            }}</span>
          </el-option>
        </el-select>
      </div>

      <div class="filter-actions">
        <button
          class="export-btn"
          @click="handleExport"
          :disabled="exportLoading || tableData.length === 0"
        >
          <svg
            v-if="!exportLoading"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
            />
          </svg>
          <span v-if="exportLoading">导出中...</span>
          <span v-else>导出报表</span>
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div
      class="main-content"
      v-loading="loading"
      :element-loading-text="loadingText"
    >
      <!-- 数据表格区域 -->
      <div class="table-section">
        <div class="section-header">
          <h2 class="section-title">水表用水</h2>
          <div class="section-tip">
            <i class="el-icon-info"></i>
            <span>请选择水表查看详细数据</span>
          </div>
        </div>

        <!-- 水表用水表格 -->
        <div class="water-table-wrapper" v-if="tableData.length > 0">
          <el-table
            ref="dataTable"
            :data="tableData"
            border
            :max-height="600"
            class="water-report-table"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
              textAlign: 'center',
            }"
            :cell-style="{ textAlign: 'center' }"
          >
            <!-- 基础信息列 -->
            <el-table-column
              label="水表ID"
              width="100"
              prop="waterId"
              fixed
              show-overflow-tooltip
            />
            <el-table-column
              label="水表名称"
              min-width="160"
              prop="waterName"
              fixed
              show-overflow-tooltip
            />
            <el-table-column
              label="设备序列号"
              width="140"
              prop="serial"
              show-overflow-tooltip
            />
            <el-table-column label="绑定类型" width="120">
              <template slot-scope="scope">
                {{ getBindTypeLabel(scope.row.bindType) }}
              </template>
            </el-table-column>
            <el-table-column
              label="绑定信息"
              min-width="200"
              prop="bindName"
              show-overflow-tooltip
            />
            <el-table-column
              label="用水日期"
              width="120"
              prop="occurDate"
            />
            <!-- <el-table-column label="结算方式" width="120">
              <template slot-scope="scope">
                {{ getSettleWayLabel(scope.row.settleWay) }}
              </template>
            </el-table-column> -->

            <!-- 用水统计列 -->
            <el-table-column label="用水费(元)" width="120" align="right">
              <template slot-scope="scope">
                <span style="color: #f56c6c">
                  {{ formatNumber(scope.row.balance) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="用水量(吨)" width="120" align="right">
              <template slot-scope="scope">
                <span style="color: #f56c6c">
                  {{ formatNumber(scope.row.consumption) }}
                </span>
              </template>
            </el-table-column>

            <!-- 起始读数列组 -->
            <el-table-column label="起始读数" align="center">
              <el-table-column label="时间" width="160">
                <template slot-scope="scope">
                  {{ scope.row.startTime || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="读数" width="100" align="right">
                <template slot-scope="scope">
                  {{ formatNumber(scope.row.startRead) }}
                </template>
              </el-table-column>
            </el-table-column>

            <!-- 截止读数列组 -->
            <el-table-column label="截止读数" align="center">
              <el-table-column label="时间" width="160">
                <template slot-scope="scope">
                  {{ scope.row.endTime || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="读数" width="100" align="right">
                <template slot-scope="scope">
                  {{ formatNumber(scope.row.endRead) }}
                </template>
              </el-table-column>
            </el-table-column>
          </el-table>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="!loading && tableData.length === 0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3"
            />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <p>暂无数据</p>
          <span class="empty-tip">请选择水表后查看数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { queryWaterUseStatis, waterPageWater } from '@/api/water';
import moment from 'moment';
import * as XLSX from 'xlsx';

export default {
  name: 'EquipmentWater',
  data() {
    return {
      queryParams: {
        waterId: '',
        dateRange: [],
      },
      waterList: [],
      tableData: [],
      waterLoading: false,
      loading: false,
      loadingText: '数据加载中...',
      exportLoading: false,
      bindTypeMap: {
        1: '专用表',
        2: '公摊表',
        3: '公式表',
      },
      settleWayMap: {
        1: '系统结算',
        2: '手动结算',
      },
      pickerOptions: {
        shortcuts: [
          {
            text: '最近7天',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 6);
              picker.$emit('pick', [start, end]);
            },
          },
          {
            text: '最近15天',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 14);
              picker.$emit('pick', [start, end]);
            },
          },
          {
            text: '最近30天',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29);
              picker.$emit('pick', [start, end]);
            },
          },
          {
            text: '本月',
            onClick(picker) {
              const start = new Date();
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              picker.$emit('pick', [start, end]);
            },
          },
          {
            text: '上月',
            onClick(picker) {
              const start = new Date();
              start.setMonth(start.getMonth() - 1);
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setDate(0);
              end.setHours(23, 59, 59, 999);
              picker.$emit('pick', [start, end]);
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
    ...mapGetters('manager', ['currentManagerId']),
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
    // ==================== 初始化相关 ====================
    async initializeData() {
      // 从路由获取参数
      const routeWaterId = this.$route.query.waterId;
      const routeStartDate = this.$route.query.startDate;
      const routeEndDate = this.$route.query.endDate;

      // 如果有日期参数,覆盖默认值
      if (routeStartDate && routeEndDate) {
        this.queryParams.dateRange = [routeStartDate, routeEndDate];
      }

      await this.getWaterList();

      // 如果有水表参数,设置水表
      if (routeWaterId) {
        const targetWaterId = Number(routeWaterId) || routeWaterId;
        const water = this.waterList.find((w) => w.waterId == targetWaterId);
        if (water) {
          this.queryParams.waterId = water.waterId;
        }
      }

      // 只有当参数完整时才自动查询
      if (routeWaterId && routeStartDate && routeEndDate) {
        await this.fetchData();
      } else if (routeWaterId) {
        this.queryParams.waterId = routeWaterId;
      }
    },

    async getWaterList() {
      this.waterLoading = true;
      try {
        const params = {
          bindType: '',
          waterName: '',
          serial: '',
          managerId: this.currentManagerId,
          page: {
            size: 1000,
            current: 1,
          },
        };

        const { data } = await waterPageWater(params);
        
        if (data && data.dataList) {
          // 提取水表列表,使用id作为waterId
          this.waterList = data.dataList.map((item) => ({
            waterId: item.id,
            waterName: item.waterName,
            serial: item.serial,
          }));
        } else {
          this.waterList = [];
        }
      } catch (error) {
        this.$message.error('获取水表列表失败');
        console.error('获取水表列表失败:', error);
      } finally {
        this.waterLoading = false;
      }
    },

    async fetchData() {
      // 校验必填项
      if (
        !this.queryParams.dateRange ||
        this.queryParams.dateRange.length !== 2
      ) {
        this.$message.warning('请选择统计时间');
        return;
      }

      // 必须选择水表
      if (!this.queryParams.waterId) {
        this.$message.warning('请选择水表');
        return;
      }

      this.loading = true;
      try {
        const params = {
          managerId: this.currentManagerId,
          waterId: this.queryParams.waterId,
          startDate: this.queryParams.dateRange[0],
          endDate: this.queryParams.dateRange[1],
        };

        const { data } = await queryWaterUseStatis(params);
        this.tableData = data || [];

        if (this.tableData.length === 0) {
          this.$message.info('未查询到数据');
        }
      } catch (error) {
        this.$message.error('获取数据失败');
        console.error('获取数据失败:', error);
      } finally {
        this.loading = false;
      }
    },

    // ==================== 筛选器事件处理 ====================
    handleDateRangeChange(val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        const [start, end] = val;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffDays = Math.floor(
          (endDate - startDate) / (24 * 3600 * 1000)
        );

        // 限制最多选择31天
        if (diffDays > 30) {
          this.$message.warning('日期最多只能选择31天');
          const newEndDate = new Date(
            startDate.getTime() + 30 * 24 * 3600 * 1000
          );
          this.queryParams.dateRange = [
            start,
            moment(newEndDate).format('YYYY-MM-DD'),
          ];
          return;
        }

        // 日期变更时，如果已经选择了水表，则重新查询
        if (this.queryParams.waterId) {
          this.fetchData();
        }
      }
    },

    handleWaterChange() {
      // 水表变更时直接查询
      if (this.queryParams.waterId) {
        this.fetchData();
      } else {
        // 清空水表时清空数据
        this.tableData = [];
      }
    },

    // ==================== 导出功能 ====================
    handleExport() {
      if (!this.tableData || this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出');
        return;
      }

      this.exportLoading = true;

      setTimeout(() => {
        try {
          this.exportToExcel();
          this.$message.success('导出成功！');
        } catch (error) {
          console.error('导出失败:', error);
          this.$message.error(`导出失败: ${error.message || '请重试'}`);
        } finally {
          this.exportLoading = false;
        }
      }, 100);
    },

    exportToExcel() {
      const water = this.waterList.find(
        (w) => w.waterId === this.queryParams.waterId
      );
      const waterName = water
        ? `${water.waterName} (${water.serial})`
        : this.queryParams.waterId;

      const filterRow = [
        `统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}  |  水表: ${waterName}`,
      ];

      // 第一行表头
      const header1 = [
        '水表ID',
        '水表名称',
        '设备序列号',
        '绑定类型',
        '绑定信息',
        '用水日期',
        '结算方式',
        '用水费(元)',
        '用水量(吨)',
        '起始读数',
        '',
        '截止读数',
        '',
      ];

      // 第二行表头
      const header2 = [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '时间',
        '读数',
        '时间',
        '读数',
      ];

      // 数据行
      const dataRows = this.tableData.map((row) => {
        return [
          row.waterId || '',
          row.waterName || '',
          row.serial || '',
          this.getBindTypeLabel(row.bindType),
          row.bindName || '',
          row.occurDate || '',
          this.getSettleWayLabel(row.settleWay),
          this.formatExportNumber(row.balance),
          this.formatExportNumber(row.consumption),
          row.startTime || '',
          this.formatExportNumber(row.startRead),
          row.endTime || '',
          this.formatExportNumber(row.endRead),
        ];
      });

      const wsData = [filterRow, [], header1, header2, ...dataRows];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // 设置列宽
      ws['!cols'] = [
        { wch: 10 },
        { wch: 18 },
        { wch: 14 },
        { wch: 12 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
        { wch: 10 },
        { wch: 18 },
        { wch: 10 },
      ];

      // 合并单元格
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // 筛选条件行
        { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } }, // 水表ID
        { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } }, // 水表名称
        { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } }, // 设备序列号
        { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } }, // 绑定类型
        { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } }, // 绑定信息
        { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } }, // 用水日期
        { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } }, // 结算方式
        { s: { r: 2, c: 7 }, e: { r: 3, c: 7 } }, // 用水费
        { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } }, // 用水量
        { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } }, // 起始读数
        { s: { r: 2, c: 11 }, e: { r: 2, c: 12 } }, // 截止读数
      ];

      ws['!merges'] = merges;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '水表用水报表');

      const fileName = this.generateFileName('水表用水报表');
      XLSX.writeFile(wb, fileName);
    },

    generateFileName(prefix) {
      const now = new Date();
      const timeStr =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

      return `${prefix}_${timeStr}.xlsx`;
    },

    // ==================== 格式化方法 ====================
    formatExportNumber(num) {
      if (num === undefined || num === null || num === '' || num === '-') {
        return 0;
      }
      const numValue = typeof num === 'string' ? parseFloat(num) : num;
      if (isNaN(numValue)) {
        return 0;
      }
      return numValue;
    },

    formatNumber(num) {
      if (num === undefined || num === null || num === '') {
        return '0.00';
      }
      return Number(num).toFixed(2);
    },

    getBindTypeLabel(bindType) {
      if (bindType === undefined || bindType === null) return '-';
      return this.bindTypeMap[bindType] || '-';
    },

    getSettleWayLabel(settleWay) {
      if (settleWay === undefined || settleWay === null) return '-';
      return this.settleWayMap[settleWay] || '-';
    },
  },
};
</script>

<style lang="scss" scoped>
.equipment-water-dashboard {
  min-height: 100vh;
  padding: 16px;
  background: #f5f7fa;
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
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 200px;

  &.date-filter {
    max-width: 320px;
  }

  &.water-filter {
    max-width: 360px;
  }
}

.filter-label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;

  .required-mark {
    color: #ef4444;
    margin-left: 2px;
  }
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.export-btn {
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
  background: #10b981;
  color: white;

  svg {
    width: 16px;
    height: 16px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
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

.section-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;

  i {
    font-size: 14px;
  }
}

// 水表表格样式
.water-table-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;

  &::-webkit-scrollbar {
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 5px;
    transition: background 0.2s;

    &:hover {
      background: #999;
    }
  }
}

::v-deep .water-report-table {
  table-layout: auto;

  .el-table__header-wrapper {
    .el-table__header {
      th {
        background: #f5f7fa !important;
        font-weight: 600;
        font-size: 13px;
        padding: 12px 0;

        &.is-group {
          background: #e8f4fd !important;
          color: #3b82f6;
          font-weight: 700;
        }
      }
    }
  }

  .el-table__fixed,
  .el-table__fixed-right {
    &::before {
      background-color: transparent;
    }

    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .el-table__body {
    td {
      font-size: 13px;
      padding: 10px 0;

      &.is-right {
        .cell {
          text-align: right;
          padding-right: 12px;
        }
      }
    }
  }

  &.el-table--border {
    border-color: #e5e7eb;

    th,
    td {
      border-color: #e5e7eb;
    }
  }

  .el-table__body tr:hover > td {
    background-color: #f5f7fa !important;
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
    margin: 0 0 8px 0;
  }

  .empty-tip {
    font-size: 12px;
    color: #c1c7d0;
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
}

// ========== 响应式设计 ==========
@media (max-width: 1400px) {
  .filter-container {
    flex-direction: column;
    align-items: stretch;

    .filter-item {
      max-width: 100% !important;
    }

    .filter-actions {
      width: 100%;
      justify-content: flex-start;
      margin-left: 0;
    }
  }
}

@media (max-width: 768px) {
  .equipment-water-dashboard {
    padding: 12px;
  }

  .filter-container {
    padding: 16px;
    gap: 16px;
  }

  .table-section {
    padding: 16px;
  }
}
</style>

<style lang="scss">
// ========== 全局样式:自定义日期选择器 ==========
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