<template>
  <div class="sankey-dashboard">
    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="查询日期">
          <el-date-picker
            v-model="queryParams.queryDate"
            type="date"
            placeholder="选择日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            :picker-options="datePickerOptions"
            @change="handleDateChange"
          />
        </el-form-item>
        
        <el-form-item label="租户范围">
          <el-select
            v-model="queryParams.tenantIdList"
            multiple
            collapse-tags
            :collapse-tags-tooltip="true"
            filterable
            placeholder="请选择租户"
            class="tenant-selector"
            :loading="tenantLoading"
            @change="handleTenantChange"
          >
            <el-option
              v-for="tenant in tenantList"
              :key="tenant.tenantId"
              :label="tenant.name"
              :value="tenant.tenantId"
            >
              <span class="tenant-option">
                <span class="tenant-name">{{ tenant.name }}</span>
                <span class="tenant-code">{{ tenant.code }}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleQuery" :loading="loading">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button v-if="tenantList.length > 0" @click="handleSelectAll">
            {{ isAllSelected ? '取消全选' : '全选' }}
          </el-button>
          <el-dropdown trigger="click" class="export-dropdown">
            <el-button type="text">
              更多操作
              <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleExportImage">导出图表</el-dropdown-item>
              <el-dropdown-item @click.native="handleExportData">导出数据</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards" v-if="sankeyData && !loading">
      <div class="overview-card">
        <div class="card-header">
          <span class="card-title">总用电量</span>
          <el-tooltip content="所有租户当日总用电量" placement="top">
            <i class="el-icon-question"></i>
          </el-tooltip>
        </div>
        <div class="card-value">
          <span class="value-number">{{ formatNumber(totalElectricity) }}</span>
          <span class="value-unit">kWh</span>
        </div>
        <div class="card-footer">
          <span class="trend" :class="getTrendClass(electricityTrend)">
            <i :class="getTrendIcon(electricityTrend)"></i>
            {{ Math.abs(electricityTrend) }}%
          </span>
          <span class="trend-text">较昨日</span>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-header">
          <span class="card-title">租户数量</span>
        </div>
        <div class="card-value">
          <span class="value-number">{{ activeTenantsCount }}</span>
          <span class="value-unit">户</span>
        </div>
        <div class="card-footer">
          <span class="sub-info">活跃租户</span>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-header">
          <span class="card-title">平均用电</span>
        </div>
        <div class="card-value">
          <span class="value-number">{{ formatNumber(avgElectricity) }}</span>
          <span class="value-unit">kWh/户</span>
        </div>
        <div class="card-footer">
          <span class="sub-info">单户日均</span>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-header">
          <span class="card-title">用电分布</span>
        </div>
        <div class="card-value">
          <div class="distribution-bar">
            <div 
              v-for="(item, index) in distributionData" 
              :key="index"
              class="bar-segment"
              :style="{
                width: item.percentage + '%',
                backgroundColor: item.color
              }"
              :title="`${item.name}: ${item.value}kWh (${item.percentage}%)`"
            ></div>
          </div>
        </div>
        <div class="card-footer">
          <span class="sub-info">按类型分布</span>
        </div>
      </div>
    </div>

    <!-- 主图表区域 -->
    <div class="chart-container" v-loading="loading" element-loading-text="数据加载中...">
      <div class="chart-header" v-if="!loading && sankeyData">
        <div class="chart-title-group">
          <h2 class="chart-title">用电流向分析</h2>
          <p class="chart-subtitle">{{ queryParams.queryDate }} 租户用电分布桑基图</p>
        </div>
        <div class="chart-tools">
          <div class="chart-tips">
            <i class="el-icon-info"></i>
            <span>提示：可使用鼠标拖拽移动图表</span>
          </div>
          <el-button-group size="mini">
            <el-button 
              :type="viewMode === 'sankey' ? 'primary' : 'default'"
              @click="switchViewMode('sankey')"
              style="margin-right: 10px;"
            >
              桑基图
            </el-button>
            <el-button 
              :type="viewMode === 'tree' ? 'primary' : 'default'"
              @click="switchViewMode('tree')"
            >
              树状图
            </el-button>
          </el-button-group>
        </div>
      </div>
      
      <div class="chart-content">
        <div ref="sankeyChart" class="sankey-chart" v-show="viewMode === 'sankey'"></div>
        <div ref="treeChart" class="tree-chart" v-show="viewMode === 'tree'"></div>
      </div>
      
      <!-- 图例说明 -->
      <div class="chart-legend" v-if="!loading && sankeyData">
        <div class="legend-item" v-for="(item, index) in legendData" :key="index">
          <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
          <span class="legend-label">{{ item.name }}</span>
          <span class="legend-value">{{ formatNumber(item.value) }} kWh</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getSimpleTenantList } from '@/api/useReport'
