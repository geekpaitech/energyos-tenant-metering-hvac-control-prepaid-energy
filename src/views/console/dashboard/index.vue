<template>
  <div class="iot-dashboard">
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
    
    <div class="dashboard-body">
      <!-- 快捷操作 -->
      <div class="quick-operations">
        <div class="operations-grid">
          <div class="operation-item" v-for="op in quickOperations" :key="op.id" 
               :class="op.type" @click="executeOperation(op.id)">
            <div class="operation-icon">
              <i :class="op.icon"></i>
            </div>
            <div class="operation-label">{{ op.label }}</div>
          </div>
        </div>
      </div>

      <div class="main-layout">
        <!-- 左侧主要区域 -->
        <div class="main-section">
          <!-- 设备监控中心 -->
          <div class="monitoring-panel">
            <div class="panel-header">
              <div class="header-left">
                <h3>设备监控中心</h3>
                <div class="data-source-info">
                  <span class="update-indicator">
                    <i class="el-icon-refresh"></i>
                    实时更新
                  </span>
                </div>
              </div>
              <div class="header-actions">
                <select v-model="timeRange" class="time-selector">
                  <option value="realtime">实时</option>
                  <option value="hour">最近1小时</option>
                  <option value="day">今日</option>
                  <option value="week">本周</option>
                </select>
                <button class="refresh-btn" @click="refreshData">
                  <i class="el-icon-refresh-right"></i>
                </button>
              </div>
            </div>

            <!-- 核心指标 -->
            <div class="metrics-overview">
              <div class="metric-card" v-for="metric in coreMetrics" :key="metric.key">
                <div class="metric-icon" :class="metric.iconClass">
                  <i :class="metric.icon"></i>
                </div>
                <div class="metric-content">
                  <div class="metric-header">
                    <span class="metric-label">{{ metric.label }}</span>
                    <div class="metric-trend" :class="metric.trend">
                      <i :class="metric.trendIcon"></i>
                      <span>{{ metric.change }}</span>
                    </div>
                  </div>
                  <div class="metric-value">{{ metric.value }}</div>
                  <div class="metric-subtitle">{{ metric.subtitle }}</div>
                </div>
              </div>
            </div>

            <!-- 图表区域 -->
            <div class="charts-container">
              <!-- 设备运行状态 -->
              <div class="chart-box">
                <div class="chart-header">
                  <h4>设备运行状态</h4>
                  <div class="chart-legend">
                    <span class="legend-item">
                      <span class="legend-dot excellent"></span>优秀
                    </span>
                    <span class="legend-item">
                      <span class="legend-dot good"></span>良好
                    </span>
                    <span class="legend-item">
                      <span class="legend-dot warning"></span>预警
                    </span>
                    <span class="legend-item">
                      <span class="legend-dot error"></span>故障
                    </span>
                  </div>
                </div>
                <div ref="statusChart" class="chart-canvas"></div>
              </div>

              <!-- 能耗流向分析 -->
              <div class="chart-box">
                <div class="chart-header">
                  <h4>能耗流向分析</h4>
                  <div class="chart-legend">
                    <span class="legend-item">
                      <span class="legend-dot source"></span>总能耗
                    </span>
                    <span class="legend-item">
                      <span class="legend-dot target"></span>设备分类
                    </span>
                  </div>
                </div>
                <div ref="typeChart" class="chart-canvas"></div>
              </div>
            </div>

            <!-- 实时数据趋势 -->
            <div class="trend-section">
              <div class="chart-header">
                <h4>24小时运行趋势</h4>
                <div class="trend-tabs">
                  <button 
                    v-for="tab in trendTabs" 
                    :key="tab.key"
                    class="trend-tab"
                    :class="{ active: activeTrendTab === tab.key }"
                    @click="switchTrendTab(tab.key)">
                    {{ tab.label }}
                  </button>
                </div>
              </div>
              <div ref="trendChart" class="trend-chart"></div>
            </div>
          </div>

          <!-- 智能分析平台区域 -->
          <div class="analytics-section">
            <div class="analytics-left">
              <div class="analytics-card">
                <div class="card-header">
                  <div class="header-icon">
                    <i class="el-icon-data-line"></i>
                  </div>
                  <div class="header-text">
                    <h3>设备智能分析平台</h3>
                    <p>基于大数据的设备状态预测与优化建议</p>
                  </div>
                </div>
                
                <!-- 数据指标网格 -->
                <div class="analytics-metrics">
                  <div class="metric-item">
                    <div class="metric-icon">
                      <i class="el-icon-aim"></i>
                    </div>
                    <div class="metric-info">
                      <span class="metric-value">98.5%</span>
                      <span class="metric-label">预测准确率</span>
                    </div>
                  </div>
                  
                  <div class="metric-item">
                    <div class="metric-icon">
                      <i class="el-icon-top-right"></i>
                    </div>
                    <div class="metric-info">
                      <span class="metric-value">15.3%</span>
                      <span class="metric-label">能效提升</span>
                    </div>
                  </div>
                  
                  <div class="metric-item">
                    <div class="metric-icon">
                      <i class="el-icon-timer"></i>
                    </div>
                    <div class="metric-info">
                      <span class="metric-value">72h</span>
                      <span class="metric-label">故障预警期</span>
                    </div>
                  </div>
                  
                  <div class="metric-item">
                    <div class="metric-icon">
                      <i class="el-icon-aim"></i>
                    </div>
                    <div class="metric-info">
                      <span class="metric-value">99.2%</span>
                      <span class="metric-label">系统可靠性</span>
                    </div>
                  </div>
                </div>
                
                <!-- 快速洞察 -->
                <div class="quick-insights">
                  <div class="insight-title">
                    <i class="el-icon-light-rain"></i>
                    智能洞察
                  </div>
                  <div class="insight-content">
                    <div class="insight-item">
                      <span class="insight-text">检测到空调系统运行效率可提升8%</span>
                      <span class="insight-action">查看详情</span>
                    </div>
                    <div class="insight-item">
                      <span class="insight-text">预计明日用电高峰在14:00-16:00</span>
                      <span class="insight-action">优化调度</span>
                    </div>
                  </div>
                </div>
                
                <!-- 装饰背景 -->
                <div class="analytics-bg">
                  <svg class="bg-pattern" viewBox="0 0 100 100">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(64, 158, 255, 0.1)" stroke-width="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                  
                  <div class="floating-elements">
                    <div class="floating-dot dot-1"></div>
                    <div class="floating-dot dot-2"></div>
                    <div class="floating-dot dot-3"></div>
                    <div class="floating-circuit">
                      <svg viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(103, 194, 58, 0.2)" stroke-width="1" stroke-dasharray="5,5">
                          <animateTransform attributeName="transform" type="rotate" values="0 30 30;360 30 30" dur="20s" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="analytics-right">
              <div class="suggestion-card">
                <div class="suggestion-header">
                  <h4>优化建议</h4>
                  <span class="suggestion-count">1,235条</span>
                </div>
                <div class="suggestion-list">
                  <div class="suggestion-item">
                    <div class="suggestion-icon">
                      <i class="el-icon-magic-stick"></i>
                    </div>
                    <div class="suggestion-text">
                      <div class="suggestion-title">空调系统优化</div>
                      <div class="suggestion-desc">建议调整A栋空调运行策略</div>
                    </div>
                  </div>
                  <div class="suggestion-item">
                    <div class="suggestion-icon">
                      <i class="el-icon-lightning"></i>
                    </div>
                    <div class="suggestion-text">
                      <div class="suggestion-title">照明节能方案</div>
                      <div class="suggestion-desc">可节约15%用电成本</div>
                    </div>
                  </div>
                  <div class="suggestion-item">
                    <div class="suggestion-icon">
                      <i class="el-icon-magic-stick"></i>
                    </div>
                    <div class="suggestion-text">
                      <div class="suggestion-title">设备维护提醒</div>
                      <div class="suggestion-desc">建议对B区设备进行检修</div>
                    </div>
                  </div>
                </div>
                <button class="view-all-suggestions">查看全部建议</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧信息栏 -->
        <div class="sidebar">
          <!-- 设备概览 -->
          <div class="widget device-overview">
            <div class="widget-header">
              <h4>设备概览</h4>
              <span class="widget-subtitle">实时统计</span>
            </div>
            <div class="overview-stats">
              <div class="stat-card total">
                <div class="stat-value">15,680</div>
                <div class="stat-label">设备总数</div>
                <div class="stat-change up">+256 今日新增</div>
              </div>
              <div class="stat-card online">
                <div class="stat-value">15,392</div>
                <div class="stat-label">在线设备</div>
                <div class="stat-change">98.2% 在线率</div>
              </div>
            </div>
            <div class="device-list">
              <div class="device-item" v-for="item in deviceOverview" :key="item.type">
                <div class="device-icon" :class="item.type">
                  <i :class="item.icon"></i>
                </div>
                <div class="device-info">
                  <div class="device-name">{{ item.label }}</div>
                  <div class="device-count">{{ item.value }}</div>
                </div>
                <div class="device-status" :class="item.statusType">
                  {{ item.status }}
                </div>
              </div>
            </div>
          </div>

          <!-- 待办提醒 -->
          <div class="widget todo-widget">
            <div class="widget-header">
              <h4>待办事项</h4>
              <div class="todo-summary">
                <span class="pending-count">{{ pendingTodos }}项待处理</span>
              </div>
            </div>
            <div class="todo-list">
              <div class="todo-item" v-for="todo in filteredTodos" :key="todo.id" 
                   :class="{ completed: todo.completed, urgent: todo.priority === 'urgent' }">
                <div class="todo-check" @click="toggleTodo(todo.id)">
                  <i v-if="todo.completed" class="el-icon-check"></i>
                </div>
                <div class="todo-content">
                  <div class="todo-text">{{ todo.text }}</div>
                  <div class="todo-meta">
                    <span class="todo-category">{{ todo.category }}</span>
                    <span class="todo-time">{{ todo.time }}</span>
                  </div>
                </div>
                <div class="todo-priority" :class="todo.priority"></div>
              </div>
            </div>
          </div>

          <!-- 系统状态 -->
          <div class="widget system-status">
            <div class="widget-header">
              <h4>系统状态</h4>
              <div class="status-indicator online">
                <span class="dot"></span>
                运行正常
              </div>
            </div>
            <div class="status-grid">
              <div class="status-item" v-for="service in systemServices" :key="service.id">
                <div class="service-name">{{ service.name }}</div>
                <div class="service-status" :class="service.status">
                  <span class="status-dot"></span>
                  {{ getServiceStatus(service.status) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 在文件顶部引入 echarts
import * as echarts from 'echarts'

export default {
  name: 'IoTDashboard',
  data() {
    return {
      timeRange: 'realtime',
      activeTrendTab: 'online',
      quickOperations: [
        { id: 1, label: '设备巡检', icon: 'el-icon-search', type: 'primary' },
        { id: 2, label: '告警处理', icon: 'el-icon-warning-outline', type: 'warning' },
        { id: 3, label: '数据分析', icon: 'el-icon-data-analysis', type: 'info' },
        { id: 4, label: '远程控制', icon: 'el-icon-connection', type: 'success' },
        { id: 5, label: '运维管理', icon: 'el-icon-setting', type: 'secondary' },
        { id: 6, label: '报表生成', icon: 'el-icon-document', type: 'info' },
        { id: 7, label: '系统配置', icon: 'el-icon-setting', type: 'secondary' }
      ],
      coreMetrics: [
        {
          key: 'total',
          label: '设备总数',
          value: '15,680',
          subtitle: '台设备接入',
          trend: 'up',
          trendIcon: 'el-icon-top',
          change: '+2.5%',
          icon: 'el-icon-cpu',
          iconClass: 'blue'
        },
        {
          key: 'online',
          label: '在线率',
          value: '98.2%',
          subtitle: '正常运行中',
          trend: 'up',
          trendIcon: 'el-icon-top',
          change: '+0.3%',
          icon: 'el-icon-connection',
          iconClass: 'green'
        },
        {
          key: 'energy',
          label: '今日能耗',
          value: '2,456',
          subtitle: 'kWh',
          trend: 'down',
          trendIcon: 'el-icon-bottom',
          change: '-5.1%',
          icon: 'el-icon-data-analysis',
          iconClass: 'orange'
        },
        {
          key: 'alert',
          label: '活跃告警',
          value: '23',
          subtitle: '待处理',
          trend: 'down',
          trendIcon: 'el-icon-bottom',
          change: '-12.5%',
          icon: 'el-icon-warning',
          iconClass: 'red'
        }
      ],
      trendTabs: [
        { key: 'online', label: '在线率' },
        { key: 'energy', label: '能耗' },
        { key: 'alert', label: '告警' }
      ],
      deviceOverview: [
        { type: 'electric', label: '智能电表', value: '5,680', status: '98.5%在线', statusType: 'excellent', icon: 'el-icon-lightning' },
        { type: 'water', label: '智能水表', value: '2,890', status: '97.8%在线', statusType: 'good', icon: 'el-icon-coffee-cup' },
        { type: 'hvac', label: '空调系统', value: '1,245', status: '96.2%在线', statusType: 'good', icon: 'el-icon-wind-power' },
        { type: 'lighting', label: '照明设备', value: '3,150', status: '99.1%在线', statusType: 'excellent', icon: 'el-icon-light-rain' },
        { type: 'security', label: '安防监控', value: '890', status: '94.5%在线', statusType: 'warning', icon: 'el-icon-view' },
        { type: 'charging', label: '充电桩', value: '456', status: '92.3%在线', statusType: 'warning', icon: 'el-icon-loading' }
      ],
      todoItems: [
        {
          id: 1,
          text: 'A栋301电表功率异常，需立即处理',
          category: '设备故障',
          time: '5分钟前',
          priority: 'urgent',
          completed: false
        },
        {
          id: 2,
          text: '智能照明系统定时策略需要优化',
          category: '系统优化',
          time: '1小时前',
          priority: 'normal',
          completed: false
        },
        {
          id: 3,
          text: 'B区水表数据采集异常排查',
          category: '数据问题',
          time: '2小时前',
          priority: 'normal',
          completed: false
        },
        {
          id: 4,
          text: '充电桩费率参数更新完成',
          category: '参数配置',
          time: '昨天',
          priority: 'low',
          completed: true
        }
      ],
      systemServices: [
        { id: 1, name: '数据采集服务', status: 'online' },
        { id: 2, name: '设备控制服务', status: 'online' },
        { id: 3, name: '告警处理服务', status: 'online' },
        { id: 4, name: 'API网关', status: 'maintenance' }
      ],
      resizeObserver: null
    }
  },
  computed: {
    pendingTodos() {
      return this.todoItems.filter(todo => !todo.completed).length
    },
    filteredTodos() {
      return this.todoItems
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initCharts()
    })
    
    window.addEventListener('resize', this.handleResize)
    
    this.$nextTick(() => {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.handleResize);
        const mainContent = this.$el.querySelector('.main-layout');
        if (mainContent) {
          this.resizeObserver.observe(mainContent);
        }
      }
      
      this.$bus && this.$bus.$on('menu-collapse', this.handleMenuToggle);
      this.$root.$on && this.$root.$on('sidebar-collapse', this.handleMenuToggle);
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    
    this.$bus && this.$bus.$off('menu-collapse', this.handleMenuToggle)
    this.$root.$off && this.$root.$off('sidebar-collapse', this.handleMenuToggle)
    
    if (this.statusChartInstance) this.statusChartInstance.dispose()
    if (this.typeChartInstance) this.typeChartInstance.dispose()
    if (this.trendChartInstance) this.trendChartInstance.dispose()
  },
  methods: {
    initCharts() {
      this.initStatusChart()
      this.initTypeChart()
      this.initTrendChart()
    },
    
    initStatusChart() {
      if (!this.$refs.statusChart) return
      
      const echarts = window.echarts || require('echarts')
      const chart = echarts.init(this.$refs.statusChart)
      this.statusChartInstance = chart
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item'
        },
        radar: {
          indicator: [
            { name: '运行效率', max: 100 },
            { name: '响应速度', max: 100 },
            { name: '稳定性', max: 100 },
            { name: '能效比', max: 100 },
            { name: '安全性', max: 100 }
          ],
          center: ['50%', '50%'],
          radius: '70%',
          axisName: {
            color: '#6b7280',
            fontSize: 11
          },
          splitLine: {
            lineStyle: {
              color: '#e2e8f0'
            }
          },
          splitArea: {
            show: true,
            areaStyle: {
              color: ['#f8fafc', '#f1f5f9']
            }
          },
          axisLine: {
            lineStyle: {
              color: '#d1d5db'
            }
          }
        },
        series: [{
          type: 'radar',
          data: [
            {
              value: [92, 88, 95, 85, 96],
              name: '优秀设备',
              itemStyle: {
                color: '#67c23a'
              },
              areaStyle: {
                color: 'rgba(103, 194, 58, 0.2)'
              }
            },
            {
              value: [78, 75, 80, 72, 85],
              name: '良好设备',
              itemStyle: {
                color: '#409eff'
              },
              areaStyle: {
                color: 'rgba(64, 158, 255, 0.2)'
              }
            },
            {
              value: [65, 60, 68, 58, 70],
              name: '预警设备',
              itemStyle: {
                color: '#e6a23c'
              },
              areaStyle: {
                color: 'rgba(230, 162, 60, 0.2)'
              }
            },
            {
              value: [45, 40, 50, 35, 48],
              name: '故障设备',
              itemStyle: {
                color: '#f56c6c'
              },
              areaStyle: {
                color: 'rgba(245, 108, 108, 0.2)'
              }
            }
          ]
        }]
      }
      
      chart.setOption(option)
    },
    
    initTypeChart() {
      if (!this.$refs.typeChart) return
      
      const echarts = window.echarts || require('echarts')
      const chart = echarts.init(this.$refs.typeChart)
      this.typeChartInstance = chart
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          formatter: function(params) {
            if (params.dataType === 'node') {
              return `${params.name}: ${params.value}kWh`
            } else {
              return `${params.sourceName} → ${params.targetName}<br/>能耗: ${params.value}kWh`
            }
          }
        },
        series: {
          type: 'sankey',
          layout: 'none',
          emphasis: {
            focus: 'adjacency'
          },
          nodeAlign: 'left',
          nodeGap: 20,
          nodeWidth: 15,
          itemStyle: {
            borderWidth: 1,
            borderColor: '#fff'
          },
          lineStyle: {
            color: 'gradient',
            curveness: 0.5
          },
          label: {
            fontSize: 11,
            color: '#333',
            fontWeight: 'normal'
          },
          data: [
            { name: '总能耗', value: 2456, itemStyle: { color: '#67c23a' } },
            { name: '照明系统', value: 856, itemStyle: { color: '#e6a23c' } },
            { name: '空调系统', value: 742, itemStyle: { color: '#409eff' } },
            { name: '电力设备', value: 568, itemStyle: { color: '#909399' } },
            { name: '安防监控', value: 185, itemStyle: { color: '#f56c6c' } },
            { name: '其他设备', value: 105, itemStyle: { color: '#c0c4cc' } },
            { name: 'LED灯具', value: 486, itemStyle: { color: '#fad337' } },
            { name: '应急照明', value: 215, itemStyle: { color: '#f4d03f' } },
            { name: '景观照明', value: 155, itemStyle: { color: '#f7dc6f' } },
            { name: '中央空调', value: 456, itemStyle: { color: '#5dade2' } },
            { name: '分体空调', value: 186, itemStyle: { color: '#85c1e9' } },
            { name: '新风系统', value: 100, itemStyle: { color: '#aed6f1' } },
            { name: '电梯系统', value: 268, itemStyle: { color: '#b2babb' } },
            { name: '充电桩', value: 185, itemStyle: { color: '#d5dbdb' } },
            { name: '配电设备', value: 115, itemStyle: { color: '#eaeded' } },
          ],
          links: [
            { source: '总能耗', target: '照明系统', value: 856 },
            { source: '总能耗', target: '空调系统', value: 742 },
            { source: '总能耗', target: '电力设备', value: 568 },
            { source: '总能耗', target: '安防监控', value: 185 },
            { source: '总能耗', target: '其他设备', value: 105 },
            { source: '照明系统', target: 'LED灯具', value: 486 },
            { source: '照明系统', target: '应急照明', value: 215 },
            { source: '照明系统', target: '景观照明', value: 155 },
            { source: '空调系统', target: '中央空调', value: 456 },
            { source: '空调系统', target: '分体空调', value: 186 },
            { source: '空调系统', target: '新风系统', value: 100 },
            { source: '电力设备', target: '电梯系统', value: 268 },
            { source: '电力设备', target: '充电桩', value: 185 },
            { source: '电力设备', target: '配电设备', value: 115 },
          ]
        }
      }
      
      chart.setOption(option)
    },
    
    initTrendChart() {
      if (!this.$refs.trendChart) return
      
      const echarts = window.echarts || require('echarts')
      const chart = echarts.init(this.$refs.trendChart)
      this.trendChartInstance = chart
      
      const hours = []
      const data = []
      for (let i = 0; i < 24; i++) {
        hours.push(`${i}:00`)
        data.push(Math.floor(Math.random() * 20) + 80)
      }
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            lineStyle: {
              color: '#e2e8f0'
            }
          }
        },
        grid: {
          left: '3%',
          right: '3%',
          bottom: '3%',
          top: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: hours,
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            interval: 5
          },
          axisLine: {
            lineStyle: { color: '#e2e8f0' }
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            formatter: '{value}%'
          },
          splitLine: {
            lineStyle: { 
              color: '#f1f5f9',
              type: 'dashed'
            }
          },
          axisLine: {
            lineStyle: { color: '#e2e8f0' }
          }
        },
        series: [{
          type: 'line',
          data: data,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#67c23a',
            width: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103, 194, 58, 0.2)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
            ])
          }
        }]
      }
      
      chart.setOption(option)
    },
    
    handleResize() {
      this.$nextTick(() => {
        if (this.statusChartInstance) this.statusChartInstance.resize()
        if (this.typeChartInstance) this.typeChartInstance.resize()
        if (this.trendChartInstance) this.trendChartInstance.resize()
      })
    },

    handleMenuToggle() {
      setTimeout(() => {
        this.handleResize()
      }, 300)
    },
    
    switchTrendTab(tab) {
      this.activeTrendTab = tab
      this.initTrendChart()
    },
    
    executeOperation(id) {
      console.log('执行操作:', id)
    },
    
    viewAnalysis() {
      console.log('查看智能分析')
    },
    
    refreshData() {
      console.log('刷新数据')
      this.initCharts()
    },
    
    toggleTodo(id) {
      const todo = this.todoItems.find(item => item.id === id)
      if (todo) {
        todo.completed = !todo.completed
      }
    },
    
    getStatusText(status) {
      const statusMap = {
        completed: '已完成',
        resolved: '已解决',
        processing: '处理中',
        pending: '待处理'
      }
      return statusMap[status] || status
    },
    
    getServiceStatus(status) {
      const statusMap = {
        online: '运行中',
        offline: '离线',
        maintenance: '维护中',
        error: '异常'
      }
      return statusMap[status] || status
    }
  }
}
</script>

