<template>
  <div class="equipment-power-dashboard">
    <!-- 筛选器 -->
    <div class="filter-container">
      <!-- 统计时间 -->
      <div class="filter-item date-filter">
        <label class="filter-label">统计时间</label>
        <el-date-picker v-model="queryParams.dateRange" type="daterange" format="yyyy-MM-dd" value-format="yyyy-MM-dd"
          range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" :picker-options="pickerOptions"
          class="custom-date-picker" @change="handleDateRangeChange" />
      </div>

      <!-- 租户选择 -->
      <div class="filter-item tenant-filter">
        <label class="filter-label">选择租户</label>
        <el-select v-model="queryParams.tenantId" filterable placeholder="请选择租户" class="custom-select"
          :loading="tenantLoading" clearable @change="handleTenantChange">

          <el-option v-for="tenant in tenantList" :key="tenant.tenantId" :label="tenant.name"
            :value="tenant.tenantId" />
        </el-select>
      </div>

      <!-- 电表选择 -->
      <div class="filter-item meter-filter">
        <label class="filter-label">选择电表</label>
        <el-select ref="meterSelect" v-model="queryParams.meterQuery" filterable placeholder="请输入序列号或选择电表"
          class="custom-select" :loading="meterLoading" clearable @change="handleMeterChange">
          <!-- <el-option label="全部" :value="''" /> -->
          <el-option v-for="meter in meterList" :key="meter.serial" :label="`${meter.meterName} (${meter.serial})`"
            :value="meter.serial">
            <span style="float: left">{{ meter.meterName }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">{{ meter.serial }}</span>
          </el-option>
        </el-select>
      </div>

      <div class="filter-actions">
        <button class="export-btn" @click="handleExport" :disabled="exportLoading || tableData.length === 0">
          <svg v-if="!exportLoading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span v-if="exportLoading">导出中...</span>
          <span v-else>导出报表</span>
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content" v-loading="loading" :element-loading-text="loadingText">
      <!-- 数据表格区域 -->
      <div class="table-section">
        <div class="section-header">
          <h2 class="section-title">电表用电</h2>
          <div class="section-tip">
            <i class="el-icon-info"></i>
            <span>请选择电表查看详细数据</span>
          </div>
        </div>
        
        <!-- 最大需量统计 -->
        <div class="max-demand-info" v-if="maxDemandInfo">
          <span class="label">最大需量：</span>
          <span class="value">{{ maxDemandInfo.maxDemand }}</span>
          <span class="label" style="margin-left: 30px;">采集时间：</span>
          <span class="value">{{ maxDemandInfo.occurTime }}</span>
        </div>

        <!-- 电表用电表格 -->
        <div class="meter-table-wrapper" v-if="tableData.length > 0">
          <el-table ref="dataTable" :data="tableData" border :max-height="600" class="meter-report-table"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
              textAlign: 'center'
            }" :cell-style="{ textAlign: 'center' }">
            <!-- 基础信息列 -->
            <el-table-column label="电表编号" width="100" prop="meterId" fixed show-overflow-tooltip />
            <el-table-column label="电表名称" min-width="160" prop="meterName" fixed show-overflow-tooltip />
            <el-table-column label="电表序列号" width="140" prop="serial" show-overflow-tooltip />
            <el-table-column label="电表绑定类型" width="120">
              <template slot-scope="scope">
                {{ getBindTypeLabel(scope.row.bindType) }}
              </template>
            </el-table-column>
            <!-- <el-table-column label="绑定ID" width="100" prop="bindId" show-overflow-tooltip /> -->
            <el-table-column label="绑定信息" min-width="200" prop="bindName" show-overflow-tooltip />
            <el-table-column label="日期" width="120" prop="occurDate" />
            
            <!-- 最大需量 -->
            <el-table-column label="最大需量(kW)" width="140">
              <template slot-scope="scope">
                {{ scope.row.maxDemand || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="采集时间" width="160">
              <template slot-scope="scope">
                {{ scope.row.occurTime || '--' }}
              </template>
            </el-table-column>
             

            <!-- 用电统计列 -->
            <el-table-column label="总电费(元)" width="120" align="right">
              <template slot-scope="scope">
                <span style="color: #f56c6c;">
                  {{ formatNumber(scope.row.balance) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="总电量(度)" width="120" align="right">
              <template slot-scope="scope">
                <span style="color: #f56c6c;">
                  {{ formatNumber(scope.row.useElec) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="尖电量(度)" width="120" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.useElecPeak) }}
              </template>
            </el-table-column>
            <el-table-column label="峰电量(度)" width="120" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.useElecTop) }}
              </template>
            </el-table-column>
            <el-table-column label="平电量(度)" width="120" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.useElecFlat) }}
              </template>
            </el-table-column>
            <el-table-column label="谷电量(度)" width="120" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.useElecValley) }}
              </template>
            </el-table-column>

            <!-- 起始读数列组 -->
            <el-table-column label="起始读数" align="center">
              <el-table-column label="时间" width="160">
                <template slot-scope="scope">
                  {{ scope.row.startUseDto ? scope.row.startUseDto.occurTime : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="总电量" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerAll) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="尖" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerPeak) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="峰" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerTop) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="平" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerFlat) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="谷" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.startUseDto ? formatNumber(scope.row.startUseDto.powerValley) : '-' }}
                </template>
              </el-table-column>
            </el-table-column>

            <!-- 截止读数列组 -->
            <el-table-column label="截止读数" align="center">
              <el-table-column label="时间" width="160">
                <template slot-scope="scope">
                  {{ scope.row.stopUseDto ? scope.row.stopUseDto.occurTime : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="总电量" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerAll) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="尖" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerPeak) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="峰" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerTop) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="平" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerFlat) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="谷" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.stopUseDto ? formatNumber(scope.row.stopUseDto.powerValley) : '-' }}
                </template>
              </el-table-column>
            </el-table-column>
          </el-table>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="!loading && tableData.length === 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <p>暂无数据</p>
          <span class="empty-tip">请选择电表序列号或电表后查看数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  getSimpleTenantList,
  getMeterDaySettleList,
  listMeterInfo
} from '@/api/useReport'
import moment from 'moment'
import * as XLSX from 'xlsx'

