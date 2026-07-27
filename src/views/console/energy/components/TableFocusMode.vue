<template>
  <transition name="fullscreen-fade">
    <div class="table-fullscreen-wrapper" v-if="visible">
      <div class="fullscreen-container">
        <!-- 顶部工具栏 -->
        <div class="fullscreen-header">
          <div class="header-left">
            <h2 class="page-title">{{ $t('electricityReport.fullscreenTitle') }}</h2>
          </div>
          <div class="header-right">
            <button class="close-btn" @click="handleClose" :title="$t('electricityReport.closeTitle')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>{{ $t('electricityReport.btnClose') }}</span>
            </button>
          </div>
        </div>

        <!-- 筛选器 - 单行布局 -->
        <div class="fullscreen-filters">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">{{ $t('electricityReport.filterStatPeriod') }}</label>
              <el-date-picker v-model="localQueryParams.dateRange" type="daterange" format="yyyy-MM-dd"
                value-format="yyyy-MM-dd" range-separator="-" :start-placeholder="$t('electricityReport.phDateStart')" :end-placeholder="$t('electricityReport.phDateEnd')"
                :picker-options="datePickerOptions" class="filter-date-picker" popper-class="fullscreen-date-popper"
                @change="handleDateChange" />
            </div>

            <div class="filter-item">
              <label class="filter-label">{{ $t('electricityReport.filterTenant') }}</label>
              <el-select v-model="localQueryParams.tenantId" filterable :placeholder="$t('electricityReport.phTenant')" class="filter-select"
                popper-class="fullscreen-select-popper" :loading="tenantLoading" @change="handleSearch">
                <el-option v-for="tenant in tenantList" :key="tenant.tenantId" :label="tenantOptionLabel(tenant)"
                  :value="tenant.tenantId" />
              </el-select>
            </div>

            <div class="filter-item">
              <label class="filter-label">{{ $t('electricityReport.filterTenantType') }}</label>
              <el-select v-model="localQueryParams.tenantType" class="filter-select" popper-class="fullscreen-select-popper"
                @change="handleTenantTypeChange">
                <el-option :label="$t('electricityReport.tenantType0')" :value="0" />
                <el-option :label="$t('electricityReport.tenantType1')" :value="1" />
                <el-option :label="$t('electricityReport.tenantType2')" :value="2" />
              </el-select>
            </div>

            <!-- 🔥 设备筛选（与租户并排，仅设备明细时显示）-->
            <div class="filter-item" v-if="switchDeviceDetail">
              <label class="filter-label">{{ $t('electricityReport.filterDevice') }}</label>
              <el-input v-model="searchKeyword" :placeholder="$t('electricityReport.phDeviceSearch')" prefix-icon="el-icon-search" clearable
                class="filter-select" @clear="handleClearSearch">
                <template slot="suffix" v-if="searchKeyword">
                  <span class="search-count-inline">{{ filteredDeviceData.length }}/{{ deviceDetailData.length }}</span>
                </template>
              </el-input>
            </div>

            <div class="filter-actions">
              <el-tooltip effect="dark" :content="$t('electricityReport.tooltipDeviceDetailSingle')" placement="top" :disabled="!!localQueryParams.tenantId">
                <div class="detail-switch">
                  <span class="switch-text">{{ $t('electricityReport.deviceDetailSwitch') }}</span>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="switchDeviceDetail" @change="handleSwitchChange"
                      :disabled="!localQueryParams.tenantId" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>

        <!-- 表格区域 -->
        <div class="fullscreen-body" v-loading="loading" :element-loading-text="$t('electricityReport.loadingText')">
          <!-- 普通统计表格 -->
          <el-table v-show="!switchDeviceDetail" v-if="tableData.length > 0" ref="normalTable" :data="tableData"
            :height="tableHeight" show-summary :summary-method="getSummaries" :highlight-current-row="true"
            class="fullscreen-table">
            <el-table-column min-width="140" :label="$t('electricityReport.colDate')" prop="occurDate" />
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

          <!-- 设备明细表格 - 使用过滤后的数据 -->
          <el-table v-show="switchDeviceDetail" v-if="filteredDeviceData.length > 0" ref="deviceTable"
            :data="filteredDeviceData" :span-method="deviceDetailSpanMethod" :summary-method="getDeviceDetailSummaries"
            show-summary :height="tableHeight" :highlight-current-row="true" class="fullscreen-table">
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
            <el-table-column :label="$t('electricityReport.colDevice')" width="180">
              <template slot-scope="scope">
                <span v-html="highlightText($displayBizHybrid(scope.row.deviceUseDtoList.meterName) || '-', searchKeyword)"></span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colSettleWay')" width="120">
              <template slot-scope="scope">{{ getSettleWayLabel(scope.row.deviceUseDtoList.settleWay) }}</template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colFee')" width="120" align="right">
              <template slot-scope="scope">
                {{ scope.row.deviceUseDtoList.useAmount !== undefined ? scope.row.deviceUseDtoList.useAmount : "-" }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colElecGroup')" align="center">
              <el-table-column :label="$t('electricityReport.colGrandTotal')" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElec !== undefined ? scope.row.deviceUseDtoList.useElec : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colSpikeShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElecPeak !== undefined ? scope.row.deviceUseDtoList.useElecPeak : "-"
                  }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colPeakShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElecTop !== undefined ? scope.row.deviceUseDtoList.useElecTop : "-"
                  }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colFlatShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElecFlat !== undefined ? scope.row.deviceUseDtoList.useElecFlat : "-"
                  }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colValleyShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElecValley !== undefined ? scope.row.deviceUseDtoList.useElecValley :
                    "-" }}
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colStartReading')" align="center">
              <el-table-column :label="$t('electricityReport.colTime')" width="160">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.occurTime : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colTotalElecShort')" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerAll : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colSpikeShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerPeak : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colPeakShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerTop : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colFlatShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerFlat : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colValleyShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerValley : "-"
                  }}
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column :label="$t('electricityReport.colEndReading')" align="center">
              <el-table-column :label="$t('electricityReport.colTime')" width="160">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.occurTime : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colTotalElecShort')" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.powerAll : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colSpikeShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.powerPeak : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colPeakShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.powerTop : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colFlatShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.powerFlat : "-" }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('electricityReport.colValleyShort')" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.powerValley : "-" }}
                </template>
              </el-table-column>
            </el-table-column>
          </el-table>

          <!-- 空状态 -->
          <div class="empty-state" v-if="!loading && tableData.length === 0 && !switchDeviceDetail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 17V7m0 10l-3-3m3 3l3-3m5-1V7m0 10l-3-3m3 3l3-3" />
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            <p>{{ $t('electricityReport.emptyNoData') }}</p>
          </div>
          <div class="empty-state" v-if="!loading && switchDeviceDetail && deviceDetailData.length === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="7" width="18" height="14" rx="2" />
              <path d="M8 3v4m8-4v4M3 11h18" />
            </svg>
            <p>{{ $t('electricityReport.emptyNoDeviceDetail') }}</p>
          </div>
          <div class="empty-state"
            v-if="!loading && switchDeviceDetail && deviceDetailData.length > 0 && filteredDeviceData.length === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p>{{ $t('electricityReport.emptyNoMatch') }}</p>
            <p class="empty-hint">{{ $t('electricityReport.emptyTryOtherKeyword') }}</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import moment from 'moment'
