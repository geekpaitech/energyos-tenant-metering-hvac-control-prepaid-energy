<template>
  <div class="table-page-container">
    <div class="search-box">
      <el-form
        :model="queryData"
        ref="searchForm"
        class="search-form"
        @submit.native.prevent
        @keyup.enter.native="handleSearch"
      >
        <div class="search-main-grid">
          <div class="field-item">
            <el-date-picker
              v-model="queryData.timeRange"
              type="daterange"
              range-separator="-"
              :start-placeholder="$t('splitBillPage.phDateStart')"
              :end-placeholder="$t('splitBillPage.phDateEnd')"
              value-format="yyyy-MM-dd"
              size="small"
              clearable
              style="width: 100%"
              :picker-options="pickerOptions"
              @change="handleSearch"
              @clear="handleSearch"
            />
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.shareId"
              :placeholder="$t('splitBillPage.phShareGroup')"
              clearable
              filterable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option
                v-for="item in shareList"
                :key="item.id"
                :label="$displayBizHybrid(item.name || '')"
                :value="item.id"
              />
            </el-select>
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.shareType"
              :placeholder="$t('splitBillPage.phShareType')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleShareTypeChange"
            >
              <el-option
                v-for="item in shareTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('splitBillPage.btnSearch') }}</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('splitBillPage.btnReset') }}</el-button>
            <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">{{ $t('splitBillPage.btnExport') }}</el-button>
          </div>
        </div>
      </el-form>
    </div>

    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            {{ $t('splitBillPage.sectionTitle') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-select v-model="sortOrder" size="small" style="width: 100px">
            <el-option :label="$t('splitBillPage.sortDefault')" value="default" />
          </el-select>
        </div>
      </div>

      <div class="list-view">
        <div v-if="selectedData.length > 0" class="table-toolbar">
          <span class="selection-info" v-html="$t('splitBillPage.selectedLine', { count: selectedData.length })" />
        </div>

        <el-table
          v-loading="loading"
          border
          :data="tableData"
          :max-height="tableMaxHeight"
          stripe
          style="width: 100%"
          class="custom-table light-border-table"
          @selection-change="handleSelectionChange"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <el-table-column type="selection" width="55" align="center" />

          <el-table-column
            v-for="col in displayColumns"
            :key="col.key"
            :prop="col.key"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :align="col.align || 'center'"
            :header-align="col.align || 'center'"
            :show-overflow-tooltip="true"
          >
            <template slot-scope="scope">
              <template v-if="col.key === 'rid'">
                <span class="rid-text">{{ scope.row.rid || '-' }}</span>
              </template>

              <template v-else-if="col.key === 'shareName'">
                <el-link type="primary" class="share-name-link">
                  {{ $displayBizHybrid(scope.row.shareName || '') || '-' }}
                </el-link>
              </template>

              <template v-else-if="col.key === 'shareTypeLabel'">
                <el-tag type="info" size="small" effect="plain">
                  {{ scope.row.shareTypeLabel || '-' }}
                </el-tag>
              </template>

              <template v-else-if="col.type === 'money'">
                <span class="amount-text">
                  {{ formatMoney(scope.row[col.key]) }}
                </span>
              </template>

              <template v-else-if="col.type === 'area'">
                <span>{{ formatArea(scope.row[col.key]) }}</span>
              </template>

              <template v-else-if="col.key === 'settleStatus'">
                <el-tag
                  :type="getStatusType(scope.row.settleStatus)"
                  size="small"
                  effect="plain"
                >
                  {{ getStatusLabel(scope.row.settleStatus) }}
                </el-tag>
              </template>

              <template v-else>
                {{ scope.row[col.key] || '-' }}
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('splitBillPage.colAction')" width="120" align="center" fixed="right" :resizable="false">
            <template slot-scope="scope">
              <el-button type="text" size="mini" class="op-btn primary-btn" @click="handleView(scope.row)">
                {{ $t('splitBillPage.btnDetail') }}
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

    <el-drawer
      :title="drawerTitle"
      :visible.sync="detailDrawer.show"
      :size="'50%'"
      :before-close="handleDrawerClose"
    >
      <div class="drawer-content" v-loading="detailDrawer.loading">
        <div v-if="detailDrawer.base" class="drawer-section">
          <el-descriptions :column="2" border>
            <el-descriptions-item :label="$t('splitBillPage.descSettleId')">
              {{ detailDrawer.base.rid }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('splitBillPage.descSettleDate')">
              {{ detailDrawer.base.occurDate }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('splitBillPage.descShareGroupId')">
              {{ detailDrawer.base.shareId }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('splitBillPage.descShareGroupName')">
              {{ $displayBizHybrid(detailDrawer.base.shareName || '') || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('splitBillPage.descTotalAmount')">
              {{ formatMoney(detailDrawer.base.balance) }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('splitBillPage.descTotalArea')">
              {{ formatArea(detailDrawer.base.totalArea) }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('splitBillPage.descSettleStatus')">
              <el-tag
                :type="getStatusType(detailDrawer.base.settleStatus)"
                size="small"
              >
                {{ getStatusLabel(detailDrawer.base.settleStatus) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-divider content-position="left" class="drawer-divider">{{ $t('splitBillPage.dividerDetail') }}</el-divider>

        <el-table
          v-if="detailDrawer.list && detailDrawer.list.length > 0"
          :data="detailDrawer.list"
          border
          stripe
          size="small"
          class="drawer-table"
        >
          <el-table-column type="expand">
            <template slot-scope="props">
              <div class="drawer-expand">
                <el-table
                  :data="props.row.deviceList || []"
                  border
                  size="mini"
                  stripe
                  class="drawer-subtable"
                >
                  <el-table-column prop="id" :label="$t('splitBillPage.colDeviceId')" width="100" />
                  <el-table-column :label="$t('splitBillPage.colDeviceName')" min-width="160" show-overflow-tooltip>
                    <template slot-scope="scope">
                      {{ $displayBizHybrid(scope.row.name || '') || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('splitBillPage.colBindType')" width="100">
                    <template slot-scope="scope">
                      {{ getDeviceTypeLabel(scope.row.type) }}
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('splitBillPage.colUseKwh')" width="120" align="right">
                    <template slot-scope="scope">
                      {{ formatUse(scope.row.use) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="alarm" :label="$t('splitBillPage.colAlarm')" min-width="160" show-overflow-tooltip />
                </el-table>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="$t('splitBillPage.colTenant')" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">
              <div class="tenant-cell">
                <div class="tenant-name">{{ $displayBizHybrid(scope.row.tenantName || '') || '-' }}</div>
                <div class="tenant-id">{{ $t('splitBillPage.tenantIdPrefix') }} {{ scope.row.tenantId || '-' }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="$t('splitBillPage.colShareBalance')" width="140" align="right">
            <template slot-scope="scope">
              {{ formatMoney(scope.row.shareBalance) }}
            </template>
          </el-table-column>

          <el-table-column :label="$t('splitBillPage.colSharePercent')" width="110" align="right">
            <template slot-scope="scope">
              {{ formatPercent(scope.row.sharePercent) }}
            </template>
          </el-table-column>

          <el-table-column :label="$t('splitBillPage.colSumUse')" width="140" align="right">
            <template slot-scope="scope">
              {{ formatUse(scope.row.sumUse) }}
            </template>
          </el-table-column>

          <el-table-column :label="$t('splitBillPage.colArea')" width="120" align="right">
            <template slot-scope="scope">
              {{ formatNumber(scope.row.area) }}
            </template>
          </el-table-column>

          <el-table-column :label="$t('splitBillPage.colDefaultPublicArea')" width="140" align="right">
            <template slot-scope="scope">
              {{ formatNumber(scope.row.defaultPublicArea) }}
            </template>
          </el-table-column>

          <el-table-column prop="alarm" :label="$t('splitBillPage.colAlarm')" min-width="160" show-overflow-tooltip />
        </el-table>

        <el-empty
          v-else-if="!detailDrawer.loading"
          :description="$t('splitBillPage.emptyNoDetail')"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  shareList,
  sharePageSettleShare
} from '@/api/share'

import {
  waterShareList,
  waterSharePageWaterSettleShare,
  getShareFeeDetail
} from '@/api/waterShare'

import { mapGetters } from 'vuex'
import moment from 'moment'
import * as XLSX from 'xlsx'

export default {
  name: 'SplitBillPage',
  data () {
    return {
      sortOrder: 'default',
      pickerOptions: {
        disabledDate (time) {
          return time.getTime() > Date.now()
        }
      },
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68
      },
      queryData: {
        shareId: null,
        shareType: null,
        timeRange: []
      },
      shareList: [],
      columnDefs: [
        { key: 'rid', width: '150', checked: true, disabled: true },
        { key: 'occurDate', width: '150', checked: true },
        { key: 'shareId', width: '120', checked: true },
        { key: 'shareName', minWidth: '180', checked: true, disabled: true },
        { key: 'shareTypeLabel', width: '120', checked: true },
        { key: 'balance', width: '150', checked: true, type: 'money' },
        { key: 'totalArea', width: '150', checked: true, type: 'area' },
        { key: 'settleStatus', width: '120', checked: true }
      ],
      tableData: [],
      loading: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      selectedData: [],
      detailDrawer: {
        show: false,
        base: null,
        list: [],
        loading: false
      },
      settleStatusTypes: {
        0: 'info',
        1: 'success',
        2: 'warning',
        3: 'danger'
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    shareTypeOptions () {
      return [
        { label: this.$t('splitBillPage.shareTypeElec'), value: 1 },
        { label: this.$t('splitBillPage.shareTypeWater'), value: 2 }
      ]
    },
    tableKey () {
      const labelKeyByCol = {
        rid: 'colRid',
        occurDate: 'colOccurDate',
        shareId: 'colShareId',
        shareName: 'colShareName',
        shareTypeLabel: 'colShareType',
        balance: 'colBalance',
        totalArea: 'colTotalArea',
        settleStatus: 'colSettleStatus'
      }
      return this.columnDefs.map((col) => ({
        ...col,
        label: this.$t(`splitBillPage.${labelKeyByCol[col.key]}`)
      }))
    },
    displayColumns () {
      return this.tableKey.filter((col) => col.checked !== false)
    },
    tableMaxHeight () {
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    },
    drawerTitle () {
      const st = this.queryData.shareType
      if (st === 1) return this.$t('splitBillPage.drawerTitleElec')
      if (st === 2) return this.$t('splitBillPage.drawerTitleWater')
      return this.$t('splitBillPage.drawerTitleAll')
    }
  },
  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.initDefaultTimeRange()
          this.getShareList()
          this.fetchTableData()
        }
      },
      immediate: true
    }
  },
  methods: {
    normalizeSelect (v) {
      if (v === null || v === undefined) return ''
      return v
    },

    initDefaultTimeRange () {
      if (!this.queryData.timeRange || this.queryData.timeRange.length !== 2) {
        this.queryData.timeRange = [
          moment().subtract(1, 'months').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ]
      }
    },

    async getShareList () {
      try {
        const params = { managerId: this.currentManagerId }
        const st = this.queryData.shareType

        if (st === null || st === undefined || st === '') {
          const response = await shareList(params)
          this.shareList = response.code === 200 && response.data ? (response.data || []) : []
        } else if (st === 1) {
          const response = await shareList(params)
          this.shareList = response.code === 200 && response.data ? (response.data || []) : []
        } else if (st === 2) {
          const response = await waterShareList(params)
          this.shareList = response.code === 200 && response.data ? (response.data || []) : []
        }
      } catch (error) {
        console.error('获取公摊组列表失败:', error)
        this.$apiError.notify(error, this.$t('splitBillPage.msgShareListFail'))
        this.shareList = []
      }
    },

    async fetchTableData () {
      this.loading = true
      try {
        const shareIdParam = this.normalizeSelect(this.queryData.shareId)
        const tr = this.queryData.timeRange
        const params = {
          managerId: this.currentManagerId,
          shareId: shareIdParam,
          startDate: tr && tr.length > 0 ? tr[0] : '',
          endDate: tr && tr.length > 1 ? tr[1] : '',
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            searchCount: true,
            orders: [{ asc: false, column: 'occurDate' }]
          }
        }

        const st = this.queryData.shareType

        if (st === null || st === undefined || st === '') {
          const [elecResponse, waterResponse] = await Promise.all([
            sharePageSettleShare(params),
            waterSharePageWaterSettleShare(params)
          ])

          let elecData = []
          let waterData = []
          let totalCount = 0

          if (elecResponse.code === 200 && elecResponse.data) {
            elecData = (elecResponse.data.dataList || []).map(item => ({
              ...item,
              shareTypeLabel: this.$t('splitBillPage.shareTypeElec')
            }))
            totalCount += elecResponse.data.total || 0
          }

          if (waterResponse.code === 200 && waterResponse.data) {
            waterData = (waterResponse.data.dataList || []).map(item => ({
              ...item,
              shareTypeLabel: this.$t('splitBillPage.shareTypeWater')
            }))
            totalCount += waterResponse.data.total || 0
          }

          this.tableData = [...elecData, ...waterData].sort((a, b) => {
            return new Date(b.occurDate) - new Date(a.occurDate)
          })

          const startIndex = (this.pageData.current - 1) * this.pageData.size
          const endIndex = startIndex + this.pageData.size
          this.tableData = this.tableData.slice(startIndex, endIndex)
          this.pageData.total = totalCount
        } else if (st === 1) {
          const response = await sharePageSettleShare(params)
          if (response.code === 200 && response.data) {
            this.tableData = (response.data.dataList || []).map(item => ({
              ...item,
              shareTypeLabel: this.$t('splitBillPage.shareTypeElec')
            }))
            this.pageData.total = response.data.total || 0
          } else {
            this.tableData = []
            this.pageData.total = 0
          }
        } else if (st === 2) {
          const response = await waterSharePageWaterSettleShare(params)
          if (response.code === 200 && response.data) {
            this.tableData = (response.data.dataList || []).map(item => ({
              ...item,
              shareTypeLabel: this.$t('splitBillPage.shareTypeWater')
            }))
            this.pageData.total = response.data.total || 0
          } else {
            this.tableData = []
            this.pageData.total = 0
          }
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('splitBillPage.msgFetchFail'))
        console.error('获取公摊账单数据失败:', error)
        this.tableData = []
        this.pageData.total = 0
      } finally {
        this.loading = false
      }
    },

    formatMoney (value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return `¥${parseFloat(value).toFixed(2)}`
    },

    formatArea (value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return `${value}${this.$t('splitBillPage.unitSqm')}`
    },

    getStatusType (status) {
      const key = status != null ? String(status) : ''
      return this.settleStatusTypes[key] || 'info'
    },

    getStatusLabel (status) {
      const keyMap = { 0: 'status0', 1: 'status1', 2: 'status2', 3: 'status3' }
      const sk = status != null ? String(status) : ''
      const i18nKey = keyMap[sk]
      return i18nKey ? this.$t(`splitBillPage.${i18nKey}`) : this.$t('splitBillPage.statusUnknown')
    },

    handleShareTypeChange () {
      this.queryData.shareId = null
      this.getShareList()
      this.handleSearch()
    },

    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleReset () {
      this.queryData = {
        shareId: null,
        shareType: null,
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ]
      }
      this.getShareList()
      this.handleSearch()
    },

    async handleView (row) {
      try {
        this.detailDrawer.show = true
        this.detailDrawer.base = row
        this.detailDrawer.list = []
        this.detailDrawer.loading = true

        const shareFeeId = row && (row.shareFeeId || row.id || row.rid)
        if (!shareFeeId) {
          this.$message.error(this.$t('splitBillPage.msgMissingFeeId'))
          return
        }
        const response = await getShareFeeDetail({ shareFeeId })

        if (response.code === 200) {
          this.detailDrawer.list = Array.isArray(response.data) ? response.data : []
        } else {
          this.$message.error(response.msg || this.$t('splitBillPage.msgDetailFail'))
        }
      } catch (error) {
        console.error('获取详情失败:', error)
        this.$apiError.notify(error, this.$t('splitBillPage.msgDetailFail'))
      } finally {
        this.detailDrawer.loading = false
      }
    },

    handleDrawerClose (done) {
      this.detailDrawer.show = false
      this.detailDrawer.base = null
      this.detailDrawer.list = []
      this.detailDrawer.loading = false
      done()
    },

    formatPercent (value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '-'
      return `${(n * 100).toFixed(2)}%`
    },

    formatUse (value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '-'
      return n.toFixed(2)
    },

    formatNumber (value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '-'
      return n.toFixed(2)
    },

    getDeviceTypeLabel (type) {
      if (type === 1) return this.$t('splitBillPage.deviceTypeDedicated')
      if (type === 2) return this.$t('splitBillPage.deviceTypeShare')
      return this.$t('splitBillPage.deviceTypeDash')
    },

    handleExport () {
      if (this.tableData.length === 0) {
        this.$message.warning(this.$t('splitBillPage.msgNoDataExport'))
        return
      }

      try {
        const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData
        const headers = this.displayColumns.map(col => col.label)
        const data = exportData.map(row => {
          return this.displayColumns.map(col => {
            const value = row[col.key]
            switch (col.key) {
              case 'shareTypeLabel':
                return value || this.$t('splitBillPage.shareTypeShort')
              case 'settleStatus':
                return this.getStatusLabel(value)
              default:
                if (col.type === 'money') {
                  return value ? parseFloat(value).toFixed(2) : '0.00'
                } else if (col.type === 'area') {
                  return value ? `${value}` : '0'
                }
                return value || ''
            }
          })
        })

        const wsData = [headers, ...data]
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        const colWidths = this.displayColumns.map(col => {
          if (col.width) {
            return { wch: Math.max(parseInt(col.width) / 8, col.label.length + 2) }
          } else if (col.minWidth) {
            return { wch: Math.max(parseInt(col.minWidth) / 8, col.label.length + 2) }
          }
          return { wch: Math.max(15, col.label.length + 2) }
        })
        ws['!cols'] = colWidths

        const headerRange = XLSX.utils.decode_range(ws['!ref'])
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
          if (!ws[cellAddress]) continue
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: '606266' } },
            fill: { fgColor: { rgb: 'F5F7FA' } },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, this.$t('splitBillPage.exportSheetName'))
        const fileName = this.generateFileName()
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

        const exportCount = exportData.length
        const isSelectedExport = this.selectedData.length > 0
        this.$message.success(
          isSelectedExport
            ? this.$t('splitBillPage.msgExportOkSelected', { count: exportCount })
            : this.$t('splitBillPage.msgExportOk', { count: exportCount })
        )
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('splitBillPage.msgExportFail'))
      }
    },

    generateFileName () {
      const now = new Date()
      const timeStr =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')

      let typePrefix = this.$t('splitBillPage.filePrefixAll')
      if (this.queryData.shareType === 1) {
        typePrefix = this.$t('splitBillPage.filePrefixElec')
      } else if (this.queryData.shareType === 2) {
        typePrefix = this.$t('splitBillPage.filePrefixWater')
      }

      const sid = this.normalizeSelect(this.queryData.shareId)
      if (sid) {
        const shareItem = this.shareList.find(item => item.id === sid)
        const rawName = shareItem ? String(shareItem.name) : String(sid)
        const shareName = this.$displayBizHybrid(rawName, 200)
        return `${typePrefix}_${shareName}_${timeStr}.xlsx`
      }

      if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
        const startDate = this.queryData.timeRange[0].replace(/-/g, '')
        const endDate = this.queryData.timeRange[1].replace(/-/g, '')
        return `${typePrefix}_${startDate}-${endDate}_${timeStr}.xlsx`
      }

      return `${typePrefix}_${timeStr}.xlsx`
    },

    handleSelectionChange (selection) {
      this.selectedData = selection
    },

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

  .field-item {
    width: 100%;
    min-width: 0;

    ::v-deep .el-input,
    ::v-deep .el-select,
    ::v-deep .el-date-editor {
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

.rid-text {
  color: #1677ff;
  font-weight: 500;
}

.share-name-link {
  font-weight: 500;
}

.amount-text {
  font-weight: 500;
  color: #303133;
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

.drawer-content {
  padding: 20px;

  .el-descriptions {
    margin-top: 8px;
  }
}

.drawer-section {
  margin-bottom: 12px;
}

.drawer-divider {
  margin: 16px 0;
}

.drawer-table {
  width: 100%;
}

.drawer-expand {
  padding: 8px 12px;
  background: #fafbfc;
}

.tenant-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.tenant-name {
  font-weight: 600;
  color: #303133;
}

.tenant-id {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
