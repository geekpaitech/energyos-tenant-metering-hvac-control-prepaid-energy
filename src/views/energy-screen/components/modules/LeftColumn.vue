<template>
  <section class="energy-column energy-column--left">
    <trend-card ref="trendCard" :data="trend" :period="period" />
    <structure-card ref="structureCard" :data="structure" />
    <cost-card ref="costCard" :data="costs" />
  </section>
</template>

<script>
import TrendCard from '../cards/TrendCard.vue'
import StructureCard from '../cards/StructureCard.vue'
import CostCard from '../cards/CostCard.vue'

export default {
  name: 'EnergyLeftColumn',
  components: { TrendCard, StructureCard, CostCard },
  props: {
    trend: { type: Object, required: true },
    structure: { type: Object, required: true },
    costs: { type: Object, required: true },
    period: { type: String, default: 'day' }
  },
  methods: {
    resizeCharts () {
      ;['trendCard', 'structureCard', 'costCard'].forEach(ref => {
        const chart = this.$refs[ref]
        if (chart) chart.resize()
      })
    }
  }
}
</script>
