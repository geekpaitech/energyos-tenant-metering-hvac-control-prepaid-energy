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
                      @click="adjustFanSpeed"
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
                    <span class="info-value">{{ deviceInfo.deviceId }}</span>
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
  
      <!-- 设备维护弹窗 -->
      <el-dialog
        title="设备维护"
        :visible.sync="maintenanceDialog.visible"
        width="400px"
      >
        <div class="maintenance-content">
          <el-alert
            title="维护提醒"
            type="info"
            description="定期维护可以延长设备使用寿命，提高运行效率。"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <el-form label-width="80px">
            <el-form-item label="维护类型">
              <el-select v-model="maintenanceForm.type" style="width: 100%">
                <el-option label="清洁滤网" value="filter_clean" />
                <el-option label="系统检测" value="system_check" />
                <el-option label="制冷剂检查" value="refrigerant_check" />
                <el-option label="电路检测" value="circuit_check" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="maintenanceForm.remark" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
        </div>
        <span slot="footer">
          <el-button @click="maintenanceDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="performMaintenance">执行维护</el-button>
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
          deviceId: "AC001",
          serialNumber: "HVAC-2023-001506",
          name: "君联大厦-15层-公共区域空调",
          location: "君联大厦-15层-公共区域",
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
          brand: "Hitachi",
          model: "RAP-50RXN",
          lastUpdate: this.getCurrentTime(),
          installDate: "2023-03-15",
          autoAdjust: false,
          energySaving: false,
          maxTemp: 30,
          minTemp: 16,
        },
        
        // ========== 项目配置信息 ==========
        projectConfig: {
          projectName: "君联商务大厦",
          tenant: "",
          gatewayMac: "29",
          deviceType: "多联机",
          shareType: "专用",
          meterNumber: "12308253400362",
          billingMethod: "时长计费",
          coilCoefficient: 63,
          fanPower: 0,
          highCoefficient: 1.2,
          midCoefficient: 1.1,
          lowCoefficient: 1,
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
          runningHours: 12.5,
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
        operationRecords: [
          {
            time: "2025-08-08 14:30:15",
            operation: "温度调节",
            beforeTemp: 26,
            afterTemp: 24,
            mode: "制冷",
            fanSpeed: "中风",
            powerUsage: 3.2,
            duration: "持续运行",
            result: "成功",
            operator: "手动控制"
          },
          {
            time: "2025-08-08 08:00:00",
            operation: "开机启动",
            beforeTemp: 28,
            afterTemp: 28,
            mode: "制冷",
            fanSpeed: "自动",
            powerUsage: 3.5,
            duration: "6小时30分",
            result: "成功",
            operator: "定时任务"
          },
          {
            time: "2025-08-07 18:00:00",
            operation: "定时关机",
            beforeTemp: 25,
            afterTemp: 25,
            mode: "制冷",
            fanSpeed: "低风",
            powerUsage: 0,
            duration: "14小时",
            result: "成功",
            operator: "定时任务"
          },
          {
            time: "2025-08-07 16:45:30",
            operation: "模式切换",
            beforeTemp: 24,
            afterTemp: 24,
            mode: "送风",
            fanSpeed: "低风",
            powerUsage: 0.8,
            duration: "1小时15分",
            result: "成功",
            operator: "手动控制"
          },
          {
            time: "2025-08-07 14:20:10",
            operation: "风速调节",
            beforeTemp: 23,
            afterTemp: 23,
            mode: "制冷",
            fanSpeed: "高风",
            powerUsage: 4.1,
            duration: "2小时25分",
            result: "成功",
            operator: "自动控制"
          },
          {
            time: "2025-08-07 12:15:45",
            operation: "温度调节",
            beforeTemp: 25,
            afterTemp: 23,
            mode: "制冷",
            fanSpeed: "中风",
            powerUsage: 3.1,
            duration: "2小时5分",
            result: "成功",
            operator: "手动控制"
          }
        ],
        
        // ========== 控制历史数据 ==========
        controlHistory: [
          {
            time: "2025-08-08 14:30:15",
            operationType: "温度调节",
            operator: "手动控制",
            beforeStatus: "26°C制冷",
            afterStatus: "24°C制冷",
            signalStrength: "-52dBm",
            networkType: "WiFi",
            responseTime: "120ms",
            result: "成功",
            remark: "用户手动调节"
          },
          {
            time: "2025-08-08 08:00:00",
            operationType: "开启",
            operator: "定时任务",
            beforeStatus: "关闭",
            afterStatus: "运行",
            signalStrength: "-48dBm",
            networkType: "WiFi",
            responseTime: "95ms",
            result: "成功",
            remark: "工作日定时开启"
          },
          {
            time: "2025-08-07 18:00:00",
            operationType: "关闭",
            operator: "定时任务",
            beforeStatus: "运行",
            afterStatus: "关闭",
            signalStrength: "-55dBm",
            networkType: "WiFi",
            responseTime: "110ms",
            result: "成功",
            remark: "下班时间自动关闭"
          },
          {
            time: "2025-08-07 16:45:30",
            operationType: "模式切换",
            operator: "手动控制",
            beforeStatus: "制冷模式",
            afterStatus: "送风模式",
            signalStrength: "-51dBm",
            networkType: "WiFi",
            responseTime: "88ms",
            result: "成功",
            remark: "临时调整为送风模式"
          }
        ],
        
        // ========== 设备用能统计数据 ==========
        energyStatsData: [
          {
            timeType: "今日",
            highWindTime: 2.5,
            highWindEnergy: 8.2,
            midWindTime: 4.8,
            midWindEnergy: 12.6,
            lowWindTime: 3.2,
            lowWindEnergy: 6.4,
            autoWindTime: 1.8,
            autoWindEnergy: 4.1,
            totalEnergy: 31.3
          },
          {
            timeType: "昨日", 
            highWindTime: 2.2,
            highWindEnergy: 7.5,
            midWindTime: 4.5,
            midWindEnergy: 11.8,
            lowWindTime: 2.8,
            lowWindEnergy: 5.9,
            autoWindTime: 1.5,
            autoWindEnergy: 3.8,
            totalEnergy: 29.0
          },
          {
            timeType: "本周",
            highWindTime: 16.8,
            highWindEnergy: 52.3,
            midWindTime: 32.5,
            midWindEnergy: 84.2,
            lowWindTime: 21.6,
            lowWindEnergy: 42.8,
            autoWindTime: 12.4,
            autoWindEnergy: 25.6,
            totalEnergy: 204.9
          },
          {
            timeType: "本月",
            highWindTime: 68.5,
            highWindEnergy: 218.6,
            midWindTime: 125.8,
            midWindEnergy: 328.5,
            lowWindTime: 89.2,
            lowWindEnergy: 176.4,
            autoWindTime: 48.6,
            autoWindEnergy: 98.2,
            totalEnergy: 821.7
          }
        ],
        
        // ========== 弹窗状态 ==========
        advancedDialog: { visible: false },
        maintenanceDialog: { visible: false },
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
        
        maintenanceForm: {
          type: "filter_clean",
          remark: "",
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
        this.routeParams.deviceId = this.$route.params.id || this.$route.query.deviceId || null;
        this.routeParams.serialNumber = this.$route.query.serial || null;
        this.routeParams.name = this.$route.query.name || null;
        
        if (this.routeParams.deviceId) {
          this.queryParams.deviceId = this.routeParams.deviceId;
          this.deviceInfo.deviceId = this.routeParams.deviceId;
        }
        if (this.routeParams.name) {
          this.deviceInfo.name = this.routeParams.name;
        }
        if (this.routeParams.serialNumber) {
          this.deviceInfo.serialNumber = this.routeParams.serialNumber;
        }
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
            this.simulateDataByDeviceId(this.routeParams.deviceId);
          }
          
          // 更新最后更新时间
          this.deviceInfo.lastUpdate = this.getCurrentTime();
          
        } catch (error) {
          console.error("加载设备数据失败:", error);
          this.$message.error("加载设备数据失败");
        } finally {
          this.pageLoading = false;
        }
      },
      
      simulateDataByDeviceId(deviceId) {
        // 根据不同的设备ID返回不同的模拟数据
        const deviceDataMap = {
          "AC001": {
            name: "君联大厦-15层-公共区域空调",
            serialNumber: "HVAC-2023-001506", 
            currentTemp: 24,
            setTemp: 26,
            powerUsage: 3.2,
            mode: "cool",
            fanSpeed: "mid"
          },
          "AC002": {
            name: "君联大厦-16层-会议室空调",
            serialNumber: "HVAC-2023-001607",
            currentTemp: 22,
            setTemp: 25,
            powerUsage: 2.8,
            mode: "heat",
            fanSpeed: "high"
          },
          "AC003": {
            name: "君联大厦-17层-办公区空调",
            serialNumber: "HVAC-2023-001708",
            currentTemp: 26,
            setTemp: 22,
            powerUsage: 3.5,
            mode: "dry",
            fanSpeed: "low"
          }
        };
        
        const deviceData = deviceDataMap[deviceId];
        if (deviceData) {
          Object.assign(this.deviceInfo, deviceData);
        }
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
            baseTemp = 24 + Math.sin((i - 8) * Math.PI / 10) * 1.5 + Math.random() * 0.8 - 0.4;
          } else if (i >= 19 && i <= 22) {
            // 晚上时间，部分运行
            baseTemp = 26 + Math.sin((i - 19) * Math.PI / 4) * 1 + Math.random() * 0.6 - 0.3;
          } else {
            // 夜间和早晨，空调关闭，温度上升
            baseTemp = 28 + Math.sin(i * Math.PI / 12) * 2 + Math.random() * 1 - 0.5;
          }
          currentTemp.push(Math.max(18, Math.min(32, baseTemp)).toFixed(1));
          
          // 模拟目标温度数据
          if (i >= 8 && i <= 18) {
            targetTemp.push(26); // 工作时间
          } else if (i >= 19 && i <= 22) {
            targetTemp.push(25); // 晚间时间
          } else {
            targetTemp.push(28); // 关闭时间设定温度
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
      
      showMaintenanceDialog() {
        this.maintenanceForm = {
          type: "filter_clean",
          remark: "",
        };
        this.maintenanceDialog.visible = true;
      },
      
      async performMaintenance() {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.maintenanceDialog.visible = false;
          this.$message.success("维护任务已提交");
        } catch (error) {
          this.$message.error("维护任务提交失败");
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
          link.setAttribute("download", `空调设备数据_${this.deviceInfo.deviceId}_${this.formatDate(new Date())}.csv`);
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
      
      getIndicatorClass(type) {
        switch(type) {
          case "communication":
            return this.deviceInfo.online ? "online" : "error";
          case "power":
            return this.deviceInfo.power ? "normal" : "warning";
          case "operation":
            return this.deviceInfo.status === "running" ? "normal" : "warning";
          default:
            return "normal";
        }
      },
      
      getOperationStatus() {
        if (!this.deviceInfo.online) return "离线";
        if (!this.deviceInfo.power) return "待机";
        return "正常运行";
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
  
      ::v-deep .el-table__body,
      ::v-deep .el-table__header {
        width: 100% !important;
      }
  
      ::v-deep .el-table__body-wrapper,
      ::v-deep .el-table__header-wrapper {
        width: 100% !important;
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
  
        ::v-deep .el-table__body,
        ::v-deep .el-table__header {
          width: 100% !important;
        }
  
        ::v-deep .el-table__body-wrapper,
        ::v-deep .el-table__header-wrapper {
          width: 100% !important;
        }
  
        ::v-deep .el-table__fixed {
          width: auto !important;
        }
  
        ::v-deep .el-table__fixed-right {
          right: 0 !important;
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