import { getSimpleTenantList, useReportQueryTenantUseStatis } from '@/api/useReport'

export default {
  name: 'TableFocusMode',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentManagerId: {
      type: [String, Number],
      required: true
    },
    initialQueryParams: {
      type: Object,
      default: () => ({})
    }
  },

  data () {
    return {
      localQueryParams: {
        dateRange: [],
        tenantId: '',
        tenantType: 0
      },
      tenantList: [],
      tenantLoading: false,
      loading: false,
      tableData: [],
      deviceDetailData: [],
      switchDeviceDetail: false,
      tableHeight: 600,
      searchKeyword: ''
    }
  },

  computed: {
    datePickerOptions () {
      const t = (k) => this.$t(`electricityReport.${k}`)
      return {
        shortcuts: [
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
          },
          {
            text: t('pickerLastYear'),
            onClick (picker) {
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              const start = new Date()
              start.setFullYear(start.getFullYear() - 1)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          }
        ],
        disabledDate (time) {
          return time.getTime() > Date.now()
        }
      }
    },

    filteredDeviceData () {
      if (!this.searchKeyword.trim()) {
        return this.deviceDetailData
      }

      const keyword = this.searchKeyword.toLowerCase()
      const matchedDates = new Set()

      this.deviceDetailData.forEach(row => {
        const deviceName = (row.deviceUseDtoList?.meterName || '').toLowerCase()
        if (deviceName.includes(keyword)) {
          matchedDates.add(row.occurDate)
        }
      })

      return this.deviceDetailData.filter(row => matchedDates.has(row.occurDate))
    },

    /** 与主页面一致：由 getAirSysElecCoefKeys 白名单控制 */
    airSysElecColsVisible () {
      return this.$store.getters['manager/isAirSysElecManager'](this.currentManagerId)
    }
  },

  watch: {
    visible (val) {
      if (val) {
        this.resetComponentState()
        this.initializeData()
        this.$nextTick(() => {
          this.calculateTableHeight()
          document.addEventListener('keydown', this.handleEscape)
        })
      } else {
        document.removeEventListener('keydown', this.handleEscape)
        setTimeout(() => {
          this.resetComponentState()
        }, 300)
      }
    },

    switchDeviceDetail (val) {
      if (!val) {
        this.searchKeyword = ''
      }
      this.$nextTick(() => {
        this.calculateTableHeight()
      })
    }
  },

  mounted () {
    window.addEventListener('resize', this.calculateTableHeight)
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.calculateTableHeight)
    document.removeEventListener('keydown', this.handleEscape)
  },

  methods: {
    tenantOptionLabel (tenant) {
      if (!tenant || tenant.tenantId === '') return this.$t('electricityReport.tenantAll')
      return this.$displayBizHybrid(tenant.name)
    },

    resetComponentState () {
      this.switchDeviceDetail = false
      this.searchKeyword = ''
      this.tableData = []
      this.deviceDetailData = []
      this.loading = false
    },

    async initializeData () {
      this.localQueryParams = {
        dateRange: [...(this.initialQueryParams.dateRange || [])],
        tenantId: this.initialQueryParams.tenantId || '',
        tenantType: this.initialQueryParams.tenantType != null ? this.initialQueryParams.tenantType : 0
      }

      await this.getTenantList()
      this.handleSearch()
    },

    async getTenantList () {
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0,
          tenantType: this.localQueryParams.tenantType
        })
        this.tenantList = [
          { tenantId: '', name: this.$t('electricityReport.tenantAll') },
          ...(data || [])
        ]
      } catch (error) {
        this.$apiError.notify(error, this.$t('electricityReport.msgTenantListFail'))
        console.error(error)
      } finally {
        this.tenantLoading = false
      }
    },

    handleDateChange (val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        const [start, end] = val
        const startDate = new Date(start)
        const endDate = new Date(end)
        const diffDays = Math.floor((endDate - startDate) / (24 * 3600 * 1000))

        if (diffDays > 100) {
          this.$message.warning(this.$t('electricityReport.msgDateLimit100'))
          const newEndDate = new Date(startDate.getTime() + 100 * 24 * 3600 * 1000)
          this.localQueryParams.dateRange = [
            start,
            moment(newEndDate).format('YYYY-MM-DD')
          ]
          return
        }

        this.handleSearch()
      }
    },

    async handleTenantTypeChange () {
      this.localQueryParams.tenantId = ''
      await this.getTenantList()
      this.handleSearch()
    },

    async handleSearch () {
      if (!this.localQueryParams.dateRange || this.localQueryParams.dateRange.length !== 2) {
        this.$message.warning(this.$t('electricityReport.msgPickPeriod'))
        return
      }

      if (this.switchDeviceDetail && !this.localQueryParams.tenantId) {
        this.$message.warning(this.$t('electricityReport.msgDeviceNeedTenant'))
        return
      }

      this.loading = true
      try {
        await this.getStatisticsData()
        if (this.switchDeviceDetail) {
          await this.getDeviceDetailData()
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('electricityReport.msgFetchFail'))
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    async getStatisticsData () {
      const [startDate, endDate] = this.localQueryParams.dateRange
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: 1,
        selectType: this.switchDeviceDetail ? 0 : 2,
        tenantIdList: this.localQueryParams.tenantId ? [this.localQueryParams.tenantId] : [],
        tenantType: this.localQueryParams.tenantType
      }
      const { data } = await useReportQueryTenantUseStatis(params)

      // 倒序排序：最新日期在前
      this.tableData = (data || []).sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate)
      })
    },

    async getDeviceDetailData () {
      const [startDate, endDate] = this.localQueryParams.dateRange
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: 1,
        selectType: 0,
        tenantIdList: this.localQueryParams.tenantId ? [this.localQueryParams.tenantId] : [],
        tenantType: this.localQueryParams.tenantType
      }
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

    handleSwitchChange () {
      if (this.switchDeviceDetail && !this.localQueryParams.tenantId) {
        const realTenants = this.tenantList.filter(t => t.tenantId !== '')
        if (realTenants.length > 0) {
          this.localQueryParams.tenantId = realTenants[0].tenantId
          this.$message.info(this.$t('electricityReport.msgDeviceAutoTenant'))
        } else {
          this.$message.warning(this.$t('electricityReport.msgNoTenantAvailable'))
          this.switchDeviceDetail = false
          return
        }
      }
      this.handleSearch()
    },

    handleClearSearch () {
      this.searchKeyword = ''
    },

    highlightText (text, keyword) {
      if (!keyword || !text || text === '-') return text
      const regex = new RegExp(`(${keyword})`, 'gi')
      return text.replace(regex, '<mark class="highlight-mark">$1</mark>')
    },

    handleClose () {
      this.$emit('close')
    },

    handleEscape (e) {
      if (e.key === 'Escape' && this.visible) {
        if (this.searchKeyword) {
          this.searchKeyword = ''
        } else {
          this.handleClose()
        }
      }
    },

    calculateTableHeight () {
      this.tableHeight = window.innerHeight - 180
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

    getSummaries (param) {
      const { columns, data } = param
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = this.$t('electricityReport.summaryTotal')
          return
        }
        const values = data.map((item) => Number(item[column.property]))
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

    getSettleWayLabel (settleWay) {
      if (settleWay === undefined || settleWay === null) return ''
      const key = ['settleWay0', 'settleWay1', 'settleWay2', 'settleWay3', 'settleWay4', 'settleWay5'][settleWay]
      return key ? this.$t(`electricityReport.${key}`) : ''
    }
  }
}
</script>

