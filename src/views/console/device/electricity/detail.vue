<template>
  <div class="meter-detail-page">
    <div v-if="pageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="el-icon-loading"></i>
        </div>
        <div class="loading-text">正在加载设备详情...</div>
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
              <i class="el-icon-arrow-left"></i> 返回 </el-button
            >{{ meterInfo.meterName }}
          </h2>
          <div class="device-tags">
            <el-tag type="success" size="small">正常</el-tag>
            <el-tag type="warning" size="small">在线</el-tag>
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
              <span class="value">{{ meterInfo.deviceId }}</span>
            </div>
            <div class="meta-row">
              <span class="label">余额</span>
              <span class="value balance">¥ {{ meterInfo.balance }}</span>
            </div>
            <div class="meta-row">
              <span class="label">电路方案</span>
              <span class="value">{{ meterInfo.circuitScheme }}</span>
            </div>
            <div class="meta-row">
              <span class="label">联络菜方案</span>
              <span class="value">{{ meterInfo.contactScheme }}</span>
            </div>
            <div class="meta-row">
              <span class="label">负载限制</span>
              <span class="value">{{ meterInfo.loadLimit }}</span>
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="device-controls">
          <div class="button-wrapper">
            <el-button
              :type="meterInfo.switchStatus === '分闸' ? 'primary' : 'warning'"
              @click="handleSwitchControl"
              :loading="switchLoading"
              class="switch-button"
            >
              {{ meterInfo.switchStatus === "分闸" ? "合闸" : "分闸" }}
            </el-button>
          </div>
          <div class="button-wrapper">
            <el-button @click="showSettingsDialog" class="control-button"
              >设置</el-button
            >
          </div>
          <div class="button-wrapper">
            <el-button @click="showRechargeDialog" class="control-button"
              >充值测试</el-button
            >
          </div>
          <div class="button-wrapper">
            <el-button @click="showMaintenanceDialog" class="control-button"
              >余额清零</el-button
            >
          </div>
        </div>

        <!-- 设备详细信息 -->
        <div class="device-details">
          <div class="detail-section">
            <h4>设备参数</h4>
            <div class="detail-list">
              <div class="detail-item">
                <span class="label">设备型号</span>
                <span class="value">{{
                  meterInfo.deviceModel || "DTS866"
                }}</span>
              </div>
              <div class="detail-item">
                <span class="label">通信方式</span>
                <span class="value">{{ meterInfo.commType || "NB-IoT" }}</span>
              </div>
              <div class="detail-item">
                <span class="label">安装位置</span>
                <span class="value">{{
                  meterInfo.location || "15层公共区域"
                }}</span>
              </div>
              <div class="detail-item">
                <span class="label">维护状态</span>
                <span class="value status-normal">{{
                  meterInfo.maintenanceStatus
                }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>运行状态</h4>
            <div class="status-indicators">
              <div class="indicator-item">
                <span
                  class="indicator"
                  :class="statusIndicators.communication.class"
                ></span>
                <span class="label">{{
                  statusIndicators.communication.label
                }}</span>
              </div>
              <div class="indicator-item">
                <span
                  class="indicator"
                  :class="statusIndicators.switch.class"
                ></span>
                <span class="label">{{ statusIndicators.switch.label }}</span>
              </div>
              <div class="indicator-item">
                <span
                  class="indicator"
                  :class="statusIndicators.measurement.class"
                ></span>
                <span class="label">{{
                  statusIndicators.measurement.label
                }}</span>
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
            <span class="update-time"
              >更新时间: {{ meterInfo.updateTime }}</span
            >
          </div>

          <div class="data-overview">
            <div class="overview-item">
              <span class="label">ICCID</span>
              <span class="value">{{ meterInfo.iccid || "-" }}</span>
            </div>
            <div class="overview-item">
              <span class="label">电表付费模式</span>
              <span class="value">{{ meterInfo.paymentMode }}</span>
            </div>
            <div class="overview-item">
              <span class="label">费控开关</span>
              <span class="value">{{ meterInfo.feeControlSwitch }}</span>
            </div>
            <div class="overview-item">
              <span class="label">电压变比PT</span>
              <span class="value">{{ meterInfo.voltagePT }}</span>
            </div>
            <div class="overview-item">
              <span class="label">电流变比CT</span>
              <span class="value">{{ meterInfo.currentCT }}</span>
            </div>
            <div class="overview-item">
              <span class="label">购电次数</span>
              <span class="value">{{ meterInfo.purchaseCount || "-" }}</span>
            </div>
            <div class="overview-item">
              <span class="label">电表制格</span>
              <span class="value">{{ meterInfo.meterSpec }}</span>
            </div>
            <div class="overview-item">
              <span class="label">网络地址</span>
              <span class="value">{{ meterInfo.networkAddress }}</span>
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
                  <th>合电量</th>
                  <th>总电量</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-label"></td>
                  <td>{{ powerData.peak }}</td>
                  <td>{{ powerData.high }}</td>
                  <td>{{ powerData.flat }}</td>
                  <td>{{ powerData.combined }}</td>
                  <td>{{ powerData.total }}</td>
                </tr>
              </tbody>
            </table>

            <table class="params-table">
              <thead>
                <tr>
                  <th></th>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                  <th>合计</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="row-label">电压</td>
                  <td>{{ phaseData.voltageA }}</td>
                  <td>{{ phaseData.voltageB }}</td>
                  <td>{{ phaseData.voltageC }}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td class="row-label">电流</td>
                  <td>{{ phaseData.currentA }}</td>
                  <td>{{ phaseData.currentB }}</td>
                  <td>{{ phaseData.currentC }}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td class="row-label">有功功率</td>
                  <td>{{ phaseData.activePowerA }}</td>
                  <td>{{ phaseData.activePowerB }}</td>
                  <td>{{ phaseData.activePowerC }}</td>
                  <td>{{ phaseData.totalActivePower }}</td>
                </tr>
                <tr>
                  <td class="row-label">无功功率</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
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
                  v-model="queryParams.serialNumber"
                  size="small"
                  style="width: 150px"
                />
              </div>
              <div class="control-group">
                <span class="control-label">时间</span>
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
                <el-button type="primary" size="small" @click="queryData"
                  >查询</el-button
                >
              </div>
            </div>

            <div class="tab-controls">
              <el-radio-group v-model="activeTab" size="small">
                <el-radio-button label="电力数据">电力数据</el-radio-button>
                <el-radio-button label="业务事件">业务事件</el-radio-button>
                <el-radio-button label="电表数据定制报表"
                  >电表数据定制报表</el-radio-button
                >
              </el-radio-group>
              <span class="extra-controls">+{{ extraTabsCount }}</span>
            </div>
          </div>

          <!-- 电力数据图表 -->
          <div v-show="activeTab === '电力数据'" class="chart-container">
            <div class="chart-stats">
              <div class="stat-item">
                <span class="stat-label">总用电量(kWh)</span>
                <span class="stat-value">{{
                  chartStats.totalPowerConsumption
                }}</span>
                <span class="stat-change" :class="chartStats.changeClass"
                  >{{ chartStats.changePercent }}%</span
                >
              </div>
            </div>
            <div ref="powerChart" class="power-chart"></div>

            <!-- 点击详情显示 -->
            <div v-if="selectedDataPoint" class="data-point-detail">
              <div class="detail-card">
                <h4>{{ selectedDataPoint.date }} 电力详情</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">用电量</span>
                    <span class="value"
                      >{{ selectedDataPoint.consumption }} kWh</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="label">峰值功率</span>
                    <span class="value"
                      >{{ selectedDataPoint.maxPower }} kW</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="label">平均功率</span>
                    <span class="value"
                      >{{ selectedDataPoint.avgPower }} kW</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="label">功率因数</span>
                    <span class="value">{{
                      selectedDataPoint.powerFactor
                    }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">电费</span>
                    <span class="value">¥{{ selectedDataPoint.cost }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">碳排放</span>
                    <span class="value"
                      >{{ selectedDataPoint.carbonEmission }} kg CO₂</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 业务事件表格 -->
          <div v-show="activeTab === '业务事件'" class="events-container">
            <div class="events-timeline">
              <div class="timeline-header">
                <span class="offline-dot"></span>
                <span class="time-label">电表上下线</span>
                <div class="timeline-dates">
                  <span
                    v-for="event in offlineEvents"
                    :key="event.id"
                    class="event-time"
                    >{{ event.time }}</span
                  >
                </div>
              </div>
            </div>

            <div class="events-filter">
              <el-button
                v-for="filter in eventFilters"
                :key="filter.key"
                :type="selectedFilter === filter.key ? 'primary' : ''"
                size="small"
                @click="selectEventFilter(filter.key)"
              >
                {{ filter.label }}
              </el-button>
            </div>

            <div class="events-table">
              <table>
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>上下线类型</th>
                    <th>上报频率</th>
                    <th>新号强度</th>
                    <th>sim卡号</th>
                    <th>version1</th>
                    <th>version2</th>
                    <th>version3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in filteredEvents" :key="event.id">
                    <td>{{ event.time }}</td>
                    <td>
                      <span class="event-type">{{ event.type }}</span>
                    </td>
                    <td>{{ event.frequency || "-" }}</td>
                    <td>{{ event.signalStrength || "-" }}</td>
                    <td>{{ event.simCard || "-" }}</td>
                    <td>{{ event.version1 || "-" }}</td>
                    <td>{{ event.version2 || "-" }}</td>
                    <td>{{ event.version3 || "-" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 定制报表 -->
          <div v-show="activeTab === '电表数据定制报表'" class="custom-report">
            <div class="report-placeholder">
              <i class="el-icon-document"></i>
              <p>定制报表功能开发中...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <el-dialog
      title="充值测试"
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
      title="设置"
      :visible.sync="settingsDialog.visible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="settingsForm" :model="settingsForm" label-width="100px">
        <el-form-item label="电表编号">
          <el-input v-model="settingsForm.meterId" disabled />
        </el-form-item>
        <el-form-item label="电表序列号" required>
          <el-input v-model="settingsForm.serialNumber" />
        </el-form-item>
        <el-form-item label="项目编号" required>
          <el-select
            v-model="settingsForm.projectId"
            placeholder="请选择项目"
            style="width: 100%"
          >
            <el-option label="内部测试专用" value="project_001" />
            <el-option label="科技园区二期" value="project_002" />
            <el-option label="智慧办公楼" value="project_003" />
          </el-select>
        </el-form-item>
        <el-form-item label="电表名称" required>
          <el-input v-model="settingsForm.meterName" />
        </el-form-item>
        <el-form-item label="电表类型">
          <el-select v-model="settingsForm.meterType" style="width: 100%">
            <el-option label="专用表" value="dedicated" />
            <el-option label="公摊表" value="shared" />
            <el-option label="总表" value="main" />
          </el-select>
        </el-form-item>
        <el-form-item label="电表规格">
          <el-select v-model="settingsForm.meterSpec" style="width: 100%">
            <el-option label="单相一次" value="single_phase_primary" />
            <el-option label="三相一次" value="three_phase_primary" />
            <el-option label="三相二次" value="three_phase_secondary" />
          </el-select>
        </el-form-item>
        <el-form-item label="付费模式">
          <el-select v-model="settingsForm.paymentMode" style="width: 100%">
            <el-option label="预付费" value="prepaid" />
            <el-option label="强控（欠费不跳闸）" value="control_no_trip" />
            <el-option label="强控（欠费跳闸）" value="control_trip" />
          </el-select>
        </el-form-item>
        <el-form-item label="CT变比">
          <el-input v-model="settingsForm.ctRatio" />
        </el-form-item>
        <el-form-item label="ICCID">
          <el-input v-model="settingsForm.iccid" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="负载限制">
          <el-switch v-model="settingsForm.loadLimit" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="settingsDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">确认</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="余额清零"
      :visible.sync="maintenanceDialog.visible"
      width="400px"
    >
      <div class="maintenance-content">
        <el-alert
          title="警告"
          type="warning"
          description="此操作将清零电表余额，请谨慎操作！"
          :closable="false"
        />
        <div style="margin-top: 20px">
          <el-checkbox v-model="confirmClear">我确认要清零余额</el-checkbox>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="maintenanceDialog.visible = false">取消</el-button>
        <el-button
          type="danger"
          :disabled="!confirmClear"
          @click="handleClearBalance"
          >确定清零</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
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
        name: null,
      },
      // 电表基本信息
      meterInfo: {
        meterName: "",
        serial: "",
        deviceId: "",
        balance: "4.45",
        circuitScheme: "-",
        contactScheme: "-",
        loadLimit: "关",
        updateTime: "2025-08-08 11:13:04",
        iccid: "-",
        paymentMode: "提费",
        feeControlSwitch: "分闸",
        voltagePT: "1",
        currentCT: "1",
        purchaseCount: "-",
        meterSpec: "单相一次",
        networkAddress: "117.132.195.177:52480",
        switchStatus: "分闸",
        deviceModel: "DTS866-L",
        commType: "NB-IoT",
        location: "15层公共配电箱",
        maintenanceStatus: "正常",
      },

      // 运行状态指示器
      statusIndicators: {
        communication: {
          label: "通信状态：在线",
          class: "online",
        },
        switch: {
          label: "开关状态：分闸",
          class: "warning",
        },
        measurement: {
          label: "计量状态：正常",
          class: "normal",
        },
      },

      // 电力数据
      powerData: {
        peak: "0.51",
        high: "0.87",
        flat: "1.55",
        combined: "1.52",
        total: "4.45",
      },

      // 相位数据
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
        totalActivePower: "0.024",
        powerFactorA: "1",
        powerFactorB: "1",
        powerFactorC: "1",
        totalPowerFactor: "1",
      },

      // 图表统计数据
      chartStats: {
        totalPowerConsumption: 156.8,
        changePercent: 12.5,
        changeClass: "increase",
      },

      // 选中的数据点详情
      selectedDataPoint: null,

      // 查询参数
      queryParams: {
        serialNumber: "25072108620294",
        dateRange: ["2025-08-08 00:00:00", "2025-08-08 23:59:59"],
      },

      // 活跃标签页
      activeTab: "电力数据",
      extraTabsCount: 8,

      // 事件相关
      selectedFilter: "电表数据定制报表",
      eventFilters: [
        { key: "电表数据定制报表", label: "电表数据定制报表" },
        { key: "电表充值", label: "电表充值" },
        { key: "电表同步", label: "电表同步" },
        { key: "电表付费模式", label: "电表付费模式" },
        { key: "电表上下线", label: "电表上下线" },
        { key: "电表测试", label: "电表测试" },
        { key: "电表报警", label: "电表报警" },
        { key: "电表分合闸", label: "电表分合闸" },
        { key: "电表维护", label: "电表维护" },
      ],

      // 下线事件
      offlineEvents: [
        { id: 1, time: "2025-08-08 00:00:00" },
        { id: 2, time: "2025-08-08 06:00:00" },
        { id: 3, time: "2025-08-08 12:00:00" },
        { id: 4, time: "2025-08-08 18:00:00" },
        { id: 5, time: "2025-08-08 23:59:59" },
      ],

      // 业务事件列表
      businessEvents: [
        {
          id: 1,
          time: "2025-08-08 01:58:23",
          type: "离线",
          frequency: "-",
          signalStrength: "-",
          simCard: "-",
          version1: "-",
          version2: "-",
          version3: "-",
        },
        {
          id: 2,
          time: "2025-08-08 06:10:24",
          type: "离线",
          frequency: "-",
          signalStrength: "-",
          simCard: "-",
          version1: "-",
          version2: "-",
          version3: "-",
        },
        {
          id: 3,
          time: "2025-08-08 10:22:24",
          type: "离线",
          frequency: "-",
          signalStrength: "-",
          simCard: "-",
          version1: "-",
          version2: "-",
          version3: "-",
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
        meterId: "1029334",
        serialNumber: "25072108620294",
        projectId: "project_001",
        meterName: "君联大厦-15公共1",
        meterType: "dedicated",
        meterSpec: "single_phase_primary",
        paymentMode: "prepaid",
        ctRatio: "1",
        iccid: "",
        loadLimit: false,
      },
      confirmClear: false,

      // 图表实例
      powerChart: null,
    };
  },

  computed: {
    filteredEvents() {
      return this.businessEvents;
    },
  },

  watch: {
    "meterInfo.switchStatus": {
      handler(newStatus) {
        this.updateStatusIndicators();
      },
      immediate: true,
    },
  },

  async mounted() {
    console.log("详情页组件已挂载");

    // 🔥 步骤1：提取路由参数
    this.extractRouteParams();

    // 🔥 步骤2：模拟加载数据
    await this.loadMeterData();

    // 🔥 步骤3：初始化图表
    this.initChart();

    // 🔥 步骤4：处理布局变化
    this.$nextTick(() => {
      this.handleLayoutChange();
    });

    // 加载echarts
    if (typeof echarts === "undefined") {
      this.loadEcharts();
    }
  },

  beforeDestroy() {
    // 清理定时器和事件监听
    clearTimeout(this.resizeTimer);
    window.removeEventListener("resize", this.handleResize);

    if (this.powerChart) {
      this.powerChart.dispose();
    }
  },

  methods: {
    // 🔥 新增：提取路由参数
    extractRouteParams() {
      this.routeParams.deviceId =
        this.$route.params.id || this.$route.query.deviceId || null;
      this.routeParams.serial = this.$route.query.serial || null;
      this.routeParams.name = this.$route.query.name || null;

      if (this.routeParams.serial) {
        this.queryParams.serialNumber = this.routeParams.serial;
      }
    },

    // 🔥 新增：加载电表数据
    async loadMeterData() {
      this.pageLoading = true;

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (this.routeParams.deviceId) {
          this.simulateDataByDeviceId(this.routeParams.deviceId);
        } else {
          this.loadDefaultData();
        }
      } catch (error) {
        this.$message.error("加载设备数据失败");
      } finally {
        this.pageLoading = false;
      }
    },

    // 🔥 新增：根据设备ID模拟数据
    simulateDataByDeviceId(deviceId) {
      const deviceDataMap = {
        1029334: {
          meterName: "君联大厦-15公共1",
          serial: "25072108620294",
          deviceId: "1029334",
          balance: "4.45",
          // ... 完整数据
        },
        default: {
          meterName: this.routeParams.name || "未知设备",
          serial: this.routeParams.serial || "未知序列号",
          deviceId: this.routeParams.deviceId || "未知编号",
          // ... 默认数据
        },
      };

      const deviceData = deviceDataMap[deviceId] || deviceDataMap["default"];
      Object.assign(this.meterInfo, deviceData);
    },
    loadEcharts() {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js";
      script.onload = () => {
        this.initChart();
      };
      document.head.appendChild(script);
    },

    updateStatusIndicators() {
      this.statusIndicators.switch = {
        label: `开关状态：${this.meterInfo.switchStatus}`,
        class: this.meterInfo.switchStatus === "合闸" ? "normal" : "warning",
      };
    },
    handleLayoutChange() {
      // 延迟执行，等待CSS动画完成
      this.resizeTimer = setTimeout(() => {
        if (this.powerChart) {
          console.log("详情页：执行图表重绘");
          this.powerChart.resize();
        }
      }, 350); // 等待树面板动画完成（Layout.vue中动画时间是0.3s）
    },

    // 👇 新增：防抖的resize处理
    handleResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        if (this.powerChart) {
          this.powerChart.resize();
        }
      }, 100);
    },

    initChart() {
      this.$nextTick(() => {
        if (typeof echarts !== "undefined") {
          const chartDom = this.$refs.powerChart;
          if (chartDom) {
            this.powerChart = echarts.init(chartDom);
            this.updateChart();

            // 监听窗口大小变化
            window.addEventListener("resize", () => {
              if (this.powerChart) {
                this.powerChart.resize();
              }
            });
          }
        }
      });
    },

    updateChart() {
      if (!this.powerChart) return;

      // 生成用电相关的数据
      const dates = [];
      const powerConsumption = [];

      for (let i = 1; i <= 14; i++) {
        const day = String(i).padStart(2, "0");
        const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weekday = weekdays[(i - 1) % 7];
        dates.push(`${day}\n${weekday}`);

        // 模拟用电量数据，工作日用电量较高
        if (i >= 1 && i <= 5) {
          powerConsumption.push(Math.floor(Math.random() * 10) + 25); // 工作日 25-35
        } else if (i === 6 || i === 7) {
          powerConsumption.push(Math.floor(Math.random() * 8) + 15); // 周末 15-23
        } else if (i === 8) {
          powerConsumption.push(42); // 当天突出数据点
        } else if (i >= 9 && i <= 12) {
          powerConsumption.push(Math.floor(Math.random() * 8) + 20); // 20-28
        } else if (i === 13) {
          powerConsumption.push(35); // 倒数第二天
        } else if (i === 14) {
          powerConsumption.push(68); // 最后一天大幅上升
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
          borderColor: "#d9d9d9",
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
          max: 80,
          interval: 20,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: "#8c8c8c",
            fontSize: 12,
            formatter: "{value}",
          },
          splitLine: {
            lineStyle: {
              color: "#f5f5f5",
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
            smoothMonotone: "x",
            symbol: "none",
            lineStyle: {
              color: "#597ef7",
              width: 3,
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
                    color: "rgba(89, 126, 247, 0.2)",
                  },
                  {
                    offset: 0.7,
                    color: "rgba(89, 126, 247, 0.1)",
                  },
                  {
                    offset: 1,
                    color: "rgba(89, 126, 247, 0.02)",
                  },
                ],
              },
            },
          },
        ],
      };

      this.powerChart.setOption(option);

      // 添加点击事件
      this.powerChart.on("click", (params) => {
        if (params.componentType === "series") {
          this.showDataPointDetail(params);
        }
      });
    },

    showDataPointDetail(params) {
      const dateIndex = params.dataIndex;
      const consumption = params.value;
      const dates = [];

      for (let i = 1; i <= 14; i++) {
        const day = String(i).padStart(2, "0");
        const weekdays = [
          "周一",
          "周二",
          "周三",
          "周四",
          "周五",
          "周六",
          "周日",
        ];
        const weekday = weekdays[(i - 1) % 7];
        dates.push(`08月${day}日 ${weekday}`);
      }

      // 生成详细数据
      this.selectedDataPoint = {
        date: dates[dateIndex],
        consumption: consumption,
        maxPower: (consumption * 1.8 + Math.random() * 5).toFixed(2),
        avgPower: (consumption * 0.7 + Math.random() * 3).toFixed(2),
        powerFactor: (0.85 + Math.random() * 0.1).toFixed(3),
        cost: (consumption * 0.65).toFixed(2),
        carbonEmission: (consumption * 0.785).toFixed(2),
      };
    },

    // 控制方法
    async handleSwitchControl() {
      this.switchLoading = true;
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.meterInfo.switchStatus =
          this.meterInfo.switchStatus === "分闸" ? "合闸" : "分闸";
        this.$message.success("分合闸操作成功");
      } catch (error) {
        this.$message.error("操作失败");
      } finally {
        this.switchLoading = false;
      }
    },

    showRechargeDialog() {
      this.rechargeForm = { amount: null, remark: "" };
      this.rechargeDialog.visible = true;
    },

    showSettingsDialog() {
      // 初始化设置表单数据
      this.settingsForm = {
        meterId: this.meterInfo.deviceId,
        serialNumber: this.meterInfo.serial,
        projectId: "project_001",
        meterName: this.meterInfo.meterName,
        meterType: "dedicated",
        meterSpec:
          this.meterInfo.meterSpec === "单相一次"
            ? "single_phase_primary"
            : "three_phase_primary",
        paymentMode:
          this.meterInfo.paymentMode === "提费" ? "prepaid" : "control_no_trip",
        ctRatio: this.meterInfo.currentCT,
        iccid: this.meterInfo.iccid || "",
        loadLimit: this.meterInfo.loadLimit === "开",
      };
      this.settingsDialog.visible = true;
    },

    async saveSettings() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 更新设备信息
        this.meterInfo.meterName = this.settingsForm.meterName;
        this.meterInfo.currentCT = this.settingsForm.ctRatio;
        this.meterInfo.iccid = this.settingsForm.iccid;
        this.meterInfo.loadLimit = this.settingsForm.loadLimit ? "开" : "关";

        this.settingsDialog.visible = false;
        this.$message.success("设置保存成功");
      } catch (error) {
        this.$message.error("设置保存失败");
      }
    },

    showMaintenanceDialog() {
      this.confirmClear = false;
      this.maintenanceDialog.visible = true;
    },

    async handleRecharge() {
      if (!this.rechargeForm.amount) {
        this.$message.warning("请输入充值金额");
        return;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const currentBalance = parseFloat(this.meterInfo.balance);
        const newBalance = currentBalance + this.rechargeForm.amount;
        this.meterInfo.balance = newBalance.toFixed(2);
        this.rechargeDialog.visible = false;
        this.$message.success(
          `充值成功！充值金额：¥${this.rechargeForm.amount}`
        );
      } catch (error) {
        this.$message.error("充值失败");
      }
    },

    async handleClearBalance() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.meterInfo.balance = "0.00";
        this.maintenanceDialog.visible = false;
        this.$message.success("余额已清零");
      } catch (error) {
        this.$message.error("操作失败");
      }
    },

    queryData() {
      this.$message.info("查询数据...");
      // 重新绘制图表
      if (this.powerChart) {
        this.updateChart();
      }
    },

    selectEventFilter(filterKey) {
      this.selectedFilter = filterKey;
    },

    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>

