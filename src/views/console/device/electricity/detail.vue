<template>
  <el-drawer
    :visible.sync="visible"
    :before-close="handleClose"
    size="60%"
    :destroy-on-close="true"
    class="meter-detail-drawer"
  >
    <!-- 抽屉标题 -->
    <div slot="title" class="drawer-title">
      <span>详情</span>
    </div>

    <!-- 抽屉内容 -->
    <div v-loading="pageLoading" class="drawer-content">
      <!-- 顶部信息区 -->
      <div class="top-section">
        <!-- 左侧：基本信息 -->
        <div class="left-info">
          <!-- 电表名称和状态标签 -->
          <div class="meter-header">
            <h2 class="meter-name">{{ meterInfo.meterName || '--' }}</h2>
            <div class="status-tags">
              <el-tag 
                size="small" 
                :type="meterInfo.switchStatus == 1 ? 'success' : 'info'">
                {{ meterInfo.switchStatus == 1 ? '合闸' : '分闸' }}
              </el-tag>
              <el-tag 
                size="small" 
                :type="meterInfo.onlineStatus == 1 ? 'success' : 'danger'">
                {{ meterInfo.onlineStatus == 1 ? '在线' : '离线' }}
              </el-tag>
              <el-tag size="small" type="warning">
                {{ getBindTypeLabel(meterInfo.bindType) }}
              </el-tag>
            </div>
          </div>

          <!-- 信息两列布局 -->
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <span class="label">序列号：</span>
                <span class="value">{{ meterInfo.serial || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间：</span>
                <span class="value">{{ meterInfo.createTime || '--' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">编号：</span>
                <span class="value">{{ meterInfo.id || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="label">数据更新：</span>
                <span class="value">{{ meterInfo.syncTime || '--' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">规格型号：</span>
                <span class="value">{{ getPhaseLabel(meterInfo.phase) }}</span>
              </div>
              <div class="info-item">
                <span class="label">安装位置：</span>
                <span class="value">--</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item full-width">
                <span class="label">付费模式：</span>
                <span class="value">{{ getPayTypeLabel(meterInfo.logicPayType) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：已绑信息 + 操作按钮 -->
        <div class="right-info">
          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button 
              size="small" 
              type="danger" 
              plain
              v-if="meterInfo.switchStatus == 1"
              @click="handleSwitch(0)"
              :loading="switchLoading">
              分闸
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              plain
              v-else
              @click="handleSwitch(1)"
              :loading="switchLoading">
              合闸
            </el-button>
            <el-button size="small" plain @click="handleEdit">编辑</el-button>
          </div>

          <!-- 已绑信息卡片 -->
          <div class="bind-card">
            <h4 class="bind-title">已绑信息</h4>
            <div class="bind-content">
              <div v-if="meterInfo.bindId && meterInfo.bindName" class="bind-info">
                <div class="bind-header">
                  <!-- <el-tag size="small" type="info">
                    {{ getBindTypeLabel(meterInfo.bindType) }}
                  </el-tag> -->
                  <span class="bind-text">({{ meterInfo.bindId }}){{ meterInfo.bindName }}</span>
                </div>
              </div>
              <div v-else class="no-bind">暂无绑定信息</div>

              <!-- 电价方案 -->
              <div v-if="priceInfo.name" class="price-section">
                <div class="price-name">电费方案：{{ priceInfo.name }}</div>
                <div class="price-detail">
                  <span>尖：{{ priceInfo.powerPeakPrice }}</span>
                  <span>峰：{{ priceInfo.powerTopPrice }}</span>
                  <span>平：{{ priceInfo.powerFlatPrice }}</span>
                  <span>谷：{{ priceInfo.powerValleyPrice }}</span>
                </div>
              </div>
              <div v-else class="price-section">
                <div class="no-price">暂无电价方案</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 指标卡片 -->
      <div class="metrics-cards">
        <div class="metric-card">
          <div class="metric-label">实时功率/kW</div>
          <div class="metric-value">{{ simpleData.p || '--' }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">实时功率因数</div>
          <div class="metric-value">{{ simpleData.pf || '--' }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">月功率峰值/kW</div>
          <div class="metric-value">{{ simpleData.maxMonthP || '--' }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">昨日电量/度</div>
          <div class="metric-value">{{ simpleData.yesterdayUseElec || '--' }}</div>
        </div>
      </div>

      <!-- 功率曲线 -->
      <div class="chart-section">
        <div class="section-header">
          <h4>功率曲线</h4>
          <div class="chart-controls">
            <el-date-picker
              v-model="queryData.date"
              type="date"
              placeholder="选择日期"
              size="small"
              value-format="yyyy-MM-dd"
              :picker-options="pickerOptions"
              @change="handleDateChange"
            />
            <el-button-group class="view-toggle">
              <el-button 
                size="small" 
                :type="viewMode === 'table' ? 'primary' : ''"
                @click="viewMode = 'table'">
                表格
              </el-button>
              <el-button 
                size="small" 
                :type="viewMode === 'chart' ? 'primary' : ''"
                @click="viewMode = 'chart'" style="margin-left: 10px;">
                折线图
              </el-button>
            </el-button-group>
          </div>
        </div>

        <!-- 表格视图 -->
        <div v-show="viewMode === 'table'" class="table-view">
          <el-table
            v-if="chartData.length > 0"
            v-loading="chartLoading"
            :data="chartData"
            height="350"
            style="width: 100%">
            <el-table-column prop="occurTime" label="采集时间" width="180" />
            <el-table-column prop="pa" label="Pa(kW)" />
            <el-table-column prop="pb" label="Pb(kW)" />
            <el-table-column prop="pc" label="Pc(kW)" />
            <el-table-column prop="p" label="P(kW)" />
          </el-table>
          <div v-else-if="!chartLoading" class="empty-state">
            <i class="el-icon-data-line"></i>
            <p>暂无功率数据</p>
          </div>
        </div>

        <!-- 折线图视图 -->
        <div v-show="viewMode === 'chart'" class="chart-view">
          <div 
            v-if="chartData.length > 0"
            v-loading="chartLoading"
            ref="powerChart" 
            class="power-chart">
          </div>
          <div v-else-if="!chartLoading" class="empty-state">
            <i class="el-icon-data-line"></i>
            <p>暂无功率数据</p>
          </div>
        </div>
      </div>

      <!-- 近期用电统计 -->
      <div class="usage-section">
        <div class="section-header">
          <h4>近期用电统计</h4>
          <el-button type="text" @click="goToDetailReport">
            查看详细报表 >
          </el-button>
        </div>

        <el-table
          v-if="usageData.length > 0"
          v-loading="usageLoading"
          :data="usageData"
          max-height="400"
          style="width: 100%">
          <el-table-column prop="occurDate" label="日期" width="120" fixed="left" />
          <el-table-column label="总电费(元)" width="110" align="right">
            <template slot-scope="scope">
              {{ scope.row.balance || '--' }}
            </template>
          </el-table-column>
          <el-table-column label="总电量(度)" width="110" align="right">
            <template slot-scope="scope">
              {{ scope.row.useElec || '--' }}
            </template>
          </el-table-column>
          <el-table-column label="尖(度)" width="100" align="right">
            <template slot-scope="scope">
              {{ scope.row.useElecPeak || '--' }}
            </template>
          </el-table-column>
          <el-table-column label="峰(度)" width="100" align="right">
            <template slot-scope="scope">
              {{ scope.row.useElecTop || '--' }}
            </template>
          </el-table-column>
          <el-table-column label="平(度)" width="100" align="right">
            <template slot-scope="scope">
              {{ scope.row.useElecFlat || '--' }}
            </template>
          </el-table-column>
          <el-table-column label="谷(度)" width="100" align="right">
            <template slot-scope="scope">
              {{ scope.row.useElecValley || '--' }}
            </template>
          </el-table-column>

          <!-- 起始读数 -->
          <el-table-column label="起始读数" align="center">
            <el-table-column label="时间" width="160">
              <template slot-scope="scope">
                {{ scope.row.startUseDto ? scope.row.startUseDto.occurTime : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="总电量" width="100" align="right">
              <template slot-scope="scope">
                {{ scope.row.startUseDto ? scope.row.startUseDto.powerAll : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="尖" width="80" align="right">
              <template slot-scope="scope">
                {{ scope.row.startUseDto ? scope.row.startUseDto.powerPeak : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="峰" width="80" align="right">
              <template slot-scope="scope">
                {{ scope.row.startUseDto ? scope.row.startUseDto.powerTop : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="平" width="80" align="right">
              <template slot-scope="scope">
                {{ scope.row.startUseDto ? scope.row.startUseDto.powerFlat : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="谷" width="80" align="right">
              <template slot-scope="scope">
                {{ scope.row.startUseDto ? scope.row.startUseDto.powerValley : '-' }}
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 截止读数 -->
          <el-table-column label="截止读数" align="center">
            <el-table-column label="时间" width="160">
              <template slot-scope="scope">
                {{ scope.row.stopUseDto ? scope.row.stopUseDto.occurTime : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="总电量" width="100" align="right">
              <template slot-scope="scope">
                {{ scope.row.stopUseDto ? scope.row.stopUseDto.powerAll : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="尖" width="80" align="right">
              <template slot-scope="scope">
                {{ scope.row.stopUseDto ? scope.row.stopUseDto.powerPeak : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="峰" width="80" align="right">
              <template slot-scope="scope">
                {{ scope.row.stopUseDto ? scope.row.stopUseDto.powerTop : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="平" width="80" align="right">
              <template slot-scope="scope">
                {{ scope.row.stopUseDto ? scope.row.stopUseDto.powerFlat : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="谷" width="80" align="right">
              <template slot-scope="scope">
                {{ scope.row.stopUseDto ? scope.row.stopUseDto.powerValley : '-' }}
              </template>
            </el-table-column>
          </el-table-column>
        </el-table>

        <div v-else-if="!usageLoading" class="empty-state">
          <i class="el-icon-document"></i>
          <p>暂无用电统计数据</p>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      title="编辑电表"
      :visible.sync="editDialog.visible"
      width="600px"
      append-to-body>
      <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="电表名称" prop="meterName">
          <el-input v-model="editForm.meterName" />
        </el-form-item>
        <el-form-item label="电表类型" prop="bindType">
          <el-select v-model="editForm.bindType" style="width: 100%">
            <el-option label="专用表" :value="1" />
            <el-option label="公摊表" :value="2" />
            <el-option label="公式表" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="付费模式" prop="logicPayType">
          <el-select v-model="editForm.logicPayType" style="width: 100%">
            <el-option label="预付费" :value="0" />
            <el-option label="强控" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveEdit">确定</el-button>
      </span>
    </el-dialog>
  </el-drawer>
</template>

<script>
import moment from 'moment';
import {
  meterPageMeterInfoByAdmin,
  tenantDoMeterSwitchOffOn,
  meterUpdateMeterBase,
  getSimpleMeterInfo,
  getMeterPList
} from '@/api/meter';
import { getMeterDaySettleList } from '@/api/useReport';

export default {
  name: 'MeterDetailDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    meterId: {
      type: [String, Number],
      default: ''
    },
    serial: {
      type: String,
      default: ''
    },
    rowData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      pageLoading: false,
      chartLoading: false,
      usageLoading: false,
      switchLoading: false,
      submitting: false,

      meterInfo: {},
      priceInfo: {
        name: '',
        powerPeakPrice: '--',
        powerTopPrice: '--',
        powerFlatPrice: '--',
        powerValleyPrice: '--'
      },
      simpleData: {
        p: null,
        pf: null,
        maxMonthP: null,
        yesterdayUseElec: null
      },

      queryData: {
        date: moment().format('YYYY-MM-DD')
      },
      viewMode: 'chart',
      chartData: [],
      usageData: [],

      editDialog: {
        visible: false
      },
      editForm: {},
      editRules: {
        meterName: [{ required: true, message: '请输入电表名称', trigger: 'blur' }],
        bindType: [{ required: true, message: '请选择电表类型', trigger: 'change' }],
        logicPayType: [{ required: true, message: '请选择付费模式', trigger: 'change' }]
      },

      powerChart: null,

      pickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now();
        }
      }
    };
  },
  watch: {
    visible(val) {
      if (val) {
        this.loadData();
      } else {
        this.resetData();
      }
    },
    viewMode(val) {
      if (val === 'chart' && this.chartData.length > 0) {
        this.$nextTick(() => {
          this.renderChart();
        });
      }
    }
  },
  beforeDestroy() {
    if (this.powerChart) {
      this.powerChart.dispose();
    }
  },
  methods: {
    async loadData() {
      this.pageLoading = true;
      try {
        if (this.rowData && this.rowData.id) {
          this.meterInfo = { ...this.rowData };
          
          if (this.rowData.meterPriceDto) {
            this.priceInfo = {
              name: this.rowData.meterPriceDto.name || '',
              powerPeakPrice: this.rowData.meterPriceDto.powerPeakPrice ?? '--',
              powerTopPrice: this.rowData.meterPriceDto.powerTopPrice ?? '--',
              powerFlatPrice: this.rowData.meterPriceDto.powerFlatPrice ?? '--',
              powerValleyPrice: this.rowData.meterPriceDto.powerValleyPrice ?? '--'
            };
          }
        } else {
          await this.getMeterInfo();
        }

        await Promise.all([
          this.getSimpleInfo(),
          this.getChartData(),
          this.getUsageData()
        ]);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        this.pageLoading = false;
      }
    },

    async getMeterInfo() {
      try {
        const params = {
          serial: this.serial,
          page: { size: 1, current: 1 }
        };
        const response = await meterPageMeterInfoByAdmin(params);
        if (response.code === 200 && response.data && response.data.dataList.length > 0) {
          this.meterInfo = response.data.dataList[0];
          
          if (this.meterInfo.meterPriceDto) {
            this.priceInfo = {
              name: this.meterInfo.meterPriceDto.name || '',
              powerPeakPrice: this.meterInfo.meterPriceDto.powerPeakPrice ?? '--',
              powerTopPrice: this.meterInfo.meterPriceDto.powerTopPrice ?? '--',
              powerFlatPrice: this.meterInfo.meterPriceDto.powerFlatPrice ?? '--',
              powerValleyPrice: this.meterInfo.meterPriceDto.powerValleyPrice ?? '--'
            };
          }
        }
      } catch (error) {
        console.error('获取电表信息失败:', error);
      }
    },

    async getSimpleInfo() {
      try {
        const response = await getSimpleMeterInfo({ meterId: this.meterId });
        if (response.code === 200 && response.data) {
          this.simpleData = response.data;
        }
      } catch (error) {
        console.error('获取仪表数据失败:', error);
      }
    },

    async getChartData() {
      this.chartLoading = true;
      try {
        const response = await getMeterPList({
          meterId: this.meterId,
          date: this.queryData.date
        });
        if (response.code === 200 && response.data) {
          this.chartData = response.data;
          if (this.viewMode === 'chart' && this.chartData.length > 0) {
            this.$nextTick(() => {
              this.renderChart();
            });
          }
        }
      } catch (error) {
        console.error('获取功率数据失败:', error);
      } finally {
        this.chartLoading = false;
      }
    },

    async getUsageData() {
      this.usageLoading = true;
      try {
        const response = await getMeterDaySettleList({
          serial: this.serial,
          startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
          endDate: moment().format('YYYY-MM-DD')
        });
        if (response.code === 200 && response.data) {
          this.usageData = response.data;
        }
      } catch (error) {
        console.error('获取用电数据失败:', error);
      } finally {
        this.usageLoading = false;
      }
    },

    renderChart() {
      if (!this.$refs.powerChart || this.chartData.length === 0) return;

      if (!this.powerChart) {
        this.powerChart = this.$echarts.init(this.$refs.powerChart);
      }

      const timeArr = [];
      const paArr = [];
      const pbArr = [];
      const pcArr = [];
      const pArr = [];

      this.chartData.forEach(item => {
        timeArr.push(moment(item.occurTime).format('HH:mm:ss'));
        paArr.push(item.pa);
        pbArr.push(item.pb);
        pcArr.push(item.pc);
        pArr.push(item.p);
      });

      const option = {
        title: {
          text: '',
          left: '1%',
          textStyle: { fontSize: 16 }
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['Pa', 'Pb', 'Pc', 'P'],
          top: 10,
          right: '4%'
        },
        grid: {
          top: 100,
          left: '3%',
          right: '4%',
          bottom: 80,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: timeArr
        },
        yAxis: {
          type: 'value'
        },
        dataZoom: [{
          show: true,
          start: 50,
          end: 100,
          height: 30,
          bottom: 10
        }],
        series: [
          {
            name: 'Pa',
            type: 'line',
            smooth: true,
            data: paArr,
            itemStyle: { color: '#2251f5' },
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            }
          },
          {
            name: 'Pb',
            type: 'line',
            smooth: true,
            data: pbArr,
            itemStyle: { color: '#a243f3' },
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            }
          },
          {
            name: 'Pc',
            type: 'line',
            smooth: true,
            data: pcArr,
            itemStyle: { color: '#25ddd1' },
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            }
          },
          {
            name: 'P',
            type: 'line',
            smooth: true,
            data: pArr,
            itemStyle: { color: '#f0b65b' },
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            }
          }
        ]
      };

      this.powerChart.setOption(option);
    },

    handleDateChange() {
      this.getChartData();
    },

    async handleSwitch(targetStatus) {
      if (this.meterInfo.logicPayType === 0) {
        this.$message.warning('预付费模式下不能直接操作分合闸');
        return;
      }

      const actionText = targetStatus == 1 ? '合闸' : '分闸';

      try {
        await this.$confirm(`确定要执行${actionText}操作吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        this.switchLoading = true;
        const response = await tenantDoMeterSwitchOffOn({
          meterId: this.meterId,
          switchStatus: targetStatus,
          verifyCode: '',
          verifyPhone: ''
        });

        if (response.code === 200) {
          this.$message.success(`${actionText}操作成功`);
          this.getMeterInfo();
          this.$emit('refresh');
        } else {
          this.$message.error(response.msg || `${actionText}操作失败`);
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(`${actionText}操作失败`);
        }
      } finally {
        this.switchLoading = false;
      }
    },

    handleEdit() {
      this.editForm = {
        id: this.meterInfo.id,
        serial: this.meterInfo.serial,
        meterName: this.meterInfo.meterName,
        bindType: this.meterInfo.bindType,
        logicPayType: this.meterInfo.logicPayType,
        managerId: this.meterInfo.managerId
      };
      this.editDialog.visible = true;
    },

    async saveEdit() {
      try {
        await this.$refs.editForm.validate();
        
        this.submitting = true;
        const response = await meterUpdateMeterBase(this.editForm);

        if (response.code === 200) {
          this.$message.success('修改成功');
          this.editDialog.visible = false;
          this.getMeterInfo();
          this.$emit('refresh');
        } else {
          this.$message.error(response.msg || '修改失败');
        }
      } catch (error) {
        if (error !== false) {
          this.$message.error('修改失败');
        }
      } finally {
        this.submitting = false;
      }
    },

goToDetailReport() {
  this.$router.push({
    path: '/energy/equipmentPower',
    query: { 
      serial: this.serial,
      startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
      endDate: moment().format('YYYY-MM-DD')
    }
  });
  this.handleClose();
},

    handleClose() {
      this.$emit('update:visible', false);
    },

    resetData() {
      this.meterInfo = {};
      this.priceInfo = {
        name: '',
        powerPeakPrice: '--',
        powerTopPrice: '--',
        powerFlatPrice: '--',
        powerValleyPrice: '--'
      };
      this.simpleData = {
        p: null,
        pf: null,
        maxMonthP: null,
        yesterdayUseElec: null
      };
      this.chartData = [];
      this.usageData = [];
      this.viewMode = 'chart';
      this.queryData.date = moment().format('YYYY-MM-DD');
      
      if (this.powerChart) {
        this.powerChart.dispose();
        this.powerChart = null;
      }
    },

    getBindTypeLabel(type) {
      const map = { 1: '专用表', 2: '公摊表', 3: '公式表' };
      return map[type] || '--';
    },

    getPayTypeLabel(type) {
      const map = { 0: '预付费', 1: '强控' };
      return map[type] || '--';
    },

    getPhaseLabel(phase) {
      const map = { 5: '三相一次', 6: '三相二次', 7: '单相一次' };
      return map[phase] || '--';
    }
  }
};
</script>

<style lang="scss" scoped>
.meter-detail-drawer {
  ::v-deep .el-drawer__header {
    margin-bottom: 0;
    padding: 20px;
    border-bottom: 1px solid #e8e8e8;
  }

  .drawer-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .drawer-content {
    padding: 20px;
    height: calc(100vh - 80px);
    overflow-y: auto;
  }

  .top-section {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
    background: #f5f7fa;
    padding: 20px;
    border-radius: 8px;
  }

  .left-info {
    flex: 1;

    .meter-header {
      margin-bottom: 20px;

      .meter-name {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }

      .status-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }

    .info-grid {
      .info-row {
        display: flex;
        gap: 40px;
        margin-bottom: 12px;

       .info-item {
  flex: 1;
  display: flex;
  font-size: 14px;
  gap: 0; // 设置间距为0

  &.full-width {
    flex: 2;
  }

  .label {
    color: #909399;
    flex-shrink: 0; // 防止label被压缩
  }

  .value {
    color: #303133;
  }
}
      }
    }
  }

  .right-info {
    width: 360px;
    flex-shrink: 0;

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 16px;
    }

    .bind-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 16px;

      .bind-title {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .bind-content {
        .bind-info {
          margin-bottom: 16px;

          .bind-header {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;

            .bind-text {
              font-size: 14px;
              color: #303133;
              font-weight: 500;
            }
          }
        }

        .no-bind {
          color: #909399;
          text-align: center;
          padding: 12px;
          font-size: 14px;
        }

        .price-section {
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;

          .price-name {
            margin-bottom: 12px;
            font-size: 14px;
            color: #303133;
            font-weight: 500;
          }

          .price-detail {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            font-size: 13px;
            color: #606266;
            
            span {
              flex: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }

          .no-price {
            color: #909399;
            text-align: center;
            padding: 12px;
            font-size: 14px;
          }
        }
      }
    }
  }

  .metrics-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .metric-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 20px;
      text-align: center;

      .metric-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 12px;
      }

      .metric-value {
        font-size: 28px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .chart-section,
  .usage-section {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h4 {
        margin: 0;
        font-size: 16px;
        color: #303133;
        font-weight: 600;
      }

      .chart-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .table-view,
    .chart-view {
      min-height: 350px;
    }

    .power-chart {
      height: 350px;
      width: 100%;
    }
  }

  .empty-state {
    height: 350px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    color: #909399;

    i {
      font-size: 48px;
      margin-bottom: 16px;
      color: #c0c4cc;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  ::v-deep .el-table {
    th {
      background: #fafafa;
      color: #333;
      font-weight: 600;
    }

    .cell {
      padding: 0 8px;
    }

    .el-table__body-wrapper {
      overflow-x: auto !important;
      
      &::-webkit-scrollbar {
        height: 8px;
      }

      &::-webkit-scrollbar-thumb {
        background: #d9d9d9;
        border-radius: 4px;

        &:hover {
          background: #bfbfbf;
        }
      }
    }
  }

  @media (max-width: 1400px) {
    .top-section {
      flex-direction: column;
    }

    .right-info {
      width: 100%;
    }
  }

  @media (max-width: 768px) {
    .drawer-content {
      padding: 12px;
    }

    .metrics-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>