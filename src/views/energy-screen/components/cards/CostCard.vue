<template>
  <energy-panel title="费用构成" class="is-drillable" @click.native="handleDrilldown">
    <div class="cost-card">
      <div class="cost-card__chart">
        <e-chart-host ref="chart" :option="option" aria-label="近7日费用构成环形图" />
      </div>
      <div class="cost-card__rows">
        <div v-for="item in data.items" :key="item.name" class="cost-row">
          <span class="cost-row__dot" :style="{ backgroundColor: item.color }" />
          <span class="cost-row__name">{{ item.name }}</span>
          <span class="cost-row__bar"><i :style="{ width: item.value == null ? '0%' : `${Math.max(item.percent, 4)}%`, backgroundColor: item.color }" /></span>
          <span class="cost-row__amount">¥{{ money(item.value) }}</span>
          <span class="cost-row__percent">{{ item.percent }}%</span>
        </div>
        <div class="cost-row cost-row--total">
          <span>合计</span><b>¥{{ money(data.total) }}</b><b>100%</b>
        </div>
      </div>
    </div>
  </energy-panel>
</template>

<script>
import EnergyPanel from '../EnergyPanel.vue'
import EChartHost from '../EChartHost.vue'
import { createCostOption } from '../../utils/chartOptions'

export default {
  name: 'EnergyCostCard',
  components: { EnergyPanel, EChartHost },
  inject: ['energyScreenDrilldown'],
  props: { data: { type: Object, required: true } },
  computed: { option () { return createCostOption(this.data) } },
  methods: {
    resize () { if (this.$refs.chart) this.$refs.chart.resize() },
    money (value) {
      if (value === null || value === undefined || value === '') return '--'
      const number = Number(value)
      return Number.isFinite(number) ? number.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'
    },
    handleDrilldown () { this.energyScreenDrilldown('consumption-bill') }
  }
}
</script>
