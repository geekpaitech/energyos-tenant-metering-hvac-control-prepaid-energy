<template>
  <div class="table-page-container floating-price-page">
    <template v-if="canView">
      <div class="search-box">
        <el-form
          class="search-form"
          @submit.native.prevent
          @keyup.enter.native="handleSearchClick"
        >
          <div class="search-main-grid">
            <div class="field-item">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="-"
                :start-placeholder="$t('floatPriceBillPage.phDateStart')"
                :end-placeholder="$t('floatPriceBillPage.phDateEnd')"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                size="small"
                clearable
                style="width: 100%"
                @change="handleDateChange"
                @clear="handleDateChange"
              />
            </div>
            <div class="search-actions">
              <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearchClick">{{ $t('floatPriceBillPage.btnSearch') }}</el-button>
              <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('floatPriceBillPage.btnReset') }}</el-button>
              <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">{{ $t('floatPriceBillPage.btnExport') }}</el-button>
            </div>
          </div>
        </el-form>
      </div>

      <div class="content-box">
        <div class="content-toolbar">
          <div class="toolbar-left">
            <span class="section-title">
              <span class="title-bar" />
              {{ $t('floatPriceBillPage.sectionTitle') }}
            </span>
          </div>
          <div class="toolbar-right">
            <el-button
              v-if="canCreateFloat"
              type="primary"
              size="small"
              icon="el-icon-plus"
              @click="handleCreateFloat"
            >
              {{ $t('floatPriceBillPage.btnCreateFloat') }}
            </el-button>
            <el-select v-model="sortOrder" size="small" style="width: 100px">
              <el-option :label="$t('floatPriceBillPage.sortDefault')" value="default" />
            </el-select>
          </div>
        </div>

        <div class="list-view">
          <div v-if="selectedData.length > 0" class="table-toolbar">
            <span class="selection-info" v-html="$t('floatPriceBillPage.selectedLine', { count: selectedData.length })" />
          </div>

          <el-table
            v-loading="loading"
            border
            :data="tableData"
            :max-height="tableMaxHeight"
            stripe
            style="width: 100%"
            class="custom-table light-border-table"
            @selection-change="handleTableSelectionChange"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column prop="rid" :label="$t('floatPriceBillPage.colRid')" min-width="100" show-overflow-tooltip />
            <el-table-column :label="$t('floatPriceBillPage.colFloatRange')" min-width="200" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ formatFloatRange(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column prop="floatType" :label="$t('floatPriceBillPage.colFloatType')" width="120" align="center">
              <template slot-scope="scope">
                <el-tag :type="scope.row.floatType === 'GLOBAL' ? 'success' : 'primary'" size="small">
                  {{ getFloatTypeLabel(scope.row.floatType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('floatPriceBillPage.colBillDate')" width="120" align="center" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.settleDate || scope.row.billDate || '-' }}
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('floatPriceBillPage.colTargetPrice')"
              min-width="200"
              align="right"
              header-align="right"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                {{ formatTargetElectricityPrice(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('floatPriceBillPage.colFloatAmount')" width="120" align="right">
              <template slot-scope="scope">
                <span :class="['balance-value', scope.row.totalFloatBalance >= 0 ? 'positive' : 'negative']">
                  {{ scope.row.totalFloatBalance >= 0 ? '+' : '' }}{{ scope.row.totalFloatBalance }}{{ $t('floatPriceBillPage.unitYuan') }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="userPhone" :label="$t('floatPriceBillPage.colCreator')" min-width="130" show-overflow-tooltip />
            <el-table-column prop="createTime" :label="$t('floatPriceBillPage.colCreateTime')" min-width="160" />
            <el-table-column :label="$t('floatPriceBillPage.colDetail')" width="100" fixed="right" align="center" :resizable="false">
              <template slot-scope="scope">
                <el-button type="text" size="mini" class="op-btn primary-btn" @click="handleDetail(scope.row)">
                  {{ $t('floatPriceBillPage.btnDetail') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

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

      <!-- 创建浮动电价抽屉 -->
      <el-drawer :title="$t('floatPriceBillPage.drawerTitleCreate')" :visible.sync="drawerVisible" direction="rtl" size="80%" :wrapper-closable="true"
        custom-class="float-drawer">
        <div class="drawer-content">
          <div class="tenant-panel">
            <div class="panel-header">
              <i class="el-icon-user-solid"></i>
              <span>{{ $t('floatPriceBillPage.panelSelectTenant') }}</span>
            </div>

            <div class="panel-search">
              <el-input v-model="tenantFilter" :placeholder="$t('floatPriceBillPage.phSearchTenant')" prefix-icon="el-icon-search" size="small"
                clearable />
            </div>

            <div class="panel-list">
              <!-- 层级级联：横向多列选择（替代垂直树） -->
              <div class="panel-section">
                <div class="section-label">{{ $t('floatPriceBillPage.panelTenantTier') }}</div>
                <div v-loading="tierTreeLoading" class="tier-cascader-wrap" :class="{ 'has-value': hasTierCascadeSelection }">
                  <el-cascader
                    ref="tierCascader"
                    v-model="tierCheckedKeys"
                    :options="processedTierTreeData"
                    :props="tierCascaderProps"
                    :placeholder="$t('floatPriceBillPage.phSelectTenantTier')"
                    clearable
                    collapse-tags
                    size="small"
                    popper-class="float-tier-cascader-dropdown"
                    class="tier-cascader"
                    @change="handleTierCascadeChange"
                    @visible-change="handleTierCascaderVisibleChange"
                    @clear="clearTierCascadeSelection"
                  />
                </div>
              </div>

              <el-divider class="panel-divider" />

              <!-- 平铺列表：展示全部租户（含未绑定层级） -->
              <div class="panel-section panel-section-list">
                <div class="section-label">{{ $t('floatPriceBillPage.panelTenantList') }}</div>
                <el-checkbox-group
                  v-model="selectedTenantIds"
                  class="tenant-list-group"
                  @change="handleFlatTenantChange"
                >
                  <div class="select-all-item">
                    <el-checkbox label="all" @change="handleSelectAll">
                      <span class="tenant-name">{{ $t('floatPriceBillPage.tenantAll') }}</span>
                    </el-checkbox>
                  </div>
                  <div class="tenant-list-wrapper">
                    <div v-for="tenant in filteredTenants" :key="tenant.id" class="tenant-item">
                      <el-checkbox :label="tenant.id">
                        <span class="tenant-name">{{ $displayBizHybrid(tenant.name || '') }}</span>
                      </el-checkbox>
                    </div>
                    <div v-if="filteredTenants.length === 0" class="tenant-list-empty">
                      {{ $t('floatPriceBillPage.tenantListEmpty') }}
                    </div>
                  </div>
                </el-checkbox-group>
              </div>
            </div>
          </div>

          <div class="form-panel">
            <div class="form-card">
              <div class="card-header">
                <span class="card-title">{{ $t('floatPriceBillPage.cardBasicConfig') }}</span>
              </div>
              <div class="card-body">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="form-item">
                      <label class="required">{{ $t('floatPriceBillPage.lblDateRange') }}</label>
                      <div class="date-range-input">
                        <el-date-picker v-model="formData.startDate" type="date" :placeholder="$t('floatPriceBillPage.phStartTime')" format="yyyy-MM-dd"
                          value-format="yyyy-MM-dd" size="small" style="width: 45%" />
                        <span class="separator">{{ $t('floatPriceBillPage.rangeTo') }}</span>
                        <el-date-picker v-model="formData.endDate" type="date" :placeholder="$t('floatPriceBillPage.phEndTime')" format="yyyy-MM-dd"
                          value-format="yyyy-MM-dd" size="small" style="width: 45%" />
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="form-item">
                      <label class="required">{{ $t('floatPriceBillPage.lblFloatType') }}</label>
                      <el-select v-model="formData.floatType" :placeholder="$t('floatPriceBillPage.phFloatType')" size="small" style="width: 100%"
                        @change="handleFloatTypeChange">
                        <el-option :label="$t('floatPriceBillPage.floatTypePart')" value="PART" />
                        <el-option :label="$t('floatPriceBillPage.floatTypeGlobal')" value="GLOBAL" />
                      </el-select>
                    </div>
                  </el-col>
                </el-row>

                <div class="query-button-wrapper">
                  <el-button type="primary" size="medium" icon="el-icon-search" :loading="queryLoading"
                    @click="handleQuery" :disabled="!canQuery">
                    {{ $t('floatPriceBillPage.btnQueryUsage') }}
                  </el-button>
                  <el-tag v-if="!canQuery" type="info" size="small" class="query-tip">
                    {{ $t('floatPriceBillPage.tipQueryPrereq') }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div v-if="queryResult.length > 0" class="form-card large-card">
              <div class="card-header">
                <span class="card-title">{{ $t('floatPriceBillPage.cardUsageStats') }}</span>
                <el-tag type="success" size="small">
                  {{ $t('floatPriceBillPage.statsRecords', { count: queryResult.length }) }}
                  <span v-if="formData.floatType === 'PART'">
                    {{ $t('floatPriceBillPage.statsSelected', { count: selectedQueryItems.length }) }}
                  </span>
                </el-tag>
              </div>
              <div class="card-body">
                <div class="result-table-wrapper">
                  <el-table ref="queryTable" :data="queryResult" size="small" style="width: 100%"
                    :header-cell-style="{ background: '#fafafa', color: '#606266' }"
                    @selection-change="handleQuerySelectionChange">
                    <el-table-column v-if="formData.floatType === 'PART'" type="selection" width="55" align="center" />

                    <el-table-column :label="$t('floatPriceBillPage.colTenantName')" min-width="150">
                      <template slot-scope="scope">
                        {{ $displayBizHybrid(scope.row.tenantName || '') || '-' }}
                      </template>
                    </el-table-column>

                    <el-table-column v-if="formData.floatType === 'PART'" :label="$t('floatPriceBillPage.colPartName')" min-width="150">
                      <template slot-scope="scope">
                        {{ $displayBizHybrid(scope.row.partName || '') || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column v-if="formData.floatType === 'PART'" prop="bindType" :label="$t('floatPriceBillPage.colBindType')" width="100"
                      align="center">
                      <template slot-scope="scope">
                        <el-tag :type="getBindTypeTagType(scope.row.bindType)" size="mini">
                          {{ getBindTypeName(scope.row.bindType) }}
                        </el-tag>
                      </template>
                    </el-table-column>

                    <el-table-column :label="$t('floatPriceBillPage.colPeakKwh')" align="center" width="100">
                      <template slot-scope="scope">
                        <span class="data-value">{{ scope.row.useElecPeak || 0 }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('floatPriceBillPage.colTopKwh')" align="center" width="100">
                      <template slot-scope="scope">
                        <span class="data-value">{{ scope.row.useElecTop || 0 }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('floatPriceBillPage.colFlatKwh')" align="center" width="100">
                      <template slot-scope="scope">
                        <span class="data-value">{{ scope.row.useElecFlat || 0 }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('floatPriceBillPage.colValleyKwh')" align="center" width="100">
                      <template slot-scope="scope">
                        <span class="data-value">{{ scope.row.useElecValley || 0 }}</span>
                      </template>
                    </el-table-column>

                    <el-table-column :label="$t('floatPriceBillPage.colSettledAmount')" align="center" width="120">
                      <template slot-scope="scope">
                        <span class="balance-text">¥{{ scope.row.alreadyBalance || 0 }}</span>
                      </template>
                    </el-table-column>

                    <el-table-column :label="$t('floatPriceBillPage.colTargetAmount')" align="center" width="120">
                      <template slot-scope="scope">
                        <span class="target-balance">¥{{ scope.row.afterBalance || '0.00' }}</span>
                      </template>
                    </el-table-column>

                    <el-table-column :label="$t('floatPriceBillPage.colFloatAmountYuan')" align="center" width="120">
                      <template slot-scope="scope">
                        <span :class="getFloatBalanceClass(scope.row.floatBalance)">
                          {{ parseFloat(scope.row.floatBalance) > 0 ? '+' : '' }}¥{{ scope.row.floatBalance || '0.00' }}
                        </span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </div>

            <div v-if="queryResult.length > 0" class="form-card small-card">
              <div class="card-header">
                <span class="card-title">{{ $t('floatPriceBillPage.cardPriceFloat') }}</span>
              </div>
              <div class="card-body">
                <div class="price-grid-simple">
                  <div class="price-item">
                    <label class="required">{{ $t('floatPriceBillPage.lblPeakPrice') }}</label>
                    <el-input-number v-model="formData.powerPeakPrice" :precision="4" :step="0.0001" :min="0" size="small"
                      controls-position="right" :placeholder="$t('floatPriceBillPage.phPriceZero')" @change="calculateBalances" />
                    <span class="price-unit">{{ $t('floatPriceBillPage.unitPerKwh') }}</span>
                  </div>

                  <div class="price-item">
                    <label class="required">{{ $t('floatPriceBillPage.lblTopPrice') }}</label>
                    <el-input-number v-model="formData.powerTopPrice" :precision="4" :step="0.0001" :min="0" size="small"
                      controls-position="right" :placeholder="$t('floatPriceBillPage.phPriceZero')" @change="calculateBalances" />
                    <span class="price-unit">{{ $t('floatPriceBillPage.unitPerKwh') }}</span>
                  </div>

                  <div class="price-item">
                    <label class="required">{{ $t('floatPriceBillPage.lblFlatPrice') }}</label>
                    <el-input-number v-model="formData.powerFlatPrice" :precision="4" :step="0.0001" :min="0" size="small"
                      controls-position="right" :placeholder="$t('floatPriceBillPage.phPriceZero')" @change="calculateBalances" />
                    <span class="price-unit">{{ $t('floatPriceBillPage.unitPerKwh') }}</span>
                  </div>

                  <div class="price-item">
                    <label class="required">{{ $t('floatPriceBillPage.lblValleyPrice') }}</label>
                    <el-input-number v-model="formData.powerValleyPrice" :precision="4" :step="0.0001" :min="0" size="small"
                      controls-position="right" :placeholder="$t('floatPriceBillPage.phPriceZero')" @change="calculateBalances" />
                    <span class="price-unit">{{ $t('floatPriceBillPage.unitPerKwh') }}</span>
                  </div>
                </div>

                <el-row :gutter="20" class="other-info">
                  <el-col :span="12">
                    <div class="form-item">
                      <label class="required">{{ $t('floatPriceBillPage.lblBillDate') }}</label>
                      <el-date-picker v-model="formData.settleDate" type="date" :placeholder="$t('floatPriceBillPage.phBillDate')" format="yyyy-MM-dd"
                        value-format="yyyy-MM-dd" size="small" style="width: 100%" />
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="form-item">
                      <label class="required">{{ $t('floatPriceBillPage.lblRemark') }}</label>
                      <el-input v-model="formData.remark" type="textarea" :rows="2" :placeholder="$t('floatPriceBillPage.phRemark')" maxlength="200"
                        show-word-limit />
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-footer">
          <el-button size="medium" @click="drawerVisible = false">{{ $t('floatPriceBillPage.btnCancel') }}</el-button>
          <el-button type="primary" size="medium" :loading="submitting" @click="handleSubmit" :disabled="!canSubmit">
            {{ $t('floatPriceBillPage.btnConfirmCreate') }}
          </el-button>
        </div>
      </el-drawer>

      <!-- 详情抽屉 -->
      <el-drawer :title="$t('floatPriceBillPage.drawerTitleDetail')" :visible.sync="detailDrawerVisible" direction="rtl" size="70%" :wrapper-closable="true"
        custom-class="detail-drawer">
        <div class="detail-content" v-loading="detailLoading">
          <div class="detail-card">
            <div class="detail-header">
              <span class="detail-title">{{ $t('floatPriceBillPage.detailBasicInfo') }}</span>
            </div>
            <div class="detail-body">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-item">
                    <label>{{ $t('floatPriceBillPage.lblRid') }}</label>
                    <span>{{ detailData.floatDto?.rid || '-' }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>{{ $t('floatPriceBillPage.detailLblFloatType') }}</label>
                    <el-tag :type="detailData.floatDto?.floatType === 'GLOBAL' ? 'success' : 'primary'" size="small">
                      {{ getFloatTypeLabel(detailData.floatDto?.floatType) }}
                    </el-tag>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>{{ $t('floatPriceBillPage.lblCreateTime') }}</label>
                    <span>{{ detailData.floatDto?.createTime || '-' }}</span>
                  </div>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-item">
                    <label>{{ $t('floatPriceBillPage.lblCreator') }}</label>
                    <span>{{ detailData.floatDto?.userPhone || '-' }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>{{ $t('floatPriceBillPage.lblDateRangeDetail') }}</label>
                    <span>{{ detailData.floatDto?.startDate || '-' }} {{ $t('floatPriceBillPage.rangeTo') }} {{ detailData.floatDto?.endDate || '-' }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-item">
                    <label>{{ $t('floatPriceBillPage.lblBillDateDetail') }}</label>
                    <span>{{ detailData.floatDto?.settleDate || detailData.floatDto?.billDate || '-' }}</span>
                  </div>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-item">
                    <label>{{ $t('floatPriceBillPage.lblTotalFloat') }}</label>
                    <span
                      :class="['balance-value', detailData.floatDto?.totalFloatBalance >= 0 ? 'positive' : 'negative']">
                      {{ detailData.floatDto?.totalFloatBalance >= 0 ? '+' : '' }}{{
                        detailData.floatDto?.totalFloatBalance ||
                      0 }}{{ $t('floatPriceBillPage.unitYuan') }}
                    </span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-header">
              <span class="detail-title">{{ $t('floatPriceBillPage.detailTargetPrice') }}</span>
            </div>
            <div class="detail-body">
              <div class="price-info-grid">
                <div class="price-info-item">
                  <label>{{ $t('floatPriceBillPage.lblPeakPrice') }}</label>
                  <span class="price-value">{{ detailData.floatDto?.powerPeakPrice || 0 }} {{ $t('floatPriceBillPage.unitPerKwh') }}</span>
                </div>
                <div class="price-info-item">
                  <label>{{ $t('floatPriceBillPage.lblTopPrice') }}</label>
                  <span class="price-value">{{ detailData.floatDto?.powerTopPrice || 0 }} {{ $t('floatPriceBillPage.unitPerKwh') }}</span>
                </div>
                <div class="price-info-item">
                  <label>{{ $t('floatPriceBillPage.lblFlatPrice') }}</label>
                  <span class="price-value">{{ detailData.floatDto?.powerFlatPrice || 0 }} {{ $t('floatPriceBillPage.unitPerKwh') }}</span>
                </div>
                <div class="price-info-item">
                  <label>{{ $t('floatPriceBillPage.lblValleyPrice') }}</label>
                  <span class="price-value">{{ detailData.floatDto?.powerValleyPrice || 0 }} {{ $t('floatPriceBillPage.unitPerKwh') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-header">
              <span class="detail-title">{{ $t('floatPriceBillPage.detailFloatItems') }}</span>
              <el-tag type="info" size="small">{{ $t('floatPriceBillPage.detailRecordsCount', { count: detailData.floatContentDtoList?.length || 0 }) }}</el-tag>
            </div>
            <div class="detail-body">
              <el-table :data="detailData.floatContentDtoList || []" style="width: 100%" max-height="400"
                :header-cell-style="{ background: '#f5f7fa', color: '#303133' }">
                <el-table-column :label="$t('floatPriceBillPage.colTenantName')" min-width="150">
                  <template slot-scope="scope">
                    {{ $displayBizHybrid(scope.row.tenantName || '') || '-' }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('floatPriceBillPage.colUseElecGroup')" align="center">
                  <el-table-column prop="useElecPeak" :label="$t('floatPriceBillPage.colSharp')" align="center" width="80" />
                  <el-table-column prop="useElecTop" :label="$t('floatPriceBillPage.colPeak')" align="center" width="80" />
                  <el-table-column prop="useElecFlat" :label="$t('floatPriceBillPage.colFlat')" align="center" width="80" />
                  <el-table-column prop="useElecValley" :label="$t('floatPriceBillPage.colValley')" align="center" width="80" />
                </el-table-column>
                <el-table-column prop="alreadyBalance" :label="$t('floatPriceBillPage.detailColAlready')" align="center" width="100">
                  <template slot-scope="scope">
                    <span>¥{{ scope.row.alreadyBalance || 0 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="floatBalance" :label="$t('floatPriceBillPage.detailColFloatAmt')" align="center" width="100">
                  <template slot-scope="scope">
                    <span :class="scope.row.floatBalance >= 0 ? 'text-success' : 'text-danger'">
                      {{ scope.row.floatBalance >= 0 ? '+' : '' }}¥{{ scope.row.floatBalance || 0 }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="afterBalance" :label="$t('floatPriceBillPage.detailColTargetBal')" align="center" width="100">
                  <template slot-scope="scope">
                    <span>¥{{ scope.row.afterBalance || 0 }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>

        <div class="drawer-footer">
          <el-button size="medium" @click="detailDrawerVisible = false">{{ $t('floatPriceBillPage.btnClose') }}</el-button>
        </div>
      </el-drawer>
    </template>
    <div v-else class="float-no-perm">
      <el-empty :description="$t('floatPriceBillPage.emptyNoViewPerm')" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { floatPageFloat, floatPreQuery, floatDoFloat, tenantPage, queryFloatDetail } from '@/api/floatPrice'
import { tierSelectTenantTierList } from '@/api/tier'
import * as XLSX from 'xlsx'
export default {
  name: 'FloatingPrice',
  data () {
    return {
      dateRange: [],
      sortOrder: 'default',
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68
      },
      queryData: {
        managerId: '',
        startDate: '',
        endDate: '',
        // 价格数组：[尖价, 峰价, 平价, 谷价]
        price: [0, 0, 0, 0]
      },
      tableData: [],
      loading: false,
      queryLoading: false,
      submitting: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      drawerVisible: false,
      detailDrawerVisible: false,
      detailLoading: false,
      detailData: {
        floatDto: {},
        floatContentDtoList: []
      },
      tenantList: [],
      tenantFilter: '',
      tierTreeLoading: false,
      tierTreeData: [],
      tierCheckedKeys: [],
      tierCascaderProps: {
        multiple: true,
        checkStrictly: false,
        emitPath: false,
        value: '_treeKey',
        label: 'name',
        children: 'tenantTierDtoList'
      },
      _programmaticTierSync: false,
      _suppressTierCascaderOpen: false,
      tierListFilterActive: false,
      selectedTenantIds: [],
      selectedQueryItems: [], // 部分浮动时选中的数据项
      formData: {
        startDate: '',
        endDate: '',
        floatType: '',
        // 修正：按照正确的字段映射
        powerPeakPrice: 0, // 尖时电价
        powerTopPrice: 0, // 峰时电价
        powerFlatPrice: 0, // 平时电价
        powerValleyPrice: 0, // 谷时电价
        settleDate: '',
        remark: ''
      },
      queryResult: [],
      selectedData: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canView () {
      return this.hasKztPermission('650031')
    },
    canCreateFloat () {
      return this.hasKztPermission('650030')
    },
    filteredTenants () {
      let list = this.tenantList
      const keyword = (this.tenantFilter || '').trim()
      if (keyword) {
        list = list.filter(tenant =>
          (tenant.name && tenant.name.includes(keyword)) ||
          tenant.id.toString().includes(keyword)
        )
      }
      // 先选了租户层级：已绑定层级的租户只展示当前选中的；未绑定层级的仍全部展示
      if (this.tierListFilterActive && this.treeTenantIdSet.size > 0) {
        const selectedSet = new Set(this.actualSelectedIds)
        list = list.filter(tenant => {
          const id = Number(tenant.id)
          if (!this.treeTenantIdSet.has(id)) return true
          return selectedSet.has(id)
        })
      }
      return list
    },
    processedTierTreeData () {
      return this.processTierTreeNodes(this.tierTreeData)
    },
    treeTenantIdSet () {
      const ids = new Set()
      const walk = (nodes) => {
        (nodes || []).forEach(node => {
          if (node.tenantId) ids.add(Number(node.tenantId))
          if (node.tenantTierDtoList && node.tenantTierDtoList.length) {
            walk(node.tenantTierDtoList)
          }
        })
      }
      walk(this.tierTreeData)
      return ids
    },
    actualSelectedIds () {
      return [...new Set(
        this.selectedTenantIds
          .filter(id => id !== 'all')
          .map(id => Number(id))
          .filter(id => Number.isFinite(id) && id > 0)
      )]
    },
    hasTierCascadeSelection () {
      if (Array.isArray(this.tierCheckedKeys) && this.tierCheckedKeys.length > 0) return true
      return this.actualSelectedIds.some(id => this.treeTenantIdSet.has(id))
    },
    canQuery () {
      return this.formData.startDate &&
        this.formData.endDate &&
        this.formData.floatType &&
        this.actualSelectedIds.length > 0
    },
    priceHasAnyPositive () {
      const prices = [
        Number(this.formData.powerPeakPrice) || 0,
        Number(this.formData.powerTopPrice) || 0,
        Number(this.formData.powerFlatPrice) || 0,
        Number(this.formData.powerValleyPrice) || 0
      ]
      return prices.some(v => v > 0)
    },
    canSubmit () {
      // 整体浮动时，需要有查询结果
      if (this.formData.floatType === 'GLOBAL') {
        return this.queryResult.length > 0 &&
          this.priceHasAnyPositive &&
          this.formData.settleDate &&
          this.formData.remark
      }
      // 部分浮动时，需要有选中的项
      return this.selectedQueryItems.length > 0 &&
        this.priceHasAnyPositive &&
        this.formData.settleDate &&
        this.formData.remark
    },
    tableMaxHeight () {
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    }
  },
  watch: {
    drawerVisible (val) {
      if (val) {
        this.$nextTick(() => this.closeTierCascaderDropdown())
      } else {
        this.closeTierCascaderDropdown()
      }
    },
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          if (this.canView) {
            if (!this.queryData.startDate || !this.queryData.endDate) {
              this.setDefaultDateRange()
            }
            this.fetchTableData()
          }
        }
      },
      immediate: true
    },
    canView: {
      handler (val) {
        if (val && this.currentManagerId) {
          this.queryData.managerId = this.currentManagerId
          if (!this.queryData.startDate || !this.queryData.endDate) {
            this.setDefaultDateRange()
          }
          this.fetchTableData()
        }
      },
      immediate: true
    }
  },
  methods: {
    getFloatTypeLabel (code) {
      return code === 'GLOBAL'
        ? this.$t('floatPriceBillPage.floatTypeGlobal')
        : this.$t('floatPriceBillPage.floatTypePart')
    },

    setDefaultDateRange () {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
      const fmt = (d) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      this.dateRange = [fmt(startDate), fmt(endDate)]
      this.queryData.startDate = this.dateRange[0]
      this.queryData.endDate = this.dateRange[1]
    },

    handleSearchClick () {
      if (!this.canView) return
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleReset () {
      if (!this.canView) return
      this.setDefaultDateRange()
      this.pageData.current = 1
      this.fetchTableData()
    },

    formatFloatRange (row) {
      const s = row.startDate
      const e = row.endDate
      if (!s && !e) return '-'
      if (s && e) return `${s}~${e}`
      return s || e || '-'
    },

    formatPriceSegment (v) {
      if (v === null || v === undefined || v === '') return '-'
      const n = Number(v)
      if (Number.isNaN(n)) return String(v)
      const s = n.toFixed(4)
      return s.replace(/\.?0+$/, '')
    },

    formatTargetElectricityPrice (row) {
      const parts = [
        this.formatPriceSegment(row.powerPeakPrice),
        this.formatPriceSegment(row.powerTopPrice),
        this.formatPriceSegment(row.powerFlatPrice),
        this.formatPriceSegment(row.powerValleyPrice)
      ]
      if (parts.every((p) => p === '-')) return '-'
      return parts.join('/')
    },

    handleDateChange (dates) {
      if (!this.canView) return
      if (dates?.length === 2) {
        this.queryData.startDate = dates[0]
        this.queryData.endDate = dates[1]
      } else {
        this.queryData.startDate = ''
        this.queryData.endDate = ''
      }
      this.pageData.current = 1
      this.fetchTableData()
    },

    async fetchTableData () {
      this.loading = true
      if (!this.canView) {
        this.tableData = []
        this.pageData.total = 0
        this.loading = false
        return
      }
      try {
        const response = await floatPageFloat({
          managerId: this.queryData.managerId,
          startDate: this.queryData.startDate,
          endDate: this.queryData.endDate,
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            searchCount: true,
            orders: [{ asc: false, column: 'createTime' }]
          }
        })
        if (response.code === 200) {
          this.tableData = response.data?.dataList || []
          this.pageData.total = response.data?.total || 0
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('floatPriceBillPage.msgFetchFail'))
      } finally {
        this.loading = false
      }
    },

    processTierTreeNodes (nodes, level = 1) {
      return (nodes || []).map(node => {
        const processed = {
          ...node,
          level,
          name: node.name || node.tenantName || '',
          _treeKey: node.tenantId ? `t-${node.tenantId}` : `tier-${node.id}`
        }
        if (node.tenantTierDtoList && node.tenantTierDtoList.length) {
          processed.tenantTierDtoList = this.processTierTreeNodes(node.tenantTierDtoList, level + 1)
        }
        return processed
      })
    },

    findTierNodeByKey (key, nodes = this.processedTierTreeData) {
      for (const node of nodes || []) {
        if (node._treeKey === key) return node
        if (node.tenantTierDtoList && node.tenantTierDtoList.length) {
          const found = this.findTierNodeByKey(key, node.tenantTierDtoList)
          if (found) return found
        }
      }
      return null
    },

    collectTenantIdsFromSubtree (node) {
      const ids = []
      if (!node) return ids
      if (node.tenantId) ids.push(Number(node.tenantId))
      ;(node.tenantTierDtoList || []).forEach(child => {
        ids.push(...this.collectTenantIdsFromSubtree(child))
      })
      return ids
    },

    async fetchTenantList () {
      if (!this.canView) return
      try {
        const response = await tenantPage({
          id: '',
          managerId: this.currentManagerId,
          labelIds: '',
          balanceStatus: null,
          tenantStatus: 0,
          idList: [],
          page: { current: 1, size: 1000, orders: [{ asc: true, column: 'id' }] }
        })
        if (response.code === 200) {
          this.tenantList = response.data?.dataList || []
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('floatPriceBillPage.msgTenantListFail'))
      }
    },

    async loadTierTreeData () {
      if (!this.canView || !this.currentManagerId) return

      try {
        this.tierTreeLoading = true
        const response = await tierSelectTenantTierList({
          managerId: this.currentManagerId
        })
        if (response.code === 200) {
          this.tierTreeData = response.data || []
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('floatPriceBillPage.msgTenantListFail'))
      } finally {
        this.tierTreeLoading = false
      }
    },

    clearTierCascadeSelection () {
      this._programmaticTierSync = true
      this.tierCheckedKeys = []
      this.applyTierClearLinkage()
      this.$nextTick(() => {
        const panel = this.$refs.tierCascader && this.$refs.tierCascader.panel
        if (panel && typeof panel.clearCheckedNodes === 'function') {
          panel.clearCheckedNodes()
        }
        this._programmaticTierSync = false
        this.closeTierCascaderDropdown()
      })
    },

    closeTierCascaderDropdown () {
      const cascader = this.$refs.tierCascader
      if (!cascader) return
      if (cascader.dropDownVisible) {
        cascader.toggleDropDownVisible(false)
      }
      const input = cascader.$refs && cascader.$refs.input
      if (input && typeof input.blur === 'function') {
        input.blur()
      }
    },

    handleTierCascaderVisibleChange (visible) {
      if (visible && this._suppressTierCascaderOpen) {
        this.$nextTick(() => this.closeTierCascaderDropdown())
        return
      }
      if (visible) {
        this.$nextTick(() => {
          const cascader = this.$refs.tierCascader
          if (cascader && typeof cascader.updatePopper === 'function') {
            cascader.updatePopper()
          }
        })
      }
    },

    extractCheckedTreeTenantIds () {
      const ids = new Set()
      const panel = this.$refs.tierCascader && this.$refs.tierCascader.panel
      if (panel && typeof panel.getCheckedNodes === 'function') {
        panel.getCheckedNodes(true).forEach(node => {
          const data = node.data || node
          if (data && data.tenantId) {
            ids.add(Number(data.tenantId))
          }
        })
        return ids
      }

      const keys = Array.isArray(this.tierCheckedKeys) ? this.tierCheckedKeys : []
      keys.forEach(key => {
        const node = this.findTierNodeByKey(key)
        if (!node) return
        if (node.tenantId) {
          ids.add(Number(node.tenantId))
        } else {
          this.collectTenantIdsFromSubtree(node).forEach(id => ids.add(id))
        }
      })
      return ids
    },

    handleTierCascadeChange (value) {
      if (this._programmaticTierSync) return

      const keys = Array.isArray(value)
        ? value
        : (Array.isArray(this.tierCheckedKeys) ? this.tierCheckedKeys : [])
      if (keys.length === 0) {
        this.applyTierClearLinkage()
        return
      }

      const treeTenantIds = this.extractCheckedTreeTenantIds()

      const flatOnlyIds = this.selectedTenantIds
        .filter(id => id !== 'all')
        .map(id => Number(id))
        .filter(id => Number.isFinite(id) && id > 0 && !this.treeTenantIdSet.has(id))

      this.selectedTenantIds = [...new Set([...flatOnlyIds, ...treeTenantIds])]
      if (this.treeTenantIdSet.size > 0 && treeTenantIds.size > 0) {
        this.tierListFilterActive = true
      }
      this.updateSelectAllState()
      this.clearQueryPreview()
    },

    /** 清空租户层级时：取消层级过滤，并移除来自层级树的勾选（保留未绑定层级的手动勾选） */
    applyTierClearLinkage () {
      this.tierListFilterActive = false
      const remain = this.actualSelectedIds.filter(id => !this.treeTenantIdSet.has(id))
      this.selectedTenantIds = remain
      this.updateSelectAllState()
      this.clearQueryPreview()
    },

    handleFlatTenantChange () {
      if (this._programmaticTierSync) return
      this.syncCascadeFromFlatSelection()
      this.updateSelectAllState()
      this.clearQueryPreview()
    },

    syncCascadeFromFlatSelection () {
      const treeTenantIds = new Set()
      this.actualSelectedIds.forEach(id => {
        if (this.treeTenantIdSet.has(id)) treeTenantIds.add(id)
      })

      const keys = []
      const walk = (nodes) => {
        (nodes || []).forEach(node => {
          if (node.tenantId && treeTenantIds.has(Number(node.tenantId))) {
            keys.push(node._treeKey)
          }
          if (node.tenantTierDtoList && node.tenantTierDtoList.length) {
            walk(node.tenantTierDtoList)
          }
        })
      }
      walk(this.processedTierTreeData)

      this._programmaticTierSync = true
      this.tierCheckedKeys = keys
      this.$nextTick(() => {
        const panel = this.$refs.tierCascader && this.$refs.tierCascader.panel
        if (panel && typeof panel.calculateMultiCheckedValue === 'function') {
          panel.calculateMultiCheckedValue()
        }
        this._programmaticTierSync = false
      })
    },

    updateSelectAllState () {
      const scopeList = this.tierListFilterActive ? this.filteredTenants : this.tenantList
      const scopeIds = scopeList.map(t => Number(t.id))
      const selected = this.actualSelectedIds
      const allSelected = scopeIds.length > 0 && scopeIds.every(id => selected.includes(id))
      const hasAllLabel = this.selectedTenantIds.includes('all')
      if (allSelected && !hasAllLabel) {
        this.selectedTenantIds = ['all', ...selected]
      } else if (!allSelected && hasAllLabel) {
        this.selectedTenantIds = selected
      }
    },

    clearQueryPreview () {
      this.queryResult = []
      this.selectedQueryItems = []
    },

    handleSelectAll (checked) {
      const scopeList = this.filteredTenants
      if (checked) {
        const scopeIds = scopeList.map(t => t.id)
        const merged = new Set([...this.actualSelectedIds, ...scopeIds])
        this.selectedTenantIds = ['all', ...merged]
        this.syncCascadeFromFlatSelection()
      } else {
        if (this.tierListFilterActive) {
          const scopeIdSet = new Set(scopeList.map(t => Number(t.id)))
          const remain = this.actualSelectedIds.filter(id => !scopeIdSet.has(id))
          this.selectedTenantIds = remain
          this.syncCascadeFromFlatSelection()
        } else {
          this.selectedTenantIds = []
          this.tierCheckedKeys = []
        }
      }
      this.updateSelectAllState()
      this.clearQueryPreview()
    },

    handleFloatTypeChange () {
      // 切换浮动类型时，清空选中项
      this.selectedQueryItems = []
      // 清空查询结果
      this.queryResult = []
    },

    handleQuerySelectionChange (selection) {
      // 部分浮动时，记录选中的数据项
      this.selectedQueryItems = selection
    },

    async handleCreateFloat () {
      if (!this.canView) return
      if (!this.canCreateFloat) {
        this.$message.warning(this.$t('floatPriceBillPage.msgNoCreatePerm'))
        return
      }
      this.drawerVisible = true
      this.resetForm()
      this._suppressTierCascaderOpen = true
      await Promise.all([this.fetchTenantList(), this.loadTierTreeData()])
      this.$nextTick(() => {
        this.closeTierCascaderDropdown()
        this._suppressTierCascaderOpen = false
      })
    },

    resetForm () {
      this.formData = {
        startDate: '',
        endDate: '',
        floatType: '',
        powerPeakPrice: 0, // 尖时电价
        powerTopPrice: 0, // 峰时电价
        powerFlatPrice: 0, // 平时电价
        powerValleyPrice: 0, // 谷时电价
        settleDate: '',
        remark: ''
      }
      this.tenantFilter = ''
      this.selectedTenantIds = []
      this.tierCheckedKeys = []
      this.tierListFilterActive = false
      this.tierTreeData = []
      this.tenantList = []
      this.queryResult = []
      this.selectedQueryItems = []
      // 重置价格数组
      this.queryData.price = [0, 0, 0, 0]
      this.$nextTick(() => this.closeTierCascaderDropdown())
    },

    async handleQuery () {
      if (!this.canQuery) return

      this.queryLoading = true
      try {
        const response = await floatPreQuery({
          tenantIdList: this.actualSelectedIds,
          startDate: this.formData.startDate,
          endDate: this.formData.endDate,
          floatType: this.formData.floatType
        })
        if (response.code === 200) {
          this.queryResult = response.data || []
          // 初始化计算字段
          this.queryResult.forEach(item => {
            this.$set(item, 'afterBalance', '0.00')
            this.$set(item, 'floatBalance', '0.00')
          })
          // 如果已有电价，立即计算
          if (this.formData.powerPeakPrice || this.formData.powerTopPrice ||
            this.formData.powerFlatPrice || this.formData.powerValleyPrice) {
            this.calculateBalances()
          }
          this.$message.success(this.$t('floatPriceBillPage.msgQuerySuccess'))
        } else {
          this.$message.error(response.msg || this.$t('floatPriceBillPage.msgQueryFail'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('floatPriceBillPage.msgQueryFail'))
      } finally {
        this.queryLoading = false
      }
    },

    // 修正：按照提供的计算逻辑
    calculateBalances () {
      // 更新价格数组 [尖价, 峰价, 平价, 谷价]
      this.queryData.price[0] = this.formData.powerPeakPrice || 0 // 尖价
      this.queryData.price[1] = this.formData.powerTopPrice || 0 // 峰价
      this.queryData.price[2] = this.formData.powerFlatPrice || 0 // 平价
      this.queryData.price[3] = this.formData.powerValleyPrice || 0 // 谷价

      // 按照参考的计算逻辑
      this.queryResult.forEach(item => {
        let electric = 0
        // 尖价 * 尖电量
        electric += this.queryData.price[0] * 1 * (item.useElecPeak || 0)
        // 峰价 * 峰电量
        electric += this.queryData.price[1] * 1 * (item.useElecTop || 0)
        // 平价 * 平电量
        electric += this.queryData.price[2] * 1 * (item.useElecFlat || 0)
        // 谷价 * 谷电量
        electric += this.queryData.price[3] * 1 * (item.useElecValley || 0)

        // 设置目标金额
        this.$set(item, 'afterBalance', electric.toFixed(2))

        // 浮动金额 = 已结金额 - 目标金额
        const floatBalance = (
          (item.alreadyBalance || 0) - parseFloat(electric.toFixed(2))
        ).toFixed(2)
        this.$set(item, 'floatBalance', floatBalance)
      })
    },

    async handleSubmit () {
      if (!this.canView) return
      if (!this.canCreateFloat) {
        this.$message.warning(this.$t('floatPriceBillPage.msgNoCreatePerm'))
        return
      }
      if (!this.priceHasAnyPositive) {
        this.$message.warning(this.$t('floatPriceBillPage.msgSubmitPriceInvalid'))
        return
      }
      if (!this.canSubmit) return

      this.submitting = true
      try {
        // 根据浮动类型决定提交的数据
        let submitList = []

        if (this.formData.floatType === 'GLOBAL') {
          // 整体浮动：提交所有查询结果
          submitList = this.queryResult.map(item => ({
            tenantId: item.tenantId,
            tenantName: item.tenantName,
            useElecPeak: item.useElecPeak || 0, // 尖电量
            useElecTop: item.useElecTop || 0, // 峰电量
            useElecFlat: item.useElecFlat || 0,
            useElecValley: item.useElecValley || 0,
            alreadyBalance: item.alreadyBalance || 0,
            afterBalance: item.afterBalance || '0.00',
            floatBalance: item.floatBalance || '0.00'
          }))
        } else {
          // 部分浮动：只提交选中的项，包含额外字段
          submitList = this.selectedQueryItems.map(item => ({
            tenantId: item.tenantId,
            tenantName: item.tenantName,
            bindType: item.bindType,
            partId: item.partId,
            partName: item.partName,
            useElecPeak: item.useElecPeak || 0, // 尖电量
            useElecTop: item.useElecTop || 0, // 峰电量
            useElecFlat: item.useElecFlat || 0,
            useElecValley: item.useElecValley || 0,
            alreadyBalance: item.alreadyBalance || 0,
            afterBalance: item.afterBalance || '0.00',
            floatBalance: item.floatBalance || '0.00'
          }))
        }

        const response = await floatDoFloat({
          endDate: this.formData.endDate,
          startDate: this.formData.startDate,
          floatType: this.formData.floatType,
          // 修正：按照正确的字段映射提交
          powerPeakPrice: this.formData.powerPeakPrice.toString(), // 尖时电价
          powerTopPrice: this.formData.powerTopPrice.toString(), // 峰时电价
          powerFlatPrice: this.formData.powerFlatPrice.toString(), // 平时电价
          powerValleyPrice: this.formData.powerValleyPrice.toString(), // 谷时电价
          settleDate: this.formData.settleDate,
          remark: this.formData.remark,
          managerId: this.currentManagerId,
          floatList: submitList
        })

        if (response.code === 200) {
          this.$message.success(this.$t('floatPriceBillPage.msgCreateSuccess'))
          this.drawerVisible = false
          this.fetchTableData()
        } else {
          this.$message.error(response.msg || this.$t('floatPriceBillPage.msgCreateFail'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('floatPriceBillPage.msgCreateFail'))
      } finally {
        this.submitting = false
      }
    },

    async handleDetail (row) {
      if (!this.canView) {
        this.$message.warning(this.$t('floatPriceBillPage.msgNoViewPerm'))
        return
      }
      this.detailDrawerVisible = true
      this.detailLoading = true
      try {
        const response = await queryFloatDetail(row.rid)
        if (response.code === 200) {
          this.detailData = response.data || {}
        } else {
          this.$message.error(response.msg || this.$t('floatPriceBillPage.msgDetailFail'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('floatPriceBillPage.msgDetailFail'))
      } finally {
        this.detailLoading = false
      }
    },

    // 获取绑定类型名称
    getBindTypeName (bindType) {
      const key = String(bindType)
      const typeMap = {
        1: this.$t('floatPriceBillPage.bindTypeDedicated'),
        2: this.$t('floatPriceBillPage.bindTypeShare'),
        3: this.$t('floatPriceBillPage.bindTypeFormula')
      }
      return typeMap[key] || this.$t('floatPriceBillPage.bindTypeUnknown')
    },

    // 获取绑定类型标签颜色
    getBindTypeTagType (bindType) {
      const typeMap = {
        1: 'primary',
        2: 'success',
        3: 'warning'
      }
      return typeMap[bindType] || 'info'
    },

    // 获取浮动金额的样式类
    getFloatBalanceClass (floatBalance) {
      const value = parseFloat(floatBalance) || 0
      if (value > 0) return 'text-success'
      if (value < 0) return 'text-danger'
      return ''
    },

    handleSizeChange (val) {
      if (!this.canView) return
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleCurrentChange (val) {
      if (!this.canView) return
      this.pageData.current = val
      this.fetchTableData()
    },

    handleExport () {
      if (!this.canView) return
      if (this.tableData.length === 0) {
        this.$message.warning(this.$t('floatPriceBillPage.msgNoDataExport'))
        return
      }

      try {
        // 确定要导出的数据：优先导出选中数据，无选中则导出当前页
        const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData

        // 构建导出的表头和数据
        const headers = [
          this.$t('floatPriceBillPage.expColRid'),
          this.$t('floatPriceBillPage.expColRange'),
          this.$t('floatPriceBillPage.expColFloatType'),
          this.$t('floatPriceBillPage.expColBillDate'),
          this.$t('floatPriceBillPage.expColTarget'),
          this.$t('floatPriceBillPage.expColFloatAmt'),
          this.$t('floatPriceBillPage.expColCreator'),
          this.$t('floatPriceBillPage.expColCreateTime')
        ]

        const data = exportData.map(row => {
          return [
            row.rid || '',
            this.formatFloatRange(row),
            this.getFloatTypeLabel(row.floatType),
            row.settleDate || row.billDate || '',
            this.formatTargetElectricityPrice(row),
            row.totalFloatBalance != null ? String(row.totalFloatBalance) : '0',
            row.userPhone || '',
            row.createTime || ''
          ]
        })

        // 创建工作表数据
        const wsData = [headers, ...data]

        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // 设置列宽
        const colWidths = [
          { wch: 14 }, { wch: 28 }, { wch: 12 }, { wch: 12 },
          { wch: 28 }, { wch: 14 }, { wch: 15 }, { wch: 20 }
        ]
        ws['!cols'] = colWidths

        // 设置表头样式
        const headerRange = XLSX.utils.decode_range(ws['!ref'])
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
          if (!ws[cellAddress]) continue

          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: '303133' } },
            fill: { fgColor: { rgb: 'F5F7FA' } },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }

        // 创建工作簿
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, this.$t('floatPriceBillPage.exportSheetName'))

        // 生成文件名
        const fileName = this.generateFileName()

        // 导出文件（使用原生方法）
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'

        // 触发下载
        document.body.appendChild(link)
        link.click()

        // 清理
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        // 显示导出信息
        const exportCount = exportData.length
        const isSelectedExport = this.selectedData.length > 0
        this.$message.success(
          isSelectedExport
            ? this.$t('floatPriceBillPage.msgExportOkSelected', { count: exportCount })
            : this.$t('floatPriceBillPage.msgExportOk', { count: exportCount })
        )
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('floatPriceBillPage.msgExportFail'))
      }
    },

    // 生成文件名
    generateFileName () {
      const prefix = this.$t('floatPriceBillPage.filePrefix')
      const now = new Date()
      const timeStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')

      // 如果选择了时间范围，包含时间信息
      if (this.queryData.startDate && this.queryData.endDate) {
        const startDate = this.queryData.startDate.replace(/-/g, '')
        const endDate = this.queryData.endDate.replace(/-/g, '')
        return `${prefix}_${startDate}-${endDate}_${timeStr}.xlsx`
      }

      return `${prefix}_${timeStr}.xlsx`
    },

    // 选择变化
    handleTableSelectionChange (selection) {
      this.selectedData = selection
    }
  }
}
</script>

<style lang="scss" scoped>
/* 列表区：与用能账单 V2 样式报告对齐 */
.table-page-container.floating-price-page {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.float-no-perm {
  padding: 48px 16px;
  background: #f0f2f5;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-box {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.search-form {
  margin: 0;

  .search-main-grid {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .field-item {
    flex: 0 0 auto;
    width: 320px;
    max-width: 100%;
    min-width: 0;

    ::v-deep .el-date-editor {
      width: 100%;
      display: block;
    }

    ::v-deep .el-range-editor.el-input__inner {
      height: 32px;
      min-height: 32px;
      line-height: normal;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      flex-wrap: nowrap;
      border-radius: 6px;
      border-color: #e4e7ed;
      font-size: 13px;
      padding: 0 10px;
      vertical-align: middle;
    }

    ::v-deep .el-range-editor .el-range-input {
      height: 30px;
      line-height: 30px;
      font-size: 13px;
      background: transparent;
    }

    ::v-deep .el-range-editor .el-range-separator {
      line-height: 1;
      height: auto;
      width: auto;
      padding: 0 4px;
      margin: 0;
      flex-shrink: 0;
      align-self: center;
      color: #606266;
    }

    ::v-deep .el-range-editor .el-range__close-icon,
    ::v-deep .el-range-editor .el-range__icon {
      line-height: 32px;
      flex-shrink: 0;
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
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

.content-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  flex: 1;
  padding: 16px 16px 10px;
}

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
  }
}

.list-view {
  padding: 0;

  .table-toolbar {
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

.balance-value {
  font-weight: 600;

  &.positive {
    color: #52c41a;
  }

  &.negative {
    color: #f56c6c;
  }
}

.op-btn {
  padding: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1;

  &.primary-btn {
    color: #1677ff;

    &:hover {
      color: #4096ff;
    }

    &:active {
      color: #0958d9;
    }
  }
}

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

      .el-pagination__total {
        font-size: 12px;
      }

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

      .btn-prev,
      .btn-next {
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

// 抽屉样式
::v-deep .float-drawer,
::v-deep .detail-drawer {
  .el-drawer__header {
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 0;

    > :first-child {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .el-drawer__body {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.drawer-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// 租户面板样式
.tenant-panel {
  width: 360px;
  min-width: 360px;
  flex-shrink: 0;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;

  .panel-header {
    height: 56px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    background: linear-gradient(to bottom, #f8f9fa, #ffffff);
    border-bottom: 1px solid #ebeef5;

    i {
      font-size: 18px;
      margin-right: 8px;
      color: #409eff;
    }

    span {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .panel-search {
    padding: 16px;
    border-bottom: 1px solid #ebeef5;
    background: #fafbfc;
  }

  .panel-list {
    flex: 1;
    overflow: hidden;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .panel-section {
      display: flex;
      flex-direction: column;
      min-height: 0;

      &:first-child {
        overflow: visible;
        position: relative;
        z-index: 5;
      }

      &.panel-section-list {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
    }

    .tenant-list-group {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .section-label {
      font-size: 12px;
      font-weight: 600;
      color: #909399;
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    .panel-divider {
      margin: 10px 0;
      flex-shrink: 0;
    }

    .tier-cascader-wrap {
      flex-shrink: 0;
      position: relative;

      .tier-cascader {
        width: 100%;
      }

      ::v-deep .el-cascader {
        width: 100%;
        line-height: normal;
      }

      ::v-deep .el-cascader .el-input {
        display: block;
      }

      ::v-deep .el-cascader .el-input__inner {
        height: 32px;
        line-height: 32px;
        padding: 0 42px 0 8px;
        border-radius: 6px;
        background-color: #fff;
        box-sizing: border-box;
      }

      &.has-value ::v-deep .el-cascader .el-input__inner {
        padding-right: 54px;
      }

      ::v-deep .el-cascader .el-input__suffix {
        right: 8px;
      }

      ::v-deep .el-cascader .el-input__suffix-inner {
        display: inline-flex;
        align-items: center;
        height: 32px;
      }

      ::v-deep .el-cascader .el-input__icon {
        line-height: 32px;
        height: 32px;
        width: 16px;
      }

      ::v-deep .el-cascader .el-icon-circle-close {
        cursor: pointer;
        color: #c0c4cc;

        &:hover {
          color: #909399;
        }
      }

      ::v-deep .el-cascader .el-cascader__tags {
        position: absolute;
        left: 0;
        right: 42px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        max-height: 28px;
        overflow: hidden;
        margin: 0;
        padding: 0 4px;
        box-sizing: border-box;
        line-height: normal;
      }

      &.has-value ::v-deep .el-cascader .el-cascader__tags {
        right: 54px;
      }

      ::v-deep .el-cascader .el-tag {
        display: inline-flex;
        align-items: center;
        height: 24px;
        line-height: 22px;
        margin: 2px 0 2px 6px;
        max-width: calc(100% - 36px);
      }

      ::v-deep .el-cascader .el-tag > span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .select-all-item {
      padding: 8px;
      background: #f0f7ff;
      border-radius: 4px;
      margin-bottom: 8px;
      flex-shrink: 0;

      .tenant-name {
        font-weight: 600;
        color: #409eff;
      }
    }

    .tenant-list-wrapper {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: #f5f7fa;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: #c0c4cc;
        border-radius: 3px;

        &:hover {
          background: #909399;
        }
      }
    }

    .tenant-list-empty {
      padding: 16px 8px;
      text-align: center;
      font-size: 13px;
      color: #909399;
    }

    .tenant-item {
      padding: 8px 10px;
      border-radius: 4px;
      transition: background 0.2s;

      &:hover {
        background: #f5f7fa;
      }

      .tenant-name {
        color: #606266;
      }
    }
  }
}

// 表单面板样式
.form-panel {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f7fa;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;

    &:hover {
      background: #c0c4cc;
    }
  }
}

// 表单卡片样式
.form-card {
  background: #ffffff;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  // 大卡片 - 用电数据统计
  &.large-card {
    .card-body {
      padding: 24px;
    }
  }

  // 小卡片 - 电价设置
  &.small-card {
    .card-body {
      padding: 16px 20px;
    }
  }

  .card-header {
    padding: 16px 20px;
    background: linear-gradient(to right, #fafbfc, #ffffff);
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .card-body {
    padding: 24px;
  }
}

// 表单项样式
.form-item {
  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #606266;
    font-weight: 500;

    &.required::before {
      content: "*";
      color: #f56c6c;
      margin-right: 4px;
    }
  }
}

// 日期区间样式
.date-range-input {
  display: flex;
  align-items: center;
  width: 100%;

  .separator {
    padding: 0 8px;
    color: #c0c4cc;
  }
}

// 查询按钮区域
.query-button-wrapper {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;

  .query-tip {
    margin-left: 8px;
  }
}

// 结果表格样式
.result-table-wrapper {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;

  .data-value {
    color: #409eff;
    font-weight: 500;
  }

  .balance-text {
    color: #606266;
    font-weight: 500;
  }

  .target-balance {
    color: #67c23a;
    font-weight: 600;
  }
}

// 简约电价设置网格
.price-grid-simple {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  .price-item {
    display: flex;
    flex-direction: column;

    label {
      margin-bottom: 8px;
      font-size: 14px;
      color: #606266;
      font-weight: 500;

      &.required::before {
        content: "*";
        color: #f56c6c;
        margin-right: 4px;
      }
    }

    ::v-deep .el-input-number {
      width: 100%;

      .el-input__inner {
        text-align: left;
      }
    }

    .price-unit {
      margin-top: 6px;
      font-size: 12px;
      color: #909399;
    }
  }
}

// 其他信息区域
.other-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e4e7ed;
}

// 详情内容样式
.detail-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f7fa;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;

    &:hover {
      background: #c0c4cc;
    }
  }
}

// 详情卡片
.detail-card {
  background: #ffffff;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  overflow: hidden;

  .detail-header {
    padding: 16px 20px;
    background: linear-gradient(to right, #fafbfc, #ffffff);
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .detail-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .detail-body {
    padding: 20px;
  }
}

// 详情项
.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  label {
    color: #909399;
    font-size: 14px;
    margin-right: 8px;
    flex-shrink: 0;
  }

  span {
    color: #303133;
    font-size: 14px;
  }
}

// 电价信息网格
.price-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  .price-info-item {
    text-align: center;
    padding: 16px;
    background: #fafbfc;
    border-radius: 6px;

    label {
      display: block;
      color: #909399;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .price-value {
      display: block;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }
  }
}

// 文本颜色
.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

// 抽屉底部
.drawer-footer {
  position: sticky;
  bottom: 0;
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  background: #ffffff;
  text-align: right;
  box-shadow: 0 -2px 12px 0 rgba(0, 0, 0, 0.05);
  z-index: 10;

  .el-button {
    margin-left: 12px;
    min-width: 100px;
  }
}

// 响应式布局
@media screen and (max-width: 1600px) {
  .price-grid-simple {
    grid-template-columns: repeat(2, 1fr);
  }

  .price-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 1200px) {
  .tenant-panel {
    width: 320px;
    min-width: 320px;
  }

  .price-grid-simple {
    grid-template-columns: 1fr;
  }

  .price-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style lang="scss">
/* 只改面板内部样式，禁止覆盖 popper 的定位属性（position/top/left/display/width） */
.float-tier-cascader-dropdown {
  .el-cascader-panel {
    max-height: 320px;
  }

  .el-cascader-menu {
    min-width: 200px;
  }

  .el-cascader-menu__wrap {
    max-height: 320px;
  }

  .el-cascader-node {
    height: 36px;
    line-height: 36px;
  }

  .el-cascader-node__label {
    font-size: 13px;
  }
}

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
      color: #1677ff !important;
      background: #f0f7ff !important;
      box-shadow: 0 2px 6px rgba(22, 119, 255, 0.15) !important;
      transform: translateY(-1px) !important;
      border: none !important;
    }

    &:active {
      transform: translateY(0) !important;
      box-shadow: 0 1px 3px rgba(22, 119, 255, 0.1) !important;
    }

    &:last-child {
      margin-bottom: 0 !important;
    }
  }
}
</style>