import request from '@/utils/request'
import moment from 'moment'

// 桑基图API
export function queryTenantSankey(data) {
  return request({
    url: '/api/ebc-content/useReport/queryTenantSankey',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 定义柔和的颜色方案
const SOFT_COLORS = [
  '#5B8FF9', // 柔和蓝
  '#61DDAA', // 柔和绿
  '#65789B', // 柔和灰蓝
  '#F6BD16', // 柔和黄
  '#7262FD', // 柔和紫
  '#78D3F8', // 柔和天蓝
  '#9661BC', // 柔和紫罗兰
  '#F6903D', // 柔和橙
  '#008685', // 柔和青
  '#F08BB4'  // 柔和粉
]

const NODE_COLORS = {
  total: '#1890ff',      // 总用电 - 主色调蓝
  private: '#52c41a',    // 专用设备 - 绿色
  share: '#faad14'       // 公摊设备 - 黄色
}

export default {
  name: 'ElectricitySankeyChart',
  
  data() {
    return {
      queryParams: {
        queryDate: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        tenantIdList: []
      },
      tenantList: [],
      tenantLoading: false,
      loading: false,
      sankeyData: null,
      viewMode: 'sankey',
      sankeyChartInstance: null,
      treeChartInstance: null,
      resizeObserver: null,
      datePickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now()
        },
        shortcuts: [{
          text: '昨天',
          onClick(picker) {
            picker.$emit('pick', moment().subtract(1, 'days').toDate())
          }
        }, {
          text: '前天',
          onClick(picker) {
            picker.$emit('pick', moment().subtract(2, 'days').toDate())
          }
        }, {
          text: '本周一',
          onClick(picker) {
            picker.$emit('pick', moment().startOf('week').add(1, 'days').toDate())
          }
        }]
      }
    }
  },
  
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    
    isAllSelected() {
      return this.tenantList.length > 0 && 
             this.queryParams.tenantIdList.length === this.tenantList.length
    },
    
    totalElectricity() {
      if (!this.sankeyData) return 0
      
      // 从第一个节点获取总电量（园区总用电节点）
      if (this.sankeyData.nodes && this.sankeyData.nodes.length > 0) {
        return this.sankeyData.nodes[0].value || 0
      }
      
      return 0
    },
    
    activeTenantsCount() {
      return this.queryParams.tenantIdList.length
    },
    
    avgElectricity() {
      if (this.activeTenantsCount === 0) return 0
      return this.totalElectricity / this.activeTenantsCount
    },
    
    electricityTrend() {
      // 模拟趋势数据，实际应从接口获取
      return Math.random() > 0.5 ? 5.2 : -3.8
    },
    
    distributionData() {
      // 根据实际数据计算分布
      if (!this.sankeyData || !this.sankeyData.nodes) return []
      
      const privateElec = this.sankeyData.nodes.find(n => n.name === '专用设备')?.value || 0
      const shareElec = this.sankeyData.nodes.find(n => n.name === '公摊设备')?.value || 0
      const total = privateElec + shareElec
      
      if (total === 0) return []
      
      const result = []
      if (privateElec > 0) {
        result.push({ 
          name: '专用设备', 
          value: privateElec, 
          percentage: ((privateElec / total) * 100).toFixed(1), 
          color: NODE_COLORS.private
        })
      }
      if (shareElec > 0) {
        result.push({ 
          name: '公摊设备', 
          value: shareElec, 
          percentage: ((shareElec / total) * 100).toFixed(1), 
          color: NODE_COLORS.share
        })
      }
      
      return result
    },
    
    legendData() {
      if (!this.sankeyData || !this.sankeyData.nodes) return []
      // 过滤掉总节点和分类节点，只显示租户节点
      return this.sankeyData.nodes
        .filter(node => !['专用设备', '公摊设备'].includes(node.name) && !node.name.includes('总用电'))
        .slice(0, 5)
        .map((node, index) => ({
          name: node.name,
          value: node.value,
          color: node.itemStyle?.color || this.getNodeColor(index)
        }))
    }
  },
  
  watch: {
    currentManagerId: {
      handler(val) {
        if (val) {
          this.initializeData()
        }
      },
      immediate: true
    }
  },
  
  mounted() {
    window.addEventListener('resize', this.handleResize)
    
    this.$nextTick(() => {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.handleResize)
        const chartContainer = this.$el.querySelector('.chart-container')
        if (chartContainer) {
          this.resizeObserver.observe(chartContainer)
        }
      }
      
      this.$bus && this.$bus.$on('menu-collapse', this.handleMenuToggle)
      this.$root.$on && this.$root.$on('sidebar-collapse', this.handleMenuToggle)
    })
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    
    this.$bus && this.$bus.$off('menu-collapse', this.handleMenuToggle)
    this.$root.$off && this.$root.$off('sidebar-collapse', this.handleMenuToggle)
    
    if (this.$refs.sankeyChart) {
      const chartDom = this.$refs.sankeyChart
      chartDom.removeEventListener('mousedown', this.handleMouseDown)
      chartDom.removeEventListener('mousemove', this.handleMouseMove)
      chartDom.removeEventListener('mouseup', this.handleMouseUp)
      chartDom.removeEventListener('mouseleave', this.handleMouseLeave)
    }
    
    if (this.sankeyChartInstance) {
      this.sankeyChartInstance.dispose()
    }
    if (this.treeChartInstance) {
      this.treeChartInstance.dispose()
    }
  },
  
  methods: {
    async initializeData() {
      await this.getTenantList()
      if (this.tenantList.length > 0) {
        this.queryParams.tenantIdList = this.tenantList.map(item => item.tenantId)
      }
      this.handleQuery()
    },
    
    async getTenantList() {
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0
        })
        this.tenantList = data || []
      } catch (error) {
        this.$message.error('获取租户列表失败')
        console.error('获取租户列表失败:', error)
      } finally {
        this.tenantLoading = false
      }
    },
    
    handleSelectAll() {
      if (this.isAllSelected) {
        this.queryParams.tenantIdList = []
      } else {
        this.queryParams.tenantIdList = this.tenantList.map(item => item.tenantId)
      }
    },
    
    async handleQuery() {
      if (!this.queryParams.queryDate) {
        this.$message.warning('请选择查询日期')
        return
      }
      
      if (this.queryParams.tenantIdList.length === 0) {
        this.$message.warning('请选择租户')
        return
      }
      
      this.loading = true
      try {
        const params = {
          managerId: this.currentManagerId,
          tenantIdList: this.queryParams.tenantIdList,
          queryDate: this.queryParams.queryDate
        }
        const response = await queryTenantSankey(params)
        const data = response.data || response
        
        this.sankeyData = this.processChartData(data)
        
        this.$nextTick(() => {
          this.initializeCharts()
          this.updateCharts()
        })
      } catch (error) {
        this.$message.error('获取数据失败')
        console.error('获取桑基图数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    processChartData(data) {
      console.log('桑基图原始数据:', data)
      
      if (!data) return null
      
      const nodes = []
      const links = []
      
      // 第1层：添加园区总节点
      const totalNodeName = data.managerName || '园区总用电'
      nodes.push({
        name: totalNodeName,
        id: 'total_node',
        value: data.managerTotalElec || 0,
        itemStyle: {
          color: NODE_COLORS.total
        }
      })
      
      // 第2层：添加专用设备和公摊设备节点
      const hasPrivate = data.privateTotalElec > 0
      const hasShare = data.shareTotalElec > 0
      
      if (hasPrivate) {
        nodes.push({
          name: '专用设备',
          id: 'private_node',
          value: data.privateTotalElec,
          itemStyle: {
            color: NODE_COLORS.private
          }
        })
        links.push({
          source: 'total_node',
          target: 'private_node',
          value: data.privateTotalElec
        })
      }
      
      if (hasShare) {
        nodes.push({
          name: '公摊设备',
          id: 'share_node',
          value: data.shareTotalElec,
          itemStyle: {
            color: NODE_COLORS.share
          }
        })
        links.push({
          source: 'total_node',
          target: 'share_node',
          value: data.shareTotalElec
        })
      }
      
      // 处理租户信息 - 使用Map存储每个租户的专用和公摊用电
      const tenantMap = new Map()
      
      // 初始化所有租户（从tenantInfoDtoList）
      if (data.tenantInfoDtoList && Array.isArray(data.tenantInfoDtoList)) {
        data.tenantInfoDtoList.forEach(tenant => {
          tenantMap.set(tenant.tenantId, {
            tenantId: tenant.tenantId,
            tenantName: tenant.tenantName,
            privateElec: 0,
            privateDevices: [],
            shareElec: 0,
            shareDevices: []
          })
        })
      }
      
      // 第3层：处理专用设备电表数据（bindType = 1）
      if (data.meterUseDtoList && Array.isArray(data.meterUseDtoList)) {
        data.meterUseDtoList.forEach(meter => {
          if (meter.bindType === 1 && meter.bindId) {
            const tenantData = tenantMap.get(meter.bindId)
            if (tenantData) {
              tenantData.privateElec += meter.meterElec || 0
              // 只添加有用电量的设备
              if (meter.meterElec > 0) {
                tenantData.privateDevices.push({
                  meterId: meter.meterId,
                  meterName: meter.meterName,
                  meterElec: meter.meterElec
                })
              }
            }
          }
        })
      }
      
      // 处理公摊设备分摊数据
      if (data.shareUseDtoList && Array.isArray(data.shareUseDtoList)) {
        data.shareUseDtoList.forEach(share => {
          if (share.shareTenantDtoList && Array.isArray(share.shareTenantDtoList)) {
            share.shareTenantDtoList.forEach(tenantShare => {
              const tenantData = tenantMap.get(tenantShare.tenantId)
              if (tenantData && tenantShare.tenantShareElec > 0) {
                tenantData.shareElec += tenantShare.tenantShareElec
                tenantData.shareDevices.push({
                  shareId: share.shareId,
                  shareName: share.shareName || '公摊设备',
                  shareElec: tenantShare.tenantShareElec
                })
              }
            })
          }
        })
      }
      
      // 添加租户节点和设备节点
      let colorIndex = 0
      let deviceColorIndex = 0
      
      tenantMap.forEach((tenantData, tenantId) => {
        const totalTenantElec = tenantData.privateElec + tenantData.shareElec
        
        // 只要租户有任何用电（专用或公摊），就显示
        if (totalTenantElec > 0) {
          const tenantColor = SOFT_COLORS[colorIndex % SOFT_COLORS.length]
          const tenantNodeId = `tenant_${tenantId}`
          colorIndex++
          
          nodes.push({
            name: tenantData.tenantName,
            id: tenantNodeId,
            value: totalTenantElec,
            itemStyle: {
              color: tenantColor
            }
          })
          
          // 连接专用设备到租户
          if (tenantData.privateElec > 0 && hasPrivate) {
            links.push({
              source: 'private_node',
              target: tenantNodeId,
              value: tenantData.privateElec
            })
          }
          
          // 连接公摊设备到租户
          if (tenantData.shareElec > 0 && hasShare) {
            links.push({
              source: 'share_node',
              target: tenantNodeId,
              value: tenantData.shareElec
            })
          }
          
          // 第4层：添加专用设备节点
          tenantData.privateDevices.forEach(device => {
            const deviceId = `device_private_${device.meterId}`
            const deviceColor = SOFT_COLORS[(colorIndex + deviceColorIndex) % SOFT_COLORS.length]
            deviceColorIndex++
            
            nodes.push({
              name: device.meterName,
              id: deviceId,
              value: device.meterElec,
              itemStyle: {
                color: deviceColor,
                opacity: 0.85
              }
            })
            
            links.push({
              source: tenantNodeId,
              target: deviceId,
              value: device.meterElec
            })
          })
          
          // 第4层：添加公摊设备节点（如果有）
          tenantData.shareDevices.forEach(device => {
            const deviceId = `device_share_${device.shareId}_${tenantId}`
            const deviceColor = SOFT_COLORS[(colorIndex + deviceColorIndex) % SOFT_COLORS.length]
            deviceColorIndex++
            
            nodes.push({
              name: `${device.shareName}(分摊)`,
              id: deviceId,
              value: device.shareElec,
              itemStyle: {
                color: deviceColor,
                opacity: 0.85
              }
            })
            
            links.push({
              source: tenantNodeId,
              target: deviceId,
              value: device.shareElec
            })
          })
        }
      })
      
      console.log('处理后的桑基图数据:', { 
        总节点数: nodes.length, 
        连接数: links.length,
        租户数: Array.from(tenantMap.values()).filter(t => t.privateElec + t.shareElec > 0).length
      })
      
      return { nodes, links }
    },
    
    initializeCharts() {
      if (this.$refs.sankeyChart) {
        this.sankeyChartInstance = this.$echarts.init(this.$refs.sankeyChart)
      }
      if (this.$refs.treeChart) {
        this.treeChartInstance = this.$echarts.init(this.$refs.treeChart)
      }
    },
    
    updateCharts() {
      if (this.viewMode === 'sankey') {
        this.updateSankeyChart()
      } else {
        this.updateTreeChart()
      }
    },
    
    updateSankeyChart() {
      if (!this.sankeyChartInstance || !this.sankeyData) return
      
      const option = {
        toolbox: {
          show: true,
          orient: 'horizontal',
          right: 20,
          top: 20,
          feature: {
            restore: {
              show: true,
              title: '还原'
            },
            saveAsImage: {
              show: true,
              title: '保存为图片',
              pixelRatio: 2
            }
          }
        },
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ddd',
          borderWidth: 1,
          padding: [10, 15],
          textStyle: {
            color: '#333',
            fontSize: 13
          },
          formatter: (params) => {
            if (params.dataType === 'node') {
              const node = this.sankeyData.nodes.find(n => n.id === params.name)
              const displayName = node ? node.name : params.name
              const value = params.value || 0
              return `<div style="font-weight: 600; margin-bottom: 6px;">${displayName}</div><div>用电量：${value.toFixed(2)} kWh</div>`
            } else {
              const sourceNode = this.sankeyData.nodes.find(n => n.id === params.data.source)
              const targetNode = this.sankeyData.nodes.find(n => n.id === params.data.target)
              const sourceName = sourceNode ? sourceNode.name : params.data.source
              const targetName = targetNode ? targetNode.name : params.data.target
              const value = params.value || 0
              return `<div style="margin-bottom: 4px;">${sourceName} → ${targetName}</div><div>用电量：${value.toFixed(2)} kWh</div>`
            }
          }
        },
        series: [{
          type: 'sankey',
          layout: 'none',
          emphasis: {
            focus: 'adjacency'
          },
          data: this.sankeyData.nodes.map(node => ({
            name: node.id,
            value: node.value,
            itemStyle: node.itemStyle
          })),
          links: this.sankeyData.links,
          orient: 'horizontal',
          left: 50,
          top: 80,
          right: 180,
          bottom: 50,
          nodeWidth: 20,
          nodeGap: 12,
          layoutIterations: 32,
          draggable: false,
          focusNodeAdjacency: true,
          lineStyle: {
            color: 'gradient',
            opacity: 0.5,
            curveness: 0.5
          },
          label: {
            show: true,
            position: 'right',
            fontSize: 12,
            color: '#666',
            formatter: (params) => {
              const node = this.sankeyData.nodes.find(n => n.id === params.name)
              if (node) {
                // 完整显示，不截断
                return node.name
              }
              return params.name
            }
          },
          itemStyle: {
            borderWidth: 0
          }
        }]
      }
      
      this.sankeyChartInstance.setOption(option)
      this.enableChartPanning()
    },
    
    enableChartPanning() {
      if (!this.sankeyChartInstance) return
      
      let isDragging = false
      let startX = 0
      let startY = 0
      
      const chartDom = this.$refs.sankeyChart
      
      chartDom.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          isDragging = true
          startX = e.clientX
          startY = e.clientY
          chartDom.style.cursor = 'grabbing'
          e.preventDefault()
        }
      })
      
      chartDom.addEventListener('mousemove', (e) => {
        if (isDragging) {
          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY
          
          const option = this.sankeyChartInstance.getOption()
          const series = option.series[0]
          
          series.left = (parseInt(series.left) || 50) + deltaX
          series.top = (parseInt(series.top) || 80) + deltaY
          series.right = (parseInt(series.right) || 150) - deltaX
          series.bottom = (parseInt(series.bottom) || 50) - deltaY
          
          this.sankeyChartInstance.setOption({
            series: [series]
          })
          
          startX = e.clientX
          startY = e.clientY
        }
      })
      
      chartDom.addEventListener('mouseup', () => {
        isDragging = false
        chartDom.style.cursor = 'grab'
      })
      
      chartDom.addEventListener('mouseleave', () => {
        isDragging = false
        chartDom.style.cursor = 'grab'
      })
      
      chartDom.style.cursor = 'grab'
    },
    
    updateTreeChart() {
      if (!this.treeChartInstance || !this.sankeyData) return
      
      const treeData = this.convertToTreeData(this.sankeyData)
      
      const option = {
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ddd',
          borderWidth: 1,
          formatter: (params) => {
            const value = params.value || 0
            return `<div style="font-weight: 600; margin-bottom: 6px;">${params.name}</div><div>用电量：${value.toFixed(2)} kWh</div>`
          }
        },
        series: [{
          type: 'tree',
          data: [treeData],
          top: '5%',
          left: '10%',
          bottom: '5%',
          right: '20%',
          symbolSize: 10,
          orient: 'horizontal',
          label: {
            position: 'left',
            verticalAlign: 'middle',
            align: 'right',
            fontSize: 12,
            color: '#666'
          },
          leaves: {
            label: {
              position: 'right',
              verticalAlign: 'middle',
              align: 'left'
            }
          },
          expandAndCollapse: true,
          animationDuration: 550,
          animationDurationUpdate: 750
        }]
      }
      
      this.treeChartInstance.setOption(option)
    },
    
    convertToTreeData(sankeyData) {
      const buildTree = (nodeId) => {
        const node = sankeyData.nodes.find(n => n.id === nodeId)
        if (!node) return null
        
        const treeNode = {
          name: node.name,
          value: node.value,
          itemStyle: node.itemStyle
        }
        
        const children = sankeyData.links
          .filter(link => link.source === nodeId)
          .map(link => buildTree(link.target))
          .filter(Boolean)
        
        if (children.length > 0) {
          treeNode.children = children
        }
        
        return treeNode
      }
      
      return buildTree('total_node')
    },
    
    switchViewMode(mode) {
      this.viewMode = mode
      this.$nextTick(() => {
        this.updateCharts()
        this.handleResize()
      })
    },
    
    handleDateChange() {
      if (this.queryParams.tenantIdList.length > 0) {
        this.handleQuery()
      }
    },
    
    handleTenantChange() {
      // 租户改变时的处理
    },
    
    handleReset() {
      this.queryParams.queryDate = moment().subtract(1, 'days').format('YYYY-MM-DD')
      this.queryParams.tenantIdList = this.tenantList.map(item => item.tenantId)
      this.handleQuery()
    },
    
    handleExportImage() {
      if (this.viewMode === 'sankey' && this.sankeyChartInstance) {
        const url = this.sankeyChartInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff'
        })
        const link = document.createElement('a')
        link.href = url
        link.download = `用电桑基图_${this.queryParams.queryDate}.png`
        link.click()
      }
    },
    
    handleExportData() {
      this.$message.info('数据导出功能开发中')
    },
    
    handleResize() {
      this.$nextTick(() => {
        if (this.sankeyChartInstance) {
          this.sankeyChartInstance.resize()
        }
        if (this.treeChartInstance) {
          this.treeChartInstance.resize()
        }
      })
    },
    
    handleMenuToggle() {
      setTimeout(() => {
        this.handleResize()
      }, 300)
    },
    
    formatNumber(num) {
      if (!num && num !== 0) return '0'
      if (num >= 10000) {
        return (num / 10000).toFixed(2) + 'w'
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'k'
      }
      return num.toFixed(2)
    },
    
    getNodeColor(index) {
      return SOFT_COLORS[index % SOFT_COLORS.length]
    },
    
    getTrendClass(trend) {
      return trend > 0 ? 'trend-up' : 'trend-down'
    },
    
    getTrendIcon(trend) {
      return trend > 0 ? 'el-icon-top' : 'el-icon-bottom'
    }
  }
}
</script>

