<template>
  <div class="charging-detail-container">
    <!-- 🔥 新增：页面加载动画 -->
    <div v-if="pageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="el-icon-loading"></i>
        </div>
        <div class="loading-text">正在加载充电桩详情...</div>
      </div>
    </div>

    <!-- 页面主体内容 -->
    <div v-show="!pageLoading" class="page-main-content">
      <!-- 顶部核心指标区 -->
      <div class="top-metrics-section">
        <div class="device-status-card">
          <div class="status-main">
            <div class="device-name">
              <el-button
                @click="goBack"
                type="text"
                size="mini"
                style="margin-left: -20px"
              >
                <i class="el-icon-arrow-left"></i> 返回
              </el-button>{{ deviceInfo.name }}
            </div>
            <div class="device-id">{{ deviceInfo.deviceId }}</div>
          </div>
          <div class="status-indicator" :class="deviceInfo.online ? 'online' : 'offline'">
            <span class="status-dot"></span>
            <span class="status-text">{{ deviceInfo.online ? '在线' : '离线' }}</span>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">实时功率</div>
            <div class="metric-value">
              <span class="number">{{ realtimeData.power }}</span>
              <span class="unit">kW</span>
            </div>
            <div class="metric-sub">额定 {{ deviceInfo.ratedPower }}kW</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">当前电流</div>
            <div class="metric-value">
              <span class="number">{{ realtimeData.current }}</span>
              <span class="unit">A</span>
            </div>
            <div class="metric-sub">电压 {{ realtimeData.voltage }}V</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">今日充电量</div>
            <div class="metric-value">
              <span class="number">{{ todayData.totalEnergy }}</span>
              <span class="unit">kWh</span>
            </div>
            <div class="metric-sub">{{ todayData.sessions }} 次充电</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">今日收入</div>
            <div class="metric-value">
              <span class="number">{{ todayData.revenue }}</span>
              <span class="unit">元</span>
            </div>
            <div class="metric-sub">平均 {{ todayData.avgPrice }} 元/kWh</div>
          </div>
        </div>
      </div>

      <!-- 主要内容区 -->
      <div class="main-content">
        <div class="left-panel">
          <!-- 充电控制面板 -->
          <div class="control-panel">
            <div class="panel-header">
              <h3>充电控制</h3>
              <div class="header-actions">
                <el-button
                  v-if="chargingStatus.isCharging"
                  type="danger"
                  size="small"
                  plain
                  @click="stopCharging"
                >
                  停止充电
                </el-button>
                <el-button
                  v-else
                  type="primary"
                  size="small"
                  @click="startCharging"
                  :disabled="!deviceInfo.online"
                >
                  启动充电
                </el-button>
              </div>
            </div>

            <div class="control-body" v-if="chargingStatus.isCharging">
              <div class="session-info">
                <div class="session-row">
                  <span class="session-label">用户姓名</span>
                  <span class="session-value">{{ currentSession.userName }}</span>
                </div>
                <div class="session-row">
                  <span class="session-label">车牌号码</span>
                  <span class="session-value">{{ currentSession.plateNumber }}</span>
                </div>
                <div class="session-row">
                  <span class="session-label">开始时间</span>
                  <span class="session-value">{{ currentSession.startTime }}</span>
                </div>
                <!-- <div class="session-row">
                  <span class="session-label">已充时长</span>
                  <span class="session-value highlight">{{ currentSession.duration }} 分钟</span>
                </div> -->
                <div class="session-row">
                  <span class="session-label">已充电量</span>
                  <span class="session-value highlight">{{ currentSession.chargedEnergy }} kWh</span>
                </div>
                <div class="session-row">
                  <span class="session-label">当前费用</span>
                  <span class="session-value highlight">¥ {{ currentSession.currentCost }}</span>
                </div>
              </div>

              <div class="charge-progress-section">
                <div class="progress-header">
                  <span>电池电量</span>
                  <span class="progress-percent">{{ currentSession.batterySOC }}%</span>
                </div>
                <el-progress
                  :percentage="currentSession.batterySOC"
                  :stroke-width="8"
                  :show-text="false"
                  :color="getSOCColor(currentSession.batterySOC)"
                ></el-progress>
                <div class="progress-detail">
                  预计剩余 {{ currentSession.estimatedTime }} 分钟充满
                </div>
              </div>
            </div>

            <div class="control-empty" v-else>
              <p>设备空闲</p>
              <span>等待用户连接充电</span>
            </div>
          </div>

          <!-- 实时参数监控 -->
          <div class="monitor-panel">
            <div class="panel-header">
              <h3>实时参数</h3>
              <span class="update-time">{{ lastUpdateTime }}</span>
            </div>

            <div class="monitor-grid">
              <div class="monitor-item">
                <div class="monitor-label">A相电压</div>
                <div class="monitor-value">{{ realtimeData.voltageA }} V</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">B相电压</div>
                <div class="monitor-value">{{ realtimeData.voltageB }} V</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">C相电压</div>
                <div class="monitor-value">{{ realtimeData.voltageC }} V</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">A相电流</div>
                <div class="monitor-value">{{ realtimeData.currentA }} A</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">B相电流</div>
                <div class="monitor-value">{{ realtimeData.currentB }} A</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">C相电流</div>
                <div class="monitor-value">{{ realtimeData.currentC }} A</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">功率因数</div>
                <div class="monitor-value">{{ realtimeData.powerFactor }}</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">充电效率</div>
                <div class="monitor-value">{{ realtimeData.efficiency }}%</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">设备温度</div>
                <div class="monitor-value" :class="{'warning': realtimeData.temperature > 65}">
                  {{ realtimeData.temperature }}°C
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="center-panel">
          <!-- 充电功率曲线 -->
          <div class="chart-panel">
            <div class="panel-header">
              <h3>充电功率曲线</h3>
              <el-radio-group v-model="powerChartRange" size="mini" @change="updatePowerChart">
                <el-radio-button label="realtime">实时</el-radio-button>
                <el-radio-button label="hour">1小时</el-radio-button>
                <el-radio-button label="day">24小时</el-radio-button>
              </el-radio-group>
            </div>
            <div class="chart-container">
              <div ref="powerChart" style="width: 100%; height: 260px;"></div>
            </div>
          </div>

          <!-- 日充电量分布 -->
          <div class="chart-panel">
            <div class="panel-header">
              <h3>24小时充电量分布</h3>
              <span class="chart-summary">总计: {{ dailyStats.totalEnergy }} kWh</span>
            </div>
            <div class="chart-container">
              <div ref="energyChart" style="width: 100%; height: 260px;"></div>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <!-- 设备信息 -->
          <div class="info-panel">
            <div class="panel-header">
              <h3>设备信息</h3>
            </div>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">设备型号</span>
                <span class="info-value">{{ deviceInfo.model }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">充电标准</span>
                <span class="info-value">{{ deviceInfo.standard }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">安装日期</span>
                <span class="info-value">{{ deviceInfo.installDate }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">运行时长</span>
                <span class="info-value">{{ deviceInfo.runningHours }} 小时</span>
              </div>
              <div class="info-row">
                <span class="info-label">累计充电</span>
                <span class="info-value">{{ deviceInfo.totalEnergy }} kWh</span>
              </div>
              <div class="info-row">
                <span class="info-label">累计收入</span>
                <span class="info-value">¥ {{ deviceInfo.totalRevenue }}</span>
              </div>
            </div>
          </div>

          <!-- 告警记录 -->
          <div class="alert-panel">
            <div class="panel-header">
              <h3>告警记录</h3>
              <el-badge :value="activeAlerts" :hidden="activeAlerts === 0" class="alert-badge">
                <span class="alert-count">{{ activeAlerts }} 条活动</span>
              </el-badge>
            </div>
            <div class="alert-list">
              <div
                v-for="alert in alerts"
                :key="alert.id"
                class="alert-item"
                :class="'level-' + alert.level"
              >
                <div class="alert-header">
                  <span class="alert-type">{{ alert.type }}</span>
                  <span class="alert-time">{{ alert.time }}</span>
                </div>
                <div class="alert-message">{{ alert.message }}</div>
                <div class="alert-action" v-if="!alert.resolved">
                  <el-button type="text" size="mini" @click="resolveAlert(alert.id)">
                    标记已处理
                  </el-button>
                </div>
              </div>
              <div v-if="alerts.length === 0" class="alert-empty">
                暂无告警记录
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部统计区 -->
      <div class="bottom-stats">
        <div class="stats-tabs">
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-label">充电次数</div>
                  <div class="stat-value">{{ monthStats.sessions }}</div>
                  <div class="stat-trend" :class="monthStats.sessionsTrend > 0 ? 'up' : 'down'">
                    {{ monthStats.sessionsTrend > 0 ? '+' : '' }}{{ monthStats.sessionsTrend }}%
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">充电量</div>
                  <div class="stat-value">{{ monthStats.energy }} <span class="unit">kWh</span></div>
                  <div class="stat-trend" :class="monthStats.energyTrend > 0 ? 'up' : 'down'">
                    {{ monthStats.energyTrend > 0 ? '+' : '' }}{{ monthStats.energyTrend }}%
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">营业收入</div>
                  <div class="stat-value">{{ monthStats.revenue }} <span class="unit">元</span></div>
                  <div class="stat-trend" :class="monthStats.revenueTrend > 0 ? 'up' : 'down'">
                    {{ monthStats.revenueTrend > 0 ? '+' : '' }}{{ monthStats.revenueTrend }}%
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">平均使用率</div>
                  <div class="stat-value">{{ monthStats.utilization }}<span class="unit">%</span></div>
                  <div class="stat-trend" :class="monthStats.utilizationTrend > 0 ? 'up' : 'down'">
                    {{ monthStats.utilizationTrend > 0 ? '+' : '' }}{{ monthStats.utilizationTrend }}%
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">平均充电时长</div>
                  <div class="stat-value">{{ monthStats.avgDuration }} <span class="unit">分钟</span></div>
                  <div class="stat-trend">环比上月</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">故障时长</div>
                  <div class="stat-value">{{ monthStats.faultHours }} <span class="unit">小时</span></div>
                  <div class="stat-trend">可用率 {{ monthStats.availability }}%</div>
                </div>
              </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 在组件内部引入 echarts
import * as echarts from 'echarts'

export default {
  name: 'ChargingStationDetail',
  data () {
    return {
      // 🔥 新增：页面加载状态
      pageLoading: true,
      resizeTimer: null,

      // 设备基础信息
      deviceInfo: {
        deviceId: 'DC-2024-A3-001',
        name: 'A区3号直流充电桩',
        model: 'TELD-DC120',
        standard: 'GB/T 20234.3-2015',
        ratedPower: 120,
        installDate: '2024-03-15',
        runningHours: 5832,
        totalEnergy: 156789.5,
        totalRevenue: 235184.25,
        online: true
      },

      // 实时数据
      realtimeData: {
        voltage: 380,
        voltageA: 220.3,
        voltageB: 219.8,
        voltageC: 220.1,
        current: 158.5,
        currentA: 52.8,
        currentB: 53.1,
        currentC: 52.6,
        power: 60.2,
        powerFactor: 0.96,
        efficiency: 95.8,
        temperature: 45.2
      },

      // 今日数据
      todayData: {
        totalEnergy: 823.5,
        sessions: 18,
        revenue: 1235.25,
        avgPrice: 1.5
      },

      // 充电状态
      chargingStatus: {
        isCharging: true
      },

      // 当前充电会话
      currentSession: {
        userName: '王建国',
        plateNumber: '苏A·8B569',
        startTime: '14:25:36',
        duration: 42,
        chargedEnergy: 28.5,
        currentCost: 42.75,
        batterySOC: 68,
        estimatedTime: 25,
        targetSOC: 95
      },

      // 日统计数据
      dailyStats: {
        totalEnergy: 823.5
      },

      // 月统计数据
      monthStats: {
        sessions: 486,
        sessionsTrend: 12.5,
        energy: 22456.8,
        energyTrend: 8.3,
        revenue: 33685.2,
        revenueTrend: 9.1,
        utilization: 68.5,
        utilizationTrend: 3.2,
        avgDuration: 48,
        faultHours: 2.5,
        availability: 99.3
      },

      // 告警列表
      alerts: [
        {
          id: 1,
          level: 'warning',
          type: '温度告警',
          message: '充电模块温度偏高，当前温度65.2°C',
          time: '15:32:18',
          resolved: false
        },
        {
          id: 2,
          level: 'info',
          type: '充电异常',
          message: '充电功率波动，已自动调节',
          time: '14:45:22',
          resolved: true
        }
      ],

      activeAlerts: 1,
      lastUpdateTime: '16:35:42',
      updateTimer: null,

      // 图表控制
      powerChartRange: 'realtime',
      statsTab: 'month',

      // 图表实例
      charts: {
        power: null,
        energy: null,
        trend: null
      }
    }
  },

  async mounted () {
    console.log('充电桩详情页面已挂载')

    // 🔥 新增：模拟数据加载过程
    await this.loadStationData()

    // 🔥 新增：初始化图表（在数据加载完成后）
    this.initCharts()

    // 🔥 新增：启动实时更新
    this.startRealtimeUpdate()

    // 🔥 新增：处理布局变化
    this.$nextTick(() => {
      this.handleLayoutChange()
    })
  },

  beforeDestroy () {
    // 🔥 新增：完善的清理工作
    this.stopRealtimeUpdate()
    this.destroyCharts()
    clearTimeout(this.resizeTimer)
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    // 🔥 新增：模拟数据加载
    async loadStationData () {
      this.pageLoading = true

      try {
        // 模拟网络请求
        await new Promise(resolve => setTimeout(resolve, 1500))

        // 这里可以根据路由参数加载不同的充电桩数据
        console.log('充电桩数据加载完成')
      } catch (error) {
        this.$message.error('加载充电桩数据失败')
      } finally {
        this.pageLoading = false
      }
    },

    // 🔥 新增：布局变化处理
    handleLayoutChange () {
      // 延迟执行，等待CSS动画完成
      this.resizeTimer = setTimeout(() => {
        if (this.charts.power) {
          console.log('充电桩详情：执行图表重绘')
          this.charts.power.resize()
        }
        if (this.charts.energy) {
          this.charts.energy.resize()
        }
      }, 350) // 等待树面板动画完成
    },

    // 🔥 新增：防抖的resize处理
    handleResize () {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        if (this.charts.power) {
          this.charts.power.resize()
        }
        if (this.charts.energy) {
          this.charts.energy.resize()
        }
      }, 100)
    },

    // 初始化图表
    initCharts () {
      this.$nextTick(() => {
        this.initPowerChart()
        this.initEnergyChart()

        // 🔥 新增：监听窗口大小变化
        window.addEventListener('resize', this.handleResize)
      })
    },

    // 功率曲线图
    initPowerChart () {
      if (!this.$refs.powerChart) return

      // 使用 this.$echarts 或 window.echarts
      const echarts = this.$echarts || window.echarts
      if (!echarts) {
        console.error('ECharts 未加载')
        return
      }

      const chart = echarts.init(this.$refs.powerChart)
      this.charts.power = chart

      // 生成真实的充电功率曲线数据
      const generatePowerData = () => {
        const data = []
        const now = new Date()

        if (this.powerChartRange === 'realtime') {
          // 实时数据 - 每秒一个点，显示5分钟
          for (let i = 300; i >= 0; i--) {
            const time = new Date(now - i * 1000)
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`
            // 模拟充电功率曲线：开始快速上升，稳定后略有波动
            let power = 0
            if (i > 250) {
              power = 60 + Math.random() * 5
            } else if (i > 200) {
              power = 75 + Math.random() * 5
            } else if (i > 100) {
              power = 85 + Math.random() * 3
            } else {
              power = 60 + Math.random() * 2 // 充电后期功率下降
            }
            data.push([timeStr, power.toFixed(1)])
          }
        }
        return data
      }

      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>功率: {c} kW'
        },
        grid: {
          left: '3%',
          right: '3%',
          bottom: '3%',
          top: '8%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          axisLine: {
            lineStyle: { color: '#E4E7ED' }
          },
          axisLabel: {
            color: '#606266',
            fontSize: 11,
            interval: 'auto'
          }
        },
        yAxis: {
          type: 'value',
          name: 'kW',
          nameTextStyle: {
            color: '#909399',
            fontSize: 11
          },
          splitLine: {
            lineStyle: { color: '#EBEEF5' }
          },
          axisLabel: {
            color: '#606266',
            fontSize: 11
          }
        },
        series: [{
          type: 'line',
          smooth: true,
          symbol: 'none',
          sampling: 'average',
          lineStyle: {
            color: '#409EFF',
            width: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
              ]
            }
          },
          data: generatePowerData()
        }]
      }

      chart.setOption(option)
    },

    // 24小时充电量分布
    initEnergyChart () {
      if (!this.$refs.energyChart) return

      // 使用 this.$echarts 或 window.echarts
      const echarts = this.$echarts || window.echarts
      if (!echarts) {
        console.error('ECharts 未加载')
        return
      }

      const chart = echarts.init(this.$refs.energyChart)
      this.charts.energy = chart

      // 生成24小时充电量分布（符合实际充电站规律）
      const hours = []
      const energyData = []
      const sessionsData = []

      for (let i = 0; i < 24; i++) {
        hours.push(`${i.toString().padStart(2, '0')}:00`)
        // 充电高峰：早高峰7-9点，晚高峰17-20点
        let energy = 20 + Math.random() * 10
        let sessions = 0.5 + Math.random() * 0.3

        if (i >= 7 && i <= 9) {
          energy = 45 + Math.random() * 15
          sessions = 1.2 + Math.random() * 0.3
        } else if (i >= 17 && i <= 20) {
          energy = 50 + Math.random() * 20
          sessions = 1.5 + Math.random() * 0.4
        } else if (i >= 0 && i <= 6) {
          energy = 10 + Math.random() * 5
          sessions = 0.2 + Math.random() * 0.1
        }

        energyData.push(energy.toFixed(1))
        sessionsData.push(sessions.toFixed(0))
      }

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function (params) {
            return `${params[0].name}<br/>
                    充电量: ${params[0].value} kWh<br/>
                    充电次数: ${params[1].value} 次`
          }
        },
        legend: {
          data: ['充电量', '充电次数'],
          textStyle: { fontSize: 11, color: '#606266' },
          right: 10,
          top: 5
        },
        grid: {
          left: '3%',
          right: '3%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: hours,
          axisLine: {
            lineStyle: { color: '#E4E7ED' }
          },
          axisLabel: {
            color: '#606266',
            fontSize: 10,
            interval: 2
          }
        },
        yAxis: [
          {
            type: 'value',
            name: 'kWh',
            nameTextStyle: { color: '#909399', fontSize: 11 },
            splitLine: { lineStyle: { color: '#EBEEF5' } },
            axisLabel: { color: '#606266', fontSize: 11 }
          },
          {
            type: 'value',
            name: '次数',
            nameTextStyle: { color: '#909399', fontSize: 11 },
            axisLabel: { color: '#606266', fontSize: 11 }
          }
        ],
        series: [
          {
            name: '充电量',
            type: 'bar',
            barWidth: '60%',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#409EFF' },
                  { offset: 1, color: '#79BBFF' }
                ]
              }
            },
            data: energyData
          },
          {
            name: '充电次数',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: { color: '#67C23A', width: 2 },
            itemStyle: { color: '#67C23A' },
            data: sessionsData
          }
        ]
      }

      chart.setOption(option)
    },

    // 销毁图表
    destroyCharts () {
      Object.keys(this.charts).forEach(key => {
        if (this.charts[key]) {
          this.charts[key].dispose()
          this.charts[key] = null
        }
      })
    },

    // 启动实时更新
    startRealtimeUpdate () {
      this.updateTimer = setInterval(() => {
        this.updateRealtimeData()
        this.updateCharts()
      }, 1500)
    },

    // 停止实时更新
    stopRealtimeUpdate () {
      if (this.updateTimer) {
        clearInterval(this.updateTimer)
        this.updateTimer = null
      }
    },

    // 更新实时数据
    updateRealtimeData () {
      // 模拟真实的三相电压波动（±2V）
      this.realtimeData.voltageA = Number((220 + (Math.random() - 0.5) * 4).toFixed(1))
      this.realtimeData.voltageB = Number((220 + (Math.random() - 0.5) * 4).toFixed(1))
      this.realtimeData.voltageC = Number((220 + (Math.random() - 0.5) * 4).toFixed(1))

      // 充电时的电流变化
      if (this.chargingStatus.isCharging) {
        // 根据SOC调整充电电流（SOC越高，电流越小）
        const socFactor = (100 - this.currentSession.batterySOC) / 100
        const baseCurrent = 50 + socFactor * 30

        this.realtimeData.currentA = Number((baseCurrent + (Math.random() - 0.5) * 2).toFixed(1))
        this.realtimeData.currentB = Number((baseCurrent + (Math.random() - 0.5) * 2).toFixed(1))
        this.realtimeData.currentC = Number((baseCurrent + (Math.random() - 0.5) * 2).toFixed(1))

        // 计算总电流和功率
        this.realtimeData.current = Number((this.realtimeData.currentA + this.realtimeData.currentB + this.realtimeData.currentC).toFixed(1))
        this.realtimeData.power = Number((this.realtimeData.voltage * this.realtimeData.current / 1000).toFixed(1))

        // 更新充电会话数据（修复精度问题）
        this.currentSession.duration = Math.round(this.currentSession.duration + 0.05)
        this.currentSession.chargedEnergy = Number((this.currentSession.chargedEnergy + this.realtimeData.power * 0.05 / 60).toFixed(2))
        this.currentSession.currentCost = Number((this.currentSession.chargedEnergy * 1.5).toFixed(2))

        // 更新SOC（充电速度递减）
        if (this.currentSession.batterySOC < this.currentSession.targetSOC) {
          const chargeRate = this.currentSession.batterySOC < 80 ? 0.5 : 0.2
          this.currentSession.batterySOC = Math.min(
            this.currentSession.targetSOC,
            this.currentSession.batterySOC + chargeRate
          )

          // 计算剩余时间
          const remainingSOC = this.currentSession.targetSOC - this.currentSession.batterySOC
          const currentRate = this.currentSession.batterySOC < 80 ? 2 : 0.5
          this.currentSession.estimatedTime = Math.ceil(remainingSOC / currentRate)
        }
      } else {
        // 空闲状态
        this.realtimeData.currentA = 0
        this.realtimeData.currentB = 0
        this.realtimeData.currentC = 0
        this.realtimeData.current = 0
        this.realtimeData.power = 0
      }

      // 功率因数（正常范围0.95-0.99）
      this.realtimeData.powerFactor = Number((0.95 + Math.random() * 0.04).toFixed(2))

      // 充电效率（正常范围94-97%）
      this.realtimeData.efficiency = Number((94 + Math.random() * 3).toFixed(1))

      // 设备温度（根据功率调整）
      const baseTemperate = 35 + this.realtimeData.power * 0.2
      this.realtimeData.temperature = Number((baseTemperate + (Math.random() - 0.5) * 2).toFixed(1))

      // 更新时间
      const now = new Date()
      this.lastUpdateTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    },

    // 更新图表
    updateCharts () {
      if (this.powerChartRange === 'realtime' && this.charts.power) {
        // 实时更新功率曲线
        this.updatePowerChart()
      }
    },

    // 更新功率图表
    updatePowerChart () {
      this.initPowerChart()
    },

    // 获取SOC颜色
    getSOCColor (soc) {
      if (soc < 20) return '#F56C6C'
      if (soc < 50) return '#E6A23C'
      if (soc < 80) return '#409EFF'
      return '#67C23A'
    },

    // 启动充电
    startCharging () {
      this.$confirm('确认启动充电？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        this.chargingStatus.isCharging = true
        // 初始化新的充电会话
        this.currentSession = {
          userName: '李明',
          plateNumber: '苏A·6D888',
          startTime: this.lastUpdateTime,
          duration: 0,
          chargedEnergy: 0,
          currentCost: 0,
          batterySOC: 25,
          estimatedTime: 65,
          targetSOC: 95
        }
        this.$message.success('充电已启动')
      })
    },

    // 停止充电
    stopCharging () {
      this.$confirm('确认停止充电？当前充电将结束。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.chargingStatus.isCharging = false
        this.$message.success('充电已停止')

        // 生成充电记录
        const record = {
          ...this.currentSession,
          endTime: this.lastUpdateTime
        }
        console.log('充电记录：', record)
      })
    },

    // 处理告警
    resolveAlert (alertId) {
      const alert = this.alerts.find(a => a.id === alertId)
      if (alert) {
        alert.resolved = true
        this.activeAlerts--
        this.$message.success('告警已处理')
      }
    },

    // 返回上一页
    goBack () {
      this.$router.go(-1)
    }
  },

  watch: {
    statsTab (val) {
      if (val === 'history') {
        this.$nextTick(() => {
        })
      }
    }
  }
}
</script>

<style scoped>
/* 🔥 新增：页面加载动画样式 */
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
}

.loading-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  font-size: 32px;
  color: #409EFF;
  margin-bottom: 16px;
}

.loading-spinner i {
  animation: rotate 1s linear infinite;
}

.loading-text {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 🔥 新增：页面主体内容动画 */
.page-main-content {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 全局样式 */
.charging-detail-container {
  background: #f5f6f8;
  min-height: 100vh;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Helvetica Neue', sans-serif;
}

/* 顶部指标区 */
.top-metrics-section {
  background: white;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
}

.device-status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #EBEEF5;
  margin-bottom: 20px;
}

.status-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.device-id {
  font-size: 13px;
  color: #909399;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 4px;
  background: #f0f2f5;
}

.status-indicator.online {
  background: #f0f9ff;
}

.status-indicator.offline {
  background: #fef0f0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
}

.online .status-dot {
  background: #67C23A;
  animation: pulse 2s infinite;
}

.offline .status-dot {
  background: #F56C6C;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.5); }
  70% { box-shadow: 0 0 0 6px rgba(103, 194, 58, 0); }
  100% { box-shadow: 0 0 0 0 rgba(103, 194, 58, 0); }
}

.status-text {
  font-size: 13px;
  color: #606266;
}

.online .status-text {
  color: #67C23A;
}

.offline .status-text {
  color: #F56C6C;
}

/* 指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label {
  font-size: 13px;
  color: #909399;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.metric-value .unit {
  font-size: 14px;
  font-weight: 400;
  color: #606266;
}

.metric-sub {
  font-size: 12px;
  color: #C0C4CC;
}

/* 主内容区 */
.main-content {
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 16px;
  margin-bottom: 16px;
}

/* 面板通用样式 */
.control-panel,
.monitor-panel,
.chart-panel,
.info-panel,
.alert-panel {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.update-time {
  font-size: 12px;
  color: #C0C4CC;
}

/* 控制面板 */
.control-body {
  padding: 20px;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.session-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-label {
  font-size: 13px;
  color: #909399;
}

.session-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.session-value.highlight {
  color: #409EFF;
  font-weight: 600;
}

.charge-progress-section {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.progress-percent {
  font-weight: 600;
  color: #409EFF;
}

.progress-detail {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.control-empty {
  padding: 60px 20px;
  text-align: center;
}

.control-empty p {
  font-size: 16px;
  color: #606266;
  margin: 0 0 8px 0;
}

.control-empty span {
  font-size: 13px;
  color: #C0C4CC;
}

/* 监控面板 */
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 16px;
  gap: 16px;
}

.monitor-item {
  text-align: center;
  padding: 12px;
  background: #fafbfc;
  border-radius: 4px;
}

.monitor-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.monitor-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.monitor-value.warning {
  color: #E6A23C;
}

/* 图表面板 */
.chart-container {
  padding: 16px;
}

.chart-summary {
  font-size: 12px;
  color: #909399;
}

/* 信息面板 */
.info-list {
  padding: 16px 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

/* 告警面板 */
.alert-badge {
  margin-left: auto;
}

.alert-count {
  font-size: 12px;
  color: #909399;
}

.alert-list {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.alert-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  border-left: 3px solid transparent;
  background: #fafbfc;
}

.alert-item.level-error {
  border-left-color: #F56C6C;
  background: #fef0f0;
}

.alert-item.level-warning {
  border-left-color: #E6A23C;
  background: #fdf6ec;
}

.alert-item.level-info {
  border-left-color: #909399;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.alert-type {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.alert-time {
  font-size: 11px;
  color: #C0C4CC;
}

.alert-message {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.alert-action {
  margin-top: 8px;
}

.alert-empty {
  padding: 40px;
  text-align: center;
  color: #C0C4CC;
  font-size: 13px;
}

/* 底部统计区 */
.bottom-stats {
  background: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
}

.stats-tabs {
  margin: -20px;
}

.stats-tabs .el-tabs__header {
  margin-bottom: 0;
}

.stats-tabs .el-tabs__content {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  border-right: 1px solid #EBEEF5;
}

.stat-item:last-child {
  border-right: none;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-value .unit {
  font-size: 12px;
  font-weight: 400;
  color: #606266;
  margin-left: 2px;
}

.stat-trend {
  font-size: 12px;
  color: #909399;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

/* 响应式 */
@media (max-width: 1440px) {
  .main-content {
    grid-template-columns: 300px 1fr 320px;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .monitor-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
