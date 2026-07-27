<template>
  <div class="table-page-container">
    <el-empty v-if="!canView" :description="$t('corporateRechargePage.emptyNoViewPerm')" />
    <template v-else>
      <!-- Tab：样式对齐 conditioning（黑粗选中 + 短蓝条） -->
      <div class="tab-nav-box" role="tablist" :aria-label="$t('corporateRechargePage.tabNavAria')">
        <div
          v-for="t in mainTabs"
          :key="t.name"
          role="tab"
          class="tab-nav-item"
          :class="{ 'is-active': activeFinanceTab === t.name }"
          :tabindex="activeFinanceTab === t.name ? 0 : -1"
          :aria-selected="activeFinanceTab === t.name ? 'true' : 'false'"
          @click="activeFinanceTab = t.name"
          @keydown.enter.prevent="activeFinanceTab = t.name"
          @keydown.space.prevent="activeFinanceTab = t.name"
        >
          {{ t.label }}
        </div>
      </div>

      <!-- 对公充值 -->
      <div v-show="activeFinanceTab === 'public'" class="tab-panel-wrap">
        <div class="search-box">
          <el-form
            :model="queryData"
            ref="searchForm"
            class="search-form"
            @submit.native.prevent
          >
            <div class="search-main-grid">
              <!-- 时间筛选固定第一位（财务列表规范）；布局同 device/watermeter：两列 + 按钮 + 两列空 1fr 避免输入框拉满 -->
              <div class="field-item field-range">
                <el-date-picker
                  v-model="queryData.timeRange"
                  type="daterange"
                  range-separator="-"
                  :start-placeholder="$t('corporateRechargePage.phDateStart')"
                  :end-placeholder="$t('corporateRechargePage.phDateEnd')"
                  value-format="yyyy-MM-dd"
                  size="small"
                  style="width: 100%"
                  :picker-options="pickerOptions"
                  :default-time="['00:00:00', '23:59:59']"
                  popper-class="elegant-date-picker"
                  @change="handleDateChange"
                />
              </div>
              <div class="field-item field-tenant">
                <el-select
                  v-model="queryData.tenantId"
                  filterable
                  clearable
                  :placeholder="$t('corporateRechargePage.phTenant')"
                  size="small"
                  style="width: 100%"
                  @change="handleSearch"
                >
                  <el-option
                    v-for="item in tenantList"
                    :key="item.tenantId"
                    :label="String(item.tenantId) + ' - ' + $displayBizHybrid(item.name || '')"
                    :value="item.tenantId"
                  />
                </el-select>
              </div>

              <div class="search-actions">
                <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">
                  {{ $t('corporateRechargePage.btnSearch') }}
                </el-button>
                <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('corporateRechargePage.btnReset') }}</el-button>
                <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">
                  {{ $t('corporateRechargePage.btnExport') }}
                </el-button>
              </div>
            </div>
          </el-form>
        </div>

        <div class="content-box">
          <div class="content-toolbar">
            <div class="toolbar-left">
              <span class="section-title">
                <span class="title-bar" />
                {{ $t('corporateRechargePage.sectionTitle') }}
              </span>
            </div>
            <div class="toolbar-right">
              <el-button
                v-if="canOperate"
                type="primary"
                size="small"
                icon="el-icon-plus"
                @click="handleRecharge"
              >
                {{ $t('corporateRechargePage.btnRecharge') }}
              </el-button>
              <el-select v-model="sortOrder" size="small" style="width: 100px">
                <el-option :label="$t('corporateRechargePage.sortDefault')" value="default" />
              </el-select>
            </div>
          </div>

          <div class="list-view">
            <el-table
              :key="'corporate-recharge-' + localeKey"
              v-loading="loading"
              border
              :data="tableData"
              stripe
              style="width: 100%"
              class="custom-table light-border-table"
              :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: '600',
              }"
            >
              <el-table-column
                prop="seqNo"
                :label="$t('corporateRechargePage.colSeqNo')"
                width="180"
                align="center"
                show-overflow-tooltip
              />
              <el-table-column
                prop="occurTime"
                :label="$t('corporateRechargePage.colOccurTime')"
                width="168"
                align="center"
              />
              <el-table-column :label="$t('corporateRechargePage.colTenant')" min-width="200" show-overflow-tooltip>
                <template slot-scope="scope">
                  <el-link
                    v-if="scope.row.tenantId"
                    type="primary"
                    class="tenant-link"
                    @click="goTenantDetail(scope.row)"
                  >
                    {{ $displayBizHybrid(scope.row.tenantName || '') || '-' }}
                  </el-link>
                  <span v-else class="text-muted">{{ $displayBizHybrid(scope.row.tenantName || '') || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('corporateRechargePage.colRechargeAccount')" width="120" align="center">
                <template slot-scope="scope">
                  {{ formatRechargeAccount(scope.row) }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('corporateRechargePage.colAmount')" width="130" align="center">
                <template slot-scope="scope">
                  <span class="amount-text">¥{{ formatMoney(scope.row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="payeeName"
                :label="$t('corporateRechargePage.colPayeeName')"
                width="180"
                show-overflow-tooltip
              />
              <el-table-column
                prop="bankNumber"
                :label="$t('corporateRechargePage.colBankNumber')"
                width="180"
                show-overflow-tooltip
              />
              <el-table-column :label="$t('corporateRechargePage.colTransferRemark')" min-width="160" show-overflow-tooltip>
                <template slot-scope="scope">
                  {{ transferRemark(scope.row) }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('corporateRechargePage.colStatus')" width="110" align="center">
                <template slot-scope="scope">
                  <div class="status-inline">
                    <span
                      class="status-dot"
                      :style="{ backgroundColor: getStatusColor(scope.row.status) }"
                    />
                    {{ getStatusLabel(scope.row.status) }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('corporateRechargePage.colAction')" width="100" align="center" fixed="right">
                <template slot-scope="scope">
                  <div class="operation-cell">
                    <el-button
                      v-if="scope.row.imageList && scope.row.imageList.length > 0"
                      type="text"
                      size="mini"
                      class="op-btn primary-btn"
                      icon="el-icon-picture"
                      @click="handleViewImages(scope.row.imageList)"
                    >
                      {{ $t('corporateRechargePage.btnView') }}
                    </el-button>
                    <span v-else class="text-muted">-</span>
                  </div>
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
      </div>

      <!-- 银企直连 -->
      <div v-show="activeFinanceTab === 'bank'" class="tab-panel-wrap bank-tab-panel">
        <bank-journal-hub />
      </div>
    </template>

    <!-- 对公充值弹窗 -->
    <el-dialog
      :title="$t('corporateRechargePage.dialogTitleRecharge')"
      :visible.sync="rechargeDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      @close="handleRechargeDialogClose"
    >
      <el-form
        ref="rechargeForm"
        :model="rechargeFormData"
        :rules="rechargeFormRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item :label="$t('corporateRechargePage.formProjectName')" prop="managerId">
          <el-select
            v-model="rechargeFormData.managerId"
            :placeholder="$t('corporateRechargePage.phSelectProject')"
            style="width: 100%"
            @change="handleManagerChange"
          >
            <el-option v-for="item in managerList" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="rechargeFormData.managerId" :label="$t('corporateRechargePage.formTenantName')" prop="tenantId">
          <el-select
            v-model="rechargeFormData.tenantId"
            :placeholder="$t('corporateRechargePage.phSelectTenant')"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in rechargeTenantList"
              :key="item.tenantId"
              :label="String(item.tenantId) + ' - ' + $displayBizHybrid(item.name || '')"
              :value="item.tenantId"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('corporateRechargePage.formTradeType')" prop="tradeType">
          <el-select
            v-model="rechargeFormData.tradeType"
            :placeholder="$t('corporateRechargePage.phSelectTradeType')"
            style="width: 100%"
          >
            <el-option :label="$t('corporateRechargePage.tradeTypeTenantCharge')" value="TENANT_CHARGE" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('corporateRechargePage.formBizType')" prop="bizType">
          <el-radio-group v-model="rechargeFormData.bizType">
            <el-radio :label="1">{{ $t('corporateRechargePage.bizElectric') }}</el-radio>
            <el-radio :label="2">{{ $t('corporateRechargePage.bizWater') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('corporateRechargePage.formAmount')" prop="amount">
          <el-input v-model="rechargeFormData.amount" :placeholder="$t('corporateRechargePage.phAmount')" @input="handleAmountInput">
            <template slot="suffix">{{ $t('corporateRechargePage.suffixYuan') }}</template>
          </el-input>
        </el-form-item>

        <el-form-item :label="$t('corporateRechargePage.formBankType')" prop="bankType">
          <el-select
            v-model="rechargeFormData.bankType"
            :placeholder="$t('corporateRechargePage.phSelectBankType')"
            style="width: 100%"
          >
            <el-option v-for="item in bankTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('corporateRechargePage.formRemark')">
          <el-input
            v-model="rechargeFormData.comment"
            type="textarea"
            :rows="3"
            :placeholder="$t('corporateRechargePage.phRemark')"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item :label="$t('corporateRechargePage.formVoucher')">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :file-list="fileList"
            list-type="picture-card"
            accept="image/*"
            :limit="5"
          >
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">{{ $t('corporateRechargePage.uploadTip') }}</div>
          </el-upload>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="handleRechargeDialogClose">{{ $t('corporateRechargePage.btnCancel') }}</el-button>
        <el-button type="primary" @click="handleRechargeSubmit" :loading="submitting">
          {{ submitting ? $t('corporateRechargePage.btnSubmitting') : $t('corporateRechargePage.btnConfirmRecharge') }}
        </el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="$t('corporateRechargePage.dialogTitleVoucher')"
      :visible.sync="imageDialogVisible"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="image-preview">
        <el-image
          v-for="(url, index) in currentImages"
          :key="index"
          :src="url"
          :preview-src-list="currentImages"
          fit="contain"
          class="preview-image"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  capitalManagePageTenantRecord,
  payPublicTransfers,
  getManagerById,
  getSimpleTenantList
} from '@/api/publicRecharge'
import { mapGetters } from 'vuex'
import BankJournalHub from './components/bankJournal/BankJournalHub.vue'
import * as XLSX from 'xlsx'

export default {
  name: 'PublicRecharge',
  components: { BankJournalHub },
  data () {
    return {
      activeFinanceTab: 'public',
      sortOrder: 'default',

      queryData: {
        tenantId: null,
        timeRange: []
      },

      tenantList: [],
      tableData: [],
      loading: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },

      rechargeDialogVisible: false,
      submitting: false,
      rechargeFormData: {
        managerId: '',
        tenantId: '',
        tradeType: 'TENANT_CHARGE',
        bizType: 1,
        amount: '',
        bankType: '',
        comment: '',
        payChannel: 'PUBLIC_TRANSFERS',
        imageList: []
      },
      managerList: [],
      rechargeTenantList: [],
      uploadUrl: process.env.VUE_APP_BASE_API + '/api/ebc-content/file/upload',
      uploadHeaders: { userDeviceType: 'PC' },
      fileList: [],
      hasRechargePermission: false,
      imageDialogVisible: false,
      currentImages: []
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters('user', ['userId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canView () {
      return this.hasKztPermission('670011')
    },
    canOperate () {
      return this.hasKztPermission('670010')
    },
    localeKey () {
      return this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'zh-CN'
    },
    mainTabs () {
      return [
        { name: 'public', label: this.$t('corporateRechargePage.tabPublic') },
        { name: 'bank', label: this.$t('corporateRechargePage.tabBank') }
      ]
    },
    pickerOptions () {
      const t = (key) => this.$t(`corporateRechargePage.${key}`)
      return {
        shortcuts: [
          {
            text: t('shortcutYesterday'),
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
            text: t('shortcutThisWeek'),
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
            text: t('shortcutLastWeek'),
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
            text: t('shortcutThisMonth'),
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
            text: t('shortcutLastMonth'),
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
            text: t('shortcutLast3Months'),
            onClick (picker) {
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              const start = new Date()
              start.setMonth(start.getMonth() - 3)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: t('shortcutLastYear'),
            onClick (picker) {
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              const start = new Date()
              start.setFullYear(start.getFullYear() - 1)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      }
    },
    bankTypeOptions () {
      return [
        { label: this.$t('corporateRechargePage.bankZGYH'), value: 'ZGYH' },
        { label: this.$t('corporateRechargePage.bankPFYH'), value: 'PFYH' },
        { label: this.$t('corporateRechargePage.bankZGYHSZ'), value: 'ZGYHSZ' },
        { label: this.$t('corporateRechargePage.bankZHSHYH'), value: 'ZHSHYH' },
        { label: this.$t('corporateRechargePage.bankZXYH'), value: 'ZXYH' },
        { label: this.$t('corporateRechargePage.bankNBYH'), value: 'NBYH' }
      ]
    },
    statusTableOptions () {
      return [
        { label: this.$t('corporateRechargePage.statusNormal'), value: 0, color: '#52c41a' },
        { label: this.$t('corporateRechargePage.statusRevoked'), value: 1, color: '#909399' }
      ]
    },
    rechargeFormRules () {
      return {
        managerId: [{ required: true, message: this.$t('corporateRechargePage.ruleSelectProject'), trigger: 'change' }],
        tenantId: [{ required: true, message: this.$t('corporateRechargePage.ruleSelectTenant'), trigger: 'change' }],
        tradeType: [{ required: true, message: this.$t('corporateRechargePage.ruleSelectTradeType'), trigger: 'change' }],
        bizType: [{ required: true, message: this.$t('corporateRechargePage.ruleSelectBizType'), trigger: 'change' }],
        amount: [
          { required: true, message: this.$t('corporateRechargePage.ruleAmountRequired'), trigger: 'blur' },
          { validator: this.validateAmount, trigger: 'blur' }
        ],
        bankType: [{ required: true, message: this.$t('corporateRechargePage.ruleSelectBankType'), trigger: 'change' }]
      }
    }
  },

  watch: {
    canView: {
      handler () {
        this.tryInitData()
      },
      immediate: true
    },
    currentManagerId: {
      handler (newVal) {
        this.tryInitData()
      },
      immediate: true
    }
  },

  mounted () {
    this.fetchManagerList()
  },

  methods: {
    normalizeSelect (v) {
      if (v === null || v === undefined || v === '') return undefined
      return v
    },

    tryInitData () {
      if (!this.canView || !this.currentManagerId) return
      this.fetchTenantList()
      this.setDefaultTimeRange()
      this.fetchTableData()
    },

    setDefaultTimeRange () {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setTime(startDate.getTime() - 3600 * 1000 * 24 * 30)
      this.queryData.timeRange = [this.formatDate(startDate), this.formatDate(endDate)]
    },

    formatDate (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    formatMoney (amount) {
      if (amount === null || amount === undefined) return '0.00'
      return Number(amount).toFixed(2)
    },

    transferRemark (row) {
      if (!row) return '-'
      return row.comment || row.remark || '-'
    },

    formatRechargeAccount (row) {
      const bizType = row && (row.bizType ?? row.rechargeBizType)
      const n = Number(bizType)
      if (n === 1) return this.$t('corporateRechargePage.accountElectric')
      if (n === 2) return this.$t('corporateRechargePage.accountWater')
      if (row && row.rechargeAccount) return String(row.rechargeAccount)
      return '-'
    },

    getStatusLabel (status) {
      const statusObj = this.statusTableOptions.find((s) => s.value === status)
      return statusObj ? statusObj.label : '-'
    },

    getStatusColor (status) {
      const statusObj = this.statusTableOptions.find((s) => s.value === status)
      return statusObj ? statusObj.color : '#909399'
    },

    goTenantDetail (row) {
      const id = row && row.tenantId
      if (!id) return
      this.$router.push({ path: `/metering/tenant/detail/${id}` })
    },

    async fetchTenantList () {
      try {
        const params = { managerId: this.currentManagerId, tenantStatus: 0 }
        const response = await getSimpleTenantList(params)
        if (response.code === 200) this.tenantList = response.data || []
      } catch (error) {
        console.error('获取租户列表失败:', error)
        this.$apiError.notify(error, this.$t('corporateRechargePage.msgTenantListFail'))
      }
    },

    async fetchTableData () {
      this.loading = true
      try {
        const tenantId = this.normalizeSelect(this.queryData.tenantId)
        const params = {
          managerId: this.currentManagerId,
          tenantId: tenantId === undefined ? null : tenantId,
          startDate:
            this.queryData.timeRange && this.queryData.timeRange[0]
              ? `${this.queryData.timeRange[0]} 00:00:00`
              : '',
          endDate:
            this.queryData.timeRange && this.queryData.timeRange[1]
              ? `${this.queryData.timeRange[1]} 23:59:59`
              : '',
          channels: ['PUBLIC_TRANSFERS'],
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            orders: [{ asc: false, column: 'occurTime' }]
          }
        }

        const response = await capitalManagePageTenantRecord(params)
        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || this.$t('corporateRechargePage.msgFetchFail'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('corporateRechargePage.msgFetchRecordFail'))
        console.error('获取充值记录失败:', error)
      } finally {
        this.loading = false
      }
    },

    handleDateChange (value) {
      if (value && value.length === 2 && value[0] && value[1]) this.handleSearch()
    },

    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleReset () {
      this.queryData = { tenantId: null, timeRange: [] }
      this.setDefaultTimeRange()
      this.handleSearch()
    },

    handleExport () {
      if (!this.tableData.length) {
        this.$message.warning(this.$t('corporateRechargePage.msgNoDataExport'))
        return
      }
      try {
        const headers = [
          this.$t('corporateRechargePage.colSeqNo'),
          this.$t('corporateRechargePage.colOccurTime'),
          this.$t('corporateRechargePage.colTenant'),
          this.$t('corporateRechargePage.colRechargeAccount'),
          this.$t('corporateRechargePage.colAmount'),
          this.$t('corporateRechargePage.colPayeeName'),
          this.$t('corporateRechargePage.colBankNumber'),
          this.$t('corporateRechargePage.colTransferRemark'),
          this.$t('corporateRechargePage.colStatus')
        ]
        const data = this.tableData.map((row) => [
          row.seqNo || '',
          row.occurTime || '',
          this.$displayBizHybrid(row.tenantName || '') || '',
          this.formatRechargeAccount(row),
          row.amount != null ? Number(row.amount).toFixed(2) : '',
          row.payeeName || '',
          row.bankNumber || '',
          this.transferRemark(row),
          this.getStatusLabel(row.status)
        ])
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
        const wb = XLSX.utils.book_new()
        const sheetName = this.$t('corporateRechargePage.exportSheetName')
        XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
        const timeStr = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
        const filePrefix = this.$t('corporateRechargePage.filePrefix')
        XLSX.writeFile(wb, `${filePrefix}_${timeStr}.xlsx`)
        this.$message.success(
          this.$t('corporateRechargePage.msgExportOk', { count: this.tableData.length })
        )
      } catch (e) {
        console.error(e)
        this.$apiError.notify(e, this.$t('corporateRechargePage.msgExportFail'))
      }
    },

    handleViewImages (imageList) {
      this.currentImages = imageList
      this.imageDialogVisible = true
    },

    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    },

    handleRecharge () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('corporateRechargePage.msgNoOperatePerm'))
        return
      }
      this.rechargeDialogVisible = true
      this.rechargeFormData.managerId = this.currentManagerId || ''
      if (this.rechargeFormData.managerId) {
        this.checkRechargePermission()
        this.fetchRechargeTenantList()
      }
    },

    async fetchManagerList () {
      try {
        this.managerList = this.$store.state.user.managerNames || []
      } catch (error) {
        console.error('获取项目列表失败:', error)
      }
    },

    async handleManagerChange (managerId) {
      this.rechargeFormData.tenantId = ''
      this.rechargeTenantList = []
      if (managerId) {
        await this.checkRechargePermission()
        await this.fetchRechargeTenantList()
      }
    },

    async checkRechargePermission () {
      try {
        const response = await getManagerById({ id: this.rechargeFormData.managerId })
        if (response.code === 200 && response.data) {
          const rechargeRole = response.data.rechargeRole || []
          this.hasRechargePermission = rechargeRole.includes('PUBLIC_TRANSFERS')
          if (!this.hasRechargePermission) {
            this.$message.warning(this.$t('corporateRechargePage.msgNoPublicRechargePerm'))
          }
        }
      } catch (error) {
        console.error('检查充值权限失败:', error)
      }
    },

    async fetchRechargeTenantList () {
      try {
        const params = { managerId: this.rechargeFormData.managerId, tenantStatus: 0 }
        const response = await getSimpleTenantList(params)
        if (response.code === 200) this.rechargeTenantList = response.data || []
      } catch (error) {
        console.error('获取租户列表失败:', error)
        this.$apiError.notify(error, this.$t('corporateRechargePage.msgTenantListFail'))
      }
    },

    handleAmountInput (value) {
      let val = value.replace(/[^\d.]/g, '')
      val = val.replace(/\.{2,}/g, '.')
      val = val.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.')
      const arr = val.split('.')
      if (arr.length > 1) val = arr[0] + '.' + arr[1].substring(0, 2)
      this.rechargeFormData.amount = val
    },

    validateAmount (rule, value, callback) {
      if (!value) {
        callback(new Error(this.$t('corporateRechargePage.ruleAmountRequired')))
        return
      }
      const amount = Number(value)
      if (isNaN(amount)) {
        callback(new Error(this.$t('corporateRechargePage.ruleAmountInvalid')))
        return
      }
      if (amount <= 0) {
        callback(new Error(this.$t('corporateRechargePage.ruleAmountPositive')))
        return
      }
      if (amount > 999999.99) {
        callback(new Error(this.$t('corporateRechargePage.ruleAmountMax')))
        return
      }
      callback()
    },

    handleUploadSuccess (response, file, fileList) {
      if (response.code === 200) {
        this.rechargeFormData.imageList.push(response.data.url)
        this.$message.success(this.$t('corporateRechargePage.msgUploadSuccess'))
      } else {
        this.$message.error(response.msg || this.$t('corporateRechargePage.msgUploadFail'))
        this.fileList = fileList.filter((f) => f.uid !== file.uid)
      }
    },

    handleRemove (file, fileList) {
      if (file.response && file.response.data) {
        const index = this.rechargeFormData.imageList.indexOf(file.response.data.url)
        if (index > -1) this.rechargeFormData.imageList.splice(index, 1)
      }
      this.fileList = fileList
    },

    async handleRechargeSubmit () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('corporateRechargePage.msgNoOperatePerm'))
        return
      }
      if (!this.hasRechargePermission) {
        this.$message.warning(this.$t('corporateRechargePage.msgNoPublicRechargePerm'))
        return
      }

      try {
        await this.$refs.rechargeForm.validate()
        await this.$confirm(this.$t('corporateRechargePage.msgConfirmSubmit'), this.$t('corporateRechargePage.confirmTitle'), {
          confirmButtonText: this.$t('corporateRechargePage.confirmOk'),
          cancelButtonText: this.$t('corporateRechargePage.confirmCancel'),
          type: 'warning'
        })

        this.submitting = true
        const params = { ...this.rechargeFormData, userId: this.userId }
        const response = await payPublicTransfers(params)

        if (response.code === 200) {
          this.$message.success(this.$t('corporateRechargePage.msgSubmitSuccess'))
          this.handleRechargeDialogClose()
          this.fetchTableData()
        } else {
          this.$message.error(response.msg || this.$t('corporateRechargePage.msgPayFail'))
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('充值失败:', error)
          this.$message.error(this.$t('corporateRechargePage.msgRechargeFail'))
        }
      } finally {
        this.submitting = false
      }
    },

    handleRechargeDialogClose () {
      this.rechargeDialogVisible = false
      this.$refs.rechargeForm && this.$refs.rechargeForm.resetFields()
      this.rechargeFormData = {
        managerId: '',
        tenantId: '',
        tradeType: 'TENANT_CHARGE',
        bizType: 1,
        amount: '',
        bankType: '',
        comment: '',
        payChannel: 'PUBLIC_TRANSFERS',
        imageList: []
      }
      this.fileList = []
      this.rechargeTenantList = []
      this.hasRechargePermission = false
    }
  }
}
</script>

<style lang="scss" scoped>
.table-page-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tab-nav-box {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0 32px;
  margin: 0 0 16px;
  padding: 16px 24px 0 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.tab-nav-item {
  position: relative;
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

.bank-tab-panel {
  margin-top: 0;
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
    /* 与 device/watermeter.vue 一致：两列筛选项 + auto 按钮 + 两列空 1fr，剩余宽度由空列吸收，输入框不被拉满 */
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px;
  }

  .field-range {
    grid-column: 1;
  }

  .field-tenant {
    grid-column: 2;
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

    ::v-deep .el-range-editor--small .el-range-input {
      font-size: 13px;
    }

    ::v-deep .el-range-editor--small.el-input__inner {
      height: 32px;
      line-height: 32px;
    }

    ::v-deep .el-range-separator {
      line-height: 24px;
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
    justify-self: start;
    grid-column: 3;
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

  .toolbar-left .section-title {
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
  }
}

.tenant-link {
  color: #1677ff !important;
  font-weight: 500;

  &:hover {
    color: #4096ff !important;
  }
}

.amount-text {
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

.status-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.operation-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

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

.text-muted {
  color: #c0c4cc;
}

.dialog-footer {
  text-align: right;

  .el-button {
    min-width: 80px;
  }
}

.upload-demo {
  ::v-deep .el-upload-list--picture-card .el-upload-list__item {
    width: 100px;
    height: 100px;
  }

  ::v-deep .el-upload--picture-card {
    width: 100px;
    height: 100px;
    line-height: 100px;
  }

  .el-upload__tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
  }
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;

  .preview-image {
    width: 200px;
    height: 200px;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>

<style lang="scss">
.elegant-date-picker {
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
    }

    &:last-child {
      margin-bottom: 0 !important;
    }
  }

  .el-picker-panel__body {
    padding-left: 12px !important;
  }

  .el-picker-panel__footer {
    padding: 10px 12px !important;
    background: #fafafa !important;
    border-top: 1px solid #e8e8e8 !important;

    .el-button--primary {
      background: #1677ff !important;
      border-color: #1677ff !important;

      &:hover {
        background: #4096ff !important;
        border-color: #4096ff !important;
      }
    }
  }
}
</style>
