<template>
  <div class="electricity-dashboard">
    <!-- 顶部操作栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">用电报表</h1>

        <!-- Tab切换 -->
        <div class="tab-switcher">
          <button :class="['tab-btn', { active: reportType === 'statistics' }]" @click="switchReportType('statistics')">
            租户用电统计
          </button>
          <button :class="['tab-btn', { active: reportType === 'detail' }]" @click="switchReportType('detail')">
            租户用电明细
          </button>
        </div>

        <!-- 日/月统计切换 - 仅在租户用电明细时显示 -->
        <!-- <div class="view-switcher" v-if="reportType === 'detail'">
          <button :class="['view-btn', { active: dateType === 'day' }]" @click="switchDateType('day')">
            日统计
          </button>
          <button :class="['view-btn', { active: dateType === 'month' }]" @click="switchDateType('month')">
            月统计
          </button>
        </div> -->
      </div>

      <div class="header-right">
        <button class="export-btn" @click="handleExport" :disabled="exportLoading">
          <svg v-if="!exportLoading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span v-if="exportLoading">导出中...</span>
          <span v-else>导出报表</span>
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-container">
      <div class="filter-item date-filter">
        <label class="filter-label">统计时间</label>
        <el-date-picker v-model="queryParams.dateRange" :type="datePickerType" :format="dateFormat"
          :value-format="dateValueFormat" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间"
          :picker-options="currentPickerOptions" class="custom-date-picker" popper-class="elegant-date-picker"
          @change="handleDateRangeChange" />
      </div>

      <!-- 租户选择 -->
      <div class="filter-item tenant-filter">
        <label class="filter-label">选择租户</label>
        <!-- 单选 - 租户用电统计 -->
        <el-select v-show="reportType === 'statistics'" v-model="queryParams.tenantId" filterable placeholder="请选择租户"
          class="custom-select" :loading="tenantLoading" @change="handleTenantChange">
          <el-option v-for="tenant in (switchDeviceDetail ? realTenantList : tenantList)" :key="tenant.tenantId"
            :label="tenant.name" :value="tenant.tenantId" />
        </el-select>
        <!-- 多选 - 租户用电明细 -->
        <el-select v-show="reportType === 'detail'" v-model="queryParams.tenantIds" multiple collapse-tags filterable
          placeholder="请选择租户" class="custom-select" :loading="tenantLoading" @change="handleTenantChange">
          <el-option v-for="tenant in realTenantList" :key="tenant.tenantId" :label="tenant.name"
            :value="tenant.tenantId" />
        </el-select>
      </div>

      <div class="filter-actions">
        <!-- <button class="search-btn" @click="handleSearch">查询</button> -->
        <button class="reset-btn" @click="handleReset">重置</button>

        <!-- 第一个tab的设备明细 -->
        <el-tooltip v-if="reportType === 'statistics'" effect="dark" content="设备明细仅支持单一租户查询,不支持全部租户" placement="top"
          :disabled="!!queryParams.tenantId">
          <div class="detail-switch">
            <span class="switch-text">设备明细</span>
            <label class="toggle-switch">
              <input type="checkbox" v-model="switchDeviceDetail" @change="handleSwitchChange" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </el-tooltip>

        <!-- 第二个tab的全选按钮 -->
        <button v-if="reportType === 'detail'" class="reset-btn" @click="toggleSelectAll"
          :disabled="tenantLoading || tenantList.length === 0">
          {{ isAllSelected ? "取消全选" : "全选" }}
        </button>

        <!-- 第二个tab的设备明细 -->
        <div class="detail-switch" v-if="reportType === 'detail'">
          <span class="switch-text">设备明细</span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="detailSwitchDeviceDetail" @change="handleDetailSwitchChange" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 租户用电统计 - 数据统计卡片（改为两个大模块） -->

    <div class="stats-formula-cards" v-if="reportType === 'statistics' && tableData.length > 0">
      <!-- 左侧：电费公式 -->
      <div class="formula-card electricity-cost">
        <div class="card-content">
          <div class="formula-main">
            <div class="main-indicator">
              <div class="main-value">{{ formatNumber(totalStats.amount) }}</div>
              <div class="main-label">总电费(元)</div>
            </div>
          </div>

          <div class="formula-operator">=</div>

          <div class="formula-sub-group two-items">
            <div class="sub-indicator">
              <div class="sub-value">{{ formatNumber(totalStats.meterBalance) }}</div>
              <div class="sub-label">室内电费(元)</div>
            </div>

            <div class="operator-plus">+</div>

            <div class="sub-indicator">
              <div class="sub-value">{{ formatNumber(totalStats.airBalance) }}</div>
              <div class="sub-label">空调电费(元)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：电量公式 -->
      <div class="formula-card electricity-usage">
        <div class="card-content">
          <div class="formula-main">
            <div class="main-indicator">
              <div class="main-value">{{ formatNumber(totalStats.elec) }}</div>
              <div class="main-label">总电量(度)</div>
            </div>
          </div>

          <div class="formula-operator">=</div>

          <div class="formula-sub-group four-items">
            <div class="sub-indicator">
              <div class="sub-value">{{ formatNumber(totalStats.elecPeak) }}</div>
              <div class="sub-label">尖电量(度)</div>
            </div>

            <div class="operator-plus">+</div>

            <div class="sub-indicator">
              <div class="sub-value">{{ formatNumber(totalStats.elecTop) }}</div>
              <div class="sub-label">峰电量(度)</div>
            </div>

            <div class="operator-plus">+</div>

            <div class="sub-indicator">
              <div class="sub-value">{{ formatNumber(totalStats.elecFlat) }}</div>
              <div class="sub-label">平电量(度)</div>
            </div>

            <div class="operator-plus">+</div>

            <div class="sub-indicator">
              <div class="sub-value">{{ formatNumber(totalStats.elecValley) }}</div>
              <div class="sub-label">谷电量(度)</div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- 主内容区 -->
    <div class="main-content" v-loading="loading" :element-loading-text="loadingText">
      <!-- 租户用电统计 - 图表区域 -->
      <div class="chart-section" v-if="reportType === 'statistics' && chartData.length > 0">
        <div class="chart-container">
          <div class="chart-header">
            <h2 class="chart-title">用电趋势分析</h2>
            <div class="chart-date-range">{{ formatDateRange }}</div>
          </div>
          <div class="chart-info">
            <div class="chart-legends">
              <div class="legend-item active" @click="toggleSeries('总电费')">
                <span class="legend-dot" style="background: #52c41a"></span>
                <span class="legend-text">总电费</span>
              </div>
              <div class="legend-item active" @click="toggleSeries('室内电量')">
                <span class="legend-dot" style="background: #5b9bd5"></span>
                <span class="legend-text">室内电量</span>
              </div>
              <div class="legend-item active" @click="toggleSeries('空调电量')">
                <span class="legend-dot" style="background: #ff9f5a"></span>
                <span class="legend-text">空调电量</span>
              </div>
            </div>
            <div class="chart-summary">
              <div class="summary-item">
                <span class="summary-label">总电费</span>
                <span class="summary-value">¥{{ formatNumber(totalStats.amount) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">室内电量</span>
                <span class="summary-value">{{ formatNumber(totalStats.meterUseElec) }} 度</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">空调电量</span>
                <span class="summary-value">{{ formatNumber(totalStats.airUseElec) }} 度</span>
              </div>
            </div>
          </div>
          <div ref="mainChartContainer" class="main-chart"></div>
        </div>

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

      <!-- 租户用电统计 - 详细数据表格区域 -->
      <div class="table-section" v-if="reportType === 'statistics'">
        <div class="section-header">
          <h2 class="section-title">详细数据</h2>
          <div class="section-actions">
            <button class="fullscreen-btn" @click="openFullscreen"
              v-if="tableData.length > 0 || deviceDetailData.length > 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              <span>全屏查看</span>
            </button>
          </div>
        </div>

        <!-- 普通统计表格 -->
        <el-table v-show="!switchDeviceDetail" v-if="tableData.length > 0" ref="statisticsTable" :data="tableData"
          show-summary :summary-method="getStatisticsSummaries" height="70vh" :highlight-current-row="true">
          <el-table-column min-width="140" label="日期">
            <template slot-scope="scope">
              {{ scope.row.occurDate ? scope.row.occurDate : "总计" }}
            </template>
          </el-table-column>
          <el-table-column min-width="140" label="总电费（元）" prop="useAmount" align="right" />
          <el-table-column min-width="140" label="室内电费（元）" prop="meterBalance" align="right" />
          <el-table-column min-width="140" label="空调电费（元）" prop="airBalance" align="right" />
          <el-table-column min-width="140" label="总电量（度）" prop="useElec" align="right" />
          <el-table-column min-width="140" label="室内电量（度）" prop="meterUseElec" align="right" />
          <el-table-column min-width="140" label="空调电量（度）" prop="airUseElec" align="right" />

          <el-table-column min-width="140" label="尖电量（度）" prop="useElecPeak" align="right" />
          <el-table-column min-width="140" label="峰电量（度）" prop="useElecTop" align="right" />
          <el-table-column min-width="140" label="平电量（度）" prop="useElecFlat" align="right" />
          <el-table-column min-width="140" label="谷电量（度）" prop="useElecValley" align="right" />
        </el-table>

        <!-- 设备明细表格 -->
        <el-table v-show="switchDeviceDetail" v-if="deviceDetailData.length > 0" ref="deviceDetailTable"
          :data="deviceDetailData" :span-method="deviceDetailSpanMethod" :summary-method="getDeviceDetailSummaries"
          show-summary height="70vh" :highlight-current-row="true">
          <el-table-column min-width="140" label="日期">
            <template slot-scope="scope">{{ scope.row.occurDate }}</template>
          </el-table-column>
          <el-table-column min-width="120" label="电费（元）" prop="useAmount" align="right" />
          <el-table-column min-width="120" label="室内电费（元）" prop="meterBalance" align="right" />
          <el-table-column min-width="120" label="空调电费（元）" prop="airBalance" align="right" />
          <el-table-column min-width="120" label="总电量（度）" prop="useElec" align="right" />
          <el-table-column min-width="120" label="室内电量（度）" prop="meterUseElec" align="right" />
          <el-table-column min-width="120" label="空调电量（度）" prop="airUseElec" align="right" />
          <el-table-column min-width="120" label="尖电量（度）" prop="useElecPeak" align="right" />
          <el-table-column min-width="120" label="峰电量（度）" prop="useElecTop" align="right" />
          <el-table-column min-width="120" label="平电量（度）" prop="useElecFlat" align="right" />
          <el-table-column min-width="120" label="谷电量（度）" prop="useElecValley" align="right" />
          <el-table-column label="设备" width="160">
            <template slot-scope="scope">{{
              scope.row.deviceUseDtoList.meterName || "-"
            }}</template>
          </el-table-column>
          <el-table-column label="结算方式" width="120">
            <template slot-scope="scope">{{
              getSettleWayLabel(scope.row.deviceUseDtoList.settleWay)
            }}</template>
          </el-table-column>
          <el-table-column label="费用" width="120" align="right">
            <template slot-scope="scope">{{
              scope.row.deviceUseDtoList.useAmount !== undefined
                ? scope.row.deviceUseDtoList.useAmount
                : "-"
            }}</template>
          </el-table-column>
          <el-table-column label="电量" align="center">
            <el-table-column label="总计" width="100" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElec !== undefined
                  ? scope.row.deviceUseDtoList.useElec
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="尖" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElecPeak !== undefined
                  ? scope.row.deviceUseDtoList.useElecPeak
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="峰" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElecTop !== undefined
                  ? scope.row.deviceUseDtoList.useElecTop
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="平" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElecFlat !== undefined
                  ? scope.row.deviceUseDtoList.useElecFlat
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="谷" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElecValley !== undefined
                  ? scope.row.deviceUseDtoList.useElecValley
                  : "-"
              }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="起始读数" align="center">
            <el-table-column label="时间" width="160">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.occurTime
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="总电量" width="100" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerAll
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="尖" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerPeak
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="峰" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerTop
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="平" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerFlat
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="谷" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerValley
                  : "-"
              }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="截止读数" align="center">
            <el-table-column label="时间" width="160">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.occurTime
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="总电量" width="100" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerAll
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="尖" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerPeak
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="峰" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerTop
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="平" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerFlat
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="谷" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerValley
                  : "-"
              }}</template>
            </el-table-column>
          </el-table-column>
        </el-table>

        <div class="empty-state" v-if="!loading && tableData.length === 0 && !switchDeviceDetail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <p>暂无数据</p>
        </div>
        <div class="empty-state" v-if="!loading && deviceDetailData.length === 0 && switchDeviceDetail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 3v4m8-4v4M3 11h18" />
          </svg>
          <p>暂无设备明细数据</p>
        </div>
      </div>

      <!-- 租户用电明细 - 租户列表表格 -->
      <div class="table-section" v-if="reportType === 'detail' && !detailSwitchDeviceDetail">
        <div class="section-header">
          <h2 class="section-title">租户用电明细</h2>
        </div>
        <el-table v-if="tenantDetailData.length > 0" :data="tenantDetailData" height="calc(100vh - 400px)"
          :highlight-current-row="true" :row-class-name="tableRowClassName">
          <el-table-column label="租户编号" width="120">
            <template slot-scope="scope">{{
              scope.row.tenantId !== -1 ? scope.row.tenantId : "总计"
            }}</template>
          </el-table-column>
          <el-table-column label="租户名称" min-width="200">
            <template slot-scope="scope">{{
              scope.row.tenantName || "-"
            }}</template>
          </el-table-column>
          <!-- <el-table-column label="区域标签" width="180">
            <template slot-scope="scope">
              <div v-if="scope.row.labelNames && scope.row.labelNames.length">
                <div class="label-tags">
                  <span class="label-tag">{{ scope.row.labelNames[0] }}</span>
                </div>
              </div>
              <div v-else>-</div>
            </template>
          </el-table-column> -->
          <el-table-column label="电费(元)" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useAmount)
            }}</template>
          </el-table-column>
          <el-table-column label="电量(度)" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useElec)
            }}</template>
          </el-table-column>
          <el-table-column label="尖电量(度)" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useElecPeak)
            }}</template>
          </el-table-column>
          <el-table-column label="峰电量(度)" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useElecTop)
            }}</template>
          </el-table-column>
          <el-table-column label="平电量(度)" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useElecFlat)
            }}</template>
          </el-table-column>
          <el-table-column label="谷电量(度)" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useElecValley)
            }}</template>
          </el-table-column>
        </el-table>
        <div class="empty-state" v-else-if="!loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <p>暂无数据</p>
        </div>
      </div>

      <!-- 租户用电明细 - 设备明细表格 -->
      <div class="table-section" v-if="reportType === 'detail' && detailSwitchDeviceDetail">
        <div class="section-header">
          <h2 class="section-title">租户设备用电明细</h2>
        </div>
        <el-table v-if="tenantDeviceDetailTableData.length > 0" :data="tenantDeviceDetailTableData"
          :span-method="objectSpanMethod" height="calc(100vh - 400px)" :highlight-current-row="true"
          :row-class-name="tableRowClassName">
          <el-table-column label="租户编号" width="120">
            <template slot-scope="scope">{{
              scope.row.tenantId !== -1 ? scope.row.tenantId : "总计"
            }}</template>
          </el-table-column>
          <el-table-column label="租户名称" min-width="200">
            <template slot-scope="scope">{{
              scope.row.tenantName || "-"
            }}</template>
          </el-table-column>
          <!-- <el-table-column label="区域标签" width="180">
            <template slot-scope="scope">
              <div v-if="scope.row.labelNames && scope.row.labelNames.length">
                <div class="label-tags">
                  <span class="label-tag">{{ scope.row.labelNames[0] }}</span>
                </div>
              </div>
              <div v-else>-</div>
            </template>
          </el-table-column> -->
          <el-table-column label="电表" width="180">
            <template slot-scope="scope">{{
              scope.row.meterName || "-"
            }}</template>
          </el-table-column>
          <el-table-column label="明细" align="center">
            <el-table-column label="电费(元)" width="140" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useAmount)
                  : formatNumber(scope.row.elecAmt)
              }}</template>
            </el-table-column>
            <el-table-column label="电量(度)" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElec)
                  : formatNumber(scope.row.elecUse)
              }}</template>
            </el-table-column>
            <el-table-column label="尖电量" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElecPeak)
                  : formatNumber(scope.row.elecUsePeak)
              }}</template>
            </el-table-column>
            <el-table-column label="峰电量" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElecTop)
                  : formatNumber(scope.row.elecUseTop)
              }}</template>
            </el-table-column>
            <el-table-column label="平电量" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElecFlat)
                  : formatNumber(scope.row.elecUseFlat)
              }}</template>
            </el-table-column>
            <el-table-column label="谷电量" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElecValley)
                  : formatNumber(scope.row.elecUseValley)
              }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="统计" align="center">
            <el-table-column label="电费(元)" width="140" align="right">
              <template slot-scope="scope">{{
                scope.row.meterUseDetail && scope.row.meterUseDetail.length
                  ? formatNumber(
                    scope.row.meterUseDetail[
                    scope.row.meterUseDetail.length - 1
                    ]["elecAmt"]
                  )
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="电量(度)" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.meterUseDetail && scope.row.meterUseDetail.length
                  ? formatNumber(
                    scope.row.meterUseDetail[
                    scope.row.meterUseDetail.length - 1
                    ]["elecUse"]
                  )
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="尖电量" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.meterUseDetail && scope.row.meterUseDetail.length
                  ? formatNumber(
                    scope.row.meterUseDetail[
                    scope.row.meterUseDetail.length - 1
                    ]["elecUsePeak"]
                  )
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="峰电量" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.meterUseDetail && scope.row.meterUseDetail.length
                  ? formatNumber(
                    scope.row.meterUseDetail[
                    scope.row.meterUseDetail.length - 1
                    ]["elecUseTop"]
                  )
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="平电量" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.meterUseDetail && scope.row.meterUseDetail.length
                  ? formatNumber(
                    scope.row.meterUseDetail[
                    scope.row.meterUseDetail.length - 1
                    ]["elecUseFlat"]
                  )
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column label="谷电量" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.meterUseDetail && scope.row.meterUseDetail.length
                  ? formatNumber(
                    scope.row.meterUseDetail[
                    scope.row.meterUseDetail.length - 1
                    ]["elecUseValley"]
                  )
                  : "-"
              }}</template>
            </el-table-column>
          </el-table-column>
        </el-table>
        <div class="empty-state" v-else-if="!loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 3v4m8-4v4M3 11h18" />
          </svg>
          <p>暂无设备明细数据</p>
        </div>
      </div>
    </div>
    <table-focus-mode v-if="reportType === 'statistics' && currentManagerId" :visible="fullscreenVisible"
      :current-manager-id="currentManagerId" :initial-query-params="queryParams" @close="closeFullscreen" />
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
import TableFocusMode from './components/TableFocusMode.vue';
import * as XLSX from 'xlsx';

