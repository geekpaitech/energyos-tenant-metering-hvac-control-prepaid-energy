<template>
  <div class="table-page-container electricity-adjustment-page">
    <template v-if="canView">
      <div class="search-box">
        <el-form
          :model="queryData"
          ref="searchForm"
          class="search-form"
          @submit.native.prevent
          @keyup.enter.native="handleSearch"
        >
          <!-- 与租户账单闭环一致：时间筛选项首位（同 energyBill / floatingPrice），search-main-grid + search-actions -->
          <div class="search-main-grid">
            <div
              v-for="field in displayBasicFields"
              :key="field.prop"
              class="field-item"
            >
              <el-input
                v-if="field.type === 'input'"
                v-model="queryData[field.prop]"
                :placeholder="field.placeholder"
                clearable
                size="small"
                @blur="handleSearch"
                @clear="handleSearch"
              />
              <el-select
                v-else-if="field.type === 'select'"
                v-model="queryData[field.prop]"
                :placeholder="field.placeholder"
                clearable
                size="small"
                style="width: 100%"
                @change="handleSearch"
              >
                <el-option
                  v-for="item in field.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-date-picker
                v-else-if="field.type === 'datetimerange'"
                v-model="queryData[field.prop]"
                type="datetimerange"
                range-separator="-"
                :start-placeholder="$t('electricityAdjustmentPage.phStartDate')"
                :end-placeholder="$t('electricityAdjustmentPage.phEndDate')"
                value-format="yyyy-MM-dd HH:mm:ss"
                size="small"
                style="width: 100%"
                @change="handleSearch"
                @clear="handleSearch"
              />
            </div>

            <div class="field-item field-spacer" aria-hidden="true">
              <span class="field-spacer-inner" />
            </div>

            <div class="search-actions">
              <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">
                {{ $t('electricityAdjustmentPage.btnSearch') }}
              </el-button>
              <el-button size="small" icon="el-icon-refresh" @click="handleReset">
                {{ $t('electricityAdjustmentPage.btnReset') }}
              </el-button>
              <el-dropdown
                v-if="canOperate"
                trigger="hover"
                @command="handleExportCommand"
              >
                <el-button type="success" size="small" icon="el-icon-download">
                  {{ $t('electricityAdjustmentPage.btnExport') }}<i class="el-icon-arrow-down el-icon--right" />
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="currentPage">{{ $t('electricityAdjustmentPage.exportCurrentPage') }}</el-dropdown-item>
                  <el-dropdown-item command="selected">{{ $t('electricityAdjustmentPage.exportSelected') }}</el-dropdown-item>
                  <el-dropdown-item command="all">{{ $t('electricityAdjustmentPage.exportAll') }}</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
        </el-form>
      </div>

      <div class="content-box">
        <div class="content-toolbar ea-toolbar">
          <div class="toolbar-left">
            <span class="section-title">
              <span class="title-bar" />
              {{ $t('electricityAdjustmentPage.sectionTitle') }}
            </span>
          </div>
        </div>

        <div class="list-view ea-list-view">
          <div v-if="canOperate && selectedData.length > 0" class="table-toolbar">
            <span class="selection-info">
              <template v-if="selectionCountFirst">
                <span class="count">{{ selectedData.length }}</span>{{ $t('electricityAdjustmentPage.selectionAfter') }}
              </template>
              <template v-else>
                {{ $t('electricityAdjustmentPage.selectionBefore') }}<span class="count">{{ selectedData.length }}</span>{{ $t('electricityAdjustmentPage.selectionAfter') }}
              </template>
            </span>
          </div>

          <el-table
            ref="table"
            v-loading="loading"
            :data="tableData"
            row-key="rid"
            :max-height="tableMaxHeight"
            border
            stripe
            class="ea-table light-border-table"
            style="width: 100%"
            @selection-change="handleSelectionChange"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <template slot="empty">
              <el-empty :description="$t('electricityAdjustmentPage.emptyTable')" />
            </template>

            <el-table-column v-if="canOperate" type="selection" width="55" align="center" reserve-selection />

            <el-table-column
              :label="$t('electricityAdjustmentPage.colRid')"
              prop="rid"
              width="100"
              align="center"
            />

            <el-table-column
              :label="$t('electricityAdjustmentPage.colMeter')"
              align="center"
              min-width="200"
            >
              <template slot-scope="scope">
                {{ $displayBizHybrid(scope.row.meterName || '') }}({{ scope.row.meterId }})
              </template>
            </el-table-column>

            <el-table-column
              :label="$t('electricityAdjustmentPage.colSerial')"
              prop="serial"
              align="center"
              width="150"
            />

            <el-table-column
              :label="$t('electricityAdjustmentPage.colPricePlan')"
              align="center"
              width="240"
            >
              <template slot-scope="scope">
                {{ $displayBizHybrid(scope.row.priceName || '') }}({{ scope.row.priceId }})
              </template>
            </el-table-column>

            <el-table-column
              :label="$t('electricityAdjustmentPage.colPrices')"
              align="center"
              width="210"
            >
              <template slot-scope="scope">
                {{ scope.row.powerPeakPrice }}/{{ scope.row.powerTopPrice }}/{{
                  scope.row.powerFlatPrice
                }}/{{ scope.row.powerValleyPrice }}
              </template>
            </el-table-column>

            <el-table-column
              :label="$t('electricityAdjustmentPage.colTime')"
              prop="occurTime"
              align="center"
              width="160"
            />

            <el-table-column
              :label="$t('electricityAdjustmentPage.colResult')"
              align="center"
              width="120"
            >
              <template slot-scope="scope">
                <el-tag
                  v-if="scope.row.result === 'SUCCESS'"
                  type="success"
                  size="small"
                >
                  {{ $t('electricityAdjustmentPage.resultSuccess') }}
                </el-tag>
                <el-tag
                  v-else-if="scope.row.result === 'FAIL'"
                  type="danger"
                  size="small"
                >
                  {{ $t('electricityAdjustmentPage.resultFail') }}
                </el-tag>
                <el-tag
                  v-else
                  type="info"
                  size="small"
                >
                  {{ $t('electricityAdjustmentPage.resultExpired') }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              :label="$t('electricityAdjustmentPage.colAction')"
              width="160"
              fixed="right"
              align="center"
            >
              <template slot-scope="scope">
                <div class="adjustment-action-cell">
                  <template v-if="scope.row.result === 'FAIL'">
                    <el-button type="text" size="mini" @click="handleDetail(scope.row)">{{ $t('electricityAdjustmentPage.btnDetail') }}</el-button>
                    <el-button
                      v-if="canOperate"
                      type="text"
                      size="mini"
                      class="action-retry"
                      @click="handleRetry(scope.row)"
                    >
                      {{ $t('electricityAdjustmentPage.btnRetry') }}
                    </el-button>
                  </template>
                  <template v-else>
                    <el-button type="text" size="mini" @click="handleDetail(scope.row)">{{ $t('electricityAdjustmentPage.btnDetail') }}</el-button>
                  </template>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="tableData.length > 0" class="pagination-container compact-pagination">
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

    <!-- 详情弹窗 -->
    <el-dialog
      :title="$t('electricityAdjustmentPage.dialogDetailTitle')"
      :visible.sync="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <div slot="title">
        {{ $t('electricityAdjustmentPage.dialogDetailTitle') }}
      </div>
      <div class="dialog-content">
        <el-form label-width="100px">
          <el-form-item :label="$t('electricityAdjustmentPage.labelOpDesc')">
            {{ detailMessageDisplay }}
          </el-form-item>
          <el-form-item :label="$t('electricityAdjustmentPage.labelRemark')">
            {{ detailCommentDisplay }}
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('electricityAdjustmentPage.btnClose') }}</el-button>
      </span>
    </el-dialog>
    </template>
    <el-empty v-else :description="$t('electricityAdjustmentPage.emptyNoPermission')" />
  </div>
