<template>
  <div class="table-page-container">
    <div class="search-box">
      <el-form
        :model="queryData"
        ref="searchForm"
        class="search-form"
        size="small"
        @submit.native.prevent
        @keyup.enter.native="handleSearch"
      >
        <div class="search-main-grid">
          <div class="field-item">
            <el-select
              v-model="queryData.id"
              filterable
              :placeholder="$t('tenantListPage.phTenantIdName')"
              clearable
              :loading="tenantLoading"
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="tenant in tenantList"
                :key="tenant.tenantId"
                :label="formatTenantOptionLabel(tenant)"
                :value="tenant.tenantId"
              />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.tenantStatus"
              :placeholder="$t('tenantListPage.phTenantStatus')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('tenantListPage.optStatusNormal')" :value="0" />
              <el-option :label="$t('tenantListPage.optStatusCancelled')" :value="1" />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.tenantType"
              :placeholder="$t('tenantListPage.phTenantType')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('tenantListPage.tenantType0')" :value="0" />
              <el-option :label="$t('tenantListPage.tenantType1')" :value="1" />
              <el-option :label="$t('tenantListPage.tenantType2')" :value="2" />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.labelIds"
              multiple
              filterable
              clearable
              collapse-tags
              :placeholder="$t('tenantListPage.phLabels')"
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="tag in labelList"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              />
            </el-select>
          </div>
          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('tenantListPage.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">{{ $t('tenantListPage.btnReset') }}</el-button>
            <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">{{ $t('tenantListPage.btnExport') }}</el-button>
          </div>
        </div>
      </el-form>
    </div>

    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            {{ $t('tenantListPage.sectionTitle') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-button
            v-if="canAdd"
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="handleAdd"
          >
            {{ $t('tenantListPage.btnAdd') }}
          </el-button>
          <el-dropdown trigger="click" class="batch-settings-dropdown" @command="handleBatchCommand">
            <el-button size="small" class="batch-settings-trigger">
              {{ $t('tenantListPage.batchSettings') }}<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="urge" disabled>{{ $t('tenantListPage.batchUrge') }}</el-dropdown-item>
              <el-dropdown-item command="payMode" disabled>{{ $t('tenantListPage.batchPayMode') }}</el-dropdown-item>
              <el-dropdown-item command="warnQuota" disabled>{{ $t('tenantListPage.batchWarnQuota') }}</el-dropdown-item>
              <el-dropdown-item command="billingPlan" disabled>{{ $t('tenantListPage.batchBillingPlan') }}</el-dropdown-item>
              <el-dropdown-item command="downloadAll">{{ $t('tenantListPage.batchDownloadCodes') }}</el-dropdown-item>
              <el-dropdown-item v-if="canDeduct" command="batchManualDebit">{{ $t('tenantListPage.batchManualDebit') }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-select
            v-if="viewType === 'card'"
            v-model="queryData.sortKey"
            size="small"
            style="width: 170px"
            @change="handleSearch"
          >
            <el-option :label="$t('tenantListPage.sortCreateTimeDesc')" value="createTimeDesc" />
            <el-option :label="$t('tenantListPage.sortCreateTimeAsc')" value="createTimeAsc" />
            <el-option :label="$t('tenantListPage.sortMeterDesc')" value="meterBalanceDesc" />
            <el-option :label="$t('tenantListPage.sortMeterAsc')" value="meterBalanceAsc" />
            <el-option :label="$t('tenantListPage.sortWaterDesc')" value="waterBalanceDesc" />
            <el-option :label="$t('tenantListPage.sortWaterAsc')" value="waterBalanceAsc" />
            <el-option :label="$t('tenantListPage.sortNameAz')" value="nameAsc" />
            <el-option :label="$t('tenantListPage.sortNameZa')" value="nameDesc" />
          </el-select>
          <el-radio-group v-model="viewType" size="small" class="view-switcher-compact">
            <el-radio-button label="table">{{ $t('tenantListPage.viewTable') }}</el-radio-button>
            <el-radio-button label="card">{{ $t('tenantListPage.viewCard') }}</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="list-view">
        <div v-show="viewType === 'table'" class="table-view-wrap">
          <el-table
            ref="multipleTable"
            :data="tableData"
            v-loading="loading"
            border
            stripe
            class="tenant-table light-border-table"
            @selection-change="handleSelectionChange"
            @sort-change="handleSortChange"
            :default-sort="{ prop: 'createTime', order: 'descending' }"
            style="width: 100%"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <!-- 勾选列 -->
            <el-table-column type="selection" align="center" />

            <!-- 租户ID -->
            <el-table-column prop="id" :label="$t('tenantListPage.colTenantId')" width="80" align="left">
              <template slot-scope="scope">
                <el-tooltip :content="$t('tenantListPage.tipClickCopy')" placement="top" :open-delay="300">
                  <span class="serial-copy" @click="handleCopySerial(scope.row.id)">
                    {{ scope.row.id || "-" }}
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>

            <!-- 租户名称 -->
            <el-table-column
              prop="name"
              :label="$t('tenantListPage.colTenantName')"
              min-width="150"
              show-overflow-tooltip
              sortable="custom"
              :sort-orders="['ascending', 'descending']"
            >
              <template slot-scope="scope">
                <div class="tenant-name-cell">
                  <img
                    v-if="scope.row.logoUrl"
                    :src="scope.row.logoUrl"
                    class="tenant-logo-small"
                    @error="handleImageError($event)"
                  />
                  <div v-else class="logo-placeholder-small">
                    {{ tenantAvatarInitial(scope.row.name) }}
                  </div>
                  <el-link
                    v-if="canView"
                    type="primary"
                    @click="handleDetail(scope.row)"
                  >
                    {{ $displayBizHybrid(scope.row.name) }}
                  </el-link>
                  <span v-else>{{ $displayBizHybrid(scope.row.name) }}</span>
                </div>
              </template>
            </el-table-column>

            <!-- 租户二维码 -->
            <el-table-column :label="$t('tenantListPage.colQrcode')" width="100" align="center">
              <template slot-scope="scope">
                <el-button
                  v-if="canView"
                  type="text"
                  icon="el-icon-s-grid"
                  @click="handleQrcode(scope.row)"
                />
                <span v-else>-</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t('tenantListPage.colLabels')" min-width="120" align="left">
              <template slot-scope="scope">
                <div
                  v-if="scope.row.labelList && scope.row.labelList.length"
                  class="tenant-label-cell"
                >
                  <el-tag
                    v-for="tag in scope.row.labelList"
                    :key="tag.id || tag.name"
                    size="mini"
                    effect="plain"
                    class="tenant-label-tag"
                  >
                    {{ tag.name }}
                  </el-tag>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>

            <!-- 专用设备 -->
            <el-table-column prop="deviceCount" :label="$t('tenantListPage.colDedicatedMeters')" align="center">
              <template slot-scope="scope">
                {{ scope.row.deviceCount || 0 }}
              </template>
            </el-table-column>

            <el-table-column
              prop="meterBalance"
              column-key="meterBalance"
              :label="$t('tenantListPage.colMeterBalanceYuan')"
              align="right"
              sortable="custom"
              :sort-orders="['descending', 'ascending']"
            >
              <template slot-scope="scope">
                <span>{{
                  formatBalance(scope.row.meterAccountDto?.balance)
                }}</span>
              </template>
            </el-table-column>

            <el-table-column
              prop="waterBalance"
              column-key="waterBalance"
              :label="$t('tenantListPage.colWaterBalanceYuan')"
              align="right"
              sortable="custom"
              :sort-orders="['descending', 'ascending']"
            >
              <template slot-scope="scope">
                <span>{{
                  formatBalance(scope.row.waterAccountDto?.balance)
                }}</span>
              </template>
            </el-table-column>

            <!-- 租户状态 -->
            <el-table-column :label="$t('tenantListPage.colTenantStatus')" width="100" align="center">
              <template slot-scope="scope">
                <el-tag
                  :type="scope.row.tenantStatus === 0 ? 'success' : 'info'"
                  size="small"
                >
                  {{ scope.row.tenantStatus === 0 ? $t('tenantListPage.optStatusNormal') : $t('tenantListPage.optStatusCancelled') }}
                </el-tag>
              </template>
            </el-table-column>

            <!-- 创建时间 -->
            <el-table-column
              prop="createTime"
              min-width="100"
              :label="$t('tenantListPage.colCreateTime')"
              align="left"
              sortable="custom"
              :sort-orders="['descending', 'ascending']"
            >
              <template slot-scope="scope">
                {{ formatDateTime(scope.row.createTime) }}
              </template>
            </el-table-column>

            <!-- 操作列 -->
            <el-table-column
              :label="$t('tenantListPage.colActions')"
              align="center"
              :width="operationColumnWidth"
              fixed="right"
            >
              <template slot-scope="scope">
                <div class="action-buttons">
                  <el-button
                    v-if="onlyViewAction"
                    type="text"
                    size="small"
                    @click="handleDetail(scope.row)"
                  >
                    {{ $t('tenantListPage.btnDetail') }}
                  </el-button>
                  <el-button
                    v-if="!onlyViewAction && canDeduct"
                    type="text"
                    size="small"
                    @click="handleDeduct(scope.row)"
                  >
                    {{ $t('tenantListPage.btnManualDeduct') }}
                  </el-button>
                  <el-button
                    v-if="!onlyViewAction && canUrge"
                    type="text"
                    size="small"
                    @click="handleUrge(scope.row)"
                  >
                    {{ $t('tenantListPage.btnUrge') }}
                  </el-button>
                  <el-dropdown
                    v-if="!onlyViewAction && (canEdit || canView)"
                    trigger="click"
                    @command="handleRowCommand($event, scope.row)"
                  >
                    <el-button type="text" size="small">
                      {{ $t('tenantListPage.btnMore') }}<i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item v-if="canEdit" command="edit" icon="el-icon-edit">
                        {{ $t('tenantListPage.btnEdit') }}
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-if="canView"
                        command="detail"
                        icon="el-icon-document"
                      >
                        {{ $t('tenantListPage.btnDetail') }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                  <span v-if="!onlyViewAction && !canDeduct && !canUrge && !canEdit && !canView">-</span>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!loading && tableData.length === 0"
            :description="$t('tenantListPage.emptyNoData')"
            class="list-empty"
          />
        </div>

        <div v-show="viewType === 'card'" class="card-view-container">
          <div v-loading="loading" class="card-grid">
          <div
            v-for="item in tableData"
            :key="item.id"
            class="tenant-card-modern"
            :class="{ 'is-clickable': canView }"
            @click="handleCardClick(item)"
          >
            <!-- 卡片头部 - 添加二维码按钮 -->
            <div class="card-header-modern">
              <div class="tenant-avatar">
                <img
                  v-if="item.logoUrl"
                  :src="item.logoUrl"
                  alt=""
                  @error="handleImageError($event)"
                />
                <div v-else class="avatar-placeholder">
                  {{ tenantAvatarInitial(item.name) }}
                </div>
              </div>
              <div class="tenant-info">
                <h3 class="tenant-name" :title="$displayBizHybrid(item.name)">
                  <span class="tenant-name-text">{{ $displayBizHybrid(item.name) || "-" }}</span>
                  <span
                    v-if="item.labelList && item.labelList.length"
                    class="tenant-label-inline"
                  >
                    <el-tag
                      v-for="tag in item.labelList"
                      :key="tag.id || tag.name"
                      size="mini"
                      effect="plain"
                      class="tenant-label-tag"
                    >
                      {{ tag.name }}
                    </el-tag>
                  </span>
                </h3>
                <span class="tenant-code">ID: {{ item.id }}</span>
              </div>
              <!-- 新增：二维码按钮 -->
              <el-button
                v-if="canView"
                type="text"
                icon="el-icon-s-grid"
                class="qr-button"
                @click.stop="handleQrcode(item)"
              />
            </div>

            <!-- 信息展示 -->
            <div class="card-content">
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">{{ $t('tenantListPage.cardDedicatedMeters') }}</span>
                  <span class="info-value">{{ item.deviceCount || 0 }}{{ $t('tenantListPage.cardDeviceUnit') }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('tenantListPage.cardTenantBalance') }}</span>
                  <span
                    class="info-value"
                    :class="getBalanceClass(getTotalBalance(item))"
                  >
                    ¥{{ formatBalance(getTotalBalance(item)) }}
                  </span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">{{ $t('tenantListPage.cardMeterAccount') }}</span>
                  <span class="info-value">
                    ¥{{ formatBalance(item.meterAccountDto?.balance) }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('tenantListPage.cardWaterAccount') }}</span>
                  <span class="info-value">
                    ¥{{ formatBalance(item.waterAccountDto?.balance) }}
                  </span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">{{ $t('tenantListPage.cardTenantStatus') }}</span>
                  <el-tag
                    :type="item.tenantStatus === 0 ? 'success' : 'info'"
                    size="mini"
                    effect="dark"
                  >
                    {{ item.tenantStatus === 0 ? $t('tenantListPage.optStatusNormal') : $t('tenantListPage.optStatusCancelled') }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('tenantListPage.cardCreatedAt') }}</span>
                  <span class="info-value">{{
                    formatDate(item.createTime)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 - 4个按钮无icon -->
            <div class="card-actions">
              <el-button v-if="canView" size="mini" @click.stop="handleDetail(item)">
                {{ $t('tenantListPage.btnDetail') }}
              </el-button>
              <el-button v-if="canUrge" size="mini" @click.stop="handleUrge(item)">
                {{ $t('tenantListPage.btnUrge') }}
              </el-button>
              <el-button v-if="canRecharge" size="mini" @click.stop="handleRecharge(item)">
                {{ $t('tenantListPage.btnManualRecharge') }}
              </el-button>
              <el-button v-if="canDeduct" size="mini" @click.stop="handleDeduct(item)">
                {{ $t('tenantListPage.btnManualDeduct') }}
              </el-button>
              <span v-if="!canView && !canUrge && !canRecharge && !canDeduct">-</span>
            </div>
          </div>
        </div>

        <el-empty
          v-if="!loading && tableData.length === 0"
          :description="$t('tenantListPage.emptyNoData')"
          class="list-empty"
        />
      </div>

      <div class="pagination-container compact-pagination" v-if="pageData.total > 0">
        <el-pagination
          :current-page="pageData.current"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageData.size"
          :total="pageData.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      </div>
    </div>

    <!-- 新增/编辑租户弹窗 -->
    <AddTenantDialog
      :visible.sync="addDialogVisible"
      :tenant-data="editForm"
      :label-list="labelList"
      :manager-id="currentManagerId"
      @success="handleAddSuccess"
    />

    <!-- 手动充值弹窗 -->
    <RechargeDialog
      :visible.sync="rechargeVisible"
      :tenant-data="currentTenant"
      @success="handleRechargeSuccess"
    />

    <!-- 手动扣款弹窗 -->
    <DeductDialog
      :visible.sync="deductVisible"
      :tenant-data="currentTenant"
      @success="handleDeductSuccess"
    />

    <BatchManualDebitDialog
      :visible.sync="batchManualDebitVisible"
      :manager-id="queryData.managerId || currentManagerId"
      @success="handleBatchManualDebitSuccess"
    />

    <!-- 二维码查看弹窗 -->
    <QrcodeDialog :visible.sync="qrcodeVisible" :tenant-data="currentTenant" />
  </div>
</template>

<script>
import { tenantPageTenant, queryTenantDeviceCount } from '@/api/tenant'
import { getSimpleTenantList } from '@/api/useReport'
import { labelList } from '@/api/label'
import { balancePush } from '@/api/pay'
import { mapGetters } from 'vuex'
import QRCode from 'qrcodejs2'
import * as XLSX from 'xlsx'
import { avatarInitial } from '@/utils/localeDisplayText'

import AddTenantDialog from './components/AddTenantDialog.vue'
import RechargeDialog from './components/RechargeDialog.vue'
import DeductDialog from './components/DeductDialog.vue'
import BatchManualDebitDialog from './components/BatchManualDebitDialog.vue'
import QrcodeDialog from './components/QrcodeDialog.vue'

export default {
  name: 'TenantManagement',
  components: {
    AddTenantDialog,
    RechargeDialog,
    DeductDialog,
    BatchManualDebitDialog,
    QrcodeDialog
  },
  data () {
    // 大屏（工作台首页）跳转租户列表时默认按电费专户正序
    const fromDashboard = this.$route && this.$route.query && this.$route.query.fromDashboard === '1'
    const initialSortKey = fromDashboard ? 'meterBalanceAsc' : 'createTimeDesc'
    return {
      // 视图类型：默认卡片
      viewType: 'card',
      suppressSortChange: false,

      // 查询参数
      queryData: {
        id: '',
        tenantStatus: null,
        tenantType: null,
        managerId: '',
        labelIds: [],
        sortKey: initialSortKey
      },

      // 标签列表
      labelList: [],

      // 租户下拉列表
      tenantList: [],
      tenantLoading: false,

      // 表格数据
      tableData: [],
      loading: false,

      // 多选
      multipleSelection: [],

      // 分页数据
      pageData: {
        current: 1,
        size: 20,
        total: 0
      },

      // 弹窗状态
      addDialogVisible: false,
      rechargeVisible: false,
      deductVisible: false,
      batchManualDebitVisible: false,
      qrcodeVisible: false,

      // 当前操作的租户
      currentTenant: {},
      editForm: {}
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    ...mapGetters('treeSelection', ['selectedTenantIds', 'selectedIds']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    treeTenantIdList () {
      const tenantIds = Array.isArray(this.selectedTenantIds) ? this.selectedTenantIds : []
      const fallbackIds = Array.isArray(this.selectedIds) ? this.selectedIds : []
      const source = tenantIds.length > 0 ? tenantIds : fallbackIds
      return source
        .map(id => Number(id))
        .filter(id => Number.isFinite(id) && id > 0)
    },
    treeTenantIdKey () {
      return this.treeTenantIdList.join(',')
    },
    canAdd () {
      return this.hasKztPermission('660010')
    },
    canView () {
      return this.hasKztPermission('660011')
    },
    canDeduct () {
      return this.hasKztPermission('660012')
    },
    canUrge () {
      return this.hasKztPermission('660013')
    },
    canEdit () {
      return this.hasKztPermission('660014')
    },
    canRecharge () {
      return this.hasKztPermission('660016')
    },
    onlyViewAction () {
      return this.canView && !this.canDeduct && !this.canUrge && !this.canEdit
    },
    operationColumnWidth () {
      const w = this.$i18n.locale === 'en'
      if (this.onlyViewAction) return w ? 110 : 90
      return w ? 280 : 220
    }
  },

  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          this.fetchLabelList()
          this.fetchAllTenants()
          this.fetchTableData()
        }
      },
      immediate: true
    },
    viewType (val) {
      if (val === 'table') {
        this.$nextTick(() => this.syncTableSortToQuery())
      }
    },
    $route (to) {
      if (to.path !== '/metering/tenant/list') return
      if (!to.query || to.query.fromDashboard !== '1') return
      if (this.queryData.sortKey === 'meterBalanceAsc') {
        if (this.viewType === 'table') {
          this.$nextTick(() => this.syncTableSortToQuery())
        }
        return
      }
      this.queryData.sortKey = 'meterBalanceAsc'
      this.handleSearch()
      if (this.viewType === 'table') {
        this.$nextTick(() => this.syncTableSortToQuery())
      }
    },
    treeTenantIdKey () {
      this.pageData.current = 1
      this.fetchTableData()
    }
  },

  methods: {
    formatTenantOptionLabel (tenant) {
      const id = tenant.tenantId != null ? tenant.tenantId : ''
      const nameDisp = tenant.name ? this.$displayBizHybrid(String(tenant.name)) : ''
      return nameDisp ? `${id} - ${nameDisp}` : String(id)
    },
    tenantAvatarInitial (name) {
      const n = (name || '').trim()
      if (!n) return String(this.$t('tenantListPage.avatarCharFallback') || 'T').charAt(0)
      return avatarInitial(n, this.$i18n.locale)
    },
    qrcodeDownloadNamePart (tenant) {
      const raw = (tenant.name || '').trim()
      const disp = raw ? this.$displayBizHybrid(raw, 48) : String(this.$t('tenantListPage.unnamed'))
      return String(disp).replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_')
    },
    // 获取标签列表
    async fetchLabelList () {
      try {
        const response = await labelList({
          managerId: this.queryData.managerId,
          type: 1
        })
        if (response.code === 200) {
          this.labelList = response.data || []
        }
      } catch (error) {
        console.error('获取标签列表失败:', error)
      }
    },

    // 下拉数据源：getSimpleTenantList 接口 tenantStatus 为必填
    async fetchAllTenants () {
      this.tenantLoading = true
      try {
        const params = {
          managerId: this.currentManagerId,
          tenantStatus: 0
        }
        const response = await getSimpleTenantList(params)
        if (response.code === 200) {
          this.tenantList = response.data || []
        }
      } catch (error) {
        console.error('获取租户列表失败:', error)
      } finally {
        this.tenantLoading = false
      }
    },

    formatLabelIdsParam (labelIds) {
      if (!Array.isArray(labelIds) || labelIds.length === 0) return ''
      return labelIds.join(',') + ','
    },

    buildOrders () {
      if (this.queryData.sortKey === 'meterBalanceDesc') return [{ asc: false, column: 'meterBalance' }]
      if (this.queryData.sortKey === 'meterBalanceAsc') return [{ asc: true, column: 'meterBalance' }]
      if (this.queryData.sortKey === 'waterBalanceDesc') return [{ asc: false, column: 'waterBalance' }]
      if (this.queryData.sortKey === 'waterBalanceAsc') return [{ asc: true, column: 'waterBalance' }]
      if (this.queryData.sortKey === 'nameAsc') return [{ asc: true, column: 'name' }]
      if (this.queryData.sortKey === 'nameDesc') return [{ asc: false, column: 'name' }]
      if (this.queryData.sortKey === 'createTimeAsc') return [{ asc: true, column: 'createTime' }]
      return [{ asc: false, column: 'createTime' }]
    },

    handleSortChange ({ column, prop, order }) {
      if (this.suppressSortChange) return

      if (!order) {
        this.queryData.sortKey = 'createTimeDesc'
        this.handleSearch()
        return
      }

      const key = column && column.columnKey ? String(column.columnKey) : String(prop || '')
      const isAsc = order === 'ascending'

      if (key === 'meterBalance') {
        this.queryData.sortKey = isAsc ? 'meterBalanceAsc' : 'meterBalanceDesc'
        this.handleSearch()
        return
      }

      if (key === 'waterBalance') {
        this.queryData.sortKey = isAsc ? 'waterBalanceAsc' : 'waterBalanceDesc'
        this.handleSearch()
        return
      }

      if (prop === 'name') {
        this.queryData.sortKey = isAsc ? 'nameAsc' : 'nameDesc'
        this.handleSearch()
        return
      }

      if (prop === 'createTime') {
        this.queryData.sortKey = isAsc ? 'createTimeAsc' : 'createTimeDesc'
        this.handleSearch()
      }
    },

    syncTableSortToQuery () {
      const table = this.$refs.multipleTable
      if (!table || typeof table.sort !== 'function') return

      this.suppressSortChange = true
      if (typeof table.clearSort === 'function') table.clearSort()

      if (this.queryData.sortKey === 'meterBalanceAsc') table.sort('meterBalance', 'ascending')
      else if (this.queryData.sortKey === 'meterBalanceDesc') table.sort('meterBalance', 'descending')
      else if (this.queryData.sortKey === 'waterBalanceAsc') table.sort('waterBalance', 'ascending')
      else if (this.queryData.sortKey === 'waterBalanceDesc') table.sort('waterBalance', 'descending')
      else if (this.queryData.sortKey === 'nameAsc') table.sort('name', 'ascending')
      else if (this.queryData.sortKey === 'nameDesc') table.sort('name', 'descending')
      else if (this.queryData.sortKey === 'createTimeAsc') table.sort('createTime', 'ascending')
      else table.sort('createTime', 'descending')

      this.suppressSortChange = false
    },

    // 获取表格数据
    async fetchTableData () {
      this.loading = true
      try {
        const params = {
          id: this.queryData.id,
          managerId: this.queryData.managerId !== undefined && this.queryData.managerId !== null
            ? String(this.queryData.managerId)
            : '',
          labelIds: this.formatLabelIdsParam(this.queryData.labelIds),
          balanceStatus: null,
          idList: this.treeTenantIdList.length > 0 ? this.treeTenantIdList : undefined,
          tenantStatus: this.queryData.tenantStatus === '' || this.queryData.tenantStatus === null || this.queryData.tenantStatus === undefined
            ? null
            : String(this.queryData.tenantStatus),
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            orders: this.buildOrders()
          }
        }
        if (this.queryData.tenantType === 0 || this.queryData.tenantType === 1 || this.queryData.tenantType === 2) {
          params.tenantType = this.queryData.tenantType
        }

        const response = await tenantPageTenant(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0

          // 查询设备数量
          await this.fetchDeviceCount()
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('tenantListPage.msgFetchTenantsFail'))
      } finally {
        this.loading = false
      }
    },

    // 查询设备数量
    async fetchDeviceCount () {
      if (this.tableData.length === 0) return

      try {
        const ids = this.tableData.map((item) => item.id).join(',')
        const response = await queryTenantDeviceCount({ ids })

        if (response.code === 200 && response.data) {
          const deviceCountMap = response.data
          this.tableData = this.tableData.map((tenant) => ({
            ...tenant,
            deviceCount: deviceCountMap[tenant.id] || 0
          }))
        }
      } catch (error) {
        console.error('获取设备数量失败:', error)
      }
    },

    // 计算租户总余额（电费专户 + 水费专户）
    getTotalBalance (item) {
      const meterBalance = item.meterAccountDto?.balance || 0
      const waterBalance = item.waterAccountDto?.balance || 0
      return meterBalance + waterBalance
    },

    // 格式化余额
    formatBalance (balance) {
      return (balance || 0).toFixed(2)
    },

    // 格式化日期时间
    formatDateTime (date) {
      if (!date) return '-'
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(d.getDate()).padStart(2, '0')} ${String(
        d.getHours()
      ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
        d.getSeconds()
      ).padStart(2, '0')}`
    },

    // 格式化日期
    formatDate (date) {
      if (!date) return '-'
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(d.getDate()).padStart(2, '0')}`
    },

    // 获取余额样式类
    getBalanceClass (balance) {
      if (balance < 0) return 'balance-danger'
      if (balance < 50) return 'balance-warning'
      return 'balance-success'
    },

    // 获取余额状态标签
    getBalanceStatusLabel (status) {
      const statusMap = {
        1: this.$t('tenantListPage.balanceStatus_1'),
        2: this.$t('tenantListPage.balanceStatus_2'),
        3: this.$t('tenantListPage.balanceStatus_3')
      }
      return statusMap[status] || this.$t('tenantListPage.balanceStatus_unknown')
    },

    // 获取余额状态类型
    getBalanceStatusType (status) {
      const typeMap = {
        1: 'success',
        2: 'warning',
        3: 'danger'
      }
      return typeMap[status] || 'info'
    },

    // 处理图片错误
    handleImageError (event) {
      event.target.style.display = 'none'
    },

    // 表格多选
    handleSelectionChange (val) {
      this.multipleSelection = val
    },

    // 复制租户ID
    handleCopySerial (id) {
      if (!id || id === '-') {
        this.$message.warning(this.$t('tenantListPage.msgNothingToCopy'))
        return
      }

      // 创建临时输入框
      const input = document.createElement('input')
      input.value = id
      document.body.appendChild(input)
      input.select()

      try {
        document.execCommand('copy')
        this.$message.success(this.$t('tenantListPage.msgTenantIdCopied'))
      } catch (err) {
        this.$apiError.notify(err, this.$t('tenantListPage.msgCopyFail'))
      }

      document.body.removeChild(input)
    },

    // 查询
    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset () {
      this.queryData = {
        id: '',
        tenantStatus: null,
        tenantType: null,
        managerId: this.currentManagerId,
        labelIds: [],
        sortKey: 'createTimeDesc'
      }
      this.handleSearch()
      if (this.viewType === 'table') {
        this.$nextTick(() => this.syncTableSortToQuery())
      }
    },

    // 导出
    handleExport () {
      if (this.tableData.length === 0) {
        this.$message.warning(this.$t('tenantListPage.msgNoDataExport'))
        return
      }

      try {
        // 确定要导出的数据：优先导出选中数据，无选中则导出当前页
        const exportData = this.multipleSelection.length > 0 ? this.multipleSelection : this.tableData

        // 构建导出的表头和数据
        const headers = [
          this.$t('tenantListPage.expColId'),
          this.$t('tenantListPage.expColName'),
          this.$t('tenantListPage.expColDevices'),
          this.$t('tenantListPage.expColMeterBalance'),
          this.$t('tenantListPage.expColWaterBalance'),
          this.$t('tenantListPage.expColStatus'),
          this.$t('tenantListPage.expColCreated')
        ]

        const data = exportData.map(row => {
          return [
            row.id || '',
            this.$displayBizHybrid(row.name || ''),
            row.deviceCount || 0,
            this.formatBalance(row.meterAccountDto?.balance),
            this.formatBalance(row.waterAccountDto?.balance),
            row.tenantStatus === 0 ? this.$t('tenantListPage.optStatusNormal') : this.$t('tenantListPage.optStatusCancelled'),
            this.formatDateTime(row.createTime)
          ]
        })

        // 创建工作表数据
        const wsData = [headers, ...data]

        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // 设置列宽
        const colWidths = [
          { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }
        ]
        ws['!cols'] = colWidths

        // 创建工作簿
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, this.$t('tenantListPage.exportSheetName'))

        // 生成文件名
        const now = new Date()
        const timeStr = now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0') + '_' +
          String(now.getHours()).padStart(2, '0') +
          String(now.getMinutes()).padStart(2, '0') +
          String(now.getSeconds()).padStart(2, '0')
        const fileName = `${this.$t('tenantListPage.exportFileNamePrefix')}${timeStr}.xlsx`

        // 导出文件
        XLSX.writeFile(wb, fileName)

        this.$message.success(this.$t('tenantListPage.msgExportSuccessN', { n: exportData.length }))
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('tenantListPage.msgExportFail'))
      }
    },

    // 新增
    handleAdd () {
      if (!this.canAdd) {
        this.$message.warning(this.$t('tenantListPage.msgNoAddPerm'))
        return
      }
      this.editForm = {}
      this.addDialogVisible = true
    },

    // 批量操作
    handleBatchCommand (command) {
      switch (command) {
        case 'downloadSelected':
          this.handleDownloadSelected()
          break
        case 'downloadAll':
          this.handleDownloadAll()
          break
        case 'batchManualDebit':
          if (!this.canDeduct) {
            this.$message.warning(this.$t('tenantListPage.msgNoDeductPerm'))
            return
          }
          this.batchManualDebitVisible = true
          break
      }
    },

    // 下载勾选的租户码
    async handleDownloadSelected () {
      if (this.multipleSelection.length === 0) {
        this.$message.warning(this.$t('tenantListPage.msgSelectTenantsFirst'))
        return
      }

      const loading = this.$loading({
        lock: true,
        text: this.$t('tenantListPage.msgGenQrcodeProgressN', { n: this.multipleSelection.length })
      })

      try {
        for (let i = 0; i < this.multipleSelection.length; i++) {
          const tenant = this.multipleSelection[i]
          const canvas = await this.generateTenantQrcodeCanvas(tenant)

          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${this.$t('tenantListPage.qrcodeDownloadPrefix')}${tenant.id}-${
              this.qrcodeDownloadNamePart(tenant)
            }.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          })

          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        this.$message.success(
          this.$t('tenantListPage.msgDownloadNQrcodes', { n: this.multipleSelection.length })
        )
      } catch (error) {
        this.$apiError.notify(error, this.$t('tenantListPage.msgDownloadFail'))
      } finally {
        loading.close()
      }
    },

    // 全部导出租户码
    async handleDownloadAll () {
      if (this.tableData.length === 0) {
        this.$message.warning(this.$t('tenantListPage.msgPageNoData'))
        return
      }

      await this.$confirm(
        this.$t('tenantListPage.confirmExportAllQrcodeBody', { n: this.tableData.length }),
        this.$t('tenantListPage.titleTip'),
        {
          confirmButtonText: this.$t('tenantListPage.btnConfirm'),
          cancelButtonText: this.$t('tenantListPage.btnCancel'),
          type: 'warning'
        }
      )

      const loading = this.$loading({
        lock: true,
        text: this.$t('tenantListPage.msgGenQrcodeProgressN', { n: this.tableData.length })
      })

      try {
        for (let i = 0; i < this.tableData.length; i++) {
          const tenant = this.tableData[i]
          const canvas = await this.generateTenantQrcodeCanvas(tenant)

          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${this.$t('tenantListPage.qrcodeDownloadPrefix')}${tenant.id}-${
              this.qrcodeDownloadNamePart(tenant)
            }.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          })

          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        this.$message.success(this.$t('tenantListPage.msgExportNQrcodes', { n: this.tableData.length }))
      } catch (error) {
        this.$apiError.notify(error, this.$t('tenantListPage.msgExportQrcodeFail'))
      } finally {
        loading.close()
      }
    },

    // 生成租户二维码Canvas
    async generateTenantQrcodeCanvas (tenant) {
      return new Promise((resolve, reject) => {
        try {
          const tempDiv = document.createElement('div')
          tempDiv.style.position = 'absolute'
          tempDiv.style.left = '-9999px'
          document.body.appendChild(tempDiv)

          const qrcodeValue = `https://geekpartytech.com/wx/ebc/?tenantId=${tenant.id}`
          // qrcodejs2 通过构造函数副作用挂载 canvas
          // eslint-disable-next-line no-new
          new QRCode(tempDiv, {
            text: qrcodeValue,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          })

          setTimeout(() => {
            const qrCanvas = tempDiv.querySelector('canvas')
            if (!qrCanvas) {
              document.body.removeChild(tempDiv)
              reject(new Error(this.$t('tenantListPage.msgQrcodeGenFail')))
              return
            }

            const newCanvas = document.createElement('canvas')
            const ctx = newCanvas.getContext('2d')
            const padding = 30
            const qrSize = 200
            const topHeight = 80
            const bottomHeight = 40

            newCanvas.width = qrSize + padding * 2
            newCanvas.height = qrSize + topHeight + bottomHeight + padding * 2

            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, newCanvas.width, newCanvas.height)

            const topY = padding
            ctx.fillStyle = '#f6f8fb'
            ctx.fillRect(padding, topY, qrSize, topHeight)
            ctx.strokeStyle = '#e4e7ed'
            ctx.lineWidth = 1
            ctx.strokeRect(padding, topY, qrSize, topHeight)

            ctx.fillStyle = '#606266'
            ctx.font = 'bold 14px Arial'
            ctx.textAlign = 'left'
            ctx.fillText(this.$t('tenantListPage.qrCanvasLabelTenantId'), padding + 15, topY + 25)
            ctx.fillStyle = '#303133'
            ctx.font = 'bold 16px Arial'
            ctx.fillText(String(tenant.id), padding + 80, topY + 25)
            ctx.fillStyle = '#606266'
            ctx.font = 'bold 14px Arial'
            ctx.fillText(this.$t('tenantListPage.qrCanvasLabelTenantName'), padding + 15, topY + 55)
            ctx.fillStyle = '#303133'
            ctx.font = 'bold 16px Arial'

            const rawName = (tenant.name || '').trim()
            let tenantName = rawName
              ? this.$displayBizHybrid(rawName, 80)
              : this.$t('tenantListPage.unnamed')
            const maxNameWidth = qrSize - 95
            let nameWidth = ctx.measureText(tenantName).width
            if (nameWidth > maxNameWidth) {
              while (nameWidth > maxNameWidth && tenantName.length > 0) {
                tenantName = tenantName.slice(0, -1)
                nameWidth = ctx.measureText(tenantName + '...').width
              }
              tenantName += '...'
            }
            ctx.fillText(tenantName, padding + 80, topY + 55)

            const qrY = topY + topHeight + 15
            ctx.drawImage(qrCanvas, padding, qrY)
            ctx.strokeStyle = '#e4e7ed'
            ctx.lineWidth = 2
            ctx.strokeRect(padding - 1, qrY - 1, qrSize + 2, qrSize + 2)

            const bottomY = qrY + qrSize + 20
            ctx.fillStyle = '#909399'
            ctx.font = '12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(this.$t('tenantListPage.qrCanvasScanHint'), newCanvas.width / 2, bottomY)

            document.body.removeChild(tempDiv)
            resolve(newCanvas)
          }, 300)
        } catch (error) {
          reject(error)
        }
      })
    },

    // 详情
    handleDetail (row) {
      if (!this.canView) {
        this.$message.warning(this.$t('tenantListPage.msgNoViewPerm'))
        return
      }
      this.$router.push({
        name: 'TenantDetail',
        params: { id: row.id }
      })
    },

    handleCardClick (row) {
      if (!this.canView) return
      this.handleDetail(row)
    },

    // 编辑
    handleEdit (row) {
      if (!this.canEdit) {
        this.$message.warning(this.$t('tenantListPage.msgNoEditPerm'))
        return
      }
      this.editForm = { ...row }
      this.addDialogVisible = true
    },

    // 催缴
    async handleUrge (row) {
      if (!this.canUrge) {
        this.$message.warning(this.$t('tenantListPage.msgNoUrgePerm'))
        return
      }
      try {
        await this.$confirm(
          this.$t('tenantListPage.confirmUrgeBody', { name: this.$displayBizHybrid(row.name, 120) }),
          this.$t('tenantListPage.titleTip'),
          {
            confirmButtonText: this.$t('tenantListPage.btnConfirm'),
            cancelButtonText: this.$t('tenantListPage.btnCancel'),
            type: 'warning'
          }
        )

        const response = await balancePush(row.id)
        if (response.code === 200) {
          this.$message.success(this.$t('tenantListPage.msgUrgeSuccess'))
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(this.$t('tenantListPage.msgUrgeFail'))
        }
      }
    },

    // 充值
    handleRecharge (row) {
      if (!this.canRecharge) {
        this.$message.warning(this.$t('tenantListPage.msgNoRechargePerm'))
        return
      }
      this.currentTenant = row
      this.rechargeVisible = true
    },

    // 扣款
    handleDeduct (row) {
      if (!this.canDeduct) {
        this.$message.warning(this.$t('tenantListPage.msgNoDeductPerm'))
        return
      }
      this.currentTenant = row
      this.deductVisible = true
    },

    // 二维码
    handleQrcode (row) {
      if (!this.canView) {
        this.$message.warning(this.$t('tenantListPage.msgNoViewPerm'))
        return
      }
      this.currentTenant = row
      this.qrcodeVisible = true
    },

    // 行操作
    handleRowCommand (command, row) {
      if (command === 'edit') {
        this.handleEdit(row)
      } else if (command === 'detail') {
        this.handleDetail(row)
      }
    },

    // 新增成功
    handleAddSuccess () {
      this.addDialogVisible = false
      this.fetchTableData()
    },

    // 充值成功
    handleRechargeSuccess () {
      this.rechargeVisible = false
      this.fetchTableData()
    },

    // 扣款成功
    handleDeductSuccess () {
      this.deductVisible = false
      this.fetchTableData()
    },

    handleBatchManualDebitSuccess () {
      this.batchManualDebitVisible = false
      this.fetchTableData()
    },

    // 分页
    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    }
  }
}
</script>
<style lang="scss" scoped>
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;

