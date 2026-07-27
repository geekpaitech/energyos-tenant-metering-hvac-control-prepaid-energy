<template>
  <div class="power-ranking-chart" style="cursor: pointer;" @click="handleChartClick">
    <div class="chart-header">
      <div class="header-left">
        <div class="icon-box">
          <i class="el-icon-trophy"></i>
        </div>
        <div class="title-box">
          <h3>本月功率排名</h3>
          <p>Top 5 高功率区域</p>
        </div>
      </div>
      <el-tag size="mini" type="warning">本月</el-tag>
    </div>
    <div class="chart-body">
      <div ref="chartRef" class="chart-container" v-show="!shouldShowEmpty"></div>
      <div v-show="shouldShowEmpty" class="chart-empty">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3v18h18" />
          <path d="M7 14l3-3 3 3 4-6" />
        </svg>
        <span>暂无数据</span>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { mapGetters } from 'vuex'
import { getTenantPList, isDemoManager } from '@/api/newDashboard'

export default {
  name: 'PowerRankingChart',
  data () {
    return {
      chart: null,
      loading: false,
      data: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    shouldShowEmpty () {
      return !this.loading && (!this.data || this.data.length === 0)
    }
  },
  watch: {
    currentManagerId: {
      handler () {
        this.fetchData()
      },
      immediate: true
    }
  },
  mounted () {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    ensureChart () {
      if (this.chart) return
      const el = this.$refs.chartRef
      if (!el) return
      this.chart = echarts.init(el)

      this.chart.on('click', (params) => {
        if (params.componentType === 'series') {
          this.$router.push('/energy/equipmentPower')
        }
      })
    },
    buildOption () {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter: (params) => {
            const p = params[0]
            return `<div style="font-weight:600;font-size:12px">${p.name}</div>
                    <div style="color:#64748B;font-size:11px">功率: ${p.value} kW</div>`
          }
        },
        grid: {
          left: 95,
          right: 50,
          top: 10,
          bottom: 24
        },
        xAxis: {
          type: 'value',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: { color: '#64748B', fontSize: 9, formatter: v => v + 'kW' }
        },
        yAxis: {
          type: 'category',
          data: this.data.map((d, i) => `${i + 1}. ${d.name}`).reverse(),
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#475569', fontSize: 10, width: 85, overflow: 'truncate' },
          axisTick: { show: false }
        },
        series: [
          {
            type: 'bar',
            data: this.data.map((d, i) => ({
              value: d.value,
              itemStyle: {
                color: i === 0 ? '#0369A1' : '#0EA5E9',
                borderRadius: [0, 3, 3, 0]
              }
            })).reverse(),
            barWidth: 18,
            label: {
              show: true,
              position: 'right',
              formatter: p => p.value + 'kW',
              color: '#64748B',
              fontSize: 9
            }
          }
        ]
      }

      return option
    },
    renderChart () {
      if (this.shouldShowEmpty) {
        if (this.chart) this.chart.clear()
        return
      }
      this.ensureChart()
      if (this.chart) this.chart.setOption(this.buildOption(), true)
    },
    async fetchData () {
      if (!this.currentManagerId) {
        this.data = []
        this.renderChart()
        return
      }

      this.loading = true
      try {
        if (isDemoManager(this.currentManagerId)) {
          this.data = [
            { name: 'A3号楼·制造车间', value: 128 },
            { name: 'B2号楼·冷链仓', value: 116 },
            { name: '研发中心·实验室', value: 109 },
            { name: '智慧园区·孵化器', value: 98 },
            { name: '综合楼·办公区', value: 92 }
          ]
          await this.$nextTick()
          this.renderChart()
          return
        }
        const res = await getTenantPList({ managerId: this.currentManagerId }).catch(() => ({}))
        const list = res && res.code === 200 ? (res.data || []) : []

        const normalized = (Array.isArray(list) ? list : [])
          .map((i) => ({
            name: i.tenantName || i.name || '-',
            value: +(i.p || i.value || 0)
          }))
          .filter(i => i.name && typeof i.value === 'number' && !Number.isNaN(i.value))
          .slice(0, 5)

        this.data = normalized
        await this.$nextTick()
        this.renderChart()
      } catch (e) {
        this.data = []
        this.renderChart()
      } finally {
        this.loading = false
      }
    },
    handleResize () {
      this.chart && this.chart.resize()
    },
    handleChartClick () {
      this.$router.push('/energy/equipmentPower')
    }
  }
}
</script>

<style lang="scss" scoped>
.power-ranking-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F1F5F9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icon-box {
    width: 32px;
    height: 32px;
    background: #FEF3C7;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 16px;
      color: #D97706;
    }
  }

  .title-box {
    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    p {
      font-size: 10px;
      color: #94A3B8;
      margin: 2px 0 0;
    }
  }
}

.chart-container {
  flex: 1;
  height: 100%;
  min-height: 0;
  padding: 8px;
}

.chart-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #94A3B8;
  background: rgba(248, 250, 252, 0.7);
  border: 1px dashed rgba(226, 232, 240, 1);
  border-radius: 10px;

  svg {
    opacity: 0.9;
  }

  span {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }
}
</style>
