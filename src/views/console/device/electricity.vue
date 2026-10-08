<template>
  <div class="table-page-container">
    <!-- 查询区域 -->
    <div class="search-box">
      <el-form :model="queryData" ref="searchForm" class="search-form" @submit.native.prevent>
        <div class="search-main-grid">
          <div class="field-item">
            <el-input
              v-model="queryData.serial"
              :placeholder="$t('deviceElectricity.searchPlaceholder')"
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
              v-model="queryData.bindId"
              :placeholder="$t('deviceElectricity.bindInfoPlaceholder')"
              clearable
              filterable
              :loading="tenantLoading"
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="tenant in tenantList"
                :key="tenant.tenantId"
                :label="tenantBindOptionLabel(tenant.name)"
                :value="tenant.tenantId"
              >
                <span :title="tenant.name || ''">{{ tenantBindOptionLabel(tenant.name) }}</span>
              </el-option>
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.bindType"
              :placeholder="$t('deviceElectricity.meterTypePlaceholder')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('deviceElectricity.bindTypeDedicated')" value="1" />
              <el-option :label="$t('deviceElectricity.bindTypePublic')" value="2" />
              <el-option :label="$t('deviceElectricity.bindTypeFormula')" value="3" />
              <el-option :label="$t('deviceElectricity.bindTypeAc')" value="4" />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.offlineType"
              :placeholder="$t('deviceElectricity.onlineStatusPlaceholder')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('deviceElectricity.offlineTypeOnline')" value="0">
                <span class="option-with-dot">
                  <span class="status-dot online" />{{ $t('deviceElectricity.offlineTypeOnline') }}
                </span>
              </el-option>
              <el-option :label="$t('deviceElectricity.offlineTypeAbnormal')" value="1">
                <span class="option-with-dot">
                  <span class="status-dot offline-abnormal" />{{ $t('deviceElectricity.offlineTypeAbnormal') }}
                </span>
              </el-option>
              <el-option :label="$t('deviceElectricity.offlineTypeNormal')" value="2">
                <span class="option-with-dot">
                  <span class="status-dot offline" />{{ $t('deviceElectricity.offlineTypeNormal') }}
                </span>
              </el-option>
            </el-select>
          </div>

          <div class="search-actions">
            <span
              v-if="hasAdvancedFields"
              class="toggle-advanced"
              @click="showAdvanced = !showAdvanced"
            >
              {{ showAdvanced ? $t('deviceElectricity.collapse') : $t('deviceElectricity.expand') }}
              <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
            </span>
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('deviceElectricity.search') }}</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('deviceElectricity.reset') }}</el-button>
            <el-dropdown trigger="hover" @command="handleExportCommand">
              <el-button type="success" size="small" icon="el-icon-download">
                {{ $t('deviceElectricity.export') }}<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="currentPage">{{ $t('deviceElectricity.exportCurrentPage') }}</el-dropdown-item>
                <el-dropdown-item command="selected">{{ $t('deviceElectricity.exportSelected') }}</el-dropdown-item>
                <el-dropdown-item command="all">{{ $t('deviceElectricity.exportAll') }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>

        <!-- 高级筛选第二行 -->
        <div v-if="showAdvanced && hasAdvancedFields" class="search-advanced-grid">
          <div class="field-item advanced-switch">
            <el-select
              v-model="queryData.switchStatus"
              :placeholder="$t('deviceElectricity.switchStatusPlaceholder')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('deviceElectricity.switchOff')" value="0" />
              <el-option :label="$t('deviceElectricity.switchOn')" value="1" />
            </el-select>
          </div>

          <!-- 占位：让高级行也保留“动作列”宽度，从而保证 4 个筛选项宽度与第一行完全一致 -->
          <div class="search-actions search-actions-phantom">
            <span class="toggle-advanced">
              {{ showAdvanced ? $t('deviceElectricity.collapse') : $t('deviceElectricity.expand') }}
              <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
            </span>
            <el-button type="primary" size="small" icon="el-icon-search">{{ $t('deviceElectricity.search') }}</el-button>
            <el-button size="small" icon="el-icon-refresh">{{ $t('deviceElectricity.reset') }}</el-button>
            <el-button type="success" size="small" icon="el-icon-download">{{ $t('deviceElectricity.export') }}<i class="el-icon-arrow-down el-icon--right" /></el-button>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 内容区域 -->
    <div class="content-box">
      <!-- 工具栏 -->
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            {{ viewMode === 'card' ? $t('deviceElectricity.sectionCard') : $t('deviceElectricity.sectionList') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-button v-if="canAdd" type="primary" size="small" icon="el-icon-plus" @click="handleAdd">
            {{ $t('deviceElectricity.add') }}
          </el-button>
          <el-select
            v-model="sortOrder"
            size="small"
            style="width: 100px"
          >
            <el-option :label="$t('deviceElectricity.sortDefault')" value="default" />
          </el-select>
          <div class="view-switch-group">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="list">
                <i class="el-icon-s-grid" /> {{ $t('deviceElectricity.viewList') }}
              </el-radio-button>
              <el-radio-button label="card">
                <i class="el-icon-menu" /> {{ $t('deviceElectricity.viewCard') }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="list-view">
        <!-- 批量操作工具栏 -->
        <div class="table-toolbar">
          <span v-if="selectedCount > 0" class="selection-info">
            {{ $t('deviceElectricity.selectedCount', { count: selectedCount }) }}
          </span>
          <el-button
            v-if="canEdit"
            type="warning"
            size="small"
            icon="el-icon-s-operation"
            style="margin-left: auto"
            @click="openBatchOfflineTypeDialog"
          >
            {{ $t('deviceElectricity.batchSetOfflineType') }}
          </el-button>
        </div>

        <el-table
          v-loading="loading"
          border
          :data="tableData"
          :max-height="tableMaxHeight"
          row-key="id"
          stripe
          style="width: 100%"
          class="custom-table light-border-table"
          @select="handleSelect"
          @select-all="handleSelectAll"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <el-table-column type="selection" width="55" align="center" :reserve-selection="true" />

          <el-table-column
            v-for="col in displayColumns"
            :key="col.key"
            :prop="col.key"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :align="col.isTag ? 'center' : 'left'"
            :header-align="col.isTag ? 'center' : 'left'"
            :show-overflow-tooltip="true"
          >
            <template slot-scope="scope">
              <!-- 序列号 -->
              <template v-if="col.key === 'serial'">
                <el-tooltip :content="$t('deviceElectricity.copySerialTip')" placement="top" :open-delay="300">
                  <span class="serial-copy" @click="handleCopySerial(scope.row.serial)">
                    {{ scope.row.serial || '-' }}
                  </span>
                </el-tooltip>
              </template>

              <!-- 电费方案 -->
              <template v-else-if="col.key === 'meterPriceName'">
                <el-popover v-if="scope.row.meterPriceDetail" placement="top" width="360" trigger="hover">
                  <div class="price-detail-popover">
                    <div class="price-row">
                      <div class="price-item peak">
                        <span class="price-label">{{ $t('deviceElectricity.priceSharp') }}</span>
                        <span class="price-value">¥{{ scope.row.meterPriceDetail.powerPeakPrice }}</span>
                      </div>
                      <div class="price-item top">
                        <span class="price-label">{{ $t('deviceElectricity.pricePeak') }}</span>
                        <span class="price-value">¥{{ scope.row.meterPriceDetail.powerTopPrice }}</span>
                      </div>
                      <div class="price-item flat">
                        <span class="price-label">{{ $t('deviceElectricity.priceFlat') }}</span>
                        <span class="price-value">¥{{ scope.row.meterPriceDetail.powerFlatPrice }}</span>
                      </div>
                      <div class="price-item valley">
                        <span class="price-label">{{ $t('deviceElectricity.priceValley') }}</span>
                        <span class="price-value">¥{{ scope.row.meterPriceDetail.powerValleyPrice }}</span>
                      </div>
                    </div>
                  </div>
                  <span slot="reference" class="price-name-link" :title="scope.row.meterPriceName || ''">
                    {{ displayTariffName(scope.row.meterPriceName) }}
                    <i class="el-icon-warning-outline" style="margin-left: 4px; color: #000" />
                  </span>
                </el-popover>
                <span v-else class="text-muted">{{ scope.row.meterPriceName ? displayTariffName(scope.row.meterPriceName) : '-' }}</span>
              </template>

              <!-- 设备名称 -->
              <template v-else-if="col.key === 'meterName'">
                <el-link type="primary" :title="scope.row.meterName || ''" @click="handleMonitor(scope.row)">
                  {{ $displayDynamicName(scope.row.meterName, 44) || '-' }}
                </el-link>
              </template>

              <!-- 电表类型 -->
              <template v-else-if="col.key === 'bindTypeLabel'">
                <el-tag v-if="scope.row.bindType == 1" type="success" size="small" effect="plain">{{ $t('deviceElectricity.bindTypeDedicated') }}</el-tag>
                <el-tag v-else-if="scope.row.bindType == 2" type="warning" size="small" effect="plain">{{ $t('deviceElectricity.bindTypePublic') }}</el-tag>
                <el-tag v-else-if="scope.row.bindType == 3" type="info" size="small" effect="plain">{{ $t('deviceElectricity.bindTypeFormula') }}</el-tag>
                <el-tag v-else-if="scope.row.bindType == 4" type="info" size="small" effect="plain">{{ $t('deviceElectricity.bindTypeAc') }}</el-tag>
                <span v-else>-</span>
              </template>

              <!-- 已绑信息 -->
              <template v-else-if="col.key === 'bindName'">
                <el-link v-if="scope.row.bindId" type="primary" :title="scope.row.bindName || ''" @click="handleTenantClick(scope.row)">
                  <i class="el-icon-user" />
                  {{ displayBindCell(scope.row) }}
                </el-link>
                <span v-else class="text-muted">{{ $t('deviceElectricity.unbound') }}</span>
              </template>

              <!-- 付费模式 -->
              <template v-else-if="col.key === 'logicPayTypeLabel'">
                <el-tag v-if="scope.row.logicPayType == 0" type="success" size="small">{{ $t('deviceElectricity.prepaid') }}</el-tag>
                <el-tag v-else-if="scope.row.logicPayType == 1" type="primary" size="small">{{ $t('deviceElectricity.prepaidStrong') }}</el-tag>
                <span v-else>-</span>
              </template>

              <!-- 分合闸状态 -->
              <template v-else-if="col.key === 'switchStatusLabel'">
                <el-tag v-if="scope.row.switchStatus == 1" type="success" size="small" effect="plain">{{ $t('deviceElectricity.switchOn') }}</el-tag>
                <el-tag v-else-if="scope.row.switchStatus == 0" type="info" size="small" effect="plain">{{ $t('deviceElectricity.switchOff') }}</el-tag>
                <span v-else>-</span>
              </template>

              <!-- 电表规格 -->
              <template v-else-if="col.key === 'phaseLabel'">
                <el-tag v-if="scope.row.phase == 5" type="primary" size="small" effect="plain">{{ $t('deviceElectricity.phaseThreePrimary') }}</el-tag>
                <el-tag v-else-if="scope.row.phase == 6" type="success" size="small" effect="plain">{{ $t('deviceElectricity.phaseThreeSecondary') }}</el-tag>
                <el-tag v-else-if="scope.row.phase == 7" type="warning" size="small" effect="plain">{{ $t('deviceElectricity.phaseSinglePrimary') }}</el-tag>
                <span v-else>-</span>
              </template>

              <!-- 在线状态 -->
              <template v-else-if="col.key === 'onlineStatusStatus'">
                <el-tooltip
                  v-if="scope.row.onlineStatus != 1"
                  :content="offlineTypeTip(scope.row)"
                  placement="top"
                  effect="dark"
                >
                  <div class="status-wrapper">
                    <span :class="['status-dot', Number(scope.row.offlineType) === 1 ? 'offline-abnormal' : 'offline']" />
                    <span>{{ scope.row.onlineStatus == 1 ? $t('deviceElectricity.online') : $t('deviceElectricity.offline') }}</span>
                  </div>
                </el-tooltip>
                <div v-else class="status-wrapper">
                  <span class="status-dot online" />
                  <span>{{ $t('deviceElectricity.online') }}</span>
                </div>
              </template>

              <!-- 备注 -->
              <template v-else-if="col.key === 'offlineComment'">
                {{ scope.row.offlineComment || '--' }}
              </template>

              <!-- 默认 -->
              <template v-else>
                {{ scope.row[col.key] || '-' }}
              </template>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column :label="$t('deviceElectricity.opColumn')" width="190" fixed="right" align="center" :resizable="false">
            <template slot-scope="scope">
              <div class="operation-cell">
                <template v-if="canToggleSwitch">
                  <el-button
                    v-if="scope.row.switchStatus == 1"
                    type="text" size="mini"
                    @click="handleSwitch(scope.row, 0)"
                    class="op-btn primary-btn"
                  >
                    {{ $t('deviceElectricity.opOpen') }}
                  </el-button>
                  <el-button
                    v-else
                    type="text" size="mini"
                    @click="handleSwitch(scope.row, 1)"
                    class="op-btn primary-btn"
                  >
                    {{ $t('deviceElectricity.opClose') }}
                  </el-button>
                </template>
                <el-button v-if="canEdit" type="text" size="mini" @click="handleEdit(scope.row)" class="op-btn primary-btn">{{ $t('deviceElectricity.opEdit') }}</el-button>
                <el-button v-if="canView" type="text" size="mini" @click="handleMonitor(scope.row)" class="op-btn primary-btn">{{ $t('deviceElectricity.opDetail') }}</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container compact-pagination">
          <el-pagination
            :current-page="pageData.current"
            :page-sizes="[15, 30, 60, 100, 200]"
            :page-size="pageData.size"
            :total="pageData.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <div v-loading="loading">
          <el-empty v-if="!loading && tableData.length === 0" :description="$t('deviceElectricity.emptyNoData')" :image-size="80" />
          <div v-else class="device-card-grid">
            <div
              v-for="row in tableData"
              :key="row.id || row.serial"
              class="device-card-col"
            >
              <el-card
                shadow="never"
                class="device-card"
                :class="{ 'is-clickable': canView }"
                @click.native="handleCardClick(row)"
              >
                <div class="device-card-main">
                  <div class="device-card-left">
                    <div class="device-card-title">
                      <el-link v-if="canView" type="primary" :title="row.meterName || ''" @click.stop="handleMonitor(row)">
                        {{ $displayDynamicName(row.meterName, 44) || '-' }}
                      </el-link>
                      <span v-else :title="row.meterName || ''">{{ $displayDynamicName(row.meterName, 44) || '-' }}</span>
                    </div>
                    <div class="device-card-tags">
                      <el-tag :type="row.switchStatus == 1 ? 'success' : 'info'" size="mini" effect="plain">
                        {{ row.switchStatus == 1 ? $t('deviceElectricity.switchOn') : $t('deviceElectricity.switchOff') }}
                      </el-tag>
                      <el-tag :type="row.onlineStatus == 1 ? 'success' : 'info'" size="mini" effect="plain">
                        {{ row.onlineStatus == 1 ? $t('deviceElectricity.online') : $t('deviceElectricity.offline') }}
                      </el-tag>
                      <el-tag v-if="row.bindType == 1" type="primary" size="mini" effect="plain">{{ $t('deviceElectricity.bindTagDedicated') }}</el-tag>
                      <el-tag v-else-if="row.bindType == 2" type="warning" size="mini" effect="plain">{{ $t('deviceElectricity.bindTagPublic') }}</el-tag>
                      <el-tag v-else-if="row.bindType == 3" type="info" size="mini" effect="plain">{{ $t('deviceElectricity.bindTagFormula') }}</el-tag>
                      <el-tag v-else-if="row.bindType == 4" type="info" size="mini" effect="plain">{{ $t('deviceElectricity.bindTagAc') }}</el-tag>
                      <el-tag v-if="row.logicPayType != null && row.logicPayType !== ''" :type="row.logicPayType == 0 ? 'success' : 'danger'" size="mini" effect="plain">
                        {{ row.logicPayTypeLabel }}
                      </el-tag>
                    </div>
                    <div class="device-card-body">
                      <div class="kv">
                        <span class="k">{{ $t('deviceElectricity.cardSerial') }}</span>
                        <span class="v serial-copy" @click.stop="handleCopySerial(row.serial)">{{ row.serial || '-' }}</span>
                      </div>
                      <div class="kv">
                        <span class="k">{{ $t('deviceElectricity.cardBindInfo') }}</span>
                        <span class="v">
                          <el-link v-if="row.bindId" type="primary" :title="row.bindName || ''" @click.stop="handleTenantClick(row)">{{ displayBindCell(row) }}</el-link>
                          <span v-else class="text-muted">{{ $t('deviceElectricity.unbound') }}</span>
                        </span>
                      </div>
                      <div class="kv">
                        <span class="k">{{ $t('deviceElectricity.cardPricePlan') }}</span>
                        <span class="v" :title="row.meterPriceName || ''">{{ displayTariffName(row.meterPriceName) }}</span>
                      </div>
                      <div class="kv">
                        <span class="k">{{ $t('deviceElectricity.cardLatestReading') }}</span>
                        <span class="v">{{ row.syncTime || '-' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="device-card-right">
                    <img class="device-card-img" :src="meterCardImg" alt="" />
                  </div>
                </div>

                <div class="device-card-actions-bar">
                  <template v-if="canToggleSwitch">
                    <button
                      class="card-action"
                      type="button"
                      :disabled="row.switchStatus == 0"
                      @click.stop="row.switchStatus == 0 ? null : handleSwitch(row, 0)"
                    >
                      <span>{{ $t('deviceElectricity.opOpen') }}</span>
                    </button>
                    <button
                      class="card-action"
                      type="button"
                      :disabled="row.switchStatus == 1"
                      @click.stop="row.switchStatus == 1 ? null : handleSwitch(row, 1)"
                    >
                      <span>{{ $t('deviceElectricity.opClose') }}</span>
                    </button>
                  </template>
                  <button v-if="canEdit" class="card-action" type="button" @click.stop="handleEdit(row)">
                    <span>{{ $t('deviceElectricity.opEdit') }}</span>
                  </button>
                  <button v-if="canView" class="card-action" type="button" @click.stop="handleMonitor(row)">
                    <span>{{ $t('deviceElectricity.opDetail') }}</span>
                  </button>
                </div>
              </el-card>
            </div>
          </div>
        </div>

        <div class="pagination-container compact-pagination">
          <el-pagination
            :current-page="pageData.current"
            :page-sizes="[15, 30, 60, 100, 200]"
            :page-size="pageData.size"
            :total="pageData.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      :title="editForm.id ? $t('deviceElectricity.dialogEditTitle') : $t('deviceElectricity.dialogAddTitle')"
      :visible.sync="dialogVisible"
      width="680px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form ref="editForm" :model="editForm" :rules="editFormRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('deviceElectricity.labelSerial')" prop="serial">
              <el-input v-model="editForm.serial" :placeholder="$t('deviceElectricity.placeholderSerial')" :disabled="!!editForm.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('deviceElectricity.labelImei')" prop="imei">
              <el-input v-model="editForm.imei" :placeholder="$t('deviceElectricity.placeholderImei')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('deviceElectricity.labelMeterName')" prop="meterName">
              <el-input v-model="editForm.meterName" :placeholder="$t('deviceElectricity.placeholderMeterName')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('deviceElectricity.labelMeterType')" prop="bindType">
              <el-select v-model="editForm.bindType" :placeholder="$t('deviceElectricity.placeholderSelectMeterType')" style="width: 100%">
                <el-option v-for="item in meterBindTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('deviceElectricity.labelPayMode')" prop="logicPayType">
              <el-select v-model="editForm.logicPayType" :placeholder="$t('deviceElectricity.placeholderSelectPayMode')" style="width: 100%">
                <el-option v-for="item in meterPayTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('deviceElectricity.labelPhase')" prop="phase">
              <el-select v-model="editForm.phase" :placeholder="$t('deviceElectricity.placeholderSelectPhase')" style="width: 100%">
                <el-option v-for="item in meterPhaseOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('deviceElectricity.labelCt')" prop="ct">
              <el-input-number v-model="editForm.ct" :min="1" :placeholder="$t('deviceElectricity.placeholderCt')" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('deviceElectricity.labelPt')" prop="pt">
              <el-input-number v-model="editForm.pt" :min="1" :placeholder="$t('deviceElectricity.placeholderPt')" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="editForm.id">
          <el-col :span="12">
            <el-form-item :label="$t('deviceElectricity.labelPricePlan')" prop="priceId">
              <el-select v-model="editForm.priceId" :placeholder="$t('deviceElectricity.placeholderSelectPrice')" style="width: 100%" clearable>
                <el-option v-for="price in priceList" :key="price.id" :label="price.name" :value="price.id">
                  <div>
                    <div>{{ price.name }}</div>
                    <div style="font-size: 12px; color: #999">
                      {{ $t('deviceElectricity.priceLineMeta', { peak: price.powerPeakPrice, flat: price.powerFlatPrice, valley: price.powerValleyPrice }) }}
                    </div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('deviceElectricity.btnCancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">
          {{ submitting ? $t('deviceElectricity.saving') : $t('deviceElectricity.btnConfirm') }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 修改预付费模式弹窗 -->
    <el-dialog
      :title="$t('deviceElectricity.payTypeDialogTitle')"
      :visible.sync="payTypeDialog.visible"
      width="420px"
      :close-on-click-modal="false"
      class="confirm-dialog"
    >
      <div class="confirm-content">
        <i class="el-icon-warning warning-icon" />
        <div class="confirm-text">
          <p>{{ $t('deviceElectricity.payTypeDialogBody') }}</p>
          <p>{{ $t('deviceElectricity.payTypeDialogAsk') }}</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="payTypeDialog.visible = false">{{ $t('deviceElectricity.btnCancel') }}</el-button>
        <el-button type="primary" @click="handleUpdatePayType">{{ $t('deviceElectricity.btnConfirm') }}</el-button>
      </span>
    </el-dialog>

    <!-- 分合闸验证码弹窗 -->
    <el-dialog
      :title="switchVerifyTitle"
      :visible.sync="switchVerifyDialog.visible"
      width="520px"
      :close-on-click-modal="false"
      class="custom-dialog"
      @close="closeSwitchVerifyDialog"
    >
      <el-form label-width="90px">
        <el-form-item :label="$t('deviceElectricity.switchVerifyMeter')">
          <span>{{ switchVerifyDialog.row ? (switchVerifyDialog.row.meterName || '-') : '-' }}</span>
        </el-form-item>
        <el-form-item :label="$t('deviceElectricity.switchVerifyAction')">
          <span>{{ switchVerifyDialog.switchType === 1 ? $t('deviceElectricity.switchOn') : $t('deviceElectricity.switchOff') }}</span>
        </el-form-item>
        <el-form-item :label="$t('deviceElectricity.switchVerifyPhone')">
          <span>{{ maskedPhone || '-' }}</span>
        </el-form-item>
        <el-form-item :label="$t('deviceElectricity.switchVerifyCode')">
          <el-input
            v-model="switchVerifyForm.code"
            :placeholder="$t('deviceElectricity.placeholderVerifyCode')"
            maxlength="6"
            autocomplete="off"
          >
            <el-button
              slot="append"
              type="primary"
              class="sms-code-btn"
              :disabled="!smsCountdownIdle || !userPhone"
              @click="sendSwitchVerifyCode"
            >{{ switchVerifySmsButtonLabel }}</el-button>
          </el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button :disabled="switchSubmitting" @click="switchVerifyDialog.visible = false">{{ $t('deviceElectricity.btnCancel') }}</el-button>
        <el-button type="primary" :loading="switchSubmitting" @click="confirmSwitchOperation">{{ $t('deviceElectricity.btnConfirm') }}</el-button>
      </span>
    </el-dialog>

    <!-- 批量设置离线类型弹窗 -->
    <el-dialog
      :title="$t('deviceElectricity.batchOfflineTypeDialogTitle')"
      :visible.sync="batchOfflineTypeDialog.visible"
      width="420px"
      :close-on-click-modal="false"
      class="custom-dialog"
      @close="closeBatchOfflineTypeDialog"
    >
      <p style="margin: 0 0 16px; font-size: 14px; color: #606266;">
        {{ $t('deviceElectricity.batchOfflineTypeSelectedTip', { count: selectedCount }) }}
      </p>
      <el-form label-width="80px">
        <el-form-item :label="$t('deviceElectricity.batchOfflineTypeLabel')">
          <el-select
            v-model="batchOfflineTypeDialog.offlineType"
            :placeholder="$t('deviceElectricity.batchOfflineTypeLabel')"
            style="width: 100%"
          >
            <el-option :label="$t('deviceElectricity.offlineTypeNormal')" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('deviceElectricity.batchOfflineTypeComment')">
          <el-input
            v-model="batchOfflineTypeDialog.offlineComment"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            :placeholder="$t('deviceElectricity.phOfflineComment')"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button :disabled="batchSubmitting" @click="batchOfflineTypeDialog.visible = false">{{ $t('deviceElectricity.btnCancel') }}</el-button>
        <el-button type="primary" :loading="batchSubmitting" @click="confirmBatchOfflineType">{{ $t('deviceElectricity.btnConfirm') }}</el-button>
      </span>
    </el-dialog>

    <meter-detail-drawer
      :visible.sync="detailDrawer.visible"
      :meter-id="detailDrawer.meterId"
      :serial="detailDrawer.serial"
    />
  </div>
</template>

<script>
import {
  meterPageMeterInfoByAdmin,
  meterAddMeter,
  meterUpdateMeterBase,
  tenantDoMeterSwitchOffOn,
  meterUpdateLogicPayType,
  meterBatchUpdateOfflineType
} from '@/api/meter'
import { getSimpleTenantList } from '@/api/useReport'
import { meterPriceList, authSendSmsCode } from '@/api/meterPrice'
import MeterDetailDrawer from '../device/electricity/detail.vue'
import meterCardImg from '@/assets/images/szwyIcon2.jpg'
import {
  MeterOnlineStatus
} from '@/utils/enums/meter'
import { mapGetters } from 'vuex'
import * as XLSX from 'xlsx'

// 导出全部的单次上限（与后端分页参数对应）
const EXPORT_ALL_LIMIT = 2000

export default {
  name: 'MeterManagement',
  components: { MeterDetailDrawer },
  data () {
    const getInitialViewMode = () => {
      try {
        const raw = window.localStorage.getItem('device.electricity.viewMode')
        if (raw === 'list' || raw === 'card') return raw
      } catch (e) {}
      return 'card'
    }
    return {
      isInitialLoad: true,
      viewMode: getInitialViewMode(),
      sortOrder: 'default',
      meterCardImg,
      detailDrawer: { visible: false, meterId: '', serial: '' },
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 11,
        paginationHeight: 68
      },
      queryData: {
        bindId: null,
        bindType: null,
        id: '',
        managerId: '',
        meterName: '',
        offlineType: null,
        serial: '',
        switchStatus: null
      },
      showAdvanced: false,
      tenantList: [],
      tenantLoading: false,
      priceList: [],
      rawTableRows: [],
      tableData: [],
      loading: false,
      submitting: false,
      exportAllLoading: false,
      pageData: { current: 1, size: 15, total: 0 },
      selectedRowsMap: {},
      batchOfflineTypeDialog: { visible: false, offlineType: null, offlineComment: '' },
      batchSubmitting: false,
      dialogVisible: false,
      editForm: {
        id: '',
        serial: '',
        imei: '',
        meterName: '',
        bindType: '',
        logicPayType: '',
        ct: 1,
        pt: 1,
        phase: '',
        managerId: '',
        priceId: ''
      },
      payTypeDialog: { visible: false, row: null, switchType: null },
      switchVerifyDialog: { visible: false, row: null, switchType: null },
      switchVerifyForm: { code: '' },
      switchVerifyCountDownSeconds: null,
      switchVerifyCountDownTimer: null,
      switchSubmitting: false
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    selectedRows () {
      return Object.keys(this.selectedRowsMap).map((id) => this.selectedRowsMap[id])
    },
    selectedCount () {
      return Object.keys(this.selectedRowsMap).length
    },
    kztMenuNos () {
      const list = this.$store.getters.kztMenuNos
      return Array.isArray(list) ? list : []
    },
    hasKztPermission () {
      const allow = new Set(this.kztMenuNos.map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canAdd () { return this.hasKztPermission('630010') },
    canEdit () { return this.hasKztPermission('630011') },
    canView () { return this.hasKztPermission('630012') },
    canToggleSwitch () { return this.hasKztPermission('630013') },
    tableKey () {
      const t = (k) => this.$t(`deviceElectricity.${k}`)
      return [
        { label: t('colSerial'), key: 'serial', width: '150', checked: true, disabled: true },
        { label: t('colMeterName'), key: 'meterName', width: '200', checked: true, click: true, disabled: true },
        { label: t('colType'), key: 'bindTypeLabel', checked: true, width: '100', isTag: true },
        { label: t('colBindInfo'), key: 'bindName', click: true, checked: true, width: '300' },
        { label: t('colPayMode'), checked: true, key: 'logicPayTypeLabel', width: '100', isTag: true },
        { label: t('colPricePlan'), checked: true, key: 'meterPriceName', width: '150' },
        { label: t('colPhase'), checked: true, key: 'phaseLabel', width: '120', isTag: true },
        { label: t('colSwitch'), checked: true, key: 'switchStatusLabel', width: '120', isTag: true },
        { label: t('colOnline'), checked: true, key: 'onlineStatusStatus', width: '100', type: 'status', isTag: true },
        { label: t('colOfflineComment'), key: 'offlineComment', width: '160', checked: true },
        { label: t('colSyncTime'), key: 'syncTime', width: '160', checked: true },
        { label: t('colCreateTime'), key: 'createTime', width: '160', checked: true }
      ]
    },
    displayColumns () { return this.tableKey.filter((col) => col.checked !== false) },
    editFormRules () {
      return {
        serial: [{ required: true, message: this.$t('deviceElectricity.ruleSerial'), trigger: 'blur' }],
        meterName: [{ required: true, message: this.$t('deviceElectricity.ruleMeterName'), trigger: 'blur' }],
        bindType: [{ required: true, message: this.$t('deviceElectricity.ruleBindType'), trigger: 'change' }],
        logicPayType: [{ required: true, message: this.$t('deviceElectricity.rulePayMode'), trigger: 'change' }],
        phase: [{ required: true, message: this.$t('deviceElectricity.rulePhase'), trigger: 'change' }]
      }
    },
    meterBindTypeOptions () {
      return [
        { value: 1, label: this.$t('deviceElectricity.bindTypeDedicated') },
        { value: 2, label: this.$t('deviceElectricity.bindTypePublic') },
        { value: 3, label: this.$t('deviceElectricity.bindTypeFormula') },
        { value: 4, label: this.$t('deviceElectricity.bindTypeAc') }
      ]
    },
    meterPayTypeOptions () {
      return [
        { value: 0, label: this.$t('deviceElectricity.prepaid') },
        { value: 1, label: this.$t('deviceElectricity.prepaidStrong') }
      ]
    },
    meterPhaseOptions () {
      return [
        { value: 5, label: this.$t('deviceElectricity.phaseThreePrimary') },
        { value: 6, label: this.$t('deviceElectricity.phaseThreeSecondary') },
        { value: 7, label: this.$t('deviceElectricity.phaseSinglePrimary') }
      ]
    },
    smsCountdownIdle () {
      return this.switchVerifyCountDownSeconds === null || this.switchVerifyCountDownSeconds === undefined
    },
    switchVerifySmsButtonLabel () {
      const s = this.switchVerifyCountDownSeconds
      if (this.smsCountdownIdle) return this.$t('deviceElectricity.sendSmsCode')
      return `${s}s`
    },
    // 高级字段：分合闸状态（第5个，超出一行4个）
    hasAdvancedFields () { return true },
    userPhone () {
      return this.$store.state.user.phone || ''
    },
    maskedPhone () {
      if (!this.userPhone) return ''
      return this.userPhone.substr(0, 3) + '****' + this.userPhone.substr(7)
    },
    switchVerifyTitle () {
      if (!this.switchVerifyDialog.row) return this.$t('deviceElectricity.switchVerifyTitleBase')
      const action = this.switchVerifyDialog.switchType === 1
        ? this.$t('deviceElectricity.switchOn')
        : this.$t('deviceElectricity.switchOff')
      return this.$t('deviceElectricity.switchVerifyTitleFmt', { action })
    },
    tableMaxHeight () {
      return this.tableHeightConfig.headerHeight + this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
    }
  },
  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          if (this.isInitialLoad) {
            this.isInitialLoad = false
            this.handleRouteQuery()
          } else {
            this.fetchTableData()
          }
          this.getTenantList()
          this.getMeterPriceList()
        }
      },
      immediate: true
    },
    viewMode (val) {
      try { window.localStorage.setItem('device.electricity.viewMode', val) } catch (e) {}
      if (val !== 'list') this.selectedRowsMap = {}
    },
    '$i18n.locale' () {
      if (!this.rawTableRows) return
      this.tableData = this.formatTableData(this.rawTableRows)
    }
  },
  beforeDestroy () {
    if (this.switchVerifyCountDownTimer) {
      clearInterval(this.switchVerifyCountDownTimer)
      this.switchVerifyCountDownTimer = null
    }
  },
  mounted () {},
  methods: {
    async getMeterPriceList () {
      try {
        const params = { managerId: this.queryData.managerId, priceType: 1 }
        const response = await meterPriceList(params)
        if (response.code === 200 && response.data) {
          this.priceList = response.data || []
        } else {
          this.$message.error(response.msg || this.$t('deviceElectricity.errPriceList'))
          this.priceList = []
        }
      } catch (error) {
        console.error('获取价格方案失败:', error)
        this.$apiError.notify(error, this.$t('deviceElectricity.errPriceList'))
        this.priceList = []
      }
    },

    async getTenantList () {
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({ managerId: this.queryData.managerId, tenantStatus: 0 })
        this.tenantList = data || []
      } catch (error) {
        console.error('获取租户列表失败:', error)
        this.$apiError.notify(error, this.$t('deviceElectricity.errTenantList'))
        this.tenantList = []
      } finally {
        this.tenantLoading = false
      }
    },

    buildQueryParams (size, current) {
      const normalizeSelect = (v) => {
        if (v === null || v === undefined) return ''
        if (v === '__ALL__') return ''
        return v
      }
      const keyword = (this.queryData.serial || '').trim()
      // 纯数字且不少于 8 位视为序列号，否则按电表名称
      const isSerialKeyword = /^\d+$/.test(keyword) && keyword.length >= 8
      return {
        bindId: normalizeSelect(this.queryData.bindId),
        bindType: normalizeSelect(this.queryData.bindType),
        id: this.queryData.id,
        managerId: this.queryData.managerId,
        meterName: keyword && !isSerialKeyword ? keyword : '',
        offlineType: normalizeSelect(this.queryData.offlineType),
        page: {
          current,
          size,
          orders: [{ asc: false, column: 'createTime' }]
        },
        serial: keyword && isSerialKeyword ? keyword : '',
        switchStatus: normalizeSelect(this.queryData.switchStatus)
      }
    },

    async fetchTableData () {
      if (!this.queryData.managerId) return
      this.loading = true
      try {
        const params = this.buildQueryParams(this.pageData.size, this.pageData.current)
        const response = await meterPageMeterInfoByAdmin(params)
        if (response.code === 200 && response.data) {
          this.rawTableRows = response.data.dataList || []
          this.tableData = this.formatTableData(this.rawTableRows)
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || this.$t('deviceElectricity.errFetchList'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('deviceElectricity.errFetchMeters'))
        console.error('获取电表数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    formatTableData (data) {
      return data.map((item) => {
        const bindTenantName = item.bindName ? String(item.bindName) : ''
        const bindName = bindTenantName ? `${item.bindId}(${bindTenantName})` : '-'
        const bindTypeLabel = this.formatBindTypeLabel(item.bindType)
        const logicPayTypeLabel = this.formatPayTypeLabel(item.logicPayType)
        const switchStatusLabel = this.formatSwitchStatusLabel(item.switchStatus)
        const onlineRow = MeterOnlineStatus[item.onlineStatus]
        const onlineStatusStatus = onlineRow
          ? {
            ...onlineRow,
            label: Number(item.onlineStatus) === 1 ? this.$t('deviceElectricity.online') : this.$t('deviceElectricity.offline')
          }
          : { label: '-', class: '' }
        const phaseLabel = this.formatPhaseLabel(item.phase) || '-'
        const meterPriceName = item.meterPriceDto?.name || '-'
        const meterPriceDetail = item.meterPriceDto || null
        return { ...item, bindTenantName, bindName, bindTypeLabel, logicPayTypeLabel, switchStatusLabel, onlineStatusStatus, phaseLabel, meterPriceName, meterPriceDetail }
      })
    },

    offlineTypeTip (row) {
      const type = row.offlineType
      if (type === 1) return this.$t('deviceElectricity.offlineTypeAbnormal')
      if (type === 2) return this.$t('deviceElectricity.offlineTypeNormal')
      return '-'
    },

    formatBindTypeLabel (v) {
      const m = { 1: 'bindTypeDedicated', 2: 'bindTypePublic', 3: 'bindTypeFormula', 4: 'bindTypeAc' }
      const k = m[Number(v)]
      return k ? this.$t(`deviceElectricity.${k}`) : '-'
    },

    formatPayTypeLabel (v) {
      if (v === 0 || v === '0') return this.$t('deviceElectricity.prepaid')
      if (v === 1 || v === '1') return this.$t('deviceElectricity.prepaidStrong')
      return '-'
    },

    formatSwitchStatusLabel (v) {
      if (v === 1 || v === '1') return this.$t('deviceElectricity.switchOn')
      if (v === 0 || v === '0') return this.$t('deviceElectricity.switchOff')
      return '-'
    },

    formatPhaseLabel (v) {
      const m = { 5: 'phaseThreePrimary', 6: 'phaseThreeSecondary', 7: 'phaseSinglePrimary' }
      const k = m[Number(v)]
      return k ? this.$t(`deviceElectricity.${k}`) : '-'
    },

    /** 绑定筛选下拉里：中文原名；英文界面词典 + 剩余拼音（与表格绑定列一致） */
    tenantBindOptionLabel (name) {
      if (this.$i18n.locale === 'zh-CN') return name == null ? '' : String(name)
      return this.$displayBizHybrid(name, 160)
    },

    /** 英文界面：绑定列 id + 拼音；中文界面：保持 id(原名) */
    displayBindCell (row) {
      if (!row || !row.bindId) return ''
      if (this.$i18n.locale === 'zh-CN') return row.bindName || ''
      const raw = row.bindTenantName != null ? String(row.bindTenantName) : ''
      if (!raw) return this.$displayBizHybrid(row.bindName, 48)
      return `${row.bindId}(${this.$displayBizHybrid(raw, 40)})`
    },

    /** 电价方案名：系统词英文 + 用户片段拼音 */
    displayTariffName (name) {
      return this.$displayBizHybrid(name, 48)
    },

    /** 导出单元格：英文下列名仍为 i18n，动态中文列做拼音便于 Excel 查看 */
    formatExportCell (row, key) {
      if (key === 'onlineStatusStatus') return row[key]?.label || ''
      if (this.$i18n.locale === 'zh-CN') return row[key] || ''
      if (key === 'meterName') return this.$displayDynamicName(row.meterName, 200)
      if (key === 'meterPriceName') return this.$displayBizHybrid(row.meterPriceName, 200)
      if (key === 'bindName') {
        if (!row.bindId) return row.bindName || ''
        const raw = row.bindTenantName != null ? String(row.bindTenantName) : ''
        if (!raw) return this.$displayBizHybrid(row.bindName, 200)
        return `${row.bindId}(${this.$displayBizHybrid(raw, 200)})`
      }
      return row[key] || ''
    },

    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleReset () {
      this.queryData = {
        bindId: null,
        bindType: null,
        id: '',
        managerId: this.currentManagerId || '',
        meterName: '',
        offlineType: null,
        serial: '',
        switchStatus: null
      }
      this.showAdvanced = false
      this.handleSearch()
    },

    handleAdd () {
      this.editForm = {
        id: '',
        serial: '',
        imei: '',
        meterName: '',
        bindType: '',
        logicPayType: '',
        ct: 1,
        pt: 1,
        phase: '',
        managerId: this.currentManagerId || '',
        priceId: ''
      }
      this.dialogVisible = true
      this.$nextTick(() => { this.$refs.editForm && this.$refs.editForm.clearValidate() })
    },

    handleEdit (row) {
      this.editForm = {
        id: row.id,
        serial: row.serial,
        imei: row.imei || '',
        meterName: row.meterName,
        bindType: row.bindType,
        logicPayType: row.logicPayType,
        ct: row.ct || 1,
        pt: row.pt || 1,
        phase: row.phase,
        managerId: row.managerId,
        priceId: row.priceId || ''
      }
      this.dialogVisible = true
      this.$nextTick(() => { this.$refs.editForm && this.$refs.editForm.clearValidate() })
    },

    async handleSave () {
      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          this.submitting = true
          try {
            const response = this.editForm.id
              ? await meterUpdateMeterBase(this.editForm)
              : await meterAddMeter(this.editForm)
            if (response.code === 200) {
              this.$message.success(this.editForm.id ? this.$t('deviceElectricity.successSaveUpdate') : this.$t('deviceElectricity.successSaveAdd'))
              this.dialogVisible = false
              this.fetchTableData()
            } else {
              this.$message.error(response.msg || this.$t('deviceElectricity.errOperation'))
            }
          } catch (error) {
            this.$apiError.notify(error, this.$t('deviceElectricity.errOperation'))
            console.error('保存失败:', error)
          } finally {
            this.submitting = false
          }
        }
      })
    },

    handleRouteQuery () {
      if (!this.queryData.managerId) return
      const { serial, autoSearch } = this.$route.query
      if (serial && autoSearch === 'true') {
        this.queryData.serial = serial
        this.$message.info(this.$t('deviceElectricity.infoSearchingSerial', { serial }))
        this.$nextTick(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          this.fetchTableData()
        })
        this.$router.replace({ path: this.$route.path, query: {} })
      } else {
        this.fetchTableData()
      }
    },

    async handleSwitch (row, type) {
      if (row.logicPayType === 0 || row.logicPayType === '0') {
        this.payTypeDialog = { visible: true, row, switchType: type }
        return
      }
      this.openSwitchVerifyDialog(row, type)
    },

    openSwitchVerifyDialog (row, type) {
      this.closeSwitchVerifyDialog()
      this.switchVerifyDialog = { visible: true, row, switchType: type }
    },

    closeSwitchVerifyDialog () {
      this.switchVerifyDialog.visible = false
      this.switchVerifyDialog.row = null
      this.switchVerifyDialog.switchType = null
      this.switchVerifyForm.code = ''
      this.switchSubmitting = false
      if (this.switchVerifyCountDownTimer) {
        clearInterval(this.switchVerifyCountDownTimer)
        this.switchVerifyCountDownTimer = null
      }
      this.switchVerifyCountDownSeconds = null
    },

    async sendSwitchVerifyCode () {
      if (!this.smsCountdownIdle) return
      if (!this.userPhone) {
        this.$message.warning(this.$t('deviceElectricity.warnNoPhone'))
        return
      }
      try {
        const { msg } = await authSendSmsCode({
          phone: this.userPhone,
          eventType: 'METER_SWITCH_OFF_ON'
        })
        this.$message.success(msg || this.$t('deviceElectricity.successCodeSent'))
      } catch (error) {
        try {
          const { msg } = await authSendSmsCode({
            phone: this.userPhone,
            eventType: 'METER_PRICE_MODIFY'
          })
          this.$message.success(msg || this.$t('deviceElectricity.successCodeSent'))
        } catch (error2) {
          this.$message.error(error2?.msg || error?.msg || this.$t('deviceElectricity.errSendCode'))
          return
        }
      }

      let seconds = 60
      this.switchVerifyCountDownSeconds = seconds
      this.switchVerifyCountDownTimer = setInterval(() => {
        seconds -= 1
        if (seconds <= 0) {
          clearInterval(this.switchVerifyCountDownTimer)
          this.switchVerifyCountDownTimer = null
          this.switchVerifyCountDownSeconds = null
          return
        }
        this.switchVerifyCountDownSeconds = seconds
      }, 1000)
    },

    async confirmSwitchOperation () {
      if (!this.switchVerifyDialog.row) return
      const code = (this.switchVerifyForm.code || '').trim()
      if (!code) {
        this.$message.warning(this.$t('deviceElectricity.warnEnterCode'))
        return
      }
      if (!this.userPhone) {
        this.$message.warning(this.$t('deviceElectricity.warnNoPhone'))
        return
      }
      const row = this.switchVerifyDialog.row
      const type = this.switchVerifyDialog.switchType
      const actionLabel = type === 1 ? this.$t('deviceElectricity.switchOn') : this.$t('deviceElectricity.switchOff')
      this.switchSubmitting = true
      try {
        await this.$confirm(
          this.$t('deviceElectricity.confirmSwitchMsg', { name: row.meterName, action: actionLabel }),
          this.$t('deviceElectricity.confirmSwitchTitle'),
          {
            confirmButtonText: this.$t('deviceElectricity.btnOk'),
            cancelButtonText: this.$t('deviceElectricity.btnCancelShort'),
            type: 'warning'
          }
        )
        await tenantDoMeterSwitchOffOn({
          meterId: row.id,
          switchStatus: type,
          verifyCode: code,
          verifyPhone: this.userPhone
        })
        this.$message.success(this.$t('deviceElectricity.successSwitch', { action: actionLabel }))
        this.closeSwitchVerifyDialog()
        this.fetchTableData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(error?.msg || this.$t('deviceElectricity.errSwitch', { action: actionLabel }))
        }
      } finally {
        this.switchSubmitting = false
      }
    },

    async handleUpdatePayType () {
      try {
        const response = await meterUpdateLogicPayType({ meterId: this.payTypeDialog.row.id, logicPayType: 1 })
        if (response.code === 200) {
          this.$message.success(this.$t('deviceElectricity.successPayTypeUpdate'))
          this.payTypeDialog.visible = false
          setTimeout(() => { this.handleSwitch(this.payTypeDialog.row, this.payTypeDialog.switchType) }, 500)
        } else {
          this.$message.error(response.msg || this.$t('deviceElectricity.errUpdate'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('deviceElectricity.errPayTypeUpdate'))
        console.error('修改失败:', error)
      }
    },

    handleMonitor (row) {
      this.detailDrawer = { visible: true, meterId: row.id, serial: row.serial }
    },

    handleCardClick (row) {
      if (!this.canView) return
      this.handleMonitor(row)
    },

    handleCopySerial (serial) {
      if (!serial || serial === '-') { this.$message.warning(this.$t('deviceElectricity.warnNothingToCopy')); return }
      const input = document.createElement('input')
      input.value = serial
      document.body.appendChild(input)
      input.select()
      try { document.execCommand('copy'); this.$message.success(this.$t('deviceElectricity.successSerialCopied')) } catch (err) { this.$apiError.notify(err, this.$t('deviceElectricity.errCopy')) }
      document.body.removeChild(input)
    },

    handleTenantClick (row) {
      if (!row.bindId) { this.$message.warning(this.$t('deviceElectricity.warnTenantNotBound')); return }
      if (row.bindType == 2) {
        this.$router.push({ path: '/metering/fee/electricitySharing/detail', query: { id: row.bindId } })
        return
      }
      this.$router.push({ path: `/metering/tenant/detail/${row.bindId}` })
    },

    handleExportCommand (command) {
      if (command === 'currentPage') this.exportCurrentPage()
      else if (command === 'selected') this.exportSelected()
      else if (command === 'all') this.exportAll()
    },

    /** 生成并触发 xlsx 下载（入参为已 formatTableData 处理后的行） */
    buildXlsx (rows) {
      const headers = this.displayColumns.map((col) => col.label)
      const keys = this.displayColumns.map((col) => col.key)
      const data = rows.map((row) => keys.map((key) => this.formatExportCell(row, key)))
      const wsData = [headers, ...data]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length * 2, 15) }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, this.$t('deviceElectricity.exportSheetName'))
      const now = new Date()
      const timeStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0')
      const fileName = `${this.$t('deviceElectricity.exportFilePrefix')}_${timeStr}.xlsx`
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
    },

    exportCurrentPage () {
      if (this.tableData.length === 0) { this.$message.warning(this.$t('deviceElectricity.warnNoExportData')); return }
      try {
        this.buildXlsx(this.tableData)
        this.$message.success(this.$t('deviceElectricity.successExported', { count: this.tableData.length }))
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('deviceElectricity.errExport'))
      }
    },

    exportSelected () {
      if (this.selectedRows.length === 0) { this.$message.warning(this.$t('deviceElectricity.warnNoSelectedExport')); return }
      try {
        this.buildXlsx(this.selectedRows)
        this.$message.success(this.$t('deviceElectricity.successExported', { count: this.selectedRows.length }))
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('deviceElectricity.errExport'))
      }
    },

    async exportAll () {
      if (!this.queryData.managerId || this.exportAllLoading) return
      this.exportAllLoading = true
      const loading = this.$loading({
        lock: true,
        text: this.$t('deviceElectricity.exporting'),
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.3)'
      })
      try {
        const params = this.buildQueryParams(EXPORT_ALL_LIMIT, 1)
        const response = await meterPageMeterInfoByAdmin(params)
        if (response.code === 200 && response.data) {
          const rawList = response.data.dataList || []
          const total = response.data.total || 0
          if (rawList.length === 0) { this.$message.warning(this.$t('deviceElectricity.warnNoExportData')); return }
          const rows = this.formatTableData(rawList)
          this.buildXlsx(rows)
          if (total > EXPORT_ALL_LIMIT) {
            this.$message.success(this.$t('deviceElectricity.successExportedLimit', { count: rows.length, total }))
          } else {
            this.$message.success(this.$t('deviceElectricity.successExported', { count: rows.length }))
          }
        } else {
          this.$message.error(response.msg || this.$t('deviceElectricity.errExport'))
        }
      } catch (error) {
        console.error('导出全部失败:', error)
        this.$apiError.notify(error, this.$t('deviceElectricity.errExport'))
      } finally {
        loading.close()
        this.exportAllLoading = false
      }
    },

    handleSelect (selection, row) {
      const isSelected = selection.some((item) => item.id === row.id)
      if (isSelected) {
        this.$set(this.selectedRowsMap, row.id, row)
      } else {
        this.$delete(this.selectedRowsMap, row.id)
      }
    },
    handleSelectAll (selection) {
      const currentPageIds = this.tableData.map((item) => item.id)
      currentPageIds.forEach((id) => { this.$delete(this.selectedRowsMap, id) })
      selection.forEach((row) => { this.$set(this.selectedRowsMap, row.id, row) })
    },
    openBatchOfflineTypeDialog () {
      if (this.selectedCount === 0) {
        this.$message.warning(this.$t('deviceElectricity.warnNoMeterSelected'))
        return
      }
      const onlineCount = this.selectedRows.filter((row) => Number(row.onlineStatus) === 1).length
      if (onlineCount > 0) {
        this.$message.warning(this.$t('deviceElectricity.warnOnlineMeterSelected', { count: onlineCount }))
        return
      }
      this.batchOfflineTypeDialog = { visible: true, offlineType: 2, offlineComment: '' }
    },
    closeBatchOfflineTypeDialog () {
      this.batchOfflineTypeDialog.visible = false
      this.batchOfflineTypeDialog.offlineType = null
      this.batchOfflineTypeDialog.offlineComment = ''
      this.batchSubmitting = false
    },
    async confirmBatchOfflineType () {
      const offlineType = this.batchOfflineTypeDialog.offlineType
      // 仅允许设置「正常离线」
      if (offlineType !== 2) {
        this.$message.warning(this.$t('deviceElectricity.warnSelectOfflineType'))
        return
      }
      const idList = this.selectedRows.map((row) => row.id)
      if (idList.length === 0) {
        this.$message.warning(this.$t('deviceElectricity.warnNoMeterSelected'))
        return
      }
      this.batchSubmitting = true
      try {
        const response = await meterBatchUpdateOfflineType({
          idList,
          offlineType,
          offlineComment: this.batchOfflineTypeDialog.offlineComment
        })
        if (response.code === 200) {
          this.$message.success(this.$t('deviceElectricity.successBatchOfflineType'))
          this.closeBatchOfflineTypeDialog()
          this.selectedRowsMap = {}
          this.fetchTableData()
        } else {
          this.$message.error(response.msg || this.$t('deviceElectricity.errBatchOfflineType'))
        }
      } catch (error) {
        this.$message.error(error?.msg || this.$t('deviceElectricity.errBatchOfflineType'))
        console.error('批量设置离线类型失败:', error)
      } finally {
        this.batchSubmitting = false
      }
    },
    handleSizeChange (val) { this.pageData.size = val; this.pageData.current = 1; this.fetchTableData() },
    handleCurrentChange (val) { this.pageData.current = val; this.fetchTableData() }
  }
}
</script>

