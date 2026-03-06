<template>
  <transition name="fullscreen-fade">
    <div class="table-fullscreen-wrapper" v-if="visible">
      <div class="fullscreen-container">
        <!-- 顶部工具栏 -->
        <div class="fullscreen-header">
          <div class="header-left">
            <h2 class="page-title">详细数据 - 全屏查看</h2>
          </div>
          <div class="header-right">
            <button class="close-btn" @click="handleClose" title="关闭 (ESC)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>关闭</span>
            </button>
          </div>
        </div>

        <!-- 筛选器 - 单行布局 -->
        <div class="fullscreen-filters">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">统计时间</label>
              <el-date-picker v-model="localQueryParams.dateRange" type="daterange" format="yyyy-MM-dd"
                value-format="yyyy-MM-dd" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间"
                :picker-options="pickerOptions" class="filter-date-picker" popper-class="fullscreen-date-popper"
                @change="handleDateChange" />
            </div>

            <div class="filter-item">
              <label class="filter-label">选择租户</label>
              <el-select v-model="localQueryParams.tenantId" filterable placeholder="请选择租户" class="filter-select"
                popper-class="fullscreen-select-popper" :loading="tenantLoading" @change="handleSearch">
                <el-option v-for="tenant in tenantList" :key="tenant.tenantId" :label="tenant.name"
                  :value="tenant.tenantId" />
              </el-select>
            </div>

            <!-- 🔥 设备筛选（与租户并排，仅设备明细时显示）-->
            <div class="filter-item" v-if="switchDeviceDetail">
              <label class="filter-label">设备筛选</label>
              <el-input v-model="searchKeyword" placeholder="输入设备名称..." prefix-icon="el-icon-search" clearable
                class="filter-select" @clear="handleClearSearch">
                <template slot="suffix" v-if="searchKeyword">
                  <span class="search-count-inline">{{ filteredDeviceData.length }}/{{ deviceDetailData.length }}</span>
                </template>
              </el-input>
            </div>

            <div class="filter-actions">
              <el-tooltip effect="dark" content="设备明细仅支持单一租户查询" placement="top" :disabled="!!localQueryParams.tenantId">
                <div class="detail-switch">
                  <span class="switch-text">设备明细</span>
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
        <div class="fullscreen-body" v-loading="loading" element-loading-text="数据加载中...">
          <!-- 普通统计表格 -->
          <el-table v-show="!switchDeviceDetail" v-if="tableData.length > 0" ref="normalTable" :data="tableData"
            :height="tableHeight" show-summary :summary-method="getSummaries" :highlight-current-row="true"
            class="fullscreen-table">
            <el-table-column min-width="140" label="日期" prop="occurDate" />
            <el-table-column min-width="140" label="总电费（元）" prop="useAmount" align="right" />
            <el-table-column min-width="140" label="室内电费（元）" prop="meterBalance" align="right" />
            <el-table-column min-width="140" label="空调电费（元）" prop="airBalance" align="right" />
            <el-table-column min-width="140" label="总电量（度）" prop="useElec" align="right" />
            <el-table-column min-width="140" label="室内电量（度）" prop="meterUseElec" align="right" />
            <el-table-column min-width="140" label="空调电量（度）" prop="airUseElec" align="right" />
            <el-table-column min-width="140" label="尖电量（度）" prop="useElecPeak" align="right" />
            <el-table-column min-width="140" label="峰电量（度）" prop="useElecTop" align="right" />
            <el-table-column min-width="140" label="平电量（度）" prop="useElecFlat" align="right" />
            <el-table-column min-width="140" label="谷电量（度）" prop="useElecValley" align="right" />
          </el-table>

          <!-- 设备明细表格 - 使用过滤后的数据 -->
          <el-table v-show="switchDeviceDetail" v-if="filteredDeviceData.length > 0" ref="deviceTable"
            :data="filteredDeviceData" :span-method="deviceDetailSpanMethod" :summary-method="getDeviceDetailSummaries"
            show-summary :height="tableHeight" :highlight-current-row="true" class="fullscreen-table">
            <el-table-column min-width="140" label="日期">
              <template slot-scope="scope">{{ scope.row.occurDate }}</template>
            </el-table-column>
            <el-table-column min-width="120" label="电费（元）" prop="useAmount" align="right" />
            <el-table-column min-width="120" label="室内电费（元）" prop="meterBalance" align="right" />
            <el-table-column min-width="120" label="空调电费（元）" prop="airBalance" align="right" />
            <el-table-column min-width="120" label="总电量（度）" prop="useElec" align="right" />
            <el-table-column min-width="120" label="室内电量（度）" prop="meterUseElec" align="right" />
            <el-table-column min-width="120" label="空调电量（度）" prop="airUseElec" align="right" />
            <el-table-column min-width="120" label="尖电量（度）" prop="useElecPeak" align="right" />
            <el-table-column min-width="120" label="峰电量（度）" prop="useElecTop" align="right" />
            <el-table-column min-width="120" label="平电量（度）" prop="useElecFlat" align="right" />
            <el-table-column min-width="120" label="谷电量（度）" prop="useElecValley" align="right" />
            <el-table-column label="设备" width="180">
              <template slot-scope="scope">
                <span v-html="highlightText(scope.row.deviceUseDtoList.meterName || '-', searchKeyword)"></span>
              </template>
            </el-table-column>
            <el-table-column label="结算方式" width="120">
              <template slot-scope="scope">{{ getSettleWayLabel(scope.row.deviceUseDtoList.settleWay) }}</template>
            </el-table-column>
            <el-table-column label="费用" width="120" align="right">
              <template slot-scope="scope">
                {{ scope.row.deviceUseDtoList.useAmount !== undefined ? scope.row.deviceUseDtoList.useAmount : "-" }}
              </template>
            </el-table-column>
            <el-table-column label="电量" align="center">
              <el-table-column label="总计" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElec !== undefined ? scope.row.deviceUseDtoList.useElec : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="尖" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElecPeak !== undefined ? scope.row.deviceUseDtoList.useElecPeak : "-"
                  }}
                </template>
              </el-table-column>
              <el-table-column label="峰" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElecTop !== undefined ? scope.row.deviceUseDtoList.useElecTop : "-"
                  }}
                </template>
              </el-table-column>
              <el-table-column label="平" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElecFlat !== undefined ? scope.row.deviceUseDtoList.useElecFlat : "-"
                  }}
                </template>
              </el-table-column>
              <el-table-column label="谷" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.useElecValley !== undefined ? scope.row.deviceUseDtoList.useElecValley :
                    "-" }}
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="起始读数" align="center">
              <el-table-column label="时间" width="160">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.occurTime : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="总电量" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerAll : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="尖" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerPeak : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="峰" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerTop : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="平" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerFlat : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="谷" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.startUseDto ? scope.row.deviceUseDtoList.startUseDto.powerValley : "-"
                  }}
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="截止读数" align="center">
              <el-table-column label="时间" width="160">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.occurTime : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="总电量" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.powerAll : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="尖" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.powerPeak : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="峰" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.powerTop : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="平" width="80" align="right">
                <template slot-scope="scope">
                  {{ scope.row.deviceUseDtoList.stopUseDto ? scope.row.deviceUseDtoList.stopUseDto.powerFlat : "-" }}
                </template>
              </el-table-column>
              <el-table-column label="谷" width="80" align="right">
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
            <p>暂无数据</p>
          </div>
          <div class="empty-state" v-if="!loading && switchDeviceDetail && deviceDetailData.length === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="7" width="18" height="14" rx="2" />
              <path d="M8 3v4m8-4v4M3 11h18" />
            </svg>
            <p>暂无设备明细数据</p>
          </div>
          <div class="empty-state"
            v-if="!loading && switchDeviceDetail && deviceDetailData.length > 0 && filteredDeviceData.length === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p>未找到匹配的设备</p>
            <p class="empty-hint">试试其他关键词</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import moment from "moment";