<style lang="scss" scoped>
.iot-dashboard {
  background: #f8fafc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  position: relative;
}

// 演示模式标识
.demo-badge {
  position: fixed;
  right: 30px;
  top: 50%;
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
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 70%
      );
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

@keyframes slideInRight {
  from {
    transform: translateX(100px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

@keyframes pulse-dot {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

.dashboard-body {
  padding: 20px;
  position: relative;
  z-index: 2;
}

// 快捷操作 - 优化图标背景色
.quick-operations {
  margin-bottom: 20px;
  
  .operations-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 12px;
    
    .operation-item {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        border-color: #d1d5db;
      }
      
      .operation-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        i {
          font-size: 20px;
        }
      }
      
      .operation-label {
        font-size: 13px;
        font-weight: 500;
        color: #374151;
        text-align: center;
      }
      
      // B端简洁配色方案
      &.primary .operation-icon {
        background: #f3f4f6;
        color: #1f2937;
        border: 1px solid #e5e7eb;
      }
      
      &.warning .operation-icon {
        background: #fef3c7;
        color: #d97706;
        border: 1px solid #fbbf24;
      }
      
      &.success .operation-icon {
        background: #d1fae5;
        color: #059669;
        border: 1px solid #34d399;
      }
      
      &.info .operation-icon {
        background: #dbeafe;
        color: #2563eb;
        border: 1px solid #60a5fa;
      }
      
      &.secondary .operation-icon {
        background: #f9fafb;
        color: #6b7280;
        border: 1px solid #d1d5db;
      }
    }
  }
}

// 主要布局
.main-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  min-height: 0;
}