export default {
  name: 'EquipmentPower',
  data() {
    return {
      queryParams: {
        tenantId: '',
        meterQuery: '',
        dateRange: []
      },
      tenantList: [],
      meterList: [],
      tableData: [],
      tenantLoading: false,
      meterLoading: false,
      loading: false,
      loadingText: '数据加载中...',
      exportLoading: false,
      bindTypeMap: {
        1: '专用表',
        2: '公摊表',
        3: '公式表'
      },
      pickerOptions: {
        shortcuts: [
          {
            text: '最近7天',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 6)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近15天',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 14)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近30天',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '本月',
            onClick(picker) {
              const start = new Date()
              start.setDate(1)
              start.setHours(0, 0, 0, 0)
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '上月',
            onClick(picker) {
              const start = new Date()
              start.setMonth(start.getMonth() - 1)
              start.setDate(1)
              start.setHours(0, 0, 0, 0)
              const end = new Date()
              end.setDate(0)
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          }
        ],
        disabledDate(time) {
          return time.getTime() > Date.now()
        }
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    maxDemandInfo() {
      if (!this.tableData || this.tableData.length === 0) return null
      
      let maxVal = -1
      let maxItem = null
      
      this.tableData.forEach(item => {
        const val = parseFloat(item.maxDemand)
        if (!isNaN(val) && val > maxVal) {
          maxVal = val
          maxItem = item
        }
      })
      
      if (maxItem) {
        return {
          maxDemand: maxItem.maxDemand || '--',
          occurTime: maxItem.occurTime || '--'
        }
      }
      
      return null
    }
  },
  watch: {
    currentManagerId: {
      handler(val) {
        if (val) {
          this.initializeData()
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.initPasteListener()
  },
  beforeDestroy() {
    this.removePasteListener()
  },
  methods: {
    // ==================== 初始化相关 ====================
    async initializeData() {
      // 先设置默认日期
      // this.setDefaultDateRange()

      // 保存路由参数
      const routeSerial = this.$route.query.serial
      const routeStartDate = this.$route.query.startDate
      const routeEndDate = this.$route.query.endDate

      // 如果有日期参数,覆盖默认值
      if (routeStartDate && routeEndDate) {
        this.queryParams.dateRange = [routeStartDate, routeEndDate]
      }

      await this.getTenantList()
      await this.getMeterList()

      // ⭐ 只有当路由参数完整时才自动查询
      if (routeSerial && routeStartDate && routeEndDate) {
        this.queryParams.meterQuery = routeSerial
        await this.fetchData()
      } else if (routeSerial) {
        // 只设置序列号,不查询
        this.queryParams.meterQuery = routeSerial
      }
    },

    setDefaultDateRange() {
      this.queryParams.dateRange = [
        moment().subtract(29, 'days').format('YYYY-MM-DD'),
        moment().format('YYYY-MM-DD')
      ]
    },

    // ==================== 粘贴事件处理 ====================
    initPasteListener() {
      this.$nextTick(() => {
        if (this.$refs.meterSelect && this.$refs.meterSelect.$el) {
          const input = this.$refs.meterSelect.$el.querySelector('input')
          if (input) {
            this.meterInput = input
            input.addEventListener('paste', this.handlePaste)
          }
        }
      })
    },

    removePasteListener() {
      if (this.meterInput) {
        this.meterInput.removeEventListener('paste', this.handlePaste)
      }
    },

    handlePaste(event) {
      event.preventDefault()
      const pastedText = (event.clipboardData || window.clipboardData).getData('text')
      const cleanedText = pastedText.replace(/\s+/g, '')
      this.queryParams.meterQuery = cleanedText

      this.$nextTick(() => {
        if (event.target) {
          event.target.value = cleanedText
          const inputEvent = new Event('input', { bubbles: true })
          event.target.dispatchEvent(inputEvent)
        }
      })
    },

    // ==================== 数据获取 ====================
    async getTenantList() {
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0
        })
        this.tenantList = data || []
      } catch (error) {
        this.$message.error('获取租户列表失败')
        console.error('获取租户列表失败:', error)
      } finally {
        this.tenantLoading = false
      }
    },

    async getMeterList() {
      this.meterLoading = true
      try {
        const params = {
          managerId: this.currentManagerId
        }

        if (this.queryParams.tenantId) {
          params.bindId = this.queryParams.tenantId
          params.bindType = 1
        }

        const { data } = await listMeterInfo(params)
        this.meterList = data || []
      } catch (error) {
        this.$message.error('获取电表列表失败')
        console.error('获取电表列表失败:', error)
      } finally {
        this.meterLoading = false
      }
    },

    async fetchData() {
      // 校验必填项
      if (!this.queryParams.dateRange || this.queryParams.dateRange.length !== 2) {
        this.$message.warning('请选择统计时间')
        return
      }

      // 必须选择电表
      if (!this.queryParams.meterQuery) {
        this.$message.warning('请选择电表')
        return
      }

      this.loading = true
      try {
        const params = {
          managerId: this.currentManagerId,
          serial: this.queryParams.meterQuery,
          startDate: this.queryParams.dateRange[0],
          endDate: this.queryParams.dateRange[1]
        }

        const { data } = await getMeterDaySettleList(params)
        this.tableData = data || []

        if (this.tableData.length === 0) {
          this.$message.info('未查询到数据')
        }
      } catch (error) {
        this.$message.error('获取数据失败')
        console.error('获取数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    // ==================== 筛选器事件处理 ====================
    handleDateRangeChange(val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        // 日期变更时，如果已经选择了电表，则重新查询
        if (this.queryParams.meterQuery) {
          this.fetchData()
        }
      }
    },

    async handleTenantChange() {
      // 租户变更时清空电表选择并重新获取电表列表
      this.queryParams.meterQuery = ''
      this.tableData = []
      await this.getMeterList()
    },

    handleMeterChange() {
      // 电表变更时直接查询
      if (this.queryParams.meterQuery) {
        this.fetchData()
      } else {
        // 清空电表时清空数据
        this.tableData = []
      }
    },

    // ==================== 导出功能 ====================
    handleExport() {
      if (!this.tableData || this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }

      this.exportLoading = true

      setTimeout(() => {
        try {
          this.exportToExcel()
          this.$message.success('导出成功！')
        } catch (error) {
          console.error('导出失败:', error)
          this.$message.error(`导出失败: ${error.message || '请重试'}`)
        } finally {
          this.exportLoading = false
        }
      }, 100)
    },

    exportToExcel() {
      const tenant = this.tenantList.find(t => t.tenantId === this.queryParams.tenantId)
      const tenantName = tenant ? tenant.name : '全部'

      const meter = this.meterList.find(m => m.serial === this.queryParams.meterQuery)
      const meterName = meter ? `${meter.meterName} (${meter.serial})` : this.queryParams.meterQuery

      const filterRow = [
        `统计时间: ${this.queryParams.dateRange[0]} 至 ${this.queryParams.dateRange[1]}  |  租户: ${tenantName}  |  电表: ${meterName}`
      ]

      // 第一行表头
      const header1 = [
        '电表编号', '电表名称', '电表序列号', '电表绑定类型', '绑定ID', '绑定信息', '日期',
        '总电费(元)', '总电量(度)', '尖电量(度)', '峰电量(度)', '平电量(度)', '谷电量(度)',
        '起始读数', '', '', '', '', '',
        '截止读数', '', '', '', '', ''
      ]

      // 第二行表头
      const header2 = [
        '', '', '', '', '', '', '',
        '', '', '', '', '', '',
        '时间', '总电量', '尖', '峰', '平', '谷',
        '时间', '总电量', '尖', '峰', '平', '谷'
      ]

      // 数据行
      const dataRows = this.tableData.map(row => {
        const startDto = row.startUseDto || {}
        const stopDto = row.stopUseDto || {}

        return [
          row.meterId || '',
          row.meterName || '',
          row.serial || '',
          this.getBindTypeLabel(row.bindType),
          row.bindId || '',
          row.bindName || '',
          row.occurDate || '',
          this.formatExportNumber(row.balance),
          this.formatExportNumber(row.useElec),
          this.formatExportNumber(row.useElecPeak),
          this.formatExportNumber(row.useElecTop),
          this.formatExportNumber(row.useElecFlat),
          this.formatExportNumber(row.useElecValley),
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
        ]
      })

      const wsData = [
        filterRow,
        [],
        header1,
        header2,
        ...dataRows
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // 设置列宽
      ws['!cols'] = [
        { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
        { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }
      ]

      // 合并单元格
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 24 } }, // 筛选条件行
        { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },   // 电表编号
        { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },   // 电表名称
        { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },   // 电表序列号
        { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },   // 电表绑定类型
        { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } },   // 绑定ID
        { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } },   // 绑定信息
        { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } },   // 日期
        { s: { r: 2, c: 7 }, e: { r: 3, c: 7 } },   // 总电费
        { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } },   // 总电量
        { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } },   // 尖电量
        { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } }, // 峰电量
        { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } }, // 平电量
        { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } }, // 谷电量
        { s: { r: 2, c: 13 }, e: { r: 2, c: 18 } }, // 起始读数
        { s: { r: 2, c: 19 }, e: { r: 2, c: 24 } }  // 截止读数
      ]

      ws['!merges'] = merges

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '电表用电报表')

      const fileName = this.generateFileName('电表用电报表')
      XLSX.writeFile(wb, fileName)
    },

    generateFileName(prefix) {
      const now = new Date()
      const timeStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')

      return `${prefix}_${timeStr}.xlsx`
    },

    // ==================== 格式化方法 ====================
    formatExportNumber(num) {
      if (num === undefined || num === null || num === '' || num === '-') {
        return 0
      }
      const numValue = typeof num === 'string' ? parseFloat(num) : num
      if (isNaN(numValue)) {
        return 0
      }
      return numValue
    },

    formatNumber(num) {
      if (num === undefined || num === null || num === '') {
        return '0.00'
      }
      return Number(num).toFixed(2)
    },

    getBindTypeLabel(bindType) {
      if (bindType === undefined || bindType === null) return '-'
      return this.bindTypeMap[bindType] || '-'
    }
  }
}
</script>

