<template>
  <div class="electricity-dashboard">
    <!-- 顶部操作栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">{{ $t('electricityReport.dashboardTitle') }}</h1>

        <!-- Tab切换 -->
        <div class="tab-switcher">
          <button :class="['tab-btn', { active: reportType === 'statistics' }]" @click="switchReportType('statistics')">
            {{ $t('electricityReport.tabStatistics') }}
          </button>
          <button :class="['tab-btn', { active: reportType === 'detail' }]" @click="switchReportType('detail')">
            {{ $t('electricityReport.tabDetail') }}
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
          <span v-if="exportLoading">{{ $t('electricityReport.exportLoading') }}</span>
          <span v-else>{{ $t('electricityReport.exportReport') }}</span>
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-container">
      <div class="filter-item date-filter">
        <label class="filter-label">{{ $t('electricityReport.filterStatPeriod') }}</label>
        <el-date-picker v-model="queryParams.dateRange" :type="datePickerType" :format="dateFormat"
          :value-format="dateValueFormat" range-separator="-" :start-placeholder="$t('electricityReport.phDateStart')" :end-placeholder="$t('electricityReport.phDateEnd')"
          :picker-options="currentPickerOptions" class="custom-date-picker" popper-class="elegant-date-picker"
          @change="handleDateRangeChange" />
      </div>

      <!-- 租户选择 -->
      <div class="filter-item tenant-filter">
        <label class="filter-label">{{ $t('electricityReport.filterTenant') }}</label>
        <!-- 单选 - 租户用电统计 -->
        <el-select v-show="reportType === 'statistics'" v-model="queryParams.tenantId" filterable :placeholder="$t('electricityReport.phTenant')"
          class="custom-select" :loading="tenantLoading" @change="handleTenantChange">
          <el-option v-for="tenant in (switchDeviceDetail ? realTenantList : tenantList)" :key="tenant.tenantId"
            :label="tenantOptionLabel(tenant)" :value="tenant.tenantId" />
        </el-select>
        <!-- 多选 - 租户用电明细 -->
        <el-select v-show="reportType === 'detail'" v-model="queryParams.tenantIds" multiple collapse-tags filterable
          :placeholder="$t('electricityReport.phTenant')" class="custom-select" :loading="tenantLoading" @change="handleDetailTenantChange">
          <el-option
            v-if="realTenantList.length > 0 && !isAllDetailTenantsSelected"
            :key="TENANT_SELECT_SELECT_ALL"
            :label="$t('electricityReport.btnSelectAll')"
            :value="TENANT_SELECT_SELECT_ALL"
            class="tenant-select-action-option"
          />
          <el-option
            v-if="queryParams.tenantIds.length > 0"
            :key="TENANT_SELECT_CLEAR_ALL"
            :label="$t('electricityReport.btnDeselectAll')"
            :value="TENANT_SELECT_CLEAR_ALL"
            class="tenant-select-action-option tenant-select-action-option--clear"
          />
          <el-option v-for="tenant in realTenantList" :key="tenant.tenantId" :label="tenantOptionLabel(tenant)"
            :value="tenant.tenantId" />
        </el-select>
      </div>

      <!-- 租户类型 -->
      <div class="filter-item tenant-type-filter">
        <label class="filter-label">{{ $t('electricityReport.filterTenantType') }}</label>
        <el-select v-model="queryParams.tenantType" class="custom-select" @change="handleTenantTypeChange">
          <el-option :label="$t('electricityReport.tenantType0')" :value="0" />
          <el-option :label="$t('electricityReport.tenantType1')" :value="1" />
          <el-option :label="$t('electricityReport.tenantType2')" :value="2" />
          <el-option :label="$t('electricityReport.tenantType3')" :value="3" />
        </el-select>
      </div>

      <div class="filter-actions">
        <!-- <button class="search-btn" @click="handleSearch">查询</button> -->
        <button class="reset-btn" @click="handleReset">{{ $t('electricityReport.btnReset') }}</button>

        <!-- 第一个tab的设备明细 -->
        <el-tooltip v-if="reportType === 'statistics'" effect="dark" :content="$t('electricityReport.tooltipDeviceDetailStats')" placement="top"
          :disabled="!!queryParams.tenantId">
          <div class="detail-switch">
            <span class="switch-text">{{ $t('electricityReport.deviceDetailSwitch') }}</span>
            <label class="toggle-switch">
              <input type="checkbox" v-model="switchDeviceDetail" @change="handleSwitchChange" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </el-tooltip>

        <!-- 第二个tab的设备明细 -->
        <div class="detail-switch" v-if="reportType === 'detail'">
          <span class="switch-text">{{ $t('electricityReport.deviceDetailSwitch') }}</span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="detailSwitchDeviceDetail" @change="handleDetailSwitchChange" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 租户用电统计 - 数据统计卡片（改为两个大模块） -->

    <div
      v-if="reportType === 'statistics' && (tableData.length > 0 || todayVirtualRow)"
      class="stats-formula-cards"
      :class="{ 'is-history-only': !todayVirtualRow }"
    >
      <!-- 左侧：区间电量的时间闭环与分时闭环 -->
      <div class="formula-card electricity-usage">
        <div v-if="todayVirtualRow" class="usage-realtime-row">
          <div class="usage-heading">
            <span class="usage-heading-label">{{ $t('electricityReport.todayElecRealtime') }}</span>
            <span class="usage-heading-value">
              {{ formatNumber(todayVirtualRow.useElec) }}
              <small>{{ $t('electricityReport.unitKwhDisplay') }}</small>
            </span>
          </div>
        </div>

        <div class="usage-period-row">
          <div class="period-total">
            <div class="period-total-title">
              <span>{{ $t('electricityReport.periodTotalElec') }}</span>
            </div>
            <div class="period-total-value">
              {{ formatNumber(periodElecStats.elec) }}
              <small>{{ $t('electricityReport.unitKwhDisplay') }}</small>
            </div>
          </div>

          <div v-if="tableData.length > 0" class="period-equation">
            <div class="formula-operator">=</div>
            <template v-if="todayVirtualRow">
              <div class="period-breakdown-card">
                <span>{{ $t('electricityReport.periodHistoryElec') }}</span>
                <strong>
                  {{ formatNumber(totalStats.elec) }}
                  <small>{{ $t('electricityReport.unitKwhDisplay') }}</small>
                </strong>
              </div>
              <div class="formula-operator formula-operator--plus">+</div>
              <div class="period-breakdown-card period-breakdown-card--realtime">
                <span>{{ $t('electricityReport.todayIncreaseRealtime') }}</span>
                <strong>
                  {{ formatNumber(todayVirtualRow.useElec) }}
                  <small>{{ $t('electricityReport.unitKwhDisplay') }}</small>
                </strong>
              </div>
            </template>
            <template v-else>
              <div class="period-breakdown-card">
                <span>{{ $t('electricityReport.legendIndoorElec') }}</span>
                <strong>
                  {{ formatNumber(totalStats.meterUseElec) }}
                  <small>{{ $t('electricityReport.unitKwhDisplay') }}</small>
                </strong>
              </div>
              <div class="formula-operator formula-operator--plus">+</div>
              <div class="period-breakdown-card">
                <span>{{ $t('electricityReport.legendAcElec') }}</span>
                <strong>
                  {{ formatNumber(totalStats.airUseElec) }}
                  <small>{{ $t('electricityReport.unitKwhDisplay') }}</small>
                </strong>
              </div>
            </template>
          </div>
        </div>

        <div class="usage-tou-row">
          <div class="usage-tou-title">
            <span>{{ $t('electricityReport.periodTouComposition') }}</span>
          </div>
          <div class="period-tou-list">
            <div class="period-tou-item">
              <span class="tou-dot tou-dot--peak"></span>
              <span>{{ $t('electricityReport.touPeakShort') }}</span>
              <strong>{{ formatNumber(periodElecStats.elecPeak) }}</strong>
            </div>
            <div class="period-tou-item">
              <span class="tou-dot tou-dot--top"></span>
              <span>{{ $t('electricityReport.touTopShort') }}</span>
              <strong>{{ formatNumber(periodElecStats.elecTop) }}</strong>
            </div>
            <div class="period-tou-item">
              <span class="tou-dot tou-dot--flat"></span>
              <span>{{ $t('electricityReport.touFlatShort') }}</span>
              <strong>{{ formatNumber(periodElecStats.elecFlat) }}</strong>
            </div>
            <div class="period-tou-item">
              <span class="tou-dot tou-dot--valley"></span>
              <span>{{ $t('electricityReport.touValleyShort') }}</span>
              <strong>{{ formatNumber(periodElecStats.elecValley) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：电费公式 -->
      <div class="formula-card electricity-cost">
        <div class="card-top-badge" v-if="todayVirtualRow">
          {{ $t('electricityReport.todayFeeRealtime', { value: formatNumber(todayVirtualRow.useAmount) }) }}
        </div>
        <div class="card-content">
          <div class="formula-main">
            <div class="main-indicator">
              <div class="main-value">{{ formatNumber(totalStats.amount) }}</div>
              <div class="main-label">{{ $t('electricityReport.mainTotalFee') }}</div>
            </div>
          </div>

          <div class="formula-operator">=</div>

          <div class="formula-sub-group two-items">
            <div class="sub-indicator">
              <div class="sub-value">{{ formatNumber(totalStats.meterBalance) }}</div>
              <div class="sub-label">{{ $t('electricityReport.subIndoorFee') }}</div>
            </div>

            <div class="operator-plus">+</div>

            <div class="sub-indicator">
              <div class="sub-value">{{ formatNumber(totalStats.airBalance) }}</div>
              <div class="sub-label">{{ $t('electricityReport.subAcFee') }}</div>
            </div>

            <div class="formula-cost-side-hint" :title="$t('electricityReport.tipNoFloatingTitle')">
              <i class="el-icon-info" aria-hidden="true" />
              <span>{{ $t('electricityReport.tipNoFloatingShort') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content" v-loading="loading" :element-loading-text="$t('electricityReport.loadingText')">
      <!-- 租户用电统计 - 图表区域 -->
      <div class="chart-section" v-if="reportType === 'statistics' && displayChartData.length > 0">
        <div class="chart-container">
          <div class="chart-header">
            <h2 class="chart-title">{{ $t('electricityReport.chartTrendTitle') }}</h2>
            <div class="chart-date-range">{{ formatDateRange }}</div>
          </div>
          <div class="chart-info">
            <div class="chart-legends">
              <div class="legend-item active" @click="toggleSeriesByKey('totalFee')">
                <span class="legend-dot" style="background: #52c41a"></span>
                <span class="legend-text">{{ $t('electricityReport.legendTotalFee') }}</span>
              </div>
              <div class="legend-item active" @click="toggleSeriesByKey('indoorElec')">
                <span class="legend-dot" style="background: #5b9bd5"></span>
                <span class="legend-text">{{ $t('electricityReport.legendIndoorElec') }}</span>
              </div>
              <div class="legend-item active" @click="toggleSeriesByKey('acElec')">
                <span class="legend-dot" style="background: #ff9f5a"></span>
                <span class="legend-text">{{ $t('electricityReport.legendAcElec') }}</span>
              </div>
            </div>
            <div class="chart-summary">
              <div class="summary-item">
                <span class="summary-label">{{ $t('electricityReport.summaryTotalFee') }}</span>
                <span class="summary-value">¥{{ formatNumber(totalStats.amount) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">{{ $t('electricityReport.summaryIndoorElec') }}</span>
                <span class="summary-value">{{ formatNumber(totalStats.meterUseElec) }} {{ $t('electricityReport.unitKwhDisplay') }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">{{ $t('electricityReport.summaryAcElec') }}</span>
                <span class="summary-value">{{ formatNumber(totalStats.airUseElec) }} {{ $t('electricityReport.unitKwhDisplay') }}</span>
              </div>
            </div>
          </div>
          <div ref="mainChartContainer" class="main-chart"></div>
        </div>

        <div class="monitor-container">
          <div class="monitor-header">
            <h3 class="monitor-title">{{ $t('electricityReport.monitorTitle') }}</h3>
          </div>
          <div class="monitor-content">
            <div ref="monitorChartContainer" class="monitor-chart"></div>
            <div class="monitor-stats">
              <div class="monitor-stat-item">
                <span class="stat-icon spike"></span>
                <span class="stat-name">{{ $t('electricityReport.statPeak') }}</span>
                <span class="stat-value">{{
                  formatNumber(totalStats.elecPeak)
                }}</span>
              </div>
              <div class="monitor-stat-item">
                <span class="stat-icon peak"></span>
                <span class="stat-name">{{ $t('electricityReport.statTop') }}</span>
                <span class="stat-value">{{
                  formatNumber(totalStats.elecTop)
                }}</span>
              </div>
              <div class="monitor-stat-item">
                <span class="stat-icon flat"></span>
                <span class="stat-name">{{ $t('electricityReport.statFlat') }}</span>
                <span class="stat-value">{{
                  formatNumber(totalStats.elecFlat)
                }}</span>
              </div>
              <div class="monitor-stat-item">
                <span class="stat-icon valley"></span>
                <span class="stat-name">{{ $t('electricityReport.statValley') }}</span>
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
          <h2 class="section-title">{{ $t('electricityReport.detailedData') }}</h2>
          <div class="today-exclude-note" v-if="todayVirtualRow">{{ $t('electricityReport.todayDataNote') }}</div>
          <div class="section-actions">
            <button class="fullscreen-btn" @click="openFullscreen"
              v-if="displayTableData.length > 0 || displayDeviceDetailData.length > 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              <span>{{ $t('electricityReport.fullscreenView') }}</span>
            </button>
          </div>
        </div>

        <!-- 普通统计表格 -->
        <el-table v-show="!switchDeviceDetail" v-if="displayTableData.length > 0" ref="statisticsTable" :data="displayTableData"
          show-summary :summary-method="getStatisticsSummaries" height="70vh" :highlight-current-row="true"
          :row-class-name="statisticsRowClassName">
          <el-table-column min-width="140" :label="$t('electricityReport.colDate')">
            <template slot-scope="scope">
              {{ scope.row.occurDate ? scope.row.occurDate : $t('electricityReport.summaryTotal') }}
            </template>
          </el-table-column>
          <el-table-column min-width="140" :label="$t('electricityReport.colTotalFeeYuan')" prop="useAmount" align="right" />
          <el-table-column min-width="140" :label="$t('electricityReport.colIndoorFeeYuan')" prop="meterBalance" align="right" />
          <el-table-column min-width="140" :label="$t('electricityReport.colAcFeeYuan')" prop="airBalance" align="right" />
          <el-table-column min-width="140" :label="$t('electricityReport.colTotalKwh')" prop="useElec" align="right" />
          <el-table-column
            v-if="airSysElecColsVisible"
            min-width="140"
            :label="$t('electricityReport.colSysTotalKwh')"
            prop="sysElec"
            align="right"
          />
          <el-table-column min-width="140" :label="$t('electricityReport.colIndoorKwh')" prop="meterUseElec" align="right" />
          <el-table-column min-width="140" :label="$t('electricityReport.colAcKwh')" prop="airUseElec" align="right" />
          <el-table-column
            v-if="airSysElecColsVisible"
            min-width="150"
            :label="$t('electricityReport.colAirSysKwh')"
            prop="airSysElec"
            align="right"
          />

          <el-table-column min-width="140" :label="$t('electricityReport.colPeakKwh')" prop="useElecPeak" align="right" />
          <el-table-column min-width="140" :label="$t('electricityReport.colTopKwh')" prop="useElecTop" align="right" />
          <el-table-column min-width="140" :label="$t('electricityReport.colFlatKwh')" prop="useElecFlat" align="right" />
          <el-table-column min-width="140" :label="$t('electricityReport.colValleyKwh')" prop="useElecValley" align="right" />
        </el-table>

        <!-- 设备明细表格 -->
        <el-table v-show="switchDeviceDetail" v-if="displayDeviceDetailData.length > 0" ref="deviceDetailTable"
          :data="displayDeviceDetailData" :span-method="deviceDetailSpanMethod" :summary-method="getDeviceDetailSummaries"
          show-summary height="70vh" :highlight-current-row="true" :row-class-name="statisticsRowClassName">
          <el-table-column min-width="140" :label="$t('electricityReport.colDate')">
            <template slot-scope="scope">{{ scope.row.occurDate }}</template>
          </el-table-column>
          <el-table-column min-width="120" :label="$t('electricityReport.colFeeYuan')" prop="useAmount" align="right" />
          <el-table-column min-width="120" :label="$t('electricityReport.colIndoorFeeYuan')" prop="meterBalance" align="right" />
          <el-table-column min-width="120" :label="$t('electricityReport.colAcFeeYuan')" prop="airBalance" align="right" />
          <el-table-column min-width="120" :label="$t('electricityReport.colTotalKwh')" prop="useElec" align="right" />
          <el-table-column
            v-if="airSysElecColsVisible"
            min-width="120"
            :label="$t('electricityReport.colSysTotalKwh')"
            prop="sysElec"
            align="right"
          />
          <el-table-column min-width="120" :label="$t('electricityReport.colIndoorKwh')" prop="meterUseElec" align="right" />
          <el-table-column min-width="120" :label="$t('electricityReport.colAcKwh')" prop="airUseElec" align="right" />
          <el-table-column
            v-if="airSysElecColsVisible"
            min-width="130"
            :label="$t('electricityReport.colAirSysKwh')"
            prop="airSysElec"
            align="right"
          />
          <el-table-column min-width="120" :label="$t('electricityReport.colPeakKwh')" prop="useElecPeak" align="right" />
          <el-table-column min-width="120" :label="$t('electricityReport.colTopKwh')" prop="useElecTop" align="right" />
          <el-table-column min-width="120" :label="$t('electricityReport.colFlatKwh')" prop="useElecFlat" align="right" />
          <el-table-column min-width="120" :label="$t('electricityReport.colValleyKwh')" prop="useElecValley" align="right" />
          <el-table-column :label="$t('electricityReport.colDevice')" width="160">
            <template slot-scope="scope">{{
              $displayBizHybrid(scope.row.deviceUseDtoList.meterName) || "-"
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colSettleWay')" width="120">
            <template slot-scope="scope">{{
              getSettleWayLabel(scope.row.deviceUseDtoList.settleWay)
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colFee')" width="120" align="right">
            <template slot-scope="scope">{{
              scope.row.deviceUseDtoList.useAmount !== undefined
                ? scope.row.deviceUseDtoList.useAmount
                : "-"
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colElecGroup')" align="center">
            <el-table-column :label="$t('electricityReport.colGrandTotal')" width="100" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElec !== undefined
                  ? scope.row.deviceUseDtoList.useElec
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colSpikeShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElecPeak !== undefined
                  ? scope.row.deviceUseDtoList.useElecPeak
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colPeakShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElecTop !== undefined
                  ? scope.row.deviceUseDtoList.useElecTop
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colFlatShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElecFlat !== undefined
                  ? scope.row.deviceUseDtoList.useElecFlat
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colValleyShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.useElecValley !== undefined
                  ? scope.row.deviceUseDtoList.useElecValley
                  : "-"
              }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colStartReading')" align="center">
            <el-table-column :label="$t('electricityReport.colTime')" width="160">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.occurTime
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colTotalElecShort')" width="100" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerAll
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colSpikeShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerPeak
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colPeakShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerTop
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colFlatShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerFlat
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colValleyShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.startUseDto
                  ? scope.row.deviceUseDtoList.startUseDto.powerValley
                  : "-"
              }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colEndReading')" align="center">
            <el-table-column :label="$t('electricityReport.colTime')" width="160">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.occurTime
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colTotalElecShort')" width="100" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerAll
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colSpikeShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerPeak
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colPeakShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerTop
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colFlatShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerFlat
                  : "-"
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colValleyShort')" width="80" align="right">
              <template slot-scope="scope">{{
                scope.row.deviceUseDtoList.stopUseDto
                  ? scope.row.deviceUseDtoList.stopUseDto.powerValley
                  : "-"
              }}</template>
            </el-table-column>
          </el-table-column>
        </el-table>

        <div class="empty-state" v-if="!loading && displayTableData.length === 0 && !switchDeviceDetail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <p>{{ $t('electricityReport.emptyNoData') }}</p>
        </div>
        <div class="empty-state" v-if="!loading && displayDeviceDetailData.length === 0 && switchDeviceDetail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 3v4m8-4v4M3 11h18" />
          </svg>
          <p>{{ $t('electricityReport.emptyNoDeviceDetail') }}</p>
        </div>
      </div>

      <!-- 租户用电明细 - 租户列表表格 -->
      <div class="table-section" v-if="reportType === 'detail' && !detailSwitchDeviceDetail">
        <div class="section-header">
          <h2 class="section-title">{{ $t('electricityReport.sectionDetailTitle') }}</h2>
        </div>
        <el-table v-if="tenantDetailData.length > 0" :data="tenantDetailData" height="calc(100vh - 400px)"
          :highlight-current-row="true" :row-class-name="tableRowClassName">
          <el-table-column :label="$t('electricityReport.colTenantId')" width="120">
            <template slot-scope="scope">{{
              scope.row.tenantId !== -1 ? scope.row.tenantId : $t('electricityReport.summaryTotal')
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colTenantName')" min-width="200">
            <template slot-scope="scope">{{
              $displayBizHybrid(scope.row.tenantName) || "-"
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
          <el-table-column :label="$t('electricityReport.colElecFee')" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useAmount)
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colElecKwh')" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useElec)
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colPeakElec')" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useElecPeak)
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colTopElec')" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useElecTop)
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colFlatElec')" width="140" align="right">
            <template slot-scope="scope">{{
              formatNumber(scope.row.useElecFlat)
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colValleyElec')" width="140" align="right">
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
          <p>{{ $t('electricityReport.emptyNoData') }}</p>
        </div>
      </div>

      <!-- 租户用电明细 - 设备明细表格 -->
      <div class="table-section" v-if="reportType === 'detail' && detailSwitchDeviceDetail">
        <div class="section-header">
          <h2 class="section-title">{{ $t('electricityReport.sectionDeviceDetailTitle') }}</h2>
        </div>
        <el-table v-if="tenantDeviceDetailTableData.length > 0" :data="tenantDeviceDetailTableData"
          :span-method="objectSpanMethod" height="calc(100vh - 400px)" :highlight-current-row="true"
          :row-class-name="tableRowClassName">
          <el-table-column :label="$t('electricityReport.colTenantId')" width="120">
            <template slot-scope="scope">{{
              scope.row.tenantId !== -1 ? scope.row.tenantId : $t('electricityReport.summaryTotal')
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colTenantName')" min-width="200">
            <template slot-scope="scope">{{
              $displayBizHybrid(scope.row.tenantName) || "-"
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
          <el-table-column :label="$t('electricityReport.colMeter')" width="180">
            <template slot-scope="scope">{{
              $displayBizHybrid(scope.row.meterName) || "-"
            }}</template>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colDetail')" align="center">
            <el-table-column :label="$t('electricityReport.colElecFee')" width="140" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useAmount)
                  : formatNumber(scope.row.elecAmt)
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colElecKwh')" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElec)
                  : formatNumber(scope.row.elecUse)
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colPeakElecShort')" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElecPeak)
                  : formatNumber(scope.row.elecUsePeak)
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colTopElecShort')" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElecTop)
                  : formatNumber(scope.row.elecUseTop)
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colFlatElecShort')" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElecFlat)
                  : formatNumber(scope.row.elecUseFlat)
              }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colValleyElecShort')" width="120" align="right">
              <template slot-scope="scope">{{
                scope.row.tenantId === -1
                  ? formatNumber(scope.row.useElecValley)
                  : formatNumber(scope.row.elecUseValley)
              }}</template>
            </el-table-column>
          </el-table-column>
          <el-table-column :label="$t('electricityReport.colStatistics')" align="center">
            <el-table-column :label="$t('electricityReport.colElecFee')" width="140" align="right">
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
            <el-table-column :label="$t('electricityReport.colElecKwh')" width="120" align="right">
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
            <el-table-column :label="$t('electricityReport.colPeakElecShort')" width="120" align="right">
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
            <el-table-column :label="$t('electricityReport.colTopElecShort')" width="120" align="right">
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
            <el-table-column :label="$t('electricityReport.colFlatElecShort')" width="120" align="right">
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
            <el-table-column :label="$t('electricityReport.colValleyElecShort')" width="120" align="right">
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
          <p>{{ $t('electricityReport.emptyNoDeviceDetail') }}</p>
        </div>
      </div>
    </div>
    <table-focus-mode v-if="reportType === 'statistics' && currentManagerId" :visible="fullscreenVisible"
      :current-manager-id="currentManagerId" :initial-query-params="queryParams" @close="closeFullscreen" />
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import {
  getSimpleTenantList,
  queryTenantUse,
  useReportQueryTenantUseStatis
} from '@/api/useReport'
import { queryCwTenantTodayUse } from '@/api/newDashboard'
import moment from 'moment'
import TableFocusMode from './components/TableFocusMode.vue'
import * as XLSX from 'xlsx'

/** 明细 Tab 多选下拉内「全选 / 取消全选」哨兵值 */
const TENANT_SELECT_CLEAR_ALL = '__CLEAR_ALL__'
const TENANT_SELECT_SELECT_ALL = '__SELECT_ALL__'

export default {
  name: 'ElectricityReport',
  components: {
    TableFocusMode
  },
  data () {
    return {
      TENANT_SELECT_CLEAR_ALL,
      TENANT_SELECT_SELECT_ALL,
      reportType: 'statistics',
      dateType: 'day',
      queryParams: {
        dateRange: [],
        tenantIds: [],
        tenantId: '',
        tenantType: 0
      },
      tenantList: [],
      tenantLoading: false,
      loading: false,
      exportLoading: false,
      chartData: [],
      tableData: [],
      todayVirtualRow: null,
      deviceDetailData: [],
      tenantDetailData: [],
      tenantDeviceDetailTableData: [],
      switchDeviceDetail: false,
      detailSwitchDeviceDetail: false,
      mainChartInstance: null,
      monitorChartInstance: null,
      pickerOptions: {
        disabledDate (time) {
          return time.getTime() > Date.now()
        }
      },
      resizeObserver: null,
      fullscreenVisible: false
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId', 'isAirSysElecManager']),
    /** 系统总电量 / 空调系统电量列：与 getAirSysElecCoefKeys 白名单一致 */
    airSysElecColsVisible () {
      return this.isAirSysElecManager(this.currentManagerId)
    },
    datePickerType () {
      if (this.reportType === 'statistics') {
        return 'daterange'
      }
      return this.dateType === 'day' ? 'daterange' : 'monthrange'
    },
    dateFormat () {
      if (this.reportType === 'statistics') {
        return 'yyyy-MM-dd'
      }
      return this.dateType === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM'
    },
    dateValueFormat () {
      if (this.reportType === 'statistics') {
        return 'yyyy-MM-dd'
      }
      return this.dateType === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM'
    },
    formatDateRange () {
      if (
        !this.queryParams.dateRange ||
        this.queryParams.dateRange.length !== 2
      ) {
        return ''
      }
      const [start, end] = this.queryParams.dateRange
      return `${start} - ${end}`
    },
    totalStats () {
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
        sysElec: 0,
        airSysElec: 0
      }
      const addRow = (item) => {
        stats.amount += Number(item.useAmount) || 0
        stats.elec += Number(item.useElec) || 0
        stats.elecPeak += Number(item.useElecPeak) || 0
        stats.elecTop += Number(item.useElecTop) || 0
        stats.elecFlat += Number(item.useElecFlat) || 0
        stats.elecValley += Number(item.useElecValley) || 0
        stats.meterBalance += Number(item.meterBalance) || 0
        stats.airBalance += Number(item.airBalance) || 0
        stats.meterUseElec += Number(item.meterUseElec) || 0
        stats.airUseElec += Number(item.airUseElec) || 0
        stats.sysElec += Number(item.sysElec) || 0
        stats.airSysElec += Number(item.airSysElec) || 0
      }
      this.tableData.forEach(addRow)
      return stats
    },
    /**
     * 报表接口的合计不包含今日实时数据；当统计区间包含今天时，
     * 将今日接口数据并入电量与尖峰平谷，保证两组展示公式始终闭环。
     */
    periodElecStats () {
      const today = this.todayVirtualRow || {}
      return {
        elec: this.totalStats.elec + (Number(today.useElec) || 0),
        elecPeak: this.totalStats.elecPeak + (Number(today.useElecPeak) || 0),
        elecTop: this.totalStats.elecTop + (Number(today.useElecTop) || 0),
        elecFlat: this.totalStats.elecFlat + (Number(today.useElecFlat) || 0),
        elecValley: this.totalStats.elecValley + (Number(today.useElecValley) || 0)
      }
    },
    displayChartData () {
      if (!this.todayVirtualRow) return this.chartData
      const today = this.todayVirtualRow.occurDate
      return [...this.chartData.filter(item => item.occurDate !== today), this.todayVirtualRow].sort(
        (a, b) => new Date(a.occurDate) - new Date(b.occurDate)
      )
    },
    displayTableData () {
      if (!this.todayVirtualRow) return this.tableData
      const today = this.todayVirtualRow.occurDate
      return [...this.tableData.filter(item => item.occurDate !== today), this.todayVirtualRow].sort(
        (a, b) => new Date(b.occurDate) - new Date(a.occurDate)
      )
    },
    displayDeviceDetailData () {
      if (!this.todayVirtualRow) return this.deviceDetailData
      const today = this.todayVirtualRow.occurDate
      const virtualRow = {
        ...this.todayVirtualRow,
        col: 1,
        deviceUseDtoList: {}
      }
      return [virtualRow, ...this.deviceDetailData.filter(item => item.occurDate !== today)]
    },
    realTenantList () {
      return this.tenantList.filter(item => item.tenantId !== '')
    },
    isAllDetailTenantsSelected () {
      return (
        this.realTenantList.length > 0 &&
        this.queryParams.tenantIds.length === this.realTenantList.length
      )
    },
    loadingText () {
      return this.$t('electricityReport.loadingText')
    },
    chartSeriesNames () {
      const t = (k) => this.$t(`electricityReport.${k}`)
      return {
        totalFee: t('seriesTotalFee'),
        indoorElec: t('seriesIndoorElec'),
        acElec: t('seriesAcElec'),
        todayCombo: t('seriesTodayCombo'),
        peakElec: t('seriesPeakElec'),
        topElec: t('seriesTopElec'),
        flatElec: t('seriesFlatElec'),
        valleyElec: t('seriesValleyElec'),
        todayShort: t('todayShort')
      }
    },
    currentPickerOptions () {
      const t = (k) => this.$t(`electricityReport.${k}`)
      const shortcuts = [
        {
          text: t('pickerYesterday'),
          onClick (picker) {
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24)
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setTime(end.getTime() - 3600 * 1000 * 24)
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerThisWeek'),
          onClick (picker) {
            const now = new Date()
            const dayOfWeek = now.getDay()
            const start = new Date(now)
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
            start.setDate(now.getDate() + diff)
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerLastWeek'),
          onClick (picker) {
            const now = new Date()
            const dayOfWeek = now.getDay()
            const start = new Date(now)
            const diff = dayOfWeek === 0 ? -13 : -6 - dayOfWeek
            start.setDate(now.getDate() + diff)
            start.setHours(0, 0, 0, 0)
            const end = new Date(start)
            end.setDate(start.getDate() + 6)
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerThisMonth'),
          onClick (picker) {
            const start = new Date()
            start.setDate(1)
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerLastMonth'),
          onClick (picker) {
            const start = new Date()
            start.setMonth(start.getMonth() - 1)
            start.setDate(1)
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setDate(0)
            end.setHours(23, 59, 59, 999)
            picker.$emit('pick', [start, end])
          }
        },
        {
          text: t('pickerLast3Months'),
          onClick (picker) {
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            const start = new Date()
            start.setMonth(start.getMonth() - 3)
            start.setHours(0, 0, 0, 0)
            picker.$emit('pick', [start, end])
          }
        }
      ]

      // 如果不是日统计模式（即租户明细模式，允许查一年），添加“近一年”选项
      if (this.reportType !== 'statistics') {
        shortcuts.push({
          text: t('pickerLastYear'),
          onClick (picker) {
            const end = new Date()
            end.setHours(23, 59, 59, 999)
            const start = new Date()
            start.setFullYear(start.getFullYear() - 1)
            start.setHours(0, 0, 0, 0)
            picker.$emit('pick', [start, end])
          }
        })
      }

      return {
        shortcuts,
        disabledDate: this.pickerOptions.disabledDate
      }
    }
  },
  watch: {
    currentManagerId: {
      handler (val) {
        if (val) {
          this.initializeData()
        }
      },
      immediate: true
    },
    '$route' (to) {
      if (!to.path.includes('electricity-report')) return
      if (!this.currentManagerId) return
      const routeManagerId = to.query ? to.query.managerId : null
      const managerChanged = routeManagerId != null &&
        routeManagerId !== '' &&
        String(routeManagerId) !== String(this.currentManagerId)
      if (managerChanged) {
        // 固定名称的新窗口会复用同一个报表实例；先切管理方，
        // 后续由 currentManagerId watcher 按新路由完整初始化。
        this.applyManagerFromRoute(to)
        return
      }
      this.initializeData()
    }
  },
  mounted () {
    window.addEventListener('resize', this.handleResize)
    this.$nextTick(() => {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.handleResize)
        const mainContent = this.$el.querySelector('.main-content')
        if (mainContent) {
          this.resizeObserver.observe(mainContent)
        }
      }
    })
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.mainChartInstance) {
      this.mainChartInstance.dispose()
    }
    if (this.monitorChartInstance) {
      this.monitorChartInstance.dispose()
    }
  },
  methods: {
    tenantOptionLabel (tenant) {
      if (!tenant || tenant.tenantId === '') return this.$t('electricityReport.tenantAll')
      return this.$displayBizHybrid(tenant.name)
    },

    toggleSeriesByKey (key) {
      const name = this.chartSeriesNames[key]
      if (name) this.toggleSeries(name)
    },

    isSummaryMeterName (name) {
      if (name == null) return false
      const s = String(name)
      return s === '总计' || s === this.$t('electricityReport.summaryTotal')
    },

    async initializeData () {
      this.applyManagerFromRoute(this.$route)
      const applied = this.applyDateRangeFromRoute(this.$route)
      if (!applied) {
        this.setDefaultDateRange()
      }
      this.queryParams.tenantType = this.getTenantTypeFromRoute(this.$route)
      await this.getTenantList()
      this.queryParams.tenantId = ''
      this.clearDetailTenants()
      if (this.reportType === 'statistics') {
        this.handleSearch()
      }
    },

    /**
     * 大屏下钻时按 managerId 恢复管理方；普通菜单进入没有该参数，行为不变。
     */
    applyManagerFromRoute (route) {
      const managerId = route && route.query ? route.query.managerId : null
      if (managerId == null || managerId === '') return false
      const list = this.$store.state.manager.managerList || []
      const manager = list.find(item => String(item.managerId) === String(managerId))
      if (!manager) return false
      this.$store.commit('manager/SET_CURRENT_MANAGER_ID', manager.managerId)
      this.$store.commit('manager/SET_CURRENT_MANAGER', manager)
      return true
    },

    getTenantTypeFromRoute (route) {
      const value = route && route.query ? route.query.tenantType : null
      if (value === 0 || value === '0') return 0
      if (value === 1 || value === '1') return 1
      if (value === 2 || value === '2') return 2
      if (value === 3 || value === '3') return 3
      return 0
    },

    /**
     * 从路由带入统计区间（如大屏跳转：?startDate=&endDate=）
     * 与 TrendChart 一致：近七天含「今日」→ [今日-7天, 今日]，动态按当天计算
     */
    applyDateRangeFromRoute (route) {
      if (!route || !route.query) return false
      if (this.reportType !== 'statistics' && !(this.reportType === 'detail' && this.dateType === 'day')) {
        return false
      }
      const q = route.query
      const start = q.startDate || q.start
      const end = q.endDate || q.end
      if (!start || !end) return false
      const ms = moment(start, 'YYYY-MM-DD', true)
      const me = moment(end, 'YYYY-MM-DD', true)
      if (!ms.isValid() || !me.isValid()) return false
      if (ms.isAfter(me)) return false
      const next = [start, end]
      if (
        this.queryParams.dateRange &&
        this.queryParams.dateRange.length === 2 &&
        this.queryParams.dateRange[0] === next[0] &&
        this.queryParams.dateRange[1] === next[1]
      ) {
        return true
      }
      this.queryParams.dateRange = next
      return true
    },

    setDefaultDateRange () {
      if (this.reportType === 'statistics' || this.dateType === 'day') {
        this.queryParams.dateRange = [
          moment().subtract(30, 'days').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ]
      } else {
        this.queryParams.dateRange = [
          moment().subtract(1, 'months').format('YYYY-MM'),
          moment().format('YYYY-MM')
        ]
      }
    },

    async getTenantList () {
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0,
          tenantType: this.getTenantListTenantType()
        })
        this.tenantList = [
          { tenantId: '', name: this.$t('electricityReport.tenantAll') },
          ...(data || [])
        ]
      } catch (error) {
        this.$apiError.notify(error, this.$t('electricityReport.msgTenantListFail'))
        console.error('获取租户列表失败:', error)
      } finally {
        this.tenantLoading = false
      }
    },

    handleDateRangeChange (val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        if (this.reportType === 'statistics' || this.dateType === 'day') {
          const [start, end] = val
          const startDate = new Date(start)
          const endDate = new Date(end)
          const diffDays = Math.floor((endDate - startDate) / (24 * 3600 * 1000))

          // 租户用电统计模式(Tab 1)下限制100天
          // 租户用电明细模式(Tab 2)下限制1年(366天)
          const limitDays = this.reportType === 'statistics' ? 100 : 366
          const limitSpan = this.reportType === 'statistics'
            ? this.$t('electricityReport.dateSpan100Days')
            : this.$t('electricityReport.dateSpan1Year')

          if (diffDays > limitDays) {
            this.$message.warning(this.$t('electricityReport.msgDateRangeLimit', { span: limitSpan }))
            const newEndDate = new Date(startDate.getTime() + limitDays * 24 * 3600 * 1000)
            this.queryParams.dateRange = [
              start,
              moment(newEndDate).format('YYYY-MM-DD')
            ]
            this.handleSearch()
            return
          }
        }
        this.handleSearch()
      }
    },

    openFullscreen () {
      this.fullscreenVisible = true
    },

    closeFullscreen () {
      this.fullscreenVisible = false
    },

    handleFullscreenSwitchChange (value) {
      this.switchDeviceDetail = value
      this.handleSwitchChange()
    },

    switchReportType (type) {
      if (this.reportType === type) return
      this.reportType = type

      if (type === 'statistics') {
        this.dateType = 'day'
        // 切回日统计须使用 yyyy-MM-dd；保留明细下的月份值会导致日期框空白
        const range = this.queryParams.dateRange
        const isDayFormat =
          range &&
          range.length === 2 &&
          /^\d{4}-\d{2}-\d{2}$/.test(range[0]) &&
          /^\d{4}-\d{2}-\d{2}$/.test(range[1])
        if (!isDayFormat) {
          this.setDefaultDateRange()
        } else {
          const diffDays = Math.floor(
            (new Date(range[1]) - new Date(range[0])) / (24 * 3600 * 1000)
          )
          if (diffDays > 100) {
            this.setDefaultDateRange()
          }
        }
      }

      this.switchDeviceDetail = false
      this.detailSwitchDeviceDetail = false

      this.tableData = []
      this.chartData = []
      this.deviceDetailData = []
      this.tenantDetailData = []
      this.tenantDeviceDetailTableData = []

      if (type === 'detail') {
        this.initDetailTenantQueryMode()
        this.handleSearch()
        return
      }
      this.handleSearch()
    },

    switchDateType (type) {
      if (this.dateType === type) return
      this.dateType = type
      this.setDefaultDateRange()

      this.tenantDetailData = []
      this.tenantDeviceDetailTableData = []

      this.handleSearch()
    },

    toggleSeries (seriesName) {
      if (this.mainChartInstance) {
        this.mainChartInstance.dispatchAction({
          type: 'legendToggleSelect',
          name: seriesName
        })
      }
    },

    async handleSearch () {
      if (
        !this.queryParams.dateRange ||
        this.queryParams.dateRange.length !== 2
      ) {
        this.$message.warning(this.$t('electricityReport.msgPickPeriod'))
        return
      }
      if (this.reportType === 'statistics') {
        if (this.switchDeviceDetail && !this.queryParams.tenantId) {
          this.$message.warning(this.$t('electricityReport.msgDeviceNeedTenant'))
          return
        }
      } else {
        const tenantIdList = this.buildDetailTenantIdList()
        const canQueryWithoutTenantIds =
          this.isDetailQueryByTenantTypeOnly() && this.queryParams.tenantIds.length === 0
        if (tenantIdList.length === 0 && !canQueryWithoutTenantIds) {
          this.$message.warning(this.$t('electricityReport.msgPickTenant'))
          return
        }
      }
      this.loading = true
      try {
        if (this.reportType === 'statistics') {
          const [todayVirtualRow, statisticsData] = await Promise.all([
            this.fetchTodayVirtualData(),
            this.getStatisticsData()
          ])
          this.applyStatisticsSnapshot(statisticsData, todayVirtualRow)
          if (this.switchDeviceDetail) {
            await this.getDeviceDetailData()
          }
        } else {
          this.todayVirtualRow = null
          if (this.detailSwitchDeviceDetail) {
            await this.getTenantDeviceDetailData()
          } else {
            await this.getTenantDetailData()
          }
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('electricityReport.msgFetchFail'))
        console.error('获取数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    async getStatisticsData () {
      const startDate = this.queryParams.dateRange[0]
      const endDate = this.queryParams.dateRange[1]
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: 1,
        selectType: this.switchDeviceDetail ? 0 : 2
      }
      this.appendStatisticsTenantParams(params)
      const { data } = await useReportQueryTenantUseStatis(params)
      return data || []
    },

    /**
     * 历史统计和今日实时数据都返回后，再一次性更新视图。
     * 避免统计区间总电量先显示半套数据、随后再跳变。
     */
    applyStatisticsSnapshot (statisticsData, todayVirtualRow) {
      const originalData = statisticsData || []
      this.todayVirtualRow = todayVirtualRow

      // 图表数据: 保持正序(时间从早到晚,用于图表展示)
      this.chartData = [...originalData].sort((a, b) => {
        return new Date(a.occurDate) - new Date(b.occurDate)
      })

      // 表格数据: 倒序(最新日期在前,用于表格展示)
      this.tableData = [...originalData].sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate)
      })

      this.$nextTick(() => {
        this.initializeMainChart()
        this.initializeMonitorChart()
        this.updateCharts()
      })
    },

    async fetchTodayVirtualData () {
      if (!this.currentManagerId) return null
      if (!this.queryParams.dateRange || this.queryParams.dateRange.length !== 2) return null
      const today = moment().format('YYYY-MM-DD')
      const start = moment(this.queryParams.dateRange[0], 'YYYY-MM-DD')
      const end = moment(this.queryParams.dateRange[1], 'YYYY-MM-DD')
      const todayMoment = moment(today, 'YYYY-MM-DD')
      // 统计区间不包含今天时，不展示“今日”数据
      if (!start.isValid() || !end.isValid() || todayMoment.isBefore(start, 'day') || todayMoment.isAfter(end, 'day')) {
        return null
      }
      try {
        const params = { managerId: this.currentManagerId }
        if (this.queryParams.tenantId) {
          params.tenantId = this.queryParams.tenantId
        } else if (this.hasTenantTypeFilter()) {
          params.tenantType = this.queryParams.tenantType
        }
        const res = await queryCwTenantTodayUse(params)
        const dto = res && res.code === 200 ? (res.data || null) : null
        if (!dto) return null
        const useAmount = Number(dto.useAmount)
        const useElec = Number(dto.useElec)
        return {
          occurDate: today,
          useAmount: Number.isFinite(useAmount) ? Number(useAmount.toFixed(2)) : 0,
          meterBalance: 0,
          airBalance: 0,
          useElec: Number.isFinite(useElec) ? Number(useElec.toFixed(2)) : 0,
          meterUseElec: 0,
          airUseElec: 0,
          sysElec: dto.sysElec != null && dto.sysElec !== '' ? Number(Number(dto.sysElec).toFixed(2)) : 0,
          airSysElec: dto.airSysElec != null && dto.airSysElec !== '' ? Number(Number(dto.airSysElec).toFixed(2)) : 0,
          useElecPeak: Number(dto.useElecPeak) || 0,
          useElecTop: Number(dto.useElecTop) || 0,
          useElecFlat: Number(dto.useElecFlat) || 0,
          useElecValley: Number(dto.useElecValley) || 0,
          isVirtualToday: true
        }
      } catch (error) {
        return null
      }
    },

    async getDeviceDetailData () {
      const startDate = this.queryParams.dateRange[0]
      const endDate = this.queryParams.dateRange[1]
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: 1,
        selectType: 0
      }
      this.appendStatisticsTenantParams(params)
      const { data } = await useReportQueryTenantUseStatis(params)

      // 先对原始数据按日期倒序排序
      const sortedData = (data || []).sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate)
      })

      const detailArray = []
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
              sysElec: item.sysElec,
              airSysElec: item.airSysElec,
              useElecPeak: item.useElecPeak,
              useElecTop: item.useElecTop,
              useElecFlat: item.useElecFlat,
              useElecValley: item.useElecValley
            }
            item.deviceUseDtoList.forEach((device, idx) => {
              detailArray.push({
                ...baseObj,
                col: idx === 0 ? item.deviceUseDtoList.length : 0,
                deviceUseDtoList: device
              })
            })
          } else {
            detailArray.push({
              occurDate: item.occurDate,
              useAmount: item.useAmount,
              meterBalance: item.meterBalance,
              airBalance: item.airBalance,
              useElec: item.useElec,
              meterUseElec: item.meterUseElec,
              airUseElec: item.airUseElec,
              sysElec: item.sysElec,
              airSysElec: item.airSysElec,
              useElecPeak: item.useElecPeak,
              useElecTop: item.useElecTop,
              useElecFlat: item.useElecFlat,
              useElecValley: item.useElecValley,
              col: 1,
              deviceUseDtoList: {}
            })
          }
        })
      }
      this.deviceDetailData = detailArray
    },

    async getTenantDetailData () {
      let startDate = this.queryParams.dateRange[0]
      let endDate = this.queryParams.dateRange[1]
      if (this.dateType === 'month' && startDate.length === 7) {
        startDate = startDate + '-01'
        endDate = endDate + '-01'
      }
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 1,
        useType: this.dateType === 'day' ? 1 : 2,
        isMeterDetail: false
      }
      this.appendDetailTenantParams(params)
      const { data } = await queryTenantUse(params)
      this.tenantDetailData = data || []
    },

    async getTenantDeviceDetailData () {
      let startDate = this.queryParams.dateRange[0]
      let endDate = this.queryParams.dateRange[1]
      if (this.dateType === 'month' && startDate.length === 7) {
        startDate = startDate + '-01'
        endDate = endDate + '-01'
      }
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 1,
        useType: this.dateType === 'day' ? 1 : 2,
        isMeterDetail: true
      }
      this.appendDetailTenantParams(params)
      const { data } = await queryTenantUse(params)
      const tableDataType = []
      if (data && data.length > 0) {
        data.forEach((item) => {
          if (item.meterUseDetail && item.meterUseDetail.length) {
            item.meterUseDetail.forEach((meter, idx) => {
              if (!this.isSummaryMeterName(meter.name)) {
                const tip = idx === 0 ? item.meterUseDetail.length - 1 : 0
                tableDataType.push({
                  ...item,
                  ...meter,
                  meterName: meter.name,
                  tip
                })
              }
            })
          } else {
            tableDataType.push({
              ...item,
              meterName: '-',
              tip: 1
            })
          }
        })
      }
      this.tenantDeviceDetailTableData = tableDataType
    },

    /** 租户类型、租户选择二选一：有 tenantType 时不传 tenantIdList，选了租户时不传 tenantType */
    hasTenantTypeFilter () {
      const t = this.queryParams.tenantType
      return t === 0 || t === 1 || t === 2 || t === 3
    },

    getTenantListTenantType () {
      return this.hasTenantTypeFilter() ? this.queryParams.tenantType : 0
    },

    clearTenantType () {
      this.queryParams.tenantType = null
    },

    resetTenantTypeDefault () {
      this.queryParams.tenantType = 0
    },

    appendStatisticsTenantParams (params) {
      if (this.queryParams.tenantId) {
        params.tenantIdList = [this.queryParams.tenantId]
      } else if (this.hasTenantTypeFilter()) {
        params.tenantType = this.queryParams.tenantType
      }
    },

    isDetailQueryByTenantTypeOnly () {
      return this.queryParams.tenantIds.length === 0 && this.hasTenantTypeFilter()
    },

    buildDetailTenantIdList () {
      if (this.queryParams.tenantIds.length > 0) {
        return [...this.queryParams.tenantIds]
      }
      return []
    },

    appendDetailTenantParams (params) {
      const tenantIdList = this.buildDetailTenantIdList()
      if (tenantIdList.length > 0) {
        params.tenantIdList = tenantIdList
      } else if (this.hasTenantTypeFilter()) {
        params.tenantType = this.queryParams.tenantType
      }
    },

    initDetailTenantQueryMode () {
      this.clearDetailTenants()
      if (!this.hasTenantTypeFilter()) {
        this.resetTenantTypeDefault()
      }
    },

    selectAllDetailTenants () {
      this.queryParams.tenantIds = this.realTenantList.map(item => item.tenantId)
    },

    clearDetailTenants () {
      this.queryParams.tenantIds = []
    },

    clearDetailTableData () {
      this.tenantDetailData = []
      this.tenantDeviceDetailTableData = []
    },

    handleTenantChange (tenantId) {
      if (tenantId) {
        this.clearTenantType()
      } else {
        this.resetTenantTypeDefault()
      }
      this.handleSearch()
    },

    handleDetailTenantChange (val) {
      if (!Array.isArray(val)) return
      if (val.includes(TENANT_SELECT_CLEAR_ALL)) {
        this.clearDetailTenants()
        this.resetTenantTypeDefault()
        this.clearDetailTableData()
        return
      }
      if (val.includes(TENANT_SELECT_SELECT_ALL)) {
        this.selectAllDetailTenants()
        this.clearTenantType()
        this.handleSearch()
        return
      }
      this.queryParams.tenantIds = val.filter(
        (id) => id !== TENANT_SELECT_CLEAR_ALL && id !== TENANT_SELECT_SELECT_ALL
      )
      this.clearTenantType()
      this.handleSearch()
    },

    async handleTenantTypeChange () {
      this.queryParams.tenantId = ''
      this.clearDetailTenants()
      await this.getTenantList()
      this.handleSearch()
    },

    async handleReset () {
      if (this.$route.query && Object.keys(this.$route.query).length) {
        this.$router.replace({ path: this.$route.path, query: {} })
      }
      this.setDefaultDateRange()
      this.switchDeviceDetail = false
      this.detailSwitchDeviceDetail = false
      this.queryParams.tenantType = 0
      this.queryParams.tenantId = ''
      await this.getTenantList()
      if (this.reportType === 'detail') {
        this.initDetailTenantQueryMode()
        this.handleSearch()
      } else {
        this.clearDetailTenants()
        this.handleSearch()
      }
    },

    // ==================== 导出功能 ====================

    formatExportNumber (num) {
      if (num === undefined || num === null || num === '' || num === '-') {
        return 0
      }

      const numValue = typeof num === 'string' ? parseFloat(num) : num

      if (isNaN(numValue)) {
        return 0
      }

      return numValue
    },

    handleExport () {
      if (this.reportType === 'statistics') {
        if (!this.switchDeviceDetail && (!this.tableData || this.tableData.length === 0)) {
          this.$message.warning(this.$t('electricityReport.msgExportEmpty'))
          return
        }
        if (this.switchDeviceDetail && (!this.deviceDetailData || this.deviceDetailData.length === 0)) {
          this.$message.warning(this.$t('electricityReport.msgExportEmptyDevice'))
          return
        }
      } else {
        if (!this.detailSwitchDeviceDetail && (!this.tenantDetailData || this.tenantDetailData.length === 0)) {
          this.$message.warning(this.$t('electricityReport.msgExportEmpty'))
          return
        }
        if (this.detailSwitchDeviceDetail && (!this.tenantDeviceDetailTableData || this.tenantDeviceDetailTableData.length === 0)) {
          this.$message.warning(this.$t('electricityReport.msgExportEmptyDevice'))
          return
        }
      }

      this.exportLoading = true

      setTimeout(() => {
        try {
          if (this.reportType === 'statistics') {
            if (this.switchDeviceDetail) {
              this.exportStatisticsDeviceDetail()
            } else {
              this.exportStatisticsNormal()
            }
          } else {
            if (this.detailSwitchDeviceDetail) {
              this.exportDetailDeviceDetail()
            } else {
              this.exportDetailNormal()
            }
          }

          this.$message.success(this.$t('electricityReport.msgExportOk'))
        } catch (error) {
          console.error('导出失败:', error)
          this.$message.error(
            `${this.$t('electricityReport.msgExportFail')}: ${error.message || this.$t('electricityReport.msgExportRetry')}`
          )
        } finally {
          this.exportLoading = false
        }
      }, 100)
    },

    exportStatisticsNormal () {
      const t = (k) => this.$t(`electricityReport.${k}`)
      const tenant = this.tenantList.find(t => t.tenantId === this.queryParams.tenantId)
      const tenantName = tenant ? this.$displayBizHybrid(tenant.name) : this.queryParams.tenantId

      const filterRow = [
        this.$t('electricityReport.expFilterTime', { start: this.queryParams.dateRange[0], end: this.queryParams.dateRange[1] }),
        this.$t('electricityReport.expFilterTenant', { tenant: tenantName })
      ]

      const headers = [
        t('expColDate'),
        t('expColTotalFee'),
        t('expColIndoorFee'),
        t('expColAcFee'),
        t('expColTotalKwh'),
        ...(this.airSysElecColsVisible ? [t('expColSysTotalKwh')] : []),
        t('expColIndoorKwh'),
        t('expColAcKwh'),
        ...(this.airSysElecColsVisible ? [t('expColAirSysKwh')] : []),
        t('expColPeakKwh'),
        t('expColTopKwh'),
        t('expColFlatKwh'),
        t('expColValleyKwh')
      ]

      const dataRows = this.tableData.map(row => {
        const lead = [
          row.occurDate || '',
          this.formatExportNumber(row.useAmount),
          this.formatExportNumber(row.meterBalance),
          this.formatExportNumber(row.airBalance),
          this.formatExportNumber(row.useElec)
        ]
        if (this.airSysElecColsVisible) {
          lead.push(this.formatExportNumber(row.sysElec))
        }
        lead.push(
          this.formatExportNumber(row.meterUseElec),
          this.formatExportNumber(row.airUseElec)
        )
        if (this.airSysElecColsVisible) {
          lead.push(this.formatExportNumber(row.airSysElec))
        }
        lead.push(
          this.formatExportNumber(row.useElecPeak),
          this.formatExportNumber(row.useElecTop),
          this.formatExportNumber(row.useElecFlat),
          this.formatExportNumber(row.useElecValley)
        )
        return lead
      })

      const totalRow = [
        this.$t('electricityReport.summaryTotal'),
        this.formatExportNumber(this.totalStats.amount),
        this.formatExportNumber(this.totalStats.meterBalance),
        this.formatExportNumber(this.totalStats.airBalance),
        this.formatExportNumber(this.totalStats.elec),
        ...(this.airSysElecColsVisible ? [this.formatExportNumber(this.totalStats.sysElec)] : []),
        this.formatExportNumber(this.totalStats.meterUseElec),
        this.formatExportNumber(this.totalStats.airUseElec),
        ...(this.airSysElecColsVisible ? [this.formatExportNumber(this.totalStats.airSysElec)] : []),
        this.formatExportNumber(this.totalStats.elecPeak),
        this.formatExportNumber(this.totalStats.elecTop),
        this.formatExportNumber(this.totalStats.elecFlat),
        this.formatExportNumber(this.totalStats.elecValley)
      ]

      const wsData = [
        filterRow,
        [],
        headers,
        ...dataRows,
        totalRow
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      const colCount = 11 + (this.airSysElecColsVisible ? 2 : 0)
      ws['!cols'] = Array.from({ length: colCount }, () => ({ wch: 15 }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('electricityReport.expSheetStat'))

      const fileName = this.generateFileName(this.$t('electricityReport.expSheetStat'))
      XLSX.writeFile(wb, fileName)
    },

    exportStatisticsDeviceDetail () {
      const t = (k) => this.$t(`electricityReport.${k}`)
      const ext = this.airSysElecColsVisible ? 2 : 0
      const LEAD = 11 + ext
      const LAST_COL = 30 + ext
      const tailPad = () => [...Array(8).fill(''), ...Array(6).fill(''), ...Array(6).fill('')]

      const tenant = this.tenantList.find(t => t.tenantId === this.queryParams.tenantId)
      const tenantName = tenant ? this.$displayBizHybrid(tenant.name) : this.queryParams.tenantId

      const filterRow = [
        this.$t('electricityReport.expFilterTime', { start: this.queryParams.dateRange[0], end: this.queryParams.dateRange[1] }) +
          '  |  ' + this.$t('electricityReport.expFilterTenant', { tenant: tenantName }) +
          '  |  ' + this.$t('electricityReport.expFilterDeviceDetail')
      ]

      const leadHeaders = [
        t('expColDate'), t('expColTotalFee'), t('expColIndoorFee'), t('expColAcFee'), t('expColTotalKwh'),
        ...(ext ? [t('expColSysTotalKwh')] : []),
        t('expColIndoorKwh'), t('expColAcKwh'),
        ...(ext ? [t('expColAirSysKwh')] : []),
        t('expColPeakKwh'), t('expColTopKwh'), t('expColFlatKwh'), t('expColValleyKwh')
      ]

      const header1 = [
        ...leadHeaders,
        t('expColDevice'), t('expColSettleWay'), t('expColFee'),
        t('expColElec'), '', '', '', '',
        t('colStartReading'), '', '', '', '', '',
        t('colEndReading'), '', '', '', '', ''
      ]

      const header2 = [
        ...Array(LEAD).fill(''),
        '', '', '',
        t('colGrandTotal'), t('colSpikeShort'), t('colPeakShort'), t('colFlatShort'), t('colValleyShort'),
        t('colTime'), t('colTotalElecShort'), t('colSpikeShort'), t('colPeakShort'), t('colFlatShort'), t('colValleyShort'),
        t('colTime'), t('colTotalElecShort'), t('colSpikeShort'), t('colPeakShort'), t('colFlatShort'), t('colValleyShort')
      ]

      if (!this.deviceDetailData || this.deviceDetailData.length === 0) {
        throw new Error(this.$t('electricityReport.errNoDeviceExport'))
      }

      const dateGroups = {}
      this.deviceDetailData.forEach(row => {
        const date = row.occurDate
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
              sysElec: row.sysElec,
              airSysElec: row.airSysElec,
              useElecPeak: row.useElecPeak,
              useElecTop: row.useElecTop,
              useElecFlat: row.useElecFlat,
              useElecValley: row.useElecValley
            },
            devices: []
          }
        }
        if (row.deviceUseDtoList && Object.keys(row.deviceUseDtoList).length > 0) {
          dateGroups[date].devices.push(row.deviceUseDtoList)
        }
      })

      const summaryStatCells = (s) => {
        const cells = [
          this.formatExportNumber(s.useAmount),
          this.formatExportNumber(s.meterBalance),
          this.formatExportNumber(s.airBalance),
          this.formatExportNumber(s.useElec)
        ]
        if (ext) cells.push(this.formatExportNumber(s.sysElec))
        cells.push(
          this.formatExportNumber(s.meterUseElec),
          this.formatExportNumber(s.airUseElec)
        )
        if (ext) cells.push(this.formatExportNumber(s.airSysElec))
        cells.push(
          this.formatExportNumber(s.useElecPeak),
          this.formatExportNumber(s.useElecTop),
          this.formatExportNumber(s.useElecFlat),
          this.formatExportNumber(s.useElecValley)
        )
        return cells
      }

      const dataRows = []
      Object.keys(dateGroups).sort().forEach(date => {
        const group = dateGroups[date]
        const deviceCount = group.devices.length

        if (deviceCount === 0) {
          dataRows.push([
            group.summary.occurDate,
            ...summaryStatCells(group.summary),
            ...tailPad()
          ])
        } else {
          group.devices.forEach((device, idx) => {
            const startDto = device.startUseDto || {}
            const stopDto = device.stopUseDto || {}

            if (idx === 0) {
              dataRows.push([
                group.summary.occurDate,
                ...summaryStatCells(group.summary),
                this.$displayBizHybrid(device.meterName || ''),
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
                this.formatExportNumber(stopDto.powerValley)
              ])
            } else {
              dataRows.push([
                ...Array(LEAD).fill(''),
                this.$displayBizHybrid(device.meterName || ''),
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
                this.formatExportNumber(stopDto.powerValley)
              ])
            }
          })
        }
      })

      const totalRow = [
        this.$t('electricityReport.summaryTotal'),
        ...summaryStatCells({
          useAmount: this.totalStats.amount,
          meterBalance: this.totalStats.meterBalance,
          airBalance: this.totalStats.airBalance,
          useElec: this.totalStats.elec,
          meterUseElec: this.totalStats.meterUseElec,
          airUseElec: this.totalStats.airUseElec,
          sysElec: this.totalStats.sysElec,
          airSysElec: this.totalStats.airSysElec,
          useElecPeak: this.totalStats.elecPeak,
          useElecTop: this.totalStats.elecTop,
          useElecFlat: this.totalStats.elecFlat,
          useElecValley: this.totalStats.elecValley
        })
      ]
      while (totalRow.length < LAST_COL + 1) {
        totalRow.push('')
      }

      const wsData = [
        filterRow,
        [],
        header1,
        header2,
        ...dataRows,
        totalRow
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      const leadColWidths = Array.from({ length: LEAD }, (_, i) => ({ wch: i === 0 ? 15 : 12 }))
      ws['!cols'] = [
        ...leadColWidths,
        { wch: 18 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
      ]

      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: LAST_COL } }
      ]
      for (let c = 0; c <= LEAD + 2; c++) {
        merges.push({ s: { r: 2, c }, e: { r: 3, c } })
      }
      const elecStart = LEAD + 3
      merges.push(
        { s: { r: 2, c: elecStart }, e: { r: 2, c: elecStart + 4 } },
        { s: { r: 2, c: elecStart + 5 }, e: { r: 2, c: elecStart + 10 } },
        { s: { r: 2, c: elecStart + 11 }, e: { r: 2, c: elecStart + 16 } }
      )

      let currentRow = 4
      Object.keys(dateGroups).sort().forEach(date => {
        const group = dateGroups[date]
        const deviceCount = group.devices.length

        if (deviceCount > 1) {
          for (let col = 0; col < LEAD; col++) {
            merges.push({
              s: { r: currentRow, c: col },
              e: { r: currentRow + deviceCount - 1, c: col }
            })
          }
        }

        currentRow += deviceCount > 0 ? deviceCount : 1
      })

      ws['!merges'] = merges

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('electricityReport.expSheetStatDevice'))

      const fileName = this.generateFileName(this.$t('electricityReport.expSheetStatDevice'))
      XLSX.writeFile(wb, fileName)
    },

    exportDetailNormal () {
      const t = (k) => this.$t(`electricityReport.${k}`)
      const sep = this.$t('electricityReport.listSep')
      const selectedTenants = this.tenantList
        .filter(t => this.queryParams.tenantIds.includes(t.tenantId))
        .map(t => this.$displayBizHybrid(t.name))
        .join(sep)

      const statLabel = this.dateType === 'day' ? this.$t('electricityReport.statTypeDay') : this.$t('electricityReport.statTypeMonth')

      const filterRow = [
        this.$t('electricityReport.expFilterTime', { start: this.queryParams.dateRange[0], end: this.queryParams.dateRange[1] }),
        this.$t('electricityReport.expFilterTenant', { tenant: selectedTenants || this.$t('electricityReport.tenantAll') }),
        this.$t('electricityReport.expFilterStatType', { type: statLabel })
      ]

      const headers = [
        t('expColTenantId'),
        t('expColTenantName'),
        t('expColRegion'),
        t('colElecFee'),
        t('colElecKwh'),
        t('colPeakElec'),
        t('colTopElec'),
        t('colFlatElec'),
        t('colValleyElec')
      ]

      const dataRows = this.tenantDetailData.map(row => [
        row.tenantId !== -1 ? row.tenantId : this.$t('electricityReport.summaryTotal'),
        this.$displayBizHybrid(row.tenantName) || '',
        row.labelNames && row.labelNames.length ? row.labelNames[0] : '',
        this.formatExportNumber(row.useAmount),
        this.formatExportNumber(row.useElec),
        this.formatExportNumber(row.useElecPeak),
        this.formatExportNumber(row.useElecTop),
        this.formatExportNumber(row.useElecFlat),
        this.formatExportNumber(row.useElecValley)
      ])

      const wsData = [
        filterRow,
        [],
        headers,
        ...dataRows
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      ws['!cols'] = [
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('electricityReport.expSheetDetail'))

      const fileName = this.generateFileName(this.$t('electricityReport.expSheetDetail'))
      XLSX.writeFile(wb, fileName)
    },

    exportDetailDeviceDetail () {
      const t = (k) => this.$t(`electricityReport.${k}`)
      const sep = this.$t('electricityReport.listSep')
      const selectedTenants = this.tenantList
        .filter(t => this.queryParams.tenantIds.includes(t.tenantId))
        .map(t => this.$displayBizHybrid(t.name))
        .join(sep)

      const statLabel = this.dateType === 'day' ? this.$t('electricityReport.statTypeDay') : this.$t('electricityReport.statTypeMonth')

      const filterRow = [
        this.$t('electricityReport.expFilterTime', { start: this.queryParams.dateRange[0], end: this.queryParams.dateRange[1] }) +
          '  |  ' + this.$t('electricityReport.expFilterTenant', { tenant: selectedTenants || this.$t('electricityReport.tenantAll') }) +
          '  |  ' + this.$t('electricityReport.expFilterStatType', { type: statLabel }) +
          '  |  ' + this.$t('electricityReport.expFilterDeviceDetail')
      ]

      const header1 = [
        t('expColTenantId'), t('expColTenantName'), t('expColMeter'),
        t('colDetail'), '', '', '', '', '',
        t('colStatistics'), '', '', '', '', ''
      ]

      const header2 = [
        '', '', '',
        t('colElecFee'), t('colElecKwh'), t('colPeakElecShort'), t('colTopElecShort'), t('colFlatElecShort'), t('colValleyElecShort'),
        t('colElecFee'), t('colElecKwh'), t('colPeakElecShort'), t('colTopElecShort'), t('colFlatElecShort'), t('colValleyElecShort')
      ]

      if (!this.tenantDeviceDetailTableData || this.tenantDeviceDetailTableData.length === 0) {
        throw new Error(this.$t('electricityReport.errNoTenantMeterExport'))
      }

      // 按租户分组
      const tenantGroups = {}
      this.tenantDeviceDetailTableData.forEach(row => {
        if (row.tenantId === -1) return // 跳过总计行

        const key = row.tenantId
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
          }
        }

        // 收集电表数据（明细列）
        tenantGroups[key].meters.push({
          meterName: row.meterName,
          elecAmt: row.elecAmt,
          elecUse: row.elecUse,
          elecUsePeak: row.elecUsePeak,
          elecUseTop: row.elecUseTop,
          elecUseFlat: row.elecUseFlat,
          elecUseValley: row.elecUseValley
        })
      })

      const dataRows = []

      // 生成数据行
      Object.keys(tenantGroups).sort((a, b) => a - b).forEach(tenantId => {
        const group = tenantGroups[tenantId]

        group.meters.forEach((meter, idx) => {
          if (idx === 0) {
            // 第一行：显示租户信息 + 电表明细 + 租户统计
            dataRows.push([
              group.tenantId,
              this.$displayBizHybrid(group.tenantName) || '',
              this.$displayBizHybrid(meter.meterName) || '',
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
              this.formatExportNumber(group.totalUseElecValley)
            ])
          } else {
            // 后续行：只显示电表明细
            dataRows.push([
              '', '', // 租户编号和名称已合并
              this.$displayBizHybrid(meter.meterName) || '',
              // 明细：单个电表数据
              this.formatExportNumber(meter.elecAmt),
              this.formatExportNumber(meter.elecUse),
              this.formatExportNumber(meter.elecUsePeak),
              this.formatExportNumber(meter.elecUseTop),
              this.formatExportNumber(meter.elecUseFlat),
              this.formatExportNumber(meter.elecUseValley),
              // 统计：空（已合并）
              '', '', '', '', '', ''
            ])
          }
        })
      })

      // 添加总计行
      const totalRow = this.tenantDeviceDetailTableData.find(row => row.tenantId === -1)
      if (totalRow) {
        dataRows.push([
          this.$t('electricityReport.summaryTotal'),
          '',
          '',
          '', '', '', '', '', '', // 明细列留空
          this.formatExportNumber(totalRow.useAmount),
          this.formatExportNumber(totalRow.useElec),
          this.formatExportNumber(totalRow.useElecPeak),
          this.formatExportNumber(totalRow.useElecTop),
          this.formatExportNumber(totalRow.useElecFlat),
          this.formatExportNumber(totalRow.useElecValley)
        ])
      }

      const wsData = [
        filterRow,
        [],
        header1,
        header2,
        ...dataRows
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      ws['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 18 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
      ]

      // 合并单元格
      const merges = [
        // 筛选条件行
        { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
        // 表头第一行
        { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } }, // 租户编号
        { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } }, // 租户名称
        { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } }, // 电表
        { s: { r: 2, c: 3 }, e: { r: 2, c: 8 } }, // 明细
        { s: { r: 2, c: 9 }, e: { r: 2, c: 14 } } // 统计
      ]

      // 合并数据行中的租户信息和统计列
      let currentRow = 4
      Object.keys(tenantGroups).sort((a, b) => a - b).forEach(tenantId => {
        const group = tenantGroups[tenantId]
        const meterCount = group.meters.length

        if (meterCount > 1) {
          // 合并租户编号和名称
          merges.push(
            { s: { r: currentRow, c: 0 }, e: { r: currentRow + meterCount - 1, c: 0 } },
            { s: { r: currentRow, c: 1 }, e: { r: currentRow + meterCount - 1, c: 1 } }
          )
          // 合并统计列
          for (let col = 9; col <= 14; col++) {
            merges.push({
              s: { r: currentRow, c: col },
              e: { r: currentRow + meterCount - 1, c: col }
            })
          }
        }

        currentRow += meterCount
      })

      ws['!merges'] = merges

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('electricityReport.expSheetDetailDevice'))

      const fileName = this.generateFileName(this.$t('electricityReport.expSheetDetailDevice'))
      XLSX.writeFile(wb, fileName)
    },

    generateFileName (prefix) {
      const now = new Date()
      const timeStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')

      return `${prefix}_${timeStr}.xlsx`
    },

    // ==================== 其他方法 ====================

    handleSwitchChange () {
      if (this.switchDeviceDetail && !this.queryParams.tenantId) {
        if (this.realTenantList.length > 0) {
          this.queryParams.tenantId = this.realTenantList[0].tenantId
          this.clearTenantType()
          this.$message.info(this.$t('electricityReport.msgDeviceAutoTenant'))
        } else {
          this.$message.warning(this.$t('electricityReport.msgNoTenantAvailable'))
          this.switchDeviceDetail = false
          return
        }
      }
      this.handleSearch()
    },

    handleDetailSwitchChange () {
      this.handleSearch()
    },

    tableRowClassName ({ row }) {
      if (row.tenantId === -1) {
        return 'total-row'
      }
      return ''
    },
    statisticsRowClassName ({ row }) {
      if (row && row.isVirtualToday) {
        return 'today-virtual-row'
      }
      return ''
    },

    deviceDetailSpanMethod ({ row, columnIndex }) {
      const leadCols = this.airSysElecColsVisible ? 13 : 11
      if (columnIndex < leadCols) {
        return {
          rowspan: row.col,
          colspan: row.col > 0 ? 1 : 0
        }
      }
    },

    objectSpanMethod ({ row, columnIndex }) {
      if (columnIndex < 2) {
        return {
          rowspan: row.tip,
          colspan: row.tip > 0 ? 1 : 0
        }
      }
    },

    getStatisticsSummaries (param) {
      const { columns, data } = param
      const calcData = (data || []).filter(item => !item.isVirtualToday)
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = this.$t('electricityReport.summaryTotal')
          return
        }
        const values = calcData.map((item) => Number(item[column.property]))
        if (!values.every((value) => isNaN(value))) {
          sums[index] = values
            .reduce((prev, curr) => {
              const value = Number(curr)
              if (!isNaN(value)) {
                return prev + curr
              }
              return prev
            }, 0)
            .toFixed(2)
        } else {
          sums[index] = ''
        }
      })
      return sums
    },

    getDeviceDetailSummaries (param) {
      const { columns, data } = param
      const sums = []
      const uniqueData = []
      const dateSet = []
      data.forEach((item) => {
        if (item.isVirtualToday) return
        if (dateSet.indexOf(item.occurDate) === -1) {
          uniqueData.push(item)
          dateSet.push(item.occurDate)
        }
      })
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = this.$t('electricityReport.summaryTotal')
          return
        }
        const values = uniqueData.map((item) => Number(item[column.property]))
        if (!values.every((value) => isNaN(value))) {
          sums[index] = values
            .reduce((prev, curr) => {
              const value = Number(curr)
              if (!isNaN(value)) {
                return prev + curr
              }
              return prev
            }, 0)
            .toFixed(2)
        } else {
          sums[index] = ''
        }
      })
      return sums
    },

    initializeMainChart () {
      if (!this.$refs.mainChartContainer) return
      if (this.mainChartInstance) {
        this.mainChartInstance.dispose()
      }
      this.mainChartInstance = this.$echarts.init(
        this.$refs.mainChartContainer
      )
    },

    initializeMonitorChart () {
      if (!this.$refs.monitorChartContainer) return
      if (this.monitorChartInstance) {
        this.monitorChartInstance.dispose()
      }
      this.monitorChartInstance = this.$echarts.init(
        this.$refs.monitorChartContainer
      )
    },

    updateCharts () {
      this.updateMainChart()
      this.updateMonitorChart()
    },

    updateMainChart () {
      if (!this.mainChartInstance || this.displayChartData.length === 0) return
      const SN = this.chartSeriesNames
      const sufYuan = ' ' + this.$t('electricityReport.unitYuan')
      const sufKwh = ' ' + this.$t('electricityReport.unitKwhDisplay')
      const xAxisData = this.displayChartData.map((item) =>
        (item.isVirtualToday ? SN.todayShort : moment(item.occurDate).format('MM-DD'))
      )
      const todayFeeLineData = this.displayChartData.map((item) => (item.isVirtualToday ? null : item.useAmount))
      const meterBarData = this.displayChartData.map((item) => (item.isVirtualToday ? null : item.meterUseElec))
      const airBarData = this.displayChartData.map((item) => (item.isVirtualToday ? null : item.airUseElec))
      const todayElecBarData = this.displayChartData.map((item) => (item.isVirtualToday ? Number(item.useElec) || 0 : null))
      const todayFeeData = this.displayChartData.map((item) => (item.isVirtualToday ? Number(item.useAmount) || 0 : null))
      const option = {
        color: ['#52c41a', '#5b9bd5', '#ff9f5a', '#6366f1'],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e8e8e8',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: { color: '#333', fontSize: 14 },
          axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
          formatter: (params) => {
            if (!params || !params.length) return ''
            const first = params[0]
            const dataIndex = first.dataIndex
            const axisName = first.axisValue !== undefined && first.axisValue !== null ? first.axisValue : first.name
            const isToday =
              axisName === SN.todayShort ||
              (dataIndex != null && this.displayChartData[dataIndex] && this.displayChartData[dataIndex].isVirtualToday)
            if (isToday && dataIndex != null) {
              const elec = todayElecBarData[dataIndex]
              const fee = todayFeeData[dataIndex]
              if (Number.isFinite(Number(elec))) {
                const elecN = Number(elec)
                const feeN = Number(fee)
                const h = axisName || SN.todayShort
                return `<div style="font-weight:600;margin-bottom:8px">${h}</div>
                <div style="display:flex;align-items:center;margin-bottom:4px">
                  <span style="display:inline-block;width:10px;height:10px;background:#6366F1;border-radius:50%;margin-right:8px"></span>
                  <span style="color:#475569;">${this.$t('electricityReport.tooltipElecLabel')}</span>
                  <span style="font-weight:600;margin-left:6px">${elecN.toFixed(1)} kWh</span>
                </div>
                <div style="display:flex;align-items:center;">
                  <span style="display:inline-block;width:10px;height:10px;background:#6366F1;border-radius:50%;margin-right:8px"></span>
                  <span style="color:#94A3B8;">${this.$t('electricityReport.tooltipFeeLabel')}</span>
                  <span style="font-weight:600;margin-left:6px">${Number.isFinite(feeN) ? feeN.toFixed(2) : '--'}${sufYuan}</span>
                </div>`
              }
            }
            let html = `<div style="font-weight: 500; margin-bottom: 8px">${params[0].name}</div>`
            params.forEach((item) => {
              if (item.seriesName === SN.todayCombo) return
              let suffix = ''
              if (item.seriesName === SN.totalFee) {
                suffix = sufYuan
              } else {
                suffix = sufKwh
              }
              html += `<div style="display: flex; align-items: center; margin-bottom: 4px">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${item.color
                }; border-radius: 50%; margin-right: 8px"></span>
                <span style="flex: 1">${item.seriesName}</span>
                <span style="font-weight: 500">${this.formatNumber(
                  item.value
                )}${suffix}</span>
              </div>`
            })
            return html
          }
        },
        legend: {
          data: [SN.totalFee, SN.indoorElec, SN.acElec],
          bottom: 35,
          itemGap: 20,
          textStyle: { color: '#666' }
        },
        grid: { top: 30, left: 50, right: 50, bottom: 75, containLabel: true },
        dataZoom: [
          { type: 'inside', start: 0, end: 100 }, // ← 改为 0-100
          {
            type: 'slider',
            start: 0, // ← 改为 0
            end: 100,
            height: 6,
            bottom: 5,
            borderColor: 'transparent',
            backgroundColor: '#f0f0f0',
            handleSize: 12,
            showDetail: false,
            showDataShadow: false,
            fillerColor: 'rgba(24, 144, 255, 0.15)'
          }
        ],
        xAxis: {
          type: 'category',
          data: xAxisData,
          boundaryGap: true,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          axisLabel: { color: '#666', fontSize: 12 }
        },
        yAxis: [
          {
            type: 'value',
            name: this.$t('electricityReport.yAxisFee'),
            nameTextStyle: { color: '#666', padding: [0, 0, 0, 20] },
            splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              color: '#666',
              fontSize: 12,
              formatter: (v) => (v >= 1000 ? v / 1000 + 'k' : v)
            }
          },
          {
            type: 'value',
            name: this.$t('electricityReport.yAxisElec'),
            nameTextStyle: { color: '#666', padding: [0, 20, 0, 0] },
            splitLine: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              color: '#666',
              fontSize: 12,
              formatter: (v) => (v >= 1000 ? v / 1000 + 'k' : v)
            }
          }
        ],
        series: [
          {
            name: SN.totalFee,
            type: 'line',
            data: todayFeeLineData,
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.3,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                  { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
                ]
              }
            }
          },
          {
            name: SN.indoorElec,
            type: 'bar',
            yAxisIndex: 1,
            data: meterBarData,
            stack: 'usage',
            barMaxWidth: 18,
            itemStyle: {
              color: 'rgba(135, 206, 235, 0.65)',
              borderRadius: [2, 2, 0, 0]
            }
          },
          {
            name: SN.acElec,
            type: 'bar',
            yAxisIndex: 1,
            data: airBarData,
            stack: 'usage',
            barMaxWidth: 18,
            itemStyle: {
              color: 'rgba(255, 160, 122, 0.65)',
              borderRadius: [2, 2, 0, 0]
            }
          },
          {
            name: SN.todayCombo,
            type: 'bar',
            yAxisIndex: 1,
            data: todayElecBarData,
            // 与其他电量柱同栈，避免类目横向偏移导致“今日”错位
            stack: 'usage',
            barMaxWidth: 18,
            z: 12,
            itemStyle: {
              color: 'rgba(99, 102, 241, 0.35)',
              borderColor: 'rgba(99, 102, 241, 0.75)',
              borderWidth: 1,
              borderRadius: [3, 3, 0, 0]
            },
            label: {
              show: true,
              position: 'top',
              color: '#4f46e5',
              fontSize: 12,
              lineHeight: 18,
              formatter: (params) => {
                const idx = params.dataIndex
                const elec = todayElecBarData[idx]
                const fee = todayFeeData[idx]
                if (!Number.isFinite(Number(elec))) return ''
                return `${Number(elec).toFixed(1)} kWh\n¥${Number.isFinite(Number(fee)) ? Number(fee).toFixed(2) : '--'}`
              }
            }
          }
        ]
      }
      this.mainChartInstance.setOption(option)
    },

    updateMonitorChart () {
      if (!this.monitorChartInstance || this.displayChartData.length === 0) return
      const SN = this.chartSeriesNames
      const sufKwh = ' ' + this.$t('electricityReport.unitKwhDisplay')
      const xAxisData = this.displayChartData.map((item) =>
        moment(item.occurDate).format('MM-DD')
      )
      const option = {
        color: ['#ff6b6b', '#ff922b', '#51cf66', '#339af0'],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e8e8e8',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: { color: '#333', fontSize: 14 },
          formatter: (params) => {
            let html = `<div style="font-weight: 500; margin-bottom: 8px">${params[0].name}</div>`
            params.forEach((item) => {
              html += `<div style="display: flex; align-items: center; margin-bottom: 4px">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${item.color
                }; border-radius: 50%; margin-right: 8px"></span>
                <span style="flex: 1">${item.seriesName}</span>
                <span style="font-weight: 500">${this.formatNumber(
                  item.value
                )}${sufKwh}</span>
              </div>`
            })
            return html
          }
        },
        legend: { show: false },
        grid: { top: 15, left: 45, right: 15, bottom: 35, containLabel: true },
        dataZoom: [
          { type: 'inside', start: 70, end: 100 },
          {
            type: 'slider',
            start: 70,
            end: 100,
            height: 6,
            bottom: 5,
            borderColor: 'transparent',
            backgroundColor: '#f0f0f0',
            handleSize: 12,
            showDetail: false,
            showDataShadow: false,
            fillerColor: 'rgba(24, 144, 255, 0.15)'
          }
        ],
        xAxis: {
          type: 'category',
          data: xAxisData,
          boundaryGap: false,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          axisLabel: { color: '#666', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: '#666',
            fontSize: 11,
            formatter: (v) => (v >= 1000 ? v / 1000 + 'k' : v)
          }
        },
        series: [
          {
            name: SN.peakElec,
            type: 'line',
            data: this.displayChartData.map((item) => item.useElecPeak),
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
                  { offset: 1, color: 'rgba(255, 107, 107, 0.05)' }
                ]
              }
            }
          },
          {
            name: SN.topElec,
            type: 'line',
            data: this.displayChartData.map((item) => item.useElecTop),
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(255, 146, 43, 0.3)' },
                  { offset: 1, color: 'rgba(255, 146, 43, 0.05)' }
                ]
              }
            }
          },
          {
            name: SN.flatElec,
            type: 'line',
            data: this.displayChartData.map((item) => item.useElecFlat),
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(81, 207, 102, 0.3)' },
                  { offset: 1, color: 'rgba(81, 207, 102, 0.05)' }
                ]
              }
            }
          },
          {
            name: SN.valleyElec,
            type: 'line',
            data: this.displayChartData.map((item) => item.useElecValley),
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.6,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(51, 154, 240, 0.3)' },
                  { offset: 1, color: 'rgba(51, 154, 240, 0.05)' }
                ]
              }
            }
          }
        ]
      }
      this.monitorChartInstance.setOption(option)
    },

    handleResize () {
      this.$nextTick(() => {
        if (this.mainChartInstance) this.mainChartInstance.resize()
        if (this.monitorChartInstance) this.monitorChartInstance.resize()
      })
    },

    formatNumber (num) {
      if (num === undefined || num === null) return '-'
      if (num === 0) return '0.00'
      return Number(num).toFixed(2)
    },

    getSettleWayLabel (settleWay) {
      if (settleWay === undefined || settleWay === null) return ''
      const key = ['settleWay0', 'settleWay1', 'settleWay2', 'settleWay3', 'settleWay4', 'settleWay5'][settleWay]
      return key ? this.$t(`electricityReport.${key}`) : ''
    }
  }
}
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

  &.tenant-filter,
  &.tenant-type-filter {
    max-width: 360px;
  }
}