<style lang="scss" scoped>
// ==================== 整体容器 ====================
.table-page-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

// ==================== 查询盒子 ====================
.search-box {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.search-form {
  margin: 0;

  .search-fields-row {
    display: flex;
    align-items: center;
    gap: 10px;

    &.advanced-row {
      margin-top: 10px;
      padding-top: 10px;
    }
  }

  .search-main-grid {
    width: 100%;
    display: grid;
    align-items: center;
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    gap: 10px;
  }

  .search-advanced-grid {
    width: 100%;
    display: grid;
    align-items: center;
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    gap: 10px;
    margin-top: 10px;
    padding-top: 0;
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
    justify-self: end;
    line-height: 1;

    // ElementUI 默认会给相邻按钮加 margin-left，导致按钮间距被撑大
    ::v-deep .el-button + .el-button {
      margin-left: 0 !important;
    }

    .toggle-advanced {
      font-size: 13px;
      color: #409eff;
      cursor: pointer;
      user-select: none;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      // 让“展开/收起”与两侧控件都留出舒适间距
      margin: 0 6px 0 8px;
      white-space: nowrap;

      &:hover {
        color: #66b1ff;
      }
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

  .search-actions-phantom {
    visibility: hidden;
    pointer-events: none;
    user-select: none;
  }

  // 保证第一行/第二行“列”分配完全一致，避免第二行元素自动落到第2列导致宽度与间距错乱
  .search-main-grid > .search-actions {
    grid-column: 5;
  }

  .search-advanced-grid .advanced-switch {
    grid-column: 1;
  }

  .search-advanced-grid > .search-actions-phantom {
    grid-column: 5;
  }
}

// ==================== 内容盒子 ====================
.content-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  flex: 1;
  padding: 16px 16px 10px;
}

// ==================== 工具栏 ====================
.content-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 8px;

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

    ::v-deep .el-button--primary {
      background: #1677ff;
      border-color: #1677ff;
      height: 32px;
      padding: 0 14px;
      font-size: 13px;
      border-radius: 6px;

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

::v-deep .sms-code-btn.el-button--primary {
  color: #ffffff !important;
}

// ==================== 列表视图 ====================
.list-view {
  padding: 0;

  .table-toolbar {
    display: flex;
    align-items: center;
    padding: 10px 0;
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

// ==================== 卡片视图 ====================
.card-view {
  padding: 0;

  /* 与列表一致：工具栏 padding-bottom 8px + 本区上边距 8px = 16px，对齐 content-box 顶部 16px，避免卡片模式“上宽下窄” */
  > div {
    margin-top: 8px;
  }

  .device-card-grid {
    padding-top: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;

    .device-card-col {
      min-width: 0;
    }
  }
}

// ==================== 表格样式 ====================
.light-border-table {
  margin-top: 8px;

  ::v-deep {
    border: 1px solid #f0f0f0 !important;

    .el-table__header-wrapper th {
      border-right: 1px solid #f0f0f0 !important;
      border-bottom: 1px solid #f0f0f0 !important;
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

    .el-table__fixed-right-patch {
      border-bottom: 1px solid #f0f0f0 !important;
      background-color: #f5f7fa !important;
    }
  }
}

// ==================== 卡片样式 ====================
.device-card {
  border-radius: 10px;
  border: 1px solid #e3eaf6;
  background: #fff;
  // 基础阴影，让卡片更有“厚度”（比纯边框明显）
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.08);
  transition: box-shadow 0.2s, border-color 0.2s;
  overflow: hidden;

  &:hover {
    border-color: #b9dbff;
    box-shadow: 0 10px 28px rgba(16, 24, 40, 0.08), inset 0 0 0 1px #b9dbff;
  }

  ::v-deep .el-card__body {
    padding: 14px;
  }

  &.is-clickable {
    cursor: pointer;
  }
}

.device-card-main {
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  gap: 12px;
}

.device-card-left {
  flex: 0 1 auto;
  min-width: 0;
  max-width: calc(100% - 108px);
}

.device-card-right {
  width: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
}

.device-card-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  display: block;
}

.device-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  line-height: 22px;
  margin-bottom: 8px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  // 仅卡片模式标题：链接也使用黑色加粗（不影响列表模式）
  ::v-deep .el-link--primary {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #111827;
    font-weight: 700;
  }

  ::v-deep .el-link--primary:hover,
  ::v-deep .el-link--primary:focus {
    color: #111827;
  }

  > span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.device-card-tags {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.device-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kv {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;

  .k {
    color: #9CA3AF;
    flex-shrink: 0;
    width: 62px;
  }

  .v {
    color: #111827;
    min-width: 0;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    // `el-link` 默认是行内元素，容易撑破父级省略号规则；这里强制它也做溢出省略
    ::v-deep .el-link {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }
  }
}

.device-card-actions-bar {
  margin-top: 14px;
  border-top: 1px solid #F1F5F9;
  display: flex;
  align-items: stretch;
}

.card-action {
  flex: 1;
  height: 40px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #f5f7fa;
    color: #1677ff;
  }

  &:disabled {
    cursor: not-allowed;
    color: #C0C4CC;

    &:hover {
      background: transparent;
      color: #C0C4CC;
    }
  }

  & + .card-action {
    border-left: 1px solid #F1F5F9;
  }
}

// ==================== 操作列 ====================
.operation-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  gap: 10px;

  .op-btn {
    padding: 0;
    margin: 0;
    font-size: 12px;
    line-height: 1;
    flex-shrink: 0;

    &.primary-btn {
      color: #1677ff;

      &:hover { color: #4096ff; }
      &:active { color: #0958d9; }
    }
  }
}

// ==================== 状态点 ====================
.status-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;

  &.online {
    background: #52c41a;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
  }

  &.offline {
    background: #d9d9d9;
  }

  &.offline-abnormal {
    background: #E6A23C;
  }
}

.option-with-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

// ==================== 序列号复制 ====================
.serial-copy {
  color: #374151;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;

  &:hover { color: #1677ff; }
  &:active { color: #0958d9; }
}

// ==================== 分页 ====================
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 14px 0 4px;

  &.compact-pagination {
  ::v-deep .el-pagination {
    display: flex !important;
    align-items: center !important;
    font-size: 12px;

    span,
    button,
    .el-pager li,
    .el-pagination__total,
    .el-pagination__jump,
    .el-pagination__sizes,
    .el-pagination__sizes .el-input,
    .el-pagination__sizes .el-input__inner,
    .btn-prev,
    .btn-next {
      vertical-align: middle;
      display: inline-flex !important;
      align-items: center !important;
    }

    .el-pagination__total { font-size: 12px; }

    .el-pagination__sizes .el-input {
      width: 88px !important;
      min-width: 0 !important;
      .el-input__inner {
        height: 24px;
        font-size: 12px;
        padding: 0 8px;
        box-sizing: border-box;
      }
    }

    .btn-prev, .btn-next {
      min-width: 24px;
      height: 24px;
      font-size: 12px;
      padding: 0 6px;
    }

    .el-pager li {
      min-width: 24px;
      height: 24px;
      font-size: 12px;
      padding: 0 6px;
    }

    .el-pagination__jump {
      font-size: 12px;
      .el-input .el-input__inner {
        height: 24px;
        font-size: 12px;
        padding: 0 4px;
      }
    }
  }
}
}

// ==================== 文字辅助 ====================
.text-muted {
  color: #c0c4cc;
}

// ==================== 价格弹出框 ====================
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
          content: '';
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
        font-family: 'SF Mono', monospace;
      }

      &.peak .price-label::before { background: #dc2626; }
      &.top .price-label::before { background: #f59e0b; }
      &.flat .price-label::before { background: #3b82f6; }
      &.valley .price-label::before { background: #10b981; }
    }
  }
}

.price-name-link {
  color: #374151;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  &:hover { color: #1677ff; }
}

// ==================== 确认弹窗 ====================
.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;

  .warning-icon {
    font-size: 24px;
    color: #faad14;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .confirm-text p {
    margin: 0 0 6px;
    font-size: 14px;
    color: #374151;
    line-height: 1.6;

    &:last-child { margin-bottom: 0; }
  }
}
</style>