<style lang="scss" scoped>
.meter-detail-page {
  padding: 16px 20px;
  background: #f5f6fa;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.breadcrumb-nav {
  margin-bottom: 16px;

  .clickable {
    cursor: pointer;
    color: #1890ff;

    &:hover {
      text-decoration: underline;
    }
  }
}

.page-content {
  display: flex;
  gap: 20px;
}

.device-info-panel {
  width: 320px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  padding: 20px;
}

.device-header {
  margin-bottom: 20px;

  .device-name {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 500;
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
      margin-bottom: 6px;
      font-size: 13px;

      .label {
        color: #8c8c8c;
        width: 70px;
      }

      .value {
        color: #262626;

        &.balance {
          color: #52c41a;
          font-weight: 500;
        }
      }
    }
  }
}

.device-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;

  .switch-button,
  .control-button {
    width: 100%;
    height: 36px;
    font-size: 13px;
  }

  .switch-button {
    &.el-button--primary {
      background-color: #1890ff;
      border-color: #1890ff;
      color: white;

      &:hover {
        background-color: #40a9ff;
        border-color: #40a9ff;
      }
    }

    &.el-button--warning {
      background-color: #ffbb96;
      border-color: #ffbb96;
      color: #8c4a1a;

      &:hover {
        background-color: #ffd591;
        border-color: #ffd591;
      }
    }
  }
}

