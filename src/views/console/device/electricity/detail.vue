<template>
  <div class="meter-detail-page">
    <div v-if="pageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="el-icon-loading"></i>
        </div>
        <div class="loading-text">正在加载电表详情...</div>
      </div>
    </div>
    
    <!-- 页面主体 -->
    <div class="page-content">
      <!-- 左侧设备信息 -->
      <div class="device-info-panel">
        <!-- 设备标题 -->
        <div class="device-header">
          <h2 class="device-name">
            <el-button
              @click="goBack"
              type="text"
              size="mini"
              style="margin-left: -20px"
            >
              <i class="el-icon-arrow-left"></i> 返回 
            </el-button>
            {{ meterInfo.meterName }}
          </h2>
          <div class="device-tags">
            <el-tag type="success" size="small">正常</el-tag>
            <el-tag type="info" size="small">在线</el-tag>
            <el-tag size="small">监控中</el-tag>
          </div>
        </div>

        <!-- 设备图片和基本信息 -->
        <div class="device-basic">
          <div class="device-image">
            <img
              src="@/assets/images/elc.png"
              alt="电表设备"
            />
          </div>
          <div class="device-meta">
            <div class="meta-row">
              <span class="label">序列号</span>
              <span class="value">{{ meterInfo.serial }}</span>
            </div>
            <div class="meta-row">
              <span class="label">编号</span>
              <span class="value">{{ meterInfo.id }}</span>
            </div>
            <div class="meta-row">
              <span class="label">余额</span>
              <span class="value balance">¥ {{ meterInfo.balance || '0.00' }}</span>
            </div>
            <div class="meta-row">
              <span class="label">电表类型</span>
              <span class="value">{{ getBindTypeLabel(meterInfo.bindType) }}</span>
            </div>
            <div class="meta-row">
              <span class="label">付费模式</span>
              <span class="value">{{ getPayTypeLabel(meterInfo.logicPayType) }}</span>
            </div>
            <div class="meta-row">
              <span class="label">分合闸状态</span>
              <span class="value" :class="{'status-open': meterInfo.switchStatus == 1, 'status-closed': meterInfo.switchStatus == 0}">
                {{ meterInfo.switchStatus == 1 ? '合闸' : '分闸' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="device-controls">
          <div class="button-wrapper">
            <el-button
              :type="meterInfo.switchStatus == 0 ? 'primary' : 'warning'"
              @click="handleSwitchControl"
              :loading="switchLoading"
              class="switch-button"
            >
              {{ meterInfo.switchStatus == 0 ? "合闸" : "分闸" }}
            </el-button>
          </div>
          <div class="button-wrapper">
            <el-button @click="showSettingsDialog" class="control-button">
              参数设置
            </el-button>
          </div>
          <div class="button-wrapper">
            <el-button @click="showRechargeDialog" class="control-button">
              电费充值
            </el-button>
          </div>
          <div class="button-wrapper">
            <el-button @click="showMaintenanceDialog" class="control-button">
              设备维护
            </el-button>
          </div>
        </div>

        <!-- 设备详细信息 -->
        <div class="device-details">
          <div class="detail-section">
            <h4>设备参数</h4>
            <div class="detail-list">
              <div class="detail-item">
                <span class="label">IMEI</span>
                <span class="value">{{ meterInfo.imei || "-" }}</span>
              </div>
              <div class="detail-item">
                <span class="label">CT变比</span>
                <span class="value">{{ meterInfo.ct || "1" }}</span>
              </div>
              <div class="detail-item">
                <span class="label">PT变比</span>
                <span class="value">{{ meterInfo.pt || "1" }}</span>
              </div>
              <div class="detail-item">
                <span class="label">创建时间</span>
                <span class="value">{{ meterInfo.createTime || "-" }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>绑定信息</h4>
            <div class="bind-info-list">
              <div v-if="meterInfo.bindId && meterInfo.bindName">
                <div 
                  class="bind-item"
                  @click="handleBindClick(meterInfo)"
                >
                  <div class="bind-id">{{ meterInfo.bindId }}</div>
                  <div class="bind-name">{{ meterInfo.bindName }}</div>
                </div>
              </div>
              <div v-else class="no-bind">暂无绑定信息</div>
            </div>
          </div>

          <div class="detail-section">
            <h4>余额信息</h4>
            <div class="balance-info">
              <div class="balance-amount">¥{{ meterInfo.balance || '0.00' }}</div>
              <div class="balance-status">
                <span :class="getBalanceStatusClass(meterInfo.balance)">
                  {{ getBalanceStatusText(meterInfo.balance) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧数据展示 -->
      <div class="data-panel">
        <!-- 最新数据 -->
        <div class="latest-data-section">
          <div class="section-header">
            <h3>最新数据</h3>
            <span class="update-time">更新时间: {{ meterInfo.syncTime || new Date().toLocaleString() }}</span>
          </div>

          <div class="data-overview">
            <div class="overview-item">
              <span class="label">IMEI</span>
              <span class="value">{{ meterInfo.imei || "-" }}</span>
            </div>
            <div class="overview-item">
              <span class="label">电表付费模式</span>
              <span class="value">{{ getPayTypeLabel(meterInfo.logicPayType) }}</span>
            </div>
            <div class="overview-item">
              <span class="label">分合闸状态</span>
              <span class="value">{{ meterInfo.switchStatus == 1 ? '合闸' : '分闸' }}</span>
            </div>
            <div class="overview-item">
              <span class="label">电压变比PT</span>
              <span class="value">{{ meterInfo.pt || "1" }}</span>
            </div>
            <div class="overview-item">
              <span class="label">电流变比CT</span>
              <span class="value">{{ meterInfo.ct || "1" }}</span>
            </div>
            <div class="overview-item">
              <span class="label">在线状态</span>
              <span class="value">{{ meterInfo.onlineStatus == 1 ? '在线' : '离线' }}</span>
            </div>
            <div class="overview-item">
              <span class="label">电表相位</span>
              <span class="value">{{ getPhaseLabel(meterInfo.phase) }}</span>
            </div>
            <div class="overview-item">
              <span class="label">监控类型</span>
              <span class="value">{{ getMonitorTypeLabel(meterInfo.monitorType) }}</span>
            </div>
          </div>

          <!-- 电力参数表格 -->
          <div class="power-params-table">
            <table class="params-table">
              <thead>
                <tr>
                  <th></th>
                  <th>尖电量</th>
                  <th>峰电量</th>
                  <th>平电量</th>
                  <th>谷电量</th>
                  <th>总电量</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-label">当前读数</td>
                  <td>{{ powerData.peak }}</td>
                  <td>{{ powerData.high }}</td>
                  <td>{{ powerData.flat }}</td>
                  <td>{{ powerData.valley }}</td>
                  <td>{{ powerData.total }}</td>
                </tr>
              </tbody>
            </table>

            <table class="params-table">
              <thead>
                <tr>
                  <th></th>
                  <th>A相</th>
                  <th>B相</th>
                  <th>C相</th>
                  <th>合计</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-label">电压(V)</td>
                  <td>{{ phaseData.voltageA }}</td>
                  <td>{{ phaseData.voltageB }}</td>
                  <td>{{ phaseData.voltageC }}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td class="row-label">电流(A)</td>
                  <td>{{ phaseData.currentA }}</td>
                  <td>{{ phaseData.currentB }}</td>
                  <td>{{ phaseData.currentC }}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td class="row-label">有功功率(kW)</td>
                  <td>{{ phaseData.activePowerA }}</td>
                  <td>{{ phaseData.activePowerB }}</td>
                  <td>{{ phaseData.activePowerC }}</td>
                  <td>{{ phaseData.totalActivePower }}</td>
                </tr>
                <tr>
                  <td class="row-label">无功功率(kVar)</td>
                  <td>{{ phaseData.reactivePowerA }}</td>
                  <td>{{ phaseData.reactivePowerB }}</td>
                  <td>{{ phaseData.reactivePowerC }}</td>
                  <td>{{ phaseData.totalReactivePower }}</td>
                </tr>
                <tr>
                  <td class="row-label">功率因数</td>
                  <td>{{ phaseData.powerFactorA }}</td>
                  <td>{{ phaseData.powerFactorB }}</td>
                  <td>{{ phaseData.powerFactorC }}</td>
                  <td>{{ phaseData.totalPowerFactor }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 数据查询和图表 -->
        <div class="chart-section">
          <div class="chart-header">
            <div class="chart-controls">
              <div class="control-group">
                <span class="control-label">序列号</span>
                <el-input
                  v-model="queryParams.serial"
                  size="small"
                  style="width: 150px"
                  disabled
                />
              </div>
              <div class="control-group">
                <span class="control-label">时间范围</span>
                <el-date-picker
                  v-model="queryParams.dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  size="small"
                  format="yyyy-MM-dd HH:mm:ss"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </div>
              <div class="control-group">
                <el-button type="primary" size="small" @click="queryData">
                  查询
                </el-button>
              </div>
            </div>

            <div class="tab-controls">
              <el-radio-group v-model="activeTab" size="small">
                <el-radio-button label="用电趋势">用电趋势</el-radio-button>
                <el-radio-button label="设备事件">设备事件</el-radio-button>
                <el-radio-button label="抄表记录">抄表记录</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- 用电趋势图表 -->
          <div v-show="activeTab === '用电趋势'" class="chart-container">
            <div class="chart-stats">
              <div class="stat-item">
                <span class="stat-label">本月总用电量</span>
                <span class="stat-value">{{ chartStats.totalPowerConsumption }}</span>
                <span class="stat-unit">kWh</span>
                <span class="stat-change" :class="chartStats.changeClass">
                  {{ chartStats.changePercent }}%
                </span>
              </div>
            </div>
            <div ref="powerChart" class="power-chart"></div>
          </div>

          <!-- 设备事件表格 -->
          <div v-show="activeTab === '设备事件'" class="events-container">
            <div class="events-table">
              <el-table
                :data="deviceEvents"
                style="width: 100%"
                stripe
                size="small"
              >
                <el-table-column prop="time" label="时间" width="180"/>
                <el-table-column prop="type" label="事件类型" width="120">
                  <template slot-scope="scope">
                    <el-tag size="mini" :type="getEventTagType(scope.row.type)">
                      {{ scope.row.type }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="switchStatus" label="开关状态" width="100"/>
                <el-table-column prop="voltage" label="电压值" width="100"/>
                <el-table-column prop="current" label="电流值" width="100"/>
                <el-table-column prop="power" label="功率值" width="100"/>
                <el-table-column prop="remark" label="备注"/>
              </el-table>
            </div>
          </div>

          <!-- 抄表记录 -->
          <div v-show="activeTab === '抄表记录'" class="reading-records">
            <div class="records-placeholder">
              <div class="placeholder-icon">
                <i class="el-icon-document"></i>
              </div>
              <p>抄表记录功能开发中...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <el-dialog
      title="电费充值"
      :visible.sync="rechargeDialog.visible"
      width="400px"
    >
      <el-form ref="rechargeForm" :model="rechargeForm" label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number
            v-model="rechargeForm.amount"
            :min="0.01"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="rechargeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleRecharge">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="参数设置"
      :visible.sync="settingsDialog.visible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="settingsForm" :model="settingsForm" label-width="100px">
        <el-form-item label="序列号">
          <el-input v-model="settingsForm.serial" disabled />
        </el-form-item>
        <el-form-item label="电表名称" required>
          <el-input v-model="settingsForm.meterName" />
        </el-form-item>
        <el-form-item label="电表类型" required>
          <el-select v-model="settingsForm.bindType" style="width: 100%">
            <el-option label="专用表" :value="1" />
            <el-option label="公摊表" :value="2" />
            <el-option label="公式表" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="付费模式">
          <el-select v-model="settingsForm.logicPayType" style="width: 100%">
            <el-option label="预付费" :value="0" />
            <el-option label="强控" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="电表相位">
          <el-select v-model="settingsForm.phase" style="width: 100%">
            <el-option label="单相" :value="1" />
            <el-option label="三相" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="CT变比">
          <el-input-number v-model="settingsForm.ct" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="PT变比">
          <el-input-number v-model="settingsForm.pt" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="IMEI">
          <el-input v-model="settingsForm.imei" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="settingsDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">确认</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="设备维护"
      :visible.sync="maintenanceDialog.visible"
      width="400px"
    >
      <div class="maintenance-content">
        <el-alert
          title="提示"
          type="info"
          description="设备维护操作将影响正常使用，请谨慎操作！"
          :closable="false"
        />
        <div style="margin-top: 20px">
          <el-checkbox v-model="confirmMaintenance">我确认要执行维护操作</el-checkbox>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="maintenanceDialog.visible = false">取消</el-button>
        <el-button
          type="warning"
          :disabled="!confirmMaintenance"
          @click="handleMaintenance"
        >
          确定维护
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// 导入相关API（根据实际项目路径调整）
import {
  meterPageMeterInfoByAdmin,
  tenantDoMeterSwitchOffOn,
  meterUpdateMeterBase,
} from "@/api/meter";

export default {
  name: "MeterDetail",
  data() {
    return {
      pageLoading: true,
      resizeTimer: null,

      // 路由参数存储
      routeParams: {
        deviceId: null,
        serial: null,
        meterName: null,
      },
      
      // 电表基本信息 - 基于真实接口数据结构
      meterInfo: {
        id: "",
        serial: "",
        meterName: "",
        bindType: "",
        logicPayType: "",
        phase: "",
        switchStatus: 0,
        onlineStatus: 1,
        imei: "",
        ct: 1,
        pt: 1,
        balance: "0.00",
        createTime: "",
        bindId: "",
        bindName: "",
        managerId: "",
      },

      // 电力数据 - 基于真实电表数据结构
      powerData: {
        peak: "0.51",      // 尖电量
        high: "0.87",      // 峰电量  
        flat: "1.55",      // 平电量
        valley: "1.52",    // 谷电量
        total: "4.45",     // 总电量
      },

      // 相位数据 - 基于真实电表参数
      phaseData: {
        voltageA: "231.9",
        voltageB: "231.9", 
        voltageC: "231.9",
        currentA: "0.19",
        currentB: "0.19",
        currentC: "0.19",
        activePowerA: "0.024",
        activePowerB: "0.024", 
        activePowerC: "0.024",
        totalActivePower: "0.072",
        reactivePowerA: "0.000",
        reactivePowerB: "0.000",
        reactivePowerC: "0.000", 
        totalReactivePower: "0.000",
        powerFactorA: "0.99",
        powerFactorB: "0.99",
        powerFactorC: "0.99",
        totalPowerFactor: "0.99",
      },

      // 图表统计数据
      chartStats: {
        totalPowerConsumption: "3,126.6",
        changePercent: 15.8,
        changeClass: "increase",
      },

      // 查询参数
      queryParams: {
        serial: "",
        dateRange: [],
      },

      // 活跃标签页
      activeTab: "用电趋势",

      // 设备事件列表
      deviceEvents: [
        {
          id: 1,
          time: "2025-08-08 02:15:30",
          type: "在线",
          switchStatus: "合闸",
          voltage: "220V",
          current: "14.5A",
          power: "3.2kW",
          remark: "正常运行",
        },
        {
          id: 2,
          time: "2025-08-08 08:20:45",
          type: "分合闸操作",
          switchStatus: "合闸",
          voltage: "220V",
          current: "15.2A",
          power: "3.5kW",
          remark: "用户操作合闸",
        },
        {
          id: 3,
          time: "2025-08-08 14:30:12",
          type: "数据上报",
          switchStatus: "合闸",
          voltage: "218V",
          current: "12.7A",
          power: "2.8kW",
          remark: "定时数据上报",
        },
      ],

      // 控制状态
      switchLoading: false,

      // 弹窗状态
      rechargeDialog: { visible: false },
      settingsDialog: { visible: false },
      maintenanceDialog: { visible: false },

      // 表单数据
      rechargeForm: { amount: null, remark: "" },
      settingsForm: {
        serial: "",
        meterName: "",
        bindType: "",
        logicPayType: "",
        phase: "",
        ct: 1,
        pt: 1,
        imei: "",
      },
      confirmMaintenance: false,

      // 图表实例
      powerChart: null,
    };
  },

  async mounted() {
    console.log("电表详情页组件已挂载");

    // 提取路由参数
    this.extractRouteParams();

    // 加载电表数据
    await this.loadMeterData();

    // 初始化图表
    this.initChart();

    // 处理布局变化
    this.$nextTick(() => {
      this.handleLayoutChange();
    });

    // 加载echarts
    if (typeof echarts === "undefined") {
      this.loadEcharts();
    }
  },

  beforeDestroy() {
    clearTimeout(this.resizeTimer);
    window.removeEventListener("resize", this.handleResize);

    if (this.powerChart) {
      this.powerChart.dispose();
    }
  },

  methods: {
    // 加载电表数据后更新相关数据
    updateDataFromMeter() {
      // 更新电力数据
      this.powerData = {
        peak: this.meterInfo.peak || "0.51",
        high: this.meterInfo.high || "0.87",
        flat: this.meterInfo.flat || "1.55", 
        valley: this.meterInfo.valley || "1.52",
        total: this.meterInfo.total || "4.45",
      };

      // 更新相位数据
      this.phaseData = {
        voltageA: this.meterInfo.ua || "231.9",
        voltageB: this.meterInfo.ub || "231.9",
        voltageC: this.meterInfo.uc || "231.9", 
        currentA: this.meterInfo.ia || "0.19",
        currentB: this.meterInfo.ib || "0.19",
        currentC: this.meterInfo.ic || "0.19",
        activePowerA: this.meterInfo.pa || "0.024",
        activePowerB: this.meterInfo.pb || "0.024",
        activePowerC: this.meterInfo.pc || "0.024",
        totalActivePower: this.meterInfo.p || "0.072",
        reactivePowerA: this.meterInfo.qa || "0.000", 
        reactivePowerB: this.meterInfo.qb || "0.000",
        reactivePowerC: this.meterInfo.qc || "0.000",
        totalReactivePower: this.meterInfo.q || "0.000",
        powerFactorA: "0.99",
        powerFactorB: "0.99", 
        powerFactorC: "0.99",
        totalPowerFactor: "0.99",
      };
    },

    // 提取路由参数
    extractRouteParams() {
      // 确保 routeParams 对象存在
      if (!this.routeParams) {
        this.routeParams = {};
      }
      
      this.routeParams.deviceId = this.$route.params.id || this.$route.query.deviceId;
      this.routeParams.serial = this.$route.query.serial;
      this.routeParams.meterName = this.$route.query.name;

      console.log("路由参数:", this.routeParams);

      // 设置查询参数
      if (this.routeParams.serial) {
        this.queryParams.serial = this.routeParams.serial;
      }

      // 设置默认时间范围（最近7天）
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - 7);
      
      this.queryParams.dateRange = [
        startTime.toISOString().slice(0, 19).replace('T', ' '),
        endTime.toISOString().slice(0, 19).replace('T', ' ')
      ];
    },

    // 加载电表数据
    async loadMeterData() {
      this.pageLoading = true;

      try {
        if (this.routeParams.deviceId) {
          // 调用真实接口获取电表详情
          const response = await meterPageMeterInfoByAdmin({
            id: this.routeParams.deviceId,
            page: { size: 1, current: 1 }
          });

          if (response.code === 200 && response.data && response.data.dataList.length > 0) {
            this.meterInfo = response.data.dataList[0];
            console.log("加载的电表数据:", this.meterInfo);
            
            // 更新相关数据
            this.updateDataFromMeter();
          } else {
            // 如果接口没有返回数据，使用路由参数构造基本信息
            this.meterInfo = {
              id: this.routeParams.deviceId,
              serial: this.routeParams.serial || "",
              meterName: this.routeParams.meterName || "未知电表",
              bindType: 1,
              logicPayType: 0,
              phase: 1,
              switchStatus: 0,
              onlineStatus: 1,
              imei: "",
              ct: 1,
              pt: 1,
              balance: "0.00",
              createTime: "",
              bindId: "",
              bindName: "",
              managerId: "",
            };
            
            // 更新相关数据
            this.updateDataFromMeter();
          }
        } else {
          throw new Error("缺少设备ID参数");
        }
      } catch (error) {
        console.error("加载电表数据失败:", error);
        this.$message.error("加载电表数据失败");
        
        // 使用路由参数作为后备方案
        this.meterInfo = {
          id: this.routeParams.deviceId || "",
          serial: this.routeParams.serial || "",
          meterName: this.routeParams.meterName || "未知电表",
          bindType: 1,
          logicPayType: 0,
          phase: 1,
          switchStatus: 0,
          onlineStatus: 1,
          imei: "",
          ct: 1,
          pt: 1,
          balance: "0.00",
          createTime: "",
          bindId: "",
          bindName: "",
          managerId: "",
        };
        
        // 更新相关数据
        this.updateDataFromMeter();
      } finally {
        this.pageLoading = false;
      }
    },

    // 获取电表类型标签
    getBindTypeLabel(type) {
      const typeMap = {
        1: "专用表",
        2: "公摊表", 
        3: "公式表"
      };
      return typeMap[type] || "未知";
    },

    // 获取付费模式标签
    getPayTypeLabel(type) {
      const typeMap = {
        0: "预付费",
        1: "强控"
      };
      return typeMap[type] || "未知";
    },

    // 获取电表相位标签
    getPhaseLabel(phase) {
      const phaseMap = {
        1: "单相",
        3: "三相"
      };
      return phaseMap[phase] || "未知";
    },

    // 获取监控类型标签
    getMonitorTypeLabel(type) {
      const typeMap = {
        1: "电能表",
        2: "预付费表", 
        3: "远程表"
      };
      return typeMap[type] || "电能表";
    },

    // 获取余额状态样式
    getBalanceStatusClass(balance) {
      const amount = parseFloat(balance) || 0;
      if (amount <= 0) return "balance-empty";
      if (amount < 50) return "balance-low";
      return "balance-normal";
    },

    // 获取余额状态文本
    getBalanceStatusText(balance) {
      const amount = parseFloat(balance) || 0;
      if (amount <= 0) return "余额不足";
      if (amount < 50) return "余额偏低";
      return "余额充足";
    },

    // 获取事件标签类型
    getEventTagType(eventType) {
      const typeMap = {
        "在线": "success",
        "离线": "danger",
        "分合闸操作": "warning",
        "数据上报": "info",
        "报警": "danger",
      };
      return typeMap[eventType] || "";
    },

    // 处理绑定信息点击
    handleBindClick(meterInfo) {
      console.log("点击绑定信息:", meterInfo);
      // if (meterInfo.bindId) {
      //   this.$router.push({
      //     path: "/project-tenement-detail",
      //     query: { 
      //       id: meterInfo.bindId, 
      //       managerId: meterInfo.managerId 
      //     }
      //   });
      // }
    },

    // 分合闸控制
    async handleSwitchControl() {
      // 如果是预付费模式，需要先修改为强控
      if (this.meterInfo.logicPayType === 0 || this.meterInfo.logicPayType === "0") {
        this.$message.warning("预付费模式下不能直接操作分合闸，请先修改为强控模式");
        return;
      }

      const targetStatus = this.meterInfo.switchStatus == 1 ? 0 : 1;
      const actionText = targetStatus == 1 ? "合闸" : "分闸";

      try {
        await this.$confirm(
          `确定要对电表"${this.meterInfo.meterName}"执行${actionText}操作吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        this.switchLoading = true;

        const response = await tenantDoMeterSwitchOffOn({
          meterId: this.meterInfo.id,
          type: targetStatus,
        });

        if (response.code === 200) {
          this.meterInfo.switchStatus = targetStatus;
          this.$message.success(`${actionText}操作成功`);
        } else {
          this.$message.error(response.msg || `${actionText}操作失败`);
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error(`${actionText}操作失败`);
          console.error("分合闸控制失败:", error);
        }
      } finally {
        this.switchLoading = false;
      }
    },

    // 显示充值弹窗
    showRechargeDialog() {
      this.rechargeForm = { amount: null, remark: "" };
      this.rechargeDialog.visible = true;
    },

    // 显示设置弹窗
    showSettingsDialog() {
      this.settingsForm = {
        serial: this.meterInfo.serial,
        meterName: this.meterInfo.meterName,
        bindType: this.meterInfo.bindType,
        logicPayType: this.meterInfo.logicPayType,
        phase: this.meterInfo.phase,
        ct: this.meterInfo.ct,
        pt: this.meterInfo.pt,
        imei: this.meterInfo.imei,
      };
      this.settingsDialog.visible = true;
    },

    // 显示维护弹窗
    showMaintenanceDialog() {
      this.confirmMaintenance = false;
      this.maintenanceDialog.visible = true;
    },

    // 保存设置
    async saveSettings() {
      try {
        const response = await meterUpdateMeterBase({
          id: this.meterInfo.id,
          ...this.settingsForm,
        });

        if (response.code === 200) {
          // 更新本地数据
          Object.assign(this.meterInfo, this.settingsForm);
          this.settingsDialog.visible = false;
          this.$message.success("参数设置保存成功");
        } else {
          this.$message.error(response.msg || "参数设置保存失败");
        }
      } catch (error) {
        this.$message.error("参数设置保存失败");
        console.error("保存设置失败:", error);
      }
    },

    // 处理充值
    async handleRecharge() {
      if (!this.rechargeForm.amount) {
        this.$message.warning("请输入充值金额");
        return;
      }

      try {
        // 这里应该调用实际的充值接口
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // 更新余额
        const currentBalance = parseFloat(this.meterInfo.balance) || 0;
        const newBalance = currentBalance + this.rechargeForm.amount;
        this.meterInfo.balance = newBalance.toFixed(2);
        
        this.rechargeDialog.visible = false;
        this.$message.success(
          `电费充值成功！充值金额：¥${this.rechargeForm.amount}`
        );
      } catch (error) {
        this.$message.error("充值失败");
        console.error("充值失败:", error);
      }
    },

    // 处理维护
    async handleMaintenance() {
      try {
        // 这里应该调用实际的维护接口
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        this.maintenanceDialog.visible = false;
        this.$message.success("设备维护操作成功");
      } catch (error) {
        this.$message.error("维护操作失败");
        console.error("维护失败:", error);
      }
    },

    // 查询数据
    queryData() {
      this.$message.info("查询数据中...");
      // 重新绘制图表
      if (this.powerChart) {
        this.updateChart();
      }
    },

    // 返回上一页
    goBack() {
      this.$router.go(-1);
    },

    // 加载ECharts
    loadEcharts() {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js";
      script.onload = () => {
        this.initChart();
      };
      document.head.appendChild(script);
    },

    // 处理布局变化
    handleLayoutChange() {
      this.resizeTimer = setTimeout(() => {
        if (this.powerChart) {
          this.powerChart.resize();
        }
      }, 350);
    },

    // 防抖的resize处理
    handleResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        if (this.powerChart) {
          this.powerChart.resize();
        }
      }, 100);
    },

    // 初始化图表
    initChart() {
      this.$nextTick(() => {
        if (typeof echarts !== "undefined") {
          const chartDom = this.$refs.powerChart;
          if (chartDom) {
            this.powerChart = echarts.init(chartDom);
            this.updateChart();

            // 监听窗口大小变化
            window.addEventListener("resize", this.handleResize);
          }
        }
      });
    },

    // 更新图表
    updateChart() {
      if (!this.powerChart) return;

      // 生成用电数据
      const dates = [];
      const powerConsumption = [];

      for (let i = 1; i <= 14; i++) {
        const day = String(i).padStart(2, "0");
        const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
        const weekday = weekdays[(i - 1) % 7];
        dates.push(`08/${day}\n${weekday}`);

        // 模拟用电量数据，工作日用电量较高
        if ([1, 2, 3, 4, 5].includes(i % 7)) {
          powerConsumption.push(Math.floor(Math.random() * 50) + 80); // 工作日 80-130
        } else {
          powerConsumption.push(Math.floor(Math.random() * 30) + 40); // 周末 40-70
        }
      }

      const option = {
        backgroundColor: "#ffffff",
        grid: {
          left: "60px",
          right: "40px",
          top: "30px",
          bottom: "60px",
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#ffffff",
          borderColor: "#e8e8e8",
          borderWidth: 1,
          textStyle: {
            color: "#262626",
            fontSize: 13,
          },
          padding: [12, 16],
          formatter: function (params) {
            const data = params[0];
            return `
              <div style="line-height: 1.6;">
                <div style="font-weight: 500; margin-bottom: 6px; color: #262626;">${data.name}</div>
                <div style="color: #1890ff; font-size: 14px;">
                  <span style="display: inline-block; width: 6px; height: 6px; background: #1890ff; border-radius: 50%; margin-right: 8px;"></span>
                  用电量: ${data.value} kWh
                </div>
              </div>
            `;
          },
        },
        xAxis: {
          type: "category",
          data: dates,
          axisTick: {
            show: false,
          },
          axisLine: {
            show: false,
          },
          axisLabel: {
            color: "#8c8c8c",
            fontSize: 12,
            lineHeight: 14,
            margin: 12,
          },
        },
        yAxis: {
          type: "value",
          min: 0,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: "#8c8c8c",
            fontSize: 12,
            formatter: "{value}kWh",
          },
          splitLine: {
            lineStyle: {
              color: "#f0f0f0",
              width: 1,
              type: "solid",
            },
          },
        },
        series: [
          {
            data: powerConsumption,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 4,
            lineStyle: {
              color: "#1890ff",
              width: 2,
            },
            itemStyle: {
              color: "#1890ff",
            },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(24, 144, 255, 0.1)",
                  },
                  {
                    offset: 1,
                    color: "rgba(24, 144, 255, 0.02)",
                  },
                ],
              },
            },
          },
        ],
      };

      this.powerChart.setOption(option);
    },
  },
};
</script>

<style lang="scss" scoped>
.meter-detail-page {
  padding: 16px 20px;
  background: #f5f5f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

// 简单加载动画
.page-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  .loading-content {
    text-align: center;
    padding: 40px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    .loading-spinner {
      margin-bottom: 20px;
      font-size: 32px;
      color: #1890ff;

      i {
        animation: rotate 1s linear infinite;
      }
    }

    .loading-text {
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.page-content {
  display: flex;
  gap: 20px;
}

.device-info-panel {
  width: 320px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  height: fit-content;
}

.device-header {
  margin-bottom: 20px;

  .device-name {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #262626;
  }

  .device-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.device-basic {
  display: flex;
  margin-bottom: 24px;

  .device-image {
    width: 80px;
    height: 80px;
    margin-right: 16px;
    background: linear-gradient(135deg, #dddddd 0%, #8eb1ff 100%);
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    
    img {
        width: 80%;
        height: 80%;
        border-radius: 4px;
    }
}

  .device-meta {
    flex: 1;

    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      padding: 4px 0;

      .label {
        color: #8c8c8c;
        width: 70px;
        font-weight: 500;
      }

      .value {
        color: #262626;
        font-weight: 500;
        text-align: right;

        &.balance {
          color: #52c41a;
          font-weight: 500;
        }

        &.status-open {
          color: #52c41a;
        }

        &.status-closed {
          color: #ff4d4f;
        }
      }
    }
  }
}

.device-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;

  .switch-button,
  .control-button {
    width: 100%;
    height: 36px;
    font-size: 14px;
    border-radius: 6px;
    font-weight: 500;
  }

  .switch-button {
    &.el-button--primary {
      background: #1890ff;
      border-color: #1890ff;
    }

    &.el-button--warning {
      background: #faad14;
      border-color: #faad14;
    }
  }

  .control-button {
    background: #ffffff;
    border: 1px solid #d9d9d9;
    color: #595959;

    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
  }
}

.device-details {
  .detail-section {
    margin-bottom: 24px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #262626;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-list {
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f5f5f5;
        font-size: 13px;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #8c8c8c;
          font-weight: 500;
        }

        .value {
          color: #262626;
          font-weight: 500;
        }
      }
    }

    .bind-info-list {
      .bind-item {
        padding: 8px 12px;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #1890ff;
          background: #f6f9fc;
        }

        .bind-id {
          font-size: 13px;
          font-weight: 600;
          color: #262626;
        }

        .bind-name {
          font-size: 12px;
          color: #8c8c8c;
          margin-top: 2px;
        }
      }

      .no-bind {
        color: #8c8c8c;
        font-size: 13px;
        text-align: center;
        padding: 20px;
      }
    }

    .balance-info {
      padding: 12px;
      background: #f6f9fc;
      border-radius: 6px;
      border: 1px solid #e6f7ff;
      text-align: center;

      .balance-amount {
        font-size: 24px;
        font-weight: 700;
        color: #1890ff;
        margin-bottom: 8px;
      }

      .balance-status {
        font-size: 12px;

        .balance-normal {
          color: #52c41a;
        }

        .balance-low {
          color: #faad14;
        }

        .balance-empty {
          color: #ff4d4f;
        }
      }
    }
  }
}

.data-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.latest-data-section {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #262626;
    }

    .update-time {
      font-size: 12px;
      color: #8c8c8c;
      font-weight: 500;
    }
  }

.data-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #f0f0f0;
  margin: 20px;
  border: 1px solid #e8e8e8;

  .overview-item {
    background: white;
    padding: 12px;

    .label {
      display: block;
      font-size: 12px;
      color: #8c8c8c;
      margin-bottom: 4px;
    }

    .value {
      font-size: 13px;
      color: #262626;
    }
  }
}

.power-params-table {
  margin: 0 20px 20px 20px;

  .params-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    border: 1px solid #e8e8e8;

    th,
    td {
      border: 1px solid #e8e8e8;
      padding: 8px 12px;
      text-align: center;
      font-size: 13px;
    }

    th {
      background: #fafafa;
      font-weight: 500;
      color: #262626;
    }

    td {
      color: #595959;
    }

    .row-label {
      background: #fafafa;
      font-weight: 500;
      color: #262626;
    }
  }
}
}

.chart-section {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;

  .chart-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;

    .chart-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;

      .control-group {
        display: flex;
        align-items: center;
        gap: 8px;

        .control-label {
          font-size: 13px;
          color: #595959;
          font-weight: 500;
          white-space: nowrap;
        }
      }
    }

    .tab-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
}

.chart-container {
  padding: 20px;

  .chart-stats {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #e6f7ff;
      border-radius: 6px;
      border: 1px solid #91d5ff;

      .stat-label {
        font-size: 13px;
        color: #8c8c8c;
        font-weight: 500;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: #262626;
      }

      .stat-unit {
        font-size: 13px;
        color: #8c8c8c;
        margin-left: -4px;
      }

      .stat-change {
        font-size: 12px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 3px;

        &.increase {
          color: #52c41a;
          background: rgba(82, 196, 26, 0.1);
        }

        &.decrease {
          color: #ff4d4f;
          background: rgba(255, 77, 79, 0.1);
        }
      }
    }
  }

  .power-chart {
    height: 300px;
    background: #ffffff;
    border-radius: 6px;
    border: 1px solid #f0f0f0;
  }
}

.events-container {
  padding: 20px;

  .events-table {
    ::v-deep .el-table {
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      overflow: hidden;

      .el-table__header {
        th {
          background: #fafafa;
          color: #262626;
          font-weight: 600;
          border-bottom: 1px solid #e8e8e8;
        }
      }

      .el-table__body {
        tr:hover > td {
          background: #f6f9fc;
        }
      }
    }
  }
}

.reading-records {
  padding: 40px 20px;

  .records-placeholder {
    text-align: center;
    padding: 60px 20px;
    background: #fafafa;
    border-radius: 6px;
    border: 1px dashed #d9d9d9;

    .placeholder-icon {
      font-size: 48px;
      color: #d9d9d9;
      margin-bottom: 16px;

      i {
        font-size: inherit;
      }
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #8c8c8c;
      font-weight: 500;
    }
  }
}

// 弹窗样式优化
::v-deep .el-dialog {
  border-radius: 8px;
  overflow: hidden;

  .el-dialog__header {
    background: #fafafa;
    padding: 16px 20px;
    border-bottom: 1px solid #e8e8e8;

    .el-dialog__title {
      color: #262626;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 12px 20px;
    background: #fafafa;
    border-top: 1px solid #e8e8e8;
  }

  .el-form-item__label {
    font-size: 13px;
    font-weight: 500;
    color: #595959;
  }

  .el-input__inner,
  .el-textarea__inner {
    font-size: 13px;
    border-radius: 4px;
    border: 1px solid #d9d9d9;

    &:focus {
      border-color: #1890ff;
    }
  }

  .el-button {
    font-size: 13px;
    font-weight: 500;
    padding: 0 15px;
    height: 32px;
    border-radius: 4px;

    &.el-button--primary {
      background: #1890ff;
      border-color: #1890ff;
    }

    &.el-button--warning {
      background: #faad14;
      border-color: #faad14;
    }
  }
}

.maintenance-content {
  ::v-deep .el-alert {
    border-radius: 6px;
    border: 1px solid #91d5ff;
    background: #e6f7ff;

    .el-alert__title {
      font-size: 14px;
      font-weight: 600;
    }

    .el-alert__description {
      font-size: 13px;
      margin-top: 8px;
    }
  }

  .el-checkbox {
    margin-top: 20px;
    font-size: 13px;
    font-weight: 500;
  }
}

// 响应式布局
@media (max-width: 1200px) {
  .page-content {
    flex-direction: column;
  }

  .device-info-panel {
    width: 100%;
  }

  .params-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .meter-detail-page {
    padding: 12px;
  }

  .page-content {
    gap: 12px;
  }

  .device-basic {
    flex-direction: column;
    align-items: center;
    text-align: center;

    .device-image {
      margin: 0 0 16px 0;
    }
  }

  .status-overview {
    flex-direction: column !important;
    gap: 12px !important;
  }

  .params-grid {
    grid-template-columns: 1fr !important;
  }

  .chart-header {
    .chart-controls {
      flex-direction: column;
      align-items: stretch;

      .control-group {
        width: 100%;
      }
    }
  }
}
</style>