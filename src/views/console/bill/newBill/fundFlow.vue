<template>
  <div class="table-page-container fund-flow-page">
    <!-- 标准化搜索区：时间首位 + 查询/重置/导出（导出逻辑仍为全页导出实现，仅入口迁入搜索区） -->
    <div class="search-box">
      <el-form :model="turnoverForm" class="search-form" @submit.native.prevent>
        <div class="search-main-grid">
          <div class="field-item">
            <el-date-picker
              v-model="turnoverDateRange"
              type="daterange"
              range-separator="-"
              :start-placeholder="$t('fundFlowPage.phDateStart')"
              :end-placeholder="$t('fundFlowPage.phDateEnd')"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              size="small"
              style="width: 100%"
              :picker-options="datePickerOptions"
              @change="handleTurnoverDateChange"
            />
          </div>
          <div class="field-item">
            <el-select
              v-model="selectedTenantId"
              filterable
              clearable
              :placeholder="$t('fundFlowPage.phTenant')"
              size="small"
              style="width: 100%"
              :loading="tenantLoading"
              @change="handleTenantChange"
            >
              <el-option
                v-for="tenant in tenantOptions"
                :key="tenant.tenantId"
                :label="formatTenantOptionLabel(tenant)"
                :value="tenant.tenantId"
              />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="selectedChannel"
              clearable
              :placeholder="$t('fundFlowPage.phChannel')"
              size="small"
              style="width: 100%"
              @change="handleChannelChange"
            >
              <el-option
                v-for="item in channelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleToolbarSearch">{{ $t('fundFlowPage.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleToolbarReset">{{ $t('fundFlowPage.btnReset') }}</el-button>
            <el-dropdown trigger="hover" @command="handleExportCommand">
              <el-button
                type="success"
                size="small"
                icon="el-icon-download"
              >
                {{ $t('fundFlowPage.btnExport') }}<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="currentPage">{{ $t('fundFlowPage.exportCurrentPage') }}</el-dropdown-item>
                <el-dropdown-item command="selected">{{ $t('fundFlowPage.exportSelected') }}</el-dropdown-item>
                <el-dropdown-item command="all">{{ $t('fundFlowPage.exportAll') }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 业务特有：留存公式 + 电费/水费切换（非设备列表，保留专用布局） -->
    <div class="fund-flow-summary-card">
      <div class="fund-flow-summary-inner">
        <div class="flow-tab-row" role="tablist" :aria-label="$t('fundFlowPage.ariaFlowTabList')">
          <div
            role="tab"
            class="flow-tab-item"
            :class="{ 'is-active': activeTab === 'electric' }"
            @click="switchTab('electric')"
          >
            <i class="iconfont icon-dianbiao" />
            {{ $t('fundFlowPage.tabElectric') }}
          </div>
          <div
            role="tab"
            class="flow-tab-item"
            :class="{ 'is-active': activeTab === 'water' }"
            @click="switchTab('water')"
          >
            <i class="iconfont icon-shuibiao" />
            {{ $t('fundFlowPage.tabWater') }}
          </div>
        </div>

        <div class="formula-card" :aria-label="$t('fundFlowPage.ariaFormula')">
          <div class="formula-item main">
            <div class="formula-text">
              <div class="formula-label">{{ $t('fundFlowPage.formulaTotal') }}</div>
              <div class="formula-value">{{ cashTotal }}</div>
            </div>
          </div>
          <span class="formula-op" aria-hidden="true">=</span>
          <div class="formula-item">
            <i class="iconfont icon-dianfei formula-icon elec" aria-hidden="true" />
            <div class="formula-text">
              <div class="formula-label">{{ $t('fundFlowPage.formulaElec') }}</div>
              <div class="formula-value">{{ discountTotal }}</div>
            </div>
          </div>
          <span class="formula-op" aria-hidden="true">+</span>
          <div class="formula-item">
            <i class="iconfont icon-shuifei formula-icon water" aria-hidden="true" />
            <div class="formula-text">
              <div class="formula-label">{{ $t('fundFlowPage.formulaWater') }}</div>
              <div class="formula-value">{{ subsidyTotal }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            {{ activeTab === 'electric' ? $t('fundFlowPage.sectionElectric') : $t('fundFlowPage.sectionWater') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option :label="$t('fundFlowPage.sortDefault')" value="default" />
          </el-select>
        </div>
      </div>

      <div class="list-view">
        <el-table
          :key="'fund-flow-' + localeKey"
          :data="turnoverList"
          row-key="id"
          @selection-change="handleSelectionChange"
          v-loading="turnoverLoading"
          border
          stripe
          size="small"
          style="width: 100%"
          class="custom-table light-border-table"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <el-table-column type="selection" width="55" align="center" reserve-selection />
          <el-table-column prop="id" :label="$t('fundFlowPage.colId')" align="center" width="180" />
          <el-table-column prop="createTime" :label="$t('fundFlowPage.colCreateTime')" align="center" width="200" />

          <el-table-column :label="$t('fundFlowPage.colTenant')" min-width="220" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="tenant-link" @click="goTenantDetail(scope.row)">{{ formatTenantInfo(scope.row) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="operate" :label="$t('fundFlowPage.colOperate')" align="center" width="120">
            <template slot-scope="scope">
              <el-tag :type="getOperateTagType(scope.row.operate)" size="small" effect="plain">
                {{ getOperateLabel(scope.row.operate) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="channel" :label="$t('fundFlowPage.colChannel')" align="center" width="120">
            <template slot-scope="scope">
              <span>{{ getChannelLabel(scope.row.channel) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="amount" :label="$t('fundFlowPage.colAmount')" align="right">
            <template slot-scope="scope">
              <div v-if="isPositiveAmountSign(scope.row)">
                {{ scope.row.amount }}
              </div>
              <div v-else>- {{ scope.row.amount }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="tenantBalance" :label="$t('fundFlowPage.colBalance')" align="right">
            <template slot-scope="scope">
              <span>{{ formatBalance(scope.row.tenantBalance) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="remark" :label="$t('fundFlowPage.colRemark')" min-width="120" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.remark || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('fundFlowPage.colDetail')" align="center" width="90">
            <template slot-scope="scope">
              <el-popover
                placement="left"
                trigger="hover"
                popper-class="detail-popover"
                @show="handleDetailShow(scope.row)"
              >
                <div class="detail-content" v-loading="scope.row.detailLoading">
                  <template v-if="scope.row.detailData">
                    <div class="detail-header">
                      <div class="header-item">{{ $t('fundFlowPage.detailColAmount') }}</div>
                      <div class="header-item">{{ $t('fundFlowPage.detailColDeductSub') }}</div>
                      <div class="header-item">{{ $t('fundFlowPage.detailColCashSub') }}</div>
                    </div>
                    <div v-for="(item, index) in scope.row.detailData.rows" :key="'row-' + index">
                      <div v-if="index > 0" class="detail-divider"></div>
                      <div class="detail-section">
                        <div class="detail-row">
                          <div class="row-item">
                            <template v-if="index === 0">
                              <div class="label">{{ getAmountActionLabel(scope.row) }}:</div>
                              <div class="value">{{ formatDetailAmount(scope.row.amount) }}</div>
                            </template>
                            <template v-else>
                              <div class="label">--</div>
                              <div class="value"></div>
                            </template>
                          </div>
                          <div class="row-item">
                            <div class="label">{{ getSubAccountActionLabel(item.deductSubAccount) }}:</div>
                            <div class="value">{{ formatDetailAmount(item.deductSubAccount) }}</div>
                          </div>
                          <div class="row-item">
                            <template v-if="index === 0 && item.deductCashAccount !== null">
                              <div class="label">{{ getSubAccountActionLabel(item.deductCashAccount) }}:</div>
                              <div class="value">{{ formatDetailAmount(item.deductCashAccount) }}</div>
                            </template>
                            <template v-else>
                              <div class="label">--</div>
                              <div class="value"></div>
                            </template>
                          </div>
                        </div>

                        <div class="detail-row">
                          <div class="row-item">
                            <template v-if="index === 0">
                              <div class="label">{{ $t('fundFlowPage.detailRemain') }}:</div>
                              <div class="value">{{ formatBalance(scope.row.tenantBalance) }}</div>
                            </template>
                            <template v-else>
                              <div class="label">--</div>
                              <div class="value"></div>
                            </template>
                          </div>
                          <div class="row-item">
                            <div class="label">{{ $t('fundFlowPage.detailRemain') }}:</div>
                            <div class="value">{{ formatBalance(item.remainSubAccount) }}</div>
                          </div>
                          <div class="row-item">
                            <template v-if="index === 0 && item.remainCashAccount !== null">
                              <div class="label">{{ $t('fundFlowPage.detailRemain') }}:</div>
                              <div class="value">{{ formatBalance(item.remainCashAccount) }}</div>
                            </template>
                            <template v-else>
                              <div class="label">--</div>
                              <div class="value"></div>
                            </template>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <div v-else class="detail-empty">{{ $t('fundFlowPage.detailEmpty') }}</div>
                </div>
                <el-button slot="reference" type="text" size="small" class="detail-btn op-btn primary-btn">{{ $t('fundFlowPage.btnViewDetail') }}</el-button>
              </el-popover>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container compact-pagination">
          <el-pagination
            @size-change="handleTurnoverSizeChange"
            @current-change="handleTurnoverCurrentChange"
            :current-page="turnoverForm.page.current"
            :page-sizes="[15, 30, 50, 100, 300]"
            :page-size="turnoverForm.page.size"
            :total="turnoverTotal"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getTurnoverList, selectDiscRealTurnoverList } from '@/api/tenantDetail'
import { getSimpleTenantList } from '@/api/useReport'
import { tenantRetainStatis } from '@/api/newDashboard'
import * as XLSX from 'xlsx'

const EXPORT_ALL_LIMIT = 2000

export default {
  name: 'FundFlow',
  data () {
    return {
      sortOrder: 'default',
      activeTab: 'electric',
      selectedTenantId: null,
      selectedChannel: null,
      tenantLoading: false,
      tenantOptions: [],
      turnoverForm: {
        managerId: '',
        specialJump: '',
        tenantName: '',
        channelList: [],
        operate: '',
        endDate: '',
        startDate: '',
        tenantIdList: [],
        bizType: 1,
        page: {
          current: 1,
          size: 15,
          orders: [{ asc: false, column: 'createTime' }]
        }
      },
      turnoverDateRange: [],
      turnoverList: [],
      turnoverTotal: 0,
      turnoverLoading: false,
      exportLoading: false,
      selectedData: [],
      summaryValues: {
        cash: null,
        elec: null,
        water: null
      },
      detailDataCache: {}
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    cashTotal () {
      return this.formatSummaryValue(this.summaryValues.cash)
    },
    discountTotal () {
      return this.formatSummaryValue(this.summaryValues.elec)
    },
    subsidyTotal () {
      return this.formatSummaryValue(this.summaryValues.water)
    },
    localeKey () {
      return this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'zh-CN'
    },
    datePickerOptions () {
      const t = (key) => this.$t(`fundFlowPage.${key}`)
      return {
        shortcuts: [
          {
            text: t('shortcut7'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 6)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: t('shortcut15'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 14)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: t('shortcut30'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      }
    },
    channelOptions () {
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((value) => ({
        value,
        label: this.$t(`fundFlowPage.channelVal${value}`)
      }))
    }
  },
  watch: {
    currentManagerId: {
      handler (newVal) {
        if (!newVal) return
        this.turnoverForm.managerId = newVal
        this.loadTenantOptions()
        this.fetchRetainSummary()
        this.fetchTurnoverData()
      },
      immediate: true
    }
  },
  mounted () {
    this.initFormData()
    this.loadTenantOptions()
  },
  methods: {
    initFormData () {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      this.turnoverForm.managerId = this.$route.query.managerId || this.currentManagerId || ''
      this.turnoverForm.endDate = endDate
      this.turnoverForm.startDate = startDate
      this.turnoverDateRange = [startDate, endDate]
    },

    handleToolbarSearch () {
      this.turnoverForm.page.current = 1
      this.fetchTurnoverData()
      this.fetchRetainSummary()
    },

    handleToolbarReset () {
      this.selectedTenantId = null
      this.selectedChannel = null
      this.turnoverForm.tenantIdList = []
      this.turnoverForm.tenantName = ''
      this.turnoverForm.channelList = []
      this.turnoverForm.page.current = 1
      this.initFormData()
      if (this.turnoverForm.managerId) {
        this.turnoverForm.startDate = this.turnoverDateRange[0]
        this.turnoverForm.endDate = this.turnoverDateRange[1]
      }
      this.fetchTurnoverData()
      this.fetchRetainSummary()
    },

    switchTab (tab) {
      if (this.activeTab === tab) return
      this.activeTab = tab
      this.turnoverForm.bizType = tab === 'electric' ? 1 : 2
      this.turnoverForm.page.current = 1
      this.detailDataCache = {}
      this.fetchTurnoverData()
    },
    async fetchTurnoverData () {
      if (!this.turnoverForm.managerId) return
      this.turnoverLoading = true
      try {
        const response = await getTurnoverList(this.turnoverForm)
        if (response.code === 200) {
          this.turnoverList = response.data.dataList || []
          this.turnoverTotal = response.data.total || 0
        }
      } catch (error) {
        console.error('获取流水数据失败:', error)
        this.$apiError.notify(error, this.$t('fundFlowPage.msgFetchFail'))
      } finally {
        this.turnoverLoading = false
      }
    },
    async fetchRetainSummary () {
      if (!this.turnoverForm.managerId) {
        this.summaryValues = { cash: null, elec: null, water: null }
        return
      }
      try {
        const res = await tenantRetainStatis({
          managerId: this.turnoverForm.managerId
        }).catch(() => null)
        if (!res || res.code !== 200) {
          this.summaryValues = { cash: null, elec: null, water: null }
          return
        }
        const dto = res.data || {}
        const totalRetainAmt = Number(dto.totalRetainAmt)
        const elecRetainAmt = Number(dto.elecRetainAmt)
        const waterRetainAmt = Number(dto.waterRetainAmt)
        this.summaryValues = {
          cash: Number.isFinite(totalRetainAmt) ? totalRetainAmt : null,
          elec: Number.isFinite(elecRetainAmt) ? elecRetainAmt : null,
          water: Number.isFinite(waterRetainAmt) ? waterRetainAmt : null
        }
      } catch (error) {
        this.summaryValues = { cash: null, elec: null, water: null }
      }
    },
    handleTurnoverDateChange (dateRange) {
      if (dateRange && dateRange.length === 2) {
        this.turnoverForm.startDate = dateRange[0]
        this.turnoverForm.endDate = dateRange[1]
      } else {
        this.turnoverForm.startDate = ''
        this.turnoverForm.endDate = ''
      }
      this.turnoverForm.page.current = 1
      this.fetchTurnoverData()
    },
    handleFilterChange () {
      this.turnoverForm.page.current = 1
      this.fetchTurnoverData()
    },
    async loadTenantOptions () {
      if (!this.currentManagerId) return
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0
        })
        this.tenantOptions = data || []
      } catch (error) {
        this.tenantOptions = []
      } finally {
        this.tenantLoading = false
      }
    },
    handleTenantChange (value) {
      if (value === '' || value === null || value === undefined) {
        this.turnoverForm.tenantIdList = []
        this.turnoverForm.tenantName = ''
      } else {
        this.turnoverForm.tenantIdList = [value]
        const selected = this.tenantOptions.find(item => item.tenantId === value)
        this.turnoverForm.tenantName = selected ? selected.name || '' : ''
      }
      this.handleFilterChange()
    },
    handleChannelChange (value) {
      this.turnoverForm.channelList = value === '' || value === null || value === undefined ? [] : [value]
      this.handleFilterChange()
    },
    exportCurrentPage () {
      if (!this.turnoverForm.managerId) {
        this.$message.warning(this.$t('fundFlowPage.msgNoManagerExport'))
        return
      }
      if (!this.turnoverList.length) {
        this.$message.warning(this.$t('fundFlowPage.msgNoDataExport'))
        return
      }
      this.exportToExcel(this.turnoverList)
      this.notifyExportResult(this.turnoverList.length, null, false)
    },
    exportSelected () {
      if (!this.turnoverForm.managerId) {
        this.$message.warning(this.$t('fundFlowPage.msgNoManagerExport'))
        return
      }
      if (!this.selectedData.length) {
        this.$message.warning(this.$t('fundFlowPage.warnNoSelectedExport'))
        return
      }
      this.exportToExcel(this.selectedData)
      this.notifyExportResult(this.selectedData.length, null, true)
    },
    async exportAll () {
      if (this.exportLoading) return
      if (!this.turnoverForm.managerId) {
        this.$message.warning(this.$t('fundFlowPage.msgNoManagerExport'))
        return
      }
      this.exportLoading = true
      const loading = this.$loading({ lock: true, text: this.$t('fundFlowPage.exporting') })
      try {
        const { rows, total } = await this.fetchAllForExport()
        if (!rows.length) {
          this.$message.warning(this.$t('fundFlowPage.msgNoDataExport'))
          return
        }
        this.exportToExcel(rows)
        this.notifyExportResult(rows.length, total, false)
      } catch (e) {
        console.error('导出流水失败:', e)
        this.$apiError.notify(e, this.$t('fundFlowPage.msgExportFail'))
      } finally {
        loading.close()
        this.exportLoading = false
      }
    },
    handleExportCommand (command) {
      if (command === 'currentPage') this.exportCurrentPage()
      else if (command === 'selected') this.exportSelected()
      else if (command === 'all') this.exportAll()
    },
    handleSelectionChange (selection) {
      this.selectedData = selection
    },
    async fetchAllForExport () {
      const payload = {
        ...this.turnoverForm,
        page: {
          current: 1,
          size: EXPORT_ALL_LIMIT,
          orders: Array.isArray(this.turnoverForm.page.orders) ? this.turnoverForm.page.orders : [{ asc: false, column: 'createTime' }]
        }
      }
      const response = await getTurnoverList(payload)
      if (response.code !== 200 || !response.data) {
        throw new Error(response.msg || this.$t('fundFlowPage.msgFetchFail'))
      }
      return { rows: response.data.dataList || [], total: response.data.total || 0 }
    },
    notifyExportResult (count, total, isSelected) {
      if (isSelected) this.$message.success(this.$t('fundFlowPage.msgExportOkSelected', { count }))
      else if (total != null && total > count) this.$message.success(this.$t('fundFlowPage.successExportedLimit', { count, total }))
      else if (total != null) this.$message.success(this.$t('fundFlowPage.successExported', { count }))
      else this.$message.success(this.$t('fundFlowPage.msgExportOk'))
    },
    async fetchExportRows () {
      const exportPayload = {
        ...this.turnoverForm,
        page: {
          current: this.turnoverForm.page.current,
          size: this.turnoverForm.page.size,
          orders: Array.isArray(this.turnoverForm.page.orders) ? this.turnoverForm.page.orders : [{ asc: false, column: 'createTime' }]
        }
      }
      const response = await getTurnoverList(exportPayload)
      if (response.code !== 200 || !response.data) return []
      return response.data.dataList || []
    },
    exportToExcel (rows) {
      const tabLabel = this.activeTab === 'electric' ? this.$t('fundFlowPage.tabElectric') : this.$t('fundFlowPage.tabWater')
      const tenantLabel = this.selectedTenantId
        ? this.formatTenantOption(this.tenantOptions.find(item => item.tenantId === this.selectedTenantId))
        : this.$t('fundFlowPage.filterAll')
      const channelLabel = this.selectedChannel === '' || this.selectedChannel === null || this.selectedChannel === undefined
        ? this.$t('fundFlowPage.filterAll')
        : this.getChannelLabel(this.selectedChannel)
      const dateLabel = this.turnoverForm.startDate && this.turnoverForm.endDate
        ? `${this.turnoverForm.startDate} - ${this.turnoverForm.endDate}`
        : this.$t('fundFlowPage.filterAll')
      const filterRow = [
        `${this.$t('fundFlowPage.filterRowFlowType')}: ${tabLabel}  |  ${this.$t('fundFlowPage.filterRowDate')}: ${dateLabel}  |  ${this.$t('fundFlowPage.filterRowTenant')}: ${tenantLabel}  |  ${this.$t('fundFlowPage.filterRowChannel')}: ${channelLabel}`
      ]
      const header = [
        this.$t('fundFlowPage.colId'),
        this.$t('fundFlowPage.colCreateTime'),
        this.$t('fundFlowPage.colTenant'),
        this.$t('fundFlowPage.colOperate'),
        this.$t('fundFlowPage.colChannel'),
        this.$t('fundFlowPage.colAmount'),
        this.$t('fundFlowPage.colBalance'),
        this.$t('fundFlowPage.colRemark')
      ]
      const dataRows = rows.map((row) => {
        const amount = Number(row.amount)
        const signedAmount = this.isPositiveAmountSign(row) ? amount : -amount
        return [
          row.id || '',
          row.createTime || '',
          this.formatTenantInfo(row),
          this.getOperateLabel(row.operate),
          this.getChannelLabel(row.channel),
          Number.isFinite(signedAmount) ? signedAmount.toFixed(2) : '',
          this.formatExportNumber(row.tenantBalance),
          row.remark || ''
        ]
      })
      const wsData = [filterRow, [], header, ...dataRows]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = [
        { wch: 22 },
        { wch: 20 },
        { wch: 28 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 24 }
      ]
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, tabLabel)
      const datePart = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '')
      const filename = `${tabLabel}${this.$t('fundFlowPage.exportSuffix')}${datePart}.xlsx`
      XLSX.writeFile(wb, filename)
    },
    formatTenantOptionLabel (tenant) {
      if (!tenant) return '-'
      const id = tenant.tenantId != null ? String(tenant.tenantId) : ''
      const name = tenant.name != null && tenant.name !== '' ? this.$displayBizHybrid(tenant.name) : ''
      if (!id && !name) return '-'
      return name ? `${id} / ${name}` : id
    },
    formatTenantOption (tenant) {
      return this.formatTenantOptionLabel(tenant)
    },
    formatExportNumber (val) {
      const n = Number(val)
      return Number.isFinite(n) ? n.toFixed(2) : ''
    },
    async fetchDetailData (row) {
      if (this.detailDataCache[row.id]) return this.detailDataCache[row.id]
      try {
        const response = await selectDiscRealTurnoverList({
          newOperate: row.operate,
          newChannel: row.channel,
          tenantTurnoverId: row.id
        })
        if (response.code === 200 && response.data && response.data.length > 0) {
          const deductList = response.data.filter((item) => item.type === 0)
          const cashList = response.data.filter((item) => item.type === 1)
          const rows = []
          deductList.forEach((deductItem, index) => {
            rows.push({
              deductSubAccount: deductItem.amount,
              remainSubAccount: deductItem.tenantBalance,
              deductCashAccount: index === 0 && cashList.length > 0 ? cashList[0].amount : null,
              remainCashAccount: index === 0 && cashList.length > 0 ? cashList[0].tenantBalance : null
            })
          })
          if (deductList.length === 0 && cashList.length > 0) {
            rows.push({
              deductSubAccount: null,
              remainSubAccount: null,
              deductCashAccount: cashList[0].amount,
              remainCashAccount: cashList[0].tenantBalance
            })
          }
          if (rows.length === 0) {
            rows.push({
              deductSubAccount: null,
              remainSubAccount: null,
              deductCashAccount: null,
              remainCashAccount: null
            })
          }
          const detailData = { rows }
          this.$set(this.detailDataCache, row.id, detailData)
          return detailData
        }
      } catch (error) {
        console.error('获取明细数据失败:', error)
      }
      return {
        rows: [{ deductSubAccount: null, remainSubAccount: null, deductCashAccount: null, remainCashAccount: null }]
      }
    },
    async handleDetailShow (row) {
      if (row.detailData) return
      this.$set(row, 'detailLoading', true)
      try {
        const detailData = await this.fetchDetailData(row)
        this.$set(row, 'detailData', detailData)
      } finally {
        this.$set(row, 'detailLoading', false)
      }
    },
    handleTurnoverSizeChange (size) {
      this.turnoverForm.page.size = size
      this.turnoverForm.page.current = 1
      this.fetchTurnoverData()
    },
    handleTurnoverCurrentChange (current) {
      this.turnoverForm.page.current = current
      this.fetchTurnoverData()
    },
    /** 与历史 loose 比较一致：接口可能返回数字或字符串 */
    isPositiveAmountSign (row) {
      if (!row) return false
      const op = Number(row.operate)
      const ch = Number(row.channel)
      return op === 1 || (op === 3 && ch === 6)
    },
    getOperateLabel (operate) {
      const keyMap = {
        1: 'operate1',
        2: 'operate2',
        3: 'operate3',
        4: 'operate4',
        5: 'operate5',
        6: 'operate6',
        7: 'operate7'
      }
      const k = keyMap[Number(operate)]
      return k ? this.$t(`fundFlowPage.${k}`) : this.$t('fundFlowPage.operateUnknown')
    },
    getOperateTagType (operate) {
      const typeMap = { 1: 'success', 2: 'warning', 3: 'danger', 4: 'danger', 5: 'info', 6: 'info', 7: 'info' }
      return typeMap[operate] || ''
    },
    getAmountActionLabel (row) {
      if (row.amount === null || row.amount === undefined) return this.$t('fundFlowPage.actionOp')
      const shouldAddMinus = !this.isPositiveAmountSign(row)
      const numAmount = parseFloat(row.amount)
      return (shouldAddMinus ? -numAmount : numAmount) >= 0 ? this.$t('fundFlowPage.actionRecharge') : this.$t('fundFlowPage.actionDeduct')
    },
    getSubAccountActionLabel (amount) {
      if (amount === null || amount === undefined) return '--'
      return parseFloat(amount) >= 0 ? this.$t('fundFlowPage.actionRecharge') : this.$t('fundFlowPage.actionDeduct')
    },
    getChannelLabel (channel) {
      const n = Number(channel)
      if (Number.isFinite(n) && n >= 0 && n <= 11) return this.$t(`fundFlowPage.channelVal${n}`)
      return this.$t('fundFlowPage.channelUnknown')
    },
    formatTenantInfo (row) {
      const id = row.tenantId || ''
      const name = row.tenantName || ''
      if (!id && !name) return '-'
      const displayName = name ? this.$displayBizHybrid(name) : ''
      return `(${id})${displayName}`
    },
    goTenantDetail (row) {
      if (!row || !row.tenantId) return
      this.$router.push({
        path: `/metering/tenant/detail/${row.tenantId}/`
      })
    },
    formatDetailAmount (amount) {
      if (amount === null || amount === undefined) return '--'
      return Math.abs(parseFloat(amount)).toFixed(2)
    },
    formatBalance (balance) {
      if (balance === null || balance === undefined || balance === '') return '--'
      return Number(balance).toFixed(2)
    },
    formatSummaryValue (value) {
      if (!Number.isFinite(Number(value))) return '--'
      return Number(value).toFixed(2)
    }
  }
}
</script>

<style lang="scss" scoped>
.table-page-container.fund-flow-page {
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

/* 业务特有：留存公式卡（白底模块，与列表区分开） */
.fund-flow-summary-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.fund-flow-summary-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: nowrap;
  min-width: 0;
}

.flow-tab-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
}

.flow-tab-item {
  position: relative;
  padding: 8px 18px 10px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: color 0.2s, border-color 0.2s, box-shadow 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: #374151;
    border-color: #c7ddff;
  }

  &.is-active {
    color: #111827;
    font-weight: 700;
    border-color: #1677ff;
    box-shadow: 0 1px 4px rgba(22, 119, 255, 0.12);

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 4px;
      transform: translateX(-50%);
      width: 28px;
      height: 3px;
      border-radius: 999px;
      background: #1677ff;
    }
  }

  .iconfont {
    font-size: 16px;
    color: #1677ff;
  }
}

.formula-card {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  padding: 0;
  flex-shrink: 1;
  min-width: 0;

  .formula-item {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;

    &.main {
      margin-right: 2px;
    }
  }

  .formula-text {
    display: flex;
    flex-direction: column;
    gap: 0;
    align-items: flex-start;
  }

  .formula-label {
    color: #9ca3af;
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
  }

  .formula-op {
    color: #374151;
    font-size: 15px;
    font-weight: 600;
    flex: 0 0 auto;
    width: auto;
    min-width: 14px;
    text-align: center;
    line-height: 1;
    padding: 0 1px;
  }

  .formula-icon {
    font-size: 18px;
    flex-shrink: 0;
    &.elec {
      color: #52c41a;
    }
    &.water {
      color: #1677ff;
    }
  }

  .formula-value {
    color: #111827;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
    min-width: 0;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
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

  .toolbar-right ::v-deep .el-select .el-input__inner {
    height: 32px;
    line-height: 32px;
    font-size: 13px;
    border-radius: 6px;
    border-color: #e4e7ed;
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
  color: #1677ff;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    color: #4096ff;
  }
}

.detail-btn.op-btn.primary-btn {
  color: #1677ff;
  padding: 0;
  font-size: 12px;

  &:hover {
    color: #4096ff;
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

@media (max-width: 1200px) {
  .fund-flow-summary-inner {
    flex-wrap: wrap;
    row-gap: 10px;
  }

  .flow-tab-row {
    flex: 1 1 auto;
    min-width: min-content;
  }

  .formula-card {
    flex: 1 1 100%;
    justify-content: flex-end;
    gap: 5px;

    .formula-value {
      font-size: 16px;
    }

    .formula-label {
      font-size: 10px;
    }
  }
}
</style>

<style lang="scss">
.detail-popover {
  background: rgba(48, 49, 51, 0.95) !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 16px 20px !important;
  min-width: 480px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;

  .popper__arrow {
    display: none !important;
  }

  .detail-content {
    .detail-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .header-item {
        flex: 1;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        font-weight: 500;
      }
    }

    .detail-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 12px 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .row-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;

        .label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .value {
          font-size: 14px;
          color: #fff;
          font-weight: 500;
        }
      }
    }

    .detail-empty {
      text-align: center;
      padding: 20px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 13px;
    }
  }
}
</style>