.device-details {
  .detail-section {
    margin-bottom: 24px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
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
        border-bottom: 1px solid #f8f8f8;

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-size: 12px;
          color: #8c8c8c;
        }

        .value {
          font-size: 12px;
          color: #262626;

          &.status-normal {
            color: #52c41a;
          }
        }
      }
    }

    .status-indicators {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .indicator-item {
        display: flex;
        align-items: center;

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;

          &.online {
            background: #52c41a;
          }

          &.normal {
            background: #1890ff;
          }

          &.warning {
            background: #faad14;
          }

          &.error {
            background: #ff4d4f;
          }
        }

        .label {
          font-size: 12px;
          color: #595959;
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
  background: white;
  border-radius: 4px;
  border: 1px solid #e8e8e8;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #262626;
    }

    .update-time {
      font-size: 12px;
      color: #8c8c8c;
    }
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

.chart-section {
  background: white;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  flex: 1;

  .chart-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;

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
          color: #262626;
          white-space: nowrap;
        }
      }
    }

    .tab-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .extra-controls {
        color: #1890ff;
        cursor: pointer;
        font-size: 13px;
      }
    }
  }
}

.chart-container {
  padding: 20px;

  .chart-stats {
    margin-bottom: 20px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;

      .stat-label {
        color: #8c8c8c;
        font-size: 14px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #262626;
      }

      .stat-change {
        font-size: 14px;

        &.increase {
          color: #52c41a;

          &::before {
            content: "↗ ";
          }
        }

        &.decrease {
          color: #ff4d4f;

          &::before {
            content: "↘ ";
          }
        }
      }
    }
  }

  .power-chart {
    width: 100%;
    height: 300px;
    margin-bottom: 20px;
  }

  .data-point-detail {
    .detail-card {
      background: #fafafa;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      padding: 20px;
      margin-top: 16px;

      h4 {
        margin: 0 0 16px 0;
        color: #262626;
        font-size: 14px;
        font-weight: 500;
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 8px;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: #e8e8e8;
        border: 1px solid #d9d9d9;

        .detail-item {
          background: #ffffff;
          padding: 12px;
          text-align: center;

          .label {
            display: block;
            font-size: 12px;
            color: #8c8c8c;
            margin-bottom: 4px;
          }

          .value {
            font-size: 14px;
            font-weight: 500;
            color: #262626;
          }
        }
      }
    }
  }
}