<style lang="scss" scoped>
.equipment-power-dashboard {
  min-height: 100vh;
  padding: 16px;
  background: #f5f7fa;
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
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 200px;

  &.date-filter {
    max-width: 320px;
  }

  &.tenant-filter,
  &.meter-filter {
    max-width: 360px;
  }
}

.filter-label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;

  .required-mark {
    color: #ef4444;
    margin-left: 2px;
  }
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.export-btn {
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
  background: #10b981;
  color: white;

  svg {
    width: 16px;
    height: 16px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }
}

// 主内容区
.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
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

.section-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;

  i {
    font-size: 14px;
  }
}

.max-demand-info {
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
  
  .label {
    font-weight: 400;
    color: #807f7f;
     font-size: 16px;
  }
  
  .value {
    color: #080808;
    font-weight: 500;
    font-size: 20px;
  }
}

// 电表表格样式
.meter-table-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;

  &::-webkit-scrollbar {
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 5px;
    transition: background 0.2s;

    &:hover {
      background: #999;
    }
  }
}

::v-deep .meter-report-table {
  table-layout: auto;

  .el-table__header-wrapper {
    .el-table__header {
      th {
        background: #f5f7fa !important;
        font-weight: 600;
        font-size: 13px;
        padding: 12px 0;

        &.is-group {
          background: #e8f4fd !important;
          color: #3b82f6;
          font-weight: 700;
        }
      }
    }
  }

  .el-table__fixed,
  .el-table__fixed-right {
    &::before {
      background-color: transparent;
    }

    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .el-table__body {
    td {
      font-size: 13px;
      padding: 10px 0;

      &.is-right {
        .cell {
          text-align: right;
          padding-right: 12px;
        }
      }
    }
  }

  &.el-table--border {
    border-color: #e5e7eb;

    th,
    td {
      border-color: #e5e7eb;
    }
  }

  .el-table__body tr:hover>td {
    background-color: #f5f7fa !important;
  }
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
    margin: 0 0 8px 0;
  }

  .empty-tip {
    font-size: 12px;
    color: #c1c7d0;
  }
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
}

// ========== 响应式设计 ==========
@media (max-width: 1400px) {
  .filter-container {
    flex-direction: column;
    align-items: stretch;

    .filter-item {
      max-width: 100% !important;
    }

    .filter-actions {
      width: 100%;
      justify-content: flex-start;
      margin-left: 0;
    }
  }
}

@media (max-width: 768px) {
  .equipment-power-dashboard {
    padding: 12px;
  }

  .filter-container {
    padding: 16px;
    gap: 16px;
  }

  .table-section {
    padding: 16px;
  }
}
</style>

<style lang="scss">
// ========== 全局样式：自定义日期选择器 ==========
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
      color: #409eff !important;
      background: #f0f7ff !important;
      box-shadow: 0 2px 6px rgba(64, 158, 255, 0.15) !important;
      transform: translateY(-1px) !important;
      border: none !important;
    }

    &:active {
      transform: translateY(0) !important;
      box-shadow: 0 1px 3px rgba(64, 158, 255, 0.1) !important;
    }

    &:last-child {
      margin-bottom: 0 !important;
    }
  }
}
</style>