<style lang="scss" scoped>
.sankey-dashboard {
  padding: 0;
  background: #f5f6f8;
  min-height: 100vh;
}

// 筛选区域
.filter-section {
  background: #fff;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-form {
  .el-form-item {
    margin-bottom: 0;
    margin-right: 24px;
    
    &:last-child {
      margin-right: 0;
    }
  }
  
  ::v-deep .el-form-item__label {
    font-size: 13px;
    color: #666;
    font-weight: normal;
  }
}

.tenant-selector {
  width: 320px;
}

.tenant-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  .tenant-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .tenant-code {
    font-size: 12px;
    color: #999;
    margin-left: 12px;
  }
}

.export-dropdown {
  margin-left: 12px;
}

// 数据概览卡片
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #e8e8e8;
  margin-top: 1px;
}

.overview-card {
  background: #fff;
  padding: 20px 24px;
  
  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .card-title {
      font-size: 13px;
      color: #666;
      font-weight: normal;
    }
    
    .el-icon-question {
      font-size: 14px;
      color: #bfbfbf;
      margin-left: 6px;
      cursor: pointer;
    }
  }
  
  .card-value {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;
    
    .value-number {
      font-size: 28px;
      font-weight: 500;
      color: #1c1c1c;
      line-height: 1;
    }
    
    .value-unit {
      font-size: 14px;
      color: #8c8c8c;
      margin-left: 6px;
    }
  }
  
  .card-footer {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #8c8c8c;
    
    .trend {
      display: inline-flex;
      align-items: center;
      font-weight: 500;
      margin-right: 6px;
      
      &.trend-up {
        color: #f5222d;
      }
      
      &.trend-down {
        color: #52c41a;
      }
      
      i {
        font-size: 12px;
        margin-right: 2px;
      }
    }
    
    .sub-info {
      color: #999;
    }
  }
  
  .distribution-bar {
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: #f5f5f5;
    
    .bar-segment {
      transition: all 0.3s;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
}

// 图表容器
.chart-container {
  background: #fff;
  margin: 24px;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.chart-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title-group {
  .chart-title {
    font-size: 16px;
    font-weight: 500;
    color: #1c1c1c;
    margin: 0 0 4px 0;
  }
  
  .chart-subtitle {
    font-size: 13px;
    color: #8c8c8c;
    margin: 0;
  }
}

.chart-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .chart-tips {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #999;
    margin-right: 8px;
    
    .el-icon-info {
      font-size: 14px;
      color: #1890ff;
    }
  }
  
  ::v-deep .el-button-group {
    display: inline-flex;
    
    .el-button {
      padding: 5px 12px;
      font-size: 12px;
      margin: 0;
      
      &:not(:last-child) {
        border-right: none;
      }
      
      &:first-child {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
      
      &:last-child {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }
  }
}

.chart-content {
  position: relative;
  padding: 24px;
  min-height: 800px;
}

.sankey-chart,
.tree-chart {
  width: 100%;
  height: 800px;
  position: relative;
}

.chart-legend {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
  
  .legend-label {
    color: #666;
  }
  
  .legend-value {
    color: #1c1c1c;
    font-weight: 500;
  }
}

// Element UI 组件样式覆盖
::v-deep {
  .el-select {
    .el-input__inner {
      font-size: 13px;
    }
  }
  
  .el-date-editor {
    .el-input__inner {
      font-size: 13px;
    }
    
    &.el-input {
      width: 160px;
    }
  }
  
  .el-button {
    font-size: 13px;
    
    &--primary {
      background: #1890ff;
      border-color: #1890ff;
      
      &:hover {
        background: #40a9ff;
        border-color: #40a9ff;
      }
    }
    
    &--default {
      &:hover {
        color: #1890ff;
        border-color: #1890ff;
      }
    }
  }
  
  .el-loading-mask {
    background-color: rgba(255, 255, 255, 0.95);
  }
  
  .el-loading-spinner {
    .el-loading-text {
      color: #666;
      font-size: 13px;
    }
  }
}

// 响应式设计
@media (max-width: 1680px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1280px) {
  .filter-form {
    .el-form-item {
      margin-bottom: 12px;
    }
  }
  
  .tenant-selector {
    width: 280px;
  }
  
  .chart-content {
    min-height: 600px;
  }
  
  .sankey-chart,
  .tree-chart {
    height: 600px;
  }
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    margin: 12px;
  }
  
  .chart-content {
    padding: 12px;
    min-height: 500px;
  }
  
  .sankey-chart,
  .tree-chart {
    height: 500px;
  }
  
  .chart-legend {
    flex-direction: column;
    gap: 12px;
  }
}
</style>