<template>
    <div class="sankey-dashboard">
      <!-- 页面标题栏 -->
      <div class="page-header">
        <h1 class="page-title">用电分布分析</h1>
        <div class="header-info">
          <span class="info-text">数据更新时间：{{ lastUpdateTime }}</span>
        </div>
      </div>
  
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
  
  // 新增桑基图API
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
    private: '#52c41a',    // 独立用电 - 绿色
    share: '#faad14'       // 共享用电 - 黄色
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
        lastUpdateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
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
        
        const privateElec = this.sankeyData.nodes.find(n => n.name === '独立用电')?.value || 0
        const shareElec = this.sankeyData.nodes.find(n => n.name === '共享用电')?.value || 0
        const total = privateElec + shareElec
        
        if (total === 0) return []
        
        return [
          { 
            name: '独立用电', 
            value: privateElec, 
            percentage: ((privateElec / total) * 100).toFixed(1), 
            color: NODE_COLORS.private
          },
          { 
            name: '共享用电', 
            value: shareElec, 
            percentage: ((shareElec / total) * 100).toFixed(1), 
            color: NODE_COLORS.share
          }
        ]
      },
      
      legendData() {
        if (!this.sankeyData || !this.sankeyData.nodes) return []
        // 过滤掉总节点和分类节点，只显示租户节点
        return this.sankeyData.nodes
          .filter(node => !['独立用电', '共享用电'].includes(node.name) && !node.name.includes('总用电'))
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
    },
    
    beforeDestroy() {
      window.removeEventListener('resize', this.handleResize)
      
      // 清理图表实例和事件监听
      if (this.$refs.sankeyChart) {
        const chartDom = this.$refs.sankeyChart
        // 移除所有事件监听器
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
          // 默认全选所有租户
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
          // 取消全选
          this.queryParams.tenantIdList = []
        } else {
          // 全选
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
          
          // 处理数据
          this.sankeyData = this.processChartData(data)
          this.lastUpdateTime = moment().format('YYYY-MM-DD HH:mm:ss')
          
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
        // 处理接口返回的数据为ECharts桑基图格式
        console.log('桑基图原始数据:', data)
        
        if (!data) return null
        
        const nodes = []
        const links = []
        const nodeMap = new Map()
        
        // 添加园区总节点
        const totalNodeName = data.managerName || '园区总用电'
        nodes.push({
          name: totalNodeName,
          value: data.managerTotalElec || 0,
          itemStyle: {
            color: NODE_COLORS.total
          }
        })
        nodeMap.set(totalNodeName, true)
        
        // 添加私有用电和共享用电节点
        if (data.privateTotalElec > 0) {
          nodes.push({
            name: '独立用电',
            value: data.privateTotalElec,
            itemStyle: {
              color: NODE_COLORS.private
            }
          })
          links.push({
            source: totalNodeName,
            target: '独立用电',
            value: data.privateTotalElec
          })
        }
        
        if (data.shareTotalElec > 0) {
          nodes.push({
            name: '共享用电',
            value: data.shareTotalElec,
            itemStyle: {
              color: NODE_COLORS.share
            }
          })
          links.push({
            source: totalNodeName,
            target: '共享用电',
            value: data.shareTotalElec
          })
        }
        
        // 处理租户信息
        const tenantElecMap = new Map()
        
        // 从meterUseDtoList中统计各租户独立用电
        if (data.meterUseDtoList && Array.isArray(data.meterUseDtoList)) {
          data.meterUseDtoList.forEach(meter => {
            if (meter.bindType === 1 && meter.bindName) {
              const current = tenantElecMap.get(meter.bindName) || { private: 0, share: 0 }
              current.private += meter.meterElec || 0
              tenantElecMap.set(meter.bindName, current)
            }
          })
        }
        
        // 从shareUseDtoList中统计各租户共享用电
        if (data.shareUseDtoList && Array.isArray(data.shareUseDtoList)) {
          data.shareUseDtoList.forEach(share => {
            if (share.shareTenantDtoList && Array.isArray(share.shareTenantDtoList)) {
              share.shareTenantDtoList.forEach(tenant => {
                const current = tenantElecMap.get(tenant.tenantName) || { private: 0, share: 0 }
                current.share += tenant.tenantShareElec || 0
                tenantElecMap.set(tenant.tenantName, current)
              })
            }
          })
        }
        
        // 添加租户节点和连接
        let colorIndex = 0
        
        tenantElecMap.forEach((elec, tenantName) => {
          const totalElec = elec.private + elec.share
          if (totalElec > 0) {
            // 添加租户节点
            nodes.push({
              name: tenantName,
              value: totalElec,
              itemStyle: {
                color: SOFT_COLORS[colorIndex % SOFT_COLORS.length]
              }
            })
            colorIndex++
            
            // 添加连接
            if (elec.private > 0) {
              links.push({
                source: '独立用电',
                target: tenantName,
                value: elec.private
              })
            }
            
            if (elec.share > 0) {
              links.push({
                source: '共享用电',
                target: tenantName,
                value: elec.share
              })
            }
          }
        })
        
        console.log('处理后的桑基图数据:', { nodes, links })
        return { nodes, links }
      },
      
      getTenantCategory(tenantName) {
        if (tenantName.includes('公共')) return '公共区域'
        if (tenantName.includes('科技')) return '科技企业'
        if (tenantName.includes('咖啡')) return '餐饮'
        return '其他'
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
          // 添加工具栏
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
            formatter: function(params) {
              if (params.dataType === 'node') {
                return `${params.name}<br/>用电量：${params.value.toFixed(2)} kWh`
              } else {
                return `${params.data.source} → ${params.data.target}<br/>流量：${params.value.toFixed(2)} kWh`
              }
            }
          },
          series: [{
            type: 'sankey',
            layout: 'none',
            emphasis: {
              focus: 'adjacency'
            },
            data: this.sankeyData.nodes,
            links: this.sankeyData.links,
            orient: 'horizontal',
            left: 50,
            top: 80,  // 为工具栏留出空间
            right: 150,  // 增加右边距，为租户节点标签留出空间
            bottom: 50,
            nodeWidth: 20,
            nodeGap: 12,
            layoutIterations: 0,
            draggable: false,  // 禁用节点拖拽
            focusNodeAdjacency: true,  // 鼠标悬停时高亮相关节点和边
            lineStyle: {
              color: 'gradient',
              opacity: 0.5,  // 降低透明度，使颜色更柔和
              curveness: 0.5
            },
            label: {
              position: 'right',
              fontSize: 13,
              color: '#666',
              overflow: 'truncate',  // 文字过长时截断
              width: 120  // 限制标签宽度
            },
            itemStyle: {
              borderWidth: 0
            }
          }]
        }
        
        this.sankeyChartInstance.setOption(option)
        
        // 启用图表平移功能
        this.enableChartPanning()
      },
      
      // 新增方法：启用图表平移
      enableChartPanning() {
        if (!this.sankeyChartInstance) return
        
        let isDragging = false
        let startX = 0
        let startY = 0
        
        const chartDom = this.$refs.sankeyChart
        
        // 鼠标按下事件
        chartDom.addEventListener('mousedown', (e) => {
          if (e.button === 0) { // 左键
            isDragging = true
            startX = e.clientX
            startY = e.clientY
            chartDom.style.cursor = 'grabbing'
            e.preventDefault()
          }
        })
        
        // 鼠标移动事件
        chartDom.addEventListener('mousemove', (e) => {
          if (isDragging) {
            const deltaX = e.clientX - startX
            const deltaY = e.clientY - startY
            
            // 获取当前的配置
            const option = this.sankeyChartInstance.getOption()
            const series = option.series[0]
            
            // 更新位置
            series.left = (parseInt(series.left) || 50) + deltaX
            series.top = (parseInt(series.top) || 80) + deltaY
            series.right = (parseInt(series.right) || 150) - deltaX
            series.bottom = (parseInt(series.bottom) || 50) - deltaY
            
            // 应用新配置
            this.sankeyChartInstance.setOption({
              series: [series]
            })
            
            startX = e.clientX
            startY = e.clientY
          }
        })
        
        // 鼠标释放事件
        chartDom.addEventListener('mouseup', () => {
          isDragging = false
          chartDom.style.cursor = 'grab'
        })
        
        // 鼠标离开事件
        chartDom.addEventListener('mouseleave', () => {
          isDragging = false
          chartDom.style.cursor = 'grab'
        })
        
        // 设置默认光标
        chartDom.style.cursor = 'grab'
      },
      
      updateTreeChart() {
        if (!this.treeChartInstance || !this.sankeyData) return
        
        // 将桑基图数据转换为树状图数据
        const treeData = this.convertToTreeData(this.sankeyData)
        
        const option = {
          tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#ddd',
            borderWidth: 1,
            formatter: '{b}<br/>用电量：{c} kWh'
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
        // 转换数据格式
        const root = {
          name: sankeyData.nodes[0].name,
          value: sankeyData.nodes[0].value,
          children: []
        }
        
        // 构建树形结构
        const categoryNodes = {}
        
        sankeyData.links.forEach(link => {
          if (link.source === root.name) {
            // 第一层：独立用电、共享用电
            const categoryNode = {
              name: link.target,
              value: link.value,
              children: []
            }
            categoryNodes[link.target] = categoryNode
            root.children.push(categoryNode)
          }
        })
        
        // 第二层：各租户
        sankeyData.links.forEach(link => {
          if (categoryNodes[link.source]) {
            categoryNodes[link.source].children.push({
              name: link.target,
              value: link.value
            })
          }
        })
        
        return root
      },
      
      switchViewMode(mode) {
        this.viewMode = mode
        this.$nextTick(() => {
          this.updateCharts()
          this.handleResize()
        })
      },
      
      handleDateChange() {
        // 日期改变时自动查询
        if (this.queryParams.tenantIdList.length > 0) {
          this.handleQuery()
        }
      },
      
      handleTenantChange() {
        // 租户改变时的处理
      },
      
      handleReset() {
        this.queryParams.queryDate = moment().subtract(1, 'days').format('YYYY-MM-DD')
        // 重置时默认全选
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
        // 导出数据逻辑
        this.$message.info('数据导出功能开发中')
      },
      
      handleResize() {
        if (this.sankeyChartInstance) {
          this.sankeyChartInstance.resize()
        }
        if (this.treeChartInstance) {
          this.treeChartInstance.resize()
        }
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
      },
      
      getCategoryType(category) {
        const typeMap = {
          '公共区域': 'info',
          '科技企业': 'primary',
          '餐饮': 'warning',
          '其他': 'success'
        }
        return typeMap[category] || 'info'
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
  
  // 页面标题栏
  .page-header {
    background: #fff;
    padding: 16px 24px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .page-title {
    font-size: 18px;
    font-weight: 500;
    color: #1c1c1c;
    margin: 0;
  }
  
  .header-info {
    font-size: 12px;
    color: #8c8c8c;
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
    gap: 12px;  // 减小间距
    
    .chart-tips {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #999;
      margin-right: 8px;  // 与按钮组保持适当距离
      
      .el-icon-info {
        font-size: 14px;
        color: #1890ff;
      }
    }
    
    ::v-deep .el-button-group {
      display: inline-flex;
      
      .el-button {
        padding: 5px 12px;  // 调整按钮内边距
        font-size: 12px;
        margin: 0;  // 确保按钮之间无额外间距
        
        &:not(:last-child) {
          border-right: none;  // 确保按钮组边框正确显示
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
    min-height: 600px;
    overflow: hidden;  // 防止内容溢出
    
    // 添加抓手光标样式
    &:hover {
      cursor: grab;
    }
    
    &:active {
      cursor: grabbing;
    }
  }
  
  .sankey-chart,
  .tree-chart {
    width: 100%;
    height: 600px;
    position: relative;
    user-select: none;  // 禁止选中文字
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
    
    .el-tag {
      font-size: 12px;
      padding: 0 8px;
      height: 22px;
      line-height: 20px;
      
      &--primary {
        background: #e6f7ff;
        border-color: #91d5ff;
        color: #1890ff;
      }
      
      &--success {
        background: #f6ffed;
        border-color: #b7eb8f;
        color: #52c41a;
      }
      
      &--warning {
        background: #fffbe6;
        border-color: #ffe58f;
        color: #faad14;
      }
      
      &--info {
        background: #f0f0f0;
        border-color: #d9d9d9;
        color: #666;
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
      min-height: 500px;
    }
    
    .sankey-chart,
    .tree-chart {
      height: 500px;
    }
  }
  
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .overview-cards {
      grid-template-columns: 1fr;
    }
    
    .chart-container {
      margin: 12px;
    }
    
    .chart-content {
      padding: 12px;
      min-height: 400px;
    }
    
    .sankey-chart,
    .tree-chart {
      height: 400px;
    }
    
    .chart-legend {
      flex-direction: column;
      gap: 12px;
    }
  }
  </style>