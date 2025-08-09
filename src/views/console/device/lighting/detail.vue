<template>
  <div class="lighting-dashboard">
    <!-- 页面加载动画 -->
    <div v-if="pageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="el-icon-loading"></i>
        </div>
        <div class="loading-text">正在加载设备详情...</div>
      </div>
    </div>

    <!-- 顶部操作栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <button class="back-button" @click="goBack">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
          </svg>
        </button>
        <div class="title-content">
          <h1 class="dashboard-title">{{ deviceInfo.name }}</h1>
          <div class="device-meta">{{ deviceInfo.location }} · {{ deviceInfo.id }}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="status-indicator" :class="{ 'online': deviceInfo.status }">
          <div class="status-dot"></div>
          <span class="status-text">{{ deviceInfo.status ? '在线' : '离线' }}</span>
        </div>
        <button class="control-btn primary" @click="toggleDevice">
          {{ deviceInfo.status ? '关闭设备' : '开启设备' }}
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">当前亮度</div>
          <div class="stat-value">{{ deviceInfo.brightness }}<span class="unit">%</span></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">色温</div>
          <div class="stat-value">{{ deviceInfo.colorTemp }}<span class="unit">K</span></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">功率</div>
          <div class="stat-value">{{ deviceInfo.currentPower }}<span class="unit">W</span></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">设备温度</div>
          <div class="stat-value" :class="{ 'warning': deviceInfo.temperature > 65 }">
            {{ deviceInfo.temperature }}<span class="unit">°C</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 图表区域 -->
      <div class="chart-section">
        <div class="chart-container">
          <!-- 图表头部 -->
          <div class="chart-header">
            <h2 class="chart-title">能耗监控</h2>
            <div class="chart-controls">
              <button 
                v-for="period in chartPeriods" 
                :key="period.value"
                :class="['chart-btn', { 'active': selectedPeriod === period.value }]"
                @click="selectedPeriod = period.value">
                {{ period.label }}
              </button>
            </div>
          </div>

          <!-- 图表主体 -->
          <div ref="energyChart" class="energy-chart"></div>

          <!-- 图表统计 -->
          <div class="chart-summary">
            <div class="summary-item">
              <span class="summary-label">今日用电</span>
              <span class="summary-value">0.87 kWh</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">月度预估</span>
              <span class="summary-value">26.1 kWh</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">能效比</span>
              <span class="summary-value">94.2%</span>
            </div>
          </div>
        </div>

        <!-- 设备健康监控 -->
        <div class="monitor-container">
          <div class="monitor-header">
            <h3 class="monitor-title">设备健康监控</h3>
            <div class="health-badge">
              <span class="health-status excellent">优秀</span>
            </div>
          </div>
          
          <!-- 健康度仪表盘 -->
          <div class="health-gauge-wrapper">
            <div class="health-gauge" ref="healthGauge"></div>
            <div class="gauge-description">
              <div class="health-score">85分</div>
              <div class="health-text">设备运行良好</div>
            </div>
          </div>
          
          <!-- 详细指标 -->
          <div class="health-stats">
            <div class="health-stat-item">
              <div class="stat-icon runtime">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-name">运行时长</span>
                <span class="stat-value">2,847 小时</span>
              </div>
            </div>
            
            <div class="health-stat-item">
              <div class="stat-icon startup">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M8 5v14l11-7z" fill="currentColor"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-name">启动次数</span>
                <span class="stat-value">1,423 次</span>
              </div>
            </div>
            
            <div class="health-stat-item">
              <div class="stat-icon error">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-name">故障次数</span>
                <span class="stat-value">0 次</span>
              </div>
            </div>
            
            <div class="health-stat-item">
              <div class="stat-icon maintenance">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 2l3.09 6.26L22 9l-5.91.74L12 22l-4.09-6.26L2 15l5.91-.74L12 2z" fill="currentColor"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-name">维护周期</span>
                <span class="stat-value">30 天后</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 控制面板 -->
      <div class="control-section">
        <div class="section-header">
          <h2 class="section-title">设备控制</h2>
        </div>

        <div class="control-panel">
          <div class="control-item">
            <div class="control-info">
              <span class="control-label">亮度调节</span>
              <span class="control-desc">当前 {{ deviceInfo.brightness }}%</span>
            </div>
            <div class="control-input">
              <input 
                type="range" 
                v-model="deviceInfo.brightness" 
                min="0" 
                max="100" 
                :disabled="!deviceInfo.status"
                @input="adjustBrightness"
                class="slider-input">
              <div class="slider-display">{{ deviceInfo.brightness }}%</div>
            </div>
          </div>

          <div class="control-item">
            <div class="control-info">
              <span class="control-label">色温调节</span>
              <span class="control-desc">当前 {{ deviceInfo.colorTemp }}K ({{ getColorTempStatus(deviceInfo.colorTemp) }})</span>
            </div>
            <div class="control-input">
              <input 
                type="range" 
                v-model="deviceInfo.colorTemp" 
                min="2700" 
                max="6500" 
                :disabled="!deviceInfo.status"
                @input="adjustColorTemp"
                class="slider-input">
              <div class="slider-display">{{ deviceInfo.colorTemp }}K</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 场景模式 -->
      <div class="scene-section">
        <div class="section-header">
          <h2 class="section-title">场景模式</h2>
        </div>

        <div class="scene-grid">
          <div 
            v-for="scene in sceneList" 
            :key="scene.id"
            :class="['scene-card', { 'active': activeScene === scene.id }]"
            @click="applyScene(scene)">
            <div class="scene-icon">
              <svg v-if="scene.id === 1" viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
              <svg v-else-if="scene.id === 2" viewBox="0 0 24 24" width="20" height="20">
                <path d="M9 11H7V9H9V11ZM13 11H11V9H13V11ZM17 11H15V9H17V11Z" fill="currentColor"/>
              </svg>
              <svg v-else-if="scene.id === 3" viewBox="0 0 24 24" width="20" height="20">
                <path d="M18.73 18C19.92 16.79 20.5 15.14 20.5 13.5C20.5 9.36 17.14 6" fill="currentColor"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="20" height="20">
                <path d="M17.75 4.09L15.22 6.03L16.13 9.09L13 7.28L9.87 9.09" fill="currentColor"/>
              </svg>
            </div>
            <div class="scene-content">
              <div class="scene-name">{{ scene.name }}</div>
              <div class="scene-params">{{ scene.brightness }}% · {{ scene.colorTemp }}K</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 定时任务 -->
      <div class="schedule-section">
        <div class="section-header">
          <h2 class="section-title">定时任务</h2>
          <button class="add-btn" @click="addSchedule">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
            </svg>
            添加任务
          </button>
        </div>

        <div class="schedule-table">
          <div class="table-header">
            <div class="table-cell">时间</div>
            <div class="table-cell">动作</div>
            <div class="table-cell">执行日期</div>
            <div class="table-cell">状态</div>
            <div class="table-cell">操作</div>
          </div>

          <div class="table-body">
            <div v-for="schedule in scheduleList" :key="schedule.id" class="table-row">
              <div class="table-cell">
                <span class="schedule-time">{{ schedule.time }}</span>
              </div>
              <div class="table-cell">
                <span class="schedule-action">{{ schedule.action }}</span>
              </div>
              <div class="table-cell">
                <div class="schedule-days">
                  <span v-for="day in schedule.activeDays.slice(0, 3)" :key="day" class="day-tag">{{ day.charAt(1) }}</span>
                  <span v-if="schedule.activeDays.length > 3" class="day-more">+{{ schedule.activeDays.length - 3 }}</span>
                </div>
              </div>
              <div class="table-cell">
                <span :class="['status-tag', schedule.enabled ? 'enabled' : 'disabled']">
                  {{ schedule.enabled ? '启用' : '禁用' }}
                </span>
              </div>
              <div class="table-cell">
                <button class="action-btn" @click="toggleSchedule(schedule)">
                  {{ schedule.enabled ? '禁用' : '启用' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 智能分析 -->
      <div class="analysis-section">
        <div class="section-header">
          <h2 class="section-title">智能分析</h2>
        </div>

        <div class="analysis-grid">
          <div class="analysis-card">
            <div class="analysis-header">
              <span class="analysis-type">优化建议</span>
              <span class="analysis-priority high">高优先级</span>
            </div>
            <div class="analysis-content">
              <div class="analysis-title">能耗优化建议</div>
              <div class="analysis-desc">检测到工作日8-18点为高频使用时段，建议设置自动调光策略可节省15%电能</div>
            </div>
          </div>

          <div class="analysis-card">
            <div class="analysis-header">
              <span class="analysis-type">维护提醒</span>
              <span class="analysis-priority normal">正常</span>
            </div>
            <div class="analysis-content">
              <div class="analysis-title">设备状态良好</div>
              <div class="analysis-desc">设备运行状态正常，建议30天后进行例行维护检查</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LightingDashboard',
  data() {
    return {
      pageLoading: true, // 🔥 新增：页面加载状态
      resizeTimer: null, // 🔥 新增：防抖定时器
      selectedPeriod: '24H',
      activeScene: 1,
      
      // 🔥 新增：路由参数存储
      routeParams: {
        deviceId: null,
        id: null,
        name: null
      },
      
      deviceInfo: {
        id: 'LED-A3-008',
        name: '办公大厅主照明-08',
        location: 'A栋3层办公大厅东区',
        type: 'LED面板灯 48W',
        status: true,
        brightness: 75,
        colorTemp: 4200,
        currentPower: 36.5,
        ratedPower: 48,
        temperature: 47.2
      },

      chartPeriods: [
        { label: '24H', value: '24H' },
        { label: '7D', value: '7D' },
        { label: '30D', value: '30D' }
      ],

      sceneList: [
        { id: 1, name: '工作模式', brightness: 90, colorTemp: 5000 },
        { id: 2, name: '会议模式', brightness: 100, colorTemp: 4500 },
        { id: 3, name: '休息模式', brightness: 40, colorTemp: 3000 },
        { id: 4, name: '夜间模式', brightness: 15, colorTemp: 2700 }
      ],

      scheduleList: [
        { id: 1, time: '08:00', action: '切换工作模式', activeDays: ['周一', '周二', '周三', '周四', '周五'], enabled: true },
        { id: 2, time: '12:00', action: '降低亮度至50%', activeDays: ['周一', '周二', '周三', '周四', '周五'], enabled: true },
        { id: 3, time: '18:30', action: '切换夜间模式', activeDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], enabled: true }
      ],

      peakHourUsage: 12.5,
      normalHourUsage: 8.3,
      valleyHourUsage: 5.2,

      energyChart: null,
      healthChart: null
    }
  },

  async mounted() {
    console.log('照明设备详情页组件已挂载')

    // 🔥 步骤1：提取路由参数
    this.extractRouteParams()

    // 🔥 步骤2：模拟加载数据
    await this.loadDeviceData()

    // 🔥 步骤3：加载echarts并初始化图表
    if (typeof echarts === 'undefined') {
      await this.loadEcharts()
    }
    this.initCharts()

    // 🔥 步骤4：启动实时更新和事件监听
    this.startRealtimeUpdate()
    this.$nextTick(() => {
      this.handleLayoutChange()
    })
  },

  beforeDestroy() {
    // 清理定时器和事件监听
    this.stopRealtimeUpdate()
    clearTimeout(this.resizeTimer)
    window.removeEventListener('resize', this.handleResize)
    
    if (this.energyChart) {
      this.energyChart.dispose()
    }
    if (this.healthChart) {
      this.healthChart.dispose()
    }
  },

  methods: {
    // 🔥 新增：提取路由参数
    extractRouteParams() {
      this.routeParams.deviceId = this.$route.params.id || this.$route.query.deviceId || null
      this.routeParams.id = this.$route.query.id || null
      this.routeParams.name = this.$route.query.name || null
      
      console.log('提取到的路由参数:', this.routeParams)
    },

    // 🔥 新增：加载设备数据
    async loadDeviceData() {
      this.pageLoading = true
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        if (this.routeParams.deviceId) {
          this.simulateDataByDeviceId(this.routeParams.deviceId)
        } else {
          this.loadDefaultData()
        }
      } catch (error) {
        this.$message.error('加载设备数据失败')
      } finally {
        this.pageLoading = false
      }
    },

    // 🔥 新增：根据设备ID模拟数据
    simulateDataByDeviceId(deviceId) {
      const deviceDataMap = {
        'LED-A3-008': {
          id: 'LED-A3-008',
          name: '办公大厅主照明-08',
          location: 'A栋3层办公大厅东区',
          type: 'LED面板灯 48W',
          status: true,
          brightness: 75,
          colorTemp: 4200,
          currentPower: 36.5,
          ratedPower: 48,
          temperature: 47.2
        },
        'LED-B2-015': {
          id: 'LED-B2-015',
          name: '会议室灯具-15',
          location: 'B栋2层会议室',
          type: 'LED筒灯 24W',
          status: false,
          brightness: 0,
          colorTemp: 4000,
          currentPower: 0,
          ratedPower: 24,
          temperature: 25.0
        },
        default: {
          id: this.routeParams.id || 'UNKNOWN',
          name: this.routeParams.name || '未知设备',
          location: '未知位置',
          type: 'LED灯具',
          status: true,
          brightness: 50,
          colorTemp: 4000,
          currentPower: 20,
          ratedPower: 40,
          temperature: 35.0
        }
      }

      const deviceData = deviceDataMap[deviceId] || deviceDataMap['default']
      Object.assign(this.deviceInfo, deviceData)
      console.log('加载的设备数据:', this.deviceInfo)
    },

    // 🔥 新增：加载默认数据
    loadDefaultData() {
      // 保持原有的默认数据
      console.log('使用默认设备数据')
    },

    // 🔥 新增：动态加载echarts
    loadEcharts() {
      return new Promise((resolve, reject) => {
        if (typeof echarts !== 'undefined') {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js'
        script.onload = () => {
          console.log('ECharts加载成功')
          resolve()
        }
        script.onerror = () => {
          console.error('ECharts加载失败')
          reject(new Error('ECharts loading failed'))
        }
        document.head.appendChild(script)
      })
    },

    // 🔥 新增：处理布局变化
    handleLayoutChange() {
      this.resizeTimer = setTimeout(() => {
        if (this.energyChart) {
          console.log('照明设备详情页：执行图表重绘')
          this.energyChart.resize()
        }
        if (this.healthChart) {
          this.healthChart.resize()
        }
      }, 350)
    },

    // 🔥 新增：防抖的resize处理
    handleResize() {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        if (this.energyChart) {
          this.energyChart.resize()
        }
        if (this.healthChart) {
          this.healthChart.resize()
        }
      }, 100)
    },

    initCharts() {
      this.$nextTick(() => {
        this.initEnergyChart()
        this.initHealthChart()
        // 🔥 新增：监听窗口大小变化
        window.addEventListener('resize', this.handleResize)
      })
    },

    initEnergyChart() {
      if (!this.$refs.energyChart || typeof echarts === 'undefined') return
      this.energyChart = echarts.init(this.$refs.energyChart)
      
      const option = {
        color: ['#3b82f6', '#10b981'],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e8e8e8',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: '#333',
            fontSize: 14
          }
        },
        legend: {
          data: ['功率', '能耗'],
          bottom: 20,
          textStyle: {
            color: '#666'
          }
        },
        grid: {
          top: 30,
          left: 50,
          right: 50,
          bottom: 60,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          axisLabel: { color: '#666' }
        },
        yAxis: [
          {
            type: 'value',
            name: '功率(W)',
            nameTextStyle: { color: '#666' },
            splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#666' }
          },
          {
            type: 'value',
            name: '能耗(kWh)',
            nameTextStyle: { color: '#666' },
            splitLine: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#666' }
          }
        ],
        series: [
          {
            name: '功率',
            type: 'line',
            data: [25, 28, 35, 42, 38, 30, 25],
            smooth: true,
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.3,
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                  { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                ]
              }
            }
          },
          {
            name: '能耗',
            type: 'line',
            yAxisIndex: 1,
            data: [0.6, 1.2, 2.1, 3.5, 2.8, 1.8, 0.8],
            smooth: true,
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.3,
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                  { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
                ]
              }
            }
          }
        ]
      }
      
      this.energyChart.setOption(option)
    },

    initHealthChart() {
      if (!this.$refs.healthGauge || typeof echarts === 'undefined') return
      this.healthChart = echarts.init(this.$refs.healthGauge)
      
      const healthScore = 85 // 设备健康分数
      
      const option = {
        series: [
          {
            name: '设备健康度',
            type: 'gauge',
            center: ['50%', '45%'],
            radius: '75%',
            min: 0,
            max: 100,
            splitNumber: 10,
            axisLine: {
              lineStyle: {
                width: 10,
                color: [
                  [0.3, '#ef4444'],   // 0-30% 红色
                  [0.7, '#f59e0b'],   // 30-70% 橙色
                  [1, '#10b981']      // 70-100% 绿色
                ]
              }
            },
            pointer: {
              itemStyle: {
                color: '#3b82f6',
                borderColor: '#3b82f6',
                borderWidth: 2
              },
              width: 5,
              length: '55%'
            },
            axisTick: {
              distance: -22,
              length: 6,
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.8)',
                width: 1
              }
            },
            splitLine: {
              distance: -22,
              length: 14,
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.9)',
                width: 2
              }
            },
            axisLabel: {
              color: '#6b7280',
              fontSize: 10,
              distance: -40,
              formatter: function (value) {
                if (value === 30) {
                  return '差'
                } else if (value === 70) {
                  return '良好'
                } else if (value === 100) {
                  return '优秀'
                }
                return ''
              }
            },
            detail: {
              fontSize: 26,
              fontWeight: 'bold',
              color: '#1f2937',
              offsetCenter: [0, '15%'],
              valueAnimation: true,
              formatter: function (value) {
                return value.toFixed(0) + '%'
              }
            },
            title: {
              fontSize: 13,
              color: '#6b7280',
              offsetCenter: [0, '45%']
            },
            data: [
              {
                value: healthScore,
                name: '健康度'
              }
            ]
          }
        ]
      }
      
      this.healthChart.setOption(option)
    },

    startRealtimeUpdate() {
      this.updateTimer = setInterval(() => {
        this.updateRealtimeData()
      }, 5000)
    },

    stopRealtimeUpdate() {
      if (this.updateTimer) {
        clearInterval(this.updateTimer)
      }
    },

    updateRealtimeData() {
      if (this.deviceInfo.status) {
        const basePower = (this.deviceInfo.brightness / 100) * this.deviceInfo.ratedPower
        this.deviceInfo.currentPower = Number((basePower + (Math.random() - 0.5) * 2).toFixed(1))
        
        const baseTemp = 35 + (this.deviceInfo.currentPower / this.deviceInfo.ratedPower) * 20
        this.deviceInfo.temperature = Number((baseTemp + (Math.random() - 0.5) * 3).toFixed(1))
      }
    },

    toggleDevice() {
      this.deviceInfo.status = !this.deviceInfo.status
      if (!this.deviceInfo.status) {
        this.deviceInfo.currentPower = 0
      }
    },

    adjustBrightness() {
      if (this.deviceInfo.status) {
        this.deviceInfo.currentPower = (this.deviceInfo.brightness / 100) * this.deviceInfo.ratedPower
      }
    },

    adjustColorTemp() {
      console.log(`色温调整为: ${this.deviceInfo.colorTemp}K`)
    },

    applyScene(scene) {
      if (!this.deviceInfo.status) return
      
      this.activeScene = scene.id
      this.deviceInfo.brightness = scene.brightness
      this.deviceInfo.colorTemp = scene.colorTemp
    },

    toggleSchedule(schedule) {
      schedule.enabled = !schedule.enabled
    },

    addSchedule() {
      console.log('添加定时任务')
    },

    getColorTempStatus(temp) {
      if (temp <= 3000) return '暖白光'
      if (temp <= 4500) return '自然光'
      return '冷白光'
    },

    formatNumber(num) {
      return Number(num).toFixed(1)
    },

    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style lang="scss" scoped>
