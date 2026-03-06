<template>
  <div class="top-statistic" v-loading="loading">
    <!-- 顶部统计卡片 (非电表节点时显示) -->
    <div class="stat-section" v-show="!checkedNode.subType">
      <div class="stat-cards">
        <div class="stat-card" v-for="(item, index) in statCards" :key="index">
          <div class="stat-icon">
            <img :src="item.imgSrc" alt="" class="icon-img" />
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value">{{ formatNumber(item.value) }}</div>
          </div>
        </div>
      </div>
      
      <!-- 饼图区域 -->
      <div class="pie-section">
        <el-button type="text" class="sankey-btn" @click="goToSankey">
          查看桑基图 <i class="el-icon-arrow-right"></i>
        </el-button>
        <div ref="pieChart" class="pie-chart"></div>
      </div>
    </div>

    <!-- 柱状图/折线图 -->
    <div class="chart-section">
      <div ref="barChart" class="bar-chart"></div>
    </div>

    <!-- 明细表格 -->
    <div class="table-section">
      <div class="section-header">
        <h3 class="section-title">用电列表明细</h3>
        <el-button type="primary" size="small" icon="el-icon-download" @click="handleExport">导出</el-button>
      </div>
      
      <el-table v-if="tableData.length" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="occurDate" label="日期" min-width="120" />
        <el-table-column prop="useElec" label="总电量(度)" min-width="100">
          <template #default="{ row }">{{ formatNumber(row.useElec) }}</template>
        </el-table-column>
        <el-table-column prop="useElecPeak" label="尖电量(度)" min-width="100">
          <template #default="{ row }">{{ formatNumber(row.useElecPeak) }}</template>
        </el-table-column>
        <el-table-column prop="useElecTop" label="峰电量(度)" min-width="100">
          <template #default="{ row }">{{ formatNumber(row.useElecTop) }}</template>
        </el-table-column>
        <el-table-column prop="useElecFlat" label="平电量(度)" min-width="100">
          <template #default="{ row }">{{ formatNumber(row.useElecFlat) }}</template>
        </el-table-column>
        <el-table-column prop="useElecValley" label="谷电量(度)" min-width="100">
          <template #default="{ row }">{{ formatNumber(row.useElecValley) }}</template>
        </el-table-column>
      </el-table>
      
      <el-empty v-else description="暂无数据" />
    </div>
  </div>
</template>

<script>
import { statisticUse } from '@/api/subMetering'

const COLORS = {
  primary: '#2251F5',
  green: '#21E1D2',
  orange: '#FF8134',
  yellow: '#FEDC63',
  red: '#FE6363'
}

const PIE_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']

