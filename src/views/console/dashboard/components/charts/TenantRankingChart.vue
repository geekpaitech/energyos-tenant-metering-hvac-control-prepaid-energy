<template>
  <div class="tenant-ranking-chart" style="cursor: pointer;" @click="handleChartClick">
    <div class="chart-header">
      <div class="header-left">
        <div class="icon-box">
          <i class="el-icon-user"></i>
        </div>
        <div class="title-box">
          <h3>租户欠费排行</h3>
          <p>Top 5 租户欠费</p>
        </div>
      </div>
      <el-tag size="mini" type="danger">{{ totalArrears }}元</el-tag>
    </div>
    <div class="chart-body">
      <div ref="chartRef" class="chart-container" v-show="!shouldShowEmpty"></div>
      <div v-show="shouldShowEmpty" class="chart-empty">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>暂无欠费数据</span>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { mapGetters } from 'vuex'
import { getTenantStatusList, isDemoManager } from '@/api/newDashboard'
export default {
  name: 'TenantRankingChart',
  data () {
    return {
      chart: null,
      chart: null,
      loading: false,
      tenants: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    totalArrears () {
      return this.tenants.reduce((sum, t) => sum + (t.amount || 0), 0)
        .toLocaleString()
    },
    shouldShowEmpty () {
      return !this.loading && (!this.tenants || this.tenants.length === 0)
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
          this.$router.push('/metering/tenant/card')
        }
      })
    },
    renderChart () {
      if (this.shouldShowEmpty) {
        if (this.chart) this.chart.clear()
        return
      }

      this.ensureChart()
      if (!this.chart) return
      const names = this.tenants.map(t => t.name)
      const values = this.tenants.map(t => t.amount)
      const colors = this.tenants.map(() => '#B91C1C')
      const option = {
        grid: { left: 16, right: 16, top: 16, bottom: 20, containLabel: true },
        xAxis: {
          type: 'value',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: { color: '#64748B', fontSize: 10, formatter: v => '¥' + (v / 1000) + 'k' }
        },
        yAxis: {
          type: 'category',
          data: names,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748B', fontSize: 11, width: 110, overflow: 'truncate', margin: 10 }
        },
        series: [{
          type: 'bar',
          data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: [4, 4, 4, 4] } })),
          barWidth: 16,
          label: {
            show: true,
            position: 'right',
            formatter: p => '¥' + p.value.toLocaleString(),
            color: '#475569',
            fontSize: 11
          }
        }]
      }
      this.chart.setOption(option)
    },
    async fetchData () {
      if (!this.currentManagerId) {
        this.tenants = []
        this.renderChart()
        return
      }

      this.loading = true
      try {
        if (isDemoManager(this.currentManagerId)) {
          this.tenants = [
            { id: 1, name: 'A3号楼·制造车间', amount: 128000, status: '欠费' },
            { id: 2, name: 'B2号楼·冷链仓', amount: 102500, status: '欠费' },
            { id: 3, name: '研发中心·实验室', amount: 84500, status: '欠费' },
            { id: 4, name: '智慧园区·孵化器', amount: 69200, status: '欠费' },
            { id: 5, name: '综合楼·办公区', amount: 53400, status: '欠费' }
          ]
          await this.$nextTick()
          this.renderChart()
          return
        }
        const res = await getTenantStatusList({ managerId: this.currentManagerId }).catch(() => ({}))
        const raw = res && res.code === 200 ? res.data : []
        const list = Array.isArray(raw) ? raw : (raw && raw.tenantStatusList ? raw.tenantStatusList : [])

        this.tenants = (Array.isArray(list) ? list : [])
          .filter((i) => (i.tenantBalance || 0) < 0)
          .sort((a, b) => (a.tenantBalance || 0) - (b.tenantBalance || 0))
          .slice(0, 5)
          .map((i, idx) => ({
            id: i.tenantId || i.id || idx,
            name: i.tenantName || i.name || '-',
            amount: Math.abs(+(i.tenantBalance || 0)),
            status: '欠费'
          }))

        await this.$nextTick()
        this.renderChart()
      } catch (e) {
        this.tenants = []
        this.renderChart()
      } finally {
        this.loading = false
      }
    },
    handleResize () {
      this.chart && this.chart.resize()
    },
    handleChartClick () {
      this.$router.push('/metering/tenant/list')
    }
  }
}
</script>

<style lang="scss" scoped>
.tenant-ranking-chart {
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
    background: #EDE9FE;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 16px;
      color: #7C3AED;
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
  padding: 10px 8px 16px;
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