.lighting-dashboard {
  min-height: 100vh;
  padding: 16px;
  background: #f8fafb;
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
      color: #3b82f6;
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

// 顶部操作栏
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }
}

.title-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dashboard-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.device-meta {
  font-size: 14px;
  color: #6b7280;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;

  &.online {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;

  .online & {
    background: #10b981;
  }
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.control-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  }
}

// 统计卡片
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;

  &.warning {
    color: #ef4444;
  }

  .unit {
    font-size: 16px;
    color: #6b7280;
    font-weight: 400;
  }
}

// 主内容区
.main-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

// 图表区域
.chart-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.chart-container {
  padding: 24px;
  border-right: 1px solid #f3f4f6;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.chart-controls {
  display: flex;
  gap: 4px;
  background: #f8fafb;
  padding: 4px;
  border-radius: 8px;
}

.chart-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    color: #374151;
  }

  &.active {
    background: white;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.energy-chart {
  height: 350px;
  width: 100%;
}

.chart-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
  margin-top: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

// 设备健康监控
.monitor-container {
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.monitor-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.health-badge {
  padding: 4px 0;
}

.health-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  
  &.excellent {
    background: #d1fae5;
    color: #065f46;
  }
  
  &.good {
    background: #fef3c7;
    color: #92400e;
  }
  
  &.poor {
    background: #fee2e2;
    color: #991b1b;
  }
}

.health-gauge-wrapper {
  position: relative;
  margin-bottom: 24px;
}

.health-gauge {
  height: 210px;
  width: 100%;
  background: #f8fafc;
  border-radius: 12px;
  position: relative;
  border: 1px solid #e2e8f0;
}

.gauge-description {
  position: absolute;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.health-score {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 4px;
}

.health-text {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.health-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.runtime {
    background: #ecfdf5;
    color: #10b981;
  }

  &.startup {
    background: #eff6ff;
    color: #3b82f6;
  }

  &.error {
    background: #fef2f2;
    color: #ef4444;
  }

  &.maintenance {
    background: #fefbeb;
    color: #f59e0b;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.stat-name {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

// 各个区块
.control-section,
.scene-section,
.schedule-section,
.analysis-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
  color: #1f2937;
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: #2563eb;
  }
}

// 控制面板
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.control-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: #f8fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.control-info {
  flex: 1;
}

.control-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.control-desc {
  font-size: 12px;
  color: #6b7280;
}

.control-input {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
}

.slider-input {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
  appearance: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.slider-display {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  min-width: 60px;
  text-align: right;
}

// 场景模式
.scene-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.scene-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }

  &.active {
    border-color: #3b82f6;
    background: #f0f7ff;
  }
}

