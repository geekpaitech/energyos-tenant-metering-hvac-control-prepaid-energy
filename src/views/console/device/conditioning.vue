<template>
  <div class="table-page-container">
    <!-- Tab 模块：手写顶栏（Element el-tabs 默认难做到「选中黑粗 + 短蓝条、无通栏底线」） -->
    <div class="tab-nav-box" role="tablist" :aria-label="$t('deviceConditioning.tabNavAria')">
      <div
        v-for="t in mainTabs"
        :key="t.name"
        role="tab"
        class="tab-nav-item"
        :class="{ 'is-active': activeTab === t.name }"
        :tabindex="activeTab === t.name ? 0 : -1"
        :aria-selected="activeTab === t.name ? 'true' : 'false'"
        @click="setMainTab(t.name)"
        @keydown.enter.prevent="setMainTab(t.name)"
        @keydown.space.prevent="setMainTab(t.name)"
      >
        {{ t.label }}
      </div>
    </div>

    <div v-show="activeTab === 'indoor'" class="tab-panel-wrap">
        <div class="indoor-tab-pane">
          <!-- 查询区 -->
          <div class="search-box">
            <el-form :model="queryData" ref="searchForm" class="search-form" @submit.native.prevent>
              <div class="search-main-grid">
                <div class="field-item">
                  <el-input
                    v-model="queryData.name"
                    :placeholder="$t('deviceConditioning.phDeviceName')"
                    clearable
                    size="small"
                    style="width: 100%"
                    prefix-icon="el-icon-search"
                    @clear="handleSearch"
                    @keyup.enter.native="handleSearch"
                  />
                </div>
                <div class="field-item">
                  <el-select
                    v-model="queryData.tenantId"
                    :placeholder="$t('deviceConditioning.phTenant')"
                    clearable
                    filterable
                    :loading="tenantLoading"
                    size="small"
                    style="width: 100%"
                    @change="handleSearch"
                  >
                    <el-option
                      v-for="item in tenantList"
                      :key="item.id"
                      :label="tenantOptionDisplayLabel(item)"
                      :value="item.id"
                    />
                  </el-select>
                </div>
                <div class="field-item">
                  <el-select
                    v-model="queryData.state"
                    :placeholder="$t('deviceConditioning.phOnlineStatus')"
                    clearable
                    size="small"
                    style="width: 100%"
                    @change="handleSearch"
                  >
                    <el-option :label="$t('deviceConditioning.online')" :value="0">
                      <span class="option-with-dot">
                        <span class="status-dot online"></span>{{ $t('deviceConditioning.online') }}
                      </span>
                    </el-option>
                    <el-option :label="$t('deviceConditioning.offline')" :value="1">
                      <span class="option-with-dot">
                        <span class="status-dot offline"></span>{{ $t('deviceConditioning.offline') }}
                      </span>
                    </el-option>
                  </el-select>
                </div>
                <div class="search-actions">
                  <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('deviceConditioning.btnSearch') }}</el-button>
                  <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('deviceConditioning.btnReset') }}</el-button>
                  <el-button type="success" size="small" icon="el-icon-download" @click="handleIndoorExport">{{ $t('deviceConditioning.btnExport') }}</el-button>
                </div>
              </div>
            </el-form>
          </div>

          <!-- 内容区 -->
          <div class="content-box">
            <div class="content-toolbar">
              <div class="toolbar-left">
                <span class="section-title">
                  <span class="title-bar" />
                  {{ viewMode === 'card' ? $t('deviceConditioning.sectionIndoorCard') : $t('deviceConditioning.sectionIndoorList') }}
                </span>
              </div>
              <div class="toolbar-right">
                <el-dropdown v-if="canControl" @command="handleBatchCommand" trigger="hover">
                  <el-button type="warning" size="small">
                    {{ $t('deviceConditioning.batchAction') }}<i class="el-icon-arrow-down el-icon--right" />
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="control">{{ $t('deviceConditioning.batchControl') }}</el-dropdown-item>
                    <el-dropdown-item command="lock">{{ $t('deviceConditioning.batchLock') }}</el-dropdown-item>
                    <el-dropdown-item command="unlock">{{ $t('deviceConditioning.batchUnlock') }}</el-dropdown-item>
                    <el-dropdown-item command="timing">{{ $t('deviceConditioning.batchTiming') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
                <el-button v-if="canView" type="primary" size="small" @click="handleViewTiming">
                  {{ $t('deviceConditioning.viewTimingTasks') }}
                </el-button>
                <el-select v-model="sortOrder" size="small" style="width: 100px">
                  <el-option :label="$t('deviceConditioning.sortDefault')" value="default" />
                </el-select>
                <div class="view-switch-group">
                  <el-radio-group v-model="viewMode" size="small">
                    <el-radio-button label="list">
                      <i class="el-icon-s-grid" /> {{ $t('deviceConditioning.viewList') }}
                    </el-radio-button>
                    <el-radio-button label="card">
                      <i class="el-icon-menu" /> {{ $t('deviceConditioning.viewCard') }}
                    </el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </div>

            <!-- 列表视图 -->
            <div v-if="viewMode === 'list'" class="list-view">
          <div class="table-card" shadow="never">
            <!-- 表格工具栏 -->
            <div class="table-toolbar" v-if="selectedData.length > 0">
              <div class="toolbar-left">
                <span class="selection-info">
                  <span class="selection-info">
                    <template v-if="$i18n.locale === 'zh-CN'">{{ $t('deviceConditioning.selPrefix') }}<span class="count">{{ selectedData.length }}</span>{{ $t('deviceConditioning.selSuffix') }}</template>
                    <template v-else>{{ $t('deviceConditioning.selectedCount', { count: selectedData.length }) }}</template>
                  </span>
                </span>
              </div>
            </div>

            <!-- 数据表格 -->
            <el-table v-loading="loading" border :data="tableData" :max-height="tableMaxHeight" stripe
              style="width: 100%" ref="multipleTable" row-key="id" class="custom-table light-border-table"
              @selection-change="handleSelectionChange" :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: '600',
              }">

              <el-table-column v-if="canControl" type="selection" width="55" align="center" />

              <!-- 按照tableKey配置显示列 -->
              <el-table-column v-for="col in displayColumns" :key="col.key" :prop="col.key" :label="col.label"
                :width="col.width" :min-width="col.minWidth" :align="col.isTag ? 'center' : 'left'"
                :header-align="col.isTag ? 'center' : 'left'" :show-overflow-tooltip="true">

                <template slot-scope="scope">
                  <!-- 设备序列号 -->
                  <!-- 设备序列号 - 点击复制 -->
                  <template v-if="col.key === 'indoorUnitId'">
                    <el-tooltip :content="$t('deviceConditioning.copySerialTip')" placement="top" :open-delay="300">
                      <span class="serial-copy" @click="handleCopySerial(scope.row.indoorUnitId)">
                        {{ scope.row.indoorUnitId || "-" }}
                      </span>
                    </el-tooltip>
                  </template>

                  <!-- 设备名称 - 点击查看详情 -->
                  <template v-else-if="col.key === 'name'">
                    <el-link v-if="canView" type="primary" @click="handleDetail(scope.row)">
                      {{ $displayDynamicName(scope.row.name, 44) || "-" }}
                    </el-link>
                    <span v-else>{{ $displayDynamicName(scope.row.name, 44) || "-" }}</span>
                  </template>

                  <!-- 设备类型 -->
                  <template v-else-if="col.key === 'typeLabel'">
                    <el-tag type="info" size="small" effect="plain">
                      {{ scope.row.typeLabel || "-" }}
                    </el-tag>
                  </template>

                  <!-- 公摊类型 -->
                  <template v-else-if="col.key === 'bindTypeLabel'">
                    <el-tag v-if="scope.row.bindType == 1" type="primary" size="small" effect="plain">
                      {{ $t('deviceConditioning.bindDedicated') }}
                    </el-tag>
                    <el-tag v-else-if="scope.row.bindType == 2" type="warning" size="small" effect="plain">
                      {{ $t('deviceConditioning.bindPublic') }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>

                  <!-- 项目信息 -->
                  <!-- <template v-else-if="col.key === 'managerData'">
                {{ scope.row.managerData || "-" }}
              </template> -->

                  <!-- 绑定信息 -->
                  <template v-else-if="col.key === 'bindData'">
                    <el-link v-if="canView && scope.row.bindId" type="primary" @click="handleBindClick(scope.row)">
                      <i class="el-icon-user"></i>
                      {{ scope.row.bindData }}
                    </el-link>
                    <span v-else-if="scope.row.bindId">{{ scope.row.bindData }}</span>
                    <span v-else class="text-muted">{{ $t('deviceConditioning.unbound') }}</span>
                  </template>

                  <!-- 空调外机系统名称 -->
                  <template v-else-if="col.key === 'gatewayName'">
                    {{ scope.row.gatewayName || "-" }}
                  </template>

                  <template v-else-if="col.key === 'powerStatusLabel'">
                    <div class="lock-field">
                      <span>{{ scope.row.powerStatusLabel || "-" }}</span>
                      <el-tooltip v-if="scope.row.lockPowerStatus" class="item" effect="dark"
                        :content="scope.row.lockPowerStatusLabel" placement="top">
                        <i class="el-icon-lock lock-icon"></i>
                      </el-tooltip>
                      <i v-else-if="needPowerLockPlaceholder" class="el-icon-lock lock-icon-placeholder"></i>
                    </div>
                  </template>

                  <!-- 模式 (带锁定图标) -->
                  <template v-else-if="col.key === 'operationModeLabel'">
                    <div class="lock-field">
                      <el-tag :type="getModeTagType(scope.row.operationMode)" size="small" effect="plain">
                        {{ scope.row.operationModeLabel || "-" }}
                      </el-tag>
                      <el-tooltip v-if="scope.row.lockOperationMode" class="item" effect="dark"
                        :content="scope.row.lockOperationModeLabel" placement="top">
                        <i class="el-icon-lock lock-icon"></i>
                      </el-tooltip>
                      <i v-else-if="needModeLockPlaceholder" class="el-icon-lock lock-icon-placeholder"></i>
                    </div>
                  </template>

                  <!-- 温度 (带锁定图标) -->
                  <template v-else-if="col.key === 'targetTemperature'">
                    <div class="lock-field">
                      <span class="temperature-text">
                        {{ scope.row.targetTemperature !== null ? scope.row.targetTemperature + '℃' : '-' }}
                      </span>
                      <el-tooltip v-if="scope.row.minTemperature || scope.row.maxTemperature" class="item" effect="dark"
                        :content="`${scope.row.minTemperature}-${scope.row.maxTemperature}℃`" placement="top">
                        <i class="el-icon-lock lock-icon"></i>
                      </el-tooltip>
                      <i v-else-if="needTempLockPlaceholder" class="el-icon-lock lock-icon-placeholder"></i>
                    </div>
                  </template>

                  <!-- 风速 (带锁定图标) -->
                  <template v-else-if="col.key === 'fanSpeedLabel'">
                    <div class="lock-field">
                      <span>{{ scope.row.fanSpeedLabel || "-" }}</span>
                      <el-tooltip v-if="scope.row.lockFanSpeed" class="item" effect="dark"
                        :content="scope.row.lockFanSpeedLabel" placement="top">
                        <i class="el-icon-lock lock-icon"></i>
                      </el-tooltip>
                      <i v-else-if="needFanLockPlaceholder" class="el-icon-lock lock-icon-placeholder"></i>
                    </div>
                  </template>

                  <!-- 设备数量 (电表数量) -->
                  <template v-else-if="col.key === 'serial'">
                    <el-popover v-if="scope.row.meterData && scope.row.meterData.length" placement="right" width="400"
                      trigger="hover">
                      <el-table :data="scope.row.meterData">
                        <el-table-column width="180" :label="$t('deviceConditioning.colSerialShort')" prop="serial" />
                        <el-table-column width="180" :label="$t('deviceConditioning.colId')" prop="id" />
                      </el-table>
                      <span slot="reference" class="device-count">
                        {{ scope.row.meterData.length }}
                      </span>
                    </el-popover>
                    <span v-else>0</span>
                  </template>

                  <!-- 故障状态 -->
                  <template v-else-if="col.key === 'faultStatus'">
                    <div class="status-wrapper">
                      <span :class="[
                        'status-dot',
                        (!scope.row.faultCode) ? 'online' : 'offline',
                      ]"></span>
                      <span>{{ scope.row.faultCode === 'LOST' ? $t('deviceConditioning.faultOffline') : (scope.row.faultCode || $t('deviceConditioning.faultNormal')) }}</span>
                    </div>
                  </template>

                  <!-- 在线状态 -->
                  <!-- <template v-else-if="col.key === 'stateStatus'">
                    <div class="status-wrapper">
                      <span :class="[
                        'status-dot',
                        scope.row.state == 0 ? 'online' : 'offline',
                      ]"></span>
                      <span>{{ scope.row.state == 0 ? "在线" : "离线" }}</span>
                    </div>
                  </template> -->

                  <!-- 上线时间 -->
                  <template v-else-if="col.key === 'createTime'">
                    <span>{{ scope.row.createTime || '-' }}</span>
                  </template>

                  <!-- 默认显示 -->
                  <template v-else>
                    {{ scope.row[col.key] || "-" }}
                  </template>
                </template>
              </el-table-column>

              <!-- 操作列 -->
              <el-table-column v-if="canControl || canView" :label="$t('deviceConditioning.colOp')" width="190" fixed="right" align="center" :resizable="false">
                <template slot="header">
                  <span>{{ $t('deviceConditioning.colOp') }}</span>
                </template>
                <template slot-scope="scope">
                  <div class="operation-cell">
                    <!-- 控制按钮 -->
                    <el-button v-if="canControl" type="text" size="mini" @click="handleControl(scope.row)" class="op-btn primary-btn">
                      {{ $t('deviceConditioning.control') }}
                    </el-button>

                    <!-- <span class="op-divider">|</span> -->

                    <!-- 锁定/解锁按钮 -->
                    <el-button v-if="canControl" type="text" size="mini"
                      @click="scope.row.isLock ? handleUnlock(scope.row) : handleLock(scope.row)" class="op-btn"
                      :class="scope.row.isLock ? 'success-btn' : 'danger-btn'">
                      {{ scope.row.isLock ? $t('deviceConditioning.unlock') : $t('deviceConditioning.lock') }}
                    </el-button>

                    <!-- <span class="op-divider">|</span> -->

                    <!-- 更多下拉菜单 -->
                    <el-dropdown v-if="canControl || canView" @command="(cmd) => handleMoreCommand(scope.row, cmd)" trigger="hover">
                      <el-button type="text" size="mini" class="op-btn primary-btn">
                        {{ $t('deviceConditioning.more') }}<i class="el-icon-arrow-down el-icon--right"></i>
                      </el-button>
                      <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item v-if="canControl" command="timing">{{ $t('deviceConditioning.opTiming') }}</el-dropdown-item>
                        <el-dropdown-item v-if="canControl" command="edit">{{ $t('deviceConditioning.opEdit') }}</el-dropdown-item>
                        <el-dropdown-item v-if="canView" command="detail">{{ $t('deviceConditioning.opDetail') }}</el-dropdown-item>
                        <el-dropdown-item v-if="canView" command="history">{{ $t('deviceConditioning.opHistory') }}</el-dropdown-item>
                      </el-dropdown-menu>
                    </el-dropdown>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container compact-pagination">
              <el-pagination :current-page="queryData.current" :page-sizes="[20, 30, 60, 100]"
                :page-size="queryData.pageSize" :total="queryData.total"
                layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                @current-change="handleCurrentChange" />
            </div>
          </div>
            </div>

            <!-- 卡片视图 -->
            <div v-else class="card-view">
          <div class="card-grid" v-loading="loading">
            <div v-for="item in tableData" :key="item.id" class="ac-design-card"
              :class="{ 'is-selected': isSelected(item), 'is-offline': item.state == 1 }">
              <div class="ac-body" :class="{ clickable: canView }" @click="handleCardHeaderClick(item)">
                <div class="ac-head">
                  <div class="ac-title-wrap">
                    <div v-if="canControl" class="card-checkbox inline" @click.stop>
                      <el-checkbox :value="isSelected(item)" @change="(val) => handleCardSelect(val, item)"></el-checkbox>
                    </div>
                    <div class="ac-title" :title="item.name">{{ $displayDynamicName(item.name, 200) || '--' }}</div>
                  </div>
                  <div class="ac-online">
                    <span class="ac-status-item">
                      <span class="ac-dot" :class="item.state == 0 ? 'online' : 'offline'"></span>
                      <span>{{ item.state == 0 ? $t('deviceConditioning.online') : $t('deviceConditioning.offline') }}</span>
                    </span>
                    <span v-if="!canControl && item.lockPowerStatus" class="ac-status-item lock-field" @click.stop>
                      <el-tooltip class="item" effect="dark" :content="item.lockPowerStatusLabel" placement="top">
                        <i class="el-icon-lock card-lock-icon"></i>
                      </el-tooltip>
                    </span>
                  </div>
                </div>

                <div class="ac-sub">{{ $t('deviceConditioning.cardSerialLabel') }}{{ item.indoorUnitId || '--' }}</div>

                <div class="ac-temp">
                  <div class="ac-temp-left">
                    <div class="ac-temp-val-row lock-field" @click.stop>
                      <span class="ac-temp-val">
                        {{ item.targetTemperature !== null ? item.targetTemperature : '--' }}<span class="ac-temp-unit">°C</span>
                      </span>
                      <el-tooltip
                        v-if="item.minTemperature || item.maxTemperature"
                        class="item"
                        effect="dark"
                        :content="`${item.minTemperature}-${item.maxTemperature}℃`"
                        placement="top"
                      >
                        <i class="el-icon-lock card-lock-icon"></i>
                      </el-tooltip>
                    </div>
                    <div class="ac-temp-label">{{ $t('deviceConditioning.setTemp') }}</div>
                  </div>
                  <div class="ac-temp-mid"></div>
                  <div class="ac-temp-right">
                    <div class="ac-temp-right-label">{{ $t('deviceConditioning.indoorTemp') }}</div>
                    <div class="ac-temp-right-val">
                      {{ item.roomTemperature !== null ? item.roomTemperature : '--' }}°C
                    </div>
                  </div>
                </div>

                <div class="ac-mode">
                  <i :class="getModeIcon(item.operationMode)" class="ac-mode-icon"></i>
                  <span class="ac-mode-group lock-field" @click.stop>
                    <span class="ac-mode-text">{{ getModeLabel(item.operationMode) }}</span>
                    <el-tooltip
                      v-if="item.lockOperationMode"
                      class="item"
                      effect="dark"
                      :content="item.lockOperationModeLabel"
                      placement="top"
                    >
                      <i class="el-icon-lock card-lock-icon"></i>
                    </el-tooltip>
                  </span>
                  <span class="ac-mode-dot">·</span>
                  <span class="ac-mode-group lock-field" @click.stop>
                    <span class="ac-mode-text">{{ getFanLabel(item.fanSpeed) }}</span>
                    <el-tooltip
                      v-if="item.lockFanSpeed"
                      class="item"
                      effect="dark"
                      :content="item.lockFanSpeedLabel"
                      placement="top"
                    >
                      <i class="el-icon-lock card-lock-icon"></i>
                    </el-tooltip>
                  </span>
                </div>

                <div v-if="canControl" class="ac-actions" @click.stop>
                  <div class="ac-action-cell">
                    <el-button class="ac-btn ac-btn-with-lock" size="mini" :class="{ active: item.powerStatus === 1 }"
                      :disabled="item.state === 1" @click.stop="handleCardControlDirect(item, 'power')">
                      <span>{{ $t('deviceConditioning.switchBtn') }}</span>
                      <el-tooltip
                        v-if="item.lockPowerStatus"
                        class="item"
                        effect="dark"
                        :content="item.lockPowerStatusLabel"
                        placement="top"
                      >
                        <i class="el-icon-lock card-lock-icon" @click.stop></i>
                      </el-tooltip>
                    </el-button>
                  </div>

                  <div class="ac-action-cell">
                    <el-dropdown trigger="hover" @command="(cmd) => handleCardControlDirect(item, 'mode', cmd)"
                      @click.native.stop :disabled="item.powerStatus === 0 || item.state === 1">
                      <el-button class="ac-btn" size="mini" :disabled="item.powerStatus === 0 || item.state === 1">{{ $t('deviceConditioning.modeBtn') }}</el-button>
                      <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item v-if="item.mfrsNo !== 'FY'" command="0">{{ $t('deviceConditioning.enumModeAuto') }}</el-dropdown-item>
                        <el-dropdown-item command="1">{{ $t('deviceConditioning.enumModeHeat') }}</el-dropdown-item>
                        <el-dropdown-item command="2">{{ $t('deviceConditioning.enumModeCool') }}</el-dropdown-item>
                        <el-dropdown-item command="4">{{ $t('deviceConditioning.enumModeFan') }}</el-dropdown-item>
                        <el-dropdown-item command="8">{{ $t('deviceConditioning.enumModeDry') }}</el-dropdown-item>
                      </el-dropdown-menu>
                    </el-dropdown>
                  </div>

                  <div class="ac-action-cell">
                    <el-dropdown trigger="hover" @command="(cmd) => handleCardControlDirect(item, 'fan', cmd)"
                      @click.native.stop :disabled="item.powerStatus === 0 || item.state === 1">
                      <el-button class="ac-btn" size="mini" :disabled="item.powerStatus === 0 || item.state === 1">{{ $t('deviceConditioning.fanBtn') }}</el-button>
                      <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item command="0">{{ $t('deviceConditioning.enumFanAuto') }}</el-dropdown-item>
                        <el-dropdown-item command="1">{{ $t('deviceConditioning.enumFanLow') }}</el-dropdown-item>
                        <el-dropdown-item command="2">{{ $t('deviceConditioning.enumFanMid') }}</el-dropdown-item>
                        <el-dropdown-item command="3">{{ $t('deviceConditioning.enumFanHigh') }}</el-dropdown-item>
                      </el-dropdown-menu>
                    </el-dropdown>
                  </div>

                  <div class="ac-action-cell">
                    <el-button class="ac-btn ac-btn-icon" size="mini" :disabled="item.powerStatus === 0 || item.state === 1"
                      @click.stop="handleCardControlDirect(item, 'temp', 1)">
                      <i class="el-icon-caret-top"></i>
                    </el-button>
                  </div>

                  <div class="ac-action-cell">
                    <el-button class="ac-btn ac-btn-icon" size="mini" :disabled="item.powerStatus === 0 || item.state === 1"
                      @click.stop="handleCardControlDirect(item, 'temp', -1)">
                      <i class="el-icon-caret-bottom"></i>
                    </el-button>
                  </div>

                  <div class="ac-action-cell">
                    <el-dropdown trigger="hover" @command="(cmd) => handleCardSetting(item, cmd)" @click.native.stop>
                      <el-button class="ac-btn" size="mini">{{ $t('deviceConditioning.more') }}</el-button>
                      <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item command="edit">{{ $t('deviceConditioning.opEdit') }}</el-dropdown-item>
                        <el-dropdown-item command="timing">{{ $t('deviceConditioning.opTiming') }}</el-dropdown-item>
                        <el-dropdown-item :command="item.isLock ? 'unlock' : 'lock'">
                          {{ item.isLock ? $t('deviceConditioning.unlock') : $t('deviceConditioning.lock') }}
                        </el-dropdown-item>
                        <el-dropdown-item command="history">{{ $t('deviceConditioning.opHistory') }}</el-dropdown-item>
                      </el-dropdown-menu>
                    </el-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div class="pagination-container compact-pagination">
            <el-pagination :current-page="queryData.current" :page-sizes="[12, 24, 36, 48]"
              :page-size="queryData.pageSize" :total="queryData.total" layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange" @current-change="handleCurrentChange" />
          </div>
            </div>
          </div>
        </div>
    </div>

    <div v-show="activeTab === 'outdoor'" class="tab-panel-wrap">
        <div class="outdoor-tab-pane">
          <div class="search-box outdoor-search-box">
            <el-form :model="outdoorQuery" size="small" class="search-form outdoor-search-form">
              <div class="outdoor-search-row">
                <el-form-item class="outdoor-search-field">
                  <el-select v-model="outdoorQuery.addr" :placeholder="$t('deviceConditioning.outdoorPhSystem')" filterable clearable style="width: 220px"
                    @change="handleOutdoorSearch">
                    <el-option v-for="item in outdoorSystemList" :key="item.addr" :label="item.name || item.addr"
                      :value="item.addr">
                      <span style="float: left">{{ item.name || $t('deviceConditioning.outdoorUnnamed') }}</span>
                      <span style="float: right; color: #8492a6; font-size: 13px">{{ item.addr }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <div class="outdoor-search-right">
                  <el-form-item>
                    <el-radio-group v-model="outdoorViewMode" size="small">
                      <el-radio-button label="list">
                        <i class="el-icon-s-grid"></i> {{ $t('deviceConditioning.viewList') }}
                      </el-radio-button>
                      <el-radio-button label="card">
                        <i class="el-icon-menu"></i> {{ $t('deviceConditioning.viewCard') }}
                      </el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item v-if="outdoorViewMode === 'list'">
                    <el-button v-if="canView" type="success" size="small" icon="el-icon-download" :loading="exportLoading"
                      @click="handleOutdoorExport">{{ $t('deviceConditioning.btnExport') }}</el-button>
                  </el-form-item>
                </div>
              </div>
            </el-form>
          </div>

          <div v-if="outdoorViewMode === 'list'" class="content-box outdoor-content-box">
        <div class="table-container">
          <div class="table-card" shadow="never">
            <el-table :data="outdoorTableData" v-loading="outdoorLoading" border style="width: 100%"
              class="custom-table light-border-table"
              :max-height="tableMaxHeight"
              :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }">
              <el-table-column prop="addr" :label="$t('deviceConditioning.colGwMac')" width="180" show-overflow-tooltip />
              <el-table-column prop="name" :label="$t('deviceConditioning.colOutdoorName')" width="180" show-overflow-tooltip />
              <el-table-column :label="$t('deviceConditioning.colTariffPlan')" width="180">
                <template slot-scope="scope">
                  <el-popover v-if="scope.row.priceDto" placement="top" width="360" trigger="hover">
                    <div class="price-detail-popover">
                      <div class="price-row">
                        <div class="price-item peak">
                          <span class="price-label">{{ $t('deviceConditioning.priceSharp') }}</span>
                          <span class="price-value">¥{{ scope.row.priceDto.powerPeakPrice || '-' }}</span>
                        </div>
                        <div class="price-item top">
                          <span class="price-label">{{ $t('deviceConditioning.pricePeak') }}</span>
                          <span class="price-value">¥{{ scope.row.priceDto.powerTopPrice || '-' }}</span>
                        </div>
                        <div class="price-item flat">
                          <span class="price-label">{{ $t('deviceConditioning.priceFlat') }}</span>
                          <span class="price-value">¥{{ scope.row.priceDto.powerFlatPrice || '-' }}</span>
                        </div>
                        <div class="price-item valley">
                          <span class="price-label">{{ $t('deviceConditioning.priceValley') }}</span>
                          <span class="price-value">¥{{ scope.row.priceDto.powerValleyPrice || '-' }}</span>
                        </div>
                      </div>
                    </div>
                    <span slot="reference" class="price-name-link">
                      {{ scope.row.priceDto.name }}
                      <i class="el-icon-warning-outline" style="margin-left: 4px; color: #000"></i>
                    </span>
                  </el-popover>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('deviceConditioning.colMeterDev')" min-width="80">
                <template slot-scope="scope">
                  <div v-if="scope.row.meterList && scope.row.meterList.length > 0">
                    {{scope.row.meterList.map(item => item.serial || item).join('，')}}
                  </div>
                  <div v-else-if="scope.row.serial">
                    {{ scope.row.serial }}
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('deviceConditioning.colIndoorUnits')" min-width="200">
                <template slot-scope="scope">
                  <div v-if="scope.row.airList && scope.row.airList.length"
                    style="white-space: normal; line-height: 1.5;">
                    {{scope.row.airList.map(item => item.name).join('，')}}
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('deviceConditioning.phOnlineStatus')" align="center" width="100">
                <template slot-scope="scope">
                  <div class="status-wrapper">
                    <span :class="['status-dot', scope.row.onlineStatus == 0 ? 'online' : 'offline']"></span>
                    <span>{{ scope.row.onlineStatus == 0 ? $t('deviceConditioning.online') : $t('deviceConditioning.offline') }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="canView || canControl" :label="$t('deviceConditioning.colOp')" width="240" fixed="right" align="center" :resizable="false">
                <template slot-scope="scope">
                  <div class="operation-cell">
                    <el-button v-if="canView" type="text" size="mini" class="op-btn primary-btn" @click="handleViewRelation(scope.row)">
                      {{ $t('deviceConditioning.view') }}
                    </el-button>
                    <el-button v-if="canControl" type="text" size="mini" class="op-btn primary-btn" @click="handleBindPrice(scope.row)">
                      {{ $t('deviceConditioning.bindElectricTariff') }}
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-container compact-pagination">
              <el-pagination :current-page="outdoorQuery.page.current"
                :page-sizes="[20, 30, 60, 100]"
                :page-size="outdoorQuery.page.size" :total="outdoorQuery.total"
                layout="total, sizes, prev, pager, next, jumper" @size-change="handleOutdoorSizeChange"
                @current-change="handleOutdoorCurrentChange" />
            </div>
          </div>
        </div>
          </div>
        <div v-if="outdoorViewMode === 'card'" class="content-box outdoor-content-box">
          <div class="table-container">
          <div class="table-card" shadow="never" v-loading="outdoorLoading">
            <air-condition-expand
              ref="outdoorExpand"
              :manager-name="(outdoorTableData[0] && outdoorTableData[0].managerName) ? outdoorTableData[0].managerName : $t('deviceConditioning.currentProject')"
              :data-list="outdoorTableData"
              :direction.sync="outdoorExpandDirection"
              :selected-id="outdoorExpandSelectedId"
              :max-visible-children="outdoorMaxVisibleChildren"
              :refresh-loading="outdoorLoading"
              @select="onOutdoorExpandSelect"
              @view-outdoor="handleOutdoorMeterDetail"
              @view-air="handleDetail"
              @more-children="onOutdoorExpandMoreChildren"
              @refresh="fetchOutdoorData"
            />
          </div>
          </div>
        </div>
        </div>
    </div>

    <!-- 电表详情（拓扑图点击外机节点） -->
    <meter-detail-drawer :visible.sync="meterDetailDrawer.visible" :meter-id="meterDetailDrawer.meterId"
      :serial="meterDetailDrawer.serial" />

    <!-- 关系图抽屉（外机列表「查看」） -->
    <el-drawer :title="$t('deviceConditioning.relationTitle')" :visible.sync="relationDialog.visible" direction="rtl" size="60%" :with-header="true"
      :destroy-on-close="true" @opened="initRelationChart">
      <div style="padding: 20px; height: 100%; overflow-y: auto;">
        <div ref="relationChart" style="width: 100%; height: 600px;"></div>
      </div>
    </el-drawer>

    <el-drawer :title="outdoorMoreDrawer.title" :visible.sync="outdoorMoreDrawer.visible" direction="rtl" size="420px"
      :with-header="true" :destroy-on-close="true">
      <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
        <el-input v-model="outdoorMoreDrawer.keyword" size="small" clearable prefix-icon="el-icon-search"
          :placeholder="$t('deviceConditioning.phSearchNameSerial')" />
        <div style="margin-top: 12px; overflow: auto; flex: 1;">
          <el-empty v-if="outdoorMoreFilteredList.length === 0" :description="$t('deviceConditioning.emptyNoData')" />
          <div v-else>
            <div v-for="item in outdoorMoreFilteredList" :key="item.id"
              :style="{ padding: '10px 12px', border: '1px solid #ebeef5', borderRadius: '10px', background: '#fff', marginBottom: '10px', cursor: 'pointer', userSelect: 'none' }"
              @click="handleOutdoorMorePick(item)">
              <div style="font-size: 13px; font-weight: 700; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ item.name || '-' }}
              </div>
              <div v-if="item.serial"
                style="margin-top: 6px; font-size: 12px; color: #909399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ item.serial }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 编辑弹窗 -->
    <el-dialog :title="$t('deviceConditioning.dialogEditDevice')" :visible.sync="editDialog.visible" width="600px" :close-on-click-modal="false"
      class="custom-dialog">
      <el-form ref="editForm" :model="editForm" :rules="editFormRules" label-width="120px">
        <el-form-item :label="$t('deviceConditioning.labelDeviceSerial')" prop="indoorUnitId">
          <el-input v-model="editForm.indoorUnitId" :placeholder="$t('deviceConditioning.phDeviceSerial')" disabled />
        </el-form-item>
        <el-form-item :label="$t('deviceConditioning.labelDeviceName')" prop="name">
          <el-input v-model="editForm.name" :placeholder="$t('deviceConditioning.phDeviceName')" />
        </el-form-item>
        <el-form-item :label="$t('deviceConditioning.labelDeviceType')" prop="type">
          <el-select v-model="editForm.type" :placeholder="$t('deviceConditioning.phSelectDeviceType')" style="width: 100%">
            <el-option v-for="item in enums.airDeviceType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('deviceConditioning.labelShareType')" prop="bindType">
          <el-select v-model="editForm.bindType" :placeholder="$t('deviceConditioning.phSelectShareType')" style="width: 100%">
            <el-option v-for="item in enums.airBindType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('deviceConditioning.labelRemark')" prop="remark">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" :placeholder="$t('deviceConditioning.phRemark')" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialog.visible = false">{{ $t('deviceConditioning.btnCancel') }}</el-button>
        <el-button v-if="canControl" type="primary" :loading="submitting" @click="handleEditSave">
          {{ submitting ? $t('deviceConditioning.saving') : $t('deviceConditioning.btnConfirm') }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 控制弹窗 -->
    <el-dialog title="控制" :visible.sync="controlDialog.visible" width="480px" :close-on-click-modal="false"
      custom-class="control-dialog-new">
      <div class="ac-remote-control">
        <!-- 设备编号 -->
        <!-- <div class="ac-device-number">
          <span class="number-circle">{{ controlDialog.isBatch ? selectedData.length : '1' }}</span>
          <i class="el-icon-remove-outline"></i>
        </div> -->

        <!-- 状态指示器 -->
        <div class="ac-status-indicators">
          <span class="status-text" style="margin-right: 10px;" v-if="controlDialog.row">{{ controlDialog.row.name }}</span>
          <span class="status-text">{{ controlDialog.row && controlDialog.row.state == 0 ? '在线' : '离线' }}</span>
        </div>

        <!-- 设备序列号 -->
        <div class="ac-device-serial">
          设备序列号：{{ controlDialog.row ? controlDialog.row.indoorUnitId : (controlDialog.isBatch ? '批量控制' : '-') }}
        </div>

        <!-- 温度显示区域 -->
        <div class="ac-temp-display">
          <div class="temp-section">
            <div class="temp-label">设置温度</div>
            <div class="temp-main">
              <span class="temp-value">{{ controlForm.targetTemperature }}</span>
              <span class="temp-unit">℃</span>
            </div>
          </div>

          <div class="room-temp-section">
            <div class="room-label">室内<br />温度</div>
            <div class="room-value">
              {{ controlDialog.row ? (controlDialog.row.roomTemperature || '--') : '--' }}℃
            </div>
          </div>

          <div class="mode-section">
            <div class="mode-item">
              <!-- <i :class="getModeIcon(controlForm.operationMode)" class="mode-icon"></i> -->
              <span class="mode-label">{{ getModeLabel(controlForm.operationMode) }}</span>
            </div>
            <div class="mode-item">
              <!-- <span class="fan-text-icon">F</span> -->
              <span class="mode-label">{{ getFanLabel(controlForm.fanSpeed) }}</span>
            </div>
          </div>
        </div>

        <!-- 控制按钮组 -->
        <div class="ac-control-buttons-fixed">
          <!-- 开关 -->
          <button class="control-btn-fixed power-btn" :class="{ active: controlForm.powerStatus === 1 }"
            @click="controlForm.powerStatus = controlForm.powerStatus === 1 ? 0 : 1">
            <i class="el-icon-video-play"></i>
          </button>

          <!-- 模式下拉 -->
          <el-dropdown trigger="hover" @command="(cmd) => controlForm.operationMode = cmd">
            <el-tooltip content="模式" placement="top" :open-delay="500">
              <button class="control-btn-fixed mode-btn">M</button>
            </el-tooltip>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-if="shouldShowAutoMode()" :command="0">自动</el-dropdown-item>
              <el-dropdown-item :command="1">制热</el-dropdown-item>
              <el-dropdown-item :command="2">制冷</el-dropdown-item>
              <el-dropdown-item :command="4">送风</el-dropdown-item>
              <el-dropdown-item :command="8">除湿</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>

          <!-- 风速下拉 -->
          <el-dropdown trigger="hover" @command="(cmd) => controlForm.fanSpeed = cmd">
            <el-tooltip content="风速" placement="top" :open-delay="500">
              <button class="control-btn-fixed fan-btn">F</button>
            </el-tooltip>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item :command="0">自动</el-dropdown-item>
              <el-dropdown-item :command="1">低风</el-dropdown-item>
              <el-dropdown-item :command="2">中风</el-dropdown-item>
              <el-dropdown-item :command="3">高风</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>

          <!-- 温度加 -->
          <el-tooltip content="升温" placement="top" :open-delay="500">
            <button class="control-btn-fixed temp-up-btn" @click="adjustTemperature(1)">
              <i class="el-icon-caret-top"></i>
            </button>
          </el-tooltip>

          <!-- 温度减 -->
          <el-tooltip content="降温" placement="top" :open-delay="500">
            <button class="control-btn-fixed temp-down-btn" @click="adjustTemperature(-1)">
              <i class="el-icon-caret-bottom"></i>
            </button>
          </el-tooltip>

          <!-- 设置占位 -->
          <button class="control-btn-fixed settings-btn" disabled>
            <i class="el-icon-setting"></i>
          </button>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="controlDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleControlSave">
          {{ submitting ? "执行中..." : "确 定" }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 锁定弹窗 -->
    <el-dialog :title="lockDialog.isBatch ? '批量锁定' : '空调锁定'" :visible.sync="lockDialog.visible" width="600px"
      :close-on-click-modal="false" class="custom-dialog">
      <div v-if="!lockDialog.isBatch && lockDialog.row" class="lock-device-info">
        <div class="device-name">{{ lockDialog.row.name }}</div>
        <div class="device-serial">设备序列号：{{ lockDialog.row.indoorUnitId }}</div>
      </div>
      <div v-else-if="lockDialog.isBatch" class="lock-device-info">
        批量锁定{{ selectedData.length }}台设备
      </div>

      <el-form ref="lockForm" :model="lockForm" label-width="120px" class="lock-form">
        <el-form-item label="锁定开关">
          <el-radio-group v-model="lockForm.lockPowerStatus">
            <el-radio :label="0">不锁定</el-radio>
            <el-radio :label="128">关机</el-radio>
            <el-radio :label="129">开机</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="锁定模式">
          <el-radio-group v-model="lockForm.lockOperationMode">
            <el-radio :label="0">不锁定</el-radio>
            <el-radio :label="128">自动</el-radio>
            <el-radio :label="129">制热</el-radio>
            <el-radio :label="130">制冷</el-radio>
            <el-radio :label="132">送风</el-radio>
            <el-radio :label="136">除湿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="锁定风速">
          <el-radio-group v-model="lockForm.lockFanSpeed">
            <el-radio :label="0">不锁定</el-radio>
            <el-radio :label="128">自动</el-radio>
            <el-radio :label="129">低风</el-radio>
            <el-radio :label="130">中风</el-radio>
            <el-radio :label="131">高风</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="温度范围">
          <div class="temperature-range">
            <el-input-number v-model="lockForm.minTemperature" :min="16" :max="31" placeholder="最低温度"
              controls-position="right" style="width: 48%" />
            <span style="margin: 0 2%;">~</span>
            <el-input-number v-model="lockForm.maxTemperature" :min="16" :max="31" placeholder="最高温度"
              controls-position="right" style="width: 48%" />
          </div>
          <div class="temp-hint">填写温度即锁定温度范围</div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="lockDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleLockSave">
          {{ submitting ? "执行中..." : "确 定" }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 定时任务设置弹窗 -->
    <el-dialog :title="timingDialog.isEdit ? '编辑定时任务' : (timingDialog.isBatch ? '批量定时' : '定时')"
      :visible.sync="timingDialog.visible" :width="timingDialog.isEdit ? '1000px' : '650px'"
      :close-on-click-modal="false" custom-class="timing-dialog-new">
      <el-row :gutter="20">
        <!-- 左侧：定时设置表单 -->
        <el-col :span="timingDialog.isEdit ? 10 : 24">
          <div class="timing-container">
            <!-- 设备编号 -->
            <div class="timing-device-number">
              <span class="number-text">
                {{ timingDialog.isBatch ? `批量${selectedData.length}台` : (timingDialog.isEdit ?
                  `${timingDevices.length}台` :
                  (timingDialog.row ? timingDialog.row.name : '')) }}
              </span>
            </div>

            <!-- 设备序列号 -->
            <div class="timing-device-serial" v-if="!timingDialog.isBatch && !timingDialog.isEdit">
              设备序列号：{{ timingDialog.row ? timingDialog.row.indoorUnitId : '-' }}
            </div>

            <!-- 控制类型切换 -->
            <div class="timing-control-type">
              <div class="type-label">重复方式</div>
              <div class="type-buttons-fixed">
                <button class="type-btn-fixed" :class="{ active: timingForm.repeatType === 1 }"
                  @click="handleRepeatTypeChange(1)">
                  周期重复
                </button>
                <button class="type-btn-fixed" :class="{ active: timingForm.repeatType === 2 }"
                  @click="handleRepeatTypeChange(2)">
                  单次执行
                </button>
              </div>
            </div>

            <!-- 周期选择 -->
            <div class="timing-week-select" v-if="timingForm.repeatType === 1">
              <div class="week-label">周期选择</div>
              <el-select v-model="timingForm.weekDays" multiple placeholder="请选择" style="width: 100%">
                <el-option label="周一" value="1"></el-option>
                <el-option label="周二" value="2"></el-option>
                <el-option label="周三" value="3"></el-option>
                <el-option label="周四" value="4"></el-option>
                <el-option label="周五" value="5"></el-option>
                <el-option label="周六" value="6"></el-option>
                <el-option label="周日" value="7"></el-option>
              </el-select>
            </div>

            <!-- 日期选择 -->
            <div class="timing-date-select" v-if="timingForm.repeatType === 2">
              <div class="date-label">日期选择</div>
              <el-date-picker v-model="timingForm.executeDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd"
                style="width: 100%" />
            </div>

            <!-- 时间选择 -->
            <div class="timing-time-select">
              <div class="time-label">时间</div>
              <el-time-select v-model="timingForm.executeTime" :picker-options="{
                start: '00:00',
                step: '00:15',
                end: '23:45'
              }" placeholder="选择时间" style="width: 100%" />
            </div>

            <!-- 任务类型选择 -->
            <div class="timing-task-type">
              <div class="task-type-label">控制类型</div>
              <div class="task-type-buttons-fixed">
                <button class="task-type-btn-fixed" :class="{ active: timingForm.taskType === 1 }"
                  @click="timingForm.taskType = 1">
                  控制
                </button>
                <button class="task-type-btn-fixed" :class="{ active: timingForm.taskType === 2 }"
                  @click="timingForm.taskType = 2">
                  锁定
                </button>
              </div>
            </div>

            <!-- 遥控器预览 -->
            <div class="timing-ac-preview">
              <div class="preview-status" v-if="timingForm.taskType === 1">
                <i class="el-icon-connection status-icon"></i>
                <span class="status-text">预览</span>
              </div>

              <div class="preview-temp-display" v-if="timingForm.taskType === 1">
                <div class="preview-temp-section">
                  <div class="preview-temp-label">设置温度</div>
                  <div class="preview-temp-main">
                    <span class="preview-temp-value">
                      {{ timingForm.taskType === 1 ? timingForm.targetTemperature : '--' }}
                    </span>
                    <span class="preview-temp-unit">℃</span>
                  </div>
                </div>

                <div class="preview-room-temp">
                  <div class="preview-room-label">室内<br />温度</div>
                  <div class="preview-room-value">--℃</div>
                </div>

                <div class="preview-mode-section">
                  <div class="preview-mode-item">
                    <!-- <i :class="timingForm.taskType === 1 ? getModeIcon(timingForm.operationMode) : 'el-icon-question'"
                      class="preview-mode-icon"></i> -->
                    <span class="preview-mode-label">
                      {{ timingForm.taskType === 1 ? getModeLabel(timingForm.operationMode) : '--' }}
                    </span>
                  </div>
                  <div class="preview-mode-item">
                    <!-- <span class="fan-text-icon-small">F</span> -->
                    <span class="preview-mode-label">
                      {{ timingForm.taskType === 1 ? getFanLabel(timingForm.fanSpeed) : '--' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 控制按钮 -->
              <div class="preview-control-buttons-fixed" v-if="timingForm.taskType === 1">
                <button class="preview-btn-fixed" :class="{ active: timingForm.powerStatus === 1 }"
                  @click="timingForm.powerStatus = timingForm.powerStatus === 1 ? 0 : 1">
                  <i class="el-icon-video-play"></i>
                </button>

                <el-dropdown trigger="click" @command="(cmd) => timingForm.operationMode = cmd">
                  <button class="preview-btn-fixed">M</button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item v-if="shouldShowAutoModeInTiming()" :command="0">自动</el-dropdown-item>
                    <el-dropdown-item :command="1">制热</el-dropdown-item>
                    <el-dropdown-item :command="2">制冷</el-dropdown-item>
                    <el-dropdown-item :command="4">送风</el-dropdown-item>
                    <el-dropdown-item :command="8">除湿</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>

                <el-dropdown trigger="click" @command="(cmd) => timingForm.fanSpeed = cmd">
                  <button class="preview-btn-fixed">F</button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item :command="0">自动</el-dropdown-item>
                    <el-dropdown-item :command="1">低风</el-dropdown-item>
                    <el-dropdown-item :command="2">中风</el-dropdown-item>
                    <el-dropdown-item :command="3">高风</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>

                <button class="preview-btn-fixed" @click="adjustTimingTemperature(1)">
                  <i class="el-icon-caret-top"></i>
                </button>
                <button class="preview-btn-fixed" @click="adjustTimingTemperature(-1)">
                  <i class="el-icon-caret-bottom"></i>
                </button>
                <button class="preview-btn-fixed" disabled>
                  <i class="el-icon-setting"></i>
                </button>
              </div>

              <!-- 锁定设置面板 -->
              <div class="lock-setting-panel" v-if="timingForm.taskType === 2">
                <!-- 温度范围 -->
                <div class="lock-card">
                  <div class="card-header">
                    <!-- <span class="header-icon"><i class="el-icon-odometer"></i></span> -->
                    <span class="header-title">温度范围锁定</span>
                  </div>
                  <div class="card-content temp-range-group">
                    <el-input-number v-model="timingForm.minTemperature" :min="16" :max="31" size="small"
                      controls-position="right" placeholder="Min" />
                    <span class="range-separator">至</span>
                    <el-input-number v-model="timingForm.maxTemperature" :min="16" :max="31" size="small"
                      controls-position="right" placeholder="Max" />
                    <span class="unit">℃</span>
                  </div>
                </div>

                <!-- 模式锁定 -->
                <div class="lock-card">
                  <div class="card-header">
                    <!-- <span class="header-icon"><i class="el-icon-s-operation"></i></span> -->
                    <span class="header-title">模式锁定</span>
                  </div>
                  <div class="card-content">
                    <el-radio-group v-model="timingForm.lockOperationMode" size="small" class="chip-radio-group">
                      <el-radio-button :label="130">制冷</el-radio-button>
                      <el-radio-button :label="129">制热</el-radio-button>
                      <el-radio-button :label="132">送风</el-radio-button>
                      <el-radio-button :label="136">除湿</el-radio-button>
                      <el-radio-button :label="0">不锁定</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>

                <!-- 风速锁定 -->
                <div class="lock-card">
                  <div class="card-header">
                    <!-- <span class="header-icon">F</span> -->
                    <span class="header-title">风速锁定</span>
                  </div>
                  <div class="card-content">
                    <el-radio-group v-model="timingForm.lockFanSpeed" size="small" class="chip-radio-group">
                      <el-radio-button :label="129">低风</el-radio-button>
                      <el-radio-button :label="130">中风</el-radio-button>
                      <el-radio-button :label="131">高风</el-radio-button>
                      <el-radio-button :label="128">自动</el-radio-button>
                      <el-radio-button :label="0">不锁定</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>

                <!-- 开关锁定 -->
                <div class="lock-card">
                  <div class="card-header">
                    <!-- <span class="header-icon"><i class="el-icon-switch-button"></i></span> -->
                    <span class="header-title">开关锁定</span>
                  </div>
                  <div class="card-content">
                    <el-radio-group v-model="timingForm.lockPowerStatus" size="small" class="chip-radio-group">
                      <el-radio-button :label="129">开机</el-radio-button>
                      <el-radio-button :label="128">关机</el-radio-button>
                      <el-radio-button :label="0">不锁定</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧：编辑时显示设备列表 -->
        <el-col :span="14" v-if="timingDialog.isEdit">
          <div class="timing-devices-section">
            <div class="devices-header">
              <span class="devices-title">设备明细</span>
              <el-button v-if="canControl" size="small" type="primary" icon="el-icon-plus" @click="handleAddDevices">添加</el-button>
            </div>
            <el-table :data="timingDevices" height="500px" border>
              <el-table-column label="序列号" prop="id" width="90" />
              <el-table-column label="空调名称" min-width="160">
                <template slot-scope="scope">
                  <el-link type="primary">{{ scope.row.name }}</el-link>
                </template>
              </el-table-column>
              <el-table-column label="绑定信息" min-width="160">
                <template slot-scope="scope">
                  {{ scope.row.bindData || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="在线状态" width="90">
                <template slot-scope="scope">
                  {{ scope.row.state == 0 ? '在线' : '离线' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template slot-scope="scope">
                  <el-button v-if="canControl" type="text" size="mini" @click="handleRemoveDevice(scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>

      <span slot="footer" class="dialog-footer">
        <el-button @click="timingDialog.visible = false">取 消</el-button>
        <el-button v-if="canControl" type="primary" :loading="submitting" @click="handleTimingSave">
          {{ submitting ? "执行中..." : "确 定" }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 添加设备弹窗 -->
    <el-dialog title="添加设备" :visible.sync="addDeviceDialog.visible" width="650px" append-to-body class="custom-dialog">
      <el-form>
        <el-row :gutter="10">
          <el-col :span="20">
            <el-form-item label="设备名称/编号">
              <el-input v-model="deviceFilterName" clearable placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" icon="el-icon-search" @click="filterDeviceList" />
          </el-col>
        </el-row>
      </el-form>
      <el-table ref="deviceTable" :data="filteredDeviceList" height="400px"
        @selection-change="handleDeviceSelectionChange">
        <el-table-column v-if="canControl" type="selection" width="55" align="center" />
        <el-table-column label="设备Id" prop="id" />
        <el-table-column label="设备名称" prop="name" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addDeviceDialog.visible = false">取 消</el-button>
        <el-button v-if="canControl" type="primary" @click="handleConfirmAddDevices">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 定时任务列表弹窗 -->
    <el-dialog title="定时任务" :visible.sync="timingListDialog.visible" width="1200px" class="custom-dialog">
      <el-table :data="timingList" style="width: 100%" max-height="500px">
        <el-table-column label="任务ID" prop="id" width="90" align="center" />
        <el-table-column label="定时日期" width="200" align="center">
          <template slot-scope="scope">
            {{ formatTimingDate(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="定时时间" prop="time" width="100" align="center" />
        <el-table-column label="定时选项" width="100" align="center">
          <template slot-scope="scope">
            {{ scope.row.taskType == 1 ? '控制' : '锁定' }}
          </template>
        </el-table-column>
        <el-table-column label="定时操作" min-width="200">
          <template slot-scope="scope">
            {{ formatTimingAction(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="设备数" width="80" align="center">
          <template slot-scope="scope">
            {{ scope.row.airIds ? scope.row.airIds.split(',').length : 0 }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" align="center" />
        <el-table-column label="任务开关" width="100" align="center">
          <template slot-scope="scope">
            <el-switch v-if="canControl" :value="scope.row.isEnabled == 1" @change="handleToggleTimingStatus(scope.row)" />
            <span v-else>{{ scope.row.isEnabled == 1 ? '开启' : '关闭' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="canControl" label="操作" width="150" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="handleEditTiming(scope.row)">编辑</el-button>
            <el-divider direction="vertical"></el-divider>
            <el-button type="text" size="mini" @click="handleDeleteTimingTask(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" style="margin-top: 20px;">
        <el-pagination :current-page="timingPage.current" :page-sizes="[10, 20, 50, 100]"
          :page-size="timingPage.pageSize" :total="timingPage.total" layout="total, sizes, prev, pager, next"
          @size-change="handleTimingSizeChange" @current-change="handleTimingCurrentChange" />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="timingListDialog.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

    <!-- 控制历史弹窗 -->
    <el-dialog title="控制历史" :visible.sync="historyDialog.visible" width="1000px" class="custom-dialog">
      <el-table :data="historyDialogData" height="500px">
        <el-table-column label="操作时间" prop="occurTime" width="180" />
        <el-table-column label="操作来源" width="120">
          <template slot-scope="scope">
            {{ scope.row.ctrType == 1 ? '设备上报' : '用户下发' }}
          </template>
        </el-table-column>
        <el-table-column label="操作类型" width="100">
          <template slot-scope="scope">
            {{ getLogTypeLabel(scope.row.setType) }}
          </template>
        </el-table-column>
        <el-table-column label="操作内容" prop="setValLable" />
        <el-table-column label="操作结果" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.res == 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.res == 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" style="margin-top: 20px;">
        <el-pagination :current-page="historyPage.current" :page-sizes="[10, 20, 50]" :page-size="historyPage.pageSize"
          :total="historyPage.total" layout="total, sizes, prev, pager, next" @size-change="handleHistorySizeChange"
          @current-change="handleHistoryCurrentChange" />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="historyDialog.visible = false">关 闭</el-button>
      </span>
    </el-dialog>
    <AirDetailDrawer :visible.sync="detailDrawer.visible" :device-id="detailDrawer.data ? detailDrawer.data.id : ''"
      :row-data="detailDrawer.data" @refresh="fetchTableData" @edit="handleEdit" @control="handleControl"
      @lock="handleLock" @unlock="handleUnlock" @timing="handleTiming" />

    <!-- 绑定电费方案弹窗 -->
    <el-dialog title="绑定计费方案" :visible.sync="bindPriceDialog.visible" width="600px" append-to-body
      :close-on-click-modal="false">
      <el-form ref="bindPriceForm" :model="bindPriceDialog.form" label-width="100px" size="small">
        <el-form-item label="外机系统">
          <el-input :value="bindPriceDialog.data ? (bindPriceDialog.data.name || bindPriceDialog.data.addr) : ''"
            disabled></el-input>
        </el-form-item>
        <el-form-item label="电费单价" required>
          <el-select v-model="bindPriceDialog.form.priceId" placeholder="请选择电费单价" style="width: 100%" filterable
            @change="handlePriceChange">
            <el-option v-for="item in bindPriceDialog.priceList" :key="item.id" :label="item.name" :value="item.id">
              <span style="float: left">{{ item.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 电价详情展示 -->
        <el-form-item label=" " v-if="bindPriceDialog.priceDetail">
          <div class="price-detail-preview" style="display: flex; gap: 20px; align-items: center; width: 100%;">
            <div class="detail-item" style="display: flex; align-items: center; gap: 5px;">
              <span class="label" style="font-size: 14px; color: #606266; white-space: nowrap;">尖:</span>
              <span class="value" style="font-size: 14px; color: #606266; white-space: nowrap;">{{
                bindPriceDialog.priceDetail.powerTopPrice }}</span>
            </div>
            <div class="detail-item" style="display: flex; align-items: center; gap: 5px;">
              <span class="label" style="font-size: 14px; color: #606266; white-space: nowrap;">峰:</span>
              <span class="value" style="font-size: 14px; color: #606266; white-space: nowrap;">{{
                bindPriceDialog.priceDetail.powerPeakPrice }}</span>
            </div>
            <div class="detail-item" style="display: flex; align-items: center; gap: 5px;">
              <span class="label" style="font-size: 14px; color: #606266; white-space: nowrap;">平:</span>
              <span class="value" style="font-size: 14px; color: #606266; white-space: nowrap;">{{
                bindPriceDialog.priceDetail.powerFlatPrice }}</span>
            </div>
            <div class="detail-item" style="display: flex; align-items: center; gap: 5px;">
              <span class="label" style="font-size: 14px; color: #606266; white-space: nowrap;">谷:</span>
              <span class="value" style="font-size: 14px; color: #606266; white-space: nowrap;">{{
                bindPriceDialog.priceDetail.powerValleyPrice }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="bindPriceDialog.visible = false">取 消</el-button>
        <el-button v-if="canControl" size="small" type="primary" :loading="bindPriceDialog.loading" @click="handleBindPriceSubmit">确
          定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import {
  airInfoPageAir,
  airInfoControlAir,
  airInfoLockAir,
  airInfoBathcLockAir,
  airInfoBatchBindAir,
  airInfoUpdateAir,
  airGatewayListAirGateWay,
  airScheduledTaskPageAirScheduledTask,
  airScheduledTaskDelete,
  airScheduledTaskAddAirScheduledTasks,
  airScheduledTaskEditAirScheduledTasks,
  airScheduledTaskUpdateEnabled,
  airScheduledTaskListAirInfoByIds,
  airControlLogPageAirGateWay,
  airInfoQueryAirUseStatis,
  airInfoListAirInfo,
  pageAirGateWay,
  listAirMeterInfo,
  airGatewayUpdateAirGateway
} from '@/api/airCondition'
import { getMeterPriceList } from '@/api/electricityShare'
import AirDetailDrawer from './conditioning/drawer.vue'
import AirConditionExpand from './AirConditionExpand.vue'
import MeterDetailDrawer from './electricity/detail.vue'
import { translateAcEnum } from '@/utils/acDeviceI18n'
import { tenantPageTenant } from '@/api/tenant'
import { mapGetters, mapState } from 'vuex'
import moment from 'moment'
import * as XLSX from 'xlsx'

export default {
  name: 'AirConditionManagement',
  components: {
    AirDetailDrawer,
    AirConditionExpand,
    MeterDetailDrawer
  },
  data () {
    return {
      // 当前激活的标签页
      activeTab: ['indoor', 'outdoor'].includes(String(this.$route.query.tab)) ? String(this.$route.query.tab) : 'indoor',

      // 外机系统查询参数
      outdoorQuery: {
        addr: '',
        managerId: '',
        page: {
          current: 1,
          size: 30
        },
        total: 0
      },
      outdoorTableData: [],
      outdoorLoading: false,
      exportLoading: false,
      outdoorSystemList: [],

      // 视图模式 (默认卡片视图)
      viewMode: 'card', // card 或 list
      sortOrder: 'default',
      tenantLoading: false,

      outdoorViewMode: 'card',
      outdoorExpandDirection: 'vertical',
      outdoorExpandSelectedId: null,
      outdoorMaxVisibleChildren: 8,
      outdoorMoreDrawer: {
        visible: false,
        title: '',
        keyword: '',
        parent: null,
        list: []
      },

      // 表格高度配置
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 11,
        paginationHeight: 68
      },

      // 查询参数
      queryData: {
        tenantId: null,
        name: this.$route.query.deviceName || '',
        state: null,
        managerId: '',
        bindType: '',
        gatewayId: '',
        current: 1,
        pageSize: 12,
        total: 0
      },

      // 租户列表
      tenantList: [],
      // 网关列表
      gatewayList: [],

      // 表格数据
      tableData: [],
      loading: false,
      submitting: false,

      // 选中的数据
      selectedData: [],
      // 列表翻页/刷新后程序化恢复勾选，避免 selection-change 重复累加
      _restoringTableSelection: false,

      detailDrawer: {
        visible: false,
        data: null
      },

      bindPriceDialog: {
        visible: false,
        form: {
          priceId: ''
        },
        data: null,
        priceList: [],
        priceDetail: null,
        loading: false
      },

      // 拓扑图点击外机：电表详情抽屉（与 electricity 列表一致）
      meterDetailDrawer: {
        visible: false,
        meterId: '',
        serial: ''
      },

      // 关系图弹窗（列表「查看」仍打开关系图）
      relationDialog: {
        visible: false
      },
      relationChart: null,
      currentOutdoorSystem: null,

      // 编辑弹窗
      editDialog: {
        visible: false
      },
      editForm: {
        id: null,
        indoorUnitId: '',
        name: '',
        type: 1,
        bindType: 1,
        remark: ''
      },

      // 控制弹窗
      controlDialog: {
        visible: false,
        row: null,
        isBatch: false
      },
      controlForm: {
        powerStatus: 1,
        operationMode: 2,
        targetTemperature: 24,
        fanSpeed: 0
      },

      // 锁定弹窗
      lockDialog: {
        visible: false,
        row: null,
        isBatch: false
      },
      lockForm: {
        lockPowerStatus: 0,
        lockOperationMode: 0,
        lockFanSpeed: 0,
        minTemperature: undefined,
        maxTemperature: undefined
      },

      // 定时任务设置弹窗
      timingDialog: {
        visible: false,
        row: null,
        isBatch: false,
        isEdit: false
      },
      timingForm: {
        taskType: 1, // 1-控制 2-锁定
        repeatType: 1, // 1-周期重复 2-单次执行
        weekDays: [],
        executeDate: '',
        executeTime: '',
        // 控制参数
        powerStatus: 1,
        operationMode: 2,
        targetTemperature: 24,
        fanSpeed: 0,
        // 锁定参数
        lockPowerStatus: 0,
        lockOperationMode: 0,
        lockFanSpeed: 0,
        minTemperature: 16,
        maxTemperature: 31
      },
      timingDevices: [], // 编辑时的设备列表

      // 定时任务列表弹窗
      timingListDialog: {
        visible: false
      },
      timingList: [],
      timingPage: {
        current: 1,
        pageSize: 10,
        total: 0
      },

      // 添加设备弹窗(编辑定时任务用)
      addDeviceDialog: {
        visible: false
      },
      deviceFilterName: '',
      allDeviceList: [],
      filteredDeviceList: [],
      selectedDevices: [],

      // 控制历史弹窗
      historyDialog: {
        visible: false,
        airId: null
      },
      historyDialogData: [],
      historyPage: {
        current: 1,
        pageSize: 10,
        total: 0
      },

      // 定时器(定时刷新)
      refreshTimer: null,
      // 锁定/解锁后延迟刷新（等待下发回显）
      lockRefreshTimer: null,

      // 绑定电费方案弹窗
      bindPriceDialog: {
        visible: false,
        data: null,
        loading: false,
        form: {
          priceId: ''
        },
        priceList: [],
        priceDetail: null
      }
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapState('enumData', [
      'airBindType',
      'airDeviceType',
      'powerStatus',
      'operationMode',
      'fanSpeed',
      'lockPowerStatus',
      'lockOperationMode',
      'lockFanSpeed',
      'airlogType',
      'taskWeek'
    ]),
    kztMenuNos () {
      const list = this.$store.getters.kztMenuNos
      return Array.isArray(list) ? list : []
    },
    hasKztPermission () {
      const allow = new Set(this.kztMenuNos.map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canControl () {
      return this.hasKztPermission('630030')
    },
    canView () {
      return this.hasKztPermission('630032')
    },

    mainTabs () {
      return [
        { name: 'indoor', label: this.$t('deviceConditioning.tabIndoor') },
        { name: 'outdoor', label: this.$t('deviceConditioning.tabOutdoor') }
      ]
    },
    tableKey () {
      const t = (k) => this.$t(`deviceConditioning.${k}`)
      return [
        { label: t('colIndoorSerial'), key: 'indoorUnitId', width: '150', checked: true, disabled: true },
        { label: t('colDeviceName'), key: 'name', width: '140', checked: true, disabled: true },
        { label: t('colDeviceType'), key: 'typeLabel', checked: true, width: '100', isTag: true },
        { label: t('colBindShareType'), key: 'bindTypeLabel', checked: true, width: '100', isTag: true },
        { label: t('colBindInfo'), key: 'bindData', checked: true, width: '280' },
        { label: t('colOutdoorSystemName'), key: 'gatewayName', checked: true, width: '150' },
        { label: t('colSwitch'), checked: true, key: 'powerStatusLabel', width: '100', isTag: true },
        { label: t('colMode'), checked: true, key: 'operationModeLabel', width: '120', isTag: true },
        { label: t('colTemp'), checked: true, key: 'targetTemperature', width: '140', isTag: true },
        { label: t('colFanSpeed'), checked: true, key: 'fanSpeedLabel', width: '140', isTag: true },
        { label: t('colFault'), checked: true, key: 'faultStatus', width: '100', isTag: true },
        { label: t('colCreateTime'), key: 'createTime', checked: true, width: '160' }
      ]
    },
    editFormRules () {
      return {
        indoorUnitId: [
          { required: true, message: this.$t('deviceConditioning.ruleIndoorSerial'), trigger: 'blur' }
        ],
        name: [
          { required: true, message: this.$t('deviceConditioning.ruleDeviceName'), trigger: 'blur' }
        ],
        type: [
          { required: true, message: this.$t('deviceConditioning.ruleDeviceType'), trigger: 'change' }
        ],
        bindType: [
          { required: true, message: this.$t('deviceConditioning.ruleBindType'), trigger: 'change' }
        ]
      }
    },

    // 枚举数据映射
    enums () {
      const t = (k) => this.$t(`deviceConditioning.${k}`)
      return {
        airDeviceType: this.airDeviceType || [{ value: 1, label: t('enumVrf') }],
        airBindType: this.airBindType || [
          { value: 1, label: t('enumDedicated') },
          { value: 2, label: t('enumPublic') }
        ],
        powerStatus: this.powerStatus || [
          { value: 0, label: t('enumPowerOff') },
          { value: 1, label: t('enumPowerOn') }
        ],
        operationMode: this.operationMode || [
          { value: 0, label: t('enumModeAuto') },
          { value: 1, label: t('enumModeHeat') },
          { value: 2, label: t('enumModeCool') },
          { value: 4, label: t('enumModeFan') },
          { value: 8, label: t('enumModeDry') }
        ],
        fanSpeed: this.fanSpeed || [
          { value: 0, label: t('enumFanAuto') },
          { value: 1, label: t('enumFanLow') },
          { value: 2, label: t('enumFanMid') },
          { value: 3, label: t('enumFanHigh') }
        ],
        lockPowerStatus: this.lockPowerStatus || [
          { value: 0, label: t('enumLockNone') },
          { value: 128, label: t('enumLockPowerOff') },
          { value: 129, label: t('enumLockPowerOn') }
        ],
        lockOperationMode: this.lockOperationMode || [
          { value: 0, label: t('enumLockNone') },
          { value: 128, label: t('enumModeAuto') },
          { value: 129, label: t('enumModeHeat') },
          { value: 130, label: t('enumModeCool') },
          { value: 132, label: t('enumModeFan') },
          { value: 136, label: t('enumModeDry') }
        ],
        lockFanSpeed: this.lockFanSpeed || [
          { value: 0, label: t('enumLockNone') },
          { value: 128, label: t('enumFanAuto') },
          { value: 129, label: t('enumFanLow') },
          { value: 130, label: t('enumFanMid') },
          { value: 131, label: t('enumFanHigh') }
        ],
        airlogType: this.airlogType || [
          { value: 1, label: t('enumLogSwitch') },
          { value: 2, label: t('enumLogMode') },
          { value: 3, label: t('enumLogLock') }
        ],
        taskWeek: this.taskWeek || [
          { label: t('enumWeekMon'), value: '1' },
          { label: t('enumWeekTue'), value: '2' },
          { label: t('enumWeekWed'), value: '3' },
          { label: t('enumWeekThu'), value: '4' },
          { label: t('enumWeekFri'), value: '5' },
          { label: t('enumWeekSat'), value: '6' },
          { label: t('enumWeekSun'), value: '7' }
        ]
      }
    },

    // 计算需要显示的列
    displayColumns () {
      return this.tableKey.filter((col) => col.checked !== false)
    },

    // 动态计算表格高度
    tableMaxHeight () {
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    },
    needPowerLockPlaceholder () {
      return this.tableData.some(item => item.lockPowerStatus)
    },

    // 判断是否需要模式锁定占位符
    needModeLockPlaceholder () {
      return this.tableData.some(item => item.lockOperationMode)
    },

    // 判断是否需要温度锁定占位符
    needTempLockPlaceholder () {
      return this.tableData.some(item => item.minTemperature || item.maxTemperature)
    },

    // 判断是否需要风速锁定占位符
    needFanLockPlaceholder () {
      return this.tableData.some(item => item.lockFanSpeed)
    },
    outdoorMoreFilteredList () {
      const list = (this.outdoorMoreDrawer && Array.isArray(this.outdoorMoreDrawer.list)) ? this.outdoorMoreDrawer.list : []
      const kw = (this.outdoorMoreDrawer && this.outdoorMoreDrawer.keyword ? String(this.outdoorMoreDrawer.keyword) : '').trim().toLowerCase()
      if (!kw) return list
      return list.filter(it => {
        const name = (it && it.name != null) ? String(it.name).toLowerCase() : ''
        const serial = (it && it.serial != null) ? String(it.serial).toLowerCase() : ''
        return name.includes(kw) || serial.includes(kw)
      })
    }
  },

  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          this.queryData.current = 1
          this.outdoorQuery.page.current = 1
          this.outdoorQuery.addr = ''
          this.initPage()
        }
      },
      immediate: true
    },

    // 视图切换时调整分页
    viewMode (newVal) {
      if (newVal === 'card') {
        this.queryData.pageSize = 12
      } else {
        this.queryData.pageSize = 20
      }
      this.queryData.current = 1
      this.fetchTableData()
    },

    outdoorViewMode () {
      this.outdoorQuery.page.current = 1
      this.fetchOutdoorData()
    },

    // 监听路由参数变化
    '$route.query': {
      handler (newQuery) {
        const tab = newQuery && newQuery.tab ? String(newQuery.tab) : ''
        if (tab && ['indoor', 'outdoor'].includes(tab) && tab !== this.activeTab) {
          this.activeTab = tab
          if (tab === 'outdoor') this.fetchOutdoorData()
        }
        if (newQuery && newQuery.deviceName) {
          this.queryData.name = newQuery.deviceName
          this.handleSearch()
        }
      }
    },

    '$i18n.locale' () {
      if (this.queryData.managerId) {
        this.fetchTableData(true)
        this.fetchOutdoorData()
      }
    }
  },

  mounted () {
    // 启动定时刷新(6秒刷新一次)
    this.refreshTimer = setInterval(() => {
      if (this.viewMode === 'list' && this.selectedData.length > 0) {
        // 列表视图且有选中项时才刷新(保持选中状态)
        this.fetchTableData(true)
      } else if (this.viewMode === 'card') {
        // 卡片视图刷新
        this.fetchTableData(true)
      }
    }, 6000)
    window.addEventListener('resize', this.handleWindowResize)
  },

  beforeDestroy () {
    // 清除定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    if (this.lockRefreshTimer) {
      clearTimeout(this.lockRefreshTimer)
    }
    window.removeEventListener('resize', this.handleWindowResize)
    if (this.relationChart) {
      this.relationChart.dispose()
      this.relationChart = null
    }
  },

  methods: {
    // ========== 初始化相关 ==========

    async initPage () {
      const tasks = [
        this.fetchTableData(),
        this.getTenantList(),
        this.getGatewayList(),
        this.getAllOutdoorSystems()
      ]

      if (this.activeTab === 'outdoor') {
        tasks.push(this.fetchOutdoorData())
      }

      await Promise.all(tasks)
    },

    // 复制序列号
    handleCopySerial (serial) {
      if (!serial || serial === '-') {
        this.$message.warning(this.$t('deviceConditioning.warnNothingToCopy'))
        return
      }

      // 创建临时输入框
      const input = document.createElement('input')
      input.value = serial
      document.body.appendChild(input)
      input.select()

      try {
        document.execCommand('copy')
        this.$message.success(this.$t('deviceConditioning.successSerialCopied'))
      } catch (err) {
        this.$apiError.notify(err, this.$t('deviceConditioning.errCopy'))
      }

      document.body.removeChild(input)
    },

    // ========== 外机系统相关 ==========

    // 获取所有外机系统列表(用于下拉框)
    async getAllOutdoorSystems () {
      try {
        const params = {
          managerId: this.queryData.managerId,
          page: {
            current: 1,
            size: 1000
          }
        }
        const response = await pageAirGateWay(params)
        if (response.code === 200 && response.data) {
          this.outdoorSystemList = response.data.dataList || response.data.records || []
        }
      } catch (error) {
        console.error('获取外机列表失败:', error)
      }
    },

    // 获取外机列表
    async fetchOutdoorData () {
      this.outdoorLoading = true
      try {
        const isCardMode = this.outdoorViewMode === 'card'
        const params = {
          managerId: this.queryData.managerId,
          page: {
            current: isCardMode ? 1 : this.outdoorQuery.page.current,
            size: isCardMode ? 10000 : this.outdoorQuery.page.size
          }
        }
        if (this.outdoorQuery.addr) {
          params.addr = this.outdoorQuery.addr
        }

        const response = await pageAirGateWay(params)
        if (response.code === 200 && response.data) {
          this.outdoorTableData = response.data.dataList || response.data.records || []
          this.outdoorQuery.total = response.data.total || 0
        } else {
          this.outdoorTableData = []
          this.outdoorQuery.total = 0
        }
      } catch (error) {
        console.error('获取外机数据失败:', error)
        this.$apiError.notify(error, this.$t('deviceConditioning.errOutdoorFetch'))
      } finally {
        this.outdoorLoading = false
      }
    },

    handleOutdoorSearch () {
      this.outdoorQuery.page.current = 1
      this.fetchOutdoorData()
    },

    handleOutdoorSizeChange (val) {
      this.outdoorQuery.page.size = val
      this.outdoorQuery.page.current = 1
      this.fetchOutdoorData()
    },

    handleOutdoorCurrentChange (val) {
      this.outdoorQuery.page.current = val
      this.fetchOutdoorData()
    },

    onOutdoorExpandSelect (node) {
      if (!node) return
      this.outdoorExpandSelectedId = node.id
    },

    onOutdoorExpandMoreChildren (payload) {
      const list = payload && Array.isArray(payload.children) ? payload.children : []
      const parent = payload && payload.parent ? payload.parent : null
      const title = parent && parent.name
        ? this.$t('deviceConditioning.nodeListTitleWithParent', { name: parent.name })
        : this.$t('deviceConditioning.nodeListTitle')
      this.outdoorMoreDrawer.title = title
      this.outdoorMoreDrawer.keyword = ''
      this.outdoorMoreDrawer.parent = parent
      this.outdoorMoreDrawer.list = list
      this.outdoorMoreDrawer.visible = true
    },

    handleOutdoorMorePick (node) {
      if (!node) return
      this.outdoorExpandSelectedId = node.id
      this.outdoorMoreDrawer.visible = false
      this.$nextTick(() => {
        if (this.$refs.outdoorExpand && typeof this.$refs.outdoorExpand.focusNode === 'function') {
          this.$refs.outdoorExpand.focusNode(node.id, { mode: 'selected' })
        }
      })
      if (node.rawType === 'outdoor' && node.raw) {
        this.handleOutdoorMeterDetail(node.raw)
      } else if (node.rawType === 'air' && node.raw) {
        this.handleDetail(node.raw)
      }
    },

    // 拓扑图 / 更多列表：外机节点 → 电表详情（与 electricity 列表一致）
    handleOutdoorMeterDetail (row) {
      if (!this.canView) return
      const primary = this.getPrimaryMeterFromOutdoorRow(row)
      if (!primary.serial && !primary.meterId) {
        this.$message.warning(this.$t('deviceConditioning.warnNoMeterForOutdoor'))
        return
      }
      this.meterDetailDrawer = {
        visible: true,
        meterId: primary.meterId || '',
        serial: primary.serial || ''
      }
    },

    getPrimaryMeterFromOutdoorRow (row) {
      if (!row) return { meterId: '', serial: '' }
      const list = row.meterList
      if (Array.isArray(list) && list.length > 0) {
        const raw = list[0]
        if (raw && typeof raw === 'object') {
          const meterId = raw.id != null && raw.id !== ''
            ? String(raw.id).trim()
            : (raw.meterId != null && raw.meterId !== '' ? String(raw.meterId).trim() : '')
          const serial = raw.serial != null && raw.serial !== '' ? String(raw.serial).trim() : ''
          return { meterId, serial }
        }
        const s = String(raw).trim()
        return { meterId: '', serial: s }
      }
      const serialField = row.serial != null ? String(row.serial).trim() : ''
      if (serialField) {
        const first = serialField.split(',')[0].trim()
        return { meterId: '', serial: first }
      }
      const meterIdField = row.meterId != null ? String(row.meterId).trim() : ''
      if (meterIdField) {
        const firstId = meterIdField.split(',')[0].trim()
        return { meterId: firstId, serial: '' }
      }
      return { meterId: '', serial: '' }
    },

    handleBindPrice (row) {
      if (!this.canControl) return
      this.bindPriceDialog.data = row
      this.bindPriceDialog.form.priceId = row.priceDto ? row.priceDto.id : ''
      this.bindPriceDialog.visible = true
      this.bindPriceDialog.priceDetail = null
      this.getMeterPriceList()
      if (this.bindPriceDialog.form.priceId) {
        // 如果有初始值，需要获取对应的详情
        // 但这里我们先获取列表，列表加载后再匹配详情
      }
    },

    async getMeterPriceList () {
      try {
        const params = {
          managerId: this.queryData.managerId,
          priceType: 1
        }
        const response = await getMeterPriceList(params)
        if (response.code === 200 && response.data) {
          this.bindPriceDialog.priceList = response.data
          // 如果有选中的priceId，更新priceDetail
          if (this.bindPriceDialog.form.priceId) {
            this.handlePriceChange(this.bindPriceDialog.form.priceId)
          }
        }
      } catch (error) {
        console.error('获取电费方案列表失败:', error)
      }
    },

    handlePriceChange (priceId) {
      const price = this.bindPriceDialog.priceList.find(item => item.id === priceId)
      this.bindPriceDialog.priceDetail = price || null
    },

    async handleBindPriceSubmit () {
      if (!this.canControl) return
      if (!this.bindPriceDialog.form.priceId) {
        this.$message.warning('请选择电费方案')
        return
      }

      this.bindPriceDialog.loading = true
      try {
        // 1. 提交绑定
        const params = {
          addr: this.bindPriceDialog.data.addr,
          meterId: this.bindPriceDialog.data.meterId,
          managerId: this.queryData.managerId,
          priceId: this.bindPriceDialog.form.priceId,
          remark: '',
          name: this.bindPriceDialog.data.name,
          mfrsNo: this.bindPriceDialog.data.mfrsNo,
          id: this.bindPriceDialog.data.id
        }

        const response = await airGatewayUpdateAirGateway(params)
        if (response.code === 200) {
          this.$message.success('绑定成功')
          this.bindPriceDialog.visible = false
          this.fetchOutdoorData() // 刷新列表
        } else {
          this.$message.error(response.msg || '绑定失败')
        }
      } catch (error) {
        console.error('绑定电费方案失败:', error)
        this.$message.error('绑定失败')
      } finally {
        this.bindPriceDialog.loading = false
      }
    },

    setMainTab (name) {
      if (!['indoor', 'outdoor'].includes(name) || this.activeTab === name) return
      this.activeTab = name
      if (name === 'outdoor') {
        this.fetchOutdoorData()
      }
    },

    normalizeAirList (airList) {
      if (Array.isArray(airList)) return airList
      if (typeof airList !== 'string') return []
      try {
        const parsed = JSON.parse(airList)
        return Array.isArray(parsed) ? parsed : []
      } catch (e) {
        return []
      }
    },

    normalizeMeterList (row) {
      const rawMeterList = row ? row.meterList : null
      if (Array.isArray(rawMeterList) && rawMeterList.length > 0) {
        return rawMeterList.map(item => item.meterName || item.serial || item).filter(Boolean)
      }
      if (row && row.serial) {
        return String(row.serial).split(',').map(v => v.trim()).filter(Boolean)
      }
      return []
    },

    handleWindowResize () {
      if (this.relationDialog.visible && this.relationChart) {
        this.relationChart.resize()
      }
    },

    // 导出外机系统数据
    async handleOutdoorExport () {
      if (!this.canView) return
      this.exportLoading = true
      try {
        const params = {
          managerId: this.queryData.managerId,
          page: {
            current: 1,
            size: 10000 // 导出所有数据
          }
        }
        if (this.outdoorQuery.addr) {
          params.addr = this.outdoorQuery.addr
        }

        const response = await pageAirGateWay(params)
        if (response.code === 200 && response.data) {
          const list = response.data.dataList || response.data.records || []
          if (list.length === 0) {
            this.$message.warning('暂无数据可导出')
            return
          }
          this.exportOutdoorToExcel(list)
          this.$message.success('导出成功')
        } else {
          this.$message.warning('导出失败：无数据')
        }
      } catch (error) {
        console.error('导出异常:', error)
        this.$message.error('导出失败')
      } finally {
        this.exportLoading = false
      }
    },

    exportOutdoorToExcel (data) {
      const header = ['网关MAC', '外机系统名称', '计费方案', '尖电价(元)', '峰电价(元)', '平电价(元)', '谷电价(元)', '计量设备', '空调内机', '在线状态']
      const rows = data.map(row => {
        const price = row.priceDto || {}
        const airNames = (row.airList || []).map(a => a.name).join('，')
        return [
          row.addr || '',
          row.name || '',
          price.name || '-',
          price.powerPeakPrice || '-',
          price.powerTopPrice || '-',
          price.powerFlatPrice || '-',
          price.powerValleyPrice || '-',
          row.serial || '-',
          airNames || '-',
          row.onlineStatus == 0 ? '在线' : '离线'
        ]
      })

      const ws = XLSX.utils.aoa_to_sheet([header, ...rows])

      // 设置列宽
      ws['!cols'] = [
        { wch: 15 }, // 网关MAC
        { wch: 20 }, // 外机系统名称
        { wch: 20 }, // 计费方案
        { wch: 10 }, // 尖
        { wch: 10 }, // 峰
        { wch: 10 }, // 平
        { wch: 10 }, // 谷
        { wch: 15 }, // 计量设备
        { wch: 30 }, // 空调内机
        { wch: 10 } // 在线状态
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '外机系统')
      XLSX.writeFile(wb, `外机系统列表_${moment().format('YYYYMMDDHHmmss')}.xlsx`)
    },

    // ========== 数据获取相关 ==========

    // 获取租户列表
    async getTenantList () {
      this.tenantLoading = true
      try {
        const params = {
          tenantStatus: 0,
          managerId: this.queryData.managerId,
          page: {
            current: 1,
            size: 1000
          }
        }

        const response = await tenantPageTenant(params)

        if (response.code === 200 && response.data) {
          this.tenantList = (response.data.dataList || []).map(item => ({
            id: item.id,
            name: item.name
          }))
        }
      } catch (error) {
        console.error('获取租户列表失败:', error)
      } finally {
        this.tenantLoading = false
      }
    },

    /** 租户下拉：英文界面名称走词典+拼音，与表格「绑定」列一致；中文界面原样 */
    tenantOptionDisplayLabel (item) {
      if (!item) return ''
      const id = item.id != null && item.id !== '' ? item.id : ''
      const raw = item.name != null && item.name !== '' ? String(item.name) : ''
      if (!raw) return String(id)
      return `${this.$displayBizHybrid(raw, 200)}(${id})`
    },

    // 获取网关列表
    async getGatewayList () {
      try {
        const query = {
          managerId: this.queryData.managerId
        }

        const response = await airGatewayListAirGateWay(query)

        if (response.code === 200 && response.data) {
          this.gatewayList = (response.data || []).map((item) => ({
            label: item.addr,
            value: item.id
          }))
        }
      } catch (error) {
        console.error('获取网关列表失败:', error)
      }
    },

    // 锁定/解锁成功后延迟刷新列表，保留当前分页与选中项
    scheduleLockStatusRefresh () {
      if (this.lockRefreshTimer) {
        clearTimeout(this.lockRefreshTimer)
      }
      this.lockRefreshTimer = setTimeout(() => {
        this.lockRefreshTimer = null
        this.fetchTableData(true)
      }, 2000)
    },

    // 获取空调列表数据
    async fetchTableData (isRefresh = false) {
      if (!isRefresh) {
        this.loading = true
      }

      try {
        const normalizeSelect = (v) => {
          if (v === null || v === undefined) return ''
          if (v === '__ALL__') return ''
          return v
        }
        const query = {
          bindId: normalizeSelect(this.queryData.tenantId),
          bindType: normalizeSelect(this.queryData.bindType),
          name: (this.queryData.name || '').trim(),
          state: normalizeSelect(this.queryData.state),
          managerId: this.queryData.managerId,
          gatewayId: normalizeSelect(this.queryData.gatewayId),
          page: {
            current: this.queryData.current,
            size: this.queryData.pageSize,
            orders: [{
              asc: false,
              column: 'createTime'
            }]
          }
        }

        const response = await airInfoPageAir(query)

        if (response.code !== 200) {
          throw new Error(response.msg || '获取数据失败')
        }

        if (!response.data) {
          throw new Error('响应数据为空')
        }

        const { total, dataList } = response.data
        this.queryData.total = total || 0

        // 数据格式化
        const formattedData = (dataList || []).map((item) => this.formatAirData(item))

        const shouldRestoreSelection =
          this.viewMode === 'list' && this.selectedData.length > 0

        if (shouldRestoreSelection) {
          // 必须在 tableData 赋值前设置，否则表格重渲染触发的空 selection-change 会清空已选
          this._restoringTableSelection = true
          const selectedIds = new Set(this.selectedData.map(item => item.id))
          this.selectedData = this.selectedData.map(item => {
            const fresh = formattedData.find(row => row.id === item.id)
            return fresh || item
          })
          this.tableData = formattedData
          this.$nextTick(() => {
            const table = this.$refs.multipleTable
            if (!table) {
              this._restoringTableSelection = false
              return
            }
            formattedData.forEach(item => {
              if (selectedIds.has(item.id)) {
                table.toggleRowSelection(item, true)
              }
            })
            this.$nextTick(() => {
              this._restoringTableSelection = false
            })
          })
        } else {
          this.tableData = formattedData
        }
      } catch (error) {
        console.error('获取空调数据失败:', error)
        this.$apiError.notify(error, '获取空调数据失败')
        this.tableData = []
        this.queryData.total = 0
      } finally {
        this.loading = false
      }
    },

    // 数据格式化方法
    formatAirData (item) {
      // 项目信息
      item.managerData = `(${item.managerId})${item.managerName}`

      // 设备数量（电表数据）
      if (item.meterId) {
        const meterIdList = item.meterId.split(',')
        const meterSerialList = (item.serial || '').split(',')
        item.meterData = meterIdList.map((id, index) => ({
          id: id,
          serial: meterSerialList[index] || ''
        }))
      } else {
        item.meterData = []
      }

      // 使用数值映射的 i18n 文案（避免 store 中文 label 在英文界面残留）
      const getEnumLabel = (enumName, value) => translateAcEnum(this, enumName, value)

      // 设备类型标签
      item.typeLabel = getEnumLabel('airDeviceType', item.type)
      item.bindTypeLabel = getEnumLabel('airBindType', item.bindType)
      item.powerStatusLabel = getEnumLabel('powerStatus', item.powerStatus)
      item.operationModeLabel = getEnumLabel('operationMode', item.operationMode)
      item.fanSpeedLabel = getEnumLabel('fanSpeed', item.fanSpeed)
      item.lockPowerStatusLabel = getEnumLabel('lockPowerStatus', item.lockPowerStatus)
      item.lockOperationModeLabel = getEnumLabel('lockOperationMode', item.lockOperationMode)
      item.lockFanSpeedLabel = getEnumLabel('lockFanSpeed', item.lockFanSpeed)

      // 是否存在锁定
      item.isLock = !!(
        item.lockFanSpeed ||
        item.lockOperationMode ||
        item.lockPowerStatus ||
        item.minTemperature ||
        item.maxTemperature
      )

      // 绑定信息（租户名英文界面走词典+拼音）
      if (item.bindType == 2) {
        item.bindData = item.bindId || ''
      } else if (item.bindType == 1) {
        item.bindData = item.tenantName
          ? `${item.bindId || ''}(${this.$displayBizHybrid(item.tenantName, 200)})`
          : (item.bindId || '')
      } else {
        item.bindData = ''
      }

      return item
    },

    // 获取模式标签类型
    getModeTagType (mode) {
      const typeMap = {
        0: 'info', // 自动
        1: 'danger', // 制热
        2: 'primary', // 制冷
        4: 'info', // 送风
        8: 'warning' // 除湿
      }
      return typeMap[mode] || ''
    },

    // 获取模式图标
    getModeIcon (mode) {
      // const iconMap = {
      //   0: "el-icon-refresh",      // 自动
      //   1: "el-icon-sunny",        // 制热
      //   2: "el-icon-light-rain",   // 制冷
      //   4: "el-icon-moon-night",   // 送风
      //   8: "el-icon-sunrise"       // 除湿
      // };
      // return iconMap[mode] || "el-icon-question";
    },

    // 获取模式标签
    getModeLabel (mode) {
      return translateAcEnum(this, 'operationMode', mode)
    },

    // 获取风速标签
    getFanLabel (speed) {
      return translateAcEnum(this, 'fanSpeed', speed)
    },

    // 获取锁定开关标签
    getLockPowerStatusLabel (value) {
      return translateAcEnum(this, 'lockPowerStatus', value)
    },

    // 获取锁定模式标签
    getLockOperationModeLabel (value) {
      return translateAcEnum(this, 'lockOperationMode', value)
    },

    // 获取锁定风速标签
    getLockFanSpeedLabel (value) {
      return translateAcEnum(this, 'lockFanSpeed', value)
    },

    // 判断控制弹窗是否显示自动模式
    shouldShowAutoMode () {
      // 批量控制时显示自动
      if (this.controlDialog.isBatch) {
        return true
      }
      // 单个控制时，如果品牌不是FY则显示自动
      if (this.controlDialog.row) {
        return this.controlDialog.row.mfrsNo !== 'FY'
      }
      return true
    },

    // 判断定时任务中是否显示自动模式
    shouldShowAutoModeInTiming () {
      // 批量定时显示自动
      if (this.timingDialog.isBatch) {
        return true
      }
      // 编辑模式显示自动（因为可能包含多个不同品牌设备）
      if (this.timingDialog.isEdit) {
        return true
      }
      // 单个定时，如果品牌不是FY则显示自动
      if (this.timingDialog.row) {
        return this.timingDialog.row.mfrsNo !== 'FY'
      }
      return true
    },

    // ========== 查询和筛选 ==========

    // 查询（保留当前分页，重置见 handleReset）
    handleSearch () {
      this.fetchTableData()
    },

    // 重置
    handleReset () {
      this.clearSelection()
      this.queryData = {
        tenantId: null,
        name: '',
        state: null,
        managerId: this.currentManagerId || '',
        bindType: '',
        gatewayId: '',
        current: 1,
        pageSize: this.viewMode === 'card' ? 12 : 20,
        total: 0
      }
      this.handleSearch()
    },

    handleIndoorExport () {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }
      try {
        const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData
        const headers = this.displayColumns.map((col) => col.label)
        const keys = this.displayColumns.map((col) => col.key)
        const data = exportData.map((row) => {
          return keys.map((key) => {
            if (key === 'faultStatus') {
              return row.faultCode === 'LOST' ? '离线' : (row.faultCode || '正常')
            }
            const val = row[key]
            if (val === null || val === undefined) return ''
            return typeof val === 'object' ? (val.label || '') : String(val)
          })
        })
        const wsData = [headers, ...data]
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length * 2, 15) }))
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '空调内机')
        const now = new Date()
        const timeStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0')
        const fileName = `空调内机_${timeStr}.xlsx`
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        this.$message.success(`成功导出${exportData.length}条数据`)
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败')
      }
    },

    // ========== 卡片视图相关 ==========

    // 判断是否选中
    isSelected (item) {
      return this.selectedData.some(s => s.id === item.id)
    },

    // 卡片选择
    handleCardSelect (checked, item) {
      if (checked) {
        this.selectedData.push(item)
      } else {
        const index = this.selectedData.findIndex(s => s.id === item.id)
        if (index > -1) {
          this.selectedData.splice(index, 1)
        }
      }
    },

    // 清空选择（列表/卡片视图）
    clearSelection () {
      this.selectedData = []
      this.$nextTick(() => {
        this.$refs.multipleTable?.clearSelection()
      })
    },

    // 卡片直接控制(立即生效)
    async handleCardControlDirect (item, type, value) {
      // 检查离线状态
      if (item.state === 1) {
        this.$message.warning('设备离线，无法控制')
        return
      }

      // 检查开机状态
      if (item.powerStatus === 0 && type !== 'power') {
        this.$message.warning('设备未开机，请先开机后再进行其他操作')
        return
      }

      // 构建控制参数
      const params = {
        addr: item.addr,
        airId: item.id,
        gatewayId: item.gatewayId,
        indoorUnitId: item.indoorUnitId,
        powerStatus: item.powerStatus,
        operationMode: item.operationMode,
        targetTemperature: item.targetTemperature,
        fanSpeed: item.fanSpeed
      }

      // 根据类型修改对应参数
      switch (type) {
        case 'power':
          params.powerStatus = params.powerStatus === 1 ? 0 : 1
          break
        case 'mode':
          params.operationMode = parseInt(value)
          break
        case 'fan':
          params.fanSpeed = parseInt(value)
          break
        case 'temp':
          const newTemp = params.targetTemperature + value
          if (newTemp < 16) {
            this.$message.warning('最低温度不能低于16℃')
            return
          }
          if (newTemp > 31) {
            this.$message.warning('最高温度不能高于31℃')
            return
          }
          params.targetTemperature = newTemp
          break
      }

      try {
        const response = await airInfoControlAir(params)
        if (response.code === 200) {
          this.$message.success(response.msg || '控制成功')
          this.fetchTableData(true) // 刷新数据
        } else {
          this.$message.error(response.msg || '控制失败')
        }
      } catch (error) {
        this.$message.error('控制失败')
        console.error('控制失败:', error)
      }
    },

    // 卡片设置下拉
    handleCardSetting (item, command) {
      if (!this.canControl && command !== 'history') return
      if (!this.canView && command === 'history') return
      switch (command) {
        case 'edit':
          this.handleEdit(item)
          break
        case 'timing':
          this.handleTiming(item)
          break
        case 'lock':
          this.handleLock(item)
          break
        case 'unlock':
          this.handleUnlock(item)
          break
        case 'history':
          this.handleViewHistory(item)
          break
      }
    },

    // ========== 批量操作 ==========

    // 批量操作命令
    handleBatchCommand (command) {
      if (!this.canControl) return
      if (this.selectedData.length === 0) {
        this.$message.warning('请选择需要批量操作的设备')
        return
      }

      switch (command) {
        case 'control':
          this.handleBatchControl()
          break
        case 'lock':
          this.handleBatchLock()
          break
        case 'unlock':
          this.handleBatchUnlock()
          break
        case 'timing':
          this.handleBatchTiming()
          break
      }
    },

    // 批量控制
    handleBatchControl () {
      const isBill = this.selectedData.some((item) => !item.billingMode)
      if (isBill) {
        this.$message.warning('选中设备存在计费方式参数为空，请补充后再执行控制操作')
        return
      }

      // 使用第一个设备的参数作为默认值
      const firstDevice = this.selectedData[0]
      this.controlForm = {
        powerStatus: firstDevice.powerStatus || 1,
        operationMode: firstDevice.operationMode || 2,
        targetTemperature: firstDevice.targetTemperature || 24,
        fanSpeed: firstDevice.fanSpeed || 0
      }
      this.controlDialog.isBatch = true
      this.controlDialog.row = null
      this.controlDialog.visible = true
    },

    // 批量锁定
    handleBatchLock () {
      this.lockForm = {
        lockPowerStatus: 0,
        lockOperationMode: 0,
        lockFanSpeed: 0,
        minTemperature: undefined,
        maxTemperature: undefined
      }
      this.lockDialog.isBatch = true
      this.lockDialog.row = null
      this.lockDialog.visible = true
    },

    // 批量解锁
    async handleBatchUnlock () {
      try {
        await this.$confirm(
          this.$t('deviceConditioning.confirmUnlockBatch', { count: this.selectedData.length }),
          this.$t('deviceConditioning.dialogTip'),
          {
            confirmButtonText: this.$t('deviceConditioning.dialogConfirm'),
            cancelButtonText: this.$t('deviceConditioning.dialogCancel'),
            type: 'warning'
          }
        )

        const query = this.selectedData.map((item) => ({
          addr: item.addr,
          airId: item.id,
          gatewayId: item.gatewayId,
          indoorUnitId: item.indoorUnitId,
          fanSpeed: 0,
          operationMode: 0,
          powerStatus: 0,
          maxTemperature: 0,
          minTemperature: 0
        }))

        const response = await airInfoBathcLockAir(query)

        if (response.code === 200) {
          this.$message.success(response.msg || '批量解锁成功')
          this.scheduleLockStatusRefresh()
        } else {
          this.$message.error(response.msg || '批量解锁失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('批量解锁失败')
          console.error('批量解锁失败:', error)
        }
      }
    },

    // 批量定时
    handleBatchTiming () {
      const isBill = this.selectedData.some((item) => !item.billingMode)
      if (isBill) {
        this.$message.warning('选中设备存在计费方式参数为空，请补充后再执行控制操作')
        return
      }

      this.resetTimingForm()
      this.timingDialog.isBatch = true
      this.timingDialog.row = null
      this.timingDialog.isEdit = false
      this.timingDialog.visible = true
    },

    // ========== 编辑功能 ==========

    // 编辑设备
    handleEdit (row) {
      if (!this.canControl) return
      this.editForm = {
        ...row,
        indoorUnitId: row.indoorUnitId || '',
        name: row.name || '',
        type: row.type || 1,
        bindType: row.bindType || 1,
        remark: row.remark || ''
      }
      this.editDialog.visible = true
    },

    // 编辑保存
    async handleEditSave () {
      if (!this.canControl) return
      this.$refs.editForm.validate(async (valid) => {
        if (!valid) {
          return false
        }

        this.submitting = true
        try {
          const response = await airInfoUpdateAir(this.editForm)

          if (response.code === 200) {
            this.$message.success(response.msg || '编辑成功')
            this.editDialog.visible = false
            this.fetchTableData()

            // 如果详情抽屉打开，更新详情数据
            if (this.detailDrawer.visible && this.detailDrawer.data && this.detailDrawer.data.id === this.editForm.id) {
              this.handleDetail({ id: this.editForm.id })
            }
          } else {
            this.$message.error(response.msg || '编辑失败')
          }
        } catch (error) {
          this.$message.error('编辑失败')
          console.error('编辑失败:', error)
        } finally {
          this.submitting = false
        }
      })
    },

    // ========== 单个设备操作 ==========

    // 单个控制
    handleControl (row) {
      if (!this.canControl) return
      if (!row.billingMode) {
        this.$message.warning('设备计费方式参数为空，请补充后再执行控制操作！')
        return
      }

      this.controlDialog.row = row
      this.controlDialog.isBatch = false
      this.controlForm = {
        powerStatus: row.powerStatus ?? 0,
        operationMode: row.operationMode ?? 2,
        targetTemperature: row.targetTemperature ?? 24,
        fanSpeed: row.fanSpeed ?? 0
      }
      this.controlDialog.visible = true
    },

    // 控制保存
    async handleControlSave () {
      if (!this.canControl) return
      // 检查离线状态
      if (!this.controlDialog.isBatch && this.controlDialog.row) {
        if (this.controlDialog.row.state === 1) {
          this.$message.warning('设备离线，无法控制')
          return
        }
      }

      // 检查开机状态
      if (!this.controlDialog.isBatch) {
        const row = this.controlDialog.row
        if (row.powerStatus === 0 && this.controlForm.powerStatus !== 1) {
          this.$message.warning('设备未开机，请先开机后再进行其他操作')
          return
        }
      }

      // 温度范围检查
      if (this.controlForm.targetTemperature < 16 || this.controlForm.targetTemperature > 31) {
        this.$message.warning('温度范围应在16-31℃之间')
        return
      }

      this.submitting = true
      try {
        if (this.controlDialog.isBatch) {
          // 批量控制 - 使用批量接口
          const query = this.selectedData.map(item => ({
            addr: item.addr,
            airId: item.id,
            gatewayId: item.gatewayId,
            indoorUnitId: item.indoorUnitId,
            ...this.controlForm
          }))

          const response = await airInfoBatchBindAir(query)

          if (response.code === 200) {
            this.$message.success(response.msg || '批量控制成功')
          } else {
            this.$message.error(response.msg || '批量控制失败')
          }
        } else {
          // 单个控制
          const row = this.controlDialog.row
          const response = await airInfoControlAir({
            addr: row.addr,
            airId: row.id,
            gatewayId: row.gatewayId,
            indoorUnitId: row.indoorUnitId,
            ...this.controlForm
          })

          if (response.code === 200) {
            this.$message.success(response.msg || '控制成功')
          } else {
            this.$message.error(response.msg || '控制失败')
          }
        }

        this.controlDialog.visible = false
        this.fetchTableData()
      } catch (error) {
        this.$message.error('控制失败')
        console.error('控制失败:', error)
      } finally {
        this.submitting = false
      }
    },

    // 温度调节
    adjustTemperature (delta) {
      const newTemp = this.controlForm.targetTemperature + delta
      if (newTemp >= 16 && newTemp <= 31) {
        this.controlForm.targetTemperature = newTemp
      } else if (newTemp < 16) {
        this.$message.warning('最低温度不能低于16℃')
      } else if (newTemp > 31) {
        this.$message.warning('最高温度不能高于31℃')
      }
    },

    // 定时任务温度调节
    adjustTimingTemperature (delta) {
      const newTemp = this.timingForm.targetTemperature + delta
      if (newTemp >= 16 && newTemp <= 31) {
        this.timingForm.targetTemperature = newTemp
      } else if (newTemp < 16) {
        this.$message.warning('最低温度不能低于16℃')
      } else if (newTemp > 31) {
        this.$message.warning('最高温度不能高于31℃')
      }
    },

    // 锁定
    handleLock (row) {
      this.lockDialog.row = row
      this.lockDialog.isBatch = false
      this.lockForm = {
        lockPowerStatus: row.lockPowerStatus || 0,
        lockOperationMode: row.lockOperationMode || 0,
        lockFanSpeed: row.lockFanSpeed || 0,
        minTemperature: row.minTemperature || undefined,
        maxTemperature: row.maxTemperature || undefined
      }
      this.lockDialog.visible = true
    },

    // 锁定保存
    async handleLockSave () {
      // 温度范围验证
      if (this.lockForm.minTemperature && this.lockForm.maxTemperature) {
        if (this.lockForm.minTemperature < 16) {
          this.$message.warning('最低温度不能低于16℃')
          return
        }
        if (this.lockForm.maxTemperature > 31) {
          this.$message.warning('最高温度不能高于31℃')
          return
        }
        if (this.lockForm.maxTemperature < this.lockForm.minTemperature) {
          this.$message.warning('最低温度不能高于最高温度')
          return
        }
      }

      this.submitting = true
      try {
        let response
        if (this.lockDialog.isBatch) {
          // 批量锁定
          const query = this.selectedData.map((item) => ({
            addr: item.addr,
            airId: item.id,
            gatewayId: item.gatewayId,
            indoorUnitId: item.indoorUnitId,
            fanSpeed: this.lockForm.lockFanSpeed,
            operationMode: this.lockForm.lockOperationMode,
            powerStatus: this.lockForm.lockPowerStatus,
            maxTemperature: this.lockForm.maxTemperature || 0,
            minTemperature: this.lockForm.minTemperature || 0
          }))

          response = await airInfoBathcLockAir(query)
        } else {
          // 单个锁定
          const row = this.lockDialog.row
          response = await airInfoLockAir({
            addr: row.addr,
            airId: row.id,
            gatewayId: row.gatewayId,
            indoorUnitId: row.indoorUnitId,
            fanSpeed: this.lockForm.lockFanSpeed,
            operationMode: this.lockForm.lockOperationMode,
            powerStatus: this.lockForm.lockPowerStatus,
            maxTemperature: this.lockForm.maxTemperature || 0,
            minTemperature: this.lockForm.minTemperature || 0
          })
        }

        if (response.code === 200) {
          this.$message.success(response.msg || (this.lockDialog.isBatch ? '批量锁定成功' : '锁定成功'))
          this.lockDialog.visible = false
          this.scheduleLockStatusRefresh()
        } else {
          this.$message.error(response.msg || (this.lockDialog.isBatch ? '批量锁定失败' : '锁定失败'))
        }
      } catch (error) {
        this.$message.error('锁定失败')
        console.error('锁定失败:', error)
      } finally {
        this.submitting = false
      }
    },

    // 解锁（单次：确认后执行）
    async handleUnlock (row) {
      try {
        await this.$confirm(
          this.$t('deviceConditioning.confirmUnlockSingle'),
          this.$t('deviceConditioning.dialogTip'),
          {
            confirmButtonText: this.$t('deviceConditioning.dialogConfirm'),
            cancelButtonText: this.$t('deviceConditioning.dialogCancel'),
            type: 'warning'
          }
        )

        const query = {
          addr: row.addr,
          airId: row.id,
          gatewayId: row.gatewayId,
          indoorUnitId: row.indoorUnitId,
          fanSpeed: 0,
          operationMode: 0,
          powerStatus: 0,
          maxTemperature: 0,
          minTemperature: 0
        }

        const response = await airInfoLockAir(query)

        if (response.code === 200) {
          this.$message.success(response.msg || '解锁成功')
          this.scheduleLockStatusRefresh()
        } else {
          this.$message.error(response.msg || '解锁失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('解锁失败')
          console.error('解锁失败:', error)
        }
      }
    },

    // 定时
    handleTiming (row) {
      if (!this.canControl) return
      if (!row.billingMode) {
        this.$message.warning('设备计费方式参数为空，请补充后再执行定时操作！')
        return
      }

      this.resetTimingForm()
      this.timingDialog.row = row
      this.timingDialog.isBatch = false
      this.timingDialog.isEdit = false
      this.timingDevices = []
      this.timingDialog.visible = true
    },

    // 重置定时表单
    resetTimingForm () {
      this.timingForm = {
        taskType: 1,
        repeatType: 1,
        weekDays: [],
        executeDate: '',
        executeTime: '',
        powerStatus: 1,
        operationMode: 2,
        targetTemperature: 24,
        fanSpeed: 0,
        lockPowerStatus: 0,
        lockOperationMode: 0,
        lockFanSpeed: 0,
        minTemperature: 16,
        maxTemperature: 31
      }
    },

    // 重复方式改变
    handleRepeatTypeChange (type) {
      this.timingForm.repeatType = type
      if (type === 1) {
        this.timingForm.executeDate = ''
      } else {
        this.timingForm.weekDays = []
      }
    },

    // 定时保存
    async handleTimingSave () {
      if (!this.canControl) return
      // 表单验证
      if (!this.timingForm.taskType) {
        this.$message.warning('控制类型不能为空')
        return
      }

      if (this.timingForm.repeatType === 1 && this.timingForm.weekDays.length === 0) {
        this.$message.warning('请选择星期')
        return
      }

      if (this.timingForm.repeatType === 2 && !this.timingForm.executeDate) {
        this.$message.warning('请选择执行日期')
        return
      }

      if (!this.timingForm.executeTime) {
        this.$message.warning('请选择执行时间')
        return
      }

      // 温度范围验证(锁定模式)
      if (this.timingForm.taskType === 2) {
        if (this.timingForm.minTemperature && this.timingForm.maxTemperature) {
          if (this.timingForm.minTemperature < 16) {
            this.$message.warning('最低温度不能低于16℃')
            return
          }
          if (this.timingForm.maxTemperature > 31) {
            this.$message.warning('最高温度不能高于31℃')
            return
          }
          if (this.timingForm.maxTemperature < this.timingForm.minTemperature) {
            this.$message.warning('最低温度不能高于最高温度')
            return
          }
        }
      }

      this.submitting = true
      try {
        // 获取设备列表
        let devices = []
        if (this.timingDialog.isEdit) {
          // 编辑模式
          if (this.timingDevices.length === 0) {
            this.$message.warning('请选择定时设备')
            return
          }
          devices = this.timingDevices
        } else if (this.timingDialog.isBatch) {
          // 批量模式
          devices = this.selectedData
        } else {
          // 单个模式
          devices = [this.timingDialog.row]
        }

        // 构建参数
        const query = {
          managerId: this.queryData.managerId,
          airIds: devices.map(d => d.id).join(','),
          taskType: this.timingForm.taskType,
          repeatType: this.timingForm.repeatType,
          time: this.timingForm.executeTime,
          isEnabled: 1
        }

        // 添加周期或日期
        if (this.timingForm.repeatType === 1) {
          query.repeatWeeks = this.timingForm.weekDays.join(',')
        } else {
          query.repeatDay = this.timingForm.executeDate
        }

        // 添加控制或锁定参数
        if (this.timingForm.taskType === 1) {
          // 控制参数
          query.powerStatus = this.timingForm.powerStatus
          query.operationMode = this.timingForm.operationMode
          query.targetTemperature = this.timingForm.targetTemperature
          query.fanSpeed = this.timingForm.fanSpeed
        } else {
          // 锁定参数
          query.lockPowerStatus = this.timingForm.lockPowerStatus
          query.lockOperationMode = this.timingForm.lockOperationMode
          query.lockFanSpeed = this.timingForm.lockFanSpeed
          query.minTemperature = this.timingForm.minTemperature || 0
          query.maxTemperature = this.timingForm.maxTemperature || 0
        }

        let response
        if (this.timingDialog.isEdit) {
          // 编辑
          query.id = this.timingDialog.editId
          response = await airScheduledTaskEditAirScheduledTasks(query)
        } else {
          // 新增
          response = await airScheduledTaskAddAirScheduledTasks(query)
        }

        if (response.code === 200) {
          this.$message.success(this.timingDialog.isEdit ? '编辑成功' : '定时任务设置成功')
          this.timingDialog.visible = false
        } else {
          this.$message.error(response.msg || '操作失败')
        }
      } catch (error) {
        this.$apiError.notify(error, '操作失败')
        console.error('定时任务设置失败:', error)
      } finally {
        this.submitting = false
      }
    },

    // 更多操作命令
    handleMoreCommand (row, command) {
      if (!this.canControl && (command === 'timing' || command === 'edit')) return
      if (!this.canView && (command === 'detail' || command === 'history')) return
      switch (command) {
        case 'timing':
          this.handleTiming(row)
          break
        case 'edit':
          this.handleEdit(row)
          break
        case 'detail':
          this.handleDetail(row)
          break
        case 'history':
          this.handleViewHistory(row)
          break
      }
    },

    // ========== 定时任务列表相关 ==========

    // 查看定时任务
    async handleViewTiming () {
      if (!this.canView) return
      try {
        const response = await airScheduledTaskPageAirScheduledTask({
          managerId: this.queryData.managerId,
          page: {
            current: this.timingPage.current,
            size: this.timingPage.pageSize
          }
        })

        if (response.code === 200 && response.data) {
          this.timingList = response.data.dataList || []
          this.timingPage.total = response.data.total || 0
          this.timingListDialog.visible = true
        } else {
          this.$message.error(response.msg || '获取定时任务失败')
        }
      } catch (error) {
        this.$message.error('获取定时任务失败')
        console.error('获取定时任务失败:', error)
      }
    },

    // 格式化定时日期
    formatTimingDate (row) {
      if (row.repeatType == 1 && row.repeatWeeks) {
        // 周期
        const weeks = row.repeatWeeks.split(',')
        const weekLabels = weeks.map(w => {
          const weekItem = this.enums.taskWeek.find(item => item.value === w)
          return weekItem ? weekItem.label : ''
        }).filter(Boolean)
        return weekLabels.join(';')
      } else if (row.repeatType == 2) {
        // 日期
        return row.repeatDay || '-'
      }
      return '-'
    },

    // 格式化定时操作
    formatTimingAction (row) {
      let result = ''
      if (row.taskType == 1) {
        // 控制
        const powerLabel = this.enums.powerStatus.find(e => e.value === row.powerStatus)?.label || ''
        const modeLabel = this.enums.operationMode.find(e => e.value === row.operationMode)?.label || ''
        const fanLabel = this.enums.fanSpeed.find(e => e.value === row.fanSpeed)?.label || ''
        result = `${powerLabel}、${modeLabel}、${fanLabel}、${row.targetTemperature}℃`
      } else {
        // 锁定
        const lockPowerLabel = this.enums.lockPowerStatus.find(e => e.value === row.lockPowerStatus)?.label || ''
        const lockModeLabel = this.enums.lockOperationMode.find(e => e.value === row.lockOperationMode)?.label || ''
        const lockFanLabel = this.enums.lockFanSpeed.find(e => e.value === row.lockFanSpeed)?.label || ''
        result = `${lockPowerLabel}、${lockModeLabel}、${lockFanLabel}`
        if (row.minTemperature && row.maxTemperature) {
          result += `、${row.minTemperature}-${row.maxTemperature}℃`
        }
      }
      return result
    },

    // 编辑定时任务
    async handleEditTiming (row) {
      if (!this.canControl) return
      try {
        // 获取设备列表
        const response = await airScheduledTaskListAirInfoByIds({
          ids: row.airIds
        })

        if (response.code === 200 && response.data) {
          this.timingDevices = response.data.map(item => this.formatAirData(item))

          // 回显表单数据
          this.timingForm = {
            taskType: row.taskType,
            repeatType: row.repeatType,
            weekDays: row.repeatWeeks ? row.repeatWeeks.split(',') : [],
            executeDate: row.repeatDay || '',
            executeTime: row.time || '',
            // 控制参数
            powerStatus: row.powerStatus ?? 1,
            operationMode: row.operationMode ?? 2,
            targetTemperature: row.targetTemperature ?? 24,
            fanSpeed: row.fanSpeed ?? 0,
            // 锁定参数
            lockPowerStatus: row.lockPowerStatus ?? 0,
            lockOperationMode: row.lockOperationMode ?? 0,
            lockFanSpeed: row.lockFanSpeed ?? 0,
            minTemperature: row.minTemperature ?? 16,
            maxTemperature: row.maxTemperature ?? 31
          }

          this.timingDialog.isEdit = true
          this.timingDialog.editId = row.id
          this.timingDialog.isBatch = false
          this.timingDialog.row = null
          this.timingDialog.visible = true
        }
      } catch (error) {
        this.$message.error('获取定时任务详情失败')
        console.error('获取定时任务详情失败:', error)
      }
    },

    // 添加设备(编辑定时任务用)
    async handleAddDevices () {
      try {
        // 获取所有设备列表
        const response = await airInfoListAirInfo({
          managerId: this.queryData.managerId
        })

        if (response.code === 200 && response.data) {
          this.allDeviceList = response.data
          this.filteredDeviceList = response.data
          this.deviceFilterName = ''

          // 回显已选设备
          this.selectedDevices = this.timingDevices.map(d => d.id)

          this.addDeviceDialog.visible = true

          // 勾选已选设备
          this.$nextTick(() => {
            this.filteredDeviceList.forEach(device => {
              if (this.selectedDevices.includes(device.id)) {
                this.$refs.deviceTable.toggleRowSelection(device, true)
              }
            })
          })
        }
      } catch (error) {
        this.$message.error('获取设备列表失败')
        console.error('获取设备列表失败:', error)
      }
    },

    // 筛选设备列表
    filterDeviceList () {
      if (!this.deviceFilterName) {
        this.filteredDeviceList = this.allDeviceList
      } else {
        this.filteredDeviceList = this.allDeviceList.filter(item => {
          const id = item.id + ''
          return item.name.includes(this.deviceFilterName) || id.includes(this.deviceFilterName)
        })
      }
    },

    // 设备选择改变
    handleDeviceSelectionChange (selection) {
      this.selectedDevices = selection.map(item => item.id)
    },

    // 确认添加设备
    handleConfirmAddDevices () {
      if (!this.canControl) return
      this.timingDevices = this.allDeviceList
        .filter(item => this.selectedDevices.includes(item.id))
        .map(item => this.formatAirData(item))
      this.addDeviceDialog.visible = false
    },

    // 删除设备
    handleRemoveDevice (index) {
      if (!this.canControl) return
      this.timingDevices.splice(index, 1)
    },

    // 切换定时任务状态
    async handleToggleTimingStatus (row) {
      if (!this.canControl) return
      try {
        const response = await airScheduledTaskUpdateEnabled({
          id: row.id,
          isEnabled: row.isEnabled == 1 ? 0 : 1
        })

        if (response.code === 200) {
          this.$message.success('操作成功')
          this.handleViewTiming()
        } else {
          this.$message.error(response.msg || '操作失败')
        }
      } catch (error) {
        this.$apiError.notify(error, '操作失败')
        console.error('操作失败:', error)
      }
    },

    // 删除定时任务
    async handleDeleteTimingTask (row) {
      if (!this.canControl) return
      try {
        await this.$confirm('确定要删除该定时任务吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await airScheduledTaskDelete({ id: row.id })

        if (response.code === 200) {
          this.$message.success('删除成功')
          this.handleViewTiming()
        } else {
          this.$message.error(response.msg || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
          console.error('删除失败:', error)
        }
      }
    },

    // ========== 详情相关 ==========

    // 查看详情
    async handleDetail (row) {
      if (!this.canView) return
      this.detailDrawer.data = row
      this.detailActiveTab = 'detail'
      this.detailDrawer.visible = true

      // 设置默认时间范围（最近7天）
      this.energyDateRange = [
        moment().subtract(7, 'days').format('YYYY-MM-DD'),
        moment().format('YYYY-MM-DD')
      ]

      // 加载详情数据
      await Promise.all([
        this.loadControlHistory(row.id),
        this.loadEnergyData(row.id)
      ])
    },

    // 加载控制历史
    async loadControlHistory (airId) {
      try {
        const response = await airControlLogPageAirGateWay({
          airId,
          page: {
            current: 1,
            size: 30
          }
        })

        if (response.code === 200 && response.data) {
          const dataList = response.data.dataList || []
          this.controlHistory = dataList.map(item => this.formatLogData(item))
        }
      } catch (error) {
        console.error('加载控制历史失败:', error)
      }
    },

    // 格式化日志数据
    formatLogData (item) {
      if (item.setType == 1) {
        // 开关
        const statusItem = this.enums.powerStatus.find(e => e.value == item.setVal)
        item.setValLable = statusItem ? statusItem.label : '-'
      } else if (item.setType == 2) {
        // 模式
        const modeItem = this.enums.operationMode.find(e => e.value == item.setVal)
        item.setValLable = modeItem ? modeItem.label : '-'
      } else if (item.setType == 3 && item.setVal && item.setVal.indexOf('-') !== -1) {
        // 锁定
        const arr = item.setVal.split('-')
        const strArr = []
        arr.forEach((val, index) => {
          if (val != 0) {
            if (index === 0) {
              const lockPowerItem = this.enums.lockPowerStatus.find(e => e.value == val)
              if (lockPowerItem) strArr.push(lockPowerItem.label)
            } else if (index === 1) {
              const lockModeItem = this.enums.lockOperationMode.find(e => e.value == val)
              if (lockModeItem) strArr.push(lockModeItem.label)
            } else if (index === 2) {
              const lockFanItem = this.enums.lockFanSpeed.find(e => e.value == val)
              if (lockFanItem) strArr.push(lockFanItem.label)
            } else if (index === 3 || index === 4) {
              strArr.push(val)
            }
          }
        })
        item.setValLable = strArr.length ? strArr.join('-') : '解锁'
      } else {
        item.setValLable = item.setVal || '-'
      }
      return item
    },

    // 查看控制历史(独立弹窗)
    async handleViewHistory (item) {
      this.historyDialog.airId = item.id
      this.historyPage.current = 1
      await this.loadHistoryDialogData()
      this.historyDialog.visible = true
    },

    // 加载控制历史弹窗数据
    async loadHistoryDialogData () {
      try {
        const response = await airControlLogPageAirGateWay({
          airId: this.historyDialog.airId,
          page: {
            current: this.historyPage.current,
            size: this.historyPage.pageSize
          }
        })

        if (response.code === 200 && response.data) {
          const dataList = response.data.dataList || []
          this.historyDialogData = dataList.map(item => this.formatLogData(item))
          this.historyPage.total = response.data.total || 0
        }
      } catch (error) {
        console.error('加载控制历史失败:', error)
      }
    },

    // 加载用能数据
    async loadEnergyData (airId) {
      if (!this.energyDateRange || this.energyDateRange.length !== 2) {
        return
      }

      try {
        const response = await airInfoQueryAirUseStatis({
          airId,
          startDate: this.energyDateRange[0],
          endDate: this.energyDateRange[1]
        })

        if (response.code === 200 && response.data) {
          const time = 60 * 60
          this.energyData = (response.data || []).map(item => {
            item.highSpeedTime = item.highSpeedTime ? (item.highSpeedTime / time).toFixed(2) : '0.00'
            item.midSpeedTime = item.midSpeedTime ? (item.midSpeedTime / time).toFixed(2) : '0.00'
            item.lowSpeedTime = item.lowSpeedTime ? (item.lowSpeedTime / time).toFixed(2) : '0.00'
            item.autoSpeedTime = item.autoSpeedTime ? (item.autoSpeedTime / time).toFixed(2) : '0.00'
            item.totalTime = item.totalTime ? (item.totalTime / time).toFixed(2) : '0.00'
            item.highSpeedElec = item.highSpeedElec || '0.00'
            item.midSpeedElec = item.midSpeedElec || '0.00'
            item.lowSpeedElec = item.lowSpeedElec || '0.00'
            item.autoSpeedElec = item.autoSpeedElec || '0.00'
            item.totalElec = item.totalElec || '0.00'
            return item
          })
        }
      } catch (error) {
        console.error('加载用能数据失败:', error)
      }
    },

    // 用能日期改变
    handleEnergyDateChange () {
      if (this.detailDrawer.data) {
        this.loadEnergyData(this.detailDrawer.data.id)
      }
    },

    // 获取日志类型标签
    getLogTypeLabel (type) {
      const logTypeItem = this.enums.airlogType.find(e => e.value === type)
      return logTypeItem ? logTypeItem.label : '-'
    },

    handleCardHeaderClick (row) {
      if (!this.canView) return
      this.handleDetail(row)
    },

    // 关闭详情抽屉
    handleDetail (row) {
      this.detailDrawer.data = row
      this.detailDrawer.visible = true
    },

    // ========== 其他操作 ==========

    // 绑定信息点击
    handleBindClick (row) {
      // 如果是公摊表(bindType=2)，跳转到公摊详情页
      if (row.bindType == 2) {
        this.$router.push({
          path: '/metering/fee/conditioningSharing/detail',
          query: {
            id: row.bindId
          }
        })
        return
      }

      this.$router.push({
        path: `/metering/tenant/detail/${row.bindId}`,
        query: {
          name: row.tenantName || '',
          from: 'list'
        }
      })
    },

    // 表格选择变化（按 id 合并跨页选中，避免翻页后只保留当前页）
    handleSelectionChange (selection) {
      if (this._restoringTableSelection) return

      const currentPageIdSet = new Set(this.tableData.map(row => row.id))
      const keptFromOtherPages = this.selectedData.filter(
        item => !currentPageIdSet.has(item.id)
      )
      const seen = new Set()
      this.selectedData = [...keptFromOtherPages, ...selection].filter(item => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    },

    // ========== 分页相关 ==========

    // 分页大小变化
    handleSizeChange (val) {
      this.queryData.pageSize = val
      this.queryData.current = 1
      this.fetchTableData()
    },

    // 当前页变化
    handleCurrentChange (val) {
      this.queryData.current = val
      this.fetchTableData()
    },

    // 定时任务分页
    handleTimingSizeChange (val) {
      this.timingPage.pageSize = val
      this.timingPage.current = 1
      this.handleViewTiming()
    },

    handleTimingCurrentChange (val) {
      this.timingPage.current = val
      this.handleViewTiming()
    },

    // 控制历史分页
    handleHistorySizeChange (val) {
      this.historyPage.pageSize = val
      this.historyPage.current = 1
      this.loadHistoryDialogData()
    },

    handleHistoryCurrentChange (val) {
      this.historyPage.current = val
      this.loadHistoryDialogData()
    },

    // 外机列表「查看」→ 关系图
    handleViewRelation (row) {
      if (!this.canView) return
      this.currentOutdoorSystem = row
      this.relationDialog.visible = true
      // 移除手动调用，改为 el-drawer 的 @opened 事件触发
    },

    initRelationChart () {
      if (!this.currentOutdoorSystem || !this.$refs.relationChart) return

      if (this.relationChart) {
        this.relationChart.dispose()
      }
      this.relationChart = this.$echarts.init(this.$refs.relationChart)

      const { name, serial, airList, addr, meterList: rawMeterList } = this.currentOutdoorSystem
      const nodes = []
      const links = []

      // 数据预处理
      // 优先使用 meterList 数组中的 serial，如果没有则使用 serial 字符串分割
      let meterList = []
      if (Array.isArray(rawMeterList) && rawMeterList.length > 0) {
        meterList = rawMeterList.map(item => item.serial || item)
      } else if (serial) {
        meterList = serial.split(',')
      }

      let airs = []
      try {
        if (Array.isArray(airList)) {
          airs = airList
        } else if (typeof airList === 'string') {
          airs = JSON.parse(airList)
        }
      } catch (e) {
        console.warn('解析空调列表失败:', e)
        airs = []
      }

      // 画布尺寸配置
      const width = this.$refs.relationChart.offsetWidth
      // 动态计算高度，防止节点拥挤
      const maxNodes = Math.max(meterList.length, airs.length, 1)
      const minHeight = 300 // 降低默认高度
      const nodeHeight = 50 // 节点基础高度
      const dynamicHeight = Math.max(minHeight, maxNodes * nodeHeight + 80)
      const height = dynamicHeight

      // 更新容器高度
      this.$refs.relationChart.style.height = `${height}px`

      // 如果使用了 echarts 的 resize 方法，需要调用
      if (this.relationChart) {
        this.relationChart.resize()
      }

      const centerX = width / 2
      const centerY = height / 2
      const leftX = width * 0.15 // 左侧节点位置 (15%)
      const rightX = width * 0.85 // 右侧节点位置 (85%)

      // 样式配置
      const activeColor = '#409EFF' // 激活色(蓝)
      const normalColor = '#F4F4F5' // 普通色(灰)
      const activeTextColor = '#fff'
      const normalTextColor = '#606266'
      const borderColor = '#DCDFE6'
      const borderRadius = 8
      const symbolSize = [180, 40] // 默认节点尺寸

      // 1. 中间节点 (外机系统)
      const centerName = name || addr || '--'
      nodes.push({
        name: centerName,
        x: centerX,
        y: centerY,
        value: '外机系统',
        symbolSize: [240, 50], // 中间节点更宽更大
        itemStyle: {
          color: activeColor,
          borderColor: activeColor,
          borderRadius: borderRadius
        },
        label: {
          color: activeTextColor,
          fontSize: 14,
          fontWeight: 'bold'
        },
        symbol: 'rect'
      })

      // 2. 左侧节点 (电表)
      const meterCount = meterList.length
      meterList.forEach((m, index) => {
        const y =
          meterCount === 1
            ? centerY
            : (height / (meterCount + 1)) * (index + 1)

        nodes.push({
          name: m || '--',
          x: leftX,
          y: y,
          value: '电表',
          itemStyle: {
            color: normalColor,
            borderColor: borderColor,
            borderWidth: 1,
            borderRadius: borderRadius
          },
          label: {
            color: normalTextColor
          },
          symbol: 'rect'
        })

        // 连线：电表 -> 外机
        links.push({
          source: m || '--',
          target: centerName,
          lineStyle: {
            curveness: 0.1
          }
        })
      })

      // 3. 右侧节点 (空调)
      const airCount = airs.length
      airs.forEach((air, index) => {
        const airName = air.name || '--'
        const y =
          airCount === 1 ? centerY : (height / (airCount + 1)) * (index + 1)
        const nodeId = `air_${air.id || index}`

        nodes.push({
          name: nodeId,
          x: rightX,
          y: y,
          value: '内机系统 ' + airName,
          itemStyle: {
            color: normalColor,
            borderColor: borderColor,
            borderWidth: 1,
            borderRadius: borderRadius
          },
          label: {
            show: true,
            formatter: '内机系统 ' + airName,
            color: normalTextColor
          },
          symbol: 'rect',
          raw: air
        })

        // 连线：外机 -> 空调
        links.push({
          source: centerName,
          target: nodeId,
          lineStyle: {
            curveness: 0.1
          }
        })
      })

      const option = {
        title: { show: false },
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            if (params.dataType === 'edge') return ''
            return params.data.value || params.name
          }
        },
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [
          {
            type: 'graph',
            layout: 'none',
            symbol: 'rect',
            symbolSize: symbolSize,
            roam: true,
            label: {
              show: true,
              fontSize: 12
            },
            edgeSymbol: ['none', 'none'],
            edgeSymbolSize: [4, 10],
            edgeLabel: { fontSize: 20 },
            data: nodes,
            links: links,
            lineStyle: {
              opacity: 0.9,
              width: 1,
              curveness: 0.1,
              color: '#909399'
            }
          }
        ]
      }

      this.relationChart.setOption(option)
      this.relationChart.off('click')
      this.relationChart.on('click', (params) => {
        if (!params || params.dataType !== 'node') return
        const d = params.data || {}
        if (d.value !== '电表') return
        const serial = d.name && d.name !== '--' ? String(d.name) : ''
        if (!serial) return
        this.relationDialog.visible = false
        this.$router.push({ path: '/device/electricity', query: { serial, autoSearch: 'true' } })
      })
    }
  }
}
</script>
<style lang="scss" scoped>
// ==================== 引入表格页面公共样式 ====================
@import "@/assets/styles/table-page.scss";

// ---------- 页面结构：上 Tab / 中查询 / 下内容（与电表规范对齐） ----------
.table-page-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

// Tab 导航、查询、内容 三个独立白盒；模块之间等距 16px（与电表页层次一致）
.indoor-tab-pane,
.outdoor-tab-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.search-box {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.outdoor-search-box {
  flex-shrink: 0;

  /* 不用 inline + float：否则会打乱 el-form 高度计算，出现整块查询白盒被异常撑高 */
  .outdoor-search-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 12px;
    width: 100%;
  }

  .outdoor-search-field {
    flex: 0 0 auto;
    margin-bottom: 0;
  }

  .outdoor-search-right {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex: 1 1 auto;
    min-width: 0;

    /* 与 Tab1 查询区 .search-actions 内按钮同尺寸、同色（导出等） */
    ::v-deep .el-button + .el-button {
      margin-left: 0 !important;
    }

    ::v-deep .el-button {
      height: 32px;
      padding: 0 14px;
      font-size: 13px;
      border-radius: 6px;
    }

    ::v-deep .el-button--success {
      background: #52c41a;
      border-color: #52c41a;

      &:hover {
        background: #73d13d;
        border-color: #73d13d;
      }
    }
  }

  ::v-deep .el-form-item {
    margin-bottom: 0 !important;
    margin-right: 0 !important;
  }

  /* 与内页筛选区一致：灰边框，避免默认主色描边 */
  ::v-deep .el-select .el-input__inner {
    border-radius: 6px;
    border-color: #e4e7ed;
    font-size: 13px;
  }

  ::v-deep .el-select .el-input.is-focus .el-input__inner,
  ::v-deep .el-select .el-input__inner:focus {
    border-color: #c0c4cc;
  }
}

.content-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  flex: 1;
  padding: 16px 16px 10px;
  min-width: 0;
}

.search-form {
  margin: 0;

  .search-main-grid {
    width: 100%;
    display: grid;
    align-items: center;
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    gap: 10px;
  }

  .field-item {
    width: 100%;
    min-width: 0;

    ::v-deep .el-input,
    ::v-deep .el-select {
      width: 100%;
      display: block;
    }

    ::v-deep .el-input__inner,
    ::v-deep .el-select .el-input__inner {
      height: 32px;
      line-height: 32px;
      border-radius: 6px;
      border-color: #e4e7ed;
      font-size: 13px;

      &::placeholder {
        color: #c0c4cc;
      }
    }

    ::v-deep .el-input__prefix {
      display: flex;
      align-items: center;
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
    grid-column: 4 / 6;
    justify-self: start;
    line-height: 1;

    ::v-deep .el-button + .el-button {
      margin-left: 0 !important;
    }

    ::v-deep .el-button {
      height: 32px;
      padding: 0 14px;
      font-size: 13px;
      border-radius: 6px;
    }

    ::v-deep .el-button--primary {
      background: #1677ff;
      border-color: #1677ff;

      &:hover {
        background: #4096ff;
        border-color: #4096ff;
      }
    }

    ::v-deep .el-button--success {
      background: #52c41a;
      border-color: #52c41a;

      &:hover {
        background: #73d13d;
        border-color: #73d13d;
      }
    }
  }
}

.content-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 8px;
  flex-wrap: wrap;
  gap: 8px;

  .toolbar-left {
    .section-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #111827;

      .title-bar {
        width: 3px;
        height: 16px;
        background: #1677ff;
        border-radius: 2px;
        flex-shrink: 0;
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    // 工具栏内所有 small 按钮统一 32px 高（含下拉触发器「批量操作」warning，避免与主按钮/排序/切换不一致）
    ::v-deep .el-button.el-button--small {
      min-height: 32px;
      height: 32px;
      padding: 0 14px;
      font-size: 13px;
      line-height: 1;
      border-radius: 6px;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    ::v-deep .el-dropdown {
      vertical-align: middle;
    }

    ::v-deep .el-button--primary {
      background: #1677ff;
      border-color: #1677ff;

      &:hover {
        background: #4096ff;
        border-color: #4096ff;
      }
    }

    ::v-deep .el-select .el-input__inner {
      height: 32px;
      line-height: 32px;
      font-size: 13px;
      border-radius: 6px;
      border-color: #e4e7ed;
    }

    .view-switch-group {
      ::v-deep .el-radio-group {
        .el-radio-button__inner {
          height: 32px;
          line-height: 32px;
          padding: 0 12px;
          font-size: 13px;
        }
      }
    }
  }
}

.list-view {
  padding: 0;

  /* 与电表/水表列表一致，便于与卡片区 .card-view > div 的 8px 对齐 */
  .light-border-table {
    margin-top: 8px;
  }
}

.card-view {
  padding: 0;

  /* 与电表/水表一致：工具栏下 8px + 本区 8px，与 content-box 上内边距对称 */
  > div {
    margin-top: 8px;
  }
}

// ---------- 手写 Tab 顶栏：选中为黑粗字 + 短蓝条；蓝条贴齐白盒最底边；字号与上下留白加大 ----------
.tab-nav-box {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0 32px;
  margin: 0 0 16px;
  /* 顶/侧留白：文字不贴顶；底边仍无 padding，指示条贴齐白盒下缘 */
  padding: 16px 24px 0 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.tab-nav-item {
  position: relative;
  /* 下内边距略大于指示条高度，文字与蓝条间距贴近设计稿（约 5～6px） */
  padding: 0 10px 9px;
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  color: #6b7280;
  font-weight: 400;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;

  &:hover {
    color: #374151;
  }

  &:focus-visible {
    outline: 2px solid rgba(22, 119, 255, 0.45);
    outline-offset: 2px;
    border-radius: 4px;
  }

  &.is-active {
    color: #111827;
    font-weight: 700;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      width: 32px;
      height: 3px;
      border-radius: 999px;
      background: #1677ff;
    }
  }
}

.tab-panel-wrap {
  min-width: 0;
}

// ==================== 变量定义 ====================
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$lock-icon-color: #d46b08;
$danger-color: #f56c6c;
$info-color: #909399;
$bg-color: #f5f7fa;
$border-color: #dcdfe6;
$text-color: #303133;
$text-secondary: #909399;
$text-placeholder: #c0c4cc;

// 选中提示栏
.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  margin-bottom: 16px;

  strong {
    color: $primary-color;
    font-size: 16px;
    margin: 0 4px;
  }
}

// 卡片网格
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

// 空调卡片（tab1 旧样式：保留给其它位置使用，tab1 已切到 .ac-design-card）
.air-card {
  background: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid #e8e8e8;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  &.is-selected {
    border: 2px solid $primary-color;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  }

  &.is-offline {
    .temp-panel-new {
      opacity: 0.6;
    }
  }

  // tab1 已不再复用旧结构，这里不再承载拓扑内机样式

  // 选择框
  .card-checkbox {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
  }

  // 卡片头部
  .card-header {
    padding: 16px 16px 12px 48px;
    border-bottom: 1px solid #e8e8e8;
    background: white;

    &.clickable {
      cursor: pointer;

      &:hover {
        .device-name {
          color: $primary-color;

          .name-arrow {
            color: $primary-color;
          }
        }
      }
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .device-name {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 16px;
        font-weight: 600;
        color: $text-color;
        flex: 1;
        min-width: 0;
        padding-right: 8px;

        .name-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }

        .name-arrow {
          flex-shrink: 0;
          color: $text-secondary;
          font-size: 14px;
        }
      }

      .fault-code {
        color: #f56c6c;
        font-size: 14px;
        font-weight: 500;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 0;
      }
    }

    .device-serial {
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 8px;
    }

    .device-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  // 温度显示面板
  .temp-panel-new {
    display: grid;
    grid-template-columns: 1fr 100px;
    grid-template-rows: auto auto;
    gap: 12px;
    padding: 20px 16px;
    background: #f5f5f5;
    transition: opacity 0.3s ease;

    &.disabled {
      opacity: 0.5;
    }

    .temp-display {
      grid-column: 1;
      grid-row: 1 / 3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 8px;
      padding: 16px;

      .temp-label {
        font-size: 12px;
        color: $text-secondary;
        margin-bottom: 8px;
      }

      .temp-value-large {
        font-size: 72px;
        font-weight: 200;
        line-height: 1;
        color: $text-color;
        font-family: 'Arial', sans-serif;
        letter-spacing: -2px;
      }

      .temp-unit {
        font-size: 24px;
        color: $text-secondary;
        margin-top: -10px;
      }
    }
  }

  // 绑定计费方案弹窗样式
  // .price-detail-preview {
  //   display: flex;
  //   gap: 20px;
  //   align-items: center;
  //   height: 32px;
  //   width: 100%;

  //   .detail-item {
  //     display: flex;
  //     align-items: center;
  //     gap: 5px;

  //     .label {
  //       font-size: 14px;
  //       color: #606266;
  //       white-space: nowrap;
  //     }

  //     .value {
  //       font-size: 14px;
  //       color: #606266;
  //       white-space: nowrap;
  //     }
  //   }
  // }

  .room-temp {
    grid-column: 2;
    grid-row: 1;
    background: white;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    .room-temp-label {
      font-size: 11px;
      color: $text-secondary;
      line-height: 1.3;
      margin-bottom: 6px;
    }

    .room-temp-value {
      font-size: 16px;
      font-weight: 500;
      color: $text-color;
    }
  }

  .mode-fan-icons {
    grid-column: 2;
    grid-row: 2;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .icon-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: $text-color;
      background: white;
      padding: 6px 8px;
      border-radius: 4px;

      i {
        font-size: 16px;
        color: $primary-color;
      }

      // 风速F字母样式
      .fan-text {
        font-size: 14px;
        font-weight: 600;
        color: $primary-color;
      }
    }
  }

  // 卡片操作按钮
  .card-actions-new {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px 10px;
    background: white;
    border-top: 1px solid #e8e8e8;

    .action-btn {
      padding: 0 10px;
      margin: 0;
      border: 1px solid #ddd;
      background: #f8f8f8;
      border-radius: 4px;
      color: $text-color;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 26px;
      line-height: 26px;

      &:hover:not(:disabled) {
        // ✅ 添加 :not(:disabled)
        background: #e8e8e8;
        border-color: #bbb;
      }

      &.active {
        background: $primary-color;
        border-color: $primary-color;
        color: white;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #f8f8f8 !important;
        border-color: #ddd !important;
        color: $text-color !important;
      }

      i {
        font-size: 16px;
      }
    }
  }

  // 卡片底部
  .card-footer {
    padding: 12px 16px;
    background: white;
    border-top: 1px solid #e8e8e8;

    .footer-actions {
      display: flex;
      justify-content: space-around;
      gap: 8px;
    }
  }
}

// tab1「空调内机」卡片：按设计稿重构
.ac-design-card {
  position: relative;
  background: linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(242, 246, 252) 100%);
  border-radius: 12px;
  border: 1px solid rgb(220, 223, 230);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .06), inset 0 1px 0 rgba(255, 255, 255, .6);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, .12), inset 0 1px 0 rgba(255, 255, 255, .8);
    transform: translateY(-2px);
  }

  &.is-selected {
    border: 2px solid $primary-color;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  }

  .card-checkbox.inline {
    position: static;
    display: inline-flex;
    align-items: center;
    margin-right: 6px;
  }

  .ac-body {
    padding: 14px 14px 12px;
    background: transparent;

    &.clickable {
      cursor: pointer;
    }
  }

  .ac-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px 8px;
  }

  .ac-title-wrap {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }

  .ac-title {
    font-size: 14px;
    font-weight: 800;
    color: #111827;
    letter-spacing: 0.2px;
    line-height: 1.2;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ac-online {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(17, 24, 39, .65);
    flex-shrink: 0;
  }

  .ac-card-lock-icon {
    font-size: 13px;
    color: $lock-icon-color;
    line-height: 1;
  }

  .ac-status-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .ac-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    box-shadow: inset 0 1px 2px rgba(0,0,0,.2);
  }
  .ac-dot.online {
    background-color: #10b981;
    box-shadow: 0 0 4px #10b981, inset 0 1px 2px rgba(0,0,0,.2);
  }
  .ac-dot.offline {
    background: #9ca3af;
  }
  .ac-sub {
    margin-top: 0;
    font-size: 11px;
    font-weight: 700;
    color: #c7cbd1;
    padding: 0 14px 4px;
  }

  .ac-temp {
    margin-top: 0;
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    align-items: center;
    gap: 0;
    padding: 8px 14px 12px;
  }

  .ac-temp-mid {
    width: 1px;
    height: 44px;
    background: rgba(0, 0, 0, .12);
  }

  .ac-temp-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ac-temp-val-row {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .card-lock-icon {
    color: $lock-icon-color !important;
    font-size: 13px;
    line-height: 1;
    flex-shrink: 0;
  }

  .lock-field {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    > .item {
      display: inline-flex;
      align-items: center;
      line-height: 1;
    }
  }

  .ac-temp-val {
    font-size: 28px;
    font-weight: 800;
    color: #111827;
    line-height: 1;
  }

  .ac-temp-unit {
    font-size: 12px;
    font-weight: 700;
    margin-left: 2px;
    margin-top: 2px;
  }

  .ac-temp-label {
    font-size: 11px;
    color: rgba(17, 24, 39, .72);
  }

  .ac-temp-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .ac-temp-right-label {
    font-size: 11px;
    color: rgba(17, 24, 39, .72);
  }

  .ac-temp-right-val {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    line-height: 1;
  }

  .ac-mode {
    margin: 0 -14px 0;
    padding: 8px 14px 10px;
    background: rgba(255, 255, 255, .35);
    border-top: 1px solid rgba(0, 0, 0, .06);
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: rgba(17, 24, 39, .85);
  }

  .ac-mode-icon {
    font-size: 14px;
    margin-right: 2px;
    opacity: 0.8;
    color: inherit;
  }

  .ac-mode-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .ac-mode-dot {
    opacity: 0.35;
  }

  .ac-actions {
    margin-top: 0;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
    padding: 10px 10px 12px;
    border-top: 1px solid #e8e8e8;

    .ac-action-cell {
      width: 100%;
      min-width: 0;
    }

    // 下拉触发器占满各自 cell
    .ac-action-cell > .el-dropdown {
      width: 100%;
      min-width: 0;
      display: block;
    }
  }

  .ac-btn {
    width: 100%;
    min-width: 0;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 10px;
    border: 1px solid rgba(17, 24, 39, 0.28);
    background: #fff;
    color: #111827;
    font-size: 11px;
    font-weight: 800;
    padding: 0;
  }

  .ac-btn-with-lock {
    gap: 4px;

    .card-lock-icon {
      font-size: 12px;
    }

    > .item {
      display: inline-flex;
      align-items: center;
      line-height: 1;
    }
  }

  // 下拉里的按钮同样撑满
  ::v-deep .ac-action-cell .el-dropdown .ac-btn {
    width: 100%;
  }

  .ac-btn:hover:not(:disabled) {
    border-color: rgba(17, 24, 39, 0.42);
    background: #f9fafb;
  }

  .ac-btn.active {
    background: $primary-color;
    border-color: $primary-color;
    color: #fff;
  }

  .ac-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .ac-btn-icon {
    padding: 0;
  }

  .ac-btn-icon i {
    font-size: 14px;
  }
}

// ==================== 状态徽章 ====================
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  &::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &.online {
    background: rgba(103, 194, 58, 0.1);
    color: $success-color;

    &::before {
      background: $success-color;
      box-shadow: 0 0 6px rgba(103, 194, 58, 0.6);
    }
  }

  &.offline {
    background: rgba(245, 108, 108, 0.1);
    color: $danger-color;

    &::before {
      background: $danger-color;
    }
  }
}

// ==================== 带锁定图标的字段样式 ====================
.lock-field {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .lock-icon {
    color: $lock-icon-color;
    font-size: 13px;
  }

  // 👇 占位符：不可见但占空间
  .lock-icon-placeholder {
    font-size: 12px;
    opacity: 0; // 完全透明
    pointer-events: none; // 不响应鼠标事件
  }
}

// ==================== 设备数量样式 ====================
.device-count {
  color: $primary-color;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

// ==================== 状态点样式 ====================
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;

  &.online {
    background-color: $success-color;
    box-shadow: 0 0 6px rgba(103, 194, 58, 0.6);
  }

  &.offline {
    background-color: $info-color;
  }
}

.option-with-dot {
  display: flex;
  align-items: center;
}

// ==================== 温度文字样式 ====================
.temperature-text {
  color: $primary-color;
  font-weight: 500;
}

// ==================== 状态包装器 ====================
.status-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

// ==================== 控制弹窗 - 遥控器样式(修复按钮宽度) ====================
::v-deep .control-dialog-new {
  .el-dialog__body {
    padding: 20px;
    background: #f5f5f5;
  }
}

.ac-remote-control {
  background: #e8e8e8;
  border-radius: 12px;
  padding: 20px;

  // 设备编号
  .ac-device-number {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .number-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
      color: $text-color;
    }

    i {
      font-size: 20px;
      color: $text-secondary;
    }
  }

  // 状态指示器
  .ac-status-indicators {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .status-icon {
      font-size: 20px;
      color: $text-secondary;

      &.active {
        color: $success-color;
      }
    }

    .status-text {
      font-size: 14px;
      color: $text-secondary;
      font-weight: 500;
    }
  }

  // 设备序列号
  .ac-device-serial {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 16px;
  }

  // 温度显示区域
  .ac-temp-display {
    display: grid;
    grid-template-columns: 1fr 90px;
    grid-template-rows: auto auto;
    gap: 12px;
    margin-bottom: 16px;
    background: #d8d8d8;
    padding: 16px;
    border-radius: 8px;

    .temp-section {
      grid-column: 1;
      grid-row: 1 / 3;
      background: white;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .temp-label {
        font-size: 12px;
        color: $text-secondary;
        margin-bottom: 8px;
      }

      .temp-main {
        display: flex;
        align-items: baseline;

        .temp-value {
          font-size: 80px;
          font-weight: 200;
          line-height: 1;
          color: $text-color;
          font-family: 'Arial', sans-serif;
          letter-spacing: -3px;
        }

        .temp-unit {
          font-size: 28px;
          color: $text-secondary;
          margin-left: 4px;
        }
      }
    }

    .room-temp-section {
      grid-column: 2;
      grid-row: 1;
      background: white;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;

      .room-label {
        font-size: 11px;
        color: $text-secondary;
        line-height: 1.3;
        margin-bottom: 6px;
      }

      .room-value {
        font-size: 16px;
        font-weight: 500;
        color: $text-color;
      }
    }

    .mode-section {
      grid-column: 2;
      grid-row: 2;
      display: flex;
      flex-direction: column;
      gap: 6px;

      .mode-item {
        background: white;
        border-radius: 4px;
        padding: 6px 8px;
        display: flex;
        align-items: center;
        gap: 6px;

        .mode-icon {
          font-size: 16px;
          color: $primary-color;
        }

        .mode-label {
          font-size: 12px;
          color: $text-color;
        }

        // 风速F字母图标样式
        .fan-text-icon {
          font-size: 14px;
          font-weight: 700;
          color: $primary-color;
        }
      }
    }
  }

  // 控制按钮组 - 固定统一宽度
  .ac-control-buttons-fixed {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;

    .control-btn-fixed {
      height: 50px;
      width: 100%;
      border: 1px solid #ccc;
      background: #f8f8f8;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      color: $text-color;
      padding: 0;

      &:hover:not(:disabled) {
        background: #e8e8e8;
        border-color: #999;
        transform: translateY(-2px);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.active {
        background: $primary-color;
        border-color: $primary-color;
        color: white;
      }

      i {
        font-size: 20px;
      }
    }
  }
}

// ==================== 锁定弹窗样式 ====================
.lock-device-info {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;

  .device-name {
    font-size: 16px;
    font-weight: 600;
    color: $text-color;
    margin-bottom: 8px;
  }

  .device-serial {
    font-size: 12px;
    color: $text-secondary;
  }
}

.lock-form {
  .temperature-range {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .temp-hint {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 8px;
  }
}

// ==================== 定时任务弹窗样式(修复按钮宽度) ====================
::v-deep .timing-dialog-new {
  .el-dialog__body {
    padding: 20px;
    background: #f5f5f5;
  }
}

.timing-container {
  background: white;
  border-radius: 8px;
  padding: 20px;

  // 设备编号
  .timing-device-number {
    margin-bottom: 12px;

    .number-text {
      font-size: 16px;
      font-weight: 600;
      color: $text-color;
    }
  }

  // 设备序列号
  .timing-device-serial {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 20px;
  }

  // 控制类型切换 - 固定统一宽度
  .timing-control-type,
  .timing-task-type {
    margin-bottom: 20px;

    .type-label,
    .task-type-label {
      font-size: 14px;
      color: $text-color;
      font-weight: 500;
      margin-bottom: 10px;
    }

    .type-buttons-fixed,
    .task-type-buttons-fixed {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;

      .type-btn-fixed,
      .task-type-btn-fixed {
        height: 40px;
        width: 100%;
        border: 1px solid #ddd;
        background: #f8f8f8;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 14px;
        color: $text-color;
        padding: 0;

        &:hover {
          border-color: $primary-color;
        }

        &.active {
          background: $primary-color;
          border-color: $primary-color;
          color: white;
        }
      }
    }
  }

  // 周期选择
  .timing-week-select,
  .timing-date-select,
  .timing-time-select {
    margin-bottom: 20px;

    .week-label,
    .date-label,
    .time-label {
      font-size: 14px;
      color: $text-color;
      font-weight: 500;
      margin-bottom: 10px;
    }
  }

  // 遥控器预览
  .timing-ac-preview {
    background: #e8e8e8;
    border-radius: 8px;
    padding: 16px;

    .preview-status {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .status-icon {
        font-size: 18px;
        color: $text-secondary;

        &.active {
          color: $success-color;
        }
      }

      .status-text {
        font-size: 12px;
        color: $text-secondary;
        font-weight: 500;
      }
    }

    .preview-temp-display {
      display: grid;
      grid-template-columns: 1fr 80px;
      grid-template-rows: auto auto;
      gap: 10px;
      margin-bottom: 12px;
      background: #d8d8d8;
      padding: 12px;
      border-radius: 6px;

      .preview-temp-section {
        grid-column: 1;
        grid-row: 1 / 3;
        background: white;
        border-radius: 6px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .preview-temp-label {
          font-size: 10px;
          color: $text-secondary;
          margin-bottom: 6px;
        }

        .preview-temp-main {
          display: flex;
          align-items: baseline;

          .preview-temp-value {
            font-size: 60px;
            font-weight: 200;
            line-height: 1;
            color: $text-color;
            font-family: 'Arial', sans-serif;
            letter-spacing: -2px;
          }

          .preview-temp-unit {
            font-size: 20px;
            color: $text-secondary;
            margin-left: 2px;
          }
        }
      }

      .preview-room-temp {
        grid-column: 2;
        grid-row: 1;
        background: white;
        border-radius: 4px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;

        .preview-room-label {
          font-size: 9px;
          color: $text-secondary;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .preview-room-value {
          font-size: 12px;
          font-weight: 500;
          color: $text-color;
        }
      }

      .preview-mode-section {
        grid-column: 2;
        grid-row: 2;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .preview-mode-item {
          background: white;
          border-radius: 3px;
          padding: 4px 6px;
          display: flex;
          align-items: center;
          gap: 4px;

          .preview-mode-icon {
            font-size: 12px;
            color: $primary-color;
          }

          .preview-mode-label {
            font-size: 10px;
            color: $text-color;
          }

          // 风速F字母图标样式(小号)
          .fan-text-icon-small {
            font-size: 12px;
            font-weight: 700;
            color: $primary-color;
          }
        }
      }
    }

    // 预览控制按钮 - 固定统一宽度
    .preview-control-buttons-fixed {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;

      .preview-btn-fixed {
        height: 40px;
        width: 100%;
        border: 1px solid #ccc;
        background: #f8f8f8;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: $text-color;
        transition: all 0.3s ease;
        padding: 0;

        &:hover:not(:disabled) {
          background: #e8e8e8;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &.active {
          background: $primary-color;
          border-color: $primary-color;
          color: white;
        }

        i {
          font-size: 16px;
        }
      }
    }

    // 锁定参数显示
    .preview-lock-params {
      background: white;
      border-radius: 6px;
      padding: 12px;

      .lock-param-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .param-label {
          font-size: 12px;
          color: $text-secondary;
        }

        .param-value {
          font-size: 12px;
          color: $text-color;
          font-weight: 500;
        }
      }
    }
  }
}

// 定时设备列表区域
.timing-devices-section {
  .devices-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .devices-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-color;
    }
  }
}

// ==================== 其他样式 ====================
.text-muted {
  color: #c0c4cc;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

// ==================== 分页容器 ====================
.pagination-container {
  display: flex;
  justify-content: flex-end; // ✅ 改为 flex-end
  margin-top: 20px;
  padding: 20px 0;
}

// ==================== 电费方案价格弹出框样式 ====================
.price-detail-popover {
  .price-row {
    display: flex;
    gap: 12px;

    .price-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border-radius: 6px;
      background: #f5f7fa;

      .price-label {
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 4px;

        &::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }
      }

      .price-value {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        font-family: "SF Mono", monospace;
      }

      &.peak {
        .price-label::before {
          background: #dc2626;
        }

        .price-value {
          color: #000;
        }
      }

      &.top {
        .price-label::before {
          background: #f59e0b;
        }

        .price-value {
          color: #000;
        }
      }

      &.flat {
        .price-label::before {
          background: #3b82f6;
        }

        .price-value {
          color: #000;
        }
      }

      &.valley {
        .price-label::before {
          background: #10b981;
        }

        .price-value {
          color: #000;
        }
      }
    }
  }
}

.price-name-link {
  color: #000;
  cursor: pointer;
  display: inline-flex;
  align-items: center;

  &:hover {
    color: #000;
  }
}

// ==================== 下拉菜单样式优化 ====================
::v-deep .el-dropdown-menu {
  .el-dropdown-menu__item {
    font-size: 14px;
    padding: 8px 16px;

    &:hover {
      background-color: #f5f7fa;
      color: $primary-color;
    }
  }
}

// ==================== 响应式设计 ====================
@media (max-width: 1600px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .info-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .ac-control-buttons-fixed {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8px;

    .control-btn-fixed {
      height: 45px;
    }
  }

  .preview-control-buttons-fixed {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 6px;

    .preview-btn-fixed {
      height: 36px;
    }
  }

  .card-actions-new {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 6px;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 16px;

    .header-left,
    .header-right {
      width: 100%;
    }

    .header-right {
      justify-content: flex-start;
    }
  }

  .ac-temp-display {
    grid-template-columns: 1fr !important;

    .temp-section {
      grid-row: 1 !important;
    }

    .room-temp-section,
    .mode-section {
      grid-column: 1 !important;
    }
  }

  .timing-container {
    padding: 16px;
  }
}

// ==================== 表格工具栏样式 ====================
.list-view .table-toolbar {
  padding: 10px 0;
  background: transparent;
  border: none;
  margin-bottom: 0;

  .toolbar-left {
    .selection-info {
      font-size: 13px;
      color: #606266;

      .count {
        color: #1677ff;
        font-weight: 600;
      }
    }
  }
}

.table-toolbar {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: -1px;

  .toolbar-left {
    .selection-info {
      font-size: 14px;
      color: $text-secondary;

      .count {
        color: $primary-color;
        font-weight: 600;
        font-size: 16px;
        margin: 0 4px;
      }
    }
  }
}

// ==================== 自定义表格样式 ====================
.custom-table {
  ::v-deep .el-table__row {
    &:hover {
      background-color: #f5f7fa;
    }
  }

  ::v-deep .el-table__body tr.current-row>td {
    background-color: #ecf5ff;
  }
}

// ==================== 操作按钮样式优化 ====================
::v-deep .el-button--text {
  padding: 0;

  &:hover {
    color: $primary-color;
  }
}

// ==================== 搜索表单样式 ====================
.search-form {
  ::v-deep .el-form-item {
    margin-bottom: 16px;
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;

  .action-left,
  .action-right {
    display: flex;
    gap: 10px;
    align-items: center;
  }
}

// ==================== 卡片样式微调 ====================
.search-card {
  border: 1px solid #ebeef5;
}

.table-card {
  background: white;
  border-radius: 4px;
  padding: 0;
  overflow: hidden;
}

// ==================== 禁用状态样式 ====================

// ==================== 动画效果 ====================
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.status-dot.online {
  animation: pulse 2s ease-in-out infinite;
}

// ==================== 打印样式 ====================
@media print {

  .search-box,
  .pagination-container,
  .table-toolbar,
  .card-checkbox,
  .card-footer,
  .card-actions-new {
    display: none !important;
  }

  .air-card {
    break-inside: avoid;
  }
}

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

    .el-table__body tr.el-table__row--striped > td {
      background: #fcfdff !important;
    }

    .el-table--enable-row-hover .el-table__body tr:hover > td {
      background: #f2f8ff !important;
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

// ==================== 操作列样式 ====================
.operation-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 8px;
  white-space: nowrap;

  .op-btn {
    padding: 0;
    margin: 0;
    font-size: 12px;
    line-height: 1;
    border: none;
    background: none;
    flex-shrink: 0;

    // 蓝色按钮
    &.primary-btn {
      color: #1677ff;

      &:hover {
        color: #4096ff;
      }

      &:active {
        color: #0958d9;
      }
    }

    // 绿色按钮(解锁)
    &.success-btn {
      color: #3a8ee6;

      &:hover {
        color: #3a8ee6;
      }

      &:active {
        color: #3a8ee6;
      }
    }

    // 红色按钮(锁定)
    &.danger-btn {
      color: #3a8ee6;

      &:hover {
        color: #3a8ee6;
      }

      &:active {
        color: #3a8ee6;
      }
    }
  }

  .op-divider {
    display: inline-block;
    margin: 0 8px;
    color: #DCDFE6;
    font-size: 12px;
    flex-shrink: 0;
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

// ==================== 序列号复制样式 ====================
.serial-copy {
  color: #374151;
  cursor: pointer;
  user-select: none;
  display: inline-block;
  transition: color 0.2s ease;

  &:hover {
    color: #1677ff;
  }

  &:active {
    color: #0958d9;
  }
}

// 修复表格容器高度问题，避免分页和滚动条被遮挡
.table-page-container .table-container {
  height: auto !important;
}

// ==================== 锁定设置面板优化样式 ====================
.lock-setting-panel {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .lock-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #ebeef5;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    }

    .card-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #dcdfe6;

      .header-icon {
        color: $primary-color;
        font-size: 18px;
        margin-right: 8px;
        background: rgba(64, 158, 255, 0.1);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }

    .card-content {
      padding: 0 4px;
    }
  }

  .temp-range-group {
    display: flex;
    align-items: center;
    gap: 12px;

    .range-separator {
      color: #909399;
      font-size: 13px;
    }

    .el-input-number {
      width: 140px;
      flex: 1;
    }

    .unit {
      color: #606266;
      font-size: 13px;
      margin-left: 4px;
    }
  }

  // Chip style radio buttons
  .chip-radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    ::v-deep .el-radio-button {
      margin-right: 0;

      .el-radio-button__inner {
        border: 1px solid #dcdfe6;
        border-radius: 20px !important; // Pill shape
        padding: 8px 20px;
        font-size: 13px;
        box-shadow: none !important;
        background: #fff;
        color: #606266;
        transition: all 0.2s;
        min-width: 70px;
      }

      &:first-child .el-radio-button__inner {
        border-left: 1px solid #dcdfe6;
      }

      &.is-active {
        .el-radio-button__inner {
          background-color: $primary-color;
          border-color: $primary-color;
          color: #fff;
          font-weight: 500;
          box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2) !important;
        }
      }

      & + .el-radio-button {
        .el-radio-button__inner {
            border-left: 1px solid #dcdfe6;
        }
      }

      &:hover:not(.is-active) {
        .el-radio-button__inner {
          color: $primary-color;
          border-color: #c6e2ff;
          background-color: #ecf5ff;
        }
      }
    }
  }
}
</style>
