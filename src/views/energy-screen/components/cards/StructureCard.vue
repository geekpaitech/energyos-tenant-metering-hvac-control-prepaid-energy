<template>
  <energy-panel title="分项能耗结构" period="近7日">
    <e-chart-host ref="chart" :option="option" aria-label="近7日租户与公区能耗环形图" />
  </energy-panel>
</template>

<script>
import EnergyPanel from '../EnergyPanel.vue'
import EChartHost from '../EChartHost.vue'
import { createStructureOption } from '../../utils/chartOptions'

export default {
  name: 'EnergyStructureCard',
  components: { EnergyPanel, EChartHost },
  props: { data: { type: Object, required: true } },
  computed: { option () { return createStructureOption(this.data) } },
  methods: { resize () { if (this.$refs.chart) this.$refs.chart.resize() } }
}
</script>