export default {
  name: 'TopStatistic',
  
  props: {
    timeRange: { type: Array, default: () => [] },
    checkedNode: { type: Object, default: () => ({}) },
    trigger: { type: Number, default: 0 }
  },
  
  data() {
    return {
      loading: false,
      statisticData: {},
      tableData: [],
      pieChartInstance: null,
      barChartInstance: null,
      statCards: [
        { 
          label: '总表用能（度）', 
          value: 0, 
          imgSrc: require('@/assets/images/szwyIcon1.jpg')
        },
        { 
          label: '子表总用能（度）', 
          value: 0, 
          imgSrc: require('@/assets/images/szwyIcon2.jpg')
        },
        { 
          label: '损耗率（%）', 
          value: 0, 
          imgSrc: require('@/assets/images/szwyIcon3.png')
        }
      ]
    }
  },
  
  watch: {
    trigger: {
      handler(val) {
        if (val > 0) this.fetchData()
      },
      immediate: true
    }
  },
  
  mounted() {
    this.initCharts()
    window.addEventListener('resize', this.handleResize)
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.disposeCharts()
  },
  
  methods: {
    disposeCharts() {
      if (this.pieChartInstance) {
        this.pieChartInstance.dispose()
        this.pieChartInstance = null
      }
      if (this.barChartInstance) {
        this.barChartInstance.dispose()
        this.barChartInstance = null
      }
    },
    
    initCharts() {
      this.$nextTick(() => {
        this.initPieChart()
        this.initBarChart()
      })
    },
    
    initPieChart() {
      this.$nextTick(() => {
        const el = this.$refs.pieChart
        if (!el) return
        
        // 先销毁旧实例
        if (this.pieChartInstance) {
          this.pieChartInstance.dispose()
          this.pieChartInstance = null
        }
        
        this.pieChartInstance = this.$echarts.init(el)
      })
    },
    
    initBarChart() {
      this.$nextTick(() => {
        const el = this.$refs.barChart
        if (!el) return
        
        if (this.barChartInstance) {
          this.barChartInstance.dispose()
          this.barChartInstance = null
        }
        
        this.barChartInstance = this.$echarts.init(el)
      })
    },
    
    async fetchData() {
      if (!this.timeRange || !this.timeRange[0]) {
        this.$message.warning('请选择查询时间范围')
        return
      }
      
      this.loading = true
      try {
        const params = {
          startDate: this.timeRange[0],
          endDate: this.timeRange[1],
          serial: this.checkedNode.subType ? this.checkedNode.serial : '',
          type: this.checkedNode.subType ? 'meter' : 'sub'
        }
        
        const { data } = await statisticUse(this.checkedNode, params)
        this.statisticData = data || {}
        this.processData()
      } catch (e) {
        this.$message.error('获取统计数据失败')
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    
    processData() {
      this.statCards[0].value = this.statisticData.mainUse || 0
      this.statCards[1].value = this.statisticData.subUse || 0
      this.statCards[2].value = this.statisticData.lossRate || 0
      this.tableData = this.statisticData.subUseList || []
      
      this.$nextTick(() => {
        // 非电表节点才更新饼图
        if (!this.checkedNode.subType) {
          if (!this.pieChartInstance) {
            this.initPieChart()
            // 等待初始化完成再更新
            this.$nextTick(() => {
              this.updatePieChart()
            })
          } else {
            this.pieChartInstance.resize()
            this.updatePieChart()
          }
        }
        
        // 更新柱状图
        if (!this.barChartInstance) {
          this.initBarChart()
          this.$nextTick(() => {
            this.updateBarChart()
          })
        } else {
          this.barChartInstance.resize()
          this.updateBarChart()
        }
      })
    },
    
    updatePieChart() {
      if (!this.pieChartInstance) return
      
      const pieData = this.statisticData.subUseRateList || []
      
      // 清除旧配置
      this.pieChartInstance.clear()
      
      if (!pieData.length) {
        this.pieChartInstance.setOption({
          title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } }
        })
        return
      }
      
      const seriesData = pieData.map((item, idx) => ({
        name: item.subName || '未命名',
        value: item.subUse || 0,
        itemStyle: { color: PIE_COLORS[idx % PIE_COLORS.length] }
      }))
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            return `${params.name}<br/>用量: ${params.value}<br/>占比: ${params.percent}%`
          }
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 10,
          top: 'middle',
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 8,
          textStyle: { fontSize: 12 },
          formatter: (name) => {
            const item = pieData.find(i => i.subName === name)
            const rate = item?.subUseRate ?? 0
            if (name.length > 6) {
              return `${name.slice(0, 6)}... ${rate}%`
            }
            return `${name} ${rate}%`
          },
          tooltip: { show: true }
        },
        series: [{
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['30%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
          },
          data: seriesData
        }]
      }
      
      this.pieChartInstance.setOption(option)
    },
    
    updateBarChart() {
      if (!this.barChartInstance) return
      
      const barData = this.statisticData.subUseList || []
      
      if (!barData.length) {
        this.barChartInstance.clear()
        this.barChartInstance.setOption({
          title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } }
        })
        return
      }
      
      const xAxisData = barData.map(item => item.occurDate)
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } }
        },
        legend: {
          show: true,
          right: 20,
          top: 10,
          data: ['总电量', '尖电量', '峰电量', '平电量', '谷电量']
        },
        grid: { top: 50, left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xAxisData,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#999' }
        },
        yAxis: {
          type: 'value',
          name: '电量(度)',
          nameTextStyle: { color: '#999' },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#999' },
          splitLine: { show: false }
        },
        series: [
          { name: '总电量', type: 'bar', barWidth: 8, itemStyle: { color: COLORS.primary }, data: barData.map(i => i.useElec) },
          { name: '尖电量', type: 'line', smooth: true, showSymbol: false, itemStyle: { color: COLORS.green }, data: barData.map(i => i.useElecPeak) },
          { name: '峰电量', type: 'line', smooth: true, showSymbol: false, itemStyle: { color: COLORS.orange }, data: barData.map(i => i.useElecTop) },
          { name: '平电量', type: 'line', smooth: true, showSymbol: false, itemStyle: { color: COLORS.yellow }, data: barData.map(i => i.useElecFlat) },
          { name: '谷电量', type: 'line', smooth: true, showSymbol: false, itemStyle: { color: COLORS.red }, data: barData.map(i => i.useElecValley) }
        ]
      }
      
      this.barChartInstance.setOption(option, true)
    },
    
    handleResize() {
      this.pieChartInstance?.resize()
      this.barChartInstance?.resize()
    },
    
    formatNumber(num) {
      if (num === null || num === undefined) return '-'
      return Number(num).toFixed(2)
    },
    
    handleExport() {
      if (!this.tableData.length) {
        this.$message.warning('暂无数据可导出')
        return
      }
      
      const headers = ['日期', '总电量(度)', '尖电量(度)', '峰电量(度)', '平电量(度)', '谷电量(度)']
      const rows = this.tableData.map(row => [row.occurDate, row.useElec, row.useElecPeak, row.useElecTop, row.useElecFlat, row.useElecValley])
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `用电列表明细_${this.timeRange[0]}_${this.timeRange[1]}.csv`
      link.click()
      this.$message.success('导出成功')
    },
    
    goToSankey() {
      this.$router.push('/energy/electricity-sankey')
    }
  }
}
</script>

<style lang="scss" scoped>
.top-statistic {
  min-height: 400px;
}

.stat-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 24px;
}

.stat-cards {
  display: flex;
  gap: 40px;
  flex: 1;
  min-width: 0;
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
    
    .stat-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      .icon-img {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }
    }
    
    .stat-info {
      .stat-label { font-size: 13px; color: #666; margin-bottom: 8px; white-space: nowrap; }
      .stat-value { font-size: 24px; font-weight: 600; color: #1c1c1c; }
    }
  }
}

.pie-section {
  position: relative;
  width: 350px;
  flex-shrink: 0;
  
  .sankey-btn {
    position: absolute;
    right: 0;
    top: -5px;
    z-index: 10;
    font-size: 12px;
  }
  
  .pie-chart {
    width: 350px;
    height: 180px;
  }
}

.chart-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  
  .bar-chart { width: 100%; height: 320px; }
}

.table-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    .section-title { font-size: 16px; font-weight: 500; color: #1c1c1c; margin: 0; }
  }
}
</style>