// 左侧主要区域
.main-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  overflow: hidden;
}

// 监控面板
.monitoring-panel {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }
      
      .data-source-info {
        .update-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #67c23a;
          font-size: 12px;
          font-weight: 500;
          
          i {
            animation: spin 2s linear infinite;
          }
        }
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .time-selector {
        padding: 8px 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: white;
        font-size: 13px;
        color: #374151;
        cursor: pointer;
        
        &:hover {
          border-color: #409eff;
        }
      }
      
      .refresh-btn {
        width: 36px;
        height: 36px;
        background: #f9fafb;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: #409eff;
          border-color: #409eff;
          
          i {
            color: white;
          }
        }
        
        i {
          font-size: 16px;
          color: #6b7280;
        }
      }
    }
  }
  
  // 核心指标 - 优化图标背景色
  .metrics-overview {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
    
    .metric-card {
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      border: 1px solid #f0f0f0;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      gap: 14px;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
      }
      
      .metric-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: 1px solid;
        
        // B端配色优化
        &.blue {
          background: #f8fafc;
          color: #2563eb;
          border-color: #e2e8f0;
        }
        
        &.green {
          background: #f8fafc;
          color: #059669;
          border-color: #e2e8f0;
        }
        
        &.orange {
          background: #f8fafc;
          color: #d97706;
          border-color: #e2e8f0;
        }
        
        &.red {
          background: #f8fafc;
          color: #dc2626;
          border-color: #e2e8f0;
        }
        
        i {
          font-size: 20px;
        }
      }
      
      .metric-content {
        flex: 1;
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          
          .metric-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
          }
          
          .metric-trend {
            display: flex;
            align-items: center;
            gap: 3px;
            font-size: 11px;
            font-weight: 600;
            
            &.up {
              color: #67c23a;
            }
            
            &.down {
              color: #f56c6c;
            }
            
            i {
              font-size: 12px;
            }
          }
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }
        
        .metric-subtitle {
          font-size: 11px;
          color: #9ca3af;
        }
      }
    }
  }
  
  // 图表容器
  .charts-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
    
    .chart-box {
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        h4 {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        
        .chart-legend {
          display: flex;
          gap: 12px;
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #6b7280;
            
            .legend-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              
              &.excellent {
                background: #67c23a;
              }
              
              &.good {
                background: #409eff;
              }
              
              &.warning {
                background: #e6a23c;
              }
              
              &.error {
                background: #f56c6c;
              }
              
              &.source {
                background: #67c23a;
              }
              
              &.target {
                background: #909399;
              }
            }
          }
        }
      }
      
      .chart-canvas {
        width: 100%;
        height: 220px;
      }
    }
  }
  
  // 趋势图
  .trend-section {
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }
      
      .trend-tabs {
        display: flex;
        gap: 2px;
        background: #f3f4f6;
        padding: 3px;
        border-radius: 8px;
        
        .trend-tab {
          padding: 8px 16px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          
          &.active {
            background: white;
            color: #409eff;
            font-weight: 600;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          &:hover:not(.active) {
            color: #374151;
          }
        }
      }
    }
    
    .trend-chart {
      width: 100%;
      height: 220px;
    }
  }
}