export default {
  name: "ElectricityReport",
  components: {
    TableFocusMode
  },
  data() {
    return {
      reportType: "statistics",
      dateType: "day",
      queryParams: {
        dateRange: [],
        tenantIds: [],
        tenantId: "",
      },
      tenantList: [],
      tenantLoading: false,
      loading: false,
      loadingText: "数据加载中...",
      exportLoading: false,
      chartData: [],
      tableData: [],
      deviceDetailData: [],
      tenantDetailData: [],
      tenantDeviceDetailTableData: [],
      switchDeviceDetail: false,
      detailSwitchDeviceDetail: false,
      mainChartInstance: null,
      monitorChartInstance: null,
      settleWayMap: {
        0: "普通结算",
        1: "手动扣款",
        2: "系统补单",
        3: "浮动电价",
        4: "分摊结算",
        5: "设备扣款",
      },
      pickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now();
        },
      },
      resizeObserver: null,
      fullscreenVisible: false,
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    datePickerType() {
      if (this.reportType === "statistics") {
        return "daterange";
      }
      return this.dateType === "day" ? "daterange" : "monthrange";
    },
    dateFormat() {
      if (this.reportType === "statistics") {
        return "yyyy-MM-dd";
      }
      return this.dateType === "day" ? "yyyy-MM-dd" : "yyyy-MM";
    },
    dateValueFormat() {
      if (this.reportType === "statistics") {
        return "yyyy-MM-dd";
      }
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
      return `${start} - ${end}`;
    },
    totalStats() {
      const stats = {
        amount: 0,
        elec: 0,
        elecPeak: 0,
        elecTop: 0,
        elecFlat: 0,
        elecValley: 0,
        meterBalance: 0,
        airBalance: 0,
        meterUseElec: 0,
        airUseElec: 0,
      };
      this.tableData.forEach((item) => {
        stats.amount += Number(item.useAmount) || 0;
        stats.elec += Number(item.useElec) || 0;
        stats.elecPeak += Number(item.useElecPeak) || 0;
        stats.elecTop += Number(item.useElecTop) || 0;
        stats.elecFlat += Number(item.useElecFlat) || 0;
        stats.elecValley += Number(item.useElecValley) || 0;
        stats.meterBalance += Number(item.meterBalance) || 0;
        stats.airBalance += Number(item.airBalance) || 0;
        stats.meterUseElec += Number(item.meterUseElec) || 0;
        stats.airUseElec += Number(item.airUseElec) || 0;
      });
      return stats;
    },
    isAllSelected() {
      return (
        this.realTenantList.length > 0 &&
        this.queryParams.tenantIds.length === this.realTenantList.length
      );
    },
    realTenantList() {
      return this.tenantList.filter(item => item.tenantId !== "");
    },
    currentPickerOptions() {
      const shortcuts = [
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
      ];

      // 如果不是日统计模式（即租户明细模式，允许查一年），添加“近一年”选项
      if (this.reportType !== "statistics") {
        shortcuts.push({
          text: "近一年",
          onClick(picker) {
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            const start = new Date();
            start.setFullYear(start.getFullYear() - 1);
            start.setHours(0, 0, 0, 0);
            picker.$emit("pick", [start, end]);
          },
        });
      }

      return {
        shortcuts,
        disabledDate: this.pickerOptions.disabledDate,
      };
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
    this.$nextTick(() => {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.handleResize);
        const mainContent = this.$el.querySelector(".main-content");
        if (mainContent) {
          this.resizeObserver.observe(mainContent);
        }
      }
    });
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
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
      this.queryParams.tenantId = "";
      this.queryParams.tenantIds = this.realTenantList.map(item => item.tenantId);
      this.handleSearch();
    },

    setDefaultDateRange() {
      if (this.reportType === "statistics" || this.dateType === "day") {
        this.queryParams.dateRange = [
          moment().subtract(30, "days").format("YYYY-MM-DD"),
          moment().format("YYYY-MM-DD"),
        ];
      } else {
        this.queryParams.dateRange = [
          moment().subtract(1, "months").format("YYYY-MM"),
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
        this.tenantList = [
          { tenantId: "", name: "全部" },
          ...(data || [])
        ];
      } catch (error) {
        this.$message.error("获取租户列表失败");
        console.error("获取租户列表失败:", error);
      } finally {
        this.tenantLoading = false;
      }
    },

    handleDateRangeChange(val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        if (this.reportType === "statistics" || this.dateType === "day") {
          const [start, end] = val;
          const startDate = new Date(start);
          const endDate = new Date(end);
          const diffDays = Math.floor((endDate - startDate) / (24 * 3600 * 1000));

          // 租户用电统计模式(Tab 1)下限制100天
          // 租户用电明细模式(Tab 2)下限制1年(366天)
          const limitDays = this.reportType === "statistics" ? 100 : 366;
          const limitText = this.reportType === "statistics" ? "100天" : "1年";

          if (diffDays > limitDays) {
            this.$message.warning(`日统计最多只能选择${limitText}的数据`);
            const newEndDate = new Date(startDate.getTime() + limitDays * 24 * 3600 * 1000);
            this.queryParams.dateRange = [
              start,
              moment(newEndDate).format("YYYY-MM-DD"),
            ];
            return;
          }
        }
        this.handleSearch();
      }
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.queryParams.tenantIds = [];
      } else {
        this.queryParams.tenantIds = this.realTenantList.map(item => item.tenantId);
      }
    },

    openFullscreen() {
      this.fullscreenVisible = true;
    },

    closeFullscreen() {
      this.fullscreenVisible = false;
    },

    handleFullscreenSwitchChange(value) {
      this.switchDeviceDetail = value;
      this.handleSwitchChange();
    },

    switchReportType(type) {
      if (this.reportType === type) return;
      this.reportType = type;

      if (type === "statistics") {
        this.dateType = "day";
        this.setDefaultDateRange();
      }

      this.switchDeviceDetail = false;
      this.detailSwitchDeviceDetail = false;

      this.tableData = [];
      this.chartData = [];
      this.deviceDetailData = [];
      this.tenantDetailData = [];
      this.tenantDeviceDetailTableData = [];

      this.handleSearch();
    },

    switchDateType(type) {
      if (this.dateType === type) return;
      this.dateType = type;
      this.setDefaultDateRange();

      this.tenantDetailData = [];
      this.tenantDeviceDetailTableData = [];

      this.handleSearch();
    },

    toggleSeries(seriesName) {
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
      if (this.reportType === "statistics") {
        if (this.switchDeviceDetail && !this.queryParams.tenantId) {
          this.$message.warning("设备明细模式下请选择具体租户");
          return;
        }
      } else {
        if (this.queryParams.tenantIds.length === 0) {
          this.$message.warning("请选择租户");
          return;
        }
      }
      this.loading = true;
      try {
        if (this.reportType === "statistics") {
          await this.getStatisticsData();
          if (this.switchDeviceDetail) {
            await this.getDeviceDetailData();
          }
        } else {
          if (this.detailSwitchDeviceDetail) {
            await this.getTenantDeviceDetailData();
          } else {
            await this.getTenantDetailData();
          }
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
        useType: 1,
        selectType: this.switchDeviceDetail ? 0 : 2,
        tenantIdList: this.queryParams.tenantId ? [this.queryParams.tenantId] : [],
      };
      const { data } = await useReportQueryTenantUseStatis(params);

      // 原始数据(API返回的顺序)
      const originalData = data || [];

      // 图表数据: 保持正序(时间从早到晚,用于图表展示)
      this.chartData = [...originalData].sort((a, b) => {
        return new Date(a.occurDate) - new Date(b.occurDate);
      });

      // 表格数据: 倒序(最新日期在前,用于表格展示)
      this.tableData = [...originalData].sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate);
      });

      this.$nextTick(() => {
        this.initializeMainChart();
        this.initializeMonitorChart();
        this.updateCharts();
      });
    },

    async getDeviceDetailData() {
      const startDate = this.queryParams.dateRange[0];
      const endDate = this.queryParams.dateRange[1];
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: 1,
        selectType: 0,
        tenantIdList: this.queryParams.tenantId ? [this.queryParams.tenantId] : [],
      };
      const { data } = await useReportQueryTenantUseStatis(params);

      // 先对原始数据按日期倒序排序
      const sortedData = (data || []).sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate);
      });

      const detailArray = [];
      if (sortedData && sortedData.length > 0) {
        sortedData.forEach((item) => {
          if (item.deviceUseDtoList && item.deviceUseDtoList.length > 0) {
            const baseObj = {
              occurDate: item.occurDate,
              useAmount: item.useAmount,
              meterBalance: item.meterBalance,
              airBalance: item.airBalance,
              useElec: item.useElec,
              meterUseElec: item.meterUseElec,
              airUseElec: item.airUseElec,
              useElecPeak: item.useElecPeak,
              useElecTop: item.useElecTop,
              useElecFlat: item.useElecFlat,
              useElecValley: item.useElecValley,
            };
            item.deviceUseDtoList.forEach((device, idx) => {
              detailArray.push({
                ...baseObj,
                col: idx === 0 ? item.deviceUseDtoList.length : 0,
                deviceUseDtoList: device,
              });
            });
          } else {
            detailArray.push({
              occurDate: item.occurDate,
              useAmount: item.useAmount,
              meterBalance: item.meterBalance,
              airBalance: item.airBalance,
              useElec: item.useElec,
              meterUseElec: item.meterUseElec,
              airUseElec: item.airUseElec,
              useElecPeak: item.useElecPeak,
              useElecTop: item.useElecTop,
              useElecFlat: item.useElecFlat,
              useElecValley: item.useElecValley,
              col: 1,
              deviceUseDtoList: {},
            });
          }
        });
      }
      this.deviceDetailData = detailArray;
    },

    async getTenantDetailData() {
      let startDate = this.queryParams.dateRange[0];
      let endDate = this.queryParams.dateRange[1];
      if (this.dateType === "month" && startDate.length === 7) {
        startDate = startDate + "-01";
        endDate = endDate + "-01";
      }
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 1,
        useType: this.dateType === "day" ? 1 : 2,
        isMeterDetail: false,
        tenantIdList: this.queryParams.tenantIds,
      };
      const { data } = await queryTenantUse(params);
      this.tenantDetailData = data || [];
    },

    async getTenantDeviceDetailData() {
      let startDate = this.queryParams.dateRange[0];
      let endDate = this.queryParams.dateRange[1];
      if (this.dateType === "month" && startDate.length === 7) {
        startDate = startDate + "-01";
        endDate = endDate + "-01";
      }
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 1,
        useType: this.dateType === "day" ? 1 : 2,
        isMeterDetail: true,
        tenantIdList: this.queryParams.tenantIds,
      };
      const { data } = await queryTenantUse(params);
      const tableDataType = [];
      if (data && data.length > 0) {
        data.forEach((item) => {
          if (item.meterUseDetail && item.meterUseDetail.length) {
            item.meterUseDetail.forEach((meter, idx) => {
              if (meter.name !== "总计") {
                const tip = idx === 0 ? item.meterUseDetail.length - 1 : 0;
                tableDataType.push({
                  ...item,
                  ...meter,
                  meterName: meter.name,
                  tip,
                });
              }
            });
          } else {
            tableDataType.push({
              ...item,
              meterName: "-",
              tip: 1,
            });
          }
        });
      }
      this.tenantDeviceDetailTableData = tableDataType;
    },

    handleTenantChange() {
      this.handleSearch();
    },

    handleReset() {
      this.setDefaultDateRange();
      this.switchDeviceDetail = false;
      this.detailSwitchDeviceDetail = false;
      this.queryParams.tenantId = "";
      this.queryParams.tenantIds = this.realTenantList.map(item => item.tenantId);
      this.handleSearch();
    },

    // ==================== 导出功能 ====================

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

    handleExport() {
      if (this.reportType === 'statistics') {
        if (!this.switchDeviceDetail && (!this.tableData || this.tableData.length === 0)) {
          this.$message.warning('暂无数据可导出');
          return;
        }
        if (this.switchDeviceDetail && (!this.deviceDetailData || this.deviceDetailData.length === 0)) {
          this.$message.warning('暂无设备明细数据可导出');
          return;
        }
      } else {
        if (!this.detailSwitchDeviceDetail && (!this.tenantDetailData || this.tenantDetailData.length === 0)) {
          this.$message.warning('暂无数据可导出');
          return;
        }
        if (this.detailSwitchDeviceDetail && (!this.tenantDeviceDetailTableData || this.tenantDeviceDetailTableData.length === 0)) {
          this.$message.warning('暂无设备明细数据可导出');
          return;
        }
      }

      this.exportLoading = true;

      setTimeout(() => {
        try {
          if (this.reportType === 'statistics') {
            if (this.switchDeviceDetail) {
              this.exportStatisticsDeviceDetail();
            } else {
              this.exportStatisticsNormal();
            }
          } else {
            if (this.detailSwitchDeviceDetail) {
              this.exportDetailDeviceDetail();
            } else {
              this.exportDetailNormal();
            }
          }

          this.$message.success('导出成功！');
        } catch (error) {
          console.error('导出失败:', error);
          this.$message.error(`导出失败: ${error.message || '请重试'}`);
        } finally {
          this.exportLoading = false;
        }
      }, 100);
    },

    exportStatisticsNormal() {
      const tenant = this.tenantList.find(t => t.tenantId === this.queryParams.tenantId);
      const tenantName = tenant ? tenant.name : this.queryParams.tenantId;

      const filterRow = [
        `统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}`,
        `租户: ${tenantName}`,
      ];

      const headers = ['日期', '电费（元）', '室内电费（元）', '空调电费（元）', '总电量（度）', '室内电量（度）', '空调电量（度）', '尖电量（度）', '峰电量（度）', '平电量（度）', '谷电量（度）'];

      const dataRows = this.tableData.map(row => [
        row.occurDate || '',
        this.formatExportNumber(row.useAmount),
        this.formatExportNumber(row.meterBalance),
        this.formatExportNumber(row.airBalance),
        this.formatExportNumber(row.useElec),
        this.formatExportNumber(row.meterUseElec),
        this.formatExportNumber(row.airUseElec),
        this.formatExportNumber(row.useElecPeak),
        this.formatExportNumber(row.useElecTop),
        this.formatExportNumber(row.useElecFlat),
        this.formatExportNumber(row.useElecValley),
      ]);

      const totalRow = [
        '总计',
        this.formatExportNumber(this.totalStats.amount),
        this.formatExportNumber(this.totalStats.meterBalance),
        this.formatExportNumber(this.totalStats.airBalance),
        this.formatExportNumber(this.totalStats.elec),
        this.formatExportNumber(this.totalStats.meterUseElec),
        this.formatExportNumber(this.totalStats.airUseElec),
        this.formatExportNumber(this.totalStats.elecPeak),
        this.formatExportNumber(this.totalStats.elecTop),
        this.formatExportNumber(this.totalStats.elecFlat),
        this.formatExportNumber(this.totalStats.elecValley),
      ];

      const wsData = [
        filterRow,
        [],
        headers,
        ...dataRows,
        totalRow,
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '租户用电统计');

      const fileName = this.generateFileName('租户用电统计');
      XLSX.writeFile(wb, fileName);
    },

    exportStatisticsDeviceDetail() {
      const tenant = this.tenantList.find(t => t.tenantId === this.queryParams.tenantId);
      const tenantName = tenant ? tenant.name : this.queryParams.tenantId;

      const filterRow = [
        `统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}  |  租户: ${tenantName}  |  设备明细`
      ];

      const header1 = [
        '日期', '电费（元）', '室内电费（元）', '空调电费（元）', '总电量（度）', '室内电量（度）', '空调电量（度）', '尖电量（度）', '峰电量（度）', '平电量（度）', '谷电量（度）',
        '设备', '结算方式', '费用',
        '电量', '', '', '', '',
        '起始读数', '', '', '', '', '',
        '截止读数', '', '', '', '', '',
      ];

      const header2 = [
        '', '', '', '', '', '', '', '', '', '', '',
        '', '', '',
        '总计', '尖', '峰', '平', '谷',
        '时间', '总电量', '尖', '峰', '平', '谷',
        '时间', '总电量', '尖', '峰', '平', '谷',
      ];

      if (!this.deviceDetailData || this.deviceDetailData.length === 0) {
        throw new Error('没有可导出的设备明细数据');
      }

      const dateGroups = {};
      this.deviceDetailData.forEach(row => {
        const date = row.occurDate;
        if (!dateGroups[date]) {
          dateGroups[date] = {
            summary: {
              occurDate: date,
              useAmount: row.useAmount,
              meterBalance: row.meterBalance,
              airBalance: row.airBalance,
              useElec: row.useElec,
              meterUseElec: row.meterUseElec,
              airUseElec: row.airUseElec,
              useElecPeak: row.useElecPeak,
              useElecTop: row.useElecTop,
              useElecFlat: row.useElecFlat,
              useElecValley: row.useElecValley,
            },
            devices: []
          };
        }
        if (row.deviceUseDtoList && Object.keys(row.deviceUseDtoList).length > 0) {
          dateGroups[date].devices.push(row.deviceUseDtoList);
        }
      });

      const dataRows = [];
      Object.keys(dateGroups).sort().forEach(date => {
        const group = dateGroups[date];
        const deviceCount = group.devices.length;

        if (deviceCount === 0) {
          dataRows.push([
            group.summary.occurDate,
            this.formatExportNumber(group.summary.useAmount),
            this.formatExportNumber(group.summary.meterBalance),
            this.formatExportNumber(group.summary.airBalance),
            this.formatExportNumber(group.summary.useElec),
            this.formatExportNumber(group.summary.meterUseElec),
            this.formatExportNumber(group.summary.airUseElec),
            this.formatExportNumber(group.summary.useElecPeak),
            this.formatExportNumber(group.summary.useElecTop),
            this.formatExportNumber(group.summary.useElecFlat),
            this.formatExportNumber(group.summary.useElecValley),
            '', '', '', '', '', '', '', '',
            '', '', '', '', '', '',
            '', '', '', '', '', '',
          ]);
        } else {
          group.devices.forEach((device, idx) => {
            const startDto = device.startUseDto || {};
            const stopDto = device.stopUseDto || {};

            if (idx === 0) {
              dataRows.push([
                group.summary.occurDate,
                this.formatExportNumber(group.summary.useAmount),
                this.formatExportNumber(group.summary.meterBalance),
                this.formatExportNumber(group.summary.airBalance),
                this.formatExportNumber(group.summary.useElec),
                this.formatExportNumber(group.summary.meterUseElec),
                this.formatExportNumber(group.summary.airUseElec),
                this.formatExportNumber(group.summary.useElecPeak),
                this.formatExportNumber(group.summary.useElecTop),
                this.formatExportNumber(group.summary.useElecFlat),
                this.formatExportNumber(group.summary.useElecValley),
                device.meterName || '',
                this.getSettleWayLabel(device.settleWay) || '',
                this.formatExportNumber(device.useAmount),
                this.formatExportNumber(device.useElec),
                this.formatExportNumber(device.useElecPeak),
                this.formatExportNumber(device.useElecTop),
                this.formatExportNumber(device.useElecFlat),
                this.formatExportNumber(device.useElecValley),
                startDto.occurTime || '',
                this.formatExportNumber(startDto.powerAll),
                this.formatExportNumber(startDto.powerPeak),
                this.formatExportNumber(startDto.powerTop),
                this.formatExportNumber(startDto.powerFlat),
                this.formatExportNumber(startDto.powerValley),
                stopDto.occurTime || '',
                this.formatExportNumber(stopDto.powerAll),
                this.formatExportNumber(stopDto.powerPeak),
                this.formatExportNumber(stopDto.powerTop),
                this.formatExportNumber(stopDto.powerFlat),
                this.formatExportNumber(stopDto.powerValley),
              ]);
            } else {
              dataRows.push([
                '', '', '', '', '', '', '', '', '', '', '',
                device.meterName || '',
                this.getSettleWayLabel(device.settleWay) || '',
                this.formatExportNumber(device.useAmount),
                this.formatExportNumber(device.useElec),
                this.formatExportNumber(device.useElecPeak),
                this.formatExportNumber(device.useElecTop),
                this.formatExportNumber(device.useElecFlat),
                this.formatExportNumber(device.useElecValley),
                startDto.occurTime || '',
                this.formatExportNumber(startDto.powerAll),
                this.formatExportNumber(startDto.powerPeak),
                this.formatExportNumber(startDto.powerTop),
                this.formatExportNumber(startDto.powerFlat),
                this.formatExportNumber(startDto.powerValley),
                stopDto.occurTime || '',
                this.formatExportNumber(stopDto.powerAll),
                this.formatExportNumber(stopDto.powerPeak),
                this.formatExportNumber(stopDto.powerTop),
                this.formatExportNumber(stopDto.powerFlat),
                this.formatExportNumber(stopDto.powerValley),
              ]);
            }
          });
        }
      });

      const totalRow = [
        '总计',
        this.formatExportNumber(this.totalStats.amount),
        this.formatExportNumber(this.totalStats.meterBalance),
        this.formatExportNumber(this.totalStats.airBalance),
        this.formatExportNumber(this.totalStats.elec),
        this.formatExportNumber(this.totalStats.meterUseElec),
        this.formatExportNumber(this.totalStats.airUseElec),
        this.formatExportNumber(this.totalStats.elecPeak),
        this.formatExportNumber(this.totalStats.elecTop),
        this.formatExportNumber(this.totalStats.elecFlat),
        this.formatExportNumber(this.totalStats.elecValley),
      ];
      while (totalRow.length < 31) {
        totalRow.push('');
      }

      const wsData = [
        filterRow,
        [],
        header1,
        header2,
        ...dataRows,
        totalRow,
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 18 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      ];

      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 30 } },
        { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
        { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
        { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
        { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
        { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } },
        { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } },
        { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } },
        { s: { r: 2, c: 7 }, e: { r: 3, c: 7 } },
        { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } },
        { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } },
        { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } },
        { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } },
        { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } },
        { s: { r: 2, c: 13 }, e: { r: 3, c: 13 } },
        { s: { r: 2, c: 14 }, e: { r: 2, c: 18 } },
        { s: { r: 2, c: 19 }, e: { r: 2, c: 24 } },
        { s: { r: 2, c: 25 }, e: { r: 2, c: 30 } },
      ];

      let currentRow = 4;
      Object.keys(dateGroups).sort().forEach(date => {
        const group = dateGroups[date];
        const deviceCount = group.devices.length;

        if (deviceCount > 1) {
          for (let col = 0; col <= 10; col++) {
            merges.push({
              s: { r: currentRow, c: col },
              e: { r: currentRow + deviceCount - 1, c: col }
            });
          }
        }

        currentRow += deviceCount > 0 ? deviceCount : 1;
      });

      ws['!merges'] = merges;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '租户用电统计-设备明细');

      const fileName = this.generateFileName('租户用电统计-设备明细');
      XLSX.writeFile(wb, fileName);
    },

    exportDetailNormal() {
      const selectedTenants = this.tenantList
        .filter(t => this.queryParams.tenantIds.includes(t.tenantId))
        .map(t => t.name)
        .join('、');

      const filterRow = [
        `统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}`,
        `租户: ${selectedTenants || '全部'}`,
        `统计类型: ${this.dateType === 'day' ? '日统计' : '月统计'}`,
      ];

      const headers = ['租户编号', '租户名称', '区域标签', '电费(元)', '电量(度)', '尖电量(度)', '峰电量(度)', '平电量(度)', '谷电量(度)'];

      const dataRows = this.tenantDetailData.map(row => [
        row.tenantId !== -1 ? row.tenantId : '总计',
        row.tenantName || '',
        row.labelNames && row.labelNames.length ? row.labelNames[0] : '',
        this.formatExportNumber(row.useAmount),
        this.formatExportNumber(row.useElec),
        this.formatExportNumber(row.useElecPeak),
        this.formatExportNumber(row.useElecTop),
        this.formatExportNumber(row.useElecFlat),
        this.formatExportNumber(row.useElecValley),
      ]);

      const wsData = [
        filterRow,
        [],
        headers,
        ...dataRows,
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '租户用电明细');

      const fileName = this.generateFileName('租户用电明细');
      XLSX.writeFile(wb, fileName);
    },

    exportDetailDeviceDetail() {
      const selectedTenants = this.tenantList
        .filter(t => this.queryParams.tenantIds.includes(t.tenantId))
        .map(t => t.name)
        .join('、');

      const filterRow = [
        `统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}  |  租户: ${selectedTenants || '全部'}  |  统计类型: ${this.dateType === 'day' ? '日统计' : '月统计'}  |  设备明细`
      ];

      const header1 = [
        '租户编号', '租户名称', '电表',
        '明细', '', '', '', '', '',
        '统计', '', '', '', '', '',
      ];

      const header2 = [
        '', '', '',
        '电费(元)', '电量(度)', '尖电量', '峰电量', '平电量', '谷电量',
        '电费(元)', '电量(度)', '尖电量', '峰电量', '平电量', '谷电量',
      ];

      if (!this.tenantDeviceDetailTableData || this.tenantDeviceDetailTableData.length === 0) {
        throw new Error('没有可导出的租户设备明细数据');
      }

      // 按租户分组
      const tenantGroups = {};
      this.tenantDeviceDetailTableData.forEach(row => {
        if (row.tenantId === -1) return; // 跳过总计行

        const key = row.tenantId;
        if (!tenantGroups[key]) {
          tenantGroups[key] = {
            tenantId: row.tenantId,
            tenantName: row.tenantName,
            // 租户的总用电数据（统计列）
            totalUseAmount: row.useAmount || 0,
            totalUseElec: row.useElec || 0,
            totalUseElecPeak: row.useElecPeak || 0,
            totalUseElecTop: row.useElecTop || 0,
            totalUseElecFlat: row.useElecFlat || 0,
            totalUseElecValley: row.useElecValley || 0,
            meters: []
          };
        }

        // 收集电表数据（明细列）
        tenantGroups[key].meters.push({
          meterName: row.meterName,
          elecAmt: row.elecAmt,
          elecUse: row.elecUse,
          elecUsePeak: row.elecUsePeak,
          elecUseTop: row.elecUseTop,
          elecUseFlat: row.elecUseFlat,
          elecUseValley: row.elecUseValley,
        });
      });

      const dataRows = [];

      // 生成数据行
      Object.keys(tenantGroups).sort((a, b) => a - b).forEach(tenantId => {
        const group = tenantGroups[tenantId];
        const meterCount = group.meters.length;

        group.meters.forEach((meter, idx) => {
          if (idx === 0) {
            // 第一行：显示租户信息 + 电表明细 + 租户统计
            dataRows.push([
              group.tenantId,
              group.tenantName || '',
              meter.meterName || '',
              // 明细：单个电表数据
              this.formatExportNumber(meter.elecAmt),
              this.formatExportNumber(meter.elecUse),
              this.formatExportNumber(meter.elecUsePeak),
              this.formatExportNumber(meter.elecUseTop),
              this.formatExportNumber(meter.elecUseFlat),
              this.formatExportNumber(meter.elecUseValley),
              // 统计：租户总数据
              this.formatExportNumber(group.totalUseAmount),
              this.formatExportNumber(group.totalUseElec),
              this.formatExportNumber(group.totalUseElecPeak),
              this.formatExportNumber(group.totalUseElecTop),
              this.formatExportNumber(group.totalUseElecFlat),
              this.formatExportNumber(group.totalUseElecValley),
            ]);
          } else {
            // 后续行：只显示电表明细
            dataRows.push([
              '', '', // 租户编号和名称已合并
              meter.meterName || '',
              // 明细：单个电表数据
              this.formatExportNumber(meter.elecAmt),
              this.formatExportNumber(meter.elecUse),
              this.formatExportNumber(meter.elecUsePeak),
              this.formatExportNumber(meter.elecUseTop),
              this.formatExportNumber(meter.elecUseFlat),
              this.formatExportNumber(meter.elecUseValley),
              // 统计：空（已合并）
              '', '', '', '', '', '',
            ]);
          }
        });
      });

      // 添加总计行
      const totalRow = this.tenantDeviceDetailTableData.find(row => row.tenantId === -1);
      if (totalRow) {
        dataRows.push([
          '总计',
          '',
          '',
          '', '', '', '', '', '', // 明细列留空
          this.formatExportNumber(totalRow.useAmount),
          this.formatExportNumber(totalRow.useElec),
          this.formatExportNumber(totalRow.useElecPeak),
          this.formatExportNumber(totalRow.useElecTop),
          this.formatExportNumber(totalRow.useElecFlat),
          this.formatExportNumber(totalRow.useElecValley),
        ]);
      }

      const wsData = [
        filterRow,
        [],
        header1,
        header2,
        ...dataRows,
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 18 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      ];

      // 合并单元格
      const merges = [
        // 筛选条件行
        { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
        // 表头第一行
        { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } }, // 租户编号
        { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } }, // 租户名称
        { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } }, // 电表
        { s: { r: 2, c: 3 }, e: { r: 2, c: 8 } },  // 明细
        { s: { r: 2, c: 9 }, e: { r: 2, c: 14 } }, // 统计
      ];

      // 合并数据行中的租户信息和统计列
      let currentRow = 4;
      Object.keys(tenantGroups).sort((a, b) => a - b).forEach(tenantId => {
        const group = tenantGroups[tenantId];
        const meterCount = group.meters.length;

        if (meterCount > 1) {
          // 合并租户编号和名称
          merges.push(
            { s: { r: currentRow, c: 0 }, e: { r: currentRow + meterCount - 1, c: 0 } },
            { s: { r: currentRow, c: 1 }, e: { r: currentRow + meterCount - 1, c: 1 } }
          );
          // 合并统计列
          for (let col = 9; col <= 14; col++) {
            merges.push({
              s: { r: currentRow, c: col },
              e: { r: currentRow + meterCount - 1, c: col }
            });
          }
        }

        currentRow += meterCount;
      });

      ws['!merges'] = merges;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '租户用电明细-设备明细');

      const fileName = this.generateFileName('租户用电明细-设备明细');
      XLSX.writeFile(wb, fileName);
    },

    generateFileName(prefix) {
      const now = new Date();
      const timeStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

      return `${prefix}_${timeStr}.xlsx`;
    },

    // ==================== 其他方法 ====================

    handleSwitchChange() {
      if (this.switchDeviceDetail && !this.queryParams.tenantId) {
        if (this.realTenantList.length > 0) {
          this.queryParams.tenantId = this.realTenantList[0].tenantId;
          this.$message.info("设备明细模式已自动选择第一个租户");
        } else {
          this.$message.warning("暂无可用租户");
          this.switchDeviceDetail = false;
          return;
        }
      }
      this.handleSearch();
    },

    handleDetailSwitchChange() {
      this.handleSearch();
    },

    tableRowClassName({ row }) {
      if (row.tenantId === -1) {
        return "total-row";
      }
      return "";
    },

    deviceDetailSpanMethod({ row, columnIndex }) {
      if (columnIndex < 11) {
        return {
          rowspan: row.col,
          colspan: row.col > 0 ? 1 : 0,
        };
      }
    },

    objectSpanMethod({ row, columnIndex }) {
      if (columnIndex < 2) {
        return {
          rowspan: row.tip,
          colspan: row.tip > 0 ? 1 : 0,
        };
      }
    },

    getStatisticsSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = "总计";
          return;
        }
        const values = data.map((item) => Number(item[column.property]));
        if (!values.every((value) => isNaN(value))) {
          sums[index] = values
            .reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              }
              return prev;
            }, 0)
            .toFixed(2);
        } else {
          sums[index] = "";
        }
      });
      return sums;
    },

    getDeviceDetailSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      const uniqueData = [];
      const dateSet = [];
      data.forEach((item) => {
        if (dateSet.indexOf(item.occurDate) === -1) {
          uniqueData.push(item);
          dateSet.push(item.occurDate);
        }
      });
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = "总计";
          return;
        }
        const values = uniqueData.map((item) => Number(item[column.property]));
        if (!values.every((value) => isNaN(value))) {
          sums[index] = values
            .reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              }
              return prev;
            }, 0)
            .toFixed(2);
        } else {
          sums[index] = "";
        }
      });
      return sums;
    },

    initializeMainChart() {
      if (!this.$refs.mainChartContainer) return;
      if (this.mainChartInstance) {
        this.mainChartInstance.dispose();
      }
      this.mainChartInstance = this.$echarts.init(
        this.$refs.mainChartContainer
      );
    },

    initializeMonitorChart() {
      if (!this.$refs.monitorChartContainer) return;
      if (this.monitorChartInstance) {
        this.monitorChartInstance.dispose();
      }
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
      const xAxisData = this.chartData.map((item) =>
        moment(item.occurDate).format("MM-DD")
      );
      const option = {
        color: ["#52c41a", "#5b9bd5", "#ff9f5a"],
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#e8e8e8",
          borderWidth: 1,
          padding: [12, 16],
          textStyle: { color: "#333", fontSize: 14 },
          axisPointer: { type: "cross", crossStyle: { color: "#999" } },
          formatter: (params) => {
            let html = `<div style="font-weight: 500; margin-bottom: 8px">${params[0].name}</div>`;
            params.forEach((item) => {
              let suffix = "";
              if (item.seriesName === "总电费") {
                suffix = " 元";
              } else {
                suffix = " 度";
              }
              html += `<div style="display: flex; align-items: center; margin-bottom: 4px">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${item.color
                }; border-radius: 50%; margin-right: 8px"></span>
                <span style="flex: 1">${item.seriesName}</span>
                <span style="font-weight: 500">${this.formatNumber(
                  item.value
                )}${suffix}</span>
              </div>`;
            });
            return html;
          },
        },
        legend: {
          data: ["总电费", "室内电量", "空调电量"],
          bottom: 35,
          itemGap: 20,
          textStyle: { color: "#666" },
        },
        grid: { top: 30, left: 50, right: 50, bottom: 75, containLabel: true },
        dataZoom: [
          { type: "inside", start: 0, end: 100 },  // ← 改为 0-100
          {
            type: "slider",
            start: 0,                                // ← 改为 0
            end: 100,
            height: 6,
            bottom: 5,
            borderColor: "transparent",
            backgroundColor: "#f0f0f0",
            handleSize: 12,
            showDetail: false,
            showDataShadow: false,
            fillerColor: "rgba(24, 144, 255, 0.15)",
          },
        ],
        xAxis: {
          type: "category",
          data: xAxisData,
          boundaryGap: true,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: "#e8e8e8" } },
          axisLabel: { color: "#666", fontSize: 12 },
        },
        yAxis: [
          {
            type: "value",
            name: "电费 (元)",
            nameTextStyle: { color: "#666", padding: [0, 0, 0, 20] },
            splitLine: { lineStyle: { color: "#f0f0f0", type: "dashed" } },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              color: "#666",
              fontSize: 12,
              formatter: (v) => (v >= 1000 ? v / 1000 + "k" : v),
            },
          },
          {
            type: "value",
            name: "电量 (度)",
            nameTextStyle: { color: "#666", padding: [0, 20, 0, 0] },
            splitLine: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              color: "#666",
              fontSize: 12,
              formatter: (v) => (v >= 1000 ? v / 1000 + "k" : v),
            },
          },
        ],
        series: [
          {
            name: "总电费",
            type: "line",
            data: this.chartData.map((item) => item.useAmount),
            smooth: true,
            symbol: "none",
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.3,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(82, 196, 26, 0.3)" },
                  { offset: 1, color: "rgba(82, 196, 26, 0.05)" },
                ],
              },
            },
          },
          {
            name: "室内电量",
            type: "bar",
            yAxisIndex: 1,
            data: this.chartData.map((item) => item.meterUseElec),
            stack: "usage",
            barMaxWidth: 18,
            itemStyle: {
              color: "rgba(135, 206, 235, 0.65)",
              borderRadius: [2, 2, 0, 0],
            },
          },
          {
            name: "空调电量",
            type: "bar",
            yAxisIndex: 1,
            data: this.chartData.map((item) => item.airUseElec),
            stack: "usage",
            barMaxWidth: 18,
            itemStyle: {
              color: "rgba(255, 160, 122, 0.65)",
              borderRadius: [2, 2, 0, 0],
            },
          },
        ],
      };
      this.mainChartInstance.setOption(option);
    },

    updateMonitorChart() {
      if (!this.monitorChartInstance || this.chartData.length === 0) return;
      const xAxisData = this.chartData.map((item) =>
        moment(item.occurDate).format("MM-DD")
      );
      const option = {
        color: ["#ff6b6b", "#ff922b", "#51cf66", "#339af0"],
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#e8e8e8",
          borderWidth: 1,
          padding: [12, 16],
          textStyle: { color: "#333", fontSize: 14 },
          formatter: (params) => {
            let html = `<div style="font-weight: 500; margin-bottom: 8px">${params[0].name}</div>`;
            params.forEach((item) => {
              html += `<div style="display: flex; align-items: center; margin-bottom: 4px">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${item.color
                }; border-radius: 50%; margin-right: 8px"></span>
                <span style="flex: 1">${item.seriesName}</span>
                <span style="font-weight: 500">${this.formatNumber(
                  item.value
                )} 度</span>
              </div>`;
            });
            return html;
          },
        },
        legend: { show: false },
        grid: { top: 15, left: 45, right: 15, bottom: 35, containLabel: true },
        dataZoom: [
          { type: "inside", start: 70, end: 100 },
          {
            type: "slider",
            start: 70,
            end: 100,
            height: 6,
            bottom: 5,
            borderColor: "transparent",
            backgroundColor: "#f0f0f0",
            handleSize: 12,
            showDetail: false,
            showDataShadow: false,
            fillerColor: "rgba(24, 144, 255, 0.15)",
          },
        ],
        xAxis: {
          type: "category",
          data: xAxisData,
          boundaryGap: false,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: "#e8e8e8" } },
          axisLabel: { color: "#666", fontSize: 11 },
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: "#f0f0f0", type: "dashed" } },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: "#666",
            fontSize: 11,
            formatter: (v) => (v >= 1000 ? v / 1000 + "k" : v),
          },
        },
        series: [
          {
            name: "尖电量",
            type: "line",
            data: this.chartData.map((item) => item.useElecPeak),
            smooth: true,
            symbol: "none",
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(255, 107, 107, 0.3)" },
                  { offset: 1, color: "rgba(255, 107, 107, 0.05)" },
                ],
              },
            },
          },
          {
            name: "峰电量",
            type: "line",
            data: this.chartData.map((item) => item.useElecTop),
            smooth: true,
            symbol: "none",
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(255, 146, 43, 0.3)" },
                  { offset: 1, color: "rgba(255, 146, 43, 0.05)" },
                ],
              },
            },
          },
          {
            name: "平电量",
            type: "line",
            data: this.chartData.map((item) => item.useElecFlat),
            smooth: true,
            symbol: "none",
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(81, 207, 102, 0.3)" },
                  { offset: 1, color: "rgba(81, 207, 102, 0.05)" },
                ],
              },
            },
          },
          {
            name: "谷电量",
            type: "line",
            data: this.chartData.map((item) => item.useElecValley),
            smooth: true,
            symbol: "none",
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(51, 154, 240, 0.3)" },
                  { offset: 1, color: "rgba(51, 154, 240, 0.05)" },
                ],
              },
            },
          },
        ],
      };
      this.monitorChartInstance.setOption(option);
    },

    handleResize() {
      this.$nextTick(() => {
        if (this.mainChartInstance) this.mainChartInstance.resize();
        if (this.monitorChartInstance) this.monitorChartInstance.resize();
      });
    },

    formatNumber(num) {
      if (num === undefined || num === null) return "-";
      if (num === 0) return "0.00";
      return Number(num).toFixed(2);
    },

    getSettleWayLabel(settleWay) {
      if (settleWay === undefined || settleWay === null) return "";
      return this.settleWayMap[settleWay] || "";
    },
  },
};
</script>
<style lang="scss" scoped>
.electricity-dashboard {
  min-height: 100vh;
  padding: 16px;
  background: #f5f7fa;
}