<style lang="scss" scoped>
.table-fullscreen-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.fullscreen-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fullscreen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(to bottom, #ffffff, #fafafa);
  border-bottom: 2px solid #e5e7eb;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.close-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #dc2626;
  }
}

.fullscreen-filters {
  padding: 16px 24px;
  background: #fafafa;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.filter-item {
  flex: 0 0 auto;

  .filter-label {
    display: block;
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 8px;
    font-weight: 500;
  }
}

.filter-date-picker {
  width: 320px;
}

.filter-select {
  width: 280px;
}

.search-count-inline {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
  padding-right: 8px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.detail-switch {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
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

    &:disabled+.toggle-slider {
      background-color: #d1d5db;
      cursor: not-allowed;
      opacity: 0.6;
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

.fullscreen-body {
  flex: 1;
  overflow: hidden;
  padding: 20px 24px;
  position: relative;
}

.fullscreen-table {
  ::v-deep .el-table__header-wrapper {
    th {
      background: #fafafa;
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }
  }

  ::v-deep .el-table__footer-wrapper {
    td {
      color: #1a1a1a !important;
      font-weight: 700 !important;
      font-size: 15px !important;
      box-shadow: 0 -2px 8px rgba(59, 130, 246, 0.1) !important;
      padding: 14px 12px !important;
      background: #fafafa !important;
    }

    td:first-child {
      color: #3b82f6 !important;
      font-size: 16px !important;
      font-weight: 800 !important;
    }
  }

  ::v-deep .el-table__body-wrapper {
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;

      &:hover {
        background: #94a3b8;
      }
    }
  }
}

::v-deep .highlight-mark {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: 600;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;

  svg {
    width: 80px;
    height: 80px;
    color: #e5e7eb;
    margin-bottom: 20px;
  }

  p {
    font-size: 16px;
    color: #9ca3af;
    margin: 8px 0 0 0;
  }

  .empty-hint {
    font-size: 14px;
    color: #d1d5db;
    margin-top: 8px;
  }
}

.fullscreen-fade-enter-active,
.fullscreen-fade-leave-active {
  transition: opacity 0.25s ease;
}

.fullscreen-fade-enter,
.fullscreen-fade-leave-to {
  opacity: 0;
}

::v-deep .filter-date-picker,
::v-deep .filter-select {
  .el-input__inner {
    height: 38px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;

    &:hover {
      border-color: #d1d5db;
    }

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}
</style>

<style lang="scss">
.fullscreen-date-popper,
.fullscreen-select-popper {
  z-index: 3000 !important;
}

.el-picker-panel {
  z-index: 3000 !important;
}

.el-select-dropdown {
  z-index: 3000 !important;
}
</style>