// 智能分析区域 - 优化图标背景色
.analytics-section {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  margin-bottom: 0;
  
  .analytics-left {
    .analytics-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 24px;
      height: 100%;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      
      .card-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 24px;
        position: relative;
        z-index: 2;
        
        .header-icon {
          width: 52px;
          height: 52px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          
          i {
            font-size: 22px;
          }
        }
        
        .header-text {
          flex: 1;
          
          h3 {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 6px 0;
          }
          
          p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }
        }
      }
      
      .analytics-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 24px;
        position: relative;
        z-index: 2;
        
        .metric-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 10px;
          transition: all 0.3s ease;
          
          &:hover {
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            transform: translateY(-2px);
          }
          
          .metric-icon {
            width: 36px;
            height: 36px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f1f5f9;
            color: #374151;
            border: 1px solid #e2e8f0;
            
            i {
              font-size: 16px;
            }
          }
          
          .metric-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            
            .metric-value {
              font-size: 18px;
              font-weight: 700;
              color: #111827;
            }
            
            .metric-label {
              font-size: 11px;
              color: #6b7280;
            }
          }
        }
      }
      
      .quick-insights {
        position: relative;
        z-index: 2;
        
        .insight-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
          
          i {
            color: #d97706;
            font-size: 18px;
          }
        }
        
        .insight-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .insight-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(64, 158, 255, 0.05);
          border-radius: 8px;
          border-left: 3px solid #409eff;
          
          .insight-text {
            font-size: 12px;
            color: #374151;
            flex: 1;
          }
          
          .insight-action {
            font-size: 11px;
            color: #409eff;
            cursor: pointer;
            font-weight: 600;
            
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
      
      // 装饰背景
      .analytics-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: hidden;
        
        .bg-pattern {
          position: absolute;
          top: 0;
          right: 0;
          width: 200px;
          height: 200px;
          opacity: 0.3;
        }
        
        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          
          .floating-dot {
            position: absolute;
            border-radius: 50%;
            background: linear-gradient(135deg, #409eff, #1d4ed8);
            opacity: 0.1;
            animation: float 6s ease-in-out infinite;
            
            &.dot-1 {
              width: 8px;
              height: 8px;
              top: 20%;
              right: 15%;
              animation-delay: 0s;
            }
            
            &.dot-2 {
              width: 6px;
              height: 6px;
              top: 60%;
              right: 25%;
              animation-delay: 2s;
            }
            
            &.dot-3 {
              width: 10px;
              height: 10px;
              top: 80%;
              right: 10%;
              animation-delay: 4s;
            }
          }
          
          .floating-circuit {
            position: absolute;
            top: 10%;
            right: 5%;
            width: 60px;
            height: 60px;
            opacity: 0.15;
          }
        }
      }
    }
  }
  
  .analytics-right {
    .suggestion-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px;
      height: 100%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      
      .suggestion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        h4 {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        
        .suggestion-count {
          font-size: 12px;
          color: #059669;
          background: #d1fae5;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 600;
        }
      }
      
      .suggestion-list {
        margin-bottom: 16px;
        
        .suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #f3f4f6;
          
          &:last-child {
            border-bottom: none;
          }
          
          .suggestion-icon {
            width: 36px;
            height: 36px;
            background: #f8fafc;
            color: #6b7280;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            
            i {
              font-size: 16px;
            }
          }
          
          .suggestion-text {
            flex: 1;
            
            .suggestion-title {
              font-size: 13px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 4px;
            }
            
            .suggestion-desc {
              font-size: 12px;
              color: #6b7280;
            }
          }
        }
      }
      
      .view-all-suggestions {
        width: 100%;
        padding: 10px 16px;
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        color: #374151;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: linear-gradient(135deg, #409eff, #357abd);
          color: white;
          border-color: #409eff;
        }
      }
    }
  }
}