.scene-icon {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;

  .scene-card.active & {
    background: #3b82f6;
    color: white;
  }
}

.scene-content {
  flex: 1;
}

.scene-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.scene-params {
  font-size: 12px;
  color: #6b7280;
}

// 定时任务表格
.schedule-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 100px 1fr 150px 80px 100px;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 100px 1fr 150px 80px 100px;
  border-top: 1px solid #f3f4f6;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }
}

.table-cell {
  padding: 16px 12px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.schedule-time {
  font-family: 'SF Mono', monospace;
  font-weight: 600;
  color: #1f2937;
}

.schedule-action {
  color: #374151;
}

.schedule-days {
  display: flex;
  gap: 4px;
  align-items: center;
}

.day-tag {
  width: 20px;
  height: 20px;
  background: #e5e7eb;
  color: #6b7280;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 500;
}

.day-more {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.enabled {
    background: #d1fae5;
    color: #065f46;
  }

  &.disabled {
    background: #fee2e2;
    color: #991b1b;
  }
}

.action-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
}

// 智能分析
.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.analysis-card {
  padding: 20px;
  background: #f8fafb;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;

  &:first-child {
    border-left-color: #ef4444;
  }

  &:last-child {
    border-left-color: #10b981;
  }
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.analysis-type {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.analysis-priority {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;

  &.high {
    background: #fee2e2;
    color: #991b1b;
  }

  &.normal {
    background: #d1fae5;
    color: #065f46;
  }
}

.analysis-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.analysis-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

// 响应式设计
@media (max-width: 1200px) {
  .chart-section {
    grid-template-columns: 1fr;
  }

  .chart-container {
    border-right: none;
    border-bottom: 1px solid #f3f4f6;
  }

  .analysis-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .lighting-dashboard {
    padding: 12px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .scene-grid {
    grid-template-columns: 1fr;
  }

  .control-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .control-input {
    width: 100%;
  }

  .table-header,
  .table-row {
    grid-template-columns: 80px 1fr 120px 60px 80px;
    font-size: 12px;
  }

  .table-cell {
    padding: 12px 8px;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .chart-summary {
    flex-direction: column;
    gap: 12px;
  }

  .summary-item {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>