<template>
  <div class="water-meter-detail-page">
    <div v-if="pageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="water-drop-loader">
            <div class="drop"></div>
            <div class="ripple"></div>
          </div>
        </div>
        <div class="loading-text">正在加载水表详情...</div>
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
            {{ waterMeterInfo.waterName }}
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
            <div class="water-meter-icon">
              <svg viewBox="0 0 100 100" width="60" height="60">
                <!-- 水表外圆 -->
                <circle cx="50" cy="50" r="45" fill="none" stroke="#666" stroke-width="3"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="#999" stroke-width="2"/>
                <!-- 指针 -->
                <line x1="50" y1="50" x2="50" y2="25" stroke="#333" stroke-width="3" stroke-linecap="round"/>
                <!-- 刻度 -->
                <g stroke="#666" stroke-width="1">
                  <line x1="50" y1="10" x2="50" y2="15"/>
                  <line x1="85" y1="35" x2="80" y2="37"/>
                  <line x1="85" y1="65" x2="80" y2="63"/>
                  <line x1="50" y1="90" x2="50" y2="85"/>
                  <line x1="15" y1="65" x2="20" y2="63"/>
                  <line x1="15" y1="35" x2="20" y2="37"/>
                </g>
                <!-- 中心点 -->
                <circle cx="50" cy="50" r="3" fill="#333"/>
              </svg>
            </div>
          </div>
          <div class="device-meta">
            <div class="meta-row">
              <span class="label">设备号</span>
              <span class="value">{{ waterMeterInfo.serial }}</span>
            </div>
            <div class="meta-row">
              <span class="label">水表编号</span>
              <span class="value">{{ waterMeterInfo.id }}</span>
            </div>
            <div class="meta-row">
              <span class="label">水表类型</span>
              <span class="value">{{ getBindTypeLabel(waterMeterInfo.bindType) }}</span>
            </div>
            <div class="meta-row">
              <span class="label">阀控支持</span>
              <span class="value">{{ waterMeterInfo.withSwitch ? '支持' : '不支持' }}</span>
            </div>
            <div class="meta-row">
              <span class="label">付费模式</span>
              <span class="value">{{ getPayTypeLabel(waterMeterInfo.logicPayType) }}</span>
            </div>
            <div class="meta-row">
              <span class="label">阀门状态</span>
              <span class="value" :class="{'status-open': waterMeterInfo.switchStatus == 1, 'status-closed': waterMeterInfo.switchStatus == 0}">
                {{ waterMeterInfo.switchStatus == 1 ? '开阀' : '关阀' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="device-controls" v-if="waterMeterInfo.withSwitch">
          <div class="button-wrapper">
            <el-button
              :type="waterMeterInfo.switchStatus == 0 ? 'primary' : 'warning'"
              @click="handleValveControl"
              :loading="valveLoading"
              class="valve-button"
            >
              {{ waterMeterInfo.switchStatus == 0 ? "开启阀门" : "关闭阀门" }}
            </el-button>
          </div>
          <div class="button-wrapper">
            <el-button @click="showSettingsDialog" class="control-button">
              参数设置
            </el-button>
          </div>
          <div class="button-wrapper">
            <el-button @click="showRechargeDialog" class="control-button">
              水费充值
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
                <span class="label">厂家号</span>
                <span class="value">{{ waterMeterInfo.mfrsNo || "-" }}</span>
              </div>
              <div class="detail-item">
                <span class="label">设备型号</span>
                <span class="value">{{ waterMeterInfo.waterModel || "-" }}</span>
              </div>
              <div class="detail-item">
                <span class="label">接入渠道</span>
                <span class="value">{{ getWaterTypeLabel(waterMeterInfo.waterType) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">创建时间</span>
                <span class="value">{{ waterMeterInfo.createTime || "-" }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>绑定信息</h4>
            <div class="bind-info-list">
              <div v-if="waterMeterInfo.waterBindDtoList && waterMeterInfo.waterBindDtoList.length > 0">
                <div 
                  v-for="(bind, index) in waterMeterInfo.waterBindDtoList" 
                  :key="index"
                  class="bind-item"
                  @click="handleBindClick(bind)"
                >
                  <div class="bind-id">{{ bind.bindId }}</div>
                  <div class="bind-name">{{ bind.bindName }}</div>
                </div>
              </div>
              <div v-else class="no-bind">暂无绑定信息</div>
            </div>
          </div>

          <div class="detail-section" v-if="waterMeterInfo.waterPriceDto">
            <h4>计费方案</h4>
            <div class="price-info">
              <div class="price-name">{{ waterMeterInfo.waterPriceDto.name }}</div>
              <div class="price-details">点击查看详情</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧数据展示 -->
      <div class="data-panel">
        <!-- 最新数据 -->
        <div class="latest-data-section">
          <div class="section-header">
            <h3>设备状态监控</h3>
            <span class="update-time">更新时间: {{ new Date().toLocaleString() }}</span>
          </div>

          <div class="status-overview">
            <div class="status-item">
              <div class="status-icon online">
                <i class="el-icon-connection"></i>
              </div>
              <div class="status-info">
                <div class="status-label">通信状态</div>
                <div class="status-value">在线</div>
              </div>
            </div>
            <div class="status-item">
              <div class="status-icon" :class="waterMeterInfo.switchStatus == 1 ? 'normal' : 'warning'">
                <i class="el-icon-switch-button"></i>
              </div>
              <div class="status-info">
                <div class="status-label">阀门状态</div>
                <div class="status-value">{{ waterMeterInfo.switchStatus == 1 ? '开启' : '关闭' }}</div>
              </div>
            </div>
            <div class="status-item">
              <div class="status-icon normal">
                <i class="el-icon-data-analysis"></i>
              </div>
              <div class="status-info">
                <div class="status-label">计量状态</div>
                <div class="status-value">正常</div>
              </div>
            </div>
          </div>

          <!-- 设备运行参数 -->
          <div class="params-grid">
            <div class="param-card">
              <div class="param-label">累计用水量</div>
              <div class="param-value">{{ mockData.totalUsage }} <span class="unit">L</span></div>
              <div class="param-trend">
                <i class="el-icon-top trend-up"></i>
                <span>+{{ mockData.dailyIncrease }}L 今日</span>
              </div>
            </div>
            <div class="param-card">
              <div class="param-label">当前流量</div>
              <div class="param-value">{{ mockData.currentFlow }} <span class="unit">L/min</span></div>
              <div class="param-trend">
                <i class="el-icon-minus trend-stable"></i>
                <span>稳定</span>
              </div>
            </div>
            <div class="param-card">
              <div class="param-label">水压</div>
              <div class="param-value">{{ mockData.pressure }} <span class="unit">MPa</span></div>
              <div class="param-trend">
                <i class="el-icon-top trend-up"></i>
                <span>正常范围</span>
              </div>
            </div>
            <div class="param-card">
              <div class="param-label">信号强度</div>
              <div class="param-value">{{ mockData.signalStrength }} <span class="unit">dBm</span></div>
              <div class="param-trend">
                <i class="el-icon-top trend-up"></i>
                <span>信号良好</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据查询和图表 -->
        <div class="chart-section">
          <div class="chart-header">
            <div class="chart-controls">
              <div class="control-group">
                <span class="control-label">设备号</span>
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
                <el-radio-button label="用水趋势">用水趋势</el-radio-button>
                <el-radio-button label="设备事件">设备事件</el-radio-button>
                <el-radio-button label="抄表记录">抄表记录</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- 用水趋势图表 -->
          <div v-show="activeTab === '用水趋势'" class="chart-container">
            <div class="chart-stats">
              <div class="stat-item">
                <span class="stat-label">本月总用水量</span>
                <span class="stat-value">{{ chartStats.totalWaterConsumption }}</span>
                <span class="stat-unit">L</span>
                <span class="stat-change" :class="chartStats.changeClass">
                  {{ chartStats.changePercent }}%
                </span>
              </div>
            </div>
            <div ref="waterChart" class="water-chart"></div>
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
                <el-table-column prop="valveStatus" label="阀门状态" width="100"/>
                <el-table-column prop="pressure" label="水压值" width="100"/>
                <el-table-column prop="flow" label="流量值" width="100"/>
                <el-table-column prop="signalStrength" label="信号强度" width="120"/>
                <el-table-column prop="remark" label="备注"/>
              </el-table>
            </div>
          </div>

          <!-- 抄表记录 -->
          <div v-show="activeTab === '抄表记录'"  class="events-container">
            <el-table
      :data="readingRecords"
      style="width: 100%"
      stripe
      size="small"
    >
      <el-table-column prop="time" label="抄表时间" width="160"/>
      <el-table-column prop="type" label="抄表类型" width="100">
        <template slot-scope="scope">
          <el-tag size="mini" :type="getReadingTagType(scope.row.type)">
            {{ scope.row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="currentReading" label="本次读数(L)" width="120"/>
      <el-table-column prop="lastReading" label="上次读数(L)" width="120"/>
      <el-table-column prop="consumption" label="用水量(L)" width="100">
        <template slot-scope="scope">
          <span style="color: #1890ff; font-weight: 500;">{{ scope.row.consumption }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="readingMethod" label="抄表方式" width="100"/>
      <el-table-column prop="operator" label="抄表人" width="100">
        <template slot-scope="scope">
          <span :style="scope.row.operator === '系统自动' ? 'color: #67C23A' : 'color: #409EFF'">
            {{ scope.row.operator }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="120"/>
    </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <el-dialog
      title="水费充值"
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
        <el-form-item label="设备号">
          <el-input v-model="settingsForm.serial" disabled />
        </el-form-item>
        <el-form-item label="水表名称" required>
          <el-input v-model="settingsForm.waterName" />
        </el-form-item>
        <el-form-item label="水表类型" required>
          <el-select v-model="settingsForm.bindType" style="width: 100%">
            <el-option label="专用表" :value="1" />
            <el-option label="公摊表" :value="2" />
            <el-option label="公式表" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="settingsForm.waterModel" />
        </el-form-item>
        <el-form-item label="厂家号">
          <el-input v-model="settingsForm.mfrsNo" />
        </el-form-item>
        <el-form-item label="阀门控制">
          <el-switch v-model="settingsForm.withSwitch" />
        </el-form-item>
        <el-form-item label="付费模式" v-if="settingsForm.withSwitch">
          <el-select v-model="settingsForm.logicPayType" style="width: 100%">
            <el-option label="预付费" :value="0" />
            <el-option label="强控" :value="1" />
          </el-select>
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
  waterPageWater,
  waterDoWaterSwitch,
  waterUpdateWater,
} from "@/api/water";

export default {
  name: "WaterMeterDetail",
  data() {
    return {
      pageLoading: true,
      resizeTimer: null,

      // 路由参数存储
      routeParams: {
        deviceId: null,
        serial: null,
        waterName: null,
      },
      
      // 水表基本信息 - 基于真实接口数据结构
      waterMeterInfo: {
        id: "",
        serial: "",
        waterName: "",
        bindType: "",
        withSwitch: false,
        switchStatus: 0,
        logicPayType: "",
        mfrsNo: "",
        waterModel: "",
        waterType: "",
        createTime: "",
        waterBindDtoList: [],
        waterPriceDto: null,
      },

      // 模拟运行数据
      mockData: {
        totalUsage: "1,245.8",
        dailyIncrease: "128.5",
        currentFlow: "12.5",
        pressure: "0.85",
        signalStrength: "-65",
      },

      // 图表统计数据
      chartStats: {
        totalWaterConsumption: "2,126.6",
        changePercent: 8.3,
        changeClass: "increase",
      },

      // 查询参数
      queryParams: {
        serial: "",
        dateRange: [],
      },

      // 活跃标签页
      activeTab: "用水趋势",

      // 设备事件列表
      deviceEvents: [
        {
          id: 1,
          time: "2025-08-08 02:15:30",
          type: "在线",
          valveStatus: "开启",
          pressure: "0.85MPa",
          flow: "12.5L/min",
          signalStrength: "-65dBm",
          remark: "正常运行",
        },
        {
          id: 2,
          time: "2025-08-08 08:20:45",
          type: "阀门操作",
          valveStatus: "开启",
          pressure: "0.83MPa",
          flow: "15.2L/min",
          signalStrength: "-68dBm",
          remark: "用户开启阀门",
        },
        {
          id: 3,
          time: "2025-08-08 14:30:12",
          type: "数据上报",
          valveStatus: "开启",
          pressure: "0.86MPa",
          flow: "8.7L/min",
          signalStrength: "-62dBm",
          remark: "定时数据上报",
        },
      ],
      readingRecords: [
      {
        id: 1,
        time: "2025-08-08 09:00:00",
        type: "系统抄表",
        currentReading: "1,245.85",
        lastReading: "1,187.32",
        consumption: "58.53",
        readingMethod: "远程自动",
        operator: "系统自动",
        remark: "定时自动抄表"
      },
      {
        id: 2,
        time: "2025-08-07 09:00:00", 
        type: "系统抄表",
        currentReading: "1,187.32",
        lastReading: "1,132.78",
        consumption: "54.54",
        readingMethod: "远程自动",
        operator: "系统自动",
        remark: "定时自动抄表"
      },
      {
        id: 3,
        time: "2025-08-06 14:30:00",
        type: "人工抄表",
        currentReading: "1,132.78",
        lastReading: "1,089.45",
        consumption: "43.33",
        readingMethod: "现场读取",
        operator: "张师傅",
        remark: "月度现场核验抄表"
      }
    ],

      // 控制状态
      valveLoading: false,

      // 弹窗状态
      rechargeDialog: { visible: false },
      settingsDialog: { visible: false },
      maintenanceDialog: { visible: false },

      // 表单数据
      rechargeForm: { amount: null, remark: "" },
      settingsForm: {
        serial: "",
        waterName: "",
        bindType: "",
        waterModel: "",
        mfrsNo: "",
        withSwitch: false,
        logicPayType: "",
      },
      confirmMaintenance: false,

      // 图表实例
      waterChart: null,
    };
  },

  async mounted() {
    console.log("水表详情页组件已挂载");

    // 提取路由参数
    this.extractRouteParams();

    // 加载水表数据
    await this.loadWaterMeterData();

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

    if (this.waterChart) {
      this.waterChart.dispose();
    }
  },

  methods: {
      // 获取抄表类型标签样式
  getReadingTagType(readingType) {
    const typeMap = {
      "系统抄表": "success",
      "人工抄表": "primary",
      "补录抄表": "warning",
      "异常抄表": "danger"
    };
    return typeMap[readingType] || "";
  },
    // 提取路由参数
    extractRouteParams() {
      this.routeParams.deviceId = this.$route.params.id || this.$route.query.deviceId;
      this.routeParams.serial = this.$route.query.serial;
      this.routeParams.waterName = this.$route.query.name;

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

    // 加载水表数据
    async loadWaterMeterData() {
      this.pageLoading = true;

      try {
        if (this.routeParams.deviceId) {
          // 调用真实接口获取水表详情
          const response = await waterPageWater({
            id: this.routeParams.deviceId,
            page: { size: 1, current: 1 }
          });

          if (response.code === 200 && response.data && response.data.dataList.length > 0) {
            this.waterMeterInfo = response.data.dataList[0];
            console.log("加载的水表数据:", this.waterMeterInfo);
          } else {
            // 如果接口没有返回数据，使用路由参数构造基本信息
            this.waterMeterInfo = {
              id: this.routeParams.deviceId,
              serial: this.routeParams.serial || "",
              waterName: this.routeParams.waterName || "未知水表",
              bindType: 1,
              withSwitch: false,
              switchStatus: 0,
              logicPayType: 0,
              mfrsNo: "",
              waterModel: "",
              waterType: "",
              createTime: "",
              waterBindDtoList: [],
              waterPriceDto: null,
            };
          }
        } else {
          throw new Error("缺少设备ID参数");
        }
      } catch (error) {
        console.error("加载水表数据失败:", error);
        this.$message.error("加载水表数据失败");
        
        // 使用路由参数作为后备方案
        this.waterMeterInfo = {
          id: this.routeParams.deviceId || "",
          serial: this.routeParams.serial || "",
          waterName: this.routeParams.waterName || "未知水表",
          bindType: 1,
          withSwitch: false,
          switchStatus: 0,
          logicPayType: 0,
          mfrsNo: "",
          waterModel: "",
          waterType: "",
          createTime: "",
          waterBindDtoList: [],
          waterPriceDto: null,
        };
      } finally {
        this.pageLoading = false;
      }
    },

    // 获取水表类型标签
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

    // 获取接入渠道标签
    getWaterTypeLabel(type) {
      const typeMap = {
        "YYWL_YY": "云易物联"
      };
      return typeMap[type] || type || "未知";
    },

    // 获取事件标签类型
    getEventTagType(eventType) {
      const typeMap = {
        "在线": "success",
        "离线": "danger",
        "阀门操作": "warning",
        "数据上报": "info",
        "报警": "danger",
      };
      return typeMap[eventType] || "";
    },

    // 处理绑定信息点击
    handleBindClick(bindInfo) {
      console.log("点击绑定信息:", bindInfo);
      // 可以跳转到租户详情页面
      // this.$router.push({
      //   path: "/tenant-detail",
      //   query: { id: bindInfo.bindId }
      // });
    },

    // 阀门控制
    async handleValveControl() {
      if (!this.waterMeterInfo.withSwitch) {
        this.$message.warning("该水表不支持阀控操作");
        return;
      }

      const targetStatus = this.waterMeterInfo.switchStatus == 1 ? 0 : 1;
      const actionText = targetStatus == 1 ? "开阀" : "关阀";

      try {
        await this.$confirm(
          `确定要对水表"${this.waterMeterInfo.waterName}"执行${actionText}操作吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        this.valveLoading = true;

        const response = await waterDoWaterSwitch({
          waterId: this.waterMeterInfo.id,
          type: targetStatus,
        });

        if (response.code === 200) {
          this.waterMeterInfo.switchStatus = targetStatus;
          this.$message.success(`${actionText}操作成功`);
        } else {
          this.$message.error(response.msg || `${actionText}操作失败`);
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error(`${actionText}操作失败`);
          console.error("阀门控制失败:", error);
        }
      } finally {
        this.valveLoading = false;
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
        serial: this.waterMeterInfo.serial,
        waterName: this.waterMeterInfo.waterName,
        bindType: this.waterMeterInfo.bindType,
        waterModel: this.waterMeterInfo.waterModel,
        mfrsNo: this.waterMeterInfo.mfrsNo,
        withSwitch: this.waterMeterInfo.withSwitch,
        logicPayType: this.waterMeterInfo.logicPayType,
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
        const response = await waterUpdateWater({
          id: this.waterMeterInfo.id,
          ...this.settingsForm,
        });

        if (response.code === 200) {
          // 更新本地数据
          Object.assign(this.waterMeterInfo, this.settingsForm);
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
        
        this.rechargeDialog.visible = false;
        this.$message.success(
          `水费充值成功！充值金额：¥${this.rechargeForm.amount}`
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
      if (this.waterChart) {
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
        if (this.waterChart) {
          this.waterChart.resize();
        }
      }, 350);
    },

    // 防抖的resize处理
    handleResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        if (this.waterChart) {
          this.waterChart.resize();
        }
      }, 100);
    },

    // 初始化图表
    initChart() {
      this.$nextTick(() => {
        if (typeof echarts !== "undefined") {
          const chartDom = this.$refs.waterChart;
          if (chartDom) {
            this.waterChart = echarts.init(chartDom);
            this.updateChart();

            // 监听窗口大小变化
            window.addEventListener("resize", this.handleResize);
          }
        }
      });
    },

    // 更新图表
    updateChart() {
      if (!this.waterChart) return;

      // 生成用水数据
      const dates = [];
      const waterConsumption = [];

      for (let i = 1; i <= 14; i++) {
        const day = String(i).padStart(2, "0");
        const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
        const weekday = weekdays[(i - 1) % 7];
        dates.push(`08/${day}\n${weekday}`);

        // 模拟用水量数据
        waterConsumption.push(Math.floor(Math.random() * 200) + 100);
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
                  用水量: ${data.value} L
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
            formatter: "{value}L",
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
            data: waterConsumption,
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

      this.waterChart.setOption(option);
    },
  },
};
</script>

<style lang="scss" scoped>
.water-meter-detail-page {
  padding: 16px 20px;
  background: #f5f5f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

// 水滴加载动画
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

      .water-drop-loader {
        position: relative;
        width: 60px;
        height: 60px;
        margin: 0 auto;

        .drop {
          width: 20px;
          height: 28px;
          background: #1890ff;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: dropFall 2s infinite ease-in-out;
        }

        .ripple {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #1890ff;
          border-radius: 50%;
          animation: rippleExpand 2s infinite ease-out;
        }
      }
    }

    .loading-text {
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

@keyframes dropFall {
  0%, 100% {
    transform: translate(-50%, -70%);
  }
  50% {
    transform: translate(-50%, -30%);
  }
}

@keyframes rippleExpand {
  0% {
    width: 4px;
    height: 4px;
    opacity: 1;
  }
  100% {
    width: 30px;
    height: 30px;
    opacity: 0;
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
    background: #f5f5f5;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #e8e8e8;
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

  .valve-button,
  .control-button {
    width: 100%;
    height: 36px;
    font-size: 14px;
    border-radius: 6px;
    font-weight: 500;
  }

  .valve-button {
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

    .price-info {
      padding: 12px;
      background: #f6f9fc;
      border-radius: 6px;
      border: 1px solid #e6f7ff;
      cursor: pointer;

      &:hover {
        background: #e6f7ff;
      }

      .price-name {
        font-size: 14px;
        font-weight: 600;
        color: #1890ff;
      }

      .price-details {
        font-size: 12px;
        color: #8c8c8c;
        margin-top: 4px;
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

  .status-overview {
    display: flex;
    gap: 20px;
    padding: 20px;

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      flex: 1;

      .status-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;

        &.online {
          background: #f6ffed;
          color: #52c41a;
        }

        &.normal {
          background: #e6f7ff;
          color: #1890ff;
        }

        &.warning {
          background: #fff7e6;
          color: #faad14;
        }
      }

      .status-info {
        .status-label {
          font-size: 12px;
          color: #8c8c8c;
          margin-bottom: 4px;
        }

        .status-value {
          font-size: 14px;
          font-weight: 600;
          color: #262626;
        }
      }
    }
  }

  .params-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 0 20px 20px 20px;

    .param-card {
      padding: 16px;
      background: #ffffff;
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      transition: all 0.2s;

      &:hover {
        border-color: #1890ff;
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
      }

      .param-label {
        font-size: 12px;
        color: #8c8c8c;
        margin-bottom: 8px;
      }

      .param-value {
        font-size: 20px;
        font-weight: 700;
        color: #262626;
        margin-bottom: 6px;

        .unit {
          font-size: 12px;
          font-weight: 400;
          color: #8c8c8c;
          margin-left: 4px;
        }
      }

      .param-trend {
        display: flex;
        align-items: center;
        font-size: 12px;

        i {
          margin-right: 4px;

          &.trend-up {
            color: #52c41a;
          }

          &.trend-down {
            color: #ff4d4f;
          }

          &.trend-stable {
            color: #8c8c8c;
          }
        }

        span {
          color: #8c8c8c;
        }
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
      background: #f6f9fc;
      border-radius: 6px;
      border: 1px solid #e6f7ff;

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

  .water-chart {
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
  .water-meter-detail-page {
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