// 右侧边栏 - 优化图标背景色
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  overflow-y: auto;
}

// 通用组件样式
.widget {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  
  .widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h4 {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .widget-subtitle {
      font-size: 12px;
      color: #6b7280;
    }
  }
}

// 设备概览 - 优化图标背景色
.device-overview {
  .overview-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
    
    .stat-card {
      padding: 18px;
      border-radius: 10px;
      
      &.total {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }
      
      &.online {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }
      
      .stat-value {
        font-size: 22px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }
      
      .stat-change {
        font-size: 11px;
        color: #6b7280;
        font-weight: 500;
        
        &.up {
          color: #67c23a;
        }
      }
    }
  }
  
  .device-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .device-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: linear-gradient(135deg, #fafafa, #f5f5f5);
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, #f5f5f5, #eeeeee);
        transform: translateX(3px);
      }
      
      .device-icon {
        width: 36px;
        height: 36px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        
        // B端统一图标颜色
        &.electric {
          color: #2563eb;
        }
        
        &.water {
          color: #0891b2;
        }
        
        &.hvac {
          color: #059669;
        }
        
        &.lighting {
          color: #d97706;
        }
        
        &.security {
          color: #7c3aed;
        }
        
        &.charging {
          color: #dc2626;
        }
        
        i {
          font-size: 16px;
        }
      }
      
      .device-info {
        flex: 1;
        
        .device-name {
          font-size: 13px;
          color: #111827;
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .device-count {
          font-size: 11px;
          color: #6b7280;
        }
      }
      
      .device-status {
        font-size: 11px;
        font-weight: 600;
        
        &.excellent {
          color: #67c23a;
        }
        
        &.good {
          color: #409eff;
        }
        
        &.warning {
          color: #e6a23c;
        }
      }
    }
  }
}

