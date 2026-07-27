<template>
  <div class="cost-breakdown-chart" style="cursor: pointer;" @click="handleChartClick">
    <div class="chart-header">
      <div class="header-left">
        <div class="icon-box">
          <i class="el-icon-money"></i>
        </div>
        <div class="title-box">
          <div class="title-row">
            <h3>费用构成</h3>
            <span class="range-tip">当年（截至昨日）</span>
          </div>
          <p>成本结构分析</p>
        </div>
      </div>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { mapGetters } from 'vuex'
import moment from 'moment'
import { getTenantFeeComposition, isDemoManager } from '@/api/newDashboard'

export default {
  name: 'CostBreakdownChart',
  data () {
    return {
      chart: null
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId'])
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
      if (this.chart || !this.$refs.chartRef) return
      this.chart = echarts.init(this.$refs.chartRef)

      this.chart.on('click', (params) => {
        if (params.componentType === 'series') {
          this.$router.push('/metering/bill/energy-bill-tenant')
        }
      })
    },
    buildOption (feeDto) {
      const dto = feeDto || {}
      const elecFee = Number(dto.elecFee || 0)
      const airFee = Number(dto.airFee || 0)
      const waterFee = Number(dto.waterFee || 0)
      const otherFee = Number(dto.otherFee || 0)

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter: (p) => {
            const v = Number(p.value || 0)
            const valueText = `¥${v.toLocaleString()}`
            const pct = typeof p.percent === 'number' ? `${p.percent}%` : ''
            return `${p.name}: ${valueText}${pct ? ` (${pct})` : ''}`
          }
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          itemGap: 8,
          textStyle: { color: '#64748B', fontSize: 10 },
          itemWidth: 10,
          itemHeight: 10
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 4,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              fontSize: 10,
              color: '#334155',
              formatter: (p) => {
                const pct = typeof p.percent === 'number' ? `${p.percent}%` : '0%'
                return `${p.name}\n${pct}`
              }
            },
            labelLine: {
              show: true,
              length: 10,
              length2: 8,
              lineStyle: { color: '#CBD5E1' }
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 11,
                fontWeight: 'bold',
                formatter: (p) => {
                  const pct = typeof p.percent === 'number' ? `${p.percent}%` : '0%'
                  return `${p.name}\n${pct}`
                }
              }
            },
            data: [
              { value: elecFee, name: '电费', itemStyle: { color: '#0EA5E9' } },
              { value: airFee, name: '空调费', itemStyle: { color: '#14B8A6' } },
              { value: waterFee, name: '水费', itemStyle: { color: '#93C5FD' } },
              { value: otherFee, name: '其他', itemStyle: { color: '#CBD5E1' } }
            ]
          }
        ]
      }

      return option
    },
    handleResize () {
      this.chart && this.chart.resize()
    },
    handleChartClick () {
      this.$router.push('/metering/bill/energy-bill-tenant')
    },
    makeDemoDto () {
      return { elecFee: 6800, airFee: 1800, waterFee: 800, otherFee: 600 }
    },
    async fetchData () {
      if (!this.currentManagerId) {
        await this.$nextTick()
        this.ensureChart()
        if (this.chart) this.chart.setOption(this.buildOption({}), true)
        return
      }

      await this.$nextTick()
      this.ensureChart()
      if (!this.chart) return

      if (isDemoManager(this.currentManagerId)) {
        this.chart.setOption(this.buildOption(this.makeDemoDto()), true)
        return
      }

      const end = moment().subtract(1, 'day')
      const begin = end.clone().startOf('year')
      const res = await getTenantFeeComposition({
        beginTime: begin.format('YYYY-MM-DD'),
        endTime: end.format('YYYY-MM-DD'),
        managerId: this.currentManagerId
      }).catch(() => null)

      this.chart.setOption(this.buildOption(res && res.data ? res.data : {}), true)
    }
  }
}
</script>

<style lang="scss" scoped>
.cost-breakdown-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: center;
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
    background: #D1FAE5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 16px;
      color: #059669;
    }
  }

  .title-box {
    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    .range-tip {
      font-size: 10px;
      color: #64748B;
      padding: 2px 6px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.12);
      border: 1px solid rgba(226, 232, 240, 0.9);
      line-height: 14px;
      white-space: nowrap;
      flex-shrink: 0;
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
  padding: 8px;
}
</style>
