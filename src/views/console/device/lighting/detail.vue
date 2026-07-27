<template>
  <div class="lighting-dashboard">
    <!-- 🔥 页面顶部锚点 -->
    <div ref="pageTop" class="page-top-anchor"></div>

    <!-- 页面加载动画 -->
    <div v-if="pageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="el-icon-loading"></i>
        </div>
        <div class="loading-text">正在加载{{ areaInfo.name }}详情...</div>
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
          <h1 class="dashboard-title">{{ areaInfo.name }}</h1>
          <div class="device-meta">{{ areaInfo.floor }} · {{ areaInfo.total }}台设备 · 区域ID: {{ areaInfo.id }}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="status-indicator" :class="{ 'online': areaInfo.online > 0 }">
          <div class="status-dot"></div>
          <span class="status-text">{{ areaInfo.online }}/{{ areaInfo.total }} 在线</span>
        </div>
        <button class="control-btn primary" @click="toggleAreaLights">
          {{ areaInfo.enabled ? '关闭区域' : '开启区域' }}
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">当前亮度</div>
          <div class="stat-value">{{ areaInfo.brightness }}<span class="unit">%</span></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">设备开启</div>
          <div class="stat-value">{{ areaInfo.lightsOn }}<span class="unit">/{{ areaInfo.total }}</span></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">区域功率</div>
          <div class="stat-value">{{ currentAreaPower }}<span class="unit">kW</span></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-label">平均温度</div>
          <div class="stat-value" :class="{ 'warning': avgTemperature > 65 }">
            {{ avgTemperature }}<span class="unit">°C</span>
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
            <h2 class="chart-title">{{ areaInfo.name }} - 能耗监控</h2>
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
              <span class="summary-value">{{ todayUsage }} kWh</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">月度预估</span>
              <span class="summary-value">{{ monthlyEstimate }} kWh</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">能效比</span>
              <span class="summary-value">{{ energyEfficiency }}%</span>
            </div>
          </div>
        </div>

        <!-- 设备健康监控 -->
        <div class="monitor-container">
          <div class="monitor-header">
            <h3 class="monitor-title">区域健康监控</h3>
            <div class="health-badge">
              <span class="health-status" :class="healthLevel">{{ healthStatusText }}</span>
            </div>
          </div>

          <!-- 健康度仪表盘 -->
          <div class="health-gauge-wrapper">
            <div class="health-gauge" ref="healthGauge"></div>
            <div class="gauge-description">
              <div class="health-score">{{ healthScore }}分</div>
              <div class="health-text">{{ healthDescription }}</div>
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
                <span class="stat-name">平均运行</span>
                <span class="stat-value">{{ avgRuntime }} 小时</span>
              </div>
            </div>

            <div class="health-stat-item">
              <div class="stat-icon startup">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M8 5v14l11-7z" fill="currentColor"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-name">设备在线</span>
                <span class="stat-value">{{ areaInfo.online }}/{{ areaInfo.total }} 台</span>
              </div>
            </div>

            <div class="health-stat-item">
              <div class="stat-icon error">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-name">故障设备</span>
                <span class="stat-value">{{ faultDevices }} 台</span>
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
                <span class="stat-value">{{ maintenanceDays }} 天后</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 控制面板 -->
      <div class="control-section">
        <div class="section-header">
          <h2 class="section-title">区域控制</h2>
        </div>

        <div class="control-panel">
          <div class="control-item">
            <div class="control-info">
              <span class="control-label">区域亮度调节</span>
              <span class="control-desc">当前 {{ areaInfo.brightness }}% - 影响{{ areaInfo.lightsOn }}台设备</span>
            </div>
            <div class="control-input">
              <input
                type="range"
                v-model="areaInfo.brightness"
                min="0"
                max="100"
                :disabled="!areaInfo.enabled"
                @input="adjustAreaBrightness"
                class="slider-input">
              <div class="slider-display">{{ areaInfo.brightness }}%</div>
            </div>
          </div>

          <div class="control-item">
            <div class="control-info">
              <span class="control-label">色温调节</span>
              <span class="control-desc">当前 {{ currentColorTemp }}K ({{ getColorTempStatus(currentColorTemp) }})</span>
            </div>
            <div class="control-input">
              <input
                type="range"
                v-model="currentColorTemp"
                min="2700"
                max="6500"
                :disabled="!areaInfo.enabled"
                @input="adjustColorTemp"
                class="slider-input">
              <div class="slider-display">{{ currentColorTemp }}K</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 场景模式 -->
      <div class="scene-section">
        <div class="section-header">
          <h2 class="section-title">{{ areaInfo.name }} 场景模式</h2>
        </div>

        <div class="scene-grid">
          <div
            v-for="scene in filteredScenes"
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

      <!-- 设备列表 -->
      <div class="device-list-section">
        <div class="section-header">
          <h2 class="section-title">{{ areaInfo.name }} 设备列表</h2>
          <span class="device-count">共 {{ areaDevices.length }} 台设备</span>
        </div>

        <div class="device-table">
          <div class="table-header">
            <div class="table-cell">设备编号</div>
            <div class="table-cell">设备名称</div>
            <div class="table-cell">设备类型</div>
            <div class="table-cell">状态</div>
            <div class="table-cell">亮度</div>
            <div class="table-cell">功率</div>
            <div class="table-cell">操作</div>
          </div>

          <div class="table-body">
            <div v-for="device in areaDevices" :key="device.id" class="table-row">
              <div class="table-cell">
                <span class="device-id">{{ device.id }}</span>
              </div>
              <div class="table-cell">
                <span class="device-name">{{ device.name }}</span>
              </div>
              <div class="table-cell">
                <span class="device-type">{{ device.type }}</span>
              </div>
              <div class="table-cell">
                <span :class="['status-tag', device.status ? 'online' : 'offline']">
                  {{ device.status ? '开启' : '关闭' }}
                </span>
              </div>
              <div class="table-cell">
                <span class="brightness-value">{{ device.brightness }}%</span>
              </div>
              <div class="table-cell">
                <span class="power-value">{{ device.currentPower }}W</span>
              </div>
              <div class="table-cell">
                <button class="action-btn" @click="toggleSingleDevice(device)">
                  {{ device.status ? '关闭' : '开启' }}
                </button>
                <button class="action-btn secondary" @click="viewDeviceDetail(device)">详情</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 智能分析 -->
      <div class="analysis-section">
        <div class="section-header">
          <h2 class="section-title">{{ areaInfo.name }} 智能分析</h2>
        </div>

        <div class="analysis-grid">
          <div class="analysis-card">
            <div class="analysis-header">
              <span class="analysis-type">能耗优化</span>
              <span class="analysis-priority" :class="optimizationLevel">{{ optimizationText }}</span>
            </div>
            <div class="analysis-content">
              <div class="analysis-title">{{ optimizationSuggestion.title }}</div>
              <div class="analysis-desc">{{ optimizationSuggestion.description }}</div>
            </div>
          </div>

          <div class="analysis-card">
            <div class="analysis-header">
              <span class="analysis-type">设备状态</span>
              <span class="analysis-priority normal">正常</span>
            </div>
            <div class="analysis-content">
              <div class="analysis-title">区域运行良好</div>
              <div class="analysis-desc">{{ areaInfo.name }}共{{ areaInfo.total }}台设备，{{ areaInfo.online }}台在线，运行状态{{ healthDescription }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LightingAreaDetail',
  data () {
    return {
      pageLoading: true,
      selectedPeriod: '24H',
      activeScene: null,
      currentColorTemp: 4200,

      // 区域信息 - 从路由参数动态生成
      areaInfo: {
        id: null,
        name: '',
        floor: '',
        total: 0,
        online: 0,
        lightsOn: 0,
        brightness: 0,
        enabled: false
      },

      chartPeriods: [
        { label: '24H', value: '24H' },
        { label: '7D', value: '7D' },
        { label: '30D', value: '30D' }
      ],

      // 场景列表 - 根据区域类型动态过滤
      allScenes: [
        { id: 1, name: '工作模式', brightness: 90, colorTemp: 5000, areas: ['办公', '前台', '会议'] },
        { id: 2, name: '会议模式', brightness: 100, colorTemp: 4500, areas: ['会议', '办公'] },
        { id: 3, name: '休息模式', brightness: 40, colorTemp: 3000, areas: ['休息', '接待'] },
        { id: 4, name: '夜间模式', brightness: 15, colorTemp: 2700, areas: ['走廊', '洗手间', '储物'] },
        { id: 5, name: '清洁模式', brightness: 100, colorTemp: 6000, areas: ['洗手间', '储物'] },
        { id: 6, name: '通道模式', brightness: 60, colorTemp: 4000, areas: ['走廊'] }
      ],

      // 区域设备列表 - 动态生成
      areaDevices: [],

      energyChart: null,
      healthChart: null,
      updateTimer: null
    }
  },

  computed: {
    // 根据区域类型过滤适用场景
    filteredScenes () {
      const areaType = this.getAreaType(this.areaInfo.name)
      return this.allScenes.filter(scene =>
        scene.areas.some(area => areaType.includes(area))
      )
    },

    // 当前区域功率
    currentAreaPower () {
      const totalPower = this.areaDevices.reduce((sum, device) => {
        return sum + (device.status ? device.currentPower : 0)
      }, 0)
      return (totalPower / 1000).toFixed(1)
    },

    // 平均温度
    avgTemperature () {
      if (this.areaDevices.length === 0) return 25
      const totalTemp = this.areaDevices.reduce((sum, device) => sum + device.temperature, 0)
      return (totalTemp / this.areaDevices.length).toFixed(1)
    },

    // 今日用电量
    todayUsage () {
      const baseUsage = this.areaInfo.total * 0.5 // 基础用电量
      const actualUsage = baseUsage * (this.areaInfo.lightsOn / this.areaInfo.total)
      return actualUsage.toFixed(1)
    },

    // 月度预估
    monthlyEstimate () {
      return (this.todayUsage * 30 * 1.2).toFixed(0)
    },

    // 能效比
    energyEfficiency () {
      const efficiency = 85 + Math.random() * 10
      return efficiency.toFixed(1)
    },

    // 健康分数
    healthScore () {
      const onlineRate = this.areaInfo.online / this.areaInfo.total
      const baseScore = onlineRate * 80 + Math.random() * 15
      return Math.min(100, Math.max(0, baseScore)).toFixed(0)
    },

    // 健康等级
    healthLevel () {
      const score = parseInt(this.healthScore)
      if (score >= 85) return 'excellent'
      if (score >= 70) return 'good'
      return 'poor'
    },

    // 健康状态文本
    healthStatusText () {
      const score = parseInt(this.healthScore)
      if (score >= 85) return '优秀'
      if (score >= 70) return '良好'
      return '需改善'
    },

    // 健康描述
    healthDescription () {
      const score = parseInt(this.healthScore)
      if (score >= 85) return '运行状态优秀'
      if (score >= 70) return '运行状态良好'
      return '需要关注'
    },

    // 平均运行时长
    avgRuntime () {
      return Math.floor(Math.random() * 1000 + 2000)
    },

    // 故障设备数
    faultDevices () {
      return this.areaInfo.total - this.areaInfo.online
    },

    // 维护天数
    maintenanceDays () {
      return Math.floor(Math.random() * 60 + 15)
    },

    // 优化建议等级
    optimizationLevel () {
      const efficiency = parseFloat(this.energyEfficiency)
      if (efficiency >= 90) return 'normal'
      if (efficiency >= 80) return 'medium'
      return 'high'
    },

    // 优化建议文本
    optimizationText () {
      const efficiency = parseFloat(this.energyEfficiency)
      if (efficiency >= 90) return '正常'
      if (efficiency >= 80) return '中等'
      return '高优先级'
    },

    // 优化建议内容
    optimizationSuggestion () {
      const areaType = this.getAreaType(this.areaInfo.name)
      const suggestions = {
        办公: {
          title: '工作时段优化建议',
          description: `检测到${this.areaInfo.name}在工作时段使用频率较高，建议设置自动调光策略可节省15%电能`
        },
        会议: {
          title: '会议室智能控制',
          description: `建议为${this.areaInfo.name}配置人体感应和会议日程联动，预计可节能25%`
        },
        走廊: {
          title: '通道感应优化',
          description: `${this.areaInfo.name}适合安装人体感应器，实现按需照明，预计节能40%`
        },
        洗手间: {
          title: '卫生间智能控制',
          description: `建议${this.areaInfo.name}安装感应开关和定时关闭功能，可有效节约用电`
        },
        休息: {
          title: '休息区照明优化',
          description: `${this.areaInfo.name}可采用暖色调低亮度设置，营造舒适环境的同时降低能耗`
        },
        储物: {
          title: '储物区域控制',
          description: `${this.areaInfo.name}建议设置感应照明，平时保持关闭状态，仅在有人时开启`
        },
        default: {
          title: '区域能耗优化',
          description: `根据${this.areaInfo.name}的使用模式，建议优化照明控制策略以提升能效`
        }
      }

      for (const key in suggestions) {
        if (areaType.includes(key)) {
          return suggestions[key]
        }
      }
      return suggestions.default
    }
  },

  async mounted () {
    console.log('照明区域详情页组件已挂载')

    // 🔥 立即滚动到页面顶部
    this.scrollToPageTop()

    await this.loadAreaData()

    if (typeof echarts === 'undefined') {
      await this.loadEcharts()
    }
    this.initCharts()
    this.startRealtimeUpdate()
  },

  // 🔥 处理keep-alive缓存的情况
  activated () {
    this.scrollToPageTop()
  },

  // 🔥 监听路由变化
  watch: {
    '$route' () {
      this.scrollToPageTop()
    }
  },

  beforeDestroy () {
    this.stopRealtimeUpdate()
    if (this.energyChart) {
      this.energyChart.dispose()
    }
    if (this.healthChart) {
      this.healthChart.dispose()
    }
  },

  methods: {
    // 加载区域数据
    async loadAreaData () {
      this.pageLoading = true

      try {
        await new Promise(resolve => setTimeout(resolve, 1500))

        // 从路由参数获取区域信息
        const areaId = this.$route.params.id || this.$route.query.deviceId
        const areaName = this.$route.query.name || this.getAreaNameById(areaId)

        // 根据区域ID和名称生成对应数据
        this.generateAreaData(areaId, areaName)
        this.generateAreaDevices()
      } catch (error) {
        this.$message.error('加载区域数据失败')
      } finally {
        this.pageLoading = false
        // 🔥 加载完成后确保页面在顶部
        this.$nextTick(() => {
          this.scrollToPageTop()
        })
      }
    },

    // 根据区域ID获取区域名称
    getAreaNameById (areaId) {
      const areaMap = {
        1: '办公大厅',
        2: '会议室A',
        3: '会议室B',
        4: '走廊过道',
        5: '休息区',
        6: '洗手间',
        7: '储物间',
        8: '前台接待'
      }
      return areaMap[areaId] || '未知区域'
    },

    // 生成区域数据
    generateAreaData (areaId, areaName) {
      // 根据区域类型设置不同的基础参数
      const areaConfigs = {
        办公大厅: { total: 48, onlineRate: 0.94, lightsOnRate: 0.88, brightness: 85, floor: 'A栋3层' },
        会议室A: { total: 24, onlineRate: 1.0, lightsOnRate: 0.0, brightness: 0, floor: 'B栋2层' },
        会议室B: { total: 24, onlineRate: 0.96, lightsOnRate: 0.75, brightness: 70, floor: 'B栋2层' },
        走廊过道: { total: 36, onlineRate: 1.0, lightsOnRate: 1.0, brightness: 60, floor: '各楼层' },
        休息区: { total: 18, onlineRate: 1.0, lightsOnRate: 0.67, brightness: 40, floor: 'A栋1层' },
        洗手间: { total: 12, onlineRate: 1.0, lightsOnRate: 0.67, brightness: 100, floor: '各楼层' },
        储物间: { total: 8, onlineRate: 1.0, lightsOnRate: 0.0, brightness: 0, floor: 'B栋1层' },
        前台接待: { total: 16, onlineRate: 1.0, lightsOnRate: 0.5, brightness: 90, floor: 'A栋1层' }
      }

      const config = areaConfigs[areaName] || { total: 20, onlineRate: 0.9, lightsOnRate: 0.6, brightness: 60, floor: '未知楼层' }

      this.areaInfo = {
        id: areaId,
        name: areaName,
        floor: config.floor,
        total: config.total,
        online: Math.floor(config.total * config.onlineRate),
        lightsOn: Math.floor(config.total * config.lightsOnRate),
        brightness: config.brightness,
        enabled: config.brightness > 0
      }

      // 根据区域设置色温
      this.currentColorTemp = this.getDefaultColorTemp(areaName)
    },

    // 生成区域设备列表
    generateAreaDevices () {
      const devices = []
      const deviceTypes = this.getDeviceTypes(this.areaInfo.name)

      for (let i = 1; i <= this.areaInfo.total; i++) {
        const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)]
        const isOnline = i <= this.areaInfo.online
        const isOn = i <= this.areaInfo.lightsOn

        devices.push({
          id: `${this.areaInfo.name.charAt(0)}${String(i).padStart(3, '0')}`,
          name: `${this.areaInfo.name}${deviceType.name}-${String(i).padStart(2, '0')}`,
          type: deviceType.name,
          status: isOnline && isOn,
          brightness: isOnline && isOn ? this.areaInfo.brightness : 0,
          ratedPower: deviceType.power,
          currentPower: isOnline && isOn ? Math.floor(deviceType.power * (this.areaInfo.brightness / 100)) : 0,
          temperature: isOnline ? (25 + Math.random() * 20 + (isOn ? 10 : 0)) : 25,
          online: isOnline
        })
      }

      this.areaDevices = devices
    },

    // 获取区域类型
    getAreaType (areaName) {
      const typeMap = {
        办公大厅: ['办公'],
        会议室A: ['会议'],
        会议室B: ['会议'],
        走廊过道: ['走廊'],
        休息区: ['休息'],
        洗手间: ['洗手间'],
        储物间: ['储物'],
        前台接待: ['前台', '接待']
      }
      return typeMap[areaName] || ['通用']
    },

    // 获取设备类型
    getDeviceTypes (areaName) {
      const deviceMap = {
        办公大厅: [
          { name: 'LED面板灯', power: 48 },
          { name: 'LED筒灯', power: 24 },
          { name: '装饰射灯', power: 18 }
        ],
        会议室A: [
          { name: 'LED筒灯', power: 24 },
          { name: '会议灯', power: 36 }
        ],
        会议室B: [
          { name: 'LED筒灯', power: 24 },
          { name: '会议灯', power: 36 }
        ],
        走廊过道: [
          { name: 'LED灯带', power: 18 },
          { name: '导光灯', power: 12 }
        ],
        休息区: [
          { name: '暖光射灯', power: 15 },
          { name: '氛围灯', power: 8 }
        ],
        洗手间: [
          { name: '防水LED灯', power: 20 },
          { name: '镜前灯', power: 15 }
        ],
        储物间: [
          { name: '工业LED灯', power: 30 },
          { name: '感应灯', power: 18 }
        ],
        前台接待: [
          { name: '装饰吊灯', power: 60 },
          { name: 'LED筒灯', power: 24 },
          { name: '背景灯', power: 12 }
        ]
      }
      return deviceMap[areaName] || [{ name: 'LED灯', power: 24 }]
    },

    // 获取默认色温
    getDefaultColorTemp (areaName) {
      const colorTempMap = {
        办公大厅: 5000,
        会议室A: 4500,
        会议室B: 4500,
        走廊过道: 4000,
        休息区: 3000,
        洗手间: 4200,
        储物间: 4000,
        前台接待: 4500
      }
      return colorTempMap[areaName] || 4200
    },

    // 动态加载echarts
    loadEcharts () {
      return new Promise((resolve, reject) => {
        if (typeof echarts !== 'undefined') {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('ECharts loading failed'))
        document.head.appendChild(script)
      })
    },

    initCharts () {
      this.$nextTick(() => {
        this.initEnergyChart()
        this.initHealthChart()
      })
    },

    initEnergyChart () {
      if (!this.$refs.energyChart || typeof echarts === 'undefined') return
      this.energyChart = echarts.init(this.$refs.energyChart)

      // 根据区域生成不同的能耗数据
      const timeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      const powerData = this.generatePowerData()
      const energyData = this.generateEnergyData(powerData)

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
          data: timeLabels,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          axisLabel: { color: '#666' }
        },
        yAxis: [
          {
            type: 'value',
            name: '功率(kW)',
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
            data: powerData,
            smooth: true,
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.3,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
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
            data: energyData,
            smooth: true,
            lineStyle: { width: 2 },
            areaStyle: {
              opacity: 0.3,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
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

    // 生成功率数据
    generatePowerData () {
      const areaType = this.getAreaType(this.areaInfo.name)[0]
      const basePower = parseFloat(this.currentAreaPower)

      // 不同区域的用电模式
      const patterns = {
        办公: [0.2, 0.1, 0.8, 1.0, 0.9, 0.6, 0.3],
        会议: [0.0, 0.0, 0.3, 0.8, 0.9, 0.2, 0.0],
        走廊: [0.3, 0.2, 0.6, 0.8, 0.8, 0.9, 0.5],
        洗手间: [0.2, 0.1, 0.7, 0.9, 0.8, 0.6, 0.3],
        休息: [0.1, 0.0, 0.4, 0.8, 0.9, 0.7, 0.2],
        储物: [0.0, 0.0, 0.2, 0.1, 0.1, 0.0, 0.0],
        前台: [0.1, 0.0, 0.9, 1.0, 0.9, 0.3, 0.1]
      }

      const pattern = patterns[areaType] || patterns['办公']
      return pattern.map(ratio => (basePower * ratio * (1 + Math.random() * 0.2)).toFixed(1))
    },

    // 生成能耗数据
    generateEnergyData (powerData) {
      return powerData.map((power, index) => {
        const hours = index === 0 ? 4 : 4 // 每个时段4小时
        return (parseFloat(power) * hours).toFixed(1)
      })
    },

    initHealthChart () {
      if (!this.$refs.healthGauge || typeof echarts === 'undefined') return
      this.healthChart = echarts.init(this.$refs.healthGauge)

      const healthScore = parseInt(this.healthScore)

      const option = {
        series: [
          {
            name: '区域健康度',
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
                  [0.3, '#ef4444'],
                  [0.7, '#f59e0b'],
                  [1, '#10b981']
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
                if (value === 30) return '差'
                if (value === 70) return '良好'
                if (value === 100) return '优秀'
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

    startRealtimeUpdate () {
      this.updateTimer = setInterval(() => {
        this.updateRealtimeData()
      }, 5000)
    },

    stopRealtimeUpdate () {
      if (this.updateTimer) {
        clearInterval(this.updateTimer)
      }
    },

    updateRealtimeData () {
      // 更新设备实时数据
      this.areaDevices.forEach(device => {
        if (device.online && device.status) {
          const basePower = (device.brightness / 100) * device.ratedPower
          device.currentPower = Math.floor(basePower + (Math.random() - 0.5) * 4)

          const baseTemp = 25 + (device.currentPower / device.ratedPower) * 20
          device.temperature = Number((baseTemp + (Math.random() - 0.5) * 3).toFixed(1))
        }
      })
    },

    toggleAreaLights () {
      this.areaInfo.enabled = !this.areaInfo.enabled

      if (this.areaInfo.enabled) {
        this.areaInfo.lightsOn = this.areaInfo.online
        this.areaInfo.brightness = this.areaInfo.brightness || 80
        this.$message.success(`已开启${this.areaInfo.name}所有照明`)
      } else {
        this.areaInfo.lightsOn = 0
        this.areaInfo.brightness = 0
        this.$message.info(`已关闭${this.areaInfo.name}所有照明`)
      }

      // 同步更新设备状态
      this.areaDevices.forEach(device => {
        if (device.online) {
          device.status = this.areaInfo.enabled
          device.brightness = this.areaInfo.brightness
          device.currentPower = device.status ? Math.floor(device.ratedPower * (device.brightness / 100)) : 0
        }
      })
    },

    adjustAreaBrightness () {
      if (this.areaInfo.enabled) {
        // 同步所有设备亮度
        this.areaDevices.forEach(device => {
          if (device.online && device.status) {
            device.brightness = this.areaInfo.brightness
            device.currentPower = Math.floor(device.ratedPower * (device.brightness / 100))
          }
        })
      }
    },

    adjustColorTemp () {
      console.log(`${this.areaInfo.name}色温调整为: ${this.currentColorTemp}K`)
    },

    applyScene (scene) {
      if (!this.areaInfo.enabled) {
        this.$message.warning('请先开启区域照明')
        return
      }

      this.activeScene = scene.id
      this.areaInfo.brightness = scene.brightness
      this.currentColorTemp = scene.colorTemp

      // 同步所有设备
      this.adjustAreaBrightness()

      this.$message.success(`已应用${scene.name}场景`)
    },

    toggleSingleDevice (device) {
      if (!device.online) {
        this.$message.warning('设备离线，无法操作')
        return
      }

      device.status = !device.status
      if (device.status) {
        device.brightness = this.areaInfo.brightness
        device.currentPower = Math.floor(device.ratedPower * (device.brightness / 100))
      } else {
        device.brightness = 0
        device.currentPower = 0
      }

      // 更新区域统计
      this.areaInfo.lightsOn = this.areaDevices.filter(d => d.status).length

      this.$message.success(`${device.name} 已${device.status ? '开启' : '关闭'}`)
    },

    viewDeviceDetail (device) {
      // 跳转到单个设备详情页
      this.$router.push({
        path: `/device/lighting/device/${device.id}`,
        query: {
          name: device.name,
          area: this.areaInfo.name,
          type: device.type
        }
      })
    },

    getColorTempStatus (temp) {
      if (temp <= 3000) return '暖白光'
      if (temp <= 4500) return '自然光'
      return '冷白光'
    },

    // 🔥 滚动到页面顶部 - 使用锚点定位
    scrollToPageTop () {
      // 方法1：使用ref定位到顶部锚点
      if (this.$refs.pageTop) {
        this.$refs.pageTop.scrollIntoView({
          behavior: 'instant',
          block: 'start'
        })
      }

      // 方法2：兜底方案
      setTimeout(() => {
        if (this.$refs.pageTop) {
          this.$refs.pageTop.scrollIntoView({
            behavior: 'instant',
            block: 'start'
          })
        }
        // 额外确保
        window.scrollTo(0, 0)
      }, 100)
    },

    goBack () {
      this.$router.go(-1)
    }
  }
}
</script>

<style lang="scss" scoped>
// 保持原有样式，新增以下内容

.device-list-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 24px;
  margin-bottom: 24px;
}

.device-count {
  font-size: 14px;
  color: #909399;
}

.device-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 100px 1fr 100px 80px 80px 80px 140px;
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
  grid-template-columns: 100px 1fr 100px 80px 80px 80px 140px;
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

.device-id {
  font-family: 'SF Mono', monospace;
  font-weight: 600;
  color: #1f2937;
}

.device-name {
  color: #374151;
  font-weight: 500;
}

.device-type {
  color: #606266;
  font-size: 13px;
}

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.online {
    background: #d1fae5;
    color: #065f46;
  }

  &.offline {
    background: #fee2e2;
    color: #991b1b;
  }
}

.brightness-value, .power-value {
  font-weight: 500;
  color: #374151;
}

.action-btn {
  padding: 4px 8px;
  margin-right: 8px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }

  &.secondary {
    background: #ecf5ff;
    color: #409eff;

    &:hover {
      background: #d9ecff;
    }
  }
}

// 其他保持原有样式...
.lighting-dashboard {
  min-height: 100vh;
  padding: 16px;
  background: #f8fafb;
}

/* 🔥 页面顶部锚点 - 不可见但可定位 */
.page-top-anchor {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

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

.main-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

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

.control-section,
.scene-section,
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

  &.medium {
    background: #fef3c7;
    color: #92400e;
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
    grid-template-columns: 80px 1fr 80px 60px 60px 60px 100px;
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
