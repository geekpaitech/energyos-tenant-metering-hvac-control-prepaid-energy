<template>
  <div class="charging-dashboard">

    <!-- 演示模式标识 -->
    <div class="demo-badge">
      <div class="demo-badge-content">
        <div class="demo-icon">
          <i class="el-icon-view"></i>
        </div>
        <div class="demo-text">
          <div class="demo-title">即将开放</div>
          <div class="demo-subtitle">COMING SOON</div>
        </div>
        <div class="demo-pulse"></div>
      </div>
      <div class="demo-tag">
        <i class="el-icon-info"></i>
       当前为模拟数据
      </div>
    </div>
    <!-- 头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <div class="platform-info">
          <h1 class="platform-title">充电桩总览</h1>
        </div>
      </div>
      <div class="header-right">
        <div class="status-info">
          <span class="status-item">主页在线</span>
          <span class="status-item">设备数: {{ totalDevices }}</span>
          <span class="status-item current-time">{{ currentTime }}</span>
        </div>
        <button class="refresh-btn" @click="refreshData">
          <i class="el-icon-refresh"></i>
          刷新数据
        </button>
      </div>
    </div>

    <!-- 实时运营数据 -->
    <div class="section-container">
      <div class="section-header">
        <div class="section-title">
          <span class="title-icon"></span>
          实时运营数据
        </div>
      </div>

      <div class="stats-grid">
        <!-- 充电电量 -->
        <div class="stat-card">
          <div class="stat-icon electricity-icon">
            <i class="iconfont  icon-dianbiao1"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">
              {{ mockData.stats.totalPower }}
              <span class="unit">kWh</span>
            </div>
            <div class="stat-label">充电电量</div>
            <div class="stat-trend positive">
              <i class="el-icon-top"></i>
              8.8% 昨日
            </div>
          </div>
        </div>

        <!-- 订单数量 -->
        <div class="stat-card">
          <div class="stat-icon order-icon">
            <i class="el-icon-document"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ mockData.stats.totalOrders }}</div>
            <div class="stat-label">订单数量</div>
            <div class="stat-trend neutral">
              0% 昨日
            </div>
          </div>
        </div>

        <!-- 营业收入 -->
        <div class="stat-card">
          <div class="stat-icon revenue-icon">
            <i class="el-icon-coin"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ mockData.stats.revenue }}</div>
            <div class="stat-label">营业收入</div>
            <div class="stat-sub-info">
              <div>月预算: ¥{{ mockData.stats.monthBudget }}</div>
              <div>年预算: ¥{{ mockData.stats.yearBudget }}</div>
            </div>
          </div>
        </div>

        <!-- 订单总额 -->
        <div class="stat-card">
          <div class="stat-icon amount-icon">
            <i class="el-icon-shopping-cart-2"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ mockData.stats.orderAmount }}</div>
            <div class="stat-label">订单总额</div>
            <div class="stat-sub-info">
              <div>订单数量基础: ¥{{ mockData.stats.orderBase }}</div>
            </div>
          </div>
        </div>

        <!-- 可提现金额 -->
        <div class="stat-card">
          <div class="stat-icon balance-icon">
            <i class="el-icon-wallet"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ mockData.stats.balance }}</div>
            <div class="stat-label">可提现金额</div>
            <div class="stat-sub-info">
              <div>待清算金额: ¥{{ mockData.stats.pendingAmount }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 站点经营数据 -->
      <div class="chart-container">
        <div class="chart-header">
          <div class="chart-title">
            <span class="chart-icon">
              <i class="el-icon-data-line"></i>
            </span>
            站点经营数据
          </div>
          <div class="chart-controls">
            <el-button-group>
              <el-button :type="timeType === 'day' ? 'primary' : ''" size="small" @click="switchTimeType('day')">
                日
              </el-button>
              <el-button :type="timeType === 'month' ? 'primary' : ''" size="small" @click="switchTimeType('month')">
                月
              </el-button>
            </el-button-group>
          </div>
        </div>

        <div ref="stationChart" class="chart-content" v-loading="chartLoading"></div>
      </div>

      <!-- 站点营业排行 -->
      <div class="ranking-container">
        <div class="ranking-header">
          <div class="ranking-title">
            <span class="ranking-icon">
              <i class="el-icon-trophy"></i>
            </span>
            站点营业排行
          </div>
          <el-select v-model="rankingPeriod" size="small">
            <el-option label="月排行" value="month"></el-option>
            <el-option label="周排行" value="week"></el-option>
          </el-select>
        </div>

        <div class="ranking-list">
          <div v-for="(station, index) in mockData.topStations" :key="index" class="ranking-item">
            <div class="ranking-avatar">
              <span>{{ station.avatar }}</span>
            </div>
            <div class="ranking-info">
              <div class="station-name">{{ station.name }}</div>
              <div class="station-detail">
                <i class="el-icon-aim"></i>
                {{ station.storeCount }}条门店
              </div>
              <div class="progress-container">
                <el-progress :percentage="station.progress" :show-text="false" :stroke-width="6"
                  color="#52c41a"></el-progress>
              </div>
            </div>
            <div class="ranking-amount">
              <div class="amount-value">¥{{ station.amount }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 充电时段分布 -->
    <div class="section-container">
      <div class="section-header">
        <div class="section-title">
          <span class="title-icon distribution-icon"></span>
          充电时段分布
        </div>
        <div class="section-controls">
          <el-button type="primary" size="small">
            数据统计
          </el-button>
          <el-button size="small">
            数据配置
          </el-button>
        </div>
      </div>

      <div ref="distributionChart" class="distribution-chart" v-loading="chartLoading"></div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import moment from 'moment'

export default {
  name: 'ChargingDashboard',
  data () {
    return {
      timeType: 'day',
      rankingPeriod: 'month',
      chartLoading: false,
      currentTime: '',
      totalDevices: 1240,
      stationChartInstance: null,
      distributionChartInstance: null,

      // 模拟数据
      mockData: {
        stats: {
          totalPower: 171.94,
          totalOrders: 10,
          revenue: 208.97,
          orderAmount: 174.10,
          balance: 1316.20,
          monthBudget: 174.10,
          yearBudget: 24.67,
          orderBase: 34.87,
          pendingAmount: 298.97
        },

        stationData: [
          { date: '2025-08-04', charging: 25, charged: 20, orders: 5 },
          { date: '2025-08-05', charging: 30, charged: 25, orders: 8 },
          { date: '2025-08-06', charging: 35, charged: 30, orders: 12 },
          { date: '2025-08-07', charging: 70, charged: 60, orders: 15 },
          { date: '2025-08-08', charging: 85, charged: 75, orders: 18 },
          { date: '2025-08-09', charging: 20, charged: 15, orders: 3 },
          { date: '2025-08-10', charging: 10, charged: 8, orders: 2 }
        ],

        topStations: [
          {
            name: '中海油徐装支部+六大汽修务',
            amount: 208.97,
            progress: 100,
            avatar: 'V',
            storeCount: 10
          }
        ]
      },

      // 24小时分布数据
      hourlyData: []
    }
  },

  mounted () {
    this.updateCurrentTime()
    this.generateHourlyData()
    this.initCharts()

    // 定时更新当前时间
    this.timeInterval = setInterval(() => {
      this.updateCurrentTime()
    }, 1000)

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
  },

  beforeDestroy () {
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
    window.removeEventListener('resize', this.handleResize)

    if (this.stationChartInstance) {
      this.stationChartInstance.dispose()
    }
    if (this.distributionChartInstance) {
      this.distributionChartInstance.dispose()
    }
  },

  methods: {
    updateCurrentTime () {
      this.currentTime = moment().format('YYYY/MM/DD HH:mm:ss')
    },

    generateHourlyData () {
      this.hourlyData = Array.from({ length: 24 }, (_, i) => ({
        time: `${i.toString().padStart(2, '0')}:00:00`,
        charging: Math.random() * 50,
        charged: Math.random() * 40,
        orders: Math.random() * 20
      }))
    },

    refreshData () {
      this.chartLoading = true
      this.generateHourlyData()

      // 模拟数据刷新延迟
      setTimeout(() => {
        this.updateCharts()
        this.chartLoading = false
        this.$message.success('数据已刷新')
      }, 1000)
    },

    switchTimeType (type) {
      this.timeType = type
      this.updateStationChart()
    },

    initCharts () {
      this.$nextTick(() => {
        this.initStationChart()
        this.initDistributionChart()
      })
    },

    initStationChart () {
      if (this.$refs.stationChart) {
        this.stationChartInstance = echarts.init(this.$refs.stationChart)
        this.updateStationChart()
      }
    },

    initDistributionChart () {
      if (this.$refs.distributionChart) {
        this.distributionChartInstance = echarts.init(this.$refs.distributionChart)
        this.updateDistributionChart()
      }
    },

    updateCharts () {
      this.updateStationChart()
      this.updateDistributionChart()
    },

    updateStationChart () {
      if (!this.stationChartInstance) return

      const data = this.mockData.stationData
      const xAxisData = data.map(item => item.date.slice(5))

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e0e0e0',
          textStyle: { color: '#333' }
        },
        legend: {
          data: ['充电电量', '充电次数', '订单金额'],
          textStyle: { color: '#666' },
          bottom: 20
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          axisLabel: { color: '#666' }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          axisLabel: { color: '#666' },
          splitLine: { lineStyle: { color: '#f0f0f0' } }
        },
        series: [
          {
            name: '充电电量',
            type: 'line',
            data: data.map(item => item.charging),
            smooth: true,
            lineStyle: { color: '#00d4aa', width: 3 },
            itemStyle: { color: '#00d4aa' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(0, 212, 170, 0.3)' },
                  { offset: 1, color: 'rgba(0, 212, 170, 0.1)' }
                ]
              }
            }
          },
          {
            name: '充电次数',
            type: 'line',
            data: data.map(item => item.charged),
            smooth: true,
            lineStyle: { color: '#1890ff', width: 3 },
            itemStyle: { color: '#1890ff' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                  { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
                ]
              }
            }
          },
          {
            name: '订单金额',
            type: 'line',
            data: data.map(item => item.orders),
            smooth: true,
            lineStyle: { color: '#9254de', width: 3 },
            itemStyle: { color: '#9254de' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(146, 84, 222, 0.3)' },
                  { offset: 1, color: 'rgba(146, 84, 222, 0.1)' }
                ]
              }
            }
          }
        ]
      }

      this.stationChartInstance.setOption(option)
    },

    updateDistributionChart () {
      if (!this.distributionChartInstance) return

      const xAxisData = this.hourlyData.map(item => item.time)

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e0e0e0',
          textStyle: { color: '#333' }
        },
        legend: {
          data: ['充电电量', '充电次数', '订单金额'],
          textStyle: { color: '#666' },
          top: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          top: '15%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          axisLabel: {
            color: '#666',
            interval: 3,
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          axisLabel: { color: '#666' },
          splitLine: { lineStyle: { color: '#f0f0f0' } }
        },
        series: [
          {
            name: '充电电量',
            type: 'line',
            data: this.hourlyData.map(item => item.charging),
            smooth: true,
            lineStyle: { color: '#00d4aa', width: 2 },
            itemStyle: { color: '#00d4aa' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(0, 212, 170, 0.4)' },
                  { offset: 1, color: 'rgba(0, 212, 170, 0.1)' }
                ]
              }
            }
          },
          {
            name: '充电次数',
            type: 'line',
            data: this.hourlyData.map(item => item.charged),
            smooth: true,
            lineStyle: { color: '#52c41a', width: 2 },
            itemStyle: { color: '#52c41a' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(82, 196, 26, 0.4)' },
                  { offset: 1, color: 'rgba(82, 196, 26, 0.1)' }
                ]
              }
            }
          },
          {
            name: '订单金额',
            type: 'line',
            data: this.hourlyData.map(item => item.orders),
            smooth: true,
            lineStyle: { color: '#1890ff', width: 2 },
            itemStyle: { color: '#1890ff' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(24, 144, 255, 0.4)' },
                  { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
                ]
              }
            }
          }
        ]
      }

      this.distributionChartInstance.setOption(option)
    },

    handleResize () {
      this.$nextTick(() => {
        if (this.stationChartInstance) {
          this.stationChartInstance.resize()
        }
        if (this.distributionChartInstance) {
          this.distributionChartInstance.resize()
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.charging-dashboard {
  min-height: 100vh;
  padding: 16px;
  background: #f5f7fa;
}

// 头部样式
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  .platform-info {
    display: flex;
    align-items: center;

    .platform-icon {
      width: 40px;
      height: 40px;
      background: #52c41a;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;

      span {
        color: white;
        font-weight: bold;
        font-size: 18px;
      }
    }

    .platform-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;

  .status-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .status-item {
      font-size: 14px;
      color: #666;

      &.current-time {
        color: #52c41a;
        font-weight: 500;
      }
    }
  }

  .refresh-btn {
    background: #217aff;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #389e0d;
    }
  }
}

// 区块容器
.section-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;

  .section-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;

    .title-icon {
      width: 4px;
      height: 16px;
      background: #52c41a;
      border-radius: 2px;
      margin-right: 12px;
    }

    &.distribution-icon .title-icon {
      background: #1890ff;
    }
  }
}