.table-page-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
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
    display: grid;
    align-items: center;
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    gap: 10px;
  }

  .search-main-grid > .search-actions {
    grid-column: 5;
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
    ::v-deep .el-select .el-input__inner,
    ::v-deep .el-range-editor.el-input__inner {
      height: 32px;
      line-height: 32px;
      border-radius: 6px;
      border-color: #e4e7ed;
      font-size: 13px;

      &::placeholder {
        color: #c0c4cc;
      }
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
    justify-self: end;
    grid-column: 5;
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
  flex-wrap: wrap;
  gap: 10px;

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
    gap: 12px;

    ::v-deep .el-button--primary {
      background: #1677ff;
      border-color: #1677ff;
      height: 32px;
      padding: 0 16px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 999px;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;

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

    .batch-settings-dropdown {
      display: inline-block;
      vertical-align: middle;
    }

    ::v-deep .batch-settings-trigger.el-button {
      background: #e6a23c;
      border: 1px solid #e6a23c;
      color: #fff;
      height: 32px;
      padding: 0 16px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 999px;
      line-height: 1 !important;
      margin-left: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: none;

      i {
        color: #fff;
        font-size: 12px;
        margin-left: 4px;
      }

      &:hover,
      &:focus {
        background: #cf9236;
        border-color: #cf9236;
        color: #fff;
      }

      &:active {
        background: #b8822f;
        border-color: #b8822f;
        color: #fff;
      }
    }
  }
}

.list-view {
  padding: 0;
}

.list-empty {
  padding: 32px 0;
}

.table-view-wrap {
  width: 100%;
}

.tenant-table.light-border-table {
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

    .el-link--primary {
      color: #1677ff;

      &:hover {
        color: #4096ff;
      }
    }

    .tenant-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .tenant-logo-small {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        object-fit: cover;
      }

      .logo-placeholder-small {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: 600;
      }
    }

    .tenant-label-cell {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }

    .action-buttons {
      display: flex;

      .el-button {
        padding: 5px 8px;
      }
    }
  }
}