.switch-text-wrapper {
  display: inline-block;
  cursor: help;
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

.tab-switcher {
  display: flex;
  gap: 8px;
  margin: 0 20px;
}

.tab-btn {
  padding: 8px 20px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;

  &:hover {
    color: #1890ff;
    border-color: #1890ff;
  }

  &.active {
    color: #fff;
    background: #1890ff;
    border-color: #1890ff;
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

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    background: #93c5fd;
    cursor: not-allowed;
    opacity: 0.7;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.search-btn {
  background: #3b82f6;
  color: white;

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }
}

.reset-btn {
  background: #f3f4f6;
  color: #6b7280;

  &:hover:not(:disabled) {
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
  white-space: nowrap;
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

    &:checked+.toggle-slider {
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

// ==================== 统计卡片 - 公式样式（重构部分）====================
.stats-formula-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.formula-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  &.electricity-cost {
    .main-indicator {
      background: linear-gradient(135deg, #5B8FF9 0%, #4A7FD9 100%);
      box-shadow: 0 4px 12px rgba(91, 143, 249, 0.2);
    }
  }

  &.electricity-usage {
    .main-indicator {
      background: linear-gradient(135deg, #72e79f 0%, #4fbb7c 100%);
      box-shadow: 0 4px 12px rgba(54, 207, 201, 0.15);
    }
  }
}

.card-content {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.formula-main {
  flex-shrink: 0;
}

.main-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  border-radius: 10px;
  min-width: 120px;
}

.main-value {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
  white-space: nowrap;
  text-align: center;
}

.main-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  white-space: nowrap;
  text-align: center;
}

.formula-operator {
  flex-shrink: 0;
  font-size: 28px;
  font-weight: 300;
  color: rgba(0, 0, 0, 0.25);
  padding: 0 6px;
}

.formula-sub-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow: hidden;
  min-width: 0;

  &.two-items {
    justify-content: flex-start;
  }

  &.four-items {
    justify-content: space-between;
  }
}

.sub-indicator {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 6px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
  min-width: 65px;
  max-width: 100px;

  &:hover {
    background: rgba(255, 255, 255, 1);
    border-color: rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
}

.sub-value {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

.sub-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
  text-align: center;
}

.operator-plus {
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.35);
  padding: 0 2px;
}

// 主内容区
.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

// 图表区域
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

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.switch-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
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

/* 标签样式 */
.label-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.label-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 2px;
  font-size: 12px;
  color: #666;
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

/* Element UI 表格样式覆盖 */
::v-deep .el-table {
  .total-row {
    position: sticky;
    bottom: 0;
    background: #fafafa;
    font-weight: 600;
    z-index: 2;

    td {
      background: #fafafa !important;
    }
  }

  th {
    background: #fafafa;
    color: #333;
    font-weight: 600;
  }

  .cell {
    padding: 0 12px;
  }
}

// Element UI Switch 样式确保
::v-deep .el-switch {
  flex-shrink: 0;
}

.fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

// ========== 响应式设计 ==========

// 大屏优化（1920px+）
@media (min-width: 1920px) {
  .sub-indicator {
    min-width: 75px;
    max-width: 110px;
    padding: 12px 8px;
  }

  .sub-value {
    font-size: 18px;
  }

  .main-value {
    font-size: 26px;
  }

  .main-indicator {
    min-width: 140px;
  }
}

// 中等屏幕（1600px）
@media (max-width: 1600px) {
  .card-content {
    gap: 12px;
    padding: 22px 18px;
  }

  .formula-sub-group {
    gap: 6px;
  }

  .sub-indicator {
    min-width: 60px;
    max-width: 90px;
    padding: 10px 5px;
  }

  .main-value {
    font-size: 22px;
  }

  .sub-value {
    font-size: 15px;
  }

  .operator-plus {
    font-size: 14px;
  }
}

// 较小屏幕（1400px）
@media (max-width: 1400px) {
  .stats-formula-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .card-content {
    justify-content: space-between;
  }

  .formula-sub-group {
    &.four-items {
      gap: 5px;
    }
  }

  .sub-indicator {
    min-width: 58px;
    max-width: 85px;
  }

  .chart-section {
    grid-template-columns: 1fr;
  }

  .chart-container {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
}

// 平板（1024px）
@media (max-width: 1024px) {
  .sub-indicator {
    min-width: 55px;
    max-width: 80px;
    padding: 8px 4px;
  }

  .sub-value {
    font-size: 14px;
  }

  .sub-label {
    font-size: 11px;
  }
}

// 移动端（768px）
@media (max-width: 768px) {
  .electricity-dashboard {
    padding: 12px;
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

  .tab-switcher {
    margin: 0;
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
    flex-wrap: wrap;
  }

  .card-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 20px 16px;
  }

  .formula-operator {
    align-self: center;
    transform: rotate(90deg);
    padding: 8px 0;
  }

  .formula-sub-group {
    justify-content: center !important;
    flex-wrap: wrap;
    gap: 8px;
  }

  .sub-indicator {
    min-width: 70px;
    max-width: 90px;
  }

  .main-indicator {
    align-self: center;
  }

  .chart-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .chart-summary {
    width: 100%;
    flex-wrap: wrap;
    gap: 16px;
  }
}

// 超小屏幕（480px）
@media (max-width: 480px) {
  .main-indicator {
    padding: 12px 16px;
    min-width: 110px;
  }

  .main-value {
    font-size: 20px;
  }

  .main-label {
    font-size: 12px;
  }

  .sub-indicator {
    padding: 8px 6px;
    min-width: 65px;
    max-width: 80px;
  }

  .sub-value {
    font-size: 13px;
  }

  .sub-label {
    font-size: 11px;
  }
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

  // 强制去除所有可能的边框
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

      // 当今天是开始或结束日期时，保持白色文字
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