.events-container {
  padding: 20px;
}

.events-timeline {
  margin-bottom: 16px;

  .timeline-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .offline-dot {
      width: 8px;
      height: 8px;
      background: #ff4d4f;
      border-radius: 50%;
      margin-right: 8px;
    }

    .time-label {
      font-size: 13px;
      color: #262626;
      margin-right: 16px;
    }

    .timeline-dates {
      display: flex;
      gap: 40px;

      .event-time {
        font-size: 12px;
        color: #8c8c8c;
        position: relative;

        &::before {
          content: "";
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          background: #ff4d4f;
          border-radius: 50%;
        }
      }
    }
  }
}

.events-filter {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.events-table {
  table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #e8e8e8;

    th,
    td {
      border: 1px solid #e8e8e8;
      padding: 8px 12px;
      text-align: left;
      font-size: 12px;
    }

    th {
      background: #fafafa;
      font-weight: 500;
      color: #262626;
    }

    td {
      color: #595959;
    }

    .event-type {
      position: relative;

      &::before {
        content: "";
        position: absolute;
        left: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 4px;
        background: #faad14;
        border-radius: 50%;
      }
    }
  }
}

.custom-report {
  padding: 60px 20px;
  text-align: center;

  .report-placeholder {
    color: #bfbfbf;

    i {
      font-size: 48px;
      margin-bottom: 16px;
      display: block;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }
}

.settings-content,
.maintenance-content {
  padding: 20px 0;
}

.maintenance-content {
  .el-checkbox {
    margin-top: 16px;
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .page-content {
    flex-direction: column;
  }

  .device-info-panel {
    width: 100%;
  }

  .data-overview {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .meter-detail-page {
    padding: 12px;
  }

  .chart-controls {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px !important;
  }

  .data-overview {
    grid-template-columns: 1fr;
    margin: 16px;
  }

  .device-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .events-filter {
    .el-button {
      margin-bottom: 8px;
    }
  }

  .timeline-dates {
    flex-direction: column !important;
    gap: 8px !important;
  }

  .detail-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px !important;
  }
}
// 🔥 新增：页面加载动画样式
.page-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  .loading-content {
    text-align: center;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    .loading-spinner {
      font-size: 32px;
      color: #1890ff;
      margin-bottom: 16px;

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
</style>