</template>

<script>
// 导入API
import {
  priceModifyRecordPageRecord,
  priceModifyRecordRetryModify
} from '@/api/priceModifyRecord'

import { mapGetters } from 'vuex'
import moment from 'moment'
import * as XLSX from 'xlsx'

// 导出全部单次上限（与电表页一致）
const EXPORT_ALL_LIMIT = 2000

export default {
  name: 'ElectricityAdjustmentPage',
  data () {
    return {
      // 表格高度配置
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68
      },

      // 查询参数
      queryData: {
        result: '',
        serial: '',
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD') + ' 00:00:00',
          moment().format('YYYY-MM-DD') + ' 23:59:59'
        ],
        managerId: ''
      },

      // 表格数据
      tableData: [],
      // 选中的数据
      selectedData: [],
      // 导出全部遮罩防重
      exportAllLoading: false,
      // 加载状态
      loading: false,

      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },

      // 详情弹窗
      dialogVisible: false,
      detailData: {
        message: '',
        comment: ''
      }
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map(v => String(v)))
      return menuNo => allow.has(String(menuNo))
    },
    canOperate () {
      return this.hasKztPermission('660080')
    },
    canView () {
      return this.hasKztPermission('660081')
    },

    selectionCountFirst () {
      return this.$i18n.locale === 'en'
    },

    detailMessageDisplay () {
      const m = this.detailData.message
      if (m == null || String(m).trim() === '') return '-'
      return this.$displayBizHybrid(String(m)) || '-'
    },

    detailCommentDisplay () {
      const c = this.detailData.comment
      if (c == null || String(c).trim() === '') return '-'
      return this.$displayBizHybrid(String(c)) || '-'
    },

    displayBasicFields () {
      return [
        {
          prop: 'timeRange',
          type: 'datetimerange',
          placeholder: ''
        },
        {
          prop: 'result',
          type: 'select',
          placeholder: this.$t('electricityAdjustmentPage.phResult'),
          options: [
            { value: '', label: this.$t('electricityAdjustmentPage.optAll') },
            { value: 'SUCCESS', label: this.$t('electricityAdjustmentPage.optSuccess') },
            { value: 'FAIL', label: this.$t('electricityAdjustmentPage.optFail') }
          ]
        },
        {
          prop: 'serial',
          type: 'input',
          placeholder: this.$t('electricityAdjustmentPage.phSerial')
        }
      ]
    },

    // 数据长度
    dataLength () {
      return this.tableData.length
    },

    // 动态计算表格高度
    tableMaxHeight () {
      // 始终返回最大高度（9行 + 表头）
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    }
  },

  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal && this.canView) {
          this.queryData.managerId = newVal
          this.fetchTableData()
        }
      },
      immediate: true
    },
    canView: {
      handler (val) {
        if (val && this.currentManagerId) {
          this.queryData.managerId = this.currentManagerId
          this.fetchTableData()
        }
      },
      immediate: true
    }
  },

  created () {
    // 埋点统计
    if (this.$store.dispatch) {
      this.$store.dispatch('methods/buriedPoint', '调价日志')
    }
  },

  methods: {
    // 获取表格数据
    async fetchTableData () {
      if (!this.canView) return
      this.loading = true
      try {
        // 处理时间范围参数
        let startDateTime = ''
        let endDateTime = ''
        if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
          startDateTime = this.queryData.timeRange[0]
          endDateTime = this.queryData.timeRange[1]
        }

        const params = {
          managerId: this.queryData.managerId,
          serial: this.queryData.serial,
          startDateTime,
          endDateTime,
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            searchCount: true,
            orders: [
              {
                asc: false,
                column: 'occurTime'
              }
            ]
          }
        }

        // 添加改价结果筛选
        if (this.queryData.result && this.queryData.result !== '') {
          params.result = this.queryData.result
        }

        const response = await priceModifyRecordPageRecord(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || this.$t('electricityAdjustmentPage.msgLoadFail'))
          this.tableData = []
          this.pageData.total = 0
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('electricityAdjustmentPage.msgFetchFail'))
        console.error('获取调价记录失败:', error)
        this.tableData = []
        this.pageData.total = 0
      } finally {
        this.loading = false
      }
    },

    // 查询
    handleSearch () {
      if (!this.canView) return
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset () {
      if (!this.canView) return
      this.queryData = {
        result: '',
        serial: '',
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD') + ' 00:00:00',
          moment().format('YYYY-MM-DD') + ' 23:59:59'
        ],
        managerId: this.currentManagerId || ''
      }
      this.handleSearch()
    },

    // 查看详情
    handleDetail (row) {
      try {
        const resultDesc = row.resultDesc ? JSON.parse(row.resultDesc) : {}
        this.detailData = {
          message: resultDesc.msg || this.$t('electricityAdjustmentPage.detailNoDesc'),
          comment: row.comment || '-'
        }
      } catch (error) {
        this.detailData = {
          message: this.$t('electricityAdjustmentPage.detailParseFail'),
          comment: row.comment || '-'
        }
      }
      this.dialogVisible = true
    },

    // 重试改价
    async handleRetry (row) {
      if (!this.canOperate) {
        this.$message.warning(this.$t('electricityAdjustmentPage.msgNoOperate'))
        return
      }
      try {
        await this.$confirm(this.$t('electricityAdjustmentPage.confirmRetry'), this.$t('electricityAdjustmentPage.titleTip'), {
          confirmButtonText: this.$t('electricityAdjustmentPage.btnOk'),
          cancelButtonText: this.$t('electricityAdjustmentPage.btnCancel'),
          type: 'warning'
        })

        const response = await priceModifyRecordRetryModify({
          rid: row.rid
        })

        if (response.code === 200) {
          if (response.data && response.data.result === 'SUCCESS') {
            this.$message.success(response.msg || this.$t('electricityAdjustmentPage.msgRetryOk'))
          } else {
            this.$message.error(this.$t('electricityAdjustmentPage.msgOpFail'))
          }
        } else {
          this.$message.error(response.msg || this.$t('electricityAdjustmentPage.msgRetryFail'))
        }

        // 刷新数据
        this.fetchTableData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(this.$t('electricityAdjustmentPage.msgRetryError'))
          console.error('重试失败:', error)
        }
      }
    },

    // 选择变化
    handleSelectionChange (selection) {
      this.selectedData = selection
    },

    // 导出数据
    // XLSX 生成（导出本页 / 导出选中 / 导出全部 共用）
    buildXlsx (exportData, isSelected, total) {
      const t = this.$t.bind(this.$t)
      const headers = [
        t('electricityAdjustmentPage.colRid'),
        t('electricityAdjustmentPage.colMeter'),
        t('electricityAdjustmentPage.colSerial'),
        t('electricityAdjustmentPage.colPricePlan'),
        t('electricityAdjustmentPage.colPrices'),
        t('electricityAdjustmentPage.colTime'),
        t('electricityAdjustmentPage.colResult')
      ]
      const data = exportData.map(row => {
        const meterName = this.$displayBizHybrid(row.meterName || '')
        const priceName = this.$displayBizHybrid(row.priceName || '')
        let resultLabel = t('electricityAdjustmentPage.resultExpired')
        if (row.result === 'SUCCESS') resultLabel = t('electricityAdjustmentPage.resultSuccess')
        else if (row.result === 'FAIL') resultLabel = t('electricityAdjustmentPage.resultFail')
        return [
          row.rid || '',
          `${meterName}(${row.meterId || ''})`,
          row.serial || '',
          `${priceName}(${row.priceId || ''})`,
          `${row.powerPeakPrice ?? ''}/${row.powerTopPrice ?? ''}/${row.powerFlatPrice ?? ''}/${row.powerValleyPrice ?? ''}`,
          row.occurTime || '',
          resultLabel
        ]
      })

      // 创建工作表数据
      const wsData = [headers, ...data]

      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // 设置列宽
      const colWidths = headers.map((h, i) => {
        const contentLen = data.reduce((m, r) => Math.max(m, String(r[i] == null ? '' : r[i]).length), 0)
        return { wch: Math.max(h.length + 2, contentLen + 2, 12) }
      })
      ws['!cols'] = colWidths

      // 创建工作簿
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, t('electricityAdjustmentPage.exportSheetName'))

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

      const exportCount = exportData.length
      let successMsg
      if (isSelected) {
        successMsg = t('electricityAdjustmentPage.msgExportOkSelected', { count: exportCount })
      } else if (total != null && total > exportCount) {
        // 命中数超过 2000 上限：只导出前 2000 条并提示（与电表页一致）
        successMsg = t('electricityAdjustmentPage.successExportedLimit', { count: exportCount, total })
      } else if (total != null) {
        successMsg = t('electricityAdjustmentPage.successExported', { count: exportCount })
      } else {
        successMsg = t('electricityAdjustmentPage.msgExportOk', { count: exportCount })
      }
      this.$message.success(successMsg)
    },

    // 导出本页
    exportCurrentPage () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('electricityAdjustmentPage.msgNoOperate'))
        return
      }
      if (this.tableData.length === 0) {
        this.$message.warning(this.$t('electricityAdjustmentPage.msgNoDataExport'))
        return
      }
      this.buildXlsx(this.tableData, false, null)
    },

    // 导出选中
    exportSelected () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('electricityAdjustmentPage.msgNoOperate'))
        return
      }
      if (this.selectedData.length === 0) {
        this.$message.warning(this.$t('electricityAdjustmentPage.warnNoSelectedExport'))
        return
      }
      this.buildXlsx(this.selectedData, true, null)
    },

    // 导出全部：按当前查询条件重新拉取，封顶 2000 条
    async exportAll () {
      if (this.exportAllLoading) return
      this.exportAllLoading = true
      const loading = this.$loading({ lock: true, text: this.$t('electricityAdjustmentPage.exporting') })
      try {
        const { rows, total } = await this.fetchAllForExport()
        if (!rows.length) {
          this.$message.warning(this.$t('electricityAdjustmentPage.msgNoDataExport'))
          return
        }
        this.buildXlsx(rows, false, total)
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('electricityAdjustmentPage.msgExportFail'))
      } finally {
        loading.close()
        this.exportAllLoading = false
      }
    },

    handleExportCommand (command) {
      if (command === 'currentPage') this.exportCurrentPage()
      else if (command === 'selected') this.exportSelected()
      else if (command === 'all') this.exportAll()
    },

    // 按查询条件拉取全部（封顶 EXPORT_ALL_LIMIT）
    async fetchAllForExport () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('electricityAdjustmentPage.msgNoOperate'))
        return { rows: [], total: 0 }
      }
      let startDateTime = ''
      let endDateTime = ''
      if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
        startDateTime = this.queryData.timeRange[0]
        endDateTime = this.queryData.timeRange[1]
      }
      const params = {
        managerId: this.queryData.managerId,
        serial: this.queryData.serial,
        startDateTime,
        endDateTime,
        page: {
          size: EXPORT_ALL_LIMIT,
          current: 1,
          searchCount: true,
          orders: [
            {
              asc: false,
              column: 'occurTime'
            }
          ]
        }
      }
      if (this.queryData.result && this.queryData.result !== '') {
        params.result = this.queryData.result
      }
      const response = await priceModifyRecordPageRecord(params)
      if (response.code !== 200) {
        this.$message.error(response.msg || this.$t('electricityAdjustmentPage.msgFetchFail'))
        return { rows: [], total: 0 }
      }
      return {
        rows: response.data?.dataList || [],
        total: response.data?.total || 0
      }
    },

    generateFileName () {
      const prefix = this.$t('electricityAdjustmentPage.filePrefix')
      const timeStr = moment().format('YYYYMMDD_HHmmss')
      return `${prefix}_${timeStr}.xlsx`
    },

    // 分页大小变化
    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 当前页变化
    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    }
  }
}
</script>