.view-switcher-compact {
  ::v-deep .el-radio-button__inner {
    padding: 5px 12px;
    font-size: 12px;
  }
}

// 卡片视图容器
.card-view-container {
  min-height: 400px;

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
    padding: 4px;
  }
}

// 卡片样式 - 完全保留第一个版本
.tenant-card-modern {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  &.is-clickable {
    cursor: pointer;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  .card-header-modern {
    display: flex;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
    border-bottom: 1px solid #eee;

    .tenant-avatar {
      width: 48px;
      height: 48px;
      margin-right: 12px;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        font-weight: 600;
      }
    }

    .tenant-info {
      flex: 1;
      min-width: 0;

      .tenant-name {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2329;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .tenant-name-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
      }

      .tenant-label-inline {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
      }

      .tenant-code {
        font-size: 12px;
        color: #8e92a0;
        display: inline-block;
        margin-top: 4px;
      }
    }

    .qr-button {
      color: #1677ff;
      padding: 8px;
      font-size: 20px;
      margin-left: 8px;

      &:hover {
        background: rgba(22, 119, 255, 0.1);
        border-radius: 8px;
      }
    }
  }

  .card-content {
    padding: 16px;

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-item {
        flex: 1;
        display: flex;
        align-items: center;
        font-size: 13px;

        .info-label {
          color: #8e92a0;
          margin-right: 4px;
        }

        .info-value {
          color: #1f2329;
          font-weight: 500;

          &.no-data {
            color: #bfbfbf;
          }

          &.balance-success {
            color: $success-color;
          }

          &.balance-warning {
            color: $warning-color;
          }

          &.balance-danger {
            color: $danger-color;
          }
        }
      }
    }
  }

  .card-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #eee;
    background: #fafbfc;

    .el-button {
      margin: 0;
      padding: 8px 12px;
      font-size: 13px;

      &:hover {
        transform: translateY(-2px);
      }
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

// 响应式设计
@media (max-width: 1400px) {
  .card-view-container {
    .card-grid {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .card-view-container {
    .card-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  .card-actions {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
.serial-copy {
  color: #303133;
  cursor: pointer;
  user-select: none;
  display: inline-block;
  transition: all 0.2s ease;

  &:hover {
    color: #1677ff;
  }

  &:active {
    color: #0958d9;
  }
}
</style>