::v-deep .tenant-select-action-option {
  color: #409eff;
  font-weight: 500;

  &.tenant-select-action-option--clear {
    border-bottom: 1px solid #ebeef5;
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

// ==================== 统计卡片 - 双闭环展示 ====================
.stats-formula-cards {
  display: grid;
  grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.formula-card {
  min-width: 0;
  min-height: 286px;
  background: #ffffff;
  border: 1px solid #edf1f6;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.stats-formula-cards.is-history-only {
  .formula-card {
    min-height: 238px;
  }

  .card-content {
    min-height: 238px;
  }
}

.electricity-usage {
  padding: 18px 20px;
}

.usage-realtime-row,
.usage-period-row,
.usage-tou-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.usage-realtime-row {
  min-height: 66px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8edf3;
  gap: 18px;
}

.usage-heading {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 16px;
}

.usage-heading-label {
  color: #172033;
  font-size: 16px;
  font-weight: 650;
  white-space: nowrap;
}

.usage-heading-value {
  color: #ea580c;
  font-size: 23px;
  font-weight: 700;
  white-space: nowrap;

  small {
    font-size: 14px;
    font-weight: 600;
  }
}

.usage-period-row {
  min-height: 116px;
  padding: 16px 0;
  gap: 18px;
}

.period-total {
  flex: 0 1 31%;
  min-width: 220px;
}

.period-total-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #172033;
  font-size: 15px;
  font-weight: 650;
}

.period-total-value {
  margin-top: 10px;
  color: #16b96f;
  font-size: 27px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;

  small {
    font-size: 14px;
    font-weight: 600;
  }
}

.period-equation {
  display: grid;
  grid-template-columns: 28px minmax(142px, 1fr) 28px minmax(142px, 1fr);
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 10px;
}

.formula-operator {
  padding: 0;
  color: #687386;
  font-size: 25px;
  font-weight: 400;
  line-height: 1;
  text-align: center;
}

.formula-operator--plus {
  font-size: 24px;
}

.period-breakdown-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 82px;
  padding: 10px 12px;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
  background: #ffffff;

  span {
    color: #526074;
    font-size: 13px;
    white-space: nowrap;
  }

  strong {
    margin-top: 10px;
    color: #172033;
    font-size: 18px;
    font-weight: 650;
    white-space: nowrap;
  }

  small {
    font-size: 12px;
    font-weight: 500;
  }

  &--realtime strong {
    color: #ea580c;
  }
}

.usage-tou-row {
  min-height: 68px;
  padding-top: 16px;
  border-top: 1px solid #e8edf3;
  gap: 16px;
}

.usage-tou-title {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  color: #172033;
  font-size: 15px;
  font-weight: 650;
  white-space: nowrap;
}

.period-tou-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(104px, 1fr));
  flex: 1;
  min-width: 0;
  gap: 8px;
}