// 待办组件
.todo-widget {
  .todo-summary {
    .pending-count {
      font-size: 12px;
      color: #f56c6c;
      font-weight: 600;
    }
  }
  
  .todo-list {
    max-height: 280px;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 2px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }
    
    .todo-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.completed {
        opacity: 0.5;
        
        .todo-text {
          text-decoration: line-through;
        }
      }
      
      .todo-check {
        width: 18px;
        height: 18px;
        border: 2px solid #d1d5db;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        margin-top: 1px;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: #409eff;
        }
        
        i {
          font-size: 12px;
          color: #67c23a;
        }
      }
      
      .todo-content {
        flex: 1;
        
        .todo-text {
          font-size: 13px;
          color: #111827;
          line-height: 1.4;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .todo-meta {
          display: flex;
          gap: 8px;
          font-size: 11px;
          
          .todo-category {
            color: #409eff;
            font-weight: 500;
          }
          
          .todo-time {
            color: #9ca3af;
          }
        }
      }
      
      .todo-priority {
        width: 3px;
        height: 20px;
        border-radius: 2px;
        margin-top: 1px;
        
        &.urgent {
          background: #f56c6c;
          animation: pulse 2s infinite;
        }
        
        &.normal {
          background: #e6a23c;
        }
        
        &.low {
          background: #67c23a;
        }
      }
    }
  }
}

