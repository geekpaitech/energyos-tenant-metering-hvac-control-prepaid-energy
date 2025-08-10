<template>
  <div class="hvac-detail-page">
    <!-- 页面加载动画 -->
    <div v-if="pageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="el-icon-loading"></i>
        </div>
        <div class="loading-text">正在加载设备详情...</div>
      </div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" type="text" size="mini" class="back-btn">
          <i class="el-icon-arrow-left"></i> 返回
        </el-button>
        <h1 class="page-title">{{ deviceInfo.name }}</h1>
        <div class="device-tags">
          <el-tag :type="getStatusTagType(deviceInfo.status)" size="small">
            {{ getStatusText(deviceInfo) }}
          </el-tag>
          <el-tag :type="deviceInfo.online ? 'success' : 'danger'" size="small">
            {{ deviceInfo.online ? '在线' : '离线' }}
          </el-tag>
          <el-tag size="small" type="info">监控中</el-tag>
        </div>
      </div>
      <div class="header-right">
        <span class="update-time">最后更新: {{ deviceInfo.lastUpdate }}</span>
      </div>
    </div>

    <!-- 页面主体 -->
    <div class="page-body">
      <!-- 左侧设备控制区域 -->
      <div class="left-panel">
        <!-- 空调遥控器 -->
        <div class="remote-control-card">
          <div class="card-header">
            <h3><i class="el-icon-mobile-phone"></i> 设备控制</h3>
          </div>
          <div class="thermostat-controller">
            <!-- 温控面板 -->
            <div class="thermostat-panel">
              <div class="lcd-display">
                <div class="display-content">
                  <div class="main-temp">{{ deviceInfo.setTemp }}.0</div>
                  <div class="temp-unit">°C</div>
                  <div class="status-bar">
                    <span class="mode-indicator">{{ getModeIcon(deviceInfo.mode) }}</span>
                    <span class="current-temp">室温 {{ deviceInfo.currentTemp }}°C</span>
                    <span class="power-indicator" v-if="deviceInfo.power">●</span>
                  </div>
                </div>
              </div>
              
              <div class="control-buttons">
                <div class="button-row top-row">
                  <button 
                    class="ctrl-button"
                    @click="changeMode"
                    :disabled="!deviceInfo.online"
                  >
                    模式
                  </button>
                  <button 
                    class="ctrl-button"
                    @click="adjustFanSpeed"
                    :disabled="!deviceInfo.power || !deviceInfo.online"
                  >
                    风速
                  </button>
                  <button 
                    class="ctrl-button temp-up"
                    @click="adjustTemp(1)"
                    :disabled="!deviceInfo.power || !deviceInfo.online || deviceInfo.setTemp >= 30"
                  >
                    ▲
                  </button>
                  <button 
                    class="ctrl-button"
                    @click="showScheduleDialog"
                  >
                    定时
                  </button>
                </div>
                
                <div class="button-row bottom-row">
                  <button 
                    class="ctrl-button power-button"
                    :class="{ active: deviceInfo.power }"
                    @click="togglePower"
                    :disabled="!deviceInfo.online || controlLoading.power"
                  >
                    开关
                  </button>
                  <button 
                    class="ctrl-button"
                    @click="toggleSwing"
                    :disabled="!deviceInfo.power || !deviceInfo.online"
                  >
                    风向
                  </button>
                  <button 
                    class="ctrl-button temp-down"
                    @click="adjustTemp(-1)"
                    :disabled="!deviceInfo.power || !deviceInfo.online || deviceInfo.setTemp <= 16"
                  >
                    ▼
                  </button>
                  <button 
                    class="ctrl-button"
                    @click="showAdvancedSettings"
                  >
                    设置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 设备信息与配置 -->
        <div class="device-config-card">
          <div class="card-header">
            <h3><i class="el-icon-info"></i> 设备信息与配置</h3>
          </div>
          <div class="device-config-content">
            <!-- 设备基本信息 -->
            <div class="info-section">
              <h4 class="section-title">设备基本信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">设备编号</span>
                  <span class="info-value">{{ deviceInfo.id }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">设备序列号</span>
                  <span class="info-value">{{ deviceInfo.serialNumber }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">设备品牌</span>
                  <span class="info-value">{{ deviceInfo.brand }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">设备型号</span>
                  <span class="info-value">{{ deviceInfo.model }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">安装位置</span>
                  <span class="info-value">{{ deviceInfo.location }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">安装时间</span>
                  <span class="info-value">{{ deviceInfo.installDate }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">当前功率</span>
                  <span class="info-value power-highlight">{{ deviceInfo.powerUsage }} kW</span>
                </div>
                <div class="info-item">
                  <span class="info-label">今日耗电</span>
                  <span class="info-value energy-highlight">{{ todayEnergy }} kWh</span>
                </div>
              </div>
            </div>

            <!-- 项目配置信息 -->
            <div class="config-section">
              <h4 class="section-title">项目配置信息</h4>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">归属项目</span>
                  <span class="config-value">{{ projectConfig.projectName }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">绑定租户</span>
                  <span class="config-value">{{ projectConfig.tenant || '-' }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">网关MAC</span>
                  <span class="config-value">{{ projectConfig.gatewayMac }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">设备类型</span>
                  <span class="config-value">{{ projectConfig.deviceType }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">公摊类型</span>
                  <span class="config-value">{{ projectConfig.shareType }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">计量电表</span>
                  <span class="config-value">{{ projectConfig.meterNumber }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">计费方式</span>
                  <span class="config-value">{{ projectConfig.billingMethod }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">盘管系数</span>
                  <span class="config-value">{{ projectConfig.coilCoefficient }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">风机耗电</span>
                  <span class="config-value">{{ projectConfig.fanPower }} kW</span>
                </div>
                <div class="config-item">
                  <span class="config-label">高档系数</span>
                  <span class="config-value">{{ projectConfig.highCoefficient }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">中档系数</span>
                  <span class="config-value">{{ projectConfig.midCoefficient }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">低档系数</span>
                  <span class="config-value">{{ projectConfig.lowCoefficient }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧数据区域 -->
      <div class="right-panel">
        <!-- 数据分析区域 -->
        <div class="data-analysis-card">
          <div class="card-header">
            <h3><i class="el-icon-data-line"></i> 数据分析</h3>
            <div class="header-controls">
              <div class="control-group">
                <span class="control-label">查询时间</span>
                <el-date-picker
                  v-model="queryParams.dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  size="small"
                  format="yyyy-MM-dd HH:mm"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  style="width: 300px"
                />
              </div>
              <el-button type="primary" size="small" @click="queryHistoryData">
                查询数据
              </el-button>
              <el-button size="small" @click="exportData">
                导出报表
              </el-button>
            </div>
          </div>

          <div class="analysis-content">
            <div class="tab-controls">
              <el-radio-group v-model="activeTab" size="small">
                <el-radio-button label="温度数据">温度趋势</el-radio-button>
                <el-radio-button label="运行记录">运行日志</el-radio-button>
                <el-radio-button label="控制历史">操作记录</el-radio-button>
              </el-radio-group>
            </div>

            <!-- 温度数据图表 -->
            <div v-show="activeTab === '温度数据'" class="chart-container">
              <div class="chart-stats">
                <div class="stat-item">
                  <span class="stat-label">今日平均温度</span>
                  <span class="stat-value">{{ chartStats.avgTemp }}°C</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">累计运行时长</span>
                  <span class="stat-value">{{ chartStats.runningHours }}h</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">温度达标率</span>
                  <span class="stat-value">{{ chartStats.tempAccuracy }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">今日总耗电</span>
                  <span class="stat-value">{{ chartStats.totalEnergy }} kWh</span>
                </div>
              </div>
              <div ref="temperatureChart" class="temperature-chart"></div>
            </div>

            <!-- 运行记录表格 -->
            <div v-show="activeTab === '运行记录'" class="table-container">
              <el-table 
                :data="operationRecords" 
                style="width: 100%"
                size="small"
                stripe
                height="400"
              >
                <el-table-column prop="time" label="操作时间" min-width="160" />
                <el-table-column prop="operation" label="操作类型" min-width="120" align="center" />
                <el-table-column label="温度变化" align="center" min-width="140">
                  <template slot-scope="scope">
                    {{ scope.row.beforeTemp }}°C → {{ scope.row.afterTemp }}°C
                  </template>
                </el-table-column>
                <el-table-column prop="mode" label="运行模式" min-width="100" align="center" />
                <el-table-column prop="fanSpeed" label="风速等级" min-width="100" align="center" />
                <el-table-column prop="powerUsage" label="功率(kW)" min-width="100" align="center" />
                <el-table-column prop="duration" label="持续时长" min-width="120" align="center" />
                <el-table-column prop="result" label="执行结果" min-width="100" align="center">
                  <template slot-scope="scope">
                    <el-tag 
                      :type="scope.row.result === '成功' ? 'success' : 'danger'" 
                      size="mini"
                    >
                      {{ scope.row.result }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="operator" label="操作来源" min-width="100" align="center" />
              </el-table>
            </div>

            <!-- 控制历史表格 -->
            <div v-show="activeTab === '控制历史'" class="table-container">
              <el-table 
                :data="controlHistory" 
                style="width: 100%"
                size="small"
                stripe
                height="400"
              >
                <el-table-column prop="time" label="操作时间" min-width="160" />
                <el-table-column prop="operationType" label="操作类型" min-width="100" align="center">
                  <template slot-scope="scope">
                    <el-tag 
                      :type="scope.row.operationType === '开启' ? 'success' : 'info'" 
                      size="mini"
                    >
                      {{ scope.row.operationType }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="operator" label="操作来源" min-width="120" align="center" />
                <el-table-column label="状态变化" align="center" min-width="180">
                  <template slot-scope="scope">
                    {{ scope.row.beforeStatus }} → {{ scope.row.afterStatus }}
                  </template>
                </el-table-column>
                <el-table-column prop="signalStrength" label="信号强度" min-width="100" align="center" />
                <el-table-column prop="networkType" label="网络类型" min-width="100" align="center" />
                <el-table-column prop="responseTime" label="响应时间" min-width="100" align="center" />
                <el-table-column prop="result" label="执行结果" min-width="100" align="center">
                  <template slot-scope="scope">
                    <el-tag 
                      :type="scope.row.result === '成功' ? 'success' : 'danger'" 
                      size="mini"
                    >
                      {{ scope.row.result }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注信息" min-width="120" align="center" />
              </el-table>
            </div>
          </div>
        </div>

        <!-- 用能统计 -->
        <div class="energy-stats-card">
          <div class="card-header">
            <h3><i class="el-icon-data-analysis"></i> 设备用能统计</h3>
          </div>
          <div class="energy-content">
            <el-table 
              :data="energyStatsData" 
              style="width: 100%"
              size="small"
              stripe
              border
            >
              <el-table-column prop="timeType" label="操作时间" min-width="100" align="center" />
              <el-table-column label="高风速" align="center">
                <el-table-column prop="highWindTime" label="时长(小时)" min-width="90" align="center" />
                <el-table-column prop="highWindEnergy" label="电量(度)" min-width="80" align="center" />
              </el-table-column>
              <el-table-column label="中风速" align="center">
                <el-table-column prop="midWindTime" label="时长(小时)" min-width="90" align="center" />
                <el-table-column prop="midWindEnergy" label="电量(度)" min-width="80" align="center" />
              </el-table-column>
              <el-table-column label="低风速" align="center">
                <el-table-column prop="lowWindTime" label="时长(小时)" min-width="90" align="center" />
                <el-table-column prop="lowWindEnergy" label="电量(度)" min-width="80" align="center" />
              </el-table-column>
              <el-table-column label="自动风" align="center">
                <el-table-column prop="autoWindTime" label="时长(小时)" min-width="90" align="center" />
                <el-table-column prop="autoWindEnergy" label="电量(度)" min-width="80" align="center" />
              </el-table-column>
              <el-table-column prop="totalEnergy" label="总电量(度)" min-width="100" align="center">
                <template slot-scope="scope">
                  <span style="font-weight: 600; color: #1890ff;">{{ scope.row.totalEnergy }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 高级设置弹窗 -->
    <el-dialog
      title="高级设置"
      :visible.sync="advancedDialog.visible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="advancedForm" :model="advancedForm" label-width="100px">
        <el-form-item label="设备名称">
          <el-input v-model="advancedForm.name" />
        </el-form-item>
        <el-form-item label="设备位置">
          <el-input v-model="advancedForm.location" />
        </el-form-item>
        <el-form-item label="温度上限">
          <el-input-number v-model="advancedForm.maxTemp" :min="20" :max="35" />
        </el-form-item>
        <el-form-item label="温度下限">
          <el-input-number v-model="advancedForm.minTemp" :min="10" :max="25" />
        </el-form-item>
        <el-form-item label="自动调节">
          <el-switch v-model="advancedForm.autoAdjust" />
        </el-form-item>
        <el-form-item label="节能模式">
          <el-switch v-model="advancedForm.energySaving" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="advancedDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveAdvancedSettings">保存</el-button>
      </span>
    </el-dialog>

    <!-- 定时设置弹窗 -->
    <el-dialog
      title="定时设置"
      :visible.sync="scheduleDialog.visible"
      width="600px"
    >
      <el-form ref="scheduleForm" :model="scheduleForm" label-width="100px">
        <el-form-item label="定时开启">
          <el-time-picker
            v-model="scheduleForm.startTime"
            placeholder="选择开启时间"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>
        <el-form-item label="定时关闭">
          <el-time-picker
            v-model="scheduleForm.endTime"
            placeholder="选择关闭时间"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>
        <el-form-item label="重复设置">
          <el-checkbox-group v-model="scheduleForm.repeatDays">
            <el-checkbox label="1">周一</el-checkbox>
            <el-checkbox label="2">周二</el-checkbox>
            <el-checkbox label="3">周三</el-checkbox>
            <el-checkbox label="4">周四</el-checkbox>
            <el-checkbox label="5">周五</el-checkbox>
            <el-checkbox label="6">周六</el-checkbox>
            <el-checkbox label="0">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="目标温度">
          <el-input-number v-model="scheduleForm.targetTemp" :min="16" :max="30" />
        </el-form-item>
        <el-form-item label="启用定时">
          <el-switch v-model="scheduleForm.enabled" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="scheduleDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveScheduleSettings">保存设置</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "HvacDeviceDetail",
  
  data() {
    return {
      // ========== 页面状态 ==========
      pageLoading: true,
      resizeTimer: null,
      
      // ========== 路由参数 ==========
      routeParams: {
        deviceId: null,
        serialNumber: null,
        name: null,
      },
      
      // ========== 设备基本信息 ==========
      deviceInfo: {
        id: "AC001",
        serialNumber: "HVAC-2024-001506",
        name: "展销空调-01",
        location: "中心大厦A栋-1F展销大厅",
        online: true,
        power: true,
        status: "running",
        currentTemp: 24,
        setTemp: 26,
        mode: "cool", // cool, heat, dry, fan, auto
        fanSpeed: "mid", // low, mid, high, auto
        powerUsage: 3.2,
        swingH: false,
        swingV: true,
        brand: "格力",
        model: "KFR-35GW",
        lastUpdate: this.getCurrentTime(),
        installDate: "2023-03-15",
        autoAdjust: false,
        energySaving: false,
        maxTemp: 30,
        minTemp: 16,
      },
      
      // ========== 项目配置信息 ==========
      projectConfig: {
        projectName: "中心大厦A栋",
        tenant: "",
        gatewayMac: "A1:23:45:67:89:AB",
        deviceType: "多联机",
        shareType: "专用",
        meterNumber: "A12308253400362",
        billingMethod: "时长计费",
        coilCoefficient: 63,
        fanPower: 0.8,
        highCoefficient: 1.2,
        midCoefficient: 1.1,
        lowCoefficient: 1.0,
      },
      
      // ========== 能耗数据 ==========
      todayEnergy: 18.6,
      
      // ========== 控制加载状态 ==========
      controlLoading: {
        power: false,
        temp: false,
        mode: false,
        fanSpeed: false,
      },
      
      // ========== 图表统计数据 ==========
      chartStats: {
        avgTemp: 25.2,
        tempChange: -0.3,
        tempChangeClass: "decrease",
        runningHours: 8.5,
        runningChange: 8,
        totalEnergy: 18.6,
        energyChange: 5.2,
        energyChangeClass: "increase",
        avgPower: 2.8,
        energyLevel: "二级能效",
        tempAccuracy: 95,
      },
      
      // ========== 查询参数 ==========
      queryParams: {
        deviceId: "AC001",
        dateRange: null,
      },
      
      // ========== 活跃标签页 ==========
      activeTab: "温度数据",
      
      // ========== 运行记录数据 ==========
      operationRecords: [],
      
      // ========== 控制历史数据 ==========
      controlHistory: [],
      
      // ========== 设备用能统计数据 ==========
      energyStatsData: [],
      
      // ========== 弹窗状态 ==========
      advancedDialog: { visible: false },
      scheduleDialog: { visible: false },
      
      // ========== 表单数据 ==========
      advancedForm: {
        name: "",
        location: "",
        maxTemp: 30,
        minTemp: 16,
        autoAdjust: false,
        energySaving: false,
      },
      
      scheduleForm: {
        startTime: "08:00",
        endTime: "18:00",
        repeatDays: ["1", "2", "3", "4", "5"],
        targetTemp: 24,
        enabled: false,
      },
      
      // ========== 图表实例 ==========
      temperatureChart: null,
      
      // ========== 映射常量 ==========
      modeMap: {
        cool: "制冷",
        heat: "制热", 
        dry: "除湿",
        fan: "送风",
        auto: "自动"
      },
      
      fanSpeedMap: {
        low: "低风",
        mid: "中风", 
        high: "高风",
        auto: "自动"
      },

      // ========== 完善的设备数据映射 ==========
      deviceDataMapping: {
        "AC001": {
          name: "展销空调-01",
          serialNumber: "HVAC-2024-001506",
          currentTemp: 24,
          setTemp: 26,
          powerUsage: 3.2,
          mode: "cool",
          fanSpeed: "mid",
          brand: "格力",
          model: "KFR-35GW",
          location: "中心大厦A栋-1F展销大厅",
          area: "A",
          floor: 1,
          room: "展销大厅",
          installDate: "2023-03-15",
          online: true,
          power: true,
          status: "running",
          projectConfig: {
            projectName: "中心大厦A栋",
            gatewayMac: "A1:23:45:67:89:AB",
            meterNumber: "A12308253400362",
            deviceType: "多联机",
            shareType: "公共",
            billingMethod: "时长计费",
            coilCoefficient: 68,
            fanPower: 0.8,
            highCoefficient: 1.3,
            midCoefficient: 1.1,
            lowCoefficient: 0.9
          }
        },
        "AC002": {
          name: "会议空调-01", 
          serialNumber: "HVAC-2024-001507",
          currentTemp: 25,
          setTemp: 23,
          powerUsage: 2.8,
          mode: "cool",
          fanSpeed: "high",
          brand: "美的",
          model: "KFR-50GW",
          location: "中心大厦A栋-2F会议接待厅",
          area: "A",
          floor: 2,
          room: "会议接待厅",
          installDate: "2023-03-15",
          online: true,
          power: true,
          status: "running",
          projectConfig: {
            projectName: "中心大厦A栋",
            gatewayMac: "A1:23:45:67:89:AB",
            meterNumber: "A12308253400363",
            deviceType: "风管机",
            shareType: "公共",
            billingMethod: "时长计费",
            coilCoefficient: 72,
            fanPower: 1.2,
            highCoefficient: 1.4,
            midCoefficient: 1.2,
            lowCoefficient: 1.0
          }
        },
        "AC003": {
          name: "营销空调-05",
          serialNumber: "HVAC-2024-001508",
          currentTemp: 26,
          setTemp: 24,
          powerUsage: 2.1,
          mode: "cool",
          fanSpeed: "auto",
          brand: "大金",
          model: "FTXS35",
          location: "中心大厦A栋-3F市场营销部",
          area: "A",
          floor: 3,
          room: "营销部办公区",
          installDate: "2023-04-20",
          online: true,
          power: true,
          status: "running",
          projectConfig: {
            projectName: "中心大厦A栋",
            gatewayMac: "A1:23:45:67:89:AB",
            meterNumber: "A12308253400364",
            deviceType: "壁挂机",
            shareType: "专用",
            billingMethod: "电量计费",
            coilCoefficient: 58,
            fanPower: 0.6,
            highCoefficient: 1.2,
            midCoefficient: 1.0,
            lowCoefficient: 0.8
          }
        },
        "AC004": {
          name: "研发空调-08",
          serialNumber: "HVAC-2024-001509",
          currentTemp: 28,
          setTemp: 22,
          powerUsage: 0,
          mode: "cool",
          fanSpeed: "mid",
          brand: "格力",
          model: "KFR-26GW",
          location: "中心大厦A栋-4F技术研发部",
          area: "A",
          floor: 4,
          room: "研发部办公区",
          installDate: "2023-03-15",
          online: false,
          power: false,
          status: "offline",
          projectConfig: {
            projectName: "中心大厦A栋",
            gatewayMac: "A1:23:45:67:89:AB",
            meterNumber: "A12308253400365",
            deviceType: "壁挂机",
            shareType: "专用",
            billingMethod: "电量计费",
            coilCoefficient: 55,
            fanPower: 0.5,
            highCoefficient: 1.1,
            midCoefficient: 1.0,
            lowCoefficient: 0.9
          }
        },
        "AC005": {
          name: "行政空调-03",
          serialNumber: "HVAC-2024-001510",
          currentTemp: 23,
          setTemp: 24,
          powerUsage: 1.8,
          mode: "heat",
          fanSpeed: "low",
          brand: "海尔",
          model: "KFR-35GW",
          location: "中心大厦A栋-5F行政办公室",
          area: "A",
          floor: 5,
          room: "行政办公室",
          installDate: "2023-05-10",
          online: true,
          power: true,
          status: "running",
          projectConfig: {
            projectName: "中心大厦A栋",
            gatewayMac: "A1:23:45:67:89:AB",
            meterNumber: "A12308253400366",
            deviceType: "壁挂机",
            shareType: "专用",
            billingMethod: "时长计费",
            coilCoefficient: 60,
            fanPower: 0.7,
            highCoefficient: 1.2,
            midCoefficient: 1.1,
            lowCoefficient: 0.9
          }
        },
        "AC006": {
          name: "停车空调-02",
          serialNumber: "HVAC-2024-001511",
          currentTemp: 18,
          setTemp: 20,
          powerUsage: 0,
          mode: "fan",
          fanSpeed: "high",
          brand: "美的",
          model: "KFR-26GW",
          location: "创新大厦B栋-B1地下停车库",
          area: "B",
          floor: -1,
          room: "停车库",
          installDate: "2023-05-10",
          online: true,
          power: false,
          status: "standby",
          projectConfig: {
            projectName: "创新大厦B栋",
            gatewayMac: "B1:23:45:67:89:CD",
            meterNumber: "B12308253400367",
            deviceType: "柜机",
            shareType: "公共",
            billingMethod: "电量计费",
            coilCoefficient: 85,
            fanPower: 2.2,
            highCoefficient: 1.5,
            midCoefficient: 1.3,
            lowCoefficient: 1.1
          }
        },
        "AC007": {
          name: "接待空调-01",
          serialNumber: "HVAC-2024-001512",
          currentTemp: 25,
          setTemp: 23,
          powerUsage: 2.9,
          mode: "cool",
          fanSpeed: "auto",
          brand: "格力",
          model: "KFR-35GW",
          location: "创新大厦B栋-1F接待大厅",
          area: "B",
          floor: 1,
          room: "接待大厅",
          installDate: "2023-06-01",
          online: true,
          power: true,
          status: "running",
          projectConfig: {
            projectName: "创新大厦B栋",
            gatewayMac: "B1:23:45:67:89:CD",
            meterNumber: "B12308253400368",
            deviceType: "吊顶机",
            shareType: "公共",
            billingMethod: "时长计费",
            coilCoefficient: 70,
            fanPower: 1.0,
            highCoefficient: 1.3,
            midCoefficient: 1.1,
            lowCoefficient: 0.9
          }
        },
        "AC008": {
          name: "餐厅空调-03",
          serialNumber: "HVAC-2024-001513",
          currentTemp: 27,
          setTemp: 25,
          powerUsage: 3.8,
          mode: "cool",
          fanSpeed: "mid",
          brand: "大金",
          model: "FTXS50",
          location: "创新大厦B栋-2F餐厅食堂",
          area: "B",
          floor: 2,
          room: "餐厅食堂",
          installDate: "2023-06-01",
          online: true,
          power: true,
          status: "running",
          projectConfig: {
            projectName: "创新大厦B栋",
            gatewayMac: "B1:23:45:67:89:CD",
            meterNumber: "B12308253400369",
            deviceType: "多联机",
            shareType: "公共",
            billingMethod: "电量计费",
            coilCoefficient: 75,
            fanPower: 1.5,
            highCoefficient: 1.4,
            midCoefficient: 1.2,
            lowCoefficient: 1.0
          }
        }
      }
    };
  },
  
  // ========== 生命周期钩子 ==========
  async mounted() {
    console.log("空调详情页组件已挂载");
    
    // 提取路由参数
    this.extractRouteParams();
    
    // 初始化默认时间范围
    this.initDefaultDateRange();
    
    // 模拟加载数据
    await this.loadDeviceData();
    
    // 初始化图表
    this.$nextTick(() => {
      this.initCharts();
    });
    
    // 加载echarts库
    if (typeof echarts === "undefined") {
      this.loadEcharts();
    }
    
    // 添加窗口resize监听
    window.addEventListener("resize", this.handleResize);
  },
  
  beforeDestroy() {
    // 清理定时器
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    
    // 移除事件监听
    window.removeEventListener("resize", this.handleResize);
    
    // 销毁图表实例
    if (this.temperatureChart) {
      this.temperatureChart.dispose();
    }
  },
  
  methods: {
    // ========== 初始化方法 ==========
    extractRouteParams() {
      this.routeParams.deviceId = this.$route.params.id || this.$route.query.deviceId || "AC001";
      this.routeParams.serialNumber = this.$route.query.serial || null;
      this.routeParams.name = this.$route.query.name || null;
      
      if (this.routeParams.deviceId) {
        this.queryParams.deviceId = this.routeParams.deviceId;
        this.deviceInfo.id = this.routeParams.deviceId;
      }
      if (this.routeParams.name) {
        this.deviceInfo.name = this.routeParams.name;
      }
      if (this.routeParams.serialNumber) {
        this.deviceInfo.serialNumber = this.routeParams.serialNumber;
      }

      console.log("提取的路由参数:", this.routeParams);
    },
    
    initDefaultDateRange() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      this.queryParams.dateRange = [
        this.formatDateTime(start),
        this.formatDateTime(end)
      ];
    },
    
    async loadDeviceData() {
      this.pageLoading = true;
      
      try {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        if (this.routeParams.deviceId) {
          this.mapDeviceDataFromList(this.routeParams.deviceId);
        }
        
        // 生成历史数据
        this.generateHistoryData();
        
        // 更新最后更新时间
        this.deviceInfo.lastUpdate = this.getCurrentTime();
        
        console.log("设备数据加载完成:", this.deviceInfo);
        
      } catch (error) {
        console.error("加载设备数据失败:", error);
        this.$message.error("加载设备数据失败");
      } finally {
        this.pageLoading = false;
      }
    },
    
    // 从外层列表数据映射设备信息
    mapDeviceDataFromList(deviceId) {
      const deviceData = this.deviceDataMapping[deviceId];
      if (deviceData) {
        // 映射基本信息
        Object.assign(this.deviceInfo, deviceData);
        
        // 映射项目配置
        if (deviceData.projectConfig) {
          Object.assign(this.projectConfig, deviceData.projectConfig);
        }
        
        // 调整统计数据
        this.adjustStatsData(deviceData);
        
        console.log("设备数据映射完成:", this.deviceInfo);
      } else {
        console.log("未找到设备数据，使用默认配置");
      }
    },
    
    // 调整统计数据
    adjustStatsData(deviceData) {
      // 根据设备运行状态调整统计数据
      if (deviceData.power && deviceData.online) {
        this.todayEnergy = (deviceData.powerUsage * (6 + Math.random() * 4)).toFixed(1);
        this.chartStats.avgTemp = deviceData.currentTemp;
        this.chartStats.runningHours = (Math.random() * 8 + 4).toFixed(1);
        this.chartStats.totalEnergy = this.todayEnergy;
        this.chartStats.tempAccuracy = Math.floor(Math.random() * 10 + 90);
      } else {
        this.todayEnergy = (Math.random() * 2).toFixed(1);
        this.chartStats.runningHours = (Math.random() * 2).toFixed(1);
        this.chartStats.totalEnergy = this.todayEnergy;
        this.chartStats.tempAccuracy = Math.floor(Math.random() * 20 + 60);
      }
    },

    // 生成历史数据
    generateHistoryData() {
      this.generateOperationRecords();
      this.generateControlHistory();
      this.generateEnergyStats();
    },

    // 生成运行记录
    generateOperationRecords() {
      const operations = ["温度调节", "开机启动", "关机停止", "模式切换", "风速调节"];
      const modes = ["制冷", "制热", "除湿", "送风", "自动"];
      const fanSpeeds = ["低风", "中风", "高风", "自动"];
      const operators = ["手动控制", "定时任务", "自动控制"];
      
      this.operationRecords = [];
      
      // 生成最近3天的记录
      for (let day = 0; day < 3; day++) {
        const recordCount = Math.floor(Math.random() * 8) + 5; // 每天5-12条记录
        
        for (let i = 0; i < recordCount; i++) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          date.setHours(Math.floor(Math.random() * 24));
          date.setMinutes(Math.floor(Math.random() * 60));
          date.setSeconds(Math.floor(Math.random() * 60));
          
          const operation = operations[Math.floor(Math.random() * operations.length)];
          const beforeTemp = Math.floor(Math.random() * 8) + 20;
          const afterTemp = operation === "温度调节" ? 
            Math.floor(Math.random() * 8) + 20 : beforeTemp;
          
          const record = {
            time: this.formatDateTime(date),
            operation: operation,
            beforeTemp: beforeTemp,
            afterTemp: afterTemp,
            mode: modes[Math.floor(Math.random() * modes.length)],
            fanSpeed: fanSpeeds[Math.floor(Math.random() * fanSpeeds.length)],
            powerUsage: operation.includes("关机") ? 0 : (Math.random() * 3 + 1).toFixed(1),
            duration: this.generateDuration(),
            result: Math.random() > 0.05 ? "成功" : "失败",
            operator: operators[Math.floor(Math.random() * operators.length)]
          };
          
          this.operationRecords.push(record);
        }
      }
      
      // 按时间排序
      this.operationRecords.sort((a, b) => new Date(b.time) - new Date(a.time));
    },

    // 生成控制历史
    generateControlHistory() {
      const operationTypes = ["开启", "关闭", "温度调节", "模式切换", "风速调节"];
      const operators = ["手动控制", "定时任务", "自动控制", "APP控制"];
      const networkTypes = ["WiFi", "以太网", "4G"];
      const statusList = ["运行", "关闭", "待机", "制冷模式", "制热模式"];
      
      this.controlHistory = [];
      
      // 生成最近7天的记录
      for (let day = 0; day < 7; day++) {
        const recordCount = Math.floor(Math.random() * 6) + 3; // 每天3-8条记录
        
        for (let i = 0; i < recordCount; i++) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          date.setHours(Math.floor(Math.random() * 24));
          date.setMinutes(Math.floor(Math.random() * 60));
          date.setSeconds(Math.floor(Math.random() * 60));
          
          const operationType = operationTypes[Math.floor(Math.random() * operationTypes.length)];
          const beforeStatus = statusList[Math.floor(Math.random() * statusList.length)];
          const afterStatus = statusList[Math.floor(Math.random() * statusList.length)];
          
          const record = {
            time: this.formatDateTime(date),
            operationType: operationType,
            operator: operators[Math.floor(Math.random() * operators.length)],
            beforeStatus: beforeStatus,
            afterStatus: afterStatus,
            signalStrength: `-${Math.floor(Math.random() * 30) + 40}dBm`,
            networkType: networkTypes[Math.floor(Math.random() * networkTypes.length)],
            responseTime: `${Math.floor(Math.random() * 150) + 50}ms`,
            result: Math.random() > 0.03 ? "成功" : "失败",
            remark: this.generateRemark(operationType)
          };
          
          this.controlHistory.push(record);
        }
      }
      
      // 按时间排序
      this.controlHistory.sort((a, b) => new Date(b.time) - new Date(a.time));
    },

    // 生成用能统计
    generateEnergyStats() {
      const timeTypes = ["今日", "昨日", "本周", "本月"];
      this.energyStatsData = [];
      
      timeTypes.forEach(timeType => {
        let multiplier = 1;
        switch(timeType) {
          case "今日": multiplier = 1; break;
          case "昨日": multiplier = 0.9; break;
          case "本周": multiplier = 6.5; break;
          case "本月": multiplier = 28; break;
        }
        
        const highWindTime = (Math.random() * 3 * multiplier).toFixed(1);
        const midWindTime = (Math.random() * 5 * multiplier).toFixed(1);
        const lowWindTime = (Math.random() * 4 * multiplier).toFixed(1);
        const autoWindTime = (Math.random() * 2 * multiplier).toFixed(1);
        
        const highWindEnergy = (highWindTime * 3.2).toFixed(1);
        const midWindEnergy = (midWindTime * 2.8).toFixed(1);
        const lowWindEnergy = (lowWindTime * 2.1).toFixed(1);
        const autoWindEnergy = (autoWindTime * 2.5).toFixed(1);
        
        const totalEnergy = (parseFloat(highWindEnergy) + parseFloat(midWindEnergy) + 
                           parseFloat(lowWindEnergy) + parseFloat(autoWindEnergy)).toFixed(1);
        
        this.energyStatsData.push({
          timeType,
          highWindTime,
          highWindEnergy,
          midWindTime,
          midWindEnergy,
          lowWindTime,
          lowWindEnergy,
          autoWindTime,
          autoWindEnergy,
          totalEnergy
        });
      });
    },

    generateDuration() {
      const durations = [
        "持续运行", "30分钟", "1小时15分", "2小时30分", 
        "45分钟", "3小时", "1小时", "4小时15分"
      ];
      return durations[Math.floor(Math.random() * durations.length)];
    },

    generateRemark(operationType) {
      const remarks = {
        "开启": ["定时开启", "手动开启", "自动开启", "远程开启"],
        "关闭": ["定时关闭", "手动关闭", "节能关闭", "下班关闭"],
        "温度调节": ["用户调节", "自动调节", "节能调节", "舒适度调节"],
        "模式切换": ["季节切换", "手动切换", "自动切换", "临时调整"],
        "风速调节": ["舒适度调节", "噪音调节", "节能调节", "手动调节"]
      };
      
      const remarkList = remarks[operationType] || ["正常操作"];
      return remarkList[Math.floor(Math.random() * remarkList.length)];
    },
    
    loadEcharts() {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js";
      script.onload = () => {
        this.initCharts();
      };
      document.head.appendChild(script);
    },
    
    getCurrentTime() {
      return this.formatDateTime(new Date());
    },
    
    // ========== 图表相关方法 ==========
    initCharts() {
      this.$nextTick(() => {
        if (typeof echarts !== "undefined") {
          this.initTemperatureChart();
        }
      });
    },
    
    initTemperatureChart() {
      const chartDom = this.$refs.temperatureChart;
      if (!chartDom) return;
      
      this.temperatureChart = echarts.init(chartDom);
      this.updateTemperatureChart();
    },
    
    updateTemperatureChart() {
      if (!this.temperatureChart) return;
      
      // 生成24小时温度数据
      const hours = [];
      const currentTemp = [];
      const targetTemp = [];
      
      for (let i = 0; i < 24; i++) {
        hours.push(String(i).padStart(2, '0') + ':00');
        
        // 模拟当前温度数据（更真实的变化）
        let baseTemp;
        if (i >= 8 && i <= 18) {
          // 工作时间，空调运行，温度相对稳定
          baseTemp = this.deviceInfo.currentTemp + Math.sin((i - 8) * Math.PI / 10) * 1.5 + Math.random() * 0.8 - 0.4;
        } else if (i >= 19 && i <= 22) {
          // 晚上时间，部分运行
          baseTemp = this.deviceInfo.currentTemp + 2 + Math.sin((i - 19) * Math.PI / 4) * 1 + Math.random() * 0.6 - 0.3;
        } else {
          // 夜间和早晨，空调关闭，温度上升
          baseTemp = this.deviceInfo.currentTemp + 4 + Math.sin(i * Math.PI / 12) * 2 + Math.random() * 1 - 0.5;
        }
        currentTemp.push(Math.max(18, Math.min(32, baseTemp)).toFixed(1));
        
        // 模拟目标温度数据
        if (i >= 8 && i <= 18) {
          targetTemp.push(this.deviceInfo.setTemp); // 工作时间
        } else if (i >= 19 && i <= 22) {
          targetTemp.push(this.deviceInfo.setTemp + 1); // 晚间时间
        } else {
          targetTemp.push(this.deviceInfo.setTemp + 4); // 关闭时间设定温度
        }
      }
      
      const option = {
        backgroundColor: "transparent",
        grid: {
          left: "60px",
          right: "40px", 
          top: "40px",
          bottom: "60px",
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#ffffff",
          borderColor: "#e8e8e8",
          borderWidth: 1,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            color: "#262626",
            fontSize: 13,
            lineHeight: 20,
          },
          formatter: function(params) {
            let html = `<div style="line-height: 1.8;">`;
            html += `<div style="font-weight: 600; margin-bottom: 8px; color: #262626;">${params[0].name}</div>`;
            
            params.forEach(param => {
              if (param.value !== null && param.value !== undefined) {
                const color = param.seriesName === '当前温度' ? '#1890ff' : '#52c41a';
                html += `<div style="color: ${color}; margin-bottom: 4px; display: flex; align-items: center;">`;
                html += `<span style="display: inline-block; width: 8px; height: 8px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>`;
                html += `${param.seriesName}: ${param.value}°C</div>`;
              }
            });
            html += '</div>';
            return html;
          },
        },
        legend: {
          data: ["当前温度", "目标温度"],
          top: 10,
          right: 20,
          textStyle: {
            color: "#595959",
            fontSize: 12,
          },
        },
        xAxis: {
          type: "category",
          data: hours,
          axisLabel: {
            color: "#8c8c8c",
            fontSize: 12,
          },
          axisLine: {
            show: true,
            lineStyle: { 
              color: "#f0f0f0",
              width: 1
            }
          },
          axisTick: {
            show: false
          },
        },
        yAxis: {
          type: "value",
          min: 18,
          max: 32,
          axisLabel: {
            color: "#8c8c8c", 
            fontSize: 12,
            formatter: "{value}°C",
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
        },
        series: [
          {
            name: "当前温度",
            data: currentTemp,
            type: "line",
            smooth: true,
            symbol: "none",
            lineStyle: {
              color: "#1890ff",
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
                  { offset: 0, color: "rgba(24, 144, 255, 0.15)" },
                  { offset: 1, color: "rgba(24, 144, 255, 0.01)" },
                ],
              },
            },
          },
          {
            name: "目标温度",
            data: targetTemp,
            type: "line",
            smooth: true,
            symbol: "none",
            lineStyle: {
              color: "#52c41a",
              width: 2,
            },
          },
        ],
      };
      
      this.temperatureChart.setOption(option);
    },
    
    // ========== 设备控制方法 ==========
    async togglePower() {
      this.controlLoading.power = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.deviceInfo.power = !this.deviceInfo.power;
        
        if (!this.deviceInfo.power) {
          this.deviceInfo.powerUsage = 0;
          this.deviceInfo.status = "standby";
        } else {
          this.deviceInfo.powerUsage = this.calculatePower();
          this.deviceInfo.status = "running";
        }
        
        // 添加操作记录
        this.addOperationRecord({
          operation: this.deviceInfo.power ? "开机启动" : "关机停止",
          beforeTemp: this.deviceInfo.currentTemp,
          afterTemp: this.deviceInfo.currentTemp,
          mode: this.getModeText(this.deviceInfo.mode),
          fanSpeed: this.getFanSpeedText(this.deviceInfo.fanSpeed),
          powerUsage: this.deviceInfo.powerUsage,
        });
        
        this.$message.success(`设备已${this.deviceInfo.power ? '开启' : '关闭'}`);
      } catch (error) {
        this.$message.error("操作失败");
      } finally {
        this.controlLoading.power = false;
      }
    },
    
    async adjustTemp(delta) {
      const newTemp = this.deviceInfo.setTemp + delta;
      if (newTemp >= 16 && newTemp <= 30) {
        const oldTemp = this.deviceInfo.setTemp;
        this.deviceInfo.setTemp = newTemp;
        
        if (this.deviceInfo.power) {
          this.deviceInfo.powerUsage = this.calculatePower();
        }
        
        // 添加操作记录
        this.addOperationRecord({
          operation: "温度调节",
          beforeTemp: oldTemp,
          afterTemp: newTemp,
          mode: this.getModeText(this.deviceInfo.mode),
          fanSpeed: this.getFanSpeedText(this.deviceInfo.fanSpeed),
          powerUsage: this.deviceInfo.powerUsage,
        });
        
        this.$message.success(`目标温度已调整为${newTemp}°C`);
      }
    },
    
    changeMode() {
      const modes = ["cool", "heat", "dry", "fan"];
      const currentIndex = modes.indexOf(this.deviceInfo.mode);
      const nextIndex = (currentIndex + 1) % modes.length;
      this.deviceInfo.mode = modes[nextIndex];
      
      if (this.deviceInfo.power) {
        this.deviceInfo.powerUsage = this.calculatePower();
      }
      
      // 添加操作记录
      this.addOperationRecord({
        operation: "模式切换",
        beforeTemp: this.deviceInfo.setTemp,
        afterTemp: this.deviceInfo.setTemp,
        mode: this.getModeText(this.deviceInfo.mode),
        fanSpeed: this.getFanSpeedText(this.deviceInfo.fanSpeed),
        powerUsage: this.deviceInfo.powerUsage,
      });
      
      this.$message.success(`模式已切换为${this.getModeText(this.deviceInfo.mode)}`);
    },
    
    adjustFanSpeed() {
      const speeds = ["low", "mid", "high", "auto"];
      const currentIndex = speeds.indexOf(this.deviceInfo.fanSpeed);
      const nextIndex = (currentIndex + 1) % speeds.length;
      this.deviceInfo.fanSpeed = speeds[nextIndex];
      
      if (this.deviceInfo.power) {
        this.deviceInfo.powerUsage = this.calculatePower();
      }
      
      // 添加操作记录
      this.addOperationRecord({
        operation: "风速调节",
        beforeTemp: this.deviceInfo.setTemp,
        afterTemp: this.deviceInfo.setTemp,
        mode: this.getModeText(this.deviceInfo.mode),
        fanSpeed: this.getFanSpeedText(this.deviceInfo.fanSpeed),
        powerUsage: this.deviceInfo.powerUsage,
      });
      
      this.$message.success(`风速已调整为${this.getFanSpeedText(this.deviceInfo.fanSpeed)}`);
    },

    toggleSwing() {
      this.deviceInfo.swingV = !this.deviceInfo.swingV;
      this.$message.success(`垂直摆风已${this.deviceInfo.swingV ? '开启' : '关闭'}`);
    },
    
    // ========== 弹窗相关方法 ==========
    showAdvancedSettings() {
      this.advancedForm = {
        name: this.deviceInfo.name,
        location: this.deviceInfo.location,
        maxTemp: this.deviceInfo.maxTemp,
        minTemp: this.deviceInfo.minTemp,
        autoAdjust: this.deviceInfo.autoAdjust,
        energySaving: this.deviceInfo.energySaving,
      };
      this.advancedDialog.visible = true;
    },
    
    async saveAdvancedSettings() {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        Object.assign(this.deviceInfo, this.advancedForm);
        this.advancedDialog.visible = false;
        this.$message.success("设置保存成功");
      } catch (error) {
        this.$message.error("设置保存失败");
      }
    },
    
    showScheduleDialog() {
      this.scheduleDialog.visible = true;
    },
    
    async saveScheduleSettings() {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.scheduleDialog.visible = false;
        this.$message.success("定时设置已保存");
      } catch (error) {
        this.$message.error("定时设置保存失败");
      }
    },
    
    // ========== 数据查询方法 ==========
    queryHistoryData() {
      this.$message.info("正在查询历史数据...");
      
      // 重新绘制图表
      setTimeout(() => {
        if (this.temperatureChart) {
          this.updateTemperatureChart();
        }
        this.$message.success("数据查询完成");
      }, 1000);
    },
    
    exportData() {
      this.$message.info("正在导出数据...");
      
      setTimeout(() => {
        // 模拟生成CSV文件并下载
        const csvContent = this.generateCSVContent();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `空调设备数据_${this.deviceInfo.id}_${this.formatDate(new Date())}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.$message.success("数据导出成功");
      }, 1000);
    },
    
    // ========== 工具方法 ==========
    getModeIcon(mode) {
      const iconMap = {
        cool: "❄",
        heat: "🔥",
        dry: "💧",
        fan: "🌀",
        auto: "🔄"
      };
      return iconMap[mode] || "❄";
    },
    
    calculatePower() {
      const baseMap = { 
        cool: 3.2, 
        heat: 3.8, 
        dry: 2.1, 
        fan: 0.6, 
        auto: 2.8 
      };
      const speedMap = { 
        low: 0.8, 
        mid: 1, 
        high: 1.3, 
        auto: 1 
      };
      
      const basePower = baseMap[this.deviceInfo.mode] || 2.8;
      const speedFactor = speedMap[this.deviceInfo.fanSpeed] || 1;
      
      return (basePower * speedFactor).toFixed(1);
    },
    
    getStatusTagType(status) {
      const typeMap = {
        running: "success",
        standby: "info", 
        offline: "danger",
        fault: "danger"
      };
      return typeMap[status] || "info";
    },
    
    getStatusText(device) {
      if (!device.online) return "离线";
      if (device.status === "fault") return "故障";
      if (device.power) return "运行中";
      return "待机";
    },
    
    getModeText(mode) {
      return this.modeMap[mode] || mode;
    },
    
    getFanSpeedText(speed) {
      return this.fanSpeedMap[speed] || speed;
    },
    
    // ========== 辅助方法 ==========
    formatDateTime(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}${month}${day}`;
    },
    
    addOperationRecord(record) {
      const newRecord = {
        time: this.getCurrentTime(),
        operation: record.operation,
        beforeTemp: record.beforeTemp,
        afterTemp: record.afterTemp,
        mode: record.mode,
        fanSpeed: record.fanSpeed,
        powerUsage: record.powerUsage,
        duration: "实时操作",
        result: "成功",
        operator: "手动控制"
      };
      
      this.operationRecords.unshift(newRecord);
      
      // 保持记录数量在50条以内
      if (this.operationRecords.length > 50) {
        this.operationRecords = this.operationRecords.slice(0, 50);
      }
    },
    
    generateCSVContent() {
      // 生成CSV文件内容
      const headers = ['时间', '操作类型', '操作前温度', '操作后温度', '模式', '风速', '功率(kW)', '运行时长', '执行结果', '操作来源'];
      const rows = this.operationRecords.map(record => {
        return [
          record.time,
          record.operation,
          record.beforeTemp,
          record.afterTemp,
          record.mode,
          record.fanSpeed,
          record.powerUsage,
          record.duration,
          record.result,
          record.operator
        ].join(',');
      });
      
      return [headers.join(','), ...rows].join('\n');
    },
    
    handleResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        if (this.temperatureChart) {
          this.temperatureChart.resize();
        }
      }, 100);
    },
    
    goBack() {
      this.$router.go(-1);
    }
  }
};
</script>

<style lang="scss" scoped>
// ========== 变量定义 ==========
$primary-color: #1890ff;
$success-color: #52c41a;
$warning-color: #faad14;
$danger-color: #ff4d4f;
$text-color: #262626;
$text-secondary: #8c8c8c;
$border-color: #e8e8e8;
$bg-color: #f5f6fa;
$card-bg: #ffffff;

.hvac-detail-page {
  min-height: 100vh;
  background: $bg-color;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

// ========== 页面加载动画 ==========
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
      color: $primary-color;
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ========== 页面头部 ==========
.page-header {
  background: $card-bg;
  border-bottom: 1px solid $border-color;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .back-btn {
      padding: 8px 12px;
      font-weight: 500;
      color: $primary-color;

      &:hover {
        background: rgba(24, 144, 255, 0.06);
      }
    }

    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: $text-color;
    }

    .device-tags {
      display: flex;
      gap: 8px;
    }
  }

  .header-right {
    .update-time {
      font-size: 13px;
      color: $text-secondary;
    }
  }
}

// ========== 页面主体 ==========
.page-body {
  padding: 20px 24px;
  display: flex;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

// ========== 左侧面板 ==========
.left-panel {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ========== 通用卡片样式 ==========
.remote-control-card,
.device-config-card,
.energy-stats-card,
.data-analysis-card {
  background: $card-bg;
  border-radius: 12px;
  border: 1px solid $border-color;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;

  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    background: linear-gradient(135deg, #fafbfc, #f8f9fa);

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: $text-color;
      display: flex;
      align-items: center;
      gap: 8px;

      i {
        color: $primary-color;
        font-size: 16px;
      }
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 12px;

      .control-group {
        display: flex;
        align-items: center;
        gap: 8px;

        .control-label {
          font-size: 13px;
          color: $text-color;
          font-weight: 500;
          white-space: nowrap;
        }
      }
    }
  }
}

// ========== 温控面板 ==========
.thermostat-controller {
  padding: 20px;

  .thermostat-panel {
    background: linear-gradient(145deg, #f8f9fa, #e9ecef);
    border: 2px solid #dee2e6;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .lcd-display {
      background: linear-gradient(135deg, #4a90e2, #357abd);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      color: white;
      text-align: center;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);

      .display-content {
        .main-temp {
          font-size: 48px;
          font-weight: 300;
          line-height: 1;
          margin-bottom: 4px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .temp-unit {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 12px;
          display: block;
        }

        .status-bar {
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          opacity: 0.9;

          .mode-indicator {
            font-size: 16px;
          }

          .current-temp {
            flex: 1;
            text-align: center;
          }

          .power-indicator {
            animation: blink 1.5s infinite;
          }
        }
      }
    }

    .control-buttons {
      .button-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .ctrl-button {
          background: linear-gradient(145deg, #ffffff, #f1f3f4);
          border: 1px solid #dadce0;
          border-radius: 6px;
          padding: 12px 8px;
          font-size: 12px;
          font-weight: 500;
          color: $text-color;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover:not(:disabled) {
            background: linear-gradient(145deg, #f8f9fa, #e9ecef);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }

          &:active:not(:disabled) {
            background: linear-gradient(145deg, #e9ecef, #dee2e6);
            transform: translateY(0);
          }

          &.power-button {
            &.active {
              background: linear-gradient(145deg, #52c41a, #389e0d);
              color: white;
              border-color: #52c41a;
              box-shadow: 0 0 8px rgba(82, 196, 26, 0.3);
            }
          }

          &.temp-up,
          &.temp-down {
            font-size: 16px;
            font-weight: bold;
          }

          &:disabled {
            background: #f5f5f5;
            color: #bfbfbf;
            cursor: not-allowed;
            border-color: #e8e8e8;
          }
        }
      }
    }
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

// ========== 设备信息与配置卡片 ==========
.device-config-content {
  padding: 20px;

  .info-section,
  .config-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      margin: 0 0 16px 0;
      font-size: 14px;
      font-weight: 600;
      color: $text-color;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: "";
        width: 3px;
        height: 14px;
        background: $primary-color;
        border-radius: 2px;
      }
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #fafbfc;
      border-radius: 6px;
      border: 1px solid #f0f0f0;

      .info-label {
        font-size: 12px;
        color: $text-secondary;
        font-weight: 500;
      }

      .info-value {
        font-size: 13px;
        color: $text-color;
        font-weight: 600;
        text-align: right;
        max-width: 140px;
        word-break: break-all;

        &.power-highlight {
          color: $primary-color;
          font-weight: 700;
        }

        &.energy-highlight {
          color: #fa8c16;
          font-weight: 700;
        }
      }
    }
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .config-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #fafbfc;
      border-radius: 6px;
      border: 1px solid #f0f0f0;

      .config-label {
        font-size: 12px;
        color: $text-secondary;
        font-weight: 500;
      }

      .config-value {
        font-size: 13px;
        color: $text-color;
        font-weight: 600;
        text-align: right;
        max-width: 140px;
        word-break: break-all;
      }
    }
  }
}

// ========== 右侧面板 ==========
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

// ========== 用能统计卡片 ==========
.energy-content {
  padding: 20px;

  .el-table {
    border-radius: 8px;
    overflow: hidden;
    width: 100% !important;

    ::v-deep .el-table__header th {
      background: #fafbfc;
      color: $text-color;
      font-weight: 600;
      border-bottom: 2px solid #e8e8e8;
    }

    ::v-deep .el-table__body tr:hover > td {
      background: #f5f7fa;
    }
  }
}

// ========== 数据分析卡片 ==========
.analysis-content {
  flex: 1;
  display: flex;
  flex-direction: column;

  .tab-controls {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafbfc;
  }

  .chart-container {
    padding: 20px;
    flex: 1;

    .chart-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 20px;

      .stat-item {
        text-align: center;
        padding: 16px;
        background: linear-gradient(135deg, #f8f9fa, #f0f0f0);
        border-radius: 8px;
        border: 1px solid #e8e8e8;

        .stat-label {
          display: block;
          font-size: 12px;
          color: $text-secondary;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: $primary-color;
        }
      }
    }

    .temperature-chart {
      width: 100%;
      height: 320px;
    }
  }

  .table-container {
    padding: 20px;
    flex: 1;

    .el-table {
      border-radius: 8px;
      overflow: hidden;
      width: 100% !important;

      ::v-deep .el-table__header th {
        background: #fafbfc;
        color: $text-color;
        font-weight: 600;
        border-bottom: 2px solid #e8e8e8;
      }

      ::v-deep .el-table__body tr:hover > td {
        background: #f5f7fa;
      }
    }
  }
}

// ========== 响应式设计 ==========
@media (max-width: 1400px) {
  .chart-stats {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .info-grid,
  .config-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 1200px) {
  .page-body {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
  }

  .chart-stats {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .info-grid,
  .config-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .header-left {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .page-title {
        font-size: 18px;
      }
    }
  }

  .page-body {
    padding: 16px;
  }

  .thermostat-controller {
    .thermostat-panel {
      .lcd-display .display-content .main-temp {
        font-size: 36px;
      }

      .control-buttons .button-row {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;

        .ctrl-button {
          min-height: 42px;
          font-size: 11px;
          padding: 8px 6px;
        }
      }
    }
  }

  .chart-stats {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .info-grid,
  .config-grid {
    grid-template-columns: 1fr !important;
  }

  .header-controls {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px !important;

    .control-group {
      width: 100%;

      .el-date-picker {
        width: 100% !important;
      }
    }
  }
}

@media (max-width: 480px) {
  .chart-stats {
    grid-template-columns: 1fr !important;
  }

  .thermostat-controller {
    .thermostat-panel .control-buttons .button-row {
      grid-template-columns: repeat(2, 1fr);

      .ctrl-button {
        min-height: 38px;
        font-size: 10px;
      }
    }
  }
}
</style>