// 统计卡片
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  padding: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;

    &.electricity-icon {
      background: #e6f7ff;
      color: #1890ff;
    }

    &.order-icon {
      background: #f6ffed;
      color: #52c41a;
    }

    &.revenue-icon {
      background: #fff7e6;
      color: #fa8c16;
    }

    &.amount-icon {
      background: #f9f0ff;
      color: #722ed1;
    }

    &.balance-icon {
      background: #e6fffb;
      color: #13c2c2;
    }
  }

  .stat-content {
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1;
      margin-bottom: 4px;

      .unit {
        font-size: 14px;
        color: #666;
        font-weight: 400;
      }
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }

    .stat-trend {
      font-size: 12px;

      &.positive {
        color: #52c41a;
      }

      &.neutral {
        color: #666;
      }
    }

    .stat-sub-info {
      font-size: 12px;
      color: #999;
      line-height: 1.4;
    }
  }
}

// 主要内容区域
.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

// 图表容器
.chart-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;

    .chart-title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;

      .chart-icon {
        margin-right: 8px;
        color: #1890ff;
      }
    }
  }

  .chart-content {
    height: 350px;
    padding: 20px;
  }
}

// 排行榜
.ranking-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .ranking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;

    .ranking-title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;

      .ranking-icon {
        margin-right: 8px;
        color: #fa8c16;
      }
    }
  }

  .ranking-list {
    padding: 20px 24px;
  }

  .ranking-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .ranking-avatar {
      width: 32px;
      height: 32px;
      background: #ffc53d;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
    }

    .ranking-info {
      flex: 1;

      .station-name {
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;
        margin-bottom: 4px;
      }

      .station-detail {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;

        i {
          margin-right: 4px;
        }
      }

      .progress-container {
        width: 100%;
      }
    }

    .ranking-amount {
      .amount-value {
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
      }
    }
  }
}