// 系统状态
.system-status {
  .widget-header {
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      &.online {
        color: #67c23a;
        
        .dot {
          background: #67c23a;
        }
      }
    }
  }
  
  .status-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    
    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: linear-gradient(135deg, #fafafa, #f5f5f5);
      border-radius: 8px;
      
      .service-name {
        font-size: 13px;
        color: #111827;
        font-weight: 600;
      }
      
      .service-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 600;
        
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        
        &.online {
          color: #67c23a;
          
          .status-dot {
            background: #67c23a;
          }
        }
        
        &.maintenance {
          color: #e6a23c;
          
          .status-dot {
            background: #e6a23c;
          }
        }
      }
    }
  }
}

// 动画
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .metrics-overview {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  .analytics-section {
    grid-template-columns: 1fr !important;
    
    .analytics-right {
      .suggestion-card {
        margin-top: 0;
      }
    }
  }
}

@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  
  .operations-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }
  
  .sidebar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-body {
    padding: 16px;
  }
  
  .demo-badge {
    right: 15px;
    
    .demo-badge-content {
      padding: 10px 14px;
      
      .demo-icon {
        width: 28px;
        height: 28px;
        font-size: 14px;
      }
      
      .demo-text {
        .demo-title {
          font-size: 13px;
        }
        
        .demo-subtitle {
          font-size: 9px;
        }
      }
    }
    
    .demo-tag {
      padding: 6px 10px;
      font-size: 11px;
    }
  }
  
  .operations-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  .charts-container {
    grid-template-columns: 1fr !important;
  }
  
  .sidebar {
    grid-template-columns: 1fr !important;
  }
  
  .analytics-section {
    grid-template-columns: 1fr !important;
    gap: 16px;
  }
}
</style>