.period-tou-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 9px 10px;
  color: #344054;
  font-size: 13px;
  white-space: nowrap;
  border: 1px solid #e2e8f0;
  border-radius: 10px;

  strong {
    margin-left: 5px;
    color: #172033;
    font-weight: 600;
  }
}

.tou-dot {
  flex: 0 0 11px;
  width: 11px;
  height: 11px;
  margin-right: 7px;
  border-radius: 50%;

  &--peak {
    background: #f04438;
  }

  &--top {
    background: #f5a700;
  }

  &--flat {
    background: #2f80ed;
  }

  &--valley {
    background: #20b26b;
  }
}

.card-top-badge {
  margin: 18px 18px 0;
  padding: 11px 14px;
  color: #d94b12;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.45;
  letter-spacing: 0.01em;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  background: #fff8ef;
}

.card-content {
  display: flex;
  align-items: center;
  min-height: 206px;
  padding: 24px 18px;
  gap: 14px;
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
  min-width: 142px;
  min-height: 92px;
  padding: 16px 18px;
  gap: 8px;
  border-radius: 12px;
}

.electricity-cost {
  .main-indicator {
    background: linear-gradient(135deg, #4389f8 0%, #1f6eea 100%);
    box-shadow: 0 8px 18px rgba(47, 128, 237, 0.2);
  }

  .formula-cost-side-hint {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    margin-left: auto;
    padding: 8px 10px;
    gap: 5px;
    color: #2f6edb;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid #a9c7ff;
    border-radius: 8px;
    background: #f2f7ff;

    .el-icon-info {
      color: #2f80ed;
      font-size: 14px;
    }
  }
}

.main-value {
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
}

.main-label {
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.formula-sub-group {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 9px;
}

.sub-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1 1 112px;
  min-width: 105px;
  min-height: 72px;
  padding: 10px 8px;
  gap: 7px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}

.sub-value {
  max-width: 100%;
  color: #172033;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-label {
  color: #667085;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.operator-plus {
  flex-shrink: 0;
  padding: 0 1px;
  color: #687386;
  font-size: 20px;
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

.today-exclude-note {
  margin-left: auto;
  margin-right: 12px;
  font-size: 12px;
  color: #8c8c8c;
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

  &.el-date-editor--daterange {
    width: 100%;
  }

  .el-range-editor {
    width: 100%;
    box-sizing: border-box;
  }

  .el-range-input {
    flex: 1;
    min-width: 0;
    color: #303133;
  }

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

  .today-virtual-row {
    td {
      background: #fff7ed !important;
      color: #c2410c;
      font-weight: 600;
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
    min-width: 112px;
    padding: 12px 8px;
  }

  .sub-value {
    font-size: 18px;
  }

  .main-value {
    font-size: 26px;
  }

  .main-indicator {
    min-width: 152px;
  }

  .period-total-value {
    font-size: 29px;
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
    min-width: 92px;
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

  .usage-heading-value {
    font-size: 20px;
  }

  .period-tou-item {
    padding-right: 6px;
    padding-left: 6px;
    font-size: 12px;
  }

  .period-total {
    min-width: 200px;
  }

  .period-total-value {
    font-size: 24px;
  }

  .period-equation {
    grid-template-columns: 26px minmax(120px, 1fr) 26px minmax(120px, 1fr);
    gap: 7px;
  }

  .period-tou-list {
    grid-template-columns: repeat(4, minmax(92px, 1fr));
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

  .sub-indicator {
    min-width: 110px;
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
  .usage-period-row {
    flex-wrap: wrap;
  }

  .period-total {
    flex-basis: 100%;
  }

  .period-equation {
    grid-template-columns: 28px minmax(142px, 1fr) 28px minmax(142px, 1fr);
    width: 100%;
  }

  .usage-tou-row {
    align-items: stretch;
    flex-direction: column;
  }

  .sub-indicator {
    min-width: 92px;
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

  .electricity-usage {
    padding: 16px;
  }

  .period-tou-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .usage-period-row {
    justify-content: center;
  }

  .period-total {
    min-width: 100%;
  }

  .period-total-title {
    justify-content: center;
  }

  .period-total-value {
    margin-left: 0;
    text-align: center;
  }

  .period-breakdown-card {
    min-width: 120px;
  }

  .electricity-cost .card-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 20px 16px;
  }

  .electricity-cost .formula-operator {
    align-self: center;
    transform: rotate(90deg);
    padding: 8px 0;
  }

  .electricity-cost .formula-sub-group {
    justify-content: center !important;
    flex-wrap: wrap;
    gap: 8px;
  }

  .sub-indicator {
    min-width: 120px;
  }

  .main-indicator {
    align-self: center;
  }

  .electricity-cost .formula-cost-side-hint {
    margin-left: 0;
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
  .usage-heading {
    flex-wrap: wrap;
  }

  .usage-heading-value {
    width: 100%;
    margin-top: 6px;
  }

  .usage-period-row {
    gap: 9px;
  }

  .period-breakdown-card {
    min-width: 112px;
  }

  .period-equation {
    grid-template-columns: 1fr;
    gap: 9px;
  }

  .period-equation .formula-operator {
    font-size: 20px;
  }

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
    min-width: 110px;
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