<style lang="scss" scoped>
/* 列表区与租户闭环页 /metering/bill/floating-price-tenant、/metering/bill/energy-bill-tenant 对齐（floatingPrice.vue / energyBill.vue） */
.table-page-container.electricity-adjustment-page {
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

    &.field-spacer {
      visibility: hidden;
      pointer-events: none;

      .field-spacer-inner {
        display: block;
        height: 32px;
      }
    }

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
    grid-column: 5;
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

.content-toolbar.ea-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 8px 12px;

  .toolbar-left {
    min-width: 0;
  }

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

.list-view.ea-list-view {
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

.ea-table.light-border-table {
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

.adjustment-action-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;

  ::v-deep .el-button--text {
    color: #1677ff;
    padding: 0 4px;

    &:hover {
      color: #4096ff;
    }
  }

  ::v-deep .action-retry.el-button--text {
    color: #e6a23c;

    &:hover {
      color: #cf9236;
    }
  }
}

/* 弹窗：class 在 .el-dialog 根节点上，需直接命中 .el-dialog.custom-dialog */
::v-deep .el-dialog.custom-dialog {
  border-radius: 8px;

  .el-dialog__header {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    background-color: #fafbfc;
    border-radius: 8px 8px 0 0;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }

    .el-dialog__headerbtn {
      top: 16px;
      right: 20px;
    }
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 16px 20px;
    border-top: 1px solid #ebeef5;
    background-color: #fafbfc;
    border-radius: 0 0 8px 8px;

    .dialog-footer {
      text-align: right;

      .el-button {
        min-width: 80px;
      }
    }
  }
}

.pagination-container.compact-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 14px 0 4px;

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
</style>