// 分布图表
.distribution-chart {
  height: 320px;
  padding: 20px 24px;
}

// 响应式设计
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .main-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .charging-dashboard {
    padding: 12px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.demo-badge {
  position: fixed;
  right: 30px;
  top: 55%;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideInRight 0.5s ease-out;

  .demo-badge-content {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    padding: 14px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow:
      0 10px 40px rgba(59, 130, 246, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
      0 0 30px rgba(59, 130, 246, 0.4);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg,
          transparent 30%,
          rgba(255, 255, 255, 0.1) 50%,
          transparent 70%);
      animation: shimmer 3s infinite;
    }

    .demo-icon {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);

      i {
        animation: pulse 2s ease-in-out infinite;
      }
    }

    .demo-text {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .demo-title {
        font-size: 15px;
        font-weight: 700;
        color: white;
        letter-spacing: 0.5px;
      }

      .demo-subtitle {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 600;
        letter-spacing: 1px;
      }
    }

    .demo-pulse {
      width: 8px;
      height: 8px;
      background: #fbbf24;
      border-radius: 50%;
      position: relative;
      animation: pulse-dot 2s ease-in-out infinite;

      &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid #fbbf24;
        border-radius: 50%;
        animation: pulse-ring 2s ease-in-out infinite;
      }
    }
  }

  .demo-tag {
    background: rgba(59, 130, 246, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.3);
    padding: 8px 14px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #2563eb;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);

    i {
      font-size: 14px;
    }
  }
}
</style>
