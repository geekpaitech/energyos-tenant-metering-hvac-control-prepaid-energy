<template>
  <energy-panel title="用电趋势" period="近7日">
    <template #meta>
      <span class="panel-meta">总用电量：<b>{{ money(data.total) }}</b> 度</span>
    </template>
    <e-chart-host ref="chart" :option="option" aria-label="近7日用电量柱线图" />
  </energy-panel>
</template>

<script>
import EnergyPanel from '../EnergyPanel.vue'
import EChartHost from '../EChartHost.vue'
import { createTrendOption } from '../../utils/chartOptions'

export default {
  name: 'EnergyTrendCard',
  components: { EnergyPanel, EChartHost },
  props: { data: { type: Object, required: true } },
  computed: { option () { return createTrendOption(this.data) } },
  methods: {
    resize () { if (this.$refs.chart) this.$refs.chart.resize() },
    money (value) {
      if (value === null || value === undefined || value === '') return '--'
      const number = Number(value)
      return Number.isFinite(number) ? number.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'
    }
  }
}
</script>