import { getSimpleTenantList, useReportQueryTenantUseStatis } from "@/api/useReport";

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

  data() {
    return {
      localQueryParams: {
        dateRange: [],
        tenantId: "",
      },
      tenantList: [],
      tenantLoading: false,
      loading: false,
      tableData: [],
      deviceDetailData: [],
      switchDeviceDetail: false,
      tableHeight: 600,
      searchKeyword: '',
      settleWayMap: {
        0: "普通结算",
        1: "手动扣款",
        2: "系统补单",
        3: "浮动电价",
        4: "分摊结算",
        5: "设备扣款",
      },
      pickerOptions: {
        shortcuts: [
          {
            text: "昨天",
            onClick(picker) {
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setTime(end.getTime() - 3600 * 1000 * 24);
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "本周",
            onClick(picker) {
              const now = new Date();
              const dayOfWeek = now.getDay();
              const start = new Date(now);
              const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
              start.setDate(now.getDate() + diff);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "上周",
            onClick(picker) {
              const now = new Date();
              const dayOfWeek = now.getDay();
              const start = new Date(now);
              const diff = dayOfWeek === 0 ? -13 : -6 - dayOfWeek;
              start.setDate(now.getDate() + diff);
              start.setHours(0, 0, 0, 0);
              const end = new Date(start);
              end.setDate(start.getDate() + 6);
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "本月",
            onClick(picker) {
              const start = new Date();
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "上月",
            onClick(picker) {
              const start = new Date();
              start.setMonth(start.getMonth() - 1);
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setDate(0);
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "近三个月",
            onClick(picker) {
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              const start = new Date();
              start.setMonth(start.getMonth() - 3);
              start.setHours(0, 0, 0, 0);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "近一年",
            onClick(picker) {
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              const start = new Date();
              start.setFullYear(start.getFullYear() - 1);
              start.setHours(0, 0, 0, 0);
              picker.$emit("pick", [start, end]);
            },
          },
        ],
        disabledDate(time) {
          return time.getTime() > Date.now();
        },
      },
    };
  },

  computed: {
    filteredDeviceData() {
      if (!this.searchKeyword.trim()) {
        return this.deviceDetailData;
      }

      const keyword = this.searchKeyword.toLowerCase();
      const matchedDates = new Set();

      this.deviceDetailData.forEach(row => {
        const deviceName = (row.deviceUseDtoList?.meterName || '').toLowerCase();
        if (deviceName.includes(keyword)) {
          matchedDates.add(row.occurDate);
        }
      });

      return this.deviceDetailData.filter(row => matchedDates.has(row.occurDate));
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.resetComponentState();
        this.initializeData();
        this.$nextTick(() => {
          this.calculateTableHeight();
          document.addEventListener('keydown', this.handleEscape);
        });
      } else {
        document.removeEventListener('keydown', this.handleEscape);
        setTimeout(() => {
          this.resetComponentState();
        }, 300);
      }
    },

    switchDeviceDetail(val) {
      if (!val) {
        this.searchKeyword = '';
      }
      this.$nextTick(() => {
        this.calculateTableHeight();
      });
    }
  },

  mounted() {
    window.addEventListener('resize', this.calculateTableHeight);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.calculateTableHeight);
    document.removeEventListener('keydown', this.handleEscape);
  },

  methods: {
    resetComponentState() {
      this.switchDeviceDetail = false;
      this.searchKeyword = '';
      this.tableData = [];
      this.deviceDetailData = [];
      this.loading = false;
    },

    async initializeData() {
      this.localQueryParams = {
        dateRange: [...(this.initialQueryParams.dateRange || [])],
        tenantId: this.initialQueryParams.tenantId || "",
      };

      await this.getTenantList();
      this.handleSearch();
    },

    async getTenantList() {
      this.tenantLoading = true;
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0,
        });
        this.tenantList = [
          { tenantId: "", name: "全部" },
          ...(data || [])
        ];
      } catch (error) {
        this.$message.error("获取租户列表失败");
        console.error(error);
      } finally {
        this.tenantLoading = false;
      }
    },

    handleDateChange(val) {
      if (val && val.length === 2 && val[0] && val[1]) {
        const [start, end] = val;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffDays = Math.floor((endDate - startDate) / (24 * 3600 * 1000));

        if (diffDays > 100) {
          this.$message.warning("日统计最多只能选择100天的数据");
          const newEndDate = new Date(startDate.getTime() + 100 * 24 * 3600 * 1000);
          this.localQueryParams.dateRange = [
            start,
            moment(newEndDate).format("YYYY-MM-DD"),
          ];
          return;
        }

        this.handleSearch();
      }
    },

    async handleSearch() {
      if (!this.localQueryParams.dateRange || this.localQueryParams.dateRange.length !== 2) {
        this.$message.warning("请选择统计时间");
        return;
      }

      if (this.switchDeviceDetail && !this.localQueryParams.tenantId) {
        this.$message.warning("设备明细模式下请选择具体租户");
        return;
      }

      this.loading = true;
      try {
        await this.getStatisticsData();
        if (this.switchDeviceDetail) {
          await this.getDeviceDetailData();
        }
      } catch (error) {
        this.$message.error("获取数据失败");
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async getStatisticsData() {
      const [startDate, endDate] = this.localQueryParams.dateRange;
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: 1,
        selectType: this.switchDeviceDetail ? 0 : 2,
        tenantIdList: this.localQueryParams.tenantId ? [this.localQueryParams.tenantId] : [],
      };
      const { data } = await useReportQueryTenantUseStatis(params);

      // 倒序排序：最新日期在前
      this.tableData = (data || []).sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate);
      });
    },

    async getDeviceDetailData() {
      const [startDate, endDate] = this.localQueryParams.dateRange;
      const params = {
        managerId: this.currentManagerId,
        startDate,
        endDate,
        dataType: 2,
        useType: 1,
        selectType: 0,
        tenantIdList: this.localQueryParams.tenantId ? [this.localQueryParams.tenantId] : [],
      };
      const { data } = await useReportQueryTenantUseStatis(params);

      // 先对原始数据按日期倒序排序
      const sortedData = (data || []).sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate);
      });

      const detailArray = [];
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
              useElecPeak: item.useElecPeak,
              useElecTop: item.useElecTop,
              useElecFlat: item.useElecFlat,
              useElecValley: item.useElecValley,
            };
            item.deviceUseDtoList.forEach((device, idx) => {
              detailArray.push({
                ...baseObj,
                col: idx === 0 ? item.deviceUseDtoList.length : 0,
                deviceUseDtoList: device,
              });
            });
          } else {
            detailArray.push({
              occurDate: item.occurDate,
              useAmount: item.useAmount,
              meterBalance: item.meterBalance,
              airBalance: item.airBalance,
              useElec: item.useElec,
              meterUseElec: item.meterUseElec,
              airUseElec: item.airUseElec,
              useElecPeak: item.useElecPeak,
              useElecTop: item.useElecTop,
              useElecFlat: item.useElecFlat,
              useElecValley: item.useElecValley,
              col: 1,
              deviceUseDtoList: {},
            });
          }
        });
      }
      this.deviceDetailData = detailArray;
    },

    handleSwitchChange() {
      if (this.switchDeviceDetail && !this.localQueryParams.tenantId) {
        const realTenants = this.tenantList.filter(t => t.tenantId !== "");
        if (realTenants.length > 0) {
          this.localQueryParams.tenantId = realTenants[0].tenantId;
          this.$message.info("设备明细模式已自动选择第一个租户");
        } else {
          this.$message.warning("暂无可用租户");
          this.switchDeviceDetail = false;
          return;
        }
      }
      this.handleSearch();
    },

    handleClearSearch() {
      this.searchKeyword = '';
    },

    highlightText(text, keyword) {
      if (!keyword || !text || text === '-') return text;
      const regex = new RegExp(`(${keyword})`, 'gi');
      return text.replace(regex, '<mark class="highlight-mark">$1</mark>');
    },

    handleClose() {
      this.$emit('close');
    },

    handleEscape(e) {
      if (e.key === 'Escape' && this.visible) {
        if (this.searchKeyword) {
          this.searchKeyword = '';
        } else {
          this.handleClose();
        }
      }
    },

    calculateTableHeight() {
      this.tableHeight = window.innerHeight - 180;
    },

    deviceDetailSpanMethod({ row, columnIndex }) {
      if (columnIndex < 11) {
        return {
          rowspan: row.col,
          colspan: row.col > 0 ? 1 : 0,
        };
      }
    },

    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = "总计";
          return;
        }
        const values = data.map((item) => Number(item[column.property]));
        if (!values.every((value) => isNaN(value))) {
          sums[index] = values
            .reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              }
              return prev;
            }, 0)
            .toFixed(2);
        } else {
          sums[index] = "";
        }
      });
      return sums;
    },

    getDeviceDetailSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      const uniqueData = [];
      const dateSet = [];

      data.forEach((item) => {
        if (dateSet.indexOf(item.occurDate) === -1) {
          uniqueData.push(item);
          dateSet.push(item.occurDate);
        }
      });

      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = "总计";
          return;
        }
        const values = uniqueData.map((item) => Number(item[column.property]));
        if (!values.every((value) => isNaN(value))) {
          sums[index] = values
            .reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              }
              return prev;
            }, 0)
            .toFixed(2);
        } else {
          sums[index] = "";
        }
      });
      return sums;
    },

    getSettleWayLabel(settleWay) {
      if (settleWay === undefined || settleWay === null) return "";
      return this.settleWayMap[settleWay] || "";
    }
  }
};
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